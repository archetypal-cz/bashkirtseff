import type { DiaryEntry } from './entry.js';
import { getParagraphCount } from './entry.js';

/**
 * Represents a complete carnet (collection of diary entries)
 * Marie Bashkirtseff's diary spans 106 physical carnets.
 */
export interface DiaryCarnet {
  /** Carnet ID (e.g., "001", "015", "106") - 3-digit string */
  carnetId: string;
  /** @deprecated Use carnetId instead - backward compatibility alias */
  bookId: string;
  /** All entries in this carnet */
  entries: DiaryEntry[];
}

/**
 * @deprecated Use DiaryCarnet instead
 * Backward compatibility alias for DiaryCarnet
 */
export type DiaryBook = DiaryCarnet;

/**
 * Create a new diary carnet with defaults
 */
export function createDiaryCarnet(carnetId: string): DiaryCarnet {
  return {
    carnetId,
    bookId: carnetId, // backward compatibility
    entries: [],
  };
}

/**
 * @deprecated Use createDiaryCarnet instead
 * Backward compatibility alias for createDiaryCarnet
 */
export function createDiaryBook(bookId: string): DiaryCarnet {
  return createDiaryCarnet(bookId);
}

/**
 * Find an entry by its date
 */
export function getEntryByDate(
  carnet: DiaryCarnet,
  date: string
): DiaryEntry | undefined {
  return carnet.entries.find((entry) => entry.date === date);
}

/**
 * Count total paragraphs in the carnet
 */
export function getTotalParagraphs(carnet: DiaryCarnet): number {
  return carnet.entries.reduce(
    (total, entry) => total + getParagraphCount(entry),
    0
  );
}

// Note: CarnetStatistics and getCarnetStatistics are in utils/statistics.ts
// They provide more comprehensive statistics including translation coverage
