"""
Payer Anomaly Detection Model
===============================
Detects anomalous payer behavior (denial rate spikes, ADTP shifts)
using Isolation Forest on weekly payer metrics.

Usage:
    from app.ml.payer_anomaly import PayerAnomalyModel

    model = PayerAnomalyModel()
    metrics = await model.train(db)
    anomalies = await model.detect_anomalies(db)
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "denial_rate",
    "denial_count",
    "payment_count",
    "avg_payment_amount",
    "adtp_deviation",
    "claim_volume",
]

_MODEL_DIR = Path(__file__).resolve().parent / "saved_models"


class PayerAnomalyModel:
    """Isolation Forest for payer behavior anomaly detection."""

    def __init__(self) -> None:
        self.model = None
        self._is_fitted = False
        self._scaler_mean: Optional[np.ndarray] = None
        self._scaler_std: Optional[np.ndarray] = None
        self._artifact = _MODEL_DIR / "payer_anomaly.joblib"

    @property
    def is_fitted(self) -> bool:
        return self._is_fitted

    async def train(self, db: AsyncSession) -> dict:
        from sklearn.ensemble import IsolationForest

        features = await self._extract_training_features(db)
        if len(features) < 20:
            return {"status": "insufficient_data", "samples": len(features)}

        X = np.array(features)
        self._scaler_mean = X.mean(axis=0)
        self._scaler_std = X.std(axis=0) + 1e-8
        X_scaled = (X - self._scaler_mean) / self._scaler_std

        self.model = IsolationForest(
            n_estimators=200,
            contamination=0.05,
            max_features=1.0,
            random_state=42,
        )
        self.model.fit(X_scaled)
        self._is_fitted = True

        scores = self.model.decision_function(X_scaled)
        predictions = self.model.predict(X_scaled)
        anomaly_pct = (predictions == -1).sum() / len(predictions) * 100

        self._save()
        return {
            "status": "success",
            "samples": len(features),
            "anomaly_rate": round(anomaly_pct, 2),
            "mean_score": round(float(scores.mean()), 4),
        }

    def predict(self, features: dict) -> dict:
        if not self._is_fitted:
            self._load()
        if not self._is_fitted:
            return {"anomaly_score": 0, "is_anomaly": False, "anomaly_factors": []}

        X = np.array([[features.get(f, 0) for f in FEATURE_NAMES]])
        X_scaled = (X - self._scaler_mean) / self._scaler_std

        score = float(self.model.decision_function(X_scaled)[0])
        prediction = int(self.model.predict(X_scaled)[0])
        is_anomaly = prediction == -1

        factors = []
        if is_anomaly:
            z_scores = X_scaled[0]
            for i, name in enumerate(FEATURE_NAMES):
                if abs(z_scores[i]) > 1.5:
                    direction = "high" if z_scores[i] > 0 else "low"
                    factors.append(
                        {"feature": name, "z_score": round(float(z_scores[i]), 2), "direction": direction}
                    )
            factors.sort(key=lambda x: abs(x["z_score"]), reverse=True)

        return {
            "anomaly_score": round(score, 4),
            "is_anomaly": is_anomaly,
            "anomaly_factors": factors[:5],
        }

    async def detect_anomalies(self, db: AsyncSession) -> list:
        if not self._is_fitted:
            self._load()
        if not self._is_fitted:
            await self.train(db)

        current = await self._extract_current_features(db)
        results = []
        for payer_id, payer_name, feat_vals in current:
            feat_dict = dict(zip(FEATURE_NAMES, feat_vals))
            pred = self.predict(feat_dict)
            pred["payer_id"] = payer_id
            pred["payer_name"] = payer_name
            pred["metrics"] = feat_dict
            results.append(pred)

        results.sort(key=lambda x: x["anomaly_score"])
        return results

    async def _extract_training_features(self, db: AsyncSession) -> list:
        query = text("""
            WITH weekly AS (
                SELECT
                    d.claim_id,
                    c.payer_id,
                    date_trunc('week', d.denial_date) AS week,
                    COUNT(*) AS denial_cnt,
                    SUM(d.denial_amount) AS denial_amt
                FROM denials d
                JOIN claims c ON c.claim_id = d.claim_id
                WHERE d.denial_date >= CURRENT_DATE - INTERVAL '180 days'
                GROUP BY d.claim_id, c.payer_id, date_trunc('week', d.denial_date)
            ),
            payer_weekly AS (
                SELECT
                    w.payer_id,
                    w.week,
                    COUNT(*) AS denial_count,
                    pm.denial_rate,
                    pm.adtp_days
                FROM weekly w
                JOIN payer_master pm ON pm.payer_id = w.payer_id
                GROUP BY w.payer_id, w.week, pm.denial_rate, pm.adtp_days
            ),
            payments AS (
                SELECT
                    payer_id,
                    date_trunc('week', payment_date) AS week,
                    COUNT(*) AS payment_count,
                    AVG(payment_amount) AS avg_payment
                FROM era_payments
                WHERE payment_date >= CURRENT_DATE - INTERVAL '180 days'
                GROUP BY payer_id, date_trunc('week', payment_date)
            ),
            claims_weekly AS (
                SELECT
                    payer_id,
                    date_trunc('week', date_of_service) AS week,
                    COUNT(*) AS claim_volume
                FROM claims
                WHERE date_of_service >= CURRENT_DATE - INTERVAL '180 days'
                GROUP BY payer_id, date_trunc('week', date_of_service)
            )
            SELECT
                pw.denial_rate,
                pw.denial_count,
                COALESCE(p.payment_count, 0) AS payment_count,
                COALESCE(p.avg_payment, 0) AS avg_payment_amount,
                COALESCE(pw.adtp_days - 30, 0) AS adtp_deviation,
                COALESCE(cw.claim_volume, 0) AS claim_volume
            FROM payer_weekly pw
            LEFT JOIN payments p ON p.payer_id = pw.payer_id AND p.week = pw.week
            LEFT JOIN claims_weekly cw ON cw.payer_id = pw.payer_id AND cw.week = pw.week
            LIMIT 5000
        """)
        try:
            result = await db.execute(query)
            return [list(row) for row in result.fetchall()]
        except Exception as exc:
            logger.warning("Payer anomaly training data extraction failed: %s", exc)
            return []

    async def _extract_current_features(self, db: AsyncSession) -> list:
        query = text("""
            WITH recent_denials AS (
                SELECT
                    c.payer_id,
                    COUNT(*) AS denial_count,
                    AVG(d.denial_amount) AS avg_denial
                FROM denials d
                JOIN claims c ON c.claim_id = d.claim_id
                WHERE d.denial_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY c.payer_id
            ),
            recent_payments AS (
                SELECT
                    payer_id,
                    COUNT(*) AS payment_count,
                    AVG(payment_amount) AS avg_payment
                FROM era_payments
                WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY payer_id
            ),
            recent_claims AS (
                SELECT payer_id, COUNT(*) AS claim_volume
                FROM claims
                WHERE date_of_service >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY payer_id
            )
            SELECT
                pm.payer_id,
                pm.payer_name,
                pm.denial_rate,
                COALESCE(rd.denial_count, 0),
                COALESCE(rp.payment_count, 0),
                COALESCE(rp.avg_payment, 0),
                COALESCE(pm.adtp_days - 30, 0),
                COALESCE(rc.claim_volume, 0)
            FROM payer_master pm
            LEFT JOIN recent_denials rd ON rd.payer_id = pm.payer_id
            LEFT JOIN recent_payments rp ON rp.payer_id = pm.payer_id
            LEFT JOIN recent_claims rc ON rc.payer_id = pm.payer_id
        """)
        try:
            result = await db.execute(query)
            rows = result.fetchall()
            return [(r[0], r[1], list(r[2:])) for r in rows]
        except Exception as exc:
            logger.warning("Payer anomaly current features failed: %s", exc)
            return []

    def _save(self) -> None:
        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {"model": self.model, "mean": self._scaler_mean, "std": self._scaler_std},
            self._artifact,
        )

    def _load(self) -> None:
        if self._artifact.exists():
            try:
                data = joblib.load(self._artifact)
                self.model = data["model"]
                self._scaler_mean = data["mean"]
                self._scaler_std = data["std"]
                self._is_fitted = True
            except Exception as exc:
                logger.warning("Failed to load payer anomaly model: %s", exc)
