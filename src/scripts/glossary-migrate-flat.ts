#!/usr/bin/env npx tsx

/**
 * Glossary Flat-Path Migration
 *
 * Migrate flat-path glossary references like `../_glossary/Name.md`
 * to categorized paths like `../_glossary/people/mentioned/NAME.md`.
 *
 * Usage:
 *   npx tsx src/scripts/glossary-migrate-flat.ts
 *   npx tsx src/scripts/glossary-migrate-flat.ts --dry-run
 *   npx tsx src/scripts/glossary-migrate-flat.ts --stats
 *
 * Options:
 *   --dry-run    Show what would change without writing
 *   --stats      Show statistics only (no changes)
 *   --help       Show this help message
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Convert text to CAPITAL_ASCII format for glossary IDs.
 * (Inlined from @bashkirtseff/shared/models/glossary.ts)
 */
function toCapitalAscii(text: string): string {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let result = normalized.toUpperCase();
  result = result.replace(/['\-\s]+/g, '_');
  result = result.replace(/[^A-Z0-9_]/g, '');
  result = result.replace(/_+/g, '_');
  return result.replace(/^_|_$/g, '');
}

const BASE_PATH = process.cwd();
const GLOSSARY_BASE = path.join(BASE_PATH, 'content/_original/_glossary');
const CONTENT_BASE = path.join(BASE_PATH, 'content');

// Matches flat-path glossary links: [#Name](../_glossary/Name.md) — NO slash in filename
const FLAT_LINK_PATTERN = /\[([^\]]*)\]\(\.\.\/_glossary\/([^/)\s]+\.md)\)/g;

// --- Heuristic category assignment for new stubs ---

const KNOWN_CITIES = new Set([
  'PARIS', 'NICE', 'ROME', 'FLORENCE', 'NAPLES', 'VENICE', 'VENISE',
  'LONDON', 'LONDRES', 'BERLIN', 'VIENNA', 'VIENNE', 'MADRID', 'MUNICH',
  'MARSEILLE', 'LYON', 'BORDEAUX', 'CANNES', 'MONACO', 'MONTE_CARLO',
  'GENOA', 'GENES', 'GENEVE', 'GENEVA', 'TURIN', 'MILAN', 'PISA', 'PISE',
  'BRUSSELS', 'BRUXELLES', 'AMSTERDAM', 'LISBON', 'LISBONNE', 'ATHENS',
  'ATHENES', 'CONSTANTINOPLE', 'CAIRO', 'ALEXANDRIA', 'ALGIERS', 'ALGER',
  'ODESSA', 'KIEV', 'MOSCOW', 'MOSCOU', 'SAINT_PETERSBURG', 'ST_PETERSBURG',
  'BADEN_BADEN', 'SPA', 'OSTENDE', 'DIEPPE', 'BIARRITZ', 'PAU', 'AIX',
  'ARCACHON', 'MENTON', 'ANTIBES', 'GRASSE', 'HYERES', 'TOULON',
  'POMPEII', 'POMPEI', 'SORRENTO', 'SORRENTE', 'CAPRI', 'CAPUA', 'CAPOUE',
  'POLTAVA', 'KHARKOV', 'KHARKIV', 'GAVRONZI', 'TCHERNIGOV', 'CHERNIGOV',
  'ALLEVARD', 'AUTEUIL', 'NEUILLY', 'ENGHIEN', 'FONTAINEBLEAU', 'VERSAILLES',
  'SEVRES', 'SEVASTOPOL', 'YALTA', 'SMYRNA', 'SMYRNE',
]);

const KNOWN_COUNTRIES = new Set([
  'FRANCE', 'ITALY', 'ITALIE', 'ENGLAND', 'ANGLETERRE', 'GERMANY', 'ALLEMAGNE',
  'RUSSIA', 'RUSSIE', 'SPAIN', 'ESPAGNE', 'AUSTRIA', 'AUTRICHE', 'TURKEY',
  'TURQUIE', 'GREECE', 'GRECE', 'EGYPT', 'EGYPTE', 'BELGIUM', 'BELGIQUE',
  'SWITZERLAND', 'SUISSE', 'HOLLAND', 'HOLLANDE', 'NETHERLANDS', 'PORTUGAL',
  'AMERICA', 'AMERIQUE', 'ALGERIA', 'ALGERIE', 'SCOTLAND', 'ECOSSE',
  'IRELAND', 'IRLANDE', 'UKRAINE', 'POLAND', 'POLOGNE', 'ROMANIA', 'ROUMANIE',
  'HUNGARY', 'HONGRIE', 'DENMARK', 'DANEMARK', 'SWEDEN', 'SUEDE',
  'NORWAY', 'NORVEGE', 'CHINA', 'CHINE', 'JAPAN', 'JAPON', 'INDIA', 'INDE',
]);

