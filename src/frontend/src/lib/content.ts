/**
 * Content loading utilities for diary entries
 *
 * This module provides frontend-specific content loading while importing
 * core types and utilities from @bashkirtseff/shared.
 *
 * LANGUAGE CODE MAPPING:
 * - This module uses content path codes: 'cz', 'fr', 'en', 'original'
 * - These correspond to directory names in ../src/
 * - The i18n system uses locale codes: 'cs', 'fr', 'en'
 * - Use localeToContentPath() from i18n/index.ts to convert between systems
 *
 * CARNET STRUCTURE:
 * - Entries are organized by carnet (000-106), Marie's original notebooks
 * - Carnet 000 is the preface (editorial material)
 * - Carnets 001-106 are the diary entries
 * - Carnet IDs are 3-digit strings: "000", "001", ..., "106"
 */

import fs from 'node:fs';
import path from 'node:path';

// Import shared types and utilities
import {
  type GlossaryTag,
  LANGUAGE_TAGS,
  extractLanguagesFromTags,
  parseFrontmatter,
} from '@bashkirtseff/shared';

// Re-export shared types for convenience
export type { GlossaryTag };

// Path to content root (relative to src/frontend/)
const CONTENT_ROOT = path.resolve(process.cwd(), '../../content');

// ============================================
// FRONTEND-SPECIFIC INTERFACES
// ============================================

export interface DiaryEntry {
  id: string;          // e.g., "1873-08-11" or "000-01" for non-date entries
  carnet: string;      // e.g., "008" (3-digit carnet ID)
  language: string;    // e.g., "cz" or "_original"
  date: Date | null;   // null for non-date entries like Carnet 000 preface sections
  title: string;       // First line of the file
  content: string;     // Raw markdown content
  paragraphs: Paragraph[];
  footnotes: Footnote[]; // All footnotes in the entry
  isSection?: boolean; // true for non-date-based entries (Carnet 000 preface sections)
  // Frontmatter metadata for aggregation
  people?: string[];   // Person IDs from frontmatter
  places?: string[];   // Place IDs from frontmatter
  themes?: string[];   // Theme strings from frontmatter
  location?: string;   // Primary location from frontmatter
}

export interface Paragraph {
  id: string;          // e.g., "02.01"
  text: string;        // The paragraph content (raw)
  html: string;        // Paragraph with highlights converted to HTML
  originalText?: string; // For translations, the French original
  glossaryTags?: GlossaryTag[]; // Tags from %%[#Name](path)%% comments
  footnoteRefs?: string[]; // Footnote references in this paragraph (e.g., ["1", "2"])
  languages?: string[]; // Languages in original text: ['fr'], ['fr', 'en'], etc.
}

export interface Footnote {
  id: string;          // e.g., "1"
  text: string;        // The footnote content
}

export interface CarnetInfo {
  id: string;          // 3-digit carnet ID: "000", "001", ..., "106"
  language: string;
  entries: string[];   // List of entry dates or section IDs
  dateRange: { start: Date; end: Date } | null;
}

export interface CarnetSummary {
  carnet: string;
  dateRange: { start: string; end: string };
  entryDates: string[];  // All dates with entries in this carnet
  peopleCounts: Record<string, number>;  // person_id -> mention count
  placesCounts: Record<string, number>;  // place_id -> mention count
  themeCounts: Record<string, number>;   // theme -> mention count
  primaryLocation?: string;  // Most common location
}

// Legacy alias for backward compatibility during transition
export type BookInfo = CarnetInfo;

export interface GlossaryEntry {
  id: string;           // filename without .md
  name: string;         // Display name (first H1 or filename)
  type?: string;        // Person, Place, etc.
  category?: string;    // e.g., "people/core"
  researchStatus?: string;
  lastUpdated?: string;
  summary?: string;     // First paragraph after headers
  content: string;      // Full markdown content
  paragraphs?: GlossaryParagraph[]; // Parsed paragraph clusters (if present)
  hasParagraphClusters?: boolean;   // Whether entry uses new format
  // Language and pronunciation metadata
  languages?: string[];        // ISO 639-1 codes (e.g., ["ru", "uk"])
  originalScript?: string;     // Term in original script (e.g., Cyrillic)
  transliteration?: string;    // Latin transliteration
  pronunciation?: string;      // URL to pronunciation (e.g., Google Translate)
}

export interface GlossaryParagraph {
  id: string;          // e.g., "GLO_VISCONTI.0001"
  text: string;        // The paragraph content (raw)
  html: string;        // Paragraph with formatting converted to HTML
  isHeader: boolean;
  headerLevel: number;
  glossaryTags?: GlossaryTag[]; // Cross-references to other glossary entries
}

// ============================================
// PATTERNS
// ============================================

// Patterns for entry file naming
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;  // e.g., 1873-08-11.md
const SECTION_PATTERN = /^\d{3}-\d{2}\.md$/; // e.g., 000-01.md (Carnet 000 preface sections)

// Pattern for carnet directory names (3-digit)
const CARNET_DIR_PATTERN = /^\d{3}$/;

/**
 * Parse a date from an entry ID
 * Handles extended formats like "1874-02-14-15" (multi-day entries) or "1878-10-04-evening"
 * by extracting just the YYYY-MM-DD portion
 */
function parseDateFromEntryId(entryId: string): Date {
  // Extract just the first 3 parts (YYYY-MM-DD)
  const datePart = entryId.split('-').slice(0, 3).join('-');
  return new Date(datePart);
}

// ============================================
// CARNET AND ENTRY FUNCTIONS
// ============================================

/**
 * Get all available carnets for a language
 */
