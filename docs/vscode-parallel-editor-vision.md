# VSCode Parallel Translation Editor — Vision & Feasibility

*2026-07-10. Product/UX vision plus research synthesis (four Opus research passes: custom editors/webviews, native-editor bending, CAT/notebook prior art, repo architecture). Supersedes nothing; extends `.vscode/bashkirtseff-highlighting/`.*

---

## 1. The idea

> "beside just highlighting, drawing for example a table view, where the original and translation are next to each other, probably in separate editor components, but functioning like I had a vertically split window... and comments underneath"

Today, reviewing a translation means opening `content/_original/050/1877-06-01.md` and `content/cz/050/1877-06-01.md` side by side and scroll-syncing by eye, while `%% ... %%` glossary tags and role comments interleave with the text on both sides. The paragraph IDs (`%% 050.0123 %%`) that exist in **both** files are a perfect alignment key that nothing currently exploits.

One repo fact makes this easier than it looks: **translation files already embed the French original** of each paragraph as a `%% ... %%` comment directly above the translated text. So half of the "table" already exists inside every translation file — it's just drowned in noise. The original file remains the canonical French and carries the richer RSR/LAN annotation history.

## 2. The UX vision

### 2.1 The table view (target experience)

One row per paragraph ID. Original left (read-only), translation right (editable). Comments for that paragraph cluster collapse underneath the row — color-coded by role, chronological, timestamps de-emphasized.

```
┌─ 1877-06-01 · carnet 050 · cz ─────────────── TR ✓  OPS ✓  RED ✓  CON ✗ ─┐
│ ▸ frontmatter                                        [lang: cz ▾] [filter ▾] │
├───────────────┬──────────────────────────────┬───────────────────────────────┤
│ 050.0122  ✓✓✓ │ Ce soir, à l'Opéra, "Un      │ Dnes večer v Opeře „Un ballo  │
│ #Opera_Nice   │ ballo in maschera". Beaucoup │ in maschera"[^..]. Spousta    │
│ #Music_theme  │ de monde, mais moi, je suis  │ lidí, ale já jsem smutná.     │
│               │ triste.                      │                               │
│  ▾ comments (3)                                                              │
│  │ LAN 2025-12-07  ITALIAN: opera title, keep in Italian with footnote       │
│  │ TR  2026-02-12  Italian title preserved; footnote with Czech name.        │
│  │ RED 2026-03-01  Footnote wording tightened.                               │
├───────────────┬──────────────────────────────┬───────────────────────────────┤
│ 050.0123  ✓✓─ │ Les Howard étaient venus me  │ Howardovi si pro mě přišli,   │
│ #Howard_family│ chercher, mais la canaille   │ ale ten lump Mouton mi        │
│               │ Mouton ne m'a pas envoyé le  │ neposlal koně. …              │
│               │ cheval…                      │                               │
│  ▸ comments (5)                                                              │
├───────────────┴──────────────────────────────┴───────────────────────────────┤
│ 050.0124 — original only (notes-only paragraph, no French body)   ▸ notes (2)│
└───────────────────────────────────────────────────────────────────────────────┘
```

Decisions baked into this mockup:

- **Rows align by paragraph ID**, not by line count. Differing text heights pad the shorter cell.
- **Left column is read-only** (canonical French from `_original/`, falling back to the embedded `%% french %%` from the translation file when the original file is missing). **Right column is the only editable surface.**
- **Gutter cell** per row: paragraph ID, glossary chips (hover → glossary entry preview, click → open the `.md`), and a compact status glyph (per-role ✓/─ derived from which roles have commented + frontmatter flags).
- **Comments underneath the row**, collapsed by default to a count, expandable per row or globally ("expand all OPS+"). Color-coded by role using the same palette as the existing grammar. Comments are shown newest-context-first order preserved (chronological), timestamps rendered small.
- **Header bar**: entry date, carnet, frontmatter workflow flags (`translation_complete` / `editor_approved` / `conductor_approved`, `redaction_passes`), a **language picker** (cz/uk/en/fr against the same original — switching swaps the right column and its file), and a **row filter**: *all · has OPS/RED comments · unapproved only · unmatched only*.
- **Navigation**: `nextParagraph`/`prevParagraph` keybindings, "go to paragraph ID" quick-pick, and click-a-row → cursor lands in the right cell.

### 2.2 What "functioning like a vertically split window" really demands

