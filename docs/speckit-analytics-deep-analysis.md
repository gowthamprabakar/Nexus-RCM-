# NEXUS RCM Analytics Deep Analysis (SpecKit)

**Generated**: 2026-03-27
**Scope**: Root Cause, Diagnostic, Descriptive, and AI Insight layers
**Data source**: Live database + full codebase audit

---

## 1. CURRENT ARCHITECTURE MAP

### 1.1 Descriptive Analytics Layer

#### WHERE it exists

| Service | File | Purpose |
|---------|------|---------|
| `graph_query_service.py` | `backend/app/services/graph_query_service.py` | 5-level drill-down from Revenue to Claim |
| `root_cause_service.get_root_cause_summary()` | `backend/app/services/root_cause_service.py` | Aggregate root cause breakdowns |
| `root_cause_service.get_root_cause_trending()` | same | Weekly trending over N weeks |
| `rcm_ontology.py` | `backend/app/services/rcm_ontology.py` | Knowledge graph node/edge aggregations |
| `ai_insights.py` stat collectors | `backend/app/services/ai_insights.py` | Live KPI collection for 17 page contexts |
| `diagnostic_service.get_diagnostic_summary()` | `backend/app/services/diagnostic_service.py` | Summary by category and severity |

#### API Endpoints (Descriptive)

| Endpoint | Route File | Service Function |
|----------|-----------|-----------------|
| `GET /root-cause/summary` | `api/v1/root_cause.py` | `root_cause_service.get_root_cause_summary()` |
| `GET /root-cause/trending` | same | `root_cause_service.get_root_cause_trending()` |
| `GET /diagnostics/summary` | `api/v1/diagnostics.py` | `diagnostic_service.get_diagnostic_summary()` |
| `GET /ai/insights?page=command-center` | `api/v1/ai.py` | Stat collectors + Ollama narrative |
| `GET /ai/insights?page=executive` | same | Executive-level KPIs + narrative |

#### WHAT it computes

- **Denial counts by root cause category**: GROUP BY primary_root_cause with SUM(financial_impact)
- **Root cause group distribution**: PREVENTABLE / PROCESS / PAYER / CLINICAL percentages
- **Preventable amount**: SUM of financial_impact WHERE root_cause_group = 'PREVENTABLE'
- **Weekly trending**: Root cause counts grouped by week over configurable window (1-52 weeks)
- **Revenue drill-down** (graph_query_service): 5 levels -- Revenue -> Payers -> Denial Categories -> Root Causes -> Individual Claims -> Full Context
- **Ontology graph**: Claim status distribution, payer nodes (50), root cause nodes (15), denial category nodes (6), provider nodes (20), process stage nodes (7), plus edges connecting them
- **Diagnostic summary**: Finding counts by severity (critical/warning/info) and category, total $ impact

#### DATA FLOW

```
PostgreSQL tables (claims, denials, root_cause_analysis, payer_master, era_payments, bank_reconciliation)
    |
    v
Service functions (SQL queries via SQLAlchemy ORM)
    |
    v
FastAPI endpoints (/api/v1/root-cause/*, /api/v1/diagnostics/*, /api/v1/ai/*)
    |
    v
React frontend pages (Root Cause Dashboard, Diagnostics, Command Center, Executive Dashboard)
```

#### Pages that show descriptive data

| Page | API Called | Data Shown |
|------|-----------|------------|
| Root Cause Dashboard | `/root-cause/summary`, `/root-cause/trending` | Cause breakdown, group pct, preventable amount |
| Diagnostics Page | `/diagnostics/summary`, `/diagnostics/findings` | Finding counts by severity/category, top 5 findings |
| Command Center | `/ai/insights?page=command-center` | Total AR, denial rate, pass rate, revenue at risk |
| Executive Dashboard | `/ai/insights?page=executive` | Total revenue, denial rate, collection rate, days in AR |
| Denials Dashboard | `/ai/insights?page=denials` | Total denials, denied amount, top reason, top payer |
| Payments Page | `/ai/insights?page=payments` | ERA totals, payment rate, adjustments |
| Collections Page | `/ai/insights?page=collections` | AR outstanding, queue depth, 120+ aging |
| AR Aging | `/ai/insights?page=ar` | Bucket breakdown (0-30, 31-60, 61-90, 91-120, 120+) |
| Reconciliation | `/ai/insights?page=reconciliation` | ERA vs forecast vs bank deposit, variance % |
| Claims Pipeline | `/ai/insights?page=claims` | Status distribution, submission rate, CRS pass rate |
| Payer Performance | `/ai/insights?page=payer-performance` | Best/worst payer, avg ADTP, payment accuracy |
| Forecast | `/ai/insights?page=forecast` | Prophet model MAPE, 90-day projection, weekly avg |

---

### 1.2 Root Cause Analysis Layer

#### The 10-Step Evidence Chain

The engine visits 9 entity nodes plus a final synthesis step. Despite the user request naming "7 steps", the actual code has **10 steps**:

