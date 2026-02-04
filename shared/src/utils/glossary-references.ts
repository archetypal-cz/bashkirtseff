import * as fs from 'node:fs';
import * as path from 'node:path';
import { GLOSSARY_PATTERN } from '../parser/patterns.js';

/**
 * Reference to a glossary entry from a diary entry
 */
export interface GlossaryReference {
  /** Diary entry file path (relative to src/) */
  entryPath: string;
  /** Date from filename (YYYY-MM-DD) */
  date: string;
  /** Carnet number */
  carnet: string;
  /** Display text used in the link */
  displayText: string;
  /** Line number(s) where the reference appears */
  lineNumbers: number[];
}

/**
 * Statistics about glossary usage
 */
export interface GlossaryUsageStats {
  /** Total glossary files */
  totalGlossaryEntries: number;
  /** Glossary entries with at least one reference */
  referencedEntries: number;
  /** Glossary entries with no references (orphaned) */
  orphanedEntries: number;
  /** Total references across all diary entries */
  totalReferences: number;
  /** Average references per glossary entry */
  averageReferencesPerEntry: number;
  /** Most referenced entries */
  topReferenced: Array<{ id: string; count: number }>;
}

/**
 * Manages reverse lookups from glossary entries to diary entries
 */
export class GlossaryReferences {
  private basePath: string;
  private diaryBase: string;
  private glossaryBase: string;
  private reverseIndex: Map<string, GlossaryReference[]> | null = null;

  constructor(basePath: string = '.') {
    this.basePath = basePath;
    this.diaryBase = path.join(basePath, 'src/_original');
    this.glossaryBase = path.join(basePath, 'src/_original/_glossary');
  }

  /**
   * Build the reverse index (glossary ID → diary references)
   * This scans all diary entries and indexes glossary links
   */
  buildReverseIndex(): Map<string, GlossaryReference[]> {
    if (this.reverseIndex) {
      return this.reverseIndex;
    }

    this.reverseIndex = new Map();
    const diaryFiles = this.getAllDiaryFiles();

    for (const filePath of diaryFiles) {
      this.indexDiaryFile(filePath);
    }

    return this.reverseIndex;
  }

  /**
   * Index glossary links in a single diary file
   */
  private indexDiaryFile(filePath: string): void {
    if (!this.reverseIndex) {
      this.reverseIndex = new Map();
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(path.join(this.basePath, 'src'), filePath);
      const filename = path.basename(filePath, '.md');
      const carnet = path.basename(path.dirname(filePath));

      // Extract date from filename (YYYY-MM-DD format)
      const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : filename;

      // Track references by glossary ID for this file
      const fileRefs = new Map<string, { displayText: string; lineNumbers: number[] }>();

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const pattern = new RegExp(GLOSSARY_PATTERN.source, 'g');
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const displayText = match[1];
          const linkPath = match[2]; // e.g., ../_glossary/people/core/DINA.md

          // Extract glossary ID from path
          const glossaryId = this.extractGlossaryId(linkPath);
          if (!glossaryId) continue;

          // Add to file refs
          if (!fileRefs.has(glossaryId)) {
            fileRefs.set(glossaryId, { displayText, lineNumbers: [] });
          }
          fileRefs.get(glossaryId)!.lineNumbers.push(lineNum + 1); // 1-indexed
        }
      }

