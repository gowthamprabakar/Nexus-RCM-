"""
Payer Agent Profiles Service
==============================
Builds digital twin agent profiles for each payer from live DB data.
Each agent has a persona, behavior patterns, and decision rules
that MiroFish uses to simulate payer adjudication behavior.
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)


async def build_payer_agents(db: AsyncSession) -> list:
    """
    Build digital twin agent profiles for each payer from live DB data.
    Each agent has personality, behavior patterns, and decision rules
    derived from historical claim/denial/payment data.
    """
    # ── 1. Get base payer info + denial/claim counts ─────────────────────
    payer_result = await db.execute(text("""
        SELECT pm.payer_id,
               pm.payer_name,
               pm.payer_group,
               pm.denial_rate,
               pm.adtp_days,
               pm.avg_payment_rate,
               pm.first_pass_rate,
               pm.avg_appeal_win_rate,
               pm.payment_method,
               COUNT(DISTINCT c.claim_id)   AS total_claims,
               COUNT(DISTINCT d.denial_id)  AS total_denials
        FROM payer_master pm
        LEFT JOIN claims c  ON pm.payer_id = c.payer_id
        LEFT JOIN denials d ON c.claim_id  = d.claim_id
        GROUP BY pm.payer_id, pm.payer_name, pm.payer_group,
                 pm.denial_rate, pm.adtp_days, pm.avg_payment_rate,
                 pm.first_pass_rate, pm.avg_appeal_win_rate, pm.payment_method
        ORDER BY total_claims DESC
        LIMIT 50
    """))
    payer_rows = payer_result.all()

    if not payer_rows:
        logger.warning("No payer data found in database")
        return []

    # ── 2. Get top denial categories per payer ───────────────────────────
    denial_cat_result = await db.execute(text("""
        SELECT c.payer_id,
               d.denial_category,
               COUNT(*) AS cnt
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        GROUP BY c.payer_id, d.denial_category
        ORDER BY c.payer_id, cnt DESC
    """))
    denial_cats_by_payer = {}
    for row in denial_cat_result.all():
        payer_id = row[0]
        if payer_id not in denial_cats_by_payer:
            denial_cats_by_payer[payer_id] = []
        denial_cats_by_payer[payer_id].append({
            "category": row[1],
            "count": int(row[2]),
        })

    # ── 3. Get root cause distribution per payer ─────────────────────────
    root_cause_result = await db.execute(text("""
        SELECT rca.payer_id,
               rca.primary_root_cause,
               rca.root_cause_group,
               COUNT(*) AS cnt,
               COALESCE(SUM(rca.financial_impact), 0) AS total_impact
        FROM root_cause_analysis rca
        GROUP BY rca.payer_id, rca.primary_root_cause, rca.root_cause_group
        ORDER BY rca.payer_id, cnt DESC
    """))
    root_causes_by_payer = {}
    for row in root_cause_result.all():
        payer_id = row[0]
        if payer_id not in root_causes_by_payer:
            root_causes_by_payer[payer_id] = []
        root_causes_by_payer[payer_id].append({
            "root_cause": row[1],
            "group": row[2],
            "count": int(row[3]),
            "total_impact": round(float(row[4]), 2),
        })

    # ── 4. Get payment accuracy from ERA data ────────────────────────────
    payment_result = await db.execute(text("""
        SELECT ep.payer_id,
               COUNT(*)                             AS payment_count,
               COALESCE(AVG(ep.payment_amount), 0)  AS avg_payment,
               COALESCE(SUM(ep.payment_amount), 0)  AS total_paid,
               COALESCE(AVG(ep.allowed_amount), 0)   AS avg_allowed
        FROM era_payments ep
        GROUP BY ep.payer_id
    """))
    payments_by_payer = {}
    for row in payment_result.all():
        avg_payment = float(row[2] or 0)
        avg_allowed = float(row[4] or 0)
        accuracy = round(avg_payment / avg_allowed, 4) if avg_allowed > 0 else 0.0
        payments_by_payer[row[0]] = {
            "payment_count": int(row[1]),
            "avg_payment": round(avg_payment, 2),
            "total_paid": round(float(row[3]), 2),
            "payment_accuracy": min(accuracy, 1.0),
        }

    # ── 5. Get appeal outcomes per payer ──────────────────────────────────
    appeal_result = await db.execute(text("""
        SELECT c.payer_id,
               a.outcome,
               COUNT(*) AS cnt
        FROM appeals a
        JOIN denials d ON a.denial_id = d.denial_id
        JOIN claims c  ON d.claim_id  = c.claim_id
        GROUP BY c.payer_id, a.outcome
    """))
    appeals_by_payer = {}
    for row in appeal_result.all():
        payer_id = row[0]
        if payer_id not in appeals_by_payer:
            appeals_by_payer[payer_id] = {"total": 0, "approved": 0}
        appeals_by_payer[payer_id]["total"] += int(row[2])
        if row[1] in ("APPROVED", "Approved"):
            appeals_by_payer[payer_id]["approved"] += int(row[2])

    # ── 6. Assemble agent profiles ───────────────────────────────────────
    agents = []
    for row in payer_rows:
        payer_id = row[0]
        payer_name = row[1]
        payer_group = row[2]
        denial_rate = float(row[3] or 0)
        adtp_days = int(row[4] or 0)
        first_pass_rate = float(row[6] or 0)
        appeal_win_rate = float(row[7] or 0)
        total_claims = int(row[9] or 0)
        total_denials = int(row[10] or 0)

        # Top denial reasons (top 5)
        payer_denial_cats = denial_cats_by_payer.get(payer_id, [])
        top_denial_reasons = [c["category"] for c in payer_denial_cats[:5]]

        # Root cause distribution
        payer_root_causes = root_causes_by_payer.get(payer_id, [])

        # Payment accuracy
        payment_info = payments_by_payer.get(payer_id, {})
        payment_accuracy = payment_info.get("payment_accuracy", 0.0)

        # Appeal reversal rate
        appeal_info = appeals_by_payer.get(payer_id, {"total": 0, "approved": 0})
        appeal_reversal_rate = (
            round(appeal_info["approved"] / appeal_info["total"], 4)
            if appeal_info["total"] > 0 else appeal_win_rate
        )

        # Build decision rules from observed patterns
        decision_rules = _generate_decision_rules(
            payer_name, payer_group, denial_rate,
            top_denial_reasons, adtp_days, first_pass_rate,
        )

        # Build persona string
        group_label = _format_group_label(payer_group)
        persona = (
            f"I am {payer_name}, a {group_label} payer. "
            f"I process approximately {total_claims} claims with a "
            f"{round(denial_rate * 100, 1)}% denial rate. "
            f"My average days to payment is {adtp_days} days."
        )

        agents.append({
            "agent_id": payer_id,
            "name": payer_name,
            "payer_group": payer_group,
            "persona": persona,
            "behavior": {
                "denial_rate": round(denial_rate, 4),
                "top_denial_reasons": top_denial_reasons,
                "avg_days_to_pay": adtp_days,
                "payment_accuracy": round(payment_accuracy, 4),
                "appeal_reversal_rate": round(appeal_reversal_rate, 4),
                "first_pass_rate": round(first_pass_rate, 4),
                "claim_volume": total_claims,
                "denial_count": total_denials,
            },
            "root_cause_distribution": [
                {
                    "root_cause": rc["root_cause"],
                    "group": rc["group"],
                    "count": rc["count"],
                    "impact": rc["total_impact"],
                }
                for rc in payer_root_causes[:10]
            ],
            "payment_profile": {
                "method": row[8] or "EFT",
                "avg_payment": payment_info.get("avg_payment", 0.0),
                "total_paid": payment_info.get("total_paid", 0.0),
                "payment_count": payment_info.get("payment_count", 0),
            },
            "decision_rules": decision_rules,
        })

    return agents


def _format_group_label(payer_group: str) -> str:
    """Convert payer_group code to human-readable label."""
    labels = {
        "G1_FEDERAL_FFS": "Federal Fee-for-Service",
        "G2_MEDICARE_ADVANTAGE": "Medicare Advantage",
        "G3_COMMERCIAL_NATIONAL": "National Commercial",
        "G4_COMMERCIAL_REGIONAL": "Regional Commercial",
        "G5_MANAGED_MEDICAID": "Managed Medicaid",
        "G6_STATE_MEDICAID": "State Medicaid",
        "G7_WORKERS_COMP_AUTO": "Workers Comp / Auto",
        "G8_SELF_PAY_SECONDARY": "Self-Pay / Secondary",
    }
    return labels.get(payer_group, payer_group)


def _generate_decision_rules(
    payer_name: str,
    payer_group: str,
    denial_rate: float,
    top_denial_reasons: list,
    adtp_days: int,
    first_pass_rate: float,
) -> list:
    """
    Generate decision rules based on observed payer behavior patterns.
    These rules describe how the payer agent makes adjudication decisions.
    """
    rules = []

    # Denial rate thresholds
    denial_pct = round(denial_rate * 100, 1)
    if denial_rate > 0.15:
        rules.append(f"I am a high-denial payer, rejecting {denial_pct}% of submitted claims")
    elif denial_rate > 0.08:
        rules.append(f"I have a moderate denial rate of {denial_pct}%, focusing on documentation gaps")
    else:
        rules.append(f"I have a low denial rate of {denial_pct}%, primarily denying clear policy violations")

    # Category-specific rules
    category_rules = {
        "CODING": "I deny claims with coding mismatches, modifier issues, or unbundled CPT codes",
        "AUTHORIZATION": "I require prior authorization for surgical and high-cost procedure CPT codes",
        "AUTH": "I require prior authorization for surgical and high-cost procedure CPT codes",
        "ELIGIBILITY": "I deny claims when patient eligibility has lapsed or coverage is terminated",
        "TIMELY_FILING": f"I enforce strict timely filing limits and deny claims submitted late",
        "DOCUMENTATION": "I deny claims missing required clinical documentation or modifier justification",
        "COB": "I deny claims with coordination of benefits errors or incorrect primary payer",
        "MEDICAL_NECESSITY": "I require medical necessity documentation for non-routine procedures",
    }
    for cat in top_denial_reasons[:3]:
        cat_upper = cat.upper().replace(" ", "_")
        for key, rule in category_rules.items():
            if key in cat_upper:
                rules.append(rule)
                break

    # Payment behavior rules
    if adtp_days > 45:
        rules.append(f"I am a slow payer with {adtp_days}-day average payment cycle")
    elif adtp_days > 30:
        rules.append(f"I pay within a standard {adtp_days}-day cycle")
    else:
        rules.append(f"I am a fast payer with {adtp_days}-day average turnaround")

    # First pass rate rules
    fpr_pct = round(first_pass_rate * 100, 1)
    if first_pass_rate < 0.85:
        rules.append(f"Only {fpr_pct}% of claims pass on first submission; I frequently request additional info")
    else:
        rules.append(f"{fpr_pct}% of clean claims are adjudicated on first pass")

    # Group-specific rules
    group_rules = {
        "G1_FEDERAL_FFS": "I follow CMS Medicare fee schedule guidelines strictly",
        "G2_MEDICARE_ADVANTAGE": "I apply MA plan-specific coverage policies on top of CMS guidelines",
        "G3_COMMERCIAL_NATIONAL": "I follow national commercial plan policies with network requirements",
        "G5_MANAGED_MEDICAID": "I follow state Medicaid fee schedules with managed care overlay",
        "G6_STATE_MEDICAID": "I follow state-specific Medicaid rules and timely filing windows",
        "G7_WORKERS_COMP_AUTO": "I require injury-specific documentation and employer authorization",
    }
    if payer_group in group_rules:
        rules.append(group_rules[payer_group])

    return rules
