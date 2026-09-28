/**
 * rebuild-carnet core — mechanically re-lays a carnet from a PLAN: every
 * paragraph cluster goes to the entry file and position the plan gives it,
 * missing manuscript paragraphs are inserted, and the whole carnet is
 * renumbered CCC.0001..N in reading order. Every tree that has the carnet
 * (_original, cz, uk, en, fr, es) is rebuilt the same way, and every reference
 * to the old IDs / entry file names in the repo is rewritten.
 *
 * The plan decides WHAT goes WHERE; this module only applies it. Format and
 * rules: docs/REBUILD_CARNET.md. CLI: src/scripts/rebuild-carnet.ts.
 *
 * Work is done on raw lines, not through the paragraph parser, so a cluster
 * that is not touched is written back byte-for-byte (an identity plan is a
 * zero diff).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { renderSourceComment } from '../../shared/src/renderer/paragraph-renderer.ts';
import { localizeGlossaryPath } from '../../shared/src/utils/glossary-path.ts';
import { localizeLinksInText } from '../../shared/src/utils/sync.ts';
import { TODO_PLACEHOLDER } from '../../shared/src/utils/scaffold.ts';
import { PARAGRAPH_KINDS, KIND_LINE_PATTERN, KIND_CONTENT_PATTERN, UNTIMESTAMPED_ROLE_NOTE_PATTERN, EMBEDDED_ROLE_NOTE_PATTERN, formatKindMarker, type ParagraphKind } from '../../shared/src/parser/patterns.ts';

// --- plan types ------------------------------------------------------------

export interface PlanNewParagraph {
  /** Exact French text; several lines allowed ("\n"). A line starting with `#` is a heading. */
  french: string;
  /** RSR comment text (source citation: tome, docx paragraph index…). Required. */
  rsr: string;
  /** Optional glossary tag links in _original form: "[#Nice](../_glossary/places/cities/NICE.md)" */
  tags?: string[];
  /** Optional paragraph kind (docs/REBUILD_CARNET.md, "Paragraph kinds") */
  kind?: ParagraphKind;
  /** Optional source of a clipping/letter: newspaper and date, writer… (no double quote) */
  source?: string;
}

export interface PlanParagraph {
  /** Existing paragraph ID (in _original) that goes here */
  old?: string;
  /** With `old`: replace that paragraph's French text (used to split a paragraph) */
  set_french?: string;
  /** With `old`: set (or replace) the paragraph's kind marker in every tree */
  kind?: ParagraphKind;
  /** With `old` + `kind`: the marker's source */
  source?: string;
  /**
   * With `old`: the paragraph ends with the NEXT day's heading (an extraction
   * artefact). The trailing heading line — and in translations the translated
   * heading plus its embedded French — moves to the start of the next paragraph
   * of the plan, in every tree.
   */
  heading_to_next?: boolean;
  /** A paragraph that does not exist yet */
  new?: PlanNewParagraph;
}

export interface PlanEntry {
  /** Target entry file name, e.g. "1877-01-19.md" */
  file: string;
  /** Entry date (YYYY-MM-DD); the file name must start with it */
  date: string;
  /** Optional date heading, inserted only if the entry's first paragraph has none */
  heading?: string | null;
  /** Optional old entry file whose frontmatter this entry is based on */
  frontmatter_from?: string;
  /** Optional old ID-less entry file (empty_in_source) whose body is carried over verbatim */
  body_from?: string;
  /** Old entry files whose URLs should redirect here (overrides "the file that got its first paragraph") */
  redirect_from?: string[];
  paragraphs: PlanParagraph[];
}

export interface Plan {
  carnet: string;
  source?: string;
  note?: string;
  drop?: { id: string; reason: string }[];
  /** Old ID-less entry files that are deliberately not carried over */
  drop_files?: { file: string; reason: string }[];
  entries: PlanEntry[];
}

// --- parsed files ------------------------------------------------------------

export interface Cluster {
  /** Old paragraph ID; null only for the body of an ID-less file */
  id: string;
  /** Raw lines: the ID line and everything up to the next ID line. The first
   *  cluster of a file also carries the lines between frontmatter and its ID. */
  lines: string[];
  /** Old file it came from */
  origin: string;
}

export interface ParsedFile {
  name: string;
  /** Frontmatter lines including both `---` delimiters, or null */
  fm: string[] | null;
  clusters: Cluster[];
  /** Body lines of a file with no paragraph ID (empty_in_source entries) */
  idlessBody: string[] | null;
  eofNewline: boolean;
}

export interface CarnetTree {
  lang: string;
  dir: string;
  /** Entry files by name */
  files: Map<string, ParsedFile>;
  /** Non-entry files (README.md …) — only ref rewrites apply */
  otherFiles: string[];
}

export const ID_LINE_RE = /^\s*%%\s*(\d{3}\.\d{4})\s*%%\s*$/;
const LEGACY_ID_LINE_RE = /^\[\/\/\]: # \(\s*(\d{2,3})\.(\d+)\s*\)\s*$/;
const HEADING_RE = /^#{1,6}\s+\S/;
const FOOTNOTE_DEF_RE = /^\s*\[\^([^\]]+)\]:/;
const FOOTNOTE_CONT_RE = /^[ \t]+\S/;

/** Trees a carnet may live in, in processing order. `_original` is the reference. */
export const TREES = ['_original', 'cz', 'uk', 'en', 'fr', 'es'];

/** content tree → URL path segment (src/frontend/src/lib/diary-lang-config.ts) */
export const URL_SEGMENT: Record<string, string> = { _original: 'original', cz: 'cz', uk: 'uk', en: 'en', fr: 'fr', es: 'es' };

export function isEntryFileName(f: string): boolean {
  return /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f);
}

/**
 * In a multi-carnet run, clusters another carnet's plan claims are moved into
 * this carnet's trees as a pseudo-file named `<source carnet>/<source file>`
 * before the single-carnet machinery runs (importForeignClusters).
 */
export function isImportName(name: string): boolean {
  return name.includes('/');
}

/** A carnet's cover entry (text on the notebook's cover / front pages): `<first-entry-date>-cover.md` */
export function isCoverFile(f: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-cover\.md$/.test(f);
}

/**
 * Reading order of entry files: by date; on the same date the cover entry
 * first; otherwise plain string order of the name without `.md`. Paragraph
 * IDs run in this order. Same rule as compareEntryIds() in
 * src/frontend/src/lib/content.ts (navigation, carnet listings).
 */
export function entryOrder(a: string, b: string): number {
  const x = a.replace(/\.md$/, ''), y = b.replace(/\.md$/, '');
  const da = x.slice(0, 10), db = y.slice(0, 10);
  if (da !== db) return da < db ? -1 : 1;
  const ca = x.endsWith('-cover'), cb = y.endsWith('-cover');
  if (ca !== cb) return ca ? -1 : 1;
  return x < y ? -1 : x > y ? 1 : 0;
}

export function parseEntryText(name: string, text: string): ParsedFile {
  const lines = text.split('\n');
  const eofNewline = text.endsWith('\n');
  if (eofNewline) lines.pop();

  let fm: string[] | null = null;
  let bodyStart = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        fm = lines.slice(0, i + 1);
        bodyStart = i + 1;
        break;
      }
    }
  }

  const clusters: Cluster[] = [];
  let pending: string[] = [];
  for (let i = bodyStart; i < lines.length; i++) {
    const m = lines[i].match(ID_LINE_RE);
    if (m) {
      if (clusters.length === 0) {
        clusters.push({ id: m[1], lines: [...pending, lines[i]], origin: name });
        pending = [];
      } else {
        clusters.push({ id: m[1], lines: [lines[i]], origin: name });
      }
    } else if (clusters.length === 0) {
      pending.push(lines[i]);
    } else {
      clusters[clusters.length - 1].lines.push(lines[i]);
    }
  }
  return { name, fm, clusters, idlessBody: clusters.length === 0 ? pending : null, eofNewline };
}

export function loadTree(contentRoot: string, lang: string, carnet: string): CarnetTree | null {
  const dir = path.join(contentRoot, lang, carnet);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;
  const files = new Map<string, ParsedFile>();
  const otherFiles: string[] = [];
  for (const f of fs.readdirSync(dir).sort(entryOrder)) {
    const full = path.join(dir, f);
    if (!fs.statSync(full).isFile()) continue;
    if (isEntryFileName(f)) files.set(f, parseEntryText(f, fs.readFileSync(full, 'utf-8')));
    else otherFiles.push(f);
  }
  return { lang, dir, files, otherFiles };
}

// --- validation & mapping ------------------------------------------------------

export interface Mapping {
  carnet: string;
  /** old ID → new ID (every surviving old ID, unchanged ones included) */
  idMap: Map<string, string>;
  dropped: Map<string, string>;
  /** new ID → entry file it lives in */
  fileOfNewId: Map<string, string>;
  /** new ID → plan paragraph (for new / set_french) */
  planParaOfNewId: Map<string, PlanParagraph>;
  /** new entry file → ordered new IDs */
  newFileIds: Map<string, string[]>;
  /** old entry file → entry file that now holds its first paragraph (renamed ones only matter) */
  fileMap: Map<string, string>;
  /** old entry files that no longer exist */
  removedFiles: string[];
  addedFiles: string[];
}

export interface Issues {
  errors: string[];
  warnings: string[];
}

const pad4 = (n: number) => String(n).padStart(4, '0');

