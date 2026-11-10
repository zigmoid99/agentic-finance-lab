# Regulatory change triage

A new rule lands. Someone has to read it, list what it requires, map each
requirement to existing controls, find the gaps and write an impact memo.
This prototype has five agents do the first draft, and a person sign off.

## How it works

```
rule.md ──► reader ──► mapper ──► gap analyst ──► challenger ──► routing policy ──► supervisor ──► memo
             │          │            │               │               │
          obligations  control ids  none/partial/   agrees? and     auto-accept only if
          per section  + confidence full + finding  its own call    clean; else a human
```

| Agent | Job | Guardrail around it |
|---|---|---|
| Reader | One obligation per binding section, with deadline | Obligations citing a section not in the rule are dropped |
| Mapper | Control ids that address each obligation, with confidence | Ids not in the control library are removed and logged |
| Gap analyst | none, partial or full gap, with finding and action | Schema-checked; a missing assessment defaults to full gap |
| Challenger | Second line review. Sees the mapping, not the mapper's rationale | Disagreement takes the more severe call |
| Supervisor | Summary and top actions for the approver | Failure leaves the item table intact |

Routing is plain code. An item is auto-accepted only when the gap is `none`,
the challenger agrees and mapping confidence is at least 0.6. Everything
else goes to a person, with the reasons listed.

## Data

- `data/sample_rule.md`: a **synthetic** guidance document on third-party AI
  systems, 17 sections, 15 binding obligations. Written for this prototype.
  Not a real regulation.
- `data/controls.json`: a synthetic library of 30 controls. About half are
  relevant, the rest are realistic distractors.
- `data/golden_set.json`: hand-labeled answers: which controls map to each
  obligation, and whether the gap is none, partial or full.

To run a real public rule, save it as markdown with `### § N Heading` section
markers and pass `--rule path/to/rule.md`. Scoring needs a golden set for
that rule (`--golden`).

## Results so far

Offline keyword baseline on the sample rule, no model involved:

| Measure | Baseline |
|---|---|
| Obligations found | 15 of 15 |
| Control mapping precision / recall | 0.59 / 0.87 |
| Gap calls correct | 9 of 15 (60%) |
| Full gaps caught | 1 of 2 |
| Real gaps auto-accepted (the dangerous miss) | 2: § 4 and § 14 |
| Routed to a human | 7 of 15 |
| Cost per run | $0 |

What the baseline gets wrong is the point. It cannot tell that "due
diligence" without "training practices" is a partial gap, or that a risk
appetite statement that never mentions AI does not cover AI. It also flags
seven-year retention as failing a five-year rule. Those are the judgment
calls the agents have to get right.

The Claude run has not been scored yet. Run it with `--backend claude` and
the scorecard lands next to the memo.

## Run it

```bash
python -m prototypes.reg_change_triage                     # offline baseline
python -m prototypes.reg_change_triage --backend claude    # Claude, default effort medium
python -m prototypes.reg_change_triage --backend claude --effort high
```

The Claude backend uses structured outputs, so every agent returns JSON that
matches its schema, and server-side refusal fallbacks, so a declined request
is retried on a fallback model in the same call.
