import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, claims, denials, forecast, crs, payments, ar, collections, collections_extended, reconciliation, ai, analytics, root_cause, diagnostics, graph, simulation, prevention, lida, predictions, coding, evv, patient_access, admin, compliance, dashboard

# Register all models so Alembic/SQLAlchemy sees them
import app.models.payer           # noqa
import app.models.patient         # noqa
import app.models.rcm_extended    # noqa
import app.models.ar_collections  # noqa
import app.models.root_cause      # noqa
import app.models.automation      # noqa

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────
    try:
        from app.services.scheduler import start_scheduler
        await start_scheduler()
        logger.info("Background scheduler started.")
    except Exception as exc:
        logger.warning("Scheduler failed to start (non-fatal): %s", exc)

    try:
        from app.db.session import AsyncSessionLocal
        from app.services.automation_engine import load_persisted_rule_states
        async with AsyncSessionLocal() as db:
            await load_persisted_rule_states(db)
            await db.commit()
        logger.info("Automation rule states loaded from DB.")
    except Exception as exc:
        logger.warning("Rule state load failed (non-fatal, using defaults): %s", exc)

    try:
        from pathlib import Path
        ml_base = Path(__file__).resolve().parent / "ml"
        (ml_base / "saved_models").mkdir(parents=True, exist_ok=True)
        (ml_base / "artifacts").mkdir(parents=True, exist_ok=True)
        _artifacts = {
            "denial_probability": ml_base / "saved_models" / "denial_probability.joblib",
            "payment_delay": ml_base / "saved_models" / "payment_delay.joblib",
            "payer_anomaly": ml_base / "saved_models" / "payer_anomaly.joblib",
            "propensity_to_pay": ml_base / "saved_models" / "propensity_to_pay.joblib",
            "write_off": ml_base / "saved_models" / "write_off.joblib",
            "carc_prediction": ml_base / "saved_models" / "carc_prediction.joblib",
            "appeal_success": ml_base / "artifacts" / "appeal_success_model.joblib",
        }
        ready = [n for n, p in _artifacts.items() if p.exists()]
        missing = [n for n, p in _artifacts.items() if not p.exists()]
        if missing:
            logger.warning("ML readiness: %d/%d trained. MISSING: %s", len(ready), len(_artifacts), ", ".join(missing))
        else:
            logger.info("ML readiness: all %d models present.", len(ready))
    except Exception as exc:
        logger.warning("ML startup check failed (non-fatal): %s", exc)

    yield

    # ── Shutdown ─────────────────────────────────────────────────────
    try:
        from app.services.scheduler import stop_scheduler
        await stop_scheduler()
        logger.info("Background scheduler stopped.")
    except Exception as exc:
        logger.warning("Scheduler shutdown error: %s", exc)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.1.0"}

# Include routers
app.include_router(auth.router,     prefix=f"{settings.API_V1_STR}/auth",           tags=["auth"])
app.include_router(claims.router,   prefix=f"{settings.API_V1_STR}/claims",         tags=["claims"])
app.include_router(denials.router,  prefix=f"{settings.API_V1_STR}/denials",        tags=["denials"])
app.include_router(forecast.router, prefix=f"{settings.API_V1_STR}/forecast",       tags=["forecast"])
app.include_router(crs.router,            prefix=f"{settings.API_V1_STR}/crs",            tags=["crs"])
app.include_router(payments.router,       prefix=f"{settings.API_V1_STR}/payments",       tags=["payments"])
app.include_router(ar.router,             prefix=f"{settings.API_V1_STR}/ar",              tags=["ar"])
app.include_router(collections.router,    prefix=f"{settings.API_V1_STR}/collections",     tags=["collections"])
app.include_router(collections_extended.router, prefix=f"{settings.API_V1_STR}/collections", tags=["collections"])
app.include_router(reconciliation.router, prefix=f"{settings.API_V1_STR}/reconciliation",  tags=["reconciliation"])
app.include_router(ai.router,             prefix=f"{settings.API_V1_STR}/ai",              tags=["ai"])
app.include_router(analytics.router,      prefix=f"{settings.API_V1_STR}/analytics",        tags=["analytics"])
app.include_router(root_cause.router,    prefix=f"{settings.API_V1_STR}/root-cause",      tags=["root-cause"])
app.include_router(diagnostics.router,   prefix=f"{settings.API_V1_STR}/diagnostics",     tags=["diagnostics"])
app.include_router(graph.router,         prefix=f"{settings.API_V1_STR}",                  tags=["graph", "automation"])
app.include_router(simulation.router,   prefix=f"{settings.API_V1_STR}/simulation",       tags=["simulation"])
app.include_router(prevention.router,  prefix=f"{settings.API_V1_STR}/prevention",       tags=["prevention"])
app.include_router(lida.router,       prefix=f"{settings.API_V1_STR}/lida",              tags=["lida"])
app.include_router(predictions.router, prefix=f"{settings.API_V1_STR}/predictions",     tags=["predictions"])
app.include_router(coding.router,      prefix=f"{settings.API_V1_STR}/coding",          tags=["coding"])
app.include_router(evv.router,         prefix=f"{settings.API_V1_STR}/evv",             tags=["evv"])
app.include_router(patient_access.router, prefix=f"{settings.API_V1_STR}/patient-access", tags=["patient-access"])
app.include_router(admin.router,       prefix=f"{settings.API_V1_STR}/admin",            tags=["admin"])
app.include_router(compliance.router,  prefix=f"{settings.API_V1_STR}/compliance",       tags=["compliance"])
app.include_router(dashboard.router,   prefix=f"{settings.API_V1_STR}/dashboard",        tags=["dashboard"])

# Neo4j health endpoint
@app.get("/api/v1/neo4j/health")
async def neo4j_health():
    from app.services.neo4j_refresh import get_neo4j_health
    return await get_neo4j_health()


# Scheduler status endpoint
@app.get("/api/v1/scheduler/status")
async def scheduler_status():
    from app.services.scheduler import get_scheduler_status
    return get_scheduler_status()