const KNOWN_REGIONS = new Set([
  'ALSACE', 'ALSACE_LORRAINE', 'LORRAINE', 'PROVENCE', 'NORMANDY', 'NORMANDIE',
  'BRITTANY', 'BRETAGNE', 'CRIMEA', 'CRIMEE', 'SIBERIA', 'SIBERIE',
  'CAUCASUS', 'CAUCASE', 'RIVIERA', 'COTE_DAZUR',
]);

const KNOWN_LANGUAGES = new Set([
  'FRENCH', 'FRANCAIS', 'ENGLISH', 'ANGLAIS', 'GERMAN', 'ALLEMAND',
  'ITALIAN', 'ITALIEN', 'RUSSIAN', 'RUSSE', 'SPANISH', 'ESPAGNOL',
  'LATIN', 'GREEK', 'GREC', 'ARABIC', 'ARABE', 'UKRAINIAN', 'UKRAINIEN',
  'POLISH', 'POLONAIS',
]);

function guessCategory(id: string, displayName: string): string {
  const upper = id.toUpperCase();

  // Languages
  if (KNOWN_LANGUAGES.has(upper)) return 'culture/languages';

  // Countries
  if (KNOWN_COUNTRIES.has(upper)) return 'places/countries';

  // Regions
  if (KNOWN_REGIONS.has(upper)) return 'places/regions';

  // Cities
  if (KNOWN_CITIES.has(upper)) return 'places/cities';

  // Hotels
  if (upper.startsWith('HOTEL_') || upper.startsWith('GRAND_HOTEL') ||
      upper.endsWith('_HOTEL')) return 'places/hotels';

  // Villas / residences
  if (upper.startsWith('VILLA_') || upper.startsWith('CHATEAU_') || upper.startsWith('PALAIS_') ||
      upper.startsWith('PALAZZO_')) return 'places/residences';

  // Cafes / restaurants / shops
  if (upper.startsWith('CAFE_') || upper.startsWith('RESTAURANT_') ||
      upper.startsWith('AU_') || upper.startsWith('CHEZ_') ||
      upper.startsWith('MAISON_')) return 'places/shops';

  // Churches
  if (upper.startsWith('EGLISE_') || upper.startsWith('CATHEDRALE_') ||
      upper.startsWith('NOTRE_DAME') || upper.startsWith('SAINT_') || upper.startsWith('SAN_') ||
      upper.startsWith('SANTA_') || upper.startsWith('CHIESA_')) return 'places/churches';

  // Streets / promenades / addresses
  if (upper.startsWith('RUE_') || upper.startsWith('BOULEVARD_') || upper.startsWith('AVENUE_')) return 'places/streets';
  if (upper.startsWith('PROMENADE_')) return 'places/promenades';
  if (upper.startsWith('PLACE_')) return 'places/squares';

  // Parks / gardens
  if (upper.startsWith('JARDIN_') || upper.startsWith('PARC_') || upper.startsWith('BOIS_')) return 'places/parks';

  // Theaters
  if (upper.startsWith('THEATRE_') || upper.startsWith('THEATER_') || upper.startsWith('OPERA_')) return 'places/theaters';

  // Museums
  if (upper.startsWith('MUSEE_') || upper.startsWith('MUSEUM_') || upper.startsWith('GALERIE_')) return 'places/museums';

  // Newspapers / press with known titles
  if (upper.includes('JOURNAL') || upper.includes('GAZETTE') || upper.includes('TIMES') ||
      upper.includes('POST') || upper.includes('FIGARO') || upper.includes('MONITEUR')) return 'culture/press';

  // People patterns (Mme_, Mlle_, M_, Comte_, Prince_, etc.)
  if (upper.startsWith('MME_') || upper.startsWith('MLLE_') || upper.startsWith('MADAME_') ||
      upper.startsWith('MADEMOISELLE_')) return 'people/mentioned';
  if (upper.startsWith('PRINCE_') || upper.startsWith('PRINCESSE_') ||
      upper.startsWith('DUKE_') || upper.startsWith('DUCHESS_') ||
      upper.startsWith('DUC_') || upper.startsWith('DUCHESSE_') ||
      upper.startsWith('COMTE_') || upper.startsWith('COMTESSE_') ||
      upper.startsWith('BARON_') || upper.startsWith('BARONNE_') ||
      upper.startsWith('MARQUIS_') || upper.startsWith('MARQUISE_') ||
      upper.startsWith('LORD_') || upper.startsWith('LADY_') ||
      upper.startsWith('SIR_') || upper.startsWith('KING_') ||
      upper.startsWith('QUEEN_') || upper.startsWith('EMPEROR_') ||
      upper.startsWith('EMPRESS_') || upper.startsWith('TSAR_') ||
      upper.startsWith('TSARINA_') || upper.startsWith('ROI_') ||
      upper.startsWith('REINE_')) return 'people/aristocracy';

  // Default: people/mentioned
  return 'people/mentioned';
}

