"""
ML Enrichment Service
======================
Gathers outputs from all 9 ML models for a given denial/claim and
returns two enriched dicts:
  - claim_context    (facts + risk signals — sent as MiroFish claim_context)
  - ml_intelligence  (full model outputs — sent as MiroFish neo4j_evidence)

All model calls are fire-and-forget with individual timeouts.
A failed model never blocks the pipeline.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

_MODEL_TIMEOUT = 2.0


async def _safe(coro, default=None):
    """Run a coroutine, return default on any error or timeout."""
    try:
        return await asyncio.wait_for(coro, timeout=_MODEL_TIMEOUT)
    except Exception as exc:
        logger.debug("ML enrichment call failed (non-blocking): %s", exc)
        return default


async def build_mirofish_context(
    db: AsyncSession,
    denial_id: str,
    claim_id: Optional[str],
    payer_id: Optional[str],
    provider_id: Optional[str],
    suggestion: dict,
    rca_result: Optional[dict] = None,
    appeal_prediction: Optional[dict] = None,
) -> tuple[dict, dict]:
    """Build enriched (claim_context, ml_intelligence) for MiroFish."""

    denial_prob_result = None
    if claim_id:
        denial_prob_result = await _safe(_run_denial_probability(db, claim_id))

    appeal_result = appeal_prediction or {}

    payment_delay_result = None
    if claim_id:
        payment_delay_result = await _safe(_run_payment_delay(db, claim_id))

    payer_anomaly_result = None
    if payer_id:
        payer_anomaly_result = await _safe(_run_payer_anomaly(db, payer_id))

    propensity_result = None
    if claim_id:
        propensity_result = await _safe(_run_propensity(db, claim_id))

    write_off_result = None
    if claim_id:
        write_off_result = await _safe(_run_write_off(db, claim_id))

    provider_risk_result = None
    if provider_id:
        provider_risk_result = await _safe(_run_provider_risk(db, provider_id))

    carc_result = None
    if claim_id:
        carc_result = await _safe(_run_carc_prediction(db, claim_id))

    composite_result = None
    if claim_id and denial_prob_result:
        composite_result = await _safe(_run_composite(db, claim_id, denial_prob_result))

    claim_context = {
        "denial_id": denial_id,
        "claim_id": claim_id or "",
        "payer_id": payer_id or "",
        "provider_id": provider_id or "",
        "denial_category": rca_result.get("denial_category", "") if rca_result else "",
        "carc_code": rca_result.get("carc_code", "") if rca_result else "",
        "denial_amount": float(rca_result.get("financial_impact", 0) or 0) if rca_result else 0.0,
        "primary_root_cause": rca_result.get("primary_root_cause", "") if rca_result else "",
        "rca_confidence": int(rca_result.get("confidence_score", 0) or 0) if rca_result else 0,
        "suggestion_action": suggestion.get("action", ""),
        "suggestion_category": suggestion.get("category", ""),
        "suggestion_confidence": int(suggestion.get("confidence", 0) or 0),
        "estimated_impact": float(suggestion.get("estimated_impact", 0) or 0),
        "denial_probability": float(denial_prob_result.get("probability", 0)) if denial_prob_result else 0.0,
        "denial_risk_level": denial_prob_result.get("risk_level", "UNKNOWN") if denial_prob_result else "UNKNOWN",
        "appeal_probability": float(appeal_result.get("probability", 0)) if appeal_result else 0.0,
        "appeal_recommendation": appeal_result.get("recommendation", "") if appeal_result else "",
        "write_off_probability": float(write_off_result.get("write_off_probability", 0)) if write_off_result else 0.0,
        "days_to_write_off": int(write_off_result.get("days_to_write_off_estimate", 180)) if write_off_result else 180,
        "payment_delay_predicted_days": float(payment_delay_result.get("predicted_days", 0)) if payment_delay_result else 0.0,
        "payment_delay_vs_adtp": float((payment_delay_result.get("predicted_days", 0) or 0) - (payment_delay_result.get("payer_benchmark", 0) or 0)) if payment_delay_result else 0.0,
        "payer_is_anomalous": bool(payer_anomaly_result.get("is_anomaly", False)) if payer_anomaly_result else False,
        "payer_anomaly_score": float(payer_anomaly_result.get("anomaly_score", 0)) if payer_anomaly_result else 0.0,
        "patient_propensity_tier": propensity_result.get("risk_tier", "UNKNOWN") if propensity_result else "UNKNOWN",
        "patient_propensity_score": float(propensity_result.get("probability", 0.5)) if propensity_result else 0.5,
        "provider_risk_score": float(provider_risk_result.get("risk_score", 0)) if provider_risk_result else 0.0,
        "provider_peer_percentile": float(provider_risk_result.get("peer_percentile", 50)) if provider_risk_result else 50.0,
        "revenue_at_risk": float(composite_result.get("revenue_at_risk", 0)) if composite_result else 0.0,
        "expected_net_revenue": float(composite_result.get("expected_revenue", 0)) if composite_result else 0.0,
    }

    ml_intelligence = {
        "validation_mode": True,
        "denial_probability_detail": {
            "probability": claim_context["denial_probability"],
            "risk_level": claim_context["denial_risk_level"],
            "top_factors": (denial_prob_result.get("contributing_factors", [])[:5] if denial_prob_result else []),
        },
        "appeal_success_detail": {
            "probability": claim_context["appeal_probability"],
            "recommendation": claim_context["appeal_recommendation"],
            "top_factors": (appeal_result.get("contributing_factors", [])[:5] if appeal_result else []),
        },
        "carc_predictions": (carc_result.get("top_3_carc", []) if carc_result else []),
        "payer_anomaly_detail": {
            "is_anomaly": claim_context["payer_is_anomalous"],
            "anomaly_score": claim_context["payer_anomaly_score"],
            "anomaly_factors": (payer_anomaly_result.get("anomaly_factors", []) if payer_anomaly_result else []),
            "payer_metrics": (payer_anomaly_result.get("metrics", {}) if payer_anomaly_result else {}),
        },
        "write_off_detail": {
            "probability": claim_context["write_off_probability"],
            "days_to_write_off": claim_context["days_to_write_off"],
            "recommended_action": (write_off_result.get("recommended_action", "") if write_off_result else ""),
        },
        "payment_delay_detail": {
            "predicted_days": claim_context["payment_delay_predicted_days"],
            "payer_benchmark_days": float(payment_delay_result.get("payer_benchmark", 0)) if payment_delay_result else 0.0,
            "days_over_benchmark": claim_context["payment_delay_vs_adtp"],
            "confidence_interval": (payment_delay_result.get("confidence_interval", {}) if payment_delay_result else {}),
        },
        "provider_risk_detail": {
            "risk_score": claim_context["provider_risk_score"],
            "peer_percentile": claim_context["provider_peer_percentile"],
            "risk_factors": (provider_risk_result.get("risk_factors", []) if provider_risk_result else []),
        },
        "patient_propensity_detail": {
            "tier": claim_context["patient_propensity_tier"],
            "probability": claim_context["patient_propensity_score"],
            "recommended_action": (propensity_result.get("recommended_action", "") if propensity_result else ""),
        },
        "composite_detail": composite_result or {},
        "suggestion_action": suggestion.get("action", ""),
        "suggestion_confidence": claim_context["suggestion_confidence"],
        "estimated_impact": claim_context["estimated_impact"],
    }

    return claim_context, ml_intelligence


async def _run_denial_probability(db, claim_id):
    from app.ml.denial_probability import DenialProbabilityModel
    model = DenialProbabilityModel()
    model.load()
    return await model.predict_claim(db, claim_id)

async def _run_payment_delay(db, claim_id):
    from app.ml.payment_delay import PaymentDelayModel
    model = PaymentDelayModel()
    model.load()
    return await model.predict_claim(db, claim_id)

async def _run_payer_anomaly(db, payer_id):
    from app.ml.payer_anomaly import PayerAnomalyModel
    from sqlalchemy import text
    model = PayerAnomalyModel()
    result = await db.execute(text("""
        SELECT pm.denial_rate, COUNT(d.denial_id), COUNT(ep.era_id),
               COALESCE(AVG(ep.payment_amount), 0), 0, COUNT(c.claim_id)
        FROM payer_master pm
        LEFT JOIN claims c ON c.payer_id = pm.payer_id AND c.date_of_service >= CURRENT_DATE - 30
        LEFT JOIN denials d ON d.claim_id = c.claim_id
        LEFT JOIN era_payments ep ON ep.payer_id = pm.payer_id AND ep.payment_date >= CURRENT_DATE - 30
        WHERE pm.payer_id = :pid
        GROUP BY pm.payer_id, pm.denial_rate
    """), {"pid": payer_id})
    row = result.fetchone()
    if not row:
        return {"is_anomaly": False, "anomaly_score": 0, "anomaly_factors": []}
    features = dict(zip(["denial_rate", "denial_count", "payment_count", "avg_payment_amount", "adtp_deviation", "claim_volume"], [float(row[0] or 0), int(row[1] or 0), int(row[2] or 0), float(row[3] or 0), float(row[4] or 0), int(row[5] or 0)]))
    try:
        model._load()
    except Exception:
        await model.train(db)
    return model.predict(features)

async def _run_propensity(db, claim_id):
    from app.ml.propensity_to_pay import PropensityToPayModel
    from sqlalchemy import text
    result = await db.execute(text("SELECT patient_id FROM claims WHERE claim_id = :cid"), {"cid": claim_id})
    row = result.fetchone()
    if not row:
        return {"probability": 0.5, "risk_tier": "UNKNOWN"}
    model = PropensityToPayModel()
    return await model.predict_patient(db, row[0])

async def _run_write_off(db, claim_id):
    from app.ml.write_off_model import WriteOffModel
    return await WriteOffModel().predict_claim(db, claim_id)

async def _run_provider_risk(db, provider_id):
    from app.ml.provider_risk import ProviderRiskModel
    return await ProviderRiskModel().score_provider(db, provider_id)

async def _run_carc_prediction(db, claim_id):
    from app.ml.carc_prediction import CARCPredictionModel
    return await CARCPredictionModel().predict_claim(db, claim_id)

async def _run_composite(db, claim_id, denial_prob_result):
    from app.ml.composite_scores import CompositeScoreEngine
    from sqlalchemy import text
    result = await db.execute(text("SELECT total_charges, adtp_days FROM claims c JOIN payer_master pm ON pm.payer_id = c.payer_id WHERE c.claim_id = :cid"), {"cid": claim_id})
    row = result.fetchone()
    if not row:
        return {}
    return CompositeScoreEngine.claim_expected_net_revenue(denial_prob_result.get("probability", 0.15), float(row[0] or 0), float(row[1] or 30))
