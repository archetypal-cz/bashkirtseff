/**
 * renumber-audit core: decide, per exported paragraph_reports row, whether the row still points at a
 * pre-renumber paragraph ID (see docs/DB_DEPLOY.md "Before merge: fix stale reports").
 *
 * Inputs: a CSV export (id, paragraph_id, language, commit_hash, created_at, highlighted_text; status optional) and
 * the repo's git history (content/_renumber/*.json maps, content trees at the report's commit and at HEAD).
 *
 * PRIVACY: reader text (highlighted_text) is only ever compared in memory. Nothing in this module writes it anywhere,
 * and the report/migration builders only receive IDs, UUIDs, verdicts and fixed-vocabulary notes.
 */
import { spawnSync } from 'node:child_process';

export type Verdict = 'UNAFFECTED' | 'APPLIED' | 'NOT_APPLIED' | 'AMBIGUOUS';

export interface ReportRow {
  id: string;
  paragraph_id: string;
  language: string;
  commit_hash: string;
  created_at: string;
  status: string;
  highlighted_text: string;
}

/** One simultaneous remapping step: all maps added by one commit that are applied at the same "layer". */
export interface Layer {
  commit: string;
  date: number; // commit time, ms since epoch
  pairs: Map<string, string>; // old -> new (CCC.NNNN or CCC.DROPPED-NNNN)
  names: string[];
  deployable: boolean; // a marker-carrying top-level .sql added in the same commit covers this carnet: the deploy runner applies it, so no fix-up may duplicate it
  newIds: Set<string>; // paragraphs the maps INSERT (new_paragraphs): a report cannot pre-date them
}

export interface Result {
  id: string;
  paragraph_id: string;
  language: string;
  status: string;
  verdict: Verdict;
  candidate: string; // final ID after the applicable maps ('' when unaffected / unknown)
  fixup: string; // target ID for the migration (NOT_APPLIED only; legacy-script chain), else ''
  basis: 'ancestry' | 'date' | '-';
  notes: string[]; // fixed vocabulary only, never reader text
}

const ID_RE = /^[0-9]{3}\.(DROPPED-)?[0-9]{4}$/;
const LIVE_ID_RE = /^[0-9]{3}\.[0-9]{4}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const HASH_RE = /^[0-9a-f]{7,40}$/;
const LANG_TREE: Record<string, string> = { original: '_original', cz: 'cz', uk: 'uk', en: 'en', fr: 'fr', es: 'es' };
const NEAR_MAP_MS = 48 * 3600 * 1000; // date fallback: a report this close to a map's commit cannot be placed before/after it
const MARKER_LINE = '-- deploy-ledger: renumber v1';
export const MIN_HIGHLIGHT_CHARS = 10;

export function isValidParagraphId(s: string): boolean {
  return ID_RE.test(s);
}
export function isValidUuid(s: string): boolean {
  return UUID_RE.test(s);
}
export function isLiveParagraphId(s: string): boolean {
  return LIVE_ID_RE.test(s);
}

