/**
 * Glossary Merge Utilities
 *
 * Functions for merging glossary entries by renaming tags throughout
 * diary entries, translations, and glossary files.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { writeFileAtomic } from './atomic-write.js';
import { rewriteGlossaryLinks } from './glossary-links.js';

// Pattern to match frontmatter list items
export const FRONTMATTER_ITEM_PATTERN = /^(\s+-\s+)(\S+)$/;

/** Translation trees that carry glossary links alongside `_original`. */
export const TRANSLATION_DIRS = ['cz', 'uk', 'en', 'fr'];

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
  translationDirs?: string[];
  /**
   * Optional AI-assisted merge of the two entries. Returns the full merged file
   * content for the target, or null to fall back to a plain append.
   */
  smartMerge?: (
    sourceId: string,
    sourceContent: string,
    targetId: string,
    targetContent: string
  ) => string | null;
}

export interface DuplicateCandidate {
  ids: string[];
  reason: string;
  referencesCounts: number[];
}

/**
 * Get all markdown files that may contain glossary references: the originals,
 * every translation tree, and the glossary itself (entries cross-link).
 */
export function getAllContentFiles(
  basePath: string,
  translationDirs: string[] = TRANSLATION_DIRS
): string[] {
  const files: string[] = [];
  const contentBase = path.join(basePath, 'content');

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

  addDiaryFiles(path.join(contentBase, '_original'));

  for (const lang of translationDirs) {
    addDiaryFiles(path.join(contentBase, lang));
  }

  const walkGlossary = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) walkGlossary(fullPath);
      else if (item.name.endsWith('.md')) files.push(fullPath);
    }
  };

  walkGlossary(path.join(contentBase, '_original/_glossary'));

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

interface PendingWrite {
  filePath: string;
  content: string;
  links: number;
}

/**
 * Compute the rewrite of every file that references `sourceId`.
 * Reads and parses everything up front so a single unreadable file aborts the
 * merge before any of it is written.
 */
export function planMergeRewrites(
  contentFiles: string[],
  glossaryBase: string,
  sourceId: string,
  targetPath: string,
  targetId: string
): { writes: PendingWrite[]; linksUpdated: number; frontmatterUpdated: number; errors: string[] } {
  const writes: PendingWrite[] = [];
  const errors: string[] = [];
  let linksUpdated = 0;
  let frontmatterUpdated = 0;

  const sourceFile = `${sourceId}.md`;

  for (const filePath of contentFiles) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      errors.push(`Cannot read ${filePath}: ${e}`);
      continue;
    }

    const originalContent = content;

    const linkResult = rewriteGlossaryLinks(
      content,
      path.dirname(filePath),
      glossaryBase,
      (target, displayText) =>
        path.basename(target) === sourceFile
          ? { path: targetPath, displayText: displayText.startsWith('#') ? `#${targetId}` : undefined }
          : null
    );
    content = linkResult.content;
    linksUpdated += linkResult.count;

    if (filePath.includes(`${path.sep}_original${path.sep}`)) {
      const fmResult = updateFrontmatter(content, sourceId, targetId);
      content = fmResult.content;
      frontmatterUpdated += fmResult.count;
    }

    if (content !== originalContent) {
      writes.push({ filePath, content, links: linkResult.count });
    }
  }

  return { writes, linksUpdated, frontmatterUpdated, errors };
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
  const {
    dryRun = false,
    verbose = false,
    deleteSource = true,
    translationDirs = TRANSLATION_DIRS,
    smartMerge,
  } = options;

  const glossaryBase = path.join(basePath, 'content/_original/_glossary');
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

  if (!targetPath) {
    result.errors.push(`Target glossary entry not found: ${upperTarget}`);
    return result;
  }

  // Find source glossary file (may not exist if just fixing references)
  const sourcePath = findGlossaryFile(glossaryBase, upperSource);

  if (verbose) {
    console.log(`\nMerging ${upperSource} → ${upperTarget}`);
    console.log(`  Target: ${path.relative(glossaryBase, targetPath)}`);
    if (sourcePath) {
      console.log(`  Source: ${path.relative(glossaryBase, sourcePath)}`);
    } else {
      console.log(`  Source glossary file not found (will only update references)`);
    }
  }

  // Preflight every rewrite before touching anything on disk
  const contentFiles = getAllContentFiles(basePath, translationDirs);
  const plan = planMergeRewrites(contentFiles, glossaryBase, upperSource, targetPath, upperTarget);

  result.linksUpdated = plan.linksUpdated;
  result.frontmatterUpdated = plan.frontmatterUpdated;
  result.filesUpdated = plan.writes.length;

  if (plan.errors.length > 0) {
    result.errors.push(...plan.errors);
    result.filesUpdated = 0;
    result.linksUpdated = 0;
    result.frontmatterUpdated = 0;
    return result;
  }

  for (const write of plan.writes) {
    if (verbose) {
      console.log(`  Updated: ${path.relative(basePath, write.filePath)} (${write.links} links)`);
    }
    if (!dryRun) {
      writeFileAtomic(write.filePath, write.content);
    }
  }

  // Merge glossary content if source exists
  if (sourcePath && !dryRun) {
    try {
      const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
      const targetContent = fs.readFileSync(targetPath, 'utf-8');

      const merged = smartMerge
        ? smartMerge(upperSource, sourceContent, upperTarget, targetContent)
        : null;

      if (merged) {
        writeFileAtomic(targetPath, merged.endsWith('\n') ? merged : `${merged}\n`);
        result.glossaryMerged = true;
      } else {
        // The source body's own links are relative to the source's directory;
        // appending them under the target rebases them to the target's depth.
        const sourceBody = rewriteGlossaryLinks(
          extractBodyContent(sourceContent),
          path.dirname(sourcePath),
          glossaryBase,
          (target) => ({ path: target }),
          path.dirname(targetPath)
        ).content;
        if (sourceBody.trim()) {
          const mergeNote = `\n\n---\n\n%% ${new Date().toISOString()} RSR: Merged content from ${upperSource} %%\n\n`;
          writeFileAtomic(targetPath, targetContent.trimEnd() + mergeNote + sourceBody);
          result.glossaryMerged = true;
        }
      }

      if (verbose && result.glossaryMerged) {
        console.log(`  Merged glossary content from ${upperSource} to ${upperTarget}`);
      }

      // Only now is the source redundant
      if (deleteSource) {
        fs.unlinkSync(sourcePath);
        result.sourceDeleted = true;

        if (verbose) {
          console.log(`  Deleted source: ${path.relative(glossaryBase, sourcePath)}`);
        }
      }
    } catch (e) {
      result.errors.push(`Error merging glossary files: ${e}`);
    }
  } else if (sourcePath && dryRun && verbose) {
    console.log(`  Would merge ${upperSource} into ${upperTarget} and delete the source`);
  }

  return result;
}
