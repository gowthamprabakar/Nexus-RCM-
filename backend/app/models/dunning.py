"""
Dunning Letter workflow models — part of Collections automation (Sprint R4).

DunningSequence: tracks multi-step dunning for a single account.
DunningLetter:   individual letter sent as part of a sequence.
DunningTemplate: reusable letter templates per step/type.
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func

from app.db.base import Base


class DunningSequence(Base):
    __tablename__ = "dunning_sequences"

    sequence_id     = Column(String(24), primary_key=True, index=True)
    account_id      = Column(String(24), nullable=False, index=True)  # maps to collection_queue.task_id
    patient_id      = Column(String(10), index=True)
    payer_id        = Column(String(10), index=True)
    current_step    = Column(Integer,    nullable=False, default=1)   # 1..5
    last_sent_at    = Column(DateTime(timezone=True))
    next_due_at     = Column(DateTime(timezone=True), index=True)
    status          = Column(String(16), nullable=False, default="ACTIVE", index=True)
    # ACTIVE | PAUSED | COMPLETE | STOPPED
    total_balance   = Column(Float)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class DunningLetter(Base):
    __tablename__ = "dunning_letters"

    letter_id       = Column(String(24), primary_key=True, index=True)
    sequence_id     = Column(String(24), nullable=False, index=True)
    step            = Column(Integer,    nullable=False)  # 1..5
    letter_type     = Column(String(24), nullable=False, index=True)
    # SOFT_REMINDER | NOTICE | FINAL_NOTICE | PRE_LEGAL | LEGAL
    sent_at         = Column(DateTime(timezone=True))
    delivery_method = Column(String(16), nullable=False, default="EMAIL")
    # EMAIL | MAIL | PORTAL | SMS
    status          = Column(String(16), nullable=False, default="QUEUED", index=True)
    # QUEUED | SENT | DELIVERED | BOUNCED | OPENED | RESPONDED
    balance_at_send = Column(Float)
    subject         = Column(String(200))
    recipient_email = Column(String(150))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


class DunningTemplate(Base):
    __tablename__ = "dunning_templates"

    template_id     = Column(String(24), primary_key=True, index=True)
    step            = Column(Integer,    nullable=False, index=True)
    letter_type     = Column(String(24), nullable=False)
    subject         = Column(String(200), nullable=False)
    body_html       = Column(Text,       nullable=False)
    body_text       = Column(Text,       nullable=False)
    is_active       = Column(Boolean,    default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
