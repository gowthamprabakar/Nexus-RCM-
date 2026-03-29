"""
Sprint 21 — Dashboard Router
Aggregated KPI endpoint for the main dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any

from app.core.deps import get_db

router = APIRouter()


@router.get("/summary")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Aggregated KPIs: total_claims, denial_rate, net_collection_rate,
    avg_days_ar, appeals stats, and prevention alerts.
    """
    try:
        # --- Claims KPIs ---
        claims_query = text("""
            SELECT COUNT(*) as total_claims,
                   COUNT(CASE WHEN status = 'DENIED' THEN 1 END) as denied_claims,
                   COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_claims,
                   COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END) as submitted_claims,
                   COUNT(CASE WHEN status = 'APPEALED' THEN 1 END) as appealed_claims,
                   COALESCE(SUM(total_charges), 0) as total_charges,
                   COALESCE(SUM(expected_allowed), 0) as total_expected
            FROM claims
        """)
        claims_res = await db.execute(claims_query)
        cr = claims_res.fetchone()
        total_claims = cr[0] or 0
        denied_claims = cr[1] or 0
        paid_claims = cr[2] or 0
        total_charges = float(cr[5] or 0)
        total_expected = float(cr[6] or 0)

        denial_rate = round((denied_claims / total_claims) * 100, 2) if total_claims > 0 else 0.0

        # --- Net Collection Rate ---
        payments_query = text("""
            SELECT COALESCE(SUM(payment_amount), 0) as total_collected
            FROM era_payments
        """)
        pay_res = await db.execute(payments_query)
        total_collected = float(pay_res.scalar() or 0)

        net_collection_rate = round(
            (total_collected / total_expected) * 100, 2
        ) if total_expected > 0 else 0.0

        # --- Average Days in AR ---
        ar_query = text("""
            SELECT COALESCE(AVG(days_outstanding), 0) as avg_days_ar,
                   COALESCE(SUM(balance), 0) as total_ar_balance
            FROM ar_aging
            WHERE status = 'OPEN'
        """)
        ar_res = await db.execute(ar_query)
        ar_row = ar_res.fetchone()
        avg_days_ar = round(float(ar_row[0] or 0), 1)
        total_ar_balance = float(ar_row[1] or 0)

        # --- AR Aging Buckets ---
        bucket_query = text("""
            SELECT bucket, COUNT(*) as claim_count, COALESCE(SUM(balance), 0) as total_balance
            FROM ar_aging
            WHERE status = 'OPEN'
            GROUP BY bucket
            ORDER BY bucket
        """)
        bucket_res = await db.execute(bucket_query)
        ar_buckets = [
            {"bucket": r[0], "claim_count": r[1], "balance": round(float(r[2]), 2)}
            for r in bucket_res.fetchall()
        ]

        # --- Appeals Stats ---
        appeals_query = text("""
            SELECT COUNT(*) as total_appeals,
                   COUNT(CASE WHEN outcome = 'APPROVED' THEN 1 END) as approved,
                   COUNT(CASE WHEN outcome = 'DENIED' THEN 1 END) as appeal_denied,
                   COUNT(CASE WHEN outcome = 'PENDING' THEN 1 END) as pending,
                   COALESCE(SUM(recovered_amount), 0) as total_recovered
            FROM appeals
        """)
        app_res = await db.execute(appeals_query)
        app_row = app_res.fetchone()
        total_appeals = app_row[0] or 0
        appeals_approved = app_row[1] or 0
        appeal_win_rate = round(
            (appeals_approved / total_appeals) * 100, 2
        ) if total_appeals > 0 else 0.0

        appeals_stats = {
            "total_appeals": total_appeals,
            "approved": appeals_approved,
            "denied": app_row[2] or 0,
            "pending": app_row[3] or 0,
            "win_rate_pct": appeal_win_rate,
            "total_recovered": round(float(app_row[4] or 0), 2),
        }

        # --- Prevention Alerts (Collection Alerts) ---
        alerts_query = text("""
            SELECT severity, COUNT(*) as count
            FROM collection_alerts
            WHERE is_resolved = false
            GROUP BY severity
        """)
        alerts_res = await db.execute(alerts_query)
        alert_counts = {r[0]: r[1] for r in alerts_res.fetchall()}

        prevention_alerts = {
            "critical": alert_counts.get("CRITICAL", 0),
            "high": alert_counts.get("HIGH", 0),
            "medium": alert_counts.get("MEDIUM", 0),
            "low": alert_counts.get("LOW", 0),
            "total_active": sum(alert_counts.values()),
        }

        # --- CRS (Claim Readiness Score) Summary ---
        crs_query = text("""
            SELECT COUNT(CASE WHEN crs_passed = true THEN 1 END) as passed,
                   COUNT(CASE WHEN crs_passed = false THEN 1 END) as failed,
                   COALESCE(AVG(crs_score), 0) as avg_score
            FROM claims
            WHERE crs_score IS NOT NULL
        """)
        crs_res = await db.execute(crs_query)
        crs_row = crs_res.fetchone()

        crs_summary = {
            "avg_score": round(float(crs_row[2] or 0), 1),
            "passed": crs_row[0] or 0,
            "failed": crs_row[1] or 0,
            "pass_rate_pct": round(
                ((crs_row[0] or 0) / ((crs_row[0] or 0) + (crs_row[1] or 0))) * 100, 2
            ) if ((crs_row[0] or 0) + (crs_row[1] or 0)) > 0 else 0.0,
        }

        # --- Payer Mix ---
        payer_query = text("""
            SELECT pm.payer_name, pm.payer_group, COUNT(c.claim_id) as claim_count,
                   COALESCE(SUM(c.total_charges), 0) as total_charges
            FROM claims c
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            GROUP BY pm.payer_name, pm.payer_group
            ORDER BY claim_count DESC
            LIMIT 10
        """)
        payer_res = await db.execute(payer_query)
        top_payers = [
            {
                "payer_name": r[0], "payer_group": r[1],
                "claim_count": r[2], "total_charges": round(float(r[3]), 2),
            }
            for r in payer_res.fetchall()
        ]

        return {
            "claims": {
                "total": total_claims,
                "paid": paid_claims,
                "denied": denied_claims,
                "submitted": cr[3] or 0,
                "appealed": cr[4] or 0,
                "total_charges": round(total_charges, 2),
            },
            "denial_rate_pct": denial_rate,
            "net_collection_rate_pct": net_collection_rate,
            "total_collected": round(total_collected, 2),
            "avg_days_ar": avg_days_ar,
            "total_ar_balance": round(total_ar_balance, 2),
            "ar_aging_buckets": ar_buckets,
            "appeals": appeals_stats,
            "prevention_alerts": prevention_alerts,
            "crs_summary": crs_summary,
            "top_payers": top_payers,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard summary error: {str(e)}")
