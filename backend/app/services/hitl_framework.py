"""
Human-In-The-Loop (HITL) Framework — Sprint 18
================================================
Three-phase maturity model for automation rules:

  LEARNING     (0-30 days):   All actions require human approval.
  SUPERVISED   (31-90 days):  Auto-execute if confidence >= 90%.
  AUTONOMOUS   (91+ days):    Auto-execute if confidence >= rule threshold.

Functions:
  get_rule_maturity(db, rule_id) -> dict
  should_auto_execute(phase, confidence, rule_threshold) -> bool
  get_maturity_dashboard(db) -> list[dict]
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, func, case, text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Phase boundaries (days since first execution)
LEARNING_DAYS = 30
SUPERVISED_DAYS = 90

# Confidence thresholds per phase
SUPERVISED_AUTO_THRESHOLD = 90  # Supervised phase: auto-exec at >= 90%


def _determine_phase(days_active: int) -> str:
    """Determine the maturity phase based on days since first execution."""
    if days_active <= LEARNING_DAYS:
        return "LEARNING"
    elif days_active <= SUPERVISED_DAYS:
        return "SUPERVISED"
    else:
        return "AUTONOMOUS"


def should_auto_execute(
    phase: str,
    confidence: int,
    rule_threshold: int = 85,
) -> bool:
    """Decide whether an action should be auto-executed based on maturity phase.

    Args:
        phase: One of LEARNING, SUPERVISED, AUTONOMOUS.
        confidence: The confidence score of the suggestion (0-100).
        rule_threshold: The rule-specific threshold (used in AUTONOMOUS phase).

    Returns:
        True if the action can be auto-executed, False if it requires approval.
    """
    if phase == "LEARNING":
        # All actions require human approval during learning
        return False
    elif phase == "SUPERVISED":
        # Auto-execute only if confidence >= 90%
        return confidence >= SUPERVISED_AUTO_THRESHOLD
    elif phase == "AUTONOMOUS":
        # Auto-execute if confidence meets or exceeds the rule's own threshold
        return confidence >= rule_threshold
    else:
        # Unknown phase — default to requiring approval
        logger.warning("Unknown HITL phase '%s' — defaulting to require approval", phase)
        return False


async def get_rule_maturity(db: AsyncSession, rule_id: str) -> dict:
    """Get the maturity status for a specific automation rule.

    Calculates days active, total executions, and success rate from the
    automation_actions table.

    Args:
        db: Async database session.
        rule_id: The rule identifier to check maturity for.

    Returns:
        dict with phase, days_active, total_executions, success_rate,
        auto_execute_eligible, first_execution, last_execution.
    """
    try:
        result = await db.execute(text("""
            SELECT
                COUNT(*) AS total_executions,
                MIN(created_at) AS first_execution,
                MAX(created_at) AS last_execution,
                COUNT(*) FILTER (WHERE status = 'EXECUTED') AS successful_executions,
                COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_executions,
                COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_executions,
                COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_executions,
                COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected_executions
            FROM automation_actions
            WHERE rule_id = :rule_id
        """), {"rule_id": rule_id})

        row = result.first()

        if not row or row[0] == 0:
            return {
                "rule_id": rule_id,
                "phase": "LEARNING",
                "days_active": 0,
                "total_executions": 0,
                "success_rate": 0.0,
                "auto_execute_eligible": False,
                "first_execution": None,
                "last_execution": None,
                "successful_executions": 0,
                "failed_executions": 0,
                "pending_executions": 0,
            }

        total_executions = int(row[0])
        first_execution = row[1]
        last_execution = row[2]
        successful = int(row[3])
        failed = int(row[4])
        pending = int(row[5])
        approved = int(row[6])
        rejected = int(row[7])

        # Calculate days active from first execution
        if first_execution:
            if hasattr(first_execution, 'tzinfo') and first_execution.tzinfo is None:
                first_execution = first_execution.replace(tzinfo=timezone.utc)
            days_active = (datetime.now(timezone.utc) - first_execution).days
        else:
            days_active = 0

        phase = _determine_phase(days_active)

        # Success rate: successful / (successful + failed), ignoring pending
        completed = successful + failed
        success_rate = round(successful / completed * 100, 2) if completed > 0 else 0.0

        return {
            "rule_id": rule_id,
            "phase": phase,
            "days_active": days_active,
            "total_executions": total_executions,
            "success_rate": success_rate,
            "auto_execute_eligible": phase != "LEARNING",
            "first_execution": first_execution.isoformat() if first_execution else None,
            "last_execution": last_execution.isoformat() if last_execution else None,
            "successful_executions": successful,
            "failed_executions": failed,
            "pending_executions": pending,
            "approved_executions": approved,
            "rejected_executions": rejected,
        }

    except Exception as exc:
        logger.error("Failed to get rule maturity for %s: %s", rule_id, exc)
        return {
            "rule_id": rule_id,
            "phase": "LEARNING",
            "days_active": 0,
            "total_executions": 0,
            "success_rate": 0.0,
            "auto_execute_eligible": False,
            "error": str(exc),
        }


async def get_maturity_dashboard(db: AsyncSession) -> list:
    """Get maturity status for all rules that have automation actions.

    Returns a list of dicts, one per rule, with phase, days_active,
    total_executions, and success_rate.
    """
    try:
        result = await db.execute(text("""
            SELECT
                rule_id,
                rule_name,
                COUNT(*) AS total_executions,
                MIN(created_at) AS first_execution,
                MAX(created_at) AS last_execution,
                COUNT(*) FILTER (WHERE status = 'EXECUTED') AS successful_executions,
                COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_executions,
                COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_executions,
                AVG(confidence) AS avg_confidence,
                SUM(estimated_impact) AS total_impact
            FROM automation_actions
            GROUP BY rule_id, rule_name
            ORDER BY COUNT(*) DESC
        """))

        rows = result.all()
        dashboard = []

        for row in rows:
            rule_id = row[0]
            rule_name = row[1]
            total_executions = int(row[2])
            first_execution = row[3]
            last_execution = row[4]
            successful = int(row[5])
            failed = int(row[6])
            pending = int(row[7])
            avg_confidence = float(row[8] or 0)
            total_impact = float(row[9] or 0)

            # Calculate days active
            if first_execution:
                if hasattr(first_execution, 'tzinfo') and first_execution.tzinfo is None:
                    first_execution = first_execution.replace(tzinfo=timezone.utc)
                days_active = (datetime.now(timezone.utc) - first_execution).days
            else:
                days_active = 0

            phase = _determine_phase(days_active)

            completed = successful + failed
            success_rate = round(successful / completed * 100, 2) if completed > 0 else 0.0

            dashboard.append({
                "rule_id": rule_id,
                "rule_name": rule_name,
                "phase": phase,
                "days_active": days_active,
                "total_executions": total_executions,
                "success_rate": success_rate,
                "auto_execute_eligible": phase != "LEARNING",
                "successful_executions": successful,
                "failed_executions": failed,
                "pending_executions": pending,
                "avg_confidence": round(avg_confidence, 1),
                "total_impact": round(total_impact, 2),
                "first_execution": first_execution.isoformat() if first_execution else None,
                "last_execution": last_execution.isoformat() if last_execution else None,
            })

        return dashboard

    except Exception as exc:
        logger.error("Failed to build maturity dashboard: %s", exc)
        return []
