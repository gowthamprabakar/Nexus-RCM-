"""
Automation Engine -- Connects diagnostics to actions
======================================================
When a diagnostic finding fires, matching automation rules execute.
Rules are evaluated against current diagnostic findings and root cause data.
"""

import json
import logging
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional

from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.automation import AutomationAction
from app.models.root_cause import RootCauseAnalysis
from app.models.denial import Denial
from app.models.claim import Claim
from app.models.payer import Payer
from app.services.diagnostic_service import generate_system_diagnostics

logger = logging.getLogger(__name__)


def _gen_action_id() -> str:
    return f"ACT-{uuid4().hex[:8].upper()}"


# ---------------------------------------------------------------------------
# Rule definitions
# ---------------------------------------------------------------------------

AUTOMATION_RULES = [
    {
        "rule_id": "AUTO-001",
        "name": "Auto-categorize denials",
        "trigger": "diagnostic_finding",
        "condition": {"category": "DENIAL_PATTERN", "min_confidence": 80},
        "action_template": "Auto-categorize {count} denials for root cause: {root_cause}",
        "enabled": True,
        "requires_approval": False,
    },
    {
        "rule_id": "AUTO-002",
        "name": "Auto-appeal clusters",
        "trigger": "root_cause_cluster",
        "condition": {"min_count": 5, "min_win_rate": 70},
        "action_template": "Generate batch appeal for {count} {root_cause} denials ({payer})",
        "enabled": True,
        "requires_approval": True,
    },
    {
        "rule_id": "AUTO-003",
        "name": "Auto-post ERA payments",
        "trigger": "diagnostic_finding",
        "condition": {"category": "PAYMENT_FLOW", "min_confidence": 95},
        "action_template": "Auto-post ERA payments for {payer} (${impact:,.0f})",
        "enabled": True,
        "requires_approval": False,
    },
    {
        "rule_id": "AUTO-004",
        "name": "Auto-prioritize collections",
        "trigger": "diagnostic_finding",
        "condition": {"category": "AR_AGING", "min_confidence": 70},
        "action_template": "Re-prioritize {count} aged claims for collection follow-up",
        "enabled": True,
        "requires_approval": False,
    },
    {
        "rule_id": "AUTO-005",
        "name": "Auto-flag underpayments",
        "trigger": "diagnostic_finding",
        "condition": {"category": "REVENUE_LEAKAGE", "min_confidence": 80},
        "action_template": "Flag underpayment variance for {payer}: ${impact:,.0f}",
        "enabled": True,
        "requires_approval": True,
    },
    {
        "rule_id": "AUTO-006",
        "name": "Auto-hold high-risk claims",
        "trigger": "threshold_breach",
        "condition": {"metric": "crs_score", "threshold": 60, "direction": "below"},
        "action_template": "Hold {count} high-risk claims (CRS < 60) for review",
        "enabled": False,
        "requires_approval": True,
    },
    {
        "rule_id": "AUTO-007",
        "name": "Payer behavior alert",
        "trigger": "diagnostic_finding",
        "condition": {"category": "PAYER_BEHAVIOR", "min_confidence": 60},
        "action_template": "Alert: {payer} denial rate spike ({detail})",
        "enabled": True,
        "requires_approval": True,
    },
    # ---- NEW RULES (AUTO-008 through AUTO-015) ----
    {
        "rule_id": "AUTO-008",
        "name": "Auto-resubmit rejected claims",
        "trigger": "claim_status",
        "condition": {"status": "REJECTED", "fixable": True, "min_crs_confidence": 85},
        "action_template": "Flag {count} rejected claims for resubmission after auto-fix (CRS confidence > 85%)",
        "enabled": True,
        "requires_approval": False,
    },
    {
        "rule_id": "AUTO-009",
        "name": "Timely filing escalation",
        "trigger": "filing_deadline",
        "condition": {"max_days_from_dos": 75, "min_days_remaining": 15},
        "action_template": "Escalate {count} claims approaching filing deadline to supervisor queue ({detail})",
        "enabled": True,
        "requires_approval": False,
    },
    {
        "rule_id": "AUTO-010",
        "name": "Auth expiry warning",
        "trigger": "auth_expiry",
        "condition": {"expiry_window_days": 14},
        "action_template": "Generate auth renewal request for {count} claims with prior auth expiring within 14 days",
        "enabled": True,
        "requires_approval": True,
    },
    {
        "rule_id": "AUTO-011",
        "name": "Eligibility re-verification",
        "trigger": "eligibility_stale",
        "condition": {"stale_hours": 48},
        "action_template": "Trigger 270/271 eligibility re-verification for {count} claims (last check > 48h before DOS)",
        "enabled": True,
        "requires_approval": False,
    },
    {
        "rule_id": "AUTO-012",
        "name": "Duplicate claim detection",
        "trigger": "duplicate_claim",
        "condition": {"match_fields": ["patient_id", "date_of_service", "payer_id", "charge_amount"]},
        "action_template": "Hold {count} duplicate claims for review (same patient + DOS + payer + charges)",
        "enabled": True,
        "requires_approval": False,
    },
    {
        "rule_id": "AUTO-013",
        "name": "COB coordination fix",
        "trigger": "diagnostic_finding",
        "condition": {"category": "DENIAL_PATTERN", "carc_code": "CO-22", "min_confidence": 60},
        "action_template": "Auto-route {count} COB-related denials (CARC CO-22) to COB specialist queue",
        "enabled": True,
        "requires_approval": False,
    },
    {
        "rule_id": "AUTO-014",
        "name": "Contract rate dispute",
        "trigger": "diagnostic_finding",
        "condition": {"category": "REVENUE_LEAKAGE", "min_confidence": 80, "rate_threshold_pct": 95},
        "action_template": "Generate underpayment dispute letter for {payer}: payment < 95% of contracted rate (${impact:,.0f})",
        "enabled": True,
        "requires_approval": True,
    },
    {
        "rule_id": "AUTO-015",
        "name": "Provider enrollment alert",
        "trigger": "diagnostic_finding",
        "condition": {"category": "DENIAL_PATTERN", "provider_related": True, "min_confidence": 60},
        "action_template": "Flag provider enrollment status check for {count} provider-related denials ({detail})",
        "enabled": True,
        "requires_approval": True,
    },
]

