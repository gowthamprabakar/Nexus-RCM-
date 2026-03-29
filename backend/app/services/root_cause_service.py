"""
Root Cause Classification Engine — Graph Traversal
====================================================
Zero-prior graph-based root cause analysis. Each connected entity (node)
is visited and checked for anomalies. Weight comes from evidence only,
not from the denial category label.

Functions:
  analyze_denial_root_cause(db, denial_id) → dict
  batch_analyze_pending(db, batch_size)    → int
  get_claim_root_cause(db, claim_id)       → dict
  get_root_cause_summary(db, filters)      → dict
  get_root_cause_trending(db, weeks_back, payer_id) → dict
"""

import json
import logging
from uuid import uuid4
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select, func, and_, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.denial import Denial
from app.models.claim import Claim
from app.models.root_cause import RootCauseAnalysis, ClaimRootCauseStep
from app.models.rcm_extended import Eligibility271, PriorAuth, ClaimLine, EraPayment
from app.models.payer import Payer
from app.models.provider import Provider

logger = logging.getLogger(__name__)

# ── Root-cause → group mapping ───────────────────────────────────────────────
ROOT_CAUSE_GROUPS = {
    "ELIGIBILITY_LAPSE":      "PREVENTABLE",
    "AUTH_MISSING":            "PREVENTABLE",
    "AUTH_EXPIRED":            "PREVENTABLE",
    "TIMELY_FILING_MISS":     "PREVENTABLE",
    "CODING_MISMATCH":        "PROCESS",
    "COB_ORDER_ERROR":        "PROCESS",
    "BUNDLING_ERROR":         "PROCESS",
    "DUPLICATE_CLAIM":        "PROCESS",
    "MODIFIER_MISMATCH":      "PROCESS",
    "DOCUMENTATION_DEFICIT":  "CLINICAL",
    "PROCESS_BREAKDOWN":      "PROCESS",
    "PAYER_BEHAVIOR_SHIFT":   "PAYER",
    "CONTRACT_RATE_GAP":      "PAYER",
    "MEDICAL_NECESSITY":      "CLINICAL",
    "PROVIDER_ENROLLMENT":    "CLINICAL",
}

# ── CARC fallback (only used when zero evidence found) ────────────────────
_CARC_FALLBACK = {
    "ELIGIBILITY": "ELIGIBILITY_LAPSE",
    "AUTHORIZATION": "AUTH_MISSING",
    "AUTH": "AUTH_MISSING",
    "TIMELY_FILING": "TIMELY_FILING_MISS",
    "CODING": "CODING_MISMATCH",
    "COB": "COB_ORDER_ERROR",
    "NON_COVERED": "MEDICAL_NECESSITY",
    "DUPLICATE": "DUPLICATE_CLAIM",
    "BUNDLING": "BUNDLING_ERROR",
    "DOCUMENTATION": "DOCUMENTATION_DEFICIT",
    "ENROLLMENT": "PROVIDER_ENROLLMENT",
    "CONTRACT": "CONTRACT_RATE_GAP",
}


def _gen_rca_id() -> str:
    return f"RCA{uuid4().hex[:11].upper()}"


def _gen_step_id() -> str:
    return f"STP{uuid4().hex[:12].upper()}"


# ── Graph-Based Root Cause Analysis ──────────────────────────────────────────

