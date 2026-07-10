# Implementation Plan: Role Comments as Native VSCode Comment Threads

*2026-07-10. Detailed plan for the `vscode.CommentController` feature from `docs/vscode-parallel-editor-vision.md` §3.2. Plan only — no code exists yet. All API claims below were source-verified against `vscode.d.ts`/`extHostTypes.ts` and the GitHub PR extension; all corpus numbers were measured on this repo on 2026-07-10.*

**Goal.** Every `%% timestamp ROLE: … %%` comment in an open entry file appears as a native, collapsible comment thread anchored to its paragraph — PR-review style, with role-colored avatars, chronological order, and a Comments-panel overview — while the raw `%%` lines fold away. The human can reply from the thread UI and the reply is written back into the file as a properly formatted comment line. The markdown file remains the single source of truth; threads are a pure projection.

---

## 0. Verified constraints this plan is built on

**API facts (source-verified, stable API):**

| Fact | Consequence |
|---|---|
| `CommentAuthorInformation = { name: string; iconPath?: Uri }` — `Uri` only, no ThemeIcon; `file:` URIs work since VSCode 1.77; `data:` URIs are unsupported/risky | Per-role avatars = small SVG files bundled in the extension, passed as `file:` Uris |
| `CommentThread.range` does **not** auto-track document edits (unlike decorations); the GitHub PR extension maintains its own position bookkeeping | We re-anchor ourselves on `onDidChangeTextDocument` (§5); paragraph IDs make this cheap and exact |
| A `CommentController` cannot enumerate its own threads (vscode#243152) | We keep our own registry `Map<uriString, Map<paragraphId, ThreadRecord>>` |
| `CommentThreadState { Unresolved, Resolved }` is stable; the Comments panel has a built-in resolved/unresolved filter + text filter; **no API for custom panel filters** | "Resolved" mapping in §6; role filtering must be implemented by creating/disposing threads, not by panel filters |
| `commentingRangeProvider` is required for the gutter "+" (new threads); replies to existing threads work without it (`canReply`, default true) | We ship a provider restricted to paragraph prose lines |
| Edit/delete flows are fully extension-contributed: `Comment.mode` (Editing/Preview), menus `comments/comment/title` + `comments/comment/context` gated by `comment.contextValue`, incl. our own Save/Cancel commands | §4.3 |
| `Comment.body: string \| MarkdownString` (always rendered as markdown); `Comment.timestamp?: Date` exists → native relative-time display; `Comment.label` shows next to the author name | Timestamps go in `Comment.timestamp`, "NOTE" badge goes in `Comment.label` |
| `CommentThread.label` shows in the thread header; `collapsibleState` is settable after creation; `workbench.action.focusCommentsPanel` opens the panel | §2, §6 |
| Threads are URI-global (same threads in every editor group showing the file); creating/updating threads never touches dirty state or undo | Safe to run alongside agents editing files |

**Corpus facts (measured 2026-07-10):**

- Role census (timestamped comments across `content/`): LAN 118,120 · TR 20,217 · RSR 16,732 · RED 3,888 · CON 3,552 · **FRE 1,511 (undocumented role — used in `fr/` modern-edition files, comments written in French; add to docs)** · GEM 1,259 (retired) · OPS 113 · ED 93 · PA 21 · FAB 4 · KRR 2 · VOX 0 (brand-new, `.claude/skills/vox/SKILL.md`; also emits `VOX: NOTE:`). Total ≈ 165k comments → **threads must be created lazily per open document, never repo-wide.**
- `NOTE:`-prefixed comments: LAN 89, GEM 29, OPS 15, RSR 4, TR 3, CON 1 (+ future `VOX: NOTE:`).
- **Multi-line comments are real: 337** timestamped openers without a closing `%%` on the same line (e.g. `_original/003/1873-03-15.md` "ENHANCED CONTEXT" RSR blocks spanning several blank-line-separated paragraphs).
- **Largest cluster: 94 comments** on one paragraph (`_original/100/1883-06-10.md`, `100.0010`, all LAN); translation-side max 74 (`cz/099/1883-05-23.md`, `099.0393`).
- **Duplicate timestamps are common** (LAN batches share e.g. `2026-02-02T13:00:00`) → timestamp alone is not an identity key.
- **Unbalanced `%%` in 4 live entry files**: `_original/055/1876-03-11.md`, `_original/004/1873-04-18.md`, `fr/055/1876-03-11.md`, `fr/004/1873-04-18.md` (the known %%-balance defect family; more may appear).
- **Old format in 42 files**: comments as `[//]: # (2025-08-22T09:25:00 RSR: …)` — all in `_original/081/` plus 2 `_summary/` files. The cz/081 translations use the NEW format, so the translation side is unaffected.
- 67 originals have `empty_in_source: true` (heading + RSR comment, no prose).

---

## 1. Parsing & anchoring

### 1.1 Scanner (new, position-aware; shared parser reused for patterns only)

The shared parser (`src/shared/src/parser/paragraph-parser.ts`) discards line positions, so the extension implements a small **position-aware scanner** that imports the regexes from `src/shared/src/parser/patterns.ts` (`PARAGRAPH_ID_PATTERN`, `NOTE_PATTERN`, `OLD_COMMENT_PATTERN`) rather than the parser class. Input is always `document.getText()` (the live buffer, never the disk file). Output model:

```ts
interface EntryScan {
  format: 'new' | 'old' | 'none';        // 'old' = [//]: # (…) style (carnet 081)
  clusters: ClusterScan[];               // ordered
  orphans: RoleComment[];                // comments before the first paragraph ID
  diagnostics: ScanWarning[];            // unterminated comments etc.
}
interface ClusterScan {
  paragraphId: string;                   // "050.0123" — stable identity key
  idLine: number;
  proseRange: Range | null;              // first..last visible text line (non-%% lines); null for notes-only/empty
  comments: RoleComment[];               // file order preserved
}
interface RoleComment {
  role: string;                          // free-form [A-Z]{2,4} — do NOT hardcode the role list for parsing
  timestamp: Date | null;
  isNote: boolean;                       // content starts with "NOTE:"
  content: string;                       // without %% fences, NOTE: prefix retained in content
  startLine: number; endLine: number;    // exact line span incl. fences — the write-back target
  ordinal: number;                       // index within cluster — part of identity
}
```

Scanner rules (all grounded in measured shapes):

- A comment **opens** only on a line matching `^%%\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}` (line-anchored — this is what keeps unbalanced-`%%` files from cascading). It **closes** on the first subsequent line ending with `%%`. Single-line is the common case; multi-line accumulates (337 real cases).
- **Runaway guard**: if no closing `%%` within 60 lines or before the next paragraph-ID line, treat the opener line alone as a one-line comment, emit a `ScanWarning`, continue. One malformed comment must never eat the rest of the file (the 4 unbalanced files are the test fixtures).
- Glossary tag lines (`%% [#…](…) %%`), paragraph IDs, embedded French originals, and `%%[tag]%%` annotations are recognized and skipped — they are not role comments.
- Role token accepted as any `[A-Z]{2,4}` before `:` — the corpus already contains roles absent from the docs (FRE, PA); VOX arrived this week. Rendering metadata (colors, full names) comes from a config map with a neutral fallback for unknown roles.
- **Old format** (`format: 'old'`): match `OLD_COMMENT_PATTERN` lines `[//]: # (ts ROLE: …)` (always single-line in the corpus). Clusters keyed by old-style ID lines. Threads render **read-only** in v1 (`canReply = false`, no edit/delete) — see §7.

Performance: the scan is one linear pass over lines; the 94-comment file is ~1,200 lines — microseconds. No caching subtleties needed beyond the debounce in §5.

### 1.2 Anchoring decision: one thread per paragraph cluster, anchored to prose

- **Thread range = single-line range on the first prose line** of the cluster (`proseRange.start`); fallback to `idLine` for notes-only or empty paragraphs. Rationale: the gutter icon sits beside the text under discussion; the comment lines themselves will be folded (§3), so anchoring to them would pin threads to hidden lines. A single-line anchor also minimizes range-update churn.
- **Why not one thread per comment line**: cluster `100.0010` would spawn 94 gutter icons; comments discuss the paragraph, not their own line; and per-paragraph threads map 1:1 onto the review workflow ("what's the state of 050.0123?").
- **Identity/anchor survival**: the stable key is `(documentUri, paragraphId)` — never the range. On every re-scan (§5) threads are reconciled by key and their `range` reassigned only when the line number actually changed (avoids the documented repositioning flicker). Paragraph IDs are effectively immutable line content, so identity survives arbitrary prose edits, comment insertions, even paragraph reordering.

## 2. Rendering

- **Controller**: `comments.createCommentController('bashkirtseff.roleNotes', 'Bashkirtseff role notes')`. One controller for the whole extension; threads created per open entry document (§5 lifecycle).
- **Thread header**: `thread.label = "050.0123 · 5 notes"` (ID + count; count breakdown by role when short, e.g. `"LAN 3 · TR 1 · RED 1"`).
- **One `Comment` per parsed `RoleComment`**, sorted by `timestamp` ascending with **file order as tiebreaker** (duplicate timestamps are common; stable sort keeps LAN batches in authored order).
  - `author.name`: `"LAN · Linguistic Annotator"` (full names from the role map; unknown roles render as the bare code).
  - `author.iconPath`: bundled per-role SVG avatar (`media/avatars/LAN.svg` …), colored with the same palette as the existing grammar (`.vscode/bashkirtseff-highlighting`); retired roles (GEM, PPX) and legacy (PA, FRE pending doc decision) get desaturated variants. `file:` Uris only — data-URI avatars are unsupported (verified).
  - `comment.timestamp = parsed Date` → VSCode renders native relative time ("4 months ago"), tooltip shows the exact stamp. No timestamp text in the body.
  - `comment.body = new MarkdownString(content)` with `isTrusted: false`. Comment content is prose and renders fine as markdown; the risk of stray `*`/`_` re-styling is acceptable and reversible (a `plainText` escape setting can come later if it annoys).
  - **NOTE-style comments** (`ROLE: NOTE: …`): `comment.label = "NOTE"` (renders beside the author name), and the `NOTE:` prefix is stripped from the body. Same treatment for `VOX: NOTE:`.
  - `comment.contextValue`: `"own"` for comments whose role equals the configured human role (§4.2), `"agent"` otherwise — this gates the edit/delete menus.
- **Collapsed by default** (`CommentThreadCollapsibleState.Collapsed`) — mandatory at these densities (94-comment cluster). Commands to expand/collapse all in file (§6). The Comments panel gives the file-level overview for free.
- `controller.options = { placeHolder: "Add a note as KRR…", prompt: "Written into the file as a %% comment" }`.

## 3. Hiding the raw `%%` comment lines

Threads replace the *reading* function of the raw lines, so the raw lines become foldable noise — but they stay in the file and stay authoritative.

- **Mechanism 1 — folding (default)**: a `FoldingRangeProvider` over every run of consecutive comment lines (per cluster, using the scanner's line spans). Known hard constraint from the vision research: folding is line-granular and **always leaves a one-line `⋯` stub** — accepted. Auto-fold on open: run `editor.fold` with the computed ranges when an entry document becomes visible (same approach as `zokugun.explicit-folding`'s autoFold), guarded by a setting.
- **Mechanism 2 — fade**: a decoration type (`opacity: 0.35`) over comment-line ranges, for users who want the text visible but quiet. The `textDecoration: 'none; display: none;'` hack is **not** used in v1: it hides text but not the row, and combined with threads it buys little over folding (revisit only if the stub lines prove annoying).
- Setting `bashkirtseff.comments.rawLines: "fold" | "fade" | "show"` (default `"fold"`), plus a toggle command. Folding applies only to *role-comment* runs — paragraph IDs, glossary tags, and embedded French lines are untouched (glossary/French get their own treatment in later vision phases).
- **Authority rule** (restated as an invariant for every later section): thread state is derived; the only writes ever performed are the surgical text edits of §4; if a thread and the file disagree, the file wins at the next re-scan.

## 4. Write-back

### 4.1 Reply → append a comment line

Reply handler (the reply box command):

1. Re-scan the **current** document text at command time (never use a cached scan for a write — the file may have changed since the thread was built).
2. Compose the line: `%% {timestamp} {ROLE}: {text} %%`, timestamp = local `YYYY-MM-DDThh:mm:ss` (matching `date +%Y-%m-%dT%H:%M:%S`, the convention every skill uses). If the user typed newlines, keep them (multi-line comments are format-legal — 337 precedents) and ensure the closing ` %%` terminates the final line.
3. **Insertion point: after the last line of the cluster** — i.e., after the last prose/comment/footnote-ref line belonging to this paragraph, immediately before the blank line that precedes the next `%% NNN.XXXX %%` (or EOF). This matches the pipeline convention that reviewer comments (TR/OPS/RED/CON/VOX) go *after* the translated text, and is exactly where /vox places its comments.
4. Apply as a single-`insert` `WorkspaceEdit` on the live document. **Never** rewrite any other byte; **never** route through `ParagraphRenderer` (documented non-byte-faithful — it merges tag lines and reorders notes). The document may be dirty — that's fine, the edit composes with the user's unsaved changes and the user saves normally.
5. Do not manually update the thread — the `onDidChangeTextDocument` reconcile (§5) picks the new comment up from the file, which also proves the round-trip worked.

### 4.2 Which role code does a human reply get?

**Default `KRR`** — it is already documented as "notes from human collaborators" (`content/cz/CLAUDE.md` role table), already in the highlighting grammar, and has 2 corpus precedents. `ED` is wrong (it's the Executive Director *agent*). Setting `bashkirtseff.comments.authorRole` (default `"KRR"`, validated `[A-Z]{2,4}`) so other human collaborators can use their initials. The configured role also gets the "you" avatar and determines which comments are editable.

### 4.3 Edit / delete own comments

- Only comments with `contextValue == "own"` (role matches the configured human role) get edit/delete actions — contributed commands in `comments/comment/title` (pencil/trash icons) with `when: comment == 'own'`. Agent comments are **never** editable from the UI (they're the audit trail; changing them belongs to the agents' own passes).
- **Edit**: set `comment.mode = Editing` (shows the textarea); contribute our own Save/Cancel commands (VSCode does not provide them — verified). Save = `WorkspaceEdit.replace` of the comment's exact `startLine..endLine` span with the recomposed line(s). The original timestamp is **kept** (it is part of the comment's identity and the pipeline's chronology); no "edited" marker in v1.
- **Delete**: confirmation dialog, then `WorkspaceEdit.delete` of the exact line span (inclusive of the trailing newline).
- Both recompute the span from a fresh scan at command time (match by `(paragraphId, role, timestamp, ordinal)`), so a stale thread can never delete the wrong lines. If the comment can't be re-found (file changed underneath), abort with a message and refresh threads.

## 5. Sync & invalidation

- **Lifecycle**: threads exist only for **open entry documents**. On `workspace.onDidOpenTextDocument` / initial pass over `window.visibleTextEditors`, if the document path matches `content/{_original,cz,uk,en,fr}/[0-9]*/**.md` → scan and build threads. On `onDidCloseTextDocument` → dispose that document's threads and drop the registry entry. (165k comments repo-wide; per-file lazy is non-negotiable. The heaviest single file is ~250 comments — trivial.)
- **On edit**: `onDidChangeTextDocument`, debounced 250 ms, re-scan and **reconcile by `(uri, paragraphId)`**:
  - new cluster key → create thread; vanished key → dispose thread;
  - existing key → reassign `thread.range` only if the anchor line moved; rebuild `thread.comments` only if the comment list actually differs (compare `(role, timestamp, ordinal, content)` tuples). This minimal-update discipline is what avoids the repositioning flicker the GitHub PR extension had to engineer around.
- **External changes (agents write these files constantly)**: if the document is open, VSCode updates the buffer for non-dirty files automatically and `onDidChangeTextDocument` fires → same reconcile path, nothing special. If the user's buffer is dirty *and* the file changes on disk, VSCode's standard conflict flow applies — the extension does nothing beyond reflecting whatever the buffer says (file-wins invariant). No file watchers needed for closed files (no threads exist for them).
- **Freshness note for replies**: no special gate. Unlike /vox agents (which must skip dirty files), a human replying into their own open buffer is the normal case. The §4 rule "recompute positions at command time" is the actual safety mechanism.

## 6. Filtering, resolved semantics, commands

- **Role filter**: since the Comments panel offers no custom filters (verified), filtering = controlling thread/comment existence. Setting `bashkirtseff.comments.visibleRoles` (default: all) + quick-pick command **"Filter role notes…"** (multi-select of roles present in the open file, with live counts). Implementation: reconcile pass rebuilds `thread.comments` to the filtered subset; clusters whose filtered set is empty get their thread disposed. Cheap because reconcile already exists. Typical use: hide the LAN firehose (118k corpus-wide) and read only OPS/RED/CON/VOX.
- **Resolved mapping**: map `thread.state = Resolved` when the file's frontmatter says the pipeline is done — `conductor_approved: true` (translations) / `linguistic_annotation_complete: true` (originals); everything else `Unresolved`. This is honest (approval is per-file in this project, not per-paragraph) and it plugs directly into the Comments panel's **built-in** resolved filter, giving "hide approved files' noise" for free. Per-paragraph resolution is a **non-goal** in v1: there is no per-paragraph status in the data model, and inventing one (marker comments) is a workflow decision for the maintainer, not an extension feature. Frontmatter is re-read in the same reconcile pass (frontmatter edits fire `onDidChangeTextDocument` too).
- **Command palette** (all prefixed `Bashkirtseff Comments:`):
  - `Filter role notes…` (quick-pick, above)
  - `Expand all threads in file` / `Collapse all threads in file` (set `collapsibleState` on registered threads)
  - `Next comment thread` / `Previous comment thread` (jump cursor to next anchor line; respects role filter)
  - `Toggle raw %% lines (fold / fade / show)`
  - `Open comments panel` (`workbench.action.focusCommentsPanel`)
  - `Rebuild threads for this file` (manual escape hatch)
- **New threads on unannotated paragraphs**: `commentingRangeProvider` returns the prose ranges of all clusters (so the gutter "+" appears on paragraph text, not on frontmatter/`%%` lines). Creating a comment there routes through the same §4.1 write-back; the reconcile then adopts the file-derived thread and the provisional UI thread is disposed.

## 7. Edge cases (all measured, with decided behavior)

| Case | Data | Behavior |
|---|---|---|
| Old-format files | 42 files: `_original/081/*` + 2 `_summary/` | Parse `[//]: # (ts ROLE: …)` via `OLD_COMMENT_PATTERN`; threads render **read-only** (`canReply=false`, no edit/delete, thread label suffix "· legacy format"). Write-back into old-format files is a non-goal (migration of 081 is the real fix). cz/081 is new-format and fully functional. |
| Unbalanced `%%` | 4 live files (055, 004 in `_original` and `fr`) | Line-anchored opener + 60-line runaway guard (§1.1); emit `ScanWarning`s surfaced as a status-bar warning ("⚠ 2 malformed comments — threads may be incomplete"), never throw. These 4 files are mandatory test fixtures. |
| Multi-line comments | 337 openers | Accumulate to closing `%%`; body preserves internal newlines; write-back may produce them too. |
| Empty entries | 67 files (`empty_in_source: true`) | Clusters are ID-only; anchor to `idLine`; nothing else special. |
| Giant clusters | max 94 comments (`100.0010`), 74 on cz side | Collapsed-by-default; single thread absorbs it. Verify expand performance on the fixture in the test plan; no pagination exists in the API — if it's slow, cap body count with a "… and N older notes (open file)" tail comment. |
| Duplicate timestamps | pervasive in LAN batches | Identity = `(paragraphId, role, timestamp, ordinal)`; sort is timestamp-then-file-order stable. |
| Unknown/new roles | FRE (1,511, undocumented), PA, future roles | Parser accepts any `[A-Z]{2,4}`; rendering falls back to neutral avatar + bare code. **Separately: document FRE in `/CLAUDE.md` role tables** (report to maintainer, don't silently absorb). |
| Comments before first paragraph ID | frontmatter-adjacent notes | Collected as `orphans`; one file-level thread (`range` = line 0, label "file notes") if any exist. |
| Same file in two editor groups | URI-global threads (verified) | Nothing to do — correct by default. |
| Glossary / `_summary` files | `GLO_….0001` / `SUM.NNN.0001` IDs | Out of scope v1 (activation glob excludes them); the ID regexes in `patterns.ts` already cover them, so enabling later is a glob change. |

## 8. Implementation checklist, tests, non-goals

Prereq (from the vision doc, Phase-1 scaffolding): `src/vscode-extension/` workspace member, esbuild → CJS bundle (shared package is ESM-only, extension host is CJS), symlink/vsix install incl. the code-server extensions dir. If the comment-threads feature lands first, it carries this scaffolding (~half a day, listed in M1).

| Milestone | Contents | Estimate |
|---|---|---|
| **M1 — scanner + model** | Extension scaffold; position-aware scanner (new + old format, multi-line, runaway guard); unit tests against fixture files copied from the measured real cases (001 pair, `100/1883-06-10`, `003/1873-03-15`, `055/1876-03-11`, an 081 file, an empty entry) | 1–1.5 days |
| **M2 — read-only threads** | Controller, per-role avatars (SVG set), thread/comment mapping, lazy lifecycle, reconcile-on-edit, orphan file-thread, status-bar warnings | 1 day |
| **M3 — raw-line taming** | FoldingRangeProvider + auto-fold-on-open, fade decoration, `rawLines` setting + toggle | 0.5 day |
| **M4 — write-back** | Reply (insert), edit/delete own (`KRR` default, `authorRole` setting), contextValue-gated menus with Save/Cancel commands, command-time re-scan safety | 1–1.5 days |
| **M5 — filters & commands** | Role filter quick-pick + setting, resolved-from-frontmatter, expand/collapse/next/prev commands, commentingRangeProvider | 0.5–1 day |
| **M6 — hardening** | The 4 unbalanced fixtures green; giant-cluster perf check; code-server manual pass; docs (`README` in the extension + FRE doc fix in `/CLAUDE.md`) | 1 day |

Total: **~5–6.5 focused days**, each milestone independently shippable (M1–M3 alone already deliver "readable files with PR-style notes").

**Test plan.**
- *Unit (vitest, runs in the workspace like `src/shared`)*: scanner golden tests on the six fixtures — cluster counts, comment spans, multi-line bodies, old-format parse, runaway-guard diagnostics; write-back composers tested as pure functions (given scan + reply → exact expected file text; property: output file differs from input by exactly the inserted/replaced/deleted lines — the byte-faithfulness invariant).
- *Integration (`@vscode/test-electron`, small)*: open fixture → thread count/anchors correct; edit prose above a cluster → anchor shifts, identity stable; reply → file contains the new `%% … KRR: … %%` line at the cluster end and the thread shows it after reconcile; delete own comment → exact lines removed.
- *Manual checklist*: agent writes to an open non-dirty file → threads refresh; dirty-buffer reply → composes with unsaved edits; role filter with LAN hidden; resolved filter hides `conductor_approved` files' threads in the panel; the 94-comment thread expands acceptably; everything repeated once under code-server (webview-free feature, so only avatar `file:` URIs and menus need eyeballing).

**Non-goals (v1, explicit).**
- No table/webview view, no scroll sync (separate vision phases).
- No editing/deleting agent comments from the UI; no rewriting of existing comment order or format (no normalization passes).
- No per-paragraph resolved state and no new status markers in files (workflow decision, not extension scope).
- No write-back for old-format (081) files and no glossary/_summary coverage.
- No repo-wide comment browsing/search (Comments panel covers open files; ripgrep covers the rest).
- No custom Comments-panel filters (API doesn't allow it) and no data-URI avatars (unsupported).
