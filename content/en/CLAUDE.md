# en/ — English Translations

This directory contains English translations of Marie Bashkirtseff's diary.

## Structure

```
en/
├── CLAUDE.md            # This file
├── PROGRESS.md          # Overall English translation status
├── TranslationMemory.md # Established terminology
│
├── 000/                 # Translated preface
│   └── README.md        # Carnet progress
├── 001/-106/            # Translated entries
│   └── README.md        # Per-carnet progress
│
└── _archive/            # Old translation versions
```

## Historical Context

Previous English translations (1890 Cassell edition, Kernberger 2013) were either heavily censored or selective. This project aims for the first complete, uncensored English translation from the original manuscripts.

Kernberger's translations are available as reference but we produce fresh translations — do not copy or closely paraphrase her work.

## Translation File Format

English translation files mirror the French originals but include both languages:

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
translation_complete: true
editor_approved: true
conductor_approved: false
---

%% 001.0001 %%
%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%
%% Samedi 11 janvier 1873. Il fait un temps superbe... %%
Saturday, 11 January 1873. The weather is superb...
%% 2026-02-13T12:00:00 TR: "superbe" — kept cognate "superb" as it
matches Marie's enthusiastic register. %%
```

**Key points:**
- French original in `%% ... %%` comment before English text
- Glossary links use path to `_original/_glossary/`
- TR comments document translation decisions

## Translation Phases

### 1. Translation (TR)
- Translate from annotated French source
- Preserve Marie's voice and style
- Follow established terminology
- Add TR comments for non-obvious choices

**Frontmatter flag**: `translation_complete: true`

### 2. Gemini Review (GEM)
- External AI review for fresh perspective
- Check consistency and naturalness
- Suggest alternative phrasings
- Catch issues Claude might miss

**Frontmatter flag**: `gemini_reviewed: true`

### 3. Editor Review (RED)
- Check naturalness in English
- Verify accuracy against French
- Flag awkward phrasing
- Suggest improvements

**Frontmatter flag**: `editor_approved: true`

### 4. Conductor Approval (CON)
- Final literary quality check
- Ensure Marie's voice preserved
- Approve or request revision

**Frontmatter flag**: `conductor_approved: true`

## Style Guidelines

### Marie's Voice
- 19th century sophistication with youthful energy
- Dramatic, sometimes exaggerated emotions
- Sharp wit and self-awareness
- Natural English that reads as literature, not translation

### Target Reader
- Educated contemporary English reader
- Preserve 19th century flavor without being archaic
- No need to dumb down references — use footnotes for context

### Terminology Consistency
Check `TranslationMemory.md` for established translations of:
- Recurring phrases
- Character names and titles
- Places and institutions
- Period vocabulary

### Cultural Adaptation
- Keep French terms that add flavor (in italics, with footnotes on first use)
- Titles and honorifics: explain on first use via glossary
- Explain what needs explaining, preserve what should feel foreign

### Foreign Language Handling

Marie frequently code-switches between French, English, Italian, and Russian:

- **English passages in the French original**: Keep as-is — mark with ==highlight== and footnote "*In English in the original*"
- **Italian/Russian passages**: Translate to English, mark with ==highlight==, footnote with original text
- **French terms kept in English**: Use italics (*toilette*, *promenade*) with translation on first use

## Editor / review traps (English)

Concrete English traps for RED, OPS, and GEM to catch (the language-agnostic frame lives in the `editor`/`opus-editor`/`gemini-editor` skills; the concrete examples live here):

| Category | Example |
|----------|---------|
| **Gallicisms** | "make a promenade" → "go for a walk" |
| **False friends** | "sympathetic" ≠ "sympathique", "actually" ≠ "actuellement" |
| **Register** | Too formal/informal for context; archaism vs. period flavour |

- Keep Marie's same-language code-switches as-is with `==highlight==` and footnote "*In English in the original*".
- 19th century sophistication without archaism.

## Gemini review prompts (GEM)

The `gemini-editor` skill inserts these into the `gemini -y` command (the `{INSERT … PROMPT …}` placeholders).

**Pass 1 — text-only:**

```
You are an experienced English editor and stylist. Review this English translation of Marie Bashkirtseff's diary (19th century).

FOCUS ON:
1. Gallicisms (literal translations from French that sound unnatural in English)
2. Grammar (tense consistency, agreement, awkward constructions)
3. Naturalness (should read as if written by an English author, not translated)
4. Period appropriateness (19th century feel, but readable for modern audiences)
5. Semantic shifts (gallicisms that change meaning)
6. False friends (words that exist in both languages but with shifted meaning: sympathetic ≠ sympathique)

For each issue, assign severity:
- A: must fix (grammar error, meaning shift, nonsense)
- B: recommended (unnaturalness, gallicism, better alternative exists)
- C: cosmetic (minor, ignore)
```

**Pass 2 — with-comments:**

```
You are an experienced English editor and stylist. Review this English translation of Marie Bashkirtseff's diary (19th century).

The text contains inline comments in %% ... %% format — these include the French original, translator notes (TR), linguistic notes (LAN), research notes (RSR), and previous corrections (GEM). Use them for context, but review ONLY the English translation (lines without %%).

IMPORTANT: Disregard previous GEM corrections — evaluate each passage independently, as if seeing it for the first time.

FOCUS ON:
1. Semantic shifts (compare the English with the French original — does it capture the actual meaning?)
2. Mistranslations (words that mean something different in English than in French)
3. Lost nuances (irony, social register, emotional tone)
4. Grammar (tense, agreement, natural constructions)
5. Naturalness (does it read as English prose, not a translation?)

For each issue, assign severity:
- A: must fix
- B: recommended
- C: cosmetic (ignore)
```

## Comment Types

| Code | Role | Purpose |
|------|------|---------|
| TR | Translator | Translation decisions |
| GEM | Gemini | External AI review notes |
| RED | Editor | Quality notes, suggestions |
| CON | Conductor | Approval, final notes |

## Progress Tracking

Each carnet has a `README.md` tracking:
- Translation/edit/approval counts
- TODOs (local and synced from original)
- Changelog

Use `/project-status en 001` to check status.

### TODO Tags for Translation Work

| Tag | Meaning |
|-----|---------|
| `TR-FIX` | Translation needs correction |
| `RED-FLAG` | Editor concern |
| `CON-BLOCK` | Conductor blocked approval |
| `TERMINOLOGY` | Check TranslationMemory.md |
| `VOICE` | Marie's voice not captured |

## Common Tasks

### Translate an entry
```bash
/translator    # Invoke translator skill with entry path
```

### Review a translation
```bash
/editor        # Invoke editor skill
```

### Final approval
```bash
/conductor     # Invoke conductor skill
```

### Check what needs work
```bash
/project-status en           # Overall English status
/project-status en 001       # Carnet 001 status
```

### Record completed work
```bash
/project-status log en 001 "Translated entries 1873-01-11 to 1873-01-20"
```

## Related Documentation

- `/content/_original/CLAUDE.md` - French source materials
- `/docs/INFRASTRUCTURE.md` - Progress tracking system
- `/.claude/skills/translator/SKILL.md` - Translator role
- `/.claude/skills/editor/SKILL.md` - Editor role
- `/.claude/skills/conductor/SKILL.md` - Conductor role
