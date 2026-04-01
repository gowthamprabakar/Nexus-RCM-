"""
RCM Ontology Service — v2.0
=============================
Builds a comprehensive knowledge graph from the live NEXUS RCM database.
Powers ALL AI layers: Descriptive, Diagnostic, Predictive, Prescriptive,
Root Cause, and LIDA Chat.

Node types:
  claim_status, payer, root_cause, denial_category, provider, process_stage,
  financial, adtp, prevention_alert, diagnostic_finding, automation_rule, forecast

Edge types:
  claim_payer, claim_denial, denial_root_cause, payer_payment_pattern,
  payer_denies_via, root_cause_preventable_by, finding_recommends_rule,
  payer_pays_in, claim_lifecycle
"""

import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

_ontology_cache: dict = {'data': None, 'ts': None}
_ONTOLOGY_CACHE_TTL = 600

def _get_cached_ontology():
    if (_ontology_cache['data'] is not None and _ontology_cache['ts'] is not None
        and (datetime.now() - _ontology_cache['ts']).total_seconds() < _ONTOLOGY_CACHE_TTL):
        return _ontology_cache['data']
    return None

def _set_cached_ontology(data):
    _ontology_cache['data'] = data
    _ontology_cache['ts'] = datetime.now()

ALL_NODE_TYPES = [
    "claim_status", "payer", "root_cause", "denial_category", "provider",
    "process_stage", "financial", "adtp", "prevention_alert",
    "diagnostic_finding", "automation_rule", "forecast",
]

ALL_EDGE_TYPES = [
    "claim_payer", "claim_denial", "denial_root_cause", "payer_payment_pattern",
    "payer_denies_via", "root_cause_preventable_by", "finding_recommends_rule",
    "payer_pays_in", "claim_lifecycle",
]


async def build_rcm_ontology(db: AsyncSession) -> dict:
    """
    Build RCM knowledge graph from live database.
    Returns nodes and edges representing the full RCM process flow
    across all AI layers.
    """
    cached = _get_cached_ontology()
    if cached is not None:
        return cached

    nodes = []
    edges = []

    # ── 1. Claim nodes: status distribution ──────────────────────────────
    claim_nodes = await _build_claim_nodes(db)
    nodes.extend(claim_nodes)

    # ── 2. Payer nodes: 50 payers with denial rates, ADTP, patterns ──────
    payer_nodes = await _build_payer_nodes(db)
    nodes.extend(payer_nodes)

    # ── 3. Root cause nodes: 15 categories with counts and impact ────────
    root_cause_nodes = await _build_root_cause_nodes(db)
    nodes.extend(root_cause_nodes)

    # ── 4. Denial category nodes: 6 categories with financial impact ─────
    denial_nodes = await _build_denial_category_nodes(db)
    nodes.extend(denial_nodes)

    # ── 5. Provider nodes: Top 20 providers with denial patterns ─────────
    provider_nodes = await _build_provider_nodes(db)
    nodes.extend(provider_nodes)

    # ── 6. Process stage nodes: 7 pipeline stages with throughput ────────
    stage_nodes = _build_process_stage_nodes(claim_nodes)
    nodes.extend(stage_nodes)

    # ── 7. Financial Health node: revenue metrics ────────────────────────
    financial_node = await _build_financial_health_node(db)
    if financial_node:
        nodes.append(financial_node)

    # ── 8. ADTP / Payment Timing nodes ───────────────────────────────────
    adtp_nodes = await _build_adtp_nodes(db)
    nodes.extend(adtp_nodes)

    # ── 9. Prevention Alert nodes ────────────────────────────────────────
    prevention_nodes = await _build_prevention_alert_nodes(db)
    nodes.extend(prevention_nodes)

    # ── 10. Diagnostic Finding nodes ─────────────────────────────────────
    diagnostic_nodes = await _build_diagnostic_finding_nodes(db)
    nodes.extend(diagnostic_nodes)

    # ── 11. Automation Rule nodes ────────────────────────────────────────
    automation_nodes = _build_automation_rule_nodes()
    nodes.extend(automation_nodes)

    # ── 12. Forecast nodes ───────────────────────────────────────────────
    forecast_nodes = await _build_forecast_nodes(db)
    nodes.extend(forecast_nodes)

    # ── 13. Build ALL edges (basic + enriched) ───────────────────────────
    edges.extend(await _build_edges(db))
    edges.extend(await _build_enriched_edges(db, root_cause_nodes, payer_nodes, adtp_nodes, diagnostic_nodes, automation_nodes, prevention_nodes, stage_nodes))

    result = {
        "ontology_version": "2.0",
        "node_count": len(nodes),
        "edge_count": len(edges),
        "nodes": nodes,
        "edges": edges,
        "node_types": list(set(n["type"] for n in nodes)),
        "edge_types": list(set(e["type"] for e in edges)),
    }
    _set_cached_ontology(result)
    return result


