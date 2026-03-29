# NEXUS RCM Work Center Analysis Report

**Generated:** 2026-03-27
**Scope:** 4 Work Centers, 12 sub-pages
**Focus:** Data integrity, API integration, operational readiness

---

## Executive Summary

Of the 12 sub-pages across 4 Work Centers, **8 are operationally connected to real backend APIs** and **4 have significant data quality issues** (static/hardcoded KPIs, fallback mock data, or field mapping mismatches). The Payment Work Center is the weakest overall — the ERA Processing page fetches real data but its frontend field mapping does not match the backend schema, resulting in $0 amounts and empty columns. The Collections Work Center has a critical fallback-to-static-data pattern that masks empty API responses.

### Classification

| Status | Pages |
|--------|-------|
| **Operational (real API data)** | Claims Work Queue, Denial Management (Queue), High Risk Claims, Appeal Generator, Batch Actions, Alerts Queue |
| **Partially Operational (API connected but data gaps)** | ERA Processing, Payment Posting, Contract Manager, Auto-Fix Center |
| **Decorative (static/hardcoded)** | Collections Queue (KPIs hardcoded), Collections Queue (AI stats hardcoded) |

---

## 1. CLAIMS WORK CENTER (`/work/claims/`)

### 1.1 Claims Work Queue (`ClaimsWorkQueue.jsx`)

**Current State:**
- Fetches claims via `api.claims.list()` — returns real data from backend
- Fetches AI insights via `api.ai.getInsights('claims-workqueue')` — falls back to `STATIC_FALLBACK_WQ_INSIGHTS` if API returns empty
- KPI sparklines (Throughput: "142", Error Rate: "4.2%", Avg Age: "12d") are **hardcoded static values** via `KPISparkline` — sparkline chart data is randomly generated via `generateSparklineData()`
- Filtering, sorting, pagination all functional with real claim data
- Risk scores, smart badges, and tab counts are computed from live data

**Purpose:** Primary claims triage workstation. Users filter by error/AI-review/clean status, batch-select claims for processing, and see AI-prioritized work.

**Data Available:**
- `GET /api/v1/claims` — real paginated claims with patient, payer, amount, risk_score, status
- `GET /api/v1/ai/insights` — returns contextual AI insights (with static fallback)

**Gaps:**
1. **KPI sparklines are fully hardcoded** — "142", "4.2%", "12d" never change
2. Sparkline chart data is `Math.random()` — not from any API
3. AI insights fall back to static data silently — user cannot tell if they are seeing real or mock insights
4. Active Batch ID "BATCH-2023-A" is hardcoded

**Fix Plan:**
1. Replace KPI sparkline values with computed values from `claims` array (e.g., `claims.length` for throughput, denial rate from status counts, average days from DOS)
2. Add API call to `/api/v1/claims/summary` or compute from claims data for trending sparkline
3. Add visual indicator when AI insights are using fallback data (e.g., "AI offline — showing cached insights")
4. Remove or dynamically populate batch ID

**Priority:** MEDIUM — data is mostly real, but KPIs are misleading

---

### 1.2 Pre-Batch Scrub

**Note:** This page uses the `PreBatchContext` and is part of the claims flow. Not separately listed as a standalone page in the task spec but referenced by Auto-Fix Center.

---

### 1.3 Auto-Fix Center (`AutoFixCenter.jsx`)

**Current State:**
- Fetches CRS summary via `api.crs.getSummary()` — shows auto-fix rate, denials prevented value
- Fetches high-risk claims via `api.crs.getHighRisk({ page: 1, size: 50 })` — real API data
- Combines PreBatch context candidates with API high-risk claims
- Shows "All Clean!" empty state when no fix candidates exist

**Purpose:** Prescriptive AI center where users review and approve high-confidence auto-corrections before submission.

**Data Available:**
- `GET /api/v1/crs/summary` — pass rate, auto-fix rate, denials prevented value
- `GET /api/v1/crs/high-risk` — paginated high-risk claims with issues array