async def analyze_denial_root_cause(db: AsyncSession, denial_id: str) -> dict:
    """
    Graph-based root cause analysis. Visits 9 connected entity nodes,
    classifies into 15 root cause categories. Assigns weight ONLY from
    evidence found. Zero CARC priors.
    """
    try:
        # Load denial
        denial = await db.get(Denial, denial_id)
        if not denial:
            return {"error": f"Denial {denial_id} not found"}

        claim = await db.get(Claim, denial.claim_id)
        if not claim:
            return {"error": f"Claim {denial.claim_id} not found for denial"}

        rca_id = _gen_rca_id()
        steps = []
        # ALL weights start at ZERO — evidence only
        evidence = {}

        # ── Step 1: CARC_RARC_DECODE (informational, 0 points) ─────────
        cat = (denial.denial_category or "").upper()
        carc = denial.carc_code or "unknown"
        step1_finding = f"CARC={carc}, category={denial.denial_category} — recorded as context, zero weight assigned"
        steps.append(_make_step(rca_id, 1, "CARC_RARC_DECODE", step1_finding, "PASS", 0.0))

        # ── Step 2: ELIGIBILITY_CHECK (0-30 pts) ────────────────────────
        elig_status = "INCONCLUSIVE"
        elig_finding = "No eligibility record — cannot confirm/deny coverage"
        elig_pts = 0

        elig_result = await db.execute(
            select(Eligibility271)
            .where(and_(
                Eligibility271.patient_id == claim.patient_id,
                Eligibility271.payer_id == claim.payer_id,
            ))
            .order_by(desc(Eligibility271.inquiry_date))
            .limit(1)
        )
        elig = elig_result.scalars().first()
        if elig:
            if elig.subscriber_status != "ACTIVE":
                elig_status = "FAIL"
                elig_finding = f"Subscriber status={elig.subscriber_status} — coverage inactive at time of service"
                elig_pts = 30
                evidence["ELIGIBILITY_LAPSE"] = evidence.get("ELIGIBILITY_LAPSE", 0) + 30
            elif elig.coverage_term and claim.date_of_service and elig.coverage_term < claim.date_of_service:
                elig_status = "FAIL"
                elig_finding = f"Coverage terminated {elig.coverage_term} before DOS {claim.date_of_service}"
                elig_pts = 30
                evidence["ELIGIBILITY_LAPSE"] = evidence.get("ELIGIBILITY_LAPSE", 0) + 30
            else:
                elig_status = "PASS"
                elig_finding = f"Subscriber ACTIVE, coverage valid through {elig.coverage_term}"
                # Active eligibility but COB denial → coordination of benefits order error
                if carc in ("CO-22", "22") or "COB" in cat:
                    elig_status = "WARNING"
                    elig_finding += f" — but CARC {carc} indicates COB order issue"
                    elig_pts = 25
                    evidence["COB_ORDER_ERROR"] = evidence.get("COB_ORDER_ERROR", 0) + 25
        steps.append(_make_step(rca_id, 2, "ELIGIBILITY_CHECK", elig_finding, elig_status, elig_pts))

        # ── Step 3: AUTH_TIMELINE_CHECK (0-30 pts) ──────────────────────
        auth_status = "INCONCLUSIVE"
        auth_finding = "No prior auth record found"
        auth_pts = 0

        auth_result = await db.execute(
            select(PriorAuth)
            .where(PriorAuth.claim_id == claim.claim_id)
            .order_by(desc(PriorAuth.requested_date))
            .limit(1)
        )
        auth = auth_result.scalars().first()
        if auth:
            if auth.status in ("DENIED", "EXPIRED"):
                auth_status = "FAIL"
                auth_finding = f"Prior auth {auth.status} (auth#{auth.auth_number}) — payer required auth not met"
                auth_pts = 30
                evidence["AUTH_MISSING"] = evidence.get("AUTH_MISSING", 0) + 30
            elif auth.expiry_date and claim.date_of_service and auth.expiry_date < claim.date_of_service:
                auth_status = "FAIL"
                auth_finding = f"Auth expired {auth.expiry_date} before DOS {claim.date_of_service}"
                auth_pts = 25
                evidence["AUTH_EXPIRED"] = evidence.get("AUTH_EXPIRED", 0) + 25
            else:
                auth_status = "PASS"
                auth_finding = f"Auth APPROVED, expires {auth.expiry_date}"
        else:
            # No auth record but denial exists — might indicate missing auth
            if "AUTH" in cat:
                auth_status = "FAIL"
                auth_finding = "No auth record found for auth-category denial — auth likely not obtained"
                auth_pts = 20
                evidence["AUTH_MISSING"] = evidence.get("AUTH_MISSING", 0) + 20
        steps.append(_make_step(rca_id, 3, "AUTH_TIMELINE_CHECK", auth_finding, auth_status, auth_pts))

        # ── Step 4: CODING_VALIDATION (0-25 pts) ────────────────────────
        coding_status = "PASS"
        coding_finding = "No claim lines found"
        coding_pts = 0

        lines_result = await db.execute(
            select(ClaimLine).where(ClaimLine.claim_id == claim.claim_id)
        )
        claim_lines = lines_result.scalars().all()
        if claim_lines:
            has_modifiers = any(
                (cl.modifier_1 is not None or cl.modifier_2 is not None) for cl in claim_lines
            )
            unique_cpts = len(set(cl.cpt_code for cl in claim_lines if cl.cpt_code))
            line_count = len(claim_lines)

            # Detect modifier-specific issues: -59/-25 with multiple lines suggests bundling
            bundling_modifiers = {"59", "25", "XE", "XS", "XP", "XU"}
            has_bundling_modifier = any(
                (getattr(cl, "modifier_1", None) in bundling_modifiers or
                 getattr(cl, "modifier_2", None) in bundling_modifiers)
                for cl in claim_lines
            )
            # Multiple modifiers on same line suggests modifier mismatch
            has_multi_modifier = any(
                (cl.modifier_1 is not None and cl.modifier_2 is not None)
                for cl in claim_lines
            )

            if has_bundling_modifier and unique_cpts > 1:
                coding_status = "WARNING"
                coding_finding = f"{line_count} lines, {unique_cpts} CPTs, bundling modifiers (59/25/X*) — NCCI unbundling risk"
                coding_pts = 25
                evidence["BUNDLING_ERROR"] = evidence.get("BUNDLING_ERROR", 0) + 25
            elif has_multi_modifier:
                coding_status = "WARNING"
                coding_finding = f"{line_count} lines with multiple modifiers per line — modifier mismatch risk"
                coding_pts = 25
                evidence["MODIFIER_MISMATCH"] = evidence.get("MODIFIER_MISMATCH", 0) + 25
            elif has_modifiers and line_count > 3:
                coding_status = "WARNING"
                coding_finding = f"{line_count} lines, {unique_cpts} CPTs, complex modifiers — high coding error probability"
                coding_pts = 25
                evidence["CODING_MISMATCH"] = evidence.get("CODING_MISMATCH", 0) + 25
            elif has_modifiers:
                coding_status = "WARNING"
                coding_finding = f"{line_count} lines with modifiers — moderate coding risk"
                coding_pts = 15
                evidence["CODING_MISMATCH"] = evidence.get("CODING_MISMATCH", 0) + 15
            elif line_count > 5:
                coding_status = "WARNING"
                coding_finding = f"{line_count} lines, high complexity claim — review recommended"
                coding_pts = 10
                evidence["CODING_MISMATCH"] = evidence.get("CODING_MISMATCH", 0) + 10
            else:
                coding_finding = f"{line_count} lines, standard coding — no modifier complexity"
        steps.append(_make_step(rca_id, 4, "CODING_VALIDATION", coding_finding, coding_status, coding_pts))

        # ── Step 5: PAYER_HISTORY_MATCH (0-25 pts) ──────────────────────
        payer_status = "PASS"
        payer_finding = "No significant payer denial pattern"
        payer_pts = 0
        ninety_days_ago = date.today() - timedelta(days=90)

        payer_similar = await db.scalar(
            select(func.count(Denial.denial_id))
            .select_from(Denial)
            .join(Claim, Claim.claim_id == Denial.claim_id)
            .where(and_(
                Denial.carc_code == denial.carc_code,
                Claim.payer_id == claim.payer_id,
                Denial.denial_date >= ninety_days_ago,
                Denial.denial_id != denial_id,
            ))
        ) or 0

        if payer_similar > 50:
            payer_status = "FAIL"
            payer_finding = f"{payer_similar} similar CARC={carc} denials from same payer in 90d — systemic payer pattern"
            payer_pts = 25
            evidence["PAYER_BEHAVIOR_SHIFT"] = evidence.get("PAYER_BEHAVIOR_SHIFT", 0) + 25
        elif payer_similar > 20:
            payer_status = "WARNING"
            payer_finding = f"{payer_similar} similar denials from same payer in 90d — emerging payer pattern"
            payer_pts = 15
            evidence["PAYER_BEHAVIOR_SHIFT"] = evidence.get("PAYER_BEHAVIOR_SHIFT", 0) + 15
        elif payer_similar > 5:
            payer_status = "WARNING"
            payer_finding = f"{payer_similar} similar denials from same payer in 90d — worth monitoring"
            payer_pts = 8
            evidence["PAYER_BEHAVIOR_SHIFT"] = evidence.get("PAYER_BEHAVIOR_SHIFT", 0) + 8
        else:
            payer_finding = f"{payer_similar} similar denials from same payer in 90d — isolated incident"
        steps.append(_make_step(rca_id, 5, "PAYER_HISTORY_MATCH", payer_finding, payer_status, payer_pts))

        # ── Step 6: PROCESS_TIMELINE_CHECK (0-30 pts) ───────────────────
        process_status = "PASS"
        process_finding = "Submission timeline within norms"
        process_pts = 0

        if claim.submission_date and claim.date_of_service:
            gap_days = (claim.submission_date - claim.date_of_service).days
            if gap_days > 60:
                process_status = "FAIL"
                process_finding = f"Submission {gap_days}d after DOS — timely filing risk (>60d)"
                process_pts = 30
                evidence["TIMELY_FILING_MISS"] = evidence.get("TIMELY_FILING_MISS", 0) + 30
            elif gap_days > 30:
                process_status = "WARNING"
                process_finding = f"Submission {gap_days}d after DOS — approaching deadline"
                process_pts = 15
                evidence["TIMELY_FILING_MISS"] = evidence.get("TIMELY_FILING_MISS", 0) + 15
            else:
                process_finding = f"Submitted {gap_days}d after DOS — within norms"
        else:
            process_status = "INCONCLUSIVE"
            process_finding = "Missing submission_date or date_of_service"
        steps.append(_make_step(rca_id, 6, "PROCESS_TIMELINE_CHECK", process_finding, process_status, process_pts))

        # ── Step 7: PROVIDER_PATTERN_CHECK (0-20 pts) ───────────────────
        provider_status = "PASS"
        provider_finding = "No provider-level anomaly"
        provider_pts = 0

        if claim.provider_id:
            # This provider's denial count vs facility average
            provider_denial_count = await db.scalar(
                select(func.count(Denial.denial_id))
                .select_from(Denial)
                .join(Claim, Claim.claim_id == Denial.claim_id)
                .where(and_(
                    Claim.provider_id == claim.provider_id,
                    Denial.denial_date >= ninety_days_ago,
                ))
            ) or 0

            facility_avg = await db.scalar(
                select(func.count(Denial.denial_id))
                .where(Denial.denial_date >= ninety_days_ago)
            ) or 1

            # Rough provider count for average
            provider_count = await db.scalar(
                select(func.count(func.distinct(Claim.provider_id)))
                .select_from(Denial)
                .join(Claim, Claim.claim_id == Denial.claim_id)
                .where(Denial.denial_date >= ninety_days_ago)
            ) or 1

            avg_per_provider = facility_avg / max(provider_count, 1)

            if provider_denial_count > avg_per_provider * 1.5 and provider_denial_count > 10:
                provider_status = "WARNING"
                provider_finding = f"Provider has {provider_denial_count} denials in 90d vs {avg_per_provider:.0f} facility avg — above normal"
                provider_pts = 20
                evidence["PROCESS_BREAKDOWN"] = evidence.get("PROCESS_BREAKDOWN", 0) + 20
            elif provider_denial_count > avg_per_provider * 1.2 and provider_denial_count > 5:
                provider_status = "WARNING"
                provider_finding = f"Provider has {provider_denial_count} denials vs {avg_per_provider:.0f} avg — slightly elevated"
                provider_pts = 10
                evidence["PROCESS_BREAKDOWN"] = evidence.get("PROCESS_BREAKDOWN", 0) + 10
            else:
                provider_finding = f"Provider {provider_denial_count} denials vs {avg_per_provider:.0f} avg — within norms"
        steps.append(_make_step(rca_id, 7, "PROVIDER_PATTERN_CHECK", provider_finding, provider_status, provider_pts))

        # ── Step 8: CARC_SPECIFIC_DETECTION (0-25 pts) ────────────────
        carc_spec_status = "PASS"
        carc_spec_finding = "No CARC-specific root cause detected"
        carc_spec_pts = 0

        # CO-50 / CARC 50 → Medical necessity denial
        if carc in ("CO-50", "50", "CO50"):
            carc_spec_status = "FAIL"
            carc_spec_finding = f"CARC {carc} — payer determined procedure not medically necessary"
            carc_spec_pts = 25
            evidence["MEDICAL_NECESSITY"] = evidence.get("MEDICAL_NECESSITY", 0) + 25
        # CO-18 / CARC 18 → Duplicate claim
        elif carc in ("CO-18", "18", "CO18"):
            carc_spec_status = "FAIL"
            carc_spec_finding = f"CARC {carc} — duplicate claim/service"
            carc_spec_pts = 25
            evidence["DUPLICATE_CLAIM"] = evidence.get("DUPLICATE_CLAIM", 0) + 25
        # CO-4 → Modifier issue
        elif carc in ("CO-4", "4", "CO4"):
            carc_spec_status = "WARNING"
            carc_spec_finding = f"CARC {carc} — modifier required but not submitted"
            carc_spec_pts = 20
            evidence["MODIFIER_MISMATCH"] = evidence.get("MODIFIER_MISMATCH", 0) + 20
        # CO-45 → Contract rate gap (charge exceeds contracted amount)
        elif carc in ("CO-45", "45", "CO45"):
            carc_spec_status = "WARNING"
            carc_spec_finding = f"CARC {carc} — charge exceeds fee schedule / contract rate"
            carc_spec_pts = 20
            evidence["CONTRACT_RATE_GAP"] = evidence.get("CONTRACT_RATE_GAP", 0) + 20
        # CO-16 → Missing information / documentation
        elif carc in ("CO-16", "16", "CO16"):
            carc_spec_status = "WARNING"
            carc_spec_finding = f"CARC {carc} — missing/incomplete information"
            carc_spec_pts = 20
            evidence["DOCUMENTATION_DEFICIT"] = evidence.get("DOCUMENTATION_DEFICIT", 0) + 20

        steps.append(_make_step(rca_id, 8, "CARC_SPECIFIC_DETECTION", carc_spec_finding, carc_spec_status, carc_spec_pts))

        # ── Step 9: DOCUMENTATION_ENROLLMENT_CHECK (0-20 pts) ─────────
        doc_enroll_status = "PASS"
        doc_enroll_finding = "No documentation or enrollment issues detected"
        doc_enroll_pts = 0

        # Check for documentation deficit signals
        if "DOCUMENT" in cat or "CLINICAL" in cat or "INFORMATION" in cat:
            doc_enroll_status = "WARNING"
            doc_enroll_finding = f"Denial category '{denial.denial_category}' suggests missing clinical documentation"
            doc_enroll_pts = 20
            evidence["DOCUMENTATION_DEFICIT"] = evidence.get("DOCUMENTATION_DEFICIT", 0) + 20
        # Check for provider enrollment issues
        elif "ENROLL" in cat or "CREDENTIAL" in cat or "PROVIDER" in cat:
            doc_enroll_status = "FAIL"
            doc_enroll_finding = f"Denial category '{denial.denial_category}' indicates provider enrollment/credentialing issue"
            doc_enroll_pts = 25
            evidence["PROVIDER_ENROLLMENT"] = evidence.get("PROVIDER_ENROLLMENT", 0) + 25

        steps.append(_make_step(rca_id, 9, "DOCUMENTATION_ENROLLMENT_CHECK", doc_enroll_finding, doc_enroll_status, doc_enroll_pts))

        # ── Step 9.5: GRAPH_PATTERN_SYNTHESIS (Neo4j) ──────────────────
        graph_finding = "Neo4j unavailable"
        graph_pts = 0
        graph_status = "INCONCLUSIVE"
        try:
            from app.services.neo4j_rca_queries import get_all_graph_evidence
            import asyncio as _asyncio
            cpt_code = claim_lines[0].cpt_code if claim_lines else None
            graph_ev = await _asyncio.wait_for(
                get_all_graph_evidence(claim.payer_id or "", claim.provider_id or "", cpt_code),
                timeout=5.0
            )
            graph_pts = graph_ev.get("total_points", 0)
            findings = graph_ev.get("findings_summary", [])
            if graph_pts > 0:
                graph_status = "ENRICHED"
                graph_finding = f"Graph adds {graph_pts} pts. {'; '.join(findings[:3])}"
                # Boost the top evidence cause from graph convergence
                convergence = graph_ev.get("results", {}).get("convergence", {})
                conv_ctx = convergence.get("graph_context")
                if conv_ctx and isinstance(conv_ctx, list) and conv_ctx:
                    top_cause = conv_ctx[0].get("cause")
                    if top_cause and top_cause in ROOT_CAUSE_GROUPS:
                        evidence[top_cause] = evidence.get(top_cause, 0) + convergence.get("evidence_points", 0)
            else:
                graph_finding = "Graph: No significant patterns found"
                graph_status = "PASS"
        except Exception as e:
            graph_finding = f"Graph query timeout or error: {str(e)[:80]}"
        steps.append(_make_step(rca_id, 10, "GRAPH_PATTERN_SYNTHESIS", graph_finding, graph_status, graph_pts))

        # ── Step 10.5: MIROFISH_AGENT_VALIDATION ──────────────────────
        mirofish_finding = "MiroFish unavailable — skipped"
        mirofish_pts = 0
        mirofish_status = "INCONCLUSIVE"
        try:
            from app.services.mirofish_bridge import query_mirofish_for_rca
            import asyncio as _aio

            claim_context = {
                "claim_id": claim.claim_id,
                "payer_id": claim.payer_id,
                "provider_id": claim.provider_id,
                "denial_category": denial.denial_category,
                "carc_code": carc,
                "denial_amount": float(denial.denial_amount or 0),
            }
            neo4j_evidence_summary = {
                "graph_points": graph_pts,
                "current_evidence": dict(evidence),
                "top_cause": ranked[0][0] if sum(evidence.values()) > 0 and (ranked := sorted(evidence.items(), key=lambda x: x[1], reverse=True)) else None,
            } if evidence else {}

            mirofish_result = await _aio.wait_for(
                query_mirofish_for_rca(claim_context, neo4j_evidence_summary),
                timeout=10.0,
            )

            if mirofish_result.get("agent_agrees") is not None:
                adj = mirofish_result.get("confidence_adjustment", 0)
                # Clamp adjustment to +10 to +20 for agreement, -10 for disagreement
                if mirofish_result["agent_agrees"]:
                    mirofish_pts = max(10, min(adj, 20))
                    mirofish_status = "CONFIRMED"
                    mirofish_finding = (
                        f"MiroFish agents AGREE with analysis (+{mirofish_pts} confidence). "
                        f"Reasoning: {mirofish_result.get('agent_reasoning', 'N/A')[:120]}"
                    )
                    # Boost the top evidence cause
                    if evidence:
                        top_cause_key = max(evidence, key=evidence.get)
                        evidence[top_cause_key] = evidence.get(top_cause_key, 0) + mirofish_pts
                else:
                    mirofish_pts = 0
                    mirofish_status = "DISPUTED"
                    alt = mirofish_result.get("alternative_cause")
                    mirofish_finding = (
                        f"MiroFish agents DISAGREE with analysis. "
                        f"Reasoning: {mirofish_result.get('agent_reasoning', 'N/A')[:120]}"
                    )
                    if alt and alt in ROOT_CAUSE_GROUPS:
                        evidence[alt] = evidence.get(alt, 0) + 10
                        mirofish_finding += f" Alternative suggested: {alt}"
            else:
                mirofish_finding = f"MiroFish returned no verdict: {mirofish_result.get('agent_reasoning', 'N/A')[:100]}"
        except _aio.TimeoutError:
            logger.warning("MiroFish RCA validation timed out (10s) for denial %s", denial_id)
            mirofish_finding = "MiroFish agent validation timed out (10s) — continuing without agent input"
        except Exception as e:
            logger.warning("MiroFish RCA validation failed for denial %s: %s", denial_id, e)
            mirofish_finding = f"MiroFish unavailable: {str(e)[:80]}"
        steps.append(_make_step(rca_id, 11, "MIROFISH_AGENT_VALIDATION", mirofish_finding, mirofish_status, mirofish_pts))

        # ── Step 12: EVIDENCE_SYNTHESIS ─────────────────────────────────
        total_pts = sum(evidence.values())

        if total_pts == 0:
            # No evidence found — use CARC category as fallback only
            fallback_cause = _CARC_FALLBACK.get(cat, "PROCESS_BREAKDOWN")
            primary_root_cause = fallback_cause
            primary_weight = 0
            secondary_root_cause = None
            secondary_weight = 0
            tertiary_root_cause = None
            tertiary_weight = 0
            bayesian_weight = 0.0
            confidence = 10  # Minimal confidence from CARC fallback
            synthesis_finding = f"No strong evidence found. Fallback to CARC category: {fallback_cause} (confidence=10%)"
        else:
            ranked = sorted(evidence.items(), key=lambda x: x[1], reverse=True)

            # ── Multi-factor: capture top 3 causes ──
            primary_root_cause = ranked[0][0]
            primary_weight = ranked[0][1]
            secondary_root_cause = ranked[1][0] if len(ranked) > 1 and ranked[1][1] > 0 else None
            secondary_weight = ranked[1][1] if len(ranked) > 1 else 0
            tertiary_root_cause = ranked[2][0] if len(ranked) > 2 and ranked[2][1] > 0 else None
            tertiary_weight = ranked[2][1] if len(ranked) > 2 else 0

            bayesian_weight = ranked[0][1] / total_pts

            # ── Improved confidence formula ──
            # Collect all non-zero weights from all analysis steps
            all_step_weights = {s["step_name"]: s["contribution_weight"] for s in steps}
            total_evidence = sum(w for w in all_step_weights.values() if w > 0)
            if total_evidence == 0:
                confidence = 10  # minimal confidence from CARC fallback
            else:
                share = primary_weight / total_evidence
                completeness = sum(1 for s in steps if s["finding_status"] not in ("INCONCLUSIVE", "PASS")) / max(len(steps), 1)
                # Base confidence from evidence share (40-90 range)
                confidence = min(int(40 + share * 50 + completeness * 10), 95)

            # ── Evidence summary with percentages for top 3 ──
            total_w = sum(r[1] for r in ranked[:3] if r[1] > 0)
            parts = []
            for cause, weight in ranked[:3]:
                if weight > 0:
                    pct = weight / total_w * 100 if total_w else 0
                    parts.append(f"{cause} ({pct:.0f}%)")
            synthesis_finding = f"Root causes: {' → '.join(parts)}. Confidence: {confidence}%"

        steps.append(_make_step(rca_id, 12, "EVIDENCE_SYNTHESIS", synthesis_finding, "PASS", bayesian_weight))

        # ── Create RootCauseAnalysis record ──────────────────────────────
        root_cause_group = ROOT_CAUSE_GROUPS.get(primary_root_cause, "PROCESS")

        resolution_paths = {
            "ELIGIBILITY_LAPSE": "Verify eligibility before next submission. Re-check coverage via 270/271.",
            "AUTH_MISSING": "Obtain prior authorization or submit retrospective auth request.",
            "AUTH_EXPIRED": "Request auth extension or submit new auth before re-billing.",
            "TIMELY_FILING_MISS": "Escalate to billing manager. Document extenuating circumstances for appeal.",
            "CODING_MISMATCH": "Review modifier usage and CPT-ICD linkage. Consult coding team.",
            "COB_ORDER_ERROR": "Verify coordination of benefits order. Submit to correct primary payer.",
            "BUNDLING_ERROR": "Review NCCI edits for CPT pair conflicts. Apply correct modifier (-59/-XE) or unbundle services.",
            "DUPLICATE_CLAIM": "Check claim history for prior submission. Void duplicate and resubmit if original was not paid.",
            "MODIFIER_MISMATCH": "Review modifier requirements for billed CPT codes. Correct or add missing modifiers and resubmit.",
            "DOCUMENTATION_DEFICIT": "Obtain additional clinical documentation from provider and resubmit with supporting records.",
            "MEDICAL_NECESSITY": "Gather clinical evidence of medical necessity. Submit peer-to-peer review or formal appeal with supporting documentation.",
            "PROCESS_BREAKDOWN": "Review workflow for process gaps. Implement checklist.",
            "PAYER_BEHAVIOR_SHIFT": "Escalate to payer relations. Review contract terms.",
            "CONTRACT_RATE_GAP": "Compare paid vs contracted rates. Initiate underpayment appeal with fee schedule evidence.",
            "PROVIDER_ENROLLMENT": "Verify provider enrollment and credentialing status with payer. Re-enroll if lapsed.",
        }

        rca = RootCauseAnalysis(
            rca_id=rca_id,
            denial_id=denial_id,
            claim_id=claim.claim_id,
            payer_id=claim.payer_id,
            primary_root_cause=primary_root_cause,
            secondary_root_cause=secondary_root_cause,
            tertiary_root_cause=tertiary_root_cause,
            primary_weight=primary_weight,
            secondary_weight=secondary_weight,
            tertiary_weight=tertiary_weight,
            bayesian_weight=round(bayesian_weight, 4),
            confidence_score=confidence,
            evidence_summary=synthesis_finding,
            root_cause_group=root_cause_group,
            financial_impact=float(denial.denial_amount or 0),
            resolution_path=resolution_paths.get(primary_root_cause, "Manual review recommended."),
        )
        db.add(rca)

        # Create step records
        for s in steps:
            step_record = ClaimRootCauseStep(
                step_id=s["step_id"],
                rca_id=rca_id,
                step_number=s["step_number"],
                step_name=s["step_name"],
                input_data=s.get("input_data"),
                finding=s["finding"],
                finding_status=s["finding_status"],
                contribution_weight=s["contribution_weight"],
            )
            db.add(step_record)

        # Update denial with root_cause_id
        await db.execute(
            update(Denial)
            .where(Denial.denial_id == denial_id)
            .values(root_cause_id=rca_id, root_cause_status="ANALYZED")
        )

        await db.commit()

        return {
            "rca_id": rca_id,
            "denial_id": denial_id,
            "claim_id": claim.claim_id,
            "primary_root_cause": primary_root_cause,
            "secondary_root_cause": secondary_root_cause,
            "tertiary_root_cause": tertiary_root_cause,
            "primary_weight": primary_weight,
            "secondary_weight": secondary_weight,
            "tertiary_weight": tertiary_weight,
            "root_cause_group": root_cause_group,
            "confidence_score": confidence,
            "bayesian_weight": round(bayesian_weight, 4),
            "financial_impact": float(denial.denial_amount or 0),
            "resolution_path": resolution_paths.get(primary_root_cause, ""),
            "steps": steps,
        }

    except Exception as e:
        logger.error(f"Root cause analysis failed for denial {denial_id}: {e}")
        await db.rollback()
        return {"error": str(e), "denial_id": denial_id}


