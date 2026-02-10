#!/usr/bin/env python3
"""
Analyze the Kernberger English translation EPUB of Marie Bashkirtseff's diary.

Subcommands:
  analyze    - Inspect EPUB structure (TOC, chapters, images, metadata)
  extract    - Extract text, match to French originals by date + content
  images     - Extract images with captions and context
  footnotes  - Extract footnotes and editorial notes
  tag        - Tag matched French paragraphs with #Kernberger
  report     - Generate comprehensive coverage report

Usage:
  uv run --with ebooklib --with beautifulsoup4 --with lxml --with rapidfuzz \\
    python3 src/scripts/epub_kernberger.py analyze

  uv run --with ebooklib --with beautifulsoup4 --with lxml --with rapidfuzz \\
    python3 src/scripts/epub_kernberger.py extract
"""

import argparse
import json
import os
import re
import sys
import unicodedata
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    import ebooklib
    from ebooklib import epub
except ImportError:
    print("ERROR: ebooklib not found. Install with:")
    print("  uv run --with ebooklib --with beautifulsoup4 --with lxml --with rapidfuzz \\")
    print("    python3 src/scripts/epub_kernberger.py <command>")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup, NavigableString, Tag
except ImportError:
    print("ERROR: beautifulsoup4 not found. See install command above.")
    sys.exit(1)

try:
    from rapidfuzz import fuzz
except ImportError:
    fuzz = None  # Optional for Phase 1; required for Phase 2+

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONTENT_ORIGINAL = PROJECT_ROOT / "content" / "_original"
CONTENT_RAW = PROJECT_ROOT / "content" / "_raw"
CARNET_MAPPING = CONTENT_ORIGINAL / "_carnets" / "carnet-mapping.json"
REPORTS_DIR = CONTENT_RAW / "reports"
IMAGES_DIR = CONTENT_RAW / "images" / "kernberger"

# Default EPUB path
EPUB_PATH = PROJECT_ROOT / "raw_books" / "Kernberger_Journal_illustrated.epub"

# Regex for parsing entry files (shared with docx_verify.py)
RE_ANNOTATION = re.compile(r"^%%\s.*%%\s*$")
RE_FRONTMATTER = re.compile(r"^---\s*$")
RE_PAGE_NUMBER = re.compile(r"^\d{1,4}$")
RE_HEADING = re.compile(r"^#+\s+")
RE_FOOTNOTE_REF = re.compile(r"\[\^[^\]]+\]")
RE_FOOTNOTE_LINE = re.compile(r"^\[\^[^\]]+\]:\s")
RE_HTML_COMMENT = re.compile(r"^\[//\]:\s*#\s*\(.*\)\s*$")

# Date patterns in English text (Kernberger translation)
# Examples: "Saturday, January 11, 1873", "January 11", "January 11, 1873"
RE_EN_DATE_FULL = re.compile(
    r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
    r",?\s+"
    r"(January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+(\d{1,2})"
    r",?\s+(\d{4})",
    re.IGNORECASE,
)
RE_EN_DATE_SHORT = re.compile(
    r"(January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+(\d{1,2})"
    r",?\s+(\d{4})",
    re.IGNORECASE,
)
RE_EN_DATE_MINIMAL = re.compile(
    r"(January|February|March|April|May|June|July|August|September|October|November|December)"
    r"\s+(\d{1,2})",
    re.IGNORECASE,
)

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}

MIN_PARA_CHARS = 10


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class EpubChapter:
    """A chapter/document from the EPUB."""
    index: int
    href: str
    title: str
    paragraphs: list[str] = field(default_factory=list)
    images: list[dict] = field(default_factory=list)
    footnotes: list[dict] = field(default_factory=list)


@dataclass
class EpubEntry:
    """A diary entry extracted from the EPUB, keyed by date."""
    date_str: str  # ISO format: YYYY-MM-DD
    chapter_index: int
    paragraphs: list[str] = field(default_factory=list)
    english_date_header: str = ""


@dataclass
class EntryParagraph:
    """A paragraph from a French original entry file."""
    para_id: str  # e.g., "015.0003"
    text: str
    entry_date: str
    carnet: str
    file_path: Path
    line_number: int


@dataclass
class MatchResult:
    """Result of matching an EPUB entry to French originals."""
    date_str: str
    carnet: str
    epub_paragraph_count: int
    french_paragraph_count: int
    matched_para_ids: list[str]  # French paragraph IDs that matched
    confidence: float  # 0.0 - 1.0
    notes: str = ""


# ---------------------------------------------------------------------------
# Helpers: Text normalization (from docx_verify.py)
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """Normalize text for comparison: lowercase, strip accents, collapse whitespace."""
    t = text.lower()
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r'\s+', ' ', t)
    t = t.replace("\u2019", "'").replace("\u2018", "'").replace("'", "'")
    t = t.replace("\u00ab", '"').replace("\u00bb", '"')
    t = t.replace("\u2013", "-").replace("\u2014", "-")
    t = t.strip()
    return t


