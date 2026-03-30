"""
CARC Code Prediction Model
=============================
Predicts which CARC codes a claim will receive if denied.
Multi-label classification using OneVsRest GradientBoosting.

Usage:
    model = CARCPredictionModel()
    await model.train(db)
    result = await model.predict_claim(db, "CLM-001")
"""

from __future__ import annotations

import logging
from collections import Counter
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "payer_group_encoded",
    "total_charges",
    "claim_type_encoded",
    "has_prior_auth",
    "provider_denial_rate",
    "payer_denial_rate",
    "claim_line_count",
    "is_high_value",
    "has_modifier",
    "month_of_service",
]

TOP_CARC_CODES = [
    "CO-4", "CO-16", "CO-18", "CO-22", "CO-27", "CO-29", "CO-45",
    "CO-50", "CO-96", "CO-97", "CO-197", "CO-242", "PR-1", "PR-2", "PR-3",
]

CARC_PREVENTION_MAP = {
    "CO-4": "Review modifier and coding rules",
    "CO-16": "Missing or invalid information — verify claim completeness",
    "CO-18": "Duplicate claim — check for prior submission",
    "CO-22": "Coordination of benefits — verify COB order",
    "CO-27": "Expenses not covered — verify benefit coverage",
    "CO-29": "Filing deadline exceeded — submit immediately",
    "CO-45": "Contractual adjustment — verify contract terms",
    "CO-50": "Medical necessity — attach clinical documentation",
    "CO-96": "Non-covered charge — check payer benefit rules",
    "CO-97": "Payment adjusted — procedure bundling review",
    "CO-197": "Prior authorization required — obtain before service",
    "CO-242": "Services not provided — documentation needed",
    "PR-1": "Patient deductible — verify patient benefits",
    "PR-2": "Patient coinsurance — expected cost share",
    "PR-3": "Patient copay — standard cost share",
}

_MODEL_DIR = Path(__file__).resolve().parent / "saved_models"


