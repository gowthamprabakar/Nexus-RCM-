"""
Payment Forecast + Bank Reconciliation API
GET /api/v1/forecast/weekly          — weekly forecast per payer
GET /api/v1/forecast/daily           — daily expected cash (ADTP cycle calendar)
GET /api/v1/forecast/summary         — totals for current week + next 4 weeks
GET /api/v1/reconciliation/weekly    — weekly recon: expected vs actual vs bank
GET /api/v1/reconciliation/summary   — variance stats + escalated items
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, desc
from typing import Optional, List
from datetime import date, timedelta

from app.core.deps import get_db
from app.models.rcm_extended import PaymentForecast, BankReconciliation, EraPayment
from app.models.payer import Payer
from app.services.forecast_service import compute_3layer_forecast
from app.services.prophet_forecast import (
    forecast_weekly_revenue,
    forecast_daily_payments,
    get_forecast_accuracy,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


# ---------------------------------------------------------------------------
# FORECAST ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/weekly")
async def get_weekly_forecast(
    db: AsyncSession = Depends(get_db),
    weeks_ahead: int = Query(4, ge=1, le=52),
    payer_id: Optional[str] = None,
    payer_group: Optional[str] = None,
):
    """
    Returns weekly payment forecast for each payer.
    WHO pays this week and HOW MUCH (ADTP-driven).
    """
    today     = date.today()
    week_from = _week_start(today)
    week_to   = week_from + timedelta(weeks=weeks_ahead)

    q = select(PaymentForecast).where(
        and_(
            PaymentForecast.week_start_date >= week_from,
            PaymentForecast.week_start_date <= week_to,
        )
    )
    if payer_id:
        q = q.where(PaymentForecast.payer_id == payer_id)
    if payer_group:
        q = q.where(PaymentForecast.payer_group == payer_group)
    q = q.order_by(PaymentForecast.week_start_date, desc(PaymentForecast.forecasted_amount))

    result = await db.execute(q)
    rows   = result.scalars().all()

    # Group by week
    weeks: dict = {}
    for r in rows:
        wk = str(r.week_start_date)
        if wk not in weeks:
            weeks[wk] = {
                "week_start": wk,
                "week_end":   str(r.week_end_date),
                "total_forecasted": 0,
                "payers": []
            }
        weeks[wk]["total_forecasted"] += r.forecasted_amount or 0
        weeks[wk]["payers"].append({
            "payer_id":         r.payer_id,
            "payer_name":       r.payer_name,
            "payer_group":      r.payer_group,
            "adtp_cycle_hits":  r.adtp_cycle_hits,
            "forecasted_amount": round(r.forecasted_amount or 0, 2),
            "range_low":        round(r.forecast_range_low or 0, 2),
            "range_high":       round(r.forecast_range_high or 0, 2),
            "confidence":       round((r.model_confidence or 0) * 100, 1),
            "claim_count":      r.claim_count_in_window,
        })

    for wk in weeks.values():
        wk["total_forecasted"] = round(wk["total_forecasted"], 2)
        wk["payers"].sort(key=lambda x: x["forecasted_amount"], reverse=True)

    return {
        "weeks_ahead": weeks_ahead,
        "from_week":   str(week_from),
        "to_week":     str(week_to),
        "weeks":       sorted(weeks.values(), key=lambda x: x["week_start"]),
    }


@router.get("/summary")
async def get_forecast_summary(
    db: AsyncSession = Depends(get_db),
):
    """
    Summary totals: this week, next week, next 4 weeks.
    With payer group breakdown.
    """
    today     = date.today()
    this_week = _week_start(today)
    next_4    = this_week + timedelta(weeks=4)

    q = select(
        PaymentForecast.week_start_date,
        PaymentForecast.payer_group,
        func.sum(PaymentForecast.forecasted_amount).label("total"),
        func.count(PaymentForecast.forecast_id).label("payer_count"),
        func.avg(PaymentForecast.model_confidence).label("avg_confidence"),
    ).where(
        and_(
            PaymentForecast.week_start_date >= this_week,
            PaymentForecast.week_start_date <= next_4,
        )
    ).group_by(
        PaymentForecast.week_start_date,
        PaymentForecast.payer_group,
    ).order_by(PaymentForecast.week_start_date)

    result = await db.execute(q)
    rows   = result.all()

    # Aggregate
    week_totals: dict = {}
    group_totals: dict = {}
    grand_total = 0.0

    for row in rows:
        wk  = str(row.week_start_date)
        grp = row.payer_group
        amt = float(row.total or 0)

        week_totals[wk] = week_totals.get(wk, 0) + amt
        group_totals[grp] = group_totals.get(grp, 0) + amt
        grand_total += amt

    return {
        "period": f"{this_week} to {next_4}",
        "grand_total_forecasted": round(grand_total, 2),
        "this_week_total":        round(week_totals.get(str(this_week), 0), 2),
        "next_week_total":        round(week_totals.get(str(this_week + timedelta(weeks=1)), 0), 2),
        "by_week":   {k: round(v, 2) for k, v in sorted(week_totals.items())},
        "by_payer_group": {
            k: {
                "amount": round(v, 2),
                "pct":    round(v / grand_total * 100, 1) if grand_total > 0 else 0
            }
            for k, v in sorted(group_totals.items(), key=lambda x: -x[1])
        },
    }


@router.get("/3-layer")
async def get_3layer_forecast(
    db: AsyncSession = Depends(get_db),
    weeks: int = Query(4, ge=1, le=12),
):
    """
    3-Layer Revenue Forecast:
      Layer 1 (GROSS):           historical claim volume x avg charge
      Layer 2 (DENIAL-ADJUSTED): gross x (1 - payer denial_rate)
      Layer 3 (ADTP-TIMED):      shift net by payer ADTP for cash arrival timing
    """
    return await compute_3layer_forecast(db, weeks_ahead=weeks)


@router.get("/daily")
async def get_daily_forecast(
    db: AsyncSession = Depends(get_db),
    days_ahead: int = Query(30, ge=7, le=90),
):
    """
    Daily expected cash inflow based on ADTP cycle calendar.
    For each day: which payers have their cycle landing + expected amount.
    """
    today    = date.today()
    end_date = today + timedelta(days=days_ahead)

    # Get payers + their ADTP profiles
    payer_q  = select(Payer)
    payer_r  = await db.execute(payer_q)
    payers   = payer_r.scalars().all()

    # Get recent ERA amounts per payer for historical avg
    era_q = select(
        EraPayment.payer_id,
        func.avg(EraPayment.payment_amount).label("avg_payment"),
        func.count(EraPayment.era_id).label("payment_count"),
    ).where(
        EraPayment.payment_date >= today - timedelta(days=180)
    ).group_by(EraPayment.payer_id)
    era_r    = await db.execute(era_q)
    era_avgs = {row.payer_id: float(row.avg_payment or 0) for row in era_r.all()}

    # Build daily calendar
    days = []
    for offset in range(days_ahead):
        d        = today + timedelta(days=offset)
        day_data = {
            "date":        str(d),
            "day_of_week": d.strftime("%A"),
            "is_weekend":  d.weekday() >= 5,
            "payers":      [],
            "total_expected": 0.0,
        }

        if d.weekday() < 5:  # weekdays only — banks closed weekends
            for payer in payers:
                # Check if this payer's ADTP cycle lands on this day
                days_since_start = (d - date(2023, 1, 1)).days
                on_cycle = (
                    d.weekday() == (payer.adtp_anchor_day or 0)
                    and days_since_start % payer.adtp_days < 7
                )
                if on_cycle:
                    hist_avg = era_avgs.get(payer.payer_id, 0)
                    expected = round(hist_avg * 0.95, 2) if hist_avg > 0 else 0
                    if expected > 0:
                        day_data["payers"].append({
                            "payer_id":       payer.payer_id,
                            "payer_name":     payer.payer_name,
                            "payer_group":    payer.payer_group,
                            "adtp_days":      payer.adtp_days,
                            "expected_amount": expected,
                            "payment_method": payer.payment_method,
                        })
                        day_data["total_expected"] += expected

        day_data["total_expected"] = round(day_data["total_expected"], 2)
        day_data["payers"].sort(key=lambda x: -x["expected_amount"])
        days.append(day_data)

    total_30 = round(sum(d["total_expected"] for d in days), 2)
    return {
        "from_date":    str(today),
        "to_date":      str(end_date),
        "total_expected": total_30,
        "days":         days,
    }


# ---------------------------------------------------------------------------
# PROPHET / ML FORECAST ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/prophet/weekly")
async def prophet_weekly(
    weeks: int = Query(13, ge=1, le=52),
    payer_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    ML-based weekly revenue forecast using Prophet / SARIMAX / ETS.
    Trains on historical payment data and predicts next N weeks with
    confidence intervals and per-payer breakdowns.
    """
    result = await forecast_weekly_revenue(db, payer_id, weeks)
    return result


@router.get("/prophet/daily")
async def prophet_daily(
    days: int = Query(30, ge=7, le=90),
    payer_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    ML-based daily payment forecast using Prophet / SARIMAX / ETS.
    Trains on historical daily payment data and predicts next N days.
    """
    result = await forecast_daily_payments(db, payer_id, days)
    return result


@router.get("/prophet/accuracy")
async def prophet_accuracy(
    payer_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Model accuracy metrics: holds out last 4 weeks of data,
    trains on the rest, and compares predictions to actuals.
    Returns MAPE, MAE, R-squared overall and per-payer.
    """
    result = await get_forecast_accuracy(db, payer_id)
    return result


# ---------------------------------------------------------------------------
# RECONCILIATION ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/reconciliation/weekly")
async def get_weekly_reconciliation(
    db: AsyncSession = Depends(get_db),
    weeks_back: int = Query(12, ge=1, le=52),
    payer_id:   Optional[str] = None,
    status:     Optional[str] = None,  # RECONCILED | VARIANCE | PENDING | ESCALATED
):
    """
    Weekly bank reconciliation: forecasted vs ERA received vs bank deposit.
    Closes the cash flow cycle for each payer.
    """
    today     = date.today()
    week_from = _week_start(today) - timedelta(weeks=weeks_back)

    q = select(BankReconciliation).where(
        BankReconciliation.week_start_date >= week_from
    )
    if payer_id:
        q = q.where(BankReconciliation.payer_id == payer_id)
    if status:
        q = q.where(BankReconciliation.reconciliation_status == status)
    q = q.order_by(desc(BankReconciliation.week_start_date))

    result = await db.execute(q)
    rows   = result.scalars().all()

    return {
        "total_records": len(rows),
        "weeks_back":    weeks_back,
        "records": [
            {
                "recon_id":            r.recon_id,
                "week_start":          str(r.week_start_date),
                "week_end":            str(r.week_end_date),
                "payer_id":            r.payer_id,
                "payer_name":          r.payer_name,
                "forecasted_amount":   round(r.forecasted_amount or 0, 2),
                "era_received":        round(r.era_received_amount or 0, 2),
                "bank_deposit":        round(r.bank_deposit_amount or 0, 2),
                "forecast_variance":   round(r.forecast_variance or 0, 2),
                "variance_pct":        round(r.forecast_variance_pct or 0, 2),
                "era_bank_variance":   round(r.era_bank_variance or 0, 2),
                "status":              r.reconciliation_status,
                "reconciled_date":     str(r.reconciled_date) if r.reconciled_date else None,
                "variance_reason":     r.variance_reason,
                "fed_back_to_model":   r.fed_back_to_model,
            }
            for r in rows
        ],
    }


@router.get("/reconciliation/summary")
async def get_reconciliation_summary(
    db: AsyncSession = Depends(get_db),
    weeks_back: int = Query(12, ge=1, le=52),
):
    """
    Reconciliation health summary: variance stats, escalations, accuracy.
    """
    today     = date.today()
    week_from = _week_start(today) - timedelta(weeks=weeks_back)

    q = select(
        BankReconciliation.reconciliation_status,
        func.count(BankReconciliation.recon_id).label("count"),
        func.sum(BankReconciliation.forecasted_amount).label("total_forecast"),
        func.sum(BankReconciliation.era_received_amount).label("total_received"),
        func.sum(BankReconciliation.forecast_variance).label("total_variance"),
        func.avg(func.abs(BankReconciliation.forecast_variance_pct)).label("avg_variance_pct"),
    ).where(
        BankReconciliation.week_start_date >= week_from
    ).group_by(BankReconciliation.reconciliation_status)

    result = await db.execute(q)
    rows   = result.all()

    stats = {}
    grand_forecast = 0
    grand_received = 0

    for row in rows:
        stats[row.reconciliation_status] = {
            "count":         int(row.count),
            "total_forecast": round(float(row.total_forecast or 0), 2),
            "total_received": round(float(row.total_received or 0), 2),
            "total_variance": round(float(row.total_variance or 0), 2),
            "avg_variance_pct": round(float(row.avg_variance_pct or 0), 2),
        }
        grand_forecast += float(row.total_forecast or 0)
        grand_received += float(row.total_received or 0)

    total_records = sum(s["count"] for s in stats.values())
    reconciled    = stats.get("RECONCILED", {}).get("count", 0)

    # Top escalated payers
    esc_q = select(
        BankReconciliation.payer_name,
        func.count(BankReconciliation.recon_id).label("escalations"),
        func.sum(func.abs(BankReconciliation.forecast_variance)).label("total_variance"),
    ).where(
        and_(
            BankReconciliation.week_start_date >= week_from,
            BankReconciliation.reconciliation_status == "ESCALATED",
        )
    ).group_by(BankReconciliation.payer_name).order_by(desc("total_variance")).limit(5)

    esc_r = await db.execute(esc_q)
    top_escalated = [
        {"payer": r.payer_name, "escalations": r.escalations, "total_variance": round(float(r.total_variance or 0), 2)}
        for r in esc_r.all()
    ]

    return {
        "period":           f"{week_from} to {today}",
        "total_records":    total_records,
        "reconciliation_rate_pct": round(reconciled / total_records * 100, 1) if total_records else 0,
        "total_forecasted": round(grand_forecast, 2),
        "total_received":   round(grand_received, 2),
        "overall_variance": round(grand_received - grand_forecast, 2),
        "forecast_accuracy_pct": round(
            (1 - abs(grand_received - grand_forecast) / grand_forecast) * 100, 1
        ) if grand_forecast > 0 else 0,
        "by_status":        stats,
        "top_escalated_payers": top_escalated,
    }
