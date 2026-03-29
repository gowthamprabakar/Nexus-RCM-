# NEXUS RCM -- SPECKIT GAP ANALYSIS
## Comprehensive System Audit & Integration Roadmap

> **Generated:** 2026-03-27
> **Analyzer:** speckit.analyze v2.0
> **Scope:** Full-stack inventory, data flow analysis, Bible compliance, mock audit, MiroFish integration
> **Codebase:** `/Users/prabakarannagarajan/RCM Pulse/`

---

## 1. SYSTEM INVENTORY

### 1.1 Backend API Endpoints (16 routers, 83 endpoints)

| Router File | Prefix | Endpoints | Key Operations |
|---|---|---|---|
| `claims.py` | `/claims` | 4 | GET list, GET by ID, POST create, PUT update |
| `denials.py` | `/denials` | 8 | GET list, GET summary, GET heatmap, POST create, GET/POST/PATCH appeals, GET letter |
| `crs.py` | `/crs` | 6 | GET summary, GET error-categories, GET queue, GET claim detail, GET high-risk, GET payers |
| `payments.py` | `/payments` | 11 | GET summary, GET/GET-detail ERA, POST post-payment, GET triangulation (summary + payer), GET ADTP + anomalies, GET ERA-bank-match, GET float-analysis, GET silent-underpayments |
| `ar.py` | `/ar` | 4 | GET summary, GET aging, GET trend, GET aging-root-cause |
| `collections.py` | `/collections` | 4 | GET summary, GET queue, GET alerts, PATCH task |
| `collections_extended.py` | `/collections` | 11 | GET account detail, GET timeline, GET documents, GET templates, GET disposition-codes, GET escalation-reasons, GET timeline, GET propensity, GET user-performance, GET team-metrics |
| `reconciliation.py` | `/reconciliation` | 5 | GET summary, GET weekly, GET ERA, GET transaction detail, GET payer-claims (by ID + by name) |
| `forecast.py` | `/forecast` | 5 | GET weekly, GET summary, GET daily, GET reconciliation/weekly, GET reconciliation/summary |
| `analytics.py` | `/analytics` | 3 | GET pipeline, GET denial-matrix, GET appeal-win-rate |
| `root_cause.py` | `/root-cause` | 3 | GET summary, GET trending, GET claim analysis |
| `diagnostics.py` | `/diagnostics` | 4 | GET summary, GET findings, GET payer diagnostic, GET claim diagnostic |
| `ai.py` | `/ai` | 6 | GET health, GET insights, GET stream (SSE), POST appeal-draft, POST call-script, GET anomaly-explain |
| `graph.py` | `/graph` + `/automation` | 12 | GET revenue-to-payers, GET payer categories, GET category root-causes, GET/browse claims, GET claim full-context, GET/POST/POST/POST automation rules/pending/approve/reject, GET audit, POST evaluate |
| `auth.py` | `/auth` | 3 | POST login, POST register, GET me |
| **TOTAL** | | **83** | |

### 1.2 Frontend Pages (68 distinct page components)

| Section | Sidebar Entry | Sub-pages | Count |
|---|---|---|---|
| **Command Center** | Command Center | CommandCenter | 1 |
| **Analytics** | Revenue Analytics | ExecutiveDashboard, RevenueReconciliation, PayerReconClaimsPage, ARAgingPage, CashFlowPage | 5 |
| | Denial Analytics | DenialAnalytics, RootCauseIntelligence, RootCauseClaimsPage, ClaimRootCauseDetail, PayerVariance | 5 |
| | Payment Intelligence | PaymentDashboard, PayerPaymentIntelligence, ContractAudit, ERABankRecon | 4 |
| | Claims Pipeline | ClaimsOverview, ScrubDashboard | 2 |
| **Work Centers** | Claims Work Center | ClaimsWorkQueue, AutoFixCenter, BatchActions | 3 |
| | Denial Work Center | DenialManagement, HighRiskClaims, AppealGenerator, DenialWorkflowLog | 4 |
| | Collections Work Center | CollectionsQueue, AlertsQueue, PaymentPortal | 3 |
| | Payment Work Center | ERAProcessing, PaymentPosting, ContractManager | 3 |
| | Automation Dashboard | AutomationDashboard | 1 |
| **Intelligence** | LIDA AI | LidaDashboard, LidaChat, MECEReportBuilder, TicketHub | 4 |
| | Revenue Forecast | RevenueForecast | 1 |
| **Specialty** | Patient Access | PatientAccessHub, InsuranceVerification, PriorAuthManager, BenefitAnalytics, VerificationHistory, PatientAccounts | 6 |
| | Coding & Charge | CodingOptimizer, AICodingAudit, AICodingCompliance, AICodingRulebook | 4 |
| | EVV Home Health | EVVDashboard, EVVVisitDetails, EVVFraudDetection, StateMandates, EVVAutoRetryManager | 5 |
| **Settings** | Settings | BillingRules, AIConfiguration, UserManagement | 3 |
| | Admin | AdminDashboard, IntegrationHub, ETLDesigner, APIManager, Scheduler | 5 |
| **Legacy/Detail** | (deep-link) | ClaimDenialDetail, DenialPredictionAnalysis, DenialPreventionDashboard, PreventionWorkspace, COBAutoManager, CollectionsHub, AccountDetailsPage, RecoveryInsights, PropensityScoreDetails, CollectionsActionCenter, PerformanceAnalytics, CollectionsTimeline, ReconciliationAdvanced, TransactionLedger, AIInsightDetail, ClaimsAnalytics, ClaimScrubbing, ClaimValidationDetail, ValidationQueue, MassScrub, RuleEngine, PreBatchScrubLayout, AIPerformanceEngine, MCPAgentHub, AIModelMonitor, DriftLogs, ModelRegistry, FeatureImportance, PSIDistribution, DataSchemaExplorer, BankReconciliation, AuditLog, PayerPerformance | 33 |
| **TOTAL** | | | **68** |

### 1.3 Database Tables (22 tables)

