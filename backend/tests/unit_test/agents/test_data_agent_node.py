# backend/tests/test_data_agent_node.py

import pytest


class FakeSearchEngine:
    async def hybrid_search_rrf(
        self,
        ticker,
        query_text,
        query_vector,
        top_k=5,
    ):
        return [
            {
                "id": 1,
                "doc_type": "10-K",
                "rrf_score": 0.03,
                "content": "Mock financial content",
            }
        ]


@pytest.mark.anyio
async def test_data_agent_node_success(monkeypatch):
    import backend.agents.data_agent as data_agent

    async def fake_ensure_ticker_data_cached(search_engine, ticker):
        return None

    async def fake_create_query_embedding(user_query):
        return [0.1, 0.2, 0.3]

    monkeypatch.setattr(
        data_agent,
        "AlphaHybridSearchEngine",
        lambda: FakeSearchEngine(),
    )

    monkeypatch.setattr(
        data_agent,
        "ensure_ticker_data_cached",
        fake_ensure_ticker_data_cached,
    )

    monkeypatch.setattr(
        data_agent,
        "create_query_embedding",
        fake_create_query_embedding,
    )

    state = {
        "ticker": "TSLA",
        "user_query": "Analyze Tesla",
    }

    result = await data_agent.data_agent_node(state)

    assert result["critique"] == ""
    assert len(result["raw_data"]) == 1
    assert result["raw_data"][0]["content"] == "Mock financial content"