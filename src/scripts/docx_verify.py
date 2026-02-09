#!/usr/bin/env python3
"""
Verify diary entries against source DOCX tomes.

Three subcommands:
  compare    - Text comparison to detect omissions/additions
  images     - Extract images from DOCX and map to entries
  formatting - Recover italic/bold/underline formatting

Usage:
  python3 src/scripts/docx_verify.py compare [--tome N]
  python3 src/scripts/docx_verify.py images [--tome N] [--min-size 5000]
  python3 src/scripts/docx_verify.py formatting [--tome N] [--dry-run]
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

from docx import Document
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from rapidfuzz import fuzz, process

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONTENT_RAW = PROJECT_ROOT / "content" / "_raw"
CONTENT_ORIGINAL = PROJECT_ROOT / "content" / "_original"
CARNET_MAPPING = CONTENT_ORIGINAL / "_carnets" / "carnet-mapping.json"
REPORTS_DIR = CONTENT_RAW / "reports"
IMAGES_DIR = CONTENT_RAW / "images"

DOCX_NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
}

# Regex for paragraph IDs, glossary links, and timestamped comments
RE_ANNOTATION = re.compile(r"^%%\s.*%%\s*$")
RE_FRONTMATTER = re.compile(r"^---\s*$")
RE_PAGE_NUMBER = re.compile(r"^\d{1,4}$")
RE_HEADING = re.compile(r"^#+\s+")
RE_FOOTNOTE_REF = re.compile(r"\[\^[^\]]+\]")
RE_FOOTNOTE_LINE = re.compile(r"^\[\^[^\]]+\]:\s")
RE_HTML_COMMENT = re.compile(r"^\[//\]:\s*#\s*\(.*\)\s*$")

# Similarity threshold for flagging anomalies
SIMILARITY_THRESHOLD = 70
# Minimum characters for a meaningful paragraph comparison
MIN_PARA_CHARS = 10


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class FormattedRun:
    """A run of text with formatting info."""
    text: str
    bold: bool = False
    italic: bool = False
    underline: bool = False
    strike: bool = False


@dataclass
class DocxParagraph:
    """A paragraph from the DOCX with its runs and position."""
    index: int
    text: str
    runs: list[FormattedRun] = field(default_factory=list)
    has_image: bool = False
    image_rel_id: str = ""


@dataclass
class EntryParagraph:
    """A paragraph from an entry file."""
    para_id: str  # e.g., "015.0003"
    text: str
    entry_date: str
    carnet: str
    file_path: Path
    line_number: int


# ---------------------------------------------------------------------------
# Mapping helpers
# ---------------------------------------------------------------------------

def load_mapping() -> dict:
    """Load carnet-mapping.json."""
    with open(CARNET_MAPPING, "r", encoding="utf-8") as f:
        return json.load(f)


def get_tome_carnets(mapping: dict, tome_num: int) -> list[str]:
    """Get ordered list of carnet IDs for a given tome number."""
    book_key = f"{tome_num:02d}"
    books = mapping.get("books", {})
    if book_key not in books:
        return []
    return books[book_key]["carnets"]


def tome_path(tome_num: int) -> Path:
    """Get path to a tome DOCX file."""
    return CONTENT_RAW / f"tome{tome_num:02d}.docx"


# ---------------------------------------------------------------------------
# DOCX parsing
# ---------------------------------------------------------------------------

def parse_docx_paragraphs(docx_path: Path) -> list[DocxParagraph]:
    """Parse a DOCX file and return paragraphs with formatting and image info."""
    doc = Document(str(docx_path))
    paragraphs = []

    # Also parse the raw XML for image detection (python-docx doesn't expose this well)
    image_para_indices = _find_image_paragraphs(docx_path)

    for i, para in enumerate(doc.paragraphs):
        runs = []
        for run in para.runs:
            fmt_run = FormattedRun(
                text=run.text,
                bold=run.bold is True,
                italic=run.italic is True,
                underline=run.underline is not None and run.underline is not False,
                strike=run.font.strike is True,
            )
            runs.append(fmt_run)

        text = para.text.strip()
        has_img = i in image_para_indices
        img_rel = image_para_indices.get(i, "")

        paragraphs.append(DocxParagraph(
            index=i,
            text=text,
            runs=runs,
            has_image=has_img,
            image_rel_id=img_rel,
        ))

    return paragraphs


def _find_image_paragraphs(docx_path: Path) -> dict[int, str]:
    """Parse raw XML to find which paragraphs contain images. Returns {para_index: rel_id}."""
    result = {}
    with zipfile.ZipFile(docx_path, "r") as z:
        xml = z.read("word/document.xml")
        root = ET.fromstring(xml)
        body = root.find("w:body", DOCX_NS)
        if body is None:
            return result

        for i, para in enumerate(body.findall("w:p", DOCX_NS)):
            # Look for drawing elements containing blip references
            blips = para.findall(
                f".//{{{DOCX_NS['a']}}}blip"
            )
            for blip in blips:
                embed = blip.get(f"{{{DOCX_NS['r']}}}embed", "")
                if embed:
                    result[i] = embed
                    break
    return result


def get_image_rels(docx_path: Path) -> dict[str, str]:
    """Get mapping of relationship IDs to image filenames in the DOCX."""
    rels = {}
    with zipfile.ZipFile(docx_path, "r") as z:
        rels_path = "word/_rels/document.xml.rels"
        if rels_path not in z.namelist():
            return rels
        rels_xml = z.read(rels_path)
        root = ET.fromstring(rels_xml)
        for rel in root:
            rid = rel.get("Id", "")
            target = rel.get("Target", "")
            if "media/" in target or "image" in target.lower():
                rels[rid] = target
    return rels


def filter_docx_paragraphs(paragraphs: list[DocxParagraph]) -> list[DocxParagraph]:
    """Filter out noise paragraphs (empty, page numbers, boilerplate)."""
    result = []
    for p in paragraphs:
        text = p.text.strip()
        if not text:
            # Keep image-only paragraphs
            if p.has_image:
                result.append(p)
            continue
        # Skip standalone page numbers
        if RE_PAGE_NUMBER.match(text):
            continue
        result.append(p)
    return result


# ---------------------------------------------------------------------------
# Entry parsing
# ---------------------------------------------------------------------------

def load_entry_paragraphs(carnet_id: str) -> list[EntryParagraph]:
    """Load all entry paragraphs for a carnet, in date order."""
    carnet_dir = CONTENT_ORIGINAL / carnet_id
    if not carnet_dir.is_dir():
        print(f"  WARNING: Carnet directory not found: {carnet_dir}", file=sys.stderr)
        return []

    # Get all entry files sorted by name (date-based filenames sort correctly)
    entry_files = sorted(carnet_dir.glob("*.md"))
    # Exclude README.md and other non-entry files
    entry_files = [f for f in entry_files if f.name != "README.md" and not f.name.startswith("_")]

    paragraphs = []
    for fpath in entry_files:
        date_str = fpath.stem  # e.g., "1874-01-02"
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

        # Handle frontmatter
        if RE_FRONTMATTER.match(stripped):
            in_frontmatter = not in_frontmatter
            continue
        if in_frontmatter:
            continue

        # Handle multi-line comments: track %% open/close
        if in_multiline_comment:
            if stripped.endswith("%%"):
                in_multiline_comment = False
            continue

        # Single-line annotation: starts and ends with %%
        if RE_ANNOTATION.match(stripped):
            id_match = re.match(r"^%%\s+(\d{3}\.\d{4})\s+%%$", stripped)
            if id_match:
                # Save previous paragraph if any
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

        # Multi-line comment start: starts with %% but doesn't end with %%
        if stripped.startswith("%%") and not stripped.endswith("%%"):
            in_multiline_comment = True
            continue

        # Actual content line
        if stripped:
            # Skip footnote definition lines (e.g., "[^01.25.1]: text...")
            if RE_FOOTNOTE_LINE.match(stripped):
                continue
            # Skip HTML-style comments: [//]: # (comment text)
            if RE_HTML_COMMENT.match(stripped):
                continue
            # Strip markdown heading prefix for comparison
            content = RE_HEADING.sub("", stripped)
            # Strip footnote references (e.g., "[^01.13.1]")
            content = RE_FOOTNOTE_REF.sub("", content).strip()
            if not content:
                continue
            if not current_text_lines:
                current_line_start = line_num
            current_text_lines.append(content)
        elif current_text_lines:
            current_text_lines.append("")

    # Save last paragraph
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


# ---------------------------------------------------------------------------
# Alignment (used by formatting subcommand)
# ---------------------------------------------------------------------------

def align_paragraphs(
    docx_paras: list[DocxParagraph],
    entry_paras: list[EntryParagraph],
) -> list[tuple[DocxParagraph | None, EntryParagraph | None, float]]:
    """
    Align docx paragraphs with entry paragraphs using sequential best-match.
    Preserves order and greedily matches each entry to the next available docx para.
    """
    aligned = []
    docx_idx = 0

    for ep in entry_paras:
        if len(ep.text) < MIN_PARA_CHARS:
            continue

        best_score = 0
        best_di = -1

        # Search forward in docx from current position (allow some lookahead)
        search_end = min(docx_idx + 50, len(docx_paras))
        for di in range(docx_idx, search_end):
            dp = docx_paras[di]
            if len(dp.text) < MIN_PARA_CHARS:
                continue
            score = fuzz.ratio(dp.text[:200], ep.text[:200])
            if score > best_score:
                best_score = score
                best_di = di

        if best_score >= 60 and best_di >= 0:
            aligned.append((docx_paras[best_di], ep, best_score))
            docx_idx = best_di + 1
        else:
            aligned.append((None, ep, 0.0))

    return aligned


# ---------------------------------------------------------------------------
# Subcommand: compare
# ---------------------------------------------------------------------------

def cmd_compare(args):
    """Compare text content between DOCX tomes and entry files.

    Strategy: substring containment check on continuous text.
    For each entry paragraph, check if a representative chunk appears
    in the concatenated docx text. This handles paragraph splitting
    and minor OCR corrections gracefully.
    """
    mapping = load_mapping()
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    tomes = [args.tome] if args.tome else list(range(1, 17))

    report_lines = [
        "# DOCX vs Entries Comparison Report\n",
        f"Generated by `docx_verify.py compare`\n",
        "",
    ]

    total_not_found = 0

    for tome_num in tomes:
        dp = tome_path(tome_num)
        if not dp.exists():
            print(f"Skipping tome {tome_num:02d}: file not found")
            continue

        print(f"Processing tome {tome_num:02d}...")
        carnets = get_tome_carnets(mapping, tome_num)
        if not carnets:
            print(f"  No carnets mapped to tome {tome_num:02d}")
            continue

        # Build one big normalized docx text for substring searching
        docx_paras = parse_docx_paragraphs(dp)
        docx_full_text = " ".join(
            p.text.strip() for p in docx_paras
            if p.text.strip() and not RE_PAGE_NUMBER.match(p.text.strip())
        )
        docx_normalized = _normalize(docx_full_text)

        # Load entry paragraphs
        all_entry_paras = []
        carnet_counts = {}
        for cid in carnets:
            eparas = load_entry_paragraphs(cid)
            carnet_counts[cid] = len(eparas)
            all_entry_paras.extend(eparas)

        print(f"  DOCX: {len(docx_normalized)} chars, {len(docx_paras)} paragraphs")
        print(f"  Entries: {len(all_entry_paras)} paragraphs across {len(carnets)} carnets")

        # For each entry paragraph, check containment
        found_count = 0
        not_found = []  # (entry_para, best_score)

        for ep in all_entry_paras:
            text = ep.text.replace("\n", " ").strip()
            norm_text = _normalize(text)

            # Skip very short paragraphs - can't reliably match
            if len(norm_text) < 15:
                found_count += 1
                continue

            is_found = False

            # Strategy 1: check if a chunk from the middle of the entry exists in docx
            for probe_len in [40, 30, 20, 15]:
                if len(norm_text) < probe_len:
                    continue
                mid = len(norm_text) // 2
                start = max(0, mid - probe_len // 2)
                probe = norm_text[start:start + probe_len]
                if probe in docx_normalized:
                    is_found = True
                    break

            if not is_found:
                # Strategy 2: try the beginning (skip first 5 chars to avoid OCR boundary issues)
                offset = min(5, len(norm_text) // 4)
                probe = norm_text[offset:offset + 25]
                if len(probe) >= 15 and probe in docx_normalized:
                    is_found = True

            if not is_found:
                # Strategy 3: try the end
                probe = norm_text[-25:]
                if len(probe) >= 15 and probe in docx_normalized:
                    is_found = True

            if is_found:
                found_count += 1
            else:
                # Compute fuzzy score against nearby docx text for the report
                best_score = _best_fuzzy_score(norm_text[:150], docx_normalized)
                not_found.append((ep, best_score))

        pct = found_count * 100 // max(len(all_entry_paras), 1)
        total_not_found += len(not_found)

        print(f"  Found: {found_count}/{len(all_entry_paras)} ({pct}%)")
        print(f"  Not found: {len(not_found)}")

        # Report
        report_lines.append(f"## Tome {tome_num:02d} (Carnets {carnets[0]}-{carnets[-1]})\n")
        report_lines.append(f"| Metric | Value |")
        report_lines.append(f"|--------|-------|")
        report_lines.append(f"| DOCX paragraphs | {len(docx_paras)} |")
        report_lines.append(f"| Entry paragraphs | {len(all_entry_paras)} |")
        report_lines.append(f"| Found in DOCX | {found_count} ({pct}%) |")
        report_lines.append(f"| Not found | {len(not_found)} |")
        report_lines.append("")

        # Per-carnet counts
        report_lines.append("### Per-carnet paragraph counts\n")
        for cid in carnets:
            report_lines.append(f"- **{cid}**: {carnet_counts.get(cid, 0)} paragraphs")
        report_lines.append("")

        if not_found:
            # Separate significant (long, non-structural) from trivial (dates, short dialogue)
            significant = []
            trivial = []
            for ep, score in not_found:
                text = ep.text.replace("\n", " ").strip()
                is_trivial = (
                    len(text) < 30
                    or re.match(r"^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche),?\s", text)
                    or text.startswith("[")  # editorial notes
                    or text.startswith("—") and len(text) < 50  # short dialogue
                    or text.startswith("-") and len(text) < 50
                    or text.startswith("--") and len(text) < 50
                )
                if is_trivial:
                    trivial.append((ep, score))
                else:
                    significant.append((ep, score))

            report_lines.append(f"### Entry paragraphs NOT found in DOCX ({len(not_found)})\n")

            if significant:
                report_lines.append(f"#### Significant ({len(significant)}) - REVIEW THESE\n")
                report_lines.append("Substantial text not found in DOCX source:\n")
                for ep, score in significant:
                    preview = ep.text[:200].replace("\n", " ")
                    report_lines.append(f"- **{ep.para_id}** ({ep.entry_date}, {ep.carnet}) "
                                        f"[fuzzy:{score:.0f}%]: `{preview}`")
                report_lines.append("")

            if trivial:
                report_lines.append(f"#### Trivial ({len(trivial)}) - expected noise\n")
                report_lines.append("Short fragments, date headers, dialogue, editorial notes:\n")
                for ep, score in trivial[:30]:
                    preview = ep.text[:120].replace("\n", " ")
                    report_lines.append(f"- **{ep.para_id}** ({ep.entry_date}): `{preview}`")
                if len(trivial) > 30:
                    report_lines.append(f"- ... and {len(trivial) - 30} more")
                report_lines.append("")

        report_lines.append("---\n")

    report_lines.insert(2, f"**Total entry paragraphs not found in DOCX: {total_not_found}**\n")

    report_path = REPORTS_DIR / "comparison_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"\nReport saved to: {report_path}")
    print(f"Total not found: {total_not_found}")


def _normalize(text: str) -> str:
    """Normalize text for comparison: lowercase, strip accents, collapse whitespace."""
    t = text.lower()
    # Strip accents: é→e, à→a, etc.
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r'\s+', ' ', t)
    # Normalize common OCR variations
    t = t.replace("'", "'").replace("\u2019", "'").replace("\u2018", "'")
    t = t.replace("\u00ab", '"').replace("\u00bb", '"')
    t = t.replace("\u2013", "-").replace("\u2014", "-")
    t = t.strip()
    return t


def _best_fuzzy_score(text: str, full_docx: str) -> float:
    """Find the best fuzzy match score for text within the docx, sampling positions."""
    if not text:
        return 0.0
    # Sample a few positions where the first word might appear
    first_word = text.split()[0] if text.split() else ""
    if not first_word or len(first_word) < 3:
        return 0.0

    best = 0.0
    start = 0
    for _ in range(5):  # Check up to 5 occurrences of the first word
        pos = full_docx.find(first_word, start)
        if pos < 0:
            break
        window = full_docx[pos:pos + len(text) + 20]
        score = fuzz.ratio(text, window)
        if score > best:
            best = score
        start = pos + 1

    return best




# ---------------------------------------------------------------------------
# Subcommand: images
# ---------------------------------------------------------------------------

def cmd_images(args):
    """Extract images from DOCX files and map to entries."""
    mapping = load_mapping()
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    tomes = [args.tome] if args.tome else list(range(1, 17))
    min_size = args.min_size

    report_lines = [
        "# Image Extraction Report\n",
        f"Minimum size filter: {min_size} bytes\n",
        "",
    ]

    total_extracted = 0
    total_skipped = 0

    for tome_num in tomes:
        dp = tome_path(tome_num)
        if not dp.exists():
            continue

        print(f"Processing tome {tome_num:02d}...")
        carnets = get_tome_carnets(mapping, tome_num)

        # Get image file info from zip
        with zipfile.ZipFile(dp, "r") as z:
            media_files = {
                name: z.getinfo(name)
                for name in z.namelist()
                if name.startswith("word/media/")
            }

        if not media_files:
            print(f"  No images found")
            continue

        # Get relationship mapping
        rels = get_image_rels(dp)

        # Parse DOCX for image positions and context
        docx_paras = parse_docx_paragraphs(dp)
        docx_filtered = filter_docx_paragraphs(docx_paras)

        # Load entry paragraphs for context matching
        all_entry_paras = []
        for cid in carnets:
            all_entry_paras.extend(load_entry_paragraphs(cid))

        # Find images with their context
        image_entries = []
        for p in docx_paras:
            if not p.has_image:
                continue

            # Get the actual filename from rels
            rel_target = rels.get(p.image_rel_id, "")
            if not rel_target:
                continue

            # Normalize path
            media_path = rel_target if rel_target.startswith("word/") else f"word/{rel_target}"

            # Check file size
            if media_path not in media_files:
                continue
            file_size = media_files[media_path].file_size
            if file_size < min_size:
                total_skipped += 1
                continue

            # Get surrounding text context
            prev_text = ""
            next_text = ""
            for dp2 in docx_paras:
                if dp2.index == p.index - 1 and dp2.text.strip():
                    prev_text = dp2.text.strip()
                elif dp2.index == p.index - 2 and not prev_text and dp2.text.strip():
                    prev_text = dp2.text.strip()
                if dp2.index == p.index + 1 and dp2.text.strip():
                    next_text = dp2.text.strip()
                elif dp2.index == p.index + 2 and not next_text and dp2.text.strip():
                    next_text = dp2.text.strip()

            # Try to match to an entry paragraph using surrounding context
            best_match = _find_entry_context(prev_text, next_text, all_entry_paras)

            ext = media_path.rsplit(".", 1)[-1]
            image_entries.append({
                "tome": tome_num,
                "docx_para": p.index,
                "media_path": media_path,
                "file_size": file_size,
                "ext": ext,
                "prev_text": prev_text,
                "next_text": next_text,
                "matched_entry": best_match,
            })

        # Extract and save images
        if image_entries:
            out_dir = IMAGES_DIR / f"tome{tome_num:02d}"
            out_dir.mkdir(parents=True, exist_ok=True)

            with zipfile.ZipFile(dp, "r") as z:
                for idx, img in enumerate(image_entries, 1):
                    out_name = f"tome{tome_num:02d}_img{idx:02d}_para{img['docx_para']}.{img['ext']}"
                    out_path = out_dir / out_name
                    data = z.read(img["media_path"])
                    with open(out_path, "wb") as f:
                        f.write(data)
                    img["saved_as"] = out_name
                    total_extracted += 1

        # Report
        report_lines.append(f"## Tome {tome_num:02d}\n")

        if not image_entries:
            report_lines.append("No images above size threshold.\n")
        else:
            report_lines.append(f"Extracted: {len(image_entries)} images\n")
            for img in image_entries:
                match = img["matched_entry"]
                report_lines.append(f"### {img.get('saved_as', 'unknown')}\n")
                report_lines.append(f"- **Size**: {img['file_size']} bytes")
                report_lines.append(f"- **DOCX paragraph**: {img['docx_para']}")
                if match:
                    report_lines.append(f"- **Mapped to**: {match['para_id']} ({match['entry_date']})")
                    report_lines.append(f"- **Carnet**: {match['carnet']}")
                    report_lines.append(f"- **File**: `{match['file_path']}`")
                else:
                    report_lines.append(f"- **Mapped to**: UNMAPPED")
                report_lines.append(f"- **Context before**: `{img['prev_text'][:100]}`")
                report_lines.append(f"- **Context after**: `{img['next_text'][:100]}`")
                if match:
                    rel_path = f"../../_raw/images/tome{tome_num:02d}/{img.get('saved_as', '')}"
                    report_lines.append(f"- **Suggested markdown**: `![image]({rel_path})`")
                report_lines.append("")

        report_lines.append("---\n")

    report_lines.insert(2, f"**Total extracted: {total_extracted} | Skipped (too small): {total_skipped}**\n")

    report_path = REPORTS_DIR / "image_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"\nReport saved to: {report_path}")
    print(f"Extracted: {total_extracted}, Skipped: {total_skipped}")


def _find_entry_context(
    prev_text: str, next_text: str, entry_paras: list[EntryParagraph]
) -> dict | None:
    """Find the entry paragraph that best matches the surrounding context of an image."""
    if not entry_paras or (not prev_text and not next_text):
        return None

    best_score = 0
    best_idx = -1

    for i, ep in enumerate(entry_paras):
        score = 0
        if prev_text:
            score += fuzz.partial_ratio(prev_text[:80], ep.text[:80])
        if next_text and i + 1 < len(entry_paras):
            score += fuzz.partial_ratio(next_text[:80], entry_paras[i + 1].text[:80])
        elif next_text:
            score += fuzz.partial_ratio(next_text[:80], ep.text[:80])

        if score > best_score:
            best_score = score
            best_idx = i

    if best_idx >= 0 and best_score > 100:  # At least moderate match on one side
        ep = entry_paras[best_idx]
        return {
            "para_id": ep.para_id,
            "entry_date": ep.entry_date,
            "carnet": ep.carnet,
            "file_path": str(ep.file_path.relative_to(PROJECT_ROOT)),
            "score": best_score,
        }
    return None


# ---------------------------------------------------------------------------
# Subcommand: formatting
# ---------------------------------------------------------------------------

def cmd_formatting(args):
    """Recover formatting from DOCX and apply to entry files.

    For each entry paragraph, finds the corresponding text in the DOCX
    using substring matching, then extracts formatting (italic/bold/etc)
    from the DOCX runs and applies markdown formatting to the entry.
    """
    mapping = load_mapping()
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    tomes = [args.tome] if args.tome else list(range(1, 17))
    dry_run = args.dry_run

    report_lines = [
        "# Formatting Recovery Report\n",
        f"Mode: {'DRY RUN' if dry_run else 'APPLIED'}\n",
        "",
    ]

    total_modifications = 0
    total_files_modified = 0

    for tome_num in tomes:
        dp = tome_path(tome_num)
        if not dp.exists():
            continue

        print(f"Processing tome {tome_num:02d}...")
        carnets = get_tome_carnets(mapping, tome_num)

        # Parse DOCX with full formatting info
        docx_paras = parse_docx_paragraphs(dp)

        # Check for bold anomaly
        bold_run_count = sum(1 for p in docx_paras for r in p.runs if r.bold)
        total_run_count = sum(len(p.runs) for p in docx_paras)
        bold_ratio = bold_run_count / total_run_count if total_run_count > 0 else 0
        skip_bold = bold_ratio > 0.5
        if skip_bold:
            print(f"  NOTE: {bold_ratio:.0%} bold ratio - skipping bold for this tome")

        # Build a lookup: for each docx paragraph, store normalized text and formatting
        docx_formatted = []  # list of (normalized_text, paragraph)
        for p in docx_paras:
            if not p.text.strip():
                continue
            norm = _normalize(p.text)
            docx_formatted.append((norm, p))

        # Build concatenated normalized docx text for substring matching
        docx_full_norm = _normalize(" ".join(p.text for p in docx_paras if p.text.strip()))

        # Load entry paragraphs
        all_entry_paras = []
        for cid in carnets:
            all_entry_paras.extend(load_entry_paragraphs(cid))

        # For each entry paragraph, find matching docx paragraph and extract formatting
        patches: dict[Path, list[tuple[int, str, str]]] = {}
        tome_mods = 0
        matched = 0

        for ep in all_entry_paras:
            text = ep.text.replace("\n", " ").strip()
            if len(text) < MIN_PARA_CHARS:
                continue

            # Find matching docx paragraph(s)
            norm_text = _normalize(text)
            best_docx_p = _find_docx_paragraph(norm_text, docx_formatted)

            if not best_docx_p:
                continue

            matched += 1

            # Check if this docx paragraph has formatting worth recovering
            has_formatting = any(
                (r.italic or (r.bold and not skip_bold) or r.underline or r.strike)
                for r in best_docx_p.runs
                if r.text.strip()
            )
            if not has_formatting:
                continue

            # Apply formatting
            new_text = _apply_formatting(best_docx_p, ep.text, skip_bold)
            if new_text and new_text != ep.text:
                if ep.file_path not in patches:
                    patches[ep.file_path] = []
                patches[ep.file_path].append((ep.line_number, ep.text, new_text))
                tome_mods += 1

        # Apply patches
        files_modified = 0
        if not dry_run and patches:
            for fpath, file_patches in patches.items():
                if _apply_patches_to_file(fpath, file_patches):
                    files_modified += 1

        total_modifications += tome_mods
        total_files_modified += files_modified

        print(f"  Matched: {matched}/{len(all_entry_paras)} paragraphs")
        print(f"  Formatting changes: {tome_mods} in {files_modified} files")

        # Report
        report_lines.append(f"## Tome {tome_num:02d}\n")
        report_lines.append(f"- Paragraphs matched: {matched}/{len(all_entry_paras)}")
        report_lines.append(f"- Bold skipped: {skip_bold} ({bold_ratio:.0%})")
        report_lines.append(f"- Formatting changes: {tome_mods}")
        report_lines.append(f"- Files modified: {files_modified}")
        report_lines.append("")

        if tome_mods > 0:
            report_lines.append("### Changes\n")
            for fpath, file_patches in patches.items():
                rel = fpath.relative_to(PROJECT_ROOT)
                report_lines.append(f"**{rel}**:")
                for line_num, old, new in file_patches[:20]:
                    old_preview = old[:100].replace("\n", " ")
                    new_preview = new[:100].replace("\n", " ")
                    report_lines.append(f"- L{line_num}: `{old_preview}` → `{new_preview}`")
                if len(file_patches) > 20:
                    report_lines.append(f"  ... and {len(file_patches) - 20} more changes")
                report_lines.append("")

        report_lines.append("---\n")

    report_lines.insert(2, f"**Total: {total_modifications} formatting changes in {total_files_modified} files**\n")

    report_path = REPORTS_DIR / "formatting_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"\nReport saved to: {report_path}")
    print(f"Total: {total_modifications} changes in {total_files_modified} files")


def _find_docx_paragraph(
    norm_entry_text: str, docx_formatted: list[tuple[str, DocxParagraph]]
) -> DocxParagraph | None:
    """Find the docx paragraph that best matches an entry paragraph text."""
    # Try exact substring match first (entry text contained in docx para)
    for norm_docx, dp in docx_formatted:
        if len(norm_entry_text) >= 20 and norm_entry_text[:30] in norm_docx:
            return dp

    # Try middle-of-text match
    if len(norm_entry_text) >= 30:
        mid = len(norm_entry_text) // 2
        probe = norm_entry_text[mid-15:mid+15]
        for norm_docx, dp in docx_formatted:
            if probe in norm_docx:
                return dp

    # Fuzzy match as fallback
    best_score = 0
    best_dp = None
    for norm_docx, dp in docx_formatted:
        score = fuzz.partial_ratio(norm_entry_text[:100], norm_docx[:200])
        if score > best_score and score >= 85:
            best_score = score
            best_dp = dp

    return best_dp


def _apply_formatting(docx_p: DocxParagraph, entry_text: str, skip_bold: bool) -> str | None:
    """
    Apply formatting from DOCX paragraph to entry text.
    Merges adjacent runs with the same formatting into single spans.
    Returns modified text or None if no changes needed.
    """
    # Build list of formatted spans, merging adjacent runs with same formatting
    formatted_spans = []  # list of (text, frozenset of formats)

    for run in docx_p.runs:
        text = run.text
        if not text:
            continue

        formats = set()
        if run.italic:
            formats.add("italic")
        if run.bold and not skip_bold:
            formats.add("bold")
        if run.underline:
            formats.add("underline")
        if run.strike:
            formats.add("strike")

        frozen_fmt = frozenset(formats)

        if formats and formatted_spans and formatted_spans[-1][1] == frozen_fmt:
            # Merge with previous span (same formatting)
            prev_text, prev_fmt = formatted_spans[-1]
            formatted_spans[-1] = (prev_text + text, prev_fmt)
        elif formats:
            formatted_spans.append((text, frozen_fmt))
        # If no formatting, don't merge - this breaks the chain

    if not formatted_spans:
        return None

    result = entry_text
    changed = False

    for span_text, formats in formatted_spans:
        span_text = span_text.strip()
        if not span_text or len(span_text) < 2:
            continue

        # Try to find this text span in the entry
        pos = _find_span_in_text(span_text, result)
        if pos is None:
            continue

        start, end = pos
        original_span = result[start:end]

        # Check if already formatted
        if _is_already_formatted(result, start, end):
            continue

        # Apply markdown formatting (innermost first)
        wrapped = original_span
        if "strike" in formats:
            wrapped = f"~~{wrapped}~~"
        if "underline" in formats:
            wrapped = f"<u>{wrapped}</u>"
        if "italic" in formats:
            wrapped = f"*{wrapped}*"
        if "bold" in formats:
            wrapped = f"**{wrapped}**"

        if wrapped != original_span:
            result = result[:start] + wrapped + result[end:]
            changed = True

    return result if changed else None


def _find_span_in_text(span: str, text: str) -> tuple[int, int] | None:
    """Find a text span in the entry text, using exact match first then fuzzy."""
    # Exact match
    idx = text.find(span)
    if idx >= 0:
        return (idx, idx + len(span))

    # Try with minor variations (whitespace normalization)
    normalized_span = " ".join(span.split())
    idx = text.find(normalized_span)
    if idx >= 0:
        return (idx, idx + len(normalized_span))

    # Try partial match - find the best matching substring
    # Only for spans that are long enough to be meaningful
    if len(span) >= 5:
        best_score = 0
        best_pos = None
        span_len = len(span)

        # Slide a window of similar length across the text
        for i in range(len(text) - span_len + 1):
            window = text[i:i + span_len]
            score = fuzz.ratio(span, window)
            if score > best_score and score >= 85:
                best_score = score
                best_pos = (i, i + span_len)

        # Also try slightly different window sizes
        for delta in [-2, -1, 1, 2]:
            wlen = span_len + delta
            if wlen < 3 or wlen > len(text):
                continue
            for i in range(len(text) - wlen + 1):
                window = text[i:i + wlen]
                score = fuzz.ratio(span, window)
                if score > best_score and score >= 85:
                    best_score = score
                    best_pos = (i, i + wlen)

        return best_pos

    return None


def _is_already_formatted(text: str, start: int, end: int) -> bool:
    """Check if the span at [start:end] is already wrapped in markdown formatting."""
    # Check for surrounding * or ** or ~~ or <u>
    before = text[max(0, start - 2):start]
    after = text[end:end + 2]

    if before.endswith("*") and after.startswith("*"):
        return True
    if before.endswith("~~") and after.startswith("~~"):
        return True
    if text[max(0, start - 3):start] == "<u>" and text[end:end + 4] == "</u>":
        return True

    return False


def _apply_patches_to_file(fpath: Path, patches: list[tuple[int, str, str]]) -> bool:
    """Apply text patches to a file. Returns True if file was modified."""
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    modified = False
    for _, old_text, new_text in patches:
        if old_text in content:
            content = content.replace(old_text, new_text, 1)
            modified = True

    if modified:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)

    return modified


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Verify diary entries against source DOCX tomes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Compare subcommand
    p_compare = subparsers.add_parser("compare", help="Compare text content")
    p_compare.add_argument("--tome", type=int, help="Process only this tome number (1-16)")

    # Images subcommand
    p_images = subparsers.add_parser("images", help="Extract images from DOCX")
    p_images.add_argument("--tome", type=int, help="Process only this tome number (1-16)")
    p_images.add_argument("--min-size", type=int, default=5000, help="Minimum image size in bytes (default: 5000)")

    # Formatting subcommand
    p_formatting = subparsers.add_parser("formatting", help="Recover formatting from DOCX")
    p_formatting.add_argument("--tome", type=int, help="Process only this tome number (1-16)")
    p_formatting.add_argument("--dry-run", action="store_true", help="Report only, don't modify files")

    args = parser.parse_args()

    if args.command == "compare":
        cmd_compare(args)
    elif args.command == "images":
        cmd_images(args)
    elif args.command == "formatting":
        cmd_formatting(args)


if __name__ == "__main__":
    main()
