import os
import sys
from datetime import datetime, timezone
import psycopg
from dotenv import load_dotenv

# Load runtime environment configurations
load_dotenv()

# Configure targets - fallback to local Docker container cluster if variable is unset
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    pg_pass = os.getenv("POSTGRES_PASSWORD", "postgres")
    DATABASE_URL = f"postgresql://alpha_user:{pg_pass}@localhost:5432/alpha_agent"

# Sanitize SQLAlchemy async dialects (+asyncpg) to enforce raw synchronous psycopg connections for operations
if "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")

# Domain boundary: Unified knowledge base repository target table name
TARGET_TABLE = "financial_knowledge_base"


def check_table_exists(conn) -> bool:
    """
    Scans the PostgreSQL database catalog to verify the existence of the target table.
    """
    query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        );
    """
    with conn.cursor() as cur:
        cur.execute(query, (TARGET_TABLE,))
        return cur.fetchone()[0]


def run_ddl_migration(conn):
    """
    Executes destructive schema migrations by dropping the legacy topology,
    re-creating the unified super-set structure, and injecting physical indexes.
    """
    print(f"\n🚀 [DDL Engine]: Initiating database infrastructure rebuild reconstruction...")
    
    with conn.cursor() as cur:
        # 1. Activate low-level PostgreSQL C extensions for dense vector and sparse text matching
        print("    ├─ Activating required extensions: pgvector & pg_trgm...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

        # 2. Destructive schema purge: Wipe out stale structural assets
        print(f"    ├─ Executing physical tear-down: DROP TABLE IF EXISTS '{TARGET_TABLE}'...")
        cur.execute(f"DROP TABLE IF EXISTS {TARGET_TABLE} CASCADE;")

        # 3. Provision the master multi-agent knowledge base table architecture
        print(f"    ├─ Applying structural blueprint: Recreating table '{TARGET_TABLE}'...")
        create_table_sql = f"""
            CREATE TABLE {TARGET_TABLE} (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ticker VARCHAR(12) NOT NULL,
                fiscal_year INT NOT NULL,
                doc_type VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                embedding vector(1536) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """
        cur.execute(create_table_sql)

        # 4. Enforce data ingestion contract at the storage layer via a composite unique index
        print("    ├─ Welding multi-column composite unique index: uidx_ticker_year_type...")
        cur.execute(f"""
            CREATE UNIQUE INDEX uidx_ticker_year_type 
            ON {TARGET_TABLE} (ticker, fiscal_year, doc_type);
        """)

        # 5. Optimize the hybrid retrieval layer with specialized database index topologies
        print("    ├─ Provisioning 1536-dimensional HNSW vector index (idx_fkb_embedding_hnsw)...")
        cur.execute(f"""
            CREATE INDEX idx_fkb_embedding_hnsw 
            ON {TARGET_TABLE} USING hnsw (embedding vector_cosine_ops);
        """)

        print("    ├─ Provisioning GIST trigram text index for similarity search (idx_fkb_content_trgm)...")
        cur.execute(f"""
            CREATE INDEX idx_fkb_content_trgm 
            ON {TARGET_TABLE} USING gist (content gist_trgm_ops);
        """)

        print("    └─ Provisioning multi-tenant condition lookup index (idx_fkb_lookup_kv)...")
        cur.execute(f"""
            CREATE INDEX idx_fkb_lookup_kv 
            ON {TARGET_TABLE} (ticker, fiscal_year);
        """)

    # Explicitly commit the transactional lock
    conn.commit()
    print("🎯 [DDL Engine]: Database schema and quad-index cluster successfully activated.")


def inject_seed_data(conn):
    """
    Populates deterministic test anchors into the database schema.
    Enables isolated, high-fidelity offline black-box testing for downstream RRF engines.
    """
    print(f"\n🧬 [Seed Injector]: Injected high-density offline sandbox data...")

    # Emulate a valid 1536-dimensional OpenAI text-embedding-3-small float array
    mock_vector = [0.01536] * 1536

    # Super-set data payloads bridging structured telemetry (yfinance) and unstructured prose (SEC filings)
    seeds = [
        {
            "ticker": "TSLA",
            "fiscal_year": 2026,
            "doc_type": "YF_Balance_Sheet",
            "content": "--- [TSLA Fiscal Year 2026 Balance Sheet Snapshot] ---\nTotal Assets: 99900000000\nCash And Cash Equivalents: 25000000000\nTotal Liabilities: 45000000000\nShareholder Equity: 54900000000\n"
        },
        {
            "ticker": "TSLA",
            "fiscal_year": 2026,
            "doc_type": "SEC_Item_7_MDA",
            "content": "[Context Anchor: TSLA | FY 2026 | Section: Item_7_MDA]\nManagement's Discussion and Analysis of Financial Condition. In fiscal year 2026, our total assets peaked at 99.9 billion due to massive production expansions in the Texas and Berlin Gigafactories. Cash reserves remain extremely healthy at 25 billion, ensuring robust risk mitigation against red sea supply chain shocks."
        }
    ]

    with conn.cursor() as conn_cur:
        for seed in seeds:
            insert_query = f"""
                INSERT INTO {TARGET_TABLE} (ticker, fiscal_year, doc_type, content, embedding)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (ticker, fiscal_year, doc_type) DO NOTHING;
            """
            conn_cur.execute(insert_query, (
                seed["ticker"],
                seed["fiscal_year"],
                seed["doc_type"],
                seed["content"],
                mock_vector
            ))
            print(f"    └─ [SEED SUCCESS] Ingested anchor -> Ticker: {seed['ticker']} | Type: {seed['doc_type']:<16} | Year: {seed['fiscal_year']}")
            
    conn.commit()
    print("🎯 [Seed Injector]: Sandbox seed data infusion complete. Isolated development zone is hot.\n")


def main():
    print("=" * 70)
    print("🔥 [AlphaAgent Base Architect]: Activating Database Operations Console...")
    print(f"📡 Target Cluster Node: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    print("=" * 70)

    try:
        # Establish direct dedicated lifecycle connection, bypassing pool recycle overhead for system setup
        conn = psycopg.connect(DATABASE_URL)
    except Exception as e:
        print(f"❌ [CRITICAL]: Physical connection to PostgreSQL failed! Verify Docker engine status.\nLog trace: {e}")
        sys.exit(1)

    with conn:
        # Pre-flight check: Detect historical schema states
        exists = check_table_exists(conn)
        
        if exists:
            print(f"\n⚠️  [CRITICAL WARNING]: Historical asset state detected for table '{TARGET_TABLE}'!")
            print("⚠️  Proceeding with override will wipe all current financial chunks and high-dimensional vector embeddings!")
            
            # Interactive circuit breaker to prevent accidental deletion of scraped financial intelligence
            user_input = input("\n🚨 Confirm complete override and schema wipe? Enter [y] to Proceed / [n] to Abort: ").strip().lower()
            
            if user_input != 'y':
                print("\n🛑 [Operation Aborted]: Schema modification sequence terminated safely. No data altered.")
                sys.exit(0)
            print("\n🔥 Administrative authentication confirmed. Initiating teardown...")
        else:
            print(f"\nℹ️  [System Info]: Target table '{TARGET_TABLE}' not found in 'public' catalog. Executing cold-start setup.")

        # Trigger database infrastructure rebuild
        run_ddl_migration(conn)
        inject_seed_data(conn)

    print("=" * 70)
    print("🚀 [SUCCESS]: Database infrastructure upgraded. Ready for offline RAG/RRF SQL test isolation.")
    print("=" * 70)


if __name__ == "__main__":
    main()