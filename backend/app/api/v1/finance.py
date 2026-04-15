"""
Finance API — Cash Flow, DSO, DPO, Working Capital, Scenario Modeling
======================================================================
GET  /api/v1/finance/cash-flow/daily?days=90      — daily cash position timeline
GET  /api/v1/finance/dso?lookback_days=90         — Days Sales Outstanding
GET  /api/v1/finance/dpo?lookback_days=90         — Days Payable Outstanding
POST /api/v1/finance/cash-flow/scenario           — what-if scenario modeling
GET  /api/v1/finance/working-capital              — working-capital KPIs
"""
import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.finance import (
    CashFlowDailyResponse,
    DSOResponse,
    DPOResponse,
    ScenarioInput,
    ScenarioResponse,
    WorkingCapitalResponse,
)
from app.services import finance_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# 1. DAILY CASH POSITION TIMELINE
# ---------------------------------------------------------------------------
@router.get("/cash-flow/daily", response_model=CashFlowDailyResponse)
async def get_daily_cash_flow(
    days: int = Query(90, ge=7, le=365, description="Forecast horizon in days"),
    db: AsyncSession = Depends(get_db),
):
    """
    Day-by-day projected cash inflow vs actual ERA vs bank deposited,
    with running cumulative balance and variance tracking.

    Joins payment_forecast (expected) + era_payments (received) +
    bank_reconciliation (deposited) by date.
    """
    try:
        return await finance_service.build_daily_cash_flow(db, days=days)
    except Exception as e:
        logger.exception("get_daily_cash_flow failed")
        raise HTTPException(status_code=500, detail=f"cash flow failed: {e}")


# ---------------------------------------------------------------------------
# 2. DSO — Days Sales Outstanding
# ---------------------------------------------------------------------------
@router.get("/dso", response_model=DSOResponse)
async def get_dso(
    lookback_days: int = Query(90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    DSO = (total_AR / total_revenue) * lookback_days
    Returns DSO with benchmark, trend, percentile rank, and per-payer breakdown.
    """
    try:
        return await finance_service.compute_dso(db, lookback_days=lookback_days)
    except Exception as e:
        logger.exception("get_dso failed")
        raise HTTPException(status_code=500, detail=f"dso failed: {e}")


# ---------------------------------------------------------------------------
# 3. DPO — Days Payable Outstanding (lite — ERA→bank lag)
# ---------------------------------------------------------------------------
@router.get("/dpo", response_model=DPOResponse)
async def get_dpo(
    lookback_days: int = Query(90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    DPO (lite) = average days from ERA receipt to bank deposit.
    Uses BankReconciliation.float_days.
    """
    try:
        return await finance_service.compute_dpo(db, lookback_days=lookback_days)
    except Exception as e:
        logger.exception("get_dpo failed")
        raise HTTPException(status_code=500, detail=f"dpo failed: {e}")


# ---------------------------------------------------------------------------
# 4. SCENARIO MODELING
# ---------------------------------------------------------------------------
@router.post("/cash-flow/scenario", response_model=ScenarioResponse)
async def post_cash_flow_scenario(
    scenario: ScenarioInput,
    days: int = Query(90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    Recompute 90-day forecast with deltas applied:
      - denial_rate_delta:    +/- denial fraction shock (e.g. 0.02 = +2pp)
      - payer_lag_delta:      +/- N day shift in cash arrival
      - appeal_win_rate_delta:+/- appeal recovery improvement

    Returns the modified daily series + impact summary.
    """
    try:
        return await finance_service.apply_scenario(
            db,
            scenario=scenario.dict(),
            days=days,
        )
    except Exception as e:
        logger.exception("post_cash_flow_scenario failed")
        raise HTTPException(status_code=500, detail=f"scenario failed: {e}")


# ---------------------------------------------------------------------------
# 5. WORKING CAPITAL KPIs
# ---------------------------------------------------------------------------
@router.get("/working-capital", response_model=WorkingCapitalResponse)
async def get_working_capital(db: AsyncSession = Depends(get_db)):
    """
    Working capital snapshot:
      cash_on_hand, ar_balance, working_capital,
      cash_runway_days, projected_burn_rate
    """
    try:
        return await finance_service.compute_working_capital(db)
    except Exception as e:
        logger.exception("get_working_capital failed")
        raise HTTPException(status_code=500, detail=f"working capital failed: {e}")
