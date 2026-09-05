#!/usr/bin/env npx tsx

/**
 * Glossary Move CLI
 *
 * Move a glossary entry to a new category and update all references
 * across the entire content/ directory (originals + all translations).
 *
 * Usage:
 *   npx tsx src/scripts/glossary-move.ts <ID> <new_category>
 *   npx tsx src/scripts/glossary-move.ts BARBIER_DE_SEVILLE culture/opera
 *   npx tsx src/scripts/glossary-move.ts --dry-run WALITSKY people/recurring
 *
 * Options:
 *   --dry-run    Show what would be done without making changes
 *   --help       Show this help message
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { writeFileAtomic } from './lib/atomic-write.js';
import { rewriteGlossaryLinks } from '../shared/src/utils/glossary-links.js';
import { getAllContentFiles } from '../shared/src/utils/glossary-merge.js';

const BASE_PATH = process.cwd();
const GLOSSARY_BASE = path.join(BASE_PATH, 'content/_original/_glossary');

interface MoveResult {
  id: string;
  oldPath: string;
  newPath: string;
  filesUpdated: number;
  refsUpdated: number;
  details: Array<{ file: string; count: number }>;
}

function showHelp(): void {
  console.log(`
Glossary Move CLI

Move a glossary entry to a new category and update all references.

Usage:
  just glossary-move <ID> <new_category>

Arguments:
  ID             Glossary entry ID (e.g., BARBIER_DE_SEVILLE)
  new_category   Target category path (e.g., culture/opera, people/mentioned)

Options:
  --dry-run      Show what would be done without making changes
  --help, -h     Show this help message

Examples:
  just glossary-move BARBIER_DE_SEVILLE culture/opera
  just glossary-move WALITSKY people/recurring
  just glossary-move --dry-run RUSSIA places/countries
`);
}

/**
 * Find a glossary file by ID anywhere in the glossary tree
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
 * Move a glossary entry and update all references
 */
function moveGlossaryEntry(id: string, newCategory: string, dryRun: boolean): MoveResult | null {
  // 1. Find current location
  const currentPath = findGlossaryFile(id);
  if (!currentPath) {
    console.error(`Error: Glossary file for ${id} not found`);
    process.exitCode = 1;
    return null;
  }

  const oldRelative = path.relative(GLOSSARY_BASE, currentPath);
  const newRelative = path.join(newCategory, `${id}.md`);

  if (oldRelative === newRelative) {
    console.log(`${id} is already at ${newCategory}/. Nothing to do.`);
    return null;
  }

  const newFullPath = path.join(GLOSSARY_BASE, newRelative);
  if (fs.existsSync(newFullPath)) {
    console.error(`Error: destination already exists: _glossary/${newRelative}`);
    process.exitCode = 1;
    return null;
  }

  console.log(`\nMoving ${id}:`);
  console.log(`  From: _glossary/${oldRelative}`);
  console.log(`  To:   _glossary/${newRelative}`);
  console.log();

  // 2. Compute every rewrite before the entry moves, so a file we cannot read
  //    aborts the move instead of leaving half the references dangling.
  const oldTarget = path.resolve(currentPath);
  const newTarget = path.resolve(newFullPath);
  const contentFiles = getAllContentFiles(BASE_PATH);

  const pending: Array<{ file: string; writeTo: string; content: string; count: number }> = [];
  const failures: string[] = [];

  const newDir = path.dirname(newFullPath);

  for (const file of contentFiles) {
    let content: string;
    try {
      content = fs.readFileSync(file, 'utf-8');
    } catch (e) {
      failures.push(`${path.relative(BASE_PATH, file)}: ${e}`);
      continue;
    }

    // The entry's own outgoing links are relative to its directory, so they are
    // regenerated from the destination.
    const isEntry = path.resolve(file) === oldTarget;

    const rewritten = rewriteGlossaryLinks(
      content,
      path.dirname(file),
      GLOSSARY_BASE,
      (target) => {
        if (target === oldTarget) return { path: newTarget };
        return isEntry ? { path: target } : null;
      },
      isEntry ? newDir : undefined
    );

    if (rewritten.count > 0) {
      // The entry itself is written at its destination: by then it has moved.
      pending.push({
        file,
        writeTo: isEntry ? newFullPath : file,
        content: rewritten.content,
        count: rewritten.count,
      });
    }
  }

  if (failures.length > 0) {
    console.error(`Error: ${failures.length} file(s) could not be read; nothing was changed:`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exitCode = 1;
    return null;
  }

  const result: MoveResult = {
    id,
    oldPath: oldRelative,
    newPath: newRelative,
    filesUpdated: pending.length,
    refsUpdated: pending.reduce((sum, p) => sum + p.count, 0),
    details: pending.map((p) => ({ file: path.relative(BASE_PATH, p.file), count: p.count })),
  };

  // 3. Move the entry first: a failed mkdir/rename must not leave the references
  //    already rewritten to a path nothing lives at.
  if (!dryRun) {
    fs.mkdirSync(newDir, { recursive: true });
    fs.renameSync(currentPath, newFullPath);
  }

  // 4. Apply the rewrites
  for (const p of pending) {
    const relFile = path.relative(BASE_PATH, p.file);
    if (!dryRun) {
      writeFileAtomic(p.writeTo, p.content);
    }
    console.log(`  ${dryRun ? 'Would update' : 'Updated'}: ${relFile} (${p.count} ref${p.count > 1 ? 's' : ''})`);
  }

  if (!dryRun) {
    // 5. Clean up empty source directory
    const oldDir = path.dirname(currentPath);
    try {
      const remaining = fs.readdirSync(oldDir);
      if (remaining.length === 0) {
        fs.rmdirSync(oldDir);
        console.log(`  Removed empty directory: ${path.relative(GLOSSARY_BASE, oldDir)}/`);
      }
    } catch { /* ignore */ }
  }

  return result;
}

// Main
function main(): void {
  const args = process.argv.slice(2);
  let dryRun = false;
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    console.error('Error: Please provide ID and new_category');
    console.error('Usage: just glossary-move <ID> <new_category>');
    process.exit(1);
  }

  const id = positional[0].toUpperCase();
  const newCategory = positional[1];

  if (dryRun) {
    console.log('=== DRY RUN (no changes will be made) ===');
  }

  const result = moveGlossaryEntry(id, newCategory, dryRun);

  if (result) {
    console.log();
    console.log(`Summary: ${result.filesUpdated} file${result.filesUpdated !== 1 ? 's' : ''} updated, ${result.refsUpdated} reference${result.refsUpdated !== 1 ? 's' : ''} changed`);

    if (dryRun) {
      console.log('\nRun without --dry-run to apply changes.');
    }
  }
}

main();
