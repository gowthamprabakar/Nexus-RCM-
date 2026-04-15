"""
Pydantic schemas for AR aging enhancements (Sprint AR+).
Multi-dimension breakdown, cohort analysis, forecast,
write-off waterfall, AR-to-revenue ratio, drill-down rows.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date


# ── Multi-dimension AR Breakdown ─────────────────────────────────────────────
class ARDimensionBucket(BaseModel):
    name:        str
    bucket_0_30: float
    bucket_31_60: float
    bucket_61_90: float
    bucket_91_120: float
    bucket_120_plus: float
    total:       float
    claim_count: int

    class Config:
        # Output keys exactly as designed in the spec
        # (use field aliases via model_dump(by_alias=True))
        populate_by_name = True


class ARDimensionResponse(BaseModel):
    dimension: str
    buckets:   List[dict]   # serialized with explicit keys so frontend gets "0_30" etc.


# ── AR Cohort Tracking ───────────────────────────────────────────────────────
class ARCohortRow(BaseModel):
    cohort_month:     str
    claims_submitted: float
    paid_30d:         float
    paid_60d:         float
    still_open:       float
    aging_pct:        float
    claim_count:      int


class ARCohortResponse(BaseModel):
    cohorts: List[ARCohortRow]


# ── AR Forecast ──────────────────────────────────────────────────────────────
class ARBucketCollectability(BaseModel):
    bucket:           str
    collectable_pct:  float
    bucket_balance:   float
    expected_collect: float


class ARForecastResponse(BaseModel):
    current_ar:                 float
    predicted_collectable_30d:  float
    predicted_collectable_60d:  float
    predicted_write_off:        float
    by_bucket:                  List[ARBucketCollectability]


# ── Write-off Waterfall ──────────────────────────────────────────────────────
class WriteoffReasonRow(BaseModel):
    reason: str
    amount: float
    count:  int


class WriteoffWaterfallResponse(BaseModel):
    starting_ar:        float
    collected:          float
    appeals_recovered:  float
    written_off:        float
    adjusted:           float
    remaining_ar:       float
    by_reason:          List[WriteoffReasonRow]
    lookback_days:      int


# ── AR-to-Revenue Ratio ──────────────────────────────────────────────────────
class ARToRevenueRatioResponse(BaseModel):
    ar_to_revenue_ratio: float
    ar:                  float
    revenue:             float
    benchmark:           float
    trend:               str
    lookback_days:       int


# ── Bucket Drill-down (enhanced AR aging row) ────────────────────────────────
class ARAgingRowEnhanced(BaseModel):
    aging_id:         str
    claim_id:         str
    patient_id:       str
    payer_id:         str
    patient_name:     Optional[str] = None
    payer_name:       Optional[str] = None
    bucket:           str
    days_outstanding: int
    days_overdue:     int
    balance:          float
    billed_amount:    float
    paid_amount:      float
    claim_date:       Optional[date] = None
    status:           str
    carc_code:        Optional[str] = None
    next_action:      Optional[str] = None


class PaginatedARDrilldown(BaseModel):
    items: List[ARAgingRowEnhanced]
    total: int
    page:  int
    size:  int
