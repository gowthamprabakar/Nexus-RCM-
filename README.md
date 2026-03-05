# 🏥 RCM Pulse — AI-Native Revenue Cycle Management Platform

> **"Closed-Loop Revenue Intelligence"** — An enterprise-grade RCM platform that connects every step of the revenue cycle into a single, AI-powered operating system.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/gowthamprabakar/RCM-Pulse---Stitch-new-design-/releases/tag/v2.0.0)
[![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-61DAFB.svg)](#)
[![Backend](https://img.shields.io/badge/backend-FastAPI%20(Planned)-009688.svg)](#)
[![AI](https://img.shields.io/badge/AI-XGBoost%20%2B%20GPT--4%20(Planned)-orange.svg)](#)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#)

---

## 📖 What is RCM Pulse?

RCM Pulse is a comprehensive **Revenue Cycle Management** platform designed for healthcare organizations. It transforms fragmented RCM workflows into a unified, intelligent operating system that:

- **Predicts** claim denials before they happen
- **Automates** claim corrections and resubmissions
- **Monitors** every stage of the claim lifecycle in real time
- **Accelerates** collections with AI-powered propensity scoring
- **Reconciles** revenue automatically across payers and bank accounts
- **Explains** every insight with Explainable AI (XAI)

---

## 🏗️ Monorepo Structure

```
RCM Pulse/
├── frontend/          ← React + Vite SPA (ACTIVE — v2.0.0)
├── backend/           ← FastAPI microservices (PLANNED)
├── ai/                ← ML models & AI engine (PLANNED)
├── database/          ← PostgreSQL schemas & migrations (PLANNED)
├── connectors/        ← Payer, EHR, EVV integrations (PLANNED)
└── docs/              ← Architecture & technical docs
```

> **Current Status:** The **frontend is fully built** and running with mock data. Backend, AI, database, and connector layers are architecturally planned and ready for implementation.

---

## 🖥️ Frontend — Command Center V2

The frontend is a **React 18 + Vite** single-page application built with a feature-based architecture.

### Key Pages & Modules

| Module | Description | Route |
|---|---|---|
| 🏠 **Command Center** | Enterprise Revenue OS — 7-layer intelligence dashboard | `/` |
| 📋 **Claims** | Pre-batch scrub, work queue, validation, batch actions | `/claims` |
| 🚨 **Denial & Prevention** | Analytics, AI prediction, appeals, prevention workspace | `/denials` |
| 💰 **Collections** | AR aging, propensity scoring, action center, timeline | `/collections` |
| 🏦 **Finance & Reconciliation** | Revenue recon, bank match, payer performance | `/finance` |
| 🤖 **AI Coding** | CPT optimizer, audit, compliance, rulebook | `/ai-coding` |
| 📡 **EVV** | Visit monitoring, fraud detection, state mandates | `/evv` |
| 🔐 **Insurance** | Eligibility, prior auth, benefits analytics | `/insurance-verification` |
| 💬 **LIDA** | AI chat analytics, MECE reports, ticket hub | `/lida` |
| 🛠️ **Developer Tools** | AI model monitor, drift logs, schema explorer | `/developer` |
| ⚙️ **Admin & Settings** | Integrations, ETL, scheduler, billing rules | `/admin` |

### Frontend Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 5.1 | Build tool & dev server |
| React Router | 6.22 | Client-side routing |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 12.x | Animations |
| Recharts | 2.12 | Data visualization |
| Lucide React | 0.344 | Icons |

### Frontend Folder Structure

```
frontend/src/
├── components/
│   └── layout/            # Layout, Sidebar, Header
├── features/              # Feature-based modules
│   ├── admin/
│   ├── analytics/
│   ├── claims/
│   │   ├── components/    # Filter panels, badges, cards
│   │   └── pages/         # ClaimsOverview, WorkQueue, etc.
│   ├── coding/
│   ├── collections/
│   │   ├── components/    # Charts, modals, KPI cards
│   │   ├── data/          # mockARData.js
│   │   └── pages/
│   ├── dashboard/
│   │   └── pages/
│   │       ├── CommandCenter.jsx   ← Main home page
│   │       └── ExecutiveDashboard.jsx
│   ├── denials/
│   ├── developer/
│   ├── evv/
│   ├── finance/
│   │   └── components/    # ForecastChart, DailyAnalysisPanel
│   ├── insurance/
│   ├── lida/
│   ├── patients/
│   ├── reporting/
│   └── settings/
├── data/
│   └── synthetic/
│       ├── mockCommandCenterData.js  ← Command Center V2 data
│       ├── mockForecastingData.js    ← Revenue forecasting data
│       └── mockPreBatchData.js       ← Pre-batch scrub data
├── lib/
│   └── utils.js           # cn() utility
└── App.jsx                # Root routing
```

---

## 🚀 Getting Started (Frontend)

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/gowthamprabakar/RCM-Pulse---Stitch-new-design-.git
cd RCM-Pulse---Stitch-new-design-

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
# http://localhost:5173  (or 5174/5175 if ports are in use)
```

### Build for Production

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## 🧠 Command Center V2 — Architecture

The `CommandCenter.jsx` is a 7-layer intelligence dashboard:

```
Layer 1: Executive Pulse       → 5 real-time KPI cards
Layer 2: Lifecycle Flow        → Claim journey (Unbilled → Posted)
Layer 3: Operational Radar     → Bottleneck detection (Payer, Process, Team)
Layer 4: AI Intelligence       → Situational & Prescriptive AI insights
Layer 5: Performance           → Team velocity + automation stats
Layer 6: Action Center         → Active signals, tickets, auto-fix gauge
Layer 7: Unified Drill         → Every card navigates to its module page
```

---

## 🔮 Roadmap

### ✅ Phase 1 — Frontend (COMPLETE)
- [x] Command Center V2 (7 layers)
- [x] 15 feature modules with 100+ pages
- [x] Unified drill-through navigation
- [x] Mock data layer for all modules
- [x] Dark mode throughout

### 🔄 Phase 2 — Backend (IN PROGRESS)
- [ ] FastAPI setup & core auth service
- [ ] Claims, Denial, Collections APIs
- [ ] Finance & Reconciliation APIs
- [ ] LIDA chat service (LLM integration)

### 📅 Phase 3 — AI Engine
- [ ] Denial prediction model (XGBoost)
- [ ] Auto-fix engine (Rule + ML hybrid)
- [ ] Revenue forecasting (LSTM / Prophet)
- [ ] Propensity scoring

### 📅 Phase 4 — Integrations
- [ ] Availity clearinghouse connector
- [ ] Epic FHIR R4 integration
- [ ] EVV platform connectors (Sandata, HHAeXchange)
- [ ] Stripe payment integration

---

## 🗂️ Documentation

| Document | Description |
|---|---|
| [Architecture Overview](docs/architecture.md) | System design, request flow, key decisions |
| [Backend README](backend/README.md) | FastAPI setup, module list, API structure |
| [AI Engine README](ai/README.md) | ML models, stack, training pipeline |
| [Database README](database/README.md) | Schema design, entities, migration guide |
| [Connectors README](connectors/README.md) | Payer, EHR, EVV, payment integrations |

---

## 👥 Team & Contribution

### Working on this project?

1. **Frontend developers** → Start in `frontend/src/features/`
2. **Backend developers** → Read `backend/README.md` first
3. **AI/ML engineers** → Read `ai/README.md` first
4. **DevOps** → Docker configs coming in Phase 2

### Branch Strategy
```
main          ← Stable, versioned releases
dev           ← Active development (create PRs to this)
feature/xxx   ← Feature branches
fix/xxx       ← Bug fix branches
```

---

## 📦 Versioning

| Version | Date | Description |
|---|---|---|
| v2.0.0 | Mar 2026 | Full frontend implementation — 15 modules, Command Center V2 |
| v1.0.0 | Feb 2026 | Initial commit — base design system |

---

## 📄 License

Proprietary — All rights reserved. Contact the project owner for licensing inquiries.

---

<div align="center">
  Built with ❤️ by the RCM Pulse Team
</div>
