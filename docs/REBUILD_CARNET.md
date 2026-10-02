# Rebuilding and renumbering a carnet

Paragraph IDs (`%% CCC.NNNN %%`) are stable. Agents never renumber them by hand.
The one exception is a **carnet rebuild**, decided by the owner (KRR, 2026-09-27)
for carnets whose `_original` has missing manuscript paragraphs or paragraphs
filed under the wrong day. A rebuild:

1. puts every paragraph into its correct date file, in manuscript order;
2. inserts the missing French paragraphs;
3. renumbers the whole carnet `CCC.0001..N` in reading order, in `_original`
   and in every translation tree that has the carnet (`cz uk en fr es`);
4. rewrites every reference to the old IDs and entry files in the repo;
5. commits a map (`content/_renumber/CCC-<date>.json`), an SQL remap for reader
   reports and redirects for the entry URLs that moved.

What goes where is decided by whoever writes the **plan**. The tool only applies it:
`src/scripts/rebuild-carnet.ts` (logic in `src/scripts/lib/rebuild-carnet-core.ts`).

## Commands

```bash
just rebuild-carnet-plan 068 > plan.json   # the current layout as a plan: start from this
just rebuild-carnet 068 plan.json          # dry run: validation, id map, per-tree changes, refs
just rebuild-carnet 068 plan.json --emit /tmp/x   # also write the would-be files under /tmp/x
just rebuild-carnet 068 plan.json --write  # apply, write the map/SQL/redirects, run the check
just renumber-check 068                    # post-apply verifier (also run by --write)
just rebuild-carnets p065.json p066.json [--write]   # several carnets in one run (see Multi-carnet runs)
just test-rebuild-carnet                   # fixture tests
```

After `--write`, for `_original` and every tree: `just verify-carnet LANG 068`
(PASS) and `just splicescan LANG 068` (empty). Then commit the carnet trees,
the rewritten reference files, and `content/_renumber/` together.

The identity plan is a zero diff on 89 of 106 carnets (sweep of 2026-09-27;
082 and 101 now also renumber, because a bare-date file and its `-evening`
sibling were numbered in the other order — see Entry order).

## Drafting a plan

`just rebuild-draft-plan CCC [CCC…]` drafts the plans and a `REVIEW.md`
(default output `.cache/rebuild-drafts/<carnets>/`, gitignored; `--out DIR`).
Code: `src/scripts/rebuild-plan/` (`draft.py`, `common.py`, `scanlib.py`,
`diffplan.py`; `just test-rebuild-plan`). It automates the method used by hand
for 068:

1. **Segment** the tome docx (`content/_raw/tomeNN.docx`, python-docx
   paragraph index = "docx ¶") by `Livre NN` headings and French date lines
   (weekday optional, OCR-split digits such as «1 3 janvier» and «1 877»
   repaired, Julian second dates kept in the heading). The short lines around a
   `Livre` heading become the carnet's **cover entry** (`kind: cover`). A Livre
   number that occurs twice leaves the stretch between the two to `_original`.
2. **Align** docx paragraphs with `_original` clusters: word-4-gram
   containment for long paragraphs (a docx paragraph that holds a whole cluster
   and more marks a cut-short cluster), then a windowed fuzzy match for short
   ones; a short match under a day where the cluster has no long match is
   rejected; a cluster matched far from its main place (a repeated sentence)
   keeps its main place.
3. **Place**: each old cluster goes to the entry of its first matched docx
   paragraph (unmatched ones follow their predecessor; a heading-only cluster
   goes to its date); unmatched docx text becomes `new` paragraphs, one per
   manuscript paragraph, OCR line breaks rejoined, verse lines kept, italic runs
   as `*…*`, each with an RSR note citing docx ¶ and — when
   `content/_raw/scans/TomeN.pdf` exists — «Mon Journal t.N p.X» from the
   page map. Days with a date line and no text get «[Aucun texte - date seule
   mentionnée]». Empty placeholder clusters are dropped, except those carrying
   notes (an RSR entry summary, LAN, a verdict) or text in a translation:
   they are kept after their predecessor. ID-less old files (no paragraph
   IDs) are listed in `drop_files` (give the entry `body_from` to keep one).
