/**
 * Experiment Configuration
 *
 * Defines formats, models, prompts, and evaluation criteria
 * for the format-impact experiment.
 */

import * as path from 'node:path';

// ── Paths ──────────────────────────────────────────────────────────────────

export const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../..');
export const CONTENT_DIR = path.join(PROJECT_ROOT, 'content');
export const EXPERIMENTS_DIR = path.resolve(import.meta.dirname);
export const PROMPTS_DIR = path.join(EXPERIMENTS_DIR, 'prompts');
export const RESULTS_DIR = path.join(EXPERIMENTS_DIR, 'results');

// ── Input Formats ──────────────────────────────────────────────────────────

export type FormatId = 'FULL' | 'IDS_TEXT' | 'BARE' | 'SIDE_BY_SIDE' | 'FEWSHOT' | 'FEWSHOT_BARE';

export interface FormatDef {
  id: FormatId;
  label: string;
  description: string;
}

export const FORMATS: FormatDef[] = [
  {
    id: 'FULL',
    label: 'Full workflow format',
    description: 'All comments, glossary links, IDs, timestamps — current workflow',
  },
  {
    id: 'IDS_TEXT',
    label: 'IDs + text only',
    description: 'Paragraph IDs + French original + Czech text, no comments/glossary',
  },
  {
    id: 'BARE',
    label: 'Bare text',
    description: 'Just French original + Czech text, no IDs, no annotations',
  },
  {
    id: 'SIDE_BY_SIDE',
    label: 'Side-by-side blocks',
    description: 'Full French block, then full Czech block (no interleaving)',
  },
  {
    id: 'FEWSHOT',
    label: 'Few-shot with IDs',
    description: '2-3 perfected examples (FR/draft/perfected) before target, with IDs',
  },
  {
    id: 'FEWSHOT_BARE',
    label: 'Few-shot bare',
    description: 'Same as FEWSHOT but bare text only',
  },
];

// ── Models ─────────────────────────────────────────────────────────────────

export type ChannelType = 'claude-cli' | 'gemini-cli' | 'codex-cli' | 'litellm-api';

export interface ModelDef {
  id: string;
  label: string;
  channel: ChannelType;
  /** Model name passed to the CLI/API */
  modelName: string;
  /** For litellm-api: proxy config resource path */
  proxyConfig?: string;
}

