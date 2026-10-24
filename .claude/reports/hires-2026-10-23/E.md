# E: structural fixes from the sharp scans (2026-10-24)

Brief: `BRIEF-E.md`. One carnet at a time; no git writes, no OPEN-ITEMS. Plans live in the scratchpad
(copied into the run's `content/_renumber/CCC-2026-10-24.json`, key `plan`).

## 022 (t.4 pp.59–60) — DONE

Page images read: t.4 p.59 (bottom) and p.60 (top). p.59 sets the 12 restored lines one per line, with no
stanza gaps; «Wal[itsky]» is an indented signature line of its own between «Docteur en droit» and «Voilà le
directeur de la redoute» (like «Val.» on p.60), so it got its own ID. p.60 opens with «Pas habillé, pas lavé»
and sets «Aux quatre yeux Albin Body» as one line.

**Plan:** 022.0080 `set_french` «==D'un Etat détruit==[^022.0080.r1]»; 12 `new` paragraphs after it (11
restored lines, «Wal[itsky]» included, plus «Pas habillé, pas lavé»), each with an RSR NOTE citing t.4 p.59 / p.60
and the split from 022.0080; tag Merjeewsky on «Merjeevsky Mechlav», Walitsky on «Wal[itsky]»; 022.0091
`set_french` «==Aux quatre yeux Albin Body==[^022.0091.r1]»; 022.0092 in `drop` (merged into 0091).

**Id map:** 453 → 464 paragraphs (12 new, 1 dropped). 0001–0080 unchanged; new 0081–0092; old 0081–0091 →
0093–0103; old 0092 dropped (`022.DROPPED-0092`, no references to it anywhere outside `_renumber`); old
0093–0453 → 0104–0464 (372 IDs changed). Only `1874-07-25.md` changed in content; the other 15 entries only
renumbered. Map/SQL: `content/_renumber/022-2026-10-24.json`, `022-2026-10-24.sql` (new, untracked);
`redirects.json` unchanged (no file renamed).

**Hand work after `--write` (all five trees):**
- Head 0080: the multi-line runs r2 + r1 replaced by the first line `==…==[^022.0080.r1]`; def r2 removed;
  the Merjeewsky/Walitsky tag line(s) removed from the head (now on 0086 / 0089); tool's `SOURCE CHANGED`
  removed; ED note (trees) / RSR NOTE (`_original`) recording the split.
- 0081–0092: each line carries `==…==[^022.NNNN.r1]` + definition (localised; uk in its central definition
  list at the end of the entry, like its neighbours). cz/uk/en: the `TODO` replaced by the matching line of
  the old 0080 translation, unchanged (uk keeps its trailing commas outside the mark, as in its neighbours),
  one ED note per paragraph. fr: the tool's verbatim French removed — the neighbouring verse paragraphs have no
  visible fr text and render `_original`, so these follow that state (embedded copy + def only).
