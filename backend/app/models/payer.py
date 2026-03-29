from sqlalchemy import Column, String, Float, Integer, Boolean
from app.db.base import Base


class Payer(Base):
    __tablename__ = "payer_master"

    payer_id            = Column(String, primary_key=True, index=True)
    payer_name          = Column(String, nullable=False)
    payer_group         = Column(String, nullable=False, index=True)
    # G1_FEDERAL_FFS | G2_MEDICARE_ADVANTAGE | G3_COMMERCIAL_NATIONAL
    # G4_COMMERCIAL_REGIONAL | G5_MANAGED_MEDICAID | G6_STATE_MEDICAID
    # G7_WORKERS_COMP_AUTO | G8_SELF_PAY_SECONDARY

    # ADTP = days between payment batches (payment cadence)
    adtp_days           = Column(Integer, nullable=False)
    adtp_anchor_day     = Column(Integer, default=0)   # 0=Mon .. 6=Sun
    payment_method      = Column(String, default="EFT")

    # Financial benchmarks
    avg_payment_rate    = Column(Float, nullable=False)
    denial_rate         = Column(Float, nullable=False)
    first_pass_rate     = Column(Float, nullable=False)
    avg_appeal_win_rate = Column(Float)

    # EDI identifiers
    electronic_payer_id = Column(String)
    waystar_payer_id    = Column(String)
    era_enrolled        = Column(Boolean, default=True)

