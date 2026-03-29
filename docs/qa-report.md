# NEXUS RCM Frontend QA Report

**Date:** 2026-03-27
**Tester:** Automated QA Pass (Claude)
**Build Tool:** Vite 5.4.21
**Frontend Port:** 5174 | **Backend Port:** 8000

---

## 1. Server Status

| Server   | Status | Notes |
|----------|--------|-------|
| Frontend (Vite) | RUNNING | Port 5174, PID 34663 |
| Backend (Uvicorn) | WRONG APP | Port 8000 is serving **cloud copilot** (`/Users/prabakarannagarajan/Desktop/cloud copilot /apps/api`), NOT the RCM Pulse backend (`/Users/prabakarannagarajan/RCM Pulse/backend`). |

### CRITICAL: Backend Not Running

The uvicorn process on port 8000 is serving a completely different application (cloud copilot security platform). The RCM Pulse backend at `/Users/prabakarannagarajan/RCM Pulse/backend` is not running.

**To fix:**
```bash
# Kill the wrong backend
kill $(lsof -ti:8000)

# Start the correct RCM backend
cd "/Users/prabakarannagarajan/RCM Pulse/backend"
source venv/bin/activate
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 2. API Endpoint Inventory

All endpoints below are defined in the RCM backend code but return HTTP 404 because the wrong backend is running on port 8000.

### Backend Route Definitions (Verified in Source Code)

| Endpoint | Backend File | Status |
|----------|-------------|--------|
| `GET /api/v1/analytics/pipeline` | analytics.py | Defined, not served (wrong backend) |
| `GET /api/v1/analytics/denial-matrix` | analytics.py | Defined, not served |
| `GET /api/v1/analytics/appeal-win-rate` | analytics.py | Defined, not served |
| `GET /api/v1/denials/summary` | denials.py | Defined, not served |
| `GET /api/v1/denials` | denials.py | Defined, not served |
| `GET /api/v1/denials/heatmap` | denials.py | Defined, not served |
| `GET /api/v1/denials/appeals` | denials.py | Defined, not served |
| `POST /api/v1/denials/appeals` | denials.py | Defined, not served |
| `GET /api/v1/denials/appeals/{id}/letter` | denials.py | Defined, not served |
| `GET /api/v1/payments/summary` | payments.py | Defined, not served |
| `GET /api/v1/payments/era` | payments.py | Defined, not served |
| `GET /api/v1/payments/triangulation/summary` | payments.py | Defined, not served |
| `GET /api/v1/payments/adtp` | payments.py | Defined, not served |
| `GET /api/v1/payments/silent-underpayments` | payments.py | Defined, not served |
| `GET /api/v1/payments/float-analysis` | payments.py | Defined, not served |
| `GET /api/v1/payments/era-bank-match` | payments.py | Defined, not served |
| `GET /api/v1/ar/summary` | ar.py | Defined, not served |
| `GET /api/v1/ar/aging` | ar.py | Defined, not served |
| `GET /api/v1/ar/trend` | ar.py | Defined, not served |
| `GET /api/v1/ar/aging-root-cause` | ar.py | Defined, not served |
| `GET /api/v1/root-cause/summary` | root_cause.py | Defined, not served |
| `GET /api/v1/root-cause/trending` | root_cause.py | Defined, not served |
| `GET /api/v1/root-cause/claim/{claim_id}` | root_cause.py | Defined, not served |
| `GET /api/v1/diagnostics/summary` | diagnostics.py | Defined, not served |
| `GET /api/v1/diagnostics/findings` | diagnostics.py | Defined, not served |
| `GET /api/v1/automation/rules` | graph.py | Defined, not served |
| `GET /api/v1/automation/pending` | graph.py | Defined, not served |
| `GET /api/v1/automation/audit` | graph.py | Defined, not served |
| `GET /api/v1/forecast/summary` | forecast.py | Defined, not served |
| `GET /api/v1/forecast/weekly` | forecast.py | Defined, not served |
| `GET /api/v1/forecast/daily` | forecast.py | Defined, not served |
| `GET /api/v1/forecast/reconciliation/summary` | forecast.py | Defined, not served |
| `GET /api/v1/crs/summary` | crs.py | Defined, not served |
| `GET /api/v1/crs/queue` | crs.py | Defined, not served |
| `GET /api/v1/crs/error-categories` | crs.py | Defined, not served |
| `GET /api/v1/crs/high-risk` | crs.py | Defined, not served |
| `GET /api/v1/crs/payers` | crs.py | Defined, not served |
| `GET /api/v1/collections/summary` | collections.py | Defined, not served |
| `GET /api/v1/collections/queue` | collections.py | Defined, not served |
| `GET /api/v1/collections/alerts` | collections.py | Defined, not served |
| `GET /api/v1/reconciliation/summary` | reconciliation.py | Defined, not served |
| `GET /api/v1/reconciliation/weekly` | reconciliation.py | Defined, not served |
| `GET /api/v1/reconciliation/era` | reconciliation.py | Defined, not served |
| `GET /api/v1/prevention/scan` | prevention.py | Defined, not served |
| `GET /api/v1/prevention/summary` | prevention.py | Defined, not served |
| `GET /api/v1/simulation/scenarios` | simulation.py | Defined, not served |
| `GET /api/v1/ai/health` | ai.py | Defined, not served |
| `GET /api/v1/graph/revenue-to-payers` | graph.py | Defined, not served |

---

## 3. Frontend Build Status

```
vite v5.4.21 building for production...
1005 modules transformed.
Built in 1.92s
```

| Check | Result |
|-------|--------|
| Build success | PASS |
| TypeScript errors | N/A (plain JSX project) |
| Module resolution | PASS (all 1005 modules resolved) |
| Chunk size warning | WARNING: Main chunk is 1,874 kB (exceeds 500 kB limit) |

### Build Warning Detail

The single `index-CGpfzwGh.js` chunk is 1,874.89 kB (404.31 kB gzipped). Recommended fix:
- Add `React.lazy()` and `Suspense` for route-level code splitting
- Configure `build.rollupOptions.output.manualChunks` in `vite.config.js` to split vendor libraries (recharts, etc.)

---

## 4. Mock Data Imports (Active in Production Code)

The following **3 page components** still import mock data directly, rather than fetching from the API:

| File | Mock Import | Usage |
|------|-------------|-------|
| `features/denials/pages/DenialPredictionAnalysis.jsx` | `mockDenialData` | Uses mock to find claims by ID; no API fallback |
| `features/finance/pages/AIInsightDetail.jsx` | `mockForecastingData` | Uses mock for AI insight lookup; no API fallback |
| `features/dashboard/pages/CommandCenter.jsx` | `mockCommandCenterData` | Falls back to mock when live API call fails |

### Mock Data Files (Still Present)

| File | Status |
|------|--------|
| `features/denials/data/mockDenialData.js` | In use by DenialPredictionAnalysis |
| `features/denials/data/mockReconciliationData.js` | Not imported by any page (dead code) |
| `features/collections/data/mockARData.js` | Not imported by any page (dead code) |
| `data/synthetic/mockForecastingData.js` | In use by AIInsightDetail |
| `data/synthetic/mockCommandCenterData.js` | In use by CommandCenter |

### Recommended Fixes

1. **DenialPredictionAnalysis.jsx** -- Replace `mockDenialData` with a call to `api.denials.list()` or `api.crs.getClaimDetail(id)`
2. **AIInsightDetail.jsx** -- Replace `mockForecastingData` with a call to `api.forecast.getSummary()` or a dedicated AI insights endpoint
3. **CommandCenter.jsx** -- Already uses API with mock fallback, acceptable for resilience
4. **Dead mock files** -- Delete `mockReconciliationData.js` and `mockARData.js`

---

## 5. Sidebar Pages -- Route Coverage

All 16 sidebar links map to valid routes in `App.jsx`:

| Sidebar Link | Route | Component | Loads? |
|-------------|-------|-----------|--------|
| Command Center | `/` | CommandCenter | YES (with mock fallback) |
| Revenue Analytics | `/analytics/revenue` | RevenueAnalyticsLayout | YES |
| Denial Analytics | `/analytics/denials` | DenialAnalyticsLayout | YES |
| Payment Intelligence | `/analytics/payments` | PaymentIntelligenceLayout | YES |
| Prevention | `/analytics/prevention` | PreventionDashboard | YES |
| Claims Pipeline | `/analytics/claims` | ClaimsPipelineLayout | YES |
| Claims Work Center | `/work/claims` | ClaimsWorkCenterLayout | YES |
| Denial Work Center | `/work/denials` | DenialWorkCenterLayout | YES |
| Collections Work Center | `/work/collections` | CollectionsWorkCenterLayout | YES |
| Payment Work Center | `/work/payments` | PaymentWorkCenterLayout | YES |
| Automation Dashboard | `/work/automation` | AutomationDashboard | YES |
| LIDA AI | `/intelligence/lida` | LidaLayout | YES |
| Revenue Forecast | `/intelligence/forecast` | RevenueForecast | YES |
| Simulation Engine | `/intelligence/simulation` | SimulationDashboard | YES |
| Patient Access | `/specialty/patient-access` | InsuranceLayout | YES |
| Coding & Charge | `/specialty/coding` | AICodingLayout | YES |
| EVV Home Health | `/specialty/evv` | EVVDashboard | YES |
| Settings | `/settings` | SettingsLayout | YES |

All imports in `App.jsx` resolve successfully (verified by clean build with 0 errors).

---

## 6. Code Quality Observations

| Check | Result |
|-------|--------|
| Broken imports | NONE (build passes cleanly) |
| console.error/warn in production code | 131 occurrences across 29 files (normal for error handling) |
| TODO/FIXME/HACK markers | NONE found |
| Duplicate component files | NONE |
| Env file (.env) | NOT PRESENT (using hardcoded default `http://localhost:8000/api/v1`) |
| Error boundaries | Not observed at route level |

