# Spanish Translation Progress

<!-- Last updated: 2026-09-07 -->
<!-- Updated by: ED (pilot policy decisions) -->

## Overview

| Metric | Value |
|--------|-------|
| **Total carnets** | 107 |
| **Total entries** | ~3,733 |
| **Carnets translated** | 0 (001 in progress: 5/22 entries) |
| **Entries translated** | 5 / 3,733 |
| **Entries opus-reviewed** | 5 |
| **Entries editor-approved** | 5 |
| **Entries conductor-approved** | 5 |
| **Paragraphs translated** | 17 |
| **Overall progress** | 0.1% |

## Current Status

Tree bootstrapped 2026-09-05 (CLAUDE.md, PROGRESS.md, TranslationMemory.md). Carnet 001 scaffolded (22 files); pilot slice 1 (1873-01-11 .. 1873-01-15, 5 entries, 17 paragraphs) is conductor-approved as of 2026-09-05, the remaining 17 entries are `TODO_PLACEHOLDER` scaffolds. Run report: `.claude/reports/2026-09-05-es-001.md`. The Spanish diary route is not enabled in the frontend; wiring status is tracked in `docs/ADDING_LANGUAGES.md` (Part 3 checklist).

### Known Gaps

#### Gap 1: Everything except pilot slice 1 (000, 001 from 1873-01-18, 002-106 not started)
Pilot on carnet 001 must complete and be reviewed by the human before any wave is scheduled. Slice 1 done; continue 001 from 1873-01-18 with the same stage sequence.

## Pilot plan

**Pilot carnet: 001** (Nice, 11 Jan – 12 Feb 1873; 22 entries, 163 paragraphs, 148 needing translation per `just scaffold 001 -l es --dry-run`). Chosen because it is the smallest early carnet with RSR and LAN complete in `_original` and all 22 entries conductor-approved in cz, uk and en, so every Spanish decision can be compared against three sibling translations.

**First slice: the first 5 entries** — 1873-01-11, 1873-01-12, 1873-01-13, 1873-01-14, 1873-01-15 (17 paragraphs). Stop after the slice, run the checks below, log the baseline, and only then continue to the rest of 001.

### Gate sequence

1. `just scaffold 001 -l es` (no `--dry-run`) — creates `content/es/001/*.md` with French in `%% %%`, RSR/LAN copied, `TODO_PLACEHOLDER` bodies
2. `/project-status bootstrap es 001` — per-carnet README
3. translator (TR) → `translation_complete: true`
4. opus-editor (OPS) → `opus_reviewed: true`
5. editor (RED) → `editor_approved: true`
6. conductor (CON) → `conductor_approved: true`
7. optional: fablelous (FAB), vox (VOX) → `redaction_passes`
8. `just sync 001 es` after any later `_original` annotation change

### Success criteria for the workflow trial

- [x] `just verify-carnet es 001` passes with no tooling failures (paragraph IDs, `%%` balance, frontmatter) — 0 failures on the 5 slice files; the 44 remaining failures are all in the 17 untranslated placeholder files (scaffold gap, see run report tooling 1 and 4)
- [x] `just check-comments es` reports zero structural comment defects — note: the recipe takes tree *names* (`es`), not paths (`content/es`, as this plan first said)
- [x] `just check-links es 001` reports zero broken glossary/cross-ref links — 295 links OK
- [x] Every skill (translator, opus-editor, editor, conductor) finds and uses `content/es/CLAUDE.md`, including the `## Editor / review traps (Spanish)` section, without prompt hacks — TR, OPS and RED all cited it unprompted
- [x] A quality baseline is logged for the executive-director: first-pass RED approval rate, CON approval rate, count of A/B/C findings per pass, top-5 recurring trap categories — see Quality baseline below and `.claude/skills/executive-director/SKILL.md` plateaus
- [x] Run report filed as `.claude/reports/2026-09-05-es-001.md` with `target_language: es`
- [x] No hard-coded-language failures surfaced in scripts — none language-specific; the scaffold/verify mismatches found are language-agnostic and recorded in Part 3 of `docs/ADDING_LANGUAGES.md`

### Quality baseline (slice 1, 2026-09-05)

- **CON score 0.94** (per entry: 01-11 0.92, 01-12 0.94, 01-13 0.93, 01-14 0.95, 01-15 0.95; voice the highest dimension). Sibling plateaus: cz ~0.92, en ~0.95-0.96, uk ~0.92-0.96.
- **First-pass approval**: RED 5/5, CON 5/5.
- **Edits per pass** (A/B/C): OPS 26 = 4/16/6 (+1 structural fix); RED 3 = 1/2/0; CON 4 = 0/2/2. Total 33 edits over 17 paragraphs, front-loaded in OPS.
- **Top defect categories**: (1) tense/voice — passé composé and narrative present flattened, periphrastic *ser*-passive; (2) deixis and null-subject ambiguity; (3) ser/estar on appearance; (4) register drift into notarial or dubbing-flavoured Spanish; (5) adverb/adjective placement calqued from French; (6) footnote fidelity when translating inherited notes. Plus garment "con"/static "en" prepositions and one asserted-but-unapplied fix in a review comment.
- **Decisions taken**: *voiture* → "carruaje"; bare "Cuaderno n.º 1"; footnote call before punctuation (RAE); performed-work titles kept in French + glossed, descriptive titles translated; translator-added footnotes allowed when aligned with the en apparatus. All folded into `CLAUDE.md` on 2026-09-05.

