# Glossary cleanup action plan (from OPEN-ITEMS [glossary] items, verified 2026-10-21 ~16:45)

Read-only plan. Ref counts = diary files linking the exact path (path-resolved, not `just glossary-find`, which conflates same-basename files and misses trees). `o=N` = _original diary files; trees (cz/uk/en/fr) equal o unless noted; `fm=N` = _original entries listing the ID in `entities:`. Index snapshot: scratchpad/idx.json (diary links), scratchpad/gidx.json (glossary-internal links).

Columns: ledger id | action | files | refs | verified state | confidence

---

## 0. Tool facts that shape the plan (read first)

- `just glossary-move ID cat` (src/scripts/glossary-move.ts): resolves links by full path, rewrites every link to the old path in _original, cz, uk, en, fr, es and in the glossary itself; regenerates the moved entry's own outgoing links; updates its `category:` (and `type:` if the top folder changes). Frontmatter `entities:` holds bare IDs, so it needs no change. Refuses if the destination exists. Dry run is read-only (~5 s). Example: LE_PAYS → culture/newspapers = 188 files / 217 links.
- `just glossary-merge SRC TGT` (glossary-merge.ts + shared/utils/glossary-merge.ts): rewrites links by BASENAME (`basename == SRC.md`, whatever the folder) in _original + all 5 trees + glossary, and turns `#Display` into `#TGT_ID` (upper-case display text). Then: default = `claude -p --permission-mode bypassPermissions` AI body merge (60 s timeout, falls back to append); `--simple [--clean]` = mechanical append; **deletes the source file** unless `--no-delete`.
  - BUG: it never updates `entities:` frontmatter. `updateFrontmatter` looks for lines starting with `people:`/`places:`/`culture:`, but the entries have them indented under `entities:` (and the key is `cultural:`, not `culture:`). Dry run M_D_ALT → BARON_D_ALT: 30 files / 30 links, **frontmatter updated 0** although fm[M_D_ALT]=6. So after merges, run `just entities-sync --apply` (with `--strict` on affected carnets: without it, an ID is kept when its alias still occurs in the text, so a source kept as a retired stub survives in frontmatter).
  - No tool writes the project's retire convention (`status: retired` + `replaced_by:` + "**Retired.**" body). 218 retired stubs exist. Use `--no-delete --simple --clean`, then hand-convert the source into a retired stub, or delete it on purpose (decide once, see Order step 0).
- Basename ambiguity (both tools look up the ID with a first-match tree walk in readdir order): 122 basenames exist twice. Only one is live twice (LE_PARDON_DE_PLOERMEL: culture/theater + people/mentioned), so the tools cannot handle it at all. The others are live + retired stub: TIBET, PRODGERS, VILLEVIEILLE, LOUVRE, MEUDON, CAPITOLE, ARC_DE_TRIOMPHE, COURSES, CARRICOLO, CROIZETTE, PATTON, BAGATELLE… → never pass these IDs to move/merge as source or target without first deleting the retired twin (all have 0 refs).
- Tree retargets: move and merge fix the trees themselves. A hand retag in _original does not. `just tag-sync` only ADDS missing tag lines; `just tag-reconcile LANG CARNET --scope all --write` makes a tree's tag set EQUAL to _original per paragraph (adds and removes), then `just sync-verify CARNET LANG`. Current drift: 89 tree-only links per tree (stale retargets from today's RSR waves: AMELIE 20, LISE 7, BIKOWSKY 7, KOTCHOUBEY 6, GIROFLE_GIROFLA 4, DIADIA 4, OLGA 3, EXPOSITION 3, HOTOWSKY 2, …) and ~655 _original-only links (new tags not yet carried).
- Neither the tagger (`glossary-scan`) nor entities-sync reads `status: retired`. Retired stubs keep their aliases (e.g. GORPINTCHENKO "Gorpintchenko", ONCLE_ALEXANDRE "Alexandre", MOUSSIA "Moussia"), so they still surface as candidates (B-64 (6)). Strip or move aliases when retiring.
- Glossary → retired cross-links: 36 links (25+ live entries point at retired stubs, e.g. TONY_ROBERT_FLEURY ×4, CARTWRIGHT ×4, NADINE_MARTINOFF ×3, BOYD_FAMILY ×3, DUMAS_FILS ×2, GAUTIER ×2, FIGARO ×2, PIETRO ×2…). Mechanical retarget to `replaced_by` (one small batch, F-21).
- Concurrency: move/merge read and rewrite hundreds of files in all trees within seconds. With the lan-/rsr-/fab-/fn-* agents editing content now, a run can silently overwrite a concurrent edit (or the reverse). Run every move/merge in one sequential runner, in a quiet window, committed one action at a time.

---

## A. MOVE (misfiled) — `just glossary-move ID dest` (dry run first). No destination collides except LE_PARDON_DE_PLOERMEL.

