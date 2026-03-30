"""
Prediction API Router — Sprint 11
==================================
GET  /predictions/denial-probability/{claim_id}  — denial risk for a claim
GET  /predictions/appeal-success/{denial_id}      — appeal win probability
POST /predictions/train/{model_name}              — trigger model training
GET  /predictions/models                          — list trained models
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.core.deps import get_db

router = APIRouter()

# Lazy-loaded model singletons
_denial_model = None
_appeal_model = None


def _get_denial_model():
    global _denial_model
    if _denial_model is None:
        from app.ml.denial_probability import DenialProbabilityModel
        _denial_model = DenialProbabilityModel()
        _denial_model.load()  # try loading saved model
    return _denial_model


def _get_appeal_model():
    global _appeal_model
    if _appeal_model is None:
        from app.ml.appeal_success import AppealSuccessModel
        _appeal_model = AppealSuccessModel()
        _appeal_model.load()
    return _appeal_model


@router.get("/denial-probability/{claim_id}")
async def predict_denial_probability(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Predict denial probability for a specific claim."""
    model = _get_denial_model()
    if not model.is_fitted:
        return {"error": "Model not trained. POST /predictions/train/denial-probability first."}
    try:
        result = await model.predict_claim(db, claim_id)
        return {"claim_id": claim_id, **result}
    except Exception as e:
        return {"error": str(e), "claim_id": claim_id}


