# Brief — contextual footnotes on Marie's prejudiced remarks (D-63, 2026-10-22)

Owner ruling (A-63, 2026-10-22): passages where Marie voices prejudice (antisemitism, racism, contempt for
peoples or classes) get a short contextual source footnote. Role: researcher (RSR). Read
`.claude/skills/researcher/SKILL.md`, `.claude/skills/_shared/editing_rules.md` and
`.claude/reports/briefs/restored-rsr-brief.md` (rules 1–9 bind).

## Input

`d63/candidates.tsv` in the session scratchpad named in your prompt (carnet, file, paragraph_id, french_phrase,
category, severity 1–3, coverage, existing_note, suggested_context). Its «covered» flag is a keyword match and
often wrong: read the paragraph's notes yourself. Work only on the carnets in your prompt.

## What a note is

- One footnote per **person or group**, at the first strong occurrence, plus its own note for each severity-3
  passage that is not covered by such a group note. Later repeats: no note, or a short «See the note at
  CCC/YYYY-MM-DD.» only where the reader would otherwise meet the epithet unexplained.
  Suggested anchors (check them): Hecht 086.0009 (or 087.0275); Julian 085.0099 already has one; Hayem
  104.0265; the «nègre» idiom 065.0125; the Black servant child 053.0208; «tête de nègre» colour 008.0072;
  Zulu «sauvages» 085.0400; anti-Polish 021.0072 or 029.0340; «moujik» insult 007.0005; class contempt 009.0132,
  062.0274; Russians/Slavs 097.0033; Turks 064.0527; 065.0714.
- Severity 1 national banter: skip unless it reads as contempt.
- Content: the fact a reader needs — who the target is and whether the epithet fits (e.g. Julian was not
  Jewish), the period setting (antisemitism in 1880s Paris society and press; the 1881–82 pogroms in Russia;
  colonial-era racial language; the household servants Marie mentions), a cited source. Neutral and brief
  (1–3 sentences), English, in the carnet's existing footnote format, marker on the phrase. **No moralising,
  no apology, never soften or paraphrase Marie away.** Don't repeat what a LAN note tells translators; the
  footnote is for readers.
- Every factual claim cited in an RSR comment (Kernberger 2013, Blind 1890, scholarly sources, Wikipedia).
  If an existing note on the passage is wrong, add `RSR: CORRECTION —` and fix it.

## Trees

For each touched carnet run `just sync C LANG --footnotes --dry-run --verbose` for cz, uk, en and fr; skip a
tree that already carries an equivalent note; otherwise sync for real, translate the inserted note into the
tree's language in the style of that carnet's notes (cz «Pozn. překl.» style as already used, uk, fr) and move
the marker to the right word. Never change translated text other than markers.

## Rules, gates, report

Never change Marie's French, IDs or tags. Edit tool or Python; never printf/echo/sed for `%%` lines. Never git
checkout/restore/stash/reset; no commits. Gates per touched carnet and tree: `just verify-carnet TREE C` PASS,
`just splicescan TREE C` empty; visible text unchanged apart from footnote markers. Write touched files
(repo-relative) to the file list named in your prompt. Report: notes added (per group), passages left without a
note and why, corrections, gates. Ledger lines (OPEN-ITEMS.md, highest number checked right before) only for
what you cannot settle.
