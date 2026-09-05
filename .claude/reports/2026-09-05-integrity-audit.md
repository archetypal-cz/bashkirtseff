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
