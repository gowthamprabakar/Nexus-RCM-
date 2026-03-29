# Feature Specification: NEXUS RCM Intelligence Platform

**Feature Branch**: `nexus-rcm-platform`
**Created**: 2026-03-26
**Status**: Active
**Input**: RCM Bible (5 documents, 700+ items), Constitution v1.0.0, Marcus Chen SME validation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - RCM Director Checks Revenue Health (Priority: P1)

The RCM Director opens Revenue Analytics and sees four tabs: Overview (total revenue, net collection rate, payer mix), Reconciliation (charge-to-payment matching across payers), AR Aging (aged buckets with root cause overlays), and Cash Flow (daily/weekly/monthly cash receipts vs forecast). Each KPI is clickable, opening a contextual investigation panel that drills through the 5-level graph: Revenue total -> Payer -> Denial Category -> Root Cause -> Individual Claim -> Full Context. The director identifies that Humana underpayments are driving a 3% revenue shortfall and clicks through to the specific contract rate discrepancies.

**Why this priority**: Revenue visibility is the core value proposition. Without this, the platform is not usable by its primary buyer (RCM Director/CFO).

**Independent Test**: Navigate to /analytics/revenue, verify all four tabs render with real API data, click a KPI to open investigation panel, drill from payer to individual claim.

**Acceptance Scenarios**:

1. **Given** the Revenue Analytics Overview tab is loaded, **When** the director views the page, **Then** total revenue, net collection rate, denial rate, and payer mix KPIs display with real data from `/api/v1/analytics/revenue-summary` and no values show $0 or NaN.
2. **Given** the director clicks a revenue KPI, **When** the investigation panel opens, **Then** the graph drill-down traverses Payer -> Denial Category -> Root Cause -> Claim via real SQL JOINs through the graph_query_service.
3. **Given** the AR Aging tab is active, **When** the director views aged buckets, **Then** each bucket shows root cause distribution (eligibility, auth, coding, payer) from the root_cause_service with confidence scores.
4. **Given** the Cash Flow tab is active, **When** the director views the forecast overlay, **Then** actual cash receipts are plotted against ADTP-based forecast from the adtp_service.

---

### User Story 2 - Denial Analyst Investigates Root Causes (Priority: P1)

The Denial Analyst opens Denial Analytics with four tabs: Overview (denial rate, top CARC codes, volume trends), Root Cause (zero-prior 7-step evidence chains per denial category), Payer Patterns (payer-specific denial behavior and variance detection), and Trends (time-series denial rate by category with anomaly detection). The analyst sees that CO-4 denials spiked 40% for Aetna last month, clicks through to the root cause analysis showing CODING_MISMATCH at 73% confidence, drills into individual claims, and identifies that modifier 25 rules changed in Aetna's Q1 policy update.

**Why this priority**: Denial management is the highest-ROI function in RCM. Every 1% denial rate reduction equals ~$2M recovered annually for a mid-size health system.

**Independent Test**: Navigate to /analytics/denials, verify four tabs render, click a CARC code to see root cause evidence chain, drill to individual claim with full 7-step analysis.

**Acceptance Scenarios**:

1. **Given** the Denial Overview tab is loaded, **When** the analyst views the page, **Then** denial rate, top 10 CARC codes, denial volume by month, and payer breakdown display from `/api/v1/denials/` endpoints.
2. **Given** the Root Cause tab shows denial categories, **When** the analyst clicks a category, **Then** the zero-prior 7-step evidence chain displays (eligibility check -> auth timeline -> coding review -> payer history -> submission gap -> contract check -> provider pattern) with confidence scores from root_cause_service.
3. **Given** the Payer Patterns tab is active, **When** the analyst selects a payer, **Then** payer-specific denial rates, variance from network average, and behavioral patterns display from `/api/v1/analytics/payer-variance`.
4. **Given** a root cause drill-down reaches an individual claim, **When** the analyst clicks the claim, **Then** the universal claim detail page opens showing denial details + RCA + ERA + eligibility_271 + prior_auth + claim_lines in a single view.

---

### User Story 3 - Payment Poster Reconciles ERA vs Bank (Priority: P1)

The Payment Poster opens Payment Intelligence with four tabs: Overview (payment volume, ADTP trends, underpayment rate), Payer Profiles (payer-specific payment behavior and ADTP), Contract Audit (expected vs actual payment by CPT code and payer), and ERA-Bank Reconciliation (matching ERA 835 transactions to bank deposits, identifying unmatched items). The poster identifies a $47K unmatched deposit from Blue Cross, traces it to 23 ERA records that posted to a different tax ID, and flags it for correction.

