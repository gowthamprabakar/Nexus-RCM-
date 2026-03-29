# NEXUS RCM v3.0 — AI-Powered Revenue Cycle Management Platform

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](#)
[![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-61DAFB.svg)](#)
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20PostgreSQL-009688.svg)](#)
[![AI](https://img.shields.io/badge/AI-14%20ML%20Models-orange.svg)](#)
[![Graph](https://img.shields.io/badge/graph-Neo4j%20%2B%20MiroFish-purple.svg)](#)

> Closed-loop revenue intelligence: from analytics to automation to prevention.

NEXUS RCM is an enterprise-grade healthcare Revenue Cycle Management platform that uses AI, graph databases, and multi-agent simulation to eliminate preventable revenue loss. It covers the complete claim lifecycle from pre-submission scrubbing through denial management, payment reconciliation, collections, and compliance monitoring.

---

## Architecture

```
                          NEXUS RCM v3.0
    ┌──────────────────────────────────────────────────┐
    │                   FRONTEND                        │
    │   React 18 + Vite + Tailwind CSS + Recharts      │
    │   18 Feature Modules | 143 Pages | 29 Components │
    └───────────────────────┬──────────────────────────┘
                            │ REST API
    ┌───────────────────────┴──────────────────────────┐
    │                   BACKEND                         │
    │   FastAPI + SQLAlchemy + AsyncPG                  │
    │   27 API Routers | 38 Services | 14 ML Models    │
    ├──────────┬────────────┬────────────┬─────────────┤
    │ PostgreSQL│   Neo4j    │   Ollama   │   Redis     │
    │ 22 Tables │ 425 Nodes  │ LLM Engine │   Cache     │
    │ 980K+ Rows│ 2507 Rels  │ Qwen3/Llama│             │
    └──────────┴────────┬───┴────────────┴─────────────┘
                        │
    ┌───────────────────┴──────────────────────────────┐
    │               MIROFISH ENGINE                     │
    │   Multi-Agent Simulation + Graph Builder          │
    │   Payer Behavior Modeling | What-If Scenarios     │
    └──────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Framer Motion | SPA with 18 feature modules |
| Backend | Python 3.14, FastAPI, SQLAlchemy 2.0, AsyncPG | Async API with 100+ endpoints |
| Database | PostgreSQL 16 | Primary datastore (22 tables, 980K+ rows) |
| Graph DB | Neo4j 5.x | Knowledge graph (425 nodes, 2507 relationships) |
| ML/AI | scikit-learn, Prophet, XGBoost, Ollama | 14 ML models + LLM insights |
| Simulation | MiroFish (custom) | Multi-agent payer behavior simulation |
| Cache | Redis | Session + query caching |
| Infra | Docker, Docker Compose | Container orchestration |

---

## Project Structure

```
nexus-rcm/
├── frontend/                    # React 18 SPA
│   ├── src/
│   │   ├── features/            # 18 feature modules
│   │   │   ├── analytics/       # Descriptive analytics, root cause, payer variance
│   │   │   ├── claims/          # Claims management, scrubbing, batch actions
│   │   │   ├── collections/     # Collections queue, propensity scoring
│   │   │   ├── dashboard/       # Command center, executive dashboard
│   │   │   ├── denials/         # Denial management, appeals, prevention
│   │   │   ├── payments/        # ERA processing, reconciliation, contracts
│   │   │   ├── coding/          # AI coding audit, compliance
│   │   │   ├── evv/             # Electronic Visit Verification
│   │   │   ├── insurance/       # Patient access, prior auth, benefits
│   │   │   ├── intelligence/    # Revenue forecast, simulation
│   │   │   ├── lida/            # AI-native visual analytics
│   │   │   └── ...              # admin, developer, finance, reporting, settings
│   │   ├── components/
│   │   │   ├── predictions/     # 8 AI prediction badge components
│   │   │   ├── ui/              # 18 reusable UI components
│   │   │   └── layout/          # Navigation, sidebar, header
│   │   └── services/
│   │       └── api.js           # Centralized API client (all endpoints)
│   └── package.json
│
├── backend/                     # FastAPI Application
│   ├── app/
│   │   ├── main.py              # App init, lifespan, router registration
│   │   ├── core/                # Config, deps, security
│   │   ├── models/              # 10 SQLAlchemy ORM models
│   │   ├── schemas/             # 8 Pydantic request/response schemas
│   │   ├── api/v1/              # 27 API routers
│   │   ├── services/            # 38 business logic services
│   │   └── ml/                  # 14 Machine Learning models
│   ├── scripts/                 # Data seeding, Neo4j population
│   └── requirements.txt
│
├── mirofish/                    # Multi-Agent Simulation Engine
│   ├── backend/app/             # Graph, report, simulation services
│   └── frontend/                # MiroFish UI
│
├── data/                        # Synthetic Data Generation
│   ├── generate_synthetic_data.py
│   ├── schema.sql               # Full PostgreSQL schema
│   └── synthetic/               # CSV files (regenerate with script)
│
├── docs/                        # Documentation (25+ files)
│   ├── PRD-nexus-rcm.md         # Product Requirements
│   ├── bible-1 through bible-5  # RCM Knowledge Base
│   ├── market-research-competitor-analysis.md
│   └── speckit-analysis.md      # System audit
│
├── docker-compose.yml           # PostgreSQL + Redis
├── NEXUS_RCM_BUILD_REPORT.md    # Build status & test results
└── NEXUS_RCM_REMAINING_WORK_PLAN.md  # Implementation roadmap
```

---

## Setup Guide

> See [SETUP.md](SETUP.md) for detailed stage-by-stage instructions.

### Prerequisites

- Python 3.12+ (3.14 recommended)
- Node.js 18+ and npm
- PostgreSQL 16
- Neo4j 5.x (optional — graceful degradation)
- Redis (optional — for caching)
- Ollama (optional — for AI insights)

### Quick Start

```bash
# 1. Clone
git clone https://github.com/gowthamprabakar/Nexus-RCM-.git
cd Nexus-RCM-

# 2. Start infrastructure
docker-compose up -d

# 3. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 for the UI, http://localhost:8000/docs for API docs.

---

## Core Pipeline

```
Data (980K+ records in PostgreSQL)
  |
  v
Analytics (11-step Bayesian RCA, 15 root cause categories)
  |
  v
Investigation (SQL + Neo4j graph evidence + ML predictions)
  |
  v
Suggestion (ranked by expected_value = probability x impact)
  |
  v
Validation (MiroFish agent consensus, 3s timeout, graceful degradation)
  |
  v
Auto-Execute (confidence >= 85%) or Queue (human approval)
  |
  v
Track Outcome (appeal win/loss, recovered $, prediction accuracy)
  |
  v
Neo4j Feedback Loop (update graph, recalibrate models)
```

---

## Key Features

### ML Prediction Layer (14 Models)

| Model | Algorithm | Target |
|-------|-----------|--------|
| Denial Probability | GBM, 25 features | AUC > 0.71 |
| Appeal Success | GBM, 11 features | Recommendation: APPEAL/NEGOTIATE/WRITE_OFF |
| Payment Delay | GBM Regressor | RMSE < 7 days |
| Payer Anomaly | Isolation Forest | <5% false positive |
| Propensity-to-Pay | GBM Classifier | AUC > 0.80 |
| Write-Off Risk | GBM Classifier | AUC > 0.82 |
| Provider Risk | Composite (0-100) | Correlation > 0.6 |
| CARC Prediction | Multi-label GBM | Top-3 > 85% |
| Revenue Forecast | Prophet + 3-Layer | MAPE < 10% |
| Composite Scores | Calculated | Payer health, org health, claim value |

### Automation Engine (15 Rules)
- Root cause classification, appeal generation, ERA posting
- Collection prioritization ($515M impact), claim resubmission ($69M)
- Payer spike alerts, SLA escalation, duplicate detection
- Human-in-the-Loop ramp: Learning (30d) -> Supervised (90d) -> Autonomous

### Compliance Engine
- FCA (False Claims Act) risk scoring (0-100)
- Over-coding detection vs national specialty benchmarks
- OIG/RAC audit target early warning
- Provider coding pattern analysis

### Prevention Layer
- Eligibility risk, prior auth expiry, timely filing
- Duplicate claim detection, high-risk payer+CPT combos

---

## API Reference

Backend: `http://localhost:8000` | Docs: `http://localhost:8000/docs`

| Prefix | Endpoints | Description |
|--------|-----------|-------------|
| `/api/v1/claims` | 8 | Claims CRUD, search, analytics |
| `/api/v1/denials` | 10 | Denial management, root cause |
| `/api/v1/predictions` | 12 | ML predictions, pipeline, outcomes |
| `/api/v1/automation` | 8 | Rules, actions, approvals, audit trail |
| `/api/v1/forecast` | 8 | Revenue forecasting |
| `/api/v1/compliance` | 4 | FCA risk, overcoding, audit risk |
| `/api/v1/coding` | 4 | Coding audit, suggestions |
| `/api/v1/patient-access` | 4 | Eligibility, prior auth, benefits |
| `/api/v1/dashboard` | 1 | Aggregated KPIs |
| `/api/v1/simulation` | 9 | What-if scenarios |
| `/api/v1/admin` | 3 | System health, ETL status |

---

## Database

22 PostgreSQL tables covering the full revenue cycle:

| Table | Records | Description |
|-------|---------|-------------|
| claims | 500,000 | Core claim records |
| denials | 56,426 | Denial records with CARC codes |
| appeals | 24,827 | Appeal lifecycle tracking |
| era_payments | 315,486 | Electronic remittance |
| root_cause_analysis | 84,000 | RCA results |
| payer_master | 50 | Payer configuration |
| providers | 200 | Provider profiles |
| patients | 50,000 | Patient demographics |

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| **v3.0.0** | 2026-03-29 | 8 ML models, MiroFish validation gate, HITL framework, compliance engine, 7 API routers, 8 prediction components |
| v2.5.0 | 2026-03-29 | Neo4j integration, real automation execution, outcome tracking, investigation pipeline |
| v2.0.0 | 2026-03-27 | Full feature implementation: 68 pages, 83 endpoints, real API wiring |
| v1.0.0 | 2026-03-25 | Initial release with Stitch Design |

---

## Documentation

| Document | Location |
|----------|----------|
| Product Requirements | [docs/PRD-nexus-rcm.md](docs/PRD-nexus-rcm.md) |
| Build Report | [NEXUS_RCM_BUILD_REPORT.md](NEXUS_RCM_BUILD_REPORT.md) |
| Remaining Work Plan | [NEXUS_RCM_REMAINING_WORK_PLAN.md](NEXUS_RCM_REMAINING_WORK_PLAN.md) |
| Market Research | [docs/market-research-competitor-analysis.md](docs/market-research-competitor-analysis.md) |
| Setup Instructions | [SETUP.md](SETUP.md) |
| RCM Knowledge Base | [docs/bible-1 through bible-5](docs/) |

---

## License

Proprietary. All rights reserved.
