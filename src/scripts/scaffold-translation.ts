#!/usr/bin/env npx ts-node --esm
/**
 * Scaffold Translation Files
 *
 * Creates empty translation files from original French entries.
 * - Copies original text as comments
 * - Preserves RSR and LAN annotations
 * - Adds "TODO" placeholder for untranslated paragraphs
 *
 * Usage:
 *   npx ts-node --esm scripts/scaffold-translation.ts <carnet> [options]
 *
 * Examples:
 *   npx ts-node --esm scripts/scaffold-translation.ts 001
 *   npx ts-node --esm scripts/scaffold-translation.ts 001 --dry-run
 *   npx ts-node --esm scripts/scaffold-translation.ts 001 --overwrite
 *   npx ts-node --esm scripts/scaffold-translation.ts 001 --lang en
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
  TranslationScaffold,
  createDefaultScaffoldOptions,
  type ScaffoldOptions,
  type ScaffoldCarnetResult,
} from '../shared/dist/utils/index.js';

interface CliOptions {
  carnetId: string;
  targetLanguage: string;
  overwrite: boolean;
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
    overwrite: false,
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
      case '--overwrite':
      case '-o':
        options.overwrite = true;
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
Scaffold Translation Files

Creates empty translation files from original French entries with TODO placeholders.

Usage:
  npx ts-node --esm scripts/scaffold-translation.ts <carnet> [options]

Arguments:
  <carnet>    Carnet ID (e.g., 001, 02, 100)

Options:
  -l, --lang <code>   Target language code (default: cz)
  -o, --overwrite     Overwrite existing files (preserves translations)
  -n, --dry-run       Preview changes without writing files
  -v, --verbose       Show detailed output
  -h, --help          Show this help message

Examples:
  # Scaffold Czech translation for carnet 001
  npx ts-node --esm scripts/scaffold-translation.ts 001

  # Preview what would be created
  npx ts-node --esm scripts/scaffold-translation.ts 001 --dry-run

  # Update existing files with new annotations
  npx ts-node --esm scripts/scaffold-translation.ts 001 --overwrite

  # Scaffold English translation
  npx ts-node --esm scripts/scaffold-translation.ts 001 --lang en
`);
}

function printResult(result: ScaffoldCarnetResult, options: CliOptions): void {
  console.log(`\n=== Scaffold Results for Carnet ${result.carnetId} ===\n`);

  if (options.dryRun) {
    console.log('(DRY RUN - no files were written)\n');
  }

  // Summary
  console.log(`Created: ${result.totalCreated} files`);
  console.log(`Skipped: ${result.totalSkipped} files`);

  if (result.errors.length > 0) {
    console.log(`\nErrors:`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  // Detailed output if verbose
  if (options.verbose) {
    console.log(`\nDetails:`);
    for (const entry of result.entries) {
      const status = entry.created ? '✓' : entry.skipped ? '⊘' : '?';
      const filename = path.basename(entry.translationPath);
      const stats = `(${entry.paragraphsPreserved} preserved, ${entry.paragraphsWithTodo} TODO)`;

      console.log(`  ${status} ${filename} ${stats}`);
      if (entry.reason && !entry.reason.includes('already exists')) {
        console.log(`    └─ ${entry.reason}`);
      }
    }
  }

  // Statistics
  let totalTodo = 0;
  let totalPreserved = 0;
  let totalParagraphs = 0;
  for (const entry of result.entries) {
    totalTodo += entry.paragraphsWithTodo;
    totalPreserved += entry.paragraphsPreserved;
    totalParagraphs += entry.paragraphsTotal;
  }

  console.log(`\nParagraph Statistics:`);
  console.log(`  Total paragraphs: ${totalParagraphs}`);
  console.log(`  Already translated: ${totalPreserved}`);
  console.log(`  Need translation (TODO): ${totalTodo}`);
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

  console.log(`Scaffolding translations for carnet ${cliOptions.carnetId}`);
  console.log(`  Original: ${originalDir}`);
  console.log(`  Target:   ${translationDir}`);
  console.log(`  Language: ${cliOptions.targetLanguage}`);

  // Create scaffold options
  const scaffoldOptions: ScaffoldOptions = {
    ...createDefaultScaffoldOptions(),
    targetLanguage: cliOptions.targetLanguage,
    overwrite: cliOptions.overwrite,
    dryRun: cliOptions.dryRun,
    verbose: cliOptions.verbose,
  };

  // Run scaffold
  const scaffold = new TranslationScaffold();
  const result = scaffold.scaffoldCarnet(originalDir, translationDir, scaffoldOptions);

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
