#!/usr/bin/env python3
"""
RegWatch Podcast Builder — Prototype Pipeline
==============================================
A single-script, end-to-end podcast generation pipeline.

Pipeline stages:
  1. SCAN     — fetch regulatory news from configured sources
  2. FILTER   — Claude Haiku scores each item for tech relevance
  3. RESEARCH — Claude Opus produces structured regulation briefs
  4. WRITE    — Claude Opus writes a 3-persona podcast script
  5. AUDIO    — OpenAI TTS generates audio per speaker turn
  6. STITCH   — pydub stitches segments into final episode MP3

Usage:
  python pipeline.py               # Full run (scan → audio)
  python pipeline.py --skip-audio  # Scan + script only (no TTS; saves API cost)
  python pipeline.py --dry-run     # Script preview only; no API calls after filter

Checkpointing: Each stage saves JSON to data/episodes/{date}/.
Re-running skips completed stages automatically — safe to resume after failure.

System requirements:
  pip install -r requirements.txt
  apt-get install ffmpeg          # (or brew install ffmpeg on macOS)
  cp .env.example .env && fill in your API keys
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import feedparser
import httpx
import yaml
from anthropic import Anthropic
from dotenv import load_dotenv
from pydub import AudioSegment

load_dotenv()

# ── Configuration ─────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
CONFIG_DIR = SCRIPT_DIR / "config"
DATA_DIR = SCRIPT_DIR / "data" / "episodes"

with open(CONFIG_DIR / "sources.yaml") as _f:
    SOURCES_CFG = yaml.safe_load(_f)

with open(CONFIG_DIR / "settings.yaml") as _f:
    SETTINGS = yaml.safe_load(_f)

EPISODE_CFG = SETTINGS["episode"]
MODEL_CFG = SETTINGS["models"]
PERSONAS = SETTINGS["personas"]


def _get_clients() -> tuple:
    """Initialise API clients; fail fast with clear messages if keys are missing."""
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    if not anthropic_key:
        sys.exit("ERROR: ANTHROPIC_API_KEY not set. Copy .env.example to .env and fill in your keys.")

    claude = Anthropic(api_key=anthropic_key)

    openai_client = None
    if openai_key:
        from openai import OpenAI
        openai_client = OpenAI(api_key=openai_key)

    return claude, openai_client


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 1 — SCAN
# Fetch raw regulatory items from all configured sources.
# ═══════════════════════════════════════════════════════════════════════════════

def scan_sources() -> list[dict]:
    """Fetch regulatory items from all configured sources."""
    since = datetime.now(tz=timezone.utc) - timedelta(days=EPISODE_CFG["lookback_days"])
    all_items: list[dict] = []

    for source in SOURCES_CFG["sources"]:
        print(f"  [{source['jurisdiction']}] {source['name']}")
        try:
            if source["type"] == "api":
                items = _fetch_federal_register(source, since)
            elif source["type"] == "rss":
                items = _fetch_rss(source, since)
            else:
                items = []
            all_items.extend(items)
            print(f"         → {len(items)} items")
        except Exception as exc:
            print(f"         ! WARN: {exc}")

    return all_items


def _fetch_federal_register(source: dict, since: datetime) -> list[dict]:
    """Fetch proposed/final rules from the Federal Register REST API."""
    params = {
        "fields[]": [
            "title", "abstract", "document_number",
            "publication_date", "agencies", "document_type", "html_url",
        ],
        "order": "newest",
        "per_page": 20,
        "conditions[type][]": ["PROPOSED_RULE", "RULE"],
        "conditions[publication_date][gte]": since.strftime("%Y-%m-%d"),
    }
    with httpx.Client(timeout=30) as client:
        r = client.get(source["url"], params=params)
        r.raise_for_status()
        data = r.json()

    items = []
    for doc in data.get("results", []):
        agencies = ", ".join(a.get("name", "") for a in doc.get("agencies", []))
        items.append({
            "title": doc.get("title", ""),
            "url": doc.get("html_url", ""),
            "source": source["name"],
            "source_id": source["id"],
            "jurisdiction": source["jurisdiction"],
            "date": doc.get("publication_date", ""),
            "snippet": (doc.get("abstract") or "")[:600],
            "document_type": doc.get("document_type", "RULE"),
            "agencies": agencies,
        })
    return items


def _fetch_rss(source: dict, since: datetime) -> list[dict]:
    """Parse an RSS/Atom feed; return items newer than `since`."""
    feed = feedparser.parse(source["url"])
    tech_keywords = [kw.lower() for kw in SOURCES_CFG.get("tech_keywords", [])]
    items = []

    for entry in feed.entries:
        # Date filter
        pub = getattr(entry, "published_parsed", None)
        if pub:
            pub_dt = datetime(*pub[:6], tzinfo=timezone.utc)
            if pub_dt < since:
                continue

        title = entry.get("title", "")
        snippet = entry.get("summary", "")[:600]
        combined = (title + " " + snippet).lower()

        # Quick keyword pre-filter — keeps scan results focused before Claude scoring
        if tech_keywords and not any(kw in combined for kw in tech_keywords):
            continue

        items.append({
            "title": title,
            "url": entry.get("link", ""),
            "source": source["name"],
            "source_id": source["id"],
            "jurisdiction": source["jurisdiction"],
            "date": entry.get("published", ""),
            "snippet": snippet,
            "document_type": "news",
            "agencies": source["name"],
        })
    return items


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 2 — FILTER
# Claude Haiku classifies each item; drop anything below min relevance score.
# ═══════════════════════════════════════════════════════════════════════════════

def filter_relevant(raw_items: list[dict], claude: Anthropic) -> list[dict]:
    """Score items for tech-company relevance in batches; return those that qualify."""
    if not raw_items:
        return []

    min_score = EPISODE_CFG["min_relevance_score"]
    relevant: list[dict] = []
    batch_size = 10

    for i in range(0, len(raw_items), batch_size):
        batch = raw_items[i : i + batch_size]
        scores = _score_batch(batch, claude)
        for item, score_data in zip(batch, scores):
            item["relevance_score"] = score_data.get("score", 0)
            item["relevance_category"] = score_data.get("category", "unknown")
            item["relevance_reason"] = score_data.get("reason", "")
            if item["relevance_score"] >= min_score:
                relevant.append(item)

    relevant.sort(key=lambda x: x["relevance_score"], reverse=True)
    return relevant


def _score_batch(batch: list[dict], claude: Anthropic) -> list[dict]:
    """Call Claude Haiku to score a batch of items in one request."""
    items_text = "\n\n".join(
        f"[Item {idx + 1}]\n"
        f"Title: {item['title']}\n"
        f"Jurisdiction: {item['jurisdiction']}\n"
        f"Source: {item['source']}\n"
        f"Snippet: {item['snippet'][:300]}"
        for idx, item in enumerate(batch)
    )

    prompt = f"""You are a regulatory analyst. Score each item for relevance to technology companies.

