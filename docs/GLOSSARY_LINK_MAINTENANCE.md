# Glossary link maintenance — a playbook for future agents

Written after a session that cleared all remaining broken glossary links across the
five content trees, created 53 entries, and propagated tags — and hit several traps
worth documenting so you don't repeat them. Read this before doing glossary
link-health or tag-propagation work.

The five trees: `content/_original/` (French source, the source of truth) and the
four translations `content/cz/`, `content/en/`, `content/uk/`, `content/fr/`.

---

## 0. The one-paragraph summary

Broken glossary links come in three kinds — **REMAP** (link points to an entry that
moved/renamed), **CREATE** (the entry genuinely doesn't exist yet), **PRUNE** (the
tag is spurious). Fix link *health* per tree first. Then, if you must make the
languages carry identical tags, **propagate via the existing tool
`just propagate-tag`, never a hand-rolled "union all tags" script.** Verify with the
broken-link scanner after every batch. Commit in logical layers. Never let a
subagent run git mutations.

---

## 1. Tools & environment caveats (the things that bit us)

### 1a. Bash/Read tool output intermittently goes blank, then flushes
For stretches of several consecutive calls the Bash/Read tools returned **empty
output**, then the whole queue **flushed at once** a few turns later. The commands
*did* execute on disk during the blackout — only the display was delayed.
- Do **not** re-run a command because its output looked empty; you'll pile up
  duplicate/contradictory work (this is partly how the propagation disaster started).
- Write results to a file (`… > /tmp/out.txt 2>&1`) and `Read` it once output
  returns. Re-reading a file is safe and idempotent.
- For anything heavy or multi-step, **delegate to a subagent** — its final report
  comes back through the agent channel, which is unaffected by these blackouts. This
  was the single most effective workaround.

### 1b. The literal `%%` token can blank tool output
Diary paragraph IDs and comments use `%% … %%`. Printing such lines through Bash can
blank the output. When you must print file contents in a shell, neutralize it:
```bash
python3 -c "print(open('PATH').read().replace('%%','@@'))"
```
The `Read` tool on real files is usually fine; this mainly bites `cat`/`grep` in Bash.

### 1c. `just sync` / `sync-all` will RE-BREAK every link — do not use it for link work
`sync` copies RSR/LAN annotations from source into a translation and writes
**source-relative** `../_glossary/…` paths into translation files. Translations live
one directory deeper, so the correct path is `../../_original/_glossary/…`. Running
`sync` silently reintroduces the path-depth bug across the board. Use it only for
its intended annotation-sync purpose, never to "fix" or "propagate" links.

### 1d. `propagate_glossary_tag.py` only goes source → translations
`just propagate-tag` reads paragraphs in `content/_original/` that carry a target tag
and adds that tag to the **matching paragraph (by ID)** in each translation. It does
**not** read translations, and it does **not** add tags to source. So a tag that
currently exists only in `en` or `uk` (common, because fixes are often made tree by
tree) won't propagate until you first add it to the source paragraph.

---

## 2. The broken-link scanner (your ground truth)

`just check-links <lang> <carnet>` and `just check-links-all <lang>` exist and work,
but for a fast, scriptable per-tree count use this (note the per-tree path prefix):
```bash
for L in _original cz en uk fr; do
  if [ "$L" = "_original" ]; then pre='../_glossary'; else pre='../../_original/_glossary'; fi
  python3 - "$L" "$pre" <<'PY'
import glob,os,re,sys
lang,pre=sys.argv[1],sys.argv[2]
L=re.compile(r'\]\(('+re.escape(pre)+r'/[^)#]+\.md)\)')
from collections import Counter
m=Counter()
for f in glob.glob(f'content/{lang}/[0-9][0-9][0-9]/*.md'):
    d=os.path.dirname(f)
    for x in L.finditer(open(f,encoding='utf-8').read()):
        if not os.path.isfile(os.path.normpath(os.path.join(d,x.group(1)))):
            m[x.group(1).split('_glossary/')[1]]+=1
print(f"{lang}: {sum(m.values())} broken, {len(m)} distinct")
for k,v in sorted(m.items()): print(f"   {v} {k}")
PY
done
```
**Path-depth rule (memorize it):** source files use `../_glossary/<cat>/<ID>.md`
(one `..`); every translation uses `../../_original/_glossary/<cat>/<ID>.md` (two).
Glossary filenames are CAPITAL_ASCII.

