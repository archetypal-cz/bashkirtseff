/**
 * Represents a glossary reference link
 */
export interface GlossaryLink {
  /** Display text shown to user (e.g., "Marie Bashkirtseff") */
  displayText: string;
  /** Relative path to the glossary file */
  filePath: string;
}

/**
 * Represents a glossary tag extracted from content
 */
export interface GlossaryTag {
  /** File ID without .md extension (e.g., "Marie_Bashkirtseff") */
  id: string;
  /** Display name (e.g., "Marie Bashkirtseff") */
  name: string;
}

/**
 * Create a string representation of a glossary link in markdown format
 */
export function glossaryLinkToString(link: GlossaryLink): string {
  return `[#${link.displayText}](${link.filePath})`;
}

/**
 * Check equality between two glossary links (based on display text)
 */
export function glossaryLinksEqual(a: GlossaryLink, b: GlossaryLink): boolean {
  return a.displayText === b.displayText;
}

/**
 * Create a hash for a glossary link (for use in Sets/Maps)
 */
export function glossaryLinkHash(link: GlossaryLink): string {
  return link.displayText;
}

/**
 * Pattern for valid glossary entry IDs: CAPITAL_ASCII format
 * - UPPERCASE letters only (A-Z)
 * - Numbers (0-9) and underscores (_)
 * - NO accents or special characters
 */
export const GLOSSARY_ID_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * Check if a glossary ID is valid (CAPITAL_ASCII format)
 */
export function isValidGlossaryId(id: string): boolean {
  return GLOSSARY_ID_PATTERN.test(id);
}

/**
 * Convert text to CAPITAL_ASCII format for glossary IDs
 * Removes accents, converts to uppercase, replaces spaces/dashes with underscores
 *
 * Examples:
 *   "Marie Bashkirtseff" → "MARIE_BASHKIRTSEFF"
 *   "Théâtre Français" → "THEATRE_FRANCAIS"
 *   "Duke of Hamilton" → "DUKE_OF_HAMILTON"
 *   "Café" → "CAFE"
 */
export function toCapitalAscii(text: string): string {
  // Remove accents using Unicode normalization
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Convert to uppercase
  let result = normalized.toUpperCase();

  // Replace special characters with underscores
  result = result.replace(/['\-\s]+/g, '_');

  // Remove any remaining non-ASCII characters
  result = result.replace(/[^A-Z0-9_]/g, '');

  // Clean up multiple underscores
  result = result.replace(/_+/g, '_');

  // Remove leading/trailing underscores
  return result.replace(/^_|_$/g, '');
}

/**
 * Validate and optionally normalize a glossary ID
 * Returns the normalized ID or null if invalid and cannot be normalized
 */
export function normalizeGlossaryId(id: string): string {
  if (isValidGlossaryId(id)) {
    return id;
  }
  return toCapitalAscii(id);
}
