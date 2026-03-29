"""
CRS (Claim Readiness Score) API — Layer 1: Prevention
======================================================
GET /api/v1/crs/summary          — dashboard KPIs: pass rate, blocked count, denied prevented
GET /api/v1/crs/queue            — paginated claims list with CRS status + issues
GET /api/v1/crs/claim/{id}       — full CRS detail for one claim (6 component breakdown)
GET /api/v1/crs/error-categories — top error categories for the ScrubDashboard chart
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, case, text
from typing import Optional

from app.core.deps import get_db
from app.models.claim import Claim
from app.models.patient import Patient
from app.models.payer import Payer
from app.services.crs import build_crs_result, RULES

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

    crs = build_crs_result(claim)

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
