import pytest

# from backend.agents import supervisor_node


@pytest.mark.asyncio
async def test_supervisor_routes_to_data_agent_when_raw_data_missing():
    from backend.agents import supervisor_node
    state = {
        "ticker": "TSLA",
        "user_query": "Analyze Tesla",
        "raw_data": [],
        "financial_report": None,
        "critique": None,
        "retry_count": 0,
    }

    result = await supervisor_node(state)

    assert "next_action" in result