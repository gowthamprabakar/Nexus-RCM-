"""
Denial Probability Prediction Model
====================================
Predicts the probability that a claim will be denied BEFORE submission.
Uses sklearn GradientBoostingClassifier with 25+ engineered features
drawn from claims, payer history, prior-auth status, eligibility, and
provider denial patterns.

Usage:
    from app.ml.denial_probability import DenialProbabilityModel

    model = DenialProbabilityModel()
    metrics = await model.train(db)            # train from DB
    result  = model.predict(features_dict)     # single prediction
    result  = await model.predict_claim(db, "CLM-00001")
"""

from __future__ import annotations

import logging
import os
from abc import ABC, abstractmethod
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature catalogue (order matters — must match training matrix)
# ---------------------------------------------------------------------------
FEATURE_NAMES: List[str] = [
    "payer_denial_rate",
    "crs_score",
    "total_charges",
    "has_prior_auth",
    "prior_auth_status",
    "provider_denial_rate_90d",
    "payer_cpt_denial_rate",
    "claim_line_count",
    "has_modifier",
    "days_to_submit",
    "payer_adtp_days",
    "eligibility_status",
    "charge_per_line",
    "is_high_value",
    "specialty_encoded",
    "denial_category_history_count",
    "payer_group_encoded",
    "day_of_week_submitted",
    "month_of_service",
    "similar_carc_90d",
    "deductible_remaining",
    "oop_remaining",
    "network_status_encoded",
    "claim_type_encoded",
    "crs_eligibility_pts",
]

PRIOR_AUTH_STATUS_MAP = {
    "APPROVED": 0,
    "PENDING": 1,
    "DENIED": 2,
    "EXPIRED": 3,
    None: 4,
    "NONE": 4,
}

ELIGIBILITY_STATUS_MAP = {
    "ACTIVE": 0,
    "INACTIVE": 1,
    "TERMINATED": 2,
    "NOT_FOUND": 3,
    None: 3,
}

PAYER_GROUP_MAP = {
    "G1_FEDERAL_FFS": 0,
    "G2_MEDICARE_ADVANTAGE": 1,
    "G3_COMMERCIAL_NATIONAL": 2,
    "G4_COMMERCIAL_REGIONAL": 3,
    "G5_MANAGED_MEDICAID": 4,
    "G6_STATE_MEDICAID": 5,
    "G7_WORKERS_COMP_AUTO": 6,
    "G8_SELF_PAY_SECONDARY": 7,
}

NETWORK_STATUS_MAP = {"IN": 0, "OUT": 1, "UNKNOWN": 2, None: 2}
CLAIM_TYPE_MAP = {"PROFESSIONAL": 0, "INSTITUTIONAL": 1}

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_PATH = MODEL_DIR / "denial_probability.joblib"


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------
class BaseMLModel(ABC):
    """Minimal contract every ML model in the prediction layer must honour."""

    @abstractmethod
    async def train(self, db: AsyncSession) -> Dict[str, Any]:
        ...

    @abstractmethod
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        ...

    @abstractmethod
    def save(self, path: Optional[str] = None) -> str:
        ...

    @abstractmethod
    def load(self, path: Optional[str] = None) -> None:
        ...


