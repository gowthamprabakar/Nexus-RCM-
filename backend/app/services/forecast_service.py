"""
3-Layer Revenue Forecast Engine
================================
Layer 1: Gross charge projection (historical volume x avg charge)
Layer 2: Denial-adjusted net (apply payer denial rates)
Layer 3: ADTP-timed cash realization (when money arrives)
"""
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, case, cast, Float, text, literal_column

from app.models.claim import Claim
from app.models.payer import Payer
from app.models.rcm_extended import EraPayment


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


async def compute_3layer_forecast(
    db: AsyncSession,
    weeks_ahead: int = 4,
    weeks_history: int = 12,
):
    """
    Returns forecast with all 3 layers broken down by payer and week.

    Layer 1 (GROSS):           historical claim volume x avg charge, projected forward
    Layer 2 (DENIAL-ADJUSTED): gross x (1 - payer denial_rate)
    Layer 3 (ADTP-TIMED):      shift net revenue by payer ADTP to determine cash arrival week
    """
    today = date.today()
    current_week = _week_start(today)
    history_start = current_week - timedelta(weeks=weeks_history)

    # ------------------------------------------------------------------
    # Step 1: Pull historical claim volume + avg charge per payer per week
    # ------------------------------------------------------------------
    hist_q = (
        select(
            Claim.payer_id,
            literal_column("date_trunc('week', claims.submission_date)").label("week"),
            func.count(Claim.claim_id).label("claim_count"),
            func.sum(Claim.total_charges).label("total_charges"),
            func.avg(Claim.total_charges).label("avg_charge"),
        )
        .select_from(Claim)
        .where(
            and_(
                Claim.submission_date >= history_start,
                Claim.submission_date < current_week,
                Claim.status != "VOIDED",
            )
        )
        .group_by(Claim.payer_id, literal_column("date_trunc('week', claims.submission_date)"))
    )
    hist_result = await db.execute(hist_q)
    hist_rows = hist_result.all()

    # Aggregate per-payer averages across weeks
    payer_history: dict = {}  # payer_id -> { weeks_seen, total_claims, total_charges }
    for row in hist_rows:
        pid = row.payer_id
        if pid not in payer_history:
            payer_history[pid] = {
                "weeks_seen": 0,
                "total_claims": 0,
                "total_charges": 0.0,
            }
        payer_history[pid]["weeks_seen"] += 1
        payer_history[pid]["total_claims"] += int(row.claim_count or 0)
        payer_history[pid]["total_charges"] += float(row.total_charges or 0)

    # ------------------------------------------------------------------
    # Step 2: Pull payer master data (denial_rate, ADTP, name, group)
    # ------------------------------------------------------------------
    payer_q = select(Payer)
    payer_result = await db.execute(payer_q)
    payers = {p.payer_id: p for p in payer_result.scalars().all()}

    # ------------------------------------------------------------------
    # Step 3: Compute actuals from ERA payments for confidence calibration
    # ------------------------------------------------------------------
    era_q = (
        select(
            EraPayment.payer_id,
            func.sum(EraPayment.payment_amount).label("total_paid"),
            func.count(EraPayment.era_id).label("era_count"),
        )
        .where(EraPayment.payment_date >= history_start)
        .group_by(EraPayment.payer_id)
    )
    era_result = await db.execute(era_q)
    era_by_payer = {
        row.payer_id: float(row.total_paid or 0) for row in era_result.all()
    }

    # ------------------------------------------------------------------
    # Build forecast layers
    # ------------------------------------------------------------------
    gross_by_week = []       # [{week_start, total, payers: [...]}]
    denial_by_week = []
    cash_by_week = []

    gross_by_payer = {}      # payer_id -> total gross over forecast period
    denial_by_payer = {}
    cash_by_payer = {}

    gross_total = 0.0
    denial_total = 0.0
    cash_total = 0.0
    weighted_adtp_sum = 0.0
    weighted_adtp_denom = 0.0

    # Pre-compute per-payer weekly averages
    payer_weekly_gross: dict = {}
    for pid, hist in payer_history.items():
        weeks_seen = max(hist["weeks_seen"], 1)
        avg_weekly_claims = hist["total_claims"] / weeks_seen
        avg_charge = (
            hist["total_charges"] / hist["total_claims"]
            if hist["total_claims"] > 0
            else 0
        )
        weekly_gross = avg_weekly_claims * avg_charge
        payer_weekly_gross[pid] = {
            "weekly_gross": weekly_gross,
            "avg_weekly_claims": avg_weekly_claims,
            "avg_charge": avg_charge,
        }

    # Cash arrival buffer: collect ADTP-shifted cash by future week
    cash_week_payer: dict = {}  # (week_start_str, payer_id) -> amount

    for wk_offset in range(weeks_ahead):
        wk_start = current_week + timedelta(weeks=wk_offset)
        wk_end = wk_start + timedelta(days=6)
        wk_label = str(wk_start)

        wk_gross_total = 0.0
        wk_denial_total = 0.0
        wk_gross_payers = []
        wk_denial_payers = []

        for pid, proj in payer_weekly_gross.items():
            payer = payers.get(pid)
            if not payer:
                continue

            weekly_gross = proj["weekly_gross"]
            denial_rate = payer.denial_rate or 0.0
            adtp_days = payer.adtp_days or 30
            weekly_net = weekly_gross * (1 - denial_rate)

            # --- Layer 1: Gross ---
            wk_gross_total += weekly_gross
            wk_gross_payers.append({
                "payer_id": pid,
                "payer_name": payer.payer_name,
                "payer_group": payer.payer_group,
                "amount": round(weekly_gross, 2),
                "avg_weekly_claims": round(proj["avg_weekly_claims"], 1),
                "avg_charge": round(proj["avg_charge"], 2),
            })
            gross_by_payer[pid] = gross_by_payer.get(pid, 0) + weekly_gross

            # --- Layer 2: Denial-adjusted ---
            wk_denial_total += weekly_net
            wk_denial_payers.append({
                "payer_id": pid,
                "payer_name": payer.payer_name,
                "payer_group": payer.payer_group,
                "amount": round(weekly_net, 2),
                "denial_rate": round(denial_rate, 4),
                "denied_amount": round(weekly_gross * denial_rate, 2),
            })
            denial_by_payer[pid] = denial_by_payer.get(pid, 0) + weekly_net

            # --- Layer 3: ADTP timing ---
            # Claims billed THIS week will produce cash ADTP days later
            adtp_weeks = adtp_days / 7.0
            cash_arrival_week_offset = wk_offset + int(round(adtp_weeks))
            cash_arrival_wk = current_week + timedelta(
                weeks=cash_arrival_week_offset
            )
            cash_arrival_key = (str(cash_arrival_wk), pid)

            cash_week_payer[cash_arrival_key] = (
                cash_week_payer.get(cash_arrival_key, 0) + weekly_net
            )
            cash_by_payer[pid] = cash_by_payer.get(pid, 0) + weekly_net

            weighted_adtp_sum += adtp_days * weekly_net
            weighted_adtp_denom += weekly_net

        gross_total += wk_gross_total
        denial_total += wk_denial_total

        wk_gross_payers.sort(key=lambda x: -x["amount"])
        wk_denial_payers.sort(key=lambda x: -x["amount"])

        gross_by_week.append({
            "week_start": wk_label,
            "week_end": str(wk_end),
            "total": round(wk_gross_total, 2),
            "payers": wk_gross_payers,
        })
        denial_by_week.append({
            "week_start": wk_label,
            "week_end": str(wk_end),
            "total": round(wk_denial_total, 2),
            "payers": wk_denial_payers,
        })

    # Build cash_by_week for the forecast window
    for wk_offset in range(weeks_ahead):
        wk_start = current_week + timedelta(weeks=wk_offset)
        wk_end = wk_start + timedelta(days=6)
        wk_label = str(wk_start)

        wk_cash_total = 0.0
        wk_cash_payers = []

        for pid in payer_weekly_gross:
            payer = payers.get(pid)
            if not payer:
                continue
            key = (wk_label, pid)
            amount = cash_week_payer.get(key, 0)

            # Also include cash from claims billed BEFORE the forecast window
            # that arrive during this window (backlog cash)
            adtp_days = payer.adtp_days or 30
            adtp_weeks = int(round(adtp_days / 7.0))
            source_wk_offset = wk_offset - adtp_weeks
            if source_wk_offset < 0:
                # Cash from pre-forecast claims arriving now
                proj = payer_weekly_gross.get(pid, {})
                weekly_gross = proj.get("weekly_gross", 0)
                denial_rate = payer.denial_rate or 0.0
                backlog_net = weekly_gross * (1 - denial_rate)
                amount += backlog_net

            wk_cash_total += amount
            if amount > 0:
                wk_cash_payers.append({
                    "payer_id": pid,
                    "payer_name": payer.payer_name,
                    "payer_group": payer.payer_group,
                    "amount": round(amount, 2),
                    "adtp_days": payer.adtp_days,
                })

        cash_total += wk_cash_total
        wk_cash_payers.sort(key=lambda x: -x["amount"])

        cash_by_week.append({
            "week_start": wk_label,
            "week_end": str(wk_end),
            "total": round(wk_cash_total, 2),
            "payers": wk_cash_payers,
        })

    # ------------------------------------------------------------------
    # Confidence bands based on historical variance
    # ------------------------------------------------------------------
    # Use actual ERA vs projected to calibrate
    total_era_actual = sum(era_by_payer.values())
    if gross_total > 0 and total_era_actual > 0:
        hist_accuracy = min(total_era_actual / gross_total, 1.0)
    else:
        hist_accuracy = 0.85  # default

    variance_factor = 1 - hist_accuracy
    confidence_low = round(cash_total * (1 - variance_factor * 1.5), 2)
    confidence_mid = round(cash_total, 2)
    confidence_high = round(cash_total * (1 + variance_factor * 0.5), 2)

    avg_adtp = (
        round(weighted_adtp_sum / weighted_adtp_denom, 1)
        if weighted_adtp_denom > 0
        else 0
    )
    denial_reduction_pct = (
        round((gross_total - denial_total) / gross_total * 100, 1)
        if gross_total > 0
        else 0
    )

    # Format payer summaries for top-level by_payer
    def _payer_summary(by_payer_dict):
        items = []
        for pid, total in sorted(by_payer_dict.items(), key=lambda x: -x[1]):
            payer = payers.get(pid)
            items.append({
                "payer_id": pid,
                "payer_name": payer.payer_name if payer else pid,
                "payer_group": payer.payer_group if payer else "UNKNOWN",
                "total": round(total, 2),
            })
        return items

    return {
        "forecast_weeks": weeks_ahead,
        "generated_at": str(today),
        "history_weeks": weeks_history,
        "layers": {
            "gross": {
                "total": round(gross_total, 2),
                "by_week": gross_by_week,
                "by_payer": _payer_summary(gross_by_payer),
            },
            "denial_adjusted": {
                "total": round(denial_total, 2),
                "by_week": denial_by_week,
                "by_payer": _payer_summary(denial_by_payer),
            },
            "cash_realization": {
                "total": round(cash_total, 2),
                "by_week": cash_by_week,
                "by_payer": _payer_summary(cash_by_payer),
            },
        },
        "summary": {
            "gross_total": round(gross_total, 2),
            "net_after_denials": round(denial_total, 2),
            "expected_cash_4wk": round(cash_total, 2),
            "denial_reduction_pct": denial_reduction_pct,
            "timing_shift_days": avg_adtp,
        },
        "confidence": {
            "low": confidence_low,
            "mid": confidence_mid,
            "high": confidence_high,
        },
    }
