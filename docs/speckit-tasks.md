# SPECKIT TASKS -- NEXUS RCM Sprint Breakdown

> **Generated:** 2026-03-27
> **Source:** speckit-analysis.md + PRD.md
> **Scope:** 3 sprints, 6 weeks, 95 tasks across 6 agents
> **Bible Compliance Target:** 23% --> 50% by Sprint 9 completion

---

## P0 HOTFIX (Do First -- 30 minutes)

- [ ] **TASK-001**: Fix duplicate `diagnostics` key in api.js
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 0.5 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** The `api.diagnostics` object contains all four methods: `getSummary`, `getFindings`, `getPayerDiagnostic`, `getClaimDiagnostic`. Verified by calling each method from browser console and receiving a response (not `undefined`).
  - **Files to modify:** `frontend/src/services/api.js` (merge duplicate `diagnostics` blocks at ~line 747 and ~line 811 into a single object)

- [ ] **TASK-002**: Fix dead navigation tabs (Claims Work Center scrub tab, Denial Analytics trends tab)
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 0.5 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Every sidebar link and every tab within a layout navigates to a valid route that renders a component. Zero `<Route>` elements resolve to a blank page. Manually click every tab in Claims Work Center, Denial Work Center, and Denial Analytics to confirm.
  - **Files to modify:** `frontend/src/App.jsx`, `frontend/src/features/analytics/layouts/DenialAnalyticsLayout.jsx`, `frontend/src/features/claims/pages/ClaimsLayout.jsx`

- [ ] **TASK-003**: Add default redirects for all layout routes (sidebar click leads to blank page)
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 0.5 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Navigating to any parent route (e.g., `/analytics/revenue`, `/work/claims`, `/work/denials`) automatically redirects to the first tab (e.g., `/analytics/revenue/overview`). No blank pages on any sidebar click.
  - **Files to modify:** `frontend/src/App.jsx`, `frontend/src/features/analytics/layouts/RevenueAnalyticsLayout.jsx`, `frontend/src/features/analytics/layouts/PaymentIntelligenceLayout.jsx`, `frontend/src/features/analytics/layouts/ClaimsPipelineLayout.jsx`

---

## SPRINT 7: Foundation Fix (Week 1-2)

**Theme:** Fix broken connections, eliminate trust gaps, wire mock pages to real APIs.
**Target:** Raise REAL API coverage from 40% to 55%. Fix critical bugs. $890K revenue unlock potential.

---

### Agent: Backend

- [ ] **TASK-100**: Create `/dashboard/summary` aggregation endpoint
  - **Agent:** Backend
  - **Priority:** P0
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/dashboard/summary` returns a JSON object aggregating: total_revenue (from `analytics.getPipeline`), denial_rate (from `denials.getSummary`), clean_claim_rate (from `crs.getSummary`), ar_days (from `ar.getSummary`), net_collection_rate (from `payments.getSummary`), and trend deltas for each. Response time under 2 seconds.
  - **Files to modify:** Create `backend/app/api/v1/dashboard.py`, register in `backend/app/api/v1/__init__.py` or main router registration file

- [ ] **TASK-101**: Create `/tickets` CRUD router with PostgreSQL table
  - **Agent:** Backend
  - **Priority:** P2
  - **Effort:** 8 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/tickets` lists tickets with pagination. `GET /api/v1/tickets/{id}` returns a single ticket. `POST /api/v1/tickets` creates a ticket with fields: title, description, severity, status, linked_diagnostic_id, assigned_to. `PATCH /api/v1/tickets/{id}` updates status/assignment. Migration creates `tickets` table. All endpoints return correct HTTP status codes.
  - **Files to modify:** Create `backend/app/api/v1/tickets.py`, create migration for `tickets` table, add model in `backend/app/models/`

- [ ] **TASK-102**: Create `/users` list endpoint on auth router
  - **Agent:** Backend
  - **Priority:** P2
  - **Effort:** 3 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/auth/users` returns a paginated list of all users with id, username, email, role, last_login. `GET /api/v1/auth/users/{id}` returns a single user profile. Excludes password hashes from response.
  - **Files to modify:** `backend/app/api/v1/auth.py`

- [ ] **TASK-103**: Create underpayment auto-dispute generation endpoint
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `POST /api/v1/payments/disputes/generate` accepts a list of underpayment claim IDs (from `payments.getSilentUnderpayments` results), generates dispute records with: claim_id, expected_amount, paid_amount, variance, dispute_reason, payer_id, generated_letter. Returns dispute IDs. `GET /api/v1/payments/disputes` lists all generated disputes with status tracking.
  - **Files to modify:** `backend/app/api/v1/payments.py`, `backend/app/services/triangulation_service.py`, create dispute model/migration

- [ ] **TASK-104**: Add appeal outcome analytics endpoint
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/analytics/appeal-outcomes` returns: win_rate_by_carc (breakdown of appeal win rates per CARC code), win_rate_by_payer, avg_days_to_resolution, total_recovered_amount, top_winning_strategies (ranked list of appeal reasons that produce highest win rates). Data sourced from `appeals` and `denials` tables.
  - **Files to modify:** `backend/app/api/v1/analytics.py`

- [ ] **TASK-105**: Remove silent mock fallback from claims endpoint error handling
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 2 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** When `/api/v1/claims` returns an error or times out, the backend returns a proper HTTP error code (500/503) with an error message body, not synthetic data. No `simulateLatency` or mock data generation in the claims router.
  - **Files to modify:** `backend/app/api/v1/claims.py`

- [ ] **TASK-106**: Create `/claims/batch` endpoints for mass operations
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 10 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `POST /api/v1/claims/batch/correct` accepts an array of {claim_id, corrections[]} and applies corrections, returning success/failure per claim. `POST /api/v1/claims/batch/resubmit` resubmits an array of claim IDs, returning batch_id for tracking. `POST /api/v1/claims/batch/appeal` generates appeals for an array of denial IDs. Each endpoint validates input, enforces max batch size of 500, and logs actions to `automation_actions`.
  - **Files to modify:** `backend/app/api/v1/claims.py`, `backend/app/services/automation_engine.py`

