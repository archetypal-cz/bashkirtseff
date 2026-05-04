#!/usr/bin/env npx tsx
/**
 * Normalize all diary entries:
 * 1. Convert old [//]: # format to %% format
 * 2. Parse → renumber paragraphs → re-render
 * 3. Update para_start in frontmatter
 * 4. Write back normalized files
 *
 * Usage:
 *   npx tsx src/scripts/normalize-entries.ts --dry-run         # Preview changes
 *   npx tsx src/scripts/normalize-entries.ts --dry-run 001     # Preview one carnet
 *   npx tsx src/scripts/normalize-entries.ts                   # Apply to all
 *   npx tsx src/scripts/normalize-entries.ts 001               # Apply to one carnet
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ParagraphParser } from '../shared/src/parser/paragraph-parser.js';
import { ParagraphRenderer } from '../shared/src/renderer/paragraph-renderer.js';
import { parseFrontmatter, createFrontmatter, calculateMarieAge } from '../shared/src/parser/frontmatter.js';
import { renumberParagraphs } from '../shared/src/utils/validation.js';

const parser = new ParagraphParser();
const renderer = new ParagraphRenderer();
const CONTENT_DIR = path.resolve('content/_original');

// ── Old format conversion ──────────────────────────────────────────

/**
 * Convert old [//]: # format to %% format in raw text
 * Must happen BEFORE parsing since parser only handles %% format
 */