// --- Phase 1: Build glossary index ---

function buildGlossaryIndex(): Map<string, string> {
  const index = new Map<string, string>(); // CAPITAL_ASCII_ID → relative path from _glossary/

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name.startsWith('_')) continue; // skip _categories.yaml etc
        walk(fullPath);
      } else if (item.name.endsWith('.md')) {
        const id = item.name.replace('.md', '');
        const relPath = path.relative(GLOSSARY_BASE, fullPath);
        index.set(id, relPath);
      }
    }
  };

  walk(GLOSSARY_BASE);
  return index;
}

// --- Phase 2: Get all content files ---

function getAllContentFiles(): string[] {
  const files: string[] = [];

  const langDirs = ['_original', 'cz', 'en', 'uk', 'fr'];
  for (const lang of langDirs) {
    const langDir = path.join(CONTENT_BASE, lang);
    if (!fs.existsSync(langDir)) continue;

    const items = fs.readdirSync(langDir, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory()) continue;
      if (item.name.startsWith('_')) continue;

      const carnetDir = path.join(langDir, item.name);
      try {
        const carnetFiles = fs.readdirSync(carnetDir)
          .filter(f => f.endsWith('.md'))
          .map(f => path.join(carnetDir, f));
        files.push(...carnetFiles);
      } catch { /* skip unreadable dirs */ }
    }
  }

  return files.sort();
}

// --- Main ---

interface MigrationStats {
  totalRefs: number;
  resolvedRefs: number;
  stubsCreated: number;
  filesUpdated: number;
  uniqueFlat: Map<string, { capitalId: string; resolvedPath: string | null }>;
  stubsByCategory: Map<string, number>;
  fileDetails: Array<{ file: string; count: number }>;
}

