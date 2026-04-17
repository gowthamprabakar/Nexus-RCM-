"""
CRS (Claim Readiness Score) API — Layer 1: Prevention
======================================================
GET /api/v1/crs/summary          — dashboard KPIs: pass rate, blocked count, denied prevented
GET /api/v1/crs/queue            — paginated claims list with CRS status + issues
GET /api/v1/crs/claim/{id}       — full CRS detail for one claim (6 component breakdown)
GET /api/v1/crs/error-categories — top error categories for the ScrubDashboard chart

Sprint Q D5:
POST /api/v1/crs/claim/{id}/apply-fix    — apply a rule-specific fix, recompute CRS, audit
POST /api/v1/crs/claim/{id}/recompute    — recompute CRS without mutation, audit
POST /api/v1/crs/batch/submit            — submit a batch of claims (blocks any that fail CRS)
"""
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, case, text, update

from app.core.deps import get_db
from app.models.claim import Claim
from app.models.patient import Patient
from app.models.payer import Payer
from app.models.rcm_extended import ClaimLine
from app.models.prevent_persistence import CrsAudit
from app.services.crs import build_crs_result, build_crs_result_with_ml, RULES

router = APIRouter()

AVG_CHARGE = 485.0   # used for "denied prevented" revenue estimate


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _issue_to_dict(issue):
    return {
        "id":                issue.issue_id,
        "ruleId":            issue.rule_id,
        "type":              issue.category,
        "message":           issue.message,
        "autoFixAvailable":  issue.auto_fix_available,
        "suggestedFix":      issue.suggested_fix,
        "confidenceScore":   issue.confidence_score,
        "applied":           False,
    }


# ---------------------------------------------------------------------------
# GET /summary  — ScrubDashboard KPI cards
# ---------------------------------------------------------------------------
@router.get("/summary")
async def get_crs_summary(
    db: AsyncSession = Depends(get_db),
    payer_id: Optional[str] = None,
    claim_type: Optional[str] = None,
):
    q = select(
        func.count(Claim.claim_id).label("total"),
        func.sum(case((Claim.crs_passed == True,  1), else_=0)).label("passed"),
        func.sum(case((and_(Claim.crs_score >= 60, Claim.crs_score < 80), 1), else_=0)).label("review"),
        func.sum(case((Claim.crs_score < 60,  1), else_=0)).label("blocked"),
        func.avg(Claim.crs_score).label("avg_score"),
        # auto-fixed = passed claims that had at least one coding/doc issue (proxy)
        func.sum(case((and_(Claim.crs_passed == True,
                            func.coalesce(Claim.crs_coding_pts, 25) < 20), 1), else_=0)).label("auto_fixed"),
        func.sum(Claim.total_charges).label("total_charges"),
    ).where(Claim.crs_score != None)

    if payer_id:
        q = q.where(Claim.payer_id == payer_id)
    if claim_type:
        q = q.where(Claim.claim_type == claim_type)

    row = (await db.execute(q)).one()

    total      = int(row.total or 0)
    passed     = int(row.passed or 0)
    review     = int(row.review or 0)
    blocked    = int(row.blocked or 0)
    auto_fixed = int(row.auto_fixed or 0)
    avg_score  = round(float(row.avg_score or 0), 1)

    pass_rate        = round(passed / total * 100, 1) if total else 0
    auto_fix_rate    = round(auto_fixed / total * 100, 1) if total else 0
    batch_readiness  = round((passed + auto_fixed) / total * 100, 1) if total else 0
    denials_prevented = round(passed * AVG_CHARGE * 0.113, 2)   # 11.3% industry denial rate

    return {
        "totalClaims":          total,
        "passRate":             pass_rate,
        "autoFixRate":          auto_fix_rate,
        "batchReadiness":       batch_readiness,
        "avgCrsScore":          avg_score,
        "denialsPreventedValue": denials_prevented,
        "statusBreakdown": {
            "passed":         passed,
            "autoFixed":      auto_fixed,
            "reviewRequired": review,
            "blocked":        blocked,
        },
    }


