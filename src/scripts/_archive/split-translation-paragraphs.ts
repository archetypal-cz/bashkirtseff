#!/usr/bin/env npx tsx
/**
 * Split single-paragraph translation entries to match restructured originals.
 *
 * After running split-paragraphs.ts on originals, run this on translations
 * to give each English paragraph its own ID with the corresponding French line.
 *
 * Usage:
 *   npx tsx src/scripts/split-translation-paragraphs.ts --dry-run en 030
 *   npx tsx src/scripts/split-translation-paragraphs.ts en 030
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTENT_DIR = path.resolve('content');
const PARA_ID_RE = /^%%\s*(\d{2,3})\.(\d+)\s*%%$/;
const COMMENT_RE = /^%%\s*.+\s*%%$/;
const HEADER_RE = /^(#{1,6})\s+(.+)$/;
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

interface OriginalInfo {
  paraStart: number;
  paraEnd: number;
  carnetNum: string;
  /** Text lines from the restructured original (heading + body) */
  textLines: string[];
}

function readOriginalInfo(date: string, carnet: string): OriginalInfo | null {
  const origPath = path.join(CONTENT_DIR, '_original', carnet, `${date}.md`);
  if (!fs.existsSync(origPath)) return null;

  const content = fs.readFileSync(origPath, 'utf-8');
  const fmMatch = content.match(FRONTMATTER_RE);
  if (!fmMatch) return null;

  const fm = fmMatch[1];
  const psMatch = fm.match(/^para_start:\s*(\d+)/m);
  const peMatch = fm.match(/^para_end:\s*(\d+)/m);
  if (!psMatch || !peMatch) return null;

  // Extract text lines from body
  const body = content.slice(fmMatch[0].length);
  const lines = body.split('\n');
  const textLines: string[] = [];
  let carnetNum = carnet;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (PARA_ID_RE.test(trimmed)) {
      const m = trimmed.match(PARA_ID_RE);
      if (m) carnetNum = m[1];
      continue;
    }
    if (COMMENT_RE.test(trimmed)) continue;
    textLines.push(trimmed);
  }

  return {
    paraStart: parseInt(psMatch[1], 10),
    paraEnd: parseInt(peMatch[1], 10),
    carnetNum,
    textLines,
  };
}

interface TranslationParsed {
  frontmatter: string;
  comments: string[];        // glossary tags, LAN, RSR, TR notes
  frenchHeading: string;     // heading from French block
  frenchLines: string[];     // body lines from French block
  englishLines: string[];    // English translation lines
  footnotes: string[];       // footnote definitions
}

