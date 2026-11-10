"""Plain-text helpers used by the parser and the offline baseline."""

from __future__ import annotations

import re

STOPWORDS = set(
    """
    a an and any are as at be been before by each for from has have in into is it its
    must not of on or that the their them then there these this those to under unless
    when where which who will with within least after all also can may such than
    institution institutions shall should would every per being does
    """.split()
)

SECTION_RE = re.compile(r"^###\s*§\s*(\d+)\s+(.+)$", re.M)
DEADLINE_RE = re.compile(
    r"within \d+ (?:days|hours|business days)|at least (?:annually|quarterly|monthly|every \w+ years)"
    r"|(?:annually|quarterly|monthly)|for at least \d+ years",
    re.I,
)
NUMBER_WORDS = {"five": "5", "seven": "7", "two": "2", "three": "3"}


def parse_sections(markdown: str) -> list[dict[str, str]]:
    """Split a rule written as '### § N Heading' blocks into sections."""
    matches = list(SECTION_RE.finditer(markdown))
    sections = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown)
        body = " ".join(markdown[m.end():end].split())
        sections.append({"section": m.group(1), "heading": m.group(2).strip(), "text": body})
    return sections


def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z]+", text.lower())
    out = set()
    for w in words:
        if len(w) <= 3 or w in STOPWORDS:
            continue
        for suffix in ("ing", "ion", "ed", "es", "s"):
            if w.endswith(suffix) and len(w) - len(suffix) >= 4:
                w = w[: -len(suffix)]
                break
        out.add(w)
    return out


def timing_terms(text: str) -> set[str]:
    """Deadlines and frequencies, normalised so '5' and 'five' compare equal."""
    text = text.lower()
    for word, digit in NUMBER_WORDS.items():
        text = re.sub(rf"\b{word}\b", digit, text)
    return {m.replace("at least ", "").replace("for ", "") for m in DEADLINE_RE.findall(text)}
