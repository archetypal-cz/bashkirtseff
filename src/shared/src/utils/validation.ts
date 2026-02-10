import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DiaryEntry, DiaryCarnet, GlossaryLink } from '../models/index.js';

// Backward compatibility alias
type DiaryBook = DiaryCarnet;

/**
 * Validate that paragraph IDs are in correct sequence
 * Uses `para_start` from frontmatter if available, otherwise defaults to 1
 */
export function validateParagraphSequence(entry: DiaryEntry): string[] {
  const errors: string[] = [];

  // Check for para_start in frontmatter
  const metadata = entry.metadata ?? {};
  let expectedParaNum = (metadata.para_start as number) ?? 1;

  let carnetNum: string | null = null;

  for (const para of entry.paragraphs) {
    if (para.isHeader) {
      continue;
    }

    // Check carnet number consistency
    if (carnetNum === null) {
      carnetNum = para.carnetNum;
    } else if (para.carnetNum !== carnetNum) {
      errors.push(`Inconsistent carnet number: ${para.id} (expected ${carnetNum})`);
    }

    // Check paragraph numbering
    if (para.paraNum !== expectedParaNum) {
      errors.push(
        `Out of sequence: ${para.id} (expected ${carnetNum}.${expectedParaNum})`
      );
    }

    expectedParaNum++;
  }

  return errors;
}

/**
 * Validate that all glossary links point to existing files
 */
export function validateGlossaryLinks(
  entry: DiaryEntry,
  _glossaryDir?: string
): string[] {
  const errors: string[] = [];

  // Get all glossary links
  const allLinks = getAllGlossaryLinksFromEntry(entry);

  for (const link of allLinks) {
    // Resolve the glossary file path relative to the entry file
    let glossaryPath: string;
    if (entry.filePath) {
      glossaryPath = path.resolve(path.dirname(entry.filePath), link.filePath);
    } else {
      glossaryPath = path.resolve(link.filePath);
    }

    if (!fs.existsSync(glossaryPath)) {
      errors.push(
        `Missing glossary file: ${link.displayText} -> ${link.filePath}`
      );
    }
  }

  return errors;
}

/**
 * Get all unique glossary links from an entry
 */
function getAllGlossaryLinksFromEntry(entry: DiaryEntry): GlossaryLink[] {
  const allLinks = new Map<string, GlossaryLink>();

  // First, add the location if it exists
  if (entry.location) {
    const locationLink = entry.entryGlossaryLinks.find(
      (link) => link.displayText === entry.location
    );
    if (locationLink) {
      allLinks.set(locationLink.displayText, locationLink);
    }
  }

  // Then add all other glossary links from paragraphs
  for (const para of entry.paragraphs) {
    for (const link of para.glossaryLinks) {
      if (!allLinks.has(link.displayText)) {
        allLinks.set(link.displayText, link);
      }
    }
  }

  return Array.from(allLinks.values());
}

/**
 * Validate a complete carnet
 */
export function validateCarnet(carnet: DiaryCarnet): Map<string, string[]> {
  const errorsByEntry = new Map<string, string[]>();

  for (const entry of carnet.entries) {
    const errors = validateParagraphSequence(entry);
    if (errors.length > 0) {
      errorsByEntry.set(entry.filePath, errors);
    }
  }

  return errorsByEntry;
}

/**
 * @deprecated Use validateCarnet instead
 * Backward compatibility alias
 */
export function validateBook(book: DiaryBook): Map<string, string[]> {
  return validateCarnet(book);
}

/**
 * Renumber paragraphs in an entry starting from a specific number.
 * ALL paragraphs (including headers) get sequential IDs to match
 * the diary's paragraph-cluster format where headers are part of the sequence.
 * Paragraphs with synthetic IDs (header_N) are skipped.
 */
export function renumberParagraphs(
  entry: DiaryEntry,
  startFrom = 1
): DiaryEntry {
  let paraNum = startFrom;

  for (const para of entry.paragraphs) {
    // Skip synthetic headers (those without real paragraph IDs)
    if (para.id.startsWith('header_')) {
      continue;
    }
    para.paraNum = paraNum;
    para.id = `${para.carnetNum}.${String(paraNum).padStart(4, '0')}`;
    paraNum++;
  }

  return entry;
}
