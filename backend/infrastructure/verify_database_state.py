from .db import get_connection
from sqlalchemy import text

async def verify_database_state( ticker: str) -> int:
    async with get_connection() as conn:
        result = await conn.execute(
            text("SELECT COUNT(*) FROM financial_knowledge_base WHERE ticker = :ticker"),
            {"ticker": ticker}
        )
        return result.scalar()