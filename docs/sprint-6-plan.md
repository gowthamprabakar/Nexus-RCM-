# NEXUS RCM — Sprint 6 Plan
## "Know WHAT'S WRONG — Real Diagnostic Engine + Claim-Level Prediction"

**Sprint Duration:** 3 weeks (March 22 - April 11, 2026)
**Prepared by:** Sarah (BA), James (PM)
**Domain validation:** Marcus (RCM SME)
**Architecture validation:** Priya (ARCH)

---

## 1. SPRINT 6 OVERVIEW

### Theme
Transform NEXUS from a system that **describes** what happened (Sprint 4) and **explains** why (Sprint 5) into one that **diagnoses** what is systemically wrong and **predicts** what will go wrong next. The diagnostic engine consumes root cause data, payer behavior, ADTP trends, and triangulation signals to produce ranked, confidence-scored diagnostic findings. The LLM narrates; the engine decides.

### Goals
1. **Backfill:** Run batch root cause analysis on all 62K existing denials to populate the empty `root_cause_analysis` table.
2. **Diagnostic Engine:** Build `diagnostic_service.py` — a service that synthesizes root cause + payer behavior + ADTP + triangulation into ranked diagnostic findings with confidence scores.
3. **Investigation Panel Live Data:** Replace ALL mock data in `RootCauseInvestigationPanel` with real API calls.
4. **CRS Enhancement:** Enhance Claim Risk Score with payer behavioral data (payer-specific denial rates, ADTP, triangulation signals).
5. **Revenue Forecast 3-Layer:** Wire Revenue Forecast to Gross -> Denial-adjusted -> ADTP-timed model.
6. **Zero Static AI:** Replace ALL remaining hardcoded/mock AI insights across 8 pages.
7. **Diagnostic Wiring:** Wire diagnostic findings into CommandCenter, ExecutiveDashboard, and LidaDashboard.

### Success Criteria
- `root_cause_analysis` table has >= 60K rows (one per denial)
- Diagnostic engine returns findings in < 500ms for summary, < 200ms for single claim
- Investigation panel shows ZERO mock data — every section fed by API
- CRS v2 incorporates payer behavioral data; score distribution shifts measurably
- Revenue Forecast page shows 3 layers with real data
- `grep -r "MOCK\|mockAi\|AI_INSIGHTS\|EXEC_AI\|LIDA_AI\|CC_AI\|INSIGHTS_WQ\|INSIGHTS_SCRUB" frontend/src/pages/` returns ZERO hits

### Rules Enforced
- No new pages without Marcus sign-off (see Section 1.1)
- No aspirational badges — Diagnostic badge requires real causal analysis
- API contract first — schema agreed before frontend dev
- Overlay components use `createPortal`
- Three-signal test: HOW/WHEN/WHERE for every feature
- Backend heavy, frontend simple and contextual
- The LLM is the mouth, the engine is the brain

---

### 1.1 New Page Justification (Marcus Sign-Off Required)

The sprint-uiux-delivery-plan.md calls for 4 new pages in Sprint 6. Applying the retro rule "Pages = user tasks, not data views":

| Proposed Page | Marcus Ruling | Justification |
|---|---|---|
| **Diagnostic Dashboard** (`/analytics/diagnostics`) | **APPROVED** | User task: "Show me what is systemically wrong across my revenue cycle right now." This is not a data view — it answers a specific operational question. HOW: aggregated diagnostic findings ranked by financial impact. WHEN: loaded on demand, refreshed hourly. WHERE: Intelligence Hub nav. |
| **Claim Risk Predictor** (`/claims/risk-assessment`) | **DEFER TO SPRINT 7** — enhance HighRiskClaims instead | The HighRiskClaims page already exists. Adding a second page for risk creates navigation confusion. Sprint 6 enhances HighRiskClaims with payer behavioral data and predicted CARC codes. A standalone predictor form (input CPT+payer, get risk) is a Sprint 7 automation feature. |
| **Payer Behavioral Profile** (`/payments/payer-profile/:payerId`) | **APPROVED as overlay, NOT page** | User task: "Tell me everything about this payer's behavior." But this is drill-down context, not a standalone task. Implement as a slide-out panel (like Investigation Panel) accessible from PayerPerformance, DenialManagement, PaymentDashboard. No nav entry. |
| **Revenue Leakage Analyzer** (`/analytics/revenue-leakage`) | **APPROVED** | User task: "Show me where money is falling through the cracks." Distinct from Diagnostic Dashboard (which shows what is wrong) — this shows financial impact quantification. HOW: aggregates silent underpayments + uncollected COB + missed timely filing + write-offs that should have been appealed. WHEN: on demand. WHERE: Intelligence Hub nav. |

**Net new pages this sprint: 2** (Diagnostic Dashboard, Revenue Leakage Analyzer)
**Net new overlays: 1** (Payer Behavioral Profile panel)
**Enhanced existing pages: 10**

---

## 2. AGENT TASK BREAKDOWN

---

### AGENT 1: Database/Data Engineer

---

#### S6-DB-01: Backfill Root Cause Analysis for 62K Denials
**Three-signal test:**
- HOW: Python backfill script calling `batch_analyze_pending()` in batches of 500
- WHEN: Run once at sprint start, then nightly for new denials
- WHERE: `backend/app/scripts/backfill_root_cause.py`

**Task:** Create a standalone script that:
1. Queries all denials where `root_cause_status = 'PENDING'`
2. Calls `analyze_denial_root_cause()` for each in batches of 500
3. Commits every batch (not every row)
4. Logs progress: `Batch 1/124: 500 analyzed, 3 errors`
5. On completion, logs total: `62,147 denials processed, 61,892 analyzed, 255 errors`
6. Handles resume — if interrupted, picks up where it left off (checks `root_cause_status`)

**Performance target:** < 30 minutes for 62K denials (batch commits, no per-row flush)

**Script signature:**
```python
# backend/app/scripts/backfill_root_cause.py
async def run_backfill(batch_size: int = 500, max_batches: int = None):
    """
    Backfill root_cause_analysis for all PENDING denials.
    Resumes from where it left off on restart.
    """
```

---

#### S6-DB-02: Create `diagnostic_finding` Table
**Three-signal test:**
- HOW: New SQLAlchemy model + Alembic migration
- WHEN: Created before diagnostic_service.py can write findings
- WHERE: `backend/app/models/diagnostic.py`

**Schema:**
```sql
CREATE TABLE diagnostic_finding (
    finding_id          VARCHAR(20) PRIMARY KEY,     -- "DXF" + 11-char UUID
    finding_type        VARCHAR(40) NOT NULL,        -- REVENUE_LEAKAGE | PAYER_BEHAVIOR_SHIFT | PROCESS_BOTTLENECK | CODING_PATTERN | DOCUMENTATION_GAP | ELIGIBILITY_SYSTEMIC | AUTH_WORKFLOW_FAILURE
    severity            VARCHAR(10) NOT NULL,        -- CRITICAL | HIGH | MEDIUM | LOW
    title               VARCHAR(200) NOT NULL,       -- Human-readable: "Humana prior auth denials up 340% in 30d"
    description         TEXT,                        -- Detailed finding narrative

    -- Evidence linkage
    root_cause_pattern  VARCHAR(60),                 -- PRIMARY root cause driving this finding (from ROOT_CAUSE_GROUPS)
    affected_payer_id   VARCHAR(10),                 -- NULL if system-wide
    affected_claims_count INTEGER NOT NULL DEFAULT 0,
    financial_impact    FLOAT NOT NULL DEFAULT 0,    -- Total $ at risk

    -- Confidence
    confidence_score    INTEGER NOT NULL,            -- 0-99
    evidence_count      INTEGER NOT NULL DEFAULT 0,  -- Number of root cause analyses supporting this finding

    -- Diagnostic classification (RCM Bible Part 3)
    diagnostic_category VARCHAR(40),                 -- Maps to 8 categories from RCM Bible Part 3

    -- Resolution
    recommended_action  VARCHAR(500),
    resolution_status   VARCHAR(20) DEFAULT 'OPEN',  -- OPEN | ACKNOWLEDGED | IN_PROGRESS | RESOLVED | DISMISSED

    -- Temporal
    first_detected_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at         TIMESTAMP WITH TIME ZONE,

    -- Indexes
    INDEX idx_df_type (finding_type),
    INDEX idx_df_severity (severity),
    INDEX idx_df_payer (affected_payer_id),
    INDEX idx_df_status (resolution_status),
    INDEX idx_df_category (diagnostic_category)
);
```

**SQLAlchemy model:**
```python
# backend/app/models/diagnostic.py
class DiagnosticFinding(Base):
    __tablename__ = "diagnostic_finding"

    finding_id          = Column(String(20), primary_key=True, index=True)
    finding_type        = Column(String(40), nullable=False, index=True)
    severity            = Column(String(10), nullable=False, index=True)
    title               = Column(String(200), nullable=False)
    description         = Column(Text)
    root_cause_pattern  = Column(String(60))
    affected_payer_id   = Column(String(10), index=True)
    affected_claims_count = Column(Integer, default=0)
    financial_impact    = Column(Float, default=0)
    confidence_score    = Column(Integer, nullable=False)
    evidence_count      = Column(Integer, default=0)
    diagnostic_category = Column(String(40), index=True)
    recommended_action  = Column(String(500))
    resolution_status   = Column(String(20), default="OPEN", index=True)
    first_detected_at   = Column(DateTime(timezone=True), server_default=func.now())
    last_updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    resolved_at         = Column(DateTime(timezone=True))
```

