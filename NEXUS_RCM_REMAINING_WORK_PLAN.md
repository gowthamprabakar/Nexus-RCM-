# NEXUS RCM — Complete Gap Analysis & Remaining Sprint Plan

**Date:** 2026-03-29
**Scope:** Cross-reference ALL Bible documents (Parts 1-6) + speckit-analysis + automation opportunity report against current build

---

## EXECUTIVE SUMMARY

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Bible Compliance | 23% (118/513) | 70%+ | 360+ items |
| Automation Rules | 15 rules (3 actively firing) | 52 automations | 37 automations |
| Prevention Rules | 5 rules built | 40 prevention items | 35 preventions |
| ML/Prediction Models | 2 trained + 2 forecasting | 85 predictions | 81 predictions |
| Frontend Pages (REAL API) | 41/143 (29%) | 100+ | 59+ pages to wire |
| Annual Revenue Impact (Built) | ~$890K | $5.48M-$9.98M | $4.6M-$9.1M unrealized |

---

## PART 1: AUTOMATION LAYER — BUILT vs BIBLE

### What's Built (15 rules in automation_engine.py)

| Rule ID | Maps To Bible | Status | Fires? |
|---------|---------------|--------|--------|
| AUTO-001 | AU-I01 (Root cause attribution) | Working | No (needs diagnostic findings) |
| AUTO-002 | AU-DN-01 (Appeal generation) | Working | No (needs clusters) |
| AUTO-003 | AU-PM-01 (ERA auto-posting) | Working | No (needs diagnostic findings) |
| AUTO-004 | AU-CO-01 (Collection prioritization) | **WORKING** | **YES — 125K claims, $515M** |
| AUTO-005 | AU-PM-03 (Underpayment detection) | Working | No (needs findings) |
| AUTO-006 | PV-S01 (CRS auto-hold) | Disabled | No (placeholder finder) |
| AUTO-007 | AU-OP-03 (Payer denial spike alert) | **WORKING** | **YES — 10 alerts** |
| AUTO-008 | AU-CL-04 (Rejected claim resubmission) | **WORKING** | **YES — 20K claims, $69M** |
| AUTO-009 | AU-OP-04 (Timely filing escalation) | Working | No (no claims near deadline) |
| AUTO-010 | PV-F02 (Auth expiry warning) | Stub | No (no auth table) |
| AUTO-011 | AU-C01 (Eligibility re-verify) | Stub | No (no eligibility table) |
| AUTO-012 | AU-CL-07 (Duplicate detection) | Working | No (no duplicates in data) |
| AUTO-013 | AU-DN-03 (COB coordination) | Working | No (needs CO-22 findings) |
| AUTO-014 | AU-PM-07 (Contract rate dispute) | Working | No (needs rate threshold findings) |
| AUTO-015 | AU-OP-02 (Provider enrollment alert) | Working | No (needs provider findings) |

### What's Missing (37 Automations from Bible)

#### HIGH PRIORITY — Revenue Impact >$100K/year

| Bible ID | Name | Revenue Impact | Complexity | Priority |
|----------|------|---------------|------------|----------|
| AU-CL-01 / A1.1 | Pre-submission auto-scrub (NCCI, modifiers, payer rules) | $180K-$240K | Medium | P1 |
| AU-CL-03 / A1.3 | CRS-driven auto-hold (deny >7.0 score claims) | $310K-$480K | Medium | P1 |
| AU-DN-01 / A2.1 | AI-driven appeal letter generation (win prob >60%) | $220K-$380K | High | P1 |
| AU-DN-05 / A2.5 | Cluster appeal batch generation (5+ same root cause) | $140K-$220K | High | P1 |
| AU-PM-03 / A3.3 | Contract-vs-paid underpayment detection | $183K-$275K | Medium | P1 |
| AU-EA-01 / A5.1 | Dual-mode eligibility verification (270/271) | $120K-$180K | Medium | P1 |
| AU-EA-02 / A5.2 | Prior auth auto-initiation | $95K-$150K | High | P1 |
| AU-CD-03 / A6.3 | DRG assignment optimization | $120K-$200K | High | P2 |
| AU-CD-04 / A6.4 | Procedure-to-charge auto-capture | $78K-$120K | High | P2 |
| AU-RP-06 / A8.6 | Model feedback loop auto-processing | $80K-$130K | High | P1 |