// ---------------------------------------------------------------- CSV
/** RFC 4180 parser (quoted fields, doubled quotes, embedded newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQ = false;
  let i = 0;
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (!(row.length === 1 && row[0] === '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (inQ) throw new Error('CSV: unterminated quoted field');
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function parseReports(text: string): ReportRow[] {
  if (!text.trim()) throw new Error('reports CSV is empty');
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('reports CSV has a header but no data rows (empty export?)');
  const header = rows[0].map((h) => h.trim());
  const need = ['id', 'paragraph_id', 'language', 'commit_hash', 'created_at', 'highlighted_text'];
  const missing = need.filter((c) => !header.includes(c));
  if (missing.length) throw new Error(`reports CSV is missing column(s): ${missing.join(', ')}`);
  const ix = (c: string) => header.indexOf(c);
  const seen = new Set<string>();
  const out: ReportRow[] = [];
  for (const r of rows.slice(1)) {
    if (r.length !== header.length) throw new Error(`reports CSV: a data row has ${r.length} fields, expected ${header.length}`);
    const row: ReportRow = {
      id: r[ix('id')].trim(),
      paragraph_id: r[ix('paragraph_id')].trim(),
      language: r[ix('language')].trim(),
      commit_hash: r[ix('commit_hash')].trim(),
      created_at: r[ix('created_at')].trim(),
      status: ix('status') >= 0 ? r[ix('status')].trim() : '',
      highlighted_text: r[ix('highlighted_text')],
    };
    if (seen.has(row.id)) throw new Error(`reports CSV: duplicate report id ${row.id}`);
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

// ---------------------------------------------------------------- git
export class Git {
  private ancestorCache = new Map<string, boolean>();
  private showCache = new Map<string, string | null>();
  private fileCache = new Map<string, Map<string, string> | null>();
  private findCache = new Map<string, string | null>();
  private textCache = new Map<string, string | null>();
  constructor(public root: string) {}

  run(args: string[], opts: { allowFail?: boolean } = {}): { code: number; out: string } {
    const r = spawnSync('git', ['-c', 'core.quotepath=off', '-C', this.root, ...args], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
    if (r.error) throw r.error;
    if (r.status !== 0 && !opts.allowFail) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || '').split('\n')[0]}`);
    return { code: r.status ?? 1, out: r.stdout ?? '' };
  }
  commitExists(ref: string): boolean {
    return this.run(['cat-file', '-e', `${ref}^{commit}`], { allowFail: true }).code === 0;
  }
  resolve(ref: string): string {
    return this.run(['rev-parse', '--verify', `${ref}^{commit}`]).out.trim();
  }
  /** true when `anc` is an ancestor of (or equal to) `desc`. */
  isAncestor(anc: string, desc: string): boolean {
    const k = `${anc}..${desc}`;
    let v = this.ancestorCache.get(k);
    if (v === undefined) {
      const r = this.run(['merge-base', '--is-ancestor', anc, desc], { allowFail: true });
      if (r.code > 1) throw new Error(`git merge-base --is-ancestor failed for ${anc.slice(0, 8)} ${desc.slice(0, 8)}`);
      v = r.code === 0;
      this.ancestorCache.set(k, v);
    }
    return v;
  }
  show(commit: string, p: string): string | null {
    const k = `${commit}:${p}`;
    if (!this.showCache.has(k)) {
      const r = this.run(['show', k], { allowFail: true });
      this.showCache.set(k, r.code === 0 ? r.out : null);
    }
    return this.showCache.get(k)!;
  }
  /** Path of the file holding `%% id %%` in `tree` at `commit` (first match), or null. */
  findParagraphFile(commit: string, tree: string, id: string): string | null {
    const k = `${commit}|${tree}|${id}`;
    if (!this.findCache.has(k)) {
      const carnet = id.slice(0, 3);
      // exact id line (surrounding whitespace tolerated), not a substring of another line
      const r = this.run(['grep', '-l', '-E', '-e', `^[[:space:]]*%% ${id.replace('.', '\\.')} %%[[:space:]]*$`, commit, '--', `content/${tree}/${carnet}/`], { allowFail: true });
      const first = r.code === 0 ? r.out.split('\n').find((l) => l.trim()) : undefined;
      // `git grep <commit>` prefixes every path with "<commit>:"
      this.findCache.set(k, first ? first.slice(first.indexOf(':') + 1) : null);
    }
    return this.findCache.get(k)!;
  }
  paragraphTexts(commit: string, p: string): Map<string, string> | null {
    const k = `${commit}:${p}`;
    if (!this.fileCache.has(k)) {
      const src = this.show(commit, p);
      this.fileCache.set(k, src === null ? null : splitParagraphs(src));
    }
    return this.fileCache.get(k)!;
  }
  /** Normalised text of paragraph `id` in language `lang` at `commit`, or null when it cannot be found. */
  textAt(commit: string, lang: string, id: string): string | null {
    const k = `${commit}|${lang}|${id}`;
    if (!this.textCache.has(k)) {
      let t: string | null = null;
      const tree = LANG_TREE[lang];
      if (tree && LIVE_ID_RE.test(id)) {
        const f = this.findParagraphFile(commit, tree, id);
        if (f) t = this.paragraphTexts(commit, f)?.get(id) ?? null;
      }
      this.textCache.set(k, t);
    }
    return this.textCache.get(k)!;
  }
}

