#!/usr/bin/env npx tsx

/**
 * Evaluate experiment outputs
 *
 * Takes model outputs and runs blind evaluation using judge models.
 * Each judge scores each output against the gold standard.
 *
 * Usage:
 *   npx tsx src/scripts/experiments/evaluate.ts <run-dir> [--dry-run] [--judges j1,j2] [--eval-prompts e1,e2]
 *
 * Prerequisites:
 *   - Run run-experiment.ts first to generate outputs
 *   - Gold standard files must exist (specified in config TEST_ENTRIES)
 *   - LiteLLM proxy must be reachable
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { ParagraphParser } from '../../shared/src/parser/paragraph-parser.js';
import { ParagraphRenderer } from '../../shared/src/renderer/paragraph-renderer.js';

import {
  CONTENT_DIR,
  PROMPTS_DIR,
  TEST_ENTRIES,
  JUDGE_MODELS,
  EVAL_PROMPTS,
  DEFAULT_CONFIG,
  type EvalPromptId,
  type Score,
} from './config.js';

const LITELLM_PROXY_URL = process.env.LITELLM_PROXY_URL || 'http://litellm:4000';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || '';

const parser = new ParagraphParser();
const renderer = new ParagraphRenderer();

// ── LiteLLM call ───────────────────────────────────────────────────────────

async function callJudge(model: string, prompt: string): Promise<string> {
  const response = await fetch(`${LITELLM_PROXY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(LITELLM_API_KEY ? { Authorization: `Bearer ${LITELLM_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.1, // low temp for consistent judging
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Judge ${model} ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? '';
}

// ── Extract scores from judge response ─────────────────────────────────────

function extractScores(response: string): Score | null {
  // Try to parse JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Handle both nested ({naturalness: {score: N}}) and flat ({naturalness: N}) formats
    const getScore = (key: string): number => {
      const val = parsed[key];
      if (typeof val === 'number') return val;
      if (val && typeof val === 'object' && typeof val.score === 'number') return val.score;
      return 0;
    };

    const getReasoning = (key: string): string => {
      const val = parsed[key];
      if (val && typeof val === 'object' && typeof val.reasoning === 'string') return val.reasoning;
      return '';
    };

    return {
      naturalness: getScore('naturalness'),
      wordOrder: getScore('wordOrder'),
      flow: getScore('flow'),
      accuracy: getScore('accuracy'),
      voice: getScore('voice'),
      reasoning: parsed.summary || parsed.overallImpression || '',
    };
  } catch {
    console.warn('  Failed to parse judge response as JSON');
    return null;
  }
}

// ── Get French original text ───────────────────────────────────────────────

function getFrenchText(entryKey: string): string {
  // Find the test entry
  const testEntry = TEST_ENTRIES.find((e) =>
    path.basename(e.czPath, '.md') === entryKey,
  );
  if (!testEntry) return '[French original not found]';

  const frPath = path.join(CONTENT_DIR, testEntry.originalPath);
  if (!fs.existsSync(frPath)) return '[French file not found]';

  const entry = parser.parseFile(frPath);
  return renderer.renderMinimal(entry);
}

// ── Get gold standard text ─────────────────────────────────────────────────

function getGoldText(entryKey: string): string | null {
  const testEntry = TEST_ENTRIES.find((e) =>
    path.basename(e.czPath, '.md') === entryKey,
  );
  if (!testEntry?.goldPath) return null;

  const goldPath = path.join(CONTENT_DIR, testEntry.goldPath);
  if (!fs.existsSync(goldPath)) return null;

  return fs.readFileSync(goldPath, 'utf-8').trim();
}

// ── Main ───────────────────────────────────────────────────────────────────

interface EvalResult {
  entryKey: string;
  formatId: string;
  modelId: string;
  promptId: string;
  judgeId: string;
  evalPromptId: string;
  scores: Score | null;
  rawResponse: string;
  durationMs: number;
  error?: string;
}

function parseArgs(): {
  runDir: string;
  dryRun: boolean;
  judges?: string[];
  evalPrompts?: string[];
} {
  const args = process.argv.slice(2);
  const runDir = args.find((a) => !a.startsWith('--'));
  if (!runDir) {
    console.error('Usage: evaluate.ts <run-dir> [--dry-run] [--judges j1,j2] [--eval-prompts e1,e2]');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');

  const getListArg = (flag: string): string[] | undefined => {
    const idx = args.indexOf(flag);
    if (idx === -1 || idx + 1 >= args.length) return undefined;
    return args[idx + 1].split(',');
  };

  return {
    runDir,
    dryRun,
    judges: getListArg('--judges'),
    evalPrompts: getListArg('--eval-prompts'),
  };
}

async function main(): Promise<void> {
  const { runDir, dryRun, judges: filterJudges, evalPrompts: filterEvalPrompts } = parseArgs();

  const manifestPath = path.join(runDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const runs: Array<{
    entryKey: string;
    formatId: string;
    modelId: string;
    promptId: string;
    outputFile: string;
  }> = manifest.runs ?? [];

  if (runs.length === 0) {
    console.error('No runs found in manifest. Run run-experiment.ts first.');
    process.exit(1);
  }

  const outputsDir = path.join(runDir, 'outputs');
  const evalsDir = path.join(runDir, 'evals');
  fs.mkdirSync(evalsDir, { recursive: true });

  const judgeIds = filterJudges ?? DEFAULT_CONFIG.judgeIds;
  const evalPromptIds = filterEvalPrompts ?? DEFAULT_CONFIG.evalPromptIds;

  const selectedJudges = JUDGE_MODELS.filter((j) => judgeIds.includes(j.id));
  const selectedEvalPrompts = EVAL_PROMPTS.filter((e) =>
    evalPromptIds.includes(e.id as EvalPromptId),
  );

  // Filter out errored runs
  const validRuns = runs.filter((r) => {
    const outPath = path.join(outputsDir, r.outputFile);
    if (!fs.existsSync(outPath)) return false;
    const content = fs.readFileSync(outPath, 'utf-8');
    return !content.startsWith('[ERROR]');
  });

  const totalEvals = validRuns.length * selectedJudges.length * selectedEvalPrompts.length;

  console.log(`\nEvaluation plan:`);
  console.log(`  Valid runs:    ${validRuns.length}/${runs.length}`);
  console.log(`  Judges:        ${selectedJudges.map((j) => j.id).join(', ')}`);
  console.log(`  Eval prompts:  ${selectedEvalPrompts.map((e) => e.id).join(', ')}`);
  console.log(`  Total evals:   ${totalEvals}`);
  console.log(`  Dry run:       ${dryRun}`);
  console.log('');

  if (dryRun) {
    console.log('Dry run — not executing.');
    return;
  }

  const results: EvalResult[] = [];
  let completed = 0;

  for (const run of validRuns) {
    const candidateText = fs.readFileSync(
      path.join(outputsDir, run.outputFile),
      'utf-8',
    ).trim();

    const frenchText = getFrenchText(run.entryKey);
    const goldText = getGoldText(run.entryKey);

    if (!goldText) {
      console.warn(`  No gold standard for ${run.entryKey} — skipping evaluation`);
      continue;
    }

    for (const judge of selectedJudges) {
      for (const evalPrompt of selectedEvalPrompts) {
        completed++;
        const tag = `[${completed}/${totalEvals}]`;
        const evalKey = `${run.outputFile.replace('.txt', '')}_${judge.id}_${evalPrompt.id}`;
        const evalFile = `${evalKey}.json`;
        const evalPath = path.join(evalsDir, evalFile);

        // Skip if already done
        if (fs.existsSync(evalPath)) {
          console.log(`${tag} SKIP (exists): ${evalKey}`);
          const existing = JSON.parse(fs.readFileSync(evalPath, 'utf-8'));
          results.push(existing);
          continue;
        }

        console.log(`${tag} Evaluating: ${evalKey}`);
        const start = Date.now();

        try {
          // Load eval prompt template
          const template = fs.readFileSync(
            path.join(PROMPTS_DIR, evalPrompt.file),
            'utf-8',
          );

          const fullPrompt = template
            .replace('{{FRENCH}}', frenchText)
            .replace('{{GOLD}}', goldText)
            .replace('{{CANDIDATE}}', candidateText);

          const response = await callJudge(judge.modelName, fullPrompt);
          const duration = Date.now() - start;
          const scores = extractScores(response);

          const result: EvalResult = {
            entryKey: run.entryKey,
            formatId: run.formatId,
            modelId: run.modelId,
            promptId: run.promptId,
            judgeId: judge.id,
            evalPromptId: evalPrompt.id,
            scores,
            rawResponse: response,
            durationMs: duration,
          };

          fs.writeFileSync(evalPath, JSON.stringify(result, null, 2), 'utf-8');
          results.push(result);

          if (scores) {
            const avg = (
              (scores.naturalness + scores.wordOrder + scores.flow + scores.accuracy + scores.voice) / 5
            ).toFixed(1);
            console.log(`       → avg=${avg} (N=${scores.naturalness} W=${scores.wordOrder} F=${scores.flow} A=${scores.accuracy} V=${scores.voice}) ${duration}ms`);
          } else {
            console.log(`       → failed to parse scores, ${duration}ms`);
          }
        } catch (err: unknown) {
          const duration = Date.now() - start;
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`       → ERROR: ${errMsg}`);

          results.push({
            entryKey: run.entryKey,
            formatId: run.formatId,
            modelId: run.modelId,
            promptId: run.promptId,
            judgeId: judge.id,
            evalPromptId: evalPrompt.id,
            scores: null,
            rawResponse: '',
            durationMs: duration,
            error: errMsg,
          });
        }
      }
    }
  }

  // Save all evaluation results
  const scoresPath = path.join(runDir, 'scores.json');
  fs.writeFileSync(scoresPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\nSaved ${results.length} evaluations to ${scoresPath}`);
  const withScores = results.filter((r) => r.scores);
  const errors = results.filter((r) => r.error);
  console.log(`  Parsed: ${withScores.length}, Errors: ${errors.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
