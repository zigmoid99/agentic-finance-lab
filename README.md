# RegWatch: Tech Regulation Decoded — Podcast Builder

An automated, weekly podcast production pipeline powered by Claude AI.
Scans global regulatory sources, summarises tech-relevant regulations,
writes a 3-persona podcast script, generates audio, and prepares for publishing.

## How It Works

```
Weekly trigger (GitHub Actions cron: every Monday)
   │
   ▼
1. SCAN     — fetch new regulatory items from US, EU, UK, SG, AU sources
   │
   ▼
2. FILTER   — Claude Haiku scores each item for tech-company relevance
   │
   ▼
3. RESEARCH — Claude Opus produces structured briefs per regulation
              (background · regulatory body · status · impact · strategy)
   │
   ▼
4. WRITE    — Claude Opus writes a 3-persona podcast script (~13–15 min)
              Personas: Alex (Host) · Jordan (Regulatory Expert) · Sam (Strategist)
   │
   ▼
5. AUDIO    — OpenAI TTS generates per-turn audio → pydub stitches final MP3
   │
   ▼
6. PUBLISH  — (Phase 3) RSS feed + audio uploaded to Backblaze B2
```

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-username/podcast-builder.git
cd podcast-builder
pip install -r requirements.txt
```

> **System dependency**: `ffmpeg` must be installed for audio stitching.
> - macOS: `brew install ffmpeg`
> - Ubuntu/Debian: `sudo apt-get install ffmpeg`

### 2. Configure API keys

```bash
cp .env.example .env
# Edit .env and fill in:
#   ANTHROPIC_API_KEY   — from console.anthropic.com
#   OPENAI_API_KEY      — from platform.openai.com  (needed for audio)
```

### 3. Run the pipeline

```bash
# Full run — scan → script → audio (MP3)
python pipeline.py

# Script only — skip TTS generation (much cheaper; use during prompt tuning)
python pipeline.py --skip-audio

# Research only — stop after regulation briefs
python pipeline.py --dry-run
```

Episode artifacts are saved to `data/episodes/YYYY-MM-DD/`:
- `raw_items.json`          — everything collected from sources
- `relevant_items.json`     — items that passed the relevance filter
- `regulation_briefs.json`  — structured Claude research per regulation
- `episode_script.json`     — full podcast script with speaker tags
- `episode_YYYY-MM-DD.mp3`  — final stitched audio (if audio step ran)

The pipeline checkpoints each stage. If it fails mid-way, re-running picks
up from where it left off.

## Configuration

| File | Purpose |
|---|---|
| `config/sources.yaml` | Regulatory source URLs per jurisdiction |
| `config/settings.yaml` | Models, episode settings, persona definitions |

### Add a new source

Edit `config/sources.yaml` and add an entry:
```yaml
- id: my_source
  name: "Agency Name"
  jurisdiction: "US"        # or EU, UK, SG, AU, CA, etc.
  type: rss                 # or: api (for Federal Register-style REST APIs)
  url: "https://agency.gov/feed.xml"
```

### Tune episode output

Edit `config/settings.yaml`:
- `episode.max_regulations` — how many regulations to cover per episode (default: 4)
- `episode.target_words` — target script length (default: 2000 words ≈ 13 min)
- `episode.min_relevance_score` — filter threshold 0–10 (default: 6)
- `episode.lookback_days` — how far back to scan (default: 7 days)

## Automated Weekly Runs (GitHub Actions)

The workflow at `.github/workflows/weekly_podcast.yml` runs every Monday at 09:00 UTC.

**Setup:**
1. Go to your repo → **Settings → Secrets and variables → Actions**
2. Add secrets: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`
3. The workflow auto-commits episode JSON artifacts and uploads the MP3 as a
   downloadable workflow artifact (retained 30 days)

**Manual trigger:** Go to **Actions → Weekly Podcast Generation → Run workflow**

## Roadmap

### Phase 1 — Intelligence Pipeline (current)
- [x] Scanner (Federal Register API + RSS feeds)
- [x] Relevance filter (Claude Haiku)
- [x] Research agent (Claude Opus)
- [x] Script writer agent (Claude Opus, 3 personas)
- [x] Audio generation (OpenAI TTS + pydub)
- [x] GitHub Actions weekly automation

### Phase 2 — Multi-Voice Upgrade
- [ ] Replace OpenAI TTS with ElevenLabs (3 distinct, high-quality voices)
- [ ] Add intro/outro music stitching
- [ ] Voice tuning per persona

### Phase 3 — Publishing
- [ ] RSS 2.0 feed generator (`feedgen`)
- [ ] Audio hosting on Backblaze B2
- [ ] GitHub Pages RSS feed deployment
- [ ] Submit feed to Apple Podcasts, Spotify for Podcasters, Amazon Music

## Estimated Monthly Costs

| Service | Usage | Cost |
|---|---|---|
| Anthropic Claude Opus 4.6 | Research + scripting (4 episodes) | ~$10–20 |
| Anthropic Claude Haiku 4.5 | Bulk filtering | ~$1–3 |
| OpenAI TTS (tts-1-hd) | Audio generation (4 episodes) | ~$5–12 |
| GitHub Actions | Weekly automation | Free (2,000 min/mo) |
| Backblaze B2 | Audio hosting (Phase 3) | ~$1–3 |
| **Total** | | **~$17–38/month** |

Upgrade to ElevenLabs in Phase 2 adds ~$22/month (Creator plan) for noticeably
higher audio quality and more expressive voice differentiation.

## Architecture Notes

This is a **prototype pipeline** (`pipeline.py`). Once script quality is validated,
the plan is to refactor into a proper multi-module package:

```
src/
├── agents/
│   ├── scanner.py        # Agent 1
│   ├── filter.py         # Agent 2
│   ├── researcher.py     # Agent 3
│   ├── scriptwriter.py   # Agent 4
│   ├── audio_producer.py # Agent 5
│   └── publisher.py      # Agent 6 (Phase 3)
├── models/               # Pydantic data models
├── utils/                # Shared helpers
└── orchestrator.py       # Pipeline runner
```