| Step | Name | What It Checks | Max Points |
|------|------|---------------|-----------|
| 1 | `CARC_RARC_DECODE` | Records CARC code and denial category as context. **Zero weight assigned.** | 0 |
| 2 | `ELIGIBILITY_CHECK` | Queries `eligibility_271` for subscriber status and coverage term against DOS | 30 |
| 3 | `AUTH_TIMELINE_CHECK` | Queries `prior_auth` for auth status (DENIED/EXPIRED) and expiry vs DOS | 30 |
| 4 | `CODING_VALIDATION` | Queries `claim_lines` for modifier complexity, bundling modifiers (59/25/X*), multi-modifier risk | 25 |
| 5 | `PAYER_HISTORY_MATCH` | Counts similar CARC denials from same payer in 90 days | 25 |
| 6 | `PROCESS_TIMELINE_CHECK` | Checks submission_date - date_of_service gap (>60d = FAIL, >30d = WARNING) | 30 |
| 7 | `PROVIDER_PATTERN_CHECK` | Compares provider's denial count to facility average in 90 days | 20 |
| 8 | `CARC_SPECIFIC_DETECTION` | Maps specific CARC codes (50, 18, 4, 45, 16) to root causes | 25 |
| 9 | `DOCUMENTATION_ENROLLMENT_CHECK` | Checks denial category text for DOCUMENT/CLINICAL/ENROLL keywords | 20 |
| 10 | `EVIDENCE_SYNTHESIS` | Ranks accumulated evidence, selects primary/secondary root cause, calculates confidence | - |

#### Current Root Cause Categories (all 15)

| # | Root Cause | Group | DB Count | Avg Confidence | Total Impact |
|---|-----------|-------|----------|----------------|-------------|
| 1 | CODING_MISMATCH | PROCESS | 28,594 | 18% | $105,269,193 |
| 2 | TIMELY_FILING_MISS | PREVENTABLE | 10,144 | 30% | $36,669,390 |
| 3 | ELIGIBILITY_LAPSE | PREVENTABLE | 9,994 | 30% | $36,680,975 |
| 4 | AUTH_MISSING | PREVENTABLE | 6,199 | 24% | $21,720,566 |
| 5 | PAYER_BEHAVIOR_SHIFT | PAYER | 763 | 25% | $2,138,117 |
| 6 | AUTH_EXPIRED | PREVENTABLE | 388 | 25% | $1,887,437 |
| 7 | PROCESS_BREAKDOWN | PROCESS | 344 | 20% | $955,480 |
| 8 | COB_ORDER_ERROR | PROCESS | 0 (exists in code) | - | - |
| 9 | BUNDLING_ERROR | PROCESS | 0 (exists in code) | - | - |
| 10 | DUPLICATE_CLAIM | PROCESS | 0 (exists in code) | - | - |
| 11 | MODIFIER_MISMATCH | PROCESS | 0 (exists in code) | - | - |
| 12 | DOCUMENTATION_DEFICIT | CLINICAL | 0 (exists in code) | - | - |
| 13 | MEDICAL_NECESSITY | CLINICAL | 0 (exists in code) | - | - |
| 14 | PROVIDER_ENROLLMENT | CLINICAL | 0 (exists in code) | - | - |
| 15 | CONTRACT_RATE_GAP | PAYER | 0 (exists in code) | - | - |

**Only 7 of 15 categories are populated in the database.**

#### Confidence Scoring Methodology

- Each step accumulates evidence points into a dictionary keyed by root cause category
- Final confidence = `(top_cause_points / 100) * 100`, capped at 95%
- Example: If ELIGIBILITY_LAPSE has 30 points, confidence = 30%
- If zero evidence found across all steps, falls back to CARC-category mapping with confidence = 25%

#### Evidence Weighting Algorithm

- Zero-prior design: CARC code is recorded but given 0 weight
- Each step can add 0-30 points to one root cause category
- Maximum theoretical confidence: 95% (hard cap)
- Bayesian weight = top_cause_points / total_points_across_all_causes
- Primary root cause = cause with most points; secondary = second-most

#### Disagreement Rate with Payer Labels

Not explicitly tracked. The engine deliberately ignores the payer-assigned CARC label for classification (zero-prior design), but uses it for CARC-specific detection in Step 8. No metric exists to measure how often the engine's classification agrees or disagrees with the payer's denial category label.

#### WHERE Root Cause Appears in UI

- Root Cause Dashboard: `/root-cause/summary`, `/root-cause/trending`
- Claim detail view: `/root-cause/claim/{claim_id}` (shows all 10 steps)
- AI Insights on root-cause page: `/ai/insights?page=root-cause`
- Diagnostic findings reference root causes in the `root_causes` field
- Graph drill-down Level 3: Root causes per payer+category

#### WEAKNESSES

1. **8 of 15 root cause categories never populate** -- COB_ORDER_ERROR, BUNDLING_ERROR, DUPLICATE_CLAIM, MODIFIER_MISMATCH, DOCUMENTATION_DEFICIT, MEDICAL_NECESSITY, PROVIDER_ENROLLMENT, and CONTRACT_RATE_GAP have zero records. The detection logic exists but real-world data patterns do not trigger them frequently enough, or CARC codes that would trigger Steps 8/9 are not present in the dataset.

2. **Low confidence scores (18-30%)** -- The max points per step are 25-30, and typically only one step fires per denial. A single 30-point finding yields confidence = 30%. The scoring formula `(top_points / 100) * 100` means you need 95+ total points for 95% confidence, but a single denial can accumulate at most ~55 points (two steps firing at max). Multi-step convergence is rare.

