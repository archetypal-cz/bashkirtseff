#!/usr/bin/env -S npx tsx
/**
 * rebuild-carnet — apply a per-carnet PLAN: move every paragraph cluster to the
 * entry file the plan gives it, insert missing manuscript paragraphs, renumber
 * the carnet CCC.0001..N in reading order in _original and every translation
 * tree, and rewrite every reference to the old IDs / entry files in the repo.
 *
 * Usage:
 *   npx tsx src/scripts/rebuild-carnet.ts CCC PLAN.json [--write] [--emit DIR] [--root DIR]
 *   npx tsx src/scripts/rebuild-carnet.ts --identity-plan CCC      # current layout as a plan (template)
 *   npx tsx src/scripts/rebuild-carnet.ts --check CCC              # post-apply verifier
 *   just rebuild-carnet 068 plan.json [--write]
 *   just rebuild-carnet-plan 068 > plan.json
 *   just renumber-check 068
 *
 * Dry run by default: prints what would change. --emit DIR also writes the
 * would-be carnet files and outputs under DIR for inspection. --write applies
 * to the working tree and writes content/_renumber/CCC-<date>.{json,sql} plus
 * content/_renumber/redirects.json, then runs the check.
 *
 * Plan format, flag-reset rule and limits: docs/REBUILD_CARNET.md.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeCarnet } from './lib/carnet.js';
import { writeFileAtomic } from './lib/atomic-write.js';
import {
  TREES,
  buildMapping,
  checkCarnet,
  formatTimestamp,
  identityPlan,
  loadTree,
  makeRewriter,
  mapJson,
  mergeRedirects,
  rebuildTree,
  sqlRemap,
  walkRewritable,
  REWRITE_SKIP_FILES,
  type CarnetTree,
  type Issues,
  type Plan,
  type TreeResult,
} from './lib/rebuild-carnet-core.ts';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith('--') && !['--emit', '--root'].includes(args[i - 1] ?? ''));

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(opt('--root') ?? path.resolve(scriptDir, '..', '..'));
const contentRoot = path.join(repoRoot, 'content');
const renumberDir = path.join(contentRoot, '_renumber');

function usage(msg?: string): never {
  if (msg) console.error(msg);
  console.error('Usage: rebuild-carnet CCC PLAN.json [--write] [--emit DIR] [--root DIR]\n       rebuild-carnet --identity-plan CCC | --check CCC');
  process.exit(2);
}

function carnetArg(raw: string | undefined): string {
  if (!raw) usage();
  try {
    return normalizeCarnet(raw);
  } catch (e) {
    usage(e instanceof Error ? e.message : String(e));
  }
}

function localDate(): string {
  return formatTimestamp().slice(0, 10);
}

// --- --identity-plan / --check -------------------------------------------------

if (flag('--identity-plan')) {
  const carnet = carnetArg(positional[0]);
  const original = loadTree(contentRoot, '_original', carnet);
  if (!original) usage(`No content/_original/${carnet}`);
  // One paragraph per line keeps a 700-paragraph plan readable and diffable.
  const json = JSON.stringify(identityPlan(carnet, original), null, 2).replace(
    /\{\n\s*"old": ("[^"]+")\n\s*\}/g,
    '{ "old": $1 }',
  );
  console.log(json);
  process.exit(0);
}

function runCheck(carnet: string): boolean {
  const maps = fs.existsSync(renumberDir)
    ? fs.readdirSync(renumberDir).filter((f) => f.startsWith(`${carnet}-`) && f.endsWith('.json')).sort()
    : [];
  const removed = new Set<string>();
  for (const f of maps) {
    const j = JSON.parse(fs.readFileSync(path.join(renumberDir, f), 'utf-8'));
    for (const r of j.files_removed ?? []) removed.add(r);
  }
  const live = loadTree(contentRoot, '_original', carnet);
  for (const f of live?.files.keys() ?? []) removed.delete(f);
  const rep = checkCarnet(repoRoot, carnet, [...removed]);
  console.log(`=== renumber-check ${carnet}: last ID ${rep.lastId ?? '(none)'}; ${maps.length} rebuild map(s) on record ===`);
  for (const w of rep.warnings) console.log(`  [WARN] ${w}`);
  for (const e of rep.errors) console.log(`  [FAIL] ${e}`);
  console.log(`RESULT: ${rep.errors.length ? 'FAIL' : 'PASS'} (${rep.errors.length} fail, ${rep.warnings.length} warn)`);
  return rep.errors.length === 0;
}

if (flag('--check')) {
  process.exit(runCheck(carnetArg(positional[0])) ? 0 : 1);
}

// --- rebuild ----------------------------------------------------------------------

const carnet = carnetArg(positional[0]);
const planPath = positional[1];
if (!planPath) usage();
const WRITE = flag('--write');
const EMIT = opt('--emit');

let plan: Plan;
try {
  plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
} catch (e) {
  usage(`Cannot read plan ${planPath}: ${e instanceof Error ? e.message : e}`);
}
if (plan.carnet !== carnet) usage(`Plan is for carnet ${plan.carnet}, not ${carnet}`);

const trees: CarnetTree[] = [];
for (const lang of TREES) {
  const t = loadTree(contentRoot, lang, carnet);
  if (t) trees.push(t);
}
const original = trees.find((t) => t.lang === '_original');
if (!original) usage(`No content/_original/${carnet}`);

const issues: Issues = { errors: [], warnings: [] };
const mapping = buildMapping(plan, original, issues);

// Every tree must be in the modern ID format and hold no IDs _original lacks.
const LEGACY = /^\[\/\/\]: # \(\s*\d{2,3}\.\d+\s*\)\s*$/;
for (const t of trees) {
  const seen = new Map<string, string>();
  for (const [name, pf] of t.files) {
    for (const c of pf.clusters) {
      if (seen.has(c.id)) issues.errors.push(`${t.lang}/${carnet}: duplicate ID ${c.id} (${seen.get(c.id)} and ${name})`);
      seen.set(c.id, name);
      if (t.lang !== '_original' && !mapping.idMap.has(c.id) && !mapping.dropped.has(c.id)) {
        issues.errors.push(`${t.lang}/${carnet}/${name}: paragraph ${c.id} does not exist in _original — fix the tree first`);
      }
    }
    for (const l of [...(pf.idlessBody ?? []), ...pf.clusters.flatMap((c) => c.lines)]) {
      if (LEGACY.test(l)) issues.errors.push(`${t.lang}/${carnet}/${name}: legacy ID line "${l.trim()}" — migrate to the %% form first`);
    }
  }
}

if (issues.errors.length) {
  console.error(`=== rebuild-carnet ${carnet}: plan REJECTED (${issues.errors.length} error(s)) ===`);
  for (const e of issues.errors) console.error(`  [ERROR] ${e}`);
  for (const w of issues.warnings) console.error(`  [WARN] ${w}`);
  process.exit(1);
}

const ts = formatTimestamp();
const date = localDate();
const label = `rebuild-carnet ${carnet}${plan.source ? ` (${plan.source})` : ''}`;
const carnetRewrite = makeRewriter(mapping, { footnoteLabels: true });
const repoRewrite = makeRewriter(mapping);
const ctx = { plan, mapping, rewrite: carnetRewrite, original, timestamp: ts, label };

const results: TreeResult[] = trees.map((t) => rebuildTree(t, ctx));

// Per-tree diff against what is on disk
interface FileChange { rel: string; content: string | null }
const changes: FileChange[] = [];
const perTree: string[] = [];
for (const r of results) {
  const t = trees.find((x) => x.lang === r.lang)!;
  let written = 0, same = 0;
  for (const [name, content] of r.files) {
    const full = path.join(t.dir, name);
    const cur = fs.existsSync(full) ? fs.readFileSync(full, 'utf-8') : null;
    if (cur === content) same++;
    else { written++; changes.push({ rel: path.relative(repoRoot, full), content }); }
  }
  for (const name of r.deleted) changes.push({ rel: path.relative(repoRoot, path.join(t.dir, name)), content: null });
  // Carnet docs (README.md …): references only
  for (const f of t.otherFiles) {
    const full = path.join(t.dir, f);
    if (!/\.(md|json|ya?ml|txt)$/.test(f) || REWRITE_SKIP_FILES.has(f)) continue;
    const cur = fs.readFileSync(full, 'utf-8');
    const { text } = repoRewrite(cur);
    if (text !== cur) changes.push({ rel: path.relative(repoRoot, full), content: text });
  }
  perTree.push(`  ${r.lang.padEnd(9)} ${r.files.size} entries: ${written} changed, ${same} unchanged, ${r.deleted.length} deleted; approval flags reset in ${r.flagResets.length}`);
}

// Repo-wide references
const carnetDirs = trees.map((t) => path.relative(repoRoot, t.dir));
const refFiles: string[] = [];
for (const file of walkRewritable(repoRoot, carnetDirs)) {
  const cur = fs.readFileSync(file, 'utf-8');
  if (!cur.includes(carnet)) continue;
  const { text, hits } = repoRewrite(cur);
  if (text !== cur) {
    changes.push({ rel: path.relative(repoRoot, file), content: text });
    refFiles.push(`${path.relative(repoRoot, file)} (${hits})`);
  }
}

// --- report ---------------------------------------------------------------------------
const changedIds = [...mapping.idMap].filter(([o, n]) => o !== n);
const newCount = [...mapping.planParaOfNewId.values()].filter((p) => p.new).length;
console.log(`=== rebuild-carnet ${carnet} ${WRITE ? '(WRITE)' : '(dry run)'} — plan ${planPath} ===`);
console.log(`  paragraphs: ${mapping.fileOfNewId.size} (${mapping.idMap.size} carried, ${newCount} new, ${mapping.dropped.size} dropped); ${changedIds.length} ID(s) change`);
console.log(`  entries: ${plan.entries.length}; added ${mapping.addedFiles.length}, removed ${mapping.removedFiles.length}`);
const renamed = [...mapping.fileMap].filter(([o, n]) => o !== n);
if (renamed.length) console.log(`  entry URL moves: ${renamed.map(([o, n]) => `${o} → ${n}`).join(', ')}`);
if (changedIds.length) {
  const shown = changedIds.slice(0, 12).map(([o, n]) => `${o}→${n.slice(4)}`).join(' ');
  console.log(`  id map: ${shown}${changedIds.length > 12 ? ` … (+${changedIds.length - 12})` : ''}`);
}
console.log(perTree.join('\n'));
console.log(`  references rewritten outside the carnet: ${refFiles.length} file(s)${refFiles.length ? `\n    ${refFiles.join('\n    ')}` : ''}`);
const warnings = [...issues.warnings, ...results.flatMap((r) => r.warnings)];
for (const w of warnings) console.log(`  [WARN] ${w}`);
console.log(`  total file operations: ${changes.length} (${changes.filter((c) => c.content === null).length} deletions)`);

const mapOut = mapJson(plan, mapping, path.relative(repoRoot, path.resolve(planPath)), results, date);
const sqlOut = sqlRemap(mapping, date);

if (EMIT) {
  for (const r of results) {
    const dir = path.join(EMIT, r.lang, carnet);
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, content] of r.files) fs.writeFileSync(path.join(dir, name), content);
  }
  fs.mkdirSync(path.join(EMIT, '_renumber'), { recursive: true });
  fs.writeFileSync(path.join(EMIT, '_renumber', `${carnet}-${date}.json`), JSON.stringify(mapOut, null, 2) + '\n');
  fs.writeFileSync(path.join(EMIT, '_renumber', `${carnet}-${date}.sql`), sqlOut);
  console.log(`  emitted the would-be carnet trees and outputs under ${EMIT}`);
}

if (!WRITE) {
  console.log(changes.length ? 'DRY RUN — nothing written (add --write to apply).' : 'DRY RUN — no change: the plan reproduces the current carnet.');
  process.exit(0);
}

if (changes.length === 0) {
  console.log('Nothing to write: the plan reproduces the current carnet (no map recorded).');
  process.exit(0);
}

for (const c of changes) {
  const full = path.join(repoRoot, c.rel);
  if (c.content === null) fs.rmSync(full);
  else {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    writeFileAtomic(full, c.content);
  }
}

fs.mkdirSync(renumberDir, { recursive: true });
let base = `${carnet}-${date}`;
for (let k = 2; fs.existsSync(path.join(renumberDir, `${base}.json`)); k++) base = `${carnet}-${date}-${k}`;
writeFileAtomic(path.join(renumberDir, `${base}.json`), JSON.stringify(mapOut, null, 2) + '\n');
writeFileAtomic(path.join(renumberDir, `${base}.sql`), sqlOut);
const redirectsPath = path.join(renumberDir, 'redirects.json');
const existing = fs.existsSync(redirectsPath) ? JSON.parse(fs.readFileSync(redirectsPath, 'utf-8')) : {};
writeFileAtomic(redirectsPath, JSON.stringify(mergeRedirects(existing, mapping, trees.map((t) => t.lang)), null, 2) + '\n');
console.log(`WROTE ${changes.length} file operation(s); map content/_renumber/${base}.json, SQL content/_renumber/${base}.sql, redirects content/_renumber/redirects.json`);
console.log('Next: just renumber-check, then just verify-carnet / just splicescan for every tree (see docs/REBUILD_CARNET.md).');
process.exit(runCheck(carnet) ? 0 : 1);
