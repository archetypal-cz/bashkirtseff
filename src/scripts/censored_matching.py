#!/usr/bin/env python3
"""
Match the 1887 censored French edition against our uncensored French originals.

The first published edition of Marie Bashkirtseff's diary (Charpentier, 1887,
edited by André Theuriet) included only ~25% of the full diary, censored by
Marie's mother. This script parses the OCR'd text, matches entries and
paragraphs to our uncensored originals, and tags matched paragraphs.

Source: Internet Archive OCR text of the 1903 Fasquelle reprint.

Subcommands:
  parse    - Parse OCR text files, extract entries by date
  extract  - Match censored entries to French originals
  tag      - Tag matched paragraphs with #Censored_1887
  report   - Generate coverage report

Usage:
  uv run --with rapidfuzz python3 src/scripts/censored_matching.py parse
  uv run --with rapidfuzz python3 src/scripts/censored_matching.py extract
  uv run --with rapidfuzz python3 src/scripts/censored_matching.py tag --dry-run
"""

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

try:
    from rapidfuzz import fuzz
except ImportError:
    fuzz = None

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONTENT_ORIGINAL = PROJECT_ROOT / "content" / "_original"
REPORTS_DIR = PROJECT_ROOT / "content" / "_raw" / "reports"
CARNET_MAPPING = CONTENT_ORIGINAL / "_carnets" / "carnet-mapping.json"

VOL1_PATH = PROJECT_ROOT / "raw_books" / "Journal_censored_vol1.txt"
VOL2_PATH = PROJECT_ROOT / "raw_books" / "Journal_censored_vol2.txt"

TAG_LINE = "%% [#Censored_1887](../_glossary/culture/literature/CENSORED_1887.md) %%"
FM_KEY = "censored_1887_included"

MIN_PARA_CHARS = 15  # Minimum chars for a meaningful paragraph

# French month names (with OCR variants)
FR_MONTHS = {
    "janvier": 1, "février": 2, "fevrier": 2, "fëvrier": 2,
    "mars": 3, "avril": 4, "mai": 5, "juin": 6,
    "juillet": 7, "août": 8, "aout": 8, "aoùt": 8, "zoût": 8,
    "septembre": 9, "octobre": 10,
    "novembre": 11, "décembre": 12, "decembre": 12, "dé-cembre": 12,
}

FR_DAYS = {"Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"}

# Noise patterns to strip
RE_PAGE_HEADER = re.compile(
    r"^\s*(?:DE\s+MARIE\s+BASH|JOURNAL\s*$|M\.\s*B\.\s*\d|"
    r"DE\s+MARIE\s+BASHKIRTSEFF|BASHKIRTSEFF)",
    re.IGNORECASE,
)
RE_PAGE_NUMBER = re.compile(r"^\s*\d{1,3}\s*$")
RE_ASTERISKS = re.compile(r"^\s*[*•]+\s*[*•]*\s*$")
RE_YEAR_LINE = re.compile(r"^\s*[i1l]?([89]\d{2})\s*$")


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class CensoredEntry:
    """A diary entry from the censored edition."""
    date_str: str  # ISO format: YYYY-MM-DD
    volume: int
    raw_text: str  # Original OCR text
    paragraphs: list[str] = field(default_factory=list)  # Cleaned paragraphs


@dataclass
class EntryParagraph:
    """A paragraph from a French original entry file."""
    para_id: str
    text: str
    entry_date: str
    carnet: str
    file_path: Path
    line_number: int


@dataclass
class MatchResult:
    """Result of matching a censored entry to French originals."""
    date_str: str
    carnet: str
    censored_paragraph_count: int
    french_paragraph_count: int
    matched_para_ids: list[str]
    confidence: float
    notes: str = ""


# ---------------------------------------------------------------------------
# Text normalization (same as epub_kernberger.py)
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


# ---------------------------------------------------------------------------
# OCR helpers
# ---------------------------------------------------------------------------

def _ocr_fix_number(s: str) -> str:
    """Fix common OCR misreads in numbers."""
    s = s.replace("g", "9")  # g -> 9
    s = s.replace("G", "9")
    s = re.sub(r"[il]", "1", s)  # i/l -> 1 in numeric context
    s = s.replace("$", "3")
    s = s.replace("o", "0").replace("O", "0")
    s = re.sub(r"\s+", "", s)  # collapse spaces in numbers like "1 7" -> "17"
    return s


