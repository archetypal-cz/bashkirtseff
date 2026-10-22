#!/usr/bin/env npx tsx

/**
 * entities-sync — rebuild the `entities:` frontmatter of _original entries from inline glossary tags.
 *
 * The inline tags (`%% [#Name](../_glossary/<category>/…/FILE.md) %%`) are the curated truth;
 * the frontmatter lists were early-research blobs. The frontend filter index
 * (src/frontend/src/lib/filter-index-builder.ts) reads only frontmatter people/places.
 *
 * ids = glossary FILE basename (CAPITAL_ASCII): that is what the builder's subcategory map and
 * the glossary pages key on (the filter's ciHas() is case-insensitive, so old mixed-case ids still matched).
 *   _glossary/people/**  -> entities.people
 *   _glossary/places/**  -> entities.places
 *   _glossary/culture/** (except culture/themes/) -> entities.cultural
 * Empty people/places are written as `[]`; `cultural` is written only when non-empty or already present.
 * Skips empty_in_source entries and README/_summary. Only the `entities:` block is rewritten.
 *
 * Default (recall-preserving): an id that would be removed is KEPT when one of its glossary aliases
 * (frontmatter aliases + name + id; accent-insensitive, word-boundary, case-sensitive proper nouns) occurs in the entry's
 * visible French and no tag already covers that alias. Kept ids are listed as tag candidates (--candidates FILE.tsv)
 * for the glossary-tagger. --strict removes them anyway. Ids of retired stubs (`status: retired`) are never kept.
 *
 * Usage: just entities-sync [--apply] [--carnet 034,037] [--exclude 012] [--report file.json] [--candidates file.tsv] [--strict] [--root content/_original]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { writeFileAtomic } from './lib/atomic-write.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const args = process.argv.slice(2);
const flagVals = (name: string): string[] => {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && args[i + 1]) out.push(...args[++i].split(',').filter(Boolean));
  }
  return out;
};
const apply = args.includes('--apply');
const only = new Set(flagVals('--carnet').map(s => s.padStart(3, '0')));
const excluded = new Set(flagVals('--exclude').map(s => s.padStart(3, '0')));
const reportPath = flagVals('--report')[0];
const strict = args.includes('--strict');
const candidatesPath = flagVals('--candidates')[0];
const root = path.resolve(flagVals('--root')[0] ?? path.join(REPO_ROOT, 'content/_original'));

const TAG_RE = /\[#[^\]]*\]\(([^)]*?)_glossary\/(people|places|culture)\/([^)]*?)\.md\)/g;

type Lists = { people: string[]; places: string[]; cultural: string[] };

function collectTags(body: string): Lists {
  const out: Lists = { people: [], places: [], cultural: [] };
  const seen = { people: new Set<string>(), places: new Set<string>(), cultural: new Set<string>() };
  for (const m of body.matchAll(TAG_RE)) {
    const [, , cat, rest] = m;
    if (cat === 'culture' && rest.startsWith('themes/')) continue;
    const key = cat === 'people' ? 'people' : cat === 'places' ? 'places' : 'cultural';
    const id = rest.split('/').pop()!;
    if (seen[key].has(id)) continue;
    seen[key].add(id);
    out[key].push(id);
  }
  return out;
}

/** Parse an existing entities block (block or flow lists) into ids. */
function parseOld(block: string): Lists {
  const res: Lists = { people: [], places: [], cultural: [] };
  for (const key of ['people', 'places', 'cultural'] as const) {
    const m = block.match(new RegExp(`^  ${key}:[ \\t]*([^\\n]*)((?:\\n(?:    .*|[ \\t]*))*)`, 'm'));
    if (!m) continue;
    const text = (m[1] + '\n' + m[2]).replace(/[[\]]/g, ' ');
    for (const part of text.split(/[\n,]/)) {
      const t = part.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, '');
      if (t) res[key].push(t);
    }
  }
  return res;
}

const yamlId = (id: string) => (/^[A-Za-z0-9_]+$/.test(id) ? id : JSON.stringify(id));

