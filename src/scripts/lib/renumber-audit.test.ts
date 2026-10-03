// Fixture tests for src/scripts/renumber-audit.ts (synthetic temp git repos + synthetic CSVs). Run: just test-renumber-audit
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditAll, Git, parseCsv, parseReports, renderMigration, renderReport, type Result } from './renumber-audit-core.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(HERE, '..', 'renumber-audit.ts');
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

const TXT = {
  alpha: 'Il fait un temps superbe ce matin sur la promenade des Anglais.',
  ins: 'Une phrase ajoutee par le rebuild numero un, sans rapport.',
  bravo: 'Nous sommes alles au theatre hier soir avec maman et la tante.',
  charlie: 'Le piano de la salle etait desaccorde depuis tres longtemps.',
  delta: 'Je lirai un livre entier demain avant le diner de famille.',
  zeta: 'Un tout nouveau premier paragraphe retrouve dans le manuscrit.',
} as const;
type K = keyof typeof TXT;

const STATES: K[][] = [
  ['alpha', 'bravo', 'charlie', 'delta'], // C1
  ['alpha', 'ins', 'bravo', 'charlie', 'delta'], // C2  (map M1)
  ['zeta', 'alpha', 'ins', 'bravo', 'charlie', 'delta'], // C3 (map M2)
  ['zeta', 'alpha', 'bravo', 'charlie', 'delta'], // C4 (map M3: drops "ins")
];
const DATES = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01'];
const id = (n: number) => `001.${String(n).padStart(4, '0')}`;

let tmp: string;
let repo: string;
let commits: string[]; // C1..C5
let git: Git;
let results: Map<string, Result>;

function sh(cwd: string, args: string[], date?: string) {
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } as NodeJS.ProcessEnv;
  if (date) { env.GIT_AUTHOR_DATE = `${date}T12:00:00+00:00`; env.GIT_COMMITTER_DATE = `${date}T12:00:00+00:00`; }
  const r = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}
function entry(state: K[]): string {
  return `---\ndate: 1880-01-01\ncarnet: "001"\n---\n` + state.map((k, i) => `%% ${id(i + 1)} %%\n%% 2026-01-01T10:00:00 RSR: a note %%\n${TXT[k]}\n`).join('\n');
}
function mapJson(prev: K[], next: K[], name: string): string {
  const id_map: Record<string, string> = {};
  const dropped: { id: string }[] = [];
  prev.forEach((k, i) => { const j = next.indexOf(k); if (j >= 0) id_map[id(i + 1)] = id(j + 1); else dropped.push({ id: id(i + 1) }); });
  return JSON.stringify({ carnet: '001', date: name, id_map, dropped });
}
function write(p: string, s: string) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'renum-audit-'));
  repo = path.join(tmp, 'repo');
  fs.mkdirSync(repo);
  sh(repo, ['init', '-q', '-b', 'main']);
  commits = [];
  for (let c = 0; c < 5; c++) {
    const state = STATES[Math.min(c, 3)];
    write(path.join(repo, 'content/_original/001/1880-01-01.md'), entry(state));
    // a subdirectory plan.json must never be read as an applied map
    if (c === 0) write(path.join(repo, 'content/_renumber/001/plan.json'), JSON.stringify({ carnet: '001', plan: [] }));
    if (c >= 1 && c <= 3) write(path.join(repo, `content/_renumber/001-${DATES[c]}.json`), mapJson(STATES[c - 1], STATES[c], DATES[c]));
    if (c === 4) write(path.join(repo, 'README.md'), 'later change\n');
    sh(repo, ['add', '-A']);
    sh(repo, ['commit', '-q', '-m', `c${c + 1}`], DATES[c]);
    commits.push(sh(repo, ['rev-parse', 'HEAD']));
  }
  git = new Git(repo);
});
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
function csv(rows: { n: number; pid: string; commit: string; hl: string; created?: string; lang?: string }[]): string {
  return 'id,paragraph_id,language,commit_hash,created_at,status,highlighted_text\n' +
    rows.map((r) => [U(r.n), r.pid, r.lang ?? 'original', r.commit, r.created ?? '2026-06-01 10:00:00+00', 'open', q(r.hl)].join(',')).join('\n') + '\n';
}
function run(rows: Parameters<typeof csv>[0]): Result[] {
  return auditAll(git, git.resolve('HEAD'), parseReports(csv(rows))).results;
}
const one = (rows: Parameters<typeof csv>[0]) => run(rows)[0];

