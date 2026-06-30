from typing import List, Dict, Any
from .db import get_connection


class AlphaHybridSearchEngine:
    """
    Hybrid Search Engine using shared psycopg async connection pool.
    """

    async def hybrid_search_rrf(
        self,
        ticker: str,
        query_text: str,
        query_vector: List[float],
        top_k: int = 5,
        rrf_k: int = 60,
    ) -> List[Dict[str, Any]]:

        print(f"🔍 [Search Engine]: Hybrid Search for ticker '{ticker}'...")

        sql = """
            WITH vector_search AS (
                SELECT
                    id,
                    content,
                    doc_type,
                    ROW_NUMBER() OVER (
                        ORDER BY embedding <=> %s::vector
                    ) AS rank
                FROM financial_knowledge_base
                WHERE ticker = %s
                LIMIT 20
            ),
            text_search AS (
                SELECT
                    id,
                    content,
                    doc_type,
                    ROW_NUMBER() OVER (
                        ORDER BY similarity(content, %s) DESC
                    ) AS rank
                FROM financial_knowledge_base
                WHERE ticker = %s
                LIMIT 20
            )
            SELECT
                COALESCE(v.id, t.id) AS id,
                COALESCE(v.content, t.content) AS content,
                COALESCE(v.doc_type, t.doc_type) AS doc_type,
                (
                    COALESCE(1.0 / (%s + v.rank), 0.0)
                    +
                    COALESCE(1.0 / (%s + t.rank), 0.0)
                ) AS rrf_score
            FROM vector_search v
            FULL OUTER JOIN text_search t ON v.id = t.id
            ORDER BY rrf_score DESC
            LIMIT %s;
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    sql,
                    (
                        str(query_vector),
                        ticker,
                        query_text,
                        ticker,
                        float(rrf_k),
                        float(rrf_k),
                        top_k,
                    ),
                )

                rows = await cur.fetchall()

        hit_records = [
            {
                "id": row[0],
                "content": row[1],
                "doc_type": row[2],
                "rrf_score": float(row[3]),
            }
            for row in rows
        ]

        if hit_records:
            print(
                f"    └─ [HYBRID HIT] Retrieved {len(hit_records)} chunks | "
                f"Highest RRF Score: {hit_records[0]['rrf_score']:.5f}"
            )
        else:
            print("    └─ [HYBRID MISS] No matching chunks found.")

        return hit_records