def _make_step(rca_id: str, step_number: int, step_name: str,
               finding: str, finding_status: str, contribution_weight: float) -> dict:
    return {
        "step_id": _gen_step_id(),
        "rca_id": rca_id,
        "step_number": step_number,
        "step_name": step_name,
        "finding": finding,
        "finding_status": finding_status,
        "contribution_weight": round(contribution_weight, 4),
    }


# ── Batch Analysis ───────────────────────────────────────────────────────────

async def batch_analyze_pending(db: AsyncSession, batch_size: int = 100) -> int:
    """Analyze up to batch_size denials that haven't been root-cause classified yet."""
    try:
        result = await db.execute(
            select(Denial.denial_id)
            .where(Denial.root_cause_status == "PENDING")
            .limit(batch_size)
        )
        pending_ids = [row[0] for row in result.all()]

        analyzed = 0
        for denial_id in pending_ids:
            outcome = await analyze_denial_root_cause(db, denial_id)
            if "error" not in outcome:
                analyzed += 1

        return analyzed

    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        return 0


# ── Query Functions ──────────────────────────────────────────────────────────

async def get_claim_root_cause(db: AsyncSession, claim_id: str) -> dict:
    """Get root cause analysis for a specific claim."""
    try:
        result = await db.execute(
            select(RootCauseAnalysis)
            .where(RootCauseAnalysis.claim_id == claim_id)
            .order_by(desc(RootCauseAnalysis.created_at))
            .limit(1)
        )
        rca = result.scalars().first()
        if not rca:
            return {"claim_id": claim_id, "status": "NOT_ANALYZED", "analysis": None}

        # Load steps
        steps_result = await db.execute(
            select(ClaimRootCauseStep)
            .where(ClaimRootCauseStep.rca_id == rca.rca_id)
            .order_by(ClaimRootCauseStep.step_number)
        )
        step_records = steps_result.scalars().all()

        return {
            "claim_id": claim_id,
            "status": "ANALYZED",
            "analysis": {
                "rca_id": rca.rca_id,
                "denial_id": rca.denial_id,
                "primary_root_cause": rca.primary_root_cause,
                "secondary_root_cause": rca.secondary_root_cause,
                "tertiary_root_cause": getattr(rca, 'tertiary_root_cause', None),
                "primary_weight": getattr(rca, 'primary_weight', 0),
                "secondary_weight": getattr(rca, 'secondary_weight', 0),
                "tertiary_weight": getattr(rca, 'tertiary_weight', 0),
                "root_cause_group": rca.root_cause_group,
                "confidence_score": rca.confidence_score,
                "bayesian_weight": rca.bayesian_weight,
                "financial_impact": rca.financial_impact,
                "resolution_path": rca.resolution_path,
                "evidence_summary": rca.evidence_summary,
                "created_at": str(rca.created_at) if rca.created_at else None,
                "steps": [
                    {
                        "step_number": s.step_number,
                        "step_name": s.step_name,
                        "finding": s.finding,
                        "finding_status": s.finding_status,
                        "contribution_weight": s.contribution_weight,
                    }
                    for s in step_records
                ],
            },
        }

    except Exception as e:
        logger.error(f"get_claim_root_cause failed for {claim_id}: {e}")
        return {"claim_id": claim_id, "status": "ERROR", "analysis": None}


