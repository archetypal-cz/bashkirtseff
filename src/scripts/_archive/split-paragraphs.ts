#!/usr/bin/env npx tsx
/**
 * Split single-paragraph entries into proper multi-paragraph format.
 *
 * Problem: Some carnets (024-028, 030) have one paragraph ID per entry,
 * with all text as consecutive lines. The parser treats this as one paragraph,
 * so the website renders it as a wall of text.
 *
 * Solution: Split each text line into its own paragraph cluster with a unique ID.
 *
 * Usage:
 *   npx tsx src/scripts/split-paragraphs.ts --dry-run 030        # Preview one carnet
 *   npx tsx src/scripts/split-paragraphs.ts 030                  # Apply to one carnet
 *   npx tsx src/scripts/split-paragraphs.ts --dry-run 024-030    # Preview range
 *   npx tsx src/scripts/split-paragraphs.ts 024-030              # Apply to range
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTENT_DIR = path.resolve('content/_original');
const PARA_ID_RE = /^%%\s*(\d{2,3})\.(\d+)\s*%%$/;
const COMMENT_RE = /^%%\s*.+\s*%%$/;
const HEADER_RE = /^(#{1,6})\s+(.+)$/;
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n/;

interface ParsedEntry {
  frontmatter: string;
  metadata: Record<string, string>;
  beforeId: string[];      // lines before the paragraph ID
  paraId: string;          // the paragraph ID line
  carnetNum: string;
  paraNum: number;
  comments: string[];      // annotation lines (glossary, LAN, RSR, etc.)
  textLines: string[];     // actual text lines (heading + body)
  afterText: string[];     // anything after text (footnotes etc.)
}

function parseEntry(content: string): ParsedEntry | null {
  // Split frontmatter
  const fmMatch = content.match(FRONTMATTER_RE);
  if (!fmMatch) return null;

  const frontmatter = fmMatch[1];
  const body = content.slice(fmMatch[0].length);
  const lines = body.split('\n');

  // Parse simple frontmatter fields
  const metadata: Record<string, string> = {};
  for (const line of frontmatter.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) metadata[m[1]] = m[2];
  }

  const beforeId: string[] = [];
  const comments: string[] = [];
  const textLines: string[] = [];
  const afterText: string[] = [];

  let paraId = '';
  let carnetNum = '';
  let paraNum = 0;
  let phase: 'before_id' | 'after_id_comments' | 'text' | 'after_text' = 'before_id';

  for (const line of lines) {
    const trimmed = line.trim();

    if (phase === 'before_id') {
      const idMatch = trimmed.match(PARA_ID_RE);
      if (idMatch) {
        paraId = trimmed;
        carnetNum = idMatch[1];
        paraNum = parseInt(idMatch[2], 10);
        phase = 'after_id_comments';
      } else {
        beforeId.push(line);
      }
    } else if (phase === 'after_id_comments') {
      if (COMMENT_RE.test(trimmed)) {
        comments.push(line);
      } else if (trimmed === '') {
        // Skip blank lines between comments and text
      } else {
        // First non-comment, non-empty line — start of text
        textLines.push(trimmed);
        phase = 'text';
      }
    } else if (phase === 'text') {
      if (trimmed === '') {
        // Blank line could separate paragraphs or signal end of text
        // Keep going to collect more text
      } else if (trimmed.startsWith('[^')) {
        // Footnote definition — after text
        afterText.push(line);
        phase = 'after_text';
      } else if (COMMENT_RE.test(trimmed) && !PARA_ID_RE.test(trimmed)) {
        // Comment after text (rare but possible) — keep as after-text
        afterText.push(line);
      } else {
        textLines.push(trimmed);
      }
    } else if (phase === 'after_text') {
      afterText.push(line);
    }
  }

  if (!paraId || textLines.length === 0) return null;

  return {
    frontmatter,
    metadata,
    beforeId,
    paraId,
    carnetNum,
    paraNum,
    comments,
    textLines,
    afterText,
  };
}

/**
 * Classify comments into glossary/theme tags vs LAN/RSR annotations
 */
function classifyComments(comments: string[]): { tags: string[]; annotations: string[] } {
  const tags: string[] = [];
  const annotations: string[] = [];

  for (const c of comments) {
    const trimmed = c.trim();
    // Glossary tags: contain [# links
    // Theme tags: contain [# links to themes
    if (trimmed.includes('[#')) {
      tags.push(c);
    } else {
      annotations.push(c);
    }
  }

  return { tags, annotations };
}

function padId(carnet: string, num: number): string {
  const padded = carnet.length <= 2
    ? carnet.padStart(3, '0')
    : carnet;
  return `%% ${padded}.${String(num).padStart(4, '0')} %%`;
}

