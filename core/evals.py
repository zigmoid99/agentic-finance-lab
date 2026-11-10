"""Scoring helpers for golden-set evals."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PRF:
    precision: float
    recall: float
    f1: float
    tp: int
    fp: int
    fn: int

    def as_dict(self) -> dict[str, float | int]:
        return {
            "precision": round(self.precision, 3),
            "recall": round(self.recall, 3),
            "f1": round(self.f1, 3),
            "tp": self.tp,
            "fp": self.fp,
            "fn": self.fn,
        }


def prf(predicted: set, expected: set) -> PRF:
    tp = len(predicted & expected)
    fp = len(predicted - expected)
    fn = len(expected - predicted)
    p = tp / (tp + fp) if tp + fp else 1.0
    r = tp / (tp + fn) if tp + fn else 1.0
    f = 2 * p * r / (p + r) if p + r else 0.0
    return PRF(p, r, f, tp, fp, fn)


def accuracy(pairs: list[tuple[object, object]]) -> float:
    if not pairs:
        return 1.0
    return sum(1 for a, b in pairs if a == b) / len(pairs)
