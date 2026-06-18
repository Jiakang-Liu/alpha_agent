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
        # Fallback to local Docker development cluster if env is not set
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
        print(f"🔍 [Search Engine]: Executing native RRF Hybrid Search for ticker '{ticker}'...")
        
        # Flawless native SQL RRF query template
        hybrid_query = text("""
            WITH vector_search AS (
                SELECT 
                    id, 
                    content,
                    doc_type,
                    -- Compute semantic rank utilizing pgvector cosine distance operator (<=>)
                    ROW_NUMBER() OVER (ORDER BY embedding <=> :query_vector) as rank
                FROM financial_knowledge_base
                WHERE ticker = :ticker
                LIMIT 20
            ),
            text_search AS (
                SELECT 
                    id, 
                    content,
                    doc_type,
                    -- Compute keyword similarity rank utilizing pg_trgm similarity function
                    ROW_NUMBER() OVER (ORDER BY similarity(content, :query_text) DESC) as rank
                FROM financial_knowledge_base
                WHERE ticker = :ticker
                LIMIT 20
            )
            SELECT 
                COALESCE(v.id, t.id) as id,
                COALESCE(v.content, t.content) as content,
                COALESCE(v.doc_type, t.doc_type) as doc_type,
                -- Reciprocal Rank Fusion mathematical equation mapping
                (COALESCE(1.0 / (:rrf_k + v.rank), 0.0) + COALESCE(1.0 / (:rrf_k + t.rank), 0.0)) as rrf_score
            FROM vector_search v
            -- FULL OUTER JOIN guarantees no loss of single-sided retrieval signals
            FULL OUTER JOIN text_search t ON v.id = t.id
            ORDER BY rrf_score DESC
            LIMIT :top_k;
        """)

        # Execute query strictly within the session context boundary
        async with AsyncSession(self.engine) as session:
            result = await session.execute(
                hybrid_query, 
                {
                    "ticker": ticker,
                    "query_text": query_text,
                    "query_vector": str(query_vector),  # Formatted to string for pgvector mapping
                    "rrf_k": float(rrf_k),
                    "top_k": top_k
                }
            )
            
            # CRITICAL FIX: Extract rows BEFORE session block closure to prevent connection leakage
            hit_records = []
            for row in result:
                hit_records.append({
                    "id": row.id,
                    "content": row.content,
                    "doc_type": row.doc_type,
                    "rrf_score": float(row.rrf_score)
                })
            
            # Print operational telemetry log for RAG anti-hallucination auditing
            if hit_records:
                print(f"    └─ [HYBRID HIT] Retrieved {len(hit_records)} chunks | Highest RRF Score: {hit_records[0]['rrf_score']:.5f}")
            else:
                print("    └─ [HYBRID MISS] No matching chunks found for the current tenant constraint.")
                
            return hit_records

    async def shutdown(self):
        """Safely dispose of the underlying database connection pool."""
        print("🛑 [Search Engine]: Disposing underlying database engine pool connection...")
        await self.engine.dispose()