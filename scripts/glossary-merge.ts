#!/usr/bin/env npx tsx

/**
 * Glossary Merge CLI
 *
 * Merge glossary entries by renaming one tag to another throughout
 * diary entries, translations, and glossary files.
 *
 * Usage:
 *   npx tsx scripts/glossary-merge.ts <command> [options]
 *
 * Commands:
 *   merge <source> <target>  Merge source tag into target (renames source → target everywhere)
 *   find-duplicates          Find potential duplicate glossary entries
 *   batch-merge <file>       Merge multiple pairs from a file (format: SOURCE TARGET per line)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { GlossaryReferences } from '../shared/src/utils/glossary-references.js';

const BASE_PATH = process.cwd();
const ORIGINAL_BASE = path.join(BASE_PATH, 'src/_original');
const GLOSSARY_BASE = path.join(BASE_PATH, 'src/_original/_glossary');
const TRANSLATION_DIRS = ['cz']; // Add more language codes as needed

// Pattern to match glossary links: [#Display_Text](../_glossary/category/ID.md)
const GLOSSARY_LINK_PATTERN = /\[#([^\]]+)\]\(([^)]*\/_glossary\/[^)]+\.md)\)/g;

// Pattern to match frontmatter list items
const FRONTMATTER_ITEM_PATTERN = /^(\s+-\s+)(\S+)$/;

interface CliOptions {
  command: string;
  args: string[];
  dryRun: boolean;
  verbose: boolean;
  deleteSource: boolean;
}

interface MergeResult {
  filesUpdated: number;
  linksUpdated: number;
  frontmatterUpdated: number;
  glossaryMerged: boolean;
  sourceDeleted: boolean;
  errors: string[];
}

interface DuplicateCandidate {
  ids: string[];
  reason: string;
  referencesCounts: number[];
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    command: '',
    args: [],
    dryRun: false,
    verbose: false,
    deleteSource: true,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--dry-run' || arg === '-n') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--no-delete') {
      options.deleteSource = false;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (!options.command) {
      options.command = arg;
    } else {
      options.args.push(arg);
    }
    i++;
  }

  return options;
}

function showHelp(): void {
  console.log(`
Glossary Merge CLI

Merge glossary entries by renaming tags throughout the codebase.

Usage:
  npx tsx scripts/glossary-merge.ts <command> [options]

Commands:
  merge <source> <target>  Merge source tag into target
                           - Renames all [#source] links to [#target]
                           - Updates frontmatter metadata lists
                           - Appends source glossary content to target
                           - Deletes source glossary file (unless --no-delete)

  find-duplicates          Find potential duplicate glossary entries
                           - Similar names (Levenshtein distance)
                           - Same base name with different suffixes
                           - Orphaned entries that may be duplicates

  batch-merge <file>       Merge multiple pairs from a file
                           - File format: SOURCE TARGET (one pair per line)
                           - Lines starting with # are comments
                           - Empty lines are ignored

Options:
  --dry-run, -n            Preview changes without modifying files
  --verbose, -v            Show detailed output
  --no-delete              Don't delete source glossary file after merge
  --help, -h               Show this help message

Examples:
  # Merge DUKE_HAMILTON into DUKE_OF_HAMILTON
  npx tsx scripts/glossary-merge.ts merge DUKE_HAMILTON DUKE_OF_HAMILTON

  # Preview merge without making changes
  npx tsx scripts/glossary-merge.ts merge OLD_TAG NEW_TAG --dry-run

  # Find potential duplicates
  npx tsx scripts/glossary-merge.ts find-duplicates

  # Batch merge from file
  npx tsx scripts/glossary-merge.ts batch-merge merges.txt
`);
}

/**
 * Get all markdown files that may contain glossary references
 */
function getAllContentFiles(): string[] {
  const files: string[] = [];

  // Original diary entries
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
  addDiaryFiles(ORIGINAL_BASE);

  // Add translation files
  for (const lang of TRANSLATION_DIRS) {
    addDiaryFiles(path.join(BASE_PATH, 'src', lang));
  }

  return files.sort();
}

/**
 * Find the glossary file path for an ID
 */
function findGlossaryFile(id: string): string | null {
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

  return walkDir(GLOSSARY_BASE);
}

/**
 * Get the relative path for a glossary ID (category/subcategory/ID.md)
 */
function getGlossaryRelativePath(id: string): string | null {
  const filePath = findGlossaryFile(id);
  if (!filePath) return null;
  return path.relative(GLOSSARY_BASE, filePath);
}

