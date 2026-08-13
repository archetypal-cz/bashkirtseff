#!/usr/bin/env npx tsx

/**
 * Build Filter Index (CLI wrapper)
 *
 * Scans all entries in content/_original/ and builds a JSON index
 * for client-side filtering in the frontend.
 *
 * The actual builder lives in src/frontend/src/lib/filter-index-builder.ts so
 * that `astro build` (which is all the production Docker image runs) can
 * regenerate the index itself — see the header comment there.
 *
 * Usage:
 *   npx tsx src/scripts/build-filter-index.ts
 *   npx tsx src/scripts/build-filter-index.ts --verbose
 *   just fe-filter-index
 *
 * Output:
 *   src/frontend/public/data/filter-index.json
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFilterIndex } from '../frontend/src/lib/filter-index-builder.js';

const verbose = process.argv.includes('--verbose');

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONTENT_ROOT = path.join(REPO_ROOT, 'content');
const OUTPUT_PATH = path.join(REPO_ROOT, 'src/frontend/public/data/filter-index.json');

console.log('Building filter index...\n');

const { index, bytes, changed, outputPath } = writeFilterIndex(OUTPUT_PATH, CONTENT_ROOT);

console.log(`Entries:     ${index.totalEntries}`);
console.log(`Paragraphs:  ${index.totalParagraphs}`);
console.log(`Categories:  ${index.categories.length}`);
console.log(`Tags total:  ${index.categories.reduce((s, c) => s + c.tags.length, 0)}`);
console.log(`File size:   ${(bytes / 1024).toFixed(0)} KB (raw JSON)`);
console.log(`\nOutput: ${outputPath}${changed ? '' : ' (unchanged)'}`);

if (verbose) {
  console.log('\nCategory breakdown:');
  for (const cat of index.categories) {
    console.log(`  ${cat.key}: ${cat.tags.length} tags`);
    for (const tag of cat.tags.slice(0, 5)) {
      console.log(`    ${tag.name} (${tag.count})${tag.sub ? ` [${tag.sub}]` : ''}`);
    }
    if (cat.tags.length > 5) {
      console.log(`    ... and ${cat.tags.length - 5} more`);
    }
  }
}
