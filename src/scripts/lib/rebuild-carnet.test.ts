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
  w('docs/notes.md', 'Entry file: content/_original/099/1880-01-02.md, example 099.0003\n');
  w('content/_original/_summary/notes.md', 'Entry file: ../099/1880-01-02.md; see 099.0003\nHistory: 099.0003 was split <!-- rebuild-carnet: keep -->\n');
  w('content/cz/CLAUDE.md', 'Example: 099.0003\n');
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
    assert.equal(read(root, 'content/_original/_summary/notes.md'), 'Entry file: ../099/1880-01-02.md; see 099.0004\nHistory: 099.0003 was split <!-- rebuild-carnet: keep -->\n');
    assert.equal(read(root, 'docs/notes.md'), 'Entry file: content/_original/099/1880-01-02.md, example 099.0003\n');

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
    assert.equal(read(root, 'content/_original/_summary/notes.md'), 'Entry file: ../099/1880-01-02-03.md; see 099.0003\nHistory: 099.0003 was split <!-- rebuild-carnet: keep -->\n');
    // code/docs and CLAUDE.md guidance are outside the rewrite scope
    assert.equal(read(root, 'docs/notes.md'), 'Entry file: content/_original/099/1880-01-02.md, example 099.0003\n');
    assert.equal(read(root, 'content/cz/CLAUDE.md'), 'Example: 099.0003\n');
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

