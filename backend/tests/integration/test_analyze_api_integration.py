import json
import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager

from backend.server import app


@pytest.mark.anyio
async def test_analyze_api_stream_success():
    payload = {
        "ticker": "AAPL",
        "user_query": "Give me a brief investment analysis.",
    }

    async with LifespanManager(app):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
            timeout=60.0,
        ) as client:
            async with client.stream(
                "POST",
                "/api/analyze",
                json=payload,
            ) as response:
                assert response.status_code == 200

                events = []

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    if line.startswith("data: "):
                        events.append(json.loads(line.removeprefix("data: ")))

    assert events, "Expected streaming response, but got no events."

    event_types = [event.get("type") for event in events]
    nodes = [event.get("node", "") for event in events]

    assert "graph_start" in event_types
    assert "graph_end" in event_types

    assert "supervisor" in nodes
    assert "data_agent" in nodes
    assert "analyst_agent" in nodes

    assert any("critic" in node for node in nodes)

    report_events = [
        event for event in events
        if event.get("type") == "report_generated"
    ]

    assert report_events, "Expected a report_generated event."
    assert report_events[-1].get("content"), "Expected report content."

    assert not any(
        event.get("type") == "error"
        for event in events
    )