"""
Seed script for CARC / RARC reference tables.

CARC descriptions are paraphrased from the X12 External Code Source 139 list
(Claim Adjustment Reason Codes) and RARC descriptions from the WPC Remittance
Advice Remark Code list. These reflect the canonical short descriptions used
by 835 ERA processors.

Usage:
    python -m app.scripts.seed_carc_rarc
"""
from __future__ import annotations

import asyncio
import logging
from typing import Iterable

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import AsyncSessionLocal
from app.models.code_reference import CarcCode, RarcCode

logger = logging.getLogger(__name__)


# ── CARC data ─────────────────────────────────────────────────────────────────
# (code, description, category, group_code)
CARC_SEED: list[tuple[str, str, str, str | None]] = [
    # Contractual Obligation (CO)
    ("CO-1",   "Deductible amount.",                                                            "adjustment", "CO"),
    ("CO-2",   "Coinsurance amount.",                                                           "adjustment", "CO"),
    ("CO-3",   "Co-payment amount.",                                                            "adjustment", "CO"),
    ("CO-4",   "The procedure code is inconsistent with the modifier used.",                   "adjustment", "CO"),
    ("CO-11",  "The diagnosis is inconsistent with the procedure.",                            "adjustment", "CO"),
    ("CO-15",  "The authorization number is missing, invalid, or does not apply.",             "adjustment", "CO"),
    ("CO-16",  "Claim/service lacks information or has submission/billing error(s).",          "adjustment", "CO"),
    ("CO-18",  "Exact duplicate claim/service.",                                                "adjustment", "CO"),
    ("CO-19",  "This is a work-related injury/illness; liability of Workers' Compensation.",   "adjustment", "CO"),
    ("CO-22",  "This care may be covered by another payer per coordination of benefits.",      "adjustment", "CO"),
    ("CO-23",  "The impact of prior payer(s) adjudication including payments and adjustments.", "adjustment", "CO"),
    ("CO-24",  "Charges are covered under a capitation agreement/managed care plan.",          "adjustment", "CO"),
    ("CO-27",  "Expenses incurred after coverage terminated.",                                  "adjustment", "CO"),
    ("CO-29",  "The time limit for filing has expired.",                                        "adjustment", "CO"),
    ("CO-31",  "Patient cannot be identified as our insured.",                                  "adjustment", "CO"),
    ("CO-39",  "Services denied at the time authorization/pre-certification was requested.",   "adjustment", "CO"),
    ("CO-45",  "Charge exceeds fee schedule/maximum allowable or contracted/legislated fee.",  "adjustment", "CO"),
    ("CO-50",  "These services are non-covered as not deemed a medical necessity.",            "adjustment", "CO"),
    ("CO-58",  "Treatment was deemed by the payer to have been rendered in an inappropriate or invalid place of service.", "adjustment", "CO"),
    ("CO-59",  "Processed based on multiple or concurrent procedure rules.",                    "adjustment", "CO"),
    ("CO-96",  "Non-covered charge(s).",                                                        "adjustment", "CO"),
    ("CO-97",  "Benefit included in payment/allowance for another service/procedure.",         "adjustment", "CO"),
    ("CO-109", "Claim/service not covered by this payer/contractor; send to correct payer.",   "adjustment", "CO"),
    ("CO-119", "Benefit maximum for this time period or occurrence has been reached.",         "adjustment", "CO"),
    ("CO-125", "Submission/billing error(s); supplemental information required.",              "adjustment", "CO"),
    ("CO-146", "Diagnosis was invalid for the date(s) of service reported.",                    "adjustment", "CO"),
    ("CO-151", "Payment adjusted because the payer deems the information submitted does not support this many/frequency of services.", "adjustment", "CO"),
    ("CO-167", "This (these) diagnosis(es) is (are) not covered.",                              "adjustment", "CO"),
    ("CO-181", "Procedure code was invalid on the date of service.",                            "adjustment", "CO"),
    ("CO-197", "Precertification/authorization/notification/pre-treatment absent.",             "adjustment", "CO"),
    ("CO-204", "This service/equipment/drug is not covered under the patient's current benefit plan.", "adjustment", "CO"),
    ("CO-252", "An attachment/other documentation is required to adjudicate this claim/service.", "adjustment", "CO"),

    # Patient Responsibility (PR)
    ("PR-1",   "Deductible amount.",                                                            "adjustment", "PR"),
    ("PR-2",   "Coinsurance amount.",                                                           "adjustment", "PR"),
    ("PR-3",   "Co-payment amount.",                                                            "adjustment", "PR"),
    ("PR-27",  "Expenses incurred after coverage terminated.",                                  "adjustment", "PR"),
    ("PR-31",  "Patient cannot be identified as our insured.",                                  "adjustment", "PR"),
    ("PR-33",  "Insured has no dependent coverage.",                                             "adjustment", "PR"),
    ("PR-45",  "Charge exceeds fee schedule/maximum allowable or contracted fee.",              "adjustment", "PR"),
    ("PR-49",  "This is a non-covered service because it is a routine/preventive exam.",        "adjustment", "PR"),
    ("PR-96",  "Non-covered charge(s).",                                                        "adjustment", "PR"),
    ("PR-119", "Benefit maximum for this time period or occurrence has been reached.",         "adjustment", "PR"),
    ("PR-187", "Consumer-directed health plan (CDHP/HSA) account payments.",                    "adjustment", "PR"),
    ("PR-204", "This service/equipment/drug is not covered under the patient's current benefit plan.", "adjustment", "PR"),

    # Other Adjustments (OA)
    ("OA-18",  "Exact duplicate claim/service.",                                                "adjustment", "OA"),
    ("OA-23",  "The impact of prior payer(s) adjudication including payments and/or adjustments.", "adjustment", "OA"),
    ("OA-94",  "Processed in excess of charges.",                                                "adjustment", "OA"),
    ("OA-121", "Indemnification adjustment — compensation for outstanding member responsibility.", "adjustment", "OA"),
    ("OA-122", "Psychiatric reduction.",                                                         "adjustment", "OA"),
    ("OA-209", "Per regulatory or other agreement; not the responsibility of the patient.",     "adjustment", "OA"),

    # Payer Initiated Reductions (PI)
    ("PI-95",  "Plan procedures not followed.",                                                 "adjustment", "PI"),
    ("PI-104", "Managed care withholding.",                                                     "adjustment", "PI"),
    ("PI-138", "Appeal procedures not followed or time limits not met.",                        "adjustment", "PI"),
    ("PI-242", "Services not provided by network/primary care providers.",                      "adjustment", "PI"),
]


