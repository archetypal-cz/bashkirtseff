# Brief — research the open glossary identity questions (2026-10-22)

Owner (2026-10-22): the unresolved merges and identities in
`.claude/reports/glossary-cleanup-2026-10-21/glossary-owner-questions.md` are research questions, not owner
decisions. Settle each one from the sources; where research cannot settle it, the entry says so openly and
invites readers' insights. Role: researcher + glossary. Read `.claude/skills/researcher/SKILL.md`,
`.claude/skills/glossary/SKILL.md`, `.claude/reports/briefs/restored-rsr-brief.md` (rules 1–9) and
`~/rebuild-state/tag-audit/TAGGER_BRIEF.md`.

## Sources

Every tagged paragraph of the entries involved (`just glossary-find ID`; read the entry around it), the name
index of the matching tome in `content/_raw/` (Mon Journal), the scans in `content/_raw/scans/` (pymupdf text
layer), Kernberger 2013 (`raw_books/`), and the web (prefects, peerage, Almanach de Gotha, BnF, Wikipedia).
Quote the deciding line for every conclusion; give a confidence.

## Output per question

1. **Settled (≥0.8):** write the decision into `glossary-identity-decisions.tsv` in the session scratchpad
   (question, decision = merge SRC→TGT | split | retag | keep separate | rewrite body | retire, the exact
   paragraph IDs to retag with from/to IDs, evidence quote + source, confidence). **Do not run glossary-move,
   glossary-merge or anything that rewrites references, and do not edit diary carnet files** — other agents
   are writing in them; the lead applies your TSV afterwards. You may fix the glossary entry bodies involved
   (identity, dates, sources) right away.
2. **Not settled:** keep the entries apart and put, in each entry's body, a short section:

   ```
   ## Identity uncertain
   We are not sure who this is. <What the diary says, with dates/IDs; the candidates and why each fits or not;
   sources checked.> If you can identify this person, we would be glad to hear from you.
   ```

   (adapt «person» for places/things), and an `identity_uncertain: true` line in the frontmatter. Add the
   question to the TSV with decision = uncertain.

## Rules

Glossary files only (plus the TSV); not VIOLETTE, CINQ_FEMMES or the new mask-name entries (another agent).
Check a file's current content right before editing it. Edit tool or Python. Never git
checkout/restore/stash/reset; no commits. Gates: `just glossary-missing` clean, `just check-links-repo` 0.
Report: per question one line (settled → decision, or uncertain), files edited.
