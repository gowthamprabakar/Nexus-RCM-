"""
RCM Payer Digital Twin Agent Generator

Generates intelligent payer agents that:
1. Have personas built from live database data
2. Can reason about claims using LLM + knowledge graph memory
3. Accumulate experience across simulations via Graphiti
4. Make decisions: APPROVE, DENY, REQUEST_INFO, UNDERPAY, DELAY, REVERSE_ON_APPEAL
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum

from ..utils.logger import get_logger
from ..utils.llm_client import LLMClient

logger = get_logger('mirofish.rcm_agents')


class PayerAction(str, Enum):
    APPROVE_CLAIM = "APPROVE_CLAIM"
    DENY_CLAIM = "DENY_CLAIM"
    REQUEST_INFO = "REQUEST_INFO"
    UNDERPAY = "UNDERPAY"
    DELAY_PAYMENT = "DELAY_PAYMENT"
    REVERSE_ON_APPEAL = "REVERSE_ON_APPEAL"


@dataclass
class PayerAgentProfile:
    """Digital twin profile for a payer"""
    agent_id: str
    name: str
    payer_group: str
    persona: str
    behavior: Dict[str, Any]
    decision_rules: List[str]
    root_cause_distribution: List[Dict[str, Any]]
    payment_profile: Dict[str, Any]
    memory_context: List[str] = field(default_factory=list)  # From Graphiti

    def to_system_prompt(self) -> str:
        """Generate LLM system prompt for this payer agent"""
        return f"""You are {self.name}, a {self.payer_group} healthcare payer digital twin agent.

IDENTITY:
{self.persona}

BEHAVIOR METRICS:
- Denial Rate: {self.behavior.get('denial_rate', 'N/A')}%
- Average Days to Pay: {self.behavior.get('avg_days_to_pay', 'N/A')} days
- First Pass Rate: {self.behavior.get('first_pass_rate', 'N/A')}%
- Appeal Reversal Rate: {self.behavior.get('appeal_reversal_rate', 'N/A')}%
- Payment Accuracy: {self.behavior.get('payment_accuracy', 'N/A')}%
- Claim Volume: {self.behavior.get('claim_volume', 'N/A')}
- Denial Count: {self.behavior.get('denial_count', 'N/A')}

TOP DENIAL REASONS: {', '.join(str(r) for r in self.behavior.get('top_denial_reasons', [])[:5])}

DECISION RULES:
{chr(10).join(f'- {rule}' for rule in self.decision_rules[:10])}

ROOT CAUSE PATTERNS:
{chr(10).join(f'- {rc.get("root_cause","?")}: {rc.get("count",0)} claims, ${rc.get("impact",0):,.0f} impact' for rc in self.root_cause_distribution[:5])}

HISTORICAL MEMORY:
{chr(10).join(f'- {mem}' for mem in self.memory_context[:10]) if self.memory_context else '- No prior simulation history'}

INSTRUCTIONS:
You must respond as this payer. When evaluating claims, scenarios, or automation proposals:
1. Use your specific denial patterns and decision rules
2. Reference your historical behavior data
3. Be realistic about how you would actually respond
4. Provide specific reasoning tied to your metrics

