"""
Sprint 20 — EVV (Electronic Visit Verification) Router
Endpoints for visit data, fraud detection, and state mandate compliance.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, Optional

from app.core.deps import get_db

router = APIRouter()


@router.get("/visits")
async def evv_visits(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None, description="VERIFIED | EXCEPTION | DENIED"),
    state_code: Optional[str] = Query(None, description="Two-letter state code"),
    patient_id: Optional[str] = Query(None),
) -> Any:
    """Return EVV visit data with filtering and pagination."""
    try:
        filters = []
        params: dict = {"limit": size, "offset": (page - 1) * size}

        if status:
            filters.append("v.evv_status = :status")
            params["status"] = status
        if state_code:
            filters.append("v.state_code = :state_code")
            params["state_code"] = state_code
        if patient_id:
            filters.append("v.patient_id = :patient_id")
            params["patient_id"] = patient_id

        where_clause = "WHERE " + " AND ".join(filters) if filters else ""

        query = text(f"""
            SELECT v.evv_id, v.patient_id, v.claim_id, v.caregiver_id,
                   v.aggregator, v.state_code, v.service_code, v.service_description,
                   v.visit_date, v.scheduled_start, v.scheduled_end,
                   v.actual_clock_in, v.actual_clock_out,
                   v.scheduled_duration_min, v.actual_duration_min,
                   v.gps_verified, v.gps_distance_at_in_ft, v.gps_distance_at_out_ft,
                   v.evv_status, v.evv_denial_code, v.billable,
                   v.units_scheduled, v.units_verified
            FROM evv_visits v
            {where_clause}
            ORDER BY v.visit_date DESC
            LIMIT :limit OFFSET :offset
        """)
        result = await db.execute(query, params)
        rows = result.fetchall()

        visits = [
            {
                "evv_id": r[0], "patient_id": r[1], "claim_id": r[2],
                "caregiver_id": r[3], "aggregator": r[4], "state_code": r[5],
                "service_code": r[6], "service_description": r[7],
                "visit_date": str(r[8]) if r[8] else None,
                "scheduled_start": str(r[9]) if r[9] else None,
                "scheduled_end": str(r[10]) if r[10] else None,
                "actual_clock_in": str(r[11]) if r[11] else None,
                "actual_clock_out": str(r[12]) if r[12] else None,
                "scheduled_duration_min": r[13], "actual_duration_min": r[14],
                "gps_verified": r[15],
                "gps_distance_at_in_ft": r[16], "gps_distance_at_out_ft": r[17],
                "evv_status": r[18], "evv_denial_code": r[19], "billable": r[20],
                "units_scheduled": r[21], "units_verified": r[22],
            }
            for r in rows
        ]

        # Total count
        count_query = text(f"SELECT COUNT(*) FROM evv_visits v {where_clause}")
        count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
        total = (await db.execute(count_query, count_params)).scalar() or 0

        return {"total": total, "page": page, "size": size, "items": visits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"EVV visits error: {str(e)}")


@router.get("/fraud-detection")
async def evv_fraud_detection(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fraud risk analysis based on EVV visit patterns and claims data."""
    try:
        # 1. GPS verification failures
        gps_query = text("""
            SELECT COUNT(*) as total_visits,
                   COUNT(CASE WHEN gps_verified = false THEN 1 END) as gps_failures,
                   COUNT(CASE WHEN gps_distance_at_in_ft > 500 THEN 1 END) as distant_checkins
            FROM evv_visits
        """)
        gps_res = await db.execute(gps_query)
        gps_row = gps_res.fetchone()
        total_visits = gps_row[0] or 0
        gps_failures = gps_row[1] or 0
        distant_checkins = gps_row[2] or 0

        # 2. Duration anomalies (actual much shorter than scheduled)
        duration_query = text("""
            SELECT COUNT(*) as anomalies
            FROM evv_visits
            WHERE actual_duration_min IS NOT NULL
              AND scheduled_duration_min IS NOT NULL
              AND actual_duration_min < scheduled_duration_min * 0.5
              AND evv_status != 'DENIED'
        """)
        dur_res = await db.execute(duration_query)
        duration_anomalies = dur_res.scalar() or 0

        # 3. Missing signatures
        sig_query = text("""
            SELECT COUNT(*) as missing_signatures
            FROM evv_visits
            WHERE (caregiver_signature = false OR patient_signature = false)
              AND evv_status = 'VERIFIED'
        """)
        sig_res = await db.execute(sig_query)
        missing_signatures = sig_res.scalar() or 0

        # 4. Caregiver overlap risk (same caregiver, overlapping times, same date)
        overlap_query = text("""
            SELECT v1.caregiver_id, COUNT(*) as overlap_count
            FROM evv_visits v1
            JOIN evv_visits v2 ON v1.caregiver_id = v2.caregiver_id
              AND v1.visit_date = v2.visit_date
              AND v1.evv_id != v2.evv_id
              AND v1.actual_clock_in < v2.actual_clock_out
              AND v1.actual_clock_out > v2.actual_clock_in
            GROUP BY v1.caregiver_id
            HAVING COUNT(*) > 1
            ORDER BY overlap_count DESC
            LIMIT 10
        """)
        overlap_res = await db.execute(overlap_query)
        overlap_risks = [
            {"caregiver_id": r[0], "overlap_count": r[1]}
            for r in overlap_res.fetchall()
        ]

        # Composite fraud risk score
        risk_score = 0
        if total_visits > 0:
            gps_fail_rate = gps_failures / total_visits
            risk_score += min(gps_fail_rate * 100, 30)
            risk_score += min((duration_anomalies / total_visits) * 100, 25)
            risk_score += min((missing_signatures / total_visits) * 100, 20)
            risk_score += min(len(overlap_risks) * 5, 25)
        risk_score = round(min(risk_score, 100), 1)

        return {
            "fraud_risk_score": risk_score,
            "total_visits_analyzed": total_visits,
            "indicators": {
                "gps_verification_failures": gps_failures,
                "distant_checkins_over_500ft": distant_checkins,
                "duration_anomalies": duration_anomalies,
                "missing_signatures_on_verified": missing_signatures,
                "caregiver_overlap_risks": overlap_risks,
            },
            "risk_level": (
                "HIGH" if risk_score >= 60
                else "MEDIUM" if risk_score >= 30
                else "LOW"
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud detection error: {str(e)}")


@router.get("/state-mandates")
async def evv_state_mandates(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """State compliance rules and current EVV compliance status by state."""
    try:
        # State mandate rules (structured reference data)
        state_mandates = [
            {"state": "NY", "mandate": "21st Century Cures Act", "aggregators": ["Sandata", "HHAeXchange"], "gps_required": True, "signature_required": True, "effective_date": "2021-01-01"},
            {"state": "TX", "mandate": "21st Century Cures Act", "aggregators": ["AuthentiCare", "Sandata"], "gps_required": True, "signature_required": True, "effective_date": "2021-01-01"},
            {"state": "CA", "mandate": "IHSS EVV Compliance", "aggregators": ["Sandata"], "gps_required": True, "signature_required": False, "effective_date": "2023-01-01"},
            {"state": "FL", "mandate": "Medicaid EVV Mandate", "aggregators": ["Sandata", "Netsmart"], "gps_required": True, "signature_required": True, "effective_date": "2021-07-01"},
            {"state": "PA", "mandate": "DHS EVV Requirement", "aggregators": ["Sandata", "HHAeXchange"], "gps_required": True, "signature_required": True, "effective_date": "2021-01-01"},
            {"state": "OH", "mandate": "Medicaid EVV Compliance", "aggregators": ["Sandata"], "gps_required": True, "signature_required": True, "effective_date": "2021-01-01"},
            {"state": "IL", "mandate": "HFS EVV Rule", "aggregators": ["Sandata", "AuthentiCare"], "gps_required": True, "signature_required": False, "effective_date": "2022-01-01"},
            {"state": "NJ", "mandate": "DHS EVV Mandate", "aggregators": ["Sandata", "HHAeXchange"], "gps_required": True, "signature_required": True, "effective_date": "2021-01-01"},
        ]

        # Current compliance by state from actual visit data
        compliance_query = text("""
            SELECT state_code,
                   COUNT(*) as total_visits,
                   COUNT(CASE WHEN evv_status = 'VERIFIED' THEN 1 END) as verified,
                   COUNT(CASE WHEN evv_status = 'EXCEPTION' THEN 1 END) as exceptions,
                   COUNT(CASE WHEN evv_status = 'DENIED' THEN 1 END) as denied,
                   COUNT(CASE WHEN gps_verified = true THEN 1 END) as gps_verified_count
            FROM evv_visits
            WHERE state_code IS NOT NULL
            GROUP BY state_code
            ORDER BY total_visits DESC
        """)
        comp_res = await db.execute(compliance_query)
        state_compliance = [
            {
                "state_code": r[0],
                "total_visits": r[1],
                "verified": r[2],
                "exceptions": r[3],
                "denied": r[4],
                "gps_verified": r[5],
                "compliance_rate_pct": round((r[2] / r[1]) * 100, 2) if r[1] > 0 else 0.0,
            }
            for r in comp_res.fetchall()
        ]

        return {
            "state_mandates": state_mandates,
            "current_compliance": state_compliance,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"State mandates error: {str(e)}")
