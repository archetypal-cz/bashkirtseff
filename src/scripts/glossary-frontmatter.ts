#!/usr/bin/env npx tsx
/**
 * Glossary Frontmatter Manager
 *
 * Ensure all glossary entries have YAML frontmatter, add/update fields,
 * and auto-derive aliases from headings.
 *
 * Usage:
 *   npx tsx src/scripts/glossary-frontmatter.ts ensure --dry-run       # Add FM where missing
 *   npx tsx src/scripts/glossary-frontmatter.ts ensure                  # Apply
 *   npx tsx src/scripts/glossary-frontmatter.ts aliases --dry-run       # Auto-derive aliases
 *   npx tsx src/scripts/glossary-frontmatter.ts aliases                 # Apply aliases
 *   npx tsx src/scripts/glossary-frontmatter.ts set <ID> <field> <val>  # Set field on entry
 *   npx tsx src/scripts/glossary-frontmatter.ts get <ID>                # Show frontmatter
 *   npx tsx src/scripts/glossary-frontmatter.ts stats                   # Alias coverage stats
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';

const GLOSSARY_DIR = path.resolve('content/_original/_glossary');
const SKIP_FILES = new Set(['CLAUDE.md', 'README.md']);

// ── Types ────────────────────────────────────────────────────────────

interface GlossaryFrontmatter {
  id: string;
  name: string;
  aliases?: string[];
  type?: string;
  category?: string;
  research_status?: string;
  last_updated?: string;
  [key: string]: unknown;
}

interface GlossaryFile {
  filePath: string;
  relativePath: string;
  id: string;
  category: string;
  hasFrontmatter: boolean;
  metadata: GlossaryFrontmatter;
  body: string;
}

// ── File Discovery ───────────────────────────────────────────────────

function findGlossaryFiles(): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.md') && !SKIP_FILES.has(entry.name)) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  walk(GLOSSARY_DIR);
  return results.sort();
}

// ── Frontmatter Parsing ─────────────────────────────────────────────

function parseGlossaryFile(filePath: string): GlossaryFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(GLOSSARY_DIR, filePath);
  const filename = path.basename(filePath, '.md');
  const category = path.dirname(relativePath);

  let hasFrontmatter = false;
  let metadata: GlossaryFrontmatter = { id: filename, name: filename };
  let body = content;

  if (content.startsWith('---\n')) {
    const endIndex = content.indexOf('\n---\n', 4);
    if (endIndex !== -1) {
      hasFrontmatter = true;
      const fmStr = content.substring(4, endIndex);
      try {
        const parsed = YAML.parse(fmStr) ?? {};
        metadata = { id: filename, name: filename, ...parsed };
      } catch {
        // Keep defaults on parse error
      }
      body = content.substring(endIndex + 5);
    }
  }

  // If no frontmatter, try to extract name from heading
  if (!hasFrontmatter) {
    const headingMatch = body.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      metadata.name = headingMatch[1].trim();
    }
  }

  // Ensure ID and category
  metadata.id = metadata.id || filename;
  metadata.category = metadata.category || category;

  return { filePath, relativePath, id: filename, category, hasFrontmatter, metadata, body };
}

// ── Frontmatter Writing ─────────────────────────────────────────────

const GLOSSARY_FIELD_ORDER = [
  'id', 'name', 'aliases', 'type', 'category',
  'research_status', 'last_updated', 'diary_coverage',
];

function createGlossaryFrontmatter(metadata: GlossaryFrontmatter): string {
  const ordered: Record<string, unknown> = {};

  for (const field of GLOSSARY_FIELD_ORDER) {
    if ((metadata as Record<string, unknown>)[field] !== undefined) {
      ordered[field] = (metadata as Record<string, unknown>)[field];
    }
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (!(key in ordered)) {
      ordered[key] = value;
    }
  }

  const yamlStr = YAML.stringify(ordered, { lineWidth: 0 });
  return `---\n${yamlStr}---\n`;
}

function writeGlossaryFile(file: GlossaryFile): void {
  const fm = createGlossaryFrontmatter(file.metadata);
  fs.writeFileSync(file.filePath, fm + file.body, 'utf-8');
}

// ── Alias Derivation ────────────────────────────────────────────────

/** Words too generic to be standalone aliases — would cause false positives */
const GENERIC_WORDS = new Set([
  // Titles
  'baron', 'baronne', 'comte', 'comtesse', 'duc', 'duchesse',
  'duke', 'duchess', 'prince', 'princesse', 'marquis', 'marquise', 'vicomte', 'vicomtesse',
  'madame', 'monsieur', 'mademoiselle', 'mme', 'mlle',
  'lord', 'lady', 'sir', 'miss', 'mrs', 'mr',
  'general', 'colonel', 'capitaine', 'docteur', 'professeur',
  'roi', 'reine', 'emperor', 'empress', 'tsar', 'tsarine',
  'saint', 'sainte',
  // Family/relational words
  'pere', 'père', 'fils', 'fille', 'mere', 'mère', 'frere', 'frère', 'soeur', 'sœur',
  'oncle', 'tante', 'neveu', 'niece', 'nièce', 'cousin', 'cousine',
  'aine', 'aîné', 'cadet', 'cadette', 'jeune', 'vieux', 'grand',
]);

