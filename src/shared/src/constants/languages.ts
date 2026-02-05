/**
 * Language glossary tag IDs mapped to ISO language codes
 * These are glossary entries that indicate language presence in the original text
 */
export const LANGUAGE_TAGS: Record<string, string> = {
  English: 'en',
  Russian: 'ru',
  Italian: 'it',
  German: 'de',
  Spanish: 'es',
  Latin: 'la',
  Greek: 'el',
} as const;

/**
 * Default language for the diary (French)
 */
export const DEFAULT_LANGUAGE = 'fr';

/**
 * Language codes used in the project
 */
export const LANGUAGE_CODES = {
  FRENCH: 'fr',
  ENGLISH: 'en',
  RUSSIAN: 'ru',
  ITALIAN: 'it',
  GERMAN: 'de',
  SPANISH: 'es',
  LATIN: 'la',
  GREEK: 'el',
  CZECH: 'cz',
} as const;

/**
 * Language directory names in the source structure
 */
export const LANGUAGE_DIRS = {
  ORIGINAL: '_original',
  CZECH: 'cz',
  ENGLISH: 'en',
} as const;

/**
 * Get ISO language code from a glossary tag ID
 * Returns undefined if not a language tag
 */
export function getLanguageFromTag(tagId: string): string | undefined {
  return LANGUAGE_TAGS[tagId];
}

/**
 * Check if a glossary tag ID represents a language
 */
export function isLanguageTag(tagId: string): boolean {
  return tagId in LANGUAGE_TAGS;
}

/**
 * Extract languages from glossary tags
 * If any language tags are present, returns those language codes
 * Otherwise defaults to French
 */
export function extractLanguagesFromTags(tagIds: string[]): string[] {
  const languages: string[] = [];

  for (const tagId of tagIds) {
    const langCode = LANGUAGE_TAGS[tagId];
    if (langCode && !languages.includes(langCode)) {
      languages.push(langCode);
    }
  }

  return languages.length > 0 ? languages : [DEFAULT_LANGUAGE];
}