#### MEDIUM PRIORITY — Revenue Impact $50K-$100K/year

| Bible ID | Name | Revenue Impact | Complexity |
|----------|------|---------------|------------|
| AU-CL-02 / A1.2 | Deterministic billing error auto-correction | $85K-$120K | Medium |
| AU-CL-05 / A1.5 | Documentation auto-attachment | $60K-$90K | High |
| AU-DN-04 / A2.4 | SLA breach auto-escalation | $55K-$85K | Low |
| AU-PM-01 / A3.1 | ERA/835 auto-posting (full parse) | $65K-$95K | Medium |
| AU-CO-02 / A4.2 | ADTP-driven payer follow-up | $55K-$80K | Low |
| AU-EA-03 / A5.3 | Insurance coverage auto-discovery | $65K-$110K | Medium |
| AU-CD-01 / A6.1 | NLP-driven code suggestion engine | $48K-$72K | High |
| AU-CD-05 / A6.5 | AI-driven CDI query generation | $95K-$160K | High |
| AU-RP-02 / A8.2 | Compliance risk auto-monitoring | $50K-$500K | High |
| AU-OP-01 / A9.1 | Dynamic work queue rebalancing | $22K-$35K | Medium |

#### LOWER PRIORITY — Revenue Impact <$50K/year

| Bible ID | Name | Revenue Impact |
|----------|------|---------------|
| AU-CL-06 / A1.6 | Claim split/combine optimization | $25K-$40K |
| AU-DN-06 / A2.6 | Claim washing detection/auto-close | $18K-$30K |
| AU-PM-02 / A3.2 | ERA-bank deposit auto-reconciliation | $22K-$35K |
| AU-PM-04 / A3.4 | Secondary claim auto-generation | $45K-$75K |
| AU-PM-05 / A3.5 | Patient statement auto-generation | $32K-$48K |
| AU-PM-06 / A3.6 | Overpayment detection/refund alert | $12K-$20K |
| AU-CO-03 / A4.3 | Pre-approved payment plan auto-offer | $42K-$65K |
| AU-CO-04 / A4.4 | Automated statement cycle management | $28K-$42K |
| AU-CO-05 / A4.5 | Intelligent follow-up auto-scheduling | $18K-$28K |
| AU-CO-06 / A4.6 | Uncollectable write-off recommendation | $15K-$25K |
| AU-EA-04 / A5.4 | COB auto-detection | $35K-$55K |
| AU-EA-05 / A5.5 | Real-time patient cost estimate | $55K-$85K |
| AU-CD-02 / A6.2 | Payer-specific modifier auto-assignment | $35K-$55K |
| AU-RC-02 / A7.2 | Reconciliation variance auto-detection | $15K-$25K |
| AU-RC-04 / A7.4 | Ghost payment/unmatched deposit alert | $18K-$30K |
| AU-RP-01 / A8.1 | Scheduled report auto-generation | $15K-$22K |
| AU-RP-03 / A8.3 | Comprehensive audit trail | $25K-$40K |
| AU-RP-05 / A8.5 | Payer policy change detection | $45K-$75K |
| AU-RP-07 / A8.7 | Recurrence-based prevention rule proposal | $35K-$55K |
| AU-OP-05 / A9.5 | Monthly root cause decomposition report | $8K-$12K |
| AU-OP-06 / A9.6 | Real-time dashboard data pipeline | $5K-$8K |
| AU-OP-07 / A9.7 | Weekly predictive model recalibration | $15K-$25K |

---

## PART 2: PREVENTION LAYER — BUILT vs BIBLE

### What's Built (5 rules in prevention_service.py)

| Rule | Maps To Bible | Status |
|------|---------------|--------|
| ELIGIBILITY RISK | PV-F01 / B1.8 | Working (checks 271 status) |
| PRIOR AUTH EXPIRY | PV-F02 / B1.3 | Working (checks expiry date) |
| TIMELY FILING | PV-S07 / B1.6 | Working (DOS countdown) |
| DUPLICATE CLAIMS | PV-S06 / B1.7 | Working (patient+DOS+payer match) |
| HIGH-RISK PAYER+CPT | PV-M02 / B1.5 | Working (>30% denial rate combo) |

### What's Missing (35 Prevention Items from Bible)

