# content/_renumber — carnet rebuild records

Written by `just rebuild-carnet CCC plan.json --write` (docs/REBUILD_CARNET.md). Committed with the rebuild.

- `CCC-YYYY-MM-DD.json` — old→new paragraph ID map, renamed/removed entry files, new and dropped paragraphs, approval-flag resets, the plan itself.
- `CCC-YYYY-MM-DD.sql` — remaps `paragraph_reports.paragraph_id` and moves `paragraph_stars` on the auth database. **Applied automatically by the deploy job** (`src/auth/db-deploy.sh`); do not run it by hand.
- `redirects.json` — cumulative old→new entry URLs for every language; `src/frontend/astro.config.mjs` adds them to its `redirects`.

This directory is excluded from the repo-wide reference rewrite (the maps must keep the old IDs). `just renumber-check CCC` reads the maps to find links to removed entry files.

Rules for the `.sql` scripts:

- Never edit a committed script: its sha256 is recorded in the deploy ledger, and a changed file fails every deploy. Write a follow-up script instead.
- Only top-level `content/_renumber/*.sql` files are applied. Subdirectories (`titlenotes-…/`, `split-wave/`, …) never are.
- Scripts come from the generator only (`just rebuild-carnet`). It starts each with the marker `-- deploy-ledger: renumber v1`, uses no `BEGIN`/`COMMIT`, and never overwrites an existing file (`-2`, `-3` suffix). A marker-less script fails the deploy with recovery instructions.
- Emergency manual run only via `psql -1` on stdin.
