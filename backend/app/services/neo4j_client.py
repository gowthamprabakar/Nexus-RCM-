"""
Neo4j Async Client for RCM Knowledge Graph
"""
import os
import logging
from typing import Dict, Any, List, Optional
from neo4j import AsyncGraphDatabase, AsyncDriver

logger = logging.getLogger(__name__)

NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "nexusrcm2026")


class Neo4jClient:
    _instance: Optional['Neo4jClient'] = None
    _driver: Optional[AsyncDriver] = None

    @classmethod
    async def get_instance(cls) -> 'Neo4jClient':
        if cls._instance is None:
            cls._instance = Neo4jClient()
            await cls._instance.connect()
        return cls._instance

    async def connect(self):
        try:
            self._driver = AsyncGraphDatabase.driver(
                NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD),
                max_connection_pool_size=20, connection_timeout=10,
            )
            await self._driver.verify_connectivity()
            logger.info(f"Neo4j connected: {NEO4J_URI}")
        except Exception as e:
            logger.error(f"Neo4j connection failed: {e}")
            self._driver = None

    async def close(self):
        if self._driver:
            await self._driver.close()
            self._driver = None

    @property
    def is_connected(self) -> bool:
        return self._driver is not None

    async def query(self, cypher: str, params: dict = None) -> List[Dict]:
        if not self._driver:
            return []
        try:
            async with self._driver.session() as session:
                result = await session.run(cypher, params or {})
                records = []
                async for record in result:
                    records.append(dict(record))
                return records
        except Exception as e:
            logger.error(f"Neo4j query failed: {e}")
            return []

    async def write(self, cypher: str, params: dict = None) -> Optional[Dict]:
        if not self._driver:
            return None
        try:
            async with self._driver.session() as session:
                result = await session.run(cypher, params or {})
                summary = await result.consume()
                return {
                    "nodes_created": summary.counters.nodes_created,
                    "relationships_created": summary.counters.relationships_created,
                    "properties_set": summary.counters.properties_set,
                }
        except Exception as e:
            logger.error(f"Neo4j write failed: {e}")
            return None

    async def batch_write(self, cypher: str, batch_params: List[Dict]) -> int:
        if not self._driver:
            return 0
        try:
            async with self._driver.session() as session:
                result = await session.run(cypher, {"batch": batch_params})
                summary = await result.consume()
                return summary.counters.nodes_created + summary.counters.relationships_created
        except Exception as e:
            logger.error(f"Neo4j batch write failed: {e}")
            return 0

    async def health_check(self) -> Dict[str, Any]:
        if not self._driver:
            return {"status": "disconnected", "uri": NEO4J_URI}
        try:
            records = await self.query("MATCH (n) RETURN count(n) as node_count")
            edge_records = await self.query("MATCH ()-[r]->() RETURN count(r) as edge_count")
            return {
                "status": "connected",
                "uri": NEO4J_URI,
                "node_count": records[0]["node_count"] if records else 0,
                "edge_count": edge_records[0]["edge_count"] if edge_records else 0,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}


async def get_neo4j() -> Neo4jClient:
    return await Neo4jClient.get_instance()
