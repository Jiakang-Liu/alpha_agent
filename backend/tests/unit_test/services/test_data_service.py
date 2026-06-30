# backend/tests/test_data_service.py

from backend.services.data_service import (
    extract_data_request,
    build_data_error,
    format_raw_data,
)


def test_extract_data_request_uppercases_ticker():
    state = {
        "ticker": "tsla",
        "user_query": "Analyze Tesla",
    }

    ticker, user_query = extract_data_request(state)

    assert ticker == "TSLA"
    assert user_query == "Analyze Tesla"


def test_build_data_error():
    result = build_data_error("missing ticker.")

    assert result == {
        "raw_data": [],
        "critique": "Data agent failed: missing ticker.",
    }


def test_format_raw_data():
    hits = [
        {
            "doc_type": "10-K",
            "rrf_score": 0.032,
            "content": "Tesla revenue increased.",
        }
    ]

    result = format_raw_data(hits)

    assert result == [
        {
            "source": "10-K | RRF=0.032",
            "content": "Tesla revenue increased.",
        }
    ]