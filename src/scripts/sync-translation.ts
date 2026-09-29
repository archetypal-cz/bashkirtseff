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
const projectRoot = path.resolve(__dirname, '../..');

import {
  EntrySync,
  createDefaultSyncOptions,
  type SyncOptions,
  type CarnetSyncResult,
} from '../shared/src/utils/index.js';
import { normalizeCarnet } from './lib/carnet.js';

interface CliOptions {
  carnetId: string;
  targetLanguage: string;
  dryRun: boolean;
  verbose: boolean;
  tags: boolean;
  notes: boolean;
  notesSince?: string;
  footnotes: boolean;
}

function parseArgs(): CliOptions | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return null;
  }

  let carnetId: string;
  try {
    carnetId = normalizeCarnet(args[0]);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
  }

  const options: CliOptions = {
    carnetId,
    targetLanguage: 'cz',
    dryRun: false,
    verbose: false,
    tags: false,
    notes: false,
    footnotes: false,
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
      case '--tags':
        options.tags = true;
        break;
      case '--notes':
        options.notes = true;
        break;
      case '--notes-since':
        options.notes = true;
        options.notesSince = args[++i];
        if (!/^\d{4}-\d{2}-\d{2}/.test(options.notesSince || '')) {
          console.error('--notes-since needs a date: YYYY-MM-DD[Thh:mm:ss]');
          process.exit(2);
        }
        break;
      case '--footnotes':
        options.footnotes = true;
        break;
      case '--all':
        options.tags = options.notes = options.footnotes = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(2);
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Sync Translation Files

Carries changes from content/_original into existing translation files,
patching only the lines that change (no re-rendering: order, blank lines and
line shapes stay as they are). Always synced:
  - paragraphs new in the source (inserted as TODO stubs)
  - the kind marker
  - the embedded French copy, where its text differs from the source
    (a missing heading copy is not a difference)

Usage:
  npx ts-node --esm scripts/sync-translation.ts <carnet> [options]

Arguments:
  <carnet>    Carnet ID, 1-3 digits (e.g., 001, 63, 106)

Options:
  -l, --lang <code>   Target language code (default: cz)
  -n, --dry-run       Preview changes without writing files
  -v, --verbose       Show detailed output
  --tags              Also add missing glossary tag lines / fix their paths
  --notes             Also add RSR/LAN notes missing in the translation
                      (trees such as en never carried LAN notes: this adds them all)
  --notes-since DATE  Only notes stamped at/after DATE (carry a source fix's notes)
  --footnotes         Also add footnotes absent from the translation
  --all               --tags --notes --footnotes
  -h, --help          Show this help message

Never touched: visible translation text (except an appended footnote marker
with --footnotes), TR/RED/CON/… notes, frontmatter, existing footnotes.

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
  const originalDir = path.join(projectRoot, 'content', '_original', cliOptions.carnetId);
  const translationDir = path.join(projectRoot, 'content', cliOptions.targetLanguage, cliOptions.carnetId);

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
    syncRoles: cliOptions.notes ? createDefaultSyncOptions().syncRoles : [],
    notesSince: cliOptions.notesSince,
    syncGlossaryLinks: cliOptions.tags,
    syncFootnotes: cliOptions.footnotes,
    syncMetadata: false,
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
