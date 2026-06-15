import os
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

class AlphaHybridSearchEngine:
    """
    Enterprise-grade Hybrid Search Engine executing native 
    Reciprocal Rank Fusion (RRF) inside PostgreSQL.
    """
    def __init__(self, database_url: str = None):
        # Fallback to local docker development cluster if env is not set
        self.db_url = database_url or os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/alpha_agent")
        self.engine = create_async_engine(self.db_url, echo=False)

    async def hybrid_search_rrf(
        self, 
        ticker: str, 
        query_text: str, 
        query_vector: List[float], 
        top_k: int = 5, 
        rrf_k: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Executes parallel dense and sparse retrieval, merging ranks via native SQL CTEs.
        """
        
        hybrid_query = text("""
            WITH vector_search AS (
                SELECT 
                    id, 
                    content,
                    statement_type,
                    ROW_NUMBER() OVER (ORDER BY embedding <=> :query_vector) as rank
                FROM financial_knowledge_base
                WHERE company = :ticker
                LIMIT 20
            ),
            text_search AS (
                SELECT 
                    id, 
                    content,
                    statement_type,
                    -- TODO A: Complete the order by clause using pg_trgm similarity function
                    ROW_NUMBER() OVER (ORDER BY similarity(content, :query_text) DESC) as rank
                FROM financial_knowledge_base
                WHERE company = :ticker
                LIMIT 20
            )
            SELECT 
                COALESCE(v.id, t.id) as id,
                COALESCE(v.content, t.content) as content,
                COALESCE(v.statement_type, t.statement_type) as statement_type,
                -- TODO B: Complete the RRF mathematical equation mapping both ranks
                (COALESCE(1.0 / (:rrf_k + v.rank), 0.0) + COALESCE(1.0 / (:rrf_k + t.rank), 0.0)) as rrf_score
            FROM vector_search v
            -- TODO C: What type of SQL JOIN is required to ensure no data loss from either side?
            FULL OUTER JOIN text_search t ON v.id = t.id
            ORDER BY rrf_score DESC
            LIMIT :top_k;
        """)
        # =====================================================================

        async with AsyncSession(self.engine) as session:
            # Bind transaction parameters to prevent SQL injection vulnerabilities
            result = await session.execute(
                hybrid_query, 
                {
                    "ticker": ticker,
                    "query_text": query_text,
                    "query_vector": str(query_vector), # pgvector format mapping
                    "rrf_k": float(rrf_k),
                    "top_k": top_k
                }
            )
            
            # Map raw database rows into serialized standard dictionaries
            hit_records = []
            for row in result:
                hit_records.append({
                    "id": row.id,
                    "content": row.content,
                    "statement_type": row.statement_type,
                    "rrf_score": float(row.rrf_score)
                })
            
            return hit_records

    async def shutdown(self):
        """Safely dispose of the underlying database connection pool."""
        await self.engine.dispose()