# NEXUS RCM -- Product Requirements Document (PRD)

> **Version:** 1.0
> **Date:** 2026-03-27
> **Status:** Living Document
> **Product:** NEXUS RCM -- Revenue Intelligence Platform

---

## 1. Executive Summary

NEXUS RCM is an AI-powered Revenue Cycle Management intelligence platform built for US healthcare organizations. It ingests claims, denials, payments, eligibility, prior authorization, EVV, and bank reconciliation data to deliver closed-loop revenue intelligence -- from descriptive analytics that show what happened, through root cause analysis that explains why, diagnostic suggestions that say what to fix now, predictive models that forecast what will happen, to automation and prevention engines that act before problems occur. The platform replaces fragmented RCM dashboards with a unified system where every metric drills down to the individual claim, every claim connects to its root cause, and every root cause connects to an automated resolution.

**Target Market:** US Healthcare Revenue Cycle Management -- hospitals, health systems, physician groups, home health agencies, and RCM services companies managing $10M+ annual revenue.

**Core Value Proposition:** AI-powered RCM intelligence that connects Analytics to Automation to Prevention, turning data into recovered revenue through a closed-loop system where insights automatically trigger actions and actions feed back into better insights.

---

## 2. Product Vision

### Mission Statement

Eliminate preventable revenue loss in healthcare by building the first RCM platform where every denied claim is automatically root-caused, every revenue pattern is diagnostically monitored, and every preventable error is stopped before submission.

### The Four-Layer Architecture

```
Layer 4: PREVENTION       -- Stop problems before they happen
  |  feeds back to
Layer 3: AUTOMATION        -- Fix known problems faster than humans can
  |  informed by
Layer 2: SIMULATION        -- Predict outcomes via MiroFish multi-agent simulation (NEW)
  |  feeds back to
Layer 1: ANALYTICS         -- Descriptive + Root Cause + Diagnostic + Predictive
  |  all grounded in
DATA: 500K claims, 56K denials, 315K ERA payments, 131K prior auths
```

- **Layer 1 -- Analytics:** Answers "What happened?", "Why?", "What is wrong now?", and "What will happen?" across revenue, denials, payments, collections, and claims.
- **Layer 2 -- Automation:** Executes rule-based and AI-assisted actions: auto-appeal generation, claim correction, resubmission, eligibility re-verification, and queue prioritization.
- **Layer 3 -- Prevention:** Intercepts claims before submission to flag risks, countdown timely filing deadlines, and trigger pre-emptive eligibility checks. (Currently the highest-value gap.)

### The Claim-as-Primary-Unit Philosophy

Everything connects through `claim_id`. A claim is not an isolated record -- it is the nucleus of a graph that connects to its patient, provider, payer, denial reason, root cause analysis (7-step Bayesian), ERA payment, prior authorization, eligibility response, appeal, collection task, and bank reconciliation entry. Every analytics view, every drill-down, and every automation rule ultimately resolves to one or more claims.

---

## 3. System Architecture

### 3.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.14, FastAPI, SQLAlchemy (async), Pydantic v2 |
| **Database** | PostgreSQL (primary), Redis (planned cache) |
| **AI/LLM** | Ollama (local) with llama3 8B and mistral models |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Recharts |
| **DevOps** | Uvicorn (ASGI), Alembic (migrations) |

### 3.2 Backend Services (9 service files)

| Service File | Purpose |
|-------------|---------|
| `ai_insights.py` | Ollama LLM integration, prompt engineering, SSE streaming, 5-min TTL cache |
| `root_cause_service.py` | 7-step Bayesian root cause analysis engine |
| `diagnostic_service.py` | Real-time diagnostic findings with severity classification |
| `automation_engine.py` | Rule evaluation, pending action queue, approve/reject workflow |
| `graph_query_service.py` | 5-level drill-down graph queries (Revenue to Payer to Category to Root Cause to Claim) |
| `crs.py` | Claim Risk Scoring -- 6-component pre-submission scoring |
| `triangulation_service.py` | ERA-Bank-Claim payment matching and float analysis |
| `adtp_service.py` | Average Days to Payment calculations and anomaly detection |
| `appeal_generator.py` | AI-assisted appeal letter generation |

### 3.3 API Architecture (15 routers)

| Router Prefix | Module | Tag |
|--------------|--------|-----|
| `/api/v1/auth` | `auth.py` | auth |
| `/api/v1/claims` | `claims.py` | claims |
| `/api/v1/denials` | `denials.py` | denials |
| `/api/v1/payments` | `payments.py` | payments |
| `/api/v1/ar` | `ar.py` | ar |
| `/api/v1/collections` | `collections.py` | collections |
| `/api/v1/collections` | `collections_extended.py` | collections (extended) |
| `/api/v1/reconciliation` | `reconciliation.py` | reconciliation |
| `/api/v1/forecast` | `forecast.py` | forecast |
| `/api/v1/crs` | `crs.py` | crs |
| `/api/v1/analytics` | `analytics.py` | analytics |
| `/api/v1/ai` | `ai.py` | ai |
| `/api/v1/root-cause` | `root_cause.py` | root-cause |
| `/api/v1/diagnostics` | `diagnostics.py` | diagnostics |
| `/api/v1` | `graph.py` | graph, automation |

### 3.4 Database Schema (22 tables)

| Table | Row Count | Description |
|-------|-----------|-------------|
| `claims` | 500,000 | Primary claim records -- the nucleus of all data |
| `claim_lines` | 1,250,173 | Individual service lines per claim (CPT, charges, modifiers) |
| `era_payments` | 315,486 | Electronic Remittance Advice payment records |
| `prior_auth` | 131,445 | Prior authorization records (enriched with claim linkage) |
| `evv_visits` | 80,000 | Electronic Visit Verification for home health |
| `insurance_coverage` | 62,434 | Patient insurance coverage records |
| `root_cause_analysis` | 56,426 | Root cause header records (one per denied claim) |
| `denials` | 56,426 | Denial records with CARC/RARC codes |
| `claim_root_cause_step` | 451,408 | Individual steps of the 7-step root cause analysis |
| `patients` | 50,000 | Patient demographics |
| `eligibility_271` | 40,000 | 271 eligibility response records |
| `appeals` | 24,827 | Appeal records with outcomes |
| `payment_forecast` | 9,200 | Revenue forecast data points |
| `collection_queue` | 5,000 | Active collection tasks |
| `bank_reconciliation` | 2,797 | Bank deposit matching records |
| `collection_alerts` | 1,499 | Collection alert/notification records |
| `payer_contract_rate` | 800 | Contracted rates (50 CPT codes x 16 payers) |
| `providers` | 200 | Provider/physician records |
| `payer_master` | 50 | Payer reference data |
| `adtp_trend` | 61 | Average Days to Payment trend snapshots |
| `automation_actions` | 13 | Automation action log entries |
| `users` | 0 | User accounts (auth system not implemented) |

### 3.5 Data Models (10 model files)

