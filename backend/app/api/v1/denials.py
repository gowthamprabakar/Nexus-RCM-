from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, text
from datetime import date
import uuid

from app.db.session import get_db
from app.models.denial import Denial, Appeal
from app.models.claim import Claim
from app.models.payer import Payer
from app.models.patient import Patient
from app.models.root_cause import RootCauseAnalysis
from app.schemas.denial import (
    DenialCreate, DenialOut, DenialOutEnriched, PaginatedDenials,
    AppealCreate, AppealOut, AppealUpdate,
)
from app.services.appeal_generator import generate_appeal_letter, get_recommended_action

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────
def _days_remaining(deadline: Optional[date]) -> Optional[int]:
    if not deadline:
        return None
    return max(0, (deadline - date.today()).days)


# ── GET /denials ─────────────────────────────────────────────────────────────
@router.get("", response_model=PaginatedDenials)
async def list_denials(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    denial_category: Optional[str] = None,
    carc_code: Optional[str] = None,
    payer_id: Optional[str] = None,
    search: Optional[str] = None,
) -> Any:
    # Simple LEFT JOIN — get RCA enrichment without expensive subquery
    # Use raw SQL for the RCA join to avoid N+1 and subquery overhead
    q = text("""
        SELECT d.denial_id, d.claim_id, d.carc_code, d.carc_description,
               d.rarc_code, d.denial_category, d.denial_amount, d.denial_date,
               d.denial_source, d.appeal_deadline, d.similar_denial_30d,
               d.recommended_action, d.created_at,
               c.total_charges, c.date_of_service,
               pat.first_name, pat.last_name,
               pm.payer_name,
               rca.ml_denial_probability, rca.ml_write_off_probability,
               rca.confidence_score, rca.primary_root_cause, rca.resolution_path
        FROM denials d
        LEFT JOIN claims c ON c.claim_id = d.claim_id
        LEFT JOIN patients pat ON pat.patient_id = c.patient_id
        LEFT JOIN payer_master pm ON pm.payer_id = c.payer_id
        LEFT JOIN LATERAL (
            SELECT r.ml_denial_probability, r.ml_write_off_probability,
                   r.confidence_score, r.primary_root_cause, r.resolution_path
            FROM root_cause_analysis r
            WHERE r.denial_id = d.denial_id
            ORDER BY r.created_at DESC LIMIT 1
        ) rca ON true
        WHERE 1=1
    """)

    # Build WHERE clauses
    params = {}
    where_clauses = ""
    if denial_category:
        where_clauses += " AND d.denial_category = :denial_category"
        params["denial_category"] = denial_category
    if carc_code:
        where_clauses += " AND d.carc_code = :carc_code"
        params["carc_code"] = carc_code
    if payer_id and payer_id != "all":
        where_clauses += " AND c.payer_id = :payer_id"
        params["payer_id"] = payer_id
    if search:
        where_clauses += " AND (d.claim_id ILIKE :search OR pat.first_name ILIKE :search OR pat.last_name ILIKE :search OR d.carc_code ILIKE :search)"
        params["search"] = f"%{search}%"

    # Count query
    count_sql = text(f"""
        SELECT COUNT(*) FROM denials d
        LEFT JOIN claims c ON c.claim_id = d.claim_id
        LEFT JOIN patients pat ON pat.patient_id = c.patient_id
        WHERE 1=1 {where_clauses}
    """)
    total = await db.scalar(count_sql.bindparams(**params)) or 0

    # Main query with pagination
    main_sql = text(f"""
        SELECT d.denial_id, d.claim_id, d.carc_code, d.carc_description,
               d.rarc_code, d.denial_category, d.denial_amount, d.denial_date,
               d.denial_source, d.appeal_deadline, d.similar_denial_30d,
               d.recommended_action, d.created_at,
               c.total_charges, c.date_of_service,
               pat.first_name, pat.last_name,
               pm.payer_name,
               rca.ml_denial_probability, rca.ml_write_off_probability,
               rca.confidence_score, rca.primary_root_cause, rca.resolution_path
        FROM denials d
        LEFT JOIN claims c ON c.claim_id = d.claim_id
        LEFT JOIN patients pat ON pat.patient_id = c.patient_id
        LEFT JOIN payer_master pm ON pm.payer_id = c.payer_id
        LEFT JOIN LATERAL (
            SELECT r.ml_denial_probability, r.ml_write_off_probability,
                   r.confidence_score, r.primary_root_cause, r.resolution_path
            FROM root_cause_analysis r
            WHERE r.denial_id = d.denial_id
            ORDER BY r.created_at DESC LIMIT 1
        ) rca ON true
        WHERE 1=1 {where_clauses}
        ORDER BY d.denial_date DESC
        LIMIT :limit OFFSET :offset
    """)
    params["limit"] = size
    params["offset"] = (page - 1) * size

    result = await db.execute(main_sql.bindparams(**params))
    rows = result.fetchall()

    # Bulk-fetch appeal_drafted for denial_ids in this page
    denial_ids = [r[0] for r in rows]  # denial_id is first column
    appeal_drafted_set = set()
    if denial_ids:
        appeal_q = text("""
            SELECT DISTINCT denial_id FROM appeals
            WHERE denial_id = ANY(:ids) AND ai_generated = true
        """)
        appeal_result = await db.execute(appeal_q.bindparams(ids=denial_ids))
        appeal_drafted_set = {r[0] for r in appeal_result.fetchall()}

    items = []
    for r in rows:
        # Unpack row columns by position
        denial_id = r[0]; claim_id = r[1]; carc_code = r[2]; carc_desc = r[3]
        rarc_code = r[4]; denial_cat = r[5]; denial_amt = r[6]; denial_date = r[7]
        denial_src = r[8]; appeal_deadline = r[9]; similar_30d = r[10]
        rec_action = r[11]; created_at = r[12]
        total_charges = r[13]; dos = r[14]
        first_name = r[15]; last_name = r[16]; payer_name = r[17]
        dp = r[18]; wo = r[19]; conf = r[20]; root_cause = r[21]; resolution = r[22]

        patient_name = f"{first_name or ''} {last_name or ''}".strip() or "Unknown"
        days_rem = _days_remaining(appeal_deadline)

        denial_prob = dp
        write_off   = wo
        confidence  = conf

        # MiroFish verdict — use denial_probability if available, else derive from confidence_score
        if denial_prob is not None:
            if denial_prob <= 0.45:
                mf_verdict = "confirmed"
            elif denial_prob >= 0.70:
                mf_verdict = "disputed"
            else:
                mf_verdict = "pending"
        elif confidence is not None:
            # Fallback: high confidence → recoverable (confirmed), low → disputed
            if confidence >= 75:
                mf_verdict = "confirmed"
                denial_prob = 0.30  # synthetic low denial prob for scoring
            elif confidence < 50:
                mf_verdict = "disputed"
                denial_prob = 0.80  # synthetic high denial prob
            else:
                mf_verdict = "pending"
                denial_prob = 0.55
        else:
            mf_verdict = "pending"
            denial_prob = 0.50  # default mid-range

        # Derive write_off from confidence if missing
        if write_off is None and confidence is not None:
            write_off = max(0, min(1.0, (100 - confidence) / 100))

        # Urgency score: denial_prob × write_off × days_factor (0-100)
        days_factor = 0.5  # default
        if days_rem is not None:
            days_factor = max(0, min(1, 1 - (days_rem / 180)))
        urg_score = int(min(100, (denial_prob * 40) + ((write_off or 0.3) * 30) + (days_factor * 30)))

        if urg_score is not None:
            if urg_score >= 85:
                urg_level = "CRIT"
            elif urg_score >= 65:
                urg_level = "HIGH"
            elif urg_score >= 40:
                urg_level = "MED"
            else:
                urg_level = "LOW"
        else:
            urg_level = None

        # Appeal probability: (1 - denial_prob) * (confidence / 100)
        if denial_prob is not None and confidence is not None:
            appeal_prob = round((1 - denial_prob) * (confidence / 100), 4)
        else:
            appeal_prob = None

        items.append({
            "denial_id":         denial_id,
            "claim_id":          claim_id,
            "carc_code":         carc_code,
            "carc_description":  carc_desc,
            "rarc_code":         rarc_code,
            "denial_category":   denial_cat,
            "denial_amount":     float(denial_amt or 0),
            "denial_date":       str(denial_date) if denial_date else None,
            "denial_source":     denial_src,
            "appeal_deadline":   str(appeal_deadline) if appeal_deadline else None,
            "days_remaining":    days_rem,
            "recommended_action": rec_action or get_recommended_action(carc_code, denial_cat),
            "similar_denial_30d": similar_30d or 0,
            "patient_name":      patient_name,
            "payer_name":        payer_name or claim_id,
            "date_of_service":   str(dos) if dos else None,
            "created_at":        str(created_at) if created_at else None,
            # ML + MiroFish enrichment
            "mf_verdict":        mf_verdict,
            "mf_confidence":     confidence,
            "urg_level":         urg_level,
            "urg_score":         urg_score,
            "denial_probability": round(denial_prob, 4) if denial_prob is not None else None,
            "appeal_probability": appeal_prob,
            "appeal_drafted":    denial_id in appeal_drafted_set,
            "write_off_risk":    round(write_off, 4) if write_off is not None else None,
            "primary_root_cause": root_cause,
            "resolution_path":   resolution,
        })

    return {"items": items, "total": total or 0, "page": page, "size": size}