test('new clipping / old letter: kind marker, blockquote and clipping tag in every tree', () => {
  const root = makeRepo();
  try {
    const plan: Plan = {
      carnet: '099',
      entries: [
        { file: '1880-01-01.md', date: '1880-01-01', paragraphs: [{ old: '099.0001' }, { old: '099.0002', kind: 'letter', source: 'Lettre de Dina' }, { old: '099.0003' }] },
        {
          file: '1880-01-02.md',
          date: '1880-01-02',
          paragraphs: [
            { old: '099.0004' },
            { new: { kind: 'clipping', source: 'Le Figaro, 2 janvier 1880', french: "Hier soir on remarquait\nMlle Bashkirtseff.", rsr: 'Clipping pasted on the page; fixture.docx ¶20.', tags: ['[#Le_Figaro](../_glossary/culture/newspapers/LE_FIGARO.md)'] } },
            { old: '099.0005' },
          ],
        },
      ],
    };
    const planPath = path.join(root, 'plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan));
    const wr = run(root, '099', planPath, '--write');
    assert.equal(wr.code, 0, wr.out);

    const o2 = read(root, 'content/_original/099/1880-01-02.md');
    assert.match(o2, /%% 099\.0005 %%\n%% kind: clipping source="Le Figaro, 2 janvier 1880" %%\n%% \[#Le_Figaro\]\(\.\.\/_glossary\/culture\/newspapers\/LE_FIGARO\.md\) %%\n%% \[#Press_clipping\]\(\.\.\/_glossary\/culture\/newspapers\/PRESS_CLIPPING\.md\) %%\n%% [\d\-T:]+ RSR: [^\n]+%%\n> Hier soir on remarquait\n> Mlle Bashkirtseff\./);
    const c2 = read(root, 'content/cz/099/1880-01-02.md');
    assert.match(c2, /%% 099\.0005 %%\n%% kind: clipping source="Le Figaro, 2 janvier 1880" %%\n%% > Hier soir on remarquait %%\n%% > Mlle Bashkirtseff\. %%\n%% \[#Le_Figaro\]\(\.\.\/\.\.\/_original\/_glossary\/culture\/newspapers\/LE_FIGARO\.md\) %%\n%% \[#Press_clipping\]/);
    assert.match(c2, /RSR: Clipping pasted[^\n]+%%\nTODO\n/);

    // an existing paragraph marked as a letter: marker under the ID everywhere, flags kept
    const o1 = read(root, 'content/_original/099/1880-01-01.md');
    assert.match(o1, /%% 099\.0002 %%\n%% kind: letter source="Lettre de Dina" %%\nDeuxième paragraphe\./);
    const c1 = read(root, 'content/cz/099/1880-01-01.md');
    assert.match(c1, /%% 099\.0002 %%\n%% kind: letter source="Lettre de Dina" %%\n%% Deuxième paragraphe\. %%/);
    assert.match(c1, /^conductor_approved: true$/m);

    const bad: Plan = JSON.parse(JSON.stringify(plan));
    (bad.entries[0].paragraphs[1] as { kind: string }).kind = 'poster';
    const original = loadTree(path.join(root, 'content'), '_original', '099')!;
    const issues: Issues = { errors: [], warnings: [] };
    buildMapping(bad, original, issues);
    assert.match(issues.errors.join('\n'), /kind must be one of clipping, letter, rayé, margin, cover, editorial, other \(got "poster"\)/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('cover entry sorts first, plan order must match file order, redirect_from overrides the target', () => {
  const root = makeRepo();
  try {
    const original = loadTree(path.join(root, 'content'), '_original', '099')!;
    const plan: Plan = {
      carnet: '099',
      entries: [
        { file: '1880-01-01-cover.md', date: '1880-01-01', paragraphs: [{ new: { kind: 'cover', french: '# Couverture\nJournal. Livre 99.', rsr: 'Cover text; fixture.docx ¶1.' } }] },
        { file: '1880-01-01.md', date: '1880-01-01', paragraphs: [{ old: '099.0001' }, { old: '099.0002' }, { old: '099.0003' }, { old: '099.0004' }] },
        { file: '1880-01-03.md', date: '1880-01-03', redirect_from: ['1880-01-02.md'], paragraphs: [{ old: '099.0005' }] },
      ],
    };
    const issues: Issues = { errors: [], warnings: [] };
    const m = buildMapping(plan, original, issues);
    assert.deepEqual(issues.errors, []);
    assert.equal(m.idMap.get('099.0001'), '099.0002', 'the cover paragraph is 0001');
    assert.equal(m.fileMap.get('1880-01-02.md'), '1880-01-03.md', 'redirect_from wins over "first paragraph went to 1880-01-01"');

    const swapped: Plan = { ...plan, entries: [plan.entries[1], plan.entries[0], plan.entries[2]] };
    const bad: Issues = { errors: [], warnings: [] };
    buildMapping(swapped, original, bad);
    assert.match(bad.errors.join('\n'), /entry order: 1880-01-01\.md is listed where 1880-01-01-cover\.md sorts/);
    assert.match(bad.errors.join('\n'), /a cover entry must be the carnet's first entry/);

    const planPath = path.join(root, 'plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan));
    const wr = run(root, '099', planPath, '--write');
    assert.equal(wr.code, 0, wr.out);
    assert.match(read(root, 'content/_original/099/1880-01-01-cover.md'), /%% 099\.0001 %%\n%% kind: cover %%\n%% [^\n]+RSR: Cover text[^\n]+%%\n# Couverture\nJournal\. Livre 99\./);
    assert.deepEqual(fs.readdirSync(path.join(root, 'content/cz/099')).sort(), ['1880-01-01-cover.md', '1880-01-01.md', '1880-01-03.md']);
    const redirects = JSON.parse(read(root, 'content/_renumber/redirects.json'));
    assert.equal(redirects['/cz/099/1880-01-02'], '/cz/099/1880-01-03/');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

const ORIG_098 = `---
date: 1879-12-30
entry_id: 1879-12-30
carnet: "098"
location: Paris
para_start: 1
para_end: 3
---
%% 098.0001 %%
# Mardi 30 décembre 1879
Fin du livre précédent.

%% 098.0002 %%
Encore une ligne[^9].

[^9]: Note nine, used by 098.0002 and 098.0003.

%% 098.0003 %%
Ceci appartient au livre suivant[^9].

%% 2026-01-03T10:00:00 CON: APPROVED — entry 1879-12-30 %%
`;

const ORIG_098_B = `---
date: 1879-12-31
entry_id: 1879-12-31
carnet: "098"
location: Paris
para_start: 4
para_end: 4
---
%% 098.0004 %%
# Mercredi 31 décembre 1879
Un jour entier mal classé.
`;

const CZ_098 = `---
date: 1879-12-30
carnet: "098"
translation_complete: true
editor_approved: true
conductor_approved: true
---

%% 098.0001 %%
# Úterý 30. prosince 1879
%% Fin du livre précédent. %%
Konec předchozí knihy.

%% 098.0002 %%
%% Encore une ligne. %%
Ještě řádek[^098.2.1].

[^098.2.1]: Pozn.

%% 098.0003 %%
%% Ceci appartient au livre suivant. %%
Tohle patří do další knihy.
`;

const CZ_098_B = `---
date: 1879-12-31
carnet: "098"
translation_complete: true
editor_approved: true
conductor_approved: true
---

%% 098.0004 %%
# Středa 31. prosince 1879
%% Un jour entier mal classé. %%
Celý den zařazený jinam.
`;

test('multi-carnet run: clusters move between carnets in every tree, one pass renumbers both', () => {
  const root = makeRepo();
  const w = (rel: string, text: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  try {
    w('content/_original/098/1879-12-30.md', ORIG_098);
    w('content/_original/098/1879-12-31.md', ORIG_098_B);
    w('content/cz/098/1879-12-30.md', CZ_098);
    w('content/cz/098/1879-12-31.md', CZ_098_B);
    w('content/_original/_glossary/people/X.md', 'See 098.0003, 098.0004, 099.0001 and [it](/cz/098/1879-12-31/#p-098-0004).\n');

    const p098: Plan = { carnet: '098', entries: [{ file: '1879-12-30.md', date: '1879-12-30', paragraphs: [{ old: '098.0001' }, { old: '098.0002' }] }] };
    const p099: Plan = {
      carnet: '099',
      entries: [
        { file: '1879-12-31.md', date: '1879-12-31', paragraphs: [{ old: '098.0004' }] },
        { file: '1880-01-01.md', date: '1880-01-01', paragraphs: [{ old: '098.0003' }, { old: '099.0001' }, { old: '099.0002' }, { old: '099.0003' }] },
        { file: '1880-01-02.md', date: '1880-01-02', paragraphs: [{ old: '099.0004' }, { old: '099.0005' }] },
      ],
    };
    const a = path.join(root, 'p098.json'), b = path.join(root, 'p099.json');
    fs.writeFileSync(a, JSON.stringify(p098));
    fs.writeFileSync(b, JSON.stringify(p099));

    // a paragraph placed twice across the run is refused
    const dup: Plan = JSON.parse(JSON.stringify(p098));
    dup.entries[0].paragraphs.push({ old: '098.0004' });
    fs.writeFileSync(path.join(root, 'dup.json'), JSON.stringify(dup));
    const bad = run(root, '--multi', path.join(root, 'dup.json'), b);
    assert.equal(bad.code, 1);
    assert.match(bad.out, /098\.0004 is placed or dropped 2 times/);

    const wr = run(root, '--multi', a, b, '--write');
    assert.equal(wr.code, 0, wr.out);
    assert.match(wr.out, /renumber-check 098[\s\S]*RESULT: PASS[\s\S]*renumber-check 099[\s\S]*RESULT: PASS/);

    // 098 keeps two paragraphs; its entry keeps the CON note and the footnote 098.0002 still needs
    const o98 = read(root, 'content/_original/098/1879-12-30.md');
    assert.match(o98, /%% 098\.0002 %%\nEncore une ligne\[\^9\]\.\n\n\[\^9\]: Note nine/);
    assert.match(o98, /CON: APPROVED — entry 1879-12-30/);
    assert.doesNotMatch(o98, /098\.0003/);
    assert.ok(!fs.existsSync(path.join(root, 'content/_original/098/1879-12-31.md')));
    const c98 = read(root, 'content/cz/098/1879-12-30.md');
    assert.match(c98, /^conductor_approved: false$/m, 'the entry that lost a paragraph to 099 is reset');
    assert.match(c98, /\[\^098\.2\.1\]: Pozn\./);

    // 099: the moved paragraphs come first, renumbered in 099; the moved one took its footnote along
    const o99a = read(root, 'content/_original/099/1879-12-31.md');
    assert.match(o99a, /^carnet: "099"$/m);
    assert.match(o99a, /%% 099\.0001 %%\n# Mercredi 31 décembre 1879/);
    const o99b = read(root, 'content/_original/099/1880-01-01.md');
    assert.match(o99b, /%% 099\.0002 %%\nCeci appartient au livre suivant\[\^9\]\.[\s\S]*\[\^9\]: Note nine/);
    assert.match(o99b, /%% 099\.0003 %%\n%% \[#Paris\]/);
    const c99b = read(root, 'content/cz/099/1880-01-01.md');
    assert.match(c99b, /%% 099\.0002 %%\n%% Ceci appartient au livre suivant\. %%\nTohle patří do další knihy\./);
    const c99a = read(root, 'content/cz/099/1879-12-31.md');
    assert.match(c99a, /Celý den zařazený jinam\./);
    assert.match(c99a, /^conductor_approved: true$/m, 'a whole entry moved as is keeps its flags');
    assert.match(c99a, /^carnet: "099"$/m);

    // references: one pass across both carnets (098.0003→099.0002 is not re-mapped by 099's own map)
    assert.equal(read(root, 'content/_original/_glossary/people/X.md'), 'See 099.0002, 099.0001, 099.0003 and [it](/cz/099/1879-12-31/#p-099-0001).\n');

    // outputs: a map per carnet, one SQL, cross-carnet redirect
    const files = fs.readdirSync(path.join(root, 'content/_renumber'));
    const m98 = JSON.parse(read(root, `content/_renumber/${files.find((f) => /^098-.*\.json$/.test(f))}`));
    assert.deepEqual(m98.moved_out, { '098.0003': '099.0002', '098.0004': '099.0001' });
    assert.equal(m98.id_map['098.0004'], '099.0001');
    const m99 = JSON.parse(read(root, `content/_renumber/${files.find((f) => /^099-.*\.json$/.test(f))}`));
    assert.deepEqual(m99.moved_in, { '098.0004': '099.0001', '098.0003': '099.0002' });
    const sql = read(root, `content/_renumber/${files.find((f) => /^098\+099-.*\.sql$/.test(f))}`);
    assert.match(sql, /\('098\.0003', '099\.0002'\)/);
    assert.match(sql, /\('099\.0001', '099\.0003'\)/);
    assert.equal((sql.match(/UPDATE paragraph_reports/g) ?? []).length, 1);
    const redirects = JSON.parse(read(root, 'content/_renumber/redirects.json'));
    assert.equal(redirects['/cz/098/1879-12-31'], '/cz/099/1879-12-31/');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
