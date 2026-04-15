"""
Seed script for Collections Automation — dunning, auto-dialer, settlements.

Idempotent: skips seeding if data already exists.

Usage:
    python -m app.scripts.seed_collections_automation
"""
from __future__ import annotations

import asyncio
import logging
import random
import uuid
from datetime import datetime, timedelta, date

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.dunning import DunningSequence, DunningLetter, DunningTemplate
from app.models.auto_dialer import CallCampaign, CallLog, AgentStats
from app.models.settlement import SettlementOffer, PaymentPlan
from app.models.ar_collections import CollectionQueue

logger = logging.getLogger(__name__)


# ── Dunning Templates (5 standard steps) ────────────────────────────────────
DUNNING_TEMPLATES = [
    (1, "SOFT_REMINDER",
     "Friendly reminder: your balance of ${balance}",
     "<p>Dear {patient_name},</p><p>Our records show a balance of <strong>${balance}</strong> for services rendered on {dos}. Please contact us at your earliest convenience.</p>",
     "Dear {patient_name},\n\nOur records show a balance of ${balance} for services rendered on {dos}. Please contact us at your earliest convenience."),
    (2, "NOTICE",
     "Account notice: payment past due",
     "<p>Dear {patient_name},</p><p>Your account shows an outstanding balance of <strong>${balance}</strong> past due by 30 days. To avoid further collection steps, please remit payment or arrange a payment plan.</p>",
     "Dear {patient_name},\n\nYour account balance of ${balance} is past due by 30 days. Please remit payment or contact us to arrange a payment plan."),
    (3, "FINAL_NOTICE",
     "Final notice before escalation — ${balance}",
     "<p>Dear {patient_name},</p><p>This is your <strong>final notice</strong>. Your balance of <strong>${balance}</strong> is 60+ days past due. Without payment arrangement within 14 days, your account may be referred to a collection agency.</p>",
     "FINAL NOTICE\n\nDear {patient_name},\n\nYour balance of ${balance} is 60+ days past due. Without payment or a payment plan within 14 days, your account may be referred to a collection agency."),
    (4, "PRE_LEGAL",
     "Pre-legal notification — last opportunity",
     "<p>Dear {patient_name},</p><p>We have attempted multiple times to resolve your account balance of <strong>${balance}</strong>. Unless resolved within 10 business days, your account will be submitted for legal review.</p>",
     "PRE-LEGAL NOTIFICATION\n\nDear {patient_name},\n\nDespite prior notices, your balance of ${balance} remains unpaid. Your account will be submitted for legal review within 10 business days if not resolved."),
    (5, "LEGAL",
     "Legal action commenced — ${balance}",
     "<p>Dear {patient_name},</p><p>Due to non-payment, your account has been escalated to our legal department. Contact our office within 5 business days to discuss resolution.</p>",
     "LEGAL ACTION\n\nDear {patient_name},\n\nDue to non-payment of ${balance}, your account has been escalated to legal. Contact our office within 5 business days to discuss resolution."),
]


# ── Agent roster ────────────────────────────────────────────────────────────
AGENTS = [
    ("AGT-001", "Maria Rodriguez"),
    ("AGT-002", "James Chen"),
    ("AGT-003", "Sarah Okonkwo"),
    ("AGT-004", "David Patel"),
    ("AGT-005", "Lisa Thompson"),
]


OUTCOMES = [
    ("NO_ANSWER",          0.30),
    ("VOICEMAIL",          0.25),
    ("CONTACT_MADE",       0.15),
    ("PAYMENT_PROMISED",   0.12),
    ("DISPUTE",            0.08),
    ("REFUSED",            0.05),
    ("WRONG_NUMBER",       0.05),
]


async def _pick_weighted(choices):
    r = random.random()
    cum = 0
    for val, w in choices:
        cum += w
        if r <= cum:
            return val
    return choices[-1][0]


