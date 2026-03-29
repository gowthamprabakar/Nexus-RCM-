# NEXUS RCM -- Page Presentation Audit

**Generated**: 2026-03-27
**Scope**: Every primary page in the NEXUS RCM frontend, audited for data completeness, integration depth, and improvement opportunities.

---

## Page: Command Center

- **Route**: `/` (index)
- **APIs called**:
  - `api.analytics.getPipeline()`
  - `api.denials.getSummary()`
  - `api.crs.getSummary()`
  - `api.ar.getSummary()`
  - `api.payments.getSummary()`
  - `api.rootCause.getSummary()`
  - `api.diagnostics.getFindings()`
  - `api.ai.getInsights('command-center')`
- **Data displayed**: 8 executive KPIs (Total Pipeline, Clean Claim Ratio, Denial Rate, Days in A/R, First-Pass Rate, Net Collection Rate, Revenue at Risk, System Health), sparklines on each KPI, AI insights panel with static fallbacks, prescriptive actions, root cause investigation panel, diagnostic findings panel.
- **Root cause integration**: YES -- calls `api.rootCause.getSummary()` and surfaces a `RootCauseInvestigationPanel` component with summary data.
- **Diagnostic integration**: YES -- calls `api.diagnostics.getFindings()` and uses the response to populate a findings section.
- **AI (Ollama) integration**: YES -- calls `api.ai.getInsights('command-center')` for streamed insights; falls back to `STATIC_FALLBACK_CC_INSIGHTS` (4 items at Diagnostic/Predictive/Prescriptive levels).
- **MiroFish integration**: NO -- no simulation calls.
- **What's MISSING**:
  - No week-over-week delta indicators on KPIs (trends are hardcoded strings like "+3.6%", not computed from real data).
  - No forecast data embedded (e.g., next-week projected revenue).
  - No collections summary or queue count surfaced.
  - No prevention alert count badge.
  - No simulation "quick-run" launcher.
- **Improvement suggestions**:
  1. Replace hardcoded trend strings with real week-over-week deltas computed from time-series data.
  2. Add a "Revenue Forecast Mini" strip showing the next 4-week Prophet projection.
  3. Surface top 3 prevention alerts as a warning banner.
  4. Add a MiroFish "What-If Quick Run" button linking to simulation.
  5. Show collections queue count and overdue alerts badge.

---

## Page: Executive Dashboard (Revenue Analytics Overview)

- **Route**: `/analytics/revenue/overview`
- **APIs called**:
  - `api.analytics.getPipeline()`
  - `api.denials.getSummary()`
  - `api.crs.getSummary()`
  - `api.ar.getSummary()`
  - `api.payments.getSummary()`
  - `api.ar.getTrend()`
  - `api.tickets.listActive()`
  - `api.ai.getInsights('command-center')`
  - `api.tickets.create()` (action)
- **Data displayed**: KPI cards (pipeline, denial rate, A/R days, collection rate), A/R trend chart, active tickets list, AI insights sidebar, date range picker, filter chips, audit log modal.
- **Root cause integration**: NO -- does not call `api.rootCause.*`.
- **Diagnostic integration**: NO -- does not call `api.diagnostics.*`.
- **AI (Ollama) integration**: YES -- calls `api.ai.getInsights('command-center')` with static fallbacks (`STATIC_FALLBACK_EXEC_INSIGHTS`).
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No root cause breakdown for why denial rate or A/R are at current levels.
  - No diagnostic findings surfaced.
  - No payer-level drill-down on the overview.
  - No forecast overlay on the A/R trend chart.
  - Week deltas are static, not computed.
- **Improvement suggestions**:
  1. Add root cause summary tiles (top 3 denial root causes with impact amounts).
  2. Overlay Prophet forecast line on the A/R trend chart.
  3. Add a "Diagnostics Alert" count badge showing critical findings.
  4. Compute real week-over-week deltas from backend time-series.
  5. Add payer performance mini-table showing top 5 payers by revenue.

---

## Page: Denial Analytics