/**
 * Derive text aliases from glossary entry heading and ID.
 * These are the forms by which the entity appears in diary text.
 */
function deriveAliases(file: GlossaryFile): string[] {
  const aliases = new Set<string>();
  const { id, metadata } = file;

  // 1. From the heading/name — the primary display form
  const name = metadata.name || '';
  if (name && name !== id) {
    // Full name as-is
    aliases.add(name);

    // Strip parenthetical suffixes: "Nice (city)" → "Nice"
    const withoutParens = name.replace(/\s*\(.*?\)\s*$/, '').trim();
    if (withoutParens && withoutParens !== name) {
      aliases.add(withoutParens);
    }

    // For people: extract surname(s) and first name
    // "Maria Stepanovna Babanina" → "Babanina", "Maria"
    const nameParts = withoutParens.split(/\s+/);
    if (nameParts.length >= 2 && file.category.startsWith('people')) {
      // Last name (most common reference form) — only if not generic
      const lastName = nameParts[nameParts.length - 1];
      if (!GENERIC_WORDS.has(lastName.toLowerCase()) && lastName.length > 3) {
        aliases.add(lastName);
      }
      // First name only if 3+ parts and not generic
      if (nameParts.length >= 3) {
        const firstName = nameParts[0];
        if (!GENERIC_WORDS.has(firstName.toLowerCase()) && firstName.length > 2) {
          aliases.add(firstName);
        }
      }
    }
  }

  // 2. From the ID — convert CAPITAL_ASCII to text forms
  // DUKE_OF_HAMILTON → "Duke of Hamilton"
  // BARON_D_ALT → "Baron d'Alt"
  const idParts = id.split('_');
  const fromIdParts: string[] = [];
  for (let i = 0; i < idParts.length; i++) {
    const w = idParts[i];
    const lower = w.toLowerCase();

    // Handle apostrophe contractions: D + next → d'Next
    if ((lower === 'd' || lower === 'l') && i + 1 < idParts.length) {
      const next = idParts[i + 1];
      fromIdParts.push(lower + "'" + next.charAt(0) + next.slice(1).toLowerCase());
      i++; // skip next
      continue;
    }

    // Keep small words lowercase (except first)
    if (fromIdParts.length > 0 && ['of', 'de', 'du', 'des', 'la', 'le', 'les', 'et', 'the', 'and', 'von', 'van'].includes(lower)) {
      fromIdParts.push(lower);
    } else {
      fromIdParts.push(w.charAt(0) + w.slice(1).toLowerCase());
    }
  }
  const fromId = fromIdParts.join(' ');
  if (fromId !== name) {
    aliases.add(fromId);
  }

  // 3. From parenthetical in heading: "Maman (Maria Stepanovna Babanina)"
  const parenMatch = name.match(/\((.+?)\)/);
  if (parenMatch) {
    aliases.add(parenMatch[1].trim());
  }

  // Remove the ID itself, empty strings, and overly generic single words
  const result = [...aliases].filter(a => {
    if (!a || a === id) return false;
    // Single-word aliases: must be >3 chars and not a generic title
    if (!a.includes(' ')) {
      if (a.length <= 3) return false;
      if (GENERIC_WORDS.has(a.toLowerCase())) return false;
    }
    // Multi-word: filter out entries that are just "Family" or similar noise
    if (a === 'Family') return false;
    return true;
  });

  // Sort by length descending (longer = more specific = match first)
  return result.sort((a, b) => b.length - a.length);
}