# ═══════════════════════════════════════════════════════════════════════════
# Original Node builders (unchanged)
# ═══════════════════════════════════════════════════════════════════════════

async def _build_claim_nodes(db: AsyncSession) -> list:
    """Claim status distribution nodes."""
    result = await db.execute(text("""
        SELECT status,
               COUNT(*)                  AS claim_count,
               COALESCE(SUM(total_charges), 0) AS total_charges,
               COALESCE(AVG(total_charges), 0) AS avg_charge
        FROM claims
        GROUP BY status
        ORDER BY claim_count DESC
    """))
    rows = result.all()
    total_claims = sum(r[1] for r in rows) if rows else 1

    return [
        {
            "id": f"claim_status_{row[0].lower().replace(' ', '_')}",
            "type": "claim_status",
            "label": row[0],
            "properties": {
                "count": int(row[1]),
                "total_charges": round(float(row[2]), 2),
                "avg_charge": round(float(row[3]), 2),
                "percentage": round(int(row[1]) / total_claims * 100, 1),
            },
        }
        for row in rows
    ]


async def _build_payer_nodes(db: AsyncSession) -> list:
    """Payer nodes with denial rates, ADTP, and payment patterns (up to 50)."""
    result = await db.execute(text("""
        SELECT pm.payer_id,
               pm.payer_name,
               pm.payer_group,
               pm.denial_rate,
               pm.adtp_days,
               pm.avg_payment_rate,
               pm.first_pass_rate,
               pm.avg_appeal_win_rate,
               pm.payment_method,
               COUNT(DISTINCT c.claim_id)                     AS claim_volume,
               COUNT(DISTINCT d.denial_id)                    AS denial_count,
               COALESCE(SUM(d.denial_amount), 0)              AS denied_amount,
               COALESCE(AVG(ep.payment_amount), 0)            AS avg_payment_amount
        FROM payer_master pm
        LEFT JOIN claims c    ON pm.payer_id = c.payer_id
        LEFT JOIN denials d   ON c.claim_id  = d.claim_id
        LEFT JOIN era_payments ep ON pm.payer_id = ep.payer_id
        GROUP BY pm.payer_id, pm.payer_name, pm.payer_group,
                 pm.denial_rate, pm.adtp_days, pm.avg_payment_rate,
                 pm.first_pass_rate, pm.avg_appeal_win_rate, pm.payment_method
        ORDER BY claim_volume DESC
        LIMIT 50
    """))
    rows = result.all()

    return [
        {
            "id": f"payer_{row[0]}",
            "type": "payer",
            "label": row[1],
            "properties": {
                "payer_id": row[0],
                "payer_group": row[2],
                "denial_rate": round(float(row[3] or 0), 4),
                "adtp_days": int(row[4] or 0),
                "avg_payment_rate": round(float(row[5] or 0), 4),
                "first_pass_rate": round(float(row[6] or 0), 4),
                "appeal_win_rate": round(float(row[7] or 0), 4),
                "payment_method": row[8] or "EFT",
                "claim_volume": int(row[9] or 0),
                "denial_count": int(row[10] or 0),
                "denied_amount": round(float(row[11] or 0), 2),
                "avg_payment_amount": round(float(row[12] or 0), 2),
            },
        }
        for row in rows
    ]


