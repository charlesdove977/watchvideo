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

## Step 1 — Interview (MANDATORY GATE — ask all three, then STOP AND WAIT)

Ask these three questions together, in one message, and wait for the answer. Do not download anything first.

**Q0. Which mode?**

| Mode | What it looks at | Cost |
| --- | --- | --- |
| `hook` | **first 20 seconds only**, 1 frame/sec, audio trimmed to 0:20 | 1 sheet per video, flat, however long the video is |
| `condensed` *(default)* | whole video, 1 frame every 3 seconds, full audio | ~1 sheet per 90 s |
| `forensic` | whole video, 1 frame every second, full audio | ~1 sheet per 30 s |

Suggest a default rather than asking blind:

- **3 or more videos** in the run → suggest `hook`
- **1 video under 90 s** → suggest `condensed`
- `forensic` is never automatic. It is always chosen deliberately.

**Q1. Which video(s)?**
Accept: a YouTube / Instagram / TikTok / X / Vimeo URL, several URLs, or an absolute path to a local file. Multiple videos are one run and share one output folder.

**Q2. Anything particular you want out of this run?**
Ask this **every single run**, with no exception, even when the user already pasted a URL and said "just analyze it." Phrase it plainly:

> "Anything particular you want out of this one? (e.g. a rewrite of the hook, a script outline, a list of every claim made, a competitor comparison, a shot list.) If not, say 'standard' and I'll do the two default files."

- If the answer is a real request → it becomes a **third file** in the output folder, named after the request in kebab-case (`hook-rewrites.md`, `claims-audit.md`, `shot-list.md`).
- If the answer is "standard" / "no" / "nothing" → write only the two default files, and record `Custom request: none` in `analysis.md`.

Never skip Q2 because the request looks obvious. Never invent a custom file the user did not ask for.

**Then, before extracting anything: run the sheet math.** `ffprobe` the duration of every video, compute the sheet count for the chosen mode (see `@frameworks/media-pipeline.md` §Sheet math), and if the run total exceeds **15 sheets**, stop, print the real numbers with the cheaper alternatives, and wait for a decision. Under 15, proceed without asking.

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

## Step 4 — Extract audio + frames (per the chosen mode)

Follow `@frameworks/media-pipeline.md` §Extract. Check orientation first with `ffprobe`; vertical video uses different tile geometry than horizontal.

| Mode | Frames written to `frames/` | Audio written to `audio/` |
| --- | --- | --- |
| `hook` | `<basename>-hook.jpg`, exactly 1 sheet, 20 frames from 0:00-0:20 | 16 kHz mono WAV, **trimmed to the first 20 s** |
| `condensed` | `<basename>-01.jpg`, `-02.jpg`, … 30 frames per sheet at 1/3 s | 16 kHz mono WAV, full length |
| `forensic` | `<basename>-01.jpg`, `-02.jpg`, … 30 frames per sheet at 1 fps | 16 kHz mono WAV, full length |

Record the actual numbers for each video: frames sampled, total frames in the source, sheet count, and sampling interval. `analysis.md` stamps these, so they must be measured, not assumed.

## Step 5 — Transcribe locally

Follow `@frameworks/media-pipeline.md` §Transcribe. Use `base.en` by default; `small.en` when the user asks for higher accuracy and accepts the slower run. Keep the segment timings — the beat sheet in `analysis.md` is built from real segment start/end values, never estimated.

In `hook` mode the WAV is only the first 20 seconds, so the transcript is only the first 20 seconds. Say that in `transcript.md` rather than presenting a partial transcript as a whole one.

If Whisper returns empty text, that is a finding, not a failure: the video has no speech. Record it as a text-and-music video and lean the analysis on the frames.

## Step 6 — Read the frames (vision)

Load every contact sheet in `frames/` with the Read tool, in order. A `condensed` or `forensic` run has several sheets per video; read them all, and remember that in those modes each cell is one sampled second (or one per 3 s), left to right, top to bottom, so a cell's position IS its timestamp.

For each video record:
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

**What each mode can honestly produce.** A section the mode did not see is dropped, never inferred:

