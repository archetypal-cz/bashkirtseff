# Work order: glossary link tooling, git guardrails, and skill updates

You are the **workflow-architect** (see `.claude/skills/workflow-architect/SKILL.md`)
for the Marie Bashkirtseff project (repo root `/home/krr/bashkirtseff`, work on `main`).
This is a maintenance/infra task, NOT translation work. Implement the tasks below.
They are independent and individually shippable — do them in priority order, commit
each separately, verify each before moving on.

**Required reading first:** `docs/GLOSSARY_LINK_MAINTENANCE.md` — it explains the
broken-link workflow, the path-depth rule, the `just propagate-tag` tool, the tool
caveats, and the incident these guardrails are meant to prevent. Everything below
exists because of lessons in that doc.

**Environment caveats (real, will bite you):**
- Bash/Read tool output sometimes returns blank for several calls, then flushes at
  once. Don't re-run because output looks empty; write results to a file and Read it.
- The literal `%%` token in diary files can blank shell output; print via
  `python3 -c "print(open(f).read().replace('%%','@@'))"`.
- Do NOT use `just sync` for link work (it writes wrong-depth glossary paths).
- Prefer `just` recipes; project scripts are TypeScript (`src/scripts/`, run via
  `npx tsx`) or Python via `uv`. Add new just recipes for anything reusable.

---

## T1 (P0, tiny) — Fix the duplicate `PostToolUse` key in settings.json
`.claude/settings.json` currently declares `"PostToolUse"` twice inside `"hooks"`
(the second silently overrides the first; both currently run `post-edit.ts`). Collapse
to a single `PostToolUse` array. While there, confirm the JSON is valid
(`python3 -c "import json;json.load(open('.claude/settings.json'))"`).
**Acceptance:** one `PostToolUse` key; `post-edit.ts` still fires on Write|Edit; JSON valid.

---

## T2 (P0) — Git working-tree safety guard (PreToolUse Bash hook)
**Problem it prevents:** a subagent (and once, nearly, the main agent) ran
`git checkout -- <paths>`, `git stash`, and `git reset` that silently discarded
*uncommitted* work — the broken-link fixes lived only in the working tree at the time.

**Design (target the destructive ops, not normal git):**
- Add/extend the existing `PreToolUse` matcher `"Bash"` hook in `.claude/settings.json`
  to run a guard script (model it on `src/scripts/hooks/validate-write.ts`; put it at
  `src/scripts/hooks/guard-git.ts`). The hook receives a JSON payload on stdin
  including the tool input (the command string). A PreToolUse hook can **block** a
  call by exiting non-zero with an explanatory message on stderr (verify the exact
  block/deny contract for this Claude Code version — check existing hooks and the
  docs; use the supported mechanism, e.g. exit code 2 / JSON `{"decision":"block"}`).
- **Block by default** these *working-tree-or-history-destroying* commands:
  `git reset --hard`, `git checkout`/`git restore` that target tracked paths or `.`
  (i.e. would overwrite working files), `git stash` (drop/pop/clear and bare `stash`),
  `git clean -f/-d/-x`, `git push --force`/`--force-with-lease`, `git rebase`,
  `git branch -D`. **Always allow:** `git status/diff/log/show/add/commit/fetch/
  rev-parse/rev-list/reflog/branch (list)/switch -c`, normal `git push`,
  `git checkout -b`.
- **Opt-out for deliberate use:** allow an override via an env marker, e.g. the command
  is permitted if prefixed with `GIT_ALLOW_DESTRUCTIVE=1` (the guard checks for it).
  Document this in the block message so a human/main agent can consciously override.
- **Subagent detection (investigate, then decide):** determine whether the PreToolUse
  payload distinguishes a subagent (Task) call from the main agent (dump the raw stdin
  JSON to a temp file once and inspect fields like `session_id`, `transcript_path`,
  `hook_event_name`, any agent/parent indicator). 
  - If subagents ARE distinguishable: make the guard **hard-block destructive git for
    subagents** (no override) and **soft-block for the main agent** (override allowed).
  - If NOT distinguishable: apply the soft-block (override-allowed) to all, since that
    still stops the accidental case while letting a human proceed deliberately. Record
    what you found in a comment + in `docs/INFRASTRUCTURE.md`.
- Keep it fast and dependency-light; it runs on every Bash call.

**Acceptance / verification:**
- `echo '{"tool_input":{"command":"git reset --hard HEAD~1"}}' | npx tsx src/scripts/hooks/guard-git.ts` → blocks (non-zero / decision block).
- same for `git checkout -- content/`, `git stash`, `git clean -fd`, `git push --force`.
- `git commit`, `git push`, `git status`, `git checkout -b x`, and a normal
  `git checkout <branch>` (no path args) → allowed.
- `GIT_ALLOW_DESTRUCTIVE=1 git stash` form → allowed (soft-block path).
- Real smoke test: try a blocked command through the agent and confirm it's stopped.
- Don't break the existing `🔧 Running command...` behavior unless you fold it in.

---