# ---------------------------------------------------------------------------
# Implementation
# ---------------------------------------------------------------------------
class DenialProbabilityModel(BaseMLModel):
    """
    Pre-submission denial probability predictor.

    * ``train(db)``         — pull labelled data, fit model, return metrics
    * ``predict(features)`` — score a single feature dict
    * ``predict_claim(db, claim_id)`` — extract features + score one claim
    * ``save()`` / ``load()`` — persist via joblib
    """

    def __init__(self) -> None:
        self.model = None
        self.feature_names: List[str] = FEATURE_NAMES
        self.is_fitted: bool = False

    # ------------------------------------------------------------------
    # TRAIN
    # ------------------------------------------------------------------
    async def train(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Pull training rows (DENIED=1, PAID=0) from PostgreSQL, build the
        25-feature matrix, fit a GradientBoostingClassifier, and return
        evaluation metrics.
        """
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.metrics import accuracy_score, roc_auc_score
        from sklearn.model_selection import train_test_split

        logger.info("DenialProbabilityModel.train — pulling training data")

        query = text(self._training_query())
        result = await db.execute(query)
        rows = result.fetchall()

        if not rows:
            raise ValueError(
                "No training data found. Ensure claims with status "
                "DENIED or PAID exist in the database."
            )

        columns = list(result.keys())
        data = [dict(zip(columns, row)) for row in rows]

        X, y = self._build_matrix(data)

        logger.info(
            "Training set: %d samples (%d denied, %d paid)",
            len(y),
            int(np.sum(y)),
            int(np.sum(y == 0)),
        )

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        from sklearn.model_selection import StratifiedKFold, cross_val_score
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_auc_scores = cross_val_score(
            GradientBoostingClassifier(n_estimators=200, max_depth=5, learning_rate=0.1,
                                       subsample=0.8, min_samples_leaf=5, random_state=42),
            X, y, cv=cv, scoring="roc_auc", n_jobs=-1
        )

        self.model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.8,
            min_samples_leaf=5,
            random_state=42,
        )
        self.model.fit(X_train, y_train)
        self.is_fitted = True

        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)[:, 1]

        auc = roc_auc_score(y_test, y_proba)
        acc = accuracy_score(y_test, y_pred)

        from sklearn.metrics import precision_score, recall_score, f1_score
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)

        importances = dict(
            zip(self.feature_names, self.model.feature_importances_.tolist())
        )
        sorted_imp = dict(
            sorted(importances.items(), key=lambda kv: kv[1], reverse=True)
        )

        self.save()

        metrics = {
            "auc": round(auc, 4),
            "accuracy": round(acc, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "cv_auc_mean": round(float(cv_auc_scores.mean()), 4),
            "cv_auc_std": round(float(cv_auc_scores.std()), 4),
            "train_samples": len(y_train),
            "test_samples": len(y_test),
            "denied_pct": round(float(np.mean(y)) * 100, 2),
            "feature_importance": sorted_imp,
        }
        logger.info("Training complete — AUC=%.4f  Accuracy=%.4f", auc, acc)
        return metrics

    # ------------------------------------------------------------------
    # PREDICT (single feature dict)
    # ------------------------------------------------------------------
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Score a single observation.

        Parameters
        ----------
        features : dict
            Keys must match ``FEATURE_NAMES``.

        Returns
        -------
        dict with probability, risk_level, contributing_factors
        """
        if not self.is_fitted:
            self.load()

        vector = self._features_to_vector(features)
        proba = float(self.model.predict_proba(vector)[0, 1])
        risk_level = self._risk_level(proba)

        # Feature-contribution via importances * deviation from mean
        contributing = self._contributing_factors(features, proba)

        return {
            "probability": round(proba, 4),
            "risk_level": risk_level,
            "contributing_factors": contributing,
        }

    # ------------------------------------------------------------------
    # PREDICT_CLAIM
    # ------------------------------------------------------------------
    async def predict_claim(
        self, db: AsyncSession, claim_id: str
    ) -> Dict[str, Any]:
        """
        Extract features for *claim_id* from the database and return a
        full prediction with explanation.
        """
        if not self.is_fitted:
            self.load()

        query = text(self._single_claim_query())
        result = await db.execute(query, {"claim_id": claim_id})
        row = result.fetchone()

        if row is None:
            raise ValueError(f"Claim {claim_id} not found in database")

        columns = list(result.keys())
        raw = dict(zip(columns, row))
        features = self._row_to_features(raw)
        prediction = self.predict(features)
        prediction["claim_id"] = claim_id
        prediction["features"] = features
        return prediction

    # ------------------------------------------------------------------
    # SAVE / LOAD
    # ------------------------------------------------------------------
    def save(self, path: Optional[str] = None) -> str:
        target = Path(path) if path else MODEL_PATH
        target.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "model": self.model,
            "feature_names": self.feature_names,
        }
        joblib.dump(payload, target)
        logger.info("Model saved to %s", target)
        return str(target)

    def load(self, path: Optional[str] = None) -> None:
        target = Path(path) if path else MODEL_PATH
        if not target.exists():
            raise FileNotFoundError(
                f"No saved model at {target}. Call train() first."
            )
        payload = joblib.load(target)
        self.model = payload["model"]
        self.feature_names = payload["feature_names"]
        self.is_fitted = True
        logger.info("Model loaded from %s", target)

    # ==================================================================
    # INTERNAL HELPERS
    # ==================================================================

    @staticmethod
    def _risk_level(proba: float) -> str:
        if proba >= 0.75:
            return "CRITICAL"
        if proba >= 0.50:
            return "HIGH"
        if proba >= 0.25:
            return "MEDIUM"
        return "LOW"

    def _features_to_vector(self, features: Dict[str, Any]) -> np.ndarray:
        """Convert a feature dict to a (1, n_features) numpy array."""
        vec = []
        for name in self.feature_names:
            val = features.get(name, 0)
            if val is None:
                val = 0
            vec.append(float(val))
        return np.array(vec).reshape(1, -1)

    def _contributing_factors(
        self, features: Dict[str, Any], proba: float
    ) -> List[Dict[str, Any]]:
        """
        Return the top features driving the prediction, sorted by
        importance, annotated with direction.
        """
        importances = dict(
            zip(self.feature_names, self.model.feature_importances_)
        )
        sorted_feats = sorted(
            importances.items(), key=lambda kv: kv[1], reverse=True
        )

        factors: List[Dict[str, Any]] = []
        for feat_name, importance in sorted_feats[:8]:
            val = features.get(feat_name, 0)
            if val is None:
                val = 0
            factors.append(
                {
                    "feature": feat_name,
                    "value": val,
                    "importance": round(float(importance), 4),
                    "direction": self._direction_hint(feat_name, val),
                }
            )
        return factors

    @staticmethod
    def _direction_hint(feature: str, value: Any) -> str:
        """Heuristic directional hint for interpretability."""
        risk_increasing = {
            "payer_denial_rate": lambda v: v > 0.15,
            "prior_auth_status": lambda v: v >= 2,
            "eligibility_status": lambda v: v >= 1,
            "days_to_submit": lambda v: v > 30,
            "is_high_value": lambda v: v == 1,
            "denial_category_history_count": lambda v: v > 3,
            "similar_carc_90d": lambda v: v > 2,
            "provider_denial_rate_90d": lambda v: v > 0.10,
            "payer_cpt_denial_rate": lambda v: v > 0.10,
            "network_status_encoded": lambda v: v >= 1,
        }
        checker = risk_increasing.get(feature)
        if checker and checker(value):
            return "increases_denial_risk"
        risk_decreasing = {
            "crs_score": lambda v: v >= 80,
            "has_prior_auth": lambda v: v == 1,
        }
        checker = risk_decreasing.get(feature)
        if checker and checker(value):
            return "decreases_denial_risk"
        return "neutral"

    # ------------------------------------------------------------------
    # Build feature matrix from raw DB rows
    # ------------------------------------------------------------------
    def _build_matrix(
        self, data: List[Dict[str, Any]]
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Convert list-of-dicts (from SQL) into (X, y) numpy arrays.
        """
        X_rows = []
        y_list = []
        for row in data:
            features = self._row_to_features(row)
            vec = [float(features.get(f, 0) or 0) for f in self.feature_names]
            X_rows.append(vec)
            y_list.append(1 if row["claim_status"] == "DENIED" else 0)
        return np.array(X_rows, dtype=np.float64), np.array(
            y_list, dtype=np.float64
        )

    def _row_to_features(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Map a raw SQL row dict to the canonical feature dict."""

        def _safe(val, default=0):
            return val if val is not None else default

        total_charges = _safe(row.get("total_charges"), 0)
        claim_line_count = _safe(row.get("claim_line_count"), 1) or 1

        return {
            "payer_denial_rate": _safe(row.get("payer_denial_rate"), 0),
            "crs_score": _safe(row.get("crs_score"), 50),
            "total_charges": total_charges,
            "has_prior_auth": 1 if row.get("auth_id") is not None else 0,
            "prior_auth_status": PRIOR_AUTH_STATUS_MAP.get(
                row.get("auth_status"), 4
            ),
            "provider_denial_rate_90d": _safe(
                row.get("provider_denial_rate_90d"), 0
            ),
            "payer_cpt_denial_rate": _safe(
                row.get("payer_cpt_denial_rate"), 0
            ),
            "claim_line_count": claim_line_count,
            "has_modifier": 1 if row.get("has_modifier") else 0,
            "days_to_submit": _safe(row.get("days_to_submit"), 0),
            "payer_adtp_days": _safe(row.get("payer_adtp_days"), 14),
            "eligibility_status": ELIGIBILITY_STATUS_MAP.get(
                row.get("eligibility_status"), 3
            ),
            "charge_per_line": (
                total_charges / claim_line_count if claim_line_count else 0
            ),
            "is_high_value": 1 if total_charges > 5000 else 0,
            "specialty_encoded": _safe(row.get("specialty_encoded"), 0),
            "denial_category_history_count": _safe(
                row.get("denial_category_history_count"), 0
            ),
            "payer_group_encoded": PAYER_GROUP_MAP.get(
                row.get("payer_group"), 0
            ),
            "day_of_week_submitted": _safe(
                row.get("day_of_week_submitted"), 0
            ),
            "month_of_service": _safe(row.get("month_of_service"), 1),
            "similar_carc_90d": _safe(row.get("similar_carc_90d"), 0),
            "deductible_remaining": _safe(
                row.get("deductible_remaining"), 0
            ),
            "oop_remaining": _safe(row.get("oop_remaining"), 0),
            "network_status_encoded": NETWORK_STATUS_MAP.get(
                row.get("network_status"), 2
            ),
            "claim_type_encoded": CLAIM_TYPE_MAP.get(
                row.get("claim_type"), 0
            ),
            "crs_eligibility_pts": _safe(row.get("crs_eligibility_pts"), 0),
        }

    # ------------------------------------------------------------------
    # SQL: training data (batch)
    # ------------------------------------------------------------------
    @staticmethod
    def _training_query() -> str:
        """
        Pull all DENIED and PAID claims with joined features.
        Sub-selects compute rolling rates and aggregates.
        """
        return """
        WITH provider_denial_rates AS (
            SELECT
                c2.provider_id,
                COUNT(*) FILTER (WHERE c2.status = 'DENIED')::float
                    / NULLIF(COUNT(*), 0) AS denial_rate_90d
            FROM claims c2
            WHERE c2.status IN ('DENIED', 'PAID')
              AND c2.created_at >= NOW() - INTERVAL '90 days'
            GROUP BY c2.provider_id
        ),
        payer_cpt_rates AS (
            SELECT
                c2.payer_id,
                cl2.cpt_code,
                COUNT(*) FILTER (WHERE c2.status = 'DENIED')::float
                    / NULLIF(COUNT(*), 0) AS cpt_denial_rate
            FROM claims c2
            JOIN claim_lines cl2 ON cl2.claim_id = c2.claim_id
            WHERE c2.status IN ('DENIED', 'PAID')
            GROUP BY c2.payer_id, cl2.cpt_code
        ),
        denial_cat_counts AS (
            SELECT
                c3.payer_id,
                COUNT(DISTINCT d.denial_category) AS cat_count
            FROM denials d
            JOIN claims c3 ON c3.claim_id = d.claim_id
            WHERE d.created_at >= NOW() - INTERVAL '180 days'
            GROUP BY c3.payer_id
        ),
        similar_carc AS (
            SELECT
                c4.payer_id,
                COUNT(*) AS similar_count
            FROM denials d2
            JOIN claims c4 ON c4.claim_id = d2.claim_id
            WHERE d2.created_at >= NOW() - INTERVAL '90 days'
            GROUP BY c4.payer_id
        ),
        specialty_map AS (
            SELECT
                DISTINCT specialty,
                DENSE_RANK() OVER (ORDER BY specialty) - 1 AS specialty_code
            FROM providers
            WHERE specialty IS NOT NULL
        )
        SELECT
            c.claim_id,
            c.status                                     AS claim_status,
            c.total_charges,
            c.crs_score,
            c.crs_eligibility_pts,
            c.claim_type,

            -- Payer fields
            pm.denial_rate                               AS payer_denial_rate,
            pm.adtp_days                                 AS payer_adtp_days,
            pm.payer_group,

            -- Prior auth
            pa.auth_id,
            pa.status                                    AS auth_status,

            -- Provider denial rate (90d)
            COALESCE(pdr.denial_rate_90d, 0)             AS provider_denial_rate_90d,

            -- Payer-CPT denial rate (first line)
            COALESCE(pcr.cpt_denial_rate, 0)             AS payer_cpt_denial_rate,

            -- Claim lines
            (SELECT COUNT(*) FROM claim_lines cl
             WHERE cl.claim_id = c.claim_id)             AS claim_line_count,

            -- Has modifier
            EXISTS (
                SELECT 1 FROM claim_lines cl
                WHERE cl.claim_id = c.claim_id
                  AND (cl.modifier_1 IS NOT NULL OR cl.modifier_2 IS NOT NULL)
            )                                            AS has_modifier,

            -- Days to submit
            COALESCE(
                c.submission_date - c.date_of_service, 0
            )                                            AS days_to_submit,

            -- Eligibility
            e271.subscriber_status                       AS eligibility_status,
            COALESCE(e271.deductible_remaining, 0)       AS deductible_remaining,
            COALESCE(e271.oop_remaining, 0)              AS oop_remaining,
            e271.network_status,

            -- Specialty
            COALESCE(sm.specialty_code, 0)               AS specialty_encoded,

            -- Denial-category history for this claim
            COALESCE(dcc.cat_count, 0)                   AS denial_category_history_count,

            -- Day of week submitted (0=Mon)
            COALESCE(EXTRACT(DOW FROM c.submission_date::timestamp)::int, 0)
                                                         AS day_of_week_submitted,

            -- Month of service
            COALESCE(EXTRACT(MONTH FROM c.date_of_service)::int, 1)
                                                         AS month_of_service,

            -- Similar CARC in last 90 days
            COALESCE(sc.similar_count, 0)                AS similar_carc_90d

        FROM claims c
        JOIN payer_master pm      ON pm.payer_id    = c.payer_id
        LEFT JOIN providers  p    ON p.provider_id  = c.provider_id
        LEFT JOIN specialty_map sm ON sm.specialty   = p.specialty
        LEFT JOIN provider_denial_rates pdr
                                  ON pdr.provider_id = c.provider_id
        LEFT JOIN prior_auth pa   ON pa.claim_id    = c.claim_id
        LEFT JOIN LATERAL (
            SELECT cl3.cpt_code
            FROM claim_lines cl3
            WHERE cl3.claim_id = c.claim_id
            ORDER BY cl3.line_number
            LIMIT 1
        ) first_line ON true
        LEFT JOIN payer_cpt_rates pcr
                                  ON pcr.payer_id   = c.payer_id
                                 AND pcr.cpt_code   = first_line.cpt_code
        LEFT JOIN LATERAL (
            SELECT e.subscriber_status,
                   e.deductible_remaining,
                   e.oop_remaining,
                   e.network_status
            FROM eligibility_271 e
            WHERE e.patient_id = c.patient_id
              AND e.payer_id   = c.payer_id
            ORDER BY e.inquiry_date DESC
            LIMIT 1
        ) e271 ON true
        LEFT JOIN denial_cat_counts dcc ON dcc.payer_id = c.payer_id
        LEFT JOIN similar_carc sc       ON sc.payer_id  = c.payer_id

        WHERE c.status IN ('DENIED', 'PAID')
        """

    # ------------------------------------------------------------------
    # SQL: single claim feature extraction
    # ------------------------------------------------------------------
    @staticmethod
    def _single_claim_query() -> str:
        """
        Same feature extraction as training, but for one claim by ID.
        Works for claims in ANY status (including DRAFT / SUBMITTED).
        """
        return """
        WITH provider_denial_rates AS (
            SELECT
                c2.provider_id,
                COUNT(*) FILTER (WHERE c2.status = 'DENIED')::float
                    / NULLIF(COUNT(*), 0) AS denial_rate_90d
            FROM claims c2
            WHERE c2.status IN ('DENIED', 'PAID')
              AND c2.created_at >= NOW() - INTERVAL '90 days'
            GROUP BY c2.provider_id
        ),
        payer_cpt_rates AS (
            SELECT
                c2.payer_id,
                cl2.cpt_code,
                COUNT(*) FILTER (WHERE c2.status = 'DENIED')::float
                    / NULLIF(COUNT(*), 0) AS cpt_denial_rate
            FROM claims c2
            JOIN claim_lines cl2 ON cl2.claim_id = c2.claim_id
            WHERE c2.status IN ('DENIED', 'PAID')
            GROUP BY c2.payer_id, cl2.cpt_code
        ),
        denial_cat_counts AS (
            SELECT
                c3.payer_id,
                COUNT(DISTINCT d.denial_category) AS cat_count
            FROM denials d
            JOIN claims c3 ON c3.claim_id = d.claim_id
            WHERE d.created_at >= NOW() - INTERVAL '180 days'
            GROUP BY c3.payer_id
        ),
        similar_carc AS (
            SELECT
                c4.payer_id,
                COUNT(*) AS similar_count
            FROM denials d2
            JOIN claims c4 ON c4.claim_id = d2.claim_id
            WHERE d2.created_at >= NOW() - INTERVAL '90 days'
            GROUP BY c4.payer_id
        ),
        specialty_map AS (
            SELECT
                DISTINCT specialty,
                DENSE_RANK() OVER (ORDER BY specialty) - 1 AS specialty_code
            FROM providers
            WHERE specialty IS NOT NULL
        )
        SELECT
            c.claim_id,
            c.status                                     AS claim_status,
            c.total_charges,
            c.crs_score,
            c.crs_eligibility_pts,
            c.claim_type,

            pm.denial_rate                               AS payer_denial_rate,
            pm.adtp_days                                 AS payer_adtp_days,
            pm.payer_group,

            pa.auth_id,
            pa.status                                    AS auth_status,

            COALESCE(pdr.denial_rate_90d, 0)             AS provider_denial_rate_90d,
            COALESCE(pcr.cpt_denial_rate, 0)             AS payer_cpt_denial_rate,

            (SELECT COUNT(*) FROM claim_lines cl
             WHERE cl.claim_id = c.claim_id)             AS claim_line_count,

            EXISTS (
                SELECT 1 FROM claim_lines cl
                WHERE cl.claim_id = c.claim_id
                  AND (cl.modifier_1 IS NOT NULL OR cl.modifier_2 IS NOT NULL)
            )                                            AS has_modifier,

            COALESCE(
                c.submission_date - c.date_of_service, 0
            )                                            AS days_to_submit,

            e271.subscriber_status                       AS eligibility_status,
            COALESCE(e271.deductible_remaining, 0)       AS deductible_remaining,
            COALESCE(e271.oop_remaining, 0)              AS oop_remaining,
            e271.network_status,

            COALESCE(sm.specialty_code, 0)               AS specialty_encoded,
            COALESCE(dcc.cat_count, 0)                   AS denial_category_history_count,

            COALESCE(EXTRACT(DOW FROM c.submission_date::timestamp)::int, 0)
                                                         AS day_of_week_submitted,
            COALESCE(EXTRACT(MONTH FROM c.date_of_service)::int, 1)
                                                         AS month_of_service,

            COALESCE(sc.similar_count, 0)                AS similar_carc_90d

        FROM claims c
        JOIN payer_master pm      ON pm.payer_id    = c.payer_id
        LEFT JOIN providers  p    ON p.provider_id  = c.provider_id
        LEFT JOIN specialty_map sm ON sm.specialty   = p.specialty
        LEFT JOIN provider_denial_rates pdr
                                  ON pdr.provider_id = c.provider_id
        LEFT JOIN prior_auth pa   ON pa.claim_id    = c.claim_id
        LEFT JOIN LATERAL (
            SELECT cl3.cpt_code
            FROM claim_lines cl3
            WHERE cl3.claim_id = c.claim_id
            ORDER BY cl3.line_number
            LIMIT 1
        ) first_line ON true
        LEFT JOIN payer_cpt_rates pcr
                                  ON pcr.payer_id   = c.payer_id
                                 AND pcr.cpt_code   = first_line.cpt_code
        LEFT JOIN LATERAL (
            SELECT e.subscriber_status,
                   e.deductible_remaining,
                   e.oop_remaining,
                   e.network_status
            FROM eligibility_271 e
            WHERE e.patient_id = c.patient_id
              AND e.payer_id   = c.payer_id
            ORDER BY e.inquiry_date DESC
            LIMIT 1
        ) e271 ON true
        LEFT JOIN denial_cat_counts dcc ON dcc.payer_id = c.payer_id
        LEFT JOIN similar_carc sc       ON sc.payer_id  = c.payer_id

        WHERE c.claim_id = :claim_id
        """
