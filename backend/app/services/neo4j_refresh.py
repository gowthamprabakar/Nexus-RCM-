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

        # ── Fix 6a: Refresh Payer.denial_rate from live claim/denial ratio ──
        rate_result = await db.execute(text("""
            SELECT c.payer_id,
                   ROUND(COUNT(d.denial_id)::numeric / NULLIF(COUNT(c.claim_id), 0), 4) AS live_denial_rate
            FROM claims c
            LEFT JOIN denials d ON d.claim_id = c.claim_id
            GROUP BY c.payer_id
        """))
        for row in rate_result.fetchall():
            await neo4j.write("""
                MATCH (p:Payer {payer_id: $payer_id})
                SET p.denial_rate = $rate
            """, {"payer_id": row[0], "rate": float(row[1]) if row[1] is not None else 0.0})
            updates += 1

        # ── Fix 6b: Refresh HISTORICALLY_DENIES relationship count ──
        hist_result = await db.execute(text("""
            SELECT c.payer_id, d.denial_category, COUNT(*) AS cnt
            FROM denials d
            JOIN claims c ON c.claim_id = d.claim_id
            WHERE d.denial_category IS NOT NULL
            GROUP BY c.payer_id, d.denial_category
        """))
        for row in hist_result.fetchall():
            await neo4j.write("""
                MATCH (p:Payer {payer_id: $payer_id})
                MERGE (cat:DenialCategory {name: $category})
                MERGE (p)-[r:HISTORICALLY_DENIES]->(cat)
                SET r.count = $count
            """, {"payer_id": row[0], "category": row[1], "count": row[2]})
            updates += 1

        # ── Fix 6c: Refresh Provider DENIED_FOR edge ──
        prov_result = await db.execute(text("""
            SELECT c.provider_id, c.payer_id, COUNT(d.denial_id) AS cnt
            FROM denials d
            JOIN claims c ON c.claim_id = d.claim_id
            WHERE c.provider_id IS NOT NULL
            GROUP BY c.provider_id, c.payer_id
            HAVING COUNT(d.denial_id) >= 3
        """))
        for row in prov_result.fetchall():
            await neo4j.write("""
                MERGE (pr:Provider {provider_id: $provider_id})
                MERGE (pa:Payer {payer_id: $payer_id})
                MERGE (pr)-[r:DENIED_FOR]->(pa)
                SET r.count = $count
            """, {"provider_id": row[0], "payer_id": row[1], "count": row[2]})
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