#### HIGHEST ROI — $1 spent saves $4-$7

| Bible ID | Name | ROI | Revenue Impact | Priority |
|----------|------|-----|---------------|----------|
| PV-S01 / B1.1 | CRS pre-submission gating (>7.0 auto-hold) | $6.20/$ | $310K-$480K | P1 |
| PV-M01 / B3.6 | Concurrent medical necessity monitoring | $5.80/$ | $85K-$140K | P1 |
| PV-S02 | Payer-specific billing rule validation (500+ rules) | $4.80/$ | est. $120K-$200K | P1 |
| PV-M08 | Payer documentation requirement templates | $4.70/$ | $95K-$150K | P1 |
| PV-F06 | Credentialing gap prevention (120/90/60/30d alerts) | $4.20/$ | est. $15K-$30K | P2 |
| PV-P06 | Payer policy change detection | $4.20/$ | $45K-$75K | P1 |
| PV-M03 | DRG misassignment prevention | $4.10/$ | est. $120K-$200K | P2 |

#### HIGH ROI — $1 spent saves $2-$4

| Bible ID | Name | ROI | Revenue Impact |
|----------|------|-----|---------------|
| PV-P05 | Silent underpayment accumulation detection | $3.90/$ | $183K-$275K |
| PV-M06 | Revenue leakage / downcoding detection | $3.60/$ | $67K-$100K |
| PV-P01 | Lost claims (277CA acknowledgment within 48h) | $3.40/$ | est. $30K-$50K |
| PV-F02 (full) | PA auto-initiation (72h before service) | $3.40/$ | $95K-$150K |
| PV-M02 (full) | Pre-bill coding audit (NLP-driven) | $3.20/$ | $48K-$72K |
| PV-S03 | Missing information completeness check | $3.10/$ | est. $30K-$50K |
| PV-M07 | Charge capture gap detection (48h reconciliation) | $2.90/$ | $78K-$120K |
| PV-F05 | Demographics/registration error prevention | $2.80/$ | est. $20K-$40K |
| PV-M05 | Unbundling/NCCI edit pre-submission | $2.80/$ | $25K-$40K |
| PV-P02 | ADTP anomaly → AR aging alert | $2.60/$ | $55K-$85K |
| PV-M04 | Modifier error prevention (payer-specific rules) | $2.40/$ | $35K-$55K |
| PV-P07 | Reconciliation error compounding | $2.30/$ | $22K-$35K |
| PV-F01 (full) | Real-time 270/271 batch+realtime eligibility | $2.10/$ | $120K-$180K |
| PV-F07 | Referral requirement prevention | $2.10/$ | est. $15K-$30K |
| PV-F03 | COB/wrong payer order prevention | $1.80/$ | est. $35K-$55K |
| PV-S04 | Frequency/benefit limit violation detection | $1.80/$ | est. $20K-$35K |
| PV-F08 | Coverage termination during treatment | $1.60/$ | est. $45K-$70K |
| PV-S05 | Gender/age edit failure prevention | $2.20/$ | est. $10K-$20K |

#### COMPLIANCE & SYSTEMIC PREVENTION

| Bible ID | Name | Revenue Impact |
|----------|------|---------------|
| PV-CP-01 / B3.1 | Provider over-coding pattern detection | $50K-$500K |
| PV-CP-02 / B3.2 | OIG/RAC audit target early warning | $100K-$750K |
| PV-CP-03 / B3.3 | FCA risk composite score | $200K-$2M |
| PV-CP-04 / B3.4 | Pre-submission unbundling detection | $25K-$40K |
| PV-CP-05 / B3.5 | Modifier compliance monitoring | $30K-$80K |
| PV-O01 | Root cause recurrence monitoring | $35K-$55K |
| PV-O02 | Knowledge decay / payer rule maintenance | $20K-$35K |
| PV-O08 | Process bottleneck detection (dwell time) | $25K-$40K |
| PV-O09 | Payer behavior fingerprint shift | $45K-$75K |
| PV-CF-04 | AR aging bucket migration warning | $35K-$55K |
| PV-CF-05 | Patient propensity-to-pay stratification | $52K-$80K |

---

## PART 3: PREDICTION/ML LAYER — BUILT vs BIBLE

### What's Built (4 models)

