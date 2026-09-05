#!/usr/bin/env tsx
/**
 * fix-midline-paragraph-ids.ts
 *
 * Repairs the "mid-line paragraph ID" corruption (audit issue C3).
 *
 * The line-based translation parser in src/frontend/src/lib/content.ts only
 * recognizes a paragraph-ID marker (`%% NNN.NNNN %%`) when it is ALONE on its
 * own line. In ~30 translation files (mostly content/cz/017/*.md) one or more
 * paragraph IDs ended up glued mid-line — together with French originals,
 * glossary tags, role comments and the translated text — so everything after
 * the first inline ID was silently dropped at build time.
 *
 * This script normalizes any line that contains a bare paragraph-ID marker
 * mid-line so that every `%%...%%` block and every bare-text segment sits on
 * its own line — exactly the documented file format. Concatenating the tokens
 * back with newlines is lossless (only insignificant inter-token whitespace
 * changes), and the transform is idempotent: a line that is already a single
 * block or a single text run is left untouched.
 *
 * SCOPE: translation languages only (cz, uk, en, fr). It deliberately never
 * touches content/_original/, whose glossary entries (e.g. COLLIGNON.md,
 * WALITSKY.md) legitimately contain inline `%% NNN.NNNN %%` citation
 * references that are NOT structural paragraph markers.
 *
 * Usage:
 *   npx tsx src/scripts/fix-midline-paragraph-ids.ts          # apply fix
 *   npx tsx src/scripts/fix-midline-paragraph-ids.ts --dry    # report only
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { writeFileAtomic } from './lib/atomic-write.js';

const CONTENT_ROOT = join(import.meta.dirname, '..', '..', 'content');
const TRANSLATION_DIRS = ['cz', 'uk', 'en', 'fr'];

// A bare paragraph-ID marker: %% NNN.NNNN %% or %% GLO_FOO.NNNN %% (no role/tag/timestamp).
const BARE_ID = /%%\s*(?:\d+|GLO_[A-Z0-9_]+)\.\d+\s*%%/;
const BARE_ID_GLOBAL = new RegExp(BARE_ID.source, 'g');
// Any %%...%% block (non-greedy).
const ANY_BLOCK = /%%.*?%%/g;
// A line that is already a clean standalone single bare ID.
const STANDALONE_BARE_ID = /^\s*%%\s*(?:\d+|GLO_[A-Z0-9_]+)\.\d+\s*%%\s*$/;

const dryRun = process.argv.includes('--dry');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** Returns true if a line needs splitting (contains a mid-line / multi bare ID). */
function lineNeedsFix(line: string): boolean {
  BARE_ID_GLOBAL.lastIndex = 0;
  let count = 0;
  while (BARE_ID_GLOBAL.exec(line) !== null) count++;
  if (count === 0) return false;
  if (count === 1 && STANDALONE_BARE_ID.test(line)) return false;
  return true;
}

/**
 * Split a line into its `%%...%%` blocks and the bare-text segments between
 * them, each as its own output line. Lossless apart from trimming whitespace
 * that surrounds tokens (irrelevant to the parser).
 */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  ANY_BLOCK.lastIndex = 0;
  while ((m = ANY_BLOCK.exec(line)) !== null) {
    if (m.index > last) {
      const text = line.slice(last, m.index).trim();
      if (text) out.push(text);
    }
    out.push(m[0].trim());
    last = ANY_BLOCK.lastIndex;
  }
  if (last < line.length) {
    const text = line.slice(last).trim();
    if (text) out.push(text);
  }
  return out.length ? out : [line];
}

const files = TRANSLATION_DIRS
  .map((d) => join(CONTENT_ROOT, d))
  .filter((d) => { try { return statSync(d).isDirectory(); } catch { return false; } })
  .flatMap((d) => walk(d));

let filesChanged = 0;
let linesSplit = 0;
let idsRecovered = 0;
const report: string[] = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  const newLines: string[] = [];

  for (const line of lines) {
    if (lineNeedsFix(line)) {
      const split = splitLine(line);
      // Count bare IDs that were embedded (all but possibly a leading standalone one).
      BARE_ID_GLOBAL.lastIndex = 0;
      let idCount = 0;
      while (BARE_ID_GLOBAL.exec(line) !== null) idCount++;
      idsRecovered += idCount;
      linesSplit++;
      changed = true;
      newLines.push(...split);
    } else {
      newLines.push(line);
    }
  }

  if (changed) {
    filesChanged++;
    const rel = file.replace(CONTENT_ROOT + '/', '');
    report.push(`  ${rel}`);
    if (!dryRun) {
      writeFileAtomic(file, newLines.join('\n'));
    }
  }
}

console.log(`${dryRun ? '[DRY RUN] ' : ''}Scanned ${files.length} translation files`);
console.log(`Files ${dryRun ? 'needing fix' : 'changed'}: ${filesChanged}`);
console.log(`Mid-line/multi-ID lines split: ${linesSplit}`);
console.log(`Bare paragraph IDs on those lines: ${idsRecovered}`);
if (report.length) {
  console.log('Files:');
  console.log(report.join('\n'));
}
