#!/usr/bin/env npx ts-node --esm

/**
 * Restructure Glossary Script
 *
 * Converts existing glossary entries to paragraph cluster format.
 * Adds YAML frontmatter and paragraph IDs to each section.
 *
 * Usage:
 *   npx ts-node --esm scripts/restructure-glossary.ts [options]
 *
 * Options:
 *   --category <path>    Process specific category (e.g., "people/core")
 *   --entry <id>         Process single entry by ID (e.g., "DINA")
 *   --dry-run            Preview changes without writing
 *   --verbose            Show detailed output
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';

const GLOSSARY_ROOT = path.resolve(process.cwd(), 'content/_original/_glossary');

interface RestructureOptions {
  category?: string;
  entry?: string;
  dryRun: boolean;
  verbose: boolean;
}

interface ParsedEntry {
  id: string;
  name: string;
  type: string;
  category: string;
  researchStatus: string;
  lastUpdated: string;
  sections: Section[];
  notes: ParsedNote[];
}

interface Section {
  level: number;
  title: string;
  content: string[];
}

interface ParsedNote {
  timestamp: string;
  role: string;
  content: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): RestructureOptions {
  const args = process.argv.slice(2);
  const options: RestructureOptions = {
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--category':
        options.category = args[++i];
        break;
      case '--entry':
        options.entry = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
Restructure Glossary Script

Converts existing glossary entries to paragraph cluster format.

Usage:
  npx ts-node --esm scripts/restructure-glossary.ts [options]

Options:
  --category <path>    Process specific category (e.g., "people/core")
  --entry <id>         Process single entry by ID (e.g., "DINA")
  --dry-run            Preview changes without writing
  --verbose            Show detailed output
  --help               Show this help message

Examples:
  # Restructure all entries in people/core
  npx ts-node --esm scripts/restructure-glossary.ts --category people/core

  # Restructure single entry
  npx ts-node --esm scripts/restructure-glossary.ts --entry DINA --category people/core

  # Preview changes without writing
  npx ts-node --esm scripts/restructure-glossary.ts --category people/core --dry-run --verbose
`);
        process.exit(0);
    }
  }

  return options;
}

/**
 * Parse an existing glossary entry file
 */
function parseExistingEntry(filePath: string): ParsedEntry {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const id = path.basename(filePath, '.md');
  const category = extractCategory(filePath);

  const entry: ParsedEntry = {
    id,
    name: id.replace(/_/g, ' '),
    type: inferType(category),
    category,
    researchStatus: 'Stub',
    lastUpdated: new Date().toISOString().split('T')[0],
    sections: [],
    notes: [],
  };

  let currentSection: Section | null = null;
  let inNoteSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Extract notes (bottom of file)
    const noteMatch = trimmed.match(/^%%\s*(\d{4}-\d{2}-\d{2}T[\d:]+)\s+([A-Z]+):\s*(.+?)\s*%%$/);
    if (noteMatch) {
      entry.notes.push({
        timestamp: noteMatch[1],
        role: noteMatch[2],
        content: noteMatch[3],
      });
      inNoteSection = true;
      continue;
    }

    // Skip if we're in the note section
    if (inNoteSection && trimmed.startsWith('%%')) {
      continue;
    }

    // Extract H1 (name) - this becomes the entry title, not a separate section
    if (trimmed.startsWith('# ')) {
      const h1Name = trimmed.slice(2).trim();
      // Only update name if it looks like a proper name (not just the ID in uppercase)
      if (h1Name && (entry.name === id.replace(/_/g, ' ') || h1Name.toLowerCase() !== entry.name.toLowerCase())) {
        entry.name = h1Name;
      }
      // Skip H1 - it will be shown as the page title, not as a section
      continue;
    }

    // Extract metadata
    const statusMatch = trimmed.match(/^\*\*Research Status\*\*:\s*(.+)/);
    if (statusMatch) {
      entry.researchStatus = statusMatch[1].trim();
      continue;
    }

    const updatedMatch = trimmed.match(/^\*\*Last Updated\*\*:\s*(.+)/);
    if (updatedMatch) {
      entry.lastUpdated = updatedMatch[1].trim();
      continue;
    }

    const coverageMatch = trimmed.match(/^\*\*Diary Coverage\*\*:\s*(.+)/);
    if (coverageMatch) {
      // Skip - not including in new format
      continue;
    }

    // Extract section headers
    const headerMatch = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      currentSection = { level, title, content: [] };
      entry.sections.push(currentSection);
      continue;
    }

    // Add content to current section
    if (currentSection && trimmed && !trimmed.startsWith('%%')) {
      currentSection.content.push(line);
    } else if (!currentSection && trimmed && !trimmed.startsWith('%%') && !trimmed.startsWith('**')) {
      // Content before any section - create implicit first section
      if (entry.sections.length === 0) {
        currentSection = { level: 1, title: entry.name, content: [] };
        entry.sections.push(currentSection);
      }
      if (currentSection) {
        currentSection.content.push(line);
      }
    }
  }

  return entry;
}

