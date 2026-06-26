import asyncio
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# 导入你之前焊接好的 LangGraph 编译对象
# from .graph import build_alpha_graph 
# poetry run uvicorn src.alpha_agent_mvp.server:app --reload

app = FastAPI(title="AlphaAgent Full-Stack Streaming Engine")

# 必须配置 CORS 跨域，否则前端 React (通常在 3000 或 5173 端口) 物理脱靶无法连通
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境部署到 Vercel 时再缩窄为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    ticker: str
    user_query: str

@app.post("/api/analyze")
async def analyze_ticker_stream(payload: AnalyzeRequest, request: Request):
    """
    AlphaAgent 核心流式中枢：将 LangGraph 异步状态机转化为标准 SSE 流
    """
    async def event_generator():
        # 1. 构造初始状态 Ledger
        initial_payload = {
            "ticker": payload.ticker.upper(),
            "user_query": payload.user_query,
            "raw_data": [],
            "financial_report": "",
            "critique": "",
            "critique_count": 0
        }
        
        # 2. 模拟或调用你的 LangGraph 异步图 (此处以 Mock 骨架确保你 Day 15 快速跑通链路)
        # 实际生产中替换为: graph = build_alpha_graph()
        try:
            print(f"🚀 [SSE Engine]: Active Connection Established for {payload.ticker}")
            
            # 模拟节点流转与流式吐字的生成器逻辑 (稍后对接真实的 app.astream_events)
            # ---- 模拟节点 1: Supervisor ----
            yield f"data: {json.dumps({'type': 'node_start', 'node': 'supervisor'})}\n\n"
            await asyncio.sleep(0.8)
            yield f"data: {json.dumps({'type': 'node_log', 'message': 'Supervisor rules: Routing to data_agent to fetch balance sheet.'})}\n\n"
            
            # ---- 模拟节点 2: Data Agent ----
            yield f"data: {json.dumps({'type': 'node_start', 'node': 'data_agent'})}\n\n"
            await asyncio.sleep(1.2)
            yield f"data: {json.dumps({'type': 'node_log', 'message': 'Successfully stored 3 intelligence pieces into pgvector.'})}\n\n"
            
            # ---- 模拟节点 3: Analyst Agent Stream ----
            yield f"data: {json.dumps({'type': 'node_start', 'node': 'analyst_agent'})}\n\n"
            await asyncio.sleep(0.5)
            
            mock_report_chunks = [
                "### Tesla 2026 Financial Analysis\n\n",
                "**1. Free Cash Flow (FCF) Trend Analysis**\n",
                "Based on the retrieved SEC 10-K data, Tesla's operating cash flow ",
                "showed a resilient recovery in Q1 2026, driven by an easing of ",
                "supply chain bottlenecks in the Texas Gigafactory. \n\n",
                "**2. Capital Expenditure (CapEx) Breakdown**\n",
                "Substantial capital was deployed toward automated assembly line upgrades... "
            ]
            
            for chunk in mock_report_chunks:
                # 如果前端连接在中途关闭（例如用户关闭了浏览器），立刻切断后端，防止死烧 Token
                if await request.is_disconnected():
                    print("⚠️ [SSE Engine]: Client disconnected early. Purging task.")
                    break
                
                # 包裹成文本流事件推送
                yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
                await asyncio.sleep(0.15) # 体验极佳的打字机律动感
                
            yield f"data: {json.dumps({'type': 'graph_end', 'status': 'FINISH'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    # 声明 media_type 为 text/event-stream，这是标准的 SSE 物理契约
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/v1/analyze/stream")
async def stream_financial_analysis(request: AnalyzeRequest):
    """
    全栈 AI 金融副驾驶：高级流式对流接口
    """
    if not request.ticker.isalnum():
        raise HTTPException(status_code=400, detail="Invalid ticker architecture.")
        
    # 物理封锁：将异步生成器塞进 StreamingResponse 的常驻通道中
    return StreamingResponse(
        event_generator(ticker=request.ticker.upper(), user_query=request.user_query),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache", # 强迫网关和浏览器不准缓存，数据必须新鲜热乎
            "Connection": "keep-alive",  # 告诉 HTTP/1.1 管道：不要给老子挂断
            "X-Accel-Buffering": "no"     # 绝杀：防止 Nginx 等反向代理卡住缓存区，强制有多少吐多少
        }
    )

if __name__ == "__main__":
    import uvicorn
    # 点火启动本地后端服务
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)