**Gaps:**
1. If no claims have `issues.autoFixAvailable`, the page shows empty state even when API data exists — the filtering logic is too restrictive
2. No diagnostic integration — does not show WHY these claims need fixing (root cause patterns)
3. KPI "Candidates" count shows 0 when API claims lack the `issues` array structure

**Fix Plan:**
1. Add fallback rendering for API claims that have `issues` but different field names (e.g., `auto_fix_available` vs `autoFixAvailable`)
2. Add diagnostic banner showing top denial patterns from `api.diagnostics.getFindings()`
3. Add "Estimated time saved" and "Estimated denials prevented" projections

**Priority:** MEDIUM — functional but often shows empty due to field name mismatch

---

### 1.4 Batch Actions (`BatchActions.jsx`)

**Current State:**
- Fetches claims via `api.claims.list()` — real data
- Fetches CRS summary via `api.crs.getSummary()` — real KPIs (total claims, pass rate, auto-fix rate, batch readiness)
- Claims table shows first 20 claims with status, risk score, amounts
- Batch Re-Scrub and Payer Submission cards derive stats from live claims

**Purpose:** Batch operations management — re-scrub claims, submit batches to payers, monitor batch status.

**Data Available:**
- `GET /api/v1/claims` — full claims list
- `GET /api/v1/crs/summary` — batch readiness metrics

**Gaps:**
1. No actual batch execution — "Run Batch Scrub" and "Submit Batch" buttons have no onClick handlers
2. No batch history or batch status tracking
3. Limited to first 20 claims displayed — no pagination

**Fix Plan:**
1. Wire "Run Batch Scrub" to `api.crs.runBatch()` or equivalent endpoint
2. Add batch history section showing past batch results
3. Add pagination for claims table
4. Add confirmation modals for batch actions

**Priority:** LOW — page is informational and accurate, but actions are non-functional

---

## 2. DENIAL WORK CENTER (`/work/denials/`)

### 2.1 Denial Management / Queue (`DenialManagement.jsx`)

**Current State:**
- Fetches denial summary via `api.denials.getSummary()` — real KPIs
- Fetches denial list via `api.denials.list({ page: 1, size: 100 })` — real paginated data
- Fetches denial heatmap via `api.analytics.getDenialMatrix()` — with fallback to hardcoded heatmap
- Fetches root cause summary via `api.rootCause.getSummary()` — with fallback to hardcoded root causes
- Fetches AI insights via `api.ai.getInsights('denials')` — non-blocking
- Fetches prevention alerts and diagnostic findings — non-blocking
- KPI initial state has hardcoded values ($382K, 52.3%, $168K, 422) but these are overwritten by API data on load

**Purpose:** Denial management dashboard — view all denials, heatmap by payer/department, root cause analysis, AI insights, and initiate appeals.

**Data Available:**
- `GET /api/v1/denials/summary` — denial revenue at risk, appeal success rate, projected recovery
- `GET /api/v1/denials` — paginated denial list with CARC codes, amounts, status
- `GET /api/v1/analytics/denial-matrix` — payer x department heatmap
- `GET /api/v1/root-cause/summary` — root cause distribution
- `GET /api/v1/diagnostics/findings` — critical patterns
- `GET /api/v1/prevention/scan` — prevention alerts

**Gaps:**
1. Initial state shows hardcoded KPIs for a split second before API data loads (flash of wrong data)
2. Heatmap and root cause have visible fallback data that may display if APIs fail silently
3. No loading skeleton for heatmap section

**Fix Plan:**
1. Set initial summary state to `null` and show skeleton until API responds
2. Add visual indicator when heatmap/root-cause is using fallback data
3. Add error boundary for failed API calls

**Priority:** LOW — mostly operational, minor UX issue with initial state flash

---

### 2.2 High Risk Claims (`HighRiskClaims.jsx`)

