import asyncio
from langgraph.graph import StateGraph, END
from .states import AgentState
from .nodes import supervisor_node, data_agent_node, analyst_agent_node, critic_node

def router_logic(state: AgentState) -> str:
    """
    Conditional edge router function.
    Parses the directive injected into 'critique' by the Supervisor Node,
    and returns the exact physical edge name for LangGraph routing.
    """
    # get state data
    directive = state.get("next_action","").lower()
    ccurrent_count = state.get("critique_count", 0)

    # prevent infinite loop
    if ccurrent_count >= 1 and "data_agent" in directive:
        # 如果你希望严格限制挂科后的重试，这里可以硬拉闸
        print("\n🚨 [LangGraph 拓扑护栏激活]: 检测到审计挂科后 Supervisor 企图无限空转 data_agent！")
        print(" └─ [战略导向]: 强行终止数据压榨，逼迫图流转至 'analyst_agent' 消化现有残缺数据。")
        return "analyst_agent" # 物理重定向，打破双向锁死

    if "data_agent" in directive:
        return "data_agent"
    elif "analyst_agent" in directive:
        return "analyst_agent"
    else:
        return "finish"

def build_alpha_graph():
    """
    Assembles the Multi-Agent topology, binds nodes, configures conditional routing, 
    and compiles it into a runnable state machine.
    """
    # 1. Initialize the Stateful Directed Acyclic Graph (DAG) with our custom schema
    workflow = StateGraph(AgentState)

    # 2. Weld nodes onto the graph canvas
    workflow.add_node("supervisor",supervisor_node)
    workflow.add_node("data_agent",data_agent_node)
    workflow.add_node("analyst_agent",analyst_agent_node)
    workflow.add_node("critic",critic_node)

    # 3. Establish the starting checkpoint of execution
    workflow.set_entry_point("supervisor")

    # 4. Standard linear edges (Once workers finish, they MUST report back to the Supervisor)
    workflow.add_edge("data_agent", "supervisor")
    workflow.add_edge("analyst_agent", "critic")
    workflow.add_edge("critic", "supervisor")
    
    # 5. Wire up the critical Conditional Edge from the Supervisor Node
    # The graph will invoke 'router_logic' to decide the path on the fly
    workflow.add_conditional_edges(
        "supervisor",
        router_logic,
        {
            "data_agent": "data_agent",
            "analyst_agent": "analyst_agent",
            "finish": END  # 'END' is LangGraph's native final sink node (__end__)
        }
    )
    
    # 6. Compile the workflow into a thread-safe executable binary
    return workflow.compile()

async def run_demo():
    """
    Execution test runner. Fires up the graph with an initial state payload.
    """
    print("🚀 [Total Graph Assembly Test]: Ignition...\n")
    app = build_alpha_graph()
    
    # Construct initial state tracking context
    initial_payload = {
        "ticker": "TSLA",
        "user_query": "Will Tsla go up or down?",
        "raw_data": [],
        "financial_report": "",
        "critique": "",
        "critique_count": 0
    }
    
    # Execute the graph asynchronously (Streaming through nodes)
    async for event in app.astream(initial_payload):
        for node_name, output in event.items():
            print(f"🎬 [System Trace]: Node '{node_name}' finished execution.")
            # If the analyst node just finished, print a snapshot of the generated report
            if "financial_report" in output and output["financial_report"]:
                print("\n================== PROSPECTUS REPORT PREVIEW ==================")
                print(output["financial_report"][:400] + "...\n[Truncated for Preview]")
                print("===============================================================\n")

if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(run_demo())