3. **Single primary cause constraint** -- Each denial gets exactly one primary_root_cause. Real-world denials frequently have compound causes (e.g., eligibility lapsed AND coding mismatch). The secondary_root_cause field exists but is rarely populated and not surfaced prominently.

4. **No temporal analysis** -- No tracking of whether a root cause is new, growing, or declining. The trending endpoint groups by week but does not compute growth rates, acceleration, or trend direction.

5. **No claim-type segmentation** -- Root cause analysis does not factor in claim type (professional vs institutional), place of service, or specialty. A coding mismatch for a surgical claim has different implications than one for an office visit.

6. **No feedback loop** -- When an appeal succeeds or fails, the outcome is not fed back to recalibrate the root cause engine's weights or confidence.

---

### 1.3 Diagnostic Analysis Layer

#### 5 Detection Engines

| # | Engine | Function | What It Detects | Severity Logic |
|---|--------|----------|----------------|---------------|
| 1 | Denial Pattern Detection | `_detect_denial_patterns()` | Root causes with >200 occurrences and >$500K impact. Identifies top payer and top denial category per root cause. | Critical: >500 count AND >$1M. Warning: >200 AND >$500K. |
| 2 | Payer Behavior Detection | `_detect_payer_behavior()` | Payer denial rate spikes >1.5x historical baseline in last 90 days. | Critical: >2.0x baseline. Warning: >1.5x. |
| 3 | ADTP Anomaly Detection | `_detect_adtp_anomalies()` | Anomalous Average Days to Pay entries from `adtp_trends` table (is_anomaly=True). | Critical: >10 days deviation. Warning: otherwise. |
| 4 | Revenue Leakage Detection | `_detect_revenue_leakage()` | ERA vs Bank deposit variance >5% per payer from `bank_reconciliation` table. | Critical: >10% variance. Warning: >5%. |
| 5 | AR Aging Detection | `_detect_ar_aging()` | Claims submitted >90 days ago still in non-terminal status (not PAID/DENIED/WRITTEN_OFF/VOIDED). | Critical: >500 stuck claims or >$1M. Warning: otherwise. |

#### How Diagnostics Feed Into Automation

The `automation_engine.py` evaluates diagnostic findings against 5+ automation rules:

| Rule | Trigger | Condition | Action |
|------|---------|-----------|--------|
| AUTO-001 | DENIAL_PATTERN finding | confidence >= 80 | Auto-categorize denials by root cause |
| AUTO-002 | root_cause_cluster | count >= 5, win_rate >= 70% | Generate batch appeal |
| AUTO-003 | PAYMENT_FLOW finding | confidence >= 95 | Auto-post ERA payments |
| AUTO-004 | AR_AGING finding | confidence >= 70 | Re-prioritize aged claims for collection |
| AUTO-005 | REVENUE_LEAKAGE finding | confidence >= 80 | Flag underpayment variance |

Architecture: `diagnostic_service.generate_system_diagnostics()` -> `automation_engine` evaluates rules against findings -> creates `AutomationAction` records.

#### How Diagnostics Feed Into AI Insights

The diagnostics page context (`page=diagnostics`) injects the following into the Ollama prompt:
- Total diagnostic findings count
- Critical/warning counts
- Total $ at risk
- Top 5 findings with severity, title, impact, category
- Category breakdown with counts and impact

This allows the LLM to generate narrative insights that reference actual diagnostic findings.

#### Severity Classification System

Three levels:
- **Critical**: High count + high dollar impact, or extreme deviation (>2x baseline, >10% variance, >10 days ADTP deviation)
- **Warning**: Moderate count/impact, or moderate deviation (>1.5x baseline, >5% variance)
- **Info**: Low-level findings (currently filtered out in denial pattern detection -- skipped if below warning threshold)

#### WHERE Diagnostics Appear in UI

- Diagnostics Dashboard: `/diagnostics/summary`, `/diagnostics/findings`
- Payer-specific diagnostic: `/diagnostics/payer/{payer_id}`
- Claim-level diagnostic: `/diagnostics/claim/{claim_id}` (shows root cause finding + aging finding if applicable)
- AI Insights on diagnostics page: `/ai/insights?page=diagnostics`
- Automation Dashboard (via automation_engine consuming diagnostic findings)

#### WEAKNESSES

1. **Only 5 detection engines vs 121 in the Bible Part 3** -- Massive coverage gap. Missing: coding-specific diagnostics, charge capture leakage, modifier error patterns, duplicate claim detection, authorization workflow bottlenecks, clinical documentation deficiency patterns, credentialing gaps, contract compliance monitoring, claim scrubbing error trends, and many more.

2. **No claim-level diagnostics** -- All 5 engines operate at aggregate level (system-wide or payer-level). Cannot diagnose "what is wrong with THIS specific claim" beyond basic root cause and aging checks in `generate_claim_diagnostic()`.

3. **No provider-level diagnostics** -- Despite the ontology building provider nodes with denial patterns, no diagnostic engine analyzes provider-level anomalies (e.g., "Dr. Smith's coding denial rate is 3x facility average").

