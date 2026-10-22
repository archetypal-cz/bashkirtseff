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
  embeddedFrenchAllIdx,
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
  /**
   * Source notes taken to be a tree note under another label because the two
   * share names/dates/quoted terms; listed under --verbose only
   */
  footnotesAssumed: string[];
  /**
   * Like footnotesAssumed, but the only shared words are words of the paragraph
   * itself: the pairing most likely to hide a new note; listed under --verbose
   */
  footnotesWeak: string[];
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
  /** See EntrySyncResult.footnotesAssumed */
  assumed: string[];
  /** See EntrySyncResult.footnotesWeak */
  weak: string[];
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
/**
 * Capitalised words too common in source footnotes to tie a translated note
 * to its source (see EntrySync.footnoteAnchors)
 */
const FOOTNOTE_ANCHOR_STOPWORDS = new Set([
  'marie', 'maman', 'paris', 'nice', 'french', 'english', 'russian', 'italian',
  'german', 'latin', 'polish', 'spanish', 'francais', 'francaise', 'russe', 'anglais',
  'italien', 'italienne', 'allemand', 'original', 'manuscript', 'translation',
  'literally', 'here', 'this', 'that', 'there', 'they', 'their', 'with', 'from',
  'when', 'also', 'still', 'after', 'before', 'mlle', 'mme', 'madame',
  'monsieur', 'mademoiselle', 'saint', 'sainte',
]);

const CYRILLIC_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ъ: '', ы: 'y', э: 'e', ю: 'iu', я: 'ia',
};