| Model | Bible Ref | AUC/Metric | Status |
|-------|-----------|------------|--------|
| Denial Probability (GBM, 25 features) | PR-D01 | AUC 0.71 | **Trained** |
| Appeal Success (GBM, 11 features) | PR-D05 | AUC 0.60 | **Trained** |
| Revenue Forecast (Prophet/SARIMAX) | PR-R01 | MAPE varies | **Working** |
| 3-Layer Revenue Forecast | PR-R01 | N/A | **Working** |

### What's Missing (81 Predictions from Bible)

#### TIER 1 — Core (Feed automation + prevention directly)

| Bible ID | Name | Accuracy Target | Dependencies |
|----------|------|----------------|--------------|
| PR-D02 | Denial CARC code prediction (multi-label) | Top-3 >85% | Feeds appeal routing |
| PR-D03 | Payer denial rate forecast (30/60/90d) | ±2% @ 30d | Feeds AU-OP-03 |
| PR-D08 | Denial recurrence prediction | AUC >0.75 | Feeds resubmission strategy |
| PR-D09 | Payer policy change detection (CUSUM/PELT) | 90% within 14d | Feeds PV-O09 |
| PR-P01 | ADTP-based payment timing per payer | ±3-7 days | Feeds cash flow |
| PR-P04 | Patient propensity-to-pay (30/60/90/120d) | AUC >0.80 | Feeds AU-CO-01 |
| PR-P07 | Underpayment detection probability | AUC >0.78 | Feeds AU-PM-03 |
| PR-AR02 | Write-off probability per claim (survival) | AUC >0.82 | Feeds AR valuation |
| PR-O04 | Timely filing risk forecast | 100% recall | Feeds AU-OP-04 |
| PR-CR01 | Audit risk prediction | 80% flagging | Feeds PV-CP-01 |

#### TIER 2 — Operational (Improve efficiency)

| Bible ID | Name | Accuracy Target |
|----------|------|----------------|
| PR-R02 | Daily cash receipt forecast | ±5% @ 7d |
| PR-R03 | Weekly cash flow (13 weeks) | ±3% @ 4wk |
| PR-R04 | Revenue at risk from denial trends | ±10% |
| PR-D04 | Expected denial volume by CARC | ±15% |
| PR-D06 | First-pass acceptance rate forecast | ±2% |
| PR-P02 | Expected ERA receipt date | ±5-10 days |
| PR-P03 | Payment amount prediction (contract compliance) | ±5-8% |
| PR-AR01 | AR aging trajectory (Markov chain) | ±5% @ 30d |
| PR-AR04 | Days in AR forecast | ±2 days @ 30d |
| PR-O01 | Claims volume forecast (daily/weekly) | ±5-10% |
| PR-O02 | FTE workload prediction (2-4 weeks) | ±0.5 FTE |

#### TIER 3 — Strategic (Executive intelligence)

| Bible ID | Name | Accuracy Target |
|----------|------|----------------|
| PR-R05 | Expected collections by payer by period | ±5% |
| PR-R06 | Gross-to-net revenue forecast | ±2% ratio |
| PR-D07 | Denial financial impact projection (quarterly) | ±12% |
| PR-PB01 | Payer ADTP trend projection (90d) | >80% directional |
| PR-PB02 | Payer denial rate trend projection (90d) | >80% directional |
| PR-PB05 | Payer financial health score (0-100) | 30d early warning |
| PR-CR02 | Over-coding risk by provider | Correlation >0.6 |
| PR-CR05 | FCA risk scoring (0-100 composite) | Quarterly |
| PR-PA01 | Coverage termination prediction | AUC >0.70 |
| PR-PA02 | Prior auth approval prediction | AUC >0.82 |

#### TIER 4 — Composites (Multi-signal intelligence)

| Bible ID | Name | Components |
|----------|------|-----------|
| PR-X01 | Claim-level expected net revenue | PR-D01 × PR-P03 × PR-P02 |
| PR-X02 | Payer health score (0-100) | PR-PB01 + PR-PB02 + PR-PB05 |
| PR-X03 | Revenue confidence interval (3-scenario) | PR-R01 + PR-D03 + PR-PB01 |
| PR-X04 | Collections priority score | PR-P04 + PR-AR03 + aging |
| PR-X05 | Pre-submission risk profile (complete) | PR-D01 + PR-D02 + PR-PA02 |
| PR-X07 | Organizational revenue health score | PR-R01 + PR-D06 + PR-AR04 |
| PR-X08 | Claim routing recommendation | PR-X05 + PR-O02 |

