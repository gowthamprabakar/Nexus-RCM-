-- =============================================================================
-- NEXUS RCM INTELLIGENCE PLATFORM — Master Data Schema
-- Sprint 0 / Track B — Data & ML Foundation
-- Version: 1.0 | March 2026
-- =============================================================================
-- SOURCE SYSTEMS:
--   EHR       → patients, providers, claims, claim_lines, prior_auth
--   Waystar   → denials (CARC/RARC), era_payments, edi_acknowledgments
--   EVV Agg.  → evv_visits (Sandata, HHAeXchange, AuthentiCare)
--   Payer API → eligibility_271, payer_master
--   Internal  → payment_forecast, bank_reconciliation (closes the cycle)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. PAYER MASTER
--    Core of payment forecasting. adtp_days = payment cadence (WHEN they pay).
--    avg_payment_rate = HOW MUCH (% of charges) they typically pay.
-- -----------------------------------------------------------------------------
CREATE TABLE payer_master (
    payer_id                VARCHAR(10)     PRIMARY KEY,
    payer_name              VARCHAR(100)    NOT NULL,
    payer_group             VARCHAR(40)     NOT NULL,
    -- G1_FEDERAL_FFS | G2_MEDICARE_ADVANTAGE | G3_COMMERCIAL_NATIONAL
    -- G4_COMMERCIAL_REGIONAL | G5_MANAGED_MEDICAID | G6_STATE_MEDICAID
    -- G7_WORKERS_COMP_AUTO | G8_SELF_PAY_SECONDARY

    -- ADTP = how many days between payment batches (payment cadence)
    adtp_days               INTEGER         NOT NULL,   -- e.g. 14 / 21 / 30
    adtp_anchor_day         INTEGER,                    -- day of week batch runs (0=Mon,1=Tue...)
    payment_method          VARCHAR(10)     DEFAULT 'EFT',  -- EFT | CHECK

    -- Financial benchmarks (from historical ERA data, updated quarterly)
    avg_payment_rate        DECIMAL(5,4)    NOT NULL,   -- % of billed charges paid
    denial_rate             DECIMAL(5,4)    NOT NULL,   -- % of claims denied
    first_pass_rate         DECIMAL(5,4)    NOT NULL,   -- % paid without rework
    avg_appeal_win_rate     DECIMAL(5,4),

    -- EDI identifiers
    electronic_payer_id     VARCHAR(20),
    waystar_payer_id        VARCHAR(20),
    era_enrolled            BOOLEAN         DEFAULT TRUE,

    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 2. PROVIDERS
-- -----------------------------------------------------------------------------
CREATE TABLE providers (
    provider_id             VARCHAR(10)     PRIMARY KEY,
    npi                     VARCHAR(10)     UNIQUE NOT NULL,
    provider_name           VARCHAR(100)    NOT NULL,
    provider_type           VARCHAR(20),    -- INDIVIDUAL | ORGANIZATION
    specialty               VARCHAR(60),    -- Primary Care, Surgery, Behavioral Health...
    facility_type           VARCHAR(40),    -- HOSPITAL | CLINIC | HOME_HEALTH | DME
    state                   VARCHAR(2),
    zip                     VARCHAR(10),
    tax_id                  VARCHAR(15),
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 3. PATIENTS
--    Source: EHR (Epic / Cerner / Athena)
-- -----------------------------------------------------------------------------
CREATE TABLE patients (
    patient_id              VARCHAR(10)     PRIMARY KEY,
    mrn                     VARCHAR(20)     UNIQUE NOT NULL,  -- EHR Medical Record Number
    first_name              VARCHAR(50),
    last_name               VARCHAR(50),
    dob                     DATE,
    gender                  VARCHAR(15),
    zip                     VARCHAR(10),
    state                   VARCHAR(2),
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 4. INSURANCE COVERAGE
--    A patient can have up to 3 coverages (primary / secondary / tertiary = COB)
-- -----------------------------------------------------------------------------
CREATE TABLE insurance_coverage (
    coverage_id             VARCHAR(15)     PRIMARY KEY,
    patient_id              VARCHAR(10)     NOT NULL REFERENCES patients(patient_id),
    payer_id                VARCHAR(10)     NOT NULL REFERENCES payer_master(payer_id),
    coverage_type           VARCHAR(15)     NOT NULL,  -- PRIMARY | SECONDARY | TERTIARY
    group_number            VARCHAR(20),
    member_id               VARCHAR(20)     NOT NULL,
    subscriber_id           VARCHAR(20),
    effective_date          DATE            NOT NULL,
    term_date               DATE,                      -- NULL = still active
    -- Benefits
    deductible_individual   DECIMAL(10,2)   DEFAULT 0,
    deductible_met_ytd      DECIMAL(10,2)   DEFAULT 0,
    oop_max                 DECIMAL(10,2)   DEFAULT 0,
    oop_met_ytd             DECIMAL(10,2)   DEFAULT 0,
    copay                   DECIMAL(8,2)    DEFAULT 0,
    coinsurance_pct         DECIMAL(5,4)    DEFAULT 0, -- e.g. 0.20 = 20% patient owes
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 5. CLAIMS — Header Level (837P Professional / 837I Institutional)
--    Source: EHR charge capture → Waystar EDI submission
--    Key fields: crs_score (prevention), expected_payment_date (ADTP-driven)
-- -----------------------------------------------------------------------------
CREATE TABLE claims (
    claim_id                VARCHAR(15)     PRIMARY KEY,
    patient_id              VARCHAR(10)     NOT NULL REFERENCES patients(patient_id),
    provider_id             VARCHAR(10)     NOT NULL REFERENCES providers(provider_id),
    payer_id                VARCHAR(10)     NOT NULL REFERENCES payer_master(payer_id),
    coverage_id             VARCHAR(15)     NOT NULL REFERENCES insurance_coverage(coverage_id),

    claim_type              VARCHAR(20)     NOT NULL,  -- PROFESSIONAL | INSTITUTIONAL
    date_of_service         DATE            NOT NULL,
    dos_through             DATE,                      -- for multi-day episodes
    place_of_service        VARCHAR(5),                -- POS codes: 11=office, 21=inpatient...
    bill_type               VARCHAR(5),                -- 131, 261, 851 (institutional only)

    -- Financials
    total_charges           DECIMAL(12,2)   NOT NULL,
    expected_allowed        DECIMAL(12,2),             -- from payer fee schedule
    expected_patient_liability DECIMAL(12,2),

    -- Submission
    submission_date         DATE,
    submission_method       VARCHAR(15)     DEFAULT 'EDI',  -- EDI | PAPER | PORTAL
    waystar_batch_id        VARCHAR(20),

    -- Prevention Layer — Claim Readiness Score
    crs_score               INTEGER,                   -- 0-100
    crs_passed              BOOLEAN,                   -- TRUE if score >= 80
    crs_eligibility_pts     INTEGER,                   -- 0 or 25
    crs_auth_pts            INTEGER,                   -- 0 or 25
    crs_coding_pts          INTEGER,                   -- 0 or 20
    crs_cob_pts             INTEGER,                   -- 0 or 10
    crs_documentation_pts   INTEGER,                   -- 0 or 10
    crs_evv_pts             INTEGER,                   -- 0 or 10 (home health only)

    -- ADTP — Payment Forecasting
    adtp_days               INTEGER,                   -- payer's adtp_days at submission time
    expected_payment_date   DATE,                      -- submission_date + adtp_days
    expected_payment_week   DATE,                      -- Monday of expected payment week

    -- Lifecycle Status
    status                  VARCHAR(30)     NOT NULL   -- DRAFT | SUBMITTED | ACKNOWLEDGED
                            DEFAULT 'DRAFT',           -- | PAID | DENIED | APPEALED
                                                       -- | WRITTEN_OFF | VOIDED
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 6. CLAIM LINES — Line Item Level
--    Each claim has 1–6 lines (CPT codes, units, amounts)
-- -----------------------------------------------------------------------------
CREATE TABLE claim_lines (
    claim_line_id           VARCHAR(20)     PRIMARY KEY,
    claim_id                VARCHAR(15)     NOT NULL REFERENCES claims(claim_id),
    line_number             INTEGER         NOT NULL,
    cpt_code                VARCHAR(10),               -- Procedure code
    hcpcs_code              VARCHAR(10),               -- DME / drug codes
    revenue_code            VARCHAR(5),                -- Institutional only (0450, 0636...)
    icd10_primary           VARCHAR(10)     NOT NULL,  -- Diagnosis code
    icd10_secondary_1       VARCHAR(10),
    icd10_secondary_2       VARCHAR(10),
    icd10_poa               VARCHAR(2),                -- Present on Admission (Y/N/U/W)
    modifier_1              VARCHAR(5),                -- e.g. 25, 59, LT, RT
    modifier_2              VARCHAR(5),
    units                   INTEGER         DEFAULT 1,
    charge_amount           DECIMAL(10,2)   NOT NULL,
    allowed_amount          DECIMAL(10,2),
    paid_amount             DECIMAL(10,2),
    patient_responsibility  DECIMAL(10,2),
    rendering_npi           VARCHAR(10),
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 7. PRIOR AUTHORIZATION
--    Source: EHR + Payer portal / API
--    Links to claims. Expiry drives CRS auth check.
-- -----------------------------------------------------------------------------
CREATE TABLE prior_auth (
    auth_id                 VARCHAR(15)     PRIMARY KEY,
    claim_id                VARCHAR(15)     REFERENCES claims(claim_id),
    patient_id              VARCHAR(10)     NOT NULL REFERENCES patients(patient_id),
    payer_id                VARCHAR(10)     NOT NULL REFERENCES payer_master(payer_id),
    auth_number             VARCHAR(30),
    auth_type               VARCHAR(25),               -- PROSPECTIVE | CONCURRENT | RETROSPECTIVE
    requested_date          DATE            NOT NULL,
    approved_date           DATE,
    expiry_date             DATE,
    approved_cpt_codes      TEXT,                      -- comma-separated
    approved_units          INTEGER,
    status                  VARCHAR(20)     NOT NULL,  -- APPROVED | DENIED | PENDING | EXPIRED
    denial_reason           VARCHAR(300),
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 8. ELIGIBILITY RESPONSES (270/271 EDI)
--    Source: Real-time payer API ping via Waystar
--    Drives CRS eligibility check (25 pts)
-- -----------------------------------------------------------------------------
CREATE TABLE eligibility_271 (
    elig_id                 VARCHAR(15)     PRIMARY KEY,
    patient_id              VARCHAR(10)     NOT NULL REFERENCES patients(patient_id),
    payer_id                VARCHAR(10)     NOT NULL REFERENCES payer_master(payer_id),
    inquiry_date            DATE            NOT NULL,
    subscriber_status       VARCHAR(20)     NOT NULL,  -- ACTIVE | INACTIVE | TERMINATED
    coverage_effective      DATE,
    coverage_term           DATE,
    deductible_remaining    DECIMAL(10,2),
    oop_remaining           DECIMAL(10,2),
    prior_auth_required     BOOLEAN         DEFAULT FALSE,
    referral_required       BOOLEAN         DEFAULT FALSE,
    network_status          VARCHAR(15),               -- IN | OUT | UNKNOWN
    plan_type               VARCHAR(10),               -- HMO | PPO | EPO | POS | HDHP
    response_code           VARCHAR(10),               -- EB = eligible, AAA = rejected
    response_message        VARCHAR(200),
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 9. DENIALS — From Waystar ERA 835 + 277CA
--    Source: Waystar denial management feed
--    CARC = why payer denied. RARC = additional detail/instructions.
-- -----------------------------------------------------------------------------
CREATE TABLE denials (
    denial_id               VARCHAR(15)     PRIMARY KEY,
    claim_id                VARCHAR(15)     NOT NULL REFERENCES claims(claim_id),
    waystar_denial_id       VARCHAR(25),               -- Waystar internal ID

    denial_date             DATE            NOT NULL,
    denial_source           VARCHAR(20),               -- ERA_835 | 277CA | PORTAL

    -- CARC — Claim Adjustment Reason Codes (primary denial reason)
    carc_code               VARCHAR(10)     NOT NULL,
    carc_description        VARCHAR(300),
    -- Common: CO-4 late filing, CO-11 dx inconsistent, CO-16 missing info,
    --         CO-22 COB, CO-29 time limit, CO-96 non-covered, CO-97 capitation,
    --         PR-1 deductible, PR-2 coinsurance, PR-3 copay

    -- RARC — Remittance Advice Remark Codes (supplemental instruction)
    rarc_code               VARCHAR(10),
    rarc_description        VARCHAR(300),
    -- Common: N30 not eligible, N58 no auth, N95 duplicate, MA13 no auth on file,
    --         N115 missing clinical notes, N425 no referral

    -- Denial classification
    denial_category         VARCHAR(40)     NOT NULL,
    -- AUTHORIZATION | ELIGIBILITY | CODING | COB | TIMELY_FILING
    -- MEDICAL_NECESSITY | DUPLICATE | EVV | NON_COVERED

    adjustment_type         VARCHAR(5),                -- CO | PR | OA | PI
    denial_amount           DECIMAL(12,2)   NOT NULL,

    -- Waystar intelligence fields
    appeal_deadline         DATE,
    similar_denial_30d      INTEGER         DEFAULT 0, -- pattern detection count
    recommended_action      VARCHAR(300),

    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 10. APPEALS
--     Linked to denials. Human approves before send (compliance boundary).
--     Win/loss data trains appeal_win_probability ML model.
-- -----------------------------------------------------------------------------
CREATE TABLE appeals (
    appeal_id               VARCHAR(15)     PRIMARY KEY,
    denial_id               VARCHAR(15)     NOT NULL REFERENCES denials(denial_id),
    claim_id                VARCHAR(15)     NOT NULL REFERENCES claims(claim_id),
    appeal_type             VARCHAR(30)     NOT NULL,
    -- FIRST_LEVEL | SECOND_LEVEL | EXTERNAL_REVIEW | PEER_TO_PEER

    submitted_date          DATE,
    appeal_method           VARCHAR(20),               -- FAX | PORTAL | CERTIFIED_MAIL
    ai_generated            BOOLEAN         DEFAULT FALSE,
    approved_by_user_id     VARCHAR(20),               -- human approval required

    outcome                 VARCHAR(15),               -- WON | LOST | PENDING | PARTIAL
    outcome_date            DATE,
    recovered_amount        DECIMAL(12,2)   DEFAULT 0,

    -- ML training signal
    carc_overturned         BOOLEAN,
    appeal_quality_score    INTEGER,                   -- 1-10 (AI-scored letter quality)

    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 11. ERA PAYMENTS — 835 Remittance (ADTP-cycle driven)
--     Source: Waystar ERA feed → bank deposit
--     payment_date follows payer ADTP cycle — NOT random.
--     This is the actual cash that hits the bank account.
-- -----------------------------------------------------------------------------
CREATE TABLE era_payments (
    era_id                  VARCHAR(15)     PRIMARY KEY,
    claim_id                VARCHAR(15)     NOT NULL REFERENCES claims(claim_id),
    payer_id                VARCHAR(10)     NOT NULL REFERENCES payer_master(payer_id),
    waystar_era_id          VARCHAR(25),

    -- ADTP cycle fields
    payment_date            DATE            NOT NULL,  -- actual ERA date (ADTP-driven)
    payment_week_start      DATE            NOT NULL,  -- Monday of payment week
    adtp_cycle_number       INTEGER,                   -- which batch (1st, 2nd, 3rd...)

    -- Payment details
    payment_amount          DECIMAL(12,2)   NOT NULL,
    payment_method          VARCHAR(10)     DEFAULT 'EFT',  -- EFT | CHECK
    eft_trace_number        VARCHAR(30),
    check_number            VARCHAR(20),

    -- ERA adjustment breakdown
    allowed_amount          DECIMAL(12,2),
    co_amount               DECIMAL(12,2)   DEFAULT 0, -- Contractual Obligation
    pr_amount               DECIMAL(12,2)   DEFAULT 0, -- Patient Responsibility
    oa_amount               DECIMAL(12,2)   DEFAULT 0, -- Other Adjustment
    pi_amount               DECIMAL(12,2)   DEFAULT 0, -- Payer Initiated

    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------------------------------
-- 12. PAYMENT FORECAST — Weekly per payer
--     Generated by: Prophet + LightGBM model
--     Inputs: ADTP cycle calendar + historical ERA amounts + pending claim volume
--     "WHO pays this week and HOW MUCH" — before the money arrives
-- -----------------------------------------------------------------------------
CREATE TABLE payment_forecast (
    forecast_id             VARCHAR(15)     PRIMARY KEY,
    week_start_date         DATE            NOT NULL,  -- Monday
    week_end_date           DATE            NOT NULL,  -- Sunday
    payer_id                VARCHAR(10)     NOT NULL REFERENCES payer_master(payer_id),
    payer_name              VARCHAR(100),
    payer_group             VARCHAR(40),

    -- ADTP cycle hit
    adtp_cycle_hits         BOOLEAN         NOT NULL,  -- does this payer's cycle fall this week?
    adtp_cycle_number       INTEGER,                   -- which cycle number (1,2,3...)

    -- Forecast
    forecasted_amount       DECIMAL(12,2)   NOT NULL,  -- model output
    claim_count_in_window   INTEGER,                   -- pending claims in this payer's ADTP window
    avg_historical_amount   DECIMAL(12,2),             -- rolling avg of last 8 cycles
    model_confidence        DECIMAL(5,4),              -- 0.00 to 1.00
    forecast_range_low      DECIMAL(12,2),             -- p25 scenario
    forecast_range_high     DECIMAL(12,2),             -- p75 scenario
    model_version           VARCHAR(20),

    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (week_start_date, payer_id)
);


-- -----------------------------------------------------------------------------
-- 13. BANK RECONCILIATION — Weekly cycle close
--     Closes the full loop:
--       Forecast (expected) vs ERA received (actual) vs Bank deposit (confirmed)
--     Variance feeds back into forecasting model to improve next cycle.
-- -----------------------------------------------------------------------------
CREATE TABLE bank_reconciliation (
    recon_id                VARCHAR(15)     PRIMARY KEY,
    week_start_date         DATE            NOT NULL,
    week_end_date           DATE            NOT NULL,
    payer_id                VARCHAR(10)     NOT NULL REFERENCES payer_master(payer_id),
    payer_name              VARCHAR(100),

    -- The three numbers that must reconcile
    forecasted_amount       DECIMAL(12,2)   NOT NULL,  -- from payment_forecast
    era_received_amount     DECIMAL(12,2),             -- sum of era_payments this week
    bank_deposit_amount     DECIMAL(12,2),             -- actual bank deposit confirmed

    -- Variance (actual - forecasted)
    forecast_variance       DECIMAL(12,2),             -- era_received - forecasted
    forecast_variance_pct   DECIMAL(8,4),              -- variance / forecasted * 100
    era_bank_variance       DECIMAL(12,2),             -- bank_deposit - era_received (timing diff)

    -- Status
    reconciliation_status   VARCHAR(20)     NOT NULL   -- RECONCILED | VARIANCE | PENDING
                            DEFAULT 'PENDING',          -- | ESCALATED
    reconciled_date         DATE,
    reconciled_by           VARCHAR(50),
    variance_reason         VARCHAR(500),
    -- e.g. "BCBS claim volume 12% higher than forecast period",
    --      "Medicare batch delayed by federal holiday",
    --      "Cigna partial payment — COB adjustment pending"

    -- ML feedback signal
    fed_back_to_model       BOOLEAN         DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (week_start_date, payer_id)
);


-- -----------------------------------------------------------------------------
-- 14. EVV VISITS — Electronic Visit Verification (Home Health)
--     Source: State EVV Aggregators (Sandata, HHAeXchange, AuthentiCare)
--     Drives: CRS EVV check (10pts), EVV fraud detection model
-- -----------------------------------------------------------------------------
CREATE TABLE evv_visits (
    evv_id                  VARCHAR(15)     PRIMARY KEY,
    patient_id              VARCHAR(10)     NOT NULL REFERENCES patients(patient_id),
    claim_id                VARCHAR(15)     REFERENCES claims(claim_id),
    caregiver_id            VARCHAR(10)     NOT NULL,
    aggregator              VARCHAR(20)     NOT NULL,  -- SANDATA | HHAXCHANGE | AUTHENTICARE | NETSMART
    state_code              VARCHAR(2)      NOT NULL,

    service_code            VARCHAR(10),               -- T1019, S5125, G0156...
    service_description     VARCHAR(100),
    visit_date              DATE            NOT NULL,
    scheduled_start         TIME,
    scheduled_end           TIME,
    actual_clock_in         TIME,
    actual_clock_out        TIME,
    scheduled_duration_min  INTEGER,
    actual_duration_min     INTEGER,

    -- GPS verification
    gps_verified            BOOLEAN         DEFAULT FALSE,
    gps_distance_at_in_ft   INTEGER,                   -- distance from patient address at clock-in
    gps_distance_at_out_ft  INTEGER,
    clock_in_method         VARCHAR(15),               -- MOBILE_APP | TELEPHONY | FOB | BIOMETRIC
    caregiver_signature     BOOLEAN         DEFAULT FALSE,
    patient_signature       BOOLEAN         DEFAULT FALSE,

    -- Outcome
    evv_status              VARCHAR(15)     NOT NULL,  -- VERIFIED | EXCEPTION | DENIED
    evv_denial_code         VARCHAR(15),
    -- EVV-001 GPS mismatch (>300ft), EVV-002 time discrepancy >15min,
    -- EVV-003 caregiver not verified, EVV-004 unauthorized service,
    -- EVV-005 visit not scheduled, EVV-006 caregiver-patient mismatch
    evv_denial_description  VARCHAR(200),

    billable                BOOLEAN         DEFAULT FALSE,
    billing_hold_reason     VARCHAR(200),
    units_scheduled         DECIMAL(8,2),
    units_verified          DECIMAL(8,2),

    created_at              TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);


-- =============================================================================
-- INDEXES — For ML feature extraction and dashboard query performance
-- =============================================================================

-- Claims — most queried table
CREATE INDEX idx_claims_payer        ON claims(payer_id);
CREATE INDEX idx_claims_patient      ON claims(patient_id);
CREATE INDEX idx_claims_status       ON claims(status);
CREATE INDEX idx_claims_dos          ON claims(date_of_service);
CREATE INDEX idx_claims_exp_pay_date ON claims(expected_payment_date);
CREATE INDEX idx_claims_exp_pay_week ON claims(expected_payment_week);
CREATE INDEX idx_claims_crs          ON claims(crs_score);

-- ERA — payment forecasting queries
CREATE INDEX idx_era_payer           ON era_payments(payer_id);
CREATE INDEX idx_era_pay_date        ON era_payments(payment_date);
CREATE INDEX idx_era_pay_week        ON era_payments(payment_week_start);

-- Denials — denial prediction model features
CREATE INDEX idx_denials_claim       ON denials(claim_id);
CREATE INDEX idx_denials_carc        ON denials(carc_code);
CREATE INDEX idx_denials_category    ON denials(denial_category);
CREATE INDEX idx_denials_date        ON denials(denial_date);

-- Forecasting + Reconciliation
CREATE INDEX idx_forecast_week_payer ON payment_forecast(week_start_date, payer_id);
CREATE INDEX idx_recon_week_payer    ON bank_reconciliation(week_start_date, payer_id);

-- EVV
CREATE INDEX idx_evv_patient         ON evv_visits(patient_id);
CREATE INDEX idx_evv_status          ON evv_visits(evv_status);
CREATE INDEX idx_evv_date            ON evv_visits(visit_date);


-- =============================================================================
-- SCHEMA SUMMARY
-- =============================================================================
-- Table                  Rows (synthetic)   Source System
-- ─────────────────────────────────────────────────────────────────────────
-- payer_master                      50       Internal / CMS NPI registry
-- providers                        200       EHR
-- patients                      50,000       EHR
-- insurance_coverage            85,000       EHR + Payer API
-- claims                       500,000       EHR → Waystar 837
-- claim_lines                1,500,000       EHR
-- prior_auth                   120,000       EHR + Payer portal
-- eligibility_271              200,000       Payer API (270/271)
-- denials                       62,000       Waystar ERA 835 + 277CA
-- appeals                       27,000       Internal + Waystar
-- era_payments                 430,000       Waystar ERA 835 (ADTP-driven dates)
-- payment_forecast               7,800       Internal ML model (50 payers × 156 weeks)
-- bank_reconciliation            7,800       Internal (closes the cycle weekly)
-- evv_visits                    80,000       State EVV Aggregators
-- =============================================================================