4. **Guess**: `set_french` completions for clusters cut short, `heading_to_next`
   for clusters ending with the next day's heading, kinds from markers
   (`[En travers…]`/`[En marge…]` margin, `[Rayé…]` rayé, notes about the
   manuscript editorial — «[3 lignes cancellées]», a note that text was struck
   without the text, is editorial, not rayé — a quoted salutation standing on
   its own line opening a copied letter («— Monsieur, vous …» is dialogue) — the
   letter's clusters get `kind: letter` and `> `-quoted French — text set in a
   different docx style or under a capitals title as clipping), and from the
   **typography of the printed edition** when the scan exists
   (`scanlib.typography`): the scan's text lines are attributed to docx
   paragraphs by aligning the two word streams, and a paragraph whose wrapped
   lines are set in from *both* margins (13–40 pt; quoted letters and clippings
   sit ~20 pt in) is quoted material, one whose lines lie inside an ABBYY
   picture region is a pasted facsimile (programme, race card, clipping), and
   docx `Picture caption` paragraphs are the text of such facsimiles (they are
   no longer discarded as furniture). New paragraphs get the kind; old ones
   are only listed as candidates. Every guess carries a `kind_guess_reason`
   (`_kind_guess_reason` on the plan paragraph, ignored by the tool, and the
   same text in REVIEW.md), cross-carnet
   placement when the Livre boundary disagrees with `_original` (the partner
   carnet's plan is emitted too), `redirect_from` for old range files whose
   start date survives as an entry.
5. **REVIEW.md** lists everything that needs judgement: cross-carnet moves,
   clusters spanning days (splits), completions, old text not found in the
   docx, uncertain alignments, kind guesses, cover lines, date-line
   inferences, empty days, OCR oddities, and drawings / figure candidates (docx
   pictures, empty picture slots, and pages where the scan has ink outside the
   text layer).

Validation on 068 (draft from the pre-rebuild state against planner-068's
final plan, `just rebuild-diff-plan`): the same 75 entries, 651 vs 650 old
paragraphs placed (the planner also dropped the empty 068.0271), old
paragraphs in the same order except 2, 642 of ~655 new texts identical
(15,694 of 15,800 new words shared), the 16 letter paragraphs and the 2
completions found. With the typography signal the two *Le Sport*
clippings (¶4293, ¶4349) are found; the other flags in 068 are the anonymous
letter ¶4228 and two old letter-quoting paragraphs (0246, 0250, candidates
only). In tome 10 it finds the concert programme (printed pp.43–45) and the
race cards (pp.79–80). What stays manual: splits (0046, 0238), OCR fixes in new
text, «En travers:» labels the extraction dropped, the stanza grouping of
verse, sources for letters and clippings. The draft passes `rebuild-carnet`
and, applied in a throwaway worktree, `renumber-check`, `verify-carnet` and
`splicescan` for all five trees.

### Drafter limits (fix by hand in the plan)

Fixed 2026-09-29: date lines «août1873» (no space) and «Mercredi 26, jeudi 27
novembre 1873» (two days, the first opens the entry); long «Carnet N° 3 Mon
journal commencé le …» title lines (Livre 3 and 7 of tome 1); spurious
completions where `_original` splits one docx paragraph over several
clusters; note-carrying empty clusters dropped; salutation-in-dialogue
letters; «[N lignes cancellées]» as rayé; a cover entry dated after an entry
Marie back-dated at the end of the notebook (002 «Lundi 2 février»); ID-less
stubs missing from `drop_files`. `livre_number` already reads «Gloriae…\n[Livre]
101» and «[Cahier n°] 102» (tomes 11, 16). Still manual:

- A repeated margin note (the same «[Dans la marge: …]» in two notebooks)
  aligns with the wrong copy and proposes a cross-carnet move (006.0089 →
  005): reject moves whose only evidence is a short repeated line.
- Cover entries can swallow short itinerary lines next to the `Livre`
  heading, and a date line inferred from them (tome 8 ¶3605): check the
  «Cover entries» and «Date lines» sections.
- The stream tiler (`streamtile.py`, a planner helper outside the repo that
  completes cut-short clusters from the docx token stream) is not part of the
  drafter; it carries OCR line-break hyphen fragments («…- vitch.») into the
  text. Check every tiled completion for them.
- Double date lines keep only the first day's date in the heading; add the
  second day to `heading` by hand if the entry should show both.

Related: `just source-completeness [CCC…]` (every tome paragraph against
`_original`, report in `.claude/reports/` — a same-day rerun overwrites it,
`--keep` writes `<date>-2.md` — code `src/scripts/completeness/`),
`just scan-pagemap N`, `just scan-figures N`, `just scan-figure-keywords`,
`just scan-survey` (`src/scripts/scans/`).

## Multi-carnet runs

When paragraphs sit in the wrong carnet (a Livre boundary misplaced in
extraction, clippings filed in a neighbouring notebook), rebuild the carnets
involved together: `just rebuild-carnets plan-065.json plan-066.json …`
(one ordinary plan per carnet; single-carnet mode is unchanged).

- A plan places another carnet's paragraph with a plain `{"old": "065.0412"}`
  wherever it belongs in reading order. The source carnet's plan simply does
  not list it. Every carnet whose paragraph moves must have a plan in the run.
- Validation covers the whole set: every old ID of every carnet in the run is
  placed or dropped exactly once across all plans; a carnet can drop only its
  own paragraphs; the usual per-carnet checks apply to each plan.
- The whole cluster moves in every tree (tags, notes, embedded French,
  translation, footnote definitions it uses — copied, so the source keeps any
  it still needs; a copy that lands beside its original, because the cluster
  holding the definition moved too, is dropped, and the source's copy goes
  when nothing left there uses it). Entry-level notes stay with the source entry. Translation
  flags reset on both sides, except for an entry that arrives whole and
  unchanged (it keeps its flags; frontmatter `carnet:` is updated).
- All carnets are renumbered and all references rewritten in **one pass**, so
  `065.0412 → 066.0123` is never mapped again by 066's own renumbering.
  Old entry files whose paragraphs all left for another carnet redirect there.
- Outputs: one `CCC-<date>.json` per carnet (its `id_map` covers every old ID
  of that carnet, with `moved_out` / `moved_in`), **one** SQL file for the run
  (`065+066-<date>.sql` — separate files would chain), and the redirects.
- Internally the moved clusters sit in the target carnet as pseudo-files named
  `<source carnet>/<source file>` while the single-carnet machinery runs; ED
  comments name them «`<file>` of carnet `<source carnet>`» (older notes say
  `CCC/<file>`; `renumber-check` does not read either as a link).

## Entry order

Paragraph IDs run in the order the site reads a carnet's entries
(`compareEntryIds` in `src/frontend/src/lib/content.ts`, `entryOrder` in the
tool): by date; on the same date the cover entry first, then plain string order
of the name without `.md` (`1878-10-04`, `1878-10-04-05`, `1878-10-04-evening`).
The plan must list entries in that order. A **cover entry** holds what Marie
wrote on the notebook's cover or front pages: it is named
`<date of the carnet's first dated entry>-cover.md`, dated like that entry,
comes first in the plan, and its paragraphs carry `kind: cover`. Navigation,
carnet listings and year pages place it before the first dated entry, and it is
labelled "Couverture du carnet" / "Notebook cover" instead of a date.
The tool refuses carnets with duplicate IDs in any tree or legacy
`[//]: # (NN.NNNN)` ID lines; fix those first.

## Plan format

```jsonc
{
  "carnet": "CCC",                  // required, 3 digits
  "source": "tome09.docx",          // optional, quoted in ED comments
  "drop": [                         // optional: existing IDs removed on purpose
    { "id": "CCC.0240", "reason": "duplicate of CCC.0239 (extraction artefact)" }
  ],
  "drop_files": [                   // optional: ID-less old entry files not carried over
    { "file": "1877-01-03.md", "reason": "empty stub for a day Marie did not write" }
  ],
  "entries": [                      // reading order = new numbering order
    {
      "file": "1877-01-19.md",      // new entry file; must start with "date"
      "date": "1877-01-19",
      "heading": "Vendredi 19 janvier 1877",   // optional, see Headings
      "frontmatter_from": "1877-01-10-18.md",  // optional, see Frontmatter
      "redirect_from": ["1877-01-10-18.md"],   // optional: old entry URLs that redirect here
      "paragraphs": [
        { "old": "CCC.0261" },
        { "old": "CCC.0262", "set_french": "Only the first half of the old text." },
        { "old": "CCC.0263", "kind": "letter", "source": "Lettre de Multedo, 22 juillet 1876" },
        { "old": "CCC.0264", "heading_to_next": true },
        { "new": {
            "kind": "clipping", "source": "Le Figaro, 19 janvier 1877",
            "french": "Hier soir, à l'Opéra…\nSecond line of the cutting.",
            "rsr": "Clipping pasted on f. 34; tome09.docx ¶3874.",
            "tags": ["[#Le_Figaro](../_glossary/culture/newspapers/LE_FIGARO.md)"]
        } },
        { "new": {
            "french": "Exact French text.\nA second line of the same paragraph.",
            "rsr": "Missing in the transcription; tome09.docx ¶3871 (Livre 68, «Vendredi 19 janvier»).",
            "tags": ["[#Rome](../_glossary/places/cities/ROME.md)"]
        } }
      ]
    },
    { "file": "1877-01-20.md", "date": "1877-01-20", "body_from": "1877-01-20.md", "paragraphs": [] }
  ]
}
```

Validation fails loudly (nothing is written) unless:

- every ID in `_original/CCC` appears exactly once in `entries`, or in `drop` with a reason;
- no unknown IDs; no file listed twice; each `file` starts with its `date`;
- every old entry file without any paragraph ID (`empty_in_source` stubs) is
  carried with `body_from` or listed in `drop_files`;
- new paragraphs have French text and an `rsr` note, and nothing contains the comment marker;
- `kind` is one of `clipping letter rayé margin cover editorial other`, and `source` is one line without a double quote;
- entries are listed in file-name order (the reading order below), and a cover entry comes first;
- each `redirect_from` names an old `_original` file that is no longer an entry, once.
- no translation tree holds an ID that `_original` lacks, and no tree has duplicate IDs.

Dates going backwards between entries only warn (plan order is reading order).
Keys starting with `_` (such as `_first_line` in a generated plan) are ignored.

## What moves

A **cluster** is an ID line and every line after it up to the next ID line:
tag lines, role comments, the text (or embedded French + translation), footnote
definitions. The lines between the frontmatter and a file's first ID belong to
its first cluster. Clusters move as units; lines are not reparsed, so a cluster
that does not move is written back byte for byte.

- **IDs** are rewritten by the reference rewriter (below), including the ID line itself.
- **Footnotes.** A definition moves with its cluster. If the definition sits in
  one cluster and every cluster referring to it lands in another entry, the
  definition moves to the referring cluster. Labels that collide inside a new
  file get a `b` suffix. Labels that embed a paragraph number
  (`[^CCC.126.1]`, `[^CCC.0126.1]`, and for 068 also `[^68.03.1]`) are renumbered.
- **Entry-level notes** (the trailing comments of a file that a blank line
  separates from the last paragraph, e.g. a `CON: APPROVED` verdict, and a
  legacy `[//]: # (… RSR …)` entry summary) stay with the entry: they go to the
  end of the new file that holds the old entry's first paragraph.
- **New paragraphs.** `_original`: ID, tags, `RSR:` comment (timestamped now),
  French. IDs the plan's `rsr` text cites are **old** IDs: they are renumbered
  like every other reference. Translation trees: the `just scaffold` shape — ID, embedded French
  (`%% … %%` per line), tags localised to `../../_original/_glossary/`, the RSR
  note, then `TODO` (and `# TODO` for a heading line). The fr edition gets no
  `TODO`: it gets the French verbatim if its carnet already shows visible text,
  otherwise only the embedded copy (the state of an unedited fr carnet).
- **Splits** (`set_french` on an `old` paragraph): `set_french` is the
  paragraph's whole French, `#` heading lines included — a heading the new
  text leaves out is removed (with a warning), one it repeats is not doubled.
  `_original` gets the new text in place of the old text and heading lines; each translation's embedded French copy
  is replaced as a whole: every embedded French line of the cluster (heading
  copies are embedded without `#`) goes, and the new copy takes the first one's
  place — never appended beside a stale copy; a fr multi-line `%%` block holding
  the French is replaced by per-line copies. An
  `ED: … SOURCE CHANGED` comment tells the translator that the visible
  translation still renders the old text (not in a fr scaffold cluster, which
  renders nothing). When `set_french` changes only the heading marking (same
  words: a plain date line becomes the entry heading, or back), the
  translation's matching line becomes a heading (or a plain line) too, no
  `SOURCE CHANGED` is written, and the plan's `heading` is not added a second
  time; if the lines cannot be matched one to one, an ED note asks for it. Put the cut-off half into a `new`
  paragraph. A footnote marker dropped by `set_french` is warned about; move its
  definition by hand.
- **Paragraphs a translation tree lacks** are reported and stay missing.
  A partial tree (one without every source entry) only gets the entries it
  already has paragraphs for.

- **`heading_to_next`** (on an `old` paragraph whose French ends with a date
  heading — an extraction artefact that glued the next day's heading onto the
  previous paragraph): the trailing heading moves to the start of the next
  paragraph of the plan, in every tree — in translations the translated
  heading together with its embedded French. Validation refuses the flag on a
  paragraph that does not end with a heading; a tree whose next paragraph
  already opens with a heading keeps its own where it is (warning).
- **`redirect_from`** on an entry makes those old entry files' URLs (and
  links to them) point to this entry instead of the entry that received their
  first paragraph.
