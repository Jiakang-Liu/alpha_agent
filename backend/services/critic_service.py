from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from backend.events import NODE_LOG

class AuditResult(BaseModel):
    is_valid: bool = Field(
        description=(
            "Indicates whether the financial report passes the audit. "
            "Set to True ONLY if all required metrics are covered and no data contradictions exist."
        )
    )

    feedback: str = Field(
        description=(
            "Detailed critique and actionable feedback if the report fails validation. "
            "Specify exactly which metrics are missing or which figures present discrepancies."
        )
    )


def build_audit_prompt(ticker: str) -> str:
    return (
        "You are the Chief Financial Audit Director. Review the analysis report strictly.\n"
        f"Target Ticker: {ticker}\n"
        "Mandate: The report MUST explicitly include 'Free Cash Flow (FCF)'. "
        "If missing, reject it."
    )


async def run_audit(
    system_prompt: str,
    report: str,
) -> AuditResult:
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.0,
    )

    structured_critic = llm.with_structured_output(AuditResult)

    return await structured_critic.ainvoke(
        [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": f"Draft:\n\n{report}",
            },
        ]
    )


def build_pass_result() -> dict:
    return {
        "critique": "",
        "events": [
            {
                "type": NODE_LOG,
                "message": "Audit passed. Report approved."
            }
        ]
    }

def build_reject_result(
    feedback: str,
    critique_count: int,
) -> dict:
    return {
        "critique": feedback,
        "critique_count": critique_count + 1,
    }