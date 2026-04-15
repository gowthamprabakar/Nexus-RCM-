"""
CARC / RARC reference code tables.

CARC = Claim Adjustment Reason Code (X12 standard) — explains *why* a claim
       payment differs from the billed amount. Always paired with a Group
       Code (CO/PR/OA/PI) on an 835 ERA.
RARC = Remittance Advice Remark Code — provides additional information that
       supplements a CARC.

These are populated via app/scripts/seed_carc_rarc.py.
"""
from sqlalchemy import Column, String, Text
from app.db.base import Base


class CarcCode(Base):
    __tablename__ = "carc_codes"

    code        = Column(String(10),  primary_key=True, index=True)
    description = Column(Text,        nullable=False)
    category    = Column(String(20),  nullable=False, index=True)
    # adjustment | information | remark
    group_code  = Column(String(4),   nullable=True, index=True)
    # CO=Contractual Obligation, PR=Patient Responsibility,
    # OA=Other Adjustment, PI=Payer Initiated Reduction


class RarcCode(Base):
    __tablename__ = "rarc_codes"

    code        = Column(String(10),  primary_key=True, index=True)
    description = Column(Text,        nullable=False)
    category    = Column(String(20),  nullable=False, index=True)
    # informational | alert | supplemental