export function getCarnets(language: string = 'original'): CarnetInfo[] {
  const langPath = language === 'original'
    ? path.join(CONTENT_ROOT, 'original')
    : path.join(CONTENT_ROOT, language);

  if (!fs.existsSync(langPath)) {
    return [];
  }

  const carnets: CarnetInfo[] = [];
  const items = fs.readdirSync(langPath, { withFileTypes: true });

  for (const item of items) {
    // Skip non-directories and special folders (starting with _)
    // Only include 3-digit carnet directories
    if (!item.isDirectory() || item.name.startsWith('_') || !CARNET_DIR_PATTERN.test(item.name)) {
      continue;
    }

    const carnetPath = path.join(langPath, item.name);
    const allFiles = fs.readdirSync(carnetPath).filter(f => f.endsWith('.md') && f !== 'README.md');

    // Check for date-based entries (most carnets)
    const dateEntries = allFiles
      .filter(f => DATE_PATTERN.test(f))
      .map(f => f.replace('.md', ''))
      .sort();

    // Check for section-based entries (Carnet 000 preface)
    const sectionEntries = allFiles
      .filter(f => SECTION_PATTERN.test(f))
      .map(f => f.replace('.md', ''))
      .sort();

    const entries = dateEntries.length > 0 ? dateEntries : sectionEntries;

    if (entries.length > 0) {
      let dateRange: { start: Date; end: Date } | null = null;

      if (dateEntries.length > 0) {
        const dates = dateEntries.map(e => new Date(e.split('-').slice(0, 3).join('-')));
        dateRange = {
          start: new Date(Math.min(...dates.map(d => d.getTime()))),
          end: new Date(Math.max(...dates.map(d => d.getTime()))),
        };
      }

      carnets.push({
        id: item.name,
        language,
        entries,
        dateRange,
      });
    }
  }

  // Sort carnets numerically by ID
  return carnets.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use getCarnets() instead
 */
export function getBooks(language: string = 'original'): CarnetInfo[] {
  return getCarnets(language);
}

/**
 * Get all entries for a specific carnet
 */
export function getCarnetEntries(carnetId: string, language: string = 'original'): string[] {
  const carnetPath = language === 'original'
    ? path.join(CONTENT_ROOT, 'original', carnetId)
    : path.join(CONTENT_ROOT, language, carnetId);

  if (!fs.existsSync(carnetPath)) {
    return [];
  }

  const allFiles = fs.readdirSync(carnetPath).filter(f => f.endsWith('.md') && f !== 'README.md');

  // Check for date-based entries (most carnets)
  const dateEntries = allFiles
    .filter(f => DATE_PATTERN.test(f))
    .map(f => f.replace('.md', ''))
    .sort();

  // Check for section-based entries (Carnet 000 preface)
  const sectionEntries = allFiles
    .filter(f => SECTION_PATTERN.test(f))
    .map(f => f.replace('.md', ''))
    .sort();

  // Return date entries if available, otherwise section entries
  return dateEntries.length > 0 ? dateEntries : sectionEntries;
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use getCarnetEntries() instead
 */
export function getBookEntries(carnetId: string, language: string = 'original'): string[] {
  return getCarnetEntries(carnetId, language);
}

/**
 * Load a single diary entry
 */
export function getEntry(carnetId: string, entryId: string, language: string = 'original'): DiaryEntry | null {
  const entryPath = language === 'original'
    ? path.join(CONTENT_ROOT, 'original', carnetId, `${entryId}.md`)
    : path.join(CONTENT_ROOT, language, carnetId, `${entryId}.md`);

  if (!fs.existsSync(entryPath)) {
    return null;
  }

  const rawContent = fs.readFileSync(entryPath, 'utf-8');

  // Parse YAML frontmatter using shared utility
  const { metadata: frontmatter, content } = parseFrontmatter(rawContent);

  const lines = content.split('\n');

  // Get title from frontmatter, or find first non-empty, non-comment line
  let title = frontmatter.title as string | undefined;
  if (!title) {
    title = lines.find(l => {
      const trimmed = l.trim();
      return trimmed.length > 0 && !trimmed.startsWith('%%') && !trimmed.startsWith('---');
    }) || entryId;
  }

  // Parse paragraphs and footnotes (using content without frontmatter)
  const paragraphs = parseParagraphs(content, language);
  const footnotes = extractFootnotes(content);

  // Determine if this is a date-based or section-based entry
  const isSection = !DATE_PATTERN.test(entryId);
  const date = isSection ? null : parseDateFromEntryId(entryId);

  // Extract frontmatter metadata for aggregation
  const people = Array.isArray(frontmatter.people) ? frontmatter.people as string[] : undefined;
  const places = Array.isArray(frontmatter.places) ? frontmatter.places as string[] : undefined;
  const themes = Array.isArray(frontmatter.themes) ? frontmatter.themes as string[] : undefined;
  const location = typeof frontmatter.location === 'string' ? frontmatter.location : undefined;

  return {
    id: entryId,
    carnet: carnetId,
    language,
    date,
    title: title.replace(/^#\s*/, ''),
    content,
    paragraphs,
    footnotes,
    isSection,
    people,
    places,
    themes,
    location,
  };
}

// ============================================
// PARAGRAPH PARSING (Frontend-specific)
// ============================================

/**
 * Extract glossary tags from comment lines
 * Format: %%[#Name](../_glossary/Name.md)%%
 */
function extractGlossaryTags(text: string): GlossaryTag[] {
  const tags: GlossaryTag[] = [];
  // Match patterns like [#Name](../_glossary/Name.md) inside %% comments
  const tagPattern = /\[#([^\]]+)\]\([^)]*\/_glossary\/([^)]+)\.md\)/g;

  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const name = match[1];
    // Extract just the filename from the path (e.g., "people/core/MARIE_BASHKIRTSEFF" -> "MARIE_BASHKIRTSEFF")
    const fullPath = match[2];
    const id = fullPath.split('/').pop() || fullPath;
    // Avoid duplicates
    if (!tags.some(t => t.id === id)) {
      tags.push({ id, name });
    }
  }

  return tags;
}

/**
 * Extract languages from glossary tags using shared utility
 */
function extractLanguages(glossaryTags: GlossaryTag[]): string[] {
  const tagIds = glossaryTags.map(t => t.id);
  return extractLanguagesFromTags(tagIds);
}

/**
 * Placeholder text for untranslated paragraphs
 * This should match the constant in @bashkirtseff/shared/utils/scaffold
 */
const TODO_PLACEHOLDER = 'TODO';
const TODO_DISPLAY = '—'; // em dash shown in UI for untranslated content

/**
 * Convert ==highlighted text== to HTML spans for foreign language emphasis
 * Also converts [^id] footnote refs to superscript links
 * Replaces TODO placeholder with em dash for display
 */
function processTextToHtml(text: string): { html: string; footnoteRefs: string[] } {
  const footnoteRefs: string[] = [];

  // Replace TODO placeholder with em dash for display
  if (text.trim() === TODO_PLACEHOLDER) {
    return { html: `<span class="untranslated">${TODO_DISPLAY}</span>`, footnoteRefs: [] };
  }

  let html = text
    // Convert ==text== to highlighted span (foreign language)
    .replace(/==([^=]+)==/g, '<span class="foreign-text">$1</span>')
    // Convert [^id] to footnote link (supports both "1" and "00.03.1" formats)
    .replace(/\[\^([^\]]+)\]/g, (_, id) => {
      if (!footnoteRefs.includes(id)) {
        footnoteRefs.push(id);
      }
      // Display short version for readability
      const displayId = id.includes('.') ? id.split('.').pop() : id;
      return `<sup><a href="#fn-${id}" id="fnref-${id}" class="footnote-ref">${displayId}</a></sup>`;
    })
    // Convert *italic* and _italic_ to em
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');

  return { html, footnoteRefs };
}

/**
 * Extract footnote definitions from content
 */
function extractFootnotes(content: string): Footnote[] {
  const footnotes: Footnote[] = [];
  const footnotePattern = /^\[\^([^\]]+)\]:\s*(.+)$/gm;

  let match;
  while ((match = footnotePattern.exec(content)) !== null) {
    const id = match[1];
    let text = match[2];
    // Convert *italic* and _italic_ in footnotes
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');
    footnotes.push({ id, text });
  }

  return footnotes;
}

/**
 * Check if a line is a comment line (starts and ends with %%)
 */
function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('%%')) return true;
  if (trimmed.startsWith('[^')) return true;
  return false;
}

