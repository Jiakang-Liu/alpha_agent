import os
import asyncio
from datetime import datetime, timezone

import yfinance as yf
from openai import AsyncOpenAI
from dotenv import load_dotenv

from backend.infrastructure import get_connection

load_dotenv()


class FinancialChunk:
    """
    Represents one structured financial data chunk for RAG ingestion.
    """

    def __init__(self, ticker: str, fiscal_year: int, doc_type: str, content: str):
        self.ticker = ticker.upper()
        self.fiscal_year = fiscal_year
        self.doc_type = doc_type
        self.content = content
        self.created_at = datetime.now(timezone.utc).isoformat()


class YFinanceDataPipeline:
    def __init__(self, ticker_symbol: str,fiscal_year: int = 2026):
        self.embedding_client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.ticker_symbol = ticker_symbol
        self.fiscal_year = fiscal_year

    async def fetch_ticker_financials(self) -> list[FinancialChunk]:
        ticker_symbol = self.ticker_symbol.upper()

        print(f"📥 [YFinance Pipeline]: Fetching financials for {ticker_symbol}...")

        def get_financial_statements(symbol: str):
            ticker = yf.Ticker(symbol)
            return ticker.balance_sheet, ticker.cashflow

        balance_sheet, cash_flow = await asyncio.to_thread(
            get_financial_statements,
            ticker_symbol,
        )

        chunks: list[FinancialChunk] = []

        if balance_sheet is not None and not balance_sheet.empty:
            latest_bs = balance_sheet.iloc[:, 0]

            bs_lines = [
                f"--- [{ticker_symbol} Fiscal Year {self.fiscal_year} Balance Sheet Snapshot] ---"
            ]

            for idx, val in latest_bs.items():
                bs_lines.append(f"{idx}: {val}")

            chunks.append(
                FinancialChunk(
                    ticker=ticker_symbol,
                    fiscal_year=self.fiscal_year,
                    doc_type="Balance_Sheet",
                    content="\n".join(bs_lines),
                )
            )

        if cash_flow is not None and not cash_flow.empty:
            latest_cf = cash_flow.iloc[:, 0]

            cf_lines = [
                f"--- [{ticker_symbol} Fiscal Year {self.fiscal_year} Cash Flow Snapshot] ---"
            ]

            for idx, val in latest_cf.items():
                cf_lines.append(f"{idx}: {val}")

            chunks.append(
                FinancialChunk(
                    ticker=ticker_symbol,
                    fiscal_year=self.fiscal_year,
                    doc_type="Cash_Flow",
                    content="\n".join(cf_lines),
                )
            )

        print(
            f"✅ [YFinance Pipeline]: Converted {ticker_symbol} into "
            f"{len(chunks)} chunks."
        )

        return chunks

    async def batch_vectorize_chunks(self, chunks: list[FinancialChunk]) -> list:
        if not chunks:
            return []

        print(
            f"🧬 [Embedding Engine]: Generating embeddings for "
            f"{len(chunks)} chunks..."
        )

        texts_to_embed = [chunk.content for chunk in chunks]

        response = await self.embedding_client.embeddings.create(
            model="text-embedding-3-small",
            input=texts_to_embed,
        )

        return [item.embedding for item in response.data]

    async def execute_postgres_upsert(
        self,
        chunks: list[FinancialChunk],
        embeddings: list,
    ) -> None:
        if not chunks:
            print("⚠️ [YFinance Pipeline]: No chunks to upsert.")
            return

        if len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings length mismatch.")

        sql = """
            INSERT INTO financial_knowledge_base (
                ticker,
                fiscal_year,
                doc_type,
                content,
                embedding
            )
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (ticker, fiscal_year, doc_type)
            DO UPDATE SET
                content = EXCLUDED.content,
                embedding = EXCLUDED.embedding,
                created_at = CURRENT_TIMESTAMP;
        """

        print("💾 [PostgreSQL Pool]: Executing YFinance upsert...")

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                for chunk, embedding in zip(chunks, embeddings):
                    await cur.execute(
                        sql,
                        (
                            chunk.ticker,
                            chunk.fiscal_year,
                            chunk.doc_type,
                            chunk.content,
                            str(embedding),
                        ),
                    )

                    print(
                        f"    └─ [UPSERT SUCCESS] | "
                        f"{chunk.ticker} | {chunk.doc_type} | {chunk.fiscal_year}"
                    )

            await conn.commit()

        print("🎯 [PostgreSQL Pool]: YFinance transaction committed.\n")

    async def run_pipeline(self) -> None:
        print(f"\n🔥 [YFinance Pipeline]: Starting ingestion for {self.ticker_symbol.upper()}")

        try:
            chunks = await self.fetch_ticker_financials()

            embeddings = await self.batch_vectorize_chunks(chunks)

            await self.execute_postgres_upsert(chunks, embeddings)

            print(f"✅ [YFinance Pipeline]: Completed {self.ticker_symbol.upper()}")

        except Exception as err:
            print(f"❌ [YFinance Pipeline Failed] {self.ticker_symbol.upper()}: {err}")