from sqlalchemy import Column, String, Float, Integer, Boolean, Date, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class RootCauseAnalysis(Base):
    __tablename__ = "root_cause_analysis"

    rca_id = Column(String(15), primary_key=True, index=True)
    denial_id = Column(String(15), ForeignKey("denials.denial_id"), nullable=False, index=True)
    claim_id = Column(String(15), nullable=False, index=True)
    payer_id = Column(String(10), nullable=False, index=True)

    # Root cause classification
    primary_root_cause = Column(String(60), nullable=False, index=True)
    # ELIGIBILITY_LAPSE | AUTH_MISSING | AUTH_EXPIRED | CODING_MISMATCH |
    # TIMELY_FILING_MISS | COB_ORDER_ERROR | CONTRACT_RATE_GAP |
    # DOCUMENTATION_DEFICIT | PROCESS_BREAKDOWN | PAYER_BEHAVIOR_SHIFT | PROVIDER_ENROLLMENT
    secondary_root_cause = Column(String(60), nullable=True)
    tertiary_root_cause = Column(String(60), nullable=True)

    # Evidence weights for top 3 causes
    primary_weight = Column(Float, nullable=True, default=0.0)
    secondary_weight = Column(Float, nullable=True, default=0.0)
    tertiary_weight = Column(Float, nullable=True, default=0.0)

    # Bayesian analysis results
    bayesian_weight = Column(Float, nullable=False, default=0.0)
    confidence_score = Column(Integer, nullable=False, default=0)

    # AI-generated explanation
    evidence_summary = Column(Text, nullable=True)

    # ML model predictions
    ml_denial_probability = Column(Float, nullable=True)
    ml_write_off_probability = Column(Float, nullable=True)
    ml_predicted_carc = Column(String(100), nullable=True)

    # Classification group
    root_cause_group = Column(String(30), nullable=False, index=True)
    # PREVENTABLE | PROCESS | PAYER | CLINICAL

    # Impact
    financial_impact = Column(Float, nullable=True)
    resolution_path = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    steps = relationship("ClaimRootCauseStep", back_populates="root_cause", order_by="ClaimRootCauseStep.step_number")


class ClaimRootCauseStep(Base):
    __tablename__ = "claim_root_cause_step"

    step_id = Column(String(20), primary_key=True, index=True)
    rca_id = Column(String(15), ForeignKey("root_cause_analysis.rca_id"), nullable=False, index=True)

    step_number = Column(Integer, nullable=False)
    step_name = Column(String(40), nullable=False)
    # Step 1: CARC_RARC_DECODE
    # Step 2: ELIGIBILITY_CHECK
    # Step 3: AUTH_TIMELINE_CHECK
    # Step 4: CODING_VALIDATION
    # Step 5: PAYER_HISTORY_MATCH
    # Step 6: PROCESS_TIMELINE_CHECK
    # Step 7: BAYESIAN_SYNTHESIS

    input_data = Column(Text, nullable=True)  # JSON: what was checked
    finding = Column(String(500), nullable=False)
    finding_status = Column(String(15), nullable=False)  # PASS | FAIL | WARNING | INCONCLUSIVE
    contribution_weight = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    root_cause = relationship("RootCauseAnalysis", back_populates="steps")

    __table_args__ = (
        UniqueConstraint("rca_id", "step_number", name="uq_rca_step"),
    )


class ADTPTrend(Base):
    __tablename__ = "adtp_trend"

    trend_id = Column(String(20), primary_key=True, index=True)
    payer_id = Column(String(10), nullable=False, index=True)

    calculation_date = Column(Date, nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)

    expected_adtp_days = Column(Integer, nullable=False)
    actual_adtp_days = Column(Float, nullable=False)
    deviation_days = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)

    z_score = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False, index=True)
    anomaly_type = Column(String(30), nullable=True)
    # PAYMENT_DELAY | PAYMENT_ACCELERATION | IRREGULAR_CADENCE

    payment_count = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    avg_payment_amount = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("payer_id", "calculation_date", name="uq_adtp_payer_date"),
    )


class PayerContractRate(Base):
    __tablename__ = "payer_contract_rate"

    contract_rate_id = Column(String(20), primary_key=True, index=True)
    payer_id = Column(String(10), nullable=False, index=True)

    cpt_code = Column(String(10), nullable=False, index=True)
    modifier = Column(String(5), nullable=True)

    expected_rate = Column(Float, nullable=False)
    effective_date = Column(Date, nullable=False)
    termination_date = Column(Date, nullable=True)

    rate_type = Column(String(20), default="FEE_SCHEDULE")
    # FEE_SCHEDULE | PERCENT_OF_CHARGE | PER_DIEM | CASE_RATE
    rate_source = Column(String(30), default="HISTORICAL_DERIVED")
    # MANUAL | CONTRACT_UPLOAD | HISTORICAL_DERIVED

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("payer_id", "cpt_code", "modifier", "effective_date", name="uq_contract_rate"),
    )