- **Route**: `/analytics/denials/overview`
- **APIs called**:
  - `api.denials.getSummary()`
  - `api.rootCause.getSummary()`
  - `api.analytics.getDenialMatrix()`
  - `api.analytics.getAppealWinRates()`
  - `api.ai.getInsights('denials')`
  - `api.rootCause.getTrending()`
- **Data displayed**: Denial summary KPIs (total denials, revenue at risk, appeal success rate, projected recovery, AI prevention impact, open appeals), category breakdown with bar charts, root cause distribution by group (PREVENTABLE/PROCESS/PAYER), denial heatmap matrix, appeal win rates, AI insight cards, trending root causes over time.
- **Root cause integration**: YES -- deeply integrated. Calls `api.rootCause.getSummary()` and `api.rootCause.getTrending()` to show root cause distribution by group and trending patterns.
- **Diagnostic integration**: NO -- does not call `api.diagnostics.*`.
- **AI (Ollama) integration**: YES -- calls `api.ai.getInsights('denials')`.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No diagnostic findings (e.g., payer-specific diagnostic anomalies).
  - No simulation link for "what if we fix top root cause."
  - No week-over-week delta on KPIs.
  - No prevention correlation (how many denials could have been prevented).
- **Improvement suggestions**:
  1. Add diagnostic findings panel showing payer anomalies related to denials.
  2. Add "Simulate Fix" button per root cause that launches MiroFish scenario.
  3. Compute real week deltas on KPI cards.
  4. Cross-link prevention alerts that relate to denial categories.
  5. Add a "Denial Velocity" sparkline showing denial count trend over 12 weeks.

---

## Page: Root Cause Intelligence

- **Route**: `/analytics/denials/root-cause`
- **APIs called**:
  - `api.rootCause.getSummary()`
  - `api.ai.getInsights('root-cause')`
- **Data displayed**: Total analyzed claims, top root cause, preventable percentage, average confidence, distribution table (root cause, count, impact, confidence, group), group summary (PREVENTABLE/PROCESS/PAYER/CLINICAL counts), recent analyses.
- **Root cause integration**: YES -- this IS the root cause page. Full distribution, groups, confidence scoring.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: YES -- calls `api.ai.getInsights('root-cause')`.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No trending data (despite being available via `api.rootCause.getTrending()`).
  - No diagnostic correlation.
  - No simulation "what-if" for each root cause.
  - No drill-down to affected claims (link exists but data fetch is minimal).
  - No payer filter.
- **Improvement suggestions**:
  1. Add `api.rootCause.getTrending()` call to show 12-week trends per root cause.
  2. Add payer filter to scope root cause analysis by payer.
  3. Add "Simulate Fix" button per root cause linking to MiroFish.
  4. Show diagnostic findings correlated to each root cause.
  5. Add a Sankey or flow diagram: Payer -> Category -> Root Cause -> Impact.

---

## Page: Payment Dashboard (Payment Intelligence Overview)

- **Route**: `/analytics/payments/overview`
- **APIs called**:
  - `api.payments.getSummary()`
  - `api.payments.getTriangulationSummary()`
  - `api.payments.getSilentUnderpayments()`
  - `api.payments.getADTP()`
  - `api.ai.getInsights('payments')`
  - `api.payments.getERABankMatch()`
- **Data displayed**: KPIs (total ERA posted, bank deposits, ERA-bank variance, underpayment count, avg ADTP), payer ranking table from triangulation, payment status breakdown from ERA-bank match, AI insight narrative and cards, silent underpayment alerts.
- **Root cause integration**: NO.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: YES -- calls `api.ai.getInsights('payments')` with narrative support.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No root cause analysis for underpayments.
  - No diagnostic findings for payment anomalies.
  - No float analysis display (API exists: `api.payments.getFloatAnalysis()`).
  - No forecast overlay showing expected payment timing.
  - No week-over-week deltas.
- **Improvement suggestions**:
  1. Add root cause tags to silent underpayments (why is each payer underpaying?).
  2. Surface float analysis data (API already exists but is unused here).
  3. Add Prophet forecast overlay showing expected payment inflows.
  4. Add diagnostic panel for payment anomalies.
  5. Compute real week deltas on KPIs.