Real editor semantics on the editable side: the user's keybindings, undo/redo, find across the document, multi-cursor, and — critically — **other extensions** (Czech/Ukrainian spellcheckers, Copilot-style tooling) working on the translation text. The research (§3) shows this is the fault line along which all architectures divide: anything rendered in a webview is structurally invisible to installed extensions and the user's keybindings. There is no API bridge; it is by design.

So the vision splits into two honest modes rather than one compromised one:

1. **Work mode** — two *real* editors, made paragraph-aware: ID-anchored scroll lock, `%%`-noise folded away, comments surfaced as native comment threads, per-paragraph status as CodeLens. Everything remains a genuine `TextEditor`. This is where spot-editing happens.
2. **Review mode** — the rendered table view (webview) for *reading and judging*: perfect row alignment, comments underneath, filters. Editing there is limited to per-paragraph "apply edit" actions that write surgical `WorkspaceEdit`s back to the real file (or a one-keystroke "jump to this paragraph in the real editor").

Work mode mockup (what two real editors + the extension look like):

```
┌─ _original/050/1877-06-01.md (read-only) ─┬─ cz/050/1877-06-01.md ────────────┐
│ ⚑ 050.0122 · #Opera_Nice · LAN(2) RSR(1)  │ ⚑ 050.0122 · TR(1) RED(1) 💬      │  ← CodeLens
│ Ce soir, à l'Opéra, "Un ballo in          │ Dnes večer v Opeře „Un ballo in   │
│ maschera". Beaucoup de monde, mais moi,   │ maschera"[^..]. Spousta lidí, ale │
│ je suis triste.                           │ já jsem smutná.                   │
│ ⋯ (folded: 3 %% comment lines)            │ ⋯ (folded: %% french + 2 notes)   │
│                                           │                                   │
│ ⚑ 050.0123 · #Howard_family               │ ⚑ 050.0123 · TR(1) 💬             │
│ Les Howard étaient venus me chercher,     │ Howardovi si pro mě přišli, ale   │
│ mais la canaille Mouton…                  │ ten lump Mouton…                  │
└───────────────────────────────────────────┴───────────────────────────────────┘
   scroll/cursor locked by paragraph ID, not by line number
   role comments = native comment threads (gutter 💬, PR-review style panel)
```

### 2.3 Degraded modes (measured, not hypothetical)

The architecture agent measured the actual content tree; the view must tolerate all of these without erroring:

- **Notes-only paragraphs**: originals can carry trailing paragraph IDs with RSR/RED notes but no French body; translations legitimately lack them (systematic in carnet 001: 162 vs 148 IDs, all benign). Render as a single-column "original only" row.
- **Missing counterpart files**: file counts differ by ±1 in carnets 050/083. Show the existing side alone with a "no counterpart" banner + "scaffold translation" action.
- **Old-format files**: 42 files still use `[//]: # (NN.XXXX)` IDs (concentrated in carnet 081 + two `_summary/` files). Either parse via the `OLD_COMMENT_PATTERN` already exported from `src/shared/src/parser/patterns.ts`, or degrade to plain sync-less split with a "legacy format" notice.
- **Empty entries**: 67 of 3,877 originals have `empty_in_source: true` — heading + RSR comment only. Render the (near-empty) rows normally; the status header already explains why.
- **ID mismatches beyond the benign pattern** (splices, %%-balance defects — a known defect family): never guess; align what matches, list orphans on both sides in an "unmatched" section, and offer "open both at this ID".

## 3. Research findings by approach

### 3.1 Custom editor / webview table (`CustomTextEditorProvider`)

**How it works.** `CustomTextEditorProvider` (not `CustomEditorProvider`, which is for binary formats) backs the webview with the standard `TextDocument`, so save/dirty/hot-exit/undo at the *file* level come free. Document→webview sync via `workspace.onDidChangeTextDocument` + `postMessage`; webview→document via `WorkspaceEdit` + `workspace.applyEdit`. Official sample: `microsoft/vscode-extension-samples/custom-editor-sample`.

