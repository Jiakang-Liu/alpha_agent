import os
from openai import AsyncOpenAI
from backend.schemas import AgentState


def serialize_raw_data(raw_pieces: list[dict]) -> str:
    serialized_context = ""

    for idx, piece in enumerate(raw_pieces):
        serialized_context += (
            f"--- [Intelligence Piece #{idx + 1} from {piece['source']}] ---\n"
            f"{piece['content']}\n\n"
        )

    return serialized_context


def build_analyst_system_prompt(serialized_context: str) -> str:
    return (
        "You are a Senior Wall Street Research Analyst specializing in private aero-space secondary markets.\n"
        "Your task is to compile a highly professional financial report.\n"
        "You MUST argue strictly based on the verified intelligence context provided below. "
        "Do not invent metrics or use outside training knowledge.\n\n"
        f"[VERIFIED INTELLIGENCE CONTEXT]\n{serialized_context}"
    )


def build_analyst_user_instruction(state: AgentState) -> str:
    return (
        "Based on the context, please write a detailed financial report answering: "
        f"'{state.get('user_query')}'"
    )


async def create_financial_report(
    system_prompt: str,
    user_instruction: str,
) -> str:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    completion = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_instruction},
        ],
        temperature=0.2,
    )

    return completion.choices[0].message.content