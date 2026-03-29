# Tasks: NEXUS RCM Intelligence Platform

**Input**: Design documents from `.specify/features/nexus-rcm-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Infrastructure (COMPLETED)

**Purpose**: Project initialization, database, and core framework

- [x] T001 [P] Initialize FastAPI backend with async SQLAlchemy and PostgreSQL connection in `backend/app/main.py`
- [x] T002 [P] Initialize React + Vite frontend with Tailwind CSS dark theme (`th-*` tokens) in `frontend/`
- [x] T003 [P] Create PostgreSQL schema with all 12+ tables (claims, denials, era_payments, bank_reconciliation, eligibility_271, prior_auth, claim_lines, payer_master, providers, root_cause_analysis, payer_contract_rate, automation_actions)
- [x] T004 [P] Load seed data: 500K claims, 56K denials, 315K ERA payments, 50 payers, 200 providers, 800 contract rates
- [x] T005 Configure API routing with 15 routers in `backend/app/api/v1/` (analytics, ar, claims, collections, collections_extended, crs, denials, diagnostics, forecast, graph, payments, reconciliation, root_cause, ai, auth)
- [x] T006 [P] Configure Ollama LLM integration (llama3 8B) at localhost:11434 in `backend/app/services/ai_insights.py`

**Checkpoint**: Infrastructure complete -- all tables populated, all routers registered, Ollama connected.

---

## Phase 2: Core Services (COMPLETED)

**Purpose**: Business logic engines that ALL user stories depend on

- [x] T007 Implement zero-prior 7-step root cause engine in `backend/app/services/root_cause_service.py` -- evidence chain: eligibility -> auth -> coding -> payer history -> submission gap -> contract -> provider pattern
- [x] T008 Backfill 56K root cause analysis records with independent evidence chains in `root_cause_analysis` table
- [x] T009 Implement 5-level graph drill-down in `backend/app/services/graph_query_service.py` -- Revenue -> Payer -> Category -> Root Cause -> Claim -> Full Context via claim_id JOINs
- [x] T010 Implement automation engine with 7 rules in `backend/app/services/automation_engine.py` -- diagnostic-triggered evaluation, Tier 1-4 classification, approve/reject workflow
- [x] T011 [P] Implement diagnostic service in `backend/app/services/diagnostic_service.py` -- anomaly detection, threshold evaluation, severity classification
- [x] T012 [P] Implement triangulation service in `backend/app/services/triangulation_service.py` -- cross-source data correlation via claim_id
- [x] T013 [P] Implement ADTP service in `backend/app/services/adtp_service.py` -- Average Days To Pay by payer with trend calculation
- [x] T014 [P] Implement CRS scoring in `backend/app/services/crs.py` -- Claim Risk Score from eligibility, auth, coding, payer history, submission gap factors
- [x] T015 [P] Implement appeal generator in `backend/app/services/appeal_generator.py` -- denial appeal letter drafting with evidence citations

**Checkpoint**: All 9 services operational. Root cause engine producing evidence chains. Graph drill-down traversing 5 levels.

---

## Phase 3: Revenue Analytics -- US1 (COMPLETED)

**Goal**: RCM Director can check revenue health across 4 tabs with graph drill-down.

- [x] T016 [P] [US1] Build Revenue Analytics Layout with 4-tab container in `frontend/src/features/analytics/layouts/RevenueAnalyticsLayout.jsx`
- [x] T017 [P] [US1] Build Revenue Overview tab with KPIs (total revenue, net collection rate, payer mix) from `/api/v1/analytics/revenue-summary`
- [x] T018 [P] [US1] Build Revenue Reconciliation tab in `frontend/src/features/finance/pages/RevenueReconciliation.jsx` -- charge-to-payment matching
- [x] T019 [P] [US1] Build AR Aging tab with root cause overlays in `frontend/src/features/analytics/pages/ARAgingPage.jsx`
- [x] T020 [P] [US1] Build Cash Flow tab in `frontend/src/features/analytics/pages/CashFlowPage.jsx` -- daily/weekly/monthly receipts vs ADTP forecast
- [x] T021 [US1] Wire investigation panel to graph_query_service -- click KPI -> drill through 5 levels to individual claim
- [x] T022 [US1] Implement AR Aging root cause distribution per bucket from root_cause_service

**Checkpoint**: Revenue Analytics fully functional with 4 tabs, real data, graph drill-down.

---

## Phase 4: Denial Analytics -- US2 (COMPLETED)

**Goal**: Denial Analyst can investigate root causes through 4 tabs with evidence chains.

- [x] T023 [P] [US2] Build Denial Analytics Layout with 4-tab container in `frontend/src/features/analytics/layouts/DenialAnalyticsLayout.jsx`
- [x] T024 [P] [US2] Redesign Denial Overview tab in `frontend/src/features/denials/pages/DenialAnalytics.jsx` -- denial rate, top CARC codes, volume trends
- [x] T025 [P] [US2] Build Root Cause tab in `frontend/src/features/analytics/pages/RootCauseIntelligence.jsx` -- zero-prior 7-step evidence chain display
- [x] T026 [P] [US2] Build Payer Patterns tab in `frontend/src/features/denials/pages/PayerVariance.jsx` -- payer-specific denial behavior and variance
- [x] T027 [US2] Build Trends tab with time-series denial rate by category and anomaly detection
- [x] T028 [US2] Build universal claim detail page in `frontend/src/features/analytics/pages/ClaimRootCauseDetail.jsx` -- denial + RCA + ERA + eligibility + auth + CPT lines

**Checkpoint**: Denial Analytics fully functional. Root cause evidence chains displaying with confidence scores.

---

## Phase 5: Payment Intelligence -- US3 (COMPLETED)

**Goal**: Payment Poster can reconcile ERA vs bank across 4 tabs.

- [x] T029 [P] [US3] Build Payment Intelligence Layout with 4-tab container in `frontend/src/features/analytics/layouts/PaymentIntelligenceLayout.jsx`
- [x] T030 [P] [US3] Build Payment Overview tab in `frontend/src/features/payments/pages/PaymentDashboard.jsx` -- payment volume, ADTP, underpayment rate
- [x] T031 [P] [US3] Build Payer Profiles tab in `frontend/src/features/finance/pages/PayerPerformance.jsx` -- payer payment behavior and ADTP
- [x] T032 [P] [US3] Build Contract Audit tab in `frontend/src/features/payments/pages/ContractAudit.jsx` -- expected vs actual by CPT and payer
- [x] T033 [US3] Build ERA-Bank Recon tab in `frontend/src/features/payments/pages/ERABankRecon.jsx` -- match/unmatch/partial status grid
- [x] T034 [US3] Build payer reconciliation claims drill-down page

**Checkpoint**: Payment Intelligence fully functional. ERA-Bank reconciliation matching with drill-down.

---

## Phase 6: Frontend Consolidation (COMPLETED)

**Goal**: Clean up sidebar, remove duplicate AI sections, eliminate mock data.

- [x] T035 Restructure sidebar from 55 items to 15 items in `frontend/src/components/layout/Sidebar.jsx`
- [x] T036 Remove 35 AI sections across pages, enforce max 1 per page (Constitution Principle V)
- [x] T037 [P] Implement independent data randomization for enrichment (no correlated fake patterns)
- [x] T038 [P] Remove all hardcoded mock data arrays from production components (Constitution Principle VII)

**Checkpoint**: Sidebar clean, one AI voice per page, no mock data in production paths.

---

## Phase 7: Claims Pipeline -- US4 (PENDING)

**Goal**: Claims team can track lifecycle stages with CRS scoring overlays.

- [ ] T039 [P] [US4] Build Claims Pipeline lifecycle visualization in `frontend/src/features/analytics/layouts/ClaimsPipelineLayout.jsx` -- stages: Created -> Scrubbed -> Submitted -> Acknowledged -> Adjudicated -> Paid/Denied
- [ ] T040 [P] [US4] Create backend endpoints for claims lifecycle stage counts in `backend/app/api/v1/claims.py`
- [ ] T041 [US4] Integrate CRS score overlay on pipeline view -- visual flagging for CRS > 0.7 from `/api/v1/crs/`
- [ ] T042 [US4] Add filter controls: payer, provider, date range, CRS threshold with URL query param persistence
- [ ] T043 [US4] Wire claim click-through to universal claim detail page with CRS breakdown

**Checkpoint**: Claims Pipeline shows lifecycle stages with CRS overlays. High-risk claims visually flagged.

---

## Phase 8: Command Center -- US5 (PENDING)

**Goal**: Single-screen overview with investigation panel for KPI anomalies.

- [ ] T044 [P] [US5] Build Command Center widget grid in `frontend/src/features/dashboard/pages/CommandCenter.jsx` -- revenue sparkline, denial rate, AR aging, cash flow, automation summary
- [ ] T045 [US5] Wire each widget to real API endpoints (compose from existing analytics endpoints)
- [ ] T046 [US5] Implement investigation panel slide-in triggered by KPI anomaly click -- shows diagnostic_service findings
- [ ] T047 [US5] Add "View Details" navigation from investigation panel to relevant analytics page with context preservation

**Checkpoint**: Command Center renders real data. Investigation panel opens on anomaly click.

---

## Phase 9: Work Centers -- US6 (PENDING)

**Goal**: Operational staff can work prioritized queues with one-click actions.

- [ ] T048 [P] [US6] Enhance Denial Work Center queue sorting by recoverable amount with automation_engine recommendations in `frontend/src/features/workcenters/layouts/DenialWorkCenterLayout.jsx`
- [ ] T049 [P] [US6] Enhance Claims Work Center auto-fix candidates display with proposed corrections in `frontend/src/features/workcenters/layouts/ClaimsWorkCenterLayout.jsx`
- [ ] T050 [P] [US6] Enhance Collections Work Center with aged account prioritization and payment probability scoring in `frontend/src/features/workcenters/layouts/CollectionsWorkCenterLayout.jsx`
- [ ] T051 [P] [US6] Enhance Payment Work Center ERA processing and posting workflow in `frontend/src/features/workcenters/layouts/PaymentWorkCenterLayout.jsx`
- [ ] T052 [US6] Implement audit trail logging for all work center actions (approve/reject/resubmit/post) in `backend/app/api/v1/diagnostics.py`

**Checkpoint**: All 4 work centers operational with prioritized queues and audit trails.

---

## Phase 10: Automation Dashboard -- US7 (PENDING)

**Goal**: Automation Manager can govern rules, approve actions, track performance.

- [ ] T053 [P] [US7] Build rule status grid in `frontend/src/features/workcenters/pages/AutomationDashboard.jsx` -- 7 rules with learning/active/paused status, trigger count, success rate
- [ ] T054 [US7] Implement Tier 2 action approval workflow -- pending queue with one-click approve/reject
- [ ] T055 [US7] Add rule performance detail view -- connected diagnostic, trigger conditions, historical outcomes
- [ ] T056 [US7] Expand automation rules from 7 to 20+ in `backend/app/services/automation_engine.py` -- add rules for underpayment detection, timely filing, eligibility re-check, coding pattern alerts

**Checkpoint**: Automation Dashboard showing all rules with governance workflow.

---

## Phase 11: LIDA AI Chat + Revenue Forecast -- US8 (PENDING)

**Goal**: CFO can query RCM data via natural language and view revenue projections.

- [ ] T057 [P] [US8] Optimize Ollama prompts per page context in `backend/app/services/ai_insights.py` -- inject page-specific database statistics into structured prompt templates
- [ ] T058 [US8] Enhance LIDA Chat in `frontend/src/features/lida/pages/LidaChat.jsx` -- parse user question -> select relevant SQL queries -> inject results into Ollama prompt -> return narrative with source citations
- [ ] T059 [US8] Build 3-layer revenue forecast in `frontend/src/features/intelligence/pages/RevenueForecast.jsx` -- Layer 1: Gross charge time-series, Layer 2: Denial-adjusted net, Layer 3: ADTP-timed cash realization
- [ ] T060 [US8] Create forecast backend endpoints in `backend/app/api/v1/forecast.py` -- 30/60/90 day projections with confidence intervals (10th/50th/90th percentile)
- [ ] T061 [US8] Add forecast anomaly click-through -- contributing factors (payer mix shift, denial rate change, ADTP variance)

**Checkpoint**: LIDA returns evidence-backed answers. Forecast shows 3-layer projections with confidence bands.

---

## Phase 12: Prevention Engine -- US9 (PENDING)

**Goal**: System proactively identifies at-risk claims before submission.

- [ ] T062 [P] [US9] Create prevention_engine service in `backend/app/services/prevention_engine.py` -- timely filing deadline monitor, eligibility re-verification trigger, auth expiration alert
- [ ] T063 [P] [US9] Create prevention API router in `backend/app/api/v1/prevention.py` -- endpoints for at-risk claims, prevention alerts, prevention metrics
- [ ] T064 [US9] Implement timely filing monitor -- query claims where (filing_deadline - today) < 5 days and status != SUBMITTED
- [ ] T065 [US9] Implement eligibility re-verification trigger -- detect coverage changes since last eligibility_271 check
- [ ] T066 [US9] Implement auth expiration alert -- detect prior_auth expiring within 7 days of scheduled procedure
- [ ] T067 [US9] Surface prevention alerts in Claims Pipeline and Command Center widgets
- [ ] T068 [US9] Create prevention metrics dashboard -- alerts generated, interventions taken, revenue saved

**Checkpoint**: Prevention engine identifies at-risk claims 3+ business days before deadline. Alerts surface in pipeline and command center.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Quality, performance, and remaining cleanup across all stories.

- [ ] T069 [P] Eliminate all remaining mock data from frontend components -- audit every page for hardcoded arrays
- [ ] T070 [P] Implement loading skeleton -> real data -> FALLBACK_* pattern consistently across all pages
- [ ] T071 End-to-end testing: verify every analytics page renders real data with no $0, NaN, or empty states
- [ ] T072 [P] Performance optimization: ensure all API endpoints respond in <500ms, pages load in <2s (p95)
- [ ] T073 [P] Verify graph drill-down works end-to-end on all 4 analytics sections (Revenue, Denial, Payment, Claims)
- [ ] T074 Page-by-page QA with real API calls and screenshots for all 40+ pages
- [ ] T075 Security hardening: validate all API inputs, enforce auth on all endpoints

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies -- COMPLETED
- **Phase 2 (Core Services)**: Depends on Phase 1 -- COMPLETED
- **Phase 3-5 (Analytics P1)**: Depend on Phase 2 -- COMPLETED
- **Phase 6 (Consolidation)**: Depends on Phase 3-5 -- COMPLETED
- **Phase 7 (Claims Pipeline)**: Depends on Phase 2 (CRS service) -- NEXT PRIORITY
- **Phase 8 (Command Center)**: Depends on Phases 3-5 (analytics endpoints exist) -- can parallel with Phase 7
- **Phase 9 (Work Centers)**: Depends on Phase 2 (automation engine) -- can parallel with Phase 7-8
- **Phase 10 (Automation)**: Depends on Phase 2 (automation engine) -- can parallel with Phase 9
- **Phase 11 (AI + Forecast)**: Depends on Phases 3-5 (data layer stable) -- can parallel with Phase 7-10
- **Phase 12 (Prevention)**: Depends on Phases 2, 7 (services + claims pipeline) -- LAST
- **Phase 13 (Polish)**: Depends on all previous phases

### Parallel Opportunities

- Phases 7, 8, 9, 10, 11 can all proceed in parallel (different files, independent features)
- Within each phase, tasks marked [P] can run in parallel
- Phase 12 (Prevention) is the only phase with hard dependency on Phase 7

---

## Implementation Strategy

### Current State (Phases 1-6 DONE)

The platform has a fully operational backend (15 routers, 50+ endpoints, 9 services), complete P1 analytics (Revenue 4 tabs, Denial 4 tabs, Payment 4 tabs), consolidated sidebar (15 items), one AI voice per page, and no mock data in production paths.

### Next Priority (Phases 7-10)

Focus on completing the operational layer: Claims Pipeline lifecycle visualization, Command Center unified view, Work Center queue enhancements, and Automation Dashboard governance. These phases can proceed in parallel.

### Final Phase (Phases 11-13)

AI optimization, 3-layer revenue forecast, Prevention engine (net-new Layer 3), and comprehensive QA across all 40+ pages.