4. **No coding-specific diagnostics** -- No detection for: NCCI edit failures, modifier misuse trends, DRG mismatch patterns, CPT-ICD linkage errors, E&M level distribution anomalies.

5. **No real-time diagnostics** -- All diagnostics are generated on-demand (synchronous query at request time). No background processing, no event-driven detection, no alerting pipeline.

6. **No diagnostic_finding table in database** -- The query for `diagnostic_finding` table returned `UndefinedTableError`. Diagnostics are computed on-the-fly and never persisted, meaning no historical trending of diagnostic findings.

---

### 1.4 AI Descriptive Layer (Ollama)

#### How Ollama Insights Work

```
1. Frontend requests: GET /ai/insights?page=<context>
2. Router calls stat collector function to pull live DB numbers
3. Stats are injected into a prompt template (no LLM touches raw numbers)
4. Prompt sent to Ollama (llama3, fallback mistral), temperature=0.3
5. Response parsed as JSON array of 3 insight objects
6. Each insight gets badge from BADGE_MAP, cached for 5 minutes
7. Returned to frontend as structured insight cards
```

#### All 17 Registered Contexts

| # | Context (page=) | Stat Collector | Stats Injected | Badges |
|---|----------------|---------------|----------------|--------|
| 1 | `denials` | `_collect_denials_stats()` | total_denials, denied_amount, top_reason, top_payer, overturn_rate, ai_saved | Diagnostic, Prescriptive |
| 2 | `collections` | `_collect_collections_stats()` | total_ar, queue_depth, total_collectible, active_alerts, over_120_count/amount, avg_propensity | Predictive, Prescriptive |
| 3 | `payments` | `_collect_payments_stats()` | total_posted, era_count, adjustments, patient_resp, payment_rate, variance_pct | Descriptive, Diagnostic |
| 4 | `ar` | AR-specific collector | bucket_0_30 through bucket_120_plus, avg_days, top_payer | Diagnostic, Predictive |
| 5 | `reconciliation` | `_collect_reconciliation_stats()` | era_received, forecasted, bank_deposited, variance_count, reconciled_count | Descriptive, Diagnostic |
| 6 | `high-risk` | High-risk collector | (high-risk claim stats) | Predictive, Prescriptive |
| 7 | `crs` | CRS collector | pass_rate, auto_fix_rate, top_error_category, denials_prevented, revenue_saved | Prescriptive, Descriptive |
| 8 | `root-cause` | Root cause collector | total_analyses, total_financial_impact, preventable_amount/pct, top_root_cause | Diagnostic, Prescriptive |
| 9 | `adtp` | ADTP collector | payers_tracked, avg_adtp, anomaly_count, delayed_payers, max_deviation | Predictive, Diagnostic |
| 10 | `diagnostics` | Diagnostic summary collector | total_findings, critical/warning_count, total_impact, top_findings, by_category | Diagnostic, Prescriptive |
| 11 | `command-center` | Command center collector | total_ar, avg_days, denial_rate, denied_amount, pass_rate, collection_rate, revenue_at_risk | Descriptive, Predictive, Prescriptive |
| 12 | `executive` | Executive collector | total_revenue, denial_rate, collection_rate, days_in_ar, first_pass_rate, total_claims | Descriptive, Predictive, Prescriptive |
| 13 | `claims` | Claims pipeline collector | total_claims, status distribution (draft/submitted/acknowledged/paid/denied), submission_rate | Descriptive, Diagnostic |
| 14 | `claims-workqueue` | Work queue collector | queue_size, high_risk_count, auto_fix_count/rate, avg_crs_score, charges_at_risk | Predictive, Prescriptive |
| 15 | `prevention` | Prevention collector | total_alerts, critical_count, revenue_at_risk, preventable_count, prevention_rate | Predictive, Prescriptive |
| 16 | `payer-performance` | Payer performance collector | payers_tracked, best/worst payer, avg_adtp, slowest_payer, payment_accuracy | Diagnostic, Prescriptive |
| 17 | `simulation` | Simulation collector | scenarios_available, last_sim_type/summary, projected_impact, confidence_level | Predictive, Prescriptive |
| 18 | `forecast` | Forecast collector | model_type, MAPE, R-squared, 90-day projection, weekly_avg, denial_pct | Predictive, Prescriptive |

Plus 3 non-insight endpoints:
- `POST /ai/appeal-draft` -- generates formal appeal letter
- `POST /ai/call-script` -- generates collections call script
- `GET /ai/anomaly-explain` -- explains a specific metric anomaly

#### Badge System (MECE Classification)

Four badge types mapped per page context in `BADGE_MAP`:
- **Descriptive**: "What happened" -- appears on payments, reconciliation, command-center, executive, claims, crs
- **Diagnostic**: "Why it happened" -- appears on denials, payments, ar, reconciliation, root-cause, adtp, diagnostics, claims, payer-performance
- **Predictive**: "What will happen" -- appears on collections, ar, high-risk, adtp, command-center, executive, claims-workqueue, prevention, simulation, forecast
- **Prescriptive**: "What to do about it" -- appears on denials, collections, high-risk, crs, root-cause, diagnostics, command-center, executive, claims-workqueue, prevention, payer-performance, simulation, forecast

Each insight card gets one badge. The LLM selects the badge per-insight but defaults to rotating through the context's assigned badges.

