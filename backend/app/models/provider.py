from sqlalchemy import Column, String
from app.db.base import Base


class Provider(Base):
    __tablename__ = "providers"

    provider_id   = Column(String, primary_key=True, index=True)
    npi           = Column(String, unique=True, nullable=False, index=True)
    provider_name = Column(String, nullable=False)
    provider_type = Column(String)
    specialty     = Column(String, index=True)
    facility_type = Column(String)
    state         = Column(String(2))
    zip           = Column(String)
    tax_id        = Column(String)
