import tempfile
import unittest
from pathlib import Path

from core.llm import LLMResult, OfflineClient
from prototypes.reg_change_triage.__main__ import main
from prototypes.reg_change_triage.evaluate import load_golden, score
from prototypes.reg_change_triage.pipeline import DATA, load_controls, run_triage
from prototypes.reg_change_triage.text import parse_sections, timing_terms

RULE = (DATA / "sample_rule.md").read_text()


class TextTests(unittest.TestCase):
    def test_parse_sections(self):
        sections = parse_sections(RULE)
        self.assertEqual(len(sections), 17)
        self.assertEqual(sections[1]["heading"], "Inventory")

    def test_timing_terms_normalise_numbers(self):
        self.assertEqual(timing_terms("within five business days"), {"within 5 business days"})


class OfflinePipelineTests(unittest.TestCase):
    def setUp(self):
        self.result = run_triage(RULE, load_controls(), OfflineClient())

    def test_finds_every_obligation(self):
        card = score(self.result, load_golden())
        self.assertEqual(card["obligation_detection"]["recall"], 1.0)
        self.assertEqual(card["obligations"], 15)

    def test_auto_accept_only_when_clean(self):
        for item in self.result.items:
            if item["route"] == "auto_accept":
                self.assertEqual(item["final_gap"], "none")
                self.assertEqual(item["challenge"], "")
                self.assertGreaterEqual(item["confidence"], 0.6)

    def test_every_step_is_audited(self):
        agents = [r.agent for r in self.result.audit.records]
        self.assertEqual(agents, ["reader", "mapper", "gap_analyst", "challenger", "supervisor"])
        self.assertTrue(all(r.status == "ok" for r in self.result.audit.records))


class LyingClient(OfflineClient):
    """Behaves like the baseline but invents a section and a control id."""

    def complete_json(self, *, system, payload, schema, offline):
        result = super().complete_json(system=system, payload=payload, schema=schema, offline=offline)
        data = result.data
        if "obligations" in data:
            data["obligations"].append({"id": "OB-99", "section": "99", "text": "Invented.", "deadline": ""})
        if "mappings" in data:
            data["mappings"][0]["control_ids"].append("C-FAKE-01")
        return LLMResult(data=data, model=result.model)


class GuardrailPipelineTests(unittest.TestCase):
    def test_invented_section_and_control_are_removed(self):
        result = run_triage(RULE, load_controls(), LyingClient())
        self.assertNotIn("99", {i["section"] for i in result.items})
        self.assertFalse(any("C-FAKE-01" in i["control_ids"] for i in result.items))
        self.assertEqual(len(result.warnings), 2)


class CliTests(unittest.TestCase):
    def test_writes_outputs(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(main(["--out", d]), 0)
            for name in ("memo.md", "evidence_pack.md", "trace.jsonl", "scorecard.json"):
                self.assertTrue((Path(d) / name).exists(), name)


if __name__ == "__main__":
    unittest.main()
