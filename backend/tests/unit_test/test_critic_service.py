from backend.services.critic_service import build_audit_prompt


def test_audit_prompt_requires_fcf_when_cash_flow_available():
    prompt = build_audit_prompt(
        ticker="AAPL",
        data_quality={
            "income_statement": "available",
            "balance_sheet": "available",
            "cash_flow_statement": "available",
        },
        data_limitations=[],
    )

    assert "Cash-flow data is available" in prompt
    assert "Free Cash Flow (FCF)" in prompt
    assert "Operating Cash Flow" in prompt
    assert "MUST explicitly analyze" in prompt


def test_audit_prompt_accepts_limitation_when_cash_flow_unavailable():
    prompt = build_audit_prompt(
        ticker="TEST",
        data_quality={
            "income_statement": "available",
            "balance_sheet": "available",
            "cash_flow_statement": "unavailable",
        },
        data_limitations=[
            (
                "Cash flow statement data was unavailable from the cached "
                "sources. Operating cash flow and free cash flow could not "
                "be evaluated."
            )
        ],
    )

    assert "Cash-flow data is unavailable" in prompt
    assert "Do NOT reject the report merely because it lacks an FCF value" in prompt
    assert "could not be evaluated" in prompt
    assert "Reject the report if it invents or estimates cash-flow figures" in prompt


def test_audit_prompt_does_not_force_fcf_when_status_unknown():
    prompt = build_audit_prompt(
        ticker="TEST",
        data_quality={
            "income_statement": "available",
            "balance_sheet": "available",
            "cash_flow_statement": "unknown",
        },
        data_limitations=[],
    )

    assert "Cash-flow availability is unknown" in prompt
    assert "Do not assume that an FCF figure exists" in prompt
    assert "unsupported cash-flow claims" in prompt