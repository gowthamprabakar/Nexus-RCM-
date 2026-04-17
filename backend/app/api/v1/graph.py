"""
Graph & Automation API -- Sprint 7
====================================
Drill-down endpoints from revenue to individual claims.
Automation rule management endpoints.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text, func, desc, and_
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
# Graph Explorer -- returns {nodes, edges, stats} for the frontend canvas
# ---------------------------------------------------------------------------

@router.get("/graph/explore")
async def graph_explore(
    level: str = Query("overview", pattern="^(overview|payer|category|claims)$"),
    payer_id: str = Query(None),
    category: str = Query(None),
    root_cause: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Unified graph explore endpoint that returns {nodes, edges, stats}.
    Supports progressive drill-down: overview -> payer -> category -> claims.
    """
    import logging
    logger = logging.getLogger(__name__)

    nodes = []
    edges = []

    try:
        if level == "overview":
            # Get top payers with denial impact (using denials + claims directly)
            payer_rows = await db.execute(text("""
                SELECT
                    pm.payer_id,
                    pm.payer_name,
                    COALESCE(SUM(d.denial_amount), 0)      AS impact,
                    COUNT(DISTINCT d.claim_id)              AS claim_count,
                    COUNT(DISTINCT d.denial_id)             AS denial_count
                FROM denials d
                JOIN claims c  ON c.claim_id = d.claim_id
                JOIN payer_master pm ON pm.payer_id = c.payer_id
                GROUP BY pm.payer_id, pm.payer_name
                ORDER BY impact DESC
                LIMIT 10
            """))
            payers = payer_rows.fetchall()

            # Get top denial categories per payer
            cat_rows = await db.execute(text("""
                SELECT
                    c.payer_id,
                    d.denial_category,
                    COALESCE(SUM(d.denial_amount), 0)      AS impact,
                    COUNT(DISTINCT d.denial_id)             AS denial_count
                FROM denials d
                JOIN claims c ON c.claim_id = d.claim_id
                WHERE c.payer_id IN (
                    SELECT c2.payer_id
                    FROM denials d2
                    JOIN claims c2 ON c2.claim_id = d2.claim_id
                    GROUP BY c2.payer_id
                    ORDER BY SUM(d2.denial_amount) DESC
                    LIMIT 10
                )
                GROUP BY c.payer_id, d.denial_category
                ORDER BY impact DESC
            """))
            categories = cat_rows.fetchall()

            # Build payer nodes
            for p in payers:
                nodes.append({
                    "id": str(p.payer_id),
                    "type": "Payer",
                    "name": p.payer_name or str(p.payer_id),
                    "props": {
                        "impact": round(float(p.impact), 2),
                        "claims": int(p.claim_count),
                        "denials": int(p.denial_count),
                    },
                })

            # Build category nodes and edges (deduplicate category names)
            seen_cats = {}
            for c in categories:
                cat_name = c.denial_category or "Unknown"
                cat_id = f"cat-{cat_name}"
                if cat_id not in seen_cats:
                    seen_cats[cat_id] = {
                        "id": cat_id,
                        "type": "Category",
                        "name": cat_name,
                        "props": {
                            "impact": round(float(c.impact), 2),
                            "denials": int(c.denial_count),
                        },
                    }
                else:
                    # Accumulate impact across payers
                    seen_cats[cat_id]["props"]["impact"] = round(
                        seen_cats[cat_id]["props"]["impact"] + float(c.impact), 2
                    )
                    seen_cats[cat_id]["props"]["denials"] += int(c.denial_count)

                edges.append({
                    "source": str(c.payer_id),
                    "target": cat_id,
                    "label": "HAS_DENIAL_CATEGORY",
                    "weight": round(float(c.impact), 2),
                })

            nodes.extend(seen_cats.values())

        elif level == "payer" and payer_id:
            # Categories for this payer (denials + claims)
            cat_rows = await db.execute(text("""
                SELECT
                    d.denial_category,
                    COALESCE(SUM(d.denial_amount), 0)      AS impact,
                    COUNT(DISTINCT d.denial_id)             AS denial_count
                FROM denials d
                JOIN claims c ON c.claim_id = d.claim_id
                WHERE c.payer_id = :pid
                GROUP BY d.denial_category
                ORDER BY impact DESC
            """), {"pid": payer_id})
            categories = cat_rows.fetchall()

            # CARC codes as "root cause" substitute when RCA table is empty
            rc_rows = await db.execute(text("""
                SELECT
                    d.carc_code            AS primary_root_cause,
                    d.denial_category      AS root_cause_group,
                    d.denial_category,
                    COALESCE(SUM(d.denial_amount), 0) AS impact,
                    COUNT(*)                           AS cnt
                FROM denials d
                JOIN claims c ON c.claim_id = d.claim_id
                WHERE c.payer_id = :pid
                  AND d.carc_code IS NOT NULL
                GROUP BY d.carc_code, d.denial_category
                ORDER BY impact DESC
                LIMIT 15
            """), {"pid": payer_id})
            root_causes = rc_rows.fetchall()

            seen_cats = {}
            for c in categories:
                cat_name = c.denial_category or "Unknown"
                cat_id = f"cat-{cat_name}"
                if cat_id not in seen_cats:
                    seen_cats[cat_id] = True
                    nodes.append({
                        "id": cat_id,
                        "type": "Category",
                        "name": cat_name,
                        "props": {
                            "impact": round(float(c.impact), 2),
                            "denials": int(c.denial_count),
                        },
                    })
                edges.append({
                    "source": str(payer_id),
                    "target": cat_id,
                    "label": "HAS_DENIAL_CATEGORY",
                    "weight": round(float(c.impact), 2),
                })

            seen_rcs = {}
            for rc in root_causes:
                rc_name = rc.primary_root_cause or "Unknown"
                rc_id = f"rc-{rc_name}"
                cat_id = f"cat-{rc.denial_category or 'Unknown'}"
                if rc_id not in seen_rcs:
                    seen_rcs[rc_id] = True
                    nodes.append({
                        "id": rc_id,
                        "type": "RootCause",
                        "name": rc_name,
                        "props": {
                            "group": rc.root_cause_group,
                            "impact": round(float(rc.impact), 2),
                            "count": int(rc.cnt),
                        },
                    })
                edges.append({
                    "source": cat_id,
                    "target": rc_id,
                    "label": "CAUSED_BY",
                    "weight": round(float(rc.impact), 2),
                })

        elif level == "category" and payer_id and category:
            # CARC codes for payer + category (from denials directly)
            rc_rows = await db.execute(text("""
                SELECT
                    d.carc_code            AS primary_root_cause,
                    d.denial_category      AS root_cause_group,
                    COALESCE(SUM(d.denial_amount), 0) AS impact,
                    COUNT(*)                           AS cnt
                FROM denials d
                JOIN claims c ON c.claim_id = d.claim_id
                WHERE c.payer_id = :pid
                  AND d.denial_category = :cat
                  AND d.carc_code IS NOT NULL
                GROUP BY d.carc_code, d.denial_category
                ORDER BY impact DESC
            """), {"pid": payer_id, "cat": category})
            root_causes = rc_rows.fetchall()

            carc_rows = await db.execute(text("""
                SELECT
                    d.carc_code,
                    d.carc_description,
                    COUNT(*)                                AS cnt,
                    COALESCE(SUM(d.denial_amount), 0)       AS amount
                FROM denials d
                JOIN claims c ON c.claim_id = d.claim_id
                WHERE c.payer_id = :pid
                  AND d.denial_category = :cat
                  AND d.carc_code IS NOT NULL
                GROUP BY d.carc_code, d.carc_description
                ORDER BY amount DESC
                LIMIT 10
            """), {"pid": payer_id, "cat": category})
            carcs = carc_rows.fetchall()

            seen_rcs = {}
            for rc in root_causes:
                rc_name = rc.primary_root_cause or "Unknown"
                rc_id = f"rc-{rc_name}"
                cat_id = f"cat-{category}"
                if rc_id not in seen_rcs:
                    seen_rcs[rc_id] = True
                    nodes.append({
                        "id": rc_id,
                        "type": "RootCause",
                        "name": rc_name,
                        "props": {
                            "group": rc.root_cause_group,
                            "impact": round(float(rc.impact), 2),
                            "count": int(rc.cnt),
                        },
                    })
                edges.append({
                    "source": cat_id,
                    "target": rc_id,
                    "label": "CAUSED_BY",
                    "weight": round(float(rc.impact), 2),
                })

            for carc in carcs:
                code = carc.carc_code or "UNK"
                carc_id = f"carc-{code}"
                nodes.append({
                    "id": carc_id,
                    "type": "CARCCode",
                    "name": code,
                    "props": {
                        "description": carc.carc_description,
                        "count": int(carc.cnt),
                        "amount": round(float(carc.amount), 2),
                    },
                })
                # Connect CARC to the top root cause for this category
                if root_causes:
                    top_rc = root_causes[0].primary_root_cause or "Unknown"
                    edges.append({
                        "source": f"rc-{top_rc}",
                        "target": carc_id,
                        "label": "MAPS_TO",
                        "weight": round(float(carc.amount), 2),
                    })

        elif level == "claims" and payer_id:
            # Individual claim nodes
            conditions = ["rca.payer_id = :pid"]
            params = {"pid": payer_id}
            if category:
                conditions.append("d.denial_category = :cat")
                params["cat"] = category
            if root_cause:
                conditions.append("rca.primary_root_cause = :rc")
                params["rc"] = root_cause

            where_clause = " AND ".join(conditions)

            claim_rows = await db.execute(text(f"""
                SELECT
                    c.claim_id,
                    CONCAT(COALESCE(pt.first_name, ''), ' ', COALESCE(pt.last_name, '')) AS patient_name,
                    c.total_charges,
                    d.denial_amount,
                    rca.primary_root_cause,
                    d.carc_code
                FROM root_cause_analysis rca
                JOIN claims c ON c.claim_id = rca.claim_id
                JOIN denials d ON d.denial_id = rca.denial_id
                LEFT JOIN patients pt ON pt.patient_id = c.patient_id
                WHERE {where_clause}
                ORDER BY rca.financial_impact DESC
                LIMIT 20
            """), params)
            claims = claim_rows.fetchall()

            parent_id = f"rc-{root_cause}" if root_cause else (f"cat-{category}" if category else str(payer_id))

            for cl in claims:
                claim_id = str(cl.claim_id)
                nodes.append({
                    "id": f"claim-{claim_id}",
                    "type": "Claim",
                    "name": claim_id,
                    "props": {
                        "patient": (cl.patient_name or "").strip() or "Unknown",
                        "charges": round(float(cl.total_charges or 0), 2),
                        "denied": round(float(cl.denial_amount or 0), 2),
                        "carc": cl.carc_code,
                    },
                })
                edges.append({
                    "source": parent_id,
                    "target": f"claim-{claim_id}",
                    "label": "HAS_CLAIM",
                    "weight": round(float(cl.denial_amount or 0), 2),
                })

    except Exception as e:
        logger.error(f"graph_explore failed (level={level}): {e}")
        # Return empty graph on error
        return {"nodes": [], "edges": [], "stats": {"total_nodes": 0, "total_edges": 0, "total_impact": 0}}

    total_impact = sum(n["props"].get("impact", 0) for n in nodes if n["type"] == "Payer")
    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "total_impact": round(total_impact, 2),
        },
    }


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
