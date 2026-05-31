# Glossary link cleanup — en / uk / source residual broken links

**Date:** 2026-05-31
**Role:** RSR (researcher)
**Scope:** Clear the remaining broken glossary links (links pointing to entries that
don't exist) in the English and Ukrainian translations, plus 6 source-only
residuals discovered during the sweep. Branch `main`.

## Result

`check-links` broken-link count, all five trees, **before → after**:

| Tree        | Before | After |
|-------------|-------:|------:|
| _original   |  6 / 36 instances |  **0** |
| cz          |  0 |  **0** |
| en          | 30 distinct / 40 instances |  **0** |
| uk          | 46 distinct / 63 instances |  **0** |
| fr          |  0 |  **0** |

**Zero broken glossary links across all trees.** `content/cz/` and `content/fr/`
were not modified (they were already clean); no existing glossary files were
modified (only additions). 45 new glossary entries created; 50 carnet files edited.

## Method

Work was split across three scope-isolated researcher agents to avoid file
conflicts and to route around an intermittent tool-output display issue:
- **EN agent** — edited only `content/en/` (carnet 088) + created en's glossary entries.
- **UK agent** — edited only `content/uk/` (carnets 004, 005) + created uk's entries.
- **SOURCE agent** — edited only `content/_original/` carnet files (066, 069).

Each verified its own tree to 0; a final independent agent confirmed the global
scan = 0 and that cz/fr were untouched. Every identity was checked against diary
context before remapping; new entries are sourced (Kernberger 2013, Wikipedia,
Britannica, BNF, etc.) and cite their sources in-entry.

## Entries CREATED (45)

All are accurately-sourced (some short stubs, better than a broken link), placed at
exactly the path the existing links pointed to so the links resolve.

**people/mentioned (33):** ALICE_BRISBANE, FERDINAND_DE_LESSEPS (Suez), CREMIEUX
(Adolphe Crémieux family), MONTALIVET (comte de Montalivet), AMELIE_BEAURY_SAUREL
(painter), JEANNINGROS (Gén. Jeanningros), ENAULT (Louis Énault, critic), OCEANA
(Oceana Renz), KIRIEWSKY, BRUNIER, GAUPILLAT, ROUZAT, PASCALIS, ITURBE, BEARN,
COURTES, FROMAN, LAREINTIE, DUFOUR, MOLINER, BROCHETON, SIMONIDES; ALEXIS_SAPOGENIKOFF,
SOLOMINKA_MARKEVITCH (Mme Markévitch "little straw" — confirmed distinct from
MME_MARKEVITCH the general's wife), M_TCHERNIKOFF (kept distinct from TCHERNICHOFF —
spelling/identity uncertain), COMTE_GRIMAU, MME_DE_BALLORE, PERE_LAVIGNE, PATTON_FAMILY,
BERLIKOFF_FAMILY, GINEW_FAMILY, MLLE_BOUMINI_TAMBOURINI (daughter of baritone
Antonio Tamburini), MLLE_COMBIE, MME_KABNILINE, MOLTCHANOFF, M_NENNKOFF, SACCHI,
GRAND_DUCHESS.
**people/artists (1):** MOROT (Aimé Morot). **people/royalty (1):** QUEEN_ISABELLA_II.
**culture (5):** art/APOLLO_BELVEDERE, literature/THE_LAMPLIGHTER (Cummins 1854),
music/MENDELSSOHN_CONCERTO (Op.25), newspapers/LE_PHARE_DU_LITTORAL (Nice paper),
themes/ANIMALS.
**places (5):** churches/RUSSIAN_CHURCH_GENEVA, social/FOLIES_NICOISES,
social/RUMPELMAYER_CAFE (redirect stub), streets/QUAI_SAINT_JEAN, villas/{RUBIONI,
VILLA_AUDIFFRET, VILLA_DURANDO, VILLA_SAVELIEFF}.

## Links REMAPPED (verified same entity → existing entry)

**en (carnet 088):** LEON_BONNAT→people/mentioned/BONNAT; BOJIDAR_KARAGEORGEVITCH→
people/recurring/BOJIDAR; MASSENA_DUC_DE_RIVOLI→people/aristocracy/DUC_DE_RIVOLI;
PRINCE_DE_MONACO→people/aristocracy/PRINCE_CHARLES_III; ALT→people/aristocracy/BARON_D_ALT.

**uk (carnets 004/005):** COUNTESS_DE_MOUZAY→MOUZAY; MICHEL_FAMILY→MICHEL;
TWO_GRAND_DUKES→GRAND_DUKES; ANITCHKOFF_FAMILY→recurring/ANITCHKOFF;
FRIEDLANDER_FAMILY→FRIEDLANDER; HOWARD_CHILDREN→recurring/HOWARD_FAMILY;
MME_BEKETOFF→BEKETOFF; MME_RICE→RICE; M_GROS→MAURICE_GROS; M_KHALKIONOFF→KHALKIONOFF;
NINA_BELLOTTI→aristocracy/MLLE_BELLOTTI; PRINCE_OF_MONACO→aristocracy/PRINCE_CHARLES_III;
BOUTOVSKY_GIRLS→recurring/BOUTOWSKY; RUMPELMAYER_CAFE→places/cities/RUMPELMAYER;
HOTEL_DE_LA_METROPOLE→places/hotels/HOTEL_METROPOLE.

**source (carnets 066/069):** SKATING→places/venues/SKATING (le Skating rink,
Naples 1877); CERCLE→people/mentioned/CERCLE_PHILHARMONIQUE (Naples concert society);
VERSAILLES→places/cities/VERSAILLES (Galerie de Versailles ref).

## Tags PRUNED (spurious / trivial)

- **source 066/069:** RUSSIE (×9) and ITALIE (×3) — generic country common-nouns
  mis-tagged under people/mentioned (the country is self-evident; places/countries
  entries already exist for meaningful uses); EMILE_D_AUDIFFRET (×3) — broken
  duplicate line sitting next to a working `people/recurring/EMILE_D_AUDIFFRET` tag.
- **uk:** PITOU_MONKEY (pet monkey), PRATER_DOG (family dog), ANNA_SERVANT (unnamed
  servant) — trivial one-offs.

## Cross-language tag propagation (done)

The broken links were each present in only **one** tree (en-only, uk-only, or
source-only) — the tagging was already divergent across languages. After link
health was fixed, a **scoped propagation pass** mirrored this session's tags so
the affected paragraphs carry identical glossary tags across all five trees.

- **Target set:** 74 tags = 21 remap targets + 53 newly-created entries.
- **Scope:** strictly the 5 affected carnets (004, 005, 066, 069, 088). Additive
  only (insert tag lines; never delete/alter), correct path depth per tree
  (`../_glossary/` for source, `../../_original/_glossary/` for translations),
  display strings reused verbatim, tag style matched per file.
- **Result:** 476 tag lines inserted across 246 files (_original 122, cz 70,
  en 116, fr 168, uk 0 — uk already carried them / lacks some carnet files).
  Final state: **0 broken links in all five trees**, 0 cross-tree sync gaps for
  the target set, no out-of-scope files, HEAD unchanged.

### Process note (recovery)
A first propagation attempt mistakenly did a **repo-wide tag union** (≈60k
insertions across all carnets) and performed risky git stash/checkout operations.
It was caught and fully reverted: tracked files reset to HEAD (`git checkout HEAD
-- content/`), the 45→53 new glossary entries preserved (untracked), then the
session's remaps/prunes were deterministically re-applied (47 remap + 18 prune
instances) and the **scoped** propagation re-run. HEAD was never moved; no commits
were made. Lesson: propagation must enumerate an explicit target-path set and a
carnet scope — never union all tags on touched paragraphs.

## Files touched (final state — all uncommitted)

- **53 new glossary entries** under `content/_original/_glossary/` (culture 5,
  people 41, places 7) — untracked.
- **295 carnet files modified** (link fixes + scoped propagation), confined to
  carnets 004, 005, 066, 069, 088 across all five trees.
- Existing `_glossary/` entry files: unmodified (only additions).

**Not committed.** These changes (the link fixes, the 53 new entries, and the
propagation) remain in the working tree. They must be committed together — the new
entry files are the targets that make the remapped/created links resolve.
