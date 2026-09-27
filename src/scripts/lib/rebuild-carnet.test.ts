// Fixture tests for src/scripts/rebuild-carnet.ts. Run: just test-rebuild-carnet
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMapping, loadTree, makeRewriter, mergeRedirects, type Issues, type Plan } from './rebuild-carnet-core.ts';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'rebuild-carnet.ts');

const ORIG_01 = `---
date: 1880-01-01
entry_id: 1880-01-01
carnet: "099"
location: Paris
workflow:
  research_complete: true
  linguistic_annotation_complete: true
para_start: 1
para_end: 3
---
%% 099.0001 %%
%% [#Paris](../_glossary/places/cities/PARIS.md) %%
# Jeudi 1er janvier 1880
Premier paragraphe[^1].

[^1]: Note one.

%% 099.0002 %%
Deuxième paragraphe.

[^2]: Note two, referenced from the next paragraph.

%% 099.0003 %%
%% 2026-01-01T10:00:00 LAN: a note %%
Troisième, qui appartient au 2 janvier[^2].
`;

const ORIG_02 = `---
date: 1880-01-02
entry_id: 1880-01-02
carnet: "099"
location: Paris
workflow:
  research_complete: true
  linguistic_annotation_complete: true
para_start: 4
para_end: 5
---
%% 099.0004 %%
# Vendredi 2 janvier 1880
Quatrième.

%% 099.0005 %%
Cinquième, qui appartient au 3 janvier.
`;

const CZ_01 = `---
date: 1880-01-01
carnet: "099"
translation_complete: true
editor_approved: true
conductor_approved: true
---

%% 099.0001 %%
# Čtvrtek 1. ledna 1880
%% [#Paris](../../_original/_glossary/places/cities/PARIS.md) %%
%% Premier paragraphe. %%
První odstavec[^099.1.1].

[^099.1.1]: Pozn. jedna.

%% 099.0002 %%
%% Deuxième paragraphe. %%
Druhý odstavec.
%% 2026-01-02T10:00:00 RED: see 099.0003 and 099.0005 %%

%% 099.0003 %%
%% Troisième, qui appartient au 2 janvier. %%
Třetí[^099.0003.1].

[^099.0003.1]: Pozn. tři.

%% 2026-01-03T10:00:00 CON: APPROVED — whole entry 1880-01-01 %%
`;

const CZ_02 = `---
date: 1880-01-02
carnet: "099"
translation_complete: true
editor_approved: true
conductor_approved: true
---

%% 099.0004 %%
# Pátek 2. ledna 1880
%% Quatrième. %%
Čtvrtý.

%% 099.0005 %%
%% Cinquième, qui appartient au 3 janvier. %%
Pátý.
`;

const GLOSSARY = `# Paris

Cited at (099.0003) and 099.0005; see [link](/cz/099/1880-01-02/#p-099-0005).
Not ours: 098.0003, SUM.099.0003, 1099.0003.
`;

function makeRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bashk-rebuild-'));
  const w = (rel: string, text: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  w('content/_original/099/1880-01-01.md', ORIG_01);
  w('content/_original/099/1880-01-02.md', ORIG_02);
  w('content/_original/099/README.md', 'Carnet 099 — see 099.0003.\n');
  w('content/cz/099/1880-01-01.md', CZ_01);
  w('content/cz/099/1880-01-02.md', CZ_02);
  w('content/_original/_glossary/places/cities/PARIS.md', GLOSSARY);
  w('docs/notes.md', 'Entry file: content/_original/099/1880-01-02.md\n');
  w('.claude/reports/old-run.md', 'History mentions 099.0003.\n');
  return root;
}

const MOVE_PLAN: Plan = {
  carnet: '099',
  source: 'fixture.docx',
  entries: [
    { file: '1880-01-01.md', date: '1880-01-01', paragraphs: [{ old: '099.0001' }, { old: '099.0002' }] },
    {
      file: '1880-01-02.md',
      date: '1880-01-02',
      paragraphs: [
        { old: '099.0004' },
        { old: '099.0003' },
        { new: { french: 'Un paragraphe retrouvé.', rsr: 'Missing in transcription; fixture.docx ¶12.', tags: ['[#Paris](../_glossary/places/cities/PARIS.md)'] } },
      ],
    },
    { file: '1880-01-03.md', date: '1880-01-03', heading: 'Samedi 3 janvier 1880', frontmatter_from: '1880-01-02.md', paragraphs: [{ old: '099.0005' }] },
  ],
};