**Current State:**
- Fetches high-risk claims via `api.crs.getHighRisk({ page: 1, size: 100 })` — real data
- Fetches prevention alerts via `api.prevention.scan(10)` — non-blocking
- Fetches diagnostic findings via `api.diagnostics.getFindings({ category: 'DENIAL_PATTERN', severity: 'critical' })` — non-blocking
- AI appeal drafting via `api.ai.draftAppeal()` — sends to Ollama
- Full filtering (search, payer, risk threshold, date range, category)
- Expanded rows show claim issues with "Fix Issues" and "Draft Appeal" actions

**Purpose:** Pre-submission risk analysis. Shows claims with CRS score < 60 that need intervention before submission.

**Data Available:**
- `GET /api/v1/crs/high-risk` — claims with CRS scores, denial risk, issues
- `GET /api/v1/prevention/scan` — prevention alerts
- `GET /api/v1/diagnostics/findings` — diagnostic patterns
- `POST /api/v1/ai/appeal` — AI-drafted appeal letters

**Gaps:**
1. AI Insight cards at bottom are **fully hardcoded** (Spine Surgery cluster, Duplicate Submission Risk) — not from API
2. ConfidenceBar "Portfolio Risk: 73" is hardcoded
3. Category filter dropdown only has "All Categories" option — no dynamic categories from API

**Fix Plan:**
1. Replace hardcoded AI Insight cards with data from `api.ai.getInsights('high-risk')`
2. Derive portfolio risk score from average CRS scores in claims array
3. Populate category filter from unique categories in claims data

**Priority:** MEDIUM — core data is real, but AI insight cards are misleading

---

### 2.3 Appeal Generator (`AppealGenerator.jsx`)

**Current State:**
- When `denial_id` query param is present: fetches denial context, creates appeal via `api.appeals.create()`, fetches AI-generated letter via `api.appeals.getLetter()`
- When no `denial_id`: falls back to `DEFAULT_APPEAL_TEXT` after 2-second delay (mock behavior)
- Fetches appeal win rates via `api.analytics.getAppealWinRates()` — non-blocking
- Fetches diagnostic findings and prevention counts — non-blocking
- Full appeal editor with signature block, evidence attachments, AI suggestions
- Submit action calls `api.appeals.updateOutcome()`

**Purpose:** AI-powered appeal workspace. Generates appeal letters from denial context, shows probability of overturn, lets users edit and submit.

**Data Available:**
- `GET /api/v1/denials` — denial context
- `POST /api/v1/appeals` — create appeal
- `GET /api/v1/appeals/{id}/letter` — AI-generated letter
- `PATCH /api/v1/appeals/{id}/outcome` — update appeal outcome
- `GET /api/v1/analytics/appeal-win-rates` — win rates by category
- `GET /api/v1/diagnostics/findings` — denial patterns

**Gaps:**
1. Without `denial_id` param, shows completely mock data (hardcoded letter, static payer "BlueCross BlueShield", patient "John Doe")
2. Evidence attachments are fully static (H&P, Operative Report, MRI, PT Progress Notes) — not from any API
3. AI Suggestions sidebar is hardcoded — "Strengthen Clinical Argument" and "Missing Policy Citation" are static
4. Confirmation ID "1Z9928383-001" is hardcoded

**Fix Plan:**
1. When no `denial_id`, show a denial picker or redirect to denial queue
2. Replace static evidence attachments with API-fetched documents (if document API exists)
3. Make AI suggestions dynamic based on appeal content analysis
4. Generate confirmation IDs from API response

**Priority:** LOW — works correctly when denial_id is provided; mock mode is an expected fallback

---

### 2.4 COB (Coordination of Benefits) & Workflow Log

**Note:** These sub-pages were listed but no separate file was found — they may be sections within DenialManagement or not yet implemented. The denial queue handles COB-related denials within its category filtering.

---

## 3. COLLECTIONS WORK CENTER (`/work/collections/`)

### 3.1 Collections Queue (`CollectionsQueue.jsx`)