## T3 (P1) — `just check-links-repo`: one-shot broken-link scan across ALL trees
Today `check-links-all` is per-language and the **`_original`** source tree is easy to
forget (a whole residual set was missed once). Add a recipe + script that scans all
five trees (`_original`, `cz`, `en`, `uk`, `fr`), applying the correct path-depth per
tree (`../_glossary/` for `_original`, `../../_original/_glossary/` for translations),
prints per-tree distinct/instance counts and the list of broken targets, and **exits
non-zero if any are broken** (so it's CI-usable). Reuse the scanner in
`docs/GLOSSARY_LINK_MAINTENANCE.md` §2 as the reference implementation; put the script
in `src/scripts/` (TS preferred, or Python via uv) and wire `just check-links-repo`.
**Acceptance:** `just check-links-repo` reports `0 broken` for all five trees today
(current state is clean) and exits 0; temporarily introduce a bad link in a scratch
copy to confirm it exits non-zero and names the target; then revert.

---

## T4 (P1) — `propagate_glossary_tag.py`: add a `--from <lang>` seed mode
`propagate_glossary_tag.py` only reads tags from `content/_original/` and fans out to
translations. Tags that originate in a translation (en/uk fixes) therefore can't be
propagated without a manual source-tagging step. Add an optional `--from <lang>` that
seeds the propagation from paragraphs tagged in that language: for each
`(carnet, paragraph_id)` carrying `--target` in `content/<from>/`, ensure the tag is
present (additive, correct depth, idempotent) in **source AND every other language**
that has that paragraph. Keep the default behavior (source → translations) unchanged
when `--from` is omitted. Preserve the script's existing guarantees: surgical, additive
only, never edits text/other tags, skips already-tagged and missing paragraphs/files,
dry-run by default.
**Acceptance:** dry-run shows expected additions for a known en-origin tag; `--apply`
makes `just check-links-repo` stay 0-broken; re-running adds nothing (idempotent);
default mode (no `--from`) output unchanged vs. before.

---

## T5 (P2) — `just glossary-resolve <name>`: REMAP candidate suggester
To speed REMAP identity calls, add a helper that, given a missing target basename (or
a broken-link target path), suggests existing glossary entries that might be the same
entity: match on filename, `aliases:`/`name:` frontmatter, and fuzzy/substring
(e.g. `NINA_BELLOTTI` → `MLLE_BELLOTTI`; `HOWARD_CHILDREN` → `HOWARD_FAMILY`). Print
candidates with their category and a snippet of the Overview so a human/agent can
confirm. Read-only. Wire `just glossary-resolve`.
**Acceptance:** running it on a few of the names from
`.claude/reports/2026-05-31-glossary-link-cleanup-en-uk.md` surfaces the entries that
were actually used as remap targets.

---

## T6 (P2) — CI guard against committed broken links
Add a CI step (GitHub Actions; see `.github/workflows/`) that runs
`just check-links-repo` and fails the build on any broken glossary link. This makes the
"fixes lived only in an uncommitted working tree / a broken link slipped in" situation
impossible to merge silently. Keep it fast (the scan is pure file IO).
**Acceptance:** workflow file added; passes on current `main`; a PR introducing a
broken link would fail the check.

---

## T7 (P1) — Skill updates (encode the lessons where agents will read them)
Update the relevant `SKILL.md` files so future agents don't relearn this the hard way.
Keep additions concise and link to `docs/GLOSSARY_LINK_MAINTENANCE.md` for depth.

1. **Subagent git-safety — add to the skills that spawn subagents / do bulk work**
   (`executive-director`, `workflow-architect`, `glossary`, `researcher`, and the
   shared `.claude/skills/_shared/` if appropriate): a short standing rule —
   *"Subagents must perform NO git mutations (no `checkout`/`reset`/`stash`/`clean`/
   `rebase`/force-push) — read-only git only; if a subagent thinks it needs git, it
   must stop and report. Commit early; uncommitted work is one stray `git checkout`
   from gone."* (The T2 hook enforces this; the skill text explains the intent.)
2. **Researcher (`.claude/skills/researcher/SKILL.md`) — individual vs. family /
   identity disambiguation.** Add guidance: when resolving or creating an entity,
   distinguish **a family/group from a named individual** and **spelling variants that
   may be different people**. Real examples to cite: `SOLOMINKA_MARKEVITCH` is a
   distinct person from `MME_MARKEVITCH` (do not merge); `M_TCHERNIKOFF` was kept
   distinct from `TCHERNICHOFF` (uncertain identity). Rule of thumb: **when unsure,
   create a distinct entry rather than collapse two people — under-merging is
   reversible, a wrong merge quietly corrupts the record.** Reinforce the existing
   citation requirement (Kernberger 2013, Wikipedia, Blind 1890, etc.).
3. **Glossary (`.claude/skills/glossary/SKILL.md`)** — already links the playbook
   (added previously); verify the link is present and correct, add the REMAP/CREATE/
   PRUNE one-liner if missing.

**Acceptance:** each named skill has the addition; links resolve; no skill bloats
beyond a short paragraph + a link.

---

## Global acceptance for the whole work order
- `just check-links-repo` → 0 broken across all five trees, exits 0.
- The git guard blocks the destructive set and allows normal git (T2 tests pass).
- `git status` clean after each task's commit; HEAD advances by one commit per task;
  no working-tree-destroying git was needed to do any of this.
- Update `docs/GLOSSARY_LINK_MAINTENANCE.md` §8 to tick off whatever you shipped, and
  note any item you deliberately deferred and why.

Commit messages: conventional style, end each with
`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
Ask before pushing; do not force-push.
