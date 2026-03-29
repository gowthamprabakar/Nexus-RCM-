"""
Graph Query Service -- The connection layer
============================================
Provides drill-down queries from macro (revenue) to micro (claim) level.
Every query follows JOIN paths through claim_id.

Level 1: Revenue -> Payers
Level 2: Payer -> Denial Categories
Level 3: Payer + Category -> Root Causes
Level 4: Filters -> Individual Claims
Level 5: Single Claim -> Full Context
"""

import logging
import json
from datetime import date, datetime
from typing import Optional

from sqlalchemy import select, func, and_, desc, case, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.denial import Denial
from app.models.root_cause import RootCauseAnalysis, ClaimRootCauseStep, PayerContractRate
from app.models.payer import Payer
from app.models.patient import Patient
from app.models.rcm_extended import (
    ClaimLine, PriorAuth, Eligibility271, EraPayment, BankReconciliation,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Level 1: Revenue impact grouped by payer
# ---------------------------------------------------------------------------

async def drill_revenue_to_payers(db: AsyncSession, filters: Optional[dict] = None) -> dict:
    """
    Revenue impact grouped by payer.
    JOIN path: root_cause_analysis -> denials (denial_id) -> claims (claim_id) -> payer_master (payer_id)
    """
    try:
        stmt = (
            select(
                RootCauseAnalysis.payer_id,
                Payer.payer_name,
                func.sum(RootCauseAnalysis.financial_impact).label("impact"),
                func.count(RootCauseAnalysis.rca_id.distinct()).label("rca_count"),
                func.count(RootCauseAnalysis.claim_id.distinct()).label("claim_count"),
                func.count(RootCauseAnalysis.denial_id.distinct()).label("denial_count"),
            )
            .join(Payer, Payer.payer_id == RootCauseAnalysis.payer_id)
            .group_by(RootCauseAnalysis.payer_id, Payer.payer_name)
            .order_by(desc("impact"))
        )

        rows = await db.execute(stmt)
        results = rows.all()

        total_impact = sum(float(r.impact or 0) for r in results)
        payers = []
        for r in results:
            impact = float(r.impact or 0)
            pct = round(impact / total_impact * 100, 1) if total_impact > 0 else 0

            # Get top root cause for this payer
            top_rc_row = await db.execute(
                select(
                    RootCauseAnalysis.primary_root_cause,
                    func.count().label("cnt"),
                )
                .where(RootCauseAnalysis.payer_id == r.payer_id)
                .group_by(RootCauseAnalysis.primary_root_cause)
                .order_by(desc("cnt"))
                .limit(1)
            )
            top_rc = top_rc_row.first()

            payers.append({
                "payer_id": r.payer_id,
                "payer_name": r.payer_name,
                "impact": round(impact, 2),
                "pct": pct,
                "claim_count": r.claim_count,
                "denial_count": r.denial_count,
                "top_root_cause": top_rc[0] if top_rc else None,
                "rag": "red" if pct >= 25 else "amber" if pct >= 10 else "green",
            })

        return {
            "total_impact": round(total_impact, 2),
            "total_payers": len(payers),
            "payers": payers,
        }

    except Exception as e:
        logger.error(f"drill_revenue_to_payers failed: {e}")
        return {"total_impact": 0, "total_payers": 0, "payers": []}


# ---------------------------------------------------------------------------
# Level 2: For a specific payer, show denial categories
# ---------------------------------------------------------------------------

async def drill_payer_to_categories(db: AsyncSession, payer_id: str) -> dict:
    """
    For a specific payer, show denial categories.
    JOIN path: root_cause_analysis -> denials (denial_id) GROUP BY denial_category
    """
    try:
        # Get payer name
        payer = await db.get(Payer, payer_id)
        payer_name = payer.payer_name if payer else payer_id

        stmt = (
            select(
                Denial.denial_category,
                func.count(Denial.denial_id.distinct()).label("count"),
                func.sum(RootCauseAnalysis.financial_impact).label("impact"),
                func.avg(RootCauseAnalysis.confidence_score).label("avg_confidence"),
            )
            .join(RootCauseAnalysis, RootCauseAnalysis.denial_id == Denial.denial_id)
            .where(RootCauseAnalysis.payer_id == payer_id)
            .group_by(Denial.denial_category)
            .order_by(desc("impact"))
        )

        rows = await db.execute(stmt)
        results = rows.all()

        total_impact = sum(float(r.impact or 0) for r in results)

        categories = []
        for r in results:
            impact = float(r.impact or 0)
            pct = round(impact / total_impact * 100, 1) if total_impact > 0 else 0
            categories.append({
                "category": r.denial_category,
                "count": r.count,
                "impact": round(impact, 2),
                "pct": pct,
                "avg_confidence": round(float(r.avg_confidence or 0), 1),
                "rag": "red" if pct >= 30 else "amber" if pct >= 15 else "green",
            })

        return {
            "payer_id": payer_id,
            "payer_name": payer_name,
            "total_impact": round(total_impact, 2),
            "categories": categories,
        }

    except Exception as e:
        logger.error(f"drill_payer_to_categories failed for {payer_id}: {e}")
        return {"payer_id": payer_id, "payer_name": payer_id, "total_impact": 0, "categories": []}


# ---------------------------------------------------------------------------
# Level 3: For a payer + category, show root causes with weights
# ---------------------------------------------------------------------------

async def drill_category_to_root_causes(
    db: AsyncSession, payer_id: str, denial_category: str
) -> dict:
    """
    For a payer + denial category, show root causes with bayesian weights.
    JOIN path: root_cause_analysis -> denials (denial_id) WHERE payer_id AND denial_category
    """
    try:
        payer = await db.get(Payer, payer_id)
        payer_name = payer.payer_name if payer else payer_id

        stmt = (
            select(
                RootCauseAnalysis.primary_root_cause,
                RootCauseAnalysis.root_cause_group,
                func.count(RootCauseAnalysis.rca_id).label("count"),
                func.avg(RootCauseAnalysis.bayesian_weight).label("avg_weight"),
                func.sum(RootCauseAnalysis.financial_impact).label("impact"),
                func.avg(RootCauseAnalysis.confidence_score).label("avg_confidence"),
            )
            .join(Denial, Denial.denial_id == RootCauseAnalysis.denial_id)
            .where(
                and_(
                    RootCauseAnalysis.payer_id == payer_id,
                    Denial.denial_category == denial_category,
                )
            )
            .group_by(RootCauseAnalysis.primary_root_cause, RootCauseAnalysis.root_cause_group)
            .order_by(desc("impact"))
        )

        rows = await db.execute(stmt)
        results = rows.all()

        total_weight = sum(float(r.avg_weight or 0) for r in results)

        root_causes = []
        for r in results:
            weight = float(r.avg_weight or 0)
            weight_pct = round(weight / total_weight * 100, 1) if total_weight > 0 else 0

            # Get resolution path from any RCA with this root cause
            res_row = await db.execute(
                select(RootCauseAnalysis.resolution_path)
                .where(
                    and_(
                        RootCauseAnalysis.payer_id == payer_id,
                        RootCauseAnalysis.primary_root_cause == r.primary_root_cause,
                        RootCauseAnalysis.resolution_path.isnot(None),
                    )
                )
                .limit(1)
            )
            res = res_row.scalar()

            root_causes.append({
                "cause": r.primary_root_cause,
                "group": r.root_cause_group,
                "count": r.count,
                "weight_pct": weight_pct,
                "impact": round(float(r.impact or 0), 2),
                "avg_confidence": round(float(r.avg_confidence or 0), 1),
                "resolution_path": res,
            })

        return {
            "payer_id": payer_id,
            "payer_name": payer_name,
            "denial_category": denial_category,
            "root_causes": root_causes,
        }

    except Exception as e:
        logger.error(f"drill_category_to_root_causes failed: {e}")
        return {
            "payer_id": payer_id, "payer_name": payer_id,
            "denial_category": denial_category, "root_causes": [],
        }


# ---------------------------------------------------------------------------
# Level 4: Get actual individual claims for a root cause
# ---------------------------------------------------------------------------

async def drill_root_cause_to_claims(
    db: AsyncSession,
    payer_id: str = None,
    root_cause: str = None,
    denial_category: str = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """
    Get actual individual claims matching filter criteria.
    JOIN path: root_cause_analysis -> denials -> claims -> payer_master, patients
    """
    try:
        # Build base query
        stmt = (
            select(
                Claim.claim_id,
                Patient.first_name,
                Patient.last_name,
                Payer.payer_name,
                Claim.date_of_service,
                Claim.total_charges,
                Denial.denial_amount,
                Denial.denial_date,
                Denial.carc_code,
                Denial.denial_category,
                Denial.appeal_deadline,
                RootCauseAnalysis.primary_root_cause,
                RootCauseAnalysis.confidence_score,
                RootCauseAnalysis.resolution_path,
                RootCauseAnalysis.financial_impact,
            )
            .join(RootCauseAnalysis, RootCauseAnalysis.claim_id == Claim.claim_id)
            .join(Denial, Denial.denial_id == RootCauseAnalysis.denial_id)
            .join(Payer, Payer.payer_id == Claim.payer_id)
            .outerjoin(Patient, Patient.patient_id == Claim.patient_id)
        )

        # Count query
        count_stmt = (
            select(func.count(Claim.claim_id.distinct()))
            .join(RootCauseAnalysis, RootCauseAnalysis.claim_id == Claim.claim_id)
            .join(Denial, Denial.denial_id == RootCauseAnalysis.denial_id)
        )

        conditions = []
        if payer_id:
            conditions.append(RootCauseAnalysis.payer_id == payer_id)
        if root_cause:
            conditions.append(RootCauseAnalysis.primary_root_cause == root_cause)
        if denial_category:
            conditions.append(Denial.denial_category == denial_category)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = await db.scalar(count_stmt) or 0

        stmt = (
            stmt
            .order_by(desc(RootCauseAnalysis.financial_impact))
            .limit(limit)
            .offset(offset)
        )

        rows = await db.execute(stmt)
        results = rows.all()

        claims = []
        for r in results:
            patient_name = "Unknown"
            if r.first_name and r.last_name:
                patient_name = f"{r.first_name} {r.last_name}"
            elif r.first_name:
                patient_name = r.first_name

            claims.append({
                "claim_id": r.claim_id,
                "patient_name": patient_name,
                "payer_name": r.payer_name,
                "date_of_service": str(r.date_of_service) if r.date_of_service else None,
                "total_charges": float(r.total_charges or 0),
                "denial_amount": float(r.denial_amount or 0),
                "denial_date": str(r.denial_date) if r.denial_date else None,
                "carc_code": r.carc_code,
                "denial_category": r.denial_category,
                "primary_root_cause": r.primary_root_cause,
                "confidence_score": r.confidence_score,
                "resolution_path": r.resolution_path,
                "financial_impact": round(float(r.financial_impact or 0), 2),
                "appeal_deadline": str(r.appeal_deadline) if r.appeal_deadline else None,
            })

        return {"total": total, "limit": limit, "offset": offset, "claims": claims}

    except Exception as e:
        logger.error(f"drill_root_cause_to_claims failed: {e}")
        return {"total": 0, "limit": limit, "offset": offset, "claims": []}


# ---------------------------------------------------------------------------
# Level 5: Complete context for a single claim
# ---------------------------------------------------------------------------

async def get_claim_full_context(db: AsyncSession, claim_id: str) -> dict:
    """
    Complete context for a single claim -- everything connected.
    Pulls from claims, denials, root_cause_analysis, era_payments,
    claim_lines, eligibility_271, prior_auth.
    """
    try:
        # 1. Claim
        claim = await db.get(Claim, claim_id)
        if not claim:
            return {"error": "Claim not found", "claim_id": claim_id}

        payer = await db.get(Payer, claim.payer_id)
        patient = await db.get(Patient, claim.patient_id)

        claim_data = {
            "claim_id": claim.claim_id,
            "patient_id": claim.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else None,
            "payer_id": claim.payer_id,
            "payer_name": payer.payer_name if payer else claim.payer_id,
            "date_of_service": str(claim.date_of_service) if claim.date_of_service else None,
            "dos_through": str(claim.dos_through) if claim.dos_through else None,
            "total_charges": float(claim.total_charges or 0),
            "expected_allowed": float(claim.expected_allowed or 0),
            "status": claim.status,
            "claim_type": claim.claim_type,
            "submission_date": str(claim.submission_date) if claim.submission_date else None,
            "crs_score": claim.crs_score,
            "crs_passed": claim.crs_passed,
            "adtp_days": claim.adtp_days,
            "expected_payment_date": str(claim.expected_payment_date) if claim.expected_payment_date else None,
        }

        # 2. Denial (most recent)
        denial_row = await db.execute(
            select(Denial)
            .where(Denial.claim_id == claim_id)
            .order_by(desc(Denial.denial_date))
            .limit(1)
        )
        denial = denial_row.scalars().first()
        denial_data = None
        if denial:
            denial_data = {
                "denial_id": denial.denial_id,
                "carc_code": denial.carc_code,
                "carc_description": denial.carc_description,
                "rarc_code": denial.rarc_code,
                "rarc_description": denial.rarc_description,
                "denial_category": denial.denial_category,
                "denial_amount": float(denial.denial_amount or 0),
                "denial_date": str(denial.denial_date) if denial.denial_date else None,
                "appeal_deadline": str(denial.appeal_deadline) if denial.appeal_deadline else None,
                "adjustment_type": denial.adjustment_type,
                "recommended_action": denial.recommended_action,
                "similar_denial_30d": denial.similar_denial_30d,
            }

        # 3. Root Cause Analysis (most recent)
        rca_row = await db.execute(
            select(RootCauseAnalysis)
            .where(RootCauseAnalysis.claim_id == claim_id)
            .order_by(desc(RootCauseAnalysis.created_at))
            .limit(1)
        )
        rca = rca_row.scalars().first()
        root_cause_data = None
        if rca:
            # Get steps
            steps_row = await db.execute(
                select(ClaimRootCauseStep)
                .where(ClaimRootCauseStep.rca_id == rca.rca_id)
                .order_by(ClaimRootCauseStep.step_number)
            )
            steps = steps_row.scalars().all()

            root_cause_data = {
                "rca_id": rca.rca_id,
                "primary_root_cause": rca.primary_root_cause,
                "secondary_root_cause": rca.secondary_root_cause,
                "confidence_score": rca.confidence_score,
                "bayesian_weight": round(float(rca.bayesian_weight or 0), 4),
                "root_cause_group": rca.root_cause_group,
                "financial_impact": round(float(rca.financial_impact or 0), 2),
                "resolution_path": rca.resolution_path,
                "evidence_summary": rca.evidence_summary,
                "steps": [
                    {
                        "step_number": s.step_number,
                        "step_name": s.step_name,
                        "finding": s.finding,
                        "finding_status": s.finding_status,
                        "contribution_weight": round(float(s.contribution_weight or 0), 4),
                    }
                    for s in steps
                ],
            }

        # 4. ERA Payment
        era_row = await db.execute(
            select(EraPayment)
            .where(EraPayment.claim_id == claim_id)
            .order_by(desc(EraPayment.payment_date))
            .limit(1)
        )
        era = era_row.scalars().first()
        era_data = None
        if era:
            era_data = {
                "era_id": era.era_id,
                "payment_amount": float(era.payment_amount or 0),
                "payment_date": str(era.payment_date) if era.payment_date else None,
                "payment_method": era.payment_method,
                "eft_trace": era.eft_trace_number,
                "allowed_amount": float(era.allowed_amount or 0) if era.allowed_amount else None,
                "co_amount": float(era.co_amount or 0),
                "pr_amount": float(era.pr_amount or 0),
                "oa_amount": float(era.oa_amount or 0),
                "pi_amount": float(era.pi_amount or 0),
            }

        # 4b. Contract comparison (expected vs actual payment)
        contract_comparison = None
        if era:
            # Get first CPT code from claim lines for contract rate lookup
            first_line_row = await db.execute(
                select(ClaimLine.cpt_code)
                .where(ClaimLine.claim_id == claim_id)
                .order_by(ClaimLine.line_number)
                .limit(1)
            )
            first_cpt_code = first_line_row.scalar()

            if first_cpt_code:
                contract_row = await db.execute(
                    select(PayerContractRate)
                    .where(
                        and_(
                            PayerContractRate.payer_id == claim.payer_id,
                            PayerContractRate.cpt_code == first_cpt_code,
                        )
                    )
                    .order_by(desc(PayerContractRate.effective_date))
                    .limit(1)
                )
                contract_rate = contract_row.scalars().first()
                if contract_rate:
                    expected = float(contract_rate.expected_rate or 0)
                    actual = float(era.payment_amount or 0)
                    variance = actual - expected
                    variance_pct = round(variance / expected * 100, 1) if expected > 0 else 0.0
                    if abs(variance_pct) < 1.0:
                        cmp_status = "CORRECT"
                    elif variance < 0:
                        cmp_status = "UNDERPAID"
                    else:
                        cmp_status = "OVERPAID"
                    contract_comparison = {
                        "expected_rate": expected,
                        "actual_paid": actual,
                        "variance": round(variance, 2),
                        "variance_pct": variance_pct,
                        "status": cmp_status,
                    }

        # 4c. Bank reconciliation (most recent for this payer)
        reconciliation_data = None
        recon_row = await db.execute(
            select(BankReconciliation)
            .where(BankReconciliation.payer_id == claim.payer_id)
            .order_by(desc(BankReconciliation.week_start_date))
            .limit(1)
        )
        recon = recon_row.scalars().first()
        if recon:
            era_amt = float(recon.era_received_amount or 0)
            bank_amt = float(recon.bank_deposit_amount or 0)
            recon_variance = bank_amt - era_amt
            recon_variance_pct = round(recon_variance / era_amt * 100, 1) if era_amt > 0 else 0.0
            reconciliation_data = {
                "status": recon.reconciliation_status,
                "era_amount": era_amt,
                "bank_amount": bank_amt,
                "variance": round(recon_variance, 2),
                "variance_pct": recon_variance_pct,
                "week_start": str(recon.week_start_date) if recon.week_start_date else None,
                "week_end": str(recon.week_end_date) if recon.week_end_date else None,
            }

        # 5. Claim Lines
        lines_row = await db.execute(
            select(ClaimLine)
            .where(ClaimLine.claim_id == claim_id)
            .order_by(ClaimLine.line_number)
        )
        lines = lines_row.scalars().all()
        claim_lines = [
            {
                "line_number": ln.line_number,
                "cpt_code": ln.cpt_code,
                "icd10_primary": ln.icd10_primary,
                "modifier_1": ln.modifier_1,
                "modifier_2": ln.modifier_2,
                "units": ln.units,
                "charge_amount": float(ln.charge_amount or 0),
                "allowed_amount": float(ln.allowed_amount or 0) if ln.allowed_amount else None,
                "paid_amount": float(ln.paid_amount or 0) if ln.paid_amount else None,
            }
            for ln in lines
        ]

        # 6. Eligibility (most recent for this patient + payer)
        elig_row = await db.execute(
            select(Eligibility271)
            .where(
                and_(
                    Eligibility271.patient_id == claim.patient_id,
                    Eligibility271.payer_id == claim.payer_id,
                )
            )
            .order_by(desc(Eligibility271.inquiry_date))
            .limit(1)
        )
        elig = elig_row.scalars().first()
        eligibility_data = None
        if elig:
            eligibility_data = {
                "subscriber_status": elig.subscriber_status,
                "coverage_effective": str(elig.coverage_effective) if elig.coverage_effective else None,
                "coverage_term": str(elig.coverage_term) if elig.coverage_term else None,
                "deductible_remaining": float(elig.deductible_remaining or 0),
                "oop_remaining": float(elig.oop_remaining or 0),
                "prior_auth_required": elig.prior_auth_required,
                "network_status": elig.network_status,
                "plan_type": elig.plan_type,
            }

        # 7. Prior Auth
        auth_row = await db.execute(
            select(PriorAuth)
            .where(PriorAuth.claim_id == claim_id)
            .order_by(desc(PriorAuth.requested_date))
            .limit(1)
        )
        auth = auth_row.scalars().first()
        prior_auth_data = None
        if auth:
            prior_auth_data = {
                "auth_id": auth.auth_id,
                "auth_number": auth.auth_number,
                "auth_type": auth.auth_type,
                "status": auth.status,
                "requested_date": str(auth.requested_date) if auth.requested_date else None,
                "approved_date": str(auth.approved_date) if auth.approved_date else None,
                "expiry_date": str(auth.expiry_date) if auth.expiry_date else None,
                "approved_units": auth.approved_units,
            }

        # 8. Lifecycle stages (computed for every claim)
        lifecycle_stages = _compute_lifecycle_stages(claim, denial, era)

        # 9. Payment prediction (for pending / submitted claims)
        payment_prediction = None
        if claim.submission_date:
            today = date.today()
            days_elapsed = (today - claim.submission_date).days
            adtp = claim.adtp_days
            if adtp:
                pred_status = "ON_TRACK" if days_elapsed < adtp else "OVERDUE"
            else:
                pred_status = "UNKNOWN"
            payment_prediction = {
                "expected_payment_date": str(claim.expected_payment_date) if claim.expected_payment_date else None,
                "adtp_days": adtp,
                "days_elapsed": days_elapsed,
                "status": pred_status,
            }

        # 10. Suggested actions based on full context
        suggested_actions = _build_suggested_actions(root_cause_data, denial_data, claim_data)

        return {
            "claim": claim_data,
            "denial": denial_data,
            "root_cause": root_cause_data,
            "era_payment": era_data,
            "contract_comparison": contract_comparison,
            "reconciliation": reconciliation_data,
            "claim_lines": claim_lines,
            "eligibility": eligibility_data,
            "prior_auth": prior_auth_data,
            "lifecycle_stages": lifecycle_stages,
            "payment_prediction": payment_prediction,
            "suggested_actions": suggested_actions,
        }

    except Exception as e:
        logger.error(f"get_claim_full_context failed for {claim_id}: {e}")
        return {"error": str(e), "claim_id": claim_id}


def _build_suggested_actions(root_cause_data, denial_data, claim_data) -> list:
    """Build suggested actions based on available context."""
    actions = []

    if root_cause_data:
        rc = root_cause_data["primary_root_cause"]
        conf = root_cause_data.get("confidence_score", 0)

        action_map = {
            "ELIGIBILITY_LAPSE": {"action": "Verify eligibility and resubmit", "priority": "high"},
            "AUTH_MISSING": {"action": "Obtain retroactive authorization and appeal", "priority": "high"},
            "AUTH_EXPIRED": {"action": "Request auth extension and appeal with clinical justification", "priority": "high"},
            "CODING_MISMATCH": {"action": "Review coding accuracy, correct and resubmit", "priority": "medium"},
            "TIMELY_FILING_MISS": {"action": "Gather proof of timely filing and appeal", "priority": "critical"},
            "COB_ORDER_ERROR": {"action": "Verify COB order and resubmit to correct payer", "priority": "medium"},
            "DOCUMENTATION_DEFICIT": {"action": "Obtain missing documentation and appeal", "priority": "medium"},
            "PAYER_BEHAVIOR_SHIFT": {"action": "Escalate to payer relations for policy review", "priority": "high"},
            "CONTRACT_RATE_GAP": {"action": "File underpayment appeal with contract reference", "priority": "high"},
            "PROVIDER_ENROLLMENT": {"action": "Verify provider enrollment status with payer", "priority": "high"},
            "PROCESS_BREAKDOWN": {"action": "Review workflow and resubmit", "priority": "medium"},
        }

        mapped = action_map.get(rc, {"action": f"Investigate {rc}", "priority": "medium"})
        actions.append({
            "action": mapped["action"],
            "priority": mapped["priority"],
            "confidence": conf,
            "automation_available": rc in ("ELIGIBILITY_LAPSE", "AUTH_MISSING", "CODING_MISMATCH"),
        })

    if denial_data and denial_data.get("appeal_deadline"):
        actions.append({
            "action": f"File appeal before deadline ({denial_data['appeal_deadline']})",
            "priority": "critical",
            "confidence": 95,
            "automation_available": True,
        })

    if claim_data.get("status") in ("SUBMITTED", "ACKNOWLEDGED") and claim_data.get("submission_date"):
        actions.append({
            "action": "Follow up with payer on claim status",
            "priority": "medium",
            "confidence": 80,
            "automation_available": False,
        })

    return actions


def _compute_lifecycle_stages(claim, denial, era) -> list:
    """Compute the lifecycle stages for a claim based on available data."""
    stages = []

    # Service
    stages.append({
        "stage": "Service",
        "date": str(claim.date_of_service) if claim.date_of_service else None,
        "status": "complete",
    })

    # Submitted
    if claim.submission_date:
        stages.append({
            "stage": "Submitted",
            "date": str(claim.submission_date),
            "status": "complete",
        })

    # CRS Scored
    if claim.crs_score is not None:
        stages.append({
            "stage": "CRS Scored",
            "score": claim.crs_score,
            "passed": claim.crs_passed,
            "status": "complete",
        })

    # Acknowledged (if status indicates)
    if claim.status in ("ACKNOWLEDGED", "PAID", "DENIED", "APPEALED"):
        stages.append({
            "stage": "Acknowledged",
            "status": "complete",
        })

    # Denied
    if denial:
        stages.append({
            "stage": "Denied",
            "date": str(denial.denial_date) if denial.denial_date else None,
            "status": "alert",
        })

    # Appealed
    if claim.status == "APPEALED":
        stages.append({
            "stage": "Appealed",
            "status": "in_progress",
        })

    # Paid
    if era:
        stages.append({
            "stage": "Paid",
            "date": str(era.payment_date) if era.payment_date else None,
            "amount": float(era.payment_amount or 0),
            "status": "complete",
        })

    # Determine current stage
    if stages:
        stages[-1]["current"] = True

    return stages


# ---------------------------------------------------------------------------
# Browse claims (paginated, filterable)
# ---------------------------------------------------------------------------

async def browse_claims(
    db: AsyncSession,
    status: str = None,
    payer_id: str = None,
    page: int = 1,
    size: int = 25,
    sort: str = "total_charges",
) -> dict:
    """
    Paginated claim list for browsing. Works across all claim statuses.
    Returns claim_id, patient_name, payer_name, total_charges, status,
    date_of_service, crs_score, has_denial, has_payment.
    """
    try:
        # Sub-queries for has_denial / has_payment flags
        denial_sub = (
            select(Denial.claim_id)
            .where(Denial.claim_id == Claim.claim_id)
            .correlate(Claim)
            .exists()
        )
        era_sub = (
            select(EraPayment.claim_id)
            .where(EraPayment.claim_id == Claim.claim_id)
            .correlate(Claim)
            .exists()
        )

        stmt = (
            select(
                Claim.claim_id,
                Patient.first_name,
                Patient.last_name,
                Payer.payer_name,
                Claim.total_charges,
                Claim.status,
                Claim.date_of_service,
                Claim.crs_score,
                denial_sub.label("has_denial"),
                era_sub.label("has_payment"),
            )
            .outerjoin(Patient, Patient.patient_id == Claim.patient_id)
            .outerjoin(Payer, Payer.payer_id == Claim.payer_id)
        )

        count_stmt = select(func.count(Claim.claim_id))

        conditions = []
        if status:
            conditions.append(Claim.status == status)
        if payer_id:
            conditions.append(Claim.payer_id == payer_id)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))

        total = await db.scalar(count_stmt) or 0

        # Sorting
        sort_map = {
            "total_charges": desc(Claim.total_charges),
            "date_of_service": desc(Claim.date_of_service),
            "crs_score": desc(Claim.crs_score),
            "status": Claim.status,
            "claim_id": Claim.claim_id,
        }
        order = sort_map.get(sort, desc(Claim.total_charges))

        offset = (page - 1) * size
        stmt = stmt.order_by(order).limit(size).offset(offset)

        rows = await db.execute(stmt)
        results = rows.all()

        claims = []
        for r in results:
            patient_name = "Unknown"
            if r.first_name and r.last_name:
                patient_name = f"{r.first_name} {r.last_name}"
            elif r.first_name:
                patient_name = r.first_name

            claims.append({
                "claim_id": r.claim_id,
                "patient_name": patient_name,
                "payer_name": r.payer_name,
                "total_charges": float(r.total_charges or 0),
                "status": r.status,
                "date_of_service": str(r.date_of_service) if r.date_of_service else None,
                "crs_score": r.crs_score,
                "has_denial": bool(r.has_denial),
                "has_payment": bool(r.has_payment),
            })

        return {
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if size > 0 else 0,
            "claims": claims,
        }

    except Exception as e:
        logger.error(f"browse_claims failed: {e}")
        return {"total": 0, "page": page, "size": size, "pages": 0, "claims": []}