#### WEAKNESSES

1. **Hardcoded values in stat collectors** -- `ai_saved = 71_862_405` is hardcoded in `_collect_denials_stats()`. `avg_days_appeal = 14` is hardcoded. `variance_pct = -0.2` is hardcoded in payments stats. These fabricated numbers are injected into prompts as if they were live data.

2. **No cross-context intelligence** -- Each page context generates insights in isolation. The denials page does not know about the AR aging situation. The command center does not reference diagnostic findings. No holistic view.

3. **Shallow narrative quality** -- With only 5-8 stats per context and a generic prompt template, the LLM generates surface-level narratives. It cannot identify WHY a metric changed, only state THAT it changed.

4. **No insight deduplication** -- If two pages share similar stats (e.g., command-center and executive both include denial_rate), the LLM may generate identical insights.

5. **No historical comparison** -- Stats are point-in-time snapshots. No week-over-week or month-over-month delta is computed and injected, so the LLM cannot identify trends.

6. **5-minute cache masks staleness** -- The TTL-based cache means insights may be 5 minutes stale, but there is no indicator to the user that they are seeing cached vs fresh insights.

---

## 2. GAP ANALYSIS -- What's Missing

### 2.1 Root Cause Gaps

#### Only 7 of 15 root cause categories are populated

**Populated** (7): CODING_MISMATCH, TIMELY_FILING_MISS, ELIGIBILITY_LAPSE, AUTH_MISSING, PAYER_BEHAVIOR_SHIFT, AUTH_EXPIRED, PROCESS_BREAKDOWN

**Empty** (8): COB_ORDER_ERROR, BUNDLING_ERROR, DUPLICATE_CLAIM, MODIFIER_MISMATCH, DOCUMENTATION_DEFICIT, MEDICAL_NECESSITY, PROVIDER_ENROLLMENT, CONTRACT_RATE_GAP

**Why they are empty**:
- Steps 8 and 9 rely on specific CARC codes (50, 18, 4, 45, 16) and denial category keywords (DOCUMENT, CLINICAL, ENROLL, CREDENTIAL). If the dataset does not contain these exact codes or keywords, these categories never fire.
- The coding validation step (Step 4) can theoretically trigger BUNDLING_ERROR and MODIFIER_MISMATCH, but it also competes with the more generic CODING_MISMATCH. When modifier complexity is detected but the specific bundling modifier set (59/25/X*) is not present, it defaults to CODING_MISMATCH.
- COB_ORDER_ERROR only triggers if CARC is CO-22 AND eligibility is ACTIVE. This specific combination may be rare.

#### Confidence scores are low (18-30%)

**Why**: The formula `confidence = min(int((top_points / 100) * 100), 95)` divides by a fixed 100 denominator. A single step giving 30 points yields 30% confidence. For higher confidence, multiple steps must fire for the SAME root cause, which is structurally unlikely because:
- Step 2 (eligibility) and Step 3 (auth) target different root causes
- Step 4 (coding) targets CODING_MISMATCH/BUNDLING/MODIFIER
- Step 5 (payer history) targets PAYER_BEHAVIOR_SHIFT
- These rarely align to the same category

**How to fix**: (a) Reduce the denominator from 100 to the actual max possible points for the path taken, (b) Add correlation bonuses when multiple evidence types agree on the same root cause group, (c) Use historical accuracy data to calibrate per-category confidence baselines.

#### No multi-factor root cause

Current: Each denial has exactly one `primary_root_cause` and optionally one `secondary_root_cause`. In reality, a denial may be caused by AUTH_EXPIRED + CODING_MISMATCH + TIMELY_FILING_MISS simultaneously.

Missing: A `contributing_factors` list with weighted contributions summing to 100%.

#### No temporal root cause analysis

Questions the system cannot answer:
- "Is CODING_MISMATCH growing or shrinking month-over-month?"
- "Did PAYER_BEHAVIOR_SHIFT emerge after a contract change date?"
- "Is AUTH_MISSING seasonal (higher in Q4 enrollment periods)?"

The trending endpoint exists but returns flat counts without growth rate, trend direction, or acceleration metrics.

#### No root cause trends

No computation of:
- Week-over-week growth rate per root cause
- Moving average smoothing
- Anomaly detection on root cause frequency changes
- Correlation between root cause spikes and external events (payer policy changes, staff turnover)

### 2.2 Descriptive Gaps

#### Hardcoded vs Real Data

| Metric | Source | Status |
|--------|--------|--------|
| Total denials / denied amount | `COUNT/SUM` from denials table | REAL |
| Top denial reason / top payer | `GROUP BY` queries | REAL |
| Overturn rate | Hardcoded as `0.0` | HARDCODED |
| AI prevention saved | Hardcoded as `$71,862,405` | HARDCODED |
| Avg days to appeal | Hardcoded as `14` | HARDCODED |
| Payment variance % | Hardcoded as `-0.2%` | HARDCODED |
| ERA/Bank totals | SUM from tables | REAL |
| AR aging buckets | SUM from ar_aging_bucket table | REAL |
| CRS pass rate | Computed from claims | REAL |
| Collection propensity scores | AVG from collection_queue | REAL |

#### Missing Descriptive Metrics (from Bible Part 1)

