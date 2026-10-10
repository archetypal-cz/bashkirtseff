"""Tell IndexNow search engines (Bing, Seznam, Yandex, Naver…) which bashkirtseff.org pages changed.

  python3 src/scripts/indexnow.py --changed BEFORE AFTER   # pages whose content files changed between two commits
  python3 src/scripts/indexnow.py --sitemap                # every URL in the live sitemap (one-off full submission)
  add --dry-run to print the URLs instead of sending them

The key is public by design: IndexNow checks that https://bashkirtseff.org/<KEY>.txt
contains it (src/frontend/public/<KEY>.txt). Run by .github/workflows/deploy.yml after a deploy.
Standard library only.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET

HOST = 'bashkirtseff.org'
SITE = f'https://{HOST}'
KEY = 'c6b9bbcba5f1c096c3071700a08db419'
ENDPOINT = 'https://api.indexnow.org/indexnow'
BATCH = 10000
# content tree → URL path; es is staged but not served yet
TREES = {'_original': 'original', 'cz': 'cz', 'uk': 'uk', 'en': 'en', 'fr': 'fr'}
RE_ENTRY = re.compile(r'^content/([^/]+)/(\d{3})/([^/_][^/]*)\.md$')
RE_GLOSSARY = re.compile(r'^content/[^/]+/_glossary/(?:[^/]+/)*([A-Z0-9_]+)\.md$')


def changed_urls(before: str, after: str) -> list[str]:
    out = subprocess.run(['git', 'diff', '--name-only', before, after, '--', 'content/'],
                         capture_output=True, text=True, check=True).stdout.split()
    urls: list[str] = []
    for f in out:
        m = RE_GLOSSARY.match(f)
        if m:
            urls += [f'{SITE}/{p}/glossary/{m.group(1)}/' for p in TREES.values()]
            continue
        m = RE_ENTRY.match(f)
        if not m or m.group(1) not in TREES or m.group(3).upper() == 'README':
            continue
        path, carnet, entry = TREES[m.group(1)], m.group(2), m.group(3)
        # carnet 000 (the preface) is one merged page; its section files have no pages of their own
        urls.append(f'{SITE}/{path}/{carnet}/' if carnet == '000' else f'{SITE}/{path}/{carnet}/{entry}/')
    return list(dict.fromkeys(urls))


def sitemap_urls() -> list[str]:
    def locs(url: str) -> list[str]:
        with urllib.request.urlopen(url, timeout=60) as r:
            root = ET.fromstring(r.read())
        return [e.text.strip() for e in root.iter() if e.tag.endswith('loc') and e.text]
    urls: list[str] = []
    for loc in locs(f'{SITE}/sitemap-index.xml'):
        urls += locs(loc) if loc.endswith('.xml') else [loc]
    return urls


def submit(urls: list[str]) -> None:
    for i in range(0, len(urls), BATCH):
        body = json.dumps({'host': HOST, 'key': KEY, 'keyLocation': f'{SITE}/{KEY}.txt',
                           'urlList': urls[i:i + BATCH]}).encode()
        req = urllib.request.Request(ENDPOINT, data=body, method='POST',
                                     headers={'Content-Type': 'application/json; charset=utf-8'})
        with urllib.request.urlopen(req, timeout=60) as r:
            print(f'IndexNow: {len(urls[i:i + BATCH])} URL(s) → HTTP {r.status}')


def main() -> int:
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--changed', nargs=2, metavar=('BEFORE', 'AFTER'))
    g.add_argument('--sitemap', action='store_true')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    urls = sitemap_urls() if a.sitemap else changed_urls(*a.changed)
    if not urls:
        print('IndexNow: no page URLs changed')
        return 0
    if a.dry_run:
        print('\n'.join(urls[:50]) + (f'\n… {len(urls)} URLs' if len(urls) > 50 else ''))
        return 0
    submit(urls)
    return 0


if __name__ == '__main__':
    sys.exit(main())