Relevance categories: AI/ML regulation, data privacy, fintech/payments, cybersecurity,
platform/antitrust, digital services, telecom, algorithmic systems, biometrics.

Score 0 = no relevance to technology companies
Score 10 = directly and significantly impacts technology companies

Items:
{items_text}

Return a JSON array of exactly {len(batch)} objects, one per item in order:
[{{"score": <0-10>, "category": "<category>", "reason": "<one sentence>"}}]

Return ONLY the JSON array. No markdown, no explanation."""

    response = claude.messages.create(
        model=MODEL_CFG["filter"],
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        result = json.loads(raw)
        # Ensure we always return the right number of items
        if len(result) < len(batch):
            result += [{"score": 5, "category": "unknown", "reason": ""}] * (len(batch) - len(result))
        return result
    except json.JSONDecodeError:
        return [{"score": 5, "category": "unknown", "reason": "parse error"}] * len(batch)


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 3 — RESEARCH
# Claude Opus produces a rich structured brief for each top regulation.
# ═══════════════════════════════════════════════════════════════════════════════

def research_regulations(relevant_items: list[dict], claude: Anthropic) -> list[dict]:
    """Produce structured regulation briefs for the top N items."""
    top = relevant_items[: EPISODE_CFG["max_regulations"]]
    briefs = []
    for item in top:
        print(f"  {item['jurisdiction']:3s}  {item['title'][:70]}")
        briefs.append(_research_one(item, claude))
    return briefs


def _research_one(item: dict, claude: Anthropic) -> dict:
    """Ask Claude Opus to produce a detailed regulation brief."""
    prompt = f"""You are a senior regulatory research analyst specialising in technology law.

