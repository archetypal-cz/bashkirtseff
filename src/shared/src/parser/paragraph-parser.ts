import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DiaryEntry, Paragraph, DiaryCarnet } from '../models/index.js';
import type { Note } from '../models/note.js';
import type { GlossaryLink } from '../models/glossary.js';
import { createParagraph, createDiaryEntry, createDiaryCarnet } from '../models/index.js';
import { LANGUAGE_TAGS, extractLanguagesFromTags } from '../constants/languages.js';
import {
  PARAGRAPH_ID_PARTS_PATTERN,
  LEGACY_PARAGRAPH_ID_PATTERN,
  TIMESTAMP_PATTERN,
  GLOSSARY_PATTERN,
  FOOTNOTE_DEF_PATTERN,
  FOOTNOTE_CONTINUATION_PATTERN,
  FOOTNOTE_REF_PATTERN,
  HEADER_PATTERN,
  VERSION_CONTENT_PATTERN,
} from './patterns.js';
import { scanComments } from './comment-scanner.js';
import { parseFrontmatter, extractDateFromFilename, detectLanguage } from './frontmatter.js';

/**
 * Normalize overflowed seconds (e.g. :60, :61) left by auto-incremented timestamps
 * so `new Date()` still yields a usable value for sorting.
 */
function normalizeTimestamp(tsStr: string): string {
  const parts = tsStr.match(/^(.*T\d{2}):(\d{2}):(\d{2})(.*)$/);
  if (!parts) return tsStr;

  const seconds = parseInt(parts[3], 10);
  if (seconds < 60) return tsStr;

  const minutes = parseInt(parts[2], 10) + Math.floor(seconds / 60);
  return `${parts[1]}:${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}${parts[4]}`;
}

/**
 * One classified element of a parsed file: a paragraph ID, a comment block, or
 * a line of ordinary text.
 */
type ParsedItem =
  | { kind: 'id'; carnet: string; seq: string }
  | { kind: 'comment'; content: string }
  | { kind: 'text'; text: string };

/**
 * Result of extracting footnote definitions from a file
 */
export interface FootnoteExtraction {
  footnotes: Record<string, string>;
  /** Line indices occupied by definitions and their continuations */
  lines: Set<number>;
  warnings: string[];
}

/**
 * Parser for paragraph-clustered markdown files
 */
export class ParagraphParser {
  /**
   * Parse a single markdown file
   */
  parseFile(filePath: string): DiaryEntry {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const rawContent = fs.readFileSync(filePath, 'utf-8');

    // Check for frontmatter
    const { metadata, content, error } = parseFrontmatter(rawContent);

    // Split remaining content into lines
    const lines = content.split('\n');

    // Extract metadata from filename if not in frontmatter
    const date = (metadata.date as string) ?? extractDateFromFilename(path.basename(filePath));
    const language = detectLanguage(filePath);

    // Create diary entry
    const entry = createDiaryEntry(filePath, date, language);

    if (error) {
      entry.warnings.push(`Frontmatter: ${error}`);
    }

    // Apply metadata from frontmatter
    if (metadata) {
      entry.location = metadata.location as string | undefined;
      entry.metadata = metadata;
    }

    const footnoteResult = this.extractFootnotes(lines);
    entry.footnotes = footnoteResult.footnotes;
    entry.warnings.push(...footnoteResult.warnings);

    const scan = scanComments(lines);
    entry.warnings.push(...scan.warnings);

    const items = this.buildItems(lines, scan.lines, footnoteResult.lines, entry);

    // Parse entry-level glossary links (first lines before any paragraph IDs)
    if (!metadata || Object.keys(metadata).length === 0) {
      for (const item of items) {
        if (item.kind === 'id') break;
        if (item.kind !== 'comment') continue;

        const links = this.extractGlossaryLinks(item.content);
        if (links.length > 0) {
          entry.entryGlossaryLinks.push(...links);
          if (!entry.location) {
            entry.location = links[0].displayText;
          }
        }
      }
    }

    // Parse paragraphs
    // Pass language so parser knows how to assign text fields
    const isTranslation = language !== 'original';
    let idx = 0;
    while (idx < items.length) {
      const [para, nextIdx] = this.parseParagraphCluster(items, idx, isTranslation);
      if (para) {
        entry.paragraphs.push(para);
      }
      idx = nextIdx;
    }

    // French edition: the original text in comments IS the content.
    // Promote originalText → translatedText where no visible text exists,
    // so the frontend renders the paragraph content.
    if (language === 'fr') {
      for (const para of entry.paragraphs) {
        if (!para.translatedText && para.originalText) {
          para.translatedText = para.originalText;
        }
      }
    }

    return entry;
  }

