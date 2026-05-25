# Watchlist

Known patterns and recurring issues to monitor during team runs. Teamcouch reads this to know what to look for in reports.

## Active Issues

### Agent Lifecycle

- [ ] **Context exhaustion mid-carnet** — agents silently stop producing output, no error message. Context compaction fails. Most common with large carnets (35+ entries) or agents doing double-duty (reading originals + translations).
- [ ] **Agents that don't stop** — after completing their carnet, some agents check TaskList for more work instead of stopping. Wastes resources and can cause conflicts.
- [ ] **"interrupted" idle states** — agents go idle with reason "interrupted" without clear cause. May indicate context limit during external API call (e.g., Gemini). Needs investigation.
- [ ] **Agents going off-rails** — occasionally an agent misinterprets its task or starts doing work outside its scope. Usually recoverable with a message, but wastes time.
- [ ] **Shutdown acknowledgment delays** — agents sometimes take multiple idle cycles before responding to shutdown requests. Not harmful but noisy.
- [ ] **Conductor subagent type immediate idle/death** — conductor spawned as `conductor` subagent type went idle immediately without doing work (con), or partially completed then died mid-task marking it done prematurely (con-2). Workaround: spawn as `general-purpose`. Needs confirmation — 1 report only (2026-03-05-en-036-041).
- [ ] **Write tool path tracking bug** — when a translator agent attempts to `Read` a file that doesn't exist yet, the Write tool permanently blocks that path for the entire agent session. Workaround: pre-create empty placeholder files (`touch content/{lang}/{carnet}/*.md`) before spawning translators. Confirmed in 3 reports (en-065-070, en-093-106, en-091-103). ED skill should document this as standard practice.

### GEM Corruption Patterns

- [ ] **Inline GEM comments splitting paragraph text** — Gemini places `%% GEM: ... %%` mid-paragraph ~50% of the time, despite explicit prompt instructions. Currently caught by manual audit or RED review.
- [ ] **Gemini translating French in comments** — Gemini occasionally "translates" the French original text inside `%% ... %%` comments, corrupting the source reference.
- [ ] **Duplicate paragraph insertion** — Gemini copies a paragraph block, resulting in duplicate IDs and text.
- [ ] **Removed markup** — Gemini strips `==highlight==` markup on code-switches or removes footnote references.

### Translation Quality

- [ ] **Gallicism rates** — track frequency of gallicisms caught by GEM/RED/OPS per carnet. High rates may indicate translator needs updated guidance.
- [ ] **False friend frequency** — especially for Czech (ceremonie, kostým, kabinet) and English (sympathetic, actually, revolt/révolter, eve/veille, vilain/naughty). New EN false friends found in 008-010 run (2026-02-16).
- [ ] **Quality score trends** — CON scores should trend upward as skills improve. Czech: 0.937 avg (016-021) → 0.970 avg (022-027). Quality jump attributed to RED as general-purpose (direct fixes) and polarity check addition. English: stable at 0.95-0.96 range — plateau reached. Ukrainian: 0.94 → 0.947 → 0.952 → 0.953 → 0.952 → 0.96 avg — plateau at 0.95-0.96.
- [ ] **Orphaned footnotes** — translators define footnote definitions (`[^xxx]: ...`) but forget the in-text superscript marker (`[^xxx]`). 6 instances across 4 carnets and 2 of 3 translators in 042-047 run. tr-002 had zero in carnet 047. Caught by RED. Proposal: add footnote-linking self-check to translator skill. Reports: 2026-03-05-en-042-047. Needs confirmation — 1 report only.
- [ ] **Code-switch misidentification** — EN translators highlighted French idioms as English code-switches in 2 instances (009, 010). "It takes my breath away" and "that's all I'm saying!" were translated French idioms, not Marie writing in English. Needs confirmation — 1 report only (2026-02-16).
- [ ] **Footnote ID format inconsistency** — EN translators use two formats: `[^fn047-034]` (fn+carnet-seq) and `[^45.266.1]` (carnet.para.seq). Both valid markdown, but inconsistent across carnets. 125 occurrences of fn-format vs 58 of para-format. Consider standardizing. Reports: 2026-03-05-en-042-047, also observed across 001-003 and 036-047.

### Glossary Research

- [ ] **Paragraph ID granularity variance** — glossary research agents produce wildly different PID densities (16 PIDs/245 lines vs 70 PIDs/286 lines). Not a quality issue yet, but may cause confusion if PIDs are referenced elsewhere. Confirmed across 6 batches (50 entries). Not blocking. Reports: 2026-05-24-glossary-top15, 2026-05-25-glossary-research.
- [ ] **glossary-merge appends cruft** — the merge tool does "simple append" of the full source file content to the target, requiring manual cleanup after every merge. Consider adding a `--no-append` or `--clean` flag. 6 merges required manual cruft removal. Report: 2026-05-25-glossary-research.
- [ ] **GIOIA miscategorized as places/cities** — person entry (Amélie Gioia, demi-mondaine) filed under places/cities/ due to early auto-generation error. 222+ content links prevent easy move. Report: 2026-05-25-glossary-research.

### Pipeline Efficiency

- [ ] **Gemini API rate limits** — track how often we hit quota. May need to space out GEM passes or batch differently.
- [ ] **Translator throughput variance** — some agents consistently faster than others. May indicate model or prompt differences.

### OPS vs GEM

- [ ] **OPS same-model blind spots** — theoretical concern: Opus reviewing Opus translations may share systematic blind spots. No evidence across 4 runs (264 entries), but keep monitoring. If 5 runs pass with no evidence, consider resolving. Reports: 2026-02-16-en-008-009-010.md, 2026-02-16-uk-006-008.md, 2026-02-17-uk-009-011.md, 2026-02-17-uk-012-014.md.

