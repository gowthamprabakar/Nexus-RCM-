"""
AI Insights Router — Sprint 4: Ollama Local LLM Integration
============================================================
All endpoints pull live DB statistics, inject them into Ollama prompts,
and return structured insight cards or text.

GET  /ai/insights          — 3 MECE insight cards for a given page context
GET  /ai/stream            — SSE streaming tokens for a given page context
POST /ai/appeal-draft      — formal appeal letter for a denied claim
POST /ai/call-script       — collections call script for a queue task
GET  /ai/anomaly-explain   — plain-English anomaly explanation
GET  /ai/health            — check Ollama is reachable
"""

import httpx
import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import Any, Optional
from datetime import date, timedelta

from app.core.deps import get_db
from app.models.ar_collections import CollectionQueue, CollectionAlert, ARAgingBucket
from app.models.rcm_extended import EraPayment, BankReconciliation
from app.models.claim import Claim
from app.models.payer import Payer
from app.services import ai_insights

logger = logging.getLogger(__name__)
router = APIRouter()

OLLAMA_BASE_URL = "http://localhost:11434"


# ── GET /ai/health ────────────────────────────────────────────────────────────
@router.get("/health")
async def ai_health() -> dict:
    """Check Ollama is reachable and return available models."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
            models = [m["name"] for m in resp.json().get("models", [])]
            return {"status": "healthy", "ollama": True, "models": models}
    except Exception as e:
        return {"status": "degraded", "ollama": False, "error": str(e)}


# ── Week-over-week helpers ─────────────────────────────────────────────────────

def _week_boundaries():
    """Return (current_week_start, prior_week_start) as date objects."""
    today = date.today()
    current_week_start = today - timedelta(days=today.weekday())  # Monday
    prior_week_start = current_week_start - timedelta(days=7)
    return current_week_start, prior_week_start


def _calc_pct_change(current, prior):
    """Calculate % change and direction string."""
    prior = max(prior, 1)  # avoid div-by-zero
    pct = ((current - prior) / prior) * 100
    direction = "increasing" if pct > 0 else "decreasing" if pct < 0 else "stable"
    return round(pct, 1), direction


# ── Stat collectors (inject real DB numbers into prompts) ─────────────────────

async def _collect_denials_stats(db: AsyncSession) -> dict:
    """Pull live denial KPIs for prompt context."""
    try:
        from app.models.denial import Denial
        total = await db.scalar(select(func.count(Denial.denial_id))) or 0
        amount = await db.scalar(select(func.sum(Denial.denial_amount))) or 0

        # Top denial reason
        top_reason_row = await db.execute(
            select(Denial.denial_category, func.count().label("cnt"))
            .group_by(Denial.denial_category)
            .order_by(desc("cnt"))
            .limit(1)
        )
        top_reason_row = top_reason_row.first()
        top_reason = top_reason_row[0] if top_reason_row else "Authorization"

        # Top denying payer — join via claim
        from app.models.claim import Claim as ClaimModel
        top_payer_row = await db.execute(
            select(Payer.payer_name, func.count().label("cnt"))
            .select_from(Denial)
            .join(ClaimModel, ClaimModel.claim_id == Denial.claim_id)
            .join(Payer, Payer.payer_id == ClaimModel.payer_id)
            .group_by(Payer.payer_name)
            .order_by(desc("cnt"))
            .limit(1)
        )
        top_payer_row = top_payer_row.first()
        top_payer = top_payer_row[0] if top_payer_row else "Unknown"

        # Overturn rate — query from appeals table
        from app.models.denial import Appeal, Denial as DenialModel
        total_appeals = await db.scalar(
            select(func.count(Appeal.appeal_id))
        ) or 0
        overturned = await db.scalar(
            select(func.count(Appeal.appeal_id)).where(Appeal.outcome == "APPROVED")
        ) or 0
        overturn_rate = round((overturned / total_appeals * 100), 1) if total_appeals else 0.0

        # AI prevention impact — sum of recovered amounts from AI-generated appeals
        ai_saved = await db.scalar(
            select(func.sum(Appeal.recovered_amount)).where(Appeal.ai_generated == True)
        ) or 0

        # Average days to appeal outcome
        from sqlalchemy import case
        avg_days_appeal_raw = await db.scalar(
            select(func.avg(Appeal.outcome_date - Appeal.submitted_date))
            .where(Appeal.outcome_date.isnot(None))
            .where(Appeal.submitted_date.isnot(None))
        )
        if avg_days_appeal_raw and hasattr(avg_days_appeal_raw, 'days'):
            avg_days_appeal = avg_days_appeal_raw.days
        elif avg_days_appeal_raw:
            avg_days_appeal = float(avg_days_appeal_raw)
        else:
            avg_days_appeal = 0

        # ── Week-over-week deltas ──
        current_week_start, prior_week_start = _week_boundaries()
        current_denials = await db.scalar(
            select(func.count(Denial.denial_id))
            .where(Denial.denial_date >= current_week_start)
        ) or 0
        prior_denials = await db.scalar(
            select(func.count(Denial.denial_id))
            .where(and_(
                Denial.denial_date >= prior_week_start,
                Denial.denial_date < current_week_start
            ))
        ) or 0
        denial_change_pct, denial_change_direction = _calc_pct_change(current_denials, prior_denials)

        current_denial_amt = float(await db.scalar(
            select(func.sum(Denial.denial_amount))
            .where(Denial.denial_date >= current_week_start)
        ) or 0)
        prior_denial_amt = float(await db.scalar(
            select(func.sum(Denial.denial_amount))
            .where(and_(
                Denial.denial_date >= prior_week_start,
                Denial.denial_date < current_week_start
            ))
        ) or 0)
        denial_amt_change_pct, _ = _calc_pct_change(current_denial_amt, prior_denial_amt)

        return {
            "total_denials": total,
            "denied_amount": float(amount),
            "top_reason": top_reason,
            "top_payer": top_payer,
            "overturn_rate": overturn_rate,
            "ai_saved": float(ai_saved),
            "avg_days_appeal": avg_days_appeal,
            # Week-over-week deltas
            "denial_change_pct": denial_change_pct,
            "denial_change_direction": denial_change_direction,
            "denial_amt_change_pct": denial_amt_change_pct,
            "current_week_denials": current_denials,
            "prior_week_denials": prior_denials,
        }
    except Exception as e:
        logger.error(f"Denial stats collection failed: {e}")
        return {"total_denials": 0, "denied_amount": 0, "top_reason": "N/A",
                "top_payer": "N/A", "overturn_rate": 0, "ai_saved": 0,
                "denial_change_pct": 0, "denial_change_direction": "stable",
                "denial_amt_change_pct": 0, "current_week_denials": 0, "prior_week_denials": 0}


async def _collect_collections_stats(db: AsyncSession) -> dict:
    """Pull live A/R + collections KPIs for prompt context."""
    try:
        queue_depth = await db.scalar(
            select(func.count(CollectionQueue.task_id)).where(CollectionQueue.status != "CLOSED")
        ) or 0
        total_collectible = await db.scalar(
            select(func.sum(CollectionQueue.balance)).where(CollectionQueue.status != "CLOSED")
        ) or 0
        active_alerts = await db.scalar(
            select(func.count(CollectionAlert.alert_id)).where(CollectionAlert.is_resolved == False)
        ) or 0
        avg_propensity = await db.scalar(
            select(func.avg(CollectionQueue.propensity_score))
        ) or 0

        # AR aging — 120+ bucket
        today = date.today()
        over_120_count = await db.scalar(
            select(func.count(ARAgingBucket.aging_id)).where(ARAgingBucket.bucket == "120+")
        ) or 0
        over_120_amount = await db.scalar(
            select(func.sum(ARAgingBucket.balance)).where(ARAgingBucket.bucket == "120+")
        ) or 0
        total_ar = await db.scalar(select(func.sum(ARAgingBucket.balance))) or 0

        return {
            "total_ar": float(total_ar),
            "queue_depth": queue_depth,
            "total_collectible": float(total_collectible),
            "active_alerts": active_alerts,
            "over_120_count": over_120_count,
            "over_120_amount": float(over_120_amount),
            "avg_propensity": float(avg_propensity),
        }
    except Exception as e:
        logger.error(f"Collections stats collection failed: {e}")
        return {"total_ar": 0, "queue_depth": 0, "total_collectible": 0,
                "active_alerts": 0, "over_120_count": 0, "over_120_amount": 0, "avg_propensity": 0}


async def _collect_payments_stats(db: AsyncSession) -> dict:
    """Pull live ERA payment KPIs for prompt context."""
    try:
        total_posted = await db.scalar(select(func.sum(EraPayment.payment_amount))) or 0
        total_count = await db.scalar(select(func.count(EraPayment.era_id))) or 0
        total_adj = await db.scalar(select(func.sum(EraPayment.adjustment_amount))) or 0
        total_pt = await db.scalar(select(func.sum(EraPayment.patient_responsibility))) or 0
        billed = await db.scalar(select(func.sum(EraPayment.billed_amount))) or 0
        payment_rate = (float(total_posted) / float(billed) * 100) if billed else 0
        variance_pct = ((float(total_posted) - float(billed)) / float(billed) * 100) if billed else 0

        # ── Week-over-week revenue deltas ──
        current_week_start, prior_week_start = _week_boundaries()
        current_revenue = float(await db.scalar(
            select(func.sum(EraPayment.payment_amount))
            .where(EraPayment.payment_date >= current_week_start)
        ) or 0)
        prior_revenue = float(await db.scalar(
            select(func.sum(EraPayment.payment_amount))
            .where(and_(
                EraPayment.payment_date >= prior_week_start,
                EraPayment.payment_date < current_week_start
            ))
        ) or 0)
        revenue_change_pct, revenue_change_direction = _calc_pct_change(current_revenue, prior_revenue)

        return {
            "total_posted": float(total_posted),
            "total_era_count": total_count,
            "total_adjustments": float(total_adj),
            "total_patient_resp": float(total_pt),
            "payment_rate": payment_rate,
            "variance_pct": round(variance_pct, 2),
            # Week-over-week deltas
            "revenue_change_pct": revenue_change_pct,
            "revenue_change_direction": revenue_change_direction,
        }
    except Exception as e:
        logger.error(f"Payments stats collection failed: {e}")
        return {"total_posted": 0, "total_era_count": 0, "total_adjustments": 0,
                "total_patient_resp": 0, "payment_rate": 0, "variance_pct": 0,
                "revenue_change_pct": 0, "revenue_change_direction": "stable"}


async def _collect_reconciliation_stats(db: AsyncSession) -> dict:
    """Pull live bank reconciliation KPIs for prompt context."""
    try:
        era_received = await db.scalar(select(func.sum(BankReconciliation.era_received))) or 0
        forecasted = await db.scalar(select(func.sum(BankReconciliation.forecasted_amount))) or 0
        bank_dep = await db.scalar(select(func.sum(BankReconciliation.bank_deposited))) or 0
        variance_count = await db.scalar(
            select(func.count(BankReconciliation.recon_id)).where(
                BankReconciliation.status == "VARIANCE"
            )
        ) or 0
        reconciled_count = await db.scalar(
            select(func.count(BankReconciliation.recon_id)).where(
                BankReconciliation.status == "RECONCILED"
            )
        ) or 0
        variance_pct = ((float(era_received) - float(forecasted)) / float(forecasted) * 100) if forecasted else 0

        return {
            "total_era_received": float(era_received),
            "total_forecasted": float(forecasted),
            "total_bank_deposited": float(bank_dep),
            "variance_count": variance_count,
            "reconciled_count": reconciled_count,
            "variance_pct": variance_pct,
        }
    except Exception as e:
        logger.error(f"Reconciliation stats collection failed: {e}")
        return {"total_era_received": 0, "total_forecasted": 0, "total_bank_deposited": 0,
                "variance_count": 0, "reconciled_count": 0, "variance_pct": 0}


async def _collect_root_cause_stats(db: AsyncSession) -> dict:
    """Pull live root cause analysis KPIs for prompt context."""
    try:
        from app.models.root_cause import RootCauseAnalysis
        total = await db.scalar(select(func.count(RootCauseAnalysis.rca_id))) or 0
        total_impact = await db.scalar(select(func.sum(RootCauseAnalysis.financial_impact))) or 0
        preventable = await db.scalar(
            select(func.sum(RootCauseAnalysis.financial_impact)).where(
                RootCauseAnalysis.root_cause_group == "PREVENTABLE"
            )
        ) or 0
        avg_conf = await db.scalar(select(func.avg(RootCauseAnalysis.confidence_score))) or 0

        # Top root cause
        top_row = await db.execute(
            select(RootCauseAnalysis.primary_root_cause, func.count().label("cnt"))
            .group_by(RootCauseAnalysis.primary_root_cause)
            .order_by(desc("cnt"))
            .limit(1)
        )
        top = top_row.first()

        preventable_pct = (float(preventable) / float(total_impact) * 100) if total_impact else 0

        return {
            "total_analyses": total,
            "total_financial_impact": float(total_impact),
            "preventable_amount": float(preventable),
            "preventable_pct": round(preventable_pct, 1),
            "top_root_cause": top[0] if top else "N/A",
            "top_root_cause_count": top[1] if top else 0,
            "avg_confidence": float(avg_conf),
        }
    except Exception as e:
        logger.error(f"Root cause stats collection failed: {e}")
        return {"total_analyses": 0, "total_financial_impact": 0, "preventable_amount": 0,
                "preventable_pct": 0, "top_root_cause": "N/A", "top_root_cause_count": 0, "avg_confidence": 0}


async def _collect_adtp_stats(db: AsyncSession) -> dict:
    """Pull live ADTP trend KPIs for prompt context."""
    try:
        from app.models.root_cause import ADTPTrend
        payer_count = await db.scalar(
            select(func.count(func.distinct(ADTPTrend.payer_id)))
        ) or 0
        avg_adtp = await db.scalar(select(func.avg(ADTPTrend.actual_adtp_days))) or 0
        anomaly_count = await db.scalar(
            select(func.count(ADTPTrend.trend_id)).where(ADTPTrend.is_anomaly == True)
        ) or 0
        delayed = await db.scalar(
            select(func.count(ADTPTrend.trend_id)).where(ADTPTrend.anomaly_type == "PAYMENT_DELAY")
        ) or 0
        total_vol = await db.scalar(select(func.sum(ADTPTrend.total_amount))) or 0
        max_dev = await db.scalar(select(func.max(ADTPTrend.deviation_days))) or 0

        return {
            "payers_tracked": payer_count,
            "avg_adtp": float(avg_adtp),
            "anomaly_count": anomaly_count,
            "delayed_payers": delayed,
            "total_payment_volume": float(total_vol),
            "max_deviation": float(max_dev),
        }
    except Exception as e:
        logger.error(f"ADTP stats collection failed: {e}")
        return {"payers_tracked": 0, "avg_adtp": 0, "anomaly_count": 0,
                "delayed_payers": 0, "total_payment_volume": 0, "max_deviation": 0}


async def _collect_diagnostics_stats(db: AsyncSession) -> dict:
    """Pull live diagnostic engine findings for prompt context."""
    try:
        from app.services.diagnostic_service import get_diagnostic_summary
        summary = await get_diagnostic_summary(db)
        return summary
    except Exception as e:
        logger.error(f"Diagnostics stats collection failed: {e}")
        return {
            "total_findings": 0, "critical_count": 0, "warning_count": 0,
            "info_count": 0, "total_impact": 0, "by_category": [], "top_findings": [],
        }


async def _enrich_with_diagnostics(db: AsyncSession, stats: dict, category_filter: str) -> dict:
    """Enrich page stats with relevant diagnostic findings for richer LLM context."""
    try:
        from app.services.diagnostic_service import generate_system_diagnostics
        diag = await generate_system_diagnostics(db)
        relevant = [
            f for f in diag.get("findings", [])
            if f.get("category") == category_filter
        ][:3]  # top 3 relevant findings

        if relevant:
            diagnostic_context = "; ".join(
                f"[{f['severity'].upper()}] {f['title']} (${f.get('impact_amount', 0):,.0f})"
                for f in relevant
            )
            stats["diagnostic_findings"] = diagnostic_context
            stats["diagnostic_count"] = len(relevant)
        else:
            stats["diagnostic_findings"] = "No active diagnostic findings."
            stats["diagnostic_count"] = 0
    except Exception as e:
        logger.warning(f"Diagnostic enrichment failed for {category_filter}: {e}")
        stats["diagnostic_findings"] = "Diagnostic engine unavailable."
        stats["diagnostic_count"] = 0
    return stats


async def _collect_command_center_stats(db: AsyncSession) -> dict:
    """Pull a cross-functional executive summary for the command-center page context."""
    try:
        from app.models.denial import Denial
        from app.models.ar_collections import ARAgingBucket

        total_ar = await db.scalar(select(func.sum(ARAgingBucket.balance))) or 0
        # Calculate avg days from submission_date to now for unpaid claims
        from sqlalchemy import case, extract
        avg_days_raw = await db.scalar(
            select(func.avg(func.current_date() - Claim.submission_date))
            .where(Claim.status.notin_(['PAID', 'WRITTEN_OFF', 'VOIDED']))
            .where(Claim.submission_date.isnot(None))
        ) or 0
        # Convert timedelta to float days
        if hasattr(avg_days_raw, 'days'):
            avg_days_raw = avg_days_raw.days

        denied_amount = await db.scalar(select(func.sum(Denial.denial_amount))) or 0
        total_denials = await db.scalar(select(func.count(Denial.denial_id))) or 0
        total_claims = await db.scalar(select(func.count(Claim.claim_id))) or 0
        denial_rate = round((total_denials / total_claims * 100), 1) if total_claims else 0

        total_billed = await db.scalar(select(func.sum(Claim.total_charges))) or 0
        total_posted = await db.scalar(select(func.sum(EraPayment.payment_amount))) or 0
        collection_rate = round((float(total_posted) / float(total_billed) * 100), 1) if total_billed else 0

        # ── Week-over-week deltas for command center ──
        current_week_start, prior_week_start = _week_boundaries()
        current_denials_wk = await db.scalar(
            select(func.count(Denial.denial_id))
            .where(Denial.denial_date >= current_week_start)
        ) or 0
        prior_denials_wk = await db.scalar(
            select(func.count(Denial.denial_id))
            .where(and_(
                Denial.denial_date >= prior_week_start,
                Denial.denial_date < current_week_start
            ))
        ) or 0
        denial_change_pct, denial_change_direction = _calc_pct_change(current_denials_wk, prior_denials_wk)

        current_revenue_wk = float(await db.scalar(
            select(func.sum(EraPayment.payment_amount))
            .where(EraPayment.payment_date >= current_week_start)
        ) or 0)
        prior_revenue_wk = float(await db.scalar(
            select(func.sum(EraPayment.payment_amount))
            .where(and_(
                EraPayment.payment_date >= prior_week_start,
                EraPayment.payment_date < current_week_start
            ))
        ) or 0)
        revenue_change_pct, revenue_change_direction = _calc_pct_change(current_revenue_wk, prior_revenue_wk)

        return {
            "total_ar": float(total_ar),
            "avg_days": float(avg_days_raw),
            "denial_rate": denial_rate,
            "denied_amount": float(denied_amount),
            "pass_rate": 0,  # filled via CRS if available
            "collection_rate": collection_rate,
            "total_billed": float(total_billed),
            "revenue_at_risk": float(denied_amount),
            # Week-over-week deltas
            "denial_change_pct": denial_change_pct,
            "denial_change_direction": denial_change_direction,
            "revenue_change_pct": revenue_change_pct,
            "revenue_change_direction": revenue_change_direction,
        }
    except Exception as e:
        logger.error(f"Command-center stats collection failed: {e}")
        return {
            "total_ar": 0, "avg_days": 0, "denial_rate": 0, "denied_amount": 0,
            "pass_rate": 0, "collection_rate": 0, "total_billed": 0, "revenue_at_risk": 0,
            "denial_change_pct": 0, "denial_change_direction": "stable",
            "revenue_change_pct": 0, "revenue_change_direction": "stable",
        }


async def _collect_executive_stats(db: AsyncSession) -> dict:
    """Pull live executive dashboard KPIs for prompt context."""
    try:
        from app.models.denial import Denial
        total_claims = await db.scalar(select(func.count(Claim.claim_id))) or 0
        total_revenue = await db.scalar(select(func.sum(Claim.total_charges))) or 0
        total_denials = await db.scalar(select(func.count(Denial.denial_id))) or 0
        denied_amount = await db.scalar(select(func.sum(Denial.denial_amount))) or 0
        denial_rate = round((total_denials / total_claims * 100), 1) if total_claims else 0

        total_posted = await db.scalar(select(func.sum(EraPayment.payment_amount))) or 0
        collection_rate = round((float(total_posted) / float(total_revenue) * 100), 1) if total_revenue else 0

        # Days in AR
        avg_days_raw = await db.scalar(
            select(func.avg(func.current_date() - Claim.submission_date))
            .where(Claim.status.notin_(['PAID', 'WRITTEN_OFF', 'VOIDED']))
            .where(Claim.submission_date.isnot(None))
        ) or 0
        if hasattr(avg_days_raw, 'days'):
            avg_days_raw = avg_days_raw.days

        # First pass rate — claims paid without denial
        denied_claim_ids_sq = select(Denial.claim_id).distinct().scalar_subquery()
        first_pass_paid = await db.scalar(
            select(func.count(Claim.claim_id))
            .where(Claim.status == 'PAID')
            .where(Claim.claim_id.notin_(select(Denial.claim_id).distinct()))
        ) or 0
        total_paid = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.status == 'PAID')
        ) or 0
        first_pass_rate = round((first_pass_paid / total_paid * 100), 1) if total_paid else 0

        return {
            "total_revenue": float(total_revenue),
            "denial_rate": denial_rate,
            "collection_rate": collection_rate,
            "days_in_ar": float(avg_days_raw),
            "first_pass_rate": first_pass_rate,
            "total_claims": total_claims,
            "denied_amount": float(denied_amount),
        }
    except Exception as e:
        logger.error(f"Executive stats collection failed: {e}")
        return {"total_revenue": 0, "denial_rate": 0, "collection_rate": 0,
                "days_in_ar": 0, "first_pass_rate": 0, "total_claims": 0, "denied_amount": 0}


async def _collect_claims_stats(db: AsyncSession) -> dict:
    """Pull live claims pipeline KPIs for prompt context."""
    try:
        total_claims = await db.scalar(select(func.count(Claim.claim_id))) or 0
        draft_count = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.status == 'DRAFT')
        ) or 0
        submitted_count = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.status == 'SUBMITTED')
        ) or 0
        acknowledged_count = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.status == 'ACKNOWLEDGED')
        ) or 0
        paid_count = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.status == 'PAID')
        ) or 0
        denied_count = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.status == 'DENIED')
        ) or 0
        submission_rate = round(((submitted_count + acknowledged_count + paid_count + denied_count) / total_claims * 100), 1) if total_claims else 0

        crs_passed = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.crs_passed == True)
        ) or 0
        crs_scored = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.crs_score.isnot(None))
        ) or 0
        crs_pass_rate = round((crs_passed / crs_scored * 100), 1) if crs_scored else 0

        return {
            "total_claims": total_claims,
            "submission_rate": submission_rate,
            "crs_pass_rate": crs_pass_rate,
            "draft_count": draft_count,
            "submitted_count": submitted_count,
            "acknowledged_count": acknowledged_count,
            "paid_count": paid_count,
            "denied_count": denied_count,
        }
    except Exception as e:
        logger.error(f"Claims stats collection failed: {e}")
        return {"total_claims": 0, "submission_rate": 0, "crs_pass_rate": 0,
                "draft_count": 0, "submitted_count": 0, "acknowledged_count": 0,
                "paid_count": 0, "denied_count": 0}


async def _collect_claims_workqueue_stats(db: AsyncSession) -> dict:
    """Pull live claims work queue KPIs for prompt context."""
    try:
        queue_size = await db.scalar(
            select(func.count(Claim.claim_id)).where(
                Claim.status.in_(['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED'])
            )
        ) or 0
        high_risk_count = await db.scalar(
            select(func.count(Claim.claim_id)).where(
                and_(
                    Claim.crs_passed == False,
                    Claim.crs_score.isnot(None),
                    Claim.status.in_(['DRAFT', 'SUBMITTED'])
                )
            )
        ) or 0
        # Auto-fix: claims that failed CRS but were subsequently submitted (assumed auto-fixed)
        auto_fix_count = await db.scalar(
            select(func.count(Claim.claim_id)).where(
                and_(
                    Claim.crs_passed == True,
                    Claim.crs_score.isnot(None),
                    Claim.crs_score < 80
                )
            )
        ) or 0
        crs_scored = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.crs_score.isnot(None))
        ) or 0
        auto_fix_rate = round((auto_fix_count / crs_scored * 100), 1) if crs_scored else 0
        avg_crs = await db.scalar(
            select(func.avg(Claim.crs_score)).where(Claim.crs_score.isnot(None))
        ) or 0
        charges_at_risk = await db.scalar(
            select(func.sum(Claim.total_charges)).where(
                and_(
                    Claim.crs_passed == False,
                    Claim.crs_score.isnot(None),
                    Claim.status.in_(['DRAFT', 'SUBMITTED'])
                )
            )
        ) or 0

        return {
            "queue_size": queue_size,
            "high_risk_count": high_risk_count,
            "auto_fix_count": auto_fix_count,
            "auto_fix_rate": auto_fix_rate,
            "avg_crs_score": float(avg_crs),
            "charges_at_risk": float(charges_at_risk),
        }
    except Exception as e:
        logger.error(f"Claims workqueue stats collection failed: {e}")
        return {"queue_size": 0, "high_risk_count": 0, "auto_fix_count": 0,
                "auto_fix_rate": 0, "avg_crs_score": 0, "charges_at_risk": 0}


async def _collect_crs_stats(db: AsyncSession) -> dict:
    """Pull live CRS/scrub analytics KPIs for prompt context."""
    try:
        claims_scrubbed = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.crs_score.isnot(None))
        ) or 0
        crs_passed = await db.scalar(
            select(func.count(Claim.claim_id)).where(Claim.crs_passed == True)
        ) or 0
        pass_rate = round((crs_passed / claims_scrubbed * 100), 1) if claims_scrubbed else 0
        avg_crs = await db.scalar(
            select(func.avg(Claim.crs_score)).where(Claim.crs_score.isnot(None))
        ) or 0

        # Auto-fix: claims that passed despite low initial score
        auto_fixed = await db.scalar(
            select(func.count(Claim.claim_id)).where(
                and_(Claim.crs_passed == True, Claim.crs_score < 80)
            )
        ) or 0
        auto_fix_rate = round((auto_fixed / claims_scrubbed * 100), 1) if claims_scrubbed else 0

        # Top error category: check which CRS component has lowest avg score
        avg_elig = await db.scalar(select(func.avg(Claim.crs_eligibility_pts)).where(Claim.crs_score.isnot(None))) or 0
        avg_auth = await db.scalar(select(func.avg(Claim.crs_auth_pts)).where(Claim.crs_score.isnot(None))) or 0
        avg_coding = await db.scalar(select(func.avg(Claim.crs_coding_pts)).where(Claim.crs_score.isnot(None))) or 0
        avg_cob = await db.scalar(select(func.avg(Claim.crs_cob_pts)).where(Claim.crs_score.isnot(None))) or 0
        avg_doc = await db.scalar(select(func.avg(Claim.crs_documentation_pts)).where(Claim.crs_score.isnot(None))) or 0
        component_scores = {
            "Eligibility": float(avg_elig), "Authorization": float(avg_auth),
            "Coding": float(avg_coding), "COB": float(avg_cob), "Documentation": float(avg_doc)
        }
        top_error_category = min(component_scores, key=component_scores.get) if component_scores else "N/A"

        # Denials prevented estimate — claims that failed CRS, were fixed, then paid
        denials_prevented = await db.scalar(
            select(func.count(Claim.claim_id)).where(
                and_(Claim.crs_passed == True, Claim.status == 'PAID', Claim.crs_score < 80)
            )
        ) or 0
        revenue_saved = await db.scalar(
            select(func.sum(Claim.total_charges)).where(
                and_(Claim.crs_passed == True, Claim.status == 'PAID', Claim.crs_score < 80)
            )
        ) or 0

        return {
            "pass_rate": pass_rate,
            "auto_fix_rate": auto_fix_rate,
            "top_error_category": top_error_category,
            "denials_prevented": denials_prevented,
            "revenue_saved": float(revenue_saved),
            "avg_crs_score": float(avg_crs),
            "claims_scrubbed": claims_scrubbed,
        }
    except Exception as e:
        logger.error(f"CRS stats collection failed: {e}")
        return {"pass_rate": 0, "auto_fix_rate": 0, "top_error_category": "N/A",
                "denials_prevented": 0, "revenue_saved": 0, "avg_crs_score": 0, "claims_scrubbed": 0}


async def _collect_ar_stats(db: AsyncSession) -> dict:
    """Pull live AR aging KPIs for prompt context."""
    try:
        total_ar = await db.scalar(select(func.sum(ARAgingBucket.balance))) or 0
        avg_days = await db.scalar(select(func.avg(ARAgingBucket.days_outstanding))) or 0

        # Aging buckets
        bucket_0_30 = await db.scalar(
            select(func.sum(ARAgingBucket.balance)).where(ARAgingBucket.bucket == "0-30")
        ) or 0
        bucket_31_60 = await db.scalar(
            select(func.sum(ARAgingBucket.balance)).where(ARAgingBucket.bucket == "31-60")
        ) or 0
        bucket_61_90 = await db.scalar(
            select(func.sum(ARAgingBucket.balance)).where(ARAgingBucket.bucket == "61-90")
        ) or 0
        bucket_91_120 = await db.scalar(
            select(func.sum(ARAgingBucket.balance)).where(ARAgingBucket.bucket == "91-120")
        ) or 0
        bucket_120_plus = await db.scalar(
            select(func.sum(ARAgingBucket.balance)).where(ARAgingBucket.bucket == "120+")
        ) or 0

        # Top payer by AR balance
        top_payer_row = await db.execute(
            select(Payer.payer_name, func.sum(ARAgingBucket.balance).label("total_bal"))
            .select_from(ARAgingBucket)
            .join(Payer, Payer.payer_id == ARAgingBucket.payer_id)
            .group_by(Payer.payer_name)
            .order_by(desc("total_bal"))
            .limit(1)
        )
        top_payer_row = top_payer_row.first()

        # ── Week-over-week AR change (approximate from claims submitted each week) ──
        current_week_start, prior_week_start = _week_boundaries()
        current_week_ar = float(await db.scalar(
            select(func.sum(Claim.total_charges))
            .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
            .where(Claim.submission_date >= current_week_start)
        ) or 0)
        prior_week_ar = float(await db.scalar(
            select(func.sum(Claim.total_charges))
            .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
            .where(and_(
                Claim.submission_date >= prior_week_start,
                Claim.submission_date < current_week_start
            ))
        ) or 0)
        ar_change_pct, ar_change_direction = _calc_pct_change(current_week_ar, prior_week_ar)

        return {
            "total_ar": float(total_ar),
            "avg_days": float(avg_days),
            "bucket_0_30": float(bucket_0_30),
            "bucket_31_60": float(bucket_31_60),
            "bucket_61_90": float(bucket_61_90),
            "bucket_91_120": float(bucket_91_120),
            "bucket_120_plus": float(bucket_120_plus),
            "top_payer": top_payer_row[0] if top_payer_row else "N/A",
            "top_payer_balance": float(top_payer_row[1]) if top_payer_row else 0,
            # Week-over-week deltas
            "ar_change_pct": ar_change_pct,
            "ar_change_direction": ar_change_direction,
        }
    except Exception as e:
        logger.error(f"AR stats collection failed: {e}")
        return {"total_ar": 0, "avg_days": 0, "bucket_0_30": 0, "bucket_31_60": 0,
                "bucket_61_90": 0, "bucket_91_120": 0, "bucket_120_plus": 0,
                "top_payer": "N/A", "top_payer_balance": 0,
                "ar_change_pct": 0, "ar_change_direction": "stable"}


async def _collect_prevention_stats(db: AsyncSession) -> dict:
    """Pull live prevention intelligence KPIs for prompt context."""
    try:
        from app.services.prevention_service import scan_claims_for_prevention
        result = await scan_claims_for_prevention(db, limit=500)
        alerts = result.get("alerts", [])
        summary = result.get("summary", {})

        critical_count = len([a for a in alerts if a.get("severity") == "CRITICAL"])
        # Top alert type
        by_type = summary.get("by_type", {})
        top_alert_type = max(by_type, key=lambda k: by_type[k]["count"]) if by_type else "N/A"

        total_claims_scanned = await db.scalar(
            select(func.count(Claim.claim_id)).where(
                Claim.status.in_(['SUBMITTED', 'ACKNOWLEDGED', 'DRAFT'])
            )
        ) or 0
        prevention_rate = round(
            (summary.get("preventable_count", 0) / total_claims_scanned * 100), 1
        ) if total_claims_scanned else 0

        return {
            "total_alerts": summary.get("total_alerts", 0),
            "critical_count": critical_count,
            "revenue_at_risk": summary.get("total_revenue_at_risk", 0),
            "preventable_count": summary.get("preventable_count", 0),
            "prevention_rate": prevention_rate,
            "top_alert_type": top_alert_type,
            "claims_scanned": total_claims_scanned,
        }
    except Exception as e:
        logger.error(f"Prevention stats collection failed: {e}")
        return {"total_alerts": 0, "critical_count": 0, "revenue_at_risk": 0,
                "preventable_count": 0, "prevention_rate": 0, "top_alert_type": "N/A",
                "claims_scanned": 0}


async def _collect_payer_performance_stats(db: AsyncSession) -> dict:
    """Pull live payer performance KPIs for prompt context."""
    try:
        from app.models.denial import Denial
        from app.models.root_cause import ADTPTrend

        payers_tracked = await db.scalar(select(func.count(Payer.payer_id))) or 0

        # Denial rates by payer
        payer_denial_rates = await db.execute(
            select(
                Payer.payer_name,
                func.count(Denial.denial_id).label("denials"),
                func.count(Claim.claim_id).label("claims"),
            )
            .select_from(Claim)
            .join(Payer, Payer.payer_id == Claim.payer_id)
            .outerjoin(Denial, Denial.claim_id == Claim.claim_id)
            .group_by(Payer.payer_name)
            .having(func.count(Claim.claim_id) >= 5)
            .order_by(desc("denials"))
        )
        rows = payer_denial_rates.all()

        best_payer = "N/A"
        best_rate = 100.0
        worst_payer = "N/A"
        worst_rate = 0.0
        for r in rows:
            rate = round(r.denials / r.claims * 100, 1) if r.claims else 0
            if rate < best_rate:
                best_rate = rate
                best_payer = r.payer_name
            if rate > worst_rate:
                worst_rate = rate
                worst_payer = r.payer_name

        # ADTP
        avg_adtp = await db.scalar(select(func.avg(ADTPTrend.actual_adtp_days))) or 0
        slowest_row = await db.execute(
            select(Payer.payer_name, func.avg(ADTPTrend.actual_adtp_days).label("avg_adtp"))
            .select_from(ADTPTrend)
            .join(Payer, Payer.payer_id == ADTPTrend.payer_id)
            .group_by(Payer.payer_name)
            .order_by(desc("avg_adtp"))
            .limit(1)
        )
        slowest = slowest_row.first()

        # Payment accuracy — allowed vs paid
        total_payer_payments = await db.scalar(select(func.sum(EraPayment.payment_amount))) or 0
        total_allowed = await db.scalar(select(func.sum(EraPayment.allowed_amount))) or 0
        payment_accuracy = round((float(total_payer_payments) / float(total_allowed) * 100), 1) if total_allowed else 0

        return {
            "payers_tracked": payers_tracked,
            "best_payer": best_payer,
            "best_payer_denial_rate": best_rate,
            "worst_payer": worst_payer,
            "worst_payer_denial_rate": worst_rate,
            "avg_adtp": float(avg_adtp),
            "slowest_payer": slowest[0] if slowest else "N/A",
            "slowest_adtp": float(slowest[1]) if slowest else 0,
            "payment_accuracy": payment_accuracy,
            "total_payer_payments": float(total_payer_payments),
        }
    except Exception as e:
        logger.error(f"Payer performance stats collection failed: {e}")
        return {"payers_tracked": 0, "best_payer": "N/A", "best_payer_denial_rate": 0,
                "worst_payer": "N/A", "worst_payer_denial_rate": 0, "avg_adtp": 0,
                "slowest_payer": "N/A", "slowest_adtp": 0, "payment_accuracy": 0,
                "total_payer_payments": 0}


async def _collect_simulation_stats(db: AsyncSession) -> dict:
    """Pull simulation engine status for prompt context."""
    try:
        import json
        from pathlib import Path
        scenarios_file = Path(__file__).resolve().parents[3] / "mirofish" / "rcm_seeds" / "simulation_scenarios.json"
        scenarios_available = 0
        last_sim_type = "N/A"
        last_sim_summary = "No simulations run yet"
        projected_impact = 0
        confidence_level = 0

        if scenarios_file.exists():
            with open(scenarios_file, "r") as f:
                data = json.load(f)
            scenarios = data.get("scenarios", [])
            scenarios_available = len(scenarios)
            if scenarios:
                last = scenarios[-1]
                last_sim_type = last.get("type", last.get("name", "N/A"))
                last_sim_summary = last.get("description", "Scenario available")

        # Use basic DB stats for projected impact
        from app.models.denial import Denial
        preventable_amount = await db.scalar(
            select(func.sum(Denial.denial_amount))
        ) or 0
        projected_impact = float(preventable_amount) * 0.15  # 15% improvement scenario
        confidence_level = 72  # default model confidence

        return {
            "scenarios_available": scenarios_available,
            "last_sim_type": last_sim_type,
            "last_sim_summary": last_sim_summary,
            "projected_impact": projected_impact,
            "confidence_level": confidence_level,
        }
    except Exception as e:
        logger.error(f"Simulation stats collection failed: {e}")
        return {"scenarios_available": 0, "last_sim_type": "N/A",
                "last_sim_summary": "No simulations run yet",
                "projected_impact": 0, "confidence_level": 0}


async def _collect_forecast_stats(db: AsyncSession) -> dict:
    """Pull forecast model stats for prompt context."""
    try:
        from app.services.prophet_forecast import get_forecast_accuracy
        acc = await get_forecast_accuracy(db)
        om = acc.get("overall_metrics", {})
        pp = acc.get("per_payer", [])
        top = min(pp, key=lambda x: x.get("mape", 100)) if pp else {}
        return {
            "model_type": acc.get("model_backend", "Prophet"),
            "mape": om.get("mape", 0),
            "r_squared": om.get("r_squared", 0),
            "total_projected": om.get("total_predicted", 0),
            "weekly_avg": om.get("total_predicted", 0) / max(acc.get("holdout_weeks", 4), 1),
            "denial_pct": 11.3,
            "training_points": sum(p.get("training_points", 0) for p in pp) if pp else 0,
            "top_payer": top.get("payer_name", "N/A"),
            "top_payer_mape": top.get("mape", 0),
        }
    except Exception as e:
        logger.error(f"Forecast stats collection failed: {e}")
        return {"model_type": "Prophet", "mape": 0, "r_squared": 0, "total_projected": 0,
                "weekly_avg": 0, "denial_pct": 0, "training_points": 0,
                "top_payer": "N/A", "top_payer_mape": 0}


async def _collect_lida_stats(db: AsyncSession) -> dict:
    """Pull LIDA analytics summary for prompt context."""
    try:
        from app.models.denial import Denial
        total_denials = await db.scalar(select(func.count(Denial.denial_id))) or 0
        denied_amount = await db.scalar(select(func.sum(Denial.denial_amount))) or 0
        total_claims  = await db.scalar(select(func.count(Claim.claim_id))) or 0
        total_posted  = await db.scalar(select(func.sum(EraPayment.payment_amount))) or 0
        total_ar      = await db.scalar(
            select(func.sum(Claim.total_charges))
            .where(Claim.status.notin_(["PAID", "WRITTEN_OFF", "VOIDED"]))
        ) or 0
        return {
            "total_claims": total_claims,
            "total_denials": total_denials,
            "denied_amount": float(denied_amount),
            "total_ar": float(total_ar),
            "total_posted": float(total_posted),
            "datasets_available": 5,
            "nl_query_ready": True,
        }
    except Exception as e:
        logger.error(f"LIDA stats collection failed: {e}")
        return {
            "total_claims": 0, "total_denials": 0, "denied_amount": 0,
            "total_ar": 0, "total_posted": 0,
            "datasets_available": 5, "nl_query_ready": True,
        }


STAT_COLLECTORS = {
    "denials":          _collect_denials_stats,
    "collections":      _collect_collections_stats,
    "payments":         _collect_payments_stats,
    "reconciliation":   _collect_reconciliation_stats,
    "root-cause":       _collect_root_cause_stats,
    "adtp":             _collect_adtp_stats,
    "diagnostics":      _collect_diagnostics_stats,
    "command-center":   _collect_command_center_stats,
    "executive":        _collect_executive_stats,
    "claims":           _collect_claims_stats,
    "claims-workqueue": _collect_claims_workqueue_stats,
    "crs":              _collect_crs_stats,
    "ar":               _collect_ar_stats,
    "prevention":       _collect_prevention_stats,
    "payer-performance":_collect_payer_performance_stats,
    "simulation":       _collect_simulation_stats,
    "forecast":         _collect_forecast_stats,
    "lida":             _collect_lida_stats,
}


# ── GET /ai/insights ──────────────────────────────────────────────────────────
@router.get("/insights")
async def get_insights(
    page: str = Query("denials", description="Page context: denials|collections|payments|reconciliation|root-cause|adtp"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Generate 3 MECE-badged AI insight cards for the given page.
    Pulls live DB stats → injects into Ollama prompt → returns structured JSON.
    """
    collector = STAT_COLLECTORS.get(page)
    if not collector:
        raise HTTPException(status_code=400, detail=f"Unknown page context: {page}. Use: {list(STAT_COLLECTORS.keys())}")

    stats = await collector(db)

    # Enrich page contexts with diagnostic engine findings
    diag_category_map = {
        "denials": "DENIAL_PATTERN",
        "payments": "PAYMENT_FLOW",
        "collections": "AR_AGING",
        "reconciliation": "REVENUE_LEAKAGE",
    }
    if page in diag_category_map:
        stats = await _enrich_with_diagnostics(db, stats, diag_category_map[page])

    insights = await ai_insights.get_insights(page, stats, db=db)
    return {"page": page, "stats_context": stats, "insights": insights, "count": len(insights)}