# ── RARC data ─────────────────────────────────────────────────────────────────
# (code, description, category)
RARC_SEED: list[tuple[str, str, str]] = [
    ("M1",   "X-ray not taken within the past 12 months or near enough to the start of treatment.", "informational"),
    ("M15",  "Separately billed services/tests have been bundled as they are considered components of the same procedure.", "informational"),
    ("M25",  "The information furnished does not substantiate the need for this level of service.", "informational"),
    ("M38",  "The patient is liable for the charges for this service as you informed the patient in writing before the service was furnished that we would not pay for it, and the patient agreed to pay.", "informational"),
    ("M51",  "Missing/incomplete/invalid procedure code(s).",                                    "informational"),
    ("M76",  "Missing/incomplete/invalid diagnosis or condition.",                              "informational"),
    ("M77",  "Missing/incomplete/invalid place of service.",                                    "informational"),
    ("M86",  "Service denied because payment already made for same/similar procedure within set time frame.", "informational"),
    ("M127", "Missing patient medical record for this service.",                                "informational"),
    ("N1",   "Alert: You may appeal this decision in writing within the required time limits.",  "alert"),
    ("N4",   "Missing/incomplete/invalid prior insurance carrier EOB.",                          "informational"),
    ("N30",  "Patient ineligible for this service.",                                             "informational"),
    ("N56",  "Procedure code billed is not correct/valid for the services billed or the date of service billed.", "informational"),
    ("N95",  "This provider type/provider specialty may not bill this service.",                 "informational"),
    ("N115", "This decision was based on a Local Coverage Determination (LCD).",                "informational"),
    ("N130", "Consult plan benefit documents/guidelines for information about restrictions for this service.", "informational"),
    ("N179", "Additional information has been requested from the member; the charges will be reconsidered upon receipt of that information.", "alert"),
    ("N290", "Missing/incomplete/invalid rendering provider primary identifier.",               "informational"),
    ("N362", "The number of days or units of service exceeds our acceptable maximum.",          "informational"),
    ("N448", "This drug/service/supply is not included in the fee schedule or contracted/legislated fee arrangement.", "informational"),
    ("N522", "Duplicate of a claim processed or to be processed as a crossover claim.",         "informational"),
    ("N657", "This should be billed with the appropriate code for these services.",             "informational"),
    ("MA01", "Alert: If you do not agree with what we approved for these services, you may appeal our decision.", "alert"),
    ("MA13", "Alert: You may be subject to penalties if you bill the patient for amounts not reported with the PR group code.", "alert"),
    ("MA66", "Missing/incomplete/invalid principal procedure code.",                            "informational"),
    ("MA130", "Your claim contains incomplete and/or invalid information; no appeal rights afforded.", "informational"),
]


