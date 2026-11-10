# Agentic Finance Lab

Working prototypes of multi-agent systems for risk, compliance and finance.
Built by someone who has run risk technology at a large bank. Every prototype
ships with its results, its cost and what broke.

**Who it's for:** CIOs, CTOs and risk technology leaders deciding where agents
belong in a regulated business, and what it takes to trust them.

## Principles

- **Synthetic or public data only.** No employer data. No internal details.
- **Every agent decision is auditable.** Inputs, prompt version, model, output and status are logged for each step.
- **Humans approve decisions.** Agents draft, check and recommend. Routing to a person is code, not a model's choice.
- **Honest results.** Each prototype reports accuracy against a hand-labeled set, cost per run and failure modes.
- **Plain Python first.** No agent framework, so you can see the mechanism.

## Prototypes

| # | Prototype | Use case | Pattern | Status |
|---|---|---|---|---|
| 1 | [Regulatory change triage](prototypes/reg_change_triage/) | GRC | Pipeline + maker-checker | Offline baseline scored. Claude run pending. |
| 2 | Second-line challenger | Risk review | Adversarial supervision | Planned |
| 3 | Fraud and AML alert triage | Financial crime | Supervisor + specialists | Planned |
| 4 | Credit decision explainer | Credit, fair lending | Maker-checker + guardrails | Planned |
| 5 | Regulatory report lineage tracer | Reg reporting | Tool-using investigators | Planned |

## Quick start

```bash
python -m prototypes.reg_change_triage            # offline baseline, no key, no network
python -m unittest discover -s tests -t .         # tests
```

To run the agents on Claude:

```bash
pip install -e ".[claude]"
export ANTHROPIC_API_KEY=...                      # or `ant auth login`
python -m prototypes.reg_change_triage --backend claude
```

Outputs land in `out/reg_change_triage/`: the impact memo, an evidence pack,
the full JSONL trace and a scorecard.

## Layout

```
core/          shared building blocks: model client, agent base, guardrails, audit, evals
prototypes/    one folder per prototype, each with its own README, data and POSTS.md
tests/         unit and pipeline tests (standard library unittest)
```

Personal project. Views are my own. All data here is synthetic or public.
