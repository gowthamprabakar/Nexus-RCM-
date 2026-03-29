# NEXUS RCM — Sprint-Level UI/UX Delivery Plan
## Pages, Functionality, Additions, Deletions & Modifications Per Sprint

---

## CURRENT STATE AUDIT (Post Sprint 4)

### Pages by Module (76 Real + 5 Stubs)

| Module | Real Pages | Stubs | Live AI | Static/Mock AI | No AI |
|--------|-----------|-------|---------|---------------|-------|
| Intelligence Hub | 9 | 0 | 0 | 3 (CommandCenter, ExecDash, LIDA) | 6 |
| Patient Access | 6 | 0 | 0 | 0 | 6 |
| Coding & Charge | 4 | 0 | 0 | 0 | 4 |
| Claims Mgmt | 12 | 2 | 0 | 3 (Overview, WorkQueue, ScrubDash) | 9 |
| Payments & Posting | 5 | 0 | 1 (PaymentDash partial) | 0 | 4 |
| Denial Prevention | 10 | 0 | 3 (DenialMgmt, HighRisk, Analytics) | 0 | 7 |
| Billing & Collections | 10 | 1 | 2 (CollQueue, CollHub) | 0 | 8 |
| Reconciliation | 6 | 1 | 1 (RevenueRecon) | 1 (InsightDetail) | 4 |
| EVV Home Health | 5 | 1 | 0 | 0 | 5 |
| AI Engine | 6 | 0 | 0 | 0 | 6 |
| Settings/Admin | 10 | 0 | 0 | 0 | 10 |

**Totals: 76 real pages, 5 stubs, 7 live AI, 7 static/mock AI, 62 no AI**

---

## SPRINT 5: ROOT CAUSE ENGINE + PAYMENT TRIANGULATION
**Theme: "Know WHY — Revenue Root Cause + Payer Payment Intelligence"**
**Duration: 3 weeks**

### NEW PAGES TO ADD

| # | Page Name | Route | Module | Purpose |
|---|-----------|-------|--------|---------|
| 1 | **Root Cause Intelligence** | `/analytics/root-cause` | Intelligence Hub | System-wide root cause dashboard — top 10 root causes by revenue impact, trending causes, resolution rates |
| 2 | **Claim Root Cause Detail** | `/analytics/root-cause/claim/:claimId` | Intelligence Hub | 7-step Bayesian traversal visualization for a specific claim — shows every step, evidence, weight assignment |
| 3 | **Payer Payment Intelligence** | `/payments/payer-intelligence` | Payments & Posting | Per-payer triangulation view — ERA stated vs Bank received vs Contract expected. Payer float analysis, silent underpayment detection |
| 4 | **ERA-Bank Reconciliation** | `/payments/era-bank-recon` | Payments & Posting | Claim-level ERA vs Bank matching — flags ghost payments, claim washing, float gaps. Replaces batch-level rec |
| 5 | **ADTP Monitor** | `/analytics/adtp` | Intelligence Hub | Payer ADTP rolling 90-day trends with anomaly alerts. Red/amber/green by payer. Links ADTP spikes to root cause |

### PAGES TO MODIFY

| Page | Current State | Sprint 5 Changes |
|------|--------------|-------------------|
| **PaymentDashboard** | Static KPIs + partial Ollama | ADD: ERA vs Bank gap summary widget. ADD: Silent underpayment alert panel. ADD: Top 5 payers by float days. WIRE: Live payment triangulation data |
| **BankReconciliation** | Basic bank rec view | ADD: Anomaly detection panel (ghost payments, claim washing). ADD: ERA trace number matching status. ADD: Float days per payer chart |
| **RevenueReconciliation** | Live Ollama insights | ADD: Contract rate validation layer. ADD: Variance drill-down to root cause. ENHANCE: AI insights now reference specific root causes instead of generic descriptions |
| **DenialManagement** | Live Ollama + static heatmap | ADD: Root cause breakdown per denial — link each denial to its 7-step root cause profile. ADD: "View Root Cause" button on each denial row |
| **DenialAnalytics** | Live heatmap + win rates | ADD: Root cause distribution chart (pie: coder error vs payer policy vs documentation gap vs billing rule vs bad faith). ADD: Root cause trending over time |
| **PayerPerformance** | Static AI insights | REPLACE: Static insights with live payer behavioral intelligence. ADD: ADTP trend per payer. ADD: Float analysis. ADD: Denial pattern by payer |