class CARCPredictionModel:
    def __init__(self) -> None:
        self.models: dict = {}  # carc_code -> classifier
        self._is_fitted = False
        self._artifact = _MODEL_DIR / "carc_prediction.joblib"

    @property
    def is_fitted(self) -> bool:
        return self._is_fitted

    async def train(self, db: AsyncSession) -> dict:
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import roc_auc_score

        X, y_multi = await self._extract_training_data(db)
        if len(X) < 50:
            return {"status": "insufficient_data", "samples": len(X)}

        X_train, X_test, y_train, y_test = train_test_split(
            X, y_multi, test_size=0.2, random_state=42
        )

        aucs = {}
        for i, carc in enumerate(TOP_CARC_CODES):
            y_col = y_train[:, i]
            if y_col.sum() < 5:
                continue
            clf = GradientBoostingClassifier(
                n_estimators=100, max_depth=3, learning_rate=0.1,
                subsample=0.8, random_state=42,
            )
            clf.fit(X_train, y_col)
            self.models[carc] = clf

            y_test_col = y_test[:, i]
            if y_test_col.sum() > 0:
                proba = clf.predict_proba(X_test)[:, 1]
                try:
                    aucs[carc] = round(roc_auc_score(y_test_col, proba), 4)
                except Exception:
                    aucs[carc] = 0.0

        self._is_fitted = bool(self.models)
        self._save()
        return {
            "status": "success",
            "samples": len(X),
            "models_trained": len(self.models),
            "per_carc_auc": aucs,
            "mean_auc": round(np.mean(list(aucs.values())), 4) if aucs else 0,
        }

    def predict(self, features: dict) -> dict:
        if not self._is_fitted:
            self._load()
        if not self._is_fitted:
            return {"top_3_carc": [], "note": "Model not trained"}

        X = np.array([[features.get(f, 0) for f in FEATURE_NAMES]])
        predictions = []
        for carc, clf in self.models.items():
            try:
                proba = float(clf.predict_proba(X)[0][1])
                predictions.append({
                    "carc_code": carc,
                    "probability": round(proba, 4),
                    "prevention_action": CARC_PREVENTION_MAP.get(carc, "Review claim"),
                })
            except Exception:
                continue

        predictions.sort(key=lambda x: x["probability"], reverse=True)
        return {"top_3_carc": predictions[:3], "all_predictions": predictions[:10]}

    async def predict_claim(self, db: AsyncSession, claim_id: str) -> dict:
        features = await self._extract_claim_features(db, claim_id)
        if not features:
            return {"claim_id": claim_id, "top_3_carc": [], "note": "Claim not found"}
        result = self.predict(features)
        result["claim_id"] = claim_id
        return result

    async def _extract_training_data(self, db: AsyncSession) -> tuple:
        query = text("""
            WITH provider_denial_rates AS (
                SELECT c2.provider_id,
                       COUNT(*) FILTER (WHERE c2.status = 'DENIED')::float / NULLIF(COUNT(*), 0) AS denial_rate_90d
                FROM claims c2
                WHERE c2.status IN ('DENIED', 'PAID')
                GROUP BY c2.provider_id
            )
            SELECT
                CASE pm.payer_group
                    WHEN 'G1_FEDERAL_FFS' THEN 0 WHEN 'G2_MEDICARE_ADVANTAGE' THEN 1
                    WHEN 'G3_COMMERCIAL_NATIONAL' THEN 2 WHEN 'G4_COMMERCIAL_REGIONAL' THEN 3
                    WHEN 'G5_MANAGED_MEDICAID' THEN 4 WHEN 'G6_STATE_MEDICAID' THEN 5
                    WHEN 'G7_WORKERS_COMP_AUTO' THEN 6 ELSE 7 END,
                c.total_charges,
                CASE c.claim_type WHEN 'PROFESSIONAL' THEN 0 ELSE 1 END,
                CASE WHEN pa.auth_id IS NOT NULL THEN 1 ELSE 0 END,
                COALESCE(pdr.denial_rate_90d, pm.denial_rate, 0.12) AS provider_denial_rate,
                pm.denial_rate,
                (SELECT COUNT(*) FROM claim_lines cl WHERE cl.claim_id = c.claim_id) AS claim_line_count,
                CASE WHEN c.total_charges > 5000 THEN 1 ELSE 0 END,
                CASE WHEN EXISTS (SELECT 1 FROM claim_lines cl WHERE cl.claim_id = c.claim_id AND (cl.modifier_1 IS NOT NULL OR cl.modifier_2 IS NOT NULL)) THEN 1 ELSE 0 END AS has_modifier,
                EXTRACT(MONTH FROM c.date_of_service),
                d.carc_code
            FROM denials d
            JOIN claims c ON c.claim_id = d.claim_id
            JOIN payer_master pm ON pm.payer_id = c.payer_id
            LEFT JOIN prior_auth pa ON pa.claim_id = c.claim_id
            LEFT JOIN provider_denial_rates pdr ON pdr.provider_id = c.provider_id
            WHERE d.carc_code IS NOT NULL
            LIMIT 20000
        """)
        try:
            result = await db.execute(query)
            rows = result.fetchall()
            if not rows:
                return np.array([]), np.array([])

            X = np.array([list(r[:10]) for r in rows], dtype=float)
            carc_codes = [r[10] for r in rows]

            y = np.zeros((len(rows), len(TOP_CARC_CODES)), dtype=int)
            for i, code in enumerate(carc_codes):
                if code in TOP_CARC_CODES:
                    y[i, TOP_CARC_CODES.index(code)] = 1

            return X, y
        except Exception as exc:
            logger.warning("CARC training data failed: %s", exc)
            return np.array([]), np.array([])

    async def _extract_claim_features(self, db: AsyncSession, claim_id: str) -> Optional[dict]:
        query = text("""
            WITH provider_denial_rates AS (
                SELECT c2.provider_id,
                       COUNT(*) FILTER (WHERE c2.status = 'DENIED')::float / NULLIF(COUNT(*), 0) AS denial_rate_90d
                FROM claims c2
                WHERE c2.status IN ('DENIED', 'PAID')
                GROUP BY c2.provider_id
            )
            SELECT
                pm.payer_group, c.total_charges, c.claim_type,
                CASE WHEN pa.auth_id IS NOT NULL THEN 1 ELSE 0 END,
                COALESCE(pdr.denial_rate_90d, pm.denial_rate, 0.12) AS provider_denial_rate,
                pm.denial_rate,
                (SELECT COUNT(*) FROM claim_lines cl WHERE cl.claim_id = c.claim_id) AS claim_line_count,
                CASE WHEN EXISTS (SELECT 1 FROM claim_lines cl WHERE cl.claim_id = c.claim_id AND (cl.modifier_1 IS NOT NULL OR cl.modifier_2 IS NOT NULL)) THEN 1 ELSE 0 END AS has_modifier,
                EXTRACT(MONTH FROM c.date_of_service)
            FROM claims c
            JOIN payer_master pm ON pm.payer_id = c.payer_id
            LEFT JOIN prior_auth pa ON pa.claim_id = c.claim_id
            LEFT JOIN provider_denial_rates pdr ON pdr.provider_id = c.provider_id
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
            return {
                "payer_group_encoded": pg_map.get(row[0], 7),
                "total_charges": float(row[1] or 0),
                "claim_type_encoded": 0 if row[2] == "PROFESSIONAL" else 1,
                "has_prior_auth": int(row[3]),
                "provider_denial_rate": float(row[4] or 0.12),
                "payer_denial_rate": float(row[5] or 0),
                "claim_line_count": int(row[6] or 1),
                "is_high_value": 1 if float(row[1] or 0) > 5000 else 0,
                "has_modifier": int(row[7] or 0),
                "month_of_service": int(row[8] or 1),
            }
        except Exception as exc:
            logger.warning("CARC feature extraction failed: %s", exc)
            return None

    def _save(self) -> None:
        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({"models": self.models}, self._artifact)

    def _load(self) -> None:
        if self._artifact.exists():
            try:
                data = joblib.load(self._artifact)
                self.models = data["models"]
                self._is_fitted = bool(self.models)
            except Exception:
                pass
