import asyncio
from app.db.session import engine
from app.db.base import Base
from app.models.user import User, Role
from app.models.claim import Claim
from app.models.denial import Denial, Appeal
from app.models.rcm_extended import DiagnosticFinding  # Sprint 7

async def sync_db():
    print("Forcing table creation via SQLAlchemy...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(sync_db())
