from sqlalchemy import Column, String, Float, Integer, Boolean, Date, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


# Status constants (stored as VARCHAR in DB — no SQLAlchemy Enum to avoid migration conflicts)
class ClaimStatus:
    DRAFT        = "DRAFT"
    SUBMITTED    = "SUBMITTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    PAID         = "PAID"
    DENIED       = "DENIED"
    APPEALED     = "APPEALED"
    WRITTEN_OFF  = "WRITTEN_OFF"
    VOIDED       = "VOIDED"


class Claim(Base):
    __tablename__ = "claims"

    claim_id                    = Column(String(15),  primary_key=True, index=True)
    patient_id                  = Column(String(10),  nullable=False, index=True)
    provider_id                 = Column(String(10),  nullable=False, index=True)
    payer_id                    = Column(String(10),  nullable=False, index=True)
    coverage_id                 = Column(String(15),  nullable=False, index=True)

    # Claim header
    claim_type                  = Column(String(20),  nullable=False)   # PROFESSIONAL | INSTITUTIONAL
    date_of_service             = Column(Date,         nullable=False)
    dos_through                 = Column(Date)
    place_of_service            = Column(String(5))
    bill_type                   = Column(String(5))

    # Financials
    total_charges               = Column(Float,        nullable=False)
    expected_allowed            = Column(Float)
    expected_patient_liability  = Column(Float)

    # Submission
    submission_date             = Column(Date)
    submission_method           = Column(String(15),  default="EDI")
    waystar_batch_id            = Column(String(20))

    # Prevention Layer — Claim Readiness Score (CRS)
    crs_score                   = Column(Integer)
    crs_passed                  = Column(Boolean)
    crs_eligibility_pts         = Column(Integer)
    crs_auth_pts                = Column(Integer)
    crs_coding_pts              = Column(Integer)
    crs_cob_pts                 = Column(Integer)
    crs_documentation_pts       = Column(Integer)
    crs_evv_pts                 = Column(Integer)

    # ADTP — Payment Forecasting
    adtp_days                   = Column(Integer)
    expected_payment_date       = Column(Date)
    expected_payment_week       = Column(Date)

    # Lifecycle
    status                      = Column(String(30),  nullable=False, default="DRAFT", index=True)
    created_at                  = Column(DateTime(timezone=True), server_default=func.now())
