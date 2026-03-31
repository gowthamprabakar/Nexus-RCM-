"""
Diagnostics Router -- Sprint 6 + Sprint 7 persistence
========================================================
Surfaces ranked diagnostic findings from the persistent diagnostic_finding table.

GET   /diagnostics/summary                  -- system-wide diagnostic summary (from DB)
GET   /diagnostics/findings                 -- list findings from DB, filterable
POST  /diagnostics/refresh                  -- re-run all 5 detectors and persist results
POST  /diagnostics/acknowledge/{finding_id} -- mark a finding as acknowledged
GET   /diagnostics/payer/{payer_id}         -- payer-specific diagnostic
GET   /diagnostics/claim/{claim_id}         -- claim-specific diagnostic
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.rcm_extended import DiagnosticFinding
from app.services.diagnostic_service import (
    generate_system_diagnostics,
    generate_payer_diagnostic,
    generate_claim_diagnostic,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/summary")
async def get_diagnostics_summary(db: AsyncSession = Depends(get_db)):
    """System-wide diagnostic summary queried from the persistent table."""
    try:
        total = await db.scalar(
            select(func.count(DiagnosticFinding.finding_id))
            .where(DiagnosticFinding.status != "RESOLVED")
        ) or 0
        critical = await db.scalar(
            select(func.count(DiagnosticFinding.finding_id))
            .where(DiagnosticFinding.severity == "CRITICAL")
            .where(DiagnosticFinding.status != "RESOLVED")
        ) or 0
        warning = await db.scalar(
            select(func.count(DiagnosticFinding.finding_id))
            .where(DiagnosticFinding.severity == "WARNING")
            .where(DiagnosticFinding.status != "RESOLVED")
        ) or 0
        info = await db.scalar(
            select(func.count(DiagnosticFinding.finding_id))
            .where(DiagnosticFinding.severity == "INFO")
            .where(DiagnosticFinding.status != "RESOLVED")
        ) or 0
        total_impact = await db.scalar(
            select(func.sum(DiagnosticFinding.financial_impact))
            .where(DiagnosticFinding.status != "RESOLVED")
        ) or 0

        # By category
        cat_rows = await db.execute(
            select(
                DiagnosticFinding.category,
                func.count().label("count"),
                func.sum(DiagnosticFinding.financial_impact).label("impact"),
            )
            .where(DiagnosticFinding.status != "RESOLVED")
            .group_by(DiagnosticFinding.category)
            .order_by(desc("impact"))
        )
        by_category = [
            {"category": r[0], "count": r[1], "impact": round(float(r[2] or 0), 2)}
            for r in cat_rows
        ]

        # Top 5 findings
        top_rows = await db.execute(
            select(DiagnosticFinding)
            .where(DiagnosticFinding.status != "RESOLVED")
            .order_by(desc(DiagnosticFinding.financial_impact))
            .limit(5)
        )
        top_findings = [
            {
                "finding_id": f.finding_id,
                "title": f.title,
                "severity": f.severity,
                "category": f.category,
                "impact_amount": float(f.financial_impact or 0),
            }
            for f in top_rows.scalars()
        ]

        return {
            "generated_at": str(datetime.utcnow().date()),
            "total_findings": total,
            "critical_count": critical,
            "warning_count": warning,
            "info_count": info,
            "total_impact": round(float(total_impact), 2),
            "by_category": by_category,
            "top_findings": top_findings,
        }

    except Exception as e:
        logger.error(f"Diagnostics summary endpoint failed: {e}")
        return {
            "total_findings": 0,
            "critical_count": 0,
            "warning_count": 0,
            "info_count": 0,
            "total_impact": 0,
            "by_category": [],
            "top_findings": [],
        }


@router.get("/findings")
async def get_diagnostic_findings(
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL/WARNING/INFO"),
    category: Optional[str] = Query(None, description="Filter by category: DENIAL_PATTERN/PAYER_BEHAVIOR/ADTP_ANOMALY/REVENUE_LEAKAGE/AR_AGING"),
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE/ACKNOWLEDGED/RESOLVED"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List diagnostic findings from the persistent table."""
    try:
        q = select(DiagnosticFinding).order_by(desc(DiagnosticFinding.financial_impact))

        if severity:
            q = q.where(DiagnosticFinding.severity == severity.upper())
        if category:
            q = q.where(DiagnosticFinding.category == category.upper())
        if status:
            q = q.where(DiagnosticFinding.status == status.upper())
        else:
            # Default: exclude resolved
            q = q.where(DiagnosticFinding.status != "RESOLVED")

        q = q.limit(limit)
        result = await db.execute(q)
        findings = []
        for f in result.scalars():
            rec_action = f.recommended_action
            if rec_action:
                try:
                    rec_action = json.loads(rec_action)
                except (json.JSONDecodeError, TypeError):
                    rec_action = [rec_action]

            findings.append({
                "finding_id": f.finding_id,
                "category": f.category,
                "severity": f.severity,
                "title": f.title,
                "description": f.description,
                "financial_impact": float(f.financial_impact or 0),
                "affected_claims": f.affected_claims or 0,
                "payer_id": f.payer_id,
                "payer_name": f.payer_name,
                "root_cause": f.root_cause,
                "recommended_actions": rec_action or [],
                "status": f.status,
                "created_at": str(f.created_at) if f.created_at else None,
                "resolved_at": str(f.resolved_at) if f.resolved_at else None,
            })

        return {
            "total": len(findings),
            "severity_filter": severity,
            "category_filter": category,
            "status_filter": status,
            "findings": findings,
        }

    except Exception as e:
        logger.error(f"Diagnostics findings endpoint failed: {e}")
        return {"total": 0, "findings": []}


