# uk/ — Ukrainian Translations

This directory contains Ukrainian translations of Marie Bashkirtseff's diary.

## Structure

```
uk/
├── CLAUDE.md            # This file
├── PROGRESS.md          # Overall Ukrainian translation status
├── TranslationMemory.md # Established terminology (to create)
│
├── 000/                 # Translated preface
│   └── README.md        # Carnet progress
├── 001/-106/            # Translated entries
│   └── README.md        # Per-carnet progress
│
└── _archive/            # Old translation versions
```

## Special Significance

Marie Bashkirtseff was born in Gavrontsi (Гавронці), near Poltava, Ukraine. Ukrainian translation has special cultural significance as it returns her words to her homeland.

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

**Frontmatter flag**: `gemini_reviewed: true`

### 3. Editor Review (RED)

- Check naturalness in Ukrainian
- Verify accuracy against French
- Flag awkward phrasing

**Frontmatter flag**: `editor_approved: true`

### 4. Conductor Approval (CON)

- Final literary quality check
- Ensure Marie's voice preserved
- Approve or request revision

**Frontmatter flag**: `conductor_approved: true`

## Translation File Format

Ukrainian translation files mirror the French originals:

```markdown
---
date: 1873-01-11
carnet: "001"
source_hash: "a1b2c3d4e5f6g7h8"
translation_complete: false
---

%% 001.0001 %%
%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%
%% Samedi 11 janvier 1873. Il fait un temps superbe... %%
Субота, 11 січня 1873. Чудова погода...
%% 2026-02-04T12:00:00 TR: Translation note... %%
```

## Comment Types

| Code | Role       | Purpose                    |
| ---- | ---------- | -------------------------- |
| TR   | Translator | Translation decisions      |
| GEM  | Gemini     | External AI review notes   |
| RED  | Editor     | Quality notes, suggestions |
| CON  | Conductor  | Approval, final notes      |

## Style Considerations

- Marie wrote in French, but her Ukrainian heritage shows in themes
- Place names from Ukraine should use Ukrainian transliteration
- Family names: consider Ukrainian forms where appropriate
- Maintain 19th century literary register

## Russianisms Checklist

<!-- Teamcouch update 2026-02-17: Baked from spawn prompt into language CLAUDE.md
     Evidence: reports 2026-02-16-uk-006-008, 2026-02-17-uk-009-011, 2026-02-17-uk-012-014
     Pattern: 3 waves, 199 entries, 0 overt russianisms with explicit checklist -->

These Russian-influenced forms slip into Ukrainian translations. Use the Ukrainian equivalent instead:

| Avoid (Russian-influenced) | Use (Ukrainian) | Notes |
|---------------------------|-----------------|-------|
| потому що | тому що | conjunction |
| вообще | взагалі, загалом | adverb |
| хотя | хоча | conjunction |
| тоже | також, теж | adverb |
| конечно | звичайно, звісно | adverb |
| кажется | здається | verb |
| пока | поки | conjunction |
| если | якщо | conjunction |
| здесь | тут | adverb |
| сейчас | зараз | adverb |
| абсолютно | цілком, зовсім | calque — technically Ukrainian but Russian-influenced usage |
| факт у тому | річ у тім | calque — Russian pattern |
| Russian-style participles (-ущий, -ющий) | relative clauses (який/яка/яке + verb) | syntax |
| -ой genitive endings on surnames | -ої | morphology (e.g., Ростузовой → Ростузової) |

**Additional Ukrainian traps:**
- Aspect confusion between perfective/imperfective
- Russian-influenced verb prefixes (з-/с- where Ukrainian uses ви-, від-, роз-)
- Gender of borrowed words may differ from Russian usage

## Subtle Russianisms (for OPS reviewers)

Beyond the explicit checklist above, watch for **subtle calques** — technically Ukrainian words used in Russian-influenced patterns. These require native-level Ukrainian sensitivity:

- "абсолютно" → "цілком/зовсім" (Russian usage pattern)
- "факт у тому" → "річ у тім" (Russian construction)
- Genitive -ой instead of Ukrainian -ої on surnames
- Russian-style participles instead of relative clauses

## Related Documentation

- `/src/_original/CLAUDE.md` - French source materials
- `/docs/INFRASTRUCTURE.md` - Progress tracking system
