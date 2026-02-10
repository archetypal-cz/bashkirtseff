import type { DiaryEntry, Paragraph, Note, GlossaryLink } from '../models/index.js';
import { NOTE_ROLES, type NoteRole } from '../constants/roles.js';
import { translationVersionsToObject } from '../models/paragraph.js';

/**
 * Options for rendering diary entries
 */
export interface RenderOptions {
  /** Include original French text */
  includeOriginal: boolean;
  /** Include translated text */
  includeTranslation: boolean;
  /** Include paragraph IDs */
  includeParagraphIds: boolean;
  /** Which note types to include */
  includeNotes: Record<string, boolean>;
  /** Include glossary links */
  includeGlossaryLinks: boolean;
  /** Include footnotes */
  includeFootnotes: boolean;

  /** Element ordering */
  elementOrder: string[];

  /** Comment style: 'obsidian' (%% %%) or 'old' (<!-- -->) */
  commentStyle: 'obsidian' | 'old';
  /** Note format: 'timestamp' or 'simple' */
  noteFormat: 'timestamp' | 'simple';

  /** Specific translation version to show */
  translationVersion?: string;
  /** Show all translation versions */
  showAllVersions: boolean;

  /** Include YAML frontmatter */
  includeFrontmatter: boolean;
  /** Include empty paragraphs */
  includeEmptyParagraphs: boolean;
}

/**
 * Default render options
 */
export function createDefaultRenderOptions(): RenderOptions {
  return {
    includeOriginal: true,
    includeTranslation: true,
    includeParagraphIds: true,
    includeNotes: {
      [NOTE_ROLES.RSR]: true,
      [NOTE_ROLES.LAN]: true,
      [NOTE_ROLES.TR]: true,
      [NOTE_ROLES.RED]: true,
      [NOTE_ROLES.CON]: true,
      [NOTE_ROLES.PA]: true,
      [NOTE_ROLES.GEM]: true,
    },
    includeGlossaryLinks: true,
    includeFootnotes: true,
    elementOrder: ['glossary_links', 'paragraph_id', 'original_text', 'translated_text', 'notes'],
    commentStyle: 'obsidian',
    noteFormat: 'timestamp',
    showAllVersions: false,
    includeFrontmatter: true,
    includeEmptyParagraphs: true,
  };
}

/**
 * Renderer for paragraph-clustered markdown files
 */
/**
 * Format a timestamp for output (without milliseconds)
 * Converts 2025-12-07T16:00:00.000Z to 2025-12-07T16:00:00
 */
function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