def _extract_proper_nouns(text: str) -> set[str]:
    """Extract likely proper nouns (capitalized words) from text."""
    words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
    # Filter out common sentence-starting words
    stop_words = {
        "The", "This", "That", "These", "Those", "There", "Then",
        "But", "And", "For", "Not", "Yet", "She", "Her", "His",
        "My", "Our", "All", "One", "Some", "What", "When", "Where",
        "How", "Who", "Why", "After", "Before", "During", "Since",
        "With", "Without", "About", "Between", "Among", "Through",
        # French equivalents
        "Les", "Des", "Une", "Nous", "Vous", "Ils", "Elle",
        "Mon", "Mes", "Ses", "Nos", "Vos", "Leur", "Leurs",
        "Mais", "Dans", "Pour", "Avec", "Sans", "Chez", "Sur",
        "Tout", "Tous", "Toute", "Toutes", "Comme", "Quand",
    }
    return {w for w in words if w not in stop_words and len(w) > 2}


def _extract_numbers(text: str) -> set[str]:
    """Extract numbers from text."""
    return set(re.findall(r'\b\d+\b', text))


# ---------------------------------------------------------------------------
# Helpers: Entry file parsing (from docx_verify.py)
# ---------------------------------------------------------------------------

def load_mapping() -> dict:
    """Load carnet-mapping.json."""
    with open(CARNET_MAPPING, "r", encoding="utf-8") as f:
        return json.load(f)


def load_entry_paragraphs(carnet_id: str) -> list[EntryParagraph]:
    """Load all entry paragraphs for a carnet, in date order."""
    carnet_dir = CONTENT_ORIGINAL / carnet_id
    if not carnet_dir.is_dir():
        return []

    entry_files = sorted(carnet_dir.glob("*.md"))
    entry_files = [f for f in entry_files
                   if f.name != "README.md"
                   and not f.name.startswith("_")]

    paragraphs = []
    for fpath in entry_files:
        date_str = fpath.stem
        paras = _parse_entry_file(fpath, carnet_id, date_str)
        paragraphs.extend(paras)

    return paragraphs


def _parse_entry_file(fpath: Path, carnet_id: str, date_str: str) -> list[EntryParagraph]:
    """Parse a single entry file, extracting clean text paragraphs."""
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    lines = content.split("\n")

    paragraphs = []
    in_frontmatter = False
    in_multiline_comment = False
    current_para_id = ""
    current_text_lines = []
    current_line_start = 0

    for line_num, line in enumerate(lines, 1):
        stripped = line.strip()

        if RE_FRONTMATTER.match(stripped):
            in_frontmatter = not in_frontmatter
            continue
        if in_frontmatter:
            continue

        if in_multiline_comment:
            if stripped.endswith("%%"):
                in_multiline_comment = False
            continue

        if RE_ANNOTATION.match(stripped):
            id_match = re.match(r"^%%\s+(\d{3}\.\d{4})\s+%%$", stripped)
            if id_match:
                if current_text_lines:
                    text = "\n".join(current_text_lines).strip()
                    if text:
                        paragraphs.append(EntryParagraph(
                            para_id=current_para_id,
                            text=text,
                            entry_date=date_str,
                            carnet=carnet_id,
                            file_path=fpath,
                            line_number=current_line_start,
                        ))
                current_para_id = id_match.group(1)
                current_text_lines = []
                current_line_start = line_num + 1
            continue

        if stripped.startswith("%%") and not stripped.endswith("%%"):
            in_multiline_comment = True
            continue

        if stripped:
            if RE_FOOTNOTE_LINE.match(stripped):
                continue
            if RE_HTML_COMMENT.match(stripped):
                continue
            line_content = RE_HEADING.sub("", stripped)
            line_content = RE_FOOTNOTE_REF.sub("", line_content).strip()
            if not line_content:
                continue
            if not current_text_lines:
                current_line_start = line_num
            current_text_lines.append(line_content)
        elif current_text_lines:
            current_text_lines.append("")

    if current_text_lines:
        text = "\n".join(current_text_lines).strip()
        if text:
            paragraphs.append(EntryParagraph(
                para_id=current_para_id,
                text=text,
                entry_date=date_str,
                carnet=carnet_id,
                file_path=fpath,
                line_number=current_line_start,
            ))

    return paragraphs


def get_entries_by_date(start_date: str = "", end_date: str = "") -> dict[str, list[EntryParagraph]]:
    """Load all entry paragraphs grouped by date, optionally filtered by date range."""
    mapping = load_mapping()
    entries_by_date: dict[str, list[EntryParagraph]] = {}

    for carnet_id in sorted(mapping.get("carnets", {}).keys()):
        paras = load_entry_paragraphs(carnet_id)
        for p in paras:
            if start_date and p.entry_date < start_date:
                continue
            if end_date and p.entry_date > end_date:
                continue
            if p.entry_date not in entries_by_date:
                entries_by_date[p.entry_date] = []
            entries_by_date[p.entry_date].append(p)

    return entries_by_date


