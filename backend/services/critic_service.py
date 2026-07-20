from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

from backend.events import NODE_LOG


class AuditResult(BaseModel):
    is_valid: bool = Field(
        description=(
            "Indicates whether the financial report passes the audit. "
            "Set to True only if the report follows all data-availability "
            "requirements, covers required available metrics, clearly discloses "
            "missing data, and contains no unsupported claims or contradictions."
        )
    )

    feedback: str = Field(
        description=(
            "Detailed and actionable feedback when the report fails validation. "
            "Specify exactly which available metric was omitted, which limitation "
            "was not disclosed, or which claim contradicts the supplied data."
        )
    )


def build_audit_prompt(
    ticker: str,
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
        "\n".join(f"- {limitation}" for limitation in data_limitations)
        if data_limitations
        else "- No known data limitations."
    )

    cash_flow_status = data_quality.get(
        "cash_flow_statement",
        "unknown",
    )

    if cash_flow_status == "available":
        cash_flow_rule = (
            "Cash-flow data is available. The report MUST explicitly analyze "
            "Operating Cash Flow and Free Cash Flow (FCF). It must use the exact "
            "phrase 'Free Cash Flow (FCF)' and must not omit the available FCF "
            "figure or its financial significance."
        )
    elif cash_flow_status == "unavailable":
        cash_flow_rule = (
            "Cash-flow data is unavailable. Do NOT reject the report merely "
            "because it lacks an FCF value. The report must clearly disclose "
            "that Operating Cash Flow and Free Cash Flow (FCF) could not be "
            "evaluated because the source data was unavailable. Reject the "
            "report if it invents or estimates cash-flow figures."
        )
    else:
        cash_flow_rule = (
            "Cash-flow availability is unknown. Do not assume that an FCF "
            "figure exists. Verify that the report avoids unsupported cash-flow "
            "claims and clearly explains any uncertainty."
        )

    return (
        "You are the Chief Financial Audit Director. Review the financial "
        "analysis report strictly but fairly.\n\n"

        f"Target Ticker: {ticker}\n\n"

        "AUDIT PRINCIPLES:\n"
        "1. Judge the report according to the supplied data availability.\n"
        "2. Do not require a metric that is explicitly marked unavailable.\n"
        "3. If a metric is available, verify that the report analyzes it.\n"
        "4. If a metric is unavailable, verify that the limitation is disclosed.\n"
        "5. Reject unsupported figures, invented conclusions, factual "
        "contradictions, and omitted mandatory limitations.\n"
        "6. Do not reject the report only because a missing source metric "
        "cannot be analyzed.\n\n"

        f"CASH FLOW AUDIT RULE:\n{cash_flow_rule}\n\n"

        f"[DATA AVAILABILITY]\n{data_quality_text}\n\n"
        f"[REQUIRED LIMITATION DISCLOSURES]\n{limitations_text}"
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
                "message": "Audit passed. Report approved.",
            }
        ],
    }


def build_reject_result(
    feedback: str,
    critique_count: int,
) -> dict:
    return {
        "critique": feedback,
        "critique_count": critique_count + 1,
    }