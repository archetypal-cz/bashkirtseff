import * as fs from 'node:fs';
import * as path from 'node:path';

import { toCapitalAscii as sharedToCapitalAscii } from '../models/glossary.js';

/**
 * Glossary link validation statistics
 */
export interface GlossaryValidationStats {
  totalFiles: number;
  filesWithLinks: number;
  totalLinks: number;
  validLinks: number;
  brokenLinks: number;
  uniqueBroken: Set<string>;
  brokenByFile: Map<string, Array<{ text: string; path: string }>>;
}

/**
 * Glossary Manager for managing glossary files and links
 */
export class GlossaryManager {
  private basePath: string;
  private diaryBase: string;
  private glossaryBase: string;
  private linkPattern: RegExp;

  constructor(basePath: string = '.') {
    this.basePath = basePath;
    this.diaryBase = path.join(basePath, 'content/_original');
    this.glossaryBase = path.join(basePath, 'content/_original/_glossary');
    this.linkPattern = /\[([^\]]+)\]\(\.\.\/_glossary\/([^)]+\.md)\)/g;
  }

  /**
   * Convert text to CAPITAL_ASCII format (for glossary file naming)
   * Delegates to the shared toCapitalAscii function from models/glossary.ts
   */
  static toCapitalAscii(text: string): string {
    return sharedToCapitalAscii(text);
  }

  /**
   * Get all existing glossary files (relative paths)
   */
  getAllGlossaryFiles(): Set<string> {
    const files = new Set<string>();

    if (!fs.existsSync(this.glossaryBase)) {
      return files;
    }

    const walkDir = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          walkDir(fullPath);
        } else if (item.name.endsWith('.md')) {
          const relativePath = path.relative(this.glossaryBase, fullPath);
          files.add(relativePath);
        }
      }
    };

    walkDir(this.glossaryBase);
    return files;
  }

  /**
   * Get all diary entry files
   */
  getAllDiaryFiles(): string[] {
    const diaryFiles: string[] = [];

    if (!fs.existsSync(this.diaryBase)) {
      return diaryFiles;
    }

    for (let i = 0; i < 15; i++) {
      const bookDir = path.join(this.diaryBase, i.toString().padStart(2, '0'));
      if (fs.existsSync(bookDir)) {
        const files = fs
          .readdirSync(bookDir)
          .filter((f) => f.endsWith('.md'))
          .map((f) => path.join(bookDir, f));
        diaryFiles.push(...files);
      }
    }

    return diaryFiles.sort();
  }

  /**
   * Validate all glossary links in diary entries
   */
  validateLinks(): GlossaryValidationStats {
    const existingFiles = this.getAllGlossaryFiles();
    const stats: GlossaryValidationStats = {
      totalFiles: 0,
      filesWithLinks: 0,
      totalLinks: 0,
      validLinks: 0,
      brokenLinks: 0,
      uniqueBroken: new Set(),
      brokenByFile: new Map(),
    };

    for (const diaryFile of this.getAllDiaryFiles()) {
      stats.totalFiles++;

      try {
        const content = fs.readFileSync(diaryFile, 'utf-8');
        const links: Array<[string, string]> = [];

        // Reset regex lastIndex
        this.linkPattern.lastIndex = 0;
        let match;
        while ((match = this.linkPattern.exec(content)) !== null) {
          links.push([match[1], match[2]]);
        }

        if (links.length > 0) {
          stats.filesWithLinks++;
          stats.totalLinks += links.length;

          const fileName = path.basename(diaryFile);

          for (const [text, filePath] of links) {
            if (existingFiles.has(filePath)) {
              stats.validLinks++;
            } else {
              stats.brokenLinks++;
              stats.uniqueBroken.add(filePath);

              if (!stats.brokenByFile.has(fileName)) {
                stats.brokenByFile.set(fileName, []);
              }
              stats.brokenByFile.get(fileName)!.push({ text, path: filePath });
            }
          }
        }
      } catch (e) {
        console.error(`Error reading ${diaryFile}:`, e);
      }
    }

    return stats;
  }

  /**
   * Create stub files for missing glossary entries
   */
  createMissingStubs(dryRun: boolean = false): number {
    const stats = this.validateLinks();
    let createdCount = 0;

    for (const filePath of stats.uniqueBroken) {
      const glossaryPath = path.join(this.glossaryBase, filePath);

      if (!fs.existsSync(glossaryPath)) {
        if (dryRun) {
          console.log(`Would create: ${filePath}`);
        } else {
          // Create parent directory if needed
          const parentDir = path.dirname(glossaryPath);
          fs.mkdirSync(parentDir, { recursive: true });

          // Create stub content
          const name = path.basename(glossaryPath, '.md').replace(/_/g, ' ');
          const content = `# ${name}

## Basic Information
- Type: Unknown - Stub Entry
- Status: Stub entry (automatically generated)

## Description
[No description available - stub entry created from diary references]

## References in Diary
[Multiple references found - needs research]

## Research Notes
- Created: Automatically generated stub
- Needs proper research and content
`;

          fs.writeFileSync(glossaryPath, content, 'utf-8');
          console.log(`Created stub: ${filePath}`);
        }

        createdCount++;
      }
    }

    return createdCount;
  }

  /**
   * Check for files not following CAPITAL_ASCII naming standard
   */
  checkNamingStandards(): Map<string, string[]> {
    const nonStandard = new Map<string, string[]>();

    if (!fs.existsSync(this.glossaryBase)) {
      return nonStandard;
    }

    const walkDir = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          walkDir(fullPath);
        } else if (item.name.endsWith('.md')) {
          const filename = item.name;
          const expected = GlossaryManager.toCapitalAscii(filename.slice(0, -3)) + '.md';

          if (filename !== expected) {
            if (!nonStandard.has(expected)) {
              nonStandard.set(expected, []);
            }
            nonStandard.get(expected)!.push(fullPath);
          }
        }
      }
    };

    walkDir(this.glossaryBase);
    return nonStandard;
  }

  /**
   * Update diary links based on a path mapping
   */
  updateDiaryLinks(
    mapping: Map<string, string>
  ): { filesProcessed: number; filesUpdated: number; linksUpdated: number } {
    const stats = {
      filesProcessed: 0,
      filesUpdated: 0,
      linksUpdated: 0,
    };

    for (const diaryFile of this.getAllDiaryFiles()) {
      try {
        let content = fs.readFileSync(diaryFile, 'utf-8');
        const originalContent = content;
        let linksInFile = 0;

        // Reset regex lastIndex
        this.linkPattern.lastIndex = 0;

        content = content.replace(this.linkPattern, (match, text, filePath) => {
          if (mapping.has(filePath)) {
            linksInFile++;
            return `[${text}](../_glossary/${mapping.get(filePath)})`;
          }
          return match;
        });

        if (content !== originalContent) {
          fs.writeFileSync(diaryFile, content, 'utf-8');
          stats.filesUpdated++;
          stats.linksUpdated += linksInFile;
          console.log(
            `Updated ${path.basename(diaryFile)}: ${linksInFile} links`
          );
        }

        stats.filesProcessed++;
      } catch (e) {
        console.error(`Error processing ${diaryFile}:`, e);
      }
    }

    return stats;
  }

  /**
   * Generate a full report of the glossary system
   */
  generateReport(): string {
    const lines: string[] = [];

    lines.push('=== GLOSSARY SYSTEM REPORT ===');
    lines.push('');

    // File count
    const files = this.getAllGlossaryFiles();
    lines.push(`Total glossary files: ${files.size}`);

    // Validation
    const stats = this.validateLinks();
    lines.push('');
    lines.push('Link validation:');
    lines.push(`  Total links: ${stats.totalLinks}`);
    lines.push(`  Valid links: ${stats.validLinks}`);
    lines.push(`  Broken links: ${stats.brokenLinks}`);

    // Validity rate
    if (stats.totalLinks > 0) {
      const validity = ((stats.validLinks / stats.totalLinks) * 100).toFixed(1);
      lines.push(`  Link validity rate: ${validity}%`);
    }

    // Naming standards
    const nonStandard = this.checkNamingStandards();
    lines.push('');
    lines.push('Naming standards:');
    lines.push(`  Non-standard files: ${nonStandard.size}`);

    return lines.join('\n');
  }
}