### PAGES TO DELETE/CONSOLIDATE

| Page | Action | Reason |
|------|--------|--------|
| **AIInsightDetail** (`/finance/insights/:insightId`) | REFACTOR → merge into Root Cause Detail | Currently shows mock forecasting insights. The concept is right but the data model is wrong. Merge the UI pattern into the new Root Cause Detail page with real data |
| **ReconciliationAdvanced** | CONSOLIDATE → into ERA-Bank Reconciliation | Overlapping scope with the new triangulation page. Move any unique functionality into ERA-Bank Recon |

### STUBS TO BUILD OR REMOVE

| Stub | Action |
|------|--------|
| Submission Tracking (`/claims/submission-tracking`) | BUILD — Sprint 5. Critical for root cause: need to know if claim was actually received by payer. Add 277CA acknowledgment tracking |
| Payer Acknowledgments (`/claims/acknowledgments`) | MERGE → into Submission Tracking. Same domain. One page, not two |

### API ENDPOINTS TO ADD (Backend)

```
GET  /api/v1/root-cause/claim/:claimId      → 7-step traversal result
GET  /api/v1/root-cause/summary              → Top root causes by revenue impact
GET  /api/v1/root-cause/trending             → Root cause trends over time
GET  /api/v1/payments/triangulation/summary  → ERA vs Bank vs Contract summary
GET  /api/v1/payments/triangulation/payer/:id → Per-payer triangulation detail
GET  /api/v1/payments/adtp                    → ADTP by payer (rolling 90 day)
GET  /api/v1/payments/adtp/anomalies         → ADTP anomaly alerts
GET  /api/v1/payments/era-bank-match         → ERA-to-bank matching results
GET  /api/v1/payments/float-analysis         → Payer float days analysis
GET  /api/v1/payments/silent-underpayments   → Contract vs ERA discrepancies
POST /api/v1/claims/submission-status        → 277CA tracking
```

---

## SPRINT 6: DIAGNOSTIC ENGINE + CLAIM-LEVEL PREDICTION
**Theme: "Know WHAT'S WRONG — Diagnostic Intelligence + Pre-Submission Risk"**
**Duration: 3 weeks**

### NEW PAGES TO ADD

| # | Page Name | Route | Module | Purpose |
|---|-----------|-------|--------|---------|
| 1 | **Diagnostic Dashboard** | `/analytics/diagnostics` | Intelligence Hub | System health diagnostics — operational bottlenecks, revenue leakage points, payer behavior changes. All backed by root cause data from Sprint 5 |
| 2 | **Claim Risk Predictor** | `/claims/risk-assessment` | Claims Mgmt | Pre-submission claim-level risk scoring. Input: CPT + ICD-10 + Payer + POS + Modifier → Output: denial probability, specific risk factors, required documentation checklist, recommended action |
| 3 | **Payer Behavioral Profile** | `/payments/payer-profile/:payerId` | Payments & Posting | Deep-dive per payer: payment velocity, denial patterns by CPT/DRG, float behavior, contract compliance rate, ADTP trend, COB behavior, top denial reasons |
| 4 | **Revenue Leakage Analyzer** | `/analytics/revenue-leakage` | Intelligence Hub | Identifies all sources of revenue leakage: silent underpayments, uncollected COB, missed timely filing, write-offs that should have been appealed, contract underpayments |

### PAGES TO MODIFY

