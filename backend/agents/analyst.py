from backend.schemas import AgentState
from backend.services.analyst_service import (
    serialize_raw_data,
    build_analyst_system_prompt,
    build_analyst_user_instruction,
    create_financial_report,
)
from backend.events import NODE_LOG, REPORT_GENERATED
from langsmith import traceable


@traceable(name="Analyst Agent Node")
async def analyst_agent_node(state: AgentState) -> dict:
    print(
        "📊 [Analyst Agent Node]: "
        "Compiling gathered intelligence into official prospectus report..."
    )

    raw_pieces = state.get("raw_data", [])
    data_quality = state.get("data_quality", {})
    data_limitations = state.get("data_limitations", [])

    serialized_context = serialize_raw_data(raw_pieces)

    system_prompt = build_analyst_system_prompt(
        serialized_context=serialized_context,
        data_quality=data_quality,
        data_limitations=data_limitations,
    )

    user_instruction = build_analyst_user_instruction(state)

    report_draft = await create_financial_report(
        system_prompt=system_prompt,
        user_instruction=user_instruction,
    )

    print(
        "✅ [Analyst Agent Node]: "
        "Financial report draft successfully compiled.\n"
    )

    return {
        "financial_report": report_draft,
        "events": [
            {
                "type": NODE_LOG,
                "message": (
                    "Financial report draft successfully compiled."
                ),
            },
            {
                "type": REPORT_GENERATED,
                "content": report_draft,
            },
        ],
    }