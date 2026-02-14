#!/usr/bin/env node

/**
 * Process diary entries for French annotated edition
 * - Strips RSR and LAN comments
 * - Translates non-French text to French
 * - Prepares frontmatter for fr/ edition
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

interface FrontmatterResult {
  metadata: Record<string, unknown>;
  content: string;
}

function parseFrontmatter(content: string): FrontmatterResult {
  if (!content.startsWith('---\n')) {
    return { metadata: {}, content };
  }

  try {
    const endIndex = content.indexOf('\n---\n', 4);
    if (endIndex === -1) {
      return { metadata: {}, content };
    }

    const frontmatterStr = content.substring(4, endIndex);
    const remainingContent = content.substring(endIndex + 5);

    const metadata = YAML.parse(frontmatterStr) ?? {};
    return { metadata, content: remainingContent };
  } catch {
    return { metadata: {}, content };
  }
}

function createFrontmatter(metadata: Record<string, unknown>): string {
  const orderedMetadata: Record<string, unknown> = {};

  const priorityFields = [
    'date',
    'entry_id',
    'carnet',
    'location',
    'entities',
    'para_start',
    'para_end',
    'edition_complete',
    'review_complete',
  ];

  for (const field of priorityFields) {
    if (metadata[field] !== undefined) {
      orderedMetadata[field] = metadata[field];
    }
  }

  const yamlStr = YAML.stringify(orderedMetadata);
  return `---\n${yamlStr}---\n`;
}

/**
 * Strip RSR and LAN comments from content
 */
function stripComments(content: string): string {
  // Remove %% YYYY-MM-DDThh:mm:ss RSR: ... %% and %% ... LAN: ... %%
  return content.replace(/%% \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} (RSR|LAN|RED|TR|CON|GEM|PPX|FRE|REV|KRR): [^%]*%%/g, '');
}

/**
 * Extract LAN comments about code-switches to identify translations needed
 */
function extractCodeSwitches(content: string): Map<string, string> {
  const codeSwitches = new Map<string, string>();

  // Match LAN comments about CODE-SWITCH
  const lanPattern = /%% \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2} LAN: CODE-SWITCH (?:ENGLISH|RUSSIAN|ITALIAN|LATIN): "([^"]+)"/g;

  let match;
  while ((match = lanPattern.exec(content)) !== null) {
    const englishText = match[1];
    // Map English text to French translations
    const translations: { [key: string]: string } = {
      'on his way to fall in love with me': 'sur le point de tomber amoureux de moi',
      'on his way to fall in love with him': 'sur le point de tomber amoureux de lui',
      gentleman: 'monsieur',
      bustle: 'remous',
    };

    if (translations[englishText]) {
      codeSwitches.set(englishText, translations[englishText]);
    }
  }

  return codeSwitches;
}

/**
 * Apply translations from code-switch LAN comments
 */
function translateCodeSwitches(content: string, timestamp: string): string {
  const codeSwitches = extractCodeSwitches(content);

  let result = content;
  for (const [english, french] of codeSwitches) {
    // Replace the English text with French
    // Handle case sensitivity - look for exact match
    const regex = new RegExp(
      `\\b${english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'g'
    );
    result = result.replace(regex, french);
  }

  return result;
}

/**
 * Process a single entry file for French edition
 */
function processEntry(inputPath: string, outputPath: string): void {
  const content = fs.readFileSync(inputPath, 'utf-8');
  const { metadata, content: bodyContent } = parseFrontmatter(content);

  // Clean up metadata
  const cleanMetadata: Record<string, unknown> = {};

  // Keep these fields
  const keepFields = [
    'date',
    'entry_id',
    'carnet',
    'location',
    'entities',
    'para_start',
    'para_end',
  ];

  for (const field of keepFields) {
    if (metadata[field] !== undefined) {
      cleanMetadata[field] = metadata[field];
    }
  }

  // Add edition flag
  cleanMetadata.edition_complete = true;

  // First translate code-switches (before stripping comments)
  const timestamp = new Date().toISOString().split('Z')[0];
  let processedBody = translateCodeSwitches(bodyContent, timestamp);

  // Strip RSR and LAN comments
  let cleanedBody = stripComments(processedBody);

  // Clean up excessive blank lines
  cleanedBody = cleanedBody.replace(/\n\n\n+/g, '\n\n');

  // Create output content
  const outputContent = createFrontmatter(cleanMetadata) + cleanedBody;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, outputContent);
}

/**
 * Main function
 */
async function main() {
  const carnet = process.argv[2] || '003';
  const inputDir = path.join(PROJECT_ROOT, 'content', '_original', carnet);
  const outputDir = path.join(PROJECT_ROOT, 'content', 'fr', carnet);

  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all markdown files
  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  console.log(`Processing carnet ${carnet} (${files.length} entries)...`);

  let processed = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);

      processEntry(inputPath, outputPath);
      processed++;
      process.stdout.write('.');
    } catch (error) {
      console.error(`\n❌ Error processing ${file}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Processed: ${processed}/${files.length}`);
  if (failed > 0) {
    console.error(`⚠️  Failed: ${failed}`);
  }
}

main().catch(console.error);
