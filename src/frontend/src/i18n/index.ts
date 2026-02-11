import { ref, computed, onMounted } from 'vue';
import cs from './locales/cs.json';
import fr from './locales/fr.json';
import en from './locales/en.json';
import uk from './locales/uk.json';

export type SupportedLocale = 'cs' | 'fr' | 'en' | 'uk';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['cs', 'uk', 'en', 'fr'];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  cs: 'Čeština',
  uk: 'Українська',
  en: 'English',
  fr: 'Français'
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
    fr: 'fr'   // French: same
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

const messages: Record<SupportedLocale, typeof cs> = { cs, uk, en, fr };

// Reactive locale state — defaults to 'cs' to match SSR output.
// The actual user preference is loaded after hydration via initLocaleFromStorage().
const currentLocale = ref<SupportedLocale>('cs');
let _localeInitialized = false;

/**
 * Read the user's locale preference from localStorage.
 *
 * Deferred to a macrotask (setTimeout) so it runs AFTER all Astro islands
 * have finished hydrating. Astro islands are separate Vue apps sharing this
 * module — if one island's onMounted changes currentLocale before another
 * island hydrates, Vue detects a mismatch between SSR HTML (Czech) and the
 * client render (user's saved locale).
 */
function initLocaleFromStorage() {
  if (_localeInitialized || typeof window === 'undefined') return;
  _localeInitialized = true;
  const saved = localStorage.getItem('ui-language') as SupportedLocale;
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    currentLocale.value = saved;
  }
}

function scheduleLocaleInit() {
  if (_localeInitialized) return;
  // setTimeout defers to the next macrotask, after all pending island hydrations
  setTimeout(initLocaleFromStorage, 0);
}

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

export function setLocale(locale: SupportedLocale) {
  if (SUPPORTED_LOCALES.includes(locale)) {
    currentLocale.value = locale;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui-language', locale);
    }
  }
}

export function getLocale(): SupportedLocale {
  return currentLocale.value;
}

// Composable for use in Vue components
export function useI18n() {
  const locale = computed(() => currentLocale.value);

  // Schedule locale init — deferred past all island hydrations
  onMounted(scheduleLocaleInit);

  function t(key: string, params?: Record<string, string | number>): string {
    const localeMessages = messages[currentLocale.value] || messages.cs;
    const value = getNestedValue(localeMessages, key);
    return replacePlaceholders(value, params);
  }

  return {
    t,
    locale,
    setLocale
  };
}
