import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Paragraph } from '../models/paragraph.js';
import type { Note } from '../models/note.js';
import type { GlossaryLink } from '../models/glossary.js';
import type { GlossaryEntryParsed } from '../models/glossary-entry.js';
import {
  createParagraph,
  createGlossaryEntry,
  extractCategoryFromPath,
  extractIdFromPath,
} from '../models/index.js';
import { extractLanguagesFromTags } from '../constants/languages.js';
import {
  PARAGRAPH_ID_PATTERN,
  NOTE_PATTERN,
  GLOSSARY_PATTERN,
  HEADER_PATTERN,
  VERSION_PATTERN,
} from './patterns.js';
import { parseFrontmatter, detectLanguage } from './frontmatter.js';

/**
 * Pattern for GLO_ prefixed paragraph IDs: %% GLO_VISCONTI.0001 %%
 * Uses CAPITAL_ASCII format [A-Z0-9_]+ - no accents or special characters
 */
const GLOSSARY_PARA_ID_PATTERN = /^%%\s*(GLO_[A-Z0-9_]+)\.(\d+)\s*%%$/;

/**
 * Parser for glossary entries with paragraph clusters
 */
export class GlossaryParser {
  /**
   * Parse a glossary entry file
   * Handles both old format (plain markdown) and new format (paragraph clusters)
   */
  parseFile(filePath: string): GlossaryEntryParsed {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { metadata, content } = parseFrontmatter(rawContent);

    const entryId = extractIdFromPath(filePath);
    const category = extractCategoryFromPath(filePath);
    const language = detectLanguage(filePath);

    const entry = createGlossaryEntry(entryId, filePath, language);
    entry.category = category;

    // Apply frontmatter metadata
    if (metadata.id) entry.id = metadata.id as string;
    if (metadata.name) entry.name = metadata.name as string;
    if (metadata.type) entry.type = metadata.type as string;
    if (metadata.category) entry.category = metadata.category as string;
    if (metadata.research_status) entry.researchStatus = metadata.research_status as string;
    if (metadata.last_updated) entry.lastUpdated = metadata.last_updated as string;
    // Language and pronunciation metadata
    if (metadata.languages) entry.languages = metadata.languages as string[];
    if (metadata.original_script) entry.originalScript = metadata.original_script as string;
    if (metadata.transliteration) entry.transliteration = metadata.transliteration as string;
    if (metadata.pronunciation) entry.pronunciation = metadata.pronunciation as string;
    if (metadata.aliases) entry.aliases = metadata.aliases as string[];
    entry.metadata = metadata;

    const lines = content.split('\n');

    // Check if this is a paragraph-clustered entry (has GLO_ IDs)
    const hasParaClusters = lines.some(line => GLOSSARY_PARA_ID_PATTERN.test(line.trim()));

    if (hasParaClusters) {
      // Parse paragraph clusters
      entry.paragraphs = this.parseParagraphClusters(lines, entryId, language !== 'original');
    } else {
      // Convert old format to single paragraph (for backwards compatibility)
      entry.paragraphs = this.parseOldFormat(lines, entryId, content);
      // Extract metadata from old format
      this.extractOldFormatMetadata(entry, lines);
    }

    return entry;
  }

  /**
   * Parse paragraph clusters from lines
   */
  private parseParagraphClusters(
    lines: string[],
    entryId: string,
    isTranslation: boolean
  ): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    let idx = 0;

    while (idx < lines.length) {
      const [para, nextIdx] = this.parseSingleCluster(lines, idx, entryId, isTranslation);
      if (para) {
        paragraphs.push(para);
      }
      idx = nextIdx;
    }