- **Kinds** (see Paragraph kinds below). A `new` paragraph with `kind` gets the
  marker line under its ID in every tree; for `clipping` and `letter` each French
  line is quoted (`> `), and a clipping always gets the `[#Press_clipping]` tag
  (add the newspaper's own tag in `tags`). Translations get the quoted French as
  embedded copy and a plain `TODO`. `kind` on an `old` paragraph sets or
  replaces its marker in every tree without touching text or approval flags
  (quote its French with `set_french` if it should become a blockquote).

## Headings

Date headings (`# Lundi 1er janvier 1877`) live inside a cluster, so they
travel with their paragraph. A file that covers several days keeps a heading
per day in the middle. `heading` in the plan is used only when the entry's
first paragraph has none: `_original` gets `# heading` before its first text
line; a translation gets the embedded `%% heading %%` plus `# TODO` (unless it
already shows a heading of its own). The dry run warns about every `_original`
entry whose first paragraph has no heading.

## Frontmatter

- `_original`: based on `frontmatter_from`, else the old file that contributed
  the first paragraph, else the old file of the same name, else a fresh block.
  `date`, `para_start`, `para_end` are set; `entry_id` follows the base file's
  convention (basename or date; anything else is left). An entry that gained
  new or replaced French gets `linguistic_annotation_complete: false`.
- Translations: based on the old file of the same tree that contributed the
  most paragraphs (first wins a tie). `date`, `entry_id` (same rule) and
  `para_start`/`para_end` (only where present) are updated.

### Approval-flag reset rule

An entry keeps its flags only if its paragraph list is **exactly** the list of
one old `_original` entry (same IDs, same order), with no new paragraph, no
`set_french` and no inserted heading — a pure rename or renumber. Otherwise, in
every translation tree, `translation_complete`, `opus_reviewed`,
`editor_approved`, `conductor_approved`, `edition_complete`, `review_complete`
are set to `false` wherever they appear (nested under `workflow:` too),
`translation_complete` (fr: `edition_complete`) is added if missing, `status`
becomes `translation_pending`, and an `ED:` comment at the end of the file
says which old entries the paragraphs came from and what changed. Scores
(`quality_score`, `con_score`) and `redaction_passes` are left as history.

### Multi-paragraph split wave (2026-10-02, owner-approved)

Some IDs hold several printed paragraphs. The split wave gives each printed
paragraph its own ID, one tome at a time, with ordinary rebuild runs (the
carnet is renumbered once per run). Rules:

- **Only confirmed split points.** A point is used when the survey found it in
  the docx paragraph breaks and the scan indentation; points that coincide with
  a scan page flush, unsure points and MIXED clusters are left for later.
  Letters and clippings are not split.
- **Plan.** The head keeps its ID with `set_french` = its headings + the first
  piece; every further piece is a `new` paragraph whose RSR note reads
  «Split (paragraph wave): print paragraph k of n of CCC.NNNN …». Line breaks
  inside the cluster are kept.
- **Translations.** If a tree's translation of the head has exactly as many
  text lines as the French pieces together, its lines are distributed over the
  pieces unchanged, the tool's `SOURCE CHANGED` note becomes an `ED: paragraph
  split into …` note, and the approval flags are restored from HEAD when no
  `TODO` is left in the file. Otherwise the tree keeps `TODO` + `SOURCE
  CHANGED` and the reset flags, and the language driver redistributes or
  translates the pieces.
- **Footnotes.** Labels in split pieces are renamed to the relabelled
  definitions using the run's map (`content/_renumber/CCC-<date>[-2].json` —
  only the map that run wrote).
- **Comment-only IDs** (old RSR entry summaries without visible text, 001–044
  and 072) are folded in the same run as their carnet's splits: the ID is
  dropped and its RSR comment(s) and tags move to the entry's last real
  paragraph in every tree. Where nothing else in the entry changed, the
  approval flags are restored from HEAD and the tool's flags-reset note is
  removed. The moved tags are listed per carnet for the tag audit, which
  redistributes them.

Plans, the per-tome record and the gates are in
`content/_renumber/split-wave/`.

## References rewritten

One regex pass per file with a callback, so a value that was just rewritten is
never matched again (0005→0006→0007 cannot chain). For this carnet only:

| Form | Example | Becomes |
|------|---------|---------|
| ID token | `CCC.0123` (ID lines, comments, glossary citations, code) | new ID |
| Anchor | `#p-CCC-0123` | new anchor |
| Path + anchor | `/cz/CCC/1877-01-10-18/#p-CCC-0240`, `CCC/X.md#p-CCC-…` | file that now holds the paragraph + new anchor |
| Entry path | `/cz/CCC/1877-01-10-18`, `../CCC/1877-01-10-18.md` | file that received the old entry's first paragraph (only for files that no longer exist) |
| Footnote label (carnet files only) | `[^CCC.126.1]`, `[^68.03.1]` | renumbered label |

Dropped IDs become `CCC.DROPPED-0123` / `#p-CCC-DROPPED-0123`, so nothing points
at a wrong paragraph; `renumber-check` lists them.

A carnet README's `**Paragraph range**: CCC.0001-CCC.NNNN` line is set to the
new range (a stale range used to fail the write's own `renumber-check`).

Scope: text files (`.md .json .yaml .txt .csv`) under `content/` only, minus
`content/_raw`, `content/_renumber` and every `CLAUDE.md`. Code, `docs/`,
skills, `.claude/reports` and root notes cite IDs as examples or history and
are never rewritten (a first real run rewrote examples in this tool, i18n and
two docs). Inside `content/`, keep a citation as it is with a pragma: a line
containing `rebuild-carnet: keep` (e.g. in an HTML comment) is left alone, and
a file containing `rebuild-carnet: keep-file` is skipped entirely;
`renumber-check` skips them too.
Not handled: bare numbers without the carnet (`¶ 0123`), range ends
(`CCC.0121–0125` rewrites only the first ID), 2-digit carnet IDs outside
footnote labels (`68.0123` for carnet 068).

## Outputs (`content/_renumber/`, committed)

- `CCC-<date>.json` — `id_map` (every old ID → new), `new_paragraphs`,
  `dropped`, `file_map` (renamed entries), `files_removed`, `files_added`,
  `flag_resets` per tree, and the full plan.
- `CCC-<date>.sql` — one `UPDATE paragraph_reports … FROM` a temp mapping table
  in a transaction. `paragraph_reports` is the only table keyed by paragraph ID
  (`src/auth/init.sql`); run it on the auth database after deploying.
  Reading history and bookmarks live in readers' localStorage and are not remapped.
- `redirects.json` — cumulative old-URL → new-URL map for every language
  segment (`original cz uk en fr es`), read by `src/frontend/astro.config.mjs`
  into its `redirects`. Later rebuilds re-point chains; a source that is a real
  page again is removed. A removed entry whose paragraphs were all dropped
  redirects to the carnet index. Anchors cannot be redirected (the fragment
  never reaches the server).

## Post-apply check (`just renumber-check CCC`)

(a) `_original` IDs run `CCC.0001..N` in file-name order, `para_start` /
`para_end` match, frontmatter dates match file names; (b) every translation
tree has the same ID sequence per file (missing files only warn: partial
trees); (c) no ID token beyond N, no link to an entry file a rebuild removed,
no path+anchor pointing at a file that does not hold the paragraph; (d) every
translation cluster's embedded French equals `_original`'s French for the same
ID, compared loosely (markers, `#`, `> `, footnote refs, quotes, case, spacing;
a missing heading copy is fine): an embedded copy that holds the current French
plus more (a stale or duplicated copy) FAILs, any other difference is a WARN
per tree with the IDs (`just sync CCC LANG` refreshes exactly those copies,
fr multi-line blocks included).

## Paragraph kinds

Owner decision (KRR, 2026-09-27): `_original` holds everything Marie put in her
notebooks, not only her diary prose: pasted newspaper clippings and printed
matter, letters she copied or pinned in, struck-out passages, marginal notes.
Each such piece is a paragraph of its own, marked by one line directly under
its ID, **identical in `_original` and every translation tree**:

```markdown
%% 068.0456 %%
%% kind: clipping source="Le Figaro, 12 février 1877" %%
%% [#Le_Figaro](../_glossary/culture/newspapers/LE_FIGARO.md) %%
%% [#Press_clipping](../_glossary/culture/newspapers/PRESS_CLIPPING.md) %%
%% 2026-09-27T10:00:00 RSR: Clipping pasted on f. 34; tome09.docx ¶3874. %%
> Hier soir, à l'Opéra, on remarquait dans la loge de Mme Bashkirtseff…
> …
```

and in a translation:

```markdown
%% 068.0456 %%
%% kind: clipping source="Le Figaro, 12 février 1877" %%
%% > Hier soir, à l'Opéra, on remarquait dans la loge de Mme Bashkirtseff… %%
%% [#Le_Figaro](../../_original/_glossary/culture/newspapers/LE_FIGARO.md) %%
%% [#Press_clipping](../../_original/_glossary/culture/newspapers/PRESS_CLIPPING.md) %%
> Včera večer v Opeře bylo v lóži paní Baškirtsevové lze spatřit…
```

| Kind | What | Text |
|------|------|------|
| `clipping` | pasted newspaper cutting, printed matter | `> ` quoted; tagged `[#Press_clipping]` plus the newspaper's entry when it has one (`culture/newspapers/`) |
| `letter` | letter copied or pinned into the notebook | `> ` quoted; tag the writer as usual |
| `rayé` | a whole paragraph Marie struck out | plain text. Words struck **inside** a paragraph keep the established inline form `[Rayé: …]` (≈1,600 occurrences), unchanged |
| `margin` | marginal text | plain text |
| `cover` | text on the notebook's cover or front pages; only in the carnet's cover entry | plain text, often with a heading |
| `editorial` | a bracketed note by the edition's editors about the physical manuscript, e.g. `[Marie est passée de la page 184 à 185…]` | plain text, brackets kept; rendered small and muted, label for screen readers only |
| `other` | any other inserted item (card, menu, pressed flower note…) | plain text; say what it is in `source` |

- Syntax: `%% kind: <kind> %%` or `%% kind: <kind> source="<free text>" %%`, alone
  on its line, right after the ID line. `source` has no double quote; the
  newspaper and date for a clipping, the writer and date for a letter. `raye`
  is accepted for `rayé`. Regex: `KIND_CONTENT_PATTERN` in
  `src/shared/src/parser/patterns.ts` (the frontend mirror is
  `src/frontend/src/lib/paragraph-kind.ts`).
- The marker is metadata: the shared parser (`Paragraph.kind`, `kindSource`), the
  frontend and `resync-french` never take it for embedded French or a note;
  `just sync` / `just scaffold` copy it from `_original` into translations and
  keep it directly under the ID; `tag-sync` inserts tags below it. It is a normal
  one-line comment for `verify-carnet`, `splicescan` and `check-comments`.
- Translations keep the `> ` quoting on their visible text. The embedded French
  copy keeps it too (`%% > … %%`).
- Page: clippings render as a narrow ruled newsprint slip, letters as an
  indented quotation, rayé paragraphs crossed out, margin notes set off to the
  side; each opens with a small label in the reading language ("Coupure de
  presse · Le Figaro, 12 février 1877"). Styles: `src/frontend/src/styles/global.css`
  (`.para-kind-*`), labels `paragraph.kind.*` in the locale files.

## Drawings

Drawings Marie made in a notebook are cut from the manuscript scans and listed
in the `_original` entry's frontmatter:

```yaml
drawings:
  - src: /images/marie/drawings/068/tome09-p0123-1.webp
    caption: "Profil de femme, à la plume"
    source: "Tome 9, p. 123"
    paragraph: "068.0456"      # optional: shown right after this paragraph
    alt: "…"                   # optional; defaults to the caption
```

- Files: `src/frontend/public/images/marie/drawings/<carnet>/`, WebP, at most
  1600 px on the long side, aim for under 300 KB, named
  `tome<NN>-p<page>-<n>.webp`. The raw scans stay in the gitignored
  `content/_raw/scans/`. (Glossary artworks use `public/images/marie/works/`.)
- Without `paragraph`, or when the entry has no such paragraph, the drawing is
  shown at the end of the entry. Translations show the original's drawings
  unless their own frontmatter lists `drawings:` (for translated captions).
- `paragraph` IDs in frontmatter are rewritten by `rebuild-carnet` like any other
  reference. Code: `src/frontend/src/lib/drawings.ts`, rendered by
  `EntryContent.vue` (after the paragraph) and `[entry].astro` (end of entry).