  /**
   * Flatten scanned lines into paragraph IDs, comment blocks and text lines.
   * Records the paragraph ID notation on the entry so the renderer can match it.
   */
  private buildItems(
    lines: string[],
    scanned: ReturnType<typeof scanComments>['lines'],
    footnoteLines: Set<number>,
    entry: DiaryEntry
  ): ParsedItem[] {
    const items: ParsedItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (footnoteLines.has(i)) continue;

      const sl = scanned[i];
      if (sl.consumed) continue;

      const trimmed = lines[i].trim();

      const legacy = trimmed.match(LEGACY_PARAGRAPH_ID_PATTERN);
      if (legacy) {
        entry.idStyle = 'legacy';
        items.push({ kind: 'id', carnet: legacy[1], seq: legacy[2] });
        continue;
      }

      if (sl.isCommentOnly) {
        for (const segment of sl.comments) {
          const idMatch = segment.content.match(PARAGRAPH_ID_PARTS_PATTERN);
          if (idMatch) {
            items.push({ kind: 'id', carnet: idMatch[1], seq: idMatch[2] });
          } else {
            items.push({ kind: 'comment', content: segment.content });
          }
        }
        continue;
      }

      if (trimmed) {
        items.push({ kind: 'text', text: trimmed });
      }
    }

