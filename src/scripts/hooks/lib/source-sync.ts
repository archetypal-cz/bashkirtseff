/**
 * Source synchronization - track when originals change and notify translations
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { getProjectRoot, getTimestamp } from './config.js';
import { addChangelogEntry, getReadmePath } from './readme-parser.js';

/**
 * Calculate hash of French content (excluding comments/annotations)
 * This captures the actual diary text that translations are based on
 */
export function calculateSourceHash(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, 'utf-8');

  // Extract just the French text content (not frontmatter, not comments)
  const lines = content.split('\n');
  const textLines: string[] = [];
  let inFrontmatter = false;
  let frontmatterCount = 0;

  for (const line of lines) {
    if (line.trim() === '---') {
      frontmatterCount++;
      inFrontmatter = frontmatterCount === 1;
      continue;
    }
    if (inFrontmatter && frontmatterCount < 2) continue;

    // Skip comment lines (annotations, paragraph IDs, glossary links)
    if (line.trim().startsWith('%%') && line.trim().endsWith('%%')) continue;

    // Skip empty lines for hash stability
    if (line.trim() === '') continue;

    textLines.push(line.trim());
  }

  const textContent = textLines.join('\n');
  return createHash('sha256').update(textContent).digest('hex').slice(0, 16);
}

/**
 * Get the source hash stored in a translation file's frontmatter
 */
export function getStoredSourceHash(translationPath: string): string | null {
  if (!existsSync(translationPath)) {
    return null;
  }

  const content = readFileSync(translationPath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
    return (frontmatter.source_hash as string) || null;
  } catch {
    return null;
  }
}

/**
 * Update source hash in translation file frontmatter
 * If no frontmatter exists, creates minimal frontmatter with just the hash
 */
export function updateSourceHash(translationPath: string, newHash: string): boolean {
  if (!existsSync(translationPath)) {
    return false;
  }

  const content = readFileSync(translationPath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (match) {
    // Frontmatter exists - update it
    try {
      const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
      frontmatter.source_hash = newHash;

      const newFrontmatter = stringifyYaml(frontmatter).trim();
      const newContent = content.replace(
        /^---\n[\s\S]*?\n---/,
        `---\n${newFrontmatter}\n---`
      );

      writeFileSync(translationPath, newContent);
      return true;
    } catch {
      return false;
    }
  } else {
    // No frontmatter - create minimal one
    // Extract date from filename if possible
    const dateMatch = translationPath.match(/(\d{4}-\d{2}-\d{2})\.md$/);
    const carnetMatch = translationPath.match(/\/(\d{3})\//);

    const frontmatter: Record<string, unknown> = {
      source_hash: newHash,
    };

    if (dateMatch) frontmatter.date = dateMatch[1];
    if (carnetMatch) frontmatter.carnet = carnetMatch[1];

    const newFrontmatter = stringifyYaml(frontmatter).trim();
    const newContent = `---\n${newFrontmatter}\n---\n\n${content}`;

    writeFileSync(translationPath, newContent);
    return true;
  }
}

/**
 * Get all language directories that have translations
 */
function getTranslationLanguages(): string[] {
  const root = getProjectRoot();
  const contentPath = join(root, 'content');

  if (!existsSync(contentPath)) {
    return [];
  }

  return readdirSync(contentPath)
    .filter(d => d !== '_original' && !d.startsWith('.') && !d.endsWith('.md'))
    .filter(d => {
      const langPath = join(contentPath, d);
      return existsSync(langPath) &&
             readdirSync(langPath).some(f => /^\d{3}$/.test(f));
    });
}

/**
 * Find translation files for a given original entry
 */
export function findTranslations(originalPath: string): string[] {
  const root = getProjectRoot();
  const translations: string[] = [];

  // Extract carnet and date from path
  const match = originalPath.match(/content\/_original\/(\d{3})\/(\d{4}-\d{2}-\d{2}\.md)$/);
  if (!match) return translations;

  const [, carnet, filename] = match;
  const languages = getTranslationLanguages();

  for (const lang of languages) {
    const translationPath = join(root, 'content', lang, carnet, filename);
    if (existsSync(translationPath)) {
      translations.push(translationPath);
    }
  }

  return translations;
}

/**
 * Check if original has changed and notify translations
 * Returns list of translations that need updating
 */
export function checkSourceChanges(originalPath: string): {
  changed: boolean;
  newHash: string | null;
  outdatedTranslations: Array<{
    path: string;
    language: string;
    oldHash: string | null;
  }>;
} {
  const result = {
    changed: false,
    newHash: null as string | null,
    outdatedTranslations: [] as Array<{
      path: string;
      language: string;
      oldHash: string | null;
    }>,
  };

  const newHash = calculateSourceHash(originalPath);
  if (!newHash) return result;

  result.newHash = newHash;
  const translations = findTranslations(originalPath);

  for (const translationPath of translations) {
    const storedHash = getStoredSourceHash(translationPath);

    // If no hash stored, translation predates this system - skip for now
    if (!storedHash) continue;

    if (storedHash !== newHash) {
      result.changed = true;
      const langMatch = translationPath.match(/content\/([^/]+)\/\d{3}\//);
      result.outdatedTranslations.push({
        path: translationPath,
        language: langMatch ? langMatch[1] : 'unknown',
        oldHash: storedHash,
      });
    }
  }

  return result;
}

/**
 * Add TODO notification to README when source changes
 */
export function notifySourceChange(
  originalPath: string,
  translationLanguage: string,
  carnet: string,
  entryDate: string
): boolean {
  const readmePath = getReadmePath(translationLanguage, carnet);

  if (!existsSync(readmePath)) {
    return false;
  }

  const content = readFileSync(readmePath, 'utf-8');

  // Check if this TODO already exists
  const todoMarker = `RSR-LAN-UPDATE] ${entryDate}:`;
  if (content.includes(todoMarker)) {
    return false; // Already notified
  }

  // Find the "### Local" section and add TODO there
  const localSectionMatch = content.match(/### Local\n([\s\S]*?)(?=\n###|\n## |$)/);
  if (!localSectionMatch) {
    return false;
  }

  const timestamp = getTimestamp();
  const newTodo = `- [ ] \`RSR-LAN-UPDATE\` ${entryDate}: Original source updated (${timestamp}) - review for new annotations\n`;

  const insertPoint = content.indexOf('### Local') + '### Local\n'.length;
  const newContent = content.slice(0, insertPoint) + newTodo + content.slice(insertPoint);

  writeFileSync(readmePath, newContent);
  return true;
}

/**
 * Process an original file edit - check and notify all translations
 */
export function processOriginalEdit(originalPath: string): {
  notified: number;
  languages: string[];
} {
  const result = { notified: 0, languages: [] as string[] };

  const changes = checkSourceChanges(originalPath);
  if (!changes.changed || !changes.outdatedTranslations.length) {
    return result;
  }

  // Extract carnet and date
  const match = originalPath.match(/(\d{3})\/(\d{4}-\d{2}-\d{2})\.md$/);
  if (!match) return result;

  const [, carnet, entryDate] = match;

  for (const outdated of changes.outdatedTranslations) {
    const notified = notifySourceChange(
      originalPath,
      outdated.language,
      carnet,
      entryDate
    );
    if (notified) {
      result.notified++;
      if (!result.languages.includes(outdated.language)) {
        result.languages.push(outdated.language);
      }
    }
  }

  return result;
}
