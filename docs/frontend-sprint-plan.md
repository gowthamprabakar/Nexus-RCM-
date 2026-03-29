# RCM Pulse -- Frontend Sprint Plan (Sprints 10-15)

> **Scope:** Page-by-page, module-by-module plan for wiring every frontend page to the new ML prediction pipeline, Neo4j graph layer, automation scheduler, and outcome tracking system.
>
> **Base path:** `frontend/src/`
>
> **API service:** `services/api.js`

---

## Table of Contents

1. [API Service Additions (api.js)](#1-api-service-additions)
2. [Shared UI Components to Create](#2-shared-ui-components)
3. [Command Center](#3-command-center)
4. [Denial Analytics](#4-denial-analytics)
5. [Denial Work Center](#5-denial-work-center)
6. [Payment Intelligence](#6-payment-intelligence)
7. [Claims Pipeline](#7-claims-pipeline)
8. [Collections Work Center](#8-collections-work-center)
9. [Prevention Dashboard](#9-prevention-dashboard)
10. [Revenue Forecast](#10-revenue-forecast)
11. [Simulation Engine](#11-simulation-engine)
12. [Automation Dashboard](#12-automation-dashboard)
13. [LIDA AI Chat](#13-lida-ai-chat)
14. [NEW PAGE -- Graph Explorer](#14-graph-explorer)
15. [NEW PAGE -- Outcome Tracker](#15-outcome-tracker)
16. [NEW PAGE -- ML Model Monitor](#16-ml-model-monitor)
17. [Route Registration](#17-route-registration)
18. [Sprint Allocation](#18-sprint-allocation)

---

## 1. API Service Additions

**File:** `src/services/api.js`

All new namespaces and methods to add below the existing `lida` block (line ~1307).

### 1A. `predictions` namespace (NEW)

```
predictions: {
    getDenialProbability(claimId)
        GET /api/v1/predictions/denial-probability/{claimId}
        Returns: { claim_id, probability: 0.0-1.0, risk_tier: GREEN|AMBER|RED, model_version, features_used[], confidence }

    getDenialProbabilityBatch(claimIds[])
        POST /api/v1/predictions/denial-probability/batch
        Body: { claim_ids: [...] }
        Returns: { results: [{ claim_id, probability, risk_tier }...] }

    getPaymentDelay(claimId)
        GET /api/v1/predictions/payment-delay/{claimId}
        Returns: { claim_id, predicted_days, confidence, payer_avg_days, model_version }

    getPaymentDelayByPayer(payerId)
        GET /api/v1/predictions/payment-delay/payer/{payerId}
        Returns: { payer_id, avg_predicted_days, claims_pending, delay_distribution[] }

    getAppealSuccess(denialId)
        GET /api/v1/predictions/appeal-success/{denialId}
        Returns: { denial_id, win_probability: 0.0-1.0, recommended_strategy, similar_appeals_won, confidence }

    getPayerAnomalies(payerId)
        GET /api/v1/predictions/payer-anomalies/{payerId}
        Returns: { payer_id, anomalies: [{ metric, current, baseline, severity, detected_at }...], anomaly_score }

    getPayerAnomaliesBatch()
        GET /api/v1/predictions/payer-anomalies
        Returns: { payers: [{ payer_id, payer_name, anomaly_count, top_anomaly, severity }...] }

    getProviderRisk(providerId)
        GET /api/v1/predictions/provider-risk/{providerId}
        Returns: { provider_id, risk_score, top_risks[], denial_rate_trend, recommended_actions[] }

    getCollectionPropensity(taskId)
        GET /api/v1/predictions/collection-propensity/{taskId}
        Returns: { task_id, propensity_score: 0-100, expected_recovery, model_version, features[] }

    getCollectionPropensityBatch(filters)
        GET /api/v1/predictions/collection-propensity?priority=HIGH&payer_id=...
        Returns: { items: [{ task_id, propensity_score, expected_recovery }...] }

    getCashFlowForecast(payerId, weeks)
        GET /api/v1/predictions/cash-flow?payer_id={payerId}&weeks={weeks}
        Returns: { payer_id, weekly_forecast: [{ week, predicted_amount, confidence_low, confidence_high }...] }

    getRevenueByPayer(payerId)
        GET /api/v1/predictions/revenue-by-payer/{payerId}
        Returns: { payer_id, forecast_30d, forecast_60d, forecast_90d, trend, risk_factors[] }
}
```

### 1B. `neo4j` namespace (NEW)

```
neo4j: {
    getHealth()
        GET /api/v1/neo4j/health
        Returns: { status: connected|disconnected, node_count, relationship_count, last_sync, database_size_mb }

    getGraphData(nodeType, filters)
        GET /api/v1/neo4j/graph?node_type={nodeType}&payer_id=...&root_cause=...&limit=200
        Returns: { nodes: [{ id, label, type, properties }...], edges: [{ source, target, type, weight, label }...] }

    explorePath(fromId, toId)
        GET /api/v1/neo4j/path?from={fromId}&to={toId}
        Returns: { path: [{ node, relationship, node }...], total_weight, hops }

    getNodeNeighbors(nodeId, depth)
        GET /api/v1/neo4j/neighbors/{nodeId}?depth={depth}
        Returns: { center: {...}, neighbors: [...], edges: [...] }

    search(query)
        GET /api/v1/neo4j/search?q={query}
        Returns: { results: [{ id, type, label, score }...] }

    getRootCauseGraph(payerId)
        GET /api/v1/neo4j/root-cause-graph?payer_id={payerId}
        Returns: { nodes[], edges[], clusters[] } -- for root cause network visualization
}
```

### 1C. `scheduler` namespace (NEW)

```
scheduler: {
    getStatus()
        GET /api/v1/scheduler/status
        Returns: { running: bool, uptime_seconds, total_jobs, active_jobs, failed_last_24h, next_run_at }

    getJobs()
        GET /api/v1/scheduler/jobs
        Returns: { jobs: [{ job_id, name, rule_id, cron, status, last_run, next_run, avg_duration_ms, success_rate }...] }

    getJobHistory(jobId, limit)
        GET /api/v1/scheduler/jobs/{jobId}/history?limit={limit}
        Returns: { runs: [{ run_id, started_at, finished_at, outcome, claims_affected, error_message }...] }

    triggerJob(jobId)
        POST /api/v1/scheduler/jobs/{jobId}/trigger
        Returns: { run_id, status: queued }

    pauseJob(jobId)
        POST /api/v1/scheduler/jobs/{jobId}/pause
        Returns: { job_id, status: paused }

    resumeJob(jobId)
        POST /api/v1/scheduler/jobs/{jobId}/resume
        Returns: { job_id, status: active }
}
```

### 1D. `outcomes` namespace (NEW)

```
outcomes: {
    getAppealOutcomes(filters)
        GET /api/v1/outcomes/appeals?date_from=...&date_to=...&payer_id=...
        Returns: { total, won, lost, pending, win_rate, total_recovered, avg_recovery_time_days, by_category[], by_payer[], trend[] }

    getAutomationROI()
        GET /api/v1/outcomes/automation-roi
        Returns: { total_actions, successful, revenue_recovered, revenue_protected, cost_savings, time_saved_hours, by_rule[] }

    getModelAccuracy()
        GET /api/v1/outcomes/model-accuracy
        Returns: { models: [{ model_id, name, accuracy, precision, recall, f1, auc_roc, last_trained, sample_size, drift_detected }...] }

    getFeedbackLoopStatus()
        GET /api/v1/outcomes/feedback-loop
        Returns: { loops: [{ name, status, last_feedback_at, total_corrections, accuracy_improvement }...] }

    getOutcomeSummary()
        GET /api/v1/outcomes/summary
        Returns: { appeals: {...}, automation: {...}, predictions: {...}, prevention: {...} }
}
```

### 1E. `models` namespace (NEW)

```
models: {
    getRegistry()
        GET /api/v1/models/registry
        Returns: { models: [{ model_id, name, version, type, status, last_trained, accuracy, features_count, training_samples }...] }

    getModelDetail(modelId)
        GET /api/v1/models/{modelId}
        Returns: { ...full model metadata, hyperparameters, training_history[], feature_importance[] }

    getTrainingHistory(modelId)
        GET /api/v1/models/{modelId}/training-history
        Returns: { runs: [{ run_id, started_at, duration, metrics: { accuracy, loss, f1 }, dataset_size }...] }

    getFeatureImportance(modelId)
        GET /api/v1/models/{modelId}/feature-importance
        Returns: { features: [{ name, importance, direction, category }...] }

    getDriftReport(modelId)
        GET /api/v1/models/{modelId}/drift
        Returns: { psi_score, drift_detected, features_drifted: [{ name, psi, threshold }...], recommendation }

    retrain(modelId)
        POST /api/v1/models/{modelId}/retrain
        Returns: { job_id, status: queued, estimated_duration_minutes }
}
```

---

## 2. Shared UI Components

**Directory:** `src/components/ui/`

### 2A. `PredictionBadge.jsx` (NEW)

- Displays ML prediction score as a colored badge
- Props: `score` (0.0-1.0), `label` (optional), `size` (sm|md|lg), `showPercentage` (bool)
- Color thresholds: GREEN <= 0.3, AMBER 0.3-0.7, RED > 0.7
- Shows percentage text and a small inline progress arc
- Tooltip with model version and confidence interval

### 2B. `RiskTierBadge.jsx` (NEW)

- Displays GREEN/AMBER/RED tier as a pill badge
- Props: `tier` (GREEN|AMBER|RED), `label` (optional text)
- Used on claim rows, denial rows, collections rows

### 2C. `MiroFishValidationBadge.jsx` (NEW)

- Shows MiroFish agent validation status
- Props: `status` (validated|pending|rejected|unvalidated), `confidence` (0-100), `agentName`
- Icon: checkmark/clock/x, colored by status
- Tooltip showing agent name and confidence percentage

### 2D. `PayerAnomalyIndicator.jsx` (NEW)

- Pulsing dot + anomaly count for payer behavior anomalies
- Props: `anomalyCount`, `severity` (low|medium|high|critical), `onClick`
- Renders a small colored dot that pulses when severity >= high
- Click opens anomaly detail popover

### 2E. `GraphMiniMap.jsx` (NEW)

- Small embedded Neo4j graph preview (uses react-force-graph-2d)
- Props: `nodes[]`, `edges[]`, `width`, `height`, `onNodeClick`
- Used as inline graph preview in root cause panels, payer profiles

### 2F. `AppealPipelineTracker.jsx` (NEW)

- Horizontal step tracker showing appeal lifecycle
- Props: `currentStage` (GENERATED|SUBMITTED|IN_REVIEW|WON|LOST|EXPIRED), `timestamps`
- Steps: GENERATED -> SUBMITTED -> IN_REVIEW -> WON/LOST
- Active step highlighted, completed steps checked, future steps grayed

### 2G. `AutomationStatusChip.jsx` (NEW)

- Inline chip showing automation execution status
- Props: `status` (running|completed|failed|queued), `ruleId`, `timestamp`
- Small colored dot + label

### 2H. `ModelPerformanceSparkline.jsx` (NEW)

- Tiny inline sparkline showing model accuracy trend
- Props: `dataPoints[]`, `width`, `height`, `color`
- Used in ML Model Monitor cards

### 2I. `SchedulerJobRow.jsx` (NEW)

- Table row component for scheduler jobs
- Props: `job` object, `onTrigger`, `onPause`, `onResume`
- Shows job name, cron schedule, last run, next run, success rate bar, action buttons

### 2J. `OutcomeCard.jsx` (NEW)

- Card showing outcome metrics (won/lost/ROI)
- Props: `title`, `won`, `lost`, `totalValue`, `trend`
- Bar chart mini-visualization of win/loss ratio

---

## 3. Command Center

**File:** `src/features/dashboard/pages/CommandCenter.jsx`

### What EXISTS Currently

- Executive KPI cards (Total Pipeline, Clean Claim Ratio, Denial Rate, Days in AR, etc.)
- Revenue trend sparklines computed from `api.analytics.getPipeline()`, `api.denials.getSummary()`, `api.crs.getSummary()`, `api.ar.getSummary()`, `api.payments.getSummary()`
- Root cause summary section from `api.rootCause.getSummary()`
- Diagnostics findings from `api.diagnostics.getSummary()`
- Mock `mockCommandCenterData` as fallback
- `buildExecutiveData()` function that computes derived KPI values

### What NEEDS TO CHANGE

#### 3A. Prediction Score Widgets Row (NEW section)

**Location:** Below the executive KPI cards row, above the trend charts.

**Add a new row of 4 prediction cards:**

1. **Denial Risk Forecast** card
   - Shows aggregate denial probability for next 30 days
   - API: `api.predictions.getDenialProbabilityBatch()` (top 100 pending claims)
   - Display: average risk score, count of RED claims, count of AMBER claims
   - Click navigates to `/analytics/claims/overview` with risk filter

2. **Payment Delay Predictor** card
   - Shows average predicted payment delay across active claims
   - API: `api.predictions.getPaymentDelayByPayer('all')`
   - Display: avg predicted days, worst payer, trend arrow
   - Click navigates to `/analytics/payments/overview`

3. **Collection Propensity** card
   - Shows expected recovery from collections queue
   - API: `api.predictions.getCollectionPropensityBatch()`
   - Display: total expected recovery, count of HOT (>80) accounts
   - Click navigates to `/work/collections/queue`

4. **Appeal Win Forecast** card
   - Shows predicted win rate for pending appeals
   - API: `api.outcomes.getAppealOutcomes({ status: 'pending' })`
   - Display: predicted win rate %, estimated recovery $
   - Click navigates to `/work/denials/appeals`

#### 3B. Neo4j Graph Health Widget (NEW)

**Location:** Right sidebar or bottom of executive section.

- Small health card showing Neo4j connection status
- API: `api.neo4j.getHealth()`
- Display: green/red dot, node count, relationship count, last sync timestamp
- Click navigates to `/intelligence/graph-explorer`

#### 3C. Automation Execution Status Widget (NEW)

**Location:** Below prediction widgets or in a secondary row.

- Real-time status of the automation scheduler
- API: `api.scheduler.getStatus()`
- Display: running/paused indicator, active jobs count, failed in last 24h, next scheduled run
- Last 5 execution results as mini timeline (success/fail dots)
- Click navigates to `/work/automation`

#### 3D. Agent Swarm Status Widget (EXISTS but needs live data)

- Currently exists but may use mock data
- Wire to `api.simulation.getRCMAgents()` and `api.simulation.getSchedulerStatus()`
- Show: agent count, active simulations, last run timestamp
- Click navigates to `/intelligence/simulation`

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/dashboard/pages/CommandCenter.jsx` | Add 4 prediction cards, Neo4j health widget, automation status widget, wire Agent Swarm to live data |
| `services/api.js` | Add `predictions`, `neo4j`, `scheduler` namespaces |

### New State Variables in CommandCenter.jsx

```js
const [predictionSummary, setPredictionSummary] = useState(null);
const [neo4jHealth, setNeo4jHealth] = useState(null);
const [schedulerStatus, setSchedulerStatus] = useState(null);
const [agentSwarmData, setAgentSwarmData] = useState(null);
```

### New API Calls in useEffect

```js
api.predictions.getDenialProbabilityBatch([...topClaimIds]),
api.predictions.getCollectionPropensityBatch(),
api.neo4j.getHealth(),
api.scheduler.getStatus(),
api.simulation.getRCMAgents(),
```

---

## 4. Denial Analytics

**Files:**
- `src/features/denials/pages/DenialAnalytics.jsx`
- `src/features/analytics/pages/RootCauseIntelligence.jsx`

### What EXISTS Currently

**DenialAnalytics.jsx:**
- Denial summary KPI cards from `api.denials.getSummary()`
- Root cause summary from `api.rootCause.getSummary()`
- Heatmap (Payer x Department) from `api.denials.getHeatmap()`
- Appeal win rates from `api.analytics.getAppealWinRates()`
- AI insights from `api.ai.getInsights('denials')`
- Trend data from `api.rootCause.getTrending()`
- Diagnostic findings from `api.diagnostics.getFindings()`
- Donut chart for root cause distribution
- Category-to-root-cause navigation mapping
- Group color helpers (PROCESS, PREVENTABLE, PAYER)

**RootCauseIntelligence.jsx:**
- Root cause summary and trending data
- Drill-down to individual claims via root cause
- Uses `api.rootCause.getSummary()`, `api.rootCause.getTrending()`

### What NEEDS TO CHANGE

#### 4A. Neo4j Graph Visualization Panel (NEW section in RootCauseIntelligence.jsx)

**Location:** New tab or collapsible section below the root cause trending chart.

- Interactive graph showing Payer -> DenialCategory -> RootCause -> Provider relationships
- Component: `<GraphMiniMap />` (from shared components) for preview; full view links to Graph Explorer
- API: `api.neo4j.getRootCauseGraph(selectedPayerId)`
- Features:
  - Nodes colored by type (Payer=blue, Category=amber, RootCause=red, Provider=green)
  - Edge thickness proportional to denial count
  - Click on node shows detail popover
  - Filter controls: payer dropdown, date range
- New subcomponent: `RootCauseGraphPanel.jsx` in `features/analytics/components/`

#### 4B. MiroFish Agent Confidence Overlay (NEW in RootCauseIntelligence.jsx)

**Location:** On each root cause row in the root cause table.

- Add `<MiroFishValidationBadge />` to each root cause row
- API: Already available via `api.simulation.validateSuggestion(rootCause, 'root_cause')`
- Show confidence score (0-100) next to each root cause
- Tooltip shows: agent name, validation reasoning, timestamp
- Batch-validate on page load for visible root causes

#### 4C. Prediction Badges per Payer (NEW in DenialAnalytics.jsx)

**Location:** In the heatmap grid and in payer breakdown sections.

- Add `<PredictionBadge />` next to each payer name showing predicted denial probability
- API: `api.predictions.getPayerAnomalies(payerId)` for each payer in the heatmap
- Batch call: `api.predictions.getPayerAnomaliesBatch()` on page load
- Badge shows the probability of increased denials in next 30 days

#### 4D. Payer Behavior Anomaly Indicators (NEW in DenialAnalytics.jsx)

**Location:** Next to each payer name in heatmap and breakdown tables.

- Add `<PayerAnomalyIndicator />` component
- Shows pulsing dot when anomaly detected
- API: `api.predictions.getPayerAnomaliesBatch()`
- Click opens a modal/drawer with anomaly details:
  - Which metrics are anomalous
  - Historical baseline vs current
  - Severity assessment
  - Recommended actions

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/denials/pages/DenialAnalytics.jsx` | Add PredictionBadge per payer, PayerAnomalyIndicator in heatmap rows |
| `features/analytics/pages/RootCauseIntelligence.jsx` | Add Neo4j graph panel, MiroFish confidence overlay on root causes |

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/analytics/components/RootCauseGraphPanel.jsx` | Neo4j graph visualization for root cause relationships |
| `features/analytics/components/PayerAnomalyDrawer.jsx` | Slide-over drawer showing payer anomaly details |

---

## 5. Denial Work Center

**Files:**
- `src/features/denials/pages/DenialManagement.jsx`
- `src/features/denials/pages/AppealGenerator.jsx`
- `src/features/denials/pages/HighRiskClaims.jsx`

### What EXISTS Currently

**DenialManagement.jsx:**
- Denial list table with filters (category, CARC code, payer, search)
- Uses `api.denials.list(params)`, `api.denials.getSummary()`
- Heatmap data, root cause fallback data
- Filter chips for categories
- AI insights from `api.ai.getInsights('denials')`
- Navigation to claim detail and root cause pages
- ConfidenceBar and AIInsightCard components

**AppealGenerator.jsx:**
- Appeal list from `api.appeals.list()`
- Create appeal via `api.appeals.create()`
- Update outcome via `api.appeals.updateOutcome()`
- Get letter via `api.appeals.getLetter()`
- AI draft via `api.ai.draftAppeal()`
- Existing appeal lifecycle (but no pipeline tracker UI)

**HighRiskClaims.jsx:**
- High-risk claims queue from `api.crs.getHighRisk()`
- CRS scores displayed per claim

### What NEEDS TO CHANGE

#### 5A. Per-Denial ML Denial Probability Badge (NEW in DenialManagement.jsx)

**Location:** New column in the denial list table, after status column.

- Add `<PredictionBadge />` to each denial row
- Shows the probability that this specific denial will remain unresolved
- API: `api.predictions.getDenialProbabilityBatch(visibleDenialClaimIds)` -- batch call on page load and on pagination
- Column header: "ML Risk" with sortable support
- Badge color: GREEN (low risk, easy win), AMBER, RED (hard to overturn)

#### 5B. Appeal Success Probability (NEW in AppealGenerator.jsx)

**Location:** In the appeal creation form and in the appeals list table.

**In appeal list table:**
- New column "Win Prob" showing `<PredictionBadge />` with appeal success probability
- API: `api.predictions.getAppealSuccess(denialId)` per visible appeal
- Batch call on page load

**In appeal creation drawer/modal:**
- Before user creates appeal, show predicted win probability prominently
- Display recommended strategy text from the API response
- Show count of similar appeals that were won
- Green "Recommended" badge if win probability > 70%

#### 5C. "Auto-Appeal" Button (NEW in DenialManagement.jsx and AppealGenerator.jsx)

**Location:** Action column in denial table; also as a batch action.

- New button: "Auto-Appeal" with icon `auto_fix_high`
- Triggers automation rule AUTO-002 (auto-appeal for coding denials)
- API: `api.automation.triggerJob('AUTO-002')` or a new `api.appeals.autoAppeal(denialId)`
- Add to api.js: `appeals.autoAppeal(denialId)` -> `POST /api/v1/denials/appeals/auto/{denialId}`
- Button disabled if denial category is not eligible for auto-appeal
- Confirmation modal: "This will generate and submit an appeal using AI. Continue?"
- After trigger: show loading spinner, then navigate to appeal detail or show success toast

#### 5D. Appeal Pipeline Tracker (NEW in AppealGenerator.jsx)

**Location:** Replace or augment the existing appeal status display.

- Use `<AppealPipelineTracker />` shared component
- Stages: GENERATED -> SUBMITTED -> IN_REVIEW -> WON / LOST / EXPIRED
- Each stage shows timestamp when it was reached
- Color coding: active = primary, completed = green, failed = red
- Clickable stages show detail (e.g., who submitted, when reviewed)
- Add to each appeal row as an expandable section

#### 5E. MiroFish Validation Status (NEW in DenialManagement.jsx)

**Location:** Inline on each denial row, next to existing columns.

- `<MiroFishValidationBadge />` per denial suggestion
- API: `api.simulation.validateSuggestion(suggestion, 'denial')` -- batch on load
- Shows: validated/pending/rejected status, confidence score
- Tooltip with reasoning text

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/denials/pages/DenialManagement.jsx` | Add ML probability column, Auto-Appeal button, MiroFish badge |
| `features/denials/pages/AppealGenerator.jsx` | Add win probability badges, appeal pipeline tracker, auto-appeal integration |
| `features/denials/pages/HighRiskClaims.jsx` | Add ML risk badge column, MiroFish validation |

### New API Methods

```
appeals.autoAppeal(denialId)  ->  POST /api/v1/denials/appeals/auto/{denialId}
```

---

## 6. Payment Intelligence

**Files:**
- `src/features/payments/pages/PaymentDashboard.jsx`
- `src/features/payments/pages/ERABankRecon.jsx`
- `src/features/payments/pages/PayerPaymentIntelligence.jsx`

### What EXISTS Currently

**PaymentDashboard.jsx:**
- Payment summary from `api.payments.getSummary()`
- ERA list from `api.payments.getERAList()`
- ADTP data from `api.payments.getADTP()` and `api.payments.getADTPAnomalies()`
- Triangulation summary from `api.payments.getTriangulationSummary()`
- Payer stats from `api.payments.getPayerStats()`
- Silent underpayments from `api.payments.getSilentUnderpayments()`
- Float analysis from `api.payments.getFloatAnalysis()`

**ERABankRecon.jsx:**
- ERA-Bank match data from `api.payments.getERABankMatch()`
- Reconciliation status display

### What NEEDS TO CHANGE

#### 6A. Payment Delay Prediction per Payer (NEW in PaymentDashboard.jsx)

**Location:** New widget row above the payment summary or integrated into payer stats table.

- For each payer in the payer stats table, add a "Predicted Delay" column
- API: `api.predictions.getPaymentDelayByPayer(payerId)` batched for visible payers
- Display: predicted days to payment, color-coded (GREEN <= 30d, AMBER 30-60d, RED > 60d)
- Trend arrow showing if delay is increasing or decreasing
- New KPI card: "Avg Predicted Payment Delay" at top-level

#### 6B. Underpayment Detection with Auto-Dispute Button (NEW in PaymentDashboard.jsx)

**Location:** In the silent underpayments section (already exists) -- enhance it.

- Existing `api.payments.getSilentUnderpayments()` already returns data
- ADD: "Auto-Dispute" button per underpayment row
- API (new): `api.payments.autoDispute(paymentId)` -> `POST /api/v1/payments/auto-dispute/{paymentId}`
- Button triggers AUTO-003 rule (auto-dispute underpayments)
- Confirmation modal: "This will generate and file a payment dispute for ${amount} variance. Continue?"
- After trigger: show status badge (DISPUTED), timestamp
- Batch action: "Dispute All Selected" checkbox + batch button

#### 6C. Payer Behavior Anomaly Alerts (NEW in PaymentDashboard.jsx)

**Location:** New alert banner at top of page when anomalies detected, plus indicators in payer table.

- API: `api.predictions.getPayerAnomaliesBatch()`
- Alert banner: "2 payers showing unusual payment behavior" with expand/collapse
- In payer stats table: `<PayerAnomalyIndicator />` per payer row
- Click opens `<PayerAnomalyDrawer />` with details
- Anomaly types: sudden delay increase, payment amount decrease, new denial patterns

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/payments/pages/PaymentDashboard.jsx` | Add predicted delay column, auto-dispute buttons, anomaly alert banner |
| `features/payments/pages/ERABankRecon.jsx` | Add anomaly indicators per ERA record |
| `features/payments/pages/PayerPaymentIntelligence.jsx` | Add prediction overlay, anomaly timeline |

### New API Methods

```
payments.autoDispute(paymentId)  ->  POST /api/v1/payments/auto-dispute/{paymentId}
```

---

## 7. Claims Pipeline

**Files:**
- `src/features/claims/pages/ClaimsOverview.jsx`
- `src/features/claims/pages/ScrubDashboard.jsx`
- `src/features/claims/pages/ClaimsWorkQueue.jsx`

### What EXISTS Currently

**ClaimsOverview.jsx:**
- Claims list from `api.claims.list()` (calls real backend with mock fallback)
- Claims data includes: id, patient, payer, amount, status, risk_score, date
- Basic table display with status filters

**ScrubDashboard.jsx:**
- CRS (Claim Readiness Score) summary from `api.crs.getSummary()`
- Error categories from `api.crs.getErrorCategories()`
- Scrub queue from `api.crs.getQueue()`
- Pass rate, error breakdown

**ClaimsWorkQueue.jsx:**
- Claims work queue from `api.claims.getQueue()`
- Filters by status (Denied, high-risk Submitted)

### What NEEDS TO CHANGE

#### 7A. Per-Claim Denial Risk Badge (NEW in ClaimsOverview.jsx and ClaimsWorkQueue.jsx)

**Location:** New column in claims table, right after status column.

- `<RiskTierBadge />` showing GREEN / AMBER / RED denial risk
- API: `api.predictions.getDenialProbabilityBatch(visibleClaimIds)` on page load + pagination
- Column header: "Denial Risk" -- sortable
- GREEN: probability < 0.3 (safe to submit)
- AMBER: probability 0.3-0.7 (review recommended)
- RED: probability > 0.7 (high denial risk -- hold or fix)
- Click on badge shows popover with top risk factors from the prediction model

#### 7B. "Hold Claim" Button (NEW in ClaimsOverview.jsx and ClaimsWorkQueue.jsx)

**Location:** Action column in claims table, row-level action.

- Button appears only for claims with AMBER or RED risk tier
- API (new): `api.claims.holdClaim(claimId, reason)` -> `POST /api/v1/claims/{claimId}/hold`
- Button icon: `pause_circle` with text "Hold"
- On click: opens a small form for hold reason (dropdown: "High Denial Risk", "Missing Auth", "Coding Review Needed", "Other" + free text)
- After hold: status changes to "HELD" with yellow badge
- "Release" button appears to un-hold: `api.claims.releaseClaim(claimId)` -> `POST /api/v1/claims/{claimId}/release`

#### 7C. CRS Score with ML-Enhanced Predictions (MODIFY in ScrubDashboard.jsx)

**Location:** Existing CRS score column in the scrub queue table.

- Currently shows CRS score from rule-based engine
- ADD: ML prediction score alongside the CRS score
- Display as two-part badge: "CRS: 85 | ML: 0.72"
- API: `api.predictions.getDenialProbabilityBatch(claimIds)` for visible claims
- When ML score contradicts CRS (e.g., CRS says pass but ML says high risk), show a warning icon with tooltip: "ML model disagrees with rule-based score"
- New subcomponent: `CRSMLComboScore.jsx` in `features/claims/components/`

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/claims/pages/ClaimsOverview.jsx` | Add denial risk badge column, hold claim button |
| `features/claims/pages/ClaimsWorkQueue.jsx` | Add denial risk badge column, hold claim button |
| `features/claims/pages/ScrubDashboard.jsx` | Add ML prediction alongside CRS score |

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/claims/components/CRSMLComboScore.jsx` | Combined CRS + ML prediction score display |
| `features/claims/components/HoldClaimModal.jsx` | Modal for entering hold reason |

### New API Methods

```
claims.holdClaim(claimId, reason)    ->  POST /api/v1/claims/{claimId}/hold
claims.releaseClaim(claimId)         ->  POST /api/v1/claims/{claimId}/release
```

---

## 8. Collections Work Center

**File:** `src/features/collections/pages/CollectionsQueue.jsx`

### What EXISTS Currently

- Queue tasks with propensity scores (currently HARDCODED in-component as `queueTasks` array)
- Live queue from `api.collections.getQueue()` with fallback to hardcoded data
- Propensity score display (heuristic-based, not ML)
- Root cause badge mapping from `ROOT_CAUSE_MAP`
- Call script generation via `api.ai.getCallScript()`
- Filter chip groups, date range picker
- ConfidenceBar and AIInsightCard components
- Navigation to account details

### What NEEDS TO CHANGE

#### 8A. ML Propensity Score (REPLACE heuristic in CollectionsQueue.jsx)

**Location:** Replace existing propensity score display in queue table.

- Replace hardcoded `propensity` field with ML model score
- API: `api.predictions.getCollectionPropensityBatch({ page, size, priority, payer_id })` on page load
- Response includes: `propensity_score` (0-100 from ML), `expected_recovery`, `model_version`
- Update `PROPENSITY_BUCKET` function to use ML scores
- Add tooltip showing model confidence and top features driving the score
- Remove `queueTasks` hardcoded array entirely

#### 8B. Prioritization by Expected Recovery Value (NEW sort option)

**Location:** Sort controls in the queue table header.

- New sort option: "Expected Recovery (High to Low)"
- Uses `expected_recovery` field from ML propensity API
- Default sort changes from propensity score alone to a weighted score: `priority_score = propensity_score * expected_recovery`
- Display `expected_recovery` as a new column: "Est. Recovery"
- Color coding: > $5K = bold, $1K-$5K = normal, < $1K = muted

#### 8C. Auto-Outreach Actions (NEW in CollectionsQueue.jsx)

**Location:** Action column in queue table, and as batch action.

- New "Auto-Outreach" dropdown button per row with options:
  - "Schedule Call" (placeholder, creates a task)
  - "Send Letter" (triggers template generation)
  - "Queue SMS" (placeholder for future IVR/SMS integration)
- API (new): `api.collections.scheduleOutreach(taskId, type)` -> `POST /api/v1/collections/{taskId}/outreach`
- Body: `{ type: 'call'|'letter'|'sms', template_id, scheduled_for }`
- After trigger: row shows "Outreach Scheduled" badge with type and date
- Batch action: Select multiple rows -> "Schedule Batch Outreach" -> choose type

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/collections/pages/CollectionsQueue.jsx` | Replace heuristic with ML propensity, add expected recovery column, add auto-outreach buttons, remove hardcoded data |
| `features/collections/pages/PropensityScoreDetails.jsx` | Wire to ML model detail API |
| `features/collections/pages/AccountDetailsPage.jsx` | Add ML propensity section, outreach history |

### New API Methods

```
collections.scheduleOutreach(taskId, data)  ->  POST /api/v1/collections/{taskId}/outreach
```

---

## 9. Prevention Dashboard

**File:** `src/features/analytics/pages/PreventionDashboard.jsx`

### What EXISTS Currently

- Prevention summary from `api.prevention.getSummary()`
- Prevention alerts from `api.prevention.getAlerts(filters)`
- Dismiss alert via `api.prevention.dismiss(alertId)`
- Prevention scan from `api.prevention.scan()`
- Severity badges (CRITICAL, WARNING, INFO)
- Type configuration (ELIGIBILITY_RISK, AUTH_EXPIRY, TIMELY_FILING_RISK, DUPLICATE_CLAIM, HIGH_RISK_PAYER_CPT)
- KPI cards for prevention metrics
- Alert list with severity and type badges

### What NEEDS TO CHANGE

#### 9A. Persistent Alerts from DB (MODIFY existing alert system)

**Location:** Alert list section -- behavior change, not visual change.

- Currently alerts are fetched per-session and dismissed in-memory
- CHANGE: Dismissals now persist to database via existing `api.prevention.dismiss(alertId)` (backend already supports this)
- ADD: `api.prevention.getAlertHistory(filters)` -> `GET /api/v1/prevention/alert-history` to show dismissed alerts
- New tab: "Active" | "Dismissed" | "All" above alert list
- Dismissed alerts show who dismissed, when, and the reason
- Add audit trail display per alert

#### 9B. "Hold Claim" Button on Prevention Alerts (NEW)

**Location:** Action column per alert row.

- When alert type is ELIGIBILITY_RISK, AUTH_EXPIRY, or HIGH_RISK_PAYER_CPT, show "Hold Claim" button
- Uses same `api.claims.holdClaim(claimId, reason)` API as Claims Pipeline
- Auto-fills reason from the prevention alert type
- After hold: alert status changes to "ACTIONED - HELD"

#### 9C. "Dismiss" with Audit Trail (ENHANCE existing dismiss)

**Location:** Existing dismiss button per alert row.

- Currently just calls `api.prevention.dismiss(alertId)`
- ENHANCE: Open a small modal requiring:
  - Dismiss reason (dropdown: "False Positive", "Already Resolved", "Accepted Risk", "Other")
  - Optional notes text field
- API change: `api.prevention.dismiss(alertId, { reason, notes, userId })` -- add body to existing POST
- After dismiss: show the dismissal in an inline audit trail below the alert

#### 9D. Prevention Effectiveness Metrics (NEW section)

**Location:** New section below the KPI cards, above the alert list.

- Shows how effective prevention has been over time
- API (new): `api.prevention.getEffectiveness()` -> `GET /api/v1/prevention/effectiveness`
- Returns: `{ total_prevented, revenue_saved, alerts_actioned, avg_response_time_hours, by_type[], trend_weekly[] }`
- Display:
  - Bar chart: alerts by type over last 12 weeks (stacked by severity)
  - KPI: "Revenue Saved by Prevention" with trend
  - KPI: "Avg Response Time" showing how fast alerts are actioned
  - Pie chart: alert outcomes (Held, Dismissed as False Positive, Dismissed as Resolved, Expired)

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/analytics/pages/PreventionDashboard.jsx` | Add persistent alerts, hold claim button, enhanced dismiss, effectiveness metrics section |

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/analytics/components/PreventionEffectivenessChart.jsx` | Stacked bar chart for prevention effectiveness over time |
| `features/analytics/components/DismissAlertModal.jsx` | Modal for dismiss reason + notes |

### New API Methods

```
prevention.getAlertHistory(filters)   ->  GET /api/v1/prevention/alert-history
prevention.getEffectiveness()          ->  GET /api/v1/prevention/effectiveness
```

---

## 10. Revenue Forecast

**File:** `src/features/intelligence/pages/RevenueForecast.jsx`

### What EXISTS Currently

- Forecast summary from `api.forecast.getSummary()`
- Weekly forecast from `api.forecast.getWeekly()`
- 3-layer forecast from `api.forecast.get3Layer()`
- Prophet weekly/daily forecasts from `api.forecast.prophetWeekly()` and `api.forecast.prophetDaily()`
- Prophet accuracy from `api.forecast.prophetAccuracy()`
- Reconciliation summary from `api.forecast.getReconciliationSummary()`
- Payer list from `api.payers.list()` for payer filter

### What NEEDS TO CHANGE

#### 10A. Per-Payer Forecast Breakdown (NEW section)

**Location:** New tab or expandable section below the main forecast chart.

- Table showing forecast per payer
- Columns: Payer Name, 30-Day Forecast, 60-Day Forecast, 90-Day Forecast, Trend, Risk Factors
- API: `api.predictions.getRevenueByPayer(payerId)` for each payer (or batch endpoint)
- Add batch endpoint: `api.predictions.getRevenueByPayerBatch()` -> `GET /api/v1/predictions/revenue-by-payer`
- Sortable by forecast amount or risk level
- Click on payer row drills into payer-specific forecast detail

#### 10B. Payer Anomaly Overlay on Forecast Chart (NEW)

**Location:** Overlay on the existing forecast Recharts line chart.

- Show anomaly markers on the forecast chart at dates where payer anomalies were detected
- API: `api.predictions.getPayerAnomaliesBatch()`
- Render as Recharts `<ReferenceDot />` elements on the timeline
- Each dot shows a tooltip with: payer name, anomaly type, severity
- Color: red dots for critical, amber for warning
- Toggle control: "Show Anomalies" checkbox above chart

#### 10C. Cash Flow Prediction by Payer (NEW section)

**Location:** New tab "Cash Flow by Payer" next to existing forecast tabs.

- Per-payer cash flow prediction chart
- Payer selector dropdown
- API: `api.predictions.getCashFlowForecast(payerId, weeks)`
- Recharts area chart showing predicted cash flow with confidence bands
- Confidence bands: upper and lower bounds as shaded area
- Weekly granularity, configurable 4-13 weeks ahead

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/intelligence/pages/RevenueForecast.jsx` | Add per-payer breakdown table, anomaly overlay on chart, cash flow by payer tab |

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/intelligence/components/PayerForecastTable.jsx` | Per-payer forecast breakdown table |
| `features/intelligence/components/CashFlowByPayerChart.jsx` | Cash flow prediction area chart with confidence bands |

### New API Methods

```
predictions.getRevenueByPayerBatch()  ->  GET /api/v1/predictions/revenue-by-payer
```

---

## 11. Simulation Engine

**File:** `src/features/intelligence/pages/SimulationDashboard.jsx`

### What EXISTS Currently

- Already updated with Agent Swarm UI
- Scenario metadata with color coding
- Live polling (30s interval)
- Uses `api.simulation.*` endpoints extensively:
  - `getLatestResults()`, `getSchedulerStatus()`, `runRCMSimulation()`
  - `validateSuggestion()`, `getRCMAgents()`, `interviewAgent()`
  - `runScenarioNow()`, `getGraphStats()`
- Risk color helpers, status color helpers
- Dollar and number formatters

### What NEEDS TO CHANGE

#### 11A. Neo4j Graph Stats from Live Data (ENHANCE existing)

**Location:** Existing graph stats section (if stub, replace with live).

- Currently uses `api.simulation.getGraphStats()` which hits `http://localhost:5001/api/graph/rcm-stats`
- VERIFY this endpoint returns live Neo4j data; if not, add fallback to `api.neo4j.getHealth()`
- Display:
  - Node count by type (Payer, Provider, Claim, RootCause, Category)
  - Relationship count by type
  - Graph density metric
  - Last sync timestamp
  - "Explore Graph" button linking to `/intelligence/graph-explorer`

#### 11B. Execution Timeline from Automation Scheduler (NEW section)

**Location:** New section or tab: "Execution Timeline"

- Shows chronological timeline of all automation executions from the scheduler
- API: `api.scheduler.getJobs()` + `api.scheduler.getJobHistory('all', 50)`
- Recharts timeline chart (horizontal bar chart or scatter plot):
  - X-axis: time
  - Y-axis: job name
  - Bar color: green (success), red (fail), amber (partial)
- Below chart: detailed log table with columns: Time, Job, Claims Affected, Outcome, Duration
- Auto-refresh every 30s (align with existing POLL_INTERVAL)

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/intelligence/pages/SimulationDashboard.jsx` | Enhance Neo4j graph stats, add execution timeline section |

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/intelligence/components/ExecutionTimeline.jsx` | Recharts timeline showing scheduler execution history |

---

## 12. Automation Dashboard (MAJOR REWRITE)

**File:** `src/features/workcenters/pages/AutomationDashboard.jsx`

### What EXISTS Currently

- Rules list from `api.automation.getRules()`
- Pending actions from `api.automation.getPending()`
- Audit log from `api.automation.getAudit(50)`
- Toggle rule via `api.automation.toggleRule()`
- Approve/reject actions via `api.automation.approveAction()` / `rejectAction()`
- Evaluate all rules via `api.automation.evaluate()`
- KpiCard component for summary stats
- Status and outcome config objects
- AI insights integration
- Live/offline indicator

### What NEEDS TO CHANGE -- MAJOR REWRITE

#### 12A. Real-Time Execution Log (NEW, replace audit section)

**Location:** Primary tab "Execution Log"

- Replace current simple audit list with a rich, real-time execution log
- API: `api.automation.getAudit(100)` + WebSocket or polling for live updates
- Add to api.js: `api.automation.getExecutionLog(filters)` -> `GET /api/v1/automation/execution-log?from=...&to=...&rule_id=...&outcome=...`
- Table columns:
  - Timestamp (relative "2m ago" + absolute on hover)
  - Rule Name (with icon)
  - Claims Affected (count)
  - Outcome (SUCCESS / FAILED / PARTIAL with colored badge)
  - Duration (ms)
  - Revenue Impact ($)
  - Details (expandable row)
- Filters: date range, rule name dropdown, outcome filter
- Auto-scroll to newest entries when live
- "Pause Live Feed" toggle button

#### 12B. Execution Timeline Chart (NEW)

**Location:** Above the execution log table

- Recharts horizontal stacked bar chart or area chart
- X-axis: time (hourly buckets for last 24h, or daily for last 7d)
- Y-axis: execution count
- Stacked by outcome: green (success), red (failed), amber (partial)
- Toggle: "24 Hours" | "7 Days" | "30 Days"
- Hover shows tooltip with counts and revenue impact

#### 12C. Success/Failure Breakdown per Rule (NEW tab)

**Location:** New tab "Rule Performance"

- Table showing each automation rule with performance metrics
- Columns: Rule ID, Rule Name, Status (Active/Paused), Total Executions, Success Rate (%), Avg Duration, Revenue Impact, Last Run, Actions
- `<ConfidenceBar />` for success rate visualization
- Sparkline showing success rate trend over last 30 days
- Action buttons: Toggle, Edit, View History
- API: `api.automation.getRules()` enriched with `api.scheduler.getJobs()` for execution stats

#### 12D. Outcome Tracking Panel (NEW tab)

**Location:** New tab "Outcomes"

- Shows financial outcomes of automation actions
- API: `api.outcomes.getAutomationROI()`
- KPI cards at top:
  - Total Revenue Recovered
  - Total Revenue Protected
  - Cost Savings (FTE hours saved)
  - Time Saved (hours)
- Breakdown table by rule:
  - Rule Name, Actions Taken, Revenue Recovered, Revenue Protected, Cost per Action
- Recharts bar chart: ROI by rule
- Trend line: cumulative ROI over time

#### 12E. Scheduler Status Panel (NEW section)

**Location:** Right sidebar or top banner on all tabs

- Shows scheduler health at a glance
- API: `api.scheduler.getStatus()` + `api.scheduler.getJobs()`
- Display:
  - Scheduler running/paused indicator (large green/amber dot)
  - Total active jobs count
  - Failed in last 24h (red if > 0)
  - Next scheduled run (countdown timer)
  - Uptime duration
- Job list below: each job as `<SchedulerJobRow />`
- Actions per job: Trigger Now, Pause, Resume, View History

#### 12F. Model Performance Metrics (NEW tab)

**Location:** New tab "ML Models"

- Shows which ML models power the automation rules
- API: `api.outcomes.getModelAccuracy()`
- Table: Model Name, Accuracy, Precision, Recall, F1, Last Trained, Drift Status
- Sparkline for accuracy trend
- "Retrain" button per model (triggers `api.models.retrain(modelId)`)
- Link to full ML Model Monitor page: `/settings/ml-models`

### Page Layout After Rewrite

```
┌─────────────────────────────────────────────────────┐
│ Scheduler Status Banner (running, jobs, next run)   │
├────────┬────────┬──────────┬──────────┬─────────────┤
│ Exec   │ Rule   │ Outcomes │ ML       │ Pending     │
│ Log    │ Perf   │          │ Models   │ Actions     │
├────────┴────────┴──────────┴──────────┴─────────────┤
│ [Active Tab Content]                                │
│                                                     │
│ Execution Timeline Chart (if Exec Log tab)          │
│ ─── ─── ─── ─── ─── ─── ─── ─── ─── ───           │
│                                                     │
│ Execution Log Table / Rule Table / Outcome Cards    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/workcenters/pages/AutomationDashboard.jsx` | Major rewrite -- new tab structure, all new sections |

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/workcenters/components/ExecutionLogTable.jsx` | Real-time execution log with filters |
| `features/workcenters/components/ExecutionTimelineChart.jsx` | Recharts stacked bar chart for executions |
| `features/workcenters/components/RulePerformanceTable.jsx` | Per-rule performance breakdown table |
| `features/workcenters/components/OutcomeTrackingPanel.jsx` | ROI and outcome metrics display |
| `features/workcenters/components/SchedulerStatusBanner.jsx` | Scheduler health banner |
| `features/workcenters/components/ModelPerformanceTable.jsx` | ML model metrics table |

### New API Methods

```
automation.getExecutionLog(filters)  ->  GET /api/v1/automation/execution-log
```

---

## 13. LIDA AI Chat

**File:** `src/features/lida/pages/LidaChat.jsx`

### What EXISTS Currently

- Chat interface with AI streaming via `api.ai.streamChat()`
- LIDA ask via `api.lida.ask()`
- ConfidenceBar component for responses
- FormattedText with bold support
- MsgActions for action buttons
- RootCauseBars for root cause impact visualization
- Navigation integration via useNavigate
- Search params for pre-filled queries

### What NEEDS TO CHANGE

#### 13A. MiroFish Validation Badges (EXISTS -- verify live data)

- Already uses `<ConfidenceBar />` for AI response confidence
- VERIFY: are MiroFish validation badges actually wired to `api.simulation.validateSuggestion()`?
- If not, add: after each AI response that contains a recommendation, call `api.simulation.validateSuggestion(recommendation, 'chat')` and display `<MiroFishValidationBadge />` inline

#### 13B. Neo4j Graph-Aware Responses (NEW)

**Location:** In the chat response rendering, when response type indicates graph data.

- When LIDA response includes entity relationships, show an inline graph preview
- API: LIDA backend should already query Neo4j; frontend just needs to render
- ADD: detection of graph data in response payload (look for `nodes` and `edges` fields)
- If present, render `<GraphMiniMap />` inline in the chat message
- Clickable nodes navigate to the relevant page (e.g., clicking a Payer node goes to payer profile)
- "Explore in Graph" button linking to `/intelligence/graph-explorer` with pre-applied filters

#### 13C. Prediction Scores in Data Answers (NEW)

**Location:** In the chat response rendering, when response contains claim/payer data.

- When LIDA response references specific claims or payers, show ML prediction inline
- Detection: response payload includes `claim_ids` or `payer_ids` arrays
- For claims: fetch `api.predictions.getDenialProbabilityBatch(claimIds)` and show `<PredictionBadge />` next to each claim reference
- For payers: fetch `api.predictions.getPayerAnomaliesBatch()` and show `<PayerAnomalyIndicator />` next to each payer reference
- Rendering: enhanced message block with a small data card showing entity + prediction

### Files to MODIFY

| File | Changes |
|------|---------|
| `features/lida/pages/LidaChat.jsx` | Add graph rendering, prediction badges in responses, verify MiroFish badges |

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/lida/components/ChatGraphPreview.jsx` | Inline graph preview for chat responses |
| `features/lida/components/ChatPredictionCard.jsx` | Inline prediction score card for entity references |

---

## 14. NEW PAGE -- Graph Explorer

**Route:** `/intelligence/graph-explorer`

### Page Description

Full-screen interactive Neo4j graph visualization for exploring entity relationships across the entire RCM data model.

### Components to CREATE

#### 14A. `src/features/intelligence/pages/GraphExplorer.jsx` (MAIN PAGE)

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Graph Explorer"   [Search] [Filters]  │
├──────────┬──────────────────────────────────────────┤
│ Left     │                                          │
│ Sidebar  │   Interactive Force-Directed Graph       │
│          │   (react-force-graph-2d)                 │
│ Filters: │                                          │
│ □ Payers │                                          │
│ □ Provid │                                          │
│ □ Root   │                                          │
│   Causes │                                          │
│ □ Claims │                                          │
│          │                                          │
│ Legend:  │                                          │
│ ● Payer  │                                          │
│ ● Provider│                                         │
│ ● RootCause│                                        │
│ ● Claim  │                                          │
├──────────┴──────────────────────────────────────────┤
│ Detail Panel (shows on node click):                 │
│ Node properties, connected edges, quick actions     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- **Graph rendering:** `react-force-graph-2d` (or `react-force-graph-3d` for wow factor)
- **Node types:** Payer (blue circle), Provider (green diamond), RootCause (red triangle), DenialCategory (amber square), Claim (gray dot)
- **Edge labels:** denial count, relationship type
- **Edge thickness:** proportional to denial count or dollar amount
- **Click-to-drill:** Click Payer node -> show connected RootCauses -> click RootCause -> show connected Providers
- **Search:** Search bar to find specific entities by name/ID
- **Filters:**
  - Node type checkboxes
  - Payer dropdown (filter to specific payer's subgraph)
  - Provider dropdown
  - Root cause filter
  - Date range
  - Min edge weight slider
- **Detail panel:** Appears on node/edge click showing all properties
- **Zoom controls:** Zoom in/out, fit to screen, center on selection
- **Export:** "Export as PNG" button

**API calls:**
- `api.neo4j.getGraphData(nodeType, filters)` -- main graph data
- `api.neo4j.getNodeNeighbors(nodeId, depth)` -- on node click drill
- `api.neo4j.search(query)` -- for search functionality
- `api.neo4j.explorePath(fromId, toId)` -- for path exploration

**State:**
```js
const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
const [selectedNode, setSelectedNode] = useState(null);
const [filters, setFilters] = useState({ nodeTypes: ['Payer','Provider','RootCause'], payerId: null, ... });
const [searchQuery, setSearchQuery] = useState('');
const [loading, setLoading] = useState(true);
```

**Dependencies to install:**
```
npm install react-force-graph-2d
```

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/intelligence/pages/GraphExplorer.jsx` | Main page component |
| `features/intelligence/components/GraphCanvas.jsx` | Wrapper around react-force-graph-2d with custom node rendering |
| `features/intelligence/components/GraphFilterSidebar.jsx` | Left sidebar with filter controls |
| `features/intelligence/components/GraphDetailPanel.jsx` | Detail panel for selected node/edge |
| `features/intelligence/components/GraphSearchBar.jsx` | Search bar with autocomplete |
| `features/intelligence/components/GraphLegend.jsx` | Node type legend with color coding |

---

## 15. NEW PAGE -- Outcome Tracker

**Route:** `/intelligence/outcomes`

### Page Description

Dashboard tracking the outcomes of all automated actions, appeal results, model predictions, and feedback loops.

### Components to CREATE

#### 15A. `src/features/intelligence/pages/OutcomeTracker.jsx` (MAIN PAGE)

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Outcome Tracker"   [Date Range]       │
├────────┬──────────┬───────────┬─────────────────────┤
│ Appeals│Automation│ ML Models │ Feedback Loops       │
├────────┴──────────┴───────────┴─────────────────────┤
│ KPI Cards Row:                                      │
│ [Total Won] [Win Rate] [Revenue Recovered] [Avg Time]│
├─────────────────────────────────────────────────────┤
│ Tab Content:                                        │
│                                                     │
│ APPEALS TAB:                                        │
│ - Line chart: appeal outcomes over time             │
│ - Stacked bar: won/lost/pending by month            │
│ - Table: by payer breakdown                         │
│ - Table: by denial category breakdown               │
│                                                     │
│ AUTOMATION TAB:                                     │
│ - ROI summary cards                                 │
│ - Revenue recovered/protected bar chart             │
│ - Per-rule ROI table                                │
│ - Cost savings breakdown                            │
│                                                     │
│ ML MODELS TAB:                                      │
│ - Accuracy trend line chart per model               │
│ - Prediction vs actual scatter plot                  │
│ - False positive/negative breakdown                 │
│                                                     │
│ FEEDBACK LOOPS TAB:                                 │
│ - Feedback loop status table                        │
│ - Corrections count and accuracy improvement        │
│ - Loop health indicators                            │
└─────────────────────────────────────────────────────┘
```

**API calls:**
- `api.outcomes.getAppealOutcomes(filters)` -- for Appeals tab
- `api.outcomes.getAutomationROI()` -- for Automation tab
- `api.outcomes.getModelAccuracy()` -- for ML Models tab
- `api.outcomes.getFeedbackLoopStatus()` -- for Feedback Loops tab
- `api.outcomes.getOutcomeSummary()` -- for KPI cards

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/intelligence/pages/OutcomeTracker.jsx` | Main page component with tabs |
| `features/intelligence/components/AppealOutcomesPanel.jsx` | Appeals outcomes charts and tables |
| `features/intelligence/components/AutomationROIPanel.jsx` | Automation ROI dashboard |
| `features/intelligence/components/ModelAccuracyPanel.jsx` | ML model accuracy trends |
| `features/intelligence/components/FeedbackLoopPanel.jsx` | Feedback loop status display |

---

## 16. NEW PAGE -- ML Model Monitor

**Route:** `/settings/ml-models`

### Page Description

Comprehensive ML model registry and monitoring dashboard showing all 6 production models with training history, accuracy metrics, feature importance, and drift detection.

### The 6 Models

1. **Denial Probability Model** -- predicts likelihood of claim denial
2. **Payment Delay Model** -- predicts days to payment
3. **Appeal Success Model** -- predicts appeal win probability
4. **Collection Propensity Model** -- predicts likelihood of payment recovery
5. **Payer Anomaly Model** -- detects unusual payer behavior
6. **Revenue Forecast Model** -- predicts revenue by payer/period

### Components to CREATE

#### 16A. `src/features/settings/pages/MLModelMonitor.jsx` (MAIN PAGE)

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Page Header: "ML Model Monitor"   [Refresh] [Help]  │
├─────────────────────────────────────────────────────┤
│ Summary Cards:                                      │
│ [Models Active] [Avg Accuracy] [Drift Alerts] [Last │
│                                          Trained]   │
├─────────────────────────────────────────────────────┤
│ Model Registry Table:                               │
│ ┌──────────┬────────┬─────┬─────┬───────┬─────────┐ │
│ │ Model    │Version │Acc  │F1   │Drift  │Actions  │ │
│ ├──────────┼────────┼─────┼─────┼───────┼─────────┤ │
│ │ Denial   │ v2.3   │94.2%│0.91 │ OK ●  │[Detail] │ │
│ │ Payment  │ v1.8   │89.5%│0.87 │WARN ● │[Detail] │ │
│ │ Appeal   │ v1.2   │91.0%│0.89 │ OK ●  │[Detail] │ │
│ │ Collect. │ v3.1   │88.3%│0.85 │ OK ●  │[Detail] │ │
│ │ Anomaly  │ v2.0   │92.7%│0.90 │ OK ●  │[Detail] │ │
│ │ Revenue  │ v1.5   │87.1%│0.84 │DRIFT● │[Retrain]│ │
│ └──────────┴────────┴─────┴─────┴───────┴─────────┘ │
├─────────────────────────────────────────────────────┤
│ Selected Model Detail (expandable or side panel):   │
│                                                     │
│ Training History Chart (line: accuracy over runs)   │
│ Feature Importance Bar Chart (horizontal bars)      │
│ Drift Detection Panel (PSI scores per feature)      │
│ Confusion Matrix (if classification model)          │
│ Retrain Button + Last Training Details              │
└─────────────────────────────────────────────────────┘
```

**API calls:**
- `api.models.getRegistry()` -- model list
- `api.models.getModelDetail(modelId)` -- selected model detail
- `api.models.getTrainingHistory(modelId)` -- training runs
- `api.models.getFeatureImportance(modelId)` -- feature importance
- `api.models.getDriftReport(modelId)` -- drift analysis
- `api.models.retrain(modelId)` -- trigger retraining

**Note:** The existing `features/developer/pages/AIModelMonitor.jsx` and sub-pages (`DriftLogs.jsx`, `ModelRegistry.jsx`, `FeatureImportance.jsx`, `PSIDistribution.jsx`) contain related functionality. Evaluate whether to:
- (A) Reuse and enhance existing developer pages as the new ML Model Monitor, OR
- (B) Create fresh under settings with improved UX, and redirect developer routes to it

**Recommendation:** Option B -- create a polished new page under `/settings/ml-models` and redirect the old developer routes there.

### Files to CREATE

| File | Purpose |
|------|---------|
| `features/settings/pages/MLModelMonitor.jsx` | Main page with model registry table |
| `features/settings/components/ModelDetailPanel.jsx` | Expandable detail panel for selected model |
| `features/settings/components/TrainingHistoryChart.jsx` | Recharts line chart for training runs |
| `features/settings/components/FeatureImportanceChart.jsx` | Horizontal bar chart for feature importance |
| `features/settings/components/DriftDetectionPanel.jsx` | PSI scores and drift alert display |
| `features/settings/components/ConfusionMatrix.jsx` | Matrix visualization for classification models |
| `features/settings/components/RetrainButton.jsx` | Button with confirmation and status polling |

---

## 17. Route Registration

**File:** `src/App.jsx`

### New Routes to Add

```jsx
// In the INTELLIGENCE section (after Simulation Engine):
import { GraphExplorer } from './features/intelligence/pages/GraphExplorer';
import { OutcomeTracker } from './features/intelligence/pages/OutcomeTracker';

<Route path="intelligence/graph-explorer" element={<GraphExplorer />} />
<Route path="intelligence/outcomes" element={<OutcomeTracker />} />

// In the SETTINGS section:
import { MLModelMonitor } from './features/settings/pages/MLModelMonitor';

<Route path="settings/ml-models" element={<MLModelMonitor />} />

// Legacy redirects for developer AI monitor pages:
<Route path="developer/ai-monitor" element={<Navigate to="/settings/ml-models" replace />} />
<Route path="developer/ai-monitor/*" element={<Navigate to="/settings/ml-models" replace />} />
```

### Navigation Menu Updates

**File:** Wherever the sidebar/navigation is defined (likely `src/components/layout/Sidebar.jsx` or `Layout.jsx`)

Add nav items:
- Under "Intelligence": "Graph Explorer" (icon: `hub`), "Outcomes" (icon: `monitoring`)
- Under "Settings": "ML Models" (icon: `model_training`)

---

## 18. Sprint Allocation

### Sprint 10 -- Foundation & API Layer

**Estimated duration: 1 week**

| Task | Priority | Files |
|------|----------|-------|
| Add `predictions` namespace to api.js | P0 | `services/api.js` |
| Add `neo4j` namespace to api.js | P0 | `services/api.js` |
| Add `scheduler` namespace to api.js | P0 | `services/api.js` |
| Add `outcomes` namespace to api.js | P0 | `services/api.js` |
| Add `models` namespace to api.js | P0 | `services/api.js` |
| Create `PredictionBadge.jsx` | P0 | `components/ui/` |
| Create `RiskTierBadge.jsx` | P0 | `components/ui/` |
| Create `MiroFishValidationBadge.jsx` | P1 | `components/ui/` |
| Create `PayerAnomalyIndicator.jsx` | P1 | `components/ui/` |
| Create `AppealPipelineTracker.jsx` | P1 | `components/ui/` |
| Create `AutomationStatusChip.jsx` | P1 | `components/ui/` |
| Update `components/ui/index.js` exports | P0 | `components/ui/index.js` |

### Sprint 11 -- Claims & Denials

**Estimated duration: 1 week**

| Task | Priority | Files |
|------|----------|-------|
| Claims: Add denial risk badge column | P0 | `ClaimsOverview.jsx`, `ClaimsWorkQueue.jsx` |
| Claims: Add "Hold Claim" button + modal | P0 | `ClaimsOverview.jsx`, `HoldClaimModal.jsx` |
| Claims: CRS + ML combo score | P1 | `ScrubDashboard.jsx`, `CRSMLComboScore.jsx` |
| Denials: Add ML probability column | P0 | `DenialManagement.jsx` |
| Denials: Add appeal success probability | P0 | `AppealGenerator.jsx` |
| Denials: Add auto-appeal button | P1 | `DenialManagement.jsx`, `AppealGenerator.jsx` |
| Denials: Add appeal pipeline tracker | P1 | `AppealGenerator.jsx` |
| Denials: Add MiroFish validation badges | P2 | `DenialManagement.jsx` |

### Sprint 12 -- Payments, Collections, Prevention

**Estimated duration: 1 week**

| Task | Priority | Files |
|------|----------|-------|
| Payments: Payment delay prediction column | P0 | `PaymentDashboard.jsx` |
| Payments: Auto-dispute button | P1 | `PaymentDashboard.jsx` |
| Payments: Payer anomaly alerts | P1 | `PaymentDashboard.jsx` |
| Collections: Replace heuristic with ML propensity | P0 | `CollectionsQueue.jsx` |
| Collections: Expected recovery column + sort | P1 | `CollectionsQueue.jsx` |
| Collections: Auto-outreach actions | P2 | `CollectionsQueue.jsx` |
| Prevention: Persistent alerts | P0 | `PreventionDashboard.jsx` |
| Prevention: Hold Claim on alerts | P1 | `PreventionDashboard.jsx` |
| Prevention: Enhanced dismiss with audit trail | P1 | `PreventionDashboard.jsx`, `DismissAlertModal.jsx` |
| Prevention: Effectiveness metrics | P2 | `PreventionDashboard.jsx`, `PreventionEffectivenessChart.jsx` |

### Sprint 13 -- Command Center, Forecast, LIDA

**Estimated duration: 1 week**

| Task | Priority | Files |
|------|----------|-------|
| Command Center: Prediction score widgets row | P0 | `CommandCenter.jsx` |
| Command Center: Neo4j health widget | P1 | `CommandCenter.jsx` |
| Command Center: Automation status widget | P1 | `CommandCenter.jsx` |
| Command Center: Wire Agent Swarm to live data | P1 | `CommandCenter.jsx` |
| Forecast: Per-payer breakdown table | P0 | `RevenueForecast.jsx`, `PayerForecastTable.jsx` |
| Forecast: Anomaly overlay on chart | P1 | `RevenueForecast.jsx` |
| Forecast: Cash flow by payer tab | P1 | `CashFlowByPayerChart.jsx` |
| LIDA: Graph-aware response rendering | P1 | `LidaChat.jsx`, `ChatGraphPreview.jsx` |
| LIDA: Prediction scores in data answers | P2 | `LidaChat.jsx`, `ChatPredictionCard.jsx` |

### Sprint 14 -- Automation Dashboard Rewrite & Simulation

**Estimated duration: 1 week**

| Task | Priority | Files |
|------|----------|-------|
| Automation: Tab-based layout scaffolding | P0 | `AutomationDashboard.jsx` |
| Automation: Real-time execution log | P0 | `ExecutionLogTable.jsx` |
| Automation: Execution timeline chart | P0 | `ExecutionTimelineChart.jsx` |
| Automation: Rule performance table | P1 | `RulePerformanceTable.jsx` |
| Automation: Outcome tracking panel | P1 | `OutcomeTrackingPanel.jsx` |
| Automation: Scheduler status banner | P0 | `SchedulerStatusBanner.jsx` |
| Automation: Model performance table | P2 | `ModelPerformanceTable.jsx` |
| Simulation: Enhance Neo4j graph stats | P1 | `SimulationDashboard.jsx` |
| Simulation: Execution timeline section | P1 | `ExecutionTimeline.jsx` |

### Sprint 15 -- New Pages & Polish

**Estimated duration: 1 week**

| Task | Priority | Files |
|------|----------|-------|
| Graph Explorer: Main page + canvas | P0 | `GraphExplorer.jsx`, `GraphCanvas.jsx` |
| Graph Explorer: Filter sidebar | P1 | `GraphFilterSidebar.jsx` |
| Graph Explorer: Detail panel | P1 | `GraphDetailPanel.jsx` |
| Graph Explorer: Search bar | P1 | `GraphSearchBar.jsx` |
| Outcome Tracker: Main page + tabs | P0 | `OutcomeTracker.jsx` |
| Outcome Tracker: Appeal outcomes panel | P1 | `AppealOutcomesPanel.jsx` |
| Outcome Tracker: Automation ROI panel | P1 | `AutomationROIPanel.jsx` |
| Outcome Tracker: ML accuracy panel | P2 | `ModelAccuracyPanel.jsx` |
| Outcome Tracker: Feedback loop panel | P2 | `FeedbackLoopPanel.jsx` |
| ML Model Monitor: Main page | P1 | `MLModelMonitor.jsx` |
| ML Model Monitor: Detail panel | P1 | `ModelDetailPanel.jsx` |
| ML Model Monitor: Charts (training, features, drift) | P2 | Multiple |
| Route registration in App.jsx | P0 | `App.jsx` |
| Navigation menu updates | P0 | `Layout.jsx` / Sidebar |
| Install react-force-graph-2d dependency | P0 | `package.json` |

---

## Summary of All New Files

### New Shared UI Components (10 files)

```
src/components/ui/PredictionBadge.jsx
src/components/ui/RiskTierBadge.jsx
src/components/ui/MiroFishValidationBadge.jsx
src/components/ui/PayerAnomalyIndicator.jsx
src/components/ui/GraphMiniMap.jsx
src/components/ui/AppealPipelineTracker.jsx
src/components/ui/AutomationStatusChip.jsx
src/components/ui/ModelPerformanceSparkline.jsx
src/components/ui/SchedulerJobRow.jsx
src/components/ui/OutcomeCard.jsx
```

### New Feature Components (33 files)

```
src/features/analytics/components/RootCauseGraphPanel.jsx
src/features/analytics/components/PayerAnomalyDrawer.jsx
src/features/analytics/components/PreventionEffectivenessChart.jsx
src/features/analytics/components/DismissAlertModal.jsx
src/features/claims/components/CRSMLComboScore.jsx
src/features/claims/components/HoldClaimModal.jsx
src/features/intelligence/pages/GraphExplorer.jsx
src/features/intelligence/pages/OutcomeTracker.jsx
src/features/intelligence/components/GraphCanvas.jsx
src/features/intelligence/components/GraphFilterSidebar.jsx
src/features/intelligence/components/GraphDetailPanel.jsx
src/features/intelligence/components/GraphSearchBar.jsx
src/features/intelligence/components/GraphLegend.jsx
src/features/intelligence/components/PayerForecastTable.jsx
src/features/intelligence/components/CashFlowByPayerChart.jsx
src/features/intelligence/components/ExecutionTimeline.jsx
src/features/intelligence/components/AppealOutcomesPanel.jsx
src/features/intelligence/components/AutomationROIPanel.jsx
src/features/intelligence/components/ModelAccuracyPanel.jsx
src/features/intelligence/components/FeedbackLoopPanel.jsx
src/features/lida/components/ChatGraphPreview.jsx
src/features/lida/components/ChatPredictionCard.jsx
src/features/workcenters/components/ExecutionLogTable.jsx
src/features/workcenters/components/ExecutionTimelineChart.jsx
src/features/workcenters/components/RulePerformanceTable.jsx
src/features/workcenters/components/OutcomeTrackingPanel.jsx
src/features/workcenters/components/SchedulerStatusBanner.jsx
src/features/workcenters/components/ModelPerformanceTable.jsx
src/features/settings/pages/MLModelMonitor.jsx
src/features/settings/components/ModelDetailPanel.jsx
src/features/settings/components/TrainingHistoryChart.jsx
src/features/settings/components/FeatureImportanceChart.jsx
src/features/settings/components/DriftDetectionPanel.jsx
```

### Existing Files to Modify (17 files)

```
src/services/api.js                                      -- 5 new namespaces, ~3 new methods in existing namespaces
src/App.jsx                                              -- 3 new routes, 2 legacy redirects
src/components/ui/index.js                               -- Export new shared components
src/features/dashboard/pages/CommandCenter.jsx            -- 4 new widgets
src/features/denials/pages/DenialAnalytics.jsx           -- Prediction badges, anomaly indicators
src/features/analytics/pages/RootCauseIntelligence.jsx   -- Neo4j graph panel, MiroFish overlay
src/features/denials/pages/DenialManagement.jsx          -- ML column, auto-appeal, MiroFish
src/features/denials/pages/AppealGenerator.jsx           -- Win prob, pipeline tracker, auto-appeal
src/features/denials/pages/HighRiskClaims.jsx            -- ML risk badge
src/features/payments/pages/PaymentDashboard.jsx         -- Delay prediction, auto-dispute, anomaly alerts
src/features/payments/pages/ERABankRecon.jsx             -- Anomaly indicators
src/features/claims/pages/ClaimsOverview.jsx             -- Risk badge, hold claim
src/features/claims/pages/ClaimsWorkQueue.jsx            -- Risk badge, hold claim
src/features/claims/pages/ScrubDashboard.jsx             -- ML-enhanced CRS
src/features/collections/pages/CollectionsQueue.jsx      -- ML propensity, expected recovery, auto-outreach
src/features/analytics/pages/PreventionDashboard.jsx     -- Persistent alerts, hold, dismiss, effectiveness
src/features/intelligence/pages/RevenueForecast.jsx      -- Per-payer breakdown, anomaly overlay, cash flow
src/features/lida/pages/LidaChat.jsx                     -- Graph rendering, prediction badges
src/features/intelligence/pages/SimulationDashboard.jsx  -- Neo4j live stats, execution timeline
src/features/workcenters/pages/AutomationDashboard.jsx   -- Major rewrite
```

### New API Endpoints Summary (all namespaces)

| Namespace | Methods | New Endpoints |
|-----------|---------|---------------|
| `predictions` | 11 | 11 new backend routes |
| `neo4j` | 6 | 6 new backend routes |
| `scheduler` | 6 | 6 new backend routes |
| `outcomes` | 5 | 5 new backend routes |
| `models` | 6 | 6 new backend routes |
| `appeals` (existing) | +1 | `autoAppeal` |
| `payments` (existing) | +1 | `autoDispute` |
| `claims` (existing) | +2 | `holdClaim`, `releaseClaim` |
| `collections` (existing) | +1 | `scheduleOutreach` |
| `prevention` (existing) | +2 | `getAlertHistory`, `getEffectiveness` |
| `automation` (existing) | +1 | `getExecutionLog` |
| **TOTAL** | **42** | **42 new backend routes** |

### NPM Dependencies to Add

```
react-force-graph-2d   -- for Graph Explorer interactive visualization
```