// ── Commands ─────────────────────────────────────────────────────────

function cmdEnsure(dryRun: boolean): void {
  const files = findGlossaryFiles();
  let added = 0;
  let skipped = 0;

  for (const filePath of files) {
    const file = parseGlossaryFile(filePath);

    if (file.hasFrontmatter) {
      skipped++;
      continue;
    }

    added++;

    // Determine type from category
    let type = 'Unknown';
    if (file.category.startsWith('people')) type = 'Person';
    else if (file.category.startsWith('places')) type = 'Place';
    else if (file.category.startsWith('culture')) type = 'Culture';
    else if (file.category.startsWith('society')) type = 'Society';
    else if (file.category.startsWith('languages')) type = 'Language';

    file.metadata.type = file.metadata.type || type;
    file.metadata.category = file.category;
    file.metadata.research_status = file.metadata.research_status || 'Basic';
    file.metadata.last_updated = file.metadata.last_updated || new Date().toISOString().split('T')[0];

    if (dryRun) {
      console.log(`+ ${file.relativePath}`);
    } else {
      writeGlossaryFile(file);
    }
  }

  console.log(`\n${dryRun ? 'DRY RUN: ' : ''}Ensure frontmatter`);
  console.log(`  Already had FM: ${skipped}`);
  console.log(`  ${dryRun ? 'Would add' : 'Added'} FM: ${added}`);
  console.log(`  Total: ${files.length}`);
}

function cmdAliases(dryRun: boolean, filterCategory?: string): void {
  const files = findGlossaryFiles();
  let updated = 0;
  let alreadyHad = 0;
  let derived = 0;

  for (const filePath of files) {
    const file = parseGlossaryFile(filePath);

    if (filterCategory && !file.category.startsWith(filterCategory)) {
      continue;
    }

    // Skip if already has aliases
    if (file.metadata.aliases && file.metadata.aliases.length > 0) {
      alreadyHad++;
      continue;
    }

    const aliases = deriveAliases(file);
    if (aliases.length === 0) continue;

    derived++;
    file.metadata.aliases = aliases;

    // Ensure frontmatter exists
    if (!file.hasFrontmatter) {
      let type = 'Unknown';
      if (file.category.startsWith('people')) type = 'Person';
      else if (file.category.startsWith('places')) type = 'Place';
      else if (file.category.startsWith('culture')) type = 'Culture';
      else if (file.category.startsWith('society')) type = 'Society';
      file.metadata.type = file.metadata.type || type;
      file.metadata.research_status = file.metadata.research_status || 'Basic';
      file.metadata.last_updated = new Date().toISOString().split('T')[0];
    }

    if (dryRun) {
      console.log(`${file.relativePath}: ${aliases.join(', ')}`);
    } else {
      writeGlossaryFile(file);
      updated++;
    }
  }

  console.log(`\n${dryRun ? 'DRY RUN: ' : ''}Auto-derive aliases`);
  console.log(`  Already had aliases: ${alreadyHad}`);
  console.log(`  ${dryRun ? 'Would derive' : 'Derived'}: ${derived}`);
  if (!dryRun) console.log(`  Updated files: ${updated}`);
}

