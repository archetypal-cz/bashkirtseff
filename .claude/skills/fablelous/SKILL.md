---
name: fablelous
description: Fable-powered final-mile polishing pass. Interrogate every sentence and every load-bearing word of a translation — is this the best-fitting, most expressive way to say what Marie wanted to say? Use on conductor-approved entries as an extra review pass, recorded in frontmatter under redaction_passes.
allowed-tools: Read, Edit, Write, Grep, Glob, Agent, Bash
---

# Fablelous Polish (FAB)

You are running the **Fablelous pass** — the finest-grained review in the pipeline. It runs on text that is already conductor-approved. The question is no longer "is this correct?" (RED/OPS/CON answered that) but:

> **Is this the best-fitting, most expressive way to say what Marie wanted to say — sentence by sentence, word by word?**

The pass is executed by **specially instructed Fable agents** (model: inherit — the session runs on Fable; do not downgrade the model for polish work). One agent per language per carnet, so the voice stays consistent across entries.

## Orchestration (when invoked as /fablelous)

Invoked as `/fablelous {carnet} {lang...}` (e.g. `/fablelous 000 cz uk`):

1. Spawn one Fable agent per language (in parallel, background), each instructed with the **Agent instructions** below plus the file list.
2. When agents finish, verify — the **primary gate is the stranded-text scan**, not `%%`-parity (a mid-line splice has an even marker count and passes parity):

   ```bash
   awk '/%%/ { line=$0; while (match(line, /%%[^%]*(%[^%][^%]*)*%%/)) { line = substr(line,1,RSTART-1) substr(line,RSTART+RLENGTH) }; gsub(/[[:space:]]/,"",line); if (line != "") print FILENAME ":" FNR ": " $0 }' content/{lang}/{carnet}/[0-9]*.md
   ```

   Known false positives: carnets whose French originals are multi-line `%% … %%` blocks flag every block's opening/closing line (~dozens of noise lines). Disambiguate by comparing per-file flag COUNTS against HEAD (`git show HEAD:file`) — identical counts mean pre-existing format, not damage. A tightened variant that only flags lines with an even marker count plus leftover text (the classic `text %% comment %% rest` signature) lives at `src/scripts/splicescan.awk` (`awk -f src/scripts/splicescan.awk content/{lang}/{carnet}/[0-9]*.md`); it suppresses the multi-line-block noise while still catching real splices, though it misses odd-count splices — on noisy carnets run both and HEAD-compare the stock scan's hits.

   Must return nothing. Then also check: `%%`-parity intact, no stranded French, `redaction_passes` updated in every file, FAB comments present where text changed, `conductor_approved` flags untouched.
3. Summarize changes per language for the user. Do NOT auto-commit.

## Agent instructions

### Preparation

1. Read this SKILL.md in full.
2. Read `content/{lang}/CLAUDE.md` — language-specific style guide, traps, punctuation rules.
3. For each entry, read the French original in `content/_original/{carnet}/` (or the `%% … %%` French embedded in the translation file) **before** judging the translation. Absorb Marie's intent, register shifts, rhetorical architecture, jokes, self-corrections.

### Method — sentence and word interrogation

Work paragraph by paragraph, sentence by sentence. For each sentence:

1. **Intent**: What did Marie want this sentence to *do*? Not just its meaning — its gesture: boast, self-mockery, dramatic escalation, false modesty, aside to the reader, rhythm of a list, a landing blow at the end.
2. **Fit**: Does the translation perform that gesture as well as the target language allows? Would a native author of literary talent, writing this diary herself, have written this sentence this way?
3. **Word level**: For each load-bearing word (verbs of feeling, evaluative adjectives, ironic markers, intensifiers, sentence-final words), ask: is there a more exact, more expressive, more period-true choice? Hold candidate alternatives against the French, not against the current translation.
4. **Ear test**: Read the sentence aloud in your head. Rhythm, clitic placement, where the stress falls, whether the sentence ends on its strongest word. Marie's prose has tempo; the translation must too.
5. **Cohesion**: After finishing an entry, reread it whole. Sentences polished in isolation can lose their thread — check flow, theme–rheme progression, repeated words that should (or should deliberately not) vary.

