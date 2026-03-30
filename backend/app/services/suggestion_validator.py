"""
Suggestion Validator — Sprint 18
==================================
Validates automation suggestions before execution by calling MiroFish
agent swarm for independent validation. Graceful degradation when
MiroFish is unavailable (3-second timeout).

Entry point:
  validate_suggestion(db, suggestion, claim_context) -> dict
"""

import asyncio
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

MIROFISH_VALIDATION_TIMEOUT = 5.0  # seconds


async def validate_suggestion(
    db: AsyncSession,
    suggestion: dict,
    claim_context: dict,
) -> dict:
    """Validate an automation suggestion before execution.

    Calls MiroFish for validation with 3s timeout. Graceful degradation
    when MiroFish is unavailable — returns a pass-through result so the
    pipeline is never blocked.

    Args:
        db: Async database session (available for future DB-based checks).
        suggestion: The suggestion dict with keys like action, confidence,
                    category, estimated_impact, etc.
        claim_context: Context about the claim/denial being processed.

    Returns:
        dict with keys:
            validated (bool): Whether the suggestion passed validation.
            confidence_adjustment (float): Amount to adjust confidence by.
            validation_notes (str): Human-readable validation summary.
            risk_flags (list[str]): Any risk flags identified.
    """
    # Default pass-through result (MiroFish unavailable)
    default_result = {
        "validated": True,
        "confidence_adjustment": 0.0,
        "validation_notes": "MiroFish unavailable — suggestion accepted without agent validation",
        "risk_flags": [],
    }

    try:
        from app.services.mirofish_bridge import query_mirofish_for_rca

        from app.services.ml_enrichment import build_mirofish_context

        enriched_claim_context, ml_intelligence = await asyncio.wait_for(
            build_mirofish_context(
                db=db,
                denial_id=claim_context.get("denial_id", ""),
                claim_id=claim_context.get("claim_id", ""),
                payer_id=claim_context.get("payer_id", ""),
                provider_id=claim_context.get("provider_id", ""),
                suggestion=suggestion,
                rca_result=claim_context.get("rca_result"),
                appeal_prediction=claim_context.get("appeal_prediction"),
            ),
            timeout=MIROFISH_VALIDATION_TIMEOUT,
        )

        mirofish_result = await asyncio.wait_for(
            query_mirofish_for_rca(enriched_claim_context, ml_intelligence),
            timeout=MIROFISH_VALIDATION_TIMEOUT,
        )

        # Interpret MiroFish response
        agent_agrees = mirofish_result.get("agent_agrees")
        agent_reasoning = mirofish_result.get("agent_reasoning", "")
        confidence_adj = mirofish_result.get("confidence_adjustment", 0)

        risk_flags = []

        if agent_agrees is True:
            # MiroFish agents validated the suggestion
            # Clamp positive adjustment to +5..+15
            adj = max(5.0, min(float(confidence_adj), 15.0))
            return {
                "validated": True,
                "confidence_adjustment": adj,
                "validation_notes": f"MiroFish agents validated suggestion. {agent_reasoning[:150]}",
                "risk_flags": [],
            }
        elif agent_agrees is False:
            # MiroFish agents rejected the suggestion
            alt_cause = mirofish_result.get("alternative_cause")
            if alt_cause:
                risk_flags.append(f"Alternative cause suggested: {alt_cause}")
            risk_flags.append("MiroFish agent swarm rejected this suggestion")
            return {
                "validated": False,
                "confidence_adjustment": max(-15.0, min(float(confidence_adj), -5.0)),
                "validation_notes": f"MiroFish agents rejected suggestion. {agent_reasoning[:150]}",
                "risk_flags": risk_flags,
            }
        else:
            # MiroFish returned no verdict — treat as inconclusive, pass through
            return {
                "validated": True,
                "confidence_adjustment": 0.0,
                "validation_notes": f"MiroFish inconclusive. {agent_reasoning[:100]}",
                "risk_flags": ["MiroFish returned no verdict — proceeding with caution"],
            }

    except asyncio.TimeoutError:
        logger.warning("MiroFish suggestion validation timed out (%.1fs)", MIROFISH_VALIDATION_TIMEOUT)
        return {
            "validated": True,
            "confidence_adjustment": 0.0,
            "validation_notes": "MiroFish validation timed out — suggestion accepted without agent validation",
            "risk_flags": ["validation_timeout"],
        }
    except ImportError:
        logger.debug("MiroFish bridge not available — skipping suggestion validation")
        return default_result
    except Exception as exc:
        logger.warning("Suggestion validation failed: %s", exc)
        return default_result
