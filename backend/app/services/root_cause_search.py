"""
Root Cause Search Engine
=========================
When user asks WHY something is happening, this engine:
1. Identifies the entity being questioned (payer, category, CPT, etc.)
2. Queries root_cause_analysis linked to that entity
3. Returns ranked root causes with financial impact
4. Suggests actionable next steps
"""
import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

# ── Known payer name fragments for entity detection ─────────────────────────
_PAYER_KEYWORDS = [
    'medicare', 'medicaid', 'tricare', 'aetna', 'cigna', 'humana',
    'united', 'unitedhealthcare', 'uhc', 'bcbs', 'blue cross',
    'anthem', 'molina', 'centene', 'wellcare', 'ambetter', 'oscar',
    'kaiser', 'geisinger', 'highmark', 'carefirst',
]

# ── Denial categories ──────────────────────────────────────────────────────
_CATEGORY_KEYWORDS = [
    'coding', 'eligibility', 'authorization', 'auth', 'timely filing',
    'duplicate', 'bundling', 'cob', 'documentation', 'medical necessity',
    'non-covered', 'enrollment',
]

# ── Root cause group labels ─────────────────────────────────────────────────
_ROOT_CAUSE_ACTIONS = {
    'MODIFIER_MISMATCH':     {'action': 'Auto-appeal {count} MODIFIER_MISMATCH claims', 'type': 'automation'},
    'ELIGIBILITY_LAPSE':     {'action': 'Re-verify eligibility for {count} claims', 'type': 'prevention'},
    'AUTH_MISSING':           {'action': 'Retroactive auth request for {count} claims', 'type': 'automation'},
    'AUTH_EXPIRED':           {'action': 'Flag {count} claims for auth renewal workflow', 'type': 'prevention'},
    'TIMELY_FILING_MISS':    {'action': 'Escalate {count} timely-filing misses to billing team', 'type': 'investigation'},
    'CODING_MISMATCH':       {'action': 'Queue {count} claims for coding review', 'type': 'investigation'},
    'COB_ORDER_ERROR':       {'action': 'Correct COB order on {count} claims', 'type': 'automation'},
    'BUNDLING_ERROR':        {'action': 'Review unbundling logic for {count} claims', 'type': 'investigation'},
    'DUPLICATE_CLAIM':       {'action': 'De-duplicate {count} claims', 'type': 'automation'},
    'DOCUMENTATION_DEFICIT': {'action': 'Request documentation for {count} claims', 'type': 'investigation'},
    'PROCESS_BREAKDOWN':     {'action': 'Audit workflow for {count} process failures', 'type': 'investigation'},
    'PAYER_BEHAVIOR_SHIFT':  {'action': 'Review payer policy changes affecting {count} claims', 'type': 'investigation'},
    'CONTRACT_RATE_GAP':     {'action': 'Flag {count} underpayments for contract negotiation', 'type': 'automation'},
    'MEDICAL_NECESSITY':     {'action': 'Peer-to-peer review for {count} medical necessity denials', 'type': 'investigation'},
    'PROVIDER_ENROLLMENT':   {'action': 'Check provider enrollment for {count} claims', 'type': 'prevention'},
}


def _fmt_dollars(amount) -> str:
    """Format a number as dollars with K/M suffix."""
    if amount is None:
        return '$0'
    if abs(amount) >= 1_000_000:
        return f'${amount / 1_000_000:.1f}M'
    if abs(amount) >= 1_000:
        return f'${amount / 1_000:.0f}K'
    return f'${amount:,.0f}'


# ── Entity Detection ────────────────────────────────────────────────────────

def _detect_entity(question: str, context: dict = None) -> dict:
    """
    Detect what entity the user is asking about from the question text
    and optional previous conversation context.
    """
    q = question.lower()

    # 1. Check for specific payer mentions
    for kw in _PAYER_KEYWORDS:
        if kw in q:
            return {'type': 'payer', 'value': kw}

    # 2. Check if context has a payer from previous turn
    if context and context.get('payer_name'):
        # User is asking a follow-up about a payer already discussed
        if any(w in q for w in ['why', 'root cause', 'reason', 'explain', 'what caused', 'drill']):
            return {'type': 'payer', 'value': context['payer_name']}

    # 3. Check for denial category questions
    for cat in _CATEGORY_KEYWORDS:
        if cat in q:
            return {'type': 'category', 'value': cat.upper().replace(' ', '_')}

    # 4. Check for variance / reconciliation questions
    if any(w in q for w in ['variance', 'reconcil', 'era-bank', 'float', 'gap']):
        payers = []
        if context and context.get('payers'):
            payers = context['payers']
        return {'type': 'variance', 'payers': payers}

    # 5. Check for AR aging questions
    if any(w in q for w in ['ar ', 'a/r', 'aging', 'days outstanding', 'overdue', 'old claims']):
        return {'type': 'ar_aging'}

    # 6. Check for revenue questions
    if any(w in q for w in ['revenue', 'collection', 'underpay', 'leakage', 'write-off', 'write off']):
        return {'type': 'revenue'}

    # 7. General fallback
    return {'type': 'general'}


