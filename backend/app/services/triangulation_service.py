"""
Payment Triangulation Service — Sprint 5
==========================================
Three-way reconciliation: Forecast vs ERA vs Bank.
Silent underpayment detection and float analysis.

Functions:
  get_triangulation_summary(db, filters) → dict
  get_payer_triangulation(db, payer_id) → dict
  detect_silent_underpayments(db, payer_id, min_variance_pct) → dict
  compute_float_analysis(db, payer_id) → dict
"""

import logging
from typing import Optional
from datetime import date, timedelta

from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rcm_extended import (
    EraPayment, PaymentForecast, BankReconciliation, ClaimLine,
)
from app.models.root_cause import PayerContractRate
from app.models.payer import Payer

logger = logging.getLogger(__name__)


async def get_triangulation_summary(db: AsyncSession,
                                     filters: Optional[dict] = None) -> dict:
    """
    Aggregate triangulation: Forecast vs ERA vs Bank across all payers.
    """
    try:
        filters = filters or {}

        # Total forecasted
        forecast_q = select(func.sum(PaymentForecast.forecasted_amount))
        if filters.get("payer_id"):
            forecast_q = forecast_q.where(PaymentForecast.payer_id == filters["payer_id"])
        total_forecasted = await db.scalar(forecast_q) or 0

        # Total ERA received
        era_q = select(func.sum(EraPayment.payment_amount))
        if filters.get("payer_id"):
            era_q = era_q.where(EraPayment.payer_id == filters["payer_id"])
        total_era = await db.scalar(era_q) or 0

        # Total bank deposited
        bank_q = select(func.sum(BankReconciliation.bank_deposit_amount))
        if filters.get("payer_id"):
            bank_q = bank_q.where(BankReconciliation.payer_id == filters["payer_id"])
        total_bank = await db.scalar(bank_q) or 0

        # Variances
        forecast_era_gap = float(total_era) - float(total_forecasted)
        era_bank_gap = float(total_bank) - float(total_era)

        forecast_era_pct = (forecast_era_gap / float(total_forecasted) * 100) if total_forecasted else 0
        era_bank_pct = (era_bank_gap / float(total_era) * 100) if total_era else 0

        # Reconciliation status counts
        status_q = (
            select(
                BankReconciliation.reconciliation_status,
                func.count().label("count"),
            )
            .group_by(BankReconciliation.reconciliation_status)
        )
        if filters.get("payer_id"):
            status_q = status_q.where(BankReconciliation.payer_id == filters["payer_id"])
        status_rows = await db.execute(status_q)
        statuses = {row[0]: row[1] for row in status_rows}

        # Per-payer breakdown (top 10)
        payer_breakdown_q = (
            select(
                BankReconciliation.payer_id,
                BankReconciliation.payer_name,
                func.sum(BankReconciliation.forecasted_amount).label("forecasted"),
                func.sum(BankReconciliation.era_received_amount).label("era"),
                func.sum(BankReconciliation.bank_deposit_amount).label("bank"),
                func.sum(BankReconciliation.forecast_variance).label("variance"),
            )
            .group_by(BankReconciliation.payer_id, BankReconciliation.payer_name)
            .order_by(desc("variance"))
            .limit(10)
        )
        if filters.get("payer_id"):
            payer_breakdown_q = payer_breakdown_q.where(
                BankReconciliation.payer_id == filters["payer_id"]
            )
        payer_rows = await db.execute(payer_breakdown_q)

        payer_breakdown = []
        for row in payer_rows:
            payer_breakdown.append({
                "payer_id": row[0],
                "payer_name": row[1],
                "forecasted": round(float(row[2] or 0), 2),
                "era_received": round(float(row[3] or 0), 2),
                "bank_deposited": round(float(row[4] or 0), 2),
                "variance": round(float(row[5] or 0), 2),
            })

        return {
            "total_forecasted": round(float(total_forecasted), 2),
            "total_era_received": round(float(total_era), 2),
            "total_bank_deposited": round(float(total_bank), 2),
            "forecast_era_gap": round(forecast_era_gap, 2),
            "forecast_era_gap_pct": round(forecast_era_pct, 2),
            "era_bank_gap": round(era_bank_gap, 2),
            "era_bank_gap_pct": round(era_bank_pct, 2),
            "reconciliation_statuses": statuses,
            "payer_breakdown": payer_breakdown,
        }

    except Exception as e:
        logger.error(f"get_triangulation_summary failed: {e}")
        return {
            "total_forecasted": 0,
            "total_era_received": 0,
            "total_bank_deposited": 0,
            "forecast_era_gap": 0,
            "forecast_era_gap_pct": 0,
            "era_bank_gap": 0,
            "era_bank_gap_pct": 0,
            "reconciliation_statuses": {},
            "payer_breakdown": [],
        }


