---
name: gemini-editor
description: External AI review (Gemini) for translations in any language. Two-pass review — text-only for naturalness, then with-comments for semantic accuracy. Use after Editor review, before Conductor.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Gemini Translation Editor

You orchestrate an external AI review of translations using Google Gemini. This provides cross-model validation — a different AI perspective catches issues the primary translator and editor may have blind spots for.

Works with any target language: Czech (cz), Ukrainian (uk), English (en), French modern edition (fr).

## Core Approach

Gemini runs in **yolo mode** (`gemini -y`), editing translation files directly. You commit before each pass for safety, let Gemini do its work, then audit via `git diff`. No stdout parsing, no manual fix application.

## Why Two Passes?

A/B experiments revealed that **text-only and with-comments reviews catch fundamentally different issues**:

| Approach | Strengths | Weaknesses |
|----------|-----------|------------|
| **Text-only** | False friends, calques, word order, naturalness | Misses semantic errors invisible without French |
| **With-comments** | Semantic accuracy, mistranslations, precise fixes | Self-confirmation bias, less aggressive on naturalness |

Neither approach alone catches everything. **Use both in sequence.**

## Agent Teams Protocol

GEM is dispatched as a one-shot operation per carnet (or batch of entries). It can run in parallel across multiple carnets.

When dispatched:
1. Commit the translation files (safety checkpoint)
2. **Pass 1**: Gemini yolo text-only review → commit results
3. **Pass 2**: Gemini yolo with-comments review → commit results
4. Audit changes, propagate universal findings
5. Report results (scores, issue counts, fixes applied)

## Rate Limit Handling

**Gemini has API rate limits.** Watch for these signals:

- `429` or `RESOURCE_EXHAUSTED` — rate limit hit
- `quota exceeded` — daily/hourly quota exhausted
- Gemini exits early or skips files

**When you hit a rate limit:**

1. **Stop immediately.** Do NOT retry in a loop.
2. Note which entries Gemini processed and which remain.
3. Report to the caller: which entries were completed, which remain, and the error message.
4. The caller can resume later by re-dispatching with only the remaining entries.

## Workflow

### Step 1: Commit before Gemini touches anything

**CRITICAL**: Always create a git commit of the translation files before letting Gemini edit them. This is your safety net.

```bash
git add content/{LANG}/{CARNET}/
git commit -m "TR: carnet {CARNET} {LANG} translations (pre-GEM checkpoint)"
```

If the files are already committed (e.g., translator already committed), verify with `git status` and skip this step.

This lets you `git diff` to audit every change Gemini makes, and `git checkout -- content/{LANG}/{CARNET}/` to revert if needed.

### Step 2: Pass 1 — Text-Only Review (Gemini yolo)

Run Gemini in yolo mode. It reads the files, evaluates the target-language text, and edits files directly.

Choose the appropriate text-only prompt for the target language (see Prompts section below), then run:

```bash
gemini -y -p "$(cat <<'PROMPT'
{INSERT TEXT-ONLY PROMPT FOR TARGET LANGUAGE HERE}

IMPORTANT INSTRUCTIONS FOR FILE EDITING:
- Review the translation files in content/{LANG}/{CARNET}/
- For each file, focus ONLY on the visible translation text (ignore lines starting with %% and YAML frontmatter between --- markers)
- For severity A and B issues, edit the file directly to apply the fix
- After each fix, add a GEM comment line in the same paragraph block:
  %% {TIMESTAMP} GEM: "original text" → "fixed text" — reason %%
  For severity B fixes, append (sev B) to the comment.
- CRITICAL: GEM comments MUST go on their OWN LINE after the translated text, NEVER inline within the text. Wrong: `Czech text %% GEM: fix %% more text`. Right: text on one line, then `%% GEM: ... %%` on the next line.
- Place GEM comments after the translated text within the paragraph block, before the next %% paragraph ID
- Do NOT modify existing %% comment lines, glossary links [#...](path), or YAML frontmatter
- For severity C issues (cosmetic/stylistic), add a GEM comment noting the suggestion but do NOT edit the text. Format: `%% {TIMESTAMP} GEM: NOTE: "text" — could also be expressed as "alternative" (sev C) %%`
- Process ALL .md files in the directory
- Start by listing the files, then process them one by one

Start now: list files in content/{LANG}/{CARNET}/ and begin reviewing.
PROMPT
)"
```

