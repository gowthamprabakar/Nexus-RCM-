"""
Collections Extended API — Sprint 4
Account Detail, Templates, Disposition Codes, Escalation Reasons,
Global Timeline, Propensity Score, User Performance, Team Metrics

Endpoints:
GET /api/v1/collections/account/{account_id}            — account detail
GET /api/v1/collections/account/{account_id}/timeline   — account event timeline
GET /api/v1/collections/account/{account_id}/documents  — account documents
GET /api/v1/collections/templates                       — call/email templates
GET /api/v1/collections/disposition-codes                — post-call disposition codes
GET /api/v1/collections/escalation-reasons               — escalation reason list
GET /api/v1/collections/timeline                         — global activity timeline
GET /api/v1/collections/propensity/{account_id}         — propensity score breakdown
GET /api/v1/collections/user-performance                — agent performance metrics
GET /api/v1/collections/team-metrics                    — team aggregate metrics
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from datetime import date, timedelta
from typing import Any
import random
import hashlib

from app.db.session import get_db
from app.models.claim import Claim
from app.models.patient import Patient
from app.models.payer import Payer
from app.models.denial import Denial, Appeal
from app.models.rcm_extended import EraPayment, BankReconciliation
from app.models.ar_collections import CollectionQueue, CollectionAlert

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────
def _deterministic_seed(key: str) -> int:
    """Deterministic seed from a string so mock data is stable across calls."""
    return int(hashlib.md5(key.encode()).hexdigest()[:8], 16)


def _aging_bucket(days: int) -> str:
    if days <= 30:
        return "0-30"
    elif days <= 60:
        return "31-60"
    elif days <= 90:
        return "61-90"
    elif days <= 120:
        return "91-120"
    return "120+"


# ==========================================================================
# Group 1: Account Detail
# ==========================================================================

@router.get("/account/{account_id}")
async def get_account_detail(
    account_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Full account detail for a patient: demographics, balance, aging, payer info."""
    # Patient info
    patient = await db.get(Patient, account_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    # Claims for this patient
    claims_q = await db.execute(
        select(Claim).where(Claim.patient_id == account_id)
    )
    claims = claims_q.scalars().all()
    total_claims = len(claims)
    today = date.today()

    # Aggregate financials
    total_balance = 0.0
    paid_count = 0
    oldest_dos = today
    for c in claims:
        if c.status not in ("PAID", "WRITTEN_OFF", "VOIDED"):
            total_balance += c.total_charges or 0.0
        if c.status == "PAID":
            paid_count += 1
        if c.date_of_service and c.date_of_service < oldest_dos:
            oldest_dos = c.date_of_service

    days_outstanding = (today - oldest_dos).days if oldest_dos < today else 0
    bucket = _aging_bucket(days_outstanding)

    # Primary payer
    primary_payer_id = claims[0].payer_id if claims else None
    payer = await db.get(Payer, primary_payer_id) if primary_payer_id else None

    # Last ERA payment for this patient
    last_era = await db.execute(
        select(EraPayment.payment_date)
        .join(Claim, Claim.claim_id == EraPayment.claim_id)
        .where(Claim.patient_id == account_id)
        .order_by(desc(EraPayment.payment_date))
        .limit(1)
    )
    last_payment_row = last_era.first()
    last_payment_date = str(last_payment_row[0]) if last_payment_row else None

    # Propensity score (simple)
    payment_rate = (paid_count / total_claims * 100) if total_claims > 0 else 50
    propensity = min(100, max(0, int(payment_rate * 0.6 + (100 - min(days_outstanding, 180) / 1.8) * 0.4)))

    # Denied count
    denied_count = await db.scalar(
        select(func.count(Denial.denial_id))
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .where(Claim.patient_id == account_id)
    ) or 0

    return {
        "account_id": account_id,
        "patient": {
            "patient_id": patient.patient_id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "dob": str(patient.dob) if patient.dob else None,
            "gender": patient.gender,
            "zip": patient.zip,
            "state": patient.state,
            "mrn": patient.mrn,
        },
        "payer": {
            "payer_id": payer.payer_id if payer else None,
            "payer_name": payer.payer_name if payer else "Unknown",
            "payer_group": payer.payer_group if payer else None,
        } if payer else None,
        "total_balance": round(total_balance, 2),
        "total_claims": total_claims,
        "paid_claims": paid_count,
        "denied_claims": denied_count,
        "aging_bucket": bucket,
        "days_outstanding": days_outstanding,
        "last_payment_date": last_payment_date,
        "propensity_score": propensity,
        "contact": {
            "phone": f"(555) {_deterministic_seed(account_id) % 900 + 100}-{_deterministic_seed(account_id + 'x') % 9000 + 1000}",
            "email": f"{(patient.first_name or 'patient').lower()}.{(patient.last_name or 'unknown').lower()}@email.com",
            "preferred_contact": "Phone",
        },
    }


@router.get("/account/{account_id}/timeline")
async def get_account_timeline(
    account_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Event timeline for an account: denials, payments, claim status changes."""
    patient = await db.get(Patient, account_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    events = []

    # Denial events
    denial_q = await db.execute(
        select(Denial, Claim.total_charges, Claim.payer_id)
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .where(Claim.patient_id == account_id)
        .order_by(desc(Denial.denial_date))
        .limit(25)
    )
    for row in denial_q.all():
        d = row.Denial
        events.append({
            "event_id": f"DEN-{d.denial_id}",
            "event_type": "DENIAL",
            "date": str(d.denial_date),
            "title": f"Claim {d.claim_id} denied",
            "description": d.carc_description or f"CARC {d.carc_code}",
            "amount": round(d.denial_amount or 0, 2),
            "claim_id": d.claim_id,
            "category": d.denial_category,
        })

    # ERA payment events
    era_q = await db.execute(
        select(EraPayment, Claim.patient_id)
        .join(Claim, Claim.claim_id == EraPayment.claim_id)
        .where(Claim.patient_id == account_id)
        .order_by(desc(EraPayment.payment_date))
        .limit(25)
    )
    for row in era_q.all():
        e = row.EraPayment
        events.append({
            "event_id": f"PAY-{e.era_id}",
            "event_type": "PAYMENT",
            "date": str(e.payment_date),
            "title": f"Payment received for {e.claim_id}",
            "description": f"{e.payment_method or 'EFT'} — Trace #{e.eft_trace_number or 'N/A'}",
            "amount": round(e.payment_amount or 0, 2),
            "claim_id": e.claim_id,
            "category": "Payment",
        })

    # Appeal events
    appeal_q = await db.execute(
        select(Appeal, Denial.claim_id)
        .join(Denial, Denial.denial_id == Appeal.denial_id)
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .where(Claim.patient_id == account_id)
        .order_by(desc(Appeal.created_at))
        .limit(15)
    )
    for row in appeal_q.all():
        a = row.Appeal
        events.append({
            "event_id": f"APP-{a.appeal_id}",
            "event_type": "APPEAL",
            "date": str(a.submitted_date) if a.submitted_date else str(date.today()),
            "title": f"Appeal {a.appeal_type or 'FIRST_LEVEL'} for {row.claim_id}",
            "description": f"Outcome: {a.outcome or 'PENDING'}" + (f" — Recovered ${a.recovered_amount:,.2f}" if a.recovered_amount else ""),
            "amount": round(a.recovered_amount or 0, 2),
            "claim_id": row.claim_id,
            "category": "Appeal",
        })

    # Claim submission events
    claim_q = await db.execute(
        select(Claim)
        .where(Claim.patient_id == account_id)
        .order_by(desc(Claim.submission_date))
        .limit(15)
    )
    for c in claim_q.scalars().all():
        if c.submission_date:
            events.append({
                "event_id": f"SUB-{c.claim_id}",
                "event_type": "SUBMISSION",
                "date": str(c.submission_date),
                "title": f"Claim {c.claim_id} submitted",
                "description": f"{c.claim_type} — ${c.total_charges:,.2f}",
                "amount": round(c.total_charges or 0, 2),
                "claim_id": c.claim_id,
                "category": "Submission",
            })

    # Sort all events by date descending
    events.sort(key=lambda e: e["date"], reverse=True)

    return {"account_id": account_id, "events": events[:50]}


@router.get("/account/{account_id}/documents")
async def get_account_documents(
    account_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Documents associated with an account: ERA files, denial letters, appeal letters."""
    patient = await db.get(Patient, account_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    documents = []

    # ERA payment documents
    era_q = await db.execute(
        select(EraPayment)
        .join(Claim, Claim.claim_id == EraPayment.claim_id)
        .where(Claim.patient_id == account_id)
        .order_by(desc(EraPayment.payment_date))
        .limit(20)
    )
    for e in era_q.scalars().all():
        documents.append({
            "doc_id": f"ERA-{e.era_id}",
            "doc_type": "ERA_835",
            "title": f"ERA Payment — {e.claim_id}",
            "date": str(e.payment_date),
            "amount": round(e.payment_amount or 0, 2),
            "claim_id": e.claim_id,
            "source": "Waystar",
            "status": "POSTED",
            "reference": e.eft_trace_number or e.check_number or "N/A",
        })

    # Denial documents
    denial_q = await db.execute(
        select(Denial)
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .where(Claim.patient_id == account_id)
        .order_by(desc(Denial.denial_date))
        .limit(20)
    )
    for d in denial_q.scalars().all():
        documents.append({
            "doc_id": f"DEN-{d.denial_id}",
            "doc_type": "DENIAL_LETTER",
            "title": f"Denial Notice — {d.claim_id}",
            "date": str(d.denial_date),
            "amount": round(d.denial_amount or 0, 2),
            "claim_id": d.claim_id,
            "source": d.denial_source or "ERA_835",
            "status": "RECEIVED",
            "reference": f"CARC {d.carc_code}",
        })

    # Appeal documents
    appeal_q = await db.execute(
        select(Appeal, Denial.claim_id)
        .join(Denial, Denial.denial_id == Appeal.denial_id)
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .where(Claim.patient_id == account_id)
        .order_by(desc(Appeal.created_at))
        .limit(10)
    )
    for row in appeal_q.all():
        a = row.Appeal
        documents.append({
            "doc_id": f"APL-{a.appeal_id}",
            "doc_type": "APPEAL_LETTER",
            "title": f"Appeal {a.appeal_type or 'FIRST_LEVEL'} — {row.claim_id}",
            "date": str(a.submitted_date) if a.submitted_date else None,
            "amount": round(a.recovered_amount or 0, 2),
            "claim_id": row.claim_id,
            "source": "Internal",
            "status": a.outcome or "PENDING",
            "reference": a.appeal_id,
        })

    documents.sort(key=lambda d: d.get("date") or "1900-01-01", reverse=True)

    return {"account_id": account_id, "documents": documents}


# ==========================================================================
# Group 2: Collections Operations (Static Reference Data)
# ==========================================================================

@router.get("/templates")
async def get_templates() -> Any:
    """Call script and email templates for collections agents."""
    return {
        "call_templates": [
            {
                "template_id": "CT-001",
                "name": "First Contact",
                "category": "INITIAL",
                "script": (
                    "Hello, this is [AGENT_NAME] calling from [ORG_NAME] billing department. "
                    "I'm calling regarding an outstanding balance of [BALANCE] on your account [ACCOUNT_ID]. "
                    "This balance is from services provided on [DOS]. "
                    "Are you able to discuss payment options today?"
                ),
                "notes": "Use warm, professional tone. Verify identity with DOB before discussing balance.",
            },
            {
                "template_id": "CT-002",
                "name": "Follow-Up Call",
                "category": "FOLLOW_UP",
                "script": (
                    "Hello, this is [AGENT_NAME] from [ORG_NAME]. "
                    "I'm following up on our previous conversation regarding your balance of [BALANCE]. "
                    "On our last call on [LAST_CONTACT_DATE], we discussed [LAST_DISPOSITION]. "
                    "I wanted to check in on the status of your payment."
                ),
                "notes": "Reference previous call notes. Be empathetic but firm on timelines.",
            },
            {
                "template_id": "CT-003",
                "name": "Escalation Call",
                "category": "ESCALATION",
                "script": (
                    "Hello, this is [AGENT_NAME], a senior representative from [ORG_NAME]. "
                    "I'm reaching out regarding account [ACCOUNT_ID] with a balance of [BALANCE] "
                    "that has been outstanding for [DAYS_OUTSTANDING] days. "
                    "We need to resolve this matter promptly to avoid further collection activity."
                ),
                "notes": "Escalation tone. Offer final payment plan options. Document refusal thoroughly.",
            },
            {
                "template_id": "CT-004",
                "name": "Payment Plan Setup",
                "category": "PAYMENT_PLAN",
                "script": (
                    "I'd like to help you set up a manageable payment plan for the [BALANCE] balance. "
                    "Based on the total amount, we can offer [PLAN_OPTIONS]. "
                    "Which option works best for your situation? "
                    "I'll need your preferred payment method and the date you'd like payments to begin."
                ),
                "notes": "Maximum 12-month plans for balances under $5,000. Manager approval for longer terms.",
            },
            {
                "template_id": "CT-005",
                "name": "Final Notice Call",
                "category": "FINAL_NOTICE",
                "script": (
                    "This is [AGENT_NAME] from [ORG_NAME] with an important notice regarding account [ACCOUNT_ID]. "
                    "Your balance of [BALANCE] is now [DAYS_OUTSTANDING] days past due. "
                    "This is our final attempt to resolve this balance before it is referred for further action. "
                    "Please call us back at [PHONE] within 10 business days."
                ),
                "notes": "Final notice before write-off or external collections referral. Document all attempts.",
            },
        ],
        "email_templates": [
            {
                "template_id": "ET-001",
                "name": "Initial Balance Notification",
                "category": "INITIAL",
                "subject": "Outstanding Balance Notice — Account [ACCOUNT_ID]",
                "body": (
                    "Dear [PATIENT_NAME],\n\n"
                    "Our records indicate an outstanding balance of [BALANCE] on your account "
                    "for services provided on [DOS].\n\n"
                    "Please contact our billing department at [PHONE] or visit [PORTAL_URL] "
                    "to arrange payment.\n\n"
                    "Thank you,\n[ORG_NAME] Billing Department"
                ),
            },
            {
                "template_id": "ET-002",
                "name": "Payment Plan Confirmation",
                "category": "PAYMENT_PLAN",
                "subject": "Payment Plan Confirmed — Account [ACCOUNT_ID]",
                "body": (
                    "Dear [PATIENT_NAME],\n\n"
                    "This confirms your payment plan for the balance of [BALANCE].\n\n"
                    "Plan Details:\n"
                    "- Monthly Payment: [MONTHLY_AMOUNT]\n"
                    "- Duration: [PLAN_MONTHS] months\n"
                    "- First Payment Due: [FIRST_PAYMENT_DATE]\n"
                    "- Payment Method: [PAYMENT_METHOD]\n\n"
                    "If you have questions, please contact us at [PHONE].\n\n"
                    "Thank you,\n[ORG_NAME] Billing Department"
                ),
            },
            {
                "template_id": "ET-003",
                "name": "Final Notice Email",
                "category": "FINAL_NOTICE",
                "subject": "URGENT: Final Notice — Account [ACCOUNT_ID]",
                "body": (
                    "Dear [PATIENT_NAME],\n\n"
                    "This is a final notice regarding your outstanding balance of [BALANCE] "
                    "which is now [DAYS_OUTSTANDING] days past due.\n\n"
                    "Please contact us within 10 business days at [PHONE] to resolve this balance. "
                    "Failure to respond may result in referral to an external collection agency.\n\n"
                    "Thank you,\n[ORG_NAME] Billing Department"
                ),
            },
        ],
    }


@router.get("/disposition-codes")
async def get_disposition_codes() -> Any:
    """Post-call disposition codes for collections agents."""
    return [
        {"code": "PTP",  "label": "Promise to Pay",         "category": "POSITIVE",  "requires_date": True,  "requires_amount": True},
        {"code": "PPL",  "label": "Payment Plan Arranged",   "category": "POSITIVE",  "requires_date": True,  "requires_amount": True},
        {"code": "PIF",  "label": "Paid in Full",            "category": "POSITIVE",  "requires_date": False, "requires_amount": True},
        {"code": "LVM",  "label": "Left Voicemail",          "category": "NEUTRAL",   "requires_date": False, "requires_amount": False},
        {"code": "LME",  "label": "Left Message with Other", "category": "NEUTRAL",   "requires_date": False, "requires_amount": False},
        {"code": "NAR",  "label": "No Answer / No Response", "category": "NEUTRAL",   "requires_date": False, "requires_amount": False},
        {"code": "CBR",  "label": "Callback Requested",      "category": "NEUTRAL",   "requires_date": True,  "requires_amount": False},
        {"code": "WRN",  "label": "Wrong Number",            "category": "ISSUE",     "requires_date": False, "requires_amount": False},
        {"code": "DIS",  "label": "Disconnected Number",     "category": "ISSUE",     "requires_date": False, "requires_amount": False},
        {"code": "DEC",  "label": "Deceased",                "category": "ISSUE",     "requires_date": False, "requires_amount": False},
        {"code": "REF",  "label": "Refused to Pay",          "category": "NEGATIVE",  "requires_date": False, "requires_amount": False},
        {"code": "DSP",  "label": "Balance Dispute",         "category": "NEGATIVE",  "requires_date": False, "requires_amount": False},
        {"code": "INS",  "label": "Insurance Should Cover",  "category": "NEGATIVE",  "requires_date": False, "requires_amount": False},
        {"code": "FIN",  "label": "Financial Hardship",      "category": "NEGATIVE",  "requires_date": False, "requires_amount": False},
        {"code": "ESC",  "label": "Escalated to Supervisor", "category": "ESCALATION","requires_date": False, "requires_amount": False},
    ]


@router.get("/escalation-reasons")
async def get_escalation_reasons() -> Any:
    """Escalation reasons for collections workflow."""
    return [
        {"reason_id": "ESC-01", "label": "Payer Non-Response",           "description": "Payer has not responded to multiple outreach attempts within 30 days.",            "severity": "HIGH"},
        {"reason_id": "ESC-02", "label": "Balance Dispute",              "description": "Patient is disputing the balance and requests itemized review.",                    "severity": "MEDIUM"},
        {"reason_id": "ESC-03", "label": "Appeal Deadline Approaching",  "description": "Appeal filing deadline is within 5 business days and requires supervisor review.", "severity": "CRITICAL"},
        {"reason_id": "ESC-04", "label": "High-Value Account",           "description": "Account balance exceeds $10,000 and requires senior agent handling.",              "severity": "HIGH"},
        {"reason_id": "ESC-05", "label": "Regulatory Compliance Issue",  "description": "Patient communication may involve state regulatory requirements.",                 "severity": "CRITICAL"},
        {"reason_id": "ESC-06", "label": "Payment Plan Default",         "description": "Patient has missed 2+ consecutive payment plan installments.",                     "severity": "MEDIUM"},
        {"reason_id": "ESC-07", "label": "Timely Filing Risk",           "description": "Claim is approaching timely filing limit and requires immediate action.",           "severity": "CRITICAL"},
        {"reason_id": "ESC-08", "label": "Patient Complaint",            "description": "Patient has filed a formal complaint regarding billing practices.",                 "severity": "HIGH"},
    ]


@router.get("/timeline")
async def get_global_timeline(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Global collections activity timeline — recent 100 events across all accounts."""
    events = []

    # Recent denials
    denial_q = await db.execute(
        select(Denial, Claim.patient_id, Claim.total_charges)
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .order_by(desc(Denial.denial_date))
        .limit(40)
    )
    for row in denial_q.all():
        d = row.Denial
        events.append({
            "event_id": f"DEN-{d.denial_id}",
            "event_type": "DENIAL",
            "date": str(d.denial_date),
            "title": f"Denial on claim {d.claim_id}",
            "description": d.carc_description or f"CARC {d.carc_code}",
            "amount": round(d.denial_amount or 0, 2),
            "patient_id": row.patient_id,
            "claim_id": d.claim_id,
        })

    # Recent ERA payments
    era_q = await db.execute(
        select(EraPayment, Claim.patient_id)
        .join(Claim, Claim.claim_id == EraPayment.claim_id)
        .order_by(desc(EraPayment.payment_date))
        .limit(40)
    )
    for row in era_q.all():
        e = row.EraPayment
        events.append({
            "event_id": f"PAY-{e.era_id}",
            "event_type": "PAYMENT",
            "date": str(e.payment_date),
            "title": f"Payment received for {e.claim_id}",
            "description": f"{e.payment_method or 'EFT'} — ${e.payment_amount:,.2f}",
            "amount": round(e.payment_amount or 0, 2),
            "patient_id": row.patient_id,
            "claim_id": e.claim_id,
        })

    # Recent collection task updates
    task_q = await db.execute(
        select(CollectionQueue)
        .order_by(desc(CollectionQueue.updated_at))
        .limit(30)
    )
    for t in task_q.scalars().all():
        events.append({
            "event_id": f"TASK-{t.task_id}",
            "event_type": "TASK_UPDATE",
            "date": str(t.updated_at or t.created_at or date.today()),
            "title": f"Collection task {t.action_type} — {t.status}",
            "description": t.notes or f"Balance: ${t.balance:,.2f}, Priority: {t.priority}",
            "amount": round(t.balance or 0, 2),
            "patient_id": t.patient_id,
            "claim_id": t.claim_id,
        })

    events.sort(key=lambda e: e["date"], reverse=True)

    return {"events": events[:100]}


# ==========================================================================
# Group 3: Analytics
# ==========================================================================

@router.get("/propensity/{account_id}")
async def get_propensity_score(
    account_id: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Propensity-to-pay score breakdown with factors and recommended action."""
    patient = await db.get(Patient, account_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Account not found")

    # Try ML model first — use heuristic as fallback
    try:
        from app.ml.propensity_to_pay import PropensityToPayModel
        model = PropensityToPayModel()
        ml_result = await model.predict_patient(db, account_id)
        ml_prob = ml_result.get("probability")
        if ml_prob is not None and ml_result.get("risk_tier") != "UNKNOWN":
            ml_score = max(0, min(100, int(ml_prob * 100)))
            tier = ml_result.get("risk_tier", "MEDIUM")
            if ml_score >= 75:
                action = "STANDARD_FOLLOW_UP"
            elif ml_score >= 50:
                action = "PAYMENT_PLAN"
            elif ml_score >= 25:
                action = "ESCALATION"
            else:
                action = "WRITE_OFF_REVIEW"
            features = ml_result.get("features", {})
            return {
                "account_id": account_id,
                "overall_score": ml_score,
                "confidence": "ML_MODEL",
                "risk_tier": tier,
                "factors": [
                    {"name": "ML Propensity Model", "score": ml_score, "weight": 1.0,
                     "detail": f"Model probability {ml_prob:.2%}, tier {tier}"},
                ],
                "recommended_action": action,
                "total_claims": features.get("num_claims", 0),
                "outstanding_balance": round(features.get("patient_resp_balance", 0), 2),
                "source": "ml_model",
            }
    except Exception:
        pass  # Fall through to heuristic calculation below

    # All claims for this patient
    claims_q = await db.execute(
        select(Claim).where(Claim.patient_id == account_id)
    )
    claims = claims_q.scalars().all()
    total_claims = len(claims)

    if total_claims == 0:
        return {
            "account_id": account_id,
            "overall_score": 50,
            "factors": [],
            "recommended_action": "REVIEW",
            "confidence": "LOW",
        }

    today = date.today()

    # Factor 1: Historical payment rate
    paid_count = sum(1 for c in claims if c.status == "PAID")
    payment_rate = paid_count / total_claims
    payment_score = int(payment_rate * 100)

    # Factor 2: Average days to pay (from DOS to expected_payment_date)
    days_to_pay = []
    for c in claims:
        if c.status == "PAID" and c.expected_payment_date and c.date_of_service:
            delta = (c.expected_payment_date - c.date_of_service).days
            if 0 < delta < 365:
                days_to_pay.append(delta)
    avg_days_to_pay = sum(days_to_pay) / len(days_to_pay) if days_to_pay else 45
    timeliness_score = max(0, min(100, int(100 - (avg_days_to_pay - 14) * 1.5)))

    # Factor 3: Payer mix
    payer_ids = set(c.payer_id for c in claims if c.payer_id)
    payer_q = await db.execute(
        select(Payer).where(Payer.payer_id.in_(list(payer_ids)))
    ) if payer_ids else None
    payers = payer_q.scalars().all() if payer_q else []
    payer_groups = [p.payer_group for p in payers]
    commercial_pct = sum(1 for g in payer_groups if g and "COMMERCIAL" in g) / max(len(payer_groups), 1)
    payer_score = int(50 + commercial_pct * 30 + (1 - commercial_pct) * 10)

    # Factor 4: Outstanding balance
    outstanding = sum(c.total_charges or 0 for c in claims if c.status not in ("PAID", "WRITTEN_OFF", "VOIDED"))
    balance_score = max(0, min(100, int(100 - (outstanding / 500) * 10)))

    # Factor 5: Denial history
    denied_count = await db.scalar(
        select(func.count(Denial.denial_id))
        .join(Claim, Claim.claim_id == Denial.claim_id)
        .where(Claim.patient_id == account_id)
    ) or 0
    denial_ratio = denied_count / total_claims
    denial_score = max(0, min(100, int(100 - denial_ratio * 150)))

    # Weighted overall score
    overall = int(
        payment_score * 0.30 +
        timeliness_score * 0.20 +
        payer_score * 0.15 +
        balance_score * 0.20 +
        denial_score * 0.15
    )
    overall = max(0, min(100, overall))

    # Recommended action based on score
    if overall >= 75:
        action = "STANDARD_FOLLOW_UP"
    elif overall >= 50:
        action = "PAYMENT_PLAN"
    elif overall >= 25:
        action = "ESCALATION"
    else:
        action = "WRITE_OFF_REVIEW"

    return {
        "account_id": account_id,
        "overall_score": overall,
        "confidence": "HIGH" if total_claims >= 5 else "MEDIUM" if total_claims >= 2 else "LOW",
        "factors": [
            {"name": "Historical Payment Rate", "score": payment_score, "weight": 0.30, "detail": f"{paid_count}/{total_claims} claims paid ({payment_rate:.0%})"},
            {"name": "Payment Timeliness",      "score": timeliness_score, "weight": 0.20, "detail": f"Avg {avg_days_to_pay:.0f} days to payment"},
            {"name": "Payer Mix",               "score": payer_score, "weight": 0.15, "detail": f"{commercial_pct:.0%} commercial payers"},
            {"name": "Outstanding Balance",     "score": balance_score, "weight": 0.20, "detail": f"${outstanding:,.2f} outstanding"},
            {"name": "Denial History",          "score": denial_score, "weight": 0.15, "detail": f"{denied_count} denials ({denial_ratio:.0%} denial rate)"},
        ],
        "recommended_action": action,
        "total_claims": total_claims,
        "outstanding_balance": round(outstanding, 2),
    }


@router.get("/user-performance")
async def get_user_performance() -> Any:
    """Mock agent performance data (no real user table exists)."""
    agents = [
        {"user_id": "USR-001", "name": "Sarah Mitchell",   "role": "Senior Collector"},
        {"user_id": "USR-002", "name": "James Rodriguez",  "role": "Collections Specialist"},
        {"user_id": "USR-003", "name": "Priya Patel",      "role": "Collections Specialist"},
        {"user_id": "USR-004", "name": "Michael Chen",     "role": "AR Analyst"},
        {"user_id": "USR-005", "name": "Ashley Williams",  "role": "Collections Specialist"},
        {"user_id": "USR-006", "name": "David Kim",        "role": "Senior Collector"},
        {"user_id": "USR-007", "name": "Lauren Thompson",  "role": "Collections Manager"},
        {"user_id": "USR-008", "name": "Robert Jackson",   "role": "AR Analyst"},
    ]

    users = []
    for agent in agents:
        seed = _deterministic_seed(agent["user_id"])
        rng = random.Random(seed)
        calls = rng.randint(18, 65)
        promises = rng.randint(int(calls * 0.15), int(calls * 0.45))
        dollars = rng.uniform(8000, 85000)
        users.append({
            **agent,
            "calls_made": calls,
            "promises_obtained": promises,
            "promise_rate": round(promises / calls * 100, 1),
            "dollars_collected": round(dollars, 2),
            "avg_call_duration": f"{rng.randint(3, 12)}:{rng.randint(10, 59):02d}",
            "recovery_rate": round(rng.uniform(42, 78), 1),
            "accounts_worked": rng.randint(25, 90),
            "escalations": rng.randint(1, 8),
            "avg_propensity_score": rng.randint(45, 80),
        })

    # Sort by dollars_collected desc
    users.sort(key=lambda u: u["dollars_collected"], reverse=True)

    return {"users": users}


@router.get("/team-metrics")
async def get_team_metrics(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Team-level aggregate metrics derived from collections_tasks and ERA payments."""
    # Collection tasks
    total_tasks = await db.scalar(
        select(func.count(CollectionQueue.task_id))
    ) or 0
    completed_tasks = await db.scalar(
        select(func.count(CollectionQueue.task_id)).where(CollectionQueue.status == "CLOSED")
    ) or 0
    open_tasks = await db.scalar(
        select(func.count(CollectionQueue.task_id)).where(CollectionQueue.status.notin_(["CLOSED", "RESOLVED"]))
    ) or 0
    critical_tasks = await db.scalar(
        select(func.count(CollectionQueue.task_id)).where(
            and_(CollectionQueue.priority == "CRITICAL", CollectionQueue.status != "CLOSED")
        )
    ) or 0

    # Average balance
    avg_balance = await db.scalar(
        select(func.avg(CollectionQueue.balance)).where(CollectionQueue.status != "CLOSED")
    ) or 0.0

    # Total collected (ERA payments in last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    total_collected = await db.scalar(
        select(func.sum(EraPayment.payment_amount))
        .where(EraPayment.payment_date >= thirty_days_ago)
    ) or 0.0

    # Completion rate
    completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)

    # Average propensity score
    avg_propensity = await db.scalar(
        select(func.avg(CollectionQueue.propensity_score)).where(CollectionQueue.status != "CLOSED")
    ) or 0.0

    # Deterministic "calls today" from day seed
    day_seed = _deterministic_seed(str(date.today()))
    rng = random.Random(day_seed)
    calls_today = rng.randint(85, 220)
    promises_today = rng.randint(int(calls_today * 0.2), int(calls_today * 0.4))

    return {
        "total_tasks": total_tasks,
        "open_tasks": open_tasks,
        "completed_tasks": completed_tasks,
        "critical_tasks": critical_tasks,
        "completion_rate": completion_rate,
        "avg_balance": round(float(avg_balance), 2),
        "total_collected_30d": round(float(total_collected), 2),
        "avg_propensity_score": round(float(avg_propensity), 1),
        "calls_today": calls_today,
        "promises_today": promises_today,
        "promise_rate_today": round(promises_today / calls_today * 100, 1) if calls_today else 0,
        "active_agents": 8,
        "avg_calls_per_agent": round(calls_today / 8, 1),
    }