export const MODELS: ModelDef[] = [
  // CLI tools (with their default system prompts)
  {
    id: 'claude-opus-cli',
    label: 'Claude Opus 4.6 (CLI)',
    channel: 'claude-cli',
    modelName: 'claude-opus-4-6',
  },
  {
    id: 'claude-sonnet-cli',
    label: 'Claude Sonnet 4.6 (CLI)',
    channel: 'claude-cli',
    modelName: 'claude-sonnet-4-6',
  },
  {
    id: 'gemini-pro-cli',
    label: 'Gemini 2.5 Pro (CLI)',
    channel: 'gemini-cli',
    modelName: 'gemini-2.5-pro',
  },
  {
    id: 'gemini3-pro-cli',
    label: 'Gemini 3 Pro (CLI)',
    channel: 'gemini-cli',
    modelName: 'gemini-3-pro',
  },
  {
    id: 'gpt41-cli',
    label: 'GPT-4.1 (Codex CLI)',
    channel: 'codex-cli',
    modelName: 'gpt-4.1',
  },

  // Direct API calls (our prompt only, no CLI system prompt)
  {
    id: 'claude-opus-api',
    label: 'Claude Opus 4.6 (API)',
    channel: 'litellm-api',
    modelName: 'claude-opus-4-6',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
  {
    id: 'claude-sonnet-api',
    label: 'Claude Sonnet 4.6 (API)',
    channel: 'litellm-api',
    modelName: 'claude-sonnet-4-6',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
  {
    id: 'gemini-pro-api',
    label: 'Gemini 2.5 Pro (API)',
    channel: 'litellm-api',
    modelName: 'gemini-2.5-pro',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
  {
    id: 'gemini3-pro-api',
    label: 'Gemini 3 Pro (API)',
    channel: 'litellm-api',
    modelName: 'gemini-3-pro',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
  {
    id: 'gpt41-api',
    label: 'GPT-4.1 (API)',
    channel: 'litellm-api',
    modelName: 'gpt-4.1',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
  {
    id: 'deepseek-v3-api',
    label: 'DeepSeek V3 (API)',
    channel: 'litellm-api',
    modelName: 'deepseek-v3',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
];

// ── Prompts ────────────────────────────────────────────────────────────────

export type PromptId = 'minimal' | 'detailed' | 'czech-native';

export interface PromptDef {
  id: PromptId;
  label: string;
  file: string; // filename in prompts/ dir
}

export const REDACTION_PROMPTS: PromptDef[] = [
  {
    id: 'minimal',
    label: 'Minimal instruction',
    file: 'redaction-minimal.md',
  },
  {
    id: 'detailed',
    label: 'Detailed redaction brief',
    file: 'redaction-detailed.md',
  },
  {
    id: 'czech-native',
    label: 'Czech-language prompt',
    file: 'redaction-czech.md',
  },
];

// ── Evaluation ─────────────────────────────────────────────────────────────

export type EvalPromptId = 'eval-structured' | 'eval-holistic' | 'eval-comparative';

export interface EvalPromptDef {
  id: EvalPromptId;
  label: string;
  file: string;
}

export const EVAL_PROMPTS: EvalPromptDef[] = [
  {
    id: 'eval-structured',
    label: 'Structured scoring',
    file: 'eval-structured.md',
  },
  {
    id: 'eval-holistic',
    label: 'Holistic assessment',
    file: 'eval-holistic.md',
  },
  {
    id: 'eval-comparative',
    label: 'Comparative ranking',
    file: 'eval-comparative.md',
  },
];

export const JUDGE_MODELS: ModelDef[] = [
  {
    id: 'judge-opus',
    label: 'Claude Opus 4.6 (judge)',
    channel: 'litellm-api',
    modelName: 'claude-opus-4-6',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
  {
    id: 'judge-gemini3',
    label: 'Gemini 3 Pro (judge)',
    channel: 'litellm-api',
    modelName: 'gemini-3-pro',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
  {
    id: 'judge-gpt41',
    label: 'GPT-4.1 (judge)',
    channel: 'litellm-api',
    modelName: 'gpt-4.1',
    proxyConfig: '$res:u/kerray/litellm_proxy',
  },
];

// ── Scoring ────────────────────────────────────────────────────────────────

export interface Score {
  naturalness: number;    // 1-10
  wordOrder: number;      // 1-10
  flow: number;           // 1-10
  accuracy: number;       // 1-10
  voice: number;          // 1-10
  reasoning?: string;     // judge's explanation
}

// ── Test Entries ────────────────────────────────────────────────────────────

export interface TestEntry {
  /** Entry file path relative to content/ (e.g., "cz/000/000-01.md") */
  czPath: string;
  /** Corresponding French original */
  originalPath: string;
  /** Paragraph IDs to test (if empty, use whole entry) */
  paragraphIds?: string[];
  /** Human-perfected version path (once available) */
  goldPath?: string;
  notes?: string;
}

/**
 * Test entries — kerray will add gold-standard paths after redacting
 */
export const TEST_ENTRIES: TestEntry[] = [
  {
    czPath: 'cz/000/000-01.md',
    originalPath: '_original/000/000-01.md',
    notes: 'Preface opening — manifesto, literary bravura',
  },
  {
    czPath: 'cz/000/000-02.md',
    originalPath: '_original/000/000-02.md',
    notes: 'Family background',
  },
  {
    czPath: 'cz/000/000-03.md',
    originalPath: '_original/000/000-03.md',
    notes: 'Early childhood',
  },
  // More entries to be added by kerray after redaction
];

// ── Few-shot examples ──────────────────────────────────────────────────────

export interface FewShotExample {
  /** Paragraph ID */
  id: string;
  /** French original */
  french: string;
  /** First-pass (literal) Czech translation */
  draft: string;
  /** Human-perfected Czech */
  perfected: string;
}

/**
 * Few-shot examples — to be populated by kerray with perfected paragraphs.
 * These serve as style examples for the FEWSHOT format variants.
 */
export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  // TBD — kerray will add after perfecting paragraphs
];

// ── Experiment Run Config ──────────────────────────────────────────────────

export interface ExperimentConfig {
  /** Which formats to test */
  formats: FormatId[];
  /** Which models to test */
  modelIds: string[];
  /** Which prompts to test */
  promptIds: PromptId[];
  /** Which entries to test */
  entryIndices: number[]; // indices into TEST_ENTRIES
  /** Which eval prompts to use */
  evalPromptIds: EvalPromptId[];
  /** Which judges to use */
  judgeIds: string[];
}

/**
 * Default: small first run
 */
export const DEFAULT_CONFIG: ExperimentConfig = {
  formats: ['FULL', 'IDS_TEXT', 'BARE'],
  modelIds: ['claude-opus-cli', 'gemini3-pro-cli', 'claude-opus-api'],
  promptIds: ['minimal', 'detailed'],
  entryIndices: [0], // just 000-01 to start
  evalPromptIds: ['eval-structured'],
  judgeIds: ['judge-opus', 'judge-gemini3', 'judge-gpt41'],
};
