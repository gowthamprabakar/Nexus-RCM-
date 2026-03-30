"""
AI Insights Service — Sprint 4: Ollama Local LLM Integration
=============================================================
Generates real-time, data-grounded narrative insights using Ollama (llama3/mistral).
All dollar amounts and counts are injected from live DB stats — the LLM only writes
the narrative, never fabricates numbers.

Endpoints consumed by:
  GET /api/v1/ai/insights?page=<context>
  GET /api/v1/ai/stream?context=<context>
  POST /api/v1/ai/appeal-draft
  POST /api/v1/ai/call-script
  GET  /api/v1/ai/anomaly-explain
"""

import os
import httpx
import asyncio
import time
import json
import logging
from typing import Optional, AsyncIterator
from dataclasses import dataclass, field
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL = "http://localhost:11434"
PRIMARY_MODEL   = os.environ.get("OLLAMA_MODEL", "qwen3:4b")
FALLBACK_MODEL  = "mistral"
TIMEOUT_SECONDS = 60
CACHE_TTL       = 300  # 5 minutes

# ── In-memory cache ───────────────────────────────────────────────────────────
_cache: dict[str, tuple[float, object]] = {}


def _get_cache(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < CACHE_TTL:
        return entry[1]
    return None


def _set_cache(key: str, value):
    _cache[key] = (time.time(), value)


# ── MECE badge classifier ─────────────────────────────────────────────────────
BADGE_MAP = {
    "denials":          ["Diagnostic", "Prescriptive"],
    "collections":      ["Predictive", "Prescriptive"],
    "payments":         ["Descriptive", "Diagnostic"],
    "ar":               ["Diagnostic", "Predictive"],
    "reconciliation":   ["Descriptive", "Diagnostic"],
    "high-risk":        ["Predictive", "Prescriptive"],
    "crs":              ["Prescriptive", "Descriptive"],
    "root-cause":       ["Diagnostic", "Prescriptive"],
    "adtp":             ["Predictive", "Diagnostic"],
    "diagnostics":      ["Diagnostic", "Prescriptive"],
    "command-center":   ["Descriptive", "Predictive", "Prescriptive"],
    "executive":        ["Descriptive", "Predictive", "Prescriptive"],
    "claims":           ["Descriptive", "Diagnostic"],
    "claims-workqueue": ["Predictive", "Prescriptive"],
    "prevention":       ["Predictive", "Prescriptive"],
    "payer-performance":["Diagnostic", "Prescriptive"],
    "simulation":       ["Predictive", "Prescriptive"],
    "forecast":         ["Predictive", "Prescriptive"],
    "lida":             ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"],
}


# ── Prompt templates ──────────────────────────────────────────────────────────

def _denials_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst at a large US hospital system.
Based on the following live denial data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total denied claims this period: {stats.get('total_denials', 'N/A')}
- Total denied amount: ${stats.get('denied_amount', 0):,.0f}
- Top denial reason: {stats.get('top_reason', 'Authorization')}
- Top payer denying: {stats.get('top_payer', 'Unknown')}
- Overturn rate: {stats.get('overturn_rate', 0):.1f}%
- AI prevention saved: ${stats.get('ai_saved', 0):,.0f}
- Avg days to appeal: {stats.get('avg_days_appeal', 'N/A')}
- Denial trend: {stats.get('denial_change_pct', 0):+.1f}% vs prior week ({stats.get('denial_change_direction', 'stable')})
- Denial $ trend: {stats.get('denial_amt_change_pct', 0):+.1f}% vs prior week
- This week denials: {stats.get('current_week_denials', 0):,} | Prior week: {stats.get('prior_week_denials', 0):,}
- Diagnostic engine findings: {stats.get('diagnostic_findings', 'N/A')}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above. Reference diagnostic findings if available.
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown. Example format:
[{{"title": "...", "body": "...", "badge": "Diagnostic", "severity": "warning"}}]"""


def _collections_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live collections data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total A/R outstanding: ${stats.get('total_ar', 0):,.0f}
- Queue depth (open tasks): {stats.get('queue_depth', 0):,}
- Total collectible amount: ${stats.get('total_collectible', 0):,.0f}
- Active alerts: {stats.get('active_alerts', 0)}
- Claims 120+ days outstanding: {stats.get('over_120_count', 0):,}
- Claims 120+ days amount: ${stats.get('over_120_amount', 0):,.0f}
- Average propensity to pay score: {stats.get('avg_propensity', 0):.0f}/100
- Diagnostic engine findings: {stats.get('diagnostic_findings', 'N/A')}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above. Reference diagnostic findings if available.
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _payments_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live payment/ERA data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total ERA payments posted: ${stats.get('total_posted', 0):,.0f}
- Total ERA transactions: {stats.get('total_era_count', 0):,}
- Total adjustments: ${stats.get('total_adjustments', 0):,.0f}
- Total patient responsibility: ${stats.get('total_patient_resp', 0):,.0f}
- Payment rate: {stats.get('payment_rate', 0):.1f}%
- Forecasted vs actual variance: {stats.get('variance_pct', 0):.2f}%
- Revenue trend: {stats.get('revenue_change_pct', 0):+.1f}% vs prior week ({stats.get('revenue_change_direction', 'stable')})
- Diagnostic engine findings: {stats.get('diagnostic_findings', 'N/A')}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above. Reference diagnostic findings if available.
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _reconciliation_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live reconciliation data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total ERA received: ${stats.get('total_era_received', 0):,.0f}
- Total forecasted: ${stats.get('total_forecasted', 0):,.0f}
- Total bank deposited: ${stats.get('total_bank_deposited', 0):,.0f}
- Open variances: {stats.get('variance_count', 0)}
- Reconciled records: {stats.get('reconciled_count', 0)}
- Overall variance %: {stats.get('variance_pct', 0):.2f}%
- Diagnostic engine findings: {stats.get('diagnostic_findings', 'N/A')}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above. Reference diagnostic findings if available.
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _root_cause_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live root cause analysis data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total root cause analyses: {stats.get('total_analyses', 'N/A')}
- Total financial impact: ${stats.get('total_financial_impact', 0):,.0f}
- Preventable amount: ${stats.get('preventable_amount', 0):,.0f}
- Preventable %: {stats.get('preventable_pct', 0):.1f}%
- Top root cause: {stats.get('top_root_cause', 'N/A')}
- Top root cause count: {stats.get('top_root_cause_count', 0)}
- Average confidence: {stats.get('avg_confidence', 0):.0f}%

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _adtp_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live ADTP (Average Days To Pay) data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Payers tracked: {stats.get('payers_tracked', 'N/A')}
- Average ADTP across payers: {stats.get('avg_adtp', 0):.1f} days
- Anomalies detected: {stats.get('anomaly_count', 0)}
- Delayed payers: {stats.get('delayed_payers', 0)}
- Total payment volume: ${stats.get('total_payment_volume', 0):,.0f}
- Max deviation: {stats.get('max_deviation', 0):.1f} days

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _command_center_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst providing an executive summary.
Based on the following live dashboard data, generate 3 concise, actionable AI insights for the Command Center.

LIVE DATA (do not change these numbers):
- Total A/R outstanding: ${stats.get('total_ar', 0):,.0f}
- Days in A/R: {stats.get('avg_days', 'N/A')}
- Denial rate: {stats.get('denial_rate', 'N/A')}%
- Total denied amount: ${stats.get('denied_amount', 0):,.0f}
- Clean claim / pass rate: {stats.get('pass_rate', 'N/A')}%
- Net collection rate: {stats.get('collection_rate', 'N/A')}%
- Total pipeline billed: ${stats.get('total_billed', 0):,.0f}
- Revenue at risk: ${stats.get('revenue_at_risk', 0):,.0f}
- Denial trend: {stats.get('denial_change_pct', 0):+.1f}% vs prior week ({stats.get('denial_change_direction', 'stable')})
- Revenue trend: {stats.get('revenue_change_pct', 0):+.1f}% vs prior week ({stats.get('revenue_change_direction', 'stable')})

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _diagnostics_prompt(stats: dict) -> str:
    # Build findings context
    findings_text = ""
    for i, f in enumerate(stats.get("top_findings", [])[:5], 1):
        findings_text += (
            f"  {i}. [{f.get('severity', 'info').upper()}] {f.get('title', 'N/A')} "
            f"— ${f.get('impact_amount', 0):,.0f} impact ({f.get('category', 'N/A')})\n"
        )
    if not findings_text:
        findings_text = "  No findings available.\n"

    return f"""You are an expert Revenue Cycle Management analyst reviewing diagnostic engine findings.
Based on the following diagnostic engine output, generate 3 concise, actionable AI insights.

DIAGNOSTIC ENGINE FINDINGS (do not change these numbers):
- Total diagnostic findings: {stats.get('total_findings', 0)}
- Critical findings: {stats.get('critical_count', 0)}
- Warning findings: {stats.get('warning_count', 0)}
- Total $ at risk: ${stats.get('total_impact', 0):,.0f}

TOP FINDINGS (ranked by impact):
{findings_text}
CATEGORY BREAKDOWN:
{chr(10).join(f"  - {c.get('category', 'N/A')}: {c.get('count', 0)} findings, ${c.get('impact', 0):,.0f}" for c in stats.get('by_category', [])[:5]) or '  None available.'}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative referencing the REAL findings above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _executive_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst providing a C-suite executive briefing.
Based on the following live executive dashboard data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total revenue: ${stats.get('total_revenue', 0):,.0f}
- Denial rate: {stats.get('denial_rate', 0):.1f}%
- Net collection rate: {stats.get('collection_rate', 0):.1f}%
- Average days in A/R: {stats.get('days_in_ar', 0):.1f}
- First pass rate: {stats.get('first_pass_rate', 0):.1f}%
- Total claims volume: {stats.get('total_claims', 0):,}
- Total denied amount: ${stats.get('denied_amount', 0):,.0f}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _claims_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live claims pipeline data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total claims: {stats.get('total_claims', 0):,}
- Submission rate (submitted/total): {stats.get('submission_rate', 0):.1f}%
- CRS pass rate: {stats.get('crs_pass_rate', 0):.1f}%
- Draft claims: {stats.get('draft_count', 0):,}
- Submitted claims: {stats.get('submitted_count', 0):,}
- Acknowledged claims: {stats.get('acknowledged_count', 0):,}
- Paid claims: {stats.get('paid_count', 0):,}
- Denied claims: {stats.get('denied_count', 0):,}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _claims_workqueue_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live claims work queue data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Queue size (open tasks): {stats.get('queue_size', 0):,}
- High-risk claims: {stats.get('high_risk_count', 0):,}
- Claims with CRS auto-fix applied: {stats.get('auto_fix_count', 0):,}
- Auto-fix rate: {stats.get('auto_fix_rate', 0):.1f}%
- Average CRS score: {stats.get('avg_crs_score', 0):.0f}
- Total charges at risk: ${stats.get('charges_at_risk', 0):,.0f}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _crs_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live CRS (Claim Readiness Score) scrubbing data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- CRS pass rate: {stats.get('pass_rate', 0):.1f}%
- Auto-fix rate: {stats.get('auto_fix_rate', 0):.1f}%
- Top error category: {stats.get('top_error_category', 'N/A')}
- Denials prevented (estimated): {stats.get('denials_prevented', 0):,}
- Revenue saved by prevention: ${stats.get('revenue_saved', 0):,.0f}
- Average CRS score: {stats.get('avg_crs_score', 0):.0f}/100
- Claims scrubbed: {stats.get('claims_scrubbed', 0):,}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _ar_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live AR aging data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total A/R outstanding: ${stats.get('total_ar', 0):,.0f}
- Average days outstanding: {stats.get('avg_days', 0):.1f}
- 0-30 days: ${stats.get('bucket_0_30', 0):,.0f}
- 31-60 days: ${stats.get('bucket_31_60', 0):,.0f}
- 61-90 days: ${stats.get('bucket_61_90', 0):,.0f}
- 91-120 days: ${stats.get('bucket_91_120', 0):,.0f}
- 120+ days: ${stats.get('bucket_120_plus', 0):,.0f}
- Top payer by AR balance: {stats.get('top_payer', 'N/A')} (${stats.get('top_payer_balance', 0):,.0f})
- AR trend: {stats.get('ar_change_pct', 0):+.1f}% new AR vs prior week ({stats.get('ar_change_direction', 'stable')})

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _prevention_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live prevention intelligence data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Total prevention alerts: {stats.get('total_alerts', 0):,}
- Critical alerts: {stats.get('critical_count', 0):,}
- Total revenue at risk: ${stats.get('revenue_at_risk', 0):,.0f}
- Preventable count: {stats.get('preventable_count', 0):,}
- Prevention rate: {stats.get('prevention_rate', 0):.1f}%
- Top alert type: {stats.get('top_alert_type', 'N/A')}
- Claims scanned: {stats.get('claims_scanned', 0):,}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _payer_performance_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following live payer performance data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Payers tracked: {stats.get('payers_tracked', 0)}
- Best payer (lowest denial rate): {stats.get('best_payer', 'N/A')} ({stats.get('best_payer_denial_rate', 0):.1f}% denial rate)
- Worst payer (highest denial rate): {stats.get('worst_payer', 'N/A')} ({stats.get('worst_payer_denial_rate', 0):.1f}% denial rate)
- Average ADTP across payers: {stats.get('avg_adtp', 0):.1f} days
- Slowest payer ADTP: {stats.get('slowest_payer', 'N/A')} ({stats.get('slowest_adtp', 0):.1f} days)
- Overall payment accuracy: {stats.get('payment_accuracy', 0):.1f}%
- Total payer payment volume: ${stats.get('total_payer_payments', 0):,.0f}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _simulation_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following simulation engine data, generate 3 concise, actionable AI insights.

LIVE DATA (do not change these numbers):
- Scenarios available: {stats.get('scenarios_available', 0)}
- Last simulation type: {stats.get('last_sim_type', 'N/A')}
- Last simulation result summary: {stats.get('last_sim_summary', 'No simulations run yet')}
- Projected impact: ${stats.get('projected_impact', 0):,.0f}
- Confidence level: {stats.get('confidence_level', 0):.0f}%

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _forecast_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following ML forecast data, generate 3 concise, actionable AI insights about revenue predictions.

LIVE DATA (do not change these numbers):
- Model type: {stats.get('model_type', 'Prophet')}
- Model accuracy (MAPE): {stats.get('mape', 0):.1f}%
- R² score: {stats.get('r_squared', 0):.4f}
- 90-day projected revenue: ${stats.get('total_projected', 0):,.0f}
- Weekly average projection: ${stats.get('weekly_avg', 0):,.0f}
- Denial reduction applied: {stats.get('denial_pct', 0):.1f}%
- Training data points: {stats.get('training_points', 0):,}
- Top performing payer forecast: {stats.get('top_payer', 'N/A')} (MAPE: {stats.get('top_payer_mape', 0):.1f}%)

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence narrative using ONLY the numbers provided above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _lida_prompt(stats: dict) -> str:
    return f"""You are an expert Revenue Cycle Management analyst.
Based on the following RCM data summary, generate 3 concise insights about what analysis is most valuable right now.

LIVE DATA (do not change these numbers):
- Total claims in system: {stats.get('total_claims', 0):,}
- Total denials: {stats.get('total_denials', 0):,} (${stats.get('denied_amount', 0):,.0f})
- Total A/R outstanding: ${stats.get('total_ar', 0):,.0f}
- Total ERA payments posted: ${stats.get('total_posted', 0):,.0f}
- Datasets available for analysis: {stats.get('datasets_available', 5)}

Output exactly 3 insights as a JSON array. Each insight must have:
- "title": short headline (max 8 words)
- "body": 1-2 sentence suggestion for what to query or analyze next using ONLY the numbers above
- "badge": one of ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"]
- "severity": one of ["info", "warning", "critical"]

Respond ONLY with valid JSON. No preamble. No markdown."""


def _appeal_prompt(claim: dict) -> str:
    return f"""You are a medical billing appeals specialist writing a formal appeal letter.

CLAIM DETAILS:
- Claim ID: {claim.get('claim_id', 'N/A')}
- Patient: {claim.get('patient_name', 'N/A')}
- Date of Service: {claim.get('date_of_service', 'N/A')}
- CPT Code: {claim.get('cpt_code', 'N/A')}
- Denial Reason: {claim.get('denial_reason', 'N/A')}
- CARC Code: {claim.get('carc_code', 'N/A')}
- Payer: {claim.get('payer_name', 'N/A')}
- Billed Amount: ${claim.get('billed_amount', 0):,.2f}
- Denied Amount: ${claim.get('denied_amount', 0):,.2f}

Write a professional, concise appeal letter (3 paragraphs):
1. Opening: State the claim, denial, and that you are appealing
2. Clinical/administrative justification: Why the service was medically necessary and properly billed
3. Closing: Request for reconsideration with urgency

Use formal medical billing language. Do not invent clinical facts beyond what is provided.
Output ONLY the letter text, no JSON, no markdown headers."""


def _call_script_prompt(task: dict) -> str:
    return f"""You are a healthcare revenue cycle collections coach.
Generate a professional phone script for a collections specialist calling about an unpaid claim.

TASK DETAILS:
- Patient: {task.get('patient_name', 'N/A')}
- Payer: {task.get('payer_name', 'N/A')}
- Balance: ${task.get('balance', 0):,.2f}
- Days Outstanding: {task.get('days_outstanding', 0)} days
- Action Type: {task.get('action_type', 'Follow-up call')}
- Priority: {task.get('priority', 'medium')}

Write a professional call script with:
1. Opening introduction (who you are, why calling)
2. 3 key verification questions to ask
3. 2-3 negotiation talking points based on balance and days outstanding
4. Closing next steps

Keep it concise and professional. Output only the script text, no JSON."""


def _anomaly_prompt(metric: str, value: float, baseline: float) -> str:
    pct_diff = ((value - baseline) / baseline * 100) if baseline else 0
    direction = "above" if value > baseline else "below"
    return f"""You are a Revenue Cycle Management anomaly analyst.

ANOMALY DETECTED:
- Metric: {metric}
- Current Value: {value:,.2f}
- Expected Baseline: {baseline:,.2f}
- Deviation: {abs(pct_diff):.1f}% {direction} baseline

In 2-3 sentences, explain:
1. What this anomaly likely indicates in an RCM context
2. What the most probable root cause is
3. What immediate action the billing team should take

Be specific and clinical. Output only plain text, no JSON, no markdown."""


# ── Core Ollama caller ────────────────────────────────────────────────────────

async def _call_ollama(prompt: str, model: str = PRIMARY_MODEL) -> str:
    """Call Ollama generate endpoint. Falls back to mistral if llama3 fails."""
    # Disable Qwen3 thinking mode for faster responses
    if "qwen3" in model.lower() and "/no_think" not in prompt:
        prompt = prompt.rstrip() + " /no_think"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,   # low temp = factual, consistent
            "num_predict": 512,
        }
    }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
    except Exception as e:
        if model == PRIMARY_MODEL:
            logger.warning(f"llama3 failed ({e}), falling back to mistral")
            return await _call_ollama(prompt, model=FALLBACK_MODEL)
        raise RuntimeError(f"Ollama unavailable: {e}")


