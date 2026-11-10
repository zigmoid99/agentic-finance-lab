"""Model clients.

Two backends share one interface:

- ``ClaudeClient`` calls Claude through the official Anthropic SDK and asks for
  JSON that matches a schema (structured outputs).
- ``OfflineClient`` runs a deterministic stand-in that each agent supplies. It
  needs no key and no network, so the pipeline, tests and evals always run.
  Its scores are the "keyword baseline" that the agents have to beat.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Protocol

DEFAULT_MODEL = "claude-opus-5-5"

# US dollars per million tokens (input, output). Update when pricing changes.
PRICES_PER_MTOK: dict[str, tuple[float, float]] = {
    "claude-opus-5-5": (4.00, 20.00),
    "claude-sonnet-5-5": (2.00, 10.00),
    "claude-haiku-5-5": (0.10, 0.50),
}

OfflineFn = Callable[[dict[str, Any]], dict[str, Any]]


class RefusalError(RuntimeError):
    """The model declined the request. The pipeline routes the step to a human."""


@dataclass
class LLMResult:
    data: dict[str, Any]
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    seconds: float = 0.0
    request_id: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)

    @property
    def cost_usd(self) -> float:
        price = PRICES_PER_MTOK.get(self.model)
        if not price:
            return 0.0
        return (self.input_tokens * price[0] + self.output_tokens * price[1]) / 1_000_000


class LLMClient(Protocol):
    name: str

    def complete_json(
        self,
        *,
        system: str,
        payload: dict[str, Any],
        schema: dict[str, Any],
        offline: OfflineFn,
    ) -> LLMResult: ...


class OfflineClient:
    """Deterministic backend. Calls the agent's own offline function."""

    name = "offline"

    def complete_json(self, *, system, payload, schema, offline) -> LLMResult:
        start = time.perf_counter()
        data = offline(payload)
        return LLMResult(data=data, model="offline", seconds=time.perf_counter() - start)


class ClaudeClient:
    """Claude via the Anthropic SDK, with schema-constrained JSON output.

    Server-side refusal fallbacks are on by default (``fallbacks="default"``),
    so a policy decline is retried on a fallback model inside the same call.
    A refusal from the whole chain raises ``RefusalError``.
    """

    name = "claude"

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        effort: str = "medium",
        max_tokens: int = 16000,
        client: Any | None = None,
    ) -> None:
        if client is None:
            import anthropic  # imported lazily so the offline path needs no SDK

            client = anthropic.Anthropic()
        self.client = client
        self.model = model
        self.effort = effort
        self.max_tokens = max_tokens

    def complete_json(self, *, system, payload, schema, offline) -> LLMResult:
        start = time.perf_counter()
        response = self.client.beta.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            system=system,
            output_config={
                "effort": self.effort,
                "format": {"type": "json_schema", "schema": schema},
            },
            messages=[{"role": "user", "content": json.dumps(payload, indent=2)}],
        )
        if response.stop_reason == "refusal":
            raise RefusalError(f"model declined (request {getattr(response, '_request_id', None)})")
        if response.stop_reason == "max_tokens":
            raise RuntimeError("output hit max_tokens before the JSON was complete")
        text = next(b.text for b in response.content if b.type == "text")
        usage = response.usage
        return LLMResult(
            data=json.loads(text),
            model=getattr(response, "model", self.model),
            input_tokens=getattr(usage, "input_tokens", 0) or 0,
            output_tokens=getattr(usage, "output_tokens", 0) or 0,
            seconds=time.perf_counter() - start,
            request_id=getattr(response, "_request_id", None),
        )


def make_client(backend: str, **kwargs: Any) -> LLMClient:
    if backend == "offline":
        return OfflineClient()
    if backend == "claude":
        return ClaudeClient(**kwargs)
    raise ValueError(f"unknown backend: {backend!r} (use 'offline' or 'claude')")
