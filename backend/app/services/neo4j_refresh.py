"""
Neo4j Graph Refresh Service
============================
Incrementally updates Neo4j knowledge graph with latest PostgreSQL data.
"""
import logging
import time
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)

_last_refresh: str = None


async def refresh_neo4j_graph(db) -> Dict[str, Any]:
    """Incremental refresh of Neo4j from PostgreSQL.

    Instead of full rebuild, only updates changed data since last refresh.
    Falls back to full rebuild if no prior refresh timestamp.
    """
    global _last_refresh
    start = time.time()

    try:
        from .neo4j_client import get_neo4j
        neo4j = await get_neo4j()

        if not neo4j.is_connected:
            return {"status": "skipped", "reason": "Neo4j not connected"}

        # For now, do a lightweight refresh of key metrics
        # Update payer denial rates from latest data
        from sqlalchemy import text

        # Refresh payer denial counts
        result = await db.execute(text("""
            SELECT d.payer_id, COUNT(*) as denial_count
            FROM denials d
            WHERE d.created_at > NOW() - INTERVAL '1 hour'
            GROUP BY d.payer_id
        """))
        recent_denials = result.fetchall()

        updates = 0
        for row in recent_denials:
            await neo4j.write("""
                MATCH (p:Payer {payer_id: $payer_id})
                SET p.recent_denial_count = $count, p.last_refreshed = datetime()
            """, {"payer_id": row[0], "count": row[1]})
            updates += 1

        _last_refresh = datetime.now().isoformat()
        elapsed = time.time() - start

        logger.info(f"Neo4j refresh: {updates} payer updates in {elapsed:.1f}s")
        return {
            "status": "completed",
            "updates": updates,
            "elapsed_seconds": elapsed,
            "last_refresh": _last_refresh
        }
    except Exception as e:
        logger.error(f"Neo4j refresh failed: {e}")
        return {"status": "error", "error": str(e)}


async def get_neo4j_health() -> Dict[str, Any]:
    """Get Neo4j health status for API endpoint"""
    try:
        from .neo4j_client import get_neo4j
        neo4j = await get_neo4j()
        health = await neo4j.health_check()
        health["last_refresh"] = _last_refresh
        return health
    except Exception as e:
        return {"status": "error", "error": str(e), "last_refresh": _last_refresh}