# ── Search Dispatcher ───────────────────────────────────────────────────────

async def search_root_cause(db: AsyncSession, question: str, context: dict = None) -> dict:
    """
    Search for root causes based on a natural language question.
    Context can include previous conversation data (payer names, amounts, etc.)
    """
    q_lower = question.lower()
    entity = _detect_entity(q_lower, context)

    try:
        if entity['type'] == 'payer':
            return await _root_cause_by_payer(db, entity['value'], question)
        elif entity['type'] == 'category':
            return await _root_cause_by_category(db, entity['value'], question)
        elif entity['type'] == 'variance':
            return await _root_cause_for_variance(db, entity.get('payers', []), question)
        elif entity['type'] == 'revenue':
            return await _root_cause_for_revenue(db, question)
        elif entity['type'] == 'ar_aging':
            return await _root_cause_for_ar_aging(db, question)
        else:
            return await _root_cause_general(db, question)
    except Exception as e:
        logger.error(f"Root cause search failed: {e}", exc_info=True)
        return {
            'entity': entity,
            'root_causes': [],
            'context_data': {},
            'suggested_actions': [],
            'follow_up_questions': [],
            'formatted_answer': f'Root cause analysis encountered an error: {str(e)}',
        }


# ── Helper: build suggested actions from root causes ────────────────────────

def _build_actions(root_causes: list) -> list:
    """Generate suggested actions from the top root causes."""
    actions = []
    for rc in root_causes[:5]:
        cause = rc['cause']
        template = _ROOT_CAUSE_ACTIONS.get(cause)
        if template:
            actions.append({
                'action': template['action'].format(count=rc['count']),
                'type': template['type'],
                'impact': rc['impact'],
                'link': f'/analytics/denials/root-cause?cause={cause}',
            })
    # Only show generic links when no specific actions were found
    if not actions:
        actions.append({
            'action': 'Investigate denial root causes in detail',
            'type': 'investigation',
            'link': '/analytics/denials/root-cause',
        })
        actions.append({
            'action': 'Review prevention alerts and recommended workflows',
            'type': 'prevention',
            'link': '/analytics/prevention',
        })
    return actions


# ── Helper: format root causes into narrative ───────────────────────────────

def _format_narrative(entity: dict, root_causes: list, context_data: dict) -> str:
    """Build a human-readable narrative from root cause data."""
    if not root_causes:
        return f"No root cause data found for {entity.get('name', entity.get('type', 'this entity'))}."

    name = entity.get('name', entity.get('type', 'Unknown'))
    total_denials = context_data.get('total_denials', 0)
    total_impact = context_data.get('total_impact', 0)

    lines = [f"**{name}** has {total_denials:,} denied claims totaling {_fmt_dollars(total_impact)}."]
    lines.append("")

    # Top causes
    lines.append("**Root Causes (ranked by financial impact):**")
    for i, rc in enumerate(root_causes[:5], 1):
        pct = rc.get('pct', 0)
        lines.append(
            f"{i}. **{rc['cause']}** ({rc['group']}) — {rc['count']:,} claims, "
            f"{_fmt_dollars(rc['impact'])}, {pct:.1f}% of total, "
            f"confidence: {rc.get('confidence', 0)}%"
        )

    # Denial rate if available
    denial_rate = context_data.get('denial_rate')
    if denial_rate is not None:
        lines.append("")
        lines.append(f"Denial rate: **{denial_rate:.1f}%**")

    # ADTP info if available
    adtp = context_data.get('adtp_days')
    if adtp is not None:
        lines.append(f"Average Days to Pay (ADTP): **{adtp:.1f} days**")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════
# ROOT CAUSE BY PAYER
# ═══════════════════════════════════════════════════════════════════════════