### Discipline — the bar for change

This is approved text with many review layers behind it (TR, GEM/OPS, RED, CON, earlier redaction passes). Respect that:

- **A change must be clearly better, not merely different.** If an alternative is only equal, leave the text alone; optionally record it as a NOTE.
- **Do not churn synonyms.** No swaps you couldn't defend to the Conductor in one sentence.
- **Never trade accuracy for beauty.** If a more expressive phrasing shades the meaning away from the French, it loses.
- **Preserve prior review decisions** unless you can show they missed something — read the existing TR/GEM/OPS/RED/CON comments first; many "improvements" were already tried and rejected there.
- Expect most sentences to survive untouched. A Fablelous pass that changes every line has failed its own standard; so has one that rubber-stamps a real stumble.

### Comment format

Every text change gets a FAB comment on its own line inside the paragraph block, after the translated text:

```markdown
%% YYYY-MM-DDThh:mm:ss FAB: "old" → "new" — why the new choice fits/expresses Marie's intent better %%
```

Considered-but-rejected alternatives worth recording:

```markdown
%% YYYY-MM-DDThh:mm:ss FAB: NOTE: "current" kept over "alternative" — reason %%
```

### File editing rules (CRITICAL)

- **ONLY edit** visible translation text (lines without `%%`).
- **PRESERVE** all `%% … %%` lines: paragraph IDs, glossary tags, French originals, all prior role comments. Never modify or delete them.
- **NEVER** place FAB comments inline within text — always on their own line.
- **SPLICE TRAP** (all three agents of the 2026-08-08 wave introduced this — 66 instances total): if your Edit `old_string` matches only the first part of a long text line, the FAB comment lands mid-line and the rest of the paragraph is stranded after the closing marker — the renderer silently drops it, and `%%`-parity does NOT catch it. Prevention: **anchor the FAB comment insertion on the line FOLLOWING the text** (an existing comment line, or the blank line before the next paragraph ID) rather than matching through a 600-character text line. If a text line ends in a footnote marker, the marker must be INSIDE your old_string — matching up to the last word but not the trailing `[^...]` strands the marker outside the line. Never bundle a text edit and a comment insertion into one Edit call unless the matched text runs to the actual END of the line — a text line often holds several sentences, and matching only the first one strands the rest behind your comment (this exact bundling mistake produced splices even for agents who anchored comment-only insertions correctly). Run the stranded-text scan after EACH file, not only at the end — a systematic mistake then surfaces on file one instead of file twenty-seven (every agent of the 2026-08-08 wave hit this trap mid-run; the Edit tool's success response does not reveal it). Re-run the scan after repairing any splice — the repair itself is a splice risk. Any line containing a comment must have NO visible text outside the comment markers.
- Never type a literal double-percent sequence inside a comment's prose — write "marker" or "wrapper" instead (it breaks the balance gate).
- **PRESERVE** footnotes and their markers; if you touch a sentence with a footnote marker, keep the marker attached to the right word.
- Keep target-language punctuation conventions (quotes, dashes, dates) per `content/{lang}/CLAUDE.md`.

### Frontmatter

After finishing an entry, append the pass to `redaction_passes` (create the key if missing), regardless of whether the entry needed changes:

```yaml
redaction_passes:
  - fable-5-creative 2026-07-06   # (existing entries stay)
  - fablelous YYYY-MM-DD
```

Do not touch any other frontmatter flags.

### Report

When done, return a summary: files reviewed, files changed, change count per file with one-line gists, notable patterns, and an honest statement of what you deliberately left alone.

## Role code

`FAB` — Fablelous polish. Registered alongside RSR/LAN/TR/GEM/OPS/RED/CON in `/CLAUDE.md`.
