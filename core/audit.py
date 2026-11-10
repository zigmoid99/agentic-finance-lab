"""Audit trail: every agent step, written down so an examiner could follow it."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class AuditRecord:
    step: int
    agent: str
    role: str
    prompt_version: str
    model: str
    input_sha256: str
    output: Any
    input_tokens: int
    output_tokens: int
    cost_usd: float
    seconds: float
    status: str  # "ok", "guardrail_violation", "refused", "error"
    notes: list[str] = field(default_factory=list)
    at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AuditLog:
    def __init__(self, run_id: str) -> None:
        self.run_id = run_id
        self.records: list[AuditRecord] = []

    @staticmethod
    def fingerprint(payload: Any) -> str:
        blob = json.dumps(payload, sort_keys=True, default=str).encode()
        return hashlib.sha256(blob).hexdigest()

    def add(self, **kwargs: Any) -> AuditRecord:
        record = AuditRecord(step=len(self.records) + 1, **kwargs)
        self.records.append(record)
        return record

    @property
    def total_cost_usd(self) -> float:
        return sum(r.cost_usd for r in self.records)

    @property
    def total_seconds(self) -> float:
        return sum(r.seconds for r in self.records)

    def write_jsonl(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w") as f:
            for r in self.records:
                f.write(json.dumps({"run_id": self.run_id, **asdict(r)}, default=str) + "\n")

    def evidence_pack(self) -> str:
        """A plain-language summary of who did what, in order."""
        lines = [
            f"# Evidence pack: run {self.run_id}",
            "",
            "| Step | Agent | Prompt | Model | Status | Tokens in/out | Cost | Seconds |",
            "|---|---|---|---|---|---|---|---|",
        ]
        for r in self.records:
            lines.append(
                f"| {r.step} | {r.agent} | {r.prompt_version} | {r.model} | {r.status} | "
                f"{r.input_tokens}/{r.output_tokens} | ${r.cost_usd:.4f} | {r.seconds:.2f} |"
            )
        lines += ["", f"Total cost: ${self.total_cost_usd:.4f}. Total model time: {self.total_seconds:.1f}s."]
        notes = [(r.step, n) for r in self.records for n in r.notes]
        if notes:
            lines += ["", "## Notes raised during the run", ""]
            lines += [f"- Step {step}: {note}" for step, note in notes]
        return "\n".join(lines) + "\n"