/** Rough cross-script spelling skeleton for matching footnote anchors */
function footnoteSkeleton(text: string): string {
  return text
    .toLowerCase()
    .replace(/[а-яёєіїґ]/g, (ch) => CYRILLIC_LATIN[ch] ?? ch)
    .normalize('NFD')
    .replace(/[\u0300-\u036f'’ʼ]/g, '')
    .replace(/ph/g, 'f')
    .replace(/[cq]/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/w/g, 'v')
    .replace(/[yj]/g, 'i')
    .replace(/g/g, 'h')
    .replace(/(\p{L})\1+/gu, '$1');
}

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
   * The words of a source footnote a translated copy is likely to keep as they
   * are: years and other numbers, capitalised names, italicised or quoted terms
   * (`*muso*`, «Dormi pure»). Folded to lower case without diacritics.
   */
  static footnoteAnchors(text: string): string[] {
    const fold = (w: string) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const words = new Set<string>();
    const add = (w: string) => {
      const f = fold(w).replace(/^['’-]+|['’-]+$/g, '').replace(/['’]s$/, '');
      if (f.length >= 4 && !FOOTNOTE_ANCHOR_STOPWORDS.has(f)) words.add(f);
    };
    for (const m of text.matchAll(/\d{3,4}/g)) words.add(m[0]);
    for (const m of text.matchAll(/\p{Lu}[\p{L}'’-]{3,}/gu)) add(m[0]);
    for (const m of text.matchAll(/\*([^*]+)\*|«([^»]+)»|"([^"]+)"|“([^”]+)”/g)) {
      for (const w of (m[1] ?? m[2] ?? m[3] ?? m[4]).split(/[^\p{L}\d'’-]+/u)) add(w);
    }
    return [...words];
  }

  /**
   * Anchors of a source note found in a tree note's definition. Both sides are
   * reduced to a rough spelling skeleton (Cyrillic romanised; c/k, g/h, y/i…
   * merged; doubled letters collapsed) and an anchor counts when its first five
   * letters occur, so «Binder» finds «Біндер» and «Vanvitelli» «Vanvitellim».
   */
  private static sharedAnchors(sourceText: string, treeText: string | undefined): string[] {
    if (!treeText) return [];
    const tree = footnoteSkeleton(treeText);
    return EntrySync.footnoteAnchors(sourceText).filter(w => tree.includes(footnoteSkeleton(w).slice(0, 5)));
  }

  /**
   * Decide which source footnotes are genuinely absent from the translation.
   *
   * Translation trees renumber footnotes (source `[^3]` may be `[^01.10.1]` or
   * `[^2]` in the target), and their labels are their own numbering — often an
   * older paragraph number, sometimes the same `.1` a new source note uses for
   * something else (cz 091.0253) — so labels other than the exact source id
   * prove nothing. A source marker is MATCHED, claiming that target marker of
   * the paragraph one to one, when the target has
   *   - the same id in the paragraph, or anywhere unless it is a bare number, or
   *   - a definition with the same text as the source definition, or
   *   - an unclaimed marker in the paragraph whose definition shares a name,
   *     date or quoted term with the source definition (footnoteAnchors) — the
   *     usual translated copy; listed in `assumed` for a --verbose check, or in
   *     `weak` when every shared word is a word of the paragraph itself (two
   *     different notes on one phrase share exactly that).
   * An unmatched source marker is ADDED (definition + marker at paragraph end)
   * only when the target paragraph is translated and has no unclaimed marker
   * left, none of them claimed by shared words alone, and its label is free in
   * the tree (both other cases are warnings).
   * If unclaimed markers remain they share nothing with the source note:
   * translator-only notes or an unrecognisable translation of it — skipped with
   * a warning naming them (equal marker counts used to pass silently and hid new
   * source notes beside translator-only ones, D-65). Untranslated paragraphs and
   * source notes no source paragraph references are skipped with a warning too.
   * A definition is never overwritten and never added without a marker.
   */
  private planFootnoteSync(original: DiaryEntry, translation: DiaryEntry): FootnotePlan {
    const plan: FootnotePlan = { addDefinitions: [], addRefs: new Map(), warnings: [], assumed: [], weak: [] };

    const transParas = new Map(translation.paragraphs.map(p => [p.id, p]));
    const transRefIds = new Set<string>();
    for (const p of translation.paragraphs) {
      for (const id of p.footnoteRefs) transRefIds.add(id);
    }
    const transDefKeys = new Set(
      Object.values(translation.footnotes).map(t => EntrySync.footnoteKey(t))
    );
    const snippet = (text: string | undefined) => {
      const t = (text ?? '').replace(/\s+/g, ' ').trim();
      return t.length > 50 ? `${t.slice(0, 50)}…` : t;
    };

    const referencedInSource = new Set<string>();
    const decided = new Set<string>();
    const addDef = (fnId: string) => {
      if (fnId in original.footnotes && !(fnId in translation.footnotes) && !plan.addDefinitions.includes(fnId)) {
        plan.addDefinitions.push(fnId);
      }
    };

    for (const origPara of original.paragraphs) {
      const transPara = transParas.get(origPara.id);
      const transMarkers = transPara?.footnoteRefs ?? [];
      const claimed = new Set<string>();

      // Pass 1: exact id or identical text
      const unmatched: string[] = [];
      for (const fnId of origPara.footnoteRefs) {
        referencedInSource.add(fnId);
        if (decided.has(fnId)) continue;
        decided.add(fnId);
        const fnText = original.footnotes[fnId];

        if (transMarkers.includes(fnId) || (transRefIds.has(fnId) && !/^\d+$/.test(fnId))) {
          // Same id already anchored; only a missing definition needs repair. A bare
          // number elsewhere in the entry is the tree's own numbering, not this note.
          if (transMarkers.includes(fnId)) claimed.add(fnId);
          addDef(fnId);
        } else if (fnText !== undefined && transDefKeys.has(EntrySync.footnoteKey(fnText))) {
          const textKey = EntrySync.footnoteKey(fnText);
          const hit = transMarkers.find(id =>
            !claimed.has(id) && id in translation.footnotes && EntrySync.footnoteKey(translation.footnotes[id]) === textKey);
          if (hit) claimed.add(hit);
        } else {
          unmatched.push(fnId);
        }
      }

      // Pass 2: a translated copy shares names, dates or quoted terms (best pair first)
      const pairs: { fnId: string; id: string; shared: string[] }[] = [];
      for (const fnId of unmatched) {
        const fnText = original.footnotes[fnId];
        if (fnText === undefined) continue;
        for (const id of transMarkers) {
          if (claimed.has(id)) continue;
          const shared = EntrySync.sharedAnchors(fnText, translation.footnotes[id]);
          if (shared.length) pairs.push({ fnId, id, shared });
        }
      }
      pairs.sort((a, b) => b.shared.length - a.shared.length);
      const paired = new Set<string>();
      const paraText = pairs.length
        ? footnoteSkeleton(`${origPara.originalText ?? ''} ${transPara?.translatedText ?? ''}`)
        : '';
      for (const { fnId, id, shared } of pairs) {
        if (paired.has(fnId) || claimed.has(id)) continue;
        paired.add(fnId);
        claimed.add(id);
        if (shared.every(w => paraText.includes(footnoteSkeleton(w).slice(0, 5)))) {
          // Only the annotated word itself is shared. Usually still a gloss and its
          // translation, but two different notes on one phrase look exactly like
          // this (a D-63 context note beside the tree's gloss of the same epithet)
          plan.weak.push(
            `[^${fnId}] (paragraph ${origPara.id}) taken as the tree's [^${id}] only because both name ` +
            `${shared.slice(0, 3).join(', ')} from the paragraph itself — source "${snippet(original.footnotes[fnId])}" vs tree ` +
            `"${snippet(translation.footnotes[id])}": same note?`
          );
        } else {
          plan.assumed.push(`[^${fnId}] (paragraph ${origPara.id}) taken as the tree's [^${id}] (shared: ${shared.slice(0, 4).join(', ')})`);
        }
      }

      // Pass 3: an unmatched note is added only where nothing else could be it
      const unclaimed = transMarkers.filter(id => !claimed.has(id));
      for (const fnId of unmatched) {
        if (paired.has(fnId)) continue;
        const fnText = original.footnotes[fnId];
        if (fnText === undefined) {
          plan.warnings.push(`[^${fnId}] referenced in source paragraph ${origPara.id} but never defined in the source; not propagated`);
          continue;
        }
        if (!transPara || !transPara.translatedText || transPara.translatedText.trim() === 'TODO') {
          plan.warnings.push(`[^${fnId}] (paragraph ${origPara.id}) skipped: paragraph is not translated yet, nowhere to anchor the marker`);
          continue;
        }
        if (unclaimed.length > 0) {
          plan.warnings.push(
            `[^${fnId}] (paragraph ${origPara.id}) skipped: source note "${snippet(fnText)}" has no matching tree note; ` +
            `the tree paragraph has unmatched note(s) ` +
            unclaimed.map(r => `[^${r}] "${snippet(translation.footnotes[r])}"`).join(', ') +
            ` — translator-only, or a translation of this note? check by hand`
          );
          continue;
        }
        if (paired.size > 0) {
          // The other markers were only matched by shared words: probably right, not proof
          plan.warnings.push(
            `[^${fnId}] (paragraph ${origPara.id}) skipped: source note "${snippet(fnText)}" looks missing ` +
            `(the tree paragraph's other note(s) were taken as translations of other source notes by shared words) — add by hand if so`
          );
          continue;
        }
        if (fnId in translation.footnotes || transRefIds.has(fnId)) {
          plan.warnings.push(
            `[^${fnId}] (paragraph ${origPara.id}) looks missing, but the tree uses that label for another note ` +
            `"${snippet(translation.footnotes[fnId])}" — add it by hand under a new label`
          );
          continue;
        }
        // Translated paragraph whose markers all match exactly: safe to append
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
      footnotesAssumed: [],
      footnotesWeak: [],
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
        result.footnotesAssumed = plan?.assumed ?? [];
        result.footnotesWeak = plan?.weak ?? [];
        if (options.verbose) {
          for (const a of result.footnotesWeak) {
            console.warn(`[sync] WEAK ${path.basename(translationPath)}: ${a}`);
          }
          for (const a of result.footnotesAssumed) {
            console.warn(`[sync] CHECK ${path.basename(translationPath)}: ${a}`);
          }
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
      const idx = embeddedFrenchAllIdx(lines);
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

    // Footnote markers (the plan only adds them where every existing marker is matched)
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
