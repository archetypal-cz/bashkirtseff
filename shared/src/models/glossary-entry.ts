import type { Paragraph } from './paragraph.js';
import { isValidGlossaryId, toCapitalAscii } from './glossary.js';

/**
 * Represents a parsed glossary entry with paragraph clusters
 */
export interface GlossaryEntryParsed {
  /** Entry ID in CAPITAL_ASCII format (e.g., "VISCONTI", "DUKE_OF_HAMILTON") */
  id: string;

  /** Display name (e.g., "Visconti", "Duke of Hamilton") */
  name: string;

  /** Entry type: Person, Place, Culture, Society */
  type: string;

  /** Full category path (e.g., "people/mentioned", "places/cities") */
  category: string;

  /** Research status: Stub, Moderate, Comprehensive */
  researchStatus: string;

  /** Last updated date (ISO format: YYYY-MM-DD) */
  lastUpdated: string;

  /** Paragraphs in the entry (with GLO_ prefixed IDs) */
  paragraphs: Paragraph[];

  /** Language code: "original", "cz", "en", etc. */
  language: string;

  /** Path to the source file */
  filePath: string;

  /** Raw frontmatter metadata */
  metadata: Record<string, unknown>;

  /** ISO 639-1 language codes (e.g., ["ru", "uk"]) */
  languages?: string[];

  /** Term in original script (e.g., Cyrillic, Greek) */
  originalScript?: string;

  /** Latin transliteration of the term */
  transliteration?: string;

  /** URL to pronunciation (e.g., Google Translate) */
  pronunciation?: string;
}

/**
 * Create a new glossary entry with defaults
 * Normalizes the ID to CAPITAL_ASCII format if needed
 */
export function createGlossaryEntry(
  id: string,
  filePath: string,
  language: string = 'original'
): GlossaryEntryParsed {
  // Normalize ID to CAPITAL_ASCII if needed
  const normalizedId = isValidGlossaryId(id) ? id : toCapitalAscii(id);

  return {
    id: normalizedId,
    name: normalizedId.replace(/_/g, ' '),
    type: 'Unknown',
    category: '',
    researchStatus: 'Stub',
    lastUpdated: new Date().toISOString().split('T')[0],
    paragraphs: [],
    language,
    filePath,
    metadata: {},
  };
}

/**
 * Validate a glossary entry ID
 * Returns true if valid, false otherwise
 */
export function validateGlossaryEntryId(id: string): boolean {
  return isValidGlossaryId(id);
}

/**
 * Get paragraph by ID within a glossary entry
 */
export function getGlossaryParagraphById(
  entry: GlossaryEntryParsed,
  paragraphId: string
): Paragraph | undefined {
  return entry.paragraphs.find((p) => p.id === paragraphId);
}

/**
 * Get all cross-references (glossary links) from a glossary entry
 */
export function getGlossaryCrossRefs(entry: GlossaryEntryParsed): string[] {
  const refs = new Set<string>();
  for (const para of entry.paragraphs) {
    for (const link of para.glossaryLinks) {
      refs.add(link.displayText);
    }
  }
  return Array.from(refs);
}

/**
 * Get the total paragraph count (excluding headers)
 */
export function getGlossaryParagraphCount(entry: GlossaryEntryParsed): number {
  return entry.paragraphs.filter((p) => !p.isHeader).length;
}

/**
 * Extract category from file path
 * e.g., "src/_original/_glossary/people/mentioned/VISCONTI.md" -> "people/mentioned"
 */
export function extractCategoryFromPath(filePath: string): string {
  const match = filePath.match(/_glossary\/(.+)\/[^/]+\.md$/);
  return match ? match[1] : '';
}

/**
 * Extract entry ID from file path
 * e.g., "src/_original/_glossary/people/mentioned/VISCONTI.md" -> "VISCONTI"
 */
export function extractIdFromPath(filePath: string): string {
  const match = filePath.match(/([^/]+)\.md$/);
  return match ? match[1] : '';
}