- [ ] **TASK-107**: Create workflow log endpoint combining audit + appeal history
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/denials/workflow-log` returns a chronological list of all denial-related actions: status changes, appeal submissions, appeal outcomes, automation actions, manual interventions. Supports filtering by claim_id, payer_id, date_range, action_type. Paginated with 50 items per page default.
  - **Files to modify:** `backend/app/api/v1/denials.py`

---

### Agent: Frontend

- [ ] **TASK-200**: Wire CommandCenter KPI cards to `/dashboard/summary` endpoint
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 4 hours
  - **Dependencies:** TASK-100
  - **Acceptance Criteria:** CommandCenter KPI cards (total revenue, denial rate, clean claim rate, AR days, net collection rate) display data from `api.dashboard.getSummary()` instead of `mockCommandCenterData`. Loading skeleton shown while fetching. Error state displayed if API fails (not mock fallback). Trend arrows reflect real period-over-period deltas.
  - **Files to modify:** `frontend/src/features/dashboard/pages/CommandCenter.jsx`, `frontend/src/services/api.js` (add `dashboard.getSummary` method)

- [ ] **TASK-201**: Wire PaymentPosting page to existing backend ERA endpoints
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** PaymentPosting page calls `api.payments.getERAList()` for ERA records and `api.payments.postPayment()` for posting actions. All inline mock data removed. Table populates from real API response. Post-payment action updates the record status on screen.
  - **Files to modify:** `frontend/src/features/payments/pages/PaymentPosting.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-202**: Wire ERAProcessing page to existing backend ERA endpoints
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** ERAProcessing page calls `api.payments.getERAList()` with filters for unprocessed ERAs. Inline mock data removed. ERA detail view shows data from `api.payments.getERADetail()`. Processing action triggers real backend call.
  - **Files to modify:** `frontend/src/features/payments/pages/ERAProcessing.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-203**: Wire DenialWorkflowLog to real audit data
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** TASK-107
  - **Acceptance Criteria:** DenialWorkflowLog page calls `api.denials.getWorkflowLog()` instead of using inline mock data. Supports filter by claim ID, payer, date range. Timeline visualization renders real action history.
  - **Files to modify:** `frontend/src/features/denials/pages/DenialWorkflowLog.jsx` (or equivalent file in denials feature), `frontend/src/services/api.js`

- [ ] **TASK-204**: Build appeal outcome analytics view
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** TASK-104
  - **Acceptance Criteria:** New component accessible from Denial Analytics section showing: bar chart of win rate by CARC code, pie chart of win rate by payer, KPI cards for total recovered amount and avg resolution time, table of top winning strategies. All data from `api.analytics.getAppealOutcomes()`.
  - **Files to modify:** Create component in `frontend/src/features/denials/pages/` or `frontend/src/features/analytics/pages/`, update layout to include tab, `frontend/src/services/api.js`

- [ ] **TASK-205**: Wire TicketHub to real backend `/tickets` endpoints
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 4 hours
  - **Dependencies:** TASK-101
  - **Acceptance Criteria:** TicketHub page calls `api.tickets.list()`, `api.tickets.getById()`, `api.tickets.create()` instead of imported `ticketsData`. Create ticket form submits to backend. Ticket list refreshes from API on page load.
  - **Files to modify:** `frontend/src/features/lida/pages/TicketHub.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-206**: Wire UserManagement to real `/auth/users` endpoint
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 3 hours
  - **Dependencies:** TASK-102
  - **Acceptance Criteria:** UserManagement page calls `api.auth.listUsers()` instead of imported `usersData`. User list displays real user records. Role assignment calls backend update endpoint.
  - **Files to modify:** `frontend/src/features/settings/pages/UserManagement.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-207**: Replace silent mock fallback in ClaimsWorkQueue with error state
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 3 hours
  - **Dependencies:** TASK-105
  - **Acceptance Criteria:** When `api.claims.list()` fails, ClaimsWorkQueue shows an error banner with "Unable to load claims. Please retry." and a retry button. No silent fallback to `claimsData` JSON. Loading state shown during fetch.
  - **Files to modify:** `frontend/src/features/claims/pages/ClaimsWorkQueue.jsx`

- [ ] **TASK-208**: Replace silent mock fallback in ClaimsOverview with error state
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 2 hours
  - **Dependencies:** TASK-105
  - **Acceptance Criteria:** Same pattern as TASK-207. Error state instead of silent mock fallback. Loading skeleton while fetching.
  - **Files to modify:** `frontend/src/features/claims/pages/ClaimsOverview.jsx`

- [ ] **TASK-209**: Wire ContractManager to existing payment/contract endpoints
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 5 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** ContractManager page displays contract rates from `api.payments.getTriangulationSummary()`. Inline mock data removed. Table shows payer, CPT code, contracted rate, effective date from `payer_contract_rate` data.
  - **Files to modify:** `frontend/src/features/payments/pages/ContractManager.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-210**: Wire PaymentPortal page to collections backend
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 4 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** PaymentPortal page calls `api.collections.getSummary()` and `api.collections.getQueue()` for patient payment data. Inline mock data removed. Payment history table populates from real data.
  - **Files to modify:** `frontend/src/features/collections/pages/PaymentPortal.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-211**: Add graph drill-down integration to Automation Dashboard
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Clicking any automation rule finding on the AutomationDashboard opens a side panel showing claim-level detail via `api.graph.getClaimFullContext()`. User can drill from rule match to affected claims to individual claim detail.
  - **Files to modify:** `frontend/src/features/workcenters/pages/AutomationDashboard.jsx`

- [ ] **TASK-212**: Wire AutoFixCenter to CRS and automation endpoints
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** AutoFixCenter page calls `api.crs.getQueue()` for claims with auto-fixable issues and `api.automation.getPending()` for pending fixes. Displays list of auto-fix candidates with approve/reject buttons calling `api.automation.approve()` / `api.automation.reject()`. No hardcoded mock data.
  - **Files to modify:** `frontend/src/features/claims/pages/AutoFixCenter.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-213**: Wire BatchActions to new batch endpoints
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-106
  - **Acceptance Criteria:** BatchActions page shows claim selection interface with checkboxes. "Mass Correct", "Mass Resubmit", and "Mass Appeal" buttons call respective `/claims/batch/*` endpoints. Progress indicator shows completion status. Results table shows per-claim success/failure.
  - **Files to modify:** `frontend/src/features/claims/pages/BatchActions.jsx`, `frontend/src/services/api.js`

---

### Agent: Data

- [ ] **TASK-300**: Validate all 83 backend endpoints return correct data shapes
  - **Agent:** Data
  - **Priority:** P0
  - **Effort:** 8 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Create a test script that calls every endpoint in the 15 routers and verifies: HTTP 200 response, response body matches expected schema (correct keys, correct types), no empty arrays for tables with known data. Test report lists pass/fail per endpoint. All currently-implemented endpoints pass.
  - **Files to modify:** Create `backend/tests/test_endpoint_validation.py`

- [ ] **TASK-301**: Audit and document all mock data imports in frontend
  - **Agent:** Data
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Produce a checklist file listing every import of mock/synthetic data in the frontend codebase: file path, import name, which component uses it, and whether a real API endpoint exists. This becomes the tracking document for mock removal across sprints.
  - **Files to modify:** Create `docs/mock-data-audit.md`

- [ ] **TASK-302**: Verify `payer_contract_rate` data completeness for top 10 payers
  - **Agent:** Data
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Query `payer_contract_rate` table and verify: at least 50 CPT codes have rates for each of the top 10 payers by claim volume, no NULL contracted_rate values, effective_date is populated, rates are within reasonable bounds ($0.01 to $50,000). Report any gaps.
  - **Files to modify:** Create `backend/scripts/validate_contract_rates.py`

- [ ] **TASK-303**: Create seed data for `tickets` table
  - **Agent:** Data
  - **Priority:** P2
  - **Effort:** 2 hours
  - **Dependencies:** TASK-101
  - **Acceptance Criteria:** Insert 25 realistic tickets linked to existing diagnostic findings. Each ticket has: descriptive title, severity (Critical/Warning/Info), status (Open/In Progress/Resolved), linked_diagnostic_id referencing a real diagnostic, assigned_to referencing a real user.
  - **Files to modify:** Create seed script in `backend/scripts/` or migration

