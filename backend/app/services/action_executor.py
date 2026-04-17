"""
Action Executor — Real action dispatcher
==========================================
Dispatches automation actions to concrete handlers that modify database
records.  Each handler:
  1. Reads the trigger data attached to the AutomationAction.
  2. Applies changes to the relevant tables (denials, appeals, claims, ERA).
  3. Logs an audit trail of every mutation.
  4. Returns a structured result dict.

Supported rule_id dispatch:
  AUTO-001  Root cause classification  (updates denial.root_cause_status)
  AUTO-002  Appeal generation          (creates record in appeals table)
  AUTO-003  Payment posting            (updates claim status, creates ERA payment)
  AUTO-006  High-risk hold             (sets claims to HOLD_HIGH_RISK)
  AUTO-008  Claim resubmission         (updates claim status to SUBMITTED)
  AUTO-009  Timely filing escalation   (sets claims to HOLD_TIMELY_FILING)
  AUTO-010  Auth renewal               (sets claims to HOLD_AUTH_RENEWAL)
  AUTO-011  Eligibility re-verification(sets claims to HOLD_ELIG_REVERIF)
  AUTO-012  Duplicate claim hold       (holds duplicates as HOLD_DUPLICATE)
  AUTO-014  Underpayment dispute       (logs dispute -- placeholder)
"""

import json
import logging
from datetime import date, datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import select, update, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.automation import AutomationAction
from app.models.claim import Claim, ClaimStatus
from app.models.denial import Denial, Appeal
from app.models.rcm_extended import EraPayment, PriorAuth, Eligibility271

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _gen_appeal_id() -> str:
    return f"APL-{uuid4().hex[:8].upper()}"


def _gen_era_id() -> str:
    return f"ERA-{uuid4().hex[:8].upper()}"


