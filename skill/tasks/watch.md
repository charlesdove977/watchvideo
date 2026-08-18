<purpose>
Take one or more videos from the user, run the full local analysis pipeline (download → frames → audio → transcript → vision → topic research), and write a self-contained run folder under `video-analytics/`.
</purpose>

<user-story>
As a creator or operator, I want a video torn down into its transcript, its hooks, its format, and what the web says about its topic, so that I can study or reuse what made it work without watching it five times with a notepad.
</user-story>

<when-to-use>
- User runs `/watchvideo` with or without a URL
- User pastes a video link and asks what it does, how it opens, or what it says
- Entry point routes here on every invocation
</when-to-use>

<context>
@context/output-paths.md
</context>

<references>
@frameworks/media-pipeline.md
@frameworks/hook-analysis.md
@frameworks/topic-research.md
@templates/transcript-md.md
@templates/analysis-md.md
@templates/custom-request-md.md
</references>

<steps>

## Step 0 — Preflight (once per run, before asking anything)

Check the four local dependencies and report only what is missing:

```bash
for b in yt-dlp ffmpeg ffprobe; do command -v "$b" >/dev/null || echo "MISSING: $b"; done
python3 -c "import whisper" 2>/dev/null || echo "MISSING: openai-whisper (python)"
```

| Missing | Fix to give the user |
| --- | --- |
| `yt-dlp` | `brew install yt-dlp` or `pipx install yt-dlp` |
| `ffmpeg` / `ffprobe` | `brew install ffmpeg` |
| `openai-whisper` | `pip install -U openai-whisper` |

If `yt-dlp` is missing but the user supplied a **local file**, continue — the download step is skipped anyway. If `ffmpeg` or Whisper is missing, stop and say so; there is no transcript without them.

## Step 1 — Interview (MANDATORY GATE — ask both, then STOP AND WAIT)

Ask these two questions together, in one message, and wait for the answer. Do not download anything first.

**Q1. Which video(s)?**
Accept: a YouTube / Instagram / TikTok / X / Vimeo URL, several URLs, or an absolute path to a local file. Multiple videos are one run and share one output folder.

**Q2. Anything particular you want out of this run?**
Ask this **every single run**, with no exception, even when the user already pasted a URL and said "just analyze it." Phrase it plainly:

> "Anything particular you want out of this one? (e.g. a rewrite of the hook, a script outline, a list of every claim made, a competitor comparison, a shot list.) If not, say 'standard' and I'll do the two default files."

- If the answer is a real request → it becomes a **third file** in the output folder, named after the request in kebab-case (`hook-rewrites.md`, `claims-audit.md`, `shot-list.md`).
- If the answer is "standard" / "no" / "nothing" → write only the two default files, and record `Custom request: none` in `analysis.md`.

Never skip Q2 because the request looks obvious. Never invent a custom file the user did not ask for.

## Step 2 — Create the run folder

Resolve the output root from `@context/output-paths.md` (default: `video-analytics/` in the current project). Then:

```bash
mkdir -p "<root>/<YYYY-MM-DD>-<slug>"/{media,audio,frames}
```

- `<YYYY-MM-DD>` is today's date from `date +%F`, never guessed.
- `<slug>` is kebab-case from the first video's title (fetch with `yt-dlp --get-title`), truncated to ~40 chars. For a multi-video run use the first title plus `-plus-N` (e.g. `2026-08-18-how-i-automate-outreach-plus-2`).
- If the folder already exists, append `-2`, `-3`, … Never overwrite a prior run.

## Step 3 — Download every video

Follow `@frameworks/media-pipeline.md` §Download. One video at a time; log the resolved title, duration, uploader, and canonical URL for each. Local files are copied into `media/` rather than downloaded, so the run folder stays self-contained.

Record per video, for later files:
- canonical URL (or `local file` + original path)
- title, uploader/handle, duration, upload date, view count if the extractor returned one

## Step 4 — Extract audio + frames

Follow `@frameworks/media-pipeline.md` §Extract.

- 16 kHz mono WAV per video into `audio/`
- One **hook contact sheet** per video into `frames/` (t=0,1,2,3,5s, tiled 5×1)
- One **body contact sheet** per video into `frames/` (5 frames evenly spaced across the remaining duration, tiled 5×1)

