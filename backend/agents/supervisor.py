import os
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from backend.schemas import AgentState

# Define a strict execution schema using Pydantic for OpenAI Strcutured Outputs
class SupervisorRouter(BaseModel):
    """
    Structured execution plan schema enforce on the LLM router output
    """
    next_action: str = Field(
        description="The next execution node to route to. Options: 'data_agent', 'analyst_agent', or 'FINISH'."
    )
    reasoning: str = Field(
        description="A professional rationale behind this routing decision based on the current context ledger."
    )


async def supervisor_node(state: AgentState) -> dict:
    """
    The orchestrator brain of the graph topology.
    Analyzes the current state and routes execution dynamically.
    """
    # Initialize the asynchronous client inside the node
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Pull current status from ledger 
    has_data = len(state.get("raw_data",[]))
    has_report = bool(state.get("financial_report",""))
    critique_count = state.get("critique_count",0)
    critique = state.get("critique","")

    # Build a powerful system prompt to turn GPT-4o into a cold, efficient Project Manager
    system_prompt = (
        "You are the Lead Investment Director managing an advanced financial analyst squad.\n"
        "Your sole task is to inspect the current state ledger and declare the next optimal step. \n\n"
        f"[CURRENT STATE LEDGER]\n"
        f"- Target Ticker: {state.get('ticker')}\n"
        f"- User Focus: {state.get('user_query')}\n"
        f"- Gathered Raw Data Pcs: {has_data}\n"
        f"- Draft Report Exits: {has_report}\n"
        f"- Historical Audit Rejected: {critique_count}\n"
        f"- Latest Audit Feedback: {critique}\n\n"
        "[ROUTING PROTOCOLS]\n"
        "1. If 'raw_data' is completely empty, you MUST route to 'data_agent' first tp retroeve foundational metrics.\n "
        "2. If 'raw_data' is populated but 'financial_report is missing, you MUST route to 'analyst_agent' to compile the report.\n"
        "3. If 'financial_report' exists and there are no active rejection notes in 'critique', route to 'FINISH'.\n"
        "4. If 'critique_count' reaches 3, execute circuit-breaker and force route to 'FINISH' to prevent loop overburn."
    )

    # Invoke OpenAI with strict JSON Schema tracking 
    completion = await client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Analyze the state ledger and provide the next step schema."}   
        ],
        response_format=SupervisorRouter, # force output as JSON schema defined above
        temperature = 0.0
    )

    # Parse the verified structured output 
    router_decision = completion.choices[0].message.parsed
    print(f"\n[Supervisor Node Decision]: Next -> {router_decision.next_action}")
    print(f"[Reasoning]: {router_decision.reasoning}\n")

    # Return an incremental state dict. 
    # We will use this 'next_action' later in our conditional edges to route the graph.
    return {"next_action":router_decision.next_action}