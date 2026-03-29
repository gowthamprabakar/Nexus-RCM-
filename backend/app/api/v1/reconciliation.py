"""
Reconciliation API — Sprint 3 (extracted from /forecast)
GET /api/v1/reconciliation/summary              — variance stats + status breakdown
GET /api/v1/reconciliation/weekly               — payer-level weekly recon rows
GET /api/v1/reconciliation/era                  — ERA-to-bank transaction audit trail
GET /api/v1/reconciliation/transaction/{id}     — full transaction detail
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, desc
from datetime import date, timedelta
from typing import Any, Optional

from app.core.deps import get_db
from app.models.rcm_extended import BankReconciliation, EraPayment, PaymentForecast
from app.models.payer import Payer
from app.models.claim import Claim
from app.models.patient import Patient
from app.schemas.payments import BankReconOut, ReconSummary

router = APIRouter()


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


# ── GET /reconciliation/summary ───────────────────────────────────────────────
@router.get("/summary", response_model=ReconSummary)
async def get_recon_summary(db: AsyncSession = Depends(get_db)) -> Any:
    total_forecast  = await db.scalar(select(func.sum(BankReconciliation.forecasted_amount))) or 0.0
    total_era       = await db.scalar(select(func.sum(BankReconciliation.era_received_amount))) or 0.0
    total_bank      = await db.scalar(select(func.sum(BankReconciliation.bank_deposit_amount))) or 0.0

    overall_var     = float(total_era) - float(total_forecast)
    overall_var_pct = round((overall_var / float(total_forecast) * 100), 1) if total_forecast else 0.0

    reconciled  = await db.scalar(select(func.count(BankReconciliation.recon_id)).where(BankReconciliation.reconciliation_status == "RECONCILED")) or 0
    variance    = await db.scalar(select(func.count(BankReconciliation.recon_id)).where(BankReconciliation.reconciliation_status == "VARIANCE")) or 0
    escalated   = await db.scalar(select(func.count(BankReconciliation.recon_id)).where(BankReconciliation.reconciliation_status == "ESCALATED")) or 0
    pending     = await db.scalar(select(func.count(BankReconciliation.recon_id)).where(BankReconciliation.reconciliation_status == "PENDING")) or 0

    return ReconSummary(
        total_forecasted=round(float(total_forecast), 2),
        total_era_received=round(float(total_era), 2),
        total_bank_deposited=round(float(total_bank), 2),
        overall_variance=round(overall_var, 2),
        overall_variance_pct=overall_var_pct,
        reconciled_count=reconciled,
        variance_count=variance,
        escalated_count=escalated,
        pending_count=pending,
    )


# ── GET /reconciliation/weekly ────────────────────────────────────────────────
@router.get("/weekly", response_model=list[BankReconOut])
async def get_weekly_recon(
    db: AsyncSession = Depends(get_db),
    weeks_back: int = Query(12, ge=1, le=52),
    payer_id: Optional[str] = None,
    status: Optional[str] = None,
) -> Any:
    today     = date.today()
    from_date = _week_start(today) - timedelta(weeks=weeks_back)

    q = (
        select(BankReconciliation)
        .where(BankReconciliation.week_start_date >= from_date)
        .order_by(desc(BankReconciliation.week_start_date))
    )
    if payer_id and payer_id != "all":
        q = q.where(BankReconciliation.payer_id == payer_id)
    if status:
        q = q.where(BankReconciliation.reconciliation_status == status)

    q = q.limit(200)
    result = await db.execute(q)
    rows = result.scalars().all()

    return [
        BankReconOut(
            recon_id=r.recon_id,
            week_start_date=r.week_start_date,
            week_end_date=r.week_end_date,
            payer_id=r.payer_id,
            payer_name=r.payer_name,
            forecasted_amount=r.forecasted_amount or 0.0,
            era_received_amount=r.era_received_amount,
            bank_deposit_amount=r.bank_deposit_amount,
            forecast_variance=r.forecast_variance,
            forecast_variance_pct=r.forecast_variance_pct,
            era_bank_variance=r.era_bank_variance,
            reconciliation_status=r.reconciliation_status,
            reconciled_date=r.reconciled_date,
            variance_reason=r.variance_reason,
        )
        for r in rows
    ]


# ── GET /reconciliation/era ───────────────────────────────────────────────────
@router.get("/era")
async def get_era_audit_trail(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    payer_id: Optional[str] = None,
) -> Any:
    """ERA-to-bank transaction audit trail for TransactionLedger page."""
    q = (
        select(EraPayment, Payer.payer_name)
        .join(Payer, Payer.payer_id == EraPayment.payer_id, isouter=True)
    )
    if payer_id and payer_id != "all":
        q = q.where(EraPayment.payer_id == payer_id)

    total = await db.scalar(select(func.count()).select_from(q.subquery())) or 0
    q = q.order_by(desc(EraPayment.payment_date)).offset((page - 1) * size).limit(size)
    result = await db.execute(q)
    rows = result.all()

    return {
        "items": [
            {
                "era_id":           r.EraPayment.era_id,
                "claim_id":         r.EraPayment.claim_id,
                "payer_name":       r.payer_name or r.EraPayment.payer_id,
                "payment_date":     str(r.EraPayment.payment_date) if r.EraPayment.payment_date else None,
                "payment_amount":   round(r.EraPayment.payment_amount or 0, 2),
                "payment_method":   r.EraPayment.payment_method,
                "eft_trace_number": r.EraPayment.eft_trace_number,
                "co_amount":        round(r.EraPayment.co_amount or 0, 2),
                "pr_amount":        round(r.EraPayment.pr_amount or 0, 2),
                "status":           "POSTED",
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "size": size,
    }


# ── GET /reconciliation/transaction/{transaction_id} ─────────────────────────
@router.get("/transaction/{transaction_id}")
async def get_transaction_detail(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Full detail of a reconciliation transaction by recon_id."""
    recon = await db.get(BankReconciliation, transaction_id)
    if not recon:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Get payer detail
    payer = await db.get(Payer, recon.payer_id) if recon.payer_id else None

    # Get associated ERA payments for this payer/week
    era_q = await db.execute(
        select(EraPayment)
        .where(
            and_(
                EraPayment.payer_id == recon.payer_id,
                EraPayment.payment_week_start == recon.week_start_date,
            )
        )
        .order_by(desc(EraPayment.payment_date))
        .limit(50)
    )
    era_rows = era_q.scalars().all()

    era_details = [
        {
            "era_id": e.era_id,
            "claim_id": e.claim_id,
            "payment_date": str(e.payment_date) if e.payment_date else None,
            "payment_amount": round(e.payment_amount or 0, 2),
            "payment_method": e.payment_method,
            "eft_trace_number": e.eft_trace_number,
            "co_amount": round(e.co_amount or 0, 2),
            "pr_amount": round(e.pr_amount or 0, 2),
            "oa_amount": round(e.oa_amount or 0, 2),
        }
        for e in era_rows
    ]

    return {
        "recon_id": recon.recon_id,
        "week_start_date": str(recon.week_start_date),
        "week_end_date": str(recon.week_end_date),
        "payer": {
            "payer_id": payer.payer_id if payer else recon.payer_id,
            "payer_name": payer.payer_name if payer else recon.payer_name,
            "payer_group": payer.payer_group if payer else None,
            "adtp_days": payer.adtp_days if payer else None,
            "payment_method": payer.payment_method if payer else None,
        },
        "forecasted_amount": round(float(recon.forecasted_amount or 0), 2),
        "era_received_amount": round(float(recon.era_received_amount or 0), 2),
        "bank_deposit_amount": round(float(recon.bank_deposit_amount or 0), 2),
        "forecast_variance": round(float(recon.forecast_variance or 0), 2),
        "forecast_variance_pct": round(float(recon.forecast_variance_pct or 0), 1),
        "era_bank_variance": round(float(recon.era_bank_variance or 0), 2),
        "reconciliation_status": recon.reconciliation_status,
        "reconciled_date": str(recon.reconciled_date) if recon.reconciled_date else None,
        "reconciled_by": recon.reconciled_by,
        "variance_reason": recon.variance_reason,
        "float_days": recon.float_days,
        "float_amount": round(float(recon.float_amount or 0), 2),
        "is_anomaly": recon.is_anomaly or False,
        "anomaly_type": recon.anomaly_type,
        "era_payments": era_details,
        "era_payment_count": len(era_details),
    }


