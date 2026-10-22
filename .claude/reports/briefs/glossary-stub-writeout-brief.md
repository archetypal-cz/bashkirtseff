# Brief — write out glossary stubs (owner ruling 2026-10-22)

KRR 2026-10-22: the ~650 live glossary entries whose body is a stub (≤2 text lines) get written out now,
«ideálně aspoň se základním ověřením». Role: glossary + researcher. Read `.claude/skills/glossary/SKILL.md`
(entry format, frontmatter), `.claude/reports/briefs/glossary-identity-research-brief.md` («Identity uncertain»
convention) and look at 3–4 good existing entries of the same category before writing.

## Per entry

1. **Collect the diary evidence:** every paragraph tagged with the entry (`just glossary-find ID`), read them
   in `_original`, plus the RSR/LAN notes and footnotes there.
2. **Basic verification:** the tome name indexes and scans in `content/_raw/` (Mon Journal index entries are the
   strongest identity source), Kernberger only as already cited in the glossary (the EPUB is not on disk), and
   a web check for public figures, places, works and institutions (Wikipedia/BnF/Gallica/thepeerage…). Cite every
   outside fact inline (source, page/URL). No unsourced dates or biographies.
3. **Write the body** in the entry's style: who/what it is (one line), Marie's relation and what she says (with
   paragraph IDs and short French quotes), dates/places, sources. Length to the evidence — a two-mention
   waiter gets 3–5 lines, not an essay. Keep existing correct content; fix wrong content with the source.
4. **Unsure identity:** «## Identity uncertain» section + `identity_uncertain: true`, saying what is known and
   that readers' insights are welcome. Never guess.
5. **Duplicates / wrong category / not a real entity:** don't merge/move/retire — list `SRC → TGT` with evidence.
6. Common nouns are never tagged (owner ruling 2026-10-22); don't add tags. If a tag on a paragraph is wrong,
   list it (paragraph, tag, why) — the lead fixes tags.

## Rules, gates, report

Only the glossary files of your list. Edit tool or Python. Never git checkout/restore/stash/reset; no commits.
Re-read a file right before editing it. Gates at the end: `just glossary-missing` 0, `just check-links-repo` 0.
Write touched paths (repo-relative, plain) to the file list named in your prompt. Report: written / identity
uncertain / merge-move-retire list / wrong tags / skipped (why).