---

## Page: A/R Aging

- **Route**: `/analytics/revenue/ar-aging`
- **APIs called**:
  - `api.ar.getSummary()`
  - `api.ar.getTrend()`
  - `api.ar.getAgingRootCause()`
- **Data displayed**: KPIs (total A/R, avg days, total claims, recovery rate), aging bucket breakdown with color-coded bars (0-30, 31-60, 61-90, 91-120, 120+), A/R trend line chart, payer breakdown table, aging root cause analysis.
- **Root cause integration**: YES -- calls `api.ar.getAgingRootCause()` to show why claims are aging.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: NO -- no `api.ai.*` calls.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No AI insights for A/R patterns.
  - No diagnostic findings.
  - No simulation for "what if we resolve 120+ bucket."
  - No collections queue link per bucket.
  - No week-over-week deltas on KPIs.
- **Improvement suggestions**:
  1. Add `api.ai.getInsights('ar-aging')` call for AI-powered insights.
  2. Add diagnostic findings related to aging patterns.
  3. Add "Simulate Resolution" button per bucket linking to MiroFish.
  4. Link each aging bucket to filtered collections queue.
  5. Add week-over-week trend indicators on KPI cards.

---

## Page: Cash Flow

- **Route**: `/analytics/revenue/cash-flow`
- **APIs called**:
  - `api.payments.getTriangulationSummary()`
  - `api.forecast.getSummary()`
  - `api.reconciliation.getSummary()`
  - `api.payments.getSummary()`
- **Data displayed**: KPIs (bank deposited, ERA received, ERA-bank gap, gap percentage), float days estimate, payer breakdown from triangulation, forecast weekly data with grand total, reconciliation summary.
- **Root cause integration**: NO.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: NO.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No AI insights.
  - No root cause analysis for cash flow gaps.
  - No diagnostic findings.
  - No Prophet forecast integration (uses basic forecast only).
  - No simulation for cash flow scenarios.
  - No week-over-week deltas.
- **Improvement suggestions**:
  1. Add `api.ai.getInsights('cash-flow')` for AI narrative.
  2. Integrate Prophet forecast (`api.forecast.prophetWeekly()`) for more accurate projections.
  3. Add root cause analysis for ERA-bank gaps.
  4. Add MiroFish "90-Day Cash Flow" simulation launcher.
  5. Add diagnostic panel for reconciliation anomalies.
  6. Add week-over-week deltas on all KPIs.

---

## Page: Collections Hub

- **Route**: Legacy page (referenced internally)
- **APIs called**:
  - `api.ai.getInsights('collections')`
  - `api.ar.getSummary()`
  - `api.collections.getSummary()`
  - `api.collections.getQueue({ page: 1, size: 10 })`
  - `api.denials.getSummary()`
  - `api.payments.getSummary()`
- **Data displayed**: Extended aging buckets with collectability scores (hardcoded), high-risk worklist (hardcoded), KPI cards, A/R aging chart, trend chart, collection velocity chart, denial reasons chart, payment distribution chart, top CPT codes chart, AI insight cards, filter chips, date range picker.
- **Root cause integration**: NO direct root cause API calls. Some hardcoded data references root causes.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: YES -- calls `api.ai.getInsights('collections')`.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - High-risk worklist is entirely hardcoded (not from API).
  - Aging buckets are hardcoded, not from `api.ar.getSummary()`.
  - No root cause integration for why accounts are in collections.
  - No diagnostic findings.
  - No simulation for collection strategy optimization.
  - No propensity-to-pay model integration.
- **Improvement suggestions**:
  1. Replace hardcoded aging buckets with live `api.ar.getSummary()` data.
  2. Replace hardcoded high-risk worklist with `api.crs.getHighRisk()`.
  3. Add root cause analysis for accounts in collections.
  4. Add propensity-to-pay scoring from `api.collections.getPropensity()`.
  5. Add MiroFish simulation for collection strategy scenarios.