Available actions: APPROVE_CLAIM, DENY_CLAIM, REQUEST_INFO, UNDERPAY, DELAY_PAYMENT, REVERSE_ON_APPEAL"""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "payer_group": self.payer_group,
            "persona": self.persona,
            "behavior": self.behavior,
            "decision_rules": self.decision_rules,
            "root_cause_distribution": self.root_cause_distribution,
            "payment_profile": self.payment_profile,
            "has_memory": len(self.memory_context) > 0
        }


@dataclass
class AgentDecision:
    """A single decision made by a payer agent"""
    agent_id: str
    agent_name: str
    action: PayerAction
    reasoning: str
    confidence: float
    claims_affected_pct: float
    revenue_impact_pct: float
    risk_factors: List[str]
    recommendations: List[str]
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "action": self.action.value,
            "reasoning": self.reasoning,
            "confidence": self.confidence,
            "claims_affected_pct": self.claims_affected_pct,
            "revenue_impact_pct": self.revenue_impact_pct,
            "risk_factors": self.risk_factors,
            "recommendations": self.recommendations,
            "timestamp": self.timestamp
        }


class RCMAgentGenerator:
    """Generates and manages RCM payer digital twin agents"""

    def __init__(self, llm_client: LLMClient = None):
        self.llm_client = llm_client or LLMClient()
        self.agents: Dict[str, PayerAgentProfile] = {}
        self._graphiti = None

    async def _get_graphiti(self):
        """Lazy-load Graphiti for agent memory"""
        if self._graphiti is None:
            try:
                from .rcm_graph_builder import get_graph_builder
                builder = await get_graph_builder()
                self._graphiti = builder.graphiti
            except Exception as e:
                logger.warning(f"Graphiti not available for agent memory: {e}")
        return self._graphiti

    async def generate_agents(self, rcm_api_url: str = None) -> List[PayerAgentProfile]:
        """Generate payer digital twin agents from live RCM data"""
        import httpx

        rcm_base = rcm_api_url or os.environ.get('RCM_API_URL', 'http://localhost:8000/api/v1')

        # Fetch live payer agent data from RCM backend
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{rcm_base}/simulation/payer-agents/live")
                if resp.status_code == 200:
                    payer_data = resp.json()
                else:
                    payer_data = []
        except Exception as e:
            logger.warning(f"Failed to fetch live payer data: {e}, using seed data")
            payer_data = self._load_seed_agents()

        if not payer_data:
            payer_data = self._load_seed_agents()

        agents = []
        for payer in (payer_data if isinstance(payer_data, list) else []):
            # Fetch Graphiti memory for this payer
            memory_context = await self._fetch_agent_memory(payer.get('name', ''))

            agent = PayerAgentProfile(
                agent_id=payer.get('agent_id', payer.get('payer_id', '')),
                name=payer.get('name', 'Unknown'),
                payer_group=payer.get('payer_group', 'Unknown'),
                persona=payer.get('persona', f"I am {payer.get('name', 'Unknown')}, a healthcare payer."),
                behavior=payer.get('behavior', {}),
                decision_rules=payer.get('decision_rules', []),
                root_cause_distribution=payer.get('root_cause_distribution', []),
                payment_profile=payer.get('payment_profile', {}),
                memory_context=memory_context
            )
            agents.append(agent)
            self.agents[agent.agent_id] = agent
            logger.info(f"Generated agent: {agent.name} ({agent.agent_id}) with {len(memory_context)} memories")

        logger.info(f"Generated {len(agents)} payer digital twin agents")
        return agents

    async def evaluate_claim(self, agent_id: str, claim_context: Dict[str, Any]) -> AgentDecision:
        """Have a specific payer agent evaluate a claim"""
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found. Call generate_agents() first.")

        prompt = f"""Evaluate this claim scenario and make a decision:

CLAIM CONTEXT:
{json.dumps(claim_context, indent=2, default=str)}

Respond with JSON:
{{
    "action": "APPROVE_CLAIM|DENY_CLAIM|REQUEST_INFO|UNDERPAY|DELAY_PAYMENT",
    "reasoning": "detailed explanation of your decision based on your payer behavior",
    "confidence": 0.0-1.0,
    "claims_affected_pct": percentage of similar claims this would affect,
    "revenue_impact_pct": estimated revenue impact percentage,
    "risk_factors": ["list of risk factors identified"],
    "recommendations": ["list of recommendations for the provider"]
}}"""

        try:
            result = self.llm_client.chat_json([
                {"role": "system", "content": agent.to_system_prompt()},
                {"role": "user", "content": prompt}
            ], temperature=0.3, max_tokens=800)

            action_str = result.get('action', 'DENY_CLAIM')
            try:
                action = PayerAction(action_str)
            except ValueError:
                action = PayerAction.DENY_CLAIM

            decision = AgentDecision(
                agent_id=agent.agent_id,
                agent_name=agent.name,
                action=action,
                reasoning=result.get('reasoning', 'No reasoning provided'),
                confidence=float(result.get('confidence', 0.5)),
                claims_affected_pct=float(result.get('claims_affected_pct', 0)),
                revenue_impact_pct=float(result.get('revenue_impact_pct', 0)),
                risk_factors=result.get('risk_factors', []),
                recommendations=result.get('recommendations', [])
            )

            # Store decision in Graphiti memory
            await self._store_decision_memory(agent, decision, claim_context)

            return decision

        except Exception as e:
            logger.error(f"Agent {agent.name} evaluation failed: {e}")
            return AgentDecision(
                agent_id=agent.agent_id,
                agent_name=agent.name,
                action=PayerAction.DENY_CLAIM,
                reasoning=f"Evaluation failed: {str(e)}. Defaulting to deny based on {agent.name}'s {agent.behavior.get('denial_rate', 'N/A')}% denial rate.",
                confidence=0.3,
                claims_affected_pct=0,
                revenue_impact_pct=0,
                risk_factors=["evaluation_failure"],
                recommendations=["Manual review required"]
            )

    async def evaluate_scenario(self, scenario: Dict[str, Any]) -> List[AgentDecision]:
        """Have ALL agents evaluate a scenario in parallel"""
        if not self.agents:
            await self.generate_agents()

        # Determine which agents are relevant to this scenario
        target_payers = scenario.get('agents', scenario.get('payers', []))
        if target_payers:
            relevant_agents = [a for a in self.agents.values()
                             if a.name in target_payers or a.agent_id in target_payers]
        else:
            relevant_agents = list(self.agents.values())

        # Run all agent evaluations in parallel
        tasks = [
            self.evaluate_claim(agent.agent_id, scenario)
            for agent in relevant_agents
        ]

        decisions = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions
        valid_decisions = []
        for d in decisions:
            if isinstance(d, AgentDecision):
                valid_decisions.append(d)
            elif isinstance(d, Exception):
                logger.error(f"Agent evaluation failed: {d}")

        return valid_decisions

    async def validate_suggestion(self, suggestion: Dict[str, Any]) -> Dict[str, Any]:
        """Have agents validate a suggestion/automation before showing to user"""
        if not self.agents:
            await self.generate_agents()

        validation_prompt = f"""VALIDATION REQUEST:
