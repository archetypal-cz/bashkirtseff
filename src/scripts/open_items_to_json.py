"""Convert .claude/reports/OPEN-ITEMS.md into JSON for the Open Items artifact page.

Usage: uv run src/scripts/open_items_to_json.py [OUT.json]
"""
import datetime
import json
import subprocess
import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / ".claude/reports/OPEN-ITEMS.md"

SECTIONS = {
    "A": "Needs owner decision",
    "B": "Research",
    "C": "Source fixes",
    "D": "Sweeps",
    "E": "Parked",
    "R": "Recently done",
}


def parse(text: str) -> dict:
    items, sec, sub = [], None, None
    for line in text.split("\n"):
        m = re.match(r"^## ([A-E])\.", line)
        if m:
            sec, sub = m.group(1), None
            continue
        if line.startswith("## Recently done"):
            sec, sub = "R", None
            continue
        m = re.match(r"^### (.+)", line)
        if m:
            sub = m.group(1).strip()
            continue
        m = re.match(r"^- \[( |x)\] ([A-ER]-\d+) (.*)$", line)
        if not m or not sec:
            continue
        done, iid, rest = m.group(1) == "x", m.group(2), m.group(3)
        tags = []
        while True:
            t = re.match(r"^\[([^\]]+)\]\s*", rest)
            if not t:
                break
            tags.append(t.group(1))
            rest = rest[t.end():]
        effort = next((t for t in tags if t in ("S", "M", "L")), None)
        areas = [t for t in tags if t not in ("S", "M", "L")]
        tm = re.match(r"^\*\*(.+?)\*\*\s*(.*)$", rest)
        title, body = (tm.group(1), tm.group(2)) if tm else (rest, "")
        body = re.sub(r"^[—–-]\s*", "", body)
        items.append({
            "id": iid, "sec": sec, "sub": sub, "done": done,
            "areas": areas, "effort": effort, "title": title, "body": body,
        })
    return {"sections": SECTIONS, "items": items}


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "open-items.json"
    data = parse(SRC.read_text())
    rev = subprocess.run(["git", "log", "-1", "--format=%h", "--", str(SRC)], capture_output=True, text=True, cwd=SRC.parent).stdout.strip()
    data["built"] = f"{datetime.date.today().isoformat()} ({rev or 'uncommitted'})"
    Path(out).write_text(json.dumps(data, ensure_ascii=False, indent=1))
    print(f"{len(data['items'])} items -> {out}")