function main(): void {
  const args = process.argv.slice(2);
  let dryRun = false;
  let statsOnly = false;

  for (const arg of args) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--stats') statsOnly = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Glossary Flat-Path Migration

Migrate flat-path glossary references to categorized paths.

Usage:
  just glossary-migrate-flat             # Apply migration
  just glossary-migrate-flat --dry-run   # Preview changes
  just glossary-migrate-flat --stats     # Statistics only

Options:
  --dry-run    Show what would change without writing
  --stats      Show statistics only
  --help       Show this help message
`);
      process.exit(0);
    }
  }

  if (dryRun || statsOnly) {
    console.log(statsOnly ? '=== STATISTICS ONLY ===' : '=== DRY RUN (no changes will be made) ===');
  }

  // Phase 1: Build index
  console.log('\nPhase 1: Building glossary index...');
  const glossaryIndex = buildGlossaryIndex();
  console.log(`  ${glossaryIndex.size} entries indexed`);

  // Phase 2: Scan content files
  console.log('\nPhase 2: Scanning content files...');
  const contentFiles = getAllContentFiles();
  console.log(`  ${contentFiles.length} content files to scan`);

  const stats: MigrationStats = {
    totalRefs: 0,
    resolvedRefs: 0,
    stubsCreated: 0,
    filesUpdated: 0,
    uniqueFlat: new Map(),
    stubsByCategory: new Map(),
    fileDetails: [],
  };

  // First pass: collect all unique flat refs and resolve them
  for (const file of contentFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    const pattern = new RegExp(FLAT_LINK_PATTERN.source, 'g');
    while ((match = pattern.exec(content)) !== null) {
      const [, displayText, filename] = match;
      const rawName = filename.replace('.md', '');
      const capitalId = toCapitalAscii(rawName);

      if (!stats.uniqueFlat.has(rawName)) {
        const resolvedPath = glossaryIndex.get(capitalId) ?? null;
        stats.uniqueFlat.set(rawName, { capitalId, resolvedPath });
      }
      stats.totalRefs++;
    }
  }

  console.log(`  ${stats.totalRefs} flat-path references found`);
  console.log(`  ${stats.uniqueFlat.size} unique entity names`);

  const resolved = [...stats.uniqueFlat.values()].filter(v => v.resolvedPath !== null).length;
  const unresolved = stats.uniqueFlat.size - resolved;
  console.log(`  ${resolved} already have categorized entries`);
  console.log(`  ${unresolved} need new stubs`);

  if (statsOnly) {
    // Print unresolved with their guessed categories
    if (unresolved > 0) {
      console.log('\nUnresolved entities and their assigned categories:');
      const sorted = [...stats.uniqueFlat.entries()]
        .filter(([, v]) => v.resolvedPath === null)
        .sort(([a], [b]) => a.localeCompare(b));
      for (const [rawName, { capitalId }] of sorted) {
        const cat = guessCategory(capitalId, rawName);
        console.log(`  ${rawName} → ${cat}/${capitalId}.md`);
      }
    }
    process.exit(0);
  }

  // Phase 3: Create stubs for unresolved
  console.log('\nPhase 3: Creating stubs for unresolved entries...');
  for (const [rawName, info] of stats.uniqueFlat) {
    if (info.resolvedPath !== null) continue;

    const category = guessCategory(info.capitalId, rawName);
    const newRelPath = path.join(category, `${info.capitalId}.md`);
    const newFullPath = path.join(GLOSSARY_BASE, newRelPath);

    // Create display name from raw name
    const displayName = rawName.replace(/_/g, ' ');

    if (!dryRun) {
      const dir = path.dirname(newFullPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(newFullPath, `# ${displayName}\n\nStub entry — needs research.\n`, 'utf-8');
    }

    // Update the index so Phase 4 can find it
    glossaryIndex.set(info.capitalId, newRelPath);
    info.resolvedPath = newRelPath;

    stats.stubsCreated++;
    const count = stats.stubsByCategory.get(category) ?? 0;
    stats.stubsByCategory.set(category, count + 1);
  }

  console.log(`  ${dryRun ? 'Would create' : 'Created'} ${stats.stubsCreated} stub entries`);
  if (stats.stubsByCategory.size > 0) {
    const sortedCats = [...stats.stubsByCategory.entries()].sort(([, a], [, b]) => b - a);
    for (const [cat, count] of sortedCats) {
      console.log(`    ${cat}: ${count}`);
    }
  }

  // Phase 4: Apply replacements
  console.log('\nPhase 4: Updating references in content files...');

  for (const file of contentFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;
    let count = 0;

    content = content.replace(
      new RegExp(FLAT_LINK_PATTERN.source, 'g'),
      (fullMatch, displayText, filename) => {
        const rawName = filename.replace('.md', '');
        const capitalId = toCapitalAscii(rawName);
        const resolvedPath = glossaryIndex.get(capitalId);

        if (!resolvedPath) {
          // Should not happen after Phase 3, but be safe
          console.warn(`  WARNING: No resolution for ${rawName} (${capitalId})`);
          return fullMatch;
        }

        count++;
        return `[${displayText}](../_glossary/${resolvedPath})`;
      }
    );

    if (content !== originalContent) {
      const relFile = path.relative(BASE_PATH, file);
      stats.filesUpdated++;
      stats.resolvedRefs += count;
      stats.fileDetails.push({ file: relFile, count });

      if (!dryRun) {
        fs.writeFileSync(file, content, 'utf-8');
      }
    }
  }

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`Total flat-path references: ${stats.totalRefs}`);
  console.log(`Files ${dryRun ? 'that would be' : ''} updated: ${stats.filesUpdated}`);
  console.log(`References ${dryRun ? 'that would be' : ''} migrated: ${stats.resolvedRefs}`);
  console.log(`Stubs ${dryRun ? 'that would be' : ''} created: ${stats.stubsCreated}`);

  if (dryRun) {
    console.log('\nRun without --dry-run to apply changes.');
  }

  // Verify: check for remaining flat refs
  if (!dryRun) {
    let remaining = 0;
    for (const file of contentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const pattern = new RegExp(FLAT_LINK_PATTERN.source, 'g');
      let match;
      while ((match = pattern.exec(content)) !== null) {
        remaining++;
      }
    }
    if (remaining > 0) {
      console.log(`\nWARNING: ${remaining} flat-path references still remain!`);
    } else {
      console.log(`\nVerification: 0 flat-path references remaining.`);
    }
  }
}

main();
