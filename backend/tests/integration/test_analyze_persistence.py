import json

import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager

from backend.server import app
from backend.infrastructure.db import get_connection
from backend.events import REPORT_GENERATED, NODE_LOG, GRAPH_END, ERROR


class FakeSuccessGraph:
    async def astream(self, initial_state):
        print("[TEST] FakeSuccessGraph started", flush=True)
        print(f"[TEST] Initial state => {initial_state}", flush=True)

        yield {
            "data_agent": {
                "events": [
                    {
                        "type": NODE_LOG,
                        "message": "Mock data retrieved.",
                    }
                ]
            }
        }

        print("[TEST] yielded data_agent", flush=True)

        yield {
            "analyst": {
                "events": [
                    {
                        "type": REPORT_GENERATED,
                        "report": "Mock final report",
                    }
                ]
            }
        }

        print("[TEST] yielded analyst", flush=True)
        print("[TEST] FakeSuccessGraph finished", flush=True)


class FakeFailedGraph:
    async def astream(self, initial_state):
        print("[TEST] FakeFailedGraph started", flush=True)
        print(f"[TEST] Initial state => {initial_state}", flush=True)

        yield {
            "data_agent": {
                "events": [
                    {
                        "type": NODE_LOG,
                        "message": "Mock data started.",
                    }
                ]
            }
        }

        print("[TEST] yielded data_agent", flush=True)
        print("[TEST] FakeFailedGraph raising error", flush=True)

        raise RuntimeError("Mock graph failure")


class FakeSchemaInitializer:
    async def initialize(self):
        print("[TEST] FakeSchemaInitializer.initialize called", flush=True)


class FakeCIKRepository:
    async def ensure_table_exists(self):
        print("[TEST] FakeCIKRepository.ensure_table_exists called", flush=True)


def patch_lifespan_dependencies(monkeypatch, fake_graph):
    import backend.server as server

    # monkeypatch.setattr(server, "SchemaInitializer", FakeSchemaInitializer)
    monkeypatch.setattr(server, "CIKRepository", FakeCIKRepository)
    monkeypatch.setattr(server, "build_alpha_graph", lambda: fake_graph)


async def read_sse_until_done(response):
    raw_events = []

    print("[TEST] Start reading SSE stream", flush=True)

    async for line in response.aiter_lines():
        print(f"[TEST] SSE line => {line}", flush=True)

        if not line.startswith("data: "):
            continue

        event = json.loads(line.removeprefix("data: "))
        print(f"[TEST] SSE event => {event}", flush=True)

        raw_events.append(event)

        if event.get("type") in [GRAPH_END, ERROR]:
            print("[TEST] Terminal event received", flush=True)
            break

    print("[TEST] Finished reading SSE stream", flush=True)

    return raw_events


async def fetch_latest_run_by_ticker(ticker: str):
    print(f"[TEST] Querying latest analysis run for ticker => {ticker}", flush=True)

    async with get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT
                    ticker,
                    status,
                    current_node,
                    final_report,
                    error_message,
                    duration_ms,
                    finished_at
                FROM analysis_runs
                WHERE ticker = %s
                ORDER BY created_at DESC
                LIMIT 1;
                """,
                (ticker,),
            )
            row = await cur.fetchone()

    print(f"[TEST] DB row => {row}", flush=True)

    return row


@pytest.mark.anyio
async def test_analyze_success_persists_analysis_run(monkeypatch):
    print("\n[TEST] START success test", flush=True)

    patch_lifespan_dependencies(
        monkeypatch=monkeypatch,
        fake_graph=FakeSuccessGraph(),
    )

    async with LifespanManager(app):
        print("[TEST] Lifespan started", flush=True)

        assert app.state.alpha_graph.__class__.__name__ == "FakeSuccessGraph"

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
            timeout=60.0,
        ) as client:
            print("[TEST] AsyncClient created", flush=True)
            print("[TEST] Sending /api/analyze request", flush=True)

            async with client.stream(
                "POST",
                "/api/analyze",
                json={
                    "ticker": "TSLA",
                    "user_query": "Give me a mock analysis.",
                },
            ) as response:
                print(f"[TEST] Response status => {response.status_code}", flush=True)

                assert response.status_code == 200

                raw_events = await read_sse_until_done(response)

                print(f"[TEST] Raw events => {raw_events}", flush=True)

        print("[TEST] Request finished", flush=True)

        row = await fetch_latest_run_by_ticker("TSLA")

    print("[TEST] Lifespan closed", flush=True)

    assert row is not None
    assert row[0] == "TSLA"
    assert row[1] == "SUCCESS"
    assert row[2] == "analyst"
    assert row[3] == "Mock final report"
    assert row[4] is None
    assert row[5] is not None
    assert row[6] is not None

    print("[TEST] SUCCESS test passed", flush=True)


@pytest.mark.anyio
async def test_analyze_failure_persists_analysis_run(monkeypatch):
    print("\n[TEST] START failure test", flush=True)

    patch_lifespan_dependencies(
        monkeypatch=monkeypatch,
        fake_graph=FakeFailedGraph(),
    )

    async with LifespanManager(app):
        print("[TEST] Lifespan started", flush=True)

        assert app.state.alpha_graph.__class__.__name__ == "FakeFailedGraph"

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
            timeout=60.0,
        ) as client:
            print("[TEST] AsyncClient created", flush=True)
            print("[TEST] Sending /api/analyze request", flush=True)

            async with client.stream(
                "POST",
                "/api/analyze",
                json={
                    "ticker": "FAILTEST",
                    "user_query": "Trigger mock failure.",
                },
            ) as response:
                print(f"[TEST] Response status => {response.status_code}", flush=True)

                assert response.status_code == 200

                raw_events = await read_sse_until_done(response)

                print(f"[TEST] Raw events => {raw_events}", flush=True)

        print("[TEST] Request finished", flush=True)

        row = await fetch_latest_run_by_ticker("FAILTEST")

    print("[TEST] Lifespan closed", flush=True)

    assert row is not None
    assert row[0] == "FAILTEST"
    assert row[1] == "FAILED"
    assert row[2] == "data_agent"
    assert row[3] is None
    assert row[4] == "Mock graph failure"
    assert row[5] is not None
    assert row[6] is not None

    print("[TEST] FAILURE test passed", flush=True)


@pytest.mark.anyio
async def test_lifespan_creates_analysis_runs_table(monkeypatch):
    print("\n[TEST] START table creation test", flush=True)

    patch_lifespan_dependencies(
        monkeypatch=monkeypatch,
        fake_graph=FakeSuccessGraph(),
    )

    async with LifespanManager(app):
        print("[TEST] Lifespan started", flush=True)

        async with get_connection() as conn:
            print("[TEST] DB connection acquired", flush=True)

            async with conn.cursor() as cur:
                print("[TEST] Checking analysis_runs table existence", flush=True)

                await cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_schema = 'public'
                        AND table_name = 'analysis_runs'
                    );
                    """
                )

                row = await cur.fetchone()

    print(f"[TEST] Table exists row => {row}", flush=True)

    assert row[0] is True

    print("[TEST] TABLE creation test passed", flush=True)