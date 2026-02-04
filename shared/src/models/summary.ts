import type { Paragraph } from './paragraph.js';

/**
 * Key person reference in a carnet summary
 */
export interface SummaryKeyPerson {
  /** Glossary ID (CAPITAL_ASCII) */
  id: string;
  /** Role in this carnet (e.g., "romantic_obsession", "family_companion") */
  role: string;
  /** Optional notes about this person's significance in the carnet */
  notes?: string;
}

/**
 * Date range for a carnet
 */
export interface SummaryDateRange {
  /** Start date (ISO format: YYYY-MM-DD) */
  start: string;
  /** End date (ISO format: YYYY-MM-DD) */
  end: string;
}

/**
 * Represents a parsed carnet summary document with paragraph clusters
 *
 * Summary files follow the same paragraph-cluster format as diary entries
 * and glossary files, enabling:
 * - Precise referencing via paragraph IDs (SUM.{carnet}.{seq})
 * - Translation like other content
 * - Consistent annotation workflow
 */
export interface CarnetSummaryDocument {
  /** Carnet ID (3-digit string: "001", "002", etc.) */
  carnet: string;

  /** Human-readable title (e.g., "Nice, janvier-fevrier 1873") */
  title: string;

  /** Date range covered by this carnet */
  dateRange: SummaryDateRange;

  /** Primary location where most entries take place */
  primaryLocation: string;

  /** Journey of locations in order of appearance */
  locationJourney: string[];

  /** Key people featured in this carnet with their roles */
  keyPeople: SummaryKeyPerson[];

  /** Major themes explored in this carnet */
  majorThemes: string[];

  /** Marie's age during this carnet */
  marieAge: number;

  /** Whether this summary was auto-generated from entry summaries */
  generatedFromEntries: boolean;

  /** Paragraphs in the summary (with SUM. prefixed IDs) */
  paragraphs: Paragraph[];

  /** Language code: "original", "cz", "en", etc. */
  language: string;

  /** Path to the source file */
  filePath: string;

  /** Raw frontmatter metadata for any additional fields */
  metadata: Record<string, unknown>;
}

/**
 * Create a new carnet summary document with defaults
 */
export function createCarnetSummaryDocument(
  carnet: string,
  filePath: string,
  language: string = 'original'
): CarnetSummaryDocument {
  return {
    carnet,
    title: '',
    dateRange: { start: '', end: '' },
    primaryLocation: '',
    locationJourney: [],
    keyPeople: [],
    majorThemes: [],
    marieAge: 0,
    generatedFromEntries: false,
    paragraphs: [],
    language,
    filePath,
    metadata: {},
  };
}

/**
 * Get paragraph by ID within a summary document
 */
export function getSummaryParagraphById(
  summary: CarnetSummaryDocument,
  paragraphId: string
): Paragraph | undefined {
  return summary.paragraphs.find((p) => p.id === paragraphId);
}

/**
 * Get the total paragraph count (excluding headers)
 */
export function getSummaryParagraphCount(summary: CarnetSummaryDocument): number {
  return summary.paragraphs.filter((p) => !p.isHeader).length;
}

/**
 * Extract carnet ID from a summary paragraph ID
 * e.g., "SUM.001.0001" -> "001"
 */
export function extractCarnetFromSummaryId(paragraphId: string): string | null {
  const match = paragraphId.match(/^SUM\.(\d{3})\.\d+$/);
  return match ? match[1] : null;
}

/**
 * Validate a summary paragraph ID format
 * Format: SUM.{3-digit carnet}.{4-digit seq}
 */
export function isValidSummaryParagraphId(id: string): boolean {
  return /^SUM\.\d{3}\.\d{4}$/.test(id);
}

/**
 * Generate a summary paragraph ID
 * @param carnet - 3-digit carnet ID (e.g., "001")
 * @param seq - Sequence number (will be zero-padded to 4 digits)
 */
export function generateSummaryParagraphId(carnet: string, seq: number): string {
  return `SUM.${carnet}.${String(seq).padStart(4, '0')}`;
}
