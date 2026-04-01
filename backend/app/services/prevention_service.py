"""
Prevention Engine — Proactive Denial Prevention
=================================================
Scans claims BEFORE submission to identify and prevent denials.
5 prevention rules based on the most common root causes.
"""

import logging
import time as _time
from datetime import date, timedelta
from typing import Optional
from sqlalchemy import select, func, and_, text, Float
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.denial import Denial
from app.models.rcm_extended import Eligibility271, PriorAuth, ClaimLine
from app.models.payer import Payer

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 5-minute TTL cache for prevention scan results
# ---------------------------------------------------------------------------
_PREVENTION_CACHE: dict = {}
_PREVENTION_CACHE_TTL = 300  # seconds


def _bust_prevention_cache() -> None:
    """Invalidate the prevention scan cache (e.g. after dismissing an alert)."""
    _PREVENTION_CACHE.clear()


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
async def scan_claims_for_prevention(db: AsyncSession, limit: int = 100) -> dict:
    """
    Scan submitted but not-yet-adjudicated claims for preventable issues.
    Returns alerts grouped by prevention type.
    """
    cache_key = f"scan_{limit}"
    cached = _PREVENTION_CACHE.get(cache_key)
    if cached and (_time.time() - cached["ts"]) < _PREVENTION_CACHE_TTL:
        return cached["data"]

    alerts = []

    # Rule 1: ELIGIBILITY — Check if patient eligibility is INACTIVE/TERMINATED
    elig_alerts = await _check_eligibility_risks(db, limit)
    alerts.extend(elig_alerts)

    # Rule 2: AUTH EXPIRY — Check if prior auth is expired or about to expire
    auth_alerts = await _check_auth_expiry(db, limit)
    alerts.extend(auth_alerts)

    # Rule 3: TIMELY FILING — Check claims approaching payer filing deadlines
    tf_alerts = await _check_timely_filing_risks(db, limit)
    alerts.extend(tf_alerts)

    # Rule 4: DUPLICATE CLAIMS — Check for potential duplicate submissions
    dup_alerts = await _check_duplicate_claims(db, limit)
    alerts.extend(dup_alerts)

    # Rule 5: HIGH-RISK PAYER+CPT — Check if this payer historically denies this CPT
    risk_alerts = await _check_payer_cpt_risk(db, limit)
    alerts.extend(risk_alerts)

    # Summary
    summary = _build_summary(alerts)
    summary["total_scanned"] = len(alerts)

    result = {"alerts": alerts[:limit], "summary": summary}
    _PREVENTION_CACHE[cache_key] = {"ts": _time.time(), "data": result}
    return result


async def get_prevention_summary(db: AsyncSession) -> dict:
    """Return only the summary stats (no individual alerts)."""
    result = await scan_claims_for_prevention(db, limit=500)
    return result["summary"]


def _build_summary(alerts: list) -> dict:
    critical_alerts = [a for a in alerts if a.get("severity") == "CRITICAL"]
    summary = {
        "total_alerts": len(alerts),
        "by_type": {},
        "total_revenue_at_risk": sum(a.get("revenue_at_risk", 0) for a in alerts),
        "preventable_count": len([a for a in alerts if a.get("preventable", True)]),
        "at_risk_count": len([a for a in alerts if a.get("severity") in ("CRITICAL", "WARNING")]),
        "critical_count": len(critical_alerts),
        "critical_revenue_at_risk": sum(a.get("revenue_at_risk", 0) for a in critical_alerts),
    }
    for a in alerts:
        t = a["prevention_type"]
        if t not in summary["by_type"]:
            summary["by_type"][t] = {"count": 0, "revenue_at_risk": 0}
        summary["by_type"][t]["count"] += 1
        summary["by_type"][t]["revenue_at_risk"] += a.get("revenue_at_risk", 0)
    return summary


