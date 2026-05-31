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

import { readFileSync, existsSync, readdirSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { loadWorkerConfig, getProjectRoot, getTimestamp } from './lib/config.js';
import { addChangelogEntry, getReadmePath } from './lib/readme-parser.js';
import { syncAllTodos } from './lib/todo-sync.js';
import { generateReportStub } from './lib/report.js';
import type { HookOutput } from './lib/types.js';

/**
 * The JSON payload Claude Code feeds a Stop hook on stdin.
 * `stop_hook_active` is true when this Stop was itself triggered by a
 * previous Stop-hook continuation — bailing on it prevents loops.
 */
interface StopHookPayload {
  session_id?: string;
  transcript_path?: string;
  hook_event_name?: string;
  stop_hook_active?: boolean;
  cwd?: string;
}

/** Read and parse the Stop-hook stdin payload (best-effort). */
function readStopPayload(): StopHookPayload {
  try {
    const raw = readFileSync(0, 'utf-8').trim();
    if (!raw) return {};
    return JSON.parse(raw) as StopHookPayload;
  } catch {
    return {};
  }
}

const REPORTS_SUBDIR = join('.claude', 'reports');

/**
 * Whether a report has already been generated for this session.
 * Keyed on session_id via a marker file under .claude/reports/.markers/.
 * This makes the hook idempotent across repeated Stop fires in one session.
 */
function sessionMarkerPath(sessionId: string): string {
  const root = getProjectRoot();
  const safe = sessionId.replace(/[^A-Za-z0-9_-]/g, '_');
  return join(root, REPORTS_SUBDIR, '.markers', `${safe}.session`);
}

function reportAlreadyGenerated(sessionId: string): boolean {
  return existsSync(sessionMarkerPath(sessionId));
}

function markReportGenerated(sessionId: string, filename: string): void {
  const marker = sessionMarkerPath(sessionId);
  mkdirSync(join(marker, '..'), { recursive: true });
  writeFileSync(marker, `${new Date().toISOString()} ${filename}\n`, 'utf-8');
}

/**
 * Content-hash dedup safety net. `generateReportStub` writes its file
 * unconditionally (allocating a fresh -N name), so after it returns we
 * check whether the freshly written report is byte-identical to another
 * existing report. If so, we delete the just-written duplicate and return
 * the canonical (pre-existing) filename instead.
 */
function dedupAgainstExisting(filename: string): { kept: string; removedDuplicate: boolean } {
  const root = getProjectRoot();
  const dir = join(root, REPORTS_SUBDIR);
  const newPath = join(dir, filename);
  if (!existsSync(newPath)) return { kept: filename, removedDuplicate: false };

  const newHash = createHash('sha256').update(readFileSync(newPath)).digest('hex');

  const others = readdirSync(dir).filter(
    (f) => f.endsWith('.md') && f !== filename
  );
  for (const other of others) {
    const otherPath = join(dir, other);
    try {
      const otherHash = createHash('sha256').update(readFileSync(otherPath)).digest('hex');
      if (otherHash === newHash) {
        // Identical report already exists — drop the new duplicate.
        rmSync(newPath);
        return { kept: other, removedDuplicate: true };
      }
    } catch {
      // ignore unreadable files
    }
  }
  return { kept: filename, removedDuplicate: false };
}

async function main(): Promise<void> {
  const payload = readStopPayload();

  // Prevent Stop-hook loops: if this Stop was triggered by a prior
  // Stop-hook continuation, do nothing.
  if (payload.stop_hook_active) {
    console.log(JSON.stringify({ success: true, actions: ['skipped: stop_hook_active'] }));
    return;
  }

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

  // Generate run report if there was team/translation work.
  // Idempotency: a real session should produce at most ONE draft report.
  // We guard with a per-session marker (keyed on session_id) so that the
  // many Stop events a single session emits don't each spawn a fresh
  // -N duplicate. As a backstop (e.g. missing session_id), we also dedup
  // the freshly written report against existing byte-identical reports.
  const sessionId = payload.session_id;
  try {
    if (sessionId && reportAlreadyGenerated(sessionId)) {
      console.error('');
      console.error('Run report already generated for this session — skipping.');
      (output.actions as string[]).push('report: skipped (already generated this session)');
    } else {
      const reportFile = await generateReportStub();
      if (reportFile) {
        const { kept, removedDuplicate } = dedupAgainstExisting(reportFile);
        if (sessionId) markReportGenerated(sessionId, kept);
        console.error('');
        if (removedDuplicate) {
          console.error(
            `Run report identical to existing .claude/reports/${kept} — duplicate not kept.`
          );
          (output.actions as string[]).push(`report: deduped to ${kept}`);
        } else {
          console.error(`Draft run report generated: .claude/reports/${kept}`);
          console.error('Fill in agent lifecycle, issues, and observations, then change status to "final".');
          (output.actions as string[]).push(`report: ${kept}`);
        }
      }
    }
  } catch (err) {
    console.error(`Report generation failed: ${err}`);
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