// ---------------------------------------------------------------- text normalisation
export function normalise(s: string): string {
  return s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** Split an entry file into id -> normalised visible text (comments, footnote definitions and markup removed). */
export function splitParagraphs(src: string): Map<string, string> {
  const out = new Map<string, string[]>();
  let cur: string[] | null = null;
  for (const line of src.split(/\r?\n/)) {
    const m = /^\s*%% ([0-9]{3}\.[0-9]{4}) %%\s*$/.exec(line);
    if (m) {
      cur = [];
      if (!out.has(m[1])) out.set(m[1], cur);
      continue;
    }
    if (!cur) continue;
    if (/^\s*%%.*%%\s*$/.test(line)) continue;
    if (/^\[\^[^\]]+\]:/.test(line)) continue;
    cur.push(
      line
        .replace(/%%.*?%%/g, ' ')
        .replace(/\[\^[^\]]*\]/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^\s*#+\s*/, '')
        .replace(/^\s*>\s?/, ''),
    );
  }
  const res = new Map<string, string>();
  for (const [id, lines] of out) res.set(id, normalise(lines.join(' ')));
  return res;
}

/** Fraction of the highlight's tokens found in `text` (1 when it is a normalised substring). */
export function coverage(hl: string, text: string | null): number {
  if (text === null) return 0;
  if (text.includes(hl)) return 1;
  const toks = hl.split(' ').filter(Boolean);
  if (!toks.length) return 0;
  const bag = new Set(text.split(' '));
  return toks.filter((t) => bag.has(t)).length / toks.length;
}
const MATCH_THRESHOLD = 0.9;
const matches = (hl: string, text: string | null) => coverage(hl, text) >= MATCH_THRESHOLD;

// ---------------------------------------------------------------- maps
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true });
}

interface RawMap { name: string; commit: string; date: number; carnet: string; pairs: Map<string, string>; newIds: Set<string>; deployable: boolean }

/**
 * Carnets covered by marker-carrying top-level content/_renumber/*.sql files ADDED by `commit` (an older script still in
 * the tree does not count for a later map; pooled scripts are
 * named A+B+...-date.sql; the carnets are the leading 3 digits of each '+'-separated part).
 */
function deployableCarnets(git: Git, commit: string): Set<string> {
  const out = new Set<string>();
  const ls = git.run(['diff-tree', '--no-commit-id', '--diff-filter=A', '--no-renames', '--name-only', '-r', '-m', '--root', commit, '--', 'content/_renumber/'], { allowFail: true }).out;
  for (const line of ls.split('\n')) {
    const m = /^content\/_renumber\/([^/]+)\.sql$/.exec(line);
    if (!m) continue;
    const sql = git.show(commit, `content/_renumber/${m[1]}.sql`);
    if (sql === null || !sql.split(/\r?\n/).some((l) => l.trim() === MARKER_LINE)) continue;
    for (const part of m[1].split('+')) {
      const c = /^([0-9]{3})/.exec(part);
      if (c) out.add(c[1]);
    }
  }
  return out;
}

