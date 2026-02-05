import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Paragraph } from '../models/paragraph.js';
import type { Note } from '../models/note.js';
import type { GlossaryLink } from '../models/glossary.js';
import type { CarnetSummaryDocument, SummaryKeyPerson } from '../models/summary.js';
import {
  createParagraph,
  createCarnetSummaryDocument,
} from '../models/index.js';
import { extractLanguagesFromTags } from '../constants/languages.js';
import {
  PARAGRAPH_ID_PATTERN,
  NOTE_PATTERN,
  GLOSSARY_PATTERN,
  HEADER_PATTERN,
  VERSION_PATTERN,
  SUMMARY_PARA_ID_PATTERN,
} from './patterns.js';
import { parseFrontmatter, detectLanguage } from './frontmatter.js';

/**
 * Parser for carnet summary files with paragraph clusters
 *
 * Summary files use paragraph IDs with the SUM. prefix:
 * - Format: SUM.{carnet}.{seq} (e.g., SUM.001.0001)
 * - Located at: content/_original/{carnet}/_summary.md (original)
 *              content/{lang}/{carnet}/_summary.md (translations)
 */
export class SummaryParser {
  /**
   * Parse a carnet summary file
   */
  parseFile(filePath: string): CarnetSummaryDocument {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Summary file not found: ${filePath}`);
    }

    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { metadata, content } = parseFrontmatter(rawContent);

    // Extract carnet from path (e.g., content/_original/001/_summary.md -> "001")
    const carnet = this.extractCarnetFromPath(filePath);
    const language = detectLanguage(filePath);

    const summary = createCarnetSummaryDocument(carnet, filePath, language);

    // Apply frontmatter metadata
    this.applyFrontmatter(summary, metadata);

    const lines = content.split('\n');

    // Check if this has paragraph clusters (SUM. IDs)
    const hasParaClusters = lines.some(line => SUMMARY_PARA_ID_PATTERN.test(line.trim()));

    if (hasParaClusters) {
      // Parse paragraph clusters
      summary.paragraphs = this.parseParagraphClusters(lines, carnet, language !== 'original');
    } else {
      // Convert old format (plain markdown) to paragraph clusters
      summary.paragraphs = this.parseOldFormat(lines, carnet, content);
    }

    return summary;
  }

  /**
   * Extract carnet ID from file path
   * e.g., "content/_original/001/_summary.md" -> "001"
   */
  private extractCarnetFromPath(filePath: string): string {
    const match = filePath.match(/\/(\d{3})\/_summary\.md$/);
    if (match) {
      return match[1];
    }
    // Try to extract from parent directory
    const dir = path.dirname(filePath);
    const carnetMatch = path.basename(dir).match(/^(\d{3})$/);
    return carnetMatch ? carnetMatch[1] : '000';
  }

  /**
   * Apply frontmatter metadata to summary document
   */
  private applyFrontmatter(summary: CarnetSummaryDocument, metadata: Record<string, unknown>): void {
    // Basic fields
    if (metadata.carnet) summary.carnet = String(metadata.carnet);
    if (metadata.title) summary.title = metadata.title as string;
    if (metadata.primary_location) summary.primaryLocation = metadata.primary_location as string;
    if (metadata.location_journey) {
      summary.locationJourney = metadata.location_journey as string[];
    }
    if (metadata.major_themes) {
      summary.majorThemes = metadata.major_themes as string[];
    }
    if (typeof metadata.marie_age === 'number') {
      summary.marieAge = metadata.marie_age;
    }
    if (metadata.generated_from_entries) {
      summary.generatedFromEntries = metadata.generated_from_entries as boolean;
    }

    // Date range
    if (metadata.date_range && typeof metadata.date_range === 'object') {
      const dr = metadata.date_range as Record<string, unknown>;
      summary.dateRange = {
        start: String(dr.start || ''),
        end: String(dr.end || ''),
      };
    }

    // Key people (complex structure)
    if (Array.isArray(metadata.key_people)) {
      summary.keyPeople = (metadata.key_people as Array<Record<string, unknown>>).map(
        (kp): SummaryKeyPerson => ({
          id: String(kp.id || ''),
          role: String(kp.role || ''),
          notes: kp.notes ? String(kp.notes) : undefined,
        })
      );
    }

    // Store raw metadata for any additional fields
    summary.metadata = metadata;
  }

  /**
   * Parse paragraph clusters from lines
   */
  private parseParagraphClusters(
    lines: string[],
    carnet: string,
    isTranslation: boolean
  ): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    let idx = 0;

    while (idx < lines.length) {
      const [para, nextIdx] = this.parseSingleCluster(lines, idx, carnet, isTranslation);
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
    carnet: string,
    isTranslation: boolean
  ): [Paragraph | null, number] {
    if (startIdx >= lines.length) {
      return [null, startIdx + 1];
    }

    // Find next paragraph ID (supports both SUM. and generic patterns)
    let idx = startIdx;
    let paraIdMatch: RegExpMatchArray | null = null;

    while (idx < lines.length) {
      const line = lines[idx].trim();
      // Try SUM. specific pattern first, then generic
      paraIdMatch = line.match(SUMMARY_PARA_ID_PATTERN) || line.match(PARAGRAPH_ID_PATTERN);
      if (paraIdMatch) {
        break;
      }
      idx++;
    }

    if (!paraIdMatch) {
      return [null, lines.length];
    }

    // Extract paragraph ID parts
    const prefix = paraIdMatch[1]; // SUM.001 or other prefix
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
      if (SUMMARY_PARA_ID_PATTERN.test(trimmed) || PARAGRAPH_ID_PATTERN.test(trimmed)) {
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
   * Parse old format (non-paragraph-clustered) summary files
   * Creates paragraph clusters from markdown sections
   */
  private parseOldFormat(lines: string[], carnet: string, fullContent: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    let paraNum = 1;

    // Split by ## headers to create paragraphs
    let currentSection: string[] = [];
    let currentHeader: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section
        if (currentSection.length > 0 || currentHeader) {
          const para = this.createOldFormatParagraph(
            carnet,
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
        carnet,
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
    carnet: string,
    paraNum: number,
    header: string | null,
    contentLines: string[]
  ): Paragraph | null {
    const paraId = `SUM.${carnet}.${String(paraNum).padStart(4, '0')}`;
    const para = createParagraph(paraId, `SUM.${carnet}`, paraNum);

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
      if (header) {
        para.originalText = header;
      }
      if (contentLines.length > 0) {
        const bodyText = contentLines.join('\n');
        if (para.originalText) {
          para.originalText += '\n\n' + bodyText;
        } else {
          para.originalText = bodyText;
        }
      }

      // Extract glossary links from content
      for (const line of contentLines) {
        const links = this.extractGlossaryLinks(line);
        para.glossaryLinks.push(...links);
      }

      return para;
    }

    return header ? para : null;
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
   * Check if a summary file exists for a carnet
   */
  summaryExists(carnetDir: string): boolean {
    const summaryPath = path.join(carnetDir, '_summary.md');
    return fs.existsSync(summaryPath);
  }
}

/**
 * Convenience function to parse a summary file
 */
export function parseSummaryFile(filePath: string): CarnetSummaryDocument {
  const parser = new SummaryParser();
  return parser.parseFile(filePath);
}

/**
 * Check if a summary file exists for a carnet in a specific language
 */
export function summaryExists(carnet: string, language: string, contentRoot: string): boolean {
  const langPath = language === 'original' || language === '_original'
    ? path.join(contentRoot, '_original')
    : path.join(contentRoot, language);

  const summaryPath = path.join(langPath, carnet, '_summary.md');
  return fs.existsSync(summaryPath);
}
