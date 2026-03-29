"""
Sprint 21 — Compliance Engine Service
Functions for overcoding risk, FCA risk scoring, and OIG audit risk analysis.
"""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

# OIG Work Plan focus areas (common high-risk categories)
OIG_FOCUS_AREAS = [
    {"area": "Evaluation & Management Upcoding", "cpt_range": ("99213", "99215"), "description": "E&M codes billed at higher levels than documented"},
    {"area": "Modifier 25 Overuse", "modifier": "25", "description": "Significant, separately identifiable E&M on same day as procedure"},
    {"area": "Duplicate Claims", "description": "Same service billed multiple times"},
    {"area": "Unbundling", "description": "Services that should be billed together billed separately"},
    {"area": "Place of Service Errors", "description": "Incorrect place of service code leading to higher reimbursement"},
]

# Specialty-level benchmarks for coding distribution (synthetic)
SPECIALTY_BENCHMARKS = {
    "Internal Medicine": {"avg_charges": 185.0, "denial_rate": 0.08, "e_m_ratio": 0.65},
    "Cardiology": {"avg_charges": 320.0, "denial_rate": 0.10, "e_m_ratio": 0.45},
    "Orthopedics": {"avg_charges": 450.0, "denial_rate": 0.09, "e_m_ratio": 0.30},
    "Family Medicine": {"avg_charges": 160.0, "denial_rate": 0.07, "e_m_ratio": 0.70},
    "Dermatology": {"avg_charges": 210.0, "denial_rate": 0.06, "e_m_ratio": 0.50},
    "Neurology": {"avg_charges": 280.0, "denial_rate": 0.11, "e_m_ratio": 0.55},
    "General Surgery": {"avg_charges": 520.0, "denial_rate": 0.08, "e_m_ratio": 0.20},
    "default": {"avg_charges": 250.0, "denial_rate": 0.08, "e_m_ratio": 0.50},
}


async def get_overcoding_risk(
    db: AsyncSession,
    provider_id: Optional[str] = None,
) -> dict:
    """
    Compare provider coding patterns vs specialty benchmarks.
    Returns risk flags for providers whose average charges or E&M usage
    significantly exceed their specialty peers.
    """
    try:
        if provider_id:
            provider_query = text("""
                SELECT p.provider_id, p.provider_name, p.specialty,
                       COUNT(DISTINCT c.claim_id) as claim_count,
                       COALESCE(AVG(c.total_charges), 0) as avg_charges,
                       COUNT(DISTINCT CASE WHEN c.status = 'DENIED' THEN c.claim_id END) as denied_count
                FROM providers p
                LEFT JOIN claims c ON p.provider_id = c.provider_id
                WHERE p.provider_id = :provider_id
                GROUP BY p.provider_id, p.provider_name, p.specialty
            """)
            res = await db.execute(provider_query, {"provider_id": provider_id})
        else:
            provider_query = text("""
                SELECT p.provider_id, p.provider_name, p.specialty,
                       COUNT(DISTINCT c.claim_id) as claim_count,
                       COALESCE(AVG(c.total_charges), 0) as avg_charges,
                       COUNT(DISTINCT CASE WHEN c.status = 'DENIED' THEN c.claim_id END) as denied_count
                FROM providers p
                LEFT JOIN claims c ON p.provider_id = c.provider_id
                GROUP BY p.provider_id, p.provider_name, p.specialty
                HAVING COUNT(DISTINCT c.claim_id) > 0
                ORDER BY AVG(c.total_charges) DESC
            """)
            res = await db.execute(provider_query)

        rows = res.fetchall()
        risk_results = []

        for row in rows:
            prov_id, name, specialty, claim_count, avg_charges, denied = row
            benchmark = SPECIALTY_BENCHMARKS.get(specialty, SPECIALTY_BENCHMARKS["default"])
            avg_charges_f = float(avg_charges)
            charge_ratio = avg_charges_f / benchmark["avg_charges"] if benchmark["avg_charges"] > 0 else 1.0
            denial_rate = (denied / claim_count) if claim_count > 0 else 0

            risk_flags = []
            risk_score = 0

            if charge_ratio > 1.3:
                risk_flags.append("HIGH_CHARGES: Avg charges 30%+ above specialty benchmark")
                risk_score += 30
            elif charge_ratio > 1.15:
                risk_flags.append("ELEVATED_CHARGES: Avg charges 15%+ above specialty benchmark")
                risk_score += 15

            if denial_rate > benchmark["denial_rate"] * 1.5:
                risk_flags.append("HIGH_DENIAL_RATE: Denial rate significantly above benchmark")
                risk_score += 25

            risk_score = min(risk_score, 100)

            risk_results.append({
                "provider_id": prov_id,
                "provider_name": name,
                "specialty": specialty,
                "claim_count": claim_count,
                "avg_charges": round(avg_charges_f, 2),
                "benchmark_avg_charges": benchmark["avg_charges"],
                "charge_ratio": round(charge_ratio, 2),
                "denial_rate_pct": round(denial_rate * 100, 2),
                "benchmark_denial_rate_pct": round(benchmark["denial_rate"] * 100, 2),
                "risk_score": risk_score,
                "risk_flags": risk_flags,
                "risk_level": (
                    "HIGH" if risk_score >= 40
                    else "MEDIUM" if risk_score >= 15
                    else "LOW"
                ),
            })

        return {
            "providers_analyzed": len(risk_results),
            "high_risk_count": sum(1 for r in risk_results if r["risk_level"] == "HIGH"),
            "results": sorted(risk_results, key=lambda x: x["risk_score"], reverse=True),
        }
    except Exception as e:
        logger.error("Overcoding risk error: %s", e)
        return {"providers_analyzed": 0, "high_risk_count": 0, "results": [], "error": str(e)}


