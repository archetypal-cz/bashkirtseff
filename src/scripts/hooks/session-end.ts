#!/usr/bin/env npx tsx
/**
 * Session-end hook: Summarize work and optionally commit
 *
 * This hook runs when a Claude Code session ends.
 * It can:
 * - Add changelog entries summarizing work done
 * - Sync TODOs between original and translations
 * - Auto-commit if configured
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { loadWorkerConfig, getProjectRoot, getTimestamp } from './lib/config.js';
import { addChangelogEntry, getReadmePath } from './lib/readme-parser.js';
import { syncAllTodos } from './lib/todo-sync.js';
import type { HookInput, HookOutput } from './lib/types.js';

async function main(): Promise<void> {
  const output: HookOutput = {
    success: true,
    actions: [],
  };

  const config = await loadWorkerConfig();
  const user = config?.github_user || 'unknown';

  console.error('');
  console.error('═══════════════════════════════════════════════════════════════');
  console.error('Session ending...');

  // Check for uncommitted changes in content/
  const root = getProjectRoot();
  let hasChanges = false;
  try {
    const status = execSync('git status --porcelain content/', {
      cwd: root,
      encoding: 'utf-8'
    });
    hasChanges = status.trim().length > 0;
  } catch {
    // Git not available or not a repo
  }

  if (hasChanges) {
    console.error(`Uncommitted changes detected in content/`);

    // Sync TODOs
    console.error('Syncing TODOs...');
    const syncResult = syncAllTodos();
    console.error(`  Synced ${syncResult.carnets} carnets: ${syncResult.downstream} downstream, ${syncResult.upstream} upstream`);
    (output.actions as string[]).push(`synced ${syncResult.carnets} carnets`);

    // Auto-commit if enabled
    if (config?.auto_commit?.enabled && config.auto_commit.frequency === 'after_session') {
      const prefix = config.auto_commit.message_prefix || `[${config.working_language}]`;

      console.error('');
      console.error('Auto-commit is enabled. To commit these changes, run:');
      console.error(`  git add content/ && git commit -m "${prefix} Session work by @${user}"`);
      console.error('');
      // Note: We don't actually auto-commit here because it could be disruptive
      // Better to let the user review and commit manually
    }
  } else {
    console.error('No changes to commit.');
  }

  console.error('═══════════════════════════════════════════════════════════════');
  console.error('');

  console.log(JSON.stringify(output));
}

main().catch(err => {
  console.error('Session-end hook error:', err);
  console.log(JSON.stringify({ success: false, error: String(err) }));
  process.exit(0);
});
