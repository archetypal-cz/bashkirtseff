# English placeholders in content/_original — 2026-09-26

Same defect class as carnet 099 (commit 877752998). Worked only in `content/_original`; no translation tree touched; nothing committed.
Changed-file list: `/tmp/claude-1000/-home-krr-bashkirtseff/b9feb4af-4102-4275-8101-365f3e93d604/scratchpad/placeholders-changed.txt` (78 files).

## Status: DONE (except 066, see "Not fixed")

Gates: `just verify-carnet _original {c}` PASS (0 fail, 0 warn) and `just splicescan _original {c}` empty for 010 068 072 084 085 090 091 092 093 100 105.

## Method

- **Sweep.** Every visible (non-comment) line in `content/_original/0*–1*/` was scored for English vs French function words, plus a census of every bracket-only line. Marie's own English was checked and is **legitimate**, so it was left alone: 1873–75 passages, pasted Hamilton newspaper clippings, dialogue, verses and `H[is] G[race] t[he] D[uke]…`. French editorial notes (`[Rayé:…]`, `[Pas d'entrée…]`, `[… lignes cancellées]`) were also left.
- **Tomes.** They were extracted with python-docx: italics become `*…*`, and numbered-list paragraphs become `- ` dialogue lines, because the docx stores dialogue dashes as list formatting.
- **Checks.** Each case was checked against the tome heading sequence and a shingle-based coverage check.
- **Notes.** Every change carries a dated RSR note citing the tome and docx paragraph index. IDs were never renumbered.

## Cases and resolution

### Real French restored from the tome

| File | IDs | What changed |
|---|---|---|
| 068/1877-01-07-09 | 0189 0191 0194 0197 0207 0216 | English summaries → Marie's text. 0216 is the whole Pierret dialogue, docx 3898–3964. |
| 068/1877-01-07-09 | 0206 | Truncated paragraph completed. |
| 068/1877-01-07-09 | 0210, 0218 | Silently dropped paragraphs appended; 0218 gets docx 3967–3983. |
| 068/1877-01-07-09 | 0204 | Monday 8 Jan is empty in the tome → `[Aucun texte - date seule mentionnée]`. |
| 068/1877-01-10-18 | 0231 0234 0235 0238 0239 0241 0243 0246 0247 0249 0250 0251 0253 0255 0257 | English summaries → French. |
| 068/1877-01-10-18 | 0237 0240 0244 0256 | Truncated or ellipsis-condensed paragraphs → full text. |
| 068/1877-01-10-18 | 0252 0259 0261 | Dropped lines appended. |
| 068/1877-01-10-18 | 0219 | `[Letter to Pierret, not sent:]` → the real heading `## Mercredi 10 janvier 1877`. |
| 068/1876-12-17-18 | 0031, 0033 | 0031: 17 Dec is empty in the tome → empty-day note. 0033: was an empty block; now holds «Hier, on me réveille par une carte…». |
| 068/1877-02-10-12 | 0271 | Spurious placeholder removed; the block is left empty, because the tome has nothing between 0270 and 0272. |
| 068/1877-02-13-21 | — | Duplicate English heading `## Thursday, 15 February 1877` removed. |
| 100/1883-06-02 | 0007 | docx 3483–3495 restored. |
| 105/1884-09-11 | 0809 | English "[Note: Beginning of Book 106…]" → the notebook's French title page, docx 4108–4111. |

### Tome has no text for the date

These got `[Aucun texte - date seule mentionnée]` plus `flags: empty_in_source: true`:
- 072/1877-06-20
- 084/1879-04-12, 04-14, 04-19, 04-24
- 085/1879-06-12
- 090/1880-11-09, 11-15, 11-18, 11-20
- 091/1881-04-27, 05-09, 05-13
- 092: 28 dates, May–August 1881
- 093/1881-08-19, 08-22, 08-26, 08-30, 08-31
- 100/1883-06-30, 07-05, 07-06, 07-07, 07-20, 07-31, 08-04, 08-06
- 105/1884-09-03

These dates have no heading in the manuscript at all, so they got `[Pas d'entrée pour cette date]` plus the flag:
- 010/1873-10-14
- 092/1881-07-03

### Text is already in _original, but in the wrong file

The extraction ran the day into the previous file. The stubs now hold a French pointer (`[Le texte de cette date figure dans l'entrée du …]`):
- 100/1883-06-13, 07-10, 07-16, 07-17, 07-19, 07-23, 07-24, 07-30, 08-02, 08-07
- 092/1881-06-13, 08-08 (here the neighbour's date heading is also wrong)
- 092/1881-06-21, 06-22 (one combined entry for 20–22 June, text in 06-20)

**Needs restructurer:** an entry split or swap for all of these.

## Not fixed: structural gaps that need new IDs (lead or owner decision)

- **068.** 1877-01-19 → 02-09 is absent from _original: about 480 raw paragraphs, docx 4150–4633. The 1877-02-12 Cancello episode stops at docx 4871; 4872–4959 are missing. December entries silently lost about 150 paragraphs: docx 3466–3499, 3561–3635 and 3829–3846.
- **065/066.** Structurally broken. Tome09 docx 500–1150 (about 24 Aug – mid-Sept 1876, about 600 paragraphs) is missing, and file dates don't match headings. For example, 065/1876-08-29 holds the 21–22 Aug text. The `[Entry content missing from source]` stub at 066.0166 was left untouched; the carnet needs full re-extraction.
- **100.** 06-01, 06-03 (Grand Prix) and 06-04 have no IDs or text: docx 3480–3481 and 3497–3506. Most of 100 is accent-stripped.
- **072/1877-06-15 and 073/1877-07-15.** About 15 paragraphs are missing from each; they have French "[Continuation …]" labels.

## Translation trees: refresh and retranslate

Every tree needs `just sync {c} {lang}` for 010 068 072 084 085 090 091 092 093 100 105. es has none of these files.

**Retranslate, new French** (cz, uk, en, fr):
- 068/1876-12-17-18 (0033)
- 068/1877-01-07-09
- 068/1877-01-10-18
- 100/1883-06-02
- 105/1884-09-11 (0809)

**Replace the translated English stub** with the empty-day note or pointer (cz, uk, en, fr): every other file in the changed list. Also:
- 068/1877-02-10-12: empty 0271.
- 068/1877-02-13-21: drop the "Thursday, 15 February" heading, present in all four trees.

About 200 cz/uk/en/fr files in 092 and 100 still carry the English stubs.