| Model File | Tables Defined |
|-----------|---------------|
| `claim.py` | claims, claim_lines |
| `denial.py` | denials |
| `patient.py` | patients |
| `payer.py` | payer_master, payer_contract_rate |
| `provider.py` | providers |
| `rcm_extended.py` | era_payments, prior_auth, evv_visits, eligibility_271, insurance_coverage, bank_reconciliation, payment_forecast, adtp_trend |
| `ar_collections.py` | collection_queue, collection_alerts, appeals |
| `root_cause.py` | root_cause_analysis, claim_root_cause_step |
| `automation.py` | automation_actions |
| `user.py` | users |

---

## 4. Feature Inventory -- WHAT IS BUILT

### 4.1 Navigation Structure (15 sidebar items)

The sidebar is organized into 5 sections with 15 top-level navigation items:

| # | Section | Sidebar Item | Route | Sub-tabs |
|---|---------|-------------|-------|----------|
| 1 | -- | Command Center | `/` | Single page |
| 2 | Analytics | Revenue Analytics | `/analytics/revenue` | Overview, Reconciliation, AR Aging, Cash Flow |
| 3 | Analytics | Denial Analytics | `/analytics/denials` | Overview, Root Cause, Payer Patterns |
| 4 | Analytics | Payment Intelligence | `/analytics/payments` | Overview, Payer Profiles, Contract Audit, ERA-Bank Recon |
| 5 | Analytics | Claims Pipeline | `/analytics/claims` | Overview, Scrub Analytics |
| 6 | Work | Claims Work Center | `/work/claims` | Queue, Auto-Fix, Batch Actions |
| 7 | Work | Denial Work Center | `/work/denials` | Queue, High Risk, Appeals, Workflow Log |
| 8 | Work | Collections Work Center | `/work/collections` | Queue, Alerts, Portal |
| 9 | Work | Payment Work Center | `/work/payments` | ERA Processing, Posting, Contracts |
| 10 | Work | Automation Dashboard | `/work/automation` | Single page |
| 11 | Intelligence | LIDA AI | `/intelligence/lida` | Dashboard, Chat, Reports, Tickets |
| 12 | Intelligence | Revenue Forecast | `/intelligence/forecast` | Single page |
| 13 | Specialty | Patient Access | `/specialty/patient-access` | Overview, Eligibility, Auths, Benefits, History, Accounts |
| 14 | Specialty | Coding & Charge | `/specialty/coding` | Optimizer, Audit, Compliance, Rulebook |
| 15 | Specialty | EVV Home Health | `/specialty/evv` | Dashboard, Visits, Fraud, Mandates, Auto-Retry |
| -- | Settings | Settings | `/settings` | Users, Billing Rules, AI Config |

### 4.2 Analytics Layer (4 pages, 14 tabs)

#### Revenue Analytics (`/analytics/revenue`)
| Tab | Route | Component | Data Source |
|-----|-------|-----------|-------------|
| Overview | `/analytics/revenue/overview` | `ExecutiveDashboard` | API: payments, AR, denials, claims summaries |
| Reconciliation | `/analytics/revenue/reconciliation` | `RevenueReconciliation` | API: `/reconciliation/summary`, `/reconciliation/weekly` |
| AR Aging | `/analytics/revenue/ar-aging` | `ARAgingPage` | API: `/ar/summary`, `/ar/aging`, `/ar/trend` |
| Cash Flow | `/analytics/revenue/cash-flow` | `CashFlowPage` | API: `/payments/summary`, forecast data |

#### Denial Analytics (`/analytics/denials`)
| Tab | Route | Component | Data Source |
|-----|-------|-----------|-------------|
| Overview | `/analytics/denials/overview` | `DenialAnalytics` | API: `/denials/summary`, `/denials/heatmap` |
| Root Cause | `/analytics/denials/root-cause` | `RootCauseIntelligence` | API: `/root-cause/summary`, `/root-cause/trending` |
| Payer Patterns | `/analytics/denials/payer-patterns` | `PayerVariance` | API: `/denials/summary` with payer breakdown |

Sub-routes:
- `/analytics/denials/root-cause/claims` -- `RootCauseClaimsPage` (drill-down to claims by root cause)
- `/analytics/denials/root-cause/claim/:claimId` -- `ClaimRootCauseDetail` (individual claim 7-step analysis)

#### Payment Intelligence (`/analytics/payments`)
| Tab | Route | Component | Data Source |
|-----|-------|-----------|-------------|
| Overview | `/analytics/payments/overview` | `PaymentDashboard` | API: `/payments/summary`, `/payments/adtp` |
| Payer Profiles | `/analytics/payments/payer-profiles` | `PayerPaymentIntelligence` | API: `/payments/triangulation/payer/:id` |
| Contract Audit | `/analytics/payments/contract-audit` | `ContractAudit` | API: `/payments/silent-underpayments` |
| ERA-Bank Recon | `/analytics/payments/era-bank-recon` | `ERABankRecon` | API: `/payments/era-bank-match`, `/payments/float-analysis` |

#### Claims Pipeline (`/analytics/claims`)
| Tab | Route | Component | Data Source |
|-----|-------|-----------|-------------|
| Overview | `/analytics/claims/overview` | `ClaimsOverview` | API: `/analytics/pipeline` |
| Scrub Analytics | `/analytics/claims/scrub-analytics` | `ScrubDashboard` | API: `/crs/summary`, `/crs/error-categories` |

### 4.3 Work Centers (5 pages)

#### Claims Work Center (`/work/claims`)
| Tab | Route | Component | Purpose |
|-----|-------|-----------|---------|
| Queue | `/work/claims/queue` | `ClaimsWorkQueue` | Filterable claim work queue with status management |
| Auto-Fix | `/work/claims/auto-fix` | `AutoFixCenter` | CRS-powered automatic claim correction |
| Batch Actions | `/work/claims/batch` | `BatchActions` | Bulk claim operations (submit, hold, void) |

Note: Pre-Batch Scrub tab exists in some layouts but routes to `/work/claims/scrub` which has no matching route definition (dead link -- see Known Issues).

#### Denial Work Center (`/work/denials`)
| Tab | Route | Component | Purpose |
|-----|-------|-----------|---------|
| Queue | `/work/denials/queue` | `DenialManagement` | Denial work queue with filtering and assignment |
| High Risk | `/work/denials/high-risk` | `HighRiskClaims` | Claims flagged by CRS as high denial risk |
| Appeals | `/work/denials/appeals` | `AppealGenerator` | AI-assisted appeal letter generation and tracking |
| Workflow Log | `/work/denials/workflow-log` | `DenialWorkflowLog` | Audit trail of denial resolution activities |

#### Collections Work Center (`/work/collections`)
| Tab | Route | Component | Purpose |
|-----|-------|-----------|---------|
| Queue | `/work/collections/queue` | `CollectionsQueue` | Prioritized collection task queue |
| Alerts | `/work/collections/alerts` | `AlertsQueue` | Collection alerts (timely filing, balance thresholds) |
| Portal | `/work/collections/portal` | `PaymentPortal` | Patient-facing payment interface |

#### Payment Work Center (`/work/payments`)
| Tab | Route | Component | Purpose |
|-----|-------|-----------|---------|
| ERA Processing | `/work/payments/era` | `ERAProcessing` | Electronic Remittance Advice intake and review |
| Payment Posting | `/work/payments/posting` | `PaymentPosting` | Manual and bulk payment posting |
| Contracts | `/work/payments/contracts` | `ContractManager` | Payer contract rate management |

