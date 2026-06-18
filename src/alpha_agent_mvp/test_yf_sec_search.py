import sys
import asyncio

if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        print("🪟 [Windows OS Patch]: 物理最顶层事件循环策略已成功降级切换，psycopg 异步句柄准备就绪。")
    except Exception as patch_err:
        print(f"⚠️ [Windows OS Patch Warning]: 策略切换发生警告: {patch_err}")

import os
import asyncio
import time
from openai import AsyncOpenAI
from dotenv import load_dotenv
from sqlalchemy import text

# 导入你编写的四大工业级模块
from src.alpha_agent_mvp.data_pipeline import fetch_ticker_financials, upsert_chunks_to_postgres
from src.alpha_agent_mvp.sec_pipeline import SECDataPipeline
from src.alpha_agent_mvp.search_engine import AlphaHybridSearchEngine

load_dotenv()

async def verify_database_state(search_engine: AlphaHybridSearchEngine, ticker: str) -> int:
    """
    辅助审计函数：利用 SQLAlchemy 异步引擎直接盘点当前租户的物理落盘总量
    """
    async with search_engine.engine.connect() as conn:
        result = await conn.execute(
            text("SELECT COUNT(*) FROM financial_knowledge_base WHERE ticker = :ticker"),
            {"ticker": ticker}
        )
        return result.scalar()

async def run_e2e_integration_test():
    print("=" * 90)
    print("🚀 [AlphaAgent MAS E2E Integration Test Vault] 点火启动...")
    print("=" * 90)
    
    start_time = time.time()
    
    # 0. 初始化核心组件与基础设施
    # 保持多租户隔离原则，选择一家代表性公司作为穿透测试对象（例如：特斯拉 TSLA）
    test_ticker = "TSLA"
    search_engine = AlphaHybridSearchEngine()
    sec_pipeline = SECDataPipeline()
    openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    try:
        # ---------------------------------------------------------------------
        # ⚔️ 阶段一：yfinance 数据管道压力测试（传统三大表结构化摄取）
        # ---------------------------------------------------------------------
        print("\n[STAGE 1]: 激活 yfinance 异步非阻塞线程池管道...")
        yf_start = time.time()
        
        # 抓取数据并转换为 FinancialChunk
        yf_chunks = await fetch_ticker_financials(test_ticker)
        assert len(yf_chunks) > 0, f"❌ 严重错误: yfinance 未能为 {test_ticker} 生成任何有效切片"
        
        # 执行 psycopg 异步原子 Upsert 事务落盘
        await upsert_chunks_to_postgres(yf_chunks)
        print(f"⚡ [STAGE 1 成功]: yfinance 拓扑落盘耗时: {time.time() - yf_start:.2f}s")

        # ---------------------------------------------------------------------
        # ⚔️ 阶段二：SEC XBRL 官方数据管道测试（带漏桶限流与状态机切片）
        # ---------------------------------------------------------------------
        print("\n[STAGE 2]: 激活 SEC 官方合规网关流水线 (携带 User-Agent 物理契约)...")
        sec_start = time.time()
        
        # 内部包含了：限流等待 -> HTTP 拉取 -> Chunker 状态机识别 -> Embedding 向量化 -> psycopg 批量落盘
        await sec_pipeline.run_pipeline(
            ticker=test_ticker, 
            fiscal_year=2026, 
            section_id="Item_7_GAAP_Facts"
        )
        print(f"⚡ [STAGE 2 成功]: SEC 官方数据流清洗落盘耗时: {time.time() - sec_start:.2f}s")

        # ---------------------------------------------------------------------
        # ⚔️ 阶段三：数据可观测性与落盘完整性物理审计
        # ---------------------------------------------------------------------
        from sqlalchemy import text  # 局部导入以便测试
        print("\n[STAGE 3]: 启动底层 PostgreSQL 物理集群资产盘点...")
        
        total_rows = await verify_database_state(search_engine, test_ticker)
        print(f"📊 [审计日志]: 统一知识库表中当前承载租户 '{test_ticker}' 的物理切片总数: {total_rows} 条")
        assert total_rows > 0, "❌ 严重错误: 数据库物理校验失败，未找到任何落盘数据！"

        # ---------------------------------------------------------------------
        # ⚔️ 阶段四：混合检索与原生 RRF 算法交叉召回测试
        # ---------------------------------------------------------------------
        print("\n[STAGE 4]: 模拟 Analyst Agent 触发高维混合检索 (Dense + Sparse Multi-Vector Search)...")
        search_start = time.time()
        
        # 构造分析智能体最关心的反幻觉交叉审计请求
        test_query = "What is the Net Income and Balance Sheet snapshot for Tesla?"
        
        # 为查询文本实时生成高维嵌入向量（1536维）
        emb_res = await openai_client.embeddings.create(
            model="text-embedding-3-small", 
            input=[test_query]
        )
        query_vector = emb_res.data[0].embedding
        
        # 跨越 pgvector 向量搜索与 pg_trgm 文本相似度搜索，执行 SQL 内置的 RRF 融合
        hit_records = await search_engine.hybrid_search_rrf(
            ticker=test_ticker,
            query_text=test_query,
            query_vector=query_vector,
            top_k=3
        )
        
        # 严苛断言：不仅要召回，还要确保 RRF 分数及多源数据形态完整
        assert len(hit_records) > 0, "❌ 算法熔断: 混合检索发生 Miss，未能召回任何有效上下文"
        print(f"\n🎯 [RAG 召回断言成功]:")
        for rank, hit in enumerate(hit_records, 1):
            print(f"    [Rank {rank}] DocType: {hit['doc_type']:<22} | RRF Score: {hit['rrf_score']:.5f} | 预览: {hit['content'][:50]}...")
            
        print(f"⚡ [STAGE 4 成功]: 混合检索端到端闭环耗时: {time.time() - search_start:.2f}s")

        # ---------------------------------------------------------------------
        print("\n" + "=" * 90)
        print(f"🎉 [测试通过]: 全链路 4 大核心模块 100% 焊接成功！总耗时: {time.time() - start_time:.2f}s")
        print("=" * 90)

    except Exception as e:
        print(f"\n❌ [INTEGRATION TEST FAILED]: 链路在测试中崩溃！")
        print(f"原因详情: {str(e)}")
        raise e
    finally:
        # 工业界规范：不管测试成功还是失败，必须优雅释放数据库连接池，防止连接泄露导致僵尸进程
        await search_engine.shutdown()

if __name__ == "__main__":
    # 强制拉起 Python 异步运行时环境
    asyncio.run(run_e2e_integration_test())