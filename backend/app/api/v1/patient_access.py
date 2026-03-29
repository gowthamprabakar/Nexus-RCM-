"""
Sprint 20 — Patient Access Router
Endpoints for eligibility, prior auth, benefits, and cost estimates.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, Optional

from app.core.deps import get_db

router = APIRouter()


@router.get("/eligibility/{patient_id}")
async def patient_eligibility(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Query eligibility_271 table for a patient's eligibility records."""
    try:
        query = text("""
            SELECT e.elig_id, e.patient_id, e.payer_id, e.inquiry_date,
                   e.subscriber_status, e.coverage_effective, e.coverage_term,
                   e.deductible_remaining, e.oop_remaining,
                   e.prior_auth_required, e.referral_required,
                   e.network_status, e.plan_type,
                   e.response_code, e.response_message,
                   pm.payer_name
            FROM eligibility_271 e
            LEFT JOIN payer_master pm ON e.payer_id = pm.payer_id
            WHERE e.patient_id = :patient_id
            ORDER BY e.inquiry_date DESC
        """)
        result = await db.execute(query, {"patient_id": patient_id})
        rows = result.fetchall()

        if not rows:
            raise HTTPException(status_code=404, detail="No eligibility records found for patient")

        records = [
            {
                "elig_id": r[0], "patient_id": r[1], "payer_id": r[2],
                "inquiry_date": str(r[3]) if r[3] else None,
                "subscriber_status": r[4],
                "coverage_effective": str(r[5]) if r[5] else None,
                "coverage_term": str(r[6]) if r[6] else None,
                "deductible_remaining": float(r[7]) if r[7] is not None else None,
                "oop_remaining": float(r[8]) if r[8] is not None else None,
                "prior_auth_required": r[9], "referral_required": r[10],
                "network_status": r[11], "plan_type": r[12],
                "response_code": r[13], "response_message": r[14],
                "payer_name": r[15],
            }
            for r in rows
        ]

        # Latest record summary
        latest = records[0]
        return {
            "patient_id": patient_id,
            "latest_status": latest["subscriber_status"],
            "latest_inquiry_date": latest["inquiry_date"],
            "total_records": len(records),
            "records": records,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eligibility error: {str(e)}")


@router.get("/prior-auth")
async def prior_authorizations(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None, description="APPROVED | DENIED | PENDING | EXPIRED"),
    patient_id: Optional[str] = Query(None),
    payer_id: Optional[str] = Query(None),
) -> Any:
    """Query prior_authorization table with pagination and filters."""
    try:
        filters = []
        params: dict = {"limit": size, "offset": (page - 1) * size}

        if status:
            filters.append("pa.status = :status")
            params["status"] = status
        if patient_id:
            filters.append("pa.patient_id = :patient_id")
            params["patient_id"] = patient_id
        if payer_id:
            filters.append("pa.payer_id = :payer_id")
            params["payer_id"] = payer_id

        where_clause = "WHERE " + " AND ".join(filters) if filters else ""

        query = text(f"""
            SELECT pa.auth_id, pa.claim_id, pa.patient_id, pa.payer_id,
                   pa.auth_number, pa.auth_type, pa.requested_date, pa.approved_date,
                   pa.expiry_date, pa.approved_cpt_codes, pa.approved_units,
                   pa.status, pa.denial_reason,
                   pm.payer_name
            FROM prior_auth pa
            LEFT JOIN payer_master pm ON pa.payer_id = pm.payer_id
            {where_clause}
            ORDER BY pa.requested_date DESC
            LIMIT :limit OFFSET :offset
        """)
        result = await db.execute(query, params)
        rows = result.fetchall()

        items = [
            {
                "auth_id": r[0], "claim_id": r[1], "patient_id": r[2],
                "payer_id": r[3], "auth_number": r[4], "auth_type": r[5],
                "requested_date": str(r[6]) if r[6] else None,
                "approved_date": str(r[7]) if r[7] else None,
                "expiry_date": str(r[8]) if r[8] else None,
                "approved_cpt_codes": r[9], "approved_units": r[10],
                "status": r[11], "denial_reason": r[12],
                "payer_name": r[13],
            }
            for r in rows
        ]

        count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
        count_query = text(f"SELECT COUNT(*) FROM prior_auth pa {where_clause}")
        total = (await db.execute(count_query, count_params)).scalar() or 0

        return {"total": total, "page": page, "size": size, "items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prior auth error: {str(e)}")


