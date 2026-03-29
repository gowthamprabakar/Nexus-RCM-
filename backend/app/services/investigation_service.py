"""
Investigation Service — Sprint 14
===================================
Orchestrates a full investigation for a claim or denial by combining:
  1. Root cause analysis (SQL-based 11-step pipeline)
  2. Neo4j graph evidence (pattern synthesis)
  3. ML predictions (denial probability + appeal success)
  4. Ranked suggestions with expected value (probability x impact)

Entry points:
  investigate_claim(db, claim_id) -> dict
  investigate_denial(db, denial_id) -> dict
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

logger = logging.getLogger(__name__)

# Timeout for subsystem calls (seconds)
SUBSYSTEM_TIMEOUT = 5.0

# Priority thresholds based on expected value
_PRIORITY_HIGH = 500.0
_PRIORITY_MEDIUM = 100.0

# Resolution descriptions keyed by root cause
_SUGGESTION_DESCRIPTIONS: Dict[str, str] = {
    "ELIGIBILITY_LAPSE": "Verify patient eligibility and resubmit with corrected coverage information",
    "AUTH_MISSING": "Obtain required prior authorization and submit appeal with auth reference",
    "AUTH_EXPIRED": "Request retroactive authorization or submit appeal with clinical justification",
    "CODING_MISMATCH": "Review and correct CPT/ICD coding, then resubmit or appeal with corrected codes",
    "TIMELY_FILING_MISS": "Gather proof of timely filing (clearinghouse receipt) and appeal",
    "COB_ORDER_ERROR": "Verify coordination of benefits order and resubmit to correct primary payer",
    "BUNDLING_ERROR": "Review unbundling rules, apply correct modifiers, and resubmit",
    "DUPLICATE_CLAIM": "Verify original claim status; if truly duplicate, write off; otherwise appeal",
    "MODIFIER_MISMATCH": "Correct modifier usage per payer guidelines and resubmit",
    "DOCUMENTATION_DEFICIT": "Obtain supporting clinical documentation and submit appeal",
    "PROCESS_BREAKDOWN": "Review internal workflow failure and resubmit with corrected process",
    "PAYER_BEHAVIOR_SHIFT": "Escalate to payer relations; consider peer-to-peer review or external appeal",
    "CONTRACT_RATE_GAP": "Review contract terms and submit dispute with contracted rate documentation",
    "MEDICAL_NECESSITY": "Obtain peer-to-peer review or submit appeal with clinical evidence",
    "PROVIDER_ENROLLMENT": "Verify provider enrollment status with payer and correct credentialing",
}


def _priority_from_expected_value(ev: float) -> str:
    """Classify priority based on expected dollar value."""
    if ev >= _PRIORITY_HIGH:
        return "HIGH"
    if ev >= _PRIORITY_MEDIUM:
        return "MEDIUM"
    return "LOW"


def _action_from_prediction(probability: float, recommendation: Optional[str] = None) -> str:
    """Determine action based on appeal success probability."""
    if recommendation:
        return recommendation
    if probability >= 0.65:
        return "APPEAL"
    if probability >= 0.35:
        return "NEGOTIATE"
    return "WRITE_OFF"


def _build_suggestions(
    rca_result: Dict[str, Any],
    appeal_prediction: Optional[Dict[str, Any]],
    graph_evidence: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Build ranked suggestions from root cause analysis, ML predictions,
    and graph evidence. Each suggestion includes expected_value for ranking.
    """
    suggestions: List[Dict[str, Any]] = []

    primary_cause = rca_result.get("primary_root_cause")
    financial_impact = float(rca_result.get("financial_impact", 0))
    rca_confidence = int(rca_result.get("confidence_score", 0))

    # Appeal success probability from ML model (default to moderate if unavailable)
    appeal_prob = 0.5
    ml_recommendation = None
    if appeal_prediction and "probability" in appeal_prediction:
        appeal_prob = appeal_prediction["probability"]
        ml_recommendation = appeal_prediction.get("recommendation")

    # Primary suggestion based on root cause + ML prediction
    if primary_cause:
        expected_value = round(appeal_prob * financial_impact, 2)
        action = _action_from_prediction(appeal_prob, ml_recommendation)
        description = _SUGGESTION_DESCRIPTIONS.get(
            primary_cause,
            f"Investigate {primary_cause} and determine appropriate resolution",
        )
        source = "ML+RCA" if appeal_prediction else "RCA"
        suggestions.append({
            "action": action,
            "description": description,
            "priority": _priority_from_expected_value(expected_value),
            "expected_value": expected_value,
            "success_probability": round(appeal_prob, 4),
            "estimated_impact": financial_impact,
            "confidence": rca_confidence,
            "source": source,
        })

    # Secondary suggestion from secondary root cause (lower confidence)
    secondary_cause = rca_result.get("secondary_root_cause")
    secondary_weight = float(rca_result.get("secondary_weight", 0))
    if secondary_cause and secondary_weight > 0:
        # Scale probability down by weight ratio
        primary_weight = float(rca_result.get("primary_weight", 1))
        weight_ratio = secondary_weight / primary_weight if primary_weight > 0 else 0.5
        sec_prob = appeal_prob * weight_ratio
        sec_ev = round(sec_prob * financial_impact, 2)
        sec_description = _SUGGESTION_DESCRIPTIONS.get(
            secondary_cause,
            f"Investigate secondary cause: {secondary_cause}",
        )
        suggestions.append({
            "action": _action_from_prediction(sec_prob),
            "description": f"[Secondary] {sec_description}",
            "priority": _priority_from_expected_value(sec_ev),
            "expected_value": sec_ev,
            "success_probability": round(sec_prob, 4),
            "estimated_impact": financial_impact,
            "confidence": max(rca_confidence - 15, 0),
            "source": "RCA",
        })

    # Graph-informed suggestion if convergence evidence is strong
    if graph_evidence and isinstance(graph_evidence, dict):
        total_graph_pts = graph_evidence.get("total_points", 0)
        if total_graph_pts >= 15:
            findings_summary = graph_evidence.get("findings_summary", [])
            graph_desc = (
                f"Graph analysis detected systemic patterns: {'; '.join(findings_summary[:3])}"
                if findings_summary
                else "Graph analysis detected systemic denial patterns for this payer/provider combination"
            )
            # Graph evidence boosts confidence but uses same financial impact
            graph_prob = min(appeal_prob * 1.1, 1.0) if total_graph_pts >= 20 else appeal_prob
            graph_ev = round(graph_prob * financial_impact, 2)
            suggestions.append({
                "action": "ESCALATE",
                "description": graph_desc,
                "priority": _priority_from_expected_value(graph_ev),
                "expected_value": graph_ev,
                "success_probability": round(graph_prob, 4),
                "estimated_impact": financial_impact,
                "confidence": min(rca_confidence + 10, 100),
                "source": "GRAPH",
            })

    # Sort by expected_value descending
    suggestions.sort(key=lambda s: s["expected_value"], reverse=True)
    return suggestions