/**
 * Remove all %% comment markers from text
 */
function stripCommentMarkers(text: string): string {
  let result = text.replace(/%%[^%]*%%/g, '');
  result = result.replace(/%%/g, '');
  return result.trim();
}

/**
 * Parse paragraphs from entry content
 */
function parseParagraphs(content: string, language: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Split by paragraph ID markers: %%02.01%% or %% 02.01 %% or %%GLO_VISCONTI.0001%%
  const idPattern = /%%\s*((?:\d+|GLO_[A-Z0-9_]+)\.\d+)\s*%%/g;

  if (language !== 'original') {
    // Translation parsing logic
    const lines = content.split('\n');

    let currentId: string | null = null;
    let currentOriginal: string | undefined;
    let currentCzechLines: string[] = [];

    let inOriginalBlock = false;
    let originalBlockLines: string[] = [];

    const isFrenchOriginal = (trimmed: string): boolean => {
      if (!trimmed.startsWith('%%') || !trimmed.endsWith('%%')) return false;
      if (trimmed.match(/^%%\s*(?:\d+|GLO_[A-Z0-9_]+)\.\d+\s*%%$/)) return false;
      // Filter out annotation roles (2-3 uppercase letters followed by colon, e.g., RSR:, LAN:, GEM:, TR:)
      if (trimmed.match(/[A-Z]{2,3}:/)) return false;
      // Filter out glossary tags [#Name] and timestamp patterns (e.g., 2025-12-07T...)
      if (trimmed.includes('[#') || trimmed.match(/^%%\s*\d{4}-\d{2}-\d{2}/)) return false;
      return true;
    };

    const finalizeCurrentParagraph = () => {
      if (!currentId) return;

      const blockText = currentCzechLines.join('\n');
      const glossaryTags = extractGlossaryTags(blockText);

      const translationLines = currentCzechLines.filter(l => !isCommentLine(l));
      let text = translationLines.join('\n').trim();
      text = stripCommentMarkers(text);

      if (text) {
        const { html, footnoteRefs } = processTextToHtml(text);
        const languages = extractLanguages(glossaryTags);
        paragraphs.push({
          id: currentId,
          text,
          html,
          originalText: currentOriginal,
          glossaryTags: glossaryTags.length > 0 ? glossaryTags : undefined,
          footnoteRefs: footnoteRefs.length > 0 ? footnoteRefs : undefined,
          languages
        });
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // Handle multi-line original block start
      if (trimmed.startsWith('%%') && !trimmed.endsWith('%%') && !trimmed.match(/^%%\s*\d/)) {
        inOriginalBlock = true;
        originalBlockLines = [trimmed.slice(2).trim()];
        continue;
      }

      // Handle multi-line original block continuation/end
      if (inOriginalBlock) {
        if (trimmed.endsWith('%%')) {
          originalBlockLines.push(trimmed.slice(0, -2).trim());
          // Assign to current paragraph, not pending
          if (currentId && !currentOriginal) {
            currentOriginal = originalBlockLines.join(' ').trim();
          }
          inOriginalBlock = false;
          originalBlockLines = [];
        } else {
          originalBlockLines.push(trimmed);
        }
        continue;
      }

      // Check for paragraph ID (supports numeric carnets and GLO_ prefixed entries)
      const idMatch = trimmed.match(/^%%\s*((?:\d+|GLO_[A-Z0-9_]+)\.\d+)\s*%%$/);
      if (idMatch) {
        finalizeCurrentParagraph();
        currentId = idMatch[1];
        currentOriginal = undefined; // Will be set by the next original line
        currentCzechLines = [];
        continue;
      }

      // Check for single-line French original - assign to CURRENT paragraph, not next
      const singleLineMatch = trimmed.match(/^%%\s*(.+?)\s*%%$/);
      if (singleLineMatch && isFrenchOriginal(trimmed)) {
        // Original text comes after paragraph ID, so assign to current paragraph
        if (currentId && !currentOriginal) {
          currentOriginal = singleLineMatch[1].trim();
        }
        continue;
      }

      // Regular line - add to current Czech block
      currentCzechLines.push(line);
    }

    finalizeCurrentParagraph();
  } else {
    // Original file parsing
    let matches;
    const ids: { id: string; index: number; matchLength: number }[] = [];

    while ((matches = idPattern.exec(content)) !== null) {
      ids.push({
        id: matches[1],
        index: matches.index,
        matchLength: matches[0].length
      });
    }

    for (let i = 0; i < ids.length; i++) {
      const startIndex = ids[i].index + ids[i].matchLength;
      const endIndex = i < ids.length - 1 ? ids[i + 1].index : content.length;

      const rawText = content.substring(startIndex, endIndex);
      const glossaryTags = extractGlossaryTags(rawText);

      const textLines = rawText.split('\n').filter(l => !isCommentLine(l));
      let text = textLines.join('\n').trim();
      text = stripCommentMarkers(text);

      if (text) {
        const { html, footnoteRefs } = processTextToHtml(text);
        const languages = extractLanguages(glossaryTags);
        paragraphs.push({
          id: ids[i].id,
          text,
          html,
          glossaryTags: glossaryTags.length > 0 ? glossaryTags : undefined,
          footnoteRefs: footnoteRefs.length > 0 ? footnoteRefs : undefined,
          languages
        });
      }
    }
  }

  return paragraphs;
}

// ============================================
// CARNET SUMMARY AGGREGATION
// ============================================

/**
 * Get aggregated summary data for a carnet
 * Aggregates people, places, themes, and locations across all entries
 */
export async function getCarnetSummary(carnet: string, language: string = 'original'): Promise<CarnetSummary> {
  const entryIds = getCarnetEntries(carnet, language);

  const peopleCounts: Record<string, number> = {};
  const placesCounts: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  const entryDates: string[] = [];

  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const entryId of entryIds) {
    const entry = getEntry(carnet, entryId, language);
    if (!entry) continue;

    // Track entry dates
    entryDates.push(entryId);

    // Track date range (for date-based entries)
    if (DATE_PATTERN.test(entryId)) {
      if (!minDate || entryId < minDate) minDate = entryId;
      if (!maxDate || entryId > maxDate) maxDate = entryId;
    }

    // Aggregate people counts
    if (entry.people) {
      for (const person of entry.people) {
        peopleCounts[person] = (peopleCounts[person] || 0) + 1;
      }
    }

    // Aggregate places counts
    if (entry.places) {
      for (const place of entry.places) {
        placesCounts[place] = (placesCounts[place] || 0) + 1;
      }
    }

    // Aggregate theme counts
    if (entry.themes) {
      for (const theme of entry.themes) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      }
    }

    // Aggregate location counts
    if (entry.location) {
      locationCounts[entry.location] = (locationCounts[entry.location] || 0) + 1;
    }
  }

  // Determine primary location (most common)
  let primaryLocation: string | undefined;
  let maxLocationCount = 0;
  for (const [loc, count] of Object.entries(locationCounts)) {
    if (count > maxLocationCount) {
      maxLocationCount = count;
      primaryLocation = loc;
    }
  }

  return {
    carnet,
    dateRange: {
      start: minDate || entryDates[0] || '',
      end: maxDate || entryDates[entryDates.length - 1] || '',
    },
    entryDates,
    peopleCounts,
    placesCounts,
    themeCounts,
    primaryLocation,
  };
}

