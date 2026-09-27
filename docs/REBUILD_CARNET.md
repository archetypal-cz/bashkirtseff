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
just test-rebuild-carnet                   # fixture tests
```

After `--write`, for `_original` and every tree: `just verify-carnet LANG 068`
(PASS) and `just splicescan LANG 068` (empty). Then commit the carnet trees,
the rewritten reference files, and `content/_renumber/` together.

The identity plan is a zero diff on 89 of 106 carnets (sweep of 2026-09-27).
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
      "paragraphs": [
        { "old": "CCC.0261" },
        { "old": "CCC.0262", "set_french": "Only the first half of the old text." },
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
  French. Translation trees: the `just scaffold` shape — ID, embedded French
  (`%% … %%` per line), tags localised to `../../_original/_glossary/`, the RSR
  note, then `TODO` (and `# TODO` for a heading line). The fr edition gets no
  `TODO`: it gets the French verbatim if its carnet already shows visible text,
  otherwise only the embedded copy (the state of an unedited fr carnet).
- **Splits** (`set_french` on an `old` paragraph): `_original` gets the new
  text in place of the old text lines; each translation's embedded French copy
  is replaced (or inserted, with a warning, if it cannot be found), and an
  `ED: … SOURCE CHANGED` comment tells the translator that the visible
  translation still renders the old text. Put the cut-off half into a `new`
  paragraph. A footnote marker dropped by `set_french` is warned about; move its
  definition by hand.
- **Paragraphs a translation tree lacks** are reported and stay missing.
  A partial tree (one without every source entry) only gets the entries it
  already has paragraphs for.

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

Scope: every text file in the repo (`.md .ts .js .mjs .json .yaml .astro .vue
.sql .py …`) except `.git`, `node_modules`, `dist`, `.astro`, `.claude/reports`
(run reports and WORKPLANs are history), `content/_raw`, `content/_renumber`.
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
no path+anchor pointing at a file that does not hold the paragraph.