def _make_alert(
    *,
    claim_id: str,
    patient_id: str,
    payer_name: str,
    prevention_type: str,
    severity: str,
    description: str,
    recommended_action: str,
    revenue_at_risk: float,
    preventable: bool = True,
) -> dict:
    """Build a standardised alert dict."""
    return {
        "alert_id": f"PRV-{prevention_type[:4].upper()}-{claim_id}",
        "claim_id": claim_id,
        "patient_id": patient_id,
        "payer_name": payer_name,
        "prevention_type": prevention_type,
        "severity": severity,
        "description": description,
        "recommended_action": recommended_action,
        "revenue_at_risk": round(revenue_at_risk, 2),
        "preventable": preventable,
        "dismissed": False,
    }


# ---------------------------------------------------------------------------
# Rule 1 — Eligibility Risk
# ---------------------------------------------------------------------------
async def _check_eligibility_risks(db: AsyncSession, limit: int) -> list:
    """
    Claims in SUBMITTED/ACKNOWLEDGED status whose latest eligibility 271
    response shows INACTIVE or TERMINATED subscriber_status.
    """
    # Subquery: latest eligibility per patient+payer
    latest_elig = (
        select(
            Eligibility271.patient_id,
            Eligibility271.payer_id,
            func.max(Eligibility271.inquiry_date).label("latest_date"),
        )
        .group_by(Eligibility271.patient_id, Eligibility271.payer_id)
        .subquery("latest_elig")
    )

    stmt = (
        select(
            Claim.claim_id,
            Claim.patient_id,
            Claim.total_charges,
            Payer.payer_name,
            Eligibility271.subscriber_status,
        )
        .join(Payer, Payer.payer_id == Claim.payer_id)
        .join(
            latest_elig,
            and_(
                latest_elig.c.patient_id == Claim.patient_id,
                latest_elig.c.payer_id == Claim.payer_id,
            ),
        )
        .join(
            Eligibility271,
            and_(
                Eligibility271.patient_id == latest_elig.c.patient_id,
                Eligibility271.payer_id == latest_elig.c.payer_id,
                Eligibility271.inquiry_date == latest_elig.c.latest_date,
            ),
        )
        .where(
            and_(
                Claim.status.in_(["SUBMITTED", "ACKNOWLEDGED"]),
                Eligibility271.subscriber_status.in_(["INACTIVE", "TERMINATED"]),
            )
        )
        .limit(limit)
    )

    rows = (await db.execute(stmt)).all()
    alerts = []
    for r in rows:
        alerts.append(
            _make_alert(
                claim_id=r.claim_id,
                patient_id=r.patient_id,
                payer_name=r.payer_name,
                prevention_type="ELIGIBILITY_RISK",
                severity="CRITICAL",
                description=(
                    f"Patient eligibility is {r.subscriber_status}. "
                    f"Claim {r.claim_id} will likely be denied for ineligibility."
                ),
                recommended_action=(
                    "Re-verify patient eligibility via 270/271 transaction. "
                    "If confirmed inactive, hold claim and update coverage."
                ),
                revenue_at_risk=r.total_charges or 0,
            )
        )
    return alerts


# ---------------------------------------------------------------------------
# Rule 2 — Prior Auth Expiry
# ---------------------------------------------------------------------------
async def _check_auth_expiry(db: AsyncSession, limit: int) -> list:
    """
    Claims linked to prior_auth records where auth status is EXPIRED
    or the expiry_date has already passed.
    """
    today = date.today()

    stmt = (
        select(
            Claim.claim_id,
            Claim.patient_id,
            Claim.total_charges,
            Payer.payer_name,
            PriorAuth.auth_number,
            PriorAuth.status.label("auth_status"),
            PriorAuth.expiry_date,
        )
        .join(PriorAuth, PriorAuth.claim_id == Claim.claim_id)
        .join(Payer, Payer.payer_id == Claim.payer_id)
        .where(
            and_(
                Claim.status.in_(["SUBMITTED", "ACKNOWLEDGED", "DRAFT"]),
                (
                    (PriorAuth.status == "EXPIRED")
                    | (PriorAuth.expiry_date < today)
                ),
            )
        )
        .limit(limit)
    )

    rows = (await db.execute(stmt)).all()
    alerts = []
    for r in rows:
        days_expired = (today - r.expiry_date).days if r.expiry_date and r.expiry_date < today else 0
        alerts.append(
            _make_alert(
                claim_id=r.claim_id,
                patient_id=r.patient_id,
                payer_name=r.payer_name,
                prevention_type="AUTH_EXPIRY",
                severity="CRITICAL" if days_expired > 14 else "WARNING",
                description=(
                    f"Prior auth {r.auth_number or 'N/A'} is expired "
                    f"({days_expired} days past expiry). "
                    f"Claim {r.claim_id} requires auth renewal."
                ),
                recommended_action=(
                    "Request a new or extended prior authorization from the payer. "
                    "Do not submit until auth is renewed."
                ),
                revenue_at_risk=r.total_charges or 0,
            )
        )
    return alerts