- **Clean Claim Rate**: Not computed (only CRS pass rate exists, which is a proxy)
- **First Pass Resolution Rate**: Not computed
- **Cost to Collect**: Not computed
- **Denial Write-off Rate**: Not computed
- **Point-of-Service Collection Rate**: Not computed
- **Charge Capture Rate**: Not computed
- **A/R > 90 days as % of total A/R**: Not computed as a standalone KPI
- **Cash Acceleration Days (CAD)**: Not computed
- **Revenue per Encounter**: Not computed
- **Payer Mix Analysis**: Only partial (payer nodes in ontology, but no payer mix % of revenue)

### 2.3 Diagnostic Gaps

#### Only 5 detection engines vs 121 in Bible Part 3

Current coverage: DENIAL_PATTERN, PAYER_BEHAVIOR, PAYMENT_FLOW (ADTP), REVENUE_LEAKAGE (ERA-Bank), AR_AGING

Missing major categories from Bible Part 3:
- **Coding diagnostics** (NCCI edits, modifier misuse, DRG validation, E&M leveling, CPT-ICD linkage)
- **Authorization workflow diagnostics** (auth turnaround time, auth denial rate by procedure, retrospective auth success rate)
- **Charge capture diagnostics** (missed charges, unbilled encounters, charge lag days)
- **Clinical documentation diagnostics** (CDI query response rate, documentation deficiency patterns)
- **Contract compliance diagnostics** (underpayment detection, rate variance by CPT, fee schedule adherence)
- **Patient access diagnostics** (registration error rate, insurance verification failure rate)
- **Credentialing diagnostics** (expired credentials, enrollment gaps by payer)
- **Claim scrubbing diagnostics** (edit failure rate by category, auto-fix success rate)
- **Payment posting diagnostics** (posting accuracy, unmatched payments, takeback trends)
- **Denial management workflow diagnostics** (appeal timeliness, appeal win rate by category, rework rate)

#### No claim-level diagnostics

The `generate_claim_diagnostic()` function exists but only checks:
1. Whether the claim has a root cause analysis
2. Whether the claim is aged >90 days

It does not analyze: coding accuracy, documentation completeness, authorization status, payer contract compliance, duplicate submission risk, or charge accuracy for that specific claim.

#### No provider-level diagnostics

Despite having provider denial data in the ontology (top 20 providers with denial patterns), no diagnostic engine analyzes:
- Which providers have abnormal denial rates by category
- Which providers have coding accuracy issues
- Which providers are consistently late on documentation

---

## 3. WHERE MIROFISH CAN IMPROVE

### 3.1 Root Cause Enhancement with MiroFish

**Current state**: Root cause engine classifies a denial, assigns a single primary cause with 18-30% confidence, no validation.

**MiroFish enhancement**: After classification, run a MiroFish simulation to validate the root cause.

**How it works**:
1. Root cause engine classifies denial as ELIGIBILITY_LAPSE (confidence 30%)
2. MiroFish creates a scenario: "If eligibility were active, would this claim have been paid?"
3. Payer agent (digital twin from `payer_agents.py`) evaluates: "Given this payer's historical behavior with active eligibility claims of this type, approval probability is 85%"
4. Coder agent evaluates: "No coding issues detected that would cause denial independently"
5. Billing agent evaluates: "Timely filing within norms, no process issues"
6. Result: 3 agents agree ELIGIBILITY_LAPSE is the root cause -> confidence boosted from 30% to 75%

**Architecture**:
```
root_cause_service.analyze_denial_root_cause()
    |
    v (primary_root_cause + evidence)
simulation_engine.run_validation_scenario()
    |
    v (multi-agent consensus)
confidence_boost = agent_agreement_pct * validation_weight
    |
    v
Updated RootCauseAnalysis.confidence_score
```

**Integration point**: `rcm_ontology.py` already builds the knowledge graph with payer nodes, provider nodes, and root cause nodes. `payer_agents.py` already builds digital twin profiles with denial tendencies and negotiation postures. These existing components provide the foundation.

### 3.2 Diagnostic Enhancement with MiroFish

**Current state**: Diagnostic engine finds patterns (e.g., "CODING denials spiked 34%") but cannot project impact.

**MiroFish enhancement**: When a diagnostic finding fires, run a MiroFish simulation to project forward impact.

**How it works**:
1. Diagnostic engine detects: "UnitedHealthcare denial rate is 2.1x historical baseline"
2. MiroFish creates scenario: "If UHC continues denying at this rate for 90 days, what is the total revenue impact?"
3. UHC digital twin agent (from `payer_agents.py`) simulates 90 days of adjudication behavior
4. Result: "$2.4M additional denied revenue over 90 days if unchecked"
5. This projected impact is attached to the diagnostic finding

**Architecture**:
```
diagnostic_service._detect_payer_behavior()
    |
    v (finding: UHC denial rate 2.1x baseline)
simulation_engine.run_projection_scenario({
    type: "payer_behavior_continuation",
    payer: "UnitedHealthcare",
    current_rate: 0.21,
    baseline_rate: 0.10,
    projection_days: 90,
    claims_volume: monthly_volume
})
    |
    v
finding.projected_impact_90d = simulation_result.revenue_impact
finding.simulation_confidence = simulation_result.confidence
```