---

## Page: Collections Queue

- **Route**: `/work/collections/queue`
- **APIs called**:
  - `api.collections.getQueue({ page: 1, size: 50 })`
  - `api.ai.getCallScript()` (on-demand per task)
- **Data displayed**: Task queue table (patient, payer, balance, days A/R, propensity score, priority, next action, task type, collector), AI-generated call scripts, filter chips (date range, payer, priority, collector, task type, propensity bucket), hardcoded fallback tasks.
- **Root cause integration**: NO.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: YES -- calls `api.ai.getCallScript()` for AI-generated call scripts per task.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No root cause context for why each account needs collection.
  - No diagnostic findings per account.
  - No AI insights panel (only call scripts).
  - No propensity model detail (score shown but no explanation).
  - No week-over-week metrics.
  - No team performance metrics displayed.
- **Improvement suggestions**:
  1. Add root cause tag per collection task showing denial reason or payment gap.
  2. Add AI insights panel for overall collections patterns.
  3. Show propensity score breakdown (factors driving the score).
  4. Add team performance widget from `api.collections.getUserPerformance()`.
  5. Add diagnostic findings per account on hover/expand.

---

## Page: Automation Dashboard

- **Route**: `/work/automation`
- **APIs called**:
  - `api.automation.getRules()`
  - `api.automation.getPending()`
  - `api.automation.getAudit(50)`
  - `api.automation.toggleRule()` (action)
  - `api.automation.approveAction()` (action)
  - `api.automation.rejectAction()` (action)
  - `api.automation.evaluate()` (action)
- **Data displayed**: Automation rules list with enable/disable toggles, pending actions requiring approval, audit log of executed actions, KPI cards, live/demo mode toggle, rule evaluation trigger.
- **Root cause integration**: NO.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: NO direct AI insight calls.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No AI insights for automation performance.
  - No root cause correlation (which rules address which root causes).
  - No diagnostic integration.
  - No simulation for rule impact prediction.
  - No ROI calculation per rule.
  - No week-over-week automation metrics.
- **Improvement suggestions**:
  1. Add `api.ai.getInsights('automation')` for AI-powered recommendations.
  2. Map each automation rule to the root causes it addresses.
  3. Add ROI/impact calculation per rule (savings generated).
  4. Add MiroFish simulation: "what if we enable rule X?"
  5. Add week-over-week metrics (actions processed, success rate trends).

---

## Page: Prevention Dashboard

- **Route**: `/analytics/prevention`
- **APIs called**:
  - `api.prevention.scan()`
  - `api.prevention.getAlerts(filters)`
  - `api.prevention.scan(200)` (on "Scan Now" action)
  - `api.prevention.dismiss(alertId)` (action)
- **Data displayed**: Summary KPIs (total alerts, critical count, revenue at risk), alert cards by type (ELIGIBILITY_RISK, AUTH_EXPIRY, TIMELY_FILING_RISK, DUPLICATE_CLAIM, HIGH_RISK_PAYER_CPT), type filter cards with counts and revenue, severity badges, sortable/filterable alert list, dismiss actions.
- **Root cause integration**: NO -- no explicit root cause API calls. Prevention types loosely map to root causes.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: NO.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No AI insights for prevention patterns.
  - No root cause correlation (which root causes these alerts prevent).
  - No diagnostic engine integration.
  - No simulation for prevention impact.
  - No historical trend of alerts over time.
  - No prevention summary API used (`api.prevention.getSummary()` exists but not called alongside scan).
- **Improvement suggestions**:
  1. Add `api.ai.getInsights('prevention')` for AI narrative.
  2. Map each prevention type to corresponding root causes.
  3. Add historical trend chart showing alert volume over 12 weeks.
  4. Add MiroFish simulation for "impact if all critical alerts addressed."
  5. Call `api.prevention.getSummary()` for richer summary data.
  6. Add diagnostic correlation panel.

---

## Page: Simulation Dashboard (MiroFish Engine)

