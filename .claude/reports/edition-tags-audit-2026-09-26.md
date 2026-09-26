# Edition-provenance tags audit — #Censored_1887 / #Kernberger (2026-09-26)

Status: DONE for Option A (high-precision fixes). Not committed. Companion files:
- `edition-tags-audit-2026-09-26-changes.tsv`: every _original change (pid, file, tag, +/-, evidence/score). There are 6,564 rows.
- `edition-tags-audit-2026-09-26-kernberger-verdicts.tsv`: all 244 blind bilingual meaning verdicts.
- The scripts are in the session scratchpad: `cen_decide.py`, `kern_score*.py`, `kern_decide.py`, `apply_tags.py`, `diffcheck.py`, `verify_tree.py`. They are not in the repo; ask to have them ported into `src/scripts/`.

## Tag rule (including partials)

- `#Censored_1887` means that text from this paragraph was printed in the 1887 Charpentier edition. Our OCR source is the 1903 Fasquelle reprint. The print can be whole, abridged or lightly reworded.
  - Tag if at least one of these holds:
    - A verbatim run of ≥15 words appears anywhere in the edition.
    - Inside the edition region bracketed by neighbouring matches: a ≥8-word run, or ≥10 matched words making up ≥20% of the paragraph, or (for paragraphs under 25 words) ≥50% of the words matched.
    - Very short lines (date headings, dialogue) match exactly between printed neighbours.
  - Do not tag when only a stock phrase coincides, or when the paragraph has no visible text.
- `#Kernberger` means Kernberger 2013 translates the paragraph, in whole or a substantive part (at least one full clause with real content). Sharing names or topic is not enough.
- Partials count as tagged. The tag therefore never means "printed in full". See the frontend note below.

## Method

**Censored_1887.** The old matcher only compared the edition with the original entry by entry, by date. Its OCR date parser found only 17, 14 and 6 entries for 1873, 1874 and 1875. As a result, almost everything outside the parsed dates was missed.

The new matcher:
1. Builds a word 4-gram index over the full OCR of vol1+vol2. Line-break hyphens are rejoined using a lexicon, and year tokens are dropped.
2. Takes every verbatim run of ≥15 words as a candidate anchor, and keeps the longest monotone chain of anchors (3,342 of 3,430).
3. Scores every other paragraph only inside the edition region between its neighbouring anchors: 4-gram and rare-trigram clustered coverage, ordered bag-matching for short lines, and exact sequence matching for 1–6-word lines.

**Kernberger.** There is no MT or embedding model available on this box (1 GB RAM). The matcher therefore uses dictionary-based FR→EN overlap:
- Features: MUSE fr-en and en-fr dictionaries, Snowball stems, cognates and proper nouns, IDF weighting.
- Scoring: each paragraph is scored against the EPUB paragraphs dated ±2 days, and thresholds are calibrated against a null (random other-year entries).
- Anchors: matches at ≥99.9% of the null, kept only if they form a monotone chain (6,476).
- Second pass: bracketed scoring between anchors.

Four blind bilingual subagent packs, 244 paragraphs in all, then judged a stratified sample by meaning.

## Hand verification

**Censored_1887 (≥60 checked by me, across carnets 000–106 and every evidence class):**
- Removals: all 22 flagged paragraphs checked; 5 removed.
  - Not in the OCR: 064.0286 "Inutiles élans", 081.0466, 084.0214. Confirmed with a line-joined grep.
  - Empty dedup stubs: 082.0114 and 082.0144.
  - Printed despite the flag, so kept: 063.0222, 063.0339, 064.0384, 092.0267.
- Additions (all correct):
  - `local`: 14 of 14, including rewordings such as 101.0451 and 034.0438.
  - `bag` (after tightening): 10 of 10.
  - `shortseq`: 8 of 8 plausible.
  - Early-carnet runs (002, 011, 013, 043, 044, 000): 6 of 6.
- Rejected candidates: 26 checked.
  - One miss, 056.0207; the rule was fixed afterwards.
  - One fragment below the rule, 004.0004, left untagged.

**Kernberger (244 meaning verdicts; the full list is in the TSV):**

| Group | Verdict |
|---|---|
| Existing tags the matcher confirms | 26/26 YES |
| "Strong" additions | 8/8 YES |
| Other lexical additions | 30/45 YES in round 1, 31/38 YES in round 2 |
| Old tags the matcher could not confirm | 15 YES, 26 NO, 4 unsure (round 1). Round 2: retained 9/15 YES, removal candidates 5/19 YES |
| Untagged with lexical signal | 8/34 YES |
| Untagged with no signal | 0/8 |