async def _build_root_cause_nodes(db: AsyncSession) -> list:
    """Root cause category nodes with counts and financial impact (up to 15)."""
    result = await db.execute(text("""
        SELECT rca.primary_root_cause,
               rca.root_cause_group,
               COUNT(*)                              AS occurrence_count,
               COALESCE(SUM(rca.financial_impact), 0) AS total_impact,
               COALESCE(AVG(rca.financial_impact), 0) AS avg_impact,
               COALESCE(AVG(rca.confidence_score), 0) AS avg_confidence
        FROM root_cause_analysis rca
        GROUP BY rca.primary_root_cause, rca.root_cause_group
        ORDER BY occurrence_count DESC
        LIMIT 15
    """))
    rows = result.all()

    return [
        {
            "id": f"root_cause_{row[0].lower().replace(' ', '_')}",
            "type": "root_cause",
            "label": row[0],
            "properties": {
                "root_cause_group": row[1],
                "count": int(row[2]),
                "total_impact": round(float(row[3]), 2),
                "avg_impact": round(float(row[4]), 2),
                "avg_confidence": round(float(row[5]), 1),
            },
        }
        for row in rows
    ]


async def _build_denial_category_nodes(db: AsyncSession) -> list:
    """Denial category nodes with financial impact (up to 6)."""
    result = await db.execute(text("""
        SELECT d.denial_category,
               COUNT(*)                             AS denial_count,
               COALESCE(SUM(d.denial_amount), 0)    AS total_denied,
               COALESCE(AVG(d.denial_amount), 0)    AS avg_denied,
               COUNT(DISTINCT d.claim_id)            AS claims_affected,
               COUNT(DISTINCT c.payer_id)            AS payers_involved
        FROM denials d
        LEFT JOIN claims c ON d.claim_id = c.claim_id
        GROUP BY d.denial_category
        ORDER BY total_denied DESC
        LIMIT 6
    """))
    rows = result.all()

    return [
        {
            "id": f"denial_cat_{row[0].lower().replace(' ', '_').replace('/', '_')}",
            "type": "denial_category",
            "label": row[0],
            "properties": {
                "denial_count": int(row[1]),
                "total_denied": round(float(row[2]), 2),
                "avg_denied": round(float(row[3]), 2),
                "claims_affected": int(row[4]),
                "payers_involved": int(row[5]),
            },
        }
        for row in rows
    ]


async def _build_provider_nodes(db: AsyncSession) -> list:
    """Top 20 providers with denial patterns."""
    result = await db.execute(text("""
        SELECT p.provider_id,
               p.provider_name,
               p.specialty,
               p.facility_type,
               COUNT(DISTINCT c.claim_id)             AS total_claims,
               COUNT(DISTINCT d.denial_id)            AS denial_count,
               COALESCE(SUM(c.total_charges), 0)      AS total_charges,
               COALESCE(SUM(d.denial_amount), 0)      AS denied_amount
        FROM providers p
        LEFT JOIN claims c   ON p.provider_id = c.provider_id
        LEFT JOIN denials d  ON c.claim_id    = d.claim_id
        GROUP BY p.provider_id, p.provider_name, p.specialty, p.facility_type
        ORDER BY total_claims DESC
        LIMIT 20
    """))
    rows = result.all()

    return [
        {
            "id": f"provider_{row[0]}",
            "type": "provider",
            "label": row[1],
            "properties": {
                "provider_id": row[0],
                "specialty": row[2],
                "facility_type": row[3],
                "total_claims": int(row[4] or 0),
                "denial_count": int(row[5] or 0),
                "total_charges": round(float(row[6] or 0), 2),
                "denied_amount": round(float(row[7] or 0), 2),
                "denial_rate": round(int(row[5] or 0) / max(int(row[4] or 0), 1), 4),
            },
        }
        for row in rows
    ]