### Decided 2026-09-07 (maintainer's brief: sensible defaults from Spanish translations of French literature, modern lean, readable in Spain and Latin America alike)

Full rules in `CLAUDE.md` (sections marked DECIDIDO 2026-09-07) and `TranslationMemory.md`.

1. **Second person: tú / usted by the French *tu/vous* per instance; plural always `ustedes`.** *Ustedes* is the only plural in all of Latin America, the Canaries and western Andalusia (DPD, s. v. *vosotros*, *usted*) and is understood everywhere; *vosotros* reads as foreign to most readers. Cost: in Spain the intimate plural sounds slightly formal and the tú/usted contrast vanishes in the plural; in a first-person diary the second-person plural occurs almost only in quoted dialogue, so the loss is marginal. Slice 1 contains no second-person plural, so no entry changes. Supersedes the `vosotros` pilot default.
2. **Names: three tiers.** "Marie Bashkirtseff" locked; private persons keep Marie's French spelling as in the glossary (Babanine, Gagarine, Paul Grigorievitch, Nicolas, Pierre; the "Piotr vs Pedro" question is closed: neither, keep Marie's form); public figures take the established Spanish form (Tolstói, Dostoievski per the FundéuRAE transcription guide; monarchs and saints hispanised per the RAE *Ortografía*: Alejandro II, Nicolás I, Pedro el Grande). Glossary tags keep the `_original` id; each rendering is recorded in the TM with its glossary id for the future onomastics checker.
3. **Footnote labels confirmed: N. de la A. / N. de la T. / N. de la E.**, mapped one-to-one onto cz *Pozn. aut. / Pozn. překl. / Pozn. red.* with the same meaning (T = inherited explanatory notes + translation decisions; E = editorial reading/research notes). Abbreviated form with the colon; the frontend does not parse the label. The feminine form is an internal-consistency choice (already approved in slice 1; "N. del T." and "N. de la T." both circulate in Spanish publishing), reversible by mechanical substitution.
4. **Exonyms: established Spanish exonym when one exists and is current, local form otherwise** (RAE *Ortografía* 2010, FundéuRAE): Niza, París, Roma, Nápoles, Florencia, Viena, Ginebra, Versalles, Bruselas, Marsella, Génova, Venecia, Berlín, Londres, Moscú, San Petersburgo, Kiev, Járkov, Odesa, Mónaco, Montecarlo, los Campos Elíseos; kept: Gioia, Dieppe, Baden-Baden, Spa, Soden, Wiesbaden, Schlangenbad, Biarritz, Ostende, Poltava, Gavronzi (Marie's spelling, as in en and the glossary), Promenade des Anglais, Bois de Boulogne. Kiev/Járkov/Odesa are the FundéuRAE-recommended forms, so the es tree departs from the expansion plan's "transliterate from Ukrainian" line for Ukrainian places; Ukrainian variants are recorded in the glossary/TM only.

### Still open for the human

1. **Spanish UI locale before or after the diary tree** — whether `es.json` and the GUI locale go live first (readers of cz/en/uk with a Spanish interface) or only together with the first published Spanish carnet.
2. **TM seeding** — whether to pre-seed `TranslationMemory.md` from the en/uk TM structure (People, Places, Titles, Key Terms) beyond the policy rows already present, or grow it per carnet as cz/uk did.

## Historical Note

No complete Spanish translation of the diary exists; circulating Spanish selections derive from the censored 1887 edition. This tree aims to be the first complete, uncensored Spanish edition from the manuscripts.

## How to Contribute

1. Clone the repository
2. Copy `.claude/WORKER_CONFIG.yaml.template` to `.claude/WORKER_CONFIG.yaml`
3. Set `working_language: es`
4. Run `just init-source-hashes es` after creating first translations
5. Use `/translator` skill to translate entries

## Recent Activity

- **2026-09-05**: Language tree bootstrapped (CLAUDE.md, PROGRESS.md, TranslationMemory.md); pilot plan drafted; no entries translated
- **2026-09-05**: Pilot slice 1 (001: 1873-01-11 .. 1873-01-15, 5 entries, 17 paragraphs) through TR → OPS → RED → CON, all 5 conductor-approved, CON 0.94; all gates green on the slice; run report `.claude/reports/2026-09-05-es-001.md`; CLAUDE.md style guide revised from the findings
- **2026-09-07**: Four pilot policies settled by the maintainer (ustedes plural, three-tier name rule, footnote labels confirmed, exonym rule + table); written into CLAUDE.md and TranslationMemory.md; no entry text changed (slice 1 already conforms)

---

_This file tracks Spanish translation progress. Run `/project-status es` for detailed status._
