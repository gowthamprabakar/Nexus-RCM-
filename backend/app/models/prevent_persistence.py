"""
Persistence models for Sprint Q Track D
==========================================
Three tables:
  * prevention_alerts     — persisted prevention scan alerts + dismissal state
  * crs_audit             — audit trail of CRS score changes (apply-fix, recompute)
  * automation_rules_db   — DB-backed automation rules (moves 15 hardcoded rules
                            from automation_engine.AUTOMATION_RULES to DB)

The ``_db`` suffix on ``automation_rules_db`` avoids conflict with the existing
in-memory ``AUTOMATION_RULES`` list and with the ``automation_rule_state`` table
(which only stores enabled/disabled bit for the hardcoded rules).
"""
from sqlalchemy import (
    Column, String, Integer, Boolean, Numeric, Text, DateTime, JSON, Index,
)
from sqlalchemy.sql import func
from app.db.base import Base


# ---------------------------------------------------------------------------
# Prevention Alerts — replaces in-memory _dismissed set in prevention.py
# ---------------------------------------------------------------------------
class PreventionAlert(Base):
    __tablename__ = "prevention_alerts"

    alert_id            = Column(String(40), primary_key=True)
    claim_id            = Column(String(40), index=True)
    payer_id            = Column(String(10), index=True)
    prevention_type     = Column(String(40), index=True)
    severity            = Column(String(20))
    description         = Column(Text)
    recommended_action  = Column(Text)
    revenue_at_risk     = Column(Numeric(12, 2))
    preventable         = Column(Boolean, default=True)
    dismissed           = Column(Boolean, default=False, index=True)
    dismissed_at        = Column(DateTime)
    dismissed_by        = Column(String(40))
    created_at          = Column(DateTime, server_default=func.now(), index=True)

    __table_args__ = (
        Index("idx_prev_alerts_claim_type", "claim_id", "prevention_type"),
    )


# ---------------------------------------------------------------------------
# CRS Audit — tracks every score mutation (apply-fix, recompute, submit)
# ---------------------------------------------------------------------------
class CrsAudit(Base):
    __tablename__ = "crs_audit"

    audit_id      = Column(String(40), primary_key=True)
    claim_id      = Column(String(40), index=True)
    score_before  = Column(Integer)
    score_after   = Column(Integer)
    rule_id       = Column(String(40))
    action        = Column(String(40))   # APPLY_FIX | RECOMPUTE | SUBMIT | BLOCK
    action_data   = Column(JSON)
    user_id       = Column(String(40))
    created_at    = Column(DateTime, server_default=func.now(), index=True)


# ---------------------------------------------------------------------------
# Automation Rules (DB-backed) — augments hardcoded AUTOMATION_RULES list
# ---------------------------------------------------------------------------
class AutomationRule(Base):
    __tablename__ = "automation_rules_db"

    rule_id            = Column(String(40), primary_key=True)
    name               = Column(String(200))
    description        = Column(Text)
    trigger_type       = Column(String(40), index=True)
    condition          = Column(JSON)
    action_template    = Column(JSON)
    enabled            = Column(Boolean, default=True, index=True)
    requires_approval  = Column(Boolean, default=True)
    deleted            = Column(Boolean, default=False, index=True)   # soft-delete
    created_by         = Column(String(40))
    updated_by         = Column(String(40))
    created_at         = Column(DateTime, server_default=func.now())
    updated_at         = Column(DateTime, server_default=func.now(), onupdate=func.now())
