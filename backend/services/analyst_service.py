import os
from openai import AsyncOpenAI

from backend.schemas import AgentState


def serialize_raw_data(raw_pieces: list[dict]) -> str:
    serialized_context = ""

    for idx, piece in enumerate(raw_pieces):
        serialized_context += (
            f"--- [Intelligence Piece #{idx + 1} "
            f"from {piece.get('source', 'unknown')}] ---\n"
            f"{piece.get('content', '')}\n\n"
        )

    return serialized_context


def build_analyst_system_prompt(
    serialized_context: str,
    data_quality: dict[str, str],
    data_limitations: list[str],
) -> str:
    data_quality_text = "\n".join(
        f"- {data_type}: {status}"
        for data_type, status in data_quality.items()
    )

    if not data_quality_text:
        data_quality_text = "- Data availability was not provided."

    limitations_text = (
        "\n".join(f"- {item}" for item in data_limitations)
        if data_limitations
        else "- No known data limitations."
    )

    return (
        "You are a Senior Wall Street Research Analyst specializing in "
        "private aerospace secondary markets.\n"
        "Your task is to produce a professional, evidence-based financial report.\n\n"

        "STRICT GROUNDING RULES:\n"
        "1. Use only the verified intelligence context provided below.\n"
        "2. Do not invent metrics, periods, trends, ratios, company facts, "
        "industry details, or recommendations unsupported by the context.\n"
        "3. Do not describe unavailable data as if it were available.\n"
        "4. Explicitly disclose all listed data limitations in the report.\n\n"

        "CASH FLOW RULES:\n"
        "- If cash_flow_statement is available, explicitly analyze both "
        "Operating Cash Flow and Free Cash Flow (FCF).\n"
        "- Use the exact phrase 'Free Cash Flow (FCF)' in the report.\n"
        "- If cash_flow_statement is unavailable, do not estimate or invent FCF.\n"
        "- Instead, clearly state that Operating Cash Flow and Free Cash Flow "
        "could not be evaluated because the source data was unavailable.\n\n"

        f"[DATA AVAILABILITY]\n{data_quality_text}\n\n"
        f"[MANDATORY DATA LIMITATIONS]\n{limitations_text}\n\n"
        f"[VERIFIED INTELLIGENCE CONTEXT]\n{serialized_context}"
    )


def build_analyst_user_instruction(state: AgentState) -> str:
    user_query = state.get("user_query", "")
    critique = state.get("critique", "").strip()
    existing_report = state.get("financial_report", "").strip()

    if critique and existing_report:
        return (
            "Revise the existing financial report to fully address the audit "
            "feedback below.\n\n"

            "REVISION REQUIREMENTS:\n"
            "1. Preserve all valid facts, calculations, and analysis from the "
            "existing report.\n"
            "2. Correct only the sections affected by the audit feedback.\n"
            "3. Do not omit previously valid analysis.\n"
            "4. Return the complete revised report, not a list of changes.\n"
            "5. The audit feedback is mandatory and must be explicitly resolved.\n\n"

            f"[ORIGINAL USER QUESTION]\n{user_query}\n\n"
            f"[AUDIT FEEDBACK]\n{critique}\n\n"
            f"[EXISTING REPORT]\n{existing_report}"
        )

    return (
        "Write a detailed financial report answering the following question:\n\n"
        f"{user_query}\n\n"
        "The report must follow all data availability, limitation, grounding, "
        "and cash-flow requirements from the system instructions."
    )


async def create_financial_report(
    system_prompt: str,
    user_instruction: str,
) -> str:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    completion = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_instruction,
            },
        ],
        temperature=0.1,
    )

    return completion.choices[0].message.content or ""