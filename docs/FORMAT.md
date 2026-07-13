# Translation Markdown — Format Specification

**Version 1.0.0-draft** · canonical home: [`archetypal-cz/tmd`](https://github.com/archetypal-cz/tmd)
— this file is a read-only mirror (`bashkirtseff/docs/FORMAT.md`); propose changes there ·
changelog at the end of this file.

Translation Markdown (TMD) is the bilingual Markdown format used by the Archetypal.cz
translation projects — **Bashkirtseff** (_Deník Marie Bashkirtseff_, French→Czech) and
**HPaMR** (_Harry Potter a Metody Racionality_, English→Czech). One file holds the original
and the translation side by side: the original sits in Obsidian-style `%% … %%` comments,
the translation is the visible prose.

This document is the single source of truth for the format. It consolidates what was
previously scattered across the two repos' `CLAUDE.md`, `content/CLAUDE.md`,
`CONTRIBUTING.md`, `docs/FRONTMATTER.md`, two independent parsers, and the VSCode
highlighting grammar — and resolves their contradictions (see §11, Legacy register).

The spec has two layers:

- a **normative core** (§2–§8) every TMD file must satisfy, and
- a per-book **profile** (§9) that plugs in the book-specific parts: the paragraph-ID
  scheme, the author vocabulary, the footnote scheme, frontmatter fields, and optional
  features. Anything a profile may vary is explicitly marked *profile-defined*.

---

## 1. Terminology

- **Original** — the source-language text (English for HPaMR, French for Bashkirtseff).
- **Translation** — the target-language text; the only *visible* prose in the file.
- **Comment** — any `%% … %%` span. Comments carry everything that is not translation:
  paragraph IDs, the original, annotations, flags, glossary links.
- **Paragraph cluster** — the unit of alignment: one ID comment plus the original,
  translation, and annotations belonging to that paragraph.
- **Annotation** — a dated, attributed remark by a human or tool
  (`%% 2024-01-30T07:53:33 Kerray: … %%`).
- **Machine flag** — a tool-inserted marker requiring human resolution
  (`%% ALIGN? no English counterpart %%`).
- **Projection** — deriving a plain, publishable document from a TMD file (§8).

## 2. Core invariants (normative)

1. **Comment syntax.** Comments use Obsidian's `%% … %%` syntax. A structural comment
   (ID, original, annotation, flag) occupies **whole lines of its own**: it starts with
   `%%` at column 0 and ends with `%%` at end of line (multi-line comment blocks are
   permitted for long original paragraphs). A paragraph-ID marker appearing mid-line is
   **corruption**, not content — parsers must warn loudly, never silently drop
   subsequent clusters.
2. **Projection invariant.** Removing every comment (each whole-line comment removed
   together with its line) must leave a **valid CommonMark document containing exactly
   the translation** — frontmatter, headings, visible prose, footnotes, scene breaks.
   This is the definition of "the markdown is valid": strip the `%% %%`, get the book.
3. **Stable IDs.** Paragraph IDs are permanent once assigned. Text may be re-translated,
   re-aligned or annotated; its ID never changes and is never reused.
4. **Plain-text readability.** The file must remain readable in any text editor; in
   Obsidian the comments disappear and only the translation shows.
5. **Unknown comments are preserved.** A conforming tool that rewrites a file must pass
   through, byte-identical, any comment it does not classify (§4).

## 3. File structure

```
optional YAML frontmatter (--- … ---)
paragraph clusters, separated by blank lines
optional footnote definitions
```

Frontmatter fields are *profile-defined*. HPaMR uses `chapter`, `title_en`, `title_cz`;
Bashkirtseff has an extensive schema specified in its `docs/FRONTMATTER.md` (static vs
calculated attributes, workflow flags, metrics), implemented in
`src/shared/src/parser/frontmatter.ts`.

### Paragraph cluster grammar

Canonical order within a cluster:

```
%% <paragraph-id> %%                         ← 1. ID comment (required)
%% <original text …> %%                      ← 2. original, ≥0 comment lines/blocks
<visible translation prose>                  ← 3. translation, ≥0 lines
%% <timestamp> <author>: <text> %%           ← 4. annotations, ≥0
%% <FLAG>? <text> %%                         ← 5. machine flags, ≥0
```

A cluster ends at the next blank line. Not every visible line belongs to a cluster:
scene breaks (§7) and headings may stand alone. Legacy Bashkirtseff files sometimes put
visible text *before* the ID; parsers should tolerate this on read, writers must emit
the canonical order.

## 4. Comment classification (normative)

A parser classifies each comment by testing patterns **in this order** — first match
wins. This replaces heuristics (e.g. the VSCode grammar's "20+ characters starting with
a letter = original text" rule) with a deterministic algorithm:

| # | Type | Pattern (after `%% `) |
| --- | --- | --- |
| 1 | **Paragraph ID** | *profile-defined* (§5), e.g. `\d{3}\.\d{4}` |
| 2 | **Annotation** | `\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{3})?Z?\s+<author>:\s` |
| 3 | **Machine flag** | `[A-Z]+\?\s` (e.g. `ALIGN?`, `FORMAT?`) |
| 4 | **Version comment** | `v\d+(\.\d+)*\s` (Bashkirtseff: earlier translation versions) |
| 5 | **Glossary link** | `[#` … (Bashkirtseff: `%% [#Name](../_glossary/…) %%`, ≥1 link) |
| 6 | **Tag annotation** | `[` immediately after `%%` (e.g. `%%[end-note 1]%%`) |
| 7 | **Original text** | anything else |

Notes:

- The original is a **plain comment with no prefix**. The `%% [FR] … %%` form shown in
  old Bashkirtseff `CONTRIBUTING.md` is **deprecated** and was never parsed (§11).
- Types 4–6 are optional features a profile may disable (§9); a parser for a profile
  without them still classifies them per the table (and preserves them per §2.5).

## 5. Paragraph IDs (profile-defined)

Each book plugs in its own **paragraph-ID scheme** — a declared object, not a hardcoded
format — consisting of:

- `pattern` — the regex a valid ID matches,
- `fields` — what the components mean,
- `uniqueness` — the scope in which IDs are unique,
- `ordering` — whether/where sequence is monotonic.

The two current schemes:

| | HPaMR | Bashkirtseff |
| --- | --- | --- |
| `pattern` | `\d{3}\.\d{4}` | `\d{3}\.\d{4}` plus `GLO_<NAME>\.\d{4}` (glossary), `SUM\.\d{3}\.\d{4}` (summaries) |
| `fields` | chapter `CCC` . paragraph `PPPP` | carnet `XXX` . sequence `YYYY` |
| `uniqueness` | global (chapter is in the ID) | global (sequence **never resets** across entries) |
| `ordering` | `PPPP` sequential within a chapter, restarts each chapter | `YYYY` monotonic within a carnet |

New books declare their own scheme in their profile (§9); tools must take the ID
pattern from the profile rather than assuming either scheme.

## 6. Annotations, authors, flags

**Annotations** are dated, attributed comments:
`%% YYYY-MM-DDThh:mm:ss <author>: <text> %%` (timestamp is ISO-8601, seconds required,
milliseconds and `Z` optional; both projects currently write naive local time).

The **author vocabulary** is *profile-defined* and open — new identifiers may be added
at any time; retired identifiers remain valid in existing annotations forever:

- **HPaMR** uses **personal names**: `Kerray`, `Edita`, `Tomáš`, `Václav`, `Pavel`, …
- **Bashkirtseff** uses **role codes**: `RSR`, `LAN`, `TR`, `OPS`, `RED`, `CON`, `ED`,
  `FAB`, `PA`, `KRR` (+ retired `GEM`, `PPX`).

A known-vocabulary list per book helps disambiguation (original prose can contain
`Louis XIV:`-style text); parsers should anchor author matching to the declared
vocabulary where one exists, falling back to `\S{1,24}:` after a valid timestamp.

Legacy quirk: some auto-incremented Bashkirtseff timestamps overflowed seconds
(`…:60`, `…:61`); parsers normalize by carrying into minutes.

**Machine flags** (`%% ALIGN? … %%`, `%% FORMAT? … %%`) are inserted by tooling to mark
a paragraph needing human attention. They are work items, not content: a human resolves
the issue and **deletes the flag**; every projection (§8) strips any that remain.
Current flags: `ALIGN?` (no counterpart in the original), `FORMAT?` (emphasis in the
original not carried into the translation). New flags follow the same `NAME? text`
shape.

## 7. Footnotes and scene breaks

**Footnotes** use standard Markdown footnote syntax; the **ID scheme is
profile-defined**, with uniqueness scope declared like paragraph IDs. Current reality:
HPaMR uses plain sequential `[^1]`, `[^2]`… unique **per chapter file** (note: its
`CLAUDE.md` long documented `[^CC.PP.N]`, which was never adopted — see §11);
Bashkirtseff supports both plain and dotted (`[^00.03.1]`) IDs. Because per-file
uniqueness is allowed, any projection that **concatenates files must renumber
footnotes** (§8).

**Scene breaks** in the translation are CommonMark thematic breaks. HPaMR writes
`* * *`; Bashkirtseff uses `---`. Profile declares the canonical marker; either is
valid CommonMark, satisfying the projection invariant.

## 8. Projections (making publishable output)

A **projection** derives a publishable document from TMD files. The baseline
projection, per invariant §2.2, is: **drop every `%% … %%` comment line → the
translation as valid CommonMark.** Practical publishing projections do a bit more:

1. Strip all comments (IDs, originals, annotations, flags — flags defensively, they
   should already be gone).
2. Strip or resolve **inline `{{…}}` metadata overlays** (legacy HPaMR/archetypal.cz
   publishing metadata embedded in headings/titles — see §11; new content must put
   this in frontmatter instead).
3. When concatenating multiple files (e.g. chapters → volume): emit per-chapter
   headings from frontmatter, **renumber footnotes** to avoid collisions, and move
   footnote definitions appropriately.
4. Optionally emit the original instead of / alongside the translation (bilingual
   render) — the Bashkirtseff renderer's `RenderOptions` (original/translation/IDs/
   notes/glossary toggles) is the reference implementation.

## 9. Book profile

Each book declares its profile in a machine-readable **`format-profile.yaml`** at the
repo root (next to `content/`), so tools plug in the book's schemes instead of
hardcoding them:

```yaml
spec_version: "1.0"            # version of this spec the book conforms to
original_language: en          # language of the %% original %% comments
translation_language: cs
paragraph_id:
  pattern: '\d{3}\.\d{4}'
  fields: [chapter, paragraph]
  uniqueness: global
  ordering: per-chapter
authors:
  style: names                 # names | codes
  vocabulary: [Kerray, Edita, Tomáš, Václav, Pavel, Fable, REV]
  retired: []                  # Fable = Claude Fable 5 (AI translator), REV = reviewer agent
footnotes:
  pattern: '\d+'
  uniqueness: per-file
scene_break: "* * *"
features:                      # optional comment types (§4, rows 4–6)
  version_comments: false
  glossary_links: false
  tag_annotations: false
frontmatter:
  required: [chapter, title_en, title_cz]
  optional: [link, post_id, translator]  # archetypal.cz URL / legacy post id / non-default translator
layout: content/<book>/<file>    # a folder = a book (1–6), as in Bashkirtseff
```

(The equivalent Bashkirtseff profile: `style: codes`, vocabulary as in §6, footnote
pattern `\d+|\d{2}\.\d{2}\.\d+`, scene break `---`, all three features on, frontmatter
per its `docs/FRONTMATTER.md`.)

## 10. Conformance

A conforming **parser**: classifies comments per §4 with the book's profile; tolerates
legacy layouts (§3) and legacy timestamps (§6); warns on mid-line IDs (§2.1); preserves
unclassified comments (§2.5).

A conforming **writer**: emits canonical cluster order; never invents or reuses
paragraph IDs; round-trips a file byte-identically apart from explicitly documented
normalizations.

A conforming **publisher**: implements §8; must not leak comments, flags, or `{{…}}`
overlays into output.

## 11. Legacy register (known deviations & resolutions)

| Where | Deviation | Resolution |
| --- | --- | --- |
| Bashkirtseff `CONTRIBUTING.md` | original shown as `%% [FR] … %%` | **Deprecated.** Original is a plain unprefixed comment; no parser ever handled `[FR]`. |
| Bashkirtseff prose docs | role lists disagree; `PA`, `KRR` only in the VSCode grammar | §6 vocabulary + profile is authoritative. |
| Bashkirtseff, old files | `[//]: # ( … )` HTML-comment-style remarks | Legacy; parsers may read, writers never emit. |
| Bashkirtseff timestamps | seconds `:60`/`:61` overflow | Normalize by carrying into minutes. |
| VSCode grammar | "20+ chars = original" heuristic; ID regex too loose; no `GLO_`/`SUM.` | Highlighting-only; §4/§5 are authoritative. Grammar update welcome. |
| HPaMR `CLAUDE.md` | documents footnotes as `[^CC.PP.N]` | Never adopted; actual content uses `[^1]`… per chapter. Fix the doc, keep content. |
| HPaMR content (58 chapters) | `{{"chapter":…, "link":…, "id":…}}` overlays inside frontmatter `title_cz` | **Resolved 2026-07-10**: migrated to frontmatter fields `link` / `post_id`. Projections still strip any stray `{{…}}` defensively. |
| HPaMR content | `%% ALIGN? %%` flags (53), `docs/formatting-review.md` backlog | Open work items per §6. |

## Changelog

- **1.0.0-draft** (2026-07-13) — canonical home moved to `archetypal-cz/tmd`, published
  alongside the reference implementation (`@archetypal-cz/tmd` on npm); hpamr and
  bashkirtseff now carry mirrors.
- **1.0.0-draft** (2026-07-10) — first consolidated spec, built from HPaMR and
  Bashkirtseff practice: normative core + pluggable per-book profiles (paragraph-ID
  scheme, author vocabulary, footnotes, features), deterministic comment
  classification, projection invariant, legacy register.
