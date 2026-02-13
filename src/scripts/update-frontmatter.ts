#!/usr/bin/env npx tsx
/**
 * Update calculated frontmatter fields (metrics, age) for diary entries.
 * Calculates: paragraph_count, word_count, sentence_count_original,
 * sentence_count_translated, marie_age, has_original, has_translation.
 *
 * Usage:
 *   npx tsx src/scripts/update-frontmatter.ts --dry-run           # Preview all carnets
 *   npx tsx src/scripts/update-frontmatter.ts --dry-run 001       # Preview one carnet
 *   npx tsx src/scripts/update-frontmatter.ts 001                 # Apply to one carnet
 *   npx tsx src/scripts/update-frontmatter.ts                     # Apply to all
 *   npx tsx src/scripts/update-frontmatter.ts --lang cz 001       # Update Czech translation metrics
 *   npx tsx src/scripts/update-frontmatter.ts --lang cz --dry-run # Preview Czech, all carnets
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ParagraphParser } from '../shared/src/parser/paragraph-parser.js';
import {
  parseFrontmatter,
  createFrontmatter,
  calculateMarieAge,
} from '../shared/src/parser/frontmatter.js';
import { getEntryStatistics } from '../shared/src/utils/statistics.js';

const parser = new ParagraphParser();
const CONTENT_DIR = path.resolve('content');

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const langIdx = args.indexOf('--lang');
const lang = langIdx >= 0 ? args[langIdx + 1] : null;
const specificCarnet = args.find(
  (a) => !a.startsWith('--') && (langIdx < 0 || args.indexOf(a) !== langIdx + 1)
);

// Determine base directory
const baseDir = lang ? path.join(CONTENT_DIR, lang) : path.join(CONTENT_DIR, '_original');

if (!fs.existsSync(baseDir)) {
  console.error(`Directory not found: ${baseDir}`);
  process.exit(1);
}

// ── Metrics calculation ─────────────────────────────────────────────

interface UpdateResult {
  file: string;
  changed: boolean;
  metrics: {
    paragraph_count: number;
    word_count: number;
    sentence_count_original: number;
    sentence_count_translated: number;
  };
}

function updateEntryFrontmatter(
  filePath: string,
  dryRun: boolean
): UpdateResult | null {
  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { metadata, content } = parseFrontmatter(rawContent);

    // Skip files without frontmatter
    if (!metadata || Object.keys(metadata).length === 0) {
      return null;
    }

    // Parse the entry to get stats
    const entry = parser.parseFile(filePath);
    const stats = getEntryStatistics(entry);

    // Calculate marie_age if date available
    const date = metadata.date as string;
    const age = date ? calculateMarieAge(date) : null;

    // Build metrics
    const metrics = {
      paragraph_count: stats.totalParagraphs,
      word_count: stats.totalWordsOriginal || stats.totalWordsTranslated,
      sentence_count_original: stats.totalSentencesOriginal,
      sentence_count_translated: stats.totalSentencesTranslated,
    };

    // Check if anything changed
    const existingMetrics = (metadata.metrics ?? {}) as Record<string, unknown>;
    const changed =
      existingMetrics.paragraph_count !== metrics.paragraph_count ||
      existingMetrics.word_count !== metrics.word_count ||
      existingMetrics.sentence_count_original !== metrics.sentence_count_original ||
      existingMetrics.sentence_count_translated !== metrics.sentence_count_translated ||
      (age && JSON.stringify(metadata.marie_age) !== JSON.stringify(age));

    if (!changed) {
      return { file: path.basename(filePath), changed: false, metrics };
    }

    if (!dryRun) {
      // Update metadata
      metadata.metrics = {
        ...existingMetrics,
        ...metrics,
        has_original: stats.totalWordsOriginal > 0,
        has_translation: stats.totalWordsTranslated > 0,
      };

      if (age && age.years > 0) {
        metadata.marie_age = age;
      }

      // Rebuild file with updated frontmatter
      const frontmatterStr = createFrontmatter(metadata);
      const newContent = frontmatterStr + content;
      fs.writeFileSync(filePath, newContent, 'utf-8');
    }

    return { file: path.basename(filePath), changed: true, metrics };
  } catch (e: any) {
    console.error(`  Error processing ${path.basename(filePath)}: ${e.message}`);
    return null;
  }
}

function processCarnet(carnetId: string, dryRun: boolean): void {
  const carnetDir = path.join(baseDir, carnetId);

  if (!fs.existsSync(carnetDir)) {
    console.error(`  Carnet directory not found: ${carnetDir}`);
    return;
  }

  const files = fs
    .readdirSync(carnetDir)
    .filter(
      (f) =>
        f.endsWith('.md') &&
        !f.startsWith('README') &&
        !f.startsWith('_')
    )
    .sort();

  let updatedCount = 0;
  let totalSentences = 0;
  let totalWords = 0;

  for (const file of files) {
    const result = updateEntryFrontmatter(
      path.join(carnetDir, file),
      dryRun
    );
    if (result) {
      totalSentences += result.metrics.sentence_count_original || result.metrics.sentence_count_translated;
      totalWords += result.metrics.word_count;
      if (result.changed) {
        updatedCount++;
        if (dryRun) {
          const s = result.metrics;
          console.log(
            `  ${result.file}: ${s.paragraph_count} paras, ${s.word_count} words, ` +
              `${s.sentence_count_original} sent(orig), ${s.sentence_count_translated} sent(trans)`
          );
        }
      }
    }
  }

  const action = dryRun ? 'would update' : 'updated';
  console.log(
    `Carnet ${carnetId}: ${files.length} entries, ${action} ${updatedCount}, ` +
      `${totalWords} words, ${totalSentences} sentences total`
  );
}

// ── Main ────────────────────────────────────────────────────────────

let carnets: string[];
if (specificCarnet) {
  carnets = [specificCarnet];
} else {
  carnets = fs
    .readdirSync(baseDir)
    .filter((f) => /^\d{3}$/.test(f))
    .sort();
}

const label = lang ? `${lang} translations` : 'originals';
console.log(
  `${dryRun ? 'DRY RUN: ' : ''}Updating frontmatter metrics for ${carnets.length} carnet(s) (${label})...`
);
console.log('='.repeat(60));

for (const carnet of carnets) {
  processCarnet(carnet, dryRun);
}

console.log('='.repeat(60));
console.log('Done.');
