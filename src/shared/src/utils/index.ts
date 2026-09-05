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
  FRONTMATTER_ITEM_PATTERN,
  TRANSLATION_DIRS,
  getAllContentFiles,
  findGlossaryFile,
  getGlossaryRelativePath,
  updateFrontmatter,
  extractBodyContent,
  levenshteinDistance,
  planMergeRewrites,
  mergeGlossaryEntries,
} from './glossary-merge.js';

// Glossary link resolution
export type { GlossaryLinkTarget } from './glossary-links.js';
export {
  MD_LINK_PATTERN,
  resolveGlossaryLink,
  glossaryLinkFrom,
  rewriteGlossaryLinks,
} from './glossary-links.js';

// Atomic writes
export { writeFileAtomic } from './atomic-write.js';

// Glossary link depth
export { localizeGlossaryPath } from './glossary-path.js';

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
