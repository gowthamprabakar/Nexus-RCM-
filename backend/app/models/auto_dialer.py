"""
Auto-Dialer campaign engine models — part of Collections automation (Sprint R4).

CallCampaign: grouped outbound call effort (e.g., "Critical 90+").
CallLog:      individual call record.
AgentStats:   rolled-up per-agent performance.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.sql import func

from app.db.base import Base


class CallCampaign(Base):
    __tablename__ = "call_campaigns"

    campaign_id      = Column(String(24), primary_key=True, index=True)
    name             = Column(String(100), nullable=False)
    priority         = Column(String(10), nullable=False, default="HIGH")
    # CRITICAL | HIGH | MEDIUM | LOW
    target_count     = Column(Integer, nullable=False, default=0)
    completed_count  = Column(Integer, nullable=False, default=0)
    contact_count    = Column(Integer, nullable=False, default=0)
    promise_count    = Column(Integer, nullable=False, default=0)
    total_promised   = Column(Float,   nullable=False, default=0.0)
    status           = Column(String(16), nullable=False, default="ACTIVE", index=True)
    # DRAFT | ACTIVE | PAUSED | COMPLETE
    agent_count      = Column(Integer, nullable=False, default=0)
    min_balance      = Column(Float)
    aging_bucket     = Column(String(16))
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class CallLog(Base):
    __tablename__ = "call_logs"

    call_id             = Column(String(24), primary_key=True, index=True)
    campaign_id         = Column(String(24), index=True)
    account_id          = Column(String(24), nullable=False, index=True)  # collection_queue.task_id
    patient_id          = Column(String(10), index=True)
    agent_id            = Column(String(24), nullable=False, index=True)
    agent_name          = Column(String(100))
    call_started_at     = Column(DateTime(timezone=True), nullable=False, index=True)
    call_duration_sec   = Column(Integer, default=0)
    outcome             = Column(String(32), nullable=False, index=True)
    # NO_ANSWER | VOICEMAIL | CONTACT_MADE | PAYMENT_PROMISED | DISPUTE | REFUSED | WRONG_NUMBER
    disposition_code    = Column(String(20))
    notes               = Column(Text)
    promised_payment_amount = Column(Float, default=0.0)
    balance_at_call     = Column(Float)
    recording_url       = Column(String(300))
    created_at          = Column(DateTime(timezone=True), server_default=func.now())


class AgentStats(Base):
    __tablename__ = "agent_stats"

    agent_id            = Column(String(24), primary_key=True, index=True)
    agent_name          = Column(String(100), nullable=False)
    calls_today         = Column(Integer, default=0)
    calls_week          = Column(Integer, default=0)
    contacts_made       = Column(Integer, default=0)
    promises_secured    = Column(Integer, default=0)
    dollars_collected   = Column(Float,   default=0.0)
    dollars_promised    = Column(Float,   default=0.0)
    avg_call_duration   = Column(Float,   default=0.0)
    contact_rate_pct    = Column(Float,   default=0.0)
    last_activity_at    = Column(DateTime(timezone=True))
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
