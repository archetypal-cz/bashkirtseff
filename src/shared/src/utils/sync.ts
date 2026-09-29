import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DiaryEntry, Paragraph, Note, GlossaryLink } from '../models/index.js';
import { createParagraph, createDiaryEntry } from '../models/index.js';
import { NOTE_ROLES } from '../constants/roles.js';
import { ParagraphParser } from '../parser/paragraph-parser.js';
import { ParagraphRenderer } from '../renderer/paragraph-renderer.js';
import { parseFrontmatter } from '../parser/frontmatter.js';
import { localizeGlossaryPath } from './glossary-path.js';
import { writeFileAtomic } from './atomic-write.js';
import { renderSourceComment } from '../renderer/paragraph-renderer.js';
import { KIND_LINE_PATTERN } from '../parser/patterns.js';
import {
  parseEntryText,
  serializeEntry,
  frenchLineIdx,
  textLineIdx,
  embeddedFrenchIdx,
  multiLineBlocks,
  ID_LINE_RE,
  HEADING_RE,
  FOOTNOTE_DEF_RE,
  FOOTNOTE_CONT_RE,
  COMMENT_LINE_RE,
  TAG_LINE_RE,
  type Cluster,
} from './entry-lines.js';

/**
 * Roles that should be synced from original to translation
 * These are research/annotation roles, not translation-specific
 */
export const SYNC_ROLES = [NOTE_ROLES.RSR, NOTE_ROLES.LAN] as const;

/**
 * Roles that are translation-specific and should NOT be synced from original
 */
export const TRANSLATION_ROLES = [NOTE_ROLES.TR, NOTE_ROLES.RED, NOTE_ROLES.CON, NOTE_ROLES.GEM] as const;

/**
 * Options for sync operations
 */
export interface SyncOptions {
  /** Whether to refresh the embedded French copy where it differs from the source */
  syncFrench: boolean;
  /** Roles to sync from original (default: RSR, LAN) */
  syncRoles: string[];
  /** Only copy notes whose timestamp is at or after this ISO date/time */
  notesSince?: string;
  /** Whether to sync glossary links */
  syncGlossaryLinks: boolean;
  /** Whether to sync frontmatter/metadata */
  syncMetadata: boolean;
  /** Whether to sync footnotes */
  syncFootnotes: boolean;
  /** Dry run - don't write files */
  dryRun: boolean;
  /** Verbose output */
  verbose: boolean;
}

/**
 * Default sync options
 */
export function createDefaultSyncOptions(): SyncOptions {
  return {
    syncFrench: true,
    syncRoles: [...SYNC_ROLES],
    syncGlossaryLinks: true,
    syncMetadata: true,
    syncFootnotes: true,
    dryRun: false,
    verbose: false,
  };
}

/**
 * Represents a single change detected during sync
 */
export interface SyncChange {
  type: 'note_added' | 'note_updated' | 'glossary_added' | 'glossary_updated' |
        'footnote_added' | 'footnote_updated' | 'footnote_ref_added' | 'metadata_updated' | 'paragraph_added' |
        'kind_updated' | 'french_updated';
  paragraphId?: string;
  role?: string;
  description: string;
  originalValue?: string;
  newValue?: string;
}

/**
 * Result of a sync operation for a single entry
 */
export interface EntrySyncResult {
  entryDate: string;
  originalPath: string;
  translationPath: string;
  changes: SyncChange[];
  written: boolean;
  error?: string;
  /** Footnotes deliberately NOT propagated because the target's state is ambiguous */
  warnings: string[];
}

/**
 * What the footnote sync will actually do for one entry. Built once and shared
 * by change detection and the merge so the two never disagree.
 */
interface FootnotePlan {
  /** Source ids whose definition is copied verbatim (under the source id) */
  addDefinitions: string[];
  /** Translation paragraph id -> source ids whose marker is appended at its end */
  addRefs: Map<string, string[]>;
  warnings: string[];
}

/**
 * Result of a sync operation for a carnet
 */
export interface CarnetSyncResult {
  carnetId: string;
  /** @deprecated Use carnetId instead */
  bookId: string;
  entries: EntrySyncResult[];
  totalChanges: number;
  entriesModified: number;
  entriesSkipped: number;
  errors: string[];
}

/**
 * @deprecated Use CarnetSyncResult instead
 */
export type BookSyncResult = CarnetSyncResult;

/**
 * Entry sync utility for propagating changes from originals to translations
 */
export class EntrySync {
  private parser: ParagraphParser;
  private renderer: ParagraphRenderer;

  constructor() {
    this.parser = new ParagraphParser();
    this.renderer = new ParagraphRenderer();
  }

