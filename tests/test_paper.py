"""Keep the paper honest: its numbers must match the offline run, and every
citation must exist in the bibliography."""

import re
import unittest
from pathlib import Path

from core.llm import make_client
from prototypes.reg_change_triage.evaluate import load_golden, score
from prototypes.reg_change_triage.pipeline import DATA, load_controls, run_triage

PAPER = Path(__file__).resolve().parent.parent / "prototypes" / "reg_change_triage" / "paper"


class PaperTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tex = (PAPER / "main.tex").read_text()
        cls.bib = (PAPER / "references.bib").read_text()
        result = run_triage((DATA / "sample_rule.md").read_text(), load_controls(), make_client("offline"))
        cls.card = score(result, load_golden())

    def test_every_citation_is_in_the_bibliography(self):
        cited = {k.strip() for group in re.findall(r"\\cite\{([^}]*)\}", self.tex) for k in group.split(",")}
        keys = set(re.findall(r"^@\w+\{([^,]+),", self.bib, re.M))
        self.assertEqual(cited - keys, set())

    def test_results_table_matches_the_offline_scorecard(self):
        c = self.card
        m = c["control_mapping"]
        expected = [
            f"{m['precision']:.2f} / {m['recall']:.2f} / {m['f1']:.2f}",
            f"{m['tp']} TP, {m['fp']} FP, {m['fn']} FN",
            f"{round(c['gap_accuracy'] * c['obligations'])} / {c['obligations']} ({c['gap_accuracy']:.2f})",
            f"Full-gap recall & {c['full_gaps_caught'].replace('/', ' / ')}",
            f"\\textbf{{{len(c['real_gaps_auto_accepted'])}}} "
            + "(" + ", ".join(f"\\S\\,{s}" for s in c["real_gaps_auto_accepted"]) + ")",
            f"{c['routed_to_human']} / {c['obligations']} ({c['routed_to_human'] / c['obligations']:.2f})",
        ]
        for text in expected:
            self.assertIn(text, self.tex)


if __name__ == "__main__":
    unittest.main()
