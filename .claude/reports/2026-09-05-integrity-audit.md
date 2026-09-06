---
date: 2026-09-05
operator: "@kerray"
type: audit
target_language: [cz, uk]
carnets: ["011", "014", "018", "022", "060", "063", "074", "081", "082", "092"]
pipeline: [audit]
status: final
---

# Integrity audit 2026-09-05 — footnote glue, and what the original-based measurement exposed

Started as the footnote-glue audit (diary prose glued onto `[^id]:` definition lines,
vanishing from the reader's paragraph). The glue itself is closed: 6 blocks repaired
today (cz/011 011.0384; cz/092 092.0243, 092.0262, 092.0283, 092.0340, 092.0362), all
traced to the 2026-06-18 canonical-footnote gap-fill (#17). Re-measuring the tree at that
commit shows the migration produced at least 32 glued blocks, 22 of which later polish
passes fixed without logging. A standalone detector now lives at
`src/scripts/check_footnote_glue.py` (see "Tooling" below); the current cz/uk/en tree has
no candidate it flags that is not a known benign shape.

The more valuable output is what the **corrected measurement** — translation visible text
per paragraph block against `content/_original`, not against the `%% … %%` French embedded
in the translation file — exposed once the artifacts were removed. Everything below is
**reader-facing and unfixed**; each item needs its own pipeline run, not a structural edit.
Nothing in this report was repaired.

## Method, briefly

`ratio = visible translation chars / French chars in content/_original`, per block,
excluding `%%` lines, bare `[//]:` comments, headings and footnote definitions. Typical
honest ratios: cz 0.78–0.90, uk 0.80–1.05. Blocks under 0.55 with French ≥ 150 chars were
opened and compared. Symmetric shortfalls (cz ≈ uk, both low) were checked against the
source and turned out to be source-side artifacts (§5) or bare RSR/LAN comments miscounted
in an earlier pass — none are translation defects. Scripts:
`check_footnote_glue.py` (committed) and the ad-hoc `orig_shortfall2.py` /
`file_level.py` used for this report (scratchpad; trivial to reconstruct from the former).

## 1. cz/018 — 12 entries are roughly half untranslated (MAJOR)

`content/cz/018/`, 1874-04-11 through 1874-04-23. File-level ratio (all visible Czech /
all French in the source file), with uk for comparison:

| file | French chars | Czech chars | cz ratio | uk ratio |
|---|---|---|---|---|
| 1874-04-20.md | 1,532 | 472 | **0.31** | — |
| 1874-04-13.md | 2,416 | 853 | **0.35** | 0.89 |
| 1874-04-22.md | 1,974 | 739 | **0.37** | — |
| 1874-04-11.md | 3,008 | 1,197 | **0.40** | 0.88 |
| 1874-04-16.md | 776 | 333 | **0.43** | — |
| 1874-04-15.md | 2,827 | 1,412 | **0.50** | — |
| 1874-04-19.md | 5,680 | 2,864 | **0.50** | 1.07 |
| 1874-04-12.md | 2,343 | 1,207 | **0.52** | — |
| 1874-04-23.md | 2,300 | 1,255 | **0.55** | — |
| 1874-04-21.md | 1,180 | 663 | **0.56** | — |
| 1874-04-18.md | 2,719 | 1,691 | 0.62 | — |
| 1874-04-17.md | 1,238 | 780 | 0.63 | — |

The rest of cz/018 (03-28 … 04-10, 04-14) sits at 0.79–0.93, i.e. normal. About 40
blocks are affected. Representative blocks:

- `1874-04-19.md` 018.0293 — French 968 chars, Czech 146. The Czech under this ID
  ("Tchernichoff nás doprovází ke kočáru…") is not this paragraph at all (the French is
  about M. Lautrec walking Marie and Dina to the carriage); Lautrec does appear elsewhere
  in the file, so this is abridgement plus misalignment, not a different source text.
- `1874-04-19.md` 018.0300 — French 167 chars ("Le temps passe, *il* s'éloigne et je
  l'aime…"), Czech is the single sentence "Uvidím ho ještě?" (16 chars).
- `1874-04-15.md` 018.0251 — French 1,357 chars (arrival at Vintimille), Czech 182.
- `1874-04-11.md` 018.0198, 018.0205, 018.0211; `1874-04-13.md` 018.0222–0232 (six
  blocks); `1874-04-19.md` 018.0281–0302 (ten blocks); `1874-04-20.md` 018.0306–0310;
  `1874-04-21.md` 018.0312–0315; `1874-04-22.md` 018.0317–0319 — all 0.10–0.50 against
  a uk of 0.76–1.01 on the same blocks.

All twelve files carry `translation_complete`, `editor_approved`, `conductor_approved`
and a `fablelous 2026-08-08` stamp. The source was renumbered on 2026-02-10 (d48f5db05);
whether the Czech predates that and drifted, or was translated from a shorter extraction,
is not determinable from the trees alone. **Needs:** a full re-translation pass (TR → OPS →
RED → CON) of the twelve entries against the current source, then `verify-carnet cz 018`
id-alignment. Do not polish; the text is not there to polish.

## 2. cz/014/1873-12-18 014.0141 — paragraph stops ~2,900 French chars early

Single block, French 3,692 chars, Czech 812 (ratio 0.22; uk renders 3,005). The Czech
ends at "…protože to byla bída." The French continues for roughly 2,900 characters (the
Tir scene, the reflection on the others' contentment, down to "Je suis trop malheureuse !")
with no Czech counterpart anywhere in the file. A 2026-06-13 RED comment on the block
records a splice repair ("GEM comment splits paragraph; rejoined") — the truncation may
date from that or from the GEM era. **Needs:** translate the missing remainder in place
(TR + RED), no restructuring.

## 3. cz/011/1873-10-21 011.0156 — one French paragraph absent

Block 011.0156 holds two French paragraphs in the source: "Nous avons tourné mais hélas
trop tard… lui surtout" (~370 chars) and "Elle est une vieille puppy…". The Czech renders
only the second; the first has no counterpart in the file (uk has it). Ratio 0.25 vs uk
0.70. **Needs:** translate the missing paragraph as its own visible line inside the block
(TR + RED).

## 4. uk/074/1877-08-23 074.0051 — last two sentences absent

French 836 chars, uk 449 (0.54), cz 707 (complete). The Ukrainian stops after the
"faux Diogène … race terrible qui se mêle de tout" sentence; the closing two sentences
("Je ne sais pourquoi je les nomme les faux Diogène … qu'on laisse tomber", ~330 chars)
are missing. **Needs:** translate the two sentences in place (TR + RED, uk).

## 5. `content/_original/081` and `/082` — sliding-window paragraph duplication (source-side)

In the French source for these two carnets each paragraph block also repeats the
previous block's paragraph, e.g. `082/1878-08-09.md`: 082.0003 = "Une série de choses
mirobolantes…" + "Le Repas des fauves…"; 082.0004 = "Le Repas des fauves…" (again) +
"L'Illumination…"; 082.0005 = "L'Illumination…" (again) + "La Chute du drapeau…"; and
so on. Translators rendered each paragraph once, under the block where it first appears,
so every 081/082 block measures ~50 % short in **both** languages (this produced 59 of the
125 rows in the first glue scan and the whole "other language also flagged" cluster).
The same duplication is carried into the `%% … %%` French embedded in cz/uk/en.

The 2026-08-14 dedup commit (8067b5aac, "dedupe page-overlap extraction artifacts in
carnets 081-082", 36 files) removed the byte-identical repeats. What survives are the
**near-identical** variants the exact-match dedup could not see — the repeated copy
differs only by an italic title marker, a footnote ref or whitespace (e.g. 082.0003
"Le Repas des fauves. Nous regardons…" vs 082.0004 "*Le Repas des fauves.* Nous
regardons…"). Normalised count today: **16 residual duplicates in 5 source files** —
`081/1878-08-06.md` (1, 081.0468/0469), `081/1878-08-07.md` (4, from 081.0483/0484),
`082/1878-08-09.md` (7, from 082.0002/0003), `082/1878-08-14.md` (1, 082.0081/0082),
`082/1878-08-18.md` (3, from 082.0103/0104). Not a translation defect and not
reader-facing; it is a **structural fix on the source** (drop the repeated paragraph
from the later block, then `just sync` the embedded copies) — until then any
length-based metric on those blocks lies, in every language.

## 6. Smaller reader-facing warts

- `content/cz/063/1876-07-12.md` 063.0145 — the visible text is a leaked translator
  placeholder: "[Tato poznámka je zpracována jako footnote u odstavce 063.0141]". The
  source paragraph is Marie's own numbered note ("¹. Ce qui est très curieux, une fois par
  an…", 369 chars); cz moved it into a footnote at 063.0141 (uk renders it in place, 353
  chars). **Needs:** either render the paragraph in place like uk, or delete the bracket
  line and keep the footnote — editorial decision, then a one-line edit.
- `content/cz/060/1876-05-13.md` — the marker `%% 060.0207 %%` appears twice (lines 724
  and 729). The text is intact; the duplicate marker splits one block into two and will
  confuse id-alignment. **Needs:** structural fix (remove the second marker), then
  `verify-carnet cz 060`.
- `content/cz/022/1874-08-08.md` 022.0464 — the notebook's cover notes ("commencé le
  vendredi 8 août 1874 / terminé à la Cour de Londres, Spa … / depuis jeudi 20 août, rue
  Longue…", 201 chars) are omitted; uk renders them. Paratext, low priority. **Needs:**
  three short lines (TR).
- `content/cz/105/1884-09-11.md` 105.0809 — the source's editorial line "[Note: Beginning
  of Book 106 …]" is omitted (uk keeps it). Editorial, not Marie's text; leave or add at
  the editor's discretion.

## 7. Adjudicated as NOT defects (so nobody re-investigates them)

- Every block in the first scan's "other language also flagged" set (carnets 081/082):
  §5.
- uk/062–063 shortfalls: old `[//]: # ( RSR … )` comments wrapped in `%% … %%` were
  being counted as French; the translations are complete.
- cz/053, cz/055 shortfalls: date-only `%% 2026-05-30 TR: … %%` notes counted as
  French; complete.
- cz/044 044.0003: the embedded French carries a paragraph that belongs to 044.0009,
  where it is translated.
- uk/026 026.0030, uk/078 078.0192, cz/030 030.0091: symmetric compression, source has
  inline tags; complete.
- cz/005/1873-05-22 `[^1]`: Marie's English kept in-text with the Czech in the
  footnote — inverse of the cz/CLAUDE.md convention, but a recorded TR decision; nothing
  lost.
- All 20 cz/uk and 5 en candidates the glue detector lists on today's tree: legitimate
  (short sentence + long note; translator's note quoting the English/Italian original;
  inline `%% LAN %%` inside the source line inflating the French count).

## Tooling

- `src/scripts/check_footnote_glue.py` — original-based two-ratio detector; header
  documents the signature, the recall figures and why the embedded French is the wrong
  denominator. Validated: 10/10 on the pre-repair positives; on today's tree 25
  candidates (20 cz/uk + 5 en), all benign shapes listed in §7; `--carnet 092` → 0,
  exit 0. Exit 1 on any candidate, 2 on usage error, `--warn-only` forces 0.
  **Not wired into the gate** — pending human approval. Proposed justfile lines
  (next to `check-comments`):

  ```
  # Find diary prose glued onto footnote-definition lines (renders as footnote, vanishes from the paragraph). Measured against content/_original. Flags: --lang cz,uk --carnet 092 --warn-only
  check-footnote-glue *FLAGS:
      uv run src/scripts/check_footnote_glue.py {{FLAGS}}
  ```

  and, if it is to join `verify-carnet-all` as a WARN-tier sweep, one line inside that
  recipe's loop after the `npx tsx … --quiet` call:

  ```
      uv run src/scripts/check_footnote_glue.py --lang {{lang}} --carnet "$carnet" --quiet --warn-only
  ```

  (WARN-tier because the benign shapes in §7 are permanent; promote to FAIL only with
  an allowlist of those blocks.)
- `src/scripts/check_footnote_swallow.py` — earlier sentence-delta heuristic (cz early
  carnets); still valid, narrower.

## Watchlist candidates

- "Conductor-approved but half-translated" (cz/018): the review pipeline never compares
  length against the source; a file-level ratio check (< 0.65 → WARN) in verify-carnet
  would have caught it in May.
- "Silent structural repairs": 22 glue blocks were fixed by polish passes without a
  STRUKTURA/STRUCTURAL comment. Polishers should log any move of text between a footnote
  and its paragraph.

---

## Addendum 2026-09-06 — outcomes, and two measurement traps

The 20 entries this audit flagged were worked on 2026-09-06. Outcome:

| entry | verdict | result |
|---|---|---|
| cz/018 ×12 | real, but NOT a truncation — see below | in progress |
| cz/014/1873-12-18 | real omission (~2,880 chars of French untranslated) | restored, 0.37 → 0.86 |
| cz/011/1873-10-21 | real omission (452 chars); embedded French was NOT stale | restored, 0.63 → 0.87 |
| cz/082/1878-08-14 | **not a defect** — artifact of the 081/082 duplication | unchanged, correctly |
| en/102 ×3 | real: 8 consecutive paragraphs missing in 12-01 alone | restored to 98-103% (919cb7669) |
| en/091 ×2 | **false positives** — see trap 2 | unchanged apart from a 1-char fix |

### cz/018 is not a stale snapshot — it is a different French text

The embedded French that cz/018 was translated from is **not a truncated copy of the
manuscript but a condensed, rewritten one**. Block 018.0198 embedded
"Nejentsov, par le petit garçonnet de Paul, a envoyé un bouquet pour Moussia";
`_original` has "Il y a deux ou trois jours que Paul m'a donné un bouquet de
marguerites… Un certain *Nejentsov* qui ne quitte pas Paul, a, selon nos conjectures
envoyé ce bouquet…" — different sentences, and the condensed one gets the relationships
wrong. In 04-12 the Czech names Vienna, republicans and Monte Carlo, none of which are in
the manuscript paragraph.

Provenance is unresolved and worth someone's attention: `_original/018/1874-04-11.md` has
held the manuscript text in **every commit in its history**, so the condensed text never
came from there — yet `_original` carries a LAN annotation glossing "garçonnet", a word
only in the condensed version. So some source-side annotation was written against it too.
cz/018 has zero `Censored_1887` tags, so this was not a deliberate censored-edition
inclusion. **Open editorial question for KRR: is that condensed French a source worth
keeping, reconciling, or discarding?** Displaced Czech is being preserved in `%%` comments
rather than deleted, so the decision stays open.

### Trap 1 — never measure a working tree that already contains the fix

I re-measured coverage while an agent's restoration was already on disk, read its own
restored text as evidence that nothing had been missing, and ordered a revert that would
have deleted eleven real paragraphs. Always measure `git show HEAD:<file>`. This is the
same circularity as the underlying bug: reviewers validating a translation against a copy
embedded in the file being reviewed.

### Trap 2 — paragraph-ID misalignment mimics missing text

en/091's 0.40 / 0.65 readings were **not** missing text. In four files —
`1881-05-10`, `05-11`, `05-12`, `05-14` — the date heading is given its own block and
takes the first ID, so every block from the second on carries the previous block's ID and
one ID appears twice. Any ID-keyed comparison then lines the source's first large
paragraph up against a block holding only `# Wednesday, 11 May 1881`. `verify-carnet`
already reports this as an id-alignment WARN.

**Open question for KRR:** does a date heading get its own paragraph ID (as en/091 does
throughout) or share the first paragraph's (as `_original` does)? It needs one carnet-wide
decision, not four patches — which is why the four files were left alone.

Related: a block-length extractor that assumes one French line per block also
under-reads any block whose French spans several `%%` lines or is interrupted by an inline
`%% LAN … %%` comment (the cause of a spurious "82% stale" reading on cz/011, where all 19
blocks were in fact byte-identical to source). Use `src/scripts/check_footnote_glue.py`,
which is validated, rather than ad-hoc scripts.

## Addendum 2026-09-06b — five defects found by reading, none fixed

Surfaced by tr-en-missing while reading en/091 and en/102 against the French. All
verified independently before recording. **Nothing below was changed.** Each needs a
decision or a mechanical pass, not entry-by-entry translation work.

### A. Translations drop the source's glossary tags — corpus-wide

Comparing the tag set of each `_original` entry against its translation:

| tree | files compared | files dropping source tags | share |
|---|---|---|---|
| cz | 3738 | 803 | 21% |
| uk | 3738 | 756 | 20% |
| fr | 3738 | 1299 | 34% |
| **en** | 3738 | **1755** | **46%** |

Per carnet the concentration can be far higher: en/091 drops tags in 58 of 71 files (82%),
en/102 in 44 of 88. What is dropped is overwhelmingly `culture/themes/` — EMOTIONS,
MORTALITY, PHILOSOPHY, READING, RELIGION, LOVE, MUSIC_THEME, POLITICS, HEALTH. People and
place tags are carried faithfully. A few files also ADD tags the source lacks (en 8 in 102).

**Invisible to the current gate**: `verify-carnet`'s link and glossary-depth checks
validate the tags that are present, never the ones that are absent. Impact depends on
whether theme tags drive anything reader-facing; if they do, this is a large hole.

### B. Léon Gambetta is filed as a church (source-side, affects every language)

`content/_original/_glossary/places/churches/GAMBETTA.md` has `name: Léon Gambetta`,
`type: Place`, `category: places/churches`. There is no `people/*/GAMBETTA.md`. Entries tag
him from that path in sentences about his rumoured marriage, so the referent is
unambiguously the politician. **306 files reference the churches path**, so recategorising
means a path rewrite across the corpus — not a quick fix, and it must be done in one pass.

### C. An orphaned LAN annotation, possibly marking a hole in the French

`content/_original/091/1881-05-11.md:29` carries
`LAN: "l'innocente Isabelle" - ironic reference to Queen Isabella, possibly satirical`.
The string `Isabelle` occurs exactly once in that file — inside the annotation itself. It
is nowhere in the French it annotates, though the paragraph does discuss
`Cette chose de la Reine d'Espagne`. Either the note drifted from a neighbouring entry, or
the phrase dropped out of the source paragraph. Worth checking against the manuscript.

### D. Blackened-word brackets use seven different wordings in en

Across en/091 and en/102, 52 renderings of `[Mots noircis: …]` appear as:
`[words blackened` (20), `[Words blackened` (12), `[word blackened` (9),
`[word blacked out` (5), `[words blacked out` (3), `[Words blacked out` (2),
`[word blackened]` (1). Reader-visible editorial furniture; one mechanical normalisation
pass over the English tree. No translator will fix this entry by entry.

### E. Manuscript garbles in `_original` that each language silently normalises

Nine confirmed in five files: `c'était moi II!` (→ `!!`), `ftuin dernier)` (→ `(juin
dernier)`), `C'en serais désolée)` (→ `(J'en serais désolée)`), `un ou deux être` (→
`êtres`), `une de ces tâches` (→ `taches`, blemishes not tasks), `me fera pas dire` (→ `ne
me fera pas dire`), `ridcule`, `impossbible`, `compre-rendu` (→ `compte-rendu`). Each
translator fixes these independently and silently, so the source keeps its errors and the
corrections are never shared. Compare the recurring `!!` → `I!`/`II`/`11!` artefact already
logged in the uk wave.

## Addendum 2026-09-06c — cz/018 provenance, corrected and narrowed

**The earlier "garçonnet" inference in Addendum 2026-09-06 was WRONG.** I claimed `_original`
glossed a word existing only in the condensed text, implying source-side contamination. It
does not: `content/_original/018/1874-04-11.md:42` reads "…quel charme il peut trouver dans
la société d'un **garçonnet** comme Paul." The word occurs twice in that file — in the LAN
note and in the manuscript line it annotates. Disregard that inference.

**What the evidence actually supports is sharper and date-separable.** Scanning every role
comment in cz/018 for French fragments absent from `_original`:

- **Every** comment quoting condensed-only French is dated **2026-02-16 or later** — TR, GEM,
  RED, FAB.
- **No** LAN (2026-01-30) or RSR (2025-06/07) comment quotes anything absent from
  `_original`; their quotes match modulo diacritics ("lache"/"lâche", "o prodige"/"ô prodige").

The clean illustration is block **018.0231**: the LAN note glosses "grandeurs passées"
(3× in `_original/018/1874-04-13.md`) while the GEM note on the *same block* quotes
"anciennes splendeurs" — **absent from the entire `_original` tree**. Two annotators, one
paragraph, two different source texts.

**Conclusion: source preparation ran on `_original`. The condensed text entered at the cz
translation-file scaffolding step, and everything from 2026-02-16 onward reviewed against
it.** So the source-side LAN/RSR annotations are probably sound, and the search for how this
happened should focus on the cz scaffolding step, not on source prep.

### Reviewer notes in cz/018 can argue *against* the correct text

At **018.0207** a RED comment (2026-06-13) corrected good text *toward* the condensed
reading, pushing the manuscript's "grande assemblée" to "réunions". Anyone reviewing this
carnet must check reviewer notes against `_original` before deferring to them.

### Stale annotations in cz/018 — all translation-side, none edited

04-11 018.0199 FAB ("Quelle question !") · 018.0204 TR+RED (discuss "crachat", which is real
but sits in 0205 — the comment landed on the wrong block) · 018.0206 RED ("lorsque l'office
finit nous étions debout depuis") · 018.0207 RED ("réunions", see above) · 04-12 018.0216 FAB
×2 ("nous nous injurions", "n'avoir pas de suite dans les idées") · 04-13 018.0221 FAB
("J'ai fait") · 018.0231 GEM ("anciennes splendeurs") · 04-15 018.0250 FAB ×2 ("retenir",
"y a vu du sien") · 018.0255 RED ("il nous faudrait") · 04-16 018.0258 RED ("au Havre" —
no Le Havre anywhere in carnet 018).

Only tr-cz-018-A's six entries were scanned this way; 04-18..04-23 have not been.

### Open items for KRR beyond the provenance question

- `Machenka` (33×) vs `Mačenka` (10×) coexist in cz/018, now split *within* single files
  after the 2026-08-08 FAB pass unified only 04-15.
- The lone Czech-phonetic `Nejencov` against the carnet's Latin-name convention
  (Walitsky, Anitchkoff, Le Bec) — the same FAB pass normalised "Anitčkovových" on that
  principle.
- 04-18: whether "in furia" stays visible inside the highlight (as the approved text has it)
  or is replaced by Czech with the Italian footnoted, per `content/cz/CLAUDE.md`.

## Addendum 2026-09-06d — what the cz/018 variant text actually contains

Inventory of Czech removed from 04-18..04-23 that has **no manuscript counterpart**. All of
it is also parked in-file in `%% … %%` comments, so this is an index, not the only copy.
(04-11..04-17 was handled by preserving in place from the start; its displaced text sits in
those files under `%% Dřívější český text: … %%`.)

**The variant is not a faithful abridgement. It contradicts the manuscript on facts, and
invents detail.** That bears directly on the editorial decision, so the cases are grouped by
kind rather than by block.

### It reverses or fabricates facts

- **018.0284** — Walitsky's duel is rendered as already fought where the manuscript has it
  *pending*; the slap comes *from* the other man where the manuscript has **Walitsky giving
  it**; Marie's "(Une histoire que je peux oublier.)" is dropped; and two sentences are added
  that exist nowhere in the source: "a on se podíval – hádejte kam? Jaká drzost!" and
  "Jak hrdý musí člověk být, když se bije za dámu!"
- **018.0307** — conflates two separate statements: the ragpicker remark is about **Hélène
  and Lise**; the Boutowskys are a different sentence about relations improving.
- **018.0286** — "La Musette a Viviani nás zvou": in the manuscript **Viviani alone** invites.
- **018.0310** — "poslouchali mě" (they listened to me); the manuscript has the Filimonoffs
  *wanting* to hear.
- **018.0317** — "Strašná bitva s mámou": there is no battle in the manuscript.
- **018.0314** — framed as hearsay about Paris and furniture; the manuscript has Marie's own
  Saturday departure with her mother.

### It invents whole passages

- **018.0318** — an entire poet's tableau ("Na balkóně, na pozadí měsíčního kouzla, půvabné
  dítě v bílých šatech…"). The manuscript has her kneeling by the balcony door, the dress in
  wide folds, the moon on her arms.
- **018.0269**, **018.0270**, **018.0281**, **018.0288** ("to člověku stoupne do hlavy", a
  bare gallicism), **018.0293**, **018.0306** ("Ples" where the manuscript says only
  "Le soir chez les Howard").

### It fabricates quoted "originals"

Most serious for a scholarly edition: footnote definitions quoted source text that does not
exist.
- `[^18.269.1]` claimed the English begins "I had a new dress, it was very nice. There were
  many bands of music…" — the genuine English begins mid-sentence at "bands of music from
  Menton".
- `[^18.273.1]` quoted a long Italian passage ("egl'altri sono uguali e non mi piacciono,
  nessuno mi garba, prenderò il primo che verrà…") absent from the manuscript, which has only
  "gli altri sono uguali, eccettuati certamente, qualche antipatia irresistibile".
- `[^18.287.1]` quoted "I was furious, it's so dull and ridiculous"; the manuscript reads
  "I was furious and I said a few words to show it to her."

### Implication for the editorial decision

A published redaction condenses; it does not reverse who struck whom, invent a moonlit
tableau, or attribute quoted English and Italian to a manuscript that does not contain them.
Whatever this text is, it is **not a witness to the diary**, and the footnotes citing it were
telling readers that Marie wrote words she did not write. That argues against preserving it
as a parallel source — but the decision remains KRR's, and every line is parked in-file
either way.

### For the cz/018 RED + CON pass

The restored text has never been reviewed — it was invisible when RED, CON and the
2026-08-08 polish pass ran — so cz/018 needs a full review, not a spot check. Carry these in:

- **Reviewer notes can argue against the correct text.** At 018.0207 a RED comment pushed the
  manuscript's "grande assemblée" toward the variant's "réunions". Check every note against
  `_original` before deferring to it. Ten stale annotations are listed in Addendum 2026-09-06c
  for 04-11..04-17; six more in the commit message of d3876fa88 for 04-18..04-23.
- **018.0219** (04-12): "avant de savoir qui il est" is rendered "Než zjistím jeho *jméno*" —
  name rather than who he is. Approved text, slight narrowing, not corrected.
- **Coverage ratios cannot screen this carnet.** Variant blocks were found at 1.25 and 1.59.
  Read block pairs; do not trust a metric.
- Open naming questions: `Machenka` (33x) vs `Mačenka` (10x), now split within single files;
  the lone `Nejencov` against the carnet's Latin-name convention; and whether "in furia"
  stays visible inside the highlight or is replaced by Czech with the Italian footnoted.

### A third category of fabrication: invented detail inside a quoted source

018.0327 (04-23) is worse in kind than the others and was nearly mis-stated, so the precise
shape matters. Marie quotes a Le Derby dispatch. Baden and the steeplechase **are** genuine:
the manuscript has Bar-le-Duc, "l'un des chevaux de l'écurie du duc de Hamilton", winning
"plusieurs victoires importantes" in steeple chase last year, and Esterhazy known "à Bade".

What the variant added **inside the quotation marks** is not in the manuscript: select company
at the hotel, horses *trained for* Baden, and a second steeplechase worth **3,000 gulden** —
the manuscript quote names no sum at all.

So the fabrications fall into three kinds, in ascending order of seriousness for a scholarly
edition:

1. **Invented narration** — 018.0318's moonlit tableau. Bad, but visibly Marie's voice.
2. **Invented quotation of Marie** — 018.0269, 018.0273, 018.0287, where footnotes told
   readers the English and Italian "originals" said things she did not write.
3. **Invented detail inside a documentary source Marie is quoting** — 018.0327. A reader has
   no way to tell an embellished newspaper from a real one, and the embellishment is
   plausible enough to survive scrutiny: it sits among genuine names, a genuine horse and a
   genuine racecourse.

Category 3 is the reason this text cannot simply be left in place pending a decision. The
other two misrepresent the diary; this one manufactures period evidence.
