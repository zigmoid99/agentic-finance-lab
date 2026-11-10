"""Regulatory change triage: rule in, impact memo out.

    reader -> mapper -> gap analyst -> challenger -> routing policy -> supervisor

Routing is code, not a model. An item is auto-accepted only when the gap call
is "none", the challenger agrees and the mapper is confident. Everything else
goes to a person. Disagreements take the more severe of the two calls.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from core.agents import AgentFailed
from core.audit import AuditLog
from core.guardrails import check_references
from core.llm import LLMClient

from .agents import GAP, SEVERITY, ChallengerAgent, GapAnalystAgent, MapperAgent, ReaderAgent, SupervisorAgent
from .text import parse_sections

DATA = Path(__file__).parent / "data"
CONFIDENCE_FLOOR = 0.6


@dataclass
class TriageResult:
    run_id: str
    rule_title: str
    obligations: list[dict[str, Any]]
    items: list[dict[str, Any]]
    summary: str
    top_actions: list[str]
    audit: AuditLog
    warnings: list[str] = field(default_factory=list)


def load_controls(path: Path | None = None) -> list[dict[str, str]]:
    return json.loads((path or DATA / "controls.json").read_text())


def run_triage(rule_markdown: str, controls: list[dict[str, str]], llm: LLMClient) -> TriageResult:
    run_id = uuid.uuid4().hex[:8]
    audit = AuditLog(run_id)
    warnings: list[str] = []
    control_ids = {c["id"] for c in controls}
    by_id = {c["id"]: c for c in controls}

    title = next((line.lstrip("# ").strip() for line in rule_markdown.splitlines() if line.startswith("# ")), "Untitled rule")
    sections = parse_sections(rule_markdown)
    if not sections:
        raise ValueError("No sections found. Mark each section as '### § N Heading'.")
    section_ids = {s["section"] for s in sections}

    # 1. Reader
    reader = ReaderAgent(llm, audit)
    obligations = reader.run({"rule_title": title, "sections": sections})["obligations"]
    kept = []
    for ob in obligations:
        if ob["section"] not in section_ids:
            msg = f"Dropped obligation {ob['id']}: cites § {ob['section']}, which is not in the rule."
            reader.note(msg)
            warnings.append(msg)
            continue
        kept.append(ob)
    obligations = kept

    # 2. Mapper
    mapper = MapperAgent(llm, audit)
    raw = mapper.run({"obligations": obligations, "controls": controls})["mappings"]
    mappings: dict[str, dict[str, Any]] = {}
    for m in raw:
        invented = check_references(m["control_ids"], control_ids, "control")
        if invented:
            msg = f"Removed invented control ids {invented} from {m['obligation_id']}."
            mapper.note(msg)
            warnings.append(msg)
            m["control_ids"] = [c for c in m["control_ids"] if c in control_ids]
        m["confidence"] = max(0.0, min(1.0, float(m["confidence"])))
        mappings[m["obligation_id"]] = m
    for ob in obligations:
        mappings.setdefault(ob["id"], {"obligation_id": ob["id"], "control_ids": [], "confidence": 0.0,
                                       "rationale": "mapper returned nothing"})

    mapped_controls = [by_id[c] for c in sorted({c for m in mappings.values() for c in m["control_ids"]})]

    # 3. Gap analyst
    gap = GapAnalystAgent(llm, audit)
    assessments = {a["obligation_id"]: a for a in gap.run(
        {"obligations": obligations, "mappings": mappings, "controls": mapped_controls})["assessments"]}

    # 4. Challenger sees the mapping and the gap call, but not the mapper's rationale.
    challenger = ChallengerAgent(llm, audit)
    blind = {k: {"obligation_id": k, "control_ids": v["control_ids"]} for k, v in mappings.items()}
    challenges = {c["obligation_id"]: c for c in challenger.run({
        "obligations": obligations, "mappings": blind, "controls": mapped_controls,
        "assessments": list(assessments.values()),
    })["challenges"]}

    # 5. Routing policy
    items = []
    for ob in obligations:
        m = mappings[ob["id"]]
        a = assessments.get(ob["id"])
        c = challenges.get(ob["id"])
        reasons = []
        if a is None:
            a = {"gap": "full", "severity": "high", "finding": "Gap analyst returned no assessment.",
                 "recommended_action": "Assess manually."}
            reasons.append("no assessment")
        final_gap = a["gap"]
        if c and not c["agrees"]:
            final_gap = GAP[max(GAP.index(a["gap"]), GAP.index(c["suggested_gap"]))]
            reasons.append(f"challenger disagrees: {c['issue']}")
        if m["confidence"] < CONFIDENCE_FLOOR:
            reasons.append(f"mapping confidence {m['confidence']:.2f} below {CONFIDENCE_FLOOR}")
        if final_gap != "none":
            reasons.append(f"{final_gap} gap needs an owner")
        items.append({
            "obligation_id": ob["id"],
            "section": ob["section"],
            "obligation": ob["text"],
            "control_ids": m["control_ids"],
            "confidence": m["confidence"],
            "final_gap": final_gap,
            "severity": SEVERITY[max(SEVERITY.index(a["severity"]), GAP.index(final_gap))],
            "finding": a["finding"],
            "recommended_action": a["recommended_action"],
            "challenge": c["issue"] if c and not c["agrees"] else "",
            "route": "human_review" if reasons else "auto_accept",
            "reasons": reasons,
        })

    # 6. Supervisor
    supervisor = SupervisorAgent(llm, audit)
    try:
        memo = supervisor.run({"rule_title": title, "items": items})
    except AgentFailed as e:
        warnings.append(f"Supervisor failed ({e.status}); memo has no summary.")
        memo = {"summary": "Summary unavailable. Review the items below.", "top_actions": []}

    return TriageResult(run_id, title, obligations, items, memo["summary"], memo["top_actions"], audit, warnings)


def render_memo(result: TriageResult) -> str:
    lines = [
        f"# Impact memo: {result.rule_title}",
        "",
        f"Run `{result.run_id}`. Draft for human approval. Not a final compliance determination.",
        "",
        "## Summary",
        "",
        result.summary,
        "",
    ]
    if result.top_actions:
        lines += ["## Top actions", ""] + [f"{i}. {a}" for i, a in enumerate(result.top_actions, 1)] + [""]
    lines += [
        "## Obligations",
        "",
        "| § | Controls | Gap | Severity | Route | Finding |",
        "|---|---|---|---|---|---|",
    ]
    for i in result.items:
        controls = ", ".join(i["control_ids"]) or "none"
        lines.append(f"| {i['section']} | {controls} | {i['final_gap']} | {i['severity']} | "
                     f"{i['route'].replace('_', ' ')} | {i['finding']} |")
    review = [i for i in result.items if i["route"] == "human_review"]
    if review:
        lines += ["", "## Why each item needs review", ""]
        lines += [f"- § {i['section']}: {'; '.join(i['reasons'])}" for i in review]
    if result.warnings:
        lines += ["", "## Guardrail warnings", ""] + [f"- {w}" for w in result.warnings]
    return "\n".join(lines) + "\n"
