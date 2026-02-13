import type { DiaryEntry, DiaryCarnet, Paragraph } from '../models/index.js';

// Backward compatibility alias
type DiaryBook = DiaryCarnet;

/**
 * Statistics for a single entry
 */
export interface EntryStatistics {
  totalParagraphs: number;
  totalHeaders: number;
  totalNotes: number;
  notesByRole: Record<string, number>;
  totalGlossaryLinks: number;
  totalWordsOriginal: number;
  totalWordsTranslated: number;
  totalSentencesOriginal: number;
  totalSentencesTranslated: number;
  paragraphsWithTranslation: number;
  paragraphsWithNotes: number;
}

/**
 * Statistics for a complete carnet
 */
export interface CarnetStatistics {
  carnetId: string;
  /** @deprecated Use carnetId instead */
  bookId: string;
  totalEntries: number;
  totalParagraphs: number;
  totalNotes: number;
  notesByRole: Record<string, number>;
  totalGlossaryLinks: number;
  uniqueGlossaryLinks: string[];
  totalWordsOriginal: number;
  totalWordsTranslated: number;
  totalSentencesOriginal: number;
  totalSentencesTranslated: number;
  entriesWithTranslation: number;
  translationCoverage: number;
}

/**
 * @deprecated Use CarnetStatistics instead
 */
export type BookStatistics = CarnetStatistics;

/**
 * Get statistics for a single entry
 */
export function getEntryStatistics(entry: DiaryEntry): EntryStatistics {
  const stats: EntryStatistics = {
    totalParagraphs: 0,
    totalHeaders: 0,
    totalNotes: 0,
    notesByRole: {},
    totalGlossaryLinks: 0,
    totalWordsOriginal: 0,
    totalWordsTranslated: 0,
    totalSentencesOriginal: 0,
    totalSentencesTranslated: 0,
    paragraphsWithTranslation: 0,
    paragraphsWithNotes: 0,
  };

  // Get unique glossary links
  const uniqueLinks = new Set<string>();

  for (const para of entry.paragraphs) {
    if (para.isHeader) {
      stats.totalHeaders++;
      // Headers count as 1 sentence each
      if (para.originalText) {
        stats.totalSentencesOriginal++;
      }
      if (para.translatedText) {
        stats.totalSentencesTranslated++;
      }
      continue;
    }

    stats.totalParagraphs++;

    // Count notes
    stats.totalNotes += para.notes.length;
    if (para.notes.length > 0) {
      stats.paragraphsWithNotes++;
    }

    for (const note of para.notes) {
      if (!stats.notesByRole[note.role]) {
        stats.notesByRole[note.role] = 0;
      }
      stats.notesByRole[note.role]++;
    }

    // Count glossary links
    for (const link of para.glossaryLinks) {
      uniqueLinks.add(link.displayText);
    }

    // Count words and sentences
    if (para.originalText) {
      stats.totalWordsOriginal += countWords(para.originalText);
      stats.totalSentencesOriginal += countSentences(para.originalText);
    }

    if (para.translatedText) {
      stats.totalWordsTranslated += countWords(para.translatedText);
      stats.totalSentencesTranslated += countSentences(para.translatedText);
      stats.paragraphsWithTranslation++;
    }
  }

  // Count sentences in footnotes
  // In translation files, footnotes are in the target language
  const isTranslation = entry.language !== 'original';
  for (const fnText of Object.values(entry.footnotes)) {
    if (isTranslation) {
      stats.totalSentencesTranslated += countSentences(fnText);
    } else {
      stats.totalSentencesOriginal += countSentences(fnText);
    }
  }

  stats.totalGlossaryLinks = uniqueLinks.size;

  return stats;
}

/**
 * Get comprehensive statistics for a carnet
 */
