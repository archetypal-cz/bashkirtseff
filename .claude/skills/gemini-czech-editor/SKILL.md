---
name: gemini-czech-editor
description: External AI review (Gemini) for translations in any language. Run Gemini as a secondary editor to catch grammar, naturalness, and galicism issues that Claude may miss. Use after Editor review, before Conductor.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Gemini Translation Editor

You orchestrate an external AI review of translations using Google Gemini. This provides cross-model validation — a different AI perspective catches issues the primary translator and editor may have blind spots for.

Works with any target language: Czech (cz), Ukrainian (uk), English (en), French modern edition (fr).

## Agent Teams Protocol

GEM is dispatched as a one-shot operation per carnet (or batch of entries). It can run in parallel across multiple carnets.

When dispatched:
1. Process all entries in the assigned carnet(s)
2. Batch entries into groups of 3-6 for efficient Gemini calls
3. Save review output as `.gemini-review-*.md` files
4. Apply severity A and B fixes directly
5. Report results (scores, issue counts, fixes applied)

## When to Use

- **After translation is complete** — translations should already exist
- **Cross-model validation** — Gemini catches different issues than Claude
- **Batch processing** — can process entire carnets efficiently

## Workflow

### 1. Extract visible text

Use the extraction script to get clean text from translation files. The script works for any language:

```bash
bash src/scripts/extract_czech_text.sh content/{LANG}/{CARNET}/{FILE}.md
```

This strips YAML frontmatter, `%% ... %%` comments, and footnote definitions, leaving only visible translation text.

For batching multiple entries into one Gemini call:

```bash
for f in content/{LANG}/{CARNET}/*.md; do
    [[ "$(basename $f)" == "README.md" ]] && continue
    echo "=== $(basename $f) ==="
    bash src/scripts/extract_czech_text.sh "$f"
    echo ""
done
```

### 2. Send to Gemini for review

Use the Gemini CLI in non-interactive mode. **The prompt MUST be in the target language** to get native-quality feedback.

**Key: always use `gemini -p`** (non-interactive/headless mode). Input is piped via stdin, prompt via `-p`.

#### Czech (cz) prompt:

```bash
echo "$BATCH_TEXT" | gemini -p "$(cat <<'PROMPT'
Jsi zkušený český redaktor a stylista. Zkontroluj tento český překlad deníku Marie Bashkirtseffové (19. století).

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
- **ZÁVAŽNOST:** A (musí se opravit) / B (doporučeno) / C (kosmetické)

Na konci: **Celkový dojem z přirozenosti:** X/10, **Hlavní vzorce problémů**, **Co je výborné**

TEXT K REVIZI:
PROMPT
)"
```

#### Ukrainian (uk) prompt:

```bash
echo "$BATCH_TEXT" | gemini -p "$(cat <<'PROMPT'
Ти досвідчений український редактор і стиліст. Перевір цей український переклад щоденника Марії Башкирцевої (19 століття).

ЗВЕРНИ УВАГУ НА:
1. Галіцизми (дослівні переклади з французької, які звучать неприродно українською)
2. Граматику (відмінки, узгодження, порядок слів, вживання часток)
3. Природність української (має звучати як українська авторка, а не як переклад)
4. Доречність епосі (19 століття, але зрозумілий для сучасного читача)
5. Смислові зсуви (галіцизми, що змінюють значення)

ФОРМАТ ВІДПОВІДІ:
Для КОЖНОГО файлу (=== файл ===) вкажи знайдені проблеми:
- **ОРИГІНАЛ:** «цитата проблемного місця»
- **ПРОПОЗИЦІЯ:** «запропоноване виправлення»
- **ПРИЧИНА:** коротке пояснення
- **СЕРЙОЗНІСТЬ:** A (треба виправити — помилка в логіці/граматиці/значенні) / B (рекомендовано) / C (косметичне)

Наприкінці: **Загальне враження від природності:** X/10, **Основні закономірності проблем**, **Що чудово вдалося**

ТЕКСТ ДО ПЕРЕВІРКИ:
PROMPT
)"
```

#### English (en) prompt:

```bash
echo "$BATCH_TEXT" | gemini -p "$(cat <<'PROMPT'
You are an experienced English editor and stylist. Review this English translation of Marie Bashkirtseff's diary (19th century).

FOCUS ON:
1. Gallicisms (literal translations from French that sound unnatural in English)
2. Grammar (tense consistency, agreement, awkward constructions)
3. Naturalness (should read as if written by an English author, not translated)
4. Period appropriateness (19th century feel, but readable for modern audiences)
5. Semantic shifts (gallicisms that change meaning)

RESPONSE FORMAT:
For EACH entry (=== file ===) list issues found:
- **ORIGINAL:** "quote of problematic passage"
- **SUGGESTION:** "proposed fix"
- **REASON:** brief explanation
- **SEVERITY:** A (must fix — logic/grammar/meaning error) / B (recommended) / C (cosmetic)

At the end: **Overall naturalness:** X/10, **Main problem patterns**, **What works well**

TEXT TO REVIEW:
PROMPT
)"
```

### 3. Save review output

Save the Gemini review as a hidden file in the carnet directory:

```
content/{LANG}/{CARNET}/.gemini-review-{date-range}.md
```

Add a header:
```markdown
# Gemini {LANG} Review: Carnet {XXX}, {Date Range}
**Date:** YYYY-MM-DD
---
[Gemini output here]
```

### 4. Apply severity A and B fixes

After saving the review, **apply all severity A and B fixes directly** to the translation files:

1. Read the review and identify severity A and B issues
2. Read the affected translation file
3. Use Edit to fix only the visible translation text (not comments)
4. Add a GEM comment for each fix:

```markdown
%% 2026-02-15T15:00:00 GEM: "original" → "fix" — reason %%
```

For severity B, add the marker:
```markdown
%% 2026-02-15T15:00:00 GEM: "original" → "fix" — reason (sev B) %%
```

### 5. Preserve file structure

When editing translation files:

- **PRESERVE** all `%% ... %%` comments (paragraph IDs, tags, RSR/LAN/TR/RED notes)
- **PRESERVE** all glossary links `[#Name](path)`
- **PRESERVE** the French original in comments
- **ONLY EDIT** the visible translation text
- **ADD** GEM comments for each change made

## Typical Issues by Language

### Czech
| Category | Example |
|----------|---------|
| **Galicisms** | "vzít si ženu" (= marry), "dítě domu", "dát pochopit" |
| **Reflexive errors** | "kojila jsem se" (breastfed myself) |
| **Non-existent words** | "rukavičkuje se" (not real Czech) |
| **Word order** | "pak na tribuně jsem" (příklonka "jsem" must be 2nd) |
| **Preposition calques** | "za čelem" → "z čela" |

### Ukrainian
| Category | Example |
|----------|---------|
| **Galicisms** | "взяти жінку" (= одружитися), "дати зрозуміти" |
| **Russianisms** | "потому что" → "тому що", "тоже" → "також" |
| **Case errors** | Wrong відмінок governance |
| **Aspect** | Imperfective/perfective confusion |
| **Calques** | Literal French constructions in Ukrainian word order |

### English
| Category | Example |
|----------|---------|
| **Gallicisms** | "make a promenade" → "go for a walk" |
| **Register** | Too formal/informal for context |
| **False friends** | "sympathetic" ≠ "sympathique" |

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

- Apply severity A and B corrections automatically
- Severity C are suggestions saved in the review file only
- When Gemini suggests something dubious, do NOT apply it — save it in the review file only
- Focus on issues that affect meaning, grammar, and naturalness
- The goal is text that reads as if written by a native author, not translated from French
