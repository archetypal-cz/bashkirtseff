import type { Paragraph, GlossaryLink } from '../models/index.js';
import type { CarnetSummaryDocument, SummaryKeyPerson } from '../models/summary.js';
import type { Note } from '../models/note.js';
import YAML from 'yaml';

/**
 * Format a timestamp for output (without milliseconds)
 */
function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

/**
 * Renderer for carnet summary documents with paragraph clusters
 */
export class SummaryRenderer {
  /**
   * Render a summary document to markdown (original format)
   * Used for writing back to _original/{carnet}/_summary.md
   */
  renderOriginalSummary(summary: CarnetSummaryDocument): string {
    const lines: string[] = [];

    // Frontmatter
    lines.push(this.renderFrontmatter(summary));

    // Render paragraphs
    for (const para of summary.paragraphs) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }

      lines.push(this.renderOriginalParagraph(para));
    }

    return lines.join('\n');
  }

  /**
   * Render a summary document for translation
   * Format: ID first, then original in comment, then glossary links, notes, translation
   */
  renderTranslationSummary(summary: CarnetSummaryDocument): string {
    const lines: string[] = [];

    // Frontmatter
    lines.push(this.renderFrontmatter(summary));

    // Render paragraphs in translation format
    for (const para of summary.paragraphs) {
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
  private renderFrontmatter(summary: CarnetSummaryDocument): string {
    const frontmatter: Record<string, unknown> = {
      carnet: summary.carnet,
      title: summary.title,
    };

    // Date range
    if (summary.dateRange.start || summary.dateRange.end) {
      frontmatter.date_range = {
        start: summary.dateRange.start,
        end: summary.dateRange.end,
      };
    }

    // Location info
    if (summary.primaryLocation) {
      frontmatter.primary_location = summary.primaryLocation;
    }
    if (summary.locationJourney.length > 0) {
      frontmatter.location_journey = summary.locationJourney;
    }

    // Key people
    if (summary.keyPeople.length > 0) {
      frontmatter.key_people = summary.keyPeople.map((kp: SummaryKeyPerson) => {
        const obj: Record<string, string> = {
          id: kp.id,
          role: kp.role,
        };
        if (kp.notes) {
          obj.notes = kp.notes;
        }
        return obj;
      });
    }

    // Themes
    if (summary.majorThemes.length > 0) {
      frontmatter.major_themes = summary.majorThemes;
    }

    // Marie's age
    if (summary.marieAge > 0) {
      frontmatter.marie_age = summary.marieAge;
    }

    // Generated flag
    if (summary.generatedFromEntries) {
      frontmatter.generated_from_entries = summary.generatedFromEntries;
    }

    // Include any additional metadata
    for (const [key, value] of Object.entries(summary.metadata)) {
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

    // Glossary links
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
   * Render summary to JSON-serializable format
   */
  exportToJson(summary: CarnetSummaryDocument): Record<string, unknown> {
    return {
      carnet: summary.carnet,
      title: summary.title,
      dateRange: summary.dateRange,
      primaryLocation: summary.primaryLocation,
      locationJourney: summary.locationJourney,
      keyPeople: summary.keyPeople,
      majorThemes: summary.majorThemes,
      marieAge: summary.marieAge,
      generatedFromEntries: summary.generatedFromEntries,
      language: summary.language,
      filePath: summary.filePath,
      paragraphs: summary.paragraphs.map((para) => ({
        id: para.id,
        carnetNum: para.carnetNum,
        paraNum: para.paraNum,
        originalText: para.originalText,
        translatedText: para.translatedText,
        notes: para.notes.map((note: Note) => ({
          timestamp: note.timestamp.toISOString(),
          role: note.role,
          content: note.content,
        })),
        glossaryLinks: para.glossaryLinks.map((link: GlossaryLink) => ({
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
 * Convenience function to render a summary to original format
 */
export function renderSummaryOriginal(summary: CarnetSummaryDocument): string {
  const renderer = new SummaryRenderer();
  return renderer.renderOriginalSummary(summary);
}

/**
 * Convenience function to render a summary to translation format
 */
export function renderSummaryTranslation(summary: CarnetSummaryDocument): string {
  const renderer = new SummaryRenderer();
  return renderer.renderTranslationSummary(summary);
}
