import asyncio
import platform

if platform.system() == "Windows":
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )

from backend.infrastructure import open_db_pool, close_db_pool
from backend.infrastructure.cik_repository import CIKRepository


async def main():
    await open_db_pool()

    try:
        repo = CIKRepository()

        print("🧭 Ensuring ticker_cik_mapping table exists...")
        await repo.ensure_table_exists()

        print("🔄 Refreshing SEC ticker-CIK mapping...")
        count = await repo.refresh_mapping()

        print(f"✅ Refreshed {count} ticker-CIK records.")

    finally:
        await close_db_pool()


if __name__ == "__main__":
    asyncio.run(main())