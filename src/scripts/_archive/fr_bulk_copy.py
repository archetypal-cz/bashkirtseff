#!/usr/bin/env python3
"""
Bulk copy French originals to fr/ edition format.

Handles the mechanical part:
- Copy frontmatter (remove workflow, add edition_complete)
- Fix glossary paths (../_glossary/ -> ../../_original/_glossary/)
- Strip RSR/LAN comments
- Copy French text verbatim
- Preserve paragraph IDs and glossary links
- Translate English footnotes -> flagged for manual review

Does NOT handle (needs AI):
- Translating non-French passages
- Writing new footnotes

Usage:
    uv run src/scripts/fr_bulk_copy.py                    # All carnets
    uv run src/scripts/fr_bulk_copy.py 010 011 012        # Specific carnets
    uv run src/scripts/fr_bulk_copy.py --skip-existing     # Skip already-created files
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
ORIGINAL = ROOT / "content" / "_original"
FR = ROOT / "content" / "fr"

# Frontmatter fields to remove
REMOVE_FIELDS = {
    "workflow:", "  research_complete:", "  linguistic_annotation_complete:",
    "  last_modified:", "  modified_by:", "  kernberger_covered:",
    "kernberger_covered:", "empty_in_source:", "research_complete:",
    "linguistic_annotation_complete:",
}

# Comment patterns to strip (RSR, LAN comments)
RSR_LAN_PATTERN = re.compile(r'^%%\s+\d{4}-\d{2}-\d{2}T[\d:]+\s+(RSR|LAN|CON):.*%%\s*$')

# Glossary path fix
GLOSSARY_OLD = "../_glossary/"
GLOSSARY_NEW = "../../_original/_glossary/"


def should_skip_line(line: str) -> bool:
    """Check if line is an RSR/LAN comment that should be stripped."""
    stripped = line.strip()
    if RSR_LAN_PATTERN.match(stripped):
        return True
    return False


def process_frontmatter(lines: list[str]) -> list[str]:
    """Process YAML frontmatter: remove workflow block, add edition_complete."""
    result = []
    in_workflow = False
    has_edition_complete = False

    for line in lines:
        # Detect workflow block
        if line.strip() == "workflow:":
            in_workflow = True
            continue
        if in_workflow:
            if line.startswith("  ") or line.strip() == "":
                if line.strip() == "":
                    in_workflow = False
                    # Don't add the blank line after workflow
                continue
            else:
                in_workflow = False

        # Skip individual fields to remove
        skip = False
        for field in REMOVE_FIELDS:
            if line.strip().startswith(field.strip()):
                skip = True
                break
        if skip:
            continue

        if line.strip() == "edition_complete: true":
            has_edition_complete = True

        result.append(line)

    # Add edition_complete before closing ---
    if not has_edition_complete:
        # Insert before last line (---)
        result.insert(-1, "edition_complete: true\n")

    return result


def process_body(lines: list[str]) -> tuple[list[str], list[str]]:
    """
    Process body text.
    Returns (processed_lines, non_french_markers).
    non_french_markers: list of (para_id, language, description) for AI follow-up.
    """
    result = []
    non_french = []
    current_para_id = None

    for line in lines:
        stripped = line.strip()

        # Track paragraph IDs
        para_match = re.match(r'^%%\s+(\d{3}\.\d{4})\s+%%$', stripped)
        if para_match:
            current_para_id = para_match.group(1)

        # Strip RSR/LAN comments, but first check for non-French markers
        if should_skip_line(line):
            # Check for non-French language markers before stripping
            for lang in ["ENGLISH", "RUSSIAN", "LATIN", "ITALIAN", "CODE-SWITCH"]:
                if lang in line:
                    non_french.append((current_para_id, lang, stripped))
                    break
            continue

        # Fix glossary paths
        if GLOSSARY_OLD in line:
            line = line.replace(GLOSSARY_OLD, GLOSSARY_NEW)

        result.append(line)

    return result, non_french


def process_file(src: Path, dst: Path) -> list[str]:
    """Process a single file. Returns list of non-French markers found."""
    content = src.read_text(encoding="utf-8")
    lines = content.splitlines(keepends=True)

    # Split frontmatter and body
    fm_start = -1
    fm_end = -1
    for i, line in enumerate(lines):
        if line.strip() == "---":
            if fm_start == -1:
                fm_start = i
            else:
                fm_end = i
                break

    if fm_start == -1 or fm_end == -1:
        # No frontmatter, just process body
        body, non_french = process_body(lines)
        dst.write_text("".join(body), encoding="utf-8")
        return non_french

    fm_lines = process_frontmatter(lines[fm_start:fm_end + 1])
    body_lines, non_french = process_body(lines[fm_end + 1:])

    dst.write_text("".join(fm_lines) + "".join(body_lines), encoding="utf-8")
    return non_french


def process_carnet(carnet: str, skip_existing: bool = False) -> dict:
    """Process all entries in a carnet. Returns stats."""
    src_dir = ORIGINAL / carnet
    dst_dir = FR / carnet

    if not src_dir.exists():
        print(f"  Carnet {carnet}: source not found, skipping")
        return {"files": 0, "skipped": 0, "non_french": []}

    dst_dir.mkdir(parents=True, exist_ok=True)

    files_processed = 0
    files_skipped = 0
    all_non_french = []

    for src_file in sorted(src_dir.glob("*.md")):
        if src_file.name in ("README.md", "_summary.md"):
            continue

        dst_file = dst_dir / src_file.name

        if skip_existing and dst_file.exists():
            files_skipped += 1
            continue

        non_french = process_file(src_file, dst_file)
        files_processed += 1
        if non_french:
            all_non_french.extend([(src_file.name, *nf) for nf in non_french])

    return {
        "files": files_processed,
        "skipped": files_skipped,
        "non_french": all_non_french,
    }


def main():
    args = sys.argv[1:]
    skip_existing = "--skip-existing" in args
    args = [a for a in args if not a.startswith("--")]

    if args:
        carnets = args
    else:
        # All carnets
        carnets = sorted([
            d.name for d in ORIGINAL.iterdir()
            if d.is_dir() and d.name.isdigit()
        ])

    total_files = 0
    total_skipped = 0
    all_non_french = []

    for carnet in carnets:
        stats = process_carnet(carnet, skip_existing)
        total_files += stats["files"]
        total_skipped += stats["skipped"]
        all_non_french.extend([(carnet, *nf) for nf in stats["non_french"]])

        status = f"  Carnet {carnet}: {stats['files']} files"
        if stats["skipped"]:
            status += f" ({stats['skipped']} skipped)"
        if stats["non_french"]:
            status += f" [{len(stats['non_french'])} non-French markers]"
        print(status)

    print(f"\nTotal: {total_files} files processed, {total_skipped} skipped")
    print(f"Non-French passages found: {len(all_non_french)}")

    if all_non_french:
        report_path = FR / "_non_french_passages.md"
        with open(report_path, "w", encoding="utf-8") as f:
            f.write("# Non-French Passages Requiring Translation\n\n")
            f.write("These passages were identified by LAN comments in the originals.\n")
            f.write("They need AI translation into French.\n\n")
            for carnet, filename, para_id, lang, desc in all_non_french:
                f.write(f"- **{carnet}/{filename}** para {para_id} [{lang}]: {desc}\n")
        print(f"Report written to: {report_path}")


if __name__ == "__main__":
    main()
