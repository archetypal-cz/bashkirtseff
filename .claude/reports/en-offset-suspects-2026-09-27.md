# en "one marker off" suspects (2026-09-27)

Read-only scan. Nothing under `content/` was changed by it. Scan run after the 025/026 re-seat
commits, so those two are no longer listed.

## Method

Two detectors, run over every `content/en/CCC/*.md` against `content/_original/CCC`:

1. **English vs _original French** (`offset_detect.py`). For each cluster, score the English
   against the _original French of the same ID, the previous ID and the next ID: length ratio
   (log, EN ≈ 0.95 × FR) plus overlap of numbers and capitalised names. A run of 3+ clusters
   where a neighbour beats "same ID" by more than 0.25 is a suspect. This catches the 025/026
   pattern, where the embedded French is correct but the English sits a marker late.
   - Validated on the pre-fix 025/026 files: it flags 025 1874-11-06, 025 1874-11-07 and
     026 1874-11-20.
   - It misses 025 1874-11-02 because that run is made of very short paragraphs (under 25 chars
     are skipped). Short dialogue runs are a blind spot.
2. **Embedded French vs _original French** (`emb_detect.py`). A run of 2+ clusters where the
   embedded copy matches _original's previous or next ID (difflib ≥ 0.8) and not its own
   (< 0.6). This catches ID shifts where the English and its embedded French agree with each
   other but not with _original.

Scripts are in the session scratchpad (`idfix/offset_detect.py`, `idfix/emb_detect.py`).

## Suspects

| File | Detector | IDs | Verdict |
|---|---|---|---|
| `en/066/1876-09-25.md` | both | 066.0324–0363 (whole entry after the heading) | **Real, new.** en's IDs are one lower than _original's for the whole entry. _original has 0324 = heading only and 0325 = "Et lacryma et riou". en puts "Et lacryma" under 0324 with the heading, so en 0325 holds the French and English of _original 0326, and so on. en has 41 IDs vs 42 and lacks 066.0365. The embedded French travels with the English, so the text is internally consistent, but a rebuild would attach every paragraph to the wrong French. cz and fr are aligned. uk is aligned here but also lacks 066.0365 (separate gap). **Fix:** relabel en +1 from 0324 (split the heading from "Et lacryma") and check 0365. Not a refusal today, since there are no duplicate IDs. |
| `en/068/1877-01-02-06.md` | both | 068.0146–0148; also 0162–0167 (English only) | 068 is being handled separately (planner-068). Listed for them. |
| `en/082/1878-08-27`, `08-30`, `09-04`, `09-09` | embedded | 0160–0161, 0184–0185, 0223–0224, 0280–0281 | Already known (dedup in 8067b5aac; see rebuild-refusals report). Awaits owner decision. |
| `en/050/1875-12-02.md` | English | 050.0381–0383, 0391–0395 | **Not an ID offset.** The text is aligned; the English stanza numbers are one lower than the French (FR "19 Avec Saetone dinera" = EN "18\. With Saëtone shall dine"). The number heuristic flagged it. Worth a separate look: en renumbered the stanzas of this poem, which may or may not be deliberate. |

## Clean

Every other en carnet produced no run with either detector. Short-paragraph runs (dialogue,
under 25 chars) are not covered by detector 1. So a drift made only of one-line exchanges, like
025 1874-11-02, would still be missed.
