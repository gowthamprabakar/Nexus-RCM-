"""
Diagnostic Engine -- Sprint 6
=================================
Produces ranked diagnostic findings by analyzing root cause patterns,
payer behavior, ADTP anomalies, and revenue signals.

DIFFERENT from root cause service:
  - Root cause tells you WHY (what caused a denial)
  - Diagnostic tells you WHAT'S WRONG NOW and WHAT TO DO (ranked by impact)

This service is DETERMINISTIC -- no LLM calls. Pure analytics.
"""

import hashlib
import json
import logging
from uuid import uuid4
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import select, func, and_, desc, case, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.denial import Denial
from app.models.claim import Claim
from app.models.payer import Payer
from app.models.root_cause import RootCauseAnalysis
from app.models.rcm_extended import EraPayment, BankReconciliation, ClaimLine, DiagnosticFinding
from app.models.root_cause import ADTPTrend

logger = logging.getLogger(__name__)


def _gen_finding_id() -> str:
    """Legacy random ID — kept for payer/claim-level (non-persisted) findings."""
    return f"DX{uuid4().hex[:10].upper()}"


def _deterministic_finding_id(category: str, *key_parts) -> str:
    """
    Deterministic finding ID: DF-{category}-{hash}.
    Same inputs always produce the same ID so upsert works correctly.
    """
    raw = f"{category}|{'|'.join(str(p) for p in key_parts)}"
    h = hashlib.sha256(raw.encode()).hexdigest()[:12].upper()
    return f"DF-{category}-{h}"


async def _persist_findings(db: AsyncSession, findings: list[dict]) -> None:
    """Upsert diagnostic findings into the diagnostic_finding table."""
    if not findings:
        return
    for f in findings:
        stmt = pg_insert(DiagnosticFinding).values(
            finding_id=f["finding_id"],
            category=f.get("category", "UNKNOWN"),
            severity=f.get("severity", "info").upper(),
            title=f.get("title", ""),
            description=f.get("description", ""),
            metric_value=f.get("impact_amount"),
            threshold_value=None,
            financial_impact=f.get("impact_amount", 0),
            affected_claims=f.get("affected_claims_count", 0),
            payer_id=f.get("metadata", {}).get("payer_id"),
            payer_name=f.get("metadata", {}).get("payer_name"),
            root_cause=f.get("root_causes", [None])[0] if f.get("root_causes") else None,
            recommended_action=json.dumps(f.get("recommended_actions", [])),
            status="ACTIVE",
            created_at=datetime.utcnow(),
        ).on_conflict_do_update(
            index_elements=["finding_id"],
            set_={
                "severity": f.get("severity", "info").upper(),
                "title": f.get("title", ""),
                "description": f.get("description", ""),
                "financial_impact": f.get("impact_amount", 0),
                "affected_claims": f.get("affected_claims_count", 0),
                "payer_name": f.get("metadata", {}).get("payer_name"),
                "root_cause": f.get("root_causes", [None])[0] if f.get("root_causes") else None,
                "recommended_action": json.dumps(f.get("recommended_actions", [])),
            },
        )
        await db.execute(stmt)
    await db.commit()
    logger.info(f"Persisted {len(findings)} diagnostic findings to DB")


# ── System-wide Diagnostics ─────────────────────────────────────────────────