---

#### S6-DB-03: Create `revenue_leakage` Table
**Three-signal test:**
- HOW: New table capturing identified leakage sources
- WHEN: Populated by diagnostic engine during analysis
- WHERE: `backend/app/models/diagnostic.py` (same file)

**Schema:**
```sql
CREATE TABLE revenue_leakage (
    leakage_id          VARCHAR(20) PRIMARY KEY,     -- "RLK" + 11-char UUID
    leakage_type        VARCHAR(40) NOT NULL,        -- SILENT_UNDERPAYMENT | MISSED_TIMELY_FILING | UNRECOVERED_APPEAL | COB_UNCOLLECTED | CONTRACT_UNDERPAYMENT | WRITE_OFF_RECOVERABLE
    source_claim_id     VARCHAR(15),
    source_denial_id    VARCHAR(15),
    payer_id            VARCHAR(10) NOT NULL,

    expected_amount     FLOAT NOT NULL,
    actual_amount       FLOAT NOT NULL DEFAULT 0,
    leakage_amount      FLOAT NOT NULL,              -- expected - actual

    detection_method    VARCHAR(30) NOT NULL,         -- TRIANGULATION | ROOT_CAUSE | ADTP | CONTRACT_RATE_COMPARE
    finding_id          VARCHAR(20),                  -- FK to diagnostic_finding

    status              VARCHAR(20) DEFAULT 'DETECTED', -- DETECTED | RECOVERY_INITIATED | RECOVERED | WRITTEN_OFF
    recovery_amount     FLOAT DEFAULT 0,

    detected_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_rl_type (leakage_type),
    INDEX idx_rl_payer (payer_id),
    INDEX idx_rl_status (status),
    INDEX idx_rl_finding (finding_id)
);
```

---

#### S6-DB-04: Create `claim_risk_prediction` Table
**Three-signal test:**
- HOW: Stores pre-submission risk predictions with payer behavioral factors
- WHEN: Written by enhanced CRS engine
- WHERE: `backend/app/models/diagnostic.py`

**Schema:**
```sql
CREATE TABLE claim_risk_prediction (
    prediction_id           VARCHAR(20) PRIMARY KEY,
    claim_id                VARCHAR(15) NOT NULL,
    payer_id                VARCHAR(10) NOT NULL,

    -- Base CRS (existing 100-pt scale)
    base_crs_score          INTEGER NOT NULL,

    -- Payer behavioral adjustments (new in Sprint 6)
    payer_denial_rate_90d   FLOAT,           -- This payer's denial rate last 90 days
    payer_carc_match_rate   FLOAT,           -- Rate this payer denies this CPT+CARC combo
    payer_adtp_deviation    FLOAT,           -- ADTP Z-score for this payer
    payer_underpayment_rate FLOAT,           -- Silent underpayment rate from triangulation

    -- Enhanced risk score (0-100, lower=riskier)
    enhanced_risk_score     INTEGER NOT NULL,
    denial_probability      FLOAT NOT NULL,   -- 0.0 to 1.0
    predicted_carc          VARCHAR(10),       -- Most likely CARC code if denied

    -- Risk factors (JSON array)
    risk_factors            TEXT,              -- JSON: [{"factor": "...", "weight": 0.3, "detail": "..."}]

    predicted_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_crp_claim (claim_id),
    INDEX idx_crp_payer (payer_id),
    INDEX idx_crp_score (enhanced_risk_score)
);
```

---

#### S6-DB-05: Create Materialized Views for Diagnostic Engine
**Three-signal test:**
- HOW: SQL materialized views refreshed on schedule
- WHEN: Refreshed hourly by cron / every backfill run
- WHERE: Alembic migration

**Views to create:**

```sql
-- 1. Root cause distribution by payer (used by diagnostic engine + investigation panel)
CREATE MATERIALIZED VIEW mv_root_cause_by_payer AS
SELECT
    rca.payer_id,
    rca.primary_root_cause,
    rca.root_cause_group,
    COUNT(*) as denial_count,
    SUM(rca.financial_impact) as total_impact,
    AVG(rca.confidence_score) as avg_confidence,
    COUNT(*) FILTER (WHERE rca.created_at >= CURRENT_DATE - INTERVAL '30 days') as count_30d,
    COUNT(*) FILTER (WHERE rca.created_at >= CURRENT_DATE - INTERVAL '7 days') as count_7d
FROM root_cause_analysis rca
GROUP BY rca.payer_id, rca.primary_root_cause, rca.root_cause_group;

CREATE UNIQUE INDEX ON mv_root_cause_by_payer (payer_id, primary_root_cause);

-- 2. Payer behavioral summary (used by CRS v2 + payer profile panel)
CREATE MATERIALIZED VIEW mv_payer_behavior AS
SELECT
    p.payer_id,
    p.payer_name,
    COUNT(DISTINCT d.denial_id) as total_denials,
    COUNT(DISTINCT c.claim_id) as total_claims,
    CASE WHEN COUNT(DISTINCT c.claim_id) > 0
         THEN COUNT(DISTINCT d.denial_id)::FLOAT / COUNT(DISTINCT c.claim_id)
         ELSE 0 END as denial_rate,
    AVG(d.denial_amount) as avg_denial_amount,
    SUM(d.denial_amount) as total_denied_amount,
    -- ADTP from latest trend
    (SELECT actual_adtp_days FROM adtp_trend t
     WHERE t.payer_id = p.payer_id
     ORDER BY t.calculation_date DESC LIMIT 1) as latest_adtp,
    (SELECT z_score FROM adtp_trend t
     WHERE t.payer_id = p.payer_id
     ORDER BY t.calculation_date DESC LIMIT 1) as latest_adtp_z,
    (SELECT is_anomaly FROM adtp_trend t
     WHERE t.payer_id = p.payer_id
     ORDER BY t.calculation_date DESC LIMIT 1) as adtp_anomaly
FROM payers p
LEFT JOIN claims c ON c.payer_id = p.payer_id
LEFT JOIN denials d ON d.claim_id = c.claim_id
GROUP BY p.payer_id, p.payer_name;

CREATE UNIQUE INDEX ON mv_payer_behavior (payer_id);

-- 3. Revenue leakage summary (used by Revenue Leakage Analyzer page)
CREATE MATERIALIZED VIEW mv_revenue_leakage_summary AS
SELECT
    leakage_type,
    payer_id,
    COUNT(*) as leakage_count,
    SUM(leakage_amount) as total_leakage,
    SUM(recovery_amount) as total_recovered,
    SUM(leakage_amount) - SUM(recovery_amount) as net_leakage,
    AVG(leakage_amount) as avg_leakage
FROM revenue_leakage
WHERE status != 'WRITTEN_OFF'
GROUP BY leakage_type, payer_id;

CREATE UNIQUE INDEX ON mv_revenue_leakage_summary (leakage_type, payer_id);
```

**Refresh script:**
```python
# backend/app/scripts/refresh_materialized_views.py
async def refresh_views(db: AsyncSession):
    await db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_root_cause_by_payer"))
    await db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payer_behavior"))
    await db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_leakage_summary"))
    await db.commit()
```

---

#### S6-DB-06: Add Columns to `claims` Table for Enhanced CRS
**Three-signal test:**
- HOW: Alembic migration adding columns
- WHEN: Before CRS v2 service runs
- WHERE: `claims` table

**New columns:**
```sql
ALTER TABLE claims ADD COLUMN crs_payer_risk_adj   FLOAT;        -- Payer behavioral risk adjustment (-20 to +20)
ALTER TABLE claims ADD COLUMN crs_enhanced_score   INTEGER;      -- CRS v2 score (base + payer adj)
ALTER TABLE claims ADD COLUMN denial_probability   FLOAT;        -- 0.0 to 1.0
ALTER TABLE claims ADD COLUMN predicted_carc       VARCHAR(10);  -- Most likely denial CARC
```

---

### AGENT 2: Backend API Developer

---

#### S6-API-01: POST /api/v1/root-cause/batch-analyze — Trigger Batch Analysis
**Three-signal test:**
- HOW: Triggers batch analysis for PENDING denials
- WHEN: Called by admin/scheduler to process new denials
- WHERE: `backend/app/api/v1/root_cause.py`

**Contract:**
```
POST /api/v1/root-cause/batch-analyze
Request body:
{
    "batch_size": 500          // optional, default 500
}

Response 200:
{
    "analyzed": 487,
    "errors": 13,
    "remaining_pending": 0,
    "elapsed_seconds": 42.3
}
```

**Service function:**
```python
# Existing: batch_analyze_pending(db, batch_size) in root_cause_service.py
# Enhancement: add timing and error counting
async def batch_analyze_pending(db: AsyncSession, batch_size: int = 500) -> dict:
    # Returns: {"analyzed": int, "errors": int, "remaining_pending": int, "elapsed_seconds": float}
```

