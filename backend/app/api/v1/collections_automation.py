"""
Collections Automation Router (R4) — Dunning / Auto-Dialer / Settlements.

Mounted under /api/v1/collections/* to co-exist with existing collections router.
"""
import uuid
from datetime import datetime, timedelta, date
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, desc, and_, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.dunning import DunningSequence, DunningLetter, DunningTemplate
from app.models.auto_dialer import CallCampaign, CallLog, AgentStats
from app.models.settlement import SettlementOffer, PaymentPlan
from app.schemas.collections_automation import (
    DunningSequenceOut, DunningLetterOut, DunningTemplateOut,
    DunningSendBody, DunningSummary,
    CallCampaignOut, CallLogOut, AgentStatsOut, DialerSummary,
    CampaignCreateBody, CampaignUpdateBody,
    SettlementOfferOut, SettlementCreateBody, SettlementUpdateBody,
    SettlementSummary, PaymentPlanOut,
)

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
#  DUNNING
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/dunning/summary", response_model=DunningSummary)
async def dunning_summary(db: AsyncSession = Depends(get_db)) -> Any:
    active = await db.scalar(
        select(func.count()).select_from(DunningSequence).where(DunningSequence.status == "ACTIVE")
    )
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sent_30d = await db.scalar(
        select(func.count()).select_from(DunningLetter)
        .where(DunningLetter.sent_at.isnot(None))
        .where(DunningLetter.sent_at >= thirty_days_ago)
    )
    responded_30d = await db.scalar(
        select(func.count()).select_from(DunningLetter)
        .where(DunningLetter.status == "RESPONDED")
        .where(DunningLetter.sent_at >= thirty_days_ago)
    )
    response_rate = (responded_30d or 0) / max((sent_30d or 1), 1) * 100
    # Approx collected via dunning: sum of balances on sequences moved to COMPLETE in last 90d
    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    collected = await db.scalar(
        select(func.coalesce(func.sum(DunningSequence.total_balance), 0))
        .where(DunningSequence.status == "COMPLETE")
        .where(DunningSequence.updated_at >= ninety_days_ago)
    )
    return DunningSummary(
        active_sequences=active or 0,
        letters_sent_30d=sent_30d or 0,
        response_rate_pct=round(response_rate, 1),
        collected_via_dunning=round(float(collected or 0), 2),
    )


