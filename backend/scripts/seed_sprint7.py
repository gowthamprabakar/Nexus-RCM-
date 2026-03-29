"""
Sprint 7 Seed Script
=====================
1. Creates the automation_actions table if not exists
2. Seeds sample contract rates for top 20 CPT codes across 10 payers
3. Runs automation_engine.evaluate_rules() to generate initial actions from diagnostics
"""

import asyncio
import sys
import os
from datetime import date, timedelta
from uuid import uuid4

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.db.session import AsyncSessionLocal


# Top 20 CPT codes with realistic expected rates
CPT_RATES = [
    ("99213", 125.00),   # Office visit E&M
    ("99214", 180.00),   # Office visit E&M
    ("99215", 250.00),   # Office visit E&M
    ("99232", 120.00),   # Hospital visit
    ("99233", 165.00),   # Hospital visit
    ("99291", 375.00),   # Critical care
    ("27447", 1850.00),  # Knee replacement
    ("27130", 1750.00),  # Hip replacement
    ("43239", 680.00),   # Upper GI endoscopy
    ("45380", 720.00),   # Colonoscopy with biopsy
    ("70553", 450.00),   # MRI brain
    ("71260", 380.00),   # CT chest with contrast
    ("36415", 12.00),    # Venipuncture
    ("85025", 18.00),    # CBC
    ("80053", 28.00),    # Comprehensive metabolic panel
    ("93000", 45.00),    # ECG
    ("97110", 65.00),    # Therapeutic exercises
    ("97140", 58.00),    # Manual therapy
    ("90837", 145.00),   # Psychotherapy 60min
    ("96372", 35.00),    # Injection
]

# Top 10 payer IDs (matching seed data)
PAYER_IDS = [
    "PAY001", "PAY002", "PAY003", "PAY004", "PAY005",
    "PAY006", "PAY007", "PAY008", "PAY009", "PAY010",
]

# Rate multipliers per payer group (some payers pay more/less)
PAYER_MULTIPLIERS = {
    "PAY001": 1.05,   # Humana - slightly above
    "PAY002": 0.95,   # Cigna - slightly below
    "PAY003": 1.10,   # UHC - above
    "PAY004": 0.80,   # Medicare FFS - below
    "PAY005": 0.85,   # Medicaid - below
    "PAY006": 1.00,   # Aetna - baseline
    "PAY007": 0.90,   # BCBS - slightly below
    "PAY008": 1.02,   # Anthem - near baseline
    "PAY009": 0.88,   # Molina - below
    "PAY010": 0.92,   # Centene - below
}


async def main():
    async with AsyncSessionLocal() as db:
        # ── 1. Create automation_actions table ──────────────────────────────
        print("Creating automation_actions table...")
        await db.execute(text('''
            CREATE TABLE IF NOT EXISTS automation_actions (
                action_id VARCHAR(20) PRIMARY KEY,
                rule_id VARCHAR(20) NOT NULL,
                rule_name VARCHAR(100) NOT NULL,
                trigger_type VARCHAR(30) NOT NULL,
                trigger_data TEXT,
                suggested_action VARCHAR(500) NOT NULL,
                affected_claims INTEGER DEFAULT 0,
                estimated_impact FLOAT DEFAULT 0.0,
                confidence INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'PENDING',
                approved_by VARCHAR(50),
                executed_at TIMESTAMPTZ,
                outcome VARCHAR(200),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        '''))
        await db.commit()
        print("  automation_actions table created (or already exists)")

        # ── 2. Seed contract rates ──────────────────────────────────────────
        print("\nSeeding payer contract rates...")

        # Check if any rates already exist
        existing = await db.execute(text("SELECT COUNT(*) FROM payer_contract_rate"))
        count = existing.scalar()

        if count and count > 0:
            print(f"  {count} contract rates already exist, skipping seed")
        else:
            effective = date.today() - timedelta(days=365)
            rows_inserted = 0

            for payer_id in PAYER_IDS:
                multiplier = PAYER_MULTIPLIERS.get(payer_id, 1.0)

                for cpt_code, base_rate in CPT_RATES:
                    rate_id = f"CR-{uuid4().hex[:10].upper()}"
                    expected_rate = round(base_rate * multiplier, 2)

                    await db.execute(
                        text('''
                            INSERT INTO payer_contract_rate
                            (contract_rate_id, payer_id, cpt_code, modifier, expected_rate,
                             effective_date, termination_date, rate_type, rate_source, created_at)
                            VALUES (:id, :payer, :cpt, NULL, :rate,
                                    :eff, NULL, 'FEE_SCHEDULE', 'HISTORICAL_DERIVED', NOW())
                            ON CONFLICT DO NOTHING
                        '''),
                        {
                            "id": rate_id,
                            "payer": payer_id,
                            "cpt": cpt_code,
                            "rate": expected_rate,
                            "eff": effective,
                        }
                    )
                    rows_inserted += 1

            await db.commit()
            print(f"  Inserted {rows_inserted} contract rates ({len(PAYER_IDS)} payers x {len(CPT_RATES)} CPT codes)")

        # ── 3. Run rule evaluation ──────────────────────────────────────────
        print("\nRunning automation rule evaluation...")
        try:
            from app.services.automation_engine import evaluate_rules
            results = await evaluate_rules(db)
            await db.commit()
            print(f"  Rule evaluation complete: {len(results)} actions created")
            for r in results[:10]:
                status_icon = "+" if r["status"] == "EXECUTED" else "?"
                print(f"    [{status_icon}] {r['rule_name']}: {r['suggested_action'][:80]}")
            if len(results) > 10:
                print(f"    ... and {len(results) - 10} more")
        except Exception as e:
            print(f"  Rule evaluation failed (this is OK if no data exists): {e}")

        print("\nSprint 7 seed complete!")


if __name__ == "__main__":
    asyncio.run(main())
