# Brief — LAN on restored paragraphs (originals wave, 2026-10-21)

Role: linguistic annotator (LAN). Read `.claude/skills/linguistic-annotator/SKILL.md` and
`.claude/skills/_shared/editing_rules.md` first.

## Task

Annotate the restored paragraphs listed in `bare/CCC.txt` (session scratchpad named in your prompt). A
researcher has just added RSR notes, tags and footnotes to some of them: read those and don't repeat them.
Target languages: cz, uk, en, fr (modern edition), es.

Categories per the skill: period vocabulary, idioms, register, Marie's quirks, code-switching, ambiguity
(with confidence), cross-language traps (`LAN: TRAP:`). Before writing a note, grep the carnet for an existing
LAN note on the same expression and stay consistent with it.

## Rules learned from the pilot review (034/037) — binding

1. **Density cap:** about one note per short paragraph, three or four at most for a long one. No plain
   dictionary glosses a competent translator would not miss. Skip paragraphs that need nothing.
2. If a person is tagged on the paragraph, name them from the tag (bare "Marie" tagged MARIE_SAPOGENIKOFF
   is Marie Sapogenikoff), not "another girl". Roles come from the glossary or the source, never a guess.
3. Write "see existing note" / "cf. CCC.NNNN" only after grepping that it exists. Find IDs by searching
   the text, never by line number (other agents insert lines into the same carnet concurrently).
4. Don't build a note on an allusion the text does not mark.
5. `TRAP` only for real hazards across target languages (false friends, referent collisions, nicknames,
   pronoun traps, expletive *ne*). Style observations are plain notes.
6. Label foreign material correctly (ENGLISH, ITALIAN, LATIN, RUSSIAN, ABBREVIATION — "i.e." is Latin).
7. A recurring nickname/referent TRAP goes once, at its first occurrence in the carnet (grep); later only a
   short back-reference if needed.
8. Historical claims about the period need RSR support or a hedge. If the RSR note explains a fact, write
   only the translation guidance.
9. **A gloss already given in this carnet is not repeated** (*figure*, *glace*, *position*, *ennui*,
   *pelisse*, *brave*, *baiser*, *parents*…): grep the carnet before writing. In 067 most of the excess
   density (77 of 421 notes deleted in review) came from repeated glosses and repeated TRAPs.
10. Target density: about 0.3–0.5 notes per listed restored paragraph. Well above that means filler.

## Format

LAN comments on their own lines after the ID/tag/RSR lines, before the French; anchor Edits on the line
above the French, never on the start of a long text line; never type the double-percent marker in prose;
timestamps from `date +%Y-%m-%dT%H:%M:%S`. Never change the French, IDs, tags or others' notes. Never restore
or checkout files from git. When every non-empty entry in a file is annotated, set
`workflow.linguistic_annotation_complete: true` in that file.

## Gates and report

`just verify-carnet _original CCC` PASS and `just splicescan _original CCC` empty. No commits or git
mutations. Report concisely: paragraphs annotated / skipped, notes by category, files flagged complete,
oddities in the text (NOTE), gate results.
