# Implementation Plan: NEXUS RCM Intelligence Platform

**Branch**: `nexus-rcm-platform` | **Date**: 2026-03-26 | **Spec**: `spec.md`
**Input**: Feature specification from `.specify/features/nexus-rcm-platform/spec.md`

## Summary

NEXUS RCM is a healthcare Revenue Cycle Management intelligence platform implementing a three-layer architecture: Analytics (what happened and why), Automation (fix it), and Prevention (stop it before it happens). The platform serves RCM Directors, Denial Analysts, Payment Posters, Collections Specialists, and CFOs with claim-level truth computed from 500K claims in PostgreSQL, surfaced through a React frontend with contextual investigation panels and graph drill-down.

## Technical Context

**Language/Version**: Python 3.14 (backend), JavaScript/React 18 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy async, React, Vite, Tailwind CSS
**Storage**: PostgreSQL (500K claims, 56K denials, 315K ERA payments, 50 payers, 200 providers, 800 contract rates)
**Testing**: pytest (backend), manual QA with real API verification (frontend)
**Target Platform**: Web application (desktop browsers)
**Project Type**: Full-stack web application (SPA + REST API)
**Performance Goals**: <2s p95 page load, <500ms API response, 5-level drill-down in <1s
**Constraints**: All data from PostgreSQL (no mock data), Ollama LLM local only (no cloud AI), dark theme with th-* design tokens
**Scale/Scope**: 50+ API endpoints, 40+ frontend pages, 9 services, 12+ database tables

## Constitution Check

*GATE: All seven principles verified against implementation plan.*

| Principle | Status | Verification |
|-----------|--------|-------------|
| I. Claim-Level Truth | PASS | All KPIs computed from claim-level SQL aggregation. Root cause engine uses independent evidence (eligibility, auth, coding) not payer labels. |
| II. Three-Layer Architecture | PASS | Analytics (Revenue/Denial/Payment/Claims pages), Automation (7 rules with approve/reject), Prevention (timely filing/eligibility/auth - P3). No feature spans layers. |
| III. Graph Connectivity | PASS | graph_query_service provides 5-level drill-down via claim_id JOINs: Revenue -> Payer -> Category -> Root Cause -> Claim -> Full Context. |
| IV. AI With Evidence | PASS | Ollama prompts receive real database statistics. LLM writes narrative only. MECE badges earned by backing engine. |
| V. One Voice Per Page | PASS | Maximum ONE AI insight section per page. 35 AI sections consolidated to 1 per page (completed). |
| VI. Contextual Investigation | PASS | Investigation panels open FROM the page as overlays. No standalone "Root Cause Page" in sidebar. |
| VII. Real Data Only | PASS | Pipeline: Loading skeleton -> Real API data -> FALLBACK_* constants only in catch blocks. No hardcoded fake data. |

## Project Structure

### Documentation (this feature)