@router.get("/benefits/{patient_id}")
async def patient_benefits(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Benefits summary from insurance_coverage table."""
    try:
        query = text("""
            SELECT ic.coverage_id, ic.patient_id, ic.payer_id, ic.coverage_type,
                   ic.group_number, ic.member_id, ic.subscriber_id,
                   ic.effective_date, ic.term_date,
                   ic.deductible_individual, ic.deductible_met_ytd,
                   ic.oop_max, ic.oop_met_ytd,
                   ic.copay, ic.coinsurance_pct,
                   pm.payer_name, pm.payer_group
            FROM insurance_coverage ic
            LEFT JOIN payer_master pm ON ic.payer_id = pm.payer_id
            WHERE ic.patient_id = :patient_id
            ORDER BY ic.coverage_type
        """)
        result = await db.execute(query, {"patient_id": patient_id})
        rows = result.fetchall()

        if not rows:
            raise HTTPException(status_code=404, detail="No benefits found for patient")

        coverages = [
            {
                "coverage_id": r[0], "patient_id": r[1], "payer_id": r[2],
                "coverage_type": r[3], "group_number": r[4],
                "member_id": r[5], "subscriber_id": r[6],
                "effective_date": str(r[7]) if r[7] else None,
                "term_date": str(r[8]) if r[8] else None,
                "deductible_individual": float(r[9]) if r[9] is not None else 0.0,
                "deductible_met_ytd": float(r[10]) if r[10] is not None else 0.0,
                "oop_max": float(r[11]) if r[11] is not None else 0.0,
                "oop_met_ytd": float(r[12]) if r[12] is not None else 0.0,
                "copay": float(r[13]) if r[13] is not None else 0.0,
                "coinsurance_pct": float(r[14]) if r[14] is not None else 0.0,
                "payer_name": r[15],
                "payer_group": r[16],
            }
            for r in rows
        ]

        # Summary
        primary = next((c for c in coverages if c["coverage_type"] == "PRIMARY"), None)
        total_deductible_remaining = sum(
            (c["deductible_individual"] - c["deductible_met_ytd"]) for c in coverages
        )
        total_oop_remaining = sum(
            (c["oop_max"] - c["oop_met_ytd"]) for c in coverages
        )

        return {
            "patient_id": patient_id,
            "total_coverages": len(coverages),
            "primary_payer": primary["payer_name"] if primary else None,
            "total_deductible_remaining": round(total_deductible_remaining, 2),
            "total_oop_remaining": round(total_oop_remaining, 2),
            "coverages": coverages,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benefits error: {str(e)}")


@router.get("/cost-estimate/{claim_id}")
async def cost_estimate(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Estimate patient out-of-pocket cost from claim + payer + coverage data."""
    try:
        # Get claim data
        claim_query = text("""
            SELECT c.claim_id, c.patient_id, c.payer_id, c.coverage_id,
                   c.total_charges, c.expected_allowed, c.expected_patient_liability,
                   pm.payer_name, pm.avg_payment_rate
            FROM claims c
            LEFT JOIN payer_master pm ON c.payer_id = pm.payer_id
            WHERE c.claim_id = :claim_id
        """)
        claim_res = await db.execute(claim_query, {"claim_id": claim_id})
        claim_row = claim_res.fetchone()

        if not claim_row:
            raise HTTPException(status_code=404, detail="Claim not found")

        total_charges = float(claim_row[4] or 0)
        expected_allowed = float(claim_row[5] or 0)
        patient_id = claim_row[1]
        coverage_id = claim_row[3]
        payer_payment_rate = float(claim_row[8] or 0.8)

        # Get coverage data
        cov_query = text("""
            SELECT deductible_individual, deductible_met_ytd,
                   oop_max, oop_met_ytd, copay, coinsurance_pct
            FROM insurance_coverage
            WHERE coverage_id = :coverage_id
        """)
        cov_res = await db.execute(cov_query, {"coverage_id": coverage_id})
        cov_row = cov_res.fetchone()

        if cov_row:
            deductible_remaining = max(float(cov_row[0] or 0) - float(cov_row[1] or 0), 0)
            oop_remaining = max(float(cov_row[2] or 0) - float(cov_row[3] or 0), 0)
            copay = float(cov_row[4] or 0)
            coinsurance_pct = float(cov_row[5] or 0)
        else:
            deductible_remaining = 0.0
            oop_remaining = 0.0
            copay = 0.0
            coinsurance_pct = 0.20

        # Estimate allowed amount
        allowed = expected_allowed if expected_allowed > 0 else total_charges * payer_payment_rate

        # Patient responsibility calculation
        # 1. Deductible applies first
        deductible_applied = min(deductible_remaining, allowed)
        after_deductible = allowed - deductible_applied

        # 2. Coinsurance on remainder
        coinsurance_amount = after_deductible * coinsurance_pct

        # 3. Add copay
        estimated_oop = deductible_applied + coinsurance_amount + copay

        # 4. Cap at OOP max remaining
        estimated_oop = min(estimated_oop, oop_remaining) if oop_remaining > 0 else estimated_oop

        # Payer responsibility
        estimated_payer = allowed - estimated_oop

        return {
            "claim_id": claim_id,
            "patient_id": patient_id,
            "payer_name": claim_row[7],
            "total_charges": round(total_charges, 2),
            "estimated_allowed": round(allowed, 2),
            "breakdown": {
                "deductible_applied": round(deductible_applied, 2),
                "coinsurance_amount": round(coinsurance_amount, 2),
                "copay": round(copay, 2),
            },
            "estimated_patient_oop": round(estimated_oop, 2),
            "estimated_payer_payment": round(estimated_payer, 2),
            "oop_remaining_after": round(max(oop_remaining - estimated_oop, 0), 2),
            "note": "Estimate based on current coverage data. Actual amounts may vary.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cost estimate error: {str(e)}")
