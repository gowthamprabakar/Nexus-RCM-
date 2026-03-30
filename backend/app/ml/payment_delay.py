"""
Payment Delay Prediction Model
================================
Predicts the number of days until payment for a claim, per-payer.
Uses sklearn GradientBoostingRegressor trained on historical ERA payment data.

Usage:
    from app.ml.payment_delay import PaymentDelayModel

    model = PaymentDelayModel()
    metrics = await model.train(db)
    result  = model.predict(features_dict)
    result  = await model.predict_claim(db, "CLM-00001")
"""

from __future__ import annotations

import logging
import os
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature catalogue
# ---------------------------------------------------------------------------
FEATURE_NAMES: List[str] = [
    "payer_adtp_days",
    "total_charges",
    "claim_type_encoded",
    "has_modifier",
    "payer_denial_rate",
    "payer_group_encoded",
    "day_of_week",
    "month",
    "claim_line_count",
    "is_high_value",
    "network_status_encoded",
    "quarterly_end",
    "claim_status_encoded",
]

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
MODEL_PATH = MODEL_DIR / "payment_delay.joblib"

# ---------------------------------------------------------------------------
# SQL queries
# ---------------------------------------------------------------------------
TRAINING_DATA_SQL = """
SELECT
    c.claim_id,
    c.total_charges,
    c.claim_type,

    -- Payer fields
    pm.denial_rate        AS payer_denial_rate,
    pm.adtp_days          AS payer_adtp_days,
    pm.payer_group,

    -- Network status
    e271.network_status,

    -- Claim lines
    (SELECT COUNT(*) FROM claim_lines cl
     WHERE cl.claim_id = c.claim_id)                AS claim_line_count,

    -- Has modifier
    EXISTS (
        SELECT 1 FROM claim_lines cl
        WHERE cl.claim_id = c.claim_id
          AND (cl.modifier_1 IS NOT NULL OR cl.modifier_2 IS NOT NULL)
    )                                               AS has_modifier,

    -- Timing
    COALESCE(EXTRACT(DOW FROM c.submission_date::timestamp)::int, 0)
                                                    AS day_of_week,
    COALESCE(EXTRACT(MONTH FROM c.date_of_service)::int, 1)
                                                    AS month,

    CASE WHEN EXTRACT(MONTH FROM c.date_of_service) IN (3,6,9,12) THEN 1 ELSE 0 END AS quarterly_end,

    CASE c.status WHEN 'SUBMITTED' THEN 0 WHEN 'ACKNOWLEDGED' THEN 1 WHEN 'PENDING' THEN 2 ELSE 3 END AS claim_status_encoded,

    -- Target: actual payment delay in days
    (ep.payment_date - c.submission_date)            AS payment_delay_days

FROM claims c
JOIN payer_master pm      ON pm.payer_id    = c.payer_id
JOIN era_payments ep      ON ep.claim_id    = c.claim_id
LEFT JOIN LATERAL (
    SELECT e.network_status
    FROM eligibility_271 e
    WHERE e.patient_id = c.patient_id
      AND e.payer_id   = c.payer_id
    ORDER BY e.inquiry_date DESC
    LIMIT 1
) e271 ON true
WHERE c.status = 'PAID'
  AND ep.payment_date IS NOT NULL
  AND ep.payment_date > c.submission_date
"""

