#!/usr/bin/env npx tsx

/**
 * Glossary References CLI
 *
 * Find where glossary entries are referenced in diary entries.
 * Identify orphaned entries, search by pattern, and generate reports.
 *
 * Usage:
 *   npx tsx scripts/glossary-refs.ts <command> [options]
 *
 * Commands:
 *   find <id>           Find all references to a glossary entry
 *   orphaned            List glossary entries with no references
 *   missing             List referenced entries that don't exist
 *   stats               Show usage statistics
 *   search <pattern>    Search glossary entries by pattern
 *   report <id>         Generate detailed report for an entry
 */

import * as path from 'node:path';

// Import from shared package (relative import for scripts)
import { GlossaryReferences } from '../shared/src/utils/glossary-references.js';

const BASE_PATH = process.cwd();

interface CliOptions {
  command: string;
  args: string[];
  json: boolean;
  limit: number;
  verbose: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    command: '',
    args: [],
    json: false,
    limit: 50,
    verbose: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--limit') {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
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
Glossary References CLI

Find where glossary entries are referenced in diary entries.

Usage:
  npx tsx scripts/glossary-refs.ts <command> [options]

Commands:
  find <id>           Find all diary entries referencing a glossary entry
  orphaned            List glossary entries with no references
  missing             List referenced entries that don't exist (broken links)
  stats               Show usage statistics (top referenced, orphaned count)
  search <pattern>    Search glossary entries by regex pattern
  report <id>         Generate detailed report for an entry

Options:
  --json              Output results as JSON
  --limit <n>         Limit results (default: 50)
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  # Find all entries referencing DINA
  npx tsx scripts/glossary-refs.ts find DINA

  # List orphaned entries
  npx tsx scripts/glossary-refs.ts orphaned

  # Search for all entries containing "PAUL"
  npx tsx scripts/glossary-refs.ts search PAUL

  # Get usage statistics as JSON
  npx tsx scripts/glossary-refs.ts stats --json

  # Generate report for a specific entry
  npx tsx scripts/glossary-refs.ts report DUKE_OF_HAMILTON
`);
}

function formatDate(dateStr: string): string {
  return dateStr;
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (!options.command) {
    showHelp();
    process.exit(1);
  }

  const refs = new GlossaryReferences(BASE_PATH);

  switch (options.command) {
    case 'find': {
      const id = options.args[0];
      if (!id) {
        console.error('Error: Please provide a glossary ID');
        console.error('Usage: npx tsx scripts/glossary-refs.ts find <id>');
        process.exit(1);
      }

      const references = refs.findReferences(id.toUpperCase());

      if (options.json) {
        console.log(JSON.stringify(references, null, 2));
      } else {
        console.log(`\n=== References to ${id.toUpperCase()} ===\n`);
        console.log(`Found ${references.length} diary entries\n`);

        if (references.length === 0) {
          console.log('No references found. This entry may be orphaned.');
          const glossaryPath = refs.getGlossaryPath(id.toUpperCase());
          if (!glossaryPath) {
            console.log('Note: This glossary entry does not exist.');
          }
        } else {
          // Group by carnet
          const byCarnet = new Map<string, typeof references>();
          for (const ref of references) {
            if (!byCarnet.has(ref.carnet)) {
              byCarnet.set(ref.carnet, []);
            }
            byCarnet.get(ref.carnet)!.push(ref);
          }

          for (const [carnet, carnetRefs] of [...byCarnet.entries()].sort()) {
            console.log(`Carnet ${carnet}:`);
            for (const ref of carnetRefs.slice(0, options.limit).sort((a, b) => a.date.localeCompare(b.date))) {
              const lines = ref.lineNumbers.join(', ');
              console.log(`  ${ref.date}  (line ${lines})  "${ref.displayText}"`);
            }
          }
        }
      }
      break;
    }

    case 'orphaned': {
      const orphaned = refs.findOrphaned();

      if (options.json) {
        console.log(JSON.stringify(orphaned, null, 2));
      } else {
        console.log(`\n=== Orphaned Glossary Entries ===\n`);
        console.log(`Found ${orphaned.length} entries with no references\n`);

        if (orphaned.length === 0) {
          console.log('All glossary entries are referenced!');
        } else {
          // Group by category
          const byCategory = new Map<string, string[]>();

          for (const id of orphaned.slice(0, options.limit)) {
            const filePath = refs.getGlossaryPath(id);
            let category = 'unknown';
            if (filePath) {
              const relativePath = path.relative(
                path.join(BASE_PATH, 'src/_original/_glossary'),
                filePath
              );
              category = path.dirname(relativePath);
            }

            if (!byCategory.has(category)) {
              byCategory.set(category, []);
            }
            byCategory.get(category)!.push(id);
          }

          for (const [category, ids] of [...byCategory.entries()].sort()) {
            console.log(`${category}/ (${ids.length})`);
            for (const id of ids.sort()) {
              console.log(`  - ${id}`);
            }
            console.log();
          }

          if (orphaned.length > options.limit) {
            console.log(`... and ${orphaned.length - options.limit} more (use --limit to show more)`);
          }
        }
      }
      break;
    }

    case 'missing': {
      const missing = refs.findMissing();

      if (options.json) {
        console.log(JSON.stringify(missing, null, 2));
      } else {
        console.log(`\n=== Missing Glossary Entries ===\n`);
        console.log(`Found ${missing.length} referenced entries that don't exist\n`);

