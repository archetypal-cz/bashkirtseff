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
  MARIE_BIRTH_YEAR,
  MARIE_BIRTH_MONTH,
  MARIE_BIRTH_DAY,
  extractLanguagesFromTags,
  parseFrontmatter,
} from '@bashkirtseff/shared';

import { THEME_SUBCATEGORIES } from './glossary-categories';

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
  wordCount: number;   // Total words in the entry (from paragraph text)
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
  aliases?: string[];          // Alternative names/spellings
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

// Known annotation role codes that appear in %% comments (audit issue L8).
// The original heuristic treated ANY `[A-Z]{2,3}:` as an annotation, which
// silently dropped French original lines containing things like "Louis XIV:",
// "OUT:", "BUT:" etc. Anchor to the real role codes instead. These are the
// codes used across the project: Researcher, Linguistic, Translator, Editor,
// Conductor, Project-Assistant, Gemini, Perplexity, Opus-editor, French-editor,
// Reviewer. An annotation is `%% [TIMESTAMP ]ROLE: …%%`, so we require the role
// token to sit at the very start of the comment body (optionally after a
// timestamp), followed by a colon.
const KNOWN_ROLE_CODES = '(?:RSR|LAN|TR|RED|CON|PA|GEM|PPX|OPS|FRE|REV)';
// Role at start of comment body: `%% RSR: …` (timestamps are filtered separately
// by the leading-date check, which also covers `%% 2025-…T… RSR: …`).
const ROLE_ANNOTATION_PATTERN = new RegExp(`^%%\\s*${KNOWN_ROLE_CODES}:`);

/**
 * Check if language code refers to the original French content
 * Accepts both 'original' and '_original' for compatibility
 */
function isOriginalLanguage(language: string): boolean {
  return language === 'original' || language === '_original';
}

/**
 * Get the directory path for original content
 */
const ORIGINAL_DIR = '_original';

/**
 * Parse a date from an entry ID.
 *
 * Handles extended formats like "1874-02-14-15" (multi-day entries) or
 * "1878-10-04-evening" by extracting just the YYYY-MM-DD portion.
 *
 * Timezone note (audit issue M8): `new Date('YYYY-MM-DD')` parses to UTC
 * midnight, but downstream callers historically read it back with LOCAL
 * accessors (`getFullYear()`/`getMonth()`), so on a build machine west of UTC
 * a `YYYY-01-01` entry was attributed to the previous year. The returned Date
 * is still UTC-midnight; callers that need the calendar year/month MUST use the
 * UTC accessors or the string helper `getEntryYear()` below.
 */
function parseDateFromEntryId(entryId: string): Date {
  // Extract just the first 3 parts (YYYY-MM-DD)
  const datePart = entryId.split('-').slice(0, 3).join('-');
  return new Date(`${datePart}T00:00:00Z`);
}

/**
 * Extract the calendar year from an entry ID by string arithmetic.
 * Timezone-independent (audit issue M8) — the entry ID already *is* the date.
 */
function getEntryYear(entryId: string): number {
  return parseInt(entryId.slice(0, 4), 10);
}

// ============================================
// BUILD-TIME CACHES (audit issues H4/H5)
// ============================================
//
// During a static build the content on disk is immutable, so the same
// directory listings and parsed files are read thousands of times across the
// ~35k generated pages. These module-level Maps memoize that work, mirroring
// the existing `_usageCountsCache` pattern below.
//
// DEV-MODE STRATEGY:
//   - Directory-listing caches (getCarnets / getCarnetEntries / glossary file
//     index) are ALWAYS on. They are cheap to populate and re-walking them
//     dominated build time; in `astro dev` a restart is only needed to pick up
//     newly added/removed *files* (rare during a writing session).
//   - Parsed-content caches (getEntry / getGlossaryEntry* / buildThisDayData)
//     are gated on `import.meta.env.PROD`. Astro dev does NOT invalidate this
//     module when a content `.md` file changes (these files are read via `fs`,
//     not imported through Vite), so caching parsed bodies in dev would serve
//     stale text until a server restart. Gating on PROD keeps dev edits live
//     while still giving the production build the full speedup.
//
// Mutation note: callers must treat cached return values as read-only. Audited
// 2026-06-12 — every consumer copies before mutating (`.map`/`.filter`/spread,
// or builds its own Map), so returning shared references is safe. If you add a
// caller that sorts/pushes a returned array in place, copy it first.
const CACHE_PARSED = import.meta.env?.PROD ?? false;

const _carnetsCache = new Map<string, CarnetInfo[]>();
const _carnetEntriesCache = new Map<string, string[]>();
const _entryCache = new Map<string, DiaryEntry | null>();
const _thisDayCache = new Map<string, ThisDayData>();

// ============================================
// CARNET AND ENTRY FUNCTIONS
// ============================================

/**
 * Get all available carnets for a language
 */
export function getCarnets(language: string = 'original'): CarnetInfo[] {
  const cacheKey = isOriginalLanguage(language) ? '_original' : language;
  const cached = _carnetsCache.get(cacheKey);
  if (cached) return cached;
  const result = computeCarnets(language);
  _carnetsCache.set(cacheKey, result);
  return result;
}

