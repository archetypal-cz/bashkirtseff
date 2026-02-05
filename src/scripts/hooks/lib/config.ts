/**
 * Configuration utilities for hooks
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import type { WorkerConfig } from './types.js';

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * Load worker configuration from .claude/WORKER_CONFIG.yaml
 * Falls back to git config for username if not configured
 */
export async function loadWorkerConfig(): Promise<WorkerConfig | null> {
  const configPath = join(PROJECT_ROOT, '.claude', 'WORKER_CONFIG.yaml');

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      return parseYaml(content) as WorkerConfig;
    } catch (e) {
      console.error('Failed to parse WORKER_CONFIG.yaml:', e);
    }
  }

  // Fallback: try to get username from git config
  try {
    const { execSync } = await import('child_process');
    const gitUser = execSync('git config user.name', { encoding: 'utf-8' }).trim();
    if (gitUser) {
      return {
        github_user: gitUser,
        working_language: 'cz', // Default
      };
    }
  } catch {
    // Git config not available
  }

  return null;
}

/**
 * Get the current timestamp in ISO format
 */
export function getTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

/**
 * Get project root directory
 */
export function getProjectRoot(): string {
  return PROJECT_ROOT;
}

/**
 * Check if a path is a diary entry file
 */
export function isDiaryEntry(filePath: string): boolean {
  return /\d{4}-\d{2}-\d{2}\.md$/.test(filePath);
}

/**
 * Check if a path is in content directory (any language)
 * Matches content/_original/, content/cz/, content/uk/, content/en/, etc.
 */
export function isSourceFile(filePath: string): boolean {
  return /content\/(?:_original|[a-z]{2})\/\d{3}\//.test(filePath);
}

/**
 * Extract carnet number from file path
 * Works with any language directory under content/
 */
export function extractCarnet(filePath: string): string | null {
  const match = filePath.match(/content\/(?:_original|[a-z]{2})\/(\d{3})\//);
  return match ? match[1] : null;
}

/**
 * Extract language from file path
 * Returns '_original' for source files, or 2-letter language code for translations
 */
export function extractLanguage(filePath: string): string | null {
  const match = filePath.match(/content\/(_original|[a-z]{2})\//);
  return match ? match[1] : null;
}