- **Route**: `/intelligence/simulation`
- **APIs called**:
  - `api.simulation.getScenarios()`
  - `api.simulation.getPayerAgents()`
  - `api.simulation.run()` (action)
  - `api.simulation.getStatus()` (polling)
  - `api.simulation.getResults()` (after completion)
- **Data displayed**: Scenario cards (5 default scenarios with affected claims and estimated impact), payer agent profiles (10 defaults with denial rate, ADTP, payment behavior, contract compliance), simulation runner with progress bar, results display after completion.
- **Root cause integration**: NO explicit root cause API calls. Scenarios implicitly reference root causes (e.g., "Auto-Appeal Coding Mismatches").
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: NO.
- **MiroFish integration**: YES -- this IS the MiroFish page. Full scenario runner with payer agents, live status polling, and results display.
- **What's MISSING**:
  - No AI insight interpretation of simulation results.
  - No root cause data feeding into scenario parameters.
  - No diagnostic findings influencing scenarios.
  - No live payer agents (`api.simulation.getLivePayerAgents()` exists but is unused).
  - No ontology display (`api.simulation.getOntology()` exists but is unused).
  - No comparison mode (run A vs run B).
- **Improvement suggestions**:
  1. Add AI narrative interpretation of simulation results using `api.ai.getInsights()`.
  2. Use live payer agents from `api.simulation.getLivePayerAgents()`.
  3. Display ontology graph from `api.simulation.getOntology()`.
  4. Feed root cause data into scenario parameters for data-driven scenarios.
  5. Add comparison mode to evaluate multiple scenarios side-by-side.
  6. Add diagnostic findings as scenario input context.

---

## Page: Revenue Forecast

- **Route**: `/intelligence/forecast`
- **APIs called**:
  - `api.forecast.prophetAccuracy()`
  - `api.forecast.prophetWeekly(weeksAhead)`
  - `api.forecast.prophetDaily(30)`
  - `api.forecast.get3Layer(weeksAhead)`
  - `api.ai.getInsights('forecast')`
  - `api.forecast.getSummary()` (fallback if Prophet unavailable)
- **Data displayed**: Prophet model accuracy metrics (MAPE), weekly forecast table with gross/denial-loss/net breakdown, daily forecast heatmap, 3-layer forecast (base + denial adjustment), AI insight cards, week-over-week expandable details, payer filter.
- **Root cause integration**: PARTIAL -- 3-layer model incorporates denial reduction percentage but does not show specific root causes.
- **Diagnostic integration**: NO.
- **AI (Ollama) integration**: YES -- calls `api.ai.getInsights('forecast')`.
- **MiroFish integration**: NO (could benefit from scenario comparison).
- **What's MISSING**:
  - No root cause breakdown of which denial categories drive forecast adjustments.
  - No diagnostic findings affecting forecast confidence.
  - No simulation integration (forecast vs scenario comparison).
  - No payer-level forecast drill-down in the UI (API supports `payerId` param).
  - No reconciliation data showing forecast accuracy over past weeks.
- **Improvement suggestions**:
  1. Add root cause breakdown showing which denial types drive the 3-layer adjustment.
  2. Add payer-level forecast drill-down (API already supports it).
  3. Add MiroFish scenario overlay on forecast chart.
  4. Show forecast reconciliation data (`api.forecast.getReconciliationSummary()`).
  5. Add diagnostic context for forecast confidence intervals.

---

## Page: Claim Root Cause Detail

- **Route**: `/analytics/denials/root-cause/claim/:claimId`
- **APIs called**:
  - `api.graph.getClaimFullContext(claimId)`
  - `api.ai.getInsights('denials')` (filtered to matching category)
  - `api.rootCause.validateClaim(claimId)` (on-demand action)
