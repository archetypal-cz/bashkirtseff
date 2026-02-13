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
  // Uncomment when content exists in the respective directories:
  // {
  //   urlPath: 'fr',
  //   contentPath: 'fr',
  //   uiLocale: 'fr',
  //   dateLocale: 'fr-FR',
  //   contentLangAttr: 'fr',
  //   isTranslation: true,
  // },
];

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
