# Analysis Template

Template for `video-analytics/{YYYY-MM-DD}-{slug}/analysis.md` — the breakdown file: spoken hook, visual hook, format, topic, beats, and web research.

**Purpose:** say what the video actually did, in a shape that can be studied or copied, with the topic checked against the outside world.

---

## File Template

```markdown
# Analysis — {run title}

**Run:** {YYYY-MM-DD}
**Mode:** `{hook | condensed | forensic}`
**Videos:** {n}
**Custom request this run:** {the user's Q2 answer, verbatim — or `none`}

---

## 1. {video title}

**Link:** {canonical url}
**Duration:** {mm:ss} · **Uploaded:** {date} · **By:** {uploader}

**Sampled:** {n} frames at {1 per second | 1 per 3 seconds}, covering {0:00-0:20 | the full duration} · {n} sheet(s) · {n} of {total source frames} frames seen ({x.x}%)

### Spoken hook

> "{verbatim first sentence}"  — {0:00}

- **Type:** `{spoken hook type}`
- **Mechanism:** {what tension it opens, one line}
- **Payoff:** {when and whether the video closes it — timestamp, or `never closed`}

### Visual hook

- **Type:** `{visual hook type}`
- **t=0:** {what is on screen}
- **On-screen text:** "{verbatim}" {or `none`}
- **t=0→5 change:** {cuts, motion, zoom, subject change}
- **Proof artifact:** {what evidence is shown, or `none`}
- **Pattern interrupt:** {one concrete sentence, or `none`}

### Hook alignment

`{aligned | visual_carries | verbal_carries | mismatched | both_weak}` — {one line of why}

### Format

- **Primary:** `{format}`
- **Modifiers:** `{modifier}`, `{modifier}`
- **Cut rhythm:** {estimate, e.g. ~1 cut / 1.5 s}
- **CTA:** {what it asks for} at {timestamp} {or `no CTA`}

### Topic

**{one specific, searchable topic line}**

Covers:
- {subtopic}
- {subtopic}
- {subtopic}

### Beat sheet

_`condensed` and `forensic` only. In `hook` mode this section is omitted entirely; twenty seconds cannot produce a setup, body, or CTA._

| Time | Beat | Said | Shown |
| --- | --- | --- | --- |
| 0:00-0:03 | Hook | "{quote}" | {visual} |
| 0:03-0:18 | Setup | {summary} | {visual} |
| 0:18-1:05 | Body | {summary} | {visual} |
| 1:05-end | CTA | {summary} | {visual} |

### Edit rhythm

_`forensic` only. One frame per second means the cut points are measured, not estimated._

| Window | Cuts | Rhythm |
| --- | --- | --- |
| 0:00-0:10 | {n} | {e.g. 1 cut / 1.4 s} |
| 0:10-0:30 | {n} | {…} |

### Topic research

_`condensed` and `forensic` only. In `hook` mode write `Topic research: skipped (hook mode)` and nothing else._

**Checked:** {YYYY-MM-DD}

**State of play.** {2-4 sentences, linked.}

**Claim check.** The video claims "{verbatim quote}". {Holds up / contested / out of date} — {evidence, linked}.

**What it leaves out.** {1-3 sentences.}

**Sources**
- [{title}]({url}) — {why it matters}
- [{title}]({url}) — {why it matters}

---

## 2. {next video title}

{same block, repeated per video}

---

## Hook scoreboard

_Required for multi-video `hook` runs. This comparison is the reason the mode exists._

| # | Creator / title | Spoken hook (verbatim) | Hook type | Visual type | Alignment |
| --- | --- | --- | --- | --- | --- |
| 1 | {who} | "{quote}" | `{type}` | `{type}` | `{verdict}` |
| 2 | {who} | "{quote}" | `{type}` | `{type}` | `{verdict}` |

## Cross-video patterns

{Only for multi-video runs. What repeats across them: shared hook type, shared format, shared topic, and the one thing every video in the set did the same way.}

## Run notes

- {failures, skipped steps, unavailable visuals, anything that limits the analysis}
```

---

## Field Documentation

| Field | Source | Rule |
| --- | --- | --- |
| Custom request | the Q2 answer from Step 1 | quoted verbatim; `none` when the user said standard |
| Spoken hook quote | Whisper transcript | verbatim, with the real segment start time |
| Spoken hook type | `frameworks/hook-analysis.md` table | one of the listed types, including `none` |
| Visual fields | the hook contact sheet, read with Read | `unavailable — {reason}` if the sheet failed |
| On-screen text | frames | verbatim, including typos; `none` if there is no text |
| Format | `frameworks/hook-analysis.md` | one primary tag, any number of modifiers |
| Topic line | the video's actual content | specific enough to search; never a bare category |
| Beat sheet times | Whisper `segments` | measured, never estimated |
| Topic research | `frameworks/topic-research.md` | every factual sentence linked |

---

## Section Specifications

### Spoken hook

Quote the first complete sentence, not a summary of it, and give it the timestamp Whisper reported. A video that opens with "hey guys, welcome back" gets `type: none` and that is the finding, not a reason to look further into the video for a better sentence.

### Visual hook

Written only from frames that were actually loaded. Everything here is observation: what is in the frame, what text is on it, what changes. No inference from the transcript about what "must" be on screen.

### Hook alignment

One tag, one line. This is the section that most often produces the reusable insight, because the ear and the eye rarely get the same open.

### Format

Duration, cut rhythm, and CTA placement live here. A missing CTA is recorded as `no CTA` and gets a line in Run notes.

### Topic + Topic research

The topic line drives the searches, so sharpen it before searching. The research section follows `frameworks/topic-research.md` exactly, including the counter-search and the check date. Contradictions between the video and a tier-1 source lead the section.

### Cross-video patterns

Only written when the run had more than one video. Look for the repeated thing: same hook type across all of them, same format, same claim. One repeated tactic across three videos is worth more than three separate observations.

### Run notes

Every failure, skipped step, and unavailable read. A run that hid a failure is worse than a run that reported one.
