from backend.schemas import AgentState
from backend.services.critic_service import (
    build_audit_prompt,
    run_audit,
    build_pass_result,
    build_reject_result,
)
from backend.events import NODE_LOG

async def critic_node(state: AgentState) -> dict:
    print("🛡️ [Critic Node]: Chief Audit Officer activated.")

    report = state.get("financial_report", "")
    print(
        "[Critic DEBUG]: financial_report exists =",
        bool(report)
    )

    print(
        "[Critic DEBUG]: financial_report length =",
        len(report)
    )

    print(
        "[Critic DEBUG]: financial_report preview =",
        repr(report[:300])
    )
    critique_count = state.get("critique_count", 0)
    ticker = state.get("ticker","")

    system_prompt = build_audit_prompt(ticker)

    try:
        audit_result = await run_audit(
            system_prompt=system_prompt,
            report=report,
        )

        print("[Critic DEBUG]: audit_result =", audit_result)
        print("[Critic DEBUG]: is_valid =", audit_result.is_valid)
        print("[Critic DEBUG]: feedback =", audit_result.feedback)

        if audit_result.is_valid:
            return build_pass_result()

        return {
            **build_reject_result(
                feedback=audit_result.feedback,
                critique_count=critique_count,
            ),
            "events": [
                {
                    "type": NODE_LOG,
                    "message": f"Audit rejected: {audit_result.feedback}"
                }
            ]
        }

    except Exception as e:
        print(f"[Critic Fail-Safe]: {e}")
        return build_pass_result()