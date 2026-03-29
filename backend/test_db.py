import asyncio
from app.db.session import engine
from app.models.denial import Denial
from sqlalchemy import select

async def check():
    async with engine.begin() as conn:
        print('Checking if denials table exists and works...')
        result = await conn.execute(select(Denial))
        print(f"Total Denials in DB: {len(result.all())}")

if __name__ == "__main__":
    asyncio.run(check())
