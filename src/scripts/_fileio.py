# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Newline-preserving reads and atomic writes for the content rewriters."""
import os
import shutil
from pathlib import Path


def read_text(path):
    """Return (text, newline): text uses \\n, newline is the file's dominant ending.

    A file with mixed endings is normalized to whichever style is in the majority
    (ties go to bare \\n), so a rewrite never preserves a stray lone \\r\\n.
    """
    with open(path, encoding='utf-8', newline='') as f:
        raw = f.read()
    crlf = raw.count('\r\n')
    lf = raw.count('\n') - crlf
    newline = '\r\n' if crlf > lf else '\n'
    return raw.replace('\r\n', '\n'), newline


def write_text_atomic(path, text, newline='\n'):
    """Write text to path via a same-directory temp file plus os.replace.

    The temp file inherits the original's permission bits, and is removed again if
    writing or replacing raises, so a failed run leaves no stray `.tmp` behind.
    """
    p = Path(path)
    tmp = p.with_suffix(p.suffix + '.tmp')
    if newline != '\n':
        text = text.replace('\n', newline)
    try:
        with open(tmp, 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        if p.exists():
            shutil.copymode(p, tmp)
        os.replace(tmp, p)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise
