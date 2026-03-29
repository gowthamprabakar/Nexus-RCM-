"""Create the diagnostic_finding table and run initial population."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.db.session import engine, AsyncSessionLocal


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS diagnostic_finding (
    finding_id          VARCHAR PRIMARY KEY,
    category            VARCHAR NOT NULL,
    severity            VARCHAR NOT NULL,
    title               VARCHAR NOT NULL,
    description         TEXT,
    metric_value        NUMERIC,
    threshold_value     NUMERIC,
    financial_impact    NUMERIC DEFAULT 0,
    affected_claims     INTEGER DEFAULT 0,
    payer_id            VARCHAR,
    payer_name          VARCHAR,
    root_cause          VARCHAR,
    recommended_action  TEXT,
    status              VARCHAR DEFAULT 'ACTIVE',
    created_at          TIMESTAMP DEFAULT NOW(),
    resolved_at         TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diag_finding_category ON diagnostic_finding(category);
CREATE INDEX IF NOT EXISTS idx_diag_finding_severity ON diagnostic_finding(severity);
CREATE INDEX IF NOT EXISTS idx_diag_finding_status   ON diagnostic_finding(status);
CREATE INDEX IF NOT EXISTS idx_diag_finding_payer    ON diagnostic_finding(payer_id);
"""


async def main():
    # 1. Create the table
    async with engine.begin() as conn:
        for stmt in CREATE_TABLE_SQL.strip().split(";"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(text(stmt))
    print("[OK] diagnostic_finding table created")

    # 2. Run initial population
    from app.services.diagnostic_service import generate_system_diagnostics
    async with AsyncSessionLocal() as db:
        result = await generate_system_diagnostics(db)
        print(f"[OK] Generated {result['total_findings']} findings, persisted to DB")

        # Verify
        row = await db.execute(text("SELECT count(*) FROM diagnostic_finding"))
        count = row.scalar()
        print(f"[OK] SELECT count(*) FROM diagnostic_finding = {count}")


if __name__ == "__main__":
    asyncio.run(main())