| Page | Sprint 6 Changes |
|------|-------------------|
| **CommandCenter** | REPLACE: Static AI insight cards with live diagnostic summary cards. ADD: Revenue health score (composite). ADD: Top 3 diagnostic alerts with drill-down to Diagnostic Dashboard. REPLACE: Mock pipeline with live pipeline (already done Sprint 4 — validate) |
| **ExecutiveDashboard** | REPLACE: Static EXEC_AI_INSIGHTS with live diagnostic insights. ADD: Revenue leakage summary. ADD: Payer risk scorecard. ADD: 30/60/90 day cash forecast from ADTP model |
| **Revenue Forecast** | COMPLETE OVERHAUL: Wire to 3-layer forecast model (Gross → Denial-adjusted → ADTP-timed). ADD: Confidence intervals. ADD: Payer-level forecast breakdown. ADD: Historical accuracy tracking |
| **ClaimsOverview** | REPLACE: Static AI_INSIGHTS with live claim risk distribution. ADD: Pre-submission risk summary (% claims at high/medium/low risk). ADD: Today's claims awaiting risk assessment |
| **ClaimsWorkQueue** | REPLACE: Static AI_INSIGHTS_WQ with live queue intelligence. ADD: Claim Risk Score (CRS) column in work queue table. ADD: Color-coded risk badges. ADD: "Pre-Check" button that runs risk predictor before submission |
| **ScrubDashboard** | REPLACE: Static AI_INSIGHTS_SCRUB with live scrub diagnostics. ADD: Auto-fix success rate by fix type. ADD: Denial prevention impact metrics |
| **HighRiskClaims** | ENHANCE: CRS score now includes payer behavioral data from Sprint 5. ADD: Predicted CARC code if denied. ADD: Recommended documentation before submission |
| **DenialManagement** | ADD: Diagnostic suggestion per denial (not just root cause — actionable diagnostic with fix recommendation). ENHANCE: Each insight now shows revenue impact calculation |
| **CollectionsHub** | REPLACE: mockAiInsights with live diagnostic insights. ADD: ADTP-based collection timing predictions. ADD: Payer payment probability by account |
| **LidaDashboard** | REPLACE: Static LIDA_AI_INSIGHTS with live system-wide diagnostics. LIDA should surface the top diagnostic findings from across all modules |

### PAGES TO DELETE/CONSOLIDATE

| Page | Action | Reason |
|------|--------|--------|
| **DenialPreventionDashboard** | MERGE → into Diagnostic Dashboard | Prevention is a subset of diagnostics. The diagnostic dashboard shows what's wrong AND what to prevent. Having a separate "prevention dashboard" creates confusion |
| **PreventionWorkspace** | KEEP — but rename to "Denial Resolution Workspace" | The workspace concept is good but "prevention" is misleading when claims are already denied |

### STUBS TO BUILD OR REMOVE

| Stub | Action |
|------|--------|
| A/R Balance Recon (`/reconciliation/ar-balance`) | BUILD — Sprint 6. Connect AR balance to ERA-Bank triangulation. Show: for each AR bucket, why hasn't it been collected? Root cause breakdown per aging bucket |
| Patient Statements (`/collections/statements`) | BUILD — Sprint 6. Patient balance after insurance, connected to COB analysis. Shows what patient truly owes after all payer adjudication |

### API ENDPOINTS TO ADD

```
GET  /api/v1/diagnostics/summary           → System health diagnostic summary
GET  /api/v1/diagnostics/alerts            → Active diagnostic alerts
GET  /api/v1/diagnostics/revenue-leakage   → All revenue leakage sources + amounts
POST /api/v1/claims/risk-predict           → Pre-submission risk prediction
GET  /api/v1/claims/risk-distribution      → Risk score distribution across pipeline
GET  /api/v1/payer/:id/profile             → Complete payer behavioral profile
GET  /api/v1/forecast/3-layer              → Gross/Denial-adj/ADTP-timed forecast
GET  /api/v1/forecast/accuracy             → Historical forecast accuracy tracking
```

---

## SPRINT 7: AUTOMATION LAYER
**Theme: "Fix It Automatically — Rules-Based Automation with Human-in-Loop"**
**Duration: 3 weeks**

### NEW PAGES TO ADD

| # | Page Name | Route | Module | Purpose |
|---|-----------|-------|--------|---------|
| 1 | **Automation Console** | `/automation/console` | AI Engine | Central automation hub — all active automation rules, their trigger conditions, success rates, and override controls. Human-in-the-loop approval queue |
| 2 | **Automation Rule Builder** | `/automation/rules/new` | AI Engine | Create automation rules: IF [root cause = X] AND [confidence > Y%] AND [payer = Z] THEN [action]. Visual rule builder with AND/OR conditions |
| 3 | **Automation Audit Trail** | `/automation/audit` | AI Engine | Every automated action logged: what was triggered, why, what happened, revenue impact. Full explainability |
| 4 | **Auto-Appeal Queue** | `/denials/auto-appeal` | Denial Prevention | Claims auto-selected for appeal based on root cause + historical win rate. Shows: claim, root cause, predicted win probability, recommended appeal argument. One-click approve or override |
| 5 | **Auto-Eligibility Verification** | `/insurance-verification/auto-verify` | Patient Access | Automated eligibility re-verification for claims approaching submission. Flags coverage gaps before claim drops |