def _ocr_clean_line(line: str) -> str:
    """Basic OCR cleanup for a line of text."""
    # Collapse multiple spaces
    line = re.sub(r"  +", " ", line)
    # Fix apostrophes
    line = line.replace("d!", "d'").replace("l!", "l'").replace("n!", "n'")
    line = line.replace("J!", "J'").replace("c!", "c'").replace("s!", "s'")
    return line.strip()


def _is_noise(line: str) -> bool:
    """Check if a line is page header/footer noise."""
    stripped = line.strip()
    if not stripped:
        return False  # blank lines are structural, not noise
    if RE_PAGE_HEADER.match(stripped):
        return True
    if RE_PAGE_NUMBER.match(stripped):
        return True
    if RE_ASTERISKS.match(stripped):
        return True
    return False


def _parse_french_date(line: str, current_year: int) -> tuple[str | None, int | None]:
    """
    Try to parse a French date from a line.
    Returns (ISO date string, month_number) or (None, None).

    Handles patterns like:
      "Vendredi 14 mars. —"
      "6 mai. —"
      "Dimanche g septembre. —"
      "Nice. — Mercredi 17 janvier. —"
      "Samedi 3 mars 1877. —"
      "Jeudi 1er janvier. —"
    """
    if not current_year:
        return None, None

    # Strip location prefix (e.g., "Nice. — " or "Paris. — ")
    text = re.sub(r"^[A-ZÉ][a-zéèêë]+\.\s*—\s*", "", line.strip())

    # Strip day-of-week prefix
    text = re.sub(
        r"^(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+",
        "",
        text,
    )

    # Handle "1er" (premier) -> "1"
    text = re.sub(r"\b1\s*er\b", "1", text)
    text = re.sub(r"\bJ\s*er\b", "1", text)  # OCR: Jer -> 1er

    # Now try to match: day month [year]. —
    # First extract candidate day number (may have OCR errors)
    m = re.match(
        r"(\S{1,4})\s+"
        r"([a-zéèêëàâîïôùûüÉ-]+)"
        r"(?:\s+(\d{4}))?"
        r"\s*[.,]\s*—",
        text,
        re.IGNORECASE,
    )
    if not m:
        return None, None

    raw_day = m.group(1)
    month_str = m.group(2).lower().rstrip(".")
    year_str = m.group(3)

    # Fix OCR in day number
    day_str = _ocr_fix_number(raw_day)
    try:
        day = int(day_str)
    except ValueError:
        return None, None

    if not (1 <= day <= 31):
        return None, None

    # Match month
    month = FR_MONTHS.get(month_str)
    if not month:
        # Try partial match for hyphenated months (e.g., "sep-tembre")
        for mname, mnum in FR_MONTHS.items():
            if month_str.startswith(mname[:4]):
                month = mnum
                break
    if not month:
        return None, None

    year = int(year_str) if year_str else current_year

    if not (1873 <= year <= 1884):
        return None, None

    return f"{year:04d}-{month:02d}-{day:02d}", month


# ---------------------------------------------------------------------------
# Volume parsing
# ---------------------------------------------------------------------------

