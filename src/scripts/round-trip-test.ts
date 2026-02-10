#!/usr/bin/env npx tsx
/**
 * Round-trip test: parse entries then re-render, comparing output to original.
 * Reports any differences (data loss, reordering, etc.)
 *
 * Usage: npx tsx src/scripts/round-trip-test.ts [carnet] [--all] [--fix]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ParagraphParser } from '@bashkirtseff/shared/parser';
import { ParagraphRenderer } from '@bashkirtseff/shared/renderer';
import { parseFrontmatter, createFrontmatter } from '@bashkirtseff/shared/parser';

const parser = new ParagraphParser();
const renderer = new ParagraphRenderer();

const CONTENT_DIR = path.resolve('content/_original');

interface TestResult {
  file: string;
  status: 'ok' | 'diff' | 'error';
  issues: string[];
}

function getBodyContent(rawContent: string): string {
  const { content } = parseFrontmatter(rawContent);
  return content.trim();
}

function testFile(filePath: string): TestResult {
  const result: TestResult = {
    file: path.relative(CONTENT_DIR, filePath),
    status: 'ok',
    issues: [],
  };

  try {
    // Parse
    const entry = parser.parseFile(filePath);

    // Check for duplicate paragraph IDs
    const paraIds = entry.paragraphs.filter(p => !p.isHeader).map(p => p.id);
    const idCounts = new Map<string, number>();
    for (const id of paraIds) {
      idCounts.set(id, (idCounts.get(id) || 0) + 1);
    }
    for (const [id, count] of idCounts) {
      if (count > 1) {
        result.issues.push(`DUPLICATE_ID: ${id} appears ${count} times`);
      }
    }

    // Check paragraph sequence
    const metadata = entry.metadata ?? {};
    const paraStart = (metadata.para_start as number) ?? null;
    let expectedNum = paraStart;
    for (const para of entry.paragraphs) {
      if (para.isHeader) continue;
      if (expectedNum !== null && para.paraNum !== expectedNum) {
        result.issues.push(`SEQUENCE: expected ${para.carnetNum}.${String(expectedNum).padStart(4, '0')}, got ${para.id}`);
        // Reset to track from current
        expectedNum = para.paraNum + 1;
      } else if (expectedNum !== null) {
        expectedNum++;
      } else {
        expectedNum = para.paraNum + 1;
      }
    }

    // Render and compare
    const rendered = renderer.renderOriginalEntry(entry);
    const originalBody = getBodyContent(fs.readFileSync(filePath, 'utf-8'));
    const renderedTrimmed = rendered.trim();

    if (originalBody !== renderedTrimmed) {
      // Find first difference
      const origLines = originalBody.split('\n');
      const rendLines = renderedTrimmed.split('\n');
      const maxLines = Math.max(origLines.length, rendLines.length);

      let diffCount = 0;
      for (let i = 0; i < maxLines; i++) {
        const origLine = origLines[i] ?? '<MISSING>';
        const rendLine = rendLines[i] ?? '<MISSING>';
        if (origLine !== rendLine) {
          diffCount++;
          if (diffCount <= 3) {
            result.issues.push(`DIFF L${i + 1}: orig="${origLine.substring(0, 80)}" | rend="${rendLine.substring(0, 80)}"`);
          }
        }
      }
      if (diffCount > 3) {
        result.issues.push(`... and ${diffCount - 3} more line differences`);
      }
      result.issues.push(`LINES: original=${origLines.length}, rendered=${rendLines.length}`);
    }

    // Check footnotes preserved
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const footnotePattern = /^\[\^([^\]]+)\]:\s*(.+)$/gm;
    let match;
    const origFootnotes: string[] = [];
    while ((match = footnotePattern.exec(rawContent)) !== null) {
      origFootnotes.push(match[1]);
    }
    const parsedFootnoteIds = Object.keys(entry.footnotes);
    for (const fnId of origFootnotes) {
      if (!parsedFootnoteIds.includes(fnId)) {
        result.issues.push(`FOOTNOTE_LOST: [^${fnId}] not parsed`);
      }
    }

    if (result.issues.length > 0) {
      result.status = 'diff';
    }
  } catch (e: any) {
    result.status = 'error';
    result.issues.push(`ERROR: ${e.message}`);
  }

  return result;
}

function testCarnet(carnetId: string): TestResult[] {
  const carnetDir = path.join(CONTENT_DIR, carnetId);
  if (!fs.existsSync(carnetDir)) {
    console.error(`Carnet directory not found: ${carnetDir}`);
    return [];
  }

  const files = fs.readdirSync(carnetDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('README'))
    .sort();

  return files.map(f => testFile(path.join(carnetDir, f)));
}

// Main
const args = process.argv.slice(2);
const testAll = args.includes('--all');
const specificCarnet = args.find(a => !a.startsWith('--'));

let carnets: string[];
if (testAll) {
  carnets = fs.readdirSync(CONTENT_DIR)
    .filter(f => /^\d{3}$/.test(f))
    .sort();
} else if (specificCarnet) {
  carnets = [specificCarnet];
} else {
  // Test a representative sample
  carnets = ['001', '010', '015', '045', '073', '082', '083', '100', '106'];
  // Filter to existing
  carnets = carnets.filter(c => fs.existsSync(path.join(CONTENT_DIR, c)));
}

console.log(`Testing ${carnets.length} carnets...`);
console.log('='.repeat(60));

let totalFiles = 0;
let okFiles = 0;
let diffFiles = 0;
let errorFiles = 0;
const allIssueTypes = new Map<string, number>();

for (const carnet of carnets) {
  const results = testCarnet(carnet);
  const issues = results.filter(r => r.status !== 'ok');

  totalFiles += results.length;
  okFiles += results.filter(r => r.status === 'ok').length;
  diffFiles += results.filter(r => r.status === 'diff').length;
  errorFiles += results.filter(r => r.status === 'error').length;

  if (issues.length > 0) {
    console.log(`\nCarnet ${carnet}: ${results.length} files, ${issues.length} with issues`);
    for (const r of issues) {
      console.log(`  ${r.file}:`);
      for (const issue of r.issues) {
        // Track issue types
        const type = issue.split(':')[0];
        allIssueTypes.set(type, (allIssueTypes.get(type) || 0) + 1);
        console.log(`    ${issue}`);
      }
    }
  } else {
    console.log(`Carnet ${carnet}: ${results.length} files - all OK`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`SUMMARY: ${totalFiles} files tested`);
console.log(`  OK:     ${okFiles}`);
console.log(`  DIFF:   ${diffFiles}`);
console.log(`  ERROR:  ${errorFiles}`);

if (allIssueTypes.size > 0) {
  console.log('\nIssue types:');
  for (const [type, count] of [...allIssueTypes].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
}