### PAGES TO MODIFY

| Page | Sprint 7 Changes |
|------|-------------------|
| **CollectionsQueue** | ADD: Auto-prioritization toggle — queue automatically sorted by ADTP-based collection probability × dollar value. ADD: Auto-escalation rules (if ADTP exceeded by 1.5x → auto-escalate to supervisor) |
| **ClaimsWorkQueue** | ADD: Auto-fix button for claims failing scrub — if root cause is known billing rule error with 95%+ confidence, auto-fix and resubmit. ADD: Auto-hold for high-risk claims (CRS > 8.0 → hold for review instead of auto-submit) |
| **HighRiskClaims** | ADD: Batch auto-appeal for clusters of same root cause. If 15 claims have same root cause with >70% appeal win rate, generate one appeal template and apply to all |
| **PaymentDashboard** | ADD: Auto-resubmission trigger for claims past ADTP + 2σ with no ERA received. ADD: Auto-secondary claim generation for COB patterns detected by triangulation |
| **BankReconciliation** | ADD: Auto-posting for matched ERA-Bank transactions within tolerance. ADD: Auto-flag for ghost payments and claim washing anomalies |
| **COBAutoManager** | ENHANCE: Connect to triangulation engine. Auto-detect COB patterns from ERA data. Auto-generate corrected secondary claims |
| **EVVAutoRetryManager** | ENHANCE: Connect retry logic to root cause engine. If retry fails 3x with same CARC, escalate to root cause analysis instead of retrying |

### PAGES TO DELETE/CONSOLIDATE

| Page | Action | Reason |
|------|--------|--------|
| **AI Performance Engine** (`/ai-engine/performance`) | REFACTOR → Merge metrics into Automation Console | AI performance metrics should be part of the automation console, not a separate page |
| **MCPAgentHub** | KEEP — but move under AI Engine sidebar section | Developer tool, keep but consolidate navigation |

### STUBS TO BUILD OR REMOVE

| Stub | Action |
|------|--------|
| EVV Billing Bridge (`/evv/billing-bridge`) | BUILD — Sprint 7. Auto-bridge EVV verification data to claim submission. If EVV verified → auto-attach to claim |

### API ENDPOINTS TO ADD

```
GET  /api/v1/automation/rules                → List all automation rules
POST /api/v1/automation/rules                → Create new automation rule
PUT  /api/v1/automation/rules/:id            → Update rule
GET  /api/v1/automation/queue                → Pending automation actions (human approval)
POST /api/v1/automation/approve/:actionId    → Approve automated action
POST /api/v1/automation/reject/:actionId     → Reject automated action
GET  /api/v1/automation/audit                → Audit trail of all automated actions
POST /api/v1/denials/auto-appeal/batch       → Batch auto-appeal generation
POST /api/v1/claims/auto-fix                 → Auto-fix claim with known billing rule error
POST /api/v1/claims/auto-hold                → Auto-hold high-risk claim
GET  /api/v1/automation/metrics              → Automation success rates, savings
```

---

## SPRINT 8: PREVENTION + INTELLIGENCE LOOP CLOSURE
**Theme: "Stop It Before It Happens — Predictive Prevention + Closed Loop"**
**Duration: 3 weeks**

### NEW PAGES TO ADD