/** Load every top-level content/_renumber/*.json map that was added in history, in runner order, grouped into layers. */
export function loadLayers(git: Git, head: string): Layer[] {
  const log = git.run(['log', '--reverse', '--topo-order', '--diff-filter=A', '--no-renames', '--name-only', '--format=@@COMMIT@@%H %ct', head, '--', 'content/_renumber/*.json']).out;
  const seen = new Set<string>();
  const groups: { commit: string; date: number; names: string[] }[] = [];
  for (const line of log.split('\n')) {
    if (line.startsWith('@@COMMIT@@')) {
      const [commit, ct] = line.slice(10).split(' ');
      groups.push({ commit, date: Number(ct) * 1000, names: [] });
    } else if (line.startsWith('content/_renumber/') && line.endsWith('.json')) {
      const name = line.slice('content/_renumber/'.length);
      if (name.includes('/') || name === 'redirects.json' || seen.has(name)) continue;
      seen.add(name);
      groups[groups.length - 1].names.push(name.slice(0, -5));
    }
  }
  const layers: Layer[] = [];
  for (const g of groups) {
    const raws: RawMap[] = [];
    const depCarnets = deployableCarnets(git, g.commit);
    for (const base of g.names.sort(naturalCompare)) {
      const src = git.show(g.commit, `content/_renumber/${base}.json`);
      if (src === null) continue;
      let j: any;
      try { j = JSON.parse(src); } catch { throw new Error(`renumber map ${base}.json at ${g.commit.slice(0, 8)} is not valid JSON`); }
      if (!j || typeof j !== 'object' || typeof j.id_map !== 'object' || j.id_map === null) continue; // not an applied map
      const pairs = new Map<string, string>();
      for (const [o, n] of Object.entries<string>(j.id_map)) {
        if (!ID_RE.test(o) || typeof n !== 'string' || !ID_RE.test(n)) throw new Error(`renumber map ${base}.json has a malformed ID pair`);
        if (o !== n) pairs.set(o, n);
      }
      for (const d of Array.isArray(j.dropped) ? j.dropped : []) {
        const id = typeof d === 'string' ? d : d?.id;
        if (typeof id !== 'string' || !ID_RE.test(id)) throw new Error(`renumber map ${base}.json has a malformed dropped ID`);
        pairs.set(id, id.replace('.', '.DROPPED-'));
      }
      const newIds = new Set<string>();
      for (const d of Array.isArray(j.new_paragraphs) ? j.new_paragraphs : []) {
        const nid = typeof d === 'string' ? d : d?.id;
        if (typeof nid === 'string' && ID_RE.test(nid)) newIds.add(nid);
      }
      const carnet = String(j.carnet ?? base.slice(0, 3));
      raws.push({ name: base, commit: g.commit, date: g.date, carnet, pairs, newIds, deployable: depCarnets.has(carnet) });
    }
    // Maps of one commit that belong to different carnets were generated together and apply simultaneously
    // (rebuild-carnet pools them into one statement set); several maps of the SAME carnet apply one after the other.
    const perCarnet = new Map<string, RawMap[]>();
    for (const r of raws) (perCarnet.get(r.carnet) ?? perCarnet.set(r.carnet, []).get(r.carnet)!).push(r);
    const depth = Math.max(0, ...[...perCarnet.values()].map((a) => a.length));
    for (let k = 0; k < depth; k++) {
      const members = [...perCarnet.values()].filter((a) => a[k]).map((a) => a[k]);
      for (const dep of [false, true]) {
        const sel = members.filter((m) => m.deployable === dep);
        if (!sel.length) continue;
        const pairs = new Map<string, string>();
        for (const m of sel) for (const [o, n] of m.pairs) if (!pairs.has(o)) pairs.set(o, n);
        const newIds = new Set<string>();
        for (const m of sel) for (const n of m.newIds) newIds.add(n);
        layers.push({ commit: g.commit, date: g.date, pairs, names: sel.map((m) => m.name), deployable: dep, newIds });
      }
    }
  }
  return layers;
}

export function applyLayers(id: string, layers: Layer[]): string {
  let cur = id;
  for (const l of layers) {
    if (cur.includes('DROPPED-')) return cur;
    cur = l.pairs.get(cur) ?? cur;
  }
  return cur;
}
function pathOf(id: string, layers: Layer[]): string[] {
  const p = [id];
  let cur = id;
  for (const l of layers) {
    if (cur.includes('DROPPED-')) break;
    cur = l.pairs.get(cur) ?? cur;
    p.push(cur);
  }
  return p;
}

export function parseTimestamp(s: string): number {
  const t = Date.parse(s.trim().replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));
  return Number.isNaN(t) ? NaN : t;
}

