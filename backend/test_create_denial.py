import asyncio
from app.db.session import AsyncSessionLocal
from app.models.claim import Claim  # Fix missing registry import
from app.api.v1.denials import create_denial
from app.schemas.denial import DenialCreate

async def check():
    async with AsyncSessionLocal() as db:
        try:
            denial_in = DenialCreate(
                claim_id="CLM-312595",
                payer_id="UnitedHealthcare",
                reason_code="CO-97",
                denial_category="Bundled Service",
                status="Appealed",
                amount=1240.50
            )
            result = await create_denial(denial_in=denial_in, db=db)
            print("Successfully created:", getattr(result, "id", result))
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check())
