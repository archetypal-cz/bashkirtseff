// Note
export type { Note } from './note.js';
export { noteToString, parseNote } from './note.js';

// Glossary
export type { GlossaryLink, GlossaryTag } from './glossary.js';
export {
  glossaryLinkToString,
  glossaryLinksEqual,
  glossaryLinkHash,
  GLOSSARY_ID_PATTERN,
  isValidGlossaryId,
  toCapitalAscii,
  normalizeGlossaryId,
} from './glossary.js';

// Paragraph
export type { Paragraph } from './paragraph.js';
export {
  createParagraph,
  getNotesByRole,
  hasTranslation,
  translationVersionsToObject,
  objectToTranslationVersions,
} from './paragraph.js';

// Entry
export type { DiaryEntry } from './entry.js';
export {
  createDiaryEntry,
  getParagraphById,
  getAllGlossaryLinks,
  getParagraphCount,
} from './entry.js';

// Carnet (formerly Book)
export type { DiaryCarnet, DiaryBook } from './book.js';
export {
  createDiaryCarnet,
  createDiaryBook,
  getEntryByDate,
  getTotalParagraphs,
} from './book.js';

// Glossary Entry (with paragraph clusters)
export type { GlossaryEntryParsed } from './glossary-entry.js';
export {
  createGlossaryEntry,
  getGlossaryParagraphById,
  getGlossaryCrossRefs,
  getGlossaryParagraphCount,
  extractCategoryFromPath,
  extractIdFromPath,
  validateGlossaryEntryId,
} from './glossary-entry.js';