# Convenience alias so callers can import as RULES
RULES = AUTOMATION_RULES


# ---------------------------------------------------------------------------
# Rule evaluation
# ---------------------------------------------------------------------------

async def evaluate_rules(db: AsyncSession) -> list:
    """
    Evaluate all enabled rules against current diagnostic findings and root cause data.
    Returns list of triggered actions (pending approval or auto-executed).
    """
    triggered = []

    try:
        diagnostics = await generate_system_diagnostics(db)
        findings = diagnostics.get("findings", [])
    except Exception as e:
        logger.error(f"Failed to generate diagnostics for rule evaluation: {e}")
        findings = []

    for rule in AUTOMATION_RULES:
        if not rule["enabled"]:
            continue

        try:
            if rule["trigger"] == "diagnostic_finding":
                matched = _match_diagnostic_findings(rule, findings)
                for finding in matched:
                    action = await _create_action_from_finding(db, rule, finding)
                    if action:
                        triggered.append(action)

            elif rule["trigger"] == "root_cause_cluster":
                clusters = await _find_root_cause_clusters(db, rule)
                for cluster in clusters:
                    action = await _create_action_from_cluster(db, rule, cluster)
                    if action:
                        triggered.append(action)

            elif rule["trigger"] == "threshold_breach":
                breaches = await _find_threshold_breaches(db, rule)
                for breach in breaches:
                    action = await _create_action_from_breach(db, rule, breach)
                    if action:
                        triggered.append(action)

            elif rule["trigger"] == "claim_status":
                # AUTO-008: Find rejected claims with fixable CRS issues
                hits = await _find_rejected_fixable_claims(db, rule)
                for hit in hits:
                    action = await _create_action_from_finding(db, rule, hit)
                    if action:
                        triggered.append(action)

            elif rule["trigger"] == "filing_deadline":
                # AUTO-009: Claims approaching payer filing deadline
                hits = await _find_filing_deadline_claims(db, rule)
                for hit in hits:
                    action = await _create_action_from_finding(db, rule, hit)
                    if action:
                        triggered.append(action)

            elif rule["trigger"] == "auth_expiry":
                # AUTO-010: Claims with prior auth expiring soon
                hits = await _find_auth_expiry_claims(db, rule)
                for hit in hits:
                    action = await _create_action_from_finding(db, rule, hit)
                    if action:
                        triggered.append(action)

            elif rule["trigger"] == "eligibility_stale":
                # AUTO-011: Claims with stale eligibility checks
                hits = await _find_stale_eligibility_claims(db, rule)
                for hit in hits:
                    action = await _create_action_from_finding(db, rule, hit)
                    if action:
                        triggered.append(action)

            elif rule["trigger"] == "duplicate_claim":
                # AUTO-012: Duplicate claim detection
                hits = await _find_duplicate_claims(db, rule)
                for hit in hits:
                    action = await _create_action_from_finding(db, rule, hit)
                    if action:
                        triggered.append(action)

        except Exception as e:
            logger.error(f"Rule {rule['rule_id']} evaluation failed: {e}")

    return triggered


