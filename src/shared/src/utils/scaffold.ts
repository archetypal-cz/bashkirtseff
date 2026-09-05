import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DiaryEntry, Paragraph, Note } from '../models/index.js';
import { createParagraph, createDiaryEntry } from '../models/index.js';
import { ParagraphParser } from '../parser/paragraph-parser.js';
import { createFrontmatter } from '../parser/frontmatter.js';
import { SYNC_ROLES } from './sync.js';
import { localizeGlossaryPath } from './glossary-path.js';
import { writeFileAtomic } from './atomic-write.js';

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
 * Format a timestamp for output as zone-less local time, e.g. 2025-12-07T16:00:00.
 *
 * Content timestamps are written in local time without a zone, so rendering a
 * UTC instant with the `Z` stripped would silently shift the clock.
 */
function formatTimestamp(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/**
 * Re-emit the timestamp exactly as the source wrote it. Parsed timestamps are
 * local-time, so reformatting through toISOString() would shift every note by
 * the machine's UTC offset.
 */
function noteTimestamp(note: Note): string {
  return note.rawTimestamp ?? formatTimestamp(note.timestamp);
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

    const existingEntry = options.preserveExisting ? existingTranslation : null;

    // Copy metadata
    scaffolded.location = existingEntry?.location ?? original.location;
    scaffolded.metadata = this.buildMetadata(original, existingEntry, options);
    // Translated footnotes win; the source only supplies the ones not there yet.
    scaffolded.footnotes = { ...original.footnotes, ...(existingEntry?.footnotes ?? {}) };
    scaffolded.entryGlossaryLinks = original.entryGlossaryLinks.map(l => ({
      ...l,
      filePath: localizeGlossaryPath(l.filePath, options.targetLanguage),
    }));

    // Build map of existing translations. Headers without their own `%% id %%`
    // get a line-index-derived id (`header_<line>`), which differs between the
    // source and its translation, so they are matched by ordinal instead.
    const existingParagraphs = new Map<string, Paragraph>();
    const existingHeaders: Paragraph[] = [];
    if (existingEntry) {
      for (const para of existingEntry.paragraphs) {
        if (para.id.startsWith('header_')) {
          existingHeaders.push(para);
        } else {
          existingParagraphs.set(para.id, para);
        }
      }
    }

    // Process each original paragraph
    let headerOrdinal = 0;
    for (const origPara of original.paragraphs) {
      const existing = origPara.id.startsWith('header_')
        ? existingHeaders[headerOrdinal++]
        : existingParagraphs.get(origPara.id);

      if (existing) {
        // Preserve the paragraph the translation already has — translated text,
        // role notes and local tags alike — and refresh only source-derived data.
        // A TODO paragraph carries notes too, so it must survive as well.
        const preserved = this.cloneParagraph(existing);

        // Sync notes from original (RSR, LAN)
        if (options.includeRSR || options.includeLAN) {
          this.syncNotesFromOriginal(origPara, preserved, options);
        }

        // Update glossary links from original
        preserved.glossaryLinks = origPara.glossaryLinks.map(l => ({
          ...l,
          filePath: localizeGlossaryPath(l.filePath, options.targetLanguage),
        }));

        // A translated header usually carries no `%% French %%` comment, so the
        // parser files its text under originalText. Recover it as the translation
        // before the source heading overwrites it.
        if (
          preserved.isHeader &&
          !preserved.translatedText?.trim() &&
          preserved.originalText?.trim() &&
          preserved.originalText !== origPara.originalText
        ) {
          preserved.translatedText = preserved.originalText;
        }

        // Ensure original text is current
        preserved.originalText = origPara.originalText;

        // A paragraph that gained source text still needs its TODO marker.
        if (!preserved.translatedText?.trim() && origPara.originalText?.trim()) {
          preserved.translatedText = TODO_PLACEHOLDER;
        }

        scaffolded.paragraphs.push(preserved);
      } else {
        // Create new scaffolded paragraph
        const newPara = createParagraph(origPara.id, origPara.carnetNum, origPara.paraNum);
        newPara.isHeader = origPara.isHeader;
        newPara.headerLevel = origPara.headerLevel;
        newPara.originalText = origPara.originalText;
        newPara.languages = [...origPara.languages];
        newPara.glossaryLinks = origPara.glossaryLinks.map(l => ({
          ...l,
          filePath: localizeGlossaryPath(l.filePath, options.targetLanguage),
        }));

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
   * Compose the translation frontmatter. An existing translation's own keys win
   * key-by-key (approval flags, redaction passes, source_hash); the source only
   * fills in what is missing.
   */
  private buildMetadata(
    original: DiaryEntry,
    existingTranslation: DiaryEntry | null,
    options: ScaffoldOptions
  ): Record<string, unknown> {
    const fromSource: Record<string, unknown> = {
      date: original.date,
      carnet: original.metadata.carnet || original.metadata.carnetId,
      language: options.targetLanguage,
    };

    // Only a brand-new stub is "pending" — never stamp that onto worked-on files.
    if (!existingTranslation) {
      fromSource.status = 'translation_pending';
    }

    if (original.location) {
      fromSource.location = original.location;
    }
    if (original.metadata.title) {
      fromSource.title_original = original.metadata.title;
    }
    for (const key of ['people', 'places', 'themes']) {
      if (original.metadata[key]) {
        fromSource[key] = original.metadata[key];
      }
    }

    const merged: Record<string, unknown> = existingTranslation
      ? { ...existingTranslation.metadata }
      : {};
    for (const [key, value] of Object.entries(fromSource)) {
      if (!(key in merged)) {
        merged[key] = value;
      }
    }
    return merged;
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
      targetPara.notes.map(n => `${noteTimestamp(n)}|${n.role}`)
    );

    for (const note of origPara.notes) {
      const shouldInclude =
        (options.includeRSR && note.role === 'RSR') ||
        (options.includeLAN && note.role === 'LAN');

      if (shouldInclude) {
        const key = `${noteTimestamp(note)}|${note.role}`;
        if (!existingKeys.has(key)) {
          targetPara.notes.push({ ...note });
          existingKeys.add(key);
        }
      }
    }

    // Sort notes by timestamp, keeping the original order within a timestamp
    const order = new Map(targetPara.notes.map((n, i) => [n, i]));
    targetPara.notes.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime() || order.get(a)! - order.get(b)!
    );
  }

  /**
   * Render a paragraph's glossary tags followed by its notes, oldest first.
   * Shared by the header and body branches so both emit the same shape.
   */
  private renderTagsAndNotes(para: Paragraph): string[] {
    const out: string[] = [];

    if (para.glossaryLinks.length > 0) {
      const glossaryLine = para.glossaryLinks
        .map(l => `[#${l.displayText}](${l.filePath})`)
        .join(' ');
      out.push(`%% ${glossaryLine} %%`);
    }

    const sortedNotes = [...para.notes].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    for (const note of sortedNotes) {
      out.push(`%% ${noteTimestamp(note)} ${note.role}: ${note.content} %%`);
    }

    return out;
  }

  /**
   * Render scaffolded entry to markdown
   */
  renderScaffoldedEntry(entry: DiaryEntry, options: ScaffoldOptions): string {
    const lines: string[] = [];

    // Frontmatter — already merged by buildMetadata(), so render it verbatim
    lines.push(createFrontmatter(entry.metadata).trim());
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
        const hasRealId = !para.id.startsWith('header_');
        // Tags and notes, in the paragraph renderer's order (tags then notes)
        const headerMeta = this.renderTagsAndNotes(para);
        // Paragraph ID (if not a generated header ID)
        if (hasRealId) {
          lines.push(`%% ${para.id} %%`);
        }
        // Comment with original header text (without the # prefix)
        if (originalHeaderText) {
          lines.push(`%% ${originalHeaderText} %%`);
        }
        // A real `%% id %%` opens the cluster, so its tags and notes belong with
        // it, ahead of the heading line — where the paragraph renderer and the
        // existing corpus put them. An id-less heading is a one-line cluster of
        // its own: comments in front of it make the parser drop the heading, so
        // there they have to follow it.
        if (hasRealId) {
          lines.push(...headerMeta);
        }
        lines.push(`${headerPrefix} ${translatedHeaderText}`);
        if (!hasRealId) {
          lines.push(...headerMeta);
        }
        continue;
      }

      // 1. Paragraph ID (MUST come first)
      lines.push(`%% ${para.id} %%`);

      // 2. French original in comment
      if (para.originalText) {
        lines.push(`%% ${para.originalText} %%`);
      }

      // 3./4. Glossary links, then notes (sorted by timestamp)
      lines.push(...this.renderTagsAndNotes(para));

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
        writeFileAtomic(translationPath, content);
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

    // Entry files only — README/PROGRESS are carnet docs, not diary entries,
    // and scaffolding them rewrites them into a translation stub.
    const files = fs.readdirSync(originalDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md' && f !== 'PROGRESS.md')
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
