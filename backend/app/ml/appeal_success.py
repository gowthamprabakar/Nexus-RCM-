"""
Appeal Success Probability Model

Predicts the likelihood that a denial appeal will be successful,
using a GradientBoostingClassifier trained on historical appeal outcomes.
"""

import os
import logging
from datetime import date
from typing import Any, Optional

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Encoding maps
# ---------------------------------------------------------------------------

DENIAL_CATEGORY_MAP: dict[str, int] = {
    "CODING": 0,
    "ELIGIBILITY": 1,
    "AUTHORIZATION": 2,
    "TIMELY_FILING": 3,
    "MEDICAL_NECESSITY": 4,
    "DUPLICATE": 5,
    "COB": 6,
    "DOCUMENTATION": 7,
    "CONTRACT": 8,
    "OTHER": 9,
}

ROOT_CAUSE_MAP: dict[str, int] = {
    "ELIGIBILITY_LAPSE": 0,
    "AUTH_MISSING": 1,
    "AUTH_EXPIRED": 2,
    "CODING_MISMATCH": 3,
    "TIMELY_FILING_MISS": 4,
    "COB_ORDER_ERROR": 5,
    "CONTRACT_RATE_GAP": 6,
    "DOCUMENTATION_DEFICIT": 7,
    "PROCESS_BREAKDOWN": 8,
    "PAYER_BEHAVIOR_SHIFT": 9,
    "PROVIDER_ENROLLMENT": 10,
}

FEATURE_NAMES = [
    "payer_appeal_win_rate",
    "root_cause",
    "denial_category",
    "carc_code",
    "denial_amount",
    "days_denial_to_submission",
    "root_cause_confidence",
    "financial_impact",
    "payer_denial_rate",
    "has_documentation",
    "similar_appeal_win_rate",
]

# Default model artifact path
DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "artifacts", "appeal_success_model.joblib"
)

# ---------------------------------------------------------------------------
# SQL queries
# ---------------------------------------------------------------------------

TRAINING_DATA_SQL = """
SELECT
    a.appeal_id,
    a.denial_id,
    a.outcome,
    d.denial_category,
    d.carc_code,
    d.denial_amount,
    d.denial_date,
    a.submitted_date,
    rca.primary_root_cause,
    rca.confidence_score,
    rca.financial_impact,
    pm.denial_rate         AS payer_denial_rate,
    pm.avg_appeal_win_rate AS payer_appeal_win_rate
FROM appeals a
JOIN denials d            ON d.denial_id  = a.denial_id
JOIN claims c             ON c.claim_id   = d.claim_id
LEFT JOIN root_cause_analysis rca ON rca.denial_id = d.denial_id
LEFT JOIN payer_master pm ON pm.payer_id  = c.payer_id
WHERE a.outcome IN ('WON', 'LOST', 'PARTIAL')
"""

SIMILAR_WIN_RATE_SQL = """
SELECT
    rca.primary_root_cause,
    COUNT(*) FILTER (WHERE a.outcome IN ('WON', 'PARTIAL'))::float
        / NULLIF(COUNT(*), 0) AS win_rate
FROM appeals a
JOIN denials d ON d.denial_id = a.denial_id
LEFT JOIN root_cause_analysis rca ON rca.denial_id = d.denial_id
WHERE a.outcome IN ('WON', 'LOST', 'PARTIAL')
GROUP BY rca.primary_root_cause
"""