def _match_diagnostic_findings(rule: dict, findings: list) -> list:
    """Match diagnostic findings against rule conditions."""
    matched = []
    condition = rule["condition"]
    required_category = condition.get("category")
    min_confidence = condition.get("min_confidence", 0)
    carc_code = condition.get("carc_code")
    provider_related = condition.get("provider_related", False)
    rate_threshold_pct = condition.get("rate_threshold_pct")

    for finding in findings:
        if required_category and finding.get("category") != required_category:
            continue
        if finding.get("confidence_score", 0) < min_confidence:
            continue

        metadata = finding.get("metadata", {})

        # AUTO-013: filter by CARC code (e.g. CO-22 for COB)
        if carc_code:
            finding_carc = metadata.get("carc_code") or finding.get("carc_code", "")
            root_causes = finding.get("root_causes", [])
            if carc_code not in finding_carc and not any(carc_code in rc for rc in root_causes):
                continue

        # AUTO-014: filter by contract rate threshold
        if rate_threshold_pct:
            pct = metadata.get("payment_rate_pct", 100)
            if pct >= rate_threshold_pct:
                continue

        # AUTO-015: filter for provider-related denial codes
        if provider_related:
            root_causes = finding.get("root_causes", [])
            provider_keywords = ["provider", "enrollment", "credential", "NPI", "taxonomy"]
            if not any(kw.lower() in " ".join(root_causes).lower() for kw in provider_keywords):
                if not any(kw.lower() in finding.get("title", "").lower() for kw in provider_keywords):
                    continue

        matched.append(finding)

    return matched


async def _find_root_cause_clusters(db: AsyncSession, rule: dict) -> list:
    """Find clusters of denials with the same root cause that exceed thresholds."""
    condition = rule["condition"]
    min_count = condition.get("min_count", 5)

    try:
        stmt = (
            select(
                RootCauseAnalysis.primary_root_cause,
                RootCauseAnalysis.payer_id,
                func.count(RootCauseAnalysis.rca_id).label("cnt"),
                func.sum(RootCauseAnalysis.financial_impact).label("total_impact"),
                func.avg(RootCauseAnalysis.confidence_score).label("avg_conf"),
            )
            .group_by(RootCauseAnalysis.primary_root_cause, RootCauseAnalysis.payer_id)
            .having(func.count(RootCauseAnalysis.rca_id) >= min_count)
            .order_by(desc("total_impact"))
        )

        rows = await db.execute(stmt)
        clusters = []
        for r in rows:
            # Get payer name
            payer = await db.get(Payer, r.payer_id)
            payer_name = payer.payer_name if payer else r.payer_id

            # Check payer appeal win rate
            win_rate = payer.avg_appeal_win_rate if payer and payer.avg_appeal_win_rate else 0
            min_win = condition.get("min_win_rate", 0)
            if win_rate < min_win:
                continue

            clusters.append({
                "root_cause": r.primary_root_cause,
                "payer_id": r.payer_id,
                "payer_name": payer_name,
                "count": r.cnt,
                "total_impact": float(r.total_impact or 0),
                "avg_confidence": float(r.avg_conf or 0),
                "win_rate": win_rate,
            })

        return clusters

    except Exception as e:
        logger.error(f"Root cause cluster search failed: {e}")
        return []


async def _find_threshold_breaches(db: AsyncSession, rule: dict) -> list:
    """Find threshold breaches (e.g., CRS < 60)."""
    # For now, return empty since threshold breaches require specific metric checks
    return []