// ============================================
// CARNET SUMMARY DOCUMENT (EDITORIAL SUMMARIES)
// ============================================

/**
 * Key person reference in a carnet summary document
 */
export interface SummaryKeyPerson {
  /** Glossary ID (CAPITAL_ASCII) */
  id: string;
  /** Role in this carnet (e.g., "romantic_obsession", "family_companion") */
  role: string;
  /** Optional notes about this person's significance */
  notes?: string;
}

/**
 * Paragraph in a summary document
 */
export interface SummaryParagraph {
  id: string;          // e.g., "SUM.001.0001"
  text: string;        // The paragraph content (raw)
  html: string;        // Paragraph with formatting converted to HTML
  originalText?: string; // For translations, the original text
  isHeader: boolean;
  headerLevel: number;
  glossaryTags?: GlossaryTag[];
}

/**
 * Complete carnet summary document with paragraph clusters
 *
 * This represents an editorial summary file (_summary.md) that follows
 * the same paragraph-cluster format as diary entries and glossary files.
 * Unlike CarnetSummary (runtime aggregation), this is a manually-written
 * or auto-generated document with structured narrative content.
 */
export interface CarnetSummaryDocument {
  carnet: string;
  title: string;
  dateRange: { start: string; end: string };
  primaryLocation: string;
  locationJourney: string[];
  keyPeople: SummaryKeyPerson[];
  majorThemes: string[];
  marieAge: number;
  generatedFromEntries: boolean;
  paragraphs: SummaryParagraph[];
  language: string;
}

/**
 * Check if a summary document exists for a carnet
 */
export function hasCarnetSummaryDocument(carnet: string, language: string = 'original'): boolean {
  const langPath = language === 'original'
    ? path.join(CONTENT_ROOT, 'original')
    : path.join(CONTENT_ROOT, language);

  const summaryPath = path.join(langPath, carnet, '_summary.md');
  return fs.existsSync(summaryPath);
}

/**
 * Load a carnet summary document (editorial summary with paragraph clusters)
 *
 * This loads the _summary.md file for a carnet, which contains structured
 * editorial content about the carnet (editorial summary, historical context,
 * reading notes, etc.) in paragraph-cluster format.
 *
 * Falls back gracefully if no summary exists, returning null.
 *
 * @param carnet - Carnet ID (e.g., "001")
 * @param language - Language code ("_original", "cz", "en", etc.)
 * @returns Parsed summary document or null if not found
 */
export function getCarnetSummaryDocument(carnet: string, language: string = 'original'): CarnetSummaryDocument | null {
  const langPath = language === 'original'
    ? path.join(CONTENT_ROOT, 'original')
    : path.join(CONTENT_ROOT, language);

  const summaryPath = path.join(langPath, carnet, '_summary.md');

  if (!fs.existsSync(summaryPath)) {
    return null;
  }

  const rawContent = fs.readFileSync(summaryPath, 'utf-8');
  const { metadata, content } = parseFrontmatter(rawContent);

  // Parse metadata
  const doc: CarnetSummaryDocument = {
    carnet: String(metadata.carnet || carnet),
    title: String(metadata.title || ''),
    dateRange: {
      start: '',
      end: '',
    },
    primaryLocation: String(metadata.primary_location || ''),
    locationJourney: Array.isArray(metadata.location_journey) ? metadata.location_journey as string[] : [],
    keyPeople: [],
    majorThemes: Array.isArray(metadata.major_themes) ? metadata.major_themes as string[] : [],
    marieAge: typeof metadata.marie_age === 'number' ? metadata.marie_age : 0,
    generatedFromEntries: Boolean(metadata.generated_from_entries),
    paragraphs: [],
    language,
  };

  // Parse date range
  if (metadata.date_range && typeof metadata.date_range === 'object') {
    const dr = metadata.date_range as Record<string, unknown>;
    doc.dateRange = {
      start: String(dr.start || ''),
      end: String(dr.end || ''),
    };
  }

  // Parse key people
  if (Array.isArray(metadata.key_people)) {
    doc.keyPeople = (metadata.key_people as Array<Record<string, unknown>>).map(
      (kp): SummaryKeyPerson => ({
        id: String(kp.id || ''),
        role: String(kp.role || ''),
        notes: kp.notes ? String(kp.notes) : undefined,
      })
    );
  }

  // Parse paragraphs
  doc.paragraphs = parseSummaryParagraphs(content, carnet, language);

  return doc;
}

/**
 * Parse paragraph clusters from summary content
 */
