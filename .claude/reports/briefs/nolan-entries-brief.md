# Brief — entries with no LAN note at all (originals round 2, 2026-10-21)

After the restored-paragraph wave, 120 entries (≥100 words, ~46k words) still carry no LAN note at all.
They were never part of a restoration, so the wave did not reach them. Lists: `nolan-g1.txt` (002–069),
`nolan-g2.txt` (071–092), `nolan-g3.txt` (096–105) in the session scratchpad named in your prompt (one
`CCC/date.md` path per line, relative to `content/_original/`).

## RSR (researcher, Opus)

Follow `.claude/reports/briefs/restored-rsr-brief.md` rules 1–8, applied to **whole entries** in your list:
read each entry; where research is thin or missing (identities, places, allusions, events), add RSR notes
and tags; check existing notes for errors (add `RSR: CORRECTION —` lines under wrong ones); fix wrong
tags; create glossary entries only under the ≥2-mentions rule. Use the name index of the matching tome in
`content/_raw/` and the scans in `content/_raw/scans/` (pymupdf text layer). Leave `entities:` alone.

## LAN (linguistic annotator, Sonnet)

Follow `.claude/reports/briefs/restored-lan-brief.md` rules 1–10, applied to **whole entries** in your list
(target 0.3–0.5 notes per paragraph over the entry; no gloss already given in the carnet). When every
non-empty entry of a file is annotated, set `workflow.linguistic_annotation_complete: true`.

## Both

One carnet at a time; gates per carnet (`just verify-carnet _original C` PASS, `just splicescan _original C`
empty). Touch only the files in your list (plus glossary files for RSR). Never use git
checkout/restore/stash/reset. No commits. Ledger lines: check the highest number right before adding.
