"""
MiroFish Bridge Service
========================
Connects NEXUS RCM analytics to MiroFish simulation engine.
Exports RCM state as seed data for simulations.
Imports simulation results back into RCM for action recommendations.

Falls back to the lightweight Ollama-based simulation engine when
MiroFish is not running (localhost:5001 unreachable).
"""

import httpx
import json
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.services.simulation_engine import (
    run_simulation as run_lightweight_simulation,
    check_ollama_available,
)

logger = logging.getLogger(__name__)

MIROFISH_BASE_URL = "http://localhost:5001"


async def _is_mirofish_running() -> bool:
    """Check if MiroFish backend is reachable."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{MIROFISH_BASE_URL}/",
                timeout=3.0,
            )
            return resp.status_code < 500
    except Exception:
        return False


async def export_rcm_state(db: AsyncSession) -> dict:
    """Export current RCM state as MiroFish seed data."""
    # Query real data for simulation seeding
    try:
        # Get denial summary by category
        denial_summary = await db.execute(text("""
            SELECT d.denial_category, COUNT(*) as cnt,
                   SUM(d.denial_amount) as total_amount,
                   AVG(d.denial_amount) as avg_amount
            FROM denials d
            GROUP BY d.denial_category
            ORDER BY cnt DESC
        """))
        denial_rows = denial_summary.all()

        # Get claim volume and status distribution
        claim_summary = await db.execute(text("""
            SELECT c.status, COUNT(*) as cnt,
                   SUM(c.amount) as total_amount
            FROM claims c
            GROUP BY c.status
        """))
        claim_rows = claim_summary.all()

        # Get payer mix
        payer_mix = await db.execute(text("""
            SELECT pm.payer_name, COUNT(c.claim_id) as claim_count,
                   SUM(c.amount) as total_amount
            FROM payer_master pm
            LEFT JOIN claims c ON pm.payer_id = c.payer_id
            GROUP BY pm.payer_name
            ORDER BY claim_count DESC
            LIMIT 10
        """))
        payer_rows = payer_mix.all()

        return {
            "denial_distribution": [
                {
                    "category": row[0],
                    "count": int(row[1]),
                    "total_amount": float(row[2] or 0),
                    "avg_amount": float(row[3] or 0),
                }
                for row in denial_rows
            ],
            "claim_status_distribution": [
                {
                    "status": row[0],
                    "count": int(row[1]),
                    "total_amount": float(row[2] or 0),
                }
                for row in claim_rows
            ],
            "payer_mix": [
                {
                    "payer_name": row[0],
                    "claim_count": int(row[1] or 0),
                    "total_amount": float(row[2] or 0),
                }
                for row in payer_rows
            ],
        }
    except Exception as e:
        logger.error(f"Failed to export RCM state: {e}")
        return {"error": str(e)}


async def create_simulation(scenario: dict) -> dict:
    """Send a simulation scenario to MiroFish."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{MIROFISH_BASE_URL}/api/simulation/create",
                json=scenario,
                timeout=30.0
            )
            return response.json()
        except Exception as e:
            logger.error(f"MiroFish simulation failed: {e}")
            return {"error": str(e)}


async def get_simulation_results(simulation_id: str) -> dict:
    """Get results from a completed MiroFish simulation."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MIROFISH_BASE_URL}/api/simulation/{simulation_id}/results",
                timeout=30.0
            )
            return response.json()
        except Exception as e:
            logger.error(f"MiroFish results fetch failed: {e}")
            return {"error": str(e)}


async def get_simulation_status(simulation_id: str) -> dict:
    """Check status of a running MiroFish simulation."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{MIROFISH_BASE_URL}/api/simulation/{simulation_id}/status",
                timeout=10.0
            )
            return response.json()
        except Exception as e:
            logger.error(f"MiroFish status check failed: {e}")
            return {"error": str(e)}


