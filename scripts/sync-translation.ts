#!/usr/bin/env npx ts-node --esm
/**
 * Sync Translation Files
 *
 * Updates existing translation files with changes from originals:
 * - Syncs RSR and LAN annotations
 * - Syncs glossary links
 * - Syncs footnotes (definitions and references)
 * - Syncs metadata (location, etc.)
 *
 * Does NOT overwrite:
 * - Existing translations
 * - Translation-specific notes (TR, RED, CON, GEM)
 * - Already translated footnotes
 *
 * Usage:
 *   npx ts-node --esm scripts/sync-translation.ts <carnet> [options]
 *
 * Examples:
 *   npx ts-node --esm scripts/sync-translation.ts 001
 *   npx ts-node --esm scripts/sync-translation.ts 001 --dry-run
 *   npx ts-node --esm scripts/sync-translation.ts 001 --lang en
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import from shared package (assumes built)
import {
  EntrySync,
  createDefaultSyncOptions,
  type SyncOptions,
  type CarnetSyncResult,
} from '../shared/dist/utils/index.js';

interface CliOptions {
  carnetId: string;
  targetLanguage: string;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CliOptions | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return null;
  }

  const options: CliOptions = {
    carnetId: args[0],
    targetLanguage: 'cz',
    dryRun: false,
    verbose: false,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--lang':
      case '-l':
        options.targetLanguage = args[++i] || 'cz';
        break;
      case '--dry-run':
      case '-n':
        options.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Sync Translation Files

Updates existing translation files with changes from originals.
Preserves existing translations while syncing annotations and footnotes.

Usage:
  npx ts-node --esm scripts/sync-translation.ts <carnet> [options]

Arguments:
  <carnet>    Carnet ID (e.g., 001, 02, 100)

Options:
  -l, --lang <code>   Target language code (default: cz)
  -n, --dry-run       Preview changes without writing files
  -v, --verbose       Show detailed output
  -h, --help          Show this help message

What gets synced:
  - RSR and LAN annotations (research/linguistic notes)
  - Glossary links (paths updated if changed)
  - Footnotes (definitions added, refs inserted at paragraph end)
  - Metadata (location, entry-level glossary links)

What is preserved:
  - Existing translations (never overwritten)
  - Translation-specific notes (TR, RED, CON, GEM)
  - Already translated footnotes

Examples:
  # Sync Czech translations for carnet 001
  npx ts-node --esm scripts/sync-translation.ts 001

  # Preview changes
  npx ts-node --esm scripts/sync-translation.ts 001 --dry-run --verbose

  # Sync English translations
  npx ts-node --esm scripts/sync-translation.ts 001 --lang en
`);
}

function printResult(result: CarnetSyncResult, options: CliOptions): void {
  console.log(`\n=== Sync Results for Carnet ${result.carnetId} ===\n`);

  if (options.dryRun) {
    console.log('(DRY RUN - no files were written)\n');
  }

  // Summary
  console.log(`Modified: ${result.entriesModified} files`);
  console.log(`Skipped:  ${result.entriesSkipped} files (no changes needed)`);
  console.log(`Total changes: ${result.totalChanges}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors:`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  // Detailed output if verbose
  if (options.verbose && result.totalChanges > 0) {
    console.log(`\nChanges by entry:`);
    for (const entry of result.entries) {
      if (entry.changes.length === 0) continue;

      const filename = path.basename(entry.translationPath);
      const status = entry.written ? '✓' : (options.dryRun ? '?' : '✗');
      console.log(`\n  ${status} ${filename} (${entry.changes.length} changes)`);

      for (const change of entry.changes) {
        const paraInfo = change.paragraphId ? ` in ${change.paragraphId}` : '';
        console.log(`    - ${change.type}${paraInfo}: ${change.description}`);
      }
    }
  }

  // Change type breakdown
  if (result.totalChanges > 0) {
    const changeTypes = new Map<string, number>();
    for (const entry of result.entries) {
      for (const change of entry.changes) {
        changeTypes.set(change.type, (changeTypes.get(change.type) || 0) + 1);
      }
    }

    console.log(`\nChange breakdown:`);
    for (const [type, count] of changeTypes) {
      console.log(`  ${type}: ${count}`);
    }
  }
}

async function main(): Promise<void> {
  const cliOptions = parseArgs();
  if (!cliOptions) {
    process.exit(0);
  }

  // Resolve paths
  const originalDir = path.join(projectRoot, 'src', '_original', cliOptions.carnetId);
  const translationDir = path.join(projectRoot, 'src', cliOptions.targetLanguage, cliOptions.carnetId);

  // Check if original exists
  if (!fs.existsSync(originalDir)) {
    console.error(`Error: Original directory not found: ${originalDir}`);
    process.exit(1);
  }

  // Check if translation directory exists
  if (!fs.existsSync(translationDir)) {
    console.error(`Error: Translation directory not found: ${translationDir}`);
    console.error(`Use scaffold-translation.ts first to create the translation files.`);
    process.exit(1);
  }

  console.log(`Syncing translations for carnet ${cliOptions.carnetId}`);
  console.log(`  Original: ${originalDir}`);
  console.log(`  Target:   ${translationDir}`);
  console.log(`  Language: ${cliOptions.targetLanguage}`);

  // Create sync options
  const syncOptions: SyncOptions = {
    ...createDefaultSyncOptions(),
    dryRun: cliOptions.dryRun,
    verbose: cliOptions.verbose,
  };

  // Run sync
  const sync = new EntrySync();
  const result = sync.syncCarnet(originalDir, translationDir, syncOptions);

  // Print results
  printResult(result, cliOptions);

  // Exit with error code if there were errors
  if (result.errors.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