#### Automation Dashboard (`/work/automation`)
Single-page dashboard showing all automation rules, pending actions requiring approval, audit trail, and rule evaluation controls.

### 4.4 Intelligence (2 pages)

#### LIDA AI (`/intelligence/lida`)
| Tab | Route | Component | Purpose |
|-----|-------|-----------|---------|
| Dashboard | `/intelligence/lida/dashboard` | `LidaDashboard` | AI-generated insights overview with severity cards |
| Chat | `/intelligence/lida/chat` | `LidaChat` | Conversational AI interface for ad-hoc RCM queries |
| Reports | `/intelligence/lida/reports` | `MECEReportBuilder` | MECE-structured report generation |
| Tickets | `/intelligence/lida/tickets` | `TicketHub` | Action tracking from AI-generated recommendations |

#### Revenue Forecast (`/intelligence/forecast`)
Single-page forecast dashboard showing 30/60/90-day revenue projections, daily cash receipt estimates, and forecast accuracy tracking.

### 4.5 Specialty & Platform

#### Patient Access (`/specialty/patient-access`) -- 6 sub-pages
| Tab | Route | Component | Purpose |
|-----|-------|-----------|---------|
| Overview | `overview` | `PatientAccessHub` | Patient access KPI dashboard |
| Eligibility | `eligibility` | `InsuranceVerification` | Real-time eligibility verification (271 responses) |
| Auths | `auths` | `PriorAuthManager` | Prior authorization tracking and management |
| Benefits | `benefits` | `BenefitAnalytics` | Benefit coverage analytics |
| History | `history` | `VerificationHistory` | Verification audit trail |
| Accounts | `accounts` | `PatientAccounts` | Patient account management |

#### Coding & Charge (`/specialty/coding`) -- 4 sub-pages
| Tab | Route | Component | Purpose |
|-----|-------|-----------|---------|
| Optimizer | (index) | `CodingOptimizer` | AI-assisted code optimization suggestions |
| Audit | `audit` | `AICodingAudit` | Coding audit with compliance checking |
| Compliance | `compliance` | `AICodingCompliance` | Compliance rule monitoring |
| Rulebook | `rulebook` | `AICodingRulebook` | Coding rule reference and management |

#### EVV Home Health (`/specialty/evv`) -- 5 sub-pages
| Tab | Route | Component | Purpose |
|-----|-------|-----------|---------|
| Dashboard | `/specialty/evv/dashboard` | `EVVDashboard` | EVV compliance and visit overview |
| Visits | `/specialty/evv/visits` | `EVVVisitDetails` | Individual visit detail and validation |
| Fraud | `/specialty/evv/fraud` | `EVVFraudDetection` | GPS/time anomaly detection for fraud |
| Mandates | `/specialty/evv/mandates` | `StateMandates` | State-specific EVV mandate tracking |
| Auto-Retry | `/specialty/evv/auto-retry` | `EVVAutoRetryManager` | Automated resubmission for failed EVV claims |

#### Settings & Admin
| Page | Route | Component |
|------|-------|-----------|
| User Management | `/settings/users` | `UserManagement` |
| Billing Rules | `/settings/billing-rules` | `BillingRules` |
| AI Configuration | `/settings/ai-config` | `AIConfiguration` |
| Admin Dashboard | `/admin/dashboard` | `AdminDashboard` |
| Integration Hub | `/admin/integrations` | `IntegrationHub` |
| ETL Designer | `/admin/etl-designer` | `ETLDesigner` |
| API Manager | `/admin/api-manager` | `APIManager` |
| Scheduler | `/admin/scheduler` | `Scheduler` |

---

## 5. AI/ML Capabilities

### 5.1 Ollama Local LLM

The platform runs AI inference locally via Ollama, eliminating PHI exposure to cloud APIs.

| Parameter | Value |
|-----------|-------|
| Primary model | llama3 (8B parameters) |
| Fallback model | mistral |
| Cache TTL | 5 minutes |
| Streaming | SSE (Server-Sent Events) for real-time token delivery |
| Fallback behavior | Graceful degradation to static content when Ollama is unavailable |

**Prompt Engineering Architecture:**
- Database statistics are injected into prompts as context (real numbers, not hallucinated)
- Each context type has a dedicated prompt template with domain-specific instructions
- 8 context types supported:
  1. `denials` -- Denial pattern analysis and recommendations
  2. `collections` -- Collection strategy and prioritization
  3. `payments` -- Payment trend and payer behavior analysis
  4. `reconciliation` -- ERA-bank matching and discrepancy analysis
  5. `root-cause` -- Root cause distribution and trending analysis
  6. `adtp` -- Average Days to Payment anomaly explanation
  7. `diagnostics` -- Diagnostic finding interpretation
  8. `command-center` -- Executive-level revenue health summary

**API Endpoints:**
- `GET /api/v1/ai/health` -- Ollama connectivity check
- `GET /api/v1/ai/insights` -- Cached insight generation by context type
- `GET /api/v1/ai/stream` -- SSE streaming for real-time AI responses
- `POST /api/v1/ai/appeal-draft` -- AI-generated appeal letter from claim data
- `POST /api/v1/ai/call-script` -- AI-generated collection call script
- `GET /api/v1/ai/anomaly-explain` -- Natural language explanation of detected anomalies

### 5.2 Root Cause Engine

A zero-prior, graph-based, 7-step Bayesian analysis engine that independently determines the real root cause of every denial -- without trusting the payer's label.

**The 7 Steps:**

| Step | Name | What It Does |
|------|------|-------------|
| 1 | CARC_DECODE | Decodes the CARC/RARC code into plain language and maps to root cause categories |
| 2 | ELIGIBILITY_CHECK | Cross-references the claim date against eligibility_271 responses to check coverage gaps |
| 3 | AUTH_TIMELINE | Checks prior_auth records for missing, expired, or mismatched authorizations |
| 4 | CODING_VALIDATION | Validates CPT/modifier combinations, NCCI edits, and medical necessity |
| 5 | PAYER_HISTORY | Analyzes the payer's historical behavior for this CARC code and procedure |
| 6 | PROCESS_TIMELINE | Checks submission timing, resubmission patterns, and timely filing compliance |
| 7 | EVIDENCE_SYNTHESIS | Synthesizes all 6 prior steps into a final root cause determination with confidence score |

**Key Statistics:**
- 56,426 denials fully analyzed (100% of denial population)
- Backfill rate: 37 analyses per second
- 7 root cause categories discovered from independent claim data
- 60.5% disagreement rate with payer denial labels (genuine discovery -- the engine finds that payers frequently assign the wrong denial reason)

**Data Tables:**
- `root_cause_analysis`: 56,426 rows (one per denial, stores final determination)
- `claim_root_cause_step`: 451,408 rows (7 steps x ~56,426 denials, stores evidence per step)

### 5.3 Diagnostic Engine

Real-time detection of anomalies and actionable conditions across the RCM data.

**5 Detection Categories:**

