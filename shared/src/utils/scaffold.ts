import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DiaryEntry, Paragraph } from '../models/index.js';
import { createParagraph, createDiaryEntry } from '../models/index.js';
import { ParagraphParser } from '../parser/paragraph-parser.js';
import { createFrontmatter } from '../parser/frontmatter.js';
import { SYNC_ROLES } from './sync.js';

/**
 * Placeholder text for untranslated paragraphs
 * Frontend should display this as "—" (em dash)
 */
export const TODO_PLACEHOLDER = 'TODO';

/**
 * Options for scaffolding translation files
 */
export interface ScaffoldOptions {
  /** Target language code (e.g., 'cz', 'en') */
  targetLanguage: string;
  /** Overwrite existing files (default: false) */
  overwrite: boolean;
  /** Preserve existing translations if file exists (default: true) */
  preserveExisting: boolean;
  /** Include RSR notes from original (default: true) */
  includeRSR: boolean;
  /** Include LAN notes from original (default: true) */
  includeLAN: boolean;
  /** Dry run - don't write files (default: false) */
  dryRun: boolean;
  /** Verbose output (default: false) */
  verbose: boolean;
}

/**
 * Default scaffold options
 */
export function createDefaultScaffoldOptions(): ScaffoldOptions {
  return {
    targetLanguage: 'cz',
    overwrite: false,
    preserveExisting: true,
    includeRSR: true,
    includeLAN: true,
    dryRun: false,
    verbose: false,
  };
}

/**
 * Result of scaffolding a single entry
 */
export interface ScaffoldEntryResult {
  originalPath: string;
  translationPath: string;
  created: boolean;
  skipped: boolean;
  reason?: string;
  paragraphsTotal: number;
  paragraphsWithTodo: number;
  paragraphsPreserved: number;
}

/**
 * Result of scaffolding a carnet
 */
export interface ScaffoldCarnetResult {
  carnetId: string;
  entries: ScaffoldEntryResult[];
  totalCreated: number;
  totalSkipped: number;
  errors: string[];
}

/**
 * Format a timestamp for output (without milliseconds)
 */
function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

/**
 * Scaffold translation files from originals
 */
export class TranslationScaffold {
  private parser: ParagraphParser;

  constructor() {
    this.parser = new ParagraphParser();
  }

  /**
   * Generate scaffolded translation entry from original
   * Creates TODO placeholders for untranslated paragraphs
   */
  scaffoldEntry(
    original: DiaryEntry,
    existingTranslation: DiaryEntry | null,
    options: ScaffoldOptions
  ): DiaryEntry {
    const scaffolded = createDiaryEntry(
      original.filePath.replace('/_original/', `/${options.targetLanguage}/`),
      original.date,
      options.targetLanguage
    );

    // Copy metadata
    scaffolded.location = original.location;
    scaffolded.metadata = { ...original.metadata };
    scaffolded.footnotes = { ...original.footnotes };
    scaffolded.entryGlossaryLinks = original.entryGlossaryLinks.map(l => ({ ...l }));

    // Build map of existing translations
    const existingParagraphs = new Map<string, Paragraph>();
    if (existingTranslation && options.preserveExisting) {
      for (const para of existingTranslation.paragraphs) {
        existingParagraphs.set(para.id, para);
      }
    }

    // Process each original paragraph
    for (const origPara of original.paragraphs) {
      const existing = existingParagraphs.get(origPara.id);

      // Check if existing has real translation (not TODO)
      const hasRealTranslation = existing?.translatedText &&
        existing.translatedText !== TODO_PLACEHOLDER &&
        existing.translatedText.trim() !== '';

      if (hasRealTranslation) {
        // Preserve existing translation, but update notes from original
        const preserved = this.cloneParagraph(existing!);

        // Sync notes from original (RSR, LAN)
        if (options.includeRSR || options.includeLAN) {
          this.syncNotesFromOriginal(origPara, preserved, options);
        }

        // Update glossary links from original
        preserved.glossaryLinks = origPara.glossaryLinks.map(l => ({ ...l }));

        // Ensure original text is current
        preserved.originalText = origPara.originalText;

        scaffolded.paragraphs.push(preserved);
      } else {
        // Create new scaffolded paragraph
        const newPara = createParagraph(origPara.id, origPara.carnetNum, origPara.paraNum);
        newPara.isHeader = origPara.isHeader;
        newPara.headerLevel = origPara.headerLevel;
        newPara.originalText = origPara.originalText;
        newPara.languages = [...origPara.languages];
        newPara.glossaryLinks = origPara.glossaryLinks.map(l => ({ ...l }));

        // Copy notes from original (RSR, LAN only)
        if (options.includeRSR || options.includeLAN) {
          this.syncNotesFromOriginal(origPara, newPara, options);
        }

        // Set TODO placeholder only if there's actual text to translate
        if (origPara.originalText && origPara.originalText.trim()) {
          newPara.translatedText = TODO_PLACEHOLDER;
        }
        // Note: paragraphs with only metadata/notes don't need translation

        scaffolded.paragraphs.push(newPara);
      }
    }

    return scaffolded;
  }