# ---------------------------------------------------------------------------
# EPUB parsing helpers
# ---------------------------------------------------------------------------

def open_epub(epub_path: Path) -> epub.EpubBook:
    """Open and return an EPUB book."""
    if not epub_path.exists():
        print(f"ERROR: EPUB file not found: {epub_path}")
        print(f"Please place the Kernberger EPUB at this location.")
        print(f"Expected: {epub_path}")
        sys.exit(1)

    return epub.read_epub(str(epub_path), options={"ignore_ncx": False})


def get_spine_items(book: epub.EpubBook) -> list[tuple[str, str]]:
    """Get ordered list of (id, href) from the spine."""
    spine_ids = [item[0] for item in book.spine]
    items = []
    for sid in spine_ids:
        item = book.get_item_with_id(sid)
        if item and isinstance(item, epub.EpubHtml):
            items.append((sid, item.get_name()))
    return items


def extract_chapter_text(item: epub.EpubHtml) -> tuple[list[str], list[dict], list[dict]]:
    """
    Extract paragraphs, images, and footnotes from an EPUB HTML item.

    Returns:
        (paragraphs, images, footnotes)
        - paragraphs: list of text strings
        - images: list of dicts with keys: src, alt, context_before, context_after
        - footnotes: list of dicts with keys: id, text, ref_text
    """
    content = item.get_content()
    soup = BeautifulSoup(content, "lxml")

    paragraphs = []
    images = []
    footnotes = []

    # Remove script and style elements
    for tag in soup.find_all(["script", "style"]):
        tag.decompose()

    # Extract all text-bearing elements
    body = soup.find("body") or soup
    prev_text = ""

    for element in body.descendants:
        if isinstance(element, Tag):
            # Handle images
            if element.name == "img":
                img_info = {
                    "src": element.get("src", ""),
                    "alt": element.get("alt", ""),
                    "context_before": prev_text[-200:] if prev_text else "",
                    "context_after": "",
                }
                images.append(img_info)

            # Handle footnotes (various patterns)
            if element.name in ("aside", "div", "section"):
                epub_type = element.get("epub:type", "") or element.get("data-type", "")
                classes = " ".join(element.get("class", []))
                if "footnote" in epub_type or "footnote" in classes or "endnote" in classes:
                    fn_id = element.get("id", "")
                    fn_text = element.get_text(strip=True)
                    footnotes.append({
                        "id": fn_id,
                        "text": fn_text,
                        "ref_text": "",
                    })

            # Handle paragraphs and text blocks
            if element.name in ("p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "blockquote"):
                text = element.get_text(strip=True)
                if text and len(text) > 1:
                    paragraphs.append(text)
                    prev_text = text

                    # Update context_after for last image
                    if images and not images[-1]["context_after"]:
                        images[-1]["context_after"] = text[:200]

    # Also look for footnote references (superscript links)
    for a_tag in soup.find_all("a"):
        href = a_tag.get("href", "")
        if "#" in href and ("note" in href.lower() or "fn" in href.lower()):
            ref_text = a_tag.get_text(strip=True)
            # Find parent paragraph for context
            parent = a_tag.find_parent(["p", "div"])
            context = parent.get_text(strip=True) if parent else ""
            # Check if this links to a footnote we already found
            fn_id = href.split("#")[-1]
            for fn in footnotes:
                if fn["id"] == fn_id:
                    fn["ref_text"] = context[:200]
                    break

    return paragraphs, images, footnotes


def parse_english_date(text: str, current_year: int = 0) -> str | None:
    """
    Try to parse an English date from text. Returns ISO date string or None.

    Handles:
      "Saturday, January 11, 1873"
      "January 11, 1873"
      "January 11" (uses current_year)
    """
    # Try full date with day-of-week
    m = RE_EN_DATE_FULL.search(text)
    if m:
        month = MONTH_MAP.get(m.group(1).lower())
        day = int(m.group(2))
        year = int(m.group(3))
        if month and 1 <= day <= 31 and 1870 <= year <= 1890:
            return f"{year:04d}-{month:02d}-{day:02d}"

    # Try date without day-of-week
    m = RE_EN_DATE_SHORT.search(text)
    if m:
        month = MONTH_MAP.get(m.group(1).lower())
        day = int(m.group(2))
        year = int(m.group(3))
        if month and 1 <= day <= 31 and 1870 <= year <= 1890:
            return f"{year:04d}-{month:02d}-{day:02d}"

    # Try minimal date (month + day only)
    if current_year:
        m = RE_EN_DATE_MINIMAL.search(text)
        if m:
            month = MONTH_MAP.get(m.group(1).lower())
            day = int(m.group(2))
            if month and 1 <= day <= 31:
                return f"{current_year:04d}-{month:02d}-{day:02d}"

    return None


# ---------------------------------------------------------------------------
# Subcommand: analyze
# ---------------------------------------------------------------------------

def cmd_analyze(args):
    """Analyze EPUB structure: metadata, TOC, chapters, images."""
    epub_path = Path(args.epub) if args.epub else EPUB_PATH
    book = open_epub(epub_path)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    report = []
    report.append("# Kernberger EPUB Structure Analysis\n")

    # --- Metadata ---
    report.append("## Metadata\n")

    metadata_fields = [
        ("title", "Title"),
        ("creator", "Author"),
        ("publisher", "Publisher"),
        ("date", "Date"),
        ("language", "Language"),
        ("identifier", "Identifier"),
        ("description", "Description"),
    ]

    for field_name, label in metadata_fields:
        values = book.get_metadata("DC", field_name)
        if values:
            for val in values:
                text = val[0] if isinstance(val, tuple) else str(val)
                report.append(f"- **{label}**: {text}")

    report.append("")

    # --- Spine / Chapters ---
    report.append("## Spine (Reading Order)\n")

    spine_items = get_spine_items(book)
    report.append(f"Total documents in spine: **{len(spine_items)}**\n")

    report.append("| # | ID | Href |")
    report.append("|---|-----|------|")
    for i, (sid, href) in enumerate(spine_items, 1):
        report.append(f"| {i} | {sid} | `{href}` |")

    report.append("")

    # --- Table of Contents ---
    report.append("## Table of Contents\n")

    toc = book.toc
    if toc:
        _render_toc(toc, report, level=0)
    else:
        report.append("*No table of contents found in EPUB.*\n")

    report.append("")

    # --- All Items (Manifest) ---
    report.append("## Manifest (All Files)\n")

    all_items = list(book.get_items())
    by_type = {}
    for item in all_items:
        media_type = item.media_type or "unknown"
        if media_type not in by_type:
            by_type[media_type] = []
        by_type[media_type].append(item)

    for media_type in sorted(by_type.keys()):
        items = by_type[media_type]
        report.append(f"### {media_type} ({len(items)} files)\n")
        for item in items[:50]:  # Limit output
            name = item.get_name() or item.id
            report.append(f"- `{name}`")
        if len(items) > 50:
            report.append(f"- ... and {len(items) - 50} more")
        report.append("")

    # --- Images ---
    report.append("## Images\n")

    image_items = list(book.get_items_of_type(ebooklib.ITEM_IMAGE))
    report.append(f"Total images: **{len(image_items)}**\n")

    if image_items:
        report.append("| # | Filename | Type | Size (bytes) |")
        report.append("|---|----------|------|-------------|")
        for i, img in enumerate(image_items, 1):
            name = img.get_name() or img.id
            content = img.get_content()
            size = len(content) if content else 0
            report.append(f"| {i} | `{name}` | {img.media_type} | {size:,} |")

    report.append("")

    # --- Content Preview ---
    report.append("## Content Preview (First 3 Chapters)\n")

    doc_items = list(book.get_items_of_type(ebooklib.ITEM_DOCUMENT))
    for i, item in enumerate(doc_items[:3]):
        report.append(f"### Chapter {i+1}: `{item.get_name()}`\n")
        paragraphs, images, footnotes = extract_chapter_text(item)

        report.append(f"- Paragraphs: {len(paragraphs)}")
        report.append(f"- Images: {len(images)}")
        report.append(f"- Footnotes: {len(footnotes)}")
        report.append("")

        # Show first few paragraphs
        for j, para in enumerate(paragraphs[:5]):
            preview = para[:150].replace("\n", " ")
            report.append(f"  {j+1}. `{preview}`")
        if len(paragraphs) > 5:
            report.append(f"  ... and {len(paragraphs) - 5} more paragraphs")

        report.append("")

        # Show date detection
        dates_found = []
        for para in paragraphs:
            date = parse_english_date(para)
            if date:
                dates_found.append((date, para[:80]))
        if dates_found:
            report.append("  **Dates detected:**")
            for date, context in dates_found[:10]:
                report.append(f"  - {date}: `{context}`")
            report.append("")

    # --- Summary stats ---
    report.append("## Summary\n")

    total_paras = 0
    total_images_in_text = 0
    total_footnotes = 0
    total_dates = 0
    all_dates = set()

    for item in doc_items:
        paragraphs, images, footnotes = extract_chapter_text(item)
        total_paras += len(paragraphs)
        total_images_in_text += len(images)
        total_footnotes += len(footnotes)

        for para in paragraphs:
            date = parse_english_date(para)
            if date:
                total_dates += 1
                all_dates.add(date)

    report.append(f"- **Total content documents**: {len(doc_items)}")
    report.append(f"- **Total paragraphs extracted**: {total_paras}")
    report.append(f"- **Total images in manifest**: {len(image_items)}")
    report.append(f"- **Total images referenced in text**: {total_images_in_text}")
    report.append(f"- **Total footnotes detected**: {total_footnotes}")
    report.append(f"- **Total date headers detected**: {total_dates}")
    report.append(f"- **Unique dates**: {len(all_dates)}")

    if all_dates:
        sorted_dates = sorted(all_dates)
        report.append(f"- **Date range**: {sorted_dates[0]} to {sorted_dates[-1]}")

    report.append("")

    # Write report
    report_path = REPORTS_DIR / "kernberger_structure.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report))

    print(f"Structure analysis complete.")
    print(f"Report saved to: {report_path}")
    print(f"\nQuick stats:")
    print(f"  Documents: {len(doc_items)}")
    print(f"  Paragraphs: {total_paras}")
    print(f"  Images: {len(image_items)}")
    print(f"  Footnotes: {total_footnotes}")
    print(f"  Date headers: {total_dates} ({len(all_dates)} unique)")
    if all_dates:
        sorted_dates = sorted(all_dates)
        print(f"  Date range: {sorted_dates[0]} to {sorted_dates[-1]}")


def _render_toc(toc_items, report: list[str], level: int = 0):
    """Recursively render TOC items."""
    indent = "  " * level
    for item in toc_items:
        if isinstance(item, tuple):
            # Nested section: (Section, [children])
            section, children = item
            if hasattr(section, "title"):
                report.append(f"{indent}- **{section.title}** (`{section.href}`)")
            _render_toc(children, report, level + 1)
        elif isinstance(item, epub.Link):
            report.append(f"{indent}- {item.title} (`{item.href}`)")
        elif isinstance(item, epub.Section):
            report.append(f"{indent}- **{item.title}**")


# ---------------------------------------------------------------------------
# Subcommand: extract (placeholder for Phase 2)
# ---------------------------------------------------------------------------

def cmd_extract(args):
    """Extract text from EPUB and match to French originals."""
    epub_path = Path(args.epub) if args.epub else EPUB_PATH
    book = open_epub(epub_path)

    if fuzz is None:
        print("ERROR: rapidfuzz is required for text matching.")
        print("Install with: uv run --with rapidfuzz ...")
        sys.exit(1)

    print("Phase 2: Text extraction and matching")
    print("=" * 60)

    # Step 1: Extract all entries from EPUB by date
    print("\nStep 1: Extracting entries from EPUB...")
    epub_entries = _extract_epub_entries(book)
    print(f"  Found {len(epub_entries)} dated entries in EPUB")

    if epub_entries:
        sorted_dates = sorted(epub_entries.keys())
        print(f"  Date range: {sorted_dates[0]} to {sorted_dates[-1]}")
        total_paras = sum(len(e.paragraphs) for e in epub_entries.values())
        print(f"  Total paragraphs: {total_paras}")

    # Step 2: Load French originals
    print("\nStep 2: Loading French original entries...")
    french_entries = get_entries_by_date()
    print(f"  Found {len(french_entries)} dated entries in French originals")
    total_fr_paras = sum(len(ps) for ps in french_entries.values())
    print(f"  Total French paragraphs: {total_fr_paras}")

    # Step 3: Match by date
    print("\nStep 3: Matching by date...")
    matched_dates = set(epub_entries.keys()) & set(french_entries.keys())
    epub_only = set(epub_entries.keys()) - set(french_entries.keys())
    french_only = set(french_entries.keys()) - set(epub_entries.keys())

    print(f"  Dates in both: {len(matched_dates)}")
    print(f"  Dates only in EPUB: {len(epub_only)}")
    print(f"  Dates only in French: {len(french_only)}")

    # Step 4: For matched dates, do paragraph-level matching
    print("\nStep 4: Paragraph-level matching...")
    match_results = []

    for date_str in sorted(matched_dates):
        epub_entry = epub_entries[date_str]
        french_paras = french_entries[date_str]

        result = _match_entry_paragraphs(date_str, epub_entry, french_paras)
        match_results.append(result)

    # Step 5: Generate report
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report = _generate_matching_report(
        epub_entries, french_entries, match_results,
        matched_dates, epub_only, french_only,
    )

    report_path = REPORTS_DIR / "kernberger_matching.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\nReport saved to: {report_path}")

    # Save matching data as JSON for Phase 5 (tagging)
    json_data = {
        "matched_dates": sorted(matched_dates),
        "epub_only_dates": sorted(epub_only),
        "french_only_dates": sorted(french_only),
        "matches": [
            {
                "date": r.date_str,
                "carnet": r.carnet,
                "epub_paragraphs": r.epub_paragraph_count,
                "french_paragraphs": r.french_paragraph_count,
                "matched_para_ids": r.matched_para_ids,
                "confidence": r.confidence,
                "notes": r.notes,
            }
            for r in match_results
        ],
    }

    json_path = REPORTS_DIR / "kernberger_matching.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    print(f"Matching data saved to: {json_path}")