function parseTranslation(content: string): TranslationParsed | null {
  const fmMatch = content.match(FRONTMATTER_RE);
  if (!fmMatch) return null;

  const frontmatter = fmMatch[1];
  const body = content.slice(fmMatch[0].length);
  const lines = body.split('\n');

  const comments: string[] = [];
  const frenchLines: string[] = [];
  const englishLines: string[] = [];
  const footnotes: string[] = [];
  let frenchHeading = '';

  // States: 'comments' -> 'french_block' -> 'english' -> 'footnotes'
  let phase: 'comments' | 'french_block' | 'english' | 'footnotes' = 'comments';
  let inFrenchBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (phase === 'comments') {
      if (trimmed === '') continue;

      // Check for start of French block: %% # Heading or %% [Livre...
      // French block starts with %% and contains the heading or first French line
      if (trimmed.startsWith('%%') && !trimmed.endsWith('%%')) {
        // Multi-line comment block start (French text block)
        inFrenchBlock = true;
        phase = 'french_block';
        // Extract content after %%
        const afterMarker = trimmed.slice(2).trim();
        if (afterMarker.startsWith('#')) {
          frenchHeading = afterMarker;
        } else if (afterMarker) {
          frenchLines.push(afterMarker);
        }
        continue;
      }

      if (PARA_ID_RE.test(trimmed)) {
        // Skip the paragraph ID
        continue;
      }

      if (COMMENT_RE.test(trimmed)) {
        comments.push(line);
        continue;
      }

      // Non-comment, non-empty line — this is English text (no French block)
      // This happens when French and English aren't in a block format
      englishLines.push(trimmed);
      phase = 'english';
      continue;
    }

    if (phase === 'french_block') {
      if (trimmed.endsWith('%%')) {
        // End of French block
        const beforeMarker = trimmed.slice(0, -2).trim();
        if (beforeMarker) {
          frenchLines.push(beforeMarker);
        }
        phase = 'english';
        inFrenchBlock = false;
        continue;
      }
      // French text line within block
      if (trimmed.startsWith('#')) {
        frenchHeading = trimmed;
      } else if (trimmed) {
        frenchLines.push(trimmed);
      }
      continue;
    }

    if (phase === 'english') {
      if (trimmed === '') continue;
      if (trimmed.startsWith('[^')) {
        footnotes.push(line);
        phase = 'footnotes';
        continue;
      }
      // Check if this is a comment that got placed after English text
      if (COMMENT_RE.test(trimmed)) {
        // Skip stray comments in english section
        continue;
      }
      englishLines.push(trimmed);
      continue;
    }

    if (phase === 'footnotes') {
      if (trimmed) footnotes.push(line);
    }
  }

  return { frontmatter, comments, frenchHeading, frenchLines, englishLines, footnotes };
}

function padId(carnet: string, num: number): string {
  const padded = carnet.padStart(3, '0');
  return `%% ${padded}.${String(num).padStart(4, '0')} %%`;
}

function classifyComments(comments: string[]): { tags: string[]; annotations: string[] } {
  const tags: string[] = [];
  const annotations: string[] = [];
  for (const c of comments) {
    if (c.trim().includes('[#')) {
      tags.push(c);
    } else {
      annotations.push(c);
    }
  }
  return { tags, annotations };
}

