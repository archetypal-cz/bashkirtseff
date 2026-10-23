# Work plan — sharp page images (started 2026-10-23 evening, owner asleep)

Owner (KRR, 2026-10-23): «start verifying and refining the originals — run Sonnet/Opus subagents to check and
fix the original, then carry it into the translations with further agents, add tags and research where needed.»

Source: ABBYY page images from arrdata (see `content/_raw/scans/hires/`, tools in `hires/_tools/`):
tomes 3–5 complete + 18 single pages of tomes 6/9/10/14/15 (the scan wishlist, `scan-wishlist-2026-10-23.md`).

## Phase A — `_original` against the images (Opus, brief `hires-2026-10-23/BRIEF-A.md`)

| Pkg | Carnets | Tome | Items | Status |
|---|---|---|---|---|
| A1 | 015–020 | 3 | apostrophes 018–019, Russian stars (B-57: 017.0015, 018.0128–0294, 020.0280/0286), 020.0194 margin note | |
| A2 | 021–025 | 4 | Russian stars (021.0257/0417, 023.0227/0228, Walitsky verses 023.0218/0220), apostrophes 023.0453–0549, 025.0066 | |
| A3 | 026–030 | 4 | apostrophes 029.0027–0332, 030.0039–0429; star run 029.0216 «tambourin» | |
| A4 | 031–037 | 5 | apostrophes 031–035, 037.0039; 032.0203 «c'es vie à nous»; Russian runs (B-02) | |
| A5 | 038–044 | 5 | apostrophes 043–044; 038.0228 starred run; Russian runs 038/039 (B-02) | |
| A6 | 050–051, 067–068 | 6, 9 | flyleaf + monks' letter; 067.0001 maxims; Gazette clipping 067.1569–1619 (A-36); Italian verse 068.1010 | |
| A7 | 070–071, 090, 099, 100 | 10, 14, 15 | race cards 070.0123/0125/0610–0613; cutting 070.0909; Florence programme 071.0226–0231; 090.0512; 099.0385; 100.0166 | |

Gate per package: splicescan + verify-carnet `_original` per carnet → commit `_original` (lead).

## Phase B — carry into the trees (cz, uk, en, fr)

Per package after its A commit: `just sync C L --footnotes` (+ `--notes-since 2026-10-23` where the tree carries
notes) → translator agent (Opus) applies the report's "Translation impact" list (==…== around the translated run +
the localized Russian footnote, changed words) → verify-carnet + splicescan per tree → commit per package.

## Owner decisions surfaced

(filled from the package reports)

## Log