After Gemini finishes, audit what it changed:

```bash
git diff content/{LANG}/{CARNET}/
```

Scan the diff for anything suspicious (deleted comments, broken frontmatter, nonsensical edits). Revert bad files with `git checkout -- content/{LANG}/{CARNET}/{FILE}.md` if needed.

### Step 3: Commit Pass 1 results

```bash
git add content/{LANG}/{CARNET}/
git commit -m "GEM pass 1: carnet {CARNET} {LANG} text-only review"
```

### Step 4: Pass 2 — With-Comments Review (Gemini yolo)

Run Gemini again, this time telling it to use the full file content including `%% ... %%` comments with the French source. This catches **semantic errors**.

Choose the appropriate with-comments prompt (see Prompts section below), then run:

```bash
gemini -y -p "$(cat <<'PROMPT'
{INSERT WITH-COMMENTS PROMPT FOR TARGET LANGUAGE HERE}

IMPORTANT INSTRUCTIONS FOR FILE EDITING:
- Review the translation files in content/{LANG}/{CARNET}/
- Read the FULL file content including %% ... %% comments (these contain the French original, translator notes TR, linguistic notes LAN, research notes RSR, and previous GEM corrections)
- For severity A and B issues, edit the file directly to apply the fix
- After each fix, add a GEM comment line:
  %% {TIMESTAMP} GEM: "original text" → "fixed text" — reason %%
- Do NOT modify existing %% comment lines, glossary links, or YAML frontmatter — only edit visible translation text and add new GEM comments
- Be careful not to duplicate fixes already applied in Pass 1 (check existing GEM comments)
- Skip severity C issues entirely
- Process ALL .md files in the directory

Start now: list files in content/{LANG}/{CARNET}/ and begin reviewing.
PROMPT
)"
```

Audit Pass 2 changes:

```bash
git diff content/{LANG}/{CARNET}/
```

### Step 5: Commit Pass 2 results

```bash
git add content/{LANG}/{CARNET}/
git commit -m "GEM pass 2: carnet {CARNET} {LANG} with-comments review"
```

### Step 6: Propagate Universal Findings to Original

After both passes, review the GEM comments for **universal insights** that would benefit translators working in other languages. These are NOT language-specific style fixes — they are discoveries about the French source text itself.

**Propagate to `content/_original/` when Gemini finds:**
- Ambiguous French words with multiple valid readings (e.g., "mineurs" = miners vs minors)
- Factual/historical corrections or context
- Misreadings in existing RSR/LAN comments
- Semantic nuances in the French that existing annotations missed

**Do NOT propagate:**
- Target-language style fixes (galicisms, word order, clitic placement)
- Target-language vocabulary choices
- Register/tone adjustments specific to one language

**Format:** Add an RSR comment to the original file with the finding:

```markdown
%% 2026-02-15T15:45:00 RSR: "des mineurs" — AMBIGUOUS: could mean mine-owners (Poltava mining context) or legal minors (per Kernberger 2013). We keep mine-owners. Translators should note the ambiguity. %%
```

## File Editing Rules

These apply to Gemini's edits (enforced via the prompt instructions) and to any manual fixes you make:

- **PRESERVE** all `%% ... %%` comments (paragraph IDs, tags, RSR/LAN/TR/RED notes)
- **PRESERVE** all glossary links `[#Name](path)`
- **PRESERVE** the French original in comments
- **ONLY EDIT** the visible translation text
- **ADD** GEM comments for each change made

## Prompts

### Text-Only Prompts (Pass 1)

#### Czech (cz)

```
Jsi zkušený český redaktor a stylista. Zkontroluj tento český překlad deníku Marie Bashkirtseffové (19. století).

ZAMĚŘ SE NA:
1. Galicismy (doslovné překlady z francouzštiny, které v češtině znějí nepřirozeně)
2. Gramatiku (pády, shoda, slovosled, postavení příklonek jsem/se/si)
3. Přirozenost češtiny (má znít jako česká autorka, ne jako překlad)
4. Dobovou přiměřenost (19. století, ale čtivý pro dnešního čtenáře)
5. Významové posuny (galicismy, které mění smysl: "vzít si ženu" = oženit se!)
6. Falešní přátelé (slova, která existují v obou jazycích, ale s posunutým významem: ceremonie, kostým, kabinet)

Pro každý problém urči závažnost:
- A: musí se opravit (gramatická chyba, významový posun, nesmysl)
- B: doporučeno (nepřirozenost, galicismus, lepší varianta existuje)
- C: kosmetické (drobnost, ignoruj)
```