def _extract_epub_entries(book: epub.EpubBook) -> dict[str, EpubEntry]:
    """Extract all diary entries from the EPUB, grouped by date."""
    entries = {}
    current_year = 0
    doc_items = list(book.get_items_of_type(ebooklib.ITEM_DOCUMENT))

    for doc_idx, item in enumerate(doc_items):
        paragraphs, _, _ = extract_chapter_text(item)

        current_date = None
        current_entry_paras = []

        for para in paragraphs:
            # Try to detect a date header
            date = parse_english_date(para, current_year)
            if date:
                # Save previous entry
                if current_date and current_entry_paras:
                    if current_date not in entries:
                        entries[current_date] = EpubEntry(
                            date_str=current_date,
                            chapter_index=doc_idx,
                        )
                    entries[current_date].paragraphs.extend(current_entry_paras)

                current_date = date
                current_year = int(date[:4])
                current_entry_paras = []
                # Don't include the date header itself as a content paragraph
                continue

            if current_date:
                current_entry_paras.append(para)

        # Save last entry in chapter
        if current_date and current_entry_paras:
            if current_date not in entries:
                entries[current_date] = EpubEntry(
                    date_str=current_date,
                    chapter_index=doc_idx,
                )
            entries[current_date].paragraphs.extend(current_entry_paras)

    return entries


