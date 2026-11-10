"""The five agents in the regulatory change triage pipeline.

Each agent has two brains:

- ``system_prompt`` plus ``output_schema`` for the Claude backend.
- ``offline``, a deterministic keyword baseline. It is intentionally simple.
  It shows what a rules engine gets you, so the agentic result has a number
  to beat.
"""

from __future__ import annotations

from typing import Any

from core.agents import Agent

from .text import sentences, timing_terms, tokens

GAP = ["none", "partial", "full"]
SEVERITY = ["low", "medium", "high"]


def _obj(props: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "object",
        "properties": props,
        "required": list(props),
        "additionalProperties": False,
    }


def _arr(items: dict[str, Any]) -> dict[str, Any]:
    return {"type": "array", "items": items}


S = {"type": "string"}
N = {"type": "number"}
B = {"type": "boolean"}


class ReaderAgent(Agent):
    name = "reader"
    role = "Extract every binding obligation from the rule, one per section, citing the section."
    prompt_version = "reader-v1"
    system_prompt = (
        "You are a regulatory analyst at a bank. You receive a rule split into numbered "
        "sections. For each section that imposes a binding requirement, return one "
        "obligation that states what the institution must do, in plain words, and any "
        "deadline or frequency. Skip sections that only explain purpose, scope or dates. "
        "Cite the section number exactly as given. Never invent a requirement that is "
        "not in the text."
    )
    output_schema = _obj({
        "obligations": _arr(_obj({
            "id": S,
            "section": S,
            "text": S,
            "deadline": S,
        }))
    })

    def offline(self, payload):
        out = []
        for sec in payload["sections"]:
            binding = [s for s in sentences(sec["text"]) if " must " in f" {s.lower()} "]
            if not binding:
                continue
            text = " ".join(binding)
            out.append({
                "id": f"OB-{sec['section']}",
                "section": sec["section"],
                "text": text,
                "deadline": "; ".join(sorted(timing_terms(text))),
            })
        return {"obligations": out}


class MapperAgent(Agent):
    name = "mapper"
    role = "Map each obligation to the existing controls that address it."
    prompt_version = "mapper-v1"
    system_prompt = (
        "You map regulatory obligations to a bank's control library. For each obligation, "
        "list the ids of the controls that address it, if any. Only use ids that appear in "
        "the control library. An empty list is a valid and important answer when nothing "
        "fits. Give a confidence between 0 and 1 and a one-sentence rationale."
    )
    output_schema = _obj({
        "mappings": _arr(_obj({
            "obligation_id": S,
            "control_ids": _arr(S),
            "confidence": N,
            "rationale": S,
        }))
    })

    MIN_OVERLAP = 3

    def offline(self, payload):
        out = []
        for ob in payload["obligations"]:
            ob_tokens = tokens(ob["text"])
            scored = []
            for c in payload["controls"]:
                overlap = ob_tokens & tokens(c["title"] + " " + c["description"])
                scored.append((len(overlap), c["id"]))
            scored.sort(reverse=True)
            picked = [cid for score, cid in scored[:2] if score >= self.MIN_OVERLAP]
            best = scored[0][0] if scored else 0
            out.append({
                "obligation_id": ob["id"],
                "control_ids": picked,
                "confidence": round(min(1.0, best / 6), 2),
                "rationale": f"keyword overlap of {best} terms" if picked else "no control shares enough terms",
            })
        return {"mappings": out}


