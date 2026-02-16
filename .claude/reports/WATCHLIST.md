# Watchlist

Known patterns and recurring issues to monitor during team runs. Teamcouch reads this to know what to look for in reports.

## Active Issues

### Agent Lifecycle

- [ ] **Context exhaustion mid-carnet** — agents silently stop producing output, no error message. Context compaction fails. Most common with large carnets (35+ entries) or agents doing double-duty (reading originals + translations).
- [ ] **Agents that don't stop** — after completing their carnet, some agents check TaskList for more work instead of stopping. Wastes resources and can cause conflicts.
- [ ] **"interrupted" idle states** — agents go idle with reason "interrupted" without clear cause. May indicate context limit during external API call (e.g., Gemini). Needs investigation.
- [ ] **Agents going off-rails** — occasionally an agent misinterprets its task or starts doing work outside its scope. Usually recoverable with a message, but wastes time.
- [ ] **Shutdown acknowledgment delays** — agents sometimes take multiple idle cycles before responding to shutdown requests. Not harmful but noisy.

### GEM Corruption Patterns

- [ ] **Inline GEM comments splitting paragraph text** — Gemini places `%% GEM: ... %%` mid-paragraph ~50% of the time, despite explicit prompt instructions. Currently caught by manual audit or RED review.
- [ ] **Gemini translating French in comments** — Gemini occasionally "translates" the French original text inside `%% ... %%` comments, corrupting the source reference.
- [ ] **Duplicate paragraph insertion** — Gemini copies a paragraph block, resulting in duplicate IDs and text.
- [ ] **Removed markup** — Gemini strips `==highlight==` markup on code-switches or removes footnote references.

### Translation Quality

- [ ] **Gallicism rates** — track frequency of gallicisms caught by GEM/RED per carnet. High rates may indicate translator needs updated guidance.
- [ ] **False friend frequency** — especially for Czech (ceremonie, kostým, kabinet) and English (sympathetic, actually).
- [ ] **Quality score trends** — CON scores should trend upward as skills improve. Czech baseline: 0.90-0.95. English baseline: 0.91-0.92.

### Pipeline Efficiency

- [ ] **Gemini API rate limits** — track how often we hit quota. May need to space out GEM passes or batch differently.
- [ ] **Translator throughput variance** — some agents consistently faster than others. May indicate model or prompt differences.

## Resolved Issues

- [x] **Agents being too chatty** — fixed by adding Agent Teams Protocol to all skills (idle behavior, when to message, when not to). Resolved 2026-02-12.
- [x] **Unnecessary RSR/LAN agents** — source preparation is complete for all 106 carnets. Stopped spawning RSR/LAN in translation pipeline. Resolved 2026-02-12.
- [x] **Per-carnet agent lifecycle** — adopted "one carnet = one agent" pattern to prevent context exhaustion. Works reliably. Resolved 2026-02-12.
- [x] **Self-review pass** — added three-phase translate (Think, Translate, Self-Review) to translator skill. Reduced gallicism rates. Resolved 2026-02-13.

## How to Update

- **New pattern observed once**: Add to Active Issues with a `[ ]` checkbox and "Needs confirmation" note
- **Pattern confirmed (3+ occurrences)**: Remove "Needs confirmation", add occurrence count
- **Pattern resolved**: Move to Resolved Issues with `[x]` checkbox and date
- **Teamcouch updates**: `/teamcouch` may propose additions/removals based on report analysis