/**
 * Extract category from file path
 */
function extractCategory(filePath: string): string {
  const match = filePath.match(/_glossary\/(.+)\/[^/]+\.md$/);
  return match ? match[1] : '';
}

/**
 * Infer type from category
 */
function inferType(category: string): string {
  const parts = category.split('/');
  if (parts[0]) {
    // people -> Person, places -> Place, culture -> Culture, society -> Society
    const cat = parts[0].toLowerCase();
    if (cat === 'people') return 'Person';
    if (cat === 'places') return 'Place';
    if (cat === 'culture') return 'Culture';
    if (cat === 'society') return 'Society';
    // Fallback: capitalize first letter
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }
  return 'Unknown';
}

/**
 * Convert parsed entry to new paragraph cluster format
 */
function convertToClusterFormat(entry: ParsedEntry): string {
  const lines: string[] = [];

  // Frontmatter
  const frontmatter = {
    id: entry.id,
    name: entry.name,
    type: entry.type,
    category: entry.category,
    research_status: entry.researchStatus,
    last_updated: entry.lastUpdated,
  };

  lines.push('---');
  lines.push(YAML.stringify(frontmatter).trim());
  lines.push('---');
  lines.push('');

  // Convert sections to paragraph clusters
  let paraNum = 1;

  for (const section of entry.sections) {
    const paraId = `GLO_${entry.id}.${String(paraNum).padStart(4, '0')}`;
    paraNum++;

    // Add blank line between paragraphs
    if (lines.length > 4) {
      lines.push('');
    }

    // Paragraph ID
    lines.push(`%% ${paraId} %%`);

    // Header
    const headerPrefix = '#'.repeat(section.level);
    lines.push(`${headerPrefix} ${section.title}`);

    // Content (if any)
    if (section.content.length > 0) {
      // Create new paragraph for content
      const contentParaId = `GLO_${entry.id}.${String(paraNum).padStart(4, '0')}`;
      paraNum++;

      lines.push('');
      lines.push(`%% ${contentParaId} %%`);

      // Add content lines
      const contentText = section.content.join('\n').trim();
      if (contentText) {
        lines.push(contentText);
      }
    }
  }

  // Add notes at the end (attached to last paragraph)
  if (entry.notes.length > 0) {
    // Find the last paragraph ID line and insert notes after it
    // For simplicity, we'll add notes to a dedicated "notes" paragraph
    const notesParaId = `GLO_${entry.id}.${String(paraNum).padStart(4, '0')}`;

    lines.push('');
    lines.push(`%% ${notesParaId} %%`);

    for (const note of entry.notes) {
      lines.push(`%% ${note.timestamp} ${note.role}: ${note.content} %%`);
    }

    lines.push('## Research Notes');
    lines.push('');
    lines.push('See annotations above for detailed research notes.');
  }

  return lines.join('\n');
}

/**
 * Process a single file
 */
