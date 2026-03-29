"""
Neo4j Feedback Loop — Sprint 14.4
====================================
Updates the Neo4j knowledge graph with actual outcomes to improve
future predictions and graph-based reasoning.

Entry points:
  update_appeal_outcomes_in_graph(outcomes: list[dict]) -> dict
  update_payer_metrics_in_graph(payer_metrics: list[dict]) -> dict
  run_feedback_cycle(db) -> dict
"""

import logging
from datetime import date, timedelta
from typing import List, Dict

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.denial import Appeal, Denial
from app.services.neo4j_client import Neo4jClient, get_neo4j

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# update_appeal_outcomes_in_graph
# ---------------------------------------------------------------------------

async def update_appeal_outcomes_in_graph(outcomes: List[Dict]) -> dict:
    """
    Push actual appeal outcomes into the Neo4j knowledge graph.

    For each outcome dict (keys: denial_id, carc_code, payer_id,
    root_cause_id, outcome, recovered_amount):
      - Update HISTORICALLY_DENIES relationship properties with win/loss data
      - Update RootCause node properties with actual resolution rates

    Returns summary of graph mutations.
    """
    if not outcomes:
        return {"status": "success", "updated": 0, "message": "No outcomes to process"}

    try:
        neo4j: Neo4jClient = await get_neo4j()
        if not neo4j.is_connected:
            logger.warning("Neo4j unavailable — skipping graph outcome update")
            return {"status": "degraded", "message": "Neo4j not connected"}

        # --- 1. Update HISTORICALLY_DENIES relationships ---
        denial_rel_cypher = """
        UNWIND $batch AS row
        MATCH (p:Payer {payer_id: row.payer_id})
              -[r:HISTORICALLY_DENIES]->(c:CARCCode {code: row.carc_code})
        SET r.total_appeals     = COALESCE(r.total_appeals, 0) + 1,
            r.appeals_won       = CASE WHEN row.outcome IN ['WON', 'APPROVED', 'PARTIAL']
                                       THEN COALESCE(r.appeals_won, 0) + 1
                                       ELSE COALESCE(r.appeals_won, 0) END,
            r.appeals_lost      = CASE WHEN row.outcome IN ['LOST', 'DENIED']
                                       THEN COALESCE(r.appeals_lost, 0) + 1
                                       ELSE COALESCE(r.appeals_lost, 0) END,
            r.total_recovered   = COALESCE(r.total_recovered, 0) + row.recovered_amount,
            r.appeal_win_rate   = CASE WHEN (COALESCE(r.total_appeals, 0) + 1) > 0
                                       THEN toFloat(
                                            CASE WHEN row.outcome IN ['WON', 'APPROVED', 'PARTIAL']
                                                 THEN COALESCE(r.appeals_won, 0) + 1
                                                 ELSE COALESCE(r.appeals_won, 0) END
                                       ) / (COALESCE(r.total_appeals, 0) + 1)
                                       ELSE 0.0 END,
            r.last_outcome_date = date()
        RETURN count(r) AS updated_rels
        """

        rel_result = await neo4j.write(denial_rel_cypher, {"batch": outcomes})
        rels_updated = (rel_result or {}).get("properties_set", 0)

        # --- 2. Update RootCause nodes with resolution rates ---
        root_cause_cypher = """
        UNWIND $batch AS row
        WITH row WHERE row.root_cause_id IS NOT NULL
        MATCH (rc:RootCause {root_cause_id: row.root_cause_id})
        SET rc.total_resolutions = COALESCE(rc.total_resolutions, 0) + 1,
            rc.successful_resolutions = CASE WHEN row.outcome IN ['WON', 'APPROVED', 'PARTIAL']
                                              THEN COALESCE(rc.successful_resolutions, 0) + 1
                                              ELSE COALESCE(rc.successful_resolutions, 0) END,
            rc.resolution_rate = CASE WHEN (COALESCE(rc.total_resolutions, 0) + 1) > 0
                                      THEN toFloat(
                                           CASE WHEN row.outcome IN ['WON', 'APPROVED', 'PARTIAL']
                                                THEN COALESCE(rc.successful_resolutions, 0) + 1
                                                ELSE COALESCE(rc.successful_resolutions, 0) END
                                      ) / (COALESCE(rc.total_resolutions, 0) + 1)
                                      ELSE 0.0 END,
            rc.total_recovered  = COALESCE(rc.total_recovered, 0) + row.recovered_amount,
            rc.last_updated     = date()
        RETURN count(rc) AS updated_nodes
        """

        rc_result = await neo4j.write(root_cause_cypher, {"batch": outcomes})
        nodes_updated = (rc_result or {}).get("properties_set", 0)

        summary = {
            "status": "success",
            "outcomes_processed": len(outcomes),
            "relationship_properties_set": rels_updated,
            "root_cause_properties_set": nodes_updated,
        }

        logger.info(
            "Graph outcome update complete: %d outcomes, %d rel props, %d RC props",
            len(outcomes), rels_updated, nodes_updated,
        )
        return summary

    except Exception as exc:
        logger.error("Failed to update appeal outcomes in graph: %s", exc)
        return {"status": "error", "message": str(exc)}


# ---------------------------------------------------------------------------
# update_payer_metrics_in_graph
# ---------------------------------------------------------------------------