**Why this priority**: Payment accuracy directly impacts cash flow. Unreconciled payments are hidden revenue leakage.

**Independent Test**: Navigate to /analytics/payments, verify four tabs render, view ERA-Bank recon with match/unmatch status, drill into unmatched items.

**Acceptance Scenarios**:

1. **Given** the Payment Overview tab is loaded, **When** the poster views the page, **Then** total payments, ADTP by payer, underpayment rate, and payment velocity KPIs display from `/api/v1/payments/` endpoints.
2. **Given** the Contract Audit tab is active, **When** the poster selects a payer and CPT code, **Then** expected payment (from payer_contract_rate) vs actual payment (from era_payments) displays with variance percentage.
3. **Given** the ERA-Bank Recon tab is active, **When** the poster views the reconciliation grid, **Then** ERA records are matched to bank deposits with status (matched/unmatched/partial) from `/api/v1/reconciliation/`.
4. **Given** an unmatched ERA record is selected, **When** the poster clicks it, **Then** the full ERA detail with check number, payer, amount, and suggested bank match displays.

---

### User Story 4 - Claims Lifecycle Tracking with CRS Scoring (Priority: P1)

The Claims team opens Claims Pipeline to see claims at each lifecycle stage (Created -> Scrubbed -> Submitted -> Acknowledged -> Adjudicated -> Paid/Denied) with CRS (Claim Risk Score) overlays. High-risk claims (CRS > 0.7) are visually flagged. The team can filter by payer, provider, date range, and CRS threshold to prioritize pre-submission intervention.

**Why this priority**: Proactive claim management via CRS scoring prevents denials before they occur, directly supporting the Prevention layer of the three-layer architecture.

**Independent Test**: Navigate to /analytics/claims-pipeline, verify lifecycle stages display with real claim counts, filter by CRS threshold, click a claim to see detail.

**Acceptance Scenarios**:

1. **Given** the Claims Pipeline is loaded, **When** the user views the page, **Then** claim counts per lifecycle stage display from `/api/v1/claims/` with real data.
2. **Given** CRS scoring is active, **When** the user filters by CRS > 0.7, **Then** only high-risk claims display with their risk factors from `/api/v1/crs/`.
3. **Given** a high-risk claim is selected, **When** the user clicks it, **Then** the universal claim detail page opens with CRS breakdown, risk factors, and recommended pre-submission actions.

---

### User Story 5 - Command Center Unified Dashboard (Priority: P2)

The RCM Director opens the Command Center to see a single-screen overview of organizational revenue health: revenue trend (30-day sparkline), denial rate trend, AR aging summary, cash flow status, and active automation actions. Each widget is clickable, navigating to the relevant analytics page. An investigation panel slides in from the right when any KPI anomaly is detected, showing diagnostic findings from the diagnostic_service.

**Why this priority**: The command center is the landing page but depends on all P1 analytics being functional first.

**Independent Test**: Navigate to /, verify all widgets render with real data, click a widget to navigate to the correct analytics page.

**Acceptance Scenarios**:

1. **Given** the Command Center loads, **When** the director views the page, **Then** revenue, denial, AR, cash flow, and automation summary widgets display with real API data.
2. **Given** a KPI anomaly is detected (e.g., denial rate > threshold), **When** the anomaly indicator appears, **Then** clicking it opens the investigation panel with diagnostic findings and recommended actions.
3. **Given** the investigation panel is open, **When** the director clicks "View Details," **Then** navigation goes to the relevant analytics page with context preserved.

---

### User Story 6 - Work Center Queue Management (Priority: P2)

Operational staff access four Work Centers: Denial (appeal queue, high-risk claims, workflow log), Claims (work queue, auto-fix center, batch actions), Collections (collections queue, alerts, payment portal), and Payment (ERA processing, payment posting, contract manager). Each work center provides actionable queues sorted by priority, with one-click actions (approve appeal, resubmit claim, post payment) and audit trail logging.

**Why this priority**: Work centers are the action layer where analytics findings become operational tasks. They depend on the analytics layer being complete.

**Independent Test**: Navigate to /work-centers/denials, verify queue loads with prioritized items, take an action (approve/reject), verify audit trail entry.

**Acceptance Scenarios**:

