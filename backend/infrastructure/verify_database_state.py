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


async def get_available_doc_types(ticker: str) -> set[str]:
    """
    Return all distinct document types currently cached for a ticker.

    This checks the complete cached dataset instead of relying on the
    top-k retrieval results.
    """
    print("----[Data Agent]: Get available document types")

    sql = """
    SELECT DISTINCT doc_type
    FROM financial_knowledge_base
    WHERE ticker = %s
      AND doc_type IS NOT NULL;
    """

    async with get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, (ticker,))
            rows = await cur.fetchall()

    return {
        str(row[0]).strip().lower()
        for row in rows
        if row and row[0]
    }