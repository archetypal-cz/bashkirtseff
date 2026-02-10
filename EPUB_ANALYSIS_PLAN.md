# EPUB Analysis Plan: Kernberger English Translation

## Overview

Analyze the Katherine Kernberger English translation of Marie Bashkirtseff's diary (EPUB format) to:
1. Identify which of our French original paragraphs were included in the Kernberger edition
2. Extract all images with their captions and context
3. Extract all footnotes and editorial notes
4. Tag included paragraphs with `#Kernberger` in our source files

## The Kernberger Translation

### Publication Details

| Field | Value |
|-------|-------|
| **Volume 1** | *I Am the Most Interesting Book of All* (1997, Chronicle Books) |
| **Volume 2** | *Lust for Glory* (2013, Fonthill Press) |
| **Combined EPUB** | *The Journal of Marie Bashkirtseff* (2013, Fonthill Press) |
| **Translators** | Phyllis Howard Kernberger (d. 1991), Katherine Kernberger |
| **Editor/Publisher** | Vincent Nicolosi (Fonthill Press) |
| **Source** | Original BnF manuscripts (not the censored 1887 edition) |

### Date Range Coverage

- **Volume 1**: 1873-1876 (Carnets 001-059 approximately)
- **Volume 2**: 1876-1884 (Carnets ~059-106)
- The combined EPUB covers the full diary span, but is an **abridged/selected** translation
- The Kernberger translation was described as covering "the first 59 of 106 notebooks" in the original Chronicle Books edition; the 2013 Fonthill combined edition extends further with Volume 2

### Key Characteristics

- Translated from the BnF original manuscripts (same source as our French transcription)
- Includes historical images of Marie and places she visited
- Contains footnotes with biographical and historical context
- This is a shortened/selected translation -- not every paragraph of every entry was translated

## EPUB File Location

**Expected path**: `/home/krr/bashkirtseff/raw_books/The Journal of Marie Bashkirtse - Marie Bashkirtseff.epub`

**Status**: The `raw_books/` directory does not yet exist in the project root (though `content/_raw/` exists with the DOCX tomes). The EPUB file must be placed at the expected path before running the analysis scripts.

**Setup**:
```bash
mkdir -p raw_books
# Copy or download the EPUB file to:
# raw_books/The Journal of Marie Bashkirtse - Marie Bashkirtseff.epub
```

## Technical Approach

### Why Python (via `uv`)

The project convention is TypeScript for core tools but Python via `uv` for ad-hoc analysis tasks. Python is the right choice here because:

1. **Mature EPUB libraries**: `ebooklib` is the de facto standard for EPUB parsing in Python
2. **HTML parsing**: `beautifulsoup4` for parsing the XHTML content inside the EPUB
3. **Existing pattern**: The project's `docx_verify.py` uses Python for similar DOCX comparison work
4. **Fuzzy matching**: `rapidfuzz` (already used in `docx_verify.py`) for text alignment
5. **One-time analysis**: This is an ad-hoc analysis task, not a recurring pipeline step

### Dependencies

```bash
# Using uv (project convention for Python)
uv run --with ebooklib --with beautifulsoup4 --with lxml --with rapidfuzz \
  python3 src/scripts/epub_kernberger.py <subcommand>
```

### EPUB Format Background

An EPUB is a ZIP archive containing:
```
META-INF/
  container.xml          # Points to the OPF file
OEBPS/ (or similar)
  content.opf            # Package document (spine, manifest, metadata)
  toc.ncx                # Table of contents (NCX format)
  nav.xhtml              # Table of contents (EPUB3 format)
  chapter01.xhtml        # Content chapters
  chapter02.xhtml
  ...
  images/                # Image files
    image001.jpg
    ...
  styles/                # CSS stylesheets
```

Key structures:
- **Spine**: Ordered list of content documents (reading order)
- **Manifest**: All files in the EPUB with media types
- **NCX/Nav**: Hierarchical table of contents
- **Content documents**: XHTML files containing the actual text

## Phase 1: EPUB Structure Analysis

**Script**: `src/scripts/epub_kernberger.py` (subcommand: `analyze`)

### Steps

1. Open the EPUB as a ZIP and list all contents
2. Parse the OPF package document to extract:
   - Metadata (title, author, publisher, date)
   - Spine order (chapter sequence)
   - Manifest (all files)