async def get_fca_risk_score(db: AsyncSession) -> dict:
    """
    Composite False Claims Act risk score (0-100).
    Evaluates: upcoding patterns, duplicate billing, modifier misuse, documentation gaps.
    """
    try:
        risk_components = {}

        # 1. Coding error denial rate (weight: 30)
        coding_query = text("""
            SELECT COUNT(*) as coding_denials
            FROM denials
            WHERE carc_code IN ('CO-4','CO-16','CO-97','4','16','97')
        """)
        total_query = text("SELECT COUNT(*) FROM denials")
        coding_count = (await db.execute(coding_query)).scalar() or 0
        total_denials = (await db.execute(total_query)).scalar() or 1
        coding_ratio = coding_count / total_denials
        coding_score = min(coding_ratio * 100 * 3, 30)
        risk_components["coding_error_rate"] = {
            "score": round(coding_score, 1),
            "max": 30,
            "coding_denials": coding_count,
            "total_denials": total_denials,
        }

        # 2. High-value claim concentration (weight: 25)
        high_val_query = text("""
            SELECT COUNT(*) as high_value_claims,
                   (SELECT COUNT(*) FROM claims) as total_claims
            FROM claims
            WHERE total_charges > (SELECT AVG(total_charges) * 2 FROM claims)
        """)
        hv_res = await db.execute(high_val_query)
        hv_row = hv_res.fetchone()
        hv_count = hv_row[0] or 0
        total_claims = hv_row[1] or 1
        hv_ratio = hv_count / total_claims
        hv_score = min(hv_ratio * 100 * 5, 25)
        risk_components["high_value_concentration"] = {
            "score": round(hv_score, 1),
            "max": 25,
            "high_value_claims": hv_count,
        }

        # 3. Denial pattern recurrence (weight: 25)
        recurrence_query = text("""
            SELECT COUNT(*) as recurring
            FROM denials
            WHERE similar_denial_30d > 2
        """)
        recurring = (await db.execute(recurrence_query)).scalar() or 0
        recur_ratio = recurring / total_denials
        recur_score = min(recur_ratio * 100 * 2.5, 25)
        risk_components["denial_recurrence"] = {
            "score": round(recur_score, 1),
            "max": 25,
            "recurring_denials": recurring,
        }

        # 4. Missing documentation / CRS failures (weight: 20)
        crs_query = text("""
            SELECT COUNT(*) as crs_failures
            FROM claims
            WHERE crs_passed = false
        """)
        crs_failures = (await db.execute(crs_query)).scalar() or 0
        crs_ratio = crs_failures / total_claims
        crs_score = min(crs_ratio * 100 * 2, 20)
        risk_components["documentation_gaps"] = {
            "score": round(crs_score, 1),
            "max": 20,
            "crs_failures": crs_failures,
        }

        composite_score = round(
            coding_score + hv_score + recur_score + crs_score, 1
        )
        composite_score = min(composite_score, 100)

        return {
            "fca_risk_score": composite_score,
            "risk_level": (
                "CRITICAL" if composite_score >= 70
                else "HIGH" if composite_score >= 50
                else "MEDIUM" if composite_score >= 25
                else "LOW"
            ),
            "components": risk_components,
        }
    except Exception as e:
        logger.error("FCA risk score error: %s", e)
        return {"fca_risk_score": 0, "risk_level": "UNKNOWN", "components": {}, "error": str(e)}