async def get_payer_triangulation(db: AsyncSession, payer_id: str) -> dict:
    """Detailed triangulation for a single payer, broken down by week."""
    try:
        payer = await db.get(Payer, payer_id)
        payer_name = payer.payer_name if payer else "Unknown"

        # Weekly reconciliation records for this payer
        result = await db.execute(
            select(BankReconciliation)
            .where(BankReconciliation.payer_id == payer_id)
            .order_by(desc(BankReconciliation.week_start_date))
            .limit(26)
        )
        rows = result.scalars().all()

        weeks = []
        for r in rows:
            weeks.append({
                "recon_id": r.recon_id,
                "week_start": str(r.week_start_date),
                "week_end": str(r.week_end_date),
                "forecasted": round(float(r.forecasted_amount or 0), 2),
                "era_received": round(float(r.era_received_amount or 0), 2),
                "bank_deposited": round(float(r.bank_deposit_amount or 0), 2),
                "forecast_variance": round(float(r.forecast_variance or 0), 2),
                "forecast_variance_pct": round(float(r.forecast_variance_pct or 0), 2),
                "era_bank_variance": round(float(r.era_bank_variance or 0), 2),
                "status": r.reconciliation_status,
                "float_days": r.float_days,
                "is_anomaly": r.is_anomaly,
                "anomaly_type": r.anomaly_type,
            })

        # Aggregates
        total_forecasted = sum(w["forecasted"] for w in weeks)
        total_era = sum(w["era_received"] for w in weeks)
        total_bank = sum(w["bank_deposited"] for w in weeks)

        return {
            "payer_id": payer_id,
            "payer_name": payer_name,
            "total_forecasted": round(total_forecasted, 2),
            "total_era_received": round(total_era, 2),
            "total_bank_deposited": round(total_bank, 2),
            "forecast_era_gap": round(total_era - total_forecasted, 2),
            "era_bank_gap": round(total_bank - total_era, 2),
            "weeks": weeks,
        }

    except Exception as e:
        logger.error(f"get_payer_triangulation failed for {payer_id}: {e}")
        return {"payer_id": payer_id, "payer_name": "Unknown", "weeks": []}


