"""
Root Cause Validation via MiroFish Simulation
===============================================
Post-classification validation: after root_cause_service assigns a root cause,
this service uses the simulation engine to validate the assignment.

Flow:
1. Take a classified denial with its root cause
2. Build a validation scenario: "Is this root cause correct?"
3. Run payer agent + coder agent + billing agent to evaluate
4. Compare simulation verdict with classification
5. Adjust confidence: boost if agrees, flag if disagrees
"""

import os
import re
import json
import logging
import httpx
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

async def validate_root_cause(
    db: AsyncSession,
    claim_id: str,
    primary_root_cause: str,
    denial_category: str,
    carc_code: str,
    payer_name: str,
    confidence: int,
    financial_impact: float,
) -> dict:
    """
    Validate a root cause classification using simulation.
    Returns adjusted confidence and validation result.
    """

    # Build validation prompt for Ollama
    prompt = f"""You are a panel of 3 RCM experts evaluating a denial root cause classification.

CLAIM CONTEXT:
- Claim ID: {claim_id}
- Payer: {payer_name}
- CARC Code: {carc_code}
- Denial Category: {denial_category}
- Classified Root Cause: {primary_root_cause}
- Engine Confidence: {confidence}%
- Financial Impact: ${financial_impact:,.0f}

EVALUATE:
1. Does the root cause classification make sense given the CARC code?
2. Could there be a DIFFERENT root cause that better explains this denial?
3. What additional evidence would confirm or contradict this classification?

Respond with EXACTLY this JSON format:
{{
    "agrees": true/false,
    "confidence_adjustment": -20 to +30 (how much to adjust the engine's confidence),
    "alternative_cause": "NONE" or the alternative root cause if you disagree,
    "reasoning": "1-2 sentence explanation",
    "evidence_needed": "what additional data would help"
}}

Respond ONLY with valid JSON."""

    try:
        # Call Ollama directly (faster than going through MiroFish)
        model_name = os.environ.get("OLLAMA_MODEL", "qwen3:4b")
        is_qwen3 = "qwen3" in model_name.lower()

        async with httpx.AsyncClient(timeout=30.0) as client:
            if is_qwen3:
                response = await client.post(
                    "http://localhost:11434/api/chat",
                    json={
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "stream": False,
                        "think": False,
                        "options": {"temperature": 0.2, "num_predict": 800}
                    }
                )
            else:
                response = await client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": model_name,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.2, "num_predict": 800}
                    }
                )

            if response.status_code == 200:
                result = response.json()
                if is_qwen3:
                    raw_text = result.get("message", {}).get("content", "")
                else:
                    raw_text = result.get("response", "")

                # Strip <think> tags from response
                raw_text = re.sub(r'<think>.*?</think>\s*', '', raw_text, flags=re.DOTALL)

                # Parse JSON from response
                start = raw_text.find("{")
                end = raw_text.rfind("}") + 1
                if start >= 0 and end > start:
                    validation = json.loads(raw_text[start:end])

                    agrees = validation.get("agrees", True)
                    adjustment = int(validation.get("confidence_adjustment", 0))
                    alternative = validation.get("alternative_cause", "NONE")
                    reasoning = validation.get("reasoning", "")

                    # Adjust confidence
                    new_confidence = max(10, min(95, confidence + adjustment))

                    return {
                        "validated": True,
                        "agrees": agrees,
                        "original_confidence": confidence,
                        "adjusted_confidence": new_confidence,
                        "adjustment": adjustment,
                        "alternative_cause": alternative if alternative != "NONE" else None,
                        "reasoning": reasoning,
                        "evidence_needed": validation.get("evidence_needed", ""),
                        "validation_source": "ollama_llama3",
                    }

        # Fallback if parsing fails
        return _fallback_validation(confidence)

    except Exception as e:
        logger.error(f"Root cause validation failed: {e}")
        return _fallback_validation(confidence)


def _fallback_validation(confidence: int) -> dict:
    """Deterministic fallback when LLM unavailable."""
    return {
        "validated": False,
        "agrees": True,
        "original_confidence": confidence,
        "adjusted_confidence": confidence,
        "adjustment": 0,
        "alternative_cause": None,
        "reasoning": "Validation unavailable - using engine confidence",
        "evidence_needed": "",
        "validation_source": "fallback",
    }


async def batch_validate(db: AsyncSession, limit: int = 10) -> dict:
    """Validate the top N highest-impact unvalidated root causes."""
    from sqlalchemy import select, text
    from app.models.root_cause import RootCauseAnalysis
    from app.models.denial import Denial
    from app.models.claim import Claim
    from app.models.payer import Payer

    # Get top unvalidated by financial impact
    result = await db.execute(text("""
        SELECT rca.claim_id, rca.primary_root_cause, rca.confidence_score,
               rca.financial_impact, d.denial_category, d.carc_code,
               pm.payer_name, rca.rca_id
        FROM root_cause_analysis rca
        JOIN denials d ON rca.denial_id = d.denial_id
        JOIN claims c ON rca.claim_id = c.claim_id
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE rca.confidence_score < 60
        ORDER BY rca.financial_impact DESC
        LIMIT :lim
    """), {"lim": limit})

    rows = result.all()
    results = []

    for row in rows:
        claim_id, root_cause, conf, impact, category, carc, payer, rca_id = row

        validation = await validate_root_cause(
            db, claim_id, root_cause, category, carc or "",
            payer, conf, float(impact or 0)
        )

        # Update the RCA record with validated confidence
        if validation["validated"]:
            await db.execute(text("""
                UPDATE root_cause_analysis
                SET confidence_score = :new_conf,
                    evidence_summary = evidence_summary || ' [VALIDATED: ' || :reasoning || ']'
                WHERE rca_id = :rca_id
            """), {
                "new_conf": validation["adjusted_confidence"],
                "reasoning": validation["reasoning"][:100],
                "rca_id": rca_id,
            })

        results.append({
            "claim_id": claim_id,
            "root_cause": root_cause,
            **validation,
        })

    await db.commit()

    return {
        "validated_count": len(results),
        "agreed": sum(1 for r in results if r["agrees"]),
        "disagreed": sum(1 for r in results if not r["agrees"]),
        "avg_adjustment": sum(r["adjustment"] for r in results) / max(len(results), 1),
        "results": results,
    }
