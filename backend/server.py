import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager

from backend.graph import build_alpha_graph

from backend.infrastructure import (
    open_db_pool,
    close_db_pool,
    SchemaInitializer,
    CIKRepository,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_db_pool()

    schema_initializer = SchemaInitializer()
    await schema_initializer.initialize()

    cik_repository = CIKRepository()
    await cik_repository.ensure_table_exists()

    yield

    await close_db_pool()


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


# building graph
alpha_graph = build_alpha_graph()

# event interpreter
def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"

@app.post("/api/analyze")
async def analyze_ticker_stream(payload: AnalyzeRequest, request: Request):
    if not payload.ticker.isalnum():
        raise HTTPException(status_code=400, detail="Invalid ticker.")

    async def event_generator():
        initial_state = {
            "ticker": payload.ticker.upper(),
            "user_query": payload.user_query,
            "raw_data": [],
            "financial_report": "",
            "critique": "",
            "critique_count": 0,
            "next_action": "",
            "events": [],
        }

        try:
            yield sse_event({
                "type": "graph_start",
                "message": "AlphaAgent graph started.",
            })
            async for event in alpha_graph.astream(initial_state):
                if await request.is_disconnected():
                    print("Client disconnected.")
                    break

                for node_name, output in event.items():
                    yield sse_event({
                        "type": "node_start",
                        "node": node_name,
                    })

                    for agent_event in output.get("events", []):
                        yield sse_event({
                            **agent_event,
                            "node": node_name,
                        })

                    yield sse_event({
                        "type": "node_end",
                        "node": node_name,
                    })

            yield sse_event({
                "type": "graph_end",
                "message": "AlphaAgent graph finished.",
            })
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )