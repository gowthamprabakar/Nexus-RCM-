"""
Finance Service — Cash Flow, DSO, DPO, Working Capital, Scenario Modeling
=========================================================================
Production-grade financial analytics for NEXUS RCM.

Functions:
  build_daily_cash_flow(db, days)          → daily cash flow timeline
  compute_dso(db, lookback_days)           → DSO with payer breakdown
  compute_dpo(db, lookback_days)           → DPO (ERA→bank lag)
  compute_working_capital(db)              → working capital KPIs
  apply_scenario(db, days, scenario)       → recompute forecast w/ deltas
  list_unmatched_eras(db, limit)           → orphaned ERAs
"""

import logging
from datetime import date, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy import select, func, and_, or_, desc, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.payer import Payer
from app.models.rcm_extended import (
    EraPayment,
    PaymentForecast,
    BankReconciliation,
)

logger = logging.getLogger(__name__)


# Statuses considered open AR
AR_STATUSES = ("SUBMITTED", "ACKNOWLEDGED", "PENDING", "PARTIAL_PAID", "APPEALED")
# Statuses counted as revenue (everything that's been billed)
REVENUE_STATUSES = (
    "SUBMITTED", "ACKNOWLEDGED", "PAID", "DENIED",
    "APPEALED", "PARTIAL_PAID", "PENDING",
)

# Industry benchmarks
DSO_BENCHMARK = 35.0
DPO_BENCHMARK = 2.0