function parseSummaryParagraphs(content: string, carnet: string, language: string): SummaryParagraph[] {
  const paragraphs: SummaryParagraph[] = [];

  // Pattern for SUM. prefixed IDs: %% SUM.001.0001 %%
  const sumIdPattern = /%%\s*(SUM\.\d{3}\.\d+)\s*%%/g;

  // Check if content has SUM. paragraph IDs
  const hasSumIds = sumIdPattern.test(content);
  sumIdPattern.lastIndex = 0; // Reset regex state

  if (hasSumIds) {
    // Parse paragraph clusters with SUM. IDs
    const matches: { id: string; index: number }[] = [];
    let match;
    while ((match = sumIdPattern.exec(content)) !== null) {
      matches.push({ id: match[1], index: match.index });
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i < matches.length - 1 ? matches[i + 1].index : content.length;
      const paragraphContent = content.substring(start, end);

      const para = parseSingleSummaryParagraph(matches[i].id, paragraphContent, language);
      if (para) {
        paragraphs.push(para);
      }
    }
  } else {
    // Parse old format (plain markdown with ## headers)
    let paraNum = 1;
    const lines = content.split('\n');
    let currentSection: string[] = [];
    let currentHeader: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section
        if (currentSection.length > 0 || currentHeader) {
          const para = createOldFormatSummaryParagraph(
            carnet,
            paraNum++,
            currentHeader,
            currentSection
          );
          if (para) paragraphs.push(para);
        }

        currentHeader = trimmed;
        currentSection = [];
      } else if (trimmed) {
        currentSection.push(trimmed);
      }
    }

    // Save last section
    if (currentSection.length > 0 || currentHeader) {
      const para = createOldFormatSummaryParagraph(
        carnet,
        paraNum++,
        currentHeader,
        currentSection
      );
      if (para) paragraphs.push(para);
    }
  }

  return paragraphs;
}

/**
 * Parse a single summary paragraph from clustered content
 */
