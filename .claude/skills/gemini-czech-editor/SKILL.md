---
name: gemini-czech-editor
description: External AI review (Gemini) for Czech translations. Run Gemini as a secondary editor to catch grammar, naturalness, and galicism issues that Claude may miss. Use after Editor review, before Conductor.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Gemini Czech Editor

You orchestrate an external AI review of Czech translations using Google Gemini. This provides cross-model validation — a different AI perspective catches issues the primary translator and editor may have blind spots for.

## Agent Teams Protocol

GEM is dispatched as a one-shot operation per carnet (or batch of entries). It can run in parallel across multiple carnets.

When dispatched:
1. Process all entries in the assigned carnet(s)
2. Batch entries into groups of 3-6 for efficient Gemini calls
3. Save review output as `.gemini-review-*.md` files
4. Apply severity A fixes directly
5. Report results (scores, issue counts, fixes applied)

## When to Use

- **After translation is complete** — translations should already exist
- **Cross-model validation** — Gemini catches different issues than Claude
- **Batch processing** — can process entire carnets efficiently

## Workflow

### 1. Extract Czech text

Use the extraction script to get clean Czech text from translation files:

```bash
bash src/scripts/extract_czech_text.sh content/cz/001/1873-01-11.md
```

This strips YAML frontmatter, `%% ... %%` comments, and footnote definitions, leaving only visible Czech text.

For batching multiple entries into one Gemini call:

```bash
for f in content/cz/002/1873-02-{16,17,18,19,20}.md; do
    echo "=== $(basename $f) ==="
    bash src/scripts/extract_czech_text.sh "$f"
    echo ""
done
```

### 2. Send to Gemini for review

Use the Gemini CLI in non-interactive mode. The prompt is in Czech to get native-quality feedback:

```bash
BATCH_TEXT=$( for f in content/cz/002/1873-02-{16,17,18,19,20}.md; do
    echo "=== $(basename $f) ==="
    bash src/scripts/extract_czech_text.sh "$f"
    echo ""
done )

echo "$BATCH_TEXT" | gemini -p "$(cat <<'PROMPT'
Jsi zkušený český redaktor a stylista. Zkontroluj tento český překlad deníku Marie Bashkirtseffové (1873, 19. století).

ZAMĚŘ SE NA:
1. Galicismy (doslovné překlady z francouzštiny, které v češtině znějí nepřirozeně)
2. Gramatiku (pády, shoda, slovosled, postavení příklonek jsem/se/si)
3. Přirozenost češtiny (má znít jako česká autorka, ne jako překlad)
4. Dobovou přiměřenost (19. století, ale čtivý pro dnešního čtenáře)
5. Významové posuny (galicismy, které mění smysl: "vzít si ženu" = oženit se!)

FORMÁT ODPOVĚDI:
Pro KAŽDÝ vstup (=== soubor ===) uveď nalezené problémy:
- **PŮVODNÍ:** „citace problematického místa"
- **NÁVRH:** „navrhovaná oprava"
- **DŮVOD:** krátké vysvětlení
- **ZÁVAŽNOST:** A (musí se opravit — chyba v logice/gramatice/významu) / B (doporučeno) / C (kosmetické)

Na konci uveď celkové shrnutí:
- **Celkový dojem z přirozenosti:** X/10
- **Hlavní vzorce problémů:** (stručný seznam)
- **Co je naopak výborné:** (co funguje skvěle)

TEXT K REVIZI:
PROMPT
)"
```

**Key: always use `gemini -p`** (non-interactive/headless mode). Input is piped via stdin, prompt via `-p`.

### 3. Save review output

Save the Gemini review as a hidden file in the carnet directory:

```
content/cz/002/.gemini-review-feb16-20.md
```

Format: `.gemini-review-{date-range}.md`

Add a header:
```markdown
# Gemini Czech Review: Carnet 002, Feb 16-20
**Date:** 2026-02-14
---
[Gemini output here]
```

### 4. Apply severity A fixes

After saving the review, **apply all severity A fixes directly** to the translation files:

1. Read the review and identify severity A issues
2. Read the affected translation file
3. Use Edit to fix only the Czech text (not comments)
4. Add a GEM comment for each fix:

```markdown
%% 2026-02-14T15:00:00 GEM: "kojila jsem se" → "byla jsem kojena" — reflexive = breastfed myself, must be passive %%
```

### 5. Preserve file structure

When editing translation files:

- **PRESERVE** all `%% ... %%` comments (paragraph IDs, tags, RSR/LAN/TR/RED notes)
- **PRESERVE** all glossary links `[#Name](path)`
- **PRESERVE** the French original in comments
- **ONLY EDIT** the visible Czech translation text
- **ADD** GEM comments for each change made

## Typical Issues Caught

| Category | Example |
|----------|---------|
| **Galicisms** | "vzít si ženu" (= marry), "dítě domu", "dát pochopit" |
| **Reflexive errors** | "kojila jsem se" (breastfed myself) |
| **Non-existent words** | "rukavičkuje se" (not real Czech) |
| **Logic inversions** | "valné mínění" (says opposite of intended meaning) |
| **Word order** | "pak na tribuně jsem" (příklonka "jsem" must be 2nd) |
| **Time formats** | "ve tři a půl" (French) → "o půl čtvrté" (Czech) |
| **Gender errors** | "stát se zajímavým" for female speaker |
| **Chained relatives** | "které... která..." → use semicolons or "jíž" |
| **Preposition calques** | "za čelem" → "z čela", "na koncertě" → "u koncertu" |

## Batch Sizing

- **3-6 entries per Gemini call** works well (enough context, not too long)
- Short entries (1-3 paragraphs): batch 5-6
- Long entries (10+ paragraphs): batch 2-3
- Very long entries: send individually

## Comment Format

All Gemini contributions use the `GEM` role code:

```markdown
%% YYYY-MM-DDThh:mm:ss GEM: "original" → "fix" — reason %%
```

## Quality Standards

- Only apply severity A corrections automatically — B and C are suggestions for human review
- When Gemini suggests something dubious, do NOT apply it — save it in the review file only
- Focus on issues that affect meaning, grammar, and naturalness
- The goal is Czech that reads as if written by a Czech author, not translated from French
