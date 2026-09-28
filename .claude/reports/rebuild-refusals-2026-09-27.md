# Why rebuild-carnet refuses carnets: diagnosis (2026-09-27)

This was a read-only diagnosis. Nothing under `content/` was edited. For each carnet I ran the identity plan
(`just rebuild-carnet-plan CCC` and then `just rebuild-carnet CCC plan.json` as a dry run).
Plans and outputs are in the session scratchpad, under `refused/CCC.{json,out}`.

The tool (`src/scripts/rebuild-carnet.ts`, around lines 146–160) refuses a carnet in two cases:
- the same `%% CCC.NNNN %%` ID appears twice anywhere in one tree;
- any line matches `[//]: # (NN.NNNN)`.

**No refusal is caused by French text missing from `_original`.** Every duplicated cluster translates or copies
text that `_original` already has. Where it mattered, I checked the manuscript docx
(tome10/11/15; 1882-08-01, 1878-03-28 and 1878-04-27 really are empty in the manuscript).

## Summary table

| Carnet | Tree(s) | Errors | Cause | Fix | Loses text? | Kind |
|---|---|---|---|---|---|---|
| 019 | fr | 1 | Identical copy-paste duplicate of 019.0390 (embedded French only) | Delete the second copy | No | mechanical |
| 023 | fr | 3 | Stray "FRE stub" ID lines (2026-02-14/15 FRE pass) glued to the previous cluster | Delete the stub ID line; move its FRE comment under the real cluster | No | mechanical |
| 025 | en | 3 | Drift. en split one French paragraph in two, so all later text sits one marker late. The last text is left under the next day's first ID | Re-seat the English text one marker up; delete the stray last marker | No | mechanical (careful) |
| 026 | en | 2 | Same drift, two splits (off by 2). Embedded French is also missing for 0018–0022 | Re-seat the text; restore the embedded French | No | mechanical (careful) |
| 029 | fr | 19 | FRE stub ID lines, as in 023. 1875-02-13 has a block of 5 stubs | Same as 023 | No | mechanical |
| 033 | fr | 1 | Identical duplicate of 033.0041 | Delete the second copy | No | mechanical |
| 060 | cz | 1 | Stray bare `%% 060.0207 %%` on the last line of the file | Delete the line | No | mechanical |
| 062 | en | 4 | The heading was given its own copy of the first paragraph's ID ("heading split") | Delete the second ID line and its repeated tag lines | No | mechanical |
| 070 | _original | 85 | Legacy tome-10 lines `[//]: # ( 10.802 )`…`( 10.886 )` inside the single cluster 070.0001 (the whole 3 April entry) | Minimal: replace the 84 separators with blank lines and delete the orphan `10.886` after the footnotes | No | mechanical + **decision** |
| 079 | uk | 2 | Empty-stub days (03-28, 04-27) carry the next day's first ID | Delete the ID line in each stub | No | mechanical (outside 082–097) |
| 085 | en | 89 | Heading split in 89 of 96 entry files | Delete the second ID line in each | No | mechanical (scriptable) |
| 091 | en | 4 | 1 heading split (0587); 3 cases where the heading kept the ID and the entry's first paragraph was labelled with the next ID (0557, 0576, 0583) | Delete the second ID line, which merges the paragraph into the heading's cluster | No | mechanical |
| 096 | cz, en | 1+1 | `096.0001` placed on the empty 1882-08-01 stub | Delete the ID line and leave the heading ID-less, as in _original/uk/fr | No | mechanical |
| 024 | en (warning only) | 0 | Letter 0043–0045 is in one cluster under stacked markers `0045/0044/0043`; 024.0418 is missing in en | Split into 3 clusters; translate 0418 | No | mechanical |
| 082 | en (warning only) | 0 | After dedup commit 8067b5aac, en IDs are one off from _original in 4 files, plus 20 harmless stacked empty markers | Relabel en, and choose which overlap copy to keep | No | **decision** |
| 095 | all (no error) | 0 | Not out of order: IDs 0001–0013 were retired when 04-27/04-29 moved to 094 (see README), so the carnet starts at 0014 | Leave it, or accept the −13 renumber | No | **decision** (uk: coordinate) |

## Per-carnet detail