export function getCarnetStatistics(carnet: DiaryCarnet): CarnetStatistics {
  const stats: CarnetStatistics = {
    carnetId: carnet.carnetId,
    bookId: carnet.carnetId, // backward compatibility
    totalEntries: carnet.entries.length,
    totalParagraphs: 0,
    totalNotes: 0,
    notesByRole: {},
    totalGlossaryLinks: 0,
    uniqueGlossaryLinks: [],
    totalWordsOriginal: 0,
    totalWordsTranslated: 0,
    totalSentencesOriginal: 0,
    totalSentencesTranslated: 0,
    entriesWithTranslation: 0,
    translationCoverage: 0,
  };

  const uniqueLinks = new Set<string>();

  for (const entry of carnet.entries) {
    const entryStats = getEntryStatistics(entry);

    stats.totalParagraphs += entryStats.totalParagraphs;
    stats.totalNotes += entryStats.totalNotes;
    stats.totalWordsOriginal += entryStats.totalWordsOriginal;
    stats.totalWordsTranslated += entryStats.totalWordsTranslated;
    stats.totalSentencesOriginal += entryStats.totalSentencesOriginal;
    stats.totalSentencesTranslated += entryStats.totalSentencesTranslated;

    // Aggregate note counts
    for (const [role, count] of Object.entries(entryStats.notesByRole)) {
      if (!stats.notesByRole[role]) {
        stats.notesByRole[role] = 0;
      }
      stats.notesByRole[role] += count;
    }

    // Track unique glossary links
    for (const para of entry.paragraphs) {
      for (const link of para.glossaryLinks) {
        uniqueLinks.add(link.displayText);
      }
    }

    // Count entries with translation
    if (entryStats.paragraphsWithTranslation > 0) {
      stats.entriesWithTranslation++;
    }
  }

  stats.totalGlossaryLinks = uniqueLinks.size;
  stats.uniqueGlossaryLinks = Array.from(uniqueLinks);

  // Calculate translation coverage
  if (stats.totalParagraphs > 0) {
    let translatedParagraphs = 0;
    for (const entry of carnet.entries) {
      for (const para of entry.paragraphs) {
        if (!para.isHeader && para.translatedText) {
          translatedParagraphs++;
        }
      }
    }
    stats.translationCoverage = (translatedParagraphs / stats.totalParagraphs) * 100;
  }

  return stats;
}

/**
 * @deprecated Use getCarnetStatistics instead
 * Backward compatibility alias
 */
export function getBookStatistics(book: DiaryBook): BookStatistics {
  return getCarnetStatistics(book);
}

/**
 * Find missing translations between original and translated carnets
 */
export function findMissingTranslations(
  originalCarnet: DiaryCarnet,
  translatedCarnet: DiaryCarnet
): Array<{ date: string; paragraphIds: string[] }> {
  const missing: Array<{ date: string; paragraphIds: string[] }> = [];

  // Create map of translated entries by date
  const transMap = new Map<string, DiaryEntry>();
  for (const entry of translatedCarnet.entries) {
    transMap.set(entry.date, entry);
  }

  for (const origEntry of originalCarnet.entries) {
    const missingParas: string[] = [];

    if (!transMap.has(origEntry.date)) {
      // Entire entry is missing
      const paraIds = origEntry.paragraphs
        .filter((p) => !p.isHeader)
        .map((p) => p.id);
      missing.push({ date: origEntry.date, paragraphIds: paraIds });
    } else {
      // Check individual paragraphs
      const transEntry = transMap.get(origEntry.date)!;
      const transParaIds = new Set(transEntry.paragraphs.map((p) => p.id));

      for (const para of origEntry.paragraphs) {
        if (!para.isHeader && !transParaIds.has(para.id)) {
          missingParas.push(para.id);
        }
      }

      if (missingParas.length > 0) {
        missing.push({ date: origEntry.date, paragraphIds: missingParas });
      }
    }
  }

  return missing;
}

/**
 * Search for paragraphs containing a specific term
 */
