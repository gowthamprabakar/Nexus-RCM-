"""
Neo4j Schema for RCM Knowledge Graph — 10 node types, 12 relationship types
"""
import logging
from .neo4j_client import get_neo4j

logger = logging.getLogger(__name__)


async def create_rcm_schema():
    neo4j = await get_neo4j()
    if not neo4j.is_connected:
        logger.error("Cannot create schema: Neo4j not connected")
        return False

    constraints = [
        "CREATE CONSTRAINT payer_id IF NOT EXISTS FOR (p:Payer) REQUIRE p.payer_id IS UNIQUE",
        "CREATE CONSTRAINT provider_id IF NOT EXISTS FOR (p:Provider) REQUIRE p.provider_id IS UNIQUE",
        "CREATE CONSTRAINT root_cause_name IF NOT EXISTS FOR (rc:RootCause) REQUIRE rc.cause_name IS UNIQUE",
        "CREATE CONSTRAINT denial_cat IF NOT EXISTS FOR (dc:DenialCategory) REQUIRE dc.category_name IS UNIQUE",
        "CREATE CONSTRAINT carc IF NOT EXISTS FOR (c:CARCCode) REQUIRE c.carc_code IS UNIQUE",
        "CREATE CONSTRAINT stage IF NOT EXISTS FOR (s:ProcessStage) REQUIRE s.stage_name IS UNIQUE",
        "CREATE CONSTRAINT cpt IF NOT EXISTS FOR (c:CPTCode) REQUIRE c.cpt_code IS UNIQUE",
        "CREATE CONSTRAINT rule IF NOT EXISTS FOR (r:AutomationRule) REQUIRE r.rule_id IS UNIQUE",
    ]

    indexes = [
        "CREATE INDEX payer_name IF NOT EXISTS FOR (p:Payer) ON (p.payer_name)",
        "CREATE INDEX payer_group IF NOT EXISTS FOR (p:Payer) ON (p.payer_group)",
        "CREATE INDEX provider_specialty IF NOT EXISTS FOR (p:Provider) ON (p.specialty)",
        "CREATE INDEX rc_group IF NOT EXISTS FOR (rc:RootCause) ON (rc.root_cause_group)",
        "CREATE INDEX carc_prefix IF NOT EXISTS FOR (c:CARCCode) ON (c.prefix)",
    ]

    created = 0
    for stmt in constraints + indexes:
        result = await neo4j.write(stmt)
        if result:
            created += 1

    logger.info(f"Neo4j RCM schema: {created} constraints/indexes created")
    return True


async def create_process_stages():
    neo4j = await get_neo4j()
    stages = [
        {"stage_name": "REGISTRATION", "order": 1, "label": "Patient Registration & Eligibility"},
        {"stage_name": "AUTHORIZATION", "order": 2, "label": "Prior Authorization"},
        {"stage_name": "CODING", "order": 3, "label": "Charge Capture & Coding"},
        {"stage_name": "SUBMISSION", "order": 4, "label": "Claim Submission"},
        {"stage_name": "ADJUDICATION", "order": 5, "label": "Payer Adjudication & Payment"},
        {"stage_name": "DENIAL_MGMT", "order": 6, "label": "Denial Management & Appeals"},
        {"stage_name": "COLLECTIONS", "order": 7, "label": "A/R Follow-up & Collections"},
    ]
    cypher = """
    UNWIND $batch AS s
    MERGE (stage:ProcessStage {stage_name: s.stage_name})
    SET stage.order = s.order, stage.label = s.label, stage.updated_at = datetime()
    """
    count = await neo4j.batch_write(cypher, stages)
    logger.info(f"Created {count} process stage nodes")
    return count


async def verify_schema() -> dict:
    neo4j = await get_neo4j()
    node_counts = await neo4j.query("""
        MATCH (n) WITH labels(n) AS lbls, count(n) AS cnt
        UNWIND lbls AS lbl RETURN lbl AS label, sum(cnt) AS count ORDER BY count DESC
    """)
    edge_counts = await neo4j.query("""
        MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY count DESC
    """)
    return {
        "nodes": {r["label"]: r["count"] for r in node_counts},
        "edges": {r["type"]: r["count"] for r in edge_counts},
        "total_nodes": sum(r["count"] for r in node_counts),
        "total_edges": sum(r["count"] for r in edge_counts),
    }
