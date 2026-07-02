from .db import get_connection


async def verify_database_state(ticker: str) -> int:
    print("----[Data Agent]: Verify database state")

    sql = """
    SELECT COUNT(*)
    FROM financial_knowledge_base
    WHERE ticker = %s;
    """

    async with get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, (ticker,))
            row = await cur.fetchone()

    return row[0] if row else 0