- **Data displayed**: Full claim context (claim details, payer info, denial info, root cause analysis, payment history, ERA trail, contract comparison, reconciliation status), claim lifecycle pipeline visualization, root cause graph component, AI insight card matched to denial category, validation action button, status/priority badges.
- **Root cause integration**: YES -- deeply integrated. Shows root cause analysis from `graph.getClaimFullContext()`, displays RootCauseGraph component, supports validation via `api.rootCause.validateClaim()`.
- **Diagnostic integration**: PARTIAL -- claim diagnostic data may be embedded in the full context response but `api.diagnostics.getClaimDiagnostic()` is not explicitly called.
- **AI (Ollama) integration**: YES -- fetches AI insights and matches to denial category.
- **MiroFish integration**: NO.
- **What's MISSING**:
  - No explicit diagnostic engine call (`api.diagnostics.getClaimDiagnostic()` exists).
  - No simulation of claim outcome under different scenarios.
  - No similar-claims comparison.
  - No appeal draft generation link (API exists: `api.ai.draftAppeal()`).
- **Improvement suggestions**:
  1. Call `api.diagnostics.getClaimDiagnostic(claimId)` for dedicated diagnostic findings.
  2. Add "Draft Appeal" button using `api.ai.draftAppeal()`.
  3. Add "Simulate Resolution" linking to MiroFish.
  4. Show similar denied claims with same root cause.
  5. Add timeline visualization of claim lifecycle events.

---

# Summary Table

| Page | Root Cause | Diagnostics | AI Insights | MiroFish | Week Deltas | Score |
|------|:---------:|:-----------:|:-----------:|:--------:|:-----------:|:-----:|
| Command Center | YES | YES | YES | NO | NO (hardcoded) | **7** |
| Executive Dashboard | NO | NO | YES | NO | NO (hardcoded) | **5** |
| Denial Analytics | YES (deep) | NO | YES | NO | NO | **7** |
| Root Cause Intelligence | YES (core) | NO | YES | NO | NO | **6** |
| Payment Dashboard | NO | NO | YES | NO | NO | **6** |
| A/R Aging | YES (aging RC) | NO | NO | NO | NO | **5** |
| Cash Flow | NO | NO | NO | NO | NO | **4** |
| Collections Hub | NO | NO | YES | NO | NO | **4** |
| Collections Queue | NO | NO | YES (scripts) | NO | NO | **5** |
| Automation Dashboard | NO | NO | NO | NO | NO | **4** |
| Prevention Dashboard | NO | NO | NO | NO | NO | **5** |
| Simulation Dashboard | NO | NO | NO | YES (core) | NO | **5** |
| Revenue Forecast | PARTIAL | NO | YES | NO | NO | **7** |
| Claim Root Cause Detail | YES (deep) | PARTIAL | YES | NO | NO | **7** |

**Legend**: YES = fully integrated, PARTIAL = some data present, NO = absent.

---

# TOP 15 Improvements Ranked by User Impact

