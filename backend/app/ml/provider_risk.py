"""
Provider Risk Score Model
===========================
Composite provider risk score (0-100) from denial patterns, coding deviations,
and peer comparison. Optionally uses Neo4j graph data.

Usage:
    model = ProviderRiskModel()
    result = await model.score_provider(db, "PROV-001")
    all_scores = await model.score_all_providers(db)
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class ProviderRiskModel:
    """Weighted composite scoring — no training needed."""

    WEIGHTS = {
        "denial_rate_z": 0.30,
        "denial_trend": 0.15,
        "coding_deviation": 0.20,
        "peer_comparison": 0.15,
        "claim_volume_factor": 0.10,
        "modifier_usage": 0.10,
    }

    @property
    def is_fitted(self) -> bool:
        return True  # composite model, always ready

    async def score_provider(self, db: AsyncSession, provider_id: str) -> dict:
        stats = await self._get_provider_stats(db, provider_id)
        if not stats:
            return {"provider_id": provider_id, "risk_score": 0,
                    "risk_factors": [], "peer_percentile": 50, "note": "No data"}

        specialty_result = await db.execute(
            text("SELECT specialty FROM providers WHERE provider_id = :pid"), {"pid": provider_id}
        )
        specialty_row = specialty_result.fetchone()
        specialty = specialty_row[0] if specialty_row else None
        peer_stats = await self._get_peer_stats(db, specialty=specialty)
        score, factors = self._compute_score(stats, peer_stats)

        peer_scores = []
        all_provs = await self._get_all_provider_ids(db)
        for pid in all_provs[:50]:
            ps = await self._get_provider_stats(db, pid)
            if ps:
                s, _ = self._compute_score(ps, peer_stats)
                peer_scores.append(s)
        if peer_scores:
            percentile = sum(1 for s in peer_scores if s <= score) / len(peer_scores) * 100
        else:
            percentile = 50

        return {
            "provider_id": provider_id,
            "risk_score": round(score, 1),
            "risk_factors": factors,
            "peer_percentile": round(percentile, 1),
            "stats": stats,
        }

    async def score_all_providers(self, db: AsyncSession) -> list:
        batch_query = text("""
            WITH prov_stats AS (
                SELECT c.provider_id,
                       COUNT(d.denial_id)::float / GREATEST(COUNT(c.claim_id), 1) AS denial_rate,
                       AVG(c.total_charges) AS avg_charge,
                       COUNT(c.claim_id) AS claim_volume
                FROM claims c
                LEFT JOIN denials d ON d.claim_id = c.claim_id
                WHERE c.provider_id IS NOT NULL
                GROUP BY c.provider_id
                HAVING COUNT(c.claim_id) >= 5
            )
            SELECT * FROM prov_stats ORDER BY denial_rate DESC LIMIT 200
        """)
        try:
            result = await db.execute(batch_query)
            rows = result.fetchall()
        except Exception:
            return []

        peer_stats = await self._get_peer_stats(db)
        scores = []
        for row in rows:
            stats = {
                "denial_rate": float(row[1] or 0),
                "denial_trend": 0,
                "avg_charge": float(row[2] or 0),
                "claim_volume": int(row[3] or 0),
                "modifier_usage_rate": 0,
            }
            score, factors = self._compute_score(stats, peer_stats)
            scores.append({
                "provider_id": row[0],
                "risk_score": round(score, 1),
                "risk_factors": factors[:3],
                "denial_rate": stats["denial_rate"],
                "claim_volume": stats["claim_volume"],
            })
        scores.sort(key=lambda x: x["risk_score"], reverse=True)
        return scores

    def _compute_score(self, stats: dict, peer_stats: dict) -> tuple:
        factors = []
        components = {}

        # 1. Denial rate Z-score
        mean_dr = peer_stats.get("mean_denial_rate", 0.15)
        std_dr = peer_stats.get("std_denial_rate", 0.05) or 0.05
        dr = stats.get("denial_rate", 0)
        z = (dr - mean_dr) / std_dr
        denial_z_score = min(100, max(0, 50 + z * 20))
        components["denial_rate_z"] = denial_z_score
        if z > 1.5:
            factors.append({"factor": "High denial rate", "z_score": round(z, 2),
                           "detail": f"Denial rate {dr:.1%} vs peer avg {mean_dr:.1%}"})

        # 2. Denial trend (increasing = risky)
        trend = stats.get("denial_trend", 0)
        trend_score = min(100, max(0, 50 + trend * 500))
        components["denial_trend"] = trend_score
        if trend > 0.02:
            factors.append({"factor": "Increasing denial trend",
                           "detail": f"+{trend:.1%} over 90 days"})

        # 3. Coding deviation (high charges vs peers)
        mean_charge = peer_stats.get("mean_avg_charge", 500)
        std_charge = peer_stats.get("std_avg_charge", 200) or 200
        avg_charge = stats.get("avg_charge", 500)
        charge_z = (avg_charge - mean_charge) / std_charge
        coding_score = min(100, max(0, 50 + charge_z * 15))
        components["coding_deviation"] = coding_score
        if charge_z > 2:
            factors.append({"factor": "Coding deviation",
                           "detail": f"Avg charge ${avg_charge:,.0f} vs peer ${mean_charge:,.0f}"})

        # 4. Peer comparison
        peer_dr = peer_stats.get("mean_denial_rate", 0.15)
        peer_comp = min(100, max(0, (dr / max(peer_dr, 0.01)) * 50))
        components["peer_comparison"] = peer_comp

        # 5. Volume factor (very low volume = higher uncertainty)
        vol = stats.get("claim_volume", 0)
        vol_score = 50 if vol > 100 else min(100, max(0, 80 - vol * 0.3))
        components["claim_volume_factor"] = vol_score
        if vol < 20:
            factors.append({"factor": "Low claim volume", "detail": f"{vol} claims (insufficient for reliable scoring)"})

        # 6. Modifier usage
        mod_rate = stats.get("modifier_usage_rate", 0)
        mod_score = min(100, max(0, mod_rate * 200))
        components["modifier_usage"] = mod_score

        total = sum(components[k] * self.WEIGHTS[k] for k in self.WEIGHTS)
        return total, factors

    async def _get_provider_stats(self, db: AsyncSession, provider_id: str) -> Optional[dict]:
        query = text("""
            WITH prov_claims AS (
                SELECT claim_id, total_charges, date_of_service, status
                FROM claims WHERE provider_id = :pid
            ),
            prov_denials AS (
                SELECT d.denial_id, d.claim_id, d.denial_date
                FROM denials d JOIN prov_claims pc ON pc.claim_id = d.claim_id
            ),
            recent_dr AS (
                SELECT
                    COUNT(CASE WHEN d.denial_id IS NOT NULL THEN 1 END)::float
                    / GREATEST(COUNT(*), 1) AS denial_rate
                FROM prov_claims pc
                LEFT JOIN prov_denials d ON d.claim_id = pc.claim_id
            ),
            trend AS (
                SELECT
                    COALESCE(
                        COUNT(CASE WHEN d.denial_date >= CURRENT_DATE - 30 THEN 1 END)::float
                        / GREATEST(COUNT(CASE WHEN d.denial_date >= CURRENT_DATE - 30 THEN 1 END)
                            + COUNT(CASE WHEN d.denial_date < CURRENT_DATE - 30
                                AND d.denial_date >= CURRENT_DATE - 60 THEN 1 END), 1)
                        - COUNT(CASE WHEN d.denial_date < CURRENT_DATE - 30
                            AND d.denial_date >= CURRENT_DATE - 60 THEN 1 END)::float
                        / GREATEST(COUNT(CASE WHEN d.denial_date < CURRENT_DATE - 30
                            AND d.denial_date >= CURRENT_DATE - 60 THEN 1 END)
                            + COUNT(CASE WHEN d.denial_date < CURRENT_DATE - 60
                                AND d.denial_date >= CURRENT_DATE - 90 THEN 1 END), 1),
                    0) AS trend_val
                FROM prov_denials d
            )
            ,modifier_stats AS (
                SELECT
                    COALESCE(
                        COUNT(CASE WHEN cl.modifiers IS NOT NULL AND cl.modifiers != '' THEN 1 END)::float
                        / GREATEST(COUNT(cl.claim_line_id), 1),
                        0
                    ) AS modifier_usage_rate
                FROM claim_lines cl
                WHERE cl.claim_id IN (SELECT claim_id FROM prov_claims)
            )
            SELECT
                r.denial_rate,
                t.trend_val,
                AVG(pc.total_charges) AS avg_charge,
                COUNT(pc.claim_id) AS claim_volume,
                ms.modifier_usage_rate
            FROM recent_dr r, trend t, prov_claims pc, modifier_stats ms
            GROUP BY r.denial_rate, t.trend_val, ms.modifier_usage_rate
        """)
        try:
            result = await db.execute(query, {"pid": provider_id})
            row = result.fetchone()
            if not row:
                return None
            return {
                "denial_rate": float(row[0] or 0),
                "denial_trend": float(row[1] or 0),
                "avg_charge": float(row[2] or 0),
                "claim_volume": int(row[3] or 0),
                "modifier_usage_rate": float(row[4] or 0),
            }
        except Exception as exc:
            logger.warning("Provider stats failed for %s: %s", provider_id, exc)
            return None

    async def _get_peer_stats(self, db: AsyncSession, specialty: Optional[str] = None) -> dict:
        query = text("""
            SELECT
                AVG(sub.dr) AS mean_dr, STDDEV(sub.dr) AS std_dr,
                AVG(sub.avg_ch) AS mean_ch, STDDEV(sub.avg_ch) AS std_ch
            FROM (
                SELECT
                    c.provider_id,
                    COUNT(d.denial_id)::float / GREATEST(COUNT(c.claim_id), 1) AS dr,
                    AVG(c.total_charges) AS avg_ch
                FROM claims c
                LEFT JOIN denials d ON d.claim_id = c.claim_id
                JOIN providers p ON p.provider_id = c.provider_id
                WHERE c.provider_id IS NOT NULL
                  AND (:specialty IS NULL OR p.specialty = :specialty)
                GROUP BY c.provider_id
                HAVING COUNT(c.claim_id) >= 10
            ) sub
        """)
        try:
            result = await db.execute(query, {"specialty": specialty})
            row = result.fetchone()
            if not row:
                return {"mean_denial_rate": 0.15, "std_denial_rate": 0.05,
                        "mean_avg_charge": 500, "std_avg_charge": 200}
            return {
                "mean_denial_rate": float(row[0] or 0.15),
                "std_denial_rate": float(row[1] or 0.05),
                "mean_avg_charge": float(row[2] or 500),
                "std_avg_charge": float(row[3] or 200),
            }
        except Exception:
            return {"mean_denial_rate": 0.15, "std_denial_rate": 0.05,
                    "mean_avg_charge": 500, "std_avg_charge": 200}

    async def _get_all_provider_ids(self, db: AsyncSession) -> list:
        try:
            result = await db.execute(text("SELECT DISTINCT provider_id FROM claims WHERE provider_id IS NOT NULL LIMIT 50"))
            return [r[0] for r in result.fetchall()]
        except Exception:
            return []
