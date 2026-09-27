# content/_renumber — carnet rebuild records

Written by `just rebuild-carnet CCC plan.json --write` (docs/REBUILD_CARNET.md). Committed with the rebuild.

- `CCC-YYYY-MM-DD.json` — old→new paragraph ID map, renamed/removed entry files, new and dropped paragraphs, approval-flag resets, the plan itself.
- `CCC-YYYY-MM-DD.sql` — remaps `paragraph_reports.paragraph_id` on the auth database; run once after the rebuild is deployed.
- `redirects.json` — cumulative old→new entry URLs for every language; `src/frontend/astro.config.mjs` adds them to its `redirects`.

This directory is excluded from the repo-wide reference rewrite (the maps must keep the old IDs). `just renumber-check CCC` reads the maps to find links to removed entry files.
