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

// Marie Bashkirtseff canonical dates (single source of truth — audit issue M9)
export {
  MARIE_BIRTH_DATE,
  MARIE_CLAIMED_BIRTH_DATE,
  MARIE_BIRTH_YEAR,
  MARIE_BIRTH_MONTH,
  MARIE_BIRTH_DAY,
  MARIE_DEATH_DATE,
} from './marie.js';