| Table | Model Class | Relationships |
|---|---|---|
| `claims` | Claim | Core entity -- FK to patients, providers, payers |
| `claim_lines` | ClaimLine | FK to claims (CPT/ICD-10 line items) |
| `denials` | Denial | FK to claims, payers (CARC/RARC codes) |
| `appeals` | Appeal | FK to denials (appeal letters, outcomes) |
| `era_payments` | EraPayment | FK to claims, payers (835 remittance) |
| `payer_master` | Payer | Reference table (50 payers) |
| `payer_contract_rate` | PayerContractRate | FK to payers (800 CPT-rate mappings) |
| `patients` | Patient | Demographics, MRN |
| `insurance_coverage` | InsuranceCoverage | FK to patients, payers |
| `providers` | Provider | NPI, specialty, taxonomy |
| `users` | User | App users, roles |
| `roles` | Role | RBAC roles |
| `user_role` | (association) | M2M users-roles |
| `ar_aging` | ARAgingBucket | FK to claims, payers (aging buckets) |
| `collection_queue` | CollectionQueue | FK to patients, payers (work items) |
| `collection_alerts` | CollectionAlert | FK to collection_queue |
| `payment_forecast` | PaymentForecast | FK to payers (weekly forecasts) |
| `bank_reconciliation` | BankReconciliation | FK to payers (deposit matching) |
| `prior_auth` | PriorAuth | FK to patients, payers |
| `eligibility_271` | Eligibility271 | FK to patients, payers |
| `evv_visits` | EvvVisit | FK to patients, providers |
| `root_cause_analysis` | RootCauseAnalysis | FK to denials, claims |
| `claim_root_cause_step` | ClaimRootCauseStep | FK to root_cause_analysis |
| `adtp_trend` | ADTPTrend | FK to payers (rolling ADTP) |
| `automation_actions` | AutomationAction | Automation engine actions |

**Note:** Row counts could not be queried programmatically due to environment constraints. Per the MiroFish integration doc, approximate counts are: claims ~500K, denials ~56K, ERA payments ~315K, claim_lines ~1.25M, appeals ~24.8K, payer_master ~50, payer_contract_rate ~800, providers ~200, collection_queue ~5K, adtp_trend ~61, automation_actions ~13.

### 1.4 Backend Services (9 services, 73 functions)

| Service File | Functions | Key Capabilities |
|---|---|---|
| `root_cause_service.py` | 8 | 7-step Bayesian root cause analysis, batch analysis, trending |
| `ai_insights.py` | 21 | Ollama LLM integration, 8 page-specific prompts, appeal drafts, call scripts, anomaly explanation, SSE streaming, fallback generators |
| `automation_engine.py` | 14 | Rule evaluation, diagnostic matching, action creation/approval/rejection, audit trail, 7 built-in rules |
| `crs.py` | 3 | Claim Readiness Score (6-component), issue derivation |
| `adtp_service.py` | 4 | Average Days To Pay computation, rolling trends, anomaly detection |
| `appeal_generator.py` | 4 | Template-based appeal letters, recommended actions per CARC, scoring |
| `diagnostic_service.py` | 10 | 5 detection categories (denial patterns, payer behavior, ADTP anomalies, revenue leakage, AR aging), payer/claim diagnostics, summary |
| `graph_query_service.py` | 7 | Revenue-to-payer drill-down, category-to-root-cause drill, claim full context, lifecycle stages, suggested actions |
| `triangulation_service.py` | 4 | ERA-claim-bank triangulation, silent underpayment detection, float analysis |
| **TOTAL** | **73** | |

---

## 2. DATA FLOW ANALYSIS

### 2.1 Page-to-API Connections

| Frontend Page | API Methods Called | Data Status |
|---|---|---|
| CommandCenter | `analytics.getPipeline`, `denials.getSummary`, `crs.getSummary`, `ar.getSummary`, `payments.getSummary`, `rootCause.getSummary`, `diagnostics.getFindings`, `ai.getInsights` | REAL + mock fallback for KPIs |
| ExecutiveDashboard | `analytics.getPipeline`, `denials.getSummary`, `crs.getSummary`, `ar.getSummary`, `payments.getSummary`, `ar.getTrend`, `tickets.listActive`, `ai.getInsights` | REAL + mock tickets |
| DenialAnalytics | `denials.getSummary`, `denials.getHeatmap`, `analytics.getDenialMatrix` | REAL API |
| DenialManagement | `denials.list` | REAL API |
| HighRiskClaims | `crs.getHighRisk` | REAL API |
| AppealGenerator | `appeals.list`, `appeals.create`, `appeals.getLetter`, `ai.draftAppeal` | REAL API |
| ClaimsOverview | `analytics.getPipeline`, `claims.list` | REAL (with mock fallback) |
| ClaimsWorkQueue | `claims.list`, `claims.getQueue` | HYBRID (tries real, falls back to mock) |
| CollectionsQueue | `collections.getSummary`, `collections.getQueue` | REAL API |
| AlertsQueue | `collections.getAlerts` | REAL API |
| PaymentDashboard | `payments.getSummary`, `payments.getERAList` | REAL API |
| ARAgingPage | `ar.getSummary`, `ar.getAging`, `ar.getTrend`, `ar.getAgingRootCause` | REAL API |
| RevenueReconciliation | `reconciliation.getSummary`, `reconciliation.getWeekly`, `reconciliation.getERATrail` | REAL API |
| RootCauseIntelligence | `rootCause.getSummary`, `rootCause.getTrending` | REAL API |
| AutomationDashboard | `automation.getRules`, `automation.getPending`, `automation.getAudit`, `automation.evaluate` | REAL API |
| ERABankRecon | `payments.getERABankMatch`, `payments.getFloatAnalysis`, `payments.getSilentUnderpayments` | REAL API |
| ContractAudit | `payments.getTriangulationSummary`, `payments.getTriangulationPayer` | REAL API |
| RevenueForecast | `forecast.getSummary`, `forecast.getWeekly` | REAL API |
| PatientAccessHub | -- | HARDCODED MOCK |
| InsuranceVerification | -- | HARDCODED MOCK |
| PriorAuthManager | -- | HARDCODED MOCK |
| BenefitAnalytics | -- | HARDCODED MOCK |
| CodingOptimizer | -- | HARDCODED MOCK |
| AICodingAudit | -- | HARDCODED MOCK |
| EVVDashboard | -- | HARDCODED MOCK |
| EVVVisitDetails | -- | HARDCODED MOCK |
| EVVFraudDetection | -- | HARDCODED MOCK |
| LidaChat | -- | HARDCODED MOCK |
| MECEReportBuilder | -- | HARDCODED MOCK |
| BillingRules | -- | HARDCODED MOCK |
| AIConfiguration | -- | HARDCODED MOCK |
| UserManagement | -- | HARDCODED MOCK |
| AdminDashboard | -- | HARDCODED MOCK |
| IntegrationHub | -- | HARDCODED MOCK |
| ETLDesigner | -- | HARDCODED MOCK |
| APIManager | -- | HARDCODED MOCK |
| Scheduler | -- | HARDCODED MOCK |
| AutoFixCenter | -- | HARDCODED MOCK |
| BatchActions | -- | HARDCODED MOCK |
| ERAProcessing | -- | HARDCODED MOCK |
| PaymentPosting | -- | HARDCODED MOCK |
| ContractManager | -- | HARDCODED MOCK |
| PaymentPortal | -- | HARDCODED MOCK |