export function searchParagraphs(
  carnet: DiaryCarnet,
  searchTerm: string,
  caseSensitive: boolean = false
): Array<{ entry: DiaryEntry; paragraph: Paragraph }> {
  const results: Array<{ entry: DiaryEntry; paragraph: Paragraph }> = [];
  const searchLower = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  for (const entry of carnet.entries) {
    for (const para of entry.paragraphs) {
      let found = false;

      // Search in original text
      if (para.originalText) {
        const text = caseSensitive
          ? para.originalText
          : para.originalText.toLowerCase();
        if (text.includes(searchLower)) {
          found = true;
        }
      }

      // Search in translated text
      if (para.translatedText) {
        const text = caseSensitive
          ? para.translatedText
          : para.translatedText.toLowerCase();
        if (text.includes(searchLower)) {
          found = true;
        }
      }

      // Search in notes
      for (const note of para.notes) {
        const text = caseSensitive ? note.content : note.content.toLowerCase();
        if (text.includes(searchLower)) {
          found = true;
        }
      }

      if (found) {
        results.push({ entry, paragraph: para });
      }
    }
  }

  return results;
}

/**
 * Filter paragraphs that have notes from specific roles
 */
export function filterParagraphsByNoteType(
  carnet: DiaryCarnet,
  noteTypes: string[]
): Array<{ entry: DiaryEntry; paragraph: Paragraph }> {
  const results: Array<{ entry: DiaryEntry; paragraph: Paragraph }> = [];

  for (const entry of carnet.entries) {
    for (const para of entry.paragraphs) {
      if (para.notes.some((note) => noteTypes.includes(note.role))) {
        results.push({ entry, paragraph: para });
      }
    }
  }

  return results;
}

/**
 * Generate a translation progress report
 */
