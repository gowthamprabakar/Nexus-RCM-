"""
MiroFish Simulation API Router — Sprint 18
=============================================
Endpoints for running what-if simulations via MiroFish engine.
Includes scenario-based what-if projections with result caching.
"""

import json
import time
import uuid
import logging
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db
from app.services.mirofish_bridge import (
    create_simulation,
    get_simulation_results,
    get_simulation_status,
    run_what_if_analysis,
    export_rcm_state,
    _build_payer_agents,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory cache for simulation results (keyed by scenario_id)
# Each entry stores {"data": result, "ts": time.time()} with TTL eviction.
_CACHE_TTL = 3600  # seconds
_CACHE_MAX_SIZE = 200
_simulation_cache: OrderedDict[str, dict] = OrderedDict()


def _cache_get(key: str) -> dict | None:
    """Return cached data if present and not expired, else None."""
    entry = _simulation_cache.get(key)
    if entry is None:
        return None
    if time.time() - entry["ts"] > _CACHE_TTL:
        _simulation_cache.pop(key, None)
        return None
    # Move to end so LRU eviction works correctly
    _simulation_cache.move_to_end(key)
    return entry["data"]


def _cache_put(key: str, data: dict) -> None:
    """Store data in the cache, evicting oldest entries if over max size."""
    _simulation_cache[key] = {"data": data, "ts": time.time()}
    _simulation_cache.move_to_end(key)
    while len(_simulation_cache) > _CACHE_MAX_SIZE:
        _simulation_cache.popitem(last=False)

# Path to pre-built scenario definitions
SCENARIOS_FILE = Path(__file__).resolve().parents[4] / "mirofish" / "rcm_seeds" / "simulation_scenarios.json"


# ── GET /simulation/scenarios ────────────────────────────────────────────────
@router.get("/scenarios")
async def list_scenarios():
    """List available pre-built simulation scenarios."""
    try:
        with open(SCENARIOS_FILE, "r") as f:
            data = json.load(f)
        return {"scenarios": data.get("scenarios", [])}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Scenarios file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid scenarios file")


# ── POST /simulation/run ─────────────────────────────────────────────────────
@router.post("/run")
async def run_simulation(
    scenario: dict,
    db: AsyncSession = Depends(get_db),
):
    """Run a what-if simulation via MiroFish.

    Body can be:
      - A scenario_id referencing a pre-built scenario
      - A full custom scenario object with type + parameters
    """
    scenario_id = scenario.get("scenario_id")

    # If referencing a pre-built scenario, load it
    full_scenario = None
    if scenario_id:
        try:
            with open(SCENARIOS_FILE, "r") as f:
                all_scenarios = json.load(f).get("scenarios", [])
            match = next(
                (s for s in all_scenarios if s["id"].upper() == scenario_id.upper()),
                None,
            )
            if not match:
                raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")
            full_scenario = match
            scenario_type = match.get("type", "what_if")
            parameters = match.get("parameters", {})
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Scenarios file not found")
    else:
        scenario_type = scenario.get("type", "what_if")
        parameters = scenario.get("parameters", {})
        full_scenario = scenario

    # Run the simulation through the bridge (with fallback to lightweight engine)
    result = await run_what_if_analysis(
        db, scenario_type, parameters, full_scenario=full_scenario
    )

    # If both engines failed, return structured error
    if "error" in result:
        run_id = str(uuid.uuid4())
        return {
            "simulation_id": run_id,
            "status": "engine_unavailable",
            "message": f"Simulation engines unavailable: {result['error']}",
            "scenario_type": scenario_type,
            "parameters": parameters,
        }

    return result


# ── GET /simulation/payer-agents ─────────────────────────────────────────────
@router.get("/payer-agents")
async def get_payer_agents(db: AsyncSession = Depends(get_db)):
    """Get payer agent profiles built from real database data."""
    try:
        agents = await _build_payer_agents(db)
        return {"agents": agents, "count": len(agents)}
    except Exception as e:
        logger.error(f"Failed to build payer agents: {e}")
        # Fall back to seed data
        seed_file = Path(__file__).resolve().parents[4] / "mirofish" / "rcm_seeds" / "payer_agents.json"
        try:
            with open(seed_file, "r") as f:
                data = json.load(f)
            return {"agents": data.get("agents", []), "count": len(data.get("agents", [])), "source": "seed_data"}
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="No payer agent data available")