async def generate_system_diagnostics(db: AsyncSession) -> dict:
    """
    Generates system-wide diagnostic findings.
    Returns ranked list of diagnostic findings with:
    - finding_id, title, description
    - severity (critical/warning/info)
    - category (DENIAL_PATTERN/PAYMENT_FLOW/AR_AGING/REVENUE_LEAKAGE/PAYER_BEHAVIOR)
    - impact_amount (estimated $ at risk)
    - affected_claims_count
    - root_causes (linked root cause categories)
    - recommended_actions (list of specific actions)
    - confidence_score (0-100)
    """
    findings = []

    try:
        # 1. Denial Pattern Detection
        denial_findings = await _detect_denial_patterns(db)
        findings.extend(denial_findings)
    except Exception as e:
        logger.error(f"Denial pattern detection failed: {e}")

    try:
        # 2. Payer Behavior Detection
        payer_findings = await _detect_payer_behavior(db)
        findings.extend(payer_findings)
    except Exception as e:
        logger.error(f"Payer behavior detection failed: {e}")

    try:
        # 3. ADTP Anomaly Detection
        adtp_findings = await _detect_adtp_anomalies(db)
        findings.extend(adtp_findings)
    except Exception as e:
        logger.error(f"ADTP anomaly detection failed: {e}")

    try:
        # 4. Revenue Leakage Detection
        leakage_findings = await _detect_revenue_leakage(db)
        findings.extend(leakage_findings)
    except Exception as e:
        logger.error(f"Revenue leakage detection failed: {e}")

    try:
        # 5. AR Aging Detection
        aging_findings = await _detect_ar_aging(db)
        findings.extend(aging_findings)
    except Exception as e:
        logger.error(f"AR aging detection failed: {e}")

    # Sort all findings by impact_amount descending
    findings.sort(key=lambda f: f.get("impact_amount", 0), reverse=True)

    # Persist findings to diagnostic_finding table
    try:
        await _persist_findings(db, findings)
    except Exception as e:
        logger.error(f"Failed to persist diagnostic findings: {e}")

    return {
        "generated_at": str(date.today()),
        "total_findings": len(findings),
        "critical_count": sum(1 for f in findings if f["severity"] == "critical"),
        "warning_count": sum(1 for f in findings if f["severity"] == "warning"),
        "info_count": sum(1 for f in findings if f["severity"] == "info"),
        "total_impact": round(sum(f.get("impact_amount", 0) for f in findings), 2),
        "findings": findings,
    }


# ── 1. Denial Pattern Detection ─────────────────────────────────────────────

async def _detect_denial_patterns(db: AsyncSession) -> list[dict]:
    """Query root_cause_analysis grouped by primary_root_cause to detect patterns."""
    findings = []

    rows = await db.execute(
        select(
            RootCauseAnalysis.primary_root_cause,
            func.count().label("cnt"),
            func.sum(RootCauseAnalysis.financial_impact).label("total_impact"),
            func.avg(RootCauseAnalysis.confidence_score).label("avg_confidence"),
        )
        .group_by(RootCauseAnalysis.primary_root_cause)
        .order_by(desc("total_impact"))
    )

    for row in rows:
        root_cause, count, total_impact, avg_confidence = row
        total_impact = float(total_impact or 0)
        avg_confidence = float(avg_confidence or 0)

        if count > 500 and total_impact > 1_000_000:
            severity = "critical"
        elif count > 200 and total_impact > 500_000:
            severity = "warning"
        else:
            continue  # skip info-level denial patterns

        # Get the top payer for this root cause
        top_payer_row = await db.execute(
            select(
                RootCauseAnalysis.payer_id,
                func.count().label("cnt"),
            )
            .where(RootCauseAnalysis.primary_root_cause == root_cause)
            .group_by(RootCauseAnalysis.payer_id)
            .order_by(desc("cnt"))
            .limit(1)
        )
        top_payer = top_payer_row.first()
        top_payer_id = top_payer[0] if top_payer else "Unknown"

        # Get top denial category for this root cause
        top_cat_row = await db.execute(
            select(
                Denial.denial_category,
                func.count().label("cnt"),
            )
            .join(RootCauseAnalysis, RootCauseAnalysis.denial_id == Denial.denial_id)
            .where(RootCauseAnalysis.primary_root_cause == root_cause)
            .group_by(Denial.denial_category)
            .order_by(desc("cnt"))
            .limit(1)
        )
        top_cat = top_cat_row.first()
        top_category = top_cat[0] if top_cat else "Unknown"

        # Resolve payer name
        payer_name = top_payer_id
        try:
            payer_obj = await db.get(Payer, top_payer_id)
            if payer_obj:
                payer_name = payer_obj.payer_name
        except Exception:
            pass

        findings.append({
            "finding_id": _deterministic_finding_id("DENIAL_PATTERN", root_cause),
            "title": f"High-volume {root_cause.replace('_', ' ').title()} denials",
            "description": (
                f"{count:,} denials attributed to {root_cause} with "
                f"${total_impact:,.0f} financial impact. "
                f"Top payer: {payer_name}. Top denial category: {top_category}."
            ),
            "severity": severity,
            "category": "DENIAL_PATTERN",
            "impact_amount": round(total_impact, 2),
            "affected_claims_count": count,
            "root_causes": [root_cause],
            "recommended_actions": _get_denial_actions(root_cause),
            "confidence_score": min(int(avg_confidence), 99),
            "metadata": {
                "top_payer_id": top_payer_id,
                "top_payer_name": payer_name,
                "top_denial_category": top_category,
            },
        })

    return findings