/**
 * Update glossary links in content
 * Replaces [#SOURCE](...SOURCE.md) with [#TARGET](...TARGET.md)
 */
function updateGlossaryLinks(
  content: string,
  sourceId: string,
  targetId: string,
  targetRelPath: string
): { content: string; count: number } {
  let count = 0;

  const newContent = content.replace(GLOSSARY_LINK_PATTERN, (match, displayText, linkPath) => {
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
  });

  return { content: newContent, count };
}

/**
 * Update frontmatter metadata lists
 * Updates people:, places:, themes: lists
 */
function updateFrontmatter(
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
 * Merge two glossary entries
 */
async function mergeGlossaryEntries(
  sourceId: string,
  targetId: string,
  options: CliOptions
): Promise<MergeResult> {
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
  const targetPath = findGlossaryFile(upperTarget);
  const targetRelPath = getGlossaryRelativePath(upperTarget);

  if (!targetPath || !targetRelPath) {
    result.errors.push(`Target glossary entry not found: ${upperTarget}`);
    return result;
  }

  // Find source glossary file (may not exist if just fixing references)
  const sourcePath = findGlossaryFile(upperSource);

  if (options.verbose) {
    console.log(`\nMerging ${upperSource} → ${upperTarget}`);
    console.log(`  Target: ${targetRelPath}`);
    if (sourcePath) {
      console.log(`  Source: ${path.relative(GLOSSARY_BASE, sourcePath)}`);
    } else {
      console.log(`  Source glossary file not found (will only update references)`);
    }
  }

  // Update all content files
  const contentFiles = getAllContentFiles();

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

        if (options.verbose) {
          const relPath = path.relative(BASE_PATH, filePath);
          console.log(`  Updated: ${relPath} (${linkResult.count} links)`);
        }

        if (!options.dryRun) {
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

        if (!options.dryRun) {
          fs.writeFileSync(targetPath, newTargetContent, 'utf-8');
        }

        result.glossaryMerged = true;

        if (options.verbose) {
          console.log(`  Merged glossary content from ${upperSource} to ${upperTarget}`);
        }
      }

      // Delete source file
      if (options.deleteSource) {
        if (!options.dryRun) {
          fs.unlinkSync(sourcePath);
        }
        result.sourceDeleted = true;

        if (options.verbose) {
          console.log(`  Deleted source: ${path.relative(GLOSSARY_BASE, sourcePath)}`);
        }
      }
    } catch (e) {
      result.errors.push(`Error merging glossary files: ${e}`);
    }
  }

  return result;
}

/**
 * Extract body content after YAML frontmatter
 */
