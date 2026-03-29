#!/usr/bin/env python3
"""
Nexus RCM — Database Seeder
Sprint 0 / Track B

Loads all 14 synthetic CSV datasets into PostgreSQL.
Run from /backend:  python3 seed_data.py

Order matters — FK relationships:
  payer_master → patients → insurance_coverage → claims
  → claim_lines, prior_auth, eligibility_271, denials, appeals
  → era_payments → payment_forecast → bank_reconciliation
  → evv_visits
"""
import os, sys, csv, asyncio, time
from datetime import date, time as dtime
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DB_URL  = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password123@localhost:5432/rcmpulse")
CSV_DIR = Path(__file__).parent.parent / "data" / "synthetic"

BATCH = 2000  # rows per insert batch

engine = create_async_engine(DB_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def parse_date(s):
    return date.fromisoformat(s) if s else None

def parse_float(s):
    try: return float(s)
    except: return None

def parse_int(s):
    try: return int(s)
    except: return None

def parse_bool(s):
    return str(s).strip().lower() in ("true","1","yes","t")

def parse_time(s):
    if not s: return None
    try:
        parts = s.split(":")
        return dtime(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
    except: return None

def csv_rows(fname):
    path = CSV_DIR / fname
    if not path.exists():
        print(f"  ⚠  {fname} not found — skipping")
        return []
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))

