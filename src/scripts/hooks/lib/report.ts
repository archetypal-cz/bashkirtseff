/**
 * Report generation utilities for team run reports
 *
 * Generates draft reports from git history and session metadata.
 * Reports are written to .claude/reports/ and committed to the repo.
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getProjectRoot, getTimestamp, loadWorkerConfig } from './config.js';
import type { RunReport } from './types.js';

/**
 * Get git short hash for a file (last commit that touched it)
 */
export function getFileHash(filePath: string): string {
  try {
    const root = getProjectRoot();
    return execSync(`git log --format="%h" -1 -- "${filePath}"`, {
      cwd: root,
      encoding: 'utf-8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get git hashes for all skill files used in recent commits
 */
export function getSkillVersions(skillNames: string[]): Record<string, string> {
  const versions: Record<string, string> = {};
  for (const name of skillNames) {
    const skillPath = `.claude/skills/${name}/SKILL.md`;
    versions[name] = getFileHash(skillPath);
  }
  return versions;
}

/**
 * Detect which languages and carnets were modified in recent session
 * Looks at git log since a given timestamp or recent commits
 */
export function detectSessionWork(sinceTimestamp?: string): {
  languages: string[];
  carnets: Record<string, string[]>;
  commitCount: number;
  filesChanged: number;
} {
  const root = getProjectRoot();
  const sinceArg = sinceTimestamp ? `--since="${sinceTimestamp}"` : '-20';

  try {
    const log = execSync(
      `git log ${sinceArg} --name-only --format="" -- content/`,
      { cwd: root, encoding: 'utf-8' }
    );

    const files = log.split('\n').filter(Boolean);
    const langCarnets: Record<string, Set<string>> = {};

    for (const file of files) {
      const match = file.match(/content\/([a-z]{2})\/(\d{3})\//);
      if (match) {
        const [, lang, carnet] = match;
        if (!langCarnets[lang]) langCarnets[lang] = new Set();
        langCarnets[lang].add(carnet);
      }
    }

    const commitLog = execSync(
      `git log ${sinceArg} --oneline -- content/`,
      { cwd: root, encoding: 'utf-8' }
    );
    const commitCount = commitLog.split('\n').filter(Boolean).length;

    const result: Record<string, string[]> = {};
    for (const [lang, carnets] of Object.entries(langCarnets)) {
      result[lang] = [...carnets].sort();
    }

    return {
      languages: Object.keys(result),
      carnets: result,
      commitCount,
      filesChanged: new Set(files).size,
    };
  } catch {
    return { languages: [], carnets: {}, commitCount: 0, filesChanged: 0 };
  }
}

/**
 * Detect which pipeline stages ran based on commit messages
 */
export function detectPipeline(sinceTimestamp?: string): string[] {
  const root = getProjectRoot();
  const sinceArg = sinceTimestamp ? `--since="${sinceTimestamp}"` : '-20';

  try {
    const log = execSync(
      `git log ${sinceArg} --format="%s" -- content/`,
      { cwd: root, encoding: 'utf-8' }
    );

    const messages = log.toLowerCase();
    const stages: string[] = [];

    if (messages.includes('tr:') || messages.includes('translation')) stages.push('translator');
    if (messages.includes('gem') || messages.includes('gemini')) stages.push('gemini-editor');
    if (messages.includes('red') || messages.includes('editor')) stages.push('editor');
    if (messages.includes('con') || messages.includes('conductor')) stages.push('conductor');

    return stages;
  } catch {
    return [];
  }
}

/**
 * Count entry files per carnet for a language
 */
export function countEntries(lang: string, carnet: string): number {
  const root = getProjectRoot();
  const dir = join(root, 'content', lang, carnet);

  if (!existsSync(dir)) return 0;

  try {
    return readdirSync(dir).filter(
      f => f.endsWith('.md') && !['README.md', 'CLAUDE.md'].includes(f)
    ).length;
  } catch {
    return 0;
  }
}

/**
 * Generate a report filename
 */
export function generateReportFilename(
  lang: string,
  carnets: string[],
  date?: string
): string {
  const d = date || new Date().toISOString().split('T')[0];
  const carnetRange =
    carnets.length <= 3
      ? carnets.join('-')
      : `${carnets[0]}-${carnets[carnets.length - 1]}`;

  const root = getProjectRoot();
  const reportsDir = join(root, '.claude', 'reports');
  let filename = `${d}-${lang}-${carnetRange}.md`;

  // Handle duplicates
  let seq = 1;
  while (existsSync(join(reportsDir, filename))) {
    seq++;
    filename = `${d}-${lang}-${carnetRange}-${seq}.md`;
  }

  return filename;
}

/**
 * Generate a draft report stub from session data
 */
export async function generateReportStub(): Promise<string | null> {
  const config = await loadWorkerConfig();
  const operator = config?.github_user ? `@${config.github_user}` : 'unknown';
  const sessionStart = config?.session?.started_at || undefined;

  const work = detectSessionWork(sessionStart);

  // Only generate if there was actual translation/content work
  if (work.languages.length === 0) return null;

  const pipeline = detectPipeline(sessionStart);
  const skillNames = pipeline.length > 0 ? pipeline : ['translator'];
  const skillVersions = getSkillVersions(skillNames);

  // Build results table
  const resultsRows: string[] = [];
  for (const lang of work.languages) {
    const carnets = work.carnets[lang] || [];
    for (const carnet of carnets) {
      const entries = countEntries(lang, carnet);
      resultsRows.push(
        `| ${carnet} | ${entries} | — | — | — |`
      );
    }
  }

  const primaryLang = work.languages[0];
  const allCarnets = work.carnets[primaryLang] || [];
  const filename = generateReportFilename(primaryLang, allCarnets);

  const skillHashLines = Object.entries(skillVersions)
    .map(([name, hash]) => `  ${name}: ${hash}`)
    .join('\n');

  const report = `---
date: ${new Date().toISOString().split('T')[0]}
operator: "${operator}"
duration_minutes: ~${sessionStart ? Math.round((Date.now() - new Date(sessionStart).getTime()) / 60000) : '?'}
target_language: ${primaryLang}
carnets: [${allCarnets.map(c => `"${c}"`).join(', ')}]
pipeline: [${pipeline.join(', ')}]
skills:
${skillHashLines}
status: draft
---

# Team Run Report: ${primaryLang.toUpperCase()} ${allCarnets.join(', ')}

> **DRAFT** — auto-generated by session-end hook. Fill in agent lifecycle, issues, and observations.

## Configuration

- **Skills used**: ${pipeline.join(', ')}
- **Models**: (fill in)
- **Team structure**: (fill in)

## Results

| Carnet | Entries | Agent | Duration | Issues |
|--------|---------|-------|----------|--------|
${resultsRows.join('\n')}

## Agent Lifecycle

(Fill in: how each agent behaved — normal completion, stuck, crashed, interrupted)

## Issues Encountered

(Fill in: reference WATCHLIST.md categories)

## Observations

(Fill in: quality notes, patterns, surprises)

## Proposed Changes

(Fill in: specific skill improvements suggested by this run)
`;

  // Write the report
  const root = getProjectRoot();
  const reportsDir = join(root, '.claude', 'reports');
  const reportPath = join(reportsDir, filename);
  writeFileSync(reportPath, report, 'utf-8');

  return filename;
}
