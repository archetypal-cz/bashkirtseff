#!/usr/bin/env npx tsx
/**
 * Post-edit hook: Update README after editing diary entries
 *
 * This hook runs after a Write tool completes on diary entry files.
 * It:
 * - Tracks progress by scanning frontmatter
 * - If original edited: notifies translations via README TODOs
 * - Reports changes to stderr for visibility
 */

import { readFileSync } from 'fs';
import { loadWorkerConfig, isDiaryEntry, isSourceFile, extractCarnet, extractLanguage } from './lib/config.js';
import { addChangelogEntry, getReadmePath } from './lib/readme-parser.js';
import { calculateCarnetProgress } from './lib/progress.js';
import { processOriginalEdit, calculateSourceHash, findTranslations, getStoredSourceHash } from './lib/source-sync.js';
import type { HookInput, HookOutput } from './lib/types.js';

async function main(): Promise<void> {
  // Read hook input from stdin
  let input: HookInput;
  try {
    const stdin = readFileSync(0, 'utf-8');
    input = JSON.parse(stdin);
  } catch {
    // No valid input, exit silently
    console.log(JSON.stringify({ success: true, skipped: true }));
    return;
  }

  const output: HookOutput = {
    success: true,
    updated_files: [],
    notifications: [],
  };

  const filePath = input.tool_input?.file_path;
  if (!filePath) {
    console.log(JSON.stringify({ success: true, skipped: true, reason: 'no file path' }));
    return;
  }

  // Only process diary entry files in source directories
  if (!isDiaryEntry(filePath) || !isSourceFile(filePath)) {
    console.log(JSON.stringify({ success: true, skipped: true, reason: 'not a diary entry' }));
    return;
  }

  const carnet = extractCarnet(filePath);
  const language = extractLanguage(filePath);

  if (!carnet || !language) {
    console.log(JSON.stringify({ success: true, skipped: true, reason: 'could not extract carnet/language' }));
    return;
  }

  // Get worker info
  const config = await loadWorkerConfig();
  const user = config?.github_user || 'unknown';

  // Calculate updated progress
  const progress = calculateCarnetProgress(language, carnet);

  // Extract entry date from filename
  const dateMatch = filePath.match(/(\d{4}-\d{2}-\d{2})\.md$/);
  const entryDate = dateMatch ? dateMatch[1] : 'unknown';

  // Log to stderr for visibility (won't interfere with JSON output)
  console.error(`[post-edit] Updated ${language}/${carnet}/${entryDate}`);
  console.error(`  Progress: RSR ${progress.research}/${progress.entries}, ` +
    `LAN ${progress.annotation}/${progress.entries}, ` +
    `TR ${progress.translation}/${progress.entries}`);

  // If this is an ORIGINAL file edit, check if translations need notification
  if (language === 'original') {
    const syncResult = processOriginalEdit(filePath);
    if (syncResult.notified > 0) {
      console.error(`  [sync] Notified ${syncResult.notified} translation(s): ${syncResult.languages.join(', ')}`);
      (output.notifications as string[]).push(
        `Source changed - notified ${syncResult.languages.join(', ')} translations`
      );
    }

    // Also log the new source hash for reference
    const hash = calculateSourceHash(filePath);
    if (hash) {
      console.error(`  [sync] Source hash: ${hash}`);
    }
  }

  output.updated_files = [filePath];
  output.progress = progress;
  output.entry = entryDate;

  console.log(JSON.stringify(output));
}

main().catch(err => {
  console.error('Post-edit hook error:', err);
  console.log(JSON.stringify({ success: false, error: String(err) }));
  process.exit(0); // Don't block on errors
});
