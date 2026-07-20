import pytest

from backend.agents.supervisor import supervisor_node


@pytest.mark.asyncio
async def test_supervisor_finishes_when_critique_limit_reached():
    state = {
        "ticker": "TEST",
        "user_query": "Analyze TEST",
        "raw_data": [
            {
                "source": "mock",
                "content": "mock financial data",
            }
        ],
        "financial_report": "Existing report",
        "critique": "FCF analysis is still missing.",
        "critique_count": 3,
        "next_action": "",
        "events": [],
        "data_quality": {
            "income_statement": "available",
            "balance_sheet": "available",
            "cash_flow_statement": "available",
        },
        "missing_data": [],
        "data_limitations": [],
    }

    result = await supervisor_node(state)

    assert result["next_action"] == "FINISH"

    messages = [
        event["message"]
        for event in result["events"]
    ]

    assert (
        "Circuit breaker triggered after 3 audit rejections."
        in messages
    )


@pytest.mark.asyncio
async def test_supervisor_retries_when_below_critique_limit():
    state = {
        "ticker": "TEST",
        "user_query": "Analyze TEST",
        "raw_data": [
            {
                "source": "mock",
                "content": "mock financial data",
            }
        ],
        "financial_report": "Existing report",
        "critique": "FCF analysis is still missing.",
        "critique_count": 2,
        "next_action": "",
        "events": [],
        "data_quality": {
            "income_statement": "available",
            "balance_sheet": "available",
            "cash_flow_statement": "available",
        },
        "missing_data": [],
        "data_limitations": [],
    }

    result = await supervisor_node(state)

    assert result["next_action"] == "analyst_agent"