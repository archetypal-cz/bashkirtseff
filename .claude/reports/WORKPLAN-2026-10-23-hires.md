# Work plan — sharp page images (started 2026-10-23 evening, owner asleep)

Owner (KRR, 2026-10-23): «start verifying and refining the originals — run Sonnet/Opus subagents to check and
fix the original, then carry it into the translations with further agents, add tags and research where needed.»

Source: ABBYY page images from arrdata (see `content/_raw/scans/hires/`, tools in `hires/_tools/`):
tomes 3–5 complete + 18 single pages of tomes 6/9/10/14/15 (the scan wishlist, `scan-wishlist-2026-10-23.md`).

## Phase A — `_original` against the images (Opus, brief `hires-2026-10-23/BRIEF-A.md`)

| Pkg | Carnets | Tome | Items | Status |
|---|---|---|---|---|
| A1 | 015–020 | 3 | apostrophes 018–019, Russian stars (B-57: 017.0015, 018.0128–0294, 020.0280/0286), 020.0194 margin note | done: _original 46a61a4241; cz 51ad7560e8 uk 9c0e5154cc en f15c8f260a fr 3f01963e78 |
| A2 | 021–025 | 4 | Russian stars (021.0257/0417, 023.0227/0228, Walitsky verses 023.0218/0220), apostrophes 023.0453–0549, 025.0066 | done: _original e5f0144b18 (+A3 trees below) |
| A3 | 026–030 | 4 | apostrophes 029.0027–0332, 030.0039–0429; star run 029.0216 «tambourin» | done: _original 7df5778edd; 021–030 trees cz 645ce2604d uk 97c4f6216a en 9ea19b543b fr fece8f704c |
| A4 | 031–037 | 5 | apostrophes 031–035, 037.0039; 032.0203 «c'es vie à nous»; Russian runs (B-02) | done: _original 9297e472e4; cz 60a9a265fc uk 0507823ce7 en 3ee08caf9a fr 87c60da30c |
| A5 | 038–044 | 5 | apostrophes 043–044; 038.0228 starred run; Russian runs 038/039 (B-02) | done: _original a546efc4d7; trees 1262bf8de1 |
| A6 | 050–051, 067–068 | 6, 9 | flyleaf + monks' letter; 067.0001 maxims; Gazette clipping 067.1569–1619 (A-36); Italian verse 068.1010 | done 830eba6a8c + trees 5e16c44655 |
| A7 | 070–071, 090, 099, 100 | 10, 14, 15 | race cards 070.0123/0125/0610–0613; cutting 070.0909; Florence programme 071.0226–0231; 090.0512; 099.0385; 100.0166 | done 17777b344c + trees 7b16e0f9ab |

Gate per package: splicescan + verify-carnet `_original` per carnet → commit `_original` (lead).

## Phase B — carry into the trees (cz, uk, en, fr)

Per package after its A commit: `just sync C L --footnotes` (+ `--notes-since 2026-10-23` where the tree carries
notes) → translator agent (Opus) applies the report's "Translation impact" list (==…== around the translated run +
the localized Russian footnote, changed words) → verify-carnet + splicescan per tree → commit per package.

## Owner decisions surfaced

(filled from the package reports)

## Log

## Follow-ups queued (after the B packages of 015–030 finish)

- Glossary: rename people/mentioned/VOCHA_DANILOVSKI → LIOCHA_DANILOVSKI (017.0429 reading «Liocha», A1), links in all trees; BARREME.md cites the OCR nickname «Inemployé» (019.0129 = «l'*employé*»).
- 020.0479: en marks it Russian, _original does not — check t.3 image (A1 may have missed the run).
- _original 019/1874-05-06 old LAN note on «Inemployé» superseded (delete/trim).
- 021.0032 LAN gloss «se retourner» wrong after «*Bouver et foumer*» (A2).
- 032.0204 LAN note («écrira» slip) based on OCR loss (A4).

## Log
- 2026-10-23/24 night: A6 830eba6a8c (+trees 5e16c44655), A7 17777b344c (+trees 7b16e0f9ab), A1 46a61a4241 (+cz 51ad7560e8, uk 9c0e5154cc, en f15c8f260a), A2 e5f0144b18, A3 7df5778edd, A4 9297e472e4.
- fr 015–020: 12 English source notes carried by --footnotes need French translation (016.0150, 017.0196, 018.0364, 019.0027/0077/0158/0182/0234, 020.0295/0349/0360/0480).
- Follow-ups: glossary LIOCHA rename + LAN fixes 466e6325a4; fr D-77 3bece1b948; C-34 tome 5 accents 2803078c21 (+ tree syncs bc9784e274, 1e947025cb); spot review 0/47 wrong, 4 small defects fixed 646c831230.
- Owner questions filed: OPEN-ITEMS A-65…A-71; source leftovers C-33 (022.0080 missing verse needs rebuild), C-35 (optional full page read).
- WAVE COMPLETE 2026-10-24 morning.
