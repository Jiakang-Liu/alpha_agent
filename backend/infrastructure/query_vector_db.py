from .db import get_connection

async def query_vector_db(embedding: list[float], top_k: int = 3) -> list[str]:
    """
    Retrieve top-k relevant context from PostgreSQL using vector similarity search.
    """
    conninfo = f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT}"
    
    # Establish asynchronous connection to PostgreSQL
    conn = get_connection()
    
    async with conn:
        async with conn.cursor() as cur:
            # Leverage the pgvector cosine similarity operator `<=>` combined with an HNSW index for ultra-fast retrieval.
            sql = "SELECT content FROM financial_knowledge_base ORDER BY embedding <=> %s::vector LIMIT %s;"
            await cur.execute(sql, (str(embedding), top_k))
            rows = await cur.fetchall()
            return [row[0] for row in rows]