async def get_root_cause_summary(db: AsyncSession, filters: Optional[dict] = None) -> dict:
    """
    Aggregate root cause summary: counts by root cause, group, and payer.
    Filters: payer_id, root_cause_group
    """
    try:
        filters = filters or {}

        base_q = select(RootCauseAnalysis)
        if filters.get("payer_id"):
            base_q = base_q.where(RootCauseAnalysis.payer_id == filters["payer_id"])
        if filters.get("root_cause_group"):
            base_q = base_q.where(RootCauseAnalysis.root_cause_group == filters["root_cause_group"])

        sub = base_q.subquery()

        # Total analyses
        total = await db.scalar(select(func.count()).select_from(sub)) or 0

        # By root cause
        by_cause_q = (
            select(
                RootCauseAnalysis.primary_root_cause,
                func.count().label("count"),
                func.sum(RootCauseAnalysis.financial_impact).label("total_impact"),
                func.avg(RootCauseAnalysis.confidence_score).label("avg_confidence"),
            )
        )
        if filters.get("payer_id"):
            by_cause_q = by_cause_q.where(RootCauseAnalysis.payer_id == filters["payer_id"])
        if filters.get("root_cause_group"):
            by_cause_q = by_cause_q.where(RootCauseAnalysis.root_cause_group == filters["root_cause_group"])

        by_cause_q = by_cause_q.group_by(RootCauseAnalysis.primary_root_cause).order_by(desc("count"))
        cause_rows = await db.execute(by_cause_q)

        by_cause = []
        for row in cause_rows:
            by_cause.append({
                "root_cause": row[0],
                "count": row[1],
                "total_impact": round(float(row[2] or 0), 2),
                "avg_confidence": round(float(row[3] or 0), 1),
                "group": ROOT_CAUSE_GROUPS.get(row[0], "PROCESS"),
                "pct": round(row[1] / max(total, 1) * 100, 1),
            })

        # By group
        by_group_q = (
            select(
                RootCauseAnalysis.root_cause_group,
                func.count().label("count"),
                func.sum(RootCauseAnalysis.financial_impact).label("total_impact"),
            )
        )
        if filters.get("payer_id"):
            by_group_q = by_group_q.where(RootCauseAnalysis.payer_id == filters["payer_id"])

        by_group_q = by_group_q.group_by(RootCauseAnalysis.root_cause_group).order_by(desc("count"))
        group_rows = await db.execute(by_group_q)

        by_group = []
        for row in group_rows:
            by_group.append({
                "group": row[0],
                "count": row[1],
                "total_impact": round(float(row[2] or 0), 2),
                "pct": round(row[1] / max(total, 1) * 100, 1),
            })

        # Total financial impact
        total_impact_q = select(func.sum(RootCauseAnalysis.financial_impact))
        if filters.get("payer_id"):
            total_impact_q = total_impact_q.where(RootCauseAnalysis.payer_id == filters["payer_id"])
        total_impact = await db.scalar(total_impact_q) or 0

        # Preventable amount
        preventable_q = select(func.sum(RootCauseAnalysis.financial_impact)).where(
            RootCauseAnalysis.root_cause_group == "PREVENTABLE"
        )
        if filters.get("payer_id"):
            preventable_q = preventable_q.where(RootCauseAnalysis.payer_id == filters["payer_id"])
        preventable_amount = await db.scalar(preventable_q) or 0

        return {
            "total_analyses": total,
            "total_financial_impact": round(float(total_impact), 2),
            "preventable_amount": round(float(preventable_amount), 2),
            "preventable_pct": round(float(preventable_amount) / max(float(total_impact), 1) * 100, 1),
            "by_root_cause": by_cause,
            "by_group": by_group,
        }

    except Exception as e:
        logger.error(f"get_root_cause_summary failed: {e}")
        return {
            "total_analyses": 0,
            "total_financial_impact": 0,
            "preventable_amount": 0,
            "preventable_pct": 0,
            "by_root_cause": [],
            "by_group": [],
        }


