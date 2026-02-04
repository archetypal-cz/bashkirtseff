import type { Paragraph } from './paragraph.js';
import type { GlossaryLink } from './glossary.js';

/**
 * Represents a complete diary entry (one file)
 */
export interface DiaryEntry {
  /** Path to the source file */
  filePath: string;
  /** ISO date from filename (e.g., "1873-01-01") */
  date: string;
  /** Language identifier: "original", "cz", "en", etc. */
  language: string;

  // Entry-level metadata
  /** Location (e.g., "Paris") - typically from first glossary link */
  location?: string;
  /** Entry-level glossary links (from first line comment) */
  entryGlossaryLinks: GlossaryLink[];

  /** All paragraphs in this entry */
  paragraphs: Paragraph[];
  /** Footnotes (key: footnote ID, value: text) */
  footnotes: Record<string, string>;

  /** Frontmatter metadata (contains para_start, title, themes, etc.) */
  metadata: Record<string, unknown>;
}

/**
 * Create a new diary entry with defaults
 */
export function createDiaryEntry(
  filePath: string,
  date: string,
  language: string
): DiaryEntry {
  return {
    filePath,
    date,
    language,
    entryGlossaryLinks: [],
    paragraphs: [],
    footnotes: {},
    metadata: {},
  };
}

/**
 * Find a paragraph by its ID
 */
export function getParagraphById(
  entry: DiaryEntry,
  paraId: string
): Paragraph | undefined {
  return entry.paragraphs.find((p) => p.id === paraId);
}

/**
 * Get all unique glossary links from the entry
 */
export function getAllGlossaryLinks(entry: DiaryEntry): GlossaryLink[] {
  const allLinks = new Map<string, GlossaryLink>();

  // First, add the location if it exists
  if (entry.location) {
    const locationLink = entry.entryGlossaryLinks.find(
      (link) => link.displayText === entry.location
    );
    if (locationLink) {
      allLinks.set(locationLink.displayText, locationLink);
    }
  }

  // Then add all other glossary links from paragraphs
  for (const para of entry.paragraphs) {
    for (const link of para.glossaryLinks) {
      if (!allLinks.has(link.displayText)) {
        allLinks.set(link.displayText, link);
      }
    }
  }

  return Array.from(allLinks.values());
}

/**
 * Count paragraphs (excluding headers)
 */
export function getParagraphCount(entry: DiaryEntry): number {
  return entry.paragraphs.filter((p) => !p.isHeader).length;
}