class GapAnalystAgent(Agent):
    name = "gap_analyst"
    role = "Judge whether the mapped controls fully meet each obligation."
    prompt_version = "gap-v1"
    system_prompt = (
        "You assess control gaps. For each obligation you get the mapped controls with "
        "their full descriptions. Decide: none (the controls fully meet it), partial (a "
        "control exists but falls short, for example a slower deadline, a lower frequency "
        "or a missing element), or full (nothing addresses it). Compare deadlines and "
        "frequencies exactly. Rate severity low, medium or high, state the finding in one "
        "sentence and recommend one action."
    )
    output_schema = _obj({
        "assessments": _arr(_obj({
            "obligation_id": S,
            "gap": {"type": "string", "enum": GAP},
            "severity": {"type": "string", "enum": SEVERITY},
            "finding": S,
            "recommended_action": S,
        }))
    })

    def offline(self, payload):
        controls = {c["id"]: c for c in payload["controls"]}
        out = []
        for ob in payload["obligations"]:
            m = payload["mappings"][ob["id"]]
            mapped = [controls[c] for c in m["control_ids"] if c in controls]
            if not mapped:
                gap, sev = "full", "high"
                finding = "No existing control addresses this obligation."
                action = "Design a new control and assign an owner."
            else:
                needed = timing_terms(ob["text"])
                have = set().union(*(timing_terms(c["description"]) for c in mapped))
                missing = needed - have
                if missing or m["confidence"] < 0.5:
                    gap, sev = "partial", "medium"
                    finding = (f"Control timing differs from the rule: rule needs {sorted(missing)}."
                               if missing else "Mapping is weak; the control may not cover the full requirement.")
                    action = "Update the control to match the rule."
                else:
                    gap, sev = "none", "low"
                    finding = "Existing controls appear to meet the obligation."
                    action = "Confirm with the control owner."
            out.append({
                "obligation_id": ob["id"], "gap": gap, "severity": sev,
                "finding": finding, "recommended_action": action,
            })
        return {"assessments": out}


class ChallengerAgent(Agent):
    name = "challenger"
    role = "Second line: independently test each mapping and gap call."
    prompt_version = "challenger-v1"
    system_prompt = (
        "You are the second line of defense. You did not draft these mappings and you do "
        "not see the drafter's rationale. For each obligation, check the mapped controls "
        "and the gap call against the rule text. Agree only if you would sign off. If you "
        "disagree, say why in one sentence and give the gap level you would assign. Be "
        "most skeptical of 'none' calls."
    )
    output_schema = _obj({
        "challenges": _arr(_obj({
            "obligation_id": S,
            "agrees": B,
            "issue": S,
            "suggested_gap": {"type": "string", "enum": GAP},
        }))
    })

    def offline(self, payload):
        controls = {c["id"]: c for c in payload["controls"]}
        assessed = {a["obligation_id"]: a for a in payload["assessments"]}
        out = []
        for ob in payload["obligations"]:
            a = assessed[ob["id"]]
            ob_tokens = tokens(ob["text"])
            weak = [cid for cid in payload["mappings"][ob["id"]]["control_ids"]
                    if cid in controls and not (tokens(controls[cid]["title"]) & ob_tokens)]
            if weak and a["gap"] != "full":
                worse = GAP[min(GAP.index(a["gap"]) + 1, 2)]
                out.append({"obligation_id": ob["id"], "agrees": False,
                            "issue": f"Control title of {', '.join(weak)} does not match the obligation.",
                            "suggested_gap": worse})
            else:
                out.append({"obligation_id": ob["id"], "agrees": True, "issue": "", "suggested_gap": a["gap"]})
        return {"challenges": out}


class SupervisorAgent(Agent):
    name = "supervisor"
    role = "Write the impact memo summary for the human approver."
    prompt_version = "supervisor-v1"
    system_prompt = (
        "You write the summary of a regulatory change impact memo for a head of compliance. "
        "You get the final gap calls and the items routed to human review. Write three to "
        "five short sentences: how many obligations, how many gaps by level, the most "
        "urgent items, and what the reviewer must decide. Plain words, no jargon. List "
        "the top actions in priority order."
    )
    output_schema = _obj({
        "summary": S,
        "top_actions": _arr(S),
    })

    def offline(self, payload):
        items = payload["items"]
        counts = {g: sum(1 for i in items if i["final_gap"] == g) for g in GAP}
        review = sum(1 for i in items if i["route"] == "human_review")
        summary = (
            f"The rule sets {len(items)} obligations. {counts['full']} have no control, "
            f"{counts['partial']} are partly covered and {counts['none']} look covered. "
            f"{review} items need a human decision before this memo is final."
        )
        urgent = [i for i in items if i["final_gap"] == "full"] + [i for i in items if i["final_gap"] == "partial"]
        actions = [f"§ {i['section']}: {i['recommended_action']}" for i in urgent[:5]]
        return {"summary": summary, "top_actions": actions}
