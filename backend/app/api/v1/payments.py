"""
Payments & ERA API — Sprint 3 + Sprint 5 Triangulation/ADTP
GET  /api/v1/payments/summary                — KPIs: total posted, ERA count, variance
GET  /api/v1/payments/era                    — paginated ERA list with payer names
GET  /api/v1/payments/era/{era_id}           — single ERA detail
POST /api/v1/payments/post                   — post a payment to a claim
GET  /api/v1/payments/triangulation/summary  — 3-way recon: forecast vs ERA vs bank
GET  /api/v1/payments/triangulation/payer/{payer_id} — payer-level triangulation
GET  /api/v1/payments/adtp                   — rolling ADTP for a payer
GET  /api/v1/payments/adtp/anomalies         — ADTP anomaly detection
GET  /api/v1/payments/era-bank-match         — ERA vs bank reconciliation overview
GET  /api/v1/payments/float-analysis         — payment float analysis by payer
GET  /api/v1/payments/silent-underpayments   — detect silent underpayments
GET  /api/v1/payments/carc-codes             — list CARC reference codes
GET  /api/v1/payments/rarc-codes             — list RARC reference codes
POST /api/v1/payments/era/import             — upload + stage ERA file (835/CSV)
PATCH/api/v1/payments/era/{era_id}/exception — resolve an ERA exception
GET  /api/v1/payments/era/{era_id}/match-candidates — claim match suggestions
POST /api/v1/payments/era/batch-auto-post    — auto-post high-confidence matches
"""
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, text
from datetime import date, timedelta
from typing import Any, Optional
import uuid

from app.db.session import get_db
from app.models.rcm_extended import EraPayment, BankReconciliation
from app.models.payer import Payer
from app.models.claim import Claim
from app.models.patient import Patient
from app.models.code_reference import CarcCode, RarcCode
from app.schemas.payments import (
    PaymentSummary, EraPaymentOut, PaginatedERA, PostPaymentIn,
    ERABatchItem, PaginatedERABatch,
)
from app.schemas.era import (
    CarcCodeOut, RarcCodeOut,
    EraImportResponse, EraImportRowError, EraImportStagedRow,
    EraExceptionUpdate, EraExceptionResult,
    MatchCandidate, MatchCandidatesResponse,
    BatchAutoPostRequest, BatchAutoPostResponse,
    BatchAutoPostPosted, BatchAutoPostError,
)
from app.services import triangulation_service, adtp_service
from app.services import era_import_service

router = APIRouter()


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


# ── GET /payments/summary ─────────────────────────────────────────────────────
@router.get("/summary", response_model=PaymentSummary)
async def get_payment_summary(db: AsyncSession = Depends(get_db)) -> Any:
    today = date.today()
    week_from = _week_start(today)
    week_to   = week_from + timedelta(days=6)

    total_era   = await db.scalar(select(func.count(EraPayment.era_id))) or 0
    total_post  = await db.scalar(select(func.sum(EraPayment.payment_amount))) or 0.0
    total_allow = await db.scalar(select(func.sum(EraPayment.allowed_amount))) or 0.0
    total_co    = await db.scalar(select(func.sum(EraPayment.co_amount))) or 0.0
    total_pr    = await db.scalar(select(func.sum(EraPayment.pr_amount))) or 0.0
    total_oa    = await db.scalar(select(func.sum(EraPayment.oa_amount))) or 0.0

    week_q = select(
        func.count(EraPayment.era_id),
        func.sum(EraPayment.payment_amount)
    ).where(
        and_(EraPayment.payment_date >= week_from, EraPayment.payment_date <= week_to)
    )
    week_r = await db.execute(week_q)
    week_cnt, week_amt = week_r.one()

    avg_rate = round((float(total_post) / float(total_allow) * 100), 1) if total_allow else 0.0

    return PaymentSummary(
        total_era_count=total_era,
        total_posted=round(float(total_post), 2),
        total_allowed=round(float(total_allow), 2),
        avg_payment_rate=avg_rate,
        co_adjustments=round(float(total_co), 2),
        pr_adjustments=round(float(total_pr), 2),
        oa_adjustments=round(float(total_oa), 2),
        this_week_posted=round(float(week_amt or 0), 2),
        this_week_era_count=int(week_cnt or 0),
    )