1. **Given** the Denial Work Center loads, **When** the analyst views the queue, **Then** denial items display sorted by recoverable amount with recommended action from the automation_engine.
2. **Given** the Claims Work Center loads, **When** the user views auto-fix candidates, **Then** claims eligible for automated correction display with the proposed fix and one-click approve.
3. **Given** an action is taken in any work center, **When** the user approves/rejects, **Then** the action is logged in the audit trail with timestamp, user, and outcome.

---

### User Story 7 - Automation Dashboard Rule Management (Priority: P2)

The Automation Manager opens the Automation Dashboard to view all 7 active automation rules, their evaluation status (learning/active/paused), trigger counts, action counts, and success rates. The manager can approve pending actions (Tier 2), review rule performance, and adjust thresholds. Each rule traces back to the diagnostic that triggered it.

**Why this priority**: Automation governance is required before expanding from 7 to 20+ rules. The dashboard ensures human-in-the-loop oversight.

**Independent Test**: Navigate to /work-centers/automation, verify rules display with status, approve a pending action, verify status change.

**Acceptance Scenarios**:

1. **Given** the Automation Dashboard loads, **When** the manager views rules, **Then** all 7 rules display with status, trigger count, and success rate from `/api/v1/diagnostics/automation-actions`.
2. **Given** a Tier 2 action is pending, **When** the manager clicks approve, **Then** the action executes and the audit trail records the approval.
3. **Given** a rule performance is reviewed, **When** the manager views the rule detail, **Then** the connected diagnostic, trigger conditions, and historical outcomes display.

---

### User Story 8 - LIDA AI Chat and Revenue Forecast (Priority: P3)

The CFO opens LIDA Intelligence to access AI Chat (natural language queries against RCM data powered by Ollama llama3) and Revenue Forecast (3-layer model: Gross Charge forecast -> Denial-adjusted net -> ADTP-timed cash realization with 30/60/90 day projections and confidence intervals). The CFO asks "Why did collections drop 8% last month?" and LIDA returns a narrative backed by real database statistics, citing specific payer, denial category, and dollar amounts.

**Why this priority**: AI features require all underlying analytics and data layers to be stable. Forecast accuracy depends on complete historical data.

**Independent Test**: Navigate to /intelligence/lida, ask a question in chat, verify response contains real numbers from the database. Navigate to /intelligence/forecast, verify 30/60/90 day projections render.

**Acceptance Scenarios**:

1. **Given** the LIDA Chat is open, **When** the CFO types a revenue question, **Then** the response includes real database statistics (not fabricated numbers) with source citations from `/api/v1/ai/insights`.
2. **Given** the Revenue Forecast page loads, **When** the CFO views projections, **Then** 30/60/90 day forecasts display with confidence intervals from `/api/v1/forecast/`.
3. **Given** a forecast anomaly is detected, **When** the CFO clicks the anomaly, **Then** the contributing factors display (payer mix shift, denial rate change, ADTP variance).

---

### User Story 9 - Prevention Engine Pre-Submission Intervention (Priority: P3)

The system proactively identifies claims at risk before submission: timely filing deadlines approaching (< 5 days), eligibility that needs re-verification (coverage changed since last check), and prior authorizations expiring before scheduled procedures. Prevention alerts surface in the Claims Pipeline and Command Center, enabling staff to intervene before revenue is lost.

**Why this priority**: Prevention is Layer 3 of the three-layer architecture and requires Layers 1 (Analytics) and 2 (Automation) to be complete. This is net-new functionality not yet built.

**Independent Test**: Verify prevention alerts appear for claims approaching timely filing deadlines, verify eligibility re-check triggers for changed coverage.

**Acceptance Scenarios**:

1. **Given** a claim is 5 days from timely filing deadline, **When** the prevention engine evaluates it, **Then** an alert surfaces in the Claims Pipeline and Command Center with days remaining and recommended action.
2. **Given** a patient's eligibility status changed since the last verification, **When** the prevention engine detects the change, **Then** an eligibility re-verification task is created in the Claims Work Center.
3. **Given** a prior authorization expires within 7 days of a scheduled procedure, **When** the prevention engine detects it, **Then** an auth renewal alert surfaces with the procedure details and expiration date.

---

### Edge Cases

