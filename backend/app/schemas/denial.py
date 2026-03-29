from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class AppealBase(BaseModel):
    appeal_type:    Optional[str]   = None
    appeal_method:  Optional[str]   = None
    ai_generated:   Optional[bool]  = True
    outcome:        Optional[str]   = None


class AppealCreate(AppealBase):
    denial_id:  str
    claim_id:   str


class AppealUpdate(BaseModel):
    outcome:                Optional[str]   = None
    outcome_date:           Optional[date]  = None
    recovered_amount:       Optional[float] = None
    approved_by_user_id:    Optional[str]   = None


class AppealOut(AppealBase):
    appeal_id:              str
    denial_id:              str
    claim_id:               str
    submitted_date:         Optional[date]      = None
    outcome_date:           Optional[date]      = None
    recovered_amount:       Optional[float]     = None
    appeal_quality_score:   Optional[int]       = None
    approved_by_user_id:    Optional[str]       = None
    created_at:             Optional[datetime]  = None

    class Config:
        from_attributes = True


class DenialBase(BaseModel):
    claim_id:           str
    carc_code:          str
    denial_category:    str
    denial_amount:      Optional[float] = 0.0


class DenialCreate(DenialBase):
    pass


class DenialUpdate(BaseModel):
    denial_category:    Optional[str]   = None
    recommended_action: Optional[str]   = None


class DenialOut(DenialBase):
    denial_id:          str
    denial_date:        Optional[date]      = None
    carc_description:   Optional[str]       = None
    rarc_code:          Optional[str]       = None
    denial_source:      Optional[str]       = None
    created_at:         Optional[datetime]  = None

    class Config:
        from_attributes = True


class DenialOutEnriched(BaseModel):
    """Enriched denial with joined patient/payer names."""
    denial_id:          str
    claim_id:           str
    carc_code:          str
    carc_description:   Optional[str]   = None
    rarc_code:          Optional[str]   = None
    denial_category:    str
    denial_amount:      float
    denial_date:        Optional[date]  = None
    denial_source:      Optional[str]   = None
    appeal_deadline:    Optional[date]  = None
    days_remaining:     Optional[int]   = None
    recommended_action: Optional[str]   = None
    similar_denial_30d: Optional[int]   = 0
    patient_name:       Optional[str]   = None
    payer_name:         Optional[str]   = None
    date_of_service:    Optional[str]   = None
    created_at:         Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedDenials(BaseModel):
    items:  List[DenialOutEnriched]
    total:  int
    page:   int
    size:   int