def _build_process_stage_nodes(claim_nodes: list) -> list:
    """
    7 RCM pipeline stages with throughput derived from claim status distribution.
    Maps claim statuses to logical pipeline stages.
    """
    # Map claim statuses to pipeline stages
    status_to_stage = {
        "DRAFT": "stage_1_registration",
        "SUBMITTED": "stage_2_submission",
        "ACKNOWLEDGED": "stage_3_adjudication",
        "PAID": "stage_4_payment",
        "DENIED": "stage_5_denial_mgmt",
        "APPEALED": "stage_6_appeals",
        "WRITTEN_OFF": "stage_7_write_off",
    }

    stage_labels = {
        "stage_1_registration": "Patient Registration & Eligibility",
        "stage_2_submission": "Claim Submission",
        "stage_3_adjudication": "Payer Adjudication",
        "stage_4_payment": "Payment & Posting",
        "stage_5_denial_mgmt": "Denial Management",
        "stage_6_appeals": "Appeals Processing",
        "stage_7_write_off": "Write-Off & Collections",
    }

    # Aggregate counts from claim nodes
    stage_counts = {}
    for node in claim_nodes:
        status = node["label"]
        stage_id = status_to_stage.get(status)
        if stage_id:
            if stage_id not in stage_counts:
                stage_counts[stage_id] = {"count": 0, "charges": 0.0}
            stage_counts[stage_id]["count"] += node["properties"]["count"]
            stage_counts[stage_id]["charges"] += node["properties"]["total_charges"]

    total = sum(s["count"] for s in stage_counts.values()) or 1

    return [
        {
            "id": stage_id,
            "type": "process_stage",
            "label": stage_labels.get(stage_id, stage_id),
            "properties": {
                "claims_in_stage": data["count"],
                "total_charges": round(data["charges"], 2),
                "throughput_pct": round(data["count"] / total * 100, 1),
                "stage_order": int(stage_id.split("_")[1]),
            },
        }
        for stage_id, data in sorted(stage_counts.items())
    ]


# ═══════════════════════════════════════════════════════════════════════════
# NEW Node builders (v2.0 — powering all AI layers)
# ═══════════════════════════════════════════════════════════════════════════

async def _build_financial_health_node(db: AsyncSession) -> dict | None:
    """Revenue health metrics node for Descriptive + Predictive layers."""
    try:
        total_billed = await db.scalar(text("SELECT COALESCE(SUM(total_charges), 0) FROM claims"))
        total_collected = await db.scalar(text("SELECT COALESCE(SUM(payment_amount), 0) FROM era_payments"))
        total_denied = await db.scalar(text("SELECT COALESCE(SUM(denial_amount), 0) FROM denials"))
        total_ar = await db.scalar(text(
            "SELECT COALESCE(SUM(total_charges), 0) FROM claims "
            "WHERE status NOT IN ('PAID','WRITTEN_OFF','VOIDED')"
        ))

        billed = float(total_billed or 0)
        collected = float(total_collected or 0)
        denied = float(total_denied or 0)
        ar = float(total_ar or 0)

        return {
            "id": "financial-health",
            "type": "financial",
            "label": "Revenue Health",
            "properties": {
                "total_billed": round(billed, 2),
                "total_collected": round(collected, 2),
                "total_denied": round(denied, 2),
                "total_ar": round(ar, 2),
                "collection_rate": round(collected / max(billed, 1) * 100, 1),
                "denial_rate": round(denied / max(billed, 1) * 100, 1),
                "ar_to_billed_ratio": round(ar / max(billed, 1) * 100, 1),
                "net_yield": round((collected - denied) / max(billed, 1) * 100, 1),
            },
        }
    except Exception as e:
        logger.warning(f"Financial health node build failed: {e}")
        return None


