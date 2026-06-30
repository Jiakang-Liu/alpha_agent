import httpx
from typing import Optional
from .db import get_connection


SEC_TICKER_MAPPING_URL = "https://www.sec.gov/files/company_tickers.json"


class CIKRepository:
    def __init__(self):
        self.headers = {
            "User-Agent": "AlphaAgentMasProject jiakangliu1997@gmail.com",
            "Accept-Encoding": "gzip, deflate",
        }

    async def ensure_table_exists(self) -> None:
        sql = """
        CREATE TABLE IF NOT EXISTS ticker_cik_mapping (
            ticker VARCHAR(20) PRIMARY KEY,
            cik VARCHAR(10) NOT NULL UNIQUE,
            company_name TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql)
            await conn.commit()

    async def fetch_sec_ticker_mapping(self) -> list[dict]:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                SEC_TICKER_MAPPING_URL,
                headers=self.headers,
            )
            response.raise_for_status()

        raw_data = response.json()

        records = []
        for item in raw_data.values():
            cik = str(item["cik_str"]).zfill(10)
            ticker = item["ticker"].upper()
            company_name = item["title"]

            records.append(
                {
                    "ticker": ticker,
                    "cik": cik,
                    "company_name": company_name,
                }
            )

        return records

    async def refresh_mapping(self) -> int:
        records = await self.fetch_sec_ticker_mapping()

        sql = """
        INSERT INTO ticker_cik_mapping (
            ticker,
            cik,
            company_name,
            updated_at
        )
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (ticker)
        DO UPDATE SET
            cik = EXCLUDED.cik,
            company_name = EXCLUDED.company_name,
            updated_at = CURRENT_TIMESTAMP;
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                for record in records:
                    await cur.execute(
                        sql,
                        (
                            record["ticker"],
                            record["cik"],
                            record["company_name"],
                        ),
                    )
            await conn.commit()

        return len(records)

    async def initialize(self) -> None:
        print("🧭 [CIK Repository]: Checking ticker_cik_mapping table...")
        await self.ensure_table_exists()

        print("🔄 [CIK Repository]: Refreshing SEC ticker-CIK mapping...")
        count = await self.refresh_mapping()

        print(f"✅ [CIK Repository]: Refreshed {count} ticker-CIK records.")

    async def get_cik_by_ticker(self, ticker: str) -> Optional[str]:
        sql = """
        SELECT cik
        FROM ticker_cik_mapping
        WHERE ticker = %s;
        """

        async with get_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, (ticker.upper(),))
                row = await cur.fetchone()

        if not row:
            return None

        return row[0]