### 2.2 API-to-Service-to-Table Connections

| API Router | Backend Service | Database Tables Queried |
|---|---|---|
| `claims.py` | (direct ORM) | claims |
| `denials.py` | appeal_generator | denials, appeals, claims, payer_master |
| `crs.py` | crs | claims, claim_lines, patients, payer_master, insurance_coverage, prior_auth, eligibility_271, evv_visits |
| `payments.py` | adtp_service, triangulation_service | era_payments, claims, payer_master, bank_reconciliation, adtp_trend, payer_contract_rate |
| `ar.py` | (direct ORM) | ar_aging, claims, payer_master |
| `collections.py` | (direct ORM) | collection_queue, collection_alerts, payer_master |
| `collections_extended.py` | (inline logic) | collection_queue, patients, payer_master |
| `reconciliation.py` | (direct ORM) | bank_reconciliation, era_payments, claims, payer_master |
| `forecast.py` | (direct ORM) | payment_forecast, bank_reconciliation, payer_master |
| `analytics.py` | (direct ORM) | claims, denials, appeals, era_payments, payer_master |
| `root_cause.py` | root_cause_service | root_cause_analysis, claim_root_cause_step, denials, claims |
| `diagnostics.py` | diagnostic_service | denials, claims, era_payments, ar_aging, adtp_trend, payer_master |
| `ai.py` | ai_insights | (calls Ollama LLM, receives stats from other services) |
| `graph.py` | graph_query_service, automation_engine | claims, denials, era_payments, root_cause_analysis, payer_master, automation_actions |
| `auth.py` | (direct ORM) | users, roles, user_role |

### 2.3 Identified BROKEN Connections

| Issue | Description | Impact |
|---|---|---|
| `dashboard.getKPIs` still mock | The `api.dashboard.getKPIs` and `api.dashboard.getRevenueTrend` methods in api.js use hardcoded synthetic data with `simulateLatency()` instead of calling real backend endpoints. No backend endpoint exists for `/dashboard/kpis`. | Command Center KPI cards show fabricated numbers |
| `tickets.*` fully mock | `api.tickets.listActive`, `getById`, `create` all operate on imported `ticketsData` JSON. No backend `/tickets` router exists. | LIDA TicketHub operates on static data |
| `users.list` fully mock | Returns imported `usersData` JSON. The `/auth` router exists but no `/users` list endpoint. | UserManagement page shows fake users |
| Duplicate `diagnostics` key in api.js | The `api.diagnostics` object is defined twice (lines 747 and 811). The second definition overwrites the first, losing `getSummary`, `getPayerDiagnostic`, and `getClaimDiagnostic` methods. | Only `getFindings` is accessible; summary/payer/claim diagnostic endpoints are unreachable from frontend |
| No backend for Specialty modules | Patient Access, Coding, EVV have no backend routers. All 15 specialty pages are entirely frontend-only with hardcoded data. | Zero real data in specialty modules |
| No backend for Settings/Admin | No routers for billing rules, AI config, integrations, ETL, API management, or scheduling. | All admin pages are non-functional |

---

## 3. FEATURE COMPLETENESS vs RCM BIBLE

### Scoring Methodology
Each Bible item is scored as: IMPLEMENTED (real API + UI), PARTIAL (UI exists but mock/incomplete data), or MISSING (no implementation).

### Part 1: Descriptive Analytics (Doc 1)
**Bible items: ~149 metrics (counted from table rows with metric IDs)**

| Category | Bible Metrics | Implemented | Partial | Missing | Score |
|---|---|---|---|---|---|
| 1.1 Gross Revenue (R01-R10) | 10 | 3 | 2 | 5 | 30% |
| 1.2 Net Revenue (R11-R20) | 10 | 4 | 2 | 4 | 40% |
| 1.3 Cash Flow (R21-R25) | 5 | 3 | 1 | 1 | 60% |
| 1.4 A/R Aging (multiple) | ~15 | 6 | 3 | 6 | 40% |
| 1.5 Claims Pipeline | ~20 | 8 | 4 | 8 | 40% |
| 1.6 Denial Descriptives | ~25 | 12 | 5 | 8 | 48% |
| 1.7 Payment Descriptives | ~20 | 10 | 3 | 7 | 50% |
| 1.8 Payer Descriptives | ~15 | 6 | 3 | 6 | 40% |
| 1.9 Patient Access | ~15 | 0 | 0 | 15 | 0% |
| 1.10 Coding/EVV | ~14 | 0 | 0 | 14 | 0% |
| **TOTAL** | **~149** | **52** | **23** | **74** | **35%** |

**Score: ~52/149 implemented (35%)**

