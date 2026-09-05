# `%%` marker rules — as implemented, where they disagree, what to do

Scan basis: 18,674 gated `.md` files under `content/{cz,uk,en,fr,es,_original}` (the
`check-comments` exclusion set), 2026-09-05.

## (a) The four rules

| # | Implementation | Opens a multi-line block when… | Closes on… | Odd `%%` count |
|---|---|---|---|---|
| 1 | `src/scripts/verify-carnet.ts:185-189` (pre-RED gate) | n/a — counts literal `%%` over the whole file | n/a | **FAIL** |
| 2 | `src/scripts/check_comment_structure.py:39-78` (`just check-comments`) | line starts with `%%`, does not end with `%%`, and is not a `%% c %% text` splice (`:55-65`); allowed only in `fr` (`:36`) | first line ending `%%` (`:46-48`) | tolerated |
| 3 | `src/shared/src/parser/comment-scanner.ts:63-157` + `src/scripts/harvest_footnotes.py:107-122` | exactly one `%%` on the line, nothing but whitespace before it | line ending `%%` (`:116-120`) | tolerated; wrapped line with inner markers = one comment + warning (`:92-100`) |
| 4 | `strip_annotation_spans()` — `epub_kernberger.py:84`, `docx_verify.py:67`, `censored_matching.py:399` | one `%%` on a line opens a block (`epub_kernberger.py:296-301`) | line ending `%%` | tolerated |
| F | Frontend `src/frontend/src/lib/content.ts` | line starts `%%`, does not end `%%`, **and does not start `%%` + digit** (`:769`) | line ending `%%` (`:777`) | tolerated |

Rules 2, 3, 4 and F agree except for the digit exclusion at `content.ts:769`.
Rule 1 is the outlier: nothing else in the stack cares about file parity.

## (b) Shapes where rules disagree, with counts

**S1 — line wrapped in `%%` with inner markers (odd count): 121 lines**
(cz 32, uk 1, en 9, fr 79). Rule 1 FAILs, rules 2/3/4/F accept. Subtypes:
French source with an appended role comment on the same line (~79, e.g.
`content/fr/011/1873-10-21.md:5`); French source with an inner glossary-tag span
(14, `content/cz/009/1873-09-21.md:80`); a role comment quoting a literal `%%`
(28, `content/cz/012/1873-11-13.md:40`).

**S2 — multi-line source blocks: 1,052, all in `fr`.** Rule 2 permits them only in
`fr`; rules 3/4/F permit them anywhere. 53 of them open with `%%` + a digit
(verse numbering, `content/fr/046/1875-10-06.md:8`) and are therefore **not**
blocks to the frontend, only to rules 2/3/4.

**S3 — `[//]:` retired comment inside an `fr` block: 156 lines**
(`content/fr/002/1873-02-18.md`). No rule flags it; the frontend promotes it.

**S4 — block opened by a glossary-tag line: 8 in `fr`** (`content/fr/081/1878-07-12.md:5`).
No rule flags it.

**S5 — bare prose line ending `%%`, no opener: 1,695** (fr 1,597, `_original` 98).
Rule 2 exempts `fr`/`_original` (`:72`); rules 3/4/F treat it as text with a
trailing marker. Rule 1 sees only parity.

**S6 — `%% comment %% trailing text` splice: 0 today.** Rule 2 FAILs it, rule 3
keeps the trailing text, the frontend drops the whole line. Kept clean by the gate.

Only 37 files (carnets cz 009, cz 011, en 025, en 067, en 101, fr 004, fr 055,
fr 081, `_original` 055) have odd parity. `just check-comments` passes on all
trees; `just verify-carnet cz 011 --quiet` FAILs today with 8 `%%-balance` errors.

## (c) What readers get today

Run of the real `content.ts` parser over every entry:

| Effect | Count | Example |
|---|---|---|
| `fr` paragraph text missing source sentences | 60 paragraphs | `fr` 009.0278 renders only the second sentence |
| Raw glossary markdown visible as prose | 8 `fr` + 8 `_original` | `fr` 081.0341 opens with `[#Soden](../../_original/…)` |
| `[//]: # (` visible as prose in `fr` | 76 paragraphs | `fr` 002.0024, `fr` 022.0354 |
| Role comment leaked into the French-original panel | cz 21, en 2, uk 1 | cz 011.0152 ends with the LAN note |
| Source sentence missing from that panel | cz 5, en 2 | cz 009/1873-09-21 |
| Annotation rendered as diary prose | `_original` 055.0509 | "Marie's onomatopoeia imitating a fly…" |

A literal `%%` in a role comment is never shown: the line starts with `%%`, so
`isCommentLine` (`content.ts:656`) drops it. The 53 digit-openers render their
verse; only the number line is lost.

## (d) Recommendation

**Unify on rule 3** (marker-count-per-line). It is the only rule that matches
what the frontend does and the only one that tolerates a quoted `%%`. Do not
adopt an escape convention and do not reword the 28 comments; they are harmless.

Migration order, loosen before tightening so no gate blocks in-flight work:

1. Replace `verify-carnet.ts:185-189` with the per-line shapes of rule 3 (splice,
   unclosed-at-EOF, closer-without-opener outside `fr`/`_original`). This
   unblocks cz 009/011 and en 025/067/101 immediately.
2. Fix the four reader-visible content families: split S1 lines into separate
   lines (121), move the 156 `[//]:` lines out of `fr` blocks (as
   `content/fr/081/1878-07-12.md:14` already records doing), close the 8 S4 tag
   lines with their own `%%`, and repair `_original/055/1876-03-11.md:82`.
3. Only then add those families to `check_comment_structure.py` as FAILs.
4. Fix the frontend independently: drop the digit exclusion at `content.ts:769`,
   and strip inner comment spans in `isFrenchOriginal` (`:720-733`) so a French
   line carrying a trailing note is still promoted.

## (e) Risks

Step 1 removes the only check that catches a genuinely unterminated block in a
non-`fr` tree, so step 3 must follow in the same wave. Step 2 edits 285 content
lines across five trees and will produce large diffs during a translation wave;
do it per carnet, behind `just check-comments`. Step 4 changes rendering for
1,052 `fr` blocks; verify a sample of promoted paragraphs before deploying.
The `_original` and `fr` exemptions at `check_comment_structure.py:72` hide
1,695 lines from every gate — narrowing that is a separate, larger cleanup.
