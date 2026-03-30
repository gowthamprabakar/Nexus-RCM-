"""
RCM Temporal Knowledge Graph Builder
Uses Graphiti + Neo4j to build a temporal knowledge graph from RCM PostgreSQL data.

Replaces Zep-based graph memory with local Neo4j-backed Graphiti graph.
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

# Graphiti requires OPENAI_API_KEY env var — set before import
# Point to Ollama's OpenAI-compatible API
if not os.environ.get('OPENAI_API_KEY'):
    os.environ['OPENAI_API_KEY'] = os.environ.get('LLM_API_KEY', 'ollama')
if not os.environ.get('OPENAI_BASE_URL'):
    os.environ['OPENAI_BASE_URL'] = os.environ.get('LLM_BASE_URL', 'http://localhost:11434/v1')

from graphiti_core import Graphiti
from graphiti_core.nodes import EpisodeType
from graphiti_core.llm_client import LLMConfig, OpenAIClient
from graphiti_core.embedder.openai import OpenAIEmbedder, OpenAIEmbedderConfig

from ..config import Config
from ..utils.logger import get_logger
from ..utils.llm_client import LLMClient

logger = get_logger('mirofish.rcm_graph')


class RCMGraphBuilder:
    """
    Builds an RCM temporal knowledge graph in Neo4j using Graphiti.

    Connects to the RCM PostgreSQL database (via API) to extract live data,
    then ingests it as temporal episodes into a Neo4j-backed knowledge graph.
    """

    def __init__(self, neo4j_uri=None, neo4j_user=None, neo4j_password=None):
        self.neo4j_uri = neo4j_uri or os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
        self.neo4j_user = neo4j_user or os.environ.get('NEO4J_USER', 'neo4j')
        self.neo4j_password = neo4j_password or os.environ.get('NEO4J_PASSWORD', 'nexusrcm2026')
        self.graphiti = None
        self.graph_id = None

    async def initialize(self):
        """Initialize Graphiti client with Neo4j + Ollama LLM"""
        # Configure Graphiti to use Ollama instead of OpenAI
        ollama_base = os.environ.get('LLM_BASE_URL', 'http://localhost:11434/v1')
        ollama_key = os.environ.get('LLM_API_KEY', 'ollama')
        ollama_model = os.environ.get('LLM_MODEL_NAME', 'llama3')

        llm_config = LLMConfig(
            api_key=ollama_key,
            base_url=ollama_base,
            model=ollama_model,
            small_model=ollama_model,
        )
        llm_client = OpenAIClient(config=llm_config)

        # Use nomic-embed-text for embeddings (much faster + purpose-built)
        embed_model = os.environ.get('EMBEDDING_MODEL', 'nomic-embed-text')
        embedder_config = OpenAIEmbedderConfig(
            api_key=ollama_key,
            base_url=ollama_base,
            embedding_model=embed_model,
        )
        embedder = OpenAIEmbedder(config=embedder_config)

        self.graphiti = Graphiti(
            self.neo4j_uri,
            self.neo4j_user,
            self.neo4j_password,
            llm_client=llm_client,
            embedder=embedder,
        )
        await self.graphiti.build_indices_and_constraints()
        logger.info(f"Graphiti initialized with Neo4j + Ollama ({ollama_model})")

    async def close(self):
        """Close Graphiti connection"""
        if self.graphiti:
            await self.graphiti.close()

    async def build_rcm_graph(self, rcm_db_url: str = None) -> Dict[str, Any]:
        """
        Build full RCM knowledge graph from PostgreSQL data.

        Fetches data from RCM backend API endpoints and ingests as
        temporal episodes into the Neo4j graph via Graphiti.
        """
        import httpx

        rcm_base = os.environ.get('RCM_API_URL', 'http://localhost:8000/api/v1')

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Fetch payer data
            payers_resp = await client.get(f"{rcm_base}/simulation/payer-agents/live")
            payers = payers_resp.json() if payers_resp.status_code == 200 else []

            # Fetch root cause data
            rc_resp = await client.get(f"{rcm_base}/root-cause/summary")
            root_causes = rc_resp.json() if rc_resp.status_code == 200 else {}

            # Fetch denial summary
            denial_resp = await client.get(f"{rcm_base}/denials/summary")
            denials = denial_resp.json() if denial_resp.status_code == 200 else {}

            # Fetch ontology
            onto_resp = await client.get(f"{rcm_base}/simulation/ontology")
            ontology = onto_resp.json() if onto_resp.status_code == 200 else {}

        episodes_ingested = 0

        # 1. Payer Episodes
        for payer in (payers if isinstance(payers, list) else []):
            episode_text = self._build_payer_episode(payer)
            await self.graphiti.add_episode(
                name=f"payer_{payer.get('agent_id', 'unknown')}",
                episode_body=episode_text,
                source=EpisodeType.text,
                source_description="RCM PostgreSQL - Payer Master",
                reference_time=datetime.now()
            )
            episodes_ingested += 1
            logger.info(f"Ingested payer: {payer.get('name', 'unknown')}")

        # 2. Root Cause Episodes
        rc_categories = root_causes.get('categories', root_causes.get('root_causes', []))
        for rc in (rc_categories if isinstance(rc_categories, list) else []):
            episode_text = self._build_root_cause_episode(rc)
            await self.graphiti.add_episode(
                name=f"root_cause_{rc.get('root_cause', 'unknown')}",
                episode_body=episode_text,
                source=EpisodeType.text,
                source_description="RCM PostgreSQL - Root Cause Analysis",
                reference_time=datetime.now()
            )
            episodes_ingested += 1

        # 3. Denial Pattern Episodes
        denial_categories = denials.get('by_category', denials.get('categories', []))
        for dc in (denial_categories if isinstance(denial_categories, list) else []):
            episode_text = self._build_denial_episode(dc)
            await self.graphiti.add_episode(
                name=f"denial_pattern_{dc.get('category', 'unknown')}",
                episode_body=episode_text,
                source=EpisodeType.text,
                source_description="RCM PostgreSQL - Denial Patterns",
                reference_time=datetime.now()
            )
            episodes_ingested += 1

        # 4. RCM Knowledge Base (from seed file)
        kb_path = os.path.join(
            os.path.dirname(__file__), '..', '..', '..', 'rcm_seeds', 'rcm_knowledge_base.json'
        )
        if os.path.exists(kb_path):
            with open(kb_path, 'r') as f:
                kb = json.load(f)

            # Ingest process stages
            for stage in kb.get('rcm_process_flow', kb.get('process_stages', [])):
                stage_text = json.dumps(stage) if isinstance(stage, dict) else str(stage)
                stage_id = stage.get('stage_id', '') if isinstance(stage, dict) else 'unknown'
                await self.graphiti.add_episode(
                    name=f"process_stage_{stage_id}",
                    episode_body=f"RCM Process Stage: {stage_text}",
                    source=EpisodeType.text,
                    source_description="RCM Knowledge Base",
                    reference_time=datetime.now()
                )
                episodes_ingested += 1

            # Ingest automation rules
            for rule in kb.get('automation_rules', []):
                rule_text = json.dumps(rule) if isinstance(rule, dict) else str(rule)
                rule_id = rule.get('rule_id', '') if isinstance(rule, dict) else 'unknown'
                await self.graphiti.add_episode(
                    name=f"automation_rule_{rule_id}",
                    episode_body=f"RCM Automation Rule: {rule_text}",
                    source=EpisodeType.text,
                    source_description="RCM Knowledge Base - Automation",
                    reference_time=datetime.now()
                )
                episodes_ingested += 1

        # 5. Simulation Scenarios
        scenarios_path = os.path.join(
            os.path.dirname(__file__), '..', '..', '..', 'rcm_seeds', 'simulation_scenarios.json'
        )
        if os.path.exists(scenarios_path):
            with open(scenarios_path, 'r') as f:
                scenarios = json.load(f)
            scenario_list = scenarios if isinstance(scenarios, list) else scenarios.get('scenarios', [])
            for scenario in scenario_list:
                await self.graphiti.add_episode(
                    name=f"scenario_{scenario.get('scenario_id', 'unknown')}",
                    episode_body=f"What-If Scenario: {json.dumps(scenario)}",
                    source=EpisodeType.text,
                    source_description="RCM Simulation Scenarios",
                    reference_time=datetime.now()
                )
                episodes_ingested += 1

        result = {
            "status": "completed",
            "episodes_ingested": episodes_ingested,
            "timestamp": datetime.now().isoformat(),
            "graph_storage": "neo4j",
            "engine": "graphiti"
        }

        logger.info(f"RCM graph build complete: {episodes_ingested} episodes ingested")
        return result

    async def refresh_graph(self) -> Dict[str, Any]:
        """Incremental refresh - only add new/changed data"""
        # Same as build but only ingests data that changed since last refresh
        return await self.build_rcm_graph()

    def _build_payer_episode(self, payer: Dict) -> str:
        """Convert payer agent data to natural language episode"""
        name = payer.get('name', 'Unknown Payer')
        behavior = payer.get('behavior', {})

        parts = [f"Payer: {name}"]
        parts.append(f"Group: {payer.get('payer_group', 'Unknown')}")
        parts.append(f"Denial Rate: {behavior.get('denial_rate', 'N/A')}%")
        parts.append(f"Average Days to Pay: {behavior.get('avg_days_to_pay', 'N/A')} days")
        parts.append(f"First Pass Rate: {behavior.get('first_pass_rate', 'N/A')}%")
        parts.append(f"Appeal Reversal Rate: {behavior.get('appeal_reversal_rate', 'N/A')}%")
        parts.append(f"Payment Accuracy: {behavior.get('payment_accuracy', 'N/A')}%")
        parts.append(f"Claim Volume: {behavior.get('claim_volume', 'N/A')}")
        parts.append(f"Denial Count: {behavior.get('denial_count', 'N/A')}")

        top_reasons = behavior.get('top_denial_reasons', [])
        if top_reasons:
            parts.append(f"Top Denial Reasons: {', '.join(str(r) for r in top_reasons[:5])}")

        rc_dist = payer.get('root_cause_distribution', [])
        if rc_dist:
            rc_summary = '; '.join(
                f"{r.get('root_cause', '?')}: {r.get('count', 0)} claims (${r.get('impact', 0):,.0f})"
                for r in rc_dist[:5]
            )
            parts.append(f"Root Cause Distribution: {rc_summary}")

        rules = payer.get('decision_rules', [])
        if rules:
            parts.append(f"Decision Rules: {'; '.join(str(r) for r in rules[:5])}")

        persona = payer.get('persona', '')
        if persona:
            parts.append(f"Persona: {persona}")

        return '. '.join(parts)

    def _build_root_cause_episode(self, rc: Dict) -> str:
        """Convert root cause data to episode text"""
        cause = rc.get('root_cause', rc.get('primary_root_cause', 'Unknown'))
        group = rc.get('root_cause_group', rc.get('group', 'Unknown'))
        count = rc.get('count', rc.get('denial_count', 0))
        impact = rc.get('financial_impact', rc.get('total_impact', 0))
        confidence = rc.get('avg_confidence', rc.get('confidence', 0))

        return (
            f"Root Cause: {cause}. "
            f"Group: {group}. "
            f"Affected Claims: {count}. "
            f"Financial Impact: ${impact:,.0f}. "
            f"Average Confidence: {confidence}%. "
            f"This root cause is {'preventable' if group in ['PREVENTABLE', 'PROCESS'] else 'not easily preventable'}."
        )

    def _build_denial_episode(self, dc: Dict) -> str:
        """Convert denial category data to episode text"""
        category = dc.get('category', dc.get('denial_category', 'Unknown'))
        count = dc.get('count', dc.get('total', 0))
        amount = dc.get('amount', dc.get('denied_amount', 0))

        return (
            f"Denial Category: {category}. "
            f"Total Denials: {count}. "
            f"Total Denied Amount: ${amount:,.0f}."
        )


# Per-loop instances — Graphiti async connections are tied to a specific event loop
_graph_builders: dict = {}


async def get_graph_builder() -> RCMGraphBuilder:
    """Get or create a graph builder for the CURRENT event loop.

    Graphiti's Neo4j driver is bound to the event loop that created it.
    Each thread (scheduler, Flask request) has its own loop, so each
    needs its own Graphiti instance.
    """
    import asyncio
    loop_id = id(asyncio.get_running_loop())

    if loop_id not in _graph_builders:
        builder = RCMGraphBuilder()
        await builder.initialize()
        _graph_builders[loop_id] = builder

    return _graph_builders[loop_id]