    return items;
  }

  /**
   * Parse a single paragraph cluster from the item stream
   * Returns [paragraph, nextIndex]
   *
   * Handles content both BEFORE and AFTER the paragraph ID.
   * Old format: French text in comment -> paragraph ID -> notes -> translation
   * New format: paragraph ID -> French text in comment -> notes -> translation
   *
   * @param items - Classified items for the whole file
   * @param startIdx - Starting index
   * @param isTranslation - If true, main text goes to translatedText, comment text to originalText
   */
  parseParagraphCluster(
    items: ParsedItem[],
    startIdx: number,
    isTranslation: boolean = false
  ): [Paragraph | null, number] {
    if (startIdx >= items.length) {
      return [null, startIdx + 1];
    }

    // Collect content that appears BEFORE the paragraph ID
    const preIdContent: {
      frenchText?: string;
      glossaryLinks: GlossaryLink[];
      notes: Note[];
    } = { glossaryLinks: [], notes: [] };

    let idx = startIdx;
    let idItem: Extract<ParsedItem, { kind: 'id' }> | null = null;

    while (idx < items.length) {
      const item = items[idx];
      if (item.kind === 'id') {
        idItem = item;
        break;
      }

      if (item.kind === 'comment') {
        const extracted = this.extractMetadata(item.content);
        if (extracted) {
          if ('timestamp' in extracted) {
            preIdContent.notes.push(extracted as Note);
          } else if (Array.isArray(extracted)) {
            preIdContent.glossaryLinks.push(...(extracted as GlossaryLink[]));
          } else if ('version' in extracted && extracted.version === null) {
            // Plain text in comment = French original for translation files
            if (isTranslation && !preIdContent.frenchText) {
              preIdContent.frenchText = extracted.text;
            }
          }
        }
      }

      idx++;
    }

    // No paragraph ID found
    if (!idItem) {
      const first = items[startIdx];
      if (first.kind === 'text') {
        const headerMatch = first.text.match(HEADER_PATTERN);
        if (headerMatch) {
          const para = createParagraph(`header_${startIdx}`, '00', 0);
          para.isHeader = true;
          para.headerLevel = headerMatch[1].length;
          para.originalText = headerMatch[2];
          return [para, startIdx + 1];
        }
      }

      return [null, items.length];
    }

    // Found paragraph ID - preserve original format with leading zeros
    const carnetNum = idItem.carnet;
    const paraNumStr = idItem.seq;
    const paraNum = parseInt(paraNumStr, 10);
    const paraId = `${carnetNum}.${paraNumStr}`;

    const para = createParagraph(paraId, carnetNum, paraNum);

    // Apply pre-ID content to paragraph
    if (preIdContent.frenchText) {
      para.originalText = preIdContent.frenchText;
    }
    para.glossaryLinks.push(...preIdContent.glossaryLinks);
    para.notes.push(...preIdContent.notes);

    // Continue from after the paragraph ID
    idx++;

    // Collect main text lines (non-comment) to join later
    const mainTextLines: string[] = [];

    // Parse content after paragraph ID until next paragraph ID or EOF
    while (idx < items.length) {
      const item = items[idx];
      if (item.kind === 'id') {
        break;
      }

      if (item.kind === 'comment') {
        const extracted = this.extractMetadata(item.content);

        if (extracted) {
          if ('timestamp' in extracted) {
            // It's a Note
            para.notes.push(extracted as Note);
          } else if (Array.isArray(extracted)) {
            // It's GlossaryLinks
            para.glossaryLinks.push(...(extracted as GlossaryLink[]));
          } else if ('version' in extracted) {
            // It's a version tuple
            const { version, text } = extracted as { version: string | null; text: string };
            if (version) {
              para.translationVersions.set(version, text);
            } else {
              // Plain text in comment = original French text (for translation files)
              // Only store if we're in a translation file and not already set
              if (isTranslation && !para.originalText) {
                para.originalText = text;
              }
            }
          }
        }
      } else {
        // Actual paragraph text
        if (!para.isHeader) {
          mainTextLines.push(item.text);
        }

        // Extract inline glossary links
        const inlineLinks = this.extractGlossaryLinks(item.text);
        para.glossaryLinks.push(...inlineLinks);
      }

      idx++;
    }

    // Assign main text to appropriate field based on file type
    if (mainTextLines.length > 0) {
      let mainText = mainTextLines.join('\n');

      // Check if this is actually a header (starts with #)
      const headerMatch = mainText.match(HEADER_PATTERN);
      if (headerMatch) {
        para.isHeader = true;
        para.headerLevel = headerMatch[1].length;
        // Store only the header text content (without # prefix)
        // so the renderer can add it back consistently
        mainText = headerMatch[2];
      }

      // Extract footnote references from main text
      const fnRefPattern = new RegExp(FOOTNOTE_REF_PATTERN.source, 'g');
      let fnMatch;
      while ((fnMatch = fnRefPattern.exec(mainText)) !== null) {
        if (!para.footnoteRefs.includes(fnMatch[1])) {
          para.footnoteRefs.push(fnMatch[1]);
        }
      }

      if (isTranslation) {
        // Translation file: main text is the translation
        para.translatedText = mainText;
      } else {
        // Original file: main text is the original
        para.originalText = mainText;
      }
    }

    // Preserve notes in file order (pre-ID notes, then post-ID notes)
    // Consumers can sort by timestamp if needed

    // Deduplicate glossary links (keep first occurrence)
    const seenLinks = new Set<string>();
    para.glossaryLinks = para.glossaryLinks.filter(link => {
      const key = link.displayText;
      if (seenLinks.has(key)) return false;
      seenLinks.add(key);
      return true;
    });

    // Extract languages from glossary tags
    const tagIds = para.glossaryLinks.map((link) => link.displayText);
    para.languages = extractLanguagesFromTags(tagIds);

    return [para, idx];
  }

  /**
   * Classify the inner content of a `%% ... %%` block
   * Returns Note, GlossaryLink[], or version tuple
   */
  extractMetadata(
    content: string
  ): Note | GlossaryLink[] | { version: string | null; text: string } | null {
    // Check for note pattern
    const noteMatch = content.match(TIMESTAMP_PATTERN);
    if (noteMatch) {
      return {
        timestamp: new Date(normalizeTimestamp(noteMatch[1])),
        rawTimestamp: noteMatch[1],
        role: noteMatch[2],
        content: noteMatch[3],
      };
    }

    // Check for version pattern
    const versionMatch = content.match(VERSION_CONTENT_PATTERN);
    if (versionMatch) {
      return {
        version: `v${versionMatch[1]}`,
        text: versionMatch[2],
      };
    }

    // Check for glossary links
    const glossaryLinks = this.extractGlossaryLinks(content);
    if (glossaryLinks.length > 0) {
      return glossaryLinks;
    }

    // Check for original text in comment (no version prefix)
    if ((content && !content.startsWith('v')) || (content.startsWith('v') && !/^v\d/.test(content))) {
      return { version: null, text: content };
    }

    return null;
  }

  /**
   * Extract all glossary links from a text line
   */
  extractGlossaryLinks(text: string): GlossaryLink[] {
    const links: GlossaryLink[] = [];
    const pattern = new RegExp(GLOSSARY_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const link: GlossaryLink = {
        displayText: match[1],
        filePath: match[2],
      };

      // Avoid duplicates
      if (!links.some((l) => l.displayText === link.displayText)) {
        links.push(link);
      }
    }

    return links;
  }

  /**
   * Extract footnote definitions from the file.
   * Indented lines following a definition continue it; a repeated label keeps
   * the first definition and reports a warning.
   */
  extractFootnotes(lines: string[]): FootnoteExtraction {
    const footnotes: Record<string, string> = {};
    const claimed = new Set<number>();
    const warnings: string[] = [];

    let currentLabel: string | null = null;
    let currentLines: string[] = [];

    const flush = () => {
      if (currentLabel === null) return;
      if (currentLabel in footnotes) {
        warnings.push(`Duplicate footnote definition [^${currentLabel}]; keeping the first`);
      } else {
        footnotes[currentLabel] = currentLines.join('\n');
      }
      currentLabel = null;
      currentLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].trim().match(FOOTNOTE_DEF_PATTERN);
      if (match) {
        flush();
        currentLabel = match[1];
        currentLines = [match[2]];
        claimed.add(i);
        continue;
      }

      if (currentLabel !== null && FOOTNOTE_CONTINUATION_PATTERN.test(lines[i])) {
        currentLines.push(lines[i].trim());
        claimed.add(i);
        continue;
      }

      flush();
    }
    flush();

    return { footnotes, lines: claimed, warnings };
  }

  /**
   * Parse all entries in a carnet directory
   */
  parseCarnet(carnetDir: string): DiaryCarnet {
    if (!fs.existsSync(carnetDir)) {
      throw new Error(`Directory not found: ${carnetDir}`);
    }

    const carnetId = path.basename(carnetDir);
    const carnet = createDiaryCarnet(carnetId);

    // Find all markdown files
    const files = fs
      .readdirSync(carnetDir)
      .filter((f) => f.endsWith('.md'))
      .sort();

    // Parse each file
    for (const file of files) {
      try {
        const entry = this.parseFile(path.join(carnetDir, file));
        carnet.entries.push(entry);
      } catch (e) {
        console.error(`Error parsing ${file}:`, e);
      }
    }

    return carnet;
  }

  /**
   * @deprecated Use parseCarnet instead
   * Backward compatibility alias
   */
  parseBook(bookDir: string): DiaryCarnet {
    return this.parseCarnet(bookDir);
  }

  /**
   * Merge original and translated entries into a single entry
   */
  mergeEntries(originalEntry: DiaryEntry, translatedEntry: DiaryEntry): DiaryEntry {
    // Create merged entry based on original
    const merged = createDiaryEntry(
      originalEntry.filePath,
      originalEntry.date,
      'merged'
    );

    merged.location = originalEntry.location;
    merged.entryGlossaryLinks = [...originalEntry.entryGlossaryLinks];
    merged.footnotes = { ...originalEntry.footnotes, ...translatedEntry.footnotes };
    merged.metadata = originalEntry.metadata;

    // Create map of translated paragraphs by ID
    const transMap = new Map<string, Paragraph>();
    for (const para of translatedEntry.paragraphs) {
      transMap.set(para.id, para);
    }

    // Merge paragraphs by ID
    for (const origPara of originalEntry.paragraphs) {
      const mergedPara = createParagraph(
        origPara.id,
        origPara.carnetNum,
        origPara.paraNum
      );

      mergedPara.isHeader = origPara.isHeader;
      mergedPara.headerLevel = origPara.headerLevel;
      mergedPara.originalText = origPara.originalText;
      mergedPara.notes = [...origPara.notes];
      mergedPara.glossaryLinks = [...origPara.glossaryLinks];
      mergedPara.languages = [...origPara.languages];

      // Add translation data if available
      const transPara = transMap.get(origPara.id);
      if (transPara) {
        mergedPara.translatedText = transPara.translatedText;
        mergedPara.translationVersions = new Map(transPara.translationVersions);

        // Add translation-specific notes
        mergedPara.notes.push(...transPara.notes);

        // Add translation-specific glossary links
        for (const link of transPara.glossaryLinks) {
          if (!mergedPara.glossaryLinks.some((l) => l.displayText === link.displayText)) {
            mergedPara.glossaryLinks.push(link);
          }
        }

        // Re-extract languages from merged glossary links
        const tagIds = mergedPara.glossaryLinks.map((l) => l.displayText);
        mergedPara.languages = extractLanguagesFromTags(tagIds);
      }

      merged.paragraphs.push(mergedPara);
    }

    return merged;
  }
}

/**
 * Extract languages from glossary links
 */
export function extractLanguagesFromGlossary(glossaryLinks: GlossaryLink[]): string[] {
  const languages: string[] = [];

  for (const link of glossaryLinks) {
    const langCode = LANGUAGE_TAGS[link.displayText];
    if (langCode && !languages.includes(langCode)) {
      languages.push(langCode);
    }
  }

  // If no explicit language tags, default to French
  return languages.length > 0 ? languages : ['fr'];
}
