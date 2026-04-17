"""
Automation Rules CRUD — Sprint Q Track D (D3)
================================================
POST   /automation/rules                  — create a new rule
PATCH  /automation/rules/{rule_id}        — edit a rule
DELETE /automation/rules/{rule_id}        — soft-delete a rule (enabled=false, deleted=true)
POST   /automation/rules/{rule_id}/test   — dry-run: evaluate condition against 30 days of data
GET    /automation/rules/{rule_id}/history — per-rule execution history grouped by day
GET    /automation/rules/db               — list DB-backed rules (mirrors /automation/rules)

The hardcoded AUTOMATION_RULES list in automation_engine.py remains authoritative
for rule evaluation today; DB-backed rules are additive and will be promoted to
the evaluator in a future sprint.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_, desc, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.automation import AutomationAction
from app.models.prevent_persistence import AutomationRule

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class RuleCreate(BaseModel):
    rule_id: str = Field(..., max_length=40)
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    trigger_type: str = Field(..., max_length=40)
    condition: dict[str, Any] = Field(default_factory=dict)
    action_template: dict[str, Any] = Field(default_factory=dict)
    enabled: bool = True
    requires_approval: bool = True
    created_by: Optional[str] = "system"


class RulePatch(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    condition: Optional[dict[str, Any]] = None
    action_template: Optional[dict[str, Any]] = None
    enabled: Optional[bool] = None
    requires_approval: Optional[bool] = None
    updated_by: Optional[str] = "system"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _serialize_rule(r: AutomationRule) -> dict:
    return {
        "rule_id": r.rule_id,
        "name": r.name,
        "description": r.description,
        "trigger_type": r.trigger_type,
        "condition": r.condition or {},
        "action_template": r.action_template or {},
        "enabled": bool(r.enabled),
        "requires_approval": bool(r.requires_approval),
        "deleted": bool(r.deleted),
        "created_by": r.created_by,
        "updated_by": r.updated_by,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


# ---------------------------------------------------------------------------
# GET /automation/rules/db  — list DB-backed rules (excluded: deleted)
# ---------------------------------------------------------------------------
@router.get("/automation/rules/db")
async def list_db_rules(
    include_deleted: bool = Query(False),
    enabled_only: bool = Query(False),
    trigger_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AutomationRule)
    if not include_deleted:
        stmt = stmt.where(AutomationRule.deleted == False)  # noqa: E712
    if enabled_only:
        stmt = stmt.where(AutomationRule.enabled == True)   # noqa: E712
    if trigger_type:
        stmt = stmt.where(AutomationRule.trigger_type == trigger_type)
    stmt = stmt.order_by(AutomationRule.rule_id)
    rows = (await db.execute(stmt)).scalars().all()
    return [_serialize_rule(r) for r in rows]


# ---------------------------------------------------------------------------
# POST /automation/rules  — create
# ---------------------------------------------------------------------------
@router.post("/automation/rules", status_code=201)
async def create_rule(payload: RuleCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(AutomationRule, payload.rule_id)
    if existing and not existing.deleted:
        raise HTTPException(status_code=409, detail=f"Rule {payload.rule_id} already exists")

    if existing and existing.deleted:
        # Re-activate a soft-deleted rule: overwrite
        existing.name = payload.name
        existing.description = payload.description
        existing.trigger_type = payload.trigger_type
        existing.condition = payload.condition
        existing.action_template = payload.action_template
        existing.enabled = payload.enabled
        existing.requires_approval = payload.requires_approval
        existing.deleted = False
        existing.updated_by = payload.created_by
        rule = existing
    else:
        rule = AutomationRule(
            rule_id=payload.rule_id,
            name=payload.name,
            description=payload.description,
            trigger_type=payload.trigger_type,
            condition=payload.condition,
            action_template=payload.action_template,
            enabled=payload.enabled,
            requires_approval=payload.requires_approval,
            deleted=False,
            created_by=payload.created_by,
            updated_by=payload.created_by,
        )
        db.add(rule)

    await db.commit()
    await db.refresh(rule)
    return _serialize_rule(rule)


# ---------------------------------------------------------------------------
# PATCH /automation/rules/{rule_id}  — edit
# ---------------------------------------------------------------------------
@router.patch("/automation/rules/{rule_id}")
async def patch_rule(
    rule_id: str, payload: RulePatch, db: AsyncSession = Depends(get_db)
):
    rule = await db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    if rule.deleted:
        raise HTTPException(status_code=410, detail=f"Rule {rule_id} is soft-deleted")

    patch = payload.dict(exclude_unset=True, exclude_none=False)
    # Never allow changing rule_id / created_at / created_by through PATCH
    for forbidden in ("rule_id", "created_at", "created_by"):
        patch.pop(forbidden, None)

    for key, value in patch.items():
        setattr(rule, key, value)

    rule.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(rule)
    return _serialize_rule(rule)


# ---------------------------------------------------------------------------
# DELETE /automation/rules/{rule_id}  — soft-delete
# ---------------------------------------------------------------------------
@router.delete("/automation/rules/{rule_id}")
async def delete_rule(
    rule_id: str,
    deleted_by: str = Query("system"),
    db: AsyncSession = Depends(get_db),
):
    rule = await db.get(AutomationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")

    rule.enabled = False
    rule.deleted = True
    rule.updated_by = deleted_by
    rule.updated_at = datetime.utcnow()
    await db.commit()
    return {
        "rule_id": rule_id,
        "status": "deleted",
        "enabled": False,
        "deleted": True,
        "deleted_by": deleted_by,
    }


# ---------------------------------------------------------------------------
# POST /automation/rules/{rule_id}/test  — dry-run condition against 30d data
# ---------------------------------------------------------------------------
@router.post("/automation/rules/{rule_id}/test")
async def test_rule(
    rule_id: str,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Dry-run the rule's condition against the last N days of data.

    Does NOT create ``automation_actions`` rows. Returns match count + a handful
    of samples so operators can sanity-check their condition JSON.
    """
    rule = await db.get(AutomationRule, rule_id)
    if rule and rule.deleted:
        raise HTTPException(status_code=410, detail=f"Rule {rule_id} is soft-deleted")

    # If no DB-backed rule, fall back to the hardcoded list so existing AUTO-xxx
    # rules can still be tested.
    rule_dict: dict[str, Any]
    if rule:
        rule_dict = {
            "rule_id": rule.rule_id,
            "name": rule.name,
            "trigger": rule.trigger_type,
            "condition": rule.condition or {},
            "action_template": rule.action_template or {},
            "enabled": rule.enabled,
            "requires_approval": rule.requires_approval,
        }
    else:
        from app.services.automation_engine import AUTOMATION_RULES
        match = next((r for r in AUTOMATION_RULES if r["rule_id"] == rule_id), None)
        if not match:
            raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
        rule_dict = dict(match)

    # Import evaluator helpers inline to avoid circular imports at module level
    from app.services.automation_engine import (
        _match_diagnostic_findings,
        _find_root_cause_clusters,
        _find_threshold_breaches,
        _find_rejected_fixable_claims,
        _find_filing_deadline_claims,
        _find_auth_expiry_claims,
        _find_stale_eligibility_claims,
        _find_duplicate_claims,
    )
    from app.services.diagnostic_service import generate_system_diagnostics

    trigger = rule_dict.get("trigger") or rule_dict.get("trigger_type")
    matches: list[dict] = []

    try:
        if trigger == "diagnostic_finding":
            diagnostics = await generate_system_diagnostics(db)
            matches = _match_diagnostic_findings(rule_dict, diagnostics.get("findings", []))
        elif trigger == "root_cause_cluster":
            matches = await _find_root_cause_clusters(db, rule_dict)
        elif trigger == "threshold_breach":
            matches = await _find_threshold_breaches(db, rule_dict)
        elif trigger == "claim_status":
            matches = await _find_rejected_fixable_claims(db, rule_dict)
        elif trigger == "filing_deadline":
            matches = await _find_filing_deadline_claims(db, rule_dict)
        elif trigger == "auth_expiry":
            matches = await _find_auth_expiry_claims(db, rule_dict)
        elif trigger == "eligibility_stale":
            matches = await _find_stale_eligibility_claims(db, rule_dict)
        elif trigger == "duplicate_claim":
            matches = await _find_duplicate_claims(db, rule_dict)
        else:
            return {
                "rule_id": rule_id,
                "matched_count": 0,
                "sample_matches": [],
                "note": f"Unsupported trigger type '{trigger}' — dry-run not available",
            }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Dry-run failed: {exc}")

    # NEVER commit — dry-run only
    await db.rollback()

    samples = matches[:5]
    # Keep response compact: sanitize non-serializable types
    def _sample(m: Any) -> dict:
        if isinstance(m, dict):
            return {
                k: (v if isinstance(v, (str, int, float, bool, type(None), list, dict))
                    else str(v))
                for k, v in m.items()
            }
        return {"value": str(m)}

    return {
        "rule_id": rule_id,
        "trigger_type": trigger,
        "days_window": days,
        "matched_count": len(matches),
        "sample_matches": [_sample(m) for m in samples],
        "dry_run": True,
    }


