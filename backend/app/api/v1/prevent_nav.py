"""
Prevent Nav Summary API — compact rollup for sidebar badges
==============================================================
GET /api/v1/prevent/nav-summary

Returns per-page counts used by the frontend Prevent sidebar section.
Cached in-memory (60s TTL) — this drives sidebar badges, not real-time alerts.
"""
import logging
import time as _time
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.claim import Claim
from app.models.denial import Denial
from app.models.rcm_extended import PriorAuth, Eligibility271
from app.models.automation import AutomationAction
from app.services.prevention_service import get_prevention_summary
from app.services.automation_engine import get_rules as get_automation_rules

logger = logging.getLogger(__name__)

router = APIRouter()

# 60s in-memory cache — sidebar badges don't need real-time freshness
_NAV_CACHE: dict = {}
_NAV_CACHE_TTL = 60  # seconds


@router.get("/nav-summary")
async def prevent_nav_summary(db: AsyncSession = Depends(get_db)) -> dict:
    """Return per-page rollup counts used by the Prevent sidebar section."""
    cached = _NAV_CACHE.get("nav")
    if cached and (_time.time() - cached["ts"]) < _NAV_CACHE_TTL:
        return cached["data"]

    # ---------- Claim Readiness ----------
    # Low-CRS draft claims (< 80) and their at-risk revenue
    claim_readiness = {"count": 0, "at_risk_revenue": 0.0}
    try:
        cr_count = await db.scalar(
            select(func.count(Claim.claim_id)).where(
                and_(Claim.crs_score < 80, Claim.status == "DRAFT")
            )
        ) or 0
        cr_revenue = await db.scalar(
            select(func.coalesce(func.sum(Claim.total_charges), 0.0)).where(
                and_(Claim.crs_score < 80, Claim.status == "DRAFT")
            )
        ) or 0.0
        claim_readiness = {
            "count": int(cr_count),
            "at_risk_revenue": float(cr_revenue),
        }
    except Exception as exc:
        logger.warning("nav-summary: claim_readiness query failed: %s", exc)

    # ---------- Prevention Engine ----------
    prevention_engine = {"count": 0, "critical_revenue": 0.0}
    try:
        pe_summary = await get_prevention_summary(db)
        prevention_engine = {
            "count": int(pe_summary.get("total_alerts", 0)),
            "critical_revenue": float(pe_summary.get("critical_revenue_at_risk", 0.0)),
        }
    except Exception as exc:
        logger.warning("nav-summary: prevention_engine query failed: %s", exc)

    # ---------- Patient Access ----------
    patient_access = {"count": 0, "eligibility_issues": 0}
    try:
        pa_count = await db.scalar(
            select(func.count(PriorAuth.auth_id)).where(PriorAuth.status == "PENDING")
        ) or 0
        elig_issues = await db.scalar(
            select(func.count(Eligibility271.elig_id)).where(
                Eligibility271.subscriber_status != "ACTIVE"
            )
        ) or 0
        patient_access = {
            "count": int(pa_count),
            "eligibility_issues": int(elig_issues),
        }
    except Exception as exc:
        logger.warning("nav-summary: patient_access query failed: %s", exc)

    # ---------- Coding Optimizer ----------
    coding_optimizer = {"count": 0, "underpaid_amount": 0.0}
    try:
        co_count = await db.scalar(
            select(func.count(distinct(Denial.claim_id))).where(
                Denial.denial_category == "CODING"
            )
        ) or 0
        coding_optimizer = {
            "count": int(co_count),
            "underpaid_amount": 0.0,  # underpayment column not available in Denial model
        }
    except Exception as exc:
        logger.warning("nav-summary: coding_optimizer query failed: %s", exc)

    # ---------- Automation Rules ----------
    automation_rules: dict = {
        "active": 0,
        "pending_approval": 0,
        "last_run": None,
    }
    try:
        rules = await get_automation_rules(db)
        automation_rules["active"] = sum(1 for r in rules if r.get("enabled"))

        pending = await db.scalar(
            select(func.count(AutomationAction.action_id)).where(
                AutomationAction.status == "PENDING"
            )
        ) or 0
        automation_rules["pending_approval"] = int(pending)

        last_run = await db.scalar(
            select(func.max(AutomationAction.executed_at))
        )
        automation_rules["last_run"] = str(last_run) if last_run else None
    except Exception as exc:
        logger.warning("nav-summary: automation_rules query failed: %s", exc)

    result = {
        "claim_readiness": claim_readiness,
        "prevention_engine": prevention_engine,
        "patient_access": patient_access,
        "coding_optimizer": coding_optimizer,
        "automation_rules": automation_rules,
    }
    _NAV_CACHE["nav"] = {"ts": _time.time(), "data": result}
    return result