- 0103 (old 0091): label in the set_french text fixed by hand to `[^022.0103.r1]` (the rewriter does not
  renumber a label inside the plan's `set_french`); Body tag moved here; cz «Se čtyřma očima Albin Body»,
  uk «Чотириокий Альбен Боді», en «With four eyes Albin Body» (joined unchanged); `SOURCE CHANGED` removed; ED/RSR note.
- Range ends the rewriter does not touch: «022.0080–0105» in the 2026-10-23 RSR notes (`_original`, 25 notes)
  → «022.0080–0116»; «022.0093–0105» in the cz/uk/en/fr 2026-10-24 TR/FRE notes → «022.0093–0116».
- Approval flags: the translation was distributed unchanged and no `TODO` is left, so frontmatter restored from
  HEAD in cz/uk/en (cz/uk `translation_complete/editor_approved/conductor_approved: true`, en
  `translation_complete/opus_reviewed/conductor_approved: true`) and the tool's flags-reset ED note removed;
  fr `edition_complete: false` as before. `_original` `linguistic_annotation_complete` back to `true` (no new
  French, only the same lines split); `para_end: 117` kept.

**Gates:** `just renumber-check 022` PASS (0 fail, 0 warn); `verify-carnet` PASS (0/0) for `_original`, cz,
uk, en, fr; `splicescan` empty for all five (only its info line «footnote-glue: 0 candidate(s)»);
`check-comments cz` OK; footnote refs/defs balanced in every tree; no `TODO`/`SOURCE CHANGED` left. No es tree for 022.

**Files outside `content/{_original,cz,uk,en,fr}/022/` touched by the rewriter (lead must commit them):**
content/_original/021/1874-07-14.md, content/_original/021/1874-07-19.md, content/_original/023/1874-08-19.md,
content/_original/023/1874-08-26.md, content/_original/028/1874-12-30.md, content/_original/050/1875-11-21.md,
content/_original/_glossary/culture/theater/ORPHEE_AUX_ENFERS.md, …/culture/themes/SPORT.md,
…/people/family/GRAND_PAPA.md, …/people/mentioned/{COMTE_BLONDOFF,DEL_PUENTE_I,DE_BIESME,DORIA,HARISTOFF,JAHAL,
LAMBERTYE,MALEZIEUX,NEUFARGE,PAPARIGOPOULOS,SOMAGLIA,THERESE,WHEELWRIGHT,WINSLOW}.md,
…/people/recurring/WALITSKY.md, …/places/social/{BAAS,CASINO_SPA}.md (glossary under content/_original/_glossary/),
content/cz/023/1874-08-19.md, content/cz/023/1874-08-26.md, content/en/023/1874-08-26.md,
content/fr/023/1874-08-26.md, content/fr/_non_french_passages.md, content/fr/_translate_manifest.json,
content/uk/023/1874-08-08.md, content/uk/023/1874-08-26.md, content/uk/023/1874-09-02.md,
content/uk/TranslationMemory.md, content/_renumber/022-2026-10-24.json, content/_renumber/022-2026-10-24.sql.

**Left:** the 2026-10-23 RSR notes on 0080 and 0093–0116 still say the first thirteen lines «are missing here»
(superseded by the restoration; history, not rewritten). The 0086 «Merjeevsky» line keeps the print's spelling
(tag Merjeewsky).

## 032 (t.5 p.43, PDF 44) — DONE

Page images: t.5 PDF 44 (0.35–0.75) and PDF 45 (top). PDF 44 confirms the indented paragraph break after «… ce
sont des plaisanteries.»; the next paragraph runs from «On voit ce que j'ai ajouté» across the page to «On y
songera.» (PDF 45), with no further break.

**Plan:** 032.0205 `set_french` «Je n'ajouterai rien du tout, ce sont des plaisanteries.»; one `new` paragraph
after it with the rest («On voit ce que j'ai ajouté … On y songera.»), RSR NOTE citing t.5 p.43 (PDF 44), tag
Dreams (moved from the head with «mes deux rêves»).

**Id map:** 556 → 557 paragraphs (1 new, 0 dropped). 0001–0205 unchanged; new 0206; old 0206–0556 → 0207–0557
(351 IDs changed). Only `1875-04-30.md` changed in content. Map/SQL: `content/_renumber/032-2026-10-24.json`,
`032-2026-10-24.sql` (new, untracked); `redirects.json` unchanged.

**Hand work after `--write`:** head: Dreams tag removed (all trees), tool's `SOURCE CHANGED` removed, the
visible translation cut after its first sentence (cz «Nepřidám vůbec nic, to jsou jen žerty.», uk «Нічого я не
додаватиму, це все жарти.», en «I shall add nothing at all; these are only jokes.», fr the French sentence);
ED note (trees) / RSR NOTE (`_original`). 0206: `TODO` (fr: the tool's footnote-less verbatim French) replaced
by the rest of the existing translation, unchanged; the two motto notes (*Ich diene*, *volo*) moved with it and
relabelled to the new paragraph (cz `32.206.1/2`, uk `32.0206.1/2` in its end-of-entry list, en
`032.0206.1/2`, fr `32.0206.1/2`); ED note. Approval flags restored from HEAD in cz/uk/en/fr (distributed
unchanged, no `TODO`), flags-reset note removed; `_original` `linguistic_annotation_complete` back to `true`;
`para_end` 207 kept (_original, fr).

**Gates:** `just renumber-check 032` PASS (0/0); `verify-carnet` PASS (0/0) for `_original`, cz, uk, en, fr;
`splicescan` empty for all five; footnote refs/defs balanced; no `TODO`/`SOURCE CHANGED` left. No es tree for 032.

**Files outside the carnet touched by the rewriter:** content/uk/TranslationMemory.md, content/uk/033/1875-05-16.md,
content/fr/_non_french_passages.md, content/fr/_translate_manifest.json, content/en/034/1875-06-13.md,
content/en/033/1875-05-16.md, content/_original/042/1875-09-09.md, content/_original/039/1875-08-18.md,
content/_original/038/1875-08-08.md, content/_original/034/1875-06-13.md, content/_original/034/1875-06-18.md, and
29 glossary files under content/_original/_glossary/: places/shops/BASSE, places/residences/VILLA_GIOIA,
places/cities/PHILADELPHIA, people/religious/{GOD,VIRGIN_MARY}, people/mentioned/{AMBROISE,CALDERON,COLLIGNON,
DELBEECHI,FRITZ,HELEN_OF_TROY,KROHN,LECLERC,LOUBA,MARIE_SAPOGENIKOFF,MAURICE,MME_MILORADOVITCH,OFFENBACH,OLGA,
SABATINI}, people/family/{GRAND_PAPA,PAPA}, people/artists/PIERRE_ALFRED_RAVEL, culture/theater/{BELLE_HELENE,
GIROFLE_GIROFLA,LA_BOULE,MADAME_LARCHIDUC}, culture/social_customs/THREE_GRACES, culture/art/VENUS_DE_MILO (.md);
plus content/_renumber/032-2026-10-24.{json,sql}.
**By hand:** content/_original/080/1878-05-11.md: an RSR note quoting «mes deux rêves, les cinq étoiles …» cited
032.0205; it now cites 032.0206.

**Left:** the head's older notes (RSR 2026-09-29 on the drawing, LAN 2026-10-21 on «[Croquis]») describe the
pre-restoration text; history, left in place.

## 034 (t.5 p.138, PDF 139) — DONE

Page image: t.5 PDF 139 (mid). The print has «- Oui, c'est cela, fit Girofla, c'est ce qu'il y a de mieux.» as
a dialogue line (hyphen dash, like «- Cela veut dire innocence, dit ma tante.» above it), and «Je ne dis rien.» on
a line of its own, indented like «Je m'inclinai.» (the PDF text layer had lost the dash).

**Plan:** 034.0480 `set_french` «— Oui, c'est cela, fit Girofla, c'est ce qu'il y a de mieux.» (house dialogue
dash «— », as in 034.0476–0479); one `new` paragraph «Je ne dis rien.» with an RSR NOTE citing t.5 p.138 (PDF 139).

**Id map:** 604 → 605 paragraphs (1 new). 0001–0480 unchanged; new 0481; old 0481–0604 → 0482–0605 (124 IDs
changed). Only `1875-06-20.md` changed in content. Map/SQL: `content/_renumber/034-2026-10-24.json`,
`034-2026-10-24.sql` (new, untracked); `redirects.json` unchanged.

**Hand work after `--write`:** head: `SOURCE CHANGED` removed; translation cut before its last sentence (cz
„Ano, to je ono,“ přitaká Girofla, „to je to nejlepší.“ / uk «— Так, саме так, — мовив Джирофла, — це найкраще,
що є.» / en «— Yes, that's it, said Girofla — it is the best thing there is.» — all three already rendered it as
dialogue, so the dash fix needs no translation change); 0481: `TODO` → «Neříkám nic.» / «Я нічого не кажу.» /
«I say nothing.» (unchanged), ED notes; fr: the tool's verbatim «Je ne dis rien.» removed, as the neighbouring fr
paragraphs have no visible text and render `_original`. `_original` head: RSR NOTE (dash + split). Flags restored
from HEAD in all four trees (distributed unchanged), flags-reset note removed; `_original`
`linguistic_annotation_complete` back to `true`; `para_end` 485 kept (_original, fr).

**Gates:** `just renumber-check 034` PASS (0/0); `verify-carnet` PASS (0/0) for `_original`, cz, uk, en, fr;
`splicescan` empty for all five; no `TODO`/`SOURCE CHANGED` left. No es tree for 034.

**Files outside the carnet touched by the rewriter:** content/_original/041/1875-09-01.md,
content/cz/041/1875-09-01.md, content/uk/041/1875-09-01.md, content/en/041/1875-09-01.md,
content/fr/041/1875-09-01.md, content/fr/_non_french_passages.md, content/fr/_translate_manifest.json, and glossary
files content/_original/_glossary/people/royalty/LOUIS_II_OF_BAVARIA.md, people/politicians/GAMBETTA.md,
people/mentioned/{DUVAL,GERICKE,LEONIE,OLGA,STOLTZ}.md, people/core/ALEXANDRE.md,
culture/literature/HISTOIRES_HERODOTE.md; plus content/_renumber/034-2026-10-24.{json,sql}.

**Left:** the new 034.0481 has no `#Censored_1887` tag (the head keeps it; whether «Je ne dis rien.» is in the
1887 edition is for the tag audit). Same print pattern nearby, not in this brief: «Je m'inclinai.» is set on its
own indented line in the print but sits at the end of 034.0471 («— Fidélité, dit Audiffret … Je m'inclinai.») —
a split candidate for a later rebuild.

## 040.0038 (t.5 p.265, PDF 266; no rebuild) — DONE

The PDF text layer has the print's call after «heureux !» and the note «Traduction donnée par Marie» at the foot
of PDF 266 (the image was already read for A5).

- `_original` (`040/1875-08-27-28.md`): ref `[^040.0038.1]` after «heureux !»; definition «The printed edition has
  a footnote here: «Traduction donnée par Marie» (translation given by Marie), i.e. the French rendering after
  «traduction:» is Marie's own, unlike the starred proverb before it, which the editor translated (Mon Journal t.5
  p.265, Tome5.pdf p.266).»; RSR NOTE saying the earlier note's «not reproduced» is superseded.
- cz/uk/en: same label at the end of Marie's own translation («…šťastný!», «…щасливим!», «…lucky!»), localised
  definition (cz «Pozn. překl.: Tištěné vydání zde v poznámce uvádí …»), embedded French updated with the ref, ED
  note. uk keeps its own older gloss `[^40.0038.1]` (different label, different note).
- fr: the paragraph has no visible fr text and renders `_original`; embedded copy updated, French definition
  («L'édition imprime ici une note en bas de page : « Traduction donnée par Marie » …») and ED note added.
- Gates: `verify-carnet` PASS (0/0) and `splicescan` empty for `_original`, cz, uk, en, fr; `renumber-check 040`
  PASS; `just sync 040 cz --dry-run` 0 changes. `sync --footnotes --dry-run` prints a WARN for fr on 040.0038.1,
  the same false alarm it already prints for every fr r1 note of the carnet (fr keeps the source labels for
  paragraphs that render `_original`). No files outside the carnet touched.

## Summary

| carnet | change | paragraphs before → after | IDs renumbered |
|---|---|---|---|
| 022 | 0080 split into 13 (one per printed verse line); 0091 + 0092 merged | 453 → 464 | 372 (+1 dropped) |
| 032 | 0205 split into 2 | 556 → 557 | 351 |
| 034 | 0480 dialogue dash + split into 2 | 604 → 605 | 124 |
| 040 | footnote 040.0038.1 added in 5 trees | — | 0 |

All gates PASS in every tree. Approval flags: restored from HEAD in every touched entry (translations distributed
unchanged, no `TODO` left), so no entry needs re-review. Other changes in the working tree that are not from this
brief (067 drawings/clippings, BRIEF-F.md, `src/frontend/public/images/marie/clippings/`) were left alone.