// ---------------------------------------------------------------- verdicts
export function auditReport(git: Git, head: string, layers: Layer[], row: ReportRow): Result {
  const cur = row.paragraph_id;
  const res: Result = { id: row.id, paragraph_id: cur, language: row.language, status: row.status, verdict: 'AMBIGUOUS', candidate: '', fixup: '', basis: '-', notes: [] };
  const amb = (n: string) => { res.verdict = 'AMBIGUOUS'; res.notes.push(n); return res; };
  if (!UUID_RE.test(row.id)) return amb('bad-uuid');
  if (!ID_RE.test(cur)) return amb('bad-paragraph-id');
  if (!(row.language in LANG_TREE)) return amb('unknown-language');

  // 1. which maps apply to this report
  const known = HASH_RE.test(row.commit_hash) && git.commitExists(row.commit_hash);
  let applicable: Layer[];
  let rc: string | null = null;
  if (known) {
    rc = git.resolve(row.commit_hash);
    applicable = layers.filter((l) => !git.isAncestor(l.commit, rc!));
    res.basis = 'ancestry';
  } else {
    const t = parseTimestamp(row.created_at);
    if (Number.isNaN(t)) return amb('no-commit-and-bad-created_at');
    if (layers.some((l) => Math.abs(l.date - t) <= NEAR_MAP_MS)) return amb('date-near-map');
    applicable = layers.filter((l) => l.date > t);
    res.basis = 'date';
    res.notes.push('commit-unknown-date-fallback');
    if (applicable.length) rc = git.resolve(applicable[0].commit + '^');
    else rc = git.resolve(head);
  }
  const final = applyLayers(cur, applicable);
  const keys = new Set<string>();
  for (const l of applicable) for (const k of l.pairs.keys()) keys.add(k);
  const preFull: string[] = [];
  const preMid: string[] = [];
  for (const x of keys) {
    if (x === cur) continue;
    const p = pathOf(x, applicable);
    if (p[p.length - 1] === cur) preFull.push(x);
    else if (p.includes(cur)) preMid.push(x);
  }
  const moved = final !== cur;
  if (!moved && !preFull.length && !preMid.length) { res.verdict = 'UNAFFECTED'; return res; }

  // 2. text evidence
  const hl = normalise(row.highlighted_text ?? '');
  const hasHl = hl.length >= MIN_HIGHLIGHT_CHARS;
  // the reader's highlight may be French shown under a translation language (side-by-side view): also try _original
  const M = (c: string, id: string) => matches(hl, git.textAt(c, row.language, id)) || (row.language !== 'original' && matches(hl, git.textAt(c, 'original', id)));
  const A = hasHl ? M(rc!, cur) : null;
  const PF = hasHl ? preFull.some((x) => M(rc!, x)) : null;
  const PM = hasHl ? preMid.some((x) => M(rc!, x)) : null;
  const dropped = final.includes('DROPPED-');
  if (!hasHl) res.notes.push('no-highlighted-text');
  if (moved) res.candidate = final;

  if (hasHl && PF && !A) { res.verdict = 'APPLIED'; res.candidate = ''; return res; }
  if (hasHl && PM && !A && !PF) return amb('partially-remapped');
  if (hasHl && A && (PF || PM)) return amb('text-fits-both-hypotheses');
  if (!moved) {
    // preimages exist but nothing moves `cur` itself
    if (!hasHl || A || (!PF && !PM)) { res.verdict = 'UNAFFECTED'; return res; }
    return amb('evidence-insufficient');
  }
  if (dropped) return amb('chain-ends-in-DROPPED');
  if (!known && !hasHl) return amb('commit-unknown-and-no-highlight');

  // `cur` is moved by an applicable map and the row sits at the old ID (hypothesis: never remapped)
  const preimages = preFull.length + preMid.length > 0;
  if (!hasHl) {
    if (preimages) return amb('may-already-be-remapped-no-text');
    if (applicable.some((l) => l.newIds.has(cur))) return amb('id-is-new-paragraph-no-text');
    res.verdict = 'NOT_APPLIED';
  } else {
    const B = M(head, final);
    const C = M(head, cur);
    if (A && !B && C) return amb('text-stayed-at-old-id');
    if (A) res.verdict = 'NOT_APPLIED';
    else if (B && !preimages) res.verdict = 'NOT_APPLIED';
    else return amb(preimages ? 'text-matches-neither' : 'text-not-found');
  }
  if (!known && res.verdict === 'NOT_APPLIED') res.notes.push('date-basis-verify-by-hand');

  // 3. what a migration may write: the deploy runner applies marker-carrying scripts itself, so the fix-up covers
  // legacy / script-less maps only, and must compose with the deployable ones to the same final ID.
  const legacy = applyLayers(cur, applicable.filter((l) => !l.deployable));
  const composed = applyLayers(legacy, applicable.filter((l) => l.deployable));
  if (composed !== final) { res.verdict = 'AMBIGUOUS'; res.notes.push('order-conflict-with-deploy-scripts'); return res; }
  if (legacy === cur) { res.verdict = 'UNAFFECTED'; res.notes.push('only-pending-deploy-scripts-apply'); return res; }
  if (!LIVE_ID_RE.test(legacy)) return amb('fixup-target-invalid');
  res.fixup = legacy;
  return res;
}

export function auditAll(git: Git, head: string, rows: ReportRow[]): { results: Result[]; layers: Layer[] } {
  const layers = loadLayers(git, head);
  return { results: rows.map((r) => auditReport(git, head, layers, r)), layers };
}

