"""Score a triage run against the hand-labeled golden set."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from core.evals import accuracy, prf

from .pipeline import DATA, TriageResult


def load_golden(path: Path | None = None) -> dict[str, Any]:
    return json.loads((path or DATA / "golden_set.json").read_text())


def score(result: TriageResult, golden: dict[str, Any]) -> dict[str, Any]:
    gold = {g["section"]: g for g in golden["obligations"]}
    got = {i["section"]: i for i in result.items}

    detection = prf(set(got), set(gold))
    mapping = prf(
        {(s, c) for s, i in got.items() for c in i["control_ids"]},
        {(s, c) for s, g in gold.items() for c in g["controls"]},
    )
    gap_pairs = [(got[s]["final_gap"] if s in got else "missed", g["gap"]) for s, g in gold.items()]
    full_gaps = [s for s, g in gold.items() if g["gap"] == "full"]
    caught_full = [s for s in full_gaps if s in got and got[s]["final_gap"] == "full"]
    real_gaps = [s for s, g in gold.items() if g["gap"] != "none"]
    missed_gaps = [s for s in real_gaps if s in got and got[s]["final_gap"] == "none" and got[s]["route"] == "auto_accept"]

    return {
        "obligation_detection": detection.as_dict(),
        "control_mapping": mapping.as_dict(),
        "gap_accuracy": round(accuracy(gap_pairs), 3),
        "full_gaps_caught": f"{len(caught_full)}/{len(full_gaps)}",
        "real_gaps_auto_accepted": missed_gaps,
        "routed_to_human": sum(1 for i in result.items if i["route"] == "human_review"),
        "obligations": len(result.items),
        "cost_usd": round(result.audit.total_cost_usd, 4),
        "model_seconds": round(result.audit.total_seconds, 2),
        "guardrail_warnings": len(result.warnings),
    }
