"""
A/R Aging API — Sprint 3 + AR+ enhancements
GET /api/v1/ar/summary             — 5 aging buckets with dollar totals + payer breakdown
GET /api/v1/ar/aging                — paginated rows OR multi-dimension breakdown when ?dimension=
GET /api/v1/ar/trend                — 12-month AR trend
GET /api/v1/ar/aging-root-cause    — root cause analysis for aging AR
GET /api/v1/ar/cohort-analysis     — cohort tracking by submission month
GET /api/v1/ar/forecast             — predicted collectability for current AR
GET /api/v1/ar/write-off-waterfall — AR disposition waterfall over a lookback window
GET /api/v1/ar/ar-to-revenue-ratio — AR % of revenue benchmark metric
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case, and_, or_, text
from datetime import date, timedelta
from typing import Any, Optional

from app.db.session import get_db
from app.models.claim import Claim
from app.models.patient import Patient
from app.models.payer import Payer
from app.models.provider import Provider
from app.models.denial import Denial, Appeal
from app.models.root_cause import RootCauseAnalysis
from app.models.rcm_extended import EraPayment
from app.schemas.collections import ARSummary, ARBucketTotal, ARAgingRow, PaginatedAR
from app.schemas.ar import (
    ARCohortResponse, ARCohortRow,
    ARForecastResponse, ARBucketCollectability,
    WriteoffWaterfallResponse, WriteoffReasonRow,
    ARToRevenueRatioResponse,
)

router = APIRouter()

BUCKET_LABELS = ["0-30", "31-60", "61-90", "91-120", "120+"]


def _bucket_case():
    """SQLAlchemy CASE for aging bucket from days_outstanding."""
    today = date.today()
    days_col = func.cast(
        func.current_date() - func.coalesce(Claim.submission_date, Claim.date_of_service),
        type_=func.Integer()
    )
    return case(
        (days_col <= 30,  "0-30"),
        (days_col <= 60,  "31-60"),
        (days_col <= 90,  "61-90"),
        (days_col <= 120, "91-120"),
        else_="120+",
    )


# ── GET /ar/summary ───────────────────────────────────────────────────────────
@router.get("/summary", response_model=ARSummary)
async def get_ar_summary(db: AsyncSession = Depends(get_db)) -> Any:
    today = date.today()

    # Balance = total_charges (unpaid claims where status != PAID/WRITTEN_OFF)
    base_q = select(Claim).where(
        Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"])
    )

    total_ar = await db.scalar(
        select(func.sum(Claim.total_charges)).where(
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"])
        )
    ) or 0.0
    total_claims = await db.scalar(
        select(func.count(Claim.claim_id)).where(
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"])
        )
    ) or 0

    # Bucket totals via raw SQL-friendly approach — compute per claim
    bucket_q = await db.execute(
        select(
            Claim.claim_id,
            Claim.total_charges,
            Claim.date_of_service,
        ).where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
        .limit(50000)
    )
    rows = bucket_q.all()

    buckets = {"0-30": {"count": 0, "balance": 0.0},
               "31-60": {"count": 0, "balance": 0.0},
               "61-90": {"count": 0, "balance": 0.0},
               "91-120": {"count": 0, "balance": 0.0},
               "120+": {"count": 0, "balance": 0.0}}

    total_days = 0
    for r in rows:
        if r.date_of_service:
            days = (today - r.date_of_service).days
            total_days += days
            if days <= 30:   b = "0-30"
            elif days <= 60: b = "31-60"
            elif days <= 90: b = "61-90"
            elif days <= 120: b = "91-120"
            else:            b = "120+"
            buckets[b]["count"] += 1
            buckets[b]["balance"] += r.total_charges or 0.0

    avg_days = round(total_days / len(rows), 1) if rows else 0.0
    total_bal = float(total_ar)

    bucket_list = [
        ARBucketTotal(
            bucket=k,
            count=v["count"],
            balance=round(v["balance"], 2),
            pct=round(v["balance"] / total_bal * 100, 1) if total_bal else 0.0
        )
        for k, v in buckets.items()
    ]

    # Top payers by AR balance
    payer_q = await db.execute(
        select(Payer.payer_name, func.sum(Claim.total_charges).label("balance"), func.count(Claim.claim_id).label("cnt"))
        .join(Claim, Claim.payer_id == Payer.payer_id)
        .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
        .group_by(Payer.payer_name)
        .order_by(desc("balance"))
        .limit(8)
    )
    payer_breakdown = [
        {"payer": r.payer_name, "balance": round(float(r.balance or 0), 2), "count": r.cnt}
        for r in payer_q.all()
    ]

    return ARSummary(
        total_ar=round(total_bal, 2),
        total_claims=total_claims,
        avg_days=avg_days,
        buckets=bucket_list,
        payer_breakdown=payer_breakdown,
    )


# ── GET /ar/aging ─────────────────────────────────────────────────────────────
# Two modes:
#   1) When `dimension` query param is provided → return multi-dimension breakdown
#      (payer | provider | specialty | insurance_type)
#   2) Otherwise → paginated drill-down rows (existing behavior, enhanced with
#      patient_name, payer_name, carc_code, days_overdue, next_action)
ALLOWED_DIMENSIONS = {"payer", "provider", "specialty", "insurance_type"}
DUE_DAYS = 30   # claim is "overdue" once it crosses the 0-30 bucket


def _bucket_from_days(days: int) -> str:
    if days <= 30:    return "0-30"
    elif days <= 60:  return "31-60"
    elif days <= 90:  return "61-90"
    elif days <= 120: return "91-120"
    else:             return "120+"


def _next_action_for(status: str, days: int, has_carc: bool) -> str:
    if has_carc:
        return "Review denial / file appeal"
    if status == "APPEALED":
        return "Await appeal decision"
    if days > 120:
        return "Escalate / consider write-off"
    if days > 90:
        return "Final demand letter"
    if days > 60:
        return "Payer follow-up call"
    if days > 30:
        return "Status check with payer"
    return "Monitor"


@router.get("/aging")
async def get_ar_aging(
    db: AsyncSession = Depends(get_db),
    dimension: Optional[str] = Query(None, description="payer | provider | specialty | insurance_type"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    bucket: Optional[str] = None,
    payer_id: Optional[str] = None,
) -> Any:
    today = date.today()
    open_statuses_filter = Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"])

    # ── Mode 1: Multi-dimension breakdown ─────────────────────────────────
    if dimension is not None:
        dim = dimension.lower().strip()
        if dim not in ALLOWED_DIMENSIONS:
            dim = "payer"

        # PostgreSQL date subtraction returns integer days
        days_expr = (
            func.current_date()
            - func.coalesce(Claim.submission_date, Claim.date_of_service)
        )
        bkt_case = case(
            (days_expr <= 30,  "0-30"),
            (days_expr <= 60,  "31-60"),
            (days_expr <= 90,  "61-90"),
            (days_expr <= 120, "91-120"),
            else_="120+",
        )

        # Pick label column per dimension
        if dim == "payer":
            label_col = func.coalesce(Payer.payer_name, "—").label("dim_label")
            q = (
                select(
                    label_col,
                    bkt_case.label("bkt"),
                    func.sum(Claim.total_charges).label("amt"),
                    func.count(Claim.claim_id).label("cnt"),
                )
                .join(Payer, Payer.payer_id == Claim.payer_id, isouter=True)
                .where(open_statuses_filter)
                .group_by("dim_label", "bkt")
            )
        elif dim == "provider":
            label_col = func.coalesce(Provider.provider_name, "—").label("dim_label")
            q = (
                select(
                    label_col,
                    bkt_case.label("bkt"),
                    func.sum(Claim.total_charges).label("amt"),
                    func.count(Claim.claim_id).label("cnt"),
                )
                .join(Provider, Provider.provider_id == Claim.provider_id, isouter=True)
                .where(open_statuses_filter)
                .group_by("dim_label", "bkt")
            )
        elif dim == "specialty":
            label_col = func.coalesce(Provider.specialty, "—").label("dim_label")
            q = (
                select(
                    label_col,
                    bkt_case.label("bkt"),
                    func.sum(Claim.total_charges).label("amt"),
                    func.count(Claim.claim_id).label("cnt"),
                )
                .join(Provider, Provider.provider_id == Claim.provider_id, isouter=True)
                .where(open_statuses_filter)
                .group_by("dim_label", "bkt")
            )
        else:  # insurance_type → payer_group
            label_col = func.coalesce(Payer.payer_group, "—").label("dim_label")
            q = (
                select(
                    label_col,
                    bkt_case.label("bkt"),
                    func.sum(Claim.total_charges).label("amt"),
                    func.count(Claim.claim_id).label("cnt"),
                )
                .join(Payer, Payer.payer_id == Claim.payer_id, isouter=True)
                .where(open_statuses_filter)
                .group_by("dim_label", "bkt")
            )

        rows = (await db.execute(q)).all()

        agg: dict[str, dict] = {}
        for r in rows:
            name = r.dim_label or "—"
            if name not in agg:
                agg[name] = {
                    "name": name,
                    "0_30": 0.0, "31_60": 0.0, "61_90": 0.0,
                    "91_120": 0.0, "120_plus": 0.0,
                    "total": 0.0, "claim_count": 0,
                }
            amt = float(r.amt or 0.0)
            cnt = int(r.cnt or 0)
            key_map = {
                "0-30": "0_30",
                "31-60": "31_60",
                "61-90": "61_90",
                "91-120": "91_120",
                "120+": "120_plus",
            }
            agg[name][key_map[r.bkt]] += amt
            agg[name]["total"] += amt
            agg[name]["claim_count"] += cnt

        # Round floats and sort by total desc
        buckets = sorted(
            (
                {
                    "name": v["name"],
                    "0_30": round(v["0_30"], 2),
                    "31_60": round(v["31_60"], 2),
                    "61_90": round(v["61_90"], 2),
                    "91_120": round(v["91_120"], 2),
                    "120_plus": round(v["120_plus"], 2),
                    "total": round(v["total"], 2),
                    "claim_count": v["claim_count"],
                }
                for v in agg.values()
            ),
            key=lambda x: x["total"],
            reverse=True,
        )

        return {"dimension": dim, "buckets": buckets}

    # ── Mode 2: Paginated drill-down rows (enhanced) ──────────────────────
    q = (
        select(
            Claim,
            Patient.first_name,
            Patient.last_name,
            Payer.payer_name,
            func.coalesce(func.sum(EraPayment.payment_amount), 0.0).label("total_paid"),
        )
        .join(Patient, Patient.patient_id == Claim.patient_id, isouter=True)
        .join(Payer,   Payer.payer_id   == Claim.payer_id,   isouter=True)
        .outerjoin(EraPayment, EraPayment.claim_id == Claim.claim_id)
        .where(open_statuses_filter)
        .group_by(Claim.claim_id, Patient.first_name, Patient.last_name, Payer.payer_name)
    )
    if payer_id and payer_id != "all":
        q = q.where(Claim.payer_id == payer_id)

    count_q = select(func.count()).select_from(q.subquery())
    total = await db.scalar(count_q) or 0

    q = q.order_by(desc(Claim.total_charges)).offset((page - 1) * size).limit(size)
    result = await db.execute(q)
    rows = result.all()

    # Bulk-fetch CARC codes for the page (one DB hit, not per-row)
    claim_ids = [r.Claim.claim_id for r in rows]
    carc_map: dict[str, str] = {}
    if claim_ids:
        carc_rows = (
            await db.execute(
                select(Denial.claim_id, Denial.carc_code)
                .where(Denial.claim_id.in_(claim_ids))
            )
        ).all()
        for cr in carc_rows:
            # keep first carc per claim
            carc_map.setdefault(cr.claim_id, cr.carc_code or "—")

    items = []
    for row in rows:
        c = row.Claim
        days = (today - c.date_of_service).days if c.date_of_service else 0
        bkt = _bucket_from_days(days)
        if bucket and bkt != bucket:
            continue

        days_overdue = max(days - DUE_DAYS, 0)
        carc = carc_map.get(c.claim_id, "—") or "—"
        patient_name = f"{row.first_name or ''} {row.last_name or ''}".strip() or "—"
        payer_name   = row.payer_name or "—"

        items.append({
            "aging_id": f"AR-{c.claim_id}",
            "claim_id": c.claim_id,
            "patient_id": c.patient_id,
            "payer_id": c.payer_id,
            "patient_name": patient_name,
            "payer_name": payer_name,
            "bucket": bkt,
            "days_outstanding": days,
            "days_overdue": days_overdue,
            "balance": round((c.total_charges or 0.0) - float(row.total_paid or 0.0), 2),
            "billed_amount": round(c.total_charges or 0.0, 2),
            "paid_amount": round(float(row.total_paid or 0.0), 2),
            "claim_date": c.date_of_service.isoformat() if c.date_of_service else None,
            "status": c.status or "OPEN",
            "carc_code": carc,
            "next_action": _next_action_for(c.status or "OPEN", days, carc != "—"),
        })

    return {"items": items, "total": total, "page": page, "size": size}


# ── GET /ar/trend ────────────────────────────────────────────────────────────
@router.get("/trend")
async def get_ar_trend(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """12-month AR trend: monthly claim counts and total outstanding charges."""
    today = date.today()
    twelve_months_ago = today.replace(day=1) - timedelta(days=365)

    month_names = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

    month_col = func.date_trunc("month", Claim.date_of_service).label("month")

    q = (
        select(
            month_col,
            func.count(Claim.claim_id).label("claim_count"),
            func.sum(Claim.total_charges).label("total_ar"),
        )
        .where(
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]),
            Claim.date_of_service >= twelve_months_ago,
        )
        .group_by(month_col)
        .order_by(month_col)
    )

    result = await db.execute(q)
    rows = result.all()

    # Current totals
    total_ar = await db.scalar(
        select(func.sum(Claim.total_charges)).where(
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"])
        )
    ) or 0.0
    total_ar = float(total_ar)

    total_claims = await db.scalar(
        select(func.count(Claim.claim_id)).where(
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"])
        )
    ) or 0

    months = []
    for row in rows:
        m = row.month
        if m is None:
            continue
        period = f"{m.year}-{m.month:02d}"
        months.append({
            "month": month_names[m.month - 1],
            "year": m.year,
            "period": period,
            "total_ar": round(float(row.total_ar or 0), 2),
            "claim_count": row.claim_count or 0,
        })

    return {
        "current_total_ar": round(total_ar, 2),
        "current_claim_count": total_claims,
        "trend": months,
    }


# ── GET /ar/aging-root-cause ─────────────────────────────────────────────────
@router.get("/aging-root-cause")
async def get_ar_aging_root_cause(db: AsyncSession = Depends(get_db)) -> Any:
    """Root cause analysis for aging AR — WHY claims are stuck."""
    today = date.today()

    # ── 1. Aging by Claim Status ──────────────────────────────────────────
    # Unpaid claims grouped by status with avg age and total amount
    status_q = await db.execute(
        select(
            Claim.status,
            func.count(Claim.claim_id).label("cnt"),
            func.avg(
                func.current_date() - func.coalesce(Claim.submission_date, Claim.date_of_service)
            ).label("avg_age"),
            func.sum(Claim.total_charges).label("total"),
        )
        .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
        .group_by(Claim.status)
        .order_by(desc("total"))
    )
    aging_by_status = [
        {
            "status": r.status,
            "count": r.cnt,
            "avg_age_days": round(float(r.avg_age or 0)),
            "total_amount": round(float(r.total or 0)),
        }
        for r in status_q.all()
    ]

    # ── 2. Aging by Root Cause ────────────────────────────────────────────
    # Join root_cause_analysis to claims that are NOT paid/written off/voided
    rc_q = await db.execute(
        select(
            RootCauseAnalysis.primary_root_cause,
            RootCauseAnalysis.root_cause_group,
            func.count(RootCauseAnalysis.rca_id).label("cnt"),
            func.sum(RootCauseAnalysis.financial_impact).label("impact"),
        )
        .join(Claim, Claim.claim_id == RootCauseAnalysis.claim_id)
        .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
        .group_by(RootCauseAnalysis.primary_root_cause, RootCauseAnalysis.root_cause_group)
        .order_by(desc("impact"))
        .limit(10)
    )
    aging_by_root_cause = [
        {
            "root_cause": r.primary_root_cause,
            "group": r.root_cause_group,
            "count": r.cnt,
            "impact": round(float(r.impact or 0)),
        }
        for r in rc_q.all()
    ]

    # ── 3. Aging by Payer (slow payers) ───────────────────────────────────
    payer_q = await db.execute(
        select(
            Payer.payer_name,
            func.count(Claim.claim_id).label("cnt"),
            func.avg(
                func.current_date() - func.coalesce(Claim.submission_date, Claim.date_of_service)
            ).label("avg_age"),
            func.sum(Claim.total_charges).label("total"),
        )
        .join(Claim, Claim.payer_id == Payer.payer_id)
        .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
        .group_by(Payer.payer_name)
        .order_by(desc("total"))
        .limit(10)
    )
    aging_by_payer = [
        {
            "payer_name": r.payer_name,
            "count": r.cnt,
            "avg_age_days": round(float(r.avg_age or 0)),
            "total_amount": round(float(r.total or 0)),
        }
        for r in payer_q.all()
    ]

    # ── 4. No ERA Received ────────────────────────────────────────────────
    # Claims that were submitted but have NO matching ERA payment
    no_era_q = await db.execute(
        select(
            func.count(Claim.claim_id).label("cnt"),
            func.sum(Claim.total_charges).label("total"),
        )
        .outerjoin(EraPayment, EraPayment.claim_id == Claim.claim_id)
        .where(
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED", "DRAFT"]),
            Claim.submission_date.isnot(None),
            EraPayment.era_id.is_(None),
        )
    )
    no_era_row = no_era_q.one()
    no_era_received = {
        "count": no_era_row.cnt or 0,
        "total_amount": round(float(no_era_row.total or 0)),
    }

    # ── 5. Summary ────────────────────────────────────────────────────────
    total_aging_claims = sum(s["count"] for s in aging_by_status)
    total_aging_amount = sum(s["total_amount"] for s in aging_by_status)

    # Preventable percentage: root causes in PREVENTABLE group
    preventable_impact = sum(
        r["impact"] for r in aging_by_root_cause if r["group"] == "PREVENTABLE"
    )
    total_rc_impact = sum(r["impact"] for r in aging_by_root_cause) or 1
    preventable_pct = round(preventable_impact / total_rc_impact * 100, 1)

    top_rc = aging_by_root_cause[0] if aging_by_root_cause else None

    return {
        "aging_by_status": aging_by_status,
        "aging_by_root_cause": aging_by_root_cause,
        "aging_by_payer": aging_by_payer,
        "no_era_received": no_era_received,
        "summary": {
            "total_aging_claims": total_aging_claims,
            "total_aging_amount": total_aging_amount,
            "preventable_pct": preventable_pct,
            "top_root_cause": top_rc["root_cause"] if top_rc else "N/A",
            "top_root_cause_amount": top_rc["impact"] if top_rc else 0,
        },
    }


# ── GET /ar/cohort-analysis ───────────────────────────────────────────────────
@router.get("/cohort-analysis", response_model=ARCohortResponse)
async def get_ar_cohort_analysis(
    db: AsyncSession = Depends(get_db),
    months: int = Query(6, ge=1, le=24),
) -> Any:
    """
    Cohort tracking by submission month.
    For each cohort (month a batch of claims was submitted), report:
      - claims_submitted (total $ submitted in the cohort)
      - paid_30d  (sum of ERA payments that landed within 30 days of submission)
      - paid_60d  (sum of ERA payments that landed within 31-60 days of submission)
      - still_open (cohort $ still in open statuses)
      - aging_pct (still_open / claims_submitted)
    """
    today = date.today()
    # First-of-month boundary `months` ago
    base = today.replace(day=1)
    # naive month subtraction
    yr = base.year
    mo = base.month - months
    while mo <= 0:
        mo += 12
        yr -= 1
    cutoff = date(yr, mo, 1)

    cohort_col = func.date_trunc("month", Claim.submission_date).label("cohort")

    # 1) Cohort totals (sum of charges + claim count)
    cohort_q = await db.execute(
        select(
            cohort_col,
            func.sum(Claim.total_charges).label("submitted"),
            func.count(Claim.claim_id).label("cnt"),
        )
        .where(
            Claim.submission_date.isnot(None),
            Claim.submission_date >= cutoff,
        )
        .group_by(cohort_col)
        .order_by(cohort_col)
    )
    cohort_rows = cohort_q.all()

    # 2) Still-open totals per cohort (open statuses only)
    open_q = await db.execute(
        select(
            cohort_col,
            func.sum(Claim.total_charges).label("open_amt"),
        )
        .where(
            Claim.submission_date.isnot(None),
            Claim.submission_date >= cutoff,
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]),
        )
        .group_by(cohort_col)
    )
    open_map = {r.cohort: float(r.open_amt or 0.0) for r in open_q.all() if r.cohort}

    # 3) ERA payments aged by days-since-submission, grouped by cohort
    # PostgreSQL date subtraction returns integer days
    days_diff = EraPayment.payment_date - Claim.submission_date
    era_cohort_col = func.date_trunc("month", Claim.submission_date).label("cohort")
    era_q = await db.execute(
        select(
            era_cohort_col,
            func.sum(
                case((days_diff <= 30, EraPayment.payment_amount), else_=0.0)
            ).label("p30"),
            func.sum(
                case(
                    (and_(days_diff > 30, days_diff <= 60), EraPayment.payment_amount),
                    else_=0.0,
                )
            ).label("p60"),
        )
        .join(Claim, Claim.claim_id == EraPayment.claim_id)
        .where(
            Claim.submission_date.isnot(None),
            Claim.submission_date >= cutoff,
        )
        .group_by(era_cohort_col)
    )
    era_map = {
        r.cohort: (float(r.p30 or 0.0), float(r.p60 or 0.0))
        for r in era_q.all()
        if r.cohort
    }

    cohorts: list[ARCohortRow] = []
    for r in cohort_rows:
        c = r.cohort
        if c is None:
            continue
        period = f"{c.year}-{c.month:02d}"
        submitted = float(r.submitted or 0.0)
        p30, p60 = era_map.get(c, (0.0, 0.0))
        still_open = open_map.get(c, 0.0)
        aging_pct = round((still_open / submitted) * 100, 1) if submitted else 0.0
        cohorts.append(ARCohortRow(
            cohort_month=period,
            claims_submitted=round(submitted, 2),
            paid_30d=round(p30, 2),
            paid_60d=round(p60, 2),
            still_open=round(still_open, 2),
            aging_pct=aging_pct,
            claim_count=int(r.cnt or 0),
        ))

    return ARCohortResponse(cohorts=cohorts)


# ── GET /ar/forecast ──────────────────────────────────────────────────────────
# Default collectability curve by aging bucket. Sourced from MAP industry
# benchmarks for healthcare receivables; each cohort's effective rate is
# adjusted by the volume-weighted payer avg_payment_rate observed in the
# current open AR.
DEFAULT_COLLECTABILITY = {
    "0-30":   0.92,
    "31-60":  0.78,
    "61-90":  0.54,
    "91-120": 0.28,
    "120+":   0.12,
}


@router.get("/forecast", response_model=ARForecastResponse)
async def get_ar_forecast(
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, le=180),
) -> Any:
    """
    Predict how much of current AR will be collected over the next `days`.
    Combines:
      - bucket-level collectability curve (industry benchmarks)
      - payer ADTP (faster payers contribute more to the 30-day window)
      - payer avg_payment_rate (propensity to pay full allowed)
    """
    today = date.today()

    # Pull open claims with payer adtp + avg_payment_rate in one shot
    rows = (
        await db.execute(
            select(
                Claim.claim_id,
                Claim.total_charges,
                Claim.date_of_service,
                Claim.submission_date,
                Payer.adtp_days,
                Payer.avg_payment_rate,
            )
            .join(Payer, Payer.payer_id == Claim.payer_id, isouter=True)
            .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
        )
    ).all()

    bucket_balance = {b: 0.0 for b in BUCKET_LABELS}
    bucket_expected = {b: 0.0 for b in BUCKET_LABELS}
    predicted_30 = 0.0
    predicted_60 = 0.0
    current_ar = 0.0

    for r in rows:
        anchor = r.submission_date or r.date_of_service
        if anchor is None:
            continue
        days_out = (today - anchor).days
        bkt = _bucket_from_days(days_out)

        bal = float(r.total_charges or 0.0)
        if bal <= 0:
            continue
        current_ar += bal
        bucket_balance[bkt] += bal

        # Bucket collectability adjusted by payer avg payment rate
        base_pct = DEFAULT_COLLECTABILITY[bkt]
        payer_rate = float(r.avg_payment_rate) if r.avg_payment_rate is not None else 0.85
        # Blend: 70% bucket curve, 30% payer rate (keeps curve dominant)
        eff_pct = 0.7 * base_pct + 0.3 * payer_rate
        eff_pct = max(0.0, min(eff_pct, 0.99))

        expected = bal * eff_pct
        bucket_expected[bkt] += expected

        # Time-to-pay: ADTP estimates days until next ERA cycle
        adtp = int(r.adtp_days) if r.adtp_days is not None else 21
        # within 30d window if days remaining + adtp <= days
        if adtp <= days:
            predicted_30 += expected
        # 60-day predicted = anything that pays within 60d
        if adtp <= 60:
            predicted_60 += expected

    # Predicted write-off = AR * (1 - weighted collectability)
    if current_ar > 0:
        weighted_collect = sum(bucket_expected.values()) / current_ar
    else:
        weighted_collect = 0.0
    predicted_write_off = max(current_ar - sum(bucket_expected.values()), 0.0)

    by_bucket = []
    bucket_label_map = {
        "0-30":   "0-30d",
        "31-60":  "31-60d",
        "61-90":  "61-90d",
        "91-120": "91-120d",
        "120+":   "120+d",
    }
    for b in BUCKET_LABELS:
        bal = bucket_balance[b]
        exp = bucket_expected[b]
        pct = round((exp / bal) * 100, 1) if bal else 0.0
        by_bucket.append(ARBucketCollectability(
            bucket=bucket_label_map[b],
            collectable_pct=pct,
            bucket_balance=round(bal, 2),
            expected_collect=round(exp, 2),
        ))

    return ARForecastResponse(
        current_ar=round(current_ar, 2),
        predicted_collectable_30d=round(predicted_30, 2),
        predicted_collectable_60d=round(predicted_60, 2),
        predicted_write_off=round(predicted_write_off, 2),
        by_bucket=by_bucket,
    )


# ── GET /ar/write-off-waterfall ───────────────────────────────────────────────
@router.get("/write-off-waterfall", response_model=WriteoffWaterfallResponse)
async def get_writeoff_waterfall(
    db: AsyncSession = Depends(get_db),
    days: int = Query(90, ge=1, le=365),
) -> Any:
    """
    AR disposition waterfall over the past `days`.

    starting_ar      = total_charges of claims with DOS within window
    collected        = ERA payments within window
    appeals_recovered= sum of recovered_amount on appeals with outcome_date in window
    written_off      = total_charges of claims marked WRITTEN_OFF in window
    adjusted         = sum of CO/PI adjustment amounts on denials in window
    remaining_ar     = current open AR within the window
    by_reason        = top write-off reasons (denial CARC descriptions)
    """
    today = date.today()
    start = today - timedelta(days=days)

    # Starting AR = total_charges of claims whose DOS is within window
    starting_ar = float((await db.scalar(
        select(func.sum(Claim.total_charges))
        .where(Claim.date_of_service >= start)
    )) or 0.0)

    # Collected = ERA payments within window
    collected = float((await db.scalar(
        select(func.sum(EraPayment.payment_amount))
        .where(EraPayment.payment_date >= start)
    )) or 0.0)

    # Appeals recovered
    appeals_recovered = float((await db.scalar(
        select(func.sum(Appeal.recovered_amount))
        .where(
            Appeal.outcome == "APPROVED",
            Appeal.outcome_date.isnot(None),
            Appeal.outcome_date >= start,
        )
    )) or 0.0)

    # Written off
    written_off = float((await db.scalar(
        select(func.sum(Claim.total_charges))
        .where(
            Claim.status == "WRITTEN_OFF",
            Claim.date_of_service >= start,
        )
    )) or 0.0)

    # Adjusted = CO/PI adjustment amounts on denials in window
    adjusted = float((await db.scalar(
        select(func.sum(Denial.denial_amount))
        .where(
            Denial.denial_date >= start,
            Denial.adjustment_type.in_(["CO", "PI", "OA"]),
        )
    )) or 0.0)

    # Remaining AR (open claims in window)
    remaining_ar = float((await db.scalar(
        select(func.sum(Claim.total_charges))
        .where(
            Claim.date_of_service >= start,
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]),
        )
    )) or 0.0)

    # Top write-off reasons — bucket by CARC description on WRITTEN_OFF claims
    reason_q = await db.execute(
        select(
            func.coalesce(Denial.carc_description, "Unspecified").label("reason"),
            func.sum(Denial.denial_amount).label("amt"),
            func.count(Denial.denial_id).label("cnt"),
        )
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .where(
            Denial.denial_date >= start,
            or_(
                Claim.status == "WRITTEN_OFF",
                Denial.status == "WRITTEN_OFF",
            ),
        )
        .group_by("reason")
        .order_by(desc("amt"))
        .limit(10)
    )
    by_reason = [
        WriteoffReasonRow(
            reason=(r.reason or "—")[:80],
            amount=round(float(r.amt or 0.0), 2),
            count=int(r.cnt or 0),
        )
        for r in reason_q.all()
    ]

    return WriteoffWaterfallResponse(
        starting_ar=round(starting_ar, 2),
        collected=round(collected, 2),
        appeals_recovered=round(appeals_recovered, 2),
        written_off=round(written_off, 2),
        adjusted=round(adjusted, 2),
        remaining_ar=round(remaining_ar, 2),
        by_reason=by_reason,
        lookback_days=days,
    )


# ── GET /ar/ar-to-revenue-ratio ───────────────────────────────────────────────
# Industry benchmark: AR/Revenue ratio of ~0.12 = healthy
AR_RATIO_BENCHMARK = 0.12


@router.get("/ar-to-revenue-ratio", response_model=ARToRevenueRatioResponse)
async def get_ar_to_revenue_ratio(
    db: AsyncSession = Depends(get_db),
    lookback_days: int = Query(90, ge=1, le=365),
) -> Any:
    """
    AR % of Revenue benchmark. Compares current open AR balance to revenue
    (paid + allowed) collected in the lookback window.
    Trend is calculated against the prior equivalent period.
    """
    today = date.today()
    start = today - timedelta(days=lookback_days)
    prior_start = start - timedelta(days=lookback_days)

    # Current open AR (all-time open)
    ar = float((await db.scalar(
        select(func.sum(Claim.total_charges))
        .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
    )) or 0.0)

    # Revenue = ERA payments in window
    revenue = float((await db.scalar(
        select(func.sum(EraPayment.payment_amount))
        .where(EraPayment.payment_date >= start)
    )) or 0.0)

    # Prior period revenue + AR proxy (claims open as of start of current window)
    prior_revenue = float((await db.scalar(
        select(func.sum(EraPayment.payment_amount))
        .where(
            EraPayment.payment_date >= prior_start,
            EraPayment.payment_date < start,
        )
    )) or 0.0)
    prior_ar = float((await db.scalar(
        select(func.sum(Claim.total_charges))
        .where(
            Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]),
            Claim.date_of_service < start,
        )
    )) or 0.0)

    ratio = round(ar / revenue, 4) if revenue else 0.0
    prior_ratio = round(prior_ar / prior_revenue, 4) if prior_revenue else 0.0
    delta = round(ratio - prior_ratio, 4)
    trend = f"{'+' if delta >= 0 else ''}{delta}"

    return ARToRevenueRatioResponse(
        ar_to_revenue_ratio=ratio,
        ar=round(ar, 2),
        revenue=round(revenue, 2),
        benchmark=AR_RATIO_BENCHMARK,
        trend=trend,
        lookback_days=lookback_days,
    )
