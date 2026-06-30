import pytest


@pytest.mark.anyio
async def test_analyst_agent_node_success(monkeypatch):
    import backend.agents.analyst as analyst

    async def fake_create_financial_report(system_prompt, user_instruction):
        assert "Revenue increased year over year." in system_prompt
        assert "Analyze Tesla stock" in user_instruction
        return "# Mock Analyst Report"

    monkeypatch.setattr(
        analyst,
        "create_financial_report",
        fake_create_financial_report,
    )

    state = {
        "user_query": "Analyze Tesla stock",
        "raw_data": [
            {
                "source": "10-K | RRF=0.03",
                "content": "Revenue increased year over year.",
            }
        ],
    }

    result = await analyst.analyst_agent_node(state)

    assert result == {
        "financial_report": "# Mock Analyst Report",
    }