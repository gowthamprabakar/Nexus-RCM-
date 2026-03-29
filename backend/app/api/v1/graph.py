"""
Graph & Automation API -- Sprint 7
====================================
Drill-down endpoints from revenue to individual claims.
Automation rule management endpoints.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services import graph_query_service, automation_engine

router = APIRouter()


# ---------------------------------------------------------------------------
# Graph / Drill-down endpoints
# ---------------------------------------------------------------------------

@router.get("/graph/revenue-to-payers")
async def revenue_to_payers(db: AsyncSession = Depends(get_db)):
    """Level 1: Revenue impact grouped by payer."""
    return await graph_query_service.drill_revenue_to_payers(db)


@router.get("/graph/payer/{payer_id}/categories")
async def payer_categories(payer_id: str, db: AsyncSession = Depends(get_db)):
    """Level 2: Denial categories for a specific payer."""
    return await graph_query_service.drill_payer_to_categories(db, payer_id)


@router.get("/graph/payer/{payer_id}/category/{category}/root-causes")
async def category_root_causes(
    payer_id: str, category: str, db: AsyncSession = Depends(get_db)
):
    """Level 3: Root causes for a payer + denial category."""
    return await graph_query_service.drill_category_to_root_causes(db, payer_id, category)


@router.get("/graph/claims/browse")
async def browse_claims(
    status: str = Query(None),
    payer_id: str = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    sort: str = Query("total_charges"),
    db: AsyncSession = Depends(get_db),
):
    """Browse all claims with pagination and filters."""
    return await graph_query_service.browse_claims(
        db, status=status, payer_id=payer_id,
        page=page, size=size, sort=sort,
    )


@router.get("/graph/claims")
async def graph_claims(
    payer_id: str = Query(None),
    payer_name: str = Query(None),
    root_cause: str = Query(None),
    category: str = Query(None),
    status: str = Query(None),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Level 4: Individual claims matching filters."""
    # If payer_name provided, resolve to payer_id
    resolved_payer_id = payer_id
    if payer_name and not payer_id:
        from app.models.payer import Payer
        r = await db.execute(select(Payer.payer_id).where(Payer.payer_name == payer_name).limit(1))
        row = r.scalars().first()
        if row:
            resolved_payer_id = row
    return await graph_query_service.drill_root_cause_to_claims(
        db, payer_id=resolved_payer_id, root_cause=root_cause,
        denial_category=category, limit=limit, offset=offset,
    )


@router.get("/graph/claim/{claim_id}/full-context")
async def claim_full_context(claim_id: str, db: AsyncSession = Depends(get_db)):
    """Level 5: Full context for a single claim."""
    return await graph_query_service.get_claim_full_context(db, claim_id)


# ---------------------------------------------------------------------------
# Automation endpoints
# ---------------------------------------------------------------------------

@router.get("/automation/rules")
async def automation_rules(db: AsyncSession = Depends(get_db)):
    """Get all automation rules with stats."""
    return await automation_engine.get_rules(db)


@router.post("/automation/rules/{rule_id}/toggle")
async def toggle_automation_rule(
    rule_id: str, enabled: bool = Query(...), db: AsyncSession = Depends(get_db)
):
    """Enable or disable an automation rule."""
    result = await automation_engine.toggle_rule(db, rule_id, enabled)
    await db.commit()
    return result


@router.get("/automation/pending")
async def automation_pending(db: AsyncSession = Depends(get_db)):
    """Get pending approval actions."""
    return await automation_engine.get_pending_approvals(db)


@router.post("/automation/approve/{action_id}")
async def automation_approve(
    action_id: str,
    approved_by: str = Query("system"),
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending action."""
    result = await automation_engine.approve_action(db, action_id, approved_by)
    await db.commit()
    return result


@router.post("/automation/reject/{action_id}")
async def automation_reject(
    action_id: str,
    rejected_by: str = Query("system"),
    db: AsyncSession = Depends(get_db),
):
    """Reject a pending action."""
    result = await automation_engine.reject_action(db, action_id, rejected_by)
    await db.commit()
    return result


@router.get("/automation/audit")
async def automation_audit(
    limit: int = Query(50, ge=1, le=200), db: AsyncSession = Depends(get_db)
):
    """Get automation audit trail."""
    return await automation_engine.get_audit_trail(db, limit=limit)


@router.post("/automation/evaluate")
async def automation_evaluate(db: AsyncSession = Depends(get_db)):
    """Trigger rule evaluation against current diagnostics."""
    results = await automation_engine.evaluate_rules(db)
    await db.commit()
    return {"triggered": len(results), "actions": results}
