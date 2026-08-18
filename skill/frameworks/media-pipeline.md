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

### Hook contact sheet (t = 0, 1, 2, 3, 5 s, tiled 5×1)

```bash
ffmpeg -nostdin -loglevel error -y -i "<run>/media/<basename>.mp4" \
  -vf "select='eq(n\,0)+lt(abs(t-1),0.04)+lt(abs(t-2),0.04)+lt(abs(t-3),0.04)+lt(abs(t-5),0.04)',scale=304:-1,tile=5x1" \
  -frames:v 1 -q:v 4 "<run>/frames/<basename>-hook.jpg" </dev/null
```

### Body contact sheet (5 frames spread across the rest of the video)

```bash
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "<run>/media/<basename>.mp4")
ffmpeg -nostdin -loglevel error -y -i "<run>/media/<basename>.mp4" \
  -vf "select='lt(abs(t-$(echo "$DUR*0.2"|bc -l)),0.5)+lt(abs(t-$(echo "$DUR*0.4"|bc -l)),0.5)+lt(abs(t-$(echo "$DUR*0.6"|bc -l)),0.5)+lt(abs(t-$(echo "$DUR*0.8"|bc -l)),0.5)+lt(abs(t-$(echo "$DUR*0.95"|bc -l)),0.5)',scale=304:-1,tile=5x1" \
  -frames:v 1 -q:v 4 "<run>/frames/<basename>-body.jpg" </dev/null
```

**Why tile.** One image per video costs one vision read. Ten videos as individual frames is a hundred images and will not fit in context; ten videos as two sheets each is twenty. Tiling is the whole reason this scales.

Skip the body sheet for videos under 8 seconds and say why.

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
