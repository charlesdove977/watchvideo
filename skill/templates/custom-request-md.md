# Custom Request Template

Template for `video-analytics/{YYYY-MM-DD}-{slug}/{custom-slug}.md` — the third file, written **only** when the user answered the "anything particular you want out of this run?" question with a real request.

**Purpose:** give the run's specific ask its own deliverable, instead of burying it inside the standard analysis.

---

## When this file exists

| Q2 answer | File written |
| --- | --- |
| "rewrite the hook five ways" | `hook-rewrites.md` |
| "list every claim they make" | `claims-audit.md` |
| "give me a shot list I could reshoot" | `shot-list.md` |
| "compare it to my last video" | `comparison.md` |
| "pull the tools they mention" | `tools-mentioned.md` |
| "standard" / "no" / "nothing" | **no file** |

The filename is kebab-case, derived from the request itself. Do not use a generic name like `custom.md` or `extra.md` — six months later the filename is the only index.

---

## File Template

```markdown
# {Request title}

**Run:** {YYYY-MM-DD}
**Source:** [`analysis.md`](analysis.md) · [`transcript.md`](transcript.md)
**Request, verbatim:** "{the user's Q2 answer, exactly as they typed it}"

---

## What was asked

{One or two sentences restating the request as an executable job, including any scope you had to decide. If the request was ambiguous and you picked an interpretation, say which one and why.}

---

## {Deliverable}

{The actual work, in whatever shape the request calls for: a list, a table, a rewritten script, a comparison, a set of prompts. Structure follows the request, not this template.}

---

## Basis

{Which parts of the run this was built from — specific timestamps, specific frames, specific transcript lines. A deliverable that cannot point back at the source video is an opinion, not an analysis.}

## Limits

{What the request asked for that the run could not support, and why. Omit this section only when there is nothing to say.}
```

---

## Field Documentation

| Field | Rule |
| --- | --- |
| `{Request title}` | Title Case of the kebab filename |
| Request, verbatim | exactly what the user typed; never cleaned up or summarized |
| What was asked | names any interpretation you made on an ambiguous request |
| Deliverable | shape follows the request; do not force it into headings it does not need |
| Basis | cites real timestamps, frames, or transcript lines from this run |
| Limits | states what could not be answered rather than padding around it |

---

## Section Specifications

### Deliverable

This is the whole point of the file, and it is the one section with no fixed shape. A hook rewrite request produces five quoted hooks with their types. A claims audit produces a table of claim / timestamp / verifiable yes-no / source. A shot list produces numbered shots with durations. Match the shape to the ask.

### Basis

Every claim in the deliverable traces back to something in this run: a transcript line with its timestamp, a specific contact sheet, or a source from the topic research. This is what separates the file from a chat answer.

### Limits

If the user asked for something the video could not support (retention data, audience demographics, why a video performed), say so plainly here and name what would be needed to answer it. Do not substitute a guess dressed as analysis.

---

## Anti-patterns

| Anti-pattern | Why it is wrong |
| --- | --- |
| Writing this file when Q2 said "standard" | clutters the run with work nobody asked for |
| Naming it `custom.md` | unsearchable in a folder of thirty runs |
| Restating `analysis.md` under a new heading | the third file exists to add, not to echo |
| Answering a question the video cannot answer | fabricates data; use Limits instead |
| Dropping the verbatim request | the ask is the spec; without it nobody can check the work |