/** Check the plan against the carnet's _original tree and compute the renumbering. */
export function buildMapping(plan: Plan, original: CarnetTree, issues: Issues): Mapping {
  const carnet = plan.carnet;
  const err = (m: string) => issues.errors.push(m);
  const warn = (m: string) => issues.warnings.push(m);

  if (!/^\d{3}$/.test(carnet)) err(`plan.carnet must be a 3-digit string, got ${JSON.stringify(carnet)}`);
  if (!Array.isArray(plan.entries) || plan.entries.length === 0) err('plan.entries is empty');

  // Existing IDs in _original, in file order
  const oldIdFile = new Map<string, string>();
  const oldOrder: string[] = [];
  for (const [name, pf] of original.files) {
    for (const c of pf.clusters) {
      if (oldIdFile.has(c.id)) err(`_original: duplicate paragraph ID ${c.id} (${oldIdFile.get(c.id)} and ${name})`);
      if (!c.id.startsWith(`${carnet}.`) && !isImportName(name)) err(`_original/${name}: foreign paragraph ID ${c.id}`);
      oldIdFile.set(c.id, name);
      oldOrder.push(c.id);
    }
  }

  const seen = new Set<string>();
  const dropped = new Map<string, string>();
  for (const d of plan.drop ?? []) {
    if (!d || typeof d.id !== 'string' || !d.reason?.trim()) { err(`drop entries need {id, reason}: ${JSON.stringify(d)}`); continue; }
    if (!oldIdFile.has(d.id)) err(`drop: unknown ID ${d.id}`);
    if (dropped.has(d.id)) err(`drop: ${d.id} listed twice`);
    dropped.set(d.id, d.reason);
  }

  const idMap = new Map<string, string>();
  const fileOfNewId = new Map<string, string>();
  const planParaOfNewId = new Map<string, PlanParagraph>();
  const newFileIds = new Map<string, string[]>();
  const planFiles = new Set<string>();
  const bodyFrom = new Set<string>();
  let n = 0;
  let prevDate = '';

  for (const entry of plan.entries ?? []) {
    const where = `entry ${entry?.file}`;
    if (!entry || typeof entry.file !== 'string' || !isEntryFileName(entry.file) || entry.file.includes('/')) {
      err(`bad entry file name: ${JSON.stringify(entry?.file)}`);
      continue;
    }
    if (planFiles.has(entry.file)) err(`${where}: file listed twice`);
    planFiles.add(entry.file);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? '') || Number.isNaN(Date.parse(entry.date))) err(`${where}: bad date ${JSON.stringify(entry.date)}`);
    else {
      if (!entry.file.startsWith(entry.date)) err(`${where}: file name does not start with its date ${entry.date}`);
      if (entry.date < prevDate) warn(`${where}: date ${entry.date} is earlier than the previous entry (${prevDate}) — plan order is reading order`);
      prevDate = entry.date;
    }
    if (entry.frontmatter_from && !original.files.has(entry.frontmatter_from)) err(`${where}: frontmatter_from ${entry.frontmatter_from} is not a file of _original/${carnet}`);
    if (entry.heading != null && (typeof entry.heading !== 'string' || /[\n]|%%/.test(entry.heading))) err(`${where}: heading must be one line without the comment marker`);
    if (entry.body_from) {
      const bf = original.files.get(entry.body_from);
      if (!bf) err(`${where}: body_from ${entry.body_from} is not a file of _original/${carnet}`);
      else if (bf.idlessBody === null) err(`${where}: body_from ${entry.body_from} has paragraph IDs — list its paragraphs instead`);
      if ((entry.paragraphs ?? []).length) err(`${where}: body_from entries cannot also list paragraphs`);
      if (bodyFrom.has(entry.body_from)) err(`${where}: body_from ${entry.body_from} used twice`);
      bodyFrom.add(entry.body_from);
    } else if (!Array.isArray(entry.paragraphs) || entry.paragraphs.length === 0) {
      err(`${where}: no paragraphs (use body_from for an ID-less entry)`);
    }
    const ids: string[] = [];
    newFileIds.set(entry.file, ids);
    for (const p of entry.paragraphs ?? []) {
      const hasOld = typeof p?.old === 'string';
      const hasNew = p?.new !== undefined;
      if (hasOld === hasNew) { err(`${where}: each paragraph needs exactly one of "old" / "new": ${JSON.stringify(p)}`); continue; }
      const newId = `${carnet}.${pad4(++n)}`;
      if (hasOld) {
        const old = p.old!;
        if (!oldIdFile.has(old)) err(`${where}: unknown ID ${old}`);
        if (seen.has(old)) err(`${where}: ID ${old} placed twice`);
        if (dropped.has(old)) err(`${where}: ID ${old} is both placed and dropped`);
        seen.add(old);
        idMap.set(old, newId);
        if (p.set_french !== undefined) {
          if (typeof p.set_french !== 'string' || !p.set_french.trim() || p.set_french.includes('%%')) err(`${where}: set_french for ${old} must be non-empty text without the comment marker`);
          planParaOfNewId.set(newId, p);
        }
        if (p.kind !== undefined || p.source !== undefined) {
          checkKind(p.kind, p.source, `${where} ${old}`, err);
          planParaOfNewId.set(newId, p);
        }
        if (p.heading_to_next !== undefined) {
          if (p.heading_to_next !== true) err(`${where}: heading_to_next must be true when given`);
          const cl = [...original.files.values()].flatMap((f) => f.clusters).find((c) => c.id === old);
          if (cl && !trailingHeadingIdx(cl.lines).length) err(`${where}: heading_to_next on ${old}, but its French does not end with a heading line`);
          planParaOfNewId.set(newId, p);
        }
      } else {
        const np = p.new!;
        if (typeof np.french !== 'string' || !np.french.trim()) err(`${where}: new paragraph without french text`);
        else if (np.french.includes('%%')) err(`${where}: new french text contains the comment marker`);
        if (typeof np.rsr !== 'string' || !np.rsr.trim()) err(`${where}: new paragraph needs an "rsr" note (cite the source)`);
        else if (/%%|\n/.test(np.rsr)) err(`${where}: rsr note must be one line without the comment marker`);
        for (const t of np.tags ?? []) {
          if (!/^\[#[^\]]+\]\(\.\.\/_glossary\/[^)]+\.md\)$/.test(t)) err(`${where}: tag must look like [#Name](../_glossary/…/X.md): ${t}`);
        }
        if (np.kind !== undefined || np.source !== undefined) checkKind(np.kind, np.source, `${where} new paragraph`, err);
        planParaOfNewId.set(newId, p);
      }
      ids.push(newId);
      fileOfNewId.set(newId, entry.file);
    }
  }

  // Plan order is reading order, and paragraph IDs must run in file-name order:
  // the two have to agree (a cover entry first, then by date).
  const names = (plan.entries ?? []).map((e) => e?.file).filter((f): f is string => typeof f === 'string');
  const sorted = [...names].sort(entryOrder);
  const firstOff = names.findIndex((f, i) => f !== sorted[i]);
  if (firstOff >= 0) err(`entry order: ${names[firstOff]} is listed where ${sorted[firstOff]} sorts — list entries in file-name order (by date; a cover entry first on its date)`);
  names.forEach((f, i) => {
    if (isCoverFile(f) && i !== 0) err(`${f}: a cover entry must be the carnet's first entry`);
  });
  if (names.length > 1 && isCoverFile(names[0]) && names[1].slice(0, 10) !== names[0].slice(0, 10)) {
    warn(`${names[0]}: a cover entry takes the date of the carnet's first dated entry (${names[1].slice(0, 10)})`);
  }

  // redirect_from: explicit old-URL targets
  const redirectFrom = new Map<string, string>();
  for (const e of plan.entries ?? []) {
    if (e?.redirect_from === undefined) continue;
    if (!Array.isArray(e.redirect_from)) { err(`entry ${e.file}: redirect_from must be a list of old file names`); continue; }
    for (const old of e.redirect_from) {
      if (typeof old !== 'string' || !original.files.has(old)) err(`entry ${e.file}: redirect_from ${JSON.stringify(old)} is not a file of _original/${carnet}`);
      else if (planFiles.has(old)) err(`entry ${e.file}: redirect_from ${old} is still a live entry in the plan`);
      else if (redirectFrom.has(old)) err(`redirect_from ${old} listed by both ${redirectFrom.get(old)} and ${e.file}`);
      else redirectFrom.set(old, e.file);
    }
  }

  const missing = oldOrder.filter((id) => !seen.has(id) && !dropped.has(id));
  if (missing.length) err(`plan omits ${missing.length} existing ID(s) (place them or list them in "drop"): ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? ' …' : ''}`);
  const droppedFiles = new Set((plan.drop_files ?? []).map((d) => d.file));
  for (const [name, pf] of original.files) {
    if (pf.idlessBody !== null && !bodyFrom.has(name) && !droppedFiles.has(name)) {
      err(`_original/${name} has no paragraph IDs: carry it with {"body_from": "${name}"} or list it in "drop_files"`);
    }
  }
  if (n > 9999) err(`carnet would have ${n} paragraphs — beyond 4 digits`);
  if ([...planParaOfNewId].some(([id, p]) => p.heading_to_next && id === `${carnet}.${pad4(n)}`)) err('heading_to_next on the plan\'s last paragraph: there is no next paragraph');

  // old file → file holding its first surviving paragraph
  const fileMap = new Map<string, string>();
  for (const [name, pf] of original.files) {
    if (isImportName(name)) continue; // clusters imported from another carnet (multi-carnet run)
    if (planFiles.has(name)) { fileMap.set(name, name); continue; }
    if (redirectFrom.has(name)) { fileMap.set(name, redirectFrom.get(name)!); continue; }
    if (pf.idlessBody !== null) {
      const e = plan.entries.find((x) => x.body_from === name);
      if (e) fileMap.set(name, e.file);
      continue;
    }
    for (const c of pf.clusters) {
      const nid = idMap.get(c.id);
      if (nid) { fileMap.set(name, fileOfNewId.get(nid)!); break; }
    }
  }
  const removedFiles = [...original.files.keys()].filter((f) => !planFiles.has(f) && !isImportName(f));
  const addedFiles = [...planFiles].filter((f) => !original.files.has(f));
  return { carnet, idMap, dropped, fileOfNewId, planParaOfNewId, newFileIds, fileMap, removedFiles, addedFiles };
}