Run this **before** you start (to scope the work) and **after every batch** (to
confirm you didn't introduce or miss anything). Scan all five trees, not just the
one you think you touched — a "source-only" residual set is easy to miss.

---

## 3. Resolving a broken link: REMAP / CREATE / PRUNE

Work each distinct broken target. **Read the referencing paragraph first** (the
French text + nearby RSR notes) to learn what's actually meant — never decide on a
surname match alone. Then:

- **REMAP** — an entry for the *same* entity already exists under another
  name/category. Find it (`find content/_original/_glossary -iname '*NAME*'`),
  confirm identity, then repoint the link (path-only edit; leave display text). Two
  real traps we hit: a "family" tag is not always the same entry as the individual
  (`SOLOMINKA_MARKEVITCH` turned out to be a *different* person from `MME_MARKEVITCH`,
  so it became a CREATE, not a remap); and a spelling variant may or may not be the
  same person (`M_TCHERNIKOFF` vs `TCHERNICHOFF` — kept distinct when unsure).
- **CREATE** — real, identifiable entity with no entry. Write a **sourced** entry at
  exactly the path the broken link points to (so it resolves immediately). Model on
  an existing entry (e.g. `content/_original/_glossary/people/mentioned/BRISBANE.md`):
  frontmatter `id/name/aliases/type/category/research_status/last_updated`, then
  `# Name`, `## Overview` (sourced paragraph), `## Related Entries`. A short, honestly
  sourced stub beats a broken link. **Always cite** (Kernberger 2013; Wikipedia;
  Blind 1890; Britannica; BNF; etc.).
- **PRUNE** — the tag is spurious (a common noun auto-tagged as a person, e.g.
  `RUSSIE`/`ITALIE`), garbled, a broken duplicate of a working tag, or a trivial
  one-off (a pet, an unnamed servant). Remove just that one `[#Display](…)` link; if
  it leaves an empty `%% %%` line, delete the line.

> Note: simply **creating** the missing entry files fixes every CREATE link in all
> trees at once (the links already point there). Only REMAP and PRUNE require editing
> the carnet files.

---

## 4. Cross-tree tag propagation — the right way and the very wrong way

Goal: the same diary paragraph should carry the same glossary tags in all five trees.

### ✅ The right way (use the purpose-built tool)
1. **Make the source the superset.** For each tag that should exist on a paragraph
   but currently lives only in `en`/`uk` (or nowhere in source), add it to the
   **source** paragraph `content/_original/<carnet>/<date>.md` with a
   `%% [#Display](../_glossary/<cat>/<ID>.md) %%` line.
2. **Fan out with the tool**, once per entity:
   ```bash
   just propagate-tag --target <cat>/<ID>.md --display <Display> --apply   # omit --apply for dry-run
   ```
   `propagate_glossary_tag.py` is surgical: it matches by paragraph ID, inserts the
   **one** tag line with the correct translation path depth, mimics each file's tag
   style, skips paragraphs already tagged, and skips files/paragraphs that don't exist
   in a translation. It defaults to a dry-run — read that first.

### ☠️ The way that went wrong (don't)
A custom script that, for the touched paragraphs, took the **union of *all*
glossary tags across trees and back-filled every tree** — this is NOT scoped to your
change. It pulled in every pre-existing tag on those paragraphs and, because it
wasn't bounded to specific carnets either, ballooned into a **repo-wide rewrite
(~60,000 insertions)**. If you must write a custom propagation script:
- Bound it to an **explicit, enumerated target-path set** (the specific entities you
  changed) — never "all tags on the paragraph".
- Bound it to an **explicit carnet scope**.
- **Additive only**: insert tag lines; never delete, reorder, or alter existing
  lines; never insert a tag whose entry file doesn't exist.
- Confirm `git diff --numstat` shows **0 deletions** and the file set is confined to
  your intended carnets.

---

## 5. Git safety (this is where it got scary)

- **Subagents must do NO git mutations.** A propagation subagent ran
  `git stash`/`checkout`/`reset` to "recover" and nearly lost uncommitted work. Tell
  every subagent explicitly: *read-only git (`status`/`ls-files`) only; pure file
  edits; if you think you need git, stop and report.*
- **Uncommitted work is fragile.** If a prior session's fixes are uncommitted, any
  `git checkout -- content/` (yours or a subagent's) reverts them to HEAD. Either
  commit early, or treat the working tree as precious and back it up
  (`cp -r content /tmp/content_S`) before any operation that could touch it.
- **Clean recovery pattern** (used successfully here): `git checkout HEAD -- content/`
  resets tracked files to HEAD while **untracked new entry files survive**; then
  re-apply the deterministic REMAP/PRUNE edits; then re-run the *scoped* propagation.
  Creates auto-resolve as soon as the entry files exist.
- **Committing in layers when changes are intermingled in the same files:** back up
  the final verified tree (`cp -r content /tmp/S`), `git checkout HEAD -- content/`,
  rebuild + commit layer 1, then restore the backup (`rsync -a --delete /tmp/S/
  content/`) and commit layer 2. Layer 2's diff is then exactly the delta. We split
  "link fixes + new entries" from "propagation" this way.

---

## 6. Delegation patterns that worked

- **Partition by tree to avoid write conflicts.** One agent owned `content/en/`,
  another `content/uk/`, another `content/_original/` carnets. New glossary files
  have distinct names, so parallel creates don't collide.
- **Read-only research vs. editing.** When unsure, have agents *return a decision
  table* (REMAP target / CREATE draft / PRUNE reason) and apply edits yourself — or
  let them edit only their partition. Either way, forbid cross-partition writes.
- **Give agents the `%%` and blackout caveats** (§1a–1b) so their own tooling doesn't
  mislead them.
- **Make every agent self-verify** in its own context (run the §2 scanner, report the
  count) and **independently audit** big changes with a fresh agent (HEAD intact?
  scope confined? additive? 0 broken? no stray files?).

---

## 7. Done-when checklist

1. §2 scanner reports **0 broken** in **all five** trees.
2. `git diff --numstat` deletions are only intentional prunes (propagation = 0
   deletions).
3. Modified files are confined to the carnets you intended (`git status --short | …`).
4. New entry files are non-empty and sourced; existing entries unmodified.
5. `git rev-parse HEAD` unchanged from when you started (no accidental reset);
   `git reflog` shows no surprise `reset`/`checkout` that moved HEAD.
6. Tags you propagated now appear in every tree that has the relevant paragraph (0
   residual cross-tree gaps for your target set).

---

## 8. Suggested tooling improvements (for whoever maintains the scripts)

- **A repo-wide broken-link check across *all* trees in one command**, exit-coded for
  CI, covering `_original` too (today `check-links-all` is per-language and the
  source tree is easy to forget). The §2 snippet could become `just check-links-repo`.
- **A `--from <lang>` option (or a sibling script) for `propagate_glossary_tag.py`**
  that can seed the source paragraph from a tag found in a translation, so en/uk-origin
  tags can be propagated without a manual source-tagging step.
- **A guard/CI hook** that fails if any committed glossary link is broken, so the
  "fixes lived only in an uncommitted working tree" situation can't recur silently.
- **A small `glossary-resolve` helper** that, given a missing target basename,
  proposes candidate existing entries (alias/fuzzy match) to speed REMAP decisions.

See also the run report `.claude/reports/2026-05-31-glossary-link-cleanup-en-uk.md`
for the concrete inventory of what was created/remapped/pruned in that session.