@router.post("/refresh")
async def refresh_diagnostics(db: AsyncSession = Depends(get_db)):
    """Re-run all 5 diagnostic detectors and persist results to the table."""
    try:
        result = await generate_system_diagnostics(db)
        await db.commit()
        return {
            "status": "refreshed",
            "total_findings": result["total_findings"],
            "critical_count": result["critical_count"],
            "warning_count": result["warning_count"],
            "total_impact": result["total_impact"],
        }
    except Exception as e:
        logger.error(f"Diagnostics refresh failed: {e}")
        raise HTTPException(status_code=500, detail=f"Refresh failed: {str(e)}")


@router.post("/acknowledge/{finding_id}")
async def acknowledge_finding(finding_id: str, db: AsyncSession = Depends(get_db)):
    """Mark a diagnostic finding as acknowledged."""
    try:
        finding = await db.get(DiagnosticFinding, finding_id)
        if not finding:
            raise HTTPException(status_code=404, detail=f"Finding {finding_id} not found")

        if finding.status == "RESOLVED":
            return {"finding_id": finding_id, "status": "RESOLVED", "message": "Already resolved"}

        finding.status = "ACKNOWLEDGED"
        await db.commit()

        return {
            "finding_id": finding_id,
            "status": "ACKNOWLEDGED",
            "title": finding.title,
            "message": "Finding acknowledged successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Acknowledge finding failed for {finding_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resolve/{finding_id}")
async def resolve_finding(finding_id: str, db: AsyncSession = Depends(get_db)):
    """Mark a diagnostic finding as resolved."""
    try:
        finding = await db.get(DiagnosticFinding, finding_id)
        if not finding:
            raise HTTPException(status_code=404, detail=f"Finding {finding_id} not found")
        if finding.status == "RESOLVED":
            return {
                "finding_id": finding_id,
                "status": "RESOLVED",
                "message": "Already resolved",
                "resolved_at": str(finding.resolved_at) if finding.resolved_at else None,
            }
        finding.status = "RESOLVED"
        finding.resolved_at = datetime.now(timezone.utc)
        await db.commit()
        return {
            "finding_id": finding_id,
            "status": "RESOLVED",
            "title": finding.title,
            "resolved_at": str(finding.resolved_at),
            "message": "Finding resolved successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resolve finding failed for {finding_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payer/{payer_id}")
async def get_payer_diagnostic(payer_id: str, db: AsyncSession = Depends(get_db)):
    """Payer-specific diagnostic."""
    try:
        return await generate_payer_diagnostic(db, payer_id)
    except Exception as e:
        logger.error(f"Payer diagnostic endpoint failed for {payer_id}: {e}")
        return {"payer_id": payer_id, "total_findings": 0, "findings": []}


@router.get("/claim/{claim_id}")
async def get_claim_diagnostic_endpoint(claim_id: str, db: AsyncSession = Depends(get_db)):
    """Claim-specific diagnostic."""
    try:
        return await generate_claim_diagnostic(db, claim_id)
    except Exception as e:
        logger.error(f"Claim diagnostic endpoint failed for {claim_id}: {e}")
        return {"claim_id": claim_id, "total_findings": 0, "findings": []}