| ledger | action | files | refs | verified state | conf |
|---|---|---|---|---|---|
| B-24 | GULLIVERS_TRAVELS → culture/literature | people/mentioned/GULLIVERS_TRAVELS.md | o=3 | still misfiled (237 B stub) | high |
| B-24 | LA_VIE_PARISIENNE (the weekly) → culture/newspapers | people/mentioned/LA_VIE_PARISIENNE.md | o=3 | misfiled; operetta file LA_VIE_PARISIENNE_OFFENBACH exists (o=1, trees 0) | high |
| B-32(5) | THEOPHILE_GAUTIER → people/writers | places/theaters/THEOPHILE_GAUTIER.md | o=5 | misfiled | high |
| B-32(5) | ZAMIATINE → people/mentioned (litigants, not service) | people/service/ZAMIATINE.md | o=3 | misfiled | high |
| B-34(2) | APOLLO (Teatro Apollo) → places/theaters; drop/retarget its 020.0386 tag (the god) first | people/mentioned/APOLLO.md | o=4 | body already rewritten; 020.0386 still tags APOLLO | high |
| B-34(2), B-36(1) | TOLEDO (via Toledo) → places/streets | people/mentioned/TOLEDO.md | o=15 | misfiled | high |
| B-36(1), B-64(2) | CASTELLAMARE → places/cities | people/mentioned/CASTELLAMARE.md | o=4 | misfiled | high |
| B-36(1) | CHIAJA → places/streets | people/mentioned/CHIAJA.md | o=14 | misfiled | high |
| B-36(1) | MASSA (Massa Lubrense) → places/cities | people/mentioned/MASSA.md | o=13 | misfiled | high |
| B-36(1) | CHAMP_DE_MARS (Naples racecourse) → places/venues; check its 2 tags are Naples, not Paris | people/mentioned/CHAMP_DE_MARS.md | o=2 | misfiled | med |
| B-36(2), B-50(3), B-57(3) | LEWIN (John Lewin) → people/mentioned | culture/theater/LEWIN.md | o=46 | misfiled | high |
| B-37(3) | GETTATURA → culture/social_customs | people/mentioned/GETTATURA.md | o=3 | misfiled | high |
| B-40(6) | CASERTE → places/cities | people/mentioned/CASERTE.md | o=3 | misfiled | high |
| B-40(6) | CANCELLO → places/cities | people/mentioned/CANCELLO.md (type already Place) | o=10 | misfiled | high |
| B-40(6) | CASCINE → places/parks | people/mentioned/CASCINE.md | o=13 | misfiled | high |
| B-40(6) | PERGOLA (Teatro della Pergola) → places/theaters | people/mentioned/PERGOLA.md | o=5 | misfiled | high |
| B-40(6) | ARNO → places/regions (no rivers folder) | people/mentioned/ARNO.md | o=3 | misfiled | high |
| B-41(1) | KLEIN (Auguste Klein, leather goods) → places/shops | culture/theater/KLEIN.md | o=2 | misfiled | high |
| B-41(1), B-42(1), B-43(5), B-62(3) | LE_PAYS → culture/newspapers | people/mentioned/LE_PAYS.md | o=37 | misfiled (dry run: 188 files/217 links) | high |
| B-42(1) | MURCIE (press fête, 18 Dec 1879) → culture/social_customs | people/mentioned/MURCIE.md | o=5 | misfiled | med |
| B-42(1) | QUARTIER_LATIN → places/neighborhoods | people/mentioned/QUARTIER_LATIN.md | o=3 | misfiled | high |
| B-42(1) | APPEL_AU_PEUPLE → culture/history | people/mentioned/APPEL_AU_PEUPLE.md | o=1 | misfiled | high |
| B-42(1) | PALAIS_BOURBON → places/buildings | people/mentioned/PALAIS_BOURBON.md | o=1 | misfiled | high |
| B-42(1) | NIHILISTE → culture/history | people/mentioned/NIHILISTE.md | o=2 | misfiled | high |
| B-42(1) | RUE_SAINT_FRANCOIS → places/streets | people/religious/RUE_SAINT_FRANCOIS.md | o=1 | misfiled | high |
| B-42(1) | SAINT_CLAIR (marksman), SAINT_SAUVEUR (Nice nobleman) → people/aristocracy (persons, not saints) | people/religious/ | o=4 / o=1 | misfiled | high |
| B-45(1) | ZILLHARDT → people/artists (with D-B45 body fix) | culture/art/ZILLHARDT.md | o=9 | misfiled + body still «Amélie» | high |
| B-49(2) | CAMPAGNE_DE_ROME → places/regions | people/mentioned/ | o=2 | misfiled | high |
| B-49(2) | LA_VIE_MONDAINE (Nice paper) → culture/newspapers | places/cities/LA_VIE_MONDAINE.md | o=6 | misfiled | high |
| B-49(2) | MLLE_JACQUEMARD (Nélie Jacquemart) → people/artists | people/aristocracy/ | o=1 | misfiled; body already right (rename to JACQUEMART optional) | high |
| B-50(3), B-55(3), B-57(2) | WITTGENSTEIN (a person) → people/aristocracy (with D body fix) | culture/music/WITTGENSTEIN.md | o=107 | misfiled | high |
| B-50(3) | HOUSE_OF_WORTH → culture/fashion | culture/literature/ | o=71 | misfiled | high |
| B-50(3) | REBOUX (milliner) → culture/fashion (beside LAFERRIERE) | places/theaters/REBOUX.md | o=16 | misfiled | high |
| B-50(3) | SABATIER (a Nice family) → people/mentioned | places/theaters/SABATIER.md | o=4 | misfiled | high |
| B-57(3) | OBELISQUE (a beautiful woman, 1874) → people/mentioned; identity stays open (A-40) | places/hotels/OBELISQUE.md | o=12 | misfiled | high (move) |
| B-57(3), B-64(2) | POUHON (Spa spring) → places/landmarks | people/mentioned/ | o=2 | misfiled | high |
| B-54(3), B-58(5) | TIR_AUX_PIGEONS (Nice) → places/venues | people/mentioned/ | o=31 (trees 29; es 4) | misfiled | high |
| B-58(5) | MONACO_PIGEON_SHOOT → places/venues, after the merge in B-list | places/hotels/ | o=7 | see B | high |
| B-58(5) | SPITZER (Vienna couture house) → places/shops | people/mentioned/ | o=3 | misfiled | high |
| B-59(3) | LA_FRANCE (newspaper) → culture/newspapers | people/mentioned/ | o=1 | misfiled | high |
| B-59(3) | PALAIS_DE_L_INDUSTRIE → places/buildings | people/mentioned/ | o=6 | misfiled | high |
| B-60(2) | EMILE_DE_GIRARDIN → people/writers (with 1806→1802 fix) | culture/literature/ | o=15 | misfiled, still «1806» | high |
| B-60(3), B-62(3) | JUVISY (a family) → people/aristocracy | places/cities/JUVISY.md | o=17 | misfiled | high |
| B-61(5) | FRANCINE (Vienna couturière) → places/shops (with body fix) | places/social/ | o=6 | body still «likely in Paris» | high |
| B-61(5) | SACCO (florists/landlords) → people/mentioned | places/theaters/ | o=7 | misfiled | high |
| B-61(5) | LA_SAXE (a demi-mondaine) → people/mentioned | places/theaters/ | o=4 | misfiled | high |
| B-62(3) | GRAND_16 → places/social | people/mentioned/ | o=2 | body already rewritten | high |
| B-62(3), F-01 | EXPOSITION_UNIVERSELLE (1878) → culture/history; write a real body (it is an empty auto-stub, type Person) | people/mentioned/ | o=24 | misfiled stub | high |
| B-62(3) | CHAMBRES → culture/institutions | people/mentioned/ | o=1 | misfiled | high |
| B-62(3) | CODE_PENAL → culture/institutions | people/mentioned/ | o=1 | misfiled | high |
| B-62(3) | GAZETTE_DES_TRIBUNAUX → culture/newspapers | people/mentioned/ | o=2 | misfiled | high |
| B-62(3) | VAUCLUSE → places/regions | people/mentioned/ | o=2 | misfiled | high |
| B-62(3) | ANNUAIRE_HISTORIQUE_DE_LESUR → culture/literature | people/mentioned/ | o=1 | misfiled | high |
| B-62(3) | CONSEIL_DE_GUERRE_DE_LA_SEINE → culture/institutions | people/mentioned/ | o=1 | misfiled | high |
| B-63(2) | LIHOPOY (a person) → people/mentioned | places/hotels/ | o=11 | misfiled | high |
| B-63(2), D-42 | NOVOIC_VREMIA → culture/newspapers | people/mentioned/ | o=2 | misfiled | high |
| B-63(2) | PARC_MONCEAU → places/parks | people/mentioned/ | o=3 | misfiled | high |
| B-63(2) | L_EVENEMENT → culture/newspapers | people/mentioned/ | o=5 | misfiled | high |
| B-63(2) | LE_TEMPS → culture/newspapers | people/mentioned/ | o=2 | misfiled | high |
| B-63(2) | JOUY_EN_JOSAS → places/cities, after merging JOUY into it (B list) | people/mentioned/ | o=9 | misfiled | high |
| B-64(2) | ORANGE (Hôtel d'Orange, Spa) → places/hotels | people/mentioned/ | o=1 | misfiled | high |
| B-64(2) | MABILLE (Bal Mabille) → places/venues | people/mentioned/ | o=2 | misfiled | high |
| B-64(2) | HYDE_PARK → places/parks, then tag it where named | people/mentioned/ | o=0 | unused stub | high |
| B-64(2) | SAINT_PIERRE (St Peter's) → places/churches; check the 2 tags | people/mentioned/ | o=2 | misfiled | med |
| B-64(2) | PANTHEON → places/landmarks | people/mentioned/ | o=1 | misfiled | high |
| B-64(2) | SCALA_SANTA → places/churches | people/mentioned/ | o=1 | misfiled | high |
| B-64(2) | LYON (the city) → places/cities; body is a stub | culture/literature/LYON.md | o=0 | unused | high |
| B-64(3) | WEB (the groom «Web», 017.0465) → people/service, then tag | culture/literature/WEB.md | o=0 | unused | med |
| D-41 | Author stubs → people/writers: DANTE, PLUTARQUE, TITE_LIVE, EPICTETE, LA_ROCHEFOUCAULD, IDEVILLE | people/mentioned/ | o=30/12/11/3/5/2 | misfiled | high |
| D-41 | PERGOLESE → people/artists | people/mentioned/ | o=4 | misfiled | high |
| D-42 | BOUGUEREAU → people/artists | culture/history/ | o=8 | misfiled (BOULANGER already retired → GUSTAVE_BOULANGER) | high |
| D-42 | MASSENET → people/artists | people/mentioned/ (5.7 KB, researched) | o=7 | category question only | med |
| B-42(1), B-63(2) | NOUVELLE_REVUE → culture/newspapers, after merging REVUE_NOUVELLE into it | people/mentioned/ | o=3 | misfiled | high |
| B-52(4), B-48(2) | SAINT_AUGUSTIN: the church of 073/082 → new places/churches/EGLISE_SAINT_AUGUSTIN (E) + retag (F); keep the saint file for 054.0279 | people/religious/ | o=2 (fm 4) | open | med |
| D-16 | Residual sweep of places/concepts still under people/ (no type field helps: stubs are all `type: Person`). Needs a reviewed list; the named ones above are most of it | people/mentioned/* | — | partial (CAPITOLE, ARC_DE_TRIOMPHE, PINCIO, MARCHE, CHANTILLY, MEUDON, LOUVRE already done) | med |

## B. MERGE / REDIRECT — survivor ← merged. Use `--no-delete --simple --clean`, then turn the source into a retired stub (or delete it, per Order step 0), then entities-sync.

| ledger | action | files | refs | verified state | conf |
|---|---|---|---|---|---|
| B-27 | GODARD ← MAURICE_GODARD_DECRAIS (retire only) | people/mentioned/ | 0 / fm 0 | already gone from 039 frontmatter | high |
| B-27 | DECRAIS ← NICE_PREFET, only if the 047 prefect is Decrais in that year (date check) | people/mentioned/ | 4 / 3 | both empty stubs | UNSURE |
| B-23 | REMY_DE_GONZALES (51, the son) ← REMY_DE_GONZALES_MORENO (1, but 5.7 KB body: take the body), REMY_MORENO_DE_GONZALES (1), REMY_MORENO (0) | people/mentioned/ | 51/1/1/0 | open | high |
| B-23 | GONZALES (father, 19) / GONZALES_FAMILY (family, 3): split MORENO (13: 019–080) and MORENO_DE_GONZALES (4: 024) per paragraph into father/son/family (F), then retire both | people/ | 13 + 4 | open; «le père Moreno» 024.0050, «les Gonzalès, ou Moreno» 063.0113 | med (per-para) |
| B-32(5), B-64(3) | MME_VOLKOVITSKY ← places/cities/VOLKOVITSKY (0 refs, 2 KB body: merge the body) | | 4 / 0 | M_VOLKOVITSKY (husband) now exists (o=2) | high |
| B-33(1) | ANDRIEUX split: Kharkov hotel-keeper (066, 067: 2 files) → new people/mentioned/ANDRIEUX_KHARKOV (E) + retag; ANDRIEUX stays = prefect Louis Andrieux (084–105); M_ANDRIEUX (o=2, 078) → check, merge into ANDRIEUX | people/mentioned/ | 11 / 2 | body already describes both | med |
| B-33(4) | KAPITANENKO ← KAPITAN (calibration rule «Kapitan» → KAPITANENKO) | people/mentioned/ | 9 ← 10 (066, 067, 083, 096) | open | med (check 083/096 are the same man) |
| B-36(3) | SCHININA ← SANT_ELIA (Eugenio Schininà dei Marchesi di Sant'Elia) | people/mentioned/ | 10 ← 1 | open, both auto-stubs | high |
| B-38(3), B-60(1), D-42 | MICHEL vs MICHKA_ERISTOFF (same prince): first move the non-Eristoff MICHEL tags (004, 005, 033, 082?) off MICHEL (F), then merge. Survivor: TAGGER_BRIEF says MICHEL (61 refs, empty body); MICHKA_ERISTOFF (17) has the 8 KB body → keep MICHEL id, take the body | people/mentioned/ | 61 / 17 | open; D-42 lists it "uncertain" | med |
| B-38(3) | NICOLAS ← ONCLE_NICOLAS (identity now in NICOLAS); check NICOLAS's 009 and 054 tags are the uncle | people/mentioned/ | 10 ← 2 | open | med |
| B-39(3) | Uncle Wladimir Babanine: WOLDEMAR (5, identity added) ← ONCLE_WLADIMIR (5), UNCLE_WLADIMIR (1); first retag WOLDEMAR 064/1876-08-04 (St Vladimir) | people/mentioned/ | 5 + 5 + 1 | open; ONCLE_WLADIMIR body says "Bashkirtseff family" | med |
| B-40(2), B-48(1), B-60(1) | OELSNITZ (8, researched) ← MLLE_OELSNITZ (17), MARIE_LEONTIEVNA (5, 071–072), MADEMOISELLE_OELSNITZ (0, fm 1); then tag 082.0466 «Marie Léontinovna» | people/ | 8 ← 22 | open | high |
| B-41(2) | MERJEEWSKY ← MERGEJEWSKY (2, fm 3) | people/mentioned/ | 109 ← 2 | open (083.0324 already retargeted) | high |
| B-41(2) | PRINCESSE_TROUBETZKOY ← MME_TROUBETZKOY (Princess Lise, 0.7) | people/ | 4 ← 1 | open | med |
| B-42(1) | MAGDELEINE_DELSARTE ← places/cities/MADELEINE_DELSARTE (0 refs, fm 1); DELSARTE (0) retire; MARIE_DELSARTE (7) stays (the sister) | | 12 ← 0 | open | high |
| B-42(1) | NOUVELLE_REVUE ← REVUE_NOUVELLE (then move, A) | people/mentioned/ | 3 ← 1 | open | high |
| B-42(2), B-55(1), B-57(4), B-58(7) | ONCLE_LAUTREC ← ALEXANDRE_LAUTREC (1); places/cities/LAUTREC («Sacha Lautrec», 1) also → ONCLE_LAUTREC if Sacha = the comte (0.7) | people/mentioned/ | 26 ← 1 + 1 | open | high / med |
| B-45(2) | MME_DE_BRIMOND ← BRIMONT (8, fm 9), BRIMOND (0, has a body) | people/mentioned/ | 29 ← 8 | open | high |
| B-45(2) | AMELIE_BEAURY_SAUREL ← AMELIE: retag per paragraph first (AMELIE o=12: 075, 092–097 — the 065 Russia «Amélie» is someone else, B-64(4)), then retire | people/mentioned/ | 85 ← 12 | 090 done; cz/uk/en still carry 20 stale AMELIE links (tag-reconcile) | med |
| B-45(2) | ARNAUD_DE_L_ARIEGE ← ARNAUD (o=2: 024, 093; fm 23!): check 024 (1874, not Arnaud) then retire | people/recurring/ | 99 ← 2 | 090 done; fm stale | med |
| B-45(3) | d'Abzac: COMTE_D_ABZAC (5) / MARQUIS_D_ABZAC (2) / vicomte Paul (090) — identify first | people/ | 5 / 2 | open | UNSURE |
| B-46(1), B-61(8) | JANVIER_DE_LA_MOTTE ← M_JANVIER_DE_LA_MOTTE (1); split into father/son is optional (overview already covers both) | people/mentioned/ | 19 ← 1 | body written | high |
| B-46(4), B-09 | ALEXANDRE_DUMAS_FILS: DUMAS_FILS and DUMAS already retired → only retarget the glossary cross-links (LE_ROMAN_D_UNE_FEMME_DUMAS_FILS, ALEXANDRE_DUMAS_FILS, PARODIE_MIGNON_ACROSTICHE) + entities-sync (fm[DUMAS]=5) | | 0 | mostly done | high |
| B-46(4) | HAUSSMANN set: BARON_HAUSSMANN (2), G_E_HAUSSMANN (1), M_HAUSSMANN (1), HAUSSMANN (6). Check each: the prefect vs «boulevard Haussmann» (street ≠ person, TAGGER_BRIEF) | people/ | 6+2+1+1 | open | med |
| B-46(4) | DUGUE (6) ← DUGUE_DE_LA_FAUCONNERIE (0, fm 1) | people/mentioned/ | 6 ← 0 | open | high |
| B-46(4) | BOISHEBERT (1) vs MME_DE_BOISHEBERT (5): «Mme X ≠ M. X» → keep both unless the 1 BOISHEBERT tag is Madame | people/mentioned/ | 1 / 5 | open | med |
| B-47(3), B-59(3) | BALZORANO (10) ← COMTE_DE_BALZORANO (1), COMTE_BALZORANO (0); FRANCESCO_DE_BALZORANO (1, 075) only if the same count | people/ | 10 ← 1 + 0 (+1) | open | high / med |
| B-48(1) | DOURASSOFF (13) ← M_DOURASSOFF (8) | people/mentioned/ | 13 ← 8 | open | high |
| B-48(1) | BARON_SCHENCK (2) ← BARON_SCHENK (1) | people/aristocracy/ | 2 ← 1 | open | high |
| B-48(1) | GANS (13, 081–082) ← HANS (4, 081): Prince Hans zu Hohenlohe-Öhringen. Check that plural «les Gans» is not another family before merging | people/mentioned/ | 13 ← 4 | open | UNSURE |
| B-48(1) | DOENHOFF (64) ← COMTE_DOENHOFF (0), GERHARDT_VON_DOENHOFF (1) | people/ | 64 ← 1 | open | high |
| B-48(1) | HALL (26) ← MISS_HALL (0, fm 4) | people/mentioned/ | 26 ← 0 | open | high |
| B-48(1) | DUKE_OF_HAMILTON ← people/mentioned/HAMILTON (1): check that the 1 tag is the duke (or Carlo Hamilton, or «un homme Hamilton» = no tag) | | 531 ← 1 | open | med |
| B-50(2) | LADY_MARY_MONTAGU ← DUCHESS_OF_HAMILTON (12: 011, 016, 018, 020, 028, 030). Tags BEFORE the 10 Dec 1873 wedding (011) may be the dowager duchess, Princess Marie of Baden → per-paragraph check first | people/ | 38 ← 12 | only 030.0213 retargeted | UNSURE |
| B-52(1) | HAMSLEY (7) ← MME_HAMSLEY (0, 213 B) | people/mentioned/ | 7 ← 0 | open | high |
| B-53(4) | RIGHI (27, calibration) ← SILENE (3, 4.4 KB body: take the body) | people/mentioned/ | 27 ← 3 | 073.0171 done | high |
| B-55(2) | THREE_GRACES ← people/mentioned/GRACES (1) | | 8 ← 1 | open | high |
| B-55(2) | BASILEVITCH (53, now identified as Mme Basilévitch of Spa 1874) ← people/aristocracy/MME_BASILEVITCH (3: 072, 077, 085) — check the 1877–79 woman is the same | | 53 ← 3 | open | med |
| B-55(3) | TERFFIDUA (Audiffret nickname, 0 refs, culture/music) → retire replaced_by EMILE_D_AUDIFFRET (move the alias) | | 0 | open | high |
| B-56(2) | GATOWSKY ← HOTOWSKY (o=0, but cz/uk/en/fr still 2 each) | people/mentioned/ | 7 ← 0 (+8 tree links) | _original done, trees stale | high |
| B-56(2) | GISELLE (10) ← GISELLE_VAN_BAEKER (2, 075); both auto-stubs | people/mentioned/ | 10 ← 2 | open | med |
| B-56(2) | MERJEEWSKY ← COUNT_MERJEEWSKY (0) | | 0 | open | high |
| B-56(2) | Naples Società Filarmonica: one institution entry (rename/move CERCLE_PHILHARMONIQUE → culture/institutions/SOCIETA_FILARMONICA_NAPOLI or similar) ← SOCIETA_FILARMONICA (1), FILARMONICA (0); check vs places/…/CONCERT_FILARMONICA_NAPLES_1877 | people/mentioned/ | 5 + 1 + 0 | open | med |
| B-57(3), A-40 | Mouchy cluster: DUCHESS_DE_MOUCHY (13, 1874), DUCHESSE_DE_MOUCHY (0, researched: Anna Murat), MME_DE_MOUCHY (11, «mother of a beautiful girl»), DUC_DE_MOUCHY (2); fix 017.0176 (MME_DE_MOUCHY for «le duc») | people/ | 13 / 0 / 11 / 2 | open, A-40 owner item | UNSURE |
| B-58(5) | MONACO_PIGEON_SHOOT (7, 015) ← PIGEON_SHOOT_MONACO (3, 016); then move (A) | places/hotels/ | 7 ← 3 | open | high |
| B-59(3) | BARON_D_ALT (18) ← M_D_ALT (6) (dry run 30 files) | people/ | 18 ← 6 | open | high |
| B-60(1), D-42, D-58 | PEYRONNEY (10) ← MME_DE_PEYRONNEY (5), PERONNEY (0, fm 1); then body (D) | people/mentioned/ | 10 ← 5 | open | high |
| B-60(2) | EMILE_DE_GIRARDIN vs people/mentioned/GIRARDIN (2: 092/1881-05-15, 101/1883-08-20): check which Girardin, then merge or leave | | 15 / 2 | open | med |
| B-61(5) | OLGA ← culture/theater/OLGA_SAPOGENIKOFF (0, has a body): retire with replaced_by OLGA, take the body (OLGA itself is a 588 B stub, B-20) | | 168 ← 0 | open | high |
| B-61(5), B-09 | GRITZ_MILORADOVITCH: MILORADOVITCH and GRITSIA already retired → it. Fix the stale calibration line only (TAGGER_BRIEF says MILORADOVITCH; not a repo file) | | 87 | done in repo | high |
| B-61(5) | ONCLE_ETIENNE vs TANTE_ETIENNE: already retired → TANTE_ETIENNE | | 0 | done | high |
| B-62(4) | culture/literature/BRAGELONNE ← people/aristocracy/LE_VICOMTE_DE_BRAGELONE (o=0; trees 1 each; fm 1) | | 9 ← 0 (+4 tree links) | _original done, trees stale | high |
| B-62(4) | people/mentioned/ROBERT (o=0; trees 1 each) → retire; trees → JOHNSTONE via tag-reconcile 091 | | 0 (+4 tree links) | _original done | high |
| B-63(2), D-58 | SAINT_AMAND ← SAINT_AGATHE (4; the baron's nickname, t.15 index); add alias «Saint Agathe» / «Agathe» | people/ | 159 ← 4 | open; SAINT_AMAND has no Agathe alias yet | high |
| B-63(2) | POPE vs PERE_VASSILIEFF — NOT a merge: POPE (50) is Pius IX in 050–067 (calibration). Retag only the 1882–84 «pope» tags (099–105, ~16 files) to PERE_VASSILIEFF after reading each | people/mentioned/ | 50 / 3 | open | UNSURE (high risk) |
| B-63(2) | MME_DE_POURTALES (4) ← MADAME_DE_POURTALES (0), POURTALES (1; check Mme vs M.) | people/mentioned/ | 4 ← 1 | open | med |
| B-63(2) | JOUY_EN_JOSAS (9) ← JOUY (4), then move (A) | people/mentioned/ | 9 ← 4 | open | high |
| B-63(2) | THEATRE_DES_ITALIENS (12) ← ITALIENS (5: 072, 074, 078) — calibration: «les Italiens» in Nice = OPERA_NICE. Read each (all 5 are 1877–78, likely Paris) before merging | | 12 ← 5 | open | med |
| B-64(6) | Retargeted stubs (MME_SAPOGENIKOFF→NINA, HELENE→MME_GORPINTCHENKO, FREDERIC→VICTOR, CHARLES→CHARLES_COCHER, QUAI_SAINT_JEAN_BAPTISTE→QUAI_SAINT_JEAN, ANDRIOT→SAETONE, AMERIQUE→AMERICA): finish each (remaining refs: MME_SAPOGENIKOFF 3, HELENE 3, FREDERIC 1, CHARLES 5, QUAI_SAINT_JEAN_BAPTISTE 1, ANDRIOT 3, AMERIQUE 0/fm 2), retire, move aliases to the survivor | people/ | see refs | partial | med (CHARLES = the 1874 «mon Charles» per calibration; do not blanket-merge) |
| B-09 | GORPINTCHENKO, TIBET (places/countries retired), SOROKA, HECTOR, PIETRO, GRITSIA, FIOULOULOU, GIRO, SAPOGENIKOFF_MARIE/NINA/OLGA, SOLOMINKA_MARKEVITCH, MADAME_/MME_YORKE, COMTESSE_/MADAME_DE_FAYET, FAYET, EMPEREUR (→ALEXANDER_II), VILLEVIEILLE/PRODGERS/PATTON twins: all already retired, 0 refs | | 0 | DONE; only entities-sync (fm[EMPEREUR]=3, fm[DUMAS]=5) and stripping their aliases remain | high |
| B-09 | Still live, 0 refs: STIOPA (→ TANTE_ETIENNE), M_SAPOGENIKOFF (→ SAPOGENIKOFF; GIRO links to it), DE_FAYET (→ MME_DE_FAYET) → retire | people/ | 0 | open | high |
| B-09 | COCO split: COCO (1873 horse, 1) / COCO_DOG (26); missing NICOLAS_SAPOGENIKOFF «Coco» (E) | | | COCO_DOG done | high |
| D-58 | ALEXANDRE ← ONCLE_ALEXANDRE (1; its alias "Alexandre" is a tagger hazard) | people/ | 117 ← 1 | open | high |
| D-42 | FITZ_JAMES (5) ↔ DUCHESSE_DE_FITZ_JAMES (29) | people/mentioned/ | 5 / 29 | open, listed "uncertain" | UNSURE |
| B-16 | MOUSSIA (0 refs): rename to e.g. MOUSSIA_ETIENNES_BELOVED (or retire) and drop the bare alias «Moussia» (Marie's own nickname) | people/mentioned/ | 0 | alias still present | high |
| B-40(6) | PALAIS_D_HOOGHWORST → really «baronne d'Hoogheworst»: new BARONNE_D_HOOGHEWORST, merge the stub into it | people/mentioned/ | 2 | open | high |
| LE_PARDON_DE_PLOERMEL | (B-50(5)) live basename twin: culture/theater (o=1, 852 B, the opera) + people/mentioned (o=1 +trees, 254 B). By hand: repoint the people/ link (all trees) to culture/theater/, delete the people/ file. Tools cannot do it | | 1 + 1 | open | high |

## C. RETIRE (0 refs or wrong), not covered by a merge above

| ledger | action | files | refs | verified state | conf |
|---|---|---|---|---|---|
| B-24 | VIE_PARISIENNE retire (→ LA_VIE_PARISIENNE) | people/mentioned/ | 0 | open | high |
| B-34(2) | TOLEDO_NAPLES retire (→ TOLEDO) | people/mentioned/ | 0 | open | high |
| B-49(5) | GALLIFFET: empty stub, no referent (2 refs, fm 3) — check the 2 tags, then retire or identify | people/politicians/ | 2 | open | med |
| B-08 | FANNY_LEAR stub / PARIS & NICE thin | | | DONE (FANNY_LEAR Researched 9.3 KB; PARIS/NICE Comprehensive) | high |
| B-08 | PINTCHIK, BAGATELLE_DOG, PRATER exist | | 33 / 15 / 46 | DONE (only body work left, see D) | high |
| D-16 | TESTAMENT, COURSES (people/), MARRIAGE_PHILOSOPHY, CARRICOLO (people/), DISEASES, FEMINISM, COMTESSE_DE_LARDEREI | | 0 | DONE (all retired). culture/transport/CARRICOLO (0 refs, live) and culture/social_customs/COURSES (3) are the surviving concept files: keep | high |
| B-62(4) | LE_VICOMTE_DE_BRAGELONE, ROBERT, B-56 HOTOWSKY: retire only AFTER `tag-reconcile --scope all` on cz/uk/en/fr 080, 091, 069 (else the tree links break) | | 0 (+tree links) | trees stale | high |
| F-21 | Strip aliases from all 218 retired stubs (or move them to the survivor) so tagger/entities-sync stop proposing them | glossary-wide | — | not done | med |

## D. BODY FIX (glossary text wrong vs source)

| ledger | action | files | refs | verified state | conf |
|---|---|---|---|---|---|
| B-10 | DOMENICA birth year («vers 1831» vs preface «veuve de 36 ans») — G (needs scan) | people/mentioned/DOMENICA.md | 34 | recorded unresolved | G |
| B-15 | BRUNET: «servant» → Latin/French teacher per 030/1875-02-25, 03-11; re-read ~32 files (009–087); update Coverage (says up to 1874-03-12) | people/mentioned/BRUNET.md | 32 | still «Household servant, not a teacher» | high |
| B-17 | SAETONE: «ironically calls him mon oncle» → Audiffret's real uncle (034/1875-06-15); check LAN 034/1875-06-10 | people/recurring/SAETONE.md | 162 | still wrong | high |
| B-20 | Thin auto-stubs to write: DANIS (43), LAURENTI (32), BIHOVETZ (110), ASPREMONT (15), ANDRIOT (3; or retire per B-64(6)), LEONIE (34), OLGA (168), HOTEL_SPLENDIDE (7), DORIA (80); stale coverage LECLERC (14; body still «subject not specified», B-51(6)), PRODGERS (80) | people/mentioned/… | as listed | all still stubs (sizes 181–1.3 KB) | high |
| B-23 | DURAND: Identity (Spanish Durand family) added, but «Questionable social standing» / «Women of questionable reputation» lines remain → rewrite | people/mentioned/DURAND.md | 45 | partial | high |
| B-26 | VILLA_GIOIA: drop «may have been one of the Bashkirtseff family's residences»; it is Gioia's house (001/1873-01-19, 012/1873-11-04, 035.0001) | places/residences/VILLA_GIOIA.md | 4 | still wrong | high |
| B-27 | DECRAIS / NICE_PREFET: write up (prefect Albert Decrais) | people/mentioned/ | 4 / 3 | empty | med |
| B-29 | PATTON_FAMILY: drop «American»; Oscar Patton, Russian consul; Mme née Savelieff (050.0674, t.6 index) | people/mentioned/PATTON_FAMILY.md | 21 | still «An American family» | high |
| B-31(1) | CAROLINE | | 42 | DONE in glossary (the two old RSR notes in 008/1873-08-21, 028/1875-01-14 are diary-side, not glossary) | high |
| B-31(4) | MOUZAY stale 064.0034 | | | DONE (re-pointed 2026-10-21) | high |
| B-32(1) | SOPHIE (16) + MME_TUTCHEFF (45): «Grigorievna» → «Pavlovna» (067.0187, t.9 index) | people/mentioned/ | 16 / 45 | still Grigorievna in both | high |
| B-32(2) | PRINCESSE_ERISTOFF note 9200 «son» → stepson | | 55 | partial: correction line added, old note left; tidy | high |
| B-32(3) | TCHERNIAKOVKA: «Former Bashkirtseff family estate» → the Babanine house | places/residences/ | 15 | first line still wrong (Grand_papa line already right) | high |
| B-32(4) | TRIFON: «Bashkirtseff father's cashbox» → grand-papa's; Trifon was grand-papa's valet (012/1873-11-01, 035/1875-07-08) | people/mentioned/TRIFON.md | 26 | still wrong | high |
| B-33(2) | MME_ABAZA: Poltava Mme Abaza née Dietrich (067) vs singing Mme Abaza of Soden/Riviera (081–084: 24 of 26 tags) — identify / split | people/aristocracy/ | 26 | open | UNSURE |
| B-33(3) | ETIENNE: re-check its 9 tags (000, 015, 017, 042, 053, 092, 094, 096): only his death/mentions as Dina's brother; «le petit Etienne» (Alexandre's son) has no file → E | people/mentioned/ETIENNE.md | 9 | 067 done | med |
| B-33(7) | TREGOUBOFF: reconcile 1876 «fille du premier mariage de Domenica» vs 1881 «sœur de la petite tante» | people/mentioned/ | 3 | recorded, not reconciled | G-ish |
| B-34(1) | VISCONTI: body = Nice ticket office (002/1873-02-19, 2 files) but ~40 tags 1875–77 are old Baron Visconti of Rome → rewrite as the baron, move the 002 sense out (new stub or no tag) | people/mentioned/VISCONTI.md | 47 (002–073) | open | high |
| B-35(3) | OLGA_ANITCHKOFF: 1874 «sorties comme Olga Anitchkoff» vs the 6-year-old of 1876 | | 8 | RSR note added; G | G |
| B-35(5) | PRATER: correction note added, Coverage still «Up to 1874-02-04» + «No longer with Marie by 1874» → rewrite body | people/mentioned/PRATER.md | 46 | partial | high |
| B-37(7) | Auto-stubs with t.10 index data in 070 RSR notes: SCHETTINO, GROTTAMINARDA, SANTA_SEVERINA, YOURKOFF, ALEXANDRINE (also B-53(3)), HUMBERT | people/mentioned/ | 7/4/1/87/20/19 | stubs | high |
| B-39(4) | OGAREFF (3: 024 Ogarev the poet / 066 General Ogareff) and MARTINOFF (7: governor 065–066 / Naples girls 093–100) → split (new entries E, retag F) | people/mentioned/ | 3 / 7 | bare stubs | high |
| B-40(1) | Legacy note in 070.0521 («Gaston married to Blanche Salviati») is a diary note → diary-side; BLANCHE, SALVIATI | | | DONE in glossary | high |
| B-41(3) | DON_CARLOS: check the 14 tags (063–086): Carlos de Bourbon vs «Don Carlos» = Alexis Karageorgevitch's nickname | people/mentioned/ | 14 | open | med |
| B-43(4) | SPERANDIO («Gavronzi servant») vs t.9 index «époux de Marie [Lola] Gorpintchenko»; LOLA covers only Lola Babanine, «Lola» in 066/1876-09-13–14 may be Lola Gorpintchenko → re-check both | people/mentioned/ | 11 / 35 | open | med |
| B-44 | CHOCOLAT: empty auto-stub (534 B); write from 065–067 (t.9 index «Chocolat, nègre. Domestique», «Chocolat, mère du précédent»); «Fortuné surnommé Chocolat» | people/mentioned/CHOCOLAT.md | 55 | still empty | high |
| B-45(1) | ZILLHARDT: «Amélie Zillhardt» → Jenny Zillhardt (t.14 index), plus «Zillhardt (Les)» sisters; with the move (A) | culture/art/ZILLHARDT.md | 9 | still Amélie | high |
| B-45(6) | L_ATELIER_JULIAN: odd «090.0447–0422», «090.0469–0444», «091.0305–0288» citations = new–old ID pairs → re-check every citation | culture/art/L_ATELIER_JULIAN.md | 45 | still present | high |
| B-46(1) | JANVIER_DE_LA_MOTTE | | 19 | DONE (father Eugène + son Louis overview) | high |
| B-49(1) | JULIAN: add 36 rue Vivienne (075.0325, 084.0162) and reconcile the galerie Montmartre / 51 rue Vivienne dates | places/schools/JULIAN.md | 122 | 36 rue Vivienne absent | high |
| B-50(1) | BOTKINE (painter Mikhail) / BOTKIN (doctor Sergei): identity sections DONE; still retag the 028–030 doctor tags (028.0077, 028.0079, 029/1875-02-05, 030/1875-03-01, 03-03, 04-01) to BOTKIN in all trees (F) | | 19 / 2 | partial | high |
| B-50(2) | EMILE: «le vieux Emile» = Audiffret père (027.0082) vs calibration «old man in Nice», and old Léon d'Audiffret has no file → decide identity; also 003.0020/0034 «Emile» with aunt Sophie, 027.0317 tag | people/mentioned/EMILE.md | 14 (fm 21) | open | UNSURE |
| B-52(5) | GRAND_DUKE_NICOLAS: «marrying Mlle Skobeleff» stated as fact → Marie's report of gossip (1874-03-15) | people/aristocracy/ | 14 | still states it | high |
| B-53(3), B-56 | ALEXANDRINE: two children (La Righi's daughter / Raynaud goddaughter); disambiguation section DONE, tags not split (F); MLLE_ALEXANDRINE (3): Doubelt vs Dolmatoff | people/ | 20 / 3 | partial | med |
| B-53(4) | MERTENS: «Alphonse» (t.10) vs «Adolphe» (t.11) | people/mentioned/ | 46 | G (index conflict) | G |
| B-56(3) | JEANNE (generic stub) tags Jeanne de Ballore (067.1454, 068.0049, 0052, 0913, 0917) → new JEANNE_DE_BALLORE (E) + retag; TREMOLILE (0, fm 1) vs «princesse de la Tremoill…» | people/mentioned/ | 6 / 0 | open | high |
| B-57(2), B-50(3), B-55(3) | WITTGENSTEIN: replace «Possible Identity» (Ludwig's family) by prince Pierre (Sayn-)Wittgenstein (t.3 index; «russe», «en tenue de général» 027.0099; possibly Pyotr Lvovich, 0.5) | culture/music/WITTGENSTEIN.md | 107 | conflict noted inside, old section still there | high |
| B-57(5) | LAMBERTYE: pre-rebuild IDs («017.0096» = now 017.0012) → re-point citations | people/mentioned/LAMBERTYE.md | 112 | still old IDs | high |
| B-58(1) | PITOU: «pet dog» → Marie's monkey (t.2 index «Pitou, singe de Marie», 013.0139/0143) + «Pitou : la Soubise» nickname; check its 18 tags for the Soubise sense | people/mentioned/PITOU.md | 18 | still «Male pet dog» | high |
| B-58(2) | MALAUSSENA = François (from 068.0847) vs Arthur Malausséna, avocat (1873: 005.0271, 006, 010) → split (E: ARTHUR_MALAUSSENA) or one man | people/mentioned/ | 7 (005–068) | open | med |
| B-58(6) | COLLIGNON: pre-rebuild «005.0204 … June 8» → 005.0203, 7 June | people/mentioned/COLLIGNON.md | 240 | still 005.0204 | high |
| B-58(8) | .claude/skills/researcher/SKILL.md «Princess Souvoroff (Bête/Cunegunda)» → Galitzine (skill file, not glossary) | | | open | high |
| B-59(2) | ROSALIE: «Rosalie Dame (née Pitauchard)» → née Grond (t.11–t.13 index); Pitauchard is the husband's nickname; fix name, title, aliases | people/mentioned/ROSALIE.md | 198 | still wrong | high |
| B-59(3) | Empty auto-stubs with identifications in 079 notes: BAL_DE_L_OPERA (19), MME_BOJE (10), GISELLE (10), BALZORANO (10) | | | stubs | high |
| B-59(4) | COMTESSE_ACARD: «Justine» vs «Catherine», baronne vs comtesse — G (index conflict) | people/aristocracy/ | 7 | open | G |
| B-60(2) | EMILE_DE_GIRARDIN «(1806-1881)» → 1802 | | 15 | still 1806 | high |
| B-60(4) | MOREAU (17): «Moreau (Les) famille du peintre» — which painter: G | | | | G |
| B-61(5) | FRANCINE: «likely in Paris» → Vienna couturière (t.1 index; 007.0334, 007/1873-08-07, 008/1873-08-12) | | 6 | still Paris | high |
| B-61(5) | SACCO, LA_SAXE: identities (florists/landlords; demi-mondaine) with the moves | | 7 / 4 | | high |
| B-62(4) | SUZANNE | | 1 (fm 3) | DONE (rewritten as Marie's mask); 078.0124 tag still on it → F | high |
| D-58 | PEYRONNEY = «Étincelle», Marie Biard de Peyronny (interencheres lot 87767814), after the merge | | 10 | 193 B stub | high |
| D-58 | BEAUMETZ (5): probably Étienne Dujardin-Beaumetz (1852–1913) — write with confidence marker | people/mentioned/ | 5 | 187 B stub | med |
| D-58 | HECHT: 097.0359 «l'ennemi» (1883) vs Henri Hecht the collector (105/1884-09-01) — check the 1883–84 tags | people/mentioned/ | 42 | partial | med |
| D-41 | CENDRILLON merges two productions (Nice 1873-03-28; Renz circus Vienna 1873-08-14) → split? (3 refs) | culture/theater/ | 3 | open | med |
| D-41 | DOULEUR_DE_NAUSICAA: cite Ouida *Ariadne* ch. X (098.0555) | culture/art/ | 17 | open | high |
| D-41 | FAUST (the Gounod opera tag, 27) vs FAUST_GOETHE (6): rename FAUST → FAUST_GOUNOD = owner call (lock window) | culture/theater/ | 27 | open | owner |
| D-42 | MME_MACKAY split (Bastien's friend vs Louise Mackay, 103.0356–0365) — body + F | people/mentioned/ | 55 | open | med |
| B-29 / D-43 | (diary footnotes) out of scope here | | | | |

## E. NEW ENTRY (≥2 mentions) and alias additions

Verification here = file absence checked; mention counts as given in the items (not all re-grepped).

| ledger | action | files | refs | verified state | conf |
|---|---|---|---|---|---|
| B-08 | MME_GEORGES (Georges's wife) | — | items say ≥2 | absent | med |
| B-08, TAGGER_BRIEF | Larderel's coachman Charles (1876–77; brief: "has no file") | — | | absent (CHARLES_COCHER exists, o=12: check whether it IS him; then this is done) | med |
| B-08 | LIOUBA | — | | absent | med |
| B-08 | Tibet boy (013) | people/mentioned/TIBET.md exists = «young man at the Howards' matinée» (o=2) | 2 | effectively DONE; delete retired places/countries/TIBET twin | high |
| B-09 / B-64(3) | NICOLAS_SAPOGENIKOFF «Coco» (049.0466, 050.0920) | — | 2 | absent | high |
| B-64(2) | Places: GRANDS_MAGASINS_DU_LOUVRE (019.0229, 019.0318), CAPODIMONTE (no file), LYON (move, A) | | 2 | absent | high |
| B-64(3) | SOPHIE_CROIZETTE the actress (020.0360; only places/streets/CROIZETTE) — ≥2? check | | 1+ | absent | med |
| B-64(3) | 1873 «Emile» with aunt Sophie (003.0020, 003.0034) | | 2 | absent (tagged nowhere) | med |
| B-33(3) | ETIENNE_ALEXANDROVITCH («le petit Etienne», 067.0384/0386/0387, 092/1881-06-02) | | ≥4 | absent | high |
| B-33(1) | ANDRIEUX_KHARKOV (hotel-keeper) | | 2 | absent | med |
| B-39(4) | OGAREV (poet, 024) / GENERAL_OGAREFF (066); MARTINOFF governor vs the Naples girls | | | absent | high |
| B-48(3) | MEYER_JARDINIER | | 2 | DONE (exists); tag 052/1876-01-19 → F | high |
| B-52(4) | Convent du Bon Pasteur, Nice (050, 053, 056, 059, 060, 063) | | ≥6 | absent | high |
| B-52(4) | Chpatowoka estate, «Grousskoë» station | | | unidentified → G | G |
| B-56(3) | JEANNE_DE_BALLORE (5 tags) | | 5 | absent | high |
| B-56(1) | GRYF_JAXA_BIKOWSKY | | 8 | DONE | high |
| B-58(2) | ARTHUR_MALAUSSENA (if split) | | 3+ | absent | med |
| B-59(3), B-52 | Places: LA_MADELEINE church (places/churches) for most of MADELEINE (13) + LA_MADELEINE (6); 079.0215 «Madeleine (celle qui a … la médaille)» is an atelier student — keep a person file for her | people/mentioned/ | 19 | open | med |
| B-52/B-48 | EGLISE_SAINT_AUGUSTIN (places/churches) | | 2 | absent | high |
| B-63(3) | Works: Tony Robert-Fleury's 1882 portrait of Marie (096.0003, 0033, 0332, 097.0101–0105) | culture/art/ | ≥4 | absent | high |
| D-41 | Gabriel von Max *Gretchen* (074.0370, 074.0379, 075.0305) | culture/art/ | 3 | absent | high |
| D-42 | POMAR 096–097 (~22 ¶) = nickname for the Kotchoubey princes → conflicts with TAGGER_BRIEF «Kotchoubey = Pomar (1882) → POMAR» and with new PRINCE_SERGE_KOTCHOUBEY (o=6) | | 19 (096–097) | open | UNSURE |
| D-42 | Splits: LOUIS (11: Canrobert / servant Louis "Thibaudin" / Suermondt husband), DOUCET (24: Jacques the couturier / Lucien the painter), DUSAUTOY (29: 1874 tailor 019–020 / 1881–83 pianist), MME_MACKAY → new files | | | open | med |
| D-42 | SARAH (5, 084): Julian fellow student, not Bernhardt — research | | 5 | open | G |
| B-45(5) | MME_MAGNAN on 090.0447 and 094.0334 | (F) | | both still untagged | high |
| Aliases | SAINT_AMAND + «Saint Agathe», «Agathe» (D-58, B-63); MOUSSIA drop «Moussia» (B-16); ONCLE_ALEXANDRE drop «Alexandre»; EMILE_BASTIEN_LEPAGE drop «Bastien-Lepage»; ROBERT_FLEURY drop alias «fr» (D-42); B-64(6) move aliases of retargeted stubs to their survivors | glossary frontmatter (`just glossary-add-alias` / `glossary-remove-alias`) | — | open | high |

## F. TAG RETARGET / TAG PROPAGATION (diary paragraphs)

| ledger | action | files | refs | verified state | conf |
|---|---|---|---|---|---|
| F-01 B-62(3) | EXPOSITION → EXPOSITION_UNIVERSELLE per paragraph: the 1878 tags (079, 080, 081: ~13 files) yes; 072/1877-07-08, 074 (4 files, 1877) and 101/1883-09-20 read first (Salon? another show?); then retire EXPOSITION | people/mentioned/EXPOSITION.md | o=18 files / 24 links | 3 done (080/05-11, 06-04, 06-05) | med |
| B-18 | Add LOUIS_II_OF_BAVARIA at 046.0131 + other «roi de Bavière» | | | still untagged | high |
| B-31(5) | «Fosti» lessons 055/1876-03-21, -24, -25 → TOSTI | | | open | high |
| B-32(6) | Propagate COMTE_MILORADOVITCH, PAVELKO, M_VOLKOVITSKY, DINA_BEDRIAGA, XAVIER_DE_MONTEPIN, ALPHONSE_KARR into 064–070 (only 067 tagged); check 067/1876-11-04 | | | open | med |
| B-34(2) | 020.0386 APOLLO (the god) → remove | | 1 | open | high |
| B-34(3) | Propagate BARON_DE_SAINT_JOSEPH (056, 059, 060, 068 list), PANDOLA (055–062 list), VARPAHOWSKY (051/1875-12-27, 059.0673) | | o=3 / 4 / 1 | open | high |
| B-35(3) | OLGA → OLGA_ANITCHKOFF | | | DONE (067 + 072.0035) | high |
| B-36/37(5) | GINISTRELLI in 070/1877-04-05, 071/1877-05-10 clippings (clipping rule: entities yes) | | | open | high |
| B-38(4) | POMINSKY in 068/1877-01-05 | | | open | high |
| B-39(1) | «la bossue» per use in 065–067 (Hélène Gorpintchenko 066.0498 = done; 066.0780 untagged) | | | open | med |
| B-39(2) | VICTOR (dog) vs VICTOR_DOMESTIQUE: 067.0983, 067.1475 still VICTOR; 067.0083 DONE | | | open | med |
| B-39(3) | WOLDEMAR 064/1876-08-04 (St Vladimir) → remove/retag | | | open | high |
| B-39(5) | YONINA on 065.0527, 0601, 0606, 0650, 0682 | | o=4 | open | high |
| B-39(6) | KOTCHOUBEY: 066.0056 DONE → PRINCE_SERGE_KOTCHOUBEY; DIKANKA.md «owning family» links (2) still → KOTCHOUBEY; trees still carry 6 stale KOTCHOUBEY links (tag-reconcile 066) | | | partial | high |
| B-40(3) | LISE → KONDAREFF in 071/1877-05-15, 05-18, 05-20, 05-28, 05-30, 06-01, 06-02 (LISE still o=7 in 071); 072 DONE; decide KONDAREFF vs MME_KONDAREFF for the mother | | 7 | partial | high |
| B-40(4) | 071.0278 HOTEL_DE_LA_PAIX (Nice) → HOTEL_DE_LA_PAIX_FLORENCE | | 1 | still wrong | high |
| B-40(5) | Propagate TEATRO_PAGLIANO (043.0198, 0206), EUGENE_ONEGIN (009.0208), SOUKOWKINE (053–056 list), PALAZZO_LARDEREL (071.0110) | | | open | high |
| B-40(7) | GIROFLE_GIROFLA: check the 31 other files (029–091) for Marie's own *Complainte de Girofla* / *Prédiction de Cassandre* | culture/theater/ | 29 | open | med |
| B-42(4) | Propagate ADELAIDE_RISTORI (056.0424–0425, 058.0167), JOACHIM_MURAT (087.0440, 089.0030), PRINCE_GORTCHAKOFF (089.0216), PERE_DIDON (087.0719) | | | open | high |
| B-43(3) | DUROCHER 065.0376, 065.0399 | | | open | high |
| B-45(2) | AMELIE / ARNAUD in other carnets (see B); MME_MAGNAN 090.0447, 094.0334; LOGHADES 102.0265 = DONE | | | partial | high |
| B-47(4) | IGNOTUS → 067.1602, 067.1611; AMALIA → 062.0354 | | | open | high |
| B-48(3) | MEYER_JARDINIER on 052/1876-01-19 | | | open | high |
| B-50(1) | BOTKINE → BOTKIN for the 028–030 doctor tags (all trees) | | ~6 | open | high |
| B-50(5) | LOUISE_THEO (065/1876-08-24, 095/1882-06-03), LE_PARDON_DE_PLOERMEL (024/1874-09-17, 030.0104) | | | open | high |
| B-51(3) | COMPLAINTE_DE_GIROFLA / PREDICTION_DE_CASSANDRE at 056.0524, 055.1000-1001 | | | DONE | high |
| B-51(4) | 056.0578 EMILE_D_AUDIFFRET (0.65 wrong; Soroka = Pietro) | | 1 | open | med |
| B-51(7) | Propagate SWEDOMSKY (068/1876-12-26), CACCIA_CLUB (059/1876-04-20, 060/05-10, 05-14, 063, 071), MLLE_MECHTCHERSKY (059.0152, 060.0030, 0173, 068.1609, 069.0087) | | | open | high |
| B-52(1) | MICHEL_HAMSLEY on both brothers (064.0599, 0600, 0616) — which brother: G | | | open | G |
| B-52(2) | TITIAN → 043.0164, 0167, 0193, 053.0358, 0378, 093.0207, 0211, 0309 | | o=1 | open | high |
| B-53(5) | 072 LISE → KONDAREFF | | | DONE | high |
| B-55(1), B-57(4), B-58(7) | DIADIA: audit the remaining 15 files (012:1, 013:9, 015:2, 016:1, 017:1, 040:1) one by one (Toulouse-Lautrec vs Étienne Babanine); trees still carry 4 stale DIADIA links | people/mentioned/DIADIA.md | 15 | 039 + 018.0210 DONE | med |
| B-56(1) | BIKOWSKY: 083.0160 «celui de Naples» → GRYF_JAXA_BIKOWSKY; 084/1879-02-23, 02-24, 087/1880-01-09 unassigned | | o=5 | open; trees carry 7 stale | med |
| B-57(3) | 017.0176 MME_DE_MOUCHY → DUC_DE_MOUCHY | | 1 | still wrong | high |
| B-57(4) | 021.0418 «Eristoff» = the prince (t.4 index) — tagged PRINCESS_ERISTOFF; 027.0317 EMILE (= old Léon, no file) → remove | | 2 | still wrong | med |
| B-59(5) | HOLBEIN (091/1881-02-07, 098/1883-01-23), WILLIAM_III_OF_THE_NETHERLANDS (072/1877-06-13), MME_BOJE epithet paragraphs (079.0365, 079/1878-04-08, 04-15) | | | open | high |
| B-60(7) | FRANCOIS_COPPEE → 087.0539, 104.0343, 0434, 0442–0449, 0489 | | o=1 | open | high |
| B-61(7) | BAINS_MACARANI (006/1873-06-30), FRANZ_JOSEPH_I (007/1873-08-07 «Fritz»), GRAND_HOTEL_VIENNA (008/1873-08-16) | | | open | high |
| B-62(4) | 078.0124 SUZANNE (code name for Marie) → remove | | 1 | still tagged | high |
| B-62(5), B-63(4) | entities-sync for 078 (ALEXIS → ALEXIS_SOMNAMBULE) and 096–105 | | | open | high |
| B-63(2) | POPE 099–105 «pope» → PERE_VASSILIEFF (see B) | | ~16 | open | UNSURE |
| B-64(1) | 004.0276 LEFEBVRE → LEFEVRE; 069.0405–0410 CHARLES_COCHER → PETIT_CHARLES | | | DONE (commit 1249ed245b; verified: 069 shows Petit_charles only) | high |
| B-64(3) | M. Volkovitsky on 066.0390, 0412 (M_VOLKOVITSKY now exists, o=2) | | | check | high |
| D-42 | EMILE_BASTIEN_LEPAGE tags that are Jules (099.0484; mixed 099.0303, 0383, 100.0113…103.0529, report-01); remove POMAR 094/1882-01-30; Bagnitsky (102.0570, 104.0230, 0601, 105.0750), Kanchine (091.0490, 100.0011, 0076, 103.0552, 104.0022) untagged — need entries? | | | open | med |
| D-42 | LEFEBVRE 077.0181? → LEFEVRE check | | | open | med |
| F-20 | Tree drift: run `just tag-reconcile LANG CARNET --scope all --write` (cz/uk/en/fr) on every carnet retagged by hand in _original (today: 066, 067, 069, 070, 071, 072, 080, 083, 090, 091, 092–097 …), then `just sync-verify` — fixes the 89 stale tree links per tree (AMELIE 20, LISE 7, BIKOWSKY 7, KOTCHOUBEY 6, …) and carries new tags | cz/uk/en/fr | 89 per tree | open | high |
| F-21 | Glossary cross-links to retired stubs (36 links; e.g. LOUISE_BRESLAU→TONY, PORTRAIT_*→TONY_ROBERT_FLEURY ×4, LOUISE_BRESLAU/BAILLEUL/MME_CARTWRIGHT→CARTWRIGHT, ALEXANDRE/GRAND_PAPA/VASSILISSA_BABANINE→NADINE_MARTINOFF, BERTHE/GONZALES_FAMILY/REMY_DE_GONZALES_MORENO→BOYD_FAMILY, NICE→VILLEFRANCHE, NAPLES→SORRENTO, DIEPPE→TROUVILLE/MONT_DORE, MUNKACSY→MUNKACZY/MUNKASSY, CAMPRIEN→TEPLAKOFF …) → retarget each to its replaced_by (check BOYD_FAMILY, NADINE_MARTINOFF replaced_by first) | glossary | 36 | open | high |
| F-22 | entities-sync: stale fm IDs (ARNAUD fm 23 vs 2 links, COUVELET 13 vs 8, AMERIQUE 2/0, EMPEREUR 3/0, DUMAS 5/0, MISS_HALL 4/0, PERONNEY, TREMOLILE, MADELEINE_DELSARTE, MADEMOISELLE_OELSNITZ, DUGUE_DE_LA_FAUCONNERIE, LE_VICOMTE_DE_BRAGELONE 1/0 …) → `just entities-sync --apply` (strict for merged/retired IDs) after A–C | _original frontmatter | | open | high |

## G. Needs owner ruling or scan/manuscript research (not doable from the repo alone)

| ledger | item |
|---|---|
| A-38 | «le Sauvage» = Domenico Antonelli or the old count (DOMINIQUE_ANTONELLI carries it) |
| A-39 | Ogareff, Potemkine: private vs famous name tier |
| A-40 | Undecidable identities: Fritz vs VICTOR; two ANTONSKY stubs; Tcherkassky ×3; Eristoff vs Mme Eristoff; Kanchine; Munkácsy; Presseq; Mouchy; Doria vs Doria_Pamphilii; Patton; Teplakoff; old Léon d'Audiffret's kinship |
| A-41 | FASHION → CLOTHING rename (1,247 tag files per tree; CLOTHING absent) |
| A-42 | Tagging policy: epithet-only referents, «la société niçoise», theme-proposal leftovers |
| A-60 | Works tiers 2/3 go/no-go |
| B-10 | Domenica's birth year (scan) |
| B-33(5), B-35(2) | which grand-duc Nicolas (064.0562 vs 067.0921/0926) |
| B-33(9) | which Sumarokov-Elston; horse-levy date |
| B-35(3) | Olga Anitchkoff 1874 vs the 1876 child |
| B-40(1), B-37(4), B-38(5), B-41(5), B-46(1), B-48(4), B-49(4), B-53(4), B-56(4), B-59(4), B-60(5) | Mon Journal index slips (record in RSR notes; no glossary change beyond the D fixes) |
| B-45(3) | d'Abzac identities |
| B-45(4), B-49(5), B-50(6), B-51(6), B-52(4), B-54(4), B-56(5), B-57(7), B-59(6), B-60(6), B-61(9), B-62(7), B-63(3), B-31(6), B-34(8), B-36(5), B-37(6), B-39(7), B-42(5), B-43, B-46(2), B-47(5), B-48(5), B-55(4), B-58(5 SWISS_TIMES; cf. culture/newspapers/MR_HOWARD_SWISS_TIMES — maybe a duplicate) | "unidentified" lists |
| B-52(1) | which Hamsley brother is Michel |
| B-53(4), B-59(4), D-41 | MERTENS first name; Acard mother's name; SAPHO_OPERA (Gounod vs Pacini) |
| B-31(2) | M_MARX = Karl Marx? (0.2) — check July 1876 whereabouts or drop |
| B-34(6), B-51(5) | Cesaro vs Zucchini (one or two men; no CESARO file) |
| D-44 | Tomb & funeral entries (Gallica blocked) |
| RAVEL (B-09) | «ce Ravel qu'on raccommode» (people/mentioned/RAVEL, 6 refs) — carriage, piano, or a person? |
| Out of scope (diary-side, other agents) | source/footnote/OCR/dash fixes in B-31(1 notes), B-35(1), B-36(4), B-37(1-2), B-38(1), B-40(8), B-41(4), B-43(1-2), B-45(7), B-46(3), B-50(4), B-51(1-2,8), B-53(1-2), B-54(1-2,5), B-55(5), B-57(1,6), B-58(3-4), B-59(1), B-61(1-4), B-62(1-2,6), B-63(1), D-41 footnotes, D-43, D-58 tree footnotes |

---

## Order and dependencies

0. One decision first: merged/retired sources → delete, or keep as retired stubs (`status: retired`, `replaced_by:`, aliases stripped). The repo convention so far is retired stubs (218). The merge tool deletes by default.
1. Delete the 0-ref retired twins whose basenames shadow live files you will move or merge (TIBET in places/countries, MEUDON/LOUVRE/CAPITOLE/ARC_DE_TRIOMPHE in people/mentioned, PRODGERS/PATTON in places, VILLEVIEILLE in places/cities, CROIZETTE, COURSES, CARRICOLO in people/mentioned, BAGATELLE ×2). Or simply never pass those IDs to the tools.
2. Per-paragraph splits/retags (F, and the "split first" B rows: MICHEL, MORENO, POPE, DUCHESS_OF_HAMILTON, EXPOSITION, ITALIENS, AMELIE, ARNAUD, VISCONTI, ANDRIEUX, OGAREFF, MARTINOFF, MADELEINE, SAINT_AUGUSTIN, ALEXANDRINE, JEANNE, BOTKINE, WOLDEMAR) must come BEFORE any merge/retire of the same file. A merge rewrites every link to the source, right or wrong.
3. Merges where the survivor also moves: merge first, then move (JOUY→JOUY_EN_JOSAS→places/cities; REVUE_NOUVELLE→NOUVELLE_REVUE→culture/newspapers; PIGEON_SHOOT_MONACO→MONACO_PIGEON_SHOOT→places/venues). The other order also works (the tools resolve paths at run time), but one order keeps the dry runs readable.
4. Body fixes (D) on a file that will be merged: do them after the merge on the survivor (the merge appends/rewrites the body). Fixing a file that will be moved is safe either side of the move, as long as the two don't run at the same time.
5. Retire stubs that trees still link (HOTOWSKY, ROBERT, LE_VICOMTE_DE_BRAGELONE) only after `tag-reconcile` on their carnets, or with merge (which fixes the trees).
6. Last: `just entities-sync --apply` (strict for touched IDs), `tag-reconcile --scope all` for every carnet retagged by hand, `just glossary-missing` (must be empty), `just verify-carnet` + `sync-verify` per touched carnet/lang.

Conflicts between items:
- B-63 "merge POPE into PERE_VASSILIEFF" vs the TAGGER_BRIEF rule «le pape», Pie IX → POPE: only the 1882–84 tags move.
- D-42 "POMAR in 096–097 = Kotchoubey princes → new entry" vs TAGGER_BRIEF «Kotchoubey = Pomar (1882) → POMAR» and the new PRINCE_SERGE_KOTCHOUBEY (066): owner/lead decision.
- B-38(3)/B-60(1) MICHEL survivor (calibration) vs MICHKA_ERISTOFF richer body: keep the MICHEL ID, move the body.
- B-60(1) OELSNITZ survivor (researched, 8 refs) vs MLLE_OELSNITZ (17 refs, auto-stub): TAGGER_BRIEF "researched or more-used" → OELSNITZ.
- B-61(5) "OLGA_SAPOGENIKOFF vs calibration OLGA" and "GRITZ_MILORADOVITCH vs calibration MILORADOVITCH": the repo already went to GRITZ_MILORADOVITCH (MILORADOVITCH retired). The calibration brief (~/rebuild-state, not in repo) is stale; for OLGA the brief wins.
- B-58(5) TIR_AUX_PIGEONS (Nice, 31) vs the two Monaco files: not duplicates of each other's city; only the two Monaco files merge.
- B-33(4) KAPITAN vs KAPITANENKO: usage favours KAPITAN (10 vs 9); calibration favours KAPITANENKO. Pick KAPITANENKO (its body has content).

## Batching

- Batch 1 — mechanical moves (A, about 75 calls): one sequential runner (Sonnet is fine), dry run then apply, one commit per few moves. About 5 s per call. Must not overlap any other batch that edits content. Needs a quiet window: the active lan-/rsr-/fab-/fn-* agents edit the same diary and tree files.
- Batch 2 — easy merges/retires (B/C rows marked high with no "split first"): the same sequential runner after Batch 1, `--no-delete --simple --clean` plus a retired stub. About 35 merges.
- Batch 3 — per-paragraph research retags (F + the split-first B rows): parallel by carnet range (1873–75 / 1876 / 1877–79 / 1880–84). These edit _original diary files only (tag lines + RSR notes). They conflict only with agents working the same carnets, so schedule after the current lan-/rsr- waves for those carnets. Then their dependent merges go back to the Batch 2 runner.
- Batch 4 — body rewrites (D) and new entries (E): fully parallel (glossary files only, disjoint IDs). Say 4–6 researcher agents grouped by period. Only constraint: don't touch a file that Batch 1/2 is moving or merging at that moment. Do merge survivors after their merge.
- Batch 5 — propagation + hygiene (F-20, F-21, F-22, alias cleanup): sequential, last. tag-reconcile per carnet/lang, then entities-sync, glossary-missing, verify-carnet, sync-verify.
- Batch 6 — owner items (G, plus the UNSURE rows): collect into one owner question list. Don't execute.