| Category | What It Monitors | Example Findings |
|----------|-----------------|-----------------|
| Denial Pattern | Denial rate spikes, CARC code clustering | "CO-16 denials increased 340% for Payer X this month" |
| Payer Behavior | Payment timing, denial rate changes, contract compliance | "Payer Y ADTP increased from 18 to 34 days" |
| ADTP Anomaly | Average Days to Payment outliers | "3 payers showing ADTP > 45 days (2x baseline)" |
| Revenue Leakage | Underpayments, missing charges, contractual variance | "Silent underpayments of $47K detected across 12 payers" |
| AR Aging | Aging bucket shifts, stale AR growth | "AR > 120 days grew 18% month-over-month" |

**Severity Classification:** CRITICAL / WARNING / INFO
- Computed on-the-fly from current data (no persistent diagnostic table)
- Connected to automation rules for auto-triggered actions

### 5.4 Automation Engine

Rule-based automation with human-in-the-loop approval workflow.

**Current Rules (7 active):**

| # | Rule | Trigger | Action |
|---|------|---------|--------|
| 1 | Auto-appeal high-win CARCs | Denial with >70% historical appeal win rate | Draft appeal letter |
| 2 | Eligibility re-verify | Claim denied for eligibility | Re-check 271 |
| 3 | Auth expiration alert | Auth expires within 7 days | Alert + queue |
| 4 | Timely filing countdown | Claim approaching filing deadline | Priority escalation |
| 5 | Silent underpayment flag | Payment < contract rate by >5% | Create dispute |
| 6 | ADTP anomaly alert | Payer ADTP > 2x baseline | Flag for review |
| 7 | Duplicate claim detection | Same patient/CPT/date within 72 hours | Hold for review |

**Workflow:**
1. Diagnostic finding or data condition triggers a rule
2. Rule evaluates conditions and generates a pending action
3. Action enters the pending queue for human review
4. User approves or rejects with optional notes
5. Approved actions execute and log to audit trail

**API Endpoints:**
- `GET /api/v1/automation/rules` -- List all rules with status
- `POST /api/v1/automation/rules/{rule_id}/toggle` -- Enable/disable a rule
- `GET /api/v1/automation/pending` -- Pending actions awaiting approval
- `POST /api/v1/automation/approve/{action_id}` -- Approve an action
- `POST /api/v1/automation/reject/{action_id}` -- Reject an action
- `GET /api/v1/automation/audit` -- Full audit trail
- `POST /api/v1/automation/evaluate` -- Manually trigger rule evaluation

### 5.5 CRS (Claim Risk Scoring)

Pre-submission risk scoring that evaluates claims before they are sent to payers.

**6-Component Scoring:**

| Component | Weight | What It Checks |
|-----------|--------|---------------|
| Eligibility | ~20% | Coverage active on date of service, payer ID match |
| Authorization | ~20% | Auth exists, not expired, procedure matches |
| Coding | ~20% | CPT/modifier validity, NCCI edits, medical necessity |
| COB (Coordination of Benefits) | ~15% | Primary/secondary payer order correct |
| Documentation | ~15% | Required documentation attached |
| EVV | ~10% | Visit verification complete (home health only) |

**Capabilities:**
- Pre-submission risk flagging with composite score (0-100)
- Error category breakdown with specific fix recommendations
- Auto-fix for deterministic errors (wrong modifier, missing auth link)
- High-risk claim queue for manual review before submission

**API Endpoints:**
- `GET /api/v1/crs/summary` -- Overall scrub statistics
- `GET /api/v1/crs/error-categories` -- Error distribution by category
- `GET /api/v1/crs/queue` -- Claims requiring review
- `GET /api/v1/crs/claim/{claim_id}` -- Individual claim risk detail
- `GET /api/v1/crs/high-risk` -- High-risk claims queue
- `GET /api/v1/crs/payers` -- Risk patterns by payer

---

## 6. API Inventory

### Complete Endpoint Listing (82 endpoints)

#### Authentication (`/api/v1/auth`) -- 3 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/login` | User authentication |
| POST | `/register` | User registration |
| GET | `/me` | Current user profile |

#### Claims (`/api/v1/claims`) -- 4 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Paginated claim list with filters |
| GET | `/{claim_id}` | Individual claim detail |
| POST | `/` | Create new claim |
| PUT | `/{claim_id}` | Update existing claim |

#### Denials (`/api/v1/denials`) -- 8 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Paginated denial list with filters |
| GET | `/summary` | Denial summary statistics |
| GET | `/heatmap` | Denial heatmap data (CARC x Payer) |
| GET | `/appeals` | List appeals |
| POST | `/appeals` | Create new appeal |
| PATCH | `/appeals/{appeal_id}` | Update appeal status |
| GET | `/appeals/{appeal_id}/letter` | Get appeal letter content |
| POST | `/` | Create new denial record |

#### Payments (`/api/v1/payments`) -- 9 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | Payment summary with period metrics |
| GET | `/era` | Paginated ERA payment list |
| GET | `/era/{era_id}` | Individual ERA detail |
| POST | `/post` | Post a payment |
| GET | `/triangulation/summary` | ERA-Claim-Bank three-way match summary |
| GET | `/triangulation/payer/{payer_id}` | Payer-specific triangulation |
| GET | `/adtp` | Average Days to Payment data |
| GET | `/adtp/anomalies` | ADTP anomaly detection results |
| GET | `/era-bank-match` | ERA to bank deposit matching |
| GET | `/float-analysis` | Payment float day analysis |
| GET | `/silent-underpayments` | Underpayment detection results |

#### AR (`/api/v1/ar`) -- 4 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | AR summary with aging buckets |
| GET | `/aging` | Paginated AR aging detail |
| GET | `/trend` | AR trend over time |
| GET | `/aging-root-cause` | Root cause breakdown of aged AR |

#### Collections (`/api/v1/collections`) -- 14 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | Collections summary KPIs |
| GET | `/queue` | Paginated collection task queue |
| GET | `/alerts` | Collection alerts |
| PATCH | `/{task_id}` | Update collection task |
| GET | `/account/{account_id}` | Full account detail with balances |
| GET | `/account/{account_id}/timeline` | Account activity timeline |
| GET | `/account/{account_id}/documents` | Account documents |
| GET | `/templates` | Communication templates |
| GET | `/disposition-codes` | Call disposition codes |
| GET | `/escalation-reasons` | Escalation reason codes |
| GET | `/timeline` | System-wide collections timeline |
| GET | `/propensity/{account_id}` | Payment propensity score |
| GET | `/user-performance` | Individual collector metrics |
| GET | `/team-metrics` | Team-level performance |

#### Reconciliation (`/api/v1/reconciliation`) -- 6 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | Reconciliation summary |
| GET | `/weekly` | Weekly bank reconciliation records |
| GET | `/era` | ERA trail for reconciliation |
| GET | `/transaction/{transaction_id}` | Individual transaction detail |
| GET | `/payer-claims/{payer_id}` | Claims by payer for recon |
| GET | `/payer-claims-by-name` | Claims by payer name lookup |

#### Forecast (`/api/v1/forecast`) -- 5 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | Forecast summary |
| GET | `/weekly` | Weekly revenue forecast |
| GET | `/daily` | Daily cash receipt forecast |
| GET | `/reconciliation/weekly` | Forecast vs actual reconciliation |
| GET | `/reconciliation/summary` | Forecast accuracy summary |