```text
.specify/features/nexus-rcm-platform/
├── spec.md              # Feature specification (user stories, requirements)
├── plan.md              # This file (implementation plan)
└── tasks.md             # Task breakdown (done + next)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/v1/              # 15 API routers
│   │   ├── analytics.py     # Revenue analytics, KPI aggregation
│   │   ├── ar.py            # AR aging with root cause overlays
│   │   ├── claims.py        # Claims pipeline, lifecycle tracking
│   │   ├── collections.py   # Collections queue, aged accounts
│   │   ├── collections_extended.py  # Extended collections features
│   │   ├── crs.py           # Claim Risk Score computation
│   │   ├── denials.py       # Denial analytics, CARC analysis
│   │   ├── diagnostics.py   # Diagnostic findings, automation actions
│   │   ├── forecast.py      # Revenue forecast (30/60/90 day)
│   │   ├── graph.py         # 5-level graph drill-down
│   │   ├── payments.py      # Payment intelligence, ADTP
│   │   ├── reconciliation.py # ERA-Bank reconciliation
│   │   ├── root_cause.py    # Root cause analysis endpoints
│   │   ├── ai.py            # Ollama LLM integration
│   │   └── auth.py          # Authentication
│   ├── services/            # 9 business logic services
│   │   ├── root_cause_service.py      # Zero-prior 7-step evidence chain
│   │   ├── graph_query_service.py     # 5-level claim_id JOIN drill-down
│   │   ├── automation_engine.py       # 7 rules, diagnostic-triggered evaluation
│   │   ├── diagnostic_service.py      # Anomaly detection, threshold evaluation
│   │   ├── triangulation_service.py   # Cross-source data correlation
│   │   ├── adtp_service.py            # Average Days To Pay computation
│   │   ├── ai_insights.py             # Ollama prompt construction + response parsing
│   │   ├── appeal_generator.py        # Denial appeal letter generation
│   │   └── crs.py                     # Claim Risk Score model
│   └── models/              # SQLAlchemy async models
│       ├── claims.py        # claims table (500K records)
│       ├── denials.py       # denials table (56K records)
│       ├── era_payments.py  # era_payments table (315K records)
│       ├── bank_reconciliation.py  # Bank deposit matching
│       ├── eligibility_271.py      # Insurance verification responses
│       ├── prior_auth.py           # Prior authorization records
│       ├── claim_lines.py          # CPT-level claim detail
│       ├── payer_master.py         # 50 payers
│       ├── providers.py            # 200 providers
│       ├── root_cause_analysis.py  # 7-step evidence chains (56K backfilled)
│       ├── payer_contract_rate.py  # Expected payment rates (800 records)
│       └── automation_actions.py   # Rule evaluation audit trail
└── tests/

frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx        # Main layout wrapper
│   │   │   └── Sidebar.jsx       # 15-item navigation (restructured from 55)
│   │   └── shared/               # Reusable UI components
│   ├── features/
│   │   ├── analytics/
│   │   │   ├── layouts/
│   │   │   │   ├── RevenueAnalyticsLayout.jsx    # 4-tab revenue container
│   │   │   │   ├── DenialAnalyticsLayout.jsx     # 4-tab denial container
│   │   │   │   ├── PaymentIntelligenceLayout.jsx # 4-tab payment container
│   │   │   │   └── ClaimsPipelineLayout.jsx      # Claims lifecycle container
│   │   │   └── pages/
│   │   │       ├── ARAgingPage.jsx               # AR aging with root cause
│   │   │       ├── RootCauseIntelligence.jsx     # Root cause drill-down
│   │   │       ├── CashFlowPage.jsx              # Cash flow tracking
│   │   │       └── ADTPMonitor.jsx               # Average Days To Pay
│   │   ├── dashboard/pages/
│   │   │   ├── CommandCenter.jsx                 # Unified overview
│   │   │   └── ExecutiveDashboard.jsx            # Executive metrics
│   │   ├── denials/pages/
│   │   │   ├── DenialAnalytics.jsx               # Denial overview
│   │   │   ├── PayerVariance.jsx                 # Payer pattern analysis
│   │   │   ├── DenialManagement.jsx              # Denial work queue
│   │   │   └── AppealGenerator.jsx               # Appeal letter creation
│   │   ├── payments/pages/
│   │   │   ├── PaymentDashboard.jsx              # Payment overview
│   │   │   ├── ERABankRecon.jsx                  # ERA-Bank reconciliation
│   │   │   ├── ContractAudit.jsx                 # Contract rate audit
│   │   │   └── ERAProcessing.jsx                 # ERA processing queue
│   │   ├── claims/pages/
│   │   │   ├── ClaimsOverview.jsx                # Claims pipeline
│   │   │   ├── ClaimsWorkQueue.jsx               # Claims work center
│   │   │   └── ScrubDashboard.jsx                # Pre-submission scrub
│   │   ├── collections/pages/
│   │   │   ├── CollectionsQueue.jsx              # Collections work center
│   │   │   └── AlertsQueue.jsx                   # Collection alerts
│   │   ├── workcenters/
│   │   │   ├── layouts/                          # Work center tab containers
│   │   │   └── pages/AutomationDashboard.jsx     # Automation rule management
│   │   ├── intelligence/pages/
│   │   │   └── RevenueForecast.jsx               # 3-layer forecast
│   │   └── lida/pages/
│   │       ├── LidaDashboard.jsx                 # LIDA overview
│   │       └── LidaChat.jsx                      # AI conversational interface
│   └── App.jsx               # Route definitions (100+ routes)
└── tests/
```

**Structure Decision**: Web application with separate `backend/` and `frontend/` directories. Backend follows FastAPI convention with `api/v1/` routers, `services/` for business logic, and `models/` for SQLAlchemy. Frontend follows feature-based organization with `features/[domain]/pages/` and shared `components/layout/`.

## Architecture Decisions

### 1. Zero-Prior Root Cause Analysis

The root cause engine does NOT use payer-provided denial categories as input. It examines 7 independent evidence sources (eligibility status, auth timeline, coding complexity, payer history, submission gaps, contract terms, provider patterns) and produces its own root cause determination with confidence scores. This prevents circular reasoning where the system confirms what the payer already told it.

**Implementation**: `root_cause_service.py` with 56K backfilled analysis records in `root_cause_analysis` table.

### 2. Graph Drill-Down via claim_id JOINs

All drill-down paths traverse real SQL JOINs through claim_id, not pre-aggregated summaries displayed in sequence. The graph_query_service accepts a level (1-5) and parent context, returning the next level of aggregation with real counts and dollar amounts.

