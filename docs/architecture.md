# RCM Pulse — System Architecture

## High Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        RCM PULSE PLATFORM                        │
│                  "Closed-Loop Revenue Intelligence"              │
└──────────────────────────────────────────────────────────────────┘

       ┌─────────────────────────────────────────────┐
       │              FRONTEND (React + Vite)         │
       │  Command Center V2 → 15 Feature Modules      │
       └─────────────────┬───────────────────────────┘
                         │ REST / WebSocket
       ┌─────────────────▼───────────────────────────┐
       │              BACKEND (FastAPI)               │
       │  Claims · Denials · Collections · Finance    │
       │  EVV · Insurance · LIDA · Auth · Admin       │
       └──────┬──────────────────────┬───────────────┘
              │                      │
    ┌─────────▼──────┐    ┌──────────▼──────────────┐
    │   AI ENGINE    │    │     DATABASE LAYER       │
    │  Denial Pred.  │    │  PostgreSQL + Redis      │
    │  Auto-Fix      │    │  TimescaleDB             │
    │  Forecasting   │    │  Elasticsearch           │
    │  LIDA Chat     │    └─────────────────────────┘
    └────────────────┘
              │
    ┌─────────▼──────────────────────────────────────┐
    │               CONNECTORS LAYER                  │
    │  Clearinghouses · EHR/EMR · EVV · Payments      │
    │  Government APIs (CMS, Medicaid)               │
    └────────────────────────────────────────────────┘
```

## Request Flow
1. User interacts with **Frontend** (React SPA)
2. Frontend calls **Backend API** (FastAPI REST endpoints)
3. Backend processes business logic, calls **AI Engine** for predictions
4. Data is read/written to **Database** (PostgreSQL + Redis cache)
5. External data flows through **Connectors** (payers, EHR, EVV platforms)
6. AI feedback loop updates models based on real outcomes

## Key Design Decisions
- **Feature-based frontend architecture** — Each RCM domain is a self-contained feature folder
- **Mock data layer** — All frontend modules have mock data files for development without a live backend
- **Drill-through navigation** — Every metric on the Command Center navigates to the relevant module
- **AI-native** — AI predictions are first-class citizens, not bolted-on features