---

### Agent: AI/ML

- [ ] **TASK-400**: Verify Ollama LLM connectivity and response quality for all 8 page-specific prompts
  - **Agent:** AI/ML
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Call `ai_insights.py` for each of the 8 page-specific prompt types (command_center, denial_analytics, payment_dashboard, ar_aging, root_cause, collections, revenue_forecast, claims_pipeline). Each returns a coherent multi-sentence response within 10 seconds. Document any prompts producing low-quality or hallucinated output.
  - **Files to modify:** `backend/app/services/ai_insights.py` (tune prompts as needed)

- [ ] **TASK-401**: Fix AI insight fallback generators to produce useful content
  - **Agent:** AI/ML
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** TASK-400
  - **Acceptance Criteria:** When Ollama is unavailable, fallback generators produce data-driven insights (using actual metric values passed as context), not generic placeholder text. Each fallback generates at least 3 specific observations referencing real numbers.
  - **Files to modify:** `backend/app/services/ai_insights.py`

- [ ] **TASK-402**: Expand appeal letter generation with CARC-specific templates
  - **Agent:** AI/ML
  - **Priority:** P2
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `appeal_generator.py` has specific templates for the top 15 CARC codes by volume (CO-4, CO-16, CO-18, CO-27, CO-45, CO-50, CO-97, CO-167, CO-197, PR-1, PR-2, PR-3, PR-27, PR-96, PR-204). Each template includes CARC-specific rebuttal language, required documentation checklist, and regulatory references where applicable.
  - **Files to modify:** `backend/app/services/appeal_generator.py`

---

### Agent: QA

- [ ] **TASK-500**: End-to-end navigation smoke test for all 68 pages
  - **Agent:** QA
  - **Priority:** P0
  - **Effort:** 6 hours
  - **Dependencies:** TASK-002, TASK-003
  - **Acceptance Criteria:** Manually navigate to every route defined in `App.jsx`. Document: page renders (yes/no), data loads from API (yes/no/mock), any console errors, any visual layout issues. Results captured in a spreadsheet or markdown table with pass/fail per page.
  - **Files to modify:** Create `docs/navigation-test-results.md`

- [ ] **TASK-501**: Verify diagnostic panel functionality after api.js fix
  - **Agent:** QA
  - **Priority:** P0
  - **Effort:** 2 hours
  - **Dependencies:** TASK-001
  - **Acceptance Criteria:** After TASK-001 fix, verify: LidaDashboard loads diagnostics via `api.diagnostics.getFindings()`, CommandCenter loads diagnostic findings, payer diagnostic and claim diagnostic pages return data. All four `diagnostics` API methods callable from browser devtools.
  - **Files to modify:** None (testing only)

- [ ] **TASK-502**: Regression test for mock-to-real wiring (Sprint 7 scope)
  - **Agent:** QA
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** TASK-200 through TASK-213
  - **Acceptance Criteria:** For every page wired from mock to real in Sprint 7: verify data loads from API (check network tab), verify no imported mock data files referenced, verify error state renders when backend is stopped, verify loading state renders during fetch. Document results per page.
  - **Files to modify:** Update `docs/navigation-test-results.md`

---

## SPRINT 8: Prevention + Prediction (Week 3-4)

**Theme:** Connect LLM chat, start prevention engine, contract variance detection, begin MiroFish integration.
**Target:** Raise Bible compliance from 28% to 35%. LIDA AI operational. Prevention engine launched.

---

### Agent: Backend

- [ ] **TASK-110**: Create prevention engine v1 -- pre-submission eligibility check rule
  - **Agent:** Backend
  - **Priority:** P0
  - **Effort:** 8 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** New prevention rule `PREV-001` in automation engine: before claim submission, check `insurance_coverage` and `eligibility_271` tables for active coverage. If coverage expired or not found, flag claim with `prevention_action: HOLD` and reason `eligibility_not_verified`. Rule runs on every claim with `status=ready_to_submit`. Logs to `automation_actions`.
  - **Files to modify:** `backend/app/services/automation_engine.py`, potentially create `backend/app/services/prevention_engine.py`

- [ ] **TASK-111**: Create prevention rule -- modifier validation
  - **Agent:** Backend
  - **Priority:** P0
  - **Effort:** 6 hours
  - **Dependencies:** TASK-110
  - **Acceptance Criteria:** Prevention rule `PREV-002`: validate CPT modifier combinations in `claim_lines` against known valid modifier pairs. Flag claims with invalid modifiers (e.g., -26 and -TC on same line, duplicate modifiers, modifier not valid for CPT). Reference NCCI modifier indicators. Log blocked claims with specific modifier error.
  - **Files to modify:** `backend/app/services/prevention_engine.py`

- [ ] **TASK-112**: Create prevention rule -- authorization verification
  - **Agent:** Backend
  - **Priority:** P0
  - **Effort:** 6 hours
  - **Dependencies:** TASK-110
  - **Acceptance Criteria:** Prevention rule `PREV-003`: check `prior_auth` table for valid authorization matching claim's payer + patient + service date + CPT range. If no auth found or auth expired, flag claim. Include auth number in the clearance record if found.
  - **Files to modify:** `backend/app/services/prevention_engine.py`

- [ ] **TASK-113**: Create prevention rule -- documentation completeness check
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-110
  - **Acceptance Criteria:** Prevention rule `PREV-004`: for CPT codes requiring supporting documentation (E/M levels, surgical procedures), verify documentation flags are set on the claim. Flag claims missing required documentation references.
  - **Files to modify:** `backend/app/services/prevention_engine.py`

- [ ] **TASK-114**: Create prevention rule -- COB order verification
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** TASK-110
  - **Acceptance Criteria:** Prevention rule `PREV-005`: for patients with multiple insurance coverages in `insurance_coverage`, verify claim is being submitted to primary payer first. Flag claims where COB order is incorrect or COB data is stale (last verified >90 days ago).
  - **Files to modify:** `backend/app/services/prevention_engine.py`

- [ ] **TASK-115**: Create contract variance engine
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 10 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** New service `contract_variance_service.py` compares `era_payments.paid_amount` against `payer_contract_rate.contracted_rate` for matching payer + CPT code. `GET /api/v1/payments/contract-variance` returns: list of underpaid claims (paid < contracted - tolerance), overpaid claims, total variance by payer, top CPT codes with highest variance. Tolerance configurable (default 2%). Results feed into diagnostic engine as `CONTRACT_UNDERPAYMENT` findings.
  - **Files to modify:** Create `backend/app/services/contract_variance_service.py`, update `backend/app/api/v1/payments.py`, update `backend/app/services/diagnostic_service.py`

