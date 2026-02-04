import type { Paragraph, GlossaryLink } from '../models/index.js';
import type { GlossaryEntryParsed } from '../models/glossary-entry.js';
import type { Note } from '../models/note.js';
import YAML from 'yaml';

/**
 * Format a timestamp for output (without milliseconds)
 */
function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

/**
 * Renderer for glossary entries with paragraph clusters
 */
export class GlossaryRenderer {
  /**
   * Render a glossary entry to markdown (original format)
   * Used for writing back to _original/_glossary/
   */
  renderOriginalEntry(entry: GlossaryEntryParsed): string {
    const lines: string[] = [];

    // Frontmatter
    lines.push(this.renderFrontmatter(entry));

    // Render paragraphs
    for (const para of entry.paragraphs) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }

      lines.push(this.renderOriginalParagraph(para));
    }

    return lines.join('\n');
  }

  /**
   * Render a glossary entry for translation
   * Format: ID first, then original in comment, then glossary links, notes, translation
   */
  renderTranslationEntry(entry: GlossaryEntryParsed): string {
    const lines: string[] = [];

    // Frontmatter (same structure but may have different values)
    lines.push(this.renderFrontmatter(entry));

    // Render paragraphs in translation format
    for (const para of entry.paragraphs) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }

      lines.push(this.renderTranslationParagraph(para));
    }

    return lines.join('\n');
  }

  /**
   * Render frontmatter as YAML
   */
  private renderFrontmatter(entry: GlossaryEntryParsed): string {
    const frontmatter: Record<string, unknown> = {
      id: entry.id,
      name: entry.name,
      type: entry.type,
      category: entry.category,
      research_status: entry.researchStatus,
      last_updated: entry.lastUpdated,
      // Language and pronunciation metadata (only if present)
      ...(entry.languages && { languages: entry.languages }),
      ...(entry.originalScript && { original_script: entry.originalScript }),
      ...(entry.transliteration && { transliteration: entry.transliteration }),
      ...(entry.pronunciation && { pronunciation: entry.pronunciation }),
    };

    // Include any additional metadata
    for (const [key, value] of Object.entries(entry.metadata)) {
      if (!(key in frontmatter) && value !== undefined) {
        frontmatter[key] = value;
      }
    }

    const yamlStr = YAML.stringify(frontmatter);
    return `---\n${yamlStr}---\n`;
  }

  /**
   * Render a single paragraph in original format
   * Order: paragraph ID, glossary links, notes, content
   */
  private renderOriginalParagraph(para: Paragraph): string {
    const lines: string[] = [];

    // Handle headers
    if (para.isHeader) {
      const headerPrefix = '#'.repeat(para.headerLevel);
      const headerText = para.originalText ?? '';
      // Extract just the header text without the # prefix if it's already there
      const cleanText = headerText.replace(/^#+\s*/, '');
      return `%% ${para.id} %%\n${headerPrefix} ${cleanText}`;
    }

    // Paragraph ID
    lines.push(`%% ${para.id} %%`);

    // Glossary links (cross-references to other glossary entries)
    if (para.glossaryLinks.length > 0) {
      const glossaryLine = this.renderGlossaryLinks(para.glossaryLinks);
      if (glossaryLine) {
        lines.push(`%% ${glossaryLine} %%`);
      }
    }

    // Notes (sorted by timestamp)
    const sortedNotes = [...para.notes].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    for (const note of sortedNotes) {
      lines.push(`%% ${formatTimestamp(note.timestamp)} ${note.role}: ${note.content} %%`);
    }

    // Original text (the actual content)
    if (para.originalText) {
      lines.push(para.originalText);
    }

    return lines.join('\n');
  }

  /**
   * Render a single paragraph in translation format
   * Order: paragraph ID, original in comment, glossary links, notes, translation
   */
  private renderTranslationParagraph(para: Paragraph): string {
    const lines: string[] = [];

    // Handle headers
    if (para.isHeader) {
      const headerPrefix = '#'.repeat(para.headerLevel);
      const headerText = para.translatedText ?? para.originalText ?? '';
      const cleanText = headerText.replace(/^#+\s*/, '');
      return `%% ${para.id} %%\n${headerPrefix} ${cleanText}`;
    }

    // 1. Paragraph ID (must come first)
    lines.push(`%% ${para.id} %%`);

    // 2. Original text in comment
    if (para.originalText) {
      // Handle multi-line original text
      if (para.originalText.includes('\n')) {
        lines.push(`%%`);
        lines.push(para.originalText);
        lines.push(`%%`);
      } else {
        lines.push(`%% ${para.originalText} %%`);
      }
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
      lines.push(`%% ${formatTimestamp(note.timestamp)} ${note.role}: ${note.content} %%`);
    }

    // 5. Translation versions
    for (const [version, text] of para.translationVersions) {
      lines.push(`%% ${version} ${text} %%`);
    }

    // 6. Translated text
    if (para.translatedText) {
      lines.push(para.translatedText);
    }

    return lines.join('\n');
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
   * Render entry to JSON-serializable format
   */
  exportToJson(entry: GlossaryEntryParsed): Record<string, unknown> {
    return {
      id: entry.id,
      name: entry.name,
      type: entry.type,
      category: entry.category,
      researchStatus: entry.researchStatus,
      lastUpdated: entry.lastUpdated,
      language: entry.language,
      filePath: entry.filePath,
      paragraphs: entry.paragraphs.map((para) => ({
        id: para.id,
        carnetNum: para.carnetNum,
        paraNum: para.paraNum,
        originalText: para.originalText,
        translatedText: para.translatedText,
        notes: para.notes.map((note) => ({
          timestamp: note.timestamp.toISOString(),
          role: note.role,
          content: note.content,
        })),
        glossaryLinks: para.glossaryLinks.map((link) => ({
          displayText: link.displayText,
          filePath: link.filePath,
        })),
        isHeader: para.isHeader,
        headerLevel: para.headerLevel,
      })),
    };
  }
}

/**
 * Convenience function to render a glossary entry to original format
 */
export function renderGlossaryOriginal(entry: GlossaryEntryParsed): string {
  const renderer = new GlossaryRenderer();
  return renderer.renderOriginalEntry(entry);
}

/**
 * Convenience function to render a glossary entry to translation format
 */
export function renderGlossaryTranslation(entry: GlossaryEntryParsed): string {
  const renderer = new GlossaryRenderer();
  return renderer.renderTranslationEntry(entry);
}
