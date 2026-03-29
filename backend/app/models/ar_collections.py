"""
AR Aging, Collections Queue, Collection Alerts, Propensity Score models
Sprint 3 — Layer 3: Revenue Recovery & Payment Intelligence
"""
from sqlalchemy import Column, String, Float, Integer, Boolean, Date, DateTime, Text
from sqlalchemy.sql import func

from app.db.base import Base


# ---------------------------------------------------------------------------
# AR AGING
# ---------------------------------------------------------------------------
class ARAgingBucket(Base):
    __tablename__ = "ar_aging"

    aging_id            = Column(String(20),  primary_key=True, index=True)
    claim_id            = Column(String(15),  nullable=False, index=True)
    patient_id          = Column(String(10),  nullable=False, index=True)
    payer_id            = Column(String(10),  nullable=False, index=True)
    bucket              = Column(String(10),  nullable=False, index=True)
    # 0-30 | 31-60 | 61-90 | 91-120 | 120+
    days_outstanding    = Column(Integer,     nullable=False)
    balance             = Column(Float,       nullable=False)   # billed - paid
    billed_amount       = Column(Float,       nullable=False)
    paid_amount         = Column(Float,       default=0.0)
    last_payment_date   = Column(Date)
    claim_date          = Column(Date,        nullable=False)
    status              = Column(String(20),  default="OPEN", index=True)
    # OPEN | IN_COLLECTION | RESOLVED | WRITTEN_OFF
    created_at          = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# COLLECTION QUEUE (task-based)
# ---------------------------------------------------------------------------
class CollectionQueue(Base):
    __tablename__ = "collection_queue"

    task_id             = Column(String(20),  primary_key=True, index=True)
    claim_id            = Column(String(15),  nullable=False, index=True)
    patient_id          = Column(String(10),  nullable=False, index=True)
    payer_id            = Column(String(10),  nullable=False, index=True)
    priority            = Column(String(10),  nullable=False, default="MEDIUM", index=True)
    # CRITICAL | HIGH | MEDIUM | LOW
    action_type         = Column(String(30),  nullable=False)
    # CALL | LETTER | APPEAL | WRITEOFF | PAYMENT_PLAN | ESCALATE
    balance             = Column(Float,       nullable=False)
    days_outstanding    = Column(Integer,     nullable=False)
    due_date            = Column(Date)
    assigned_to         = Column(String(50))
    status              = Column(String(20),  default="OPEN", index=True)
    # OPEN | IN_PROGRESS | RESOLVED | CLOSED
    notes               = Column(Text)
    propensity_score    = Column(Integer)   # 0-100 likelihood to collect
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())


# ---------------------------------------------------------------------------
# COLLECTION ALERTS
# ---------------------------------------------------------------------------
class CollectionAlert(Base):
    __tablename__ = "collection_alerts"

    alert_id            = Column(String(20),  primary_key=True, index=True)
    claim_id            = Column(String(15),  nullable=False, index=True)
    patient_id          = Column(String(10),  index=True)
    payer_id            = Column(String(10),  index=True)
    alert_type          = Column(String(40),  nullable=False, index=True)
    # AGING_THRESHOLD | HIGH_BALANCE | PAYER_PATTERN | TIMELY_FILING | DUPLICATE_PAYMENT
    severity            = Column(String(10),  nullable=False, index=True)
    # CRITICAL | HIGH | MEDIUM | LOW
    title               = Column(String(200), nullable=False)
    description         = Column(String(500))
    amount_at_risk      = Column(Float,       default=0.0)
    triggered_at        = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at         = Column(DateTime(timezone=True))
    is_resolved         = Column(Boolean,     default=False, index=True)
    action_taken        = Column(String(200))
