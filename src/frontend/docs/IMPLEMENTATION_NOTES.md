# Implementation Notes: Locale Code Standardization

## Date: 2026-01-31

## Problem Statement

The application had an inconsistency between locale codes:
- i18n system uses **'cs'** (ISO 639-1 standard) for Czech
- URL paths use **'/cz/'** (country code) for Czech content

This could cause confusion when:
- Converting between UI language and content paths
- Building URLs from locale settings
- Loading content based on user's language preference

## Decision

**Keep both systems** but make the mapping explicit and well-documented.

### Rationale

1. **URL Stability**: Changing `/cz/` to `/cs/` would break existing links, bookmarks, and search engine indexes
2. **Standards Compliance**: ISO 639-1 uses 'cs' for Czech language
3. **User Familiarity**: 'CZ' (Czech Republic) is widely recognized
4. **Technical Debt**: Minimal - the mapping is straightforward and can be easily managed

## Implementation

### 1. Helper Functions Added

Location: `frontend/src/i18n/index.ts`

```typescript
export function localeToContentPath(locale: SupportedLocale): string {
  return locale === 'cs' ? 'cz' : locale;
}

export function contentPathToLocale(path: string): SupportedLocale {
  return path === 'cz' ? 'cs' : path as SupportedLocale;
}
```

### 2. Documentation Added

- **LOCALE_MAPPING.md**: Comprehensive explanation of the dual system
- **QUICK_REFERENCE_LOCALES.md**: Quick decision tree and examples
- **IMPLEMENTATION_NOTES.md**: This file - explains the decision and implementation
- **Tests**: `src/i18n/__tests__/locale-mapping.test.ts` - 13 tests, all passing

### 3. Code Comments Added

Comments added to clarify the mapping in:
- `src/i18n/index.ts` - Main documentation block
- `src/lib/content.ts` - Header comment and function documentation
- `src/components/reading/LanguageSwitcher.vue` - Component-level documentation
- `frontend/CLAUDE.md` - Quick reference for AI assistance

### 4. Code Review

Verified that existing code correctly handles the mapping:
- ✅ `LanguageSwitcher.vue` already uses 'cz' correctly (line 56)
- ✅ `content.ts` uses 'cz' for directory paths
- ✅ All Astro pages use '/cz/' in URLs
- ✅ localStorage stores 'cs' as 'ui-language'
- ✅ i18n locales use 'cs' for Czech translations

## Files Modified

1. `frontend/src/i18n/index.ts`
   - Added helper functions
   - Added comprehensive documentation block

2. `frontend/src/lib/content.ts`
   - Added header comment explaining the mapping
   - Added function documentation for `getAvailableLanguages()`

3. `frontend/src/components/reading/LanguageSwitcher.vue`
   - Added component-level documentation
   - Added inline comment explaining the mapping

4. `frontend/CLAUDE.md`
   - Added Language Code Mapping section with quick reference

## Files Created

1. `frontend/docs/LOCALE_MAPPING.md`
   - Complete explanation of the two systems
   - When to use each system
   - Conversion helpers
   - Common patterns
   - Testing checklist

2. `frontend/docs/QUICK_REFERENCE_LOCALES.md`
   - TL;DR quick reference
   - Decision tree
   - Correct/incorrect examples
   - File locations

3. `frontend/docs/IMPLEMENTATION_NOTES.md`
   - This file

4. `frontend/src/i18n/__tests__/locale-mapping.test.ts`
   - 13 comprehensive tests
   - All tests passing

## Testing

```bash
cd frontend
npx vitest run src/i18n/__tests__/locale-mapping.test.ts
```

Results: ✅ 13/13 tests passing

## Usage Examples

### Example 1: Loading Content Based on UI Language

```typescript
import { getLocale, localeToContentPath } from '@/i18n';
import { getEntry } from '@/lib/content';

// User has UI set to Czech
const uiLocale = getLocale(); // 'cs'
const contentPath = localeToContentPath(uiLocale); // 'cz'
const entry = getEntry('02', '1873-08-11', contentPath);
```

### Example 2: Building URLs

```typescript
import { localeToContentPath } from '@/i18n';

const locale = 'cs'; // From user preference
const path = localeToContentPath(locale); // 'cz'
const url = `/${path}/02/1873-08-11`; // '/cz/02/1873-08-11'
```

### Example 3: Parsing URLs

```typescript
import { contentPathToLocale } from '@/i18n';

// URL: /cz/02/1873-08-11
const pathParts = location.pathname.split('/');
const contentPath = pathParts[1]; // 'cz'
const locale = contentPathToLocale(contentPath); // 'cs'

// Now can load UI translations for 'cs'
```

## Future Considerations

### If Standards Compliance Becomes Critical

If we need to fully comply with ISO 639-1 in URLs:

1. **Add URL redirects**: `/cs/` → `/cz/` (301 permanent)
2. **Support both paths**: Accept both `/cs/` and `/cz/` in routing
3. **Canonical URLs**: Set canonical link to `/cz/` version
4. **Update sitemap**: Use `/cz/` URLs
5. **Inform search engines**: Submit updated sitemap

This would maintain backward compatibility while moving towards standards.

### If New Languages Are Added

For new languages, follow the pattern:
1. Add locale to `SupportedLocale` type
2. Create locale file in `src/i18n/locales/`
3. If content path differs from locale, update helper functions
4. Add content directory in `../src/`
5. Add Astro pages in `src/pages/{lang}/`

## Conclusion

The dual locale/content-path system is now:
- ✅ Fully documented
- ✅ Properly tested
- ✅ Easy to use with helper functions
- ✅ Backward compatible
- ✅ Standards compliant (where possible)

The mapping is intentional, not accidental, and serves both technical and user-facing needs.