# ── GET /payments/era-list ─────────────────────────────────────────────────────
@router.get("/era-list", response_model=PaginatedERABatch)
async def get_era_list(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    payer_id: Optional[str] = None,
) -> Any:
    """List ERA payments grouped by payer + payment_date for the ERA processing queue."""
    # Build a filter clause
    filters = []
    if payer_id and payer_id != "all":
        filters.append(EraPayment.payer_id == payer_id)

    where_clause = and_(*filters) if filters else True

    # Count distinct groups
    count_q = (
        select(func.count())
        .select_from(
            select(EraPayment.payer_id, EraPayment.payment_date)
            .where(where_clause)
            .group_by(EraPayment.payer_id, EraPayment.payment_date)
            .subquery()
        )
    )
    total = await db.scalar(count_q) or 0

    # Fetch grouped batches
    batch_q = (
        select(
            EraPayment.payer_id,
            EraPayment.payment_date,
            func.count(EraPayment.era_id).label("line_count"),
            func.sum(EraPayment.payment_amount).label("total_amount"),
            func.sum(EraPayment.allowed_amount).label("total_allowed"),
            func.sum(EraPayment.co_amount).label("total_co"),
            func.sum(EraPayment.pr_amount).label("total_pr"),
            func.sum(EraPayment.oa_amount).label("total_oa"),
            func.max(EraPayment.payment_method).label("payment_method"),
            Payer.payer_name,
        )
        .join(Payer, Payer.payer_id == EraPayment.payer_id, isouter=True)
        .where(where_clause)
        .group_by(EraPayment.payer_id, EraPayment.payment_date, Payer.payer_name)
        .order_by(desc(EraPayment.payment_date))
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(batch_q)
    rows = result.all()

    items = []
    for row in rows:
        pid, pdate, lc, amt, allowed, co, pr, oa, pm, pname = row
        lc = lc or 0
        amt = float(amt or 0)
        co = float(co or 0)
        pr = float(pr or 0)
        oa = float(oa or 0)
        adj_total = co + pr + oa

        # Real line-count calculations based on ERA payment vs allowed amounts
        allowed = float(allowed or 0)
        if allowed > 0:
            # Lines where payment covers most of allowed are "paid"
            payment_ratio = amt / allowed if allowed else 0
            oa_ratio = oa / allowed if allowed else 0
            # Denied lines estimated from OA (Other Adjustment) proportion
            denied_lines = max(0, int(round(lc * oa_ratio)))
            # Paid lines: proportion of payment vs allowed
            paid_lines = max(1, int(round(lc * min(payment_ratio, 1.0))))
            # Adjusted lines are the remainder (CO/PR adjustments)
            adjusted_lines = max(0, lc - paid_lines - denied_lines)
        else:
            paid_lines = max(1, lc)
            denied_lines = 0
            adjusted_lines = 0

        # Auto-match rate: payment-to-allowed ratio (higher ratio = easier auto-match)
        if allowed > 0:
            auto_match = min(99.0, max(50.0, (amt / allowed) * 100))
        else:
            auto_match = 50.0

        # Status based on auto-match rate
        if auto_match >= 95:
            status = "Auto-Posted"
        elif auto_match >= 80:
            status = "Processing"
        elif denied_lines > paid_lines:
            status = "Exceptions"
        else:
            status = "Queued"

        batch_id = f"ERA-{(pid or 'UNK')[:6]}-{str(pdate).replace('-', '')}"

        items.append(ERABatchItem(
            id=batch_id,
            payer=pname or pid or "Unknown Payer",
            payer_id=pid or "",
            date=str(pdate) if pdate else None,
            amount=round(amt, 2),
            allowed=round(float(allowed or 0), 2),
            line_count=lc,
            paid_lines=paid_lines,
            denied_lines=denied_lines,
            adjusted_lines=adjusted_lines,
            co_total=round(co, 2),
            pr_total=round(pr, 2),
            oa_total=round(oa, 2),
            auto_match_rate=round(auto_match, 1),
            status=status,
            payment_method=pm,
        ))

    return PaginatedERABatch(items=items, total=total, page=page, size=size)


# ── GET /payments/era ─────────────────────────────────────────────────────────
@router.get("/era", response_model=PaginatedERA)
async def list_era_payments(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    payer_id: Optional[str] = None,
    payment_method: Optional[str] = None,
) -> Any:
    q = (
        select(EraPayment, Payer.payer_name)
        .join(Payer, Payer.payer_id == EraPayment.payer_id, isouter=True)
    )
    if payer_id and payer_id != "all":
        q = q.where(EraPayment.payer_id == payer_id)
    if payment_method:
        q = q.where(EraPayment.payment_method == payment_method)

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    q = q.order_by(desc(EraPayment.payment_date)).offset((page - 1) * size).limit(size)
    result = await db.execute(q)
    rows = result.all()

    items = []
    for row in rows:
        e = row.EraPayment
        items.append(EraPaymentOut(
            era_id=e.era_id,
            claim_id=e.claim_id,
            payer_id=e.payer_id,
            payer_name=row.payer_name,
            payment_date=e.payment_date,
            payment_amount=e.payment_amount or 0.0,
            payment_method=e.payment_method,
            allowed_amount=e.allowed_amount,
            co_amount=e.co_amount or 0.0,
            pr_amount=e.pr_amount or 0.0,
            oa_amount=e.oa_amount or 0.0,
            eft_trace_number=e.eft_trace_number,
            check_number=e.check_number,
            adtp_cycle_number=e.adtp_cycle_number,
        ))

    return PaginatedERA(items=items, total=total or 0, page=page, size=size)


# ── GET /payments/era/{era_id} ────────────────────────────────────────────────
@router.get("/era/{era_id}", response_model=EraPaymentOut)
async def get_era_detail(era_id: str, db: AsyncSession = Depends(get_db)) -> Any:
    era = await db.get(EraPayment, era_id)
    if not era:
        raise HTTPException(status_code=404, detail="ERA not found")

    payer = await db.get(Payer, era.payer_id)
    return EraPaymentOut(
        era_id=era.era_id,
        claim_id=era.claim_id,
        payer_id=era.payer_id,
        payer_name=payer.payer_name if payer else None,
        payment_date=era.payment_date,
        payment_amount=era.payment_amount or 0.0,
        payment_method=era.payment_method,
        allowed_amount=era.allowed_amount,
        co_amount=era.co_amount or 0.0,
        pr_amount=era.pr_amount or 0.0,
        oa_amount=era.oa_amount or 0.0,
        eft_trace_number=era.eft_trace_number,
        check_number=era.check_number,
        adtp_cycle_number=era.adtp_cycle_number,
    )


# ── POST /payments/post ───────────────────────────────────────────────────────
@router.post("/post", response_model=EraPaymentOut, status_code=201)
async def post_payment(payment_in: PostPaymentIn, db: AsyncSession = Depends(get_db)) -> Any:
    # Verify claim exists
    claim = await db.get(Claim, payment_in.claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    new_era_id = f"ERA{uuid.uuid4().hex[:8].upper()}"
    today = date.today()
    week_start = _week_start(today)

    era = EraPayment(
        era_id=new_era_id,
        claim_id=payment_in.claim_id,
        payer_id=payment_in.payer_id,
        payment_date=today,
        payment_week_start=week_start,
        payment_amount=payment_in.payment_amount,
        payment_method=payment_in.payment_method or "EFT",
        eft_trace_number=payment_in.eft_trace_number,
        allowed_amount=payment_in.allowed_amount,
        co_amount=payment_in.co_amount or 0.0,
        pr_amount=payment_in.pr_amount or 0.0,
    )
    db.add(era)
    await db.commit()
    await db.refresh(era)

    payer = await db.get(Payer, era.payer_id)
    return EraPaymentOut(
        era_id=era.era_id,
        claim_id=era.claim_id,
        payer_id=era.payer_id,
        payer_name=payer.payer_name if payer else None,
        payment_date=era.payment_date,
        payment_amount=era.payment_amount,
        payment_method=era.payment_method,
        allowed_amount=era.allowed_amount,
        co_amount=era.co_amount or 0.0,
        pr_amount=era.pr_amount or 0.0,
        oa_amount=0.0,
    )


# ── GET /payments/triangulation/summary ─────────────────────────────────────
@router.get("/triangulation/summary")
async def get_triangulation_summary(
    payer_id: Optional[str] = None,
    days: Optional[int] = Query(None, ge=1, le=730, description="Lookback window in days"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Three-way reconciliation summary: Forecast vs ERA vs Bank."""
    filters = {}
    if payer_id:
        filters["payer_id"] = payer_id
    if days:
        filters["days"] = days
    return await triangulation_service.get_triangulation_summary(db, filters)


# ── GET /payments/triangulation/payer/{payer_id} ────────────────────────────
@router.get("/triangulation/payer/{payer_id}")
async def get_payer_triangulation(
    payer_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Detailed weekly triangulation for a single payer."""
    return await triangulation_service.get_payer_triangulation(db, payer_id)


# ── GET /payments/adtp ──────────────────────────────────────────────────────
@router.get("/adtp")
async def get_adtp(
    payer_id: str = Query(None, description="Payer ID (optional, returns all payers if omitted)"),
    lookback_days: int = Query(365, ge=7, le=730),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Compute rolling Average Days To Pay for payer(s)."""
    if payer_id:
        result = await adtp_service.compute_rolling_adtp(db, payer_id, lookback_days)
        return {"payers": [result]}
    # All payers
    from app.models.payer import Payer
    payer_rows = await db.execute(select(Payer.payer_id))
    payer_ids = [r[0] for r in payer_rows.fetchall()]
    results = []
    for pid in payer_ids:
        try:
            r = await adtp_service.compute_rolling_adtp(db, pid, lookback_days)
            results.append(r)
        except Exception:
            pass
    return {"payers": results, "total": len(results)}


# ── GET /payments/adtp/anomalies ────────────────────────────────────────────
@router.get("/adtp/anomalies")
async def get_adtp_anomalies(
    z_threshold: float = Query(2.0, ge=1.0, le=5.0),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Detect ADTP anomalies across all payers."""
    anomalies = await adtp_service.detect_adtp_anomalies(db, z_threshold)
    return {"anomaly_count": len(anomalies), "z_threshold": z_threshold, "anomalies": anomalies}


# ── GET /payments/era-bank-match ────────────────────────────────────────────
@router.get("/era-bank-match")
async def get_era_bank_match(
    payer_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """ERA vs bank deposit reconciliation overview."""
    try:
        q = select(
            BankReconciliation.reconciliation_status,
            func.count().label("count"),
            func.sum(BankReconciliation.era_received_amount).label("era_total"),
            func.sum(BankReconciliation.bank_deposit_amount).label("bank_total"),
            func.sum(BankReconciliation.era_bank_variance).label("variance_total"),
        ).group_by(BankReconciliation.reconciliation_status)

        if payer_id:
            q = q.where(BankReconciliation.payer_id == payer_id)

        result = await db.execute(q)
        rows = result.all()

        statuses = []
        for row in rows:
            statuses.append({
                "status": row[0],
                "count": row[1],
                "era_total": round(float(row[2] or 0), 2),
                "bank_total": round(float(row[3] or 0), 2),
                "variance_total": round(float(row[4] or 0), 2),
            })

        total_era = sum(s["era_total"] for s in statuses)
        total_bank = sum(s["bank_total"] for s in statuses)

        return {
            "total_era_received": round(total_era, 2),
            "total_bank_deposited": round(total_bank, 2),
            "net_variance": round(total_bank - total_era, 2),
            "by_status": statuses,
        }
    except Exception as e:
        return {"total_era_received": 0, "total_bank_deposited": 0, "net_variance": 0, "by_status": []}


# ── GET /payments/float-analysis ────────────────────────────────────────────
@router.get("/float-analysis")
async def get_float_analysis(
    payer_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Payment float analysis: days between ERA receipt and bank deposit."""
    return await triangulation_service.compute_float_analysis(db, payer_id)


# ── GET /payments/payer-stats ──────────────────────────────────────────────
@router.get("/payer-stats")
async def get_payer_stats(db: AsyncSession = Depends(get_db)) -> Any:
    """Return payers enriched with claim counts and revenue from ERA data."""
    q = (
        select(
            Payer.payer_id,
            Payer.payer_name,
            Payer.payer_group,
            func.count(EraPayment.era_id).label("total_claims"),
            func.sum(EraPayment.payment_amount).label("total_paid"),
        )
        .join(EraPayment, EraPayment.payer_id == Payer.payer_id, isouter=True)
        .group_by(Payer.payer_id, Payer.payer_name, Payer.payer_group)
        .order_by(desc(func.sum(EraPayment.payment_amount)))
    )
    result = await db.execute(q)
    rows = result.all()

    return [
        {
            "id": r.payer_id,
            "payer_id": r.payer_id,
            "name": r.payer_name,
            "payer_name": r.payer_name,
            "type": r.payer_group or "Commercial",
            "plan_type": r.payer_group or "Commercial",
            "status": "Active",
            "total_claims": r.total_claims or 0,
            "claims_ytd": r.total_claims or 0,
            "total_paid": round(float(r.total_paid or 0), 2),
            "revenue_ytd": round(float(r.total_paid or 0), 2),
        }
        for r in rows
    ]


# ── GET /payments/silent-underpayments ──────────────────────────────────────
def _underpayment_severity(variance_pct_abs: float) -> str:
    """Classify variance severity. variance_pct_abs is a positive percentage value."""
    if variance_pct_abs >= 25:
        return "critical"
    if variance_pct_abs >= 15:
        return "high"
    if variance_pct_abs >= 7:
        return "medium"
    return "low"


@router.get("/silent-underpayments")
async def get_silent_underpayments(
    payer_id: Optional[str] = None,
    min_variance_pct: float = Query(0.05, ge=0.01, le=1.0),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Detect silent underpayments by comparing paid vs contracted rates.
    Results are ranked by absolute variance amount (largest first) and
    enriched with a severity classification."""
    result = await triangulation_service.detect_silent_underpayments(
        db, payer_id, min_variance_pct
    )

    items = result.get("underpayments", []) or []
    for it in items:
        # Normalise field names + add ranking metadata
        var_amt = float(it.get("underpaid_amount") or 0.0)
        var_pct = abs(float(it.get("variance_pct") or 0.0))
        it["variance_amount"] = round(var_amt, 2)
        it["severity"] = _underpayment_severity(var_pct)

    items.sort(key=lambda r: r.get("variance_amount", 0.0), reverse=True)
    result["underpayments"] = items

    # Severity rollup
    rollup = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for it in items:
        sev = it.get("severity")
        if sev in rollup:
            rollup[sev] += 1
    result["severity_breakdown"] = rollup
    return result


# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  ERA Processing Backend — CARC/RARC, Import, Exceptions, Matching   ║
# ╚═══════════════════════════════════════════════════════════════════════╝

# ── GET /payments/carc-codes ────────────────────────────────────────────────
@router.get("/carc-codes", response_model=list[CarcCodeOut])
async def list_carc_codes(
    db: AsyncSession = Depends(get_db),
    group_code: Optional[str] = Query(None, description="Filter by CO/PR/OA/PI"),
) -> Any:
    """Return all CARC codes with category + group. Auto-seeds on first call
    if the table is empty."""
    try:
        # Lazy bootstrap: ensure table + seed if empty (uses caller session)
        from app.scripts.seed_carc_rarc import ensure_tables, seed_in_session
        await ensure_tables(db)

        count = await db.scalar(select(func.count(CarcCode.code))) or 0
        if count == 0:
            await seed_in_session(db)
            await db.commit()

        q = select(CarcCode)
        if group_code:
            q = q.where(CarcCode.group_code == group_code.upper())
        q = q.order_by(CarcCode.group_code, CarcCode.code)
        result = await db.execute(q)
        return [CarcCodeOut.model_validate(r) for r in result.scalars().all()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CARC fetch failed: {e}")


# ── GET /payments/rarc-codes ────────────────────────────────────────────────
@router.get("/rarc-codes", response_model=list[RarcCodeOut])
async def list_rarc_codes(db: AsyncSession = Depends(get_db)) -> Any:
    """Return all RARC codes. Auto-seeds on first call if the table is empty."""
    try:
        from app.scripts.seed_carc_rarc import ensure_tables, seed_in_session
        await ensure_tables(db)

        count = await db.scalar(select(func.count(RarcCode.code))) or 0
        if count == 0:
            await seed_in_session(db)
            await db.commit()

        result = await db.execute(select(RarcCode).order_by(RarcCode.code))
        return [RarcCodeOut.model_validate(r) for r in result.scalars().all()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RARC fetch failed: {e}")


# ── POST /payments/era/import ───────────────────────────────────────────────
@router.post("/era/import", response_model=EraImportResponse)
async def import_era_file(
    file: UploadFile = File(...),
    persist: bool = Query(True, description="If false, preview without writing to era_staging"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Accept a .csv or .835/.txt ERA file, parse it, and stage the rows."""
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty upload")

        filename = file.filename or "upload"
        lowered = filename.lower()

        # Choose parser by extension / sniff
        if lowered.endswith(".csv") or content[:8].lower().startswith(b"era_id"):
            fmt = "csv"
            parsed = era_import_service.parse_csv_file(content)
        elif content.lstrip().startswith(b"ISA") or lowered.endswith((".835", ".edi", ".x12")):
            fmt = "x12_835"
            parsed = await era_import_service.parse_835_file(content)
        else:
            # default to CSV
            fmt = "csv"
            parsed = era_import_service.parse_csv_file(content)

        staged_rows = parsed.get("staged", [])
        errors = parsed.get("errors", [])
        total_rows = parsed.get("total_rows", len(staged_rows) + len(errors))

        staged_ids: list[str] = []
        if persist and staged_rows:
            await era_import_service.ensure_staging_table(db)
            staged_ids = await era_import_service.persist_staging(
                db, staged_rows, fmt, filename
            )
            await db.commit()

        preview = []
        for sid, r in zip(staged_ids or [None] * len(staged_rows), staged_rows[:25]):
            preview.append(EraImportStagedRow(
                staging_id=sid or "PREVIEW",
                era_id=r.get("era_id"),
                claim_id=r.get("claim_id"),
                payer_id=r.get("payer_id"),
                payment_amount=float(r.get("payment_amount") or 0.0),
                payment_date=r.get("payment_date"),
                check_number=r.get("check_number"),
            ))

        return EraImportResponse(
            filename=filename,
            format=fmt,
            total_rows=total_rows,
            valid_rows=len(staged_rows),
            error_rows=len(errors),
            errors=[EraImportRowError(**e) for e in errors[:200]],
            staged_ids=staged_ids,
            preview=preview,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ERA import failed: {e}")


# ── PATCH /payments/era/{era_id}/exception ──────────────────────────────────
@router.patch("/era/{era_id}/exception", response_model=EraExceptionResult)
async def resolve_era_exception(
    era_id: str,
    body: EraExceptionUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update the workflow status of an ERA when a human resolves an exception."""
    try:
        await era_import_service.ensure_era_exception_columns(db)

        action_to_status = {
            "accept":       "POSTED",
            "reject":       "REJECTED",
            "escalate":     "ESCALATED",
            "manual_match": "MATCHED",
        }
        new_status = action_to_status[body.action]

        # Build the UPDATE statement
        params = {
            "era": era_id,
            "status": new_status,
            "notes": body.notes,
            "tgt": body.target_claim_id,
        }
        result = await db.execute(text("""
            UPDATE era_payments
               SET status = :status,
                   exception_notes = COALESCE(:notes, exception_notes),
                   target_claim_id = COALESCE(:tgt, target_claim_id)
             WHERE era_id = :era
            RETURNING era_id, status, exception_notes, target_claim_id
        """), params)
        row = result.first()

        if not row:
            raise HTTPException(status_code=404, detail=f"ERA {era_id} not found")

        # If manual_match set a target claim, also rewrite claim_id
        if body.action == "manual_match" and body.target_claim_id:
            await db.execute(text(
                "UPDATE era_payments SET claim_id = :tgt WHERE era_id = :era"
            ), {"tgt": body.target_claim_id, "era": era_id})

        await db.commit()
        return EraExceptionResult(
            era_id=row[0],
            status=row[1],
            exception_notes=row[2],
            target_claim_id=row[3],
            updated=True,
            message=f"ERA {era_id} marked {new_status}",
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Exception update failed: {e}")


# ── GET /payments/era/{era_id}/match-candidates ─────────────────────────────
def _score_candidate(
    era_amt: float,
    era_date: Optional[date],
    era_payer: Optional[str],
    cand_payer: Optional[str],
    cand_billed: float,
    cand_allowed: Optional[float],
    cand_dos: Optional[date],
) -> tuple[int, list[str]]:
    reasons: list[str] = []
    score = 0

    # Payer match (35 pts)
    if era_payer and cand_payer and era_payer == cand_payer:
        score += 35
        reasons.append("same_payer")

    # Amount closeness (40 pts) — compare against allowed if present, else billed
    target = float(cand_allowed or cand_billed or 0.0)
    if target > 0 and era_amt > 0:
        diff_pct = abs(era_amt - target) / target
        if diff_pct <= 0.001:
            score += 40
            reasons.append("amount_exact")
        elif diff_pct <= 0.02:
            score += 36
            reasons.append("amount_close")
        elif diff_pct <= 0.05:
            score += 28
            reasons.append("amount_within_5pct")
        elif diff_pct <= 0.10:
            score += 20
            reasons.append("amount_within_10pct")

    # Date proximity (25 pts)
    if era_date and cand_dos:
        delta = abs((era_date - cand_dos).days)
        if delta <= 7:
            score += 25
            reasons.append("date_within_week")
        elif delta <= 30:
            score += 18
            reasons.append("date_within_month")
        elif delta <= 60:
            score += 10
            reasons.append("date_within_60d")

    return min(score, 100), reasons


@router.get("/era/{era_id}/match-candidates", response_model=MatchCandidatesResponse)
async def get_match_candidates(
    era_id: str,
    limit: int = Query(5, ge=1, le=25),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Return top candidate claims for an unmatched / questionable ERA."""
    try:
        era = await db.get(EraPayment, era_id)
        if not era:
            raise HTTPException(status_code=404, detail=f"ERA {era_id} not found")

        era_amt = float(era.payment_amount or 0.0)
        era_date = era.payment_date
        era_payer = era.payer_id

        # Date window (60 days each side)
        date_lo = (era_date - timedelta(days=60)) if era_date else None
        date_hi = (era_date + timedelta(days=60)) if era_date else None

        # Amount window (10% on either side of allowed/billed)
        # We'll filter loosely in SQL and tighten in Python.
        amt_lo = era_amt * 0.5 if era_amt else 0.0
        amt_hi = era_amt * 1.5 if era_amt else 1e9

        q = (
            select(
                Claim.claim_id,
                Claim.patient_id,
                Claim.payer_id,
                Claim.total_charges,
                Claim.expected_allowed,
                Claim.date_of_service,
                Patient.first_name,
                Patient.last_name,
            )
            .join(Patient, Patient.patient_id == Claim.patient_id, isouter=True)
        )
        if era_payer:
            q = q.where(Claim.payer_id == era_payer)
        if date_lo and date_hi:
            q = q.where(and_(Claim.date_of_service >= date_lo,
                             Claim.date_of_service <= date_hi))
        if era_amt:
            q = q.where(and_(Claim.total_charges >= amt_lo,
                             Claim.total_charges <= amt_hi))
        q = q.limit(200)

        rows = (await db.execute(q)).all()

        candidates: list[MatchCandidate] = []
        for r in rows:
            cid, pid, py, billed, allowed, dos, fn, ln = r
            score, reasons = _score_candidate(
                era_amt, era_date, era_payer,
                py, float(billed or 0.0),
                float(allowed) if allowed is not None else None,
                dos,
            )
            if score <= 0:
                continue
            full_name = " ".join(p for p in (fn, ln) if p) or None
            candidates.append(MatchCandidate(
                claim_id=cid,
                patient_name=full_name,
                payer_id=py,
                billed=round(float(billed or 0.0), 2),
                allowed=round(float(allowed), 2) if allowed is not None else None,
                date_of_service=dos,
                confidence=score,
                match_reasons=reasons,
            ))

        candidates.sort(key=lambda c: c.confidence, reverse=True)
        return MatchCandidatesResponse(
            era_id=era_id,
            payment_amount=round(era_amt, 2),
            payer_id=era_payer,
            payment_date=era_date,
            candidates=candidates[:limit],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Candidate lookup failed: {e}")


# ── POST /payments/era/batch-auto-post ──────────────────────────────────────
@router.post("/era/batch-auto-post", response_model=BatchAutoPostResponse)
async def batch_auto_post(
    body: BatchAutoPostRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Walk unposted ERAs in scope; auto-post the ones whose best candidate
    confidence meets the threshold."""
    try:
        await era_import_service.ensure_era_exception_columns(db)

        # Fetch ERAs in scope
        q = select(EraPayment).where(
            (EraPayment.status.is_(None)) | (EraPayment.status.in_(["STAGED", "QUEUED", "EXCEPTION"]))
        )
        if body.payer_id:
            q = q.where(EraPayment.payer_id == body.payer_id)
        if body.date_from:
            q = q.where(EraPayment.payment_date >= body.date_from)
        if body.date_to:
            q = q.where(EraPayment.payment_date <= body.date_to)
        q = q.limit(body.limit)

        eras = (await db.execute(q)).scalars().all()

        posted: list[BatchAutoPostPosted] = []
        errors: list[BatchAutoPostError] = []
        skipped = 0

        for era in eras:
            try:
                era_amt = float(era.payment_amount or 0.0)
                date_lo = (era.payment_date - timedelta(days=60)) if era.payment_date else None
                date_hi = (era.payment_date + timedelta(days=60)) if era.payment_date else None
                amt_lo = era_amt * 0.5 if era_amt else 0.0
                amt_hi = era_amt * 1.5 if era_amt else 1e9

                cq = select(
                    Claim.claim_id, Claim.payer_id, Claim.total_charges,
                    Claim.expected_allowed, Claim.date_of_service,
                )
                if era.payer_id:
                    cq = cq.where(Claim.payer_id == era.payer_id)
                if date_lo and date_hi:
                    cq = cq.where(and_(Claim.date_of_service >= date_lo,
                                       Claim.date_of_service <= date_hi))
                if era_amt:
                    cq = cq.where(and_(Claim.total_charges >= amt_lo,
                                       Claim.total_charges <= amt_hi))
                cq = cq.limit(200)
                rows = (await db.execute(cq)).all()

                best_score = 0
                best_claim: Optional[str] = None
                for cid, py, billed, allowed, dos in rows:
                    s, _ = _score_candidate(
                        era_amt, era.payment_date, era.payer_id,
                        py, float(billed or 0.0),
                        float(allowed) if allowed is not None else None,
                        dos,
                    )
                    if s > best_score:
                        best_score = s
                        best_claim = cid

                if best_claim and best_score >= body.min_confidence:
                    await db.execute(text("""
                        UPDATE era_payments
                           SET status = 'POSTED',
                               claim_id = :tgt,
                               target_claim_id = :tgt,
                               exception_notes = :notes
                         WHERE era_id = :era
                    """), {
                        "tgt": best_claim,
                        "notes": f"Auto-posted (confidence={best_score})",
                        "era": era.era_id,
                    })
                    posted.append(BatchAutoPostPosted(
                        era_id=era.era_id,
                        target_claim_id=best_claim,
                        confidence=best_score,
                    ))
                else:
                    skipped += 1
            except Exception as e:
                errors.append(BatchAutoPostError(era_id=era.era_id, error=str(e)))

        await db.commit()
        return BatchAutoPostResponse(
            posted_count=len(posted),
            skipped_count=skipped,
            posted=posted,
            errors=errors,
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Batch auto-post failed: {e}")


# ── GET /payments/triangulation/unmatched-eras ──────────────────────────────
@router.get("/triangulation/unmatched-eras")
async def get_unmatched_eras(
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    ERAs that don't match a bank deposit (orphaned, delayed, pending).
    Drill-down view for triangulation reconciliation.
    """
    from app.services import finance_service
    items = await finance_service.list_unmatched_eras(db, limit=limit)
    return items
