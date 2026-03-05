# RCM Pulse — Database Layer

## Overview
The database layer manages all persistent storage for the RCM platform, including structured claim data, financial records, audit trails, and AI feedback loops.

---

## Planned Stack
| Layer | Technology |
|---|---|
| Primary DB | PostgreSQL 15+ |
| Time-Series | TimescaleDB (built on Postgres) |
| Cache / Session | Redis |
| Search | Elasticsearch |
| Migrations | Alembic |
| ORM | SQLAlchemy 2.0 |

---

## Folder Structure (Planned)
```
database/
├── migrations/          # Alembic migration files
├── schemas/             # SQL DDL scripts per domain
│   ├── claims.sql
│   ├── denials.sql
│   ├── collections.sql
│   ├── finance.sql
│   ├── evv.sql
│   ├── insurance.sql
│   └── audit.sql
├── seeds/               # Sample data for dev/testing
├── stored_procedures/   # Complex query logic
└── README.md
```

---

## Core Entities
| Entity | Description |
|---|---|
| `claims` | Claim lifecycle, status, payer, CPT codes |
| `denials` | Denial records, reason codes, appeals |
| `payers` | Payer master, rules, adjudication history |
| `patients` | Patient demographics, account info |
| `ar_aging` | AR aging buckets, collection history |
| `transactions` | Financial postings, reconciliation records |
| `evv_visits` | Visit records, GPS data, anomalies |
| `ai_feedback` | Model predictions and outcomes (learning loop) |
| `audit_trail` | Immutable log of all system actions |

---

## Getting Started (Once Implemented)
```bash
cd database
# Start Postgres locally (or use Docker)
docker-compose up -d
# Run migrations
alembic upgrade head
# Seed dev data
python seeds/seed_dev.py
```
