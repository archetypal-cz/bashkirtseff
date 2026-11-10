#!/usr/bin/env npx tsx

/**
 * Prepare experiment inputs
 *
 * Reads Czech translation files and French originals, then generates
 * format variants for each test entry using ParagraphRenderer.
 *
 * Usage:
 *   npx tsx src/scripts/experiments/prepare-inputs.ts [run-dir]
 *
 * If run-dir is omitted, creates a timestamped directory under results/.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { ParagraphParser } from '../../shared/src/parser/paragraph-parser.js';
import { ParagraphRenderer, createDefaultRenderOptions } from '../../shared/src/renderer/paragraph-renderer.js';
import type { RenderOptions } from '../../shared/src/renderer/paragraph-renderer.js';
import type { DiaryEntry, Paragraph } from '../../shared/src/models/index.js';

import {
  CONTENT_DIR,
  RESULTS_DIR,
  TEST_ENTRIES,
  FEW_SHOT_EXAMPLES,
  FORMATS,
  type FormatId,
  type TestEntry,
  type FewShotExample,
} from './config.js';

const parser = new ParagraphParser();
const renderer = new ParagraphRenderer();

// ── Format generators ──────────────────────────────────────────────────────

function renderFull(czEntry: DiaryEntry, frEntry: DiaryEntry): string {
  // Current workflow format: everything visible
  return renderer.renderTranslationEntry(czEntry);
}

function renderIdsText(czEntry: DiaryEntry, frEntry: DiaryEntry): string {
  const options: RenderOptions = {
    ...createDefaultRenderOptions(),
    includeOriginal: true,
    includeTranslation: true,
    includeParagraphIds: true,
    includeNotes: {}, // no notes
    includeGlossaryLinks: false,
    includeFootnotes: false,
    includeFrontmatter: false,
    includeEmptyParagraphs: false,
    elementOrder: ['paragraph_id', 'original_text', 'translated_text'],
    commentStyle: 'obsidian',
  };

  // We need to inject the original text into the czEntry paragraphs
  const combined = injectOriginals(czEntry, frEntry);
  return renderer.renderEntry(combined, options);
}

function renderBare(czEntry: DiaryEntry, frEntry: DiaryEntry): string {
  const lines: string[] = [];

  const frMap = buildParaMap(frEntry);

  for (const para of czEntry.paragraphs) {
    if (para.isHeader) {
      // Skip headers or include translated header
      if (para.translatedText) lines.push(para.translatedText);
      continue;
    }

    const frPara = frMap.get(para.id);
    const frText = frPara?.originalText ?? para.originalText;
    if (frText) lines.push(frText);
    if (para.translatedText) lines.push(para.translatedText);
    lines.push('');
  }

  return lines.join('\n').trim();
}

function renderSideBySide(czEntry: DiaryEntry, frEntry: DiaryEntry): string {
  const frMap = buildParaMap(frEntry);

  // Block 1: all French text
  const frLines: string[] = ['--- FRENCH ORIGINAL ---', ''];
  for (const para of czEntry.paragraphs) {
    if (para.isHeader) continue;
    const frPara = frMap.get(para.id);
    const frText = frPara?.originalText ?? para.originalText;
    if (frText) frLines.push(frText);
  }

  // Block 2: all Czech text
  const czLines: string[] = ['', '--- CZECH TRANSLATION ---', ''];
  for (const para of czEntry.paragraphs) {
    if (para.isHeader) continue;
    if (para.translatedText) czLines.push(para.translatedText);
  }

  return [...frLines, ...czLines].join('\n');
}

function renderFewShot(
  czEntry: DiaryEntry,
  frEntry: DiaryEntry,
  examples: FewShotExample[],
  bare: boolean,
): string {
  const lines: string[] = [];

  if (examples.length > 0) {
    lines.push('--- EXAMPLES OF PERFECTED REDACTION ---');
    lines.push('');

    for (const ex of examples) {
      if (!bare) lines.push(`[${ex.id}]`);
      lines.push('French: ' + ex.french);
      lines.push('Draft Czech: ' + ex.draft);
      lines.push('Perfected Czech: ' + ex.perfected);
      lines.push('');
    }

    lines.push('--- NOW IMPROVE THE FOLLOWING ---');
    lines.push('');
  }

  // Append the target text
  if (bare) {
    lines.push(renderBare(czEntry, frEntry));
  } else {
    lines.push(renderIdsText(czEntry, frEntry));
  }

  return lines.join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildParaMap(entry: DiaryEntry): Map<string, Paragraph> {
  const map = new Map<string, Paragraph>();
  for (const p of entry.paragraphs) {
    map.set(p.id, p);
  }
  return map;
}

/**
 * Create a combined entry with original text injected into each paragraph.
 * This lets the renderer include both original and translated text.
 */