# ── GET /simulation/ontology ───────────────────────────────────────────────
@router.get("/ontology")
async def get_ontology(db: AsyncSession = Depends(get_db)):
    """
    Get the enriched RCM knowledge graph / ontology built from live DB data.
    v2.0: Includes financial health, ADTP, prevention alerts, diagnostic findings,
    automation rules, forecasts, and weighted/typed edges.
    """
    try:
        from app.services.rcm_ontology import build_rcm_ontology
        ontology = await build_rcm_ontology(db)

        # Add summary stats for quick consumption
        node_type_counts = {}
        for n in ontology.get("nodes", []):
            ntype = n.get("type", "unknown")
            node_type_counts[ntype] = node_type_counts.get(ntype, 0) + 1

        edge_type_counts = {}
        for e in ontology.get("edges", []):
            etype = e.get("type", "unknown")
            edge_type_counts[etype] = edge_type_counts.get(etype, 0) + 1

        ontology["stats"] = {
            "node_type_counts": node_type_counts,
            "edge_type_counts": edge_type_counts,
            "ai_layers_powered": [
                "descriptive", "diagnostic", "predictive",
                "prescriptive", "root_cause", "lida_chat",
            ],
        }

        return ontology
    except Exception as e:
        logger.error(f"Failed to build RCM ontology: {e}")
        raise HTTPException(status_code=500, detail=f"Ontology build failed: {str(e)}")


# ── GET /simulation/payer-agents/live ──────────────────────────────────────
@router.get("/payer-agents/live")
async def get_live_payer_agents(db: AsyncSession = Depends(get_db)):
    """Get enriched payer agent profiles with full behavior/decision data from live DB."""
    try:
        from app.services.payer_agents import build_payer_agents
        agents = await build_payer_agents(db)
        return {"agents": agents, "count": len(agents), "source": "live_database"}
    except Exception as e:
        logger.error(f"Failed to build live payer agents: {e}")
        raise HTTPException(status_code=500, detail=f"Payer agent build failed: {str(e)}")


