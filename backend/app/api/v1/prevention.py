"""
Prevention Engine API — Proactive Denial Prevention
=====================================================
GET  /prevention/scan              — run full prevention scan, return alerts + summary
GET  /prevention/summary           — just the summary stats
GET  /prevention/alerts            — paginated alert list with filters (type, severity, payer)
POST /prevention/dismiss/{alert_id} — dismiss an alert (persists to prevention_alerts table)

Sprint Q D2 — dismissals are now persisted to the ``prevention_alerts`` table
so server restarts no longer drop state.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.prevent_persistence import PreventionAlert
from app.services.prevention_service import (
    scan_claims_for_prevention,
    get_prevention_summary,
    _bust_prevention_cache,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper: count persisted dismissals (used by summary payloads)
# ---------------------------------------------------------------------------
async def _count_dismissed(db: AsyncSession) -> int:
    try:
        n = await db.scalar(
            select(func.count(PreventionAlert.alert_id))
            .where(PreventionAlert.dismissed == True)  # noqa: E712
        )
        return int(n or 0)
    except Exception:
        return 0


# ---------------------------------------------------------------------------
# GET /prevention/scan
# ---------------------------------------------------------------------------
@router.get("/scan")
async def prevention_scan(
    limit: int = Query(100, ge=1, le=500, description="Max alerts to return"),
    include_dismissed: bool = Query(False, description="Include dismissed alerts"),
    db: AsyncSession = Depends(get_db),
):
    """Run the full prevention scan and return alerts + summary.

    Dismissed alerts are excluded by default; pass ``include_dismissed=true`` to
    see them. Dismissal state is persisted in the ``prevention_alerts`` table.
    """
    result = await scan_claims_for_prevention(db, limit=limit)
    await db.commit()  # commit the upsert inside scan_claims_for_prevention

    if not include_dismissed:
        result["alerts"] = [a for a in result["alerts"] if not a.get("dismissed")]

    result["summary"]["dismissed_count"] = await _count_dismissed(db)
    return result


# ---------------------------------------------------------------------------
# GET /prevention/summary
# ---------------------------------------------------------------------------
@router.get("/summary")
async def prevention_summary(db: AsyncSession = Depends(get_db)):
    """Return only the summary stats (no individual alerts)."""
    summary = await get_prevention_summary(db)
    await db.commit()
    summary["dismissed_count"] = await _count_dismissed(db)
    return summary


# ---------------------------------------------------------------------------
# GET /prevention/alerts
# ---------------------------------------------------------------------------
@router.get("/alerts")
async def prevention_alerts(
    prevention_type: Optional[str] = Query(None, description="Filter by type: ELIGIBILITY_RISK, AUTH_EXPIRY, TIMELY_FILING_RISK, DUPLICATE_CLAIM, HIGH_RISK_PAYER_CPT"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, WARNING, INFO"),
    payer: Optional[str] = Query(None, description="Filter by payer name (partial match)"),
    include_dismissed: bool = Query(False, description="Include dismissed alerts"),
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated, filterable prevention alerts."""
    result = await scan_claims_for_prevention(db, limit=500)
    await db.commit()

    alerts = result["alerts"]

    if not include_dismissed:
        alerts = [a for a in alerts if not a.get("dismissed")]

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
async def dismiss_alert(
    alert_id: str,
    dismissed_by: str = Query("system", description="User or service ID performing the dismissal"),
    db: AsyncSession = Depends(get_db),
):
    """Mark a prevention alert as dismissed.

    Persists to ``prevention_alerts`` — survives server restarts.
    If the alert row does not yet exist (e.g. scan hasn't populated it), a
    minimal stub row is created.
    """
    now = datetime.utcnow()

    # Upsert: dismiss if exists, otherwise create a minimal row flagged dismissed
    stmt = pg_insert(PreventionAlert.__table__).values(
        alert_id=alert_id,
        dismissed=True,
        dismissed_at=now,
        dismissed_by=dismissed_by,
        preventable=True,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["alert_id"],
        set_={
            "dismissed": True,
            "dismissed_at": now,
            "dismissed_by": dismissed_by,
        },
    )
    try:
        await db.execute(stmt)
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Dismissal persist failed: {exc}")

    _bust_prevention_cache()

    total_dismissed = await _count_dismissed(db)
    return {
        "status": "dismissed",
        "alert_id": alert_id,
        "dismissed_by": dismissed_by,
        "dismissed_at": now.isoformat(),
        "total_dismissed": total_dismissed,
    }


# ---------------------------------------------------------------------------
# POST /prevention/undismiss/{alert_id}  (bonus: easy un-dismiss for QA)
# ---------------------------------------------------------------------------
@router.post("/undismiss/{alert_id}")
async def undismiss_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    """Clear the dismissed flag for an alert (does not delete the row)."""
    row = await db.get(PreventionAlert, alert_id)
    if not row:
        raise HTTPException(status_code=404, detail="alert_id not found")
    row.dismissed = False
    row.dismissed_at = None
    row.dismissed_by = None
    await db.commit()
    _bust_prevention_cache()
    return {"status": "undismissed", "alert_id": alert_id}
