/**
 * Report generation utilities for team run reports
 *
 * Generates draft reports from git history and session metadata.
 * Reports are written to .claude/reports/ and committed to the repo.
 *
 * Unfilled-stub gate: a new stub is NOT written while any report in the
 * directory is still an unfilled stub (`status: draft` + template placeholder
 * text). The hook prints the offending path(s) instead and appends a one-line
 * "Also touched" note to the newest unfilled stub so the refused session's
 * scope is not lost. Escape hatch: `REPORT_HOOK_FORCE=1` writes the stub anyway.
 */

import { execSync } from 'child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
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
  date?: string,
  reportsDir: string = join(getProjectRoot(), '.claude', 'reports')
): string {
  const d = date || new Date().toISOString().split('T')[0];
  const carnetRange =
    carnets.length <= 3
      ? carnets.join('-')
      : `${carnets[0]}-${carnets[carnets.length - 1]}`;

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
 * Build the Results table rows for ONE language tree.
 *
 * The report is scoped to a single `target_language`, so the rows must come
 * from that tree only. An earlier version looped over every language the
 * session touched and pushed a `| carnet | … |` row per (lang, carnet) pair;
 * since the row carries no language column, a carnet edited in cz, uk and en
 * appeared three times (see .claude/reports drafts of 2026-09-05..07, rows
 * repeated 3-5x). Each carnet is emitted exactly once, in sorted order.
 */
export function buildResultsRows(
  lang: string,
  carnets: string[],
  count: (lang: string, carnet: string) => number = countEntries
): string[] {
  const seen = new Set<string>();
  const rows: string[] = [];
  for (const carnet of [...carnets].sort()) {
    if (seen.has(carnet)) continue;
    seen.add(carnet);
    rows.push(`| ${carnet} | ${count(lang, carnet)} | — | — | — |`);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Stub gate: never write a fresh draft while an unfilled one is lying around
// ---------------------------------------------------------------------------

/**
 * Environment variable that bypasses the unfilled-stub gate.
 * `REPORT_HOOK_FORCE=1` (or `true` / `yes`) writes a new stub even when
 * unfilled drafts exist. Inherited from the shell that launched Claude Code.
 */
export const REPORT_HOOK_FORCE_ENV = 'REPORT_HOOK_FORCE';

/** `true` when the force escape hatch is set in `env`. */
export function isForceRequested(env: NodeJS.ProcessEnv = process.env): boolean {
  const v = (env[REPORT_HOOK_FORCE_ENV] || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Placeholder strings the template below writes into a fresh stub. A draft
 * that still contains any of them has not been filled in. Both the template
 * and the detector use these constants so they cannot drift apart.
 */
export const STUB_PLACEHOLDER = '(fill in)';
export const STUB_SECTION_PLACEHOLDER = '(Fill in:';
const STUB_PLACEHOLDERS = [STUB_PLACEHOLDER, STUB_SECTION_PLACEHOLDER];

/** Prefix of the note appended to an unfilled stub when a new one is refused. */
export const ALSO_TOUCHED_PREFIX = '> **Also touched**';

/** Files in the reports dir that are not reports. */
const NON_REPORT_FILES = new Set(['README.md', 'WATCHLIST.md']);

/**
 * A report is an unfilled stub when its frontmatter says `status: draft`
 * and its body still carries a template placeholder. A draft whose sections
 * were written but whose status was never flipped is NOT counted — the
 * operator did the work, only the flag lags.
 */
export function isUnfilledStub(content: string): boolean {
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return false;
  if (!/^status:\s*draft\b/m.test(fm[1])) return false;
  const body = content.slice(fm[0].length);
  return STUB_PLACEHOLDERS.some((p) => body.includes(p));
}

/**
 * Unfilled stubs in `reportsDir`, newest first (filenames start with the
 * date, so a reverse lexical sort is a reverse chronological one).
 */
export function findUnfilledStubs(reportsDir: string): string[] {
  if (!existsSync(reportsDir)) return [];
  const names = readdirSync(reportsDir).filter(
    (f) => f.endsWith('.md') && !NON_REPORT_FILES.has(f)
  );
  const unfilled: string[] = [];
  for (const name of names) {
    try {
      if (isUnfilledStub(readFileSync(join(reportsDir, name), 'utf-8'))) unfilled.push(name);
    } catch {
      // unreadable — ignore
    }
  }
  return unfilled.sort().reverse();
}

/**
 * Record what a refused stub would have covered inside the newest unfilled
 * stub, so the information survives past the session's stderr. Appends one
 * line; a second call with the same line (the Stop hook fires on every turn)
 * is a no-op. Returns whether a line was appended.
 */
export function noteAlsoTouched(stubPath: string, date: string, summary: string): boolean {
  const line = `${ALSO_TOUCHED_PREFIX} (${date}, session-end hook): ${summary} — no new stub written while this one is unfilled.`;
  let existing = '';
  try {
    existing = readFileSync(stubPath, 'utf-8');
  } catch {
    return false;
  }
  if (existing.includes(line)) return false;
  const sep = existing.endsWith('\n') ? '\n' : '\n\n';
  appendFileSync(stubPath, `${sep}${line}\n`, 'utf-8');
  return true;
}

/** Human-readable refusal for the hook's stderr box. */
export function formatStubRefusal(
  unfilled: string[],
  notedIn: string | null,
  summary: string,
  relDir = '.claude/reports'
): string[] {
  const shown = unfilled.slice(0, 5);
  const lines = [
    `No new run report stub: ${unfilled.length} unfilled draft stub${unfilled.length === 1 ? '' : 's'} already exist${unfilled.length === 1 ? 's' : ''}.`,
    ...shown.map((f) => `  ${relDir}/${f}`),
  ];
  if (unfilled.length > shown.length) lines.push(`  … and ${unfilled.length - shown.length} more`);
  lines.push(
    notedIn
      ? `This session (${summary}) was noted as "also touched" in ${relDir}/${notedIn}.`
      : `This session covered: ${summary}.`
  );
  lines.push(
    `Fill them in (status: final) or delete them before a new stub will be generated; ${REPORT_HOOK_FORCE_ENV}=1 overrides.`
  );
  return lines;
}

// ---------------------------------------------------------------------------
// Stub generation
// ---------------------------------------------------------------------------

/** Everything the template needs, gathered from git + worker config. */
export interface StubInput {
  date: string;
  operator: string;
  durationMinutes: number | '?';
  lang: string;
  carnets: string[];
  pipeline: string[];
  skillVersions: Record<string, string>;
  /** `(lang, carnet) => entry count` — injectable for tests. */
  countEntries?: (lang: string, carnet: string) => number;
}

/** One-line description of the stub's scope, e.g. `cz 001, 018, 095`. */
export function stubSummary(input: Pick<StubInput, 'lang' | 'carnets'>): string {
  return `${input.lang} ${input.carnets.join(', ') || '(no carnets)'}`;
}

/**
 * Collect session data from git history and WORKER_CONFIG.yaml.
 * Returns null when the session touched no content tree.
 */
export async function gatherStubInput(): Promise<StubInput | null> {
  const config = await loadWorkerConfig();
  const operator = config?.github_user ? `@${config.github_user}` : 'unknown';
  const sessionStart = config?.session?.started_at || undefined;

  const work = detectSessionWork(sessionStart);
  if (work.languages.length === 0) return null;

  const pipeline = detectPipeline(sessionStart);
  const skillNames = pipeline.length > 0 ? pipeline : ['translator'];

  // The report describes ONE language (frontmatter target_language), so the
  // results table lists that tree's carnets only — see buildResultsRows.
  const lang = work.languages[0];
  return {
    date: new Date().toISOString().split('T')[0],
    operator,
    durationMinutes: sessionStart
      ? Math.round((Date.now() - new Date(sessionStart).getTime()) / 60000)
      : '?',
    lang,
    carnets: work.carnets[lang] || [],
    pipeline,
    skillVersions: getSkillVersions(skillNames),
  };
}

/** Render the draft report markdown (pure). */
export function renderReportStub(input: StubInput): string {
  const resultsRows = buildResultsRows(input.lang, input.carnets, input.countEntries);
  const skillHashLines = Object.entries(input.skillVersions)
    .map(([name, hash]) => `  ${name}: ${hash}`)
    .join('\n');

  return `---
date: ${input.date}
operator: "${input.operator}"
duration_minutes: ~${input.durationMinutes}
target_language: ${input.lang}
carnets: [${input.carnets.map((c) => `"${c}"`).join(', ')}]
pipeline: [${input.pipeline.join(', ')}]
skills:
${skillHashLines}
status: draft
---

# Team Run Report: ${input.lang.toUpperCase()} ${input.carnets.join(', ')}

> **DRAFT** — auto-generated by session-end hook. Fill in agent lifecycle, issues, and observations.

## Configuration

- **Skills used**: ${input.pipeline.join(', ')}
- **Models**: ${STUB_PLACEHOLDER}
- **Team structure**: ${STUB_PLACEHOLDER}

## Results

| Carnet | Entries | Agent | Duration | Issues |
|--------|---------|-------|----------|--------|
${resultsRows.join('\n')}

## Agent Lifecycle

${STUB_SECTION_PLACEHOLDER} how each agent behaved — normal completion, stuck, crashed, interrupted)

## Issues Encountered

${STUB_SECTION_PLACEHOLDER} reference WATCHLIST.md categories)

## Observations

${STUB_SECTION_PLACEHOLDER} quality notes, patterns, surprises)

## Proposed Changes

${STUB_SECTION_PLACEHOLDER} specific skill improvements suggested by this run)
`;
}

export type StubOutcome =
  /** Session touched no content tree — nothing to report. */
  | { kind: 'none' }
  /** A fresh stub was written (filename relative to the reports dir). */
  | { kind: 'written'; filename: string }
  /** Refused: unfilled stubs exist (newest first); `notedIn` got the also-touched line. */
  | { kind: 'refused'; unfilled: string[]; summary: string; notedIn: string | null };

export interface GenerateStubOptions {
  /** Reports directory; defaults to `<project>/.claude/reports`. */
  reportsDir?: string;
  /** Bypass the unfilled-stub gate; defaults to `REPORT_HOOK_FORCE` in the env. */
  force?: boolean;
  /** Session data source; defaults to git + worker config. */
  gather?: () => Promise<StubInput | null>;
}

/**
 * Generate a draft report stub from session data — unless an unfilled stub
 * already exists, in which case refuse (one stub at a time) and note this
 * session's scope inside the newest unfilled stub instead.
 */
export async function generateReportStub(
  opts: GenerateStubOptions = {}
): Promise<StubOutcome> {
  const reportsDir = opts.reportsDir ?? join(getProjectRoot(), '.claude', 'reports');
  const force = opts.force ?? isForceRequested();
  const input = await (opts.gather ?? gatherStubInput)();
  if (!input) return { kind: 'none' };

  const summary = stubSummary(input);
  if (!force) {
    const unfilled = findUnfilledStubs(reportsDir);
    if (unfilled.length > 0) {
      const newest = unfilled[0];
      const noted = noteAlsoTouched(join(reportsDir, newest), input.date, summary);
      return { kind: 'refused', unfilled, summary, notedIn: noted ? newest : null };
    }
  }

  const filename = generateReportFilename(input.lang, input.carnets, input.date, reportsDir);
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(join(reportsDir, filename), renderReportStub(input), 'utf-8');
  return { kind: 'written', filename };
}