- [ ] **TASK-116**: Create `/settings/billing-rules` CRUD router
  - **Agent:** Backend
  - **Priority:** P2
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/settings/billing-rules` lists all billing rules. `POST` creates a rule with fields: rule_name, condition (JSON), action, payer_id (optional), active (boolean). `PUT /api/v1/settings/billing-rules/{id}` updates a rule. `DELETE` soft-deletes. Migration creates `billing_rules` table.
  - **Files to modify:** Create `backend/app/api/v1/settings.py`, create model/migration

- [ ] **TASK-117**: Create `/settings/ai-config` CRUD router
  - **Agent:** Backend
  - **Priority:** P2
  - **Effort:** 4 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/settings/ai-config` returns current AI configuration: ollama_model, temperature, max_tokens, enabled_features (list of which AI features are active). `PUT /api/v1/settings/ai-config` updates configuration. Settings persisted to `ai_config` table or config file.
  - **Files to modify:** Create `backend/app/api/v1/settings.py` (extend), create config persistence

- [ ] **TASK-118**: Implement human-in-the-loop ramp framework for automation engine
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Automation engine tracks rule maturity phase: Learning (days 1-30, all actions require approval), Supervised (days 31-90, actions below confidence threshold auto-execute), Autonomous (day 91+, actions within confidence threshold auto-execute). Phase stored per rule in `automation_actions`. `GET /api/v1/automation/rules` includes `maturity_phase` and `days_active` in response. Phase transition logged.
  - **Files to modify:** `backend/app/services/automation_engine.py`, `backend/app/api/v1/graph.py`

---

### Agent: Frontend

- [ ] **TASK-214**: Connect LidaChat to Ollama SSE stream
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 10 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** LidaChat page sends user messages to `api.ai.stream()` via EventSource/SSE. Responses stream token-by-token into the chat UI. Chat history persists in component state during session. Loading indicator shown while waiting for first token. Error message displayed if Ollama is unavailable. User can send follow-up questions.
  - **Files to modify:** `frontend/src/features/lida/pages/LidaChat.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-215**: Build prevention dashboard component
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 8 hours
  - **Dependencies:** TASK-110 through TASK-114
  - **Acceptance Criteria:** New page or tab showing prevention engine results: total claims screened, claims held (by prevention rule), estimated denials prevented, estimated revenue saved. Table of recently held claims with rule name, claim ID, hold reason, release/override button. Chart showing prevention rate trend over time.
  - **Files to modify:** Create component in `frontend/src/features/claims/pages/` or `frontend/src/features/workcenters/pages/`, update routing in `App.jsx`

- [ ] **TASK-216**: Wire BillingRules settings page to backend
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 4 hours
  - **Dependencies:** TASK-116
  - **Acceptance Criteria:** BillingRules page calls `api.settings.getBillingRules()` to list rules. Create/edit form submits to backend. Toggle switch calls update endpoint to activate/deactivate rules. No hardcoded mock data.
  - **Files to modify:** `frontend/src/features/settings/pages/BillingRules.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-217**: Wire AIConfiguration settings page to backend
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 3 hours
  - **Dependencies:** TASK-117
  - **Acceptance Criteria:** AIConfiguration page loads current config from `api.settings.getAIConfig()`. Form allows editing model, temperature, max_tokens, feature toggles. Save button calls update endpoint. Success toast on save.
  - **Files to modify:** `frontend/src/features/settings/pages/AIConfiguration.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-218**: Build contract variance dashboard view
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** TASK-115
  - **Acceptance Criteria:** New view within Payment Intelligence (or ContractAudit page) showing: total contract variance by payer (bar chart), top underpaid CPT codes (table), variance trend over time (line chart), drill-down to individual underpaid claims. Data from `api.payments.getContractVariance()`.
  - **Files to modify:** `frontend/src/features/payments/pages/ContractAudit.jsx` (extend), `frontend/src/services/api.js`

- [ ] **TASK-219**: Wire MECEReportBuilder to real report generation
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** MECEReportBuilder page allows selecting report type (revenue, denials, AR, payments, payer). Generate button calls `api.ai.generateReport()` (new endpoint using Ollama). Report renders in structured MECE format with sections, metrics, and narrative. Export to PDF button available.
  - **Files to modify:** `frontend/src/features/lida/pages/MECEReportBuilder.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-220**: Add automation rule maturity phase indicators
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** TASK-118
  - **Acceptance Criteria:** AutomationDashboard rule list shows maturity phase badge (Learning/Supervised/Autonomous) next to each rule. Color-coded: yellow for Learning, blue for Supervised, green for Autonomous. Tooltip shows days active and next phase transition date.
  - **Files to modify:** `frontend/src/features/workcenters/pages/AutomationDashboard.jsx`

---

### Agent: Data

- [ ] **TASK-304**: Prepare denial prediction training dataset
  - **Agent:** Data
  - **Priority:** P0
  - **Effort:** 10 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Export from PostgreSQL a labeled dataset of 56K denied + 444K non-denied claims with features: payer_id, CPT codes (primary), ICD-10 (primary), total_charges, provider_specialty, patient_age_bucket, has_auth, cob_present, modifier_count, prior_denial_rate_for_payer_cpt, day_of_week_submitted, days_since_eligibility_check. Target variable: `was_denied` (boolean). Dataset split into 80% train, 10% validation, 10% test. Saved as parquet files.
  - **Files to modify:** Create `backend/scripts/prepare_denial_dataset.py`, output to `data/ml/denial_prediction/`

- [ ] **TASK-305**: Build revenue forecast training dataset
  - **Agent:** Data
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Time-series dataset of daily/weekly net revenue from `era_payments` aggregated by posting_date. Include features: claim_volume, denial_rate_trailing_7d, payer_mix (top 5 payer percentages), avg_charge_per_claim, avg_adtp. At least 12 months of history. Saved as parquet.
  - **Files to modify:** Create `backend/scripts/prepare_forecast_dataset.py`, output to `data/ml/revenue_forecast/`

- [ ] **TASK-306**: Expand root cause CARC code coverage from 11 to 30 codes
  - **Agent:** Data
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `root_cause_service.py` recognizes and provides specific analysis for the top 30 CARC codes by denial volume. Each new CARC code has: human-readable description, typical root cause decomposition (coder/payer/doc/billing/bad_faith percentages), recommended actions, and prevention rule mapping. Currently covers ~11 codes; expand to 30.
  - **Files to modify:** `backend/app/services/root_cause_service.py`

---

### Agent: AI/ML

- [ ] **TASK-403**: Train denial prediction model v1 (gradient-boosted classifier)
  - **Agent:** AI/ML
  - **Priority:** P0
  - **Effort:** 16 hours
  - **Dependencies:** TASK-304
  - **Acceptance Criteria:** Train XGBoost or LightGBM classifier on denial prediction dataset. Model achieves >80% AUC on test set. Feature importance report generated. Model serialized to file (`data/ml/models/denial_prediction_v1.pkl`). Prediction endpoint `POST /api/v1/ai/predict-denial` accepts claim features and returns denial_probability (0-1) and top 3 contributing factors.
  - **Files to modify:** Create `backend/app/services/denial_prediction_service.py`, create `backend/app/api/v1/ai.py` (add endpoint), create training script `backend/scripts/train_denial_model.py`

