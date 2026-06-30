import pytest


class FakePassAuditResult:
    is_valid = True
    feedback = ""


class FakeRejectAuditResult:
    is_valid = False
    feedback = "Missing Free Cash Flow section"


@pytest.mark.anyio
async def test_critic_node_pass(monkeypatch):
    import backend.agents.critic as critic

    async def fake_run_audit(system_prompt, report):
        return FakePassAuditResult()

    monkeypatch.setattr(
        critic,
        "run_audit",
        fake_run_audit,
    )

    state = {
        "ticker": "TSLA",
        "financial_report": "FCF is strong",
        "critique_count": 0,
    }

    result = await critic.critic_node(state)

    assert result == {
        "critique": "PASSED",
    }


@pytest.mark.anyio
async def test_critic_node_reject(monkeypatch):
    import backend.agents.critic as critic

    async def fake_run_audit(system_prompt, report):
        return FakeRejectAuditResult()

    monkeypatch.setattr(
        critic,
        "run_audit",
        fake_run_audit,
    )

    state = {
        "ticker": "TSLA",
        "financial_report": "Revenue only",
        "critique_count": 1,
    }

    result = await critic.critic_node(state)

    assert result["critique"] == "Missing Free Cash Flow section"
    assert result["critique_count"] == 2


@pytest.mark.anyio
async def test_critic_node_fail_safe(monkeypatch):
    import backend.agents.critic as critic

    async def fake_run_audit(system_prompt, report):
        raise Exception("OpenAI timeout")

    monkeypatch.setattr(
        critic,
        "run_audit",
        fake_run_audit,
    )

    state = {
        "ticker": "TSLA",
        "financial_report": "anything",
        "critique_count": 2,
    }

    result = await critic.critic_node(state)

    assert result == {
        "critique": "PASSED",
    }