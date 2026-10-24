# D-B (en, fr): owner decisions on the sharp-scan questions carried into the trees (2026-10-24)

Source commit 5d42bdbc66. The lead had already run `just sync C L` for 022/033/034/039/051 (with `--footnotes` except fr/051). Only en and fr were edited. No git, no OPEN-ITEMS.

## en

| pid | change |
|---|---|
| 022.0080 | Restored opening of Walitsky's verse (12 lines plus «Wal[itsky]») translated line for line, in the literal style of 022.0081–0105, as one run `==From a ruined State … Swollen with fat==[^022.0080.r2]` placed before `==Not dressed, not washed==[^022.0080.r1]`. «Merjeevsky» kept as printed. «la redoute» → «the Redoute» (TM: *Redoute*, keep French). The r2 def was already there from sync (one def per label). Tag line `[#Merjeewsky] [#Walitsky]` added as in `_original`. TR note added. |
| 039.0252, 0254, 0255, 0257, 0258 | Defs → «Written in Ukrainian (Little Russian) in the manuscript; French translation by the editor.» One TR note per paragraph. 039.0262 is still Russian, unchanged. |
| 034.0081 | fn `[^6]` *tcncô* → *tcncó*; TR note. The 2026-03-02 TR note and the 2026-10-03 CON note quoting «tcncô» were left as history. |
| 051.0435 | Visible «Cogery» ×2 → «Gogery»; TR note. |
| 033 | No visible change needed (Galula, uncle, Rumpelmayer were already correct). |

## fr

| pid | change |
|---|---|
| 022.0080 | Like its neighbours 022.0081–0105, the cluster has no visible text of its own and renders `_original`, which already contains the restored lines. No modern-edition text was written, so the convention stays the same as the neighbours'. Added the def `[^022.0080.r2]: En russe dans le manuscrit ; traduction française de l'éditeur.` and the tag line, plus an FRE note. Sync had appended the English r2 def at the end of the file, so that duplicate was removed. |
| 039.0252, 0254, 0255, 0257, 0258 | Defs → «En ukrainien (petit-russien) dans le manuscrit ; traduction française de l'éditeur.» One FRE note per paragraph. |
| 034.0081 | `[^034.0081.1]` «porte *tcncô*» → «*tcncó*»; FRE note. The 2026-02-14 FRE note and the LAN note were left as history. The visible text reads «teneo» and is unchanged. |
| 051 | Frontmatter entity `Cogery` → `Gogery`. FRE note in 0435, whose letter has no visible fr text and renders `_original`. |
| 033 | Checked: 0310 and 0340–0368 have no visible fr text of their own (they render `_original`), and the embedded French is current. No broken-«l» form remains outside the stale LAN note «beiie» (033.0340, history). Nothing to fix. |

No other English footnote defs from sync remain in fr 022/033/034/039/051 (grep).

## Skipped / flags
- None skipped.
- If the owner wants fr 022.0080–0105 to carry its own modern-edition text, that applies to the whole verse block, not to 0080 alone. Today the block renders `_original`.

## Gates
| tree | 022 | 033 | 034 | 039 | 051 |
|---|---|---|---|---|---|
| en splicescan | empty | empty | empty | empty | empty |
| en verify-carnet | PASS 0/0 | PASS 0/0 | PASS 0/0 | PASS 0/0 | PASS 0/0 |
| fr splicescan | empty | empty | empty | empty | empty |
| fr verify-carnet | PASS 0/0 | PASS 0/0 | PASS 0/0 | PASS 0/0 | PASS 0/0 |

`just check-comments en` and `just check-comments fr` are both OK.

## Counts
- en: 8 paragraphs changed (022: 1, 039: 5, 034: 1, 051: 1), 1 tag line, 8 TR notes.
- fr: 8 paragraphs or definitions changed (022: 1 def plus tag line, 039: 5, 034: 1, 051: frontmatter), 1 duplicate English def removed, 8 FRE notes. 033: 0 in both trees.