  /**
   * Detect changes between original and translation
   * Returns list of changes that would be applied during sync
   */
  detectChanges(
    original: DiaryEntry,
    translation: DiaryEntry,
    options: SyncOptions = createDefaultSyncOptions()
  ): SyncChange[] {
    const changes: SyncChange[] = [];

    // Build map of translation paragraphs
    const transParagraphs = new Map<string, Paragraph>();
    for (const para of translation.paragraphs) {
      transParagraphs.set(para.id, para);
    }

    // Check each original paragraph
    for (const origPara of original.paragraphs) {
      const transPara = transParagraphs.get(origPara.id);

      if (!transPara) {
        // Paragraph doesn't exist in translation yet
        changes.push({
          type: 'paragraph_added',
          paragraphId: origPara.id,
          description: `New paragraph ${origPara.id} in original`,
        });
        continue;
      }

      // The kind marker (clipping, letter…) always follows the source
      if ((origPara.kind ?? null) !== (transPara.kind ?? null) || (origPara.kindSource ?? null) !== (transPara.kindSource ?? null)) {
        changes.push({
          type: 'kind_updated',
          paragraphId: origPara.id,
          description: `Paragraph kind of ${origPara.id}: ${transPara.kind ?? 'none'} → ${origPara.kind ?? 'none'}`,
          originalValue: transPara.kind,
          newValue: origPara.kind,
        });
      }

      // Check notes
      if (options.syncRoles.length > 0) {
        const noteChanges = this.detectNoteChanges(origPara, transPara, options.syncRoles);
        changes.push(...noteChanges);
      }

      // Check glossary links
      if (options.syncGlossaryLinks) {
        const glossaryChanges = this.detectGlossaryChanges(origPara, transPara, translation.language);
        changes.push(...glossaryChanges);
      }
    }

    // Check footnotes
    if (options.syncFootnotes) {
      const footnoteChanges = this.detectFootnoteChanges(original, translation);
      changes.push(...footnoteChanges);
    }

    // Check metadata
    if (options.syncMetadata) {
      const metadataChanges = this.detectMetadataChanges(original, translation);
      changes.push(...metadataChanges);
    }

    return changes;
  }

  /**
   * Detect note changes for a paragraph
   */
  private detectNoteChanges(
    origPara: Paragraph,
    transPara: Paragraph,
    syncRoles: string[]
  ): SyncChange[] {
    const changes: SyncChange[] = [];

    // Get notes from original that should be synced
    const origNotes = origPara.notes.filter(n => syncRoles.includes(n.role));

    // Get existing notes in translation (by role)
    const transNoteKeys = new Set(
      transPara.notes
        .filter(n => syncRoles.includes(n.role))
        .map(n => this.noteKey(n))
    );

    // Find new notes
    for (const note of origNotes) {
      const key = this.noteKey(note);
      if (!transNoteKeys.has(key)) {
        changes.push({
          type: 'note_added',
          paragraphId: origPara.id,
          role: note.role,
          description: `New ${note.role} note in paragraph ${origPara.id}`,
          newValue: note.content.substring(0, 80) + (note.content.length > 80 ? '...' : ''),
        });
      }
    }

    return changes;
  }

  /**
   * Detect glossary link changes for a paragraph
   */
  private detectGlossaryChanges(
    origPara: Paragraph,
    transPara: Paragraph,
    language: string
  ): SyncChange[] {
    const changes: SyncChange[] = [];

    // Get existing glossary links in translation
    const transGlossaryKeys = new Set(
      transPara.glossaryLinks.map(l => l.displayText)
    );

    // Find new glossary links
    for (const link of origPara.glossaryLinks) {
      if (!transGlossaryKeys.has(link.displayText)) {
        changes.push({
          type: 'glossary_added',
          paragraphId: origPara.id,
          description: `New glossary link [#${link.displayText}] in paragraph ${origPara.id}`,
          newValue: localizeGlossaryPath(link.filePath, language),
        });
      }
    }

    // Check for updated paths (same display text, different path)
    for (const origLink of origPara.glossaryLinks) {
      const transLink = transPara.glossaryLinks.find(l => l.displayText === origLink.displayText);
      if (!transLink) continue;
      const target = localizeGlossaryPath(origLink.filePath, language);
      if (transLink.filePath !== target) {
        changes.push({
          type: 'glossary_updated',
          paragraphId: origPara.id,
          description: `Updated glossary path for [#${origLink.displayText}] in paragraph ${origPara.id}`,
          originalValue: transLink.filePath,
          newValue: target,
        });
      }
    }

    return changes;
  }

  /**
   * Detect footnote changes (definitions and references)
   */
  private detectFootnoteChanges(
    original: DiaryEntry,
    translation: DiaryEntry
  ): SyncChange[] {
    const changes: SyncChange[] = [];
    const plan = this.planFootnoteSync(original, translation);

    for (const fnId of plan.addDefinitions) {
      const fnText = original.footnotes[fnId];
      changes.push({
        type: 'footnote_added',
        description: `New footnote [^${fnId}]`,
        newValue: fnText.substring(0, 60) + (fnText.length > 60 ? '...' : ''),
      });
    }

    for (const [fnId, fnText] of Object.entries(original.footnotes)) {
      if (fnId in translation.footnotes && translation.footnotes[fnId] !== fnText) {
        changes.push({
          type: 'footnote_updated',
          description: `Updated footnote [^${fnId}]`,
          originalValue: translation.footnotes[fnId].substring(0, 40),
          newValue: fnText.substring(0, 40),
        });
      }
    }

    for (const [paraId, fnIds] of plan.addRefs) {
      for (const fnId of fnIds) {
        changes.push({
          type: 'footnote_ref_added',
          paragraphId: paraId,
          description: `Add footnote ref [^${fnId}] to paragraph ${paraId}`,
        });
      }
    }

    return changes;
  }