function cmdSet(idOrPath: string, field: string, value: string): void {
  // Find the file
  const file = findFileById(idOrPath);
  if (!file) {
    console.error(`Glossary entry not found: ${idOrPath}`);
    process.exit(1);
  }

  const parsed = parseGlossaryFile(file);

  // Parse value — try JSON first (for arrays/objects), then string
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    parsedValue = value;
  }

  // Set the field
  (parsed.metadata as Record<string, unknown>)[field] = parsedValue;

  // Ensure frontmatter basics if adding to entry without FM
  if (!parsed.hasFrontmatter) {
    let type = 'Unknown';
    if (parsed.category.startsWith('people')) type = 'Person';
    else if (parsed.category.startsWith('places')) type = 'Place';
    else if (parsed.category.startsWith('culture')) type = 'Culture';
    parsed.metadata.type = parsed.metadata.type || type;
    parsed.metadata.research_status = parsed.metadata.research_status || 'Basic';
    parsed.metadata.last_updated = new Date().toISOString().split('T')[0];
  }

  writeGlossaryFile(parsed);
  console.log(`Set ${field} = ${JSON.stringify(parsedValue)} on ${parsed.relativePath}`);
}

function cmdGet(idOrPath: string): void {
  const file = findFileById(idOrPath);
  if (!file) {
    console.error(`Glossary entry not found: ${idOrPath}`);
    process.exit(1);
  }

  const parsed = parseGlossaryFile(file);
  console.log(`File: ${parsed.relativePath}`);
  console.log(`Has frontmatter: ${parsed.hasFrontmatter}`);
  console.log('---');
  console.log(YAML.stringify(parsed.metadata));
}

function cmdQuery(args: string[]): void {
  // Parse query args: [--category X] [--field X] [--has-field X] [--no-field X] [--json]
  const isJson = args.includes('--json');
  const fieldIdx = args.indexOf('--field');
  const field = fieldIdx >= 0 ? args[fieldIdx + 1] : undefined;
  const catIdx = args.indexOf('--category');
  const category = catIdx >= 0 ? args[catIdx + 1] : undefined;
  const hasFieldIdx = args.indexOf('--has-field');
  const hasField = hasFieldIdx >= 0 ? args[hasFieldIdx + 1] : undefined;
  const noFieldIdx = args.indexOf('--no-field');
  const noField = noFieldIdx >= 0 ? args[noFieldIdx + 1] : undefined;
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 0;

  const files = findGlossaryFiles();
  const results: Record<string, unknown>[] = [];

  for (const filePath of files) {
    const file = parseGlossaryFile(filePath);

    // Filter by category
    if (category && !file.category.startsWith(category)) continue;

    // Filter by has-field
    if (hasField) {
      const val = (file.metadata as Record<string, unknown>)[hasField];
      if (val === undefined || val === null || (Array.isArray(val) && val.length === 0)) continue;
    }

    // Filter by no-field
    if (noField) {
      const val = (file.metadata as Record<string, unknown>)[noField];
      if (val !== undefined && val !== null && !(Array.isArray(val) && val.length === 0)) continue;
    }

    // Build output
    if (field) {
      const val = (file.metadata as Record<string, unknown>)[field];
      results.push({ id: file.id, path: file.relativePath, [field]: val });
    } else {
      results.push({ id: file.id, path: file.relativePath, ...file.metadata });
    }

    if (limit > 0 && results.length >= limit) break;
  }

  if (isJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    // Compact table output
    for (const row of results) {
      const id = String(row.id).padEnd(35);
      if (field) {
        const val = row[field];
        const display = Array.isArray(val) ? val.join(', ') : String(val ?? '');
        console.log(`${id} ${display}`);
      } else {
        const p = String(row.path);
        console.log(`${id} ${p}`);
      }
    }
    console.log(`\n${results.length} entries`);
  }
}

