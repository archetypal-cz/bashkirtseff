#!/usr/bin/env npx tsx

/**
 * Run experiment
 *
 * Takes prepared inputs and runs them through various models via CLI tools
 * and LiteLLM API. Saves raw outputs for evaluation.
 *
 * Usage:
 *   npx tsx src/scripts/experiments/run-experiment.ts <run-dir> [--dry-run] [--models m1,m2] [--formats f1,f2] [--prompts p1,p2]
 *
 * Prerequisites:
 *   - Run prepare-inputs.ts first to generate the run-dir
 *   - CLI tools: claude, gemini, codex must be installed and authenticated
 *   - LiteLLM proxy must be reachable (for API models)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

import {
  PROMPTS_DIR,
  MODELS,
  REDACTION_PROMPTS,
  DEFAULT_CONFIG,
  type FormatId,
  type PromptId,
  type ModelDef,
  type ChannelType,
} from './config.js';

// ── LiteLLM proxy config ───────────────────────────────────────────────────

// The LiteLLM proxy URL — adjust if different on your setup
const LITELLM_PROXY_URL = process.env.LITELLM_PROXY_URL || 'http://litellm:4000';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || '';

// ── CLI invocation ─────────────────────────────────────────────────────────

function callClaude(prompt: string, model: string): string {
  const tmpFile = `/tmp/experiment-prompt-${Date.now()}.txt`;
  fs.writeFileSync(tmpFile, prompt, 'utf-8');
  try {
    const result = execSync(
      `cat "${tmpFile}" | claude -p --model ${model} --no-session-persistence --dangerously-skip-permissions`,
      {
        encoding: 'utf-8',
        timeout: 300_000, // 5 min
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' },
      },
    );
    return result.trim();
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

function callGemini(prompt: string, model: string): string {
  const tmpFile = `/tmp/experiment-prompt-${Date.now()}.txt`;
  fs.writeFileSync(tmpFile, prompt, 'utf-8');
  try {
    const result = execSync(
      `cat "${tmpFile}" | gemini -p "" -m ${model}`,
      {
        encoding: 'utf-8',
        timeout: 300_000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    return result.trim();
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

function callCodex(prompt: string, model: string): string {
  const tmpFile = `/tmp/experiment-prompt-${Date.now()}.txt`;
  const outFile = `/tmp/experiment-output-${Date.now()}.txt`;
  fs.writeFileSync(tmpFile, prompt, 'utf-8');
  try {
    execSync(
      `codex exec -m ${model} -o "${outFile}" --quiet < "${tmpFile}"`,
      {
        encoding: 'utf-8',
        timeout: 300_000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    if (fs.existsSync(outFile)) {
      return fs.readFileSync(outFile, 'utf-8').trim();
    }
    return '[ERROR: no output file produced]';
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  }
}

async function callLiteLLM(prompt: string, model: string): Promise<string> {
  const response = await fetch(`${LITELLM_PROXY_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(LITELLM_API_KEY ? { Authorization: `Bearer ${LITELLM_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LiteLLM ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() ?? '[empty response]';
}

// ── Dispatch ───────────────────────────────────────────────────────────────

async function callModel(
  channel: ChannelType,
  modelName: string,
  prompt: string,
): Promise<string> {
  switch (channel) {
    case 'claude-cli':
      return callClaude(prompt, modelName);
    case 'gemini-cli':
      return callGemini(prompt, modelName);
    case 'codex-cli':
      return callCodex(prompt, modelName);
    case 'litellm-api':
      return callLiteLLM(prompt, modelName);
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}

// ── Prompt assembly ────────────────────────────────────────────────────────

function loadPromptTemplate(promptId: PromptId): string {
  const def = REDACTION_PROMPTS.find((p) => p.id === promptId);
  if (!def) throw new Error(`Unknown prompt: ${promptId}`);
  return fs.readFileSync(path.join(PROMPTS_DIR, def.file), 'utf-8');
}

function assemblePrompt(template: string, inputText: string): string {
  return template.replace('{{INPUT}}', inputText);
}

// ── Main ───────────────────────────────────────────────────────────────────

interface RunResult {
  entryKey: string;
  formatId: string;
  modelId: string;
  promptId: string;
  outputFile: string;
  durationMs: number;
  error?: string;
}

function parseArgs(): {
  runDir: string;
  dryRun: boolean;
  models?: string[];
  formats?: string[];
  prompts?: string[];
} {
  const args = process.argv.slice(2);
  const runDir = args.find((a) => !a.startsWith('--'));
  if (!runDir) {
    console.error('Usage: run-experiment.ts <run-dir> [--dry-run] [--models m1,m2] [--formats f1,f2] [--prompts p1,p2]');
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
    models: getListArg('--models'),
    formats: getListArg('--formats'),
    prompts: getListArg('--prompts'),
  };
}

async function main(): Promise<void> {
  const { runDir, dryRun, models: filterModels, formats: filterFormats, prompts: filterPrompts } =
    parseArgs();

  const manifestPath = path.join(runDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    console.error('Run prepare-inputs.ts first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const outputsDir = path.join(runDir, 'outputs');
  fs.mkdirSync(outputsDir, { recursive: true });

  // Determine what to run
  const modelIds = filterModels ?? DEFAULT_CONFIG.modelIds;
  const formatIds = filterFormats ?? DEFAULT_CONFIG.formats;
  const promptIds = filterPrompts ?? DEFAULT_CONFIG.promptIds;

  const selectedModels = MODELS.filter((m) => modelIds.includes(m.id));

  // Count total runs
  const entryKeys = Object.keys(manifest.inputs ?? {});
  const totalRuns = entryKeys.length * formatIds.length * selectedModels.length * promptIds.length;

  console.log(`\nExperiment run plan:`);
  console.log(`  Entries:  ${entryKeys.join(', ')}`);
  console.log(`  Formats:  ${formatIds.join(', ')}`);
  console.log(`  Models:   ${selectedModels.map((m) => m.id).join(', ')}`);
  console.log(`  Prompts:  ${promptIds.join(', ')}`);
  console.log(`  Total:    ${totalRuns} runs`);
  console.log(`  Dry run:  ${dryRun}`);
  console.log('');

  if (dryRun) {
    console.log('Dry run — not executing. Remove --dry-run to proceed.');
    return;
  }

  const results: RunResult[] = [];
  let completed = 0;

  for (const entryKey of entryKeys) {
    for (const formatId of formatIds) {
      const inputFilename = manifest.inputs[entryKey]?.[formatId];
      if (!inputFilename) {
        console.warn(`  No input for ${entryKey}/${formatId}, skipping`);
        continue;
      }

      const inputText = fs.readFileSync(
        path.join(runDir, 'inputs', inputFilename),
        'utf-8',
      );

      for (const model of selectedModels) {
        for (const promptId of promptIds) {
          completed++;
          const tag = `[${completed}/${totalRuns}]`;
          const runKey = `${entryKey}_${formatId}_${model.id}_${promptId}`;
          const outputFile = `${runKey}.txt`;
          const outputPath = path.join(outputsDir, outputFile);

          // Skip if already done
          if (fs.existsSync(outputPath)) {
            console.log(`${tag} SKIP (exists): ${runKey}`);
            results.push({
              entryKey,
              formatId,
              modelId: model.id,
              promptId,
              outputFile,
              durationMs: 0,
            });
            continue;
          }

          console.log(`${tag} Running: ${runKey}`);
          const start = Date.now();

          try {
            const template = loadPromptTemplate(promptId as PromptId);
            const fullPrompt = assemblePrompt(template, inputText);

            const output = await callModel(model.channel, model.modelName, fullPrompt);
            const duration = Date.now() - start;

            fs.writeFileSync(outputPath, output, 'utf-8');
            console.log(`       → ${output.length} chars, ${duration}ms`);

            results.push({
              entryKey,
              formatId,
              modelId: model.id,
              promptId,
              outputFile,
              durationMs: duration,
            });
          } catch (err: unknown) {
            const duration = Date.now() - start;
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`       → ERROR: ${errMsg}`);

            fs.writeFileSync(outputPath, `[ERROR]\n${errMsg}`, 'utf-8');
            results.push({
              entryKey,
              formatId,
              modelId: model.id,
              promptId,
              outputFile,
              durationMs: duration,
              error: errMsg,
            });
          }
        }
      }
    }
  }

  // Save run results
  const runResultsPath = path.join(runDir, 'run-results.json');
  const existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  existingManifest.runs = results;
  existingManifest.runCompleted = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(existingManifest, null, 2), 'utf-8');

  // Also save standalone
  fs.writeFileSync(runResultsPath, JSON.stringify(results, null, 2), 'utf-8');

  const errors = results.filter((r) => r.error);
  console.log(`\nDone: ${results.length} runs, ${errors.length} errors`);
  if (errors.length > 0) {
    console.log('Errors:');
    for (const e of errors) {
      console.log(`  ${e.entryKey}/${e.formatId}/${e.modelId}: ${e.error}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
