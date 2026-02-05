import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DiaryEntry, Paragraph, DiaryCarnet } from '../models/index.js';
import type { Note } from '../models/note.js';
import type { GlossaryLink } from '../models/glossary.js';
import { createParagraph, createDiaryEntry, createDiaryCarnet } from '../models/index.js';
import { LANGUAGE_TAGS, extractLanguagesFromTags } from '../constants/languages.js';
import {
  PARAGRAPH_ID_PATTERN,
  NOTE_PATTERN,
  GLOSSARY_PATTERN,
  FOOTNOTE_DEF_PATTERN,
  FOOTNOTE_REF_PATTERN,
  HEADER_PATTERN,
  VERSION_PATTERN,
  isCommentLine,
} from './patterns.js';
import { parseFrontmatter, extractDateFromFilename, detectLanguage } from './frontmatter.js';

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
    const { metadata, content } = parseFrontmatter(rawContent);

    // Split remaining content into lines
    const lines = content.split('\n');

    // Extract metadata from filename if not in frontmatter
    const date = (metadata.date as string) ?? extractDateFromFilename(path.basename(filePath));
    const language = detectLanguage(filePath);

    // Create diary entry
    const entry = createDiaryEntry(filePath, date, language);

    // Apply metadata from frontmatter
    if (metadata) {
      entry.location = metadata.location as string | undefined;
      entry.metadata = metadata;
    }

    // Parse entry-level glossary links (first lines before any paragraph IDs)
    if (!metadata || Object.keys(metadata).length === 0) {
      let idx = 0;
      while (idx < lines.length) {
        const line = lines[idx].trim();

        // Stop if we hit a paragraph ID
        if (PARAGRAPH_ID_PATTERN.test(line)) {
          break;
        }

        // Extract glossary links from comment lines at the top
        if (line.startsWith('%%') && line.endsWith('%%')) {
          const links = this.extractGlossaryLinks(line);
          if (links.length > 0) {
            entry.entryGlossaryLinks.push(...links);
            // First glossary link is typically the location
            if (!entry.location && links.length > 0) {
              entry.location = links[0].displayText;
            }
          }
        }

        idx++;
      }
    }

    // Parse paragraphs
    // Pass language so parser knows how to assign text fields
    const isTranslation = language !== 'original';
    let idx = 0;
    while (idx < lines.length) {
      const [para, nextIdx] = this.parseParagraphCluster(lines, idx, isTranslation);
      if (para) {
        entry.paragraphs.push(para);
      }
      idx = nextIdx;
    }

    // Extract footnotes
    entry.footnotes = this.extractFootnotes(lines);

    return entry;
  }

  /**
   * Parse a single paragraph cluster
   * Returns [paragraph, nextIndex]
   *
   * Handles content both BEFORE and AFTER the paragraph ID.
   * Old format: French text in comment -> paragraph ID -> notes -> translation
   * New format: paragraph ID -> French text in comment -> notes -> translation
   *
   * @param lines - All lines in the file
   * @param startIdx - Starting index
   * @param isTranslation - If true, main text goes to translatedText, comment text to originalText
   */
  parseParagraphCluster(
    lines: string[],
    startIdx: number,
    isTranslation: boolean = false
  ): [Paragraph | null, number] {
    if (startIdx >= lines.length) {
      return [null, startIdx + 1];
    }

    // Collect content that appears BEFORE the paragraph ID
    const preIdContent: {
      frenchText?: string;
      glossaryLinks: GlossaryLink[];
      notes: Note[];
    } = { glossaryLinks: [], notes: [] };

    // Look for paragraph ID, collecting pre-content
    let idx = startIdx;
    let paraIdMatch: RegExpMatchArray | null = null;

    while (idx < lines.length) {
      const line = lines[idx].trim();
      paraIdMatch = line.match(PARAGRAPH_ID_PATTERN);
      if (paraIdMatch) {
        break;
      }

      // Extract pre-ID content (content before paragraph ID)
      if (line.startsWith('%%') && line.endsWith('%%')) {
        const extracted = this.extractMetadata(line);
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
    if (!paraIdMatch) {
      // Check if this is a header or other content
      if (startIdx < lines.length) {
        const line = lines[startIdx].trim();
        const headerMatch = line.match(HEADER_PATTERN);

        if (headerMatch) {
          const para = createParagraph(`header_${startIdx}`, '00', 0);
          para.isHeader = true;
          para.headerLevel = headerMatch[1].length;
          para.originalText = headerMatch[2];
          return [para, startIdx + 1];
        }
      }

      return [null, lines.length];
    }

    // Found paragraph ID - preserve original format
    const carnetNum = paraIdMatch[1];
    const paraNumStr = paraIdMatch[2];
    const paraNum = parseInt(paraNumStr, 10);
    // Preserve original format with leading zeros (e.g., "001.01" not "001.1")
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
    while (idx < lines.length) {
      const line = lines[idx];
      const strippedLine = line.trim();

      // Check if we've hit the next paragraph ID
      if (PARAGRAPH_ID_PATTERN.test(strippedLine)) {
        break;
      }

      // Extract metadata from comment lines
      if (strippedLine.startsWith('%%') && strippedLine.endsWith('%%')) {
        const extracted = this.extractMetadata(strippedLine);

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
      } else if (strippedLine) {
        // Non-empty, non-comment line
        // Skip footnote definitions - they're handled separately by extractFootnotes
        if (!FOOTNOTE_DEF_PATTERN.test(strippedLine)) {
          // Actual paragraph text
          if (!para.isHeader) {
            mainTextLines.push(strippedLine);
          }

          // Extract inline glossary links
          const inlineLinks = this.extractGlossaryLinks(strippedLine);
          para.glossaryLinks.push(...inlineLinks);
        }
      }

      idx++;
    }

    // Assign main text to appropriate field based on file type
    if (mainTextLines.length > 0) {
      const mainText = mainTextLines.join('\n');

      // Check if this is actually a header (starts with #)
      const headerMatch = mainText.match(HEADER_PATTERN);
      if (headerMatch) {
        para.isHeader = true;
        para.headerLevel = headerMatch[1].length;
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

    // Sort notes by timestamp for consistent ordering
    para.notes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

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
   * Extract metadata from a comment line
   * Returns Note, GlossaryLink[], or version tuple
   */
  extractMetadata(
    commentLine: string
  ): Note | GlossaryLink[] | { version: string | null; text: string } | null {
    // Check for note pattern
    const noteMatch = commentLine.match(NOTE_PATTERN);
    if (noteMatch) {
      return {
        timestamp: new Date(noteMatch[1]),
        role: noteMatch[2],
        content: noteMatch[3],
      };
    }

    // Check for version pattern
    const versionMatch = commentLine.match(VERSION_PATTERN);
    if (versionMatch) {
      return {
        version: `v${versionMatch[1]}`,
        text: versionMatch[2],
      };
    }

    // Check for glossary links
    const glossaryLinks = this.extractGlossaryLinks(commentLine);
    if (glossaryLinks.length > 0) {
      return glossaryLinks;
    }

    // Check for original text in comment (no version prefix)
    const content = commentLine.slice(2, -2).trim();
    if (content && !content.startsWith('v') || (content.startsWith('v') && !/^v\d/.test(content))) {
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
   * Extract footnote definitions from the file
   */
  extractFootnotes(lines: string[]): Record<string, string> {
    const footnotes: Record<string, string> = {};

    for (const line of lines) {
      const match = line.trim().match(FOOTNOTE_DEF_PATTERN);
      if (match) {
        footnotes[match[1]] = match[2];
      }
    }

    return footnotes;
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