async def _stream_ollama(prompt: str, model: str = PRIMARY_MODEL) -> AsyncIterator[str]:
    """Stream tokens from Ollama one chunk at a time."""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": True,
        "options": {"temperature": 0.3, "num_predict": 512},
    }
    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/generate", json=payload) as resp:
            async for line in resp.aiter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        token = chunk.get("response", "")
                        if token:
                            yield token
                        if chunk.get("done"):
                            break
                    except json.JSONDecodeError:
                        continue


# ── Public API ────────────────────────────────────────────────────────────────

async def get_insights(page: str, stats: dict, db: AsyncSession = None) -> list[dict]:
    """
    Generate 3 MECE-badged insight cards for the given page context.
    Returns cached result if available (TTL=5min).

    When db is provided, enriches prompts with ontology-derived context
    from the appropriate AI layer (descriptive, diagnostic, predictive, prescriptive).
    """
    cache_key = f"insights:{page}:{hash(str(sorted(stats.items())))}"
    cached = _get_cache(cache_key)
    if cached:
        logger.info(f"Cache hit for insights:{page}")
        return cached

    prompt_map = {
        "denials":          _denials_prompt,
        "collections":      _collections_prompt,
        "payments":         _payments_prompt,
        "reconciliation":   _reconciliation_prompt,
        "root-cause":       _root_cause_prompt,
        "adtp":             _adtp_prompt,
        "diagnostics":      _diagnostics_prompt,
        "command-center":   _command_center_prompt,
        "executive":        _executive_prompt,
        "claims":           _claims_prompt,
        "claims-workqueue": _claims_workqueue_prompt,
        "crs":              _crs_prompt,
        "ar":               _ar_prompt,
        "prevention":       _prevention_prompt,
        "payer-performance":_payer_performance_prompt,
        "simulation":       _simulation_prompt,
        "forecast":         _forecast_prompt,
        "lida":             _lida_prompt,
    }

    prompt_fn = prompt_map.get(page)
    if not prompt_fn:
        return _fallback_insights(page)

    # Build ontology context enrichment if db is available
    ontology_context = ""
    if db is not None:
        ontology_context = await _get_ontology_context_for_page(db, page)

    try:
        base_prompt = prompt_fn(stats)
        # Inject ontology context into the prompt
        if ontology_context:
            enriched_prompt = (
                f"{base_prompt}\n\n"
                f"ADDITIONAL ONTOLOGY CONTEXT (use to enrich your analysis):\n"
                f"{ontology_context}"
            )
        else:
            enriched_prompt = base_prompt

        raw = await _call_ollama(enriched_prompt)
        # Extract JSON array from response
        start = raw.find("[")
        end   = raw.rfind("]") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON array in response")
        insights = json.loads(raw[start:end])

        # Validate and enrich — map "body" to "description" for frontend
        badges = BADGE_MAP.get(page, ["Descriptive", "Diagnostic"])
        for i, item in enumerate(insights):
            item.setdefault("badge",    badges[i % len(badges)])
            item.setdefault("severity", "info")
            item.setdefault("title",    f"Insight {i+1}")
            item.setdefault("body",     "")
            # Frontend expects "description" not "body"
            if "body" in item and "description" not in item:
                item["description"] = item["body"]
            item.setdefault("description", item.get("body", ""))
            item["ai_generated"] = True
            item["ontology_enriched"] = bool(ontology_context)

        _set_cache(cache_key, insights)
        return insights

    except Exception as e:
        logger.error(f"Ollama insight generation failed for {page}: {e}")
        return _fallback_insights(page)