DENIAL_PREDICTION_SQL = """
SELECT
    d.denial_id,
    d.denial_category,
    d.carc_code,
    d.denial_amount,
    d.denial_date,
    rca.primary_root_cause,
    rca.confidence_score,
    rca.financial_impact,
    pm.denial_rate         AS payer_denial_rate,
    pm.avg_appeal_win_rate AS payer_appeal_win_rate
FROM denials d
JOIN claims c             ON c.claim_id   = d.claim_id
LEFT JOIN root_cause_analysis rca ON rca.denial_id = d.denial_id
LEFT JOIN payer_master pm ON pm.payer_id  = c.payer_id
WHERE d.denial_id = :denial_id
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

CARC_GROUP_MAP = {
    "CO-4": 0, "CO-97": 0,
    "CO-16": 1, "CO-242": 1,
    "CO-18": 2,
    "CO-22": 3,
    "CO-29": 4,
    "CO-45": 5, "CO-50": 5, "CO-96": 5,
    "CO-27": 6,
    "CO-197": 7,
    "PR-1": 8, "PR-2": 8, "PR-3": 8,
}

def _encode_carc(code):
    if not code:
        return -1
    return CARC_GROUP_MAP.get(str(code).upper(), 9)


def _encode_denial_category(cat: Optional[str]) -> int:
    if not cat:
        return DENIAL_CATEGORY_MAP.get("OTHER", 9)
    # Try exact match first, then try prefix-based match
    upper = cat.upper().strip()
    if upper in DENIAL_CATEGORY_MAP:
        return DENIAL_CATEGORY_MAP[upper]
    for key, val in DENIAL_CATEGORY_MAP.items():
        if key in upper or upper in key:
            return val
    return DENIAL_CATEGORY_MAP["OTHER"]


def _encode_root_cause(rc: Optional[str]) -> int:
    if not rc:
        return -1
    upper = rc.upper().strip()
    return ROOT_CAUSE_MAP.get(upper, -1)


def _days_between(d1: Optional[date], d2: Optional[date]) -> int:
    if d1 is None or d2 is None:
        return 0
    return abs((d2 - d1).days)


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

class AppealSuccessModel:
    """
    GradientBoosting classifier that predicts appeal success probability.
    """

    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self.model: Optional[GradientBoostingClassifier] = None
        self.is_trained = False
        self.training_metrics: dict[str, Any] = {}

    @property
    def is_fitted(self) -> bool:
        """Alias for is_trained — keeps API consistent with DenialProbabilityModel."""
        return self.is_trained

    # ------------------------------------------------------------------
    # Train
    # ------------------------------------------------------------------

    async def train(self, db: AsyncSession) -> dict[str, Any]:
        """
        Train the model on historical appeal outcomes from the database.

        Returns a dict of training metrics.
        """
        logger.info("Fetching training data from appeals table ...")

        # 1. Fetch appeal rows
        result = await db.execute(text(TRAINING_DATA_SQL))
        rows = result.fetchall()

        if not rows:
            raise ValueError("No resolved appeals found in the database for training.")

        logger.info("Fetched %d appeal records", len(rows))

        # 2. Fetch similar-root-cause win rates
        wr_result = await db.execute(text(SIMILAR_WIN_RATE_SQL))
        win_rates_by_rc = {
            row[0]: (row[1] if row[1] is not None else 0.0)
            for row in wr_result.fetchall()
        }

        # 3. Build feature matrix
        X_list: list[list[float]] = []
        y_list: list[int] = []

        for row in rows:
            (
                appeal_id,
                denial_id,
                outcome,
                denial_category,
                carc_code,
                denial_amount,
                denial_date,
                submitted_date,
                primary_root_cause,
                confidence_score,
                financial_impact,
                payer_denial_rate,
                payer_appeal_win_rate,
            ) = row

            features = [
                float(payer_appeal_win_rate or 0.0),
                float(_encode_root_cause(primary_root_cause)),
                float(_encode_denial_category(denial_category)),
                float(_encode_carc(carc_code)),
                float(denial_amount or 0.0),
                float(_days_between(denial_date, submitted_date)),
                float(confidence_score or 0),
                float(financial_impact or 0.0),
                float(payer_denial_rate or 0.0),
                1.0 if primary_root_cause else 0.0,  # has_documentation proxy
                float(win_rates_by_rc.get(primary_root_cause, 0.0)),
            ]
            X_list.append(features)
            y_list.append(1 if outcome in ("WON", "PARTIAL") else 0)

        X = np.array(X_list, dtype=np.float64)
        y = np.array(y_list, dtype=np.int32)

        logger.info(
            "Training set: %d samples, %d positive (%.1f%%)",
            len(y),
            y.sum(),
            100.0 * y.sum() / len(y),
        )

        # 4. Split & train
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if y.sum() >= 2 else None
        )

        from sklearn.model_selection import StratifiedKFold, cross_val_score
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_auc_scores = cross_val_score(
            GradientBoostingClassifier(n_estimators=200, max_depth=4, learning_rate=0.1,
                                       subsample=0.8, min_samples_leaf=5, random_state=42),
            X, y, cv=cv, scoring="roc_auc", n_jobs=-1
        )

        clf = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            min_samples_leaf=5,
            random_state=42,
        )
        clf.fit(X_train, y_train)

        # 5. Evaluate
        y_proba = clf.predict_proba(X_test)[:, 1]
        try:
            auc = roc_auc_score(y_test, y_proba)
        except ValueError:
            auc = None  # single-class edge case

        report = classification_report(y_test, clf.predict(X_test), output_dict=True)

        self.model = clf
        self.is_trained = True
        self.training_metrics = {
            "samples": len(y),
            "train_samples": len(y_train),
            "test_samples": len(y_test),
            "positive_rate": float(y.mean()),
            "auc_roc": auc,
            "cv_auc_mean": round(float(cv_auc_scores.mean()), 4),
            "cv_auc_std": round(float(cv_auc_scores.std()), 4),
            "classification_report": report,
            "feature_importances": dict(zip(FEATURE_NAMES, clf.feature_importances_.tolist())),
        }

        logger.info("Training complete — AUC: %s", auc)
        self.save()

        return self.training_metrics

    # ------------------------------------------------------------------
    # Predict (from a dict)
    # ------------------------------------------------------------------

    def predict(self, features_dict: dict[str, Any]) -> dict[str, Any]:
        """
        Predict appeal success from a pre-built feature dict.

        Parameters
        ----------
        features_dict : dict with keys matching FEATURE_NAMES

        Returns
        -------
        dict with probability, recommendation, contributing_factors
        """
        if self.model is None:
            self.load()
        if self.model is None:
            raise RuntimeError("Model not trained or loaded. Call train() or load() first.")

        feature_vector = np.array(
            [[float(features_dict.get(f, 0.0)) for f in FEATURE_NAMES]],
            dtype=np.float64,
        )

        probability = float(self.model.predict_proba(feature_vector)[0][1])

        # Recommendation thresholds
        if probability >= 0.65:
            recommendation = "APPEAL"
        elif probability >= 0.35:
            recommendation = "NEGOTIATE"
        else:
            recommendation = "WRITE_OFF"

        # Contributing factors — top features by importance
        importances = self.model.feature_importances_
        indexed = sorted(
            enumerate(importances), key=lambda x: x[1], reverse=True
        )
        contributing_factors = []
        for idx, imp in indexed[:5]:
            contributing_factors.append(
                {
                    "feature": FEATURE_NAMES[idx],
                    "importance": round(float(imp), 4),
                    "value": float(feature_vector[0][idx]),
                }
            )

        return {
            "probability": round(probability, 4),
            "recommendation": recommendation,
            "contributing_factors": contributing_factors,
        }

    # ------------------------------------------------------------------
    # Predict for a specific denial
    # ------------------------------------------------------------------

    async def predict_denial(
        self, db: AsyncSession, denial_id: str
    ) -> dict[str, Any]:
        """
        Build features for a specific denial from the database and predict.
        """
        result = await db.execute(
            text(DENIAL_PREDICTION_SQL), {"denial_id": denial_id}
        )
        row = result.fetchone()
        if row is None:
            raise ValueError(f"Denial {denial_id} not found.")

        (
            _denial_id,
            denial_category,
            carc_code,
            denial_amount,
            denial_date,
            primary_root_cause,
            confidence_score,
            financial_impact,
            payer_denial_rate,
            payer_appeal_win_rate,
        ) = row

        # Fetch similar-root-cause win rate
        similar_wr = 0.0
        if primary_root_cause:
            wr_result = await db.execute(
                text(
                    """
                    SELECT
                        COUNT(*) FILTER (WHERE a.outcome IN ('WON', 'PARTIAL'))::float
                            / NULLIF(COUNT(*), 0)
                    FROM appeals a
                    JOIN denials d ON d.denial_id = a.denial_id
                    LEFT JOIN root_cause_analysis rca ON rca.denial_id = d.denial_id
                    WHERE a.outcome IN ('WON', 'LOST', 'PARTIAL')
                      AND rca.primary_root_cause = :rc
                    """
                ),
                {"rc": primary_root_cause},
            )
            wr_row = wr_result.fetchone()
            if wr_row and wr_row[0] is not None:
                similar_wr = float(wr_row[0])

        days_since = _days_between(denial_date, date.today())

        features_dict = {
            "payer_appeal_win_rate": float(payer_appeal_win_rate or 0.0),
            "root_cause": float(_encode_root_cause(primary_root_cause)),
            "denial_category": float(_encode_denial_category(denial_category)),
            "carc_code": float(_encode_carc(carc_code)),
            "denial_amount": float(denial_amount or 0.0),
            "days_denial_to_submission": float(days_since),
            "root_cause_confidence": float(confidence_score or 0),
            "financial_impact": float(financial_impact or 0.0),
            "payer_denial_rate": float(payer_denial_rate or 0.0),
            "has_documentation": 1.0 if primary_root_cause else 0.0,
            "similar_appeal_win_rate": similar_wr,
        }

        prediction = self.predict(features_dict)
        prediction["denial_id"] = denial_id
        prediction["features"] = features_dict
        return prediction

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, path: Optional[str] = None) -> str:
        """Save the trained model to disk via joblib."""
        save_path = path or self.model_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        joblib.dump(
            {
                "model": self.model,
                "feature_names": FEATURE_NAMES,
                "training_metrics": self.training_metrics,
            },
            save_path,
        )
        logger.info("Model saved to %s", save_path)
        return save_path

    def load(self, path: Optional[str] = None) -> None:
        """Load a previously trained model from disk."""
        load_path = path or self.model_path
        if not os.path.exists(load_path):
            raise FileNotFoundError(f"No model artifact at {load_path}")
        data = joblib.load(load_path)
        self.model = data["model"]
        self.training_metrics = data.get("training_metrics", {})
        self.is_trained = True
        logger.info("Model loaded from %s", load_path)


# ---------------------------------------------------------------------------
# Convenience: standalone training entry-point
# ---------------------------------------------------------------------------

async def train_model() -> dict[str, Any]:
    """
    Standalone helper to train the model using a fresh DB session.
    Can be called from a management script or an API endpoint.
    """
    from app.core.config import settings

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    model = AppealSuccessModel()
    async with async_session() as session:
        metrics = await model.train(session)

    await engine.dispose()
    return metrics