export class ParagraphRenderer {
  /**
   * Render a complete diary entry
   */
  renderEntry(entry: DiaryEntry, options: RenderOptions): string {
    const lines: string[] = [];

    // Render entry-level glossary links
    if (options.includeGlossaryLinks && entry.entryGlossaryLinks.length > 0) {
      const glossaryLine = this.renderGlossaryLinks(entry.entryGlossaryLinks);
      if (glossaryLine) {
        lines.push(this.formatComment(glossaryLine, options.commentStyle));
        lines.push('');
      }
    }

    // Render paragraphs
    for (let i = 0; i < entry.paragraphs.length; i++) {
      const para = entry.paragraphs[i];
      const renderedPara = this.renderParagraph(para, options);

      if (renderedPara || options.includeEmptyParagraphs) {
        if (lines.length > 0 && lines[lines.length - 1] !== '') {
          lines.push('');
        }
        lines.push(renderedPara);
      }
    }

    // Render footnotes
    if (options.includeFootnotes && Object.keys(entry.footnotes).length > 0) {
      lines.push('');
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
   * Render a single paragraph cluster
   */
  renderParagraph(para: Paragraph, options: RenderOptions): string {
    const lines: string[] = [];

    // Handle headers specially
    if (para.isHeader) {
      const headerPrefix = '#'.repeat(para.headerLevel);
      return `${headerPrefix} ${para.originalText ?? para.translatedText ?? ''}`;
    }

    // Render elements in specified order
    for (const element of options.elementOrder) {
      switch (element) {
        case 'paragraph_id':
          if (options.includeParagraphIds) {
            lines.push(this.formatComment(para.id, options.commentStyle));
          }
          break;

        case 'glossary_links':
          if (options.includeGlossaryLinks && para.glossaryLinks.length > 0) {
            const glossaryLine = this.renderGlossaryLinks(para.glossaryLinks);
            if (glossaryLine) {
              lines.push(this.formatComment(glossaryLine, options.commentStyle));
            }
          }
          break;

        case 'original_text':
          if (options.includeOriginal && para.originalText) {
            lines.push(para.originalText);
          }
          break;

        case 'translated_text':
          if (options.includeTranslation) {
            if (options.showAllVersions && para.translationVersions.size > 0) {
              // Show all versions
              for (const [version, text] of para.translationVersions) {
                lines.push(this.formatComment(`${version} ${text}`, options.commentStyle));
              }
            } else if (
              options.translationVersion &&
              para.translationVersions.has(options.translationVersion)
            ) {
              // Show specific version
              lines.push(para.translationVersions.get(options.translationVersion)!);
            } else if (para.translatedText) {
              // Show current translation
              lines.push(para.translatedText);
            }
          }
          break;

        case 'notes':
          if (para.notes.length > 0) {
            for (const note of para.notes) {
              if (options.includeNotes[note.role] !== false) {
                const noteStr = this.renderNote(note, options);
                lines.push(this.formatComment(noteStr, options.commentStyle));
              }
            }
          }
          break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Render side-by-side comparison table
   */
  renderSideBySide(
    originalEntry: DiaryEntry,
    translatedEntry: DiaryEntry
  ): string {
    const lines: string[] = [];

    lines.push('| Original | Translation |');
    lines.push('|----------|-------------|');

    // Match paragraphs by ID
    const transMap = new Map<string, Paragraph>();
    for (const para of translatedEntry.paragraphs) {
      transMap.set(para.id, para);
    }

    for (const origPara of originalEntry.paragraphs) {
      let origText = origPara.originalText ?? '';
      let transText = '';

      const transPara = transMap.get(origPara.id);
      if (transPara) {
        transText = transPara.translatedText ?? '';
      }

      // Escape pipe characters and format for table
      origText = origText.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
      transText = transText.replace(/\|/g, '\\|').replace(/\n/g, '<br>');

      lines.push(`| ${origText} | ${transText} |`);
    }

    return lines.join('\n');
  }

  /**
   * Render minimal version (just the text, no metadata)
   */
  renderMinimal(entry: DiaryEntry): string {
    const options: RenderOptions = {
      ...createDefaultRenderOptions(),
      includeOriginal: false,
      includeTranslation: true,
      includeParagraphIds: false,
      includeNotes: {},
      includeGlossaryLinks: false,
      includeFootnotes: true,
      elementOrder: ['translated_text'],
    };
    return this.renderEntry(entry, options);
  }

  /**
   * Render in study mode (everything visible)
   */
  renderStudyMode(entry: DiaryEntry): string {
    const options: RenderOptions = {
      ...createDefaultRenderOptions(),
      elementOrder: ['paragraph_id', 'original_text', 'translated_text', 'notes', 'glossary_links'],
    };
    return this.renderEntry(entry, options);
  }

  /**
   * Render for editors (translation + editorial notes only)
   */
  renderEditorMode(entry: DiaryEntry): string {
    const options: RenderOptions = {
      ...createDefaultRenderOptions(),
      includeOriginal: false,
      includeNotes: {
        [NOTE_ROLES.RSR]: true,
        [NOTE_ROLES.GEM]: true,
        [NOTE_ROLES.RED]: true,
        [NOTE_ROLES.CON]: true,
        [NOTE_ROLES.LAN]: false,
        [NOTE_ROLES.TR]: false,
        [NOTE_ROLES.PA]: false,
      },
      elementOrder: ['translated_text', 'notes', 'paragraph_id'],
    };
    return this.renderEntry(entry, options);
  }

  /**
   * Render an original (French) entry file
   * Format: glossary links, ID, notes, original text
   */
  renderOriginalEntry(entry: DiaryEntry): string {
    const lines: string[] = [];

    // Entry-level glossary links
    if (entry.entryGlossaryLinks.length > 0) {
      const glossaryLine = this.renderGlossaryLinks(entry.entryGlossaryLinks);
      if (glossaryLine) {
        lines.push(`%% ${glossaryLine} %%`);
        lines.push('');
      }
    }

    // Render each paragraph
    for (const para of entry.paragraphs) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }

      // Paragraph ID (must come first for parser to associate content correctly)
      // Output for all paragraphs including headers (unless synthetic ID)
      if (!para.id.startsWith('header_')) {
        lines.push(`%% ${para.id} %%`);
      }

      if (para.isHeader) {
        const headerPrefix = '#'.repeat(para.headerLevel);
        lines.push(`${headerPrefix} ${para.originalText ?? ''}`);
        continue;
      }

      // Glossary links
      if (para.glossaryLinks.length > 0) {
        const glossaryLine = this.renderGlossaryLinks(para.glossaryLinks);
        if (glossaryLine) {
          lines.push(`%% ${glossaryLine} %%`);
        }
      }

      // Notes (preserve file order for round-trip fidelity)
      for (const note of para.notes) {
        lines.push(`%% ${formatTimestamp(note.timestamp)} ${note.role}: ${note.content.trimEnd()} %%`);
      }

      // Original text
      if (para.originalText) {
        lines.push(para.originalText);
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
   * Render a translation entry file
   * Format: ID first, then French in comment, glossary links, notes, translation versions, translated text
   *
   * IMPORTANT: Paragraph ID must come FIRST so the parser correctly associates
   * all following content (French original, notes, etc.) with this paragraph.
   */
  renderTranslationEntry(entry: DiaryEntry): string {
    const lines: string[] = [];

    // Entry-level glossary links
    if (entry.entryGlossaryLinks.length > 0) {
      const glossaryLine = this.renderGlossaryLinks(entry.entryGlossaryLinks);
      if (glossaryLine) {
        lines.push(`%% ${glossaryLine} %%`);
        lines.push('');
      }
    }

    // Render each paragraph
    for (const para of entry.paragraphs) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }

      // 1. Paragraph ID (MUST come first for parser to associate content correctly)
      if (!para.id.startsWith('header_')) {
        lines.push(`%% ${para.id} %%`);
      }

      if (para.isHeader) {
        const headerPrefix = '#'.repeat(para.headerLevel);
        // For headers in translation, use translatedText if available, fall back to originalText
        const headerText = para.translatedText ?? para.originalText ?? '';
        lines.push(`${headerPrefix} ${headerText}`);
        continue;
      }

      // 2. French original in comment
      if (para.originalText) {
        lines.push(`%% ${para.originalText} %%`);
      }

      // 3. Glossary links
      if (para.glossaryLinks.length > 0) {
        const glossaryLine = this.renderGlossaryLinks(para.glossaryLinks);
        if (glossaryLine) {
          lines.push(`%% ${glossaryLine} %%`);
        }
      }

      // 4. Notes (sorted by timestamp)
      const sortedNotes = [...para.notes].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      for (const note of sortedNotes) {
        lines.push(`%% ${formatTimestamp(note.timestamp)} ${note.role}: ${note.content.trimEnd()} %%`);
      }

      // 5. Translation versions
      for (const [version, text] of para.translationVersions) {
        lines.push(`%% ${version} ${text} %%`);
      }

      // 6. Translated text (main content)
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
   * Format text as a comment
   */
  private formatComment(text: string, style: 'obsidian' | 'old'): string {
    if (style === 'obsidian') {
      return `%% ${text} %%`;
    }
    return `<!-- ${text} -->`;
  }

  /**
   * Render a single note
   */
  private renderNote(note: Note, options: RenderOptions): string {
    if (options.noteFormat === 'timestamp') {
      return `${formatTimestamp(note.timestamp)} ${note.role}: ${note.content.trimEnd()}`;
    }
    return `${note.role}: ${note.content.trimEnd()}`;
  }

  /**
   * Render glossary links as a single line
   */
  private renderGlossaryLinks(links: GlossaryLink[]): string {
    if (links.length === 0) return '';

    // Remove duplicates while preserving order
    const seen = new Set<string>();
    const uniqueLinks = links.filter((link) => {
      if (seen.has(link.displayText)) return false;
      seen.add(link.displayText);
      return true;
    });

    return uniqueLinks.map((link) => `[#${link.displayText}](${link.filePath})`).join(' ');
  }

  /**
   * Export entry to HTML format
   */
  exportToHtml(entry: DiaryEntry, options: RenderOptions): string {
    const lines: string[] = [];
    lines.push('<!DOCTYPE html>');
    lines.push('<html>');
    lines.push('<head>');
    lines.push('  <meta charset="utf-8">');
    lines.push(`  <title>Diary Entry - ${entry.date}</title>`);
    lines.push('  <style>');
    lines.push('    .paragraph { margin: 1em 0; }');
    lines.push('    .para-id { color: #666; font-size: 0.8em; }');
    lines.push('    .original { color: #333; font-style: italic; }');
    lines.push('    .note { color: #666; font-size: 0.9em; }');
    lines.push('    .glossary { color: #0066cc; }');
    lines.push('  </style>');
    lines.push('</head>');
    lines.push('<body>');

    for (const para of entry.paragraphs) {
      lines.push('  <div class="paragraph">');

      if (options.includeParagraphIds) {
        lines.push(`    <span class="para-id">${para.id}</span>`);
      }

      if (para.isHeader) {
        lines.push(
          `    <h${para.headerLevel}>${para.originalText ?? para.translatedText ?? ''}</h${para.headerLevel}>`
        );
      } else {
        if (options.includeOriginal && para.originalText) {
          lines.push(`    <p class="original">${this.escapeHtml(para.originalText)}</p>`);
        }

        if (options.includeTranslation && para.translatedText) {
          lines.push(`    <p class="translation">${this.escapeHtml(para.translatedText)}</p>`);
        }

        for (const note of para.notes) {
          if (options.includeNotes[note.role] !== false) {
            lines.push(
              `    <p class="note">${this.escapeHtml(this.renderNote(note, options))}</p>`
            );
          }
        }
      }

      lines.push('  </div>');
    }

    lines.push('</body>');
    lines.push('</html>');

    return lines.join('\n');
  }

  /**
   * Export entry to JSON-serializable format
   */
  exportToJson(entry: DiaryEntry): Record<string, unknown> {
    return {
      filePath: entry.filePath,
      date: entry.date,
      language: entry.language,
      location: entry.location,
      paragraphs: entry.paragraphs.map((para) => ({
        id: para.id,
        carnetNum: para.carnetNum,
        bookNum: para.bookNum, // backward compatibility
        paraNum: para.paraNum,
        originalText: para.originalText,
        translatedText: para.translatedText,
        translationVersions: translationVersionsToObject(para.translationVersions),
        notes: para.notes.map((note) => ({
          timestamp: note.timestamp.toISOString(),
          role: note.role,
          content: note.content,
        })),
        glossaryLinks: para.glossaryLinks.map((link) => ({
          displayText: link.displayText,
          filePath: link.filePath,
        })),
        languages: para.languages,
        isHeader: para.isHeader,
        headerLevel: para.headerLevel,
      })),
      footnotes: entry.footnotes,
    };
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
