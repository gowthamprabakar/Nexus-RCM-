"""
Extended RCM models: ClaimLine, PriorAuth, Eligibility271,
EraPayment, PaymentForecast, BankReconciliation, EvvVisit,
ForecastTrainingWeekly, ForecastTrainingDaily
"""
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, Date, Time, Text,
    DateTime, Numeric
)
from app.db.base import Base


# ---------------------------------------------------------------------------
# CLAIM LINES
# ---------------------------------------------------------------------------
class ClaimLine(Base):
    __tablename__ = "claim_lines"

    claim_line_id       = Column(String, primary_key=True, index=True)
    claim_id            = Column(String, nullable=False, index=True)
    line_number         = Column(Integer, nullable=False)
    cpt_code            = Column(String, index=True)
    hcpcs_code          = Column(String)
    revenue_code        = Column(String)
    icd10_primary       = Column(String, nullable=False, index=True)
    icd10_secondary_1   = Column(String)
    icd10_secondary_2   = Column(String)
    icd10_poa           = Column(String)
    modifier_1          = Column(String)
    modifier_2          = Column(String)
    units               = Column(Integer, default=1)
    charge_amount       = Column(Float)
    allowed_amount      = Column(Float)
    paid_amount         = Column(Float)
    patient_responsibility = Column(Float)
    rendering_npi       = Column(String)


# ---------------------------------------------------------------------------
# PRIOR AUTH
# ---------------------------------------------------------------------------
class PriorAuth(Base):
    __tablename__ = "prior_auth"

    auth_id             = Column(String, primary_key=True, index=True)
    claim_id            = Column(String, index=True)
    patient_id          = Column(String, nullable=False, index=True)
    payer_id            = Column(String, nullable=False, index=True)
    auth_number         = Column(String)
    auth_type           = Column(String)  # PROSPECTIVE | CONCURRENT | RETROSPECTIVE
    requested_date      = Column(Date, nullable=False)
    approved_date       = Column(Date)
    expiry_date         = Column(Date)
    approved_cpt_codes  = Column(Text)   # comma-separated
    approved_units      = Column(Integer)
    status              = Column(String, nullable=False, index=True)
    # APPROVED | DENIED | PENDING | EXPIRED
    denial_reason       = Column(String)


# ---------------------------------------------------------------------------
# ELIGIBILITY 271 RESPONSES
# ---------------------------------------------------------------------------
class Eligibility271(Base):
    __tablename__ = "eligibility_271"

    elig_id             = Column(String, primary_key=True, index=True)
    patient_id          = Column(String, nullable=False, index=True)
    payer_id            = Column(String, nullable=False, index=True)
    inquiry_date        = Column(Date, nullable=False, index=True)
    subscriber_status   = Column(String, nullable=False)  # ACTIVE | INACTIVE | TERMINATED
    coverage_effective  = Column(Date)
    coverage_term       = Column(Date)
    deductible_remaining = Column(Float)
    oop_remaining       = Column(Float)
    prior_auth_required = Column(Boolean, default=False)
    referral_required   = Column(Boolean, default=False)
    network_status      = Column(String)   # IN | OUT | UNKNOWN
    plan_type           = Column(String)   # HMO | PPO | EPO | POS | HDHP
    response_code       = Column(String)
    response_message    = Column(String)


# ---------------------------------------------------------------------------
# ERA PAYMENTS (ADTP-cycle driven)
# ---------------------------------------------------------------------------
class EraPayment(Base):
    __tablename__ = "era_payments"

    era_id              = Column(String, primary_key=True, index=True)
    claim_id            = Column(String, nullable=False, index=True)
    payer_id            = Column(String, nullable=False, index=True)
    waystar_era_id      = Column(String)
    payment_date        = Column(Date, nullable=False, index=True)   # ADTP-driven
    payment_week_start  = Column(Date, nullable=False, index=True)
    adtp_cycle_number   = Column(Integer)
    payment_amount      = Column(Float, nullable=False)
    payment_method      = Column(String, default="EFT")
    eft_trace_number    = Column(String)
    check_number        = Column(String)
    allowed_amount      = Column(Float)
    co_amount           = Column(Float, default=0)
    pr_amount           = Column(Float, default=0)
    oa_amount           = Column(Float, default=0)
    pi_amount           = Column(Float, default=0)

    # ERA Processing workflow (added via migration-lite in
    # era_import_service.ensure_era_exception_columns)
    status              = Column(String(30), nullable=True, index=True)
    # STAGED | QUEUED | EXCEPTION | POSTED | REJECTED | ESCALATED | MATCHED
    exception_notes     = Column(Text, nullable=True)
    target_claim_id     = Column(String(40), nullable=True, index=True)



# ---------------------------------------------------------------------------
# PAYMENT FORECAST (weekly per payer)
# ---------------------------------------------------------------------------
class PaymentForecast(Base):
    __tablename__ = "payment_forecast"

    forecast_id         = Column(String, primary_key=True, index=True)
    week_start_date     = Column(Date, nullable=False, index=True)
    week_end_date       = Column(Date, nullable=False)
    payer_id            = Column(String, nullable=False, index=True)
    payer_name          = Column(String)
    payer_group         = Column(String)
    adtp_cycle_hits     = Column(Boolean, nullable=False)
    adtp_cycle_number   = Column(Integer)
    forecasted_amount   = Column(Float, nullable=False)
    claim_count_in_window = Column(Integer)
    avg_historical_amount = Column(Float)
    model_confidence    = Column(Float)
    forecast_range_low  = Column(Float)
    forecast_range_high = Column(Float)
    model_version       = Column(String)



