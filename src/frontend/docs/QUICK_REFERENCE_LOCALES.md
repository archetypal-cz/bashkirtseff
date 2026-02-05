# Quick Reference: Locale Codes

## TL;DR

- **UI Language**: Use `'cs'` (Czech), `'fr'` (French), `'en'` (English)
- **URL Paths**: Use `'/cz/'` (Czech), `'/fr/'` (French), `'/en/'` (English)
- **Never change URL paths** - they're part of the public API

## Quick Decision Tree

### Are you working with...

**localStorage / i18n translations?**
→ Use UI locale: `'cs'`, `'fr'`, `'en'`

**URLs / file paths / content loading?**
→ Use content path: `'cz'`, `'fr'`, `'en'`, `'_original'`

**Need to convert between them?**
```typescript
import { localeToContentPath, contentPathToLocale } from '@/i18n';

localeToContentPath('cs')  // → 'cz'
contentPathToLocale('cz')  // → 'cs'
```

## Examples

### ✅ Correct

```typescript
// Storing UI language preference
localStorage.setItem('ui-language', 'cs');

// Loading content
const entry = getEntry('02', '1873-08-11', 'cz');

// Building URL
const url = `/cz/02/1873-08-11`;

// Displaying language label
if (lang === 'cz') return 'CZ';
```

### ❌ Incorrect

```typescript
// Don't use ISO code in URLs
const url = `/cs/02/1873-08-11`; // WRONG - should be /cz/

// Don't use content path in localStorage
localStorage.setItem('ui-language', 'cz'); // WRONG - should be 'cs'

// Don't mix them up
const entry = getEntry('02', '1873-08-11', 'cs'); // WRONG - should be 'cz'
```

## Component Props

When passing language to components:

```typescript
// LanguageSwitcher: uses content paths
<LanguageSwitcher currentLanguage="cz" availableLanguages={['_original', 'cz']} />

// UI components: depends on context
// - If related to content/URLs: use content path ('cz')
// - If related to translations: use locale ('cs')
```

## File Locations

**UI Locale Files:**
- `/src/i18n/index.ts` - Main i18n system
- `/src/i18n/astro.ts` - Astro i18n helpers
- `/src/i18n/locales/cs.json` - Czech translations (note: 'cs' not 'cz')
- `/src/stores/preferences.ts` - User preferences

**Content Path Files:**
- `/src/lib/content.ts` - Content loading (uses 'cz')
- `/src/pages/cz/[book]/[entry].astro` - Czech content pages
- `/src/components/reading/LanguageSwitcher.vue` - Language switcher

## Full Documentation

For complete details, see: [LOCALE_MAPPING.md](./LOCALE_MAPPING.md)