async def _get_ontology_context_for_page(db: AsyncSession, page: str) -> str:
    """Map page context to the appropriate ontology context builder."""
    try:
        from app.services.ontology_context import (
            build_descriptive_context,
            build_diagnostic_context,
            build_predictive_context,
            build_prescriptive_context,
            build_root_cause_context,
        )

        # Map pages to their primary AI layer
        page_layer_map = {
            "denials":          build_diagnostic_context,
            "collections":      build_predictive_context,
            "payments":         build_descriptive_context,
            "reconciliation":   build_descriptive_context,
            "root-cause":       build_root_cause_context,
            "adtp":             build_predictive_context,
            "diagnostics":      build_diagnostic_context,
            "command-center":   build_descriptive_context,
            "executive":        build_descriptive_context,
            "claims":           build_descriptive_context,
            "claims-workqueue": build_prescriptive_context,
            "crs":              build_prescriptive_context,
            "ar":               build_diagnostic_context,
            "prevention":       build_prescriptive_context,
            "payer-performance":build_diagnostic_context,
            "simulation":       build_predictive_context,
            "forecast":         build_predictive_context,
        }

        builder = page_layer_map.get(page)
        if builder:
            # root_cause_context has a different signature
            if builder == build_root_cause_context:
                return await builder(db)
            return await builder(db)
        return ""
    except Exception as e:
        logger.warning(f"Ontology context enrichment failed for {page}: {e}")
        return ""


