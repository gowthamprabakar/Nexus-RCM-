"""
Pipeline Orchestrator — Sprint 14.3
=====================================
Full pipeline: investigate → suggest → validate → execute/queue

Ties together investigation_service, automation_engine, and action_executor
into a single end-to-end flow.

Entry points:
  run_denial_pipeline(db, denial_id) -> dict
  run_claim_pipeline(db, claim_id) -> dict
  run_batch_pipeline(db, denial_ids) -> dict
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

CONFIDENCE_AUTO_EXECUTE_THRESHOLD = 85
BATCH_MAX_DEFAULT = 50
BATCH_TIMEOUT_SECONDS = 30


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _gen_action_id() -> str:
    return f"ACT-{uuid4().hex[:8].upper()}"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _safe_json(obj) -> str:
    """JSON-serialise with a fallback for non-serialisable values."""
    try:
        return json.dumps(obj, default=str)
    except Exception:
        return "{}"


# ---------------------------------------------------------------------------
# Investigation helpers (lazy-import + fallback)
# ---------------------------------------------------------------------------

async def _investigate_denial(db: AsyncSession, denial_id: str) -> dict:
    """
    Attempt to call investigation_service.investigate_denial().
    Falls back to root_cause_service.analyze_denial_root_cause() if the
    investigation service does not exist yet.
    """
    # Try the dedicated investigation service first
    try:
        from app.services.investigation_service import investigate_denial
        return await investigate_denial(db, denial_id)
    except ImportError:
        pass

    # Fallback: root cause analysis
    try:
        from app.services.root_cause_service import analyze_denial_root_cause
        rca = await analyze_denial_root_cause(db, denial_id)
        # Normalise into the shape the pipeline expects
        suggestions = _rca_to_suggestions(rca)
        return {
            "denial_id": denial_id,
            "investigation": rca,
            "suggestions": suggestions,
        }
    except Exception as exc:
        logger.error("Investigation fallback failed for denial %s: %s", denial_id, exc)
        return {
            "denial_id": denial_id,
            "investigation": None,
            "suggestions": [],
            "error": str(exc),
        }


async def _investigate_claim(db: AsyncSession, claim_id: str) -> dict:
    """
    Attempt to call investigation_service.investigate_claim().
    Falls back to root_cause_service.get_claim_root_cause() if the
    investigation service does not exist yet.
    """
    # Try the dedicated investigation service first
    try:
        from app.services.investigation_service import investigate_claim
        return await investigate_claim(db, claim_id)
    except ImportError:
        pass

    # Fallback: root cause analysis on the claim level
    try:
        from app.services.root_cause_service import get_claim_root_cause
        rca = await get_claim_root_cause(db, claim_id)
        denial_ids = rca.get("denial_ids", [])
        suggestions = _rca_to_suggestions(rca)
        return {
            "claim_id": claim_id,
            "denial_ids": denial_ids,
            "investigation": rca,
            "suggestions": suggestions,
        }
    except Exception as exc:
        logger.error("Investigation fallback failed for claim %s: %s", claim_id, exc)
        return {
            "claim_id": claim_id,
            "denial_ids": [],
            "investigation": None,
            "suggestions": [],
            "error": str(exc),
        }


def _rca_to_suggestions(rca: dict) -> list[dict]:
    """
    Convert a root-cause-analysis result dict into a list of normalised
    suggestion dicts that the pipeline can process.

    Expected suggestion shape:
        {
            "action":           str,   # human-readable action description
            "confidence":       int,   # 0-100
            "requires_approval": bool,
            "rule_id":          str | None,
            "category":         str,
            "estimated_impact": float,
            "affected_claims":  int,
            "metadata":         dict,
        }
    """
    suggestions: list[dict] = []

    # Pull from recommendations / suggested_actions / actions keys
    raw_suggestions = (
        rca.get("recommendations", [])
        or rca.get("suggested_actions", [])
        or rca.get("actions", [])
    )

    if isinstance(raw_suggestions, list):
        for idx, item in enumerate(raw_suggestions):
            if isinstance(item, str):
                suggestions.append({
                    "action": item,
                    "confidence": rca.get("confidence_score", 70),
                    "requires_approval": True,
                    "rule_id": None,
                    "category": rca.get("category", "GENERAL"),
                    "estimated_impact": float(rca.get("financial_impact", 0) or 0),
                    "affected_claims": 1,
                    "metadata": {},
                })
            elif isinstance(item, dict):
                suggestions.append({
                    "action": item.get("action") or item.get("description") or item.get("text", f"Suggestion {idx + 1}"),
                    "confidence": int(item.get("confidence") or item.get("confidence_score") or rca.get("confidence_score", 70)),
                    "requires_approval": item.get("requires_approval", True),
                    "rule_id": item.get("rule_id"),
                    "category": item.get("category") or rca.get("category", "GENERAL"),
                    "estimated_impact": float(item.get("estimated_impact") or item.get("impact", 0) or 0),
                    "affected_claims": int(item.get("affected_claims", 1)),
                    "metadata": item.get("metadata", {}),
                })

    # If the RCA itself has a primary_root_cause but no suggestions, create one
    if not suggestions and rca.get("primary_root_cause"):
        suggestions.append({
            "action": f"Address root cause: {rca['primary_root_cause']}",
            "confidence": int(rca.get("confidence_score", 60)),
            "requires_approval": True,
            "rule_id": None,
            "category": rca.get("category", "ROOT_CAUSE"),
            "estimated_impact": float(rca.get("financial_impact", 0) or 0),
            "affected_claims": 1,
            "metadata": {"primary_root_cause": rca["primary_root_cause"]},
        })

    return suggestions


# ---------------------------------------------------------------------------
# Suggestion → AutomationAction persistence
# ---------------------------------------------------------------------------

async def _persist_action(
    db: AsyncSession,
    denial_id: str,
    suggestion: dict,
    *,
    auto_execute: bool,
) -> dict:
    """
    Create an AutomationAction row from a suggestion dict.

    Returns a result dict with the action details and execution outcome
    (if auto-executed).
    """
    from app.models.automation import AutomationAction

    action_id = _gen_action_id()

    should_auto = (
        auto_execute
        and suggestion.get("confidence", 0) >= CONFIDENCE_AUTO_EXECUTE_THRESHOLD
        and not suggestion.get("requires_approval", True)
    )

    status = "EXECUTED" if should_auto else "PENDING"

    action = AutomationAction(
        action_id=action_id,
        rule_id=suggestion.get("rule_id") or "PIPELINE",
        rule_name=suggestion.get("category", "Pipeline suggestion"),
        trigger_type="pipeline_investigation",
        trigger_data=_safe_json({
            "denial_id": denial_id,
            "category": suggestion.get("category"),
            "confidence": suggestion.get("confidence"),
        }),
        suggested_action=str(suggestion.get("action", ""))[:500],
        affected_claims=suggestion.get("affected_claims", 1),
        estimated_impact=round(suggestion.get("estimated_impact", 0), 2),
        confidence=suggestion.get("confidence", 0),
        status=status,
        executed_at=_now() if should_auto else None,
        outcome="Auto-executed by pipeline" if should_auto else None,
    )

    db.add(action)

    result = {
        "action_id": action_id,
        "suggested_action": action.suggested_action,
        "confidence": action.confidence,
        "estimated_impact": action.estimated_impact,
        "status": status,
        "auto_executed": should_auto,
        "execution_result": None,
    }

    # If auto-executing, dispatch to the real action executor
    if should_auto:
        try:
            await db.flush()  # ensure row exists before executor reads it
            from app.services.action_executor import execute_real_action
            exec_result = await execute_real_action(db, action)
            result["execution_result"] = exec_result
            result["status"] = action.status  # may be EXECUTED or FAILED
        except Exception as exc:
            logger.error(
                "Auto-execution failed for action %s: %s", action_id, exc
            )
            action.status = "FAILED"
            action.outcome = f"Pipeline auto-exec error: {str(exc)[:150]}"
            result["status"] = "FAILED"
            result["execution_result"] = {"error": str(exc)}

    return result


# ---------------------------------------------------------------------------
# Public entry points
# ---------------------------------------------------------------------------

async def run_denial_pipeline(db: AsyncSession, denial_id: str) -> dict:
    """
    Full pipeline for a single denial:
      1. Investigate the denial (root cause analysis + suggestions)
      2. Create AutomationAction rows for each suggestion
      3. Auto-execute high-confidence actions; queue the rest as PENDING
      4. Return combined results
    """
    logger.info("Pipeline START for denial %s", denial_id)
    started = _now()

    # ── Step 1: Investigate ──────────────────────────────────────────────
    try:
        investigation = await _investigate_denial(db, denial_id)
    except Exception as exc:
        logger.error("Pipeline investigation failed for denial %s: %s", denial_id, exc)
        investigation = {
            "denial_id": denial_id,
            "investigation": None,
            "suggestions": [],
            "error": str(exc),
        }

    suggestions = investigation.get("suggestions", [])
    logger.info(
        "Pipeline: denial %s produced %d suggestion(s)", denial_id, len(suggestions)
    )

    # ── Step 2 + 3: Validate, persist actions, and auto-execute ──────────
    actions_created: list[dict] = []
    for suggestion in suggestions:
        try:
            # Validate suggestion via MiroFish before persisting
            try:
                from app.services.suggestion_validator import validate_suggestion

                claim_context = {
                    "denial_id": denial_id,
                    "claim_id": investigation.get("investigation", {}).get("claim_id", "") if investigation.get("investigation") else "",
                    "payer_id": investigation.get("investigation", {}).get("payer_id", "") if investigation.get("investigation") else "",
                    "denial_category": suggestion.get("category", ""),
                }
                validation = await validate_suggestion(db, suggestion, claim_context)

                if not validation.get("validated", True):
                    logger.info(
                        "Pipeline: suggestion skipped (validation failed) for denial %s: %s",
                        denial_id, validation.get("validation_notes", ""),
                    )
                    actions_created.append({
                        "suggested_action": str(suggestion.get("action", ""))[:200],
                        "status": "VALIDATION_REJECTED",
                        "auto_executed": False,
                        "validation_notes": validation.get("validation_notes", ""),
                        "risk_flags": validation.get("risk_flags", []),
                    })
                    continue

                # Adjust confidence based on validation
                adj = validation.get("confidence_adjustment", 0)
                if adj != 0:
                    original_conf = suggestion.get("confidence", 0)
                    suggestion["confidence"] = max(0, min(100, int(original_conf + adj)))
                    logger.debug(
                        "Pipeline: confidence adjusted %d -> %d for denial %s",
                        original_conf, suggestion["confidence"], denial_id,
                    )
            except Exception as val_exc:
                logger.warning(
                    "Pipeline: suggestion validation error for denial %s (proceeding anyway): %s",
                    denial_id, val_exc,
                )

            action_result = await _persist_action(
                db,
                denial_id,
                suggestion,
                auto_execute=True,
            )
            actions_created.append(action_result)
        except Exception as exc:
            logger.error(
                "Pipeline: failed to persist action for denial %s: %s",
                denial_id, exc,
            )
            actions_created.append({
                "error": str(exc),
                "suggestion": str(suggestion.get("action", ""))[:200],
            })

    # Flush all pending DB changes
    try:
        await db.flush()
    except Exception as exc:
        logger.error("Pipeline flush failed for denial %s: %s", denial_id, exc)

    elapsed = (_now() - started).total_seconds()

    auto_executed = [a for a in actions_created if a.get("auto_executed")]
    queued = [a for a in actions_created if a.get("status") == "PENDING"]

    result = {
        "denial_id": denial_id,
        "pipeline": "denial",
        "investigation": investigation.get("investigation"),
        "suggestions_count": len(suggestions),
        "actions_created": len(actions_created),
        "auto_executed_count": len(auto_executed),
        "queued_count": len(queued),
        "actions": actions_created,
        "elapsed_seconds": round(elapsed, 2),
        "error": investigation.get("error"),
    }

    logger.info(
        "Pipeline DONE for denial %s: %d actions (%d auto-exec, %d queued) in %.2fs",
        denial_id, len(actions_created), len(auto_executed), len(queued), elapsed,
    )

    return result


async def run_claim_pipeline(db: AsyncSession, claim_id: str) -> dict:
    """
    Full pipeline for a claim — investigates the claim, then processes
    each related denial's suggestions through the same flow.
    """
    logger.info("Pipeline START for claim %s", claim_id)
    started = _now()

    # ── Step 1: Investigate claim ────────────────────────────────────────
    try:
        investigation = await _investigate_claim(db, claim_id)
    except Exception as exc:
        logger.error("Pipeline claim investigation failed for %s: %s", claim_id, exc)
        investigation = {
            "claim_id": claim_id,
            "denial_ids": [],
            "investigation": None,
            "suggestions": [],
            "error": str(exc),
        }

    # ── Step 2: Validate and process claim-level suggestions ──────────────
    claim_suggestions = investigation.get("suggestions", [])
    actions_created: list[dict] = []

    for suggestion in claim_suggestions:
        try:
            # Validate suggestion via MiroFish before persisting
            try:
                from app.services.suggestion_validator import validate_suggestion

                claim_context = {
                    "claim_id": claim_id,
                    "payer_id": investigation.get("investigation", {}).get("payer_id", "") if investigation.get("investigation") else "",
                    "denial_category": suggestion.get("category", ""),
                }
                validation = await validate_suggestion(db, suggestion, claim_context)

                if not validation.get("validated", True):
                    logger.info(
                        "Pipeline: claim suggestion skipped (validation failed) for %s: %s",
                        claim_id, validation.get("validation_notes", ""),
                    )
                    actions_created.append({
                        "suggested_action": str(suggestion.get("action", ""))[:200],
                        "status": "VALIDATION_REJECTED",
                        "auto_executed": False,
                        "validation_notes": validation.get("validation_notes", ""),
                        "risk_flags": validation.get("risk_flags", []),
                    })
                    continue

                # Adjust confidence based on validation
                adj = validation.get("confidence_adjustment", 0)
                if adj != 0:
                    original_conf = suggestion.get("confidence", 0)
                    suggestion["confidence"] = max(0, min(100, int(original_conf + adj)))
            except Exception as val_exc:
                logger.warning(
                    "Pipeline: claim suggestion validation error for %s (proceeding anyway): %s",
                    claim_id, val_exc,
                )

            action_result = await _persist_action(
                db,
                f"claim:{claim_id}",
                suggestion,
                auto_execute=True,
            )
            actions_created.append(action_result)
        except Exception as exc:
            logger.error(
                "Pipeline: failed to persist claim-level action for %s: %s",
                claim_id, exc,
            )

    # ── Step 3: Process each denial through the denial pipeline ──────────
    denial_ids = investigation.get("denial_ids", [])
    denial_results: list[dict] = []

    for did in denial_ids:
        try:
            dr = await run_denial_pipeline(db, did)
            denial_results.append(dr)
            actions_created.extend(dr.get("actions", []))
        except Exception as exc:
            logger.error("Pipeline: sub-denial %s failed: %s", did, exc)
            denial_results.append({"denial_id": did, "error": str(exc)})

    # Flush
    try:
        await db.flush()
    except Exception as exc:
        logger.error("Pipeline claim flush failed for %s: %s", claim_id, exc)

    elapsed = (_now() - started).total_seconds()

    auto_executed = [a for a in actions_created if a.get("auto_executed")]
    queued = [a for a in actions_created if a.get("status") == "PENDING"]

    result = {
        "claim_id": claim_id,
        "pipeline": "claim",
        "investigation": investigation.get("investigation"),
        "denial_ids": denial_ids,
        "denial_results": denial_results,
        "suggestions_count": len(claim_suggestions) + sum(
            dr.get("suggestions_count", 0) for dr in denial_results
        ),
        "actions_created": len(actions_created),
        "auto_executed_count": len(auto_executed),
        "queued_count": len(queued),
        "actions": actions_created,
        "elapsed_seconds": round(elapsed, 2),
        "error": investigation.get("error"),
    }

    logger.info(
        "Pipeline DONE for claim %s: %d denials, %d actions (%d auto-exec, %d queued) in %.2fs",
        claim_id, len(denial_ids), len(actions_created),
        len(auto_executed), len(queued), elapsed,
    )

    return result


async def run_batch_pipeline(
    db: AsyncSession,
    denial_ids: list[str],
    max_batch: int = BATCH_MAX_DEFAULT,
) -> dict:
    """
    Run the denial pipeline for a batch of denials.

    Caps at *max_batch* (default 50) to avoid runaway processing.
    Applies a 30-second timeout to the entire batch.
    """
    logger.info(
        "Batch pipeline START: %d denial(s) requested (cap %d)",
        len(denial_ids), max_batch,
    )
    started = _now()

    # Enforce cap
    capped = False
    if len(denial_ids) > max_batch:
        logger.warning(
            "Batch pipeline: capping from %d to %d denials",
            len(denial_ids), max_batch,
        )
        denial_ids = denial_ids[:max_batch]
        capped = True

    individual_results: list[dict] = []
    total_actions = 0
    total_auto = 0
    total_queued = 0
    errors: list[str] = []

    async def _run_one(did: str) -> dict:
        return await run_denial_pipeline(db, did)

    # Run sequentially (shared DB session is not safe for concurrent writes)
    # but respect the 30-second timeout for the entire batch.
    try:
        for did in denial_ids:
            elapsed_so_far = (_now() - started).total_seconds()
            if elapsed_so_far >= BATCH_TIMEOUT_SECONDS:
                msg = (
                    f"Batch timeout ({BATCH_TIMEOUT_SECONDS}s) reached after "
                    f"{len(individual_results)}/{len(denial_ids)} denials"
                )
                logger.warning(msg)
                errors.append(msg)
                break

            try:
                r = await asyncio.wait_for(
                    _run_one(did),
                    timeout=max(1.0, BATCH_TIMEOUT_SECONDS - elapsed_so_far),
                )
                individual_results.append(r)
                total_actions += r.get("actions_created", 0)
                total_auto += r.get("auto_executed_count", 0)
                total_queued += r.get("queued_count", 0)
                if r.get("error"):
                    errors.append(f"{did}: {r['error']}")
            except asyncio.TimeoutError:
                msg = f"Denial {did} timed out"
                logger.warning(msg)
                errors.append(msg)
                individual_results.append({"denial_id": did, "error": msg})
            except Exception as exc:
                msg = f"Denial {did} failed: {exc}"
                logger.error(msg)
                errors.append(msg)
                individual_results.append({"denial_id": did, "error": str(exc)})
    except Exception as exc:
        logger.error("Batch pipeline unexpected error: %s", exc)
        errors.append(f"Batch error: {exc}")

    # Final flush
    try:
        await db.flush()
    except Exception as exc:
        logger.error("Batch pipeline flush failed: %s", exc)

    elapsed = (_now() - started).total_seconds()

    result = {
        "pipeline": "batch",
        "requested": len(denial_ids) + (1 if capped else 0),  # original count hint
        "processed": len(individual_results),
        "capped": capped,
        "max_batch": max_batch,
        "total_actions_created": total_actions,
        "total_auto_executed": total_auto,
        "total_queued": total_queued,
        "errors": errors,
        "elapsed_seconds": round(elapsed, 2),
        "results": individual_results,
    }

    logger.info(
        "Batch pipeline DONE: %d/%d processed, %d actions (%d auto, %d queued), "
        "%d errors in %.2fs",
        len(individual_results), len(denial_ids),
        total_actions, total_auto, total_queued,
        len(errors), elapsed,
    )

    return result
