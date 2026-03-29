"""
Outcome Tracker — Sprint 14.4
===============================
Tracks appeal, resubmission, and dispute outcomes through resolution.
Updates automation action records with actual outcomes.

Entry points:
  record_appeal_outcome(db, appeal_id, outcome, recovered_amount) -> dict
  record_resubmission_outcome(db, claim_id, new_status, payment_amount) -> dict
  get_outcome_summary(db, days=90) -> dict
  get_prediction_accuracy(db, days=90) -> dict
"""

import json
import logging
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.denial import Appeal, Denial
from app.models.automation import AutomationAction

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# record_appeal_outcome
# ---------------------------------------------------------------------------

async def record_appeal_outcome(
    db: AsyncSession,
    appeal_id: str,
    outcome: str,
    recovered_amount: float = 0.0,
) -> dict:
    """
    Update an Appeal record with its final outcome (WON / LOST / PARTIAL)
    and the recovered dollar amount.  Also propagate the result to any
    AutomationAction that references this appeal's denial_id.

    Returns dict with updated appeal and automation action info.
    """
    try:
        # --- 1. Fetch and update the Appeal ---
        result = await db.execute(
            select(Appeal).where(Appeal.appeal_id == appeal_id)
        )
        appeal: Optional[Appeal] = result.scalar_one_or_none()

        if appeal is None:
            return {"status": "error", "message": f"Appeal {appeal_id} not found"}

        # Map caller-friendly labels to DB enum values
        outcome_map = {
            "WON": "APPROVED",
            "LOST": "DENIED",
            "PARTIAL": "PARTIAL",
            "APPROVED": "APPROVED",
            "DENIED": "DENIED",
        }
        db_outcome = outcome_map.get(outcome.upper(), outcome.upper())

        appeal.outcome = db_outcome
        appeal.recovered_amount = recovered_amount
        appeal.outcome_date = date.today()
        if db_outcome == "APPROVED":
            appeal.carc_overturned = True

        # --- 2. Find linked AutomationAction(s) and update ---
        denial_id = appeal.denial_id
        action_result = await db.execute(
            select(AutomationAction).where(
                AutomationAction.trigger_data.contains(denial_id),
                AutomationAction.status.in_(["EXECUTED", "APPROVED", "PENDING"]),
            )
        )
        actions = action_result.scalars().all()

        updated_actions = []
        for action in actions:
            action.outcome = (
                f"Appeal {outcome.upper()} — recovered ${recovered_amount:,.2f}"
            )
            if action.status == "EXECUTED":
                pass  # keep EXECUTED
            else:
                action.status = "EXECUTED"
                action.executed_at = datetime.utcnow()
            updated_actions.append(action.action_id)

        await db.commit()
        await db.refresh(appeal)

        logger.info(
            "Recorded outcome for appeal %s: %s ($%.2f). "
            "Updated %d automation actions.",
            appeal_id, outcome, recovered_amount, len(updated_actions),
        )

        return {
            "status": "success",
            "appeal_id": appeal_id,
            "outcome": db_outcome,
            "recovered_amount": recovered_amount,
            "outcome_date": str(appeal.outcome_date),
            "automation_actions_updated": updated_actions,
        }

    except Exception as exc:
        await db.rollback()
        logger.error("Failed to record appeal outcome for %s: %s", appeal_id, exc)
        return {"status": "error", "message": str(exc)}


# ---------------------------------------------------------------------------
# record_resubmission_outcome
# ---------------------------------------------------------------------------