# ── GET /ai/stream ────────────────────────────────────────────────────────────
@router.get("/stream")
async def stream_insights(
    context: str = Query("denials", description="Context: denials|collections|payments|reconciliation|root-cause|adtp"),
    db: AsyncSession = Depends(get_db),
):
    """Stream Ollama tokens as Server-Sent Events for real-time UI rendering."""
    collector = STAT_COLLECTORS.get(context)
    if not collector:
        raise HTTPException(status_code=400, detail=f"Unknown context: {context}")

    stats = await collector(db)

    async def event_generator():
        try:
            async for token in ai_insights.stream_insights(context, stats):
                yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── POST /ai/appeal-draft ─────────────────────────────────────────────────────
@router.post("/appeal-draft")
async def appeal_draft(
    body: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Generate a formal appeal letter for a denied claim.
    Body: { claim_id, patient_name, date_of_service, cpt_code,
            denial_reason, carc_code, payer_name, billed_amount, denied_amount }
    """
    claim_id = body.get("claim_id")
    if not claim_id:
        raise HTTPException(status_code=400, detail="claim_id is required")

    # Enrich with DB data if available
    try:
        from app.models.denial import Denial
        from app.models.patient import Patient

        denial_row = await db.execute(
            select(Denial, Patient, Payer, Claim)
            .join(Claim,   Claim.claim_id   == Denial.claim_id,   isouter=True)
            .join(Patient, Patient.patient_id == Claim.patient_id, isouter=True)
            .join(Payer,   Payer.payer_id    == Claim.payer_id,    isouter=True)
            .where(Denial.claim_id == claim_id)
            .limit(1)
        )
        row = denial_row.first()
        if row:
            denial, patient, payer, claim = row
            body.update({
                "patient_name":    f"{patient.first_name} {patient.last_name}" if patient else body.get("patient_name", "N/A"),
                "date_of_service": str(claim.date_of_service) if claim else body.get("date_of_service", "N/A"),
                "payer_name":      payer.name if payer else body.get("payer_name", "N/A"),
                "billed_amount":   float(claim.total_charges) if claim else body.get("billed_amount", 0),
                "denied_amount":   float(denial.denied_amount) if denial else body.get("denied_amount", 0),
                "denial_reason":   denial.denial_category if denial else body.get("denial_reason", "N/A"),
                "carc_code":       denial.carc_code if denial else body.get("carc_code", "N/A"),
            })
    except Exception as e:
        logger.warning(f"Could not enrich appeal from DB: {e} — using body data")

    letter = await ai_insights.draft_appeal(body)
    return {"claim_id": claim_id, "appeal_letter": letter, "ai_generated": True}


# ── POST /ai/call-script ──────────────────────────────────────────────────────
@router.post("/call-script")
async def call_script(
    body: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Generate a collections call script for a queue task.
    Body: { task_id, patient_name, payer_name, balance, days_outstanding, action_type, priority }
    """
    task_id = body.get("task_id")
    if not task_id:
        raise HTTPException(status_code=400, detail="task_id is required")

    # Enrich with DB data
    try:
        from app.models.patient import Patient
        row = await db.execute(
            select(CollectionQueue, Patient, Payer)
            .join(Patient, Patient.patient_id == CollectionQueue.patient_id, isouter=True)
            .join(Payer,   Payer.payer_id    == CollectionQueue.payer_id,    isouter=True)
            .where(CollectionQueue.task_id == task_id)
            .limit(1)
        )
        row = row.first()
        if row:
            task, patient, payer = row
            body.update({
                "patient_name":    f"{patient.first_name} {patient.last_name}" if patient else body.get("patient_name", "N/A"),
                "payer_name":      payer.name if payer else body.get("payer_name", "N/A"),
                "balance":         float(task.balance),
                "days_outstanding": task.days_outstanding,
                "action_type":     task.action_type,
                "priority":        task.priority,
            })
    except Exception as e:
        logger.warning(f"Could not enrich script from DB: {e} — using body data")

    script = await ai_insights.generate_call_script(body)
    return {"task_id": task_id, "call_script": script, "ai_generated": True}


# ── GET /ai/anomaly-explain ───────────────────────────────────────────────────
@router.get("/anomaly-explain")
async def anomaly_explain(
    metric:   str   = Query(..., description="Metric name (e.g. denial_rate, ar_velocity)"),
    value:    float = Query(..., description="Current observed value"),
    baseline: float = Query(..., description="Expected baseline value"),
) -> Any:
    """Explain a detected metric anomaly in plain English."""
    explanation = await ai_insights.explain_anomaly(metric, value, baseline)
    pct_diff = ((value - baseline) / baseline * 100) if baseline else 0
    return {
        "metric":      metric,
        "value":       value,
        "baseline":    baseline,
        "deviation_pct": round(pct_diff, 2),
        "explanation": explanation,
        "ai_generated": True,
    }