async def stream_insights(page: str, stats: dict) -> AsyncIterator[str]:
    """Stream raw token output for a given page context (SSE)."""
    prompt_map = {
        "denials":          _denials_prompt,
        "collections":      _collections_prompt,
        "payments":         _payments_prompt,
        "reconciliation":   _reconciliation_prompt,
        "root-cause":       _root_cause_prompt,
        "adtp":             _adtp_prompt,
        "diagnostics":      _diagnostics_prompt,
        "command-center":   _command_center_prompt,
        "executive":        _executive_prompt,
        "claims":           _claims_prompt,
        "claims-workqueue": _claims_workqueue_prompt,
        "crs":              _crs_prompt,
        "ar":               _ar_prompt,
        "prevention":       _prevention_prompt,
        "payer-performance":_payer_performance_prompt,
        "simulation":       _simulation_prompt,
        "forecast":         _forecast_prompt,
        "lida":             _lida_prompt,
    }
    prompt_fn = prompt_map.get(page, _denials_prompt)
    async for token in _stream_ollama(prompt_fn(stats)):
        yield token


async def draft_appeal(claim: dict) -> str:
    """Generate a formal appeal letter for a denied claim."""
    cache_key = f"appeal:{claim.get('claim_id', 'unknown')}"
    cached = _get_cache(cache_key)
    if cached:
        return cached
    try:
        letter = await _call_ollama(_appeal_prompt(claim))
        _set_cache(cache_key, letter)
        return letter
    except Exception as e:
        logger.error(f"Appeal draft failed: {e}")
        return _fallback_appeal(claim)