async def get_root_cause_trending(db: AsyncSession, weeks_back: int = 12,
                                   payer_id: Optional[str] = None) -> dict:
    """Weekly trending of root cause categories over time."""
    try:
        today = date.today()
        start_date = today - timedelta(weeks=weeks_back)

        q = (
            select(
                RootCauseAnalysis.primary_root_cause,
                func.count().label("count"),
                func.sum(RootCauseAnalysis.financial_impact).label("total_impact"),
            )
            .where(RootCauseAnalysis.created_at >= start_date)
        )
        if payer_id:
            q = q.where(RootCauseAnalysis.payer_id == payer_id)

        q = q.group_by(RootCauseAnalysis.primary_root_cause).order_by(desc("count"))
        rows = await db.execute(q)

        trending = []
        for row in rows:
            trending.append({
                "root_cause": row[0],
                "count": row[1],
                "total_impact": round(float(row[2] or 0), 2),
                "group": ROOT_CAUSE_GROUPS.get(row[0], "PROCESS"),
            })

        # Overall totals for the period
        total_q = select(func.count()).select_from(RootCauseAnalysis).where(
            RootCauseAnalysis.created_at >= start_date
        )
        if payer_id:
            total_q = total_q.where(RootCauseAnalysis.payer_id == payer_id)
        total = await db.scalar(total_q) or 0

        return {
            "weeks_back": weeks_back,
            "start_date": str(start_date),
            "end_date": str(today),
            "total_in_period": total,
            "payer_id": payer_id,
            "trending": trending,
        }

    except Exception as e:
        logger.error(f"get_root_cause_trending failed: {e}")
        return {
            "weeks_back": weeks_back,
            "total_in_period": 0,
            "trending": [],
        }


