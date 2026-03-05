# RCM Pulse — Backend Service

## Overview
The backend is a **Python (FastAPI)** microservices architecture responsible for:
- Business logic & API endpoints for all RCM modules
- Authentication & authorization (JWT / OAuth2)
- Event-driven processing (denials, retries, alerts)
- Integration with the AI engine and database layer

---

## Planned Stack
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| Auth | JWT + OAuth2 |
| Task Queue | Celery + Redis |
| Caching | Redis |
| API Docs | Swagger UI (auto via FastAPI) |
| Testing | Pytest |

---

## Folder Structure (Planned)
```
backend/
├── app/
│   ├── api/           # Route handlers (v1/)
│   ├── core/          # Config, auth, middleware
│   ├── models/        # Pydantic models / schemas
│   ├── services/      # Business logic
│   ├── db/            # DB session + ORM models
│   └── main.py        # FastAPI app entry point
├── tests/
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## Modules to Implement
- [ ] Claims Service — CRUD, scrubbing, batch actions
- [ ] Denial Service — Detection, appeal generation, retry logic
- [ ] Collections Service — AR aging, propensity scoring
- [ ] Finance Service — Reconciliation, payer performance
- [ ] EVV Service — Visit tracking, fraud detection
- [ ] Insurance Service — Eligibility, prior auth, benefits
- [ ] LIDA Service — AI chat, report generation, ticket management
- [ ] Command Center Service — Aggregated real-time snapshot
- [ ] Auth Service — Login, roles, permissions

---

## Getting Started (Once Implemented)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```
