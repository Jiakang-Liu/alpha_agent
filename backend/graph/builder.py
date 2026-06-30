import asyncio
from langgraph.graph import StateGraph, END
from backend.schemas import AgentState
from backend.agents import supervisor_node, data_agent_node, analyst_agent_node, critic_node
from .router import router_logic

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