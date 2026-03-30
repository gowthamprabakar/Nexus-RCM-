"""
Pre-computed Report Templates
==============================
Generates structured reports from real DB data without LLM calls.
Used when user asks for standard reports that don't need AI narrative.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional

logger = logging.getLogger(__name__)


# ── Report type keywords for auto-detection ──────────────────────────────────
REPORT_KEYWORDS = {
    'denial_summary': [
        'denial summary', 'denial report', 'denials report', 'denial overview',
        'show denials', 'summarize denials', 'denial breakdown', 'denial analysis',
        'denial statistics', 'give me denials',
    ],
    'payer_performance': [
        'payer performance', 'payer report', 'payer analysis', 'payer metrics',
        'payer summary', 'payer breakdown', 'payer comparison', 'payer stats',
        'how are payers performing', 'payer scorecard',
    ],
    'root_cause': [
        'root cause report', 'root cause analysis report', 'rca report', 'root cause summary',
        'root cause breakdown', 'what are root causes', 'root cause overview', 'denial root cause',
    ],
    'reconciliation': [
        'reconciliation report', 'recon report', 'bank reconciliation', 'era reconciliation',
        'reconciliation summary', 'era bank report', 'variance report',
    ],
    'ar_aging': [
        'ar aging', 'aging report', 'accounts receivable report', 'ar report', 'aging summary',
        'aging breakdown', 'ar summary', 'aging analysis', 'how old is ar',
        'outstanding claims report', 'days outstanding',
    ],
    'payment_analysis': [
        'payment analysis', 'payment report', 'payment summary', 'era payment report',
        'payment breakdown', 'payment overview', 'era summary', 'how much was paid',
        'payment dashboard',
    ],
    'prevention': [
        'prevention report', 'preventable report', 'prevention summary', 'claim readiness report',
        'prevention analysis', 'preventable denials', 'what can we prevent', 'alert summary',
    ],
}


def detect_report_type(question: str) -> Optional[str]:
    """Detect if a question is requesting a standard report. Returns report_type or None."""
    q_lower = question.lower().strip()
    for report_type, keywords in REPORT_KEYWORDS.items():
        if any(kw in q_lower for kw in keywords):
            return report_type
    return None


async def generate_report(db: AsyncSession, report_type: str, payer_id: Optional[str] = None) -> dict:
    """Generate a pre-computed report from real DB data."""

    generators = {
        'denial_summary': _denial_summary_report,
        'payer_performance': _payer_performance_report,
        'root_cause': _root_cause_report,
        'reconciliation': _reconciliation_report,
        'ar_aging': _ar_aging_report,
        'payment_analysis': _payment_analysis_report,
        'prevention': _prevention_report,
    }

    generator = generators.get(report_type)
    if not generator:
        return {"error": f"Unknown report type: {report_type}", "available": list(generators.keys())}

    try:
        return await generator(db, payer_id)
    except Exception as e:
        logger.error(f"Report generation failed for {report_type}: {e}")
        return {"error": str(e), "report_type": report_type}


def _format_report_as_text(report: dict) -> str:
    """Convert a structured report dict into readable text for chat responses."""
    lines = []
    title = report.get("title", "Report")
    lines.append(f"## {title}")
    lines.append("")

    for key, value in report.items():
        if key in ("title", "report_type", "generated_at"):
            continue
        if isinstance(value, dict):
            label = key.replace("_", " ").title()
            lines.append(f"### {label}")
            for k, v in value.items():
                lines.append(f"  - {k.replace('_', ' ').title()}: {v}")
            lines.append("")
        elif isinstance(value, list):
            label = key.replace("_", " ").title()
            lines.append(f"### {label}")
            for item in value:
                if isinstance(item, dict):
                    parts = [f"{k}: {v}" for k, v in item.items()]
                    lines.append(f"  - {' | '.join(parts)}")
                else:
                    lines.append(f"  - {item}")
            lines.append("")
        else:
            lines.append(f"**{key.replace('_', ' ').title()}**: {value}")

    return "\n".join(lines)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DENIAL SUMMARY REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def _denial_summary_report(db: AsyncSession, payer_id: Optional[str] = None) -> dict:
    """Comprehensive denial summary with categories, root causes, trends."""
    payer_filter = "AND c.payer_id = :payer_id" if payer_id else ""
    params = {"payer_id": payer_id} if payer_id else {}

    # Total denials and revenue at risk
    totals = await db.execute(text(f"""
        SELECT COUNT(*) AS total_denials,
               COALESCE(SUM(d.denial_amount), 0) AS revenue_at_risk
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        WHERE 1=1 {payer_filter}
    """), params)
    totals_row = totals.first()

    # By category
    by_category = await db.execute(text(f"""
        SELECT d.denial_category,
               COUNT(*) AS count,
               COALESCE(SUM(d.denial_amount), 0) AS amount
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        WHERE 1=1 {payer_filter}
        GROUP BY d.denial_category
        ORDER BY amount DESC
    """), params)

    # By root cause
    by_root_cause = await db.execute(text(f"""
        SELECT rca.primary_root_cause,
               COUNT(*) AS count,
               COALESCE(SUM(rca.financial_impact), 0) AS amount,
               ROUND(AVG(rca.confidence_score)::numeric, 1) AS avg_confidence
        FROM root_cause_analysis rca
        JOIN claims c ON rca.claim_id = c.claim_id
        WHERE 1=1 {payer_filter}
        GROUP BY rca.primary_root_cause
        ORDER BY amount DESC
    """), params)

    # Top 10 payers by denial amount
    top_payers = await db.execute(text(f"""
        SELECT pm.payer_name, pm.payer_id,
               COUNT(d.denial_id) AS denial_count,
               COALESCE(SUM(d.denial_amount), 0) AS total_amount
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE 1=1 {payer_filter}
        GROUP BY pm.payer_name, pm.payer_id
        ORDER BY total_amount DESC
        LIMIT 10
    """), params)

    # Appeal win rates by category
    appeal_rates = await db.execute(text(f"""
        SELECT d.denial_category,
               COUNT(a.appeal_id) AS total_appeals,
               SUM(CASE WHEN a.outcome = 'APPROVED' THEN 1 ELSE 0 END) AS won,
               ROUND(
                   100.0 * SUM(CASE WHEN a.outcome = 'APPROVED' THEN 1 ELSE 0 END)
                   / NULLIF(COUNT(a.appeal_id), 0), 1
               ) AS win_rate_pct,
               COALESCE(SUM(a.recovered_amount), 0) AS recovered
        FROM denials d
        JOIN appeals a ON d.denial_id = a.denial_id
        JOIN claims c ON d.claim_id = c.claim_id
        WHERE 1=1 {payer_filter}
        GROUP BY d.denial_category
        ORDER BY total_appeals DESC
    """), params)

    # Monthly trend (last 6 months)
    monthly_trend = await db.execute(text(f"""
        SELECT TO_CHAR(d.denial_date, 'YYYY-MM') AS month,
               COUNT(*) AS count,
               COALESCE(SUM(d.denial_amount), 0) AS amount
        FROM denials d
        JOIN claims c ON d.claim_id = c.claim_id
        WHERE d.denial_date >= CURRENT_DATE - INTERVAL '6 months'
              {payer_filter}
        GROUP BY TO_CHAR(d.denial_date, 'YYYY-MM')
        ORDER BY month
    """), params)

    # Preventable percentage
    preventable = await db.execute(text(f"""
        SELECT rca.root_cause_group,
               COUNT(*) AS count,
               COALESCE(SUM(rca.financial_impact), 0) AS amount
        FROM root_cause_analysis rca
        JOIN claims c ON rca.claim_id = c.claim_id
        WHERE 1=1 {payer_filter}
        GROUP BY rca.root_cause_group
    """), params)
    preventable_rows = preventable.all()
    total_rca = sum(r[1] for r in preventable_rows) or 1
    preventable_count = sum(r[1] for r in preventable_rows if r[0] == 'PREVENTABLE')
    preventable_amount = sum(float(r[2]) for r in preventable_rows if r[0] == 'PREVENTABLE')

    return {
        "report_type": "denial_summary",
        "title": "Denial Summary Report",
        "overview": {
            "total_denials": totals_row[0] if totals_row else 0,
            "revenue_at_risk": f"${totals_row[1]:,.2f}" if totals_row else "$0.00",
            "preventable_pct": f"{100.0 * preventable_count / total_rca:.1f}%",
            "preventable_amount": f"${preventable_amount:,.2f}",
        },
        "by_category": [
            {"category": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
            for r in by_category.all()
        ],
        "by_root_cause": [
            {"root_cause": r[0], "count": r[1], "amount": f"${r[2]:,.2f}", "avg_confidence": float(r[3]) if r[3] else 0}
            for r in by_root_cause.all()
        ],
        "top_payers": [
            {"payer": r[0], "payer_id": r[1], "denial_count": r[2], "amount": f"${r[3]:,.2f}"}
            for r in top_payers.all()
        ],
        "appeal_win_rates": [
            {"category": r[0], "total_appeals": r[1], "won": r[2],
             "win_rate": f"{r[3]}%" if r[3] else "N/A", "recovered": f"${r[4]:,.2f}"}
            for r in appeal_rates.all()
        ],
        "monthly_trend": [
            {"month": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
            for r in monthly_trend.all()
        ],
        "preventable_breakdown": [
            {"group": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
            for r in preventable_rows
        ],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAYER PERFORMANCE REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def _payer_performance_report(db: AsyncSession, payer_id: Optional[str] = None) -> dict:
    """Detailed payer performance — single payer or all payers."""

    if payer_id:
        # Single-payer detailed report
        payer_info = await db.execute(text("""
            SELECT payer_id, payer_name, payer_group, adtp_days, denial_rate,
                   first_pass_rate, avg_payment_rate, avg_appeal_win_rate
            FROM payer_master WHERE payer_id = :pid
        """), {"pid": payer_id})
        payer_row = payer_info.first()
        if not payer_row:
            return {"error": f"Payer not found: {payer_id}"}

        # Denial categories for this payer
        categories = await db.execute(text("""
            SELECT d.denial_category, COUNT(*) AS count,
                   COALESCE(SUM(d.denial_amount), 0) AS amount
            FROM denials d
            JOIN claims c ON d.claim_id = c.claim_id
            WHERE c.payer_id = :pid
            GROUP BY d.denial_category
            ORDER BY amount DESC
        """), {"pid": payer_id})

        # Root cause distribution
        root_causes = await db.execute(text("""
            SELECT rca.primary_root_cause, COUNT(*) AS count,
                   COALESCE(SUM(rca.financial_impact), 0) AS amount
            FROM root_cause_analysis rca
            WHERE rca.payer_id = :pid
            GROUP BY rca.primary_root_cause
            ORDER BY amount DESC
        """), {"pid": payer_id})

        # Monthly denial trend
        monthly = await db.execute(text("""
            SELECT TO_CHAR(d.denial_date, 'YYYY-MM') AS month,
                   COUNT(*) AS count,
                   COALESCE(SUM(d.denial_amount), 0) AS amount
            FROM denials d
            JOIN claims c ON d.claim_id = c.claim_id
            WHERE c.payer_id = :pid
                  AND d.denial_date >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY TO_CHAR(d.denial_date, 'YYYY-MM')
            ORDER BY month
        """), {"pid": payer_id})

        # ERA-Bank variance
        recon = await db.execute(text("""
            SELECT COALESCE(SUM(era_received_amount), 0) AS era_total,
                   COALESCE(SUM(bank_deposit_amount), 0) AS bank_total,
                   COALESCE(SUM(era_bank_variance), 0) AS total_variance,
                   ROUND(AVG(float_days)::numeric, 1) AS avg_float_days
            FROM bank_reconciliation
            WHERE payer_id = :pid
        """), {"pid": payer_id})
        recon_row = recon.first()

        # Contract compliance
        contract = await db.execute(text("""
            SELECT ROUND(AVG(pcr.expected_rate)::numeric, 2) AS avg_expected,
                   ROUND(AVG(e.allowed_amount)::numeric, 2) AS avg_actual
            FROM payer_contract_rate pcr
            JOIN era_payments e ON e.payer_id = pcr.payer_id
            WHERE pcr.payer_id = :pid
            LIMIT 1
        """), {"pid": payer_id})
        contract_row = contract.first()

        return {
            "report_type": "payer_performance",
            "title": f"Payer Performance: {payer_row[1]}",
            "payer_info": {
                "payer_id": payer_row[0], "payer_name": payer_row[1],
                "payer_group": payer_row[2], "adtp_days": payer_row[3],
                "denial_rate": f"{payer_row[4] * 100:.1f}%" if payer_row[4] else "N/A",
                "first_pass_rate": f"{payer_row[5] * 100:.1f}%" if payer_row[5] else "N/A",
                "avg_payment_rate": f"{payer_row[6] * 100:.1f}%" if payer_row[6] else "N/A",
                "appeal_win_rate": f"{payer_row[7] * 100:.1f}%" if payer_row[7] else "N/A",
            },
            "denial_categories": [
                {"category": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
                for r in categories.all()
            ],
            "root_cause_distribution": [
                {"root_cause": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
                for r in root_causes.all()
            ],
            "monthly_trend": [
                {"month": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
                for r in monthly.all()
            ],
            "reconciliation": {
                "era_total": f"${recon_row[0]:,.2f}" if recon_row else "$0.00",
                "bank_total": f"${recon_row[1]:,.2f}" if recon_row else "$0.00",
                "variance": f"${recon_row[2]:,.2f}" if recon_row else "$0.00",
                "avg_float_days": float(recon_row[3]) if recon_row and recon_row[3] else 0,
            },
            "contract_compliance": {
                "avg_expected_rate": f"${contract_row[0]}" if contract_row and contract_row[0] else "N/A",
                "avg_actual_rate": f"${contract_row[1]}" if contract_row and contract_row[1] else "N/A",
            },
        }
    else:
        # All-payers summary
        all_payers = await db.execute(text("""
            SELECT pm.payer_id, pm.payer_name, pm.payer_group,
                   pm.denial_rate, pm.adtp_days, pm.first_pass_rate,
                   pm.avg_payment_rate, pm.avg_appeal_win_rate,
                   COUNT(d.denial_id) AS actual_denials,
                   COALESCE(SUM(d.denial_amount), 0) AS denial_amount
            FROM payer_master pm
            LEFT JOIN claims c ON pm.payer_id = c.payer_id
            LEFT JOIN denials d ON c.claim_id = d.claim_id
            GROUP BY pm.payer_id, pm.payer_name, pm.payer_group,
                     pm.denial_rate, pm.adtp_days, pm.first_pass_rate,
                     pm.avg_payment_rate, pm.avg_appeal_win_rate
            ORDER BY denial_amount DESC
        """))

        return {
            "report_type": "payer_performance",
            "title": "Payer Performance Summary (All Payers)",
            "payers": [
                {
                    "payer_id": r[0], "payer_name": r[1], "payer_group": r[2],
                    "denial_rate": f"{r[3] * 100:.1f}%" if r[3] else "N/A",
                    "adtp_days": r[4],
                    "first_pass_rate": f"{r[5] * 100:.1f}%" if r[5] else "N/A",
                    "avg_payment_rate": f"{r[6] * 100:.1f}%" if r[6] else "N/A",
                    "appeal_win_rate": f"{r[7] * 100:.1f}%" if r[7] else "N/A",
                    "actual_denials": r[8], "denial_amount": f"${r[9]:,.2f}",
                }
                for r in all_payers.all()
            ],
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ROOT CAUSE REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def _root_cause_report(db: AsyncSession, payer_id: Optional[str] = None) -> dict:
    """Root cause analysis report with categories, payer matrix, impact."""
    payer_filter = "AND rca.payer_id = :payer_id" if payer_id else ""
    params = {"payer_id": payer_id} if payer_id else {}

    # All root causes with counts and amounts
    all_causes = await db.execute(text(f"""
        SELECT rca.primary_root_cause, COUNT(*) AS count,
               COALESCE(SUM(rca.financial_impact), 0) AS amount,
               ROUND(AVG(rca.confidence_score)::numeric, 1) AS avg_confidence
        FROM root_cause_analysis rca
        WHERE 1=1 {payer_filter}
        GROUP BY rca.primary_root_cause
        ORDER BY amount DESC
    """), params)

    # Root cause by payer matrix (top 5 payers x top causes)
    cause_by_payer = await db.execute(text(f"""
        SELECT pm.payer_name, rca.primary_root_cause, COUNT(*) AS count,
               COALESCE(SUM(rca.financial_impact), 0) AS amount
        FROM root_cause_analysis rca
        JOIN payer_master pm ON rca.payer_id = pm.payer_id
        WHERE 1=1 {payer_filter}
        GROUP BY pm.payer_name, rca.primary_root_cause
        ORDER BY amount DESC
        LIMIT 30
    """), params)

    # Preventable vs non-preventable
    by_group = await db.execute(text(f"""
        SELECT rca.root_cause_group, COUNT(*) AS count,
               COALESCE(SUM(rca.financial_impact), 0) AS amount
        FROM root_cause_analysis rca
        WHERE 1=1 {payer_filter}
        GROUP BY rca.root_cause_group
        ORDER BY amount DESC
    """), params)

    # Top claims by financial impact per root cause
    top_claims = await db.execute(text(f"""
        SELECT rca.primary_root_cause, rca.claim_id,
               rca.financial_impact, rca.confidence_score
        FROM root_cause_analysis rca
        WHERE rca.financial_impact IS NOT NULL {payer_filter}
        ORDER BY rca.financial_impact DESC
        LIMIT 15
    """), params)

    # Confidence score distribution
    confidence_dist = await db.execute(text(f"""
        SELECT
            CASE
                WHEN confidence_score >= 90 THEN 'High (90-100)'
                WHEN confidence_score >= 70 THEN 'Medium (70-89)'
                WHEN confidence_score >= 50 THEN 'Low (50-69)'
                ELSE 'Very Low (<50)'
            END AS confidence_band,
            COUNT(*) AS count
        FROM root_cause_analysis rca
        WHERE 1=1 {payer_filter}
        GROUP BY confidence_band
        ORDER BY MIN(confidence_score) DESC
    """), params)

    return {
        "report_type": "root_cause",
        "title": "Root Cause Analysis Report",
        "by_root_cause": [
            {"root_cause": r[0], "count": r[1], "amount": f"${r[2]:,.2f}",
             "avg_confidence": float(r[3]) if r[3] else 0}
            for r in all_causes.all()
        ],
        "cause_by_payer": [
            {"payer": r[0], "root_cause": r[1], "count": r[2], "amount": f"${r[3]:,.2f}"}
            for r in cause_by_payer.all()
        ],
        "preventable_split": [
            {"group": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
            for r in by_group.all()
        ],
        "top_claims_by_impact": [
            {"root_cause": r[0], "claim_id": r[1],
             "financial_impact": f"${r[2]:,.2f}" if r[2] else "$0.00",
             "confidence": r[3]}
            for r in top_claims.all()
        ],
        "confidence_distribution": [
            {"band": r[0], "count": r[1]}
            for r in confidence_dist.all()
        ],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RECONCILIATION REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def _reconciliation_report(db: AsyncSession, payer_id: Optional[str] = None) -> dict:
    """ERA vs Bank reconciliation report."""
    payer_filter = "AND br.payer_id = :payer_id" if payer_id else ""
    params = {"payer_id": payer_id} if payer_id else {}

    # ERA total vs Bank total
    totals = await db.execute(text(f"""
        SELECT COALESCE(SUM(era_received_amount), 0) AS era_total,
               COALESCE(SUM(bank_deposit_amount), 0) AS bank_total,
               COALESCE(SUM(era_bank_variance), 0) AS total_variance
        FROM bank_reconciliation br
        WHERE 1=1 {payer_filter}
    """), params)
    totals_row = totals.first()

    # Variance by payer (top 10)
    by_payer = await db.execute(text(f"""
        SELECT br.payer_name, br.payer_id,
               COALESCE(SUM(br.era_received_amount), 0) AS era_total,
               COALESCE(SUM(br.bank_deposit_amount), 0) AS bank_total,
               COALESCE(SUM(br.era_bank_variance), 0) AS variance,
               ROUND(AVG(br.float_days)::numeric, 1) AS avg_float
        FROM bank_reconciliation br
        WHERE 1=1 {payer_filter}
        GROUP BY br.payer_name, br.payer_id
        ORDER BY ABS(SUM(br.era_bank_variance)) DESC
        LIMIT 10
    """), params)

    # Float days by payer
    float_days = await db.execute(text(f"""
        SELECT br.payer_name,
               ROUND(AVG(br.float_days)::numeric, 1) AS avg_float,
               MAX(br.float_days) AS max_float,
               MIN(br.float_days) AS min_float
        FROM bank_reconciliation br
        WHERE br.float_days IS NOT NULL {payer_filter}
        GROUP BY br.payer_name
        ORDER BY avg_float DESC
        LIMIT 10
    """), params)

    # Reconciliation status distribution
    status_dist = await db.execute(text(f"""
        SELECT br.reconciliation_status, COUNT(*) AS count,
               COALESCE(SUM(br.era_received_amount), 0) AS era_amount
        FROM bank_reconciliation br
        WHERE 1=1 {payer_filter}
        GROUP BY br.reconciliation_status
        ORDER BY count DESC
    """), params)

    # Underpayment summary (bank < ERA)
    underpayments = await db.execute(text(f"""
        SELECT br.payer_name,
               COUNT(*) AS count,
               COALESCE(SUM(ABS(br.era_bank_variance)), 0) AS underpaid_amount
        FROM bank_reconciliation br
        WHERE br.era_bank_variance > 0 {payer_filter}
        GROUP BY br.payer_name
        ORDER BY underpaid_amount DESC
        LIMIT 10
    """), params)

    return {
        "report_type": "reconciliation",
        "title": "Bank Reconciliation Report",
        "totals": {
            "era_total": f"${totals_row[0]:,.2f}" if totals_row else "$0.00",
            "bank_total": f"${totals_row[1]:,.2f}" if totals_row else "$0.00",
            "total_variance": f"${totals_row[2]:,.2f}" if totals_row else "$0.00",
        },
        "variance_by_payer": [
            {"payer": r[0], "payer_id": r[1], "era_total": f"${r[2]:,.2f}",
             "bank_total": f"${r[3]:,.2f}", "variance": f"${r[4]:,.2f}",
             "avg_float_days": float(r[5]) if r[5] else 0}
            for r in by_payer.all()
        ],
        "float_days_by_payer": [
            {"payer": r[0], "avg_float": float(r[1]) if r[1] else 0,
             "max_float": r[2], "min_float": r[3]}
            for r in float_days.all()
        ],
        "status_distribution": [
            {"status": r[0], "count": r[1], "era_amount": f"${r[2]:,.2f}"}
            for r in status_dist.all()
        ],
        "underpayments": [
            {"payer": r[0], "count": r[1], "underpaid_amount": f"${r[2]:,.2f}"}
            for r in underpayments.all()
        ],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AR AGING REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def _ar_aging_report(db: AsyncSession, payer_id: Optional[str] = None) -> dict:
    """Accounts receivable aging report."""
    payer_filter = "AND c.payer_id = :payer_id" if payer_id else ""
    params = {"payer_id": payer_id} if payer_id else {}

    # Claims by status with amounts
    by_status = await db.execute(text(f"""
        SELECT c.status, COUNT(*) AS count,
               COALESCE(SUM(c.total_charges), 0) AS amount
        FROM claims c
        WHERE 1=1 {payer_filter}
        GROUP BY c.status
        ORDER BY amount DESC
    """), params)

    # Days outstanding distribution (only open claims)
    aging_buckets = await db.execute(text(f"""
        SELECT
            CASE
                WHEN CURRENT_DATE - c.date_of_service <= 30 THEN '0-30 days'
                WHEN CURRENT_DATE - c.date_of_service <= 60 THEN '31-60 days'
                WHEN CURRENT_DATE - c.date_of_service <= 90 THEN '61-90 days'
                WHEN CURRENT_DATE - c.date_of_service <= 120 THEN '91-120 days'
                ELSE '120+ days'
            END AS bucket,
            COUNT(*) AS count,
            COALESCE(SUM(c.total_charges), 0) AS amount
        FROM claims c
        WHERE c.status NOT IN ('PAID', 'WRITTEN_OFF', 'VOIDED')
              {payer_filter}
        GROUP BY bucket
        ORDER BY MIN(CURRENT_DATE - c.date_of_service)
    """), params)

    # Root cause of aging (why claims are stuck)
    aging_causes = await db.execute(text(f"""
        SELECT rca.primary_root_cause, COUNT(*) AS count,
               COALESCE(SUM(c.total_charges), 0) AS amount
        FROM claims c
        JOIN root_cause_analysis rca ON c.claim_id = rca.claim_id
        WHERE c.status NOT IN ('PAID', 'WRITTEN_OFF', 'VOIDED')
              {payer_filter}
        GROUP BY rca.primary_root_cause
        ORDER BY amount DESC
    """), params)

    # Top slow payers
    slow_payers = await db.execute(text(f"""
        SELECT pm.payer_name, pm.payer_id,
               COUNT(*) AS open_claims,
               COALESCE(SUM(c.total_charges), 0) AS amount,
               ROUND(AVG(CURRENT_DATE - c.date_of_service)::numeric, 0) AS avg_days
        FROM claims c
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE c.status NOT IN ('PAID', 'WRITTEN_OFF', 'VOIDED')
              {payer_filter}
        GROUP BY pm.payer_name, pm.payer_id
        ORDER BY avg_days DESC
        LIMIT 10
    """), params)

    # No-ERA-received alert count
    no_era = await db.execute(text(f"""
        SELECT COUNT(*) AS count
        FROM claims c
        WHERE c.status = 'SUBMITTED'
              AND c.submission_date < CURRENT_DATE - INTERVAL '30 days'
              AND NOT EXISTS (
                  SELECT 1 FROM era_payments e WHERE e.claim_id = c.claim_id
              )
              {payer_filter}
    """), params)
    no_era_count = no_era.scalar() or 0

    return {
        "report_type": "ar_aging",
        "title": "AR Aging Report",
        "by_status": [
            {"status": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
            for r in by_status.all()
        ],
        "aging_buckets": [
            {"bucket": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
            for r in aging_buckets.all()
        ],
        "aging_root_causes": [
            {"root_cause": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
            for r in aging_causes.all()
        ],
        "slow_payers": [
            {"payer": r[0], "payer_id": r[1], "open_claims": r[2],
             "amount": f"${r[3]:,.2f}", "avg_days_outstanding": int(r[4]) if r[4] else 0}
            for r in slow_payers.all()
        ],
        "no_era_alert_count": no_era_count,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAYMENT ANALYSIS REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def _payment_analysis_report(db: AsyncSession, payer_id: Optional[str] = None) -> dict:
    """Payment analysis with ERA, bank, adjustments, ADTP anomalies."""
    payer_filter_era = "AND e.payer_id = :payer_id" if payer_id else ""
    payer_filter_br = "AND br.payer_id = :payer_id" if payer_id else ""
    payer_filter_adtp = "AND at.payer_id = :payer_id" if payer_id else ""
    params = {"payer_id": payer_id} if payer_id else {}

    # Total ERA payments and bank deposits
    totals = await db.execute(text(f"""
        SELECT COALESCE(SUM(e.payment_amount), 0) AS era_total,
               COUNT(*) AS era_count
        FROM era_payments e
        WHERE 1=1 {payer_filter_era}
    """), params)
    totals_row = totals.first()

    bank_totals = await db.execute(text(f"""
        SELECT COALESCE(SUM(br.bank_deposit_amount), 0) AS bank_total
        FROM bank_reconciliation br
        WHERE 1=1 {payer_filter_br}
    """), params)
    bank_row = bank_totals.first()

    # Payment by payer
    by_payer = await db.execute(text(f"""
        SELECT pm.payer_name, pm.payer_id,
               COUNT(*) AS payment_count,
               COALESCE(SUM(e.payment_amount), 0) AS total_paid,
               COALESCE(SUM(e.allowed_amount), 0) AS total_allowed
        FROM era_payments e
        JOIN payer_master pm ON e.payer_id = pm.payer_id
        WHERE 1=1 {payer_filter_era}
        GROUP BY pm.payer_name, pm.payer_id
        ORDER BY total_paid DESC
        LIMIT 15
    """), params)

    # Underpayment count and amount (allowed > paid)
    underpayments = await db.execute(text(f"""
        SELECT COUNT(*) AS count,
               COALESCE(SUM(e.allowed_amount - e.payment_amount), 0) AS underpaid_amount
        FROM era_payments e
        WHERE e.payment_amount < e.allowed_amount
              AND e.allowed_amount > 0
              {payer_filter_era}
    """), params)
    underpay_row = underpayments.first()

    # ADTP anomalies by payer
    adtp_anomalies = await db.execute(text(f"""
        SELECT pm.payer_name, at.payer_id,
               at.actual_adtp_days, at.expected_adtp_days,
               at.deviation_pct, at.anomaly_type, at.z_score
        FROM adtp_trend at
        JOIN payer_master pm ON at.payer_id = pm.payer_id
        WHERE at.is_anomaly = true {payer_filter_adtp}
        ORDER BY ABS(at.deviation_pct) DESC
        LIMIT 10
    """), params)

    # CO/PR/OA adjustment breakdown
    adjustments = await db.execute(text(f"""
        SELECT
            COALESCE(SUM(e.co_amount), 0) AS co_total,
            COALESCE(SUM(e.pr_amount), 0) AS pr_total,
            COALESCE(SUM(e.oa_amount), 0) AS oa_total,
            COALESCE(SUM(e.pi_amount), 0) AS pi_total
        FROM era_payments e
        WHERE 1=1 {payer_filter_era}
    """), params)
    adj_row = adjustments.first()

    return {
        "report_type": "payment_analysis",
        "title": "Payment Analysis Report",
        "totals": {
            "era_payments_total": f"${totals_row[0]:,.2f}" if totals_row else "$0.00",
            "era_payment_count": totals_row[1] if totals_row else 0,
            "bank_deposits_total": f"${bank_row[0]:,.2f}" if bank_row else "$0.00",
        },
        "by_payer": [
            {"payer": r[0], "payer_id": r[1], "payment_count": r[2],
             "total_paid": f"${r[3]:,.2f}", "total_allowed": f"${r[4]:,.2f}"}
            for r in by_payer.all()
        ],
        "underpayments": {
            "count": underpay_row[0] if underpay_row else 0,
            "underpaid_amount": f"${underpay_row[1]:,.2f}" if underpay_row else "$0.00",
        },
        "adtp_anomalies": [
            {"payer": r[0], "payer_id": r[1],
             "actual_adtp": float(r[2]) if r[2] else 0,
             "expected_adtp": r[3],
             "deviation_pct": f"{r[4]:.1f}%" if r[4] else "0%",
             "anomaly_type": r[5], "z_score": float(r[6]) if r[6] else 0}
            for r in adtp_anomalies.all()
        ],
        "adjustment_breakdown": {
            "co_contractual_obligation": f"${adj_row[0]:,.2f}" if adj_row else "$0.00",
            "pr_patient_responsibility": f"${adj_row[1]:,.2f}" if adj_row else "$0.00",
            "oa_other_adjustments": f"${adj_row[2]:,.2f}" if adj_row else "$0.00",
            "pi_payer_initiated": f"${adj_row[3]:,.2f}" if adj_row else "$0.00",
        },
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PREVENTION REPORT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async def _prevention_report(db: AsyncSession, payer_id: Optional[str] = None) -> dict:
    """Prevention report — scan claims for preventable issues."""
    try:
        from app.services.prevention_service import scan_claims_for_prevention
        scan_result = await scan_claims_for_prevention(db)
    except Exception as e:
        logger.error(f"Prevention scan failed: {e}")
        scan_result = {"alerts": [], "error": str(e)}

    alerts = scan_result.get("alerts", [])

    # Group alerts by type
    by_type = {}
    total_revenue_at_risk = 0.0
    for alert in alerts:
        alert_type = alert.get("alert_type", "UNKNOWN")
        if alert_type not in by_type:
            by_type[alert_type] = {"count": 0, "revenue_at_risk": 0.0, "claims": []}
        by_type[alert_type]["count"] += 1
        risk = float(alert.get("revenue_at_risk", 0) or 0)
        by_type[alert_type]["revenue_at_risk"] += risk
        total_revenue_at_risk += risk
        if len(by_type[alert_type]["claims"]) < 5:
            by_type[alert_type]["claims"].append(alert.get("claim_id", ""))

    # Also pull preventable root cause data from DB
    preventable_rc = await db.execute(text("""
        SELECT rca.primary_root_cause, COUNT(*) AS count,
               COALESCE(SUM(rca.financial_impact), 0) AS amount
        FROM root_cause_analysis rca
        WHERE rca.root_cause_group = 'PREVENTABLE'
        GROUP BY rca.primary_root_cause
        ORDER BY amount DESC
    """))

    return {
        "report_type": "prevention",
        "title": "Denial Prevention Report",
        "total_alerts": len(alerts),
        "total_preventable_revenue": f"${total_revenue_at_risk:,.2f}",
        "alerts_by_type": [
            {
                "type": k,
                "count": v["count"],
                "revenue_at_risk": f"${v['revenue_at_risk']:,.2f}",
                "sample_claims": v["claims"],
            }
            for k, v in sorted(by_type.items(), key=lambda x: x[1]["revenue_at_risk"], reverse=True)
        ],
        "historical_preventable_causes": [
            {"root_cause": r[0], "count": r[1], "amount": f"${r[2]:,.2f}"}
            for r in preventable_rc.all()
        ],
    }
