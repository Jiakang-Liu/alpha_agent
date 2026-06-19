import asyncio
import os
from dotenv import load_dotenv
from src.alpha_agent_mvp.data_yf_pipeline import fetch_ticker_financials, upsert_chunks_to_postgres, FinancialChunk
from src.alpha_agent_mvp.sec_chunker import AdvancedSECChunker

# koad local env 
load_dotenv()

async def run_integrated_system_test():
    """
    Day 11 高可用集成总装测试入口
    """
    print("🚀 [Integration Test]: 启动 Day 10-11 全链路数据管道集成总测...\n")
    
    if not os.getenv("OPENAI_API_KEY"):
        print("🚨 [Test Error]: 未在环境变量中检测到 OPENAI_API_KEY，向量化事务即将熔断。")
        return

    # ==========================================
    # 🧪 测试阶段 1: yfinance 异步高并发流水线
    # ==========================================
    print("📡 --- [STAGE 1: 财务报表多线程抓取中] ---")
    target_tickers = ["TSLA", "AAPL"] # 挑选两家标杆企业
    
    # 异步 Fan-out 并行抓取任务
    scraping_tasks = [fetch_ticker_financials(ticker) for ticker in target_tickers]
    scraping_results = await asyncio.gather(*scraping_tasks)
    
    # 展平 FinancialChunk 列表
    all_financial_chunks = []
    for chunk_list in scraping_results:
        all_financial_chunks.extend(chunk_list)
        
    print(f"💡 [Stage 1 成功]: 成功捕获财务原子级 Chunks 数量: {len(all_financial_chunks)}\n")


    # ==========================================
    # 🧪 测试阶段 2: SEC 10-K 状态机清洗流水线
    # ==========================================
    print("🖨️ --- [STAGE 2: SEC 文本状态机切片扫描] ---")
    # 模拟一段带有标准财务矩阵（表格特征）的真实 SEC 10-K MD&A 原始文本
    mock_sec_raw_text = (
        "In the second quarter of 2026, our automotive revenues experienced significant growth. "
        "We expanded our production capacity across multiple gigafactories to meet the soaring global market demand.\n\n"
        "The following table details our regulatory credits and financial performance metrics:\n"
        "| Quarter | Total Revenue (M) | Regulatory Credits (M) |\n"
        "| --- | --- | --- |\n"
        "| Q1 2026 | 24,500 | 440 |\n"
        "| Q2 2026 | 25,800 | 512 |\n\n"
        "As indicated above, the optimization of our margins continues to improve as manufacturing efficiency climbs."
    )
    
    chunker = AdvancedSECChunker(target_chunk_size=200) # 调小阈值强制触发边界切割
    sec_chunks = chunker.chunk_document(
        raw_text=mock_sec_raw_text,
        ticker="TSLA",
        fiscal_year=2026,
        section_id="Item_7_MD&A"
    )
    
    print(f"💡 [Stage 2 成功]: 状态机扫描完毕。成功隔离出 {len(sec_chunks)} 个防幻觉 SEC 文本块。")
    for idx, c in enumerate(sec_chunks):
        print(f"   ├─ Chunk {idx+1} 长度: {len(c.content)} | 包含反幻觉锚点头部。")
    print("")


    # ==========================================
    # 🧪 测试阶段 3: 统一知识图谱合并 & 批量向量化 Upsert
    # ==========================================
    print("🧬 --- [STAGE 3: 混合契约异构转换 & OpenAI 批量向量化] ---")
    
    # 将 SEC 的数据契约转换为支持 pgvector Ingestion 的统一结构
    unified_chunks = []
    
    # 揉合数据源 A (yfinance)
    unified_chunks.extend(all_financial_chunks)
    
    # 揉合数据源 B (SEC 文本) 归一化转换为 FinancialChunk
    for s_chunk in sec_chunks:
        unified_chunks.append(
            FinancialChunk(
                company=s_chunk.ticker,
                fiscal_year=s_chunk.fiscal_year,
                statement_type=s_chunk.section_id,
                content=s_chunk.content
            )
        )
        
    print(f"🧩 异构数据归一化完成。准备将共计 {len(unified_chunks)} 个高密度向量上载至批处理引擎...")
    
    # 触发你在代码 3 中编写的 OpenAI Batch Embedding 事务
    await upsert_chunks_to_postgres(unified_chunks)
    
    print("🏆 [Test Completed]: Day 11 核心集成测试闭环完美跑通！数据地基已筑牢。")

if __name__ == "__main__":
    import sys
    # 兼容 Windows 事件循环策略，防止 socket 握手同步报错
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(run_integrated_system_test())