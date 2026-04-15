"""
Root Cause Analysis Router — Sprint 5
GET  /root-cause/summary              — aggregate root cause breakdown
GET  /root-cause/trending             — weekly trending over N weeks
GET  /root-cause/claim/{claim_id}     — root cause detail for one claim
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional

from app.core.deps import get_db
from app.services import root_cause_service

router = APIRouter()


# ── GET /root-cause/summary ─────────────────────────────────────────────────
@router.get("/summary")
async def get_summary(
    payer_id: Optional[str] = None,
    root_cause_group: Optional[str] = None,
    carc_code: Optional[str] = Query(None, description="Filter precedents by CARC code"),
    days: Optional[int] = Query(None, ge=1, le=730, description="Lookback window in days"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Aggregate root cause summary with counts by cause and group."""
    filters = {}
    if payer_id:
        filters["payer_id"] = payer_id
    if root_cause_group:
        filters["root_cause_group"] = root_cause_group
    if carc_code:
        filters["carc_code"] = carc_code
    if days:
        filters["days"] = days
    return await root_cause_service.get_root_cause_summary(db, filters)


# ── GET /root-cause/trending ────────────────────────────────────────────────
@router.get("/trending")
async def get_trending(
    weeks_back: int = Query(12, ge=1, le=52),
    payer_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Weekly trending of root cause categories."""
    return await root_cause_service.get_root_cause_trending(db, weeks_back, payer_id)


# ── GET /root-cause/claim/{claim_id} ────────────────────────────────────────
@router.get("/claim/{claim_id}")
async def get_claim_root_cause(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Root cause analysis for a specific claim."""
    return await root_cause_service.get_claim_root_cause(db, claim_id)


# ── GET /root-cause/tree ────────────────────────────────────────────────
@router.get("/tree")
async def get_tree(
    payer_id: Optional[str] = Query(None),
    root_cause_group: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Hierarchical root cause tree for frontend visualization.

    Applies optional filters on payer_id and root_cause_group; limits top claims per leaf.
    """
    return await root_cause_service.get_root_cause_tree(
        db,
        payer_id=payer_id,
        root_cause_group=root_cause_group,
        limit=limit,
    )


# ── POST /root-cause/validate/{claim_id} ─────────────────────────────────
@router.post("/validate/{claim_id}")
async def validate_claim_root_cause(claim_id: str, db: AsyncSession = Depends(get_db)) -> Any:
    """Validate a specific claim's root cause using the Qwen3 expert panel. Persists result."""
    from sqlalchemy import text
    from app.services.root_cause_validator import validate_root_cause

    result = await db.execute(text("""
        SELECT rca.rca_id, rca.primary_root_cause, rca.confidence_score,
               rca.financial_impact, d.denial_category, d.carc_code, pm.payer_name
        FROM root_cause_analysis rca
        JOIN denials d ON rca.denial_id = d.denial_id
        JOIN claims c ON rca.claim_id = c.claim_id
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE rca.claim_id = :claim_id
        ORDER BY rca.financial_impact DESC LIMIT 1
    """), {"claim_id": claim_id})

    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="No root cause analysis found for this claim")

    rca_id, root_cause, conf, impact, category, carc, payer = row
    validation = await validate_root_cause(db, claim_id, root_cause, category, carc or "", payer, int(conf or 0), float(impact or 0))

    if validation["validated"]:
        await db.execute(text("""
            UPDATE root_cause_analysis
            SET confidence_score = :new_conf,
                evidence_summary = COALESCE(evidence_summary, '') || ' [VALIDATED: ' || :reasoning || ']'
            WHERE rca_id = :rca_id
        """), {"new_conf": validation["adjusted_confidence"], "reasoning": validation["reasoning"][:100], "rca_id": rca_id})
        await db.commit()

    return {"claim_id": claim_id, "root_cause": root_cause, "persisted": validation["validated"], **validation}


# ── POST /root-cause/validate-batch ──────────────────────────────────────
@router.post("/validate-batch")
async def validate_batch(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Validate top N highest-impact unvalidated root causes."""
    from app.services.root_cause_validator import batch_validate
    return await batch_validate(db, limit)