# ---------------------------------------------------------------------------
# BANK RECONCILIATION (closes the cycle weekly)
# ---------------------------------------------------------------------------
class BankReconciliation(Base):
    __tablename__ = "bank_reconciliation"

    recon_id              = Column(String, primary_key=True, index=True)
    week_start_date       = Column(Date, nullable=False, index=True)
    week_end_date         = Column(Date, nullable=False)
    payer_id              = Column(String, nullable=False, index=True)
    payer_name            = Column(String)
    forecasted_amount     = Column(Float, nullable=False)   # from payment_forecast
    era_received_amount   = Column(Float)                   # actual ERA total
    bank_deposit_amount   = Column(Float)                   # confirmed bank deposit
    forecast_variance     = Column(Float)                   # era_received - forecasted
    forecast_variance_pct = Column(Float)                   # variance %
    era_bank_variance     = Column(Float)                   # bank - era (timing diff)
    reconciliation_status = Column(String, nullable=False, index=True)
    # RECONCILED | VARIANCE | PENDING | ESCALATED
    reconciled_date       = Column(Date)
    reconciled_by         = Column(String)
    variance_reason       = Column(String)
    fed_back_to_model     = Column(Boolean, default=False)

    # Float & Anomaly Detection (Sprint 5)
    float_days            = Column(Integer, nullable=True)
    float_amount          = Column(Float, nullable=True)
    is_anomaly            = Column(Boolean, default=False)
    anomaly_type          = Column(String(30), nullable=True)
    # DELAYED_DEPOSIT | AMOUNT_MISMATCH | MISSING_ERA


# ---------------------------------------------------------------------------
# DIAGNOSTIC FINDINGS (Sprint 7 — persistent diagnostic results)
# ---------------------------------------------------------------------------
class DiagnosticFinding(Base):
    __tablename__ = "diagnostic_finding"

    finding_id          = Column(String, primary_key=True, index=True)
    category            = Column(String, nullable=False, index=True)
    # DENIAL_PATTERN | PAYER_BEHAVIOR | ADTP_ANOMALY | REVENUE_LEAKAGE | AR_AGING
    severity            = Column(String, nullable=False, index=True)
    # CRITICAL | WARNING | INFO
    title               = Column(String, nullable=False)
    description         = Column(Text)
    metric_value        = Column(Numeric)
    threshold_value     = Column(Numeric)
    financial_impact    = Column(Numeric, default=0)
    affected_claims     = Column(Integer, default=0)
    payer_id            = Column(String, index=True)
    payer_name          = Column(String)
    root_cause          = Column(String)
    recommended_action  = Column(Text)
    status              = Column(String, default="ACTIVE", index=True)
    # ACTIVE | ACKNOWLEDGED | RESOLVED
    created_at          = Column(DateTime)
    resolved_at         = Column(DateTime)


# ---------------------------------------------------------------------------
# EVV VISITS
# ---------------------------------------------------------------------------
class EvvVisit(Base):
    __tablename__ = "evv_visits"

    evv_id                  = Column(String, primary_key=True, index=True)
    patient_id              = Column(String, nullable=False, index=True)
    claim_id                = Column(String, index=True)
    caregiver_id            = Column(String, nullable=False)
    aggregator              = Column(String, nullable=False)
    # SANDATA | HHAXCHANGE | AUTHENTICARE | NETSMART
    state_code              = Column(String(2))
    service_code            = Column(String)
    service_description     = Column(String)
    visit_date              = Column(Date, nullable=False, index=True)
    scheduled_start         = Column(Time)
    scheduled_end           = Column(Time)
    actual_clock_in         = Column(Time)
    actual_clock_out        = Column(Time)
    scheduled_duration_min  = Column(Integer)
    actual_duration_min     = Column(Integer)
    gps_verified            = Column(Boolean, default=False)
    gps_distance_at_in_ft   = Column(Integer)
    gps_distance_at_out_ft  = Column(Integer)
    clock_in_method         = Column(String)
    caregiver_signature     = Column(Boolean, default=False)
    patient_signature       = Column(Boolean, default=False)
    evv_status              = Column(String, nullable=False, index=True)
    # VERIFIED | EXCEPTION | DENIED
    evv_denial_code         = Column(String)
    evv_denial_description  = Column(String)
    billable                = Column(Boolean, default=False)
    billing_hold_reason     = Column(String)
    units_scheduled         = Column(Float)
    units_verified          = Column(Float)


# ---------------------------------------------------------------------------
# FORECAST TRAINING DATA (Weekly)
# ---------------------------------------------------------------------------
class ForecastTrainingWeekly(Base):
    __tablename__ = "forecast_training_weekly"

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    week_start          = Column(Date, nullable=False, index=True)
    payer_id            = Column(String, nullable=False, index=True)
    payer_name          = Column(String)
    gross_charges       = Column(Float, nullable=False)
    expected_payments   = Column(Float, nullable=False)
    actual_payments     = Column(Float, nullable=False)
    denial_count        = Column(Integer, default=0)
    denial_amount       = Column(Float, default=0)
    claims_submitted    = Column(Integer, default=0)
    claims_paid         = Column(Integer, default=0)
    avg_adtp            = Column(Float, default=0)
    collection_rate     = Column(Float, default=0)


# ---------------------------------------------------------------------------
# FORECAST TRAINING DATA (Daily)
# ---------------------------------------------------------------------------
class ForecastTrainingDaily(Base):
    __tablename__ = "forecast_training_daily"

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    payment_date        = Column(Date, nullable=False, index=True)
    payer_id            = Column(String, nullable=False, index=True)
    payer_name          = Column(String)
    payment_amount      = Column(Float, nullable=False)
    payment_count       = Column(Integer, default=0)
    day_of_week         = Column(Integer, default=0)
    is_month_end        = Column(Boolean, default=False)
    is_holiday          = Column(Boolean, default=False)

