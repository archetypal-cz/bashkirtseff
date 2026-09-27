#!/usr/bin/env -S npx tsx
/**
 * rebuild-carnet — apply a per-carnet PLAN: move every paragraph cluster to the
 * entry file the plan gives it, insert missing manuscript paragraphs, renumber
 * the carnet CCC.0001..N in reading order in _original and every translation
 * tree, and rewrite every reference to the old IDs / entry files in the repo.
 *
 * Usage:
 *   npx tsx src/scripts/rebuild-carnet.ts CCC PLAN.json [--write] [--emit DIR] [--root DIR]
 *   npx tsx src/scripts/rebuild-carnet.ts --multi PLAN-065.json PLAN-066.json … [--write] [--emit DIR]
 *                                                                   # several carnets in one run: a plan may place
 *                                                                   # another carnet's paragraph ({"old": "065.0412"} in 066's plan)
 *   npx tsx src/scripts/rebuild-carnet.ts --identity-plan CCC      # current layout as a plan (template)
 *   npx tsx src/scripts/rebuild-carnet.ts --check CCC              # post-apply verifier
 *   just rebuild-carnet 068 plan.json [--write]
 *   just rebuild-carnets plan-065.json plan-066.json [--write]
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
  importForeignClusters,
  linkMovedEntries,
  type CarnetSet,
  type CarnetTree,
  type Issues,
  type Mapping,
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
  console.error('Usage: rebuild-carnet CCC PLAN.json [--write] [--emit DIR] [--root DIR]\n       rebuild-carnet --multi PLAN.json PLAN.json … [--write] [--emit DIR] [--root DIR]\n       rebuild-carnet --identity-plan CCC | --check CCC');
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

const WRITE = flag('--write');
const EMIT = opt('--emit');
const MULTI = flag('--multi');

let planPaths: string[];
let expectCarnet: string | undefined;
if (MULTI) {
  planPaths = positional;
  if (planPaths.length === 0) usage('--multi needs one plan per carnet');
} else {
  expectCarnet = carnetArg(positional[0]);
  if (!positional[1]) usage();
  planPaths = [positional[1]];
}

const sets: CarnetSet[] = [];
for (const planPath of planPaths) {
  let plan: Plan;
  try {
    plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
  } catch (e) {
    usage(`Cannot read plan ${planPath}: ${e instanceof Error ? e.message : e}`);
  }
  if (expectCarnet && plan.carnet !== expectCarnet) usage(`Plan is for carnet ${plan.carnet}, not ${expectCarnet}`);
  if (sets.some((s) => s.carnet === plan.carnet)) usage(`Two plans for carnet ${plan.carnet}`);
  const trees = new Map<string, CarnetTree>();
  for (const lang of TREES) {
    const t = loadTree(contentRoot, lang, plan.carnet);
    if (t) trees.set(lang, t);
  }
  const original = trees.get('_original');
  if (!original) usage(`No content/_original/${plan.carnet}`);
  const snapshot = new Map([...original.files].map(([n, pf]) => [n, pf.clusters.map((c) => c.id)]));
  sets.push({ carnet: plan.carnet, plan, trees, snapshot });
}
const runName = sets.map((s) => s.carnet).join('+');
const planPathOf = new Map(sets.map((s, i) => [s.carnet, planPaths[i]]));

const issues: Issues = { errors: [], warnings: [] };
const claims = sets.length > 1 ? importForeignClusters(sets, issues) : new Map<string, string>();

const mappings = new Map<string, Mapping>();
if (!issues.errors.length) {
  for (const s of sets) {
    const local: Issues = { errors: [], warnings: [] };
    mappings.set(s.carnet, buildMapping(s.plan, s.trees.get('_original')!, local));
    issues.errors.push(...local.errors.map((e) => (sets.length > 1 ? `${s.carnet}: ${e}` : e)));
    issues.warnings.push(...local.warnings.map((w) => (sets.length > 1 ? `${s.carnet}: ${w}` : w)));
  }
}
if (!issues.errors.length && sets.length > 1) linkMovedEntries(sets, mappings);

// Every tree must be in the modern ID format and hold no IDs _original lacks.
const LEGACY = /^\[\/\/\]: # \(\s*\d{2,3}\.\d+\s*\)\s*$/;
for (const s of issues.errors.length ? [] : sets) {
  const mapping = mappings.get(s.carnet)!;
  for (const t of s.trees.values()) {
    const seen = new Map<string, string>();
    for (const [name, pf] of t.files) {
      for (const c of pf.clusters) {
        if (seen.has(c.id)) issues.errors.push(`${t.lang}/${s.carnet}: duplicate ID ${c.id} (${seen.get(c.id)} and ${name})`);
        seen.set(c.id, name);
        if (t.lang !== '_original' && !mapping.idMap.has(c.id) && !mapping.dropped.has(c.id)) {
          issues.errors.push(`${t.lang}/${s.carnet}/${name}: paragraph ${c.id} does not exist in _original — fix the tree first`);
        }
      }
      for (const l of [...(pf.idlessBody ?? []), ...pf.clusters.flatMap((c) => c.lines)]) {
        if (LEGACY.test(l)) issues.errors.push(`${t.lang}/${s.carnet}/${name}: legacy ID line "${l.trim()}" — migrate to the %% form first`);
      }
    }
  }
}

if (issues.errors.length) {
  console.error(`=== rebuild-carnet ${runName}: plan REJECTED (${issues.errors.length} error(s)) ===`);
  for (const e of issues.errors) console.error(`  [ERROR] ${e}`);
  for (const w of issues.warnings) console.error(`  [WARN] ${w}`);
  process.exit(1);
}

const ts = formatTimestamp();
const date = localDate();
const allMappings = [...mappings.values()];
const carnetRewrite = makeRewriter(allMappings, { footnoteLabels: true });
const repoRewrite = makeRewriter(allMappings);

interface FileChange { rel: string; content: string | null }
const changes: FileChange[] = [];
const resultsOf = new Map<string, TreeResult[]>();
const report: string[] = [];
for (const s of sets) {
  const mapping = mappings.get(s.carnet)!;
  const original = s.trees.get('_original')!;
  const label = `rebuild-carnet ${runName}${s.plan.source ? ` (${s.plan.source})` : ''}`;
  // Multi-carnet: entries as they were on disk, imported pseudo-files included
  // (an entry that arrives whole from another carnet counts as unchanged)
  let snapshot: Map<string, string[]> | undefined;
  if (sets.length > 1) {
    snapshot = new Map(s.snapshot);
    for (const name of original.files.keys()) {
      if (!name.includes('/')) continue;
      const [src, file] = name.split('/');
      const ids = sets.find((x) => x.carnet === src)?.snapshot.get(file);
      if (ids) snapshot.set(name, ids);
    }
  }
  const ctx = { plan: s.plan, mapping, rewrite: carnetRewrite, original, timestamp: ts, label, snapshot };
  const results = [...s.trees.values()].map((t) => rebuildTree(t, ctx));
  resultsOf.set(s.carnet, results);

  const changedIds = [...mapping.idMap].filter(([o, n]) => o !== n);
  const newCount = [...mapping.planParaOfNewId.values()].filter((p) => p.new).length;
  const movedIn = [...mapping.idMap.keys()].filter((o) => !o.startsWith(`${s.carnet}.`)).length;
  const movedOut = [...claims].filter(([id]) => id.startsWith(`${s.carnet}.`)).length;
  report.push(`--- carnet ${s.carnet} (plan ${planPathOf.get(s.carnet)})`);
  report.push(`  paragraphs: ${mapping.fileOfNewId.size} (${mapping.idMap.size - movedIn} carried, ${movedIn} moved in, ${movedOut} moved out, ${newCount} new, ${mapping.dropped.size} dropped); ${changedIds.length} ID(s) change`);
  report.push(`  entries: ${s.plan.entries.length}; added ${mapping.addedFiles.length}, removed ${mapping.removedFiles.length}`);
  const renamed = [...mapping.fileMap].filter(([o, n]) => o !== n);
  if (renamed.length) report.push(`  entry URL moves: ${renamed.map(([o, n]) => `${o} → ${n}`).join(', ')}`);
  if (changedIds.length) {
    const shown = changedIds.slice(0, 12).map(([o, n]) => `${o}→${n.startsWith(`${s.carnet}.`) ? n.slice(4) : n}`).join(' ');
    report.push(`  id map: ${shown}${changedIds.length > 12 ? ` … (+${changedIds.length - 12})` : ''}`);
  }
  for (const r of results) {
    const t = s.trees.get(r.lang)!;
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
    report.push(`  ${r.lang.padEnd(9)} ${r.files.size} entries: ${written} changed, ${same} unchanged, ${r.deleted.length} deleted; approval flags reset in ${r.flagResets.length}`);
  }
}

// References elsewhere in content/
const carnetDirs = sets.flatMap((s) => [...s.trees.values()].map((t) => path.relative(repoRoot, t.dir)));
const refFiles: string[] = [];
for (const file of walkRewritable(repoRoot, carnetDirs)) {
  const cur = fs.readFileSync(file, 'utf-8');
  if (!sets.some((s) => cur.includes(s.carnet))) continue;
  const { text, hits } = repoRewrite(cur);
  if (text !== cur) {
    changes.push({ rel: path.relative(repoRoot, file), content: text });
    refFiles.push(`${path.relative(repoRoot, file)} (${hits})`);
  }
}

// --- report ---------------------------------------------------------------------------
console.log(`=== rebuild-carnet ${runName} ${WRITE ? '(WRITE)' : '(dry run)'} ===`);
console.log(report.join('\n'));
console.log(`  references rewritten outside the carnet${sets.length > 1 ? 's' : ''}: ${refFiles.length} file(s)${refFiles.length ? `\n    ${refFiles.join('\n    ')}` : ''}`);
const warnings = [...issues.warnings, ...[...resultsOf.values()].flat().flatMap((r) => r.warnings)];
for (const w of warnings) console.log(`  [WARN] ${w}`);
console.log(`  total file operations: ${changes.length} (${changes.filter((c) => c.content === null).length} deletions)`);

const movedOutOf = (carnet: string) => {
  const out: Record<string, string> = {};
  for (const [id, target] of claims) if (id.startsWith(`${carnet}.`)) out[id] = mappings.get(target)!.idMap.get(id)!;
  return out;
};
const mapOuts = new Map(sets.map((s) => [
  s.carnet,
  mapJson(s.plan, mappings.get(s.carnet)!, path.relative(repoRoot, path.resolve(planPathOf.get(s.carnet)!)), resultsOf.get(s.carnet)!, date,
    sets.length > 1 ? { movedOut: movedOutOf(s.carnet), runCarnets: sets.map((x) => x.carnet) } : {}),
]));
const sqlOut = sqlRemap(allMappings, date);

if (EMIT) {
  for (const s of sets) {
    for (const r of resultsOf.get(s.carnet)!) {
      const dir = path.join(EMIT, r.lang, s.carnet);
      fs.mkdirSync(dir, { recursive: true });
      for (const [name, content] of r.files) fs.writeFileSync(path.join(dir, name), content);
    }
  }
  fs.mkdirSync(path.join(EMIT, '_renumber'), { recursive: true });
  for (const [c, out] of mapOuts) fs.writeFileSync(path.join(EMIT, '_renumber', `${c}-${date}.json`), JSON.stringify(out, null, 2) + '\n');
  fs.writeFileSync(path.join(EMIT, '_renumber', `${runName}-${date}.sql`), sqlOut);
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
const unique = (stem: string) => {
  let base = `${stem}-${date}`;
  for (let k = 2; fs.existsSync(path.join(renumberDir, `${base}.json`)) || fs.existsSync(path.join(renumberDir, `${base}.sql`)); k++) base = `${stem}-${date}-${k}`;
  return base;
};
// Names first, so a single-carnet run keeps CCC-<date>.json next to CCC-<date>.sql
const bases = new Map([...mapOuts.keys()].map((c) => [c, unique(c)]));
// One SQL for the whole run (per-carnet files would chain cross-carnet moves)
const sqlBase = sets.length === 1 ? bases.get(runName)! : unique(runName);
const written: string[] = [];
for (const [c, out] of mapOuts) {
  const base = bases.get(c)!;
  writeFileAtomic(path.join(renumberDir, `${base}.json`), JSON.stringify(out, null, 2) + '\n');
  written.push(`content/_renumber/${base}.json`);
}
writeFileAtomic(path.join(renumberDir, `${sqlBase}.sql`), sqlOut);
written.push(`content/_renumber/${sqlBase}.sql`);
const redirectsPath = path.join(renumberDir, 'redirects.json');
let redirects = fs.existsSync(redirectsPath) ? JSON.parse(fs.readFileSync(redirectsPath, 'utf-8')) : {};
for (const s of sets) redirects = mergeRedirects(redirects, mappings.get(s.carnet)!, [...s.trees.keys()]);
writeFileAtomic(redirectsPath, JSON.stringify(redirects, null, 2) + '\n');
console.log(`WROTE ${changes.length} file operation(s); ${written.join(', ')}, redirects content/_renumber/redirects.json`);
console.log('Next: just renumber-check, then just verify-carnet / just splicescan for every tree (see docs/REBUILD_CARNET.md).');
let ok = true;
for (const s of sets) ok = runCheck(s.carnet) && ok;
process.exit(ok ? 0 : 1);