3. Parse the table of contents (NCX or nav.xhtml) to extract:
   - Chapter titles and hierarchy
   - Map chapters to date ranges
4. Output a structural report to `content/_raw/reports/kernberger_structure.md`

## Phase 2: Text Extraction and Date Matching

**Script**: `src/scripts/epub_kernberger.py` (subcommand: `extract`)

### Strategy

The Kernberger translation organizes entries by date, similar to our French originals. The matching strategy:

1. **Extract all text** from each EPUB chapter, preserving paragraph boundaries
2. **Identify date headers** in the English text (e.g., "Saturday, January 11, 1873" or "January 11")
3. **Map dates to our entries**: Each date maps to a specific entry file in `content/_original/NNN/YYYY-MM-DD.md`
4. **Within each date**: Use a language-independent matching approach to align English paragraphs with French originals

### Matching Challenges

| Challenge | Approach |
|-----------|----------|
| English vs French text | Match by: (1) date, (2) proper nouns, (3) structure/length |
| Paragraph splitting differs | Use substring containment, not 1:1 paragraph matching |
| Kernberger may combine/split entries | Track by date first, then by position within entry |
| Some entries abbreviated | Count matched vs unmatched paragraphs per entry |
| Proper noun overlap | Names (Marie, Maman, Paul, etc.) appear in both languages |

### Language-Independent Matching Signals

Since we are matching English translation against French original, we need language-independent signals:

1. **Proper nouns** (preserved across languages): "Maman", "Paul", "Nice", "Rome", "Julian"
2. **Numbers and dates**: "11 janvier" / "January 11"
3. **French/Italian phrases kept in English**: "en amazone", "Un ballo in maschera"
4. **Paragraph position** within an entry (ordinal matching)
5. **Paragraph length ratio** (translation roughly preserves length)
6. **Quoted speech markers** (presence of dialogue)

### Matching Algorithm

```
For each EPUB chapter:
  1. Extract paragraphs
  2. Identify date headers -> map to our entry dates
  3. Group EPUB paragraphs by entry date
  4. For each entry date:
     a. Load our French original paragraphs (with IDs like 001.0006)
     b. For each French paragraph:
        - Extract proper nouns, numbers, dates
        - Build a "fingerprint" of language-independent tokens
        - Compare fingerprint against EPUB English paragraphs
        - Score: proper noun overlap + structural similarity + position
     c. Mark matched paragraphs with confidence score
```

## Phase 3: Image Extraction

**Script**: `src/scripts/epub_kernberger.py` (subcommand: `images`)

### Steps

1. Extract all images from the EPUB
2. For each image:
   - Get filename, dimensions, file size
   - Find the XHTML document that references it
   - Extract surrounding text context (caption, alt text, nearby paragraphs)
   - Map to entry date using context
3. Save images to `content/_raw/images/kernberger/`
4. Generate an image report

## Phase 4: Footnote Extraction

**Script**: `src/scripts/epub_kernberger.py` (subcommand: `footnotes`)

### Steps

1. Parse each XHTML content document for footnote patterns:
   - `<a href="#footnote-N">` references
   - `<aside epub:type="footnote">` elements
   - `<div class="footnote">` elements
   - Endnote sections at chapter/book end
2. For each footnote:
   - Extract the footnote text
   - Identify the anchor point (which paragraph it annotates)
   - Map to entry date
   - Classify content: biographical, historical, translation note, editorial
3. Generate a footnote report with recommendations for our glossary

### Footnote Classification

| Type | Action |
|------|--------|
| Person identification | Check/update our glossary |
| Place description | Check/update our glossary |
| Historical event context | Consider adding as RSR comment |
| Translation note | May inform our LAN comments |
| Cultural reference | Check/update our glossary |
| Cross-reference to other entries | Note for our cross-reference system |

## Phase 5: Tagging Source Files

**Script**: `src/scripts/epub_kernberger.py` (subcommand: `tag`)

### Steps

1. Load the matching results from Phase 2
2. For each matched French paragraph:
   - Add `#Kernberger` tag in the annotation line
   - Format: `%% [#Kernberger] %%` (on its own line, after paragraph ID)