async def _root_cause_by_payer(db: AsyncSession, payer_name: str, question: str) -> dict:
    """Root cause analysis for a specific payer."""

    # 1. Root causes grouped by primary_root_cause
    rc_query = text("""
        SELECT rca.primary_root_cause,
               rca.root_cause_group,
               count(*)::int                     AS cnt,
               sum(rca.financial_impact)::bigint  AS total_impact,
               avg(rca.confidence_score)::int     AS avg_conf
        FROM root_cause_analysis rca
        JOIN payer_master pm ON rca.payer_id = pm.payer_id
        WHERE pm.payer_name ILIKE :payer_pattern
        GROUP BY rca.primary_root_cause, rca.root_cause_group
        ORDER BY sum(rca.financial_impact) DESC
    """)
    rc_rows = (await db.execute(rc_query, {'payer_pattern': f'%{payer_name}%'})).all()

    # 2. Total denials for this payer
    totals_query = text("""
        SELECT count(d.denial_id)::int            AS total_denials,
               COALESCE(sum(d.denial_amount),0)::bigint AS total_amount
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE pm.payer_name ILIKE :payer_pattern
    """)
    totals_row = (await db.execute(totals_query, {'payer_pattern': f'%{payer_name}%'})).first()
    total_denials = totals_row[0] if totals_row else 0
    total_amount = totals_row[1] if totals_row else 0

    # 3. Payer profile (denial_rate, adtp, etc.)
    payer_query = text("""
        SELECT pm.payer_name, pm.payer_group, pm.denial_rate,
               pm.first_pass_rate, pm.avg_appeal_win_rate, pm.adtp_days,
               pm.avg_payment_rate
        FROM payer_master pm
        WHERE pm.payer_name ILIKE :payer_pattern
        LIMIT 1
    """)
    payer_row = (await db.execute(payer_query, {'payer_pattern': f'%{payer_name}%'})).first()

    # 4. Denial categories for this payer
    cat_query = text("""
        SELECT d.denial_category, count(*)::int AS cnt,
               sum(d.denial_amount)::bigint AS amount
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE pm.payer_name ILIKE :payer_pattern
        GROUP BY d.denial_category
        ORDER BY sum(d.denial_amount) DESC
    """)
    cat_rows = (await db.execute(cat_query, {'payer_pattern': f'%{payer_name}%'})).all()

    # 5. Top CARC codes for this payer
    carc_query = text("""
        SELECT d.carc_code, count(*)::int AS cnt,
               sum(d.denial_amount)::bigint AS amount
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE pm.payer_name ILIKE :payer_pattern
          AND d.carc_code IS NOT NULL
        GROUP BY d.carc_code
        ORDER BY count(*) DESC
        LIMIT 10
    """)
    carc_rows = (await db.execute(carc_query, {'payer_pattern': f'%{payer_name}%'})).all()

    # 6. ADTP trend (latest)
    adtp_query = text("""
        SELECT at.actual_adtp_days, at.deviation_days, at.is_anomaly,
               at.anomaly_type, at.total_amount::bigint
        FROM adtp_trend at
        JOIN payer_master pm ON at.payer_id = pm.payer_id
        WHERE pm.payer_name ILIKE :payer_pattern
        ORDER BY at.calculation_date DESC
        LIMIT 1
    """)
    adtp_row = (await db.execute(adtp_query, {'payer_pattern': f'%{payer_name}%'})).first()

    # 7. ERA vs Bank variance for this payer
    recon_query = text("""
        SELECT sum(br.era_bank_variance)::bigint AS total_variance,
               count(CASE WHEN br.reconciliation_status = 'VARIANCE' THEN 1 END)::int AS variance_weeks,
               avg(br.float_days)::int AS avg_float
        FROM bank_reconciliation br
        JOIN payer_master pm ON br.payer_id = pm.payer_id
        WHERE pm.payer_name ILIKE :payer_pattern
    """)
    recon_row = (await db.execute(recon_query, {'payer_pattern': f'%{payer_name}%'})).first()

    # ── Build response ──────────────────────────────────────────────────────
    total_rc_impact = sum(r[3] for r in rc_rows) if rc_rows else 1  # avoid div-by-zero

    root_causes = []
    for r in rc_rows:
        root_causes.append({
            'cause': r[0],
            'group': r[1],
            'count': r[2],
            'impact': r[3],
            'confidence': r[4],
            'pct': round((r[3] / total_rc_impact) * 100, 1) if total_rc_impact else 0,
        })

    display_name = payer_row[0] if payer_row else payer_name.title()

    context_data = {
        'total_denials': total_denials,
        'total_impact': total_amount,
        'denial_rate': payer_row[2] if payer_row else None,
        'first_pass_rate': payer_row[3] if payer_row else None,
        'appeal_win_rate': payer_row[4] if payer_row else None,
        'adtp_days': payer_row[5] if payer_row else None,
        'avg_payment_rate': payer_row[6] if payer_row else None,
        'payer_group': payer_row[1] if payer_row else None,
        'categories': [{'category': c[0], 'count': c[1], 'amount': c[2]} for c in cat_rows],
        'top_carc_codes': [{'code': c[0], 'count': c[1], 'amount': c[2]} for c in carc_rows],
        'adtp_latest': {
            'actual_days': adtp_row[0],
            'deviation': adtp_row[1],
            'is_anomaly': adtp_row[2],
            'anomaly_type': adtp_row[3],
            'total_amount': adtp_row[4],
        } if adtp_row else None,
        'reconciliation': {
            'total_variance': recon_row[0],
            'variance_weeks': recon_row[1],
            'avg_float_days': recon_row[2],
        } if recon_row else None,
    }

    entity = {'type': 'payer', 'name': display_name}

    return {
        'entity': entity,
        'root_causes': root_causes,
        'context_data': context_data,
        'suggested_actions': _build_actions(root_causes),
        'follow_up_questions': [
            f'Show me the specific claims for {root_causes[0]["cause"]}' if root_causes else 'Show me denial details',
            f'What is {display_name}\'s ADTP trend?',
            f'Compare {display_name} denial rate with industry benchmark',
            f'Run auto-appeal for {display_name} denials',
            f'What CARC codes drive {display_name} denials?',
        ],
        'formatted_answer': _format_narrative(entity, root_causes, context_data),
    }