| Section | `hook` | `condensed` | `forensic` |
| --- | --- | --- | --- |
| Spoken hook + type | yes | yes | yes |
| Visual hook + type | yes | yes | yes |
| Hook alignment | yes | yes | yes |
| Opening 20 s beat-by-beat | yes | partial | yes |
| Full beat sheet (setup/body/CTA) | **dropped** | yes | yes |
| CTA + its timestamp | **dropped** | yes | yes |
| Topic line + subtopics | from the hook only, and labelled as such | yes | yes |
| Cut rhythm / edit pacing | rough, 20 s only | rough | **measured, second by second** |

In `hook` mode, add a **hook scoreboard**: one table across every video in the run, with the verbatim spoken hook, hook type, visual type, and alignment verdict per row. That comparison is the entire point of running a roster.

## Step 8 — Research the topic on the web

**Skipped in `hook` mode** — twenty seconds is not enough to know what a video claims, and researching a guess produces a sourced-looking section built on nothing. Say `Topic research: skipped (hook mode)` in the file.

For `condensed` and `forensic`, apply `@frameworks/topic-research.md`. Run 3-5 searches around the video's topic and its main claims. Capture, with links:
- What the current consensus or state of play is on this topic
- Whether the video's central claim holds up, is contested, or is out of date
- What the video left out that anyone acting on it would need
- 2-4 credible sources, each as a markdown link with a one-line note

Never present a search snippet as a verified fact without naming its source. If a claim cannot be checked, write `unverified` rather than hedging in prose.

## Step 9 — Write the output files

Write into the run folder from Step 2:

1. `transcript.md` — from `@templates/transcript-md.md`. The link + metadata + transcript for **every** video in the run. In `hook` mode the transcript covers 0:00-0:20 only and says so at the top of each block.
2. `analysis.md` — from `@templates/analysis-md.md`. Spoken hook, visual hook, format, topic, plus whatever the chosen mode can honestly support (see the table in Step 7). The sampling stamp goes at the top.
3. `<custom-slug>.md` — from `@templates/custom-request-md.md`, **only if** Q2 returned a real request.

Media stays in `media/`, `audio/`, `frames/` inside the same folder so the run is self-contained and portable.

## Step 10 — Report back

Print a short summary in chat: the mode used, the run folder path (relative, clickable), one line per video (title → format → spoken hook in quotes), the sheet count, and the file list written. Do not paste the full transcript into chat.

</steps>

<output>
```
video-analytics/<YYYY-MM-DD>-<slug>/
├── transcript.md              ← link + metadata + transcript per video
├── analysis.md                ← sampling stamp, spoken hook, visual hook, format, topic,
│                                beats + web research (condensed / forensic),
│                                hook scoreboard (hook mode, multi-video runs)
├── <custom-slug>.md           ← only when the user asked for something in Q2
├── media/                     ← downloaded mp4(s)
├── audio/                     ← 16 kHz mono wav(s), trimmed to 20 s in hook mode
└── frames/                    ← contact sheets: 1 in hook mode, numbered otherwise
```
</output>

<acceptance-criteria>
- [ ] All three interview questions were asked and answered before any download
- [ ] Q2 ("anything particular you want out of this run?") was asked, verbatim in intent, even for a one-line request
- [ ] Sheet math was computed from real `ffprobe` durations before frames were cut, and the 15-sheet gate was honoured
- [ ] Every supplied video was downloaded, framed, and transcribed, or has a stated reason it was not
- [ ] The tile geometry matched the video's orientation (vertical vs horizontal)
- [ ] Every contact sheet in `frames/` was actually loaded with Read before the visual hook was written
- [ ] `analysis.md` stamps the real sampling rate, frames sampled, total frames, and sheet count per video
- [ ] Sections the mode could not honestly support were DROPPED, not inferred (no beat sheet or CTA timestamp in `hook` mode, no topic research in `hook` mode)
- [ ] Spoken hook and on-screen text are quoted verbatim, never paraphrased
- [ ] `transcript.md` carries the canonical link for every video, and marks hook-mode transcripts as covering 0:00-0:20 only
- [ ] A hook scoreboard exists for multi-video `hook` runs
- [ ] A custom file exists if and only if Q2 returned a real request
- [ ] The run folder is dated, unique, and self-contained (media + audio + frames inside it)
- [ ] Nothing was written outside the run folder
</acceptance-criteria>