test('loads maps in runner order and ignores subdirectory plan.json', () => {
  const { layers } = auditAll(git, git.resolve('HEAD'), parseReports(csv([{ n: 1, pid: id(1), commit: commits[4], hl: '' }])));
  assert.deepEqual(layers.map((l) => l.names[0]), ['001-2026-02-01', '001-2026-03-01', '001-2026-04-01']);
});

test('UNAFFECTED: report filed after every map', () => {
  const r = one([{ n: 1, pid: id(3), commit: commits[4], hl: TXT.bravo }]);
  assert.equal(r.verdict, 'UNAFFECTED');
});

test('NOT_APPLIED through chained maps (3 -> 4 -> 5 -> 4)', () => {
  const r = one([{ n: 2, pid: id(3), commit: commits[0], hl: TXT.charlie.slice(0, 40) }]);
  assert.equal(r.verdict, 'NOT_APPLIED');
  assert.equal(r.candidate, id(4));
  assert.equal(r.fixup, id(4));
  assert.equal(r.basis, 'ancestry');
});

test('APPLIED: row already holds the chain result', () => {
  const r = one([{ n: 3, pid: id(4), commit: commits[0], hl: TXT.charlie }]);
  assert.equal(r.verdict, 'APPLIED');
  assert.equal(r.fixup, '');
  assert.equal(r.candidate, ''); // renders as "-": the row is already there
});

test('a report whose commit postdates a map is not remapped by that map', () => {
  // filed at C3: M1 and M2 are ancestors (already live), only M3 (4 -> 3 for "bravo") applies
  const r = one([{ n: 4, pid: id(4), commit: commits[2], hl: TXT.bravo }]);
  assert.equal(r.verdict, 'NOT_APPLIED');
  assert.equal(r.candidate, id(3));
  // filed at C4 (after M3): nothing applies
  const r2 = one([{ n: 5, pid: id(3), commit: commits[3], hl: TXT.bravo }]);
  assert.equal(r2.verdict, 'UNAFFECTED');
});

test('AMBIGUOUS: chain ends in DROPPED-', () => {
  const r = one([{ n: 6, pid: id(2), commit: commits[1], hl: TXT.ins }]);
  assert.equal(r.verdict, 'AMBIGUOUS');
  assert.match(r.notes.join(), /DROPPED/);
});

test('AMBIGUOUS: no highlighted text and a possible already-remapped row', () => {
  const r = one([{ n: 7, pid: id(3), commit: commits[0], hl: '' }]);
  assert.equal(r.verdict, 'AMBIGUOUS');
});

test('AMBIGUOUS: highlight matches neither paragraph', () => {
  const r = one([{ n: 8, pid: id(3), commit: commits[0], hl: 'Un texte completement different et invente de toutes pieces' }]);
  assert.equal(r.verdict, 'AMBIGUOUS');
});

test("commit_hash 'unknown': date fallback, AMBIGUOUS without highlight", () => {
  const r = one([{ n: 9, pid: id(3), commit: 'unknown', hl: TXT.charlie, created: '2026-01-15 09:00:00.5+00' }]);
  assert.equal(r.verdict, 'NOT_APPLIED');
  assert.equal(r.basis, 'date');
  assert.equal(r.candidate, id(4));
  assert.ok(r.notes.includes('date-basis-verify-by-hand'));
  const r2 = one([{ n: 10, pid: id(3), commit: 'unknown', hl: '', created: '2026-01-15 09:00:00+00' }]);
  assert.equal(r2.verdict, 'AMBIGUOUS');
  // created after the last map: nothing applies
  const r3 = one([{ n: 11, pid: id(3), commit: 'unknown', hl: TXT.bravo, created: '2026-06-01 09:00:00+00' }]);
  assert.equal(r3.verdict, 'UNAFFECTED');
});