### 3.3 Descriptive Enhancement with MiroFish

**Current state**: KPI descriptions are static numbers with LLM-generated narrative wrapping. The narrative says "denial rate is 12.3%" but cannot explain WHY.

**MiroFish enhancement**: When a KPI changes significantly, use MiroFish agents to debate WHY.

**How it works**:
1. System detects: "Revenue dropped 8% this month"
2. MiroFish spawns a multi-agent debate:
   - **Payer Agent**: "We changed our prior auth requirements last month. Expected denial spike."
   - **Coding Agent**: "No significant coding accuracy changes detected."
   - **Billing Agent**: "Claim volume is flat. Revenue drop is driven by denial increase, not volume."
3. Agents reach consensus: "Revenue drop primarily driven by payer behavior shift (60% weight) + eligibility lapse increase (25% weight) + seasonal AR aging (15% weight)"
4. This causal narrative replaces the generic "Revenue dropped 8%" insight

**Architecture**:
```
KPI delta detected (week-over-week comparison)
    |
    v
rcm_ontology.build_rcm_ontology() -> knowledge graph snapshot
    |
    v
payer_agents.build_payer_agents() -> relevant agent profiles
    |
    v
Multi-agent debate (3 rounds)
    |
    v
Causal narrative with weighted contributing factors
    |
    v
ai_insights enriched prompt -> higher-quality Ollama narrative
```

---

## 4. PROPOSED IMPROVED ARCHITECTURE

### Current Flow

```
DB --> root_cause_service --> API --> Frontend (flat display, 18-30% confidence)
DB --> diagnostic_service --> API --> Frontend (alert list, no projection)
DB --> ai_insights (Ollama) --> API --> Frontend (generic narrative cards)
DB --> simulation_engine --> API --> Frontend (standalone what-if tool)
```

### Improved Flow

```
DB --> root_cause_service --> VALIDATE via simulation_engine --> confirmed root cause (60-85% confidence)
       |
       v
confirmed root cause --> diagnostic_service --> IMPACT PROJECTION via simulation_engine --> projected $ impact
       |
       v
projected impact --> ai_insights (Ollama) --> enriched with simulation context --> meaningful causal narrative
       |
       v
meaningful narrative --> automation_engine --> "simulate before activate" --> safe, validated automation
       |
       v
automation outcomes --> feedback_loop --> root_cause_service (recalibrate weights)
```

### Key Architectural Changes

1. **Validation layer**: root_cause_service calls simulation_engine BEFORE persisting the root cause, using the result to boost or reduce confidence
2. **Projection layer**: diagnostic findings trigger forward-looking simulations that attach projected impact to each finding
3. **Enriched AI prompts**: stat collectors include simulation validation results and projected impacts, giving the LLM richer context for narratives
4. **Feedback loop**: appeal outcomes (success/failure) are fed back to adjust step weights in the root cause engine
5. **Simulate-before-activate**: automation_engine runs a simulation of each proposed action before executing, estimating the expected ROI and flagging risky automations

---

## 5. SPECIFIC IMPROVEMENTS (Ranked by Impact)