def _parse_trigger_data(action: AutomationAction) -> dict:
    """Safely parse the JSON trigger_data column."""
    if not action.trigger_data:
        return {}
    try:
        return json.loads(action.trigger_data)
    except (json.JSONDecodeError, TypeError):
        logger.warning(
            "Could not parse trigger_data for action %s", action.action_id
        )
        return {}


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def execute_real_action(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Dispatch an automation action to the appropriate handler.

    Parameters
    ----------
    db : AsyncSession
        Active database session (caller is responsible for commit/rollback).
    action : AutomationAction
        The action row to execute.

    Returns
    -------
    dict  {success: bool, action: str, details: dict}
    """
    rule_id = action.rule_id

    handlers = {
        "AUTO-001": _handle_root_cause_classification,
        "AUTO-002": _handle_appeal_generation,
        "AUTO-003": _handle_payment_posting,
        "AUTO-006": _handle_high_risk_hold,
        "AUTO-008": _handle_claim_resubmission,
        "AUTO-009": _handle_timely_filing_escalation,
        "AUTO-010": _handle_auth_renewal,
        "AUTO-011": _handle_eligibility_reverification,
        "AUTO-012": _handle_duplicate_hold,
        "AUTO-014": _handle_underpayment_dispute,
    }

    handler = handlers.get(rule_id)
    if handler is None:
        logger.info(
            "No real handler for rule_id=%s (action=%s). Marking as executed with no-op.",
            rule_id,
            action.action_id,
        )
        action.status = "EXECUTED"
        action.executed_at = datetime.utcnow()
        action.outcome = f"No handler registered for {rule_id}"
        return {
            "success": True,
            "action": "no_handler",
            "details": {"rule_id": rule_id, "note": "No handler registered"},
        }

    try:
        result = await handler(db, action)
        # Stamp the action as executed
        action.status = "EXECUTED"
        action.executed_at = datetime.utcnow()
        action.outcome = json.dumps(result.get("details", {}))[:200]
        logger.info(
            "Action %s (rule %s) executed successfully: %s",
            action.action_id,
            rule_id,
            result.get("action"),
        )
        return result

    except Exception as exc:
        action.status = "FAILED"
        action.executed_at = datetime.utcnow()
        action.outcome = f"Error: {str(exc)[:180]}"
        logger.exception(
            "Action %s (rule %s) failed", action.action_id, rule_id
        )
        return {
            "success": False,
            "action": rule_id,
            "details": {"error": str(exc)},
        }


# ---------------------------------------------------------------------------
# AUTO-001: Root cause classification
# ---------------------------------------------------------------------------

async def _handle_root_cause_classification(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Update denial.root_cause_status to ANALYZED for matched denials."""
    trigger = _parse_trigger_data(action)
    claim_id = trigger.get("claim_id")
    denial_id = trigger.get("denial_id")
    # Prefer denial_category (actual Denial.denial_category value, e.g. "Coding")
    # over category (finding type, e.g. "DENIAL_PATTERN") which never matches.
    category = trigger.get("denial_category") or trigger.get("category")

    updated_ids = []

    if denial_id:
        # Single denial targeted
        denial = await db.get(Denial, denial_id)
        if denial:
            denial.root_cause_status = "ANALYZED"
            updated_ids.append(denial.denial_id)
    elif claim_id:
        # All denials for a claim
        result = await db.execute(
            select(Denial).where(Denial.claim_id == claim_id)
        )
        for denial in result.scalars().all():
            denial.root_cause_status = "ANALYZED"
            updated_ids.append(denial.denial_id)
    elif category:
        # Batch: all PENDING denials in the matched category
        result = await db.execute(
            select(Denial).where(
                Denial.root_cause_status == "PENDING",
                Denial.denial_category == category,
            )
        )
        for denial in result.scalars().all():
            denial.root_cause_status = "ANALYZED"
            updated_ids.append(denial.denial_id)

    logger.info(
        "AUTO-001 root cause classification: updated %d denial(s) -> ANALYZED  [action=%s]",
        len(updated_ids),
        action.action_id,
    )

    return {
        "success": True,
        "action": "root_cause_classification",
        "details": {
            "denials_updated": len(updated_ids),
            "denial_ids": updated_ids[:50],  # cap for readability
            "new_status": "ANALYZED",
        },
    }


# ---------------------------------------------------------------------------
# AUTO-002: Appeal generation
# ---------------------------------------------------------------------------

async def _handle_appeal_generation(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Create a new appeal record for the targeted denial."""
    trigger = _parse_trigger_data(action)
    denial_id = trigger.get("denial_id")
    claim_id = trigger.get("claim_id")
    root_cause = trigger.get("root_cause", "Unknown")
    payer_name = trigger.get("payer_name", "")

    # If no specific denial, try to find one from the claim
    if not denial_id and claim_id:
        result = await db.execute(
            select(Denial.denial_id).where(
                Denial.claim_id == claim_id,
                Denial.root_cause_status.in_(["PENDING", "REVIEW_NEEDED"]),
            ).limit(1)
        )
        row = result.scalar()
        if row:
            denial_id = row

    if not denial_id:
        # Fallback: create appeal for the first open denial we can find
        # linked to this action's affected claims
        logger.warning(
            "AUTO-002: no denial_id in trigger_data for action %s. "
            "Skipping appeal creation.",
            action.action_id,
        )
        return {
            "success": False,
            "action": "appeal_generation",
            "details": {"error": "No denial_id could be resolved"},
        }

    # Fetch denial to get claim_id if missing
    denial = await db.get(Denial, denial_id)
    if denial is None:
        return {
            "success": False,
            "action": "appeal_generation",
            "details": {"error": f"Denial {denial_id} not found"},
        }

    if not claim_id:
        claim_id = denial.claim_id

    appeal_id = _gen_appeal_id()

    appeal = Appeal(
        appeal_id=appeal_id,
        denial_id=denial_id,
        claim_id=claim_id,
        appeal_type="FIRST_LEVEL",
        submitted_date=date.today(),
        appeal_method="PORTAL",
        ai_generated=True,
        outcome="PENDING",
        recovered_amount=0,
    )

    db.add(appeal)

    logger.info(
        "AUTO-002 appeal generation: created appeal %s for denial %s "
        "(claim %s, root_cause=%s, payer=%s)  [action=%s]",
        appeal_id,
        denial_id,
        claim_id,
        root_cause,
        payer_name,
        action.action_id,
    )

    return {
        "success": True,
        "action": "appeal_generation",
        "details": {
            "appeal_id": appeal_id,
            "denial_id": denial_id,
            "claim_id": claim_id,
            "appeal_type": "FIRST_LEVEL",
            "ai_generated": True,
        },
    }


# ---------------------------------------------------------------------------
# AUTO-003: Payment posting
# ---------------------------------------------------------------------------

async def _handle_payment_posting(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Update claim status to PAID and create an ERA payment record."""
    trigger = _parse_trigger_data(action)
    claim_id = trigger.get("claim_id")
    payer_id = trigger.get("payer_id")
    payment_amount = float(trigger.get("payment_amount", 0) or action.estimated_impact or 0)

    if not claim_id:
        return {
            "success": False,
            "action": "payment_posting",
            "details": {"error": "No claim_id in trigger_data"},
        }

    claim = await db.get(Claim, claim_id)
    if claim is None:
        return {
            "success": False,
            "action": "payment_posting",
            "details": {"error": f"Claim {claim_id} not found"},
        }

    previous_status = claim.status
    claim.status = ClaimStatus.PAID

    if not payer_id:
        payer_id = claim.payer_id

    # Create ERA payment record
    era_id = _gen_era_id()
    today = date.today()
    # Compute week start (Monday)
    week_start = today - __import__("datetime").timedelta(days=today.weekday())

    era = EraPayment(
        era_id=era_id,
        claim_id=claim_id,
        payer_id=payer_id,
        payment_date=today,
        payment_week_start=week_start,
        payment_amount=payment_amount,
        payment_method="EFT",
        allowed_amount=payment_amount,
        co_amount=0,
        pr_amount=0,
        oa_amount=0,
        pi_amount=0,
    )

    db.add(era)

    logger.info(
        "AUTO-003 payment posting: claim %s status %s -> PAID, "
        "ERA %s created ($%.2f)  [action=%s]",
        claim_id,
        previous_status,
        era_id,
        payment_amount,
        action.action_id,
    )

    return {
        "success": True,
        "action": "payment_posting",
        "details": {
            "claim_id": claim_id,
            "previous_status": previous_status,
            "new_status": ClaimStatus.PAID,
            "era_id": era_id,
            "payment_amount": payment_amount,
        },
    }


# ---------------------------------------------------------------------------
# AUTO-008: Claim resubmission
# ---------------------------------------------------------------------------

async def _handle_claim_resubmission(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Update claim status to SUBMITTED for rejected/fixable claims."""
    trigger = _parse_trigger_data(action)
    claim_id = trigger.get("claim_id")

    if not claim_id:
        # Try to find claims from the denial associated with this action
        denial_id = trigger.get("denial_id")
        if denial_id:
            denial = await db.get(Denial, denial_id)
            if denial:
                claim_id = denial.claim_id

    if not claim_id:
        return {
            "success": False,
            "action": "claim_resubmission",
            "details": {"error": "No claim_id could be resolved"},
        }

    claim = await db.get(Claim, claim_id)
    if claim is None:
        return {
            "success": False,
            "action": "claim_resubmission",
            "details": {"error": f"Claim {claim_id} not found"},
        }

    previous_status = claim.status
    claim.status = ClaimStatus.SUBMITTED
    claim.submission_date = date.today()

    logger.info(
        "AUTO-008 claim resubmission: claim %s status %s -> SUBMITTED  [action=%s]",
        claim_id,
        previous_status,
        action.action_id,
    )

    return {
        "success": True,
        "action": "claim_resubmission",
        "details": {
            "claim_id": claim_id,
            "previous_status": previous_status,
            "new_status": ClaimStatus.SUBMITTED,
        },
    }


# ---------------------------------------------------------------------------
# AUTO-014: Underpayment dispute
# ---------------------------------------------------------------------------

async def _handle_underpayment_dispute(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Log an underpayment dispute (placeholder -- no disputes table yet)."""
    trigger = _parse_trigger_data(action)
    payer_id = trigger.get("payer_id")
    payer_name = trigger.get("payer_name", "Unknown payer")
    impact = float(trigger.get("impact", 0) or action.estimated_impact or 0)
    claim_id = trigger.get("claim_id")

    # No dedicated disputes table exists yet.  Log the dispute details so
    # they appear in the audit trail and can be reviewed manually.
    logger.info(
        "AUTO-014 underpayment dispute: payer=%s (%s), impact=$%.2f, "
        "claim=%s  [action=%s]  -- logged for manual review (no disputes table yet)",
        payer_name,
        payer_id,
        impact,
        claim_id,
        action.action_id,
    )

    return {
        "success": True,
        "action": "underpayment_dispute",
        "details": {
            "payer_id": payer_id,
            "payer_name": payer_name,
            "disputed_amount": impact,
            "claim_id": claim_id,
            "note": "Dispute logged for manual review -- no disputes table yet",
        },
    }


# ---------------------------------------------------------------------------
# AUTO-006: High-risk claim hold
# ---------------------------------------------------------------------------

async def _handle_high_risk_hold(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Place claims with low CRS scores on HOLD_HIGH_RISK status."""
    trigger = _parse_trigger_data(action)
    claim_ids = trigger.get("claim_ids", [])

    if not claim_ids:
        return {
            "success": False,
            "action": "high_risk_hold",
            "details": {"error": "No claim_ids in trigger_data"},
        }

    updated = []
    for cid in claim_ids:
        claim = await db.get(Claim, cid)
        if claim and claim.status not in (
            ClaimStatus.PAID, ClaimStatus.WRITTEN_OFF, ClaimStatus.VOIDED
        ):
            claim.status = "HOLD_HIGH_RISK"
            updated.append(cid)

    logger.info(
        "AUTO-006 high-risk hold: %d/%d claims set to HOLD_HIGH_RISK  [action=%s]",
        len(updated),
        len(claim_ids),
        action.action_id,
    )

    return {
        "success": True,
        "action": "high_risk_hold",
        "details": {
            "claims_held": len(updated),
            "claim_ids": updated[:50],
            "new_status": "HOLD_HIGH_RISK",
        },
    }


# ---------------------------------------------------------------------------
# AUTO-009: Timely filing escalation
# ---------------------------------------------------------------------------

async def _handle_timely_filing_escalation(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Escalate claims approaching their filing deadline to HOLD_TIMELY_FILING."""
    from datetime import timedelta

    trigger = _parse_trigger_data(action)
    days_threshold = trigger.get("days_threshold", 75)
    remaining_days = trigger.get("remaining_days", 15)

    now = datetime.utcnow()
    cutoff_start = now - timedelta(days=days_threshold)
    cutoff_end = now - timedelta(days=days_threshold - remaining_days)

    stmt = (
        select(Denial.claim_id)
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .where(
            and_(
                Claim.date_of_service.isnot(None),
                Claim.date_of_service >= cutoff_start,
                Claim.date_of_service <= cutoff_end,
                Claim.status.not_in([
                    ClaimStatus.PAID, ClaimStatus.WRITTEN_OFF, ClaimStatus.VOIDED,
                ]),
            )
        )
    )
    rows = await db.execute(stmt)
    claim_ids = list({r[0] for r in rows.all()})

    updated = []
    for cid in claim_ids:
        claim = await db.get(Claim, cid)
        if claim:
            claim.status = "HOLD_TIMELY_FILING"
            updated.append(cid)

    logger.info(
        "AUTO-009 timely filing escalation: %d claims set to HOLD_TIMELY_FILING  [action=%s]",
        len(updated),
        action.action_id,
    )

    return {
        "success": True,
        "action": "timely_filing_escalation",
        "details": {
            "claims_escalated": len(updated),
            "claim_ids": updated[:50],
            "new_status": "HOLD_TIMELY_FILING",
        },
    }


# ---------------------------------------------------------------------------
# AUTO-010: Auth renewal
# ---------------------------------------------------------------------------

async def _handle_auth_renewal(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Place claims with expiring prior auth on HOLD_AUTH_RENEWAL status."""
    trigger = _parse_trigger_data(action)
    claim_ids = trigger.get("claim_ids", [])

    if not claim_ids:
        # Fallback: query directly from prior_auth
        from datetime import timedelta

        window = trigger.get("window_days", 14)
        now_date = date.today()
        cutoff = now_date + timedelta(days=window)

        stmt = (
            select(PriorAuth.claim_id)
            .join(Claim, Claim.claim_id == PriorAuth.claim_id)
            .where(
                and_(
                    PriorAuth.status == "APPROVED",
                    PriorAuth.expiry_date.isnot(None),
                    PriorAuth.expiry_date >= now_date,
                    PriorAuth.expiry_date <= cutoff,
                    Claim.status.not_in([
                        ClaimStatus.PAID, ClaimStatus.WRITTEN_OFF, ClaimStatus.VOIDED,
                    ]),
                )
            )
        )
        rows = await db.execute(stmt)
        claim_ids = list({r[0] for r in rows.all()})

    updated = []
    for cid in claim_ids:
        claim = await db.get(Claim, cid)
        if claim and claim.status not in (
            ClaimStatus.PAID, ClaimStatus.WRITTEN_OFF, ClaimStatus.VOIDED
        ):
            claim.status = "HOLD_AUTH_RENEWAL"
            updated.append(cid)

    logger.info(
        "AUTO-010 auth renewal: %d claims set to HOLD_AUTH_RENEWAL  [action=%s]",
        len(updated),
        action.action_id,
    )

    return {
        "success": True,
        "action": "auth_renewal",
        "details": {
            "claims_held": len(updated),
            "claim_ids": updated[:50],
            "new_status": "HOLD_AUTH_RENEWAL",
        },
    }


# ---------------------------------------------------------------------------
# AUTO-011: Eligibility re-verification
# ---------------------------------------------------------------------------

async def _handle_eligibility_reverification(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Place claims with inactive/terminated eligibility on HOLD_ELIG_REVERIF."""
    trigger = _parse_trigger_data(action)
    claim_ids = trigger.get("claim_ids", [])

    if not claim_ids:
        # Fallback: query directly
        latest_elig = (
            select(
                Eligibility271.patient_id,
                Eligibility271.payer_id,
                func.max(Eligibility271.inquiry_date).label("last_check"),
            )
            .group_by(Eligibility271.patient_id, Eligibility271.payer_id)
            .subquery()
        )

        stmt = (
            select(Claim.claim_id)
            .join(
                latest_elig,
                and_(
                    Claim.patient_id == latest_elig.c.patient_id,
                    Claim.payer_id == latest_elig.c.payer_id,
                ),
            )
            .join(
                Eligibility271,
                and_(
                    Eligibility271.patient_id == latest_elig.c.patient_id,
                    Eligibility271.payer_id == latest_elig.c.payer_id,
                    Eligibility271.inquiry_date == latest_elig.c.last_check,
                ),
            )
            .where(
                and_(
                    Eligibility271.subscriber_status.in_(["INACTIVE", "TERMINATED"]),
                    Claim.status.not_in([
                        ClaimStatus.PAID, ClaimStatus.WRITTEN_OFF, ClaimStatus.VOIDED,
                    ]),
                )
            )
        )
        rows = await db.execute(stmt)
        claim_ids = list({r[0] for r in rows.all()})

    updated = []
    for cid in claim_ids:
        claim = await db.get(Claim, cid)
        if claim and claim.status not in (
            ClaimStatus.PAID, ClaimStatus.WRITTEN_OFF, ClaimStatus.VOIDED
        ):
            claim.status = "HOLD_ELIG_REVERIF"
            updated.append(cid)

    logger.info(
        "AUTO-011 eligibility re-verification: %d claims set to HOLD_ELIG_REVERIF  [action=%s]",
        len(updated),
        action.action_id,
    )

    return {
        "success": True,
        "action": "eligibility_reverification",
        "details": {
            "claims_held": len(updated),
            "claim_ids": updated[:50],
            "new_status": "HOLD_ELIG_REVERIF",
        },
    }


# ---------------------------------------------------------------------------
# AUTO-012: Duplicate claim hold
# ---------------------------------------------------------------------------

async def _handle_duplicate_hold(
    db: AsyncSession, action: AutomationAction
) -> Dict[str, Any]:
    """Find duplicate claims and hold all but the first per group as HOLD_DUPLICATE."""
    # Identify duplicate groups: same patient + DOS + payer + charge_amount
    stmt = (
        select(
            Claim.patient_id,
            Claim.date_of_service,
            Claim.payer_id,
            Claim.charge_amount,
        )
        .where(
            and_(
                Claim.patient_id.isnot(None),
                Claim.date_of_service.isnot(None),
                Claim.status.not_in([
                    ClaimStatus.PAID, ClaimStatus.WRITTEN_OFF, ClaimStatus.VOIDED,
                ]),
            )
        )
        .group_by(
            Claim.patient_id,
            Claim.date_of_service,
            Claim.payer_id,
            Claim.charge_amount,
        )
        .having(func.count(Claim.claim_id) > 1)
    )
    rows = await db.execute(stmt)
    groups = rows.all()

    held_ids = []
    for grp in groups:
        # Fetch all claims in this duplicate group, ordered by claim_id (keep first)
        detail_stmt = (
            select(Claim)
            .where(
                and_(
                    Claim.patient_id == grp.patient_id,
                    Claim.date_of_service == grp.date_of_service,
                    Claim.payer_id == grp.payer_id,
                    Claim.charge_amount == grp.charge_amount,
                    Claim.status.not_in([
                        ClaimStatus.PAID, ClaimStatus.WRITTEN_OFF, ClaimStatus.VOIDED,
                    ]),
                )
            )
            .order_by(Claim.claim_id)
        )
        detail_rows = await db.execute(detail_stmt)
        claims_in_group = detail_rows.scalars().all()

        # Keep the first claim, hold the rest
        for claim in claims_in_group[1:]:
            claim.status = "HOLD_DUPLICATE"
            held_ids.append(claim.claim_id)

    logger.info(
        "AUTO-012 duplicate hold: %d duplicate claims set to HOLD_DUPLICATE across %d groups  [action=%s]",
        len(held_ids),
        len(groups),
        action.action_id,
    )

    return {
        "success": True,
        "action": "duplicate_hold",
        "details": {
            "claims_held": len(held_ids),
            "claim_ids": held_ids[:50],
            "duplicate_groups": len(groups),
            "new_status": "HOLD_DUPLICATE",
        },
    }