**Current State:**
- Fetches queue via `api.collections.getQueue({ page: 1, size: 50 })` — real API
- Falls back to **hardcoded `queueTasks` array** (4 static tasks) when API returns empty
- Fetches diagnostics and prevention counts — non-blocking
- AI Call Script generation via `api.ai.getCallScript()` — sends to Ollama
- Full filtering (date range, payer, priority, collector, task type, propensity)
- Contact Workspace sidebar with dialer, AI script panel, templates

**Purpose:** Collections agent workstation — task queue sorted by AI propensity score, one-click dialing, AI-generated call scripts, note-taking.

**Data Available:**
- `GET /api/v1/collections/queue` — paginated tasks with propensity scores
- `GET /api/v1/diagnostics/findings` — critical findings
- `GET /api/v1/prevention/scan` — prevention alerts
- `POST /api/v1/ai/call-script` — AI-generated call scripts

**Gaps:**
1. **ALL KPI ribbon values are hardcoded:** "Calls Completed: 12/40", "PTP Amount: $14,250", "Tasks Remaining: 28", "Average Handling: 4.2m" — none from API
2. **AI Intelligence bar stats are hardcoded:** "Predicted Collections: $142K", "High-Propensity Accounts: 84", "Estimated FTE Hours: 12.4 hrs"
3. **AI Insight cards are hardcoded** (Medicare propensity spike, Aetna PTP decline) — not from API
4. Fallback to 4 static queue tasks masks the fact that API may be returning empty
5. "VOIP Ready" status is hardcoded
6. "AI Propensity Model: 94.2% accuracy, Last trained: 2h ago" is hardcoded

**Fix Plan:**
1. Compute KPIs from queue data: tasks remaining = `filteredTasks.length`, total balance = sum of balances
2. Replace AI stats bar with computed values from queue data
3. Fetch AI insights from `api.ai.getInsights('collections')` instead of hardcoding
4. Show clear empty state when API returns 0 tasks instead of falling back to static data
5. Remove or mark hardcoded model accuracy/training time

**Priority:** HIGH — the most deceptive page, hardcoded KPIs create false confidence

---

### 3.2 Alerts Queue (`AlertsQueue.jsx`)

**Current State:**
- Fetches alerts via `api.collections.getAlerts({ limit: 100 })` — real API
- Full filtering by type (overdue, SLA breach, high risk, AI triggered, payment promise)
- Bulk actions (assign, snooze, resolve)
- Loading state properly handled

**Purpose:** Proactive alert management for time-sensitive collection items — overdue follow-ups, SLA breaches, AI-triggered alerts.

**Data Available:**
- `GET /api/v1/collections/alerts` — paginated alerts with priority, type, patient, balance, due date

**Gaps:**
1. No diagnostic integration — does not show root cause patterns behind alerts
2. No KPI summary at top (total alerts, total at-risk balance, SLA breach count)
3. Alert counts are correct when data exists but show all 0s when API returns empty

**Fix Plan:**
1. Add KPI summary row showing total alerts, at-risk balance, critical count
2. Add diagnostic findings banner from `api.diagnostics.getFindings()`
3. Add empty state with explanation when no alerts exist

**Priority:** LOW — functional when data exists, just needs enrichment

---

### 3.3 Portal & Timeline

**Note:** These sub-pages were listed but appear to be the Account Detail view (`/collections/account/{id}`) and Timeline view handled by the `collections_extended.py` backend. They are API-connected and functional.

---

## 4. PAYMENT WORK CENTER (`/work/payments/`) -- HIGHEST CONCERN

### 4.1 ERA Processing (`ERAProcessing.jsx`) -- CRITICAL

**Current State:**
- Fetches ERA list via `api.payments.getERAList()` — calls `GET /api/v1/payments/era`
- Fetches summary via `api.payments.getSummary()` — calls `GET /api/v1/payments/summary`
- Fetches underpayments via `api.payments.getSilentUnderpayments()` — calls `GET /api/v1/payments/silent-underpayments`
- Fetches revenue leakage diagnostics via `api.diagnostics.getFindings({ category: 'REVENUE_LEAKAGE' })`
- ERA detail expansion via `api.payments.getERADetail(era_id)`