async def generate_call_script(task: dict) -> str:
    """Generate a collections call script for a given task."""
    cache_key = f"script:{task.get('task_id', 'unknown')}"
    cached = _get_cache(cache_key)
    if cached:
        return cached
    try:
        script = await _call_ollama(_call_script_prompt(task))
        _set_cache(cache_key, script)
        return script
    except Exception as e:
        logger.error(f"Call script generation failed: {e}")
        return _fallback_script(task)


async def explain_anomaly(metric: str, value: float, baseline: float) -> str:
    """Explain a detected metric anomaly in plain English."""
    try:
        return await _call_ollama(_anomaly_prompt(metric, value, baseline))
    except Exception as e:
        logger.error(f"Anomaly explanation failed: {e}")
        return f"Anomaly detected: {metric} is {value:,.2f} vs baseline {baseline:,.2f}. Manual review recommended."


# ── Fallbacks (if Ollama is down) ─────────────────────────────────────────────

def _fallback_insights(page: str) -> list[dict]:
    return [
        {
            "title": "AI Insights Unavailable",
            "body": "Ollama service is not responding. Restart with: ollama serve",
            "badge": "Descriptive",
            "severity": "warning",
            "ai_generated": False,
        }
    ]


def _fallback_appeal(claim: dict) -> str:
    return (
        f"RE: Appeal for Claim {claim.get('claim_id', 'N/A')}\n\n"
        f"Dear {claim.get('payer_name', 'Payer')} Appeals Department,\n\n"
        f"We are writing to formally appeal the denial of the above-referenced claim "
        f"for services rendered on {claim.get('date_of_service', 'N/A')}. "
        f"The denial reason cited was: {claim.get('denial_reason', 'N/A')}.\n\n"
        f"We respectfully request reconsideration of this claim totaling "
        f"${claim.get('billed_amount', 0):,.2f}.\n\n"
        f"[AI service unavailable — please complete this letter manually]\n\n"
        f"Sincerely,\nRevenue Cycle Department"
    )


def _fallback_script(task: dict) -> str:
    return (
        f"Call Script — {task.get('patient_name', 'Patient')}\n\n"
        f"Opening: 'Hello, this is [Name] calling from [Hospital] billing department "
        f"regarding a balance of ${task.get('balance', 0):,.2f} with {task.get('payer_name', 'your insurance')}.'\n\n"
        f"[AI service unavailable — please complete this script manually]"
    )