A system is proposing this action to a user. As a payer, evaluate whether this would actually work.

PROPOSED ACTION:
{json.dumps(suggestion, indent=2, default=str)}

Respond with JSON:
{{
    "would_succeed": true/false,
    "success_probability": 0.0-1.0,
    "reasoning": "why this would or would not work from your perspective",
    "potential_issues": ["list of issues"],
    "modifications_needed": ["list of suggested modifications"],
    "estimated_impact": "description of financial impact"
}}"""

        # Ask top 3 most relevant agents
        relevant = list(self.agents.values())[:3]
        validations = []

        for agent in relevant:
            try:
                result = self.llm_client.chat_json([
                    {"role": "system", "content": agent.to_system_prompt()},
                    {"role": "user", "content": validation_prompt}
                ], temperature=0.3, max_tokens=600)

                validations.append({
                    "agent": agent.name,
                    "would_succeed": result.get('would_succeed', False),
                    "success_probability": result.get('success_probability', 0.5),
                    "reasoning": result.get('reasoning', ''),
                    "potential_issues": result.get('potential_issues', []),
                    "modifications_needed": result.get('modifications_needed', []),
                    "estimated_impact": result.get('estimated_impact', '')
                })
            except Exception as e:
                logger.error(f"Validation by {agent.name} failed: {e}")

        # Aggregate validation results
        if validations:
            avg_probability = sum(v['success_probability'] for v in validations) / len(validations)
            consensus = sum(1 for v in validations if v['would_succeed']) / len(validations)
            all_issues = []
            all_mods = []
            for v in validations:
                all_issues.extend(v.get('potential_issues', []))
                all_mods.extend(v.get('modifications_needed', []))
        else:
            avg_probability = 0.5
            consensus = 0.5
            all_issues = ["No agents available for validation"]
            all_mods = []

        return {
            "validated": consensus > 0.5,
            "confidence": avg_probability,
            "consensus": consensus,
            "agents_consulted": len(validations),
            "validations": validations,
            "all_issues": list(set(all_issues)),
            "all_modifications": list(set(all_mods)),
            "recommendation": "PROCEED" if consensus > 0.6 else "REVIEW" if consensus > 0.3 else "REJECT"
        }

    async def _fetch_agent_memory(self, payer_name: str) -> List[str]:
        """Fetch historical memory for an agent from Graphiti"""
        graphiti = await self._get_graphiti()
        if not graphiti:
            return []

        try:
            results = await graphiti.search(f"{payer_name} payer decisions history", num_results=10)
            memories = []
            for edge in results:
                fact = edge.fact if hasattr(edge, 'fact') else str(edge)
                memories.append(fact)
            return memories
        except Exception as e:
            logger.debug(f"No Graphiti memory for {payer_name}: {e}")
            return []

    async def _store_decision_memory(self, agent: PayerAgentProfile, decision: AgentDecision, context: Dict):
        """Store agent decision in Graphiti for future memory"""
        graphiti = await self._get_graphiti()
        if not graphiti:
            return

        try:
            from graphiti_core.nodes import EpisodeType
            episode_text = (
                f"{agent.name} made decision {decision.action.value} "
                f"with {decision.confidence:.0%} confidence. "
                f"Reasoning: {decision.reasoning[:200]}. "
                f"Revenue impact: {decision.revenue_impact_pct}%."
            )

            await graphiti.add_episode(
                name=f"decision_{agent.agent_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                episode_body=episode_text,
                source=EpisodeType.text,
                source_description=f"Agent Decision - {agent.name}",
                reference_time=datetime.now()
            )
            logger.debug(f"Stored decision memory for {agent.name}")
        except Exception as e:
            logger.debug(f"Failed to store decision memory: {e}")

    def _load_seed_agents(self) -> List[Dict]:
        """Load fallback agent data from seed file"""
        seed_path = os.path.join(
            os.path.dirname(__file__), '..', '..', '..',
            'rcm_seeds', 'payer_agents.json'
        )
        try:
            with open(seed_path, 'r') as f:
                data = json.load(f)
            return data if isinstance(data, list) else data.get('agents', [])
        except Exception as e:
            logger.error(f"Failed to load seed agents: {e}")
            return []

    def get_agent(self, agent_id: str) -> Optional[PayerAgentProfile]:
        return self.agents.get(agent_id)

    def get_all_agents(self) -> List[PayerAgentProfile]:
        return list(self.agents.values())


# Singleton
_agent_generator: Optional[RCMAgentGenerator] = None

async def get_agent_generator() -> RCMAgentGenerator:
    global _agent_generator
    if _agent_generator is None:
        _agent_generator = RCMAgentGenerator()
        await _agent_generator.generate_agents()
    return _agent_generator
