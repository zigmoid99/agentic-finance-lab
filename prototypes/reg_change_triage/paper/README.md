# Paper: Agents Draft, Code Decides

A research paper on the regulatory change triage prototype, written for
submission to a peer-reviewed conference. It is a **draft for review**.

- `main.tex`: the paper, in ACM `acmart` format (`sigconf`, anonymous review mode).
- `references.bib`: the bibliography. Every entry is a real, published work or official document.

## Target venue

The default target is the **ACM International Conference on AI in Finance
(ICAIF)**, which uses the ACM `sigconf` template. The same source works for
other ACM venues by changing the document class options. Check the current
call for papers for page limits, anonymity rules and deadlines before you
submit. They change from year to year, so they are not hard-coded here.

As checked on November 11, 2026, ICAIF 2026 (Milan, November 14 to 17) closed
for papers on August 9, 2026. Its limit was eight two-column pages including
references, with no appendices, under double-blind review. This draft is
likely longer than that, so plan for a later cycle or another venue, and cut
to the limit that venue sets.

## Build the PDF

You need a TeX distribution with the `acmart` class (TeX Live and MiKTeX both
include it). From this folder:

```bash
latexmk -pdf main.tex
```

Or by hand:

```bash
pdflatex main && bibtex main && pdflatex main && pdflatex main
```

You can also upload `main.tex` and `references.bib` to Overleaf and pick
pdfLaTeX. The draft has not been compiled yet, so expect to fix small layout
issues (figure and table placement) on the first build.

## What is real and what is not

The paper reports **only** the offline keyword baseline. Every number in its
results tables comes from `python -m prototypes.reg_change_triage`, and
`tests/test_paper.py` fails if the paper and the scorecard disagree. No
results from a hosted language model appear anywhere. Those runs are
described as future work and marked `TODO`.

## Before you submit

Search `main.tex` for `TODO`. The items are:

1. **Run the hosted backend** and add its column to the results table, with
   the model, version, effort setting and run date. Rewrite the abstract and
   conclusion around what it finds. Without this, the paper is a systems and
   position paper with a baseline, and reviewers will say so.
2. **Second annotator.** Have a second practitioner label the golden set and
   report Cohen's kappa.
3. **Authors, affiliation and email** (hidden in review mode, needed for the
   camera-ready version). Decide whether to name your employer.
4. **Conference block** (`\acmConference`), and the rights block ACM sends after acceptance.
5. **CCS concepts.** Regenerate them with the ACM CCS tool and check each id.
6. **Generative AI disclosure.** ACM policy requires disclosing AI use in
   writing the paper. Parts of the draft and the code were written with an
   AI assistant. Say so in the way the venue asks.
7. **Anonymized artifact link** for review, for example an anonymous
   mirror of this repository.
8. **Check every reference** against its source once more (authors, venue,
   pages, DOI).
9. **Build and proofread** the PDF, and check the page count against the call.