The lexical matcher fails on short dialogue lines and abridged partials in both directions.

## Changes applied (Option A)

**_original** (1,723 files):

| Tag | Added | Removed | Evidence |
|---|---|---|---|
| Censored_1887 | 3,308 | 5 | All additions on the evidence classes above |
| Kernberger | 3,185 | 66 | Additions: 3,101 strong anchors + 84 meaning-verified. Removals: 46 meaning-verified NO + 20 paragraphs with no visible text |

Everything else was left as it was.

**Translations synced to _original per paragraph ID:**

| Tree | Files | Tag operations |
|---|---|---|
| cz | 1,694 (064–070 skipped) | 6,781 |
| en | 2,049 | 10,602 |
| fr | 1,740 | 6,622 |

- Each tree now carries exactly the _original two-tag set on every paragraph ID. Per-paragraph re-parse: en 0 mismatches, fr 0, cz 0 outside deferred files.
- uk: not touched.

**Deferred, because another agent has the files open or they are in a skip zone.** Dry-run lists are in the scratchpad (`pending_*.json`):
- `_original/068`: 5 files, 65 operations (another agent is restoring source text there).
- `cz/064–072`: 133 files, 1,070 operations. This includes 22 files in cz/071–072 that were dirty from the fablelous agent.
- `uk`: 1,881 files, 8,253 operations.

To apply any of these later: `python3 apply_tags.py <tree> --write`, which is idempotent.

## Estimated accuracy (rough, from stratified samples)

| Tag | Precision before | Recall before | Precision now | Recall now |
|---|---|---|---|---|
| Censored_1887 | ≈99.8% | ≈45% (2,697 of ≈6,000) | ≈98–99% | ≈97% |
| Kernberger | ≈73% | ≈45% | ≈87% | ≈73% |

The Kernberger residual error is estimated at about 900 wrong old tags left in place (unconfirmed, not disproved) and about 4,000 untranslated-looking paragraphs that Kernberger does translate. Closing that gap needs Option B: an entry-by-entry meaning alignment by subagents, about 11M characters of reading.

## Gates

See the "Gate results" section below.

## Frontend and wording findings

- The **Editions filter** ("Kernberger (2013)", "Charpentier (1887)") does not read paragraph tags. It reads the _original frontmatter flags `workflow.censored_1887_included` and `kernberger_covered` (`src/frontend/src/lib/filter-index-builder.ts:212`).
  - After this fix, 456 entries have Censored paragraphs but no flag, and 314 entries have the same gap for Kernberger.
  - 1 and 2 entries respectively have the flag but no tagged paragraph.
  - The flags were not changed, because that was outside the allowed scope. The list is in `fm_mismatch.json` in the scratchpad. A one-step follow-up would recompute the flags from the paragraph tags.
- `CENSORED_1887.md` has problems:
  - "Tag Meaning" says the paragraph "appeared in the 1887 … edition". Many tagged paragraphs were printed only in part or reworded, so the page should say "printed in whole or in part".
  - Its stats are stale: "~2,700 paragraphs, ~60 carnets" is now about 6,000 paragraphs in about 95 carnets.
  - The claim that "earlier years match poorly because the edition rewrote text" is wrong: the date parser was the cause.
- `KATHERINE_KERNBERGER.md` says "paragraphs for which an English translation is available". This needs the same "in whole or in part" caveat.
- The glossary page footers, the Kernberger report (`content/_raw/reports/kernberger_matching.*`) and `epub_kernberger.py tag` all still describe or produce the old proper-noun matcher. It auto-tagged every short paragraph of any matched date and is what caused the old false positives. Do not re-run `just kernberger-tag` or `just censored-tag`: they would reintroduce the old tags.
- Other agents are working at the same time:
  - The cz fablelous agent is editing cz/071–076 now. 91 cz files there have its uncommitted FAB edits alongside my tag lines, and the per-paragraph tag re-parse is still correct. Its commits will sweep my tag lines in.
  - Commit 3eb459100 (source placeholders replaced with Marie's French) already swept my tag lines in 78 `_original` files. The tags in them match the audit.
  - That commit also changed the text of 110 `_original` paragraphs after I scored them. None of my applied changes are among them.
  - The deferred `_original/068` operations were scored on the old placeholder text: 068.0238 was an English stub and matched Kernberger spuriously. **Re-score 068 before applying its pending operations** (list in the scratchpad: `text_changed.json`).
