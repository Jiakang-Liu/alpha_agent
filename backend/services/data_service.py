import os
from openai import AsyncOpenAI

from backend.schemas import AgentState
from backend.pipelines import YFinanceDataPipeline, SECDataPipeline
from backend.infrastructure import verify_database_state


def extract_data_request(state: AgentState) -> tuple[str, str]:
    ticker = state.get("ticker", "").upper()
    user_query = state.get("user_query", "")
    return ticker, user_query


def build_data_error(message: str) -> dict:
    return {
        "raw_data": [],
        "critique": f"Data agent failed: {message}",
    }


async def ensure_ticker_data_cached(search_engine, ticker: str) -> None:
    total_rows = await verify_database_state(search_engine, ticker)

    if total_rows == 0:
        print(f"[Data Agent]: No cached data for {ticker}. Running pipelines...")

        yf_pipeline = YFinanceDataPipeline(ticker)
        sec_pipeline = SECDataPipeline(ticker)

        await yf_pipeline.run_pipeline()
        await sec_pipeline.run_pipeline()
    else:
        print(f"[Data Agent]: Found {total_rows} cached chunks for {ticker}.")


async def create_query_embedding(user_query: str) -> list[float]:
    openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    emb_res = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=[user_query],
    )

    return emb_res.data[0].embedding


async def retrieve_relevant_chunks(
    search_engine,
    ticker: str,
    user_query: str,
    query_vector: list[float],
    top_k: int = 5,
) -> list[dict]:
    return await search_engine.hybrid_search_rrf(
        ticker=ticker,
        query_text=user_query,
        query_vector=query_vector,
        top_k=top_k,
    )


def format_raw_data(hit_records: list[dict]) -> list[dict]:
    return [
        {
            "source": f"{hit.get('doc_type', 'unknown')} | RRF={hit.get('rrf_score')}",
            "content": hit.get("content", ""),
        }
        for hit in hit_records
    ]