# ---------------------------------------------------------------------------
# Rule 3 — Timely Filing Risk
# ---------------------------------------------------------------------------
async def _check_timely_filing_risks(db: AsyncSession, limit: int) -> list:
    """
    Claims where (today - date_of_service) > 75 days and status is not
    terminal (PAID/DENIED).  These are approaching payer filing deadlines.
    """
    today = date.today()
    cutoff = today - timedelta(days=75)

    stmt = (
        select(
            Claim.claim_id,
            Claim.patient_id,
            Claim.total_charges,
            Claim.date_of_service,
            Claim.status,
            Payer.payer_name,
        )
        .join(Payer, Payer.payer_id == Claim.payer_id)
        .where(
            and_(
                Claim.date_of_service < cutoff,
                Claim.status.notin_(["PAID", "DENIED", "WRITTEN_OFF", "VOIDED"]),
            )
        )
        .order_by(Claim.date_of_service.asc())
        .limit(limit)
    )

    rows = (await db.execute(stmt)).all()
    alerts = []
    for r in rows:
        days_old = (today - r.date_of_service).days
        if days_old > 90:
            severity = "CRITICAL"
        elif days_old > 75:
            severity = "WARNING"
        else:
            severity = "INFO"

        alerts.append(
            _make_alert(
                claim_id=r.claim_id,
                patient_id=r.patient_id,
                payer_name=r.payer_name,
                prevention_type="TIMELY_FILING_RISK",
                severity=severity,
                description=(
                    f"Claim {r.claim_id} is {days_old} days from DOS "
                    f"({r.date_of_service}). Status: {r.status}. "
                    f"Approaching timely filing deadline."
                ),
                recommended_action=(
                    "Prioritise immediate submission or follow-up. "
                    "Most payers have 90–120 day filing limits."
                ),
                revenue_at_risk=r.total_charges or 0,
            )
        )
    return alerts


# ---------------------------------------------------------------------------
# Rule 4 — Duplicate Claims
# ---------------------------------------------------------------------------
async def _check_duplicate_claims(db: AsyncSession, limit: int) -> list:
    """
    Detect claims with identical patient_id + date_of_service + payer_id +
    total_charges that appear more than once.
    """
    dup_sub = (
        select(
            Claim.patient_id,
            Claim.date_of_service,
            Claim.payer_id,
            Claim.total_charges,
            func.count(Claim.claim_id).label("cnt"),
        )
        .where(Claim.status.in_(["SUBMITTED", "ACKNOWLEDGED"]))
        .group_by(
            Claim.patient_id,
            Claim.date_of_service,
            Claim.payer_id,
            Claim.total_charges,
        )
        .having(func.count(Claim.claim_id) > 1)
        .subquery("dups")
    )

    stmt = (
        select(
            Claim.claim_id,
            Claim.patient_id,
            Claim.total_charges,
            Claim.date_of_service,
            Payer.payer_name,
        )
        .join(Payer, Payer.payer_id == Claim.payer_id)
        .join(
            dup_sub,
            and_(
                dup_sub.c.patient_id == Claim.patient_id,
                dup_sub.c.date_of_service == Claim.date_of_service,
                dup_sub.c.payer_id == Claim.payer_id,
                dup_sub.c.total_charges == Claim.total_charges,
            ),
        )
        .where(Claim.status.in_(["SUBMITTED", "ACKNOWLEDGED"]))
        .limit(limit)
    )

    rows = (await db.execute(stmt)).all()
    alerts = []
    seen = set()
    for r in rows:
        if r.claim_id in seen:
            continue
        seen.add(r.claim_id)
        alerts.append(
            _make_alert(
                claim_id=r.claim_id,
                patient_id=r.patient_id,
                payer_name=r.payer_name,
                prevention_type="DUPLICATE_CLAIM",
                severity="WARNING",
                description=(
                    f"Potential duplicate: claim {r.claim_id} matches another "
                    f"submission for patient {r.patient_id}, DOS {r.date_of_service}, "
                    f"charges ${r.total_charges:,.2f}."
                ),
                recommended_action=(
                    "Review both claims. Void the duplicate before payer "
                    "processes it to avoid CO-18 denial."
                ),
                revenue_at_risk=r.total_charges or 0,
            )
        )
    return alerts