# ═══════════════════════════════════════════════════════════════════════════
# ROOT CAUSE BY CATEGORY
# ═══════════════════════════════════════════════════════════════════════════

async def _root_cause_by_category(db: AsyncSession, category: str, question: str) -> dict:
    """Root cause analysis for a specific denial category."""

    # Normalize category for ILIKE matching
    cat_pattern = category.replace('_', ' ')

    rc_query = text("""
        SELECT rca.primary_root_cause,
               rca.root_cause_group,
               count(*)::int                     AS cnt,
               sum(rca.financial_impact)::bigint  AS total_impact,
               avg(rca.confidence_score)::int     AS avg_conf
        FROM root_cause_analysis rca
        JOIN denials d ON rca.denial_id = d.denial_id
        WHERE d.denial_category ILIKE :cat_pattern
        GROUP BY rca.primary_root_cause, rca.root_cause_group
        ORDER BY sum(rca.financial_impact) DESC
    """)
    rc_rows = (await db.execute(rc_query, {'cat_pattern': f'%{cat_pattern}%'})).all()

    totals_query = text("""
        SELECT count(*)::int, COALESCE(sum(d.denial_amount),0)::bigint
        FROM denials d
        WHERE d.denial_category ILIKE :cat_pattern
    """)
    totals_row = (await db.execute(totals_query, {'cat_pattern': f'%{cat_pattern}%'})).first()
    total_denials = totals_row[0] if totals_row else 0
    total_amount = totals_row[1] if totals_row else 0

    # Top payers for this category
    payer_query = text("""
        SELECT pm.payer_name, count(*)::int AS cnt,
               sum(d.denial_amount)::bigint AS amount
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE d.denial_category ILIKE :cat_pattern
        GROUP BY pm.payer_name
        ORDER BY sum(d.denial_amount) DESC
        LIMIT 5
    """)
    payer_rows = (await db.execute(payer_query, {'cat_pattern': f'%{cat_pattern}%'})).all()

    total_rc_impact = sum(r[3] for r in rc_rows) if rc_rows else 1
    root_causes = []
    for r in rc_rows:
        root_causes.append({
            'cause': r[0], 'group': r[1], 'count': r[2],
            'impact': r[3], 'confidence': r[4],
            'pct': round((r[3] / total_rc_impact) * 100, 1) if total_rc_impact else 0,
        })

    entity = {'type': 'category', 'name': category}
    context_data = {
        'total_denials': total_denials,
        'total_impact': total_amount,
        'top_payers': [{'payer': p[0], 'count': p[1], 'amount': p[2]} for p in payer_rows],
    }

    return {
        'entity': entity,
        'root_causes': root_causes,
        'context_data': context_data,
        'suggested_actions': _build_actions(root_causes),
        'follow_up_questions': [
            f'Which payers contribute most to {category} denials?',
            f'Show {category} denial trend over time',
            f'What prevention rules exist for {category}?',
        ],
        'formatted_answer': _format_narrative(entity, root_causes, context_data),
    }


