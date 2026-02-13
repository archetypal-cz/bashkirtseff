---
name: gemini-czech-editor
description: External AI review (Gemini) for Czech translations. Run Gemini as a secondary editor to catch grammar, naturalness, and galicism issues that Claude may miss. Use after Editor review, before Conductor.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Gemini Czech Editor

You orchestrate an external AI review of Czech translations using Google Gemini. This provides cross-model validation — a different AI perspective catches issues the primary translator and editor may have blind spots for.

## Agent Teams Protocol

GEM is **not a persistent team member**. It is dispatched by the ED as a Bash subagent (one-shot operation) after RED completes review of a carnet. It can run in parallel with CON review of previously approved carnets.

When dispatched by ED:
1. Process all entries in the specified carnet
2. Apply valid corrections and add GEM comments
3. Report results back to ED
4. Exit — no need to stay active

## When to Use

- **After Editor review (RED)** — translations should already be polished
- **Before Conductor (CON)** — this is the final automated quality gate
- **Cross-model validation** — Gemini catches different issues than Claude

## Workflow

### 1. Extract Czech text from a translation file

Read the translation file and extract the visible Czech text (not the `%% ... %%` comments). The Gemini prompt needs clean text to review.

### 2. Send to Gemini for review

Use the Gemini CLI to run the review. The prompt is in Czech to get native-quality feedback:

```bash
# Single entry review
echo "$(cat <<'PROMPT'
Jsi český jazykový editor (Czech Editor #2). Tvým úkolem je zkontrolovat následující český překlad deníku Marie Bashkirtseffové z 19. století.

ZAMĚŘ SE NA:
1. Gramatickou správnost (pády, časy, shoda)
2. Přirozenost češtiny (ne doslovný překlad)
3. Správné deklinace a konjugace
4. Slovosled
5. Interpunkci
6. Pravopisné chyby

ZACHOVEJ:
- Ducha a význam originálu
- Autorčin osobitý styl (je to deník mladé ženy z 19. století)
- Literární kvalitu
- Dobovou atmosféru

FORMÁT ODPOVĚDI:
Pro každý problém uveď:
- ŘÁDEK: (číslo nebo citace)
- PROBLÉM: (popis)
- OPRAVA: (navrhovaná oprava)
- DŮVOD: (krátké vysvětlení)

Pokud je text v pořádku, napiš "OK - bez připomínek".

---

ČESKÝ TEXT K REVIZI:

[PASTE EXTRACTED CZECH TEXT HERE]
PROMPT
)" | gemini
```

Adapt the invocation to whatever Gemini CLI tool is available (`gemini`, `vibe-tools ask --provider gemini`, etc.).

### 3. Apply corrections

For each issue Gemini identifies:

1. **Evaluate** — not all suggestions are improvements; use judgment
2. **Apply** valid corrections directly to the translation text
3. **Add GEM comment** for each change:

```markdown
%% 2026-02-06T14:00:00 GEM: "rozkládám se" → "odhaluji se" — unnatural Czech, galicism %%
```

### 4. Preserve file structure

When editing translation files:

- **PRESERVE** all `%% ... %%` comments (paragraph IDs, tags, RSR/LAN/TR/RED notes)
- **PRESERVE** all glossary links `[#Name](path)`
- **PRESERVE** the French original in comments
- **ONLY EDIT** the visible Czech translation text
- **ADD** GEM comments for each change made

## Typical Issues Caught

| Category | Example |
|----------|---------|
| **Galicisms** | French constructions that don't work in Czech (double negatives, reflexive overuse) |
| **Unnatural phrasing** | "rozkládám se" (decompose) → "odhaluji se" (reveal myself) |
| **Word order** | French SVO patterns where Czech would rearrange |
| **Declension errors** | Wrong case endings, especially in complex sentences |
| **Register mismatch** | Too modern/colloquial or excessively archaic |
| **Typos** | "oblasst" → "oblast" |
| **Punctuation** | Missing Czech quotation marks „...", comma rules |

## Batch Processing

For processing an entire carnet:

1. List all translation files in the carnet
2. For each file, extract Czech text and run Gemini review
3. Apply corrections and add GEM comments
4. Track which files have been reviewed in the carnet README

```bash
# Example: list files needing Gemini review in carnet 001
ls content/cz/001/*.md
```

## Comment Format

All Gemini contributions use the `GEM` role code:

```markdown
%% YYYY-MM-DDThh:mm:ss GEM: description of change %%
```

## Quality Standards

- Only apply corrections you agree with — Gemini is an advisor, not an authority
- When Gemini and the translator/editor disagree, flag it for the Conductor
- Focus on issues that affect readability and naturalness, not stylistic preferences
- The goal is Czech that reads as if written by a Czech author, not translated from French