- [ ] **TASK-404**: Train revenue forecast model v1 (time-series)
  - **Agent:** AI/ML
  - **Priority:** P1
  - **Effort:** 12 hours
  - **Dependencies:** TASK-305
  - **Acceptance Criteria:** Train Prophet or ARIMA model on revenue forecast dataset. Produces 30/60/90-day forecasts with 10th/50th/90th percentile confidence bands. 30-day forecast within +/-5% of actual on backtest. Model serialized. Endpoint `GET /api/v1/forecast/ml-prediction` returns forecast array with confidence bands.
  - **Files to modify:** Create `backend/app/services/revenue_forecast_service.py`, update `backend/app/api/v1/forecast.py`

- [ ] **TASK-405**: Integrate denial prediction into CRS scoring pipeline
  - **Agent:** AI/ML
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-403
  - **Acceptance Criteria:** CRS engine adds a 7th component: `ml_denial_risk` (weight configurable, default 20% of total score). Claims with predicted denial probability >60% get a CRS score bump of +2 points. The ML component is clearly labeled in the CRS breakdown as "ML Predicted Risk" to distinguish from rule-based components.
  - **Files to modify:** `backend/app/services/crs.py`

- [ ] **TASK-406**: Create MECE report generation endpoint using Ollama
  - **Agent:** AI/ML
  - **Priority:** P2
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `POST /api/v1/ai/generate-report` accepts report_type (revenue/denial/ar/payment/payer) and date_range. Aggregates relevant metrics from backend services, formats them into a structured prompt, sends to Ollama, and returns a MECE-structured report with: executive summary, key findings (3-5), supporting data, recommended actions, and risk areas.
  - **Files to modify:** `backend/app/services/ai_insights.py`, `backend/app/api/v1/ai.py`

---

### Agent: MiroFish Integration

- [ ] **TASK-600**: Build ETL pipeline: NEXUS PostgreSQL to MiroFish graph seed
  - **Agent:** MiroFish
  - **Priority:** P1
  - **Effort:** 16 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Python script reads from NEXUS PostgreSQL (payer_master, denials, era_payments, claims, adtp_trend, payer_contract_rate) and outputs MiroFish-compatible seed data: 50 payer profiles with adjudication behavior stats (accept/deny rates per CPT, ADTP distribution, appeal response rates), 200 provider profiles with submission patterns, 10 claim archetypes with feature distributions. Output format compatible with `OasisProfileGenerator`.
  - **Files to modify:** Create `connectors/nexus_to_mirofish_etl.py`, potentially `mirofish/backend/app/services/graph_builder.py`

- [ ] **TASK-601**: Configure MiroFish simulation environment with NEXUS data
  - **Agent:** MiroFish
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** TASK-600
  - **Acceptance Criteria:** MiroFish can load NEXUS seed data and create a simulation with: at least 10 Payer Agents with realistic behavioral profiles, at least 50 Provider Agents, claim submission pipeline. Simulation runs 1 round without errors. `SimulationManager` tracks simulation state correctly.
  - **Files to modify:** `mirofish/backend/app/services/simulation_config_generator.py`, `mirofish/backend/app/services/oasis_profile_generator.py`

- [ ] **TASK-602**: Create NEXUS-MiroFish API bridge for simulation requests
  - **Agent:** MiroFish
  - **Priority:** P2
  - **Effort:** 8 hours
  - **Dependencies:** TASK-601
  - **Acceptance Criteria:** New endpoint `POST /api/v1/simulation/run` in NEXUS backend accepts simulation parameters (scenario_type, agent_count, rounds, variable_overrides). Forwards to MiroFish `SimulationIPCClient`. Returns simulation_id for polling. `GET /api/v1/simulation/{id}/status` returns status and results when complete.
  - **Files to modify:** Create `backend/app/api/v1/simulation.py`, use `mirofish/backend/app/services/simulation_ipc.py`

---

### Agent: QA

- [ ] **TASK-503**: Test all 5 prevention rules with known-good and known-bad claims
  - **Agent:** QA
  - **Priority:** P0
  - **Effort:** 8 hours
  - **Dependencies:** TASK-110 through TASK-114
  - **Acceptance Criteria:** For each prevention rule (PREV-001 through PREV-005): submit a claim that should pass the rule (verify it passes), submit a claim that should fail (verify it is held with correct reason). Document: rule name, test claim ID, expected result, actual result, pass/fail. All 10 test cases pass.
  - **Files to modify:** Create `backend/tests/test_prevention_rules.py`

- [ ] **TASK-504**: Validate LidaChat streaming end-to-end
  - **Agent:** QA
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** TASK-214
  - **Acceptance Criteria:** Open LidaChat, type 5 different RCM-related questions. Verify: each question streams a response, response contains RCM-relevant content (not generic), response completes without truncation, follow-up questions work in context. Test with Ollama running and with Ollama stopped (verify error handling).
  - **Files to modify:** None (testing only)

- [ ] **TASK-505**: Contract variance engine accuracy validation
  - **Agent:** QA
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-115
  - **Acceptance Criteria:** Manually compute expected payment for 20 claims (5 payers x 4 CPT codes) using `payer_contract_rate` table. Compare against contract variance engine output. All 20 claims show correct variance calculation (within $0.01). Verify underpayments flagged at correct tolerance threshold.
  - **Files to modify:** Create `backend/tests/test_contract_variance.py`

---

## SPRINT 9: MiroFish Simulation + Advanced (Week 5-6)

**Theme:** Light up specialty modules, run first simulations, expand automation to 20 rules, ML-powered forecasting.
**Target:** Raise Bible compliance from 35% to 50%. All specialty modules functional. MiroFish simulations running.

---

### Agent: Backend

- [ ] **TASK-120**: Create Patient Access backend -- `/insurance` router
  - **Agent:** Backend
  - **Priority:** P0
  - **Effort:** 16 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/insurance/eligibility/{patient_id}` returns coverage status from `eligibility_271` + `insurance_coverage`. `GET /api/v1/insurance/prior-auth/{patient_id}` returns auth status from `prior_auth`. `POST /api/v1/insurance/verify` triggers eligibility check (stores result). `GET /api/v1/insurance/benefits/{patient_id}` returns benefit details. `GET /api/v1/insurance/history/{patient_id}` returns verification history. All endpoints query real tables.
  - **Files to modify:** Create `backend/app/api/v1/insurance.py`, register router

- [ ] **TASK-121**: Create Coding module backend -- `/coding` router
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 14 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/coding/audit` returns coding accuracy metrics: modifier error rate, DX-CPT mismatch rate, NCCI edit failures, by provider and by CPT group. Computed from `claim_lines` + `denials` where `carc_code` is coding-related (CO-4, CO-16, CO-97, CO-18, etc.). `GET /api/v1/coding/compliance` returns compliance scores by provider. `GET /api/v1/coding/optimization` suggests coding improvements based on historical denial patterns.
  - **Files to modify:** Create `backend/app/api/v1/coding.py`, create `backend/app/services/coding_audit_service.py`