def _parse_volume(path: Path, volume_num: int, start_year: int = 0) -> list[CensoredEntry]:
    """Parse a single volume of OCR text into entries."""
    if not path.exists():
        print(f"ERROR: File not found: {path}")
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        raw_lines = f.readlines()

    entries: list[CensoredEntry] = []
    current_year = start_year
    current_month = 0  # Track month for year-increment on January reset
    current_date: str | None = None
    current_text_lines: list[str] = []
    in_front_matter = True  # Skip front matter until first year header

    for line_num, raw_line in enumerate(raw_lines, 1):
        line = raw_line.rstrip("\n")
        stripped = line.strip()

        # Check for year header
        ym = RE_YEAR_LINE.match(stripped)
        if ym:
            candidate_year = int("1" + ym.group(1)) if len(ym.group(1)) == 3 else int(ym.group(1))
            if 1873 <= candidate_year <= 1884:
                if current_date and current_text_lines:
                    entries.append(_build_entry(current_date, volume_num, current_text_lines))
                current_year = candidate_year
                current_month = 0
                current_date = None
                current_text_lines = []
                in_front_matter = False
                continue
            # Try full 4-digit parse
            try:
                full_year = int(stripped.strip())
                if 1873 <= full_year <= 1884:
                    if current_date and current_text_lines:
                        entries.append(_build_entry(current_date, volume_num, current_text_lines))
                    current_year = full_year
                    current_month = 0
                    current_date = None
                    current_text_lines = []
                    in_front_matter = False
                    continue
            except ValueError:
                pass

        if in_front_matter:
            continue

        # Check for noise
        if _is_noise(line):
            continue

        # Check for date header
        date, month = _parse_french_date(stripped, current_year)
        if date and month:
            # Detect year rollover: if we see January and last month was >= October,
            # the year must have incremented (OCR lost the year header)
            if month <= 2 and current_month >= 10:
                current_year += 1
                # Re-parse with corrected year
                date, month = _parse_french_date(stripped, current_year)
                if not date:
                    continue

            current_month = month

            # Save previous entry
            if current_date and current_text_lines:
                entries.append(_build_entry(current_date, volume_num, current_text_lines))
            current_date = date
            # The rest of the date line after "—" may contain text
            dash_idx = stripped.find("—")
            if dash_idx >= 0:
                after_dash = stripped[dash_idx + 1:].strip()
                # Check this isn't just another "—" or location marker
                if after_dash and not after_dash.startswith("—"):
                    current_text_lines = [after_dash]
                else:
                    current_text_lines = []
            else:
                current_text_lines = []
            continue

        # Regular content line
        if current_date is not None:
            cleaned = _ocr_clean_line(line)
            if cleaned:
                current_text_lines.append(cleaned)
            elif current_text_lines:
                # Blank line = paragraph boundary
                current_text_lines.append("")

    # Save last entry
    if current_date and current_text_lines:
        entries.append(_build_entry(current_date, volume_num, current_text_lines))

    return entries


def _build_entry(date_str: str, volume: int, text_lines: list[str]) -> CensoredEntry:
    """Build a CensoredEntry from collected text lines."""
    # Rejoin hyphenated line breaks: "com-\n mencement" -> "commencement"
    full_text = "\n".join(text_lines)
    full_text = re.sub(r"(\w)-\n\s*(\w)", r"\1\2", full_text)

    # Split into paragraphs (separated by blank lines)
    raw_paras = re.split(r"\n\s*\n", full_text)
    paragraphs = []
    for p in raw_paras:
        # Join lines within paragraph
        cleaned = re.sub(r"\n", " ", p).strip()
        cleaned = re.sub(r"  +", " ", cleaned)
        if cleaned and len(cleaned) >= 5:
            paragraphs.append(cleaned)

    return CensoredEntry(
        date_str=date_str,
        volume=volume,
        raw_text=full_text,
        paragraphs=paragraphs,
    )


# ---------------------------------------------------------------------------
# French original loading (adapted from epub_kernberger.py)
# ---------------------------------------------------------------------------

def _load_mapping() -> dict:
    """Load carnet-mapping.json."""
    with open(CARNET_MAPPING, "r", encoding="utf-8") as f:
        return json.load(f)


RE_ANNOTATION = re.compile(r"^%%\s.*%%\s*$")
RE_FRONTMATTER_SEP = re.compile(r"^---\s*$")
RE_HEADING = re.compile(r"^#+\s+")
RE_FOOTNOTE_REF = re.compile(r"\[\^[^\]]+\]")
RE_FOOTNOTE_LINE = re.compile(r"^\[\^[^\]]+\]:\s")
RE_HTML_COMMENT = re.compile(r"^\[//\]:\s*#\s*\(.*\)\s*$")


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

        if RE_FRONTMATTER_SEP.match(stripped):
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


def _get_entries_by_date() -> dict[str, list[EntryParagraph]]:
    """Load all French original paragraphs grouped by date."""
    mapping = _load_mapping()
    entries_by_date: dict[str, list[EntryParagraph]] = {}

    for carnet_id in sorted(mapping.get("carnets", {}).keys()):
        carnet_dir = CONTENT_ORIGINAL / carnet_id
        if not carnet_dir.is_dir():
            continue
        entry_files = sorted(carnet_dir.glob("*.md"))
        entry_files = [f for f in entry_files
                       if f.name != "README.md" and not f.name.startswith("_")]
        for fpath in entry_files:
            date_str = fpath.stem
            paras = _parse_entry_file(fpath, carnet_id, date_str)
            if paras:
                if date_str not in entries_by_date:
                    entries_by_date[date_str] = []
                entries_by_date[date_str].extend(paras)

    return entries_by_date