---

#### S6-API-02: GET /api/v1/diagnostics/summary — Diagnostic Summary
**Three-signal test:**
- HOW: Returns ranked diagnostic findings with severity and financial impact
- WHEN: Called by CommandCenter, Diagnostic Dashboard, LidaDashboard
- WHERE: `backend/app/api/v1/diagnostics.py` (new router)

**Contract:**
```
GET /api/v1/diagnostics/summary?severity=CRITICAL&limit=10

Response 200:
{
    "total_findings": 23,
    "critical_count": 4,
    "high_count": 8,
    "medium_count": 7,
    "low_count": 4,
    "total_financial_impact": 2847000.00,
    "findings": [
        {
            "finding_id": "DXF8A3B2C1D0E1",
            "finding_type": "PAYER_BEHAVIOR_SHIFT",
            "severity": "CRITICAL",
            "title": "Humana prior auth denials increased 340% in 30 days",
            "description": "Analysis of 847 Humana denials shows a sharp increase in AUTH_MISSING root cause starting 2026-02-15. 64% of these denials share CARC CO-197. Financial impact: $580K.",
            "root_cause_pattern": "AUTH_MISSING",
            "affected_payer_id": "PAY003",
            "affected_claims_count": 847,
            "financial_impact": 580000.00,
            "confidence_score": 87,
            "evidence_count": 847,
            "diagnostic_category": "PAYER_BEHAVIOR",
            "recommended_action": "Escalate to Humana payer relations. Review prior auth workflow for Humana commercial plans. Verify auth requirements changed.",
            "resolution_status": "OPEN",
            "first_detected_at": "2026-03-20T14:30:00Z",
            "last_updated_at": "2026-03-22T08:00:00Z"
        }
    ]
}
```

**Service function:**
```python
# backend/app/services/diagnostic_service.py
async def get_diagnostic_summary(
    db: AsyncSession,
    severity: Optional[str] = None,
    finding_type: Optional[str] = None,
    limit: int = 20
) -> dict:
```

---

#### S6-API-03: GET /api/v1/diagnostics/alerts — Active Diagnostic Alerts
**Three-signal test:**
- HOW: Returns top CRITICAL+HIGH findings sorted by financial impact
- WHEN: Called by CommandCenter top bar, Investigation Panel header
- WHERE: `backend/app/api/v1/diagnostics.py`

**Contract:**
```
GET /api/v1/diagnostics/alerts?limit=5

Response 200:
{
    "alerts": [
        {
            "finding_id": "DXF8A3B2C1D0E1",
            "severity": "CRITICAL",
            "title": "Humana prior auth denials increased 340% in 30 days",
            "financial_impact": 580000.00,
            "affected_claims_count": 847,
            "recommended_action": "Escalate to Humana payer relations",
            "first_detected_at": "2026-03-20T14:30:00Z"
        }
    ],
    "total_critical": 4,
    "total_high": 8
}
```

---

#### S6-API-04: GET /api/v1/diagnostics/revenue-leakage — Revenue Leakage Sources
**Three-signal test:**
- HOW: Aggregates all revenue leakage by type with drill-down
- WHEN: Called by Revenue Leakage Analyzer page
- WHERE: `backend/app/api/v1/diagnostics.py`

**Contract:**
```
GET /api/v1/diagnostics/revenue-leakage?payer_id=PAY003

Response 200:
{
    "total_leakage": 1420000.00,
    "total_recovered": 380000.00,
    "net_leakage": 1040000.00,
    "recovery_rate": 26.8,
    "by_type": [
        {
            "leakage_type": "SILENT_UNDERPAYMENT",
            "count": 342,
            "total_amount": 485000.00,
            "recovered": 120000.00,
            "pct_of_total": 34.2,
            "detection_method": "TRIANGULATION"
        },
        {
            "leakage_type": "MISSED_TIMELY_FILING",
            "count": 156,
            "total_amount": 312000.00,
            "recovered": 0,
            "pct_of_total": 22.0,
            "detection_method": "ROOT_CAUSE"
        },
        {
            "leakage_type": "UNRECOVERED_APPEAL",
            "count": 89,
            "total_amount": 267000.00,
            "recovered": 180000.00,
            "pct_of_total": 18.8,
            "detection_method": "ROOT_CAUSE"
        },
        {
            "leakage_type": "CONTRACT_UNDERPAYMENT",
            "count": 201,
            "total_amount": 198000.00,
            "recovered": 45000.00,
            "pct_of_total": 13.9,
            "detection_method": "CONTRACT_RATE_COMPARE"
        },
        {
            "leakage_type": "COB_UNCOLLECTED",
            "count": 67,
            "total_amount": 158000.00,
            "recovered": 35000.00,
            "pct_of_total": 11.1,
            "detection_method": "ROOT_CAUSE"
        }
    ],
    "top_payers": [
        {
            "payer_id": "PAY003",
            "payer_name": "Humana",
            "leakage_amount": 420000.00,
            "leakage_count": 312
        }
    ]
}
```

---

#### S6-API-05: POST /api/v1/claims/risk-predict — Enhanced CRS Prediction
**Three-signal test:**
- HOW: Takes a claim_id, runs CRS v2 with payer behavioral data, returns enhanced risk
- WHEN: Called before submission (HighRiskClaims, ClaimsWorkQueue pre-check button)
- WHERE: `backend/app/api/v1/claims.py` (add to existing router)

**Contract:**
```
POST /api/v1/claims/risk-predict
Request body:
{
    "claim_id": "CLM00012345"
}

Response 200:
{
    "claim_id": "CLM00012345",
    "base_crs_score": 75,
    "payer_adjustments": {
        "payer_id": "PAY003",
        "payer_name": "Humana",
        "denial_rate_90d": 0.12,
        "carc_match_rate": 0.34,
        "adtp_z_score": 2.8,
        "underpayment_rate": 0.08,
        "total_adjustment": -18
    },
    "enhanced_risk_score": 57,
    "denial_probability": 0.43,
    "predicted_carc": "CO-197",
    "risk_factors": [
        {"factor": "Payer denial rate above average", "weight": 0.30, "detail": "Humana denying 12% vs 6.5% system average"},
        {"factor": "CARC CO-197 frequency", "weight": 0.25, "detail": "34% of Humana denials for this CPT use CO-197"},
        {"factor": "ADTP anomaly detected", "weight": 0.20, "detail": "Humana ADTP Z-score 2.8 (payment delays)"},
        {"factor": "Missing prior authorization", "weight": 0.15, "detail": "CRS auth component scored 0/25"},
        {"factor": "Silent underpayment risk", "weight": 0.10, "detail": "8% underpayment rate on this payer"}
    ],
    "recommended_actions": [
        "Obtain prior authorization before submission",
        "Verify coverage is active for date of service",
        "Consider holding submission pending Humana policy clarification"
    ]
}
```

**Service function:**
```python
# backend/app/services/crs_v2.py (new file)
async def predict_claim_risk(
    db: AsyncSession,
    claim_id: str
) -> dict:
    """
    Enhanced CRS with payer behavioral data.
    1. Get base CRS score from claims table
    2. Query mv_payer_behavior for payer stats
    3. Query mv_root_cause_by_payer for payer-specific CARC patterns
    4. Compute payer risk adjustment
    5. Calculate denial probability
    6. Predict most likely CARC
    7. Write to claim_risk_prediction table
    """
```

---

#### S6-API-06: GET /api/v1/claims/risk-distribution — Risk Score Distribution
**Three-signal test:**
- HOW: Returns histogram of enhanced CRS scores across all claims in pipeline
- WHEN: Called by ClaimsOverview to replace static AI insight
- WHERE: `backend/app/api/v1/claims.py`

**Contract:**
```
GET /api/v1/claims/risk-distribution

Response 200:
{
    "total_claims_in_pipeline": 8420,
    "distribution": {
        "high_risk": {"count": 1240, "pct": 14.7, "total_charges": 4200000},
        "medium_risk": {"count": 2860, "pct": 34.0, "total_charges": 8100000},
        "low_risk": {"count": 4320, "pct": 51.3, "total_charges": 11200000}
    },
    "avg_enhanced_score": 72,
    "avg_denial_probability": 0.08
}
```

---

#### S6-API-07: GET /api/v1/payer/{payer_id}/profile — Payer Behavioral Profile
**Three-signal test:**
- HOW: Deep payer profile from mv_payer_behavior + ADTP + root cause + triangulation
- WHEN: Called by Payer Behavioral Profile overlay panel
- WHERE: `backend/app/api/v1/payments.py` (add to existing router)