| # | Page Name | Route | Module | Purpose |
|---|-----------|-------|--------|---------|
| 1 | **Prevention Intelligence** | `/analytics/prevention` | Intelligence Hub | Pre-submission intelligence: claims in pipeline that WILL be denied based on prediction model. Shows: claim count at risk, $ at risk, top risk factors, prevention actions available |
| 2 | **Payer Policy Monitor** | `/payments/policy-monitor` | Payments & Posting | Tracks payer policy changes that affect denial rates. Auto-ingests policy updates. Maps policy changes to affected CPT/DRG combinations. Alerts when a policy change will impact revenue |
| 3 | **Revenue Recovery Tracker** | `/analytics/recovery` | Intelligence Hub | Tracks all revenue recovered through: appeals, resubmissions, underpayment recovery, COB corrections, auto-fixes. Shows ROI of the entire NEXUS intelligence system |
| 4 | **CDI Intelligence** | `/coding/cdi-intelligence` | Coding & Charge | Clinical Documentation Improvement intelligence — flags documentation gaps BEFORE claim submission based on payer requirements. Per-physician documentation scores |

### PAGES TO MODIFY

| Page | Sprint 8 Changes |
|------|-------------------|
| **CommandCenter** | ADD: Prevention score widget (% of pipeline claims with risk score < 3.0). ADD: Revenue recovered this month via automation. ADD: System ROI dashboard |
| **ExecutiveDashboard** | ADD: Prevention impact metrics. ADD: Automation savings dashboard. ADD: Year-over-year denial rate reduction. ADD: ADTP improvement trends |
| **Revenue Forecast** | ENHANCE: Add prevention-adjusted layer (Layer 4): if prevention catches X claims, add Y to expected revenue. Show: with vs without NEXUS prevention impact |
| **ClaimsOverview** | ADD: Pre-submission prevention actions queue. ADD: Claims held for documentation improvement. ADD: Claims auto-routed to CDI |
| **DenialAnalytics** | ADD: Prevention effectiveness metrics. ADD: "Denials prevented" counter. ADD: Before/after NEXUS comparison |
| **PatientAccessHub** | ADD: Auto-eligibility verification results. ADD: Coverage gap alerts. ADD: Prior auth requirement predictions based on payer policy monitor |

### FINAL STUBS — All stubs must be real pages or removed by Sprint 8

| Stub | Action |
|------|--------|
| Any remaining stubs | REMOVE — if not built by Sprint 8, delete the route |

### API ENDPOINTS TO ADD

```
GET  /api/v1/prevention/pipeline-risk         → Claims in pipeline at risk
GET  /api/v1/prevention/actions-available      → Prevention actions queue
GET  /api/v1/prevention/impact                 → Prevention effectiveness metrics
GET  /api/v1/payer/policy-changes              → Recent payer policy changes
GET  /api/v1/payer/policy-impact/:policyId     → Impact analysis of policy change
GET  /api/v1/recovery/summary                  → Revenue recovered by category
GET  /api/v1/recovery/roi                      → System ROI calculation
GET  /api/v1/cdi/physician-scores              → Per-physician documentation scores
GET  /api/v1/cdi/gaps                          → Active documentation gaps
POST /api/v1/cdi/alert                         → Trigger CDI alert for a claim
```

---

## SUMMARY: PAGE COUNT BY SPRINT

| Sprint | New Pages | Modified Pages | Deleted/Merged | Stubs Built | Stubs Removed | Net Page Change |
|--------|-----------|---------------|----------------|-------------|---------------|-----------------|
| Sprint 5 | 5 | 6 | 2 merged | 1 built, 1 merged | -1 | +4 |
| Sprint 6 | 4 | 10 | 1 merged, 1 renamed | 2 built | 0 | +5 |
| Sprint 7 | 5 | 7 | 1 merged | 1 built | 0 | +5 |
| Sprint 8 | 4 | 6 | 0 | 0 | any remaining | +4 |
| **TOTAL** | **18** | **29** | **4 merged** | **4 built** | **-1** | **+18** |

**Final state: ~94 pages (76 current + 18 new)**

---

## STATIC → LIVE CONVERSION TRACKER

All mock/static AI content must be replaced with live data. Target sprint for each:

| Page | Current State | Live By Sprint |
|------|--------------|----------------|
| CommandCenter | Static CC_AI_INSIGHTS | Sprint 6 |
| ExecutiveDashboard | Static EXEC_AI_INSIGHTS | Sprint 6 |
| LidaDashboard | Static LIDA_AI_INSIGHTS | Sprint 6 |
| ClaimsOverview | Static AI_INSIGHTS | Sprint 6 |
| ClaimsWorkQueue | Static AI_INSIGHTS_WQ | Sprint 6 |
| ScrubDashboard | Static AI_INSIGHTS_SCRUB | Sprint 6 |
| PayerPerformance | Static AI insights | Sprint 5 |
| AIInsightDetail | Mock forecasting data | Sprint 5 (merged into Root Cause Detail) |
| CollectionsHub | mockAiInsights from mockARData | Sprint 6 |

