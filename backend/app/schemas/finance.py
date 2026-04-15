"""
Pydantic schemas for finance endpoints (cash flow, DSO, DPO, working capital, scenarios).
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# --- Daily Cash Flow ----------------------------------------------------------
class CashFlowDay(BaseModel):
    date: str
    projected_inflow: float = 0.0
    actual_era: float = 0.0
    bank_deposited: float = 0.0
    cumulative_balance: float = 0.0
    variance: float = 0.0
    is_actual: bool = False  # past=true, future=false


class CashFlowSummary(BaseModel):
    current_balance: float
    projected_30d: float
    projected_60d: float
    projected_90d: float


class CashFlowDailyResponse(BaseModel):
    days: List[CashFlowDay]
    summary: CashFlowSummary
    as_of: str


# --- DSO ---------------------------------------------------------------------
class DSOByPayer(BaseModel):
    payer_id: str
    payer_name: str
    dso: float
    claims: int
    ar_amount: float
    revenue: float


class DSOCalculation(BaseModel):
    total_ar: float
    total_revenue: float
    lookback_days: int


class DSOResponse(BaseModel):
    dso: float
    benchmark: float
    trend_vs_prior: float
    percentile_rank: int
    by_payer: List[DSOByPayer]
    calculation: DSOCalculation


# --- DPO ---------------------------------------------------------------------
class DPOByPayer(BaseModel):
    payer_id: str
    payer_name: str
    dpo: float
    sample_size: int


class DPOResponse(BaseModel):
    dpo: float
    benchmark: float
    by_payer: List[DPOByPayer]
    lookback_days: int


# --- Scenario ----------------------------------------------------------------
class ScenarioInput(BaseModel):
    denial_rate_delta: float = Field(0.0, description="+/- change in denial rate, e.g. 0.02 = +2pp")
    payer_lag_delta: int = Field(0, description="+/- days shift in payer lag")
    appeal_win_rate_delta: float = Field(
        0.0, description="+/- change in appeal win rate, e.g. 0.05 = +5pp"
    )


class ScenarioImpact(BaseModel):
    base_90d_cash: float
    scenario_90d_cash: float
    delta: float
    delta_pct: float


class ScenarioResponse(BaseModel):
    days: List[CashFlowDay]
    impact: ScenarioImpact
    inputs: ScenarioInput


# --- Working Capital ---------------------------------------------------------
class WorkingCapitalResponse(BaseModel):
    cash_on_hand: float
    ar_balance: float
    working_capital: float
    cash_runway_days: int
    projected_burn_rate: float
    as_of: str


# --- Unmatched ERA -----------------------------------------------------------
class UnmatchedEra(BaseModel):
    era_id: str
    payer_id: Optional[str] = None
    payer_name: Optional[str] = None
    payment_date: Optional[str] = None
    amount: float
    days_since_receipt: int
    status: str  # ORPHANED | DELAYED | PENDING_DEPOSIT
    eft_trace_number: Optional[str] = None
    payment_method: Optional[str] = None
