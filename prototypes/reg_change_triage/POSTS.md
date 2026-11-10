# Post series: regulatory change triage

Five posts, one a week. LinkedIn gets the short version. Substack gets the
long one. Both link to this folder.

## 1. The problem (draft)

A new rule lands on a Tuesday. It's 40 pages.

Someone in compliance reads it. Someone in risk maps it to controls. Two
weeks later you get a spreadsheet. Half the rows say "covered." Nobody can
tell you why.

I've watched this cycle for 25 years. The reading isn't the hard part. The
mapping is. That's where the judgment lives, and where the misses hide.

So I built five agents to do the first draft. A reader. A mapper. A gap
analyst. A challenger that plays second line. A supervisor that writes the
memo.

Before any model ran, I built a keyword baseline. It found all 15
obligations. It still waved through 2 real gaps as "covered."

That's the bar. Next week: why five agents and not one.

Code: link to this folder.

## 2. The design (outline)

- Why one big prompt fails: no checkpoints, no audit trail, no second opinion.
- Five roles, one job each. Diagram from the README.
- The challenger never sees the mapper's reasoning. Same as real second line.
- Routing is code, not a model. Agents recommend. Rules decide who reviews.

## 3. What broke (outline)

- Invented controls and invented sections. Guardrails strip them and log it.
- Partial gaps: the deadline is 72 hours, the control says five business days.
- Over-flagging: seven-year retention marked as failing a five-year rule.
- Fill in from the Claude run's trace.

## 4. The numbers (outline)

- Baseline against agents on the same golden set: mapping precision, gap accuracy, dangerous misses.
- Cost per run and minutes per rule, against the two-week manual cycle.
- Fill in from `scorecard.json` after the Claude run.

## 5. The CIO takeaway (outline)

- Where to start Monday: one rule, your real control library, a 20-item golden set.
- What to demand from any vendor: the evidence pack, not the demo.
- What failure looks like: a "covered" row nobody can explain, in front of an examiner.
