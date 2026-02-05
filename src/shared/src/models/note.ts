/**
 * Represents a timestamped note from any role (RSR, LAN, TR, etc.)
 */
export interface Note {
  /** ISO timestamp of when the note was created */
  timestamp: Date;
  /** Role identifier: RSR, LAN, TR, RED, CON, PA, GEM */
  role: string;
  /** Note content */
  content: string;
}

/**
 * Create a string representation of a note
 */
export function noteToString(note: Note): string {
  return `${note.timestamp.toISOString()} ${note.role}: ${note.content}`;
}

/**
 * Parse a note from a string format
 * Format: "2025-12-07T16:00:00 RSR: content"
 */
export function parseNote(str: string): Note | null {
  const match = str.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\s+([A-Z]+):\s*(.+)$/);
  if (!match) return null;

  return {
    timestamp: new Date(match[1]),
    role: match[2],
    content: match[3],
  };
}
