"""Suggestion Validator — Sprint 18"""
import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

_ML_CONTEXT_TIMEOUT = 20.0
_MIROFISH_CALL_TIMEOUT = 10.0

async def validate_suggestion(db: AsyncSession, suggestion: dict, claim_context: dict) -> dict:
    default_result = {"validated": True, "confidence_adjustment": 0.0,
                      "validation_notes": "MiroFish unavailable", "risk_flags": []}
    try:
        from app.services.mirofish_bridge import query_mirofish_for_rca
        from app.services.ml_enrichment import build_mirofish_context

        try:
            enriched_claim_context, ml_intelligence = await asyncio.wait_for(
                build_mirofish_context(db=db, denial_id=claim_context.get("denial_id", ""),
                    claim_id=claim_context.get("claim_id", ""), payer_id=claim_context.get("payer_id", ""),
                    provider_id=claim_context.get("provider_id", ""), suggestion=suggestion,
                    rca_result=claim_context.get("rca_result"), appeal_prediction=claim_context.get("appeal_prediction")),
                timeout=_ML_CONTEXT_TIMEOUT)
        except asyncio.TimeoutError:
            logger.warning("ML context build timed out (%.1fs)", _ML_CONTEXT_TIMEOUT)
            enriched_claim_context = claim_context
            ml_intelligence = {"validation_mode": True, "fallback": True}

        mirofish_result = await asyncio.wait_for(
            query_mirofish_for_rca(enriched_claim_context, ml_intelligence),
            timeout=_MIROFISH_CALL_TIMEOUT)

        agent_agrees = mirofish_result.get("agent_agrees")
        agent_reasoning = mirofish_result.get("agent_reasoning", "")
        confidence_adj = mirofish_result.get("confidence_adjustment", 0)

        if agent_agrees is True:
            return {"validated": True, "confidence_adjustment": max(5.0, min(float(confidence_adj), 15.0)),
                    "validation_notes": f"MiroFish validated. {agent_reasoning[:150]}", "risk_flags": []}
        elif agent_agrees is False:
            flags = ["MiroFish rejected suggestion"]
            alt = mirofish_result.get("alternative_cause")
            if alt: flags.append(f"Alternative: {alt}")
            return {"validated": False, "confidence_adjustment": max(-15.0, min(float(confidence_adj), -5.0)),
                    "validation_notes": f"MiroFish rejected. {agent_reasoning[:150]}", "risk_flags": flags}
        else:
            return {"validated": True, "confidence_adjustment": 0.0,
                    "validation_notes": f"MiroFish inconclusive. {agent_reasoning[:100]}",
                    "risk_flags": ["MiroFish no verdict"]}

    except asyncio.TimeoutError:
        logger.warning("MiroFish call timed out (%.1fs)", _MIROFISH_CALL_TIMEOUT)
        return {"validated": True, "confidence_adjustment": 0.0,
                "validation_notes": "MiroFish timed out", "risk_flags": ["validation_timeout"]}
    except ImportError:
        return default_result
    except Exception as exc:
        logger.warning("Suggestion validation failed: %s", exc)
        return default_result
