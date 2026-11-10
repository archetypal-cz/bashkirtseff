# Archived scripts

Not run by the justfile, skills or hooks. Kept for history; relative imports inside may no longer resolve (hooks import `./lib/` from `../../hooks/lib/`). Archived 2026-11-10 (owner decision A-44/A-46).

- `fix-midline-paragraph-ids.ts`: repair-kit script that moved mid-line paragraph IDs onto their own line; last used 2026-09-05 (last commit).
- `fix-inline-comments.py`: repair-kit script that split inline `%%` comments onto separate lines; last used 2026-09-05.
- `merges.txt`: one-off batch input (`SOURCE TARGET`, 46 lines) for `glossary-merge.ts batch-merge`; last used 2026-09-05.
- `hooks/pre-session.ts`: session-start hook showing work status; never registered in `.claude/settings.json`, last touched 2026-09-05.
- `hooks/bootstrap-readmes.ts`: created missing README/PROGRESS files; manual only, last touched 2026-09-05.
- `experiments/`: editorial-experiment harness (eval prompts, `analyze.ts`, `evaluate.ts`, `prepare-inputs.ts`); last touched 2026-09-05.
