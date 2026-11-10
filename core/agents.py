"""Base agent: a role, a versioned prompt, an output schema and an audit trail."""

from __future__ import annotations

from typing import Any

from .audit import AuditLog
from .guardrails import GuardrailViolation, validate
from .llm import LLMClient, RefusalError


class AgentFailed(RuntimeError):
    def __init__(self, agent: str, status: str, detail: str) -> None:
        super().__init__(f"{agent} {status}: {detail}")
        self.agent = agent
        self.status = status


class Agent:
    """Subclasses set the class attributes and implement ``offline``."""

    name: str = "agent"
    role: str = ""
    prompt_version: str = "v1"
    system_prompt: str = ""
    output_schema: dict[str, Any] | None = None

    def __init__(self, llm: LLMClient, audit: AuditLog) -> None:
        self.llm = llm
        self.audit = audit

    def offline(self, payload: dict[str, Any]) -> dict[str, Any]:  # pragma: no cover
        raise NotImplementedError

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        assert self.output_schema is not None, f"{self.name} has no output schema"
        base = dict(
            agent=self.name,
            role=self.role,
            prompt_version=self.prompt_version,
            input_sha256=AuditLog.fingerprint(payload),
        )
        try:
            result = self.llm.complete_json(
                system=self.system_prompt,
                payload=payload,
                schema=self.output_schema,
                offline=self.offline,
            )
        except RefusalError as e:
            self.audit.add(**base, model="-", output=None, input_tokens=0, output_tokens=0,
                           cost_usd=0.0, seconds=0.0, status="refused", notes=[str(e)])
            raise AgentFailed(self.name, "refused", str(e)) from e

        record = dict(
            **base,
            model=result.model,
            output=result.data,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            cost_usd=result.cost_usd,
            seconds=result.seconds,
        )
        try:
            validate(result.data, self.output_schema)
        except GuardrailViolation as e:
            self.audit.add(**record, status="guardrail_violation", notes=[str(e)])
            raise AgentFailed(self.name, "guardrail_violation", str(e)) from e

        self.audit.add(**record, status="ok")
        return result.data

    def note(self, text: str) -> None:
        """Attach a note to this agent's latest audit record."""
        for r in reversed(self.audit.records):
            if r.agent == self.name:
                r.notes.append(text)
                return
