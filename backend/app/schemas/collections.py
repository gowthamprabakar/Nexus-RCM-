from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ── AR Aging ─────────────────────────────────────────────────────────────────
class ARAgingRow(BaseModel):
    aging_id:           str
    claim_id:           str
    patient_id:         str
    payer_id:           str
    patient_name:       Optional[str]   = None
    payer_name:         Optional[str]   = None
    bucket:             str
    days_outstanding:   int
    balance:            float
    billed_amount:      float
    paid_amount:        float
    claim_date:         Optional[date]  = None
    last_payment_date:  Optional[date]  = None
    status:             str

    class Config:
        from_attributes = True


class ARBucketTotal(BaseModel):
    bucket:     str
    count:      int
    balance:    float
    pct:        float   # % of total AR


class ARSummary(BaseModel):
    total_ar:           float
    total_claims:       int
    avg_days:           float
    buckets:            List[ARBucketTotal]
    payer_breakdown:    List[dict]


class PaginatedAR(BaseModel):
    items:  List[ARAgingRow]
    total:  int
    page:   int
    size:   int


# ── Collection Queue ──────────────────────────────────────────────────────────
class CollectionTaskOut(BaseModel):
    task_id:            str
    claim_id:           str
    patient_id:         str
    payer_id:           str
    patient_name:       Optional[str]   = None
    payer_name:         Optional[str]   = None
    priority:           str
    action_type:        str
    balance:            float
    days_outstanding:   int
    due_date:           Optional[date]  = None
    assigned_to:        Optional[str]   = None
    status:             str
    notes:              Optional[str]   = None
    propensity_score:   Optional[int]   = None
    created_at:         Optional[datetime] = None

    class Config:
        from_attributes = True


class CollectionTaskUpdate(BaseModel):
    status:         Optional[str]   = None
    notes:          Optional[str]   = None
    assigned_to:    Optional[str]   = None


class PaginatedCollections(BaseModel):
    items:  List[CollectionTaskOut]
    total:  int
    page:   int
    size:   int


# ── Collection Alert ──────────────────────────────────────────────────────────
class CollectionAlertOut(BaseModel):
    alert_id:           str
    claim_id:           str
    patient_id:         Optional[str]   = None
    payer_id:           Optional[str]   = None
    payer_name:         Optional[str]   = None
    alert_type:         str
    severity:           str
    title:              str
    description:        Optional[str]   = None
    amount_at_risk:     float
    triggered_at:       Optional[datetime] = None
    is_resolved:        bool
    action_taken:       Optional[str]   = None

    class Config:
        from_attributes = True


# ── Collections Summary ───────────────────────────────────────────────────────
class CollectionsSummary(BaseModel):
    queue_depth:            int
    critical_count:         int
    high_count:             int
    total_collectible:      float
    avg_propensity_score:   float
    recovery_rate:          float
    active_alerts:          int
    resolved_today:         int