async def _build_adtp_nodes(db: AsyncSession) -> list:
    """ADTP (Average Days To Pay) trend nodes for Predictive layer."""
    try:
        result = await db.execute(text("""
            SELECT at.payer_id,
                   pm.payer_name,
                   at.expected_adtp_days,
                   at.actual_adtp_days,
                   at.deviation_days,
                   at.deviation_pct,
                   at.z_score,
                   at.is_anomaly,
                   at.anomaly_type,
                   at.payment_count,
                   at.total_amount,
                   at.calculation_date
            FROM adtp_trend at
            JOIN payer_master pm ON at.payer_id = pm.payer_id
            WHERE at.calculation_date = (
                SELECT MAX(calculation_date) FROM adtp_trend at2
                WHERE at2.payer_id = at.payer_id
            )
            ORDER BY at.total_amount DESC
            LIMIT 30
        """))
        rows = result.all()

        return [
            {
                "id": f"adtp_{row[0]}",
                "type": "adtp",
                "label": f"ADTP: {row[1]}",
                "properties": {
                    "payer_id": row[0],
                    "payer_name": row[1],
                    "expected_days": int(row[2] or 0),
                    "actual_days": round(float(row[3] or 0), 1),
                    "deviation_days": round(float(row[4] or 0), 1),
                    "deviation_pct": round(float(row[5] or 0), 1),
                    "z_score": round(float(row[6] or 0), 2),
                    "is_anomaly": bool(row[7]),
                    "anomaly_type": row[8],
                    "payment_count": int(row[9] or 0),
                    "total_amount": round(float(row[10] or 0), 2),
                    "as_of": str(row[11]) if row[11] else None,
                },
            }
            for row in rows
        ]
    except Exception as e:
        logger.warning(f"ADTP nodes build failed: {e}")
        return []


async def _build_prevention_alert_nodes(db: AsyncSession) -> list:
    """Prevention alert nodes from the prevention engine for Prescriptive layer."""
    try:
        from app.services.prevention_service import scan_claims_for_prevention
        prevention_data = await scan_claims_for_prevention(db, limit=50)
        alerts = prevention_data.get("alerts", [])

        # Group by alert type
        alert_groups = {}
        for alert in alerts:
            atype = alert.get("prevention_type", "unknown")
            if atype not in alert_groups:
                alert_groups[atype] = {
                    "count": 0,
                    "total_risk": 0.0,
                    "claim_ids": [],
                    "severity": alert.get("severity", "warning"),
                }
            alert_groups[atype]["count"] += 1
            alert_groups[atype]["total_risk"] += float(alert.get("revenue_at_risk", 0))
            if len(alert_groups[atype]["claim_ids"]) < 5:
                alert_groups[atype]["claim_ids"].append(alert.get("claim_id", ""))

        return [
            {
                "id": f"prevention_{atype.lower().replace(' ', '_')}",
                "type": "prevention_alert",
                "label": f"Prevention: {atype}",
                "properties": {
                    "alert_type": atype,
                    "alert_count": data["count"],
                    "total_risk_amount": round(data["total_risk"], 2),
                    "severity": data["severity"],
                    "sample_claims": data["claim_ids"],
                },
            }
            for atype, data in alert_groups.items()
        ]
    except Exception as e:
        logger.warning(f"Prevention alert nodes build failed: {e}")
        return []


async def _build_diagnostic_finding_nodes(db: AsyncSession) -> list:
    """Active diagnostic findings nodes for Diagnostic layer."""
    try:
        result = await db.execute(text("""
            SELECT finding_id, category, severity, title, description,
                   COALESCE(financial_impact, 0) AS impact,
                   COALESCE(affected_claims, 0) AS claims,
                   payer_id, payer_name, root_cause,
                   recommended_action, status
            FROM diagnostic_finding
            WHERE status = 'ACTIVE'
            ORDER BY financial_impact DESC NULLS LAST
            LIMIT 20
        """))
        rows = result.all()

        return [
            {
                "id": f"diag_{row[0]}",
                "type": "diagnostic_finding",
                "label": row[3],
                "properties": {
                    "finding_id": row[0],
                    "category": row[1],
                    "severity": row[2],
                    "description": row[4],
                    "financial_impact": round(float(row[5]), 2),
                    "affected_claims": int(row[6]),
                    "payer_id": row[7],
                    "payer_name": row[8],
                    "root_cause": row[9],
                    "recommended_action": row[10],
                    "status": row[11],
                },
            }
            for row in rows
        ]
    except Exception as e:
        logger.warning(f"Diagnostic finding nodes build failed: {e}")
        return []


