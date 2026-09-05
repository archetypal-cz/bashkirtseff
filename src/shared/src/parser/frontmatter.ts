import YAML from 'yaml';

import { MARIE_BIRTH_DATE } from '../constants/marie.js';

/**
 * Result of parsing frontmatter
 */
export interface FrontmatterResult {
  metadata: Record<string, unknown>;
  content: string;
  /** The frontmatter block verbatim, delimiters included ('' when absent) */
  raw: string;
  /** Set when a block was present but could not be read as a YAML mapping */
  error?: string;
}

const OPEN_DELIMITER = /^---\r?\n/;

/**
 * Parse YAML frontmatter from content
 * Returns metadata object and content without frontmatter
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  const open = content.match(OPEN_DELIMITER);
  if (!open) {
    return { metadata: {}, content, raw: '' };
  }

  const bodyStart = open[0].length;
  const close = content.slice(bodyStart).match(/(?:^|\r?\n)---(?:\r?\n|$)/);
  if (!close || close.index === undefined) {
    return { metadata: {}, content, raw: '', error: 'unterminated frontmatter block' };
  }

  const frontmatterStr = content.slice(bodyStart, bodyStart + close.index);
  const endIndex = bodyStart + close.index + close[0].length;
  const raw = content.slice(0, endIndex);
  const remainingContent = content.slice(endIndex);

  let parsed: unknown;
  try {
    parsed = YAML.parse(frontmatterStr) ?? {};
  } catch (e) {
    return {
      metadata: {},
      content: remainingContent,
      raw,
      error: `invalid YAML: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      metadata: {},
      content: remainingContent,
      raw,
      error: `frontmatter is ${Array.isArray(parsed) ? 'a sequence' : typeof parsed}, expected a mapping`,
    };
  }

  return { metadata: parsed as Record<string, unknown>, content: remainingContent, raw };
}

/**
 * Create YAML frontmatter string from metadata
 */
export function createFrontmatter(metadata: Record<string, unknown>): string {
  // Order fields nicely
  const orderedMetadata: Record<string, unknown> = {};

  // Priority fields first
  const priorityFields = [
    'date',
    'type',
    'book_id',
    'entry_id',
    'location',
    'locations',
    'dates',
    'marie_age',
    'metrics',
    'entities',
    'notes',
    'workflow',
    'flags',
  ];

  for (const field of priorityFields) {
    if (metadata[field] !== undefined) {
      orderedMetadata[field] = metadata[field];
    }
  }

  // Add any remaining fields
  for (const [key, value] of Object.entries(metadata)) {
    if (!(key in orderedMetadata)) {
      orderedMetadata[key] = value;
    }
  }

  const yamlStr = YAML.stringify(orderedMetadata);
  return `---\n${yamlStr}---\n`;
}

/**
 * Marie's REAL birth date (1858-11-24 N.S.), used for displayed ages.
 *
 * Previously this used the *claimed* date (1860-11-24), which made every
 * computed age two years too young (audit issue M9). This is a scholarly
 * edition, so ages reflect her actual age; see MARIE_CLAIMED_BIRTH_DATE in
 * `../constants/marie.ts` for the date she publicly claimed.
 *
 * Parsed at UTC midnight so the arithmetic below matches the UTC-midnight
 * entry dates (`new Date('YYYY-MM-DD')`) and is timezone-independent.
 */
const MARIE_BIRTH_DATE_OBJ = new Date(`${MARIE_BIRTH_DATE}T00:00:00Z`);

/**
 * Marie's age calculation result
 */
export interface MarieAge {
  years: number;
  months: number;
  days: number;
}

/**
 * Calculate Marie's age for a given date
 */
export function calculateMarieAge(dateStr: string): MarieAge {
  try {
    const entryDate = new Date(dateStr);
    const delta = entryDate.getTime() - MARIE_BIRTH_DATE_OBJ.getTime();
    const totalDays = Math.floor(delta / (1000 * 60 * 60 * 24));

    const years = Math.floor(totalDays / 365);
    const remaining = totalDays % 365;
    const months = Math.floor(remaining / 30);
    const days = remaining % 30;

    return { years, months, days };
  } catch {
    return { years: 0, months: 0, days: 0 };
  }
}

/**
 * Extract date from filename (e.g., "1884-05-01-01.md" -> "1884-05-01")
 */
export function extractDateFromFilename(filename: string): string {
  // Remove .md extension
  const name = filename.replace('.md', '');

  // Extract date parts (assuming format YYYY-MM-DD or YYYY-MM-DD-NN)
  const parts = name.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  }

  return name;
}

/**
 * Detect language from file path
 */
export function detectLanguage(filePath: string): string {
  if (filePath.includes('/_original/')) {
    return 'original';
  } else if (filePath.includes('/cz/')) {
    return 'cz';
  } else if (filePath.includes('/en/')) {
    return 'en';
  } else if (filePath.includes('/uk/')) {
    return 'uk';
  } else if (filePath.includes('/fr/')) {
    return 'fr';
  }

  return 'original';
}

/**
 * Workflow status structure
 */
export interface WorkflowStatus {
  researchComplete: boolean;
  linguisticAnnotationComplete: boolean;
  translationComplete: boolean;
  editorialReviewComplete: boolean;
  conductorApproval: boolean;
  lastModified: string;
  modifiedBy: string;
}

/**
 * Entry metrics structure
 */
export interface EntryMetrics {
  paragraphCount: number;
  wordCount: number;
  sentenceCountOriginal: number;
  sentenceCountTranslated: number;
  hasOriginal: boolean;
  hasTranslation: boolean;
  translationVersionCount: number;
}

/**
 * Entry entities structure
 */
export interface EntryEntities {
  people: string[];
  places: string[];
  cultural: string[];
}

/**
 * Full entry metadata structure
 */
export interface EntryMetadata {
  date: string;
  type: string;
  carnetId: string;
  /** @deprecated Use carnetId instead */
  bookId: string;
  entryId: string;
  location?: string;
  locations?: string[];
  dates?: {
    primary: string;
    merged: string[];
  };
  marieAge?: MarieAge;
  metrics?: EntryMetrics;
  entities?: EntryEntities;
  notes?: string[];
  workflow?: WorkflowStatus;
  flags?: {
    emptyInSource: boolean;
    hasContinuation: boolean;
  };
}