# ============================================================================
# 1. DAILY CASH FLOW TIMELINE
# ============================================================================
async def build_daily_cash_flow(
    db: AsyncSession,
    days: int = 90,
) -> Dict[str, Any]:
    """
    Day-by-day projected cash inflow vs actual ERA vs bank deposited.
    Returns past + future window. Cumulative balance starts from sum of
    bank_deposit_amount to-date.
    """
    today = date.today()
    # Window: 30 days history + N days forecast
    history_days = min(30, days // 3)
    start_date = today - timedelta(days=history_days)
    end_date = today + timedelta(days=days)

    # ----- Historical bank deposits => starting cumulative balance ---------
    starting_balance = await db.scalar(
        select(func.sum(BankReconciliation.bank_deposit_amount)).where(
            BankReconciliation.week_end_date < start_date
        )
    ) or 0.0
    starting_balance = float(starting_balance)

    # ----- Actual ERAs by date (history window) -----------------------------
    era_q = (
        select(
            EraPayment.payment_date,
            func.sum(EraPayment.payment_amount).label("amount"),
        )
        .where(
            and_(
                EraPayment.payment_date >= start_date,
                EraPayment.payment_date <= today,
            )
        )
        .group_by(EraPayment.payment_date)
    )
    era_rows = (await db.execute(era_q)).all()
    era_by_date: Dict[date, float] = {
        r.payment_date: float(r.amount or 0) for r in era_rows
    }

    # ----- Bank deposits by week (history) ----------------------------------
    bank_q = (
        select(
            BankReconciliation.week_start_date,
            BankReconciliation.week_end_date,
            func.sum(BankReconciliation.bank_deposit_amount).label("amount"),
        )
        .where(
            and_(
                BankReconciliation.week_end_date >= start_date,
                BankReconciliation.week_start_date <= today,
            )
        )
        .group_by(
            BankReconciliation.week_start_date,
            BankReconciliation.week_end_date,
        )
    )
    bank_rows = (await db.execute(bank_q)).all()
    # Distribute weekly bank deposit equally across weekdays of that week
    bank_by_date: Dict[date, float] = {}
    for r in bank_rows:
        wk_start = r.week_start_date
        wk_end = r.week_end_date or (wk_start + timedelta(days=6))
        amt = float(r.amount or 0)
        if amt <= 0 or wk_start is None:
            continue
        # Spread across 5 weekdays
        per_day = amt / 5.0
        for offset in range(7):
            d = wk_start + timedelta(days=offset)
            if d > wk_end:
                break
            if d.weekday() < 5:
                bank_by_date[d] = bank_by_date.get(d, 0) + per_day

    # ----- Forecasted inflow per WEEK from PaymentForecast ------------------
    fc_q = (
        select(
            PaymentForecast.week_start_date,
            PaymentForecast.week_end_date,
            func.sum(PaymentForecast.forecasted_amount).label("amount"),
        )
        .where(PaymentForecast.week_end_date >= start_date)
        .where(PaymentForecast.week_start_date <= end_date)
        .group_by(
            PaymentForecast.week_start_date,
            PaymentForecast.week_end_date,
        )
    )
    fc_rows = (await db.execute(fc_q)).all()
    forecast_by_date: Dict[date, float] = {}
    for r in fc_rows:
        wk_start = r.week_start_date
        wk_end = r.week_end_date or (wk_start + timedelta(days=6))
        amt = float(r.amount or 0)
        if amt <= 0 or wk_start is None:
            continue
        # Forecast lands on weekdays only (banks closed weekends)
        weekdays = [
            wk_start + timedelta(days=i)
            for i in range(7)
            if (wk_start + timedelta(days=i)) <= wk_end
            and (wk_start + timedelta(days=i)).weekday() < 5
        ]
        if not weekdays:
            continue
        per_day = amt / len(weekdays)
        for d in weekdays:
            forecast_by_date[d] = forecast_by_date.get(d, 0) + per_day

    # ----- If no forecast in DB, derive from rolling avg of ERA -------------
    if not forecast_by_date:
        # Average daily ERA over past 60 days as fallback projection
        baseline = await db.scalar(
            select(func.avg(EraPayment.payment_amount)).where(
                EraPayment.payment_date >= today - timedelta(days=60)
            )
        ) or 0.0
        # Get count per day to estimate volume
        daily_avg_q = select(
            func.sum(EraPayment.payment_amount).label("total"),
            func.count(func.distinct(EraPayment.payment_date)).label("days"),
        ).where(EraPayment.payment_date >= today - timedelta(days=60))
        rr = (await db.execute(daily_avg_q)).one()
        avg_daily = (
            float(rr.total or 0) / max(int(rr.days or 1), 1)
        )
        for offset in range(days):
            d = today + timedelta(days=offset)
            if d.weekday() < 5:
                forecast_by_date[d] = avg_daily

    # ----- Build day-by-day series -----------------------------------------
    cumulative = starting_balance
    days_list: List[Dict[str, Any]] = []

    # First, accumulate balance up to start_date using actual ERAs/bank
    # (already counted by starting_balance above; start fresh from start_date)

    for offset in range((end_date - start_date).days + 1):
        d = start_date + timedelta(days=offset)
        is_past = d <= today

        actual_era = float(era_by_date.get(d, 0))
        bank_dep = float(bank_by_date.get(d, 0))
        proj_inflow = float(forecast_by_date.get(d, 0))

        # For past days, "real" inflow = actual ERA (or bank if no ERA)
        # For future days, inflow = projection
        if is_past:
            # Use bank_dep if present, else ERA, else nothing
            realized = bank_dep if bank_dep > 0 else actual_era
            cumulative += realized
            variance = (actual_era - proj_inflow) if proj_inflow else 0.0
        else:
            cumulative += proj_inflow
            variance = 0.0

        days_list.append({
            "date": str(d),
            "projected_inflow": round(proj_inflow, 2),
            "actual_era": round(actual_era, 2),
            "bank_deposited": round(bank_dep, 2),
            "cumulative_balance": round(cumulative, 2),
            "variance": round(variance, 2),
            "is_actual": is_past,
        })

    # ----- Summary ---------------------------------------------------------
    # current_balance = cumulative through today
    current_balance = next(
        (d["cumulative_balance"] for d in reversed(days_list) if d["is_actual"]),
        starting_balance,
    )

    def proj_at(target_offset: int) -> float:
        target_date = today + timedelta(days=target_offset)
        for d in days_list:
            if d["date"] == str(target_date):
                return d["cumulative_balance"]
        # If target outside window, use last day
        return days_list[-1]["cumulative_balance"] if days_list else current_balance

    return {
        "days": days_list,
        "summary": {
            "current_balance": round(current_balance, 2),
            "projected_30d": round(proj_at(min(30, days)), 2),
            "projected_60d": round(proj_at(min(60, days)), 2),
            "projected_90d": round(proj_at(min(90, days)), 2),
        },
        "as_of": str(today),
    }


# ============================================================================
# 2. DSO — Days Sales Outstanding
# ============================================================================
async def compute_dso(
    db: AsyncSession,
    lookback_days: int = 90,
) -> Dict[str, Any]:
    """
    DSO = (total_AR / total_revenue) * lookback_days
    Total AR = sum of total_charges in open statuses
    Revenue = sum of total_charges submitted in lookback window
    """
    today = date.today()
    cutoff = today - timedelta(days=lookback_days)
    prior_cutoff = today - timedelta(days=lookback_days * 2)

    # ----- Total AR (open balances) ----------------------------------------
    total_ar = await db.scalar(
        select(func.sum(Claim.total_charges)).where(
            Claim.status.in_(AR_STATUSES)
        )
    ) or 0.0
    total_ar = float(total_ar)

    # ----- Revenue in lookback window --------------------------------------
    total_revenue = await db.scalar(
        select(func.sum(Claim.total_charges)).where(
            and_(
                Claim.submission_date >= cutoff,
                Claim.submission_date <= today,
                Claim.status.in_(REVENUE_STATUSES),
            )
        )
    ) or 0.0
    total_revenue = float(total_revenue)

    # ----- Prior period DSO for trend --------------------------------------
    prior_revenue = await db.scalar(
        select(func.sum(Claim.total_charges)).where(
            and_(
                Claim.submission_date >= prior_cutoff,
                Claim.submission_date < cutoff,
                Claim.status.in_(REVENUE_STATUSES),
            )
        )
    ) or 0.0
    prior_revenue = float(prior_revenue)

    # AR snapshot at prior cutoff: claims open as of cutoff that were
    # submitted before cutoff
    prior_ar = await db.scalar(
        select(func.sum(Claim.total_charges)).where(
            and_(
                Claim.submission_date < cutoff,
                Claim.status.in_(AR_STATUSES),
            )
        )
    ) or 0.0
    prior_ar = float(prior_ar)

    dso = (total_ar / total_revenue * lookback_days) if total_revenue > 0 else 0.0
    prior_dso = (prior_ar / prior_revenue * lookback_days) if prior_revenue > 0 else dso
    trend_vs_prior = round(dso - prior_dso, 2)

    # ----- DSO by payer ----------------------------------------------------
    # AR by payer
    ar_by_payer_q = (
        select(
            Claim.payer_id,
            func.sum(Claim.total_charges).label("ar"),
            func.count(Claim.claim_id).label("ar_claims"),
        )
        .where(Claim.status.in_(AR_STATUSES))
        .group_by(Claim.payer_id)
    )
    ar_rows = (await db.execute(ar_by_payer_q)).all()
    ar_map = {r.payer_id: (float(r.ar or 0), int(r.ar_claims or 0)) for r in ar_rows}

    # Revenue by payer in window
    rev_by_payer_q = (
        select(
            Claim.payer_id,
            func.sum(Claim.total_charges).label("rev"),
            func.count(Claim.claim_id).label("rev_claims"),
        )
        .where(
            and_(
                Claim.submission_date >= cutoff,
                Claim.submission_date <= today,
                Claim.status.in_(REVENUE_STATUSES),
            )
        )
        .group_by(Claim.payer_id)
    )
    rev_rows = (await db.execute(rev_by_payer_q)).all()
    rev_map = {r.payer_id: (float(r.rev or 0), int(r.rev_claims or 0)) for r in rev_rows}

    # Payer names
    payer_rows = (await db.execute(select(Payer.payer_id, Payer.payer_name))).all()
    name_map = {r.payer_id: r.payer_name for r in payer_rows}

    payer_ids = set(ar_map) | set(rev_map)
    by_payer: List[Dict[str, Any]] = []
    for pid in payer_ids:
        ar_amt, ar_cnt = ar_map.get(pid, (0.0, 0))
        rev_amt, rev_cnt = rev_map.get(pid, (0.0, 0))
        if rev_amt <= 0 and ar_amt <= 0:
            continue
        p_dso = (ar_amt / rev_amt * lookback_days) if rev_amt > 0 else 0.0
        by_payer.append({
            "payer_id": pid,
            "payer_name": name_map.get(pid, pid),
            "dso": round(p_dso, 1),
            "claims": ar_cnt + rev_cnt,
            "ar_amount": round(ar_amt, 2),
            "revenue": round(rev_amt, 2),
        })
    by_payer.sort(key=lambda x: -x["ar_amount"])
    by_payer = by_payer[:25]

    # ----- Percentile rank (lower DSO = better, higher percentile) ----------
    # Industry benchmark range: best-in-class ~25 days, median ~40, p10 ~65
    # Map DSO -> percentile (100 = best, 0 = worst)
    if dso <= 25:
        percentile_rank = 95
    elif dso <= 35:
        percentile_rank = int(round(95 - (dso - 25)))
    elif dso <= 50:
        percentile_rank = int(round(85 - (dso - 35) * 1.5))
    elif dso <= 75:
        percentile_rank = int(round(60 - (dso - 50) * 1.2))
    else:
        percentile_rank = max(5, int(round(30 - (dso - 75) * 0.5)))
    percentile_rank = max(0, min(99, percentile_rank))

    return {
        "dso": round(dso, 1),
        "benchmark": DSO_BENCHMARK,
        "trend_vs_prior": trend_vs_prior,
        "percentile_rank": percentile_rank,
        "by_payer": by_payer,
        "calculation": {
            "total_ar": round(total_ar, 2),
            "total_revenue": round(total_revenue, 2),
            "lookback_days": lookback_days,
        },
    }


# ============================================================================
# 3. DPO — average days from ERA receipt to bank deposit
# ============================================================================
async def compute_dpo(
    db: AsyncSession,
    lookback_days: int = 90,
) -> Dict[str, Any]:
    """
    DPO (lite) = avg float_days from BankReconciliation
    """
    today = date.today()
    cutoff = today - timedelta(days=lookback_days)

    # Overall avg float
    avg_float = await db.scalar(
        select(func.avg(BankReconciliation.float_days)).where(
            and_(
                BankReconciliation.week_start_date >= cutoff,
                BankReconciliation.float_days.isnot(None),
            )
        )
    )
    if avg_float is None:
        # Fallback: derive from payment_date vs reconciled_date
        avg_float = await db.scalar(
            select(
                func.avg(
                    func.cast(
                        BankReconciliation.week_end_date - BankReconciliation.week_start_date,
                        # This is a date subtraction returning interval days
                    )
                )
            ).where(BankReconciliation.week_start_date >= cutoff)
        )
    dpo = float(avg_float or 0.0)

    # By payer
    by_payer_q = (
        select(
            BankReconciliation.payer_id,
            BankReconciliation.payer_name,
            func.avg(BankReconciliation.float_days).label("avg_float"),
            func.count().label("samples"),
        )
        .where(
            and_(
                BankReconciliation.week_start_date >= cutoff,
                BankReconciliation.float_days.isnot(None),
            )
        )
        .group_by(BankReconciliation.payer_id, BankReconciliation.payer_name)
        .order_by(desc("avg_float"))
        .limit(25)
    )
    rows = (await db.execute(by_payer_q)).all()
    by_payer = [
        {
            "payer_id": r.payer_id,
            "payer_name": r.payer_name or r.payer_id,
            "dpo": round(float(r.avg_float or 0), 1),
            "sample_size": int(r.samples or 0),
        }
        for r in rows
    ]

    return {
        "dpo": round(dpo, 1),
        "benchmark": DPO_BENCHMARK,
        "by_payer": by_payer,
        "lookback_days": lookback_days,
    }


# ============================================================================
# 4. SCENARIO MODELING
# ============================================================================
async def apply_scenario(
    db: AsyncSession,
    scenario: Dict[str, float],
    days: int = 90,
) -> Dict[str, Any]:
    """
    Recompute 90-day forecast applying:
      - denial_rate_delta:    additional denial fraction (negative effect)
      - payer_lag_delta:      shift cash arrival N days later (or earlier)
      - appeal_win_rate_delta:additional recovery fraction (positive effect)
    """
    denial_delta = float(scenario.get("denial_rate_delta", 0) or 0)
    lag_delta = int(scenario.get("payer_lag_delta", 0) or 0)
    appeal_delta = float(scenario.get("appeal_win_rate_delta", 0) or 0)

    base = await build_daily_cash_flow(db, days=days)

    # Pull denial-rate weighted average for current denial rate context
    avg_denial = await db.scalar(select(func.avg(Payer.denial_rate))) or 0.10
    avg_denial = float(avg_denial)

    # multiplier for inflow:
    #   reduction from denial increase = (1 - denial_delta)
    #   recovery from appeal_delta on the prior-denied portion = appeal_delta * avg_denial
    multiplier = (1 - denial_delta) + (appeal_delta * avg_denial)

    today = date.today()
    base_days = base["days"]

    # ----- Apply multiplier + shift to FUTURE days only --------------------
    # Build a date-keyed map of base future projections
    future_proj: Dict[str, float] = {}
    for d in base_days:
        if not d["is_actual"]:
            future_proj[d["date"]] = d["projected_inflow"]

    # Shift: a positive lag_delta pushes inflow LATER by N days
    shifted_proj: Dict[str, float] = {}
    from datetime import datetime
    for ds, amt in future_proj.items():
        dt = datetime.strptime(ds, "%Y-%m-%d").date()
        new_dt = dt + timedelta(days=lag_delta)
        new_key = str(new_dt)
        shifted_proj[new_key] = shifted_proj.get(new_key, 0) + amt * multiplier

    # ----- Recompute cumulative w/ scenario projections --------------------
    new_days: List[Dict[str, Any]] = []
    cumulative = 0.0
    # Find starting cumulative = balance at last actual day
    last_actual_balance = next(
        (d["cumulative_balance"] for d in reversed(base_days) if d["is_actual"]),
        0.0,
    )
    base_starting_actual = next(
        (d["cumulative_balance"] for d in base_days if d["is_actual"]),
        0.0,
    )
    # Carry historical days untouched
    for d in base_days:
        if d["is_actual"]:
            new_days.append(dict(d))
            cumulative = d["cumulative_balance"]
        else:
            ds = d["date"]
            new_proj = shifted_proj.get(ds, 0.0)
            cumulative += new_proj
            nd = dict(d)
            nd["projected_inflow"] = round(new_proj, 2)
            nd["cumulative_balance"] = round(cumulative, 2)
            nd["variance"] = round(new_proj - d["projected_inflow"], 2)
            new_days.append(nd)

    # ----- Impact summary --------------------------------------------------
    base_90 = base["summary"]["projected_90d"]
    scen_90 = new_days[-1]["cumulative_balance"] if new_days else base_90
    delta = scen_90 - base_90
    delta_pct = (delta / base_90 * 100) if base_90 else 0.0

    return {
        "days": new_days,
        "impact": {
            "base_90d_cash": round(base_90, 2),
            "scenario_90d_cash": round(scen_90, 2),
            "delta": round(delta, 2),
            "delta_pct": round(delta_pct, 2),
        },
        "inputs": {
            "denial_rate_delta": denial_delta,
            "payer_lag_delta": lag_delta,
            "appeal_win_rate_delta": appeal_delta,
        },
        "multiplier_applied": round(multiplier, 4),
    }


# ============================================================================
# 5. WORKING CAPITAL KPIs
# ============================================================================
async def compute_working_capital(db: AsyncSession) -> Dict[str, Any]:
    """
    cash_on_hand = cumulative bank deposits to-date
    ar_balance   = sum total_charges in open statuses
    burn_rate    = avg daily ERA outflow estimate (we approximate as 1.5% AR/day)
    """
    today = date.today()

    # Cash on hand = sum of ALL bank deposits we've seen
    cash = await db.scalar(
        select(func.sum(BankReconciliation.bank_deposit_amount))
    ) or 0.0
    cash = float(cash)

    # AR balance
    ar = await db.scalar(
        select(func.sum(Claim.total_charges)).where(Claim.status.in_(AR_STATUSES))
    ) or 0.0
    ar = float(ar)

    # Burn rate: avg daily ERA payment over past 60 days as proxy for outflow scale
    # Real "burn" would need expenses; we use revenue throughput / 30 as fallback
    last_60_inflow = await db.scalar(
        select(func.sum(EraPayment.payment_amount)).where(
            EraPayment.payment_date >= today - timedelta(days=60)
        )
    ) or 0.0
    avg_daily_inflow = float(last_60_inflow) / 60.0 if last_60_inflow else 0.0
    # Burn = ~70% of avg daily inflow (operating costs as % of revenue)
    burn_rate = avg_daily_inflow * 0.70

    runway_days = int(cash / burn_rate) if burn_rate > 0 else 999

    return {
        "cash_on_hand": round(cash, 2),
        "ar_balance": round(ar, 2),
        "working_capital": round(cash + ar, 2),
        "cash_runway_days": runway_days,
        "projected_burn_rate": round(burn_rate, 2),
        "as_of": str(today),
    }


# ============================================================================
# 6. UNMATCHED ERAs (orphaned — no bank deposit match)
# ============================================================================
async def list_unmatched_eras(
    db: AsyncSession,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """
    Return ERAs whose payment_date doesn't fall inside any
    BankReconciliation week with a bank_deposit_amount > 0,
    OR ERAs > 3 days old without matching bank activity.
    """
    today = date.today()
    cutoff = today - timedelta(days=120)

    # Build lookup of (payer_id, week_start) -> bank_deposit_amount
    bank_q = select(
        BankReconciliation.payer_id,
        BankReconciliation.week_start_date,
        BankReconciliation.week_end_date,
        BankReconciliation.bank_deposit_amount,
    ).where(BankReconciliation.week_start_date >= cutoff)
    bank_rows = (await db.execute(bank_q)).all()

    # Index by payer for fast lookup
    bank_index: Dict[str, List[tuple]] = {}
    for r in bank_rows:
        if r.bank_deposit_amount and r.bank_deposit_amount > 0:
            bank_index.setdefault(r.payer_id, []).append(
                (r.week_start_date, r.week_end_date)
            )

    # Pull recent ERAs
    era_q = (
        select(EraPayment, Payer.payer_name)
        .join(Payer, Payer.payer_id == EraPayment.payer_id, isouter=True)
        .where(EraPayment.payment_date >= cutoff)
        .order_by(desc(EraPayment.payment_date))
        .limit(limit * 5)  # over-fetch then filter
    )
    era_rows = (await db.execute(era_q)).all()

    unmatched: List[Dict[str, Any]] = []
    for row in era_rows:
        era = row.EraPayment
        pname = row.payer_name
        weeks = bank_index.get(era.payer_id, [])

        matched = False
        for ws, we in weeks:
            we = we or (ws + timedelta(days=6))
            if ws <= era.payment_date <= we:
                matched = True
                break

        days_since = (today - era.payment_date).days

        if matched and days_since <= 3:
            continue  # well-matched & recent — skip

        # Determine status
        if not matched and days_since > 7:
            status = "ORPHANED"
        elif not matched:
            status = "PENDING_DEPOSIT"
        else:
            status = "DELAYED"

        unmatched.append({
            "era_id": era.era_id,
            "payer_id": era.payer_id,
            "payer_name": pname or era.payer_id,
            "payment_date": str(era.payment_date),
            "amount": round(float(era.payment_amount or 0), 2),
            "days_since_receipt": days_since,
            "status": status,
            "eft_trace_number": era.eft_trace_number,
            "payment_method": era.payment_method,
        })

        if len(unmatched) >= limit:
            break

    # Sort: ORPHANED first, then by days_since desc
    status_priority = {"ORPHANED": 0, "DELAYED": 1, "PENDING_DEPOSIT": 2}
    unmatched.sort(
        key=lambda x: (status_priority.get(x["status"], 99), -x["days_since_receipt"])
    )

    return unmatched[:limit]