# ---------------------------------------------------------------------------
# Subcommand: parse
# ---------------------------------------------------------------------------

def cmd_parse(args):
    """Parse OCR text files and extract entries."""
    print("Parsing censored edition OCR text...")
    print("=" * 60)

    vol1_entries = _parse_volume(VOL1_PATH, 1, start_year=1873)
    print(f"Volume 1: {len(vol1_entries)} entries")
    if vol1_entries:
        print(f"  Date range: {vol1_entries[0].date_str} to {vol1_entries[-1].date_str}")

    vol2_entries = _parse_volume(VOL2_PATH, 2, start_year=1877)
    print(f"Volume 2: {len(vol2_entries)} entries")
    if vol2_entries:
        print(f"  Date range: {vol2_entries[0].date_str} to {vol2_entries[-1].date_str}")

    # Merge, deduplicating any overlap (prefer vol2 for duplicates)
    all_entries: dict[str, CensoredEntry] = {}
    for e in vol1_entries:
        all_entries[e.date_str] = e
    for e in vol2_entries:
        all_entries[e.date_str] = e  # vol2 overwrites vol1 overlaps

    sorted_entries = sorted(all_entries.values(), key=lambda e: e.date_str)
    total_paras = sum(len(e.paragraphs) for e in sorted_entries)

    print(f"\nCombined: {len(sorted_entries)} unique entries, {total_paras} paragraphs")
    if sorted_entries:
        print(f"Date range: {sorted_entries[0].date_str} to {sorted_entries[-1].date_str}")

    # Per-year breakdown
    years: dict[str, int] = {}
    for e in sorted_entries:
        y = e.date_str[:4]
        years[y] = years.get(y, 0) + 1
    print("\nPer-year breakdown:")
    for y in sorted(years):
        print(f"  {y}: {years[y]} entries")

    # Save to JSON
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    json_data = {
        "vol1_entries": len(vol1_entries),
        "vol2_entries": len(vol2_entries),
        "total_entries": len(sorted_entries),
        "total_paragraphs": total_paras,
        "date_range": [sorted_entries[0].date_str, sorted_entries[-1].date_str] if sorted_entries else [],
        "entries": [
            {
                "date": e.date_str,
                "volume": e.volume,
                "paragraph_count": len(e.paragraphs),
                "text_preview": e.paragraphs[0][:200] if e.paragraphs else "",
            }
            for e in sorted_entries
        ],
        "full_entries": [
            {
                "date": e.date_str,
                "volume": e.volume,
                "paragraphs": e.paragraphs,
            }
            for e in sorted_entries
        ],
    }

    json_path = REPORTS_DIR / "censored_1887_parsed.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to: {json_path}")


# ---------------------------------------------------------------------------
# Subcommand: extract (match to French originals)
# ---------------------------------------------------------------------------

