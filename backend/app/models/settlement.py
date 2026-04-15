"""
Settlement offer + payment plan models — part of Collections automation (Sprint R4).
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, Date, DateTime, Text
from sqlalchemy.sql import func

from app.db.base import Base


class SettlementOffer(Base):
    __tablename__ = "settlement_offers"

    offer_id            = Column(String(24), primary_key=True, index=True)
    account_id          = Column(String(24), nullable=False, index=True)  # collection_queue.task_id
    patient_id          = Column(String(10), index=True)
    original_balance    = Column(Float,   nullable=False)
    offered_amount      = Column(Float,   nullable=False)
    offered_pct         = Column(Float,   nullable=False)  # offered_amount / original_balance
    status              = Column(String(16), nullable=False, default="DRAFT", index=True)
    # DRAFT | SENT | ACCEPTED | REJECTED | COUNTERED | EXPIRED | APPROVED
    offered_at          = Column(DateTime(timezone=True))
    expires_at          = Column(DateTime(timezone=True), index=True)
    patient_counter_amount = Column(Float)
    approval_required   = Column(Boolean, default=False)
    approved_by         = Column(String(100))
    approved_at         = Column(DateTime(timezone=True))
    notes               = Column(Text)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class PaymentPlan(Base):
    __tablename__ = "payment_plans"

    plan_id             = Column(String(24), primary_key=True, index=True)
    account_id          = Column(String(24), nullable=False, index=True)
    patient_id          = Column(String(10), index=True)
    total_amount        = Column(Float,   nullable=False)
    monthly_payment     = Column(Float,   nullable=False)
    term_months         = Column(Integer, nullable=False)
    start_date          = Column(Date,    nullable=False)
    next_payment_date   = Column(Date,    index=True)
    status              = Column(String(16), nullable=False, default="ACTIVE", index=True)
    # ACTIVE | COMPLETED | DEFAULTED | CANCELLED
    payments_made       = Column(Integer, default=0)
    payments_total_amount = Column(Float, default=0.0)
    remaining_balance   = Column(Float,   nullable=False)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
