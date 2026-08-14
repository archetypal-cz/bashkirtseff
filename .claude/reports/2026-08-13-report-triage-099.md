# Report Triage 2026-08-13 — carnet 099 reports + repo-wide class sweeps

Five open reader reports (all KRR, all cz/099, filed 2026-08-13 evening) triaged, fixed,
and used as seeds for repo-wide sweeps of the same defect classes across all five trees.
The sweeps found and fixed four additional large defect families.

## The five reports

| Report (UUID prefix) | Paragraph | Verdict | Fix |
|---|---|---|---|
| c27ab649 | 099.0235 unnatural "improvisovaná" | fixed | "improvizovaná" (modern orthography); only other cz instance ("improvisátorce", cz/063 footnote) also fixed |
| d9520eb6 | 099.0237 bad_translation "cimaise" | fixed | "v úrovni očí" per TM + 088 precedent; class-fixed 8 more occurrences in 099 (5 files) and 3 in 104, footnotes adapted; TM line clarified. uk/en verified clean (en keeps *cimaise* by its own TM convention) |
| 9c6dc627 | 099.0247 chybí tagy | fixed | researcher added 7 people tags across all 5 trees + frontmatter entities; created glossary entries SAUTEREAU, M_DE_LA_TOUR; verified all link targets |
| d1d45e58 | 099.0252 missing_text | fixed (as split-signal) | FALSE POSITIVE for missing text: manuscript page-break split mid-sentence; verified against Kernberger (she has LESS text). Added continuation ellipses (both sides) to cz+uk at 0251/0252 AND 0261/0262, matching en's existing convention |
| 53081d82 | 099.0263 unnatural "Na příč" | fixed | "[Napříč: …]"; class-fixed tree-wide (below) |

## Class sweeps and what they found

1. **"Na příč" (archaic orthography), cz tree-wide** — TM itself prescribed the archaic
   form. Canonicalized to **"[Napříč stránkou:]"** (instrumental; largest modern variant,
   also matches 2026-08-08 FAB direction in 017). 8 files fixed in 055 (agent), 3 spots
   in 099 (agent), then mechanical sweep: **99 files / 114 replacements** across 43 more
   carnets (visible lines only; %% comment lines left as historical record). TM updated.
   Remaining accepted variants: "[Napříč:" (bare), "[Napsáno napříč:" (4, FAB-authored).
   uk/en clean for this class but carry their own variant spread (see Deferred).

2. **Page-overlap duplicate paragraphs (081/082, tome-12 extraction artifact)** — found
   while investigating 099.0252. The same paragraph appears verbatim in adjacent clusters:
   `_original` **128 duplicates / 35 files**, uk/082 **42+ / 30 files**, en/082 1,
   fr/081-082 rendered them via comment-promotion (fr fix in flight at time of writing).
   Deduplicated using cz's echo-ownership as reference. Verified byte-identical paragraph
   IDs, footnote integrity, exact visible-line deltas. cz/018 dot-rows = genuine content,
   left alone.

3. **Multi-line `%%` blocks + mid-line comment splices (render-breaking)** — renderer
   hides comments per-line only, so **3,715 block-interior lines leaked French** source
   into cz/uk/en reading pages, and **202 splice lines** (`%% comment %% trailing text`)
   **dropped their trailing translation text** from pages entirely (uk 158!). Fixed
   content-side (724 files) by per-line wrapping / splitting; fr excluded (its visible
   text lives in %% blocks by design). Verified with a semantic visible-text invariant
   against HEAD: zero unexplained content changes. Recovered text includes whole dropped
   paragraphs (e.g. cz/094/1881-12-02). Also: en/067 157 unwrapped French lines (5 files),
   en/066 two mid-line splices, `_original/004/1873-04-18.md` RSR block unclosed to EOF.

4. **Retired `[//]: #` syntax (398 lines)** — one-line renderer fix: `isCommentLine` now
   treats `[//]:` as comment (fixes all, incl. unmigrated carnets 062/081/068/067/053/063).
   Source-side migration still pending (WATCHLIST). uk/082/1878-08-10's bare line also
   wrapped source-side.

## Renderer changes (src/frontend/src/lib/content.ts)

