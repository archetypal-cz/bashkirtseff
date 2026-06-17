# Footnote harvest — MED tier (proper-noun: leading-segment + token) — 050–064

_Dry-run against pristine (footnote-stripped) copies of the originals; no files modified. `harvest_footnotes.py --med` (or `--high-only`, which now applies HIGH+MED)._

## MED tier rule

Two attempts on the def's LEADING segment (text before the first ` — ` gloss separator; wrapping `*`/quotes and a trailing parenthetical like `(1843–1904)` stripped), both gated by the same guards:

1. the WHOLE cleaned segment, substring match (e.g. *Mme Rattazzi*, *Caccia-Club*, *Domine, dona mihi fidem*);

2. a DISTINCTIVE TOKEN from it with a LEADING title/honorific dropped (Duke/Duc/Baron/Prince/Comte/Mme/Saint/Cardinal/Queen/King/Lord/The…), longest token first, **word-boundary** match (e.g. *Montpensier* from "Duke of Montpensier").

A candidate anchors only on an EXACT, CASE-SENSITIVE, UNIQUE occurrence in the paragraph's French prose (comment/def lines excluded). 0 or >1 → stay LOW.

Guards (all retained): multi-gloss def (≥2 ` — `, ignoring parenthetical en-dashes) stays LOW; token length ≥ 4; lowercase single word skipped; English possessive `'s` skipped; >6-word phrase skipped; emphasis-span fix respected.

## Validation vs carnet 063 hand-placed ground truth (commit 907c38964)

- **13 MED placements, 13/13 agree with the human position, 0 misattributions.**

- Reboux/Caroline two-gloss def correctly stays LOW.

- Enforced by `--selftest` (multi-gloss guard fails loudly if removed; deterministic).

## 050–064 counts

| carnet | EN | HIGH | MED | LOW |
|--------|---:|-----:|----:|----:|
| 050 | 75 | 38 | 0 | 35 |
| 051 | 18 | 11 | 0 | 5 |
| 052 | 143 | 46 | 5 | 92 |
| 053 | 91 | 49 | 0 | 41 |
| 054 | 80 | 51 | 0 | 29 |
| 055 | 98 | 5 | 1 | 92 |
| 056 | 47 | 11 | 11 | 25 |
| 057 | 26 | 14 | 4 | 8 |
| 058 | 40 | 21 | 5 | 14 |
| 059 | 44 | 22 | 6 | 16 |
| 060 | 36 | 6 | 0 | 30 |
| 061 | 45 | 1 | 0 | 33 |
| 062 | 119 | 55 | 0 | 64 |
| 063 | 73 | 43 | 13 | 17 |
| 064 | 68 | 34 | 0 | 33 |
| **total** | **1003** | **407** | **45** | **534** |

**Auto-placed: 407 HIGH + 45 MED = 452/1003 = 45.1%** (HIGH-only 40.6%). 534 remain LOW for human/agent placement.

Note: this is the SAFE, fully-guarded count. An earlier unguarded prototype over-counted (~124) by including in-word/multi-gloss matches that are now correctly rejected.

## ALL 45 MED anchors (spot-check — carnets other than 063 have no ground truth)

| carnet | paragraph | key | anchored after | def-lead |
|--------|-----------|-----|----------------|----------|
| 052 | 052.0017 | [^4] | Suisse | "Un Suisse" |
| 052 | 052.0114 | [^4] | Olive ⚠ | *l'Olive* |
| 052 | 052.0226 | [^1] | Papa ⚠ | "Papa Léon" |
| 052 | 052.0234 | [^3] | Jesus ⚠ | The Baptism of Jesus (Theophany/Epiphany) |
| 052 | 052.0339 | [^4] | Belle-de-Jour | "Belle-de-Jour" |
| 055 | 055.1034 | [^2] | Fanny Lear | Fanny Lear |
| 056 | 056.0059 | [^3] | Pasteur | The Bon Pasteur (Good Shepherd) convent |
| 056 | 056.0066 | [^5] | Celui qui Est | *"Celui qui Est" |
| 056 | 056.0148 | [^2] | Rate ⚠ | *"Rate du Pape!"* |
| 056 | 056.0253 | [^3] | Brutto | *"Brutto!" |
| 056 | 056.0280 | [^4] | Domine, dona mihi fidem | *"Domine, dona mihi fidem"* |
| 056 | 056.0330 | [^3] | Reboux | Reboux: a fashionable Parisian milliner. |
| 056 | 056.0341 | [^6] | Euphrosine | Aglaé, Thalie, and Euphrosine |
| 056 | 056.0405 | [^1] | Basta ⚠ | *"Basta"* |
| 056 | 056.0501 | [^1] | Miserere | ==«Miserere»== |
| 056 | 056.0530 | [^4] | Emile ⚠ | *«Emile de Marie»* |
| 056 | 056.0564 | [^7] | Ohimè ⚠ | ==*«Ohimè»*== |
| 057 | 057.0077 | [^1] | Suisse | "Le Suisse" (the Swiss) |
| 057 | 057.0096 | [^6] | Naples | *«Voir Naples et mourir»* |
| 057 | 057.0100 | [^8] | Béatrice | ==Béatrice Cenci== (1577–1599) |
| 057 | 057.0126 | [^12] | résignation allemande | "résignation allemande" |
| 058 | 058.0069 | [^5] | Mercadante | Teatro Mercadante |
| 058 | 058.0142 | [^4] | Desclée | ==Aimée Desclée== (1836–1874) and ==Adelaide R… |
| 058 | 058.0189 | [^4] | Foster | "Comme disait Foster" |
| 058 | 058.0196 | [^7] | Canaris | "Canaris et perroquets!" |
| 058 | 058.0198 | [^9] | Carlo ⚠ | Teatro San Carlo |
| 059 | 059.0017 | [^2] | Club ⚠ | The Hunt Club |
| 059 | 059.0049 | [^7] | Tiziano | *Tiziano Vecellio* |
| 059 | 059.0050 | [^8] | Toledo | Via Toledo |
| 059 | 059.0072 | [^1] | Ristori | Adelaide Ristori (1822–1906) |
| 059 | 059.0193 | [^1] | Traviata | *La Traviata* |
| 059 | 059.0328 | [^1] | Surprenant | *Le Surprenant* |
| 063 | 063.0008 | [^2] | Paolo | Santi Giovanni e Paolo |
| 063 | 063.0009 | [^3] | Bon Pasteur | Bon Pasteur (Good Shepherd) |
| 063 | 063.0052 | [^3] | Bois | *Le Bois* |
| 063 | 063.0056 | [^7] | Montpensier | Duke of Montpensier |
| 063 | 063.0099 | [^4] | Jouvin | Jouvin |
| 063 | 063.0118 | [^5] | Mme Rattazzi | Mme Rattazzi |
| 063 | 063.0119 | [^7] | Bourbon | The "Princesse de Bourbon" |
| 063 | 063.0123 | [^12] | Wittgenstein | Prince Wittgenstein |
| 063 | 063.0124 | [^14] | Paul de Cassagnac | Paul de Cassagnac (1843–1904) |
| 063 | 063.0137 | [^1] | Caccia-Club | Caccia-Club |
| 063 | 063.0141 | [^2] | Laferrière | Laferrière |
| 063 | 063.0162 | [^13] | Psyché | Psyché |
| 063 | 063.0168 | [^16] | Méréville | Château de Méréville |

⚠ = short single-token anchor worth an extra human glance.