**Contract:**
```
GET /api/v1/payer/PAY003/profile

Response 200:
{
    "payer_id": "PAY003",
    "payer_name": "Humana Commercial",
    "summary": {
        "total_claims": 12400,
        "total_denials": 1488,
        "denial_rate": 0.12,
        "total_denied_amount": 2480000.00,
        "avg_denial_amount": 1667.00
    },
    "adtp": {
        "actual_adtp": 18.4,
        "expected_adtp": 14,
        "deviation_days": 4.4,
        "z_score": 2.8,
        "is_anomaly": true,
        "anomaly_type": "PAYMENT_DELAY",
        "trend_direction": "WORSENING"
    },
    "root_cause_distribution": [
        {"root_cause": "AUTH_MISSING", "count": 512, "pct": 34.4, "impact": 854000},
        {"root_cause": "CODING_MISMATCH", "count": 298, "pct": 20.0, "impact": 497000},
        {"root_cause": "ELIGIBILITY_LAPSE", "count": 267, "pct": 17.9, "impact": 445000}
    ],
    "top_carc_codes": [
        {"carc_code": "CO-197", "count": 412, "pct": 27.7},
        {"carc_code": "CO-4", "count": 289, "pct": 19.4}
    ],
    "triangulation": {
        "forecast_era_gap_pct": -3.2,
        "era_bank_gap_pct": -1.1,
        "avg_float_days": 4.2,
        "silent_underpayment_rate": 0.08
    },
    "30d_trend": {
        "denial_rate_30d": 0.15,
        "denial_rate_prev_30d": 0.09,
        "change_pct": 66.7,
        "direction": "WORSENING"
    }
}
```

---

#### S6-API-08: GET /api/v1/forecast/3-layer — Three-Layer Revenue Forecast
**Three-signal test:**
- HOW: Gross charges -> subtract predicted denials -> adjust for ADTP timing
- WHEN: Called by Revenue Forecast page
- WHERE: `backend/app/api/v1/forecast.py` (add to existing router)

**Contract:**
```
GET /api/v1/forecast/3-layer?weeks_ahead=8

Response 200:
{
    "generated_at": "2026-03-22T10:00:00Z",
    "weeks": [
        {
            "week_start": "2026-03-23",
            "week_end": "2026-03-29",
            "layer_1_gross": 2400000.00,
            "layer_2_denial_adjusted": 2208000.00,
            "layer_3_adtp_timed": 1980000.00,
            "predicted_denial_amount": 192000.00,
            "predicted_denial_rate": 0.08,
            "adtp_timing_adjustment": -228000.00,
            "confidence_interval_low": 1820000.00,
            "confidence_interval_high": 2140000.00
        }
    ],
    "summary": {
        "total_gross_8w": 19200000.00,
        "total_denial_adj_8w": 17664000.00,
        "total_adtp_timed_8w": 15840000.00,
        "overall_denial_rate": 0.08,
        "overall_adtp_haircut_pct": 10.3
    }
}
```

**Service function:**
```python
# backend/app/services/forecast_service.py (new file)
async def compute_3_layer_forecast(
    db: AsyncSession,
    weeks_ahead: int = 8
) -> dict:
    """
    Layer 1 (Gross): Sum of expected charges from claims in pipeline
    Layer 2 (Denial-adjusted): Layer 1 * (1 - predicted_denial_rate_by_payer)
    Layer 3 (ADTP-timed): Layer 2 shifted by payer-specific ADTP delays
    """
```

---

#### S6-API-09: GET /api/v1/forecast/accuracy — Historical Forecast Accuracy
**Three-signal test:**
- HOW: Compares past forecasts to actual collections
- WHEN: Called by Revenue Forecast page accuracy panel
- WHERE: `backend/app/api/v1/forecast.py`

**Contract:**
```
GET /api/v1/forecast/accuracy?weeks_back=12

Response 200:
{
    "weeks": [
        {
            "week_start": "2026-01-06",
            "forecasted": 2100000.00,
            "actual": 2040000.00,
            "variance": -60000.00,
            "accuracy_pct": 97.1
        }
    ],
    "overall_accuracy_pct": 94.2,
    "mean_absolute_error": 78000.00
}
```

---

#### S6-API-10: GET /api/v1/investigation/live-data — Investigation Panel Live Data
**Three-signal test:**
- HOW: Replaces the MOCK object in RootCauseInvestigationPanel with real data
- WHEN: Called when investigation panel opens
- WHERE: `backend/app/api/v1/diagnostics.py`

**Contract:**
```
GET /api/v1/investigation/live-data?metric=denial_rate&payer_id=PAY003

Response 200:
{
    "revenue_impact": {
        "amount": 1200000,
        "claims_affected": 3847
    },
    "payer_breakdown": [
        {
            "payer_id": "PAY003",
            "payer": "Humana Commercial",
            "amount": 580000,
            "pct": 48,
            "rag": "red"
        }
    ],
    "denial_categories": [
        {
            "category": "AUTHORIZATION",
            "count": 512,
            "change_pct": 340,
            "rag": "red"
        }
    ],
    "root_causes": [
        {
            "cause": "AUTH_MISSING",
            "cause_label": "Payer Policy Change (Humana)",
            "weight": 64,
            "group": "PAYER",
            "confidence": 87
        }
    ],
    "top_claims": [
        {
            "claim_id": "CLM0023456",
            "payer": "Humana",
            "amount": 48200,
            "category": "AUTH",
            "root_cause": "AUTH_MISSING",
            "action": "Appeal"
        }
    ],
    "actions": [
        {
            "priority": "critical",
            "action": "Update Humana prior auth workflow",
            "impact": 580000,
            "finding_id": "DXF8A3B2C1D0E1"
        }
    ]
}
```

**Service function:**
```python
# backend/app/services/diagnostic_service.py
async def get_investigation_data(
    db: AsyncSession,
    metric: str,
    payer_id: Optional[str] = None,
) -> dict:
    """
    Aggregates data from root_cause_analysis, adtp_trend, diagnostic_finding
    to produce live data matching the investigation panel shape.
    Replaces the MOCK object in RootCauseInvestigationPanel.jsx.
    """
```

---

#### S6-API-11: Enhance existing GET /api/v1/ai/insights — Wire to Diagnostic Engine
**Three-signal test:**
- HOW: AI insights now query diagnostic_finding table for real data, LLM narrates it
- WHEN: Called by all 8 pages replacing static content
- WHERE: `backend/app/services/ai_insights.py` (modify existing)

**Enhancement:**
The existing `ai_insights.py` generates insights by querying DB stats and feeding them to Ollama. Sprint 6 change: **inject diagnostic findings into the prompt context** so the LLM narrates real diagnostics, not generic patterns.

**Modified prompt template pattern:**
```python
def _build_diagnostic_prompt(page: str, db_stats: dict, diagnostic_findings: list) -> str:
    """
    For each page context, inject:
    1. Live DB stats (existing)
    2. Top diagnostic findings relevant to this page (NEW)
    3. Revenue leakage data relevant to this page (NEW)

    The LLM narrates the diagnostic findings — it does not discover them.
    """
```

**Pages and their diagnostic context:**

| Page | Existing Static Content | New Data Source |
|---|---|---|
| CommandCenter | `CC_AI_INSIGHTS` | diagnostic_finding WHERE severity IN ('CRITICAL','HIGH') LIMIT 3 |
| ExecutiveDashboard | `EXEC_AI_INSIGHTS` | diagnostic_finding + revenue_leakage summary + payer risk scorecard |
| ClaimsOverview | `AI_INSIGHTS` | claims risk distribution + top risk factors |
| ClaimsWorkQueue | `AI_INSIGHTS_WQ` | claims WHERE enhanced_risk_score < 60 + diagnostic alerts |
| ScrubDashboard | `AI_INSIGHTS_SCRUB` | root_cause_analysis WHERE root_cause_group = 'PROCESS' |
| CollectionsHub | `mockAiInsights` | ADTP anomalies + collection timing predictions |
| LidaDashboard | `LIDA_AI_INSIGHTS` | diagnostic_finding (top 5 system-wide) |
| PayerPerformance | Static payer AI | mv_payer_behavior + ADTP + root cause by payer |

---

#### S6-API-12: Build `diagnostic_service.py` — The Diagnostic Engine
**Three-signal test:**
- HOW: Service that reads root cause data, ADTP, triangulation, and produces diagnostic findings
- WHEN: Called by scheduler (hourly) and on-demand via API
- WHERE: `backend/app/services/diagnostic_service.py` (new file)

