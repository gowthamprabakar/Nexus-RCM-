-- Sprint 7: Persistent diagnostic findings table
-- Run: psql -U postgres -d rcmpulse -f create_diagnostic_finding_table.sql

CREATE TABLE IF NOT EXISTS diagnostic_finding (
    finding_id          VARCHAR PRIMARY KEY,
    category            VARCHAR NOT NULL,        -- DENIAL_PATTERN, PAYER_BEHAVIOR, ADTP_ANOMALY, REVENUE_LEAKAGE, AR_AGING
    severity            VARCHAR NOT NULL,        -- CRITICAL, WARNING, INFO
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
    status              VARCHAR DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED
    created_at          TIMESTAMP DEFAULT NOW(),
    resolved_at         TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diag_finding_category ON diagnostic_finding(category);
CREATE INDEX IF NOT EXISTS idx_diag_finding_severity ON diagnostic_finding(severity);
CREATE INDEX IF NOT EXISTS idx_diag_finding_status   ON diagnostic_finding(status);
CREATE INDEX IF NOT EXISTS idx_diag_finding_payer    ON diagnostic_finding(payer_id);
