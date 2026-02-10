#!/usr/bin/env npx tsx

/**
 * Project Status CLI
 *
 * Show RSR/LAN/translation progress across all carnets.
 *
 * Usage:
 *   npx tsx src/scripts/project-status.ts              # Full overview
 *   npx tsx src/scripts/project-status.ts original      # Source status (RSR/LAN)
 *   npx tsx src/scripts/project-status.ts cz            # Czech translation status
 *   npx tsx src/scripts/project-status.ts original 001  # Specific carnet
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFrontmatter } from '../shared/src/parser/frontmatter.js';

const BASE_PATH = process.cwd();
const CONTENT_BASE = path.join(BASE_PATH, 'content');
const GLOSSARY_BASE = path.join(CONTENT_BASE, '_original/_glossary');

interface EntryStatus {
  file: string;
  date: string;
  empty: boolean;
  rsr: boolean;
  lan: boolean;
  tr: boolean;
  gem: boolean;
  ed: boolean;
  con: boolean;
}

interface CarnetStatus {
  carnet: string;
  entries: EntryStatus[];
  total: number;
  empty: number;
  rsr: number;
  lan: number;
  tr: number;
  gem: number;
  ed: number;
  con: number;
}

function scanCarnet(lang: string, carnet: string): CarnetStatus {
  const dir = path.join(CONTENT_BASE, lang, carnet);
  if (!fs.existsSync(dir)) {
    return { carnet, entries: [], total: 0, empty: 0, rsr: 0, lan: 0, tr: 0, gem: 0, ed: 0, con: 0 };
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== '_summary.md')
    .sort();

  const entries: EntryStatus[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { metadata } = parseFrontmatter(content);

    const wf = (metadata.workflow as Record<string, unknown>) || {};

    // Check both top-level and nested workflow fields
    const get = (key: string) =>
      !!(metadata[key] || wf[key]);

    entries.push({
      file,
      date: (metadata.date as string) || file.replace('.md', ''),
      empty: get('empty_in_source'),
      rsr: get('research_complete'),
      lan: get('linguistic_annotation_complete'),
      tr: get('translation_complete'),
      gem: get('gemini_reviewed'),
      ed: get('editor_approved'),
      con: get('conductor_approved'),
    });
  }

  return {
    carnet,
    entries,
    total: entries.length,
    empty: entries.filter(e => e.empty).length,
    rsr: entries.filter(e => e.rsr).length,
    lan: entries.filter(e => e.lan).length,
    tr: entries.filter(e => e.tr).length,
    gem: entries.filter(e => e.gem).length,
    ed: entries.filter(e => e.ed).length,
    con: entries.filter(e => e.con).length,
  };
}

function pct(n: number, total: number): string {
  if (total === 0) return '  -';
  if (n === 0) return '  -';
  if (n === total) return '100%';
  return `${Math.round(100 * n / total)}%`.padStart(4);
}

function scanAllCarnets(lang: string): CarnetStatus[] {
  const dir = path.join(CONTENT_BASE, lang);
  if (!fs.existsSync(dir)) return [];

  const carnets = fs.readdirSync(dir)
    .filter(f => /^\d{3}$/.test(f))
    .sort();

  return carnets.map(c => scanCarnet(lang, c));
}

function printSourceStatus(carnetFilter?: string): void {
  const carnets = carnetFilter
    ? [scanCarnet('_original', carnetFilter)]
    : scanAllCarnets('_original');

  if (carnets.length === 0) {
    console.log('No carnets found.');
    return;
  }

  const totals = {
    entries: 0, empty: 0, rsr: 0, lan: 0,
  };

  console.log('=== Source Preparation Status ===\n');
  console.log(`${'Crnt'.padStart(4)} ${'Tot'.padStart(4)} ${'RSR'.padStart(4)} ${'LAN'.padStart(4)}`);
  console.log('─'.repeat(20));

  for (const c of carnets) {
    if (c.total === 0) continue;
    totals.entries += c.total;
    totals.empty += c.empty;
    totals.rsr += c.rsr;
    totals.lan += c.lan;

    // Only show carnets with incomplete work or specific filter
    if (carnetFilter || c.rsr < c.total || c.lan < c.total) {
      console.log(
        `${c.carnet.padStart(4)} ${String(c.total).padStart(4)} ${pct(c.rsr, c.total)} ${pct(c.lan, c.total)}`
      );
    }
  }

  const fullyDone = carnets.filter(c => c.total > 0 && c.rsr === c.total && c.lan === c.total).length;

  console.log('─'.repeat(20));
  console.log(
    `${'All'.padStart(4)} ${String(totals.entries).padStart(4)} ${pct(totals.rsr, totals.entries)} ${pct(totals.lan, totals.entries)}`
  );
  console.log(`\n${fullyDone}/${carnets.filter(c => c.total > 0).length} carnets fully done (RSR+LAN)`);
  console.log(`${totals.entries - totals.rsr} entries need RSR, ${totals.entries - totals.lan} need LAN`);
}

function printTranslationStatus(lang: string, carnetFilter?: string): void {
  const carnets = carnetFilter
    ? [scanCarnet(lang, carnetFilter)]
    : scanAllCarnets(lang);

  if (carnets.length === 0) {
    console.log(`No ${lang} carnets found.`);
    return;
  }

  const totals = {
    entries: 0, tr: 0, gem: 0, ed: 0, con: 0,
  };

  console.log(`=== ${lang.toUpperCase()} Translation Status ===\n`);
  console.log(`${'Crnt'.padStart(4)} ${'Tot'.padStart(4)} ${'TR'.padStart(4)} ${'GEM'.padStart(4)} ${'ED'.padStart(4)} ${'CON'.padStart(4)}`);
  console.log('─'.repeat(28));

  for (const c of carnets) {
    if (c.total === 0) continue;
    totals.entries += c.total;
    totals.tr += c.tr;
    totals.gem += c.gem;
    totals.ed += c.ed;
    totals.con += c.con;

    console.log(
      `${c.carnet.padStart(4)} ${String(c.total).padStart(4)} ${pct(c.tr, c.total)} ${pct(c.gem, c.total)} ${pct(c.ed, c.total)} ${pct(c.con, c.total)}`
    );
  }

  console.log('─'.repeat(28));
  console.log(
    `${'All'.padStart(4)} ${String(totals.entries).padStart(4)} ${pct(totals.tr, totals.entries)} ${pct(totals.gem, totals.entries)} ${pct(totals.ed, totals.entries)} ${pct(totals.con, totals.entries)}`
  );
}

function printOverview(): void {
  // Source status
  printSourceStatus();

  // Glossary stats
  let glossaryCount = 0;
  let categoryCount = 0;
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.isDirectory() && !item.name.startsWith('_')) {
        categoryCount++;
        walk(path.join(dir, item.name));
      } else if (item.name.endsWith('.md')) {
        glossaryCount++;
      }
    }
  };
  walk(GLOSSARY_BASE);
  console.log(`\nGlossary: ${glossaryCount} entries in ${categoryCount} categories`);

  // Translation status for each language that exists
  for (const lang of ['cz', 'en', 'uk', 'fr']) {
    const langDir = path.join(CONTENT_BASE, lang);
    if (!fs.existsSync(langDir)) continue;
    const hasCarnets = fs.readdirSync(langDir).some(f => /^\d{3}$/.test(f));
    if (hasCarnets) {
      console.log('');
      printTranslationStatus(lang);
    }
  }
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Project Status CLI

Usage:
  npx tsx src/scripts/project-status.ts              # Full overview
  npx tsx src/scripts/project-status.ts original      # Source status (RSR/LAN)
  npx tsx src/scripts/project-status.ts original 001  # Specific carnet
  npx tsx src/scripts/project-status.ts cz            # Czech translation
  npx tsx src/scripts/project-status.ts cz 001        # Specific carnet
`);
    return;
  }

  const lang = args[0];
  const carnet = args[1];

  if (!lang) {
    printOverview();
  } else if (lang === 'original' || lang === '_original') {
    printSourceStatus(carnet);
  } else {
    printTranslationStatus(lang, carnet);
  }
}

main();