  /**
   * Normalise a footnote definition for a same-note comparison across ids:
   * emphasis, quotes and whitespace differences must not hide an identical note.
   */
  private static footnoteKey(text: string): string {
    return text
      .toLowerCase()
      .replace(/[*_`«»"'“”‘’]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[.\s]+$/, '')
      .trim();
  }

  /**
   * Decide which source footnotes are genuinely absent from the translation.
   *
   * Translation trees renumber footnotes (source `[^3]` may be `[^01.10.1]` or
   * `[^2]` in the target), so "the source id is missing" is not evidence the note
   * is missing. A source marker counts as PRESENT when
   *   - the target references the same id anywhere, or
   *   - the target paragraph carries at least as many markers as the source
   *     paragraph (the k-th source marker maps to the k-th target marker), or
   *   - some target definition is the same text as the source definition.
   * A source marker is ADDED (definition + marker at paragraph end) only when the
   * target paragraph is translated and carries no marker at all. Anything else —
   * fewer markers than the source, an untranslated paragraph, a source note no
   * source paragraph references — is ambiguous: it is skipped with a warning
   * rather than guessed. A definition is never overwritten and never added
   * without a marker to anchor it.
   */
  private planFootnoteSync(original: DiaryEntry, translation: DiaryEntry): FootnotePlan {
    const plan: FootnotePlan = { addDefinitions: [], addRefs: new Map(), warnings: [] };

    const transParas = new Map(translation.paragraphs.map(p => [p.id, p]));
    const transRefIds = new Set<string>();
    for (const p of translation.paragraphs) {
      for (const id of p.footnoteRefs) transRefIds.add(id);
    }
    const transDefKeys = new Set(
      Object.values(translation.footnotes).map(t => EntrySync.footnoteKey(t))
    );

    const referencedInSource = new Set<string>();
    const decided = new Set<string>();
    const addDef = (fnId: string) => {
      if (fnId in original.footnotes && !(fnId in translation.footnotes) && !plan.addDefinitions.includes(fnId)) {
        plan.addDefinitions.push(fnId);
      }
    };

    for (const origPara of original.paragraphs) {
      const transPara = transParas.get(origPara.id);
      for (const fnId of origPara.footnoteRefs) {
        referencedInSource.add(fnId);
        if (decided.has(fnId)) continue;
        decided.add(fnId);
        const fnText = original.footnotes[fnId];

        if (transRefIds.has(fnId)) {
          // Same id already anchored; only a missing definition needs repair
          addDef(fnId);
          continue;
        }
        if (transPara && transPara.footnoteRefs.length >= origPara.footnoteRefs.length) {
          continue; // renumbered: the k-th target marker is this note
        }
        if (fnText !== undefined && transDefKeys.has(EntrySync.footnoteKey(fnText))) {
          continue; // same note text under another id
        }
        if (fnText === undefined) {
          plan.warnings.push(`[^${fnId}] referenced in source paragraph ${origPara.id} but never defined in the source; not propagated`);
          continue;
        }
        if (!transPara || !transPara.translatedText || transPara.translatedText.trim() === 'TODO') {
          plan.warnings.push(`[^${fnId}] (paragraph ${origPara.id}) skipped: paragraph is not translated yet, nowhere to anchor the marker`);
          continue;
        }
        if (transPara.footnoteRefs.length > 0) {
          plan.warnings.push(
            `[^${fnId}] (paragraph ${origPara.id}) skipped: target paragraph carries ${transPara.footnoteRefs.length} marker(s) ` +
            `[${transPara.footnoteRefs.map(r => `^${r}`).join(', ')}] vs ${origPara.footnoteRefs.length} in source — cannot tell which note is missing`
          );
          continue;
        }
        // Translated paragraph with no marker at all: safe to append
        addDef(fnId);
        const list = plan.addRefs.get(origPara.id) ?? [];
        list.push(fnId);
        plan.addRefs.set(origPara.id, list);
      }
    }

    for (const fnId of Object.keys(original.footnotes)) {
      if (!referencedInSource.has(fnId) && !(fnId in translation.footnotes)) {
        plan.warnings.push(`[^${fnId}] is defined in the source but no source paragraph references it; not propagated`);
      }
    }

    return plan;
  }

  /**
   * Detect metadata changes
   */
  private detectMetadataChanges(
    original: DiaryEntry,
    translation: DiaryEntry
  ): SyncChange[] {
    const changes: SyncChange[] = [];

    // Check location
    if (original.location && original.location !== translation.location) {
      changes.push({
        type: 'metadata_updated',
        description: 'Location updated',
        originalValue: translation.location,
        newValue: original.location,
      });
    }

    // Check entry-level glossary links
    const transEntryLinks = new Set(translation.entryGlossaryLinks.map(l => l.displayText));
    for (const link of original.entryGlossaryLinks) {
      if (!transEntryLinks.has(link.displayText)) {
        changes.push({
          type: 'glossary_added',
          description: `New entry-level glossary link [#${link.displayText}]`,
          newValue: localizeGlossaryPath(link.filePath, translation.language),
        });
      }
    }

