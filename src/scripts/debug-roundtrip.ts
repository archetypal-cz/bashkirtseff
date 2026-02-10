#!/usr/bin/env npx tsx
/**
 * Debug round-trip: show detailed parse/render comparison for a single file
 */
import * as fs from 'node:fs';
import { ParagraphParser } from '../shared/src/parser/paragraph-parser.js';
import { ParagraphRenderer } from '../shared/src/renderer/paragraph-renderer.js';
import { parseFrontmatter } from '../shared/src/parser/frontmatter.js';

const parser = new ParagraphParser();
const renderer = new ParagraphRenderer();

const filePath = process.argv[2] || 'content/_original/001/1873-01-11.md';
const raw = fs.readFileSync(filePath, 'utf-8');
const { content } = parseFrontmatter(raw);

const entry = parser.parseFile(filePath);
const rendered = renderer.renderOriginalEntry(entry);

// Show paragraphs parsed
console.log('=== PARSED PARAGRAPHS ===');
for (const p of entry.paragraphs) {
  console.log(`  ID: ${p.id}, header: ${p.isHeader}, notes: ${p.notes.length}, glossary: ${p.glossaryLinks.length}, text: "${(p.originalText || '').substring(0, 60)}"`);
}
console.log(`  Footnotes: ${JSON.stringify(Object.keys(entry.footnotes))}`);
console.log(`  Entry glossary links: ${entry.entryGlossaryLinks.map(l => l.displayText).join(', ')}`);

const origLines = content.trim().split('\n');
const rendLines = rendered.trim().split('\n');
console.log(`\nOriginal: ${origLines.length} lines, Rendered: ${rendLines.length} lines`);

// Show first differences
let shown = 0;
for (let i = 0; i < Math.max(origLines.length, rendLines.length) && shown < 15; i++) {
  const o = origLines[i] ?? '<MISSING>';
  const r = rendLines[i] ?? '<MISSING>';
  if (o !== r) {
    console.log(`\nLine ${i + 1} DIFF:`);
    console.log(`  ORIG: ${o.substring(0, 140)}`);
    console.log(`  REND: ${r.substring(0, 140)}`);
    shown++;
  }
}
