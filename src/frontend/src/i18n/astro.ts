// i18n utilities for Astro components (server-side rendering)
import cs from './locales/cs.json';
import fr from './locales/fr.json';
import en from './locales/en.json';
import uk from './locales/uk.json';
import es from './locales/es.json';
import { resolveMessage, type MessageParams, type MessageTree } from './messages';

export type SupportedLocale = 'cs' | 'fr' | 'en' | 'uk' | 'es';

const messages: Record<SupportedLocale, MessageTree> = { cs, fr, en, uk, es };

// Create a translation function for a specific locale
// Use this in pages with a [lang] parameter: const t = createT(lang as SupportedLocale)
export function createT(locale: SupportedLocale) {
  const loc: SupportedLocale = messages[locale] ? locale : 'cs';
  const localeMessages = messages[loc];

  return function t(key: string, params?: MessageParams): string {
    return resolveMessage(localeMessages, key, loc, params);
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
// Re-export localeToContentPath / contentPathToLocale for Astro server-side use.
// Canonical implementations live in i18n/index.ts; they are mirrored here so
// .astro pages don't have to import the Vue-dependent module.
//
// Pages must use this rather than an inline `{ cs: 'cz', … }` map: an inline map
// that forgets a locale silently falls through to some other language's content,
// which is how the Spanish home page came to render Czech diary text.
export function localeToContentPath(locale: SupportedLocale): string {
  return locale === 'cs' ? 'cz' : locale;
}

export function contentPathToLocale(path: string): SupportedLocale {
  if (path === 'cz') return 'cs';
  const supported: SupportedLocale[] = ['cs', 'fr', 'en', 'uk', 'es'];
  if (supported.includes(path as SupportedLocale)) return path as SupportedLocale;
  return 'cs';
}

export const t = createT('cs');