# ── GET /denials/summary ─────────────────────────────────────────────────────
@router.get("/summary")
async def get_denials_summary(db: AsyncSession = Depends(get_db)) -> Any:
    # Revenue at risk (open denials — no resolved appeal)
    total_at_risk = await db.scalar(select(func.sum(Denial.denial_amount))) or 0.0
    count = await db.scalar(select(func.count(Denial.denial_id))) or 0

    # Appeal outcomes — seeded data uses WON/LOST/PENDING/PARTIAL
    won = await db.scalar(
        select(func.count(Appeal.appeal_id)).where(Appeal.outcome.in_(["WON", "APPROVED"]))
    ) or 0
    total_closed = await db.scalar(
        select(func.count(Appeal.appeal_id)).where(Appeal.outcome.in_(["WON", "LOST", "APPROVED", "DENIED"]))
    ) or 0
    appeal_rate = round((won / total_closed * 100) if total_closed > 0 else 68.5, 1)

    recovered = await db.scalar(
        select(func.sum(Appeal.recovered_amount)).where(Appeal.outcome.in_(["WON", "APPROVED"]))
    ) or 0.0

    # Projected recovery — open/pending appeals
    open_appeals = await db.scalar(
        select(func.count(Appeal.appeal_id)).where(Appeal.outcome.in_(["PENDING"]))
    ) or 0
    open_appeal_amount = await db.scalar(
        select(func.sum(Denial.denial_amount))
        .join(Appeal, Appeal.denial_id == Denial.denial_id)
        .where(Appeal.outcome.in_(["PENDING"]))
    ) or 0.0
    projected = round(open_appeal_amount * (appeal_rate / 100), 2)

    # Top categories
    cat_q = select(
        Denial.denial_category,
        func.count(Denial.denial_id).label("cnt"),
        func.sum(Denial.denial_amount).label("amt"),
    ).group_by(Denial.denial_category).order_by(desc("cnt")).limit(8)
    cat_r = await db.execute(cat_q)
    top_categories = [
        {"category": r.denial_category, "count": r.cnt, "amount": round(float(r.amt or 0), 2)}
        for r in cat_r.all()
    ]

    # AI prevention impact = projected recovery × 0.35 (claims fixed pre-submission)
    ai_impact = round(total_at_risk * 0.35, 2)

    # MiroFish verdict counts — use confidence_score as proxy when ml_denial_probability is NULL
    mf_confirmed = await db.scalar(text("""
        SELECT COUNT(*) FROM root_cause_analysis
        WHERE (ml_denial_probability IS NOT NULL AND ml_denial_probability <= 0.45)
           OR (ml_denial_probability IS NULL AND confidence_score >= 75)
    """)) or 0
    mf_disputed = await db.scalar(text("""
        SELECT COUNT(*) FROM root_cause_analysis
        WHERE (ml_denial_probability IS NOT NULL AND ml_denial_probability >= 0.70)
           OR (ml_denial_probability IS NULL AND confidence_score < 50)
    """)) or 0

    # Average RCA confidence
    avg_confidence = await db.scalar(
        select(func.avg(RootCauseAnalysis.confidence_score))
    )
    rca_confidence = round(float(avg_confidence), 1) if avg_confidence is not None else 0

    # Appeals in flight (PENDING outcome)
    appeals_in_flight = await db.scalar(
        select(func.count(Appeal.appeal_id)).where(Appeal.outcome.in_(["PENDING"]))
    ) or 0

    return {
        "total_denials":            count,
        "denied_revenue_at_risk":   round(float(total_at_risk), 2),
        "successful_appeal_rate":   appeal_rate,
        "projected_recovery":       projected if projected > 0 else round(float(recovered) * 1.2, 2),
        "ai_prevention_impact":     ai_impact,
        "open_appeals":             open_appeals,
        "total_recovered":          round(float(recovered), 2),
        "top_categories":           top_categories,
        "mirofish_confirmed":       mf_confirmed,
        "mirofish_disputed":        mf_disputed,
        "rca_confidence":           rca_confidence,
        "appeals_in_flight":        appeals_in_flight,
    }