async def _upsert_carc(db: AsyncSession, rows: Iterable[tuple]) -> int:
    """Upsert CARC rows using Postgres ON CONFLICT, fall back to per-row merge."""
    n = 0
    try:
        stmt = pg_insert(CarcCode.__table__).values([
            {"code": c, "description": d, "category": cat, "group_code": g}
            for (c, d, cat, g) in rows
        ])
        stmt = stmt.on_conflict_do_update(
            index_elements=["code"],
            set_={"description": stmt.excluded.description,
                  "category":    stmt.excluded.category,
                  "group_code":  stmt.excluded.group_code},
        )
        result = await db.execute(stmt)
        n = result.rowcount or len(list(rows))
    except Exception:
        # Fallback: delete + insert
        await db.execute(text("DELETE FROM carc_codes"))
        for (c, d, cat, g) in rows:
            db.add(CarcCode(code=c, description=d, category=cat, group_code=g))
            n += 1
    return n


async def _upsert_rarc(db: AsyncSession, rows: Iterable[tuple]) -> int:
    n = 0
    try:
        stmt = pg_insert(RarcCode.__table__).values([
            {"code": c, "description": d, "category": cat}
            for (c, d, cat) in rows
        ])
        stmt = stmt.on_conflict_do_update(
            index_elements=["code"],
            set_={"description": stmt.excluded.description,
                  "category":    stmt.excluded.category},
        )
        result = await db.execute(stmt)
        n = result.rowcount or len(list(rows))
    except Exception:
        await db.execute(text("DELETE FROM rarc_codes"))
        for (c, d, cat) in rows:
            db.add(RarcCode(code=c, description=d, category=cat))
            n += 1
    return n


async def ensure_tables(db: AsyncSession) -> None:
    """Idempotent DDL bootstrap (mirrors the governance_store pattern)."""
    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS carc_codes (
            code        VARCHAR(10) PRIMARY KEY,
            description TEXT NOT NULL,
            category    VARCHAR(20) NOT NULL,
            group_code  VARCHAR(4)
        )
    """))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_carc_group ON carc_codes (group_code)"))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_carc_cat   ON carc_codes (category)"))

    await db.execute(text("""
        CREATE TABLE IF NOT EXISTS rarc_codes (
            code        VARCHAR(10) PRIMARY KEY,
            description TEXT NOT NULL,
            category    VARCHAR(20) NOT NULL
        )
    """))
    await db.execute(text("CREATE INDEX IF NOT EXISTS idx_rarc_cat ON rarc_codes (category)"))


async def seed_in_session(db: AsyncSession) -> dict:
    """Seed using a caller-provided session (does not commit)."""
    await ensure_tables(db)
    carc_n = await _upsert_carc(db, CARC_SEED)
    rarc_n = await _upsert_rarc(db, RARC_SEED)
    return {"carc_seeded": carc_n, "rarc_seeded": rarc_n}


async def seed() -> dict:
    async with AsyncSessionLocal() as db:
        res = await seed_in_session(db)
        await db.commit()
    logger.info("Seeded %d CARC, %d RARC codes", res["carc_seeded"], res["rarc_seeded"])
    return res


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    res = asyncio.run(seed())
    print(res)
