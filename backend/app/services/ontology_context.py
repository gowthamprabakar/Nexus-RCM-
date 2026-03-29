"""
Ontology Context Builder — Generates focused context for each AI layer.
=========================================================================
Transforms the unified RCM ontology into targeted context strings for:
  - Descriptive AI: what happened, key metrics
  - Diagnostic AI: what's wrong and why
  - Predictive AI: what will happen
  - Prescriptive AI: what to do about it
  - Root Cause AI: deep investigation
  - LIDA Chat: comprehensive, question-aware context
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.rcm_ontology import build_rcm_ontology

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

def _nodes_by_type(ontology: dict, node_type: str) -> list:
    """Filter ontology nodes by type."""
    return [n for n in ontology.get("nodes", []) if n.get("type") == node_type]


def _edges_by_type(ontology: dict, edge_type: str) -> list:
    """Filter ontology edges by type."""
    return [e for e in ontology.get("edges", []) if e.get("type") == edge_type]


def _fmt_money(val) -> str:
    """Format a numeric value as currency."""
    try:
        return f"${float(val):,.0f}"
    except (TypeError, ValueError):
        return "$0"


def _fmt_pct(val) -> str:
    """Format a numeric value as a percentage."""
    try:
        return f"{float(val):.1f}%"
    except (TypeError, ValueError):
        return "0.0%"


# ═══════════════════════════════════════════════════════════════════════════
# Context builders
# ═══════════════════════════════════════════════════════════════════════════

async def build_descriptive_context(db: AsyncSession) -> str:
    """
    Context for Descriptive AI: what happened, key metrics.
    Extracts financial health, status distribution, payer volumes.
    """
    ontology = await build_rcm_ontology(db)
    parts = ["=== DESCRIPTIVE CONTEXT: What Happened ===\n"]

    # Financial health
    fin_nodes = _nodes_by_type(ontology, "financial")
    if fin_nodes:
        f = fin_nodes[0]["properties"]
        parts.append("REVENUE HEALTH:")
        parts.append(f"  Total Billed: {_fmt_money(f.get('total_billed'))}")
        parts.append(f"  Total Collected: {_fmt_money(f.get('total_collected'))}")
        parts.append(f"  Total Denied: {_fmt_money(f.get('total_denied'))}")
        parts.append(f"  Total A/R: {_fmt_money(f.get('total_ar'))}")
        parts.append(f"  Collection Rate: {_fmt_pct(f.get('collection_rate'))}")
        parts.append(f"  Denial Rate: {_fmt_pct(f.get('denial_rate'))}")
        parts.append(f"  Net Yield: {_fmt_pct(f.get('net_yield'))}")
        parts.append("")

    # Claim status distribution
    claim_nodes = _nodes_by_type(ontology, "claim_status")
    if claim_nodes:
        parts.append("CLAIM STATUS DISTRIBUTION:")
        for n in claim_nodes:
            p = n["properties"]
            parts.append(f"  {n['label']}: {p['count']:,} claims ({_fmt_pct(p['percentage'])}) = {_fmt_money(p['total_charges'])}")
        parts.append("")

    # Top payers by volume
    payer_nodes = _nodes_by_type(ontology, "payer")
    if payer_nodes:
        parts.append(f"TOP PAYERS (by volume, {len(payer_nodes)} tracked):")
        for n in payer_nodes[:10]:
            p = n["properties"]
            parts.append(
                f"  {n['label']}: {p['claim_volume']:,} claims, "
                f"denial rate {_fmt_pct(p['denial_rate'] * 100)}, "
                f"ADTP {p['adtp_days']}d"
            )
        parts.append("")

    # Process stages
    stage_nodes = _nodes_by_type(ontology, "process_stage")
    if stage_nodes:
        parts.append("PIPELINE STAGES:")
        for n in sorted(stage_nodes, key=lambda x: x["properties"].get("stage_order", 0)):
            p = n["properties"]
            parts.append(f"  {n['label']}: {p['claims_in_stage']:,} claims ({_fmt_pct(p['throughput_pct'])})")
        parts.append("")

    parts.append(f"Ontology: {ontology['node_count']} nodes, {ontology['edge_count']} edges")
    return "\n".join(parts)


async def build_diagnostic_context(db: AsyncSession) -> str:
    """
    Context for Diagnostic AI: what's wrong and why.
    Extracts active findings, root cause distribution, anomalies.
    """
    ontology = await build_rcm_ontology(db)
    parts = ["=== DIAGNOSTIC CONTEXT: What's Wrong ===\n"]

    # Active diagnostic findings
    diag_nodes = _nodes_by_type(ontology, "diagnostic_finding")
    if diag_nodes:
        critical = [n for n in diag_nodes if n["properties"].get("severity") == "CRITICAL"]
        warning = [n for n in diag_nodes if n["properties"].get("severity") == "WARNING"]
        parts.append(f"ACTIVE FINDINGS: {len(diag_nodes)} total ({len(critical)} critical, {len(warning)} warning)")
        total_impact = sum(n["properties"].get("financial_impact", 0) for n in diag_nodes)
        parts.append(f"  Total Financial Impact: {_fmt_money(total_impact)}")
        parts.append("")
        parts.append("TOP FINDINGS (by impact):")
        for n in diag_nodes[:10]:
            p = n["properties"]
            parts.append(
                f"  [{p.get('severity', 'INFO')}] {n['label']} "
                f"| Impact: {_fmt_money(p.get('financial_impact'))} "
                f"| Claims: {p.get('affected_claims', 0)} "
                f"| Category: {p.get('category', 'N/A')}"
            )
            if p.get("recommended_action"):
                parts.append(f"    -> Action: {p['recommended_action']}")
        parts.append("")

    # Root cause distribution
    rc_nodes = _nodes_by_type(ontology, "root_cause")
    if rc_nodes:
        parts.append("ROOT CAUSE DISTRIBUTION:")
        for n in rc_nodes:
            p = n["properties"]
            parts.append(
                f"  {n['label']}: {p['count']} occurrences, "
                f"impact {_fmt_money(p['total_impact'])}, "
                f"confidence {_fmt_pct(p['avg_confidence'])}"
            )
        parts.append("")

    # Denial categories
    denial_nodes = _nodes_by_type(ontology, "denial_category")
    if denial_nodes:
        parts.append("DENIAL CATEGORIES:")
        for n in denial_nodes:
            p = n["properties"]
            parts.append(
                f"  {n['label']}: {p['denial_count']} denials, "
                f"{_fmt_money(p['total_denied'])} denied, "
                f"{p['claims_affected']} claims, "
                f"{p['payers_involved']} payers"
            )
        parts.append("")

    # ADTP anomalies
    adtp_nodes = _nodes_by_type(ontology, "adtp")
    anomaly_nodes = [n for n in adtp_nodes if n["properties"].get("is_anomaly")]
    if anomaly_nodes:
        parts.append(f"ADTP ANOMALIES ({len(anomaly_nodes)} payers):")
        for n in anomaly_nodes:
            p = n["properties"]
            parts.append(
                f"  {p.get('payer_name', '')}: expected {p['expected_days']}d, "
                f"actual {p['actual_days']}d, "
                f"deviation {p['deviation_days']:+.1f}d ({p.get('anomaly_type', 'UNKNOWN')})"
            )
        parts.append("")

    # Payer-to-root-cause edges (denies_via)
    denies_via_edges = _edges_by_type(ontology, "payer_denies_via")
    if denies_via_edges:
        parts.append("PAYER-ROOT CAUSE RELATIONSHIPS (top 10):")
        for e in denies_via_edges[:10]:
            parts.append(
                f"  {e.get('label', '')} | Impact: {_fmt_money(e.get('properties', {}).get('financial_impact', 0))}"
            )
        parts.append("")

    return "\n".join(parts)


async def build_predictive_context(db: AsyncSession) -> str:
    """
    Context for Predictive AI: what will happen.
    Extracts forecast data, ADTP trends, denial velocity.
    """
    ontology = await build_rcm_ontology(db)
    parts = ["=== PREDICTIVE CONTEXT: What Will Happen ===\n"]

    # Forecasts
    forecast_nodes = _nodes_by_type(ontology, "forecast")
    if forecast_nodes:
        total_forecasted = sum(n["properties"].get("forecasted_amount", 0) for n in forecast_nodes)
        avg_confidence = (
            sum(n["properties"].get("confidence", 0) for n in forecast_nodes) /
            max(len(forecast_nodes), 1)
        )
        parts.append(f"REVENUE FORECAST ({len(forecast_nodes)} payer-weeks):")
        parts.append(f"  Total Forecasted: {_fmt_money(total_forecasted)}")
        parts.append(f"  Average Confidence: {_fmt_pct(avg_confidence)}")
        parts.append("")

        # Group by week
        by_week = {}
        for n in forecast_nodes:
            w = n["properties"].get("week_start", "unknown")
            if w not in by_week:
                by_week[w] = {"amount": 0, "count": 0}
            by_week[w]["amount"] += n["properties"].get("forecasted_amount", 0)
            by_week[w]["count"] += 1
        parts.append("  BY WEEK:")
        for week, data in sorted(by_week.items()):
            parts.append(f"    {week}: {_fmt_money(data['amount'])} ({data['count']} payers)")
        parts.append("")

    # ADTP trends (payment velocity)
    adtp_nodes = _nodes_by_type(ontology, "adtp")
    if adtp_nodes:
        avg_actual = sum(n["properties"].get("actual_days", 0) for n in adtp_nodes) / max(len(adtp_nodes), 1)
        delayed = [n for n in adtp_nodes if n["properties"].get("deviation_days", 0) > 3]
        accelerated = [n for n in adtp_nodes if n["properties"].get("deviation_days", 0) < -3]
        parts.append(f"ADTP TRENDS ({len(adtp_nodes)} payers tracked):")
        parts.append(f"  Average Actual ADTP: {avg_actual:.1f} days")
        parts.append(f"  Delayed Payers (>3d over expected): {len(delayed)}")
        parts.append(f"  Accelerated Payers (>3d under expected): {len(accelerated)}")
        if delayed:
            parts.append("  DELAYED:")
            for n in delayed[:5]:
                p = n["properties"]
                parts.append(f"    {p.get('payer_name', '')}: {p['actual_days']:.0f}d (expected {p['expected_days']}d)")
        parts.append("")

    # Denial velocity
    fin_nodes = _nodes_by_type(ontology, "financial")
    if fin_nodes:
        f = fin_nodes[0]["properties"]
        parts.append("REVENUE RISK INDICATORS:")
        parts.append(f"  Current Denial Rate: {_fmt_pct(f.get('denial_rate'))}")
        parts.append(f"  A/R to Billed Ratio: {_fmt_pct(f.get('ar_to_billed_ratio'))}")
        parts.append(f"  Total A/R Outstanding: {_fmt_money(f.get('total_ar'))}")
        parts.append("")

    return "\n".join(parts)


async def build_prescriptive_context(db: AsyncSession) -> str:
    """
    Context for Prescriptive AI: what to do about it.
    Extracts automation rules, prevention alerts, resolution paths.
    """
    ontology = await build_rcm_ontology(db)
    parts = ["=== PRESCRIPTIVE CONTEXT: What To Do ===\n"]

    # Prevention alerts
    prev_nodes = _nodes_by_type(ontology, "prevention_alert")
    if prev_nodes:
        total_risk = sum(n["properties"].get("total_risk_amount", 0) for n in prev_nodes)
        total_alerts = sum(n["properties"].get("alert_count", 0) for n in prev_nodes)
        parts.append(f"PREVENTION ALERTS ({total_alerts} total, {_fmt_money(total_risk)} at risk):")
        for n in prev_nodes:
            p = n["properties"]
            parts.append(
                f"  {p.get('alert_type', '')}: {p.get('alert_count', 0)} alerts, "
                f"{_fmt_money(p.get('total_risk_amount'))} at risk "
                f"[{p.get('severity', 'warning').upper()}]"
            )
        parts.append("")

    # Automation rules
    auto_nodes = _nodes_by_type(ontology, "automation_rule")
    if auto_nodes:
        enabled = [n for n in auto_nodes if n["properties"].get("enabled")]
        parts.append(f"AUTOMATION RULES ({len(enabled)} enabled / {len(auto_nodes)} total):")
        for n in auto_nodes:
            p = n["properties"]
            status = "ENABLED" if p.get("enabled") else "DISABLED"
            approval = " [needs approval]" if p.get("requires_approval") else ""
            parts.append(f"  [{status}] {n['label']}: trigger={p.get('trigger', 'N/A')}{approval}")
            parts.append(f"    Template: {p.get('action_template', 'N/A')}")
        parts.append("")

    # Finding -> Rule recommendations
    rec_edges = _edges_by_type(ontology, "finding_recommends_rule")
    if rec_edges:
        parts.append("FINDING -> RULE RECOMMENDATIONS:")
        for e in rec_edges[:10]:
            parts.append(f"  {e.get('label', '')}")
            ep = e.get("properties", {})
            parts.append(f"    Impact: {_fmt_money(ep.get('financial_impact', 0))}, Rule enabled: {ep.get('rule_enabled', True)}")
        parts.append("")

    # Preventable root causes
    prev_edges = _edges_by_type(ontology, "root_cause_preventable_by")
    if prev_edges:
        parts.append("PREVENTABLE ROOT CAUSES:")
        for e in prev_edges:
            ep = e.get("properties", {})
            parts.append(
                f"  {e.get('label', '')} | "
                f"Potential savings: {_fmt_money(ep.get('potential_savings', 0))}"
            )
        parts.append("")

    return "\n".join(parts)


async def build_root_cause_context(db: AsyncSession, claim_id: str = None) -> str:
    """
    Context for Root Cause AI: deep investigation.
    If claim_id: full claim context from graph service.
    If no claim_id: systemic root cause patterns from ontology.
    """
    parts = ["=== ROOT CAUSE CONTEXT: Deep Investigation ===\n"]

    if claim_id:
        # Fetch single claim context via graph query service
        try:
            from app.services.graph_query_service import drill_to_claim_detail
            claim_detail = await drill_to_claim_detail(db, claim_id)
            if claim_detail and "error" not in claim_detail:
                parts.append(f"CLAIM {claim_id} INVESTIGATION:")
                claim = claim_detail.get("claim", {})
                parts.append(f"  Status: {claim.get('status', 'N/A')}")
                parts.append(f"  Payer: {claim.get('payer_name', 'N/A')}")
                parts.append(f"  Total Charges: {_fmt_money(claim.get('total_charges', 0))}")
                parts.append(f"  Date of Service: {claim.get('date_of_service', 'N/A')}")
                parts.append("")

                denials = claim_detail.get("denials", [])
                if denials:
                    parts.append(f"  DENIALS ({len(denials)}):")
                    for d in denials:
                        parts.append(f"    {d.get('denial_category', 'N/A')}: {_fmt_money(d.get('denial_amount', 0))} - {d.get('carc_code', 'N/A')}")
                    parts.append("")

                rca = claim_detail.get("root_cause_analysis", [])
                if rca:
                    parts.append(f"  ROOT CAUSE ANALYSIS ({len(rca)}):")
                    for r in rca:
                        parts.append(f"    {r.get('primary_root_cause', 'N/A')} (confidence {r.get('confidence_score', 0):.0f}%)")
                        parts.append(f"    Impact: {_fmt_money(r.get('financial_impact', 0))}")
                    parts.append("")
        except Exception as e:
            parts.append(f"  Claim detail unavailable: {e}")
            parts.append("")

    # Always include systemic patterns
    ontology = await build_rcm_ontology(db)

    rc_nodes = _nodes_by_type(ontology, "root_cause")
    if rc_nodes:
        parts.append("SYSTEMIC ROOT CAUSE PATTERNS:")
        total_impact = sum(n["properties"].get("total_impact", 0) for n in rc_nodes)
        total_count = sum(n["properties"].get("count", 0) for n in rc_nodes)
        parts.append(f"  Total Analyses: {total_count:,}")
        parts.append(f"  Total Impact: {_fmt_money(total_impact)}")
        parts.append("")
        for n in rc_nodes:
            p = n["properties"]
            pct = round(p["count"] / max(total_count, 1) * 100, 1)
            parts.append(
                f"  {n['label']} ({p['root_cause_group']}): "
                f"{p['count']} ({pct}%) | "
                f"Impact: {_fmt_money(p['total_impact'])} | "
                f"Avg: {_fmt_money(p['avg_impact'])} | "
                f"Confidence: {_fmt_pct(p['avg_confidence'])}"
            )
        parts.append("")

    # Payer-specific root cause patterns
    denies_via = _edges_by_type(ontology, "payer_denies_via")
    if denies_via:
        parts.append("PAYER-SPECIFIC ROOT CAUSE PATTERNS (top 15):")
        for e in denies_via[:15]:
            ep = e.get("properties", {})
            parts.append(
                f"  {e.get('label', '')} | "
                f"Impact: {_fmt_money(ep.get('financial_impact', 0))}"
            )
        parts.append("")

    return "\n".join(parts)


async def build_chat_context(db: AsyncSession, question: str) -> str:
    """
    Context for LIDA Chat: comprehensive, question-aware.
    Auto-detects relevant nodes from question keywords,
    returns focused context from ontology.
    """
    ontology = await build_rcm_ontology(db)
    q_lower = question.lower()
    parts = ["=== CHAT CONTEXT (ontology-aware) ===\n"]

    # Always include financial health as baseline
    fin_nodes = _nodes_by_type(ontology, "financial")
    if fin_nodes:
        f = fin_nodes[0]["properties"]
        parts.append("REVENUE SNAPSHOT:")
        parts.append(f"  Billed: {_fmt_money(f.get('total_billed'))} | Collected: {_fmt_money(f.get('total_collected'))} | Denied: {_fmt_money(f.get('total_denied'))} | A/R: {_fmt_money(f.get('total_ar'))}")
        parts.append(f"  Collection Rate: {_fmt_pct(f.get('collection_rate'))} | Denial Rate: {_fmt_pct(f.get('denial_rate'))}")
        parts.append("")

    # Keyword-based relevance detection
    relevance_map = {
        "denial": ["denial_category", "root_cause", "diagnostic_finding"],
        "denied": ["denial_category", "root_cause", "diagnostic_finding"],
        "root cause": ["root_cause", "diagnostic_finding"],
        "payer": ["payer", "adtp"],
        "payment": ["payer", "adtp", "forecast"],
        "forecast": ["forecast", "financial"],
        "predict": ["forecast", "adtp"],
        "prevention": ["prevention_alert", "automation_rule"],
        "prevent": ["prevention_alert", "root_cause"],
        "automation": ["automation_rule", "diagnostic_finding"],
        "rule": ["automation_rule"],
        "adtp": ["adtp", "payer"],
        "days to pay": ["adtp", "payer"],
        "appeal": ["root_cause", "denial_category"],
        "ar": ["claim_status", "financial"],
        "aging": ["claim_status", "financial"],
        "claim": ["claim_status", "process_stage"],
        "provider": ["provider"],
        "diagnosis": ["diagnostic_finding"],
        "diagnostic": ["diagnostic_finding"],
        "finding": ["diagnostic_finding"],
        "anomaly": ["adtp", "diagnostic_finding"],
        "collection": ["financial", "payer"],
        "revenue": ["financial", "forecast"],
        "stage": ["process_stage"],
        "pipeline": ["process_stage", "claim_status"],
    }

    # Determine relevant node types
    relevant_types = set()
    for keyword, types in relevance_map.items():
        if keyword in q_lower:
            relevant_types.update(types)

    # If no keywords matched, include a broad set
    if not relevant_types:
        relevant_types = {"claim_status", "payer", "denial_category", "root_cause", "diagnostic_finding"}

    # Build context from relevant node types
    type_labels = {
        "claim_status": "CLAIM STATUS",
        "payer": "PAYERS",
        "root_cause": "ROOT CAUSES",
        "denial_category": "DENIAL CATEGORIES",
        "provider": "PROVIDERS",
        "process_stage": "PIPELINE STAGES",
        "adtp": "ADTP (PAYMENT TIMING)",
        "prevention_alert": "PREVENTION ALERTS",
        "diagnostic_finding": "DIAGNOSTIC FINDINGS",
        "automation_rule": "AUTOMATION RULES",
        "forecast": "FORECASTS",
        "financial": "FINANCIAL HEALTH",
    }

    for rtype in relevant_types:
        nodes = _nodes_by_type(ontology, rtype)
        if not nodes:
            continue
        parts.append(f"{type_labels.get(rtype, rtype.upper())}:")
        for n in nodes[:8]:
            p = n.get("properties", {})
            # Build a summary line based on type
            if rtype == "payer":
                parts.append(
                    f"  {n['label']}: {p.get('claim_volume', 0):,} claims, "
                    f"denial rate {_fmt_pct(p.get('denial_rate', 0) * 100)}, "
                    f"ADTP {p.get('adtp_days', 0)}d"
                )
            elif rtype == "root_cause":
                parts.append(
                    f"  {n['label']}: {p.get('count', 0)} occurrences, "
                    f"{_fmt_money(p.get('total_impact', 0))} impact"
                )
            elif rtype == "denial_category":
                parts.append(
                    f"  {n['label']}: {p.get('denial_count', 0)} denials, "
                    f"{_fmt_money(p.get('total_denied', 0))}"
                )
            elif rtype == "diagnostic_finding":
                parts.append(
                    f"  [{p.get('severity', 'INFO')}] {n['label']}: "
                    f"{_fmt_money(p.get('financial_impact', 0))} impact, "
                    f"{p.get('affected_claims', 0)} claims"
                )
            elif rtype == "adtp":
                parts.append(
                    f"  {p.get('payer_name', '')}: {p.get('actual_days', 0):.0f}d actual "
                    f"(expected {p.get('expected_days', 0)}d), "
                    f"deviation {p.get('deviation_days', 0):+.1f}d"
                    f"{' [ANOMALY]' if p.get('is_anomaly') else ''}"
                )
            elif rtype == "prevention_alert":
                parts.append(
                    f"  {p.get('alert_type', '')}: {p.get('alert_count', 0)} alerts, "
                    f"{_fmt_money(p.get('total_risk_amount', 0))} at risk"
                )
            elif rtype == "automation_rule":
                status = "ENABLED" if p.get("enabled") else "DISABLED"
                parts.append(f"  [{status}] {n['label']}: trigger={p.get('trigger', 'N/A')}")
            elif rtype == "forecast":
                parts.append(
                    f"  {p.get('payer_name', '')} ({p.get('week_start', '')}): "
                    f"{_fmt_money(p.get('forecasted_amount', 0))} "
                    f"(confidence {_fmt_pct(p.get('confidence', 0))})"
                )
            elif rtype == "claim_status":
                parts.append(f"  {n['label']}: {p.get('count', 0):,} claims ({_fmt_pct(p.get('percentage', 0))})")
            elif rtype == "process_stage":
                parts.append(f"  {n['label']}: {p.get('claims_in_stage', 0):,} claims ({_fmt_pct(p.get('throughput_pct', 0))})")
            elif rtype == "provider":
                parts.append(
                    f"  {n['label']} ({p.get('specialty', '')}): "
                    f"{p.get('total_claims', 0):,} claims, "
                    f"denial rate {_fmt_pct(p.get('denial_rate', 0) * 100)}"
                )
            else:
                parts.append(f"  {n['label']}: {p}")
        parts.append("")

    # Include relevant edges
    relevant_edge_types = set()
    if "payer" in relevant_types and "root_cause" in relevant_types:
        relevant_edge_types.add("payer_denies_via")
    if "diagnostic_finding" in relevant_types and "automation_rule" in relevant_types:
        relevant_edge_types.add("finding_recommends_rule")
    if "root_cause" in relevant_types and "prevention_alert" in relevant_types:
        relevant_edge_types.add("root_cause_preventable_by")
    if "adtp" in relevant_types:
        relevant_edge_types.add("payer_pays_in")

    for etype in relevant_edge_types:
        rel_edges = _edges_by_type(ontology, etype)
        if rel_edges:
            parts.append(f"RELATIONSHIPS ({etype}):")
            for e in rel_edges[:8]:
                parts.append(f"  {e.get('label', str(e.get('source', '')) + ' -> ' + str(e.get('target', '')))}")
            parts.append("")

    parts.append(f"Ontology: {ontology['node_count']} nodes, {ontology['edge_count']} edges, "
                 f"types: {', '.join(ontology['node_types'])}")
    return "\n".join(parts)
