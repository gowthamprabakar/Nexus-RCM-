"""
Prevention Engine API — Proactive Denial Prevention
=====================================================
GET  /prevention/scan              — run full prevention scan, return alerts + summary
GET  /prevention/summary           — just the summary stats
GET  /prevention/alerts            — paginated alert list with filters (type, severity, payer)
POST /prevention/dismiss/{alert_id} — dismiss an alert (mark as reviewed)
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.deps import get_db
from app.services.prevention_service import scan_claims_for_prevention, get_prevention_summary, _bust_prevention_cache

router = APIRouter()

# In-memory store for dismissed alerts (production would persist to DB)
_dismissed: set = set()


# ---------------------------------------------------------------------------
# GET /prevention/scan
# ---------------------------------------------------------------------------
@router.get("/scan")
async def prevention_scan(
    limit: int = Query(100, ge=1, le=500, description="Max alerts to return"),
    db: AsyncSession = Depends(get_db),
):
    """Run the full 5-rule prevention scan and return alerts + summary."""
    result = await scan_claims_for_prevention(db, limit=limit)
    # Filter out dismissed alerts
    result["alerts"] = [a for a in result["alerts"] if a["alert_id"] not in _dismissed]
    result["summary"]["dismissed_count"] = len(_dismissed)
    return result


# ---------------------------------------------------------------------------
# GET /prevention/summary
# ---------------------------------------------------------------------------
@router.get("/summary")
async def prevention_summary(db: AsyncSession = Depends(get_db)):
    """Return only the summary stats (no individual alerts)."""
    summary = await get_prevention_summary(db)
    summary["dismissed_count"] = len(_dismissed)
    return summary


# ---------------------------------------------------------------------------
# GET /prevention/alerts
# ---------------------------------------------------------------------------
@router.get("/alerts")
async def prevention_alerts(
    prevention_type: Optional[str] = Query(None, description="Filter by type: ELIGIBILITY_RISK, AUTH_EXPIRY, TIMELY_FILING_RISK, DUPLICATE_CLAIM, HIGH_RISK_PAYER_CPT"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, WARNING, INFO"),
    payer: Optional[str] = Query(None, description="Filter by payer name (partial match)"),
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated, filterable prevention alerts."""
    result = await scan_claims_for_prevention(db, limit=500)
    alerts = result["alerts"]

    # Filter out dismissed
    alerts = [a for a in alerts if a["alert_id"] not in _dismissed]

    # Apply filters
    if prevention_type:
        alerts = [a for a in alerts if a["prevention_type"] == prevention_type.upper()]
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity.upper()]
    if payer:
        payer_lower = payer.lower()
        alerts = [a for a in alerts if payer_lower in a.get("payer_name", "").lower()]

    # Paginate
    total = len(alerts)
    start = (page - 1) * size
    end = start + size
    page_alerts = alerts[start:end]

    return {
        "alerts": page_alerts,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size if total else 0,
    }


# ---------------------------------------------------------------------------
# POST /prevention/dismiss/{alert_id}
# ---------------------------------------------------------------------------
@router.post("/dismiss/{alert_id}")
async def dismiss_alert(alert_id: str):
    """Mark a prevention alert as reviewed/dismissed."""
    _dismissed.add(alert_id)
    _bust_prevention_cache()
    return {
        "status": "dismissed",
        "alert_id": alert_id,
        "total_dismissed": len(_dismissed),
    }
