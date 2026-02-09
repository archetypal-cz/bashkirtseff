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

const BASE_PATH = process.cwd();
const GLOSSARY_BASE = path.join(BASE_PATH, 'content/_original/_glossary');
const CONTENT_BASE = path.join(BASE_PATH, 'content');

// Pattern matching glossary links: [#Name](../_glossary/category/FILE.md)
const GLOSSARY_LINK_PATTERN = /\[([^\]]*)\]\(\.\.\/_glossary\/([^)]+\.md)\)/g;

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
 * Get all content files (originals + all translations) that may contain glossary links
 */
function getAllContentFiles(): string[] {
  const files: string[] = [];

  const walkDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        // Skip _glossary, _carnets, _summary, _workflow, _archive, node_modules
        if (item.name.startsWith('_') || item.name === 'node_modules') continue;
        walkDir(fullPath);
      } else if (item.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  };

  // Scan all language directories: _original, cz, en, uk, fr
  const langDirs = ['_original', 'cz', 'en', 'uk', 'fr'];
  for (const lang of langDirs) {
    const langDir = path.join(CONTENT_BASE, lang);
    if (!fs.existsSync(langDir)) continue;

    const items = fs.readdirSync(langDir, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory()) continue;
      // Skip special directories
      if (item.name.startsWith('_')) continue;

      const carnetDir = path.join(langDir, item.name);
      const carnetFiles = fs.readdirSync(carnetDir)
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(carnetDir, f));
      files.push(...carnetFiles);
    }
  }

  return files.sort();
}

/**
 * Move a glossary entry and update all references
 */
function moveGlossaryEntry(id: string, newCategory: string, dryRun: boolean): MoveResult | null {
  // 1. Find current location
  const currentPath = findGlossaryFile(id);
  if (!currentPath) {
    console.error(`Error: Glossary file for ${id} not found`);
    return null;
  }

  const oldRelative = path.relative(GLOSSARY_BASE, currentPath);
  const newRelative = path.join(newCategory, `${id}.md`);

  if (oldRelative === newRelative) {
    console.log(`${id} is already at ${newCategory}/. Nothing to do.`);
    return null;
  }

  const newFullPath = path.join(GLOSSARY_BASE, newRelative);

  console.log(`\nMoving ${id}:`);
  console.log(`  From: _glossary/${oldRelative}`);
  console.log(`  To:   _glossary/${newRelative}`);
  console.log();

  // 2. Move the file
  if (!dryRun) {
    const newDir = path.dirname(newFullPath);
    fs.mkdirSync(newDir, { recursive: true });
    fs.renameSync(currentPath, newFullPath);
  }

  // 3. Find and update all references
  const contentFiles = getAllContentFiles();
  const result: MoveResult = {
    id,
    oldPath: oldRelative,
    newPath: newRelative,
    filesUpdated: 0,
    refsUpdated: 0,
    details: [],
  };

  for (const file of contentFiles) {
    try {
      let content = fs.readFileSync(file, 'utf-8');
      const originalContent = content;
      let count = 0;

      // Replace old path with new path in glossary links
      content = content.replace(GLOSSARY_LINK_PATTERN, (match, displayText, linkPath) => {
        if (linkPath === oldRelative) {
          count++;
          return `[${displayText}](../_glossary/${newRelative})`;
        }
        return match;
      });

      if (content !== originalContent) {
        const relFile = path.relative(BASE_PATH, file);
        result.filesUpdated++;
        result.refsUpdated += count;
        result.details.push({ file: relFile, count });

        if (!dryRun) {
          fs.writeFileSync(file, content, 'utf-8');
        }
        console.log(`  ${dryRun ? 'Would update' : 'Updated'}: ${relFile} (${count} ref${count > 1 ? 's' : ''})`);
      }
    } catch (e) {
      console.error(`  Error processing ${file}:`, e);
    }
  }

  // 4. Clean up empty source directory
  if (!dryRun) {
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
