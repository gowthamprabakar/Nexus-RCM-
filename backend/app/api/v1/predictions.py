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