async def detect_silent_underpayments(db: AsyncSession,
                                      payer_id: Optional[str] = None,
                                      min_variance_pct: float = 0.05) -> dict:
    """
    Detect silent underpayments by comparing ERA paid_amount vs
    expected contract rate * units for each claim line.
    """
    try:
        # Join EraPayment → ClaimLine → PayerContractRate
        q = (
            select(
                EraPayment.era_id,
                EraPayment.claim_id,
                EraPayment.payer_id,
                EraPayment.payment_amount,
                ClaimLine.cpt_code,
                ClaimLine.units,
                ClaimLine.paid_amount,
                ClaimLine.charge_amount,
                PayerContractRate.expected_rate,
            )
            .select_from(EraPayment)
            .join(ClaimLine, ClaimLine.claim_id == EraPayment.claim_id, isouter=True)
            .join(
                PayerContractRate,
                and_(
                    PayerContractRate.payer_id == EraPayment.payer_id,
                    PayerContractRate.cpt_code == ClaimLine.cpt_code,
                ),
                isouter=True,
            )
            .where(PayerContractRate.expected_rate.isnot(None))
        )
        if payer_id:
            q = q.where(EraPayment.payer_id == payer_id)

        q = q.limit(1000)
        result = await db.execute(q)
        rows = result.all()

        underpayments = []
        total_underpaid = 0.0
        total_checked = 0

        for row in rows:
            era_id, claim_id, p_id, payment_amt, cpt, units, paid, charge, expected = row
            if not expected or not payment_amt:
                continue

            total_checked += 1
            actual_paid = float(payment_amt)
            expected_total = float(expected) * max(int(units or 1), 1)
            variance = actual_paid - expected_total
            variance_pct = variance / expected_total if expected_total else 0

            if variance_pct < -min_variance_pct:
                underpaid_amount = abs(variance)
                total_underpaid += underpaid_amount
                underpayments.append({
                    "era_id": era_id,
                    "claim_id": claim_id,
                    "payer_id": p_id,
                    "cpt_code": cpt,
                    "units": units,
                    "expected_amount": round(expected_total, 2),
                    "actual_paid": round(actual_paid, 2),
                    "underpaid_amount": round(underpaid_amount, 2),
                    "variance_pct": round(variance_pct * 100, 2),
                })

        return {
            "total_checked": total_checked,
            "underpayment_count": len(underpayments),
            "total_underpaid_amount": round(total_underpaid, 2),
            "min_variance_threshold": min_variance_pct,
            "underpayments": underpayments[:100],  # Cap at 100 results
        }

    except Exception as e:
        logger.error(f"detect_silent_underpayments failed: {e}")
        return {
            "total_checked": 0,
            "underpayment_count": 0,
            "total_underpaid_amount": 0,
            "underpayments": [],
        }


async def compute_float_analysis(db: AsyncSession,
                                  payer_id: Optional[str] = None) -> dict:
    """
    Analyze payment float: days between ERA receipt and bank deposit.
    Groups by payer to identify payers holding funds longest.
    """
    try:
        q = (
            select(
                BankReconciliation.payer_id,
                BankReconciliation.payer_name,
                func.avg(BankReconciliation.float_days).label("avg_float"),
                func.max(BankReconciliation.float_days).label("max_float"),
                func.sum(BankReconciliation.float_amount).label("total_float_amount"),
                func.count().label("record_count"),
            )
            .where(BankReconciliation.float_days.isnot(None))
            .group_by(BankReconciliation.payer_id, BankReconciliation.payer_name)
            .order_by(desc("avg_float"))
        )
        if payer_id:
            q = q.where(BankReconciliation.payer_id == payer_id)

        result = await db.execute(q)
        rows = result.all()

        payers = []
        total_float_amount = 0.0
        total_records = 0

        for row in rows:
            avg_f = float(row[2] or 0)
            max_f = int(row[3] or 0)
            float_amt = float(row[4] or 0)
            count = int(row[5] or 0)

            total_float_amount += float_amt
            total_records += count

            payers.append({
                "payer_id": row[0],
                "payer_name": row[1],
                "avg_float_days": round(avg_f, 1),
                "max_float_days": max_f,
                "total_float_amount": round(float_amt, 2),
                "record_count": count,
                "risk_level": "HIGH" if avg_f > 5 else ("MEDIUM" if avg_f > 3 else "LOW"),
            })

        # Overall averages
        overall_avg = sum(p["avg_float_days"] for p in payers) / max(len(payers), 1) if payers else 0

        return {
            "overall_avg_float_days": round(overall_avg, 1),
            "total_float_amount": round(total_float_amount, 2),
            "total_records": total_records,
            "payer_count": len(payers),
            "payers": payers,
        }

    except Exception as e:
        logger.error(f"compute_float_analysis failed: {e}")
        return {
            "overall_avg_float_days": 0,
            "total_float_amount": 0,
            "total_records": 0,
            "payer_count": 0,
            "payers": [],
        }
