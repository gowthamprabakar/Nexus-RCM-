"""
LIDA Integration Router — Microsoft LIDA + Ollama Visualization
================================================================
GET  /lida/health              — Check LIDA + Ollama availability
GET  /lida/datasets            — List available RCM datasets
GET  /lida/summarize           — Summarize an RCM dataset
GET  /lida/goals               — Generate visualization goals
POST /lida/visualize           — Generate a visualization
POST /lida/ask                 — Answer a natural language question
"""

import httpx
import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.services import lida_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request schemas ──────────────────────────────────────────────────────────

class VisualizeRequest(BaseModel):
    dataset: str = "denials"
    question: Optional[str] = None


class AskRequest(BaseModel):
    question: str
    dataset: str = "auto"


# ── Dataset metadata ─────────────────────────────────────────────────────────

DATASET_DESCRIPTIONS = {
    "denials": "Denial records with CARC codes, root causes, payer info, and amounts",
    "payments": "ERA payment records with allowed/paid amounts and payer breakdowns",
    "claims": "Claim submissions with CRS scores, statuses, and payer details",
    "ar": "Accounts receivable — open claims with days outstanding",
    "reconciliation": "Bank reconciliation records with ERA vs deposit variances",
}


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/health")
async def lida_health():
    """Check if LIDA library and Ollama LLM are available."""
    lida_ok = lida_service.LIDA_AVAILABLE
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            ollama_ok = resp.status_code == 200
    except Exception:
        pass

    return {
        "lida_installed": lida_ok,
        "ollama_reachable": ollama_ok,
        "ready": lida_ok and ollama_ok,
    }


@router.get("/datasets")
async def list_datasets():
    """List available RCM datasets for LIDA analysis."""
    return {
        "datasets": [
            {"name": k, "description": v}
            for k, v in DATASET_DESCRIPTIONS.items()
        ]
    }


@router.get("/summarize")
async def summarize_dataset(
    dataset: str = Query("denials", description="Dataset to summarize"),
    db: AsyncSession = Depends(get_db),
):
    """Generate LIDA statistical summary of an RCM dataset."""
    if dataset not in DATASET_DESCRIPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {dataset}")
    return await lida_service.summarize_dataset(db, dataset)


@router.get("/goals")
async def generate_goals(
    dataset: str = Query("denials", description="Dataset to analyze"),
    n: int = Query(5, ge=1, le=10, description="Number of goals"),
    db: AsyncSession = Depends(get_db),
):
    """Generate visualization goals from RCM data."""
    if dataset not in DATASET_DESCRIPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {dataset}")
    return await lida_service.generate_goals(db, dataset, n)


@router.post("/visualize")
async def create_visualization(
    body: VisualizeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a visualization for a specific question or auto-selected goal."""
    if body.dataset not in DATASET_DESCRIPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {body.dataset}")
    return await lida_service.generate_visualization(db, body.dataset, body.question)


@router.post("/ask")
async def ask_question(
    body: AskRequest,
    db: AsyncSession = Depends(get_db),
):
    """Answer a natural language question about RCM data."""
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    return await lida_service.answer_question(db, body.question, body.dataset)


@router.get("/report/{report_type}")
async def get_report(
    report_type: str,
    payer_id: str = None,
    db: AsyncSession = Depends(get_db),
):
    """Get a pre-computed structured report from real DB data (no LLM calls)."""
    from app.services.report_templates import generate_report
    return await generate_report(db, report_type, payer_id)


class QuestionRequest(BaseModel):
    question: str


@router.post("/sql")
async def text_to_sql(body: QuestionRequest, db: AsyncSession = Depends(get_db)):
    """Convert natural language to SQL and execute against the real database."""
    from app.services.text_to_sql import generate_and_execute_sql
    return await generate_and_execute_sql(db, body.question)


@router.post("/root-cause-search")
async def root_cause_search(body: QuestionRequest, db: AsyncSession = Depends(get_db)):
    """Search for root causes based on a natural language WHY question."""
    from app.services.root_cause_search import search_root_cause
    return await search_root_cause(db, body.question)


class ChartRequest(BaseModel):
    dataset: str = "denials"
    question: str = "Show distribution"


@router.post("/chart")
async def generate_chart(
    body: ChartRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a chart directly without Q&A."""
    if body.dataset not in DATASET_DESCRIPTIONS:
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {body.dataset}")

    result = await lida_service.generate_visualization(db, body.dataset, body.question)

    # If generate_visualization already includes fallback, charts should be populated.
    # But if somehow still empty, try one more explicit fallback.
    if not result.get("charts"):
        df = await lida_service.get_rcm_dataframe(db, body.dataset)
        chart_b64 = await lida_service._generate_fallback_chart(df, body.question)
        if chart_b64:
            result["charts"] = [{"raster": chart_b64, "status": "fallback"}]

    return result