async def investigate_denial(db: AsyncSession, denial_id: str) -> dict:
    """
    Run a full investigation on a denial, combining:
      - Root cause analysis (SQL 11-step pipeline)
      - Appeal success ML prediction
      - Neo4j graph evidence
      - Ranked suggestions with expected value

    Gracefully degrades if any subsystem is unavailable.
    """
    subsystems_available = 0
    subsystems_total = 3  # RCA, ML appeal, Neo4j graph

    # ── 1. Root Cause Analysis (required) ──────────────────────────────
    rca_result: Dict[str, Any] = {}
    try:
        from app.services.root_cause_service import analyze_denial_root_cause

        rca_result = await asyncio.wait_for(
            analyze_denial_root_cause(db, denial_id),
            timeout=SUBSYSTEM_TIMEOUT * 3,  # RCA gets extra time (DB-heavy)
        )
        if "error" not in rca_result:
            subsystems_available += 1
        else:
            logger.warning(
                "RCA returned error for denial %s: %s",
                denial_id, rca_result.get("error"),
            )
    except asyncio.TimeoutError:
        logger.error("RCA timed out for denial %s", denial_id)
        rca_result = {"error": "Root cause analysis timed out", "denial_id": denial_id}
    except Exception as e:
        logger.error("RCA failed for denial %s: %s", denial_id, e)
        rca_result = {"error": str(e), "denial_id": denial_id}

    # Extract identifiers from RCA for downstream subsystems
    claim_id = rca_result.get("claim_id")
    payer_id = None
    provider_id = None
    cpt_code = None

    if claim_id:
        try:
            from app.models.claim import Claim
            claim = await db.get(Claim, claim_id)
            if claim:
                payer_id = claim.payer_id
                provider_id = claim.provider_id
                # Get first CPT code from claim lines
                from app.models.rcm_extended import ClaimLine
                cl_result = await db.execute(
                    select(ClaimLine.cpt_code)
                    .where(ClaimLine.claim_id == claim_id)
                    .limit(1)
                )
                cl_row = cl_result.scalar()
                if cl_row:
                    cpt_code = cl_row
        except Exception as e:
            logger.warning("Failed to load claim details for %s: %s", claim_id, e)

    # ── 2. Appeal Success Prediction (ML) ──────────────────────────────
    appeal_prediction: Optional[Dict[str, Any]] = None
    try:
        from app.ml.appeal_success import AppealSuccessModel

        model = AppealSuccessModel()
        model.load()
        appeal_prediction = await asyncio.wait_for(
            model.predict_denial(db, denial_id),
            timeout=SUBSYSTEM_TIMEOUT,
        )
        subsystems_available += 1
    except FileNotFoundError:
        logger.info(
            "Appeal success model not trained yet — skipping ML prediction for %s",
            denial_id,
        )
    except asyncio.TimeoutError:
        logger.error("Appeal success prediction timed out for denial %s", denial_id)
    except Exception as e:
        logger.warning("Appeal success prediction failed for %s: %s", denial_id, e)

    # ── 3. Neo4j Graph Evidence ────────────────────────────────────────
    graph_evidence: Optional[Dict[str, Any]] = None
    if payer_id and provider_id:
        try:
            from app.services.neo4j_rca_queries import get_all_graph_evidence

            graph_evidence = await asyncio.wait_for(
                get_all_graph_evidence(payer_id, provider_id, cpt_code),
                timeout=SUBSYSTEM_TIMEOUT,
            )
            if graph_evidence and "error" not in graph_evidence:
                subsystems_available += 1
            else:
                logger.warning(
                    "Graph evidence returned error for denial %s: %s",
                    denial_id, graph_evidence.get("error") if graph_evidence else "empty",
                )
        except asyncio.TimeoutError:
            logger.error("Neo4j graph evidence timed out for denial %s", denial_id)
        except Exception as e:
            logger.warning("Neo4j graph evidence failed for %s: %s", denial_id, e)
    else:
        logger.info(
            "Skipping graph evidence — missing payer_id or provider_id for denial %s",
            denial_id,
        )

    # ── 4. Build Ranked Suggestions ────────────────────────────────────
    suggestions = _build_suggestions(rca_result, appeal_prediction, graph_evidence)

    # ── 5. Compute Investigation Completeness ──────────────────────────
    investigation_completeness = round(
        subsystems_available / subsystems_total, 2
    ) if subsystems_total > 0 else 0.0

    return {
        "denial_id": denial_id,
        "root_cause_analysis": rca_result,
        "appeal_prediction": appeal_prediction,
        "graph_evidence": graph_evidence,
        "suggestions": suggestions,
        "investigation_completeness": investigation_completeness,
    }