def _get_denial_actions(root_cause: str) -> list[str]:
    """Return recommended actions for a given root cause category."""
    actions = {
        "ELIGIBILITY_LAPSE": [
            "Implement real-time eligibility verification before claim submission",
            "Set up automated 270/271 checks 48 hours before service",
            "Review eligibility verification workflow for gaps",
        ],
        "AUTH_MISSING": [
            "Audit prior authorization workflow for missed submissions",
            "Implement payer-specific auth requirement rules engine",
            "Train front-desk staff on auth verification at scheduling",
        ],
        "AUTH_EXPIRED": [
            "Set up automated auth expiry alerts 7 days before deadline",
            "Create auth renewal queue for long-term treatment plans",
            "Review cases for retrospective auth eligibility",
        ],
        "TIMELY_FILING_MISS": [
            "Identify and fix billing workflow bottlenecks causing delays",
            "Implement submission deadline tracking dashboard",
            "Escalate aged unbilled claims daily",
        ],
        "CODING_MISMATCH": [
            "Conduct coding accuracy audit with certified coders",
            "Implement pre-submission coding validation rules",
            "Review modifier usage patterns for common errors",
        ],
        "COB_ORDER_ERROR": [
            "Verify coordination of benefits at patient registration",
            "Implement automated COB order validation",
            "Cross-reference with payer COB databases",
        ],
        "DOCUMENTATION_DEFICIT": [
            "Review clinical documentation completeness standards",
            "Implement documentation checklist by service type",
            "Provide targeted CDI training for high-denial areas",
        ],
        "PAYER_BEHAVIOR_SHIFT": [
            "Escalate to payer relations team for contract review",
            "Analyze recent policy changes from this payer",
            "Document denial pattern changes for contract negotiation",
        ],
        "CONTRACT_RATE_GAP": [
            "Compare paid amounts to contracted rates systematically",
            "Initiate underpayment appeal process for identified gaps",
            "Schedule contract renegotiation for underperforming terms",
        ],
    }
    return actions.get(root_cause, [
        "Investigate root cause pattern manually",
        "Review affected claims for common characteristics",
        "Escalate to revenue cycle leadership",
    ])


# ── 2. Payer Behavior Detection ─────────────────────────────────────────────