async def _find_rejected_fixable_claims(db: AsyncSession, rule: dict) -> list:
    """AUTO-008: Find rejected/denied claims with fixable CRS issues (confidence > 85%)."""
    condition = rule["condition"]
    min_confidence = condition.get("min_crs_confidence", 85)
    try:
        stmt = (
            select(
                Denial.denial_id,
                Denial.claim_id,
                Claim.payer_id,
                Denial.denial_amount,
                RootCauseAnalysis.confidence_score,
                RootCauseAnalysis.primary_root_cause,
            )
            .join(Claim, Claim.claim_id == Denial.claim_id)
            .join(RootCauseAnalysis, RootCauseAnalysis.denial_id == Denial.denial_id, isouter=True)
            .where(
                and_(
                    RootCauseAnalysis.confidence_score >= min_confidence,
                )
            )
        )
        rows = await db.execute(stmt)
        results = rows.all()
        if not results:
            return []

        total_impact = sum(float(r.denial_amount or 0) for r in results)
        return [{
            "finding_id": "auto008-rejected-fixable",
            "title": f"{len(results)} denied claims with fixable root causes",
            "category": "CLAIM_RESUBMISSION",
            "severity": "HIGH",
            "confidence_score": int(sum(r.confidence_score for r in results) / len(results)),
            "affected_claims_count": len(results),
            "impact_amount": total_impact,
            "root_causes": list(set(r.primary_root_cause for r in results if r.primary_root_cause)),
            "metadata": {},
        }]
    except Exception as e:
        logger.error(f"_find_rejected_fixable_claims failed: {e}")
        return []


async def _find_filing_deadline_claims(db: AsyncSession, rule: dict) -> list:
    """AUTO-009: Find denials where the original claim DOS is approaching filing deadline."""
    try:
        from datetime import timedelta
        condition = rule["condition"]
        max_days = condition.get("max_days_from_dos", 75)
        min_remaining = condition.get("min_days_remaining", 15)
        now = datetime.now(timezone.utc)
        cutoff_start = now - timedelta(days=max_days)
        cutoff_end = now - timedelta(days=max_days - min_remaining)

        stmt = (
            select(
                Denial.denial_id,
                Denial.claim_id,
                Claim.payer_id,
                Denial.denial_amount,
                Claim.date_of_service,
            )
            .join(Claim, Claim.claim_id == Denial.claim_id)
            .where(
                and_(
                    Claim.date_of_service.isnot(None),
                    Claim.date_of_service >= cutoff_start,
                    Claim.date_of_service <= cutoff_end,
                )
            )
        )
        rows = await db.execute(stmt)
        results = rows.all()
        if not results:
            return []

        total_impact = sum(float(r.denial_amount or 0) for r in results)
        return [{
            "finding_id": "auto009-filing-deadline",
            "title": f"{len(results)} claims approaching filing deadline",
            "category": "FILING_DEADLINE",
            "severity": "CRITICAL",
            "confidence_score": 95,
            "affected_claims_count": len(results),
            "impact_amount": total_impact,
            "root_causes": ["Timely filing risk"],
            "metadata": {"days_threshold": max_days, "remaining_days": min_remaining},
        }]
    except Exception as e:
        logger.error(f"_find_filing_deadline_claims failed: {e}")
        return []


async def _find_auth_expiry_claims(db: AsyncSession, rule: dict) -> list:
    """AUTO-010: Find claims with prior auth expiring within N days."""
    # Returns empty list -- requires auth data table not yet modeled;
    # structure is in place for when auth tracking is added.
    logger.debug("AUTO-010 auth_expiry trigger: no auth tracking table yet; returning []")
    return []


async def _find_stale_eligibility_claims(db: AsyncSession, rule: dict) -> list:
    """AUTO-011: Find claims where last eligibility check is stale (>48h before DOS)."""
    # Returns empty list -- requires eligibility_check table not yet modeled;
    # structure is in place for when 270/271 tracking is added.
    logger.debug("AUTO-011 eligibility_stale trigger: no eligibility table yet; returning []")
    return []