# ═══════════════════════════════════════════════════════════════════════════
# ROOT CAUSE FOR RECONCILIATION VARIANCE
# ═══════════════════════════════════════════════════════════════════════════

async def _root_cause_for_variance(db: AsyncSession, payers: list, question: str) -> dict:
    """Root cause analysis for reconciliation variance — links ERA-bank gaps to denial patterns."""

    # Top payers by variance
    var_query = text("""
        SELECT br.payer_name,
               sum(ABS(br.era_bank_variance))::bigint       AS total_variance,
               sum(br.era_received_amount)::bigint           AS era_total,
               sum(br.bank_deposit_amount)::bigint           AS bank_total,
               avg(br.float_days)::int                       AS avg_float,
               count(CASE WHEN br.is_anomaly THEN 1 END)::int AS anomaly_count
        FROM bank_reconciliation br
        GROUP BY br.payer_name
        ORDER BY sum(ABS(br.era_bank_variance)) DESC
        LIMIT 10
    """)
    var_rows = (await db.execute(var_query)).all()

    # Overall reconciliation stats
    overall_query = text("""
        SELECT sum(ABS(br.era_bank_variance))::bigint        AS total_variance,
               sum(br.era_received_amount)::bigint            AS total_era,
               sum(br.bank_deposit_amount)::bigint            AS total_bank,
               count(CASE WHEN br.reconciliation_status = 'VARIANCE' THEN 1 END)::int AS variance_weeks,
               count(CASE WHEN br.is_anomaly THEN 1 END)::int AS anomalies
        FROM bank_reconciliation br
    """)
    overall = (await db.execute(overall_query)).first()

    # Denial root causes for top variance payers (link denials to variance)
    top_payer_names = [r[0] for r in var_rows[:5]] if var_rows else []
    rc_for_variance_payers = []
    if top_payer_names:
        rc_query = text("""
            SELECT rca.primary_root_cause,
                   rca.root_cause_group,
                   count(*)::int                     AS cnt,
                   sum(rca.financial_impact)::bigint  AS total_impact,
                   avg(rca.confidence_score)::int     AS avg_conf
            FROM root_cause_analysis rca
            JOIN payer_master pm ON rca.payer_id = pm.payer_id
            WHERE pm.payer_name = ANY(:payer_names)
            GROUP BY rca.primary_root_cause, rca.root_cause_group
            ORDER BY sum(rca.financial_impact) DESC
            LIMIT 10
        """)
        rc_rows = (await db.execute(rc_query, {'payer_names': top_payer_names})).all()
        total_rc_impact = sum(r[3] for r in rc_rows) if rc_rows else 1
        for r in rc_rows:
            rc_for_variance_payers.append({
                'cause': r[0], 'group': r[1], 'count': r[2],
                'impact': r[3], 'confidence': r[4],
                'pct': round((r[3] / total_rc_impact) * 100, 1) if total_rc_impact else 0,
            })

    # Variance reasons breakdown
    reason_query = text("""
        SELECT br.variance_reason, count(*)::int AS cnt,
               sum(ABS(br.era_bank_variance))::bigint AS amount
        FROM bank_reconciliation br
        WHERE br.variance_reason IS NOT NULL
        GROUP BY br.variance_reason
        ORDER BY sum(ABS(br.era_bank_variance)) DESC
    """)
    reason_rows = (await db.execute(reason_query)).all()

    entity = {'type': 'variance', 'name': 'Reconciliation Variance'}
    context_data = {
        'total_variance': overall[0] if overall else 0,
        'total_era': overall[1] if overall else 0,
        'total_bank': overall[2] if overall else 0,
        'variance_weeks': overall[3] if overall else 0,
        'anomaly_count': overall[4] if overall else 0,
        'payer_variances': [
            {'payer': r[0], 'variance': r[1], 'era': r[2], 'bank': r[3],
             'avg_float': r[4], 'anomalies': r[5]}
            for r in var_rows
        ],
        'variance_reasons': [{'reason': r[0], 'count': r[1], 'amount': r[2]} for r in reason_rows],
    }

    # Build narrative
    lines = [f"**Reconciliation Variance Analysis**"]
    lines.append(f"Total ERA-Bank variance: {_fmt_dollars(overall[0] if overall else 0)}")
    if var_rows:
        lines.append("")
        lines.append("**Top Payers by Variance:**")
        for i, r in enumerate(var_rows[:5], 1):
            lines.append(f"{i}. **{r[0]}** — Variance: {_fmt_dollars(r[1])}, Float: {r[4]} days, Anomalies: {r[5]}")
    if rc_for_variance_payers:
        lines.append("")
        lines.append("**Denial Root Causes Behind Variance Payers:**")
        for rc in rc_for_variance_payers[:3]:
            lines.append(f"- **{rc['cause']}** — {rc['count']:,} claims, {_fmt_dollars(rc['impact'])}")

    return {
        'entity': entity,
        'root_causes': rc_for_variance_payers,
        'context_data': context_data,
        'suggested_actions': [
            {'action': 'Investigate float delays for top variance payers', 'type': 'investigation', 'impact': overall[0] if overall else 0, 'link': '/analytics/revenue/reconciliation'},
            {'action': 'Review anomaly alerts for deposit mismatches', 'type': 'prevention', 'impact': 0, 'link': '/analytics/revenue/reconciliation'},
            *_build_actions(rc_for_variance_payers)[:3],
        ],
        'follow_up_questions': [
            'Which payers have the highest float days?',
            'Show me anomaly trends in bank reconciliation',
            'What is the ERA-bank gap for Medicare?',
            'Are variance patterns seasonal?',
        ],
        'formatted_answer': "\n".join(lines),
    }