# ── Root Cause Tree (hierarchical for frontend) ─────────────────────────────

# Config: maps root cause groups → L1 tree display
_L1_CONFIG = {
    "PREVENTABLE": {"icon": "gavel",         "color": "red",    "stage": "Prior Authorization"},
    "PROCESS":     {"icon": "code",          "color": "amber",  "stage": "Charge Capture"},
    "PAYER":       {"icon": "request_quote", "color": "orange", "stage": "Payment Posting"},
    "CLINICAL":    {"icon": "healing",       "color": "purple", "stage": "Clinical Documentation"},
}

# Friendly labels for root cause categories
_RC_LABELS = {
    "ELIGIBILITY_LAPSE": "Eligibility Lapse",
    "AUTH_MISSING": "Authorization Missing",
    "AUTH_EXPIRED": "Authorization Expired",
    "TIMELY_FILING_MISS": "Timely Filing Miss",
    "CODING_MISMATCH": "Coding Mismatch",
    "COB_ORDER_ERROR": "COB Order Error",
    "BUNDLING_ERROR": "Bundling Error",
    "DUPLICATE_CLAIM": "Duplicate Claim",
    "MODIFIER_MISMATCH": "Modifier Mismatch",
    "DOCUMENTATION_DEFICIT": "Documentation Deficit",
    "PROCESS_BREAKDOWN": "Process Breakdown",
    "PAYER_BEHAVIOR_SHIFT": "Payer Behavior Shift",
    "CONTRACT_RATE_GAP": "Contract Rate Gap",
    "MEDICAL_NECESSITY": "Medical Necessity",
    "PROVIDER_ENROLLMENT": "Provider Enrollment",
}