Produce a detailed, accurate brief for the following regulatory item.
Use your knowledge of this regulation plus the provided context.
Where specific details are uncertain, note that clearly rather than fabricating.

─── Regulatory Item ───────────────────────────────────────────────
Title:        {item['title']}
Jurisdiction: {item['jurisdiction']}
Source:       {item['source']}
Published:    {item['date']}
Type:         {item['document_type']}
URL:          {item['url']}
Summary:      {item['snippet']}
───────────────────────────────────────────────────────────────────

Return a JSON object with EXACTLY these fields:

{{
  "title": "<Full official regulation title>",
  "jurisdiction": "<{item['jurisdiction']}>",
  "regulatory_body": "<Specific agency or legislative body responsible>",
  "status": "<Current status, e.g.: 'Proposed Rule — public comment open until DATE', 'Final Rule — effective DATE', 'Under parliamentary review'>",
  "background": "<2–3 paragraphs: the problem this regulation addresses, its legislative history, key provisions and requirements. Factual and specific.>",
  "tech_impact": "<2–3 paragraphs: which technology company types are affected (AI firms, cloud providers, fintechs, platforms, etc.), specific obligations or prohibitions, compliance requirements, and penalties for non-compliance.>",
  "strategy": "<2–3 paragraphs: what technology companies should do NOW, which internal teams are affected (legal, engineering, product, compliance), timeline priorities, risks of inaction, opportunities to engage in the regulatory process or shape outcomes.>",
  "urgency": "<high|medium|low>",
  "key_dates": ["<DATE: description>", "..."],
  "source_url": "<{item['url']}>"
}}

Return ONLY valid JSON. No markdown formatting."""

    response = claude.messages.create(
        model=MODEL_CFG["research"],
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Graceful fallback — don't crash the whole pipeline
        return {
            "title": item["title"],
            "jurisdiction": item["jurisdiction"],
            "regulatory_body": item["source"],
            "status": "Unknown",
            "background": item["snippet"],
            "tech_impact": "Analysis unavailable — JSON parse error",
            "strategy": "Manual research required",
            "urgency": "medium",
            "key_dates": [],
            "source_url": item["url"],
        }


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 4 — WRITE
# Claude Opus writes a multi-persona podcast script from the regulation briefs.
# ═══════════════════════════════════════════════════════════════════════════════

def write_script(briefs: list[dict], episode_date: str, claude: Anthropic) -> list[dict]:
    """Generate a full 3-persona podcast script."""
    personas_text = "\n".join(
        f"  • {p['name']} ({p['role']}): {p['description'].strip()}"
        for p in PERSONAS
    )
    briefs_json = json.dumps(briefs, indent=2)
    target_words = EPISODE_CFG["target_words"]

    prompt = f"""You are a professional podcast script writer specialising in regulatory and technology topics.

Write a complete, broadcast-quality podcast script for the episode dated {episode_date}.

─── PERSONAS ──────────────────────────────────────────────────────
{personas_text}
───────────────────────────────────────────────────────────────────

─── REGULATIONS TO COVER (ordered by priority) ────────────────────
{briefs_json}
───────────────────────────────────────────────────────────────────

