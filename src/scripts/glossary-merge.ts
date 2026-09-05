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
import { execFileSync } from 'node:child_process';
import { GlossaryReferences } from '../shared/src/utils/glossary-references.js';
import {
  levenshteinDistance,
  mergeGlossaryEntries,
  type MergeResult,
} from '../shared/src/utils/glossary-merge.js';

const BASE_PATH = process.cwd();

interface CliOptions {
  command: string;
  args: string[];
  dryRun: boolean;
  verbose: boolean;
  deleteSource: boolean;
  simple: boolean;
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
    simple: false,
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
    } else if (arg === '--simple') {
      options.simple = true;
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
  --simple                 Use mechanical append instead of AI-powered merge
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
 * Use Claude to intelligently merge two glossary entries into one coherent document.
 * Claude receives both files' content and returns the merged result as stdout.
 * No tools or write permissions needed — the script controls all file I/O.
 */
function smartMergeGlossaryContent(
  sourceId: string,
  sourceContent: string,
  targetId: string,
  targetContent: string,
  verbose: boolean
): string | null {
  const prompt = `You are merging two glossary entries about the same entity in the Marie Bashkirtseff diary project.

TARGET entry (${targetId}) — this is the primary entry to keep:
---
${targetContent}
---

SOURCE entry (${sourceId}) — this will be merged into the target and deleted:
---
${sourceContent}
---

Produce a single merged glossary entry that:
1. Uses the TARGET's frontmatter (id, name, type, category) as the base
2. Combines all unique information from both entries — do NOT lose any facts, dates, or details
3. Eliminates redundant/duplicate content
4. Maintains coherent structure with clear sections
5. Preserves all RSR/research comments (with timestamps) from both entries
6. Updates last_updated to today's date
7. Sets research_status based on combined content quality

Output ONLY the merged markdown file content, nothing else. No explanation, no code fences.`;

  try {
    if (verbose) {
      console.log(`  Invoking Claude to merge glossary content...`);
    }

    // Prompt goes on stdin: glossary bodies contain backticks and $(…) that a
    // shell command line would expand.
    const result = execFileSync(
      'claude',
      ['-p', '--permission-mode', 'bypassPermissions'],
      {
        input: prompt,
        encoding: 'utf-8',
        maxBuffer: 16 * 1024 * 1024,
        timeout: 60_000,
        cwd: BASE_PATH,
      }
    );

    const trimmed = result.trim();
    if (!trimmed || trimmed.length < 50) {
      console.error(`  Warning: Claude returned unexpectedly short content (${trimmed.length} chars)`);
      return null;
    }

    return trimmed + '\n';
  } catch (e) {
    if (verbose) {
      console.error(`  Claude merge failed: ${e}`);
    }
    return null;
  }
}

function runMerge(source: string, target: string, options: CliOptions): Promise<MergeResult> {
  return mergeGlossaryEntries(BASE_PATH, source, target, {
    dryRun: options.dryRun,
    verbose: options.verbose,
    deleteSource: options.deleteSource,
    smartMerge: options.simple
      ? undefined
      : (sourceId, sourceContent, targetId, targetContent) => {
          const merged = smartMergeGlossaryContent(
            sourceId,
            sourceContent,
            targetId,
            targetContent,
            options.verbose
          );
          if (!merged) console.log('  Warning: AI merge failed, falling back to simple append');
          return merged;
        },
  });
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

    const result = await runMerge(source, target, options);

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

      const result = await runMerge(source, target, options);

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
