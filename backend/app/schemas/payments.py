from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ── ERA Payment ──────────────────────────────────────────────────────────────
class EraPaymentOut(BaseModel):
    era_id:             str
    claim_id:           str
    payer_id:           str
    payer_name:         Optional[str]   = None
    payment_date:       Optional[date]  = None
    payment_amount:     float
    payment_method:     Optional[str]   = None
    allowed_amount:     Optional[float] = None
    co_amount:          Optional[float] = 0.0
    pr_amount:          Optional[float] = 0.0
    oa_amount:          Optional[float] = 0.0
    eft_trace_number:   Optional[str]   = None
    check_number:       Optional[str]   = None
    adtp_cycle_number:  Optional[int]   = None

    class Config:
        from_attributes = True


class PaginatedERA(BaseModel):
    items:  List[EraPaymentOut]
    total:  int
    page:   int
    size:   int


class PaymentSummary(BaseModel):
    total_era_count:        int
    total_posted:           float
    total_allowed:          float
    avg_payment_rate:       float       # posted / allowed * 100
    co_adjustments:         float
    pr_adjustments:         float
    oa_adjustments:         float
    this_week_posted:       float
    this_week_era_count:    int


# ── ERA Batch (grouped by payer + payment_date for queue view) ────────────────
class ERABatchItem(BaseModel):
    id:                 str             # synthetic batch id: payer_id::date
    payer:              str
    payer_id:           str
    date:               Optional[str]   = None
    amount:             float           = 0.0
    allowed:            float           = 0.0
    line_count:         int             = 0
    paid_lines:         int             = 0
    denied_lines:       int             = 0
    adjusted_lines:     int             = 0
    co_total:           float           = 0.0
    pr_total:           float           = 0.0
    oa_total:           float           = 0.0
    auto_match_rate:    float           = 0.0
    status:             str             = "Queued"
    payment_method:     Optional[str]   = None

class PaginatedERABatch(BaseModel):
    items:  List[ERABatchItem]
    total:  int
    page:   int
    size:   int


class PostPaymentIn(BaseModel):
    claim_id:           str
    payer_id:           str
    payment_amount:     float
    payment_method:     Optional[str]   = "EFT"
    eft_trace_number:   Optional[str]   = None
    allowed_amount:     Optional[float] = None
    co_amount:          Optional[float] = 0.0
    pr_amount:          Optional[float] = 0.0


# ── Bank Reconciliation ───────────────────────────────────────────────────────
class BankReconOut(BaseModel):
    recon_id:               str
    week_start_date:        Optional[date]  = None
    week_end_date:          Optional[date]  = None
    payer_id:               str
    payer_name:             Optional[str]   = None
    forecasted_amount:      float
    era_received_amount:    Optional[float] = None
    bank_deposit_amount:    Optional[float] = None
    forecast_variance:      Optional[float] = None
    forecast_variance_pct:  Optional[float] = None
    era_bank_variance:      Optional[float] = None
    reconciliation_status:  str
    reconciled_date:        Optional[date]  = None
    variance_reason:        Optional[str]   = None

    class Config:
        from_attributes = True


class ReconSummary(BaseModel):
    total_forecasted:       float
    total_era_received:     float
    total_bank_deposited:   float
    overall_variance:       float
    overall_variance_pct:   float
    reconciled_count:       int
    variance_count:         int
    escalated_count:        int
    pending_count:          int