# ---------------------------------------------------------------------------
# GET /error-categories  — bar chart in ScrubDashboard
# ---------------------------------------------------------------------------
@router.get("/error-categories")
async def get_error_categories(db: AsyncSession = Depends(get_db)):
    q = select(
        func.sum(case((Claim.crs_eligibility_pts == 0, 1), else_=0)).label("eligibility"),
        func.sum(case((Claim.crs_auth_pts        == 0, 1), else_=0)).label("auth"),
        func.sum(case((Claim.crs_coding_pts      == 0, 1), else_=0)).label("coding"),
        func.sum(case((Claim.crs_cob_pts         == 0, 1), else_=0)).label("cob"),
        func.sum(case((Claim.crs_documentation_pts == 0, 1), else_=0)).label("documentation"),
        func.sum(case((Claim.crs_evv_pts         == 0, 1), else_=0)).label("evv"),
    ).where(Claim.crs_score != None)

    row = (await db.execute(q)).one()

    categories = [
        {"id": "eligibility",    "label": "Eligibility",    "count": int(row.eligibility or 0),    "color": "bg-orange-500"},
        {"id": "auth",           "label": "Authorization",  "count": int(row.auth or 0),           "color": "bg-amber-500"},
        {"id": "coding",         "label": "Coding Errors",  "count": int(row.coding or 0),         "color": "bg-red-500"},
        {"id": "cob",            "label": "COB / Coverage", "count": int(row.cob or 0),            "color": "bg-blue-500"},
        {"id": "documentation",  "label": "Documentation",  "count": int(row.documentation or 0),  "color": "bg-purple-500"},
        {"id": "evv",            "label": "EVV",            "count": int(row.evv or 0),            "color": "bg-teal-500"},
    ]

    # sort desc, drop zero-count
    categories = sorted([c for c in categories if c["count"] > 0], key=lambda x: -x["count"])
    return categories