**Core function signatures:**
```python
"""
Diagnostic Engine — Sprint 6
==============================
The engine is the brain. The LLM is the mouth.

The diagnostic engine does NOT use the LLM. It uses deterministic rules
and statistical analysis to produce diagnostic findings.

Input:  root_cause_analysis + adtp_trend + triangulation + payer_contract_rate
Output: diagnostic_finding records with confidence scores

Diagnostic categories (from RCM Bible Part 3):
  1. PAYER_BEHAVIOR     — payer policy changes, denial pattern shifts
  2. PROCESS_BOTTLENECK — internal workflow failures
  3. CODING_PATTERN     — systematic coding errors
  4. DOCUMENTATION_GAP  — clinical documentation deficiencies
  5. ELIGIBILITY_SYSTEMIC — enrollment/coverage verification failures
  6. AUTH_WORKFLOW       — prior authorization process failures
  7. REVENUE_LEAKAGE    — silent underpayments, contract gaps
  8. PAYMENT_TIMING     — ADTP anomalies, float exploitation
"""

async def run_diagnostic_analysis(db: AsyncSession) -> dict:
    """
    Master function. Runs all diagnostic checks and upserts findings.
    Returns: {"findings_created": int, "findings_updated": int, "findings_resolved": int}
    """

async def _detect_payer_behavior_shifts(db: AsyncSession) -> list[dict]:
    """
    Compare root cause distribution by payer over 30d vs previous 30d.
    If any root cause increased > 50% AND affects > 20 claims, create CRITICAL finding.
    If increased > 25%, create HIGH finding.
    """

async def _detect_process_bottlenecks(db: AsyncSession) -> list[dict]:
    """
    Look for root causes in PROCESS group with > 10% share of total denials.
    Cross-reference with ADTP data — if process issues AND payment delays, escalate severity.
    """

async def _detect_revenue_leakage(db: AsyncSession) -> list[dict]:
    """
    Aggregate from:
    1. triangulation_service.detect_silent_underpayments()
    2. Root causes with group=PAYER and type=CONTRACT_RATE_GAP
    3. Denials past appeal deadline with no appeal filed
    4. Write-offs where root cause confidence > 80% AND historical appeal win rate > 50%
    """

async def _detect_payment_timing_issues(db: AsyncSession) -> list[dict]:
    """
    From adtp_service.detect_adtp_anomalies():
    - PAYMENT_DELAY anomalies become PAYMENT_TIMING findings
    - Cross-reference with float_analysis for float exploitation
    """

async def _compute_confidence(evidence_count: int, avg_rca_confidence: float,
                               pattern_strength: float) -> int:
    """
    Diagnostic confidence = weighted average of:
    - Number of supporting root cause analyses (30%)
    - Average confidence of those RCAs (40%)
    - Pattern strength: ratio of this pattern vs baseline (30%)
    Capped at 99.
    """
```

---

### AGENT 3: AI/ML/NLP Engineer

---

#### S6-AI-01: Design the Diagnostic Engine Classification Rules

**What makes a REAL diagnostic vs descriptive:**

| Level | Example | Test |
|---|---|---|
| **Descriptive** | "Denial rate is 8.2%" | States a fact. No cause, no action. |
| **Diagnostic** | "Denial rate increased 340% because Humana changed prior auth policy on 02/15, affecting CPT 99213-99215" | Identifies CAUSE + TRIGGER + SCOPE. Passes three-signal test: HOW (policy change), WHEN (02/15), WHERE (Humana, CPT 99213-99215). |
| **Prescriptive** | "File batch appeal for 512 Humana AUTH denials using template T-AUTH-002. Expected recovery: $854K at 72% win rate." | Diagnostic + action + expected outcome. |

**Badge assignment rules for Sprint 6:**
- A finding earns **Diagnostic** badge ONLY if it identifies: (1) the root cause pattern, (2) the trigger event or time window, (3) the scope (which payer, which CPT, which claims).
- A finding earns **Predictive** badge ONLY if it uses the CRS v2 model to predict future denials with a probability score.
- No **Prescriptive** badge in Sprint 6 — that requires automation (Sprint 7).

---

#### S6-AI-02: Diagnostic Engine Detection Algorithms

**Algorithm 1: Payer Behavior Shift Detection**
```
INPUT:  mv_root_cause_by_payer
LOGIC:
  For each payer P:
    For each root_cause R:
      count_30d = R.count_30d for payer P
      count_prev_30d = R.count_7d * 4.3 (projected) vs actual 30d
      change_pct = (count_30d - count_prev_30d) / max(count_prev_30d, 1)

      IF change_pct > 0.50 AND count_30d > 20:
        severity = CRITICAL
        Create diagnostic_finding:
          type = PAYER_BEHAVIOR_SHIFT
          title = "{payer_name} {root_cause} denials increased {change_pct}% in 30d"
          confidence = _compute_confidence(count_30d, avg_rca_confidence, change_pct)

      ELIF change_pct > 0.25 AND count_30d > 10:
        severity = HIGH
        Same pattern
```

**Algorithm 2: Revenue Leakage Detection**
```
INPUT:  triangulation_service.detect_silent_underpayments()
        root_cause_analysis WHERE root_cause_group = 'PAYER' AND root_cause = 'CONTRACT_RATE_GAP'
        denials WHERE appeal_deadline < TODAY AND NOT EXISTS (appeal)

LOGIC:
  1. Silent underpayments: group by payer, sum leakage_amount
     IF any payer leakage > $50K → CRITICAL finding
     IF any payer leakage > $10K → HIGH finding

  2. Missed appeals: count denials past appeal_deadline with no appeal
     IF count > 50 → CRITICAL finding (missed recovery opportunity)

  3. Contract gaps: count PayerContractRate where actual_paid / expected_rate < 0.95
     IF gap > 5% → HIGH finding
```

**Algorithm 3: CRS v2 Payer Behavioral Adjustment**
```
INPUT:  claim.crs_score (base 0-100)
        mv_payer_behavior (payer denial_rate, adtp_z_score)
        mv_root_cause_by_payer (payer-specific CARC patterns)

LOGIC:
  payer_denial_rate = mv_payer_behavior.denial_rate for this claim's payer
  system_avg_denial_rate = AVG(denial_rate) across all payers

  denial_rate_factor = (payer_denial_rate - system_avg_denial_rate) / system_avg_denial_rate
  # Positive = payer denies more than average → reduce CRS

  adtp_factor = 0
  IF mv_payer_behavior.adtp_anomaly = true:
    adtp_factor = -5  # Payment timing anomaly → higher risk

  carc_match_rate = proportion of this payer's denials matching this claim's CPT code
  carc_factor = -10 * carc_match_rate  # If payer frequently denies this CPT, penalize

  underpayment_rate = silent underpayment rate from triangulation for this payer
  underpay_factor = -5 * underpayment_rate  # If payer frequently underpays, penalize

  total_adjustment = clamp(
    denial_rate_factor * -20 + adtp_factor + carc_factor + underpay_factor,
    min=-25, max=+10
  )

  enhanced_score = clamp(base_crs_score + total_adjustment, 0, 100)
  denial_probability = 1.0 - (enhanced_score / 100.0)

  predicted_carc = most common CARC code for this payer+CPT from root_cause_analysis
```

---

#### S6-AI-03: Update Ollama Prompt Templates for Diagnostic Context

**New/modified prompt templates in `ai_insights.py`:**

```python
def _diagnostic_context_prompt(page: str, stats: dict, findings: list) -> str:
    """
    Template used by all 8 pages replacing static content.
    The LLM receives diagnostic findings as structured data and narrates them.
    """
    findings_text = "\n".join([
        f"- [{f['severity']}] {f['title']} (confidence: {f['confidence_score']}%, "
        f"impact: ${f['financial_impact']:,.0f}, {f['affected_claims_count']} claims)"
        for f in findings[:5]
    ])

    return f"""You are an RCM diagnostic intelligence engine narrating findings for the {page} dashboard.

DIAGNOSTIC FINDINGS (verified by engine — do not modify these facts):
{findings_text}

LIVE STATISTICS:
{json.dumps(stats, indent=2)}

Generate exactly 3 insights as JSON array. Each must:
- "title": headline (max 10 words) referencing a specific finding above
- "body": 1-2 sentences narrating the finding with numbers from LIVE STATISTICS
- "badge": "Diagnostic" (ONLY if you reference a specific root cause and trigger)
- "severity": match the finding severity
- "finding_id": reference the finding_id this insight narrates

CRITICAL: You are the mouth, not the brain. Narrate the findings. Do not invent new findings.
"""
```

---

#### S6-AI-04: Confidence Scoring Methodology

**Diagnostic Finding Confidence Score (0-99):**

```
confidence = min(99, floor(
    0.30 * evidence_score +
    0.40 * rca_confidence_score +
    0.30 * pattern_score
))

WHERE:
  evidence_score = min(100, evidence_count / 10 * 100)
    # 10+ root cause analyses supporting = 100
    # 5 = 50
    # 1 = 10

  rca_confidence_score = avg(rca.confidence_score) for all supporting RCAs
    # Already 0-99 from Bayesian engine

  pattern_score = min(100, abs(change_pct) / 100 * 100)
    # 100%+ change = 100
    # 50% change = 50
    # 10% change = 10
```

**Severity classification:**
```
CRITICAL: confidence >= 75 AND financial_impact >= $100K AND evidence_count >= 20
HIGH:     confidence >= 60 AND financial_impact >= $25K  AND evidence_count >= 10
MEDIUM:   confidence >= 40 AND financial_impact >= $5K   AND evidence_count >= 5
LOW:      everything else
```

---

#### S6-AI-05: Build 3-Layer Revenue Forecast Model

**Three-signal test:**
- HOW: Statistical model combining gross charges, denial predictions, and ADTP timing
- WHEN: Refreshed hourly, served on demand
- WHERE: `backend/app/services/forecast_service.py`

