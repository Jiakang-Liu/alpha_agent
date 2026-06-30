from backend.schemas import AgentState
from backend.services.critic_service import (
    build_audit_prompt,
    run_audit,
    build_pass_result,
    build_reject_result,
)


async def critic_node(state: AgentState) -> dict:
    print("🛡️ [Critic Node]: Chief Audit Officer activated.")

    report = state.get("financial_report", "")
    critique_count = state.get("critique_count", 0)
    ticker = state.get("ticker", "TSLA")

    system_prompt = build_audit_prompt(ticker)

    try:
        audit_result = await run_audit(
            system_prompt=system_prompt,
            report=report,
        )

        if audit_result.is_valid:
            return build_pass_result()

        return build_reject_result(
            feedback=audit_result.feedback,
            critique_count=critique_count,
        )

    except Exception as e:
        print(f"[Critic Fail-Safe]: {e}")
        return build_pass_result()