**The wall.** The editing surface inside the webview is HTML (textarea/contenteditable/Monaco) — **not** a `vscode.TextEditor`. Installed extensions (spellcheck, LSP, Copilot), user keybindings, native find, and native multi-cursor are structurally unable to reach it; the VSCode team confirms this is by design (vscode-discussions #74; Monaco-in-webview request microsoft/vscode#196705 unresolved). Embedded Monaco restores *an* editor (its own find, multi-cursor, undo stack) but a parallel, extension-less one whose theme/keybindings must be mirrored by hand.
**The scars.** Real custom editors document the state-bridging pain: draw.io's broken redo (hediet/vscode-drawio#328), spurious dirty flags (#215, upstream microsoft/vscode#119060), no API to clear dirty state (microsoft/vscode#97348). The hex editor (`ms-vscode.hexeditor`) ships its **own** find UI because the native one can't operate on webview content.
**code-server**: webviews work but require a secure context (HTTPS/localhost) and Service Workers (coder/code-server#2038, #6656); a webview-only editor is dead if that breaks — a hybrid degrades gracefully.

**Verdict: feasible as a *review* surface; cannot satisfy "functions like a real split editor" for typing. Strongest argument against is architectural, not effort.**

### 3.2 Bending the native editor

- **ID-anchored sync scroll — novel and fully feasible (stable API).** `window.onDidChangeTextEditorVisibleRanges` + `revealRange`, with the feedback-loop guard pattern from `dqisme.sync-scroll` (a "just scrolled programmatically" set). Existing sync-scroll extensions are only line/offset based; a piecewise map `paragraphID → line` in each file (one regex scan per document) gives content-aware lock that no existing extension has. Line-granular, not pixel-granular — fine for prose.
- **Vertical row alignment is impossible in a normal editor — definitively.** Decorations cannot contain newlines (microsoft/vscode#63600) or shrink line height; folding always leaves a one-line `⋯` stub; **view zones (what the diff editor uses to insert filler) are Monaco-internal and not in the extension API** (microsoft/vscode#103437 unshipped). This is the hard limit that makes the webview the only true-table option.
- **Noise taming — good enough.** FoldingRangeProvider over `%%` runs + auto-fold on open (prior art: `zokugun.explicit-folding`); decorations for opacity/de-emphasis; the `textDecoration: 'none; display: none;'` hack (from `moalamri.inline-fold`) hides intra-line content but not the row itself.
- **`vscode.CommentController` — strong fit for role comments.** Gives PR-review-style collapsible threads anchored to lines, gutter icons, a Comments panel aggregating all threads, markdown bodies, custom actions via `comments/commentThread/title` menus. Threads are synthesized at open-time by parsing the `%%` note lines; **write-back is manual** (your command handlers → `WorkspaceEdit`), and the controller can't enumerate its own threads (microsoft/vscode#243152) so the extension keeps its own registry. This *removes comment noise from the text flow entirely* while making it richer — arguably better than "underneath the row".
- **CodeLens** for per-paragraph headers (`⚑ 050.0123 · TR ✓ RED ✗ · show comments · jump to counterpart`) — plain text only, costs one row per paragraph; **inlay hints** as compact inline status chips.
- **Diff editor as a "strict align" trick.** `vscode.diff(leftUri, rightUri)` with a *virtual* left document (`TextDocumentContentProvider` rendering the original re-shaped to mirror the translation's structure) against the *real* translation file on the right: the diff editor inserts alignment padding itself, and the right side is a fully real, editable, extension-served editor. Costs: diff coloring noise, alignment steered only indirectly via the diff algorithm. Virtual docs are read-only (microsoft/vscode#10547), which is exactly right for the original side.

**Verdict: everything except true row-locking is achievable on stable API; the combination (sync + folding + comment threads + CodeLens) gets ~80% of the table-view value at genuine-editor fidelity.**

### 3.3 Prior art: CAT tools, i18n-ally, notebooks

- **No existing extension does paragraph-aligned bilingual editing.** The gap is real. Closest relatives: **i18n-ally** (`lokalise.i18n-ally`) — decorations for inline translations + a webview editor showing one key across locales with per-value review status and comments (its axis is locale-columns-per-key, not paragraph-rows-per-document); **XLF Editor** (`aar.xlf-editor`) — a webview source(read-only)/target(editable) unit table, structurally the wanted layout but XLIFF-bound.
- **Desktop CAT patterns to copy** (OmegaT/MateCat/memoQ): segment table as the primary surface, row status colors + filter-by-status, docked glossary/TM pane, per-row notes, lockable rows. The pipeline (TR→OPS→RED→CON→FAB) maps perfectly onto segment statuses.
- **Notebook API — attractive but structurally wrong here.** Cells *are* real Monaco editors with working third-party extensions (spellcheck works in cells) and cell outputs can render arbitrary HTML (comments panel under each cell), plus a per-cell status bar API. But: **cells are vertical-only — no side-by-side layout exists**, and **per-cell read-only is unsupported and was explicitly declined** by the VSCode team (microsoft/vscode#158715 closed out-of-scope; #237074 unactioned). A lossless serializer for this repo's format would also be entirely custom. A stacked notebook (original as rendered output above an editable translation cell) is credible, but it duplicates what Work mode achieves more cheaply in real files.

### 3.4 Architecture & reuse (repo-specific facts)

- **Shared parser is reusable in the extension host, not in webviews.** `ParagraphParser.parseParagraphCluster` etc. are pure/synchronous (only `parseFile` touches `node:fs`); models carry `id`, `originalText`, `translatedText`, `notes[{timestamp, role, content}]`, `glossaryLinks`, `footnoteRefs`. **No position info is kept** — the extension must build its own `id → line` index (trivial: one scan with `PARAGRAPH_ID_PATTERN` from `patterns.ts`). Parse in the host; ship models to any webview via `postMessage`.
- **Never write files through `ParagraphRenderer`** — it is documented non-byte-faithful (merges tag lines, reorders notes). All write-back must be surgical `WorkspaceEdit`s replacing only the edited paragraph's range.
- **ESM/CJS friction is the one build snag.** The extension host still loads extensions as CJS (as of 2026); `@bashkirtseff/shared` is ESM-only. Fix: bundle the extension with esbuild (`--format=cjs --platform=node --bundle`), inlining the shared package. Fits the npm workspace (add `src/vscode-extension` as a third workspace or keep under `.vscode/`).
- **Shipping**: mirror the existing `install.sh` symlink flow for dev; commit a `.vsix` for reproducibility. **code-server** needs either `code-server --install-extension x.vsix` or a symlink into `~/.local/share/code-server/extensions` (the current script only targets `~/.vscode/extensions` and `~/.vscode-server/extensions`). code-server runs the full extension host server-side, so `fs`, decorations, folding, comments, custom editors all work; Open VSX is irrelevant for a sideloaded private extension.

## 4. Candidate architectures

### A. Full custom-editor table (webview, `CustomTextEditorProvider`, optionally Monaco cells)

The literal table view. Perfect alignment, comments underneath, filters, language picker — the CAT-tool dream.

- ✅ Exactly the envisioned UI; row alignment solved trivially in HTML.
- ✅ File-level save/dirty/undo bridged by `CustomTextEditorProvider`.
- ❌ **Fails the core requirement**: typing happens in HTML, unreachable by spellcheckers, user keybindings, other extensions; native find lost; multi-cursor only via embedded Monaco (its own parallel world).
- ❌ Highest effort; inherits the documented undo/dirty bridging bugs; most fragile under code-server.

### B. Two real editors, made paragraph-aware (native APIs only) — *recommended core*

`Bashkirtseff: Open counterpart beside` + ID-anchored scroll/cursor lock + auto-folded `%%` noise + CommentController threads for role comments + CodeLens status headers + glossary DocumentLinks/hovers + status-bar flags.

- ✅ 100% real editors: every requirement in "functions like a split window" is satisfied by construction — nothing to bridge.
- ✅ All stable API; each feature ships independently; smallest code; works identically in code-server.
- ✅ Comment threads arguably *beat* "comments underneath": collapsible, gutter-anchored, aggregated in the Comments panel, filterable.
- ❌ Alignment is scroll-locked, not row-locked: matching paragraphs are on screen together but not at identical heights (hard API limit).
- ❌ Noise is folded to `⋯` stubs, not invisible.

### C. Hybrid: B + companion review webview (and/or diff-editor strict-align mode)

B remains the editing surface; a `ViewColumn.Beside` webview (markdown-preview architecture: `revealLine`-style bidirectional position sync keyed on paragraph IDs) renders the true table — original, translation, comments underneath, status colors, filters — read-only with "jump to paragraph in editor" and per-paragraph apply-edit actions. Optional extra: a `vscode.diff` strict-align mode (virtual re-shaped original left, real translation right) when padded row-exact alignment is wanted with zero webview code.

- ✅ Gets the actual table view *without* sacrificing editor semantics — reading/judging in the table, typing in the real editor.
- ✅ Degrades gracefully (webview dies → B still works); preview sync is proven architecture (built-in markdown preview, PRs #18997/#111094) and IDs make the anchor map exact rather than heuristic.
- ❌ Two surfaces to keep in sync; the webview is a rendering (styling, virtualization for 2,000-paragraph carnets) project of its own.

**Notebook variant — rejected**: vertical-only layout and no per-cell read-only kill the side-by-side and protected-source requirements; custom lossless serializer is pure risk with no offsetting advantage over B/C.

## 5. Recommendation

**Build C, by way of B.** Architecture B is the foundation and is valuable alone; the review webview is an additive layer that delivers the literal table view for the activity where it matters (reviewing agent-produced translations, judging comment history) while all *typing* stays in real editors. Do not build A: it optimizes the picture at the cost of the sentence that defined the feature.

### Roadmap

**Phase 0 — today.** Grammar-injection highlighting (`.vscode/bashkirtseff-highlighting/`). Keep; the new extension supersedes nothing here.

**Phase 1 — a weekend. "Paragraph-aware split".**
New `src/vscode-extension/` (TS + esbuild→CJS, workspace member, symlink/vsix install incl. code-server path).
1. `id → line` index per document (regex scan; handle old-format via `OLD_COMMENT_PATTERN`).
2. Command **Open counterpart beside** (auto-derives `_original/` ↔ `cz|uk|en|fr` path; language picker when ambiguous).
3. **ID-anchored reveal-on-cursor** (cheap, jank-free), then full scroll lock with the anti-feedback guard.
4. **FoldingRangeProvider** for `%%` runs + auto-fold-on-open toggle.
5. **Status bar**: frontmatter flags + unmatched-ID count; decorations marking original-only/translation-only paragraphs.

**Phase 2 — 1–2 weeks. "Native review surface".**
6. **CommentController**: parse role comments into threads (color/label per role); Comments panel becomes the review queue; "next OPS/RED comment" navigation; new-comment write-back via surgical `WorkspaceEdit` (KRR-role notes).
7. **CodeLens** per paragraph: status glyphs, comment count, *jump to counterpart*.
8. Glossary **DocumentLinkProvider + HoverProvider** (chip → glossary entry preview/open).
9. Filters: quick-picks "paragraphs with OPS/RED", "unapproved", driven by the parsed model.

**Phase 3 — a month-scale project. "The table" (review webview).**
10. `ViewColumn.Beside` webview rendering the aligned table (host-side parsing via `@bashkirtseff/shared`, `postMessage` models, virtualized rows, `--vscode-*` theme vars).
11. Bidirectional position sync keyed on paragraph IDs (markdown-preview pattern).
12. Row filters, role color-coding, language switcher, per-paragraph "apply edit"/"open in editor" actions (surgical `WorkspaceEdit`s only).
13. Optional: `vscode.diff` strict-align mode (virtual original left, real translation right).

**Phase 4 — optional/later.** TM/glossary docked pane fed from `TranslationMemory.md` + `_glossary/` (the CAT-tool side pane); notebook or full custom editor only if a genuinely new need appears.

## 6. Key references

- Custom editors: `microsoft/vscode-extension-samples/custom-editor-sample`; scars: `hediet/vscode-drawio` #328/#215, microsoft/vscode #97348/#119060; `ms-vscode.hexeditor`
- Native bending: `dqisme.sync-scroll` (guard pattern), `moalamri.inline-fold` (display:none hack), microsoft/vscode #63600 (no multiline decorations), #103437 (view zones not exposed), #158715/#237074 (no read-only notebook cells), #243152 (CommentController can't enumerate threads), #10547 (virtual docs read-only)
- Preview sync: microsoft/vscode PRs #18997, #111094 (`revealLine` to unfocused editor)
- Prior art: `lokalise.i18n-ally` (webview editor + review), `aar.xlf-editor` (source/target grid), OmegaT/MateCat/memoQ segment-table UX
- Repo: `src/shared/src/parser/{paragraph-parser,patterns}.ts`, `src/shared/src/models/{paragraph,note,entry}.ts`, `.vscode/bashkirtseff-highlighting/install.sh`, `src/workspace/` (code-server)
- code-server: coder.com/docs/code-server/FAQ (vsix sideload, extensions dir, Open VSX); webview prerequisites: coder/code-server #2038, #6656
