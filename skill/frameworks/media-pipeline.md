<media_pipeline>

## Purpose

The exact local commands that turn a video URL into things Claude can actually read: a file, a transcript, and a small set of images. Everything here is free and runs on the machine. No API key, no scraper credit, no MCP.

```
yt-dlp   → get the file
ffmpeg   → extract frames   (visual)
ffmpeg   → extract audio    (16 kHz mono wav)
whisper  → audio to text    (spoken)
vision   → read the frames  (Claude Code session)
```

All paths below are relative to the run folder created in Step 2 of `tasks/watch.md`. Use absolute paths in the actual commands.

---

## Download

### YouTube, TikTok, X, Vimeo, most sites

```bash
yt-dlp -q --no-warnings \
  -f "bv*[height<=720]+ba/b[height<=720]/b" --merge-output-format mp4 \
  --write-auto-sub --write-sub --sub-lang "en.*" --convert-subs srt \
  -o "<run>/media/<basename>.%(ext)s" "<url>"
```

720p is deliberate. Nothing in this analysis needs 4K, and the download finishes in a fraction of the time.

`--write-auto-sub` pulls the platform's own captions when they exist. They are a **cross-check**, not the transcript — auto-captions drop punctuation and mangle names. Whisper output is the transcript of record; keep the SRT alongside it and only reach for it if Whisper fails outright.

### Metadata without downloading

```bash
yt-dlp --no-warnings --print "%(title)s|%(uploader)s|%(duration)s|%(upload_date)s|%(view_count)s|%(webpage_url)s" "<url>"
```

Run this first — it gives the slug for the run folder and every metadata field the templates need.

### Local files

```bash
cp "<absolute source path>" "<run>/media/<basename>.mp4"
```

Copy rather than reference so the run folder stays portable.

### Download failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Requested format is not available` | no 720p rendition | retry `-f "b[height<=720]/bv*[height<=480]+ba/b"` |
| `HTTP Error 403: Forbidden` on video data, while the `.srt` still downloads | YouTube served a stream the installed yt-dlp cannot fetch (PO-token gating). Verified 2026-08-18 on yt-dlp `2026.07.04`: some videos 403 while others on the same channel download fine | yes — update yt-dlp first (`pip install -U yt-dlp`, or nightly `pip install -U --pre "yt-dlp[default]"`), then retry with `--extractor-args "youtube:player_client=tv,web_safari"` or `--cookies-from-browser chrome` |
| `--list-formats` returns only `mhtml` storyboards | same gating — the real formats were never extracted | same fix; if it persists after an update, report it and analyze the captions + storyboard instead of pretending the video was watched |
| `This video is DRM protected` | the client you forced returns a DRM manifest | try a different `player_client`; do not attempt to strip DRM |
| `Sign in to confirm you're not a bot` | rate limit / age gate | retry with `--cookies-from-browser chrome`; if it still fails, report it and move on |
| `Unsupported URL` | site has no extractor | ask the user for a direct media URL, then `curl -sL -o` it |
| download hangs | slow CDN | `--socket-timeout 30 --retries 3` |
| private / deleted video | not public | stop, say so, do not work around it |

Never use a logged-in session or a downloader that circumvents a paywall or an access control. Public video only.

---

## Extract

### Audio (16 kHz mono WAV — what Whisper wants)

```bash
ffmpeg -nostdin -loglevel error -y -i "<run>/media/<basename>.mp4" \
  -vn -ac 1 -ar 16000 "<run>/audio/<basename>.wav" </dev/null
```

Check the file actually has an audio stream first — some CDN files are video-only:

```bash
ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "<run>/media/<basename>.mp4"
```

Empty output = no audio track. Record the video as silent and analyze it on frames alone.

### The three modes

Frame density is the only real variable in this skill, and it is what the mode selects. Everything else follows from it.

| Mode | Window | Sampling | Audio transcribed | Use it for |
| --- | --- | --- | --- | --- |
| `hook` | **first 20 s only** | 1 frame / second = 20 frames | first 20 s only | a roster. 15 competitor reels stays 15 images |
| `condensed` *(default)* | whole video | 1 frame / 3 s | whole video | one reel, or getting the shape of a longform |
| `forensic` | whole video | 1 frame / second | whole video | a frame-by-frame teardown of one short |

**Tile geometry depends on orientation.** Check it once per video:

```bash
ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "<in>.mp4"
```

| Orientation | Cell width | `hook` tile | `condensed` / `forensic` tile | Frames per sheet |
| --- | --- | --- | --- | --- |
| Horizontal (w ≥ h) | `scale=304:-1` | `tile=5x4` | `tile=6x5` | 20 / **30** |
| Vertical (h > w) | `scale=250:-1` | `tile=10x2` | `tile=10x3` | 20 / **30** |

Verified sheet dimensions, 2026-08-18:

| Source | Mode | Sheets | Sheet size |
| --- | --- | --- | --- |
| 1280x720, 5 min | `hook` | 1 | 1520 x 684 |
| 1280x720, 5 min | `condensed` (100 frames) | 4 | 1824 x 855 |
| 1280x720, 5 min | `forensic` (300 frames) | 10 | 1824 x 855 |
| 1080x1920, 45 s | `hook` | 1 | 2500 x 888 |
| 1080x1920, 45 s | `forensic` (45 frames) | 2 | 2500 x 1332 |

### `hook` mode

Twenty seconds, one frame per second, one sheet. The rest of the video is downloaded but never sampled and never transcribed.

```bash
# 20 frames, one per second, ONE sheet  (horizontal; use scale=250 tile=10x2 for vertical)
ffmpeg -nostdin -loglevel error -y -t 20 -i "<run>/media/<basename>.mp4" \
  -vf "fps=1,scale=304:-1,tile=5x4" \
  -frames:v 1 -q:v 4 "<run>/frames/<basename>-hook.jpg" </dev/null

# audio, first 20 s only
ffmpeg -nostdin -loglevel error -y -t 20 -i "<run>/media/<basename>.mp4" \
  -vn -ac 1 -ar 16000 "<run>/audio/<basename>.wav" </dev/null
```

Videos shorter than 20 s are taken whole, and the report says so.

Trimming the audio is what makes a roster run fast: Whisper scales with audio length, so capping at 20 s turns a 12-minute video into a few seconds of transcription.

### `condensed` mode (default)

```bash
ffmpeg -nostdin -loglevel error -y -i "<run>/media/<basename>.mp4" \
  -vf "fps=1/3,scale=304:-1,tile=6x5" \
  -q:v 4 "<run>/frames/<basename>-%02d.jpg" </dev/null
```

### `forensic` mode

```bash
ffmpeg -nostdin -loglevel error -y -i "<run>/media/<basename>.mp4" \
  -vf "fps=1,scale=304:-1,tile=6x5" \
  -q:v 4 "<run>/frames/<basename>-%02d.jpg" </dev/null
```

The last sheet of a `condensed` or `forensic` run is partial when the frame count is not a multiple of 30. ffmpeg emits it with the unused cells padded; that is expected, not a failure.

### Sheet math — compute it BEFORE cutting frames

`ffprobe` gives the duration before a single frame is extracted, so the cost is always knowable up front. Never guess it.

```
frames  = duration_seconds / interval        (interval: 1 for forensic, 3 for condensed)
sheets  = ceil(frames / 30)                  (hook is always exactly 1)
```

| Duration | `hook` | `condensed` | `forensic` |
| --- | --- | --- | --- |
| 45 s reel | 1 sheet | 1 sheet | 2 sheets |
| 3 min | 1 sheet | 2 sheets | 6 sheets |
| 10 min | 1 sheet | 7 sheets | 20 sheets |
| 40 min | 1 sheet | 27 sheets | 80 sheets |
| 2 hr | 1 sheet | 80 sheets | 240 sheets |

**The 15-sheet gate.** If the computed total across all videos in the run exceeds **15 sheets**, stop and show the user the real math plus the cheaper alternative, then wait for a decision:

```
A 40 minute video in forensic mode is 2,400 frames, 80 sheets.
That will not fit in one context window.
  condensed  →  27 sheets
  hook       →  1 sheet
Which do you want?
```

Under 15 sheets, just run. Do not ask on every video; the gate exists for the genuinely expensive case.

**Why tile at all.** One image per sheet costs one vision read. A 10-minute video at 1 fps as loose files is 600 images and will not fit in any context window; the same 600 frames tiled is 20 images. Tiling is the whole reason this scales, and it is what separates sampling from dumping a folder full of JPEGs.

---

## Transcribe

```python
import whisper, json, sys

model = whisper.load_model("base.en")          # small.en when accuracy matters more than speed
r = model.transcribe(wav_path, fp16=False, language="en", verbose=False)

r["text"]      # full transcript, one string
r["segments"]  # [{"start": 0.0, "end": 3.2, "text": "..."}, ...]
```

| Model | Speed | Use when |
| --- | --- | --- |
| `tiny.en` | fastest | throwaway gist of a long video |
| `base.en` | default | every normal run |
| `small.en` | ~3× slower | accents, jargon, or the user asks for accuracy |

**Keep the segments.** The beat sheet in `analysis.md` is built from real `start`/`end` values. A timestamp that was estimated instead of measured is a fabricated timestamp.

Non-English audio: drop `language="en"` and use the multilingual model (`base` instead of `base.en`); note the detected language in the output file.

### Transcription failures

| Symptom | Cause | Retryable |
| --- | --- | --- |
| empty `text` | no speech (music/text-only video) | no — record it as a finding |
| garbled text | heavy accent, low bitrate, or music bed | yes — retry with `small.en` |
| `FileNotFoundError` on ffmpeg | ffmpeg not on PATH inside Python | yes — pass the absolute wav path; confirm `command -v ffmpeg` |
| runs forever | huge file on CPU | yes — confirm duration first; warn the user before transcribing anything over ~40 min |

---

## Vision

Load each contact sheet with the **Read** tool. That is the entire mechanism: the frames become images in context, and the session reads them. No vision API, no key.

Rules:
- Quote on-screen text **verbatim**. Never clean it up, never translate it silently.
- Report what is visible, not what the transcript implies should be visible.
- If a sheet is unreadable (black frames, render failure), say `visual: unavailable — <reason>` rather than guessing.

---

## Cost

Zero, every run. The download is bandwidth, the extraction is CPU, the transcription is CPU, the vision read is session context. The only paid surface anywhere near this skill is the web research in `topic-research.md`, which uses the session's own search.

## Anti-patterns

| Anti-pattern | Why it is wrong |
| --- | --- |
| Sending individual frames instead of contact sheets | blows up context for zero extra signal |
| Trusting platform auto-captions as the transcript | no punctuation, wrong names, silently truncated |
| Estimating timestamps for the beat sheet | invented data presented as measurement |
| Downloading at max quality | minutes of wait for pixels nothing reads |
| Working around an age gate, login wall, or paywall | out of scope; public video only |
| Leaving media in a temp dir | run folder must be self-contained and portable |

</media_pipeline>