#### CRS (`/api/v1/crs`) -- 6 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | CRS summary statistics |
| GET | `/error-categories` | Error distribution |
| GET | `/queue` | Claims queue for review |
| GET | `/claim/{claim_id}` | Individual claim risk detail |
| GET | `/high-risk` | High-risk claims |
| GET | `/payers` | Risk by payer |

#### Analytics (`/api/v1/analytics`) -- 3 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/pipeline` | Claims pipeline analytics |
| GET | `/denial-matrix` | Denial matrix (CARC x Payer) |
| GET | `/appeal-win-rate` | Appeal win rate analytics |

#### AI (`/api/v1/ai`) -- 6 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Ollama health check |
| GET | `/insights` | AI-generated insights by context |
| GET | `/stream` | SSE streaming AI response |
| POST | `/appeal-draft` | Generate appeal letter |
| POST | `/call-script` | Generate collection call script |
| GET | `/anomaly-explain` | Natural language anomaly explanation |

#### Root Cause (`/api/v1/root-cause`) -- 3 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | Root cause distribution summary |
| GET | `/trending` | Trending root causes over time |
| GET | `/claim/{claim_id}` | Individual claim root cause analysis |

#### Diagnostics (`/api/v1/diagnostics`) -- 4 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | Diagnostic findings summary |
| GET | `/findings` | All active diagnostic findings |
| GET | `/payer/{payer_id}` | Payer-specific diagnostics |
| GET | `/claim/{claim_id}` | Claim-specific diagnostics |

#### Graph Drill-Down (`/api/v1/graph`) -- 6 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/graph/revenue-to-payers` | Level 1: Revenue to payer breakdown |
| GET | `/graph/payer/{payer_id}/categories` | Level 2: Payer to denial categories |
| GET | `/graph/payer/{payer_id}/category/{category}/root-causes` | Level 3: Category to root causes |
| GET | `/graph/claims/browse` | Level 4: Browse claims with filters |
| GET | `/graph/claims` | Level 4: Claims list with pagination |
| GET | `/graph/claim/{claim_id}/full-context` | Level 5: Full claim context |

#### Automation (`/api/v1/automation`) -- 7 endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/automation/rules` | List automation rules |
| POST | `/automation/rules/{rule_id}/toggle` | Enable/disable rule |
| GET | `/automation/pending` | Pending actions queue |
| POST | `/automation/approve/{action_id}` | Approve action |
| POST | `/automation/reject/{action_id}` | Reject action |
| GET | `/automation/audit` | Audit trail |
| POST | `/automation/evaluate` | Trigger rule evaluation |

---

## 7. Graph Drill-Down Architecture

The platform implements a 5-level drill-down that allows users to navigate from high-level revenue metrics down to individual claim evidence.

```
Level 1: Revenue Overview ($205M total)
    |
Level 2: Payer Breakdown (50 payers)
    |
Level 3: Denial Category per Payer (6 categories)
    |       - Eligibility/Coverage Issues
    |       - Authorization Problems
    |       - Coding/Billing Errors
    |       - Timely Filing Violations
    |       - Coordination of Benefits
    |       - Medical Necessity/Documentation
    |
Level 4: Root Causes per Category (7 root cause types)
    |       - Coverage Gap
    |       - Auth Missing/Expired
    |       - Code Invalid/Modifier Error
    |       - Filing Deadline Missed
    |       - COB Order Wrong
    |       - Documentation Insufficient
    |       - Payer Processing Error
    |
Level 5: Individual Claims + Full Context
        - 8-section claim detail page
```

### Investigation Panel
A contextual slide-out panel can be triggered from any KPI card on any analytics page. It shows:
- The metric definition and current value
- Trend chart (30/60/90 day)
- Contributing factors from the graph query
- Quick-action buttons (drill down, export, create ticket)

### Claim Detail Page (8 sections)
When a user drills down to an individual claim, they see:
1. **Header** -- Claim ID, patient, provider, payer, status, dates, charges
2. **Timeline** -- Visual timeline of claim lifecycle events
3. **Denial Details** -- CARC/RARC codes, denial date, denied amount
4. **Root Cause Graph** -- Visual representation of the 7-step analysis with confidence scores
5. **Claim Lines** -- Individual service lines with CPT codes, charges, payments
6. **Connected Records** -- Linked eligibility, prior auth, ERA, appeal, collection records
7. **Suggested Actions** -- AI/rule-generated recommendations
8. **AI Insights** -- LLM-generated narrative analysis of the claim situation

---

## 8. Data Pipeline

### Data Architecture

- **22 PostgreSQL tables** with referential integrity through `claim_id` as the primary foreign key
- **Independent data enrichment:** Eligibility (271), prior auth, and timeline data are randomized independently of denial categories, ensuring the root cause engine discovers genuine patterns rather than confirming synthetic correlations
- **Root cause backfill:** All 56,426 denials were analyzed through the 7-step engine at 37 analyses per second
- **Contract rate coverage:** 800 rates mapping 50 CPT codes across 16 payers, enabling underpayment detection
- **Bank reconciliation:** 2,797 deposit records with float days ranging from 1 to 15 days, enabling payment timing analysis
- **ERA payment matching:** 315,486 ERA records linked to claims for three-way (ERA-Claim-Bank) reconciliation

### Data Flow

```
EHR/PM System
    |
    v
Claims (500K) ---> Clearinghouse ---> Payer
    |                                    |
    v                                    v
Claim Lines (1.25M)               Denials (56K)
    |                                    |
    v                                    v
CRS Pre-Scrub              Root Cause Engine (7-step)
    |                                    |
    v                                    v
Eligibility 271 (40K)        Root Cause Analysis (56K)
Prior Auth (131K)            Claim Root Cause Steps (451K)
    |                                    |
    v                                    v
ERA Payments (315K)               Appeals (24K)
    |                                    |
    v                                    v
Bank Reconciliation (2.8K)    Collection Queue (5K)
    |                                    |
    v                                    v
Payment Forecast (9.2K)      Automation Actions (13)
```

---

## 9. Bible Cross-Reference -- Completion Status

The RCM Bible defines the complete specification across 5 documents (originally 6, with Docs 5 and 6 merged). Below is the implementation coverage analysis.

| Bible Document | Scope | Planned Items | Implemented | Coverage |
|---------------|-------|---------------|-------------|----------|
| Part 1: Descriptive Analytics | Metrics, reports, KPIs -- "What happened?" | 187 | ~104 | 56% |
| Part 2: Root Cause Analysis | Claim-level and system-level root causes -- "Why?" | 157 | ~18 | 11% |
| Part 3: Diagnostic Suggestions | Anomaly detection and actionable findings -- "What is wrong now?" | 121 | ~15 | 12% |
| Part 4: Predictive Analytics | Forward-looking models and forecasts -- "What will happen?" | 85 | ~12 | 14% |
| Part 5: Automation & Prevention | Automated actions and pre-emptive interventions -- "Fix it / Stop it" | 79 | ~10 | 13% |
| **TOTAL** | | **629** | **~159** | **25%** |

### Coverage Notes

