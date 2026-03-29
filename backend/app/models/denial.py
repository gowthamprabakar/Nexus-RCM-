from sqlalchemy import Column, String, Float, Integer, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


# Status constants kept for API backwards-compat
class DenialStatus:
    NEW         = "New"
    IN_REVIEW   = "In Review"
    APPEALED    = "Appealed"
    RESOLVED    = "Resolved"
    WRITTEN_OFF = "Written Off"


class AppealStatus:
    DRAFT     = "Draft"
    SUBMITTED = "Submitted"
    APPROVED  = "Approved"
    DENIED    = "Denied"


class Denial(Base):
    __tablename__ = "denials"

    denial_id           = Column(String(15),  primary_key=True, index=True)
    claim_id            = Column(String(15),  nullable=False, index=True)   # ref claims.claim_id
    waystar_denial_id   = Column(String(20))
    denial_date         = Column(Date,         nullable=False)
    denial_source       = Column(String(20),  default="ERA_835")

    # CARC / RARC — Waystar denial coding
    carc_code           = Column(String(10),  nullable=False, index=True)
    carc_description    = Column(String(300))
    rarc_code           = Column(String(10))
    rarc_description    = Column(String(300))

    # Classification
    denial_category     = Column(String(40),  nullable=False, index=True)
    adjustment_type     = Column(String(5))   # CO | PR | OA | PI
    denial_amount       = Column(Float)

    # Workflow
    appeal_deadline     = Column(Date)
    similar_denial_30d  = Column(Integer,     default=0)
    recommended_action  = Column(String(400))

    # Root Cause (Sprint 5)
    root_cause_id       = Column(String(15),  nullable=True, index=True)
    root_cause_status   = Column(String(20),  default="PENDING")  # PENDING | ANALYZED | REVIEW_NEEDED

    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    appeals = relationship("Appeal", back_populates="denial", cascade="all, delete-orphan")


class Appeal(Base):
    __tablename__ = "appeals"

    appeal_id               = Column(String(15),  primary_key=True, index=True)
    denial_id               = Column(String(15),  ForeignKey("denials.denial_id"), nullable=False, index=True)
    claim_id                = Column(String(15),  nullable=False, index=True)

    appeal_type             = Column(String(20))    # FIRST_LEVEL | SECOND_LEVEL | EXTERNAL
    submitted_date          = Column(Date)
    appeal_method           = Column(String(20))    # PORTAL | FAX | MAIL
    ai_generated            = Column(Boolean,       default=False)
    approved_by_user_id     = Column(String(20))

    outcome                 = Column(String(20))    # APPROVED | DENIED | PARTIAL | PENDING
    outcome_date            = Column(Date)
    recovered_amount        = Column(Float,         default=0)
    carc_overturned         = Column(Boolean,       default=False)
    appeal_quality_score    = Column(Integer)

    created_at              = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    denial = relationship("Denial", back_populates="appeals")
