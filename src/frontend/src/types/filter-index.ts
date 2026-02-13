/**
 * Filter Index Types
 *
 * Defines the structure of the JSON index built by `just filter-index`
 * and consumed at runtime for client-side tag filtering.
 *
 * Short field names in FilterEntryRecord keep JSON size down:
 * ~3,300 entries × ~100 bytes ≈ 330KB raw, ~50-80KB gzipped.
 */

/** Per-entry record in the filter index */
export interface FilterEntryRecord {
  /** Entry ID, e.g. "1873-01-11" */
  id: string;
  /** 3-digit carnet ID, e.g. "001" */
  c: string;
  /** Year, e.g. 1873 */
  y: number;
  /** Marie's current location, e.g. "Nice" */
  l?: string;
  /** People entity IDs (CAPITAL_ASCII) */
  p?: string[];
  /** Place entity IDs */
  pl?: string[];
  /** Cultural reference IDs (art, institutions, etc.) */
  cu?: string[];
  /** Theme/description tag IDs (from culture/themes/) */
  th?: string[];
  /** Kernberger covered (present = true) */
  k?: true;
  /** Censored 1887 included (present = true) */
  x?: true;
  /** Paragraph count */
  n?: number;
}

/** A single filterable tag within a category */
export interface FilterTag {
  /** Tag ID (CAPITAL_ASCII for glossary, or keyword like "kernberger") */
  id: string;
  /** Display name */
  name: string;
  /** Number of entries with this tag */
  count: number;
  /** Subcategory key, e.g. "core", "family", "cities" */
  sub?: string;
}

/** A top-level filter category containing tags */
export interface FilterCategory {
  /** Category key: "editions", "people", "places", "culture", "themes", "location" */
  key: string;
  /** Display label (i18n key) */
  label: string;
  /** Tags within this category, sorted by count descending */
  tags: FilterTag[];
}

/** Top-level filter index JSON structure */
export interface FilterIndex {
  /** Build timestamp (ISO string) */
  built: string;
  /** Total number of entries in the index */
  totalEntries: number;
  /** Total paragraph count across all entries */
  totalParagraphs: number;
  /** All entry records */
  entries: FilterEntryRecord[];
  /** Category tree for the tag picker UI */
  categories: FilterCategory[];
}