# ═══════════════════════════════════════════════════════════════════════════
# ROOT CAUSE FOR REVENUE
# ═══════════════════════════════════════════════════════════════════════════

async def _root_cause_for_revenue(db: AsyncSession, question: str) -> dict:
    """Root cause analysis for revenue-related questions."""

    # Overall denial impact on revenue
    rc_query = text("""
        SELECT rca.primary_root_cause,
               rca.root_cause_group,
               count(*)::int                     AS cnt,
               sum(rca.financial_impact)::bigint  AS total_impact,
               avg(rca.confidence_score)::int     AS avg_conf
        FROM root_cause_analysis rca
        GROUP BY rca.primary_root_cause, rca.root_cause_group
        ORDER BY sum(rca.financial_impact) DESC
        LIMIT 10
    """)
    rc_rows = (await db.execute(rc_query)).all()

    # Revenue overview
    revenue_query = text("""
        SELECT
            (SELECT COALESCE(sum(total_charges),0)::bigint FROM claims) AS total_charges,
            (SELECT COALESCE(sum(payment_amount),0)::bigint FROM era_payments) AS total_collected,
            (SELECT COALESCE(sum(denial_amount),0)::bigint FROM denials) AS total_denials,
            (SELECT count(*) FROM denials) AS denial_count,
            (SELECT count(*) FROM claims WHERE status NOT IN ('PAID','WRITTEN_OFF','VOIDED')) AS open_claims
    """)
    rev = (await db.execute(revenue_query)).first()

    total_rc_impact = sum(r[3] for r in rc_rows) if rc_rows else 1
    root_causes = []
    for r in rc_rows:
        root_causes.append({
            'cause': r[0], 'group': r[1], 'count': r[2],
            'impact': r[3], 'confidence': r[4],
            'pct': round((r[3] / total_rc_impact) * 100, 1) if total_rc_impact else 0,
        })

    entity = {'type': 'revenue', 'name': 'Revenue Leakage'}
    context_data = {
        'total_charges': rev[0] if rev else 0,
        'total_collected': rev[1] if rev else 0,
        'total_denials': rev[3] if rev else 0,
        'total_denial_amount': rev[2] if rev else 0,
        'total_impact': rev[2] if rev else 0,
        'open_claims': rev[4] if rev else 0,
        'collection_rate': round((rev[1] / rev[0]) * 100, 1) if rev and rev[0] else 0,
    }

    lines = [f"**Revenue Leakage Root Cause Analysis**"]
    lines.append(f"Total charges: {_fmt_dollars(rev[0] if rev else 0)} | Collected: {_fmt_dollars(rev[1] if rev else 0)} | Denied: {_fmt_dollars(rev[2] if rev else 0)}")
    if rev and rev[0]:
        lines.append(f"Collection rate: **{context_data['collection_rate']}%**")
    lines.append("")
    lines.append("**Top Causes of Revenue Loss:**")
    for i, rc in enumerate(root_causes[:5], 1):
        lines.append(f"{i}. **{rc['cause']}** — {rc['count']:,} claims, {_fmt_dollars(rc['impact'])}, {rc['pct']:.1f}%")

    return {
        'entity': entity,
        'root_causes': root_causes,
        'context_data': context_data,
        'suggested_actions': _build_actions(root_causes),
        'follow_up_questions': [
            'Which payers have the lowest collection rate?',
            'Show underpayment patterns by CPT code',
            'What is the preventable denial percentage?',
            'Revenue trend over the last 6 months',
        ],
        'formatted_answer': "\n".join(lines),
    }