def cmd_extract(args):
    """Match censored entries to French originals."""
    if fuzz is None:
        print("ERROR: rapidfuzz is required. Install with: uv run --with rapidfuzz ...")
        sys.exit(1)

    # Load parsed censored data
    json_path = REPORTS_DIR / "censored_1887_parsed.json"
    if not json_path.exists():
        print("ERROR: Parsed data not found. Run 'parse' first.")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        parsed = json.load(f)

    print("Matching censored entries to French originals...")
    print("=" * 60)

    # Build censored entry map
    censored_entries: dict[str, CensoredEntry] = {}
    for entry_data in parsed["full_entries"]:
        e = CensoredEntry(
            date_str=entry_data["date"],
            volume=entry_data["volume"],
            raw_text="",
            paragraphs=entry_data["paragraphs"],
        )
        censored_entries[e.date_str] = e

    print(f"Censored entries: {len(censored_entries)}")

    # Load French originals
    print("Loading French originals...")
    french_entries = _get_entries_by_date()
    print(f"French original entries: {len(french_entries)}")

    # Date matching
    matched_dates = set(censored_entries.keys()) & set(french_entries.keys())
    censored_only = set(censored_entries.keys()) - set(french_entries.keys())
    french_only = set(french_entries.keys()) - set(censored_entries.keys())

    print(f"\nDate matching:")
    print(f"  Dates in both:          {len(matched_dates)}")
    print(f"  Censored-only dates:    {len(censored_only)}")
    print(f"  French-only (censored): {len(french_only)}")

    # Try ±1 day fallback for censored-only dates
    rescued = 0
    for date_str in list(censored_only):
        parts = date_str.split("-")
        y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
        for delta in [-1, 1]:
            nd = d + delta
            if 1 <= nd <= 31:
                alt = f"{y:04d}-{m:02d}-{nd:02d}"
                if alt in french_entries and alt not in censored_entries:
                    matched_dates.add(alt)
                    censored_entries[alt] = censored_entries[date_str]
                    censored_only.discard(date_str)
                    rescued += 1
                    break

    if rescued:
        print(f"  Rescued via ±1 day:     {rescued}")
        print(f"  Final matched dates:    {len(matched_dates)}")

    if censored_only:
        print(f"\n  Unmatched censored dates ({len(censored_only)}):")
        for d in sorted(censored_only)[:20]:
            e = censored_entries[d]
            preview = e.paragraphs[0][:80] if e.paragraphs else ""
            print(f"    {d}: {preview}")
        if len(censored_only) > 20:
            print(f"    ... and {len(censored_only) - 20} more")

    # Paragraph-level matching
    print("\nParagraph matching...")
    match_results: list[MatchResult] = []

    for date_str in sorted(matched_dates):
        censored = censored_entries[date_str]
        french_paras = french_entries[date_str]

        result = _match_paragraphs(date_str, censored, french_paras)
        match_results.append(result)

    total_matched_paras = sum(len(r.matched_para_ids) for r in match_results)
    total_french_paras = sum(r.french_paragraph_count for r in match_results)

    print(f"\nResults:")
    print(f"  Matched entries:    {len(match_results)}")
    print(f"  Matched paragraphs: {total_matched_paras} / {total_french_paras}")

    # Save matching JSON
    json_data = {
        "matched_dates": sorted(matched_dates),
        "censored_only_dates": sorted(censored_only),
        "french_only_dates": sorted(french_only),
        "matches": [
            {
                "date": r.date_str,
                "carnet": r.carnet,
                "censored_paragraphs": r.censored_paragraph_count,
                "french_paragraphs": r.french_paragraph_count,
                "matched_para_ids": r.matched_para_ids,
                "confidence": r.confidence,
                "notes": r.notes,
            }
            for r in match_results
        ],
    }

    out_path = REPORTS_DIR / "censored_1887_matching.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to: {out_path}")

    # Generate report too
    _generate_report(match_results, matched_dates, censored_only, french_only,
                     censored_entries, french_entries)