@router.get("/appeal-success/{denial_id}")
async def predict_appeal_success(
    denial_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Predict appeal success probability for a specific denial."""
    model = _get_appeal_model()
    if not model.is_fitted:
        return {"error": "Model not trained. POST /predictions/train/appeal-success first."}
    try:
        result = await model.predict_denial(db, denial_id)
        return {"denial_id": denial_id, **result}
    except Exception as e:
        return {"error": str(e), "denial_id": denial_id}


@router.post("/train/{model_name}")
async def train_model(
    model_name: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Train or retrain a prediction model."""
    global _denial_model, _appeal_model

    if model_name == "denial-probability":
        from app.ml.denial_probability import DenialProbabilityModel
        _denial_model = DenialProbabilityModel()
        metrics = await _denial_model.train(db)
        return {"model": model_name, "status": "trained", "metrics": metrics}

    elif model_name == "appeal-success":
        from app.ml.appeal_success import AppealSuccessModel
        _appeal_model = AppealSuccessModel()
        metrics = await _appeal_model.train(db)
        return {"model": model_name, "status": "trained", "metrics": metrics}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown model: {model_name}. Use: denial-probability, appeal-success")


@router.get("/models")
async def list_models() -> Any:
    """List all available prediction models and their status."""
    models = []
    for name, getter in [("denial-probability", _get_denial_model), ("appeal-success", _get_appeal_model)]:
        try:
            m = getter()
            models.append({
                "name": name,
                "is_fitted": m.is_fitted,
                "metrics": getattr(m, "training_metrics", None),
            })
        except Exception:
            models.append({"name": name, "is_fitted": False, "metrics": None})
    return {"models": models}


# ---------------------------------------------------------------------------
# Investigation & Pipeline endpoints (Sprint 14)
# ---------------------------------------------------------------------------

@router.get("/investigate/denial/{denial_id}")
async def investigate_denial(
    denial_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Run full investigation on a denial: RCA + Neo4j + ML predictions + suggestions."""
    try:
        from app.services.investigation_service import investigate_denial as _investigate
        result = await _investigate(db, denial_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/investigate/claim/{claim_id}")
async def investigate_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Run full investigation on a claim: denial risk + per-denial investigations."""
    try:
        from app.services.investigation_service import investigate_claim as _investigate
        result = await _investigate(db, claim_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/denial/{denial_id}")
async def run_denial_pipeline(
    denial_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Run full pipeline: investigate → suggest → validate → execute/queue."""
    try:
        from app.services.pipeline_orchestrator import run_denial_pipeline as _pipeline
        result = await _pipeline(db, denial_id)
        await db.commit()
        return result
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pipeline/claim/{claim_id}")
async def run_claim_pipeline(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Run full claim pipeline across all denials."""
    try:
        from app.services.pipeline_orchestrator import run_claim_pipeline as _pipeline
        result = await _pipeline(db, claim_id)
        await db.commit()
        return result
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/outcomes/summary")
async def outcome_summary(
    days: int = Query(90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get outcome summary for recent appeals/resubmissions."""
    try:
        from app.services.outcome_tracker import get_outcome_summary
        return await get_outcome_summary(db, days=days)
    except Exception as e:
        return {"error": str(e)}


@router.get("/outcomes/accuracy")
async def prediction_accuracy(
    days: int = Query(90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get prediction accuracy metrics."""
    try:
        from app.services.outcome_tracker import get_prediction_accuracy
        return await get_prediction_accuracy(db, days=days)
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# ML Prediction endpoints (Sprint 15+)
# ---------------------------------------------------------------------------

@router.get("/payment-delay/{claim_id}")
async def predict_payment_delay(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Predict expected payment delay for a claim."""
    try:
        from app.ml.payment_delay import PaymentDelayModel
        model = PaymentDelayModel()
        result = await model.predict_claim(db, claim_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payer-anomalies")
async def detect_payer_anomalies(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Detect anomalous payer behavior patterns."""
    try:
        from app.ml.payer_anomaly import PayerAnomalyModel
        model = PayerAnomalyModel()
        anomalies = await model.detect_anomalies(db)
        return {
            "anomalies": anomalies,
            "total": len(anomalies),
            "anomalous_count": sum(1 for a in anomalies if a.get("is_anomaly")),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/propensity-to-pay/{patient_id}")
async def predict_propensity(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Predict patient propensity to pay."""
    try:
        from app.ml.propensity_to_pay import PropensityToPayModel
        model = PropensityToPayModel()
        result = await model.predict_patient(db, patient_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/write-off-risk/{claim_id}")
async def predict_write_off(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Predict write-off risk for a claim."""
    try:
        from app.ml.write_off_model import WriteOffModel
        model = WriteOffModel()
        result = await model.predict_claim(db, claim_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/provider-risk/{provider_id}")
async def predict_provider_risk(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Score provider risk level."""
    try:
        from app.ml.provider_risk import ProviderRiskModel
        model = ProviderRiskModel()
        result = await model.score_provider(db, provider_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/provider-risk-all")
async def predict_provider_risk_all(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Score all providers."""
    try:
        from app.ml.provider_risk import ProviderRiskModel
        model = ProviderRiskModel()
        results = await model.score_all_providers(db)
        return {"providers": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/carc-prediction/{claim_id}")
async def predict_carc(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Predict CARC (Claim Adjustment Reason Code) for a claim."""
    try:
        from app.ml.carc_prediction import CARCPredictionModel
        model = CARCPredictionModel()
        result = await model.predict_claim(db, claim_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/composite/claim-value/{claim_id}")
async def get_claim_value(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Compute composite expected net revenue for a claim."""
    try:
        from app.ml.composite_scores import CompositeScoreEngine
        from app.ml.denial_probability import DenialProbabilityModel
        from sqlalchemy import text

        # Get denial probability
        model_loaded = True
        try:
            dm = DenialProbabilityModel()
            denial_result = await dm.predict_claim(db, claim_id)
            denial_prob = denial_result.get("probability", 0.15)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning(
                "Denial model unavailable for claim %s, using fallback: %s", claim_id, exc
            )
            denial_prob = 0.15
            model_loaded = False

        # Get claim charges and payer ADTP
        r = await db.execute(text(
            "SELECT c.total_charges, pm.adtp_days FROM claims c "
            "JOIN payer_master pm ON pm.payer_id = c.payer_id "
            "WHERE c.claim_id = :cid"
        ), {"cid": claim_id})
        row = r.fetchone()
        if not row:
            raise HTTPException(404, f"Claim {claim_id} not found")

        cs = CompositeScoreEngine()
        result = cs.claim_expected_net_revenue(denial_prob, float(row[0]), float(row[1]))
        result["model_loaded"] = model_loaded
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/composite/payer-health/{payer_id}")
async def get_payer_health(
    payer_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Compute composite payer health score."""
    try:
        from app.ml.composite_scores import CompositeScoreEngine
        from sqlalchemy import text

        # Get payer base data
        r = await db.execute(text(
            "SELECT denial_rate, adtp_days FROM payer_master WHERE payer_id = :pid"
        ), {"pid": payer_id})
        row = r.fetchone()
        if not row:
            raise HTTPException(404, f"Payer {payer_id} not found")

        denial_rate = float(row[0] or 0.10)

        # Compute payment_consistency from era_payments
        pc_result = await db.execute(text("""
            SELECT
                CASE WHEN COUNT(*) = 0 THEN 0.95
                ELSE 1.0 - COUNT(CASE WHEN payment_amount <= 0 THEN 1 END)::float
                     / GREATEST(COUNT(*), 1)
                END AS payment_consistency
            FROM era_payments ep
            JOIN claims c ON c.claim_id = ep.claim_id
            WHERE c.payer_id = :pid
        """), {"pid": payer_id})
        pc_row = pc_result.fetchone()
        payment_consistency = float(pc_row[0]) if pc_row else 0.95

        # Compute underpayment_rate from era_payments vs claims
        ur_result = await db.execute(text("""
            SELECT
                CASE WHEN COUNT(*) = 0 THEN 0.02
                ELSE COUNT(CASE WHEN ep.payment_amount < c.total_charges * 0.5 THEN 1 END)::float
                     / GREATEST(COUNT(*), 1)
                END AS underpayment_rate
            FROM era_payments ep
            JOIN claims c ON c.claim_id = ep.claim_id
            WHERE c.payer_id = :pid AND ep.payment_amount > 0
        """), {"pid": payer_id})
        ur_row = ur_result.fetchone()
        underpayment_rate = float(ur_row[0]) if ur_row else 0.02

        # Compute adtp_trend from recent vs historical ADTP
        adtp_result = await db.execute(text("""
            SELECT
                COALESCE(AVG(CASE WHEN ep.payment_date >= CURRENT_DATE - 90
                    THEN ep.payment_date - c.date_of_service END), 0) AS recent_adtp,
                COALESCE(AVG(CASE WHEN ep.payment_date < CURRENT_DATE - 90
                    THEN ep.payment_date - c.date_of_service END), 0) AS historical_adtp
            FROM era_payments ep
            JOIN claims c ON c.claim_id = ep.claim_id
            WHERE c.payer_id = :pid
        """), {"pid": payer_id})
        adtp_row = adtp_result.fetchone()
        if adtp_row and adtp_row[1]:
            adtp_trend = float(adtp_row[0] or 0) - float(adtp_row[1] or 0)
        else:
            adtp_trend = 0.0

        cs = CompositeScoreEngine()
        return cs.payer_health_score(
            denial_rate=denial_rate,
            adtp_trend=adtp_trend,
            payment_consistency=payment_consistency,
            underpayment_rate=underpayment_rate,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/composite/org-health")
async def get_org_health(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Compute composite organization revenue health score."""
    try:
        from app.ml.composite_scores import CompositeScoreEngine
        from sqlalchemy import text

        # Get org-level metrics
        r = await db.execute(text("""
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'DENIED' THEN 1 END) as denied,
                COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid,
                AVG(CURRENT_DATE - date_of_service) as avg_days_ar
            FROM claims
        """))
        row = r.fetchone()
        total = float(row[0] or 1)
        denial_rate = float(row[1] or 0) / total
        paid_rate = float(row[2] or 0) / total
        days_ar = float(row[3] or 35)

        cs = CompositeScoreEngine()
        return cs.org_revenue_health_score(
            ncr=paid_rate,
            denial_rate=denial_rate,
            days_in_ar=days_ar,
            cost_to_collect=0.05,
            first_pass_rate=1 - denial_rate,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-governance/status")
async def get_model_governance_status() -> Any:
    """Get governance status for all registered ML models."""
    try:
        from app.ml.model_governance import ModelGovernance
        gov = ModelGovernance()
        return {"models": gov.get_status()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