**Model specification:**
```
Layer 1 — Gross Revenue:
  For each week W in forecast horizon:
    gross_revenue[W] = SUM(claims.total_charges) WHERE expected_payment_week = W

Layer 2 — Denial-Adjusted:
  For each week W:
    For each payer P with claims in week W:
      payer_denial_rate = mv_payer_behavior.denial_rate for P
      payer_claims_amount = SUM(charges) for payer P in week W
      predicted_denial = payer_claims_amount * payer_denial_rate
    denial_adjusted[W] = gross_revenue[W] - SUM(predicted_denial across all payers)

Layer 3 — ADTP-Timed:
  For each week W:
    For each payer P:
      adtp_delay = mv_payer_behavior.latest_adtp for P
      expected_delay_weeks = ceil(adtp_delay / 7)
      # Shift payer P's payments from week W to week W + expected_delay_weeks
    adtp_timed[W] = recalculated sum after shifting

Confidence intervals:
  Using standard deviation of historical forecast accuracy (from S6-API-09)
  CI_low = adtp_timed[W] - 1.96 * historical_std_error
  CI_high = adtp_timed[W] + 1.96 * historical_std_error
```

---

### AGENT 4: Frontend Developer

---

#### S6-FE-01: Add New API Methods to `api.js`
**Three-signal test:**
- HOW: Add `diagnostics`, `investigation`, and forecast methods to api.js
- WHEN: Before any frontend page changes
- WHERE: `frontend/src/services/api.js`

**New methods to add:**
```javascript
// Add to api.js

// Diagnostics (Sprint 6)
diagnostics: {
    getSummary: async ({ severity, limit = 20 } = {}) => {
        try {
            const params = new URLSearchParams();
            if (severity) params.set('severity', severity);
            if (limit) params.set('limit', limit);
            const res = await fetch(`${BASE_URL}/diagnostics/summary?${params}`);
            if (!res.ok) throw new Error('diagnostics summary failed');
            return await res.json();
        } catch (err) { console.error('Diagnostics summary error:', err); return null; }
    },
    getAlerts: async ({ limit = 5 } = {}) => {
        try {
            const res = await fetch(`${BASE_URL}/diagnostics/alerts?limit=${limit}`);
            if (!res.ok) throw new Error('diagnostics alerts failed');
            return await res.json();
        } catch (err) { console.error('Diagnostics alerts error:', err); return { alerts: [] }; }
    },
    getRevenueLeakage: async ({ payer_id } = {}) => {
        try {
            const params = new URLSearchParams();
            if (payer_id) params.set('payer_id', payer_id);
            const res = await fetch(`${BASE_URL}/diagnostics/revenue-leakage?${params}`);
            if (!res.ok) throw new Error('revenue leakage failed');
            return await res.json();
        } catch (err) { console.error('Revenue leakage error:', err); return null; }
    },
},

// Investigation Panel Live Data (Sprint 6)
investigation: {
    getLiveData: async ({ metric, payer_id } = {}) => {
        try {
            const params = new URLSearchParams();
            if (metric) params.set('metric', metric);
            if (payer_id) params.set('payer_id', payer_id);
            const res = await fetch(`${BASE_URL}/investigation/live-data?${params}`);
            if (!res.ok) throw new Error('investigation live data failed');
            return await res.json();
        } catch (err) { console.error('Investigation live data error:', err); return null; }
    },
},

// Enhanced forecast (Sprint 6)
// Add to existing forecast section:
forecast: {
    // ... existing getSummary, getWeekly, getReconciliationSummary ...
    get3Layer: async (weeksAhead = 8) => {
        try {
            const res = await fetch(`${BASE_URL}/forecast/3-layer?weeks_ahead=${weeksAhead}`);
            if (!res.ok) throw new Error('3-layer forecast failed');
            return await res.json();
        } catch (err) { console.error('3-layer forecast error:', err); return null; }
    },
    getAccuracy: async (weeksBack = 12) => {
        try {
            const res = await fetch(`${BASE_URL}/forecast/accuracy?weeks_back=${weeksBack}`);
            if (!res.ok) throw new Error('forecast accuracy failed');
            return await res.json();
        } catch (err) { console.error('Forecast accuracy error:', err); return null; }
    },
},

// Enhanced claims (Sprint 6)
// Add to existing claims section:
claims: {
    // ... existing list, getById, getQueue ...
    predictRisk: async (claimId) => {
        try {
            const res = await fetch(`${BASE_URL}/claims/risk-predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim_id: claimId }),
            });
            if (!res.ok) throw new Error('risk predict failed');
            return await res.json();
        } catch (err) { console.error('Risk predict error:', err); return null; }
    },
    getRiskDistribution: async () => {
        try {
            const res = await fetch(`${BASE_URL}/claims/risk-distribution`);
            if (!res.ok) throw new Error('risk distribution failed');
            return await res.json();
        } catch (err) { console.error('Risk distribution error:', err); return null; }
    },
},