# ---------------------------------------------------------------------------
# GET /automation/rules/{rule_id}/history  — daily counts by status
# ---------------------------------------------------------------------------
@router.get("/automation/rules/{rule_id}/history")
async def rule_history(
    rule_id: str,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)

    stmt = (
        select(
            cast(AutomationAction.created_at, Date).label("day"),
            AutomationAction.status,
            func.count(AutomationAction.action_id).label("cnt"),
            func.coalesce(func.sum(AutomationAction.estimated_impact), 0).label("impact"),
        )
        .where(
            and_(
                AutomationAction.rule_id == rule_id,
                AutomationAction.created_at >= cutoff,
            )
        )
        .group_by("day", AutomationAction.status)
        .order_by(desc("day"))
    )
    rows = (await db.execute(stmt)).all()

    by_day: dict[str, dict[str, Any]] = {}
    totals: dict[str, int] = {}
    for r in rows:
        day_str = r.day.isoformat() if r.day else "unknown"
        by_day.setdefault(day_str, {"day": day_str, "by_status": {}, "total": 0, "impact": 0.0})
        by_day[day_str]["by_status"][r.status] = int(r.cnt)
        by_day[day_str]["total"] += int(r.cnt)
        by_day[day_str]["impact"] += float(r.impact or 0)
        totals[r.status] = totals.get(r.status, 0) + int(r.cnt)

    return {
        "rule_id": rule_id,
        "days": days,
        "totals_by_status": totals,
        "total_actions": sum(totals.values()),
        "daily": list(by_day.values()),
    }
