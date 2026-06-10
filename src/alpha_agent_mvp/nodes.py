import os
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from .states import AgentState
from .main_rag import query_vector_db, get_embedding

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
    has_data = len(state.get("raw_data",[])) > 0 
    has_report = bool(state.get("financial_report",""))
    critique_count = state.get("critique_count",0)

    # Build a powerful system prompt to turn GPT-4o into a cold, efficient Project Manager
    system_prompt = (
        "You are the Lead Investment Director managing an advanced financial analyst squad.\n"
        "Your sole task is to inspect the current state ledger and declare the next optimal step. \n\n"
        f"[CURRENT STATE LEDGER]\n"
        f"- Target Ticker: {state.get('ticker')}\n"
        f"- User Focus: {state.get('user_query')}\n"
        f"- Gathered Raw Data Pcs: {len(state.get('raw_data',[]))}\n"
        f"- Draft Report Exits: {has_report}\n"
        f"- Historical Audit Rejected: {critique_count}\n\n"
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
    return {"critique": f"Route decided by Supervisor: {router_decision.next_action}"}

async def data_agent_node(state: AgentState) -> dict:
    """
    The Data Gathering Agent. Converts user focus area into embeddings,
    queries the local PostgreSQL (pgvector) cluster, and appends the
    raw financial/technical intelligence to the global state ledger.
    """
    print("[Data Agent Node]: Initiating database intelligence scanning...")

    # Initialize OpenAI asynchronous client inside the data node 
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Step 1: Extract the core focus area from ledger
    user_query = state.get("user_query")

    # Step 2: Convert query and fetch top-3 records
    query_vector = await get_embedding(client, user_query)
    fetched_contexts = await query_vector_db(query_vector, top_k=3)

    # Step 3: Package the fetched raw strings into structured dictionary pieces
    mined_intelligence = []
    for chunk in fetched_contexts:
        mined_intelligence.append({
            "source":"PostgreSQL_Vector_Cluster",
            "content": chunk
        })

    print(f"✅ [Data Agent Node]: Successfully stored {len(mined_intelligence)} intelligence pieces into state ledger.\n")

    # Return incremental state dict. 
    # This list will be seamlessly merged without wiping out previous records.
    return {"raw_data": mined_intelligence}

async def analyst_agent_node(state: AgentState) -> dict:
    """
    The Financial Analyst Agent. Extracts all accumulated raw data pieces 
    from the ledger and compiles a professional-grade Markdown investment report.
    """
    print("📊 [Analyst Agent Node]: Compiling gathered intelligence into official prospectus report...")
    
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Step 1: Extract and serialize all pieces from the raw_data ledger
    raw_pieces = state.get("raw_data", [])
    serialized_context = ""
    for idx, piece in enumerate(raw_pieces):
        serialized_context += f"--- [Intelligence Piece #{idx+1} from {piece['source']}] ---\n{piece['content']}\n\n"
        
    # Step 2: Establish strict system protocol to eliminate hallucinations
    system_prompt = (
        "You are a Senior Wall Street Research Analyst specializing in private aero-space secondary markets.\n"
        "Your task is to compile a highly professional financial.\n"
        "You MUST argue strictly based on the verified intelligence context provided below. "
        "Do not invent metrics or use outside training knowledge.\n\n"
        f"[VERIFIED INTELLIGENCE CONTEXT]\n{serialized_context}"
    )
    
    user_instruction = f"Based on the context, please write a detailed financial report answering: '{state.get('user_query')}'"
    
    # Step 3: Invoke GPT-4o to write the detailed draft (Non-stream here for total state recording)
    completion = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_instruction}
        ],
        temperature=0.2 
    )
    
    report_draft = completion.choices[0].message.content
    print("✅ [Analyst Agent Node]: Financial report draft successfully compiled.\n")
    
    # Update the global ledger with the compiled report
    return {"financial_report": report_draft}