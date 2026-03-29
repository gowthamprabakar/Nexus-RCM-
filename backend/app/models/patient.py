from sqlalchemy import Column, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    patient_id  = Column(String, primary_key=True, index=True)
    mrn         = Column(String, unique=True, nullable=False, index=True)
    first_name  = Column(String)
    last_name   = Column(String)
    dob         = Column(Date)
    gender      = Column(String)
    zip         = Column(String)
    state       = Column(String(2))

    # Relationships
    coverages   = relationship("InsuranceCoverage", back_populates="patient")


class InsuranceCoverage(Base):
    __tablename__ = "insurance_coverage"

    coverage_id           = Column(String, primary_key=True, index=True)
    patient_id            = Column(String, ForeignKey("patients.patient_id"), nullable=False, index=True)
    payer_id              = Column(String, nullable=False, index=True)
    coverage_type         = Column(String, nullable=False)  # PRIMARY | SECONDARY | TERTIARY
    group_number          = Column(String)
    member_id             = Column(String, nullable=False)
    subscriber_id         = Column(String)
    effective_date        = Column(Date, nullable=False)
    term_date             = Column(Date)
    deductible_individual = Column(Float, default=0)
    deductible_met_ytd    = Column(Float, default=0)
    oop_max               = Column(Float, default=0)
    oop_met_ytd           = Column(Float, default=0)
    copay                 = Column(Float, default=0)
    coinsurance_pct       = Column(Float, default=0)

    # Relationships
    patient = relationship("Patient", back_populates="coverages")