Two sheets per video keeps vision tokens flat regardless of length. For videos under 8 seconds, the hook sheet alone is enough — say so rather than producing a degenerate second sheet.

## Step 5 — Transcribe locally

Follow `@frameworks/media-pipeline.md` §Transcribe. Use `base.en` by default; `small.en` when the user asks for higher accuracy and accepts the slower run. Keep the segment timings — the beat sheet in `analysis.md` is built from real segment start/end values, never estimated.

If Whisper returns empty text, that is a finding, not a failure: the video has no speech. Record it as a text-and-music video and lean the analysis on the frames.

## Step 6 — Read the frames (vision)

Load every contact sheet in `frames/` with the Read tool. For each video record:
- What is on screen at t=0 (the visual hook)
- On-screen text, **verbatim**, at each sampled second
- What changes between t=0 → 1 → 2 → 3 → 5 (movement, cut rhythm, zoom)
- Setting, framing, and any proof artifact shown (dashboard, screen recording, result, receipt)
- The pattern interrupt, if there is one

Never describe a frame you did not actually load. If a sheet failed to render, mark that video's visual analysis `unavailable — <reason>`.

## Step 7 — Classify hooks, format, topic

Apply `@frameworks/hook-analysis.md` to each video. Produce:
- **Spoken hook** — the first sentence, quoted verbatim from the transcript, plus its hook type
- **Visual hook** — what the viewer sees in the first 3 seconds, plus its visual type
- **Format** — one primary format tag plus modifiers
- **Topic** — one specific topic line (not a category), plus 3-6 subtopics the video actually covers

## Step 8 — Research the topic on the web

Apply `@frameworks/topic-research.md`. Run 3-5 searches around the video's topic and its main claims. Capture, with links:
- What the current consensus or state of play is on this topic
- Whether the video's central claim holds up, is contested, or is out of date
- What the video left out that anyone acting on it would need
- 2-4 credible sources, each as a markdown link with a one-line note

Never present a search snippet as a verified fact without naming its source. If a claim cannot be checked, write `unverified` rather than hedging in prose.

## Step 9 — Write the output files

Write into the run folder from Step 2:

1. `transcript.md` — from `@templates/transcript-md.md`. Contains the link + metadata + full transcript for **every** video in the run.
2. `analysis.md` — from `@templates/analysis-md.md`. Contains spoken hook, visual hook, format, topic, beat sheet, and the topic research.
3. `<custom-slug>.md` — from `@templates/custom-request-md.md`, **only if** Q2 returned a real request.

Media stays in `media/`, `audio/`, `frames/` inside the same folder so the run is self-contained and portable.

## Step 10 — Report back

Print a short summary in chat: the run folder path (relative, clickable), one line per video (title → format → spoken hook in quotes), and the file list written. Do not paste the full transcript into chat.

</steps>

<output>
```
video-analytics/<YYYY-MM-DD>-<slug>/
├── transcript.md              ← link + metadata + full transcript per video
├── analysis.md                ← spoken hook, visual hook, format, topic, beats, web research
├── <custom-slug>.md           ← only when the user asked for something in Q2
├── media/                     ← downloaded mp4(s)
├── audio/                     ← 16 kHz mono wav(s)
└── frames/                    ← hook + body contact sheets
```
</output>

<acceptance-criteria>
- [ ] Both interview questions were asked and answered before any download
- [ ] Q2 ("anything particular you want out of this run?") was asked, verbatim in intent, even for a one-line request
- [ ] Every supplied video was downloaded, framed, and transcribed, or has a stated reason it was not
- [ ] Every contact sheet in `frames/` was actually loaded with Read before the visual hook was written
- [ ] Spoken hook and on-screen text are quoted verbatim, never paraphrased
- [ ] `transcript.md` carries the canonical link for every video
- [ ] `analysis.md` carries spoken hook, visual hook, format, topic, and web research with linked sources
- [ ] A custom file exists if and only if Q2 returned a real request
- [ ] The run folder is dated, unique, and self-contained (media + audio + frames inside it)
- [ ] Nothing was written outside the run folder
</acceptance-criteria>