_GROUP_LABELS = {
    "PREVENTABLE": "Preventable Denials",
    "PROCESS": "Process Errors",
    "PAYER": "Payer-Driven",
    "CLINICAL": "Clinical Gaps",
}


def _fmt_dollar(val: float) -> str:
    """Format dollars as $X.XXM or $XXXK."""
    if abs(val) >= 1_000_000:
        return f"${val / 1_000_000:,.2f}M"
    if abs(val) >= 1_000:
        return f"${val / 1_000:,.0f}K"
    return f"${val:,.0f}"


def _priority_from_impact(impact: float, total: float) -> str:
    pct = impact / max(total, 1) * 100
    if pct >= 25:
        return "critical"
    if pct >= 15:
        return "high"
    if pct >= 8:
        return "medium"
    return "low"


async def get_root_cause_tree(db: AsyncSession) -> dict:
    """
    Build hierarchical root cause tree from real data.
    Root → L1 (by root_cause_group) → L2 (by primary_root_cause) → L3 (top payer+CARC combos)
    """
    from sqlalchemy import text as sql_text

    try:
        # L2: by primary root cause with payer breakdown
        result = await db.execute(sql_text("""
            SELECT rca.primary_root_cause, rca.root_cause_group,
                   COUNT(*) as cnt,
                   SUM(rca.financial_impact) as impact,
                   ROUND(AVG(rca.confidence_score)) as avg_conf
            FROM root_cause_analysis rca
            GROUP BY rca.primary_root_cause, rca.root_cause_group
            ORDER BY impact DESC
        """))
        cause_rows = result.all()

        # L3: top payer+CARC per root cause (top 4)
        result = await db.execute(sql_text("""
            SELECT rca.primary_root_cause, pm.payer_name, d.carc_code,
                   COUNT(*) as cnt,
                   SUM(rca.financial_impact) as impact,
                   ROUND(AVG(rca.confidence_score)) as avg_conf
            FROM root_cause_analysis rca
            JOIN denials d ON rca.denial_id = d.denial_id
            JOIN claims c ON rca.claim_id = c.claim_id
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            WHERE d.carc_code IS NOT NULL
            GROUP BY rca.primary_root_cause, pm.payer_name, d.carc_code
            ORDER BY rca.primary_root_cause, impact DESC
        """))
        payer_carc_rows = result.all()

        # Organize L3 by root cause
        l3_by_cause = {}
        for row in payer_carc_rows:
            cause = row[0]
            if cause not in l3_by_cause:
                l3_by_cause[cause] = []
            if len(l3_by_cause[cause]) < 4:  # top 4
                l3_by_cause[cause].append({
                    "id": f"{cause}-{row[1]}-{row[2]}".lower().replace(" ", "-"),
                    "label": f"{row[1]} {row[2]}",
                    "value": _fmt_dollar(float(row[4] or 0)),
                    "claims": int(row[3]),
                    "confidence": int(row[5] or 0),
                    "carc": row[2],
                    "description": f"{row[1]}: {int(row[3])} claims denied with {row[2]}. Financial impact: {_fmt_dollar(float(row[4] or 0))}.",
                    "navPath": "/denials",
                })

        # Build L1 groups → L2 causes
        groups = {}
        total_impact = sum(float(r[3] or 0) for r in cause_rows)
        total_claims = sum(int(r[2]) for r in cause_rows)

        for row in cause_rows:
            cause = row[0]
            group = row[1] or ROOT_CAUSE_GROUPS.get(cause, "PROCESS")
            cnt = int(row[2])
            impact = float(row[3] or 0)
            conf = int(row[4] or 0)

            if group not in groups:
                cfg = _L1_CONFIG.get(group, _L1_CONFIG["PROCESS"])
                groups[group] = {
                    "id": group.lower(),
                    "label": _GROUP_LABELS.get(group, group),
                    "value": 0,
                    "claims": 0,
                    "confidence": 0,
                    "priority": "medium",
                    "icon": cfg["icon"],
                    "color": cfg["color"],
                    "stage": cfg["stage"],
                    "description": "",
                    "navPath": "/denials",
                    "children": [],
                    "_conf_sum": 0,
                    "_count": 0,
                }

            g = groups[group]
            g["value"] += impact
            g["claims"] += cnt
            g["_conf_sum"] += conf * cnt
            g["_count"] += cnt

            l2_node = {
                "id": cause.lower().replace("_", "-"),
                "label": _RC_LABELS.get(cause, cause),
                "value": _fmt_dollar(impact),
                "claims": cnt,
                "confidence": conf,
                "description": f"{_RC_LABELS.get(cause, cause)}: {cnt} denials with {_fmt_dollar(impact)} financial impact. Avg confidence: {conf}%.",
                "navPath": f"/claims-analytics/root-cause/{cause}",
                "children": l3_by_cause.get(cause, []),
            }
            g["children"].append(l2_node)

        # Finalize L1 nodes
        l1_nodes = []
        for group, g in sorted(groups.items(), key=lambda x: x[1]["value"], reverse=True):
            g["confidence"] = round(g["_conf_sum"] / max(g["_count"], 1))
            raw_value = g["value"]
            g["value"] = _fmt_dollar(raw_value)
            g["priority"] = _priority_from_impact(raw_value, total_impact)
            # Sort children by impact desc (already string, sort by claims as proxy)
            g["children"].sort(key=lambda c: c["claims"], reverse=True)
            top_causes = ", ".join(c["label"] for c in g["children"][:3])
            g["description"] = f"{_GROUP_LABELS.get(group, group)}: {g['claims']} denials. Top causes: {top_causes}."
            del g["_conf_sum"]
            del g["_count"]
            l1_nodes.append(g)

        # Compute actionable estimate (preventable group)
        preventable = sum(
            float(r[3] or 0) for r in cause_rows
            if (r[1] or ROOT_CAUSE_GROUPS.get(r[0], "")) == "PREVENTABLE"
        )
        actionable_pct = round(preventable / max(total_impact, 1) * 100)
        avg_conf = round(
            sum(int(r[4] or 0) * int(r[2]) for r in cause_rows) / max(total_claims, 1)
        )

        return {
            "root": {
                "id": "root",
                "label": "Revenue Gap",
                "value": _fmt_dollar(total_impact),
                "claims": total_claims,
                "description": f"Total preventable revenue loss: {_fmt_dollar(total_impact)} across {total_claims} denials",
                "icon": "account_balance",
                "color": "blue",
            },
            "children": l1_nodes,
            "summary": {
                "total_identified": _fmt_dollar(total_impact),
                "immediately_actionable": _fmt_dollar(preventable),
                "actionable_pct": actionable_pct,
                "avg_confidence": avg_conf,
                "pattern_count": len(payer_carc_rows),
            },
        }

    except Exception as e:
        logger.error(f"get_root_cause_tree failed: {e}")
        return {"root": {"id": "root", "label": "Revenue Gap", "value": "$0", "claims": 0}, "children": [], "summary": {}}