### Part 2: Root Cause Analysis (Doc 2)
**Bible items: ~78 root cause entries (### headings for CARC codes + system-level causes)**

| Category | Items | Implemented | Partial | Missing |
|---|---|---|---|---|
| CO Codes (CO-4 through CO-253) | ~25 | 8 | 5 | 12 |
| PR Codes (PR-1 through PR-204) | ~15 | 3 | 2 | 10 |
| OA/PI/CR/MA/N Codes | ~8 | 0 | 0 | 8 |
| System-Level Root Causes (A1-A3) | ~30 | 10 | 8 | 12 |
| **TOTAL** | **~78** | **21** | **15** | **42** |

**Score: ~21/78 implemented (27%).** The root cause engine does Bayesian analysis but only covers a subset of CARC codes. Many system-level revenue root causes (charge capture, credentialing, contract underpayment) have no detection logic.

### Part 3: Diagnostic Suggestions (Doc 3)
**Bible items: 121 diagnostic entries (counted from ### X-NN: pattern)**

| Category | Items | Implemented | Partial | Missing |
|---|---|---|---|---|
| Revenue Health (RH-01 to RH-XX) | ~20 | 4 | 3 | 13 |
| Denial Pattern (DP-01 to DP-XX) | ~25 | 8 | 5 | 12 |
| Payment Flow (PF-01 to PF-XX) | ~20 | 5 | 3 | 12 |
| AR Aging (AA-01 to AA-XX) | ~15 | 4 | 2 | 9 |
| Payer Behavior (PB-01 to PB-XX) | ~20 | 5 | 3 | 12 |
| Operational (OP-01 to OP-XX) | ~21 | 0 | 0 | 21 |
| **TOTAL** | **121** | **26** | **16** | **79** |

**Score: ~26/121 implemented (21%).** The diagnostic_service.py implements 5 detection categories but only covers a fraction of the Bible's 121 specific diagnostic rules. Many operational diagnostics (coding accuracy, charge capture, credentialing) are entirely missing.

### Part 4: Predictive Analytics (Doc 4)
**Bible items: ~72 predictions (### headings counted)**

| Category | Items | Implemented | Partial | Missing |
|---|---|---|---|---|
| Revenue Predictions (PR-R01 to R15) | ~15 | 3 | 2 | 10 |
| Denial Predictions (PR-D01 to D20) | ~20 | 2 | 3 | 15 |
| Payment Predictions (PR-P01 to P12) | ~12 | 2 | 1 | 9 |
| AR/Collections Predictions | ~10 | 1 | 1 | 8 |
| Operational Predictions | ~15 | 0 | 0 | 15 |
| **TOTAL** | **~72** | **8** | **7** | **57** |

**Score: ~8/72 implemented (11%).** Only basic forecasting (revenue forecast, ADTP anomaly detection) exists. No ML models for denial prediction, propensity scoring, or operational forecasting are actually running. The CRS score is rule-based, not predictive.

### Part 5: Automation & Prevention (Doc 5 -- combined)
**Bible items: ~93 automation/prevention items (### headings counted)**

| Category | Items | Implemented | Partial | Missing |
|---|---|---|---|---|
| Tier 1 Full Auto | ~15 | 2 | 3 | 10 |
| Tier 2 Auto-Draft + Approve | ~20 | 3 | 4 | 13 |
| Tier 3 Auto-Alert + Decide | ~18 | 2 | 2 | 14 |
| Prevention Rules | ~25 | 3 | 4 | 18 |
| Human-in-Loop Framework | ~15 | 1 | 2 | 12 |
| **TOTAL** | **~93** | **11** | **15** | **67** |

**Score: ~11/93 implemented (12%).** The automation engine has 7 rules (AUTO-001 through AUTO-007) covering basic auto-categorization, appeal drafting, and threshold alerts. No prevention rules execute automatically. The human-in-the-loop ramp schedule (Learning/Supervised/Autonomous) is not implemented.

### Bible Compliance Summary

| Bible Document | Items | Implemented | Score |
|---|---|---|---|
| Part 1: Descriptive Analytics | ~149 | ~52 | **35%** |
| Part 2: Root Cause Analysis | ~78 | ~21 | **27%** |
| Part 3: Diagnostic Suggestions | 121 | ~26 | **21%** |
| Part 4: Predictive Analytics | ~72 | ~8 | **11%** |
| Part 5: Automation & Prevention | ~93 | ~11 | **12%** |
| **TOTAL** | **~513** | **~118** | **23%** |

---

## 4. MOCK vs REAL DATA AUDIT

### Classification Key
- **REAL API**: Page calls backend API endpoints that query PostgreSQL
- **HYBRID**: Page calls real API but has `catch` fallback to mock/synthetic data
- **HARDCODED MOCK**: Page uses imported JSON, inline objects, or no API calls

| Page | Category | Classification | Notes |
|---|---|---|---|
| CommandCenter | Analytics | **HYBRID** | Real APIs for 7 summary endpoints + mock `mockCommandCenterData` for KPI cards |
| ExecutiveDashboard | Analytics | **HYBRID** | Real APIs for summaries + mock ticket data |
| DenialAnalytics | Analytics | **REAL API** | `denials.getSummary`, `denials.getHeatmap`, `analytics.getDenialMatrix` |
| RootCauseIntelligence | Analytics | **REAL API** | `rootCause.getSummary`, `rootCause.getTrending` |
| RootCauseClaimsPage | Analytics | **REAL API** | `graph.getClaims` |
| ClaimRootCauseDetail | Analytics | **REAL API** | `rootCause.getClaimAnalysis`, `graph.getClaimFullContext` |
| PayerVariance | Analytics | **REAL API** | `denials.getSummary` with payer breakdown |
| PaymentDashboard | Analytics | **REAL API** | `payments.getSummary`, `payments.getERAList` |
| PayerPaymentIntelligence | Analytics | **REAL API** | `payments.getTriangulationPayer` |
| ContractAudit | Analytics | **REAL API** | `payments.getTriangulationSummary` |
| ERABankRecon | Analytics | **REAL API** | `payments.getERABankMatch`, `payments.getFloatAnalysis`, `payments.getSilentUnderpayments` |
| ClaimsOverview | Analytics | **HYBRID** | `claims.list` with mock fallback |
| ScrubDashboard | Analytics | **REAL API** | `crs.getSummary`, `crs.getErrorCategories` |
| ARAgingPage | Analytics | **REAL API** | `ar.getSummary`, `ar.getAging`, `ar.getTrend` |
| CashFlowPage | Analytics | **REAL API** | `forecast.getSummary`, `forecast.getWeekly` |
| RevenueReconciliation | Analytics | **REAL API** | `reconciliation.getSummary`, `reconciliation.getWeekly` |
| ClaimsWorkQueue | Work | **HYBRID** | `claims.list` tries real, falls back to `claimsData` JSON |
| AutoFixCenter | Work | **HARDCODED MOCK** | No API integration |
| BatchActions | Work | **HARDCODED MOCK** | No API integration |
| DenialManagement | Work | **REAL API** | `denials.list` |
| HighRiskClaims | Work | **REAL API** | `crs.getHighRisk` |
| AppealGenerator | Work | **REAL API** | `appeals.list`, `appeals.create`, `ai.draftAppeal` |
| DenialWorkflowLog | Work | **HARDCODED MOCK** | No API, inline data |
| CollectionsQueue | Work | **REAL API** | `collections.getSummary`, `collections.getQueue` |
| AlertsQueue | Work | **REAL API** | `collections.getAlerts` |
| PaymentPortal | Work | **HARDCODED MOCK** | No API integration |
| ERAProcessing | Work | **HARDCODED MOCK** | No API integration |
| PaymentPosting | Work | **HARDCODED MOCK** | No API integration, inline mock |
| ContractManager | Work | **HARDCODED MOCK** | No API integration |
| AutomationDashboard | Work | **REAL API** | `automation.getRules`, `automation.getPending`, `automation.getAudit` |
| LidaDashboard | Intelligence | **REAL API** | `ai.getInsights`, `diagnostics.getFindings` |
| LidaChat | Intelligence | **HARDCODED MOCK** | No real LLM chat integration |
| MECEReportBuilder | Intelligence | **HARDCODED MOCK** | No API integration |
| TicketHub | Intelligence | **HARDCODED MOCK** | Mock `ticketsData` JSON |
| RevenueForecast | Intelligence | **REAL API** | `forecast.getSummary`, `forecast.getWeekly` |
| PatientAccessHub | Specialty | **HARDCODED MOCK** | No backend router |
| InsuranceVerification | Specialty | **HARDCODED MOCK** | No backend router |
| PriorAuthManager | Specialty | **HARDCODED MOCK** | No backend router |
| BenefitAnalytics | Specialty | **HARDCODED MOCK** | No backend router |
| VerificationHistory | Specialty | **HARDCODED MOCK** | No backend router |
| PatientAccounts | Specialty | **HARDCODED MOCK** | No backend router |
| CodingOptimizer | Specialty | **HARDCODED MOCK** | No backend router |
| AICodingAudit | Specialty | **HARDCODED MOCK** | No backend router |
| AICodingCompliance | Specialty | **HARDCODED MOCK** | No backend router |
| AICodingRulebook | Specialty | **HARDCODED MOCK** | No backend router |
| EVVDashboard | Specialty | **HARDCODED MOCK** | No backend router |
| EVVVisitDetails | Specialty | **HARDCODED MOCK** | No backend router |
| EVVFraudDetection | Specialty | **HARDCODED MOCK** | No backend router |
| StateMandates | Specialty | **HARDCODED MOCK** | No backend router |
| EVVAutoRetryManager | Specialty | **REAL API** | Uses `denials` and `automation` APIs |
| BillingRules | Settings | **HARDCODED MOCK** | No backend router |
| AIConfiguration | Settings | **HARDCODED MOCK** | No backend router |
| UserManagement | Settings | **HARDCODED MOCK** | Mock `usersData` JSON |
| AdminDashboard | Admin | **HARDCODED MOCK** | No backend router |
| IntegrationHub | Admin | **HARDCODED MOCK** | No backend router |
| ETLDesigner | Admin | **HARDCODED MOCK** | No backend router |
| APIManager | Admin | **HARDCODED MOCK** | No backend router |
| Scheduler | Admin | **HARDCODED MOCK** | No backend router |

### Summary

| Classification | Page Count | Percentage |
|---|---|---|
| REAL API | 27 | 40% |
| HYBRID (API + mock fallback) | 4 | 6% |
| HARDCODED MOCK | 37 | 54% |
| **TOTAL** | **68** | **100%** |

---

## 5. MIROFISH INTEGRATION OPPORTUNITIES

### 5.1 MiroFish Capability Inventory

MiroFish provides 13 service modules with multi-agent simulation capabilities:

| Service | Classes | Capability |
|---|---|---|
| `simulation_manager.py` | SimulationManager, SimulationState | Lifecycle management, status tracking |
| `simulation_runner.py` | SimulationRunner, AgentAction, RoundSummary | Round-based agent execution, action recording |
| `simulation_config_generator.py` | SimulationConfigGenerator, SimulationParameters | Scenario configuration, variable injection |
| `simulation_ipc.py` | SimulationIPCClient, SimulationIPCServer | Inter-process communication for sim execution |
| `oasis_profile_generator.py` | OasisProfileGenerator, OasisAgentProfile | Agent personality generation from data |
| `graph_builder.py` | GraphBuilderService | Knowledge graph construction from data |
| `ontology_generator.py` | OntologyGenerator | Domain ontology creation |
| `report_agent.py` | ReportAgent, ReportManager | Analytical report generation from sim results |
| `zep_tools.py` | ZepToolsService, InsightForge, Panorama, AgentInterview | Graph memory search, insight generation, agent conversations |
| `zep_entity_reader.py` | ZepEntityReader | Entity extraction from graph memory |
| `zep_graph_memory_updater.py` | ZepGraphMemoryUpdater, ZepGraphMemoryManager | Agent memory persistence and update |
| `text_processor.py` | TextProcessor | NLP text processing |

### 5.2 Integration Opportunities by Category

#### A. Diagnostic -> Simulation: "What if we fix this root cause?"

The diagnostic engine currently produces ranked findings with `impact_amount`. MiroFish can simulate the downstream effects of fixing each finding.

| Current Diagnostic Finding | MiroFish Simulation | Expected Output |
|---|---|---|
| CODING_MISMATCH: 28,594 claims, $105M impact | Create 200 Provider Agents with -30% coding error rate; run 6-month sim | "Modifier error reduction yields $31.5M denial reduction, 87% confidence" |
| PAYER_BEHAVIOR: UHC denial spike, $2.3M | Create 1 Payer Agent (UHC profile), inject historical denial patterns | "UHC auto-denial rate drops 40% with pre-submission modifier fix" |
| AR_AGING: 120+ day bucket growing $4.1M | Create Billing Team Agents (current staffing), run collection sim | "Current staffing resolves 62% within 90 days; +2 FTE resolves 89%" |
| REVENUE_LEAKAGE: Silent underpayments $890K | Create Payer Agents for top 5 underpayers, audit contract rates | "Contract renegotiation with Cigna alone recovers $340K/year" |

#### B. Automation -> Simulation: "What happens if we auto-appeal these 8,000 claims?"

The automation engine has 7 rules (AUTO-001 through AUTO-007). MiroFish can predict outcomes before executing bulk actions.

| Automation Rule | Simulation Scenario | Business Question |
|---|---|---|
| AUTO-003: Auto-draft appeals for high-confidence denials | 50 Payer Agents adjudicate 8,000 appeal submissions | "Win rate prediction: 67% for CO-4, 42% for CO-16, 89% for CO-45; expected recovery: $2.1M" |
| AUTO-005: Auto-resubmit corrected claims | Provider Agents resubmit with corrections, Payer Agents re-adjudicate | "Resubmission success rate by correction type: modifier fix 78%, auth attach 92%, coding change 61%" |
| AUTO-007: Threshold-based escalation | Billing Team Agents process escalated queue | "Escalation backlog cleared in 14 days with current staff; 8 days with overtime" |

#### C. Prevention -> Simulation: "If we add auth verification, how many denials prevented?"

| Prevention Intervention | Simulation Setup | Predicted Outcome |
|---|---|---|
| Pre-submission eligibility check | Run 10,000 Claim Agents through eligibility gate before Payer Agent adjudication | "4,200 claims caught pre-submission; $1.8M in prevented denials; 12-second avg processing delay" |
| Modifier validation engine | Inject modifier validation into Provider Agent submission pipeline | "CO-4 denials reduced 72%; net revenue increase $890K/quarter" |
| CDI query automation | Add 5 CDI Agents reviewing claims pre-submission | "Documentation deficiency denials reduced 58%; physician query turnaround improved from 5 days to 2" |
| Real-time auth check | Inject auth verification into claim pipeline | "PR-45/CO-15 denials reduced 81%; 3,400 claims/month saved; $2.7M annual impact" |

#### D. Payer Behavior Simulation

Create 50 Payer Agents seeded from `payer_master` + `denials` + `era_payments` + `adtp_trend`. Each agent has:
- Learned adjudication behavior (accept/deny rates per CARC per CPT)
- Payment timing patterns (ADTP distribution)
- Appeal response patterns (win rates by category)
- Policy change simulation (inject new auth requirements, modifier rules)

**Key scenarios:**
1. "Humana changes auth policy for orthopedic procedures" -- simulate 6-month impact on denial volume and revenue
2. "UHC implements 48-hour timely filing for corrections" -- simulate impact on current resubmission workflow
3. "Medicare Advantage plan shifts to value-based reimbursement" -- simulate revenue impact across service lines

#### E. Revenue Forecasting via Simulation

Current `payment_forecast` uses simple time-series. MiroFish can run Monte Carlo simulations:
- 1,000 simulated 90-day revenue paths using agent-based payer behavior
- Confidence bands based on payer-specific ADTP variance
- Scenario analysis: "What if denial rate increases 2%?" / "What if we lose the Cigna contract?"
- Staff capacity planning: "How many FTEs needed to maintain 95% collection rate?"

### 5.3 Proposed Integration Architecture

```
NEXUS PostgreSQL (22 tables)
       |
       | ETL seed (nightly)
       v
MiroFish Graph Construction
       |
       | Agent profiles from real data
       v
MiroFish Simulation Engine (OASIS)
  - 50 Payer Agents
  - 200 Provider Agents
  - N Claim Agents (archetype-based)
  - 10-20 Billing Team Agents
  - 5-10 CDI Agents
  - 2-3 Compliance Agents
       |
       | Simulation results + confidence scores
       v
NEXUS Automation Engine
  - simulation_confidence added to rule evaluation
  - Higher-quality auto-approve decisions
  - Predicted outcome before bulk actions
       |
       v
NEXUS React Frontend
  - "Simulate" button on diagnostic findings
  - What-if scenario builder
  - Revenue forecast with simulation bands
```

---

## 6. TOP 20 GAPS (Ranked by Revenue Impact)

| Rank | Gap | Bible Ref | Revenue Impact | Effort |
|---|---|---|---|---|
| 1 | **No predictive denial model** -- CRS is rule-based, not ML. Cannot predict which claims will be denied before submission. | PR-D01 to D05 | $4-8M/year in preventable denials | HIGH (Sprint 8-9) |
| 2 | **No simulation engine** -- Cannot answer "what if" questions before committing resources. MiroFish integration not started. | Doc 5, all AU/PV items | $3-6M/year in intervention optimization | HIGH (Sprint 8-10) |
| 3 | **Silent underpayment detection exists but no auto-dispute workflow** -- System detects $890K in underpayments but no automated dispute generation. | AU-12, PV-08 | $890K-2M/year | MEDIUM (Sprint 7) |
| 4 | **Patient Access module entirely mock** -- No eligibility verification, no prior auth management, no benefit checking against real payer APIs. | Doc 1 (1.9), Doc 3 (PA-*) | $1.5-3M/year in front-end denials | HIGH (Sprint 8-9) |
| 5 | **CommandCenter KPIs still synthetic** -- The executive landing page shows fabricated numbers from `mockCommandCenterData`. Decision-makers cannot trust the dashboard. | R01-R25 | Trust/adoption risk | LOW (Sprint 7) |
| 6 | **`api.diagnostics` object overwritten in api.js** -- Duplicate key causes `getSummary`, `getPayerDiagnostic`, `getClaimDiagnostic` to be unreachable. | Bug | Diagnostic panels broken | LOW (hotfix) |
| 7 | **No contract variance engine** -- System has `payer_contract_rate` table (800 rows) but no automated comparison of ERA payments against contracted rates. | Doc 3 (PF-04 to PF-08) | $500K-1.5M/year in contract leakage | MEDIUM (Sprint 8) |
| 8 | **Coding module entirely mock** -- No real coding audit, compliance checking, or charge optimization against actual claim data. | Doc 1 (1.10), Doc 2 (CO-* codes) | $1-2M/year in coding-related denials | HIGH (Sprint 9) |
| 9 | **EVV module entirely mock** -- 5 pages with no backend. EVV visits table exists but no fraud detection or mandate compliance engine. | Doc 3 (EVV-*) | $500K-1M/year in EVV-related denials | MEDIUM (Sprint 9) |
| 10 | **Only 7 automation rules** -- Bible specifies ~93 automation/prevention items. Current engine handles basic categorization and appeal drafting but missing auto-resubmission, auto-coding-fix, auto-eligibility-recheck. | Doc 5 (all AU items) | $2-4M/year in manual labor costs | HIGH (Sprint 8-9) |
| 11 | **No LIDA chat connected to LLM** -- LidaChat page exists but has no real Ollama/LLM integration for conversational analytics. Backend has SSE streaming but frontend does not use it. | Intelligence | Adoption/productivity | MEDIUM (Sprint 8) |
| 12 | **No appeal outcome tracking dashboard** -- Appeals are created and letters generated but no win-rate-by-strategy analysis to optimize future appeals. | Doc 1 (D41-D50) | $300K-800K/year in suboptimal appeals | LOW (Sprint 7) |
| 13 | **MECE Report Builder is stub** -- No real report generation. MiroFish ReportAgent exists and could power this. | Intelligence | Productivity | MEDIUM (Sprint 8) |
| 14 | **No charge capture audit** -- Bible Part 2 identifies charge capture as top revenue leakage cause. No system for detecting missed charges. | A1.03, RH-05 | $500K-2M/year | HIGH (Sprint 9) |
| 15 | **Payment posting workflow mock** -- PaymentPosting and ERAProcessing pages have no real API integration despite backend ERA endpoints existing. | Doc 1 (P01-P15) | Operational efficiency | LOW (Sprint 7) |
| 16 | **No payer contract negotiation support** -- No comparison of actual reimbursement vs benchmark rates across payers. | Doc 3 (PF-07) | $200K-500K/year | MEDIUM (Sprint 9) |
| 17 | **No staff productivity metrics** -- User performance endpoint exists (`collections/user-performance`) but no cross-module staff performance tracking. | Doc 1 (O01-O10) | Operational | LOW (Sprint 8) |
| 18 | **No denial prevention rules executing** -- The prevention half of Doc 5 has zero implementation. CRS scores claims but takes no automatic preventive action. | Doc 5 Part B | $1-3M/year | HIGH (Sprint 8) |
| 19 | **Settings/Admin all non-functional** -- BillingRules, AIConfiguration, Scheduler have UI but zero backend. Cannot configure any system behavior. | Admin | Adoption blocker | MEDIUM (Sprint 8) |
| 20 | **No batch claim operations** -- BatchActions page is a stub. No backend for mass claim correction, mass resubmission, or mass appeal generation. | AU-03, AU-05 | $200K-500K/year in labor | MEDIUM (Sprint 8) |

---

## 7. RECOMMENDED SPRINT PLAN

### Sprint 7 (Current -- Weeks 1-2): "Connection & Quick Wins"

**Theme:** Fix broken connections, eliminate trust gaps, ship hotfixes.

| # | Task | Priority | Effort | Bible Coverage Gain |
|---|---|---|---|---|
| 7.1 | **HOTFIX: Fix duplicate `diagnostics` key in api.js** -- Merge both blocks into one, restore `getSummary`, `getPayerDiagnostic`, `getClaimDiagnostic` | P0 | 1 hour | +3 endpoints restored |
| 7.2 | **Wire CommandCenter KPIs to real backend** -- Create `/dashboard/summary` endpoint aggregating existing summary endpoints; remove `mockCommandCenterData` | P0 | 1 day | +10 metrics real |
| 7.3 | **Wire Payment Posting & ERA Processing to existing APIs** -- PaymentPosting and ERAProcessing pages already have backend endpoints; just connect them | P1 | 2 days | +8 metrics real |
| 7.4 | **Connect DenialWorkflowLog to real audit data** -- Use existing `automation.getAudit` + `appeals.list` endpoints | P1 | 1 day | +5 metrics real |
| 7.5 | **Build appeal outcome analytics view** -- New component using `analytics.getAppealWinRates` endpoint | P1 | 2 days | +8 metrics real |
| 7.6 | **Connect TicketHub to real ticket system** -- Create backend `/tickets` CRUD router with PostgreSQL table | P2 | 3 days | LIDA ticket system operational |
| 7.7 | **Wire silent underpayment auto-dispute** -- Connect `payments.getSilentUnderpayments` to dispute generation workflow | P1 | 2 days | +$890K recovery potential |
| 7.8 | **Add graph drill-down to Automation Dashboard** -- Use existing `graph.*` endpoints to show claim-level detail from automation findings | P2 | 2 days | Better investigation flow |

**Sprint 7 Target:** Raise REAL API coverage from 40% to 55% of pages. Fix critical bugs. $890K revenue unlock.

---

### Sprint 8 (Weeks 3-4): "Intelligence & Prevention Layer"

**Theme:** Connect LLM chat, start prevention engine, begin MiroFish integration.

| # | Task | Priority | Effort | Bible Coverage Gain |
|---|---|---|---|---|
| 8.1 | **LIDA Chat -- connect to Ollama SSE stream** -- Backend `ai.stream` endpoint exists; wire frontend LidaChat to use EventSource for real conversational analytics | P0 | 3 days | Intelligence module operational |
| 8.2 | **Prevention engine v1** -- Implement 5 core prevention rules: pre-submission eligibility check, modifier validation, auth verification, documentation completeness, COB order check | P0 | 5 days | +5 prevention rules (Doc 5 Part B) |
| 8.3 | **Contract variance engine** -- Compare ERA `paid_amount` against `payer_contract_rate.expected_rate`; surface underpayments as diagnostic findings | P1 | 3 days | +$500K-1.5M recovery |
| 8.4 | **MiroFish seed pipeline** -- Build ETL from NEXUS PostgreSQL to MiroFish graph: payer profiles, provider profiles, claim archetypes | P1 | 5 days | Foundation for simulation |
| 8.5 | **MECE Report Builder -- connect to MiroFish ReportAgent** -- Use ReportAgent service for automated analytical reports | P2 | 3 days | Report generation operational |
| 8.6 | **Batch claim operations backend** -- Create `/claims/batch` endpoints: mass correction, mass resubmission, mass appeal | P1 | 4 days | +$200K-500K labor savings |
| 8.7 | **Settings backend v1** -- Create `/settings/billing-rules` and `/settings/ai-config` CRUD routers | P2 | 3 days | Admin functional |
| 8.8 | **Denial prediction model v1** -- Train gradient-boosted classifier on historical denial data (56K records); predict denial probability per claim pre-submission | P1 | 5 days | +5 prediction items (Doc 4) |

**Sprint 8 Target:** Raise Bible compliance from 23% to 35%. LIDA AI operational. Prevention engine launched. MiroFish integration begun.

---

### Sprint 9 (Weeks 5-6): "Specialty Modules & Simulation"

**Theme:** Light up specialty modules, run first MiroFish simulations, expand automation rules.

| # | Task | Priority | Effort | Bible Coverage Gain |
|---|---|---|---|---|
| 9.1 | **Patient Access backend** -- Create `/insurance` router: eligibility check (271 data), prior auth management, benefit verification | P0 | 5 days | +15 metrics real (Doc 1 section 1.9) |
| 9.2 | **MiroFish simulation v1** -- Run first simulation: 50 Payer Agents + 200 Provider Agents; "what if modifier error rate drops 30%?" | P0 | 5 days | Simulation gap closed |
| 9.3 | **Coding module backend** -- Create `/coding` router: coding audit against NCCI/MUE edits, compliance scoring, charge optimization suggestions | P1 | 5 days | +14 metrics real (Doc 1 section 1.10) |
| 9.4 | **EVV backend** -- Create `/evv` router: visit validation, fraud detection, state mandate compliance checking | P1 | 4 days | +5 EVV pages functional |
| 9.5 | **Expand automation to 20 rules** -- Add: auto-resubmission, auto-eligibility-recheck, auto-coding-fix, auto-CDI-query, auto-collection-prioritization, auto-ERA-posting, etc. | P1 | 5 days | +13 automation items (Doc 5) |
| 9.6 | **Revenue forecast with simulation bands** -- Replace simple time-series with MiroFish Monte Carlo simulation; show 10th/50th/90th percentile bands | P2 | 3 days | +3 prediction items (Doc 4) |
| 9.7 | **"Simulate" button on diagnostic findings** -- UI button triggers MiroFish what-if simulation for any diagnostic finding | P2 | 3 days | Diagnostic-to-simulation flow |
| 9.8 | **Staff productivity dashboard** -- Connect user-performance + team-metrics to cross-module tracking | P2 | 2 days | +10 operational metrics |

**Sprint 9 Target:** Raise Bible compliance from 35% to 50%. All specialty modules functional. MiroFish simulation delivering first predictions. Automation rules tripled from 7 to 20.

---

### Post-Sprint 9 Trajectory

| Milestone | Target Date | Bible Compliance |
|---|---|---|
| Sprint 7 complete | +2 weeks | 28% |
| Sprint 8 complete | +4 weeks | 35% |
| Sprint 9 complete | +6 weeks | 50% |
| Sprint 10: Prediction models + advanced automation | +8 weeks | 60% |
| Sprint 11: Full prevention engine + payer simulation | +10 weeks | 70% |
| Sprint 12: Operational excellence + charge capture | +12 weeks | 80% |
| V1.0 Bible-complete target | +16 weeks | 90%+ |

---

## APPENDIX A: FILE REFERENCE

| Category | Key Files |
|---|---|
| Backend API routers | `/backend/app/api/v1/*.py` (16 files) |
| Backend services | `/backend/app/services/*.py` (9 files) |
| Backend models | `/backend/app/models/*.py` (9 files) |
| Frontend API layer | `/frontend/src/services/api.js` |
| Frontend routes | `/frontend/src/App.jsx` |
| Frontend sidebar | `/frontend/src/components/layout/Sidebar.jsx` |
| RCM Bible | `/docs/bible-1-descriptive-analytics.md` through `bible-5-automation-and-prevention.md` |
| MiroFish integration plan | `/docs/mirofish-integration-plan.md` |
| MiroFish services | `/mirofish/backend/app/services/*.py` (13 files) |

## APPENDIX B: CRITICAL BUGS REQUIRING IMMEDIATE FIX

1. **`api.diagnostics` duplicate key** (api.js lines ~747 and ~811): The JavaScript object `api` has two `diagnostics` properties. The second overwrites the first, making `getSummary`, `getPayerDiagnostic`, and `getClaimDiagnostic` unreachable. **Fix: merge into single block.**

2. **`dashboard.getKPIs` and `dashboard.getRevenueTrend` are pure mock**: These methods use `simulateLatency()` and inline synthetic data. They do not call any backend endpoint. The Command Center -- the first page users see -- shows fake numbers. **Fix: create aggregation endpoint or remove mock layer.**

3. **`claims.list` mock fallback silently activates**: If the backend is slow or returns an error, the frontend silently falls back to `claimsData` JSON import without any user indication. Users may be looking at stale synthetic data without knowing. **Fix: show error state or loading indicator instead of silent fallback.**
