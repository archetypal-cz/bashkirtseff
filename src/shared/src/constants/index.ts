// Language constants
export {
  LANGUAGE_TAGS,
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGE_DIRS,
  getLanguageFromTag,
  isLanguageTag,
  extractLanguagesFromTags,
} from './languages.js';

// Role constants
export {
  NOTE_ROLES,
  ALL_NOTE_ROLES,
  NOTE_ROLE_DESCRIPTIONS,
  NOTE_ROLE_DEFAULTS,
  isValidNoteRole,
  getNoteRoleDescription,
} from './roles.js';
export type { NoteRole } from './roles.js';