def _build_automation_rule_nodes() -> list:
    """Automation rule nodes for Prescriptive layer."""
    try:
        from app.services.automation_engine import AUTOMATION_RULES
        return [
            {
                "id": f"rule_{rule['rule_id'].lower().replace('-', '_')}",
                "type": "automation_rule",
                "label": rule["name"],
                "properties": {
                    "rule_id": rule["rule_id"],
                    "trigger": rule["trigger"],
                    "condition": rule["condition"],
                    "action_template": rule["action_template"],
                    "enabled": rule.get("enabled", True),
                    "requires_approval": rule.get("requires_approval", False),
                },
            }
            for rule in AUTOMATION_RULES
        ]
    except Exception as e:
        logger.warning(f"Automation rule nodes build failed: {e}")
        return []


async def _build_forecast_nodes(db: AsyncSession) -> list:
    """Payment forecast nodes for Predictive layer."""
    try:
        result = await db.execute(text("""
            SELECT pf.payer_id,
                   pf.payer_name,
                   pf.week_start_date,
                   pf.week_end_date,
                   pf.forecasted_amount,
                   pf.claim_count_in_window,
                   pf.model_confidence,
                   pf.forecast_range_low,
                   pf.forecast_range_high,
                   pf.adtp_cycle_hits
            FROM payment_forecast pf
            WHERE pf.week_start_date >= CURRENT_DATE
            ORDER BY pf.week_start_date, pf.forecasted_amount DESC
            LIMIT 40
        """))
        rows = result.all()

        return [
            {
                "id": f"forecast_{row[0]}_{str(row[2])}",
                "type": "forecast",
                "label": f"Forecast: {row[1]} ({row[2]})",
                "properties": {
                    "payer_id": row[0],
                    "payer_name": row[1],
                    "week_start": str(row[2]) if row[2] else None,
                    "week_end": str(row[3]) if row[3] else None,
                    "forecasted_amount": round(float(row[4] or 0), 2),
                    "claim_count": int(row[5] or 0),
                    "confidence": round(float(row[6] or 0), 2),
                    "range_low": round(float(row[7] or 0), 2),
                    "range_high": round(float(row[8] or 0), 2),
                    "adtp_cycle_hits": bool(row[9]),
                },
            }
            for row in rows
        ]
    except Exception as e:
        logger.warning(f"Forecast nodes build failed: {e}")
        return []


# ═══════════════════════════════════════════════════════════════════════════
# Original Edge builder (unchanged)
# ═══════════════════════════════════════════════════════════════════════════