async def investigate_claim(db: AsyncSession, claim_id: str) -> dict:
    """
    Run a full investigation on a claim, combining:
      - Denial probability prediction (pre-submission risk)
      - Per-denial investigations (if any denials exist)

    Gracefully degrades if any subsystem is unavailable.
    """
    # ── 1. Look up the claim ───────────────────────────────────────────
    try:
        from app.models.claim import Claim

        claim = await db.get(Claim, claim_id)
    except Exception as e:
        logger.error("Failed to load claim %s: %s", claim_id, e)
        return {"error": str(e), "claim_id": claim_id}

    if not claim:
        return {"error": f"Claim {claim_id} not found", "claim_id": claim_id}

    # ── 2. Denial Probability Prediction (ML) ─────────────────────────
    denial_prediction: Optional[Dict[str, Any]] = None
    try:
        from app.ml.denial_probability import DenialProbabilityModel

        model = DenialProbabilityModel()
        model.load()
        denial_prediction = await asyncio.wait_for(
            model.predict_claim(db, claim_id),
            timeout=SUBSYSTEM_TIMEOUT,
        )
    except FileNotFoundError:
        logger.info(
            "Denial probability model not trained yet — skipping for claim %s",
            claim_id,
        )
    except asyncio.TimeoutError:
        logger.error("Denial probability prediction timed out for claim %s", claim_id)
    except Exception as e:
        logger.warning("Denial probability prediction failed for %s: %s", claim_id, e)

    # ── 3. Find Existing Denials and Investigate Each ──────────────────
    denial_investigations: List[Dict[str, Any]] = []
    denial_ids: List[str] = []
    try:
        from app.models.denial import Denial

        result = await db.execute(
            select(Denial.denial_id).where(Denial.claim_id == claim_id)
        )
        denial_ids = [row[0] for row in result.fetchall()]

        for did in denial_ids:
            try:
                investigation = await investigate_denial(db, did)
                denial_investigations.append(investigation)
            except Exception as e:
                logger.warning("Investigation failed for denial %s: %s", did, e)
                denial_investigations.append({
                    "denial_id": did,
                    "error": str(e),
                })
    except Exception as e:
        logger.warning("Failed to query denials for claim %s: %s", claim_id, e)

    # ── 4. Build Claim-Level Suggestions ───────────────────────────────
    claim_suggestions: List[Dict[str, Any]] = []

    # Add pre-submission risk suggestion if denial probability is elevated
    if denial_prediction and denial_prediction.get("probability", 0) >= 0.25:
        prob = denial_prediction["probability"]
        risk_level = denial_prediction.get("risk_level", "MEDIUM")
        total_charges = float(claim.total_charges or 0)
        ev = round(prob * total_charges, 2)
        contributing = denial_prediction.get("contributing_factors", [])
        top_factors = ", ".join(
            f.get("feature", "") for f in contributing[:3]
        )
        claim_suggestions.append({
            "action": "REVIEW_BEFORE_SUBMISSION" if claim.status in ("DRAFT", "SUBMITTED") else "REVIEW",
            "description": (
                f"Denial risk {risk_level} ({prob:.0%}). "
                f"Top risk factors: {top_factors}. "
                f"Review and correct before submission."
            ),
            "priority": _priority_from_expected_value(ev),
            "expected_value": ev,
            "success_probability": round(1.0 - prob, 4),
            "estimated_impact": total_charges,
            "confidence": int(prob * 100),
            "source": "ML",
        })

    # Aggregate suggestions from denial investigations
    for inv in denial_investigations:
        for s in inv.get("suggestions", []):
            claim_suggestions.append(s)

    # Sort all suggestions by expected_value descending
    claim_suggestions.sort(key=lambda s: s["expected_value"], reverse=True)

    # ── 5. Compute Investigation Completeness ──────────────────────────
    subsystems_total = 2  # denial probability + denial investigations
    subsystems_available = 0
    if denial_prediction is not None:
        subsystems_available += 1
    if denial_investigations:
        # Average completeness across denial investigations
        inv_completeness_values = [
            inv.get("investigation_completeness", 0)
            for inv in denial_investigations
            if "error" not in inv or "investigation_completeness" in inv
        ]
        if inv_completeness_values:
            subsystems_available += sum(inv_completeness_values) / len(inv_completeness_values)
    elif not denial_ids:
        # No denials to investigate is not a failure
        subsystems_available += 1

    investigation_completeness = round(
        min(subsystems_available / subsystems_total, 1.0), 2
    )

    return {
        "claim_id": claim_id,
        "claim_status": claim.status,
        "total_charges": float(claim.total_charges or 0),
        "denial_probability": denial_prediction,
        "denial_investigations": denial_investigations,
        "suggestions": claim_suggestions,
        "investigation_completeness": investigation_completeness,
    }
