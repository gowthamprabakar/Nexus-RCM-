# NEXUS RCM - Revenue Intelligence Platform
## Product Requirements Document (PRD)

| Field | Detail |
|-------|--------|
| **Product Name** | NEXUS RCM - Revenue Intelligence Platform |
| **Version** | 3.0.0 |
| **Date** | March 27, 2026 |
| **Authors** | Marcus Chen (RCM SME), James Park (PM), Priya Sharma (Architecture), Sarah Kim (BA), Alex Rivera (Dev) |
| **Status** | Active Development - Sprint 7 |
| **Classification** | Confidential |

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Core Principles](#3-core-principles)
4. [Feature Inventory](#4-feature-inventory)
5. [Data Model](#5-data-model)
6. [API Inventory](#6-api-inventory)
7. [Gaps and Unbuilt Capabilities](#7-gaps-and-unbuilt-capabilities)
8. [Sprint Roadmap](#8-sprint-roadmap)
9. [Success Metrics](#9-success-metrics)
10. [Appendices](#10-appendices)

---

## 1. Product Overview

### 1.1 Vision

NEXUS RCM is an AI-powered end-to-end revenue cycle management platform that transforms healthcare billing from reactive claim processing into predictive revenue intelligence. The platform unifies descriptive analytics, root cause analysis, diagnostic suggestions, predictive modeling, and automated prevention into a single, claim-connected graph that empowers every stakeholder from billing analysts to CFOs.

### 1.2 Problem Statement

Healthcare revenue cycle management today is fragmented, manual, and reactive. Organizations lose 3-5% of net revenue to preventable denials, underpayments, and operational inefficiency. The industry relies on siloed dashboards that show *what happened* but never explain *why* or *what to do about it*. Denial analysts work claims one at a time without systemic root cause visibility. CFOs forecast revenue using spreadsheets disconnected from operational reality. Prevention is an aspiration, not a capability.

### 1.3 Target Users

| Persona | Primary Needs | Key Platform Touchpoints |
|---------|--------------|--------------------------|
| **RCM Director** | Operational oversight, KPI tracking, staff productivity | Command Center, Automation Dashboard, Revenue Analytics |
| **Billing Manager** | Claim submission quality, rejection reduction, batch management | Claims Work Center, Claims Pipeline, CRS Scoring |
| **Denial Analyst** | Denial investigation, appeal generation, root cause understanding | Denial Work Center, Root Cause Intelligence, Appeal Generator |
| **Collections Specialist** | AR follow-up prioritization, payer contact optimization | Collections Work Center, Propensity Scoring, Call Scripts |
| **CFO / Finance Leader** | Revenue forecasting, cash flow visibility, payer contract performance | Revenue Analytics, Revenue Forecast, Payment Intelligence |
| **Coding Manager** | Coding accuracy, compliance monitoring, CDI performance | Coding & Charge module, AI Coding Audit |
| **Patient Access Staff** | Eligibility verification, prior authorization, benefit confirmation | Patient Access Hub, Insurance Verification |

### 1.4 Value Proposition

**From reactive billing to predictive revenue intelligence.**

| Capability Layer | Without NEXUS | With NEXUS |
|-----------------|---------------|------------|
| **Descriptive** | Scattered dashboards, manual Excel reports | Unified Command Center with 100+ live KPIs connected to claim-level truth |
| **Diagnostic** | Analysts investigate manually, rely on tribal knowledge | AI-driven root cause engine with 7-step Bayesian analysis on every denial |
| **Predictive** | Spreadsheet-based revenue forecasts | ML-powered 30/60/90-day revenue forecasting with confidence intervals |
| **Automated** | Manual claim corrections, hand-written appeals | Rule-based automation with tiered human-in-the-loop approval workflow |
| **Preventive** | Zero prevention capability | Pre-submission risk scoring (CRS), payer-specific scrub rules, trend-based alerts |

### 1.5 Competitive Differentiation

1. **Claim-Level Graph Connectivity**: Every metric, root cause, diagnostic, prediction, and automation traces through `claim_id` to the individual claim. No aggregation-only analytics.
2. **Bayesian Root Cause Engine**: Zero-prior 7-step analysis that decomposes every denial into fault percentages (coder error, payer policy, documentation gap, billing rule, bad faith) without pre-trained bias.
3. **Three-Layer Architecture**: Analytics, Automation, and Prevention are not add-ons but structural layers where each feeds the next.
4. **MiroFish Multi-Agent Simulation**: Scenario testing for automation rules and payer behavior through parallel-world simulation -- a capability no competing RCM platform offers.
5. **Evidence-Based AI**: Every AI-generated insight includes the evidence chain (data points, thresholds, comparisons) that produced it. No black-box recommendations.

---

## 2. Architecture

### 2.1 Three-Layer Model

```
+------------------------------------------------------------------+
|                     LAYER 3: PREVENTION                          |
|  Pre-submission risk scoring | Payer-specific scrub rules        |
|  Trend-based alerts | Policy change monitoring                   |
|  "Stop the problem before it exists"                             |
+------------------------------------------------------------------+
          |                    |                    |
+------------------------------------------------------------------+
|                     LAYER 2: AUTOMATION                          |
|  Auto-scrub | Auto-fix | Appeal generation | Queue prioritization |
|  COB coordination | Batch submission | Resubmission engine       |
|  "Fix known problems faster than humans"                         |
+------------------------------------------------------------------+
          |                    |                    |
+------------------------------------------------------------------+
|                     LAYER 1: ANALYTICS                           |
|  Descriptive (What happened?) | Root Cause (Why?)                |
|  Diagnostic (What's wrong now?) | Predictive (What will happen?) |
|  "Understand everything, miss nothing"                           |
+------------------------------------------------------------------+
          |                    |                    |
+------------------------------------------------------------------+
|                     DATA FOUNDATION                              |
|  500K Claims | 56K Denials | 315K ERAs | 2,797 Bank Recon       |
|  800 Contract Rates | 50 Payers | 22 PostgreSQL Tables           |
|  Graph Connectivity via claim_id                                  |
+------------------------------------------------------------------+
```

### 2.2 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend API** | FastAPI (Python) | REST API server, 75+ endpoints across 15 routers |
| **Frontend** | React 18 + Vite + Tailwind CSS | Single-page application with 60+ pages |
| **Database** | PostgreSQL | 22-table relational data model, 500K+ claims |
| **AI / LLM** | Ollama (llama3, local) | Descriptive insights, diagnostic narratives, appeal drafts, call scripts |
| **Root Cause Engine** | Custom Bayesian (Python) | Zero-prior 7-step root cause decomposition |
| **CRS Engine** | Custom scoring (Python) | 6-component claim risk assessment |
| **Automation Engine** | Rule-based (Python) | 7 initial rules with approve/reject workflow |
| **Simulation** | MiroFish (multi-agent) | Parallel-world scenario testing and prediction |
| **Charting** | Recharts | Data visualization across all analytics pages |

### 2.3 Data Flow

```
Patient Encounter
       |
       v
  Charge Capture --> Coding --> CRS Scoring --> Scrub Queue
       |                                            |
       v                                            v
  Claim Submission -----> Clearinghouse -----> Payer Adjudication
       |                                            |
       v                                            v
  277CA Response                              ERA / Remittance
  (Rejections)                                      |
       |                              +-------------+-------------+
       v                              v                           v
  Rejection Queue              Payment Posting           Denial Queue
       |                              |                           |
       v                              v                           v
  Correction &                Bank Reconciliation        Root Cause Engine
  Resubmission                      |                           |
       |                              v                           v
       +-------> Revenue Analytics <--+      Diagnostic Engine
                      |                           |
                      v                           v
               Revenue Forecast           Automation Engine
                      |                           |
                      v                           v
               Cash Flow Projection       Prevention Rules
```

### 2.4 Graph Connectivity

Everything in NEXUS traces through `claim_id`. This is not a design preference; it is a structural requirement.

```
claim_id --> denial record --> CARC/RARC codes --> root cause decomposition
claim_id --> ERA payment --> payment posting --> bank reconciliation
claim_id --> CRS score --> risk components --> scrub actions
claim_id --> automation rule match --> action taken --> outcome
claim_id --> payer --> contract rate --> expected vs. actual payment
```

This graph enables 5-level drill-down from any aggregate metric to the individual claim, with full evidence chain at every level.

---

## 3. Core Principles

These seven principles form the constitutional foundation of NEXUS RCM. Every feature, design decision, and prioritization is measured against them.

### Principle 1: Claim-Level Truth

Every metric must be decomposable to the individual claim. If a dashboard shows a 12% denial rate, the user must be able to click through to the exact claims that compose that number. Aggregation without decomposition is a lie by omission.

### Principle 2: Three-Layer Architecture

The platform is structured as Analytics, Automation, and Prevention -- in that order of dependency. Analytics produces understanding. Automation acts on that understanding. Prevention uses both to eliminate future problems. No layer can function without the one below it.

### Principle 3: Graph Connectivity

Every entity in the system connects through `claim_id`. A denial connects to its ERA, which connects to its bank reconciliation, which connects to its contract rate, which connects to its root cause. Breaking graph connectivity breaks the platform.

### Principle 4: AI With Evidence

Every AI-generated insight must include the data points, thresholds, and comparisons that produced it. "Denial rate is high" is not acceptable. "Denial rate for UHC increased from 8.2% to 14.7% over 90 days, driven by CO-16 (lack of authorization) which accounts for 62% of new denials" is the standard. The user must be able to verify any AI statement against the underlying data.

### Principle 5: One Voice Per Page

Each page serves one analytical question. Revenue Analytics answers "How is revenue performing?" Denial Analytics answers "What is happening with denials?" No page tries to answer multiple unrelated questions. Cross-referencing happens through graph drill-down, not page bloat.

### Principle 6: Contextual Not Navigational

When a user needs more detail, the detail appears in context (side panels, drill-down overlays, expandable sections) rather than navigating to a separate page. Navigation is for switching contexts. Investigation stays in context.

### Principle 7: Real Data Only

No mock data in production views. No placeholder charts. No hardcoded numbers. If a feature cannot display real data from the database, it displays a clear "No Data Available" state with guidance on what data is needed. Misleading the user with fabricated metrics is the worst possible UX failure.

---

## 4. Feature Inventory

### 4.1 Analytics Layer

#### 4.1.1 Command Center (`/`)

The operational nerve center of NEXUS RCM. Provides at-a-glance KPIs, trend indicators, and a contextual investigation panel.

| Component | Description |
|-----------|-------------|
| Live KPI Cards | Total revenue, denial rate, clean claim rate, AR days, net collection rate |
| Trend Indicators | Directional arrows with period-over-period delta |
| Investigation Panel | Slide-out panel triggered by clicking any KPI, showing root cause decomposition |
| Alert Feed | Real-time diagnostic alerts from the detection engine |
| Quick Actions | Direct links to highest-priority work items |

#### 4.1.2 Revenue Analytics (`/analytics/revenue`)

Four-tab layout covering the complete revenue picture.

| Tab | Route | Description |
|-----|-------|-------------|
| **Overview** | `/analytics/revenue/overview` | Executive dashboard with gross/net revenue, collection rates, revenue trends, payer mix |
| **Reconciliation** | `/analytics/revenue/reconciliation` | ERA-to-bank reconciliation, contractual adjustment analysis, variance identification |
| **AR Aging** | `/analytics/revenue/ar-aging` | Aging buckets (0-30, 31-60, 61-90, 91-120, 120+), payer-level aging, aging velocity |
| **Cash Flow** | `/analytics/revenue/cash-flow` | Daily/weekly cash receipts, cash forecast variance, days cash on hand |

#### 4.1.3 Denial Analytics (`/analytics/denials`)

Four-tab layout for denial investigation and pattern recognition.

| Tab | Route | Description |
|-----|-------|-------------|
| **Overview** | `/analytics/denials/overview` | Denial rate trends, top CARC codes, denial volume by payer, recovery rates |
| **Root Cause** | `/analytics/denials/root-cause` | Bayesian root cause decomposition, fault distribution, systemic pattern identification |
| **Payer Patterns** | `/analytics/denials/payer-patterns` | Payer-specific denial behavior, variance analysis, policy change detection |
| **Trends** | *(planned)* | Time-series denial trends, seasonal patterns, early warning signals |

**Root Cause Drill-Down (5 Levels)**:
1. System-wide denial overview
2. Root cause category (e.g., "Eligibility Issues")
3. Specific root cause (e.g., "CO-27: Expenses incurred after coverage terminated")
4. Payer-level breakdown within that root cause
5. Individual claim detail with full evidence chain

#### 4.1.4 Payment Intelligence (`/analytics/payments`)

Four-tab layout for payment analysis and payer performance.

| Tab | Route | Description |
|-----|-------|-------------|
| **Overview** | `/analytics/payments/overview` | Payment dashboard, ADTP monitor, payment trends |
| **Payer Profiles** | `/analytics/payments/payer-profiles` | Per-payer payment behavior, ADTP, denial rates, underpayment rates |
| **Contract Audit** | `/analytics/payments/contract-audit` | Expected vs. actual reimbursement, contract compliance, underpayment detection |
| **ERA-Bank Recon** | `/analytics/payments/era-bank-recon` | ERA payment matching to bank deposits, gap identification, batch reconciliation |

#### 4.1.5 Claims Pipeline (`/analytics/claims`)

| Tab | Route | Description |
|-----|-------|-------------|
| **Overview** | `/analytics/claims/overview` | 7-stage pipeline visualization, volume metrics, status distribution |
| **Scrub Analytics** | `/analytics/claims/scrub-analytics` | CRS score distribution, pass/fail rates, component-level analysis |

### 4.2 Work Centers

#### 4.2.1 Claims Work Center (`/work/claims`)

| Tab | Route | Description |
|-----|-------|-------------|
| **Queue** | `/work/claims/queue` | Prioritized work queue with CRS-based risk ranking, filters, bulk actions |
| **Auto-Fix** | `/work/claims/auto-fix` | Claims with deterministic corrections applied; review and approve center |
| **Batch** | `/work/claims/batch` | Batch submission management, batch status tracking, submission scheduling |

#### 4.2.2 Denial Work Center (`/work/denials`)

| Tab | Route | Description |
|-----|-------|-------------|
| **Queue** | `/work/denials/queue` | Denial work queue with AI-prioritized ranking, root cause tags, age indicators |
| **High Risk** | `/work/denials/high-risk` | Claims flagged as high denial risk by CRS engine, pre-emptive intervention |
| **Appeals** | `/work/denials/appeals` | AI-generated appeal letter drafts with evidence attachment, approval workflow |
| **Workflow Log** | `/work/denials/workflow-log` | Audit trail of all denial actions, status transitions, outcome tracking |

#### 4.2.3 Collections Work Center (`/work/collections`)

| Tab | Route | Description |
|-----|-------|-------------|
| **Queue** | `/work/collections/queue` | AR follow-up queue ranked by propensity-to-pay scoring |
| **Alerts** | `/work/collections/alerts` | Time-sensitive collection alerts (approaching timely filing, high-value aging) |
| **Portal** | `/work/collections/portal` | Patient payment portal integration, statement management |

#### 4.2.4 Payment Work Center (`/work/payments`)

| Tab | Route | Description |
|-----|-------|-------------|
| **ERA Processing** | `/work/payments/era` | Incoming ERA/EOB processing, parsing, matching |
| **Payment Posting** | `/work/payments/posting` | Payment posting workflow, adjustment handling, batch posting |
| **Contracts** | `/work/payments/contracts` | Contract rate management, fee schedule loading, rate comparison |

#### 4.2.5 Automation Dashboard (`/work/automation`)

Central control panel for all automation rules across the platform.

| Component | Description |
|-----------|-------------|
| Rule Inventory | All active/inactive automation rules with performance metrics |
| Approval Queue | Pending automation actions requiring human approval (Tier 2/3) |
| Audit Log | Complete history of automated actions with outcomes |
| Performance Metrics | Automation accuracy, time saved, revenue impact |
| Rule Builder | Interface for creating and testing new automation rules |

### 4.3 Intelligence

#### 4.3.1 LIDA AI (`/intelligence/lida`)

Conversational AI interface powered by Ollama (llama3).

| Tab | Route | Description |
|-----|-------|-------------|
| **Dashboard** | `/intelligence/lida/dashboard` | AI insight summary, trending diagnostics, recommended investigations |
| **Chat** | `/intelligence/lida/chat` | Natural language Q&A against RCM data ("Why did UHC denials spike in February?") |
| **Reports** | `/intelligence/lida/reports` | MECE-structured report builder with AI-generated narrative |
| **Tickets** | `/intelligence/lida/tickets` | AI-generated investigation tickets linked to diagnostics |

#### 4.3.2 Revenue Forecast (`/intelligence/forecast`)

Predictive revenue modeling with confidence intervals.

| Component | Description |
|-----------|-------------|
| 30/60/90 Day Forecast | Net revenue projections with 10th/50th/90th percentile bands |
| Cash Flow Projection | Weekly cash receipt predictions |
| Revenue at Risk | Dollar quantification of revenue threatened by current denial trends |
| Scenario Modeling | What-if analysis for payer mix changes, denial rate shifts |

#### 4.3.3 Root Cause Investigation Panel

Contextual panel available from any analytics page. Triggered by clicking a metric or data point.

| Component | Description |
|-----------|-------------|
| Bayesian Decomposition | 7-step analysis showing fault distribution |
| Evidence Chain | Data points supporting each root cause finding |
| Action Recommendations | Specific next steps ranked by revenue impact |
| Historical Comparison | How this root cause has trended over time |

### 4.4 Specialty Modules

#### 4.4.1 Patient Access (`/specialty/patient-access`)

| Tab | Route | Description |
|-----|-------|-------------|
| **Overview** | `/specialty/patient-access/overview` | Patient access KPIs, verification rates, auth status |
| **Eligibility** | `/specialty/patient-access/eligibility` | Real-time insurance verification |
| **Authorizations** | `/specialty/patient-access/auths` | Prior authorization management |
| **Benefits** | `/specialty/patient-access/benefits` | Benefit analytics and coverage analysis |
| **History** | `/specialty/patient-access/history` | Verification audit trail |
| **Accounts** | `/specialty/patient-access/accounts` | Patient account management |

#### 4.4.2 Coding & Charge (`/specialty/coding`)

| Tab | Route | Description |
|-----|-------|-------------|
| **Optimizer** | `/specialty/coding` | AI-assisted coding optimization |
| **Audit** | `/specialty/coding/audit` | AI coding audit with accuracy scoring |
| **Compliance** | `/specialty/coding/compliance` | Compliance monitoring and alerts |
| **Rulebook** | `/specialty/coding/rulebook` | Coding rule reference and payer-specific rules |

#### 4.4.3 EVV Home Health (`/specialty/evv`)

| Tab | Route | Description |
|-----|-------|-------------|
| **Dashboard** | `/specialty/evv/dashboard` | EVV compliance overview |
| **Visits** | `/specialty/evv/visits` | Visit detail management |
| **Fraud Detection** | `/specialty/evv/fraud` | EVV fraud pattern detection |
| **Mandates** | `/specialty/evv/mandates` | State-specific mandate tracking |
| **Auto-Retry** | `/specialty/evv/auto-retry` | Automated EVV denial retry management |

### 4.5 AI Engines

#### 4.5.1 Ollama LLM Engine (llama3)

Local LLM providing natural language capabilities across the platform.

| Capability | Description |
|-----------|-------------|
| Descriptive Insights | Natural language summaries of KPIs and trends |
| Diagnostic Narratives | Plain-English explanations of diagnostic findings |
| Appeal Letter Drafts | AI-generated appeal letters with clinical evidence integration |
| Call Scripts | Payer-specific collection call scripts with talking points |
| Chat Q&A | Conversational queries against RCM data |

#### 4.5.2 Root Cause Engine

Custom Bayesian analysis engine performing zero-prior 7-step decomposition on every denial.

| Step | Description |
|------|-------------|
| 1 | CARC/RARC code identification and literal meaning |
| 2 | Historical pattern matching against 20-year experience database |
| 3 | Fault decomposition: coder error, payer policy, documentation gap, billing rule, bad faith |
| 4 | Revenue impact calculation (denied amount, recovery rate, cost to recover) |
| 5 | Payer-specific behavior analysis |
| 6 | Systemic pattern identification across denial population |
| 7 | Resolution path generation with prevention recommendations |

**Current Performance**: Analysis completed on all 56,000 denials. 60.5% disagreement rate between payer-stated reason and actual root cause, validating the need for independent root cause analysis.

#### 4.5.3 Diagnostic Engine

Real-time anomaly detection across 5 categories.

| Category | Example Diagnostics |
|----------|-------------------|
| Revenue Health | Revenue trend deviation, payer mix shift, CMI erosion, charge capture gaps |
| Denial Patterns | Denial rate spikes, new CARC emergence, payer policy changes |
| Payment Anomalies | ADTP increases, underpayment patterns, ERA-bank gaps |
| Claims Quality | CRS score degradation, clean claim rate decline, rejection spikes |
| Operational | Staff productivity anomalies, queue aging, SLA breaches |

Each diagnostic includes: detection methodology, severity level (Critical/Warning/Info), recommended action, revenue impact if unaddressed, and connected root causes.

#### 4.5.4 Automation Engine

Rule-based automation with tiered human-in-the-loop controls.

| Tier | Description | Human Involvement |
|------|------------|-------------------|
| **Tier 1: Full Auto** | System acts autonomously | None (logged for audit) |
| **Tier 2: Auto-Draft + Approve** | System prepares, human approves | 1-click approval |
| **Tier 3: Auto-Alert + Decide** | System recommends, human decides | Full decision |
| **Tier 4: Human-Only** | System surfaces info | Full human action |

**Human-in-the-Loop Ramp**: Learning (days 1-30, all actions need approval) --> Supervised (days 31-90, low-risk auto-executes) --> Autonomous (day 91+, within confidence threshold).

Current rules: 7 active automation rules covering pre-submission scrub, auto-fix, queue prioritization, eligibility re-check, modifier validation, COB coordination, and resubmission triggering.

#### 4.5.5 CRS (Claim Risk Score) Engine

6-component risk assessment applied to every claim before submission.

| Component | Weight | What It Assesses |
|-----------|--------|-----------------|
| Eligibility | Variable | Insurance coverage status, effective dates, plan active |
| Authorization | Variable | Prior auth requirements met, auth number valid |
| Coding | Variable | CPT-ICD linkage, modifier validity, NCCI compliance |
| COB | Variable | Coordination of benefits accuracy, primary/secondary order |
| Documentation | Variable | Supporting documentation completeness |
| EVV | Variable | Electronic visit verification compliance (home health) |

Score range: 0-10 (0 = lowest risk, 10 = highest risk). Claims scoring 7+ are flagged for pre-submission review.

### 4.6 MiroFish Integration

MiroFish is a multi-agent simulation engine that constructs parallel digital worlds from seed information, enabling scenario testing and predictive analysis through agent-based modeling.

#### Integration Points with NEXUS RCM

| Capability | RCM Application |
|-----------|-----------------|
| **Graph Construction** | Build knowledge graphs from RCM data (payer behavior, denial patterns, claim flows) as simulation seeds |
| **Agent Configuration** | Create payer agents with realistic behavioral profiles based on historical claims data |
| **Parallel Simulation** | Run thousands of simulated claim adjudications to predict outcomes |
| **Variable Injection** | Test "what-if" scenarios: new automation rules, payer policy changes, coding guideline updates |
| **Report Generation** | AI-generated prediction reports from simulation outcomes |
| **Deep Interaction** | Query individual payer agents about decision rationale |

#### Use Cases

1. **Automation Rule Testing**: Before deploying a new automation rule to production, simulate its impact across 10,000 claims to predict accuracy, revenue impact, and edge cases.
2. **Payer Behavior Modeling**: Create digital twins of payer adjudication systems to predict denial patterns for new service lines or contract terms.
3. **Revenue Impact Forecasting**: Simulate revenue outcomes under different scenarios (payer mix shifts, denial rate changes, staffing changes).
4. **Policy Change Simulation**: When a payer announces a policy change, simulate the impact before it takes effect to pre-position the organization.

---

## 5. Data Model

### 5.1 Database Overview

| Attribute | Value |
|-----------|-------|
| Database | PostgreSQL |
| Total Tables | 22 |
| Total Claims | ~500,000 |
| Total Denials | ~56,000 |
| Total ERA Payments | ~315,000 |
| Total Payers | 50 |
| Contract Rates | 800 |
| Bank Reconciliation Records | 2,797 |
| Root Cause Analyses | 56,000 (100% of denials) |

### 5.2 Core Tables

| Table | Purpose | Key Columns | Row Count |
|-------|---------|-------------|-----------|
| `claims` | Master claim records | claim_id, payer_id, total_charges, status, crs_score, submission_date | ~500K |
| `denials` | Denied claim details | denial_id, claim_id, carc_code, rarc_code, denied_amount, root_cause_category | ~56K |
| `era_payments` | Electronic remittance advice | era_id, claim_id, paid_amount, adjustment_codes, posting_date | ~315K |
| `payers` | Payer master | payer_id, payer_name, payer_type, avg_adtp | 50 |
| `contract_rates` | Contracted reimbursement rates | rate_id, payer_id, cpt_code, contracted_rate, effective_date | 800 |
| `bank_reconciliation` | Bank deposit records | recon_id, deposit_date, deposit_amount, era_batch_id, variance | ~2,800 |
| `root_cause_analysis` | Bayesian decomposition results | rca_id, denial_id, category, coder_pct, payer_pct, doc_pct, billing_pct, bad_faith_pct | ~56K |
| `automation_rules` | Rule definitions | rule_id, rule_name, trigger_condition, action, tier, confidence_threshold | 7 |
| `automation_log` | Execution audit trail | log_id, rule_id, claim_id, action_taken, outcome, timestamp | Growing |
| `crs_scores` | Claim risk assessments | score_id, claim_id, total_score, eligibility, auth, coding, cob, documentation, evv | ~500K |
| `diagnostics` | Active diagnostic alerts | diag_id, type, severity, description, revenue_impact, status | Growing |

### 5.3 Root Cause Categories

Analysis of all 56,000 denials yielded 7 primary root cause categories:

| Category | % of Denials | Key Finding |
|----------|-------------|-------------|
| Registration/Eligibility | ~25% | Highest volume; most preventable at patient access |
| Coding/Billing | ~22% | Modifier errors and DX-CPT mismatches dominate |
| Authorization | ~18% | Missing or expired auths; systemic process failure |
| Medical Necessity | ~12% | Documentation gaps more than clinical appropriateness |
| Payer Policy | ~10% | Payer-specific rules not in scrubber; proprietary edits |
| Timely Filing | ~8% | Process breakdowns, not calendar ignorance |
| Coordination of Benefits | ~5% | Primary/secondary order errors; stale COB data |

**Critical Finding**: 60.5% of denials have a root cause that disagrees with the payer's stated CARC reason. This means the payer's reason code alone is insufficient for systematic prevention -- independent root cause analysis is essential.

---

## 6. API Inventory

### 6.1 Overview

| Attribute | Value |
|-----------|-------|
| Total Endpoints | 75+ |
| Total Routers | 15 |
| Framework | FastAPI |
| Authentication | *(to be implemented)* |
| Documentation | Auto-generated via Swagger/OpenAPI |

### 6.2 Router Catalog

| Router | Prefix | Endpoints | Description |
|--------|--------|-----------|-------------|
| Claims | `/api/claims` | 8+ | CRUD, search, pipeline metrics, CRS scores |
| Denials | `/api/denials` | 10+ | Denial records, root cause, CARC analysis, trends |
| Payments | `/api/payments` | 8+ | ERA processing, payment posting, payer performance |
| Revenue | `/api/revenue` | 6+ | Revenue metrics, reconciliation, cash flow |
| Analytics | `/api/analytics` | 8+ | Cross-domain analytics, KPIs, trend calculations |
| Root Cause | `/api/root-cause` | 6+ | Bayesian analysis, category breakdown, claim-level detail |
| Automation | `/api/automation` | 8+ | Rules CRUD, evaluate, approve/reject, audit log |
| Collections | `/api/collections` | 6+ | Queue, propensity scoring, account details |
| Payers | `/api/payers` | 5+ | Payer profiles, ADTP, contract compliance |
| Graph | `/api/graph` | 5+ | 5-level drill-down, claim connectivity, evidence chain |
| AI/Ollama | `/api/ai` | 6+ | Insight generation, appeal drafts, call scripts, chat |
| Diagnostics | `/api/diagnostics` | 4+ | Active alerts, severity filtering, acknowledgment |
| Forecast | `/api/forecast` | 4+ | Revenue projections, cash flow forecast, scenario input |
| Insurance | `/api/insurance` | 5+ | Eligibility verification, auth management, benefits |
| EVV | `/api/evv` | 4+ | Visit records, compliance, fraud detection |

### 6.3 Key AI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/insight` | POST | Generate natural language insight for a given metric or entity |
| `/api/ai/appeal-draft` | POST | Generate appeal letter for a specific denied claim |
| `/api/ai/call-script` | POST | Generate payer-specific collection call script |
| `/api/ai/chat` | POST | Conversational Q&A against RCM data |
| `/api/ai/diagnostic-narrative` | POST | Plain-English explanation of a diagnostic finding |

### 6.4 Key Graph Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/graph/drill-down` | GET | 5-level hierarchical drill-down from any metric |
| `/api/graph/claim/{claim_id}` | GET | Full graph for a specific claim (denial, ERA, recon, root cause) |
| `/api/graph/evidence-chain/{entity_id}` | GET | Complete evidence chain for any entity |

---

## 7. Gaps and Unbuilt Capabilities

### 7.1 Critical Gaps

| Gap | Impact | Current State | Target State |
|-----|--------|---------------|--------------|
| **ML Predictive Models** | Cannot produce statistically valid forecasts | 0 trained models; forecast page uses trend extrapolation | Trained models for denial probability, revenue forecast, cash prediction |
| **Prevention Engine** | Cannot proactively prevent denials | 0 prevention rules deployed | 15+ proactive prevention rules triggered by diagnostic signals |
| **Hardcoded Frontend Pages** | 28 pages display mock/static data | React components with hardcoded arrays | All pages wired to live API endpoints |
| **Navigation Routing Bugs** | Dead tabs and missing redirects frustrate users | Several tabs navigate to wrong pages or dead ends | All navigation paths verified and functional |

### 7.2 High Priority Gaps

| Gap | Impact | Notes |
|-----|--------|-------|
| **Granular CARC-Level Root Cause** | Root cause analysis at category level only; need individual CARC decomposition | Bible Doc 2 provides 160+ CARC-level decompositions ready for implementation |
| **Standard Reports** | No pre-built exportable reports | Users need monthly/quarterly board-ready reports |
| **Patient Access Metrics** | Limited visibility into front-end revenue cycle | Eligibility verification rates, auth turnaround, coverage gaps |
| **Coding Quality Analytics** | No systematic coding accuracy measurement | DRG mismatch rates, modifier accuracy, CDI query response rates |
| **Payer Contract Rate Monitoring** | Manual rate comparison only | Automated expected-vs-actual at claim level with variance alerts |
| **User Authentication** | No auth system | API endpoints are unauthenticated; need RBAC |
| **Audit Trail** | Partial implementation | Need comprehensive audit logging for compliance |

### 7.3 MiroFish-Powered Capabilities (New)

| Capability | Description | Business Value |
|-----------|-------------|----------------|
| **Simulation-Based Automation Testing** | Test automation rules against simulated claim populations before deployment | Eliminate automation errors; validate rules with zero production risk |
| **Multi-Agent Payer Behavior Modeling** | Create digital twins of payer adjudication behavior | Predict denial outcomes for new service lines or contract terms |
| **Scenario-Driven Revenue Forecasting** | Monte Carlo-style revenue projection using agent-based simulation | Higher confidence forecasts with scenario-specific bands |
| **Policy Change Impact Simulation** | Simulate organizational impact before a payer policy change takes effect | Proactive preparation, pre-positioned scrub rules, staff training |

---

## 8. Sprint Roadmap

### Sprint 7: Foundation Repair + MiroFish Setup
**Duration**: 2 weeks
**Theme**: Fix what's broken, wire what's static, prepare for simulation

| Priority | Item | Description |
|----------|------|-------------|
| P0 | Fix navigation routing | Resolve all dead tabs, missing redirects, broken tab-level navigation |
| P0 | Wire hardcoded pages | Connect 28 static frontend pages to live API endpoints |
| P0 | API endpoint validation | Verify all 75+ endpoints return correct data shapes |
| P1 | MiroFish environment setup | Install MiroFish, configure LLM connection, establish data bridge |
| P1 | CRS scoring pipeline | End-to-end claim risk scoring on incoming claims |
| P2 | Standard report templates | Create 5 board-ready report templates (revenue, denials, AR, cash, payer) |

### Sprint 8: Prevention Engine + ML Predictions
**Duration**: 2 weeks
**Theme**: Move from reactive to predictive and preventive

| Priority | Item | Description |
|----------|------|-------------|
| P0 | Train denial prediction model | ML model predicting denial probability per claim (target: 80%+ accuracy) |
| P0 | Train revenue forecast model | Time-series model for 30/60/90-day net revenue (target: +/-5% at 30 days) |
| P0 | Prevention rule engine | Deploy first 10 prevention rules based on diagnostic signals |
| P1 | CARC-level root cause | Implement individual CARC decomposition from Bible Doc 2 |
| P1 | Cash flow prediction | Daily/weekly cash receipt prediction model |
| P2 | Payer contract monitoring | Automated expected-vs-actual comparison with variance alerts |

### Sprint 9: MiroFish Integration + Advanced Automation
**Duration**: 2 weeks
**Theme**: Simulation-powered intelligence

| Priority | Item | Description |
|----------|------|-------------|
| P0 | MiroFish simulation pipeline | End-to-end pipeline: RCM data --> graph --> agents --> simulation --> results |
| P0 | Automation rule simulation | Test automation rules in MiroFish before production deployment |
| P1 | Payer behavior agents | Create digital twin agents for top 10 payers |
| P1 | Scenario analysis UI | Frontend for configuring and viewing simulation results |
| P2 | Advanced automation rules | Expand from 7 to 30+ rules covering all automation categories |
| P2 | Prevention dashboard | Dedicated prevention analytics showing denials prevented, revenue saved |

### Sprint 10: Scale + Polish (Planned)
**Duration**: 2 weeks
**Theme**: Production hardening

| Priority | Item | Description |
|----------|------|-------------|
| P0 | User authentication (RBAC) | Role-based access control across all endpoints and pages |
| P0 | Comprehensive audit logging | Full audit trail for compliance requirements |
| P1 | Performance optimization | Sub-2-second page loads, API response time < 500ms |
| P1 | Mobile responsiveness | Core dashboards accessible on tablet form factors |
| P2 | Integration framework | HL7/FHIR, clearinghouse, EHR connectivity |

---

## 9. Success Metrics

### 9.1 Outcome Metrics (12-Month Targets)

| Metric | Current Baseline | Target | Measurement Method |
|--------|-----------------|--------|-------------------|
| **Denial Prevention Rate** | 0% (no prevention engine) | 15% reduction in preventable denials | Compare denial volume pre/post prevention deployment, filtered by preventable categories |
| **Revenue Recovery** | Manual-only recovery | $2M+ annual additional recovery | Track revenue recovered through automation-assisted appeals and corrections |
| **AR Days Reduction** | Baseline TBD | 5-day reduction | Compare average AR days pre/post deployment |
| **Net Collection Rate** | Baseline TBD | +2 percentage points | (Net collections / Expected allowed) measured monthly |
| **First Pass Rate** | Baseline TBD | +8 percentage points | Claims paid on first submission / Total claims submitted |

### 9.2 Platform Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Automation Coverage** | 30+ active rules | Comprehensive coverage of Claims, Denials, Collections, and Payment automation categories |
| **Prevention Rules** | 15+ active rules | Coverage across all 5 diagnostic categories |
| **ML Model Accuracy** | 80%+ denial prediction, +/-5% revenue forecast | Minimum thresholds for production deployment |
| **API Response Time** | < 500ms (p95) | User experience requirement for interactive analytics |
| **Page Load Time** | < 2 seconds | Measured on Command Center and all analytics pages |

### 9.3 User Experience Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Clicks to Insight** | 3 or fewer clicks from any starting point to claim-level detail | Core UX principle: contextual investigation, not navigation hunting |
| **Investigation Time** | 50% reduction in time to identify root cause of a denial | Measured via user session analytics |
| **Appeal Generation** | < 2 minutes from denial to draft appeal letter | AI-assisted appeal workflow |
| **Zero Dead Ends** | 0 navigation paths that lead to empty/broken pages | Every click resolves to meaningful content or a clear "no data" state |

---

## 10. Appendices

### Appendix A: RCM Bible Reference

The NEXUS RCM Bible is a 5-document knowledge base that defines every metric, root cause, diagnostic, prediction, and automation the platform must support.

| Document | Title | Content Summary |
|----------|-------|-----------------|
| **Bible 1** | Descriptive Analytics & Standard Reporting | 100+ metrics across Revenue (R01-R25), Claims (C01-C24), Denials (D01-D25), Payments (E01-E20), Collections (F01-F15) |
| **Bible 2** | Root Cause Analysis | 160+ root cause items at two levels: claim-level (individual CARC decomposition) and system-level (revenue/operational root causes). Full decomposition: coder error %, payer policy %, documentation gap %, billing rule %, bad faith % |
| **Bible 3** | Diagnostic Suggestions | Actionable diagnostic framework with detection methodology, severity, recommended action, revenue impact, and connected root causes for 5 categories: Revenue Health, Denial Patterns, Payment Anomalies, Claims Quality, Operational |
| **Bible 4** | Predictive Analytics | Complete prediction catalog: Revenue predictions (PR-R01 to PR-R10), Denial predictions (PR-D01 to PR-D10), Claims predictions (PR-C01 to PR-C05), Payment predictions (PR-P01 to PR-P05), with model type, confidence methodology, and accuracy targets |
| **Bible 5** | Automation & Prevention | Every automation (Part A) and prevention (Part B) capability with tier classification, trigger conditions, confidence thresholds, revenue impact, and connected predictions/diagnostics/root causes |

### Appendix B: Automation Value Hierarchy

From Bible Document 5:

```
Prevention:  $1 invested --> $3.42 saved (stop the problem)
Automation:  $1 invested --> $2.10 saved (fix the problem faster)
Manual:      $1 invested --> $0.60 saved (human does everything)
```

This hierarchy drives investment prioritization. Prevention capabilities are the highest-ROI features on the roadmap.

### Appendix C: Automation Tier Definitions

| Tier | Name | Human Involvement | Examples |
|------|------|-------------------|---------|
| 1 | Full Auto | None (logged for audit) | Eligibility re-check, scrubber edits, queue prioritization |
| 2 | Auto-Draft + Approve | 1-click approval | Appeal letters, claim corrections, resubmissions |
| 3 | Auto-Alert + Decide | Human makes decision | Payer escalation, contract disputes, write-off decisions |
| 4 | Human-Only | Full human action | Peer-to-peer calls, legal action, contract negotiations |

### Appendix D: Frontend Route Map

**Primary Navigation (Sidebar)**:
- `/` -- Command Center
- `/analytics/revenue` -- Revenue Analytics (4 tabs)
- `/analytics/denials` -- Denial Analytics (4 tabs)
- `/analytics/payments` -- Payment Intelligence (4 tabs)
- `/analytics/claims` -- Claims Pipeline (2 tabs)
- `/work/claims` -- Claims Work Center (3 tabs)
- `/work/denials` -- Denial Work Center (4 tabs)
- `/work/collections` -- Collections Work Center (3 tabs)
- `/work/payments` -- Payment Work Center (3 tabs)
- `/work/automation` -- Automation Dashboard
- `/intelligence/lida` -- LIDA AI (4 tabs)
- `/intelligence/forecast` -- Revenue Forecast
- `/specialty/patient-access` -- Patient Access (6 tabs)
- `/specialty/coding` -- Coding & Charge (4 tabs)
- `/specialty/evv` -- EVV Home Health (5 tabs)
- `/settings` -- Settings (3 tabs)

**Total Pages**: 60+ (including sub-routes and detail pages)
**Legacy Redirects**: 40+ routes redirecting from v2 paths to v3 structure

### Appendix E: Key Descriptive Metrics (from Bible 1)

| Category | Metric Count | Examples |
|----------|-------------|---------|
| Revenue | R01-R25 | Total charges billed, net collections, net collection rate, cash receipts, ERA-to-bank gap |
| Claims | C01-C24 | Claims submitted, CRS scores, clean claim rate, 7-stage pipeline metrics, pipeline dwell time |
| Denials | D01-D25 | Denial rate, top CARC codes, appeal success rate, recovery rate, denial aging |
| Payments | E01-E20 | ADTP, payment velocity, underpayment rate, contractual adjustments, payer reimbursement rate |
| Collections | F01-F15 | AR balance, collection effectiveness, propensity-to-pay, call outcome rates |

---

*This document is maintained as the authoritative product requirements reference for NEXUS RCM. All feature development, sprint planning, and stakeholder communications should reference this PRD as the source of truth.*

*Document Version: 3.0.0 | Last Updated: March 27, 2026*