# ═══════════════════════════════════════════════════════════════════════════
# ROOT CAUSE FOR AR AGING
# ═══════════════════════════════════════════════════════════════════════════

async def _root_cause_for_ar_aging(db: AsyncSession, question: str) -> dict:
    """Root cause analysis for AR aging — why is AR growing."""

    # AR aging buckets
    aging_query = text("""
        SELECT
            count(CASE WHEN CURRENT_DATE - c.date_of_service BETWEEN 0 AND 30 THEN 1 END)::int AS bucket_0_30,
            count(CASE WHEN CURRENT_DATE - c.date_of_service BETWEEN 31 AND 60 THEN 1 END)::int AS bucket_31_60,
            count(CASE WHEN CURRENT_DATE - c.date_of_service BETWEEN 61 AND 90 THEN 1 END)::int AS bucket_61_90,
            count(CASE WHEN CURRENT_DATE - c.date_of_service BETWEEN 91 AND 120 THEN 1 END)::int AS bucket_91_120,
            count(CASE WHEN CURRENT_DATE - c.date_of_service > 120 THEN 1 END)::int AS bucket_120_plus,
            COALESCE(sum(CASE WHEN CURRENT_DATE - c.date_of_service > 90 THEN c.total_charges END),0)::bigint AS over90_amount,
            COALESCE(sum(c.total_charges),0)::bigint AS total_ar
        FROM claims c
        WHERE c.status NOT IN ('PAID', 'WRITTEN_OFF', 'VOIDED')
    """)
    aging = (await db.execute(aging_query)).first()

    # Root causes for claims > 90 days
    rc_query = text("""
        SELECT rca.primary_root_cause,
               rca.root_cause_group,
               count(*)::int                     AS cnt,
               sum(rca.financial_impact)::bigint  AS total_impact,
               avg(rca.confidence_score)::int     AS avg_conf
        FROM root_cause_analysis rca
        JOIN claims c ON rca.claim_id = c.claim_id
        WHERE c.status NOT IN ('PAID', 'WRITTEN_OFF', 'VOIDED')
          AND CURRENT_DATE - c.date_of_service > 90
        GROUP BY rca.primary_root_cause, rca.root_cause_group
        ORDER BY sum(rca.financial_impact) DESC
        LIMIT 10
    """)
    rc_rows = (await db.execute(rc_query)).all()

    # Top payers with old AR
    payer_query = text("""
        SELECT pm.payer_name, count(*)::int AS cnt,
               sum(c.total_charges)::bigint AS amount
        FROM claims c
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE c.status NOT IN ('PAID', 'WRITTEN_OFF', 'VOIDED')
          AND CURRENT_DATE - c.date_of_service > 90
        GROUP BY pm.payer_name
        ORDER BY sum(c.total_charges) DESC
        LIMIT 5
    """)
    payer_rows = (await db.execute(payer_query)).all()

    total_rc_impact = sum(r[3] for r in rc_rows) if rc_rows else 1
    root_causes = []
    for r in rc_rows:
        root_causes.append({
            'cause': r[0], 'group': r[1], 'count': r[2],
            'impact': r[3], 'confidence': r[4],
            'pct': round((r[3] / total_rc_impact) * 100, 1) if total_rc_impact else 0,
        })

    entity = {'type': 'ar_aging', 'name': 'AR Aging'}
    context_data = {
        'total_ar': aging[6] if aging else 0,
        'total_impact': aging[5] if aging else 0,
        'total_denials': sum(r[2] for r in rc_rows),
        'buckets': {
            '0-30': aging[0] if aging else 0,
            '31-60': aging[1] if aging else 0,
            '61-90': aging[2] if aging else 0,
            '91-120': aging[3] if aging else 0,
            '120+': aging[4] if aging else 0,
        },
        'over_90_amount': aging[5] if aging else 0,
        'top_payers_old_ar': [{'payer': p[0], 'count': p[1], 'amount': p[2]} for p in payer_rows],
    }

    lines = [f"**AR Aging Root Cause Analysis**"]
    lines.append(f"Total AR outstanding: {_fmt_dollars(aging[6] if aging else 0)}")
    lines.append(f"AR over 90 days: {_fmt_dollars(aging[5] if aging else 0)} ({(aging[3] or 0) + (aging[4] or 0):,} claims)")
    lines.append("")
    lines.append("**Aging Buckets:** 0-30: {}, 31-60: {}, 61-90: {}, 91-120: {}, 120+: {}".format(
        aging[0] if aging else 0, aging[1] if aging else 0, aging[2] if aging else 0,
        aging[3] if aging else 0, aging[4] if aging else 0))
    lines.append("")
    if root_causes:
        lines.append("**Root Causes for Claims >90 Days:**")
        for i, rc in enumerate(root_causes[:5], 1):
            lines.append(f"{i}. **{rc['cause']}** — {rc['count']:,} claims, {_fmt_dollars(rc['impact'])}")
    if payer_rows:
        lines.append("")
        lines.append("**Top Payers with Old AR:**")
        for p in payer_rows:
            lines.append(f"- **{p[0]}** — {p[1]:,} claims, {_fmt_dollars(p[2])}")

    return {
        'entity': entity,
        'root_causes': root_causes,
        'context_data': context_data,
        'suggested_actions': [
            {'action': f'Work {(aging[3] or 0) + (aging[4] or 0):,} claims over 90 days', 'type': 'automation', 'impact': aging[5] if aging else 0, 'link': '/analytics/revenue/ar-aging'},
            *_build_actions(root_causes)[:3],
        ],
        'follow_up_questions': [
            'Which payers have the longest average days in AR?',
            'Show AR aging trend over the past 6 months',
            'What percentage of AR over 120 days is recoverable?',
            'Compare AR aging by payer group',
        ],
        'formatted_answer': "\n".join(lines),
    }