async def seed_dunning(db: AsyncSession) -> dict:
    # Templates
    existing_tmpl = await db.scalar(select(func.count()).select_from(DunningTemplate))
    if (existing_tmpl or 0) == 0:
        for (step, letter_type, subject, html, text_body) in DUNNING_TEMPLATES:
            db.add(DunningTemplate(
                template_id=f"DT-S{step}",
                step=step,
                letter_type=letter_type,
                subject=subject,
                body_html=html,
                body_text=text_body,
                is_active=True,
            ))
        await db.commit()
        logger.info("Seeded 5 dunning templates")

    existing_seq = await db.scalar(select(func.count()).select_from(DunningSequence))
    if (existing_seq or 0) >= 400:
        return {"skipped": True, "existing_sequences": existing_seq}

    # Sample collection queue accounts — link to real tasks
    task_rows = (await db.execute(
        select(CollectionQueue.task_id, CollectionQueue.patient_id, CollectionQueue.payer_id, CollectionQueue.balance)
        .limit(500)
    )).all()

    created_seq = 0
    created_letters = 0
    for task_id, patient_id, payer_id, balance in task_rows:
        if created_seq >= 500:
            break
        step = random.choice([1, 1, 2, 2, 3, 4, 5])
        status = random.choice(["ACTIVE", "ACTIVE", "ACTIVE", "COMPLETE", "STOPPED"])
        last_sent = datetime.utcnow() - timedelta(days=random.randint(1, 45))
        seq = DunningSequence(
            sequence_id=f"DS-{uuid.uuid4().hex[:16]}",
            account_id=str(task_id),
            patient_id=patient_id,
            payer_id=payer_id,
            current_step=step,
            last_sent_at=last_sent,
            next_due_at=last_sent + timedelta(days=14) if status == "ACTIVE" else None,
            status=status,
            total_balance=float(balance or 0),
        )
        db.add(seq)
        created_seq += 1

        # Generate past letters for this sequence
        for past_step in range(1, step + 1):
            sent_date = last_sent - timedelta(days=(step - past_step) * 14)
            letter_type_map = {1: "SOFT_REMINDER", 2: "NOTICE", 3: "FINAL_NOTICE", 4: "PRE_LEGAL", 5: "LEGAL"}
            letter_status = random.choice(["SENT", "DELIVERED", "DELIVERED", "OPENED", "BOUNCED", "RESPONDED"])
            db.add(DunningLetter(
                letter_id=f"DL-{uuid.uuid4().hex[:16]}",
                sequence_id=seq.sequence_id,
                step=past_step,
                letter_type=letter_type_map.get(past_step, "NOTICE"),
                sent_at=sent_date,
                delivery_method=random.choice(["EMAIL", "EMAIL", "MAIL", "PORTAL"]),
                status=letter_status,
                balance_at_send=float(balance or 0),
                subject=DUNNING_TEMPLATES[past_step - 1][2],
            ))
            created_letters += 1

    await db.commit()
    return {"created_sequences": created_seq, "created_letters": created_letters}


