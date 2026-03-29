"""
ADTP Service — Sprint 5
========================
Average Days To Pay calculation, rolling trends, and anomaly detection.

Functions:
  compute_rolling_adtp(db, payer_id, lookback_days) → dict
  refresh_all_adtp_trends(db) → int
  detect_adtp_anomalies(db, z_threshold) → list
"""

import logging
from uuid import uuid4
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rcm_extended import EraPayment
from app.models.payer import Payer
from app.models.root_cause import ADTPTrend

logger = logging.getLogger(__name__)


def _gen_trend_id() -> str:
    return f"ADT{uuid4().hex[:12].upper()}"


async def compute_rolling_adtp(db: AsyncSession, payer_id: str,
                                lookback_days: int = 90) -> dict:
    """
    Compute rolling ADTP for a payer over the lookback window.
    Measures inter-payment gaps (days between consecutive payment_date values).
    """
    try:
        today = date.today()
        start_date = today - timedelta(days=lookback_days)

        # Get payer info
        payer = await db.get(Payer, payer_id)
        if not payer:
            return {"error": f"Payer {payer_id} not found"}

        expected_adtp = payer.adtp_days or 14

        # Query payments ordered by date
        result = await db.execute(
            select(EraPayment.payment_date, EraPayment.payment_amount)
            .where(
                and_(
                    EraPayment.payer_id == payer_id,
                    EraPayment.payment_date >= start_date,
                )
            )
            .order_by(EraPayment.payment_date)
        )
        rows = result.all()

        if len(rows) < 2:
            return {
                "payer_id": payer_id,
                "payer_name": payer.payer_name,
                "actual_adtp": None,
                "expected_adtp": expected_adtp,
                "deviation": None,
                "z_score": None,
                "is_anomaly": False,
                "payment_count": len(rows),
                "total_amount": sum(float(r[1] or 0) for r in rows),
                "period_start": str(start_date),
                "period_end": str(today),
                "message": "Insufficient payment data for ADTP calculation",
            }

        # Compute inter-payment gaps
        payment_dates = [r[0] for r in rows]
        total_amount = sum(float(r[1] or 0) for r in rows)

        gaps = []
        for i in range(1, len(payment_dates)):
            gap = (payment_dates[i] - payment_dates[i - 1]).days
            if gap > 0:
                gaps.append(gap)

        if not gaps:
            return {
                "payer_id": payer_id,
                "payer_name": payer.payer_name,
                "actual_adtp": 0,
                "expected_adtp": expected_adtp,
                "deviation": -expected_adtp,
                "z_score": 0,
                "is_anomaly": False,
                "payment_count": len(rows),
                "total_amount": round(total_amount, 2),
                "period_start": str(start_date),
                "period_end": str(today),
            }

        mean_gap = sum(gaps) / len(gaps)
        std_gap = (sum((g - mean_gap) ** 2 for g in gaps) / len(gaps)) ** 0.5

        deviation = mean_gap - expected_adtp

        if std_gap > 0:
            z_score = deviation / std_gap
        else:
            z_score = 0.0

        is_anomaly = abs(z_score) > 2.0

        # Determine anomaly type
        anomaly_type = None
        if is_anomaly:
            if z_score > 0:
                anomaly_type = "PAYMENT_DELAY"
            else:
                anomaly_type = "PAYMENT_ACCELERATION"

        # Persist trend record
        trend = ADTPTrend(
            trend_id=_gen_trend_id(),
            payer_id=payer_id,
            calculation_date=today,
            period_start=start_date,
            period_end=today,
            expected_adtp_days=expected_adtp,
            actual_adtp_days=round(mean_gap, 2),
            deviation_days=round(deviation, 2),
            deviation_pct=round(deviation / max(expected_adtp, 1) * 100, 2),
            z_score=round(z_score, 3),
            is_anomaly=is_anomaly,
            anomaly_type=anomaly_type,
            payment_count=len(rows),
            total_amount=round(total_amount, 2),
            avg_payment_amount=round(total_amount / len(rows), 2),
        )
        db.add(trend)
        await db.commit()

        return {
            "payer_id": payer_id,
            "payer_name": payer.payer_name,
            "actual_adtp": round(mean_gap, 2),
            "expected_adtp": expected_adtp,
            "deviation": round(deviation, 2),
            "deviation_pct": round(deviation / max(expected_adtp, 1) * 100, 2),
            "z_score": round(z_score, 3),
            "is_anomaly": is_anomaly,
            "anomaly_type": anomaly_type,
            "payment_count": len(rows),
            "total_amount": round(total_amount, 2),
            "avg_payment_amount": round(total_amount / len(rows), 2),
            "std_gap_days": round(std_gap, 2),
            "period_start": str(start_date),
            "period_end": str(today),
            "trend_id": trend.trend_id,
        }

    except Exception as e:
        logger.error(f"compute_rolling_adtp failed for payer {payer_id}: {e}")
        await db.rollback()
        return {"error": str(e), "payer_id": payer_id}


async def refresh_all_adtp_trends(db: AsyncSession) -> int:
    """Refresh ADTP trends for all payers."""
    try:
        result = await db.execute(select(Payer.payer_id))
        payer_ids = [row[0] for row in result.all()]

        refreshed = 0
        for pid in payer_ids:
            outcome = await compute_rolling_adtp(db, pid)
            if "error" not in outcome:
                refreshed += 1

        return refreshed

    except Exception as e:
        logger.error(f"refresh_all_adtp_trends failed: {e}")
        return 0


async def detect_adtp_anomalies(db: AsyncSession, z_threshold: float = 2.0) -> list:
    """Detect ADTP anomalies across all payers using latest trend data."""
    try:
        # Get most recent trend per payer
        subq = (
            select(
                ADTPTrend.payer_id,
                func.max(ADTPTrend.calculation_date).label("max_date"),
            )
            .group_by(ADTPTrend.payer_id)
            .subquery()
        )

        result = await db.execute(
            select(ADTPTrend, Payer.payer_name)
            .join(
                subq,
                and_(
                    ADTPTrend.payer_id == subq.c.payer_id,
                    ADTPTrend.calculation_date == subq.c.max_date,
                ),
            )
            .join(Payer, Payer.payer_id == ADTPTrend.payer_id, isouter=True)
            .where(ADTPTrend.is_anomaly == True)
        )
        rows = result.all()

        anomalies = []
        for row in rows:
            trend = row.ADTPTrend
            anomalies.append({
                "payer_id": trend.payer_id,
                "payer_name": row.payer_name,
                "actual_adtp": trend.actual_adtp_days,
                "expected_adtp": trend.expected_adtp_days,
                "deviation_days": trend.deviation_days,
                "deviation_pct": trend.deviation_pct,
                "z_score": trend.z_score,
                "anomaly_type": trend.anomaly_type,
                "payment_count": trend.payment_count,
                "total_amount": trend.total_amount,
                "calculation_date": str(trend.calculation_date),
            })

        return anomalies

    except Exception as e:
        logger.error(f"detect_adtp_anomalies failed: {e}")
        return []
