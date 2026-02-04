// Patterns
export {
  PARAGRAPH_ID_PATTERN,
  NOTE_PATTERN,
  TIMESTAMP_PATTERN,
  GLOSSARY_PATTERN,
  FOOTNOTE_REF_PATTERN,
  FOOTNOTE_DEF_PATTERN,
  HEADER_PATTERN,
  VERSION_PATTERN,
  ORIGINAL_COMMENT_PATTERN,
  OLD_COMMENT_PATTERN,
  NEW_INLINE_PATTERN,
  DATE_FILENAME_PATTERN,
  SECTION_PATTERN,
  PARAGRAPH_ID_CONTENT_PATTERN,
  HIGHLIGHT_PATTERN,
  ITALIC_STAR_PATTERN,
  ITALIC_UNDERSCORE_PATTERN,
  isCommentLine,
  stripCommentMarkers,
  stripAllComments,
  extractCommentContent,
  isParagraphId,
  isTimestampedNote,
  hasGlossaryLinks,
} from './patterns.js';

// Frontmatter
export type {
  FrontmatterResult,
  MarieAge,
  WorkflowStatus,
  EntryMetrics,
  EntryEntities,
  EntryMetadata,
} from './frontmatter.js';
export {
  parseFrontmatter,
  createFrontmatter,
  calculateMarieAge,
  extractDateFromFilename,
  detectLanguage,
} from './frontmatter.js';

// Parser
export { ParagraphParser, extractLanguagesFromGlossary } from './paragraph-parser.js';

// Glossary Parser
export { GlossaryParser, parseGlossaryEntry, parseGlossaryCategory } from './glossary-parser.js';
