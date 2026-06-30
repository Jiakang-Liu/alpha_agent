import pytest


def test_serialize_raw_data():
    from backend.services.analyst_service import serialize_raw_data

    raw_pieces = [
        {
            "source": "10-K | RRF=0.03",
            "content": "Revenue increased year over year.",
        },
        {
            "source": "YFinance | RRF=0.02",
            "content": "Stock price moved higher.",
        },
    ]

    result = serialize_raw_data(raw_pieces)

    assert "Intelligence Piece #1" in result
    assert "10-K | RRF=0.03" in result
    assert "Revenue increased year over year." in result
    assert "Intelligence Piece #2" in result
    assert "YFinance | RRF=0.02" in result


def test_build_analyst_system_prompt():
    from backend.services.analyst_service import build_analyst_system_prompt

    result = build_analyst_system_prompt("Mock context")

    assert "Senior Wall Street Research Analyst" in result
    assert "Do not invent metrics" in result
    assert "Mock context" in result


def test_build_analyst_user_instruction():
    from backend.services.analyst_service import build_analyst_user_instruction

    state = {
        "user_query": "Analyze Tesla stock",
    }

    result = build_analyst_user_instruction(state)

    assert "Analyze Tesla stock" in result


class FakeMessage:
    content = "# Mock Report"


class FakeChoice:
    message = FakeMessage()


class FakeCompletion:
    choices = [FakeChoice()]


class FakeChatCompletions:
    async def create(self, model, messages, temperature):
        assert model == "gpt-4o"
        assert temperature == 0.2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"

        return FakeCompletion()


class FakeChat:
    completions = FakeChatCompletions()


class FakeOpenAIClient:
    chat = FakeChat()


@pytest.mark.anyio
async def test_create_financial_report(monkeypatch):
    import backend.services.analyst_service as analyst_service

    monkeypatch.setattr(
        analyst_service,
        "AsyncOpenAI",
        lambda api_key=None: FakeOpenAIClient(),
    )

    result = await analyst_service.create_financial_report(
        system_prompt="Mock system prompt",
        user_instruction="Mock user instruction",
    )

    assert result == "# Mock Report"