# ---------------------------------------------------------------------------
# Rule 5 — High-Risk Payer + CPT Combinations
# ---------------------------------------------------------------------------
async def _check_payer_cpt_risk(db: AsyncSession, limit: int) -> list:
    """
    Join claims -> claim_lines -> denials to find payer+CPT combos with
    >30% historical denial rate, then flag current open claims matching
    those high-risk combinations.
    """
    # Step 1: historical denial rates by payer + CPT
    hist = (
        select(
            Claim.payer_id,
            ClaimLine.cpt_code,
            func.count(Claim.claim_id).label("total_claims"),
            func.count(Denial.denial_id).label("denial_count"),
        )
        .join(ClaimLine, ClaimLine.claim_id == Claim.claim_id)
        .outerjoin(Denial, Denial.claim_id == Claim.claim_id)
        .group_by(Claim.payer_id, ClaimLine.cpt_code)
        .having(
            and_(
                func.count(Claim.claim_id) >= 5,  # minimum sample size
                (
                    func.cast(func.count(Denial.denial_id), Float)
                    / func.cast(func.count(Claim.claim_id), Float)
                ) > 0.30,
            )
        )
        .subquery("hist_risk")
    )

    # Step 2: current open claims matching high-risk combos
    stmt = (
        select(
            Claim.claim_id,
            Claim.patient_id,
            Claim.total_charges,
            Payer.payer_name,
            ClaimLine.cpt_code,
            hist.c.denial_count,
            hist.c.total_claims,
        )
        .join(ClaimLine, ClaimLine.claim_id == Claim.claim_id)
        .join(Payer, Payer.payer_id == Claim.payer_id)
        .join(
            hist,
            and_(
                hist.c.payer_id == Claim.payer_id,
                hist.c.cpt_code == ClaimLine.cpt_code,
            ),
        )
        .where(Claim.status.in_(["SUBMITTED", "ACKNOWLEDGED", "DRAFT"]))
        .limit(limit)
    )

    rows = (await db.execute(stmt)).all()
    alerts = []
    seen = set()
    for r in rows:
        key = (r.claim_id, r.cpt_code)
        if key in seen:
            continue
        seen.add(key)
        denial_pct = round(r.denial_count / r.total_claims * 100, 1) if r.total_claims else 0
        alerts.append(
            _make_alert(
                claim_id=r.claim_id,
                patient_id=r.patient_id,
                payer_name=r.payer_name,
                prevention_type="HIGH_RISK_PAYER_CPT",
                severity="WARNING" if denial_pct < 50 else "CRITICAL",
                description=(
                    f"CPT {r.cpt_code} has a {denial_pct}% denial rate with "
                    f"{r.payer_name} ({r.denial_count}/{r.total_claims} historical). "
                    f"Claim {r.claim_id} is at risk."
                ),
                recommended_action=(
                    "Review coding and documentation. Consider adding modifiers, "
                    "supporting diagnosis codes, or pre-submission payer inquiry."
                ),
                revenue_at_risk=r.total_charges or 0,
                preventable=True,
            )
        )
    return alerts
