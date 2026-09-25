import { ref, computed, onMounted } from 'vue';
import cs from './locales/cs.json';
import fr from './locales/fr.json';
import en from './locales/en.json';
import uk from './locales/uk.json';
import es from './locales/es.json';
import { withTrailingSlash } from '../lib/url';
import { resolveMessage, type MessageParams, type MessageTree } from './messages';

export type SupportedLocale = 'cs' | 'fr' | 'en' | 'uk' | 'es';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['cs', 'uk', 'en', 'fr', 'es'];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  cs: 'Čeština',
  uk: 'Українська',
  en: 'English',
  fr: 'Français',
  es: 'Español'
};

/**
 * LOCALE VS CONTENT PATH MAPPING
 *
 * IMPORTANT: There is an intentional discrepancy between UI locale codes and content URL paths:
 *
 * UI Locale (ISO 639-1 standard):
 * - 'cs' = Czech (stored in localStorage as 'ui-language')
 * - 'fr' = French
 * - 'en' = English
 *
 * Content/URL Path (geographic/country codes):
 * - '/cz/' = Czech diary content (CZ = Czech Republic)
 * - '/fr/' = French diary content
 * - '/en/' = English diary content
 *
 * This mapping exists because:
 * 1. Changing URLs from /cz/ to /cs/ would break existing links
 * 2. ISO standard uses 'cs' for Czech language
 * 3. Users commonly recognize 'CZ' as Czech Republic
 *
 * Use this helper to convert between the two systems:
 */
export function localeToContentPath(locale: SupportedLocale): string {
  // Map ISO locale codes to content directory paths
  const mapping: Record<SupportedLocale, string> = {
    cs: 'cz',  // Czech: cs (ISO) → cz (content path)
    uk: 'uk',  // Ukrainian: same
    en: 'en',  // English: same
    fr: 'fr',  // French: same
    es: 'es'   // Spanish: same
  };
  return mapping[locale] || locale;
}

export function contentPathToLocale(path: string): SupportedLocale {
  // Map content directory paths to ISO locale codes
  if (path === 'cz') return 'cs';
  if (SUPPORTED_LOCALES.includes(path as SupportedLocale)) {
    return path as SupportedLocale;
  }
  return 'cs'; // Default fallback
}

const messages: Record<SupportedLocale, MessageTree> = { cs, uk, en, fr, es };

function isSupported(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

/**
 * Which UI language an island renders in.
 *
 * Three sources, most specific first:
 *   1. the reader's stored preference (localStorage 'ui-language'), client-only;
 *   2. the page's own UI locale — the `pageLocale` an island is given as a prop,
 *      or `<html data-ui-locale>` written by BaseLayout;
 *   3. 'cs', the historical default.
 *
 * Hydration must reproduce the server HTML exactly: Vue repairs mismatched text
 * but NOT mismatched attributes, so an island that hydrated straight into the
 * stored locale kept Czech `title`/`aria-label`s forever (the "1 souvisejících
 * položek" tooltip on /en/). Each useI18n() caller therefore renders in the
 * server's locale (its `pageLocale` prop, else 'cs') until it has mounted, then
 * switches to the effective locale and re-renders, patching attributes too.
 */
const userLocale = ref<SupportedLocale | null>(null);
let _userLocaleRead = false;

function readUserLocale() {
  if (_userLocaleRead || typeof window === 'undefined') return;
  _userLocaleRead = true;
  try {
    const saved = localStorage.getItem('ui-language');
    if (isSupported(saved)) userLocale.value = saved;
  } catch {
    // storage blocked (private mode) — fall back to the page locale
  }
}

function documentLocale(): SupportedLocale | null {
  if (typeof document === 'undefined') return null;
  const value = document.documentElement.dataset.uiLocale;
  return isSupported(value) ? value : null;
}

export function setLocale(locale: SupportedLocale) {
  if (isSupported(locale)) {
    _userLocaleRead = true;
    userLocale.value = locale;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui-language', locale);
    }
  }
}

/** The locale the UI is shown in on this page (preference, else page locale). */
export function getLocale(): SupportedLocale {
  readUserLocale();
  return userLocale.value ?? documentLocale() ?? 'cs';
}

/**
 * Get the translation content path for the current UI locale.
 * Maps locale → content URL path, falling back to /original (the French source)
 * if the locale's translation pages don't exist yet — never to another
 * translation, which would send e.g. a Spanish reader into the Czech diary.
 *
 * If currentPath is provided (the current window.location.pathname),
 * the suffix after the lang prefix is preserved. E.g. if the user is
 * on /cz/1877/ and their locale is 'en', returns /en/1877/.
 */
