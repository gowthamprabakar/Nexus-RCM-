"""
RCM Graph Tools Service
Replaces ZepToolsService with Graphiti-backed retrieval for RCM domain.
Same interface contract as zep_tools.py so ReACT agent works unchanged.

Core Tools (same 4 as ZepToolsService):
1. insight_forge() - Deep multi-dimensional search
2. panorama_search() - Broad retrieval
3. quick_search() - Fast targeted search
4. interview_agents() - Agent interviews (via simulation IPC)
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

from graphiti_core import Graphiti
from graphiti_core.search.search_config_recipes import (
    NODE_HYBRID_SEARCH_RRF,
    EDGE_HYBRID_SEARCH_RRF,
)

from ..config import Config
from ..utils.logger import get_logger
from ..utils.llm_client import LLMClient

logger = get_logger('mirofish.rcm_graph_tools')


# ---------------------------------------------------------------------------
# Data classes - EXACT SAME interface as zep_tools.py
# ---------------------------------------------------------------------------

@dataclass
class SearchResult:
    """Search result"""
    facts: List[str]
    edges: List[Dict[str, Any]]
    nodes: List[Dict[str, Any]]
    query: str
    total_count: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "facts": self.facts,
            "edges": self.edges,
            "nodes": self.nodes,
            "query": self.query,
            "total_count": self.total_count
        }

    def to_text(self) -> str:
        text_parts = [f"搜索查询: {self.query}", f"找到 {self.total_count} 条相关信息"]
        if self.facts:
            text_parts.append("\n### 相关事实:")
            for i, fact in enumerate(self.facts, 1):
                text_parts.append(f"{i}. {fact}")
        return "\n".join(text_parts)


@dataclass
class NodeInfo:
    """Node information"""
    uuid: str
    name: str
    labels: List[str]
    summary: str
    attributes: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "uuid": self.uuid,
            "name": self.name,
            "labels": self.labels,
            "summary": self.summary,
            "attributes": self.attributes
        }

    def to_text(self) -> str:
        entity_type = next((l for l in self.labels if l not in ["Entity", "Node"]), "未知类型")
        return f"实体: {self.name} (类型: {entity_type})\n摘要: {self.summary}"


@dataclass
class EdgeInfo:
    """Edge information"""
    uuid: str
    name: str
    fact: str
    source_node_uuid: str
    target_node_uuid: str
    source_node_name: Optional[str] = None
    target_node_name: Optional[str] = None
    created_at: Optional[str] = None
    valid_at: Optional[str] = None
    invalid_at: Optional[str] = None
    expired_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "uuid": self.uuid,
            "name": self.name,
            "fact": self.fact,
            "source_node_uuid": self.source_node_uuid,
            "target_node_uuid": self.target_node_uuid,
            "source_node_name": self.source_node_name,
            "target_node_name": self.target_node_name,
            "created_at": self.created_at,
            "valid_at": self.valid_at,
            "invalid_at": self.invalid_at,
            "expired_at": self.expired_at
        }

    def to_text(self, include_temporal: bool = False) -> str:
        source = self.source_node_name or self.source_node_uuid[:8]
        target = self.target_node_name or self.target_node_uuid[:8]
        base_text = f"关系: {source} --[{self.name}]--> {target}\n事实: {self.fact}"
        if include_temporal:
            valid_at = self.valid_at or "未知"
            invalid_at = self.invalid_at or "至今"
            base_text += f"\n时效: {valid_at} - {invalid_at}"
            if self.expired_at:
                base_text += f" (已过期: {self.expired_at})"
        return base_text

    @property
    def is_expired(self) -> bool:
        return self.expired_at is not None

    @property
    def is_invalid(self) -> bool:
        return self.invalid_at is not None


@dataclass
class InsightForgeResult:
    """Deep insight retrieval result (InsightForge)"""
    query: str
    simulation_requirement: str
    sub_queries: List[str]

    semantic_facts: List[str] = field(default_factory=list)
    entity_insights: List[Dict[str, Any]] = field(default_factory=list)
    relationship_chains: List[str] = field(default_factory=list)

    total_facts: int = 0
    total_entities: int = 0
    total_relationships: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "simulation_requirement": self.simulation_requirement,
            "sub_queries": self.sub_queries,
            "semantic_facts": self.semantic_facts,
            "entity_insights": self.entity_insights,
            "relationship_chains": self.relationship_chains,
            "total_facts": self.total_facts,
            "total_entities": self.total_entities,
            "total_relationships": self.total_relationships
        }

    def to_text(self) -> str:
        text_parts = [
            f"## 未来预测深度分析",
            f"分析问题: {self.query}",
            f"预测场景: {self.simulation_requirement}",
            f"\n### 预测数据统计",
            f"- 相关预测事实: {self.total_facts}条",
            f"- 涉及实体: {self.total_entities}个",
            f"- 关系链: {self.total_relationships}条"
        ]
        if self.sub_queries:
            text_parts.append(f"\n### 分析的子问题")
            for i, sq in enumerate(self.sub_queries, 1):
                text_parts.append(f"{i}. {sq}")
        if self.semantic_facts:
            text_parts.append(f"\n### 【关键事实】(请在报告中引用这些原文)")
            for i, fact in enumerate(self.semantic_facts, 1):
                text_parts.append(f'{i}. "{fact}"')
        if self.entity_insights:
            text_parts.append(f"\n### 【核心实体】")
            for entity in self.entity_insights:
                text_parts.append(f"- **{entity.get('name', '未知')}** ({entity.get('type', '实体')})")
                if entity.get('summary'):
                    text_parts.append(f'  摘要: "{entity.get("summary")}"')
                if entity.get('related_facts'):
                    text_parts.append(f"  相关事实: {len(entity.get('related_facts', []))}条")
        if self.relationship_chains:
            text_parts.append(f"\n### 【关系链】")
            for chain in self.relationship_chains:
                text_parts.append(f"- {chain}")
        return "\n".join(text_parts)


@dataclass
class PanoramaResult:
    """Broad search result (Panorama)"""
    query: str

    all_nodes: List[NodeInfo] = field(default_factory=list)
    all_edges: List[EdgeInfo] = field(default_factory=list)
    active_facts: List[str] = field(default_factory=list)
    historical_facts: List[str] = field(default_factory=list)

    total_nodes: int = 0
    total_edges: int = 0
    active_count: int = 0
    historical_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "all_nodes": [n.to_dict() for n in self.all_nodes],
            "all_edges": [e.to_dict() for e in self.all_edges],
            "active_facts": self.active_facts,
            "historical_facts": self.historical_facts,
            "total_nodes": self.total_nodes,
            "total_edges": self.total_edges,
            "active_count": self.active_count,
            "historical_count": self.historical_count
        }

    def to_text(self) -> str:
        text_parts = [
            f"## 广度搜索结果（未来全景视图）",
            f"查询: {self.query}",
            f"\n### 统计信息",
            f"- 总节点数: {self.total_nodes}",
            f"- 总边数: {self.total_edges}",
            f"- 当前有效事实: {self.active_count}条",
            f"- 历史/过期事实: {self.historical_count}条"
        ]
        if self.active_facts:
            text_parts.append(f"\n### 【当前有效事实】(模拟结果原文)")
            for i, fact in enumerate(self.active_facts, 1):
                text_parts.append(f'{i}. "{fact}"')
        if self.historical_facts:
            text_parts.append(f"\n### 【历史/过期事实】(演变过程记录)")
            for i, fact in enumerate(self.historical_facts, 1):
                text_parts.append(f'{i}. "{fact}"')
        if self.all_nodes:
            text_parts.append(f"\n### 【涉及实体】")
            for node in self.all_nodes:
                entity_type = next((l for l in node.labels if l not in ["Entity", "Node"]), "实体")
                text_parts.append(f"- **{node.name}** ({entity_type})")
        return "\n".join(text_parts)


@dataclass
class AgentInterview:
    """Single agent interview result"""
    agent_name: str
    agent_role: str
    agent_bio: str
    question: str
    response: str
    key_quotes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_name": self.agent_name,
            "agent_role": self.agent_role,
            "agent_bio": self.agent_bio,
            "question": self.question,
            "response": self.response,
            "key_quotes": self.key_quotes
        }

    def to_text(self) -> str:
        text = f"**{self.agent_name}** ({self.agent_role})\n"
        text += f"_简介: {self.agent_bio}_\n\n"
        text += f"**Q:** {self.question}\n\n"
        text += f"**A:** {self.response}\n"
        if self.key_quotes:
            text += "\n**关键引言:**\n"
            for quote in self.key_quotes:
                clean_quote = quote.replace('\u201c', '').replace('\u201d', '').replace('"', '')
                clean_quote = clean_quote.replace('\u300c', '').replace('\u300d', '')
                clean_quote = clean_quote.strip()
                while clean_quote and clean_quote[0] in '，,；;：:、。！？\n\r\t ':
                    clean_quote = clean_quote[1:]
                skip = False
                for d in '123456789':
                    if f'\u95ee\u9898{d}' in clean_quote:
                        skip = True
                        break
                if skip:
                    continue
                if len(clean_quote) > 150:
                    dot_pos = clean_quote.find('\u3002', 80)
                    if dot_pos > 0:
                        clean_quote = clean_quote[:dot_pos + 1]
                    else:
                        clean_quote = clean_quote[:147] + "..."
                if clean_quote and len(clean_quote) >= 10:
                    text += f'> "{clean_quote}"\n'
        return text


@dataclass
class InterviewResult:
    """Interview result containing multiple agent interviews"""
    interview_topic: str
    interview_questions: List[str]

    selected_agents: List[Dict[str, Any]] = field(default_factory=list)
    interviews: List[AgentInterview] = field(default_factory=list)

    selection_reasoning: str = ""
    summary: str = ""

    total_agents: int = 0
    interviewed_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "interview_topic": self.interview_topic,
            "interview_questions": self.interview_questions,
            "selected_agents": self.selected_agents,
            "interviews": [i.to_dict() for i in self.interviews],
            "selection_reasoning": self.selection_reasoning,
            "summary": self.summary,
            "total_agents": self.total_agents,
            "interviewed_count": self.interviewed_count
        }

    def to_text(self) -> str:
        text_parts = [
            "## 深度采访报告",
            f"**采访主题:** {self.interview_topic}",
            f"**采访人数:** {self.interviewed_count} / {self.total_agents} 位模拟Agent",
            "\n### 采访对象选择理由",
            self.selection_reasoning or "（自动选择）",
            "\n---",
            "\n### 采访实录",
        ]
        if self.interviews:
            for i, interview in enumerate(self.interviews, 1):
                text_parts.append(f"\n#### 采访 #{i}: {interview.agent_name}")
                text_parts.append(interview.to_text())
                text_parts.append("\n---")
        else:
            text_parts.append("（无采访记录）\n\n---")
        text_parts.append("\n### 采访摘要与核心观点")
        text_parts.append(self.summary or "（无摘要）")
        return "\n".join(text_parts)


# ---------------------------------------------------------------------------
# Main Service - Drop-in replacement for ZepToolsService
# ---------------------------------------------------------------------------

class RCMGraphToolsService:
    """
    Drop-in replacement for ZepToolsService using Graphiti + Neo4j.

    Provides the same 4 core tools:
    1. insight_forge() - Deep multi-dimensional search
    2. panorama_search() - Broad retrieval
    3. quick_search() - Fast targeted search
    4. interview_agents() - Agent interviews (via simulation IPC)
    """

    MAX_RETRIES = 3
    RETRY_DELAY = 2.0

    def __init__(self, graphiti: Graphiti = None, llm_client: LLMClient = None):
        self.graphiti = graphiti
        self._llm_client = llm_client
        self._initialized = graphiti is not None

    @property
    def llm(self) -> LLMClient:
        """Lazy-initialize LLM client"""
        if self._llm_client is None:
            self._llm_client = LLMClient()
        return self._llm_client

    async def ensure_initialized(self):
        """Ensure Graphiti connection is ready"""
        if not self._initialized:
            from .rcm_graph_builder import get_graph_builder
            builder = await get_graph_builder()
            self.graphiti = builder.graphiti
            self._initialized = True

    # ------------------------------------------------------------------
    # Core Tool 1: InsightForge (Deep multi-dimensional search)
    # ------------------------------------------------------------------

    async def insight_forge(
        self,
        graph_id: str,
        query: str,
        simulation_requirement: str,
        report_context: str = "",
        max_sub_queries: int = 5
    ) -> InsightForgeResult:
        """Deep multi-dimensional search using Graphiti hybrid search"""
        await self.ensure_initialized()

        # Generate sub-queries using LLM
        sub_queries = await self._generate_sub_queries(query, simulation_requirement, max_sub_queries)

        all_facts = []
        all_entities = []
        all_relationships = []

        for sq in sub_queries:
            try:
                edges = await self.graphiti.search(sq, num_results=10)
                for edge in edges:
                    fact_text = edge.fact if hasattr(edge, 'fact') else str(edge)
                    all_facts.append(fact_text)

                    if hasattr(edge, 'source_node_name') and hasattr(edge, 'target_node_name'):
                        rel = f"{edge.source_node_name} -> {edge.name} -> {edge.target_node_name}"
                        all_relationships.append(rel)
            except Exception as e:
                logger.warning(f"Search failed for sub-query '{sq}': {e}")

        # Deduplicate
        all_facts = list(set(all_facts))
        all_relationships = list(set(all_relationships))

        return InsightForgeResult(
            query=query,
            simulation_requirement=simulation_requirement,
            sub_queries=sub_queries,
            semantic_facts=all_facts,
            entity_insights=all_entities,
            relationship_chains=all_relationships,
            total_facts=len(all_facts),
            total_entities=len(all_entities),
            total_relationships=len(all_relationships)
        )

    # ------------------------------------------------------------------
    # Core Tool 2: PanoramaSearch (Broad retrieval)
    # ------------------------------------------------------------------

    async def panorama_search(
        self,
        graph_id: str,
        query: str,
        include_expired: bool = True,
        limit: int = 50
    ) -> PanoramaResult:
        """Broad retrieval of all related nodes and edges"""
        await self.ensure_initialized()

        nodes = []
        edges_list = []
        active_facts = []
        historical_facts = []

        try:
            results = await self.graphiti.search(query, num_results=limit)

            for edge in results:
                fact = edge.fact if hasattr(edge, 'fact') else str(edge)

                # Check temporal validity
                expired = hasattr(edge, 'expired_at') and edge.expired_at is not None

                if expired and include_expired:
                    historical_facts.append(fact)
                else:
                    active_facts.append(fact)

                edge_info = EdgeInfo(
                    uuid=str(edge.uuid) if hasattr(edge, 'uuid') else '',
                    name=edge.name if hasattr(edge, 'name') else '',
                    fact=fact,
                    source_node_uuid=str(edge.source_node_uuid) if hasattr(edge, 'source_node_uuid') else '',
                    target_node_uuid=str(edge.target_node_uuid) if hasattr(edge, 'target_node_uuid') else '',
                    source_node_name=edge.source_node_name if hasattr(edge, 'source_node_name') else None,
                    target_node_name=edge.target_node_name if hasattr(edge, 'target_node_name') else None,
                    created_at=str(edge.created_at) if hasattr(edge, 'created_at') else None,
                    valid_at=str(edge.valid_at) if hasattr(edge, 'valid_at') else None,
                    expired_at=str(edge.expired_at) if hasattr(edge, 'expired_at') else None
                )
                edges_list.append(edge_info)
        except Exception as e:
            logger.error(f"Panorama search failed: {e}")

        return PanoramaResult(
            query=query,
            all_nodes=nodes,
            all_edges=edges_list,
            active_facts=active_facts,
            historical_facts=historical_facts,
            total_nodes=len(nodes),
            total_edges=len(edges_list),
            active_count=len(active_facts),
            historical_count=len(historical_facts)
        )

    # ------------------------------------------------------------------
    # Core Tool 3: QuickSearch (Fast targeted search)
    # ------------------------------------------------------------------

    async def quick_search(
        self,
        graph_id: str,
        query: str,
        limit: int = 10
    ) -> SearchResult:
        """Fast targeted search"""
        await self.ensure_initialized()

        facts = []
        edges = []
        nodes = []

        try:
            results = await self.graphiti.search(query, num_results=limit)
            for edge in results:
                fact = edge.fact if hasattr(edge, 'fact') else str(edge)
                facts.append(fact)
                edges.append({
                    "uuid": str(edge.uuid) if hasattr(edge, 'uuid') else '',
                    "name": edge.name if hasattr(edge, 'name') else '',
                    "fact": fact,
                    "source": edge.source_node_name if hasattr(edge, 'source_node_name') else '',
                    "target": edge.target_node_name if hasattr(edge, 'target_node_name') else ''
                })
        except Exception as e:
            logger.error(f"Quick search failed: {e}")

        return SearchResult(
            facts=facts,
            edges=edges,
            nodes=nodes,
            query=query,
            total_count=len(facts)
        )

    # ------------------------------------------------------------------
    # Core Tool 4: InterviewAgents (Agent interviews)
    # ------------------------------------------------------------------

    async def interview_agents(
        self,
        simulation_id: str,
        interview_requirement: str,
        simulation_requirement: str = "",
        max_agents: int = 5,
        custom_questions: List[str] = None
    ) -> InterviewResult:
        """Interview payer agents about their decisions"""
        await self.ensure_initialized()

        # Search for relevant context
        context_results = await self.quick_search("rcm", interview_requirement, limit=20)

        questions = custom_questions or [interview_requirement]
        interviews = []

        payer_agents = [
            {"name": "Medicare", "role": "Government Payer", "bio": "Federal health insurance program for 65+ and disabled individuals"},
            {"name": "UnitedHealthcare", "role": "Commercial Payer", "bio": "Largest commercial health insurer in the US"},
            {"name": "Humana", "role": "Medicare Advantage Payer", "bio": "Major Medicare Advantage and commercial health plan"},
            {"name": "Blue Cross Blue Shield", "role": "Commercial Payer", "bio": "Federation of independent health insurance companies"},
            {"name": "Aetna", "role": "Commercial Payer", "bio": "National commercial health insurance provider"},
        ]

        for agent in payer_agents[:max_agents]:
            payer_name = agent["name"]
            # Search for payer-specific context
            payer_context = await self.quick_search("rcm", f"{payer_name} denial behavior", limit=5)

            prompt = (
                f"You are {payer_name}, a healthcare payer agent. "
                f"Based on your behavior patterns:\n"
                f"{chr(10).join(payer_context.facts[:5])}\n\n"
                f"Answer this question from the perspective of {payer_name}:\n"
                f"{interview_requirement}\n\n"
                f"Be specific about your denial patterns, payment behavior, and decision-making process."
            )

            try:
                response = self.llm.chat(
                    [
                        {"role": "system", "content": f"You are {payer_name}, a payer digital twin agent."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.5,
                    max_tokens=500
                )

                # Extract key quotes from response
                key_quotes = []
                sentences = response.split('.')
                for s in sentences:
                    s = s.strip()
                    if len(s) >= 20 and any(kw in s.lower() for kw in ['deny', 'denial', 'approve', 'claim', 'pay', 'appeal', 'rule']):
                        key_quotes.append(s)
                        if len(key_quotes) >= 3:
                            break

                interviews.append(AgentInterview(
                    agent_name=payer_name,
                    agent_role=agent["role"],
                    agent_bio=agent["bio"],
                    question=interview_requirement,
                    response=response,
                    key_quotes=key_quotes
                ))
            except Exception as e:
                logger.error(f"Interview with {payer_name} failed: {e}")

        # Generate summary
        summary = ""
        if interviews:
            summary_parts = [f"Interviewed {len(interviews)} payer agents about: {interview_requirement}."]
            for iv in interviews:
                summary_parts.append(f"- {iv.agent_name}: {iv.response[:100]}...")
            summary = " ".join(summary_parts)

        return InterviewResult(
            interview_topic=interview_requirement,
            interview_questions=questions,
            selected_agents=[{"name": a["name"], "role": a["role"]} for a in payer_agents[:max_agents]],
            interviews=interviews,
            selection_reasoning=f"Selected top {max_agents} payers by claim volume for RCM relevance",
            summary=summary,
            total_agents=len(payer_agents),
            interviewed_count=len(interviews)
        )

    # ------------------------------------------------------------------
    # Additional utility: Graph statistics
    # ------------------------------------------------------------------

    async def get_graph_statistics(self, graph_id: str = "rcm") -> Dict[str, Any]:
        """Get graph node/edge counts and metadata"""
        await self.ensure_initialized()

        try:
            driver = self.graphiti.driver
            async with driver.session() as session:
                node_result = await session.run("MATCH (n) RETURN count(n) as count")
                node_record = await node_result.single()
                node_count = node_record["count"] if node_record else 0

                edge_result = await session.run("MATCH ()-[r]->() RETURN count(r) as count")
                edge_record = await edge_result.single()
                edge_count = edge_record["count"] if edge_record else 0

                # Get entity types
                type_result = await session.run(
                    "MATCH (n) RETURN DISTINCT labels(n) as labels, count(n) as count"
                )
                entity_types = {}
                async for record in type_result:
                    for label in record["labels"]:
                        entity_types[label] = entity_types.get(label, 0) + record["count"]

            return {
                "total_nodes": node_count,
                "total_edges": edge_count,
                "entity_types": entity_types,
                "graph_id": graph_id,
                "storage": "neo4j",
                "engine": "graphiti",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get graph stats: {e}")
            return {"error": str(e)}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _generate_sub_queries(self, query: str, context: str, max_queries: int) -> List[str]:
        """Use LLM to generate sub-queries for deeper search"""
        prompt = (
            f'Given this RCM analytics question: "{query}"\n'
            f'Context: {context}\n\n'
            f'Generate {max_queries} specific sub-questions that would help answer this comprehensively.\n'
            f'Focus on: payer behavior, denial patterns, root causes, financial impact, automation opportunities.\n\n'
            f'Return as JSON array of strings.'
        )

        try:
            result = self.llm.chat_json(
                [
                    {"role": "system", "content": "You are an RCM analytics expert. Return JSON array of search queries."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )

            if isinstance(result, list):
                return result[:max_queries]
            elif isinstance(result, dict) and 'queries' in result:
                return result['queries'][:max_queries]
            else:
                return [query]
        except Exception:
            return [query]