---

## PART 4: FRONTEND — BUILT vs NEEDED

### Pages Needing Backend Wiring (79 HYBRID + 23 MOCK = 102 pages)

#### Highest Impact (Revenue-generating pages)

| Page | Current State | Backend Needed |
|------|--------------|----------------|
| CommandCenter | HYBRID — mock KPIs | `/dashboard/summary` endpoint |
| ExecutiveDashboard | HYBRID — mock tickets | `/tickets` CRUD router |
| PaymentPosting | HYBRID | Full ERA posting workflow |
| ContractManager | HYBRID | Contract CRUD + variance engine |
| CollectionsCommand | MOCK | Collections orchestration API |
| SimulationDashboard | MOCK | MiroFish simulation API |
| PatientAccounts | HYBRID | Patient billing API |
| Scheduler (admin) | MOCK | Wire to `/scheduler/status` |

#### Specialty Modules (Zero Backend)

| Module | Pages | Backend Status |
|--------|-------|---------------|
| Coding (AICodingAudit, AICodingCompliance, CodingOptimizer) | 5 | No `/coding` router |
| EVV (EVVDashboard, EVVFraudDetection) | 4 | No `/evv` router |
| Admin (ETLDesigner, APIManager, IntegrationDebugger) | 5 | No admin APIs |
| Developer/AI (AIModelMonitor, DataSchemaExplorer, MCPAgentHub) | 7 | No dev/monitoring APIs |

### New Frontend Components Needed (from Bible)

| Component | Purpose | Depends On |
|-----------|---------|-----------|
| Graph Explorer (Neo4j) | Interactive node visualization | Neo4j queries |
| Appeal Pipeline Tracker | GENERATED → SUBMITTED → WON/LOST | Appeal tracking API |
| Prevention Blocking UI | Hold/Dismiss/Resolve alerts | Prevention service |
| Outcome Feedback Dashboard | Prediction accuracy charts | Outcome tracker |
| MiroFish Simulation UI | What-if scenario builder | MiroFish bridge |
| Contract Variance Dashboard | Underpayment detection view | Contract engine |
| Compliance Risk Dashboard | FCA/OIG risk monitoring | Compliance models |
| Payer Health Scorecard | 0-100 composite per payer | Payer behavior models |

---

## PART 5: INFRASTRUCTURE GAPS

| Gap | Impact | Effort |
|-----|--------|--------|
| No Alembic migrations for Sprint 10-15 tables | Can't deploy to new DB | 2 days |
| MiroFish not wired into any service | Core differentiator missing | 5 days |
| No disputes table | AUTO-014 is a stub | 1 day |
| No prevention_alerts table (persisted) | Alerts lost on restart | 1 day |
| No ml_model_registry DB table | Models tracked in-memory only | 1 day |
| No human-in-the-loop ramp framework | All rules at same trust level | 3 days |
| No model governance / drift detection | Models degrade silently | 3 days |
| Feedback loop not in scheduler | Must be called manually | 0.5 day |

---

## PART 6: SPRINT PLAN — REMAINING WORK

### Sprint 16: Automation Expansion + Prevention Engine (2 weeks)

**Theme:** Triple automation coverage, double prevention rules
**Revenue unlock:** $1.2M-$1.8M/year

#### 16.1 — Pre-Submission Auto-Scrub Engine (4 days)
- Create `backend/app/services/claim_scrubber.py`
- NCCI Column 1/2 edits, modifier validation, DX-CPT crosswalk
- Maps to: AU-CL-01/A1.1, PV-CP-04/B3.4, PV-M05
- Wire to AUTO-006 (CRS auto-hold) — enable and implement finder
- Revenue: $180K-$240K + $25K-$40K

#### 16.2 — AI Appeal Letter Generator (3 days)
- Create `backend/app/services/appeal_letter_generator.py`
- Template-based with CARC-specific evidence, payer policy citations
- Integrates with appeal_success ML model (>60% win prob triggers)
- Maps to: AU-DN-01/A2.1
- Revenue: $220K-$380K