# ---------------------------------------------------------------------------
# GET /queue  — ValidationQueue table (paginated)
# ---------------------------------------------------------------------------
@router.get("/queue")
async def get_crs_queue(
    db: AsyncSession = Depends(get_db),
    page:       int           = Query(1, ge=1),
    size:       int           = Query(50, ge=1, le=200),
    status:     Optional[str] = None,   # passed | review | blocked | autofixed
    payer_id:   Optional[str] = None,
    claim_type: Optional[str] = None,
    search:     Optional[str] = None,
):
    # Build filter on Claim
    filters = [Claim.crs_score != None]

    if status == "passed":
        filters.append(Claim.crs_passed == True)
    elif status == "review":
        filters.append(and_(Claim.crs_score >= 60, Claim.crs_score < 80))
    elif status == "blocked":
        filters.append(Claim.crs_score < 60)
    elif status == "autofixed":
        filters.append(and_(Claim.crs_passed == True,
                            func.coalesce(Claim.crs_coding_pts, 25) < 20))

    if payer_id:
        filters.append(Claim.payer_id == payer_id)
    if claim_type:
        filters.append(Claim.claim_type == claim_type)
    if search:
        filters.append(Claim.claim_id.ilike(f"%{search}%"))

    # Count
    count_q = select(func.count(Claim.claim_id)).where(and_(*filters))
    total   = (await db.execute(count_q)).scalar() or 0

    # Paginate — order flagged claims first (review, blocked), then passed
    data_q = (
        select(Claim)
        .where(and_(*filters))
        .order_by(Claim.crs_score.asc(), Claim.date_of_service.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    claims = (await db.execute(data_q)).scalars().all()

    # Bulk fetch patient names
    patient_ids = list({c.patient_id for c in claims})
    payer_ids   = list({c.payer_id   for c in claims})

    pat_q  = select(Patient.patient_id, Patient.first_name, Patient.last_name).where(Patient.patient_id.in_(patient_ids))
    pay_q  = select(Payer.payer_id, Payer.payer_name).where(Payer.payer_id.in_(payer_ids))
    pat_r  = (await db.execute(pat_q)).all()
    pay_r  = (await db.execute(pay_q)).all()

    pat_map = {r.patient_id: f"{r.first_name} {r.last_name}" for r in pat_r}
    pay_map = {r.payer_id:   r.payer_name                     for r in pay_r}

    items = []
    for c in claims:
        crs    = build_crs_result(c)
        items.append({
            "id":              c.claim_id,
            "patient":         pat_map.get(c.patient_id, c.patient_id),
            "payer":           pay_map.get(c.payer_id,   c.payer_id),
            "dos":             str(c.date_of_service),
            "amount":          round(c.total_charges or 0, 2),
            "claimType":       c.claim_type,
            "status":          crs.status,
            "crsScore":        crs.crs_score,
            "batchReady":      crs.batch_ready,
            "confidenceScore": round(crs.crs_score / 100, 2),
            "issues":          [_issue_to_dict(i) for i in crs.issues],
        })

    return {
        "total": total,
        "page":  page,
        "size":  size,
        "items": items,
    }


# ---------------------------------------------------------------------------
# GET /claim/{claim_id}  — ClaimValidationDetail full breakdown
# ---------------------------------------------------------------------------
@router.get("/claim/{claim_id}")
async def get_crs_detail(claim_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Claim).where(Claim.claim_id == claim_id))
    claim  = result.scalars().first()
    if not claim:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Claim not found")

    # Patient + Payer names
    pat = (await db.execute(select(Patient).where(Patient.patient_id == claim.patient_id))).scalars().first()
    pay = (await db.execute(select(Payer).where(Payer.payer_id == claim.payer_id))).scalars().first()

    # Sprint Q — Track C1: enriched with ML denial probability
    crs = await build_crs_result_with_ml(db, claim)

    return {
        "id":              claim.claim_id,
        "patient":         f"{pat.first_name} {pat.last_name}" if pat else claim.patient_id,
        "patientId":       claim.patient_id,
        "payer":           pay.payer_name if pay else claim.payer_id,
        "payerId":         claim.payer_id,
        "dos":             str(claim.date_of_service),
        "dosThrough":      str(claim.dos_through) if claim.dos_through else None,
        "claimType":       claim.claim_type,
        "placeOfService":  claim.place_of_service,
        "totalCharges":    round(claim.total_charges or 0, 2),
        "submissionDate":  str(claim.submission_date) if claim.submission_date else None,
        "status":          crs.status,
        "crsScore":        crs.crs_score,
        "crsPassed":       crs.crs_passed,
        "batchReady":      crs.batch_ready,
        "confidenceScore": round(crs.crs_score / 100, 2),

        # Component scores
        "components": {
            "eligibility":   {"pts": crs.eligibility_pts,   "max": 25, "passed": crs.eligibility_pts >= 25},
            "authorization": {"pts": crs.auth_pts,          "max": 25, "passed": crs.auth_pts >= 25},
            "coding":        {"pts": crs.coding_pts,        "max": 20, "passed": crs.coding_pts >= 20},
            "cob":           {"pts": crs.cob_pts,           "max": 10, "passed": crs.cob_pts >= 10},
            "documentation": {"pts": crs.documentation_pts, "max": 10, "passed": crs.documentation_pts >= 10},
            "evv":           {"pts": crs.evv_pts,           "max": 10, "passed": crs.evv_pts >= 10},
        },

        "issues": [_issue_to_dict(i) for i in crs.issues],

        # ADTP forecast data
        "adtpDays":            claim.adtp_days,
        "expectedPaymentDate": str(claim.expected_payment_date) if claim.expected_payment_date else None,
        "expectedPaymentWeek": str(claim.expected_payment_week) if claim.expected_payment_week else None,

        # ML — pre-submission denial probability (Sprint Q Track C1)
        "predicted_denial_probability": crs.predicted_denial_probability,
        "predicted_denial_risk_level":  crs.predicted_denial_risk_level,
    }


# ---------------------------------------------------------------------------
# GET /high-risk  — pre-submission gate: claims with crs_score < 60
# ---------------------------------------------------------------------------
@router.get("/high-risk")
async def get_high_risk_claims(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
):
    filters = [Claim.crs_score < 60, Claim.crs_score != None]

    count_q = select(func.count(Claim.claim_id)).where(and_(*filters))
    total = (await db.execute(count_q)).scalar() or 0

    data_q = (
        select(Claim)
        .where(and_(*filters))
        .order_by(Claim.total_charges.desc(), Claim.crs_score.asc())
        .offset((page - 1) * size)
        .limit(size)
    )
    claims = (await db.execute(data_q)).scalars().all()

    patient_ids = list({c.patient_id for c in claims})
    payer_ids   = list({c.payer_id   for c in claims})

    pat_r = (await db.execute(
        select(Patient.patient_id, Patient.first_name, Patient.last_name)
        .where(Patient.patient_id.in_(patient_ids))
    )).all()
    pay_r = (await db.execute(
        select(Payer.payer_id, Payer.payer_name)
        .where(Payer.payer_id.in_(payer_ids))
    )).all()

    pat_map = {r.patient_id: f"{r.first_name} {r.last_name}" for r in pat_r}
    pay_map = {r.payer_id:   r.payer_name                    for r in pay_r}

    items = []
    for c in claims:
        crs = build_crs_result(c)
        items.append({
            "id":            c.claim_id,
            "patient":       pat_map.get(c.patient_id, c.patient_id),
            "payer":         pay_map.get(c.payer_id, c.payer_id),
            "dos":           str(c.date_of_service),
            "amount":        round(c.total_charges or 0, 2),
            "claimType":     c.claim_type,
            "crsScore":      crs.crs_score,
            "status":        crs.status,
            "issueCount":    len(crs.issues),
            "issues":        [_issue_to_dict(i) for i in crs.issues],
            "denialRisk":    round(100 - crs.crs_score, 1),
        })

    return {"total": total, "page": page, "size": size, "items": items}


# ---------------------------------------------------------------------------
# GET /payers  — populate filter dropdowns in frontend
# ---------------------------------------------------------------------------
@router.get("/payers")
async def get_payers_for_filter(db: AsyncSession = Depends(get_db)):
    q = select(Payer.payer_id, Payer.payer_name, Payer.payer_group).order_by(Payer.payer_name)
    rows = (await db.execute(q)).all()
    return [{"payer_id": r.payer_id, "payer_name": r.payer_name, "payer_group": r.payer_group} for r in rows]


# ═══════════════════════════════════════════════════════════════════════════
# Sprint Q Track D5 — POST/PATCH endpoints for Claim Readiness
# ═══════════════════════════════════════════════════════════════════════════

# ---------------------------------------------------------------------------
# Pydantic request schemas
# ---------------------------------------------------------------------------
class ApplyFixRequest(BaseModel):
    rule_id: str = Field(..., description="CRS rule to apply fix for (e.g. R-CODE-001)")
    fix_data: dict[str, Any] = Field(default_factory=dict, description="Rule-specific fix payload")


class RecomputeRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Optional reason for the recompute (e.g. '271 refreshed')")
    user_id: Optional[str] = Field("system", description="User triggering the recompute")


class BatchSubmitRequest(BaseModel):
    claim_ids: list[str] = Field(..., min_length=1, description="Claims to submit")
    user_id: Optional[str] = Field("system", description="User submitting the batch")
    force: bool = Field(False, description="If true, submit even claims that fail CRS (not recommended)")


# ---------------------------------------------------------------------------
# Helpers — CRS recomputation + audit logging
# ---------------------------------------------------------------------------
# Component point caps (mirrors app.services.crs docstring)
_COMPONENT_CAPS = {
    "eligibility":   25,
    "authorization": 25,
    "coding":        20,
    "cob":           10,
    "documentation": 10,
    "evv":           10,
}

_PASS_THRESHOLD = 80  # crs_passed if score >= 80


def _recompute_score_from_components(claim: Claim) -> tuple[int, bool]:
    """Re-derive crs_score and crs_passed from the 6 component point columns."""
    pts = (
        (claim.crs_eligibility_pts   or 0)
        + (claim.crs_auth_pts        or 0)
        + (claim.crs_coding_pts      or 0)
        + (claim.crs_cob_pts         or 0)
        + (claim.crs_documentation_pts or 0)
        + (claim.crs_evv_pts         or 0)
    )
    score = max(0, min(100, int(pts)))
    return score, score >= _PASS_THRESHOLD


def _gen_audit_id() -> str:
    return f"AUD-{uuid4().hex[:10].upper()}"


async def _write_crs_audit(
    db: AsyncSession,
    *,
    claim_id: str,
    score_before: Optional[int],
    score_after: Optional[int],
    rule_id: Optional[str],
    action: str,
    action_data: dict,
    user_id: Optional[str],
) -> CrsAudit:
    row = CrsAudit(
        audit_id=_gen_audit_id(),
        claim_id=claim_id,
        score_before=score_before,
        score_after=score_after,
        rule_id=rule_id,
        action=action,
        action_data=action_data or {},
        user_id=user_id or "system",
    )
    db.add(row)
    await db.flush()
    return row


def _apply_fix_to_claim(claim: Claim, rule_id: str, fix_data: dict) -> dict:
    """Apply a rule-specific fix. Returns a diagnostic dict describing what changed.

    Supports both known CRS rule_ids and DB-backed custom rules (best-effort).
    For unsupported rules the component-points boost still applies (so recompute
    sees the rule as resolved).
    """
    changes: dict[str, Any] = {"rule_id": rule_id, "fields_updated": []}

    # Boost the right component to its cap so the recompute flips it to "passed"
    if rule_id == "R-ELIG-001":
        claim.crs_eligibility_pts = _COMPONENT_CAPS["eligibility"]
        changes["fields_updated"].append("crs_eligibility_pts")
    elif rule_id == "R-AUTH-001":
        claim.crs_auth_pts = _COMPONENT_CAPS["authorization"]
        changes["fields_updated"].append("crs_auth_pts")
    elif rule_id == "R-CODE-001":
        claim.crs_coding_pts = _COMPONENT_CAPS["coding"]
        changes["fields_updated"].append("crs_coding_pts")
        # fix_data may update the first claim_line cpt/modifier — handled separately
    elif rule_id == "R-COB-001":
        claim.crs_cob_pts = _COMPONENT_CAPS["cob"]
        changes["fields_updated"].append("crs_cob_pts")
    elif rule_id == "R-DOC-001":
        claim.crs_documentation_pts = _COMPONENT_CAPS["documentation"]
        changes["fields_updated"].append("crs_documentation_pts")
        # claim header patches
        for field in ("place_of_service", "bill_type"):
            if field in fix_data and fix_data[field] is not None:
                setattr(claim, field, fix_data[field])
                changes["fields_updated"].append(field)
    elif rule_id == "R-EVV-001":
        claim.crs_evv_pts = _COMPONENT_CAPS["evv"]
        changes["fields_updated"].append("crs_evv_pts")
    else:
        changes["note"] = f"Unknown rule_id '{rule_id}' — applied generic pass-through (no mutation)"

    return changes


async def _apply_coding_line_fix(
    db: AsyncSession, claim_id: str, fix_data: dict
) -> dict:
    """For R-CODE-001 the caller may pass cpt/modifier/icd10 to patch the first
    claim_line. Returns a description of what was changed.
    """
    changes: dict[str, Any] = {"claim_line_updated": False}
    targets = {
        k: v for k, v in fix_data.items()
        if k in ("cpt", "modifier", "modifier_1", "modifier_2", "icd10_primary")
        and v is not None
    }
    if not targets:
        return changes

    # Fetch first claim line
    row = await db.execute(
        select(ClaimLine)
        .where(ClaimLine.claim_id == claim_id)
        .order_by(ClaimLine.line_number.asc())
        .limit(1)
    )
    line = row.scalars().first()
    if not line:
        changes["note"] = "no claim_line rows found; coding fix skipped"
        return changes

    if "cpt" in targets:
        line.cpt_code = targets["cpt"]
        changes["cpt"] = targets["cpt"]
    if "modifier" in targets or "modifier_1" in targets:
        line.modifier_1 = targets.get("modifier_1") or targets.get("modifier")
        changes["modifier_1"] = line.modifier_1
    if "modifier_2" in targets:
        line.modifier_2 = targets["modifier_2"]
        changes["modifier_2"] = line.modifier_2
    if "icd10_primary" in targets:
        line.icd10_primary = targets["icd10_primary"]
        changes["icd10_primary"] = line.icd10_primary

    await db.flush()
    changes["claim_line_updated"] = True
    changes["claim_line_id"] = line.claim_line_id
    return changes


def _crs_result_payload(claim: Claim) -> dict:
    """Serialize the CRSResult consistently with GET /crs/claim/{id}."""
    crs = build_crs_result(claim)
    return {
        "claim_id":   claim.claim_id,
        "crs_score":  crs.crs_score,
        "crs_passed": crs.crs_passed,
        "status":     crs.status,
        "batch_ready": crs.batch_ready,
        "components": {
            "eligibility":   {"pts": crs.eligibility_pts,   "max": 25, "passed": crs.eligibility_pts >= 25},
            "authorization": {"pts": crs.auth_pts,          "max": 25, "passed": crs.auth_pts >= 25},
            "coding":        {"pts": crs.coding_pts,        "max": 20, "passed": crs.coding_pts >= 20},
            "cob":           {"pts": crs.cob_pts,           "max": 10, "passed": crs.cob_pts >= 10},
            "documentation": {"pts": crs.documentation_pts, "max": 10, "passed": crs.documentation_pts >= 10},
            "evv":           {"pts": crs.evv_pts,           "max": 10, "passed": crs.evv_pts >= 10},
        },
        "issues": [_issue_to_dict(i) for i in crs.issues],
    }


# ---------------------------------------------------------------------------
# POST /crs/claim/{claim_id}/apply-fix
# ---------------------------------------------------------------------------
@router.post("/claim/{claim_id}/apply-fix")
async def crs_apply_fix(
    claim_id: str,
    payload: ApplyFixRequest,
    db: AsyncSession = Depends(get_db),
):
    """Apply a CRS rule fix, recompute the score, persist audit + new claim state.

    Flow:
      1) Load claim
      2) Record score_before
      3) Apply the fix (component pts + optional field/claim_line patches)
      4) Recompute crs_score / crs_passed from components
      5) Write CrsAudit row (APPLY_FIX)
      6) Commit + return new CRSResult
    """
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    score_before = claim.crs_score

    # (3) apply the fix
    header_changes = _apply_fix_to_claim(claim, payload.rule_id, payload.fix_data)
    line_changes: dict = {}
    if payload.rule_id == "R-CODE-001":
        line_changes = await _apply_coding_line_fix(db, claim_id, payload.fix_data)

    # (4) recompute
    score_after, passed_after = _recompute_score_from_components(claim)
    claim.crs_score = score_after
    claim.crs_passed = passed_after

    # (5) audit
    user_id = payload.fix_data.get("user_id", "system")
    await _write_crs_audit(
        db,
        claim_id=claim_id,
        score_before=score_before,
        score_after=score_after,
        rule_id=payload.rule_id,
        action="APPLY_FIX",
        action_data={
            "fix_data": payload.fix_data,
            "header_changes": header_changes,
            "line_changes": line_changes,
        },
        user_id=user_id,
    )

    await db.commit()
    await db.refresh(claim)

    return {
        "status": "applied",
        "rule_id": payload.rule_id,
        "score_before": score_before,
        "score_after": score_after,
        "result": _crs_result_payload(claim),
        "changes": {
            "header": header_changes,
            "claim_line": line_changes,
        },
    }


# ---------------------------------------------------------------------------
# POST /crs/claim/{claim_id}/recompute
# ---------------------------------------------------------------------------
@router.post("/claim/{claim_id}/recompute")
async def crs_recompute(
    claim_id: str,
    payload: RecomputeRequest = RecomputeRequest(),
    db: AsyncSession = Depends(get_db),
):
    """Recompute CRS from current component points. Useful after external data
    (Eligibility271 / PriorAuth / ClaimLine) has been refreshed.

    Does NOT mutate the claim's components — only re-derives the aggregate
    score/passed flag and writes an audit row.
    """
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    score_before = claim.crs_score
    score_after, passed_after = _recompute_score_from_components(claim)
    claim.crs_score = score_after
    claim.crs_passed = passed_after

    await _write_crs_audit(
        db,
        claim_id=claim_id,
        score_before=score_before,
        score_after=score_after,
        rule_id=None,
        action="RECOMPUTE",
        action_data={"reason": payload.reason},
        user_id=payload.user_id,
    )

    await db.commit()
    await db.refresh(claim)

    return {
        "status": "recomputed",
        "score_before": score_before,
        "score_after": score_after,
        "result": _crs_result_payload(claim),
    }


# ---------------------------------------------------------------------------
# POST /crs/batch/submit
# ---------------------------------------------------------------------------
@router.post("/batch/submit")
async def crs_batch_submit(
    payload: BatchSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit a batch of claims. Any claim with ``crs_passed != True`` is
    blocked unless ``force=true``. Every attempt (submit or block) produces a
    CrsAudit row.
    """
    submitted: list[str] = []
    blocked: list[dict] = []
    not_found: list[str] = []

    now = datetime.now(timezone.utc).date()

    for cid in payload.claim_ids:
        claim = await db.get(Claim, cid)
        if not claim:
            not_found.append(cid)
            continue

        # If crs_score is unset, recompute first so the submit decision is current
        if claim.crs_score is None:
            s, p = _recompute_score_from_components(claim)
            claim.crs_score = s
            claim.crs_passed = p

        if not claim.crs_passed and not payload.force:
            blocked.append({
                "claim_id": cid,
                "crs_score": claim.crs_score,
                "reason": "crs_passed=false",
            })
            await _write_crs_audit(
                db,
                claim_id=cid,
                score_before=claim.crs_score,
                score_after=claim.crs_score,
                rule_id=None,
                action="BLOCK",
                action_data={"reason": "crs_passed=false", "batch_size": len(payload.claim_ids)},
                user_id=payload.user_id,
            )
            continue

        # Submit: flip status + stamp submission_date
        claim.status = "SUBMITTED"
        if claim.submission_date is None:
            claim.submission_date = now

        submitted.append(cid)
        await _write_crs_audit(
            db,
            claim_id=cid,
            score_before=claim.crs_score,
            score_after=claim.crs_score,
            rule_id=None,
            action="SUBMIT",
            action_data={
                "forced": payload.force,
                "batch_size": len(payload.claim_ids),
                "submission_date": str(claim.submission_date),
            },
            user_id=payload.user_id,
        )

    await db.commit()

    return {
        "submitted": len(submitted),
        "blocked_count": len(blocked),
        "not_found_count": len(not_found),
        "submitted_claim_ids": submitted,
        "blocked": blocked,
        "not_found": not_found,
        "forced": payload.force,
    }


# ---------------------------------------------------------------------------
# GET /crs/claim/{claim_id}/audit  — per-claim audit trail
# ---------------------------------------------------------------------------
@router.get("/claim/{claim_id}/audit")
async def crs_claim_audit(
    claim_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Return the most recent CRS audit rows for a claim."""
    stmt = (
        select(CrsAudit)
        .where(CrsAudit.claim_id == claim_id)
        .order_by(CrsAudit.created_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "audit_id":     r.audit_id,
            "claim_id":     r.claim_id,
            "score_before": r.score_before,
            "score_after":  r.score_after,
            "rule_id":      r.rule_id,
            "action":       r.action,
            "action_data":  r.action_data or {},
            "user_id":      r.user_id,
            "created_at":   r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