### fr stubs and duplicates: 019, 023, 029, 033
- **019** `fr/019/1874-05-28.md`. 019.0390 is at lines 74 and 78, with identical embedded French. The first copy carries the tag line. **Fix:** delete lines 78–80.
- **033** `fr/033/1875-05-20.md`. 033.0041 is at lines 74 and 77, identical. **Fix:** delete lines 77–79.
- **023**. The first occurrence is a bare stub that sits right after the previous cluster's comments, with no blank line before it:
  - `1874-08-17.md:34`, followed by `FRE: "Wheelwright" — traduit du anglais`. The real 0115 is at line 37.
  - `1874-08-18.md:43` (0153) and `:97` (0166): bare stubs.
- **029** stubs, each listed as file:line of the stub, with the real cluster after the arrow:
  - 1875-01-24: 49→51, 114→116
  - 1875-01-30: 76→78
  - 1875-02-01: 77→79
  - 1875-02-05: 25→27
  - 1875-02-06: 40→42, 108→110
  - 1875-02-07: 26→28, 86→88, 116→119 (FRE "That is the question")
  - 1875-02-08: 36 (FRE "Nadinka") and 38 → 40 and 51
  - 1875-02-09: 109→112
  - 1875-02-11: 26→29
  - 1875-02-13: 28, 31, 34, 36, 38 (FRE notes on the Italian passage, plus a repeated Kernberger tag) → 41, 50, 63, 68, 74
- **Fix for 023 and 029:** delete each stub ID line and move its FRE comment into the real cluster with the same ID (drop the repeated tag). Nothing is lost. `fr` is an unedited embedded-only tree, so no visible text changes.

### en drift: 025, 026
These were found where the drift reaches the end of a file. The same pattern may exist elsewhere in en and go undetected, because it only becomes a duplicate ID when it runs past the last marker. **Fix:** move each English paragraph up to the marker whose embedded French it translates, and delete the stray last marker. Its Kernberger tag is already on the next day's cluster.

- **025 `1874-11-02.md`.** en split 0070 ("…Nous avons rencontré Audiffret, dit froidement ma tante") into two paragraphs, so the English for 0071–0078 sits one marker late. The English for 0078 ("Humiliating, stupid…") is under a stray `025.0079` at line 71.
- **025 `1874-11-06.md`.** The drift starts at 0134 ("driving himself, top hat…" is the end of 0133). The stray marker is `025.0151` at line 155.
- **025 `1874-11-07.md`.** The drift starts at 0155 ("The third pommel…" is the end of 0154). The stray marker is `025.0164` at line 79.
- **026 `1874-11-20.md`.** _original has 0018 (aversions + "plusieurs personnes"), 0019 ("— Trifon … dignité") and 0020. en splits these into 0018/0019 and 0020/0021, then puts 0020's text under 0022. The strays are `026.0021` at line 62 and `026.0022` at line 66.
  - **Fix:** merge the text into 0018, 0019 and 0020, and restore the missing embedded French for those three.
  - The `OPS: "their face"` note under 0019 belongs to 0018.

### Heading splits: 062, 085, 091
_original keeps a day's heading inside the first paragraph's cluster. In these en files the heading got its own copy of that ID, and the first paragraph repeats it along with the tag lines.
- **Fix:** delete the second ID line and its repeated tag lines.
- This can be scripted: when a file's first two clusters share an ID and the first holds only the heading, delete the second ID line.

- **062:** `1876-06-13.md:17`, `06-14.md:18`, `06-16.md:17`, `06-17.md:18`.
- **085:** 89 files, one error each; the other 7 entry files are clean. The IDs are 0001, 0024, 0027 … 0422 (full list in `refused/085.out`).
- **091:**
  - `1881-05-14.md:14`: a second `091.0587`.
  - `1881-05-10.md:14`: `091.0557` should be `0556`. In _original, 0556 = heading + "Je vais montrer mes photos…".
  - `1881-05-11.md:14`: `091.0576` should be `0575`.
  - `1881-05-12.md:13`: `091.0583` should be `0582`.
  - **Fix:** delete the misplaced ID line, which merges the paragraph into the heading cluster. Without this fix, a rebuild would attach the English of the first paragraph to the wrong French.

### Stray IDs on empty stubs: 060, 079, 096
- **cz/060/1876-05-13.md:898.** A bare `%% 060.0207 %%` is the last line of the file, and has been since the 056–064 translation (8f5c720b3). **Fix:** delete the line.
- **uk/079/1878-03-28.md:12** (`079.0144`) and **uk/079/1878-04-27.md:14** (`079.0566`). The stub days are empty in _original, cz, en and fr, and in the manuscript (tome11 ¶3001, ¶3574). **Fix:** delete both lines. 079 is not in the cloud session's range.
- **cz/096/1882-08-01.md:11** and **en/096/1882-08-01.md:10**. They put `096.0001` on the heading-only stub. _original, uk and fr have it ID-less, and the manuscript shows "Mardi 1er août 1882" with no text (tome15 ¶631). **Fix:** delete the ID line.
  - The identity plan carries the ID-less body. The uk and fr trees for 096 are otherwise clean; no coordination is needed because the fix is cz/en only.

