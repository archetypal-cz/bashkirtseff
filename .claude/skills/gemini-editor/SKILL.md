---
name: gemini-editor
description: External AI review (Gemini) for translations in any language. Two-pass review — text-only for naturalness, then with-comments for semantic accuracy. Use after Editor review, before Conductor.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Gemini Translation Editor

You orchestrate an external AI review of translations using Google Gemini. This provides cross-model validation — a different AI perspective catches issues the primary translator and editor may have blind spots for.

Works with any target language: Czech (cz), Ukrainian (uk), English (en), French modern edition (fr).

## Why Two Passes?

A/B experiments (see `content/cz/005/.gemini-experiment-comparison.md` and `content/cz/009/.gemini-experiment-comparison.md`) revealed that **text-only and with-comments reviews catch fundamentally different issues**:

| Approach | Strengths | Weaknesses |
|----------|-----------|------------|
| **Text-only** | False friends, calques, word order, naturalness | Misses semantic errors invisible without French |
| **With-comments** | Semantic accuracy, mistranslations, precise fixes | Self-confirmation bias, less aggressive on naturalness |

Neither approach alone catches everything. **Use both in sequence.**

## Agent Teams Protocol

GEM is dispatched as a one-shot operation per carnet (or batch of entries). It can run in parallel across multiple carnets.

When dispatched:
1. Process all entries in the assigned carnet(s)
2. Batch entries into groups of 3-6 for efficient Gemini calls
3. **Pass 1**: Text-only review → save review, apply A+B fixes
4. **Pass 2**: With-comments review (on the now-improved text) → save review, apply remaining A+B fixes
5. Report results (scores, issue counts, fixes applied)

## Rate Limit Handling

**Gemini has API rate limits.** Watch for these signals in `gemini -p` output:

- `429` or `RESOURCE_EXHAUSTED` — rate limit hit
- `quota exceeded` — daily/hourly quota exhausted
- Empty or truncated output — possible silent rate limit

**When you hit a rate limit:**

1. **Stop immediately.** Do NOT retry in a loop.
2. Save your progress — note which batches/entries have been processed and which haven't.
3. Report to the caller: which entries were completed, which remain, and the error message.
4. The caller can resume later by re-dispatching with only the remaining entries.

**Prevention:**
- Wait 5-10 seconds between Gemini calls (use `sleep 5` between batches)
- Keep batches at 3-5 entries (not 6) to stay under token limits
- If processing multiple carnets, pace yourself — don't fire all batches simultaneously

## Workflow

### Step 1: Extract visible text

Use the extraction script to get clean text from translation files. The script works for any language:

```bash
bash src/scripts/extract_czech_text.sh content/{LANG}/{CARNET}/{FILE}.md
```

This strips YAML frontmatter, `%% ... %%` comments, and footnote definitions, leaving only visible translation text.

For batching multiple entries into one Gemini call:

```bash
BATCH_TEXT=""
for f in content/{LANG}/{CARNET}/{FILE1}.md content/{LANG}/{CARNET}/{FILE2}.md ...; do
    BATCH_TEXT+="=== $(basename $f) ==="$'\n'
    BATCH_TEXT+="$(bash src/scripts/extract_czech_text.sh "$f")"$'\n'$'\n'
done
```

### Step 2: Pass 1 — Text-Only Review

Send **only the visible translation text** (no comments, no French original). This forces Gemini to evaluate the target language purely on its own merits.

**Key: always use `gemini -p`** (non-interactive/headless mode). Input is piped via stdin, prompt via `-p`.

Use the text-only prompt for the target language (see Prompts section below).

```bash
RESULT=$(echo "$BATCH_TEXT" | gemini -p "$TEXT_ONLY_PROMPT")
```

**Check for rate limit errors** in `$RESULT` before proceeding. If the output contains `429`, `RESOURCE_EXHAUSTED`, `quota exceeded`, or is empty/truncated, stop and report.

