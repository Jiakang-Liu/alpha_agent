import os
import asyncio
from datetime import datetime, timezone
import yfinance as yf
from openai import AsyncOpenAI
from dotenv import load_dotenv
import psycopg

# Load runtime environment configurations
load_dotenv()

# Configure targets - fallback to local Docker container cluster if variable is unset
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    pg_pass = os.getenv("POSTGRES_PASSWORD", "postgres")
    DATABASE_URL = f"postgresql://alpha_user:{pg_pass}@localhost:5432/alpha_agent"

if "+asyncpg" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")


# 1. Domain Object: Enforcing Data Ingestion Contracts
class FinancialChunk:
    """
    Represents a structured, atomic unit of financial intelligence 
    decorated with critical business metadata for advanced RAG filtering.
    """
    def __init__(self, ticker: str, fiscal_year: int, doc_type: str, content: str):
        self.ticker = ticker                 # e.g., "TSLA"
        self.fiscal_year = fiscal_year       # e.g., 2026
        self.doc_type = doc_type             # e.g., "Balance_Sheet" or "Cash_Flow"
        self.content = content               # High-density serialized text representation
        # Compliant with Python 3.11+ timezone-aware standards
        self.created_at = datetime.now(timezone.utc).isoformat()


# 2. Concurrency Engine: Asynchronous Telemetry Ingestion Pipeline
async def fetch_ticker_financials(ticker_symbol: str) -> list[FinancialChunk]:
    """
    Spawns background worker threads to safely offload blocking yfinance I/O calls.
    Leverages asyncio.gather to achieve high-throughput parallel data gathering.
    """
    print(f"📥 [Data Pipeline]: Thread spawned. Pulling telemetry for '{ticker_symbol}'...")
    
    loop = asyncio.get_running_loop()
    
    # Thread-safe execution closure for blocking I/O bound requests
    def get_financial_statements(symbol: str):
        ticker = yf.Ticker(symbol)
        return ticker.balance_sheet, ticker.cashflow

    # Concurrent Execution via Asyncio Thread Pool Wrapper
    balance_sheet, cash_flow = await loop.run_in_executor(
        None, 
        get_financial_statements, 
        ticker_symbol
    )
    
    chunks = []
    current_year = 2026 # Target fiscal window matching current timeframe
    
    # ---- Pipeline Stage A: Balance Sheet Serialization & Token Optimization ----
    if balance_sheet is not None and not balance_sheet.empty:
        latest_bs = balance_sheet.iloc[:, 0] 
        bs_content = f"--- [{ticker_symbol} Fiscal Year {current_year} Balance Sheet Snapshot] ---\n"
        for idx, val in latest_bs.items():
            bs_content += f"{idx}: {val}\n"
            
        chunks.append(FinancialChunk(
            ticker=ticker_symbol,
            fiscal_year=current_year,
            doc_type="Balance_Sheet",
            content=bs_content
        ))

    # ---- Pipeline Stage B: Cash Flow Statement Extraction ----
    if cash_flow is not None and not cash_flow.empty:
        latest_cf = cash_flow.iloc[:, 0]
        cf_content = f"--- [{ticker_symbol} Fiscal Year {current_year} Cash Flow Snapshot] ---\n"
        for idx, val in latest_cf.items():
            cf_content += f"{idx}: {val}\n"
            
        chunks.append(FinancialChunk(
            ticker=ticker_symbol,
            fiscal_year=current_year,
            doc_type="Cash_Flow",
            content=cf_content
        ))
        
    print(f"✅ [Data Pipeline]: Successfully converted '{ticker_symbol}' data into {len(chunks)} high-density chunks.")
    return chunks


# 3. Vector Database Layer: Batch Embedding & Idempotent Upsert Transaction
async def upsert_chunks_to_postgres(chunks: list[FinancialChunk]):
    """
    Vectorizes raw text slices in a single high-performance batch request,
    then executes an idempotent Upsert (ON CONFLICT DO UPDATE) into pgvector.
    """
    if not chunks:
        print("⚠️ [PostgreSQL Cluster]: Ingestion aborted. Input chunk batch is empty.")
        return
        
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Batch Embedding Optimization: Minimize network round-trips (RTT)
    print(f"🧬 [Embedding Engine]: Generating high-dimensional vectors for {len(chunks)} chunks in batch...")
    texts_to_embed = [chunk.content for chunk in chunks]
    
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=texts_to_embed
    )
    
    print(f"💾 [PostgreSQL Cluster]: Executing incremental Upsert transaction via Async connection...")
    
    # Establish fully async asynchronous connection and cursor contexts
    async with await psycopg.AsyncConnection.connect(DATABASE_URL) as battlefield_conn:
        async with battlefield_conn.cursor() as cur:
            for idx, chunk in enumerate(chunks):
                vector = response.data[idx].embedding
                
                # Execute production-grade atomic Upsert logic
                await cur.execute("""
                    INSERT INTO financial_knowledge_base (ticker, fiscal_year, doc_type, content, embedding)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (ticker, fiscal_year, doc_type) 
                    DO UPDATE SET 
                        content = EXCLUDED.content, 
                        embedding = EXCLUDED.embedding,
                        created_at = CURRENT_TIMESTAMP;
                """, (chunk.ticker, chunk.fiscal_year, chunk.doc_type, chunk.content, vector))
                
                print(f"    └─ [UPSERT SUCCESS] | Ticker: {chunk.ticker} | Type: {chunk.doc_type:<13} | Year: {chunk.fiscal_year}")
            
            # Commit the atomic transaction after loop completion inside cursor context
            await battlefield_conn.commit()
            
    print("🎯 [PostgreSQL Cluster]: Transaction committed successfully.\n")


# 4. Master Orchestration Entry Point
async def main():
    print("🔥 [Day 10 Pipeline Activation]: Initiating High-Throughput Financial Data Ingestion...\n")
    
    # Scalable Target Set: Querying aerospace/high-growth enterprise tech giants
    target_tickers = ["TSLA", "LMT"]
    
    # Asynchronous Fan-Out: Execute parallel HTTP scraping operations concurrently
    tasks = [fetch_ticker_financials(ticker) for ticker in target_tickers]
    results = await asyncio.gather(*tasks)
    
    # Flatten the nested results array into a linear processing array
    all_chunks = []
    for chunk_list in results:
        all_chunks.extend(chunk_list)
        
    # Trigger vector database atomic storage operation
    await upsert_chunks_to_postgres(all_chunks)


if __name__ == "__main__":
    import sys
    import asyncio

    # 🛡️ Windows 环境下的高性能 psycopg 异步兼容性补丁
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        print("🪟 [Windows OS Patch]: 已成功将 asyncio 事件循环策略强制切换为 WindowsSelectorEventLoopPolicy")

    # 原本的触发运行入口
    asyncio.run(run_e2e_integration_test())