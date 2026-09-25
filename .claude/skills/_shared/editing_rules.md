# Shared editing rules — every role that edits diary content

Canonical home for rules that TR, OPS, RED, CON, FAB, VOX, LAN, RSR, report-triage agents and the lead all follow. Skills link here with a two-line summary; change the rule here, not in the skills. Marker shapes themselves (what counts as a splice, a block, a stray closer) are defined in [`docs/COMMENT_MARKER_RULES.md`](../../../docs/COMMENT_MARKER_RULES.md) rule 3; the gate is [`docs/VERIFY_CARNET_GATE.md`](../../../docs/VERIFY_CARNET_GATE.md).

## 1. Splice-safe comment insertion

A *splice* is a line with a `%% … %%` comment and visible text outside it. The renderer drops the text after the closer, so part of a paragraph silently disappears. Every role that inserts comments has produced splices (RED, CON, OPS, GEM, and FAB with 66 in one wave), and the Edit tool reports success either way.

- **Every comment goes on its own line.** A line that holds a comment holds nothing else.
- **Comment-only insertion: anchor on the line after the text** (the next comment line, or the blank line before the next paragraph ID). Source annotations (RSR/LAN in `_original`) go *before* the French, so anchor them on the ID or tag line above it. Never anchor by matching the start of a long text line.
- **Text edit plus comment in one Edit only when `old_string` runs to the real end of the line**, including a trailing footnote marker `[^…]`. A text line often holds several sentences, and matching only the first one strands the rest behind your comment. Otherwise make two Edits: first the text, then the comment.
- **Never type a literal double-percent in comment prose.** Write "marker" or "wrapper" instead.
- **Never write `%%`-bearing text through `printf`, `echo` or `sed`.** `printf` turns `%%` into `%` (53 files broken in cz-104-106). Use the Edit tool.
- **Timestamps are real**: `date +%Y-%m-%dT%H:%M:%S`.
<!-- Evidence kept from the per-skill Teamcouch notes this section replaced: 2026-06-13 literal
     double-percent in comment prose (cz-080-082 CON, cz-083-092 TR "(bez …)" in 084/1879-01-18);
     2026-07-02 splices despite the grep scan (cz-fluidity-105-106 ×4, uk-fluidity ×1; prior
     cz-056-064, cz-080-082); 2026-08-08 fablelous wave, 66 splices from partial old_string
     matches; 2026-08-14 gate tooling after the 2026-08-13 cleanup (202 splices + 3,715 leaked
     block lines, 2026-08-13-report-triage-099); 2026-09-25 shared-scratchpad script overwrite. -->
- **Scan after each file, not only at the end**: `just splicescan {lang} {carnet}` must print nothing. It flags only lines with an even marker count (so multi-line French blocks do not flood it); odd-count shapes — an unclosed block, a stray closer — are caught by `verify-carnet`, so both are required. Re-run it after repairing a splice, because the repair is itself a splice risk. Before reporting, `just verify-carnet {lang} {carnet}` must PASS (its `splice` check is the gate) and `just check-comments {lang}` must be clean. If you have no Bash, say so in your report so the lead runs them.
- **Parallel agents share one scratchpad**: put lang and carnet in every helper file name (`scan_cz001.sh`, not `scan.sh`).

## 2. Work against `content/_original`, never against the embedded French

Each translation file carries its own copy of the French inside `%% … %%`. That copy can be stale, elided, condensed or from another edition. In cz/018, RED, CON and a FAB pass all approved entries whose embedded French held 36–75% of the source.

- **Before translating or reviewing an entry, compare it with `content/_original/{carnet}/{date}.md`**: same paragraph IDs, similar length, same date heading. If they differ, stop work on that entry and report it. The lead runs `just sync {carnet} {lang} --dry-run` and the safe-sync check (§6). Never translate, polish or approve from the embedded copy alone.
- **Placeholder or missing source text.** The source may be a placeholder (`[full entry text too long for comment — see original]`, `[Extended analysis…]`), an English summary where French belongs, or a paragraph with no French at all. In that case:
  - Never invent, reconstruct or back-translate text.
  - Never translate a summary as if it were Marie's words.
  - Leave that paragraph untranslated, add a comment `%% {timestamp} {ROLE}: SOURCE MISSING: {what you found} %%`, and list it in your report.
- **`empty_in_source: true` entries** have no text to translate. Set the flags and move on.
- **Scaffold `TODO` lines** are placeholders. Replace every one when you translate. An entry that still has a `TODO` is not complete, so leave `translation_complete: false` and `status: translation_pending`.

## 3. Never "fact-correct" Marie

Marie misremembers, exaggerates, misnames, misdates and gets nationalities wrong. Translate what she wrote. A correction belongs in a footnote (added source-side by RSR) or in a comment, never in her text. Example: a GEM pass changed her *société américaine* to „anglické“ in 002.0156; it was restored on 2026-09-25. This rule covers facts: names, places, numbers, dates, nationalities and titles. Silent correction of plain spelling slips still follows the translator skill's "Marie's Errors" rule.

## 4. Fix the class, not the instance

When you fix an error that belongs to a family (a mistranslation, a TM-term deviation, a splice, a dropped `[Rayé:]`), grep the file, then the carnet, then (cheaply) the tree, and check the same paragraph in the other trees. Fix the whole set, or list what you defer. Name the grep and the hit count in your comment or report. Half-fixes that each patched one instance are how dîner/déjeuner survived in 35 places.

## 5. Locked terms and rulings

- **Where locks live:** `content/{lang}/TranslationMemory.md`, in entries marked *Locked* or `Ruling (YYYY-MM-DD, WHO)`, and the conventions in `content/{lang}/CLAUDE.md` (es: the "DECIDIDO" headings).
- **Never change a locked term.** If you think it is wrong, keep it, add a `NOTE` comment and raise it in your report. (A FAB pass once swapped the locked *velkovévoda* for *velkokníže*; the owner reversed it.)
- **Pending rulings:** these are listed under "Owner decisions" in the newest `.claude/reports/WORKPLAN-*.md` and in `.claude/reports/WATCHLIST.md`. Leave such text as it is and flag it. Do not normalise the corpus toward either form.
- **Making a ruling:** CON may lock a form where no lock exists yet. First grep every variant across the tree and record the counts, then add a `Ruling (date, CON)` entry to the TM, then sweep: grep that the old forms are gone and reverse-grep that the new form is present. Reversing an existing lock, or changing a corpus-wide convention (quotes, code-switch marking, name tiers), is the owner's decision. Add it to the WORKPLAN "Owner decisions" list and do not apply it.

## 6. Gates, sync and commits

- **Workers never commit** and never run git mutations. Read-only git is fine. A PreToolUse hook enforces this.
- **The lead commits one carnet at a time with explicit `git add` paths**, and only after the carnet passes its gates: `just verify-carnet {lang} {carnet}` PASS and `just splicescan {lang} {carnet}` empty. Re-run both after RED and after CON, FAB or VOX, not only before RED. A CON verdict once unbalanced a file.
- **Safe sync:** run `just sync {carnet} {lang}` with the language always explicit, because it defaults to cz. Then `just sync-verify {carnet} {lang}` must print OK. It checks three things: visible text identical to HEAD, splicescan empty, and no stray `README.md` (sync copies the source README; delete it). Finally, `verify-carnet` must PASS. Sync does not overwrite a footnote definition the target already holds, so a corrected definition has to be patched by hand in every tree.