async def seed_auto_dialer(db: AsyncSession) -> dict:
    existing_cmp = await db.scalar(select(func.count()).select_from(CallCampaign))
    if (existing_cmp or 0) >= 3:
        return {"skipped": True, "existing_campaigns": existing_cmp}

    campaigns = [
        ("Critical 90+ days", "CRITICAL", "91-120", 250, 180, 95, 48),
        ("High Risk 60-90",   "HIGH",     "61-90",  420, 280, 145, 72),
        ("Standard 30-60",    "MEDIUM",   "31-60",  580, 320, 155, 52),
    ]
    created_campaigns = []
    for (name, priority, bucket, target, completed, contacts, promises) in campaigns:
        c = CallCampaign(
            campaign_id=f"CMP-{uuid.uuid4().hex[:12]}",
            name=name,
            priority=priority,
            target_count=target,
            completed_count=completed,
            contact_count=contacts,
            promise_count=promises,
            total_promised=promises * random.uniform(400, 2000),
            status="ACTIVE",
            agent_count=len(AGENTS),
            aging_bucket=bucket,
        )
        db.add(c)
        created_campaigns.append(c)
    await db.commit()

    # Seed call logs
    existing_logs = await db.scalar(select(func.count()).select_from(CallLog))
    if (existing_logs or 0) >= 500:
        return {"campaigns_created": len(created_campaigns), "logs_skipped": True}

    task_rows = (await db.execute(
        select(CollectionQueue.task_id, CollectionQueue.patient_id, CollectionQueue.balance).limit(400)
    )).all()

    total_logs = 0
    for cmp_rec in created_campaigns:
        for _ in range(random.randint(200, 300)):
            if not task_rows:
                break
            task_id, patient_id, balance = random.choice(task_rows)
            agent_id, agent_name = random.choice(AGENTS)
            outcome = await _pick_weighted(OUTCOMES)
            promised_amt = 0.0
            if outcome == "PAYMENT_PROMISED":
                promised_amt = float(balance or 0) * random.uniform(0.3, 1.0)
            duration = random.randint(15, 380) if outcome in ("CONTACT_MADE", "PAYMENT_PROMISED", "DISPUTE", "REFUSED") else random.randint(8, 25)
            db.add(CallLog(
                call_id=f"CL-{uuid.uuid4().hex[:16]}",
                campaign_id=cmp_rec.campaign_id,
                account_id=str(task_id),
                patient_id=patient_id,
                agent_id=agent_id,
                agent_name=agent_name,
                call_started_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24 * 30)),
                call_duration_sec=duration,
                outcome=outcome,
                disposition_code=f"D-{random.randint(1, 99):02d}",
                notes=f"Call outcome: {outcome.replace('_', ' ').lower()}",
                promised_payment_amount=promised_amt,
                balance_at_call=float(balance or 0),
            ))
            total_logs += 1
    await db.commit()

    # Agent stats
    existing_stats = await db.scalar(select(func.count()).select_from(AgentStats))
    if (existing_stats or 0) == 0:
        for agent_id, agent_name in AGENTS:
            stats_q = select(
                func.count().label("total"),
                func.sum(func.case((CallLog.outcome.in_(["CONTACT_MADE", "PAYMENT_PROMISED"]), 1), else_=0)).label("contacts") if False else func.count().label("dummy"),
            ).where(CallLog.agent_id == agent_id)
            # Simpler: separate queries
            total = await db.scalar(select(func.count()).select_from(CallLog).where(CallLog.agent_id == agent_id)) or 0
            contacts = await db.scalar(
                select(func.count()).select_from(CallLog)
                .where(CallLog.agent_id == agent_id)
                .where(CallLog.outcome.in_(["CONTACT_MADE", "PAYMENT_PROMISED"]))
            ) or 0
            promises = await db.scalar(
                select(func.count()).select_from(CallLog)
                .where(CallLog.agent_id == agent_id)
                .where(CallLog.outcome == "PAYMENT_PROMISED")
            ) or 0
            promised = await db.scalar(
                select(func.coalesce(func.sum(CallLog.promised_payment_amount), 0))
                .where(CallLog.agent_id == agent_id)
            ) or 0.0
            avg_dur = await db.scalar(
                select(func.coalesce(func.avg(CallLog.call_duration_sec), 0))
                .where(CallLog.agent_id == agent_id)
            ) or 0.0
            last = await db.scalar(
                select(func.max(CallLog.call_started_at))
                .where(CallLog.agent_id == agent_id)
            )
            today = datetime.utcnow().date()
            today_calls = await db.scalar(
                select(func.count()).select_from(CallLog)
                .where(CallLog.agent_id == agent_id)
                .where(func.date(CallLog.call_started_at) == today)
            ) or 0
            week_ago = datetime.utcnow() - timedelta(days=7)
            week_calls = await db.scalar(
                select(func.count()).select_from(CallLog)
                .where(CallLog.agent_id == agent_id)
                .where(CallLog.call_started_at >= week_ago)
            ) or 0
            contact_rate = (contacts / total * 100) if total else 0
            collected = float(promised) * 0.65  # assume 65% of promises actually paid
            db.add(AgentStats(
                agent_id=agent_id,
                agent_name=agent_name,
                calls_today=today_calls,
                calls_week=week_calls,
                contacts_made=contacts,
                promises_secured=promises,
                dollars_collected=collected,
                dollars_promised=float(promised),
                avg_call_duration=float(avg_dur),
                contact_rate_pct=round(contact_rate, 1),
                last_activity_at=last,
            ))
        await db.commit()

    return {"campaigns_created": len(created_campaigns), "logs_created": total_logs, "agents_seeded": len(AGENTS)}