async def _find_duplicate_claims(db: AsyncSession, rule: dict) -> list:
    """AUTO-012: Detect duplicate denials (same patient + DOS + payer + amount)."""
    try:
        stmt = (
            select(
                Claim.patient_id,
                Claim.date_of_service,
                Claim.payer_id,
                Denial.denial_amount,
                func.count(Denial.denial_id).label("cnt"),
                func.sum(Denial.denial_amount).label("total_billed"),
            )
            .join(Claim, Claim.claim_id == Denial.claim_id)
            .where(
                and_(
                    Claim.patient_id.isnot(None),
                    Claim.date_of_service.isnot(None),
                )
            )
            .group_by(
                Claim.patient_id,
                Claim.date_of_service,
                Claim.payer_id,
                Denial.denial_amount,
            )
            .having(func.count(Denial.denial_id) > 1)
        )
        rows = await db.execute(stmt)
        results = rows.all()
        if not results:
            return []

        dup_count = sum(r.cnt for r in results)
        total_impact = sum(float(r.total_billed or 0) for r in results)
        return [{
            "finding_id": f"auto012-duplicates",
            "title": f"{dup_count} potential duplicate claims detected",
            "category": "DUPLICATE_CLAIM",
            "severity": "HIGH",
            "confidence_score": 90,
            "affected_claims_count": dup_count,
            "impact_amount": total_impact,
            "root_causes": ["Duplicate submission"],
            "metadata": {"duplicate_groups": len(results)},
        }]
    except Exception as e:
        logger.error(f"_find_duplicate_claims failed: {e}")
        return []


async def _create_action_from_finding(db: AsyncSession, rule: dict, finding: dict) -> Optional[dict]:
    """Create an automation action from a diagnostic finding."""
    try:
        # Check for duplicate (same rule + same finding title already pending)
        existing = await db.execute(
            select(AutomationAction)
            .where(
                and_(
                    AutomationAction.rule_id == rule["rule_id"],
                    AutomationAction.status.in_(["PENDING", "EXECUTED"]),
                    AutomationAction.suggested_action.contains(finding.get("title", "")[:50]),
                )
            )
            .limit(1)
        )
        if existing.scalars().first():
            return None

        metadata = finding.get("metadata", {})
        action_text = rule["action_template"].format(
            count=finding.get("affected_claims_count", 0),
            root_cause=", ".join(finding.get("root_causes", ["Unknown"])),
            payer=metadata.get("payer_name", "Unknown"),
            impact=finding.get("impact_amount", 0),
            detail=finding.get("title", ""),
        )

        action_id = _gen_action_id()
        status = "PENDING" if rule["requires_approval"] else "EXECUTED"

        action = AutomationAction(
            action_id=action_id,
            rule_id=rule["rule_id"],
            rule_name=rule["name"],
            trigger_type="diagnostic_finding",
            trigger_data=json.dumps({
                "finding_id": finding.get("finding_id"),
                "title": finding.get("title"),
                "category": finding.get("category"),
                "severity": finding.get("severity"),
            }),
            suggested_action=action_text[:500],
            affected_claims=finding.get("affected_claims_count", 0),
            estimated_impact=round(finding.get("impact_amount", 0), 2),
            confidence=finding.get("confidence_score", 0),
            status=status,
            executed_at=datetime.now(timezone.utc) if status == "EXECUTED" else None,
            outcome="Auto-executed" if status == "EXECUTED" else None,
        )

        db.add(action)

        return {
            "action_id": action_id,
            "rule_id": rule["rule_id"],
            "rule_name": rule["name"],
            "suggested_action": action_text[:500],
            "status": status,
            "affected_claims": finding.get("affected_claims_count", 0),
            "estimated_impact": round(finding.get("impact_amount", 0), 2),
            "confidence": finding.get("confidence_score", 0),
        }

    except Exception as e:
        logger.error(f"Failed to create action from finding: {e}")
        return None


