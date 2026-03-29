from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ClaimBase(BaseModel):
    patient_id:     str
    provider_id:    str
    payer_id:       str
    coverage_id:    str
    claim_type:     str
    date_of_service: date
    total_charges:  float


class ClaimCreate(ClaimBase):
    pass


class ClaimUpdate(BaseModel):
    status:         Optional[str]   = None
    total_charges:  Optional[float] = None
    crs_score:      Optional[int]   = None


class ClaimOut(ClaimBase):
    claim_id:               str
    status:                 str
    crs_score:              Optional[int]   = None
    crs_passed:             Optional[bool]  = None
    adtp_days:              Optional[int]   = None
    expected_payment_date:  Optional[date]  = None
    expected_payment_week:  Optional[date]  = None
    submission_date:        Optional[date]  = None
    created_at:             Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedClaims(BaseModel):
    total: int
    page:  int
    size:  int
    items: list[ClaimOut]
