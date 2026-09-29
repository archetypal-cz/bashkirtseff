# Carnet 068 rebuild plan: review (2026-09-27)

Plan: `plan.json` (built by `build_plan.py` from `t09.json` = tome09.docx dump with italic runs, `orig.json` = parsed `_original/068`, alignment `align3.py` → `stage.json`).
Source range: tome09.docx ¶3389 («Mardi 12 décembre 1876») to ¶5130 (end of «Vendredi 23 février 1877»; ¶5131 = INDEX). Cover page ¶3381–3388 is not diary text (see owner decisions).

## Revision 3 (owner answers, 2026-09-27): what changed compared with revision 2

**Totals.** The carnet now has **1301 paragraphs** (650 carried, 651 new, 11 dropped) in **75 entries**, with **45 `set_french`**. That is 31 plus 14 more for letter quoting; 0203 and 0226 already had a `set_french`, so their quoting is folded into it.

**Letters quoted (lead's answer, rev 3b).** The 16 old letter paragraphs get `> `-quoted French through `set_french`: 0184–0187, 0199–0203 and 0220–0226. The tool adds its "SOURCE CHANGED" notes in the translation trees; these are accepted. The rest of this document is revision 2 unless a point below overrides it.

**Cover entry (new): `1876-12-12-cover.md`.** It is listed first in the plan.
- Naming: `<first-entry-date>-cover.md` follows the convention in `isCoverFile` (rebuild-carnet-core.ts:126), `isCoverEntryId` and `compareEntryIds` (content.ts:217–228), and patterns.ts. It sorts before 1876-12-12 and is not read as a date range.
- Carnet 000 has no cover precedent (it is split into sections 000-NN), and no other carnet has one yet.
- The entry has 2 paragraphs, both `kind: cover`:
  1. ¶3381–3387 as seven lines: «Gloriae Cupiditate / Livre 68ème / depuis le mardi 12 décembre 1876 / jusqu'au vendredi 23 février 1877 / Dubium, illusio, deceptio, oppressio / Nice / depuis le 6 février Rome et Naples».
  2. ¶3388 «[En travers: 23 mai 1875]». This is Marie's own writing on the page and is kept as the owner asked. The docx OCR reads «23 mail 875» and the printed p.225 reads «23 mai1875», so the text follows the printed page. Tell me if you want the raw OCR form instead.
- It has no `heading` (the tool warns). `frontmatter_from` is 1876-12-12.md.
- The printed p.225 (PDF 229) was checked visually: the whole block is set as the notebook's title page, with no editors' apparatus.

**Editorial notes (`kind: editorial`), 3 of them, each its own paragraph:**
- ¶4630 «[Marie est passée de la page 184 à 185 mais rien ne semble manquer]» (9 Feb) is now inserted. The docx and the PDF text layer read «pagel 84», so the OCR was normalised.
- The twin note «[Marie est passée de la page 78 à 81 …]» is split out of old 0238 (12 Jan). It was 0238's last line, so it separates cleanly: 0238 gets a `set_french` of its first 3 lines, and a new paragraph holds the note, docx ¶4015.
- «[1876: Passages écrits au milieu du 21 décembre]» (¶3660, printed p.240) is split out of old 0046 (21 Dec) by the same logic. The old `_original` text read «[En marge: …]», while the docx and the printed page read «[1876: …]». 0046's `set_french` is now only «Je me disais… / Je me trompais.».
- No other editorial-type notes exist in 068. «[sic]», «[!']», «[Mots cancellés]» and «[Trois mots cancellés]» are inline transcription marks inside Marie's sentences and stay inline. The printed-edition footnote «Il demeure avec sa mère à Monaco» is still left out (a footnote, not a bracketed note).

**Labels fixed to match the manuscript (`set_french`):**
- «En travers:» is restored in 0550, 0638 and 0660 (as you asked).
- By the same rule it is also restored in 0322, 0418 and 0472. The docx has «[En travers: …]» at ¶4695, ¶4791 and ¶4849; `_original` had dropped the label.
- 0500 gains «[sic]» after «l'premier soir».
- 0226 reads «Marie Bashkirseff"».
- Kind `margin` now also covers the continuation paragraphs 0419 and 0661. Both marginal notes run over two paragraphs.

**Redirect.** The 1877-02-22 entry carries `"redirect_from": ["1877-02-22-23.md"]`, which is the tool's new plan field (rebuild-carnet-core.ts:64). The old URL and relative links now go to 1877-02-22 instead of 1877-02-21, so no post-run edit is needed.

**For 067 (not in this plan).** These belong to 067's plan:
- The Antonelli obituary clippings, tome09.docx ¶3362–3379 (style Body text 12, «LE CARDINAL ANTONELLI … légué au Vatican sa collection»), just before the «Livre 68ème» title page.
- The faint clipping facsimile on printed page ≈226 (PDF p.228; `Tome9-6.jpg` in the raw extraction).
- The printed edition's footnote «Il demeure avec sa mère à Monaco» (on 068.0211) stays out, as a modern editor's footnote.

**6 and 7 Feb:** these stay two «[Aucun texte…]» entries, as planned.

**Kinds now: 57 paragraphs.**

| | cover | editorial | letter | clipping | margin | rayé | other |
|---|---|---|---|---|---|---|---|
| new | 2 | 3 | 2 | 2 | 6 | 13 | 1 |
| old | – | – | 16 | – | 8 | 1 | 3 |

**Tool state for this run.** HEAD 5c26b2f60 does not have `cover`, `editorial`, `redirect_from` or the narrowed reference scope yet. I therefore applied toolsmith's uncommitted `src/`+`docs/` diff (`toolsmith-wip.patch`, copied read-only from main) inside the worktree. With it, the rewriter no longer touches code, tests or docs: 6 reference files, all under content/.

**Revision 3 gates** (fresh worktree at 5c26b2f60 + toolsmith WIP patch + en fix, then `--write`):
- `rebuild-carnet`: 436 file operations, 1301 paragraphs, 75 entries (67 added, 11 removed).
- `renumber-check`: PASS, 0 fail, 1 warn. The warning is the NAPLES.md:130 citation; change it to 068.0139 on main first.
- `verify-carnet` _original/cz/uk/en/fr: PASS, 0 fail and 0 warn.
- `splicescan`: empty for all five trees.
- `check-comments _original`: OK.
- The redirect is confirmed: `/xx/068/1877-02-22-23` → `/xx/068/1877-02-22/` for every language.
- Completeness (docx ¶3381–5130, cover included): 0 missing text. The 12 unmatched docx paragraphs are all deliberate OCR corrections (¶3388 «mail 875», ¶4630 «pagel 84») or OCR variants of text already present (¶3632 3720 3751 3792 3799–3804 5031).

## Summary (revision 2; updated after the owner decision of 2026-09-27: include everything Marie put in her notebooks)

- The 661 old IDs split into 650 carried and 11 dropped. There are 646 new paragraphs (83,865 chars), for a new total of **1296** paragraphs, numbered 068.0001–068.1296.
- The 19 old files become **74 entries, one per manuscript date** (1876-12-12 … 1877-02-23).
- There are 22 `set_french` edits: 18 strip a trailing heading, 1 is the 0046 split, and 3 are completions (0181, 0288, 0427).
- **Kinds**: 49 paragraphs carry a `kind`.
  - New paragraphs (24): clipping ×2, letter ×2, rayé ×13, margin ×6, other ×1.
  - Old paragraphs (25): letter ×16, other ×3, margin ×5, rayé ×1. Section 2b has the details.
- Every new paragraph's RSR note now cites «Mon Journal t.9 p.X» next to the docx ¶ (from `tome09_pagemap.json`, printed page = PDF page − 2 as mapped).
- Gates were run in a throwaway worktree at HEAD 5c80c2ada, which includes kind support. The en fix went in first, then `--write`.
  - `renumber-check`: PASS, 0 fail, 5 warn (see §4).
  - `verify-carnet` _original/cz/uk/en/fr: PASS, 0 fail and 0 warn.
  - `splicescan`: empty for all five trees.
  - `check-comments _original`: OK.
  - Completeness recheck: 0 missing diary or notebook paragraphs.

## 1. Prerequisite: the en/068 duplicate IDs (the en fix)

**Diagnosis.** The lead suspected that en had French which `_original` lacks. That is not the case. «C'est une ville de cancans…» is `_original` 068.0179 (docx ¶3827). en/068/1877-01-02-06.md has **ID drift**. It carries three extra heading-only clusters that `_original` keeps as the last line of the preceding paragraph:

| en cluster | content | _original equivalent |
|---|---|---|
| en 0145 | `## Thursday, 4 January 1877` (+Kernberger tag) | last line of 0144 |
| en 0149 | `## Friday, 5 January 1877` | last line of 0147 |
| en 0180 | `## Saturday, 6 January 1877`, with wrong embedded French «Et je lui racontai tout cela.» | last line of 0177 |

As a result, en 0146–0148 = orig 0145–0147, en 0150–0179 = orig 0148–0177, and en 0181–0184 = orig 0178–0181. The last three collide with 0182–0184 in 1877-01-07-09.md. In the same region, the heading `## Wednesday, 3 January 1877` sat under 0142 and 0142's English («I am back from Rome — see rather the supplement.») sat under 0143.

**Fix** (script `fix_en_068.py <repo root>`, Python, touches only `content/en/068/1877-01-02-06.md`):
1. Move `## Wednesday, 3 January 1877` to the end of 0141, and «I am back from Rome…» into 0142.
2. Delete the ID line and its comment lines for en 0145, 0149 and 0180 (embedded heading, the duplicated Kernberger tag, and the wrong embedded «Et je lui racontai…»). Each `## …day` heading then joins the preceding cluster. Add `%% Samedi 6 janvier 1877 %%` before the Saturday heading.
3. Relabel: 0146–0148 → 0145–0147, 0150–0179 → 0148–0177, 0181–0184 → 0178–0181.

No English text is lost; the diff is 40 insertions and 49 deletions. Afterwards, en embedded French matches `_original` ID for ID in 0140–0184, and en has 661 unique IDs.

Other trees: cz, uk and fr have no duplicate IDs and no drift (661 IDs each). There is no es/068. Pre-existing and unchanged: en embedded French for 0189 0191 0194 0197 0204 0207 0216 0219 0231 0234 0235 0238–0241 0243 0246 0247 0249–0251 0253 0255–0257 0261 is still the old English summaries, and cz/uk/fr hold the same stale copies in places. This is the `just sync` backlog from english-placeholders-2026-09-26, and the rebuild does not fix it.

## 2. Structure decisions

- **Empty placeholder clusters dropped (11):** 0002 0007 0013 0020 0025 0038 0045 0048 0056 0060 are empty in `_original` and in all four trees. Each marks the slot of the day's *first paragraph*, which the extraction lost every time (docx ¶3390 3408 3427 3451 3501 3635 3657 3662 3683 3692). Those paragraphs come back as `new`. 0271 is the empty block left by the 2026-09-26 placeholder removal. No reference in the repo points to any of them.
- **Trailing headings stripped** with `set_french` (text unchanged, heading line removed) in 0085 0100 0107 0141 0144 0147 0177 0203 0204 0234 0236 0242 0245 0246 0249 0252 0256 0634. The next day's entry gets the heading through the plan's `heading`. **Translation follow-up:** in cz, uk, en and fr the translated heading is still the last visible line of those clusters, and the new entry shows `# TODO` under the embedded heading. Move each translated heading down and delete the TODO; this is mechanical and the tool's `ED: … SOURCE CHANGED` comment marks the spot. For 0204, 0234, 0246, 0249, 0252 and 0256 (and fr 0046) the tool warned "old embedded French not found — new copy inserted", because those embeds were stale or English summaries.
- **Split:** 0046 (old 1876-12-21-24) = docx ¶3658–3660 (21 Dec) + ¶3652–3655 (20 Dec). 0046 keeps the 21 Dec lines. The 20 Dec lines become a `new` paragraph with an RSR note «Split off 068.0046…» (it uses `_original`'s cleaned text).
- **Completions (`set_french`):** 0181 had been cut off at «et prenez»; it becomes «- Ne faites pas attention à ces cancans, dit-elle, et prenez vos ennemis par la bonté.» (¶3829). 0288 gains its leading «[Quelques mots cancellés: une chance d'être encore quelque chose]» (¶4661). 0427 «avec Larderei.» gains «[Rayé: Non, vous savez je commence à être gênée par ces farces]» (¶4800–4801).
- **Moved to another day (10 + split):** 0054 (21-24 → **25 Dec**: «Nous sommes partis hier de San Remo» stands under Lundi 25); 0106 and 0107 (30-31 → **29 Dec**, and they now come before 30 Dec's 0103–0105); 0622–0628 (22-23 → **21 Feb**: the Altamura dialogue continues under Mercredi 21 février, docx ¶5089–5095). Every other ID stays in its old day, in manuscript order.
- **Empty manuscript days:** 17 Dec (0031), 24 Dec (0053, heading only) and 8 Jan (0204 «[Aucun texte - date seule mentionnée]») are kept. **6 and 7 Feb** (¶4447 and ¶4448 are bare date lines, followed by ¶4449 «Jeudi 8 février») get new entries holding «[Aucun texte - date seule mentionnée]», following the 0031/0204 convention.
- **22 Feb:** the date line ¶5096 reads «Jeudi 22 février 1877 Il pleut.», so «Il pleut.» is inserted as the first paragraph of 22 Feb.
- **New-paragraph granularity:** one cluster per docx paragraph, as in 068 from 27 Dec onward. Merges:
  - OCR line breaks (next line starts in lower case, or the line ends with a hyphen or an open marginal bracket) are joined with a space.
  - Verse and short unpunctuated lines (the Merjeewsky and Broussais acrostics ¶4157–4178, the Italian poem ¶4602–4620, «C'est bon / Je m'en vais…») are joined with a newline into stanza clusters.
  - A letterless line («!!!!» ¶3632) is joined to the preceding cluster.
- **Text of new paragraphs:** exact docx text with italic runs as `*…*` (the `_original` convention). Minimal OCR normalisation follows what `_original` does elsewhere: `II!`→`!!!`, `I!`→`!!`, a trailing ` II`→` !!`, and split years `1 877`→`1877`. Everything else is verbatim, including OCR slips such as «léqère», acrostic initials written «E nfin» and «[ puisse». These are left for an RSR clean-up pass and are not corrected silently.
- Every new paragraph carries `RSR: Restored from tome09.docx ¶N[–M], Mon Journal t.9 p.X (missing from original extraction, 2026-09-27 rebuild).`. New paragraphs have no glossary tags: run glossary-tagger afterwards.
- `frontmatter_from`: 1877-01-10-18.md for the new 19 Jan–5 Feb entries, 1877-02-10-12.md for 6–9 Feb. The rest use the tool default.

## 2b. Paragraph kinds (non-diary material Marie put in the notebook)

The markers were rendered by the tool as `%% kind: … source="…" %%` under the ID in every tree. Clippings and letters are `> `-quoted by the tool itself, so the plan gives the unquoted French. Clippings also get `[#Press_clipping]`.

| Where | IDs (old) / docx ¶ (new) | kind | source |
|---|---|---|---|
| 22 Jan 1877 | new ¶4224–4227 | letter | anonymous letter Marie writes to herself in block capitals, signed «Don Fortunato» |
| 22 Jan 1877 | new ¶4228–4229 | letter | same, signed «Turcan» |
| 27 Jan 1877 | new ¶4293 | clipping | *Le Sport*, Robert Milton's report on the Nice races («un vrai chou à la crème») |
| 30 Jan 1877 | new ¶4349 | clipping | *Le Sport* (Robert Milton), report on the last day of the races (the «monde aimable» retraction) |
| 9 Feb 1877 | new ¶4626 «[Elliminez.]» | other | (meaning unclear; kept verbatim) |
| new, whole-paragraph bracket notes | ¶3492 3495 3499 4435–4436 4585 4946 | margin | — |
| new, whole-paragraph bracket notes | ¶3582 4211 4278 4395 4403 4407 4411 4638 4807 4812 4830 4944 5035 | rayé | — |
| 7 Jan 1877 | old 0184–0187 | letter | Marie's letter (copy), 7 Jan 1877 |
| 7 Jan 1877 | old 0199–0203 | letter | Marie's letter to M. Pierret (copy), 7 Jan 1877 |
| 10 Jan 1877 | old 0220–0226 | letter | Marie's letter to M. Pierret (copy, not yet sent), 10 Jan 1877 |
| 23 Feb 1877 | old 0641–0643 | other | draft telegram to Larderei (a prank) |
| various | old 0322 0472 0550 0638 0660 | margin | — |
| 28 Dec 1876 | old 0091 | rayé | — |

- Paragraphs that are only partly struck, or that mix a note with diary text, keep the inline form `[Rayé: …]` / `[Mots noircis: …]` and get no kind. Examples: ¶4214, ¶4381, ¶4868, ¶4875, ¶4924, and old 0288 and 0427.
- The old letters are marked but **not** `> `-quoted. Quoting them needs a `set_french` on 19 paragraphs, which would add SOURCE CHANGED notes in all four trees. Decide whether you want that.
- No other pasted clippings exist inside the 068 range. The Antonelli obituary clippings (¶3362–3379, style Body text 12) and the faint clipping facsimile on printed page ≈226 (PDF p.228, the raw extraction's `Tome9-6.jpg`) sit **before** the «Livre 68ème» title. They belong to the end of carnet 067 and should go to the 067 planner.
- **Cross-check against `content/_original/_archive/raw_carnets/09_carnet_raw.md`** (raw lines 7470–11293, the 068 range). Every raw line of 8 words or more is found in docx ¶3370–5130, with 2 exceptions:
  - `![](…Tome9-7.png)` is the drawing (see Drawings).
  - `^1^ Il demeure avec sa mère à Monaco.` (raw 8630) is a printed-edition footnote on «Pauvre Merjeevsky» (068.0211, 9 Jan). It is a modern editor's note, so it stays out of `_original` (listed below).

## Drawings

| Date | docx ¶ | Printed page (PDF page) | What |
|---|---|---|---|
| Jeudi 25 janvier 1877 | ¶4271 (empty `Normal` paragraph = picture slot), between ¶4270 «…Rien ne me déplaît comme les classes moyennes.» and ¶4272 «Vous savez que tout le monde nomme le frère de Gautier *Michka*…» | p.280 (PDF 284) | pen scribble / scrawled doodle, reproduced as a facsimile in the printed edition (raw extraction: `Tome9-7.png`; sample crop `scans/ex1_T9_p284_scribble_facsimile.png`). It follows the new paragraph for ¶4270, and its new ID is in the rebuild map. Once cut from the scan, link it via `drawings: paragraph:`. |

- There is no «Dessin …» list and no other drawing mention inside Livre 68. The word-search for dessin/croquis/esquisse/caricature found only Marie's own painting remarks: «une esquisse de vieille femme» ¶3776 (2 Jan) and «un autre portrait d'Olga» ¶4151 (19 Jan). Those are not drawings in the notebook.
- The figure detector on the printed scan (`tome09_figs.json`) flags no other page between PDF 229 and 335.
- «J'ai déjà dessiné ici un Antonelli» (¶3363) is a sentence inside the 067 clipping, written by the journalist.

## 3. Owner decisions needed

1. **Left out as cover page or modern-editor notes** (per KRR 2026-09-27):
   - ¶3381–3388: the Livre 68 title page («Gloriae Cupiditate / Livre 68ème / depuis le mardi 12 décembre 1876 / jusqu'au vendredi 23 février 1877 / Dubium, illusio, deceptio, oppressio / Nice / depuis le 6 février Rome et Naples / [En travers: 23 mail 875]»). The «[En travers: 23 mail 875]» on the title page may be Marie's own scribble; it is left out as part of the cover. Tell me if you want it kept.
   - ¶4630: «[Marie est passée de la pagel 84 à 185 mais rien ne semble manquer]», a transcriber's note. **Inconsistency**: its twin «[Marie est passée de la page 78 à 81…]» is already inside old 068.0238, and I have not removed it. Should it be removed (a `set_french` on 0238)?
   - The printed-edition footnote «Il demeure avec sa mère à Monaco» (on 068.0211) is not in the docx either.
2. **6 and 7 Feb:** keep two «[Aucun texte…]» entries, or make one travel entry 1877-02-06-08? The departure text under 8 Feb («Je suis partie plus gaiement…») clearly covers 6–8 Feb.
3. **The 1877-02-22-23.md URL** redirects to 1877-02-21 (the tool follows the old file's first paragraph, 0622). 1877-02-22 would arguably be the better target: that needs a manual redirect edit.
4. **Minor fidelity differences left alone** (not missing text; say if you want `set_french`):
   - 0550, 0638 and 0660 lack the «En travers:» label (¶5016, ¶5107, ¶5129).
   - The docx ¶4966 «[sic]» is absent from 0500.
   - 0226 has «Bashkirtseff» where the docx has «Bashkirseff».
5. **Flag reset:** 73 of 74 entries per translation tree lose `translation_complete` and every later approval flag. Almost every day gains its restored first paragraph, so no entry keeps its exact old paragraph list. Only 1876-12-17 (0031 alone) keeps its flags.

## 4. Tool notes (for toolsmith)

- **Blocking for `--write` on main:** the reference rewriter also rewrites example IDs in code and tests. It turned `'068.0002'` into `'068.DROPPED-0002'` in `src/shared/src/parser/kind.test.ts` (lines 23, 52, 64 and 108, so the test breaks), and it touched `src/frontend/src/lib/drawings.ts`, `src/frontend/src/lib/paragraph-kind.ts`, `src/scripts/lib/rebuild-carnet-core.ts`, `src/frontend/src/i18n/index.ts`, `docs/REBUILD_CARNET.md`, `docs/VERIFY_CARNET_GATE.md`, `content/CLAUDE.md` and `issues_plan.md`. 4 of the 5 renumber-check warnings are the kind.test.ts lines. I reported this to toolsmith. Exclude code, tests and doc examples, or move the fixtures to a fake carnet.
- `renumber-check` WARN: `content/_original/_glossary/places/cities/NAPLES.md:130` cites «068.0045» for the Victor-Emmanuel quote. That was **already wrong** before the rebuild (the quote is 068.0139, docx ¶3782), and after the drop it becomes `068.DROPPED-0045`. **Fix before `--write`:** change it to `068.0139` on main, and the tool then rewrites it correctly.
- The footnote-glue heuristic flags new 068.0360 (old 0237, «Je suis née le 12 novembre…») in cz, uk and en. This is advisory and not related to the rebuild.

## 5. Gate results (throwaway worktree at 5c80c2ada, en fix + `--write`)

| Check | Result |
|---|---|
| `rebuild-carnet --write` | 440 file operations; 1296 paragraphs (650 carried, 646 new, 11 dropped); 638 IDs change; 74 entries (66 added, 11 removed) |
| `renumber-check 068` | PASS: 0 fail, 5 warn. 4 are `kind.test.ts` fixtures rewritten (tool issue, §4); 1 is the NAPLES.md citation (fix to 068.0139 first) |
| `verify-carnet` _original/cz/uk/en/fr | PASS, 0 fail and 0 warn, all five |
| `splicescan` _original/cz/uk/en/fr | empty, all five |
| `check-comments _original` | OK |
| Completeness recheck (docx ¶3389–5130 against the rebuilt `_original/068`, word-3-gram ≥0.8) | 15 unmatched docx paragraphs; none are missing text. 14 are OCR variants of text already present (¶3632 3720 3751 3792 3799–3804 3991 4966 5016 5031 5107), and the 15th is ¶4630, excluded as an editor's note |
| Raw carnet cross-check | nothing absent from the docx except the drawing and one printed-edition footnote (§2b) |

Translation trees: new paragraphs appear as `TODO` scaffolds (fr: embedded French only) with their kind marker; `verify-carnet` does not fail on them.

The worktrees were removed afterwards.

### Old layout (19 files, 661 IDs)

| Old file | IDs |
|---|---|
| 1876-12-12.md | 5 |
| 1876-12-13.md | 6 |
| 1876-12-14-15.md | 12 |
| 1876-12-16.md | 7 |
| 1876-12-17-18.md | 6 |
| 1876-12-19.md | 5 |
| 1876-12-20.md | 2 |
| 1876-12-21-24.md | 11 |
| 1876-12-25.md | 4 |
| 1876-12-26.md | 5 |
| 1876-12-27-29.md | 39 |
| 1876-12-30-31.md | 18 |
| 1877-01-01.md | 12 |
| 1877-01-02-06.md | 49 |
| 1877-01-07-09.md | 37 |
| 1877-01-10-18.md | 43 |
| 1877-02-10-12.md | 223 |
| 1877-02-13-21.md | 137 |
| 1877-02-22-23.md | 40 |

### New layout (revision 3: 75 entries, 1301 paragraphs)

| New file | Heading | carried | new | new chars | set_french | kinds |
|---|---|---|---|---|---|---|
| 1876-12-12-cover.md | (cover) | 0 | 2 | 199 |  | cover×2 |
| 1876-12-12.md | Mardi 12 décembre 1876 | 4 | 1 | 221 |  |  |
| 1876-12-13.md | Mercredi 13 décembre 1876 | 5 | 1 | 101 |  |  |
| 1876-12-14.md | Jeudi 14 décembre 1876 | 6 | 2 | 306 |  |  |
| 1876-12-15.md | Vendredi 15 décembre 1876 | 4 | 35 | 4,358 |  | margin×3 |
| 1876-12-16.md | Samedi 16 décembre 1876 | 6 | 1 | 149 |  |  |
| 1876-12-17.md | Dimanche 17 décembre 1876 | 1 | 0 | 0 |  |  |
| 1876-12-18.md | Lundi 18 décembre 1876 | 5 | 70 | 8,337 |  | rayé×1 |
| 1876-12-19.md | Mardi 19 décembre 1876 | 4 | 1 | 75 |  |  |
| 1876-12-20.md | Mercredi 20 décembre 1876 | 2 | 1 | 488 |  |  |
| 1876-12-21.md | Jeudi 21 décembre 1876 | 2 | 2 | 207 | 0046 | editorial×1 |
| 1876-12-22.md | Vendredi 22 décembre 1876 | 3 | 1 | 262 |  |  |
| 1876-12-23.md | Samedi 23 décembre 1876 | 2 | 0 | 0 |  |  |
| 1876-12-24.md | Dimanche 24 décembre 1876 | 1 | 0 | 0 |  |  |
| 1876-12-25.md | Lundi 25 décembre 1876 | 4 | 1 | 98 |  |  |
| 1876-12-26.md | Mardi 26 décembre 1876 | 4 | 1 | 18 |  |  |
| 1876-12-27.md | Mercredi 27 décembre 1876 | 22 | 0 | 0 | 0085 |  |
| 1876-12-28.md | Jeudi 28 décembre 1876 | 15 | 0 | 0 | 0100 | rayé×1 |
| 1876-12-29.md | Vendredi 29 décembre 1876 | 4 | 0 | 0 | 0107 |  |
| 1876-12-30.md | Samedi 30 décembre 1876 | 3 | 0 | 0 |  |  |
| 1876-12-31.md | Dimanche 31 décembre 1876 | 13 | 0 | 0 |  |  |
| 1877-01-01.md | Lundi 1er janvier 1877 | 12 | 0 | 0 |  |  |
| 1877-01-02.md | Mardi 2 janvier 1877 | 9 | 0 | 0 | 0141 |  |
| 1877-01-03.md | Mercredi 3 janvier 1877 | 3 | 0 | 0 | 0144 |  |
| 1877-01-04.md | Jeudi 4 janvier 1877 | 3 | 0 | 0 | 0147 |  |
| 1877-01-05.md | Vendredi 5 janvier 1877 | 30 | 0 | 0 | 0177 |  |
| 1877-01-06.md | Samedi 6 janvier 1877 | 4 | 17 | 2,076 | 0181 |  |
| 1877-01-07.md | Dimanche 7 janvier 1877 | 22 | 0 | 0 | 0203 | letter×9 |
| 1877-01-08.md | Lundi 8 janvier 1877 | 1 | 0 | 0 | 0204 |  |
| 1877-01-09.md | Mardi 9 janvier 1877 | 14 | 0 | 0 |  |  |
| 1877-01-10.md | Mercredi 10 janvier 1877 | 16 | 0 | 0 | 0226, 0234 | letter×7 |
| 1877-01-11.md | Jeudi 11 janvier 1877 | 2 | 0 | 0 | 0236 |  |
| 1877-01-12.md | Vendredi 12 janvier 1877 | 6 | 1 | 65 | 0238, 0242 | editorial×1 |
| 1877-01-13.md | Samedi 13 janvier / 1er janvier 1877 | 3 | 0 | 0 | 0245 |  |
| 1877-01-14.md | Dimanche 14 janvier 1877 | 1 | 0 | 0 | 0246 |  |
| 1877-01-15.md | Lundi 15 janvier 1877 | 3 | 0 | 0 | 0249 |  |
| 1877-01-16.md | Mardi 16 janvier 1877 | 3 | 0 | 0 | 0252 |  |
| 1877-01-17.md | Mercredi 17 janvier 1877 | 4 | 0 | 0 | 0256 |  |
| 1877-01-18.md | Jeudi 18 janvier 1877 | 5 | 0 | 0 |  |  |
| 1877-01-19.md | Vendredi 19 janvier 1877 | 0 | 13 | 1,732 |  |  |
| 1877-01-20.md | Samedi 20 janvier 1877 | 0 | 20 | 3,149 |  |  |
| 1877-01-21.md | Dimanche 21 janvier 1877 | 0 | 11 | 1,092 |  | rayé×1 |
| 1877-01-22.md | Lundi 22 janvier 1877 | 0 | 16 | 2,345 |  | letter×2 |
| 1877-01-23.md | Mardi 23 janvier 1877 | 0 | 5 | 706 |  |  |
| 1877-01-24.md | Mercredi 24 janvier 1877 | 0 | 7 | 1,687 |  |  |
| 1877-01-25.md | Jeudi 25 janvier 1877 | 0 | 33 | 5,499 |  | rayé×1 |
| 1877-01-26.md | Vendredi 26 janvier 1877 | 0 | 4 | 584 |  |  |
| 1877-01-27.md | Samedi 27 janvier 1877 | 0 | 19 | 3,015 |  | clipping×1 |
| 1877-01-28.md | Dimanche 28 janvier 1877 | 0 | 28 | 3,889 |  |  |
| 1877-01-29.md | Lundi 29 janvier 1877 | 0 | 6 | 669 |  |  |
| 1877-01-30.md | Mardi 30 janvier 1877 | 0 | 13 | 2,247 |  | clipping×1 |
| 1877-01-31.md | Mercredi 31 janvier 1877 | 0 | 7 | 676 |  |  |
| 1877-02-01.md | Jeudi 1er février 1877 | 0 | 5 | 1,427 |  |  |
| 1877-02-02.md | Vendredi 2 février 1877 | 0 | 22 | 3,659 |  | rayé×1 |
| 1877-02-03.md | Samedi 3 février 1877 | 0 | 22 | 3,790 |  | rayé×3 |
| 1877-02-04.md | Dimanche 4 février 1877 | 0 | 8 | 854 |  |  |
| 1877-02-05.md | Lundi 5 février 1877 | 0 | 13 | 3,902 |  | margin×1 |
| 1877-02-06.md | Mardi 6 février 1877 | 0 | 1 | 37 |  |  |
| 1877-02-07.md | Mercredi 7 février 1877 | 0 | 1 | 37 |  |  |
| 1877-02-08.md | Jeudi 8 février 1877 | 0 | 155 | 16,665 |  | margin×1 |
| 1877-02-09.md | Vendredi 9 février 1877 | 0 | 11 | 1,761 |  | other×1, editorial×1 |
| 1877-02-10.md | Samedi 10 février 1877 | 152 | 1 | 25 | 0288, 0322 | rayé×1, margin×1 |
| 1877-02-11.md | Dimanche 11 février 1877 | 15 | 0 | 0 | 0418, 0427 | margin×2 |
| 1877-02-12.md | Lundi 12 février 1877 | 55 | 91 | 7,806 | 0472 | rayé×4, margin×2 |
| 1877-02-13.md | Mardi 13 février 1877 | 22 | 0 | 0 | 0500 |  |
| 1877-02-14.md | Mercredi 14 février 1877 | 17 | 0 | 0 |  |  |
| 1877-02-15.md | Jeudi 15 février 1877 | 14 | 0 | 0 |  |  |
| 1877-02-16.md | Vendredi 16 février 1877 | 10 | 0 | 0 |  |  |
| 1877-02-17.md | Samedi 17 février 1877 | 16 | 0 | 0 | 0550 | margin×1 |
| 1877-02-18.md | Dimanche 18 février 1877 | 18 | 1 | 22 |  | rayé×1 |
| 1877-02-19.md | Lundi 19 février 1877 | 14 | 0 | 0 |  |  |
| 1877-02-20.md | Mardi 20 février 1877 | 9 | 0 | 0 |  |  |
| 1877-02-21.md | Mercredi 21 février 1877 | 24 | 0 | 0 |  |  |
| 1877-02-22.md | Jeudi 22 février 1877 | 6 | 1 | 9 | 0634 |  |
| 1877-02-23.md | Vendredi 23 février 1877 | 27 | 0 | 0 | 0638, 0660 | margin×3, other×3 |

Total new paragraphs: 651, 84,244 chars.


## Withdrawn cover page (KRR, 2026-09-28)

> **Update.** Title-notes pass 2026-09-29 (`_renumber/titlenotes-2026-09-29/`, owner policy: Marie's own notes on title/flyleaf pages go in as `margin`/`other` at the carnet's first entry; the formal title lines stay withdrawn; the carnet was renumbered): the crosswise «[En travers: 23 mai 1875]» (¶3388, small type) is back as **068.0002** (`margin`, no longer `cover`), after the heading of 1876-12-12, with the RSR reading below. Still withdrawn, **owner question**: the motto «Dubium, illusio, deceptio, oppressio» (also on the title pages of Livres 69, 70, 71; it stays in the diary on 2, 5 and 10 Jan 1877) — title formula or maxim? Default: withdrawn.

The cover entry `1876-12-12-cover.md` (068.0001–0002) was removed by a second rebuild on 2026-09-28. The printed edition alone cannot show which part of that page is Marie's and which is the editors'. The manuscript has not been scanned (a digitisation would cost about €90k), so there will be no cover entries until then. The rest of the carnet renumbers by −2: 068.0003 → 068.0001, and so on. The old URL redirects to `1876-12-12`.

- Source: tome09.docx ¶3381–3388, Mon Journal t.9 p.225 (Tome9.pdf p.229).
- Glosses moved elsewhere: the Latin gloss of «Dubium, illusio, deceptio, oppressio» now sits on 5 Jan 1877 (old 068.0280, now 068.0278), where it had been attached two paragraphs too late (see below). A row for the motto was added to `_glossary/culture/languages/LATIN.md`. *Gloriae Cupiditate* is already covered there.

Exact `_original` file as it stood before withdrawal (with its RSR/LAN notes and footnotes), to restore once the manuscript can be checked:

````markdown
---
date: 1876-12-12
entry_id: 1876-12-12-cover
carnet: "068"
location: Nice
locations: [Nice, Rome, Naples]
entities:
  people: []
  places: [Nice, Rome, Naples]
  cultural: []
workflow:
  research_complete: true
  linguistic_annotation_complete: true
  last_modified: 2026-09-27T22:18:57
  modified_by: RSR
  kernberger_covered: true
para_start: 1
para_end: 2
---
%% 068.0001 %%
%% kind: cover source="page de titre du Livre 68" %%
%% [#Latin](../_glossary/culture/languages/LATIN.md) [#French](../_glossary/culture/languages/FRENCH.md) [#Nice](../_glossary/places/cities/NICE.md) [#Rome](../_glossary/places/cities/ROME.md) [#Naples](../_glossary/places/cities/NAPLES.md) %%
%% 2026-09-27T21:49:56 RSR: Restored from tome09.docx ¶3381–3387, Mon Journal t.9 p.225: the title page Marie wrote for Livre 68 (motto, book number, dates, places). Not in the original extraction; cover entry per KRR 2026-09-27. %%
%% 2026-09-27T22:18:57 RSR: Title page of Livre 68 in Marie's hand. «Gloriae Cupiditate» and «Dubium, illusio, deceptio, oppressio» are Latin; keep them in Latin in every translation and let the footnotes carry the meaning. The four-word motto recurs in the diary on 5 January 1877 (068.0280) and 10 January 1877 (per Kernberger 2013, which renders the 10 January passage). The places line «Nice / depuis le 6 février Rome et Naples» matches the notebook's itinerary: Nice until 6 Feb, then Rome (7 Feb) and Naples (from 8 Feb). %%
%% 2026-09-27T22:40:54 LAN: LATIN: keep both mottoes in Latin («Gloriae Cupiditate» = out of desire for glory; «Dubium, illusio, deceptio, oppressio» = doubt, illusion, disappointment, oppression); the footnotes carry the meaning. «Livre 68ème» = notebook no. 68 (Marie's «livre» = notebook, not a published book). %%
%% 2026-09-27T22:40:54 LAN: TRAP: STRUCTURAL — this is the notebook's title page, set as seven separate lines; keep the line breaks and do not turn it into prose or a heading. %%
Gloriae Cupiditate[^068.0001.1]
Livre 68ème
depuis le mardi 12 décembre 1876
jusqu'au vendredi 23 février 1877
Dubium, illusio, deceptio, oppressio[^068.0001.2]
Nice
depuis le 6 février Rome et Naples

[^068.0001.1]: Latin: roughly "out of desire for glory" (literally "by the desire of glory"). Marie wrote it at the head of the title page of this notebook.

[^068.0001.2]: Latin: "doubt, illusion, deception, oppression." On 5 January 1877 Marie calls these four words "my life expressed in distinguished language".

%% 068.0002 %%
%% kind: cover source="page de titre du Livre 68, écrit en travers" %%
%% 2026-09-27T21:49:56 RSR: Restored from tome09.docx ¶3388, Mon Journal t.9 p.225. The docx OCR reads «23 mail 875»; the printed page reads «23 mai1875». Written across the title page; cover entry per KRR 2026-09-27. %%
%% 2026-09-27T22:18:57 RSR: Crosswise note on the title page, dated 23 May 1875, eighteen months before the notebook opens. Its purpose is unknown; nothing in the surrounding diary explains it (the first meeting with Audiffret recorded in the glossary is 28 May 1875). Translate the date only; do not interpret it. %%
%% 2026-09-27T22:40:54 LAN: «[En travers: …]» = written crosswise across the page; editorial bracket label, translate the label as elsewhere in the corpus. Only the date is Marie's. %%
[En travers: 23 mai 1875]
````

### Footnote drift fixed in the same pass (1877-01-05)

The footnote backfill had harvested from the ID-drifted en file, so six footnote markers in `_original/068/1877-01-05.md` sat two paragraphs late. They now sit on the word they gloss, and their definitions are in that paragraph:
- `[^acrostiche]` → «En voilà un four ?»
- `[^giaour]` → «affreux Giaour»
- `[^girofla]` → «Girofla»
- `[^culpamea]` → «Culpa mea.»
- `[^latin]` → «Dubium, illusio, deceptio oppressio.»
- `[^cabinet]` → «cabinet d'études»

The embedded French copies in cz, uk, en and fr were updated to match. The translations already had their markers in the right places.
