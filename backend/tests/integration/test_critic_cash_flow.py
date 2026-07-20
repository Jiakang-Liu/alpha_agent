import pytest

from backend.services.critic_service import (
    build_audit_prompt,
    run_audit,
)


@pytest.mark.asyncio
async def test_report_passes_when_cash_flow_available_and_fcf_is_analyzed():
    system_prompt = build_audit_prompt(
        ticker="TEST",
        data_quality={
            "income_statement": "available",
            "balance_sheet": "available",
            "cash_flow_statement": "available",
        },
        data_limitations=[],
    )

    report = """
    # Financial Analysis Report

    ## Cash Flow Analysis

    Operating Cash Flow was negative at $10 million.

    Free Cash Flow (FCF) was negative at $15 million, indicating that
    the company did not generate enough operating cash to cover its
    capital expenditures.
    """

    result = await run_audit(
        system_prompt=system_prompt,
        report=report,
    )

    assert result.is_valid is True


@pytest.mark.asyncio
async def test_report_fails_when_cash_flow_available_but_fcf_is_missing():
    system_prompt = build_audit_prompt(
        ticker="TEST",
        data_quality={
            "income_statement": "available",
            "balance_sheet": "available",
            "cash_flow_statement": "available",
        },
        data_limitations=[],
    )

    report = """
    # Financial Analysis Report

    ## Cash Flow Analysis

    Operating Cash Flow was negative at $10 million.
    The company depended on financing activities to support operations.
    """

    result = await run_audit(
        system_prompt=system_prompt,
        report=report,
    )

    assert result.is_valid is False
    assert "free cash flow" in result.feedback.lower()


@pytest.mark.asyncio
async def test_report_passes_when_cash_flow_unavailable_and_limitation_disclosed():
    system_prompt = build_audit_prompt(
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

    report = """
    # Financial Analysis Report

    ## Cash Flow Analysis

    Cash flow statement data was unavailable from the retrieved sources.
    Therefore, Operating Cash Flow and Free Cash Flow (FCF) could not be
    evaluated. No conclusions about the company's cash-generation capacity
    are presented.
    """

    result = await run_audit(
        system_prompt=system_prompt,
        report=report,
    )

    assert result.is_valid is True


@pytest.mark.asyncio
async def test_report_fails_when_cash_flow_unavailable_but_fcf_is_invented():
    system_prompt = build_audit_prompt(
        ticker="TEST",
        data_quality={
            "income_statement": "available",
            "balance_sheet": "available",
            "cash_flow_statement": "unavailable",
        },
        data_limitations=[
            "Cash flow statement data was unavailable."
        ],
    )

    report = """
    # Financial Analysis Report

    ## Cash Flow Analysis

    Free Cash Flow (FCF) was approximately $25 million, demonstrating
    strong cash generation.
    """

    result = await run_audit(
        system_prompt=system_prompt,
        report=report,
    )

    assert result.is_valid is False