function run(root: string, ...args: string[]) {
  const r = spawnSync('npx', ['tsx', SCRIPT, ...args, '--root', root], { encoding: 'utf-8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

function snapshot(root: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else out.set(path.relative(root, f), fs.readFileSync(f, 'utf-8'));
    }
  };
  walk(root);
  return out;
}

const read = (root: string, rel: string) => fs.readFileSync(path.join(root, rel), 'utf-8');

test('validation rejects a plan that omits or duplicates IDs', () => {
  const root = makeRepo();
  try {
    const original = loadTree(path.join(root, 'content'), '_original', '099')!;
    const bad: Plan = { carnet: '099', entries: [{ file: '1880-01-01.md', date: '1880-01-01', paragraphs: [{ old: '099.0001' }, { old: '099.0001' }, { old: '099.0042' }] }] };
    const issues: Issues = { errors: [], warnings: [] };
    buildMapping(bad, original, issues);
    const all = issues.errors.join('\n');
    assert.match(all, /placed twice/);
    assert.match(all, /unknown ID 099\.0042/);
    assert.match(all, /omits 4 existing ID/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('rewriter maps IDs, anchors, paths and footnote labels in one pass', () => {
  const root = makeRepo();
  try {
    const original = loadTree(path.join(root, 'content'), '_original', '099')!;
    const plan: Plan = JSON.parse(JSON.stringify(MOVE_PLAN));
    plan.entries[1].file = '1880-01-02-bis.md';
    const m = buildMapping(plan, original, { errors: [], warnings: [] });
    const rw = makeRewriter(m, { footnoteLabels: true });
    // 0003→0004 and 0004→0003 swap: a chained replace would map both to the same value
    assert.equal(rw('099.0003 099.0004 099.0005').text, '099.0004 099.0003 099.0006');
    assert.equal(rw('/cz/099/1880-01-02/#p-099-0005').text, '/cz/099/1880-01-03/#p-099-0006');
    assert.equal(rw('../099/1880-01-02.md').text, '../099/1880-01-02-bis.md');
    assert.equal(rw('[^099.3.1] [^099.0003.1] [^99.03.2]').text, '[^099.4.1] [^099.0004.1] [^99.04.2]');
    assert.equal(rw('SUM.099.0003 1099.0003 099.00031 098.0003').text, 'SUM.099.0003 1099.0003 099.00031 098.0003');
    assert.equal(makeRewriter(m)('[^099.3.1]').text, '[^099.3.1]', 'labels are left alone outside the carnet');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dry run writes nothing; --write moves clusters, inserts, rewrites refs, resets flags', () => {
  const root = makeRepo();
  try {
    const planPath = path.join(root, 'plan.json');
    fs.writeFileSync(planPath, JSON.stringify(MOVE_PLAN));
    const before = snapshot(root);

    const dry = run(root, '099', planPath);
    assert.equal(dry.code, 0, dry.out);
    assert.match(dry.out, /DRY RUN — nothing written/);
    assert.deepEqual(snapshot(root), before, 'dry run must not touch the tree');

    const wr = run(root, '099', planPath, '--write');
    assert.equal(wr.code, 0, wr.out);
    assert.match(wr.out, /RESULT: PASS/);

    // _original: cluster moved with its LAN note, new paragraph created, renumbered
    const o2 = read(root, 'content/_original/099/1880-01-02.md');
    assert.match(o2, /%% 099\.0003 %%\n# Vendredi 2 janvier 1880\nQuatrième\./);
    assert.match(o2, /%% 099\.0004 %%\n%% 2026-01-01T10:00:00 LAN: a note %%\nTroisième, qui appartient au 2 janvier\[\^2\]\./);
    assert.match(o2, /%% 099\.0005 %%\n%% \[#Paris\]\(\.\.\/_glossary\/places\/cities\/PARIS\.md\) %%\n%% \d{4}-\d\d-\d\dT[\d:]+ RSR: Missing in transcription; fixture\.docx ¶12\. %%\nUn paragraphe retrouvé\./);
    assert.match(o2, /^para_start: 3$/m);
    assert.match(o2, /^para_end: 5$/m);
    assert.match(o2, /linguistic_annotation_complete: false/, 'new source text is not annotated yet');
    // footnote [^2] was defined in 0002 (stays in 01-01) but referenced from the moved paragraph
    assert.match(o2, /\[\^2\]: Note two/);
    const o1 = read(root, 'content/_original/099/1880-01-01.md');
    assert.doesNotMatch(o1, /\[\^2\]: Note two/);
    assert.match(o1, /^para_end: 2$/m);

    // plan heading inserted into a file whose first paragraph had none; frontmatter from 01-02
    const o3 = read(root, 'content/_original/099/1880-01-03.md');
    assert.match(o3, /^date: 1880-01-03$/m);
    assert.match(o3, /^entry_id: 1880-01-03$/m);
    assert.match(o3, /^location: Paris$/m);
    assert.match(o3, /%% 099\.0006 %%\n# Samedi 3 janvier 1880\nCinquième/);

    // cz: clusters follow, footnote labels renumbered, new paragraph scaffolded, flags reset
    const c2 = read(root, 'content/cz/099/1880-01-02.md');
    assert.match(c2, /%% 099\.0004 %%\n%% Troisième, qui appartient au 2 janvier\. %%\nTřetí\[\^099\.0004\.1\]\./);
    assert.match(c2, /\[\^099\.0004\.1\]: Pozn\. tři\./);
    assert.match(c2, /%% 099\.0005 %%\n%% Un paragraphe retrouvé\. %%\n%% \[#Paris\]\(\.\.\/\.\.\/_original\/_glossary\/places\/cities\/PARIS\.md\) %%\n%% [\d\-T:]+ RSR: [^\n]+%%\nTODO/);
    assert.match(c2, /^translation_complete: false$/m);
    assert.match(c2, /^conductor_approved: false$/m);
    assert.match(c2, /ED: rebuild-carnet 099 \(fixture\.docx\): this entry's paragraph set changed/);
    const c1 = read(root, 'content/cz/099/1880-01-01.md');
    assert.match(c1, /RED: see 099\.0004 and 099\.0006/);
    assert.match(c1, /^editor_approved: false$/m, 'lost a paragraph → reset');
    assert.match(c1, /Druhý odstavec\.\n%% [^\n]+RED[^\n]+%%\n\n%% 2026-01-03T10:00:00 CON: APPROVED — whole entry 1880-01-01 %%\n\n%% [^\n]+ ED: /, 'entry-level verdict stays with its entry');
    assert.doesNotMatch(c2, /CON: APPROVED/);
    const c3 = read(root, 'content/cz/099/1880-01-03.md');
    assert.match(c3, /%% 099\.0006 %%\n%% Samedi 3 janvier 1880 %%\n# TODO\n/);
    assert.match(c3, /^translation_complete: false$/m);

    // references elsewhere; reports stay history
    const g = read(root, 'content/_original/_glossary/places/cities/PARIS.md');
    assert.match(g, /Cited at \(099\.0004\) and 099\.0006; see \[link\]\(\/cz\/099\/1880-01-03\/#p-099-0006\)/);
    assert.match(g, /Not ours: 098\.0003, SUM\.099\.0003, 1099\.0003\./);
    assert.equal(read(root, 'content/_original/099/README.md'), 'Carnet 099 — see 099.0004.\n');
    assert.equal(read(root, '.claude/reports/old-run.md'), 'History mentions 099.0003.\n');

    // outputs
    const maps = fs.readdirSync(path.join(root, 'content/_renumber'));
    const mapFile = maps.find((f) => /^099-\d{4}-\d\d-\d\d\.json$/.test(f))!;
    const map = JSON.parse(read(root, `content/_renumber/${mapFile}`));
    assert.equal(map.id_map['099.0003'], '099.0004');
    assert.deepEqual(map.new_paragraphs, [{ id: '099.0005', file: '1880-01-02.md' }]);
    const sql = read(root, `content/_renumber/${mapFile.replace('.json', '.sql')}`);
    assert.match(sql, /\('099\.0003', '099\.0004'\)/);
    assert.match(sql, /UPDATE paragraph_reports r SET paragraph_id = m\.new_id/);

    // idempotence: the result's identity plan is a no-op, and --check passes
    const idPlan = spawnSync('npx', ['tsx', SCRIPT, '--identity-plan', '099', '--root', root], { encoding: 'utf-8' }).stdout;
    fs.writeFileSync(planPath, idPlan);
    const again = run(root, '099', planPath);
    assert.equal(again.code, 0, again.out);
    assert.match(again.out, /no change: the plan reproduces the current carnet/);
    const chk = run(root, '--check', '099');
    assert.equal(chk.code, 0, chk.out);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a pure rename keeps approval flags and records a redirect', () => {
  const root = makeRepo();
  try {
    const plan: Plan = {
      carnet: '099',
      entries: [
        { file: '1880-01-01.md', date: '1880-01-01', paragraphs: [{ old: '099.0001' }, { old: '099.0002' }, { old: '099.0003' }] },
        { file: '1880-01-02-03.md', date: '1880-01-02', paragraphs: [{ old: '099.0004' }, { old: '099.0005' }] },
      ],
    };
    const planPath = path.join(root, 'plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan));
    const wr = run(root, '099', planPath, '--write');
    assert.equal(wr.code, 0, wr.out);
    assert.ok(!fs.existsSync(path.join(root, 'content/cz/099/1880-01-02.md')));
    const c = read(root, 'content/cz/099/1880-01-02-03.md');
    assert.equal(c, CZ_02, 'same paragraph set: file content and flags unchanged');
    assert.equal(read(root, 'docs/notes.md'), 'Entry file: content/_original/099/1880-01-02-03.md\n');
    const redirects = JSON.parse(read(root, 'content/_renumber/redirects.json'));
    assert.equal(redirects['/cz/099/1880-01-02'], '/cz/099/1880-01-02-03/');
    assert.equal(redirects['/original/099/1880-01-02'], '/original/099/1880-01-02-03/');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('redirects chain and drop sources that are live pages again', () => {
  const m = {
    carnet: '099',
    fileMap: new Map([['b.md', 'c.md']]),
    newFileIds: new Map([['a.md', []], ['c.md', []]]),
    removedFiles: ['b.md'],
  } as unknown as Parameters<typeof mergeRedirects>[1];
  const out = mergeRedirects({ '/cz/099/x': '/cz/099/b/', '/cz/099/a': '/cz/099/old/' }, m, ['cz']);
  assert.deepEqual(out, { '/cz/099/b': '/cz/099/c/', '/cz/099/x': '/cz/099/c/' });
});
