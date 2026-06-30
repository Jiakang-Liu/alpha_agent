import os
import asyncio
import time
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv
from .sec_chunker import AdvancedSECChunker
from backend.infrastructure import CIKRepository
from backend.infrastructure import get_connection

load_dotenv()


# =====================================================================
# 🛡️ 工业级安全底座：高精度的异步速率限制器（漏桶算法变体）
# =====================================================================
class AsyncSECReqLimiter:
    """
    Enforces the official SEC restriction: Strictly no more than 10 requests per second.
    """
    def __init__(self, requests_per_second: float = 5.0):
        # 為了絕對安全，我們將閾值設為每秒 5 次（SEC 官方上限是 10 次），留出 50% 的安全緩衝帶
        self.delay = 1.0 / requests_per_second
        self.last_request_time = 0.0
        self.lock = asyncio.Lock()

    async def wait_for_slot(self):
        """Blocks until the execution timeline conforms to the safety delay."""
        async with self.lock:
            current_time = time.time()
            elapsed = current_time - self.last_request_time
            if elapsed < self.delay:
                wait_time = self.delay - elapsed
                # 阻塞當前協程，讓出事件循環，精確控制發射間隔
                await asyncio.sleep(wait_time)
            self.last_request_time = time.time()


class SECDataPipeline:
    def __init__(
        self,
        ticker: str,
        fiscal_year: int = 2026,
        section_id: str = "SEC_XBRL",
    ):
        self.ticker = ticker.upper()
        self.fiscal_year = fiscal_year
        self.section_id = section_id

        self.headers = {
            "User-Agent": "AlphaAgentMasProject jiakangliu1997@gmail.com",
            "Accept-Encoding": "gzip, deflate",
            "Host": "data.sec.gov",
        }

        self.chunker = AdvancedSECChunker(target_chunk_size=1500)
        self.limiter = AsyncSECReqLimiter(requests_per_second=4.0)
        self.cik_repository = CIKRepository()
        self.embedding_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def fetch_sec_facts_real(self) -> str:
        cik = await self.cik_repository.get_cik_by_ticker(self.ticker)
        if not cik:
            raise ValueError(f"Ticker '{self.ticker}' CIK mapping not found.")

        sec_url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"

        await self.limiter.wait_for_slot()

        print("📡 [SEC API 安全通道]: 正在安全發射合規請求至 SEC 官方網關...")
        print(f"    └─ TARGET: {sec_url}")

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(sec_url, headers=self.headers)

            if response.status_code == 403:
                raise PermissionError("❌ SEC Access Denied.")

            if response.status_code != 200:
                raise httpx.HTTPStatusError(
                    f"❌ Bad HTTP Status: {response.status_code}",
                    request=response.request,
                    response=response,
                )

            facts_data = response.json()
            us_gaap = facts_data.get("facts", {}).get("us-gaap", {})

            if not us_gaap:
                raise KeyError(f"❌ 'us-gaap' records are unavailable for {self.ticker}.")

            target_concepts = [
                "NetIncomeLoss",
                "Revenues",
                "ResearchAndDevelopmentExpense",
            ]

            extracted_lines = [
                f"=== SEC OFFICIAL XBRL METRICS DISCLOSURE FOR {self.ticker} ===",
                f"Ingested at: {time.strftime('%Y-%m-%d %H:%M:%S')}\n",
            ]

            for concept in target_concepts:
                concept_node = us_gaap.get(concept)
                if not concept_node:
                    continue

                units_usd = concept_node.get("units", {}).get("USD", [])
                if not units_usd:
                    continue

                extracted_lines.append(f"Financial Concept: GAAP-{concept}")

                for item in units_usd[-4:]:
                    form = item.get("form", "N/A")
                    fy = item.get("fy", "N/A")
                    fp = item.get("fp", "N/A")
                    val = item.get("val", 0)

                    extracted_lines.append(
                        f"   Form {form:<4} | FY {fy} | Period {fp:<2} | Value: {val}"
                    )

                extracted_lines.append("")

            return "\n".join(extracted_lines)

    async def batch_vectorize_chunks(self, chunks: list) -> list:
        if not chunks:
            return []

        print(f"🧬 [Embedding Engine]: 并行向量化 {len(chunks)} 个 SEC 真实财务切片...")

        texts_to_embed = [chunk.content for chunk in chunks]

        response = await self.embedding_client.embeddings.create(
            model="text-embedding-3-small",
            input=texts_to_embed,
        )

        return [item.embedding for item in response.data]

    async def execute_postgres_upsert(self, chunks: list, embeddings: list):
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

        async with get_connection() as connection:
            async with connection.cursor() as cur:
                for chunk, vector in zip(chunks, embeddings):
                    await cur.execute(
                        sql,
                        (
                            chunk.ticker,
                            chunk.fiscal_year,
                            chunk.doc_type,
                            chunk.content,
                            str(vector),
                        ),
                    )

                    print(
                        f"    └─ [落盤成功] -> {chunk.ticker} | "
                        f"{chunk.doc_type} | 數據長度: {len(chunk.content)} 字元"
                    )

            await connection.commit()

    async def run_pipeline(self):
        print(f"\n🔥 [合規流水線啓動]: 執行多租戶數據安全拉取 -> {self.ticker}")

        try:
            raw_sec_prose = await self.fetch_sec_facts_real()

            processed_chunks = self.chunker.chunk_document(
                raw_sec_prose,
                self.ticker,
                self.fiscal_year,
                self.section_id,
            )

            vector_matrix = await self.batch_vectorize_chunks(processed_chunks)

            await self.execute_postgres_upsert(processed_chunks, vector_matrix)

            print(f"✅ [SEC Pipeline]: Completed {self.ticker}")

        except Exception as err:
            print(f"❌ [流水線中斷]: {self.ticker} | {err}")