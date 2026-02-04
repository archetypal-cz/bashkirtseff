#!/usr/bin/env npx tsx
/**
 * Pre-session hook: Show work status when Claude Code starts
 *
 * This hook runs at the start of a Claude Code session and displays:
 * - Worker configuration
 * - Assigned carnets and their status
 * - Next work to do
 * - Any upstream changes or conflicts
 */

import { loadWorkerConfig, getProjectRoot } from './lib/config.js';
import { calculateCarnetProgress, findNextWork, formatProgressSummary } from './lib/progress.js';
import type { HookOutput } from './lib/types.js';

async function main(): Promise<void> {
  const output: HookOutput = {
    success: true,
    warnings: [],
  };

  const config = await loadWorkerConfig();

  console.error(''); // Blank line for readability
  console.error('═══════════════════════════════════════════════════════════════');

  if (config) {
    console.error(`Welcome @${config.github_user}!`);
    console.error(`Working language: ${config.working_language}`);

    if (config.assigned_carnets && config.assigned_carnets.length > 0) {
      console.error('');
      console.error('Your assigned carnets:');
      for (const carnet of config.assigned_carnets) {
        const progress = calculateCarnetProgress(config.working_language, carnet);
        console.error(`  ${formatProgressSummary(progress)}`);
      }
    }

    // Find next work
    const nextWork = findNextWork(config.working_language);
    if (nextWork) {
      console.error('');
      console.error(`Next work: ${nextWork.count} entries need ${nextWork.phase} in carnet ${nextWork.carnet}`);
    }
  } else {
    console.error('No WORKER_CONFIG.yaml found.');
    console.error('');
    console.error('To configure your workspace, create .claude/WORKER_CONFIG.yaml:');
    console.error('');
    console.error('  github_user: your_username');
    console.error('  working_language: cz');
    console.error('  assigned_carnets:');
    console.error('    - "001"');
    console.error('    - "002"');
    console.error('');

    // Still show available work
    const nextWorkCz = findNextWork('cz');
    const nextWorkOriginal = findNextWork('original');

    if (nextWorkOriginal) {
      console.error(`French originals: ${nextWorkOriginal.count} entries need ${nextWorkOriginal.phase} in carnet ${nextWorkOriginal.carnet}`);
    }
    if (nextWorkCz) {
      console.error(`Czech translations: ${nextWorkCz.count} entries need ${nextWorkCz.phase} in carnet ${nextWorkCz.carnet}`);
    }
  }

  console.error('═══════════════════════════════════════════════════════════════');
  console.error('');

  // Output JSON for hook system
  console.log(JSON.stringify(output));
}

main().catch(err => {
  console.error('Pre-session hook error:', err);
  console.log(JSON.stringify({ success: false, error: String(err) }));
  process.exit(0); // Don't block on errors
});
