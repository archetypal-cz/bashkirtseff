# Review brief (Opus CON) — reading-conventions wave (2026-10-03)

Independent CON-review of a worker's uncommitted edits in the carnets named in your prompt (`git status --short content/<lang>/NNN`). Rules: .claude/reports/wave-2026-10-03-worker-brief.md and everything it lists; reference examples content/<lang>/034 and the committed batches.

Check and fix directly:
1. Every converted footnote quotes content/_original exactly (her spelling/mistakes; transcription slips as `tak v textu; zřejmě …` style).
2. Translated runs read naturally in the target language, Marie's voice; TM renderings used for recurring tics.
3a. Proper names (people, places, institutions, ships, nicknames used as names) are never ==…== — at most italic + footnote.
3b2. Niçois oaths (ED default, pending owner): flagged by Marie in that passage → Niçois italic + footnote; otherwise translated + ==…==.
3. Nothing missed: scan ALL visible text of the carnets for foreign text still left that should be converted (exceptions: titles — established target-language title in text when one exists (original in footnote), else original in italics + gloss; never ==…==; table d'hôte stays; names; naturalised words; metalinguistic runs; whole foreign paragraphs with a run note).
3b. Marie's own English (en tree): must match _original verbatim — restore silently "corrected" words, discuss meaning in a footnote.
4. cz only: every direct speech with attribution in „…“ (dash-led or not), correct punctuation, closing “ U+201C, nothing over-quoted; outfit notes palette: bien → „*sluší*“ / „*pěkné!*“ / „*šik*“, très bien → „*moc sluší*“, assez bien → „docela sluší“, mal/pas bien → „nesluší“, pas mal → „ujde to“ (no other variants); *comme il faut* as in cz/034.
5. Footnote marker right after closing `==`, before punctuation; no `==` inside footnote text.
6. Splice safety: no edits inside `%% … %%` lines; paragraph-ID counts unchanged vs HEAD.
Add `%% <now ISO> CON: … %%` (own line) per entry you change.

Gates for each carnet: `just verify-carnet <lang> NNN` PASS, `just splicescan <lang> NNN` silent. Touch only your carnets; don't commit; no git checkout/restore/stash/reset.
Report concisely: verdict + score per carnet, fixes made, owner items (genuine policy questions only).

## Recurring-term rulings
Other reviewers of the same tree run in parallel. Before ruling on a recurring term, re-read content/<lang>/TranslationMemory.md from disk and grep the committed carnets of the tree; follow an existing ruling rather than coin a second one. Rule only for terms nobody has ruled yet, and re-read the TM again right before staging.

## Commit (from 2026-10-03 evening on)
When every carnet is approved and gates pass: commit yourself, scoped — `git add content/<lang>/NNN …` for your carnets only (+ `content/<lang>/TranslationMemory.md` only if you edited it). Message: `feat(<lang>): reading conventions wave NNN–NNN (Sonnet TR + Opus CON <score>)`, ending with the lines
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_0116mc2T2pRrSosEwkoDFhid`.
Never `git add -A` / `git add .` / `git add content/<lang>`; never push; never checkout/restore/stash/reset. Report the commit hash.
