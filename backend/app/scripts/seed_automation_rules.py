"""
Seed script for Sprint Q Track D
====================================
Creates the three Track-D persistence tables (CREATE TABLE IF NOT EXISTS) and
seeds ``automation_rules_db`` from the hardcoded ``AUTOMATION_RULES`` list in
``app.services.automation_engine``.

Idempotent — safe to run on every server start.

Usage from CLI:
    python -m app.scripts.seed_automation_rules
"""
from __future__ import annotations

import asyncio
import json
import logging

from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.prevent_persistence import AutomationRule
from app.services.automation_engine import AUTOMATION_RULES

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# DDL bootstrap (CREATE TABLE IF NOT EXISTS for all three Track-D tables)
# ---------------------------------------------------------------------------
async def ensure_tables(db: AsyncSession) -> None:
    """Idempotent DDL bootstrap for the three Sprint Q Track D tables."""
    # prevention_alerts
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS prevention_alerts (
            alert_id            VARCHAR(40) PRIMARY KEY,
            claim_id            VARCHAR(40),
            payer_id            VARCHAR(10),
            prevention_type     VARCHAR(40),
            severity            VARCHAR(20),
            description         TEXT,
            recommended_action  TEXT,
            revenue_at_risk     NUMERIC(12, 2),
            preventable         BOOLEAN DEFAULT TRUE,
            dismissed           BOOLEAN DEFAULT FALSE,
            dismissed_at        TIMESTAMP,
            dismissed_by        VARCHAR(40),
            created_at          TIMESTAMP DEFAULT NOW()
        )
    """))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_prev_alerts_claim     ON prevention_alerts (claim_id)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_prev_alerts_payer     ON prevention_alerts (payer_id)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_prev_alerts_type      ON prevention_alerts (prevention_type)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_prev_alerts_dismissed ON prevention_alerts (dismissed)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_prev_alerts_created   ON prevention_alerts (created_at)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_prev_alerts_claim_type ON prevention_alerts (claim_id, prevention_type)"))

    # crs_audit
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS crs_audit (
            audit_id     VARCHAR(40) PRIMARY KEY,
            claim_id     VARCHAR(40),
            score_before INTEGER,
            score_after  INTEGER,
            rule_id      VARCHAR(40),
            action       VARCHAR(40),
            action_data  JSONB,
            user_id      VARCHAR(40),
            created_at   TIMESTAMP DEFAULT NOW()
        )
    """))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_crs_audit_claim   ON crs_audit (claim_id)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_crs_audit_created ON crs_audit (created_at)"))

    # automation_rules_db
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS automation_rules_db (
            rule_id            VARCHAR(40) PRIMARY KEY,
            name               VARCHAR(200),
            description        TEXT,
            trigger_type       VARCHAR(40),
            condition          JSONB,
            action_template    JSONB,
            enabled            BOOLEAN DEFAULT TRUE,
            requires_approval  BOOLEAN DEFAULT TRUE,
            deleted            BOOLEAN DEFAULT FALSE,
            created_by         VARCHAR(40),
            updated_by         VARCHAR(40),
            created_at         TIMESTAMP DEFAULT NOW(),
            updated_at         TIMESTAMP DEFAULT NOW()
        )
    """))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_auto_rules_trigger ON automation_rules_db (trigger_type)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_auto_rules_enabled ON automation_rules_db (enabled)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_auto_rules_deleted ON automation_rules_db (deleted)"))


# ---------------------------------------------------------------------------
# Seed — idempotent: insert new rule_ids, skip existing
# ---------------------------------------------------------------------------
async def seed_automation_rules(db: AsyncSession) -> dict:
    """Insert each AUTOMATION_RULES entry into automation_rules_db if absent.

    Returns counts: ``{inserted: N, skipped: N, total_in_db: N}``.
    """
    inserted = 0
    skipped = 0

    # Get currently seeded rule_ids so we can skip
    existing = await db.execute(select(AutomationRule.rule_id))
    existing_ids = {r[0] for r in existing.all()}

    for rule in AUTOMATION_RULES:
        if rule["rule_id"] in existing_ids:
            skipped += 1
            continue

        # The hardcoded rules use 'trigger' + string template; we store the
        # template as JSON with a 'text' key so everything stays JSONB.
        action_template = {"text": rule.get("action_template", "")}

        db.add(AutomationRule(
            rule_id=rule["rule_id"],
            name=rule["name"],
            description=f"Seeded from AUTOMATION_RULES constant (Sprint Q Track D).",
            trigger_type=rule.get("trigger"),
            condition=rule.get("condition") or {},
            action_template=action_template,
            enabled=bool(rule.get("enabled", True)),
            requires_approval=bool(rule.get("requires_approval", True)),
            deleted=False,
            created_by="system:seed",
            updated_by="system:seed",
        ))
        inserted += 1

    await db.flush()

    total = await db.scalar(select(func.count(AutomationRule.rule_id))) or 0
    logger.info(
        "seed_automation_rules: inserted=%d skipped=%d total_in_db=%d",
        inserted, skipped, total,
    )
    return {"inserted": inserted, "skipped": skipped, "total_in_db": int(total)}


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
async def _cli() -> None:
    async with AsyncSessionLocal() as db:
        await ensure_tables(db)
        result = await seed_automation_rules(db)
        await db.commit()
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(_cli())