async def _create_action_from_cluster(db: AsyncSession, rule: dict, cluster: dict) -> Optional[dict]:
    """Create an automation action from a root cause cluster."""
    try:
        # Check for duplicate
        existing = await db.execute(
            select(AutomationAction)
            .where(
                and_(
                    AutomationAction.rule_id == rule["rule_id"],
                    AutomationAction.status.in_(["PENDING", "EXECUTED"]),
                    AutomationAction.suggested_action.contains(cluster["root_cause"][:30]),
                )
            )
            .limit(1)
        )
        if existing.scalars().first():
            return None

        action_text = rule["action_template"].format(
            count=cluster["count"],
            root_cause=cluster["root_cause"],
            payer=cluster["payer_name"],
            impact=cluster["total_impact"],
        )

        action_id = _gen_action_id()

        action = AutomationAction(
            action_id=action_id,
            rule_id=rule["rule_id"],
            rule_name=rule["name"],
            trigger_type="root_cause_cluster",
            trigger_data=json.dumps({
                "root_cause": cluster["root_cause"],
                "payer_id": cluster["payer_id"],
                "payer_name": cluster["payer_name"],
                "count": cluster["count"],
                "win_rate": cluster["win_rate"],
            }),
            suggested_action=action_text[:500],
            affected_claims=cluster["count"],
            estimated_impact=round(cluster["total_impact"], 2),
            confidence=int(cluster["avg_confidence"]),
            status="PENDING",
        )

        db.add(action)

        return {
            "action_id": action_id,
            "rule_id": rule["rule_id"],
            "rule_name": rule["name"],
            "suggested_action": action_text[:500],
            "status": "PENDING",
            "affected_claims": cluster["count"],
            "estimated_impact": round(cluster["total_impact"], 2),
            "confidence": int(cluster["avg_confidence"]),
        }

    except Exception as e:
        logger.error(f"Failed to create action from cluster: {e}")
        return None


async def _create_action_from_breach(db: AsyncSession, rule: dict, breach: dict) -> Optional[dict]:
    """Create an automation action from a threshold breach."""
    return None  # Placeholder for future implementation


# ---------------------------------------------------------------------------
# Action management
# ---------------------------------------------------------------------------

async def execute_action(db: AsyncSession, action_id: str) -> dict:
    """Execute an approved automation action via the real action executor."""
    try:
        action = await db.get(AutomationAction, action_id)
        if not action:
            return {"error": "Action not found"}

        if action.status != "APPROVED":
            return {"error": f"Action is {action.status}, must be APPROVED to execute"}

        # Dispatch to the real action executor
        from app.services.action_executor import execute_real_action
        result = await execute_real_action(db, action)
        await db.flush()

        return {
            "action_id": action_id,
            "rule_id": action.rule_id,
            "status": action.status,
            "executed_at": str(action.executed_at) if action.executed_at else None,
            "outcome": action.outcome,
            "details": result.get("details", {}),
        }

    except Exception as e:
        logger.error(f"execute_action failed for {action_id}: {e}")
        return {"error": str(e)}


async def get_pending_approvals(db: AsyncSession) -> list:
    """Get all triggered actions waiting for human approval."""
    try:
        stmt = (
            select(AutomationAction)
            .where(AutomationAction.status == "PENDING")
            .order_by(desc(AutomationAction.estimated_impact))
        )
        rows = await db.execute(stmt)
        actions = rows.scalars().all()

        return [
            {
                "action_id": a.action_id,
                "rule_id": a.rule_id,
                "rule_name": a.rule_name,
                "trigger_type": a.trigger_type,
                "trigger_data": json.loads(a.trigger_data) if a.trigger_data else None,
                "suggested_action": a.suggested_action,
                "affected_claims": a.affected_claims,
                "estimated_impact": float(a.estimated_impact or 0),
                "confidence": a.confidence,
                "created_at": str(a.created_at) if a.created_at else None,
            }
            for a in actions
        ]

    except Exception as e:
        logger.error(f"get_pending_approvals failed: {e}")
        return []


async def approve_action(db: AsyncSession, action_id: str, approved_by: str) -> dict:
    """Approve a pending action for execution."""
    try:
        action = await db.get(AutomationAction, action_id)
        if not action:
            return {"error": "Action not found"}

        if action.status != "PENDING":
            return {"error": f"Action is {action.status}, cannot approve"}

        action.status = "APPROVED"
        action.approved_by = approved_by
        await db.flush()

        # Auto-execute after approval
        result = await execute_action(db, action_id)
        return result

    except Exception as e:
        logger.error(f"approve_action failed for {action_id}: {e}")
        return {"error": str(e)}