Save the review:
```
content/{LANG}/{CARNET}/.gemini-review-{date-range}-pass1.md
```

### Step 3: Apply Pass 1 Fixes

Apply all severity A and B fixes from Pass 1:

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

### Step 4: Pass 2 — With-Comments Review

Now send the **full file content** (with all `%% ... %%` comments, French originals, TR/LAN/RSR notes) but strip YAML frontmatter. This lets Gemini catch semantic errors that require seeing the French source.

```bash
# Strip YAML frontmatter only, keep all comments
FULL_TEXT=$(sed '1,/^---$/{ /^---$/!d; d; }' content/{LANG}/{CARNET}/{FILE}.md)
```

Use the with-comments prompt for the target language (see Prompts section below).

```bash
RESULT=$(echo "$FULL_TEXT" | gemini -p "$WITH_COMMENTS_PROMPT")
```

**Again check for rate limit errors** before proceeding.

Save the review:
```
content/{LANG}/{CARNET}/.gemini-review-{date-range}-pass2.md
```

### Step 5: Apply Pass 2 Fixes

Apply severity A and B fixes from Pass 2 that weren't already caught in Pass 1.

**Be careful not to duplicate fixes** — Pass 2 may flag issues already fixed in Pass 1. Check before applying.

### Step 6: Preserve file structure

When editing translation files:

- **PRESERVE** all `%% ... %%` comments (paragraph IDs, tags, RSR/LAN/TR/RED notes)
- **PRESERVE** all glossary links `[#Name](path)`
- **PRESERVE** the French original in comments
- **ONLY EDIT** the visible translation text
- **ADD** GEM comments for each change made

## Prompts

### Text-Only Prompts (Pass 1)

#### Czech (cz)

```bash
TEXT_ONLY_PROMPT="$(cat <<'PROMPT'
Jsi zkušený český redaktor a stylista. Zkontroluj tento český překlad deníku Marie Bashkirtseffové (19. století).

ZAMĚŘ SE NA:
1. Galicismy (doslovné překlady z francouzštiny, které v češtině znějí nepřirozeně)
2. Gramatiku (pády, shoda, slovosled, postavení příklonek jsem/se/si)
3. Přirozenost češtiny (má znít jako česká autorka, ne jako překlad)
4. Dobovou přiměřenost (19. století, ale čtivý pro dnešního čtenáře)
5. Významové posuny (galicismy, které mění smysl: "vzít si ženu" = oženit se!)
6. Falešní přátelé (slova, která existují v obou jazycích, ale s posunutým významem: ceremonie, kostým, kabinet)

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

#### Ukrainian (uk)

```bash
TEXT_ONLY_PROMPT="$(cat <<'PROMPT'
Ти досвідчений український редактор і стиліст. Перевір цей український переклад щоденника Марії Башкирцевої (19 століття).

ЗВЕРНИ УВАГУ НА:
1. Галіцизми (дослівні переклади з французької, які звучать неприродно українською)
2. Граматику (відмінки, узгодження, порядок слів, вживання часток)
3. Природність української (має звучати як українська авторка, а не як переклад)
4. Доречність епосі (19 століття, але зрозумілий для сучасного читача)
5. Смислові зсуви (галіцизми, що змінюють значення)
6. Русизми (слова та конструкції, які є калькою з російської, а не природною українською)

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

#### English (en)

```bash
TEXT_ONLY_PROMPT="$(cat <<'PROMPT'
You are an experienced English editor and stylist. Review this English translation of Marie Bashkirtseff's diary (19th century).

FOCUS ON:
1. Gallicisms (literal translations from French that sound unnatural in English)
2. Grammar (tense consistency, agreement, awkward constructions)
3. Naturalness (should read as if written by an English author, not translated)
4. Period appropriateness (19th century feel, but readable for modern audiences)
5. Semantic shifts (gallicisms that change meaning)
6. False friends (words that exist in both languages but with shifted meaning: sympathetic ≠ sympathique)

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

### With-Comments Prompts (Pass 2)

#### Czech (cz)

```bash
WITH_COMMENTS_PROMPT="$(cat <<'PROMPT'
Jsi zkušený český redaktor a stylista. Zkontroluj tento český překlad deníku Marie Bashkirtseffové (19. století).