@router.get("/dunning/queue", response_model=List[DunningSequenceOut])
async def dunning_queue(
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> Any:
    q = select(DunningSequence)
    if status:
        q = q.where(DunningSequence.status == status.upper())
    q = q.order_by(DunningSequence.next_due_at.asc().nullslast()).limit(limit)
    rows = (await db.execute(q)).scalars().all()
    return rows


@router.post("/dunning/send")
async def dunning_send(body: DunningSendBody, db: AsyncSession = Depends(get_db)) -> Any:
    seq = await db.get(DunningSequence, body.sequence_id)
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    step = body.step or (seq.current_step)
    # Pick a template for this step
    tmpl_q = select(DunningTemplate).where(DunningTemplate.step == step).where(DunningTemplate.is_active == True).limit(1)
    tmpl = (await db.execute(tmpl_q)).scalar_one_or_none()
    letter_type = tmpl.letter_type if tmpl else "NOTICE"
    subject = tmpl.subject if tmpl else f"Dunning Step {step}"

    letter = DunningLetter(
        letter_id=f"DL-{uuid.uuid4().hex[:16]}",
        sequence_id=seq.sequence_id,
        step=step,
        letter_type=letter_type,
        sent_at=datetime.utcnow(),
        delivery_method="EMAIL",
        status="SENT",
        balance_at_send=seq.total_balance,
        subject=subject,
    )
    db.add(letter)

    # Advance sequence
    if step >= 5:
        seq.status = "COMPLETE"
    else:
        seq.current_step = step + 1
        seq.next_due_at = datetime.utcnow() + timedelta(days=14)
    seq.last_sent_at = datetime.utcnow()

    await db.commit()
    await db.refresh(letter)
    await db.refresh(seq)
    return {
        "letter_id": letter.letter_id,
        "sequence_id": seq.sequence_id,
        "new_step": seq.current_step,
        "status": seq.status,
    }


@router.get("/dunning/templates", response_model=List[DunningTemplateOut])
async def dunning_templates(db: AsyncSession = Depends(get_db)) -> Any:
    rows = (await db.execute(select(DunningTemplate).order_by(DunningTemplate.step))).scalars().all()
    return rows


@router.get("/dunning/sequence/{sequence_id}")
async def dunning_sequence_detail(sequence_id: str, db: AsyncSession = Depends(get_db)) -> Any:
    seq = await db.get(DunningSequence, sequence_id)
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    letters_q = select(DunningLetter).where(DunningLetter.sequence_id == sequence_id).order_by(DunningLetter.sent_at.asc().nullslast())
    letters = (await db.execute(letters_q)).scalars().all()
    return {
        "sequence": {
            "sequence_id": seq.sequence_id,
            "account_id": seq.account_id,
            "patient_id": seq.patient_id,
            "current_step": seq.current_step,
            "status": seq.status,
            "total_balance": seq.total_balance,
            "last_sent_at": seq.last_sent_at,
            "next_due_at": seq.next_due_at,
        },
        "letters": [
            {
                "letter_id": l.letter_id,
                "step": l.step,
                "letter_type": l.letter_type,
                "sent_at": l.sent_at,
                "status": l.status,
                "subject": l.subject,
            }
            for l in letters
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════
#  AUTO-DIALER
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/dialer/summary", response_model=DialerSummary)
async def dialer_summary(db: AsyncSession = Depends(get_db)) -> Any:
    active = await db.scalar(
        select(func.count()).select_from(CallCampaign).where(CallCampaign.status == "ACTIVE")
    )
    today = datetime.utcnow().date()
    calls_today = await db.scalar(
        select(func.count()).select_from(CallLog)
        .where(func.date(CallLog.call_started_at) == today)
    )
    # Last 30 days contact rate + promise rate
    thirty = datetime.utcnow() - timedelta(days=30)
    total_calls = await db.scalar(
        select(func.count()).select_from(CallLog).where(CallLog.call_started_at >= thirty)
    ) or 1
    contacts = await db.scalar(
        select(func.count()).select_from(CallLog)
        .where(CallLog.call_started_at >= thirty)
        .where(CallLog.outcome.in_(["CONTACT_MADE", "PAYMENT_PROMISED"]))
    ) or 0
    promises = await db.scalar(
        select(func.count()).select_from(CallLog)
        .where(CallLog.call_started_at >= thirty)
        .where(CallLog.outcome == "PAYMENT_PROMISED")
    ) or 0
    total_promised = await db.scalar(
        select(func.coalesce(func.sum(CallLog.promised_payment_amount), 0))
        .where(CallLog.call_started_at >= thirty)
    ) or 0.0
    contact_rate = contacts / total_calls * 100 if total_calls else 0
    promise_rate = promises / max(contacts, 1) * 100 if contacts else 0
    # Rough recovery rate
    recovery_q = select(func.coalesce(func.sum(AgentStats.dollars_collected), 0))
    collected = await db.scalar(recovery_q) or 0.0
    promised_all = await db.scalar(select(func.coalesce(func.sum(AgentStats.dollars_promised), 0))) or 0.0
    recovery_rate = (collected / promised_all * 100) if promised_all else 0.0

    return DialerSummary(
        active_campaigns=active or 0,
        calls_today=calls_today or 0,
        contact_rate_pct=round(contact_rate, 1),
        promise_to_pay_pct=round(promise_rate, 1),
        recovery_rate_pct=round(recovery_rate, 1),
        total_promised=round(float(total_promised), 2),
    )


@router.get("/dialer/campaigns", response_model=List[CallCampaignOut])
async def dialer_campaigns(db: AsyncSession = Depends(get_db)) -> Any:
    rows = (await db.execute(select(CallCampaign).order_by(desc(CallCampaign.created_at)))).scalars().all()
    out = []
    for c in rows:
        pct = (c.completed_count / max(c.target_count, 1) * 100) if c.target_count else 0
        out.append(CallCampaignOut(
            campaign_id=c.campaign_id,
            name=c.name,
            priority=c.priority,
            target_count=c.target_count,
            completed_count=c.completed_count,
            contact_count=c.contact_count,
            promise_count=c.promise_count,
            total_promised=c.total_promised,
            status=c.status,
            agent_count=c.agent_count,
            progress_pct=round(pct, 1),
            aging_bucket=c.aging_bucket,
        ))
    return out


@router.get("/dialer/agents", response_model=List[AgentStatsOut])
async def dialer_agents(db: AsyncSession = Depends(get_db)) -> Any:
    rows = (await db.execute(select(AgentStats).order_by(desc(AgentStats.dollars_collected)))).scalars().all()
    return rows


@router.get("/dialer/call-logs", response_model=List[CallLogOut])
async def dialer_call_logs(
    campaign_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> Any:
    q = select(CallLog)
    if campaign_id:
        q = q.where(CallLog.campaign_id == campaign_id)
    if agent_id:
        q = q.where(CallLog.agent_id == agent_id)
    q = q.order_by(desc(CallLog.call_started_at)).limit(limit)
    rows = (await db.execute(q)).scalars().all()
    return rows


@router.post("/dialer/campaigns", response_model=CallCampaignOut, status_code=201)
async def dialer_create_campaign(body: CampaignCreateBody, db: AsyncSession = Depends(get_db)) -> Any:
    c = CallCampaign(
        campaign_id=f"CMP-{uuid.uuid4().hex[:12]}",
        name=body.name,
        priority=body.priority.upper(),
        target_count=body.target_count,
        aging_bucket=body.aging_bucket,
        min_balance=body.min_balance,
        status="DRAFT",
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return CallCampaignOut(
        campaign_id=c.campaign_id,
        name=c.name,
        priority=c.priority,
        target_count=c.target_count,
        completed_count=0,
        contact_count=0,
        promise_count=0,
        total_promised=0.0,
        status=c.status,
        agent_count=c.agent_count or 0,
        progress_pct=0.0,
        aging_bucket=c.aging_bucket,
    )


@router.patch("/dialer/campaigns/{campaign_id}", response_model=CallCampaignOut)
async def dialer_update_campaign(campaign_id: str, body: CampaignUpdateBody, db: AsyncSession = Depends(get_db)) -> Any:
    c = await db.get(CallCampaign, campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if body.status is not None:
        c.status = body.status.upper()
    if body.priority is not None:
        c.priority = body.priority.upper()
    if body.target_count is not None:
        c.target_count = body.target_count
    await db.commit()
    await db.refresh(c)
    pct = (c.completed_count / max(c.target_count, 1) * 100) if c.target_count else 0
    return CallCampaignOut(
        campaign_id=c.campaign_id,
        name=c.name,
        priority=c.priority,
        target_count=c.target_count,
        completed_count=c.completed_count,
        contact_count=c.contact_count,
        promise_count=c.promise_count,
        total_promised=c.total_promised,
        status=c.status,
        agent_count=c.agent_count,
        progress_pct=round(pct, 1),
        aging_bucket=c.aging_bucket,
    )


# ═══════════════════════════════════════════════════════════════════════════
#  SETTLEMENTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/settlements/summary", response_model=SettlementSummary)
async def settlements_summary(db: AsyncSession = Depends(get_db)) -> Any:
    active = await db.scalar(
        select(func.count()).select_from(SettlementOffer)
        .where(SettlementOffer.status.in_(["SENT", "COUNTERED", "DRAFT"]))
    ) or 0
    avg_pct_row = await db.execute(
        select(func.coalesce(func.avg(SettlementOffer.offered_pct), 0))
        .where(SettlementOffer.status == "ACCEPTED")
    )
    avg_pct = avg_pct_row.scalar() or 0
    total_recovered = await db.scalar(
        select(func.coalesce(func.sum(SettlementOffer.offered_amount), 0))
        .where(SettlementOffer.status == "ACCEPTED")
    ) or 0
    approval_pending = await db.scalar(
        select(func.count()).select_from(SettlementOffer)
        .where(SettlementOffer.approval_required == True)
        .where(SettlementOffer.approved_at.is_(None))
    ) or 0
    return SettlementSummary(
        active_offers=int(active),
        avg_settlement_pct=round(float(avg_pct) * 100, 1) if float(avg_pct) <= 1 else round(float(avg_pct), 1),
        total_recovered=round(float(total_recovered), 2),
        approval_pending=int(approval_pending),
    )


@router.get("/settlements/queue", response_model=List[SettlementOfferOut])
async def settlements_queue(
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> Any:
    q = select(SettlementOffer)
    if status:
        q = q.where(SettlementOffer.status == status.upper())
    else:
        # Default: only show offers needing attention
        q = q.where(SettlementOffer.status.in_(["SENT", "COUNTERED", "DRAFT"]))
    q = q.order_by(desc(SettlementOffer.offered_at)).limit(limit)
    rows = (await db.execute(q)).scalars().all()
    return rows


@router.post("/settlements", response_model=SettlementOfferOut, status_code=201)
async def settlements_create(body: SettlementCreateBody, db: AsyncSession = Depends(get_db)) -> Any:
    if body.original_balance <= 0 or body.offered_amount <= 0:
        raise HTTPException(status_code=400, detail="Amounts must be positive")
    offered_pct = body.offered_amount / body.original_balance
    # Require approval if >40% discount (less than 60% of balance)
    approval_required = offered_pct < 0.60
    now = datetime.utcnow()
    o = SettlementOffer(
        offer_id=f"SO-{uuid.uuid4().hex[:12]}",
        account_id=body.account_id,
        patient_id=body.patient_id,
        original_balance=body.original_balance,
        offered_amount=body.offered_amount,
        offered_pct=offered_pct,
        status="DRAFT",
        offered_at=now,
        expires_at=now + timedelta(days=body.expires_days),
        approval_required=approval_required,
        notes=body.notes,
    )
    db.add(o)
    await db.commit()
    await db.refresh(o)
    return o


@router.patch("/settlements/{offer_id}", response_model=SettlementOfferOut)
async def settlements_update(offer_id: str, body: SettlementUpdateBody, db: AsyncSession = Depends(get_db)) -> Any:
    o = await db.get(SettlementOffer, offer_id)
    if not o:
        raise HTTPException(status_code=404, detail="Offer not found")
    if body.status:
        o.status = body.status.upper()
    if body.patient_counter_amount is not None:
        o.patient_counter_amount = body.patient_counter_amount
        o.status = "COUNTERED"
    if body.notes is not None:
        o.notes = body.notes
    if body.approved_by:
        o.approved_by = body.approved_by
        o.approved_at = datetime.utcnow()
        o.status = "APPROVED"
    await db.commit()
    await db.refresh(o)
    return o


@router.get("/payment-plans", response_model=List[PaymentPlanOut])
async def payment_plans_list(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> Any:
    q = select(PaymentPlan)
    if status:
        q = q.where(PaymentPlan.status == status.upper())
    q = q.order_by(desc(PaymentPlan.start_date)).limit(limit)
    rows = (await db.execute(q)).scalars().all()
    return rows


@router.get("/payment-plans/{plan_id}/schedule")
async def payment_plan_schedule(plan_id: str, db: AsyncSession = Depends(get_db)) -> Any:
    plan = await db.get(PaymentPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    schedule = []
    current = plan.start_date
    for i in range(plan.term_months):
        month_date = current.replace(day=1) if hasattr(current, 'replace') else current
        # Advance by roughly 30 days for each installment
        from dateutil.relativedelta import relativedelta
        try:
            due = plan.start_date + relativedelta(months=i)
        except Exception:
            due = plan.start_date + timedelta(days=30 * i)
        paid = i < plan.payments_made
        schedule.append({
            "installment": i + 1,
            "due_date": str(due),
            "amount": plan.monthly_payment,
            "status": "PAID" if paid else "DUE",
        })
    return {
        "plan_id": plan.plan_id,
        "total_amount": plan.total_amount,
        "payments_made": plan.payments_made,
        "remaining_balance": plan.remaining_balance,
        "schedule": schedule,
    }
