// Validation
export {
  validateParagraphSequence,
  validateGlossaryLinks,
  validateCarnet,
  validateBook,
  renumberParagraphs,
} from './validation.js';

// Statistics
export type { EntryStatistics, CarnetStatistics, BookStatistics } from './statistics.js';
export {
  getEntryStatistics,
  getCarnetStatistics,
  getBookStatistics,
  findMissingTranslations,
  searchParagraphs,
  filterParagraphsByNoteType,
  generateTranslationReport,
  compareTranslationVersions,
  exportToTmx,
  countWords,
  countSentences,
} from './statistics.js';

// Glossary Manager
export type { GlossaryValidationStats } from './glossary-manager.js';
export { GlossaryManager } from './glossary-manager.js';

// Glossary References (reverse lookups)
export type { GlossaryReference, GlossaryUsageStats } from './glossary-references.js';
export { GlossaryReferences } from './glossary-references.js';

// Glossary Merge utilities
export type { MergeResult, MergeOptions, DuplicateCandidate } from './glossary-merge.js';
export {
  GLOSSARY_LINK_PATTERN,
  FRONTMATTER_ITEM_PATTERN,
  getAllContentFiles,
  findGlossaryFile,
  getGlossaryRelativePath,
  updateGlossaryLinks,
  updateFrontmatter,
  extractBodyContent,
  levenshteinDistance,
  mergeGlossaryEntries,
} from './glossary-merge.js';

// Sync utilities
export type {
  SyncOptions,
  SyncChange,
  EntrySyncResult,
  CarnetSyncResult,
  BookSyncResult,
} from './sync.js';
export {
  SYNC_ROLES,
  TRANSLATION_ROLES,
  EntrySync,
  createDefaultSyncOptions,
  syncOriginalToTranslation,
  syncCarnet,
  syncBook,
} from './sync.js';

// Scaffold utilities
export type {
  ScaffoldOptions,
  ScaffoldEntryResult,
  ScaffoldCarnetResult,
} from './scaffold.js';
export {
  TODO_PLACEHOLDER,
  TranslationScaffold,
  createDefaultScaffoldOptions,
  scaffoldTranslationEntry,
  scaffoldCarnet as scaffoldCarnetTranslation,
} from './scaffold.js';