    return paragraphs;
  }

  /**
   * Parse a single paragraph cluster
   */
  private parseSingleCluster(
    lines: string[],
    startIdx: number,
    entryId: string,
    isTranslation: boolean
  ): [Paragraph | null, number] {
    if (startIdx >= lines.length) {
      return [null, startIdx + 1];
    }

    // Find next paragraph ID
    let idx = startIdx;
    let paraIdMatch: RegExpMatchArray | null = null;

    while (idx < lines.length) {
      const line = lines[idx].trim();
      paraIdMatch = line.match(GLOSSARY_PARA_ID_PATTERN) || line.match(PARAGRAPH_ID_PATTERN);
      if (paraIdMatch) {
        break;
      }
      idx++;
    }

    if (!paraIdMatch) {
      return [null, lines.length];
    }

    // Extract paragraph ID parts
    const prefix = paraIdMatch[1]; // GLO_VISCONTI or numeric carnet
    const paraNumStr = paraIdMatch[2];
    const paraNum = parseInt(paraNumStr, 10);
    const paraId = `${prefix}.${paraNumStr}`;

    const para = createParagraph(paraId, prefix, paraNum);
    idx++;

    // Parse content after paragraph ID
    const mainTextLines: string[] = [];

    while (idx < lines.length) {
      const line = lines[idx];
      const trimmed = line.trim();

      // Check if we've hit the next paragraph ID
      if (GLOSSARY_PARA_ID_PATTERN.test(trimmed) || PARAGRAPH_ID_PATTERN.test(trimmed)) {
        break;
      }

      // Extract metadata from comment lines
      if (trimmed.startsWith('%%') && trimmed.endsWith('%%')) {
        const extracted = this.extractMetadata(trimmed);

        if (extracted) {
          if ('timestamp' in extracted) {
            para.notes.push(extracted as Note);
          } else if (Array.isArray(extracted)) {
            para.glossaryLinks.push(...(extracted as GlossaryLink[]));
          } else if ('version' in extracted) {
            const { version, text } = extracted as { version: string | null; text: string };
            if (version) {
              para.translationVersions.set(version, text);
            } else if (isTranslation && !para.originalText) {
              para.originalText = text;
            }
          }
        }
      } else if (trimmed) {
        mainTextLines.push(trimmed);

        // Extract inline glossary links
        const inlineLinks = this.extractGlossaryLinks(trimmed);
        para.glossaryLinks.push(...inlineLinks);
      }

      idx++;
    }

    // Assign main text
    if (mainTextLines.length > 0) {
      const mainText = mainTextLines.join('\n');

      // Check for header
      const headerMatch = mainText.match(HEADER_PATTERN);
      if (headerMatch) {
        para.isHeader = true;
        para.headerLevel = headerMatch[1].length;
      }

      if (isTranslation) {
        para.translatedText = mainText;
      } else {
        para.originalText = mainText;
      }
    }

    // Sort notes by timestamp
    para.notes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Deduplicate glossary links
    const seenLinks = new Set<string>();
    para.glossaryLinks = para.glossaryLinks.filter(link => {
      if (seenLinks.has(link.displayText)) return false;
      seenLinks.add(link.displayText);
      return true;
    });

    // Extract languages
    const tagIds = para.glossaryLinks.map(link => link.displayText);
    para.languages = extractLanguagesFromTags(tagIds);

    return [para, idx];
  }

  /**
   * Parse old format (non-paragraph-clustered) glossary entries
   * Creates a single paragraph containing all content
   */
  private parseOldFormat(lines: string[], entryId: string, fullContent: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    let paraNum = 1;

    // Split by ## headers to create pseudo-paragraphs
    let currentSection: string[] = [];
    let currentHeader: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section
        if (currentSection.length > 0 || currentHeader) {
          const para = this.createOldFormatParagraph(
            entryId,
            paraNum++,
            currentHeader,
            currentSection
          );
          if (para) paragraphs.push(para);
        }

        currentHeader = trimmed;
        currentSection = [];
      } else if (trimmed) {
        currentSection.push(trimmed);
      }
    }

    // Save last section
    if (currentSection.length > 0 || currentHeader) {
      const para = this.createOldFormatParagraph(
        entryId,
        paraNum++,
        currentHeader,
        currentSection
      );
      if (para) paragraphs.push(para);
    }

    return paragraphs;
  }

  /**
   * Create a paragraph from old format section
   */
  private createOldFormatParagraph(
    entryId: string,
    paraNum: number,
    header: string | null,
    contentLines: string[]
  ): Paragraph | null {
    const paraId = `GLO_${entryId}.${String(paraNum).padStart(4, '0')}`;
    const para = createParagraph(paraId, `GLO_${entryId}`, paraNum);

    // Process header
    if (header) {
      const headerMatch = header.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch) {
        para.isHeader = true;
        para.headerLevel = headerMatch[1].length;
        para.originalText = header;
      }
    }

    // Process content
    if (contentLines.length > 0) {
      const text = contentLines.join('\n');

      // Don't include metadata lines in content
      const filteredLines = contentLines.filter(line => {
        return !line.startsWith('**Research Status**') &&
               !line.startsWith('**Last Updated**') &&
               !line.startsWith('**Type**') &&
               !line.startsWith('- Type:') &&
               !line.startsWith('- Status:');
      });

      if (filteredLines.length > 0 || header) {
        if (header) {
          para.originalText = header;
        }
        if (filteredLines.length > 0) {
          const bodyText = filteredLines.join('\n');
          if (para.originalText) {
            para.originalText += '\n\n' + bodyText;
          } else {
            para.originalText = bodyText;
          }
        }

        // Extract glossary links from content
        for (const line of filteredLines) {
          const links = this.extractGlossaryLinks(line);
          para.glossaryLinks.push(...links);
        }

        return para;
      }
    }

    return header ? para : null;
  }

  /**
   * Extract metadata from old format entries
   */
  private extractOldFormatMetadata(entry: GlossaryEntryParsed, lines: string[]): void {
    for (const line of lines) {
      const trimmed = line.trim();

      // Extract name from first H1
      if (trimmed.startsWith('# ') && entry.name === entry.id.replace(/_/g, ' ')) {
        entry.name = trimmed.slice(2).trim();
      }

      // Extract research status
      const statusMatch = trimmed.match(/\*\*Research Status\*\*:\s*(.+)/);
      if (statusMatch) {
        entry.researchStatus = statusMatch[1].trim();
      }

      // Extract last updated
      const updatedMatch = trimmed.match(/\*\*Last Updated\*\*:\s*(.+)/);
      if (updatedMatch) {
        entry.lastUpdated = updatedMatch[1].trim();
      }

      // Extract type from various formats
      const typeMatch = trimmed.match(/\*\*Type\*\*:\s*(.+)/) ||
                        trimmed.match(/- Type:\s*(.+)/);
      if (typeMatch) {
        entry.type = typeMatch[1].trim();
      }
    }

    // Infer type from category if not found
    if (entry.type === 'Unknown' && entry.category) {
      const categoryParts = entry.category.split('/');
      if (categoryParts[0]) {
        entry.type = categoryParts[0].charAt(0).toUpperCase() + categoryParts[0].slice(1, -1);
      }
    }
  }

  /**
   * Extract metadata from a comment line
   */
  private extractMetadata(
    commentLine: string
  ): Note | GlossaryLink[] | { version: string | null; text: string } | null {
    const noteMatch = commentLine.match(NOTE_PATTERN);
    if (noteMatch) {
      return {
        timestamp: new Date(noteMatch[1]),
        role: noteMatch[2],
        content: noteMatch[3],
      };
    }

    const versionMatch = commentLine.match(VERSION_PATTERN);
    if (versionMatch) {
      return {
        version: `v${versionMatch[1]}`,
        text: versionMatch[2],
      };
    }

    const glossaryLinks = this.extractGlossaryLinks(commentLine);
    if (glossaryLinks.length > 0) {
      return glossaryLinks;
    }

    // Plain text in comment
    const content = commentLine.slice(2, -2).trim();
    if (content && (!content.startsWith('v') || !/^v\d/.test(content))) {
      return { version: null, text: content };
    }

    return null;
  }

  /**
   * Extract glossary links from text
   */
  private extractGlossaryLinks(text: string): GlossaryLink[] {
    const links: GlossaryLink[] = [];
    const pattern = new RegExp(GLOSSARY_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const link: GlossaryLink = {
        displayText: match[1],
        filePath: match[2],
      };

      if (!links.some(l => l.displayText === link.displayText)) {
        links.push(link);
      }
    }

    return links;
  }

  /**
   * Parse all entries in a glossary category directory
   */
  parseCategory(categoryDir: string): GlossaryEntryParsed[] {
    if (!fs.existsSync(categoryDir)) {
      throw new Error(`Directory not found: ${categoryDir}`);
    }

    const entries: GlossaryEntryParsed[] = [];

    const processDir = (dir: string) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          processDir(fullPath);
        } else if (item.endsWith('.md') && !item.startsWith('_')) {
          try {
            entries.push(this.parseFile(fullPath));
          } catch (e) {
            console.error(`Error parsing ${fullPath}:`, e);
          }
        }
      }
    };

    processDir(categoryDir);
    return entries;
  }
}

/**
 * Convenience function to parse a single glossary entry
 */
export function parseGlossaryEntry(filePath: string): GlossaryEntryParsed {
  const parser = new GlossaryParser();
  return parser.parseFile(filePath);
}

/**
 * Convenience function to parse all entries in a category
 */
export function parseGlossaryCategory(categoryDir: string): GlossaryEntryParsed[] {
  const parser = new GlossaryParser();
  return parser.parseCategory(categoryDir);
}