### 070: legacy lines
- The whole 3 April 1877 entry (84 manuscript paragraphs) is one cluster, `070.0001`, in every tree.
- In _original, the paragraph breaks are old tome-10 separators, `[//]: # ( 10.802 )` through `( 10.885 )`, plus an orphan `( 10.886 )` after the footnotes (line 253).
- None of the translations contain legacy lines. en already marks sub-paragraphs with `%% 070.0001 (cont.) %%`, which the parser ignores.
- The text is complete: I compared it with tome10 ¶1058–1146, and the only differences are docx page-break fragments.
- **Minimal fix (unblocks the tool):** replace the 84 separator lines with blank lines so the paragraph breaks still render, and delete line 253. Nothing is lost.
- **Decision for the 070 rebuild plan:** should 0001 be split into about 85 real paragraphs (`set_french` on 0001 plus `new` paragraphs)?
  - The tool would then scaffold `TODO`s in cz/uk/en/fr and reset their flags, even though the translations already exist inside 0001.
  - So the split has to be followed by a manual re-segmentation of each translation. en's `(cont.)` markers make en easy; cz, uk and fr need to be checked.

### 024 and 082: en markers out of source order (warnings, not refusals)
- **024 `en/1874-09-18.md:73–75`.** Stacked markers `0045/0044/0043`, with the whole letter ("Monsieur de Gonzalès" / "Depuis deux jours…" / "Marie.") under 0043. A rebuild would leave 0044 and 0045 empty.
  - **Fix:** split the letter into three clusters that match _original.
  - Also missing in en: 024.0418 (1874-10-25) needs a translation.
- **082.** 20 stacked empty markers, e.g. `0118` directly above `0117`. They are harmless, and the rebuild sorts them. The real problem is the page-overlap dedup in 8067b5aac (2026-08-14), which kept a different copy in _original than en did:
  - `08-27`: en has 0160 = Bismarck and 0161 = "J'ai dit à maman". _original has them as 0159 and 0160, with 0161 empty. The LAN/RSR notes about Bismarck in _original are still on **0160**, so _original's own annotations moved one cluster off in the dedup.
  - `08-30`: en 0184/0185 correspond to _original 0183/0184.
  - `09-04`: en 0223/0224 correspond to _original 0222/0223.
  - `09-09`: the manuscript (tome12 ¶1261–1263) has "C'est triste … pareille !" / Antonsky / "C'est triste … pareille." en keeps the first copy (0273). _original keeps the second (0275), so _original shows the lines in a different order from the manuscript's first occurrence.
  - en is missing 0159, 0183, 0222 and 0279.
  - **Decision:** which copy is canonical. Then relabel en, and consider moving the LAN notes in _original. This is best done in an 082 rebuild plan that `drop`s the IDs the ED dedup emptied.
  - uk/082 matches _original (spot-checked 08-30).

### 095: not a defect
- IDs run 0014–0362 with no gaps across 93 files. 0001–0013 were retired when two entries moved to 094 (`_original/095/README.md:50`).
- The identity plan would renumber 349 IDs by −13. That means 313 file operations in all 5 trees and 7 glossary or fr-manifest files rewritten, with no flag resets.
- **Decision:** leave the gap (recommended, since nothing breaks), or renumber only if 095 needs a rebuild anyway.
- Any renumber touches uk/095, which is in the cloud session's range: **coordinate**.

## Counts
- Refusals diagnosed: 13 carnets, 216 errors.
- Mechanical and lossless: 11 carnets, with about 130 ID-line edits.
  - 019, 023, 029, 033 (fr); 060, 079, 096 (stubs and strays); 062, 085, 091 (heading splits).
  - 025 and 026 are also mechanical but need careful text re-seating, about 4 runs.
- Minimal mechanical fix plus an owner decision: 070 (whether to split into paragraphs).
- Warnings only, needing a decision: 082 (en re-alignment and which overlap copy to keep) and 095 (renumber or not).
- Warning only, mechanical: 024.
- Coordination with the uk cloud session: none of the refusal fixes touch uk 082–097. Only an optional 095 renumber would.
