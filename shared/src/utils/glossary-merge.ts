/**
 * Glossary Merge Utilities
 *
 * Functions for merging glossary entries by renaming tags throughout
 * diary entries, translations, and glossary files.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// Pattern to match glossary links: [#Display_Text](../_glossary/category/ID.md)
export const GLOSSARY_LINK_PATTERN = /\[#([^\]]+)\]\(([^)]*\/_glossary\/[^)]+\.md)\)/g;

// Pattern to match frontmatter list items
export const FRONTMATTER_ITEM_PATTERN = /^(\s+-\s+)(\S+)$/;

export interface MergeResult {
  filesUpdated: number;
  linksUpdated: number;
  frontmatterUpdated: number;
  glossaryMerged: boolean;
  sourceDeleted: boolean;
  errors: string[];
}

export interface MergeOptions {
  dryRun?: boolean;
  verbose?: boolean;
  deleteSource?: boolean;
}

export interface DuplicateCandidate {
  ids: string[];
  reason: string;
  referencesCounts: number[];
}

/**
 * Get all markdown files that may contain glossary references
 */
export function getAllContentFiles(basePath: string, translationDirs: string[] = ['cz']): string[] {
  const files: string[] = [];
  const originalBase = path.join(basePath, 'src/_original');

  const addDiaryFiles = (baseDir: string) => {
    if (!fs.existsSync(baseDir)) return;

    const items = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory() || item.name.startsWith('_')) continue;

      const carnetDir = path.join(baseDir, item.name);
      const mdFiles = fs
        .readdirSync(carnetDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.join(carnetDir, f));
      files.push(...mdFiles);
    }
  };

  // Add original files
  addDiaryFiles(originalBase);

  // Add translation files
  for (const lang of translationDirs) {
    addDiaryFiles(path.join(basePath, 'src', lang));
  }

  return files.sort();
}

/**
 * Find the glossary file path for an ID
 */
export function findGlossaryFile(glossaryBase: string, id: string): string | null {
  const walkDir = (dir: string): string | null => {
    if (!fs.existsSync(dir)) return null;

    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        const found = walkDir(fullPath);
        if (found) return found;
      } else if (item.name === `${id}.md`) {
        return fullPath;
      }
    }
    return null;
  };

  return walkDir(glossaryBase);
}

/**
 * Get the relative path for a glossary ID (category/subcategory/ID.md)
 */
export function getGlossaryRelativePath(glossaryBase: string, id: string): string | null {
  const filePath = findGlossaryFile(glossaryBase, id);
  if (!filePath) return null;
  return path.relative(glossaryBase, filePath);
}

/**
 * Update glossary links in content
 * Replaces [#SOURCE](...SOURCE.md) with [#TARGET](...TARGET.md)
 */
export function updateGlossaryLinks(
  content: string,
  sourceId: string,
  targetId: string,
  targetRelPath: string
): { content: string; count: number } {
  let count = 0;

  const newContent = content.replace(
    new RegExp(GLOSSARY_LINK_PATTERN.source, 'g'),
    (match, displayText, linkPath) => {
      // Extract the ID from the link path
      const idMatch = linkPath.match(/([A-Z0-9_]+)\.md$/);
      if (!idMatch) return match;

      const linkId = idMatch[1];
      if (linkId !== sourceId) return match;

      // Replace with target
      count++;
      // Preserve the relative path prefix (../_glossary/ or similar)
      const prefix = linkPath.match(/^(.*\/_glossary\/)/)?.[1] || '../_glossary/';
      return `[#${targetId}](${prefix}${targetRelPath})`;
    }
  );

  return { content: newContent, count };
}

/**
 * Update frontmatter metadata lists
 * Updates people:, places:, themes: lists
 */
export function updateFrontmatter(
  content: string,
  sourceId: string,
  targetId: string
): { content: string; count: number } {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let inRelevantList = false;
  let count = 0;
  const seenInList = new Set<string>();

  const relevantLists = ['people:', 'places:', 'themes:', 'culture:'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        seenInList.clear();
      } else {
        inFrontmatter = false;
        inRelevantList = false;
      }
      continue;
    }

    if (!inFrontmatter) continue;

    // Check if entering a relevant list
    if (relevantLists.some((l) => line.startsWith(l))) {
      inRelevantList = true;
      seenInList.clear();
      continue;
    }

    // Check if leaving list (non-indented line)
    if (inRelevantList && !line.startsWith(' ') && !line.startsWith('\t') && line.trim() !== '') {
      inRelevantList = false;
      seenInList.clear();
    }

    // Update list items
    if (inRelevantList) {
      const itemMatch = line.match(FRONTMATTER_ITEM_PATTERN);
      if (itemMatch) {
        const [, prefix, value] = itemMatch;

        if (value === sourceId) {
          // Check if target already exists in this list
          if (seenInList.has(targetId)) {
            // Remove duplicate - mark line for deletion
            lines[i] = '<<<DELETE>>>';
          } else {
            lines[i] = `${prefix}${targetId}`;
            seenInList.add(targetId);
          }
          count++;
        } else {
          seenInList.add(value);
        }
      }
    }
  }

  // Remove lines marked for deletion
  const filteredLines = lines.filter((l) => l !== '<<<DELETE>>>');

  return { content: filteredLines.join('\n'), count };
}

