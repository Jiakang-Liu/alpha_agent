from backend.schemas import AgentState
from backend.infrastructure import AlphaHybridSearchEngine
from backend.services import (
    extract_data_request,
    build_data_error,
    ensure_ticker_data_cached,
    create_query_embedding,
    retrieve_relevant_chunks,
    format_raw_data,
)
from backend.events import NODE_LOG

async def data_agent_node(state: AgentState) -> dict:
    print("[Data Agent Node]: Starting real data retrieval pipeline...")

    ticker, user_query = extract_data_request(state)

    if not ticker:
        return build_data_error("missing ticker.")

    search_engine = AlphaHybridSearchEngine()

    try:
        await ensure_ticker_data_cached(ticker)

        query_vector = await create_query_embedding(user_query)

        hit_records = await retrieve_relevant_chunks(
            search_engine=search_engine,
            ticker=ticker,
            user_query=user_query,
            query_vector=query_vector,
        )

        raw_data = format_raw_data(hit_records)

        return {
            "raw_data": raw_data,
            "critique": "",
            "events": [
                {
                    "type": NODE_LOG,
                    "message": f"Retrieved {len(hit_records)} relevant data chunks for {ticker}.",
                }
            ],
        }

    except Exception as e:
        print(f"[Data Agent ERROR]: {e}")
        return build_data_error(str(e))