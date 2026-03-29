from sqlalchemy import Column, String, Float, Integer, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class AutomationAction(Base):
    __tablename__ = "automation_actions"

    action_id = Column(String(20), primary_key=True)
    rule_id = Column(String(20), nullable=False)
    rule_name = Column(String(100), nullable=False)
    trigger_type = Column(String(30), nullable=False)  # diagnostic_finding | root_cause_cluster | threshold_breach
    trigger_data = Column(Text)  # JSON: what triggered this
    suggested_action = Column(String(500), nullable=False)
    affected_claims = Column(Integer, default=0)
    estimated_impact = Column(Float, default=0.0)
    confidence = Column(Integer, default=0)
    status = Column(String(20), default="PENDING")  # PENDING | APPROVED | REJECTED | EXECUTED | FAILED
    approved_by = Column(String(50))
    executed_at = Column(DateTime(timezone=True))
    outcome = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