#### 16.3 — Contract Variance / Underpayment Engine (3 days)
- Create `backend/app/services/contract_variance_engine.py`
- Compare ERA payments against contracted rates
- Auto-flag silent underpayments >$100
- Maps to: AU-PM-03/A3.3, PV-P05
- Revenue: $183K-$275K

#### 16.4 — Expand Prevention Service to 15 Rules (3 days)
- Add 10 new prevention rules:
  1. PV-S01: CRS auto-hold (>7.0)
  2. PV-S02: Payer-specific billing rule validation
  3. PV-S03: Missing information completeness
  4. PV-M01: Medical necessity documentation
  5. PV-M04: Modifier compliance (payer-specific)
  6. PV-M07: Charge capture gap (48h reconciliation)
  7. PV-P01: Lost claim detection (277CA within 48h)
  8. PV-P02: ADTP anomaly → AR aging alert
  9. PV-F05: Demographics/registration error
  10. PV-F06: Credentialing gap alerts
- Revenue: $400K-$700K combined

#### 16.5 — New Automation Rules (2 days)
- Add 8 new rules to automation_engine.py:
  - AU-CL-02: Deterministic billing error correction
  - AU-DN-04: SLA breach auto-escalation
  - AU-DN-06: Claim washing detection
  - AU-PM-04: Secondary claim auto-generation
  - AU-PM-05: Patient statement auto-generation
  - AU-CO-02: ADTP-driven follow-up escalation
  - AU-RP-05: Payer policy change notification
  - AU-RP-07: Recurrence-based prevention rule proposal
- Total rules: 23 (from 15)

#### 16.6 — Alembic Migrations + Infrastructure (1 day)
- Create migrations for: dispute_records, prevention_alerts, ml_model_registry
- Add feedback loop to scheduler
- Enable AUTO-006 with real CRS threshold finder

---

### Sprint 17: ML Model Build-Out (2 weeks)

**Theme:** Build 10 core prediction models
**Revenue unlock:** Feeds $800K-$1.5M in automation improvements

#### 17.1 — Payment Delay Model (2 days)
- Create `backend/app/ml/payment_delay.py`
- Per-payer Prophet + XGBoost ensemble
- Maps to: PR-P01, PR-P02
- Target: RMSE < 7 days

#### 17.2 — Payer Anomaly Detection (2 days)
- Create `backend/app/ml/payer_anomaly.py`
- Isolation Forest on weekly payer metrics
- Maps to: PR-D09, PR-PB01, PR-PB02
- Target: <5% false positive

#### 17.3 — Patient Propensity-to-Pay (3 days)
- Create `backend/app/ml/propensity_to_pay.py`
- LightGBM on payment history, demographics, aging
- Maps to: PR-P04, PR-AR03, PV-CF-05
- Target: AUC > 0.80

#### 17.4 — Write-Off Probability (2 days)
- Create `backend/app/ml/write_off_model.py`
- Cox proportional hazards (survival analysis)
- Maps to: PR-AR02
- Target: AUC > 0.82

#### 17.5 — Provider Risk Score (2 days)
- Create `backend/app/ml/provider_risk.py`
- Composite score from denial patterns + Neo4j graph
- Maps to: PR-CR02
- Target: Correlation > 0.6 with audit findings

#### 17.6 — Denial CARC Prediction (2 days)
- Create `backend/app/ml/carc_prediction.py`
- Multi-label classification per CARC group
- Maps to: PR-D02
- Target: Top-3 > 85%

#### 17.7 — Composite Scores (1 day)
- Create `backend/app/ml/composite_scores.py`
- PR-X01: Claim expected net revenue
- PR-X02: Payer health score (0-100)
- PR-X04: Collections priority score
- PR-X07: Organizational revenue health score

#### 17.8 — Model Governance Framework (1 day)
- Create `backend/app/ml/model_governance.py`
- Drift detection (KS test), accuracy monitoring, auto-retraining triggers
- Maps to: Bible Model Governance section

#### 17.9 — Prediction API Endpoints (1 day)
- Add 10 new endpoints for new models
- Update predictions router

---

### Sprint 18: MiroFish Integration + Validation Gate (2 weeks)

**Theme:** Connect the core differentiator — agent-based reasoning
**Revenue unlock:** Validation prevents $200K-$400K in false automation