─── SCRIPT REQUIREMENTS ───────────────────────────────────────────
1. Open: Alex introduces the episode, names the date and overall regulatory theme.
2. For EACH regulation (work through them in priority order):
   a. Alex briefly introduces the regulation and why it matters now
   b. Jordan explains the background, who made it, its current status, and what it legally requires
   c. Sam discusses the business impact: which companies are affected, what the stakes are, what to do
   d. Natural back-and-forth: follow-up questions, pushback, nuance, brief disagreements where genuine
3. Language: conversational and engaging, not academic. Treat the audience as smart non-lawyers.
4. Jordan and Sam should occasionally disagree on severity or approach — this is a discussion, not a lecture.
5. Include specific facts, dates, and figures from the briefs.
6. Close: Alex summarises the top 2–3 takeaways and teases what to watch next week.
7. Target ~{target_words} words total (~13–15 minutes of audio).
8. Keep individual speaker turns to 40–150 words each for natural pacing.
───────────────────────────────────────────────────────────────────

Return a JSON array of objects:
[
  {{"speaker": "Alex", "text": "Welcome to RegWatch..."}},
  {{"speaker": "Jordan", "text": "..."}},
  {{"speaker": "Sam", "text": "..."}}
]

speaker must be exactly "Alex", "Jordan", or "Sam".
Return ONLY valid JSON. No markdown formatting."""

    response = claude.messages.create(
        model=MODEL_CFG["scriptwriter"],
        max_tokens=6000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw)


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 5 — AUDIO
# OpenAI TTS generates per-turn audio; pydub stitches into final MP3.
# ═══════════════════════════════════════════════════════════════════════════════

def generate_audio(script: list[dict], output_dir: Path, openai_client) -> Path:
    """Generate and stitch audio for the full episode."""
    if openai_client is None:
        sys.exit("ERROR: OPENAI_API_KEY not set. Required for audio generation.")

    voice_map = {p["name"]: p["voice"] for p in PERSONAS}
    segments_dir = output_dir / "audio_segments"
    segments_dir.mkdir(exist_ok=True)

    segment_paths: list[Path] = []
    total = len(script)

    print(f"  Generating {total} audio segments (this takes a few minutes)...")
    for idx, line in enumerate(script):
        speaker = line["speaker"]
        text = line["text"]
        voice = voice_map.get(speaker, "alloy")
        seg_path = segments_dir / f"{idx:04d}_{speaker.lower()}.mp3"

        if not seg_path.exists():
            resp = openai_client.audio.speech.create(
                model="tts-1-hd",
                voice=voice,
                input=text,
            )
            resp.stream_to_file(str(seg_path))

        segment_paths.append(seg_path)

        if (idx + 1) % 10 == 0 or (idx + 1) == total:
            print(f"    {idx + 1}/{total} segments")

    print("  Stitching segments...")
    combined = AudioSegment.empty()
    prev_speaker: str | None = None

    for seg_path in segment_paths:
        # Extract speaker from filename pattern 0001_alex.mp3
        this_speaker = seg_path.stem.split("_", 1)[1] if "_" in seg_path.stem else ""
        seg_audio = AudioSegment.from_mp3(str(seg_path))

        if prev_speaker is not None:
            # Longer pause on speaker change (sounds more natural)
            pause_ms = 450 if this_speaker != prev_speaker else 220
            combined += AudioSegment.silent(duration=pause_ms)

        combined += seg_audio
        prev_speaker = this_speaker

    episode_date = output_dir.name
    final_path = output_dir / f"episode_{episode_date}.mp3"
    combined.export(str(final_path), format="mp3", bitrate="128k")

    duration_min = len(combined) / 60_000
    print(f"  Duration: {duration_min:.1f} min  →  {final_path.name}")
    return final_path


# ═══════════════════════════════════════════════════════════════════════════════
# ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════

def _load_or_run(path: Path, label: str, fn, *args):
    """Load cached JSON if it exists, otherwise run fn(*args) and save result."""
    if path.exists():
        print(f"Step {label} — loading cached results from {path.name}")
        with open(path) as f:
            return json.load(f)
    result = fn(*args)
    with open(path, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    return result


def _script_preview(script: list[dict], n: int = 5) -> None:
    print("\n── Script Preview ──────────────────────────────────────────────────")
    for line in script[:n]:
        preview = line["text"][:110] + ("…" if len(line["text"]) > 110 else "")
        print(f"  [{line['speaker']:6s}]  {preview}")
    print(f"  … ({len(script)} total lines)")
    print("────────────────────────────────────────────────────────────────────\n")


def run_pipeline(dry_run: bool = False, skip_audio: bool = False) -> None:
    episode_date = datetime.now().strftime("%Y-%m-%d")
    output_dir = DATA_DIR / episode_date
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'═' * 62}")
    print(f"  RegWatch Podcast Builder — Episode {episode_date}")
    print(f"{'═' * 62}\n")

    claude, openai_client = _get_clients()

    # ── 1. SCAN ───────────────────────────────────────────────────
    print("Step 1: SCAN — fetching regulatory sources")
    raw_items = _load_or_run(
        output_dir / "raw_items.json",
        "1",
        scan_sources,
    )
    print(f"         {len(raw_items)} total items\n")

    # ── 2. FILTER ─────────────────────────────────────────────────
    print("Step 2: FILTER — scoring for tech relevance")
    relevant_items = _load_or_run(
        output_dir / "relevant_items.json",
        "2",
        filter_relevant,
        raw_items,
        claude,
    )
    min_score = EPISODE_CFG["min_relevance_score"]
    print(f"         {len(relevant_items)} items passed (score ≥ {min_score})\n")

    if not relevant_items:
        print("No relevant regulatory items found this week. Try expanding sources or lowering min_relevance_score.")
        return

    # ── 3. RESEARCH ───────────────────────────────────────────────
    print("Step 3: RESEARCH — producing regulation briefs")
    briefs = _load_or_run(
        output_dir / "regulation_briefs.json",
        "3",
        research_regulations,
        relevant_items,
        claude,
    )
    print(f"         {len(briefs)} briefs produced\n")

    if dry_run:
        print("-- dry-run: stopping after research stage --")
        print(f"Artifacts saved to: {output_dir}")
        return

    # ── 4. WRITE ──────────────────────────────────────────────────
    print("Step 4: WRITE — generating podcast script")
    script = _load_or_run(
        output_dir / "episode_script.json",
        "4",
        write_script,
        briefs,
        episode_date,
        claude,
    )
    word_count = sum(len(line["text"].split()) for line in script)
    print(f"         {len(script)} lines · ~{word_count:,} words · ~{word_count // 150} min\n")

    _script_preview(script)

    if skip_audio:
        print("-- skip-audio: stopping before TTS generation --")
        print(f"Script saved to: {output_dir / 'episode_script.json'}")
        return

    # ── 5. AUDIO ──────────────────────────────────────────────────
    final_audio = output_dir / f"episode_{episode_date}.mp3"
    if final_audio.exists():
        print(f"Step 5: AUDIO — already exists: {final_audio.name}\n")
    else:
        print("Step 5: AUDIO — generating voices and stitching")
        final_audio = generate_audio(script, output_dir, openai_client)
        print()

    print(f"{'═' * 62}")
    print(f"  Episode ready!  →  {output_dir}")
    print(f"{'═' * 62}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="RegWatch — automated tech-regulation podcast generator"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Stop after research stage; no script or audio generated",
    )
    parser.add_argument(
        "--skip-audio",
        action="store_true",
        help="Generate script but skip TTS (saves OpenAI cost during QA)",
    )
    args = parser.parse_args()
    run_pipeline(dry_run=args.dry_run, skip_audio=args.skip_audio)