function reconstructEntry(parsed: ParsedEntry): string {
  const { textLines, carnetNum } = parsed;

  // If only one text line, nothing to split
  if (textLines.length <= 1) return '';

  const { tags, annotations } = classifyComments(parsed.comments);

  const outputLines: string[] = [];

  // Frontmatter — update para_start and para_end
  let fm = parsed.frontmatter;
  const newParaStart = parsed.paraNum;
  const newParaEnd = parsed.paraNum + textLines.length - 1;

  fm = fm.replace(/^para_start:\s*.+$/m, `para_start: ${newParaStart}`);
  fm = fm.replace(/^para_end:\s*.+$/m, `para_end: ${newParaEnd}`);

  outputLines.push('---');
  outputLines.push(fm);
  outputLines.push('---');

  // Before-ID lines (usually just blank lines)
  for (const line of parsed.beforeId) {
    if (line.trim() !== '') {
      outputLines.push(line);
    }
  }

  let currentParaNum = parsed.paraNum;
  let annotationsPlaced = false;

  for (let i = 0; i < textLines.length; i++) {
    const text = textLines[i];
    const isHeader = HEADER_RE.test(text);

    // Paragraph ID
    outputLines.push(padId(carnetNum, currentParaNum));

    // Annotations go with the first NON-HEADER paragraph
    // (matching the format of properly-structured carnets like 013, 032)
    if (!annotationsPlaced && !isHeader) {
      for (const tag of tags) outputLines.push(tag);
      for (const ann of annotations) outputLines.push(ann);
      annotationsPlaced = true;
    }

    // Text
    outputLines.push(text);

    // Blank line separator
    outputLines.push('');

    currentParaNum++;
  }

  // If all text lines were headers (unlikely), place annotations at the end
  if (!annotationsPlaced && (tags.length > 0 || annotations.length > 0)) {
    // Prepend annotations to the last paragraph
    const lastParaIdx = outputLines.lastIndexOf(padId(carnetNum, currentParaNum - 1));
    if (lastParaIdx >= 0) {
      const insertLines = [...tags, ...annotations];
      outputLines.splice(lastParaIdx + 1, 0, ...insertLines);
    }
  }

  // After-text content (footnotes etc.)
  if (parsed.afterText.length > 0) {
    for (const line of parsed.afterText) {
      outputLines.push(line);
    }
  }

  // Remove trailing blank lines, ensure single newline at end
  while (outputLines.length > 0 && outputLines[outputLines.length - 1].trim() === '') {
    outputLines.pop();
  }
  outputLines.push('');

  return outputLines.join('\n');
}

// ── Main ────────────────────────────────────────────────────────────

function getCarnetRange(arg: string): string[] {
  if (arg.includes('-')) {
    const [start, end] = arg.split('-').map(s => parseInt(s, 10));
    const carnets: string[] = [];
    for (let i = start; i <= end; i++) {
      carnets.push(String(i).padStart(3, '0'));
    }
    return carnets;
  }
  return [arg.padStart(3, '0')];
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const carnetArg = args.find(a => !a.startsWith('--'));

  if (!carnetArg) {
    console.error('Usage: npx tsx src/scripts/split-paragraphs.ts [--dry-run] <carnet|range>');
    console.error('  e.g., npx tsx src/scripts/split-paragraphs.ts --dry-run 030');
    console.error('  e.g., npx tsx src/scripts/split-paragraphs.ts 024-030');
    process.exit(1);
  }

  const carnets = getCarnetRange(carnetArg);

  let totalEntries = 0;
  let splitEntries = 0;
  let skippedEntries = 0;

  for (const carnet of carnets) {
    const carnetDir = path.join(CONTENT_DIR, carnet);
    if (!fs.existsSync(carnetDir)) {
      console.error(`Carnet directory not found: ${carnetDir}`);
      continue;
    }

    const files = fs.readdirSync(carnetDir)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/) && f !== 'README.md')
      .sort();

    console.log(`\n=== Carnet ${carnet}: ${files.length} entries ===`);

    // Track running paragraph number across entries
    let nextParaNum = 1;

    for (const file of files) {
      totalEntries++;
      const filePath = path.join(carnetDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      const parsed = parseEntry(content);
      if (!parsed) {
        console.log(`  SKIP ${file}: could not parse`);
        skippedEntries++;
        continue;
      }

      // Check if already multi-paragraph (para_start !== para_end)
      const paraStart = parseInt(parsed.metadata.para_start || '0', 10);
      const paraEnd = parseInt(parsed.metadata.para_end || '0', 10);
      if (paraStart !== paraEnd && paraEnd > 0) {
        // Already multi-paragraph, just track the next para number
        nextParaNum = paraEnd + 1;
        console.log(`  OK   ${file}: already multi-paragraph (${paraStart}-${paraEnd})`);
        continue;
      }

      if (parsed.textLines.length <= 1) {
        nextParaNum = parsed.paraNum + 1;
        console.log(`  OK   ${file}: single paragraph (nothing to split)`);
        continue;
      }

      // Update para_num to use sequential numbering across carnet
      parsed.paraNum = nextParaNum;

      const result = reconstructEntry(parsed);
      if (!result) {
        skippedEntries++;
        continue;
      }

      const newParaEnd = nextParaNum + parsed.textLines.length - 1;
      console.log(`  SPLIT ${file}: 1 → ${parsed.textLines.length} paragraphs (${nextParaNum}-${newParaEnd})`);

      if (!dryRun) {
        fs.writeFileSync(filePath, result, 'utf-8');
      }

      nextParaNum = newParaEnd + 1;
      splitEntries++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total entries: ${totalEntries}`);
  console.log(`Split: ${splitEntries}`);
  console.log(`Skipped: ${skippedEntries}`);
  console.log(`Already OK: ${totalEntries - splitEntries - skippedEntries}`);
  if (dryRun) console.log(`(DRY RUN — no files modified)`);
}

main();
