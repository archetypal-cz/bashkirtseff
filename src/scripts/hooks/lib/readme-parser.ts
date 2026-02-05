/**
 * Parse and update README.md files for progress tracking
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { ReadmeData, TodoItem, ChangelogEntry, CarnetProgress } from './types.js';
import { getTimestamp, getProjectRoot } from './config.js';

/**
 * Parse a carnet README.md file
 */
export function parseReadme(readmePath: string): ReadmeData | null {
  if (!existsSync(readmePath)) {
    return null;
  }

  const content = readFileSync(readmePath, 'utf-8');
  const lines = content.split('\n');

  const data: ReadmeData = {
    carnet: '',
    language: '',
    status: {
      carnet: '',
      entries: 0,
      research: 0,
      annotation: 0,
      translation: 0,
      gemini: 0,
      edited: 0,
      approved: 0,
    },
    todosFromOriginal: [],
    todosLocal: [],
    todosPropose: [],
    whatsDone: [],
    changelog: [],
  };

  // Extract carnet and language from header
  const headerMatch = content.match(/^# Carnet (\d+)/m);
  if (headerMatch) {
    data.carnet = headerMatch[1];
    data.status.carnet = headerMatch[1];
  }

  // Extract worker info
  const workerMatch = content.match(/<!-- WORKER: @(\S+) since (\S+) -->/);
  if (workerMatch) {
    data.worker = workerMatch[1];
    data.workerSince = workerMatch[2];
  }

  // Parse status table
  const tableMatch = content.match(/\| Phase\s+\| Done \| Total \| Worker \|[\s\S]*?(?=\n\n|\n##)/);
  if (tableMatch) {
    const tableLines = tableMatch[0].split('\n').filter(l => l.startsWith('|') && !l.includes('---'));
    for (const line of tableLines.slice(1)) { // Skip header
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        const phase = cells[0].toLowerCase();
        const done = parseInt(cells[1]) || 0;
        const total = parseInt(cells[2]) || 0;

        if (phase.includes('research')) data.status.research = done;
        else if (phase.includes('annotation')) data.status.annotation = done;
        else if (phase.includes('translation')) data.status.translation = done;
        else if (phase.includes('gemini')) data.status.gemini = done;
        else if (phase.includes('edit')) data.status.edited = done;
        else if (phase.includes('approv')) data.status.approved = done;

        if (total > data.status.entries) data.status.entries = total;
      }
    }
  }

  // Parse TODOs
  let inSection = '';
  for (const line of lines) {
    if (line.includes('BEGIN:SYNC:ORIGINAL')) inSection = 'original';
    else if (line.includes('END:SYNC:ORIGINAL')) inSection = '';
    else if (line.includes('BEGIN:SYNC:PROPOSE')) inSection = 'propose';
    else if (line.includes('END:SYNC:PROPOSE')) inSection = '';
    else if (line.match(/^### Local/i)) inSection = 'local';
    else if (line.startsWith('## ')) inSection = '';
    else if (line.startsWith('- [ ]') && inSection) {
      const todoMatch = line.match(/- \[ \] `([^`]+)` (\S+): (.+)/);
      if (todoMatch) {
        const todo: TodoItem = {
          tag: todoMatch[1],
          entry: todoMatch[2],
          description: todoMatch[3],
          source: inSection === 'original' ? 'original' : 'translation',
          syncDirection: inSection === 'propose' ? 'upstream' : inSection === 'original' ? 'downstream' : 'local',
        };
        if (inSection === 'original') data.todosFromOriginal.push(todo);
        else if (inSection === 'local') data.todosLocal.push(todo);
        else if (inSection === 'propose') data.todosPropose.push(todo);
      }
    }
  }

  // Parse changelog
  const changelogMatch = content.match(/## Changelog[\s\S]*$/);
  if (changelogMatch) {
    const changelogSection = changelogMatch[0];
    const entryMatches = changelogSection.matchAll(/### (\d{4}-\d{2}-\d{2}T[\d:]+) @(\S+)\n([\s\S]*?)(?=###|$)/g);
    for (const match of entryMatches) {
      data.changelog.push({
        timestamp: match[1],
        user: match[2],
        description: match[3].trim(),
      });
    }
  }

  return data;
}

/**
 * Add a changelog entry to a README.md file
 */
export function addChangelogEntry(
  readmePath: string,
  user: string,
  description: string
): boolean {
  if (!existsSync(readmePath)) {
    return false;
  }

  const content = readFileSync(readmePath, 'utf-8');
  const timestamp = getTimestamp();

  const newEntry = `\n### ${timestamp} @${user}\n${description}\n`;

  // Find the Changelog section and insert after the header
  const changelogIndex = content.indexOf('## Changelog');
  if (changelogIndex === -1) {
    return false;
  }

  // Find the first ### after ## Changelog, or end of file
  const afterChangelog = content.slice(changelogIndex);
  const firstEntryIndex = afterChangelog.indexOf('\n### ');

  let newContent: string;
  if (firstEntryIndex === -1) {
    // No existing entries, add after the section header
    const insertPoint = changelogIndex + '## Changelog'.length;
    newContent = content.slice(0, insertPoint) + '\n' + newEntry + content.slice(insertPoint);
  } else {
    // Insert before first existing entry
    const insertPoint = changelogIndex + firstEntryIndex;
    newContent = content.slice(0, insertPoint) + newEntry + content.slice(insertPoint);
  }

  writeFileSync(readmePath, newContent);
  return true;
}

/**
 * Update the status table in a README.md file
 */
export function updateStatusTable(
  readmePath: string,
  updates: Partial<CarnetProgress>
): boolean {
  if (!existsSync(readmePath)) {
    return false;
  }

  let content = readFileSync(readmePath, 'utf-8');

  // Update each phase if provided
  const phaseMap: Record<string, keyof CarnetProgress> = {
    'Research': 'research',
    'Annotation': 'annotation',
    'Translation': 'translation',
    'Gemini': 'gemini',
    'Edited': 'edited',
    'Approved': 'approved',
  };

  for (const [phaseName, phaseKey] of Object.entries(phaseMap)) {
    const value = updates[phaseKey];
    if (typeof value === 'number') {
      // Match table row and update done count
      const regex = new RegExp(`(\\| ${phaseName}\\s*\\|\\s*)\\d+(\\s*\\|)`, 'i');
      content = content.replace(regex, `$1${value}$2`);
    }
  }

  writeFileSync(readmePath, content);
  return true;
}

/**
 * Get README path for a carnet
 */
export function getReadmePath(language: string, carnet: string): string {
  const root = getProjectRoot();
  const langDir = language;
  return join(root, 'content', langDir, carnet, 'README.md');
}
