/**
 * TODO synchronization between original and translations
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { TodoItem } from './types.js';
import { getProjectRoot } from './config.js';
import { parseReadme, getReadmePath } from './readme-parser.js';

/**
 * Tags that sync from original to translations
 */
const DOWNSTREAM_TAGS = ['RSR-NEEDED', 'LAN-UPDATE', 'CRITICAL'];

/**
 * Tags that sync from translations to original
 */
const UPSTREAM_TAGS = ['RSR-PROPOSE', 'LAN-PROPOSE', 'CRITICAL'];

/**
 * Get all language directories (excluding original)
 */
function getLanguages(): string[] {
  const root = getProjectRoot();
  const contentPath = join(root, 'content');

  if (!existsSync(contentPath)) {
    return [];
  }

  return readdirSync(contentPath)
    .filter(d => d !== '_original' && !d.startsWith('.') && d !== 'HASHTAGS.md')
    .filter(d => existsSync(join(contentPath, d)) &&
                 readdirSync(join(contentPath, d)).some(f => /^\d{3}$/.test(f)));
}

/**
 * Extract TODOs from a README that should sync
 */
function extractSyncableTodos(
  readmePath: string,
  direction: 'upstream' | 'downstream'
): TodoItem[] {
  const data = parseReadme(readmePath);
  if (!data) return [];

  const tags = direction === 'upstream' ? UPSTREAM_TAGS : DOWNSTREAM_TAGS;
  const todos = direction === 'upstream' ? data.todosPropose : [...data.todosFromOriginal, ...data.todosLocal];

  return todos.filter(t => tags.some(tag => t.tag.includes(tag)));
}

/**
 * Update the synced section in a README
 */
function updateSyncSection(
  readmePath: string,
  todos: TodoItem[],
  sectionMarker: 'ORIGINAL' | 'TRANSLATIONS'
): boolean {
  if (!existsSync(readmePath)) {
    return false;
  }

  let content = readFileSync(readmePath, 'utf-8');

  const beginMarker = `<!-- BEGIN:SYNC:${sectionMarker} -->`;
  const endMarker = `<!-- END:SYNC:${sectionMarker} -->`;

  const beginIndex = content.indexOf(beginMarker);
  const endIndex = content.indexOf(endMarker);

  if (beginIndex === -1 || endIndex === -1) {
    return false;
  }

  // Format todos as markdown list
  const todoList = todos.length > 0
    ? todos.map(t => `- [ ] \`${t.tag}\` ${t.entry || ''}: ${t.description}`).join('\n')
    : '<!-- No synced items -->';

  const newContent =
    content.slice(0, beginIndex + beginMarker.length) +
    '\n' + todoList + '\n' +
    content.slice(endIndex);

  writeFileSync(readmePath, newContent);
  return true;
}

/**
 * Sync TODOs for a specific carnet
 */
export function syncCarnetTodos(carnet: string): {
  synced: boolean;
  downstreamCount: number;
  upstreamCount: number;
} {
  const result = { synced: false, downstreamCount: 0, upstreamCount: 0 };
  const languages = getLanguages();

  // Get original README
  const originalPath = getReadmePath('_original', carnet);
  if (!existsSync(originalPath)) {
    return result;
  }

  // Extract TODOs from original for downstream sync
  const downstreamTodos = extractSyncableTodos(originalPath, 'downstream');
  result.downstreamCount = downstreamTodos.length;

  // Collect upstream proposals from all languages
  const upstreamTodos: TodoItem[] = [];

  for (const lang of languages) {
    const langPath = getReadmePath(lang, carnet);

    // Downstream: Push original TODOs to translations
    if (downstreamTodos.length > 0) {
      updateSyncSection(langPath, downstreamTodos, 'ORIGINAL');
    }

    // Upstream: Collect proposals
    const proposals = extractSyncableTodos(langPath, 'upstream');
    upstreamTodos.push(...proposals);
  }

  // Update original with collected proposals
  if (upstreamTodos.length > 0) {
    updateSyncSection(originalPath, upstreamTodos, 'TRANSLATIONS');
    result.upstreamCount = upstreamTodos.length;
  }

  result.synced = true;
  return result;
}

/**
 * Sync TODOs for all carnets in a language
 */
export function syncLanguageTodos(language: string): {
  carnets: number;
  totalDownstream: number;
  totalUpstream: number;
} {
  const root = getProjectRoot();
  const langDir = language;
  const langPath = join(root, 'content', langDir);

  const result = { carnets: 0, totalDownstream: 0, totalUpstream: 0 };

  if (!existsSync(langPath)) {
    return result;
  }

  const carnets = readdirSync(langPath).filter(d => /^\d{3}$/.test(d));

  for (const carnet of carnets) {
    const syncResult = syncCarnetTodos(carnet);
    if (syncResult.synced) {
      result.carnets++;
      result.totalDownstream += syncResult.downstreamCount;
      result.totalUpstream += syncResult.upstreamCount;
    }
  }

  return result;
}

/**
 * Full sync: all carnets, all languages
 */
export function syncAllTodos(): {
  carnets: number;
  downstream: number;
  upstream: number;
} {
  const root = getProjectRoot();
  const originalPath = join(root, 'content', '_original');

  const result = { carnets: 0, downstream: 0, upstream: 0 };

  if (!existsSync(originalPath)) {
    return result;
  }

  const carnets = readdirSync(originalPath).filter(d => /^\d{3}$/.test(d));

  for (const carnet of carnets) {
    const syncResult = syncCarnetTodos(carnet);
    if (syncResult.synced) {
      result.carnets++;
      result.downstream += syncResult.downstreamCount;
      result.upstream += syncResult.upstreamCount;
    }
  }

  return result;
}