// Payer profile (Sprint 6)
// Add to existing payers section:
payers: {
    // ... existing list ...
    getProfile: async (payerId) => {
        try {
            const res = await fetch(`${BASE_URL}/payer/${payerId}/profile`);
            if (!res.ok) throw new Error('payer profile failed');
            return await res.json();
        } catch (err) { console.error('Payer profile error:', err); return null; }
    },
},
```

---

#### S6-FE-02: Replace MOCK Data in RootCauseInvestigationPanel
**Three-signal test:**
- HOW: Replace `const [data] = useState(MOCK)` with `useEffect` calling `api.investigation.getLiveData()`
- WHEN: Sprint 6 week 2 (after API-10 is deployed)
- WHERE: `frontend/src/components/ui/RootCauseInvestigationPanel.jsx`

**Changes:**
1. Remove the entire `MOCK` constant (lines 4-34)
2. Add state: `const [data, setData] = useState(null)` and `const [loading, setLoading] = useState(true)`
3. Add `useEffect` that calls `api.investigation.getLiveData({ metric: context.metric, payer_id: context.payerId })`
4. Add loading skeleton while data fetches
5. Add error state if API returns null
6. Data shape from API matches existing MOCK shape — no structural changes to JSX

---

#### S6-FE-03: Build Diagnostic Dashboard Page
**Three-signal test:**
- HOW: New page at `/analytics/diagnostics` showing ranked diagnostic findings
- WHEN: Sprint 6 week 2-3
- WHERE: `frontend/src/pages/intelligence/DiagnosticDashboard.jsx`

**Layout (no new components — reuse existing patterns):**
1. **Header row:** Total findings count by severity (4 KPI cards: CRITICAL/HIGH/MEDIUM/LOW)
2. **Financial impact bar:** Total $ at risk across all findings
3. **Findings list:** Sorted by severity then financial impact. Each finding card shows:
   - Severity badge (colored dot)
   - Title
   - Financial impact
   - Affected claims count
   - Confidence score bar
   - Recommended action
   - "Investigate" button → opens Investigation Panel with this finding as context
4. **Right sidebar:** Root cause distribution pie chart (from existing `api.rootCause.getSummary()`)
5. **Bottom:** Trending chart showing finding count over time

**Data source:** `api.diagnostics.getSummary()`

---

#### S6-FE-04: Build Revenue Leakage Analyzer Page
**Three-signal test:**
- HOW: New page showing all leakage sources with drill-down
- WHEN: Sprint 6 week 3
- WHERE: `frontend/src/pages/intelligence/RevenueLeakageAnalyzer.jsx`

**Layout:**
1. **Header KPIs:** Total leakage | Total recovered | Net leakage | Recovery rate
2. **Leakage by type:** Horizontal bar chart showing each leakage type with amounts
3. **Top payers by leakage:** Table with payer, leakage amount, count
4. **Payer filter:** Dropdown to filter by payer
5. Each leakage type row is clickable → expands to show individual claims

**Data source:** `api.diagnostics.getRevenueLeakage()`

---

#### S6-FE-05: Build Payer Behavioral Profile Overlay Panel
**Three-signal test:**
- HOW: Slide-out panel (like Investigation Panel) using `createPortal`
- WHEN: Sprint 6 week 2-3
- WHERE: `frontend/src/components/ui/PayerBehavioralProfilePanel.jsx`

**Layout:**
1. **Header:** Payer name, overall risk rating (RAG)
2. **Section 1 — Denial Summary:** denial rate, total denials, trend direction
3. **Section 2 — ADTP:** actual vs expected, Z-score, anomaly flag
4. **Section 3 — Root Cause Distribution:** bar chart of top root causes for this payer
5. **Section 4 — Top CARC Codes:** table
6. **Section 5 — Triangulation:** forecast vs ERA vs bank gaps
7. **Section 6 — 30-Day Trend:** denial rate current vs previous, direction arrow

**Accessible from:** PayerPerformance (click payer row), DenialManagement (click payer name), PaymentDashboard (click payer in breakdown)

**Data source:** `api.payers.getProfile(payerId)`

---

#### S6-FE-06: Replace Static AI Content on CommandCenter
**Three-signal test:**
- HOW: Remove hardcoded `CC_AI_INSIGHTS`, call `api.diagnostics.getAlerts()` and `api.ai.getInsights('command-center')`
- WHEN: Sprint 6 week 2
- WHERE: `frontend/src/pages/intelligence/CommandCenter.jsx`

**Specific changes:**
1. Find and remove any `CC_AI_INSIGHTS` constant or import
2. Add `useEffect` calling `api.diagnostics.getAlerts({ limit: 3 })`
3. Render diagnostic alert cards instead of static insight cards
4. Each alert card shows: severity badge, title, financial impact, "Investigate" button
5. Add "Revenue Health Score" KPI card (computed from diagnostic summary: 100 - (critical_count * 15 + high_count * 5))

---

#### S6-FE-07: Replace Static AI Content on ExecutiveDashboard
**Same pattern as S6-FE-06. Specific changes:**
1. Remove `EXEC_AI_INSIGHTS`
2. Call `api.diagnostics.getSummary({ severity: 'CRITICAL', limit: 3 })`
3. Add revenue leakage summary widget: call `api.diagnostics.getRevenueLeakage()`
4. Add payer risk scorecard: top 5 payers by risk from diagnostic findings

---

#### S6-FE-08: Replace Static AI Content on ClaimsOverview
1. Remove `AI_INSIGHTS`
2. Call `api.claims.getRiskDistribution()`
3. Show risk distribution donut (high/medium/low)
4. Show "X claims awaiting risk assessment" count

---

#### S6-FE-09: Replace Static AI Content on ClaimsWorkQueue
1. Remove `AI_INSIGHTS_WQ`
2. Call `api.ai.getInsights('claims-workqueue')` (now diagnostic-aware from S6-API-11)
3. Add CRS v2 score column to work queue table
4. Add "Pre-Check" button on each claim row that calls `api.claims.predictRisk(claimId)` and shows result in a tooltip/popover

---

#### S6-FE-10: Replace Static AI Content on ScrubDashboard
1. Remove `AI_INSIGHTS_SCRUB`
2. Call `api.ai.getInsights('scrub')` (now diagnostic-aware)
3. Add auto-fix success rate metrics from diagnostic findings where category = CODING_PATTERN

---

#### S6-FE-11: Replace Static AI Content on CollectionsHub
1. Remove `mockAiInsights` / `mockARData` references
2. Call `api.ai.getInsights('collections')` (now diagnostic-aware)
3. Add ADTP-based collection timing predictions from `api.payments.getADTPAnomalies()`

---

#### S6-FE-12: Replace Static AI Content on LidaDashboard
1. Remove `LIDA_AI_INSIGHTS`
2. Call `api.diagnostics.getAlerts({ limit: 5 })`
3. LIDA surfaces top diagnostic findings across all modules as system-wide alerts

---

#### S6-FE-13: Enhance DenialAnalytics with Root Cause Distribution
**Three-signal test:**
- HOW: Add root cause distribution chart and trending from real data
- WHEN: Sprint 6 week 2
- WHERE: `frontend/src/pages/denials/DenialAnalytics.jsx`

**Changes:**
1. Call `api.rootCause.getSummary()` to get real root cause distribution
2. Add pie chart: root cause groups (PREVENTABLE / PROCESS / PAYER / CLINICAL)
3. Call `api.rootCause.getTrending()` and add trending line chart
4. Add financial impact per root cause bar chart

---

#### S6-FE-14: Wire Revenue Forecast to 3-Layer Model
**Three-signal test:**
- HOW: Replace existing forecast chart with 3-layer visualization
- WHEN: Sprint 6 week 3
- WHERE: Revenue Forecast page (existing)

**Changes:**
1. Call `api.forecast.get3Layer(8)`
2. Render 3 lines on chart: Gross (green), Denial-adjusted (amber), ADTP-timed (red)
3. Add confidence interval shading around ADTP-timed line
4. Add accuracy panel from `api.forecast.getAccuracy(12)` showing historical accuracy %

---

#### S6-FE-15: Enhance HighRiskClaims with Payer Behavioral Data
**Three-signal test:**
- HOW: Add CRS v2 columns and predicted CARC to HighRiskClaims table
- WHEN: Sprint 6 week 3
- WHERE: `frontend/src/pages/claims/HighRiskClaims.jsx`

**Changes:**
1. Add column: "Enhanced Risk Score" (from `claim.crs_enhanced_score`)
2. Add column: "Denial Probability" (from `claim.denial_probability`)
3. Add column: "Predicted CARC" (from `claim.predicted_carc`)
4. Add "Run Risk Assessment" button → calls `api.claims.predictRisk(claimId)`
5. Show risk factor breakdown in expandable row detail

---

#### S6-FE-16: Add Navigation Entries for New Pages
**WHERE:** Sidebar configuration

**Add:**
```
INTELLIGENCE HUB
  + Diagnostic Dashboard     → /analytics/diagnostics
  + Revenue Leakage Analyzer → /analytics/revenue-leakage
```

**Remove/merge:**
```
DENIAL PREVENTION
  - Prevention Dashboard     → MERGED INTO Diagnostic Dashboard
  ~ Prevention Workspace     → RENAME to "Denial Resolution Workspace"
```

---

### AGENT 5: QA/Integration

---

#### S6-QA-01: Root Cause Backfill Validation
**Tests:**
1. After backfill completes, verify `SELECT COUNT(*) FROM root_cause_analysis` >= 60,000
2. Verify every denial with `root_cause_status = 'ANALYZED'` has a corresponding `root_cause_analysis` row
3. Verify every `root_cause_analysis` row has exactly 7 `claim_root_cause_step` records
4. Verify `bayesian_weight` values are between 0 and 1
5. Verify `confidence_score` values are between 0 and 99
6. Verify `root_cause_group` is one of: PREVENTABLE, PROCESS, PAYER, CLINICAL
7. Sample 100 random RCAs — manually verify Step 1 CARC decode matches denial_category

---

#### S6-QA-02: Diagnostic Engine Accuracy Validation
**Scenarios:**

| Scenario | Setup | Expected Finding |
|---|---|---|
| Payer spike | Insert 50 AUTH_MISSING denials for PAY003 in last 7 days (vs 5 in prior 30d) | CRITICAL finding: PAYER_BEHAVIOR_SHIFT for PAY003 |
| Revenue leakage | Insert 20 silent underpayments for PAY005 totaling $80K | HIGH finding: REVENUE_LEAKAGE for PAY005 |
| ADTP anomaly | Create ADTP trend with Z-score 3.5 for PAY007 | HIGH finding: PAYMENT_TIMING for PAY007 |
| No finding needed | Insert 2 AUTH_MISSING denials for PAY001 (below threshold) | No finding created (evidence_count too low) |
| Finding resolution | Mark all denials for an existing finding as RESOLVED | Finding status updates to RESOLVED |

---

#### S6-QA-03: API Contract Validation Tests
**For each new endpoint, validate:**

1. **Response shape matches contract** — JSON schema validation
2. **Filters work** — payer_id filter returns only that payer's data
3. **Empty state** — endpoint returns valid JSON with zero-count when no data exists
4. **Performance** — diagnostics/summary < 500ms, claims/risk-predict < 200ms
5. **Error handling** — invalid payer_id returns 404, not 500

**Test matrix:**
```
GET  /diagnostics/summary         — with/without severity filter
GET  /diagnostics/alerts          — with/without limit
GET  /diagnostics/revenue-leakage — with/without payer_id
POST /claims/risk-predict         — valid claim, invalid claim, claim with no payer data
GET  /claims/risk-distribution    — empty state, populated state
GET  /payer/:id/profile           — valid payer, invalid payer
GET  /forecast/3-layer            — 4 weeks, 8 weeks, 12 weeks
GET  /forecast/accuracy           — 4 weeks back, 12 weeks back
GET  /investigation/live-data     — with metric param, with payer_id
POST /root-cause/batch-analyze    — batch_size 10, batch_size 500
```

---

#### S6-QA-04: Investigation Panel Live Data Validation
**Tests:**
1. Open Investigation Panel from CommandCenter — verify NO mock data appears
2. Open Investigation Panel from DenialManagement — verify payer breakdown matches DB
3. Open Investigation Panel from PaymentDashboard — verify root causes match `root_cause_analysis` data
4. Verify all dollar amounts in panel match `SELECT SUM(financial_impact) FROM root_cause_analysis`
5. Verify payer breakdown percentages sum to 100%
6. Verify RAG color assignment: red if > 20% share, amber if > 10%, green otherwise

---

#### S6-QA-05: Static Content Elimination Verification
**Test:** Run the following and verify ZERO matches:
```bash
grep -rn "MOCK\|mockAi\|AI_INSIGHTS\|EXEC_AI\|LIDA_AI\|CC_AI\|INSIGHTS_WQ\|INSIGHTS_SCRUB" \
  frontend/src/pages/ \
  --include="*.jsx" --include="*.js"