function computeCarnets(language: string = 'original'): CarnetInfo[] {
  const langPath = isOriginalLanguage(language)
    ? path.join(CONTENT_ROOT, ORIGINAL_DIR)
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
 * Get all entries for a specific carnet
 */
export function getCarnetEntries(carnetId: string, language: string = 'original'): string[] {
  const langKey = isOriginalLanguage(language) ? '_original' : language;
  const cacheKey = `${langKey}/${carnetId}`;
  const cached = _carnetEntriesCache.get(cacheKey);
  if (cached) return cached;
  const result = computeCarnetEntries(carnetId, language);
  _carnetEntriesCache.set(cacheKey, result);
  return result;
}

function computeCarnetEntries(carnetId: string, language: string = 'original'): string[] {
  const carnetPath = isOriginalLanguage(language)
    ? path.join(CONTENT_ROOT, ORIGINAL_DIR, carnetId)
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
 * Load a single diary entry
 */
export function getEntry(carnetId: string, entryId: string, language: string = 'original'): DiaryEntry | null {
  if (CACHE_PARSED) {
    const langKey = isOriginalLanguage(language) ? '_original' : language;
    const cacheKey = `${langKey}/${carnetId}/${entryId}`;
    if (_entryCache.has(cacheKey)) return _entryCache.get(cacheKey)!;
    const result = computeEntry(carnetId, entryId, language);
    _entryCache.set(cacheKey, result);
    return result;
  }
  return computeEntry(carnetId, entryId, language);
}

function computeEntry(carnetId: string, entryId: string, language: string = 'original'): DiaryEntry | null {
  const entryPath = isOriginalLanguage(language)
    ? path.join(CONTENT_ROOT, ORIGINAL_DIR, carnetId, `${entryId}.md`)
    : path.join(CONTENT_ROOT, language, carnetId, `${entryId}.md`);

  if (!fs.existsSync(entryPath)) {
    return null;
  }

  const rawContent = fs.readFileSync(entryPath, 'utf-8');

  // Parse YAML frontmatter using shared utility
  const { metadata: frontmatter, content } = parseFrontmatter(rawContent);

  const lines = content.split('\n');

  // Get title from frontmatter, or find first non-empty line that is not part
  // of a %% comment. Comments can span multiple lines (`%% # Mercredi…\n…texte %%`),
  // so track open/close state — otherwise a French continuation line (ending in
  // the closing %%) leaks into the title.
  let title = frontmatter.title as string | undefined;
  if (!title) {
    let inComment = false;
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.length === 0 || trimmed.startsWith('---')) continue;
      const marks = (trimmed.match(/%%/g) || []).length;
      if (inComment) {
        if (marks % 2 === 1) inComment = false; // closing %% found on this line
        continue;
      }
      if (trimmed.startsWith('%%')) {
        if (marks % 2 === 1) inComment = true; // comment continues on later lines
        continue;
      }
      title = trimmed;
      break;
    }
    if (!title) title = entryId;
  }

  // Parse paragraphs and footnotes (using content without frontmatter)
  const paragraphs = parseParagraphs(content, language, entryPath);
  const footnotes = extractFootnotes(content, language);

  // Determine if this is a date-based or section-based entry
  const isSection = !DATE_PATTERN.test(entryId);
  const date = isSection ? null : parseDateFromEntryId(entryId);

  // Extract frontmatter metadata for aggregation
  const people = Array.isArray(frontmatter.people) ? frontmatter.people as string[] : undefined;
  const places = Array.isArray(frontmatter.places) ? frontmatter.places as string[] : undefined;
  const themes = Array.isArray(frontmatter.themes) ? frontmatter.themes as string[] : undefined;
  const location = typeof frontmatter.location === 'string' ? frontmatter.location : undefined;

  const wordCount = paragraphs.reduce((total, p) => {
    const trimmed = p.text.trim();
    if (trimmed === TODO_PLACEHOLDER) return total;
    if (trimmed.startsWith('# ')) return total;
    const clean = trimmed.replace(/^#+\s*/, '');
    return total + clean.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);

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
    wordCount,
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
    const pathParts = fullPath.split('/');
    const id = pathParts.pop() || fullPath;
    const category = pathParts[0] || undefined;
    // Avoid duplicates
    if (!tags.some(t => t.id === id)) {
      tags.push({ id, name, category });
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
 * Map a content-path language code to the URL prefix used for that language's
 * routes (e.g. '_original'/'original' → 'original', 'cz' → 'cz'). Glossary
 * routes live at `/{prefix}/glossary/{id}` (audit issue L4).
 */
function langUrlPrefix(language: string): string {
  return isOriginalLanguage(language) ? 'original' : language;
}

/**
 * Convert ==highlighted text== to HTML spans for foreign language emphasis
 * Also converts [^id] footnote refs to superscript links
 * Replaces TODO placeholder with em dash for display
 *
 * @param lang - content-path language code ('original', 'cz', …). Used to emit
 *   absolute glossary links `/{lang}/glossary/{id}` that survive trailing-slash
 *   (directory-format) entry URLs (audit issue L4). Defaults to 'original'.
 */
function processTextToHtml(text: string, lang: string = 'original'): { html: string; footnoteRefs: string[] } {
  const footnoteRefs: string[] = [];
  const glossaryPrefix = langUrlPrefix(lang);

  // Replace TODO placeholder with em dash for display
  if (text.trim() === TODO_PLACEHOLDER) {
    return { html: `<span class="untranslated">${TODO_DISPLAY}</span>`, footnoteRefs: [] };
  }

  let html = text
    // Convert # heading to HTML heading (entry date headers)
    .replace(/^#\s+(.+)$/gm, '<h2 class="entry-date-heading">$1</h2>')
    // Convert ==text== to highlighted span (foreign language)
    .replace(/==([^=]+)==/g, '<span class="foreign-text">$1</span>')
    // Convert [^id] to footnote link (supports both "1" and "00.03.1" formats)
    .replace(/\[\^([^\]]+)\]/g, (_, id) => {
      if (!footnoteRefs.includes(id)) {
        footnoteRefs.push(id);
      }
      // Display short version for readability
      const displayId = id.includes('.') ? id.split('.').pop() : id;
      return `<sup><a href="#fn-${id}" id="fnref-${id}" class="footnote-ref" aria-expanded="false">${displayId}</a></sup>`;
    })
    // Convert markdown links [text](url) to HTML anchors.
    // The URL pattern supports one level of nested parentheses (common in
    // Wikipedia URLs like https://en.wikipedia.org/wiki/Mignon_(opera)).
    .replace(/\[([^\]]+)\]\(((?:[^()]*|\([^()]*\))*)\)/g, (_, linkText, url) => {
      if (url.endsWith('.md')) {
        // Internal glossary link — extract the glossary ID from the path
        const glossaryId = url.match(/([^/]+)\.md$/)?.[1];
        if (glossaryId) {
          // Absolute, lang-prefixed glossary URL (audit issue L4). A relative
          // `../glossary/{id}` resolves wrong under directory-format entry URLs
          // like `/cz/001/1873-01-11/` (→ `/cz/001/glossary/{id}`, a 404).
          return `<a href="/${glossaryPrefix}/glossary/${glossaryId}" class="text-accent hover:text-accent-light underline">${linkText}</a>`;
        }
        return linkText;
      }
      return `<a href="${url}" target="_blank" rel="noopener" class="text-accent hover:text-accent-light underline">${linkText}</a>`;
    })
    // Convert **bold** to strong (must come before single * italic)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* and _italic_ to em
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');

  html = joinClusterLines(html);

  return { html, footnoteRefs };
}

/**
 * Join the physical source lines of a single paragraph cluster into display
 * HTML.
 *
 * A cluster can hold several source lines, and a bare "\n" between them means
 * different things that the source format does NOT disambiguate:
 *   - dialogue turns, each line starting with an em/en-dash or "- "  → hard break
 *   - blank-line-separated paragraphs (e.g. several days under one id) → para gap
 *   - soft wraps: prose split across lines — frequently only because an inline
 *     `%%comment%%` was placed mid-sentence, or because early carnets hard-wrap
 *     long paragraphs                                                  → REJOIN
 *
 * If we break on every newline, flowing prose gets hard-wrapped mid-sentence
 * (e.g. "…vedle maminky," / "která hledá…") and comment-split lines snap apart.
 * If we never break, dialogue and blank-separated entries merge into a wall of
 * text (the original bug, bashkirtseff.org/en/106/1884-09-13).
 *
 * So we break on the only two unambiguous signals — a leading dialogue dash and
 * a blank-line gap — and rejoin everything else with a space (the long-standing
 * default). Verse and title-page layouts that rely on bare newlines stay merged
 * as they were before; disambiguating those needs an explicit content marker.
 */
function joinClusterLines(html: string): string {
  // Normalize CRLF/CR so the line-by-line logic below (split on \n, endsWith
  // checks, blank-line regex) is not defeated by stray "\r" — a few source
  // files (e.g. a CRLF glossary entry) are not LF-normalized.
  html = html.replace(/\r\n?/g, '\n');
  // Collapse blank-line gaps (2+ newlines) to a paragraph-break placeholder so
  // the per-line pass below only sees genuine single newlines.
  const PARA = '\u0000\u0000'; // sentinel: NUL bytes never occur in source text
  html = html.replace(/\n[ \t]*(?:\n[ \t]*)+/g, PARA);

  const lines = html.split('\n');
  let out = lines[0] ?? '';
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const prev = lines[i - 1];
    const first = line.replace(/^\s+/, '').charAt(0);
    // Dialogue turn: em-dash, en-dash, or "- " at the start of the line.
    const isDialogue = first === '—' || first === '–' || /^\s*-\s/.test(line);
    if (prev.endsWith('</h2>')) {
      out += '\n' + line; // block <h2> heading manages its own spacing
    } else if (isDialogue) {
      out += '<br>\n' + line;
    } else {
      out += ' ' + line; // soft wrap / comment split / prose → rejoin
    }
  }
  return out
    .split(PARA)
    .join('<br><br>\n')
    // A block <h2> date heading manages its own spacing; drop any <br>(s) that
    // landed right after it (e.g. heading followed by a blank line then body),
    // keeping a bare newline so tag-stripping meta paths keep their separator.
    .replace(/(<\/h2>)(?:<br>\n?)+/g, '$1\n');
}

/**
 * Extract footnote definitions from content.
 *
 * Footnote bodies are run through `processTextToHtml` (audit issue L5) so that
 * markdown links `[text](url)` — including internal glossary `.md` links, which
 * become lang-prefixed `/{lang}/glossary/{id}` URLs (L4) — render as anchors
 * instead of leaking raw markdown into the page via `set:html`. (Footnote refs
 * `[^id]` inside a footnote body are not expected and are harmless.)
 *
 * @param lang - content-path language code, threaded into glossary link URLs.
 */
function extractFootnotes(content: string, lang: string = 'original'): Footnote[] {
  const footnotes: Footnote[] = [];
  const footnotePattern = /^\[\^([^\]]+)\]:\s*(.+)$/gm;

  let match;
  while ((match = footnotePattern.exec(content)) !== null) {
    const id = match[1];
    const { html } = processTextToHtml(match[2], lang);
    footnotes.push({ id, text: html });
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
function parseParagraphs(content: string, language: string, context?: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Split by paragraph ID markers: %%02.01%% or %% 02.01 %% or %%GLO_VISCONTI.0001%%
  const idPattern = /%%\s*((?:\d+|GLO_[A-Z0-9_]+)\.\d+)\s*%%/g;

  // Guard against silent content loss (audit issue C3): the translation parser
  // below only recognizes a paragraph-ID marker when it is ALONE on its own
  // line. If a bare `%% NNN.NNNN %%` marker is glued mid-line (together with
  // text, comments or other markers) every paragraph after it is dropped.
  // Warn loudly so this class of corruption can never go unnoticed again.
  // (The 'original' branch splits on the regex over the whole string and is
  // immune, but we still flag it because the data file is malformed.)
  if (language !== 'original') {
    const bareIdAnywhere = /%%\s*(?:\d+|GLO_[A-Z0-9_]+)\.\d+\s*%%/g;
    const standaloneBareId = /^\s*%%\s*(?:\d+|GLO_[A-Z0-9_]+)\.\d+\s*%%\s*$/;
    for (const line of content.split('\n')) {
      bareIdAnywhere.lastIndex = 0;
      let n = 0;
      while (bareIdAnywhere.exec(line) !== null) n++;
      if (n > 1 || (n === 1 && !standaloneBareId.test(line))) {
        console.warn(
          `[parseParagraphs] Mid-line paragraph ID detected${context ? ` in ${context}` : ''} — ` +
          `content after it will be DROPPED. Each "%% NNN.NNNN %%" marker must be alone on its own line. ` +
          `Offending line: ${line.slice(0, 120)}${line.length > 120 ? '…' : ''}`
        );
      }
    }
  }

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
      // Filter out annotation comments (audit issue L8). Anchored to KNOWN role
      // codes at the start of the comment body so French text containing
      // accidental "XX:" runs (e.g. "Louis XIV:", "OUT:") is NOT dropped.
      if (ROLE_ANNOTATION_PATTERN.test(trimmed)) return false;
      // Filter out glossary tags [#Name] and timestamped annotation lines
      // (e.g. `%% 2025-12-07T… RSR: …%%`) — the date prefix catches all
      // timestamped role notes regardless of role code.
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

      // French edition: the original text in comments IS the content.
      // If no visible text exists but we have original text, promote it.
      if (!text && language === 'fr' && currentOriginal) {
        text = currentOriginal;
      }

      if (text) {
        const { html, footnoteRefs } = processTextToHtml(text, language);
        const languages = extractLanguages(glossaryTags);
        paragraphs.push({
          id: currentId,
          text,
          html,
          originalText: language === 'fr' ? undefined : currentOriginal,
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
        const { html, footnoteRefs } = processTextToHtml(text, language);
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
// YEAR SUMMARY AGGREGATION
// ============================================

export interface YearSummary {
  year: number;
  peopleCounts: Record<string, number>;
  placesCounts: Record<string, number>;
  themeCounts: Record<string, number>;
  primaryLocation?: string;
}

/**
 * Get aggregated summary data for a year
 * Merges people, places, themes, and locations across all carnets in that year
 */
export async function getYearSummary(year: number, language: string = 'original'): Promise<YearSummary> {
  const carnetsInYear = getCarnetsByYear(year, language);

  const peopleCounts: Record<string, number> = {};
  const placesCounts: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};

  for (const carnetInfo of carnetsInYear) {
    const carnetSummary = await getCarnetSummary(carnetInfo.id, language);

    for (const [person, count] of Object.entries(carnetSummary.peopleCounts)) {
      peopleCounts[person] = (peopleCounts[person] || 0) + count;
    }
    for (const [place, count] of Object.entries(carnetSummary.placesCounts)) {
      placesCounts[place] = (placesCounts[place] || 0) + count;
    }
    for (const [theme, count] of Object.entries(carnetSummary.themeCounts)) {
      themeCounts[theme] = (themeCounts[theme] || 0) + count;
    }
    if (carnetSummary.primaryLocation) {
      locationCounts[carnetSummary.primaryLocation] = (locationCounts[carnetSummary.primaryLocation] || 0) + 1;
    }
  }

  let primaryLocation: string | undefined;
  let maxLocationCount = 0;
  for (const [loc, count] of Object.entries(locationCounts)) {
    if (count > maxLocationCount) {
      maxLocationCount = count;
      primaryLocation = loc;
    }
  }

  return {
    year,
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
  const langPath = isOriginalLanguage(language)
    ? path.join(CONTENT_ROOT, ORIGINAL_DIR)
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
  const langPath = isOriginalLanguage(language)
    ? path.join(CONTENT_ROOT, ORIGINAL_DIR)
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
            currentSection,
            language
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
        currentSection,
        language
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
  const { html } = processTextToHtml(text, language);

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
  contentLines: string[],
  language: string = 'original'
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

  const { html } = processTextToHtml(text, language);

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
  if (isOriginalLanguage(language)) return true;

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
  const languages = ['_original'];

  // Check all translation directories for this entry
  const translationDirs = ['cz', 'en', 'uk', 'fr'];
  for (const lang of translationDirs) {
    if (fs.existsSync(path.join(CONTENT_ROOT, lang, carnetId, `${entryDate}.md`))) {
      languages.push(lang);
    }
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
  let wordCount = 0;

  for (const entryId of entries.sort()) {
    const entry = getEntry('000', entryId, language);
    if (entry) {
      if (entryId === entries[0]) {
        title = entry.title;
      }
      allParagraphs.push(...entry.paragraphs);
      wordCount += entry.wordCount;
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
    wordCount,
  };
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
  if (isOriginalLanguage(language)) return true;
  return hasCarnet000Content(language);
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
 * Calculate Marie's age range for a given calendar year.
 *
 * Uses her REAL birth date (1858-11-24 N.S.) — see MARIE_BIRTH_* in
 * @bashkirtseff/shared and audit issue M9. Age range spans the year: before her
 * late-November birthday she is `year - birthYear - 1`, after it `year -
 * birthYear`.
 */
function getMarieAge(year: number): string {
  const ageAtStart = year - MARIE_BIRTH_YEAR - 1; // Age at start of year (before birthday)
  const ageAtEnd = year - MARIE_BIRTH_YEAR;       // Age by end of year (after birthday)
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
      const year = getEntryYear(entryId);

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
      return getEntryYear(e) === year;
    });

    if (yearEntries.length > 0) {
      // Create a modified CarnetInfo with only entries from this year
      const dates = yearEntries.map(e => parseDateFromEntryId(e));
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
      if (getEntryYear(entryId) === year) {
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
      years.add(getEntryYear(entryId));
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
  if (isOriginalLanguage(language)) {
    return path.join(CONTENT_ROOT, ORIGINAL_DIR, '_glossary');
  }
  return path.join(CONTENT_ROOT, language, '_glossary');
}

// Glossary caches (audit issue H4).
// - _glossaryFilesCache: directory-listing cache (always on), keyed by root path.
// - _glossaryEntryByPathCache: parsed GlossaryEntry per file path (PROD-gated).
// - _glossaryEntriesCache: full sorted entry list per glossary root (PROD-gated).
const _glossaryFilesCache = new Map<string, { id: string; path: string; category: string }[]>();
const _glossaryEntryByPathCache = new Map<string, GlossaryEntry | null>();
const _glossaryEntriesCache = new Map<string, GlossaryEntry[]>();

/**
 * Recursively find all glossary entry files (cached per glossary root).
 */
function findGlossaryFiles(dirPath: string): { id: string; path: string; category: string }[] {
  const cached = _glossaryFilesCache.get(dirPath);
  if (cached) return cached;
  const result = computeGlossaryFiles(dirPath);
  _glossaryFilesCache.set(dirPath, result);
  return result;
}

function computeGlossaryFiles(dirPath: string): { id: string; path: string; category: string }[] {
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

  // Build-time uniqueness check (audit issue M5): glossary IDs are derived from
  // filenames and are ASSUMED unique across the whole tree — getGlossaryEntry()
  // and the [id] routes key on the bare ID, so two files with the same basename
  // collide (one becomes unreachable; Astro emits route-conflict warnings).
  // Surface this loudly at build time so a duplicate can never ship silently.
  const seen = new Map<string, string>();
  for (const r of results) {
    const prev = seen.get(r.id);
    if (prev) {
      console.error(
        `[findGlossaryFiles] DUPLICATE glossary ID "${r.id}" — same ID in two files:\n` +
        `  - ${prev}\n  - ${r.path}\n` +
        `Glossary IDs must be unique across the whole tree (the [id] route and ` +
        `getGlossaryEntry() key on the bare ID). Rename or merge one of them.`
      );
    } else {
      seen.set(r.id, r.path);
    }
  }

  return results;
}

/**
 * Get all glossary entries (sorted alphabetically)
 */
export function getGlossaryEntries(language: string = 'original'): GlossaryEntry[] {
  const cacheKey = isOriginalLanguage(language) ? '_original' : language;
  if (CACHE_PARSED) {
    const cached = _glossaryEntriesCache.get(cacheKey);
    if (cached) return cached;
    const result = computeGlossaryEntries(language);
    _glossaryEntriesCache.set(cacheKey, result);
    return result;
  }
  return computeGlossaryEntries(language);
}

function computeGlossaryEntries(language: string = 'original'): GlossaryEntry[] {
  const glossaryPath = getGlossaryPath(language);
  const files = findGlossaryFiles(glossaryPath);

  return files
    .map(file => getGlossaryEntryFromPath(file.path, file.category, language))
    .filter((e): e is GlossaryEntry => e !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a single glossary entry by ID (searches recursively).
 *
 * @param language - which language tree to READ the entry file from.
 * @param linkLang - which language prefix to emit for in-prose glossary
 *   cross-reference links (audit issue L4). Defaults to `language`; the
 *   fallback loader passes the *display* language so an entry whose content
 *   comes from `_original` still links to `/{displayLang}/glossary/…`.
 */
export function getGlossaryEntry(id: string, language: string = 'original', linkLang: string = language): GlossaryEntry | null {
  const glossaryPath = getGlossaryPath(language);
  const files = findGlossaryFiles(glossaryPath);

  const file = files.find(f => f.id === id);
  if (!file) {
    return null;
  }

  return getGlossaryEntryFromPath(file.path, file.category, linkLang);
}

/**
 * Get a single glossary entry with language fallback.
 * Tries the specified language first, then falls back to original.
 */
export function getGlossaryEntryWithFallback(id: string, language: string): GlossaryEntry | null {
  if (!isOriginalLanguage(language)) {
    const translated = getGlossaryEntry(id, language);
    if (translated) return translated;
  }
  // Fall back to the original entry file, but keep `language` as the LINK
  // prefix so in-prose cross-references stay in the reader's language
  // (audit issue L4 — e.g. a /cz/glossary page links to /cz/glossary/…).
  return getGlossaryEntry(id, 'original', language);
}

/**
 * Get all glossary entries merged across a language and original.
 * Translated entries override originals (matched by ID).
 */
export function getMergedGlossaryEntries(language: string): GlossaryEntry[] {
  const originalEntries = getGlossaryEntries('original');
  if (isOriginalLanguage(language)) {
    return originalEntries;
  }

  const translatedEntries = getGlossaryEntries(language);
  if (translatedEntries.length === 0) {
    return originalEntries;
  }

  // Build map: translated entries override originals by ID
  const merged = new Map<string, GlossaryEntry>();
  for (const entry of originalEntries) {
    merged.set(entry.id, entry);
  }
  for (const entry of translatedEntries) {
    merged.set(entry.id, entry);
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Parse a glossary entry from a file path (parsed result cached per path+lang).
 *
 * `language` is the content-path code of the page the entry will render on; it
 * is threaded into in-prose glossary cross-reference links so they point at
 * `/{lang}/glossary/{id}` (audit issue L4). The cache key includes the language
 * because the rendered HTML's link prefixes differ per language.
 */
function getGlossaryEntryFromPath(filePath: string, category: string, language: string = 'original'): GlossaryEntry | null {
  if (CACHE_PARSED) {
    const cacheKey = `${langUrlPrefix(language)}::${filePath}`;
    if (_glossaryEntryByPathCache.has(cacheKey)) return _glossaryEntryByPathCache.get(cacheKey)!;
    const result = parseGlossaryEntryFromPath(filePath, category, language);
    _glossaryEntryByPathCache.set(cacheKey, result);
    return result;
  }
  return parseGlossaryEntryFromPath(filePath, category, language);
}

function parseGlossaryEntryFromPath(filePath: string, category: string, language: string = 'original'): GlossaryEntry | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const id = path.basename(filePath, '.md');

  // Parse YAML frontmatter with the shared, library-backed parser (audit issue
  // L2). This replaced a hand-rolled line parser that mishandled quoted values
  // (e.g. it left literal '"..."' wrappers on quoted aliases and coerced
  // "1881" → 1881). Verified against all 3,258 glossary files: only 6 differ,
  // and in every case the shared parser is the correct one. parseFrontmatter
  // returns `{}` + the full content when there is no frontmatter, matching the
  // previous fallthrough behaviour.
  const { metadata, content: bodyContent } = parseFrontmatter(content);

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
    content: bodyContent,
    hasParagraphClusters: hasParaClusters,
    // Language and pronunciation metadata
    languages: metadata.languages as string[] | undefined,
    originalScript: metadata.original_script as string | undefined,
    transliteration: metadata.transliteration as string | undefined,
    pronunciation: metadata.pronunciation as string | undefined,
    aliases: metadata.aliases as string[] | undefined,
  };

  // Parse paragraph clusters if present
  if (hasParaClusters) {
    entry.paragraphs = parseGlossaryParagraphs(bodyContent, language);
  }

  return entry;
}

/**
 * Parse paragraph clusters from glossary entry content.
 *
 * Headings (## / ###) that appear between paragraph clusters are extracted
 * as separate header paragraphs so they render as proper block-level
 * elements instead of being concatenated with the preceding paragraph's
 * body text.
 */
function parseGlossaryParagraphs(content: string, language: string = 'original'): GlossaryParagraph[] {
  const paragraphs: GlossaryParagraph[] = [];
  const idPattern = /%%\s*(GLO_[A-Z0-9_]+\.\d+)\s*%%/g;

  // Find all paragraph IDs and their positions
  const matches: { id: string; index: number }[] = [];
  let match;
  while ((match = idPattern.exec(content)) !== null) {
    matches.push({ id: match[1], index: match.index });
  }

  // Locate markdown headings (## through ######) in the content.
  // In glossary files, these sit between paragraph clusters as section
  // dividers (e.g. "## Overview", "### Historical Background") and need
  // to become their own GlossaryParagraph entries so the template renders
  // them as proper <h2>/<h3>/etc. elements.
  // Skip H1 headings — the entry title is rendered separately.
  const headingPattern = /^(#{2,6})\s+(.+)$/gm;
  const headings: { level: number; text: string; fullMatch: string; index: number }[] = [];
  let hMatch;
  while ((hMatch = headingPattern.exec(content)) !== null) {
    headings.push({
      level: hMatch[1].length,
      text: hMatch[2],
      fullMatch: hMatch[0],
      index: hMatch.index,
    });
  }

  // Build an ordered list of "segments": either a GLO_ID paragraph or a
  // standalone heading.
  type Segment =
    | { kind: 'para'; id: string; index: number }
    | { kind: 'heading'; level: number; text: string; fullMatch: string; index: number };

  const segments: Segment[] = [
    ...matches.map(m => ({ kind: 'para' as const, ...m })),
    ...headings.map(h => ({ kind: 'heading' as const, ...h })),
  ];

  // Sort all segments by their position in the source
  segments.sort((a, b) => a.index - b.index);

  // Derive a base ID prefix for synthetic heading IDs
  const baseId = matches.length > 0 ? matches[0].id.split('.')[0] : 'GLO_UNKNOWN';
  let syntheticCounter = 9000;

  // Walk segments and produce GlossaryParagraph objects.
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.kind === 'heading') {
      const syntheticId = `${baseId}.H${syntheticCounter++}`;
      const headerHtml = processTextToHtml(seg.text, language).html;

      paragraphs.push({
        id: syntheticId,
        text: seg.fullMatch,
        html: headerHtml,
        isHeader: true,
        headerLevel: seg.level,
      });

      // Capture any prose between this heading and the next segment
      const headingEnd = seg.index + seg.fullMatch.length;
      const nextSeg = segments[i + 1];
      const trailingEnd = nextSeg ? nextSeg.index : content.length;
      const trailingText = content.substring(headingEnd, trailingEnd).trim();
      if (trailingText) {
        const trailingId = `${baseId}.H${syntheticCounter++}`;
        const { html } = processTextToHtml(trailingText, language);
        paragraphs.push({
          id: trailingId,
          text: trailingText,
          html,
          isHeader: false,
          headerLevel: 0,
        });
      }

      continue;
    }

    // seg.kind === 'para'
    // Content runs from this GLO_ID to the next segment (heading or para)
    // or EOF.
    const nextSeg = segments[i + 1];
    const end = nextSeg ? nextSeg.index : content.length;
    const paragraphContent = content.substring(seg.index, end);

    const para = parseGlossaryParagraph(seg.id, paragraphContent, language);
    if (para) {
      paragraphs.push(para);
    }
  }

  return paragraphs;
}

/**
 * Parse a single glossary paragraph
 */
function parseGlossaryParagraph(id: string, content: string, language: string = 'original'): GlossaryParagraph | null {
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
  const { html } = processTextToHtml(text, language);

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
    entry.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery)) ||
    entry.summary?.toLowerCase().includes(lowerQuery) ||
    entry.type?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// GLOSSARY CATEGORY & USAGE FUNCTIONS
// ============================================

export interface GlossaryEntryBrief {
  id: string;
  name: string;
  summary?: string;
  usageCount: number;
}

export interface GlossaryCategoryGroup {
  topCategory: string;
  subCategory: string;
  categoryPath: string;
  count: number;
  entries: GlossaryEntryBrief[];
}

export interface GlossaryCategoryTree {
  name: string;
  totalCount: number;
  subCategories: GlossaryCategoryGroup[];
}

/**
 * Group glossary entries into a hierarchical category tree.
 * Splits culture/ into "culture" (arts & knowledge) and "themes" (daily life topics).
 * Includes entry data per subcategory for expandable browsing.
 */
export function getGlossaryByCategory(language: string = 'original', usageCounts?: Record<string, number>): GlossaryCategoryTree[] {
  // THEME_SUBCATEGORIES imported at top of file
  const entries = getGlossaryEntries(language);

  // Group entries by display category (splitting culture → culture + themes)
  const categoryMap = new Map<string, Map<string, GlossaryEntryBrief[]>>();

  for (const entry of entries) {
    const category = entry.category || 'uncategorized';
    const parts = category.split('/');
    const fsTopCat = parts[0] || 'uncategorized';
    const subCat = parts.slice(1).join('/') || '_root';

    // Split culture subcategories into culture vs themes
    let displayTopCat = fsTopCat;
    if (fsTopCat === 'culture' && THEME_SUBCATEGORIES.has(subCat)) {
      displayTopCat = 'themes';
    }

    if (!categoryMap.has(displayTopCat)) {
      categoryMap.set(displayTopCat, new Map());
    }
    const subMap = categoryMap.get(displayTopCat)!;
    if (!subMap.has(subCat)) {
      subMap.set(subCat, []);
    }
    subMap.get(subCat)!.push({
      id: entry.id,
      name: entry.name,
      summary: entry.summary,
      usageCount: usageCounts?.[entry.id] || 0,
    });
  }

  const categoryOrder = ['people', 'places', 'culture', 'themes'];
  const trees: GlossaryCategoryTree[] = [];

  for (const topCat of categoryOrder) {
    const subMap = categoryMap.get(topCat);
    if (!subMap) continue;

    const subCategories: GlossaryCategoryGroup[] = [];
    let totalCount = 0;

    for (const [subCat, subEntries] of subMap) {
      // Sort entries within subcategory by usage count desc, then name
      subEntries.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
      totalCount += subEntries.length;
      subCategories.push({
        topCategory: topCat,
        subCategory: subCat,
        categoryPath: subCat === '_root' ? topCat : `${topCat}/${subCat}`,
        count: subEntries.length,
        entries: subEntries,
      });
    }

    subCategories.sort((a, b) => b.count - a.count);
    trees.push({ name: topCat, totalCount, subCategories });
  }

  // Add remaining categories not in the predefined order
  for (const [topCat, subMap] of categoryMap) {
    if (categoryOrder.includes(topCat)) continue;
    const subCategories: GlossaryCategoryGroup[] = [];
    let totalCount = 0;
    for (const [subCat, subEntries] of subMap) {
      subEntries.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
      totalCount += subEntries.length;
      subCategories.push({
        topCategory: topCat,
        subCategory: subCat,
        categoryPath: subCat === '_root' ? topCat : `${topCat}/${subCat}`,
        count: subEntries.length,
        entries: subEntries,
      });
    }
    subCategories.sort((a, b) => b.count - a.count);
    trees.push({ name: topCat, totalCount, subCategories });
  }

  return trees;
}

// Cached usage counts to avoid re-scanning during multi-page build
let _usageCountsCache: Record<string, number> | null = null;

/**
 * Build glossary usage counts by scanning all diary entries for glossary links.
 * Result is cached in memory for the entire build process.
 */
export function buildGlossaryUsageCounts(): Record<string, number> {
  if (_usageCountsCache) return _usageCountsCache;

  const counts: Record<string, number> = {};

  // Scan all diary entry files for glossary links
  const originalDir = path.join(CONTENT_ROOT, '_original');
  const glossaryPattern = /\[#[^\]]*\]\([^)]*\/_glossary\/[^)]*\/([A-Z][A-Z0-9_]*)\.md\)/g;

  const scanDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) return;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item.startsWith('_') || item.startsWith('.')) continue;
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.md') && /^\d{4}-\d{2}-\d{2}\.md$/.test(item)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        let match;
        while ((match = glossaryPattern.exec(content)) !== null) {
          const id = match[1];
          counts[id] = (counts[id] || 0) + 1;
        }
        glossaryPattern.lastIndex = 0;
      }
    }
  };

  scanDir(originalDir);
  _usageCountsCache = counts;
  return counts;
}

// ============================================
// ENTRY PREVIEW FUNCTIONS
// ============================================

/**
 * Get a preview excerpt from an entry
 * Returns the first meaningful paragraph text, truncated to maxLength characters
 */
export function getEntryPreview(carnetId: string, entryId: string, language: string = 'original', maxLength: number = 150, preloadedEntry?: DiaryEntry | null): string | null {
  // H5: callers that already hold the parsed entry can pass it in to avoid a
  // redundant lookup. Otherwise we rely on the getEntry cache (H4/H5), so the
  // repeated lookup is effectively free during a production build.
  const entry = preloadedEntry !== undefined ? preloadedEntry : getEntry(carnetId, entryId, language);
  if (!entry || entry.paragraphs.length === 0) {
    return null;
  }

  // Find the first paragraph with meaningful content
  // Skip very short paragraphs (like date headers, titles, or section markers)
  for (const paragraph of entry.paragraphs) {
    // Strip footnote references like [^01.128.1] from preview text
    const text = paragraph.text.replace(/\[\^[^\]]+\]/g, '').trim();

    // Skip empty, very short, TODO placeholders, or header-like content
    if (!text || text.length < 20 || text === 'TODO') {
      continue;
    }

    // Skip paragraphs that look like headers (e.g., "Carnet N° 1", date ranges)
    if (/^(Carnet|Sešit|Cahier)\s+N°?\s*\d+$/i.test(text)) {
      continue;
    }
    if (/^#/.test(text)) {
      // Markdown headings (date headers, section titles)
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
 * Calculate Marie's age at a given date.
 *
 * Uses her REAL birth date (see MARIE_BIRTH_* in @bashkirtseff/shared, audit
 * issue M9). Takes the ISO date STRING (YYYY-MM-DD…) and does integer
 * arithmetic on the components, so it is fully timezone-independent (audit
 * issue M8 — the previous version used local `getMonth()/getDate()` on a
 * UTC-midnight Date, which shifted by a day west of UTC).
 */
function calculateMarieAge(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').slice(0, 3).map(n => parseInt(n, 10));

  let age = y - MARIE_BIRTH_YEAR;

  // Adjust if the birthday hasn't occurred yet in the given year
  if (m < MARIE_BIRTH_MONTH || (m === MARIE_BIRTH_MONTH && d < MARIE_BIRTH_DAY)) {
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
  if (CACHE_PARSED) {
    const cacheKey = isOriginalLanguage(language) ? '_original' : language;
    const cached = _thisDayCache.get(cacheKey);
    if (cached) return cached;
    const result = computeThisDayData(language);
    _thisDayCache.set(cacheKey, result);
    return result;
  }
  return computeThisDayData(language);
}

function computeThisDayData(language: string = 'original'): ThisDayData {
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
      const yearNum = parseInt(year, 10);

      // Get preview in the target language if available, otherwise from original
      const translationExists = hasTranslation(carnet.id, entryId, language);
      const previewLang = translationExists ? language : 'original';
      let preview = getEntryPreview(carnet.id, entryId, previewLang, 200);

      // Fallback to original if translation preview is empty
      if (!preview && previewLang !== 'original') {
        preview = getEntryPreview(carnet.id, entryId, 'original', 200);
      }

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
        marieAge: calculateMarieAge(fullDate),
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