function render(l: Lists, hadCultural: boolean): string {
  const lines = ['entities:'];
  const emit = (k: string, ids: string[]) => {
    if (!ids.length) lines.push(`  ${k}: []`);
    else { lines.push(`  ${k}:`); for (const id of ids) lines.push(`    - ${yamlId(id)}`); }
  };
  emit('people', l.people);
  emit('places', l.places);
  if (l.cultural.length || hadCultural) emit('cultural', l.cultural);
  return lines.join('\n');
}


// ── Alias check for ids that would be removed ───────────────────────

const fold = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const AMBIGUOUS = new Set(['Nice', 'Portrait', 'Salon', 'Atelier', 'Concert', 'Album', 'Bal', 'Break', 'Roman']);
interface GEntry { id: string; aliases: string[]; retired: boolean }
const glossaryRoot = path.join(root, '_glossary');
const glossary = new Map<string, GEntry>(); // lowercased basename -> entry
(function loadGlossary() {
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) { walk(fp); continue; }
      if (!e.name.endsWith('.md') || e.name === 'CLAUDE.md' || e.name === 'README.md') continue;
      const id = e.name.slice(0, -3);
      let names: string[] = [id.replace(/_/g, ' ')];
      let retired = false;
      const t = fs.readFileSync(fp, 'utf-8');
      const end = t.startsWith('---\n') ? t.indexOf('\n---\n', 4) : -1;
      if (end !== -1) {
        try {
          const fmv = YAML.parse(t.slice(4, end)) ?? {};
          if (fmv.name) names.push(String(fmv.name));
          if (Array.isArray(fmv.aliases)) names.push(...fmv.aliases.map(String));
          retired = fmv.status === 'retired';
        } catch { /* ignore */ }
      }
      const aliases = [...new Set(names.map(n => fold(n).trim()))]
        .filter(a => a.length >= 3 && /^[A-Z]/.test(a) && !AMBIGUOUS.has(a));
      // A live entry wins over a retired stub with the same basename
      if (retired && glossary.get(id.toLowerCase())?.retired === false) continue;
      glossary.set(id.toLowerCase(), { id, aliases, retired });
    }
  };
  if (fs.existsSync(glossaryRoot)) walk(glossaryRoot);
})();
const aliasRe = (a: string) => new RegExp(`(?<![\\p{L}\\p{N}_])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`, 'u');

