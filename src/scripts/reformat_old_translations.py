#!/usr/bin/env python3
"""Reformat old cz/02/ translations to proper project format.

Old format (cz/02/):
  # Heading (Czech)
  %%French text%%
  %%02.XXXX%%
  %%timestamp TR: comments%%
  Czech translation

New format (cz/NNN/):
  ---
  frontmatter
  ---
  %% NNN.YYYY %%
  %% [#glossary links] %%
  %% French text %%
  Czech translation
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
ORIGINAL = ROOT / "content" / "_original"
CZ = ROOT / "content" / "cz"
OLD = ROOT / "content" / "cz" / "02"

# Pattern for old paragraph IDs
OLD_ID_RE = re.compile(r"^%%\s*0[0-9]+\.\d+\s*%%$")
# Pattern for timestamp comments (RSR, TR, LAN, RED, CON, GEM, PPX)
COMMENT_RE = re.compile(r"^%%\s*\d{4}-\d{2}-\d{2}T")
# Pattern for footnotes
FOOTNOTE_RE = re.compile(r"^\[\^")


def parse_old_file(filepath: Path) -> list[tuple[str, str]]:
    """Parse old format file into (french, czech) paragraph pairs.

    The old format has this structure per paragraph:
      %%French text%%
      %%02.XXXX%%
      %%timestamp TR: comment%%  (zero or more)
      Czech translation text
      (blank line)
      [^N]: footnote text  (optional)
    """
    text = filepath.read_text(encoding="utf-8")
    lines = text.split("\n")

    pairs = []
    current_french = None
    czech_lines: list[str] = []

    def save_pair():
        nonlocal current_french, czech_lines
        if current_french is not None:
            czech = "\n".join(czech_lines).strip()
            if czech:
                pairs.append((current_french, czech))
        current_french = None
        czech_lines = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Skip headings
        if line.startswith("# "):
            i += 1
            continue

        # Skip empty lines (but they might separate pairs)
        if not line:
            i += 1
            continue

        # Skip footnote definitions — they're part of the Czech text
        if FOOTNOTE_RE.match(line):
            if current_french is not None:
                czech_lines.append(lines[i])
            i += 1
            continue

        # Check for %%...%% blocks
        if line.startswith("%%") and line.endswith("%%"):
            inner = line[2:-2].strip()

            # Old paragraph ID: %%02.XXXX%%
            if OLD_ID_RE.match(line):
                # ID comes after French text, before Czech — don't save yet
                i += 1
                continue

            # Timestamp comment: %%2025-12-07T... TR: ...%%
            if COMMENT_RE.match(line):
                # Skip these entirely
                i += 1
                continue

            # Otherwise it's French text
            # Save any previous pair first
            save_pair()
            current_french = inner
            i += 1
            continue

        # Regular text line — this is Czech translation
        if current_french is not None:
            czech_lines.append(lines[i])

        i += 1

    # Save last pair
    save_pair()

    return pairs


def get_original_paragraphs(filepath: Path) -> list[tuple[str, str, list[str]]]:
    """Parse original file to get (para_id, french_text, annotation_lines)."""
    text = filepath.read_text(encoding="utf-8")

    # Skip frontmatter
    if text.startswith("---"):
        end = text.index("---", 3)
        body = text[end + 3:].strip()
    else:
        body = text.strip()

    lines = body.split("\n")
    paragraphs = []
    current_id = None
    current_text = None
    current_annotations = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Paragraph ID: %% NNN.YYYY %%
        m = re.match(r"^%%\s*(\d{3}\.\d{4})\s*%%$", line)
        if m:
            if current_id and current_text:
                paragraphs.append((current_id, current_text, current_annotations))
            current_id = m.group(1)
            current_text = None
            current_annotations = []
            i += 1
            continue

        # Annotation/comment lines (%% ... %%)
        if line.startswith("%%") and line.endswith("%%"):
            current_annotations.append(line)
            i += 1
            continue

        # Text line
        if line and current_id and current_text is None:
            text_lines = [lines[i]]
            i += 1
            while i < len(lines):
                next_line = lines[i].strip()
                if not next_line or next_line.startswith("%%"):
                    break
                text_lines.append(lines[i])
                i += 1
            current_text = "\n".join(text_lines).strip()
            continue

        i += 1

    if current_id and current_text:
        paragraphs.append((current_id, current_text, current_annotations))

    return paragraphs


def get_frontmatter(filepath: Path) -> dict:
    """Extract frontmatter fields from original file."""
    text = filepath.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}

    end = text.index("---", 3)
    fm_text = text[3:end].strip()

    result = {}
    for line in fm_text.split("\n"):
        if ":" in line and not line.startswith(" "):
            key, _, val = line.partition(":")
            result[key.strip()] = val.strip()

    return result


def normalize_french(text: str) -> str:
    """Normalize French text for matching."""
    t = text.strip()
    t = re.sub(r"\s+", " ", t)
    t = t.replace("\u00a0", " ")
    t = t.replace("\u2019", "'")  # curly apostrophe → straight
    t = t.replace("\u201c", '"').replace("\u201d", '"')  # curly quotes
    t = t.replace("…", "...")
    return t


def match_texts(orig_text: str, old_text: str) -> bool:
    """Check if two French texts match (fuzzy)."""
    a = normalize_french(orig_text)
    b = normalize_french(old_text)

    # Exact match
    if a == b:
        return True

    # Prefix match (first 100 chars)
    if len(a) > 30 and len(b) > 30 and a[:100] == b[:100]:
        return True

    # First 50 chars match (handles trailing differences)
    if len(a) > 20 and len(b) > 20 and a[:50] == b[:50]:
        return True

    # Handle bracket differences: [text] vs text
    a_stripped = a.lstrip("[").rstrip("]")
    b_stripped = b.lstrip("[").rstrip("]")
    if a_stripped and b_stripped and a_stripped[:80] == b_stripped[:80]:
        return True

    # Handle dash prefixes: "— text" vs "- text"
    a_dashed = re.sub(r"^[\-—–]\s*", "", a)
    b_dashed = re.sub(r"^[\-—–]\s*", "", b)
    if a_dashed and b_dashed and a_dashed[:80] == b_dashed[:80]:
        return True

    return False


def reformat_file(date: str, carnet: str) -> tuple[int, int] | None:
    """Reformat a single file from old format to new."""
    old_file = OLD / f"{date}.md"
    new_file = CZ / carnet / f"{date}.md"
    orig_file = ORIGINAL / carnet / f"{date}.md"

    if not old_file.exists():
        return None
    if not orig_file.exists():
        print(f"  WARNING: No original for {carnet}/{date}", file=sys.stderr)
        return None

    # Parse old translations
    old_pairs = parse_old_file(old_file)
    if not old_pairs:
        print(f"  WARNING: No pairs found in old {date}", file=sys.stderr)
        return None

    # Parse original structure
    orig_paras = get_original_paragraphs(orig_file)
    fm = get_frontmatter(orig_file)

    # Build czech lookup: try multiple matching strategies
    czech_by_text: dict[str, str] = {}
    for fr, cz in old_pairs:
        czech_by_text[normalize_french(fr)] = cz

    # Build output
    out_lines = []
    out_lines.append("---")
    out_lines.append(f"date: {fm.get('date', date)}")
    out_lines.append(f'carnet: "{carnet}"')
    out_lines.append(f"location: {fm.get('location', 'Nice')}")
    out_lines.append("translation_complete: true")
    out_lines.append("editor_approved: false")
    out_lines.append("conductor_approved: false")
    out_lines.append("---")

    matched = 0
    unmatched = 0

    # Also try positional matching: pair up in order
    # Build list of original paras that have text, and old pairs in order
    positional_map: dict[int, str] = {}  # orig_index → czech
    old_idx = 0
    for orig_idx, (para_id, fr_text, anns) in enumerate(orig_paras):
        if old_idx >= len(old_pairs):
            break
        old_fr, old_cz = old_pairs[old_idx]
        if match_texts(fr_text, old_fr):
            positional_map[orig_idx] = old_cz
            old_idx += 1

    for orig_idx, (para_id, fr_text, annotations) in enumerate(orig_paras):
        out_lines.append("")
        out_lines.append(f"%% {para_id} %%")

        # Add glossary annotations from original
        for ann in annotations:
            if "[#" in ann:
                fixed = ann.replace("../_glossary/", "../../_original/_glossary/")
                out_lines.append(fixed)

        # Add French text as comment
        out_lines.append(f"%% {fr_text} %%")

        # Try content-based matching first
        norm_fr = normalize_french(fr_text)
        czech = None
        if norm_fr in czech_by_text:
            czech = czech_by_text[norm_fr]
        else:
            # Try fuzzy matching
            for old_fr_norm, old_cz in czech_by_text.items():
                if match_texts(fr_text, old_fr_norm):
                    czech = old_cz
                    break

        # Fall back to positional matching
        if czech is None and orig_idx in positional_map:
            czech = positional_map[orig_idx]

        if czech:
            # Remove == == highlights (old code-switching markers)
            czech = re.sub(r"==([^=]+)==", r"\1", czech)
            out_lines.append(czech)
            matched += 1
        else:
            out_lines.append("<!-- TODO: translate -->")
            unmatched += 1

    out_lines.append("")
    content = "\n".join(out_lines)
    new_file.write_text(content, encoding="utf-8")
    return (matched, unmatched)


def main():
    carnets_to_process: dict[str, list[str]] = {}

    for carnet_dir in sorted(CZ.iterdir()):
        if not carnet_dir.is_dir():
            continue
        carnet = carnet_dir.name
        if carnet in ("02", "_archive") or not re.match(r"\d{3}", carnet):
            continue

        for f in sorted(carnet_dir.glob("*.md")):
            if f.name in ("README.md", "TranslationMemory.md", "Style.md",
                          "PROGRESS.md", "CLAUDE.md") or f.name.startswith("_"):
                continue
            date = f.stem
            old_file = OLD / f"{date}.md"
            if old_file.exists():
                # Always reformat files that have a corresponding old file
                if carnet not in carnets_to_process:
                    carnets_to_process[carnet] = []
                carnets_to_process[carnet].append(date)

    total_matched = 0
    total_unmatched = 0
    total_files = 0

    for carnet in sorted(carnets_to_process.keys()):
        dates = carnets_to_process[carnet]
        print(f"\nCarnet {carnet}: {len(dates)} files to reformat")
        for date in dates:
            result = reformat_file(date, carnet)
            if result:
                m, u = result
                total_matched += m
                total_unmatched += u
                total_files += 1
                if u > 0:
                    print(f"  {date}: {m} matched, {u} unmatched")

    print(f"\nDone: {total_files} files reformatted")
    print(f"  Paragraphs matched: {total_matched}")
    print(f"  Paragraphs unmatched: {total_unmatched}")


if __name__ == "__main__":
    main()