async def _detect_payer_behavior(db: AsyncSession) -> list[dict]:
    """Compare each payer's current denial rate to historical baseline."""
    findings = []

    # Get all payers with their historical denial rate
    payers_result = await db.execute(
        select(Payer.payer_id, Payer.payer_name, Payer.denial_rate)
    )
    payers = payers_result.all()

    for payer_id, payer_name, historical_denial_rate in payers:
        if not historical_denial_rate or historical_denial_rate <= 0:
            continue

        # Current denial count for this payer (last 90 days)
        ninety_days_ago = date.today() - timedelta(days=90)
        denial_count = await db.scalar(
            select(func.count(Denial.denial_id))
            .join(Claim, Claim.claim_id == Denial.claim_id)
            .where(
                and_(
                    Claim.payer_id == payer_id,
                    Denial.denial_date >= ninety_days_ago,
                )
            )
        ) or 0

        total_claims = await db.scalar(
            select(func.count(Claim.claim_id))
            .where(
                and_(
                    Claim.payer_id == payer_id,
                    Claim.submission_date >= ninety_days_ago,
                )
            )
        ) or 0

        if total_claims < 10:
            continue

        current_rate = denial_count / total_claims
        rate_ratio = current_rate / historical_denial_rate

        if rate_ratio <= 1.5:
            continue

        # Calculate financial impact
        denial_amount = await db.scalar(
            select(func.sum(Denial.denial_amount))
            .join(Claim, Claim.claim_id == Denial.claim_id)
            .where(
                and_(
                    Claim.payer_id == payer_id,
                    Denial.denial_date >= ninety_days_ago,
                )
            )
        ) or 0

        severity = "critical" if rate_ratio > 2.0 else "warning"

        findings.append({
            "finding_id": _deterministic_finding_id("PAYER_BEHAVIOR", payer_id),
            "title": f"{payer_name} denial rate spike",
            "description": (
                f"{payer_name} current denial rate is {current_rate:.1%} "
                f"({rate_ratio:.1f}x historical baseline of {historical_denial_rate:.1%}). "
                f"{denial_count:,} denials from {total_claims:,} claims in last 90 days."
            ),
            "severity": severity,
            "category": "PAYER_BEHAVIOR",
            "impact_amount": round(float(denial_amount), 2),
            "affected_claims_count": denial_count,
            "root_causes": ["PAYER_BEHAVIOR_SHIFT"],
            "recommended_actions": [
                f"Contact {payer_name} representative to discuss increased denials",
                "Review recent payer policy bulletins for coverage changes",
                "Analyze denied claims for new denial patterns or CARC codes",
                "Consider escalating to contract negotiation team",
            ],
            "confidence_score": min(int(rate_ratio * 30), 95),
            "metadata": {
                "payer_id": payer_id,
                "payer_name": payer_name,
                "current_denial_rate": round(current_rate, 4),
                "historical_denial_rate": round(historical_denial_rate, 4),
                "rate_ratio": round(rate_ratio, 2),
            },
        })

    return findings


# ── 3. ADTP Anomaly Detection ────────────────────────────────────────────────

async def _detect_adtp_anomalies(db: AsyncSession) -> list[dict]:
    """Create findings for each anomalous ADTP trend entry."""
    findings = []

    rows = await db.execute(
        select(
            ADTPTrend.payer_id,
            ADTPTrend.anomaly_type,
            ADTPTrend.deviation_days,
            ADTPTrend.deviation_pct,
            ADTPTrend.total_amount,
            ADTPTrend.actual_adtp_days,
            ADTPTrend.expected_adtp_days,
            ADTPTrend.payment_count,
        )
        .where(ADTPTrend.is_anomaly == True)
        .order_by(desc(ADTPTrend.total_amount))
    )

    for row in rows:
        payer_id, anomaly_type, deviation_days, deviation_pct, total_amount, \
            actual_adtp, expected_adtp, payment_count = row

        # Resolve payer name
        payer_name = payer_id
        try:
            payer_obj = await db.get(Payer, payer_id)
            if payer_obj:
                payer_name = payer_obj.payer_name
        except Exception:
            pass

        impact = float(total_amount or 0)
        severity = "critical" if abs(deviation_days or 0) > 10 else "warning"

        anomaly_label = (anomaly_type or "UNKNOWN").replace("_", " ").title()

        findings.append({
            "finding_id": _deterministic_finding_id("ADTP_ANOMALY", payer_id, anomaly_type),
            "title": f"{payer_name} ADTP anomaly: {anomaly_label}",
            "description": (
                f"{payer_name} shows {anomaly_label} with {abs(deviation_days or 0):.1f} days "
                f"deviation ({deviation_pct or 0:.1f}% off baseline). "
                f"Expected ADTP: {expected_adtp}d, Actual: {actual_adtp:.1f}d. "
                f"{payment_count} payments totaling ${impact:,.0f} affected."
            ),
            "severity": severity,
            "category": "PAYMENT_FLOW",
            "impact_amount": round(impact, 2),
            "affected_claims_count": payment_count or 0,
            "root_causes": ["PAYER_BEHAVIOR_SHIFT"],
            "recommended_actions": [
                f"Monitor {payer_name} payment cadence for continued deviation",
                "Verify EFT enrollment and banking details with payer",
                "Adjust cash flow forecast to account for delayed payments",
                "Contact payer if delay exceeds contractual payment terms",
            ],
            "confidence_score": min(int(abs(deviation_pct or 0) * 2), 95),
            "metadata": {
                "payer_id": payer_id,
                "payer_name": payer_name,
                "anomaly_type": anomaly_type,
                "deviation_days": float(deviation_days or 0),
                "deviation_pct": float(deviation_pct or 0),
                "expected_adtp": expected_adtp,
                "actual_adtp": float(actual_adtp or 0),
            },
        })

    return findings


