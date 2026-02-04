import * as fs from 'node:fs';
import * as path from 'node:path';

import type { DiaryEntry, Paragraph, Note, GlossaryLink } from '../models/index.js';
import { createParagraph, createDiaryEntry } from '../models/index.js';
import { NOTE_ROLES } from '../constants/roles.js';
import { ParagraphParser } from '../parser/paragraph-parser.js';
import { ParagraphRenderer } from '../renderer/paragraph-renderer.js';

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
  /** Roles to sync from original (default: RSR, LAN) */
  syncRoles: string[];
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
        'footnote_added' | 'footnote_updated' | 'footnote_ref_added' | 'metadata_updated' | 'paragraph_added';
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

      // Check notes
      if (options.syncRoles.length > 0) {
        const noteChanges = this.detectNoteChanges(origPara, transPara, options.syncRoles);
        changes.push(...noteChanges);
      }

      // Check glossary links
      if (options.syncGlossaryLinks) {
        const glossaryChanges = this.detectGlossaryChanges(origPara, transPara);
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
    transPara: Paragraph
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
          newValue: link.filePath,
        });
      }
    }

    // Check for updated paths (same display text, different path)
    for (const origLink of origPara.glossaryLinks) {
      const transLink = transPara.glossaryLinks.find(l => l.displayText === origLink.displayText);
      if (transLink && transLink.filePath !== origLink.filePath) {
        changes.push({
          type: 'glossary_updated',
          paragraphId: origPara.id,
          description: `Updated glossary path for [#${origLink.displayText}] in paragraph ${origPara.id}`,
          originalValue: transLink.filePath,
          newValue: origLink.filePath,
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

    // Build map of which paragraphs have which footnote refs in original
    const origFootnoteParaMap = new Map<string, string>(); // fnId -> paraId
    for (const origPara of original.paragraphs) {
      for (const fnRef of origPara.footnoteRefs) {
        origFootnoteParaMap.set(fnRef, origPara.id);
      }
    }

    // Build set of existing footnote refs in translation
    const existingTransFnRefs = new Set<string>();
    for (const transPara of translation.paragraphs) {
      for (const fnRef of transPara.footnoteRefs) {
        existingTransFnRefs.add(fnRef);
      }
    }

    for (const [fnId, fnText] of Object.entries(original.footnotes)) {
      if (!(fnId in translation.footnotes)) {
        changes.push({
          type: 'footnote_added',
          description: `New footnote [^${fnId}]`,
          newValue: fnText.substring(0, 60) + (fnText.length > 60 ? '...' : ''),
        });
      } else if (translation.footnotes[fnId] !== fnText) {
        changes.push({
          type: 'footnote_updated',
          description: `Updated footnote [^${fnId}]`,
          originalValue: translation.footnotes[fnId].substring(0, 40),
          newValue: fnText.substring(0, 40),
        });
      }

      // Check if footnote reference is missing in translation
      if (!existingTransFnRefs.has(fnId)) {
        const origParaId = origFootnoteParaMap.get(fnId);
        if (origParaId) {
          changes.push({
            type: 'footnote_ref_added',
            paragraphId: origParaId,
            description: `Add footnote ref [^${fnId}] to paragraph ${origParaId}`,
          });
        }
      }
    }

    return changes;
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
          newValue: link.filePath,
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
        this.syncNotes(origPara, syncedPara, options.syncRoles);
      }

      // Sync glossary links
      if (options.syncGlossaryLinks) {
        this.syncGlossaryLinks(origPara, syncedPara);
      }

      // Sync languages from original
      syncedPara.languages = [...origPara.languages];
    }

    // Sort paragraphs by ID
    synced.paragraphs.sort((a, b) => {
      if (a.isHeader && a.id.startsWith('header_')) return -1;
      if (b.isHeader && b.id.startsWith('header_')) return 1;
      return a.paraNum - b.paraNum;
    });

    // Sync footnotes (definitions and references)
    if (options.syncFootnotes) {
      // Build map of which paragraphs have which footnote refs in original
      const origFootnoteParaMap = new Map<string, string>(); // fnId -> paraId
      for (const origPara of original.paragraphs) {
        for (const fnRef of origPara.footnoteRefs) {
          origFootnoteParaMap.set(fnRef, origPara.id);
        }
      }

      // Build set of existing footnote refs in translation
      const existingTransFnRefs = new Set<string>();
      for (const transPara of synced.paragraphs) {
        for (const fnRef of transPara.footnoteRefs) {
          existingTransFnRefs.add(fnRef);
        }
      }

      for (const [fnId, fnText] of Object.entries(original.footnotes)) {
        // Add footnote definition if not present (don't overwrite translated)
        if (!(fnId in synced.footnotes)) {
          synced.footnotes[fnId] = fnText;
        }

        // Add footnote reference to paragraph if not already present
        if (!existingTransFnRefs.has(fnId)) {
          const origParaId = origFootnoteParaMap.get(fnId);
          if (origParaId) {
            const syncedPara = syncedParagraphs.get(origParaId);
            if (syncedPara && syncedPara.translatedText) {
              // Add footnote ref at end of translated text
              syncedPara.translatedText = syncedPara.translatedText.trimEnd() + `[^${fnId}]`;
              syncedPara.footnoteRefs.push(fnId);
            }
          }
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
        const existing = existingLinkMap.get(link.displayText);
        if (!existing) {
          synced.entryGlossaryLinks.push({ ...link });
        } else if (existing.filePath !== link.filePath) {
          // Update path to match original
          existing.filePath = link.filePath;
        }
      }
    }

    return synced;
  }

  /**
   * Sync notes from original to translation paragraph
   */
  private syncNotes(origPara: Paragraph, syncedPara: Paragraph, syncRoles: string[]): void {
    const existingNoteKeys = new Set(syncedPara.notes.map(n => this.noteKey(n)));

    for (const note of origPara.notes) {
      if (syncRoles.includes(note.role)) {
        const key = this.noteKey(note);
        if (!existingNoteKeys.has(key)) {
          syncedPara.notes.push({ ...note });
          existingNoteKeys.add(key);
        }
      }
    }

    // Sort notes by timestamp
    syncedPara.notes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Sync glossary links from original to translation paragraph
   */
  private syncGlossaryLinks(origPara: Paragraph, syncedPara: Paragraph): void {
    const existingLinks = new Map(
      syncedPara.glossaryLinks.map(l => [l.displayText, l])
    );

    for (const link of origPara.glossaryLinks) {
      const existing = existingLinks.get(link.displayText);
      if (!existing) {
        // Add new link
        syncedPara.glossaryLinks.push({ ...link });
      } else if (existing.filePath !== link.filePath) {
        // Update path
        existing.filePath = link.filePath;
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

      // Detect changes
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

      // Render back to markdown using the renderer's translation format
      const content = this.renderer.renderTranslationEntry(synced);

      // Write if not dry run
      if (!options.dryRun) {
        // Ensure directory exists
        const dir = path.dirname(translationPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(translationPath, content, 'utf-8');
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

    // Find all markdown files in original
    const files = fs.readdirSync(originalDir)
      .filter(f => f.endsWith('.md'))
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
        if (entryResult.written) {
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
      return clonedPara;
    });

    return cloned;
  }

  /**
   * Create a unique key for a note (for deduplication)
   */
  private noteKey(note: Note): string {
    return `${note.timestamp.toISOString()}|${note.role}|${note.content}`;
  }
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
