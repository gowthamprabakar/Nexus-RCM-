"""
Pydantic schemas for ERA Processing endpoints.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# ── CARC / RARC ──────────────────────────────────────────────────────────────
class CarcCodeOut(BaseModel):
    code:        str
    description: str
    category:    str
    group_code:  Optional[str] = None

    class Config:
        from_attributes = True


class RarcCodeOut(BaseModel):
    code:        str
    description: str
    category:    str

    class Config:
        from_attributes = True


# ── ERA Import (file upload + staging) ────────────────────────────────────────
class EraImportRowError(BaseModel):
    row:    int
    error:  str
    raw:    Optional[dict[str, Any]] = None


class EraImportStagedRow(BaseModel):
    staging_id:     str
    era_id:         Optional[str] = None
    claim_id:       Optional[str] = None
    payer_id:       Optional[str] = None
    payment_amount: float
    payment_date:   Optional[date] = None
    check_number:   Optional[str] = None


class EraImportResponse(BaseModel):
    filename:    str
    format:      str                  # "x12_835" | "csv"
    total_rows:  int
    valid_rows:  int
    error_rows:  int
    errors:      list[EraImportRowError] = []
    staged_ids:  list[str] = []
    preview:     list[EraImportStagedRow] = []


# ── Exception Resolution ──────────────────────────────────────────────────────
ExceptionAction = Literal["accept", "reject", "escalate", "manual_match"]


class EraExceptionUpdate(BaseModel):
    action:           ExceptionAction
    notes:            Optional[str] = None
    target_claim_id:  Optional[str] = None


class EraExceptionResult(BaseModel):
    era_id:           str
    status:           str
    exception_notes:  Optional[str] = None
    target_claim_id:  Optional[str] = None
    updated:          bool
    message:          str


# ── Match Candidates ──────────────────────────────────────────────────────────
class MatchCandidate(BaseModel):
    claim_id:        str
    patient_name:    Optional[str] = None
    payer_id:        Optional[str] = None
    billed:          float = 0.0
    allowed:         Optional[float] = None
    date_of_service: Optional[date] = None
    confidence:      int = Field(ge=0, le=100)
    match_reasons:   list[str] = []


class MatchCandidatesResponse(BaseModel):
    era_id:        str
    payment_amount: float
    payer_id:       Optional[str] = None
    payment_date:   Optional[date] = None
    candidates:     list[MatchCandidate] = []


# ── Batch Auto-Post ───────────────────────────────────────────────────────────
class BatchAutoPostRequest(BaseModel):
    min_confidence: int = Field(default=90, ge=0, le=100)
    payer_id:       Optional[str] = None
    date_from:      Optional[date] = None
    date_to:        Optional[date] = None
    limit:          int = Field(default=500, ge=1, le=5000)


class BatchAutoPostError(BaseModel):
    era_id:  str
    error:   str


class BatchAutoPostPosted(BaseModel):
    era_id:        str
    target_claim_id: str
    confidence:    int


class BatchAutoPostResponse(BaseModel):
    posted_count:  int
    skipped_count: int
    posted:        list[BatchAutoPostPosted] = []
    errors:        list[BatchAutoPostError] = []