function cmdAddAlias(idOrPath: string, alias: string): void {
  const file = findFileById(idOrPath);
  if (!file) {
    console.error(`Glossary entry not found: ${idOrPath}`);
    process.exit(1);
  }

  const parsed = parseGlossaryFile(file);
  const aliases = parsed.metadata.aliases || [];

  if (aliases.includes(alias)) {
    console.log(`Alias "${alias}" already exists on ${parsed.relativePath}`);
    return;
  }

  aliases.push(alias);
  parsed.metadata.aliases = aliases;

  // Ensure frontmatter basics
  if (!parsed.hasFrontmatter) {
    let type = 'Unknown';
    if (parsed.category.startsWith('people')) type = 'Person';
    else if (parsed.category.startsWith('places')) type = 'Place';
    else if (parsed.category.startsWith('culture')) type = 'Culture';
    parsed.metadata.type = parsed.metadata.type || type;
    parsed.metadata.research_status = parsed.metadata.research_status || 'Basic';
    parsed.metadata.last_updated = new Date().toISOString().split('T')[0];
  }

  writeGlossaryFile(parsed);
  console.log(`Added alias "${alias}" to ${parsed.relativePath}`);
  console.log(`  aliases: [${parsed.metadata.aliases.join(', ')}]`);
}

function cmdRemoveAlias(idOrPath: string, alias: string): void {
  const file = findFileById(idOrPath);
  if (!file) {
    console.error(`Glossary entry not found: ${idOrPath}`);
    process.exit(1);
  }

  const parsed = parseGlossaryFile(file);
  const aliases = parsed.metadata.aliases || [];

  const idx = aliases.indexOf(alias);
  if (idx === -1) {
    console.error(`Alias "${alias}" not found on ${parsed.relativePath}`);
    console.error(`  Current aliases: [${aliases.join(', ')}]`);
    process.exit(1);
  }

  aliases.splice(idx, 1);
  parsed.metadata.aliases = aliases.length > 0 ? aliases : undefined;

  writeGlossaryFile(parsed);
  console.log(`Removed alias "${alias}" from ${parsed.relativePath}`);
  if (aliases.length > 0) {
    console.log(`  remaining: [${aliases.join(', ')}]`);
  } else {
    console.log(`  no aliases remaining`);
  }
}