# ── 4. Revenue Leakage Detection ─────────────────────────────────────────────

async def _detect_revenue_leakage(db: AsyncSession) -> list[dict]:
    """Detect ERA vs Bank variance > 5% for any payer."""
    findings = []

    rows = await db.execute(
        select(
            BankReconciliation.payer_id,
            BankReconciliation.payer_name,
            func.sum(BankReconciliation.era_received_amount).label("total_era"),
            func.sum(BankReconciliation.bank_deposit_amount).label("total_bank"),
            func.sum(BankReconciliation.era_bank_variance).label("total_variance"),
            func.count().label("recon_count"),
        )
        .group_by(BankReconciliation.payer_id, BankReconciliation.payer_name)
        .having(func.sum(BankReconciliation.era_received_amount) > 0)
    )

    for row in rows:
        payer_id, payer_name, total_era, total_bank, total_variance, recon_count = row
        total_era = float(total_era or 0)
        total_bank = float(total_bank or 0)
        total_variance = float(total_variance or 0)

        if total_era == 0:
            continue

        variance_pct = abs(total_variance) / total_era * 100

        if variance_pct <= 5.0:
            continue

        severity = "critical" if variance_pct > 10.0 else "warning"
        display_name = payer_name or payer_id

        findings.append({
            "finding_id": _deterministic_finding_id("REVENUE_LEAKAGE", payer_id),
            "title": f"{display_name} ERA-Bank variance {variance_pct:.1f}%",
            "description": (
                f"{display_name} shows {variance_pct:.1f}% variance between ERA payments "
                f"(${total_era:,.0f}) and bank deposits (${total_bank:,.0f}). "
                f"Net variance: ${abs(total_variance):,.0f} across {recon_count} reconciliation periods."
            ),
            "severity": severity,
            "category": "REVENUE_LEAKAGE",
            "impact_amount": round(abs(total_variance), 2),
            "affected_claims_count": recon_count,
            "root_causes": ["CONTRACT_RATE_GAP", "PAYER_BEHAVIOR_SHIFT"],
            "recommended_actions": [
                f"Investigate {display_name} ERA-to-bank deposit discrepancies",
                "Verify EFT trace numbers match bank transaction records",
                "Check for missing or duplicate ERA postings",
                "Reconcile individual payment batches to identify timing gaps",
            ],
            "confidence_score": min(int(variance_pct * 5), 95),
            "metadata": {
                "payer_id": payer_id,
                "payer_name": display_name,
                "total_era": round(total_era, 2),
                "total_bank": round(total_bank, 2),
                "total_variance": round(total_variance, 2),
                "variance_pct": round(variance_pct, 2),
                "recon_count": recon_count,
            },
        })

    return findings


# ── 5. AR Aging Detection ───────────────────────────────────────────────────

