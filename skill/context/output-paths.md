# Output Paths

Where watchvideo writes. Read on every run; asked once and saved when unset.

---

## Output root

```
video-analytics/
```

Relative to the project you are running Claude Code in. If the user wants a different location (an absolute path, or a folder inside an existing content repo), ask once, then replace the value below and save this file so later runs stop asking.

**Configured root:** `video-analytics/` _(default — not yet customized)_

---

## Run folder

```
video-analytics/<YYYY-MM-DD>-<slug>/
├── transcript.md          ← link + metadata + full transcript, every video in the run
├── analysis.md            ← spoken hook, visual hook, format, topic, beats, web research
├── <custom-slug>.md       ← only when the run's Q2 answer was a real request
├── media/                 ← downloaded mp4(s)
├── audio/                 ← 16 kHz mono wav(s)
└── frames/                ← hook + body contact sheets
```

| Part | Rule |
| --- | --- |
| `<YYYY-MM-DD>` | from `date +%F` at run time; never guessed, never carried over from a previous run |
| `<slug>` | kebab-case of the first video's title, ~40 chars max |
| multi-video runs | one folder for the whole run; slug gets `-plus-N` (e.g. `-plus-2` for three videos) |
| collision | append `-2`, `-3`, … A prior run is never overwritten |

---

## Rules

- One run, one folder. Media, audio, frames, and markdown live together so the folder can be moved or shared whole.
- Never write outside the run folder. No stray files at the project root, no temp dirs elsewhere on disk.
- Never overwrite a previous run. Re-analyzing the same video on the same day creates `-2`.
- `video-analytics/` is generated output. Add it to `.gitignore` if the videos are large or the analysis is private — the markdown is small, the mp4s are not.

---

## .gitignore suggestion

Offer this once, on the first run in a git repo:

```gitignore
# watchvideo — keep the analysis, drop the media
video-analytics/**/media/
video-analytics/**/audio/
video-analytics/**/frames/
```

Markdown stays tracked; the heavy files do not.