3. Update frontmatter with Kernberger coverage info:
   ```yaml
   kernberger:
     included: true
     paragraphs_included: 5
     paragraphs_total: 8
     volume: 1
   ```

### Safety

- Dry-run mode by default (report changes without applying)
- Backup check before modifying files
- Verification pass after tagging

## Phase 6: Reports and Summary

### Generated Reports

1. **`content/_raw/reports/kernberger_structure.md`** - EPUB structure analysis
2. **`content/_raw/reports/kernberger_matching.md`** - Paragraph matching results
3. **`content/_raw/reports/kernberger_images.md`** - Image extraction report
4. **`content/_raw/reports/kernberger_footnotes.md`** - Footnote extraction report
5. **`content/_raw/reports/kernberger_coverage.md`** - Summary of what Kernberger included/omitted

### Coverage Summary

The final report should show:
- Per-carnet: how many entries included, how many paragraphs matched
- Per-year: coverage percentage
- Notable omissions: long entries that Kernberger skipped entirely
- Notable selections: which entries/passages Kernberger chose

## Reuse from Existing Code

The existing `src/scripts/docx_verify.py` provides excellent patterns to reuse:

| Component | Reuse from docx_verify.py |
|-----------|--------------------------|
| `_normalize()` | Text normalization for comparison |
| `_best_fuzzy_score()` | Fuzzy matching scoring |
| `load_entry_paragraphs()` | Loading our French originals |
| `_parse_entry_file()` | Parsing entry markdown files |
| `EntryParagraph` dataclass | Data structure for entries |
| `align_paragraphs()` | Sequential alignment algorithm |
| Report generation pattern | Markdown report output |
| `CONTENT_ORIGINAL` path | Project directory constants |
| Carnet mapping loading | `load_mapping()` + `carnet-mapping.json` |

## Implementation: Script Structure

### Single script with subcommands

```
src/scripts/epub_kernberger.py
  analyze     - Phase 1: EPUB structure
  extract     - Phase 2: Text extraction + matching
  images      - Phase 3: Image extraction
  footnotes   - Phase 4: Footnote extraction
  tag         - Phase 5: Tag source files
  report      - Phase 6: Generate summary
```

### Running (via `uv`)

```bash
uv run --with ebooklib --with beautifulsoup4 --with lxml --with rapidfuzz \
  python3 src/scripts/epub_kernberger.py analyze
```

### Justfile Commands (to add)

```just
# Kernberger EPUB analysis
_kernberger_deps := "--with ebooklib --with beautifulsoup4 --with lxml --with rapidfuzz"

kernberger-analyze:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py analyze

kernberger-extract:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py extract

kernberger-images:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py images

kernberger-footnotes:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py footnotes

kernberger-tag-dry:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py tag --dry-run

kernberger-tag:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py tag
```

## Prerequisites

1. **EPUB file**: Place at `raw_books/The Journal of Marie Bashkirtse - Marie Bashkirtseff.epub`
2. **Create directory**: `mkdir -p raw_books`
3. **Python deps**: `uv` must be available (project convention)
4. **No build needed**: Python scripts run directly via `uv`

## Open Questions

1. **EPUB exact structure**: Until we inspect the actual file, we do not know the internal chapter/document structure. Phase 1 will reveal this.
2. **Volume boundaries**: Where exactly does Volume 1 end and Volume 2 begin in the combined EPUB? This affects how we map chapters to carnets.
3. **Abridgment pattern**: Does Kernberger omit entire entries, or also omit paragraphs within included entries? Phase 2 will reveal the pattern.
4. **Image attribution**: Do the EPUB images have proper captions/alt text, or are they inline without metadata?
5. **Footnote format**: Are footnotes inline, endnotes per chapter, or endnotes per volume? Phase 1 inspection will reveal.

## Timeline Estimate

| Phase | Effort | Dependency |
|-------|--------|------------|
| Phase 1: Structure | 1-2 hours | EPUB file available |
| Phase 2: Text matching | 4-8 hours | Phase 1 complete |
| Phase 3: Images | 1-2 hours | Phase 1 complete |
| Phase 4: Footnotes | 2-3 hours | Phase 1 complete |
| Phase 5: Tagging | 2-3 hours | Phase 2 complete |
| Phase 6: Reports | 1 hour | All phases complete |

Total estimated effort: 11-19 hours of development time.