| # | Improvement | Layer | Current State | Improved State | Complexity | Revenue Impact |
|---|------------|-------|--------------|---------------|-----------|---------------|
| 1 | **Fix confidence scoring formula** | Root Cause | Confidence = top_points/100, yields 18-30%. Max theoretical ~55%. | Confidence = top_points/max_possible_for_path, normalized with category-specific baselines. Yields 50-85%. | Low | $0 direct, but enables all downstream improvements by making root cause data trustworthy |
| 2 | **Populate missing 8 root cause categories** | Root Cause | 8 of 15 categories have 0 records. CARC-specific detection only handles 5 CARC codes. | Expand CARC mapping to cover top 50 CARC codes. Add ICD-10 diagnosis code analysis. Ensure all 15 categories can trigger from real data. | Medium | $10-15M in better-classified denials enabling targeted interventions |
| 3 | **Add root cause validation via MiroFish simulation** | Root Cause + MiroFish | No validation of root cause after classification. | Post-classification simulation validates root cause, boosting confidence from ~30% to ~75% for validated causes. | High | $5-8M from higher-confidence root causes enabling automated appeals |
| 4 | **Remove hardcoded values from stat collectors** | AI/Descriptive | ai_saved=$71.8M hardcoded, overturn_rate=0, avg_days_appeal=14, variance_pct=-0.2 hardcoded. | Compute from actual data: appeal outcomes table, prevention tracking, real variance calculations. | Low | $0 direct, but eliminates misleading data that could cause wrong decisions |
| 5 | **Add diagnostic forward-projection** | Diagnostic + MiroFish | Diagnostics show current state only ("UHC denial rate is 2x baseline"). | Attach 30/60/90-day projected impact to each finding using MiroFish simulation. | Medium | $3-5M from earlier intervention on escalating payer issues |
| 6 | **Implement multi-factor root cause** | Root Cause | Each denial has exactly 1 primary cause. | Each denial has weighted contributing_factors list (e.g., 60% eligibility + 25% coding + 15% timely filing). | Medium | $8-12M from compound-cause interventions that address multiple issues simultaneously |
| 7 | **Add coding-specific diagnostic engines** | Diagnostic | Zero coding diagnostics. CODING_MISMATCH is the #1 root cause (28,594 records, $105M) but no diagnostic explains what coding errors are occurring. | NCCI edit failure detection, modifier misuse trends, E&M level distribution, CPT-ICD linkage validation. | High | $15-25M -- CODING_MISMATCH is $105M impact; 15-25% reduction through targeted coding diagnostics |
| 8 | **Add root cause trend computation** | Root Cause | No growth rates, no trend direction, no anomaly detection on root cause frequency. | Week-over-week growth rate, moving average, trend classification (growing/stable/declining), anomaly alerts. | Low | $2-3M from early detection of emerging denial patterns |
| 9 | **Add provider-level diagnostics** | Diagnostic | No provider-specific analysis despite provider data in ontology. | Per-provider denial rate vs facility average, specialty-specific coding accuracy, documentation timeliness. | Medium | $5-8M from targeted provider education reducing denial rates |
| 10 | **Persist diagnostic findings** | Diagnostic | No `diagnostic_finding` table exists. All diagnostics computed on-the-fly. | Persist findings with timestamps, enable historical trending, detect recurring vs one-time findings. | Low | $1-2M from historical diagnostic trending enabling proactive management |
| 11 | **Add cross-context AI intelligence** | AI/Descriptive | Each page generates insights in isolation. | Stat collectors pull from adjacent contexts (e.g., denials page also sees AR aging and payer behavior data). LLM generates connected narratives. | Medium | $2-4M from holistic insights that connect denial spikes to AR aging to revenue impact |
| 12 | **Add week-over-week deltas to stat collectors** | AI/Descriptive | Stats are point-in-time snapshots. No comparison to prior period. | Each stat includes current value + prior_week value + delta_pct. LLM can now identify trends. | Low | $1-3M from trend-aware narratives enabling faster response to emerging issues |
| 13 | **Implement feedback loop from appeal outcomes** | Root Cause | No learning from appeal success/failure. Weights are static. | Appeal outcomes update per-category confidence baselines. Categories with high appeal success get boosted. | Medium | $3-5M from self-improving root cause accuracy over time |
| 14 | **Simulate-before-activate automation** | Automation + MiroFish | Automation rules execute based on diagnostic findings without simulating consequences. | Each automation action runs a MiroFish simulation first: "If we batch-appeal these 200 CODING_MISMATCH denials, what is the expected recovery?" | High | $4-7M from higher ROI automation with pre-validated expected outcomes |
| 15 | **Add contract compliance diagnostic engine** | Diagnostic | No detection of underpayment relative to contracted rates. CONTRACT_RATE_GAP root cause has 0 records. | Compare paid amounts to `payer_contract_rates` table. Flag systematic underpayments. | Medium | $5-10M from systematic underpayment recovery |

---

## APPENDIX: Database State Snapshot

### Root Cause Analysis Table Distribution

```
Root Cause                  Group         Count    Conf   Total Impact
CODING_MISMATCH             PROCESS       28,594   18%    $105,269,193
TIMELY_FILING_MISS          PREVENTABLE   10,144   30%    $ 36,669,390
ELIGIBILITY_LAPSE           PREVENTABLE    9,994   30%    $ 36,680,975
AUTH_MISSING                PREVENTABLE    6,199   24%    $ 21,720,566
PAYER_BEHAVIOR_SHIFT        PAYER            763   25%    $  2,138,117
AUTH_EXPIRED                PREVENTABLE      388   25%    $  1,887,437
PROCESS_BREAKDOWN           PROCESS          344   20%    $    955,480
                                          ------          ------------
TOTAL                                     56,426          $205,321,158
```

### Diagnostic Finding Table

Table `diagnostic_finding` does not exist in the database. Diagnostics are computed on-the-fly by `diagnostic_service.py` and never persisted.

### Key Observations

1. **CODING_MISMATCH dominates** at 50.7% of all root causes and $105M impact, but has the lowest confidence score (18%). This is because Step 4 (CODING_VALIDATION) gives at most 25 points for complex modifier scenarios, yielding 25% max confidence. Most claims get 10-15 points for basic modifier presence, yielding 10-15% confidence. The 18% average confirms this pattern.

2. **PREVENTABLE root causes** (ELIGIBILITY_LAPSE + AUTH_MISSING + AUTH_EXPIRED + TIMELY_FILING_MISS) account for 26,725 denials and $96.9M -- 47.2% of total financial impact. These have relatively higher confidence (24-30%) because their detection steps have clearer binary signals (eligibility active/inactive, auth approved/denied).

3. **PAYER group** (PAYER_BEHAVIOR_SHIFT + CONTRACT_RATE_GAP) is underrepresented at only 763 records. This is likely because Step 5 (PAYER_HISTORY_MATCH) requires >50 similar denials from the same payer in 90 days to trigger, which is a high threshold that filters out most payer-specific patterns.

4. **8 empty categories** represent a significant classification blind spot. Denials that should be MEDICAL_NECESSITY, DUPLICATE_CLAIM, or CONTRACT_RATE_GAP are likely being misclassified as CODING_MISMATCH or PROCESS_BREAKDOWN due to the fallback mechanism.

---

*Report generated by SpecKit deep analysis engine*
