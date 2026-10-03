# Worker brief — reading-conventions wave (2026-10-03)

You are converting carnets of ONE target language tree to the owner's (KRR) 2026-10-03 reading conventions. Read first, and follow exactly:
- content/CLAUDE.md → "Foreign-language passages: everything translated" (all bullets)
- content/<lang>/CLAUDE.md (cz: "Cizojazyčné pasáže v originále" + "Přímá řeč"; en: code-switch section; uk: "Іншомовні пасажі")
- content/<lang>/TranslationMemory.md top note + rows for the terms you meet (use the TM renderings for tics: one rendering per tree)
- .claude/reports/WORKPLAN-2026-10-03-reading-conventions.md ("Worker brief", "Rulings after pilot", "ED defaults")
- .claude/skills/_shared/editing_rules.md (splice-safe: never edit inside `%% … %%` lines, never touch paragraph IDs)
- Reference example of a finished carnet: content/<lang>/034/ (committed pilot, CON-approved).

Per entry file in content/<lang>/NNN/ (compare with content/_original/NNN/, the reference):
A. Every run still in a foreign language in the visible text (Marie's English in cz/uk; Italian, Latin, Russian, German; French phrases/tics left in French — *Bigre*, *comme il faut*…; in en Marie's English STAYS) → translate in Marie's voice, wrap in `==…==`, footnote with her exact original from _original (`Pozn. překl.: V originále anglicky: „…“.` / `В оригіналі англійською: «…».` / `In French in the original: *…*.`). Convert an existing meaning-footnote into the original-footnote (reuse its ID). Repeated tic within one entry: footnote only the first. Titles of works: established target-language title in text if one exists (original in footnote), else original title in italics + gloss — never ==…==. *table d'hôte* stays. Proper names (people, places, institutions, ships, nicknames used as names) are never ==…== — at most italic + footnote. Metalinguistic runs, names, naturalised words stay (italics, explanatory note if needed). Whole foreign paragraphs that are already translated with a run note: leave.
B. cz only: ALL direct speech with attribution → „…“ (dash-led or not), Czech punctuation („…,“ řekl. / split speech / closing “ U+201C / nested ‚…‘). Free indirect speech and Marie addressing herself/the reader stay unquoted. Mid-sentence parenthetical dashes stay.
C0. cz gentleman (ED ruling 2026-10-04): plain naturalised „džentlmen“ (standard Czech spelling), no ==, no footnote. plobster in cz: plain (cz TM).
C. cz only: outfit notes "bien" → „*sluší*“ (default; „*pěkné!*“ where it fits better — NOT „šik“, owner 2026-10-03: too colloquial — vary naturally; italics as in source), "très bien" → „*moc sluší*“, "pas mal" → „ujde to“, "assez bien" → „docela sluší“, "mal"/"pas bien" → „nesluší“ (Marie's own scale in 003/04-05: mal, assez bien, bien, très bien) (owner 2026-10-03 + ED).
D. Visible `[sic]` after a TRANSLATED word (marking Marie's French coinage/error, e.g. en "caricatured [sic]") misleads the reader — move it into a footnote quoting her French (`[^n]: Marie's coinage: *…* [sic].`). [sic] on text kept in her own words (her English in en) stays or goes to the footnote per file habit.
E. Niçois oaths (ED default 2026-10-03, pending owner): where Marie herself flags the saying as Niçois/Nice speech in that passage, keep the Niçois in plain italics + meaning footnote; otherwise translate + ==…== + original footnote (one rendering per tree, per TM).
Add one comment per changed entry on its own line: `%% <now ISO> TR: Reading-conventions wave (KRR 2026-10-03): … %%`.

Gates per carnet (must hold before you report): `just verify-carnet <lang> NNN` → PASS; `just splicescan <lang> NNN` → no output; paragraph-ID count per file unchanged. Use other `just` tools as useful (`just --list`).
Rules: edit ONLY content/<lang>/<your carnets>/ — never write to, revert or "clean up" TranslationMemory.md or any other shared file (other agents have uncommitted edits there); don't commit; no git checkout/restore/stash/reset; scratch files only in your own uniquely named temp dir.
Report (concise): per carnet — files changed, runs converted, (cz) dialogue lines converted, footnotes changed/added, gate results; a list of doubtful renderings or cases for the reviewer; any TM gaps (tics without a TM rendering — say what you used).


Open items: anything left for the owner, research, a source fix or a later sweep goes into `.claude/reports/OPEN-ITEMS.md` (one `- [ ]` line, right section, tags) — and say so in your report.