/**
 * Extract body content after YAML frontmatter
 */
export function extractBodyContent(content: string): string {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterEnd = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        frontmatterEnd = i + 1;
        break;
      }
    }
  }

  return lines.slice(frontmatterEnd).join('\n');
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Merge two glossary entries
 */
export async function mergeGlossaryEntries(
  basePath: string,
  sourceId: string,
  targetId: string,
  options: MergeOptions = {}
): Promise<MergeResult> {
  const { dryRun = false, verbose = false, deleteSource = true } = options;

  const glossaryBase = path.join(basePath, 'src/_original/_glossary');
  const result: MergeResult = {
    filesUpdated: 0,
    linksUpdated: 0,
    frontmatterUpdated: 0,
    glossaryMerged: false,
    sourceDeleted: false,
    errors: [],
  };

  // Validate IDs
  const upperSource = sourceId.toUpperCase();
  const upperTarget = targetId.toUpperCase();

  if (upperSource === upperTarget) {
    result.errors.push('Source and target IDs are the same');
    return result;
  }

  // Find target glossary file (must exist)
  const targetPath = findGlossaryFile(glossaryBase, upperTarget);
  const targetRelPath = getGlossaryRelativePath(glossaryBase, upperTarget);

  if (!targetPath || !targetRelPath) {
    result.errors.push(`Target glossary entry not found: ${upperTarget}`);
    return result;
  }

  // Find source glossary file (may not exist if just fixing references)
  const sourcePath = findGlossaryFile(glossaryBase, upperSource);

  if (verbose) {
    console.log(`\nMerging ${upperSource} → ${upperTarget}`);
    console.log(`  Target: ${targetRelPath}`);
    if (sourcePath) {
      console.log(`  Source: ${path.relative(glossaryBase, sourcePath)}`);
    } else {
      console.log(`  Source glossary file not found (will only update references)`);
    }
  }

  // Update all content files
  const contentFiles = getAllContentFiles(basePath);

  for (const filePath of contentFiles) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // Update glossary links
      const linkResult = updateGlossaryLinks(content, upperSource, upperTarget, targetRelPath);
      content = linkResult.content;
      result.linksUpdated += linkResult.count;

      // Update frontmatter (only for original files)
      if (filePath.includes('/_original/')) {
        const fmResult = updateFrontmatter(content, upperSource, upperTarget);
        content = fmResult.content;
        result.frontmatterUpdated += fmResult.count;
      }

      if (content !== originalContent) {
        result.filesUpdated++;

        if (verbose) {
          const relPath = path.relative(basePath, filePath);
          console.log(`  Updated: ${relPath} (${linkResult.count} links)`);
        }

        if (!dryRun) {
          fs.writeFileSync(filePath, content, 'utf-8');
        }
      }
    } catch (e) {
      result.errors.push(`Error processing ${filePath}: ${e}`);
    }
  }

  // Merge glossary content if source exists
  if (sourcePath) {
    try {
      const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
      const targetContent = fs.readFileSync(targetPath, 'utf-8');

      // Extract content after frontmatter from source
      const sourceBody = extractBodyContent(sourceContent);

      if (sourceBody.trim()) {
        // Append source content to target with merge marker
        const mergeNote = `\n\n---\n\n%% ${new Date().toISOString()} RSR: Merged content from ${upperSource} %%\n\n`;
        const newTargetContent = targetContent.trimEnd() + mergeNote + sourceBody;

        if (!dryRun) {
          fs.writeFileSync(targetPath, newTargetContent, 'utf-8');
        }

        result.glossaryMerged = true;

        if (verbose) {
          console.log(`  Merged glossary content from ${upperSource} to ${upperTarget}`);
        }
      }

      // Delete source file
      if (deleteSource) {
        if (!dryRun) {
          fs.unlinkSync(sourcePath);
        }
        result.sourceDeleted = true;

        if (verbose) {
          console.log(`  Deleted source: ${path.relative(glossaryBase, sourcePath)}`);
        }
      }
    } catch (e) {
      result.errors.push(`Error merging glossary files: ${e}`);
    }
  }

  return result;
}