def _match_entry_paragraphs(
    date_str: str,
    epub_entry: EpubEntry,
    french_paras: list[EntryParagraph],
) -> MatchResult:
    """
    Match EPUB English paragraphs to French original paragraphs.

    Uses language-independent signals: proper nouns, numbers, position.
    """
    matched_ids = []
    carnet = french_paras[0].carnet if french_paras else ""

    # Extract proper nouns and numbers from each EPUB paragraph
    epub_fingerprints = []
    for para in epub_entry.paragraphs:
        nouns = _extract_proper_nouns(para)
        nums = _extract_numbers(para)
        epub_fingerprints.append((nouns, nums, len(para)))

    # For each French paragraph, try to find a matching EPUB paragraph
    for fr_para in french_paras:
        if len(fr_para.text) < MIN_PARA_CHARS:
            # Short paragraphs (dates, headers) - match by position
            matched_ids.append(fr_para.para_id)
            continue

        fr_nouns = _extract_proper_nouns(fr_para.text)
        fr_nums = _extract_numbers(fr_para.text)
        fr_len = len(fr_para.text)

        best_score = 0
        for epub_nouns, epub_nums, epub_len in epub_fingerprints:
            score = 0

            # Proper noun overlap (strongest signal)
            if fr_nouns and epub_nouns:
                common = fr_nouns & epub_nouns
                if common:
                    score += len(common) * 30

            # Number overlap
            if fr_nums and epub_nums:
                common_nums = fr_nums & epub_nums
                if common_nums:
                    score += len(common_nums) * 10

            # Length similarity (within 50% is good)
            if fr_len > 0 and epub_len > 0:
                ratio = min(fr_len, epub_len) / max(fr_len, epub_len)
                score += ratio * 20

            best_score = max(best_score, score)

        # If score is high enough, consider it matched
        if best_score >= 20:
            matched_ids.append(fr_para.para_id)

    # If the entry exists in the EPUB at all, mark all short paragraphs as matched too
    # (date headers, structural elements are implicitly included)
    confidence = len(matched_ids) / max(len(french_paras), 1)

    return MatchResult(
        date_str=date_str,
        carnet=carnet,
        epub_paragraph_count=len(epub_entry.paragraphs),
        french_paragraph_count=len(french_paras),
        matched_para_ids=matched_ids,
        confidence=confidence,
    )