| Rank | Improvement | Affected Pages | Impact |
|:----:|-------------|---------------|--------|
| **1** | **Compute real week-over-week deltas** on all KPI cards from time-series data instead of hardcoded strings | Command Center, Executive Dashboard, Denial Analytics, Payment Dashboard, A/R Aging, Cash Flow, Prevention | CRITICAL -- currently every KPI trend is a static lie; users cannot trust directional indicators |
| **2** | **Add AI insights to pages that lack them** (A/R Aging, Cash Flow, Automation, Prevention) using `api.ai.getInsights()` with page-specific context | A/R Aging, Cash Flow, Automation Dashboard, Prevention Dashboard | HIGH -- 4 major pages have zero AI narrative, missing the product's core value proposition |
| **3** | **Add diagnostic findings panels** across analytics pages by calling `api.diagnostics.getFindings()` or `api.diagnostics.getClaimDiagnostic()` | Executive Dashboard, Denial Analytics, Payment Dashboard, A/R Aging, Cash Flow, Prevention | HIGH -- the Diagnostic Engine (Sprint 6) is built but only surfaced on Command Center |
| **4** | **Add MiroFish simulation launchers** ("Simulate Fix" / "What-If") on pages where users identify problems | Denial Analytics, Root Cause Intelligence, A/R Aging, Prevention Dashboard, Revenue Forecast | HIGH -- simulation engine is fully built but only accessible from its dedicated page; contextual launch would drive adoption |
| **5** | **Replace hardcoded data in Collections Hub** (aging buckets, high-risk worklist) with live API data from `api.ar.getSummary()` and `api.crs.getHighRisk()` | Collections Hub | HIGH -- users are seeing fake data on a critical work page |
| **6** | **Add root cause context to Payment Dashboard** showing why each payer underpays and linking silent underpayments to root causes | Payment Dashboard | HIGH -- $100K+ in silent underpayments shown without explanation |
| **7** | **Add trending root cause chart to Root Cause Intelligence** by calling `api.rootCause.getTrending()` (API exists, page does not call it) | Root Cause Intelligence | MEDIUM-HIGH -- the page's own trending API is available but unused |
| **8** | **Add payer-level forecast drill-down** in Revenue Forecast (API already supports `payerId` parameter) | Revenue Forecast | MEDIUM-HIGH -- users need payer-specific projections; backend already supports it |
| **9** | **Add root cause correlation to Prevention Dashboard** mapping each prevention type (ELIGIBILITY_RISK, AUTH_EXPIRY, etc.) to its corresponding root cause category | Prevention Dashboard | MEDIUM-HIGH -- connects the prevention-to-root-cause loop |
| **10** | **Surface unused payment APIs** (`api.payments.getFloatAnalysis()`) on Payment Dashboard and Cash Flow | Payment Dashboard, Cash Flow | MEDIUM -- float analysis API is built and unused; directly actionable data |
| **11** | **Add forecast reconciliation display** using `api.forecast.getReconciliationSummary()` on Revenue Forecast to show historical accuracy | Revenue Forecast | MEDIUM -- builds user trust in the forecast model |
| **12** | **Add ROI/impact metrics per automation rule** on Automation Dashboard showing savings generated by each rule | Automation Dashboard | MEDIUM -- automation page lacks any ROI justification |
| **13** | **Use live payer agents and ontology** on Simulation Dashboard from `api.simulation.getLivePayerAgents()` and `api.simulation.getOntology()` | Simulation Dashboard | MEDIUM -- two APIs exist but page uses only defaults |
| **14** | **Add "Draft Appeal" button on Claim Root Cause Detail** using existing `api.ai.draftAppeal()` endpoint | Claim Root Cause Detail | MEDIUM -- natural workflow action missing from the detail page |
| **15** | **Add team performance widget on Collections Queue** using `api.collections.getUserPerformance()` and `api.collections.getTeamMetrics()` | Collections Queue | MEDIUM -- available APIs unused; helps managers track collector productivity |

---

# Cross-Cutting Observations

1. **Hardcoded trends are the #1 credibility risk**: Nearly every KPI card shows trends like "+3.6%" or "-2.1 days" that are static strings. Users will quickly discover these never change and lose trust in the platform.

2. **Diagnostic Engine is severely under-surfaced**: The `api.diagnostics.*` endpoints (Sprint 6) are only consumed by Command Center. Every analytics page should show relevant diagnostic findings.

3. **MiroFish is siloed**: The simulation engine is only accessible via its dedicated page. Contextual "What-If" launchers from problem-discovery pages (Denials, A/R, Prevention) would dramatically increase engagement.

4. **Several built APIs have zero frontend consumers**:
   - `api.payments.getFloatAnalysis()`
   - `api.payments.getADTPAnomalies()`
   - `api.simulation.getLivePayerAgents()`
   - `api.simulation.getOntology()`
   - `api.forecast.getReconciliationSummary()`
   - `api.collections.getUserPerformance()`
   - `api.collections.getTeamMetrics()`
   - `api.diagnostics.getPayerDiagnostic()`
   - `api.diagnostics.getClaimDiagnostic()`

5. **Prevention-to-Root-Cause loop is broken**: Prevention alerts and root cause analysis exist independently with no cross-linking. Users cannot see "this prevention alert would have avoided this root cause pattern."

6. **No page uses the `api.ai.explainAnomaly()` endpoint**: This Ollama-powered explainer exists but is never called when anomalies are displayed on dashboards.