```

Exceptions allowed: NONE. Every static constant must be replaced with an API call.

---

#### S6-QA-06: CRS v2 Enhancement Validation
**Tests:**
1. Compare CRS v1 score vs CRS v2 score for 100 random claims
2. Verify payer with high denial rate produces LOWER enhanced_risk_score than CRS v1
3. Verify payer with ADTP anomaly produces LOWER enhanced_risk_score
4. Verify denial_probability is inversely correlated with enhanced_risk_score
5. Verify predicted_carc matches the most common CARC for that payer+CPT combination

---

#### S6-QA-07: Revenue Forecast 3-Layer Validation
**Tests:**
1. Verify Layer 1 >= Layer 2 >= Layer 3 for every week (denials and timing only subtract)
2. Verify confidence intervals contain Layer 3 value
3. Verify accuracy endpoint returns reasonable % (not 0% or 100%)
4. Verify forecast for week 1 (current week) uses partial actuals + predictions

---

#### S6-QA-08: End-to-End Flow Tests

**Flow 1: Denial → Root Cause → Diagnostic Finding → Investigation Panel**
1. Create a new denial via API
2. Run batch analysis on it
3. Verify root_cause_analysis record created
4. Run diagnostic engine
5. Verify diagnostic_finding created (if pattern threshold met)
6. Open Investigation Panel → verify denial appears in live data

**Flow 2: Claim → CRS v2 → Risk Prediction → HighRiskClaims**
1. Create a new claim with payer known to have high denial rate
2. Call POST /claims/risk-predict
3. Verify enhanced_risk_score < base CRS score
4. Navigate to HighRiskClaims page → verify claim appears with enhanced score

**Flow 3: Revenue Forecast → Triangulation → ADTP → 3-Layer**
1. Verify forecast/3-layer endpoint returns data
2. Verify Layer 3 reflects ADTP delays from adtp_trend table
3. Change ADTP for a payer → re-run forecast → verify Layer 3 shifts

---

## 3. DEPENDENCY MAP

```
WEEK 1 (March 23-29):
  S6-DB-01 ─── Backfill 62K denials (BLOCKS everything downstream)
  S6-DB-02 ─── Create diagnostic_finding table
  S6-DB-03 ─── Create revenue_leakage table
  S6-DB-04 ─── Create claim_risk_prediction table
  S6-DB-05 ─── Create materialized views
  S6-DB-06 ─── Add columns to claims table
  S6-API-01 ── Batch analyze endpoint (wraps backfill)
  S6-FE-01 ─── Add API methods to api.js (no backend dependency)

WEEK 2 (March 30 - April 5):
  ← DEPENDS ON: S6-DB-01 complete (root cause data populated)
  ← DEPENDS ON: S6-DB-02,03,04 complete (new tables exist)

  S6-AI-01 ─── Diagnostic classification rules (document)
  S6-AI-02 ─── Detection algorithms (implement in diagnostic_service.py)
  S6-AI-04 ─── Confidence scoring (implement)
  S6-API-12 ── diagnostic_service.py (THE CORE DELIVERABLE)
  S6-API-02 ── GET /diagnostics/summary
  S6-API-03 ── GET /diagnostics/alerts
  S6-API-04 ── GET /diagnostics/revenue-leakage
  S6-API-05 ── POST /claims/risk-predict (CRS v2)
  S6-API-06 ── GET /claims/risk-distribution
  S6-API-07 ── GET /payer/:id/profile
  S6-API-10 ── GET /investigation/live-data
  S6-API-11 ── Enhance AI insights with diagnostic context

  S6-FE-02 ─── Replace MOCK in Investigation Panel (needs API-10)
  S6-FE-06 ─── CommandCenter static replacement (needs API-02, API-03)
  S6-FE-07 ─── ExecutiveDashboard static replacement
  S6-FE-08 ─── ClaimsOverview static replacement (needs API-06)
  S6-FE-09 ─── ClaimsWorkQueue static replacement
  S6-FE-10 ─── ScrubDashboard static replacement
  S6-FE-11 ─── CollectionsHub static replacement
  S6-FE-12 ─── LidaDashboard static replacement
  S6-FE-13 ─── DenialAnalytics root cause distribution

WEEK 3 (April 6-11):
  ← DEPENDS ON: S6-API-12 complete (diagnostic engine running)
  ← DEPENDS ON: All API endpoints deployed

  S6-AI-03 ─── Update Ollama prompt templates
  S6-AI-05 ─── 3-Layer forecast model
  S6-API-08 ── GET /forecast/3-layer
  S6-API-09 ── GET /forecast/accuracy

  S6-FE-03 ─── Diagnostic Dashboard page
  S6-FE-04 ─── Revenue Leakage Analyzer page
  S6-FE-05 ─── Payer Behavioral Profile panel
  S6-FE-14 ─── Revenue Forecast 3-layer wiring
  S6-FE-15 ─── HighRiskClaims payer behavioral enhancement
  S6-FE-16 ─── Navigation entries

  S6-QA-01 through S6-QA-08 ── All QA tasks (parallel with week 3 frontend)
```

**Critical path:** S6-DB-01 (backfill) → S6-DB-05 (materialized views) → S6-API-12 (diagnostic engine) → S6-API-02/03/04 (diagnostic endpoints) → S6-FE-03 (diagnostic dashboard)

---

## 4. RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Backfill takes > 30 min for 62K denials | MEDIUM | HIGH — blocks everything | Batch commits of 500. If > 1 hour, parallelize by payer_id partition. Backfill is first task in sprint. |
| Diagnostic engine produces too many LOW findings (noise) | HIGH | MEDIUM — user fatigue | Severity thresholds are conservative (CRITICAL requires $100K+ AND 20+ evidence). LOW findings hidden by default in UI. |
| Materialized views too slow to refresh | LOW | MEDIUM — stale data in UI | Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` (no lock). If > 30s, add partial indexes. |
| CRS v2 payer adjustment too aggressive | MEDIUM | HIGH — false high-risk scores | Clamp adjustment to [-25, +10]. Compare v1 vs v2 distributions before deploying. Keep v1 score alongside v2. |
| Ollama unavailable during sprint | LOW | MEDIUM — static AI returns | AI insights gracefully degrade: if Ollama down, return structured diagnostic data without LLM narration. The engine works without the mouth. |
| 3-layer forecast has poor accuracy | MEDIUM | LOW — it's new, users expect imperfection | Show confidence intervals. Show historical accuracy %. Label as "Beta". |
| Too many frontend changes cause regressions | MEDIUM | MEDIUM | All 8 static replacements follow identical pattern: remove constant, add useEffect, add loading state. Template once, replicate. |

---

## 5. DEFINITION OF DONE

### Sprint 6 is DONE when:

- [ ] `root_cause_analysis` table has >= 60,000 rows
- [ ] `diagnostic_finding` table has findings with REAL data (not seed data)
- [ ] Diagnostic engine produces CRITICAL/HIGH/MEDIUM/LOW findings with confidence scores
- [ ] Every diagnostic finding passes the three-signal test: identifies HOW (root cause), WHEN (time window), WHERE (payer/CPT/claims)
- [ ] Investigation Panel shows ZERO mock data — 100% live API data
- [ ] CRS v2 produces enhanced_risk_score and denial_probability for any claim
- [ ] Revenue Forecast page shows 3 layers with real data
- [ ] `grep -rn "MOCK\|mockAi\|AI_INSIGHTS\|EXEC_AI\|LIDA_AI\|CC_AI\|INSIGHTS_WQ\|INSIGHTS_SCRUB" frontend/src/pages/` returns 0 results
- [ ] All 8 API contracts pass schema validation tests
- [ ] All endpoints respond within performance targets (500ms summary, 200ms single claim)
- [ ] Diagnostic Dashboard page loads with real findings
- [ ] Revenue Leakage Analyzer page loads with real leakage data
- [ ] Payer Behavioral Profile panel opens with real payer data
- [ ] No new pages were created without Marcus sign-off
- [ ] No Diagnostic badges assigned without real causal analysis backing them

---

## 6. MARCUS VALIDATION MATRIX

| Feature | HOW | WHEN | WHERE | User Task | Marcus Approved |
|---|---|---|---|---|---|
| Diagnostic Dashboard | Aggregated diagnostic findings ranked by $ impact | On demand, findings refreshed hourly | `/analytics/diagnostics` | "Show me what's systemically wrong right now" | YES |
| Revenue Leakage Analyzer | Aggregates underpayments + missed appeals + contract gaps | On demand | `/analytics/revenue-leakage` | "Show me where money is falling through the cracks" | YES |
| Payer Behavioral Profile | ADTP + root cause + triangulation per payer | Triggered from payer click | Overlay panel (no nav) | "Tell me everything about this payer's behavior" | YES (as overlay) |
| CRS v2 Risk Prediction | Payer behavioral data adjusts CRS score | Pre-submission, on demand | HighRiskClaims, WorkQueue | "Will this claim get denied? By whom? Why?" | YES |
| 3-Layer Forecast | Gross -> Denial-adj -> ADTP-timed | Hourly refresh, on-demand view | Revenue Forecast page | "When will the money actually arrive?" | YES |
| Investigation Panel Live | Real root cause + payer + denial data | On panel open | Slide-out overlay | "Investigate this anomaly with real data" | YES |
| Static AI Replacement | Diagnostic engine feeds LLM narration | On page load | 8 existing pages | "Give me intelligent insights, not canned text" | YES |

---

*Sprint 6 Plan v1.0 — March 22, 2026*
*Next review: Sprint 6 standup, March 24, 2026*