def _generate_matching_report(
    epub_entries: dict[str, EpubEntry],
    french_entries: dict[str, list[EntryParagraph]],
    match_results: list[MatchResult],
    matched_dates: set,
    epub_only: set,
    french_only: set,
) -> str:
    """Generate a markdown matching report."""
    lines = []
    lines.append("# Kernberger EPUB Matching Report\n")

    # Summary
    lines.append("## Summary\n")
    lines.append(f"- **EPUB entries (by date)**: {len(epub_entries)}")
    lines.append(f"- **French original entries**: {len(french_entries)}")
    lines.append(f"- **Matched dates**: {len(matched_dates)}")
    lines.append(f"- **EPUB-only dates**: {len(epub_only)}")
    lines.append(f"- **French-only dates (not in Kernberger)**: {len(french_only)}")
    lines.append("")

    total_matched_paras = sum(len(r.matched_para_ids) for r in match_results)
    total_french_paras = sum(r.french_paragraph_count for r in match_results)
    lines.append(f"- **Matched paragraphs**: {total_matched_paras} / {total_french_paras}")
    lines.append("")

    # Per-year coverage
    lines.append("## Coverage by Year\n")
    years = {}
    for date_str in french_entries:
        year = date_str[:4]
        if year not in years:
            years[year] = {"total": 0, "in_kernberger": 0}
        years[year]["total"] += 1
        if date_str in matched_dates:
            years[year]["in_kernberger"] += 1

    lines.append("| Year | Total Entries | In Kernberger | Coverage |")
    lines.append("|------|-------------|---------------|----------|")
    for year in sorted(years.keys()):
        total = years[year]["total"]
        covered = years[year]["in_kernberger"]
        pct = covered * 100 // max(total, 1)
        lines.append(f"| {year} | {total} | {covered} | {pct}% |")
    lines.append("")

    # Per-carnet coverage
    lines.append("## Coverage by Carnet\n")
    carnet_coverage = {}
    for r in match_results:
        if r.carnet not in carnet_coverage:
            carnet_coverage[r.carnet] = {"entries": 0, "matched_paras": 0, "total_paras": 0}
        carnet_coverage[r.carnet]["entries"] += 1
        carnet_coverage[r.carnet]["matched_paras"] += len(r.matched_para_ids)
        carnet_coverage[r.carnet]["total_paras"] += r.french_paragraph_count

    lines.append("| Carnet | Entries | Matched Paras | Total Paras | Coverage |")
    lines.append("|--------|---------|--------------|-------------|----------|")
    for carnet in sorted(carnet_coverage.keys()):
        c = carnet_coverage[carnet]
        pct = c["matched_paras"] * 100 // max(c["total_paras"], 1)
        lines.append(f"| {carnet} | {c['entries']} | {c['matched_paras']} | {c['total_paras']} | {pct}% |")
    lines.append("")

    # EPUB-only dates (in Kernberger but we don't have French original)
    if epub_only:
        lines.append("## Dates Only in Kernberger EPUB\n")
        lines.append("These dates appear in the EPUB but not in our French originals:\n")
        for date_str in sorted(epub_only):
            entry = epub_entries[date_str]
            preview = entry.paragraphs[0][:100] if entry.paragraphs else ""
            lines.append(f"- **{date_str}** ({len(entry.paragraphs)} paras): `{preview}`")
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Subcommand: images (placeholder for Phase 3)
# ---------------------------------------------------------------------------

