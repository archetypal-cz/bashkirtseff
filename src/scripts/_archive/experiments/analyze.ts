#!/usr/bin/env npx tsx

/**
 * Analyze experiment results
 *
 * Reads evaluation scores and produces comparison tables.
 *
 * Usage:
 *   npx tsx src/scripts/experiments/analyze.ts <run-dir>
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Score } from './config.js';

interface EvalResult {
  entryKey: string;
  formatId: string;
  modelId: string;
  promptId: string;
  judgeId: string;
  evalPromptId: string;
  scores: Score | null;
  error?: string;
}

// ── Aggregation ────────────────────────────────────────────────────────────

interface AggregatedScore {
  naturalness: number;
  wordOrder: number;
  flow: number;
  accuracy: number;
  voice: number;
  overall: number;
  count: number;
}

function aggregate(results: EvalResult[]): AggregatedScore {
  const withScores = results.filter((r) => r.scores);
  if (withScores.length === 0) {
    return { naturalness: 0, wordOrder: 0, flow: 0, accuracy: 0, voice: 0, overall: 0, count: 0 };
  }

  const sum = { naturalness: 0, wordOrder: 0, flow: 0, accuracy: 0, voice: 0 };
  for (const r of withScores) {
    const s = r.scores!;
    sum.naturalness += s.naturalness;
    sum.wordOrder += s.wordOrder;
    sum.flow += s.flow;
    sum.accuracy += s.accuracy;
    sum.voice += s.voice;
  }

  const n = withScores.length;
  const avg = {
    naturalness: sum.naturalness / n,
    wordOrder: sum.wordOrder / n,
    flow: sum.flow / n,
    accuracy: sum.accuracy / n,
    voice: sum.voice / n,
    overall: 0,
    count: n,
  };
  avg.overall = (avg.naturalness + avg.wordOrder + avg.flow + avg.accuracy + avg.voice) / 5;
  return avg;
}

function fmt(n: number): string {
  return n.toFixed(1);
}

// ── Grouping ───────────────────────────────────────────────────────────────

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

// ── Report generation ──────────────────────────────────────────────────────

function generateReport(results: EvalResult[]): string {
  const lines: string[] = [];

  const valid = results.filter((r) => r.scores);
  lines.push(`# Experiment Analysis`);
  lines.push(`\nTotal evaluations: ${results.length} (${valid.length} with scores, ${results.length - valid.length} failed)\n`);

  // ── Overall ──
  const overall = aggregate(valid);
  lines.push(`## Overall Average`);
  lines.push(`\n| Metric | Score |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Naturalness | ${fmt(overall.naturalness)} |`);
  lines.push(`| Word Order | ${fmt(overall.wordOrder)} |`);
  lines.push(`| Flow | ${fmt(overall.flow)} |`);
  lines.push(`| Accuracy | ${fmt(overall.accuracy)} |`);
  lines.push(`| Voice | ${fmt(overall.voice)} |`);
  lines.push(`| **Overall** | **${fmt(overall.overall)}** |`);

  // ── By Format ──
  lines.push(`\n## By Format (averaged across models, prompts, judges)`);
  const byFormat = groupBy(valid, (r) => r.formatId);
  lines.push(`\n| Format | Natural | WordOrd | Flow | Accuracy | Voice | **Overall** | N |`);
  lines.push(`|--------|---------|---------|------|----------|-------|-------------|---|`);
  for (const [key, items] of [...byFormat.entries()].sort()) {
    const agg = aggregate(items);
    lines.push(`| ${key} | ${fmt(agg.naturalness)} | ${fmt(agg.wordOrder)} | ${fmt(agg.flow)} | ${fmt(agg.accuracy)} | ${fmt(agg.voice)} | **${fmt(agg.overall)}** | ${agg.count} |`);
  }

  // ── By Model ──
  lines.push(`\n## By Model (averaged across formats, prompts, judges)`);
  const byModel = groupBy(valid, (r) => r.modelId);
  lines.push(`\n| Model | Natural | WordOrd | Flow | Accuracy | Voice | **Overall** | N |`);
  lines.push(`|-------|---------|---------|------|----------|-------|-------------|---|`);
  for (const [key, items] of [...byModel.entries()].sort()) {
    const agg = aggregate(items);
    lines.push(`| ${key} | ${fmt(agg.naturalness)} | ${fmt(agg.wordOrder)} | ${fmt(agg.flow)} | ${fmt(agg.accuracy)} | ${fmt(agg.voice)} | **${fmt(agg.overall)}** | ${agg.count} |`);
  }

  // ── By Prompt ──
  lines.push(`\n## By Prompt (averaged across formats, models, judges)`);
  const byPrompt = groupBy(valid, (r) => r.promptId);
  lines.push(`\n| Prompt | Natural | WordOrd | Flow | Accuracy | Voice | **Overall** | N |`);
  lines.push(`|--------|---------|---------|------|----------|-------|-------------|---|`);
  for (const [key, items] of [...byPrompt.entries()].sort()) {
    const agg = aggregate(items);
    lines.push(`| ${key} | ${fmt(agg.naturalness)} | ${fmt(agg.wordOrder)} | ${fmt(agg.flow)} | ${fmt(agg.accuracy)} | ${fmt(agg.voice)} | **${fmt(agg.overall)}** | ${agg.count} |`);
  }

  // ── By Judge (inter-rater reliability) ──
  lines.push(`\n## By Judge (to check inter-rater agreement)`);
  const byJudge = groupBy(valid, (r) => r.judgeId);
  lines.push(`\n| Judge | Natural | WordOrd | Flow | Accuracy | Voice | **Overall** | N |`);
  lines.push(`|-------|---------|---------|------|----------|-------|-------------|---|`);
  for (const [key, items] of [...byJudge.entries()].sort()) {
    const agg = aggregate(items);
    lines.push(`| ${key} | ${fmt(agg.naturalness)} | ${fmt(agg.wordOrder)} | ${fmt(agg.flow)} | ${fmt(agg.accuracy)} | ${fmt(agg.voice)} | **${fmt(agg.overall)}** | ${agg.count} |`);
  }

  // ── CLI vs API comparison ──
  lines.push(`\n## CLI vs API (system prompt effect)`);
  const cliResults = valid.filter((r) => r.modelId.endsWith('-cli'));
  const apiResults = valid.filter((r) => r.modelId.endsWith('-api'));
  if (cliResults.length > 0 && apiResults.length > 0) {
    const cliAgg = aggregate(cliResults);
    const apiAgg = aggregate(apiResults);
    lines.push(`\n| Channel | Natural | WordOrd | Flow | Accuracy | Voice | **Overall** | N |`);
    lines.push(`|---------|---------|---------|------|----------|-------|-------------|---|`);
    lines.push(`| CLI | ${fmt(cliAgg.naturalness)} | ${fmt(cliAgg.wordOrder)} | ${fmt(cliAgg.flow)} | ${fmt(cliAgg.accuracy)} | ${fmt(cliAgg.voice)} | **${fmt(cliAgg.overall)}** | ${cliAgg.count} |`);
    lines.push(`| API | ${fmt(apiAgg.naturalness)} | ${fmt(apiAgg.wordOrder)} | ${fmt(apiAgg.flow)} | ${fmt(apiAgg.accuracy)} | ${fmt(apiAgg.voice)} | **${fmt(apiAgg.overall)}** | ${apiAgg.count} |`);
  } else {
    lines.push(`\nInsufficient data for CLI vs API comparison.`);
  }

  // ── Format × Model matrix ──
  lines.push(`\n## Format × Model Matrix (overall score)`);
  const formatKeys = [...byFormat.keys()].sort();
  const modelKeys = [...byModel.keys()].sort();
  lines.push(`\n| | ${formatKeys.join(' | ')} |`);
  lines.push(`|${'-|'.repeat(formatKeys.length + 1)}`);
  for (const modelKey of modelKeys) {
    const cells = formatKeys.map((fk) => {
      const matching = valid.filter((r) => r.modelId === modelKey && r.formatId === fk);
      if (matching.length === 0) return '-';
      return fmt(aggregate(matching).overall);
    });
    lines.push(`| ${modelKey} | ${cells.join(' | ')} |`);
  }

  return lines.join('\n');
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const runDir = process.argv[2];
  if (!runDir) {
    console.error('Usage: analyze.ts <run-dir>');
    process.exit(1);
  }

  const scoresPath = path.join(runDir, 'scores.json');
  if (!fs.existsSync(scoresPath)) {
    console.error(`Scores not found: ${scoresPath}`);
    console.error('Run evaluate.ts first.');
    process.exit(1);
  }

  const results: EvalResult[] = JSON.parse(fs.readFileSync(scoresPath, 'utf-8'));
  const report = generateReport(results);

  // Save report
  const reportPath = path.join(runDir, 'analysis.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  // Also print to stdout
  console.log(report);
  console.log(`\nSaved to: ${reportPath}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