async def seed_settlements(db: AsyncSession) -> dict:
    existing = await db.scalar(select(func.count()).select_from(SettlementOffer))
    if (existing or 0) >= 150:
        return {"skipped": True, "existing_offers": existing}

    task_rows = (await db.execute(
        select(CollectionQueue.task_id, CollectionQueue.patient_id, CollectionQueue.balance)
        .where(CollectionQueue.balance > 500).limit(250)
    )).all()

    created_offers = 0
    created_plans = 0
    for task_id, patient_id, balance in task_rows:
        if created_offers >= 200:
            break
        orig = float(balance or 0)
        if orig < 100:
            continue
        discount_pct = random.uniform(0.30, 0.80)  # 30-80% of original
        offered = orig * discount_pct
        status = random.choice(["DRAFT", "SENT", "SENT", "SENT", "COUNTERED", "ACCEPTED", "ACCEPTED", "REJECTED", "EXPIRED"])
        counter = None
        if status == "COUNTERED":
            counter = offered * random.uniform(1.05, 1.3)
        offered_at = datetime.utcnow() - timedelta(days=random.randint(0, 60))
        approval_required = discount_pct < 0.60
        db.add(SettlementOffer(
            offer_id=f"SO-{uuid.uuid4().hex[:12]}",
            account_id=str(task_id),
            patient_id=patient_id,
            original_balance=orig,
            offered_amount=offered,
            offered_pct=discount_pct,
            status=status,
            offered_at=offered_at,
            expires_at=offered_at + timedelta(days=30),
            patient_counter_amount=counter,
            approval_required=approval_required,
            approved_by="Lead Collector" if status == "ACCEPTED" and approval_required else None,
            approved_at=offered_at + timedelta(days=3) if status == "ACCEPTED" and approval_required else None,
            notes=f"Settlement offer: {round(discount_pct * 100)}% of ${round(orig)}",
        ))
        created_offers += 1

    # Payment plans
    for task_id, patient_id, balance in task_rows[:60]:
        orig = float(balance or 0)
        if orig < 300:
            continue
        term = random.choice([6, 12, 18, 24])
        monthly = orig / term
        start = date.today() - timedelta(days=random.randint(0, 180))
        payments_made = min(term, random.randint(0, term))
        payments_total = monthly * payments_made
        remaining = orig - payments_total
        status = "COMPLETED" if payments_made >= term else ("DEFAULTED" if random.random() < 0.08 else "ACTIVE")
        db.add(PaymentPlan(
            plan_id=f"PP-{uuid.uuid4().hex[:12]}",
            account_id=str(task_id),
            patient_id=patient_id,
            total_amount=orig,
            monthly_payment=monthly,
            term_months=term,
            start_date=start,
            next_payment_date=start + timedelta(days=30 * (payments_made + 1)) if status == "ACTIVE" else None,
            status=status,
            payments_made=payments_made,
            payments_total_amount=payments_total,
            remaining_balance=max(remaining, 0),
        ))
        created_plans += 1

    await db.commit()
    return {"created_offers": created_offers, "created_plans": created_plans}


async def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    async with AsyncSessionLocal() as db:
        # Create tables if missing
        from app.db.base import Base
        from app.db.session import engine
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        d = await seed_dunning(db)
        logger.info("Dunning: %s", d)
        ad = await seed_auto_dialer(db)
        logger.info("Auto-dialer: %s", ad)
        s = await seed_settlements(db)
        logger.info("Settlements: %s", s)


if __name__ == "__main__":
    asyncio.run(main())