/** Visible French paragraphs: [paraId, folded text] with %% comments, footnotes and glossary tag lines removed. */
function visibleParas(body: string): [string, string][] {
  const out: [string, string][] = [];
  let id = '', buf: string[] = [];
  const flush = () => { if (buf.length) out.push([id, fold(buf.join(' '))]); buf = []; };
  for (const line of body.split('\n')) {
    const m = line.match(/^%%\s*(\d{3}\.\d{4})\s*%%\s*$/);
    if (m) { flush(); id = m[1]; continue; }
    if (/^\s*%%.*%%\s*$/.test(line) || /^\s*\[\/\/\]: #/.test(line) || /^\[\^/.test(line)) continue;
    buf.push(line.replace(/%%.*?%%/g, ''));
  }
  flush();
  return out;
}

interface Candidate { file: string; id: string; alias: string; para: string }
const candidates: Candidate[] = [];

interface Change { file: string; added: Record<string, string[]>; removed: Record<string, string[]> }
const changes: Change[] = [];
let keptCount = 0;
const perCarnet = new Map<string, { files: number; changed: number; added: number; removed: number }>();

const carnets = fs.readdirSync(root).filter(d => /^\d{3}$/.test(d)).sort()
  .filter(c => (only.size === 0 || only.has(c)) && !excluded.has(c));

for (const carnet of carnets) {
  const stat = { files: 0, changed: 0, added: 0, removed: 0 };
  perCarnet.set(carnet, stat);
  for (const f of fs.readdirSync(path.join(root, carnet)).filter(f => f.endsWith('.md') && f !== 'README.md' && f !== '_summary.md').sort()) {
    const file = path.join(root, carnet, f);
    const text = fs.readFileSync(file, 'utf-8');
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fm) continue;
    if (/^\s*empty_in_source:\s*true\s*$/m.test(fm[1])) continue;
    stat.files++;
    const body = text.slice(fm[0].length);
    const next = collectTags(body);

    const fmText = fm[1];
    const em = fmText.match(/^entities:[^\n]*(?:\n(?:[ \t].*|))*?(?=\n[^ \t\n]|(?![\s\S]))/m);
    const oldLists = em ? parseOld(em[0]) : { people: [], places: [], cultural: [] };
    const hadCultural = !!em && /^  cultural:/m.test(em[0]);
    const nextAll = new Set([...next.people, ...next.places, ...next.cultural].map(x => x.toLowerCase()));
    const tagEntries = [...nextAll].map(x => glossary.get(x)).filter((x): x is GEntry => !!x);
    const coveredAliases = new Set(tagEntries.flatMap(e => e.aliases));
    let paras: [string, string][] | undefined;
    const kept: Lists = { people: [], places: [], cultural: [] };
    if (!strict) {
      for (const k of ['people', 'places', 'cultural'] as const) {
        const have = new Set(next[k].map(x => x.toLowerCase()));
        for (const oid of [...new Set(oldLists[k])]) {
          const lo = oid.toLowerCase();
          if (have.has(lo) || nextAll.has(lo) || kept[k].some(x => x.toLowerCase() === lo)) continue;
          const g = glossary.get(lo);
          if (!g || g.retired) continue; // a retired id is dropped, never kept as a candidate
          paras ??= visibleParas(body);
          let hit: { alias: string; para: string } | undefined;
          for (const a of g.aliases) {
            if (coveredAliases.has(a)) continue;
            const re = aliasRe(a);
            const p = paras.find(([, t]) => re.test(t));
            if (p) { hit = { alias: a, para: p[0] }; break; }
          }
          if (hit) {
            kept[k].push(g.id);
            candidates.push({ file: `${carnet}/${f}`, id: g.id, alias: hit.alias, para: hit.para });
          }
        }
      }
    }
    const merged: Lists = { people: [...next.people, ...kept.people], places: [...next.places, ...kept.places], cultural: [...next.cultural, ...kept.cultural] };
    const block = render(merged, hadCultural);
    const newFm = em ? fmText.replace(em[0], () => block) : fmText + '\n' + block;
    if (newFm === fmText) continue;

    const ch: Change = { file: `${carnet}/${f}`, added: {}, removed: {} };
    for (const k of ['people', 'places', 'cultural'] as const) {
      const o = new Set(oldLists[k].map(s => s.toLowerCase()));
      const n = new Set(merged[k].map(s => s.toLowerCase()));
      const a = merged[k].filter(s => !o.has(s.toLowerCase()));
      const r = [...new Set(oldLists[k])].filter(s => !n.has(s.toLowerCase()));
      if (a.length) ch.added[k] = a;
      if (r.length) ch.removed[k] = r;
      stat.added += a.length;
      stat.removed += r.length;
      keptCount += kept[k].length;
    }
    stat.changed++;
    changes.push(ch);
    if (apply) writeFileAtomic(file, `---\n${newFm}\n---\n${body}`);
  }
}

console.log(`${apply ? 'APPLIED' : 'DRY RUN'}  root=${root}`);
console.log('carnet  files  changed  +ids  -ids');
const tot = { files: 0, changed: 0, added: 0, removed: 0 };
for (const [c, s] of perCarnet) {
  if (s.files === 0) continue;
  console.log(`${c}  ${String(s.files).padStart(5)}  ${String(s.changed).padStart(7)}  ${String(s.added).padStart(4)}  ${String(s.removed).padStart(4)}`);
  tot.files += s.files; tot.changed += s.changed; tot.added += s.added; tot.removed += s.removed;
}
console.log(`kept as tag candidates (not removed): ${keptCount}${strict ? ' (--strict: none kept)' : ''}`);
if (candidatesPath) {
  fs.writeFileSync(candidatesPath, ['file\tid\talias\tparagraph', ...candidates.map(c => [c.file, c.id, c.alias, c.para].join('\t'))].join('\n') + '\n');
  console.log(`candidates: ${candidatesPath}`);
}
console.log(`TOTAL  ${tot.files} files, ${tot.changed} changed, +${tot.added} ids, -${tot.removed} ids`);
if (reportPath) {
  fs.mkdirSync(path.dirname(path.resolve(reportPath)), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ apply, root, totals: tot, perCarnet: Object.fromEntries(perCarnet), changes }, null, 1));
  console.log(`report: ${reportPath}`);
}