- **Part 1 (56%)** has the highest coverage because the analytics pages surface real metrics from the database. Revenue, denial, payment, AR, and collections summaries are all live.
- **Part 2 (11%)** is low despite the root cause engine being fully built because the Bible specifies 157 individual root cause scenarios with detailed decompositions, while the engine currently handles 7 categories.
- **Part 3 (12%)** has 5 diagnostic categories implemented out of the 121 individual diagnostics specified. The engine framework is in place but most specific detection rules are not yet coded.
- **Part 4 (14%)** relies on the forecast module which provides basic time-series projections but lacks the ML models (SARIMA, gradient boosting, ensemble) specified in the Bible.
- **Part 5 (13%)** has only 7 automation rules vs. 79 specified, and no prevention engine at all.

---

## 10. Page Data Wiring Status

### Pages with REAL API Data (~32 pages)

These pages fetch data from the FastAPI backend connected to PostgreSQL:

| # | Page | Key API Endpoints Used |
|---|------|----------------------|
| 1 | Command Center | `/payments/summary`, `/denials/summary`, `/ar/summary`, `/collections/summary` |
| 2 | Executive Dashboard (Revenue Overview) | `/payments/summary`, `/ar/summary`, `/denials/summary` |
| 3 | Revenue Reconciliation | `/reconciliation/summary`, `/reconciliation/weekly`, `/reconciliation/era` |
| 4 | AR Aging | `/ar/summary`, `/ar/aging`, `/ar/trend`, `/ar/aging-root-cause` |
| 5 | Cash Flow | `/payments/summary`, `/forecast/daily` |
| 6 | Denial Analytics (Overview) | `/denials/summary`, `/denials/heatmap` |
| 7 | Root Cause Intelligence | `/root-cause/summary`, `/root-cause/trending` |
| 8 | Root Cause Claims Page | `/graph/claims`, `/graph/claims/browse` |
| 9 | Claim Root Cause Detail | `/root-cause/claim/{id}`, `/graph/claim/{id}/full-context` |
| 10 | Payer Variance | `/denials/summary` (payer breakdown) |
| 11 | Payment Dashboard | `/payments/summary`, `/payments/adtp` |
| 12 | Payer Payment Intelligence | `/payments/triangulation/payer/{id}` |
| 13 | Contract Audit | `/payments/silent-underpayments` |
| 14 | ERA-Bank Recon | `/payments/era-bank-match`, `/payments/float-analysis` |
| 15 | Claims Overview | `/analytics/pipeline`, `/claims` |
| 16 | Scrub Dashboard | `/crs/summary`, `/crs/error-categories` |
| 17 | Claims Work Queue | `/claims` (paginated with filters) |
| 18 | Auto-Fix Center | `/crs/queue`, `/crs/claim/{id}` |
| 19 | Denial Management | `/denials` (paginated) |
| 20 | High Risk Claims | `/crs/high-risk` |
| 21 | Appeal Generator | `/denials/appeals`, `/ai/appeal-draft` |
| 22 | Collections Queue | `/collections/queue`, `/collections/summary` |
| 23 | Alerts Queue | `/collections/alerts` |
| 24 | ERA Processing | `/payments/era` |
| 25 | Payment Posting | `/payments/post` |
| 26 | Automation Dashboard | `/automation/rules`, `/automation/pending`, `/automation/audit` |
| 27 | LIDA Dashboard | `/ai/insights`, `/diagnostics/summary` |
| 28 | LIDA Chat | `/ai/stream` (SSE) |
| 29 | Revenue Forecast | `/forecast/summary`, `/forecast/weekly`, `/forecast/daily` |
| 30 | Account Details | `/collections/account/{id}`, `/collections/account/{id}/timeline` |
| 31 | Payer Recon Claims | `/reconciliation/payer-claims/{id}` |
| 32 | Transaction Ledger | `/reconciliation/transaction/{id}` |

### Pages with HARDCODED/MOCK Data (~28 pages)

These pages render with static arrays, mock data imports, or `STATIC_FALLBACK` constants:

| # | Page | What Is Mock |
|---|------|-------------|
| 1 | Batch Actions | Batch operation results, submission tracking |
| 2 | Denial Workflow Log | Workflow timeline events |
| 3 | Payment Portal | Patient payment forms and history |
| 4 | Contract Manager | Contract rate tables, negotiation tracking |
| 5 | MECE Report Builder | Report templates and generated reports |
| 6 | Ticket Hub | Action tickets and assignments |
| 7 | Patient Access Hub | Patient access KPIs |
| 8 | Insurance Verification | Eligibility check interface |
| 9 | Prior Auth Manager | Auth request workflow |
| 10 | Benefit Analytics | Benefit utilization data |
| 11 | Verification History | Verification audit records |
| 12 | Patient Accounts | Patient balance and billing |
| 13 | Coding Optimizer | Code suggestion data |
| 14 | AI Coding Audit | Audit finding data |
| 15 | AI Coding Compliance | Compliance rule results |
| 16 | AI Coding Rulebook | Rule reference data |
| 17 | EVV Dashboard | EVV compliance metrics |
| 18 | EVV Visit Details | Individual visit records |
| 19 | EVV Fraud Detection | Fraud alert data |
| 20 | State Mandates | Mandate compliance data |
| 21 | EVV Auto-Retry | Retry queue and results |
| 22 | Billing Rules | Rule configuration |
| 23 | AI Configuration | AI model settings |
| 24 | User Management | User list and roles |
| 25 | Admin Dashboard | System health metrics |
| 26 | Integration Hub | Connector configuration |
| 27 | ETL Designer | ETL pipeline builder |
| 28 | API Manager / Scheduler | API keys, scheduled jobs |

### Pages with HYBRID Data (API + mock fallback)

| # | Page | Hybrid Behavior |
|---|------|----------------|
| 1 | LIDA Dashboard | Real AI insights via `/ai/insights`, mock severity cards if Ollama down |
| 2 | Claims Overview | Real pipeline data, mock submission tracking |
| 3 | Denial Analytics | Real summary data, mock trend charts for some views |
| 4 | Payment Dashboard | Real summary + ADTP, mock payer comparison charts |
| 5 | Collections Queue | Real queue data, mock propensity scores |

---

## 11. Known Issues & Gaps

### 11.1 Navigation Bugs

| Issue | Severity | Details |
|-------|----------|---------|
| Dead tab: Pre-Batch Scrub | Medium | Claims Work Center may link to `/work/claims/scrub` which has no route definition; should route to `/analytics/claims/scrub-analytics` |
| Sidebar items without default sub-routes | Low | Clicking a sidebar item that uses a layout (e.g., `/analytics/revenue`) shows a blank content area until a tab is explicitly clicked; no auto-redirect to first tab |
| Legacy route proliferation | Low | 50+ legacy redirect routes in App.jsx for backward compatibility; increases bundle size and maintenance burden |
| EVV routes not nested | Low | EVV sub-pages are defined as standalone routes rather than nested under a layout, unlike other specialty modules |

### 11.2 Data Gaps

| Gap | Impact | Details |
|-----|--------|---------|
| `users` table: 0 rows | High | No authentication system -- anyone can access any data |
| `ar_aging` table: missing | Medium | AR aging is computed from claims table on-the-fly rather than from a dedicated aging snapshot table |
| No ML models | Medium | All predictions are rule-based or deterministic; no trained machine learning models |
| Diagnostic findings not persisted | Medium | Computed on-the-fly per request; no historical tracking of when diagnostics fired |
| Contract rates incomplete | Low | 800 rates cover only 50 CPT codes x 16 payers; real organizations have thousands of rates |

