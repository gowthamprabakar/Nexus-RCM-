"""
Pydantic schemas for Collections Automation (Dunning / Auto-Dialer / Settlements).
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


# ── DUNNING ─────────────────────────────────────────────────────────────────
class DunningSequenceOut(BaseModel):
    sequence_id:    str
    account_id:     str
    patient_id:     Optional[str] = None
    payer_id:       Optional[str] = None
    current_step:   int
    last_sent_at:   Optional[datetime] = None
    next_due_at:    Optional[datetime] = None
    status:         str
    total_balance:  Optional[float] = None

    class Config:
        from_attributes = True


class DunningLetterOut(BaseModel):
    letter_id:       str
    sequence_id:     str
    step:            int
    letter_type:     str
    sent_at:         Optional[datetime] = None
    delivery_method: str
    status:          str
    balance_at_send: Optional[float] = None
    subject:         Optional[str] = None

    class Config:
        from_attributes = True


class DunningTemplateOut(BaseModel):
    template_id: str
    step:        int
    letter_type: str
    subject:     str
    body_html:   str
    body_text:   str
    is_active:   bool

    class Config:
        from_attributes = True


class DunningSendBody(BaseModel):
    sequence_id: str
    step:        Optional[int] = None


class DunningSummary(BaseModel):
    active_sequences:   int
    letters_sent_30d:   int
    response_rate_pct:  float
    collected_via_dunning: float


# ── AUTO-DIALER ─────────────────────────────────────────────────────────────
class CallCampaignOut(BaseModel):
    campaign_id:     str
    name:            str
    priority:        str
    target_count:    int
    completed_count: int
    contact_count:   int
    promise_count:   int
    total_promised:  float
    status:          str
    agent_count:     int
    progress_pct:    float = 0.0
    aging_bucket:    Optional[str] = None

    class Config:
        from_attributes = True


class CallLogOut(BaseModel):
    call_id:             str
    campaign_id:         Optional[str] = None
    account_id:          str
    agent_name:          Optional[str] = None
    call_started_at:     datetime
    call_duration_sec:   int
    outcome:             str
    disposition_code:    Optional[str] = None
    promised_payment_amount: float
    balance_at_call:     Optional[float] = None

    class Config:
        from_attributes = True


class AgentStatsOut(BaseModel):
    agent_id:          str
    agent_name:        str
    calls_today:       int
    calls_week:        int
    contacts_made:     int
    promises_secured:  int
    dollars_collected: float
    dollars_promised:  float
    avg_call_duration: float
    contact_rate_pct:  float
    last_activity_at:  Optional[datetime] = None

    class Config:
        from_attributes = True


class DialerSummary(BaseModel):
    active_campaigns:   int
    calls_today:        int
    contact_rate_pct:   float
    promise_to_pay_pct: float
    recovery_rate_pct:  float
    total_promised:     float


class CampaignCreateBody(BaseModel):
    name:          str
    priority:      str = "HIGH"
    target_count:  int = 0
    aging_bucket:  Optional[str] = None
    min_balance:   Optional[float] = None


class CampaignUpdateBody(BaseModel):
    status:       Optional[str] = None
    priority:     Optional[str] = None
    target_count: Optional[int] = None


# ── SETTLEMENT ──────────────────────────────────────────────────────────────
class SettlementOfferOut(BaseModel):
    offer_id:             str
    account_id:           str
    patient_id:           Optional[str] = None
    original_balance:     float
    offered_amount:       float
    offered_pct:          float
    status:               str
    offered_at:           Optional[datetime] = None
    expires_at:           Optional[datetime] = None
    patient_counter_amount: Optional[float] = None
    approval_required:    bool
    notes:                Optional[str] = None

    class Config:
        from_attributes = True


class SettlementCreateBody(BaseModel):
    account_id:        str
    patient_id:        Optional[str] = None
    original_balance:  float
    offered_amount:    float
    expires_days:      int = 30
    notes:             Optional[str] = None


class SettlementUpdateBody(BaseModel):
    status:                 Optional[str] = None
    patient_counter_amount: Optional[float] = None
    notes:                  Optional[str] = None
    approved_by:            Optional[str] = None


class SettlementSummary(BaseModel):
    active_offers:        int
    avg_settlement_pct:   float
    total_recovered:      float
    approval_pending:     int


class PaymentPlanOut(BaseModel):
    plan_id:             str
    account_id:          str
    patient_id:          Optional[str] = None
    total_amount:        float
    monthly_payment:     float
    term_months:         int
    start_date:          date
    next_payment_date:   Optional[date] = None
    status:              str
    payments_made:       int
    payments_total_amount: float
    remaining_balance:   float

    class Config:
        from_attributes = True
