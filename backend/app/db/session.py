from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

# Pool sized for heavy parallel frontend load (Collections Hub fires ~15 simultaneous
# API calls; AR/Cash Flow each fire 6-8). Previous 5+10 was exhausting on page load.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,           # too noisy — was flooding /tmp/backend.log and slowing queries
    pool_size=30,
    max_overflow=50,
    pool_timeout=15,
    pool_recycle=1800,
    pool_pre_ping=True,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
