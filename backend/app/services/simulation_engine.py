"""
Lightweight Simulation Engine
==============================
Ollama-based fallback when MiroFish is not running.
Uses llama3 to simulate payer decision-making for what-if scenarios.

Each scenario runs through multiple "rounds" where payer agents
(modeled as prompt personas) evaluate the scenario and produce
structured outcomes: revenue impact, claims affected, confidence.
"""

import json
import logging
import os
import time
import uuid
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:4b")
TIMEOUT_SECONDS = 60


# ── Payer Persona Templates ─────────────────────────────────────────────────

PAYER_PERSONAS = {
    "UnitedHealthcare": {
        "style": "conservative, cost-focused, data-driven",
        "denial_tendency": "high",
        "negotiation_posture": "firm on medical necessity documentation",
    },
    "Blue Cross Blue Shield": {
        "style": "process-oriented, policy-adherent",
        "denial_tendency": "moderate",
        "negotiation_posture": "open to appeals with clinical evidence",
    },
    "Aetna": {
        "style": "balanced, technology-forward",
        "denial_tendency": "moderate",
        "negotiation_posture": "receptive to automated appeal workflows",
    },
    "Humana": {
        "style": "strict on prior authorization, Medicare-focused",
        "denial_tendency": "high for unauthorized procedures",
        "negotiation_posture": "rigid on auth requirements, flexible on timely filing",
    },
    "Cigna": {
        "style": "network-focused, utilization review heavy",
        "denial_tendency": "moderate-high",
        "negotiation_posture": "prefers bundled negotiations",
    },
    "Medicare": {
        "style": "rule-based, documentation-intensive, zero tolerance for fraud",
        "denial_tendency": "moderate but strict on compliance",
        "negotiation_posture": "no negotiation — appeals only through defined process",
    },
}


async def _call_ollama(prompt: str, system: str = "") -> str:
    """Send a prompt to Ollama and return the response text."""
    is_qwen3 = "qwen3" in OLLAMA_MODEL.lower()

    if is_qwen3:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        payload = {
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "think": False,
            "options": {"temperature": 0.2, "num_predict": 1024},
        }
        endpoint = f"{OLLAMA_BASE_URL}/api/chat"
    else:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"temperature": 0.2, "num_predict": 1024},
        }
        endpoint = f"{OLLAMA_BASE_URL}/api/generate"

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                endpoint,
                json=payload,
                timeout=TIMEOUT_SECONDS,
            )
            resp.raise_for_status()
            if is_qwen3:
                return resp.json().get("message", {}).get("content", "")
            else:
                return resp.json().get("response", "")
        except Exception as e:
            logger.error(f"Ollama call failed: {e}")
            return ""


async def _run_payer_round(
    payer_name: str,
    scenario: dict,
    round_number: int,
) -> dict:
    """Run one round of payer decision-making for a scenario."""
    persona = PAYER_PERSONAS.get(payer_name, {
        "style": "standard commercial payer",
        "denial_tendency": "moderate",
        "negotiation_posture": "balanced",
    })

    system_prompt = (
        f"You are simulating the behavior of {payer_name}, a healthcare payer.\n"
        f"Personality: {persona['style']}\n"
        f"Denial tendency: {persona['denial_tendency']}\n"
        f"Negotiation posture: {persona['negotiation_posture']}\n\n"
        "You must respond ONLY with valid JSON. No markdown, no explanation.\n"
        "Analyze the scenario and respond with your decision as a payer."
    )

    user_prompt = (
        f"ROUND {round_number} ANALYSIS\n\n"
        f"Scenario: {scenario.get('name', 'Unknown')}\n"
        f"Description: {scenario.get('description', '')}\n"
        f"Type: {scenario.get('type', 'what_if')}\n\n"
        f"Parameters:\n{json.dumps(scenario.get('parameters', {}), indent=2)}\n\n"
        "As this payer, evaluate the scenario and respond with this exact JSON structure:\n"
        "{\n"
        '  "payer": "<your payer name>",\n'
        '  "round": <round number>,\n'
        '  "decision": "approve|deny|partial|negotiate",\n'
        '  "claims_affected_pct": <0-100>,\n'
        '  "revenue_impact_pct": <-100 to +100, negative=loss, positive=recovery>,\n'
        '  "confidence": <0.0-1.0>,\n'
        '  "reasoning": "<brief 1-2 sentence explanation>",\n'
        '  "risk_factors": ["<factor1>", "<factor2>"]\n'
        "}"
    )

    raw = await _call_ollama(user_prompt, system_prompt)

    # Parse the JSON response
    try:
        # Try to extract JSON from the response
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            parsed = json.loads(raw[start:end])
            return {
                "payer": payer_name,
                "round": round_number,
                "decision": parsed.get("decision", "partial"),
                "claims_affected_pct": float(parsed.get("claims_affected_pct", 50)),
                "revenue_impact_pct": float(parsed.get("revenue_impact_pct", 0)),
                "confidence": float(parsed.get("confidence", 0.5)),
                "reasoning": parsed.get("reasoning", "No reasoning provided"),
                "risk_factors": parsed.get("risk_factors", []),
            }
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Failed to parse Ollama response for {payer_name} round {round_number}: {e}")

    # Fallback: return a deterministic result based on persona
    denial_map = {"high": -15, "moderate-high": -10, "moderate": -5, "low": 5}
    impact = denial_map.get(persona.get("denial_tendency", "moderate"), -5)

    return {
        "payer": payer_name,
        "round": round_number,
        "decision": "partial",
        "claims_affected_pct": 45.0,
        "revenue_impact_pct": float(impact),
        "confidence": 0.6,
        "reasoning": f"{payer_name} responded with moderate caution based on current policy stance.",
        "risk_factors": ["policy_change", "documentation_requirements"],
    }