// ---------------------------------------------------------------- outputs
export function countVerdicts(results: Result[]): Record<Verdict, number> {
  const c: Record<Verdict, number> = { UNAFFECTED: 0, APPLIED: 0, NOT_APPLIED: 0, AMBIGUOUS: 0 };
  for (const r of results) c[r.verdict]++;
  return c;
}

const STATUSES = new Set(['', 'open', 'acknowledged', 'fixed', 'dismissed']);
/** Reader-controlled fields are echoed only when they pass validation; anything else prints as <invalid>. */
const safeLang = (s: string) => (s in LANG_TREE ? s : '<invalid>');
const safeStatus = (s: string) => (STATUSES.has(s) ? s : '<invalid>');
const safeId = (s: string) => (ID_RE.test(s) ? s : '<invalid>');
const safeUuid = (s: string) => (UUID_RE.test(s) ? s : '<invalid>');

/** Markdown audit report: UUIDs, paragraph IDs, verdicts and counts only. */
export function renderReport(results: Result[], layers: Layer[], meta: { date: string; head: string }): string {
  const c = countVerdicts(results);
  const lines = [
    `# Renumber audit ${meta.date}`,
    '',
    `Generated by \`just renumber-audit\` at ${meta.head.slice(0, 12)}. Contains UUIDs, paragraph IDs and counts only; no reader text.`,
    '',
    `- Renumber maps considered: ${layers.reduce((n, l) => n + l.names.length, 0)} (${layers.length} layers, ${layers.filter((l) => l.deployable).length} applied by the deploy runner)`,
    `- Reports audited: ${results.length}`,
    `- UNAFFECTED: ${c.UNAFFECTED}, APPLIED: ${c.APPLIED}, NOT_APPLIED: ${c.NOT_APPLIED}, AMBIGUOUS: ${c.AMBIGUOUS}`,
    `- Fix-ups proposed: ${results.filter((r) => r.fixup).length} (NOT_APPLIED rows only)`,
    '',
    '| report | language | status | paragraph_id | verdict | candidate | fix-up | basis | notes |',
    '|---|---|---|---|---|---|---|---|---|',
    ...results.map((r) => `| ${safeUuid(r.id)} | ${safeLang(r.language)} | ${safeStatus(r.status)} | ${safeId(r.paragraph_id)} | ${r.verdict} | ${r.candidate || '-'} | ${r.fixup || '-'} | ${r.basis} | ${r.notes.join(', ') || '-'} |`),
    '',
  ];
  return lines.join('\n');
}

/** Fix-up migration SQL. Every interpolated value is validated first; throws otherwise. */
export function renderMigration(results: Result[], meta: { date: string; head: string }): string {
  const rows = results.filter((r) => r.verdict === 'NOT_APPLIED' && r.fixup);
  for (const r of rows) {
    if (!UUID_RE.test(r.id)) throw new Error(`refusing to write SQL: bad UUID ${JSON.stringify(r.id)}`);
    if (!LIVE_ID_RE.test(r.paragraph_id) || !LIVE_ID_RE.test(r.fixup)) throw new Error(`refusing to write SQL: bad paragraph ID for ${r.id}`);
  }
  const body = rows.map((r) => `UPDATE public.paragraph_reports SET paragraph_id = '${r.fixup}' WHERE id = '${r.id}' AND paragraph_id = '${r.paragraph_id}';`);
  return [
    '-- Fix-up for reader reports that still point at paragraph IDs from before the carnet renumberings.',
    `-- Generated ${meta.date} by "just renumber-audit --write-migration" (src/scripts/renumber-audit.ts) from an owner-exported`,
    '-- reports file plus the git history of content/_renumber/*.json; reviewed by the owner before commit.',
    '-- Each row below was judged NOT_APPLIED: its commit predates the maps and its highlighted text (or the absence of any',
    '-- other candidate) says the old ID was never remapped. The id AND the old paragraph_id are both in the WHERE clause,',
    '-- so a row that changed meanwhile is left alone and re-running is harmless.',
    '-- Targets follow the legacy renumber scripts only; scripts applied by the deploy runner are not duplicated here.',
    `-- Rows: ${rows.length}`,
    '',
    ...body,
    '',
  ].join('\n');
}
