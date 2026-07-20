from backend.schemas import AgentState
from typing import Iterable

from backend.infrastructure import (
    AlphaHybridSearchEngine,
    get_available_doc_types,
)
from backend.services import (
    extract_data_request,
    build_data_error,
    ensure_ticker_data_cached,
    create_query_embedding,
    retrieve_relevant_chunks,
    format_raw_data,
)
from backend.events import NODE_LOG
from langsmith import traceable


def assess_financial_data_quality(
    available_doc_types: Iterable[str],
) -> tuple[dict[str, str], list[str], list[str]]:
    """
    Assess whether the core financial statement categories are available.

    SEC XBRL data can serve as the income-statement source because it
    contains metrics such as revenue and net income.
    """
    normalized_types = {
        str(doc_type).strip().lower()
        for doc_type in available_doc_types
        if doc_type
    }

    income_statement_available = bool(
        normalized_types
        & {
            "income_statement",
            "income_statements",
            "financials",
            "sec_xbrl",
            "sec_sec_xbrl",
        }
    )

    balance_sheet_available = bool(
        normalized_types
        & {
            "balance_sheet",
            "balance_sheets",
        }
    )

    cash_flow_available = bool(
        normalized_types
        & {
            "cash_flow",
            "cashflow",
            "cash_flow_statement",
            "cash_flow_statements",
        }
    )

    data_quality = {
        "income_statement": (
            "available"
            if income_statement_available
            else "unavailable"
        ),
        "balance_sheet": (
            "available"
            if balance_sheet_available
            else "unavailable"
        ),
        "cash_flow_statement": (
            "available"
            if cash_flow_available
            else "unavailable"
        ),
    }

    missing_data = [
        data_type
        for data_type, status in data_quality.items()
        if status == "unavailable"
    ]

    limitation_messages = {
        "income_statement": (
            "Income statement data was unavailable from the cached sources."
        ),
        "balance_sheet": (
            "Balance sheet data was unavailable from the cached sources."
        ),
        "cash_flow_statement": (
            "Cash flow statement data was unavailable from the cached sources. "
            "Operating cash flow and free cash flow could not be evaluated."
        ),
    }

    data_limitations = [
        limitation_messages[data_type]
        for data_type in missing_data
    ]

    return data_quality, missing_data, data_limitations


@traceable(name="Data Agent Node")
async def data_agent_node(state: AgentState) -> dict:
    print("[Data Agent Node]: Starting real data retrieval pipeline...")

    ticker, user_query = extract_data_request(state)

    if not ticker:
        return build_data_error("missing ticker.")

    search_engine = AlphaHybridSearchEngine()

    try:
        await ensure_ticker_data_cached(ticker)

        available_doc_types = await get_available_doc_types(ticker)

        print(
            f"[Data Agent]: Available document types for {ticker}: "
            f"{sorted(available_doc_types)}"
        )

        (
            data_quality,
            missing_data,
            data_limitations,
        ) = assess_financial_data_quality(available_doc_types)

        print(f"[Data Agent]: Data quality = {data_quality}")
        print(f"[Data Agent]: Missing data = {missing_data}")

        query_vector = await create_query_embedding(user_query)

        hit_records = await retrieve_relevant_chunks(
            search_engine=search_engine,
            ticker=ticker,
            user_query=user_query,
            query_vector=query_vector,
        )

        raw_data = format_raw_data(hit_records)

        missing_summary = (
            ", ".join(missing_data)
            if missing_data
            else "none"
        )

        return {
            "raw_data": raw_data,
            "data_quality": data_quality,
            "missing_data": missing_data,
            "data_limitations": data_limitations,
            "critique": "",
            "events": [
                {
                    "type": NODE_LOG,
                    "message": (
                        f"Retrieved {len(hit_records)} relevant data chunks "
                        f"for {ticker}. Missing data: {missing_summary}."
                    ),
                }
            ],
        }

    except Exception as e:
        print(f"[Data Agent ERROR]: {e}")
        return build_data_error(str(e))