async def _detect_ar_aging(db: AsyncSession) -> list[dict]:
    """Detect claims stuck > 90 days without resolution."""
    findings = []

    cutoff = date.today() - timedelta(days=90)
    excluded_statuses = ["PAID", "DENIED", "WRITTEN_OFF", "VOIDED"]

    # Count and sum stuck claims
    stuck_count = await db.scalar(
        select(func.count(Claim.claim_id))
        .where(
            and_(
                Claim.submission_date <= cutoff,
                Claim.status.notin_(excluded_statuses),
                Claim.submission_date.isnot(None),
            )
        )
    ) or 0

    if stuck_count == 0:
        return findings

    stuck_amount = await db.scalar(
        select(func.sum(Claim.total_charges))
        .where(
            and_(
                Claim.submission_date <= cutoff,
                Claim.status.notin_(excluded_statuses),
                Claim.submission_date.isnot(None),
            )
        )
    ) or 0

    # Breakdown by status
    status_rows = await db.execute(
        select(
            Claim.status,
            func.count().label("cnt"),
            func.sum(Claim.total_charges).label("amount"),
        )
        .where(
            and_(
                Claim.submission_date <= cutoff,
                Claim.status.notin_(excluded_statuses),
                Claim.submission_date.isnot(None),
            )
        )
        .group_by(Claim.status)
        .order_by(desc("amount"))
    )
    status_breakdown = [
        {"status": r[0], "count": r[1], "amount": round(float(r[2] or 0), 2)}
        for r in status_rows
    ]

    # Breakdown by top payers
    payer_rows = await db.execute(
        select(
            Claim.payer_id,
            func.count().label("cnt"),
            func.sum(Claim.total_charges).label("amount"),
        )
        .where(
            and_(
                Claim.submission_date <= cutoff,
                Claim.status.notin_(excluded_statuses),
                Claim.submission_date.isnot(None),
            )
        )
        .group_by(Claim.payer_id)
        .order_by(desc("amount"))
        .limit(5)
    )
    top_payers = []
    for r in payer_rows:
        payer_name = r[0]
        try:
            payer_obj = await db.get(Payer, r[0])
            if payer_obj:
                payer_name = payer_obj.payer_name
        except Exception:
            pass
        top_payers.append({
            "payer_id": r[0],
            "payer_name": payer_name,
            "count": r[1],
            "amount": round(float(r[2] or 0), 2),
        })

    stuck_amount_f = float(stuck_amount)
    severity = "critical" if stuck_count > 500 or stuck_amount_f > 1_000_000 else "warning"

    findings.append({
        "finding_id": _deterministic_finding_id("AR_AGING", "stuck_90d"),
        "title": f"{stuck_count:,} claims stuck over 90 days",
        "description": (
            f"{stuck_count:,} claims totaling ${stuck_amount_f:,.0f} have been submitted "
            f"more than 90 days ago and remain unresolved. "
            f"Top status: {status_breakdown[0]['status'] if status_breakdown else 'Unknown'}."
        ),
        "severity": severity,
        "category": "AR_AGING",
        "impact_amount": round(stuck_amount_f, 2),
        "affected_claims_count": stuck_count,
        "root_causes": ["PROCESS_BREAKDOWN", "PAYER_BEHAVIOR_SHIFT"],
        "recommended_actions": [
            "Prioritize follow-up on claims approaching 120-day mark",
            "Assign dedicated staff to work aged claim queue",
            "Contact payers for status on SUBMITTED claims > 90 days",
            "Review ACKNOWLEDGED claims for missing responses or EOBs",
            "Escalate high-dollar stuck claims to management",
        ],
        "confidence_score": 85,
        "metadata": {
            "cutoff_date": str(cutoff),
            "status_breakdown": status_breakdown,
            "top_payers": top_payers,
        },
    })

    return findings


# ── Payer-specific Diagnostics ───────────────────────────────────────────────

