// i18n utilities for Astro components (server-side rendering)
import cs from './locales/cs.json';
import fr from './locales/fr.json';
import en from './locales/en.json';
import uk from './locales/uk.json';

export type SupportedLocale = 'cs' | 'fr' | 'en' | 'uk';

const messages: Record<SupportedLocale, typeof cs> = { cs, fr, en, uk };

// Get nested value from object by dot-separated path
function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split('.');
  let value: any = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key if not found
    }
  }
  return typeof value === 'string' ? value : path;
}

// Replace placeholders like {year} or {book} in translation strings
function replacePlaceholders(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

// Create a translation function for a specific locale
// Use this in pages with a [lang] parameter: const t = createT(lang as SupportedLocale)
export function createT(locale: SupportedLocale) {
  const localeMessages = messages[locale] || messages.cs;

  return function t(key: string, params?: Record<string, string | number>): string {
    const value = getNestedValue(localeMessages, key);
    return replacePlaceholders(value, params);
  };
}

// Default translation function for server-side rendering
//
// SSR LIMITATION: This always returns Czech translations for static pages.
// Pages without a [lang] parameter (like /about.astro, /marie.astro) will render
// in Czech on the server. When the client hydrates, Vue components (Header, LocaleSwitcher)
// will use the user's locale from localStorage, which may differ.
//
// This is acceptable for an MVP because:
// 1. Static pages get correct translations after client hydration
// 2. Pages with [lang] routes (like /home/[lang].astro) correctly use createT(lang)
// 3. The user can reload the page after changing locale if they need server-rendered content
// 4. Most UI interactions happen on the client side anyway
//
// For pages that need locale-aware SSR, use the [lang] route pattern and createT(lang).
export const t = createT('cs');
