#!/usr/bin/env npx tsx
/**
 * Initialize source hashes in existing translation files
 *
 * Run this once to populate source_hash in all translation frontmatter.
 * After that, the post-edit hook will detect when originals change.
 *
 * Usage:
 *   npx tsx src/scripts/hooks/init-source-hashes.ts [language] [carnet]
 *
 * Examples:
 *   npx tsx src/scripts/hooks/init-source-hashes.ts           # All languages, all carnets
 *   npx tsx src/scripts/hooks/init-source-hashes.ts cz        # Czech only
 *   npx tsx src/scripts/hooks/init-source-hashes.ts cz 001    # Czech carnet 001 only
 */

import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getProjectRoot } from './lib/config.js';
import { calculateSourceHash, getStoredSourceHash, updateSourceHash } from './lib/source-sync.js';

function getLanguages(filterLang?: string): string[] {
  const root = getProjectRoot();
  const contentPath = join(root, 'content');

  const langs = readdirSync(contentPath)
    .filter(d => d !== '_original' && !d.startsWith('_') && !d.endsWith('.md'))
    .filter(d => {
      const langPath = join(contentPath, d);
      return existsSync(langPath) &&
             readdirSync(langPath).some(f => /^\d{3}$/.test(f));
    });

  if (filterLang) {
    return langs.filter(l => l === filterLang);
  }
  return langs;
}

function getCarnets(language: string, filterCarnet?: string): string[] {
  const root = getProjectRoot();
  const langPath = join(root, 'content', language);

  if (!existsSync(langPath)) return [];

  const carnets = readdirSync(langPath).filter(d => /^\d{3}$/.test(d)).sort();

  if (filterCarnet) {
    return carnets.filter(c => c === filterCarnet);
  }
  return carnets;
}

function getEntries(language: string, carnet: string): string[] {
  const root = getProjectRoot();
  const carnetPath = join(root, 'content', language, carnet);

  if (!existsSync(carnetPath)) return [];

  return readdirSync(carnetPath)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filterLang = args[0];
  const filterCarnet = args[1];

  const root = getProjectRoot();
  const languages = getLanguages(filterLang);

  console.log('Initializing source hashes...\n');

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalMissing = 0;

  for (const lang of languages) {
    console.log(`\n=== ${lang.toUpperCase()} ===`);

    const carnets = getCarnets(lang, filterCarnet);

    for (const carnet of carnets) {
      const entries = getEntries(lang, carnet);
      let carnetUpdated = 0;
      let carnetSkipped = 0;
      let carnetMissing = 0;

      for (const entry of entries) {
        const translationPath = join(root, 'content', lang, carnet, entry);
        const originalPath = join(root, 'content', '_original', carnet, entry);

        // Check if original exists
        if (!existsSync(originalPath)) {
          carnetMissing++;
          continue;
        }

        // Calculate source hash
        const sourceHash = calculateSourceHash(originalPath);
        if (!sourceHash) {
          carnetMissing++;
          continue;
        }

        // Check if already has hash
        const existingHash = getStoredSourceHash(translationPath);
        if (existingHash) {
          carnetSkipped++;
          continue;
        }

        // Update translation with source hash
        const updated = updateSourceHash(translationPath, sourceHash);
        if (updated) {
          carnetUpdated++;
        } else {
          carnetMissing++;
        }
      }

      if (entries.length > 0) {
        console.log(`  ${carnet}: ${carnetUpdated} updated, ${carnetSkipped} already had hash, ${carnetMissing} skipped`);
      }

      totalUpdated += carnetUpdated;
      totalSkipped += carnetSkipped;
      totalMissing += carnetMissing;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Updated: ${totalUpdated}`);
  console.log(`Already had hash: ${totalSkipped}`);
  console.log(`Skipped (no original or error): ${totalMissing}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