async def reject_action(db: AsyncSession, action_id: str, rejected_by: str) -> dict:
    """Reject a pending action."""
    try:
        action = await db.get(AutomationAction, action_id)
        if not action:
            return {"error": "Action not found"}

        if action.status != "PENDING":
            return {"error": f"Action is {action.status}, cannot reject"}

        action.status = "REJECTED"
        action.approved_by = rejected_by
        action.outcome = f"Rejected by {rejected_by}"
        await db.flush()

        return {"action_id": action_id, "status": "REJECTED"}

    except Exception as e:
        logger.error(f"reject_action failed for {action_id}: {e}")
        return {"error": str(e)}


async def get_audit_trail(db: AsyncSession, limit: int = 50) -> list:
    """Get recent automation actions with outcomes."""
    try:
        stmt = (
            select(AutomationAction)
            .where(AutomationAction.status.in_(["EXECUTED", "REJECTED", "FAILED"]))
            .order_by(desc(AutomationAction.created_at))
            .limit(limit)
        )
        rows = await db.execute(stmt)
        actions = rows.scalars().all()

        return [
            {
                "action_id": a.action_id,
                "rule_id": a.rule_id,
                "rule_name": a.rule_name,
                "trigger_type": a.trigger_type,
                "suggested_action": a.suggested_action,
                "affected_claims": a.affected_claims,
                "estimated_impact": float(a.estimated_impact or 0),
                "confidence": a.confidence,
                "status": a.status,
                "approved_by": a.approved_by,
                "executed_at": str(a.executed_at) if a.executed_at else None,
                "outcome": a.outcome,
                "created_at": str(a.created_at) if a.created_at else None,
            }
            for a in actions
        ]

    except Exception as e:
        logger.error(f"get_audit_trail failed: {e}")
        return []


async def get_rules(db: AsyncSession) -> list:
    """Get all automation rules with their current status and stats."""
    rules_with_stats = []

    for rule in AUTOMATION_RULES:
        try:
            # Count actions for this rule
            total_actions = await db.scalar(
                select(func.count(AutomationAction.action_id))
                .where(AutomationAction.rule_id == rule["rule_id"])
            ) or 0

            executed_count = await db.scalar(
                select(func.count(AutomationAction.action_id))
                .where(
                    and_(
                        AutomationAction.rule_id == rule["rule_id"],
                        AutomationAction.status == "EXECUTED",
                    )
                )
            ) or 0

            pending_count = await db.scalar(
                select(func.count(AutomationAction.action_id))
                .where(
                    and_(
                        AutomationAction.rule_id == rule["rule_id"],
                        AutomationAction.status == "PENDING",
                    )
                )
            ) or 0

            # Last triggered
            last_action = await db.execute(
                select(AutomationAction.created_at)
                .where(AutomationAction.rule_id == rule["rule_id"])
                .order_by(desc(AutomationAction.created_at))
                .limit(1)
            )
            last_row = last_action.scalar()

            success_rate = round(executed_count / total_actions * 100, 1) if total_actions > 0 else 0

            rules_with_stats.append({
                "rule_id": rule["rule_id"],
                "name": rule["name"],
                "trigger": rule["trigger"],
                "condition": rule["condition"],
                "enabled": rule["enabled"],
                "requires_approval": rule["requires_approval"],
                "total_actions": total_actions,
                "executed_count": executed_count,
                "pending_count": pending_count,
                "success_rate": success_rate,
                "last_triggered": str(last_row) if last_row else None,
            })

        except Exception as e:
            logger.error(f"Failed to get stats for rule {rule['rule_id']}: {e}")
            rules_with_stats.append({
                "rule_id": rule["rule_id"],
                "name": rule["name"],
                "trigger": rule["trigger"],
                "condition": rule["condition"],
                "enabled": rule["enabled"],
                "requires_approval": rule["requires_approval"],
                "total_actions": 0,
                "executed_count": 0,
                "pending_count": 0,
                "success_rate": 0,
                "last_triggered": None,
            })

    return rules_with_stats


async def toggle_rule(db: AsyncSession, rule_id: str, enabled: bool) -> dict:
    """Enable or disable an automation rule."""
    for rule in AUTOMATION_RULES:
        if rule["rule_id"] == rule_id:
            rule["enabled"] = enabled
            return {
                "rule_id": rule_id,
                "name": rule["name"],
                "enabled": enabled,
            }

    return {"error": f"Rule {rule_id} not found"}
