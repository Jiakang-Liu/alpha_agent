from backend.schemas import AgentState
from backend.events import NODE_LOG


async def supervisor_node(state: AgentState) -> dict:
    has_data = len(state.get("raw_data", []))
    has_report = bool(state.get("financial_report", ""))
    critique_count = state.get("critique_count", 0)
    critique = state.get("critique", "")

    if critique_count >= 3:
        next_action = "FINISH"
        reasoning = "Circuit breaker triggered after 3 audit rejections."

    elif not has_data:
        next_action = "data_agent"
        reasoning = "No raw data found. Route to data_agent."

    elif not has_report:
        next_action = "analyst_agent"
        reasoning = "Raw data exists but financial report is missing. Route to analyst_agent."

    elif critique:
        next_action = "analyst_agent"
        reasoning = "Audit critique exists. Route back to analyst_agent for revision."

    else:
        next_action = "FINISH"
        reasoning = "Financial report exists and no active critique remains. Finish."

    print(f"\n[Supervisor Node Decision]: Next -> {next_action}")
    print(f"[Reasoning]: {reasoning}\n")

    return {
        "next_action": next_action,
        "events": [
            {
                "type": NODE_LOG,
                "message": f"Supervisor decided next step: {next_action}",
            },
            {
                "type": NODE_LOG,
                "message": reasoning,
            },
        ],
    }