export function getTranslationHref(locale: SupportedLocale, currentPath?: string): string {
  // Determine the base content path for this locale
  const contentPath = localeToContentPath(locale);
  // Active translation content paths — must mirror DIARY_LANGUAGES isTranslation entries
  const activeTranslations = new Set(['cz', 'en', 'uk', 'fr']);
  // PILOT es: uncomment when the first es carnet is conductor-approved (see content/es/PROGRESS.md) — add 'es' here together with the DIARY_LANGUAGES block
  // Staged locales fall back to the French SOURCE, not to another translation.
  const base = activeTranslations.has(contentPath) ? `/${contentPath}` : '/original';

  // If we have a current path on a diary page, preserve the suffix
  // but drop /glossary — the glossary is shared, nav should link to the diary
  if (currentPath) {
    const match = currentPath.match(/^\/(cz|original|en|uk|fr|es)(\/.*)?$/);
    if (match && match[2] && !match[2].startsWith('/glossary')) {
      return withTrailingSlash(`${base}${truncateSuffixToCarnet(match[2])}`);
    }
  }

  return `${base}/`;
}

/**
 * For entry-level diary paths (`/{carnet}/{entry}`), drop the entry segment so
 * a language switch lands on the carnet index instead of a possibly-untranslated
 * (404) entry page (M6). Carnet indexes exist for every language (union logic in
 * `[carnet]/index.astro`). Non-entry suffixes (year, carnet index, language home)
 * are preserved unchanged. Precise entry-level switching with availability checks
 * stays the job of the dedicated LanguageSwitcher.
 *
 * @param suffix Path after the language segment, leading-slash included (e.g. '/068/1877-01-07-09').
 */
function truncateSuffixToCarnet(suffix: string): string {
  // /{carnet}/{entry...} where carnet is a 3-digit (or 000-NN section) id and
  // there is a further entry segment after it.
  const entryMatch = suffix.match(/^\/(\d{3}(?:-\d+)?)\/[^/]+\/?$/);
  if (entryMatch) {
    return `/${entryMatch[1]}`;
  }
  return suffix;
}

/**
 * Get the original content path, preserving the current page suffix.
 * E.g. if on /cz/1877/, returns /original/1877/.
 * Without currentPath, returns /original.
 * Glossary paths are dropped — nav should link to the diary, not glossary variants.
 */
export function getOriginalHref(currentPath?: string): string {
  if (currentPath) {
    const match = currentPath.match(/^\/(cz|original|en|uk|fr|es)(\/.*)?$/);
    if (match && match[2] && !match[2].startsWith('/glossary')) {
      // Original exists for every entry, but truncating to the carnet keeps
      // parity with getTranslationHref and avoids surprises on section ids.
      return withTrailingSlash(`/original${truncateSuffixToCarnet(match[2])}`);
    }
  }
  return '/original/';
}

/**
 * Locale-aware glossary href (M3).
 *
 * Each language has its own glossary at `/{contentPath}/glossary`. Derive the
 * content-path prefix from the current diary path so a reader on `/cz/...` links
 * to the Czech glossary rather than the hardcoded `/glossary` → `/original/glossary`
 * redirect. Off a diary path, fall back to the original glossary.
 */
export function glossaryHref(currentPath?: string): string {
  if (currentPath) {
    const match = currentPath.match(/^\/(cz|original|en|uk|fr|es)(\/|$)/);
    if (match) {
      return `/${match[1]}/glossary/`;
    }
  }
  return '/original/glossary/';
}

/**
 * Localized href for a static chrome page (`about`, `marie`, `privacy`) (M3).
 *
 * These pages live at `/{uiLocale}/{page}` (e.g. `/cs/about`, `/en/marie`) — the
 * segment is the ISO UI locale, not the diary content path. Built for cs/en/fr/uk/es.
 */
export function pageHref(page: 'about' | 'marie' | 'privacy', locale: SupportedLocale): string {
  const loc = SUPPORTED_LOCALES.includes(locale) ? locale : 'cs';
  return `/${loc}/${page}/`;
}

// Composable for use in Vue components.
// `pageLocale` is the UI locale the server rendered this island in; pass it
// whenever the parent .astro page knows it, so the server HTML is already in
// the right language (no Czech flash before hydration).
export function useI18n(pageLocale?: SupportedLocale) {
  const serverLocale: SupportedLocale = isSupported(pageLocale) ? pageLocale : 'cs';
  const mounted = ref(false);

  onMounted(() => {
    readUserLocale();
    mounted.value = true;
  });

  const locale = computed<SupportedLocale>(() => {
    if (!mounted.value) return serverLocale;
    return userLocale.value ?? (isSupported(pageLocale) ? pageLocale : null) ?? documentLocale() ?? serverLocale;
  });

  function t(key: string, params?: MessageParams): string {
    return resolveMessage(messages[locale.value] || messages.cs, key, locale.value, params);
  }

  return {
    t,
    locale,
    setLocale
  };
}
