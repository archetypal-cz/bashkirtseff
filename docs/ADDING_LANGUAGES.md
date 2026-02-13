# Adding a New Language

This guide covers the two independent language systems in the project and how to add a new language to either or both.

## Two Independent Systems

The project has **two separate language concerns** that are completely independent:

| System | Purpose | Affects |
|--------|---------|---------|
| **GUI Locale** | UI labels, buttons, navigation text | How the website *looks* |
| **Diary Translation** | Translated diary content | What the user *reads* |

A GUI locale can exist without any diary content (e.g., a Ukrainian speaker reading the Czech translation). A diary translation can exist without a dedicated GUI locale (it will use the closest available locale for UI text).

## System 1: GUI Locale (i18n)

GUI locales control all interface text: navigation, buttons, labels, tooltips, filter UI, etc.

### Files involved

| File | Purpose |
|------|---------|
| `src/frontend/src/i18n/locales/{code}.json` | Translation strings (295 keys) |
| `src/frontend/src/i18n/index.ts` | `SupportedLocale` type, locale registry |
| `src/frontend/src/i18n/astro.ts` | Server-side i18n (same type/registry) |

### Steps to add a GUI locale

1. **Copy an existing locale file** as a starting point:
   ```bash
   cp src/frontend/src/i18n/locales/en.json src/frontend/src/i18n/locales/de.json
   ```

2. **Translate all 295 keys** in the new JSON file.

3. **Register the locale** in `src/frontend/src/i18n/index.ts`:
   ```typescript
   // Add import
   import de from './locales/de.json';

   // Add to type
   export type SupportedLocale = 'cs' | 'fr' | 'en' | 'uk' | 'de';

   // Add to supported list
   export const SUPPORTED_LOCALES: SupportedLocale[] = ['cs', 'uk', 'en', 'fr', 'de'];

   // Add display name
   export const LOCALE_NAMES: Record<SupportedLocale, string> = {
     // ...existing...
     de: 'Deutsch'
   };

   // Add to messages
   const messages: Record<SupportedLocale, typeof cs> = { cs, uk, en, fr, de };

   // Add to localeToContentPath mapping
   // (only if the URL path differs from the ISO code)
   ```

4. **Mirror the changes** in `src/frontend/src/i18n/astro.ts` (same imports, type, messages).

5. **Verify completeness**:
   ```bash
   just i18n-diff
   ```
   This compares all locale files against `cs.json` (the reference) and reports missing keys.

### Checking locale completeness

```bash
# Show all missing keys across all locales
just i18n-diff

# Example output:
# de.json: 12 missing key(s)
#   - home.heroQuoteTranslation
#   - diary.notebook
#   ...
```

## System 2: Diary Translation Content

Diary translations are the actual translated diary entries that readers browse.

### Files involved

| File | Purpose |
|------|---------|
| `content/{code}/` | Translated diary entries by carnet |
| `src/frontend/src/lib/diary-lang-config.ts` | `DIARY_LANGUAGES` routing registry |
| `src/frontend/src/i18n/index.ts` | `activeTranslations` set in `getTranslationHref()` |

### Steps to add a diary translation

1. **Create the content directory**:
   ```bash
   mkdir -p content/de/001
   ```

2. **Add translated entry files** following the standard format (see `content/CLAUDE.md`). Each entry file has YAML frontmatter + paragraph clusters with translation comments.

3. **Enable the language route** in `src/frontend/src/lib/diary-lang-config.ts`:
   ```typescript
   export const DIARY_LANGUAGES: DiaryLanguageConfig[] = [
     // ...existing languages...
     {
       urlPath: 'de',          // URL: /de/001/1873-01-11
       contentPath: 'de',      // content/de/
       uiLocale: 'de',         // GUI locale to use (must be a SupportedLocale)
       dateLocale: 'de-DE',    // Intl.DateTimeFormat locale
       contentLangAttr: 'de',  // HTML lang attribute
       isTranslation: true,    // enables flip-to-original, progress tracking
     },
   ];
   ```

4. **Add to `activeTranslations`** in `src/frontend/src/i18n/index.ts`:
   ```typescript
   const activeTranslations = new Set(['cz', 'en', 'de']);
   ```
   This set controls the GUI language switcher's "Read translation" link. Without it, users who select German as their GUI language would be redirected to `/cz`.

5. **Pages are generated automatically** — `getStaticPaths()` in all `[lang]` pages iterates `DIARY_LANGUAGES` and discovers content via `getCarnets()` / `getCarnetEntries()`.

### Content directory structure

```
content/de/
├── 001/
│   ├── 1873-01-11.md
│   ├── 1873-01-12.md
│   └── ...
├── 002/
│   └── ...
├── CLAUDE.md          # Optional: language-specific notes
├── PROGRESS.md        # Optional: translation progress tracking
└── TranslationMemory.md  # Optional: translation memory/glossary
```

## URL path vs ISO locale code

There is an intentional split between URL paths and ISO locale codes:

| Language | ISO Code (GUI) | URL Path (Content) | Why different? |
|----------|---------------|-------------------|----------------|
| Czech | `cs` | `cz` | `/cz/` was established first; changing would break links |
| French | `fr` | `original` or `fr` | Original text lives at `/original/`, modernized at `/fr/` |
| English | `en` | `en` | Same |
| Ukrainian | `uk` | `uk` | Same |

The mapping functions `localeToContentPath()` and `contentPathToLocale()` in `src/frontend/src/i18n/index.ts` handle conversions. The only current exception is Czech (`cs` <-> `cz`).

When adding a new language, keep the URL path and ISO code the same unless there's a strong reason not to.

## Partial translations

A diary translation doesn't need to be complete to be enabled. The system handles partial content gracefully:

- Only carnets with actual entry files are listed
- The LanguageSwitcher on entry pages shows which languages are available for each entry
- Year/carnet index pages only show entries that exist

You can start with a single carnet and grow from there.

## Checklist

### Adding GUI locale only (no diary content)
- [ ] Create `src/frontend/src/i18n/locales/{code}.json`
- [ ] Register in `index.ts` and `astro.ts`
- [ ] Run `just i18n-diff` to verify completeness

### Adding diary translation (with existing GUI locale)
- [ ] Create `content/{code}/` with translated entries
- [ ] Add config to `DIARY_LANGUAGES` in `diary-lang-config.ts`
- [ ] Add to `activeTranslations` set in `i18n/index.ts`
- [ ] Verify with `just fe-dev` — browse to `/{code}/`

### Adding both
- [ ] Do both checklists above
- [ ] Ensure `uiLocale` in `DIARY_LANGUAGES` matches the GUI locale code