- [ ] **TASK-122**: Create EVV backend -- `/evv` router
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 10 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/evv/dashboard` returns summary: total visits, compliance rate, non-compliant visits, by provider. `GET /api/v1/evv/visits` returns paginated visit records from `evv_visits`. `GET /api/v1/evv/fraud-detection` identifies visits with suspicious patterns (duplicate visits same day, impossible travel time, missing GPS). `GET /api/v1/evv/mandates` returns state mandate compliance status.
  - **Files to modify:** Create `backend/app/api/v1/evv.py`, create `backend/app/services/evv_service.py`

- [ ] **TASK-123**: Expand automation engine from 7 to 20 rules
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 16 hours
  - **Dependencies:** TASK-118
  - **Acceptance Criteria:** Add 13 new automation rules: AUTO-008 (auto-resubmit corrected claims), AUTO-009 (auto-eligibility-recheck on CO-27), AUTO-010 (auto-coding-fix for modifier errors), AUTO-011 (auto-CDI-query for medical necessity denials), AUTO-012 (auto-collection-prioritization by propensity), AUTO-013 (auto-ERA-posting for exact matches), AUTO-014 (auto-auth-status-check), AUTO-015 (auto-timely-filing-alert), AUTO-016 (auto-COB-correction), AUTO-017 (auto-payer-escalation for repeat denials), AUTO-018 (auto-write-off for sub-threshold amounts), AUTO-019 (auto-batch-submission scheduling), AUTO-020 (auto-contract-variance-dispute). Each rule has: trigger condition, action, tier assignment, confidence threshold.
  - **Files to modify:** `backend/app/services/automation_engine.py`

- [ ] **TASK-124**: Create staff productivity metrics endpoint
  - **Agent:** Backend
  - **Priority:** P2
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/analytics/staff-productivity` returns per-user metrics: claims processed, denials resolved, appeals submitted, collections completed, average resolution time, tasks completed per day. Aggregated from `automation_actions`, `appeals`, `collection_queue`. Supports date range filter and team grouping.
  - **Files to modify:** `backend/app/api/v1/analytics.py`

- [ ] **TASK-125**: Create charge capture audit endpoint
  - **Agent:** Backend
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `GET /api/v1/coding/charge-capture` identifies potential missed charges by: comparing encounter complexity (ICD-10 codes) against billed CPT codes, flagging encounters with suspiciously low charges for complexity level, identifying providers with statistically lower charge capture rates than peers in same specialty. Returns list of flagged encounters with estimated missed revenue.
  - **Files to modify:** `backend/app/api/v1/coding.py` (extend), `backend/app/services/coding_audit_service.py`

---

### Agent: Frontend

- [ ] **TASK-221**: Wire PatientAccessHub to real `/insurance` endpoints
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 8 hours
  - **Dependencies:** TASK-120
  - **Acceptance Criteria:** PatientAccessHub displays real patient access KPIs from `api.insurance.getDashboard()`. Search by patient MRN or name. Show coverage status, auth status, benefit summary. All hardcoded mock data removed.
  - **Files to modify:** `frontend/src/features/insurance/pages/PatientAccessHub.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-222**: Wire InsuranceVerification to real eligibility endpoints
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 6 hours
  - **Dependencies:** TASK-120
  - **Acceptance Criteria:** InsuranceVerification page calls `api.insurance.verifyEligibility()` for real-time checks. Results display: coverage active/inactive, effective dates, plan details, copay/deductible info. Verification history table populated from `api.insurance.getHistory()`.
  - **Files to modify:** `frontend/src/features/insurance/pages/InsuranceVerification.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-223**: Wire PriorAuthManager to real authorization endpoints
  - **Agent:** Frontend
  - **Priority:** P0
  - **Effort:** 6 hours
  - **Dependencies:** TASK-120
  - **Acceptance Criteria:** PriorAuthManager displays auth records from `api.insurance.getPriorAuths()`. Create new auth request form submits to backend. Status tracking shows: pending, approved, denied, expired. Filter by patient, payer, status.
  - **Files to modify:** `frontend/src/features/insurance/pages/PriorAuthManager.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-224**: Wire BenefitAnalytics to real benefit endpoints
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 4 hours
  - **Dependencies:** TASK-120
  - **Acceptance Criteria:** BenefitAnalytics page loads benefit data from `api.insurance.getBenefits()`. Shows deductible status, out-of-pocket accumulation, coverage limits by service category. All hardcoded data removed.
  - **Files to modify:** `frontend/src/features/insurance/pages/BenefitAnalytics.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-225**: Wire CodingOptimizer to real `/coding` endpoints
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-121
  - **Acceptance Criteria:** CodingOptimizer page displays coding accuracy metrics from `api.coding.getAudit()`. Shows modifier error rates, DX-CPT mismatch rates by provider. Optimization suggestions populated from `api.coding.getOptimization()`. No hardcoded data.
  - **Files to modify:** `frontend/src/features/coding/pages/CodingOptimizer.jsx` (find actual path), `frontend/src/services/api.js`

- [ ] **TASK-226**: Wire AICodingAudit to real coding audit endpoints
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 5 hours
  - **Dependencies:** TASK-121
  - **Acceptance Criteria:** AICodingAudit page loads audit results from `api.coding.getAudit()` with AI-generated recommendations from `api.ai.generateInsight()` scoped to coding. Shows per-provider accuracy scores, flagged claims, and recommended corrections.
  - **Files to modify:** Find actual coding audit page file in `frontend/src/features/`, `frontend/src/services/api.js`

- [ ] **TASK-227**: Wire EVVDashboard and EVV pages to real `/evv` endpoints
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** TASK-122
  - **Acceptance Criteria:** EVVDashboard shows compliance rate, visit counts, non-compliant visits from `api.evv.getDashboard()`. EVVVisitDetails lists visits from `api.evv.getVisits()`. EVVFraudDetection shows flagged visits from `api.evv.getFraudDetection()`. StateMandates shows mandate compliance from `api.evv.getMandates()`. All 4 pages wired to real endpoints, all mock data removed.
  - **Files to modify:** `frontend/src/features/evv/pages/EVVDashboard.jsx` (find actual paths for all EVV pages), `frontend/src/services/api.js`

- [ ] **TASK-228**: Build "Simulate" button on diagnostic findings
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 8 hours
  - **Dependencies:** TASK-602
  - **Acceptance Criteria:** Each diagnostic finding card on LidaDashboard and CommandCenter has a "Simulate Impact" button. Clicking opens a modal showing: scenario description (pre-filled from diagnostic), configurable parameters (e.g., "reduce modifier errors by X%"), "Run Simulation" button that calls `api.simulation.run()`. Results panel shows: predicted revenue impact, confidence level, timeline.
  - **Files to modify:** `frontend/src/features/lida/pages/LidaDashboard.jsx`, create `frontend/src/features/simulation/components/SimulationModal.jsx`

- [ ] **TASK-229**: Build scenario analysis UI for MiroFish simulations
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 10 hours
  - **Dependencies:** TASK-602
  - **Acceptance Criteria:** New page at `/intelligence/scenarios` with: scenario template selector (automation rule test, payer behavior change, staffing change, prevention intervention), parameter configuration form, "Run Simulation" button, results dashboard showing agent actions, round summaries, predicted outcomes with confidence bands, comparison view for multiple scenarios.
  - **Files to modify:** Create `frontend/src/features/simulation/pages/ScenarioAnalysis.jsx`, update `frontend/src/App.jsx`, update sidebar

