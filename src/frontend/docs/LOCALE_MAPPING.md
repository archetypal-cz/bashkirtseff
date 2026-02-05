# Locale vs Content Path Mapping

## Overview

The application uses two different code systems for language/locale management:

1. **UI Locale Codes** - ISO 639-1 standard language codes
2. **Content Path Codes** - URL paths and directory names for diary content

## The Mapping

| Language | UI Locale Code | Content Path Code | URL Example |
|----------|---------------|-------------------|-------------|
| Czech    | `cs`          | `cz`              | `/cz/02/1873-08-11` |
| French   | `fr`          | `fr`              | `/fr/02/1873-08-11` |
| English  | `en`          | `en`              | `/en/02/1873-08-11` |
| Original | N/A           | `_original`       | `/original/02/1873-08-11` |

## Why This Discrepancy?

The difference between `cs` (locale) and `cz` (content path) exists for these reasons:

1. **URL Stability**: Changing URLs from `/cz/` to `/cs/` would break existing links and bookmarks
2. **ISO Standards**: ISO 639-1 uses `cs` for Czech language
3. **User Recognition**: Most users recognize `CZ` as Czech Republic (ISO 3166-1 country code)
4. **Historical Reasons**: The project started with `cz` in URLs before full i18n was implemented

## Where Each System Is Used

### UI Locale Codes (`cs`, `fr`, `en`)

Used for:
- `localStorage` key `ui-language` (stores user's interface language preference)
- i18n translation system (`src/i18n/`)
- Vue component props for UI language
- Type: `SupportedLocale` from `src/i18n/index.ts`

**Files that use UI locale codes:**
- `frontend/src/i18n/index.ts`
- `frontend/src/i18n/astro.ts`
- `frontend/src/stores/preferences.ts`
- `frontend/src/pages/home/[lang].astro` (UI paths like `/home/cs`)

### Content Path Codes (`cz`, `fr`, `en`, `_original`)

Used for:
- URL paths to diary entries (e.g., `/cz/02/1873-08-11`)
- Directory structure in content repository (`../src/cz/`, `../src/_original/`)
- Content loading functions in `src/lib/content.ts`
- Database references (paragraph IDs are language-agnostic, but context may use paths)

**Files that use content path codes:**
- `frontend/src/lib/content.ts`
- `frontend/src/components/reading/LanguageSwitcher.vue`
- `frontend/src/pages/cz/[book]/[entry].astro`
- All Astro pages under `/src/pages/cz/`, `/src/pages/original/`

## Conversion Helpers

Use these functions from `src/i18n/index.ts` to convert between systems:

```typescript
import { localeToContentPath, contentPathToLocale } from '@/i18n';

// UI locale → Content path
localeToContentPath('cs')  // returns 'cz'
localeToContentPath('fr')  // returns 'fr'
localeToContentPath('en')  // returns 'en'

// Content path → UI locale
contentPathToLocale('cz')        // returns 'cs'
contentPathToLocale('fr')        // returns 'fr'
contentPathToLocale('_original') // returns 'fr' (original is French)
```

## Common Patterns

### Pattern 1: Loading Content Based on UI Language

```typescript
import { getLocale, localeToContentPath } from '@/i18n';
import { getEntry } from '@/lib/content';

// User has UI set to 'cs' (Czech)
const uiLocale = getLocale(); // 'cs'
const contentPath = localeToContentPath(uiLocale); // 'cz'
const entry = getEntry('02', '1873-08-11', contentPath); // loads from cz/
```

### Pattern 2: Building URLs from Content Path

```typescript
import { contentPathToLocale } from '@/i18n';

const currentContentLang = 'cz'; // from URL or getAvailableLanguages()
const locale = contentPathToLocale(currentContentLang); // 'cs'

// Build URL
const url = `/${currentContentLang}/02/1873-08-11`; // '/cz/02/1873-08-11'
```

### Pattern 3: Language Switcher

The LanguageSwitcher component receives content paths:

```vue
<LanguageSwitcher
  currentLanguage="cz"
  availableLanguages={['_original', 'cz']}
  book="02"
  entryDate="1873-08-11"
/>
```

It displays labels correctly:
- `cz` → displays as "CZ"
- `_original` → displays as "Orig"

## Testing Checklist

When working with language codes, verify:

- [ ] URLs use content paths (`/cz/`, not `/cs/`)
- [ ] localStorage uses UI locale (`'ui-language': 'cs'`)
- [ ] Content loading functions receive content paths (`'cz'`)
- [ ] i18n functions receive UI locales (`'cs'`)
- [ ] Language switcher preserves scroll position across language changes
- [ ] Breadcrumbs and navigation links use content paths

## Migration Notes

If we ever need to standardize on ISO codes:

1. **DO NOT change URL paths** - this would break all existing links
2. Instead, consider adding redirects from `/cs/` to `/cz/`
3. Update internal code to use ISO codes everywhere except URLs
4. Use a routing layer to map `cs` requests to `cz` content

For now, the dual system works well and is clearly documented.

## Related Files

- `frontend/src/i18n/index.ts` - UI locale system
- `frontend/src/lib/content.ts` - Content loading with path codes
- `frontend/src/components/reading/LanguageSwitcher.vue` - Handles both systems