function extractBodyContent(content: string): string {
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
function levenshteinDistance(a: string, b: string): number {
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
 * Find potential duplicate glossary entries
 */
function findDuplicates(verbose: boolean): DuplicateCandidate[] {
  const refs = new GlossaryReferences(BASE_PATH);
  const allIds = Array.from(refs.getAllGlossaryIds());
  const candidates: DuplicateCandidate[] = [];

  // Build reference counts
  refs.buildReverseIndex();
  const refCounts = new Map<string, number>();
  for (const id of allIds) {
    refCounts.set(id, refs.findReferences(id).length);
  }

  // Group by normalized base name (without common suffixes)
  const baseNameGroups = new Map<string, string[]>();
  const suffixPattern = /_(NICE|PARIS|ROME|OLD|NEW|2|II|JR|SR|FAMILY|THE|DE|VON|VAN)$/i;

  for (const id of allIds) {
    // Remove common suffixes to find base name
    let baseName = id.replace(suffixPattern, '');
    // Also try removing trailing numbers
    baseName = baseName.replace(/_\d+$/, '');

    if (!baseNameGroups.has(baseName)) {
      baseNameGroups.set(baseName, []);
    }
    baseNameGroups.get(baseName)!.push(id);
  }

  // Find groups with multiple entries
  for (const [baseName, ids] of baseNameGroups) {
    if (ids.length > 1) {
      candidates.push({
        ids: ids.sort(),
        reason: `Same base name: ${baseName}`,
        referencesCounts: ids.map((id) => refCounts.get(id) || 0),
      });
    }
  }

  // Find similar names (Levenshtein distance <= 2)
  const checked = new Set<string>();
  for (let i = 0; i < allIds.length; i++) {
    for (let j = i + 1; j < allIds.length; j++) {
      const id1 = allIds[i];
      const id2 = allIds[j];
      const key = [id1, id2].sort().join('|');

      if (checked.has(key)) continue;
      checked.add(key);

      // Skip if already in a base name group
      const alreadyGrouped = candidates.some(
        (c) => c.ids.includes(id1) && c.ids.includes(id2)
      );
      if (alreadyGrouped) continue;

      const distance = levenshteinDistance(id1, id2);
      if (distance <= 2 && distance > 0) {
        candidates.push({
          ids: [id1, id2].sort(),
          reason: `Similar names (distance: ${distance})`,
          referencesCounts: [refCounts.get(id1) || 0, refCounts.get(id2) || 0],
        });
      }
    }
  }

  // Sort by total references (most referenced first)
  candidates.sort((a, b) => {
    const totalA = a.referencesCounts.reduce((sum, n) => sum + n, 0);
    const totalB = b.referencesCounts.reduce((sum, n) => sum + n, 0);
    return totalB - totalA;
  });

  return candidates;
}

/**
 * Process batch merge from file
 */
async function batchMerge(
  filePath: string,
  options: CliOptions
): Promise<{ total: number; success: number; failed: number }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let total = 0;
  let success = 0;
  let failed = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      console.error(`Invalid line (need SOURCE TARGET): ${line}`);
      failed++;
      continue;
    }

    const [source, target] = parts;
    total++;

    console.log(`\n[${total}] Merging ${source} → ${target}`);

    const result = await mergeGlossaryEntries(source, target, options);

    if (result.errors.length > 0) {
      console.error(`  Errors: ${result.errors.join(', ')}`);
      failed++;
    } else {
      console.log(
        `  Updated ${result.filesUpdated} files, ${result.linksUpdated} links, ${result.frontmatterUpdated} frontmatter entries`
      );
      success++;
    }
  }

  return { total, success, failed };
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (!options.command) {
    showHelp();
    process.exit(1);
  }

  switch (options.command) {
    case 'merge': {
      const [source, target] = options.args;

      if (!source || !target) {
        console.error('Error: Please provide source and target IDs');
        console.error('Usage: npx tsx scripts/glossary-merge.ts merge <source> <target>');
        process.exit(1);
      }

      if (options.dryRun) {
        console.log('=== DRY RUN (no changes will be made) ===\n');
      }

      const result = await mergeGlossaryEntries(source, target, options);

      console.log('\n=== Merge Summary ===');
      console.log(`Files updated:        ${result.filesUpdated}`);
      console.log(`Links updated:        ${result.linksUpdated}`);
      console.log(`Frontmatter updated:  ${result.frontmatterUpdated}`);
      console.log(`Glossary merged:      ${result.glossaryMerged ? 'Yes' : 'No'}`);
      console.log(`Source deleted:       ${result.sourceDeleted ? 'Yes' : 'No'}`);

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        for (const error of result.errors) {
          console.log(`  - ${error}`);
        }
        process.exit(1);
      }

      break;
    }

    case 'find-duplicates': {
      console.log('=== Scanning for potential duplicates ===\n');

      const candidates = findDuplicates(options.verbose);

      if (candidates.length === 0) {
        console.log('No potential duplicates found.');
      } else {
        console.log(`Found ${candidates.length} potential duplicate groups:\n`);

        for (const candidate of candidates) {
          console.log(`${candidate.reason}:`);
          for (let i = 0; i < candidate.ids.length; i++) {
            const id = candidate.ids[i];
            const refs = candidate.referencesCounts[i];
            const status = refs === 0 ? ' [ORPHANED]' : '';
            console.log(`  - ${id} (${refs} refs)${status}`);
          }
          console.log();
        }

        console.log('To merge duplicates, use:');
        console.log('  npx tsx scripts/glossary-merge.ts merge SOURCE TARGET');
      }

      break;
    }

    case 'batch-merge': {
      const [filePath] = options.args;

      if (!filePath) {
        console.error('Error: Please provide a batch file path');
        console.error('Usage: npx tsx scripts/glossary-merge.ts batch-merge <file>');
        process.exit(1);
      }

      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }

      if (options.dryRun) {
        console.log('=== DRY RUN (no changes will be made) ===\n');
      }

      const result = await batchMerge(filePath, options);

      console.log('\n=== Batch Merge Summary ===');
      console.log(`Total:    ${result.total}`);
      console.log(`Success:  ${result.success}`);
      console.log(`Failed:   ${result.failed}`);

      if (result.failed > 0) {
        process.exit(1);
      }

      break;
    }

    default:
      console.error(`Unknown command: ${options.command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
