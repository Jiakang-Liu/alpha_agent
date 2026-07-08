import json
import uuid
import time

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.graph import build_alpha_graph

from backend.infrastructure import (
    open_db_pool,
    close_db_pool,
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
        f"[SERVER] graph built => {app.state.alpha_graph.__class__.__name__}",
        flush=True,
    )

    yield

    print("[SERVER] lifespan closing", flush=True)
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
    return f"data: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"


@app.post("/api/analyze")
async def analyze_ticker_stream(payload: AnalyzeRequest, request: Request):
    print("[SERVER] /api/analyze received", flush=True)

    if not payload.ticker.isalnum():
        raise HTTPException(status_code=400, detail="Invalid ticker.")

    repo = AnalysisRunRepository()
    run_id = uuid.uuid4()
    start_time = time.perf_counter()

    ticker = payload.ticker.upper()

    print(f"[SERVER] creating analysis run => {run_id}", flush=True)

    await repo.create_run(
        run_id=run_id,
        ticker=ticker,
        user_query=payload.user_query,
    )

    print("[SERVER] analysis run created", flush=True)

    async def event_generator():
        initial_state = {
            "ticker": ticker,
            "user_query": payload.user_query,
            "raw_data": [],
            "financial_report": "",
            "critique": "",
            "critique_count": 0,
            "next_action": "",
            "events": [],
        }

        final_report = ""

        try:
            print("[SERVER] SSE generator started", flush=True)

            yield sse_event({
                "type": GRAPH_START,
                "message": "AlphaAgent graph started.",
            })

            alpha_graph = request.app.state.alpha_graph

            print(
                f"[SERVER] using graph => {alpha_graph.__class__.__name__}",
                flush=True,
            )

            async for event in alpha_graph.astream(initial_state):
                print(f"[SERVER] graph event => {event}", flush=True)

                if await request.is_disconnected():
                    print("[SERVER] client disconnected", flush=True)
                    break

                for node_name, output in event.items():
                    print(f"[SERVER] node started => {node_name}", flush=True)

                    await repo.update_current_node(
                        run_id=run_id,
                        current_node=node_name,
                    )

                    yield sse_event({
                        "type": NODE_START,
                        "node": node_name,
                    })

                    for agent_event in output.get("events", []):
                        print(f"[SERVER] agent event => {agent_event}", flush=True)

                        if agent_event.get("type") == REPORT_GENERATED:
                            final_report = agent_event.get("report", "")

                        yield sse_event({
                            **agent_event,
                            "node": node_name,
                        })

                    yield sse_event({
                        "type": NODE_END,
                        "node": node_name,
                    })

                    print(f"[SERVER] node ended => {node_name}", flush=True)

            duration_ms = int((time.perf_counter() - start_time) * 1000)

            print("[SERVER] marking run success", flush=True)

            await repo.mark_success(
                run_id=run_id,
                final_report=final_report,
                duration_ms=duration_ms,
            )

            print("[SERVER] run marked success", flush=True)

            yield sse_event({
                "type": GRAPH_END,
                "message": "AlphaAgent graph finished.",
            })

            print("[SERVER] SSE generator finished", flush=True)

        except Exception as e:
            duration_ms = int((time.perf_counter() - start_time) * 1000)

            print(f"[SERVER] graph failed => {e}", flush=True)
            print("[SERVER] marking run failed", flush=True)

            await repo.mark_failed(
                run_id=run_id,
                error_message=str(e),
                duration_ms=duration_ms,
            )

            print("[SERVER] run marked failed", flush=True)

            yield sse_event({
                "type": ERROR,
                "message": str(e),
            })

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
    repo = AnalysisRunRepository()

    runs = await repo.list_runs(limit=limit)

    return {
        "runs": runs
    }