Text obsahuje inline komentáře ve formátu %% ... %% — ty obsahují francouzský originál, poznámky překladatele (TR), jazykové poznámky (LAN), výzkumné poznámky (RSR) a předchozí opravy (GEM). Využij je pro kontext, ale kontroluj POUZE český překlad (řádky bez %%).

DŮLEŽITÉ: Nehleď na předchozí opravy GEM — posuď každou pasáž nezávisle, jako bys ji viděl poprvé.

ZAMĚŘ SE NA:
1. Významové posuny (porovnej český překlad s francouzským originálem — zachycuje skutečný smysl?)
2. Chybné překlady (slova, která v češtině znamenají něco jiného než ve francouzštině)
3. Ztracené nuance (ironie, společenský registr, emocionální tón)
4. Gramatiku (pády, shoda, příklonky)
5. Přirozenost (čte se to jako česky psaný text, ne jako překlad?)

FORMÁT ODPOVĚDI:
Pro KAŽDÝ nalezený problém uveď:
- **PŮVODNÍ:** „citace problematického místa"
- **NÁVRH:** „navrhovaná oprava"
- **DŮVOD:** krátké vysvětlení (uveď francouzský originál pro srovnání)
- **ZÁVAŽNOST:** A (musí se opravit) / B (doporučeno) / C (kosmetické)

Na konci: **Celkový dojem z přirozenosti:** X/10, **Hlavní vzorce problémů**, **Co je výborné**

TEXT K REVIZI:
PROMPT
)"
```

#### Ukrainian (uk)

```bash
WITH_COMMENTS_PROMPT="$(cat <<'PROMPT'
Ти досвідчений український редактор і стиліст. Перевір цей український переклад щоденника Марії Башкирцевої (19 століття).

Текст містить коментарі у форматі %% ... %% — вони містять французький оригінал, нотатки перекладача (TR), мовні нотатки (LAN), дослідницькі нотатки (RSR) та попередні виправлення (GEM). Використовуй їх для контексту, але перевіряй ЛИШЕ український переклад (рядки без %%).

ВАЖЛИВО: Не зважай на попередні виправлення GEM — оціни кожен уривок незалежно, наче бачиш його вперше.

ЗВЕРНИ УВАГУ НА:
1. Смислові зсуви (порівняй український переклад з французьким оригіналом — чи передає він справжній зміст?)
2. Хибні переклади (слова, які українською означають інше, ніж французькою)
3. Втрачені нюанси (іронія, соціальний регістр, емоційний тон)
4. Граматику (відмінки, узгодження, частки)
5. Природність (чи читається це як українській текст, а не як переклад?)
6. Русизми (калька з російської замість природної української)

ФОРМАТ ВІДПОВІДІ:
Для КОЖНОГО знайденого проблеми вкажи:
- **ОРИГІНАЛ:** «цитата проблемного місця»
- **ПРОПОЗИЦІЯ:** «запропоноване виправлення»
- **ПРИЧИНА:** коротке пояснення (вкажи французький оригінал для порівняння)
- **СЕРЙОЗНІСТЬ:** A (треба виправити) / B (рекомендовано) / C (косметичне)

Наприкінці: **Загальне враження від природності:** X/10, **Основні закономірності проблем**, **Що чудово вдалося**

ТЕКСТ ДО ПЕРЕВІРКИ:
PROMPT
)"
```

#### English (en)

```bash
WITH_COMMENTS_PROMPT="$(cat <<'PROMPT'
You are an experienced English editor and stylist. Review this English translation of Marie Bashkirtseff's diary (19th century).