    return changes;
  }

  /**
   * Sync changes from original to translation
   * Returns the synced entry (not yet written to disk)
   */
  syncEntry(
    original: DiaryEntry,
    translation: DiaryEntry,
    options: SyncOptions = createDefaultSyncOptions()
  ): DiaryEntry {
    // Create a copy of the translation to modify
    const synced = this.cloneEntry(translation);

    // Build map of synced paragraphs
    const syncedParagraphs = new Map<string, Paragraph>();
    for (const para of synced.paragraphs) {
      syncedParagraphs.set(para.id, para);
    }

    // Sync each original paragraph
    for (const origPara of original.paragraphs) {
      let syncedPara = syncedParagraphs.get(origPara.id);

      if (!syncedPara) {
        // Create new paragraph stub (preserves structure, no translation yet)
        syncedPara = createParagraph(origPara.id, origPara.carnetNum, origPara.paraNum);
        syncedPara.isHeader = origPara.isHeader;
        syncedPara.headerLevel = origPara.headerLevel;
        syncedPara.originalText = origPara.originalText;
        synced.paragraphs.push(syncedPara);
        syncedParagraphs.set(origPara.id, syncedPara);
      }

      // Sync notes
      if (options.syncRoles.length > 0) {
        this.syncNotes(origPara, syncedPara, options.syncRoles, synced.language);
      }

      // Sync glossary links
      if (options.syncGlossaryLinks) {
        this.syncGlossaryLinks(origPara, syncedPara, synced.language);
      }

      // Sync languages and the kind marker from original
      syncedPara.languages = [...origPara.languages];
      syncedPara.kind = origPara.kind;
      syncedPara.kindSource = origPara.kindSource;
    }

    // Order paragraphs as the source orders them, not by number: after a
    // carnet rebuild the numbers follow reading order again, but a file may
    // still hold IDs out of numeric order and the source order is what counts.
    // A translation-only paragraph stays right after the one it followed.
    const sourceIndex = new Map(original.paragraphs.map((p, i) => [p.id, i]));
    const sortKey = new Map<Paragraph, number>();
    let lastKey = -1;
    let offset = 0;
    for (const para of synced.paragraphs) {
      const idx = sourceIndex.get(para.id);
      if (idx !== undefined) {
        lastKey = idx;
        offset = 0;
      } else {
        offset += 1e-6;
      }
      sortKey.set(para, idx ?? lastKey + offset);
    }
    synced.paragraphs.sort((a, b) => {
      const aHeader = a.isHeader && a.id.startsWith('header_');
      const bHeader = b.isHeader && b.id.startsWith('header_');
      if (aHeader !== bHeader) return aHeader ? -1 : 1;
      return sortKey.get(a)! - sortKey.get(b)!;
    });

    // Sync footnotes (definitions and references) — see planFootnoteSync for
    // what counts as "already present"; a definition is never overwritten.
    if (options.syncFootnotes) {
      const plan = this.planFootnoteSync(original, translation);
      for (const fnId of plan.addDefinitions) {
        synced.footnotes[fnId] = original.footnotes[fnId];
      }
      for (const [paraId, fnIds] of plan.addRefs) {
        const syncedPara = syncedParagraphs.get(paraId);
        if (!syncedPara || !syncedPara.translatedText) continue;
        for (const fnId of fnIds) {
          syncedPara.translatedText = syncedPara.translatedText.trimEnd() + `[^${fnId}]`;
          syncedPara.footnoteRefs.push(fnId);
        }
      }
    }

    // Sync metadata
    if (options.syncMetadata) {
      if (original.location) {
        synced.location = original.location;
      }

      // Sync entry-level glossary links (update paths or add new)
      const existingLinkMap = new Map(
        synced.entryGlossaryLinks.map(l => [l.displayText, l])
      );
      for (const link of original.entryGlossaryLinks) {
        const target = localizeGlossaryPath(link.filePath, synced.language);
        const existing = existingLinkMap.get(link.displayText);
        if (!existing) {
          synced.entryGlossaryLinks.push({ ...link, filePath: target });
        } else if (existing.filePath !== target) {
          // Update path to match original, at the translation's depth
          existing.filePath = target;
        }
      }
    }

    return synced;
  }

  /**
   * Sync notes from original to translation paragraph
   */
  private syncNotes(origPara: Paragraph, syncedPara: Paragraph, syncRoles: string[], language: string): void {
    const existingNoteKeys = new Set(syncedPara.notes.map(n => this.noteKey(n)));

    for (const note of origPara.notes) {
      if (syncRoles.includes(note.role)) {
        const key = this.noteKey(note);
        if (!existingNoteKeys.has(key)) {
          // A note copied verbatim keeps the source tree's `../_glossary/` link
          // depth; inline links inside note text need the same localisation as
          // tag lines (cz/023 LAN notes: 26 unresolved links, 2026-09-07).
          syncedPara.notes.push({ ...note, content: localizeLinksInText(note.content, language) });
          existingNoteKeys.add(key);
        }
      }
    }

    // Sort notes by timestamp, keeping the original order within a timestamp
    const order = new Map(syncedPara.notes.map((n, i) => [n, i]));
    syncedPara.notes.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime() || order.get(a)! - order.get(b)!
    );
  }

  /**
   * Sync glossary links from original to translation paragraph
   */
  private syncGlossaryLinks(origPara: Paragraph, syncedPara: Paragraph, language: string): void {
    const existingLinks = new Map(
      syncedPara.glossaryLinks.map(l => [l.displayText, l])
    );

    for (const link of origPara.glossaryLinks) {
      const target = localizeGlossaryPath(link.filePath, language);
      const existing = existingLinks.get(link.displayText);
      if (!existing) {
        // Add new link at the translation's depth
        syncedPara.glossaryLinks.push({ ...link, filePath: target });
      } else if (existing.filePath !== target) {
        // Update path
        existing.filePath = target;
      }
    }
  }

  /**
   * Sync a single entry file pair (original -> translation)
   */
  syncEntryFile(
    originalPath: string,
    translationPath: string,
    options: SyncOptions = createDefaultSyncOptions()
  ): EntrySyncResult {
    const result: EntrySyncResult = {
      entryDate: path.basename(originalPath, '.md'),
      originalPath,
      translationPath,
      changes: [],
      written: false,
      warnings: [],
    };

    try {
      // Parse both entries
      const original = this.parser.parseFile(originalPath);

      // Check if translation exists
      let translation: DiaryEntry;
      if (fs.existsSync(translationPath)) {
        translation = this.parser.parseFile(translationPath);
      } else {
        // Create empty translation structure
        translation = createDiaryEntry(
          translationPath,
          original.date,
          path.basename(path.dirname(path.dirname(translationPath)))
        );
      }

      const duplicate =
        this.findDuplicateId(original) ?? this.findDuplicateId(translation);
      if (duplicate) {
        result.error = `Duplicate paragraph ID ${duplicate}; refusing to sync`;
        return result;
      }

      if (fs.existsSync(translationPath)) {
        // An existing file is patched line by line: only lines that carry a
        // change are touched, everything else stays byte-for-byte.
        const plan = options.syncFootnotes ? this.planFootnoteSync(original, translation) : null;
        result.warnings = plan?.warnings ?? [];
        for (const w of result.warnings) {
          console.warn(`[sync] WARN ${path.basename(translationPath)}: ${w}`);
        }
        const before = fs.readFileSync(translationPath, 'utf-8');
        const patched = patchTranslation(
          fs.readFileSync(originalPath, 'utf-8'),
          before,
          translation.language,
          options,
          plan,
          result.changes,
          result.warnings
        );
        if (patched !== before && !options.dryRun) {
          writeFileAtomic(translationPath, patched);
          result.written = true;
        }
        return result;
      }

      // No translation file yet: render one from scratch
      result.changes = this.detectChanges(original, translation, options);
      if (result.changes.length === 0) {
        return result;
      }

      // Apply sync - this merges original notes/glossary into translation
      const synced = this.syncEntry(original, translation, options);

      // The synced entry needs to have originalText from the original entry
      // for proper rendering (French text in comments)
      for (const syncedPara of synced.paragraphs) {
        const origPara = original.paragraphs.find(p => p.id === syncedPara.id);
        if (origPara && origPara.originalText) {
          syncedPara.originalText = origPara.originalText;
        }
      }

      // Render back to markdown using the renderer's translation format,
      // keeping the translation file's own frontmatter untouched
      const existingFrontmatter = fs.existsSync(translationPath)
        ? parseFrontmatter(fs.readFileSync(translationPath, 'utf-8')).raw
        : '';
      const content = existingFrontmatter + this.renderer.renderTranslationEntry(synced);

      // Write if not dry run
      if (!options.dryRun) {
        // Ensure directory exists
        const dir = path.dirname(translationPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        writeFileAtomic(translationPath, content);
        result.written = true;
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Sync all entries in a carnet
   */
  syncCarnet(
    originalDir: string,
    translationDir: string,
    options: SyncOptions = createDefaultSyncOptions()
  ): CarnetSyncResult {
    const carnetId = path.basename(originalDir);
    const result: CarnetSyncResult = {
      carnetId,
      bookId: carnetId, // backward compatibility
      entries: [],
      totalChanges: 0,
      entriesModified: 0,
      entriesSkipped: 0,
      errors: [],
    };

    if (!fs.existsSync(originalDir)) {
      result.errors.push(`Original directory not found: ${originalDir}`);
      return result;
    }

    // Entry files only: README.md and other carnet files are not synced
    const files = fs.readdirSync(originalDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f))
      .sort();

    for (const file of files) {
      const originalPath = path.join(originalDir, file);
      const translationPath = path.join(translationDir, file);

      const entryResult = this.syncEntryFile(originalPath, translationPath, options);
      result.entries.push(entryResult);

      if (entryResult.error) {
        result.errors.push(`${file}: ${entryResult.error}`);
      } else if (entryResult.changes.length > 0) {
        result.totalChanges += entryResult.changes.length;
        if (entryResult.written || options.dryRun) {
          result.entriesModified++;
        }
      } else {
        result.entriesSkipped++;
      }
    }

    return result;
  }

  /**
   * @deprecated Use syncCarnet instead
   * Backward compatibility alias
   */
  syncBook(
    originalDir: string,
    translationDir: string,
    options: SyncOptions = createDefaultSyncOptions()
  ): CarnetSyncResult {
    return this.syncCarnet(originalDir, translationDir, options);
  }

  /**
   * Create a deep clone of an entry
   */
  private cloneEntry(entry: DiaryEntry): DiaryEntry {
    const cloned = createDiaryEntry(entry.filePath, entry.date, entry.language);
    cloned.location = entry.location;
    // Without this a legacy-notation entry comes back as `%%` notation on sync
    cloned.idStyle = entry.idStyle;
    cloned.entryGlossaryLinks = entry.entryGlossaryLinks.map(l => ({ ...l }));
    cloned.footnotes = { ...entry.footnotes };
    cloned.metadata = { ...entry.metadata };

    cloned.paragraphs = entry.paragraphs.map(para => {
      const clonedPara = createParagraph(para.id, para.carnetNum, para.paraNum);
      clonedPara.isHeader = para.isHeader;
      clonedPara.headerLevel = para.headerLevel;
      clonedPara.originalText = para.originalText;
      clonedPara.translatedText = para.translatedText;
      clonedPara.translationVersions = new Map(para.translationVersions);
      clonedPara.notes = para.notes.map(n => ({ ...n }));
      clonedPara.glossaryLinks = para.glossaryLinks.map(l => ({ ...l }));
      clonedPara.footnoteRefs = [...para.footnoteRefs];
      clonedPara.languages = [...para.languages];
      clonedPara.kind = para.kind;
      clonedPara.kindSource = para.kindSource;
      return clonedPara;
    });

    return cloned;
  }

  /**
   * Return the first paragraph ID that appears more than once, if any
   */
  private findDuplicateId(entry: DiaryEntry): string | null {
    const seen = new Set<string>();
    for (const para of entry.paragraphs) {
      if (para.id.startsWith('header_')) continue;
      if (seen.has(para.id)) return para.id;
      seen.add(para.id);
    }
    return null;
  }

  /**
   * Create a unique key for a note (for deduplication)
   */
  private noteKey(note: Note): string {
    // Depth-agnostic: a source note and its localised copy are the same note.
    return `${note.timestamp.toISOString()}|${note.role}|${localizeLinksInText(note.content, 'original')}`;
  }
}

/**
 * Localise every `](…_glossary/…)` link target inside free text (note bodies,
 * comment spans) for the tree `language` lives in — the per-link equivalent of
 * `localizeGlossaryPath`, which handles tag lines.
 */
export function localizeLinksInText(text: string, language: string): string {
  return text.replace(/\]\(([^)\s]+)\)/g, (m, target: string) => {
    const localized = localizeGlossaryPath(target, language);
    return localized === target ? m : `](${localized})`;
  });
}

