import YAML from 'yaml';

/**
 * Result of parsing frontmatter
 */
export interface FrontmatterResult {
  metadata: Record<string, unknown>;
  content: string;
}

/**
 * Parse YAML frontmatter from content
 * Returns metadata object and content without frontmatter
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  if (!content.startsWith('---\n')) {
    return { metadata: {}, content };
  }

  try {
    // Find end of frontmatter
    const endIndex = content.indexOf('\n---\n', 4);
    if (endIndex === -1) {
      return { metadata: {}, content };
    }

    const frontmatterStr = content.substring(4, endIndex);
    const remainingContent = content.substring(endIndex + 5);

    const metadata = YAML.parse(frontmatterStr) ?? {};
    return { metadata, content: remainingContent };
  } catch {
    return { metadata: {}, content };
  }
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
 * Marie's birth date (claimed date: November 24, 1860)
 */
const MARIE_BIRTH_DATE = new Date(1860, 10, 24); // Month is 0-indexed

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
    const delta = entryDate.getTime() - MARIE_BIRTH_DATE.getTime();
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
  if (filePath.includes('/cz/')) {
    return 'cz';
  } else if (filePath.includes('/_original/')) {
    return 'original';
  } else if (filePath.includes('/en/')) {
    return 'en';
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