async def record_resubmission_outcome(
    db: AsyncSession,
    claim_id: str,
    new_status: str,
    payment_amount: float = 0.0,
) -> dict:
    """
    For claims resubmitted via AUTO-008 automation actions, record the
    final payer response (PAID / DENIED / PARTIAL).

    Returns a summary dict.
    """
    try:
        # Find AUTO-008 actions linked to this claim
        result = await db.execute(
            select(AutomationAction).where(
                AutomationAction.trigger_data.contains(claim_id),
                AutomationAction.rule_id.like("AUTO-008%"),
            )
        )
        actions = result.scalars().all()

        if not actions:
            return {
                "status": "not_found",
                "message": f"No AUTO-008 resubmission actions found for claim {claim_id}",
            }

        updated = []
        for action in actions:
            action.outcome = (
                f"Resubmission {new_status.upper()} — ${payment_amount:,.2f}"
            )
            if action.status != "EXECUTED":
                action.status = "EXECUTED"
                action.executed_at = datetime.utcnow()
            updated.append(action.action_id)

        await db.commit()

        logger.info(
            "Recorded resubmission outcome for claim %s: %s ($%.2f). "
            "Updated %d actions.",
            claim_id, new_status, payment_amount, len(updated),
        )

        return {
            "status": "success",
            "claim_id": claim_id,
            "new_status": new_status,
            "payment_amount": payment_amount,
            "actions_updated": updated,
        }

    except Exception as exc:
        await db.rollback()
        logger.error("Failed to record resubmission outcome for %s: %s", claim_id, exc)
        return {"status": "error", "message": str(exc)}


# ---------------------------------------------------------------------------
# get_outcome_summary
# ---------------------------------------------------------------------------

async def get_outcome_summary(db: AsyncSession, days: int = 90) -> dict:
    """
    Aggregate appeal outcomes over the last *days* days.

    Returns:
        {
            "total_appeals": int,
            "by_outcome": {"APPROVED": n, "DENIED": n, "PARTIAL": n, "PENDING": n},
            "total_recovered": float,
            "win_rate": float,            # (APPROVED + PARTIAL) / decided
            "avg_recovery_days": float,   # submitted_date → outcome_date
        }
    """
    try:
        cutoff = date.today() - timedelta(days=days)

        result = await db.execute(
            select(
                Appeal.outcome,
                func.count(Appeal.appeal_id).label("cnt"),
                func.coalesce(func.sum(Appeal.recovered_amount), 0).label("total_recovered"),
            )
            .where(Appeal.created_at >= cutoff)
            .group_by(Appeal.outcome)
        )
        rows = result.all()

        by_outcome: dict[str, int] = {}
        total_appeals = 0
        total_recovered = 0.0
        for outcome_val, cnt, recovered in rows:
            label = outcome_val or "PENDING"
            by_outcome[label] = cnt
            total_appeals += cnt
            total_recovered += float(recovered)

        decided = sum(
            by_outcome.get(o, 0) for o in ("WON", "LOST", "PARTIAL")
        )
        wins = by_outcome.get("WON", 0) + by_outcome.get("PARTIAL", 0)
        win_rate = (wins / decided * 100) if decided else 0.0

        # Average recovery time (days between submitted_date and outcome_date)
        avg_result = await db.execute(
            select(
                func.avg(
                    Appeal.outcome_date - Appeal.submitted_date
                ).label("avg_days")
            )
            .where(
                Appeal.created_at >= cutoff,
                Appeal.outcome_date.isnot(None),
                Appeal.submitted_date.isnot(None),
            )
        )
        avg_row = avg_result.scalar_one_or_none()
        avg_recovery_days = round(float(avg_row), 1) if avg_row else 0.0

        summary = {
            "status": "success",
            "period_days": days,
            "total_appeals": total_appeals,
            "by_outcome": by_outcome,
            "total_recovered": round(total_recovered, 2),
            "win_rate": round(win_rate, 2),
            "avg_recovery_days": avg_recovery_days,
        }

        logger.info("Outcome summary (%d days): %d appeals, %.1f%% win rate, $%.2f recovered",
                     days, total_appeals, win_rate, total_recovered)
        return summary

    except Exception as exc:
        logger.error("Failed to compute outcome summary: %s", exc)
        return {"status": "error", "message": str(exc)}


# ---------------------------------------------------------------------------
# get_prediction_accuracy
# ---------------------------------------------------------------------------