export function generateTranslationReport(
  originalCarnet: DiaryCarnet,
  translatedCarnet: DiaryCarnet
): string {
  const lines: string[] = [];

  const origStats = getCarnetStatistics(originalCarnet);
  const transStats = getCarnetStatistics(translatedCarnet);

  lines.push('# Translation Progress Report');
  lines.push('');
  lines.push(`Carnet: ${originalCarnet.carnetId}`);
  lines.push(`Original entries: ${origStats.totalEntries}`);
  lines.push(`Translated entries: ${transStats.entriesWithTranslation}`);
  lines.push(`Translation coverage: ${transStats.translationCoverage.toFixed(1)}%`);

  // Missing translations
  const missing = findMissingTranslations(originalCarnet, translatedCarnet);
  if (missing.length > 0) {
    lines.push('');
    lines.push('## Missing Translations');
    for (const { date, paragraphIds } of missing) {
      lines.push('');
      lines.push(`### ${date}`);
      lines.push(`Missing paragraphs: ${paragraphIds.join(', ')}`);
    }
  }

  // Note statistics
  lines.push('');
  lines.push('## Translation Notes');
  const sortedRoles = Object.entries(transStats.notesByRole).sort(
    ([a], [b]) => a.localeCompare(b)
  );
  for (const [role, count] of sortedRoles) {
    lines.push(`- ${role}: ${count} notes`);
  }

  // Glossary coverage
  lines.push('');
  lines.push('## Glossary Links');
  lines.push(`Total unique entities: ${transStats.totalGlossaryLinks}`);

  return lines.join('\n');
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Common abbreviations that end with a period but don't end a sentence.
 * Covers French, Czech, and general abbreviations.
 */
const ABBREVIATIONS = [
  'M.', 'Mme.', 'Mlle.', 'Mgr.', 'Dr.', 'St.', 'Ste.',
  'etc.', 'vol.', 'p.', 'pp.', 'cf.', 'sq.', 'op.', 'av.',
  'č.', 'sv.', 'tj.', 'tzn.', 'např.', 'resp.', 'mj.', 'tzv.',
  'N°.', 'No.', 'no.', 'jr.', 'Sr.', 'Mrs.', 'Ms.', 'Mr.',
];

/**
 * Count sentences in text.
 * Handles French and Czech text, abbreviations, and ellipses.
 * Headers and date lines should be counted as 1 sentence by the caller.
 */
export function countSentences(text: string): number {
  if (!text || !text.trim()) return 0;

  let normalized = text;

  // Normalize multi-dot ellipsis to single character
  normalized = normalized.replace(/\.{2,}/g, '…');

  // Protect abbreviations: replace their trailing dot with a placeholder
  for (const abbr of ABBREVIATIONS) {
    // Escape the abbreviation for regex use
    const escaped = abbr.replace(/\./g, '\\.');
    normalized = normalized.replace(new RegExp(escaped, 'g'), abbr.slice(0, -1) + '\x00');
  }

  // Protect ordinal numbers followed by a period (e.g., "11." in dates)
  normalized = normalized.replace(/(\d)\./g, '$1\x00');

  // Split on sentence-ending punctuation followed by whitespace, quote, or end of string
  const parts = normalized.split(/[.!?…]+(?:\s+|["»"'\])]?\s*|$)/).filter(s => s.trim().length > 0);

  return Math.max(parts.length, 1);
}

/**
 * Compare translation versions of a paragraph
 */
export function compareTranslationVersions(
  para: Paragraph
): Record<string, unknown> {
  if (para.translationVersions.size === 0) {
    return {};
  }

  const comparison: Record<string, unknown> = {
    paragraphId: para.id,
    versions: {} as Record<string, string>,
    changes: [] as Array<{ fromVersion: string; toVersion: string; changed: boolean }>,
    wordCountChanges: {} as Record<string, number>,
  };

  // Add current translation if exists
  if (para.translatedText) {
    (comparison.versions as Record<string, string>)['current'] = para.translatedText;
  }

  // Add all versions
  for (const [version, text] of para.translationVersions) {
    (comparison.versions as Record<string, string>)[version] = text;
  }

  // Compare consecutive versions
  const versionList = Array.from(para.translationVersions.entries());
  for (let i = 1; i < versionList.length; i++) {
    const [prevVersion, prevText] = versionList[i - 1];
    const [currVersion, currText] = versionList[i];

    if (prevText !== currText) {
      (comparison.changes as Array<{ fromVersion: string; toVersion: string; changed: boolean }>).push({
        fromVersion: prevVersion,
        toVersion: currVersion,
        changed: true,
      });
    }

    const prevWords = countWords(prevText);
    const currWords = countWords(currText);
    (comparison.wordCountChanges as Record<string, number>)[
      `${prevVersion}_to_${currVersion}`
    ] = currWords - prevWords;
  }

  return comparison;
}

/**
 * Export aligned paragraphs to TMX format
 */
export function exportToTmx(
  originalEntry: DiaryEntry,
  translatedEntry: DiaryEntry
): string {
  // Create paragraph map
  const transMap = new Map<string, Paragraph>();
  for (const para of translatedEntry.paragraphs) {
    transMap.set(para.id, para);
  }

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<!DOCTYPE tmx SYSTEM "tmx11.dtd">');
  lines.push('<tmx version="1.1">');
  lines.push('  <header');
  lines.push('    creationtool="Bashkirtseff Paragraph Parser"');
  lines.push('    datatype="plaintext"');
  lines.push('    segtype="paragraph"');
  lines.push('    adminlang="en"');
  lines.push('    srclang="fr"');
  lines.push('    o-tmf="Bashkirtseff Diary"/>');
  lines.push('  <body>');

  for (const para of originalEntry.paragraphs) {
    if (para.isHeader || !para.originalText) {
      continue;
    }

    const transPara = transMap.get(para.id);
    if (transPara?.translatedText) {
      lines.push('    <tu>');
      lines.push(`      <prop type="paragraph-id">${para.id}</prop>`);
      lines.push('      <tuv xml:lang="fr">');
      lines.push(`        <seg>${escapeXml(para.originalText)}</seg>`);
      lines.push('      </tuv>');
      lines.push('      <tuv xml:lang="cs">');
      lines.push(`        <seg>${escapeXml(transPara.translatedText)}</seg>`);
      lines.push('      </tuv>');
      lines.push('    </tu>');
    }
  }

  lines.push('  </body>');
  lines.push('</tmx>');

  return lines.join('\n');
}

/**
 * Escape special characters for XML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