---

## 7. Summary of Issues

### CRITICAL

1. **Wrong backend running on port 8000.** The uvicorn process is serving `/Users/prabakarannagarajan/Desktop/cloud copilot /apps/api` instead of `/Users/prabakarannagarajan/RCM Pulse/backend`. All 47 RCM API endpoints return HTTP 404. Frontend pages will render but show empty data or fallback to mocks.

### HIGH

2. **No .env file.** The API base URL is hardcoded to `http://localhost:8000/api/v1`. Create a `.env` file with `VITE_API_URL=http://localhost:8000/api/v1` for explicit configuration.

3. **Bundle size: 1,874 kB.** The entire app ships as a single chunk. Implement route-level code splitting with `React.lazy()`.

### MEDIUM

4. **2 pages still use hardcoded mock data** (`DenialPredictionAnalysis`, `AIInsightDetail`). These will not reflect live data even when the backend is running.

5. **2 dead mock data files** (`mockReconciliationData.js`, `mockARData.js`) should be deleted.

### LOW

6. **No React Error Boundaries** at the route level. A crash in one page could white-screen the entire app.

7. **No loading/error states visible** when API endpoints fail silently (many catch blocks return empty objects without showing user-facing error messages).

---

## 8. Recommended Next Steps

1. Kill the wrong uvicorn and start the RCM backend (see fix command in Section 1)
2. Create `.env` file in frontend root
3. Migrate `DenialPredictionAnalysis` and `AIInsightDetail` to use API calls
4. Delete dead mock files
5. Add `React.lazy()` code splitting in `App.jsx`
6. Add `<ErrorBoundary>` wrapper around route groups
7. Re-run this QA pass once the correct backend is serving on port 8000