function injectOriginals(czEntry: DiaryEntry, frEntry: DiaryEntry): DiaryEntry {
  const frMap = buildParaMap(frEntry);

  const paragraphs = czEntry.paragraphs.map((p) => {
    const frPara = frMap.get(p.id);
    return {
      ...p,
      originalText: frPara?.originalText ?? p.originalText,
      // Clear notes and glossary for clean output
      notes: [],
      glossaryLinks: [],
    };
  });

  return {
    ...czEntry,
    paragraphs,
    entryGlossaryLinks: [],
  };
}

function generateFormatVariant(
  formatId: FormatId,
  czEntry: DiaryEntry,
  frEntry: DiaryEntry,
  examples: FewShotExample[],
): string {
  switch (formatId) {
    case 'FULL':
      return renderFull(czEntry, frEntry);
    case 'IDS_TEXT':
      return renderIdsText(czEntry, frEntry);
    case 'BARE':
      return renderBare(czEntry, frEntry);
    case 'SIDE_BY_SIDE':
      return renderSideBySide(czEntry, frEntry);
    case 'FEWSHOT':
      return renderFewShot(czEntry, frEntry, examples, false);
    case 'FEWSHOT_BARE':
      return renderFewShot(czEntry, frEntry, examples, true);
    default:
      throw new Error(`Unknown format: ${formatId}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function createRunDir(customDir?: string): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const runDir = customDir ?? path.join(RESULTS_DIR, `run-${ts}`);
  fs.mkdirSync(path.join(runDir, 'inputs'), { recursive: true });
  return runDir;
}

async function main(): Promise<void> {
  const customDir = process.argv[2];
  const runDir = createRunDir(customDir);

  console.log(`Preparing inputs in: ${runDir}`);

  const manifest: Record<string, Record<string, string>> = {};

  for (let i = 0; i < TEST_ENTRIES.length; i++) {
    const entry = TEST_ENTRIES[i];
    const czPath = path.join(CONTENT_DIR, entry.czPath);
    const frPath = path.join(CONTENT_DIR, entry.originalPath);

    if (!fs.existsSync(czPath)) {
      console.warn(`  SKIP: ${entry.czPath} not found`);
      continue;
    }
    if (!fs.existsSync(frPath)) {
      console.warn(`  SKIP: ${entry.originalPath} not found`);
      continue;
    }

    console.log(`  Entry ${i}: ${entry.czPath}`);

    const czEntry = parser.parseFile(czPath);
    const frEntry = parser.parseFile(frPath);

    const entryKey = path.basename(entry.czPath, '.md');
    manifest[entryKey] = {};

    for (const format of FORMATS) {
      const variant = generateFormatVariant(
        format.id,
        czEntry,
        frEntry,
        FEW_SHOT_EXAMPLES,
      );

      const filename = `${entryKey}_${format.id}.txt`;
      const outPath = path.join(runDir, 'inputs', filename);
      fs.writeFileSync(outPath, variant, 'utf-8');
      manifest[entryKey][format.id] = filename;

      console.log(`    ${format.id}: ${variant.length} chars → ${filename}`);
    }
  }

  // Save manifest
  const manifestPath = path.join(runDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    created: new Date().toISOString(),
    entries: TEST_ENTRIES,
    formats: FORMATS,
    inputs: manifest,
  }, null, 2), 'utf-8');

  console.log(`\nManifest: ${manifestPath}`);
  console.log(`Total variants: ${Object.values(manifest).reduce((sum, m) => sum + Object.keys(m).length, 0)}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
