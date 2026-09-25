---
name: fablelous
description: Final-mile polishing pass (FAB). Interrogate every sentence and every load-bearing word of a translation — is this the best-fitting, most expressive way to say what Marie wanted to say? Use on conductor-approved entries as an extra review pass, recorded in frontmatter under redaction_passes.
allowed-tools: Read, Edit, Write, Grep, Glob, Agent, Bash
---

# Fablelous Polish (FAB)

You are running the **Fablelous pass** — the finest-grained review in the pipeline. It runs on text that is already conductor-approved. The question is no longer "is this correct?" (RED/OPS/CON answered that) but:

> **Is this the best-fitting, most expressive way to say what Marie wanted to say — sentence by sentence, word by word?**

The pass is executed by **specially instructed agents running on the session's model** (Opus 5.5 and Fable have both been used — the owner chooses per run; never pick a smaller model for polish work). One agent per language per carnet, so the voice stays consistent across entries; name the model that ran in your report.

## Orchestration (when invoked as /fablelous)

Invoked as `/fablelous {carnet} {lang...}` (e.g. `/fablelous 000 cz uk`):

1. Spawn one agent per language (in parallel, background, on the model the owner chose for this run), each instructed with the **Agent instructions** below plus the file list.
2. When agents finish, verify per carnet: `just splicescan {lang} {carnet}` prints nothing, `just verify-carnet {lang} {carnet}` PASSes (see `.claude/skills/_shared/editing_rules.md` §1 and §6), no stranded French, `redaction_passes` updated in every file, FAB comments present where text changed, `conductor_approved` flags untouched, and no TM-locked term reversed (cz/089/1880-09-30: a FAB pass swapped the locked *velkovévoda* for *velkokníže* — see WATCHLIST).
3. Summarize changes per language for the user. Agents do not commit; the lead commits each carnet after the gates pass. VOX skips uncommitted files, so a FAB pass must be committed before VOX runs on that carnet.

## Agent instructions

### Preparation

1. Read this SKILL.md in full.
2. Read `content/{lang}/CLAUDE.md` — language-specific style guide, traps, punctuation rules.
3. For each entry, read the French original in `content/_original/{carnet}/` **before** judging the translation — always the source file, never only the `%% … %%` copy embedded in the translation (it can be stale or elided; cz/018 was FAB-approved against a truncated copy). If paragraph count or length differs from the source, stop on that entry and report it (`_shared/editing_rules.md` §2). Absorb Marie's intent, register shifts, rhetorical architecture, jokes, self-corrections.

### Method — sentence and word interrogation

Work paragraph by paragraph, sentence by sentence. For each sentence:

1. **Intent**: What did Marie want this sentence to *do*? Not just its meaning — its gesture: boast, self-mockery, dramatic escalation, false modesty, aside to the reader, rhythm of a list, a landing blow at the end.
2. **Fit**: Does the translation perform that gesture as well as the target language allows? Would a native author of literary talent, writing this diary herself, have written this sentence this way?
3. **Word level**: For each load-bearing word (verbs of feeling, evaluative adjectives, ironic markers, intensifiers, sentence-final words), ask: is there a more exact, more expressive, more period-true choice? Hold candidate alternatives against the French, not against the current translation.
4. **Ear test**: Read the sentence aloud in your head. Rhythm, clitic placement, where the stress falls, whether the sentence ends on its strongest word. Marie's prose has tempo; the translation must too.
5. **Calque hunt** (the gap earlier passes left open — KRR, 2026-09-25: "pořád nechával poměrně dost doslovných obratů"): for every sentence ask separately, *would a native writer ever produce this construction on their own, without the French in front of them?* Earlier passes judged sentences "correct and acceptable" and left source-shaped syntax standing. Typical tells: French word order carried over (adjective/adverb placement, fronted participles, cleft *c'est … que*), nominal style where the target language prefers a verb (*faire une promenade*), possessives and articles that the target language drops, French idioms rendered word by word (*avoir beau*, *ne faire que*, *il y a de quoi*, *se mettre à*), set phrases with a native equivalent that was not used, passive and reflexive-passive where the target language uses an active or impersonal form, French clock/date/number idiom, overlong participial chains. A literal construction with a natural native equivalent that keeps the meaning **counts as "clearly better"** under the Discipline rules below — fix it, *without force*: the native version must read as if written in the target language, not as a clever rewrite, and must not add colour Marie did not put there. Per-language examples of these tells: the "Editor / review traps" section of `content/{lang}/CLAUDE.md`.
6. **Cohesion**: After finishing an entry, reread it whole. Sentences polished in isolation can lose their thread — check flow, theme–rheme progression, repeated words that should (or should deliberately not) vary.

### Discipline — the bar for change

This is approved text with many review layers behind it (TR, GEM/OPS, RED, CON, earlier redaction passes). Respect that:

- **A change must be clearly better, not merely different.** If an alternative is only equal, leave the text alone; optionally record it as a NOTE.
- **Do not churn synonyms.** No swaps you couldn't defend to the Conductor in one sentence.
- **Never trade accuracy for beauty.** If a more expressive phrasing shades the meaning away from the French, it loses.
- **Never "fact-correct" Marie** and **never change a TM-locked term**; a pending-ruling item is flagged, not normalised (`_shared/editing_rules.md` §3, §5). When a fix belongs to a recurring family, grep the carnet for the rest and report the count (§4).
- **Preserve prior review decisions** unless you can show they missed something — read the existing TR/GEM/OPS/RED/CON comments first; many "improvements" were already tried and rejected there.
- Expect most sentences to survive untouched — but not the calques: a source-shaped construction is a real stumble, not an "equal alternative" (see Calque hunt above). A Fablelous pass that changes every line has failed its own standard; so has one that rubber-stamps a real stumble.

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
- **Splice-safe insertion** — canonical procedure in `.claude/skills/_shared/editing_rules.md` §1. In short: every FAB comment on its own line, anchored on the line *after* the text; bundle a text edit with a comment only when `old_string` runs to the real end of the line (trailing `[^…]` included); run `just splicescan {lang} {carnet}` after EACH file (the 2026-08-08 wave introduced 66 splices mid-run, and the Edit tool's success response does not reveal them). Name scratch files with your lang+carnet.
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

`FAB` — Fablelous polish. Registered alongside RSR/LAN/TR/OPS/RED/CON/VOX in `/CLAUDE.md`.