function convertOldFormat(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Convert old paragraph ID: [//]: # (10.2074) → %% 073.2074 %%
    // The old format uses 2-digit carnet numbers, we need the 3-digit from frontmatter
    const paraIdMatch = trimmed.match(/^\[\/\/\]: # \((\d+)\.(\d+)\)$/);
    if (paraIdMatch) {
      const oldCarnet = paraIdMatch[1];
      const paraNum = paraIdMatch[2];
      // We'll fix the carnet number during renumbering; for now preserve the old number
      // but convert to %% format
      result.push(`%% ${oldCarnet}.${paraNum} %%`);
      continue;
    }

    // Convert old glossary links: [//]: # ([#Name](path)) → %% [#Name](path) %%
    const glossaryMatch = trimmed.match(/^\[\/\/\]: # \((.+)\)$/);
    if (glossaryMatch) {
      const innerContent = glossaryMatch[1];
      // Check if it contains glossary links
      if (innerContent.includes('[#')) {
        result.push(`%% ${innerContent} %%`);
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

// ── Frontmatter handling ───────────────────────────────────────────

interface NormalizedFrontmatter {
  [key: string]: unknown;
}

function updateFrontmatter(
  metadata: Record<string, unknown>,
  paraStart: number,
  paraEnd: number,
  carnetId: string,
  date: string
): NormalizedFrontmatter {
  const updated = { ...metadata };

  // Update para_start and para_end
  updated.para_start = paraStart;
  updated.para_end = paraEnd;

  // Ensure carnet is quoted string
  updated.carnet = carnetId;

  // Calculate marie_age if date is available
  if (date) {
    const age = calculateMarieAge(date);
    if (age.years > 0) {
      updated.marie_age = age;
    }
  }

  return updated;
}

// ── Main normalization ─────────────────────────────────────────────

interface CarnetStats {
  carnetId: string;
  entries: number;
  paragraphsTotal: number;
  converted: number; // old format → new
  renumbered: number;
  errors: string[];
}

function normalizeCarnet(carnetId: string, dryRun: boolean): CarnetStats {
  const carnetDir = path.join(CONTENT_DIR, carnetId);
  const stats: CarnetStats = {
    carnetId,
    entries: 0,
    paragraphsTotal: 0,
    converted: 0,
    renumbered: 0,
    errors: [],
  };

  if (!fs.existsSync(carnetDir)) {
    stats.errors.push(`Directory not found: ${carnetDir}`);
    return stats;
  }

  // Get all entry files (exclude README, _summary)
  const files = fs.readdirSync(carnetDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('README') && !f.startsWith('_'))
    .sort();

  stats.entries = files.length;

  let nextParaNum = 1;

  for (const file of files) {
    const filePath = path.join(carnetDir, file);

    try {
      let rawContent = fs.readFileSync(filePath, 'utf-8');

      // Step 1: Convert old format if needed
      const isOldFormat = rawContent.includes('[//]: # (');
      if (isOldFormat) {
        rawContent = convertOldFormat(rawContent);
        stats.converted++;
      }

      // Step 2: Parse frontmatter and body separately
      const { metadata, content: bodyContent } = parseFrontmatter(rawContent);

      // Step 3: Write converted content to temp for parsing
      // (parser reads from file, so we need a temp file if format was converted)
      let parseContent = rawContent;
      if (isOldFormat) {
        // Write converted content temporarily
        fs.writeFileSync(filePath + '.tmp', rawContent, 'utf-8');
      }

      // Step 4: Parse the entry
      const entry = parser.parseFile(isOldFormat ? filePath + '.tmp' : filePath);

      // Clean up temp file
      if (isOldFormat && fs.existsSync(filePath + '.tmp')) {
        fs.unlinkSync(filePath + '.tmp');
      }

      // Step 5: Fix carnet numbers for old-format entries
      // Old format uses 2-digit carnet (e.g., "10" for carnet 073)
      for (const para of entry.paragraphs) {
        if (!para.isHeader && para.carnetNum !== carnetId) {
          para.carnetNum = carnetId;
        }
      }

      // Step 6: Renumber paragraphs (all paragraphs including headers get sequential IDs)
      const realParas = entry.paragraphs.filter(p => !p.id.startsWith('header_'));
      const paraStart = nextParaNum;

      renumberParagraphs(entry, nextParaNum);
      nextParaNum += realParas.length;

      const paraEnd = nextParaNum - 1;
      stats.paragraphsTotal += realParas.length;

      // Check if renumbering changed anything
      const oldParaStart = metadata.para_start as number | undefined;
      if (oldParaStart !== paraStart) {
        stats.renumbered++;
      }

      // Step 7: Update frontmatter
      const date = (metadata.date as string) || '';
      const updatedMetadata = updateFrontmatter(metadata, paraStart, paraEnd, carnetId, date);

      // Step 8: Re-render body
      const renderedBody = renderer.renderOriginalEntry(entry);

      // Step 9: Compose final file
      const frontmatterStr = createFrontmatter(updatedMetadata);
      const finalContent = frontmatterStr + '\n' + renderedBody + '\n';

      if (dryRun) {
        // In dry-run, just report what would change
        const currentContent = fs.readFileSync(filePath, 'utf-8');
        if (currentContent !== finalContent) {
          const currentLines = currentContent.split('\n').length;
          const newLines = finalContent.split('\n').length;
          if (isOldFormat || oldParaStart !== paraStart) {
            console.log(`  ${file}: would update (${currentLines} → ${newLines} lines, para ${oldParaStart || '?'} → ${paraStart})`);
          }
        }
      } else {
        // Write the normalized file
        fs.writeFileSync(filePath, finalContent, 'utf-8');
      }

    } catch (e: any) {
      stats.errors.push(`${file}: ${e.message}`);
    }
  }

  // Also handle _summary.md if it exists
  const summaryFile = path.join(carnetDir, '_summary.md');
  if (fs.existsSync(summaryFile)) {
    try {
      let rawContent = fs.readFileSync(summaryFile, 'utf-8');
      const isOldFormat = rawContent.includes('[//]: # (');
      if (isOldFormat) {
        rawContent = convertOldFormat(rawContent);
      }

      if (isOldFormat) {
        fs.writeFileSync(summaryFile + '.tmp', rawContent, 'utf-8');
      }

      const entry = parser.parseFile(isOldFormat ? summaryFile + '.tmp' : summaryFile);

      if (isOldFormat && fs.existsSync(summaryFile + '.tmp')) {
        fs.unlinkSync(summaryFile + '.tmp');
      }

      // Renumber summary paragraphs starting from 1
      renumberParagraphs(entry, 1);

      const { metadata } = parseFrontmatter(rawContent);
      const renderedBody = renderer.renderOriginalEntry(entry);

      if (!dryRun) {
        if (Object.keys(metadata).length > 0) {
          const frontmatterStr = createFrontmatter(metadata);
          fs.writeFileSync(summaryFile, frontmatterStr + '\n' + renderedBody + '\n', 'utf-8');
        } else {
          fs.writeFileSync(summaryFile, renderedBody + '\n', 'utf-8');
        }
      }
    } catch (e: any) {
      stats.errors.push(`_summary.md: ${e.message}`);
    }
  }

  return stats;
}

// ── CLI ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const specificCarnet = args.find(a => !a.startsWith('--'));

// Skip carnet 000 (special preface format)
let carnets: string[];
if (specificCarnet) {
  carnets = [specificCarnet];
} else {
  carnets = fs.readdirSync(CONTENT_DIR)
    .filter(f => /^\d{3}$/.test(f) && f !== '000')
    .sort();
}

console.log(`${dryRun ? 'DRY RUN: ' : ''}Normalizing ${carnets.length} carnets...`);
console.log('='.repeat(60));

let totalEntries = 0;
let totalParas = 0;
let totalConverted = 0;
let totalRenumbered = 0;
let totalErrors = 0;

for (const carnet of carnets) {
  const stats = normalizeCarnet(carnet, dryRun);

  totalEntries += stats.entries;
  totalParas += stats.paragraphsTotal;
  totalConverted += stats.converted;
  totalRenumbered += stats.renumbered;
  totalErrors += stats.errors.length;

  if (stats.errors.length > 0) {
    console.log(`Carnet ${carnet}: ${stats.entries} entries, ${stats.paragraphsTotal} paragraphs - ERRORS:`);
    for (const err of stats.errors) {
      console.log(`  ERROR: ${err}`);
    }
  } else if (stats.converted > 0 || stats.renumbered > 0) {
    console.log(`Carnet ${carnet}: ${stats.entries} entries, ${stats.paragraphsTotal} paragraphs (${stats.converted} converted, ${stats.renumbered} renumbered)`);
  } else {
    console.log(`Carnet ${carnet}: ${stats.entries} entries, ${stats.paragraphsTotal} paragraphs`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`SUMMARY:`);
console.log(`  Carnets:     ${carnets.length}`);
console.log(`  Entries:     ${totalEntries}`);
console.log(`  Paragraphs:  ${totalParas}`);
console.log(`  Converted:   ${totalConverted} (old → new format)`);
console.log(`  Renumbered:  ${totalRenumbered}`);
console.log(`  Errors:      ${totalErrors}`);
if (dryRun) {
  console.log(`\nThis was a dry run. Run without --dry-run to apply changes.`);
}