The text contains inline comments in %% ... %% format — these include the French original, translator notes (TR), linguistic notes (LAN), research notes (RSR), and previous corrections (GEM). Use them for context, but review ONLY the English translation (lines without %%).

IMPORTANT: Disregard previous GEM corrections — evaluate each passage independently, as if seeing it for the first time.

FOCUS ON:
1. Semantic shifts (compare the English with the French original — does it capture the actual meaning?)
2. Mistranslations (words that mean something different in English than in French)
3. Lost nuances (irony, social register, emotional tone)
4. Grammar (tense, agreement, natural constructions)
5. Naturalness (does it read as English prose, not a translation?)

RESPONSE FORMAT:
For EACH issue found:
- **ORIGINAL:** "quote of problematic passage"
- **SUGGESTION:** "proposed fix"
- **REASON:** brief explanation (cite the French original for comparison)
- **SEVERITY:** A (must fix) / B (recommended) / C (cosmetic)

At the end: **Overall naturalness:** X/10, **Main problem patterns**, **What works well**

TEXT TO REVIEW:
PROMPT
)"
```

## Typical Issues by Language

### Czech
| Category | Example |
|----------|---------|
| **Galicisms** | "vzít si ženu" (= marry), "dítě domu", "dát pochopit" |
| **False friends** | "ceremonie" (CZ = formal ceremony, FR = fuss/okolky), "kostým" (CZ = suit/costume, FR = bathing outfit) |
| **Reflexive errors** | "kojila jsem se" (breastfed myself) |
| **Non-existent words** | "rukavičkuje se" (not real Czech) |
| **Word order** | "pak na tribuně jsem" (příklonka "jsem" must be 2nd) |
| **Preposition calques** | "za čelem" → "z čela" |
| **Semantic shifts** | "zimnice" (disease) for "frisson" (shiver), "vařila jsem" (cooking) for "je bouillais" (seething) |

### Ukrainian
| Category | Example |
|----------|---------|
| **Galicisms** | "взяти жінку" (= одружитися), "дати зрозуміти" |
| **Russianisms** | "потому що" → "тому що", "тоже" → "також", "нічого собі" → "жарт сказати" |
| **Case errors** | Wrong відмінок governance |
| **Aspect** | Imperfective/perfective confusion |
| **Calques** | Literal French constructions in Ukrainian word order |

### English
| Category | Example |
|----------|---------|
| **Gallicisms** | "make a promenade" → "go for a walk" |
| **Register** | Too formal/informal for context |
| **False friends** | "sympathetic" ≠ "sympathique", "actually" ≠ "actuellement" |

## Batch Sizing

- **3-5 entries per Gemini call** works well (enough context, not too long)
- Short entries (1-3 paragraphs): batch 4-5
- Long entries (10+ paragraphs): batch 2-3
- Very long entries: send individually
- **Add `sleep 5` between batches** to avoid rate limits

## Comment Format

All Gemini contributions use the `GEM` role code:

```markdown
%% YYYY-MM-DDThh:mm:ss GEM: "original" → "fix" — reason %%
```

## Review File Naming

```
.gemini-review-{date-range}-pass1.md    # Text-only review
.gemini-review-{date-range}-pass2.md    # With-comments review
```

For single-pass reviews (backward compat):
```
.gemini-review-{date-range}.md
```

## Quality Standards

- Apply severity A and B corrections automatically
- Severity C are suggestions saved in the review file only
- When Gemini suggests something dubious, do NOT apply it — save it in the review file only
- **Watch for self-confirmation bias** in Pass 2 — Gemini may praise its own prior GEM fixes instead of re-evaluating them. The "disregard previous GEM corrections" instruction in the Pass 2 prompt mitigates this.
- Focus on issues that affect meaning, grammar, and naturalness
- The goal is text that reads as if written by a native author, not translated from French
