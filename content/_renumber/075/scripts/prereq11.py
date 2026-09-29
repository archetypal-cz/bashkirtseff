"""Prerequisite for the tome 11 rebuild (mechanical, 4 trees): drop the obsolete sentence «NOTE: Paragraph numbering
anomaly … continuing from 078.1741 …» from the RSR note of 078/1878-02-10.md; the rest of the note (the summary) stays.
renumber-check reads «078.1741» as an ID beyond the rebuilt carnet. Usage: python3 prereq11.py <repo root>"""
import re, sys
root = sys.argv[1]
PAT = re.compile(r'NOTE: Paragraph numbering anomaly — this entry starts at 078\.0455 instead of continuing from 078\.1741\. Likely a restructuring artifact from a separate source section\. ')
for t in ('_original', 'cz', 'uk', 'en', 'fr'):
    f = f'{root}/content/{t}/078/1878-02-10.md'
    s = open(f).read()
    s2, n = PAT.subn('', s)
    if n:
        open(f, 'w').write(s2)
    print(f'prereq11: {t} {n}')
