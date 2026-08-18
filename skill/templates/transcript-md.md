# Transcript Template

Template for `video-analytics/{YYYY-MM-DD}-{slug}/transcript.md` — the link plus the full transcript for every video in the run.

**Purpose:** keep the source link and the words in one file, so a transcript is never orphaned from the video it came from.

---

## File Template

```markdown
# Transcript — {run title}

**Run:** {YYYY-MM-DD}
**Mode:** `{hook | condensed | forensic}`
**Videos in this run:** {n}
**Transcribed with:** openai-whisper `{model}` (local)

> **In `hook` mode the audio is trimmed to the first 20 seconds before transcription.** Every transcript below therefore covers `0:00-0:20` only, not the whole video. This banner is dropped for `condensed` and `forensic` runs, which transcribe the full length.

---

## 1. {video title}

| Field | Value |
| --- | --- |
| Link | {canonical url} |
| Channel / handle | {uploader} |
| Duration | {mm:ss} |
| Uploaded | {YYYY-MM-DD or unknown} |
| Views at pull | {n or unavailable} |
| Local file | `media/{basename}.mp4` |
| Audio | `audio/{basename}.wav` |
| Frames | `frames/{basename}-hook.jpg`, `frames/{basename}-body.jpg` |

### Full transcript

{full whisper text, paragraph-broken at natural pauses}

### Timed segments

| Start | End | Text |
| --- | --- | --- |
| 0:00 | 0:04 | {segment text} |
| 0:04 | 0:09 | {segment text} |

---

## 2. {next video title}

{same block, repeated per video}

---

## Notes

- {any transcription caveat: silent video, non-English audio, retried model, failed step + reason}
```

---

## Field Documentation

| Field | Source | Rule |
| --- | --- | --- |
| `{run title}` | first video's title | plus `+ N more` for a multi-video run |
| `{canonical url}` | `yt-dlp --print "%(webpage_url)s"` | for local files write `local file — {original path}` |
| `{model}` | the Whisper model actually used | never state a model you did not run |
| Full transcript | `r["text"]` | verbatim; break into paragraphs for readability, never reword |
| Timed segments | `r["segments"]` | real `start`/`end` values, formatted `m:ss` |
| Views at pull | extractor metadata | `unavailable` when the extractor returned none |

---

## Section Specifications

### Per-video metadata table

One table per video, always complete. A field the extractor did not return is written `unavailable`, never left blank and never guessed.

### Full transcript

The complete Whisper output, unedited. Paragraph breaks may be inserted at natural pauses for readability; words, order, and spelling stay exactly as transcribed. Do not silently correct a misheard product name — note it under Notes instead.

For a silent video write:

```markdown
### Full transcript

_No speech detected. This video carries its message through on-screen text and visuals; see `analysis.md` for the frame-by-frame read._
```

### Timed segments

Every segment Whisper returned, in order. This table is the source for the beat sheet in `analysis.md`, which is why the timestamps must be the measured ones. For videos over ~20 minutes, keep the full table anyway; it is the reason the file exists.

### Notes

Anything that would change how someone reads the transcript: a retry at a larger model, detected non-English audio, a video-only source where audio came from a separate stream, or a step that failed and why.