#### 18.1 — Wire MiroFish into Root Cause Analysis (3 days)
- Modify `root_cause_service.py` — call `query_mirofish_for_rca()` at Step 9.5
- 3 agents debate root cause with Neo4j evidence
- 10s timeout, graceful degradation
- Maps to: Sprint 10.4 (planned but not wired)

#### 18.2 — Build Suggestion Validator (3 days)
- Create `backend/app/services/suggestion_validator.py`
- Every automation suggestion passes through MiroFish validation
- 3-agent panel: Clinical, Financial, Operational
- Confidence boost/penalty based on agent consensus
- Maps to: Sprint 12.4

#### 18.3 — MiroFish Simulation API (2 days)
- Create `backend/app/api/v1/simulation.py`
- Endpoints: run scenario, get results, compare scenarios
- Wire to MiroFish simulation_manager.py

#### 18.4 — Neo4j Relationship Expansion (2 days)
- Add 7 missing relationship types:
  - CODES_WITH, PREVENTS, TRIGGERS_RULE, RESOLVES_VIA
  - PEER_DENIAL_RATE, SEASONAL_PATTERN, HAS_ADTP
- Re-populate with enriched data

#### 18.5 — Human-in-the-Loop Ramp Framework (2 days)
- Create `backend/app/services/hitl_framework.py`
- 3 phases: Learning (30d), Supervised (31-90d), Autonomous (91d+)
- Per-rule maturity tracking, confidence threshold auto-adjustment
- Maps to: Bible automation tiers

#### 18.6 — Feedback Loop Completion (1 day)
- Add feedback_neo4j to scheduler
- Wire outcome tracker to model retraining triggers
- Auto-recalibrate weekly

---

### Sprint 19: Frontend — Revenue Pages (2 weeks)

**Theme:** Wire 30+ pages to real APIs, build missing dashboards
**Revenue unlock:** Operational efficiency — users can act on data

#### 19.1 — Core Revenue Pages (3 days)
- Wire CommandCenter KPIs to `/dashboard/summary`
- Wire ExecutiveDashboard to real ticket data
- Wire PaymentPosting to ERA workflow
- Wire ContractManager to contract variance engine

#### 19.2 — Prevention & Compliance UI (3 days)
- Build Prevention Blocking UI (Hold/Dismiss/Resolve)
- Build Compliance Risk Dashboard (FCA/OIG scores)
- Wire prevention_service alerts to frontend

#### 19.3 — Appeal Pipeline Tracker (2 days)
- GENERATED → SUBMITTED → UNDER_REVIEW → WON/LOST
- Deadline countdown, batch management
- Wire to outcome_tracker

#### 19.4 — Prediction Badges Everywhere (2 days)
- Add DenialRiskBadge to: DenialManagement, HighRiskClaims, ClaimsWorkQueue
- Add AppealSuccessBadge to: DenialManagement, AppealGenerator
- Add PaymentDelayIndicator (now real, not fake hash)
- Add PropensityBadge to: CollectionsQueue

#### 19.5 — Neo4j Graph Explorer (2 days)
- Interactive visualization (react-force-graph or d3-force)
- Click-to-drill on nodes
- Filter by payer/provider/root cause

#### 19.6 — Outcome Feedback Dashboard (1 day)
- Prediction accuracy charts (confusion matrix, calibration)
- Model performance over time
- Feedback loop status

#### 19.7 — MiroFish Simulation UI (1 day)
- Scenario builder (what-if parameters)
- Results comparison view
- Wire to simulation API

---

### Sprint 20: Specialty Modules + Operational (2 weeks)

**Theme:** Build missing backend routers, wire remaining pages
**Revenue unlock:** Complete coverage — no dead pages

#### 20.1 — Coding Module Backend (3 days)
- Create `/coding` router: audit, compliance, NLP suggestions
- Wire AICodingAudit, AICodingCompliance, CodingOptimizer

#### 20.2 — EVV Module Backend (2 days)
- Create `/evv` router: visit tracking, fraud detection, state mandates
- Wire EVVDashboard, EVVFraudDetection, EVVVisitDetails

#### 20.3 — Patient Access Backend (3 days)
- Create `/insurance` router: eligibility, prior auth, benefits
- Wire PatientAccessHub, InsuranceVerification, PriorAuthManager, BenefitAnalytics