# ── helper: paginated paid-claims for a payer ─────────────────────────────
async def _payer_claims_paginated(
    payer_id: str,
    page: int,
    size: int,
    db: AsyncSession,
):
    """Shared logic for both by-id and by-name endpoints."""
    base = (
        select(
            EraPayment.era_id,
            EraPayment.claim_id,
            EraPayment.payment_amount,
            EraPayment.payment_date,
            EraPayment.payment_method,
            EraPayment.allowed_amount,
            EraPayment.co_amount,
            EraPayment.pr_amount,
            Claim.date_of_service,
            Claim.total_charges,
            Patient.first_name,
            Patient.last_name,
        )
        .join(Claim, Claim.claim_id == EraPayment.claim_id)
        .join(Patient, Patient.patient_id == Claim.patient_id)
        .where(Claim.payer_id == payer_id)
    )

    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0

    # Summaries
    sum_q = (
        select(
            func.sum(Claim.total_charges).label("total_charged"),
            func.sum(EraPayment.payment_amount).label("total_paid"),
        )
        .join(Claim, Claim.claim_id == EraPayment.claim_id)
        .join(Patient, Patient.patient_id == Claim.patient_id)
        .where(Claim.payer_id == payer_id)
    )
    sums = (await db.execute(sum_q)).first()
    total_charged = round(float(sums.total_charged or 0), 2)
    total_paid = round(float(sums.total_paid or 0), 2)

    # Payer name
    payer = await db.get(Payer, payer_id)
    payer_name = payer.payer_name if payer else payer_id

    # Paginated rows
    rows_q = (
        base.order_by(desc(EraPayment.payment_amount))
        .offset((page - 1) * size)
        .limit(size)
    )
    rows = (await db.execute(rows_q)).all()

    claims = [
        {
            "claim_id": r.claim_id,
            "patient_name": f"{r.first_name or ''} {r.last_name or ''}".strip(),
            "date_of_service": str(r.date_of_service) if r.date_of_service else None,
            "total_charges": round(float(r.total_charges or 0), 2),
            "payment_amount": round(float(r.payment_amount or 0), 2),
            "allowed_amount": round(float(r.allowed_amount or 0), 2),
            "co_amount": round(float(r.co_amount or 0), 2),
            "pr_amount": round(float(r.pr_amount or 0), 2),
            "payment_date": str(r.payment_date) if r.payment_date else None,
            "payment_method": r.payment_method or "EFT",
            "variance": round(float(r.total_charges or 0) - float(r.payment_amount or 0), 2),
        }
        for r in rows
    ]

    return {
        "claims": claims,
        "total": total,
        "page": page,
        "size": size,
        "summary": {
            "total_claims": total,
            "total_charged": total_charged,
            "total_paid": total_paid,
            "total_variance": round(total_charged - total_paid, 2),
            "payer_name": payer_name,
        },
    }