**THE CORE PROBLEM — Field Name Mismatch:**

The backend `PaginatedERA` returns items with fields:
```
era_id, claim_id, payer_id, payer_name, payment_date, payment_amount,
payment_method, allowed_amount, co_amount, pr_amount, oa_amount,
eft_trace_number, check_number, adtp_cycle_number
```

But the frontend expects:
```
id, payer, date, amount, lineCount/line_count, paidLines/paid_lines,
deniedLines/denied_lines, adjustedLines/adjusted_lines,
autoMatchRate/auto_match_rate, status
```

**Result:** The ERA queue table renders rows but shows:
- File ID = `era.id` (undefined — should be `era.era_id`)
- Payer = `era.payer` (undefined — should be `era.payer_name`)
- Amount = `era.amount || 0` (0 — should be `era.payment_amount`)
- Lines = `era.lineCount || era.line_count || 0` (0 — field doesn't exist)
- Status = `era.status` (undefined — field doesn't exist)
- Auto-Match Rate = undefined — field doesn't exist

**KPIs therefore show:** Files in Queue = correct count, Total Pending Amount = $0, Auto-Match Rate = 0%, Exceptions Pending = 0

**Purpose:** Process electronic remittance advice (835) files, auto-match payments to claims, detect underpayments, manage exceptions.

**Data Available (backend is rich):**
- `GET /api/v1/payments/era` — paginated ERA with amounts, adjustment breakdowns
- `GET /api/v1/payments/summary` — total posted, ERA count, payment rates, adjustments
- `GET /api/v1/payments/silent-underpayments` — underpayment detection
- `GET /api/v1/payments/era/{id}` — single ERA detail
- `GET /api/v1/diagnostics/findings` — revenue leakage

**Gaps:**
1. **CRITICAL: Frontend field names do not match backend schema** — all amounts show $0
2. Backend ERA model is per-payment-line, not per-file — there's no concept of "file" with multiple lines. Each ERA record is a single payment
3. No `status`, `lineCount`, `paidLines`, `deniedLines`, `adjustedLines`, `autoMatchRate` fields exist in backend
4. ERA detail endpoint returns single flat record, not nested `lines` array — expanded detail section will never render

**Fix Plan:**
1. **Map frontend fields to backend schema:**
   - `era.id` -> `era.era_id`
   - `era.payer` -> `era.payer_name`
   - `era.amount` -> `era.payment_amount`
   - `era.date` -> `era.payment_date`
2. **Derive missing fields from backend data:**
   - Status: derive from payment amounts (paid if payment_amount > 0, adjusted if co_amount > 0)
   - Lines: group ERA records by claim_id or show individual line items
3. **Fix Summary KPI mapping:**
   - Use `summary.total_posted` for Total Pending Amount
   - Use `summary.avg_payment_rate` for Auto-Match Rate equivalent
   - Use `summary.total_era_count` for file count
4. **Fix ERA detail expansion:**
   - The detail endpoint returns a flat record — render it as single-line detail instead of multi-line table
   - OR create a backend endpoint that groups ERA records by check_number/eft_trace_number

**Priority:** CRITICAL — this is the page specifically flagged by the client with $0 amounts

---

### 4.2 Payment Posting (`PaymentPosting.jsx`)

**Current State:**
- Fetches summary via `api.payments.getSummary()` — real data
- Fetches ERA list via `api.payments.getERAList()` — real data
- Manual posting form has all fields but no submit handler connected to `api.payments.postPayment()`
- Batch posting tab derives items from ERA data with same field mapping issues as ERA Processing

**Purpose:** Manual and batch payment posting, adjustment management, claim matching.

**Data Available:**
- `GET /api/v1/payments/summary` — real summary with total_posted, adjustments
- `GET /api/v1/payments/era` — real ERA list
- `POST /api/v1/payments/post` — real posting endpoint

**Gaps:**
1. **Same field mapping issue as ERA Processing** — batch items show $0 amounts
2. Manual posting "Post Payment" button has no onClick handler — form is decorative
3. Payment Summary panel shows raw API keys (e.g., "total_era_count" instead of "Total ERA Count")
4. "Posting History" button has no handler

**Fix Plan:**
1. Fix ERA field mapping (same as ERA Processing fix)
2. Wire "Post Payment" button to `api.payments.postPayment()` with form validation
3. Format summary key names for display (replace underscores with spaces, title case)
4. Add posting history via new API endpoint or filtered ERA list

**Priority:** HIGH — both the data display and core action (posting) are broken

---

### 4.3 Contract Manager (`ContractManager.jsx`)

**Current State:**
- Fetches underpayment data via `api.payments.getSilentUnderpayments()` — real data
- Fetches payment summary via `api.payments.getSummary()` — real data
- Fetches payer list via `api.payers.list()` — real data
- Payer Contracts tab shows payers with their status, claims YTD, revenue YTD
- Underpayment Analysis tab shows contracted vs actual rates

**Purpose:** Payer contract management, fee schedule comparison, underpayment detection, appeal recommendations.

**Data Available:**
- `GET /api/v1/payments/silent-underpayments` — underpayment analysis with variance
- `GET /api/v1/payments/summary` — total payments
- `GET /api/v1/payers` — payer list with names

**Gaps:**
1. Payer table fields may be empty: `planType`, `claimsYTD`, `revenueYTD`, `status` likely don't exist on the payer model — shows "--" or "$0"
2. "Import Fee Schedule" button has no handler
3. "Appeal Underpayments" / "Generate Appeals" buttons have no handler
4. `appealable` field on underpayment items may not exist in backend response

**Fix Plan:**
1. Check payer model for available fields and map correctly (payer API likely returns `payer_name`, `payer_id`, `payer_type`)
2. Derive claims YTD and revenue YTD by aggregating from claims/ERA data
3. Wire "Generate Appeals" to navigate to Appeal Generator with appropriate params
4. Add `appealable` logic: mark underpayments as appealable if variance exceeds threshold

**Priority:** MEDIUM — underpayment detection works, but payer contract view is sparse

---

## Overall Assessment

### Operational vs Decorative Pages

| Page | Data Source | KPIs | Actions | Diagnostic Integration | Overall |
|------|-----------|------|---------|----------------------|---------|
| Claims Work Queue | Real API | **Hardcoded** | Functional | AI Insights (fallback) | Partial |
| Auto-Fix Center | Real API | Real (when data exists) | Functional | None | Partial |
| Batch Actions | Real API | Real | **Non-functional** | None | Partial |
| Denial Management | Real API | Real (after load) | Functional | Full (diagnostics + prevention) | **Operational** |
| High Risk Claims | Real API | **Hardcoded** (portfolio risk) | Functional | Full | **Mostly Operational** |
| Appeal Generator | Real API (with denial_id) | Real | Functional | Partial | **Operational** |
| Collections Queue | Real API + **Static fallback** | **All hardcoded** | Functional (AI scripts) | Partial | **Decorative KPIs** |
| Alerts Queue | Real API | None shown | Functional | None | **Operational** |
| ERA Processing | Real API | **Shows $0** | Non-functional | Revenue leakage | **Broken** |
| Payment Posting | Real API | **Shows $0** | **Non-functional** | None | **Broken** |
| Contract Manager | Real API | Partially real | Non-functional | None | Partial |

### Diagnostic -> Automation Flows That Should Exist

1. **Denial Pattern Detection -> Auto-Hold:** When diagnostics find a denial pattern spike (e.g., Eligibility denials for UHC), automatically flag matching pre-submission claims
2. **Underpayment Detection -> Appeal Generation:** When silent underpayments are detected, auto-create appeal drafts with contract evidence
3. **CRS Score -> Auto-Fix -> Batch Submit:** Claims scoring below threshold get auto-fix suggestions, batch-approved fixes feed directly into submission batch
4. **ERA Exception -> Root Cause -> Prevention Rule:** Unmatched payments trace back to root cause, which creates a prevention rule for future claims
5. **Collections Propensity -> Priority Routing:** AI propensity model should dynamically reorder the queue and trigger alerts when scores change significantly

---

## TOP 5 HIGHEST-IMPACT FIXES

### Fix #1: ERA Processing Field Mapping (CRITICAL)
**File:** `frontend/src/features/payments/pages/ERAProcessing.jsx`
**Impact:** Fixes $0 amounts, empty columns, broken KPIs for the entire ERA Processing page
**Change:** Map `era.era_id`, `era.payer_name`, `era.payment_amount`, `era.payment_date` and derive status/line counts from backend fields. Update KPI derivation to use `summary.total_posted`, `summary.avg_payment_rate`, `summary.total_era_count`.
**Effort:** 2-3 hours
**Lines affected:** ~30 lines in field references + KPI computation block

### Fix #2: Payment Posting Field Mapping + Action Wiring (HIGH)
**File:** `frontend/src/features/payments/pages/PaymentPosting.jsx`
**Impact:** Fixes batch posting display ($0 amounts) and makes manual posting actually functional
**Change:** (a) Same ERA field mapping fix as #1 for batch items. (b) Wire "Post Payment" button to `api.payments.postPayment()` with form data. (c) Format summary display keys.
**Effort:** 3-4 hours
**Lines affected:** ~40 lines

### Fix #3: Collections Queue — Replace Hardcoded KPIs (HIGH)
**File:** `frontend/src/features/collections/pages/CollectionsQueue.jsx`
**Impact:** Removes all false KPIs and static AI stats that create incorrect operational picture
**Change:** (a) Compute KPIs from `filteredTasks` array (count, total balance, etc.). (b) Replace hardcoded AI stats with computed or API-fetched values. (c) Remove static `queueTasks` fallback — show proper empty state. (d) Replace hardcoded AI Insight cards with `api.ai.getInsights('collections')`.
**Effort:** 3-4 hours
**Lines affected:** ~60 lines (KPI ribbon + AI bar + insight cards + fallback removal)

### Fix #4: Claims Work Queue — Replace Hardcoded KPI Sparklines (MEDIUM)
**File:** `frontend/src/features/claims/pages/ClaimsWorkQueue.jsx`
**Impact:** KPIs show real operational metrics instead of static numbers
**Change:** Compute throughput from claims count, error rate from denied/total ratio, avg age from date calculations. Replace `Math.random()` sparkline data with historical trend from API.
**Effort:** 2 hours
**Lines affected:** ~20 lines

### Fix #5: Contract Manager — Payer Field Mapping + Appeal Wiring (MEDIUM)
**File:** `frontend/src/features/payments/pages/ContractManager.jsx`
**Impact:** Payer contracts table shows real data instead of "--" and "$0"; appeal generation works
**Change:** (a) Map payer fields to actual backend model (`payer_name`, `payer_type`). (b) Aggregate claims/revenue from claims API. (c) Wire "Generate Appeals" to navigate to `/denials/appeals?denial_id=...` with underpayment context.
**Effort:** 3-4 hours
**Lines affected:** ~30 lines

---

## Summary Priority Matrix

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| P0 | ERA Processing field mapping | Client-flagged, $0 amounts | 2-3h |
| P1 | Payment Posting fix + action wiring | Core workflow broken | 3-4h |
| P1 | Collections Queue KPI replacement | False operational data | 3-4h |
| P2 | Claims Work Queue KPI fix | Misleading metrics | 2h |
| P2 | Contract Manager field mapping | Sparse payer data | 3-4h |
| P3 | High Risk Claims — dynamic AI insights | Hardcoded insight cards | 1-2h |
| P3 | Batch Actions — wire action buttons | Decorative buttons | 2-3h |
| P3 | Auto-Fix Center — field name normalization | Empty when data exists | 1-2h |
| P4 | Denial Management — initial state flash | Minor UX | 30min |
| P4 | Alerts Queue — add KPI summary | Missing summary | 1h |
