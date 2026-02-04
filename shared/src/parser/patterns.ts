/**
 * Regex patterns used for parsing diary entries
 */

/**
 * Paragraph ID pattern: %% 00.03 %% or %% 001.0001 %% or %% GLO_VISCONTI.0001 %% or %% SUM.001.0001 %%
 * Supported prefixes:
 * - Numeric (2-3 digits): diary entries (e.g., 001.0001)
 * - GLO_: glossary entries (e.g., GLO_VISCONTI.0001)
 * - SUM.: carnet summaries (e.g., SUM.001.0001)
 * Note: GLO_ IDs use CAPITAL_ASCII format [A-Z0-9_]+ (no accents or special characters)
 */
export const PARAGRAPH_ID_PATTERN = /^%%\s*((?:\d{2,3}|GLO_[A-Z0-9_]+|SUM\.\d{3}))\.(\d+)\s*%%$/;

/** Note pattern: %% 2025-12-07T16:00:00 LAN: "A quoi bon" - idiomatic expression... %% */
/** Also handles ISO format with milliseconds and timezone: 2025-12-07T16:00:00.000Z */
export const NOTE_PATTERN =
  /^%%\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s+([A-Z]+):\s*(.*)\s*%%$/;

/** Timestamp pattern for notes (without %% markers) */
/** Also handles ISO format with milliseconds and timezone */
export const TIMESTAMP_PATTERN =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s+([A-Z]+):\s+(.+)$/;

/** Glossary pattern: [#Person](path/to/glossary.md) */
export const GLOSSARY_PATTERN = /\[#([^\]]+)\]\(([^)]+)\)/g;

/** Footnote reference pattern: [^1] */
export const FOOTNOTE_REF_PATTERN = /\[\^([^\]]+)\]/g;

/** Footnote definition pattern: [^1]: Definition text */
export const FOOTNOTE_DEF_PATTERN = /^\[\^([^\]]+)\]:\s*(.+)$/;

/** Header pattern: # Header or ## Subheader */
export const HEADER_PATTERN = /^(#{1,6})\s+(.+)$/;

/** Translation version pattern: %% v1.2 translated text %% */
export const VERSION_PATTERN = /^%%\s*v([\d._-]+)\s+(.+)\s*%%$/;

/** Original text in comment (no version prefix) */
export const ORIGINAL_COMMENT_PATTERN = /^%%\s*([^v].+|v[^0-9].*)\s*%%$/;

/** Old comment format: [//]: # ( comment content ) */
export const OLD_COMMENT_PATTERN = /^\[\/\/\]: # \((.*?)\)$/s;

/** New Obsidian inline format: %% comment content %% */
export const NEW_INLINE_PATTERN = /^%%\s*([^%\n]+?)\s*%%$/;

/** ISO date pattern in filenames: YYYY-MM-DD */
export const DATE_FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}/;

/** Section pattern for Carnet 000: 000-01.md */
export const SECTION_PATTERN = /^\d{2}-\d{2}\.md$/;

/**
 * Paragraph ID pattern (content only, no %% markers): 00.01 or GLO_VISCONTI.0001 or SUM.001.0001
 * Note: GLO_ IDs use CAPITAL_ASCII format [A-Z0-9_]+ (no accents or special characters)
 */
export const PARAGRAPH_ID_CONTENT_PATTERN = /^(?:\d+|GLO_[A-Z0-9_]+|SUM\.\d{3})\.\d+$/;

/**
 * Summary paragraph ID pattern: %% SUM.001.0001 %%
 * Format: SUM.{3-digit carnet}.{4-digit sequence}
 */
export const SUMMARY_PARA_ID_PATTERN = /^%%\s*(SUM\.\d{3})\.(\d+)\s*%%$/;

/** Highlight pattern: ==highlighted text== */
export const HIGHLIGHT_PATTERN = /==([^=]+)==/g;

/** Italic pattern: *text* or _text_ */
export const ITALIC_STAR_PATTERN = /\*([^*]+)\*/g;
export const ITALIC_UNDERSCORE_PATTERN = /(?<!\w)_([^_]+)_(?!\w)/g;

/**
 * Check if a line is a comment line (starts with %% or is a footnote definition)
 */
export function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('%%')) return true;
  if (trimmed.startsWith('[^')) return true;
  return false;
}

/**
 * Remove all %% comment markers from text, leaving clean content
 */
export function stripCommentMarkers(text: string): string {
  // Remove entire %%...%% inline comments
  let result = text.replace(/%%[^%]*%%/g, '');
  // Remove any remaining %% markers
  result = result.replace(/%%/g, '');
  return result.trim();
}

/**
 * Strip all comments (both old and new format) from content
 */
export function stripAllComments(content: string): string {
  // Strip old format comments
  let result = content.replace(/\[\/\/\]: # \(.*?\)/gs, '');

  // Strip new inline comments: %% ... %% (with optional spaces)
  result = result.replace(/%%\s*[^%\n]+?\s*%%/g, '');

  // Strip new block comments: %%\n...\n%%
  result = result.replace(/%%\n.*?\n%%/gs, '');

  return result;
}

/**
 * Extract comment content from a line (either old or new format)
 * Returns [content, format] or null if not a comment
 */
export function extractCommentContent(
  line: string
): [string, 'old' | 'new'] | null {
  const trimmed = line.trim();

  // Try old format: [//]: # ( ... )
  const oldMatch = OLD_COMMENT_PATTERN.exec(trimmed);
  if (oldMatch) {
    return [oldMatch[1].trim(), 'old'];
  }

  // Try new format: %%...%%
  const newMatch = NEW_INLINE_PATTERN.exec(trimmed);
  if (newMatch) {
    return [newMatch[1].trim(), 'new'];
  }

  return null;
}

/**
 * Check if content is a paragraph ID (e.g., "01.23")
 */
export function isParagraphId(content: string): boolean {
  return PARAGRAPH_ID_CONTENT_PATTERN.test(content.trim());
}

/**
 * Check if content is a timestamped note
 */
export function isTimestampedNote(content: string): boolean {
  return TIMESTAMP_PATTERN.test(content.trim());
}

/**
 * Check if content contains glossary links
 */
export function hasGlossaryLinks(content: string): boolean {
  return /#\w+/.test(content);
}
