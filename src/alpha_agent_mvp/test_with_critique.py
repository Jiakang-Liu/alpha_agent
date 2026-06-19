import asyncio
import sys
from .graph_builder import build_alpha_graph

async def simulate_scenario(scenario_name: str, initial_payload: dict):
    print(f"\n" + "="*20 + f" 🎬 正在激活场景：{scenario_name} " + "="*20)
    
    # 编译并提取状态机实例
    app = build_alpha_graph()
    
    # 异步流式传输节点状态快照
    async for event in app.astream(initial_payload):
        for node_name, output in event.items():
            print(f"\n🎬 [拓扑网追踪]: 节点 '{node_name}' 运行结束。")
            
            # 实时捕获全局状态 Ledger 变更快照
            if "next_step" in output:
                print(f" └─ [主管意图] 决定指派下一步 -> {output['next_step']}")
            if "raw_data" in output:
                print(f" └─ [数据仓库] 新增拉取了 {len(output['raw_data'])} 条财务切片")
            if "financial_report" in output:
                print(f" └─ [分析报告] 产出预览: {output['financial_report'][:60]}...")
            if "critique" in output:
                print(f" └─ [审计反馈] CAO 意见 -> {output['critique']}")
            if "critique_count" in output:
                print(f" └─ [熔断计数] 当前失败次数 -> {output['critique_count']}/3")
                
    print("="*20 + f" 🏁 场景：{scenario_name} 执行完毕 " + "="*20 + "\n")

async def run_all_tests():
    print("🚀 [AlphaAgent 多智能体拓扑网]: 全链路压测点火启动...\n")
    
    # --- 场景 1：冷启动冷冷链路（初始库中完全没有原始数据） ---
    # 预期表现：Supervisor 发现 raw_data 为空 -> 指派 data_agent_node ->
    #          数据爬完回到 Supervisor -> 发现有数据没报告 -> 指派 analyst_agent_node ->
    #          分析师写完强制去 critic_node 审计。
    # payload_cold_start = {
    #     "ticker": "TSLA",
    #     "user_query": "特斯拉 2026 年的自由现金流 (FCF) 变动趋势如何？",
    #     "raw_data": [],            # 空数据
    #     "financial_report": "",    # 空报告
    #     "critique": "",
    #     "critique_count": 0
    # }
    # await simulate_scenario("冷启动全链路生命周期测试", payload_cold_start)

    # --- 场景 2：自纠错与熔断机制测试（模拟分析师多次不及格） ---
    # 为了测试你的主管节点和自纠错，我们直接注入一个“已经写好但漏掉了自由现金流”的残废报告
    # 预期表现：critic_node 捕获缺失 -> 拒绝通过，critique_count 加 1 -> 回报主管 ->
    #          主管命令 analyst_agent 针对 critique 意见进行精准重写
    # payload_audit_fail = {
    #     "ticker": "NVDA",
    #     "user_query": "Nvidia 财务健康度审计报告",
    #     "raw_data": [{"source": "PostgreSQL_Vector_Cluster", "content": "Nvidia 2026年营收大涨，但该段纯文本里我们故意隐去了 Free Cash Flow 数据。"}],
    #     "financial_report": "这是分析师写的第一版草稿：Nvidia 表现很好，利润很高，完毕。", # 漏掉了 FCF
    #     "critique": "",
    #     "critique_count": 0
    # }
    # await simulate_scenario("审计挂科 -> 触发大模型自纠错循环测试", payload_audit_fail)
    
    # --- 场景 3：自纠错与熔断机制测试（标准工业级改法） ---
    # 预期表现：raw_data为空 -> 逼迫 Supervisor 先路由到 data_agent 去把你 Adminer 里的 NVDA 2026 数据捞出来
    #          -> 然后流转到 analyst_agent，此时我们塞入了一个人为捏造的残缺 financial_report
    #          -> 流转到 critic，发现报告没提及 FCF -> 打回自纠错重写！

    payload_audit_fail = {
        "ticker": "NVDA",
        "user_query": "Nvidia 财务健康度审计报告，重点分析2026年自由现金流(FCF)。",
        
        "raw_data": [],  # 物理清空！必须要为空！强迫 Supervisor 激活 data_agent 触发真实数据库检索！
        
        # 我们在这里注入一个垃圾报告，引诱 Critic 节点判定挂科，从而完美测试自纠错循环
        "financial_report": "【人工注入残缺草稿】英伟达2026年AI芯片卖得很好，业绩大涨，完毕。", 
        
        "critique": "",
        "critique_count": 0
    }
    await simulate_scenario("审计挂科 -> 触发大模型自纠错循环测试", payload_audit_fail)

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_all_tests())