- [ ] **TASK-230**: Upgrade RevenueForecast page to show ML-powered predictions
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-404
  - **Acceptance Criteria:** RevenueForecast page calls `api.forecast.getMLPrediction()` for 30/60/90-day forecasts. Chart displays 10th/50th/90th percentile confidence bands (shaded area chart). Toggle between simple forecast and ML forecast. Show model accuracy metrics (MAPE, backtest results).
  - **Files to modify:** `frontend/src/features/intelligence/pages/RevenueForecast.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-231**: Wire AdminDashboard to system health metrics
  - **Agent:** Frontend
  - **Priority:** P2
  - **Effort:** 4 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** AdminDashboard page shows: API endpoint health (from `api.ai.getHealth()`), database connection status, Ollama availability, automation engine status (rules active, pending actions), prevention engine status (rules active, claims screened today). Calls existing health/status endpoints.
  - **Files to modify:** `frontend/src/features/admin/pages/AdminDashboard.jsx`, `frontend/src/services/api.js`

- [ ] **TASK-232**: Wire VerificationHistory to insurance history endpoint
  - **Agent:** Frontend
  - **Priority:** P1
  - **Effort:** 3 hours
  - **Dependencies:** TASK-120
  - **Acceptance Criteria:** VerificationHistory page displays chronological list of eligibility verifications from `api.insurance.getHistory()`. Shows: patient, payer, verification date, result (active/inactive/error), response details. Filter by date range and result status.
  - **Files to modify:** `frontend/src/features/insurance/pages/VerificationHistory.jsx`, `frontend/src/services/api.js`

---

### Agent: Data

- [ ] **TASK-307**: Expand diagnostic service detection rules from 26 to 45
  - **Agent:** Data
  - **Priority:** P1
  - **Effort:** 12 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Add 19 new diagnostic rules across categories: Revenue Health (+5: charge capture gap, CMI erosion, payer mix shift, gross-to-net ratio decline, service line revenue drop), Denial Patterns (+4: new CARC emergence, seasonal spike, cross-payer correlation, appeal win rate decline), Payment Flow (+4: ADTP acceleration, batch posting delay, ERA gap detection, zero-pay ERA increase), AR Aging (+3: bucket velocity change, payer-specific aging spike, write-off rate increase), Operational (+3: staff productivity drop, queue aging alert, SLA breach detection). Each rule has: detection SQL query, severity classification logic, impact calculation, recommended action text.
  - **Files to modify:** `backend/app/services/diagnostic_service.py`

- [ ] **TASK-308**: Backfill CRS scores for all 500K claims
  - **Agent:** Data
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Run CRS scoring engine on all claims in database that currently have NULL crs_score. Script processes in batches of 1,000 to avoid memory issues. After completion, <1% of claims have NULL crs_score. Processing completes within 4 hours. Score distribution report generated (histogram of scores 0-10).
  - **Files to modify:** Create `backend/scripts/backfill_crs_scores.py`

- [ ] **TASK-309**: Create EVV fraud detection rules dataset
  - **Agent:** Data
  - **Priority:** P2
  - **Effort:** 4 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Define and implement SQL queries for 5 EVV fraud patterns: duplicate visits (same patient, same day, same provider), impossible travel (visits <30 min apart with different locations >50 miles), missing GPS coordinates, visits outside business hours for office-based services, visit duration anomalies (>3 standard deviations from mean for service type). Each query returns flagged visit IDs with fraud_type label.
  - **Files to modify:** `backend/app/services/evv_service.py`

---

### Agent: AI/ML

- [ ] **TASK-407**: Integrate ML denial prediction into prevention engine
  - **Agent:** AI/ML
  - **Priority:** P0
  - **Effort:** 8 hours
  - **Dependencies:** TASK-403, TASK-110
  - **Acceptance Criteria:** Prevention engine runs ML denial prediction on every claim entering the submission queue. Claims with predicted denial probability >70% are automatically held for review (prevention rule `PREV-006`). Hold reason includes top 3 denial risk factors from model. Analysts can override and release claims. Held claims tracked separately from rule-based holds for accuracy comparison.
  - **Files to modify:** `backend/app/services/prevention_engine.py`, `backend/app/services/denial_prediction_service.py`

- [ ] **TASK-408**: Build propensity-to-pay scoring model for collections
  - **Agent:** AI/ML
  - **Priority:** P1
  - **Effort:** 10 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** Train model predicting probability of payment for AR accounts based on: days outstanding, payer type, historical payment behavior for this payer, claim amount, number of previous contacts, payer ADTP. Model achieves >70% AUC. `GET /api/v1/collections/propensity/{account_id}` returns score (0-100) and recommended action (call now, send letter, escalate, write-off candidate). Collections queue can sort by propensity score.
  - **Files to modify:** Create training script, create `backend/app/services/propensity_service.py`, update `backend/app/api/v1/collections.py`

- [ ] **TASK-409**: Create AI-powered call script generation with payer context
  - **Agent:** AI/ML
  - **Priority:** P2
  - **Effort:** 6 hours
  - **Dependencies:** None
  - **Acceptance Criteria:** `POST /api/v1/ai/call-script` accepts claim_id and payer_id. Generates a structured call script including: payer-specific phone number and department, claim reference numbers, talking points based on denial reason and root cause, escalation triggers, documentation to have ready, negotiation parameters based on historical success rates with this payer. Script tailored to payer personality (aggressive, cooperative, bureaucratic) based on historical interaction data.
  - **Files to modify:** `backend/app/services/ai_insights.py`, `backend/app/api/v1/ai.py`

---

### Agent: MiroFish Integration

- [ ] **TASK-603**: Run first simulation -- "What if modifier error rate drops 30%?"
  - **Agent:** MiroFish
  - **Priority:** P0
  - **Effort:** 12 hours
  - **Dependencies:** TASK-601
  - **Acceptance Criteria:** Execute 6-month simulation with 50 Payer Agents and 200 Provider Agents where Provider Agents have 30% fewer modifier errors. Simulation produces: predicted denial count reduction (absolute and percentage), predicted revenue recovery amount, confidence interval (10th/50th/90th percentile), per-payer impact breakdown. Results stored in database and accessible via API.
  - **Files to modify:** Create simulation configuration in `connectors/`, `mirofish/backend/app/services/simulation_runner.py`

- [ ] **TASK-604**: Create payer behavior digital twin agents for top 10 payers
  - **Agent:** MiroFish
  - **Priority:** P1
  - **Effort:** 12 hours
  - **Dependencies:** TASK-600
  - **Acceptance Criteria:** Create OasisAgentProfile for each of top 10 payers by claim volume. Each agent has: adjudication behavior (accept/deny probability per CPT code per CARC), payment timing (ADTP distribution fitted to historical data), appeal response behavior (win rate by category), policy rule set (specific CARC codes this payer applies disproportionately). Agents validated by comparing simulated outcomes against last 90 days of actual outcomes (within 10% for denial rate).
  - **Files to modify:** `mirofish/backend/app/services/oasis_profile_generator.py`, `connectors/nexus_to_mirofish_etl.py`

- [ ] **TASK-605**: Build simulation results storage and retrieval API
  - **Agent:** MiroFish
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-602
  - **Acceptance Criteria:** `GET /api/v1/simulation/results/{sim_id}` returns: simulation metadata (scenario, duration, agent counts), round-by-round summaries, aggregate outcomes (denial count, revenue impact, confidence bands), agent-level action logs. `GET /api/v1/simulation/history` lists past simulations with status and key outcomes. Results persisted to database table.
  - **Files to modify:** Create simulation results model/migration, update `backend/app/api/v1/simulation.py`

- [ ] **TASK-606**: Implement automation rule pre-deployment simulation
  - **Agent:** MiroFish
  - **Priority:** P1
  - **Effort:** 10 hours
  - **Dependencies:** TASK-603
  - **Acceptance Criteria:** Before any new automation rule goes live, a simulation can be triggered via `POST /api/v1/automation/simulate-rule` with the rule definition. MiroFish runs the rule against 10,000 simulated claims. Returns: predicted accuracy (true positive rate), predicted false positive rate, estimated revenue impact, estimated time savings, edge cases identified. Results displayed in AutomationDashboard before rule activation.
  - **Files to modify:** `backend/app/api/v1/graph.py` (automation endpoints), `mirofish/backend/app/services/simulation_config_generator.py`

---

### Agent: QA

- [ ] **TASK-506**: Patient Access module end-to-end test
  - **Agent:** QA
  - **Priority:** P0
  - **Effort:** 6 hours
  - **Dependencies:** TASK-120, TASK-221, TASK-222, TASK-223
  - **Acceptance Criteria:** Test flow: search patient by MRN, view coverage status, trigger eligibility verification, check verification result, view prior auth status, view benefit details, check verification history. All steps return real data. No mock data on any Patient Access page. Document test results.
  - **Files to modify:** Create `docs/test-results-sprint9.md`

- [ ] **TASK-507**: Automation engine regression test with 20 rules
  - **Agent:** QA
  - **Priority:** P1
  - **Effort:** 8 hours
  - **Dependencies:** TASK-123
  - **Acceptance Criteria:** For each of the 20 automation rules: verify trigger condition activates correctly, verify action executes correctly, verify tier-appropriate approval workflow, verify audit log entry created. Test maturity phase transitions (Learning -> Supervised -> Autonomous) for at least 2 rules. Document per-rule test results.
  - **Files to modify:** Create `backend/tests/test_automation_rules.py`

- [ ] **TASK-508**: ML model accuracy validation
  - **Agent:** QA
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-403, TASK-404
  - **Acceptance Criteria:** Validate denial prediction model on held-out test set: compute AUC, precision, recall, F1 at multiple thresholds (50%, 60%, 70%, 80%). Validate revenue forecast model: compute MAPE, MAE for 30/60/90-day horizons on last 3 months of actuals. Document: model name, test dataset size, all metrics, pass/fail against acceptance thresholds (AUC >0.80, MAPE <5% at 30 days).
  - **Files to modify:** Create `backend/tests/test_ml_models.py`

- [ ] **TASK-509**: MiroFish simulation end-to-end validation
  - **Agent:** QA
  - **Priority:** P1
  - **Effort:** 6 hours
  - **Dependencies:** TASK-603
  - **Acceptance Criteria:** Run 3 simulation scenarios: modifier error reduction, payer policy change, staffing increase. For each: verify simulation starts and completes without errors, verify results contain all expected fields (denial count, revenue impact, confidence bands), verify results are accessible via API, verify frontend displays results correctly. Compare at least one simulation against known historical outcome for sanity check.
  - **Files to modify:** Create `docs/simulation-test-results.md`

- [ ] **TASK-510**: Full Bible compliance audit at Sprint 9 completion
  - **Agent:** QA
  - **Priority:** P0
  - **Effort:** 10 hours
  - **Dependencies:** All Sprint 9 tasks
  - **Acceptance Criteria:** Re-score all 5 Bible documents using the same methodology as the speckit analysis. Document: per-category scores (Implemented/Partial/Missing), overall compliance percentage, comparison against Sprint 7 baseline (23%). Target: overall compliance >= 48%. Identify top 10 remaining gaps for Sprint 10 planning.
  - **Files to modify:** Create `docs/bible-compliance-sprint9.md`

---

## DEPENDENCY GRAPH (Key Chains)

```
HOTFIX CHAIN:
  TASK-001 --> TASK-501
  TASK-002 + TASK-003 --> TASK-500