async def get_audit_risk(db: AsyncSession) -> dict:
    """
    Match current billing patterns against OIG Work Plan focus areas.
    Returns risk indicators for each OIG focus area.
    """
    try:
        audit_risks = []

        # 1. E&M Upcoding — check distribution of E&M codes
        em_query = text("""
            SELECT cl.cpt_code, COUNT(*) as freq
            FROM claim_lines cl
            WHERE cl.cpt_code LIKE '992%'
            GROUP BY cl.cpt_code
            ORDER BY cl.cpt_code
        """)
        em_res = await db.execute(em_query)
        em_dist = {r[0]: r[1] for r in em_res.fetchall()}
        total_em = sum(em_dist.values()) or 1

        # High-level E&M codes (99214, 99215) should not dominate
        high_em = sum(em_dist.get(code, 0) for code in ("99214", "99215"))
        high_em_pct = round((high_em / total_em) * 100, 2)
        em_risk = "HIGH" if high_em_pct > 60 else "MEDIUM" if high_em_pct > 40 else "LOW"
        audit_risks.append({
            "area": "E&M Upcoding",
            "description": "High-level E&M codes (99214/99215) as percentage of all E&M",
            "metric_value": high_em_pct,
            "threshold": 50.0,
            "risk_level": em_risk,
            "distribution": em_dist,
        })

        # 2. Modifier 25 overuse
        mod25_query = text("""
            SELECT COUNT(*) FROM claim_lines WHERE modifier_1 = '25' OR modifier_2 = '25'
        """)
        total_lines_query = text("SELECT COUNT(*) FROM claim_lines")
        mod25_count = (await db.execute(mod25_query)).scalar() or 0
        total_lines = (await db.execute(total_lines_query)).scalar() or 1
        mod25_pct = round((mod25_count / total_lines) * 100, 2)
        audit_risks.append({
            "area": "Modifier 25 Overuse",
            "description": "Percentage of claim lines using modifier 25",
            "metric_value": mod25_pct,
            "threshold": 15.0,
            "risk_level": "HIGH" if mod25_pct > 20 else "MEDIUM" if mod25_pct > 10 else "LOW",
            "count": mod25_count,
        })

        # 3. Duplicate claim risk
        dup_query = text("""
            SELECT COUNT(*) as dup_count
            FROM (
                SELECT patient_id, provider_id, date_of_service, total_charges, COUNT(*) as cnt
                FROM claims
                GROUP BY patient_id, provider_id, date_of_service, total_charges
                HAVING COUNT(*) > 1
            ) dups
        """)
        dup_count = (await db.execute(dup_query)).scalar() or 0
        audit_risks.append({
            "area": "Duplicate Claims",
            "description": "Potential duplicate claims (same patient/provider/DOS/charges)",
            "metric_value": dup_count,
            "threshold": 0,
            "risk_level": "HIGH" if dup_count > 10 else "MEDIUM" if dup_count > 0 else "LOW",
        })

        # 4. Place of Service errors — claims with missing POS
        pos_query = text("""
            SELECT COUNT(*) FROM claims WHERE place_of_service IS NULL
        """)
        pos_missing = (await db.execute(pos_query)).scalar() or 0
        total_claims = (await db.execute(text("SELECT COUNT(*) FROM claims"))).scalar() or 1
        pos_pct = round((pos_missing / total_claims) * 100, 2)
        audit_risks.append({
            "area": "Place of Service Gaps",
            "description": "Claims missing place of service code",
            "metric_value": pos_pct,
            "threshold": 5.0,
            "risk_level": "HIGH" if pos_pct > 10 else "MEDIUM" if pos_pct > 5 else "LOW",
            "missing_count": pos_missing,
        })

        overall_high = sum(1 for r in audit_risks if r["risk_level"] == "HIGH")
        overall_risk = "HIGH" if overall_high >= 2 else "MEDIUM" if overall_high >= 1 else "LOW"

        return {
            "overall_risk_level": overall_risk,
            "oig_focus_areas_checked": len(audit_risks),
            "high_risk_areas": overall_high,
            "audit_risks": audit_risks,
        }
    except Exception as e:
        logger.error("Audit risk error: %s", e)
        return {"overall_risk_level": "UNKNOWN", "audit_risks": [], "error": str(e)}
