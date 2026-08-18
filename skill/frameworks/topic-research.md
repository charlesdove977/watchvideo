<topic_research>

## Purpose

The video tells you what its creator believes. The web tells you whether that holds up. This framework turns the topic line from `hook-analysis.md` into 3-5 searches and a short, sourced research section — enough to act on the video, or to know not to.

---

## What the research section must answer

Four questions, in this order:

1. **State of play** — what is currently true about this topic, as of the run date
2. **Claim check** — does the video's central claim hold up, is it contested, or is it stale
3. **What it left out** — the thing someone acting on this video would hit and be unprepared for
4. **Where to go deeper** — 2-4 credible sources, each linked, each with a one-line note

---

## Building the searches

From the topic line, derive:

| Search | Shape | Example (topic: "Claude Code hooks for auto-formatting") |
| --- | --- | --- |
| Baseline | the topic, plainly | `Claude Code hooks auto-format on save` |
| Currency | topic + the current year | `Claude Code hooks 2026` |
| Claim | the video's specific assertion | `do Claude Code hooks run before or after tool use` |
| Counter | the topic + a skeptical term | `Claude Code hooks limitations problems` |
| Depth (optional) | topic + `documentation` or the primary source | `Claude Code hooks official docs` |

The **counter** search is not optional. Searching only the topic returns the same enthusiasm the video already gave you; searching against it is where the actual finding usually is.

---

## Source ranking

| Tier | What | Weight |
| --- | --- | --- |
| 1 | Primary source: official docs, the actual paper, the vendor changelog, the API reference | Highest |
| 2 | Practitioner writeups with reproducible detail (code, numbers, dates) | High |
| 3 | Reputable reporting and analysis | Medium |
| 4 | Aggregator posts, listicles, SEO chum | Ignore unless nothing better exists — and say so |

When tier 1 exists, cite it. A video's claim about a tool is settled by that tool's documentation, not by three blog posts summarizing each other.

---

## Writing it up

- Every factual sentence carries a link. Unlinked claims are the analyst's inference and must be labeled as such.
- A claim you could not verify is written `unverified` — not softened into vague prose that reads as confirmation.
- Note the check date explicitly. "Current as of `<run date>`" is part of the finding; topics move.
- Contradiction between the video and a tier-1 source is the highest-value output in the section. Lead with it, quote the video's version, quote or cite the source's, and say which one the reader should act on.

### Section shape

```markdown
## Topic research

**Topic:** <the topic line>
**Checked:** <YYYY-MM-DD>

**State of play.** <2-4 sentences, linked.>

**Claim check.** The video claims "<verbatim quote>". <Holds up / is contested / is out of date> — <evidence, linked>.

**What it leaves out.** <1-3 sentences on the gap someone acting on this would hit.>

**Sources**
- [Title](url) — what it is and why it matters
- [Title](url) — …
```

---

## Anti-patterns

| Anti-pattern | Why it is wrong |
| --- | --- |
| Skipping the counter search | returns only agreement; finds nothing |
| Citing an aggregator when the docs exist | a summary of a summary, with the errors of both |
| Presenting a search snippet as verified | snippets are stale, truncated, and sometimes wrong |
| Researching a category instead of the topic | "AI automation" returns noise; the specific claim returns evidence |
| Omitting the check date | the section silently rots and nobody knows when it was true |
| Padding with sources nobody read | a linked source implies it was opened |

</topic_research>