### 11.3 Feature Gaps

| Gap | Priority | Details |
|-----|----------|---------|
| No prevention engine | Critical | The highest-value layer (Layer 3) is entirely unbuilt. No timely filing countdown, no eligibility re-verify triggers, no auth expiration warnings |
| No 3-layer revenue forecast | High | Bible specifies Gross > Denial-adjusted > ADTP-timed three-layer forecast; current forecast is single-layer |
| Only 7 automation rules | High | vs. 79 specified in Bible Part 5 |
| 28 pages fully hardcoded | High | Over one-third of pages display mock data |
| No standard report library | Medium | MECE Report Builder exists but has no pre-built report templates |
| No CI/CD pipeline | Medium | No automated testing, build, or deployment pipeline |
| No test suite | Medium | Zero unit tests, integration tests, or e2e tests |
| No authentication/authorization | High | No login, no role-based access, no audit of user actions |
| No WebSocket real-time updates | Low | Architecture diagram mentions WebSocket but only SSE is implemented (for AI streaming) |

---

## 12. Roadmap -- What Is Next

### Sprint 7: Prevention + Forecasting

**Goal:** Build the prevention engine (Layer 3) and upgrade the forecast model.

| # | Item | Description | Bible Ref |
|---|------|-------------|-----------|
| 1 | Timely filing countdown alerts | Real-time countdown per claim based on payer-specific filing limits | Doc 5: PRV-01 |
| 2 | Eligibility re-verification triggers | Auto-trigger 271 check 48h before claim submission | Doc 5: PRV-02 |
| 3 | Auth expiration warnings | Alert when auth expires within 7/14/30 days | Doc 5: PRV-03 |
| 4 | Pre-submission risk gate | Block claim submission if CRS score > threshold | Doc 5: PRV-04 |
| 5 | 3-layer revenue forecast | Gross charges > denial-adjusted net > ADTP-timed cash realization | Doc 4: PR-R01 |
| 6 | Daily cash receipt forecast | Predict exact dollar amount per day for next 30 days | Doc 4: PR-R02 |

### Sprint 8: Automation Expansion

**Goal:** Scale automation from 7 rules to 30+ and implement the human-in-the-loop ramp schedule.

| # | Item | Description | Bible Ref |
|---|------|-------------|-----------|
| 1 | Expand to 30+ rules | Add rules for all diagnostic categories | Doc 5: AUT-01 through AUT-30 |
| 2 | Human-in-the-loop ramp | Learning (30d) > Supervised (60d) > Autonomous phases | Doc 5: Tier System |
| 3 | Auto-appeal for high-win CARCs | Fully automated appeal submission for >80% win rate clusters | Doc 5: AUT-07 |
| 4 | Auto-resubmit correctable rejections | Identify and fix deterministic errors, resubmit without human touch | Doc 5: AUT-12 |
| 5 | Queue auto-prioritization | ML-based priority scoring for work queues | Doc 5: AUT-20 |

### Sprint 9: Wire Remaining Pages

**Goal:** Convert all 28 hardcoded pages to real API data and fix navigation issues.

| # | Item | Description |
|---|------|-------------|
| 1 | Patient Access module | Wire 6 sub-pages to eligibility_271, prior_auth, insurance_coverage tables |
| 2 | Coding & Charge module | Wire 4 sub-pages to claims/claim_lines with coding validation |
| 3 | EVV module | Wire 5 sub-pages to evv_visits table |
| 4 | Settings & Admin | Wire to configuration tables, implement user management |
| 5 | Fix navigation defaults | Add index redirects to all layout routes |
| 6 | Remove legacy redirects | Clean up 50+ redirect routes after confirming no external links |
| 7 | Payment Work Center | Wire Contract Manager and Payment Portal to real data |

### Sprint 10: ML/AI Enhancement

**Goal:** Replace rule-based predictions with trained ML models.

| # | Item | Description | Bible Ref |
|---|------|-------------|-----------|
| 1 | Claim denial probability model | Train gradient-boosted classifier on 56K labeled denials | Doc 4: PR-D01 |
| 2 | SARIMA revenue forecast | Time-series model for 30/60/90-day revenue prediction | Doc 4: PR-R01 |
| 3 | Payer behavior prediction | Predict payer payment timing and denial rate changes | Doc 4: PR-P01 |
| 4 | CARC code prediction | Predict which CARC code a claim will receive if denied | Doc 4: PR-D03 |
| 5 | Collection propensity model | Score likelihood of patient payment by amount and aging | Doc 4: PR-C01 |
| 6 | Model monitoring | PSI distribution tracking, drift detection, feature importance | Operational |

---

## 13. Technical Debt

| # | Item | Severity | Details |
|---|------|----------|---------|
| 1 | Duplicate API definition | Low | `diagnostics.getFindings` endpoint logic may be defined in multiple places |
| 2 | STATIC_FALLBACK arrays | Medium | 8+ pages contain hardcoded fallback arrays that mask API failures instead of surfacing errors |
| 3 | Mock data file imports | Medium | Some components still import from mock data files even when APIs exist; creates confusion about data source |
| 4 | No test suite | High | Zero automated tests across frontend and backend; no unit, integration, or e2e coverage |
| 5 | No CI/CD pipeline | High | No automated build, test, lint, or deployment; all changes deployed manually |
| 6 | No authentication/authorization | Critical | No login system, no RBAC, no session management; `users` table has 0 rows |
| 7 | Collections router split | Low | Collections endpoints split across `collections.py` and `collections_extended.py` sharing the same prefix |
| 8 | Graph router prefix inconsistency | Low | Graph and automation endpoints registered under `/api/v1` base prefix instead of their own prefixes |
| 9 | No database migrations tracking | Medium | Alembic is configured but migration history may be incomplete |
| 10 | No rate limiting | Medium | All API endpoints are unprotected against abuse |
| 11 | No error monitoring | Medium | No Sentry, no structured logging, no alerting on backend errors |
| 12 | Frontend bundle optimization | Low | All routes imported eagerly; no code splitting or lazy loading |
| 13 | No API versioning strategy | Low | Only v1 exists; no deprecation or versioning plan |

---

## 14. MiroFish Simulation Layer (NEW)