SINGLE_CLAIM_SQL = """
SELECT
    c.claim_id,
    c.total_charges,
    c.claim_type,
    pm.denial_rate        AS payer_denial_rate,
    pm.adtp_days          AS payer_adtp_days,
    pm.payer_group,
    e271.network_status,
    (SELECT COUNT(*) FROM claim_lines cl
     WHERE cl.claim_id = c.claim_id)                AS claim_line_count,
    EXISTS (
        SELECT 1 FROM claim_lines cl
        WHERE cl.claim_id = c.claim_id
          AND (cl.modifier_1 IS NOT NULL OR cl.modifier_2 IS NOT NULL)
    )                                               AS has_modifier,
    COALESCE(EXTRACT(DOW FROM c.submission_date::timestamp)::int, 0)
                                                    AS day_of_week,
    COALESCE(EXTRACT(MONTH FROM c.date_of_service)::int, 1)
                                                    AS month,

    CASE WHEN EXTRACT(MONTH FROM c.date_of_service) IN (3,6,9,12) THEN 1 ELSE 0 END AS quarterly_end,

    CASE c.status WHEN 'SUBMITTED' THEN 0 WHEN 'ACKNOWLEDGED' THEN 1 WHEN 'PENDING' THEN 2 ELSE 3 END AS claim_status_encoded

FROM claims c
JOIN payer_master pm      ON pm.payer_id    = c.payer_id
LEFT JOIN LATERAL (
    SELECT e.network_status
    FROM eligibility_271 e
    WHERE e.patient_id = c.patient_id
      AND e.payer_id   = c.payer_id
    ORDER BY e.inquiry_date DESC
    LIMIT 1
) e271 ON true
WHERE c.claim_id = :claim_id
"""