function processFile(filePath: string, options: RestructureOptions): boolean {
  const relativePath = path.relative(GLOSSARY_ROOT, filePath);

  if (options.verbose) {
    console.log(`Processing: ${relativePath}`);
  }

  try {
    // Check if already in new format (has frontmatter with id field)
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.startsWith('---\n') && content.includes('\nid:')) {
      if (options.verbose) {
        console.log(`  Skipping (already restructured): ${relativePath}`);
      }
      return false;
    }

    // Parse existing entry
    const entry = parseExistingEntry(filePath);

    // Convert to new format
    const newContent = convertToClusterFormat(entry);

    if (options.verbose) {
      console.log(`  ID: ${entry.id}`);
      console.log(`  Name: ${entry.name}`);
      console.log(`  Sections: ${entry.sections.length}`);
      console.log(`  Notes: ${entry.notes.length}`);
    }

    if (options.dryRun) {
      console.log(`\n--- Would write to: ${relativePath} ---`);
      console.log(newContent.slice(0, 500) + (newContent.length > 500 ? '\n...' : ''));
      console.log('---\n');
    } else {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`  Written: ${relativePath}`);
    }

    return true;
  } catch (error) {
    console.error(`  Error processing ${relativePath}:`, error);
    return false;
  }
}

/**
 * Process all files in a directory recursively
 */
function processDirectory(dirPath: string, options: RestructureOptions): { processed: number; skipped: number; errors: number } {
  const stats = { processed: 0, skipped: 0, errors: 0 };

  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return stats;
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subStats = processDirectory(fullPath, options);
      stats.processed += subStats.processed;
      stats.skipped += subStats.skipped;
      stats.errors += subStats.errors;
    } else if (item.endsWith('.md') && !item.startsWith('_')) {
      try {
        const wasProcessed = processFile(fullPath, options);
        if (wasProcessed) {
          stats.processed++;
        } else {
          stats.skipped++;
        }
      } catch {
        stats.errors++;
      }
    }
  }

  return stats;
}

/**
 * Find entry file by ID in a category
 */
function findEntryFile(category: string, entryId: string): string | null {
  const categoryPath = path.join(GLOSSARY_ROOT, category);

  if (!fs.existsSync(categoryPath)) {
    return null;
  }

  // Search recursively
  const search = (dir: string): string | null => {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const found = search(fullPath);
        if (found) return found;
      } else if (item === `${entryId}.md`) {
        return fullPath;
      }
    }

    return null;
  };

  return search(categoryPath);
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  console.log('Glossary Restructure Script');
  console.log('===========================');

  if (options.dryRun) {
    console.log('DRY RUN MODE - No files will be modified\n');
  }

  if (options.entry && options.category) {
    // Process single entry
    const filePath = findEntryFile(options.category, options.entry);
    if (!filePath) {
      console.error(`Entry not found: ${options.entry} in ${options.category}`);
      process.exit(1);
    }

    processFile(filePath, options);
  } else if (options.category) {
    // Process category
    const categoryPath = path.join(GLOSSARY_ROOT, options.category);
    const stats = processDirectory(categoryPath, options);

    console.log('\nSummary:');
    console.log(`  Processed: ${stats.processed}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Errors: ${stats.errors}`);
  } else {
    console.log('No category or entry specified. Use --help for usage information.');
    console.log('\nAvailable categories:');

    const categories = fs.readdirSync(GLOSSARY_ROOT)
      .filter(item => {
        const stat = fs.statSync(path.join(GLOSSARY_ROOT, item));
        return stat.isDirectory() && !item.startsWith('_');
      });

    for (const cat of categories) {
      const subcats = fs.readdirSync(path.join(GLOSSARY_ROOT, cat))
        .filter(item => {
          const stat = fs.statSync(path.join(GLOSSARY_ROOT, cat, item));
          return stat.isDirectory();
        });

      console.log(`  ${cat}/`);
      for (const subcat of subcats) {
        const files = fs.readdirSync(path.join(GLOSSARY_ROOT, cat, subcat))
          .filter(f => f.endsWith('.md')).length;
        console.log(`    ${subcat}/ (${files} entries)`);
      }
    }
  }
}

main().catch(console.error);
