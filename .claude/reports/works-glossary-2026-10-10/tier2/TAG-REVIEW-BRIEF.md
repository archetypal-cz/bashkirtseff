# Works glossary tier 2 — tagging review (read-only judging)

Goal: decide, paragraph by paragraph, whether a diary paragraph really mentions the work, so the lead can tag it with the work's glossary entry. You READ and WRITE ONE JSON FILE; you edit nothing in the repo and run no git.

Input: `.claude/reports/works-glossary-2026-10-10/tier2/tag-review-NN.json` — `works`: list of works, each with `entry` (glossary file), `target` (path after `_glossary/`), `display`, `aliases`, and `candidates`: paragraphs that may mention the work (`pid`, `file` under `content/_original/`, `why` = inventory / alias hit / cited in entry, `existing_tags`, `french` = the first 700 chars). `flags` (batch 01 only): specific tag questions found by the researchers.

For every candidate, read the paragraph in `content/_original/<file>` (grep the pid when `file` is null) — the full French text, its footnotes and RSR/LAN notes — and, when needed, the glossary entry, which says what Marie says about the work and where. Decide:

- **tag** — the paragraph speaks of this work (sees it, reads it, sings it, quotes it, names it as a title, discusses its characters as the work's). Allusions by a recognisable title or a line of the work count. A paragraph can carry several work tags.
- **skip** — a homonym or figure of speech (a racehorse, a nickname, a hat, «faire l'Africaine»), the author alone without the work, another work with the same title, a common phrase that merely matches an alias (les domestiques = servants), a person's name that happens to be a title (Valentine, Honorine, Nelly as a person).
- When the paragraph is tagged with a WRONG entry for this mention (e.g. the opera where the play is meant, the Milo where the Medici Venus is meant), say so in `retag` with the tag to remove.

Rules of thumb: the Mignon aria, the Jewel Song (AIR_DES_BIJOUX_FAUST) etc. are tagged when the aria itself is sung or named, not for every Faust evening; Marie's quotations of a line count as a mention of the work; «Rossignou» as a name for the May party or for Audiffret is still the song's title and is tagged. If you are unsure, say `unsure` and explain in one line; the lead decides.

Output: `.claude/reports/works-glossary-2026-10-10/tier2/tag-decisions-NN.json`:
```json
{"decisions":[{"pid":"CCC.NNNN","target":"culture/…/ID.md","display":"Name","decision":"tag|skip|unsure","note":"≤ 20 words"}],
 "retag":[{"pid":"CCC.NNNN","remove":"culture/…/OLD.md","add":"culture/…/NEW.md or null","display":"Name or null","note":"…"}],
 "rsr_notes":[{"pid":"CCC.NNNN","note":"one sentence for a %% RSR %% comment (facts only, e.g. «Les Horaces here is David's painting, not Corneille»)"}]}
```
Every candidate gets exactly one decision (use the `target` and `display` given). Flags go into `retag` / `rsr_notes` / `decisions` as appropriate. Reply with counts (tag / skip / unsure, retags, notes) and anything odd.