test('CSV parser handles quotes, commas and newlines in fields', () => {
  const rows = parseCsv('a,b\n"x, ""y""\nz",2\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, "y"\nz', '2']]);
});

test('missing / empty / malformed CSV fails loudly', () => {
  assert.throws(() => parseReports(''), /empty/);
  assert.throws(() => parseReports('id,paragraph_id,language,commit_hash,created_at,highlighted_text\n'), /no data rows/);
  assert.throws(() => parseReports('id,paragraph_id\nx,y\n'), /missing column/);
  const cli = (args: string[]) => spawnSync('npx', ['tsx', SCRIPT, ...args], { cwd: REPO_ROOT, encoding: 'utf8' });
  const r = cli(['--reports', path.join(tmp, 'nope.csv'), '--root', repo]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /not found/);
  const empty = path.join(tmp, 'empty.csv');
  fs.writeFileSync(empty, '');
  const r2 = cli(['--reports', empty, '--root', repo]);
  assert.notEqual(r2.status, 0);
  assert.match(r2.stderr, /empty/);
});

test('CLI: outputs contain no reader text and the migration lints clean', () => {
  const secret = 'SECRETREADERTEXT charlie piano desaccorde tres longtemps';
  const f = path.join(tmp, 'reports.csv');
  fs.writeFileSync(f, csv([
    { n: 20, pid: id(3), commit: commits[0], hl: TXT.charlie },
    { n: 21, pid: id(3), commit: commits[0], hl: secret },
    { n: 22, pid: id(4), commit: commits[0], hl: TXT.charlie },
  ]).replace(/"Le piano[^"]*"/, '"' + TXT.charlie + '"'));
  const outDir = path.join(tmp, 'out');
  const migDir = path.join(tmp, 'migs');
  fs.mkdirSync(migDir);
  fs.writeFileSync(path.join(migDir, '0001-x.sql'), '-- x\n');
  const r = spawnSync('npx', ['tsx', SCRIPT, '--reports', f, '--root', repo, '--out-dir', outDir, '--migrations-dir', migDir, '--date', '2026-10-03', '--write-migration'], { cwd: REPO_ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const files = [...fs.readdirSync(outDir).map((x) => path.join(outDir, x)), ...fs.readdirSync(migDir).map((x) => path.join(migDir, x))];
  const mig = path.join(migDir, '0002-legacy-report-fixups.sql');
  assert.ok(files.includes(mig));
  const everything = r.stdout + r.stderr + files.map((x) => fs.readFileSync(x, 'utf8')).join('\n');
  for (const needle of [secret, 'SECRETREADERTEXT', 'piano', 'superbe', ...Object.values(TXT)]) assert.ok(!everything.includes(needle), `output leaked: ${needle}`);
  const sql = fs.readFileSync(mig, 'utf8');
  assert.equal(sql.match(/^UPDATE /gm)?.length, 1);
  assert.ok(sql.includes(`SET paragraph_id = '001.0004' WHERE id = '${U(20)}' AND paragraph_id = '001.0003';`));
  const lint = spawnSync('bash', [path.join(REPO_ROOT, 'src/auth/db-deploy.sh'), 'lint', 'migration', mig], { cwd: REPO_ROOT, encoding: 'utf8' });
  assert.equal(lint.status, 0, lint.stdout + lint.stderr);
});

test('renderMigration refuses malformed IDs', () => {
  const bad: Result = { id: "x'; DROP TABLE y;--", paragraph_id: id(3), language: 'cz', status: '', verdict: 'NOT_APPLIED', candidate: id(4), fixup: id(4), basis: 'ancestry', notes: [] };
  assert.throws(() => renderMigration([bad], { date: '2026-10-03', head: 'abc' }), /bad UUID/);
});

test('date fallback: a report created within 48 h of a map commit is AMBIGUOUS (date-near-map)', () => {
  const r = one([{ n: 30, pid: id(3), commit: 'unknown', hl: TXT.charlie, created: '2026-02-01 18:00:00+00' }]);
  assert.equal(r.verdict, 'AMBIGUOUS');
  assert.ok(r.notes.includes('date-near-map'));
});

test("language tree without the paragraph: also tries _original (French highlighted under a translation)", () => {
  const r = one([{ n: 31, pid: id(3), commit: commits[0], hl: TXT.charlie, lang: 'cz' }]);
  assert.equal(r.verdict, 'NOT_APPLIED');
  assert.equal(r.candidate, id(4));
});

// ---------------------------------------------------------------- multi-carnet / pooled / merge fixtures
const pid = (c: string, n: number) => `${c}.${String(n).padStart(4, '0')}`;
const WORDS: Record<string, string> = {
  a: 'orage lointain sur la baie', b: 'violon quelque part chez les voisins', c: 'lettre oubliee dans le tiroir', n: 'matin nouveau retrouve au manuscrit',
  x: 'cheval blanc devant la grille', y: 'sonnette cassee depuis lundi', p: 'dentelle noire et gants gris', q: 'tableau vendu pour mille francs',
  r: 'train retarde jusqu au soir', s: 'robe verte chez la couturiere', a2: 'orage lointain sur la baie',
};
const para = (c: string, k: string) => `${WORDS[k]} dans le carnet ${c}, notes diverses.`;
function carnetFile(c: string, keys: string[], texts: Record<string, string> = {}): string {
  return `---\ndate: 1880-01-01\ncarnet: "${c}"\n---\n` + keys.map((k, i) => `%% ${pid(c, i + 1)} %%\n${texts[k] ?? para(c, k)}\n`).join('\n');
}
function mapOf(c: string, prev: string[], next: string[], extra: { newIds?: string[] } = {}): string {
  const id_map: Record<string, string> = {};
  const dropped: { id: string }[] = [];
  prev.forEach((k, i) => { const j = next.indexOf(k); if (j >= 0) id_map[pid(c, i + 1)] = pid(c, j + 1); else dropped.push({ id: pid(c, i + 1) }); });
  return JSON.stringify({ carnet: c, id_map, dropped, new_paragraphs: extra.newIds ?? [] });
}
const MARK = '-- deploy-ledger: renumber v1\nSELECT 1;\n';
function mkRepo(): { dir: string; commit: (msg: string, date: string) => string } {
  const dir = fs.mkdtempSync(path.join(tmp, 'r-'));
  sh(dir, ['init', '-q', '-b', 'main']);
  return { dir, commit: (msg, date) => { sh(dir, ['add', '-A']); sh(dir, ['commit', '-q', '-m', msg], date); return sh(dir, ['rev-parse', 'HEAD']); } };
}
function audit(g: Git, rows: Parameters<typeof csv>[0]) { return auditAll(g, g.resolve('HEAD'), parseReports(csv(rows))); }

test('pooled maps in one commit: cross-carnet move is simultaneous; pooled marker script is deployable, pooled legacy script is not; same-carnet maps chain', () => {
  const R = mkRepo();
  const f = (c: string, keys: string[]) => write(path.join(R.dir, `content/_original/${c}/e.md`), carnetFile(c, keys));
  f('001', ['a', 'b', 'c']); f('002', ['x', 'y']); f('003', ['p', 'q']); f('004', ['r', 's']);
  const d1 = R.commit('d1', '2026-01-01');
  // D2: legacy pooled script (no marker); 001.0003 (c) moves into carnet 002 while 002's own paragraphs shift
  f('001', ['a', 'b']); write(path.join(R.dir, 'content/_original/002/e.md'), carnetFile('002', ['c', 'x', 'y'], { c: para('001', 'c') }));
  write(path.join(R.dir, 'content/_renumber/001-2026-02-01.json'), mapOf('001', ['a', 'b', 'c'], ['a', 'b']).replace('"dropped":[{"id":"001.0003"}]', '"dropped":[]').replace('"id_map":{', '"id_map":{"001.0003":"002.0001",'));
  write(path.join(R.dir, 'content/_renumber/002-2026-02-01.json'), mapOf('002', ['x', 'y'], ['c', 'x', 'y']).replace('"id_map":{', '"id_map":{'));
  write(path.join(R.dir, 'content/_renumber/001+002-2026-02-01.sql'), '-- legacy script, no marker\nSELECT 1;\n');
  R.commit('d2', '2026-02-01');
  // D3: pooled script WITH the marker for 003+004
  f('003', ['q', 'p']); f('004', ['s', 'r']);
  write(path.join(R.dir, 'content/_renumber/003-2026-03-01.json'), mapOf('003', ['p', 'q'], ['q', 'p']));
  write(path.join(R.dir, 'content/_renumber/004-2026-03-01.json'), mapOf('004', ['r', 's'], ['s', 'r']));
  write(path.join(R.dir, 'content/_renumber/003+004-2026-03-01.sql'), MARK);
  R.commit('d3', '2026-03-01');
  // D4: two maps of ONE carnet in one commit: [a b] -> [b a] -> [n b a]
  write(path.join(R.dir, 'content/_original/001/e.md'), carnetFile('001', ['n', 'b', 'a'], { n: para('001', 'n') }));
  write(path.join(R.dir, 'content/_renumber/001-2026-04-01.json'), mapOf('001', ['a', 'b'], ['b', 'a']));
  write(path.join(R.dir, 'content/_renumber/001-2026-04-01-2.json'), mapOf('001', ['b', 'a'], ['n', 'b', 'a'], { newIds: ['001.0001'] }));
  R.commit('d4', '2026-04-01');
  fs.writeFileSync(path.join(R.dir, 'README.md'), 'x\n');
  R.commit('d5', '2026-05-01');
  const g = new Git(R.dir);
  const { layers, results } = audit(g, [
    { n: 40, pid: pid('001', 3), commit: d1, hl: para('001', 'c') }, // cross-carnet
    { n: 41, pid: pid('002', 1), commit: d1, hl: para('002', 'x') }, // simultaneous, not chained to 002.0003
    { n: 42, pid: pid('003', 1), commit: d1, hl: para('003', 'p') }, // pooled marker script: runner applies it
    { n: 43, pid: pid('001', 1), commit: d1, hl: para('001', 'a') }, // two same-carnet maps chain: 1 -> 2 -> 3
  ]);
  assert.deepEqual(layers.map((l) => [l.names.join('+'), l.deployable]), [
    ['001-2026-02-01+002-2026-02-01', false],
    ['003-2026-03-01+004-2026-03-01', true],
    ['001-2026-04-01', false],
    ['001-2026-04-01-2', false],
  ]);
  assert.equal(results[0].verdict, 'NOT_APPLIED');
  assert.equal(results[0].fixup, '002.0001');
  assert.equal(results[1].verdict, 'NOT_APPLIED');
  assert.equal(results[1].fixup, '002.0002');
  assert.equal(results[2].verdict, 'UNAFFECTED'); // would be a NOT_APPLIED fix-up (and a double move) if the pooled script were seen as legacy
  assert.ok(results[2].notes.includes('only-pending-deploy-scripts-apply'));
  assert.equal(results[3].verdict, 'NOT_APPLIED');
  assert.equal(results[3].fixup, '001.0003');
});

test('an older marker script still in the tree does not make a later map deployable (only scripts ADDED by the map commit count)', () => {
  const R = mkRepo();
  write(path.join(R.dir, 'content/_original/003/e.md'), carnetFile('003', ['p', 'q']));
  R.commit('e1', '2026-01-01');
  write(path.join(R.dir, 'content/_original/003/e.md'), carnetFile('003', ['q', 'p']));
  write(path.join(R.dir, 'content/_renumber/003-2026-02-01.json'), mapOf('003', ['p', 'q'], ['q', 'p']));
  write(path.join(R.dir, 'content/_renumber/003-2026-02-01.sql'), MARK);
  R.commit('e2', '2026-02-01');
  write(path.join(R.dir, 'content/_original/003/e.md'), carnetFile('003', ['p', 'q']));
  write(path.join(R.dir, 'content/_renumber/003-2026-03-01.json'), mapOf('003', ['q', 'p'], ['p', 'q']));
  const e3 = R.commit('e3', '2026-03-01');
  const { layers } = audit(new Git(R.dir), [{ n: 50, pid: pid('003', 1), commit: e3, hl: para('003', 'p') }]);
  assert.deepEqual(layers.map((l) => [l.names.join('+'), l.deployable]), [['003-2026-02-01', true], ['003-2026-03-01', false]]);
});

test('merge-commit ancestry; text fitting both hypotheses; new_paragraphs id without text', () => {
  const R = mkRepo();
  const put = (keys: string[], texts: Record<string, string> = {}) => write(path.join(R.dir, 'content/_original/001/e.md'), carnetFile('001', keys, texts));
  const same = para('001', 'a');
  put(['a', 'a2'], { a2: same });
  const c1 = R.commit('c1', '2026-01-01');
  sh(R.dir, ['checkout', '-q', '-b', 'side']);
  fs.writeFileSync(path.join(R.dir, 'side.txt'), 's\n');
  const s1 = R.commit('s1', '2026-01-10');
  sh(R.dir, ['checkout', '-q', 'main']);
  put(['n', 'a', 'a2'], { a2: same });
  write(path.join(R.dir, 'content/_renumber/001-2026-02-01.json'), mapOf('001', ['a', 'a2'], ['n', 'a', 'a2'], { newIds: ['001.0001'] }));
  R.commit('map', '2026-02-01');
  sh(R.dir, ['checkout', '-q', 'side']);
  sh(R.dir, ['merge', '-q', '--no-ff', '-m', 'merge', 'main'], '2026-02-05');
  fs.writeFileSync(path.join(R.dir, 'side.txt'), 's2\n');
  const s2 = R.commit('s2', '2026-02-10');
  const g = new Git(R.dir);
  const { results } = audit(g, [
    { n: 50, pid: pid('001', 1), commit: s1, hl: same }, // side branch before the merge: the map applies
    { n: 51, pid: pid('001', 1), commit: s2, hl: same }, // map reachable only through the merge parent: already live
    { n: 52, pid: pid('001', 2), commit: c1, hl: same }, // identical text at 0001 and 0002: cannot tell
    { n: 53, pid: pid('001', 1), commit: c1, hl: '' }, // 0001 is a NEW paragraph of the map
  ]);
  assert.equal(results[0].verdict, 'NOT_APPLIED');
  assert.equal(results[0].candidate, pid('001', 2));
  assert.equal(results[1].verdict, 'UNAFFECTED');
  assert.equal(results[2].verdict, 'AMBIGUOUS');
  assert.ok(results[2].notes.includes('text-fits-both-hypotheses'));
  assert.equal(results[3].verdict, 'AMBIGUOUS');
  assert.ok(results[3].notes.includes('id-is-new-paragraph-no-text'));
});

test('report output never echoes reader-controlled values that fail validation', () => {
  const evil = '001.0003|\n# injected heading';
  const text = 'id,paragraph_id,language,commit_hash,created_at,status,highlighted_text\n' +
    `${U(60)},"${evil}","cz|x\n evil",${commits[0]},2026-06-01 10:00:00+00,"open|\nzzbadzz","hello"\n` +
    `${U(61)},${id(3)},cz,${commits[0]},2026-06-01 10:00:00+00,open,"hello"\n`;
  const { results, layers } = auditAll(git, git.resolve('HEAD'), parseReports(text));
  const md = renderReport(results, layers, { date: '2026-10-03', head: git.resolve('HEAD') });
  assert.ok(!md.includes('injected'));
  assert.ok(!md.includes('evil'));
  assert.ok(!md.includes("zzbadzz"));
  assert.ok(md.includes('<invalid>'));
  const tableRows = md.split('\n').filter((l) => l.startsWith('| 00000000'));
  assert.equal(tableRows.length, 2);
  assert.equal(tableRows[0].split('|').length, tableRows[1].split('|').length); // no extra columns injected
});
