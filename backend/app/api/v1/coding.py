"""
Sprint 20 — Coding Accuracy & Compliance Router
Endpoints for coding audit, compliance patterns, suggestions, and provider analysis.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, Optional

from app.core.deps import get_db

router = APIRouter()

# CARC codes related to coding errors
CODING_ERROR_CARCS = ("CO-4", "CO-16", "CO-97", "4", "16", "97")


@router.get("/audit")
async def coding_audit(
    db: AsyncSession = Depends(get_db),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
) -> Any:
    """Coding accuracy metrics from claims + denials. Counts by CARC codes related to coding errors."""
    try:
        # Total claims count
        total_res = await db.execute(text("SELECT COUNT(*) FROM claims"))
        total_claims = total_res.scalar() or 0

        # Coding-related denials by CARC code
        carc_query = text("""
            SELECT d.carc_code, d.carc_description, COUNT(*) as denial_count,
                   COALESCE(SUM(d.denial_amount), 0) as total_amount
            FROM denials d
            WHERE d.carc_code IN ('CO-4','CO-16','CO-97','4','16','97')
            GROUP BY d.carc_code, d.carc_description
            ORDER BY denial_count DESC
        """)
        carc_res = await db.execute(carc_query)
        carc_rows = carc_res.fetchall()

        coding_denials = [
            {
                "carc_code": row[0],
                "description": row[1],
                "denial_count": row[2],
                "total_amount": float(row[3]),
            }
            for row in carc_rows
        ]

        total_coding_denials = sum(r["denial_count"] for r in coding_denials)

        # Coding accuracy rate
        coding_accuracy = round(
            (1 - (total_coding_denials / total_claims)) * 100, 2
        ) if total_claims > 0 else 100.0

        # Top CPT codes with coding denials
        cpt_query = text("""
            SELECT cl.cpt_code, COUNT(*) as error_count
            FROM denials d
            JOIN claim_lines cl ON d.claim_id = cl.claim_id
            WHERE d.carc_code IN ('CO-4','CO-16','CO-97','4','16','97')
              AND cl.cpt_code IS NOT NULL
            GROUP BY cl.cpt_code
            ORDER BY error_count DESC
            LIMIT 10
        """)
        cpt_res = await db.execute(cpt_query)
        top_error_cpts = [
            {"cpt_code": row[0], "error_count": row[1]}
            for row in cpt_res.fetchall()
        ]

        return {
            "total_claims": total_claims,
            "total_coding_denials": total_coding_denials,
            "coding_accuracy_pct": coding_accuracy,
            "denials_by_carc": coding_denials,
            "top_error_cpt_codes": top_error_cpts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coding audit error: {str(e)}")


@router.get("/compliance")
async def coding_compliance(
    db: AsyncSession = Depends(get_db),
    provider_id: Optional[str] = Query(None),
) -> Any:
    """Modifier usage patterns and coding distribution by provider."""
    try:
        # Modifier usage patterns
        modifier_query = text("""
            SELECT modifier_1, COUNT(*) as usage_count
            FROM claim_lines
            WHERE modifier_1 IS NOT NULL
            GROUP BY modifier_1
            ORDER BY usage_count DESC
            LIMIT 20
        """)
        mod_res = await db.execute(modifier_query)
        modifier_patterns = [
            {"modifier": row[0], "usage_count": row[1]}
            for row in mod_res.fetchall()
        ]

        # Coding distribution by provider
        provider_filter = "WHERE c.provider_id = :provider_id" if provider_id else ""
        params = {"provider_id": provider_id} if provider_id else {}

        dist_query = text(f"""
            SELECT c.provider_id, p.provider_name, p.specialty,
                   COUNT(DISTINCT c.claim_id) as claim_count,
                   COUNT(DISTINCT cl.cpt_code) as unique_cpt_codes,
                   COALESCE(AVG(c.total_charges), 0) as avg_charges
            FROM claims c
            JOIN providers p ON c.provider_id = p.provider_id
            LEFT JOIN claim_lines cl ON c.claim_id = cl.claim_id
            {provider_filter}
            GROUP BY c.provider_id, p.provider_name, p.specialty
            ORDER BY claim_count DESC
            LIMIT 20
        """)
        dist_res = await db.execute(dist_query, params)
        provider_distribution = [
            {
                "provider_id": row[0],
                "provider_name": row[1],
                "specialty": row[2],
                "claim_count": row[3],
                "unique_cpt_codes": row[4],
                "avg_charges": round(float(row[5]), 2),
            }
            for row in dist_res.fetchall()
        ]

        return {
            "modifier_patterns": modifier_patterns,
            "provider_distribution": provider_distribution,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coding compliance error: {str(e)}")


@router.get("/suggestions/{claim_id}")
async def coding_suggestions(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Historical pattern-based code suggestions for a claim."""
    try:
        # Get claim line details
        claim_query = text("""
            SELECT cl.cpt_code, cl.icd10_primary, cl.modifier_1, cl.modifier_2,
                   cl.charge_amount, c.provider_id, c.payer_id
            FROM claim_lines cl
            JOIN claims c ON cl.claim_id = c.claim_id
            WHERE cl.claim_id = :claim_id
        """)
        claim_res = await db.execute(claim_query, {"claim_id": claim_id})
        claim_lines = claim_res.fetchall()

        if not claim_lines:
            raise HTTPException(status_code=404, detail="Claim not found or has no line items")

        suggestions = []
        for line in claim_lines:
            cpt_code = line[0]
            icd10 = line[1]

            # Find similar claims with same CPT+ICD10 that were paid successfully
            similar_query = text("""
                SELECT cl.cpt_code, cl.modifier_1, cl.modifier_2,
                       cl.icd10_primary, COUNT(*) as frequency,
                       COALESCE(AVG(cl.paid_amount), 0) as avg_paid
                FROM claim_lines cl
                JOIN claims c ON cl.claim_id = c.claim_id
                WHERE cl.cpt_code = :cpt_code
                  AND c.status = 'PAID'
                  AND cl.claim_id != :claim_id
                GROUP BY cl.cpt_code, cl.modifier_1, cl.modifier_2, cl.icd10_primary
                ORDER BY frequency DESC
                LIMIT 5
            """)
            sim_res = await db.execute(
                similar_query, {"cpt_code": cpt_code, "claim_id": claim_id}
            )
            similar = [
                {
                    "cpt_code": r[0],
                    "modifier_1": r[1],
                    "modifier_2": r[2],
                    "icd10_primary": r[3],
                    "frequency": r[4],
                    "avg_paid_amount": round(float(r[5]), 2),
                }
                for r in sim_res.fetchall()
            ]

            # Check if this CPT+ICD10 combo has high denial rate
            denial_query = text("""
                SELECT COUNT(*) as denial_count
                FROM denials d
                JOIN claim_lines cl ON d.claim_id = cl.claim_id
                WHERE cl.cpt_code = :cpt_code AND cl.icd10_primary = :icd10
            """)
            denial_res = await db.execute(
                denial_query, {"cpt_code": cpt_code, "icd10": icd10}
            )
            denial_count = denial_res.scalar() or 0

            suggestions.append({
                "current_cpt": cpt_code,
                "current_icd10": icd10,
                "current_modifier": line[2],
                "denial_risk_count": denial_count,
                "similar_paid_patterns": similar,
            })

        return {
            "claim_id": claim_id,
            "provider_id": claim_lines[0][5] if claim_lines else None,
            "payer_id": claim_lines[0][6] if claim_lines else None,
            "line_suggestions": suggestions,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestion error: {str(e)}")


@router.get("/provider-patterns/{provider_id}")
async def provider_coding_patterns(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Provider coding patterns compared to peer average."""
    try:
        # Provider stats
        provider_query = text("""
            SELECT p.provider_id, p.provider_name, p.specialty,
                   COUNT(DISTINCT c.claim_id) as total_claims,
                   COALESCE(AVG(c.total_charges), 0) as avg_charges,
                   COUNT(DISTINCT CASE WHEN c.status = 'DENIED' THEN c.claim_id END) as denied_claims
            FROM providers p
            LEFT JOIN claims c ON p.provider_id = c.provider_id
            WHERE p.provider_id = :provider_id
            GROUP BY p.provider_id, p.provider_name, p.specialty
        """)
        prov_res = await db.execute(provider_query, {"provider_id": provider_id})
        prov_row = prov_res.fetchone()

        if not prov_row:
            raise HTTPException(status_code=404, detail="Provider not found")

        specialty = prov_row[2]
        total_claims = prov_row[3] or 0
        denied_claims = prov_row[5] or 0
        provider_denial_rate = round(
            (denied_claims / total_claims) * 100, 2
        ) if total_claims > 0 else 0.0

        # Peer average (same specialty)
        peer_query = text("""
            SELECT COUNT(DISTINCT c.claim_id) as total_claims,
                   COALESCE(AVG(c.total_charges), 0) as avg_charges,
                   COUNT(DISTINCT CASE WHEN c.status = 'DENIED' THEN c.claim_id END) as denied_claims
            FROM claims c
            JOIN providers p ON c.provider_id = p.provider_id
            WHERE p.specialty = :specialty
              AND p.provider_id != :provider_id
        """)
        peer_res = await db.execute(
            peer_query, {"specialty": specialty, "provider_id": provider_id}
        )
        peer_row = peer_res.fetchone()
        peer_total = peer_row[0] or 0
        peer_denied = peer_row[2] or 0
        peer_denial_rate = round(
            (peer_denied / peer_total) * 100, 2
        ) if peer_total > 0 else 0.0

        # Top CPT codes used by provider
        cpt_query = text("""
            SELECT cl.cpt_code, COUNT(*) as usage_count
            FROM claim_lines cl
            JOIN claims c ON cl.claim_id = c.claim_id
            WHERE c.provider_id = :provider_id AND cl.cpt_code IS NOT NULL
            GROUP BY cl.cpt_code
            ORDER BY usage_count DESC
            LIMIT 10
        """)
        cpt_res = await db.execute(cpt_query, {"provider_id": provider_id})
        top_cpts = [
            {"cpt_code": r[0], "usage_count": r[1]}
            for r in cpt_res.fetchall()
        ]

        return {
            "provider": {
                "provider_id": prov_row[0],
                "provider_name": prov_row[1],
                "specialty": specialty,
                "total_claims": total_claims,
                "avg_charges": round(float(prov_row[4]), 2),
                "denial_rate_pct": provider_denial_rate,
            },
            "peer_average": {
                "specialty": specialty,
                "total_claims": peer_total,
                "avg_charges": round(float(peer_row[1]), 2) if peer_row[1] else 0.0,
                "denial_rate_pct": peer_denial_rate,
            },
            "top_cpt_codes": top_cpts,
            "variance": {
                "denial_rate_diff": round(provider_denial_rate - peer_denial_rate, 2),
                "charges_diff": round(
                    float(prov_row[4] or 0) - float(peer_row[1] or 0), 2
                ),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Provider patterns error: {str(e)}")