async def get_prediction_accuracy(db: AsyncSession, days: int = 90) -> dict:
    """
    Compare ML predictions stored in AutomationAction.trigger_data
    against the actual Appeal outcomes to compute accuracy metrics.

    trigger_data JSON is expected to contain:
        {"predicted_outcome": "WON" | "LOST", "confidence": 0.0-1.0, ...}

    Returns:
        {
            "total_predictions": int,
            "accuracy": float,
            "precision": float,
            "recall": float,
            "f1_score": float,
            "confidence_calibration": {...},
        }
    """
    try:
        cutoff = date.today() - timedelta(days=days)

        # Fetch automation actions that have trigger_data with predictions
        # and whose linked appeals have been resolved.
        action_result = await db.execute(
            select(AutomationAction).where(
                AutomationAction.created_at >= cutoff,
                AutomationAction.trigger_data.isnot(None),
                AutomationAction.outcome.isnot(None),
            )
        )
        actions = action_result.scalars().all()

        if not actions:
            return {
                "status": "success",
                "total_predictions": 0,
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "message": "No resolved predictions found in the given period.",
            }

        # Confusion matrix counters
        tp = fp = tn = fn = 0
        confidence_buckets: dict[str, dict] = {
            "high":   {"correct": 0, "total": 0},   # >= 0.8
            "medium": {"correct": 0, "total": 0},   # 0.5 – 0.79
            "low":    {"correct": 0, "total": 0},   # < 0.5
        }

        for action in actions:
            try:
                trigger = json.loads(action.trigger_data) if action.trigger_data else {}
            except (json.JSONDecodeError, TypeError):
                continue

            predicted = trigger.get("predicted_outcome", "").upper()
            if predicted not in ("WON", "LOST"):
                continue

            confidence = float(trigger.get("confidence", 0.5))

            # Derive actual from action.outcome string
            actual_outcome = action.outcome or ""
            if "WON" in actual_outcome.upper() or "APPROVED" in actual_outcome.upper():
                actual = "WON"
            elif "PARTIAL" in actual_outcome.upper():
                actual = "WON"  # partial counts as positive
            else:
                actual = "LOST"

            # Positive = WON prediction
            is_correct = predicted == actual
            if predicted == "WON" and actual == "WON":
                tp += 1
            elif predicted == "WON" and actual == "LOST":
                fp += 1
            elif predicted == "LOST" and actual == "LOST":
                tn += 1
            else:  # predicted LOST, actual WON
                fn += 1

            # Confidence calibration
            if confidence >= 0.8:
                bucket = "high"
            elif confidence >= 0.5:
                bucket = "medium"
            else:
                bucket = "low"
            confidence_buckets[bucket]["total"] += 1
            if is_correct:
                confidence_buckets[bucket]["correct"] += 1

        total = tp + fp + tn + fn
        accuracy = ((tp + tn) / total * 100) if total else 0.0
        precision = (tp / (tp + fp) * 100) if (tp + fp) else 0.0
        recall = (tp / (tp + fn) * 100) if (tp + fn) else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

        # Calibration rates per bucket
        calibration = {}
        for bucket, vals in confidence_buckets.items():
            calibration[bucket] = {
                "total": vals["total"],
                "correct": vals["correct"],
                "accuracy": round(vals["correct"] / vals["total"] * 100, 2) if vals["total"] else 0.0,
            }

        metrics = {
            "status": "success",
            "period_days": days,
            "total_predictions": total,
            "accuracy": round(accuracy, 2),
            "precision": round(precision, 2),
            "recall": round(recall, 2),
            "f1_score": round(f1, 2),
            "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
            "confidence_calibration": calibration,
        }

        logger.info(
            "Prediction accuracy (%d days): %d predictions, %.1f%% accuracy, "
            "%.1f%% precision, %.1f%% recall",
            days, total, accuracy, precision, recall,
        )
        return metrics

    except Exception as exc:
        logger.error("Failed to compute prediction accuracy: %s", exc)
        return {"status": "error", "message": str(exc)}