/**
 * Quick sync function for CLI usage
 */
export async function syncOriginalToTranslation(
  originalPath: string,
  translationPath: string,
  options: Partial<SyncOptions> = {}
): Promise<EntrySyncResult> {
  const sync = new EntrySync();
  const fullOptions = { ...createDefaultSyncOptions(), ...options };
  return sync.syncEntryFile(originalPath, translationPath, fullOptions);
}

/**
 * Quick sync function for entire carnet
 */
export async function syncCarnet(
  originalDir: string,
  translationDir: string,
  options: Partial<SyncOptions> = {}
): Promise<CarnetSyncResult> {
  const sync = new EntrySync();
  const fullOptions = { ...createDefaultSyncOptions(), ...options };
  return sync.syncCarnet(originalDir, translationDir, fullOptions);
}

/**
 * @deprecated Use syncCarnet instead
 * Quick sync function for entire carnet (backward compatibility)
 */
export async function syncBook(
  originalDir: string,
  translationDir: string,
  options: Partial<SyncOptions> = {}
): Promise<CarnetSyncResult> {
  return syncCarnet(originalDir, translationDir, options);
}

// --- line-level patching ---------------------------------------------------------

/** Same as scaffold.ts TODO_PLACEHOLDER (not imported: scaffold imports this module) */
const TODO = 'TODO';
const NOTE_LINE_RE = /^\s*%%\s*(\d{4}-\d{2}-\d{2}T[\d:]+)\s+([A-Z]{2,4}):\s*(.*?)\s*%%\s*$/;
const TAG_RE = /\[#([^\]]+)\]\(([^)]*)\)/g;

/**
 * Embedded French compared as text: markers, `#`, footnote refs, spacing and
 * typographic vs straight quotes/apostrophes ignored (older copies use either).
 */
function frenchKey(lines: string[]): string {
  return lines
    .map((l) => l.trim().replace(/^%%\s*/, '').replace(/\s*%%$/, '').replace(/^#{1,6}\s+/, '').replace(/\[\^[^\]]+\]/g, ''))
    .join(' ')
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Index after the ID line, its kind line and the comment lines that directly follow. */
function afterIdAndComments(lines: string[]): number {
  let i = lines.findIndex((l) => ID_LINE_RE.test(l));
  i = i < 0 ? 0 : i + 1;
  while (i < lines.length && COMMENT_LINE_RE.test(lines[i]) && !ID_LINE_RE.test(lines[i])) i++;
  return i;
}

function afterIdAndKind(lines: string[]): number {
  let i = lines.findIndex((l) => ID_LINE_RE.test(l)) + 1;
  while (i < lines.length && KIND_LINE_PATTERN.test(lines[i])) i++;
  return i;
}

/** Footnote definition blocks of a file's lines, by label */
function footnoteDefBlocks(lines: string[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FOOTNOTE_DEF_RE);
    if (!m) continue;
    const block = [lines[i]];
    while (i + 1 < lines.length && FOOTNOTE_CONT_RE.test(lines[i + 1]) && !FOOTNOTE_DEF_RE.test(lines[i + 1])) block.push(lines[++i]);
    out.set(m[1], block);
  }
  return out;
}

/**
 * The lines that end a file's last cluster and must stay at the end: footnote
 * definitions and the blank lines around them.
 */
function splitTail(lines: string[]): { body: string[]; tail: string[] } {
  const first = lines.findIndex((l) => FOOTNOTE_DEF_RE.test(l));
  let cut = first < 0 ? lines.length : first;
  while (cut > 0 && !lines[cut - 1].trim()) cut--;
  if (first < 0) return { body: lines, tail: [] };
  return { body: lines.slice(0, cut), tail: lines.slice(cut) };
}

/** Source RSR/LAN (etc.) note lines of a cluster, filtered by role and date */
function sourceNoteLines(lines: string[], roles: string[], since?: string): string[] {
  return lines.filter((l) => {
    const m = l.match(NOTE_LINE_RE);
    return !!m && roles.includes(m[2]) && (!since || m[1] >= since);
  });
}

function noteLineKey(line: string): string | null {
  const m = line.match(NOTE_LINE_RE);
  return m ? `${m[1]}|${m[2]}|${localizeLinksInText(m[3], 'original').replace(/\s+/g, ' ')}` : null;
}

/** A translation cluster for a paragraph new in the source, shaped like `just scaffold` output. */
function newTranslationLines(src: string[], language: string, frVisible: boolean, options: SyncOptions): string[] {
  const id = src.find((l) => ID_LINE_RE.test(l))!.trim();
  const out = [id];
  out.push(...src.filter((l) => KIND_LINE_PATTERN.test(l)).map((l) => l.trim()));
  const french = frenchLineIdx(src).map((i) => src[i]);
  out.push(...renderSourceComment(french.join('\n')));
  out.push(...src.filter((l) => TAG_LINE_RE.test(l)).map((l) => localizeLinksInText(l.trim(), language)));
  out.push(...sourceNoteLines(src, options.syncRoles, options.notesSince).map((l) => localizeLinksInText(l.trim(), language)));
  const flines = french.map((l) => l.trim());
  if (language === 'fr') {
    if (frVisible) out.push(...flines);
  } else {
    for (const l of flines) if (HEADING_RE.test(l)) out.push(`${l.match(/^#+/)![0]} ${TODO}`);
    if (flines.some((l) => !HEADING_RE.test(l))) out.push(TODO);
  }
  out.push('');
  return out;
}

/**
 * Patch a translation file from its source file, touching only the lines that
 * carry a change: a paragraph new in the source is inserted after the paragraph
 * that precedes it there; the kind marker follows the source; the embedded
 * French is replaced only when its text differs from the source (a missing
 * heading copy is not a difference); missing tag lines, notes, footnote markers
 * and definitions are inserted when their options are on. Paragraph order,
 * blank lines, line shapes and the final newline are never changed.
 */
export function patchTranslation(
  originalText: string,
  translationText: string,
  language: string,
  options: SyncOptions,
  footnotes: FootnotePlan | null,
  changes: SyncChange[],
  warnings: string[]
): string {
  const o = parseEntryText('original', originalText);
  const t = parseEntryText('translation', translationText);
  if (!t.clusters.length) {
    if (o.clusters.length) warnings.push('translation has no paragraph IDs; not patched (scaffold it)');
    return translationText;
  }
  const byId = new Map(t.clusters.map((c) => [c.id, c]));
  const frVisible = t.clusters.some((c) => textLineIdx(c.lines).length > 0);
  let prev: Cluster | null = null;

  for (const oc of o.clusters) {
    let tc = byId.get(oc.id);
    if (!tc && !frenchLineIdx(oc.lines).length) continue; // notes-only source paragraph: trees omit it
    if (!tc) {
      tc = { id: oc.id, lines: newTranslationLines(oc.lines, language, frVisible, options), origin: t.name };
      if (!prev) {
        // Before the first paragraph: the lines above its ID line stay on top
        const first = t.clusters[0];
        const pre = first.lines.splice(0, first.lines.findIndex((l) => ID_LINE_RE.test(l)));
        tc.lines.unshift(...pre);
        t.clusters.unshift(tc);
      } else {
        const at = t.clusters.indexOf(prev) + 1;
        if (at === t.clusters.length) {
          // After the last paragraph: its footnote definitions move below the new one
          const { body, tail } = splitTail(prev.lines);
          prev.lines = body;
          if (body.length && body[body.length - 1].trim()) body.push('');
          if (!tail.length) tc.lines.pop();
          tc.lines.push(...tail);
        } else if (prev.lines.length && prev.lines[prev.lines.length - 1].trim()) {
          prev.lines.push('');
        }
        t.clusters.splice(at, 0, tc);
      }
      byId.set(tc.id, tc);
      changes.push({ type: 'paragraph_added', paragraphId: oc.id, description: `New paragraph ${oc.id} in original` });
      prev = tc;
      continue;
    }
    prev = tc;
    const lines = tc.lines;

    // Kind marker: always follows the source
    const sk = oc.lines.find((l) => KIND_LINE_PATTERN.test(l))?.trim() ?? null;
    const tkIdx = lines.findIndex((l) => KIND_LINE_PATTERN.test(l));
    const tk = tkIdx >= 0 ? lines[tkIdx].trim() : null;
    if (sk !== tk) {
      if (tkIdx >= 0) lines.splice(tkIdx, 1);
      if (sk) lines.splice(lines.findIndex((l) => ID_LINE_RE.test(l)) + 1, 0, sk);
      changes.push({ type: 'kind_updated', paragraphId: oc.id, description: `Paragraph kind of ${oc.id}: ${tk ?? 'none'} → ${sk ?? 'none'}`, originalValue: tk ?? undefined, newValue: sk ?? undefined });
    }

    // Embedded French
    if (options.syncFrench) {
      const srcFrench = frenchLineIdx(oc.lines).map((i) => oc.lines[i]);
      const srcBody = srcFrench.filter((l) => !HEADING_RE.test(l.trim()));
      const embIdx = new Set(embeddedFrenchIdx(lines));
      for (const [s, e] of multiLineBlocks(lines)) {
        // a multi-line block that is not a note is an embedded copy (fr tree)
        const head = lines[s].trim().replace(/^%%\s*/, '');
        if (/^\d{4}-\d{2}-\d{2}/.test(head) || /^[A-Z]{2,4}:/.test(head) || head.startsWith('[#')) continue;
        for (let i = s; i <= e; i++) embIdx.add(i);
      }
      const idx = [...embIdx].sort((a, b) => a - b);
      const cur = frenchKey(idx.map((i) => lines[i]));
      if (!srcFrench.length) {
        if (idx.length) warnings.push(`${oc.id}: the source paragraph has no French text but the translation embeds some; left as is`);
      } else if (cur !== frenchKey(srcFrench) && cur !== frenchKey(srcBody)) {
        const headings = srcFrench.filter((l) => HEADING_RE.test(l.trim())).map((l) => frenchKey([l]));
        const keepHeading = !idx.length || headings.some((h) => idx.some((i) => frenchKey([lines[i]]) === h));
        const fresh = renderSourceComment((keepHeading ? srcFrench : srcBody).join('\n'));
        let at: number;
        if (idx.length) {
          at = idx[0];
          for (const i of [...idx].reverse()) lines.splice(i, 1);
        } else {
          at = afterIdAndKind(lines);
        }
        lines.splice(at, 0, ...fresh);
        changes.push({ type: 'french_updated', paragraphId: oc.id, description: `Embedded French of ${oc.id} refreshed from the source`, originalValue: cur.slice(0, 80), newValue: frenchKey(fresh).slice(0, 80) });
      }
    }

    // Glossary tag lines
    if (options.syncGlossaryLinks) {
      const have = new Map<string, number>();
      lines.forEach((l, i) => {
        if (TAG_LINE_RE.test(l)) for (const m of l.matchAll(TAG_RE)) have.set(m[1], i);
      });
      const add: string[] = [];
      for (const l of oc.lines.filter((x) => TAG_LINE_RE.test(x))) {
        for (const m of l.matchAll(TAG_RE)) {
          const target = localizeGlossaryPath(m[2], language);
          const i = have.get(m[1]);
          if (i === undefined) {
            add.push(`%% [#${m[1]}](${target}) %%`);
            have.set(m[1], -1);
            changes.push({ type: 'glossary_added', paragraphId: oc.id, description: `New glossary link [#${m[1]}] in paragraph ${oc.id}`, newValue: target });
          } else if (i >= 0) {
            const re = new RegExp(`\\[#${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\(([^)]*)\\)`);
            const old = lines[i].match(re)![1];
            if (old !== target) {
              lines[i] = lines[i].replace(re, `[#${m[1]}](${target})`);
              changes.push({ type: 'glossary_updated', paragraphId: oc.id, description: `Updated glossary path for [#${m[1]}] in paragraph ${oc.id}`, originalValue: old, newValue: target });
            }
          }
        }
      }
      if (add.length) {
        const lastTag = lines.reduce((acc, l, i) => (TAG_LINE_RE.test(l) ? i : acc), -1);
        lines.splice(lastTag >= 0 ? lastTag + 1 : afterIdAndKind(lines), 0, ...add);
      }
    }

    // Notes
    if (options.syncRoles.length) {
      const have = new Set(lines.map(noteLineKey).filter(Boolean));
      const add = sourceNoteLines(oc.lines, options.syncRoles, options.notesSince).filter((l) => !have.has(noteLineKey(l)));
      if (add.length) {
        lines.splice(afterIdAndComments(lines), 0, ...add.map((l) => localizeLinksInText(l.trim(), language)));
        for (const l of add) {
          const m = l.match(NOTE_LINE_RE)!;
          changes.push({ type: 'note_added', paragraphId: oc.id, role: m[2], description: `New ${m[2]} note in paragraph ${oc.id}`, newValue: m[3].slice(0, 80) });
        }
      }
    }

    // Footnote markers (the plan only adds them to translated paragraphs with none)
    for (const fnId of footnotes?.addRefs.get(oc.id) ?? []) {
      const text = textLineIdx(lines);
      if (!text.length) continue;
      const last = text[text.length - 1];
      lines[last] = lines[last].trimEnd() + `[^${fnId}]`;
      changes.push({ type: 'footnote_ref_added', paragraphId: oc.id, description: `Add footnote ref [^${fnId}] to paragraph ${oc.id}` });
    }
  }

  // Footnote definitions go to the end of the file
  if (footnotes?.addDefinitions.length) {
    const defs = footnoteDefBlocks(o.clusters.flatMap((c) => c.lines));
    const last = t.clusters[t.clusters.length - 1].lines;
    let blanks = 0;
    while (last.length && !last[last.length - 1].trim()) { last.pop(); blanks++; }
    if (!last.some((l) => FOOTNOTE_DEF_RE.test(l))) last.push('');
    for (const fnId of footnotes.addDefinitions) {
      const block = defs.get(fnId);
      if (!block) continue;
      last.push(...block.map((l) => localizeLinksInText(l, language)));
      changes.push({ type: 'footnote_added', description: `New footnote [^${fnId}]`, newValue: block[0].slice(0, 60) });
    }
    for (let i = 0; i < blanks; i++) last.push('');
  }

  return changes.length ? serializeEntry(t) : translationText;
}