COMMAND CENTER CHAIN:
  TASK-100 --> TASK-200 --> TASK-502

DENIAL WORKFLOW CHAIN:
  TASK-107 --> TASK-203
  TASK-104 --> TASK-204

PREVENTION CHAIN:
  TASK-110 --> TASK-111, TASK-112, TASK-113, TASK-114
  TASK-110..114 --> TASK-215, TASK-503
  TASK-304 --> TASK-403 --> TASK-405, TASK-407

ML CHAIN:
  TASK-304 --> TASK-403 --> TASK-405 --> CRS pipeline
  TASK-305 --> TASK-404 --> TASK-230
  TASK-403 --> TASK-407 --> prevention integration

MIROFISH CHAIN:
  TASK-600 --> TASK-601 --> TASK-603, TASK-604
  TASK-601 --> TASK-602 --> TASK-605, TASK-606
  TASK-602 --> TASK-228, TASK-229

SPECIALTY MODULE CHAIN:
  TASK-120 --> TASK-221, TASK-222, TASK-223, TASK-224, TASK-232 --> TASK-506
  TASK-121 --> TASK-225, TASK-226
  TASK-122 --> TASK-227

BATCH CHAIN:
  TASK-106 --> TASK-213

SETTINGS CHAIN:
  TASK-116 --> TASK-216
  TASK-117 --> TASK-217
```

---

## TASK SUMMARY

| Sprint | Agent | Task Count | Total Effort (hours) |
|--------|-------|------------|---------------------|
| **P0 Hotfix** | Frontend | 3 | 1.5 |
| **Sprint 7** | Backend | 8 | 45 |
| | Frontend | 14 | 67 |
| | Data | 4 | 18 |
| | AI/ML | 3 | 16 |
| | QA | 3 | 16 |
| **Sprint 8** | Backend | 9 | 58 |
| | Frontend | 7 | 43 |
| | Data | 3 | 24 |
| | AI/ML | 4 | 40 |
| | MiroFish | 3 | 32 |
| | QA | 3 | 18 |
| **Sprint 9** | Backend | 6 | 70 |
| | Frontend | 12 | 74 |
| | Data | 3 | 22 |
| | AI/ML | 3 | 24 |
| | MiroFish | 4 | 40 |
| | QA | 5 | 36 |
| **TOTAL** | **All** | **95** | **~645 hours** |

---

## BIBLE COMPLIANCE PROJECTION

| Milestone | Bible Items Implemented | Compliance |
|-----------|------------------------|------------|
| Current (pre-Sprint 7) | ~118 / 513 | 23% |
| Sprint 7 complete | ~144 / 513 | 28% |
| Sprint 8 complete | ~180 / 513 | 35% |
| Sprint 9 complete | ~257 / 513 | 50% |