function reconstructTranslation(
  parsed: TranslationParsed,
  orig: OriginalInfo
): string {
  const { frenchHeading, frenchLines, englishLines, footnotes } = parsed;
  const { tags, annotations } = classifyComments(parsed.comments);

  // Determine if first English line contains the heading
  // e.g., "Sunday, 7 March 1875. I was so enchanted..."
  let englishHeading = '';
  let englishBody = [...englishLines];

  // Check if first English line starts with a day name (heading merged with body)
  const dayPattern = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+\d+\s+\w+\s+\d{4}\.\s*/;
  const dayMatch = englishBody[0]?.match(dayPattern);

  if (dayMatch && frenchHeading) {
    // Split the heading from the body text
    englishHeading = dayMatch[0].replace(/\.\s*$/, '');
    const rest = englishBody[0].slice(dayMatch[0].length).trim();
    if (rest) {
      englishBody[0] = rest;
    } else {
      englishBody.shift();
    }
  } else if (HEADER_RE.test(englishBody[0])) {
    // Already a proper heading
    englishHeading = englishBody.shift()!;
  }

  const outputLines: string[] = [];

  // Updated frontmatter
  let fm = parsed.frontmatter;
  fm = fm.replace(/^para_start:\s*.+$/m, `para_start: ${orig.paraStart}`);
  fm = fm.replace(/^para_end:\s*.+$/m, `para_end: ${orig.paraEnd}`);
  if (!fm.includes('para_start')) fm += `\npara_start: ${orig.paraStart}`;
  if (!fm.includes('para_end')) fm += `\npara_end: ${orig.paraEnd}`;

  outputLines.push('---');
  outputLines.push(fm);
  outputLines.push('---');
  outputLines.push('');

  let paraNum = orig.paraStart;

  // Heading paragraph
  if (englishHeading || frenchHeading) {
    outputLines.push(padId(orig.carnetNum, paraNum));
    if (frenchHeading) {
      outputLines.push(`%% ${frenchHeading} %%`);
    }
    if (englishHeading) {
      // Ensure it's a proper heading with #
      if (!englishHeading.startsWith('#')) {
        outputLines.push(`# ${englishHeading}`);
      } else {
        outputLines.push(englishHeading);
      }
    }
    outputLines.push('');
    paraNum++;
  }

  // Body paragraphs — one per English line, with matched French where available
  let annotationsPlaced = false;

  for (let i = 0; i < englishBody.length; i++) {
    outputLines.push(padId(orig.carnetNum, paraNum));

    // First body paragraph gets tags and annotations
    if (!annotationsPlaced) {
      for (const tag of tags) outputLines.push(tag);
      for (const ann of annotations) outputLines.push(ann);
      annotationsPlaced = true;
    }

    // French original in comment (match 1:1 where available)
    if (i < frenchLines.length) {
      outputLines.push(`%% ${frenchLines[i]} %%`);
    }

    // English translation
    outputLines.push(englishBody[i]);

    outputLines.push('');
    paraNum++;
  }

  // Footnotes
  if (footnotes.length > 0) {
    for (const fn of footnotes) {
      outputLines.push(fn);
    }
    outputLines.push('');
  }

  // Clean trailing blank lines
  while (outputLines.length > 0 && outputLines[outputLines.length - 1].trim() === '') {
    outputLines.pop();
  }
  outputLines.push('');

  return outputLines.join('\n');
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const positional = args.filter(a => !a.startsWith('--'));

  if (positional.length < 2) {
    console.error('Usage: npx tsx src/scripts/split-translation-paragraphs.ts [--dry-run] <lang> <carnet>');
    console.error('  e.g., npx tsx src/scripts/split-translation-paragraphs.ts --dry-run en 030');
    process.exit(1);
  }

  const lang = positional[0];
  const carnet = positional[1].padStart(3, '0');
  const translationDir = path.join(CONTENT_DIR, lang, carnet);

  if (!fs.existsSync(translationDir)) {
    console.error(`Translation directory not found: ${translationDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(translationDir)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/) && f !== 'README.md')
    .sort();

  console.log(`\n=== ${lang}/${carnet}: ${files.length} entries ===`);

  let splitCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const date = file.replace('.md', '');
    const filePath = path.join(translationDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if already multi-paragraph
    const bodyAfterFm = content.replace(FRONTMATTER_RE, '');
    const paraIds = bodyAfterFm.match(/^%%\s*\d{2,3}\.\d+\s*%%$/gm);
    if (paraIds && paraIds.length > 1) {
      console.log(`  OK   ${file}: already multi-paragraph (${paraIds.length} IDs)`);
      skipCount++;
      continue;
    }

    // Read original info
    const orig = readOriginalInfo(date, carnet);
    if (!orig) {
      console.log(`  SKIP ${file}: no matching original`);
      errorCount++;
      continue;
    }

    // Parse translation
    const parsed = parseTranslation(content);
    if (!parsed) {
      console.log(`  SKIP ${file}: could not parse`);
      errorCount++;
      continue;
    }

    if (parsed.englishLines.length <= 1 && !parsed.frenchHeading) {
      console.log(`  OK   ${file}: single paragraph (nothing to split)`);
      skipCount++;
      continue;
    }

    const result = reconstructTranslation(parsed, orig);

    // Count output paragraphs
    const outIds = result.match(/^%%\s*\d{2,3}\.\d+\s*%%$/gm);
    const inParas = parsed.englishLines.length;
    const outParas = outIds?.length || 0;

    console.log(`  SPLIT ${file}: ${inParas} en lines → ${outParas} paragraphs (IDs ${orig.paraStart}-${orig.paraEnd})`);

    if (!dryRun) {
      fs.writeFileSync(filePath, result, 'utf-8');
    }

    splitCount++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`Split: ${splitCount}, Already OK: ${skipCount}, Errors: ${errorCount}`);
  if (dryRun) console.log(`(DRY RUN — no files modified)`);
}

main();