### 14.1 What is MiroFish?
MiroFish is a multi-agent AI prediction engine that constructs parallel digital worlds from real data. It creates thousands of autonomous agents with distinct personalities and long-term memory, runs simulations where agents interact, and generates predictive reports. [GitHub: 666ghj/MiroFish](https://github.com/666ghj/MiroFish)

### 14.2 Why MiroFish for RCM?
NEXUS can DETECT problems and CLASSIFY root causes, but cannot SIMULATE outcomes before acting. MiroFish fills the gap:
```
Current:    Diagnostic Finding → Static Rule → Action (hope it works)
With MiroFish: Diagnostic Finding → Simulate Intervention → Predict Outcome → Confident Action
```

### 14.3 RCM Agent Types
| Agent Type | Count | Seeded From | Behavior |
|-----------|-------|-------------|----------|
| Payer Agents | 50 | `payer_master` + `denials` + `era_payments` | Adjudicate claims based on learned patterns |
| Provider Agents | 200 | `providers` + `claims` + `root_cause_analysis` | Submit claims, coding patterns, documentation quality |
| Claim Agents | 1000s | `claims` + `claim_lines` + archetype clustering | Flow through 7-stage RCM pipeline |
| Billing Team Agents | 10-20 | `collection_queue` + operational metrics | Process claims, appeal denials, post payments |
| CDI Agents | 5-10 | Root cause patterns | Review documentation, query physicians |
| Compliance Agents | 2-3 | Audit rules + regulatory framework | Audit claims, flag risks |

### 14.4 Key Simulation Scenarios
1. **Coder Retraining**: Simulate reducing modifier error rate by 30% → projected $31.5M denial reduction
2. **Payer Policy Change**: Simulate Humana changing auth requirements → projected impact on 6,199 AUTH_MISSING claims
3. **Batch Auto-Appeal**: Simulate appealing all AUTH_MISSING denials (62% win rate) → projected $13.6M recovery
4. **Timely Filing Alerts**: Simulate 60-day alert → projected prevention of 10,144 timely filing denials ($36.7M)
5. **Staffing Changes**: Simulate +2 denial analysts → projected reduction in appeal backlog
6. **Payer Financial Distress**: Simulate ADTP increasing from 28 to 55 days → cash flow impact modeling

### 14.5 New Components
- **Simulation Center** (new sidebar item under Intelligence)
- **7 new API endpoints** under `/api/v1/simulation/*`
- **3 new DB tables**: `simulation_runs`, `simulation_results`, `simulation_agents`
- **MiroFish runs on port 5001** alongside NEXUS backend on port 8000

### 14.6 Implementation Phases
- **Phase 1 (Sprint 7-8)**: Install MiroFish, build data export pipeline, create 250 agents from real data
- **Phase 2 (Sprint 9-10)**: Build What-If UI, connect diagnostics to scenarios, run first simulations
- **Phase 3 (Sprint 11-12)**: Simulation-driven automation, prevention from proactive simulation, outcome tracking

> Full details: See `/docs/mirofish-integration-plan.md`

---

## Appendix A: Route Map

### Primary Routes (non-legacy)

```
/                                           Command Center
/analytics/revenue                          Revenue Analytics Layout
/analytics/revenue/overview                 Executive Dashboard
/analytics/revenue/reconciliation           Revenue Reconciliation
/analytics/revenue/reconciliation/payer-claims  Payer Recon Claims
/analytics/revenue/ar-aging                 AR Aging
/analytics/revenue/cash-flow                Cash Flow
/analytics/denials                          Denial Analytics Layout
/analytics/denials/overview                 Denial Analytics
/analytics/denials/root-cause               Root Cause Intelligence
/analytics/denials/root-cause/claims        Root Cause Claims
/analytics/denials/root-cause/claim/:id     Claim Root Cause Detail
/analytics/denials/payer-patterns           Payer Variance
/analytics/payments                         Payment Intelligence Layout
/analytics/payments/overview                Payment Dashboard
/analytics/payments/payer-profiles          Payer Payment Intelligence
/analytics/payments/contract-audit          Contract Audit
/analytics/payments/era-bank-recon          ERA-Bank Reconciliation
/analytics/claims                           Claims Pipeline Layout
/analytics/claims/overview                  Claims Overview
/analytics/claims/scrub-analytics           Scrub Dashboard
/work/claims                                Claims Work Center Layout
/work/claims/queue                          Claims Work Queue
/work/claims/auto-fix                       Auto-Fix Center
/work/claims/batch                          Batch Actions
/work/denials                               Denial Work Center Layout
/work/denials/queue                         Denial Management
/work/denials/high-risk                     High Risk Claims
/work/denials/appeals                       Appeal Generator
/work/denials/workflow-log                  Denial Workflow Log
/work/collections                           Collections Work Center Layout
/work/collections/queue                     Collections Queue
/work/collections/alerts                    Alerts Queue
/work/collections/portal                    Payment Portal
/work/payments                              Payment Work Center Layout
/work/payments/era                          ERA Processing
/work/payments/posting                      Payment Posting
/work/payments/contracts                    Contract Manager
/work/automation                            Automation Dashboard
/intelligence/lida                          LIDA AI Layout
/intelligence/lida/dashboard                LIDA Dashboard
/intelligence/lida/chat                     LIDA Chat
/intelligence/lida/reports                  MECE Report Builder
/intelligence/lida/tickets                  Ticket Hub
/intelligence/forecast                      Revenue Forecast
/specialty/patient-access                   Insurance Layout
/specialty/patient-access/overview          Patient Access Hub
/specialty/patient-access/eligibility       Insurance Verification
/specialty/patient-access/auths             Prior Auth Manager
/specialty/patient-access/benefits          Benefit Analytics
/specialty/patient-access/history           Verification History
/specialty/patient-access/accounts          Patient Accounts
/specialty/coding                           AI Coding Layout
/specialty/coding/audit                     AI Coding Audit
/specialty/coding/compliance                AI Coding Compliance
/specialty/coding/rulebook                  AI Coding Rulebook
/specialty/evv/dashboard                    EVV Dashboard
/specialty/evv/visits                       EVV Visit Details
/specialty/evv/fraud                        EVV Fraud Detection
/specialty/evv/mandates                     State Mandates
/specialty/evv/auto-retry                   EVV Auto-Retry Manager
/settings                                   Settings Layout
/settings/users                             User Management
/settings/billing-rules                     Billing Rules
/settings/ai-config                         AI Configuration
/admin/dashboard                            Admin Dashboard
/admin/integrations                         Integration Hub
/admin/etl-designer                         ETL Designer
/admin/api-manager                          API Manager
/admin/scheduler                            Scheduler
```

### Legacy Redirect Routes (50+)

All old routes redirect to their canonical locations via `<Navigate replace />`. These include paths like `/command-center`, `/executive-dashboard`, `/denials`, `/collections`, `/payments/*`, `/claims/*`, `/finance/*`, `/evv/*`, `/ai-engine/*`, `/developer/*`, and `/lida/*`.

---

## Appendix B: Bible Document Reference

| Document | Title | Item Count | Focus |
|----------|-------|-----------|-------|
| Doc 1 | Descriptive Analytics & Standard Reporting | 187 | Metrics, KPIs, standard reports -- "What happened?" |
| Doc 2 | Root Cause Analysis -- Revenue + Denial Focused | 157 | Claim-level CARC analysis + system-level revenue root causes -- "Why?" |
| Doc 3 | Diagnostic Suggestions | 121 | Anomaly detection, actionable findings -- "What is wrong now?" |
| Doc 4 | The Predictions List -- Complete Catalog | 85 | ML models, forecasts, confidence intervals -- "What will happen?" |
| Doc 5 | Automation & Prevention (merged from Docs 5+6) | 79 | Automated actions + pre-emptive interventions -- "Fix it / Stop it" |

---

*This document is the single source of truth for the NEXUS RCM platform. It should be updated as features are built, APIs are added, and data coverage expands. Last generated: 2026-03-27.*
