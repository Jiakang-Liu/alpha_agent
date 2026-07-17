import json
import uuid
import time

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from backend.graph import build_alpha_graph

from backend.infrastructure import (
    open_db_pool,
    close_db_pool,
    get_connection,
    SchemaInitializer,
    CIKRepository,
    AnalysisRunRepository,
)

from backend.events import (
    GRAPH_START,
    NODE_START,
    REPORT_GENERATED,
    NODE_END,
    GRAPH_END,
    ERROR,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[SERVER] lifespan start", flush=True)

    # 默认状态。只有所有启动步骤完成后，才会改为 ready。
    app.state.backend_status = "starting"
    app.state.alpha_graph = None

    try:
        await open_db_pool()
        print("[SERVER] db pool opened", flush=True)

        schema_initializer = SchemaInitializer()
        await schema_initializer.initialize()
        print("[SERVER] schema initialized", flush=True)

        cik_repository = CIKRepository()
        await cik_repository.ensure_table_exists()
        print("[SERVER] cik table ensured", flush=True)

        app.state.alpha_graph = build_alpha_graph()

        print(
            (
                "[SERVER] graph built => "
                f"{app.state.alpha_graph.__class__.__name__}"
            ),
            flush=True,
        )

        app.state.backend_status = "ready"
        print("[SERVER] backend ready", flush=True)

        yield

    except Exception as exc:
        app.state.backend_status = "unavailable"

        print(
            f"[SERVER] lifespan startup failed => {exc}",
            flush=True,
        )

        raise

    finally:
        print("[SERVER] lifespan closing", flush=True)

        app.state.backend_status = "shutting_down"

        await close_db_pool()

        print("[SERVER] db pool closed", flush=True)


app = FastAPI(
    title="AlphaAgent Full-Stack Streaming Engine",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    ticker: str
    user_query: str


def sse_event(data: dict) -> str:
    return (
        f"data: "
        f"{json.dumps(data, ensure_ascii=False, default=str)}"
        f"\n\n"
    )


@app.get("/api/health")
async def health_check(request: Request):
    """
    Lightweight health check.

    Checks:
    - FastAPI process is responding
    - Database accepts a simple query
    - AlphaGraph was initialized

    Does not call OpenAI or embedding services.
    """

    checked_at = datetime.now(timezone.utc).isoformat()

    backend_status = getattr(
        request.app.state,
        "backend_status",
        "starting",
    )

    alpha_graph = getattr(
        request.app.state,
        "alpha_graph",
        None,
    )

    graph_status = (
        "healthy"
        if alpha_graph is not None
        else "unavailable"
    )

    database_status = "unavailable"
    database_error = None

    try:
        async with get_connection() as connection:
            await connection.execute("SELECT 1")

        database_status = "healthy"

    except Exception as exc:
        database_error = str(exc)

        print(
            f"[HEALTH] database check failed => {exc}",
            flush=True,
        )

    is_healthy = (
        backend_status == "ready"
        and database_status == "healthy"
        and graph_status == "healthy"
    )

    overall_status = (
        "healthy"
        if is_healthy
        else "degraded"
    )

    response = {
        "status": overall_status,
        "backend": {
            "status": backend_status,
            "label": (
                "Ready"
                if backend_status == "ready"
                else "Unavailable"
            ),
        },
        "database": {
            "status": database_status,
            "label": (
                "Healthy"
                if database_status == "healthy"
                else "Unavailable"
            ),
        },
        "graph": {
            "status": graph_status,
            "label": (
                "Initialized"
                if graph_status == "healthy"
                else "Unavailable"
            ),
        },
        "checked_at": checked_at,
    }

    # 本地开发时方便排查，生产环境也不会暴露 traceback。
    if database_error:
        response["database"]["error"] = database_error

    status_code = 200 if is_healthy else 503

    return JSONResponse(
        content=response,
        status_code=status_code,
    )


@app.post("/api/analyze")
async def analyze_ticker_stream(
    payload: AnalyzeRequest,
    request: Request,
):
    print("[SERVER] /api/analyze received", flush=True)

    ticker = payload.ticker.strip().upper()
    user_query = payload.user_query.strip()

    if not ticker or not ticker.isalnum():
        raise HTTPException(
            status_code=400,
            detail="Invalid ticker.",
        )

    if not user_query:
        raise HTTPException(
            status_code=400,
            detail="User query is required.",
        )

    alpha_graph = getattr(
        request.app.state,
        "alpha_graph",
        None,
    )

    if alpha_graph is None:
        raise HTTPException(
            status_code=503,
            detail="Analysis graph is not ready.",
        )

    repo = AnalysisRunRepository()
    run_id = uuid.uuid4()
    start_time = time.perf_counter()

    print(
        f"[SERVER] creating analysis run => {run_id}",
        flush=True,
    )

    await repo.create_run(
        run_id=run_id,
        ticker=ticker,
        user_query=user_query,
    )

    print("[SERVER] analysis run created", flush=True)

    async def event_generator():
        initial_state = {
            "ticker": ticker,
            "user_query": user_query,
            "raw_data": [],
            "financial_report": "",
            "critique": "",
            "critique_count": 0,
            "next_action": "",
            "events": [],
        }

        final_report = ""

        try:
            print(
                "[SERVER] SSE generator started",
                flush=True,
            )

            yield sse_event(
                {
                    "type": GRAPH_START,
                    "run_id": str(run_id),
                    "message": "AlphaAgent graph started.",
                }
            )

            print(
                (
                    "[SERVER] using graph => "
                    f"{alpha_graph.__class__.__name__}"
                ),
                flush=True,
            )

            async for event in alpha_graph.astream(
                initial_state
            ):
                print(
                    f"[SERVER] graph event => {event}",
                    flush=True,
                )

                if await request.is_disconnected():
                    print(
                        "[SERVER] client disconnected",
                        flush=True,
                    )
                    break

                for node_name, output in event.items():
                    print(
                        (
                            "[SERVER] node started => "
                            f"{node_name}"
                        ),
                        flush=True,
                    )

                    await repo.update_current_node(
                        run_id=run_id,
                        current_node=node_name,
                    )

                    yield sse_event(
                        {
                            "type": NODE_START,
                            "node": node_name,
                            "run_id": str(run_id),
                        }
                    )

                    for agent_event in output.get(
                        "events",
                        [],
                    ):
                        print(
                            (
                                "[SERVER] agent event => "
                                f"{agent_event}"
                            ),
                            flush=True,
                        )

                        if (
                            agent_event.get("type")
                            == REPORT_GENERATED
                        ):
                            final_report = (
                                agent_event.get("report")
                                or agent_event.get("content")
                                or ""
                            )

                        yield sse_event(
                            {
                                **agent_event,
                                "node": node_name,
                                "run_id": str(run_id),
                            }
                        )

                    yield sse_event(
                        {
                            "type": NODE_END,
                            "node": node_name,
                            "run_id": str(run_id),
                        }
                    )

                    print(
                        (
                            "[SERVER] node ended => "
                            f"{node_name}"
                        ),
                        flush=True,
                    )

            duration_ms = int(
                (
                    time.perf_counter()
                    - start_time
                )
                * 1000
            )

            print(
                "[SERVER] marking run success",
                flush=True,
            )

            await repo.mark_success(
                run_id=run_id,
                final_report=final_report,
                duration_ms=duration_ms,
            )

            print(
                "[SERVER] run marked success",
                flush=True,
            )

            yield sse_event(
                {
                    "type": GRAPH_END,
                    "run_id": str(run_id),
                    "duration_ms": duration_ms,
                    "message": "AlphaAgent graph finished.",
                }
            )

            print(
                "[SERVER] SSE generator finished",
                flush=True,
            )

        except Exception as exc:
            duration_ms = int(
                (
                    time.perf_counter()
                    - start_time
                )
                * 1000
            )

            print(
                f"[SERVER] graph failed => {exc}",
                flush=True,
            )

            print(
                "[SERVER] marking run failed",
                flush=True,
            )

            await repo.mark_failed(
                run_id=run_id,
                error_message=str(exc),
                duration_ms=duration_ms,
            )

            print(
                "[SERVER] run marked failed",
                flush=True,
            )

            yield sse_event(
                {
                    "type": ERROR,
                    "run_id": str(run_id),
                    "duration_ms": duration_ms,
                    "message": str(exc),
                }
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/analysis-runs")
async def list_analysis_runs(limit: int = 20):
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100.",
        )

    repo = AnalysisRunRepository()
    runs = await repo.list_runs(limit=limit)

    return {
        "runs": runs,
    }