  /**
   * Sync RSR and LAN notes from original to scaffolded paragraph
   */
  private syncNotesFromOriginal(
    origPara: Paragraph,
    targetPara: Paragraph,
    options: ScaffoldOptions
  ): void {
    const existingKeys = new Set(
      targetPara.notes.map(n => `${formatTimestamp(n.timestamp)}|${n.role}`)
    );

    for (const note of origPara.notes) {
      const shouldInclude =
        (options.includeRSR && note.role === 'RSR') ||
        (options.includeLAN && note.role === 'LAN');

      if (shouldInclude) {
        const key = `${formatTimestamp(note.timestamp)}|${note.role}`;
        if (!existingKeys.has(key)) {
          targetPara.notes.push({ ...note });
          existingKeys.add(key);
        }
      }
    }

    // Sort notes by timestamp
    targetPara.notes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Render scaffolded entry to markdown
   */
  renderScaffoldedEntry(entry: DiaryEntry, options: ScaffoldOptions): string {
    const lines: string[] = [];

    // Frontmatter
    const metadata: Record<string, unknown> = {
      date: entry.date,
      carnet: entry.metadata.carnet || entry.metadata.carnetId,
      language: options.targetLanguage,
      status: 'translation_pending',
    };

    if (entry.location) {
      metadata.location = entry.location;
    }

    // Copy over other useful metadata
    if (entry.metadata.title) {
      metadata.title_original = entry.metadata.title;
    }
    if (entry.metadata.people) {
      metadata.people = entry.metadata.people;
    }
    if (entry.metadata.places) {
      metadata.places = entry.metadata.places;
    }
    if (entry.metadata.themes) {
      metadata.themes = entry.metadata.themes;
    }

    lines.push(createFrontmatter(metadata).trim());
    lines.push('');

    // Entry-level glossary links
    if (entry.entryGlossaryLinks.length > 0) {
      const glossaryLine = entry.entryGlossaryLinks
        .map(l => `[#${l.displayText}](${l.filePath})`)
        .join(' ');
      lines.push(`%% ${glossaryLine} %%`);
      lines.push('');
    }

    // Render each paragraph
    for (const para of entry.paragraphs) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }

      if (para.isHeader) {
        const headerPrefix = '#'.repeat(para.headerLevel);
        // Extract header text without # prefix for comment
        const originalHeaderText = para.originalText?.replace(/^#+\s*/, '') ?? '';
        // For headers, use TODO if no translation, otherwise use translated
        const translatedHeaderText = para.translatedText === TODO_PLACEHOLDER
          ? `${TODO_PLACEHOLDER}`
          : (para.translatedText?.replace(/^#+\s*/, '') ?? originalHeaderText);
        // Paragraph ID (if not a generated header ID)
        if (!para.id.startsWith('header_')) {
          lines.push(`%% ${para.id} %%`);
        }
        // Comment with original header text (without the # prefix)
        if (originalHeaderText) {
          lines.push(`%% ${originalHeaderText} %%`);
        }
        lines.push(`${headerPrefix} ${translatedHeaderText}`);
        continue;
      }

      // 1. Paragraph ID (MUST come first)
      lines.push(`%% ${para.id} %%`);

      // 2. French original in comment
      if (para.originalText) {
        lines.push(`%% ${para.originalText} %%`);
      }

      // 3. Glossary links
      if (para.glossaryLinks.length > 0) {
        const glossaryLine = para.glossaryLinks
          .map(l => `[#${l.displayText}](${l.filePath})`)
          .join(' ');
        lines.push(`%% ${glossaryLine} %%`);
      }

      // 4. Notes (RSR, LAN only - sorted by timestamp)
      const sortedNotes = [...para.notes].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      for (const note of sortedNotes) {
        lines.push(`%% ${formatTimestamp(note.timestamp)} ${note.role}: ${note.content} %%`);
      }

      // 5. Translated text (or TODO placeholder)
      if (para.translatedText) {
        lines.push(para.translatedText);
      }
    }

    // Footnotes
    if (Object.keys(entry.footnotes).length > 0) {
      lines.push('');
      const sortedFootnotes = Object.entries(entry.footnotes).sort(
        ([a], [b]) => a.localeCompare(b)
      );
      for (const [fnId, fnText] of sortedFootnotes) {
        lines.push(`[^${fnId}]: ${fnText}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Scaffold a single entry file
   */
  scaffoldEntryFile(
    originalPath: string,
    translationPath: string,
    options: ScaffoldOptions = createDefaultScaffoldOptions()
  ): ScaffoldEntryResult {
    const result: ScaffoldEntryResult = {
      originalPath,
      translationPath,
      created: false,
      skipped: false,
      paragraphsTotal: 0,
      paragraphsWithTodo: 0,
      paragraphsPreserved: 0,
    };

    try {
      // Check if original exists
      if (!fs.existsSync(originalPath)) {
        result.skipped = true;
        result.reason = 'Original file not found';
        return result;
      }

      // Check if translation exists and overwrite is false
      if (fs.existsSync(translationPath) && !options.overwrite) {
        result.skipped = true;
        result.reason = 'Translation file already exists (use overwrite: true to update)';
        return result;
      }

      // Parse original
      const original = this.parser.parseFile(originalPath);

      // Parse existing translation if present and preserveExisting is true
      let existingTranslation: DiaryEntry | null = null;
      if (fs.existsSync(translationPath) && options.preserveExisting) {
        existingTranslation = this.parser.parseFile(translationPath);
      }

      // Create scaffolded entry
      const scaffolded = this.scaffoldEntry(original, existingTranslation, options);

      // Count statistics
      result.paragraphsTotal = scaffolded.paragraphs.length;
      for (const para of scaffolded.paragraphs) {
        if (para.translatedText === TODO_PLACEHOLDER) {
          result.paragraphsWithTodo++;
        } else if (para.translatedText && para.translatedText !== TODO_PLACEHOLDER) {
          result.paragraphsPreserved++;
        }
      }

      // Render to markdown
      const content = this.renderScaffoldedEntry(scaffolded, options);

      // Write if not dry run
      if (!options.dryRun) {
        // Ensure directory exists
        const dir = path.dirname(translationPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(translationPath, content, 'utf-8');
        result.created = true;
      } else {
        result.created = false;
        result.reason = 'Dry run - file not written';
      }

    } catch (error) {
      result.skipped = true;
      result.reason = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Scaffold all entries in a carnet
   */
  scaffoldCarnet(
    originalDir: string,
    translationDir: string,
    options: ScaffoldOptions = createDefaultScaffoldOptions()
  ): ScaffoldCarnetResult {
    const carnetId = path.basename(originalDir);
    const result: ScaffoldCarnetResult = {
      carnetId,
      entries: [],
      totalCreated: 0,
      totalSkipped: 0,
      errors: [],
    };

    if (!fs.existsSync(originalDir)) {
      result.errors.push(`Original directory not found: ${originalDir}`);
      return result;
    }

    // Find all markdown files in original (exclude _workflow folder)
    const files = fs.readdirSync(originalDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('_'))
      .sort();

    for (const file of files) {
      const originalPath = path.join(originalDir, file);
      const translationPath = path.join(translationDir, file);

      const entryResult = this.scaffoldEntryFile(originalPath, translationPath, options);
      result.entries.push(entryResult);

      if (entryResult.created) {
        result.totalCreated++;
      } else if (entryResult.skipped) {
        result.totalSkipped++;
        if (entryResult.reason && !entryResult.reason.includes('already exists')) {
          result.errors.push(`${file}: ${entryResult.reason}`);
        }
      }
    }

    return result;
  }

  /**
   * Clone a paragraph
   */
  private cloneParagraph(para: Paragraph): Paragraph {
    const cloned = createParagraph(para.id, para.carnetNum, para.paraNum);
    cloned.isHeader = para.isHeader;
    cloned.headerLevel = para.headerLevel;
    cloned.originalText = para.originalText;
    cloned.translatedText = para.translatedText;
    cloned.translationVersions = new Map(para.translationVersions);
    cloned.notes = para.notes.map(n => ({ ...n }));
    cloned.glossaryLinks = para.glossaryLinks.map(l => ({ ...l }));
    cloned.footnoteRefs = [...para.footnoteRefs];
    cloned.languages = [...para.languages];
    return cloned;
  }
}

/**
 * Quick scaffold function for CLI usage - single entry
 */
export async function scaffoldTranslationEntry(
  originalPath: string,
  translationPath: string,
  options: Partial<ScaffoldOptions> = {}
): Promise<ScaffoldEntryResult> {
  const scaffold = new TranslationScaffold();
  const fullOptions = { ...createDefaultScaffoldOptions(), ...options };
  return scaffold.scaffoldEntryFile(originalPath, translationPath, fullOptions);
}

/**
 * Quick scaffold function for CLI usage - entire carnet
 */
export async function scaffoldCarnet(
  originalDir: string,
  translationDir: string,
  options: Partial<ScaffoldOptions> = {}
): Promise<ScaffoldCarnetResult> {
  const scaffold = new TranslationScaffold();
  const fullOptions = { ...createDefaultScaffoldOptions(), ...options };
  return scaffold.scaffoldCarnet(originalDir, translationDir, fullOptions);
}