# ── POST /simulation/scenario ────────────────────────────────────────────────
@router.post("/scenario")
async def run_scenario(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Run a what-if scenario projection.

    Body example:
        {"scenario": "reduce_modifier_errors", "reduction_pct": 30}

    Calculates base metrics from PostgreSQL, then projects impact of
    the scenario change. Results are cached by scenario_id.
    """
    scenario_name = body.get("scenario", "")
    reduction_pct = body.get("reduction_pct", 0)
    scenario_id = f"{scenario_name}_{reduction_pct}_{uuid.uuid4().hex[:6]}"

    try:
        # Fetch base metrics from PostgreSQL
        base_metrics = await db.execute(text("""
            SELECT
                COUNT(DISTINCT c.claim_id) AS total_claims,
                COUNT(DISTINCT d.denial_id) AS total_denials,
                COALESCE(SUM(d.denial_amount), 0) AS total_denied_amount,
                COALESCE(SUM(c.amount), 0) AS total_claim_amount,
                COALESCE(AVG(c.amount), 0) AS avg_claim_amount
            FROM claims c
            LEFT JOIN denials d ON c.claim_id = d.claim_id
        """))
        base = base_metrics.first()

        total_claims = int(base[0] or 0)
        total_denials = int(base[1] or 0)
        total_denied = float(base[2] or 0)
        total_claimed = float(base[3] or 0)
        avg_claim = float(base[4] or 0)

        denial_rate = (total_denials / total_claims * 100) if total_claims > 0 else 0

        # Fetch category-specific metrics for targeted scenarios
        category_metrics = {}
        if scenario_name:
            cat_result = await db.execute(text("""
                SELECT d.denial_category, COUNT(*) AS cnt,
                       COALESCE(SUM(d.denial_amount), 0) AS total_amount
                FROM denials d
                GROUP BY d.denial_category
            """))
            for row in cat_result.all():
                category_metrics[str(row[0] or "UNKNOWN").upper()] = {
                    "count": int(row[1]),
                    "total_amount": float(row[2]),
                }

        # Project impact based on scenario
        reduction_factor = max(0, min(reduction_pct, 100)) / 100.0

        # Map scenario names to denial categories
        scenario_category_map = {
            "reduce_modifier_errors": ["CODING", "MODIFIER"],
            "reduce_eligibility_denials": ["ELIGIBILITY"],
            "reduce_auth_denials": ["AUTHORIZATION", "AUTH"],
            "reduce_coding_errors": ["CODING"],
            "reduce_timely_filing": ["TIMELY_FILING"],
            "reduce_duplicate_claims": ["DUPLICATE"],
            "reduce_all_denials": list(category_metrics.keys()),
        }

        target_categories = scenario_category_map.get(
            scenario_name, list(category_metrics.keys())
        )

        # Calculate projected reductions
        affected_denials = 0
        affected_amount = 0.0
        for cat in target_categories:
            if cat in category_metrics:
                affected_denials += category_metrics[cat]["count"]
                affected_amount += category_metrics[cat]["total_amount"]

        projected_denials_prevented = int(affected_denials * reduction_factor)
        projected_revenue_recovered = round(affected_amount * reduction_factor, 2)
        new_denial_count = total_denials - projected_denials_prevented
        new_denial_rate = (new_denial_count / total_claims * 100) if total_claims > 0 else 0
        denial_rate_change = round(new_denial_rate - denial_rate, 2)

        # Estimate AR days impact (rough: fewer denials = faster resolution)
        ar_days_base = 45.0  # industry average
        ar_days_change = round(-1 * (projected_denials_prevented / max(total_claims, 1)) * 10, 2)

        result = {
            "scenario_id": scenario_id,
            "scenario": scenario_name,
            "reduction_pct": reduction_pct,
            "base_metrics": {
                "total_claims": total_claims,
                "total_denials": total_denials,
                "denial_rate": round(denial_rate, 2),
                "total_denied_amount": round(total_denied, 2),
                "total_claim_amount": round(total_claimed, 2),
            },
            "projected_impact": {
                "revenue_impact": projected_revenue_recovered,
                "denial_rate_change": denial_rate_change,
                "ar_days_change": ar_days_change,
                "denials_prevented": projected_denials_prevented,
                "affected_categories": target_categories,
            },
            "projected_metrics": {
                "new_denial_count": new_denial_count,
                "new_denial_rate": round(new_denial_rate, 2),
                "estimated_ar_days": round(ar_days_base + ar_days_change, 1),
            },
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }

        # Cache result
        _cache_put(scenario_id, result)

        return result

    except Exception as exc:
        logger.error("Scenario simulation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Scenario simulation failed: {str(exc)}")


# ── GET /simulation/results/{scenario_id} ────────────────────────────────────
@router.get("/results/{scenario_id}")
async def get_cached_scenario_results(scenario_id: str):
    """Get cached results for a previously run scenario simulation."""
    cached = _cache_get(scenario_id)
    if cached is not None:
        return cached
    raise HTTPException(status_code=404, detail=f"No cached results for scenario {scenario_id}")


# ── POST /simulation/interview/{agent_id} ──────────────────────────────────
@router.post("/interview/{agent_id}")
async def interview_payer_agent(
    agent_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Interview a payer agent.

    Tries MiroFish proxy first (localhost:5001). Falls back to Qwen3
    with the payer persona from build_payer_agents().
    Returns {response, agent_name, source}.
    """
    import httpx

    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    # ── 1. Try MiroFish proxy ────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"http://localhost:5001/api/simulation/interview/{agent_id}",
                json={"question": question},
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "response": data.get("response", ""),
                    "agent_name": data.get("agent_name", agent_id),
                    "source": "mirofish",
                }
    except Exception as exc:
        logger.debug("MiroFish interview proxy unavailable: %s", exc)

    # ── 2. Fallback: Qwen3 via Ollama with payer persona ────────────────────
    try:
        from app.services.payer_agents import build_payer_agents

        agents = await build_payer_agents(db)
        agent = next((a for a in agents if a.get("agent_id") == agent_id), None)
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

        persona = agent.get("personality", f"Healthcare payer agent {agent_id}")
        agent_name = agent.get("name", agent_id)

        system_prompt = (
            f"You are {agent_name}, a healthcare payer agent. "
            f"Persona: {persona}. "
            "Answer the interviewer's question from this payer's perspective. "
            "Be specific about denial patterns, payment timelines, and payer policies."
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": "qwen3",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question},
                    ],
                    "stream": False,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "response": data.get("message", {}).get("content", ""),
                    "agent_name": agent_name,
                    "source": "qwen3_fallback",
                }
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"Qwen3 returned status {resp.status_code}",
                )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Interview fallback failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Both MiroFish and Qwen3 fallback failed: {exc}",
        )


# ── GET /simulation/{simulation_id}/status ───────────────────────────────────
# NOTE: Wildcard routes MUST be registered after all static routes above
@router.get("/{simulation_id}/status")
async def check_simulation_status(simulation_id: str):
    """Check status of a running simulation."""
    result = await get_simulation_status(simulation_id)

    if "error" in result:
        return {
            "simulation_id": simulation_id,
            "status": "unknown",
            "message": f"Could not reach MiroFish: {result['error']}",
        }

    return result


# ── GET /simulation/{simulation_id}/results ──────────────────────────────────
@router.get("/{simulation_id}/results")
async def fetch_simulation_results(simulation_id: str):
    """Get results from a completed simulation."""
    result = await get_simulation_results(simulation_id)

    if "error" in result:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch results from MiroFish: {result['error']}",
        )

    return result
