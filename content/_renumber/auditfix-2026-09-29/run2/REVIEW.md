# Audit fixes needing a rebuild, run 2 (2026-09-29): 102, 104

Source: ~/rebuild-state/triage/e-075-080-101-106.md items A1, A2. Plans (`plan-102.json`, `plan-104.json`) = identity plan
at HEAD + `build_plans.py`; translation post-fix `post_apply.py` (both in this folder). Maps: `content/_renumber/{102,104}-2026-09-29.*`.

| carnet | fix | evidence |
|---|---|---|
| 102 | The stray body line «Vendredi 23 novembre 1883» at the end of 102.0055 (1883-11-22) removed (`set_french`); new entry `1883-11-23.md` = heading «Vendredi 23 novembre 1883» + «[Aucun texte - date seule mentionnée]» + RSR (print typo «novembe» normalised). New ID 102.0056; old 0056+ shift up by one. | tome16.docx ¶1091-1092; Mon Journal t.16 p.84 (checked on Tome16.pdf) |
| 104 | 28 and 29 April were merged in 1884-04-28.md. Now `1884-04-28.md` = new stub 104.0034 («Lundi 28 avril 1884» + «[Aucun texte…]» + RSR), and new `1884-04-29.md` holds the text (old 104.0034-0040 → 0035-0041) under «# Mardi 29 avril 1884» (the body date line «Mardi 29 avril 1 884» became the heading; the existing «Madi → Mardi» RSR note moved with it). All later IDs shift up by one. 1884-04-29.md takes the old entry's frontmatter; the 28 April stub keeps it too. | tome16.docx ¶2488-2490; Mon Journal t.16 p.185 (checked) |

Translations (post_apply.py): cz/uk/en visible heading of 104.0035 changed from 28 to 29 April (the old second date line promoted),
stub headings of 104/1884-04-28 and 102/1883-11-23 translated; stub bodies left `TODO` like the other tome-16 stubs.
uk 102.0055 lost its rendered «П'ятниця, 23 листопада 1883». The ED «SOURCE CHANGED» comments of this run were rewritten as
«resolved by the applier»; the earlier (06:53, tome 11-16 rebuild) SOURCE CHANGED notes on 102.0055 and elsewhere remain open.
en 104.0035 keeps its 2026-09-26 TR gap-fill note about the two date lines (history). Flags reset in 102 1883-11-22/23 and 104 1884-04-28/29.

Pre-existing, untouched: fr/102 embedded French differs in one paragraph (now 102.0087); `104.DROPPED-…` ref in _original/106/1884-09-11.md.