async def bulk_insert(session, table_name, rows, transform_fn):
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), BATCH):
        batch = [transform_fn(r) for r in rows[i:i+BATCH]]
        batch = [b for b in batch if b]  # filter None
        if batch:
            keys = list(batch[0].keys())
            placeholders = ", ".join(f":{k}" for k in keys)
            cols = ", ".join(keys)
            stmt = text(f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING")
            await session.execute(stmt, batch)
            await session.commit()
            total += len(batch)
    return total


# ---------------------------------------------------------------------------
# Transform functions (CSV row → dict for DB insert)
# ---------------------------------------------------------------------------
def t_payer(r):
    return {
        "payer_id": r["payer_id"], "payer_name": r["payer_name"],
        "payer_group": r["payer_group"], "adtp_days": parse_int(r["adtp_days"]),
        "adtp_anchor_day": parse_int(r.get("adtp_anchor_day", 0)),
        "payment_method": r["payment_method"],
        "avg_payment_rate": parse_float(r["avg_payment_rate"]),
        "denial_rate": parse_float(r["denial_rate"]),
        "first_pass_rate": parse_float(r["first_pass_rate"]),
        "avg_appeal_win_rate": parse_float(r.get("avg_appeal_win_rate")),
        "electronic_payer_id": r.get("electronic_payer_id"),
        "waystar_payer_id": r.get("waystar_payer_id"),
        "era_enrolled": parse_bool(r.get("era_enrolled", "true")),
    }

def t_provider(r):
    return {
        "provider_id": r["provider_id"], "npi": r["npi"],
        "provider_name": r["provider_name"], "provider_type": r.get("provider_type"),
        "specialty": r.get("specialty"), "facility_type": r.get("facility_type"),
        "state": r.get("state"), "zip": r.get("zip"), "tax_id": r.get("tax_id"),
    }

def t_patient(r):
    return {
        "patient_id": r["patient_id"], "mrn": r["mrn"],
        "first_name": r.get("first_name"), "last_name": r.get("last_name"),
        "dob": parse_date(r.get("dob")), "gender": r.get("gender"),
        "zip": r.get("zip"), "state": r.get("state"),
    }

def t_coverage(r):
    return {
        "coverage_id": r["coverage_id"], "patient_id": r["patient_id"],
        "payer_id": r["payer_id"], "coverage_type": r["coverage_type"],
        "group_number": r.get("group_number"), "member_id": r["member_id"],
        "subscriber_id": r.get("subscriber_id"),
        "effective_date": parse_date(r["effective_date"]),
        "term_date": parse_date(r.get("term_date")),
        "deductible_individual": parse_float(r.get("deductible_individual", 0)),
        "deductible_met_ytd": parse_float(r.get("deductible_met_ytd", 0)),
        "oop_max": parse_float(r.get("oop_max", 0)),
        "oop_met_ytd": parse_float(r.get("oop_met_ytd", 0)),
        "copay": parse_float(r.get("copay", 0)),
        "coinsurance_pct": parse_float(r.get("coinsurance_pct", 0)),
    }

def t_claim(r):
    return {
        "claim_id": r["claim_id"], "patient_id": r["patient_id"],
        "provider_id": r["provider_id"], "payer_id": r["payer_id"],
        "coverage_id": r["coverage_id"], "claim_type": r["claim_type"],
        "date_of_service": parse_date(r["date_of_service"]),
        "dos_through": parse_date(r.get("dos_through")),
        "place_of_service": r.get("place_of_service"),
        "bill_type": r.get("bill_type"),
        "total_charges": parse_float(r.get("total_charges")),
        "expected_allowed": parse_float(r.get("expected_allowed")),
        "expected_patient_liability": parse_float(r.get("expected_patient_liability")),
        "submission_date": parse_date(r.get("submission_date")),
        "submission_method": r.get("submission_method", "EDI"),
        "waystar_batch_id": r.get("waystar_batch_id"),
        "crs_score": parse_int(r.get("crs_score")),
        "crs_passed": parse_bool(r.get("crs_passed", "false")),
        "crs_eligibility_pts": parse_int(r.get("crs_eligibility_pts", 0)),
        "crs_auth_pts": parse_int(r.get("crs_auth_pts", 0)),
        "crs_coding_pts": parse_int(r.get("crs_coding_pts", 0)),
        "crs_cob_pts": parse_int(r.get("crs_cob_pts", 0)),
        "crs_documentation_pts": parse_int(r.get("crs_documentation_pts", 0)),
        "crs_evv_pts": parse_int(r.get("crs_evv_pts", 0)),
        "adtp_days": parse_int(r.get("adtp_days")),
        "expected_payment_date": parse_date(r.get("expected_payment_date")),
        "expected_payment_week": parse_date(r.get("expected_payment_week")),
        "status": r.get("status", "DRAFT"),
    }

def t_claim_line(r):
    return {
        "claim_line_id": r["claim_line_id"], "claim_id": r["claim_id"],
        "line_number": parse_int(r["line_number"]),
        "cpt_code": r.get("cpt_code"), "hcpcs_code": r.get("hcpcs_code"),
        "revenue_code": r.get("revenue_code"),
        "icd10_primary": r.get("icd10_primary", "Z00.00"),
        "icd10_secondary_1": r.get("icd10_secondary_1"),
        "icd10_secondary_2": r.get("icd10_secondary_2"),
        "icd10_poa": r.get("icd10_poa"),
        "modifier_1": r.get("modifier_1"), "modifier_2": r.get("modifier_2"),
        "units": parse_int(r.get("units", 1)),
        "charge_amount": parse_float(r.get("charge_amount")),
        "allowed_amount": parse_float(r.get("allowed_amount")),
        "paid_amount": parse_float(r.get("paid_amount")),
        "patient_responsibility": parse_float(r.get("patient_responsibility")),
        "rendering_npi": r.get("rendering_npi"),
    }

def t_auth(r):
    return {
        "auth_id": r["auth_id"], "claim_id": r.get("claim_id") or None,
        "patient_id": r["patient_id"], "payer_id": r["payer_id"],
        "auth_number": r.get("auth_number") or None,
        "auth_type": r.get("auth_type"),
        "requested_date": parse_date(r["requested_date"]),
        "approved_date": parse_date(r.get("approved_date")),
        "expiry_date": parse_date(r.get("expiry_date")),
        "approved_cpt_codes": r.get("approved_cpt_codes") or None,
        "approved_units": parse_int(r.get("approved_units")),
        "status": r["status"],
        "denial_reason": r.get("denial_reason") or None,
    }

def t_elig(r):
    return {
        "elig_id": r["elig_id"], "patient_id": r["patient_id"],
        "payer_id": r["payer_id"],
        "inquiry_date": parse_date(r["inquiry_date"]),
        "subscriber_status": r["subscriber_status"],
        "coverage_effective": parse_date(r.get("coverage_effective")),
        "coverage_term": parse_date(r.get("coverage_term")),
        "deductible_remaining": parse_float(r.get("deductible_remaining")),
        "oop_remaining": parse_float(r.get("oop_remaining")),
        "prior_auth_required": parse_bool(r.get("prior_auth_required", "false")),
        "referral_required": parse_bool(r.get("referral_required", "false")),
        "network_status": r.get("network_status"),
        "plan_type": r.get("plan_type"),
        "response_code": r.get("response_code"),
        "response_message": r.get("response_message"),
    }

def t_denial(r):
    return {
        "denial_id": r["denial_id"], "claim_id": r["claim_id"],
        "waystar_denial_id": r.get("waystar_denial_id"),
        "denial_date": parse_date(r["denial_date"]),
        "denial_source": r.get("denial_source", "ERA_835"),
        "carc_code": r["carc_code"], "carc_description": r.get("carc_description"),
        "rarc_code": r.get("rarc_code") or None,
        "rarc_description": r.get("rarc_description") or None,
        "denial_category": r["denial_category"],
        "adjustment_type": r.get("adjustment_type"),
        "denial_amount": parse_float(r.get("denial_amount")),
        "appeal_deadline": parse_date(r.get("appeal_deadline")),
        "similar_denial_30d": parse_int(r.get("similar_denial_30d", 0)),
        "recommended_action": r.get("recommended_action"),
    }

def t_appeal(r):
    return {
        "appeal_id": r["appeal_id"], "denial_id": r["denial_id"],
        "claim_id": r["claim_id"], "appeal_type": r["appeal_type"],
        "submitted_date": parse_date(r.get("submitted_date")),
        "appeal_method": r.get("appeal_method"),
        "ai_generated": parse_bool(r.get("ai_generated", "false")),
        "approved_by_user_id": r.get("approved_by_user_id"),
        "outcome": r.get("outcome"), "outcome_date": parse_date(r.get("outcome_date")),
        "recovered_amount": parse_float(r.get("recovered_amount", 0)),
        "carc_overturned": parse_bool(r.get("carc_overturned", "false")),
        "appeal_quality_score": parse_int(r.get("appeal_quality_score")),
    }

def t_era(r):
    return {
        "era_id": r["era_id"], "claim_id": r["claim_id"],
        "payer_id": r["payer_id"],
        "waystar_era_id": r.get("waystar_era_id"),
        "payment_date": parse_date(r["payment_date"]),
        "payment_week_start": parse_date(r["payment_week_start"]),
        "adtp_cycle_number": parse_int(r.get("adtp_cycle_number")),
        "payment_amount": parse_float(r["payment_amount"]),
        "payment_method": r.get("payment_method", "EFT"),
        "eft_trace_number": r.get("eft_trace_number") or None,
        "check_number": r.get("check_number") or None,
        "allowed_amount": parse_float(r.get("allowed_amount")),
        "co_amount": parse_float(r.get("co_amount", 0)),
        "pr_amount": parse_float(r.get("pr_amount", 0)),
        "oa_amount": parse_float(r.get("oa_amount", 0)),
        "pi_amount": parse_float(r.get("pi_amount", 0)),
    }

def t_forecast(r):
    cycle_num = r.get("adtp_cycle_number")
    return {
        "forecast_id": r["forecast_id"],
        "week_start_date": parse_date(r["week_start_date"]),
        "week_end_date": parse_date(r["week_end_date"]),
        "payer_id": r["payer_id"], "payer_name": r.get("payer_name"),
        "payer_group": r.get("payer_group"),
        "adtp_cycle_hits": parse_bool(r.get("adtp_cycle_hits", "false")),
        "adtp_cycle_number": parse_int(cycle_num) if cycle_num and cycle_num.strip() else None,
        "forecasted_amount": parse_float(r["forecasted_amount"]),
        "claim_count_in_window": parse_int(r.get("claim_count_in_window", 0)),
        "avg_historical_amount": parse_float(r.get("avg_historical_amount")),
        "model_confidence": parse_float(r.get("model_confidence")),
        "forecast_range_low": parse_float(r.get("forecast_range_low")),
        "forecast_range_high": parse_float(r.get("forecast_range_high")),
        "model_version": r.get("model_version"),
    }

def t_recon(r):
    return {
        "recon_id": r["recon_id"],
        "week_start_date": parse_date(r["week_start_date"]),
        "week_end_date": parse_date(r["week_end_date"]),
        "payer_id": r["payer_id"], "payer_name": r.get("payer_name"),
        "forecasted_amount": parse_float(r["forecasted_amount"]),
        "era_received_amount": parse_float(r.get("era_received_amount")),
        "bank_deposit_amount": parse_float(r.get("bank_deposit_amount")),
        "forecast_variance": parse_float(r.get("forecast_variance")),
        "forecast_variance_pct": parse_float(r.get("forecast_variance_pct")),
        "era_bank_variance": parse_float(r.get("era_bank_variance")),
        "reconciliation_status": r.get("reconciliation_status", "PENDING"),
        "reconciled_date": parse_date(r.get("reconciled_date")),
        "reconciled_by": r.get("reconciled_by") or None,
        "variance_reason": r.get("variance_reason") or None,
        "fed_back_to_model": parse_bool(r.get("fed_back_to_model", "false")),
    }

def t_evv(r):
    return {
        "evv_id": r["evv_id"], "patient_id": r["patient_id"],
        "claim_id": r.get("claim_id") or None,
        "caregiver_id": r["caregiver_id"],
        "aggregator": r["aggregator"], "state_code": r.get("state_code"),
        "service_code": r.get("service_code"),
        "service_description": r.get("service_description"),
        "visit_date": parse_date(r["visit_date"]),
        "scheduled_start": parse_time(r.get("scheduled_start")),
        "scheduled_end": parse_time(r.get("scheduled_end")),
        "actual_clock_in": parse_time(r.get("actual_clock_in")),
        "actual_clock_out": parse_time(r.get("actual_clock_out")),
        "scheduled_duration_min": parse_int(r.get("scheduled_duration_min")),
        "actual_duration_min": parse_int(r.get("actual_duration_min")),
        "gps_verified": parse_bool(r.get("gps_verified", "false")),
        "gps_distance_at_in_ft": parse_int(r.get("gps_distance_at_in_ft")),
        "gps_distance_at_out_ft": parse_int(r.get("gps_distance_at_out_ft")),
        "clock_in_method": r.get("clock_in_method"),
        "caregiver_signature": parse_bool(r.get("caregiver_signature", "false")),
        "patient_signature": parse_bool(r.get("patient_signature", "false")),
        "evv_status": r.get("evv_status", "EXCEPTION"),
        "evv_denial_code": r.get("evv_denial_code") or None,
        "evv_denial_description": r.get("evv_denial_description") or None,
        "billable": parse_bool(r.get("billable", "false")),
        "billing_hold_reason": r.get("billing_hold_reason") or None,
        "units_scheduled": parse_float(r.get("units_scheduled")),
        "units_verified": parse_float(r.get("units_verified")),
    }


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
STEPS = [
    ("payer_master",       "payer_master.csv",       t_payer),
    ("providers",          "providers.csv",           t_provider),
    ("patients",           "patients.csv",            t_patient),
    ("insurance_coverage", "insurance_coverage.csv",  t_coverage),
    ("claims",             "claims.csv",              t_claim),
    ("claim_lines",        "claim_lines.csv",         t_claim_line),
    ("prior_auth",         "prior_auth.csv",          t_auth),
    ("eligibility_271",    "eligibility_271.csv",     t_elig),
    ("denials",            "denials.csv",             t_denial),
    ("appeals",            "appeals.csv",             t_appeal),
    ("era_payments",       "era_payments.csv",        t_era),
    ("payment_forecast",   "payment_forecast.csv",    t_forecast),
    ("bank_reconciliation","bank_reconciliation.csv", t_recon),
    ("evv_visits",         "evv_visits.csv",          t_evv),
]


async def create_tables():
    """Create all tables from models."""
    from app.db.base import Base
    # Import all models to register them
    import app.models.payer          # noqa
    import app.models.provider       # noqa
    import app.models.patient        # noqa
    import app.models.rcm_extended   # noqa
    import app.models.claim          # noqa
    import app.models.denial         # noqa
    import app.models.user           # noqa

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ All tables created (or already exist)")


async def seed():
    print("\n" + "=" * 60)
    print("NEXUS RCM — Database Seeder")
    print("=" * 60)
    print(f"  Source: {CSV_DIR}")
    print(f"  Target: {DB_URL.split('@')[-1]}")
    print(f"  Batch size: {BATCH:,} rows\n")

    await create_tables()

    async with AsyncSessionLocal() as session:
        grand_total = 0
        for table, fname, transform in STEPS:
            t0   = time.time()
            rows = csv_rows(fname)
            if not rows:
                continue
            print(f"  Loading {table:<25}  {len(rows):>9,} rows ...", end="", flush=True)
            inserted = await bulk_insert(session, table, rows, transform)
            elapsed  = time.time() - t0
            grand_total += inserted
            print(f"  ✓  {inserted:>9,}  ({elapsed:.1f}s)")

    print("\n" + "=" * 60)
    print(f"  TOTAL ROWS INSERTED: {grand_total:,}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(seed())