- What happens when the backend is unreachable? Loading skeleton displays, then static fallback constants (FALLBACK_*) render with a "Data unavailable" banner. No mock data.
- How does the system handle a payer with zero denials? The payer appears in the list with 0% denial rate; drill-down shows "No denials in period" rather than hiding the payer.
- What happens when root cause confidence is below 50%? The evidence chain displays with a "Low Confidence" badge and the contributing factors are shown but no single root cause is highlighted.
- How does the system handle concurrent users taking the same automation action? Optimistic locking on automation_actions table; second user sees "Action already taken by [user]" message.
- What happens when Ollama LLM is offline? AI insight sections show "AI analysis unavailable" with a retry button. All non-AI sections continue to function normally.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render all analytics pages with real data from PostgreSQL via FastAPI endpoints. No mock data in production code paths (Constitution Principle VII).
- **FR-002**: System MUST support 5-level graph drill-down from aggregate KPI to individual claim via claim_id JOINs (Constitution Principle III).
- **FR-003**: System MUST limit each page to maximum ONE AI insight section backed by real database statistics injected into the Ollama prompt (Constitution Principles IV, V).
- **FR-004**: System MUST provide contextual investigation panels that open FROM the page the user is on, not as separate navigation targets (Constitution Principle VI).
- **FR-005**: System MUST compute root cause analysis using the zero-prior 7-step evidence chain, never confirming payer-provided denial category labels without independent verification (Constitution Principle I).
- **FR-006**: System MUST evaluate automation rules with human-in-the-loop approval for Tier 2+ actions and log all actions to audit trail.
- **FR-007**: System MUST display CRS (Claim Risk Score) for claims in the pipeline, computed from eligibility, auth, coding, payer history, and submission gap factors.
- **FR-008**: System MUST reconcile ERA 835 payments against bank deposits, identifying matched, unmatched, and partial-match records.
- **FR-009**: System MUST surface prevention alerts for timely filing deadlines, eligibility changes, and auth expirations before claims are at risk.
- **FR-010**: System MUST support the three-layer architecture: Analytics discovers -> Automation acts -> Prevention learns. No feature spans multiple layers (Constitution Principle II).

### Key Entities

- **Claim**: Central entity (claim_id PK), links to all other entities. 500K records. Attributes: payer, provider, DOS, charges, status, CRS score.
- **Denial**: Denied claim with CARC/RARC codes, denial date, recoverable amount. 56K records. Links to root_cause_analysis.
- **ERA Payment**: Electronic remittance (835) with check number, payer, amount, adjustment codes. 315K records. Links to bank_reconciliation.
- **Root Cause Analysis**: 7-step evidence chain per denial with confidence scores per factor. Links to claim via claim_id.
- **Payer Contract Rate**: Expected payment by CPT code and payer. 800 records. Used for underpayment detection.
- **Automation Action**: Rule evaluation result with action type, status (pending/approved/rejected), audit trail.
- **Eligibility 271**: Insurance verification response with coverage status, deductible, OOP remaining.
- **Prior Auth**: Authorization record with auth number, expiration date, approved units.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All analytics pages render with real API data in under 2 seconds (p95 load time).
- **SC-002**: Graph drill-down from aggregate KPI to individual claim completes in 5 clicks or fewer.
- **SC-003**: Root cause engine produces evidence chains with >60% average confidence score across all denial categories.
- **SC-004**: ERA-Bank reconciliation achieves >95% automatic match rate for payments within 30 days.
- **SC-005**: Automation rules process pending actions within 1 second of trigger, with 100% audit trail coverage.
- **SC-006**: Prevention engine identifies at-risk claims at least 3 business days before the deadline.
- **SC-007**: LIDA AI responses contain zero fabricated numbers (all statistics traceable to database queries).
- **SC-008**: Revenue forecast achieves +/-3% MAPE at 30 days, +/-5% at 60 days, +/-7% at 90 days.

## Assumptions

- PostgreSQL database contains 500K claims, 56K denials, 315K ERA payments, 50 payers, 200 providers, and 800 contract rates (already loaded).
- Ollama LLM (llama3 8B) is running locally at localhost:11434 for AI features.
- All users access the platform via modern browsers (Chrome, Firefox, Safari) on desktop. Mobile is out of scope for v1.
- The existing sidebar structure (15 items after restructure from 55) is the final navigation architecture.
- Backend API layer with 15+ routers and 50+ endpoints is operational and returning real data.
- Root cause engine with zero-prior 7-step analysis and 56K backfilled records is operational.
- Design tokens use the `th-*` prefix for Tailwind dark theme consistency.