#### 20.4 — Admin/Settings Backend (2 days)
- Create `/admin` router: system health, ETL status, API monitoring
- Wire AdminDashboard, ETLDesigner, APIManager, Scheduler

#### 20.5 — Collections Enhancement (2 days)
- Build CollectionsCommand orchestration
- Wire CollectionsActionCenter, CollectionsTimeline, RecoveryInsights
- Integrate propensity-to-pay model

#### 20.6 — Developer/AI Monitoring (1 day)
- Wire AIModelMonitor to model_registry
- Wire DataSchemaExplorer to DB introspection
- Wire MCPAgentHub to MiroFish status

#### 20.7 — Report Generation (1 day)
- Wire MECEReportBuilder to real report generation
- Wire StandardReports to scheduled report engine

---

### Sprint 21: Compliance, Audit & Polish (1.5 weeks)

**Theme:** Compliance monitoring, audit readiness, final QA
**Revenue unlock:** $200K-$2M compliance risk avoidance

#### 21.1 — Compliance Risk Engine (3 days)
- Create `backend/app/services/compliance_engine.py`
- Over-coding detection (Z-scores vs benchmarks)
- FCA risk composite score (0-100)
- OIG/RAC audit target early warning

#### 21.2 — Audit Trail Completeness (2 days)
- Every automated action logged with full context
- RAC audit response preparation
- Comprehensive action → outcome → model update chain

#### 21.3 — Full Integration Test Suite (2 days)
- End-to-end pipeline test (Data → Track Outcome)
- All 23+ automation rules fire correctly
- All 15+ prevention rules evaluate
- All ML models predict within accuracy targets
- Frontend → Backend → DB round-trip for all 143 pages

#### 21.4 — Performance & Optimization (1 day)
- Code splitting for frontend bundle (1,952 KB → target <500 KB initial)
- API response time audit (<200ms for predictions)
- Background job performance tuning

---

## SPRINT TIMELINE

```
Sprint 16 (Automation+Prevention) ─── 2 weeks
    │
    ├──→ Sprint 17 (ML Models) ──────── 2 weeks (parallel)
    │         │
    ├──→ Sprint 18 (MiroFish+Validation) 2 weeks
    │         │
    └──→ Sprint 19 (Frontend Revenue) ── 2 weeks (parallel with 18)
              │
              ├──→ Sprint 20 (Specialty) ── 2 weeks
              │
              └──→ Sprint 21 (Compliance) ── 1.5 weeks
```

**Total:** ~8 weeks (with parallelization)
**Sprints 16+17 run in parallel:** 2 weeks
**Sprints 18+19 run in parallel:** 2 weeks
**Sprints 20+21 sequential:** 3.5 weeks

---

## BIBLE COMPLIANCE TRAJECTORY

| Milestone | Bible Score | Automation | Prevention | ML Models | Pages (REAL) |
|-----------|-----------|------------|------------|-----------|-------------|
| Current | 23% | 15 rules | 5 rules | 4 models | 41/143 |
| After Sprint 16 | 32% | 23 rules | 15 rules | 4 models | 41/143 |
| After Sprint 17 | 40% | 23 rules | 15 rules | 14 models | 41/143 |
| After Sprint 18 | 48% | 23 rules + validation | 15 rules | 14 models | 41/143 |
| After Sprint 19 | 55% | 23 rules | 15 rules | 14 models | 80/143 |
| After Sprint 20 | 65% | 23 rules | 15 rules | 14 models | 120/143 |
| After Sprint 21 | 70%+ | 23 rules + compliance | 15 rules | 14 models | 130/143 |

---

## REVENUE IMPACT SUMMARY

| Category | Currently Realized | After Sprints 16-21 | Total Bible Target |
|----------|--------------------|--------------------|--------------------|
| Automation | ~$584K | ~$2.8M-$4.2M | $3.11M-$5.26M |
| Prevention | ~$100K | ~$1.5M-$2.8M | $2.37M-$4.72M |
| ML-Driven Improvements | ~$50K | ~$400K-$800K | included above |
| **TOTAL** | **~$734K** | **~$4.7M-$7.8M** | **$5.48M-$9.98M** |

---

*Analysis based on cross-referencing Bible Parts 1-6, speckit-analysis.md, speckit-tasks.md, bible-5-automation-and-prevention.md, and current codebase state as of 2026-03-29.*
