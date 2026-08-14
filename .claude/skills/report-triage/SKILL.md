---
name: report-triage
description: Evaluate and implement user bug reports from the paragraph_reports database on aretea. Fetch open reports, map each to content files, judge against the French original, fix via translator/editor/researcher/restructurer agents, and update report status. Use when the user asks to go through reader reports.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task, TaskCreate, TaskUpdate, TaskList, AskUserQuestion
---

# Report Triage — Evaluating and Implementing User Reports

Readers of bashkirtseff.org can report a paragraph (button in the paragraph menu). Reports land in the `paragraph_reports` table in the auth-db on aretea. This skill turns those reports into evaluated, implemented fixes — one by one, with the user in the loop when judgment calls arise.

## Fetching reports

```bash
just reports              # open reports only
just reports-all          # everything, with status
just report-status 105.0111 cz fixed   # statuses: open, acknowledged, fixed, dismissed
```

**SSH caveat**: these recipes ssh as `deploy@$DEPLOY_HOST` and silence errors (`2>/dev/null`) — if `DEPLOY_HOST` is unset or the deploy key isn't authorized from this machine, the list comes back **silently empty**. Verify with a direct query before concluding there are no reports:

```bash
ssh root@aretea "docker exec auth-db psql -U gotrue -d gotrue -t -A -F'|' -c \
  \"SELECT paragraph_id, language, reason, coalesce(custom_reason,''), coalesce(highlighted_text,''), status, created_at FROM public.paragraph_reports ORDER BY created_at\""
```

Same pattern for status updates if `just report-status` reports "No report found" for a row you can see.

## Report anatomy

- `paragraph_id` — `XXX.YYYY` (carnet.paragraph), locate with `grep -rln '%% XXX.YYYY %%' content/<lang>/XXX content/_original/XXX`
- `language` — which translation the reader was viewing
- `reason` — `unnatural`, `factual_error`, `other`, …
- `custom_reason` — free text, often in Czech, often from KRR himself (project owner). Treat owner reports as authoritative reviewer feedback: they override earlier TR/RED/CON decisions.
- `highlighted_text` — the exact text the reader selected. **Check timing**: compare `created_at` against recent commits touching that carnet. If the highlighted text matches the *current* file, the report targets the current version; if it only matches an older revision, the complaint may already be fixed.

## Triage loop (one report at a time)

1. **Locate** the paragraph in `content/<lang>/` and `content/_original/`.
   <!-- Teamcouch update 2026-08-14: fix the class, not the instance.
        Evidence: 2026-08-13-report-triage-099.md — a single-instance uk/082 fix missed 3 more
        duplicates in the SAME FILE (caught by RED); two old RED notes (uk/082 08-22, 09-09) and
        a TR note (en/082 09-03) from earlier waves had each flagged one instance of the same
        defect and left the rest — three independent half-fixes across waves. -->
   **Before fixing, sweep for the class.** A reported defect is usually one instance of a family: grep the same file, then the carnet, then (cheaply) the tree for the same pattern — and check the *other language trees and `_original`* at the same paragraph. Fix the whole set you find, or explicitly report what you're deferring. A fix that patches only the reported instance reads as done but isn't — that's how half-fixed files accumulate.
2. **Evaluate** against the French original. Classify:
   - **Translation quality** (`unnatural`, meaning shifts) → translator fixes, editor verifies
   - **Missing/wrong glossary tags** → researcher (scope tags to the explicitly reported files ONLY — never repo-wide propagation)
   - **Structure** ("má být nový záznam" = entry split, paragraph order) → entry-restructurer, and remember splits touch **all five versions** (_original + cz/uk/en/fr) plus `para_start`/`para_end` frontmatter
   - **Formatting/rendering** (markdown leaking as literal text, layout) → frontend, usually `src/frontend/src/lib/content.ts` (`processTextToHtml`, `joinClusterLines`) — fix the renderer for the whole class, not the one paragraph, and check whether content elsewhere depended on the old broken behavior (e.g. duplicated heading lines)
   - **Feature requests** (in `custom_reason`) → implement a minimal version if cheap (e.g. a glossary entry), log the broader idea in `.claude/reports/WATCHLIST.md`
   - **Unwarranted** → `dismissed`, but say why in the session summary
3. **Fix via the team.** Spawn role agents (translator, editor, researcher, entry-restructurer) with: the report verbatim, the French original, the current text, your analysis, and the comment convention below. Batch reports per carnet/agent; run independent agents in parallel. If two agents will touch the same file (e.g. a tagger and a splitter), order them explicitly and tell the later one to re-read from disk.
   <!-- Teamcouch update 2026-07-06 (first-run calibration): two taggers sharded over one carnet
        collided when one overran its file scope (5th instance of the concurrent-edit family;
        benign only because their tag sets converged). -->
   **One agent per carnet per concern** — never shard a single sweep (tagging, convention fix) across two agents in the same carnet, even with disjoint file lists; scope instructions get overrun. Serialize instead, or give the whole carnet to one agent.
4. **Comment convention**: fixes triggered by reports carry a role comment noting the origin, e.g. `%% 2026-07-06T21:00:00 TR: User report fix. … %%`. KRR is a valid comment code for notes from the owner himself.
5. **Editor pass**: translation fixes get a quick RED review (fresh agent) before being called done — user-reported paragraphs have already failed review once.
6. **Update status** in the DB: `fixed` when committed, `dismissed` with reasoning reported to the user, `acknowledged` for deferred items (also add them to WATCHLIST so they aren't lost).
   <!-- Teamcouch update 2026-07-06 (first-run calibration): a new report arrived MID-SESSION;
        a WHERE status='open' update would have wrongly marked it fixed. -->
   Update rows by **explicit id (UUID)**, never by a status filter — and **re-query the table before closing out**: reports can arrive while you work, and a fresh one deserves the same triage in the same session.
7. **Commit** with a message referencing the report(s), e.g. `fix(content): user report fixes cz 000.0009-0025 + 105 entry splits`.

## Verification before "fixed"

- `%%` markers balanced in every touched file (stranded-text check from the cz-fluidity method if in doubt)
- For splits: paragraph IDs unchanged, no paragraph lost (count IDs before/after across both halves), all five language versions consistent
  <!-- Teamcouch update 2026-07-06 (first-run calibration): the splitter's sed-range derivation
       silently dropped 3 paragraphs at seams (self-caught by its count check), and it applied
       _original's `#` date-heading convention but left translations as plain text. -->
  Concretely: `grep -c '^%% NNN\.[0-9]\{4\} %%$'` must be **identical per file across all five sources**, the ID range contiguous with no duplicates; then eyeball each new file's opening — the date must be a `#` heading in **that language's own sibling convention** (translated, no stray periods). fr trap: the fr edition promotes a cluster's `%% … %%` comment to visible text only when the cluster has NO visible line — so a heading added to an fr cluster hides its commented prose unless the prose is also copied out visibly. fr files also have no YAML frontmatter (repo-wide; `verify-carnet fr` frontmatter failures are baseline, not your regression).
- For renderer changes: `just fe-build` must pass; spot-check the affected paragraph in build output if feasible
- For tags: link targets exist (`just glossary-missing`)

## Reporting back

End with a table: report → verdict (fixed / dismissed / deferred) → what changed → status set in DB. Note any pattern worth a WATCHLIST entry (e.g. several reports against text a specific pipeline pass produced).
