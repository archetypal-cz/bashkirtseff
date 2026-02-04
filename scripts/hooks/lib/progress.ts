/**
 * Progress calculation utilities
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import type { CarnetProgress } from './types.js';
import { getProjectRoot } from './config.js';

interface EntryFrontmatter {
  date?: string;
  carnet?: string;
  research_complete?: boolean;
  linguistic_annotation_complete?: boolean;
  translation_complete?: boolean;
  gemini_reviewed?: boolean;
  editor_approved?: boolean;
  conductor_approved?: boolean;
}

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(filePath: string): EntryFrontmatter | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      return parseYaml(match[1]) as EntryFrontmatter;
    }
  } catch {
    // File not readable or no frontmatter
  }
  return null;
}

/**
 * Calculate progress for a carnet
 */
export function calculateCarnetProgress(
  language: string,
  carnet: string
): CarnetProgress {
  const root = getProjectRoot();
  const langDir = language === 'original' ? '_original' : language;
  const carnetPath = join(root, 'src', langDir, carnet);

  const progress: CarnetProgress = {
    carnet,
    entries: 0,
    research: 0,
    annotation: 0,
    translation: 0,
    gemini: 0,
    edited: 0,
    approved: 0,
  };

  if (!existsSync(carnetPath)) {
    return progress;
  }

  const files = readdirSync(carnetPath).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
  progress.entries = files.length;

  for (const file of files) {
    const fm = parseFrontmatter(join(carnetPath, file));
    if (fm) {
      if (fm.research_complete) progress.research++;
      if (fm.linguistic_annotation_complete) progress.annotation++;
      if (fm.translation_complete) progress.translation++;
      if (fm.gemini_reviewed) progress.gemini++;
      if (fm.editor_approved) progress.edited++;
      if (fm.conductor_approved) progress.approved++;
    }
  }

  return progress;
}

/**
 * Get list of carnets for a language
 */
export function getCarnetList(language: string): string[] {
  const root = getProjectRoot();
  const langDir = language === 'original' ? '_original' : language;
  const langPath = join(root, 'src', langDir);

  if (!existsSync(langPath)) {
    return [];
  }

  return readdirSync(langPath)
    .filter(d => /^\d{3}$/.test(d))
    .sort();
}

/**
 * Calculate overall progress for a language
 */
export function calculateLanguageProgress(language: string): CarnetProgress[] {
  const carnets = getCarnetList(language);
  return carnets.map(c => calculateCarnetProgress(language, c));
}

/**
 * Find next work to do for a language
 */
export function findNextWork(language: string): {
  carnet: string;
  phase: string;
  count: number;
} | null {
  const progresses = calculateLanguageProgress(language);

  for (const p of progresses) {
    if (p.entries === 0) continue;

    // Check phases in order
    if (p.research < p.entries) {
      return { carnet: p.carnet, phase: 'research', count: p.entries - p.research };
    }
    if (p.annotation < p.entries) {
      return { carnet: p.carnet, phase: 'annotation', count: p.entries - p.annotation };
    }
    if (language !== 'original') {
      if (p.translation < p.entries) {
        return { carnet: p.carnet, phase: 'translation', count: p.entries - p.translation };
      }
      if (p.gemini < p.entries) {
        return { carnet: p.carnet, phase: 'gemini', count: p.entries - p.gemini };
      }
      if (p.edited < p.entries) {
        return { carnet: p.carnet, phase: 'editing', count: p.entries - p.edited };
      }
      if (p.approved < p.entries) {
        return { carnet: p.carnet, phase: 'approval', count: p.entries - p.approved };
      }
    }
  }

  return null;
}

/**
 * Format progress as a summary string
 */
export function formatProgressSummary(progress: CarnetProgress): string {
  const pct = (n: number) => progress.entries > 0
    ? Math.round((n / progress.entries) * 100)
    : 0;

  return `Carnet ${progress.carnet}: ${progress.entries} entries | ` +
    `RSR ${pct(progress.research)}% | LAN ${pct(progress.annotation)}% | ` +
    `TR ${pct(progress.translation)}% | GEM ${pct(progress.gemini)}% | ` +
    `ED ${pct(progress.edited)}% | CON ${pct(progress.approved)}%`;
}
