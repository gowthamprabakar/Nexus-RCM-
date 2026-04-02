"""
Background Task Scheduler
==========================
Uses APScheduler (AsyncIOScheduler) to run periodic RCM jobs:
  - Rule evaluation, root-cause batch analysis, diagnostics refresh,
    prevention scanning, Neo4j graph refresh, ML predictions.

Each job creates its own async database session so it never conflicts
with request-scoped sessions.
"""

import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database factory (independent of request-scoped sessions)
# ---------------------------------------------------------------------------

from app.core.config import settings as _settings

_scheduler_engine = create_async_engine(
    _settings.DATABASE_URL,
    pool_size=5,
    max_overflow=2,
    pool_pre_ping=True,
    echo=False,
)

_SchedulerSession = sessionmaker(
    _scheduler_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def _get_session() -> AsyncSession:
    """Create a standalone async session for background jobs."""
    return _SchedulerSession()


# ---------------------------------------------------------------------------
# Singleton scheduler
# ---------------------------------------------------------------------------

_scheduler: Optional[AsyncIOScheduler] = None


def _on_job_executed(event):
    """Listener: log successful job completion."""
    logger.info("Scheduler job '%s' completed successfully.", event.job_id)


def _on_job_error(event):
    """Listener: log job failure without crashing the scheduler."""
    logger.error(
        "Scheduler job '%s' raised an exception: %s",
        event.job_id,
        event.exception,
        exc_info=event.traceback,
    )


# ---------------------------------------------------------------------------
# Scheduled job wrappers
# ---------------------------------------------------------------------------

async def _job_evaluate_rules():
    """Evaluate automation rules against current diagnostics."""
    session = await _get_session()
    try:
        from app.services.automation_engine import evaluate_rules

        triggered = await evaluate_rules(session)
        await session.commit()
        logger.info(
            "evaluate_rules: %d action(s) triggered.", len(triggered)
        )
    except Exception:
        await session.rollback()
        logger.exception("evaluate_rules job failed")
    finally:
        await session.close()


async def _job_batch_rca():
    """Run batch root-cause analysis on pending denials."""
    session = await _get_session()
    try:
        from app.services.root_cause_service import batch_analyze_pending

        analysed = await batch_analyze_pending(session, batch_size=100)
        await session.commit()
        logger.info("batch_rca: %d denial(s) analysed.", analysed)
    except Exception:
        await session.rollback()
        logger.exception("batch_rca job failed")
    finally:
        await session.close()


async def _job_refresh_diagnostics():
    """Refresh cached diagnostic summaries via the diagnostic engine."""
    session = await _get_session()
    try:
        from app.services.diagnostic_service import generate_system_diagnostics

        result = await generate_system_diagnostics(session)
        await session.commit()
        logger.info(
            "refresh_diagnostics: total_findings=%d, critical=%d, warning=%d, impact=$%.2f",
            result.get("total_findings", 0),
            result.get("critical_count", 0),
            result.get("warning_count", 0),
            result.get("total_impact", 0),
        )
    except Exception:
        await session.rollback()
        logger.exception("refresh_diagnostics job failed")
    finally:
        await session.close()


async def _job_prevention_scan():
    """Scan all claims for preventable denial risks."""
    session = await _get_session()
    try:
        from app.services.prevention_service import scan_claims_for_prevention

        result = await scan_claims_for_prevention(session)
        await session.commit()
        alert_count = len(result.get("alerts", []))
        logger.info("prevention_scan: %d alert(s) generated.", alert_count)
    except Exception:
        await session.rollback()
        logger.exception("prevention_scan job failed")
    finally:
        await session.close()


async def _job_refresh_neo4j():
    """Incrementally refresh the Neo4j knowledge graph from PostgreSQL."""
    session = await _get_session()
    try:
        from app.services.neo4j_refresh import refresh_neo4j_graph

        result = await refresh_neo4j_graph(session)
        await session.commit()
        logger.info("refresh_neo4j: status=%s", result.get("status"))
    except Exception:
        await session.rollback()
        logger.exception("refresh_neo4j job failed")
    finally:
        await session.close()


async def _job_run_predictions():
    """Warm-up / validate ML model singletons so first real request is fast."""
    import importlib

    warmed: list[str] = []
    failed: list[str] = []

    # --- Core singletons exposed by predictions.py ---
    for cls_name, module_path in [
        ("DenialProbabilityModel", "app.ml.denial_probability"),
        ("AppealSuccessModel", "app.ml.appeal_success"),
    ]:
        try:
            mod = importlib.import_module(module_path)
            _inst = getattr(mod, cls_name)()          # singleton / cached __init__
            warmed.append(cls_name)
        except Exception as exc:
            failed.append(cls_name)
            logger.warning("run_predictions: failed to warm %s: %s", cls_name, exc)

    # --- Additional ML modules (correct class names + module paths) ---
    extra_modules = [
        ("PaymentDelayModel",       "app.ml.payment_delay"),
        ("PropensityToPayModel",    "app.ml.propensity_to_pay"),
        ("WriteOffModel",           "app.ml.write_off_model"),
        ("CARCPredictionModel",     "app.ml.carc_prediction"),
        ("PayerAnomalyModel",       "app.ml.payer_anomaly"),
    ]
    for cls_name, module_path in extra_modules:
        try:
            mod = importlib.import_module(module_path)
            _inst = getattr(mod, cls_name)()
            # Load the trained artifact from disk
            if hasattr(_inst, '_load'):
                _inst._load()
            elif hasattr(_inst, 'load'):
                _inst.load()
            if _inst.is_fitted:
                warmed.append(cls_name)
            else:
                failed.append(f"{cls_name} (not trained)")
        except Exception as exc:
            failed.append(f"{cls_name} ({exc})")
            logger.debug("run_predictions: failed to warm %s: %s", cls_name, exc)

    logger.info(
        "run_predictions: %d model(s) warmed, %d failed %s",
        len(warmed),
        len(failed),
        failed if failed else "",
    )


async def _job_run_feedback_cycle():
    """Run the Neo4j feedback loop — pushes appeal outcomes and payer metrics to the graph."""
    session = await _get_session()
    try:
        from app.services.feedback_neo4j import run_feedback_cycle

        result = await run_feedback_cycle(session)
        await session.commit()
        logger.info(
            "run_feedback_cycle: status=%s, appeals=%d, payers=%d",
            result.get("status", "unknown"),
            result.get("appeals_processed", 0),
            result.get("payers_updated", 0),
        )
    except Exception:
        await session.rollback()
        logger.exception("run_feedback_cycle job failed")
    finally:
        await session.close()


async def _job_batch_validate_rca():
    """Validate top 20 low-confidence root causes per run using Qwen3."""
    session = await _get_session()
    try:
        from app.services.root_cause_validator import batch_validate
        result = await batch_validate(session, limit=20)
        await session.commit()
        logger.info(
            "batch_validate_rca: %d validated, %d agreed, %d disagreed, avg adj %.1f pts",
            result.get("validated_count", 0),
            result.get("agreed", 0),
            result.get("disagreed", 0),
            result.get("avg_adjustment", 0),
        )
    except Exception:
        await session.rollback()
        logger.exception("batch_validate_rca job failed")
    finally:
        await session.close()


async def _job_update_collection_propensity():
    """Update propensity_score on open CollectionQueue rows using ML model."""
    session = await _get_session()
    try:
        from sqlalchemy import select
        from app.models.ar_collections import CollectionQueue
        from app.ml.propensity_to_pay import PropensityToPayModel

        model = PropensityToPayModel()

        # Fetch open queue rows that have a patient_id
        q = select(CollectionQueue).where(
            CollectionQueue.status.in_(["OPEN", "IN_PROGRESS"]),
            CollectionQueue.patient_id.isnot(None),
        )
        result = await session.execute(q)
        rows = result.scalars().all()

        updated = 0
        for row in rows:
            try:
                prediction = await model.predict_patient(session, row.patient_id)
                probability = prediction.get("probability")
                if probability is not None:
                    row.propensity_score = max(0, min(100, int(probability * 100)))
                    updated += 1
            except Exception as exc:
                logger.debug(
                    "propensity update skipped for %s: %s", row.task_id, exc
                )

        await session.commit()
        logger.info(
            "update_collection_propensity: %d/%d queue rows updated.",
            updated, len(rows),
        )
    except Exception:
        await session.rollback()
        logger.exception("update_collection_propensity job failed")
    finally:
        await session.close()


async def _job_retrain_prophet():
    """Weekly Prophet model retrain — re-fits on latest ERA payment data."""
    logger.info("Scheduler: starting Prophet forecast retrain")
    try:
        from app.services.prophet_forecast import _CACHE, _CACHE_TTL
        now = time.time()
        stale_keys = [k for k, (_, ts) in _CACHE.items() if now - ts >= _CACHE_TTL]
        for k in stale_keys:
            del _CACHE[k]
        logger.info("Scheduler: Prophet cache — evicted %d stale entries (%d remain warm)", len(stale_keys), len(_CACHE))
    except Exception:
        logger.exception("Prophet retrain job failed")

    # Log forecast accuracy after cache clear
    session = await _get_session()
    try:
        from app.services.prophet_forecast import get_forecast_accuracy
        accuracy = await get_forecast_accuracy(session)
        mape = accuracy.get("overall_metrics", {}).get("mape", None)
        if mape is not None:
            logger.info("Prophet forecast accuracy: MAPE=%.2f%%", mape)
            if mape > 15.0:
                logger.warning("Prophet MAPE %.2f%% exceeds 15%% threshold", mape)
    finally:
        await session.close()


# ---------------------------------------------------------------------------
# Lifecycle helpers (called from FastAPI lifespan)
# ---------------------------------------------------------------------------

async def start_scheduler() -> AsyncIOScheduler:
    """Initialise and start the background scheduler.

    Call this once during FastAPI startup (e.g. inside a lifespan context
    manager).  Returns the scheduler instance.
    """
    global _scheduler

    if _scheduler is not None and _scheduler.running:
        logger.warning("Scheduler already running -- skipping start.")
        return _scheduler

    _scheduler = AsyncIOScheduler(
        timezone="UTC",
        job_defaults={
            "coalesce": True,         # merge missed runs into one
            "max_instances": 1,       # never overlap the same job
            "misfire_grace_time": 300, # 5-minute grace window
        },
    )

    # Register event listeners
    _scheduler.add_listener(_on_job_executed, EVENT_JOB_EXECUTED)
    _scheduler.add_listener(_on_job_error, EVENT_JOB_ERROR)

    # ---- Add jobs --------------------------------------------------------

    _scheduler.add_job(
        _job_evaluate_rules,
        "interval",
        minutes=15,
        id="evaluate_rules",
        name="Evaluate automation rules",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_batch_rca,
        "interval",
        minutes=60,
        id="batch_rca",
        name="Batch root-cause analysis",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_refresh_diagnostics,
        "interval",
        minutes=60,
        id="refresh_diagnostics",
        name="Refresh diagnostic summaries",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_prevention_scan,
        "interval",
        minutes=30,
        id="prevention_scan",
        name="Prevention rule scan",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_refresh_neo4j,
        "interval",
        minutes=15,
        id="refresh_neo4j",
        name="Neo4j incremental refresh",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_run_predictions,
        "interval",
        minutes=60,
        id="run_predictions",
        name="ML model predictions",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_run_feedback_cycle,
        "interval",
        hours=6,
        id="run_feedback_cycle",
        name="Neo4j feedback loop (appeal outcomes + payer metrics)",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_retrain_prophet,
        "cron",
        day_of_week="sun",
        hour=2,
        minute=0,
        id="retrain_prophet",
        name="Weekly Prophet forecast retrain",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_batch_validate_rca,
        "interval",
        minutes=30,
        id="batch_validate_rca",
        name="Validate low-confidence root causes",
        replace_existing=True,
    )

    _scheduler.add_job(
        _job_update_collection_propensity,
        "interval",
        hours=2,
        id="update_collection_propensity",
        name="Update collection queue propensity scores (ML)",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info("Background scheduler started with %d jobs.", len(_scheduler.get_jobs()))
    return _scheduler


async def stop_scheduler() -> None:
    """Gracefully shut down the scheduler and its DB engine.

    Call this during FastAPI shutdown.
    """
    global _scheduler

    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped.")

    _scheduler = None

    # Dispose the scheduler's own connection pool
    try:
        await _scheduler_engine.dispose()
        logger.info("Scheduler DB engine disposed.")
    except Exception as exc:
        logger.warning("Scheduler engine dispose error: %s", exc)


def get_scheduler_status() -> Dict[str, Any]:
    """Return current scheduler state and job list.

    Useful for an admin/health endpoint.
    """
    if _scheduler is None:
        return {"running": False, "jobs": []}

    jobs: List[Dict[str, Any]] = []
    for job in _scheduler.get_jobs():
        jobs.append({
            "job_id": job.id,
            "name": job.name,
            "trigger": str(job.trigger),
            "next_run_time": (
                job.next_run_time.isoformat() if job.next_run_time else None
            ),
            "pending": job.pending,
        })

    return {
        "running": _scheduler.running,
        "job_count": len(jobs),
        "jobs": jobs,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
