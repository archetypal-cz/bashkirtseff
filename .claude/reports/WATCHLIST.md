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

- [ ] **Gallicism rates** — track frequency of gallicisms caught by GEM/RED/OPS per carnet. High rates may indicate translator needs updated guidance.
- [ ] **False friend frequency** — especially for Czech (ceremonie, kostým, kabinet) and English (sympathetic, actually, revolt/révolter, eve/veille, vilain/naughty). New EN false friends found in 008-010 run (2026-02-16).
- [ ] **Quality score trends** — CON scores should trend upward as skills improve. Czech baseline: 0.90-0.95. English baseline: HIGH (no numeric score yet). Ukrainian baseline: 0.93-0.955 (3 waves, trending upward: 0.94 → 0.947 → 0.952 avg).
- [ ] **Code-switch misidentification** — EN translators highlighted French idioms as English code-switches in 2 instances (009, 010). "It takes my breath away" and "that's all I'm saying!" were translated French idioms, not Marie writing in English. Needs confirmation — 1 report only (2026-02-16).

### Pipeline Efficiency

- [ ] **Gemini API rate limits** — track how often we hit quota. May need to space out GEM passes or batch differently.
- [ ] **Translator throughput variance** — some agents consistently faster than others. May indicate model or prompt differences.

### OPS vs GEM

- [ ] **OPS same-model blind spots** — theoretical concern: Opus reviewing Opus translations may share systematic blind spots. No evidence across 4 runs (264 entries), but keep monitoring. If 5 runs pass with no evidence, consider resolving. Reports: 2026-02-16-en-008-009-010.md, 2026-02-16-uk-006-008.md, 2026-02-17-uk-009-011.md, 2026-02-17-uk-012-014.md.

### Ukrainian-Specific

- [ ] **Dialogue formatting inconsistency** — some UK entries use `---` (3 hyphens) vs `—` (em dash) for dialogue. Should standardize across carnets. 1 report only, not re-observed in waves 2-3. Report: 2026-02-16-uk-006-008.md.
- [ ] **OPS fix rate trend** — declining across 3 UK waves: 0.42 → 0.28 → 0.22/entry (-48% total). Quality improving (0.94 → 0.947 → 0.952). Strong positive signal — translators producing better first drafts. Continue monitoring for plateau. Reports: 2026-02-16-uk-006-008.md, 2026-02-17-uk-009-011.md, 2026-02-17-uk-012-014.md.

## Resolved Issues

- [x] **OPS zero-corruption track record** — 3 runs (204 entries: EN 008-010 65 + UK 006-008 78 + UK 009-011 61), 0 corruption, 0 false positives across all. OPS is the preferred reviewer over GEM. GEM remains available for cross-model validation when desired. Resolved 2026-02-17.
- [x] **Russianisms checklist effectiveness** — 3 runs (199 entries), 0 overt russianisms from explicit checklist. Checklist baked into translator skill file (Language-Specific Guidance > Ukrainian). Resolved 2026-02-17.
- [x] **Subtle russianisms (calques)** — 3 runs. OPS 3-pass caught calques ("абсолютно", "факт у тому") and morphological russianisms (-ой endings) that the explicit checklist missed. Guidance baked into opus-editor skill file (Ukrainian section). Resolved 2026-02-17.
- [x] **3-pass OPS review value** — 3 UK runs confirmed. Fix rate: 0.42 → 0.28 → 0.22/entry. Each wave, OPS caught a distinct category the checklist missed (wave 1: false friends; wave 2: calques; wave 3: morphological). 3-pass review is proven valuable for Ukrainian. Resolved 2026-02-17.
- [x] **Agents being too chatty** — fixed by adding Agent Teams Protocol to all skills (idle behavior, when to message, when not to). Resolved 2026-02-12.
- [x] **Unnecessary RSR/LAN agents** — source preparation is complete for all 106 carnets. Stopped spawning RSR/LAN in translation pipeline. Resolved 2026-02-12.
- [x] **Per-carnet agent lifecycle** — adopted "one carnet = one agent" pattern to prevent context exhaustion. Works reliably. Resolved 2026-02-12.
- [x] **Self-review pass** — added three-phase translate (Think, Translate, Self-Review) to translator skill. Reduced gallicism rates. Resolved 2026-02-13.

## How to Update

- **New pattern observed once**: Add to Active Issues with a `[ ]` checkbox and "Needs confirmation" note
- **Pattern confirmed (3+ occurrences)**: Remove "Needs confirmation", add occurrence count
- **Pattern resolved**: Move to Resolved Issues with `[x]` checkbox and date
- **Teamcouch updates**: `/teamcouch` may propose additions/removals based on report analysis
