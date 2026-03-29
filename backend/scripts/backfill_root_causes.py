"""Backfill root cause analysis for all existing denials."""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.services.root_cause_service import batch_analyze_pending


async def main():
    total = 0
    batch_size = 200
    errors = 0

    print("Starting root cause backfill...")
    print(f"  Batch size: {batch_size}")
    print()

    while True:
        try:
            async with AsyncSessionLocal() as db:
                # batch_analyze_pending internally calls analyze_denial_root_cause
                # which commits per denial, so no extra commit needed here
                processed = await batch_analyze_pending(db, batch_size)
        except Exception as e:
            errors += 1
            print(f"  [ERROR] Batch failed: {e}")
            if errors > 10:
                print("  Too many consecutive errors, stopping.")
                break
            continue

        total += processed

        if total > 0 and total % 1000 < batch_size:
            print(f"  Processed {total} denials so far...")

        if processed < batch_size:
            break

    print()
    print(f"Done. Total denials analyzed: {total}")
    if errors > 0:
        print(f"  Batch errors encountered: {errors}")


if __name__ == "__main__":
    asyncio.run(main())
