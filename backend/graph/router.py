from backend.schemas import AgentState

def router_logic(state: AgentState) -> str:
    """
    Conditional edge router function.
    Parses the directive injected into 'critique' by the Supervisor Node,
    and returns the exact physical edge name for LangGraph routing.
    """
    # get state data
    directive = state.get("next_action","").lower()
    current_count = state.get("critique_count", 0)

    # prevent infinite loop
    if current_count >= 1 and "data_agent" in directive:
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