# ═══════════════════════════════════════════════════════════════════════════
# GENERAL ROOT CAUSE (FALLBACK)
# ═══════════════════════════════════════════════════════════════════════════

async def _root_cause_general(db: AsyncSession, question: str) -> dict:
    """General root cause summary across all entities."""

    rc_query = text("""
        SELECT rca.primary_root_cause,
               rca.root_cause_group,
               count(*)::int                     AS cnt,
               sum(rca.financial_impact)::bigint  AS total_impact,
               avg(rca.confidence_score)::int     AS avg_conf
        FROM root_cause_analysis rca
        GROUP BY rca.primary_root_cause, rca.root_cause_group
        ORDER BY sum(rca.financial_impact) DESC
        LIMIT 10
    """)
    rc_rows = (await db.execute(rc_query)).all()

    # Group-level summary
    group_query = text("""
        SELECT rca.root_cause_group,
               count(*)::int AS cnt,
               sum(rca.financial_impact)::bigint AS total_impact
        FROM root_cause_analysis rca
        GROUP BY rca.root_cause_group
        ORDER BY sum(rca.financial_impact) DESC
    """)
    group_rows = (await db.execute(group_query)).all()

    totals_query = text("""
        SELECT count(*)::int, COALESCE(sum(financial_impact),0)::bigint
        FROM root_cause_analysis
    """)
    totals = (await db.execute(totals_query)).first()

    total_rc_impact = sum(r[3] for r in rc_rows) if rc_rows else 1
    root_causes = []
    for r in rc_rows:
        root_causes.append({
            'cause': r[0], 'group': r[1], 'count': r[2],
            'impact': r[3], 'confidence': r[4],
            'pct': round((r[3] / total_rc_impact) * 100, 1) if total_rc_impact else 0,
        })

    entity = {'type': 'general', 'name': 'Overall Root Cause Analysis'}
    context_data = {
        'total_denials': totals[0] if totals else 0,
        'total_impact': totals[1] if totals else 0,
        'groups': [{'group': g[0], 'count': g[1], 'impact': g[2]} for g in group_rows],
    }

    lines = [f"**Overall Root Cause Analysis**"]
    lines.append(f"Analyzed {totals[0] if totals else 0:,} denial root causes with total impact of {_fmt_dollars(totals[1] if totals else 0)}")
    lines.append("")
    if group_rows:
        lines.append("**By Root Cause Group:**")
        for g in group_rows:
            lines.append(f"- **{g[0]}**: {g[1]:,} claims, {_fmt_dollars(g[2])}")
    lines.append("")
    lines.append("**Top Root Causes:**")
    for i, rc in enumerate(root_causes[:5], 1):
        lines.append(f"{i}. **{rc['cause']}** ({rc['group']}) — {rc['count']:,} claims, {_fmt_dollars(rc['impact'])}, {rc['pct']:.1f}%")

    return {
        'entity': entity,
        'root_causes': root_causes,
        'context_data': context_data,
        'suggested_actions': _build_actions(root_causes),
        'follow_up_questions': [
            'Which payer has the highest denial rate?',
            'Show root cause trends over the past quarter',
            'What percentage of denials are preventable?',
            'Break down root causes by payer group',
        ],
        'formatted_answer': "\n".join(lines),
    }
