def test_build_audit_prompt():
    from backend.services.critic_service import build_audit_prompt

    result = build_audit_prompt("TSLA")

    assert "TSLA" in result
    assert "Free Cash Flow" in result
    assert "Chief Financial Audit Director" in result

def test_build_audit_prompt():
    from backend.services.critic_service import build_audit_prompt

    result = build_audit_prompt("TSLA")

    assert "TSLA" in result
    assert "Free Cash Flow" in result
    assert "Chief Financial Audit Director" in result

def test_build_reject_result():
    from backend.services.critic_service import build_reject_result

    result = build_reject_result(
        feedback="Missing FCF section",
        critique_count=1,
    )

    assert result["critique"] == "Missing FCF section"
    assert result["critique_count"] == 2

import pytest


class FakeAuditResult:
    is_valid = True
    feedback = ""


class FakeStructuredCritic:
    async def ainvoke(self, messages):
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"

        return FakeAuditResult()


class FakeChatOpenAI:
    def __init__(self, *args, **kwargs):
        pass

    def with_structured_output(self, schema):
        return FakeStructuredCritic()


@pytest.mark.anyio
async def test_run_audit(monkeypatch):
    import backend.services.critic_service as critic_service

    monkeypatch.setattr(
        critic_service,
        "ChatOpenAI",
        FakeChatOpenAI,
    )

    result = await critic_service.run_audit(
        system_prompt="audit prompt",
        report="financial report",
    )

    assert result.is_valid is True