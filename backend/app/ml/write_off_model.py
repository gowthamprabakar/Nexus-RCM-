"""
Write-Off Probability Model
==============================
Predicts probability a claim will be written off based on aging, payer, denial history.
GradientBoostingClassifier targeting AUC > 0.82.

Usage:
    model = WriteOffModel()
    await model.train(db)
    result = await model.predict_claim(db, "CLM-001")
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
    "payer_type_encoded",
    "denial_count",
    "appeal_count",
    "total_charges",
    "payment_ratio",
    "payer_denial_rate",
    "has_been_resubmitted",
    "claim_line_count",
    "payer_adtp_days",
]

_MODEL_DIR = Path(__file__).resolve().parent / "saved_models"


class WriteOffModel:
    def __init__(self) -> None:
        self.model = None
        self._is_fitted = False
        self._artifact = _MODEL_DIR / "write_off.joblib"

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
            n_estimators=200, max_depth=5, learning_rate=0.1,
            subsample=0.8, min_samples_leaf=5, random_state=42,
        )
        self.model.fit(X_train, y_train)
        self._is_fitted = True

        y_proba = self.model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_proba)
        acc = accuracy_score(y_test, self.model.predict(X_test))

        importances = dict(zip(FEATURE_NAMES, self.model.feature_importances_))

        self._save()
        return {"status": "success", "samples": len(X), "auc": round(auc, 4),
                "accuracy": round(acc, 4), "feature_importance": {k: round(float(v), 4) for k, v in importances.items()}}

    def predict(self, features: dict) -> dict:
        if not self._is_fitted:
            self._load()
        if not self._is_fitted:
            denial_count = features.get("denial_count", 0)
            payment_ratio = features.get("payment_ratio", 0)
            prob = min(1.0, max(0, 0.3 + denial_count * 0.1 - payment_ratio * 0.5))
            return {"write_off_probability": round(prob, 4),
                    "days_to_write_off_estimate": max(0, int(180 * (1 - prob))),
                    "recommended_action": "Heuristic — model not trained"}

        X = np.array([[features.get(f, 0) for f in FEATURE_NAMES]])
        proba = float(self.model.predict_proba(X)[0][1])
        est_days = max(0, int(180 * (1 - proba)))

        if proba >= 0.80:
            action = "Recommend write-off"
        elif proba >= 0.50:
            action = "Final collection attempt"
        elif proba >= 0.25:
            action = "Escalate to senior collector"
        else:
            action = "Continue standard follow-up"

        return {"write_off_probability": round(proba, 4),
                "days_to_write_off_estimate": est_days,
                "recommended_action": action}

    async def predict_claim(self, db: AsyncSession, claim_id: str) -> dict:
        features = await self._extract_claim_features(db, claim_id)
        if not features:
            return {"claim_id": claim_id, "write_off_probability": 0,
                    "note": "Claim not found"}
        result = self.predict(features)
        result["claim_id"] = claim_id
        return result

    async def _extract_training_data(self, db: AsyncSession) -> tuple:
        query = text("""
            SELECT
                CASE pm.payer_group
                    WHEN 'G1_FEDERAL_FFS' THEN 0 WHEN 'G2_MEDICARE_ADVANTAGE' THEN 1
                    WHEN 'G3_COMMERCIAL_NATIONAL' THEN 2 WHEN 'G4_COMMERCIAL_REGIONAL' THEN 3
                    WHEN 'G5_MANAGED_MEDICAID' THEN 4 WHEN 'G6_STATE_MEDICAID' THEN 5
                    WHEN 'G7_WORKERS_COMP_AUTO' THEN 6 ELSE 7 END,
                COALESCE(d_cnt.cnt, 0),
                COALESCE(a_cnt.cnt, 0),
                c.total_charges,
                COALESCE(p_sum.paid, 0) / GREATEST(c.total_charges, 1),
                pm.denial_rate,
                CASE WHEN c.status = 'SUBMITTED' AND COALESCE(d_cnt.cnt, 0) > 0 THEN 1 ELSE 0 END AS has_been_resubmitted,
                (SELECT COUNT(*) FROM claim_lines cl WHERE cl.claim_id = c.claim_id) AS claim_line_count,
                pm.adtp_days,
                CASE
                    WHEN c.status = 'WRITTEN_OFF' THEN 1
                    WHEN c.status = 'DENIED'
                         AND COALESCE(a_cnt.cnt, 0) = 0
                         AND (CURRENT_DATE - c.date_of_service) > 180 THEN 1
                    ELSE 0
                END AS label
            FROM claims c
            JOIN payer_master pm ON pm.payer_id = c.payer_id
            LEFT JOIN (SELECT claim_id, COUNT(*) cnt FROM denials GROUP BY claim_id) d_cnt ON d_cnt.claim_id = c.claim_id
            LEFT JOIN (SELECT claim_id, COUNT(*) cnt FROM appeals GROUP BY claim_id) a_cnt ON a_cnt.claim_id = c.claim_id
            LEFT JOIN (SELECT claim_id, SUM(payment_amount) paid FROM era_payments GROUP BY claim_id) p_sum ON p_sum.claim_id = c.claim_id
            WHERE c.status IN ('PAID', 'DENIED', 'WRITTEN_OFF', 'SUBMITTED', 'ACKNOWLEDGED')
            LIMIT 20000
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
            logger.warning("Write-off training data failed: %s", exc)
            return np.array([]), np.array([])

    async def _extract_claim_features(self, db: AsyncSession, claim_id: str) -> Optional[dict]:
        query = text("""
            SELECT
                pm.payer_group, c.total_charges, pm.denial_rate, pm.adtp_days,
                c.status,
                COALESCE(d.cnt, 0), COALESCE(a.cnt, 0),
                COALESCE(p.paid, 0),
                (SELECT COUNT(*) FROM claim_lines cl WHERE cl.claim_id = c.claim_id) AS line_count
            FROM claims c
            JOIN payer_master pm ON pm.payer_id = c.payer_id
            LEFT JOIN (SELECT claim_id, COUNT(*) cnt FROM denials GROUP BY claim_id) d ON d.claim_id = c.claim_id
            LEFT JOIN (SELECT claim_id, COUNT(*) cnt FROM appeals GROUP BY claim_id) a ON a.claim_id = c.claim_id
            LEFT JOIN (SELECT claim_id, SUM(payment_amount) paid FROM era_payments GROUP BY claim_id) p ON p.claim_id = c.claim_id
            WHERE c.claim_id = :cid
        """)
        try:
            result = await db.execute(query, {"cid": claim_id})
            row = result.fetchone()
            if not row:
                return None
            pg_map = {"G1_FEDERAL_FFS": 0, "G2_MEDICARE_ADVANTAGE": 1,
                      "G3_COMMERCIAL_NATIONAL": 2, "G4_COMMERCIAL_REGIONAL": 3,
                      "G5_MANAGED_MEDICAID": 4, "G6_STATE_MEDICAID": 5,
                      "G7_WORKERS_COMP_AUTO": 6}
            denial_count = int(row[5] or 0)
            return {
                "payer_type_encoded": pg_map.get(row[0], 7),
                "denial_count": denial_count,
                "appeal_count": int(row[6] or 0),
                "total_charges": float(row[1] or 0),
                "payment_ratio": float(row[7] or 0) / max(float(row[1] or 1), 1),
                "payer_denial_rate": float(row[2] or 0),
                "has_been_resubmitted": 1 if row[4] == "SUBMITTED" and denial_count > 0 else 0,
                "claim_line_count": int(row[8] or 1),
                "payer_adtp_days": float(row[3] or 30),
            }
        except Exception as exc:
            logger.warning("Write-off feature extraction failed: %s", exc)
            return None

    def _save(self) -> None:
        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({"model": self.model}, self._artifact)

    def _load(self) -> None:
        if self._artifact.exists():
            try:
                self.model = joblib.load(self._artifact)["model"]
                self._is_fitted = True
            except Exception:
                pass