**Levels**: Revenue Total -> Payer -> Denial Category -> Root Cause -> Individual Claim -> Full Context (denial + RCA + ERA + eligibility + auth + CPT lines)

**Implementation**: `graph_query_service.py` with parameterized SQL queries per level.

### 3. Three-Layer Model

Every feature maps to exactly one layer. The layers feed forward:
- **Layer 1 (Analytics)**: Descriptive KPIs, root cause analysis, diagnostic findings. 187 metrics from RCM Bible Part 1.
- **Layer 2 (Automation)**: 7 rules (expanding to 20+) with diagnostic-triggered evaluation, Tier 1-4 human involvement. From RCM Bible Part 5A.
- **Layer 3 (Prevention)**: Pre-submission CRS scoring, timely filing alerts, eligibility re-verification, auth expiration monitoring. From RCM Bible Part 5B. Not yet built.

### 4. AI With Evidence Pattern

Ollama prompts are constructed by injecting real database statistics into a structured template. The LLM writes narrative text only. The prompt includes the actual numbers; the LLM arranges them into readable prose. This ensures zero fabricated statistics.

**Implementation**: `ai_insights.py` constructs prompts with `{metric}: {value}` pairs from SQL queries, sends to Ollama, parses response.

### 5. Contextual Investigation (Not Page Navigation)

Investigation panels are slide-in overlays triggered by clicking a KPI on the current page. They are NOT separate routes in the sidebar. This keeps the user in context while drilling deeper.

**Implementation**: React overlay component that receives the clicked KPI context and renders the graph drill-down within the current page.

## Key Services Detail

| Service | Purpose | Inputs | Outputs |
|---------|---------|--------|---------|
| root_cause_service | Zero-prior 7-step evidence chain analysis | claim_id, denial record | Root cause determination with confidence scores per factor |
| graph_query_service | 5-level drill-down via claim_id JOINs | level, parent_context, filters | Next-level aggregation with counts and dollar amounts |
| automation_engine | Rule evaluation and action generation | diagnostic_findings, rule_config | Proposed actions with tier classification and audit entries |
| diagnostic_service | Anomaly detection and threshold evaluation | metric_values, thresholds | Diagnostic findings with severity and recommended action |
| triangulation_service | Cross-source data correlation | claim_id, data_sources[] | Correlated view across ERA, eligibility, auth, claim lines |
| adtp_service | Average Days To Pay computation | payer, date_range | ADTP by payer with trend and forecast |
| ai_insights | Ollama prompt construction and response | page_context, db_statistics | Narrative AI insight backed by real numbers |
| appeal_generator | Denial appeal letter generation | denial_record, root_cause | Draft appeal letter with evidence citations |
| crs | Claim Risk Score computation | claim_record, eligibility, auth | CRS score (0-1) with risk factor breakdown |

## Database Schema Summary

| Table | Records | Key Columns | Primary Relationships |
|-------|---------|-------------|----------------------|
| claims | 500K | claim_id (PK), payer_id, provider_id, dos, total_charges, status | Links to all other tables via claim_id |
| denials | 56K | denial_id (PK), claim_id (FK), carc_code, rarc_code, denial_date, denied_amount | claim_id -> claims |
| era_payments | 315K | era_id (PK), claim_id (FK), check_number, payer_id, paid_amount, adjustment_codes | claim_id -> claims, matched to bank_reconciliation |
| bank_reconciliation | varies | recon_id (PK), deposit_date, deposit_amount, matched_era_ids, match_status | Links to era_payments |
| eligibility_271 | varies | elig_id (PK), claim_id (FK), subscriber_status, coverage_type, deductible_remaining | claim_id -> claims |
| prior_auth | varies | auth_id (PK), claim_id (FK), auth_number, expiration_date, approved_units | claim_id -> claims |
| claim_lines | varies | line_id (PK), claim_id (FK), cpt_code, modifier, units, line_charge | claim_id -> claims |
| payer_master | 50 | payer_id (PK), payer_name, payer_type, network_status | Referenced by claims, era_payments |
| providers | 200 | provider_id (PK), provider_name, npi, specialty | Referenced by claims |
| root_cause_analysis | 56K | rca_id (PK), claim_id (FK), root_cause_code, confidence_score, evidence_chain | claim_id -> claims |
| payer_contract_rate | 800 | rate_id (PK), payer_id, cpt_code, expected_rate, effective_date | payer_id -> payer_master |
| automation_actions | varies | action_id (PK), rule_id, claim_id (FK), action_type, status, approved_by, timestamp | claim_id -> claims |

## Complexity Tracking

No constitution violations identified. All architectural decisions align with the seven principles.