async def _build_edges(db: AsyncSession) -> list:
    """Build edges connecting nodes in the ontology graph."""
    edges = []

    # ── Claim -> Payer edges (volume per payer) ───────────────────────────
    result = await db.execute(text("""
        SELECT c.payer_id, c.status, COUNT(*) AS cnt
        FROM claims c
        GROUP BY c.payer_id, c.status
        ORDER BY cnt DESC
        LIMIT 200
    """))
    for row in result.all():
        edges.append({
            "source": f"claim_status_{row[1].lower().replace(' ', '_')}",
            "target": f"payer_{row[0]}",
            "type": "claim_payer",
            "properties": {"claim_count": int(row[2])},
        })

    # ── Claim -> Denial edges (denied claims per category) ────────────────
    result = await db.execute(text("""
        SELECT d.denial_category, COUNT(*) AS cnt,
               COALESCE(SUM(d.denial_amount), 0) AS amount
        FROM denials d
        GROUP BY d.denial_category
    """))
    for row in result.all():
        cat_id = row[0].lower().replace(' ', '_').replace('/', '_')
        edges.append({
            "source": "claim_status_denied",
            "target": f"denial_cat_{cat_id}",
            "type": "claim_denial",
            "properties": {
                "denial_count": int(row[1]),
                "denied_amount": round(float(row[2]), 2),
            },
        })

    # ── Denial -> Root Cause edges ────────────────────────────────────────
    result = await db.execute(text("""
        SELECT rca.primary_root_cause, d.denial_category,
               COUNT(*) AS cnt,
               COALESCE(SUM(rca.financial_impact), 0) AS impact
        FROM root_cause_analysis rca
        JOIN denials d ON rca.denial_id = d.denial_id
        GROUP BY rca.primary_root_cause, d.denial_category
        ORDER BY cnt DESC
        LIMIT 100
    """))
    for row in result.all():
        cat_id = row[1].lower().replace(' ', '_').replace('/', '_')
        rc_id = row[0].lower().replace(' ', '_')
        edges.append({
            "source": f"denial_cat_{cat_id}",
            "target": f"root_cause_{rc_id}",
            "type": "denial_root_cause",
            "properties": {
                "count": int(row[2]),
                "financial_impact": round(float(row[3]), 2),
            },
        })

    # ── Payer -> Payment Pattern edges ────────────────────────────────────
    result = await db.execute(text("""
        SELECT ep.payer_id,
               COUNT(*)                             AS payment_count,
               COALESCE(AVG(ep.payment_amount), 0)  AS avg_payment,
               COALESCE(SUM(ep.payment_amount), 0)  AS total_paid
        FROM era_payments ep
        GROUP BY ep.payer_id
        ORDER BY total_paid DESC
        LIMIT 50
    """))
    for row in result.all():
        edges.append({
            "source": f"payer_{row[0]}",
            "target": "claim_status_paid",
            "type": "payer_payment_pattern",
            "properties": {
                "payment_count": int(row[1]),
                "avg_payment": round(float(row[2]), 2),
                "total_paid": round(float(row[3]), 2),
            },
        })

    return edges


# ═══════════════════════════════════════════════════════════════════════════
# NEW Enriched Edge builder (v2.0 — weighted, typed edges)
# ═══════════════════════════════════════════════════════════════════════════