def _match_paragraphs(
    date_str: str,
    censored: CensoredEntry,
    french_paras: list[EntryParagraph],
) -> MatchResult:
    """Match French original paragraphs against censored entry text."""
    matched_ids: list[str] = []
    carnet = french_paras[0].carnet if french_paras else ""

    # Normalize full censored text for substring matching
    censored_full = _normalize(" ".join(censored.paragraphs))

    for fr_para in french_paras:
        if len(fr_para.text.strip()) < MIN_PARA_CHARS:
            # Very short paragraphs (dates, carnet markers) — skip
            continue

        fr_norm = _normalize(fr_para.text)

        if len(fr_norm) < 10:
            continue

        # Strategy 1: Substring probe (fast, precise)
        # Take a 40-char probe from the middle of the French paragraph
        mid = len(fr_norm) // 2
        probe_len = min(40, len(fr_norm) // 2)
        probe = fr_norm[mid - probe_len // 2 : mid + probe_len // 2]

        if len(probe) >= 15 and probe in censored_full:
            matched_ids.append(fr_para.para_id)
            continue

        # Also try a probe from the start (first 40 chars after any initial short words)
        start_probe = fr_norm[5:45] if len(fr_norm) > 45 else fr_norm[:40]
        if len(start_probe) >= 15 and start_probe in censored_full:
            matched_ids.append(fr_para.para_id)
            continue

        # Strategy 2: Fuzzy match fallback (for OCR-damaged text)
        if fuzz and len(fr_norm) >= 30:
            # Use the first 150 chars for matching
            score = fuzz.partial_ratio(fr_norm[:150], censored_full)
            if score >= 82:
                matched_ids.append(fr_para.para_id)
                continue

    confidence = len(matched_ids) / max(len(french_paras), 1)

    return MatchResult(
        date_str=date_str,
        carnet=carnet,
        censored_paragraph_count=len(censored.paragraphs),
        french_paragraph_count=len(french_paras),
        matched_para_ids=matched_ids,
        confidence=confidence,
    )


def _generate_report(
    match_results: list[MatchResult],
    matched_dates: set,
    censored_only: set,
    french_only: set,
    censored_entries: dict,
    french_entries: dict,
):
    """Generate markdown coverage report."""
    lines = ["# 1887 Censored Edition Matching Report\n"]

    lines.append("## Summary\n")
    lines.append(f"- **Censored edition entries**: {len(censored_entries)}")
    lines.append(f"- **French original entries**: {len(french_entries)}")
    lines.append(f"- **Matched dates**: {len(matched_dates)}")
    lines.append(f"- **Censored-only dates**: {len(censored_only)}")
    lines.append(f"- **French-only dates**: {len(french_only)}")
    lines.append("")

    total_matched = sum(len(r.matched_para_ids) for r in match_results)
    total_french = sum(r.french_paragraph_count for r in match_results)
    lines.append(f"- **Matched paragraphs**: {total_matched} / {total_french}")
    lines.append("")

    # Per-year
    lines.append("## Coverage by Year\n")
    years: dict[str, dict] = {}
    for r in match_results:
        y = r.date_str[:4]
        if y not in years:
            years[y] = {"entries": 0, "matched_paras": 0, "total_paras": 0}
        years[y]["entries"] += 1
        years[y]["matched_paras"] += len(r.matched_para_ids)
        years[y]["total_paras"] += r.french_paragraph_count

    lines.append("| Year | Entries | Matched Paras | Total Paras | Coverage |")
    lines.append("|------|---------|--------------|-------------|----------|")
    for y in sorted(years):
        d = years[y]
        pct = d["matched_paras"] * 100 // max(d["total_paras"], 1)
        lines.append(f"| {y} | {d['entries']} | {d['matched_paras']} | {d['total_paras']} | {pct}% |")
    lines.append("")

    # Per-carnet
    lines.append("## Coverage by Carnet\n")
    carnets: dict[str, dict] = {}
    for r in match_results:
        if r.carnet not in carnets:
            carnets[r.carnet] = {"entries": 0, "matched_paras": 0, "total_paras": 0}
        carnets[r.carnet]["entries"] += 1
        carnets[r.carnet]["matched_paras"] += len(r.matched_para_ids)
        carnets[r.carnet]["total_paras"] += r.french_paragraph_count

    lines.append("| Carnet | Entries | Matched Paras | Total Paras | Coverage |")
    lines.append("|--------|---------|--------------|-------------|----------|")
    for c in sorted(carnets):
        d = carnets[c]
        pct = d["matched_paras"] * 100 // max(d["total_paras"], 1)
        lines.append(f"| {c} | {d['entries']} | {d['matched_paras']} | {d['total_paras']} | {pct}% |")
    lines.append("")

    # Unmatched dates
    if censored_only:
        lines.append("## Censored-Only Dates (not matched to originals)\n")
        for d in sorted(censored_only):
            e = censored_entries.get(d)
            if e:
                preview = e.paragraphs[0][:100] if e.paragraphs else ""
                lines.append(f"- **{d}**: `{preview}`")
        lines.append("")

    report_path = REPORTS_DIR / "censored_1887_matching.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Report saved to: {report_path}")


# ---------------------------------------------------------------------------
# Subcommand: tag
# ---------------------------------------------------------------------------

def cmd_tag(args):
    """Tag French source files with #Censored_1887 markers."""
    dry_run = args.dry_run

    json_path = REPORTS_DIR / "censored_1887_matching.json"
    if not json_path.exists():
        print("ERROR: Matching data not found. Run 'extract' first.")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Tagging source files {'(DRY RUN)' if dry_run else ''}")
    print("=" * 60)

    # Build file map
    file_map: dict[tuple[str, str], list[str]] = {}
    para_ids_to_tag: set[str] = set()
    for match in data["matches"]:
        pids = match.get("matched_para_ids", [])
        if not pids:
            continue
        key = (match["carnet"], match["date"])
        file_map[key] = pids
        para_ids_to_tag.update(pids)

    print(f"Paragraphs to tag: {len(para_ids_to_tag)}")
    print(f"Files to process:  {len(file_map)}")

    PARA_ID_RE = re.compile(r"^%% (\d{3}\.\d{4}) %%$")

    total_files_modified = 0
    total_paras_tagged = 0
    carnet_stats: dict[str, dict] = {}

    for (carnet, date), pids in sorted(file_map.items()):
        file_path = CONTENT_ORIGINAL / carnet / f"{date}.md"
        if not file_path.exists():
            print(f"  WARNING: File not found: {file_path}")
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        pid_set = set(pids)
        new_lines: list[str] = []
        paras_tagged_in_file = 0
        modified = False

        # Frontmatter handling
        in_frontmatter = False
        found_workflow = False
        workflow_indent = ""
        added_fm_key = False

        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.rstrip("\n")

            # --- Frontmatter handling ---
            if i == 0 and stripped == "---":
                in_frontmatter = True
                new_lines.append(line)
                i += 1
                continue

            if in_frontmatter:
                if stripped == "---":
                    if found_workflow and not added_fm_key:
                        new_lines.append(f"{workflow_indent}{FM_KEY}: true\n")
                        added_fm_key = True
                        modified = True
                    in_frontmatter = False
                    new_lines.append(line)
                    i += 1
                    continue

                if stripped.startswith("workflow:"):
                    found_workflow = True
                    new_lines.append(line)
                    i += 1
                    continue

                if found_workflow and not added_fm_key:
                    indent_match = re.match(r"^(\s+)", stripped)
                    if indent_match:
                        workflow_indent = indent_match.group(1)
                        if f"{FM_KEY}:" in stripped:
                            added_fm_key = True
                            new_lines.append(line)
                            i += 1
                            continue
                    elif stripped and not stripped.startswith(" ") and not stripped.startswith("\t"):
                        new_lines.append(f"{workflow_indent}{FM_KEY}: true\n")
                        added_fm_key = True
                        modified = True

                new_lines.append(line)
                i += 1
                continue

            # --- Paragraph tagging ---
            m = PARA_ID_RE.match(stripped)
            if m and m.group(1) in pid_set:
                new_lines.append(line)
                # Check if next line already has the tag
                next_i = i + 1
                if next_i < len(lines) and TAG_LINE in lines[next_i].rstrip("\n"):
                    i += 1
                    continue
                # Insert tag after paragraph ID line
                new_lines.append(TAG_LINE + "\n")
                paras_tagged_in_file += 1
                modified = True
                i += 1
                continue

            new_lines.append(line)
            i += 1

        if modified:
            total_files_modified += 1
            total_paras_tagged += paras_tagged_in_file

            if carnet not in carnet_stats:
                carnet_stats[carnet] = {"files": 0, "paras": 0}
            carnet_stats[carnet]["files"] += 1
            carnet_stats[carnet]["paras"] += paras_tagged_in_file

            if not dry_run:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.writelines(new_lines)

    print(f"\n{'DRY RUN ' if dry_run else ''}Summary:")
    print(f"  Files modified:     {total_files_modified}")
    print(f"  Paragraphs tagged:  {total_paras_tagged}")
    print(f"\nPer-carnet breakdown:")
    print(f"  {'Carnet':<10} {'Files':>6} {'Paras':>8}")
    print(f"  {'-'*10} {'-'*6} {'-'*8}")
    for carnet in sorted(carnet_stats):
        s = carnet_stats[carnet]
        print(f"  {carnet:<10} {s['files']:>6} {s['paras']:>8}")


# ---------------------------------------------------------------------------
# Subcommand: report
# ---------------------------------------------------------------------------

def cmd_report(args):
    """Show status of censored matching reports."""
    reports = [
        ("censored_1887_parsed.json", "Parsed entries"),
        ("censored_1887_matching.json", "Paragraph matching"),
        ("censored_1887_matching.md", "Coverage report"),
    ]

    print("1887 Censored Edition Reports")
    print("=" * 60)
    for filename, desc in reports:
        path = REPORTS_DIR / filename
        status = "READY" if path.exists() else "NOT YET GENERATED"
        print(f"  {desc}: {status}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Match 1887 censored edition against French originals",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("parse", help="Parse OCR text files")
    subparsers.add_parser("extract", help="Match to French originals")

    p_tag = subparsers.add_parser("tag", help="Tag source files with #Censored_1887")
    p_tag.add_argument("--dry-run", action="store_true", help="Report only")

    subparsers.add_parser("report", help="Show report status")

    args = parser.parse_args()

    if args.command == "parse":
        cmd_parse(args)
    elif args.command == "extract":
        cmd_extract(args)
    elif args.command == "tag":
        cmd_tag(args)
    elif args.command == "report":
        cmd_report(args)


if __name__ == "__main__":
    main()