function cmdStats(): void {
  const files = findGlossaryFiles();
  let withFm = 0;
  let withAliases = 0;
  let totalAliases = 0;
  const byCategory = new Map<string, { total: number; withAliases: number }>();

  for (const filePath of files) {
    const file = parseGlossaryFile(filePath);
    const topCat = file.category.split('/')[0];

    if (!byCategory.has(topCat)) {
      byCategory.set(topCat, { total: 0, withAliases: 0 });
    }
    const cat = byCategory.get(topCat)!;
    cat.total++;

    if (file.hasFrontmatter) withFm++;
    if (file.metadata.aliases && file.metadata.aliases.length > 0) {
      withAliases++;
      totalAliases += file.metadata.aliases.length;
      cat.withAliases++;
    }
  }

  console.log('\n=== Glossary Frontmatter Stats ===\n');
  console.log(`Total entries:       ${files.length}`);
  console.log(`With frontmatter:    ${withFm}`);
  console.log(`Without frontmatter: ${files.length - withFm}`);
  console.log(`With aliases:        ${withAliases}`);
  console.log(`Total alias count:   ${totalAliases}`);
  console.log(`Avg aliases/entry:   ${withAliases > 0 ? (totalAliases / withAliases).toFixed(1) : 0}`);
  console.log('\nBy category:');
  for (const [cat, data] of [...byCategory.entries()].sort()) {
    console.log(`  ${cat.padEnd(15)} ${String(data.total).padStart(5)} total, ${String(data.withAliases).padStart(5)} with aliases`);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function findFileById(idOrPath: string): string | null {
  const upper = idOrPath.toUpperCase();

  // Direct file path
  if (fs.existsSync(idOrPath)) return idOrPath;

  // Search by ID
  const files = findGlossaryFiles();
  const match = files.find(f => path.basename(f, '.md') === upper);
  if (match) return match;

  // Fuzzy: search by partial ID
  const partial = files.filter(f => path.basename(f, '.md').includes(upper));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    console.error(`Ambiguous ID "${idOrPath}", matches:`);
    for (const p of partial.slice(0, 10)) {
      console.error(`  ${path.relative(GLOSSARY_DIR, p)}`);
    }
    return null;
  }

  return null;
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];
  const dryRun = args.includes('--dry-run');
  const categoryIdx = args.indexOf('--category');
  const category = categoryIdx >= 0 ? args[categoryIdx + 1] : undefined;

  switch (command) {
    case 'ensure':
      cmdEnsure(dryRun);
      break;

    case 'aliases':
      cmdAliases(dryRun, category);
      break;

    case 'set': {
      const id = args[1];
      const field = args[2];
      const value = args[3];
      if (!id || !field || value === undefined) {
        console.error('Usage: glossary-frontmatter set <ID> <field> <value>');
        console.error('  Value can be a string or JSON (for arrays/objects)');
        console.error('  Example: glossary-frontmatter set MAMAN aliases \'["maman", "Maman", "ma mère"]\'');
        process.exit(1);
      }
      cmdSet(id, field, value);
      break;
    }

    case 'get': {
      const id = args[1];
      if (!id) {
        console.error('Usage: glossary-frontmatter get <ID>');
        process.exit(1);
      }
      cmdGet(id);
      break;
    }

    case 'query':
      cmdQuery(args.slice(1));
      break;

    case 'add-alias': {
      const id = args[1];
      const alias = args[2];
      if (!id || !alias) {
        console.error('Usage: glossary-frontmatter add-alias <ID> <alias>');
        process.exit(1);
      }
      cmdAddAlias(id, alias);
      break;
    }

    case 'remove-alias': {
      const id = args[1];
      const alias = args[2];
      if (!id || !alias) {
        console.error('Usage: glossary-frontmatter remove-alias <ID> <alias>');
        process.exit(1);
      }
      cmdRemoveAlias(id, alias);
      break;
    }

    case 'stats':
      cmdStats();
      break;

    default:
      console.log(`
Glossary Frontmatter Manager

Commands:
  ensure [--dry-run]                     Add frontmatter to entries that lack it
  aliases [--dry-run] [--category X]     Auto-derive aliases from headings
  set <ID> <field> <value>               Set a frontmatter field (JSON or string)
  get <ID>                               Show frontmatter for an entry
  query [filters...]                     Query frontmatter across entries as JSON
  add-alias <ID> <alias>                 Add a single alias to an entry
  remove-alias <ID> <alias>              Remove a single alias from an entry
  stats                                  Show alias coverage statistics

Query filters:
  --category <cat>     Filter by category (e.g., "people", "places/cities")
  --field <name>       Extract only this field (e.g., "aliases", "name")
  --has-field <name>   Only entries that have this field (non-empty)
  --no-field <name>    Only entries that lack this field
  --limit <n>          Limit output to N entries
  --json               Output as JSON array (default: compact table)

Examples:
  glossary-frontmatter query --category people --field aliases --has-field aliases --json
  glossary-frontmatter query --category people --no-field aliases --limit 20
  glossary-frontmatter add-alias MAMAN "ma mère"
  glossary-frontmatter remove-alias MAMAN "Maria"
  glossary-frontmatter aliases --dry-run --category people
  glossary-frontmatter set DUKE_OF_HAMILTON aliases '["Hamilton", "le duc", "duc de H."]'
`);
      break;
  }
}

main();