**By end of Sprint 6: ZERO static/mock AI content remaining in the application.**

---

## SIDEBAR NAVIGATION CHANGES PER SPRINT

### Sprint 5 — Add to Sidebar
```
INTELLIGENCE HUB
  + Root Cause Intelligence     ← NEW
  + ADTP Monitor                ← NEW

PAYMENTS & POSTING
  + Payer Payment Intelligence  ← NEW
  + ERA-Bank Reconciliation     ← NEW

CLAIMS MANAGEMENT
  + Submission Tracking         ← WAS STUB, NOW REAL
  - Payer Acknowledgments       ← MERGED INTO Submission Tracking
```

### Sprint 6 — Add to Sidebar
```
INTELLIGENCE HUB
  + Diagnostic Dashboard        ← NEW
  + Revenue Leakage Analyzer    ← NEW

CLAIMS MANAGEMENT
  + Claim Risk Predictor        ← NEW

PAYMENTS & POSTING
  + Payer Profile (deep-dive)   ← NEW (accessed from payer list)

DENIAL PREVENTION
  - Prevention Dashboard        ← MERGED INTO Diagnostic Dashboard
  ~ Prevention Workspace        ← RENAMED to "Denial Resolution Workspace"

RECONCILIATION
  + A/R Balance Recon           ← WAS STUB, NOW REAL

BILLING & COLLECTIONS
  + Patient Statements          ← WAS STUB, NOW REAL
```

### Sprint 7 — Add to Sidebar
```
AI ENGINE
  + Automation Console          ← NEW (replaces AI Performance)
  + Rule Builder                ← NEW
  + Automation Audit            ← NEW
  - AI Performance              ← MERGED INTO Automation Console

DENIAL PREVENTION
  + Auto-Appeal Queue           ← NEW

PATIENT ACCESS
  + Auto-Eligibility Verify     ← NEW

EVV HOME HEALTH
  + EVV Billing Bridge          ← WAS STUB, NOW REAL
```

### Sprint 8 — Add to Sidebar
```
INTELLIGENCE HUB
  + Prevention Intelligence     ← NEW
  + Revenue Recovery Tracker    ← NEW

PAYMENTS & POSTING
  + Payer Policy Monitor        ← NEW

CODING & CHARGE
  + CDI Intelligence            ← NEW
```

---

## SPRINT DEPENDENCY CHAIN

```
Sprint 5 (Root Cause + Triangulation)
    ↓ provides root cause data to
Sprint 6 (Diagnostic + Prediction)
    ↓ provides diagnostic triggers to
Sprint 7 (Automation)
    ↓ provides automation outcomes to
Sprint 8 (Prevention + Closed Loop)
    ↓ feeds back into
Sprint 5 (Root Cause recalibrates from outcomes)
```

**Each sprint REQUIRES the previous sprint to be complete. No parallelization possible between sprints.**
**Within each sprint, frontend and backend can be parallelized.**

---

## KEY ARCHITECTURAL DECISIONS PER SPRINT

### Sprint 5
- Root Cause Engine runs as a background service (not on-demand only)
- ERA-Bank matching runs nightly batch + real-time for new deposits
- ADTP calculated as rolling materialized view in database

### Sprint 6
- Claim Risk Predictor must return <200ms for pre-submission UX
- Diagnostic Dashboard uses WebSocket for real-time alert updates
- Revenue Forecast 3-layer model runs hourly, not on-demand

### Sprint 7
- ALL automation requires human-in-the-loop approval for first 30 days per rule
- After 30 days with >95% approval rate, rule can be promoted to auto-execute
- Audit trail is immutable — no delete, no edit

### Sprint 8
- Prevention metrics must show counterfactual: "without NEXUS, you would have lost $X"
- Payer Policy Monitor requires external data feed (payer website scraping or manual upload initially)
- CDI Intelligence requires NLP on physician notes (Ollama + clinical model)