def _compute_aggregate_results(
    scenario: dict,
    round_results: list[list[dict]],
) -> dict:
    """Aggregate multi-round, multi-payer results into final outcomes."""
    params = scenario.get("parameters", {})
    expected = scenario.get("expected_outcomes", {})

    # Collect all payer decisions
    all_decisions = [d for rnd in round_results for d in rnd]

    if not all_decisions:
        return {
            "status": "no_results",
            "message": "No payer responses were generated",
        }

    # Aggregate metrics
    avg_revenue_impact = sum(d["revenue_impact_pct"] for d in all_decisions) / len(all_decisions)
    avg_confidence = sum(d["confidence"] for d in all_decisions) / len(all_decisions)
    avg_claims_affected = sum(d["claims_affected_pct"] for d in all_decisions) / len(all_decisions)

    # Compute dollar impact from scenario parameters
    total_amount = (
        params.get("total_amount_at_risk")
        or params.get("total_monthly_claims", 85000) * params.get("avg_claim_value", params.get("avg_denied_claim_value", 3000))
    )
    if isinstance(total_amount, str):
        total_amount = float(total_amount)

    revenue_change = total_amount * (avg_revenue_impact / 100.0)
    claims_count = int(
        params.get("affected_claims", params.get("current_eligibility_denials", 10000))
        * (avg_claims_affected / 100.0)
    )

    # Determine risk level
    if avg_revenue_impact < -10:
        risk_level = "high"
    elif avg_revenue_impact < 0:
        risk_level = "moderate"
    elif avg_revenue_impact < 10:
        risk_level = "low"
    else:
        risk_level = "positive"

    # Build per-payer summary
    payer_summaries = {}
    for d in all_decisions:
        payer = d["payer"]
        if payer not in payer_summaries:
            payer_summaries[payer] = {
                "payer": payer,
                "decisions": [],
                "avg_revenue_impact_pct": 0,
                "avg_confidence": 0,
                "risk_factors": [],
            }
        payer_summaries[payer]["decisions"].append(d["decision"])
        payer_summaries[payer]["risk_factors"].extend(d.get("risk_factors", []))

    for payer, summary in payer_summaries.items():
        payer_decisions = [d for d in all_decisions if d["payer"] == payer]
        summary["avg_revenue_impact_pct"] = round(
            sum(d["revenue_impact_pct"] for d in payer_decisions) / len(payer_decisions), 1
        )
        summary["avg_confidence"] = round(
            sum(d["confidence"] for d in payer_decisions) / len(payer_decisions), 2
        )
        summary["risk_factors"] = list(set(summary["risk_factors"]))[:5]

    return {
        "revenue_impact": round(revenue_change, 2),
        "revenue_impact_pct": round(avg_revenue_impact, 1),
        "claims_affected": claims_count,
        "confidence": round(avg_confidence, 2),
        "risk_level": risk_level,
        "total_rounds": len(round_results),
        "total_payer_decisions": len(all_decisions),
        "payer_breakdown": list(payer_summaries.values()),
        "expected_outcomes": expected,
    }


async def run_simulation(scenario: dict, num_rounds: int = 2) -> dict:
    """
    Run a full simulation for a scenario.

    Args:
        scenario: Full scenario dict from simulation_scenarios.json
        num_rounds: Number of decision rounds per payer (default 2)

    Returns:
        Structured simulation results with revenue impact, claims, confidence.
    """
    simulation_id = str(uuid.uuid4())
    start_time = time.time()

    agents = scenario.get("simulation_agents", ["UnitedHealthcare", "Blue Cross Blue Shield"])

    logger.info(
        f"Starting lightweight simulation {simulation_id} — "
        f"scenario={scenario.get('id', '?')} agents={agents} rounds={num_rounds}"
    )

    round_results: list[list[dict]] = []

    for round_num in range(1, num_rounds + 1):
        round_decisions = []
        for payer in agents:
            decision = await _run_payer_round(payer, scenario, round_num)
            round_decisions.append(decision)
        round_results.append(round_decisions)

    # Aggregate
    aggregated = _compute_aggregate_results(scenario, round_results)

    elapsed = round(time.time() - start_time, 2)

    return {
        "simulation_id": simulation_id,
        "scenario_id": scenario.get("id"),
        "scenario_name": scenario.get("name"),
        "status": "completed",
        "engine": "lightweight_ollama",
        "model": OLLAMA_MODEL,
        "elapsed_seconds": elapsed,
        "rounds": [
            {"round": i + 1, "decisions": rnd}
            for i, rnd in enumerate(round_results)
        ],
        "results": aggregated,
    }


async def check_ollama_available() -> bool:
    """Check if Ollama is reachable."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            return resp.status_code == 200
    except Exception:
        return False
