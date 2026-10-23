# Brief B — carry the sharp-scan source fixes into the trees (cz, uk, en, fr)

Phase A corrected `content/_original/` against the sharp page images and committed it. The lead has already run
`just sync C L --footnotes` for every tree, so the embedded French copies (the comment lines) and, where the
footnote tool could place them, the footnote definitions are current. Your job: make the **visible text** of each
tree follow the source changes listed under "Translation impact" in the package report named in your task.

Read first: `.claude/skills/_shared/editing_rules.md` (all of it — splices, §2 work against `_original`, §5 locked
terms), `content/CLAUDE.md` (Russian-passage mark, ~line 92, and the foreign-language rule below it), and for each
tree its `content/{lang}/CLAUDE.md` and `TranslationMemory.md` for names.

## What to do, per pid in the impact list, in every tree that has the entry

1. Open `content/_original/CCC/DATE.md` (the truth) and the tree file. Find the paragraph by its `%% CCC.NNNN %%` ID.
2. **Russian marks**: wrap exactly the part of the translated sentence that renders the French run with
   `==…==[^CCC.NNNN.rK]` (same label as the source) and make sure the paragraph has the tree's localized footnote
   definition on its own line after the paragraph (blank line before):
   - cz `[^CCC.NNNN.rK]: Pozn. překl.: V originále rusky; do francouzštiny přeložil vydavatel.`
   - uk `[^CCC.NNNN.rK]: В оригіналі російською; французький переклад видавця.`
   - en `[^CCC.NNNN.rK]: Written in Russian in the manuscript; French translation by the editor.`
   - fr `[^CCC.NNNN.rK]: En russe dans le manuscrit ; traduction française de l'éditeur.`
   If sync added the English definition to cz/uk/fr, replace it with the localized one (one definition per label).
   Precedent: `content/{cz,uk,en}/002/1873-03-07.md` paragraphs 002.0224–0225. Remove star debris (`*`, `'`, `★`) or
   wrong italics the translation inherited from the old garbled source.
3. **Changed or added words** (a reading fixed, a word restored): adjust the translation so it says what the
   corrected French says — minimal change, the tree's own style and locked names. Do not polish anything else.
4. Add one comment per changed paragraph on its own line after the text: `%% {timestamp} TR: source fix (sharp
   scan 2026-10-23): <what changed> %%` (fr: role FRE).
5. After each carnet in each tree: `just splicescan {lang} CCC` prints nothing; `just verify-carnet {lang} CCC`
   PASS. Fix what they flag.

Rules: Edit tool only for lines with comment markers; never touch paragraph IDs; no git; no OPEN-ITEMS. If the
tree's paragraph is missing or its embedded French still disagrees with `_original`, do not invent — list it.

## Report

Write `.claude/reports/hires-2026-10-23/<package>-B.md`: per tree, the pids changed and anything skipped with the
reason; gate results per carnet and tree. Final message: counts + path.
