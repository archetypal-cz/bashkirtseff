---
date: 2026-07-06
type: report-triage
operator: "@kerray"
scope: paragraph_reports DB → carnets 000, 034, 067, 068, 097, 105 + frontend renderer
pipeline: [report-triage (new role), translator, editor, researcher, entry-restructurer]
status: reviewed
---

# Report Triage Run — 15 open user reports, all implemented

First run of the new **report-triage** role (skill created this session at `.claude/skills/report-triage/SKILL.md`). Source: `paragraph_reports` table on aretea (14 open reports, most filed by KRR himself against the live site). Every report was evaluated against the French original, classified, fixed by a role team, and mechanically verified. All 14 → `fixed`.

## Verdicts

| Report | Class | Outcome |
|---|---|---|
| 000.0002 cz (formatting `## 1884 . Květen`) | rendering | Renderer never converted `##`/`###` headings inside entries — fixed in `src/frontend/src/lib/content.ts` (`processTextToHtml`, `joinClusterLines`) + `.entry-section-heading` CSS. Benefits ~40 entries in carnets 024/046/048/049/050/060/067/068/081/000. |
| 000.0009 / 0010 / 0011 / 0023 / 0024 / 0025 cz (unnatural) | translation | All warranted (two overruled same-day RED polish choices: "rikošetem", "uzavřené skupinky"). Translator fixed with TR "User report fix." comments; independent RED verified all six clean, zero re-edits. |
| 105.0004 cz (VD euphemism too opaque) | translation | "může dočkat i tím" → "může nakazit, i když…" per user's suggestion; euphemism kept unnamed. |
| 105.0050 cz (missing tags "maman, emile… tady kolem") | tags | People-tag sweep of 105 July 02–17 (all 5 versions): Bastien_Lepage, Emile_Bastien_Lepage, Maman (only true "maman" — "la mère" = Bastien's mother, deliberately excluded), Dina, Rosalie, Maupassant, Zola, Potain, Gavini, etc. |
| 105.0111 / 0153 / 0171 cz ("má být nový záznam") | structure | All three confirmed against source — plus TWO more buried days found in the same range. Five entry splits × 5 versions: new 1884-07-10, -12, -14, -15, -17 (25 files created). Paragraph IDs unchanged; counts verified identical across languages (contiguous 105.0105–0258, no gaps/dupes). |
| 034.0033 cz (missing tags) | tags | `de Daillens` tagged; wrong `Paris`-as-city tag replaced — "Paris" is a person (nicknamed young man of the Nice circle, cf. carnet 033), documented in an RSR note; identity unresolved, no speculative glossary entry. |
| 001.0049 cz ("bláznice" — arrived mid-session) | translation | "bláznice, co jsem" = calque of *folle que je suis* + register too harsh (madwoman vs. self-deprecating fool). → "já bláhová" in 001/005/010 (an earlier RED pass had fixed only the gender, leaving the calque); locked in cz TranslationMemory with the substantival-"une folle" exception documented. |
| 097.0081 cz (glossary page for Musset's poem) | feature | Glossary entry `culture/literature/L_ESPOIR_EN_DIEU.md` created + tagged in 5 languages. No verifiable PD Czech translation found (Vrchlický anthologies are the lead — honest editorial note in the entry). Broader "link PD translations/performances of referenced works" idea → WATCHLIST Product Ideas. |

## Collateral defects found & fixed along the way

- **35 duplicated `#`/`##` date headings** in carnet 068 (cz/en/uk/_original) — migration artifact that would have double-rendered after the renderer fix; removed.
- **cz/067/1876-11-26**: untranslated French `##` line + swapped day names — fixed to match original structure (Dimanche/Neděle + Samedi/Sobota).
- **18 fr/068 sub-date headings trapped inside `%%` comment blocks** — untrapped with fr-promotion-safe restructuring (prose copied visible, heading outside), parser-validated against the never-broken original.

## Verification

- `%%` stranded-text awk scan: clean on every touched file.
- `just verify-carnet` cz/uk/en on 000/034/067/068/097/105: all PASS. (fr fails frontmatter repo-wide — pre-existing: fr edition files have no YAML frontmatter at all; not a regression.)
- `just glossary-missing`: 0 broken references.
- Split integrity: per-file paragraph counts identical across all 5 sources; range 105.0105–0258 contiguous.
- `just fe-build` green (renderer change + 25 new content files).

## Flags for follow-up (not done this session)

1. **Glossary gaps**: no correct entry for **Leo Tolstoy the novelist** (TOLSTOY.md is explicitly a *different* Nice family; TOLSTOY_FAMILY.md is collective) — 5 explicit "Tolstoï" mentions in 105/07-15 left untagged. Also missing: Grancher, Béclère (Marie's physicians), Pernetti, Zuccarini, Flaubert, de Voguë.
2. **Glossary duplicates**: DAILLENS vs DE_DAILLENS (both stubs, both referenced); MICHEL_ANGE vs MICHELANGELO.
3. **fr edition has no YAML frontmatter anywhere** — `verify-carnet fr` fails wholesale; either exempt fr from the frontmatter check or backfill.
4. **`just reports` fails silently** when DEPLOY_HOST is unset / deploy key unauthorized (`2>/dev/null` swallows SSH errors) — worked around via `ssh root@aretea`; recipe hardening would help.
5. Splitter self-caught a seam bug (sed line-range derivation dropped 3 paragraphs in fr, caught by its own count check) — paragraph-count verification after splits is load-bearing; keep it in the skill.
6. tagger-105c reported spurious "file modified since read" Edit errors with edits landing anyway — watch for recurrence (possible harness race).

## Teamcouch Review

**Reviewed**: 2026-07-06 (same-session retro requested by operator — first run of a new role, so this is skill *calibration*, not 3-report pattern-hardening)
**Reports analyzed**: this run + WATCHLIST cross-reference (concurrent-edit family: 4 prior instances)

### What worked (validated, kept in skill)
- **Timing check** (`highlighted_text` vs current file + commit times): correctly identified that reports targeted the just-deployed polish — two complaints were about *same-day* RED choices ("rikošetem", "uzavřené skupinky"), and the skill's "owner feedback overrides prior role decisions" rule resolved them without churn.
- **Class-level fixing**: the 000.0002 "formatting" report became a renderer fix benefiting ~40 entries plus three collateral data-defect families (068 dup headings, cz/067 French leftover, fr/068 trapped headings). Fixing the paragraph alone would have left all of it.
- **Evaluate-against-source before fixing**: found MORE of the reported defect class than reported — 2 extra buried days beyond the 3 reported splits; the "bláznice" calque in 2 more carnets than the reported one.
- **Mechanical verification as backstop**: per-language ID-count parity caught nothing the splitter's own self-check hadn't, but the splitter's self-caught seam bug (3 paragraphs silently dropped by sed ranges) proves count-parity is load-bearing — an agent that skipped its self-check would have shipped silent content loss.
- **DB updates by explicit UUID**: a new report arrived mid-session; a `WHERE status='open'` update would have falsely marked it fixed. It instead got triaged in the same session.

### What was lacking → fixes applied
- **Two taggers sharded over one carnet collided** (scope overrun despite explicit "do NOT touch" list) — 5th instance of the WATCHLIST concurrent-edits family. → report-triage SKILL: "one agent per carnet per concern"; WATCHLIST updated.
- **Splitter applied `_original`'s heading convention but not the translations'** (plain-text dates, stray periods, fr promotion trap) — orchestrator had to fix 20 files by hand. → SKILL verification section now spells out per-language heading convention check + the fr promotion/frontmatter traps.
- **Mid-session interruption recovery** worked but only because disk state was re-surveyed from scratch (git status per language dir) — half-applied multi-language operations (original split done, languages not) are the dangerous resume state. Already implicit in the skill's verification gates; no further change.
- **DB re-query before close** was luck (done to confirm the UPDATE), not process. → SKILL now requires it.

### WATCHLIST Changes
- Concurrent-edits item: 5th instance recorded (scope-overrun variant).
- Added: Edit tool false "file modified since read" with write landing anyway (harness quirk, watch).
- (Earlier in session: Product Ideas section added with the PD-translations linking idea from 097.0081.)

### Recommendations for Human
1. **Push to deploy** — reports are marked `fixed` in the DB but the live site shows the fixes only after push→deploy.
2. **Glossary backlog** from this run: LEO_TOLSTOY entry needed (TOLSTOY.md is a different family — 5 mentions untagged); duplicates DAILLENS/DE_DAILLENS and MICHEL_ANGE/MICHELANGELO; missing entries for Grancher, Béclère, Pernetti, Zuccarini, Flaubert, de Vogüé.
3. **Harden `just reports`**: drop the `2>/dev/null` or add an explicit error when DEPLOY_HOST is empty/SSH fails — silent-empty cost real diagnosis time; also decide whether deploy@aretea should accept this machine's key (currently only root works).
4. **fr edition frontmatter**: either exempt fr from `verify-carnet` frontmatter checks or backfill — currently the gate fails wholesale on fr and trains operators to ignore it.
5. **Researcher role has no Bash by design** (glossary-ops follow-up run, same day): any glossary task needing `just glossary-merge`/`glossary-move` or CLI verification must either go to a Bash-capable role or have the orchestrator run those steps — worked fine as orchestrator-assisted here (researcher researched + hand-edited, orchestrator executed merges + gates), but decide deliberately before delegating glossary maintenance wholesale to researcher agents.