def cmd_images(args):
    """Extract images from the EPUB."""
    epub_path = Path(args.epub) if args.epub else EPUB_PATH
    book = open_epub(epub_path)

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Phase 3: Image extraction")
    print("=" * 60)

    # Extract images from manifest
    image_items = list(book.get_items_of_type(ebooklib.ITEM_IMAGE))
    print(f"Found {len(image_items)} images in EPUB manifest")

    # Extract context for each image from content documents
    doc_items = list(book.get_items_of_type(ebooklib.ITEM_DOCUMENT))
    image_contexts = {}  # src -> context info

    for item in doc_items:
        _, images, _ = extract_chapter_text(item)
        for img in images:
            if img["src"]:
                image_contexts[img["src"]] = img

    # Save images and generate report
    report = ["# Kernberger EPUB Image Report\n"]
    report.append(f"Total images: **{len(image_items)}**\n")

    extracted = 0
    for i, img_item in enumerate(image_items, 1):
        name = img_item.get_name() or f"image_{i:03d}"
        content = img_item.get_content()
        if not content:
            continue

        # Determine filename
        ext = name.rsplit(".", 1)[-1] if "." in name else "jpg"
        base_name = Path(name).stem
        out_name = f"kernberger_{i:03d}_{base_name}.{ext}"
        out_path = IMAGES_DIR / out_name

        with open(out_path, "wb") as f:
            f.write(content)
        extracted += 1

        # Report
        report.append(f"## Image {i}: `{out_name}`\n")
        report.append(f"- **Original path**: `{name}`")
        report.append(f"- **Type**: {img_item.media_type}")
        report.append(f"- **Size**: {len(content):,} bytes")

        # Add context if available
        ctx = image_contexts.get(name, {})
        if not ctx:
            # Try matching by filename only
            simple_name = Path(name).name
            for src, c in image_contexts.items():
                if Path(src).name == simple_name:
                    ctx = c
                    break

        if ctx:
            report.append(f"- **Alt text**: `{ctx.get('alt', 'N/A')}`")
            report.append(f"- **Context before**: `{ctx.get('context_before', 'N/A')[:150]}`")
            report.append(f"- **Context after**: `{ctx.get('context_after', 'N/A')[:150]}`")
        else:
            report.append("- **Context**: Not found in text")

        report.append("")

    report_path = REPORTS_DIR / "kernberger_images.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report))

    print(f"Extracted {extracted} images to: {IMAGES_DIR}")
    print(f"Report saved to: {report_path}")


