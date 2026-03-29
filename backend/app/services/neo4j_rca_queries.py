"""
Neo4j Graph Queries for Root Cause Analysis
============================================
Bonus evidence points (0-10 per step, max 30 total) on top of SQL evidence.
"""
import logging
import asyncio
from typing import Dict, Any
from .neo4j_client import get_neo4j

logger = logging.getLogger(__name__)
EMPTY = {"evidence_points": 0, "finding": "Neo4j unavailable", "graph_context": None}


async def graph_eligibility_evidence(payer_id: str) -> Dict[str, Any]:
    neo4j = await get_neo4j()
    if not neo4j.is_connected:
        return EMPTY
    records = await neo4j.query("""
        MATCH (p:Payer {payer_id: $payer_id})-[r:HISTORICALLY_DENIES]->(rc:RootCause {cause_name: 'ELIGIBILITY_LAPSE'})
        WITH r.count AS elig_denials
        MATCH (p2:Payer {payer_id: $payer_id})-[r2:HISTORICALLY_DENIES]->(rc2:RootCause)
        WITH elig_denials, SUM(r2.count) AS total_denials
        RETURN elig_denials, total_denials,
               CASE WHEN total_denials > 0 THEN ROUND(elig_denials * 100.0 / total_denials, 1) ELSE 0 END AS elig_pct
    """, {"payer_id": payer_id})
    if not records:
        return {"evidence_points": 0, "finding": "No graph data for payer", "graph_context": None}
    r = records[0]
    pct = r.get("elig_pct", 0)
    if pct > 20:
        return {"evidence_points": 8, "finding": f"Graph: Payer {pct}% ELIGIBILITY_LAPSE rate (HIGH)", "graph_context": dict(r)}
    elif pct > 10:
        return {"evidence_points": 4, "finding": f"Graph: Payer {pct}% ELIGIBILITY_LAPSE rate (moderate)", "graph_context": dict(r)}
    return {"evidence_points": 0, "finding": f"Graph: Payer eligibility rate low ({pct}%)", "graph_context": dict(r)}


async def graph_coding_evidence(payer_id: str, cpt_code: str) -> Dict[str, Any]:
    neo4j = await get_neo4j()
    if not neo4j.is_connected:
        return EMPTY
    records = await neo4j.query("""
        OPTIONAL MATCH (p:Payer {payer_id: $payer_id})-[c:CONTRACTED_AT]->(cpt:CPTCode {cpt_code: $cpt_code})
        OPTIONAL MATCH (p2:Payer {payer_id: $payer_id})-[r:HISTORICALLY_DENIES]->(rc:RootCause)
        WHERE rc.cause_name IN ['CODING_MISMATCH', 'MODIFIER_MISMATCH', 'BUNDLING_ERROR']
        WITH c.expected_rate AS contract_rate, SUM(COALESCE(r.count, 0)) AS total_coding
        RETURN contract_rate, total_coding
    """, {"payer_id": payer_id, "cpt_code": cpt_code or ""})
    if not records:
        return {"evidence_points": 0, "finding": "No coding graph data", "graph_context": None}
    r = records[0]
    total = r.get("total_coding", 0)
    has_contract = r.get("contract_rate") is not None
    pts, findings = 0, []
    if total > 100:
        pts += 6; findings.append(f"Payer has {total} coding denials (HIGH)")
    elif total > 30:
        pts += 3; findings.append(f"Payer has {total} coding denials (moderate)")
    if not has_contract:
        pts += 3; findings.append("No contract rate for CPT")
    return {"evidence_points": min(pts, 10), "finding": f"Graph: {'; '.join(findings)}" if findings else "Graph: Low coding risk", "graph_context": {"total_coding": total, "has_contract": has_contract}}


async def graph_payer_history_evidence(payer_id: str) -> Dict[str, Any]:
    neo4j = await get_neo4j()
    if not neo4j.is_connected:
        return EMPTY
    records = await neo4j.query("""
        MATCH (p:Payer {payer_id: $payer_id})-[r:HISTORICALLY_DENIES]->(rc:RootCause)
        WITH p, rc, r ORDER BY r.count DESC
        RETURN p.payer_name AS name, p.denial_rate AS rate,
               COLLECT({cause: rc.cause_name, count: r.count}) AS profile,
               SUM(r.count) AS total
    """, {"payer_id": payer_id})
    if not records:
        return {"evidence_points": 0, "finding": "No payer profile", "graph_context": None}
    r = records[0]
    profile = r.get("profile", [])
    total = r.get("total", 0)
    top = profile[0] if profile else {}
    top_pct = (top.get("count", 0) / total * 100) if total > 0 else 0
    if top_pct > 40:
        return {"evidence_points": 8, "finding": f"Graph: Payer {top_pct:.0f}% in {top.get('cause','?')} — systemic", "graph_context": {"profile": profile[:5]}}
    elif r.get("rate", 0) and r["rate"] > 10:
        return {"evidence_points": 5, "finding": f"Graph: Payer rate {r['rate']}% above avg", "graph_context": {"profile": profile[:5]}}
    return {"evidence_points": 0, "finding": f"Graph: Payer normal ({total} denials)", "graph_context": {"profile": profile[:5]}}