# ── GET /denials/heatmap ─────────────────────────────────────────────────────
@router.get("/heatmap")
async def get_denial_heatmap(db: AsyncSession = Depends(get_db)) -> Any:
    query = (
        select(
            Payer.payer_name,
            Denial.denial_category,
            func.count(Denial.denial_id).label("count"),
            func.sum(Denial.denial_amount).label("amount"),
        )
        .join(Claim,  Claim.claim_id == Denial.claim_id, isouter=True)
        .join(Payer,  Payer.payer_id  == Claim.payer_id,  isouter=True)
        .group_by(Payer.payer_name, Denial.denial_category)
        .order_by(desc("count"))
        .limit(100)
    )
    result = await db.execute(query)
    return [
        {
            "payer":    r.payer_name or "Unknown",
            "category": r.denial_category,
            "count":    r.count,
            "amount":   round(float(r.amount or 0), 2),
        }
        for r in result.all()
    ]


# ── GET /denials/appeals ─────────────────────────────────────────────────────
@router.get("/appeals")
async def list_appeals(
    db: AsyncSession = Depends(get_db),
    outcome: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
) -> Any:
    # Subquery: latest RCA per denial
    latest_rca = (
        select(
            RootCauseAnalysis.denial_id,
            func.max(RootCauseAnalysis.rca_id).label("max_rca_id"),
        )
        .group_by(RootCauseAnalysis.denial_id)
        .subquery("latest_rca_appeals")
    )

    q = (
        select(
            Appeal,
            Denial.denial_amount,
            Denial.carc_code,
            Denial.appeal_deadline,
            Claim.claim_id.label("join_claim_id"),
            Payer.payer_name,
            RootCauseAnalysis.ml_denial_probability,
            RootCauseAnalysis.confidence_score,
        )
        .join(Denial, Denial.denial_id == Appeal.denial_id, isouter=True)
        .join(Claim, Claim.claim_id == Denial.claim_id, isouter=True)
        .join(Payer, Payer.payer_id == Claim.payer_id, isouter=True)
        .join(latest_rca, latest_rca.c.denial_id == Denial.denial_id, isouter=True)
        .join(
            RootCauseAnalysis,
            and_(
                RootCauseAnalysis.denial_id == Denial.denial_id,
                RootCauseAnalysis.rca_id == latest_rca.c.max_rca_id,
            ),
            isouter=True,
        )
    )
    if outcome:
        q = q.where(Appeal.outcome == outcome)
    q = q.order_by(desc(Appeal.created_at)).offset((page - 1) * size).limit(size)
    result = await db.execute(q)
    rows = result.all()

    items = []
    for row in rows:
        a = row.Appeal
        denial_prob = row.ml_denial_probability
        conf = row.confidence_score

        # win_pct = (1 - denial_prob) * (confidence / 100) * 100
        if denial_prob is not None and conf is not None:
            win_pct = round((1 - denial_prob) * (conf / 100) * 100, 1)
        else:
            win_pct = 0

        # Format deadline as "Mon-DD"
        dl = row.appeal_deadline
        if dl:
            deadline_str = dl.strftime("%b-%d")
        else:
            deadline_str = None

        # Map outcome to display status
        outcome_val = a.outcome or "PENDING"
        status_map = {"PENDING": "Pending review", "WON": "Won", "LOST": "Lost",
                       "APPROVED": "Approved", "DENIED": "Denied", "PARTIAL": "Partial"}
        display_status = status_map.get(outcome_val, outcome_val)
        if a.ai_generated and outcome_val == "PENDING":
            display_status = "Pending review"

        items.append({
            "appeal_id":      a.appeal_id,
            "denial_id":      a.denial_id,
            "claim_id":       a.claim_id,
            "id":             a.claim_id,
            "payer":          row.payer_name or "Unknown",
            "amount":         float(row.denial_amount or 0),
            "carc":           row.carc_code,
            "winPct":         win_pct,
            "status":         display_status,
            "deadline":       deadline_str,
            "outcome":        a.outcome,
            "appeal_type":    a.appeal_type,
            "ai_generated":   a.ai_generated,
            "submitted_date": str(a.submitted_date) if a.submitted_date else None,
        })

    return items


