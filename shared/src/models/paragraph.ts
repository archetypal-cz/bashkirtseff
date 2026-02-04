import type { Note } from './note.js';
import type { GlossaryLink } from './glossary.js';

/**
 * Represents a single paragraph cluster in the diary
 */
export interface Paragraph {
  /** Paragraph ID (e.g., "001.03") */
  id: string;
  /** Carnet number (e.g., "001") */
  carnetNum: string;
  /** @deprecated Use carnetNum instead */
  bookNum: string;
  /** Paragraph number within the entry */
  paraNum: number;

  // Text content
  /** Original French text */
  originalText?: string;
  /** Translated text (e.g., Czech) */
  translatedText?: string;

  /**
   * Translation versions (preserves order)
   * Key: version name (e.g., "v0", "v12.3"), Value: text
   */
  translationVersions: Map<string, string>;

  // Metadata
  /** Notes attached to this paragraph */
  notes: Note[];
  /** Glossary links referenced in this paragraph */
  glossaryLinks: GlossaryLink[];

  /**
   * Languages present in original text (extracted from glossary tags)
   * Defaults to ['fr'] if no explicit language tags found
   */
  languages: string[];

  // Footnotes
  /** Footnote references in this paragraph (e.g., ["1", "01.03.1"]) */
  footnoteRefs: string[];

  // Header handling
  /** Whether this is a header paragraph */
  isHeader: boolean;
  /** Header level (1 for #, 2 for ##, etc.) */
  headerLevel: number;
}

/**
 * Create a new paragraph with defaults
 */
export function createParagraph(
  id: string,
  carnetNum: string,
  paraNum: number
): Paragraph {
  return {
    id,
    carnetNum,
    bookNum: carnetNum, // backward compatibility
    paraNum,
    translationVersions: new Map(),
    notes: [],
    glossaryLinks: [],
    footnoteRefs: [],
    languages: ['fr'],
    isHeader: false,
    headerLevel: 0,
  };
}

/**
 * Get notes by role
 */
export function getNotesByRole(paragraph: Paragraph, role: string): Note[] {
  return paragraph.notes.filter((note) => note.role === role);
}

/**
 * Check if paragraph has any translation
 */
export function hasTranslation(paragraph: Paragraph): boolean {
  return !!(paragraph.translatedText || paragraph.translationVersions.size > 0);
}

/**
 * Convert paragraph translation versions to plain object for serialization
 */
export function translationVersionsToObject(
  versions: Map<string, string>
): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of versions) {
    obj[key] = value;
  }
  return obj;
}

/**
 * Convert plain object to translation versions Map
 */
export function objectToTranslationVersions(
  obj: Record<string, string>
): Map<string, string> {
  return new Map(Object.entries(obj));
}
