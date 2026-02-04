#!/usr/bin/env npx tsx
/**
 * Bootstrap README.md files for carnet progress tracking
 *
 * Creates README.md files in each carnet folder based on templates.
 * Populates with actual entry counts and date ranges.
 *
 * Usage:
 *   npx tsx scripts/hooks/bootstrap-readmes.ts              # All
 *   npx tsx scripts/hooks/bootstrap-readmes.ts original     # French only
 *   npx tsx scripts/hooks/bootstrap-readmes.ts cz           # Czech only
 *   npx tsx scripts/hooks/bootstrap-readmes.ts cz 001       # Specific carnet
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { getProjectRoot, getTimestamp, loadWorkerConfig } from './lib/config.js';
import { calculateCarnetProgress } from './lib/progress.js';

interface CarnetInfo {
  carnet: string;
  entries: string[];
  startDate: string;
  endDate: string;
  locations: Set<string>;
}

function getCarnetInfo(langPath: string, carnet: string): CarnetInfo | null {
  const carnetPath = join(langPath, carnet);
  if (!existsSync(carnetPath)) return null;

  const entries = readdirSync(carnetPath)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort();

  if (entries.length === 0) return null;

  const locations = new Set<string>();

  // Try to extract locations from frontmatter
  for (const entry of entries.slice(0, 5)) { // Sample first 5
    try {
      const content = readFileSync(join(carnetPath, entry), 'utf-8');
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const fm = parseYaml(match[1]) as Record<string, unknown>;
        if (fm.location) locations.add(String(fm.location));
      }
    } catch {
      // Skip files that can't be parsed
    }
  }

  return {
    carnet,
    entries,
    startDate: entries[0].replace('.md', ''),
    endDate: entries[entries.length - 1].replace('.md', ''),
    locations,
  };
}

function generateOriginalReadme(info: CarnetInfo, progress: ReturnType<typeof calculateCarnetProgress>, user: string): string {
  const timestamp = getTimestamp();
  const locationStr = info.locations.size > 0 ? Array.from(info.locations).join(', ') : 'TBD';

  return `# Carnet ${info.carnet} — French Original

<!-- WORKER: @${user} since ${timestamp.split('T')[0]} -->

## Summary

Carnet ${info.carnet} of Marie Bashkirtseff's diary.

**Date range**: ${info.startDate} to ${info.endDate}
**Entry count**: ${info.entries.length}
**Location(s)**: ${locationStr}

## Status

| Phase       | Done | Total | Worker |
|-------------|------|-------|--------|
| Restructured | ${info.entries.length} | ${info.entries.length} | — |
| Research    | ${progress.research} | ${info.entries.length} | — |
| Annotation  | ${progress.annotation} | ${info.entries.length} | — |

## TODOs

### Research Needed
<!-- Items that need historical research -->

### Annotation Needed
<!-- Items that need linguistic annotation -->

### From Translations (auto-synced)
<!-- BEGIN:SYNC:TRANSLATIONS -->
<!-- Proposals from translation teams appear here -->
<!-- END:SYNC:TRANSLATIONS -->

## Glossary Coverage

| Category | Entries | Linked |
|----------|---------|--------|
| People | — | — |
| Places | — | — |
| Culture | — | — |
| Society | — | — |

## What's Done

_Progress tracking initialized._

## Changelog

### ${timestamp} @${user}
Initialized carnet README for progress tracking.
`;
}

function generateTranslationReadme(
  info: CarnetInfo,
  progress: ReturnType<typeof calculateCarnetProgress>,
  language: string,
  user: string
): string {
  const timestamp = getTimestamp();
  const locationStr = info.locations.size > 0 ? Array.from(info.locations).join(', ') : 'TBD';
  const langName = language === 'cz' ? 'Czech' : language === 'en' ? 'English' : language.toUpperCase();

  return `# Carnet ${info.carnet} — ${langName} Translation

<!-- SYNC: src/_original/${info.carnet}/README.md -->
<!-- WORKER: @${user} since ${timestamp.split('T')[0]} -->

## Summary

${langName} translation of carnet ${info.carnet}.

**Date range**: ${info.startDate} to ${info.endDate}
**Entry count**: ${info.entries.length}
**Location(s)**: ${locationStr}

## Status

| Phase       | Done | Total | Worker |
|-------------|------|-------|--------|
| Research    | ${progress.research} | ${info.entries.length} | — |
| Annotation  | ${progress.annotation} | ${info.entries.length} | — |
| Translation | ${progress.translation} | ${info.entries.length} | — |
| Gemini      | ${progress.gemini} | ${info.entries.length} | — |
| Edited      | ${progress.edited} | ${info.entries.length} | — |
| Approved    | ${progress.approved} | ${info.entries.length} | — |

## TODOs

### From Original (auto-synced)
<!-- BEGIN:SYNC:ORIGINAL -->
<!-- Items synced from src/_original/${info.carnet}/README.md appear here -->
<!-- END:SYNC:ORIGINAL -->

### Local
<!-- Translation-specific issues -->

### Propose to Original
<!-- BEGIN:SYNC:PROPOSE -->
<!-- Research/annotation issues found during translation -->
<!-- END:SYNC:PROPOSE -->

## What's Done

_Progress tracking initialized._

## Changelog

### ${timestamp} @${user}
Initialized carnet README for progress tracking.
`;
}

async function bootstrapLanguage(language: string, filterCarnet?: string): Promise<number> {
  const root = getProjectRoot();
  const langDir = language === 'original' ? '_original' : language;
  const langPath = join(root, 'src', langDir);

  if (!existsSync(langPath)) {
    console.log(`  Language path not found: ${langPath}`);
    return 0;
  }

  const config = await loadWorkerConfig();
  const user = config?.github_user || 'system';

  const carnets = readdirSync(langPath)
    .filter(d => /^\d{3}$/.test(d))
    .filter(d => !filterCarnet || d === filterCarnet)
    .sort();

  let created = 0;

  for (const carnet of carnets) {
    const readmePath = join(langPath, carnet, 'README.md');

    // Skip if already exists
    if (existsSync(readmePath)) {
      console.log(`  ${carnet}: README.md already exists, skipping`);
      continue;
    }

    const info = getCarnetInfo(langPath, carnet);
    if (!info || info.entries.length === 0) {
      console.log(`  ${carnet}: No entries found, skipping`);
      continue;
    }

    // Calculate progress
    const progress = calculateCarnetProgress(language, carnet);

    // Generate README
    const content = language === 'original'
      ? generateOriginalReadme(info, progress, user)
      : generateTranslationReadme(info, progress, language, user);

    writeFileSync(readmePath, content);
    console.log(`  ${carnet}: Created README.md (${info.entries.length} entries, ${info.startDate} to ${info.endDate})`);
    created++;
  }

  return created;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filterLang = args[0];
  const filterCarnet = args[1];

  const root = getProjectRoot();
  console.log('Bootstrapping README.md files...\n');

  let totalCreated = 0;

  // Determine which languages to process
  let languages: string[];
  if (filterLang) {
    languages = [filterLang];
  } else {
    // Get all language directories
    const srcPath = join(root, 'src');
    languages = ['original', ...readdirSync(srcPath)
      .filter(d => !d.startsWith('_') && !d.endsWith('.md'))
      .filter(d => existsSync(join(srcPath, d)) &&
                   readdirSync(join(srcPath, d)).some(f => /^\d{3}$/.test(f)))
    ];
  }

  for (const lang of languages) {
    console.log(`\n=== ${lang.toUpperCase()} ===`);
    const created = await bootstrapLanguage(lang, filterCarnet);
    totalCreated += created;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Created: ${totalCreated} README.md files`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
