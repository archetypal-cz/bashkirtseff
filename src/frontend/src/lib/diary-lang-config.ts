/**
 * Diary language configuration registry.
 *
 * Maps URL path segments to content paths, locales, and feature flags.
 * This is the single source of truth for multi-language diary routing.
 *
 * To add a new language:
 * 1. Add an entry to DIARY_LANGUAGES below
 * 2. Ensure content exists in content/{contentPath}/
 * 3. Pages are generated automatically by getStaticPaths() helpers
 */

import type { SupportedLocale } from '../i18n/index';

export interface DiaryLanguageConfig {
  /** URL path segment: 'cz', 'original', 'en', 'uk', 'fr' */
  urlPath: string;

  /** Content directory path for content.ts functions: 'cz', '_original', 'en', 'uk', 'fr' */
  contentPath: string;

  /** UI locale for SSR i18n (createT): 'cs', 'en', 'fr', 'uk' */
  uiLocale: SupportedLocale;

  /** Locale for date formatting (Intl.DateTimeFormat): 'cs-CZ', 'fr-FR', etc. */
  dateLocale: string;

  /** HTML lang attribute for content: 'cs', 'fr', 'en', 'uk' */
  contentLangAttr: string;

  /** true = shows FlipParagraph, translation progress, FR badges */
  isTranslation: boolean;
}

export const DIARY_LANGUAGES: DiaryLanguageConfig[] = [
  {
    urlPath: 'cz',
    contentPath: 'cz',
    uiLocale: 'cs',
    dateLocale: 'cs-CZ',
    contentLangAttr: 'cs',
    isTranslation: true,
  },
  {
    urlPath: 'original',
    contentPath: '_original',
    uiLocale: 'cs',
    dateLocale: 'fr-FR',
    contentLangAttr: 'fr',
    isTranslation: false,
  },
  {
    urlPath: 'en',
    contentPath: 'en',
    uiLocale: 'en',
    dateLocale: 'en-US',
    contentLangAttr: 'en',
    isTranslation: true,
  },
  {
    urlPath: 'uk',
    contentPath: 'uk',
    uiLocale: 'uk',
    dateLocale: 'uk-UA',
    contentLangAttr: 'uk',
    isTranslation: true,
  },
  {
    urlPath: 'fr',
    contentPath: 'fr',
    uiLocale: 'fr',
    dateLocale: 'fr-FR',
    contentLangAttr: 'fr',
    isTranslation: true,
  },
];

/**
 * hreflang value for a diary URL-path segment.
 *
 * Scheme (documented choice — H6):
 *   cz       -> 'cs'     (ISO 639-1; URLs use /cz/ for legacy reasons)
 *   en       -> 'en'
 *   uk       -> 'uk'
 *   original -> 'fr'     (the French source text; the canonical French)
 *   fr       -> 'fr-FR'  (the modern French *edition*; both /original/ and /fr/
 *                         are French, so the edition gets a region-qualified
 *                         tag to disambiguate it from the original. Search
 *                         engines treat 'fr' and 'fr-FR' as distinct alternates.)
 */
const HREFLANG_BY_URLPATH: Record<string, string> = {
  cz: 'cs',
  original: 'fr',
  en: 'en',
  uk: 'uk',
  fr: 'fr-FR',
};

/** Get the hreflang value for a URL-path segment (e.g. 'cz' -> 'cs'). */
export function hreflangFor(urlPath: string): string {
  return HREFLANG_BY_URLPATH[urlPath] ?? urlPath;
}

/**
 * Build the list of <link rel="alternate" hreflang> entries for a diary route.
 *
 * @param pathSuffix  Path after the language segment, e.g. '001/1873-01-11' or '' for a language home.
 * @param availableUrlPaths  URL-path segments that actually exist for this
 *   resource. Defaults to all DIARY_LANGUAGES (fine for index pages where every
 *   variant exists; entry pages should pass real availability). Values are
 *   *content-path or URL-path* codes — '_original' is normalized to 'original'.
 * @returns Array of { hreflang, href } plus an x-default pointing at the French original.
 */
export function buildHreflangAlternates(
  pathSuffix: string,
  availableUrlPaths?: string[],
): { hreflang: string; href: string }[] {
  const suffix = pathSuffix ? `/${pathSuffix.replace(/^\/+/, '')}` : '';

  // Normalize availability codes to urlPath segments ('_original' -> 'original').
  const available = (availableUrlPaths ?? DIARY_LANGUAGES.map(l => l.urlPath)).map(c =>
    c === '_original' ? 'original' : c,
  );

  const out: { hreflang: string; href: string }[] = [];
  for (const cfg of DIARY_LANGUAGES) {
    if (!available.includes(cfg.urlPath)) continue;
    out.push({
      hreflang: hreflangFor(cfg.urlPath),
      href: `/${cfg.urlPath}${suffix}`,
    });
  }

  // x-default -> the French original (the source text, neutral entry point),
  // but only if it is among the available variants.
  if (available.includes('original')) {
    out.push({ hreflang: 'x-default', href: `/original${suffix}` });
  }

  return out;
}

/** Get config by URL path segment. Throws if not found. */
export function getDiaryLang(urlPath: string): DiaryLanguageConfig {
  const config = DIARY_LANGUAGES.find(l => l.urlPath === urlPath);
  if (!config) {
    throw new Error(`Unknown diary language: ${urlPath}`);
  }
  return config;
}

/** Get config by URL path segment, or undefined if not found. */
export function findDiaryLang(urlPath: string): DiaryLanguageConfig | undefined {
  return DIARY_LANGUAGES.find(l => l.urlPath === urlPath);
}

/** Build a URL path for this language: /{urlPath}/{rest} */
export function diaryUrl(lang: DiaryLanguageConfig, ...segments: string[]): string {
  return `/${lang.urlPath}/${segments.join('/')}`;
}

/** Build a glossary URL: /{urlPath}/glossary/{id} */
export function glossaryUrl(lang: DiaryLanguageConfig, id: string): string {
  return `/${lang.urlPath}/glossary/${id}`;
}

/** Convert a location or entity name to a glossary-compatible ID */
export function toGlossaryId(name: string): string {
  return name.toUpperCase().replace(/ /g, '_');
}
