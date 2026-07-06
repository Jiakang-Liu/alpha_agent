import json

import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient

from backend.events import (
    ERROR,
    GRAPH_END,
    GRAPH_START,
    REPORT_GENERATED,
    VALID_EVENT_TYPES,
)
from backend.server import app


@pytest.mark.anyio
async def test_sse_contract_success():
    payload = {
        "ticker": "AAPLAAPL",
        "user_query": "Give me a brief investment analysis.",
    }

    events = []

    async with LifespanManager(app):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
            timeout=120.0,
        ) as client:
            async with client.stream(
                "POST",
                "/api/analyze",
                json=payload,
            ) as response:
                assert response.status_code == 200

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue

                    assert line.startswith("data:")

                    raw_json = line.removeprefix("data:").strip()
                    event = json.loads(raw_json)

                    assert "type" in event
                    assert event["type"] in VALID_EVENT_TYPES

                    events.append(event)

    assert events, "Expected SSE events, but got none."

    assert events[0]["type"] == GRAPH_START
    assert events[-1]["type"] == GRAPH_END

    report_found = False

    for event in events:
        assert event["type"] != ERROR

        if event["type"] == REPORT_GENERATED:
            report_found = True
            assert "content" in event
            assert event["content"]

    assert report_found, "Expected report_generated event."