- `isCommentLine`: added `[//]:` prefix → comment. Full 35,845-page build passed;
  spot-checks confirmed retired lines gone from uk/082 + fr/062 pages and paragraphs
  render exactly once.

## Verification

- `%%` parity vs HEAD: all modified content files even/unchanged parity
- semantic visible-text invariant (multi-line + splice aware): 0 unexplained diffs
- `just glossary-missing`: 0 broken links
- RED pass (fresh agent) over all substantive translation fixes: 1 word-order fix
  (099.0176), caught 3 more uk/082 duplicates (led to the full class sweep)
- dedup fingerprints: paragraph IDs byte-identical, footnotes 0 orphaned both directions

## Team

investigator (Explore), tagger-0247 (researcher), fixer-099 + fixer-055-104 (translators),
wrapper-067 (entry-restructurer), red-review (editor), dedup-uk082 (editor),
dedup-orig (general-purpose, exemplary verification discipline — see its cz-ownership
rule: naive "delete the later copy" would have made 6 wrong calls).

## Deferred / follow-ups (WATCHLIST updated)

- fr/081-082 dedup completion (in flight)
- uk marginal-note variant spread: [Навскоси: 165 / Упоперек: 23 / Поперек: 19] and
  [Викреслено: 70 / Закреслено: 49] — valid words, inconsistent; KRR call whether to unify
- en variant spread: [Written across the page: 162 / Written across: 30 / crosswise: 6 / sideways: 1]
- en cimaise footnote is per-file, so non-first-use pages show the italic term unglossed
- source-side `[//]: #` migration for carnets 053/062/063/067/068/081
- cz comment-only echoes in 081/082 still encode the overlap artifact (resync hazard)

## Teamcouch Review

**Reviewed**: 2026-08-14
**Reports analyzed**: this run + WATCHLIST history (cz-056-064, cz-080-082, cz-104-106,
cz/uk-fluidity 2026-07-02; splice comment dates confirm 8+ distinct waves Feb–Jun 2026)

### Patterns Identified
- **Comment-splice family recurs despite skill guidance** (8+ waves) — guidance existed in
  editor/opus-editor/conductor skills since June; the gap was detection, not instruction.
  → Built the missing gate: `just check-comments` (src/scripts/check_comment_structure.py),
  wired into the editor skill's mandatory end-of-review pass.
- **Single-instance fixes of class defects** (3 independent half-fixes across waves: old RED
  notes uk/082 08-22 + 09-09, old TR note en/082 09-03; plus this run's own uk/082 first fix)
  → report-triage skill: new "fix the class, not the instance" step in the triage loop.
- **Idle-without-report** (3× this run) → WATCHLIST watch item.
- **Sweep residue outside literal spec** (3× this run, one shared root: the fixing net ≠
  verification net) → WATCHLIST watch item; countermeasure (re-scan with a different net) proven.

### Gate shakedown findings (fixed during review)
Running the new gate exposed one more pre-existing family: bare source-French lines with only
a trailing `%%` — 50 in cz/uk/en (leaking French into translation pages; repaired per-line),
~1,700 in fr/_original (render-benign there; gate-excluded, WATCHLISTed), 8 mangled
`%% %% RSR: ENHANCED CONTEXT` blocks in fr/003-004 that displayed entire English research
essays on public fr pages (collapsed to inert single-line comments, French text re-anchored),
2 junk `%% %%` lines in cz/016.

### Skill Updates Applied
- editor: end-of-review pass now requires a clean `just check-comments {lang}` (evidence: 3+ waves)
- report-triage: class-sweep step before marking fixed (evidence: 3 independent half-fixes)

### WATCHLIST Changes
- Updated: mid-paragraph splice item (remediated + gated; resolve after 3 clean waves)
- Added: stray-marker legacy family (fr/_original, gate-excluded); idle-without-report (watch);
  sweep-residue (watch)

### Recommendations for Human
- fr/_original stray-marker normalization (~1,700 lines) is safe to defer; the gate keeps
  translation trees clean meanwhile
- Consider `just check-comments` in CI/pre-push once the fr/_original baseline is normalized

**Status**: reviewed