function parseSingleSummaryParagraph(id: string, content: string, language: string): SummaryParagraph | null {
  const lines = content.split('\n');

  // Skip the ID line (first line)
  const contentLines = lines.slice(1);

  // Separate comment lines from content
  const glossaryTags: GlossaryTag[] = [];
  const textLines: string[] = [];
  let originalText: string | undefined;

  const isTranslation = language !== 'original';

  for (const line of contentLines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Check for glossary links in comment
    if (trimmed.startsWith('%%') && trimmed.endsWith('%%') && trimmed.includes('[#')) {
      const tagMatches = trimmed.matchAll(/\[#([^\]]+)\]\([^)]*\/_glossary\/([^)]+)\.md\)/g);
      for (const match of tagMatches) {
        glossaryTags.push({
          id: match[2].split('/').pop() || match[1],
          name: match[1],
        });
      }
      continue;
    }

    // Check for original text in comment (for translations)
    if (isTranslation && trimmed.startsWith('%%') && trimmed.endsWith('%%')) {
      const inner = trimmed.slice(2, -2).trim();
      // Skip role annotations (RSR:, LAN:, etc.) and version markers
      if (!inner.match(/^[A-Z]{2,3}:/) && !inner.match(/^\d{4}-\d{2}-\d{2}/) && !inner.match(/^v\d/)) {
        originalText = inner;
        continue;
      }
    }

    // Skip other comment lines
    if (trimmed.startsWith('%%')) continue;

    // Regular content
    textLines.push(line);
  }

  const text = textLines.join('\n').trim();
  if (!text) return null;

  // Check if header
  const headerMatch = text.match(/^(#{1,6})\s+(.+)/);
  const isHeader = !!headerMatch;
  const headerLevel = headerMatch ? headerMatch[1].length : 0;

  // Convert to HTML
  const { html } = processTextToHtml(text);

  return {
    id,
    text,
    html,
    originalText,
    isHeader,
    headerLevel,
    glossaryTags: glossaryTags.length > 0 ? glossaryTags : undefined,
  };
}

/**
 * Create a summary paragraph from old format section
 */
function createOldFormatSummaryParagraph(
  carnet: string,
  paraNum: number,
  header: string | null,
  contentLines: string[]
): SummaryParagraph | null {
  const id = `SUM.${carnet}.${String(paraNum).padStart(4, '0')}`;

  // Process header
  let isHeader = false;
  let headerLevel = 0;

  if (header) {
    const headerMatch = header.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      isHeader = true;
      headerLevel = headerMatch[1].length;
    }
  }

  // Build text
  let text = '';
  if (header) {
    text = header;
  }
  if (contentLines.length > 0) {
    const bodyText = contentLines.join('\n');
    text = text ? text + '\n\n' + bodyText : bodyText;
  }

  if (!text) return null;

  const { html } = processTextToHtml(text);

  return {
    id,
    text,
    html,
    isHeader,
    headerLevel,
  };
}

// ============================================
// NAVIGATION AND LANGUAGE UTILITIES
// ============================================

/**
 * Get navigation info for an entry (prev/next)
 */
export function getEntryNavigation(carnetId: string, entryDate: string, language: string = 'original'): {
  prev: string | null;
  next: string | null;
} {
  const entries = getCarnetEntries(carnetId, language);
  const index = entries.indexOf(entryDate);

  return {
    prev: index > 0 ? entries[index - 1] : null,
    next: index < entries.length - 1 ? entries[index + 1] : null,
  };
}

/**
 * Check if a translation exists for an entry
 */
export function hasTranslation(carnetId: string, entryDate: string, language: string): boolean {
  if (language === 'original') return true;

  const entryPath = path.join(CONTENT_ROOT, language, carnetId, `${entryDate}.md`);
  return fs.existsSync(entryPath);
}

/**
 * Get available languages for an entry
 *
 * NOTE: Returns content path codes ('cz', 'fr', 'en'), not UI locale codes.
 * Use contentPathToLocale() from i18n/index.ts if you need locale codes.
 */
export function getAvailableLanguages(carnetId: string, entryDate: string): string[] {
  const languages = ['original'];

  // Check for Czech (note: 'cz' is the content path, 'cs' is the UI locale)
  if (fs.existsSync(path.join(CONTENT_ROOT, 'cz', carnetId, `${entryDate}.md`))) {
    languages.push('cz');
  }

  return languages;
}

// ============================================
// CARNET 000 SPECIAL HANDLING (Preface)
// ============================================

/**
 * Check if Carnet 000 (preface) has content
 */
export function hasCarnet000Content(language: string = 'original'): boolean {
  const entries = getCarnetEntries('000', language);
  return entries.length > 0;
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use hasCarnet000Content() instead
 */
export function hasBook00Content(language: string = 'original'): boolean {
  return hasCarnet000Content(language);
}

/**
 * Alias for hasCarnet000Content with clearer naming
 */
export function hasPrefaceContent(language: string = 'original'): boolean {
  return hasCarnet000Content(language);
}

/**
 * Get Carnet 000 (preface) as a single merged entry
 */
export function getCarnet000Merged(language: string = 'original'): DiaryEntry | null {
  const entries = getCarnetEntries('000', language);
  if (entries.length === 0) return null;

  const allParagraphs: Paragraph[] = [];
  const allFootnotes: Footnote[] = [];
  let title = 'Preface';

  for (const entryId of entries.sort()) {
    const entry = getEntry('000', entryId, language);
    if (entry) {
      if (entryId === entries[0]) {
        title = entry.title;
      }
      allParagraphs.push(...entry.paragraphs);
      for (const fn of entry.footnotes) {
        if (!allFootnotes.some(f => f.id === fn.id)) {
          allFootnotes.push(fn);
        }
      }
    }
  }

  return {
    id: 'preface',
    carnet: '000',
    language,
    date: null,
    title,
    content: '',
    paragraphs: allParagraphs,
    footnotes: allFootnotes,
    isSection: true,
  };
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use getCarnet000Merged() instead
 */
export function getBook00Merged(language: string = 'original'): DiaryEntry | null {
  return getCarnet000Merged(language);
}

/**
 * Alias for getCarnet000Merged with clearer naming
 */
export function getPrefaceMerged(language: string = 'original'): DiaryEntry | null {
  return getCarnet000Merged(language);
}

/**
 * Check if Carnet 000 (preface) translation exists
 */
export function hasCarnet000Translation(language: string): boolean {
  if (language === 'original') return true;
  return hasCarnet000Content(language);
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use hasCarnet000Translation() instead
 */
export function hasBook00Translation(language: string): boolean {
  return hasCarnet000Translation(language);
}

/**
 * Alias for hasCarnet000Translation with clearer naming
 */
export function hasPrefaceTranslation(language: string): boolean {
  return hasCarnet000Translation(language);
}

// ============================================
// YEAR-BASED NAVIGATION FUNCTIONS
// ============================================

export interface YearInfo {
  year: number;
  carnets: string[];         // Carnet IDs that have entries this year
  entryCount: number;        // Total entries in this year
  marieAge: string;          // e.g., "14–15"
  dateRange: { start: Date; end: Date };
}

/**
 * Calculate Marie's age for a given year
 * Marie was born November 11, 1858 (though she claimed 1859)
 */
function getMarieAge(year: number): string {
  // Marie was born in 1858, so in 1873 she was 14-15
  const ageAtStart = year - 1858 - 1; // Age at start of year
  const ageAtEnd = year - 1858;       // Age by end of year (after Nov 11)
  return `${ageAtStart}–${ageAtEnd}`;
}

/**
 * Get all years that have diary entries
 */
export function getYears(language: string = 'original'): YearInfo[] {
  const carnets = getCarnets(language);
  const yearMap = new Map<number, { carnets: Set<string>; entries: number; minDate: Date; maxDate: Date }>();

  for (const carnet of carnets) {
    if (!carnet.dateRange) continue; // Skip non-date carnets (like 000)

    // Get all entries in this carnet
    const entries = getCarnetEntries(carnet.id, language);

    for (const entryId of entries) {
      if (!DATE_PATTERN.test(entryId)) continue;

      const date = parseDateFromEntryId(entryId);
      const year = date.getFullYear();

      if (!yearMap.has(year)) {
        yearMap.set(year, {
          carnets: new Set(),
          entries: 0,
          minDate: date,
          maxDate: date,
        });
      }

      const yearData = yearMap.get(year)!;
      yearData.carnets.add(carnet.id);
      yearData.entries++;
      if (date < yearData.minDate) yearData.minDate = date;
      if (date > yearData.maxDate) yearData.maxDate = date;
    }
  }

  // Convert map to array and sort by year
  const years: YearInfo[] = [];
  for (const [year, data] of yearMap) {
    years.push({
      year,
      carnets: Array.from(data.carnets).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)),
      entryCount: data.entries,
      marieAge: getMarieAge(year),
      dateRange: { start: data.minDate, end: data.maxDate },
    });
  }

  return years.sort((a, b) => a.year - b.year);
}

/**
 * Get carnets that have entries in a specific year
 */
export function getCarnetsByYear(year: number, language: string = 'original'): CarnetInfo[] {
  const carnets = getCarnets(language);
  const result: CarnetInfo[] = [];

  for (const carnet of carnets) {
    if (!carnet.dateRange) continue;

    // Check if carnet has any entries in this year
    const entries = getCarnetEntries(carnet.id, language);
    const yearEntries = entries.filter(e => {
      if (!DATE_PATTERN.test(e)) return false;
      return new Date(e).getFullYear() === year;
    });

    if (yearEntries.length > 0) {
      // Create a modified CarnetInfo with only entries from this year
      const dates = yearEntries.map(e => new Date(e));
      result.push({
        id: carnet.id,
        language: carnet.language,
        entries: yearEntries,
        dateRange: {
          start: new Date(Math.min(...dates.map(d => d.getTime()))),
          end: new Date(Math.max(...dates.map(d => d.getTime()))),
        },
      });
    }
  }

  return result.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
}

/**
 * Get all entries from a specific year (across all carnets)
 */
export function getEntriesByYear(year: number, language: string = 'original'): Array<{ carnet: string; entryId: string; date: Date }> {
  const carnets = getCarnets(language);
  const entries: Array<{ carnet: string; entryId: string; date: Date }> = [];

  for (const carnet of carnets) {
    if (!carnet.dateRange) continue;

    const carnetEntries = getCarnetEntries(carnet.id, language);
    for (const entryId of carnetEntries) {
      if (!DATE_PATTERN.test(entryId)) continue;
      const date = parseDateFromEntryId(entryId);
      if (date.getFullYear() === year) {
        entries.push({ carnet: carnet.id, entryId, date });
      }
    }
  }

  // Sort by date
  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Check if a carnet spans multiple years
 */
export function isCarnetCrossYear(carnetId: string, language: string = 'original'): { crossYear: boolean; years: number[] } {
  const entries = getCarnetEntries(carnetId, language);
  const years = new Set<number>();

  for (const entryId of entries) {
    if (DATE_PATTERN.test(entryId)) {
      years.add(parseDateFromEntryId(entryId).getFullYear());
    }
  }

  return {
    crossYear: years.size > 1,
    years: Array.from(years).sort(),
  };
}

/**
 * Get year info for a specific year
 */
export function getYearInfo(year: number, language: string = 'original'): YearInfo | null {
  const years = getYears(language);
  return years.find(y => y.year === year) || null;
}

// ============================================
// GLOSSARY FUNCTIONS
// ============================================

/**
 * Get glossary path for a language
 */
function getGlossaryPath(language: string = 'original'): string {
  if (language === 'original' || language === 'original') {
    return path.join(CONTENT_ROOT, 'original', '_glossary');
  }
  return path.join(CONTENT_ROOT, language, '_glossary');
}

/**
 * Recursively find all glossary entry files
 */
function findGlossaryFiles(dirPath: string): { id: string; path: string; category: string }[] {
  const results: { id: string; path: string; category: string }[] = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const processDir = (dir: string, categoryPath: string = '') => {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('_')) {
        const newCategory = categoryPath ? `${categoryPath}/${item}` : item;
        processDir(fullPath, newCategory);
      } else if (item.endsWith('.md') && !item.startsWith('_')) {
        results.push({
          id: item.replace('.md', ''),
          path: fullPath,
          category: categoryPath,
        });
      }
    }
  };

  processDir(dirPath);
  return results;
}

/**
 * Get all glossary entries (sorted alphabetically)
 */
export function getGlossaryEntries(language: string = 'original'): GlossaryEntry[] {
  const glossaryPath = getGlossaryPath(language);
  const files = findGlossaryFiles(glossaryPath);

  return files
    .map(file => getGlossaryEntryFromPath(file.path, file.category))
    .filter((e): e is GlossaryEntry => e !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a single glossary entry by ID (searches recursively)
 */
export function getGlossaryEntry(id: string, language: string = 'original'): GlossaryEntry | null {
  const glossaryPath = getGlossaryPath(language);
  const files = findGlossaryFiles(glossaryPath);

  const file = files.find(f => f.id === id);
  if (!file) {
    return null;
  }

  return getGlossaryEntryFromPath(file.path, file.category);
}

/**
 * Parse a glossary entry from a file path
 */
function getGlossaryEntryFromPath(filePath: string, category: string): GlossaryEntry | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const id = path.basename(filePath, '.md');

  // Check for YAML frontmatter (new format)
  const hasFrontmatter = content.startsWith('---\n');
  let metadata: Record<string, unknown> = {};
  let bodyContent = content;

  if (hasFrontmatter) {
    const endIdx = content.indexOf('\n---\n', 4);
    if (endIdx !== -1) {
      try {
        const yamlStr = content.substring(4, endIdx);
        // Simple YAML parsing for common fields (handles arrays too)
        const lines = yamlStr.split('\n');
        let currentKey: string | null = null;
        let currentArray: string[] | null = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Check for array item (  - value)
          const arrayItemMatch = line.match(/^\s+-\s+(.+)$/);
          if (arrayItemMatch && currentKey && currentArray) {
            currentArray.push(arrayItemMatch[1].trim());
            continue;
          }

          // Save previous array if we're starting a new key
          if (currentKey && currentArray) {
            metadata[currentKey] = currentArray;
            currentKey = null;
            currentArray = null;
          }

          // Check for key: value
          const match = line.match(/^(\w+):\s*(.*)$/);
          if (match) {
            const key = match[1];
            const value = match[2].trim();

            // Check if next line is an array item (to detect array start)
            const nextLine = lines[i + 1];
            const isArrayStart = value === '' && nextLine && /^\s+-\s+/.test(nextLine);

            if (isArrayStart) {
              // Start array mode
              currentKey = key;
              currentArray = [];
            } else if (value !== '') {
              // Regular key: value - remove quotes if present
              metadata[key] = value.replace(/^["']|["']$/g, '');
            }
            // If value is empty and not an array start, skip (no value to store)
          }
        }

        // Save last array if any
        if (currentKey && currentArray) {
          metadata[currentKey] = currentArray;
        }

        bodyContent = content.substring(endIdx + 5);
      } catch {
        // Fall back to old format parsing
      }
    }
  }

  // Check for paragraph clusters (GLO_ prefixed IDs)
  const hasParaClusters = /%%\s*GLO_[A-Z0-9_]+\.\d+\s*%%/.test(bodyContent);

  // Extract name
  let name = (metadata.name as string) || id.replace(/_/g, ' ');
  if (!metadata.name) {
    const nameMatch = bodyContent.match(/^#\s+(.+)$/m);
    if (nameMatch) name = nameMatch[1];
  }

  // Extract other metadata
  const type = (metadata.type as string) ||
    bodyContent.match(/\*\*Type\*\*:\s*(.+)/)?.[1]?.trim();
  const researchStatus = (metadata.research_status as string) ||
    bodyContent.match(/\*\*Research Status\*\*:\s*(.+)/)?.[1]?.trim();
  const lastUpdated = (metadata.last_updated as string) ||
    bodyContent.match(/\*\*Last Updated\*\*:\s*(.+)/)?.[1]?.trim();

  // Extract summary
  let summary: string | undefined;
  const lines = bodyContent.split('\n');
  let inMetadata = true;
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (line.startsWith('**') && line.includes(':')) continue;
    if (line.startsWith('%%')) continue;
    if (line.trim() === '') {
      inMetadata = false;
      continue;
    }
    if (!inMetadata && line.trim()) {
      summary = line.trim();
      break;
    }
  }

  const entry: GlossaryEntry = {
    id,
    name,
    type,
    category: (metadata.category as string) || category,
    researchStatus,
    lastUpdated,
    summary,
    content,
    hasParagraphClusters: hasParaClusters,
    // Language and pronunciation metadata
    languages: metadata.languages as string[] | undefined,
    originalScript: metadata.original_script as string | undefined,
    transliteration: metadata.transliteration as string | undefined,
    pronunciation: metadata.pronunciation as string | undefined,
  };

  // Parse paragraph clusters if present
  if (hasParaClusters) {
    entry.paragraphs = parseGlossaryParagraphs(bodyContent);
  }

  return entry;
}

/**
 * Parse paragraph clusters from glossary entry content
 */
function parseGlossaryParagraphs(content: string): GlossaryParagraph[] {
  const paragraphs: GlossaryParagraph[] = [];
  const idPattern = /%%\s*(GLO_[A-Z0-9_]+\.\d+)\s*%%/g;

  // Find all paragraph IDs and their positions
  const matches: { id: string; index: number }[] = [];
  let match;
  while ((match = idPattern.exec(content)) !== null) {
    matches.push({ id: match[1], index: match.index });
  }

  // Extract content for each paragraph
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : content.length;
    const paragraphContent = content.substring(start, end);

    const para = parseGlossaryParagraph(matches[i].id, paragraphContent);
    if (para) {
      paragraphs.push(para);
    }
  }

  return paragraphs;
}

/**
 * Parse a single glossary paragraph
 */
function parseGlossaryParagraph(id: string, content: string): GlossaryParagraph | null {
  const lines = content.split('\n');

  // Skip the ID line
  const contentLines = lines.slice(1);

  // Extract glossary tags from comment lines
  const glossaryTags: GlossaryTag[] = [];
  const textLines: string[] = [];

  for (const line of contentLines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Extract glossary links from comment line
    if (trimmed.startsWith('%%') && trimmed.endsWith('%%') && trimmed.includes('[#')) {
      const tagMatches = trimmed.matchAll(/\[#([^\]]+)\]\([^)]*\/_glossary\/([^)]+)\.md\)/g);
      for (const match of tagMatches) {
        glossaryTags.push({
          id: match[2].split('/').pop() || match[1],
          name: match[1],
        });
      }
      continue;
    }

    // Skip other comment lines (notes, etc.)
    if (trimmed.startsWith('%%')) continue;

    // Regular content
    textLines.push(line);
  }

  const text = textLines.join('\n').trim();
  if (!text) return null;

  // Check if header
  const headerMatch = text.match(/^(#{1,6})\s+(.+)/);
  const isHeader = !!headerMatch;
  const headerLevel = headerMatch ? headerMatch[1].length : 0;

  // Convert to HTML
  const { html } = processTextToHtml(text);

  return {
    id,
    text,
    html,
    isHeader,
    headerLevel,
    glossaryTags: glossaryTags.length > 0 ? glossaryTags : undefined,
  };
}

/**
 * Get glossary entries grouped by first letter
 */
export function getGlossaryByLetter(language: string = 'original'): Map<string, GlossaryEntry[]> {
  const entries = getGlossaryEntries(language);
  const grouped = new Map<string, GlossaryEntry[]>();

  for (const entry of entries) {
    const letter = entry.name.charAt(0).toUpperCase();
    if (!grouped.has(letter)) {
      grouped.set(letter, []);
    }
    grouped.get(letter)!.push(entry);
  }

  return grouped;
}

/**
 * Search glossary entries
 */
export function searchGlossary(query: string, language: string = 'original'): GlossaryEntry[] {
  const entries = getGlossaryEntries(language);
  const lowerQuery = query.toLowerCase();

  return entries.filter(entry =>
    entry.name.toLowerCase().includes(lowerQuery) ||
    entry.summary?.toLowerCase().includes(lowerQuery) ||
    entry.type?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// ENTRY PREVIEW FUNCTIONS
// ============================================

/**
 * Get a preview excerpt from an entry
 * Returns the first meaningful paragraph text, truncated to maxLength characters
 */
export function getEntryPreview(carnetId: string, entryId: string, language: string = 'original', maxLength: number = 150): string | null {
  const entry = getEntry(carnetId, entryId, language);
  if (!entry || entry.paragraphs.length === 0) {
    return null;
  }

  // Find the first paragraph with meaningful content
  // Skip very short paragraphs (like date headers, titles, or section markers)
  for (const paragraph of entry.paragraphs) {
    const text = paragraph.text.trim();

    // Skip empty, very short, TODO placeholders, or header-like content
    if (!text || text.length < 20 || text === 'TODO') {
      continue;
    }

    // Skip paragraphs that look like headers (e.g., "Carnet N° 1", date ranges)
    if (/^(Carnet|Sešit|Cahier)\s+N°?\s*\d+$/i.test(text)) {
      continue;
    }
    if (/^\[.*\]$/.test(text)) {
      // Editorial notes in brackets
      continue;
    }
    if (/^(Du|Od|From)\s+\d/.test(text)) {
      // Date ranges
      continue;
    }

    // Truncate to maxLength, breaking at word boundary
    if (text.length <= maxLength) {
      return text;
    }

    // Find the last space before maxLength
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.6) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  return null;
}

// ============================================
// "THIS DAY IN MARIE'S LIFE" FUNCTIONS
// ============================================

/**
 * Information about a diary entry for "This Day in Marie's Life" feature
 */
export interface ThisDayEntry {
  date: string;           // Full date: "1873-02-04"
  year: number;           // Year: 1873
  carnet: string;         // Carnet ID: "001"
  preview: string;        // Preview excerpt from entry (in target language)
  marieAge: number;       // Marie's age at this entry
  hasTranslation: boolean; // Whether translation exists for this entry
}

/**
 * Map of MM-DD -> array of entries for that day across all years
 */
export type ThisDayData = Record<string, ThisDayEntry[]>;

/**
 * Calculate Marie's age at a given date
 * Marie was born November 11, 1858
 */
function calculateMarieAge(date: Date): number {
  const birthYear = 1858;
  const birthMonth = 10; // November (0-indexed)
  const birthDay = 11;

  let age = date.getFullYear() - birthYear;

  // Adjust if birthday hasn't occurred yet in the given year
  if (date.getMonth() < birthMonth ||
      (date.getMonth() === birthMonth && date.getDate() < birthDay)) {
    age--;
  }

  return age;
}

/**
 * Build a complete map of all diary entries by month-day
 * Used to generate "This Day in Marie's Life" data at build time
 *
 * @param language - Target language for previews (defaults to 'original')
 * @returns Map of "MM-DD" -> array of entries for that day
 */
export function buildThisDayData(language: string = 'original'): ThisDayData {
  const data: ThisDayData = {};
  const carnets = getCarnets('original');

  for (const carnet of carnets) {
    if (!carnet.dateRange) continue; // Skip non-date carnets (like 000)

    const entries = getCarnetEntries(carnet.id, 'original');

    for (const entryId of entries) {
      // Skip non-date entries
      if (!/^\d{4}-\d{2}-\d{2}/.test(entryId)) continue;

      // Extract month-day key (e.g., "02-04" for February 4)
      const [year, month, day] = entryId.split('-').slice(0, 3);
      const monthDay = `${month}-${day}`;
      const fullDate = `${year}-${month}-${day}`;
      const dateObj = new Date(fullDate);
      const yearNum = parseInt(year, 10);

      // Get preview in the target language if available, otherwise from original
      const translationExists = hasTranslation(carnet.id, entryId, language);
      const previewLang = translationExists ? language : 'original';
      const preview = getEntryPreview(carnet.id, entryId, previewLang, 200);

      // Skip entries without meaningful content
      if (!preview) continue;

      // Initialize array for this month-day if needed
      if (!data[monthDay]) {
        data[monthDay] = [];
      }

      data[monthDay].push({
        date: fullDate,
        year: yearNum,
        carnet: carnet.id,
        preview,
        marieAge: calculateMarieAge(dateObj),
        hasTranslation: translationExists,
      });
    }
  }

  // Sort entries within each day by year
  for (const monthDay of Object.keys(data)) {
    data[monthDay].sort((a, b) => a.year - b.year);
  }

  return data;
}

/**
 * Get entries for a specific month-day
 *
 * @param monthDay - Format "MM-DD" (e.g., "02-04" for February 4)
 * @param language - Target language for previews
 * @returns Array of entries for that day, or empty array if none
 */
export function getThisDayEntries(monthDay: string, language: string = 'original'): ThisDayEntry[] {
  const data = buildThisDayData(language);
  return data[monthDay] || [];
}