PAYER_BENCHMARK_SQL = """
SELECT
    AVG(EXTRACT(EPOCH FROM (ep.payment_date - c.submission_date)) / 86400) AS avg_delay,
    STDDEV(EXTRACT(EPOCH FROM (ep.payment_date - c.submission_date)) / 86400) AS std_delay
FROM claims c
JOIN era_payments ep ON ep.claim_id = c.claim_id
WHERE c.payer_id = :payer_id
  AND c.status = 'PAID'
  AND ep.payment_date IS NOT NULL
  AND ep.payment_date > c.submission_date
  AND c.submission_date >= NOW() - INTERVAL '180 days'
"""


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
class PaymentDelayModel:
    """
    GradientBoosting regressor that predicts days until payment.

    * ``train(db)``             — pull labelled data, fit model, return metrics
    * ``predict(features)``     — score a single feature dict
    * ``predict_claim(db, id)`` — extract features + score one claim
    * ``save()`` / ``load()``   — persist via joblib
    """

    def __init__(self) -> None:
        self.model = None
        self.feature_names: List[str] = FEATURE_NAMES
        self.is_fitted: bool = False
        self.training_metrics: Dict[str, Any] = {}

    # ------------------------------------------------------------------
    # TRAIN
    # ------------------------------------------------------------------
    async def train(self, db: AsyncSession) -> Dict[str, Any]:
        from sklearn.ensemble import GradientBoostingRegressor
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
        from sklearn.model_selection import train_test_split

        logger.info("PaymentDelayModel.train — pulling training data")

        result = await db.execute(text(TRAINING_DATA_SQL))
        rows = result.fetchall()

        if not rows:
            raise ValueError(
                "PaymentDelayModel requires era_payments data to train. "
                "Ensure era_payments table is populated. "
                f"Found 0 PAID claims with payment_date in era_payments."
            )
        else:
            columns = list(result.keys())
            data = [dict(zip(columns, row)) for row in rows]
            X, y = self._build_matrix(data)

        logger.info("Training set: %d samples, mean delay=%.1f days", len(y), float(np.mean(y)))

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.model = GradientBoostingRegressor(
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

        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        mae = float(mean_absolute_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))

        importances = dict(
            zip(self.feature_names, self.model.feature_importances_.tolist())
        )
        sorted_imp = dict(
            sorted(importances.items(), key=lambda kv: kv[1], reverse=True)
        )

        self.training_metrics = {
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "r2": round(r2, 4),
            "train_samples": len(y_train),
            "test_samples": len(y_test),
            "mean_delay_days": round(float(np.mean(y)), 2),
            "feature_importance": sorted_imp,
        }

        self.save()
        logger.info("Training complete — RMSE=%.2f MAE=%.2f R2=%.4f", rmse, mae, r2)
        return self.training_metrics

    # ------------------------------------------------------------------
    # PREDICT
    # ------------------------------------------------------------------
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_fitted:
            self.load()

        vector = self._features_to_vector(features)
        predicted_days = float(self.model.predict(vector)[0])
        predicted_days = max(0, predicted_days)

        # Correct variance estimate via staged predictions
        staged = list(self.model.staged_predict(vector))
        if len(staged) > 1:
            std_dev = float(np.std([float(p[0]) for p in staged[-20:]]))
        else:
            std_dev = predicted_days * 0.15  # 15% fallback

        return {
            "predicted_days": round(predicted_days, 1),
            "confidence_interval": {
                "lower": round(max(0, predicted_days - 1.96 * std_dev), 1),
                "upper": round(predicted_days + 1.96 * std_dev, 1),
            },
            "payer_benchmark": round(features.get("payer_adtp_days", 0), 1),
        }

    # ------------------------------------------------------------------
    # PREDICT_CLAIM
    # ------------------------------------------------------------------
    async def predict_claim(
        self, db: AsyncSession, claim_id: str
    ) -> Dict[str, Any]:
        if not self.is_fitted:
            self.load()

        result = await db.execute(text(SINGLE_CLAIM_SQL), {"claim_id": claim_id})
        row = result.fetchone()

        if row is None:
            raise ValueError(f"Claim {claim_id} not found in database")

        columns = list(result.keys())
        raw = dict(zip(columns, row))
        features = self._row_to_features(raw)
        prediction = self.predict(features)
        prediction["claim_id"] = claim_id

        # Fetch payer benchmark
        try:
            payer_result = await db.execute(
                text("SELECT payer_id FROM claims WHERE claim_id = :claim_id"),
                {"claim_id": claim_id},
            )
            payer_row = payer_result.fetchone()
            if payer_row:
                bench_result = await db.execute(
                    text(PAYER_BENCHMARK_SQL), {"payer_id": payer_row[0]}
                )
                bench = bench_result.fetchone()
                if bench and bench[0] is not None:
                    prediction["payer_benchmark"] = round(float(bench[0]), 1)
        except Exception:
            pass

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
            "training_metrics": self.training_metrics,
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
        self.training_metrics = payload.get("training_metrics", {})
        self.is_fitted = True
        logger.info("Model loaded from %s", target)

    # ==================================================================
    # INTERNAL HELPERS
    # ==================================================================

    def _features_to_vector(self, features: Dict[str, Any]) -> np.ndarray:
        vec = []
        for name in self.feature_names:
            val = features.get(name, 0)
            if val is None:
                val = 0
            vec.append(float(val))
        return np.array(vec).reshape(1, -1)

    def _build_matrix(
        self, data: List[Dict[str, Any]]
    ) -> tuple[np.ndarray, np.ndarray]:
        X_rows = []
        y_list = []
        for row in data:
            features = self._row_to_features(row)
            vec = [float(features.get(f, 0) or 0) for f in self.feature_names]
            X_rows.append(vec)
            delay = float(row.get("payment_delay_days", 14) or 14)
            y_list.append(max(0, delay))
        return np.array(X_rows, dtype=np.float64), np.array(y_list, dtype=np.float64)

    def _row_to_features(self, row: Dict[str, Any]) -> Dict[str, Any]:
        def _safe(val, default=0):
            return val if val is not None else default

        total_charges = _safe(row.get("total_charges"), 0)

        return {
            "payer_adtp_days": _safe(row.get("payer_adtp_days"), 14),
            "total_charges": total_charges,
            "claim_type_encoded": CLAIM_TYPE_MAP.get(row.get("claim_type"), 0),
            "has_modifier": 1 if row.get("has_modifier") else 0,
            "payer_denial_rate": _safe(row.get("payer_denial_rate"), 0),
            "payer_group_encoded": PAYER_GROUP_MAP.get(row.get("payer_group"), 0),
            "day_of_week": _safe(row.get("day_of_week"), 0),
            "month": _safe(row.get("month"), 1),
            "claim_line_count": _safe(row.get("claim_line_count"), 1),
            "is_high_value": 1 if total_charges > 5000 else 0,
            "network_status_encoded": NETWORK_STATUS_MAP.get(
                row.get("network_status"), 2
            ),
            "quarterly_end": 1 if row.get("month") in (3, 6, 9, 12) else 0,
            "claim_status_encoded": int(row.get("claim_status_encoded", 0)),
        }