async def update_payer_metrics_in_graph(payer_metrics: List[Dict]) -> dict:
    """
    Refresh Payer nodes with the latest denial_rate and appeal_win_rate
    computed from actual outcomes.

    Each dict in *payer_metrics* should contain:
        payer_id, denial_rate, appeal_win_rate, total_claims,
        total_denials, total_appeals, total_recovered
    """
    if not payer_metrics:
        return {"status": "success", "updated": 0, "message": "No payer metrics to process"}

    try:
        neo4j: Neo4jClient = await get_neo4j()
        if not neo4j.is_connected:
            logger.warning("Neo4j unavailable — skipping payer metrics update")
            return {"status": "degraded", "message": "Neo4j not connected"}

        cypher = """
        UNWIND $batch AS row
        MATCH (p:Payer {payer_id: row.payer_id})
        SET p.denial_rate      = row.denial_rate,
            p.appeal_win_rate  = row.appeal_win_rate,
            p.total_claims     = COALESCE(row.total_claims, p.total_claims),
            p.total_denials    = COALESCE(row.total_denials, p.total_denials),
            p.total_appeals    = COALESCE(row.total_appeals, p.total_appeals),
            p.total_recovered  = COALESCE(row.total_recovered, p.total_recovered),
            p.metrics_updated  = date()
        RETURN count(p) AS updated_payers
        """

        result = await neo4j.write(cypher, {"batch": payer_metrics})
        props_set = (result or {}).get("properties_set", 0)

        summary = {
            "status": "success",
            "payers_processed": len(payer_metrics),
            "properties_set": props_set,
        }

        logger.info(
            "Payer metrics update complete: %d payers, %d properties set",
            len(payer_metrics), props_set,
        )
        return summary

    except Exception as exc:
        logger.error("Failed to update payer metrics in graph: %s", exc)
        return {"status": "error", "message": str(exc)}


# ---------------------------------------------------------------------------
# run_feedback_cycle
# ---------------------------------------------------------------------------

async def run_feedback_cycle(db: AsyncSession) -> dict:
    """
    End-to-end feedback cycle:
      1. Query recent resolved appeals from PostgreSQL (last 30 days).
      2. Build outcome dicts and push to Neo4j via update_appeal_outcomes_in_graph.
      3. Aggregate payer-level metrics and push via update_payer_metrics_in_graph.
      4. Return a status summary.
    """
    try:
        cutoff = date.today() - timedelta(days=30)

        # --- 1. Fetch resolved appeals with denial context ---
        result = await db.execute(
            select(
                Appeal.appeal_id,
                Appeal.denial_id,
                Appeal.claim_id,
                Appeal.outcome,
                Appeal.recovered_amount,
                Appeal.outcome_date,
                Denial.carc_code,
                Denial.denial_category,
                Denial.root_cause_id,
            )
            .join(Denial, Appeal.denial_id == Denial.denial_id)
            .where(
                Appeal.outcome.isnot(None),
                Appeal.outcome_date >= cutoff,
            )
        )
        rows = result.all()

        if not rows:
            logger.info("Feedback cycle: no resolved appeals in the last 30 days")
            return {
                "status": "success",
                "message": "No resolved appeals to process",
                "appeals_processed": 0,
            }

        # --- 2. Build outcome dicts ---
        # We need payer_id.  It's not on the Appeal/Denial tables directly,
        # so we derive it from denial_category or use claim_id prefix as
        # a fallback identifier for graph matching.
        outcomes: List[Dict] = []
        payer_claims: Dict[str, Dict] = {}  # payer_id -> aggregated stats

        for row in rows:
            # Use first segment of claim_id as payer proxy when payer_id
            # is not stored on the denial record.
            payer_id = row.claim_id.split("-")[0] if row.claim_id else "UNKNOWN"

            outcomes.append({
                "denial_id": row.denial_id,
                "carc_code": row.carc_code,
                "payer_id": payer_id,
                "root_cause_id": row.root_cause_id,
                "outcome": row.outcome,
                "recovered_amount": float(row.recovered_amount or 0),
            })

            # Aggregate per payer
            if payer_id not in payer_claims:
                payer_claims[payer_id] = {
                    "total_appeals": 0,
                    "wins": 0,
                    "total_recovered": 0.0,
                }
            stats = payer_claims[payer_id]
            stats["total_appeals"] += 1
            if row.outcome in ("APPROVED", "PARTIAL"):
                stats["wins"] += 1
            stats["total_recovered"] += float(row.recovered_amount or 0)

        # --- 3. Push outcomes to graph ---
        outcome_result = await update_appeal_outcomes_in_graph(outcomes)

        # --- 4. Build and push payer metrics ---
        payer_metrics: List[Dict] = []
        for payer_id, stats in payer_claims.items():
            payer_metrics.append({
                "payer_id": payer_id,
                "denial_rate": None,  # not computable from appeals alone
                "appeal_win_rate": round(
                    stats["wins"] / stats["total_appeals"] * 100, 2
                ) if stats["total_appeals"] else 0.0,
                "total_claims": None,
                "total_denials": None,
                "total_appeals": stats["total_appeals"],
                "total_recovered": round(stats["total_recovered"], 2),
            })

        payer_result = await update_payer_metrics_in_graph(payer_metrics)

        summary = {
            "status": "success",
            "appeals_processed": len(outcomes),
            "payers_updated": len(payer_metrics),
            "graph_outcome_update": outcome_result,
            "graph_payer_update": payer_result,
        }

        logger.info(
            "Feedback cycle complete: %d appeals → %d payers",
            len(outcomes), len(payer_metrics),
        )
        return summary

    except Exception as exc:
        logger.error("Feedback cycle failed: %s", exc)
        return {"status": "error", "message": str(exc)}
