# NEXUS RCM Platform - Manual Test Cases

| Field | Detail |
|-------|--------|
| **Platform** | NEXUS RCM v3.0.0 |
| **Date** | March 27, 2026 |
| **Total Test Cases** | 127 |
| **Categories** | 12 |
| **Base URL** | `http://localhost:5173` |
| **API Base URL** | `http://localhost:8000` |

---

## Table of Contents

1. [Navigation & Routing](#category-1-navigation--routing)
2. [Command Center](#category-2-command-center)
3. [Revenue Analytics](#category-3-revenue-analytics)
4. [Denial Analytics](#category-4-denial-analytics)
5. [Payment Intelligence](#category-5-payment-intelligence)
6. [Claims Pipeline](#category-6-claims-pipeline)
7. [Work Centers](#category-7-work-centers)
8. [Claim Detail Page](#category-8-claim-detail-page)
9. [Intelligence](#category-9-intelligence)
10. [AI & Backend](#category-10-ai--backend)
11. [Data Consistency](#category-11-data-consistency)
12. [Cross-Page Navigation](#category-12-cross-page-navigation)

---

## CATEGORY 1: Navigation & Routing

### TC-001: Command Center sidebar navigation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-001 |
| **Category** | Navigation & Routing |
| **Test Name** | Command Center sidebar link navigates to root page |
| **Preconditions** | Application is loaded at any page |
| **Steps** | 1. Click "Command Center" in the sidebar (icon: hub) |
| **Expected Result** | Browser URL changes to `/`. CommandCenter component renders with Executive Pulse KPIs. Sidebar link shows active state (primary highlight). |
| **Priority** | P0 |
| **Data Validation** | URL is exactly `/` with no trailing path segments. |

### TC-002: Revenue Analytics sidebar navigation with default redirect

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-002 |
| **Category** | Navigation & Routing |
| **Test Name** | Revenue Analytics link redirects to Overview tab |
| **Preconditions** | Application is loaded |
| **Steps** | 1. Click "Revenue Analytics" in the sidebar |
| **Expected Result** | URL changes to `/analytics/revenue/overview`. The RevenueAnalyticsLayout renders with the Overview tab active. ExecutiveDashboard component is visible. |
| **Priority** | P0 |
| **Data Validation** | URL must be `/analytics/revenue/overview` (not `/analytics/revenue`). The redirect from index to `overview` fires. |

### TC-003: Denial Analytics sidebar navigation with default redirect

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-003 |
| **Category** | Navigation & Routing |
| **Test Name** | Denial Analytics link redirects to Overview tab |
| **Preconditions** | Application is loaded |
| **Steps** | 1. Click "Denial Analytics" in the sidebar |
| **Expected Result** | URL changes to `/analytics/denials/overview`. DenialAnalyticsLayout renders with Overview tab active. |
| **Priority** | P0 |
| **Data Validation** | URL must be `/analytics/denials/overview`. |

### TC-004: Payment Intelligence sidebar navigation with default redirect

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-004 |
| **Category** | Navigation & Routing |
| **Test Name** | Payment Intelligence link redirects to Overview tab |
| **Preconditions** | Application is loaded |
| **Steps** | 1. Click "Payment Intelligence" in the sidebar |
| **Expected Result** | URL changes to `/analytics/payments/overview`. PaymentIntelligenceLayout renders with Overview tab active. |
| **Priority** | P0 |
| **Data Validation** | URL must be `/analytics/payments/overview`. |

### TC-005: All tabbed layout tabs navigate correctly

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-005 |
| **Category** | Navigation & Routing |
| **Test Name** | Revenue Analytics tab switching (Overview, Reconciliation, AR Aging, Cash Flow) |
| **Preconditions** | Navigate to `/analytics/revenue` |
| **Steps** | 1. Click Overview tab -- verify URL is `/analytics/revenue/overview` 2. Click Reconciliation tab -- verify URL is `/analytics/revenue/reconciliation` 3. Click AR Aging tab -- verify URL is `/analytics/revenue/ar-aging` 4. Click Cash Flow tab -- verify URL is `/analytics/revenue/cash-flow` |
| **Expected Result** | Each tab click changes the URL and renders the correct child component without full page reload. Active tab is visually highlighted. |
| **Priority** | P0 |
| **Data Validation** | No 404 or blank content on any tab. Each tab loads its respective component. |

### TC-006: Denial Analytics tab switching

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-006 |
| **Category** | Navigation & Routing |
| **Test Name** | Denial Analytics tabs (Overview, Root Cause, Payer Patterns) |
| **Preconditions** | Navigate to `/analytics/denials` |
| **Steps** | 1. Click Overview tab -- verify URL ends with `/overview` 2. Click Root Cause tab -- verify URL ends with `/root-cause` 3. Click Payer Patterns tab -- verify URL ends with `/payer-patterns` |
| **Expected Result** | Each tab loads its component. DenialAnalytics, RootCauseIntelligence, and PayerVariance render respectively. |
| **Priority** | P0 |
| **Data Validation** | Tab URLs match route definitions in App.jsx. |

### TC-007: Deep link direct URL entry

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-007 |
| **Category** | Navigation & Routing |
| **Test Name** | Direct URL entry loads correct page |
| **Preconditions** | Browser is open with no prior navigation |
| **Steps** | 1. Enter `http://localhost:5173/analytics/denials/root-cause` directly in the address bar 2. Press Enter |
| **Expected Result** | Application loads with sidebar visible, "Denial Analytics" highlighted, Root Cause tab active, and RootCauseIntelligence component rendered. |
| **Priority** | P1 |
| **Data Validation** | Page does not redirect to `/` or show a 404. Layout wrapper renders correctly around the content. |

### TC-008: Legacy route redirects

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-008 |
| **Category** | Navigation & Routing |
| **Test Name** | Legacy URLs redirect to new locations |
| **Preconditions** | Application is loaded |
| **Steps** | 1. Navigate to `/command-center` -- expect redirect to `/` 2. Navigate to `/executive-dashboard` -- expect redirect to `/analytics/revenue` 3. Navigate to `/denials` -- expect redirect to `/work/denials/queue` 4. Navigate to `/claims` -- expect redirect to `/analytics/claims` 5. Navigate to `/payments/dashboard` -- expect redirect to `/analytics/payments` |
| **Expected Result** | Each legacy URL performs a `replace` redirect to the correct new location. Browser history does not accumulate redirect entries. |
| **Priority** | P1 |
| **Data Validation** | Final URL matches the target defined in App.jsx Navigate elements. |

### TC-009: Browser back/forward navigation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-009 |
| **Category** | Navigation & Routing |
| **Test Name** | Browser back and forward buttons preserve navigation state |
| **Preconditions** | Application is loaded at `/` |
| **Steps** | 1. Click "Revenue Analytics" in sidebar 2. Click "Denial Analytics" in sidebar 3. Click browser Back button 4. Verify page shows Revenue Analytics 5. Click browser Forward button 6. Verify page shows Denial Analytics |
| **Expected Result** | Back/forward navigation correctly restores each page with proper sidebar highlighting and tab state. No blank screens or errors. |
| **Priority** | P1 |
| **Data Validation** | URL changes correctly on each back/forward action. Sidebar active state matches current route. |

### TC-010: Catch-all route redirects unknown paths to root

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-010 |
| **Category** | Navigation & Routing |
| **Test Name** | Unknown URL redirects to Command Center |
| **Preconditions** | Application is loaded |
| **Steps** | 1. Navigate to `/nonexistent/page/that/doesnt/exist` |
| **Expected Result** | Application redirects to `/` and shows Command Center. No error page or blank screen. |
| **Priority** | P2 |
| **Data Validation** | URL becomes `/` after redirect. |

---

## CATEGORY 2: Command Center

### TC-011: Executive Pulse KPIs display real data

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-011 |
| **Category** | Command Center |
| **Test Name** | All 8 Executive Pulse KPIs render with real data from API |
| **Preconditions** | Backend running at `localhost:8000`. Navigate to `/` |
| **Steps** | 1. Load Command Center page 2. Verify all 8 KPI cards are visible: Pipeline Value, Clean Claim Rate, Denial Rate, Days in AR, First Pass Rate, Net Collection Rate, Revenue at Risk, System Health 3. Verify each KPI shows a numeric value (not "Loading..." or "N/A") |
| **Expected Result** | All 8 KPI cards render with real numeric values. No spinner remains indefinitely. Values are formatted appropriately (currency with $, percentages with %, days as integer). |
| **Priority** | P0 |
| **Data Validation** | Compare displayed Pipeline Value against `curl http://localhost:8000/api/v1/analytics/pipeline` response. Values must match. |

### TC-012: KPI values match backend API

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-012 |
| **Category** | Command Center |
| **Test Name** | KPI values are consistent with API response |
| **Preconditions** | Backend running. Command Center loaded. |
| **Steps** | 1. Open browser DevTools Network tab 2. Reload Command Center 3. Find the API calls for KPI data 4. Compare each KPI displayed value against the API response body |
| **Expected Result** | Displayed values exactly match the API response. No hardcoded fallback values are shown when API is available. |
| **Priority** | P0 |
| **Data Validation** | Pipeline Value, Denial Rate, Days in AR, Clean Claim Rate, First Pass Rate, Net Collection Rate, Revenue at Risk values match API JSON. |

### TC-013: KPI trend values are computed dynamically

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-013 |
| **Category** | Command Center |
| **Test Name** | KPI trend indicators show computed values, not hardcoded |
| **Preconditions** | Backend running. Command Center loaded. |
| **Steps** | 1. Note the trend values shown (e.g., "+3.6%", "-2.1%") 2. Check API response for trend/delta fields 3. Verify the trend value on screen matches the API delta 4. If possible, change underlying data and reload to confirm trend changes |
| **Expected Result** | Trend percentages reflect actual computed differences from the API, not static strings. Positive trends show green up arrow, negative trends show red down arrow. |
| **Priority** | P1 |
| **Data Validation** | Trend values must come from API fields like `trend`, `delta`, or `change_pct`. Inspect network response to verify. |

### TC-014: Forecast mini strip shows Prophet projection

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-014 |
| **Category** | Command Center |
| **Test Name** | Revenue forecast mini strip renders Prophet model projection |
| **Preconditions** | Backend running with Prophet model available. Navigate to `/` |
| **Steps** | 1. Locate the forecast mini strip section on Command Center 2. Verify it shows projected revenue values 3. Verify it references a time horizon (e.g., "Next 4 weeks") |
| **Expected Result** | Forecast strip shows projected values from the Prophet model. Values are not hardcoded. Strip includes visual indicators (chart or sparkline). |
| **Priority** | P1 |
| **Data Validation** | Compare displayed forecast against `GET /api/v1/analytics/forecast` response. Week-by-week projections should match. |

### TC-015: Collections count badge shows real task count

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-015 |
| **Category** | Command Center |
| **Test Name** | Collections task count badge reflects actual queue size |
| **Preconditions** | Backend running. Navigate to `/` |
| **Steps** | 1. Observe the collections-related badge or count on Command Center 2. Navigate to `/work/collections/queue` 3. Count the number of tasks in the collections queue 4. Compare with Command Center badge |
| **Expected Result** | Badge count matches the actual number of open collection tasks. |
| **Priority** | P2 |
| **Data Validation** | Badge number equals the count of records returned by the collections queue API endpoint. |

### TC-016: Prevention alert banner displays when alerts exist

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-016 |
| **Category** | Command Center |
| **Test Name** | Prevention alert banner appears when prevention scan finds issues |
| **Preconditions** | Backend running with prevention scan data. Navigate to `/` |
| **Steps** | 1. Verify the prevention alert banner is visible on Command Center 2. Verify it shows the number of active alerts and revenue at risk 3. Click the banner to verify it navigates to prevention details |
| **Expected Result** | Alert banner shows with real alert count and revenue-at-risk figure. Clicking navigates to the prevention dashboard or detail view. |
| **Priority** | P1 |
| **Data Validation** | Alert count and revenue at risk match `GET /api/v1/prevention/scan` response. |

### TC-017: AI Intelligence cards load from Ollama

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-017 |
| **Category** | Command Center |
| **Test Name** | AI insight cards show live Ollama-generated content with LIVE badge |
| **Preconditions** | Ollama running locally. Backend running. Navigate to `/` |
| **Steps** | 1. Locate AI Intelligence cards on Command Center 2. Verify a "LIVE" badge appears on the cards 3. Verify the text content reads as a generated narrative (not placeholder) 4. Check browser DevTools for the AI API call and confirm response from Ollama |
| **Expected Result** | AI cards display real-time generated insights with a visible LIVE badge. Content is contextual and references actual data values. |
| **Priority** | P1 |
| **Data Validation** | Network tab shows successful call to `/api/v1/ai/insight` or similar endpoint. Response status is 200. |

### TC-018: Investigation panel opens on KPI click

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-018 |
| **Category** | Command Center |
| **Test Name** | Clicking a KPI card opens the investigation drill-down panel |
| **Preconditions** | Command Center loaded with KPI data |
| **Steps** | 1. Click on the "Revenue at Risk" KPI card 2. Verify an investigation panel or drawer opens 3. Verify the panel shows detailed breakdown related to Revenue at Risk |
| **Expected Result** | A side panel or modal opens with drill-down data. The panel header references the clicked KPI. Drill-down data loads from API. |
| **Priority** | P1 |
| **Data Validation** | Panel shows breakdown data that sums to the KPI total displayed on the card. |

### TC-019: Investigation panel drill-down levels

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-019 |
| **Category** | Command Center |
| **Test Name** | Investigation panel supports multi-level drill-down (Revenue > Payer > Category > Claims) |
| **Preconditions** | Investigation panel is open from TC-018 |
| **Steps** | 1. In the investigation panel, click on a payer row to drill into payer-level data 2. Click on a denial category to drill into category-level data 3. Click on a specific claim to see claim-level details 4. Verify breadcrumb trail shows the drill-down path |
| **Expected Result** | Each drill-down level loads new data from the API. Breadcrumb or back navigation allows returning to previous levels. Claim-level detail shows the individual claim record. |
| **Priority** | P1 |
| **Data Validation** | Data at each level is a subset of the parent level. Payer totals sum to the overall KPI value. API calls fire for each drill-down level. |

### TC-020: Simulate button navigates to Simulation Dashboard

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-020 |
| **Category** | Command Center |
| **Test Name** | Simulate button on Command Center navigates to Simulation Engine |
| **Preconditions** | Command Center loaded |
| **Steps** | 1. Locate the "Simulate" button on the Command Center 2. Click it |
| **Expected Result** | Browser navigates to `/intelligence/simulation`. SimulationDashboard component renders. |
| **Priority** | P2 |
| **Data Validation** | URL is `/intelligence/simulation`. |

---

## CATEGORY 3: Revenue Analytics

### TC-021: Overview tab KPIs show real numbers

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-021 |
| **Category** | Revenue Analytics - Overview |
| **Test Name** | Revenue overview KPIs display real data from API |
| **Preconditions** | Backend running. Navigate to `/analytics/revenue/overview` |
| **Steps** | 1. Verify all KPI cards on the overview page show numeric values 2. Check that values are formatted (currency, percentage) 3. Open DevTools and verify API calls succeed (200 status) |
| **Expected Result** | KPIs render with real data. No "N/A" or "undefined" values. |
| **Priority** | P0 |
| **Data Validation** | KPI values match the response from the revenue analytics API endpoint. |

### TC-022: Revenue trend chart renders

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-022 |
| **Category** | Revenue Analytics - Overview |
| **Test Name** | Revenue trend chart displays with data points |
| **Preconditions** | Navigate to `/analytics/revenue/overview` |
| **Steps** | 1. Locate the revenue trend chart 2. Verify the chart has rendered (not a blank canvas) 3. Hover over data points to see tooltips with values 4. Verify X-axis shows date range and Y-axis shows dollar amounts |
| **Expected Result** | Chart renders with actual data points. Tooltips show real values. Axes are labeled correctly. |
| **Priority** | P1 |
| **Data Validation** | Data points correspond to API response values for the selected time range. |

### TC-023: AI insights load on Overview tab

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-023 |
| **Category** | Revenue Analytics - Overview |
| **Test Name** | AI insight section loads Ollama-generated analysis |
| **Preconditions** | Ollama running. Navigate to `/analytics/revenue/overview` |
| **Steps** | 1. Locate the AI insights section 2. Verify text content is generated (not placeholder) 3. Verify content references real revenue metrics |
| **Expected Result** | AI insight card shows a coherent narrative about revenue performance with specific numbers from the data. |
| **Priority** | P2 |
| **Data Validation** | AI insight API call returns 200. Generated text references values consistent with the displayed KPIs. |

### TC-024: Reconciliation tab payer table shows real data

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-024 |
| **Category** | Revenue Analytics - Reconciliation |
| **Test Name** | Payer reconciliation table displays real payers with ERA and Bank amounts |
| **Preconditions** | Navigate to `/analytics/revenue/reconciliation` |
| **Steps** | 1. Verify the payer reconciliation table loads 2. Check that table has rows with payer names 3. Verify each row shows ERA Amount, Bank Amount, and Gap/Variance 4. Verify totals row at bottom if present |
| **Expected Result** | Table shows real payer data with correctly formatted dollar amounts. ERA and Bank columns are populated. Gap calculation is correct (ERA - Bank). |
| **Priority** | P0 |
| **Data Validation** | Payer names match the master payer list. ERA and Bank amounts match the reconciliation API response. Gap = ERA Amount - Bank Amount for each row. |

### TC-025: Reconciliation payer click navigates to payer claims

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-025 |
| **Category** | Revenue Analytics - Reconciliation |
| **Test Name** | Clicking a payer row navigates to payer-specific claims list |
| **Preconditions** | Reconciliation tab loaded with payer data |
| **Steps** | 1. Click on a payer row in the reconciliation table 2. Verify navigation occurs to `/analytics/revenue/reconciliation/payer-claims` 3. Verify the payer claims page loads with claims for the selected payer |
| **Expected Result** | URL changes to payer claims page. Page shows a filtered list of claims for the selected payer with payment amounts, dates, and statuses. |
| **Priority** | P1 |
| **Data Validation** | All claims shown belong to the clicked payer. Claim payment amounts are realistic dollar values. |

### TC-026: Payer claims list shows paid claims with amounts

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-026 |
| **Category** | Revenue Analytics - Reconciliation |
| **Test Name** | Payer claims page shows actual paid claims with payment details |
| **Preconditions** | Navigate to payer claims page via TC-025 |
| **Steps** | 1. Verify claims table loads with columns: Claim ID, Patient, CPT, Billed Amount, Paid Amount, Date 2. Verify each claim has a valid claim ID format 3. Verify payment amounts are populated |
| **Expected Result** | Claims list shows real claims with all columns populated. No empty rows or placeholder data. |
| **Priority** | P1 |
| **Data Validation** | Sum of paid amounts for the payer should approximate the ERA amount shown on the reconciliation table. |

### TC-027: AR Aging buckets show real counts and amounts

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-027 |
| **Category** | Revenue Analytics - AR Aging |
| **Test Name** | AR aging buckets display real claim counts and dollar amounts |
| **Preconditions** | Navigate to `/analytics/revenue/ar-aging` |
| **Steps** | 1. Verify aging buckets are displayed (0-30, 31-60, 61-90, 91-120, 120+ days) 2. Verify each bucket shows claim count and total dollar amount 3. Verify buckets are visually differentiated (color or size) |
| **Expected Result** | All aging buckets render with real counts and amounts. Older buckets should generally show higher risk indicators. Total across all buckets should equal total AR. |
| **Priority** | P0 |
| **Data Validation** | Bucket values match `GET /api/v1/analytics/ar-aging` response. Sum of all bucket amounts equals total AR value. |

### TC-028: AR Aging root cause section

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-028 |
| **Category** | Revenue Analytics - AR Aging |
| **Test Name** | Root cause of aging section shows why claims are aging |
| **Preconditions** | AR Aging page loaded |
| **Steps** | 1. Locate the "Root Cause of Aging" or similar section 2. Verify it shows reasons with bar/chart visualization 3. Verify each reason has a count and/or dollar impact |
| **Expected Result** | Root cause section shows multiple reasons for aging (e.g., pending auth, payer processing, documentation, appeal pending) with quantified impact. |
| **Priority** | P1 |
| **Data Validation** | Root cause counts sum to total aged claims. Dollar impacts are within range of total AR. |

### TC-029: AR Aging root cause click navigates to claims list

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-029 |
| **Category** | Revenue Analytics - AR Aging |
| **Test Name** | Clicking a root cause bar navigates to filtered claims list |
| **Preconditions** | AR Aging page loaded with root cause section |
| **Steps** | 1. Click on a root cause bar (e.g., "Pending Authorization") 2. Verify navigation occurs to a claims list page 3. Verify the claims list is filtered by the selected root cause |
| **Expected Result** | Page navigates to a claims list filtered by the selected root cause. All shown claims share the same aging reason. |
| **Priority** | P1 |
| **Data Validation** | Number of claims in the filtered list matches the count shown on the root cause bar. |

### TC-030: AR Aging prevention alerts

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-030 |
| **Category** | Revenue Analytics - AR Aging |
| **Test Name** | Prevention alerts are shown on AR Aging page |
| **Preconditions** | AR Aging page loaded |
| **Steps** | 1. Locate the prevention alerts section 2. Verify alerts are displayed with severity levels 3. Verify each alert has a description and recommended action |
| **Expected Result** | Prevention alerts section shows actionable alerts related to AR aging trends. |
| **Priority** | P2 |
| **Data Validation** | Alert data comes from API, not hardcoded. |

### TC-031: AR Aging AI insights load

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-031 |
| **Category** | Revenue Analytics - AR Aging |
| **Test Name** | AI insight section loads on AR Aging page |
| **Preconditions** | Ollama running. AR Aging page loaded. |
| **Steps** | 1. Locate AI insights section 2. Verify it shows generated analysis text 3. Verify content references AR aging metrics |
| **Expected Result** | AI insight renders with contextual analysis of AR aging data. |
| **Priority** | P2 |
| **Data Validation** | AI API call succeeds (200 status). |

### TC-032: Cash Flow ERA vs Bank comparison

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-032 |
| **Category** | Revenue Analytics - Cash Flow |
| **Test Name** | ERA vs Bank comparison shows real financial data |
| **Preconditions** | Navigate to `/analytics/revenue/cash-flow` |
| **Steps** | 1. Verify ERA amount and Bank amount are displayed 2. Verify the variance/gap is calculated 3. Verify trend chart shows historical ERA vs Bank |
| **Expected Result** | ERA and Bank amounts are real values from the API. Gap is correctly calculated. Chart shows meaningful historical data. |
| **Priority** | P0 |
| **Data Validation** | ERA and Bank totals match the reconciliation API. Gap = ERA - Bank. |

### TC-033: Cash Flow forecast section

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-033 |
| **Category** | Revenue Analytics - Cash Flow |
| **Test Name** | Forecast section shows Prophet model projections |
| **Preconditions** | Cash Flow page loaded |
| **Steps** | 1. Locate the forecast section 2. Verify it shows projected cash flow values 3. Verify projections include confidence intervals if available |
| **Expected Result** | Forecast section displays Prophet model output with future-dated projections. Values are formatted as currency. |
| **Priority** | P1 |
| **Data Validation** | Forecast values match `GET /api/v1/analytics/forecast` response. |

### TC-034: Cash Flow payer breakdown table

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-034 |
| **Category** | Revenue Analytics - Cash Flow |
| **Test Name** | Payer breakdown table shows real payer cash flow data |
| **Preconditions** | Cash Flow page loaded |
| **Steps** | 1. Locate payer breakdown table 2. Verify it shows payer names with associated amounts 3. Verify sorting works (by amount, by payer name) |
| **Expected Result** | Table shows real payer data with cash flow amounts. Payer names are consistent with those in reconciliation. |
| **Priority** | P1 |
| **Data Validation** | Payer names match the master payer list. Amounts are derived from API data. |

### TC-035: Revenue Analytics overview KPIs cross-check

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-035 |
| **Category** | Revenue Analytics - Overview |
| **Test Name** | Revenue KPIs are internally consistent |
| **Preconditions** | Navigate to `/analytics/revenue/overview` |
| **Steps** | 1. Note total revenue value 2. Note collection rate percentage 3. Calculate expected collections = revenue x collection rate 4. Compare with displayed collections figure |
| **Expected Result** | KPI values are mathematically consistent with each other. No contradictions between related metrics. |
| **Priority** | P1 |
| **Data Validation** | Net Collection Rate x Gross Revenue should approximate Net Collections. |

---

## CATEGORY 4: Denial Analytics

### TC-036: AI Executive Summary shows Ollama narrative

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-036 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | AI executive summary displays Ollama-generated narrative with real numbers |
| **Preconditions** | Ollama running. Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate AI executive summary section 2. Verify it contains generated text (not placeholder) 3. Verify the narrative references actual denial metrics (counts, rates, dollar values) |
| **Expected Result** | Executive summary is a coherent paragraph generated by Ollama that references real denial data visible on the page. |
| **Priority** | P1 |
| **Data Validation** | Numbers cited in the summary should match the KPI values displayed on the same page. |

### TC-037: Total denials count is accurate

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-037 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Total denials KPI shows correct count |
| **Preconditions** | Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate "Total Denials" KPI 2. Note the displayed value 3. Compare against API response |
| **Expected Result** | Total denials value matches the API response. Value is formatted with comma separators for readability. |
| **Priority** | P0 |
| **Data Validation** | Displayed value matches `GET /api/v1/analytics/denials` total_denials field. Expected approximate value: 56,426. |

### TC-038: Revenue at risk displays correctly

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-038 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Revenue at risk KPI shows dollar amount from denied claims |
| **Preconditions** | Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate "Revenue at Risk" KPI 2. Verify it shows a dollar amount 3. Compare against API |
| **Expected Result** | Revenue at risk is displayed as a formatted currency value. Expected approximate value: ~$205M. |
| **Priority** | P0 |
| **Data Validation** | Value matches API response for revenue_at_risk field. |

### TC-039: Preventable percentage accuracy

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-039 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Preventable denial percentage is derived from root cause data |
| **Preconditions** | Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate "Preventable %" KPI 2. Verify the percentage is shown 3. Cross-reference with root cause data to verify preventable categories |
| **Expected Result** | Preventable percentage is approximately 37% (derived from root cause analysis). Value is computed, not hardcoded. |
| **Priority** | P1 |
| **Data Validation** | Preventable % = (preventable denial count / total denial count) x 100. Should be ~37%. |

### TC-040: Category breakdown shows 6 denial categories

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-040 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Denial category breakdown displays all 6 categories |
| **Preconditions** | Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate category breakdown section (chart or table) 2. Verify 6 categories are present: CODING, ELIGIBILITY, AUTH, TIMELY_FILING, NON_COVERED, COB 3. Verify each category has a count and dollar amount |
| **Expected Result** | All 6 categories are displayed with counts and financial impact. Counts sum to total denials. |
| **Priority** | P0 |
| **Data Validation** | Sum of category counts = total denials. Category names match the expected list. |

### TC-041: Root cause section shows 7 categories with financial impact

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-041 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Root cause analysis displays 7 root cause categories |
| **Preconditions** | Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate root cause distribution section 2. Verify it shows root cause categories with financial impact 3. Verify confidence scores are displayed 4. Verify each root cause has a claim count |
| **Expected Result** | Root cause section shows 7 categories (e.g., coder error, payer policy, documentation gap, billing rule, bad faith, process failure, system error) with dollar impact and confidence. |
| **Priority** | P0 |
| **Data Validation** | Root cause data matches `GET /api/v1/analytics/root-cause` response. Average confidence > 60%. |

### TC-042: Heatmap shows payer-by-category matrix

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-042 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Denial heatmap renders real payer x category data |
| **Preconditions** | Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate the payer x category heatmap 2. Verify it shows payer names on one axis and denial categories on the other 3. Verify cells are color-coded by intensity/count 4. Hover over cells to see tooltips with exact values |
| **Expected Result** | Heatmap renders with real data. Color intensity corresponds to denial volume. Tooltips show exact counts and dollar amounts. |
| **Priority** | P1 |
| **Data Validation** | Cell values match the intersection of payer and category from the API data. |

### TC-043: Appeal win rates show real percentages

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-043 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Appeal win rate metrics display actual percentages |
| **Preconditions** | Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate appeal win rates section 2. Verify percentages are shown for different categories or payers 3. Verify rates are between 0% and 100% |
| **Expected Result** | Appeal win rates show real percentages derived from appeal outcome data. Rates vary by category (not all the same value). |
| **Priority** | P1 |
| **Data Validation** | Win rate = (successful appeals / total appeals) x 100 for each category. Values from API. |

### TC-044: Diagnostic findings section shows alerts

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-044 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Diagnostic findings section displays actionable alerts |
| **Preconditions** | Navigate to `/analytics/denials/overview` |
| **Steps** | 1. Locate diagnostic findings section 2. Verify alerts/findings are listed 3. Verify each finding has severity and description |
| **Expected Result** | Diagnostic findings show real alerts from the diagnostic engine. Each alert identifies a specific issue with recommended action. |
| **Priority** | P2 |
| **Data Validation** | Findings match API diagnostic endpoint response. |

### TC-045: Category/root cause items are clickable to claims list

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-045 |
| **Category** | Denial Analytics - Overview |
| **Test Name** | Clicking a denial category or root cause navigates to filtered claims |
| **Preconditions** | Denial Analytics Overview loaded |
| **Steps** | 1. Click on the "CODING" category bar/card 2. Verify navigation to a claims list page 3. Verify the claims list is filtered to show only CODING denials 4. Navigate back and click on a root cause item 5. Verify navigation to claims filtered by that root cause |
| **Expected Result** | Each category and root cause is clickable and navigates to a filtered claims list. Claims shown match the selected filter. |
| **Priority** | P1 |
| **Data Validation** | Count of claims in the filtered list matches the count shown on the category/root cause visualization. |

### TC-046: Root Cause tab KPIs

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-046 |
| **Category** | Denial Analytics - Root Cause |
| **Test Name** | Root Cause tab shows correct KPIs (Total Analyzed, Top Root Cause, Preventable %, Avg Confidence) |
| **Preconditions** | Navigate to `/analytics/denials/root-cause` |
| **Steps** | 1. Verify KPI cards: Total Analyzed, Top Root Cause, Preventable %, Avg Confidence 2. Verify each has a value (not loading or empty) 3. Verify Top Root Cause shows a category name 4. Verify Avg Confidence is a percentage |
| **Expected Result** | All 4 KPIs render with real values. Top Root Cause is a descriptive label. Avg Confidence is between 0-100%. |
| **Priority** | P0 |
| **Data Validation** | Total Analyzed matches the denial count processed by root cause engine. Avg Confidence > 60%. |

### TC-047: Root Cause distribution bars with labels and financial impact

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-047 |
| **Category** | Denial Analytics - Root Cause |
| **Test Name** | Root cause distribution shows bars with labels, counts, and dollar impact |
| **Preconditions** | Navigate to `/analytics/denials/root-cause` |
| **Steps** | 1. Verify distribution bars are rendered 2. Each bar shows: root cause label, claim count, dollar impact 3. Bars are sorted by impact or count |
| **Expected Result** | Distribution visualization shows all root causes with quantified impact. Bars are proportional to values. |
| **Priority** | P0 |
| **Data Validation** | Sum of root cause counts should equal total analyzed. Dollar impacts sum to total revenue at risk from root-cause-categorized denials. |

### TC-048: Root Cause bars are clickable to claims list

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-048 |
| **Category** | Denial Analytics - Root Cause |
| **Test Name** | Each root cause bar navigates to filtered claims on click |
| **Preconditions** | Root Cause tab loaded |
| **Steps** | 1. Click on the largest root cause bar 2. Verify navigation to `/analytics/denials/root-cause/claims` or similar 3. Verify claims are filtered by the selected root cause |
| **Expected Result** | Navigation occurs to RootCauseClaimsPage. Claims list is filtered by the selected root cause category. |
| **Priority** | P1 |
| **Data Validation** | Claim count in filtered list matches the bar count. |

### TC-049: Root Cause AI insights load

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-049 |
| **Category** | Denial Analytics - Root Cause |
| **Test Name** | AI insights section loads on Root Cause tab |
| **Preconditions** | Ollama running. Root Cause tab loaded. |
| **Steps** | 1. Locate AI insights section 2. Verify generated content appears 3. Verify content references root cause data |
| **Expected Result** | AI insight provides analysis of root cause patterns with specific data references. |
| **Priority** | P2 |
| **Data Validation** | AI API call returns 200. |

### TC-050: Payer Patterns tab loads variance data

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-050 |
| **Category** | Denial Analytics - Payer Patterns |
| **Test Name** | Payer variance data loads from API on Payer Patterns tab |
| **Preconditions** | Navigate to `/analytics/denials/payer-patterns` |
| **Steps** | 1. Verify PayerVariance component renders 2. Verify payer data is loaded (not empty state) 3. Verify variance metrics are displayed per payer |
| **Expected Result** | Payer variance page shows payer-specific denial patterns with variance metrics. Data is loaded from API. |
| **Priority** | P1 |
| **Data Validation** | Payer names match the master payer list. Variance values are computed from API data. |

---

## CATEGORY 5: Payment Intelligence

### TC-051: Total ERA Received KPI

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-051 |
| **Category** | Payment Intelligence - Overview |
| **Test Name** | Total ERA Received shows correct aggregate amount |
| **Preconditions** | Navigate to `/analytics/payments/overview` |
| **Steps** | 1. Locate "Total ERA Received" KPI 2. Verify it shows a dollar amount 3. Compare against API response |
| **Expected Result** | Total ERA Received is displayed as formatted currency. Expected approximate value: ~$946M. |
| **Priority** | P0 |
| **Data Validation** | Value matches payment analytics API response. |

### TC-052: Payer ranking table with 50 payers

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-052 |
| **Category** | Payment Intelligence - Overview |
| **Test Name** | Payer ranking table displays up to 50 payers |
| **Preconditions** | Navigate to `/analytics/payments/overview` |
| **Steps** | 1. Locate payer ranking table 2. Count the number of payer rows 3. Verify each row has payer name, ERA amount, and ranking position 4. Verify table can be scrolled or paginated if > 50 rows |
| **Expected Result** | Table shows up to 50 payers ranked by payment volume. Each row has complete data. |
| **Priority** | P1 |
| **Data Validation** | Payer count is approximately 50. ERA amounts are sorted in descending order. |

### TC-053: ADTP by payer section

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-053 |
| **Category** | Payment Intelligence - Overview |
| **Test Name** | Average Days to Pay (ADTP) section shows payer payment timing |
| **Preconditions** | Navigate to `/analytics/payments/overview` |
| **Steps** | 1. Locate ADTP section 2. Verify it shows days-to-pay values by payer 3. Verify values are reasonable (1-180 days range) |
| **Expected Result** | ADTP section shows how long each payer takes to pay, with values in days. |
| **Priority** | P1 |
| **Data Validation** | ADTP values match API response. Values are within realistic range for healthcare payments. |

### TC-054: Payer Profiles list all payers

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-054 |
| **Category** | Payment Intelligence - Payer Profiles |
| **Test Name** | Payer profiles page lists all payers with ERA, Bank, and Gap |
| **Preconditions** | Navigate to `/analytics/payments/payer-profiles` |
| **Steps** | 1. Verify payer list loads 2. Each payer shows ERA amount, Bank amount, and Gap 3. Verify Gap calculation is correct (ERA - Bank) |
| **Expected Result** | All payers are listed with complete financial data. Gap values are correctly calculated. |
| **Priority** | P0 |
| **Data Validation** | Gap = ERA - Bank for each payer. Values match API response. |

### TC-055: Payer profile detail on click

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-055 |
| **Category** | Payment Intelligence - Payer Profiles |
| **Test Name** | Clicking a payer shows detailed payment profile |
| **Preconditions** | Payer Profiles page loaded |
| **Steps** | 1. Click on a specific payer in the list 2. Verify a detail view opens or navigates 3. Verify detail shows payment history, ADTP, denial rate, and contract performance |
| **Expected Result** | Payer detail view shows comprehensive payment intelligence for the selected payer. |
| **Priority** | P1 |
| **Data Validation** | Detail data matches aggregate values from the list view. |

### TC-056: Contract Audit underpaid claims count

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-056 |
| **Category** | Payment Intelligence - Contract Audit |
| **Test Name** | Underpaid claims count and total amount displayed |
| **Preconditions** | Navigate to `/analytics/payments/contract-audit` |
| **Steps** | 1. Verify underpaid claims KPI shows count > 0 2. Verify total underpayment amount is shown 3. Compare against API response |
| **Expected Result** | Underpaid count is approximately 422. Total underpayment amount is approximately $2.6M. Values are from real data. |
| **Priority** | P0 |
| **Data Validation** | Count and amount match contract audit API endpoint. Expected: ~422 claims at ~$2.6M. |

### TC-057: Underpayment table shows real claims

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-057 |
| **Category** | Payment Intelligence - Contract Audit |
| **Test Name** | Underpayment table lists actual underpaid claims |
| **Preconditions** | Contract Audit page loaded |
| **Steps** | 1. Verify underpayment table has rows 2. Each row shows: Claim ID, Payer, Expected Amount, Paid Amount, Variance 3. Verify Variance = Expected - Paid for each row |
| **Expected Result** | Table shows real underpaid claims with correct variance calculations. |
| **Priority** | P1 |
| **Data Validation** | Variance = Expected - Paid for each row. Sum of variances approximates total underpayment KPI. |

### TC-058: ERA-Bank Recon amounts match API

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-058 |
| **Category** | Payment Intelligence - ERA-Bank Recon |
| **Test Name** | ERA vs Bank reconciliation amounts match API response |
| **Preconditions** | Navigate to `/analytics/payments/era-bank-recon` |
| **Steps** | 1. Verify ERA total and Bank total are displayed 2. Verify the reconciliation gap is shown 3. Compare all values against the ERA-Bank recon API endpoint |
| **Expected Result** | ERA and Bank totals are correctly displayed. Reconciliation identifies matched and unmatched amounts. |
| **Priority** | P0 |
| **Data Validation** | Values match API response. Gap = ERA Total - Bank Total. |

### TC-059: Float analysis shows payer float days

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-059 |
| **Category** | Payment Intelligence - ERA-Bank Recon |
| **Test Name** | Float analysis section displays real payer float days |
| **Preconditions** | ERA-Bank Recon page loaded |
| **Steps** | 1. Locate float analysis section 2. Verify it shows payer names with float days (gap between ERA date and bank deposit date) 3. Verify float days are in a realistic range (0-30 days) |
| **Expected Result** | Float analysis shows how long each payer's payments take to deposit after ERA notification. |
| **Priority** | P2 |
| **Data Validation** | Float days match API data. Average float should be within industry norms (3-14 days). |

### TC-060: Payment Intelligence tab navigation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-060 |
| **Category** | Payment Intelligence |
| **Test Name** | All 4 Payment Intelligence tabs navigate correctly |
| **Preconditions** | Navigate to `/analytics/payments` |
| **Steps** | 1. Click Overview tab -- verify URL ends with `/overview` 2. Click Payer Profiles tab -- verify URL ends with `/payer-profiles` 3. Click Contract Audit tab -- verify URL ends with `/contract-audit` 4. Click ERA-Bank Recon tab -- verify URL ends with `/era-bank-recon` |
| **Expected Result** | Each tab loads its correct component. No blank screens or errors. |
| **Priority** | P0 |
| **Data Validation** | URLs match route definitions. |

### TC-061: Payment Dashboard payer ERA consistency

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-061 |
| **Category** | Payment Intelligence |
| **Test Name** | Payer ERA amounts are consistent between Overview and Payer Profiles |
| **Preconditions** | Payment Intelligence pages loaded |
| **Steps** | 1. Note ERA amounts per payer on Overview payer ranking table 2. Navigate to Payer Profiles tab 3. Compare ERA amounts for the same payers |
| **Expected Result** | ERA amounts for each payer are identical between Overview ranking and Payer Profiles list. |
| **Priority** | P1 |
| **Data Validation** | Same payer's ERA amount matches across both views. |

### TC-062: Contract Audit sorting and filtering

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-062 |
| **Category** | Payment Intelligence - Contract Audit |
| **Test Name** | Underpayment table supports sorting by variance amount |
| **Preconditions** | Contract Audit page loaded |
| **Steps** | 1. Click on the Variance column header to sort 2. Verify claims reorder by variance amount (highest first) 3. Click again for ascending sort |
| **Expected Result** | Table sorting works correctly. Highest underpayments appear first in descending sort. |
| **Priority** | P2 |
| **Data Validation** | Sorted order is numerically correct. |

---

## CATEGORY 6: Claims Pipeline

### TC-063: 7-stage pipeline shows real counts

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-063 |
| **Category** | Claims Pipeline |
| **Test Name** | Claims pipeline displays 7 stages with real claim counts |
| **Preconditions** | Navigate to `/analytics/claims/overview` |
| **Steps** | 1. Verify pipeline visualization shows 7 stages 2. Each stage has a label and claim count 3. Verify counts are real (not zero or placeholder) 4. Verify the funnel progression makes logical sense (earlier stages >= later stages) |
| **Expected Result** | All 7 pipeline stages render with real claim counts. Visual funnel shows progression from submission to payment. |
| **Priority** | P0 |
| **Data Validation** | Stage counts match `GET /api/v1/analytics/pipeline` response. Total claims across stages should be consistent. |

### TC-064: Claims table shows real claims

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-064 |
| **Category** | Claims Pipeline |
| **Test Name** | Claims table displays actual claim records |
| **Preconditions** | Navigate to `/analytics/claims/overview` |
| **Steps** | 1. Verify claims table loads with rows 2. Each row shows: Claim ID, Patient, Payer, Status, Amount 3. Verify claim IDs follow a consistent format 4. Verify amounts are realistic dollar values |
| **Expected Result** | Claims table shows real claim records with all columns populated. |
| **Priority** | P0 |
| **Data Validation** | Claims are real records from the database. Claim IDs are valid and unique. |

### TC-065: Click claim navigates to claim detail

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-065 |
| **Category** | Claims Pipeline |
| **Test Name** | Clicking a claim row navigates to claim detail page |
| **Preconditions** | Claims table loaded |
| **Steps** | 1. Click on a claim row in the table 2. Verify navigation to claim detail page (e.g., `/denials/claim/:id` or `/analytics/denials/root-cause/claim/:claimId`) 3. Verify the claim detail page loads with the correct claim data |
| **Expected Result** | Navigation occurs to the claim detail page. Claim ID in the URL matches the clicked row. Detail page loads claim data. |
| **Priority** | P0 |
| **Data Validation** | Claim ID in URL matches the row that was clicked. |

### TC-066: CRS scores displayed on claims

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-066 |
| **Category** | Claims Pipeline |
| **Test Name** | Claim Risk Score (CRS) is displayed for each claim |
| **Preconditions** | Claims table loaded |
| **Steps** | 1. Verify CRS score column exists in claims table 2. Verify each claim has a CRS score (0-100 range) 3. Verify scores are color-coded (green for low risk, red for high risk) |
| **Expected Result** | CRS scores are visible for each claim with appropriate color coding indicating risk level. |
| **Priority** | P1 |
| **Data Validation** | CRS scores are between 0 and 100. Scores come from the CRS scoring engine API, not hardcoded. |

### TC-067: Claims Pipeline tab navigation (Overview, Scrub Analytics)

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-067 |
| **Category** | Claims Pipeline |
| **Test Name** | Claims Pipeline tabs navigate between Overview and Scrub Analytics |
| **Preconditions** | Navigate to `/analytics/claims` |
| **Steps** | 1. Verify default redirect to `/analytics/claims/overview` 2. Click Scrub Analytics tab -- verify URL is `/analytics/claims/scrub-analytics` 3. Verify ScrubDashboard component loads 4. Click back to Overview tab |
| **Expected Result** | Both tabs navigate correctly and render their respective components. |
| **Priority** | P1 |
| **Data Validation** | URLs match route definitions. |

---

## CATEGORY 7: Work Centers

### TC-068: Denial Work Center queue loads real denials

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-068 |
| **Category** | Work Centers - Denial |
| **Test Name** | Denial queue loads real denied claims |
| **Preconditions** | Navigate to `/work/denials/queue` |
| **Steps** | 1. Verify DenialManagement component loads 2. Verify denial queue table has rows 3. Each row shows: Claim ID, Payer, Denial Reason, Amount, Date 4. Verify the badge in sidebar ("12") reflects a real count |
| **Expected Result** | Denial queue shows actual denied claims from the database. Queue is actionable with claim details visible. |
| **Priority** | P0 |
| **Data Validation** | Denial records match the denials API endpoint. All claims shown have denial status. |

### TC-069: Denial Work Center root cause and prevention data

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-069 |
| **Category** | Work Centers - Denial |
| **Test Name** | Root cause and prevention data shown for denials in queue |
| **Preconditions** | Denial queue loaded |
| **Steps** | 1. Verify each denial shows root cause classification 2. Verify prevention indicators are displayed where applicable 3. Verify confidence scores are shown |
| **Expected Result** | Each denial in the queue includes its root cause analysis result and any prevention flags. |
| **Priority** | P1 |
| **Data Validation** | Root cause labels match the 7 root cause categories. Confidence is between 0-100%. |

### TC-070: Denial queue click to claim detail

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-070 |
| **Category** | Work Centers - Denial |
| **Test Name** | Clicking a denial navigates to claim detail page |
| **Preconditions** | Denial queue loaded |
| **Steps** | 1. Click on a denial row 2. Verify navigation to claim detail page 3. Verify claim detail shows denial-specific information |
| **Expected Result** | Navigation to claim detail page with denial details, root cause graph, and action options. |
| **Priority** | P0 |
| **Data Validation** | Claim ID matches the clicked row. Denial status is reflected in the detail view. |

### TC-071: Draft Appeal generates via Ollama

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-071 |
| **Category** | Work Centers - Denial |
| **Test Name** | Draft Appeal button generates appeal letter via Ollama |
| **Preconditions** | Ollama running. Navigate to `/work/denials/appeals` or click Draft Appeal from a denial |
| **Steps** | 1. Select a denied claim 2. Click "Draft Appeal" or navigate to Appeals tab 3. Wait for Ollama to generate the appeal letter 4. Verify the generated letter contains: claim details, denial reason, supporting arguments |
| **Expected Result** | Appeal letter is generated by Ollama with claim-specific content. Letter references the actual denial reason code and provides counter-arguments. |
| **Priority** | P1 |
| **Data Validation** | Appeal letter references the correct claim ID, denial reason code, and payer name. Ollama API call succeeds. |

### TC-072: Collections Work Center queue loads

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-072 |
| **Category** | Work Centers - Collections |
| **Test Name** | Collections queue loads real collection tasks |
| **Preconditions** | Navigate to `/work/collections/queue` |
| **Steps** | 1. Verify CollectionsQueue component loads 2. Verify queue has task entries 3. Each task shows: Account, Patient, Balance, Priority, Days Outstanding |
| **Expected Result** | Collections queue shows real accounts requiring follow-up. Tasks are prioritized. |
| **Priority** | P0 |
| **Data Validation** | Task count matches the collections API endpoint. Balances are real dollar values. |

### TC-073: Collections call script generation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-073 |
| **Category** | Work Centers - Collections |
| **Test Name** | Script button generates Ollama call script for collections |
| **Preconditions** | Ollama running. Collections queue loaded. |
| **Steps** | 1. Select a collection task 2. Click "Generate Script" or similar button 3. Wait for Ollama response 4. Verify the generated script contains: patient context, balance details, suggested talking points |
| **Expected Result** | Call script is generated with account-specific details for the collections specialist to use during payer/patient contact. |
| **Priority** | P2 |
| **Data Validation** | Script references correct account balance and patient name. Ollama API call succeeds. |

### TC-074: Collections account detail page

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-074 |
| **Category** | Work Centers - Collections |
| **Test Name** | Account detail page loads for selected collection account |
| **Preconditions** | Collections queue loaded |
| **Steps** | 1. Click on a collection task 2. Verify navigation to `/collections/account/:accountId` 3. Verify account detail page loads with full account information |
| **Expected Result** | Account detail page shows comprehensive account data including balance history, payment history, contact log, and propensity score. |
| **Priority** | P1 |
| **Data Validation** | Account ID in URL matches selected task. Account data matches API response. |

### TC-075: Claims Work Center queue with CRS scores

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-075 |
| **Category** | Work Centers - Claims |
| **Test Name** | Claims work queue shows CRS-scored claims |
| **Preconditions** | Navigate to `/work/claims/queue` |
| **Steps** | 1. Verify ClaimsWorkQueue loads 2. Verify claims have CRS scores displayed 3. Verify claims are sorted or prioritizable by CRS score |
| **Expected Result** | Claims queue shows claims with their CRS risk scores, enabling prioritized review. |
| **Priority** | P0 |
| **Data Validation** | CRS scores are present and within 0-100 range. High-risk claims (high CRS) are identifiable. |

### TC-076: Claims Work Center scrub dashboard

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-076 |
| **Category** | Work Centers - Claims |
| **Test Name** | Scrub dashboard shows real CRS metrics |
| **Preconditions** | Navigate to `/work/claims/scrub` |
| **Steps** | 1. Verify ScrubDashboard component renders 2. Verify CRS metrics are displayed (pass rate, fail rate, common issues) 3. Verify metrics are from real data |
| **Expected Result** | Scrub dashboard shows claim scrubbing results with real statistics. |
| **Priority** | P1 |
| **Data Validation** | Pass + fail counts = total scrubbed. Metrics match scrub API response. |

### TC-077: Payment Work Center ERA processing

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-077 |
| **Category** | Work Centers - Payments |
| **Test Name** | ERA processing page loads with real ERA data |
| **Preconditions** | Navigate to `/work/payments/era` |
| **Steps** | 1. Verify ERAProcessing component loads 2. Verify ERA records are displayed 3. Each record shows: payer, amount, date, status |
| **Expected Result** | ERA processing page shows real ERA records for review and processing. |
| **Priority** | P0 |
| **Data Validation** | ERA records match the payment processing API endpoint. |

### TC-078: Payment Work Center underpayment alerts

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-078 |
| **Category** | Work Centers - Payments |
| **Test Name** | Underpayment alerts are displayed in Payment Work Center |
| **Preconditions** | Payment Work Center loaded |
| **Steps** | 1. Verify underpayment alert section is visible 2. Alerts show claims where paid amount < expected amount 3. Each alert shows the variance amount |
| **Expected Result** | Underpayment alerts highlight claims requiring contract audit review. |
| **Priority** | P1 |
| **Data Validation** | Underpayment alerts match contract audit data. |

### TC-079: Denial Work Center tab navigation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-079 |
| **Category** | Work Centers - Denial |
| **Test Name** | Denial Work Center tabs (Queue, High Risk, Appeals, Workflow Log) navigate correctly |
| **Preconditions** | Navigate to `/work/denials` |
| **Steps** | 1. Default redirect to `/work/denials/queue` 2. Click High Risk tab -- verify URL is `/work/denials/high-risk` 3. Click Appeals tab -- verify URL is `/work/denials/appeals` 4. Click Workflow Log tab -- verify URL is `/work/denials/workflow-log` |
| **Expected Result** | All tabs navigate and render their components. |
| **Priority** | P1 |
| **Data Validation** | URLs match route definitions. |

### TC-080: Collections Work Center tab navigation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-080 |
| **Category** | Work Centers - Collections |
| **Test Name** | Collections Work Center tabs (Queue, Alerts, Portal) navigate correctly |
| **Preconditions** | Navigate to `/work/collections` |
| **Steps** | 1. Default redirect to `/work/collections/queue` 2. Click Alerts tab -- verify URL is `/work/collections/alerts` 3. Click Portal tab -- verify URL is `/work/collections/portal` |
| **Expected Result** | All tabs navigate and render their components. |
| **Priority** | P1 |
| **Data Validation** | URLs match route definitions. |

### TC-081: Claims Work Center tab navigation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-081 |
| **Category** | Work Centers - Claims |
| **Test Name** | Claims Work Center tabs (Queue, Auto-Fix, Batch, Scrub) navigate correctly |
| **Preconditions** | Navigate to `/work/claims` |
| **Steps** | 1. Default redirect to `/work/claims/queue` 2. Click Auto-Fix tab -- verify URL is `/work/claims/auto-fix` 3. Click Batch tab -- verify URL is `/work/claims/batch` 4. Click Scrub tab -- verify URL is `/work/claims/scrub` |
| **Expected Result** | All tabs navigate and render their components. |
| **Priority** | P1 |
| **Data Validation** | URLs match route definitions. |

### TC-082: Payment Work Center tab navigation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-082 |
| **Category** | Work Centers - Payments |
| **Test Name** | Payment Work Center tabs (ERA, Posting, Contracts) navigate correctly |
| **Preconditions** | Navigate to `/work/payments` |
| **Steps** | 1. Default redirect to `/work/payments/era` 2. Click Posting tab -- verify URL is `/work/payments/posting` 3. Click Contracts tab -- verify URL is `/work/payments/contracts` |
| **Expected Result** | All tabs navigate and render their components. |
| **Priority** | P1 |
| **Data Validation** | URLs match route definitions. |

---

## CATEGORY 8: Claim Detail Page

### TC-083: Claim detail page loads for any claim ID

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-083 |
| **Category** | Claim Detail Page |
| **Test Name** | Claim detail page loads successfully for a valid claim ID |
| **Preconditions** | Backend running. A valid claim ID is known. |
| **Steps** | 1. Navigate to `/denials/claim/:id` with a valid claim ID 2. Verify the page loads without errors 3. Verify claim data is displayed |
| **Expected Result** | Page loads with all sections populated for the given claim ID. No 500 errors or blank page. |
| **Priority** | P0 |
| **Data Validation** | Displayed claim ID matches the URL parameter. |

### TC-084: Claim header shows correct status badge

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-084 |
| **Category** | Claim Detail Page |
| **Test Name** | Claim status badge displays correct status |
| **Preconditions** | Claim detail page loaded |
| **Steps** | 1. Verify the claim header section is visible 2. Verify status badge shows the correct status (e.g., Denied, Paid, Pending, Appeal) 3. Verify badge is color-coded appropriately |
| **Expected Result** | Status badge accurately reflects the claim's current state. Colors are consistent (red for denied, green for paid, yellow for pending). |
| **Priority** | P0 |
| **Data Validation** | Status matches the claim record in the database/API. |

### TC-085: Lifecycle timeline shows correct stages

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-085 |
| **Category** | Claim Detail Page |
| **Test Name** | Claim lifecycle timeline displays chronological stages |
| **Preconditions** | Claim detail page loaded |
| **Steps** | 1. Locate the lifecycle timeline section 2. Verify stages are shown in chronological order (e.g., Created > Submitted > Acknowledged > Adjudicated > Denied/Paid) 3. Verify dates are shown for each completed stage 4. Verify current stage is highlighted |
| **Expected Result** | Timeline shows all stages the claim has passed through with dates. Current stage is visually distinct. Future stages are grayed out. |
| **Priority** | P1 |
| **Data Validation** | Stage dates are in chronological order. Stage progression matches claim status. |

### TC-086: Denial details section for denied claims

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-086 |
| **Category** | Claim Detail Page |
| **Test Name** | Denial details section shows denial reason and codes for denied claims |
| **Preconditions** | Claim detail page loaded for a denied claim |
| **Steps** | 1. Verify denial details section is visible (only for denied claims) 2. Verify denial reason code (CARC/RARC) is displayed 3. Verify denial category is shown 4. Verify denial date is displayed |
| **Expected Result** | Denial section shows complete denial information including reason codes, category classification, and date. |
| **Priority** | P0 |
| **Data Validation** | Denial reason codes are valid CARC/RARC codes. Category matches one of the 6 denial categories. |

### TC-087: Root cause graph shows 10-step evidence chain

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-087 |
| **Category** | Claim Detail Page |
| **Test Name** | Root cause analysis graph shows evidence chain with RAG colors |
| **Preconditions** | Claim detail page loaded for a denied claim with root cause analysis |
| **Steps** | 1. Locate the root cause graph/visualization 2. Verify it shows up to 10 steps in the evidence chain 3. Verify each step has a RAG (Red/Amber/Green) color indicator 4. Verify the analysis concludes with a root cause classification |
| **Expected Result** | Root cause graph displays a step-by-step evidence chain. Each step is color-coded: Red (problem found), Amber (warning), Green (passed). The chain leads to a definitive root cause. |
| **Priority** | P0 |
| **Data Validation** | Evidence chain steps match the root cause API response for this claim. Confidence score is displayed. |

### TC-088: Claim lines table shows CPT codes

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-088 |
| **Category** | Claim Detail Page |
| **Test Name** | Claim lines section displays CPT/HCPCS codes with amounts |
| **Preconditions** | Claim detail page loaded |
| **Steps** | 1. Locate claim lines table 2. Verify each line shows: Line #, CPT/HCPCS code, Description, Billed Amount, Allowed Amount, Paid Amount 3. Verify totals match the claim header amounts |
| **Expected Result** | Claim lines table shows individual service lines with complete billing data. Line totals sum to claim total. |
| **Priority** | P1 |
| **Data Validation** | Sum of line billed amounts = claim total billed. CPT codes are valid 5-digit codes. |

### TC-089: Connected records (eligibility, auth, payment)

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-089 |
| **Category** | Claim Detail Page |
| **Test Name** | Connected records section shows related eligibility, auth, and payment records |
| **Preconditions** | Claim detail page loaded |
| **Steps** | 1. Locate connected records section 2. Verify it shows related eligibility verification record (if exists) 3. Verify it shows prior authorization record (if exists) 4. Verify it shows payment/ERA record (if exists) |
| **Expected Result** | Connected records section displays all related records linked to the claim via claim_id or patient_id. Each record type is identifiable. |
| **Priority** | P1 |
| **Data Validation** | Connected records reference the same patient and relevant date range. |

### TC-090: Validate with AI button works

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-090 |
| **Category** | Claim Detail Page |
| **Test Name** | "Validate with AI" button calls Ollama and shows agree/disagree result |
| **Preconditions** | Ollama running. Claim detail page loaded. |
| **Steps** | 1. Click "Validate with AI" button 2. Wait for Ollama to process 3. Verify result shows agree or disagree with the current root cause 4. Verify explanation text is provided |
| **Expected Result** | AI validation returns a determination (agree/disagree) with an explanation of its reasoning. Loading state shows during processing. |
| **Priority** | P1 |
| **Data Validation** | Ollama API call succeeds. Response includes determination and explanation fields. |

### TC-091: Suggested actions section

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-091 |
| **Category** | Claim Detail Page |
| **Test Name** | Suggested actions section displays actionable recommendations |
| **Preconditions** | Claim detail page loaded |
| **Steps** | 1. Locate suggested actions section 2. Verify at least one suggested action is shown 3. Verify each action has a label and description 4. Verify action buttons are clickable |
| **Expected Result** | Suggested actions provide relevant next steps (e.g., "File Appeal", "Request Documentation", "Resubmit with Corrections"). Actions are contextual to the claim status. |
| **Priority** | P2 |
| **Data Validation** | Suggested actions are appropriate for the claim's denial reason and status. |

### TC-092: AI insight card loads on claim detail

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-092 |
| **Category** | Claim Detail Page |
| **Test Name** | AI insight card shows claim-specific analysis |
| **Preconditions** | Ollama running. Claim detail page loaded. |
| **Steps** | 1. Locate AI insight card 2. Verify it shows generated analysis specific to this claim 3. Verify the insight references claim-specific data (payer, denial reason, amount) |
| **Expected Result** | AI insight card provides a contextual analysis of the specific claim with actionable observations. |
| **Priority** | P2 |
| **Data Validation** | Insight references the correct claim ID and its specific attributes. |

---

## CATEGORY 9: Intelligence

### TC-093: LIDA Chat sends message and receives streaming response

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-093 |
| **Category** | Intelligence - LIDA Chat |
| **Test Name** | Chat interface sends message to Ollama and displays streaming response |
| **Preconditions** | Ollama running. Navigate to `/intelligence/lida/chat` |
| **Steps** | 1. Type a question in the chat input (e.g., "What are the top 5 denial reasons?") 2. Press Enter or click Send 3. Observe the response appearing token-by-token 4. Verify the complete response is coherent |
| **Expected Result** | Message is sent to Ollama. Response streams in token-by-token (not all at once). Complete response is a coherent answer to the question. |
| **Priority** | P0 |
| **Data Validation** | Network tab shows streaming connection to Ollama. Response includes contextual RCM data. |

### TC-094: LIDA Chat response appears token-by-token

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-094 |
| **Category** | Intelligence - LIDA Chat |
| **Test Name** | Chat response renders incrementally via streaming |
| **Preconditions** | LIDA Chat loaded, Ollama running |
| **Steps** | 1. Send a message that requires a long response 2. Watch the response area 3. Verify text appears progressively (not after a long delay all at once) |
| **Expected Result** | Response text builds up incrementally, indicating true streaming from Ollama. User sees text appearing character-by-character or chunk-by-chunk. |
| **Priority** | P1 |
| **Data Validation** | Network tab shows a streaming/chunked transfer response. |

### TC-095: Revenue Forecast model accuracy KPIs

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-095 |
| **Category** | Intelligence - Revenue Forecast |
| **Test Name** | Forecast page shows model accuracy metrics (MAPE, MAE, R-squared, Training Data) |
| **Preconditions** | Navigate to `/intelligence/forecast` |
| **Steps** | 1. Verify KPI cards for model accuracy: MAPE, MAE, R-squared, Training Data size 2. Verify MAPE is a percentage (lower is better) 3. Verify R-squared is between 0 and 1 4. Verify Training Data shows number of data points used |
| **Expected Result** | All 4 model accuracy KPIs display with real values from the Prophet model evaluation. |
| **Priority** | P0 |
| **Data Validation** | MAPE < 20% (acceptable forecast accuracy). R-squared > 0.5. Values match forecast API response. |

### TC-096: 4-week Prophet forecast table

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-096 |
| **Category** | Intelligence - Revenue Forecast |
| **Test Name** | Forecast table shows 4-week Prophet projections with per-week values |
| **Preconditions** | Revenue Forecast page loaded |
| **Steps** | 1. Locate the 4-week forecast table 2. Verify it shows 4 rows (one per week) 3. Each row shows: Week, Projected Revenue, Lower Bound, Upper Bound 4. Verify projections are in the future |
| **Expected Result** | Forecast table shows 4 weeks of future projections with confidence intervals. Dates are future dates. Amounts are realistic. |
| **Priority** | P0 |
| **Data Validation** | Projected values match `GET /api/v1/analytics/forecast` response. Lower bound < Projected < Upper bound for each week. |

### TC-097: Payer forecast breakdown top 10 payers

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-097 |
| **Category** | Intelligence - Revenue Forecast |
| **Test Name** | Payer-level forecast shows top 10 payers |
| **Preconditions** | Revenue Forecast page loaded |
| **Steps** | 1. Locate payer forecast breakdown section 2. Verify it shows top 10 payers 3. Each payer has a projected revenue amount 4. Sum of payer projections should relate to total projection |
| **Expected Result** | Top 10 payers are listed with individual revenue projections. Rankings reflect historical payment volumes. |
| **Priority** | P1 |
| **Data Validation** | Payer names match the master payer list. Projections are proportional to historical payment volumes. |

### TC-098: 3-layer revenue funnel renders

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-098 |
| **Category** | Intelligence - Revenue Forecast |
| **Test Name** | Revenue funnel visualization shows 3 layers |
| **Preconditions** | Revenue Forecast page loaded |
| **Steps** | 1. Locate the revenue funnel visualization 2. Verify it shows 3 layers (e.g., Gross Revenue > Net Revenue > Collected Revenue) 3. Verify each layer has a dollar amount 4. Verify layers are proportionally sized |
| **Expected Result** | Revenue funnel renders with 3 distinct layers showing revenue progression. Each layer narrows appropriately. |
| **Priority** | P1 |
| **Data Validation** | Layer values are logically decreasing (Gross > Net > Collected). Values match financial data from API. |

### TC-099: Revenue Forecast AI narrative loads

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-099 |
| **Category** | Intelligence - Revenue Forecast |
| **Test Name** | AI narrative section loads from Ollama on forecast page |
| **Preconditions** | Ollama running. Revenue Forecast page loaded. |
| **Steps** | 1. Locate AI narrative section 2. Verify generated text appears 3. Verify narrative discusses forecast trends and key drivers |
| **Expected Result** | AI narrative provides contextual analysis of the revenue forecast with specific projections and trend observations. |
| **Priority** | P2 |
| **Data Validation** | Ollama API call succeeds. Narrative references values consistent with displayed forecast. |

### TC-100: Simulation Dashboard displays 5 scenarios

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-100 |
| **Category** | Intelligence - Simulation |
| **Test Name** | Simulation dashboard shows 5 predefined scenarios |
| **Preconditions** | Navigate to `/intelligence/simulation` |
| **Steps** | 1. Verify SimulationDashboard component renders 2. Verify 5 simulation scenarios are displayed 3. Each scenario has a name, description, and "Run" button |
| **Expected Result** | 5 scenarios are visible with descriptions and actionable Run buttons. |
| **Priority** | P0 |
| **Data Validation** | Scenario count is 5. Each has a unique name. |

### TC-101: Simulation Run executes and returns results

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-101 |
| **Category** | Intelligence - Simulation |
| **Test Name** | Clicking Run on a scenario executes simulation and displays results |
| **Preconditions** | Simulation Dashboard loaded |
| **Steps** | 1. Click "Run" on the first scenario 2. Wait for simulation to complete (loading indicator should appear) 3. Verify results panel shows projected outcomes 4. Verify results include financial impact estimates |
| **Expected Result** | Simulation executes and returns projected outcomes with financial impact. Results are displayed in a structured format. |
| **Priority** | P0 |
| **Data Validation** | Simulation API call completes successfully. Results contain projected values and impact metrics. |

### TC-102: Simulation payer agent profiles

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-102 |
| **Category** | Intelligence - Simulation |
| **Test Name** | Payer agent profiles are displayed in simulation context |
| **Preconditions** | Simulation Dashboard loaded |
| **Steps** | 1. Locate payer agent profiles section 2. Verify profiles show payer behavioral parameters 3. Verify profiles are used in simulation logic |
| **Expected Result** | Payer agent profiles define behavioral characteristics used by the MiroFish simulation engine. |
| **Priority** | P2 |
| **Data Validation** | Profile parameters are reasonable (payment speed, denial likelihood, appeal response rate). |

### TC-103: Prevention Dashboard scan returns alerts

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-103 |
| **Category** | Intelligence - Prevention |
| **Test Name** | Prevention scan returns alerts with revenue at risk |
| **Preconditions** | Navigate to `/analytics/prevention` |
| **Steps** | 1. Verify PreventionDashboard renders 2. Verify prevention alerts are displayed 3. Each alert shows: rule name, affected claims count, revenue at risk 4. Verify total revenue at risk is calculated |
| **Expected Result** | Prevention dashboard shows active alerts from the prevention scan engine. Each alert quantifies the financial risk. |
| **Priority** | P0 |
| **Data Validation** | Alert data matches `GET /api/v1/prevention/scan` response. Revenue at risk values are realistic. |

### TC-104: Prevention Dashboard 5 rule types

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-104 |
| **Category** | Intelligence - Prevention |
| **Test Name** | Prevention dashboard shows 5 rule types |
| **Preconditions** | Prevention Dashboard loaded |
| **Steps** | 1. Verify 5 prevention rule types are displayed 2. Each rule type shows: name, description, alert count 3. Verify rules cover different denial prevention areas |
| **Expected Result** | 5 rule types are displayed covering areas like eligibility, authorization, coding, timely filing, and documentation. |
| **Priority** | P1 |
| **Data Validation** | 5 distinct rule types are present. Each has associated alerts. |

### TC-105: Prevention claim click navigates to detail

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-105 |
| **Category** | Intelligence - Prevention |
| **Test Name** | Clicking a flagged claim in prevention navigates to claim detail |
| **Preconditions** | Prevention Dashboard loaded with alerts |
| **Steps** | 1. Click on a specific claim listed in a prevention alert 2. Verify navigation to claim detail page 3. Verify the claim detail shows the prevention flag |
| **Expected Result** | Navigation to claim detail page. Prevention flag is visible on the claim indicating the specific risk. |
| **Priority** | P1 |
| **Data Validation** | Claim ID matches the clicked item. Prevention flag is present in claim data. |

### TC-106: Automation Dashboard displays 15 rules

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-106 |
| **Category** | Intelligence - Automation |
| **Test Name** | Automation dashboard shows 15 automation rules |
| **Preconditions** | Navigate to `/work/automation` |
| **Steps** | 1. Verify AutomationDashboard component renders 2. Count the number of automation rules displayed 3. Each rule shows: name, description, status (enabled/disabled), last run |
| **Expected Result** | 15 automation rules are displayed with their current status and configuration. |
| **Priority** | P0 |
| **Data Validation** | Rule count is 15. Each rule has a unique name and valid status. |

### TC-107: Automation rule toggle on/off

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-107 |
| **Category** | Intelligence - Automation |
| **Test Name** | Toggling an automation rule enables/disables it |
| **Preconditions** | Automation Dashboard loaded |
| **Steps** | 1. Find a rule that is currently enabled 2. Click the toggle switch to disable it 3. Verify the rule status changes to disabled 4. Click again to re-enable 5. Verify status returns to enabled |
| **Expected Result** | Toggle switch correctly changes rule status. Visual indicator updates immediately. API call to update status succeeds. |
| **Priority** | P1 |
| **Data Validation** | Rule status in the API matches the toggle state. |

### TC-108: Run Rules Now evaluates automation rules

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-108 |
| **Category** | Intelligence - Automation |
| **Test Name** | "Run Rules Now" button triggers rule evaluation |
| **Preconditions** | Automation Dashboard loaded with enabled rules |
| **Steps** | 1. Click "Run Rules Now" button 2. Wait for evaluation to complete 3. Verify results show which rules triggered and what actions were taken |
| **Expected Result** | Rule evaluation runs and produces results showing triggered rules, affected claims, and actions taken or recommended. |
| **Priority** | P0 |
| **Data Validation** | Evaluation API call succeeds. Results show claim counts and actions for each triggered rule. |

### TC-109: Automation pending approvals

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-109 |
| **Category** | Intelligence - Automation |
| **Test Name** | Pending approvals section shows actions awaiting human review |
| **Preconditions** | Automation Dashboard loaded, rules have been evaluated |
| **Steps** | 1. Locate pending approvals section 2. Verify it shows actions that require human approval before execution 3. Verify each pending action shows: rule name, affected claims, proposed action, approve/reject buttons |
| **Expected Result** | Pending approvals list actions from the tiered human-in-the-loop workflow. Approve and reject options are available. |
| **Priority** | P1 |
| **Data Validation** | Pending actions match the automation evaluate API response for actions requiring approval. |

---

## CATEGORY 10: AI & Backend

### TC-110: Ollama health check

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-110 |
| **Category** | AI & Backend |
| **Test Name** | Ollama health endpoint returns healthy status |
| **Preconditions** | Backend and Ollama running |
| **Steps** | 1. Execute `curl http://localhost:8000/api/v1/ai/health` 2. Verify response status is 200 3. Verify response body indicates healthy status |
| **Expected Result** | Health endpoint returns `{"status": "healthy"}` or equivalent. Response time < 2 seconds. |
| **Priority** | P0 |
| **Data Validation** | HTTP status 200. Response contains health status field indicating operational. |

### TC-111: All 18+ AI contexts return insights

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-111 |
| **Category** | AI & Backend |
| **Test Name** | Each AI context endpoint returns a generated insight |
| **Preconditions** | Backend and Ollama running |
| **Steps** | 1. Test each AI context: denials, payments, ar, command-center, forecast, prevention, simulation, root-cause, collections, claims, coding, eligibility, reconciliation, cash-flow, contract-audit, payer-profiles, era-recon, automation 2. For each: `curl http://localhost:8000/api/v1/ai/insight?context=<context>` 3. Verify each returns a generated text response |
| **Expected Result** | All 18+ context endpoints return generated insights. No context returns an error or empty response. |
| **Priority** | P1 |
| **Data Validation** | HTTP status 200 for each context. Response body contains non-empty insight text. |

### TC-112: Root cause API returns 7 categories with confidence > 60%

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-112 |
| **Category** | AI & Backend |
| **Test Name** | Root cause analysis API returns correct structure |
| **Preconditions** | Backend running |
| **Steps** | 1. Execute `curl http://localhost:8000/api/v1/analytics/root-cause` 2. Verify response contains 7 root cause categories 3. Verify average confidence across categories > 60% 4. Verify each category has count and financial impact |
| **Expected Result** | API returns 7 root cause categories with confidence scores, claim counts, and dollar impact. Average confidence exceeds 60%. |
| **Priority** | P0 |
| **Data Validation** | Category count = 7. Avg confidence > 60%. Sum of category counts = total analyzed. |

### TC-113: Diagnostic refresh populates findings

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-113 |
| **Category** | AI & Backend |
| **Test Name** | Diagnostic refresh endpoint returns findings |
| **Preconditions** | Backend running |
| **Steps** | 1. Execute `curl -X POST http://localhost:8000/api/v1/diagnostics/refresh` 2. Verify response contains diagnostic findings 3. Verify each finding has severity, description, and recommendation |
| **Expected Result** | Diagnostic refresh returns a list of findings with actionable recommendations. |
| **Priority** | P1 |
| **Data Validation** | Response contains at least 1 finding. Each finding has required fields. |

### TC-114: Prevention scan returns alerts with revenue at risk

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-114 |
| **Category** | AI & Backend |
| **Test Name** | Prevention scan API returns alerts with financial impact |
| **Preconditions** | Backend running |
| **Steps** | 1. Execute `curl http://localhost:8000/api/v1/prevention/scan` 2. Verify response contains alert objects 3. Each alert has: rule_name, claim_count, revenue_at_risk |
| **Expected Result** | Prevention scan returns alerts with quantified revenue at risk. |
| **Priority** | P0 |
| **Data Validation** | Revenue at risk values are positive dollar amounts. Claim counts are positive integers. |

### TC-115: Automation evaluate triggers actions

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-115 |
| **Category** | AI & Backend |
| **Test Name** | Automation evaluate endpoint processes rules and returns actions |
| **Preconditions** | Backend running with automation rules configured |
| **Steps** | 1. Execute `curl -X POST http://localhost:8000/api/v1/automation/evaluate` 2. Verify response contains evaluated rules with triggered actions 3. Verify action types are valid (auto-fix, resubmit, appeal, escalate) |
| **Expected Result** | Evaluation returns a list of triggered rules with proposed actions and affected claim counts. |
| **Priority** | P1 |
| **Data Validation** | Response contains rule evaluations. Action types are from the valid set. |

### TC-116: Simulation run returns results

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-116 |
| **Category** | AI & Backend |
| **Test Name** | Simulation run API returns projected outcomes |
| **Preconditions** | Backend running |
| **Steps** | 1. Execute `curl -X POST http://localhost:8000/api/v1/simulation/run -d '{"scenario_id": 1}'` 2. Verify response contains simulation results 3. Verify results include projected financial impact |
| **Expected Result** | Simulation completes and returns projected outcomes with financial metrics. |
| **Priority** | P1 |
| **Data Validation** | Response contains projected values. Financial impact is a realistic dollar amount. |

### TC-117: Prophet weekly forecast returns 4+ weeks

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-117 |
| **Category** | AI & Backend |
| **Test Name** | Forecast API returns at least 4 weeks of Prophet predictions |
| **Preconditions** | Backend running |
| **Steps** | 1. Execute `curl http://localhost:8000/api/v1/analytics/forecast` 2. Verify response contains weekly forecast array 3. Count forecast entries (must be >= 4) 4. Each entry has: week, predicted_value, lower_bound, upper_bound |
| **Expected Result** | Forecast API returns 4 or more weeks of predictions with confidence intervals. |
| **Priority** | P0 |
| **Data Validation** | Forecast count >= 4. lower_bound < predicted_value < upper_bound for each week. Dates are in the future. |

### TC-118: Graph drill-down returns data at all 5 levels

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-118 |
| **Category** | AI & Backend |
| **Test Name** | Investigation graph API returns data for all 5 drill-down levels |
| **Preconditions** | Backend running |
| **Steps** | 1. Query Level 1 (KPI overview) 2. Query Level 2 (Payer breakdown) with a payer parameter 3. Query Level 3 (Category breakdown) with payer + category 4. Query Level 4 (Root cause breakdown) with payer + category + root cause 5. Query Level 5 (Claim list) with full filter |
| **Expected Result** | Each level returns appropriate data. Data narrows progressively at each level. Level 5 returns individual claim records. |
| **Priority** | P1 |
| **Data Validation** | Each level's data is a subset of the previous level. Level 5 claim IDs are valid. |

### TC-119: All APIs respond in < 5 seconds

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-119 |
| **Category** | AI & Backend |
| **Test Name** | All API endpoints respond within 5-second threshold |
| **Preconditions** | Backend running |
| **Steps** | 1. Time each major API endpoint call 2. Test: /analytics/pipeline, /analytics/denials, /analytics/root-cause, /analytics/forecast, /prevention/scan, /ai/health 3. Record response time for each 4. Verify all respond in < 5 seconds |
| **Expected Result** | All API endpoints return responses within 5 seconds. AI-dependent endpoints (Ollama) may take slightly longer but should still complete within threshold. |
| **Priority** | P1 |
| **Data Validation** | Response time < 5000ms for each endpoint. Use `curl -w "%{time_total}" -o /dev/null -s` to measure. |

---

## CATEGORY 11: Data Consistency

### TC-120: Denial count consistency across pages

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-120 |
| **Category** | Data Consistency |
| **Test Name** | Denial count matches across Command Center and Denial Analytics |
| **Preconditions** | All pages loaded with data |
| **Steps** | 1. Note denial count on Command Center (Denial Rate KPI or total denials) 2. Navigate to `/analytics/denials/overview` 3. Note total denials count 4. Compare the two values 5. Verify against API: `curl http://localhost:8000/api/v1/analytics/denials` |
| **Expected Result** | Denial count is identical across Command Center, Denial Analytics Overview, and API response. |
| **Priority** | P0 |
| **Data Validation** | All three sources show the same denial count (expected ~56,426). |

### TC-121: Revenue at risk consistency

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-121 |
| **Category** | Data Consistency |
| **Test Name** | Revenue at risk value is consistent across all pages |
| **Preconditions** | Pages loaded with data |
| **Steps** | 1. Note Revenue at Risk on Command Center 2. Note Revenue at Risk on Denial Analytics Overview 3. Note Revenue at Risk on Prevention Dashboard 4. Compare all three values |
| **Expected Result** | Revenue at risk is the same value (or clearly scoped to different contexts with explicit labels) across all pages. |
| **Priority** | P0 |
| **Data Validation** | All instances of "Revenue at Risk" show the same value (~$205M) or are clearly labeled with scope qualifiers. |

### TC-122: Root cause distribution totals equal total analyzed

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-122 |
| **Category** | Data Consistency |
| **Test Name** | Sum of root cause categories equals total denials analyzed |
| **Preconditions** | Root Cause tab loaded |
| **Steps** | 1. Note "Total Analyzed" KPI value 2. Sum the claim counts from all root cause distribution bars 3. Compare sum to Total Analyzed |
| **Expected Result** | Sum of root cause category counts equals the Total Analyzed KPI value. No claims are unaccounted for. |
| **Priority** | P0 |
| **Data Validation** | Sum of all root cause counts = Total Analyzed value. |

### TC-123: Payer names consistent across pages

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-123 |
| **Category** | Data Consistency |
| **Test Name** | Payer names are spelled and formatted consistently across all pages |
| **Preconditions** | Multiple pages loaded |
| **Steps** | 1. Note payer names on Payment Intelligence payer ranking 2. Note payer names on Revenue Reconciliation 3. Note payer names on Denial Analytics heatmap 4. Compare for spelling, capitalization, and format consistency |
| **Expected Result** | Payer names are identical in spelling and format across all pages. No variations like "Blue Cross" vs "BCBS" vs "Blue Cross Blue Shield". |
| **Priority** | P1 |
| **Data Validation** | Master payer list from API uses consistent names. All UI references use the same canonical name. |

### TC-124: ERA amounts match between Payment Intelligence and Reconciliation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-024 |
| **Category** | Data Consistency |
| **Test Name** | ERA amounts are consistent between Payment Dashboard and Revenue Reconciliation |
| **Preconditions** | Both Payment Intelligence and Revenue Reconciliation pages accessible |
| **Steps** | 1. Note total ERA amount on `/analytics/payments/overview` 2. Navigate to `/analytics/revenue/reconciliation` 3. Sum ERA amounts from reconciliation payer table 4. Compare totals |
| **Expected Result** | Total ERA amount on Payment Dashboard equals sum of ERA amounts on Reconciliation page. |
| **Priority** | P0 |
| **Data Validation** | ERA total on Payment Intelligence (~$946M) matches ERA total on Reconciliation. |

### TC-125: AR aging totals match across pages

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-125 |
| **Category** | Data Consistency |
| **Test Name** | AR aging totals are consistent between Revenue Analytics and Collections |
| **Preconditions** | AR Aging page and Collections Hub accessible |
| **Steps** | 1. Note total AR amount from AR Aging page (sum of all buckets) 2. Navigate to Collections queue 3. Compare total outstanding balance with AR total |
| **Expected Result** | Total AR aging amount is consistent with collections outstanding balance (or difference is clearly explained by scope). |
| **Priority** | P1 |
| **Data Validation** | AR total from aging buckets should reconcile with collections total or be labeled with scope explanation. |

### TC-126: Denial category totals equal total denials

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-126 |
| **Category** | Data Consistency |
| **Test Name** | Sum of 6 denial categories equals total denials |
| **Preconditions** | Denial Analytics Overview loaded |
| **Steps** | 1. Note total denials KPI 2. Sum counts from all 6 denial categories (CODING + ELIGIBILITY + AUTH + TIMELY_FILING + NON_COVERED + COB) 3. Compare sum to total |
| **Expected Result** | Sum of all 6 category counts equals total denials. |
| **Priority** | P0 |
| **Data Validation** | CODING + ELIGIBILITY + AUTH + TIMELY_FILING + NON_COVERED + COB = Total Denials (~56,426). |

### TC-127: KPI values do not show hardcoded fallbacks when API is available

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-127 |
| **Category** | Data Consistency |
| **Test Name** | No hardcoded fallback values are displayed when backend is operational |
| **Preconditions** | Backend and Ollama running. Application loaded. |
| **Steps** | 1. Open browser DevTools Network tab 2. Navigate through all major pages (Command Center, Revenue Analytics, Denial Analytics, Payment Intelligence) 3. For each page, verify API calls return 200 4. Verify displayed values match API responses (not static defaults) |
| **Expected Result** | All displayed values are dynamic from API responses. No hardcoded values like "$0", "0%", or "N/A" appear when the API is returning real data. |
| **Priority** | P0 |
| **Data Validation** | Compare each displayed KPI against its API source. Flag any value that remains constant regardless of data changes. |

### TC-128: Clean Claim Rate consistency

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-128 |
| **Category** | Data Consistency |
| **Test Name** | Clean Claim Rate is consistent between Command Center and Claims Pipeline |
| **Preconditions** | Both pages loaded |
| **Steps** | 1. Note Clean Claim Rate on Command Center 2. Navigate to Claims Pipeline Overview 3. Note the clean claim rate or acceptance rate metric 4. Compare |
| **Expected Result** | Clean Claim Rate values match across both views. |
| **Priority** | P1 |
| **Data Validation** | Values should be identical or labeled with clear scope differences. |

### TC-129: Net Collection Rate formula validation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-129 |
| **Category** | Data Consistency |
| **Test Name** | Net Collection Rate is correctly calculated from component values |
| **Preconditions** | Command Center or Revenue Analytics loaded |
| **Steps** | 1. Note Net Collection Rate percentage 2. Note Total Payments Received (or collected revenue) 3. Note Total Allowable Amount (or net revenue) 4. Calculate: Net Collection Rate = (Payments / Allowable) x 100 5. Compare calculated value with displayed value |
| **Expected Result** | Displayed Net Collection Rate matches the mathematical calculation from its component values. |
| **Priority** | P1 |
| **Data Validation** | Calculated rate = (Payments / Allowable) x 100. Tolerance: +/- 0.1%. |

---

## CATEGORY 12: Cross-Page Navigation

### TC-130: AR Aging root cause to claims to claim detail round-trip

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-130 |
| **Category** | Cross-Page Navigation |
| **Test Name** | Complete navigation: AR Aging root cause bar > claims list > claim detail > back |
| **Preconditions** | Application loaded. All data available. |
| **Steps** | 1. Navigate to `/analytics/revenue/ar-aging` 2. Click a root cause bar in the aging analysis 3. Verify navigation to filtered claims list 4. Click on a specific claim in the list 5. Verify claim detail page loads with full data 6. Click browser Back button 7. Verify return to claims list with filter intact 8. Click Back again 9. Verify return to AR Aging page |
| **Expected Result** | Complete round-trip navigation works. Each page loads correctly. Back button restores previous page state including filters. |
| **Priority** | P0 |
| **Data Validation** | Claims list count matches root cause bar count. Claim detail shows correct claim. Back navigation preserves filter state. |

### TC-131: Reconciliation payer to claims to claim detail

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-131 |
| **Category** | Cross-Page Navigation |
| **Test Name** | Complete navigation: Reconciliation payer row > payer claims > claim detail |
| **Preconditions** | Application loaded |
| **Steps** | 1. Navigate to `/analytics/revenue/reconciliation` 2. Click on a payer row 3. Verify payer claims page loads at `/analytics/revenue/reconciliation/payer-claims` 4. Click on a claim in the claims list 5. Verify claim detail page loads 6. Click Back to return to payer claims |
| **Expected Result** | Navigation flow works end-to-end. Payer claims are filtered to the selected payer. Claim detail loads correctly. |
| **Priority** | P1 |
| **Data Validation** | All claims in payer claims list belong to the selected payer. |

### TC-132: Denial queue to claim detail to AI validation

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-132 |
| **Category** | Cross-Page Navigation |
| **Test Name** | Complete navigation: Denial queue > claim detail > validate with AI > back |
| **Preconditions** | Ollama running. Application loaded. |
| **Steps** | 1. Navigate to `/work/denials/queue` 2. Click on a denied claim 3. Verify claim detail page loads with denial information 4. Click "Validate with AI" button 5. Verify AI validation result appears 6. Click browser Back button 7. Verify return to denial queue |
| **Expected Result** | Full workflow from queue to AI validation works. Back navigation returns to queue without losing queue state. |
| **Priority** | P1 |
| **Data Validation** | AI validation references the correct claim and denial reason. |

### TC-133: Investigation panel full drill-down path

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-133 |
| **Category** | Cross-Page Navigation |
| **Test Name** | Investigation panel: Revenue > Payer > Category > Root Cause > Claim with full context |
| **Preconditions** | Command Center loaded |
| **Steps** | 1. Click on a KPI card to open investigation panel 2. Drill into a payer (Level 2) 3. Drill into a denial category (Level 3) 4. Drill into a root cause (Level 4) 5. Click on a specific claim (Level 5) 6. Verify claim detail page loads with full context |
| **Expected Result** | All 5 levels of drill-down work. Each level shows data that is a subset of the previous level. The final claim detail shows complete information. Breadcrumb trail shows the full path taken. |
| **Priority** | P0 |
| **Data Validation** | Data at each level is properly filtered by parent selections. Claim at Level 5 matches the filters applied at Levels 2-4. |

### TC-134: Prevention alert to claim detail with prevention flag

| Field | Detail |
|-------|--------|
| **TC-ID** | TC-134 |
| **Category** | Cross-Page Navigation |
| **Test Name** | Prevention alert claim link > claim detail > prevention flag visible |
| **Preconditions** | Prevention Dashboard loaded with alerts |
| **Steps** | 1. Navigate to `/analytics/prevention` 2. Locate a prevention alert with a specific claim 3. Click the claim link 4. Verify claim detail page loads 5. Verify the claim detail page shows the prevention flag/alert that was triggered |
| **Expected Result** | Navigation from prevention alert to claim detail works. The claim detail page shows the prevention flag identifying the specific risk found by the prevention engine. |
| **Priority** | P1 |
| **Data Validation** | Prevention flag on claim detail matches the alert that was clicked. Risk description is consistent. |

---

## Summary

| Category | Test Cases | P0 | P1 | P2 | P3 |
|----------|-----------|-----|-----|-----|-----|
| 1. Navigation & Routing | 10 | 5 | 3 | 1 | 0 |
| 2. Command Center | 10 | 2 | 5 | 2 | 0 |
| 3. Revenue Analytics | 15 | 3 | 8 | 3 | 0 |
| 4. Denial Analytics | 15 | 4 | 6 | 3 | 0 |
| 5. Payment Intelligence | 12 | 4 | 4 | 3 | 0 |
| 6. Claims Pipeline | 5 | 3 | 2 | 0 | 0 |
| 7. Work Centers | 15 | 4 | 9 | 1 | 0 |
| 8. Claim Detail Page | 10 | 4 | 3 | 3 | 0 |
| 9. Intelligence | 17 | 5 | 6 | 4 | 0 |
| 10. AI & Backend | 10 | 4 | 5 | 0 | 0 |
| 11. Data Consistency | 10 | 5 | 4 | 0 | 0 |
| 12. Cross-Page Navigation | 5 | 2 | 3 | 0 | 0 |
| **TOTAL** | **134** | **45** | **58** | **20** | **0** |
