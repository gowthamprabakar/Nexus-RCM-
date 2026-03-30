"""Persists model governance data to PostgreSQL."""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


async def ensure_table(db: AsyncSession):
    """Create ml_prediction_log table if not exists."""
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS ml_prediction_log (
            id SERIAL PRIMARY KEY,
            model_name VARCHAR(60) NOT NULL,
            prediction FLOAT NOT NULL,
            actual_outcome FLOAT,
            features_hash BIGINT,
            logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """))
    await db.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_ml_pred_log_model
        ON ml_prediction_log (model_name, logged_at DESC)
    """))


async def log_prediction_to_db(db: AsyncSession, model_name: str, prediction: float,
                                actual_outcome=None, features_hash: int = 0):
    try:
        await db.execute(text("""
            INSERT INTO ml_prediction_log (model_name, prediction, actual_outcome, features_hash, logged_at)
            VALUES (:model, :pred, :actual, :fhash, :ts)
        """), {"model": model_name, "pred": prediction, "actual": actual_outcome,
               "fhash": features_hash, "ts": datetime.now(timezone.utc)})
    except Exception as e:
        logger.warning("Failed to log prediction: %s", e)


async def get_recent_predictions(db: AsyncSession, model_name: str, limit: int = 1000):
    result = await db.execute(text("""
        SELECT prediction, actual_outcome FROM ml_prediction_log
        WHERE model_name = :model AND actual_outcome IS NOT NULL
        ORDER BY logged_at DESC LIMIT :lim
    """), {"model": model_name, "lim": limit})
    return result.fetchall()
