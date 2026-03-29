"""
Sprint 21 — Compliance Router
Endpoints for overcoding risk, FCA risk, audit risk, and compliance summary.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional

from app.core.deps import get_db
from app.services.compliance_engine import (
    get_overcoding_risk,
    get_fca_risk_score,
    get_audit_risk,
)

router = APIRouter()


@router.get("/overcoding-risk")
async def overcoding_risk(
    db: AsyncSession = Depends(get_db),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
) -> Any:
    """Compare provider coding patterns vs specialty benchmarks."""
    try:
        result = await get_overcoding_risk(db, provider_id=provider_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overcoding risk error: {str(e)}")


@router.get("/fca-risk")
async def fca_risk(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Composite False Claims Act risk score (0-100)."""
    try:
        result = await get_fca_risk_score(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FCA risk error: {str(e)}")


@router.get("/audit-risk")
async def audit_risk(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Match billing patterns against OIG Work Plan focus areas."""
    try:
        result = await get_audit_risk(db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit risk error: {str(e)}")


@router.get("/summary")
async def compliance_summary(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Aggregated compliance summary across all risk dimensions."""
    try:
        overcoding = await get_overcoding_risk(db)
        fca = await get_fca_risk_score(db)
        audit = await get_audit_risk(db)

        # Determine overall compliance status
        risk_levels = [
            fca.get("risk_level", "UNKNOWN"),
            audit.get("overall_risk_level", "UNKNOWN"),
        ]
        if overcoding.get("high_risk_count", 0) > 0:
            risk_levels.append("HIGH")

        if "CRITICAL" in risk_levels:
            overall_status = "CRITICAL"
        elif "HIGH" in risk_levels:
            overall_status = "HIGH"
        elif "MEDIUM" in risk_levels:
            overall_status = "MEDIUM"
        else:
            overall_status = "LOW"

        return {
            "overall_compliance_status": overall_status,
            "fca_risk_score": fca.get("fca_risk_score", 0),
            "fca_risk_level": fca.get("risk_level", "UNKNOWN"),
            "audit_risk_level": audit.get("overall_risk_level", "UNKNOWN"),
            "oig_high_risk_areas": audit.get("high_risk_areas", 0),
            "overcoding": {
                "providers_analyzed": overcoding.get("providers_analyzed", 0),
                "high_risk_providers": overcoding.get("high_risk_count", 0),
            },
            "recommendations": _generate_recommendations(fca, audit, overcoding),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compliance summary error: {str(e)}")


def _generate_recommendations(fca: dict, audit: dict, overcoding: dict) -> list:
    """Generate actionable recommendations based on risk analysis."""
    recs = []

    fca_score = fca.get("fca_risk_score", 0)
    if fca_score >= 50:
        recs.append({
            "priority": "HIGH",
            "area": "FCA Compliance",
            "recommendation": "Conduct immediate internal audit of coding practices. FCA risk score is elevated.",
        })

    components = fca.get("components", {})
    if components.get("coding_error_rate", {}).get("score", 0) > 15:
        recs.append({
            "priority": "HIGH",
            "area": "Coding Accuracy",
            "recommendation": "Review and retrain on coding-related denial patterns. High CARC CO-4/CO-16/CO-97 rates detected.",
        })
    if components.get("documentation_gaps", {}).get("score", 0) > 10:
        recs.append({
            "priority": "MEDIUM",
            "area": "Documentation",
            "recommendation": "Improve pre-submission documentation checks. CRS failure rate indicates documentation gaps.",
        })

    for risk in audit.get("audit_risks", []):
        if risk.get("risk_level") == "HIGH":
            recs.append({
                "priority": "HIGH",
                "area": risk.get("area", "Audit"),
                "recommendation": f"Address {risk.get('area', 'audit area')}: {risk.get('description', '')}",
            })

    if overcoding.get("high_risk_count", 0) > 0:
        recs.append({
            "priority": "MEDIUM",
            "area": "Provider Coding",
            "recommendation": f"{overcoding['high_risk_count']} provider(s) flagged for overcoding risk. Review charge patterns vs specialty benchmarks.",
        })

    if not recs:
        recs.append({
            "priority": "INFO",
            "area": "General",
            "recommendation": "No significant compliance risks detected. Continue routine monitoring.",
        })

    return recs