### Ukrainian-Specific

- [ ] **Dialogue formatting inconsistency** — some UK entries use `---` (3 hyphens) vs `—` (em dash) for dialogue. Should standardize across carnets. 1 report only, not re-observed in waves 2-3. Report: 2026-02-16-uk-006-008.md.
- [ ] **Fix rate trend (UK)** — declining across 6 waves: 0.42 → 0.28 → 0.22 → 0.31 → 0.27 → 0.14/entry. Quality improving: 0.94 → 0.947 → 0.952 → 0.953 → 0.952 → 0.96. Plateau reached at 0.95-0.96. Reports: all 6 UK reports.
- [ ] **Cyrillic contamination** — Latin characters embedded in Cyrillic words ("Тумanchoфи"), Russian ё/ы in Ukrainian text, Chinese character 历. Appeared in 2 reports (2026-05-24). Not seen in Feb reports. May be model artifact. Watch for recurrence.
- [ ] **Fabricated words (cross-language)** — translators generate nonexistent words. Ukrainian: "збільшувально", "боянним", "спіла" (uk-018-022). Czech: "voitře" (cz-016-021). 3 reports across 2 languages. Translator skill updated with fabricated word warning (2026-05-24).
- [ ] **Agent message delivery unreliable** — agents complete tasks and mark them done, but completion messages don't reach team lead. Requires proactive task/file state checking. 2 instances across 2 reports (2026-05-24). Infrastructure issue.
- [ ] **Code-switch visibility loss (UK)** — Marie's deliberate Cyrillic "мене" inside French text becomes invisible in Ukrainian translation. CON resolved with footnote in 024.0207. 1 report only (2026-05-24-uk-023-025). Document as standard practice if recurs.

## Resolved Issues

- [x] **OPS zero-corruption track record** — 3 runs (204 entries: EN 008-010 65 + UK 006-008 78 + UK 009-011 61), 0 corruption, 0 false positives across all. OPS is the preferred reviewer over GEM. GEM remains available for cross-model validation when desired. Resolved 2026-02-17.
- [x] **Russianisms checklist effectiveness** — 3 runs (199 entries), 0 overt russianisms from explicit checklist. Checklist baked into translator skill file (Language-Specific Guidance > Ukrainian). Resolved 2026-02-17.
- [x] **Subtle russianisms (calques)** — 3 runs. OPS 3-pass caught calques ("абсолютно", "факт у тому") and morphological russianisms (-ой endings) that the explicit checklist missed. Guidance baked into opus-editor skill file (Ukrainian section). Resolved 2026-02-17.
- [x] **3-pass OPS review value** — 3 UK runs confirmed. Fix rate: 0.42 → 0.28 → 0.22/entry. Each wave, OPS caught a distinct category the checklist missed (wave 1: false friends; wave 2: calques; wave 3: morphological). 3-pass review is proven valuable for Ukrainian. Resolved 2026-02-17.
- [x] **Conductor subagent type lacks Edit access** — 7+ reports (all UK waves, EN 006-014, EN 015-018, EN 019-021, EN 036-041). Conductor subagent type only has Read/Grep/Glob despite SKILL.md declaring Edit/Write. Fix: spawn CON as `general-purpose` subagent type. Proven since 2026-02-27 (en-015-018). ED skill updated to default to general-purpose. Resolved 2026-03-05.
- [x] **Editor subagent type has no Edit access** — Resolved 2026-05-24: Switch RED to `general-purpose` subagent type. Confirmed zero corruption across 150 entries (cz-022-027). ED skill updated.
- [x] **Agents being too chatty** — fixed by adding Agent Teams Protocol to all skills (idle behavior, when to message, when not to). Resolved 2026-02-12.
- [x] **Unnecessary RSR/LAN agents** — source preparation is complete for all 106 carnets. Stopped spawning RSR/LAN in translation pipeline. Resolved 2026-02-12.
- [x] **Wikipedia link validation needed** — link checker agent validated 32 URLs across 15 entries, fixed 7 broken links (wrong article names, non-existent pages, markdown truncation). Remaining ~250+ links are lower-risk standard articles. Resolved 2026-05-25.
- [x] **Diary quote accuracy in glossary entries** — agents consistently cited specific carnet/paragraph references; spot-checks across multiple entries show quotes are accurate transcriptions from diary files. Resolved 2026-05-25.
- [x] **Breslau city/person disambiguation** — 348 [#Breslau] tags retargeted from auto-generated city stub to LOUISE_BRESLAU (the painter). City stub and BRESLAU_LOUISE redirect deleted. Resolved 2026-05-25.
- [x] **Glossary deduplication (14 entries)** — MLLE_COLLIGNON, 3x GALITZINE, 3x JULIAN variants, 2x BASTIEN, M_JULIAN, 2x CASSAGNAC père, 2x CASSAGNAC refs all merged into canonical entries using `just glossary-merge`. ~1,400 content links updated across ~1,200 files. Resolved 2026-05-25.
- [x] **Per-carnet agent lifecycle** — adopted "one carnet = one agent" pattern to prevent context exhaustion. Works reliably. Resolved 2026-02-12.
- [x] **Self-review pass** — added three-phase translate (Think, Translate, Self-Review) to translator skill. Reduced gallicism rates. Resolved 2026-02-13.

## How to Update

- **New pattern observed once**: Add to Active Issues with a `[ ]` checkbox and "Needs confirmation" note
- **Pattern confirmed (3+ occurrences)**: Remove "Needs confirmation", add occurrence count
- **Pattern resolved**: Move to Resolved Issues with `[x]` checkbox and date
- **Teamcouch updates**: `/teamcouch` may propose additions/removals based on report analysis
