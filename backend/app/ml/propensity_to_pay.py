"""
Patient Propensity-to-Pay Model
=================================
Predicts probability a patient will pay their balance within 30/60/90/120 days.
GradientBoostingClassifier on payment history and demographic features.

Usage:
    model = PropensityToPayModel()
    await model.train(db)
    result = await model.predict_patient(db, "PAT-001")
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "patient_resp_balance",
    "aging_days",
    "payer_type_encoded",
    "prior_payment_count",
    "prior_payment_ratio",
    "number_of_claims",
    "avg_claim_amount",
    "has_denials",
    "denial_rate",
    "avg_pr_amount",
]

_MODEL_DIR = Path(__file__).resolve().parent / "saved_models"


class PropensityToPayModel:
    def __init__(self) -> None:
        self.model = None
        self._is_fitted = False
        self._artifact = _MODEL_DIR / "propensity_to_pay.joblib"

    @property
    def is_fitted(self) -> bool:
        return self._is_fitted

    async def train(self, db: AsyncSession) -> dict:
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import roc_auc_score, accuracy_score

        X, y = await self._extract_training_data(db)
        if len(X) < 50:
            return {"status": "insufficient_data", "samples": len(X)}

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        self.model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            min_samples_leaf=5,
            random_state=42,
        )
        self.model.fit(X_train, y_train)
        self._is_fitted = True

        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_proba)
        acc = accuracy_score(y_test, y_pred)

        self._save()
        return {
            "status": "success",
            "samples": len(X),
            "auc": round(auc, 4),
            "accuracy": round(acc, 4),
        }

    def predict(self, features: dict) -> dict:
        if not self._is_fitted:
            self._load()
        if not self._is_fitted:
            return self._fallback_predict(features)

        X = np.array([[features.get(f, 0) for f in FEATURE_NAMES]])
        proba = float(self.model.predict_proba(X)[0][1])

        if proba >= 0.70:
            tier, action = "HIGH", "Standard billing cycle"
        elif proba >= 0.40:
            tier, action = "MEDIUM", "Offer payment plan"
        elif proba >= 0.15:
            tier, action = "LOW", "Financial assistance screening"
        else:
            tier, action = "VERY_LOW", "Write-off evaluation"

        return {
            "probability": round(proba, 4),
            "risk_tier": tier,
            "recommended_action": action,
        }

    async def predict_patient(self, db: AsyncSession, patient_id: str) -> dict:
        features = await self._extract_patient_features(db, patient_id)
        if not features:
            return {"patient_id": patient_id, "probability": 0.5, "risk_tier": "UNKNOWN",
                    "recommended_action": "Manual review", "note": "No data"}
        result = self.predict(features)
        result["patient_id"] = patient_id
        result["features"] = features
        return result

    def _fallback_predict(self, features: dict) -> dict:
        aging = features.get("aging_days", 60)
        balance = features.get("patient_resp_balance", 500)
        ratio = features.get("prior_payment_ratio", 0.5)
        prior_pay = min(features.get("prior_payment_count", 0) / 10, 0.2)
        score = max(0, min(1, 0.7 - aging / 500 - balance / 50000 + prior_pay + ratio * 0.3))
        if score >= 0.70:
            tier = "HIGH"
        elif score >= 0.40:
            tier = "MEDIUM"
        elif score >= 0.15:
            tier = "LOW"
        else:
            tier = "VERY_LOW"
        return {"probability": round(score, 4), "risk_tier": tier,
                "recommended_action": "Heuristic estimate — model not trained"}

    async def _extract_training_data(self, db: AsyncSession) -> tuple:
        query = text("""
            WITH patient_stats AS (
                SELECT
                    c.patient_id,
                    SUM(c.total_charges) AS total_charges,
                    COUNT(*) AS num_claims,
                    AVG(c.total_charges) AS avg_charges,
                    MAX(CURRENT_DATE - c.date_of_service) AS max_aging,
                    SUM(CASE WHEN c.status = 'PAID' THEN 1 ELSE 0 END) AS paid_count,
                    SUM(CASE WHEN c.status IN ('DENIED', 'WRITTEN_OFF') THEN 1 ELSE 0 END) AS denied_count,
                    COALESCE(SUM(ep.pr_amount), 0) AS total_pr_collected,
                    AVG(COALESCE(ep.pr_amount, 0)) AS avg_pr_amount,
                    pm.payer_group,
                    pm.denial_rate AS payer_denial_rate
                FROM claims c
                JOIN payer_master pm ON pm.payer_id = c.payer_id
                LEFT JOIN era_payments ep ON ep.claim_id = c.claim_id
                GROUP BY c.patient_id, pm.payer_group, pm.denial_rate
                HAVING COUNT(*) >= 2
            )
            SELECT
                total_charges,
                max_aging,
                CASE payer_group
                    WHEN 'G1_FEDERAL_FFS' THEN 0 WHEN 'G2_MEDICARE_ADVANTAGE' THEN 1
                    WHEN 'G3_COMMERCIAL_NATIONAL' THEN 2 WHEN 'G4_COMMERCIAL_REGIONAL' THEN 3
                    WHEN 'G5_MANAGED_MEDICAID' THEN 4 WHEN 'G6_STATE_MEDICAID' THEN 5
                    WHEN 'G7_WORKERS_COMP_AUTO' THEN 6 ELSE 7 END,
                paid_count,
                CASE WHEN num_claims > 0 THEN paid_count::float / num_claims ELSE 0 END,
                num_claims,
                avg_charges,
                CASE WHEN denied_count > 0 THEN 1 ELSE 0 END,
                payer_denial_rate,
                avg_pr_amount,
                CASE WHEN SUM(total_pr_collected) / GREATEST(SUM(total_charges) * 0.1, 1) > 0.5 THEN 1 ELSE 0 END AS label
            FROM patient_stats
            GROUP BY total_charges, max_aging, payer_group, paid_count, num_claims,
                     avg_charges, denied_count, payer_denial_rate, avg_pr_amount, total_pr_collected
            LIMIT 10000
        """)
        try:
            result = await db.execute(query)
            rows = result.fetchall()
            if not rows:
                return np.array([]), np.array([])
            X = np.array([list(r[:-1]) for r in rows], dtype=float)
            y = np.array([r[-1] for r in rows], dtype=int)
            return X, y
        except Exception as exc:
            logger.warning("Propensity training data failed: %s", exc)
            return np.array([]), np.array([])

    async def _extract_patient_features(self, db: AsyncSession, patient_id: str) -> Optional[dict]:
        query = text("""
            SELECT
                SUM(c.total_charges) AS balance,
                MAX(CURRENT_DATE - c.date_of_service) AS aging,
                pm.payer_group,
                COUNT(*) AS num_claims,
                AVG(c.total_charges) AS avg_amt,
                SUM(CASE WHEN c.status = 'PAID' THEN 1 ELSE 0 END) AS paid_cnt,
                SUM(CASE WHEN c.status IN ('DENIED','WRITTEN_OFF') THEN 1 ELSE 0 END) AS denied_cnt,
                pm.denial_rate,
                AVG(COALESCE(ep.pr_amount, 0)) AS avg_pr_amount
            FROM claims c
            JOIN payer_master pm ON pm.payer_id = c.payer_id
            LEFT JOIN era_payments ep ON ep.claim_id = c.claim_id
            WHERE c.patient_id = :pid
            GROUP BY pm.payer_group, pm.denial_rate
            LIMIT 1
        """)
        try:
            result = await db.execute(query, {"pid": patient_id})
            row = result.fetchone()
            if not row:
                return None
            num_claims = float(row[3]) or 1
            return {
                "patient_resp_balance": float(row[0] or 0),
                "aging_days": int(row[1] or 0),
                "payer_type_encoded": {"G1_FEDERAL_FFS": 0, "G2_MEDICARE_ADVANTAGE": 1,
                    "G3_COMMERCIAL_NATIONAL": 2, "G4_COMMERCIAL_REGIONAL": 3,
                    "G5_MANAGED_MEDICAID": 4, "G6_STATE_MEDICAID": 5,
                    "G7_WORKERS_COMP_AUTO": 6}.get(row[2], 7),
                "prior_payment_count": int(row[5] or 0),
                "prior_payment_ratio": float(row[5] or 0) / num_claims,
                "number_of_claims": int(row[3] or 0),
                "avg_claim_amount": float(row[4] or 0),
                "has_denials": 1 if (row[6] or 0) > 0 else 0,
                "denial_rate": float(row[7] or 0),
                "avg_pr_amount": float(row[8] or 0),
            }
        except Exception as exc:
            logger.warning("Patient feature extraction failed: %s", exc)
            return None

    def _save(self) -> None:
        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({"model": self.model}, self._artifact)

    def _load(self) -> None:
        if self._artifact.exists():
            try:
                data = joblib.load(self._artifact)
                self.model = data["model"]
                self._is_fitted = True
            except Exception:
                pass
