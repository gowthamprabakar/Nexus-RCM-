"""
RCM Multi-Agent Simulation Engine

Orchestrates payer digital twin agents to run 5 scenario types:
1. Claim Submission Sim - batch claims through payer agents
2. Root Cause Validation - agents debate root cause correctness
3. Automation Testing - test automation rules via agent simulation
4. Policy Change Impact - simulate payer rule changes
5. Appeal Outcome Prediction - predict appeal success

Multi-agent flow per scenario:
  Round 1: Payer agents receive claims → independent decisions
  Round 2: Root cause agent analyzes denial patterns
  Round 3: Automation agent proposes fixes → payer agents validate
  Round 4: Report agent synthesizes → actionable recommendations
"""

import os
import json
import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum

from ..utils.logger import get_logger
from ..utils.llm_client import LLMClient

logger = get_logger('mirofish.rcm_simulation')


class SimulationType(str, Enum):
    CLAIM_SUBMISSION = "claim_submission"
    ROOT_CAUSE_VALIDATION = "root_cause_validation"
    AUTOMATION_TESTING = "automation_testing"
    POLICY_CHANGE = "policy_change"
    APPEAL_PREDICTION = "appeal_prediction"


class SimulationStatus(str, Enum):
    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class SimulationRound:
    round_number: int
    round_type: str  # "payer_decisions", "root_cause_analysis", "automation_proposal", "synthesis"
    decisions: List[Dict[str, Any]]
    summary: str
    started_at: str
    completed_at: str = ""
    duration_seconds: float = 0


@dataclass
class SimulationResult:
    simulation_id: str
    scenario_id: str
    scenario_name: str
    simulation_type: SimulationType
    status: SimulationStatus
    rounds: List[SimulationRound]
    aggregate_results: Dict[str, Any]
    agent_count: int
    total_rounds: int
    started_at: str
    completed_at: str = ""
    elapsed_seconds: float = 0
    engine: str = "mirofish_rcm"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "simulation_id": self.simulation_id,
            "scenario_id": self.scenario_id,
            "scenario_name": self.scenario_name,
            "simulation_type": self.simulation_type.value,
            "status": self.status.value,
            "rounds": [
                {
                    "round_number": r.round_number,
                    "round_type": r.round_type,
                    "decisions_count": len(r.decisions),
                    "summary": r.summary,
                    "duration_seconds": r.duration_seconds
                } for r in self.rounds
            ],
            "aggregate_results": self.aggregate_results,
            "agent_count": self.agent_count,
            "total_rounds": self.total_rounds,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "elapsed_seconds": self.elapsed_seconds,
            "engine": self.engine
        }