# ── GET /reconciliation/payer-claims/{payer_id} ───────────────────────────
@router.get("/payer-claims/{payer_id}")
async def get_payer_reconciliation_claims(
    payer_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Paid claims for a specific payer — used by Payer Reconciliation Claims page."""
    return await _payer_claims_paginated(payer_id, page, size, db)


# ── GET /reconciliation/payer-claims-by-name ──────────────────────────────
@router.get("/payer-claims-by-name")
async def get_payer_claims_by_name(
    payer_name: str = Query(...),
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Resolve payer_name → payer_id, then return paginated paid claims."""
    result = await db.execute(
        select(Payer.payer_id).where(Payer.payer_name == payer_name).limit(1)
    )
    row = result.scalar_one_or_none()
    if not row:
        # Try case-insensitive / partial match
        result = await db.execute(
            select(Payer.payer_id)
            .where(func.lower(Payer.payer_name).contains(payer_name.lower()))
            .limit(1)
        )
        row = result.scalar_one_or_none()
    if not row:
        return {"claims": [], "total": 0, "page": page, "size": size, "summary": {
            "total_claims": 0, "total_charged": 0, "total_paid": 0,
            "total_variance": 0, "payer_name": payer_name,
        }}
    return await _payer_claims_paginated(row, page, size, db)