async def graph_provider_evidence(provider_id: str) -> Dict[str, Any]:
    neo4j = await get_neo4j()
    if not neo4j.is_connected:
        return EMPTY
    records = await neo4j.query("""
        MATCH (prov:Provider {provider_id: $provider_id})-[r:DENIED_FOR]->(rc:RootCause)
        WITH prov, SUM(r.count) AS my_total
        OPTIONAL MATCH (prov)-[:PEER_DENIAL_RATE]-(peer:Provider)-[r2:DENIED_FOR]->(rc2:RootCause)
        WITH my_total, AVG(r2.count) AS peer_avg, COUNT(DISTINCT peer) AS peers
        RETURN my_total, peer_avg, peers
    """, {"provider_id": provider_id})
    if not records:
        return {"evidence_points": 0, "finding": "No provider graph data", "graph_context": None}
    r = records[0]
    my = r.get("my_total", 0); pavg = r.get("peer_avg", 0); pc = r.get("peers", 0)
    if pc > 0 and pavg and my > pavg * 1.5:
        return {"evidence_points": 7, "finding": f"Graph: Provider {my} denials vs peer avg {pavg:.0f} — above peers", "graph_context": dict(r)}
    return {"evidence_points": 0, "finding": "Graph: Provider within range", "graph_context": dict(r)}


async def graph_convergence_synthesis(payer_id: str, provider_id: str) -> Dict[str, Any]:
    neo4j = await get_neo4j()
    if not neo4j.is_connected:
        return EMPTY
    records = await neo4j.query("""
        MATCH (payer:Payer {payer_id: $payer_id})-[r1:HISTORICALLY_DENIES]->(rc:RootCause)<-[r2:DENIED_FOR]-(prov:Provider {provider_id: $provider_id})
        WITH rc.cause_name AS cause, r1.count AS pd, r2.count AS pvd, r1.count + r2.count AS combined
        ORDER BY combined DESC RETURN cause, pd, pvd, combined LIMIT 3
    """, {"payer_id": payer_id, "provider_id": provider_id})
    if not records:
        return {"evidence_points": 0, "finding": "Graph: No convergence", "graph_context": None}
    top = records[0]
    if len(records) >= 2:
        return {"evidence_points": 10, "finding": f"Graph CONVERGENCE: {top['cause']} (payer:{top['pd']}, provider:{top['pvd']}). Also: {', '.join(r['cause'] for r in records[1:])}", "graph_context": [dict(r) for r in records]}
    elif top.get("combined", 0) > 50:
        return {"evidence_points": 8, "finding": f"Graph CONVERGENCE: {top['cause']} strong signal", "graph_context": [dict(top)]}
    return {"evidence_points": 4, "finding": f"Graph: Weak convergence on {top['cause']}", "graph_context": [dict(top)]}


async def get_all_graph_evidence(payer_id: str, provider_id: str, cpt_code: str = None) -> Dict[str, Any]:
    results = {}
    total_points = 0
    try:
        elig, coding, payer, provider, convergence = await asyncio.gather(
            graph_eligibility_evidence(payer_id),
            graph_coding_evidence(payer_id, cpt_code),
            graph_payer_history_evidence(payer_id),
            graph_provider_evidence(provider_id),
            graph_convergence_synthesis(payer_id, provider_id),
            return_exceptions=True
        )
        for name, result in [("eligibility", elig), ("coding", coding), ("payer_history", payer),
                             ("provider", provider), ("convergence", convergence)]:
            if isinstance(result, dict):
                results[name] = result
                total_points += result.get("evidence_points", 0)
            else:
                results[name] = {"evidence_points": 0, "finding": f"Error: {result}", "graph_context": None}
    except Exception as e:
        logger.error(f"Graph evidence failed: {e}")
        return {"total_points": 0, "results": {}, "error": str(e)}
    return {
        "total_points": min(total_points, 30),
        "results": results,
        "findings_summary": [r.get("finding", "") for r in results.values() if r.get("evidence_points", 0) > 0]
    }