function checkKind(kind: unknown, source: unknown, where: string, err: (m: string) => void): void {
  if (!PARAGRAPH_KINDS.includes(kind as ParagraphKind)) err(`${where}: kind must be one of ${PARAGRAPH_KINDS.join(', ')} (got ${JSON.stringify(kind)})`);
  if (source !== undefined && (typeof source !== 'string' || !source.trim() || /["\n]|%%/.test(source))) err(`${where}: source must be one line without double quotes or the comment marker`);
}

// --- multi-carnet runs ----------------------------------------------------------------

export interface CarnetSet {
  carnet: string;
  plan: Plan;
  /** trees by language, as loaded from disk and then mutated by importForeignClusters */
  trees: Map<string, CarnetTree>;
  /** _original file → its IDs before any cluster moved to another carnet */
  snapshot: Map<string, string[]>;
}

/**
 * Multi-carnet run: a plan may place a paragraph of another carnet of the run
 * (`{"old": "065.0412"}` in 066's plan). Before each carnet is rebuilt on its
 * own, every such cluster is taken out of its source carnet — in every tree —
 * and put into the target carnet's tree as the pseudo-file
 * `<source carnet>/<source file>` (source order kept). Footnote definitions
 * are copied across the cut so both sides stay complete, and entry-level notes
 * stay with the source entry. Returns ID → target carnet.
 */
export function importForeignClusters(sets: CarnetSet[], issues: Issues): Map<string, string> {
  const err = (m: string) => issues.errors.push(m);
  const byCarnet = new Map(sets.map((s) => [s.carnet, s]));
  const claims = new Map<string, string>(); // old ID → carnet whose plan places it
  const count = new Map<string, number>();
  for (const s of sets) {
    for (const e of s.plan.entries ?? []) {
      for (const p of e?.paragraphs ?? []) {
        if (typeof p?.old !== 'string') continue;
        count.set(p.old, (count.get(p.old) ?? 0) + 1);
        const src = p.old.slice(0, 3);
        if (src === s.carnet) continue;
        if (!byCarnet.has(src)) { err(`${s.carnet} plan: ${p.old} belongs to carnet ${src}, which has no plan in this run`); continue; }
        claims.set(p.old, s.carnet);
      }
    }
    for (const d of s.plan.drop ?? []) {
      if (typeof d?.id === 'string') {
        count.set(d.id, (count.get(d.id) ?? 0) + 1);
        if (!d.id.startsWith(`${s.carnet}.`)) err(`${s.carnet} plan: drop ${d.id} — a carnet can only drop its own paragraphs`);
      }
    }
  }
  for (const [id, n] of count) if (n > 1) err(`${id} is placed or dropped ${n} times across the run's plans`);
  if (issues.errors.length) return claims;

  for (const [id, target] of claims) {
    const src = byCarnet.get(id.slice(0, 3))!;
    const dst = byCarnet.get(target)!;
    let foundInOriginal = false;
    for (const [lang, tree] of src.trees) {
      for (const [name, pf] of tree.files) {
        const idx = pf.clusters.findIndex((c) => c.id === id);
        if (idx < 0) continue;
        if (lang === '_original') foundInOriginal = true;
        const cluster = pf.clusters[idx];
        const lines = [...cluster.lines];
        const staying = pf.clusters.filter((_, i) => i !== idx);
        // entry-level notes stay with the source entry
        if (idx === pf.clusters.length - 1 && idx > 0) {
          const tail = splitEntryTail(lines);
          if (tail.length) pf.clusters[idx - 1].lines.push(...tail);
        }
        // footnote definitions the cluster uses but another cluster of the file holds
        for (const label of footnoteRefs(lines)) {
          if (footnoteDefs(lines).some((d) => d.label === label)) continue;
          for (const o of staying) {
            const d = footnoteDefs(o.lines).find((x) => x.label === label);
            if (d) { lines.push('', ...o.lines.slice(d.start, d.end)); break; }
          }
        }
        // …and definitions it holds that staying clusters still use
        for (const d of footnoteDefs(cluster.lines)) {
          const user = staying.find((o) => footnoteRefs(o.lines).has(d.label) && !footnoteDefs(o.lines).some((x) => x.label === d.label));
          if (user) {
            const tail = user.lines.length - trimTrailingBlank(user.lines).length;
            user.lines.splice(user.lines.length - tail, 0, '', ...cluster.lines.slice(d.start, d.end));
          }
        }
        pf.clusters.splice(idx, 1);
        let dstTree = dst.trees.get(lang);
        if (!dstTree) {
          issues.warnings.push(`${lang}: ${id} exists in ${lang}/${src.carnet} but ${lang} has no carnet ${dst.carnet} — its translation is not carried`);
          continue;
        }
        const vname = `${src.carnet}/${name}`;
        let vf = dstTree.files.get(vname);
        if (!vf) {
          vf = { name: vname, fm: pf.fm ? [...pf.fm] : null, clusters: [], idlessBody: null, eofNewline: pf.eofNewline };
          dstTree.files.set(vname, vf);
        }
        vf.clusters.push({ id, lines, origin: vname });
        // keep source order inside the pseudo-file
        const order = new Map((src.snapshot.get(name) ?? []).map((x, i) => [x, i]));
        vf.clusters.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      }
    }
    if (!foundInOriginal) err(`${target} plan: ${id} does not exist in _original/${src.carnet}`);
  }
  return claims;
}

/**
 * After the per-carnet mappings exist: old entry files whose paragraphs all
 * went to another carnet redirect (and their links point) to where the first
 * of them landed, as "CCC/file.md".
 */
export function linkMovedEntries(sets: CarnetSet[], mappings: Map<string, Mapping>): void {
  const where = new Map<string, string>(); // old ID → new ID, whole run
  for (const m of mappings.values()) for (const [o, n] of m.idMap) where.set(o, n);
  for (const s of sets) {
    const m = mappings.get(s.carnet)!;
    for (const [file, ids] of s.snapshot) {
      if (m.fileMap.has(file) || m.newFileIds.has(file)) continue;
      const first = ids.map((id) => where.get(id)).find(Boolean);
      if (!first) continue;
      const nc = first.slice(0, 3);
      const target = mappings.get(nc)!.fileOfNewId.get(first)!;
      m.fileMap.set(file, nc === s.carnet ? target : `${nc}/${target}`);
    }
  }
}

/** A plan that reproduces the current layout (a template for plan authors). */
export function identityPlan(carnet: string, original: CarnetTree): Plan & { _generated: string } {
  const entries: (PlanEntry & { _first_line?: string })[] = [];
  for (const [name, pf] of original.files) {
    const date = name.slice(0, 10);
    const e: PlanEntry & { _first_line?: string } = { file: name, date, paragraphs: [] };
    if (pf.idlessBody !== null) e.body_from = name;
    for (const c of pf.clusters) e.paragraphs.push({ old: c.id });
    const firstText = (pf.clusters[0]?.lines ?? pf.idlessBody ?? []).find((l) => l.trim() && !l.trim().startsWith('%%') && !l.startsWith('[//]'));
    if (firstText) e._first_line = firstText.slice(0, 100);
    entries.push(e);
  }
  return { carnet, _generated: `identity plan of content/_original/${carnet} — keys starting with _ are ignored`, entries };
}

// --- reference rewriting ------------------------------------------------------

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface Rewriter {
  (text: string): { text: string; hits: number };
}

/**
 * One regex pass per text with a callback, so a value that was just rewritten
 * is never matched again (no chain collisions such as 0005→0006→0007).
 *
 * Rewrites, for this carnet only:
 *   - `CCC/<old-entry>` followed by `#p-CCC-NNNN` → file that now holds that paragraph + new anchor
 *   - `CCC/<old-entry>` (URL paths, relative .md links) → file that received its first paragraph
 *   - `#p-CCC-NNNN` anchors
 *   - footnote labels that embed a paragraph number: `[^068.126.1]`, `[^68.03.1]`, `[^068.0126.1]`
 *   - paragraph ID tokens `CCC.NNNN` (ID lines, comments, glossary citations, code)
 * Dropped IDs become `CCC.DROPPED-NNNN` / `#p-CCC-DROPPED-NNNN` so nothing points at a wrong paragraph.
 */
export function makeRewriter(ms: Mapping | Mapping[], opts: { footnoteLabels?: boolean } = {}): Rewriter {
  // Several mappings = a multi-carnet run: one pass over every carnet in the
  // set, so an ID moved from 065 to 066 is never picked up again by 066's map.
  const maps = Array.isArray(ms) ? ms : [ms];
  const byCarnet = new Map(maps.map((m) => [m.carnet, m]));
  const idMap = new Map<string, string>();
  const dropped = new Set<string>();
  const fileOfNewId = new Map<string, string>();
  for (const m of maps) {
    for (const [o, n] of m.idMap) idMap.set(o, n);
    for (const d of m.dropped.keys()) dropped.add(d);
    for (const [n, f] of m.fileOfNewId) fileOfNewId.set(n, f);
  }
  const cAlt = maps.map((m) => m.carnet).join('|');
  const shortAlt = maps.flatMap((m) => [m.carnet, String(Number(m.carnet))]).join('|');
  const BASE = '(\\d{4}-\\d{2}-\\d{2}[A-Za-z0-9-]*)';
  // Footnote labels are file-local; the short carnet form ("[^6.12.1]" for 006)
  // is too ambiguous to rewrite outside the carnets' own files.
  const fnAlt = opts.footnoteLabels ? `\\[\\^(${shortAlt})\\.(\\d{1,4})([a-z]?)\\.(\\d+)\\]` : '(?!x)x()()()()';
  const re = new RegExp(
    [
      `(?<![\\w-])(${cAlt})/${BASE}((?:\\.md)?/?)#p-(${cAlt})-(\\d{4})(?!\\d)`, // 1 carnet, 2 file, 3 sep, 4 carnet, 5 para
      `(?<![\\w-])(${cAlt})/${BASE}(?![\\w-])`, // 6 carnet, 7 file
      `#p-(${cAlt})-(\\d{4})(?!\\d)`, // 8 carnet, 9 para
      fnAlt, // 10 carnet form, 11 para, 12 suffix, 13 note
      `(?<![\\w.])(${cAlt})\\.(\\d{4})(?![\\d])(?!-\\d{2}-\\d{2})`, // 14 carnet, 15 para («076.1877-12-11» is a date citation)
    ].join('|'),
    'g',
  );
  const pad3 = (c: string) => c.padStart(3, '0');
  const newIdOf = (c: string, para: string) => idMap.get(`${pad3(c)}.${pad4(Number(para))}`) ?? null;
  const isDropped = (c: string, para: string) => dropped.has(`${pad3(c)}.${pad4(Number(para))}`);
  const split = (id: string) => ({ c: id.slice(0, 3), n: id.slice(4) });
  /** carnet/base the old entry `c/base` now lives at (itself when unchanged or unknown) */
  const fileOf = (c: string, base: string): string => {
    const target = byCarnet.get(c)?.fileMap.get(`${base}.md`);
    if (!target) return `${c}/${base}`;
    return target.includes('/') ? target.replace(/\.md$/, '') : `${c}/${target.replace(/\.md$/, '')}`;
  };
  const pathOfNew = (nid: string) => `${split(nid).c}/${fileOfNewId.get(nid)!.replace(/\.md$/, '')}`;

  const rewriteSpan = (text: string) => {
    let hits = 0;
    const out = text.replace(re, (whole, c1, f2, s3, c4, p5, c6, f7, c8, p9, fc10, fp11, fs12, fn13, c14, p15) => {
      let rep = whole;
      if (c1 !== undefined) {
        const nid = newIdOf(c4, p5);
        if (nid) rep = `${pathOfNew(nid)}${s3}#p-${split(nid).c}-${split(nid).n}`;
        else rep = `${fileOf(c1, f2)}${s3}#p-${c4}-${isDropped(c4, p5) ? `DROPPED-${p5}` : p5}`;
      } else if (c6 !== undefined) {
        rep = fileOf(c6, f7);
      } else if (c8 !== undefined) {
        const nid = newIdOf(c8, p9);
        rep = nid ? `#p-${split(nid).c}-${split(nid).n}` : isDropped(c8, p9) ? `#p-${c8}-DROPPED-${p9}` : whole;
      } else if (fc10 !== undefined) {
        const nid = newIdOf(fc10, fp11);
        if (nid) {
          const { c, n } = split(nid);
          const form = fc10.length === 3 ? c : String(Number(c));
          rep = `[^${form}.${String(Number(n)).padStart(fp11.length, '0')}${fs12}.${fn13}]`;
        }
      } else if (c14 !== undefined) {
        const nid = newIdOf(c14, p15);
        rep = nid ?? (isDropped(c14, p15) ? `${c14}.DROPPED-${p15}` : whole);
      }
      if (rep !== whole) hits++;
      return rep;
    });
    return { text: out, hits };
  };
  // Pragmas: `rebuild-carnet: keep-file` anywhere keeps the whole text,
  // `rebuild-carnet: keep` keeps its own line (examples, historical citations).
  return (text: string) => {
    if (text.includes(KEEP_FILE_PRAGMA)) return { text, hits: 0 };
    if (!text.includes(KEEP_PRAGMA)) return rewriteSpan(text);
    let hits = 0;
    const lines = text.split('\n').map((line) => {
      if (line.includes(KEEP_PRAGMA)) return line;
      const r = rewriteSpan(line);
      hits += r.hits;
      return r.text;
    });
    return { text: lines.join('\n'), hits };
  };
}

export const KEEP_PRAGMA = 'rebuild-carnet: keep';
export const KEEP_FILE_PRAGMA = 'rebuild-carnet: keep-file';

// --- frontmatter (line-level, so untouched keys keep their formatting) ------------

function fmFind(fm: string[], key: string, anyIndent: boolean): number {
  const re = anyIndent ? new RegExp(`^\\s*${key}:`) : new RegExp(`^${key}:`);
  return fm.findIndex((l, i) => i > 0 && i < fm.length - 1 && re.test(l));
}

/** Set a scalar key, keeping the line's indentation and quote style. */
export function fmSet(fm: string[], key: string, value: string | number | boolean, opts: { anyIndent?: boolean; add?: boolean } = {}): boolean {
  const i = fmFind(fm, key, !!opts.anyIndent);
  const render = (old: string | null) => {
    if (typeof value !== 'string') return String(value);
    if (old && /^".*"$/.test(old.trim())) return `"${value}"`;
    if (old && /^'.*'$/.test(old.trim())) return `'${value}'`;
    return value;
  };
  if (i >= 0) {
    const m = fm[i].match(/^(\s*[\w-]+:)\s*(.*?)\s*$/)!;
    const next = `${m[1]} ${render(m[2])}`;
    if (fm[i] === next) return false;
    // A value that is only re-quoted or re-spaced is left alone.
    if (m[2].replace(/^["']|["']$/g, '') === String(value)) return false;
    fm[i] = next;
    return true;
  }
  if (opts.add) {
    fm.splice(fm.length - 1, 0, `${key}: ${render(null)}`);
    return true;
  }
  return false;
}

export function fmGet(fm: string[] | null, key: string): string | null {
  if (!fm) return null;
  const i = fmFind(fm, key, false);
  if (i < 0) return null;
  return fm[i].replace(/^[\w-]+:\s*/, '').replace(/^["']|["']$/g, '').trim();
}

/** Approval keys reset when an entry's paragraph set changes (any indentation, so `workflow:` nesting counts). */
export const APPROVAL_KEYS = ['translation_complete', 'opus_reviewed', 'editor_approved', 'conductor_approved', 'edition_complete', 'review_complete'];

// --- rebuilding a tree ----------------------------------------------------------

export interface TreeResult {
  lang: string;
  /** file name → new content (every file of the new layout) */
  files: Map<string, string>;
  /** old entry files that disappear */
  deleted: string[];
  /** entries whose approval flags were reset */
  flagResets: string[];
  warnings: string[];
  /** problems that must stop a --write */
  errors: string[];
}

export interface RebuildContext {
  plan: Plan;
  mapping: Mapping;
  rewrite: Rewriter;
  original: CarnetTree;
  timestamp: string;
  /** Short label used in ED/RSR comments, e.g. "rebuild-carnet 068 (plan tome09.docx)" */
  label: string;
  /** Multi-carnet run: _original file → IDs before clusters moved between carnets */
  snapshot?: Map<string, string[]>;
}

/** Old _original ID list per entry file, for the "unchanged entry" test. */
function oldIdLists(original: CarnetTree): Map<string, string> {
  const out = new Map<string, string>();
  for (const [name, pf] of original.files) out.set(name, pf.clusters.map((c) => c.id).join(','));
  return out;
}

/** Visible French text lines of an _original cluster (not ID, comment, heading, footnote or blank). */
function textLineIdx(lines: string[]): number[] {
  const idx: number[] = [];
  let inDef = false;
  lines.forEach((l, i) => {
    const t = l.trim();
    if (FOOTNOTE_DEF_RE.test(l)) { inDef = true; return; }
    if (inDef && FOOTNOTE_CONT_RE.test(l)) return;
    inDef = false;
    if (!t || t.startsWith('%%') || t.startsWith('[//]:') || ID_LINE_RE.test(l) || HEADING_RE.test(t)) return;
    idx.push(i);
  });
  return idx;
}

/** Is the first reader-visible line of the cluster a heading? */
function hasLeadingHeading(lines: string[]): boolean {
  for (const l of lines) {
    const t = l.trim();
    if (!t || t.startsWith('%%') || t.startsWith('[//]:') || FOOTNOTE_DEF_RE.test(l) || ID_LINE_RE.test(l)) continue;
    return HEADING_RE.test(t);
  }
  return false;
}

/** The French of an _original cluster: its text lines and its `#` heading lines, in order. */
function frenchLineIdx(lines: string[]): number[] {
  const text = new Set(textLineIdx(lines));
  return lines.map((l, i) => i).filter((i) => text.has(i) || (HEADING_RE.test(lines[i].trim()) && !ID_LINE_RE.test(lines[i])));
}

function hasHeading(lines: string[]): boolean {
  return lines.some((l) => HEADING_RE.test(l.trim()));
}

/** Index after the ID line and the tag/comment lines that directly follow it. */
function afterIdAndComments(lines: string[]): number {
  let i = lines.findIndex((l) => ID_LINE_RE.test(l));
  i = i < 0 ? 0 : i + 1;
  while (i < lines.length && /^\s*%%.*%%\s*$/.test(lines[i]) && !ID_LINE_RE.test(lines[i])) i++;
  return i;
}

/** Footnote definitions in a cluster: label → [start, endExclusive) */
function footnoteDefs(lines: string[]): { label: string; start: number; end: number }[] {
  const defs: { label: string; start: number; end: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FOOTNOTE_DEF_RE);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && FOOTNOTE_CONT_RE.test(lines[j]) && !ID_LINE_RE.test(lines[j])) j++;
    defs.push({ label: m[1], start: i, end: j });
    i = j - 1;
  }
  return defs;
}

function footnoteRefs(lines: string[]): Set<string> {
  const refs = new Set<string>();
  for (const l of lines) {
    const scan = l.replace(FOOTNOTE_DEF_RE, '');
    for (const m of scan.matchAll(/\[\^([^\]]+)\]/g)) refs.add(m[1]);
  }
  return refs;
}

function trimTrailingBlank(lines: string[]): string[] {
  const out = [...lines];
  while (out.length && out[out.length - 1].trim() === '') out.pop();
  return out;
}

/**
 * Move each footnote definition to a cluster that references it when its own
 * cluster and every referencing cluster of the same old file end up in
 * different new files. A no-op for clusters that stay together.
 */
function rehomeFootnotes(tree: CarnetTree, lines: Map<string, string[]>, destOf: (oldId: string) => string | undefined, warnings: string[]): Map<string, string[]> {
  for (const pf of tree.files.values()) {
    for (const c of pf.clusters) {
      const own = lines.get(c.id)!;
      const defs = footnoteDefs(own).reverse();
      for (const d of defs) {
        const myDest = destOf(c.id);
        const referrers = pf.clusters.filter((o) => footnoteRefs(lines.get(o.id)!.filter((_, i) => !(o.id === c.id && i >= d.start && i < d.end))).has(d.label));
        if (referrers.length === 0 || referrers.some((o) => destOf(o.id) === myDest)) continue;
        const block = own.slice(d.start, d.end);
        own.splice(d.start, d.end - d.start);
        const done = new Set<string>();
        for (const r of referrers) {
          const dest = destOf(r.id);
          if (!dest || done.has(dest)) continue;
          done.add(dest);
          const target = lines.get(r.id)!;
          const tail = target.length - trimTrailingBlank(target).length;
          target.splice(target.length - tail, 0, '', ...block);
        }
        warnings.push(`${tree.lang}: footnote [^${d.label}] moved from ${c.id} to ${referrers.map((r) => r.id).join('/')} (they now live in different entries)`);
      }
    }
  }
  return lines;
}

/** Rename footnote labels that collide inside one new file (clusters from different old files). */
function dedupeFootnoteLabels(parts: { origin: string; lines: string[] }[], file: string, lang: string, warnings: string[]): void {
  const owner = new Map<string, string>();
  const byOrigin = new Map<string, { origin: string; lines: string[] }[]>();
  for (const p of parts) {
    if (!byOrigin.has(p.origin)) byOrigin.set(p.origin, []);
    byOrigin.get(p.origin)!.push(p);
  }
  for (const [origin, group] of byOrigin) {
    const labels = new Set<string>();
    for (const p of group) for (const d of footnoteDefs(p.lines)) labels.add(d.label);
    for (const label of labels) {
      if (!owner.has(label)) { owner.set(label, origin); continue; }
      let alt = `${label}b`;
      while (owner.has(alt) || labels.has(alt)) alt += 'b';
      owner.set(alt, origin);
      const re = new RegExp(`\\[\\^${escapeRe(label)}\\]`, 'g');
      for (const p of group) for (let i = 0; i < p.lines.length; i++) p.lines[i] = p.lines[i].replace(re, `[^${alt}]`);
      warnings.push(`${lang}/${file}: footnote label [^${label}] from ${origin} renamed [^${alt}] (collision)`);
    }
  }
}

/** Glossary tag every clipping carries (plus its newspaper's own tag, from the plan) */
export const CLIPPING_TAG = '[#Press_clipping](../_glossary/culture/newspapers/PRESS_CLIPPING.md)';

/**
 * A new paragraph with its kind applied: clippings and letters are block
 * quotations (`> ` on every line), and a clipping always carries CLIPPING_TAG.
 */
function withKind(np: PlanNewParagraph): PlanNewParagraph & { kindLine: string | null } {
  if (!np.kind) return { ...np, kindLine: null };
  let french = np.french;
  if (np.kind === 'clipping' || np.kind === 'letter') {
    french = french.split('\n').map((l) => (!l.trim() || /^\s*>/.test(l) || HEADING_RE.test(l.trim()) ? l : `> ${l.trim()}`)).join('\n');
  }
  const tags = [...(np.tags ?? [])];
  if (np.kind === 'clipping' && !tags.includes(CLIPPING_TAG)) tags.push(CLIPPING_TAG);
  return { ...np, french, tags, kindLine: formatKindMarker(np.kind, np.source?.trim()) };
}

function newOriginalCluster(newId: string, raw: PlanNewParagraph, ts: string): string[] {
  const np = withKind(raw);
  const out = [`%% ${newId} %%`];
  if (np.kindLine) out.push(np.kindLine);
  for (const t of np.tags ?? []) out.push(`%% ${t} %%`);
  out.push(`%% ${ts} RSR: ${np.rsr.trim()} %%`);
  out.push(...np.french.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()));
  return out;
}

/** A translation cluster for a new paragraph, shaped like `just scaffold` output. */
function newTranslationCluster(newId: string, raw: PlanNewParagraph, ts: string, lang: string, frVisible: boolean): string[] {
  const np = withKind(raw);
  const out = [`%% ${newId} %%`];
  if (np.kindLine) out.push(np.kindLine);
  out.push(...renderSourceComment(np.french));
  for (const t of np.tags ?? []) {
    const m = t.match(/^\[#([^\]]+)\]\(([^)]+)\)$/)!;
    out.push(`%% [#${m[1]}](${localizeGlossaryPath(m[2], lang)}) %%`);
  }
  out.push(`%% ${ts} RSR: ${localizeLinksInText(np.rsr.trim(), lang)} %%`);
  const flines = np.french.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lang === 'fr') {
    if (frVisible) out.push(...flines);
  } else {
    for (const l of flines) if (HEADING_RE.test(l)) out.push(`${l.match(/^#+/)![0]} ${TODO_PLACEHOLDER}`);
    if (flines.some((l) => !HEADING_RE.test(l))) out.push(TODO_PLACEHOLDER);
  }
  return out;
}

/** Does this fr carnet carry visible text (edited) or only the embedded copy (scaffold)? */
function frHasVisibleText(tree: CarnetTree): boolean {
  for (const pf of tree.files.values()) for (const c of pf.clusters) if (textLineIdx(c.lines).length) return true;
  return false;
}

export function rebuildTree(tree: CarnetTree, ctx: RebuildContext): TreeResult {
  const { plan, mapping, rewrite, original, timestamp: ts, label } = ctx;
  const isOrig = tree.lang === '_original';
  const warnings: string[] = [];
  const result: TreeResult = { lang: tree.lang, files: new Map(), deleted: [], flagResets: [], warnings, errors: [] };
  // "unchanged entry" compares with the files as they were on disk, before any
  // cluster left for another carnet (a file that lost one has changed)
  const oldLists = ctx.snapshot ? new Map([...ctx.snapshot].map(([f, ids]) => [f, ids.join(',')])) : oldIdLists(original);
  const origOldIdOfNew = new Map<string, string>();
  for (const [o, nw] of mapping.idMap) origOldIdOfNew.set(nw, o);

  // Where each old cluster of this tree lives now
  const oldFileOfId = new Map<string, string>();
  const seqOfId = new Map<string, number>();
  for (const [name, pf] of tree.files) pf.clusters.forEach((c, i) => { oldFileOfId.set(c.id, name); seqOfId.set(c.id, i); });
  const destOf = (oldId: string) => {
    const nid = mapping.idMap.get(oldId);
    return nid ? mapping.fileOfNewId.get(nid) : undefined;
  };
  // Entry-level notes at the very end of a file (a CON verdict, the RSR entry
  // summary) belong to the entry, not to its last paragraph: they stay with
  // the new entry that holds the old entry's first paragraph.
  const initial = new Map<string, string[]>();
  const tails = new Map<string, string[]>();
  for (const [name, pf] of tree.files) {
    pf.clusters.forEach((c, i) => {
      const lines = [...c.lines];
      if (i === pf.clusters.length - 1) {
        const tail = splitEntryTail(lines);
        if (tail.length) tails.set(name, tail);
      }
      initial.set(c.id, lines);
    });
  }
  const tailsByNewFile = new Map<string, string[]>();
  for (const [name, tail] of tails) {
    let dest = mapping.fileMap.get(name) ?? (mapping.newFileIds.has(name) ? name : undefined);
    if (!dest && isImportName(name)) {
      // a whole entry imported from another carnet: its notes go where its first paragraph went
      const first = tree.files.get(name)!.clusters.map((c) => mapping.idMap.get(c.id)).find(Boolean);
      dest = first ? mapping.fileOfNewId.get(first) : undefined;
    }
    if (!dest) { warnings.push(`${tree.lang}/${name}: entry-level notes dropped with the entry: ${tail.filter((l) => l.trim()).join(' | ').slice(0, 120)}`); continue; }
    if (!tailsByNewFile.has(dest)) tailsByNewFile.set(dest, []);
    tailsByNewFile.get(dest)!.push(...tail);
  }
  const clusterLines = rehomeFootnotes(tree, initial, destOf, warnings);
  if (!isOrig) {
    for (const [name, pf] of tree.files) {
      const orig = original.files.get(name);
      if (!orig) continue;
      const order = pf.clusters.map((c) => orig.clusters.findIndex((x) => x.id === c.id)).filter((i) => i >= 0);
      if (order.some((v, i) => i > 0 && v < order[i - 1])) {
        warnings.push(`${tree.lang}/${name}: paragraph markers are out of source order in this tree — the rebuild puts them in source order; check which text sits under which marker`);
      }
    }
  }
  const frVisible = tree.lang === 'fr' && frHasVisibleText(tree);
  const eofDefault = [...tree.files.values()].filter((f) => f.eofNewline).length * 2 >= tree.files.size;
  // A translation tree that lacks some source entries is partial: it only gets
  // the entries it already has paragraphs for.
  const treeComplete = [...original.files.keys()].filter((f) => !isImportName(f)).every((f) => tree.files.has(f));

  // heading_to_next: heading blocks waiting for the next paragraph of the plan
  const planOrder = plan.entries.flatMap((e) => mapping.newFileIds.get(e.file) ?? []);
  const nextOf = new Map(planOrder.map((id, i) => [id, planOrder[i + 1]]));
  const pendingHeading = new Map<string, string[]>();
  const origClusterOf = new Map<string, string[]>();
  for (const pf of original.files.values()) for (const c of pf.clusters) origClusterOf.set(c.id, c.lines);
  const withPending = (newId: string, lines: string[]): string[] => {
    const block = pendingHeading.get(newId);
    if (!block) return lines;
    pendingHeading.delete(newId);
    if (hasLeadingHeading(lines)) {
      warnings.push(`${tree.lang}: heading_to_next into ${newId}, which already has a heading — heading dropped: ${block.filter((l) => !l.startsWith('%%')).join(' ')}`);
      return lines;
    }
    return insertLeadingHeading(lines, block, isOrig);
  };

  for (const entry of plan.entries) {
    const ids = mapping.newFileIds.get(entry.file)!;
    const oldIds = ids.map((id) => origOldIdOfNew.get(id)).filter((x): x is string => !!x);
    const hasNew = ids.some((id) => mapping.planParaOfNewId.get(id)?.new);
    const hasSetFrench = ids.some((id) => mapping.planParaOfNewId.get(id)?.set_french !== undefined);
    const unchangedFrom = !hasNew && !hasSetFrench && !entry.body_from
      ? [...oldLists].find(([, list]) => list === oldIds.join(','))?.[0]
      : entry.body_from;

    // --- body
    const parts: { origin: string; lines: string[]; seq?: number }[] = [];
    let lastOrigin: string | null = null;
    let headingInserted = false;
    let carried = 0;
    if (entry.body_from) {
      const pf = tree.files.get(entry.body_from);
      if (pf?.idlessBody) parts.push({ origin: entry.body_from, lines: pf.idlessBody.map((l) => rewrite(l).text) });
      else if (!isOrig) warnings.push(`${tree.lang}/${entry.file}: no ${entry.body_from} in this tree to carry the body from`);
      lastOrigin = entry.body_from;
    }
    for (const newId of ids) {
      const pp = mapping.planParaOfNewId.get(newId);
      if (pp?.new) {
        parts.push({ origin: '(new)', lines: withPending(newId, isOrig ? newOriginalCluster(newId, pp.new, ts) : newTranslationCluster(newId, pp.new, ts, tree.lang, frVisible)) });
        lastOrigin = null;
        continue;
      }
      const oldId = origOldIdOfNew.get(newId)!;
      const src = clusterLines.get(oldId);
      if (!src) {
        warnings.push(`${tree.lang}: paragraph ${oldId} (→ ${newId}) is missing in this tree; ${entry.file} will lack it`);
        continue;
      }
      let lines = src.map((l) => rewrite(l).text);
      if (pp?.set_french !== undefined) lines = applySetFrench(lines, oldId, newId, pp.set_french, isOrig, original, ts, label, tree.lang, warnings, result.errors);
      if (pp?.kind) lines = setKindLine(lines, formatKindMarker(pp.kind, pp.source?.trim()));
      if (pp?.heading_to_next) {
        const fr = trailingHeadingIdx(origClusterOf.get(oldId) ?? []).map((i) => origClusterOf.get(oldId)![i].trim());
        const next = nextOf.get(newId);
        const nextPara = next ? mapping.planParaOfNewId.get(next) : undefined;
        const nextOld = next ? origOldIdOfNew.get(next) : undefined;
        const nextHasHeading = nextPara?.new
          ? nextPara.new.french.split('\n').some((l) => HEADING_RE.test(l.trim()))
          : nextOld ? hasLeadingHeading(clusterLines.get(nextOld) ?? []) : false;
        const cut = cutTrailingHeading(lines, fr);
        // a tree that already moved the heading has nothing to cut; one whose next
        // paragraph already opens with a heading keeps its own where it is
        if (cut.block.length && nextHasHeading) warnings.push(`${tree.lang}: heading_to_next on ${oldId}: the next paragraph already opens with a heading in this tree — trailing heading left in place`);
        else if (cut.block.length) {
          lines = cut.lines;
          if (next) pendingHeading.set(next, cut.block);
        }
      }
      lines = withPending(newId, lines);
      parts.push({ origin: oldFileOfId.get(oldId)!, lines, seq: seqOfId.get(oldId) });
      lastOrigin = oldFileOfId.get(oldId)!;
      carried++;
    }
    if (!isOrig && !treeComplete && carried === 0 && !(entry.body_from && tree.files.has(entry.body_from))) {
      warnings.push(`${tree.lang}: partial tree has nothing for ${entry.file} — not created`);
      continue;
    }

    // Plan heading for an entry whose first paragraph has none
    if (entry.heading && parts.length && !entry.body_from) {
      const first = parts[0].lines;
      const origFirst = isOrig ? first : null;
      if (isOrig ? !hasHeading(first) : !originalFirstHasHeading(original, mapping, ids[0], plan) && !hasHeading(first)) {
        if (isOrig) {
          const at = textLineIdx(origFirst!)[0] ?? afterIdAndComments(first);
          first.splice(at, 0, `# ${entry.heading}`);
        } else {
          const at = first.findIndex((l) => ID_LINE_RE.test(l)) + 1;
          const ins = [...renderSourceComment(`# ${entry.heading}`)];
          if (tree.lang !== 'fr') ins.push(`# ${TODO_PLACEHOLDER}`);
          else if (frVisible) ins.push(`# ${entry.heading}`);
          first.splice(at, 0, ...ins);
        }
        headingInserted = true;
      }
    }
    if (isOrig && parts.length && !entry.body_from && !hasHeading(parts[0].lines)) {
      warnings.push(`_original/${entry.file}: first paragraph has no date heading (set "heading" in the plan)`);
    }

    dedupeFootnoteLabels(parts, entry.file, tree.lang, warnings);

    // A file's first cluster carries the lines between frontmatter and its ID.
    // A cluster that was first in its old file and is not first now drops its
    // leading blanks (the join below separates it); a cluster that becomes
    // first gets the blank line this tree puts after the frontmatter.
    parts.forEach((p, i) => {
      if (i > 0) while (p.lines.length && p.lines[0].trim() === '') p.lines.shift();
    });
    if (parts.length && !entry.body_from && parts[0].seq !== 0 && ID_LINE_RE.test(parts[0].lines[0] ?? '') && blankAfterFrontmatter(tree)) parts[0].lines.unshift('');

    const body: string[] = [];
    const tail = tailsByNewFile.get(entry.file);
    if (tail && parts.length) {
      const last = parts[parts.length - 1].lines;
      while (last.length && last[last.length - 1].trim() === '' && tail[0]?.trim() === '') last.pop();
      last.push(...tail.map((l) => rewrite(l).text));
    }
    parts.forEach((p, i) => {
      const lines = [...p.lines];
      // Clusters that were neighbours in the same old file keep their exact seam.
      const next = parts[i + 1];
      const adjacent = next && next.origin === p.origin && p.seq !== undefined && next.seq === p.seq + 1;
      if (next && !adjacent && lines.length && lines[lines.length - 1].trim() !== '') lines.push('');
      body.push(...lines);
    });

    // --- frontmatter
    const changed = !unchangedFrom || headingInserted;
    const baseName = pickBaseFile(tree, entry, oldIds, oldFileOfId, unchangedFrom);
    const base = baseName ? tree.files.get(baseName) : undefined;
    let fm = base?.fm ? [...base.fm] : freshFrontmatter(entry, plan.carnet, tree, ctx);
    fm = rewriteFrontmatter(fm, entry, ids, isOrig, tree.lang, changed && !!base?.fm, hasNew || hasSetFrench, rewrite, baseName);
    if (changed && !isOrig) {
      result.flagResets.push(entry.file);
      const from = [...new Set(oldIds.map((o) => oldFileOfId.get(o)).filter(Boolean))].join(', ') || 'none';
      const newCount = ids.filter((id) => mapping.planParaOfNewId.get(id)?.new).length;
      const note = `${ts} ED: ${label}: this entry's paragraph set changed (paragraphs from ${from}${newCount ? `, ${newCount} new source paragraph(s) marked TODO` : ''}${hasSetFrench ? ', source text replaced in a split paragraph' : ''}${headingInserted ? ', date heading added' : ''}); approval flags reset — re-run translation review on this entry.`;
      const tail = body.length - trimTrailingBlank(body).length;
      body.splice(body.length - tail, tail, '', `%% ${note} %%`);
    }

    const eof = lastOrigin && tree.files.get(lastOrigin) ? tree.files.get(lastOrigin)!.eofNewline : eofDefault;
    const text = [...fm, ...body].join('\n') + (eof ? '\n' : '');
    result.files.set(entry.file, text);
  }

  for (const [id, block] of pendingHeading) {
    warnings.push(`${tree.lang}: heading_to_next: ${id} is missing in this tree — heading not placed: ${block.filter((l) => !l.startsWith('%%')).join(' ')}`);
  }
  for (const name of tree.files.keys()) if (!result.files.has(name) && !isImportName(name)) result.deleted.push(name);
  // Clusters in this tree that the plan does not reach (translation-only IDs)
  for (const id of oldFileOfId.keys()) {
    if (!mapping.idMap.has(id) && !mapping.dropped.has(id)) warnings.push(`${tree.lang}: paragraph ${id} exists only in this tree and was not carried over`);
  }
  return result;
}

/**
 * Cut the entry-level tail off a file's last cluster: the trailing run of
 * whole-line comments after the last text/footnote line, when a blank line
 * separates it from the paragraph (role verdicts) or it is the legacy
 * `[//]: # (… RSR …)` entry summary. Returns the tail (leading blanks included).
 */
function splitEntryTail(lines: string[]): string[] {
  const end = lines.length;
  let i = end - 1;
  while (i >= 0 && lines[i].trim() === '') i--;
  let start = -1;
  let legacyOnly = true;
  while (i >= 0) {
    const t = lines[i].trim();
    const isComment = /^%%.*%%$/.test(t) && !ID_LINE_RE.test(t) && !/^%%\s*\[#/.test(t);
    const isLegacy = /^\[\/\/\]: # \(/.test(t);
    if (!isComment && !isLegacy) break;
    if (!isLegacy) legacyOnly = false;
    start = i;
    i--;
  }
  if (start < 0 || i < 0) return [];
  let blankStart = start;
  while (blankStart > 0 && lines[blankStart - 1].trim() === '') blankStart--;
  if (blankStart === start && !legacyOnly) return [];
  return lines.splice(blankStart, end - blankStart);
}

/** Does this tree usually leave a blank line between frontmatter and the first ID? */
function blankAfterFrontmatter(tree: CarnetTree): boolean {
  let blank = 0, total = 0;
  for (const pf of tree.files.values()) {
    const first = pf.clusters[0]?.lines[0];
    if (first === undefined) continue;
    total++;
    if (first.trim() === '') blank++;
  }
  return blank * 2 > total;
}

function originalFirstHasHeading(original: CarnetTree, mapping: Mapping, firstNewId: string, _plan: Plan): boolean {
  const pp = mapping.planParaOfNewId.get(firstNewId);
  if (pp?.new) return pp.new.french.split('\n').some((l) => HEADING_RE.test(l.trim()));
  for (const [o, nw] of mapping.idMap) {
    if (nw !== firstNewId) continue;
    for (const pf of original.files.values()) {
      const c = pf.clusters.find((x) => x.id === o);
      if (c) return hasHeading(c.lines);
    }
  }
  return false;
}

function pickBaseFile(tree: CarnetTree, entry: PlanEntry, oldIds: string[], oldFileOfId: Map<string, string>, unchangedFrom: string | undefined): string | undefined {
  if (unchangedFrom && tree.files.has(unchangedFrom)) return unchangedFrom;
  if (tree.lang === '_original' && entry.frontmatter_from) return entry.frontmatter_from;
  if (tree.lang !== '_original' && entry.frontmatter_from && tree.files.has(entry.frontmatter_from) && oldIds.length === 0) return entry.frontmatter_from;
  if (tree.lang === '_original') {
    const first = oldIds.length ? oldFileOfId.get(oldIds[0]) : undefined;
    if (first) return first;
  } else {
    // translation: the old file that contributed the most paragraphs (first wins a tie)
    const counts = new Map<string, number>();
    for (const o of oldIds) {
      const f = oldFileOfId.get(o);
      if (f) counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    let best: string | undefined;
    for (const [f, n] of counts) if (!best || n > counts.get(best)!) best = f;
    if (best) return best;
  }
  if (tree.files.has(entry.file)) return entry.file;
  return undefined;
}

function freshFrontmatter(entry: PlanEntry, carnet: string, tree: CarnetTree, ctx: RebuildContext): string[] {
  const loc = ctx.plan.entries
    .slice(0, ctx.plan.entries.indexOf(entry))
    .reverse()
    .map((e) => fmGet(ctx.original.files.get(e.frontmatter_from ?? e.file)?.fm ?? null, 'location'))
    .find((l) => l && l !== 'null');
  const fm = ['---', `date: ${entry.date}`];
  if (tree.lang === '_original' || tree.lang === 'fr') fm.push(`entry_id: ${entry.file.replace(/\.md$/, '')}`);
  fm.push(`carnet: "${carnet}"`);
  fm.push(`location: ${loc ?? 'null'}`);
  if (tree.lang === '_original') {
    fm.push('entities:', '  people: []', '  places: []', 'workflow:', '  research_complete: true', '  linguistic_annotation_complete: false');
  } else if (tree.lang === 'fr') {
    fm.push('entities:', '  people: []', '  places: []', 'edition_complete: false');
  } else {
    fm.push('translation_complete: false', 'editor_approved: false', 'conductor_approved: false');
  }
  fm.push('---');
  return fm;
}

function rewriteFrontmatter(fm: string[], entry: PlanEntry, ids: string[], isOrig: boolean, lang: string, resetFlags: boolean, hasNewSource: boolean, rewrite: Rewriter, baseName: string | undefined): string[] {
  fm = fm.map((l) => rewrite(l).text);
  // entry_id follows whichever convention the base file used (its basename,
  // its date, or something else such as "004-01", which is left alone).
  const oldEntryId = fmGet(fm, 'entry_id');
  const oldDate = fmGet(fm, 'date');
  if (baseName && oldEntryId === baseName.replace(/\.md$/, '')) fmSet(fm, 'entry_id', entry.file.replace(/\.md$/, ''));
  else if (oldEntryId && oldEntryId === oldDate) fmSet(fm, 'entry_id', entry.date);
  // A range-style date ("1876-11-12-15") on a file that keeps its name stays as it is.
  if (!(oldDate && oldDate.startsWith(entry.date) && baseName === entry.file)) fmSet(fm, 'date', entry.date);
  // new IDs belong to the plan's carnet; a base may come from another carnet's entry
  if (ids.length) fmSet(fm, 'carnet', ids[0].slice(0, 3));
  const nums = ids.map((id) => Number(id.split('.')[1]));
  if (nums.length) {
    const [start, end] = [nums[0], nums[nums.length - 1]];
    const has = fmFind(fm, 'para_start', false) >= 0;
    if (isOrig || has) {
      fmSet(fm, 'para_start', start, { add: isOrig });
      fmSet(fm, 'para_end', end, { add: isOrig });
    }
  }
  if (isOrig && hasNewSource) fmSet(fm, 'linguistic_annotation_complete', false, { anyIndent: true });
  if (resetFlags && !isOrig) {
    for (const k of APPROVAL_KEYS) fmSet(fm, k, false, { anyIndent: true });
    fmSet(fm, lang === 'fr' ? 'edition_complete' : 'translation_complete', false, { anyIndent: true, add: true });
    const st = fmFind(fm, 'status', true);
    if (st >= 0 && lang !== 'fr') fmSet(fm, 'status', 'translation_pending', { anyIndent: true });
  }
  return fm;
}

/**
 * Indices of the heading lines that close a cluster: headings after its last
 * visible text line (footnote definitions, comments and blanks may follow).
 */
function trailingHeadingIdx(lines: string[]): number[] {
  const out: number[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (!t || t.startsWith('%%') || t.startsWith('[//]:') || FOOTNOTE_DEF_RE.test(lines[i]) || FOOTNOTE_CONT_RE.test(lines[i])) continue;
    if (ID_LINE_RE.test(lines[i])) break;
    if (HEADING_RE.test(t)) { out.unshift(i); continue; }
    break;
  }
  return out;
}

/**
 * heading_to_next: cut the trailing heading block out of a cluster. In a
 * translation the block is the visible heading plus the embedded copy of the
 * French heading (`%% # Jeudi 4 janvier 1877 %%` or without the `#`).
 */
function cutTrailingHeading(lines: string[], frenchHeadings: string[]): { lines: string[]; block: string[] } {
  const idx = trailingHeadingIdx(lines);
  if (!idx.length) return { lines, block: [] };
  const plain = new Set(frenchHeadings.map((h) => h.replace(/^#+\s*/, '').trim()));
  const embed = lines
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => {
      const m = l.trim().match(/^%%\s*(.*?)\s*%%$/);
      return !!m && plain.has(m[1].replace(/^#+\s*/, '').trim());
    })
    .map(({ i }) => i);
  const take = new Set([...embed, ...idx]);
  const block = lines.filter((_, i) => take.has(i));
  const rest = lines.filter((_, i) => !take.has(i));
  // do not leave a dangling blank run where the heading was
  while (rest.length > 1 && rest[rest.length - 1].trim() === '' && rest[rest.length - 2].trim() === '') rest.pop();
  return { lines: rest, block };
}

/** Insert a moved heading block at the start of a cluster (before the text in _original, after ID/kind lines in a translation). */
function insertLeadingHeading(lines: string[], block: string[], isOrig: boolean): string[] {
  const out = [...lines];
  if (isOrig) {
    const at = textLineIdx(out)[0] ?? afterIdAndComments(out);
    out.splice(at, 0, ...block.filter((l) => !l.trim().startsWith('%%')));
  } else {
    let at = out.findIndex((l) => ID_LINE_RE.test(l)) + 1;
    while (at < out.length && KIND_LINE_PATTERN.test(out[at])) at++;
    out.splice(at, 0, ...block);
  }
  return out;
}

/** Put the kind marker directly under the ID line, replacing any marker already in the cluster. */
function setKindLine(lines: string[], marker: string): string[] {
  const out = lines.filter((l) => !KIND_LINE_PATTERN.test(l));
  const at = out.findIndex((l) => ID_LINE_RE.test(l));
  out.splice(at + 1, 0, marker);
  return out;
}

/** Replace a paragraph's French text (splits). In translations: swap the embedded copy and leave an ED note. */
/**
 * Embedded French lines of a translation cluster: whole-line `%% … %%` comments that
 * are not the ID, a tag line, a kind marker, a version, a `[//]` line or a role note
 * (timestamped or not). Heading copies count (`%% Jeudi 18 octobre 1883 %%`).
 */
export function embeddedFrenchIdx(lines: string[]): number[] {
  const out: number[] = [];
  lines.forEach((l, i) => {
    const m = l.trim().match(/^%%\s*(.*?)\s*%%$/);
    if (!m || m[1].includes('%%') || !m[1]) return;
    const b = m[1];
    if (/^\d{3}\.\d{4}$/.test(b) || b.startsWith('[#') || b.startsWith('[//]') || /^v\d/.test(b)) return;
    if (/^\d{4}-\d{2}-\d{2}/.test(b) || UNTIMESTAMPED_ROLE_NOTE_PATTERN.test(b) || EMBEDDED_ROLE_NOTE_PATTERN.test(b) || KIND_CONTENT_PATTERN.test(b)) return;
    out.push(i);
  });
  return out;
}

/** French compared loosely: no markers, `#`, `> `, footnote refs, typographic quotes, case or spacing. */
export function normFrench(s: string): string {
  return s
    .replace(/%%/g, ' ')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function applySetFrench(lines: string[], oldId: string, newId: string, french: string, isOrig: boolean, original: CarnetTree, ts: string, label: string, lang: string, warnings: string[], errors: string[]): string[] {
  const out = [...lines];
  const newLines = french.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
  // set_french is the paragraph's whole French: text lines AND its `#` heading lines
  let oldText: string[] = [];
  for (const pf of original.files.values()) {
    const c = pf.clusters.find((x) => x.id === oldId);
    if (c) oldText = frenchLineIdx(c.lines).map((i) => c.lines[i]);
  }
  const lostRefs = [...footnoteRefs(oldText)].filter((r) => !french.includes(`[^${r}]`));
  if (lostRefs.length && isOrig) warnings.push(`_original ${oldId}: set_french drops footnote marker(s) ${lostRefs.join(', ')} — move their definitions by hand`);
  const oldHeads = oldText.filter((l) => HEADING_RE.test(l.trim())).map((l) => l.trim());
  const newHeads = newLines.filter((l) => HEADING_RE.test(l.trim())).map((l) => l.trim());
  if (isOrig && oldHeads.join('|') !== newHeads.join('|')) {
    warnings.push(`_original ${oldId}: set_french ${newHeads.length ? 'changes' : 'removes'} its heading ${oldHeads.map((h) => `«${h}»`).join(' ') || '(none)'}${newHeads.length ? ` → ${newHeads.map((h) => `«${h}»`).join(' ')}` : ''} (set_french replaces heading lines too)`);
  }
  if (isOrig) {
    const idx = frenchLineIdx(out);
    if (!idx.length) { out.splice(afterIdAndComments(out), 0, ...newLines); return out; }
    for (const i of [...idx].reverse()) out.splice(i, 1);
    out.splice(idx[0], 0, ...newLines);
    return out;
  }
  // Translations: EVERY embedded French line of the cluster goes (heading copies are
  // embedded without their `#`, stale copies may sit beside the current one); the
  // new copy takes the place of the first. Never append next to a stale copy.
  const newEmbed = renderSourceComment(newLines.join('\n'));
  const blocks = out.filter((l) => /^\s*%%/.test(l) && !/^\s*%%.*%%\s*$/.test(l));
  if (blocks.length) {
    errors.push(`${lang} ${oldId}→${newId}: set_french on a cluster with a multi-line %% block — replace its embedded French by hand before the rebuild`);
    return out;
  }
  const embed = embeddedFrenchIdx(out);
  let how = 'embedded French replaced';
  if (embed.length) {
    for (const i of [...embed].reverse()) out.splice(i, 1);
    out.splice(embed[0], 0, ...newEmbed);
  } else {
    let at = out.findIndex((l) => ID_LINE_RE.test(l)) + 1;
    while (at < out.length && KIND_LINE_PATTERN.test(out[at])) at++;
    out.splice(at, 0, ...newEmbed);
    how = 'the cluster had no embedded French; a copy was added';
  }
  const vis = afterIdAndComments(out);
  out.splice(vis, 0, `%% ${ts} ED: ${label}: SOURCE CHANGED — the French of this paragraph was cut/replaced (${how}); the translation below still renders the old text and must be trimmed to match. %%`);
  return out;
}

// --- repo-wide rewrite ------------------------------------------------------------

export const REWRITE_EXTENSIONS = new Set(['.md', '.json', '.yaml', '.yml', '.txt', '.csv']);
/**
 * Scope of the reference rewrite: the content tree only. Code, docs, skills
 * and root notes cite paragraph IDs as examples or history (a real 068 run
 * rewrote examples in this file, docs/VERIFY_CARNET_GATE.md, i18n/index.ts
 * and issues_plan.md), so they are never touched. Inside content/, these are
 * skipped too: raw material, the rebuild maps themselves, and CLAUDE.md
 * guidance files (examples). A file containing `rebuild-carnet: keep-file`
 * and a line containing `rebuild-carnet: keep` are left alone as well.
 */
export const REWRITE_ROOTS = ['content'];
export const REWRITE_EXCLUDES = ['content/_raw', 'content/_renumber'];
export const REWRITE_SKIP_FILES = new Set(['CLAUDE.md']);

export function* walkRewritable(root: string, skipDirs: string[]): Generator<string> {
  const skip = new Set([...REWRITE_EXCLUDES, ...skipDirs].map((p) => path.join(root, p)));
  const stack = REWRITE_ROOTS.map((r) => path.join(root, r)).filter((d) => fs.existsSync(d));
  while (stack.length) {
    const dir = stack.pop()!;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (skip.has(full) || ent.name === 'node_modules' || ent.name === '.git') continue;
        stack.push(full);
      } else if (ent.isFile() && REWRITE_EXTENSIONS.has(path.extname(ent.name)) && !REWRITE_SKIP_FILES.has(ent.name)) {
        if (fs.statSync(full).size > 20 * 1024 * 1024) continue;
        yield full;
      }
    }
  }
}

export function formatTimestamp(d: Date = new Date()): string {
  const p = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// --- outputs -------------------------------------------------------------------------

export function mapJson(plan: Plan, m: Mapping, planPath: string, trees: TreeResult[], date: string, cross: { movedOut?: Record<string, string>; runCarnets?: string[] } = {}) {
  const newParas = [...m.planParaOfNewId].filter(([, p]) => p.new).map(([id]) => ({ id, file: m.fileOfNewId.get(id) }));
  const own = [...m.idMap].filter(([o]) => o.startsWith(`${m.carnet}.`));
  const movedIn = [...m.idMap].filter(([o]) => !o.startsWith(`${m.carnet}.`));
  return {
    carnet: m.carnet,
    date,
    plan_path: planPath,
    plan_source: plan.source ?? null,
    ...(cross.runCarnets ? { run_carnets: cross.runCarnets } : {}),
    // every old ID of this carnet → its new ID (possibly in another carnet of the run)
    id_map: Object.fromEntries([...own, ...Object.entries(cross.movedOut ?? {})].sort(([a], [b]) => a.localeCompare(b))),
    ...(movedIn.length ? { moved_in: Object.fromEntries(movedIn) } : {}),
    ...(cross.movedOut && Object.keys(cross.movedOut).length ? { moved_out: cross.movedOut } : {}),
    changed_ids: [...m.idMap].filter(([o, n]) => o !== n).length,
    new_paragraphs: newParas,
    dropped: [...m.dropped].map(([id, reason]) => ({ id, reason, rewritten_as: id.replace('.', '.DROPPED-') })),
    file_map: Object.fromEntries([...m.fileMap].filter(([o, n]) => o !== n)),
    files_removed: m.removedFiles,
    files_added: m.addedFiles,
    last_id: `${m.carnet}.${pad4(m.fileOfNewId.size)}`,
    flag_resets: Object.fromEntries(trees.filter((t) => t.flagResets.length).map((t) => [t.lang, t.flagResets])),
    plan,
  };
}

export function sqlRemap(ms: Mapping | Mapping[], date: string): string {
  const maps = Array.isArray(ms) ? ms : [ms];
  // One statement for the whole run: with per-carnet files, 065.0412→066.0123
  // followed by 066's own 066.0123→066.0130 would chain.
  const pairs = maps.flatMap((m) => [...m.idMap].filter(([o, n]) => o !== n));
  const dropped = maps.flatMap((m) => [...m.dropped.keys()]);
  const names = maps.map((m) => m.carnet);
  const table = `renumber_${names.join('_')}`;
  const out = [
    `-- rebuild-carnet ${names.join(' + ')} (${date}): remap reader reports to the new paragraph IDs.`,
    `-- paragraph_reports is the only table keyed by paragraph ID (src/auth/init.sql).`,
    `-- Reading history / bookmarks live in each reader's localStorage and cannot be remapped here.`,
    `-- One UPDATE through a mapping table, so a chain like 0005→0006→0007 cannot double-apply.`,
    'BEGIN;',
    `CREATE TEMP TABLE ${table} (old_id TEXT PRIMARY KEY, new_id TEXT NOT NULL) ON COMMIT DROP;`,
  ];
  const rows = [...pairs.map(([o, n]) => [o, n]), ...dropped.map((d) => [d, d.replace('.', '.DROPPED-')])];
  if (rows.length) {
    out.push(`INSERT INTO ${table} (old_id, new_id) VALUES`);
    out.push(rows.map(([o, n], i) => `  ('${o}', '${n}')${i === rows.length - 1 ? ';' : ','}`).join('\n'));
    out.push(`UPDATE paragraph_reports r SET paragraph_id = m.new_id FROM ${table} m WHERE r.paragraph_id = m.old_id;`);
  } else {
    out.push('-- (no paragraph ID changed)');
  }
  out.push('COMMIT;', '');
  return out.join('\n');
}

/**
 * Merge this run's entry-URL renames into the cumulative redirect table
 * (content/_renumber/redirects.json, read by src/frontend/astro.config.mjs).
 * Earlier redirects that pointed at a renamed page are re-pointed, and a
 * redirect whose source is a real page again is removed.
 */
export function mergeRedirects(existing: Record<string, string>, m: Mapping, trees: string[]): Record<string, string> {
  const out: Record<string, string> = { ...existing };
  const renamed = [...m.fileMap].filter(([o, n]) => o !== n);
  const liveNow = new Set<string>();
  for (const lang of trees) {
    const seg = URL_SEGMENT[lang];
    if (!seg) continue;
    for (const f of m.newFileIds.keys()) liveNow.add(`/${seg}/${m.carnet}/${f.replace(/\.md$/, '')}`);
    for (const [o, n] of renamed) {
      const from = `/${seg}/${m.carnet}/${o.replace(/\.md$/, '')}`;
      // a target "066/x.md" lies in another carnet of a multi-carnet run
      const to = n.includes('/') ? `/${seg}/${n.replace(/\.md$/, '')}/` : `/${seg}/${m.carnet}/${n.replace(/\.md$/, '')}/`;
      for (const k of Object.keys(out)) if (out[k] === `${from}/`) out[k] = to;
      out[from] = to;
    }
    for (const o of m.removedFiles) {
      const from = `/${seg}/${m.carnet}/${o.replace(/\.md$/, '')}`;
      if (!(from in out)) out[from] = `/${seg}/${m.carnet}/`;
    }
  }
  for (const k of Object.keys(out)) if (liveNow.has(k)) delete out[k];
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

// --- post-apply check -------------------------------------------------------------------

export interface CheckReport {
  errors: string[];
  warnings: string[];
  lastId: string | null;
}

/**
 * (a) _original IDs are CCC.0001..N contiguous in file-name (date) order and
 *     para_start/para_end match; (b) every translation tree has the same files
 *     and the same ID sequence per file; (c) no stale references: no ID token
 *     beyond N, no link to a removed entry file, no path+anchor pointing at a
 *     file that does not hold the paragraph.
 */
export function checkCarnet(repoRoot: string, carnet: string, removedFiles: string[] = []): CheckReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const contentRoot = path.join(repoRoot, 'content');
  const original = loadTree(contentRoot, '_original', carnet);
  if (!original) return { errors: [`no content/_original/${carnet}`], warnings, lastId: null };

  let expect = 1;
  const fileOfId = new Map<string, string>();
  for (const [name, pf] of original.files) {
    const ids = pf.clusters.map((c) => c.id);
    for (const id of ids) {
      const want = `${carnet}.${pad4(expect)}`;
      if (id !== want) { errors.push(`_original/${name}: found ${id} where ${want} was expected (IDs must run 0001..N in file order)`); expect = Number(id.split('.')[1]); }
      fileOfId.set(id, name);
      expect++;
    }
    if (ids.length && pf.fm) {
      const s = fmGet(pf.fm, 'para_start'), e = fmGet(pf.fm, 'para_end');
      if (s !== String(Number(ids[0].split('.')[1])) || e !== String(Number(ids[ids.length - 1].split('.')[1]))) {
        errors.push(`_original/${name}: para_start/para_end ${s}/${e} do not match ${ids[0]}..${ids[ids.length - 1]}`);
      }
    }
    const d = fmGet(pf.fm, 'date');
    if (d && !name.startsWith(d)) errors.push(`_original/${name}: frontmatter date ${d} does not match the file name`);
    for (const l of [...(pf.idlessBody ?? []), ...pf.clusters.flatMap((c) => c.lines)]) {
      if (LEGACY_ID_LINE_RE.test(l)) errors.push(`_original/${name}: legacy ID line ${l.trim()}`);
    }
  }
  const lastNum = expect - 1;
  const lastId = lastNum > 0 ? `${carnet}.${pad4(lastNum)}` : null;

  // _original French per ID: text lines, and the headings (a translation may or may not embed those)
  const origFrench = new Map<string, { text: string; heads: Set<string> }>();
  for (const pf of original.files.values()) {
    for (const c of pf.clusters) {
      const fl = frenchLineIdx(c.lines).map((i) => c.lines[i]);
      const text = normFrench(fl.filter((l) => !HEADING_RE.test(l.trim())).join('\n'));
      const heads = new Set(fl.filter((l) => HEADING_RE.test(l.trim())).map(normFrench));
      if (text || heads.size) origFrench.set(c.id, { text, heads });
    }
  }
  for (const lang of TREES.slice(1)) {
    const tree = loadTree(contentRoot, lang, carnet);
    if (!tree) continue;
    for (const [name, pf] of original.files) {
      const t = tree.files.get(name);
      if (!t) { warnings.push(`${lang}/${carnet}: no entry file ${name} (partial tree?)`); continue; }
      const a = pf.clusters.map((c) => c.id).join(','), b = t.clusters.map((c) => c.id).join(',');
      if (a === b) continue;
      // A source paragraph with no text (notes only, or an empty trailing ID) may
      // be absent from a translation: the benign case verify-carnet also allows.
      const textless = new Set(pf.clusters.filter((c) => !textLineIdx(c.lines).length && !hasHeading(c.lines)).map((c) => c.id));
      const tIds = new Set(t.clusters.map((c) => c.id));
      const aText = pf.clusters.map((c) => c.id).filter((id) => !textless.has(id) || tIds.has(id)).join(',');
      if (aText === b) {
        const gone = pf.clusters.map((c) => c.id).filter((id) => !tIds.has(id));
        warnings.push(`${lang}/${carnet}/${name}: lacks text-less source paragraph(s) ${gone.join(', ')}`);
      } else {
        errors.push(`${lang}/${carnet}/${name}: ID sequence differs from _original`);
      }
    }
    for (const name of tree.files.keys()) if (!original.files.has(name)) errors.push(`${lang}/${carnet}/${name}: no _original counterpart`);
    // (d) the embedded French copy must be _original's French for the same ID
    const differs: string[] = [];
    for (const [name, pf] of tree.files) {
      for (const c of pf.clusters) {
        const of = origFrench.get(c.id);
        const emb = embeddedFrenchIdx(c.lines);
        if (!of || !emb.length || c.lines.some((l) => /^\s*%%/.test(l) && !/^\s*%%.*%%\s*$/.test(l))) continue;
        const tf = emb.map((i) => normFrench(c.lines[i])).filter((l) => !of.heads.has(l)).join(' ');
        if (tf === of.text) continue;
        if ((of.text === '' && tf) || (tf.includes(of.text) && tf.length > of.text.length * 1.2)) {
          errors.push(`${lang}/${carnet}/${name} ${c.id}: the embedded French holds _original's French plus other text — a stale or duplicated copy`);
        } else {
          differs.push(c.id);
        }
      }
    }
    if (differs.length) warnings.push(`${lang}/${carnet}: embedded French differs from _original in ${differs.length} paragraph(s): ${differs.slice(0, 8).join(', ')}${differs.length > 8 ? ' …' : ''} (resync with just resync-french ${lang} ${carnet})`);
  }

  const removed = removedFiles.map((f) => f.replace(/\.md$/, ''));
  const staleFile = removed.length ? new RegExp(`(?<![\\w-])${carnet}/(${removed.map(escapeRe).join('|')})(?![\\w-])`, 'g') : null;
  const tokenRe = new RegExp(`(?<![\\w.^])${carnet}\\.(\\d{4})(?!\\d)(?!-\\d{2}-\\d{2})`, 'g'); // not «[^102.1224.1]» labels, not «076.1877-12-11» dates
  const linkRe = new RegExp(`(?<![\\w-])${carnet}/(\\d{4}-\\d{2}-\\d{2}[\\w-]*)/?#p-${carnet}-(\\d{4})(?!\\d)`, 'g');
  for (const file of walkRewritable(repoRoot, [])) {
    const rel = path.relative(repoRoot, file);
    const text = fs.readFileSync(file, 'utf-8');
    if (!text.includes(carnet) || text.includes(KEEP_FILE_PRAGMA)) continue;
    text.split('\n').forEach((line, i) => {
      if (line.includes(KEEP_PRAGMA)) return;
      const at = `${rel}:${i + 1}`;
      for (const mm of line.matchAll(tokenRe)) {
        if (Number(mm[1]) > lastNum || Number(mm[1]) === 0) errors.push(`${at}: ${mm[0]} is beyond the carnet's last paragraph ${lastId}`);
      }
      if (staleFile) for (const mm of line.matchAll(staleFile)) errors.push(`${at}: link to removed entry ${mm[0]}`);
      for (const mm of line.matchAll(linkRe)) {
        const holder = fileOfId.get(`${carnet}.${mm[2]}`);
        if (holder && holder !== `${mm[1]}.md`) errors.push(`${at}: ${mm[0]} — paragraph lives in ${holder}`);
      }
      if (line.includes(`${carnet}.DROPPED-`)) warnings.push(`${at}: reference to a dropped paragraph (${carnet}.DROPPED-…)`);
    });
  }
  return { errors, warnings, lastId };
}
