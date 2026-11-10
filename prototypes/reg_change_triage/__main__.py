"""Run regulatory change triage.

    python -m prototypes.reg_change_triage                    # offline baseline, no key needed
    python -m prototypes.reg_change_triage --backend claude   # agents on Claude
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from core.agents import AgentFailed
from core.llm import DEFAULT_MODEL, make_client

from .evaluate import load_golden, score
from .pipeline import DATA, load_controls, render_memo, run_triage


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="reg_change_triage", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--backend", choices=["offline", "claude"], default="offline")
    p.add_argument("--model", default=DEFAULT_MODEL, help="Claude model id (claude backend only)")
    p.add_argument("--effort", default="medium", choices=["low", "medium", "high", "xhigh", "max"])
    p.add_argument("--rule", type=Path, default=DATA / "sample_rule.md")
    p.add_argument("--controls", type=Path, default=DATA / "controls.json")
    p.add_argument("--golden", type=Path, help="golden set to score against (defaults to the sample's)")
    p.add_argument("--out", type=Path, default=Path("out/reg_change_triage"))
    args = p.parse_args(argv)

    kwargs = {"model": args.model, "effort": args.effort} if args.backend == "claude" else {}
    llm = make_client(args.backend, **kwargs)

    try:
        result = run_triage(args.rule.read_text(), load_controls(args.controls), llm)
    except AgentFailed as e:
        print(f"Run stopped: {e}. See the trace for details.", file=sys.stderr)
        return 1

    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    (out / "memo.md").write_text(render_memo(result))
    (out / "evidence_pack.md").write_text(result.audit.evidence_pack())
    result.audit.write_jsonl(out / "trace.jsonl")

    golden_path = args.golden or (DATA / "golden_set.json" if args.rule == DATA / "sample_rule.md" else None)
    print(f"Run {result.run_id} on {args.backend}: {len(result.items)} obligations, "
          f"{sum(i['route'] == 'human_review' for i in result.items)} routed to a human.")
    if golden_path:
        card = score(result, load_golden(golden_path))
        card["backend"] = args.backend if args.backend == "offline" else args.model
        (out / "scorecard.json").write_text(json.dumps(card, indent=2) + "\n")
        print(json.dumps(card, indent=2))
    print(f"Wrote {out}/memo.md, evidence_pack.md and trace.jsonl")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