async def run_what_if_analysis(
    db: AsyncSession,
    scenario_type: str,
    parameters: dict,
    full_scenario: Optional[dict] = None,
) -> dict:
    """
    Run a what-if analysis.

    Tries MiroFish first. If MiroFish is offline, falls back to the
    lightweight Ollama-based simulation engine.

    Args:
        db: Database session for exporting RCM state.
        scenario_type: "what_if" or "forecast".
        parameters: Scenario parameters dict.
        full_scenario: The complete scenario object (used by lightweight engine).
    """
    # ── 1. Try MiroFish ──────────────────────────────────────────────────────
    if await _is_mirofish_running():
        logger.info("MiroFish is running — delegating simulation")
        state = await export_rcm_state(db)
        scenario = {
            "type": scenario_type,
            "seed_data": state,
            "parameters": parameters,
            "agents": await _build_payer_agents(db),
        }
        result = await create_simulation(scenario)
        if "error" not in result:
            return result
        logger.warning("MiroFish returned error, falling back to lightweight engine")

    # ── 2. Fallback: lightweight Ollama engine ────────────────────────────────
    if full_scenario:
        logger.info("Using lightweight Ollama simulation engine (MiroFish offline)")
        try:
            result = await run_lightweight_simulation(full_scenario, num_rounds=2)
            return result
        except Exception as e:
            logger.error(f"Lightweight simulation also failed: {e}")
            return {"error": f"Both MiroFish and lightweight engine failed: {e}"}

    # No full_scenario provided — return structured error
    return {
        "error": "MiroFish is offline and no full scenario was provided for fallback engine"
    }


async def _build_payer_agents(db: AsyncSession) -> list:
    """Build payer agent profiles from real DB data."""
    result = await db.execute(text("""
        SELECT pm.payer_id, pm.payer_name, pm.denial_rate, pm.adtp_days,
               count(d.denial_id) as denial_count,
               sum(d.denial_amount) as total_denied
        FROM payer_master pm
        LEFT JOIN claims c ON pm.payer_id = c.payer_id
        LEFT JOIN denials d ON c.claim_id = d.claim_id
        GROUP BY pm.payer_id, pm.payer_name, pm.denial_rate, pm.adtp_days
        ORDER BY count(d.denial_id) DESC
        LIMIT 10
    """))

    agents = []
    for row in result.all():
        agents.append({
            "agent_id": row[0],
            "name": row[1],
            "personality": f"Healthcare payer with {row[2] or 0}% denial rate and {row[3] or 0} day ADTP",
            "denial_rate": float(row[2] or 0),
            "adtp_days": int(row[3] or 0),
            "total_denials": int(row[4] or 0),
            "total_denied_amount": float(row[5] or 0),
        })

    return agents


async def query_mirofish_for_rca(claim_context: dict, neo4j_evidence: dict) -> dict:
    """Ask MiroFish agent swarm to reason about root cause during analysis.

    Called between Step 9 and Step 10 of root cause analysis.
    3 agents (payer, coding, billing) debate the root cause.
    10-second timeout. Returns confidence adjustment.
    """
    mirofish_url = "http://localhost:5001/api/simulation/rcm/validate"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(mirofish_url, json={
                "suggestion": {
                    "type": "root_cause",
                    "claim_context": claim_context,
                    "neo4j_evidence": neo4j_evidence,
                },
                "type": "root_cause"
            })

            if resp.status_code == 200:
                result = resp.json()
                return {
                    "agent_agrees": result.get("verdict") == "approved",
                    "confidence_adjustment": 15 if result.get("verdict") == "approved" else -10 if result.get("verdict") == "rejected" else 0,
                    "agent_reasoning": result.get("reasoning", ""),
                    "alternative_cause": None,
                    "validation_details": result.get("agent_validations", []),
                }
            else:
                return {"agent_agrees": None, "confidence_adjustment": 0, "agent_reasoning": "MiroFish returned error", "alternative_cause": None, "validation_details": []}
    except Exception as e:
        logger.warning(f"MiroFish RCA query failed (timeout or unavailable): {e}")
        return {"agent_agrees": None, "confidence_adjustment": 0, "agent_reasoning": f"MiroFish unavailable: {e}", "alternative_cause": None, "validation_details": []}
