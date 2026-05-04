#!/usr/bin/env python3
"""
Generate a JSON manifest of non-French passages needing translation.

Groups passages by carnet for parallel processing.
Each entry includes: file path, paragraph ID, language, LAN context,
and the actual text from the fr/ file that needs translating.

Usage:
    uv run src/scripts/fr_translate_nonfrench.py              # Full manifest
    uv run src/scripts/fr_translate_nonfrench.py 010 011      # Specific carnets
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
ORIGINAL = ROOT / "content" / "_original"
FR = ROOT / "content" / "fr"
REPORT = FR / "_non_french_passages.md"


def parse_report() -> dict[str, list[dict]]:
    """Parse the non-French passages report into a dict keyed by carnet."""
    by_carnet: dict[str, list[dict]] = {}

    for line in REPORT.read_text().splitlines():
        if not line.startswith("- **"):
            continue

        # Parse: - **010/1873-09-24.md** para 010.0042 [ENGLISH]: %% ... %%
        m = re.match(
            r'- \*\*(\d+)/(.+?\.md)\*\* para (\d+\.\d+) \[(\w+(?:-\w+)?)\]: (.+)',
            line
        )
        if not m:
            continue

        carnet, filename, para_id, lang, context = m.groups()

        if carnet not in by_carnet:
            by_carnet[carnet] = []

        by_carnet[carnet].append({
            "file": filename,
            "para_id": para_id,
            "language": lang,
            "lan_context": context.strip(),
        })

    return by_carnet


def get_paragraph_text(fr_file: Path, para_id: str) -> str | None:
    """Extract the text of a specific paragraph from an fr/ file."""
    if not fr_file.exists():
        return None

    content = fr_file.read_text()
    lines = content.splitlines()

    # Find the paragraph ID line, then collect text until next paragraph
    in_para = False
    text_lines = []

    for line in lines:
        if re.match(rf'^%%\s+{re.escape(para_id)}\s+%%$', line.strip()):
            in_para = True
            continue

        if in_para:
            # Stop at next paragraph ID
            if re.match(r'^%%\s+\d{3}\.\d{4}\s+%%$', line.strip()):
                break
            # Skip glossary links and comments
            if line.strip().startswith("%%"):
                continue
            # Skip empty lines at start
            if not text_lines and not line.strip():
                continue
            text_lines.append(line)

    # Remove trailing empty lines
    while text_lines and not text_lines[-1].strip():
        text_lines.pop()

    return "\n".join(text_lines) if text_lines else None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    by_carnet = parse_report()

    if args:
        by_carnet = {k: v for k, v in by_carnet.items() if k in args}

    total = 0
    manifest = {}

    for carnet in sorted(by_carnet.keys()):
        entries = by_carnet[carnet]
        carnet_data = []

        for entry in entries:
            fr_file = FR / carnet / entry["file"]
            text = get_paragraph_text(fr_file, entry["para_id"])

            carnet_data.append({
                **entry,
                "fr_file": str(fr_file.relative_to(ROOT)),
                "original_file": str(ORIGINAL / carnet / entry["file"]).replace(str(ROOT) + "/", ""),
                "current_text": text,
            })

        manifest[carnet] = carnet_data
        total += len(carnet_data)
        print(f"  Carnet {carnet}: {len(carnet_data)} passages")

    print(f"\nTotal: {total} passages across {len(manifest)} carnets")

    # Write manifest
    out = FR / "_translate_manifest.json"
    with open(out, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"Manifest written to: {out}")


if __name__ == "__main__":
    main()
