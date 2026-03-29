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
  AUTO-008  Claim resubmission         (updates claim status to SUBMITTED)
  AUTO-014  Underpayment dispute       (logs dispute -- placeholder)
"""

import json
import logging
from datetime import date, datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.automation import AutomationAction
from app.models.claim import Claim, ClaimStatus
from app.models.denial import Denial, Appeal
from app.models.rcm_extended import EraPayment

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
        "AUTO-008": _handle_claim_resubmission,
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
        action.executed_at = datetime.now(timezone.utc)
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
        action.executed_at = datetime.now(timezone.utc)
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
        action.executed_at = datetime.now(timezone.utc)
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
    category = trigger.get("category")

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