async def _build_enriched_edges(
    db: AsyncSession,
    root_cause_nodes: list,
    payer_nodes: list,
    adtp_nodes: list,
    diagnostic_nodes: list,
    automation_nodes: list,
    prevention_nodes: list,
    stage_nodes: list,
) -> list:
    """Build weighted, typed edges for the enriched ontology."""
    edges = []

    # ── payer --denies_via--> root_cause (with count + amount) ────────────
    try:
        result = await db.execute(text("""
            SELECT pm.payer_id, pm.payer_name,
                   rca.primary_root_cause,
                   COUNT(*) AS denial_count,
                   COALESCE(SUM(rca.financial_impact), 0) AS impact
            FROM root_cause_analysis rca
            JOIN denials d ON rca.denial_id = d.denial_id
            JOIN claims c ON d.claim_id = c.claim_id
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            GROUP BY pm.payer_id, pm.payer_name, rca.primary_root_cause
            ORDER BY denial_count DESC
            LIMIT 100
        """))
        for row in result.all():
            rc_id = row[2].lower().replace(' ', '_')
            edges.append({
                "source": f"payer_{row[0]}",
                "target": f"root_cause_{rc_id}",
                "type": "payer_denies_via",
                "weight": int(row[3]),
                "label": f"{row[1]} has {int(row[3])} {row[2]} denials",
                "properties": {
                    "denial_count": int(row[3]),
                    "financial_impact": round(float(row[4]), 2),
                },
            })
    except Exception as e:
        logger.warning(f"payer_denies_via edges failed: {e}")

    # ── root_cause --preventable_by--> prevention_rule ────────────────────
    # Map root cause keywords to prevention types
    root_cause_prevention_map = {
        "eligibility": "ELIGIBILITY",
        "authorization": "AUTH_EXPIRY",
        "timely_filing": "TIMELY_FILING",
        "duplicate": "DUPLICATE_CLAIMS",
        "coding": "PAYER_CPT_RISK",
    }
    for rc_node in root_cause_nodes:
        rc_label_lower = rc_node["label"].lower()
        for keyword, prevention_type in root_cause_prevention_map.items():
            if keyword in rc_label_lower:
                prev_node_id = f"prevention_{prevention_type.lower()}"
                # Check if prevention node exists
                if any(pn["id"] == prev_node_id for pn in prevention_nodes):
                    edges.append({
                        "source": rc_node["id"],
                        "target": prev_node_id,
                        "type": "root_cause_preventable_by",
                        "weight": rc_node["properties"]["count"],
                        "label": f"{rc_node['label']} preventable by {prevention_type}",
                        "properties": {
                            "root_cause_count": rc_node["properties"]["count"],
                            "potential_savings": rc_node["properties"]["total_impact"],
                        },
                    })

    # ── diagnostic_finding --recommends--> automation_rule ────────────────
    # Match findings by category to automation rule conditions
    for diag_node in diagnostic_nodes:
        diag_cat = diag_node["properties"].get("category", "")
        for auto_node in automation_nodes:
            rule_condition_cat = auto_node["properties"].get("condition", {}).get("category", "")
            if rule_condition_cat and rule_condition_cat == diag_cat:
                edges.append({
                    "source": diag_node["id"],
                    "target": auto_node["id"],
                    "type": "finding_recommends_rule",
                    "weight": int(diag_node["properties"].get("affected_claims", 0)),
                    "label": f"Finding '{diag_node['label']}' triggers rule '{auto_node['label']}'",
                    "properties": {
                        "finding_severity": diag_node["properties"].get("severity", "INFO"),
                        "financial_impact": diag_node["properties"].get("financial_impact", 0),
                        "rule_enabled": auto_node["properties"].get("enabled", True),
                    },
                })

    # ── payer --pays_in--> adtp_days ──────────────────────────────────────
    for adtp_node in adtp_nodes:
        payer_id = adtp_node["properties"].get("payer_id", "")
        payer_node_id = f"payer_{payer_id}"
        if any(pn["id"] == payer_node_id for pn in payer_nodes):
            edges.append({
                "source": payer_node_id,
                "target": adtp_node["id"],
                "type": "payer_pays_in",
                "weight": int(adtp_node["properties"].get("actual_days", 0)),
                "label": f"{adtp_node['properties'].get('payer_name', '')} pays in {adtp_node['properties'].get('actual_days', 0):.0f} days",
                "properties": {
                    "expected_days": adtp_node["properties"].get("expected_days", 0),
                    "actual_days": adtp_node["properties"].get("actual_days", 0),
                    "deviation_days": adtp_node["properties"].get("deviation_days", 0),
                    "is_anomaly": adtp_node["properties"].get("is_anomaly", False),
                    "total_amount": adtp_node["properties"].get("total_amount", 0),
                },
            })

    # ── claim_status --flows_to--> next_status (lifecycle) ────────────────
    lifecycle_flow = [
        ("stage_1_registration", "stage_2_submission"),
        ("stage_2_submission", "stage_3_adjudication"),
        ("stage_3_adjudication", "stage_4_payment"),
        ("stage_3_adjudication", "stage_5_denial_mgmt"),
        ("stage_5_denial_mgmt", "stage_6_appeals"),
        ("stage_6_appeals", "stage_4_payment"),
        ("stage_6_appeals", "stage_7_write_off"),
        ("stage_5_denial_mgmt", "stage_7_write_off"),
    ]
    stage_ids = {s["id"] for s in stage_nodes}
    for src, tgt in lifecycle_flow:
        if src in stage_ids and tgt in stage_ids:
            edges.append({
                "source": src,
                "target": tgt,
                "type": "claim_lifecycle",
                "weight": 1,
                "label": f"Claims flow from {src.split('_', 2)[-1]} to {tgt.split('_', 2)[-1]}",
                "properties": {},
            })

    return edges
