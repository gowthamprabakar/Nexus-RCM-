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
    """Placeholder: refresh cached diagnostic summaries."""
    logger.info(
        "refresh_diagnostics: placeholder -- no-op for now."
    )


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
    """Placeholder: run ML model predictions (ADTP, denial probability, etc.)."""
    logger.info(
        "run_predictions: placeholder -- no-op for now."
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


async def _job_retrain_prophet():
    """Weekly Prophet model retrain — re-fits on latest ERA payment data."""
    logger.info("Scheduler: starting Prophet forecast retrain")
    try:
        from app.services.prophet_forecast import _CACHE
        # Clear in-memory cache so next API call gets fresh predictions
        _CACHE.clear()
        logger.info("Scheduler: Prophet cache cleared — model will retrain on next forecast request")
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
