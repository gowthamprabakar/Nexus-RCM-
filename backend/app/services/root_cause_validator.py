"""
Root Cause Validation via Qwen3 Expert Panel
"""
import os
import re
import json
import asyncio
import logging
import httpx
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

try:
    from app.services.root_cause_service import ROOT_CAUSE_GROUPS as _VALID_ROOT_CAUSES
except ImportError:
    _VALID_ROOT_CAUSES = {
        "ELIGIBILITY_LAPSE", "AUTH_MISSING", "AUTH_EXPIRED", "TIMELY_FILING_MISS",
        "CODING_MISMATCH", "COB_ORDER_ERROR", "BUNDLING_ERROR", "DUPLICATE_CLAIM",
        "MODIFIER_MISMATCH", "DOCUMENTATION_DEFICIT", "PROCESS_BREAKDOWN",
        "PAYER_BEHAVIOR_SHIFT", "CONTRACT_RATE_GAP", "MEDICAL_NECESSITY",
        "PROVIDER_ENROLLMENT",
    }

_validator_semaphore = asyncio.Semaphore(3)


async def validate_root_cause(db, claim_id, primary_root_cause, denial_category, carc_code, payer_name, confidence, financial_impact):
    valid_causes_str = ", ".join(sorted(_VALID_ROOT_CAUSES))
    prompt = f"""You are a panel of 3 RCM experts evaluating a denial root cause classification.

CLAIM CONTEXT:
- Claim ID: {claim_id}
- Payer: {payer_name}
- CARC Code: {carc_code}
- Denial Category: {denial_category}
- Classified Root Cause: {primary_root_cause}
- Engine Confidence: {confidence}%
- Financial Impact: ${financial_impact:,.0f}

VALID ROOT CAUSE VALUES (you MUST use one of these exactly if you disagree):
{valid_causes_str}

EVALUATE:
1. Does the root cause classification make sense given the CARC code and denial category?
2. Could there be a DIFFERENT root cause from the valid list above that better explains this denial?
3. What additional evidence would confirm or contradict this classification?

Respond with EXACTLY this JSON format:
{{"agrees": true/false, "confidence_adjustment": integer between -20 and 30, "alternative_cause": "NONE" or one value from the VALID ROOT CAUSE VALUES list above, "reasoning": "1-2 sentence explanation referencing the CARC code", "evidence_needed": "what additional data would strengthen this classification"}}

Respond ONLY with valid JSON. No explanation before or after."""

    try:
        model_name = os.environ.get("OLLAMA_MODEL", "qwen3:4b")
        is_qwen3 = "qwen3" in model_name.lower()

        async with _validator_semaphore:
            async with httpx.AsyncClient(timeout=30.0) as client:
                if is_qwen3:
                    response = await client.post("http://localhost:11434/api/chat", json={
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "stream": False, "think": False,
                        "options": {"temperature": 0.2, "num_predict": 800},
                    })
                else:
                    response = await client.post("http://localhost:11434/api/generate", json={
                        "model": model_name, "prompt": prompt, "stream": False,
                        "options": {"temperature": 0.2, "num_predict": 800},
                    })

        if response.status_code == 200:
            result = response.json()
            raw_text = result.get("message", {}).get("content", "") if is_qwen3 else result.get("response", "")
            raw_text = re.sub(r"<think>.*?</think>\s*", "", raw_text, flags=re.DOTALL)
            start = raw_text.find("{")
            end = raw_text.rfind("}") + 1
            if start >= 0 and end > start:
                validation = json.loads(raw_text[start:end])
                agrees = bool(validation.get("agrees", True))
                adjustment = int(validation.get("confidence_adjustment", 0))
                alternative = validation.get("alternative_cause", "NONE")
                reasoning = validation.get("reasoning", "")

                if alternative and alternative != "NONE":
                    if alternative not in _VALID_ROOT_CAUSES:
                        logger.warning("validate_root_cause: invalid alternative_cause '%s' for claim %s", alternative, claim_id)
                        alternative = None
                else:
                    alternative = None

                new_confidence = max(10, min(95, confidence + adjustment))
                return {
                    "validated": True, "agrees": agrees,
                    "original_confidence": confidence, "adjusted_confidence": new_confidence,
                    "adjustment": adjustment, "alternative_cause": alternative,
                    "reasoning": reasoning, "evidence_needed": validation.get("evidence_needed", ""),
                    "validation_source": "qwen3" if is_qwen3 else "ollama",
                }
        return _fallback_validation(confidence)
    except Exception as e:
        logger.error("Root cause validation failed for claim %s: %s", claim_id, e)
        return _fallback_validation(confidence)


def _fallback_validation(confidence):
    return {
        "validated": False, "agrees": True,
        "original_confidence": confidence, "adjusted_confidence": confidence,
        "adjustment": 0, "alternative_cause": None,
        "reasoning": "Validation unavailable — using engine confidence",
        "evidence_needed": "", "validation_source": "fallback",
    }


async def batch_validate(db, limit=10):
    from sqlalchemy import text
    result = await db.execute(text("""
        SELECT rca.claim_id, rca.primary_root_cause, rca.confidence_score,
               rca.financial_impact, d.denial_category, d.carc_code,
               pm.payer_name, rca.rca_id
        FROM root_cause_analysis rca
        JOIN denials d ON rca.denial_id = d.denial_id
        JOIN claims c ON rca.claim_id = c.claim_id
        JOIN payer_master pm ON c.payer_id = pm.payer_id
        WHERE rca.confidence_score < 60
          AND (rca.evidence_summary IS NULL OR rca.evidence_summary NOT LIKE '%[VALIDATED:%')
        ORDER BY rca.financial_impact DESC LIMIT :lim
    """), {"lim": limit})

    rows = result.all()
    validated_results = []
    skipped = 0

    for row in rows:
        claim_id, root_cause, conf, impact, category, carc, payer, rca_id = row
        validation = await validate_root_cause(db, claim_id, root_cause, category, carc or "", payer, int(conf or 0), float(impact or 0))

        if validation["validated"]:
            await db.execute(text("""
                UPDATE root_cause_analysis
                SET confidence_score = :new_conf,
                    evidence_summary = COALESCE(evidence_summary, '') || ' [VALIDATED: ' || :reasoning || ']'
                WHERE rca_id = :rca_id
            """), {"new_conf": validation["adjusted_confidence"], "reasoning": validation["reasoning"][:100], "rca_id": rca_id})
            validated_results.append({"claim_id": claim_id, "root_cause": root_cause, **validation})
        else:
            skipped += 1
            logger.debug("batch_validate: skipping failed validation for claim %s", claim_id)

    total = len(validated_results)
    return {
        "validated_count": total, "skipped_count": skipped,
        "agreed": sum(1 for r in validated_results if r["agrees"]),
        "disagreed": sum(1 for r in validated_results if not r["agrees"]),
        "avg_adjustment": sum(r["adjustment"] for r in validated_results) / max(total, 1),
        "results": validated_results,
    }
