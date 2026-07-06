from backend.infrastructure.db import get_connection


TARGET_TABLE = "financial_knowledge_base"
ANALYSIS_RUNS_TABLE = "analysis_runs"


class SchemaInitializer:
    async def initialize(self) -> None:
        await self.create_extensions()
        await self.create_financial_knowledge_base()
        await self.create_analysis_runs()
        await self.create_indexes()

    async def create_extensions(self) -> None:
        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                await cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
                await cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
            await conn.commit()

    async def create_financial_knowledge_base(self) -> None:
        sql = f"""
            CREATE TABLE IF NOT EXISTS {TARGET_TABLE} (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ticker VARCHAR(12) NOT NULL,
                fiscal_year INT NOT NULL,
                doc_type VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                embedding vector(1536) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql)
            await conn.commit()

    async def create_analysis_runs(self) -> None:
        sql = f"""
            CREATE TABLE IF NOT EXISTS {ANALYSIS_RUNS_TABLE} (
                run_id UUID PRIMARY KEY,
                ticker TEXT NOT NULL,
                user_query TEXT NOT NULL,

                status TEXT NOT NULL,
                current_node TEXT,

                final_report TEXT,
                error_message TEXT,

                started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                finished_at TIMESTAMPTZ,
                duration_ms INTEGER,

                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql)
            await conn.commit()

    async def create_indexes(self) -> None:
        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(f"""
                    CREATE UNIQUE INDEX IF NOT EXISTS uidx_ticker_year_type
                    ON {TARGET_TABLE} (ticker, fiscal_year, doc_type);
                """)

                await cur.execute(f"""
                    CREATE INDEX IF NOT EXISTS idx_fkb_embedding_hnsw
                    ON {TARGET_TABLE} USING hnsw (embedding vector_cosine_ops);
                """)

                await cur.execute(f"""
                    CREATE INDEX IF NOT EXISTS idx_fkb_content_trgm
                    ON {TARGET_TABLE} USING gist (content gist_trgm_ops);
                """)

                await cur.execute(f"""
                    CREATE INDEX IF NOT EXISTS idx_fkb_lookup_kv
                    ON {TARGET_TABLE} (ticker, fiscal_year);
                """)

            await conn.commit()