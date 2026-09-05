/**
 * Note role identifiers used in the diary annotation system
 */
export const NOTE_ROLES = {
  /** Researcher notes - historical context, biographical info */
  RSR: 'RSR',
  /** Linguistic Annotator notes - language, idioms, period vocabulary */
  LAN: 'LAN',
  /** Translator notes - translation decisions, alternatives */
  TR: 'TR',
  /** Editor notes - editorial decisions, corrections */
  RED: 'RED',
  /** Conductor notes - final quality review */
  CON: 'CON',
  /** Project Assistant notes - automated or system notes */
  PA: 'PA',
  /** Gemini editor notes - AI-assisted editing (retired) */
  GEM: 'GEM',
  /** Opus Editor notes - Opus language expert review */
  OPS: 'OPS',
  /** Executive Director notes - workflow orchestration */
  ED: 'ED',
  /** Fablelous notes - Fable word-level polish pass */
  FAB: 'FAB',
  /** Voice of the Reader notes - opposing artistic review */
  VOX: 'VOX',
  /** Perplexity notes - external research assistance (retired) */
  PPX: 'PPX',
  /** KRR notes - human owner/editor remarks */
  KRR: 'KRR',
} as const;

export type NoteRole = (typeof NOTE_ROLES)[keyof typeof NOTE_ROLES];

/**
 * All note role codes as an array
 */
export const ALL_NOTE_ROLES: NoteRole[] = Object.values(NOTE_ROLES);

/**
 * Human-readable descriptions of note roles
 */
export const NOTE_ROLE_DESCRIPTIONS: Record<NoteRole, string> = {
  RSR: 'Researcher',
  LAN: 'Linguistic Annotator',
  TR: 'Translator',
  RED: 'Editor',
  CON: 'Conductor',
  PA: 'Project Assistant',
  GEM: 'Gemini Editor',
  OPS: 'Opus Editor',
  ED: 'Executive Director',
  FAB: 'Fablelous',
  VOX: 'Voice of the Reader',
  PPX: 'Perplexity',
  KRR: 'KRR (human owner)',
};

/**
 * Default visibility settings for note roles in different view modes
 */
export const NOTE_ROLE_DEFAULTS: Record<NoteRole, boolean> = {
  RSR: true,
  LAN: true,
  TR: true,
  RED: true,
  CON: true,
  PA: true,
  GEM: true,
  OPS: true,
  ED: true,
  FAB: true,
  VOX: true,
  PPX: true,
  KRR: true,
};

/**
 * Check if a string is a valid note role
 */
export function isValidNoteRole(role: string): role is NoteRole {
  return role in NOTE_ROLES;
}

/**
 * Get the description for a note role
 */
export function getNoteRoleDescription(role: NoteRole): string {
  return NOTE_ROLE_DESCRIPTIONS[role] ?? role;
}