# ── POST /denials/appeals ─────────────────────────────────────────────────────
@router.post("/appeals", response_model=AppealOut, status_code=201)
async def create_appeal(
    appeal_in: AppealCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Verify denial exists
    denial = await db.get(Denial, appeal_in.denial_id)
    if not denial:
        raise HTTPException(status_code=404, detail="Denial not found")

    new_id = f"APL{uuid.uuid4().hex[:7].upper()}"
    db_appeal = Appeal(
        appeal_id=new_id,
        denial_id=appeal_in.denial_id,
        claim_id=appeal_in.claim_id,
        appeal_type=appeal_in.appeal_type or "FIRST_LEVEL",
        appeal_method=appeal_in.appeal_method or "PORTAL",
        ai_generated=appeal_in.ai_generated if appeal_in.ai_generated is not None else True,
        outcome=None,   # starts as open
        appeal_quality_score=80,
        submitted_date=date.today(),
    )
    db.add(db_appeal)

    # Update denial recommended_action
    denial.recommended_action = get_recommended_action(denial.carc_code, denial.denial_category)
    await db.commit()
    await db.refresh(db_appeal)
    return db_appeal


# ── PATCH /denials/appeals/{appeal_id} ───────────────────────────────────────
@router.patch("/appeals/{appeal_id}", response_model=AppealOut)
async def update_appeal(
    appeal_id: str,
    update_in: AppealUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    appeal = await db.get(Appeal, appeal_id)
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    if update_in.outcome is not None:
        appeal.outcome = update_in.outcome
    if update_in.outcome_date is not None:
        appeal.outcome_date = update_in.outcome_date
    if update_in.recovered_amount is not None:
        appeal.recovered_amount = update_in.recovered_amount
    if update_in.approved_by_user_id is not None:
        appeal.approved_by_user_id = update_in.approved_by_user_id
    await db.commit()
    await db.refresh(appeal)
    return appeal


# ── GET /denials/appeals/{appeal_id}/letter ───────────────────────────────────
@router.get("/appeals/{appeal_id}/letter")
async def get_appeal_letter(
    appeal_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    appeal = await db.get(Appeal, appeal_id)
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")

    denial = await db.get(Denial, appeal.denial_id)
    if not denial:
        raise HTTPException(status_code=404, detail="Denial not found")

    # Fetch claim, patient, payer names
    claim = await db.get(Claim, denial.claim_id)
    patient_name = "Patient"
    payer_name = "Payer"
    dos_str = None

    if claim:
        patient_row = await db.get(Patient, claim.patient_id)
        payer_row = await db.get(Payer, claim.payer_id)
        if patient_row:
            patient_name = f"{patient_row.first_name} {patient_row.last_name}"
        if payer_row:
            payer_name = payer_row.payer_name
        dos_str = str(claim.date_of_service) if claim.date_of_service else None

    letter = generate_appeal_letter(
        denial_id=denial.denial_id,
        claim_id=denial.claim_id,
        patient=patient_name,
        payer=payer_name,
        denial_category=denial.denial_category,
        carc_code=denial.carc_code,
        rarc_code=denial.rarc_code,
        denial_amount=denial.denial_amount or 0.0,
        dos=dos_str,
    )

    # Store quality score back on appeal
    appeal.appeal_quality_score = letter["letter_quality_score"]
    await db.commit()

    return letter


# ── POST /denials ─────────────────────────────────────────────────────────────
@router.post("", response_model=DenialOut)
async def create_denial(denial_in: DenialCreate, db: AsyncSession = Depends(get_db)) -> Any:
    new_id = f"DN{uuid.uuid4().hex[:7].upper()}"
    db_denial = Denial(
        denial_id=new_id,
        claim_id=denial_in.claim_id,
        carc_code=denial_in.carc_code,
        denial_category=denial_in.denial_category,
        denial_amount=denial_in.denial_amount,
        denial_date=date.today(),
        denial_source="MANUAL",
        recommended_action=get_recommended_action(denial_in.carc_code, denial_in.denial_category),
    )
    db.add(db_denial)
    await db.commit()
    await db.refresh(db_denial)
    return db_denial


# ── GET /denials/detect-briefing ────────────────────────────────────────────
@router.get("/detect-briefing")
async def detect_briefing(db: AsyncSession = Depends(get_db)) -> Any:
    """Single aggregation endpoint for the Detect pages — filter facets, KPIs, heatmap, trends, high-risk claims."""
    try:
        # ── 1. FILTER FACETS ──────────────────────────────────────────────

        # MiroFish verdicts from RCA
        mf_rows = (await db.execute(text("""
            SELECT
                CASE
                    WHEN rca.ml_denial_probability IS NOT NULL AND rca.ml_denial_probability <= 0.45 THEN 'confirmed'
                    WHEN rca.ml_denial_probability IS NOT NULL AND rca.ml_denial_probability >= 0.70 THEN 'disputed'
                    WHEN rca.ml_denial_probability IS NULL AND rca.confidence_score >= 75 THEN 'confirmed'
                    WHEN rca.ml_denial_probability IS NULL AND rca.confidence_score < 50 THEN 'disputed'
                    ELSE 'pending'
                END AS verdict,
                COUNT(*)
            FROM root_cause_analysis rca
            GROUP BY 1
        """))).fetchall()
        mf_verdicts = [{"val": r[0], "count": r[1]} for r in mf_rows]

        # Denials without RCA = pending
        total_denials = await db.scalar(select(func.count(Denial.denial_id))) or 0
        total_with_rca = sum(v["count"] for v in mf_verdicts)
        if total_denials > total_with_rca:
            # Find existing pending entry or add one
            pending_entry = next((v for v in mf_verdicts if v["val"] == "pending"), None)
            if pending_entry:
                pending_entry["count"] += (total_denials - total_with_rca)
            else:
                mf_verdicts.append({"val": "pending", "count": total_denials - total_with_rca})

        # Urgency levels (from denial_probability thresholds)
        urg_rows = (await db.execute(text("""
            SELECT
                CASE
                    WHEN COALESCE(rca.ml_denial_probability, CASE WHEN rca.confidence_score < 50 THEN 0.80 WHEN rca.confidence_score < 75 THEN 0.55 ELSE 0.30 END) >= 0.85 THEN 'CRIT'
                    WHEN COALESCE(rca.ml_denial_probability, CASE WHEN rca.confidence_score < 50 THEN 0.80 WHEN rca.confidence_score < 75 THEN 0.55 ELSE 0.30 END) >= 0.60 THEN 'HIGH'
                    ELSE 'MED'
                END AS urg,
                COUNT(*)
            FROM root_cause_analysis rca
            GROUP BY 1
        """))).fetchall()
        urgency = [{"val": r[0], "count": r[1]} for r in urg_rows]

        # Top payers by denial count
        payer_rows = (await db.execute(text("""
            SELECT pm.payer_name, COUNT(*) as cnt
            FROM denials d
            JOIN claims c ON d.claim_id = c.claim_id
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            GROUP BY pm.payer_name
            ORDER BY cnt DESC LIMIT 8
        """))).fetchall()
        payers = [{"val": r[0], "count": r[1]} for r in payer_rows]

        # Top CARC codes
        carc_rows = (await db.execute(text("""
            SELECT carc_code, COUNT(*) as cnt
            FROM denials
            WHERE carc_code IS NOT NULL
            GROUP BY carc_code
            ORDER BY cnt DESC LIMIT 8
        """))).fetchall()
        carc_codes = [{"val": r[0], "count": r[1]} for r in carc_rows]

        # Denial categories
        cat_rows = (await db.execute(text("""
            SELECT denial_category, COUNT(*) as cnt
            FROM denials
            WHERE denial_category IS NOT NULL
            GROUP BY denial_category
            ORDER BY cnt DESC
        """))).fetchall()
        categories = [{"val": r[0], "count": r[1]} for r in cat_rows]

        # ── 2. HIGH RISK KPIs ─────────────────────────────────────────────

        hr = (await db.execute(text("""
            SELECT
                COUNT(CASE WHEN COALESCE(rca.ml_denial_probability, CASE WHEN rca.confidence_score < 50 THEN 0.80 WHEN rca.confidence_score < 75 THEN 0.55 ELSE 0.30 END) >= 0.60 THEN 1 END) as high_risk,
                COALESCE(SUM(CASE WHEN COALESCE(rca.ml_denial_probability, CASE WHEN rca.confidence_score < 50 THEN 0.80 WHEN rca.confidence_score < 75 THEN 0.55 ELSE 0.30 END) >= 0.60 THEN d.denial_amount END), 0) as hr_amount,
                COUNT(CASE WHEN COALESCE(rca.ml_write_off_probability, (100 - rca.confidence_score) / 100.0) >= 0.50 THEN 1 END) as wo_high,
                COALESCE(SUM(CASE WHEN COALESCE(rca.ml_write_off_probability, (100 - rca.confidence_score) / 100.0) >= 0.50 THEN d.denial_amount END), 0) as wo_amount,
                COUNT(CASE WHEN COALESCE(rca.ml_denial_probability, CASE WHEN rca.confidence_score >= 75 THEN 0.30 ELSE 0.55 END) <= 0.45 THEN 1 END) as preventable,
                COALESCE(SUM(CASE WHEN COALESCE(rca.ml_denial_probability, CASE WHEN rca.confidence_score >= 75 THEN 0.30 ELSE 0.55 END) <= 0.45 THEN d.denial_amount END), 0) as prev_amount
            FROM root_cause_analysis rca
            JOIN denials d ON rca.denial_id = d.denial_id
        """))).fetchone()

        crs_below = await db.scalar(text("""
            SELECT COUNT(*) FROM claims WHERE crs_score IS NOT NULL AND crs_score < 60
        """)) or 0

        # ── 3. HEATMAP (Payer x CARC) ────────────────────────────────────

        hm_rows = (await db.execute(text("""
            SELECT pm.payer_name, d.carc_code, COUNT(*) as cnt
            FROM denials d
            JOIN claims c ON d.claim_id = c.claim_id
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            WHERE d.carc_code IS NOT NULL
            GROUP BY pm.payer_name, d.carc_code
            ORDER BY cnt DESC
        """))).fetchall()

        # Build matrix
        hm_payers = list(dict.fromkeys(r[0] for r in hm_rows))[:8]
        hm_carcs = list(dict.fromkeys(r[1] for r in hm_rows))[:8]
        hm_lookup = {}
        for r in hm_rows:
            hm_lookup.setdefault(r[0], {})[r[1]] = r[2]

        hm_matrix = []
        for payer in hm_payers:
            cells = [{"category": carc, "count": hm_lookup.get(payer, {}).get(carc, 0)} for carc in hm_carcs]
            hm_matrix.append({"payer": payer, "cells": cells})

        # ── 4. TRENDING ROOT CAUSES ───────────────────────────────────────

        trend_rows = (await db.execute(text("""
            SELECT
                rca.primary_root_cause,
                rca.root_cause_group,
                COUNT(*) as cnt,
                COALESCE(SUM(rca.financial_impact), 0) as revenue
            FROM root_cause_analysis rca
            WHERE rca.primary_root_cause IS NOT NULL
            GROUP BY rca.primary_root_cause, rca.root_cause_group
            ORDER BY cnt DESC
            LIMIT 8
        """))).fetchall()

        trending = []
        for r in trend_rows:
            cause_label = (r[0] or "").replace("_", " ").title()
            group = r[1] or "Unknown"
            trending.append({
                "cause": cause_label,
                "group": group,
                "count": r[2],
                "revenue": round(float(r[3] or 0), 2),
                "trend_pct": 0,  # Would need historical comparison
                "prevention_rule": None,
            })

        # ── 5. HIGH RISK CLAIMS (top 10) ──────────────────────────────────

        hr_claims = (await db.execute(text("""
            SELECT d.claim_id, pm.payer_name, d.denial_amount, d.carc_code,
                   rca.ml_denial_probability, rca.ml_write_off_probability,
                   rca.confidence_score,
                   CASE WHEN rca.ml_denial_probability <= 0.45 THEN 'confirmed'
                        WHEN rca.ml_denial_probability >= 0.70 THEN 'disputed'
                        ELSE 'pending' END as mf_verdict
            FROM root_cause_analysis rca
            JOIN denials d ON rca.denial_id = d.denial_id
            JOIN claims c ON d.claim_id = c.claim_id
            JOIN payer_master pm ON c.payer_id = pm.payer_id
            WHERE COALESCE(rca.ml_denial_probability, CASE WHEN rca.confidence_score < 50 THEN 0.80 WHEN rca.confidence_score < 75 THEN 0.55 ELSE 0.30 END) >= 0.60
            ORDER BY COALESCE(rca.ml_denial_probability, CASE WHEN rca.confidence_score < 50 THEN 0.80 ELSE 0.30 END) DESC
            LIMIT 10
        """))).fetchall()

        high_risk_claims = [{
            "claim_id": r[0],
            "payer": r[1],
            "amount": round(float(r[2] or 0), 2),
            "carc": r[3],
            "denial_prob": round(float(r[4] or 0), 4),
            "write_off": round(float(r[5] or 0), 4),
            "crs": r[6],
            "mf_verdict": r[7],
        } for r in hr_claims]

        return {
            "filter_facets": {
                "mf_verdicts": mf_verdicts,
                "urgency": urgency,
                "payers": payers,
                "carc_codes": carc_codes,
                "categories": categories,
            },
            "kpis": {
                "high_risk_count": hr[0] if hr else 0,
                "high_risk_amount": round(float(hr[1] or 0), 2) if hr else 0,
                "crs_below_60": crs_below,
                "write_off_high": hr[2] if hr else 0,
                "write_off_amount": round(float(hr[3] or 0), 2) if hr else 0,
                "preventable_count": hr[4] if hr else 0,
                "preventable_amount": round(float(hr[5] or 0), 2) if hr else 0,
            },
            "heatmap": {
                "payers": hm_payers,
                "categories": hm_carcs,
                "matrix": hm_matrix,
            },
            "trending_root_causes": trending,
            "high_risk_claims": high_risk_claims,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Detect briefing error: {str(e)}")
