# A7-B: A7 source fixes carried into the trees (2026-10-23)

Source: `.claude/reports/hires-2026-10-23/A7.md`, `_original` commit 17777b344c. Embedded French was already synced by the lead. All 8 impact pids were checked against `_original`, and the embedded French matched in every tree. There are no Russian marks in this package.

Edits: visible text lines were changed by an exact-substring script on lines without comment markers. Each changed paragraph then got one comment, added with the Edit tool (`TR`; `FRE` in fr), timestamp 2026-10-23T23:36:23, anchored on the next paragraph ID.

## cz: 7 paragraphs
- 070.0122: «po Dusk z Orpheline» (was Duck / Orphelina); Gorgona «z Orpheline».
- 070.0125: Game Lady «z Jessy».
- 070.0610: «Vincenzo Pourquet».
- 070.0611: «Brunetta d'Osseaux».
- 071.0227: `[?]` removed from «o 3 kg», «60 ½ kg» and «64 kg»; La Gorgona now «51 ½ kg».
- 071.0228: «La Durdent» and «La Gommeuse». The weights 57 ½ [?], 40 [?] and 33 [?] keep their `[?]`, because the source still marks them uncertain.
- 071.0229: «pro klisny a koně» (word order follows «per Cavalle e Cavalli»); La Gommeuse and La Durdent; `[?]` removed from Wild Boy's age and weight and from La Durdent's 67 ½.
- 100.0166: no change needed. «a to mi přerušilo práci» already has the corrected sense.

## uk: 7 paragraphs
- These are the same 7 pids as cz, with the same changes. Names follow the tree's established practice: horse names stay in Latin script and people's names are transliterated, so «Вінченцо Пурке» (was Пуаке) and «Брунетта д'Оссо» (was д'Уссо). 071.0229 now reads «для кобил і коней».
- 100.0166: no change needed. «це переривало роботу» already has the right sense.

## en: 7 paragraphs
- These are the same 7 pids as cz. 071.0229 now reads «for mares and horses».
- 100.0166: no change needed. «it interrupts work» is already correct.

## fr: 5 paragraphs
- 070.0122, 070.0125, 070.0610 and 070.0611: the visible Italian card text now matches `_original` (Dusk, Orpheline ×2, Jessy, Pourquet, d'Osseaux).
- 100.0166: «interrompt le travail» (was «interrompi e travail»).
- 071.0227–0229: skipped. The fr 071/1877-05-10 entry has no visible text yet (`edition_complete: false`; paragraphs carry only the embedded comments), so there was nothing to change.

## Class check
I grepped the visible text of all four trees for Orphelina, Pouaquet, Пуаке, Commense, Burdent, Usseaux, Уссо and «interrompi e». There are 0 hits left.

## Gates (after edits)
| tree | 070 | 071 | 100 |
|---|---|---|---|
| cz | splicescan empty, verify PASS | empty, PASS | empty, PASS |
| uk | empty, PASS | empty, PASS | empty, PASS |
| en | empty, PASS | empty, PASS | empty, PASS |
| fr | empty, PASS | empty, PASS | empty, PASS |

## Open
None new. The owner questions in A7.md (Osseaux vs Usseaux, emendation of 100.0166) apply to the trees as well: the trees follow the source as it now stands.