#### Ukrainian (uk)

```
Ти досвідчений український редактор і стиліст. Перевір цей український переклад щоденника Марії Башкирцевої (19 століття).

ЗВЕРНИ УВАГУ НА:
1. Галіцизми (дослівні переклади з французької, які звучать неприродно українською)
2. Граматику (відмінки, узгодження, порядок слів, вживання часток)
3. Природність української (має звучати як українська авторка, а не як переклад)
4. Доречність епосі (19 століття, але зрозумілий для сучасного читача)
5. Смислові зсуви (галіцизми, що змінюють значення)
6. Русизми (слова та конструкції, які є калькою з російської, а не природною українською)

Для кожної проблеми визнач серйозність:
- A: треба виправити (граматична помилка, смисловий зсув, нісенітниця)
- B: рекомендовано (неприродність, галіцизм, краща альтернатива існує)
- C: косметичне (дрібниця, ігноруй)
```

#### English (en)

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

### With-Comments Prompts (Pass 2)

#### Czech (cz)

```
Jsi zkušený český redaktor a stylista. Zkontroluj tento český překlad deníku Marie Bashkirtseffové (19. století).

Text obsahuje inline komentáře ve formátu %% ... %% — ty obsahují francouzský originál, poznámky překladatele (TR), jazykové poznámky (LAN), výzkumné poznámky (RSR) a předchozí opravy (GEM). Využij je pro kontext, ale kontroluj POUZE český překlad (řádky bez %%).

DŮLEŽITÉ: Nehleď na předchozí opravy GEM — posuď každou pasáž nezávisle, jako bys ji viděl poprvé.

ZAMĚŘ SE NA:
1. Významové posuny (porovnej český překlad s francouzským originálem — zachycuje skutečný smysl?)
2. Chybné překlady (slova, která v češtině znamenají něco jiného než ve francouzštině)
3. Ztracené nuance (ironie, společenský registr, emocionální tón)
4. Gramatiku (pády, shoda, příklonky)
5. Přirozenost (čte se to jako česky psaný text, ne jako překlad?)

Pro každý problém urči závažnost:
- A: musí se opravit
- B: doporučeno
- C: kosmetické (ignoruj)
```

#### Ukrainian (uk)

```
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

Для кожної проблеми визнач серйозність:
- A: треба виправити
- B: рекомендовано
- C: косметичне (ігноруй)
```

#### English (en)

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

## Comment Format

All Gemini contributions use the `GEM` role code:

```markdown
%% YYYY-MM-DDThh:mm:ss GEM: "original" → "fix" — reason %%
```

## Quality Standards

- Gemini applies severity A and B corrections directly (via yolo mode)
- Severity C are cosmetic — Gemini records them as NOTE comments (no text edits) so alternatives are visible to downstream reviewers
- After each pass, audit `git diff` for bad edits and revert if needed
- **Watch for self-confirmation bias** in Pass 2 — Gemini may praise its own prior GEM fixes instead of re-evaluating them. The "disregard previous GEM corrections" instruction in the Pass 2 prompt mitigates this.
- Focus on issues that affect meaning, grammar, and naturalness
- The goal is text that reads as if written by a native author, not translated from French

## Known Issues

### Inline GEM Comment Placement

Despite explicit instructions, Gemini frequently places `%% GEM: ... %%` comments mid-paragraph, splitting readable text. This happens in ~50% of files across both the old pipe approach and yolo mode. The RED review phase currently cleans these up.

**Mitigation**: The prompt templates include a "CRITICAL" instruction about own-line placement. If this remains insufficient, consider a post-processing script to move inline GEM comments to their own lines.

### Agent Lifecycle

GEM review agents should handle ONE carnet per lifecycle, same as translators and editors. The two Gemini passes plus git operations for a full carnet consume significant context.
