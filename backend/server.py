import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager

from .previous_files.graph_builder import build_alpha_graph

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
    await cik_repository.initialize()

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
            "next_action": ""
        }

        try:
            yield f"data: {json.dumps({'type': 'graph_start', 'ticker': payload.ticker.upper()})}\n\n"

            async for event in alpha_graph.astream(initial_state):
                if await request.is_disconnected():
                    print("Client disconnected.")
                    break

                for node_name, output in event.items():
                    yield f"data: {json.dumps({'type': 'node_end', 'node': node_name})}\n\n"

                    if output.get("raw_data"):
                        yield f"data: {json.dumps({'type': 'node_log', 'message': 'Market data loaded.'})}\n\n"

                    if output.get("financial_report"):
                        yield f"data: {json.dumps({'type': 'token', 'content': output['financial_report']})}\n\n"

                    if output.get("critique"):
                        yield f"data: {json.dumps({'type': 'node_log', 'message': output['critique']})}\n\n"

            yield f"data: {json.dumps({'type': 'graph_end', 'status': 'FINISH'})}\n\n"

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