async def generate_payer_diagnostic(db: AsyncSession, payer_id: str) -> dict:
    """Diagnostic findings for a specific payer."""
    try:
        payer = await db.get(Payer, payer_id)
        payer_name = payer.payer_name if payer else payer_id

        findings = []

        # Denial pattern for this payer
        rca_rows = await db.execute(
            select(
                RootCauseAnalysis.primary_root_cause,
                func.count().label("cnt"),
                func.sum(RootCauseAnalysis.financial_impact).label("total_impact"),
            )
            .where(RootCauseAnalysis.payer_id == payer_id)
            .group_by(RootCauseAnalysis.primary_root_cause)
            .order_by(desc("total_impact"))
        )
        for row in rca_rows:
            root_cause, count, impact = row
            impact = float(impact or 0)
            if count < 10:
                continue
            findings.append({
                "finding_id": _gen_finding_id(),
                "title": f"{root_cause.replace('_', ' ').title()} pattern",
                "description": f"{count:,} denials (${impact:,.0f}) for {payer_name}",
                "severity": "critical" if count > 100 and impact > 500_000 else "warning" if count > 50 else "info",
                "category": "DENIAL_PATTERN",
                "impact_amount": round(impact, 2),
                "affected_claims_count": count,
                "root_causes": [root_cause],
                "recommended_actions": _get_denial_actions(root_cause),
                "confidence_score": 80,
            })

        # ADTP anomalies for this payer
        adtp_rows = await db.execute(
            select(ADTPTrend)
            .where(and_(ADTPTrend.payer_id == payer_id, ADTPTrend.is_anomaly == True))
            .order_by(desc(ADTPTrend.total_amount))
            .limit(5)
        )
        for trend in adtp_rows.scalars():
            findings.append({
                "finding_id": _gen_finding_id(),
                "title": f"ADTP anomaly: {(trend.anomaly_type or 'UNKNOWN').replace('_', ' ').title()}",
                "description": (
                    f"{abs(trend.deviation_days):.1f} days deviation. "
                    f"Expected: {trend.expected_adtp_days}d, Actual: {trend.actual_adtp_days:.1f}d."
                ),
                "severity": "warning",
                "category": "PAYMENT_FLOW",
                "impact_amount": round(float(trend.total_amount or 0), 2),
                "affected_claims_count": trend.payment_count or 0,
                "root_causes": ["PAYER_BEHAVIOR_SHIFT"],
                "recommended_actions": [
                    "Monitor payment cadence for continued deviation",
                    "Verify EFT enrollment with payer",
                ],
                "confidence_score": 70,
            })

        # ERA-Bank variance for this payer
        recon_rows = await db.execute(
            select(
                func.sum(BankReconciliation.era_received_amount).label("total_era"),
                func.sum(BankReconciliation.bank_deposit_amount).label("total_bank"),
                func.sum(BankReconciliation.era_bank_variance).label("total_variance"),
            )
            .where(BankReconciliation.payer_id == payer_id)
        )
        recon = recon_rows.first()
        if recon and recon[0] and float(recon[0]) > 0:
            total_era = float(recon[0])
            total_variance = float(recon[2] or 0)
            variance_pct = abs(total_variance) / total_era * 100
            if variance_pct > 5.0:
                findings.append({
                    "finding_id": _gen_finding_id(),
                    "title": f"ERA-Bank variance {variance_pct:.1f}%",
                    "description": f"${abs(total_variance):,.0f} discrepancy between ERA and bank deposits.",
                    "severity": "critical" if variance_pct > 10.0 else "warning",
                    "category": "REVENUE_LEAKAGE",
                    "impact_amount": round(abs(total_variance), 2),
                    "affected_claims_count": 0,
                    "root_causes": ["CONTRACT_RATE_GAP"],
                    "recommended_actions": [
                        "Reconcile individual ERA batches against bank statements",
                        "Verify EFT trace numbers",
                    ],
                    "confidence_score": 75,
                })

        findings.sort(key=lambda f: f.get("impact_amount", 0), reverse=True)

        return {
            "payer_id": payer_id,
            "payer_name": payer_name,
            "generated_at": str(date.today()),
            "total_findings": len(findings),
            "findings": findings,
        }

    except Exception as e:
        logger.error(f"Payer diagnostic failed for {payer_id}: {e}")
        return {
            "payer_id": payer_id,
            "payer_name": payer_id,
            "generated_at": str(date.today()),
            "total_findings": 0,
            "findings": [],
            "error": str(e),
        }


# ── Claim-specific Diagnostics ──────────────────────────────────────────────

async def generate_claim_diagnostic(db: AsyncSession, claim_id: str) -> dict:
    """Diagnostic findings for a specific claim."""
    try:
        claim = await db.get(Claim, claim_id)
        if not claim:
            return {"claim_id": claim_id, "findings": [], "error": "Claim not found"}

        findings = []

        # Check if claim has root cause analysis
        rca_result = await db.execute(
            select(RootCauseAnalysis)
            .where(RootCauseAnalysis.claim_id == claim_id)
            .order_by(desc(RootCauseAnalysis.created_at))
            .limit(1)
        )
        rca = rca_result.scalars().first()

        if rca:
            findings.append({
                "finding_id": _gen_finding_id(),
                "title": f"Root cause: {rca.primary_root_cause.replace('_', ' ').title()}",
                "description": (
                    f"Bayesian analysis identified {rca.primary_root_cause} as primary cause "
                    f"(confidence: {rca.confidence_score}%). "
                    f"Financial impact: ${rca.financial_impact or 0:,.0f}. "
                    f"Resolution: {rca.resolution_path}"
                ),
                "severity": "warning",
                "category": "DENIAL_PATTERN",
                "impact_amount": round(float(rca.financial_impact or 0), 2),
                "affected_claims_count": 1,
                "root_causes": [rca.primary_root_cause, rca.secondary_root_cause] if rca.secondary_root_cause else [rca.primary_root_cause],
                "recommended_actions": _get_denial_actions(rca.primary_root_cause),
                "confidence_score": rca.confidence_score or 0,
            })

        # Check if claim is stuck (aging)
        if claim.submission_date and claim.status not in ["PAID", "DENIED", "WRITTEN_OFF", "VOIDED"]:
            days_aged = (date.today() - claim.submission_date).days
            if days_aged > 90:
                findings.append({
                    "finding_id": _gen_finding_id(),
                    "title": f"Claim aging: {days_aged} days",
                    "description": (
                        f"This claim has been in '{claim.status}' status for {days_aged} days. "
                        f"Charged amount: ${claim.total_charges:,.0f}."
                    ),
                    "severity": "critical" if days_aged > 120 else "warning",
                    "category": "AR_AGING",
                    "impact_amount": round(float(claim.total_charges or 0), 2),
                    "affected_claims_count": 1,
                    "root_causes": ["PROCESS_BREAKDOWN"],
                    "recommended_actions": [
                        "Contact payer for claim status update",
                        "Verify claim was received and acknowledged",
                        "Check for missing documentation requests",
                    ],
                    "confidence_score": 90,
                })

        findings.sort(key=lambda f: f.get("impact_amount", 0), reverse=True)

        payer_name = claim.payer_id
        try:
            payer_obj = await db.get(Payer, claim.payer_id)
            if payer_obj:
                payer_name = payer_obj.payer_name
        except Exception:
            pass

        return {
            "claim_id": claim_id,
            "payer_id": claim.payer_id,
            "payer_name": payer_name,
            "status": claim.status,
            "total_charges": float(claim.total_charges or 0),
            "generated_at": str(date.today()),
            "total_findings": len(findings),
            "findings": findings,
        }

    except Exception as e:
        logger.error(f"Claim diagnostic failed for {claim_id}: {e}")
        return {"claim_id": claim_id, "findings": [], "error": str(e)}


# ── Diagnostic Summary (dashboard) ──────────────────────────────────────────

async def get_diagnostic_summary(db: AsyncSession) -> dict:
    """Summary dashboard: total findings, by severity, by category, trend."""
    try:
        diag = await generate_system_diagnostics(db)
        findings = diag.get("findings", [])

        # By category
        by_category = {}
        for f in findings:
            cat = f.get("category", "UNKNOWN")
            if cat not in by_category:
                by_category[cat] = {"count": 0, "impact": 0}
            by_category[cat]["count"] += 1
            by_category[cat]["impact"] += f.get("impact_amount", 0)

        category_summary = [
            {"category": k, "count": v["count"], "impact": round(v["impact"], 2)}
            for k, v in sorted(by_category.items(), key=lambda x: x[1]["impact"], reverse=True)
        ]

        # Top 5 findings preview
        top_findings = [
            {
                "finding_id": f["finding_id"],
                "title": f["title"],
                "severity": f["severity"],
                "category": f["category"],
                "impact_amount": f["impact_amount"],
            }
            for f in findings[:5]
        ]

        return {
            "generated_at": diag["generated_at"],
            "total_findings": diag["total_findings"],
            "critical_count": diag["critical_count"],
            "warning_count": diag["warning_count"],
            "info_count": diag["info_count"],
            "total_impact": diag["total_impact"],
            "by_category": category_summary,
            "top_findings": top_findings,
        }

    except Exception as e:
        logger.error(f"Diagnostic summary failed: {e}")
        return {
            "generated_at": str(date.today()),
            "total_findings": 0,
            "critical_count": 0,
            "warning_count": 0,
            "info_count": 0,
            "total_impact": 0,
            "by_category": [],
            "top_findings": [],
        }
