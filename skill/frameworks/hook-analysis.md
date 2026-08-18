<hook_analysis>

## Purpose

How to classify what a video does in its first three seconds, and what shape it takes after that. Two hooks, never one: the **spoken** hook (what the ear gets) and the **visual** hook (what the eye gets). They are frequently different, and the mismatch between them is often the most useful finding in the whole analysis.

---

## Spoken hook

The first complete sentence out of the speaker's mouth, quoted **verbatim** from the Whisper transcript, with its timestamp. If the video opens silent, the spoken hook is `none — silent open through 0:0X`.

### Spoken hook types

| Type | What it does | Tell |
| --- | --- | --- |
| `contradiction` | states the opposite of the audience's assumption | "Everyone tells you X. X is wrong." |
| `specificity` | leads with an exact number or artifact | "$4,312 in 11 days" |
| `timeframe_tension` | puts a clock on the payoff | "In the next 90 seconds" |
| `confession` | admits a failure or cost | "I wasted six months on this" |
| `direct_address` | names the viewer's situation back to them | "If you're running an agency under $10k/mo" |
| `question` | opens a loop the viewer wants closed | "Why does nobody talk about…" |
| `pattern_interrupt` | a non-sequitur that stops the scroll | "Stop. Put the laptop down." |
| `demonstration` | narrates an action already underway | "Watch what happens when I…" |
| `authority` | leads with credential or scale | "After 400 client builds" |
| `none` | greeting, throat-clear, or logo sting | "Hey guys, welcome back" |

`none` is a real verdict and should be reported as such. A weak open is a finding.

### What to record

- The quote, verbatim, with its `start` timestamp from the Whisper segments
- The type from the table
- One line on the mechanism: what tension does it open, and does the video close it
- Whether the payoff arrives (and when), or the hook writes a check the body never cashes

---

## Visual hook

What is on screen from t=0 to roughly t=3, read off the hook contact sheet.

### Visual hook types

| Type | What the viewer sees |
| --- | --- |
| `face_reaction` | a human face, expressive, filling the frame |
| `text_hook` | a full-frame text card carrying the claim |
| `screen_demo` | a screen recording already mid-action |
| `result_reveal` | a dashboard, number, or finished artifact shown first |
| `b_roll_contrast` | two states cut against each other (before/after, chaos/calm) |
| `talking_head` | speaker at a desk, static framing, no motion device |
| `motion_open` | whip pan, zoom punch, or match cut as the opener |
| `object_focus` | a product or physical object held to camera |
| `static_low_signal` | logo, title card, or empty frame; nothing to hold on |

### What to record

- On-screen text at each sampled second, **verbatim** (this is where most hooks actually live)
- What changes between t=0 → 1 → 2 → 3 → 5: cut count, motion, zoom, subject change
- The proof artifact, if one is shown (dashboard, receipt, code, before/after)
- The pattern interrupt, if there is one, in one concrete sentence
- Framing and setting (handheld/tripod, indoor/outdoor, desk/studio/street)

---

## Hook alignment

Compare the two hooks explicitly. This section is required in `analysis.md`.

| Verdict | Meaning |
| --- | --- |
| `aligned` | the frames show what the words claim; they reinforce |
| `visual_carries` | the words are weak, the frame does the stopping |
| `verbal_carries` | the frame is generic, the sentence does the stopping |
| `mismatched` | they compete or contradict; attention splits |
| `both_weak` | nothing in the first three seconds earns the fourth |

---

## Format classification

One **primary** format, plus any modifiers that apply.

### Primary formats

| Format | Signature |
| --- | --- |
| `talking_head` | one person to camera, speech-driven |
| `screen_tutorial` | screen recording with narration, stepwise |
| `narrated_broll` | voiceover over cut footage, no on-camera speaker |
| `listicle` | enumerated segments with visible or spoken counters |
| `story` | a single narrative arc with a turn |
| `demo` | a thing being used or built, start to finish |
| `interview` | two or more voices in exchange |
| `ad` | a single offer with a CTA as the spine |
| `compilation` | assembled clips from multiple sources |
| `vlog` | day-in-the-life, loose structure |

### Modifiers

`captions_burned` · `fast_cut` (>1 cut/2s) · `slow_cut` · `music_bed` · `no_music` · `on_screen_text_heavy` · `face_cam_overlay` · `vertical` · `horizontal` · `chapters` · `sponsored_segment`

Also record: total duration, cut rhythm estimate, and where the CTA lands (timestamp + what it asks for).

---

## Topic

One line, specific enough to be searched. Then 3-6 subtopics the video **actually covers**, not what the title implies.

| Bad topic line | Why | Better |
| --- | --- | --- |
| "AI" | a category, not a topic | "Using Claude Code hooks to auto-format on save" |
| "Marketing tips" | unsearchable | "Cold email deliverability after Gmail's bulk-sender rules" |
| "How to grow" | no object | "Growing a Skool community from 0 to 100 paid members" |

The topic line feeds `topic-research.md` directly, so a vague topic line produces a useless research section. Sharpen it before searching.

---

## Beat sheet

Built from real Whisper segment timestamps. Never estimated.

```
0:00-0:03  Hook          "verbatim quote"                    [visual: what's on screen]
0:03-0:18  Setup         what problem gets framed             [visual: …]
0:18-1:05  Body          the actual content, beat by beat     [visual: …]
1:05-1:20  Proof         the demonstration or evidence        [visual: …]
1:20-end   CTA           exactly what is asked for            [visual: …]
```

Sections that do not exist in the video are omitted, not faked. A video with no CTA gets no CTA row, and that absence is worth a sentence in the analysis.

---

## Anti-patterns

| Anti-pattern | Why it is wrong |
| --- | --- |
| Paraphrasing the hook | the exact words are the artifact; a paraphrase is a different hook |
| Reporting one hook | the ear and the eye get different openings; both are signal |
| Calling a category a topic | produces web research nobody can use |
| Grading instead of describing | "great hook" teaches nothing; the type plus its mechanism does |
| Inferring visuals from the transcript | if the frames were not read, the visual hook is `unavailable` |
| Forcing a format tag | a video that fits none gets a described format, not a wrong label |

</hook_analysis>
