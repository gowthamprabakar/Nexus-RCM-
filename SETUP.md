# NEXUS RCM — Setup Instructions

Stage-by-stage guide to get NEXUS RCM running locally or in production.

---

## Stage 1: Infrastructure

### Option A: Docker (Recommended)

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on port 5432
- **Redis** on port 6379

### Option B: Manual Install

```bash
# PostgreSQL
brew install postgresql@16   # macOS
sudo apt install postgresql  # Ubuntu

# Create database
psql -U postgres -c "CREATE DATABASE rcm_pulse;"

# Redis (optional)
brew install redis && brew services start redis
```

### Neo4j (Optional — system degrades gracefully without it)

```bash
# Docker
docker run -d --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/nexus-rcm-2026 \
  neo4j:5

# Or install locally: https://neo4j.com/download/
```

### Ollama (Optional — for AI insights)

```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull qwen3:4b
```

---

## Stage 2: Database Schema & Data

```bash
cd data

# Create virtual environment
python3 -m venv venv && source venv/bin/activate
pip install faker psycopg2-binary pandas

# Load schema
psql -U postgres -d rcm_pulse -f schema.sql

# Generate synthetic data (500K claims, 56K denials, etc.)
python3 generate_synthetic_data.py

# This creates CSV files in data/synthetic/ and loads them into PostgreSQL
```

**Expected output:**
```
claims: 500,000 rows
denials: 56,426 rows
appeals: 24,827 rows
era_payments: 315,486 rows
payer_master: 50 rows
providers: 200 rows
patients: 50,000 rows
```

---

## Stage 3: Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Environment variables (create .env or export)
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/rcm_pulse"
export NEO4J_URI="bolt://localhost:7687"        # Optional
export NEO4J_USER="neo4j"                       # Optional
export NEO4J_PASSWORD="nexus-rcm-2026"          # Optional
export REDIS_URL="redis://localhost:6379"        # Optional
export OLLAMA_BASE_URL="http://localhost:11434"  # Optional
export SECRET_KEY="your-secret-key-here"

# Seed additional data (root cause analysis, forecasts, etc.)
python3 seed_data.py

# Run the backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Verify:** Open http://localhost:8000/docs — you should see Swagger UI with all endpoints.

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL async connection string |
| `NEO4J_URI` | No | bolt://localhost:7687 | Neo4j connection |
| `NEO4J_USER` | No | neo4j | Neo4j username |
| `NEO4J_PASSWORD` | No | - | Neo4j password |
| `REDIS_URL` | No | redis://localhost:6379 | Redis connection |
| `OLLAMA_BASE_URL` | No | http://localhost:11434 | Ollama LLM endpoint |
| `SECRET_KEY` | No | auto-generated | JWT secret key |

---

## Stage 4: Neo4j Knowledge Graph (Optional)

```bash
cd backend
source venv/bin/activate

# Populate Neo4j with RCM ontology
python3 scripts/populate_neo4j.py
```

**Expected output:**
```
Nodes created: 425 (Payer: 50, Provider: 200, RootCause: 7, ...)
Relationships: 2,507 (HISTORICALLY_DENIES, USES_CARC, DENIED_FOR, ...)
```

---

## Stage 5: Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local

# Development server
npm run dev
```

**Verify:** Open http://localhost:5173 — you should see the NEXUS RCM dashboard.

### Production Build

```bash
npm run build
# Output in frontend/dist/
# Serve with any static file server (nginx, caddy, etc.)
```

---

## Stage 6: MiroFish Simulation Engine (Optional)

```bash
cd mirofish/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure (copy .env.example to .env and edit)
cp ../.env.example ../.env

# Run MiroFish
python3 run.py
```

MiroFish runs on port 8001 by default and connects to Neo4j for graph operations.

---

## Stage 7: Train ML Models

```bash
cd backend
source venv/bin/activate

python3 -c "
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

async def train_all():
    engine = create_async_engine(settings.DATABASE_URL)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # Denial Probability
        from app.ml.denial_probability import DenialProbabilityModel
        m1 = DenialProbabilityModel()
        print('Training denial probability...', await m1.train(db))

        # Appeal Success
        from app.ml.appeal_success import AppealSuccessModel
        m2 = AppealSuccessModel()
        print('Training appeal success...', await m2.train(db))

        # Payment Delay
        from app.ml.payment_delay import PaymentDelayModel
        m3 = PaymentDelayModel()
        print('Training payment delay...', await m3.train(db))

        # Payer Anomaly
        from app.ml.payer_anomaly import PayerAnomalyModel
        m4 = PayerAnomalyModel()
        print('Training payer anomaly...', await m4.train(db))

        # Propensity to Pay
        from app.ml.propensity_to_pay import PropensityToPayModel
        m5 = PropensityToPayModel()
        print('Training propensity...', await m5.train(db))

        # Write-Off
        from app.ml.write_off_model import WriteOffModel
        m6 = WriteOffModel()
        print('Training write-off...', await m6.train(db))

        # CARC Prediction
        from app.ml.carc_prediction import CARCPredictionModel
        m7 = CARCPredictionModel()
        print('Training CARC prediction...', await m7.train(db))

    await engine.dispose()
    print('All models trained.')

asyncio.run(train_all())
"
```

Models are saved to `backend/app/ml/saved_models/` and auto-loaded on prediction requests.

---

## Stage 8: Verify Everything Works

```bash
# 1. Backend health
curl http://localhost:8000/api/v1/admin/system-health | python3 -m json.tool

# 2. Claims endpoint
curl http://localhost:8000/api/v1/claims?page=1&size=5 | python3 -m json.tool

# 3. Prediction endpoint
curl http://localhost:8000/api/v1/predictions/denial-probability/CLM0000001 | python3 -m json.tool

# 4. Compliance
curl http://localhost:8000/api/v1/compliance/summary | python3 -m json.tool

# 5. Dashboard KPIs
curl http://localhost:8000/api/v1/dashboard/summary | python3 -m json.tool

# 6. Frontend
open http://localhost:5173
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: sqlalchemy` | Activate venv: `source backend/venv/bin/activate` |
| `Connection refused` on port 5432 | Start PostgreSQL: `docker-compose up -d` |
| Frontend shows "Network Error" | Check `VITE_API_URL` in `frontend/.env.local` |
| Neo4j warnings in logs | Normal — Neo4j is optional, system degrades gracefully |
| ML prediction returns fallback | Train models first (Stage 7) |
| Ollama timeout | Ensure model is pulled: `ollama pull qwen3:4b` |

---

## Production Deployment Notes

1. **Database:** Use managed PostgreSQL (AWS RDS, GCP Cloud SQL)
2. **Frontend:** Build with `npm run build`, serve via CDN/nginx
3. **Backend:** Run with gunicorn: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`
4. **Redis:** Use managed Redis (ElastiCache, Memorystore)
5. **Neo4j:** Use Neo4j Aura or self-hosted cluster
6. **ML Models:** Train on production data, store artifacts in S3/GCS
7. **Environment:** Never commit `.env` files — use secrets management