        if (missing.length === 0) {
          console.log('All referenced entries exist!');
        } else {
          for (const id of missing.slice(0, options.limit).sort()) {
            const references = refs.findReferences(id);
            console.log(`${id} (referenced ${references.length} times)`);
            if (options.verbose) {
              for (const ref of references.slice(0, 3)) {
                console.log(`  - ${ref.entryPath}`);
              }
              if (references.length > 3) {
                console.log(`  ... and ${references.length - 3} more`);
              }
            }
          }

          if (missing.length > options.limit) {
            console.log(`\n... and ${missing.length - options.limit} more`);
          }
        }
      }
      break;
    }

    case 'stats': {
      const stats = refs.getUsageStats();

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(`\n=== Glossary Usage Statistics ===\n`);
        console.log(`Total glossary entries:     ${stats.totalGlossaryEntries}`);
        console.log(`Referenced entries:         ${stats.referencedEntries}`);
        console.log(`Orphaned entries:           ${stats.orphanedEntries}`);
        console.log(`Total references:           ${stats.totalReferences}`);
        console.log(`Avg refs per entry:         ${stats.averageReferencesPerEntry.toFixed(1)}`);
        console.log();
        console.log(`Top referenced entries:`);
        for (const entry of stats.topReferenced.slice(0, 20)) {
          console.log(`  ${entry.id.padEnd(30)} ${entry.count} refs`);
        }
      }
      break;
    }

    case 'search': {
      const pattern = options.args[0];
      if (!pattern) {
        console.error('Error: Please provide a search pattern');
        console.error('Usage: npx tsx scripts/glossary-refs.ts search <pattern>');
        process.exit(1);
      }

      const matches = refs.searchEntries(pattern);

      if (options.json) {
        console.log(JSON.stringify(matches.slice(0, options.limit), null, 2));
      } else {
        console.log(`\n=== Search Results for "${pattern}" ===\n`);
        console.log(`Found ${matches.length} matching entries\n`);

        for (const match of matches.slice(0, options.limit)) {
          const status = match.referenceCount === 0 ? '[ORPHANED]' : '';
          console.log(`${match.id.padEnd(35)} ${match.referenceCount} refs ${status}`);
        }

        if (matches.length > options.limit) {
          console.log(`\n... and ${matches.length - options.limit} more (use --limit to show more)`);
        }
      }
      break;
    }

    case 'report': {
      const id = options.args[0];
      if (!id) {
        console.error('Error: Please provide a glossary ID');
        console.error('Usage: npx tsx scripts/glossary-refs.ts report <id>');
        process.exit(1);
      }

      const report = refs.generateEntryReport(id.toUpperCase());
      console.log(report);
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