# ---------------------------------------------------------------------------
# Subcommand: footnotes (placeholder for Phase 4)
# ---------------------------------------------------------------------------

def cmd_footnotes(args):
    """Extract footnotes from the EPUB."""
    epub_path = Path(args.epub) if args.epub else EPUB_PATH
    book = open_epub(epub_path)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Phase 4: Footnote extraction")
    print("=" * 60)

    doc_items = list(book.get_items_of_type(ebooklib.ITEM_DOCUMENT))
    all_footnotes = []

    for doc_idx, item in enumerate(doc_items):
        _, _, footnotes = extract_chapter_text(item)
        for fn in footnotes:
            fn["chapter_index"] = doc_idx
            fn["chapter_href"] = item.get_name()
            all_footnotes.append(fn)

    print(f"Found {len(all_footnotes)} footnotes across {len(doc_items)} documents")

    # Generate report
    report = ["# Kernberger EPUB Footnote Report\n"]
    report.append(f"Total footnotes: **{len(all_footnotes)}**\n")

    if all_footnotes:
        report.append("## All Footnotes\n")
        for i, fn in enumerate(all_footnotes, 1):
            report.append(f"### Footnote {i}\n")
            report.append(f"- **ID**: `{fn.get('id', 'N/A')}`")
            report.append(f"- **Chapter**: `{fn.get('chapter_href', 'N/A')}`")
            report.append(f"- **Reference context**: `{fn.get('ref_text', 'N/A')[:200]}`")
            report.append(f"- **Text**: {fn.get('text', 'N/A')}")
            report.append("")

    report_path = REPORTS_DIR / "kernberger_footnotes.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report))

    print(f"Report saved to: {report_path}")


# ---------------------------------------------------------------------------
# Subcommand: tag (placeholder for Phase 5)
# ---------------------------------------------------------------------------

def cmd_tag(args):
    """Tag French source files with #Kernberger markers."""
    dry_run = args.dry_run

    # Load matching data
    json_path = REPORTS_DIR / "kernberger_matching.json"
    if not json_path.exists():
        print("ERROR: Matching data not found. Run 'extract' first.")
        print(f"Expected: {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Phase 5: Tagging source files {'(DRY RUN)' if dry_run else ''}")
    print("=" * 60)

    # Collect all paragraph IDs to tag
    para_ids_to_tag = set()
    for match in data["matches"]:
        for pid in match["matched_para_ids"]:
            para_ids_to_tag.add(pid)

    print(f"Paragraphs to tag: {len(para_ids_to_tag)}")

    # TODO: Implement actual file tagging
    # For each paragraph ID, find the source file and add %% [#Kernberger] %% tag
    print("\nTagging implementation pending. Use the matching JSON data to proceed.")
    print(f"Data file: {json_path}")


# ---------------------------------------------------------------------------
# Subcommand: report (placeholder for Phase 6)
# ---------------------------------------------------------------------------

def cmd_report(args):
    """Generate comprehensive coverage report."""
    print("Phase 6: Coverage report generation")
    print("=" * 60)

    # Check which reports exist
    reports = [
        ("kernberger_structure.md", "Structure analysis"),
        ("kernberger_matching.md", "Text matching"),
        ("kernberger_images.md", "Image extraction"),
        ("kernberger_footnotes.md", "Footnote extraction"),
    ]

    print("\nAvailable reports:")
    for filename, desc in reports:
        path = REPORTS_DIR / filename
        status = "READY" if path.exists() else "NOT YET GENERATED"
        print(f"  {desc}: {status} ({path})")

    # TODO: Generate summary report combining all phases
    print("\nSummary report generation pending.")
    print("Run all phases first, then this command will combine results.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Analyze Kernberger English translation EPUB",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--epub", type=str, default=None,
        help=f"Path to EPUB file (default: {EPUB_PATH})",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # Analyze
    subparsers.add_parser("analyze", help="Analyze EPUB structure")

    # Extract
    subparsers.add_parser("extract", help="Extract text and match to French originals")

    # Images
    subparsers.add_parser("images", help="Extract images from EPUB")

    # Footnotes
    subparsers.add_parser("footnotes", help="Extract footnotes from EPUB")

    # Tag
    p_tag = subparsers.add_parser("tag", help="Tag French source files with #Kernberger")
    p_tag.add_argument("--dry-run", action="store_true", help="Report only, don't modify files")

    # Report
    subparsers.add_parser("report", help="Generate comprehensive coverage report")

    args = parser.parse_args()

    if args.command == "analyze":
        cmd_analyze(args)
    elif args.command == "extract":
        cmd_extract(args)
    elif args.command == "images":
        cmd_images(args)
    elif args.command == "footnotes":
        cmd_footnotes(args)
    elif args.command == "tag":
        cmd_tag(args)
    elif args.command == "report":
        cmd_report(args)


if __name__ == "__main__":
    main()
