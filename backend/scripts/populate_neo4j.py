#!/usr/bin/env python3
"""Populate Neo4j RCM Knowledge Graph from PostgreSQL"""
import asyncio, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import asyncpg
from neo4j import AsyncGraphDatabase

PG_DSN = "postgresql://postgres:password123@localhost:5432/rcmpulse"
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "nexusrcm2026")


async def main():
    print("=" * 60)
    print("  RCM Neo4j Knowledge Graph Population")
    print("=" * 60)
    start = time.time()

    pg = await asyncpg.connect(PG_DSN)
    driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    await driver.verify_connectivity()
    print("  PostgreSQL + Neo4j connected")

    async with driver.session() as s:
        # Schema
        for c in [
            "CREATE CONSTRAINT payer_uid IF NOT EXISTS FOR (p:Payer) REQUIRE p.payer_id IS UNIQUE",
            "CREATE CONSTRAINT prov_uid IF NOT EXISTS FOR (p:Provider) REQUIRE p.provider_id IS UNIQUE",
            "CREATE CONSTRAINT rc_uid IF NOT EXISTS FOR (rc:RootCause) REQUIRE rc.cause_name IS UNIQUE",
            "CREATE CONSTRAINT dc_uid IF NOT EXISTS FOR (dc:DenialCategory) REQUIRE dc.category_name IS UNIQUE",
            "CREATE CONSTRAINT carc_uid IF NOT EXISTS FOR (c:CARCCode) REQUIRE c.carc_code IS UNIQUE",
            "CREATE CONSTRAINT stage_uid IF NOT EXISTS FOR (s:ProcessStage) REQUIRE s.stage_name IS UNIQUE",
            "CREATE CONSTRAINT cpt_uid IF NOT EXISTS FOR (c:CPTCode) REQUIRE c.cpt_code IS UNIQUE",
        ]:
            await s.run(c)
        print("  Schema constraints created")

        # 1. Payers
        rows = await pg.fetch("SELECT payer_id, payer_name, payer_group, adtp_days, denial_rate, first_pass_rate, avg_appeal_win_rate, payment_method FROM payer_master")
        batch = [dict(r) for r in rows]
        r = await s.run("UNWIND $batch AS p MERGE (n:Payer {payer_id: p.payer_id}) SET n += p, n.updated_at = datetime()", {"batch": batch})
        await r.consume()
        print(f"  Payers: {len(batch)}")

        # 2. Providers
        rows = await pg.fetch("SELECT provider_id, npi, provider_name, specialty, facility_type, state FROM providers")
        batch = [dict(r) for r in rows]
        r = await s.run("UNWIND $batch AS p MERGE (n:Provider {provider_id: p.provider_id}) SET n += p, n.updated_at = datetime()", {"batch": batch})
        await r.consume()
        print(f"  Providers: {len(batch)}")

        # 3. Root causes
        rows = await pg.fetch("SELECT primary_root_cause as cause_name, root_cause_group, COUNT(*) as denial_count, ROUND(AVG(confidence_score)) as avg_confidence, SUM(financial_impact) as total_impact FROM root_cause_analysis GROUP BY primary_root_cause, root_cause_group")
        batch = [{"cause_name": r["cause_name"], "root_cause_group": r["root_cause_group"], "denial_count": int(r["denial_count"]), "avg_confidence": float(r["avg_confidence"] or 0), "total_impact": float(r["total_impact"] or 0)} for r in rows]
        r = await s.run("UNWIND $batch AS rc MERGE (n:RootCause {cause_name: rc.cause_name}) SET n.root_cause_group = rc.root_cause_group, n.denial_count = rc.denial_count, n.avg_confidence = rc.avg_confidence, n.total_impact = rc.total_impact", {"batch": batch})
        await r.consume()
        print(f"  RootCauses: {len(batch)}")

        # 4. Denial categories
        rows = await pg.fetch("SELECT denial_category as category_name, COUNT(*) as count, SUM(denial_amount) as total_amount FROM denials WHERE denial_category IS NOT NULL GROUP BY denial_category")
        batch = [{"category_name": r["category_name"], "count": int(r["count"]), "total_amount": float(r["total_amount"] or 0)} for r in rows]
        r = await s.run("UNWIND $batch AS dc MERGE (n:DenialCategory {category_name: dc.category_name}) SET n.count = dc.count, n.total_amount = dc.total_amount", {"batch": batch})
        await r.consume()
        print(f"  DenialCategories: {len(batch)}")

        # 5. CARC codes
        rows = await pg.fetch("SELECT carc_code, SUBSTRING(carc_code, 1, 2) as prefix, COUNT(*) as usage_count FROM denials WHERE carc_code IS NOT NULL GROUP BY carc_code")
        batch = [dict(r) for r in rows]
        if batch:
            r = await s.run("UNWIND $batch AS c MERGE (n:CARCCode {carc_code: c.carc_code}) SET n.prefix = c.prefix, n.usage_count = c.usage_count", {"batch": batch})
            await r.consume()
        print(f"  CARCCodes: {len(batch)}")

        # 6. Process stages
        stages = [{"stage_name": n, "order": i+1} for i, n in enumerate(["REGISTRATION","AUTHORIZATION","CODING","SUBMISSION","ADJUDICATION","DENIAL_MGMT","COLLECTIONS"])]
        r = await s.run("UNWIND $batch AS s MERGE (n:ProcessStage {stage_name: s.stage_name}) SET n.order = s.order", {"batch": stages})
        await r.consume()
        print(f"  ProcessStages: 7")

        # 7. CPT codes
        rows = await pg.fetch("SELECT cpt_code, COUNT(*) as usage_count, AVG(charge_amount) as avg_charge FROM claim_lines WHERE cpt_code IS NOT NULL GROUP BY cpt_code")
        batch = [{"cpt_code": r["cpt_code"], "usage_count": int(r["usage_count"]), "avg_charge": float(r["avg_charge"] or 0)} for r in rows]
        if batch:
            r = await s.run("UNWIND $batch AS c MERGE (n:CPTCode {cpt_code: c.cpt_code}) SET n.usage_count = c.usage_count, n.avg_charge = c.avg_charge", {"batch": batch})
            await r.consume()
        print(f"  CPTCodes: {len(batch)}")

        # RELATIONSHIPS
        print("\n  Building relationships...")

        # HISTORICALLY_DENIES (denials→claims for payer_id)
        rows = await pg.fetch("SELECT c.payer_id, rca.primary_root_cause as cause_name, COUNT(*) as count FROM denials d JOIN claims c ON d.claim_id = c.claim_id JOIN root_cause_analysis rca ON d.denial_id = rca.denial_id WHERE c.payer_id IS NOT NULL AND rca.primary_root_cause IS NOT NULL GROUP BY c.payer_id, rca.primary_root_cause HAVING COUNT(*) >= 3")
        batch = [{"payer_id": r["payer_id"], "cause_name": r["cause_name"], "count": int(r["count"])} for r in rows]
        if batch:
            r = await s.run("UNWIND $batch AS b MATCH (p:Payer {payer_id: b.payer_id}), (rc:RootCause {cause_name: b.cause_name}) MERGE (p)-[r:HISTORICALLY_DENIES]->(rc) SET r.count = b.count", {"batch": batch})
            await r.consume()
        print(f"  HISTORICALLY_DENIES: {len(batch)}")

        # USES_CARC
        rows = await pg.fetch("SELECT denial_category as cat, carc_code, COUNT(*) as count FROM denials WHERE carc_code IS NOT NULL AND denial_category IS NOT NULL GROUP BY denial_category, carc_code HAVING COUNT(*) >= 3")
        batch = [{"cat": r["cat"], "carc_code": r["carc_code"], "count": int(r["count"])} for r in rows]
        if batch:
            r = await s.run("UNWIND $batch AS b MATCH (dc:DenialCategory {category_name: b.cat}), (c:CARCCode {carc_code: b.carc_code}) MERGE (dc)-[r:USES_CARC]->(c) SET r.count = b.count", {"batch": batch})
            await r.consume()
        print(f"  USES_CARC: {len(batch)}")

        # DENIED_FOR
        rows = await pg.fetch("SELECT c.provider_id, rca.primary_root_cause as cause_name, COUNT(*) as count FROM claims c JOIN denials d ON c.claim_id = d.claim_id JOIN root_cause_analysis rca ON d.denial_id = rca.denial_id WHERE c.provider_id IS NOT NULL GROUP BY c.provider_id, rca.primary_root_cause HAVING COUNT(*) >= 3")
        batch = [{"provider_id": r["provider_id"], "cause_name": r["cause_name"], "count": int(r["count"])} for r in rows]
        if batch:
            r = await s.run("UNWIND $batch AS b MATCH (prov:Provider {provider_id: b.provider_id}), (rc:RootCause {cause_name: b.cause_name}) MERGE (prov)-[r:DENIED_FOR]->(rc) SET r.count = b.count", {"batch": batch})
            await r.consume()
        print(f"  DENIED_FOR: {len(batch)}")

        # PAYER_CATEGORY_RATE (denials→claims for payer_id)
        rows = await pg.fetch("SELECT c.payer_id, d.denial_category as cat, COUNT(*) as count FROM denials d JOIN claims c ON d.claim_id = c.claim_id WHERE c.payer_id IS NOT NULL AND d.denial_category IS NOT NULL GROUP BY c.payer_id, d.denial_category")
        batch = [{"payer_id": r["payer_id"], "cat": r["cat"], "count": int(r["count"])} for r in rows]
        if batch:
            r = await s.run("UNWIND $batch AS b MATCH (p:Payer {payer_id: b.payer_id}), (dc:DenialCategory {category_name: b.cat}) MERGE (p)-[r:PAYER_CATEGORY_RATE]->(dc) SET r.count = b.count", {"batch": batch})
            await r.consume()
        print(f"  PAYER_CATEGORY_RATE: {len(batch)}")

        # CONTRACTED_AT
        rows = await pg.fetch("SELECT payer_id, cpt_code, expected_rate, rate_type FROM payer_contract_rate WHERE termination_date IS NULL")
        batch = [{"payer_id": r["payer_id"], "cpt_code": r["cpt_code"], "rate": float(r["expected_rate"] or 0), "type": r["rate_type"]} for r in rows]
        if batch:
            r = await s.run("UNWIND $batch AS b MATCH (p:Payer {payer_id: b.payer_id}), (cpt:CPTCode {cpt_code: b.cpt_code}) MERGE (p)-[r:CONTRACTED_AT]->(cpt) SET r.expected_rate = b.rate, r.rate_type = b.type", {"batch": batch})
            await r.consume()
        print(f"  CONTRACTED_AT: {len(batch)}")

    await pg.close()
    await driver.close()
    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"  COMPLETE in {elapsed:.1f}s")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    asyncio.run(main())