class RCMSimulationEngine:
    """Multi-agent RCM simulation engine"""

    def __init__(self, llm_client: LLMClient = None):
        self.llm_client = llm_client or LLMClient()
        self._agent_generator = None
        self._graph_tools = None
        self.active_simulations: Dict[str, SimulationResult] = {}

    async def _get_agent_generator(self):
        if self._agent_generator is None:
            from .rcm_agent_generator import get_agent_generator
            self._agent_generator = await get_agent_generator()
        return self._agent_generator

    async def _get_graph_tools(self):
        if self._graph_tools is None:
            try:
                from .rcm_graph_tools import RCMGraphToolsService
                self._graph_tools = RCMGraphToolsService()
            except Exception as e:
                logger.warning(f"Graph tools not available: {e}")
        return self._graph_tools

    async def run_simulation(self, scenario: Dict[str, Any], num_rounds: int = 4) -> SimulationResult:
        """Run a full multi-agent simulation for an RCM scenario"""
        sim_id = str(uuid.uuid4())[:8]
        scenario_id = scenario.get('scenario_id', f'custom_{sim_id}')
        scenario_name = scenario.get('name', scenario.get('scenario_name', 'Custom Scenario'))
        sim_type = self._detect_simulation_type(scenario)

        started_at = datetime.now()

        result = SimulationResult(
            simulation_id=sim_id,
            scenario_id=scenario_id,
            scenario_name=scenario_name,
            simulation_type=sim_type,
            status=SimulationStatus.RUNNING,
            rounds=[],
            aggregate_results={},
            agent_count=0,
            total_rounds=num_rounds,
            started_at=started_at.isoformat()
        )
        self.active_simulations[sim_id] = result

        try:
            agent_gen = await self._get_agent_generator()

            # Round 1: Payer agents make independent decisions
            logger.info(f"[{sim_id}] Round 1: Payer agent decisions")
            round1_start = datetime.now()
            decisions = await agent_gen.evaluate_scenario(scenario)
            round1 = SimulationRound(
                round_number=1,
                round_type="payer_decisions",
                decisions=[d.to_dict() for d in decisions],
                summary=f"{len(decisions)} payer agents evaluated scenario. "
                        f"Actions: {self._summarize_actions(decisions)}",
                started_at=round1_start.isoformat(),
                completed_at=datetime.now().isoformat(),
                duration_seconds=(datetime.now() - round1_start).total_seconds()
            )
            result.rounds.append(round1)
            result.agent_count = len(decisions)

            # Store decisions in Graphiti
            await self._store_round_in_graph(sim_id, round1, scenario)

            # Round 2: Root cause analysis agent
            logger.info(f"[{sim_id}] Round 2: Root cause analysis")
            round2_start = datetime.now()
            rc_analysis = await self._run_root_cause_round(decisions, scenario)
            round2 = SimulationRound(
                round_number=2,
                round_type="root_cause_analysis",
                decisions=[rc_analysis],
                summary=rc_analysis.get('summary', 'Root cause analysis complete'),
                started_at=round2_start.isoformat(),
                completed_at=datetime.now().isoformat(),
                duration_seconds=(datetime.now() - round2_start).total_seconds()
            )
            result.rounds.append(round2)

            # Round 3: Automation agent proposes fixes, payer agents validate
            logger.info(f"[{sim_id}] Round 3: Automation validation")
            round3_start = datetime.now()
            automation_results = await self._run_automation_round(decisions, rc_analysis, scenario)
            round3 = SimulationRound(
                round_number=3,
                round_type="automation_validation",
                decisions=[automation_results],
                summary=automation_results.get('summary', 'Automation proposals validated'),
                started_at=round3_start.isoformat(),
                completed_at=datetime.now().isoformat(),
                duration_seconds=(datetime.now() - round3_start).total_seconds()
            )
            result.rounds.append(round3)

            # Round 4: Synthesis — produce actionable recommendations
            logger.info(f"[{sim_id}] Round 4: Synthesis & recommendations")
            round4_start = datetime.now()
            synthesis = await self._run_synthesis_round(result.rounds, scenario)
            round4 = SimulationRound(
                round_number=4,
                round_type="synthesis",
                decisions=[synthesis],
                summary=synthesis.get('executive_summary', 'Simulation complete'),
                started_at=round4_start.isoformat(),
                completed_at=datetime.now().isoformat(),
                duration_seconds=(datetime.now() - round4_start).total_seconds()
            )
            result.rounds.append(round4)

            # Aggregate results
            result.aggregate_results = self._compute_aggregate(decisions, rc_analysis, automation_results, synthesis)
            result.status = SimulationStatus.COMPLETED
            result.completed_at = datetime.now().isoformat()
            result.elapsed_seconds = (datetime.now() - started_at).total_seconds()

            logger.info(f"[{sim_id}] Simulation complete in {result.elapsed_seconds:.1f}s")

        except Exception as e:
            logger.error(f"[{sim_id}] Simulation failed: {e}")
            result.status = SimulationStatus.FAILED
            result.aggregate_results = {"error": str(e)}
            result.completed_at = datetime.now().isoformat()
            result.elapsed_seconds = (datetime.now() - started_at).total_seconds()

        return result

    async def _run_root_cause_round(self, payer_decisions: list, scenario: Dict) -> Dict:
        """Root cause agent analyzes denial patterns from payer decisions"""
        denial_decisions = [d.to_dict() for d in payer_decisions if d.action.value in ('DENY_CLAIM', 'UNDERPAY')]

        prompt = f"""You are the RCM Root Cause Analysis Agent. Analyze the payer decisions from Round 1.

SCENARIO: {scenario.get('name', 'Unknown')}
PAYER DECISIONS:
{json.dumps([{'agent': d['agent_name'], 'action': d['action'], 'reasoning': d['reasoning'][:200]} for d in denial_decisions[:10]], indent=2)}

Identify:
1. Systemic denial patterns across payers
2. Common root causes
3. Which denials are preventable
4. Cross-payer correlation (do multiple payers deny for the same reason?)

Respond with JSON:
{{
    "systemic_patterns": ["list of patterns found"],
    "root_causes_identified": [
        {{"cause": "name", "affected_payers": ["list"], "preventable": true/false, "impact_estimate": "$X"}}
    ],
    "cross_payer_correlation": "description",
    "preventable_percentage": 0-100,
    "summary": "one paragraph summary"
}}"""

        try:
            result = self.llm_client.chat_json([
                {"role": "system", "content": "You are an expert RCM root cause analysis agent. Analyze denial patterns with precision."},
                {"role": "user", "content": prompt}
            ], temperature=0.3, max_tokens=1000)
            return result if isinstance(result, dict) else {"summary": str(result)}
        except Exception as e:
            return {"summary": f"Root cause analysis failed: {e}", "error": str(e)}

    async def _run_automation_round(self, decisions: list, rc_analysis: Dict, scenario: Dict) -> Dict:
        """Automation agent proposes fixes, payer agents validate them"""

        prompt = f"""You are the RCM Automation Agent. Based on root cause analysis, propose automated fixes.

ROOT CAUSE FINDINGS:
{json.dumps(rc_analysis, indent=2, default=str)[:1000]}

SCENARIO: {scenario.get('name', 'Unknown')}

Propose automation rules that would prevent or fix these issues. For each:
1. What it automates
2. Expected success rate
3. Estimated financial impact
4. Implementation complexity (low/medium/high)

Respond with JSON:
{{
    "proposed_automations": [
        {{
            "name": "automation name",
            "description": "what it does",
            "target_root_cause": "which root cause it addresses",
            "expected_success_rate": 0.0-1.0,
            "estimated_savings_per_claim": 0,
            "claims_affected": 0,
            "total_impact": 0,
            "complexity": "low|medium|high"
        }}
    ],
    "total_estimated_savings": 0,
    "implementation_priority": ["ordered list of automation names"],
    "summary": "one paragraph summary"
}}"""

        try:
            result = self.llm_client.chat_json([
                {"role": "system", "content": "You are an expert RCM automation engineer. Propose practical, high-ROI automation solutions."},
                {"role": "user", "content": prompt}
            ], temperature=0.3, max_tokens=1000)

            # Now validate each proposed automation with payer agents
            agent_gen = await self._get_agent_generator()
            proposed = result.get('proposed_automations', [])
            validated = []

            for auto in proposed[:3]:  # Validate top 3
                validation = await agent_gen.validate_suggestion({
                    "type": "automation",
                    "name": auto.get('name', ''),
                    "description": auto.get('description', ''),
                    "target": auto.get('target_root_cause', '')
                })
                auto['payer_validation'] = validation
                validated.append(auto)

            result['proposed_automations'] = validated
            return result if isinstance(result, dict) else {"summary": str(result)}
        except Exception as e:
            return {"summary": f"Automation round failed: {e}", "error": str(e)}

    async def _run_synthesis_round(self, rounds: List[SimulationRound], scenario: Dict) -> Dict:
        """Final synthesis — produce actionable recommendations"""

        round_summaries = [f"Round {r.round_number} ({r.round_type}): {r.summary}" for r in rounds]

        prompt = f"""You are the RCM Executive Report Agent. Synthesize all simulation rounds into actionable recommendations.

SCENARIO: {scenario.get('name', 'Unknown')}
SIMULATION ROUNDS:
{chr(10).join(round_summaries)}

Produce:
1. Executive summary (2-3 sentences)
2. Key findings (top 5)
3. Recommended actions (prioritized)
4. Risk assessment
5. Expected ROI

Respond with JSON:
{{
    "executive_summary": "summary",
    "key_findings": ["finding1", "finding2"],
    "recommended_actions": [
        {{"action": "description", "priority": "P0|P1|P2", "expected_impact": "$X", "effort": "low|medium|high"}}
    ],
    "risk_level": "low|moderate|high|critical",
    "expected_roi": "X.Xx",
    "confidence_score": 0.0-1.0
}}"""

        try:
            result = self.llm_client.chat_json([
                {"role": "system", "content": "You are a senior RCM executive advisor. Provide clear, actionable recommendations."},
                {"role": "user", "content": prompt}
            ], temperature=0.3, max_tokens=800)
            return result if isinstance(result, dict) else {"executive_summary": str(result)}
        except Exception as e:
            return {"executive_summary": f"Synthesis failed: {e}", "error": str(e)}

    async def _store_round_in_graph(self, sim_id: str, round_data: SimulationRound, scenario: Dict):
        """Store simulation round results in Graphiti for agent memory"""
        try:
            from .rcm_graph_builder import get_graph_builder
            from graphiti_core.nodes import EpisodeType
            builder = await get_graph_builder()

            episode_text = (
                f"Simulation {sim_id} Round {round_data.round_number} ({round_data.round_type}): "
                f"{round_data.summary}. "
                f"Scenario: {scenario.get('name', 'Unknown')}. "
                f"Decisions: {len(round_data.decisions)}."
            )

            await builder.graphiti.add_episode(
                name=f"sim_{sim_id}_round_{round_data.round_number}",
                episode_body=episode_text,
                source=EpisodeType.text,
                source_description=f"RCM Simulation - {scenario.get('name', '')}",
                reference_time=datetime.now()
            )
        except Exception as e:
            logger.debug(f"Failed to store round in graph: {e}")

    def _detect_simulation_type(self, scenario: Dict) -> SimulationType:
        """Detect simulation type from scenario data"""
        sim_type = scenario.get('type', scenario.get('simulation_type', '')).lower()
        name = scenario.get('name', scenario.get('scenario_name', '')).lower()

        if 'appeal' in name or 'appeal' in sim_type:
            return SimulationType.APPEAL_PREDICTION
        elif 'root_cause' in sim_type or 'validation' in sim_type:
            return SimulationType.ROOT_CAUSE_VALIDATION
        elif 'automation' in sim_type or 'auto' in name:
            return SimulationType.AUTOMATION_TESTING
        elif 'policy' in sim_type or 'change' in name or 'increase' in name:
            return SimulationType.POLICY_CHANGE
        else:
            return SimulationType.CLAIM_SUBMISSION

    def _summarize_actions(self, decisions) -> str:
        from collections import Counter
        actions = Counter(d.action.value for d in decisions)
        return ', '.join(f"{k}: {v}" for k, v in actions.items())

    def _compute_aggregate(self, decisions, rc_analysis, automation, synthesis) -> Dict:
        """Compute aggregate results across all rounds"""
        avg_confidence = sum(d.confidence for d in decisions) / len(decisions) if decisions else 0
        avg_revenue_impact = sum(d.revenue_impact_pct for d in decisions) / len(decisions) if decisions else 0

        deny_count = sum(1 for d in decisions if d.action.value == 'DENY_CLAIM')
        approve_count = sum(1 for d in decisions if d.action.value == 'APPROVE_CLAIM')

        return {
            "payer_consensus": {
                "approve": approve_count,
                "deny": deny_count,
                "other": len(decisions) - approve_count - deny_count,
                "denial_rate": deny_count / len(decisions) * 100 if decisions else 0
            },
            "average_confidence": round(avg_confidence, 3),
            "average_revenue_impact_pct": round(avg_revenue_impact, 2),
            "root_cause_findings": rc_analysis.get('root_causes_identified', [])[:5],
            "preventable_percentage": rc_analysis.get('preventable_percentage', 0),
            "proposed_automations": len(automation.get('proposed_automations', [])),
            "total_estimated_savings": automation.get('total_estimated_savings', 0),
            "risk_level": synthesis.get('risk_level', 'moderate'),
            "expected_roi": synthesis.get('expected_roi', 'N/A'),
            "recommendation": synthesis.get('recommended_actions', [])[:3],
            "executive_summary": synthesis.get('executive_summary', '')
        }

    def get_simulation(self, sim_id: str) -> Optional[SimulationResult]:
        return self.active_simulations.get(sim_id)

    def get_all_simulations(self) -> List[Dict]:
        return [s.to_dict() for s in self.active_simulations.values()]


# Singleton
_simulation_engine: Optional[RCMSimulationEngine] = None

async def get_simulation_engine() -> RCMSimulationEngine:
    global _simulation_engine
    if _simulation_engine is None:
        _simulation_engine = RCMSimulationEngine()
    return _simulation_engine
