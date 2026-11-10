import json
import unittest
from types import SimpleNamespace

from core.audit import AuditLog
from core.evals import prf
from core.guardrails import GuardrailViolation, check_references, validate
from core.llm import ClaudeClient, LLMResult, RefusalError

SCHEMA = {
    "type": "object",
    "properties": {"gap": {"type": "string", "enum": ["none", "full"]}, "ids": {"type": "array", "items": {"type": "string"}}},
    "required": ["gap", "ids"],
    "additionalProperties": False,
}


class GuardrailTests(unittest.TestCase):
    def test_valid(self):
        validate({"gap": "none", "ids": ["a"]}, SCHEMA)

    def test_rejects_missing_extra_enum_and_type(self):
        for bad in ({"gap": "none"}, {"gap": "none", "ids": [], "x": 1}, {"gap": "maybe", "ids": []}, {"gap": "none", "ids": [1]}):
            with self.assertRaises(GuardrailViolation):
                validate(bad, SCHEMA)

    def test_check_references(self):
        self.assertEqual(check_references(["C-1", "C-9"], {"C-1"}, "control"), ["C-9"])


class EvalTests(unittest.TestCase):
    def test_prf(self):
        r = prf({1, 2, 3}, {2, 3, 4})
        self.assertEqual((r.tp, r.fp, r.fn), (2, 1, 1))
        self.assertAlmostEqual(r.f1, 2 / 3)


class AuditTests(unittest.TestCase):
    def test_cost_and_pack(self):
        log = AuditLog("t1")
        log.add(agent="a", role="r", prompt_version="v1", model="claude-opus-5-5", input_sha256="x",
                output={}, input_tokens=1000, output_tokens=500, cost_usd=0.014, seconds=1.0, status="ok")
        self.assertAlmostEqual(log.total_cost_usd, 0.014)
        self.assertIn("| 1 | a | v1 | claude-opus-5-5 | ok |", log.evidence_pack())

    def test_result_cost(self):
        r = LLMResult(data={}, model="claude-opus-5-5", input_tokens=1_000_000, output_tokens=100_000)
        self.assertAlmostEqual(r.cost_usd, 6.0)


class FakeMessages:
    def __init__(self, response):
        self.response = response
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


def fake_client(response):
    messages = FakeMessages(response)
    return SimpleNamespace(beta=SimpleNamespace(messages=messages)), messages


class ClaudeClientTests(unittest.TestCase):
    def test_request_shape_and_parse(self):
        resp = SimpleNamespace(
            stop_reason="end_turn", model="claude-opus-5-5",
            content=[SimpleNamespace(type="text", text=json.dumps({"gap": "none", "ids": []}))],
            usage=SimpleNamespace(input_tokens=10, output_tokens=5),
        )
        client, messages = fake_client(resp)
        out = ClaudeClient(client=client).complete_json(system="sys", payload={"q": 1}, schema=SCHEMA, offline=None)
        self.assertEqual(out.data, {"gap": "none", "ids": []})
        call = messages.calls[0]
        self.assertEqual(call["model"], "claude-opus-5-5")
        self.assertEqual(call["fallbacks"], "default")
        self.assertEqual(call["output_config"]["format"], {"type": "json_schema", "schema": SCHEMA})
        self.assertEqual(call["output_config"]["effort"], "medium")

    def test_refusal_raises(self):
        resp = SimpleNamespace(stop_reason="refusal", content=[], usage=None)
        client, _ = fake_client(resp)
        with self.assertRaises(RefusalError):
            ClaudeClient(client=client).complete_json(system="s", payload={}, schema=SCHEMA, offline=None)


if __name__ == "__main__":
    unittest.main()