      // Add file refs to reverse index
      for (const [glossaryId, { displayText, lineNumbers }] of fileRefs) {
        const ref: GlossaryReference = {
          entryPath: relativePath,
          date,
          carnet,
          displayText,
          lineNumbers,
        };

        if (!this.reverseIndex.has(glossaryId)) {
          this.reverseIndex.set(glossaryId, []);
        }
        this.reverseIndex.get(glossaryId)!.push(ref);
      }
    } catch (e) {
      console.error(`Error indexing ${filePath}:`, e);
    }
  }

  /**
   * Extract glossary ID from a link path
   * e.g., ../_glossary/people/core/DINA.md → DINA
   */
  private extractGlossaryId(linkPath: string): string | null {
    const match = linkPath.match(/([A-Z0-9_]+)\.md$/);
    return match ? match[1] : null;
  }

  /**
   * Get all diary entry files (not glossary files)
   */
  private getAllDiaryFiles(): string[] {
    const diaryFiles: string[] = [];

    if (!fs.existsSync(this.diaryBase)) {
      return diaryFiles;
    }

    const items = fs.readdirSync(this.diaryBase, { withFileTypes: true });
    for (const item of items) {
      // Skip glossary directory and non-carnet directories
      if (!item.isDirectory() || item.name === '_glossary' || item.name.startsWith('_')) {
        continue;
      }

      const carnetDir = path.join(this.diaryBase, item.name);
      const files = fs
        .readdirSync(carnetDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.join(carnetDir, f));
      diaryFiles.push(...files);
    }

    return diaryFiles.sort();
  }

  /**
   * Get all glossary file IDs
   */
  getAllGlossaryIds(): Set<string> {
    const ids = new Set<string>();

    if (!fs.existsSync(this.glossaryBase)) {
      return ids;
    }

    const walkDir = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          walkDir(fullPath);
        } else if (item.name.endsWith('.md') && !item.name.startsWith('_')) {
          const id = item.name.slice(0, -3); // Remove .md
          ids.add(id);
        }
      }
    };

    walkDir(this.glossaryBase);
    return ids;
  }

  /**
   * Find all diary entries that reference a specific glossary entry
   */
  findReferences(glossaryId: string): GlossaryReference[] {
    const index = this.buildReverseIndex();
    return index.get(glossaryId.toUpperCase()) || [];
  }

  /**
   * Find orphaned glossary entries (exist but never referenced)
   */
  findOrphaned(): string[] {
    const allIds = this.getAllGlossaryIds();
    const index = this.buildReverseIndex();

    const orphaned: string[] = [];
    for (const id of allIds) {
      if (!index.has(id) || index.get(id)!.length === 0) {
        orphaned.push(id);
      }
    }

    return orphaned.sort();
  }

  /**
   * Find glossary entries that are referenced but don't exist
   */
  findMissing(): string[] {
    const allIds = this.getAllGlossaryIds();
    const index = this.buildReverseIndex();

    const missing: string[] = [];
    for (const id of index.keys()) {
      if (!allIds.has(id)) {
        missing.push(id);
      }
    }

    return missing.sort();
  }

  /**
   * Get usage statistics for all glossary entries
   */
  getUsageStats(): GlossaryUsageStats {
    const allIds = this.getAllGlossaryIds();
    const index = this.buildReverseIndex();

    let totalReferences = 0;
    let referencedEntries = 0;
    const referenceCounts: Array<{ id: string; count: number }> = [];

    for (const id of allIds) {
      const refs = index.get(id) || [];
      if (refs.length > 0) {
        referencedEntries++;
        totalReferences += refs.length;
        referenceCounts.push({ id, count: refs.length });
      }
    }

    // Sort by count descending
    referenceCounts.sort((a, b) => b.count - a.count);

    return {
      totalGlossaryEntries: allIds.size,
      referencedEntries,
      orphanedEntries: allIds.size - referencedEntries,
      totalReferences,
      averageReferencesPerEntry: referencedEntries > 0 ? totalReferences / referencedEntries : 0,
      topReferenced: referenceCounts.slice(0, 20),
    };
  }

  /**
   * Search for glossary entries by pattern (partial ID match)
   */
  searchEntries(pattern: string): Array<{ id: string; referenceCount: number }> {
    const allIds = this.getAllGlossaryIds();
    const index = this.buildReverseIndex();
    const regex = new RegExp(pattern, 'i');

    const matches: Array<{ id: string; referenceCount: number }> = [];
    for (const id of allIds) {
      if (regex.test(id)) {
        const refs = index.get(id) || [];
        matches.push({ id, referenceCount: refs.length });
      }
    }

    return matches.sort((a, b) => b.referenceCount - a.referenceCount);
  }

  /**
   * Get the file path for a glossary entry by ID
   */
  getGlossaryPath(id: string): string | null {
    if (!fs.existsSync(this.glossaryBase)) {
      return null;
    }

    const findFile = (dir: string): string | null => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          const found = findFile(fullPath);
          if (found) return found;
        } else if (item.name === `${id}.md`) {
          return fullPath;
        }
      }
      return null;
    };

    return findFile(this.glossaryBase);
  }

  /**
   * Generate a detailed report for a glossary entry
   */
  generateEntryReport(glossaryId: string): string {
    const refs = this.findReferences(glossaryId);
    const glossaryPath = this.getGlossaryPath(glossaryId);

    const lines: string[] = [];
    lines.push(`=== Glossary Entry Report: ${glossaryId} ===`);
    lines.push('');

    if (glossaryPath) {
      lines.push(`File: ${path.relative(this.basePath, glossaryPath)}`);
    } else {
      lines.push('Status: NOT FOUND (missing glossary file)');
    }

    lines.push('');
    lines.push(`Total references: ${refs.length}`);

    if (refs.length === 0) {
      lines.push('');
      lines.push('This glossary entry is ORPHANED (not referenced in any diary entry)');
    } else {
      lines.push('');
      lines.push('Referenced in:');

      // Group by carnet
      const byCarnet = new Map<string, GlossaryReference[]>();
      for (const ref of refs) {
        if (!byCarnet.has(ref.carnet)) {
          byCarnet.set(ref.carnet, []);
        }
        byCarnet.get(ref.carnet)!.push(ref);
      }

      for (const [carnet, carnetRefs] of [...byCarnet.entries()].sort()) {
        lines.push(`  Carnet ${carnet}: (${carnetRefs.length} entries)`);
        for (const ref of carnetRefs.sort((a, b) => a.date.localeCompare(b.date))) {
          const lineInfo = ref.lineNumbers.length > 1
            ? `lines ${ref.lineNumbers.join(', ')}`
            : `line ${ref.lineNumbers[0]}`;
          lines.push(`    - ${ref.date} [${lineInfo}] as "${ref.displayText}"`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate orphaned entries report
   */
  generateOrphanedReport(): string {
    const orphaned = this.findOrphaned();

    const lines: string[] = [];
    lines.push('=== Orphaned Glossary Entries Report ===');
    lines.push('');
    lines.push(`Found ${orphaned.length} glossary entries with no references`);
    lines.push('');

    if (orphaned.length === 0) {
      lines.push('All glossary entries are referenced!');
    } else {
      // Group by category
      const byCategory = new Map<string, string[]>();

      for (const id of orphaned) {
        const filePath = this.getGlossaryPath(id);
        let category = 'unknown';
        if (filePath) {
          const relativePath = path.relative(this.glossaryBase, filePath);
          category = path.dirname(relativePath);
        }

        if (!byCategory.has(category)) {
          byCategory.set(category, []);
        }
        byCategory.get(category)!.push(id);
      }

      for (const [category, ids] of [...byCategory.entries()].sort()) {
        lines.push(`${category}/ (${ids.length})`);
        for (const id of ids.sort()) {
          lines.push(`  - ${id}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Clear the cached index (useful for testing or after modifications)
   */
  clearCache(): void {
    this.reverseIndex = null;
  }
}
