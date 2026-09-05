import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { mergeGlossaryEntries } from './glossary-merge.js';

const ORIGINAL_ENTRY = `---
date: 1873-01-11
people:
  - SOURCE
---

%% 001.0001 %%
%% [#Source](../_glossary/people/core/SOURCE.md) %%
Text.
`;

const UK_ENTRY = `%% 001.0001 %%
%% [#Source](../../_original/_glossary/people/core/SOURCE.md) %%
Text.
`;

const CROSS_REFERENCE = `# Other

See [#Source](../core/SOURCE.md).
`;

/** A minimal content/ tree with one entry per language and two glossary entries. */
function makeRepo(): string {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'glossary-merge-'));
  const glossary = path.join(base, 'content/_original/_glossary');

  fs.mkdirSync(path.join(glossary, 'people/core'), { recursive: true });
  fs.mkdirSync(path.join(glossary, 'people/mentioned'), { recursive: true });
  fs.mkdirSync(path.join(base, 'content/_original/001'), { recursive: true });
  fs.mkdirSync(path.join(base, 'content/uk/001'), { recursive: true });

  fs.writeFileSync(path.join(glossary, 'people/core/SOURCE.md'), '---\nid: SOURCE\n---\n\nSource body.\n');
  fs.writeFileSync(path.join(glossary, 'people/core/TARGET.md'), '---\nid: TARGET\n---\n\nTarget body.\n');
  fs.writeFileSync(path.join(glossary, 'people/mentioned/OTHER.md'), CROSS_REFERENCE);
  fs.writeFileSync(path.join(base, 'content/_original/001/1873-01-11.md'), ORIGINAL_ENTRY);
  fs.writeFileSync(path.join(base, 'content/uk/001/1873-01-11.md'), UK_ENTRY);

  return base;
}

test('merge rewrites links in every tree and in the glossary itself', async () => {
  const base = makeRepo();
  try {
    const result = await mergeGlossaryEntries(base, 'SOURCE', 'TARGET', { deleteSource: true });

    assert.deepEqual(result.errors, []);

    const original = fs.readFileSync(path.join(base, 'content/_original/001/1873-01-11.md'), 'utf-8');
    assert.match(original, /\[#TARGET\]\(\.\.\/_glossary\/people\/core\/TARGET\.md\)/);
    assert.match(original, /^ {2}- TARGET$/m);

    const uk = fs.readFileSync(path.join(base, 'content/uk/001/1873-01-11.md'), 'utf-8');
    assert.match(uk, /\[#TARGET\]\(\.\.\/\.\.\/_original\/_glossary\/people\/core\/TARGET\.md\)/);

    const other = fs.readFileSync(
      path.join(base, 'content/_original/_glossary/people/mentioned/OTHER.md'),
      'utf-8'
    );
    assert.match(other, /\[#TARGET\]\(\.\.\/core\/TARGET\.md\)/);

    assert.equal(result.linksUpdated, 3);
    assert.equal(result.frontmatterUpdated, 1);
    assert.equal(result.sourceDeleted, true);
    assert.equal(
      fs.existsSync(path.join(base, 'content/_original/_glossary/people/core/SOURCE.md')),
      false
    );
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('a cross-category merge rebases the source body\'s own links', async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'glossary-merge-'));
  try {
    const glossary = path.join(base, 'content/_original/_glossary');
    fs.mkdirSync(path.join(glossary, 'people/core'), { recursive: true });
    fs.mkdirSync(path.join(glossary, 'people/family'), { recursive: true });
    fs.mkdirSync(path.join(glossary, 'places/cities'), { recursive: true });

    // The source's link is relative to its own directory: `../core/X.md` only
    // reaches X from under people/, never from under places/.
    fs.writeFileSync(path.join(glossary, 'people/core/X.md'), '---\nid: X\n---\n\nX body.\n');
    fs.writeFileSync(
      path.join(glossary, 'people/family/SOURCE.md'),
      '---\nid: SOURCE\n---\n\nSource body, see [#X](../core/X.md).\n'
    );
    fs.writeFileSync(
      path.join(glossary, 'places/cities/TARGET.md'),
      '---\nid: TARGET\n---\n\nTarget body.\n'
    );

    const result = await mergeGlossaryEntries(base, 'SOURCE', 'TARGET', { deleteSource: true });
    assert.deepEqual(result.errors, []);
    assert.equal(result.glossaryMerged, true);

    const targetPath = path.join(glossary, 'places/cities/TARGET.md');
    const target = fs.readFileSync(targetPath, 'utf-8');

    const link = target.match(/\[#X\]\(([^)]+)\)/);
    assert.ok(link, `no link to X in merged target:\n${target}`);

    const resolved = path.resolve(path.dirname(targetPath), link[1]);
    assert.equal(resolved, path.join(glossary, 'people/core/X.md'));
    assert.equal(fs.existsSync(resolved), true);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('one unreadable file aborts the whole batch before anything is written', async () => {
  const base = makeRepo();
  try {
    // A directory named like an entry: reading it throws, the way an unreadable file would.
    fs.mkdirSync(path.join(base, 'content/uk/001/1873-01-12.md'));

    const before = new Map<string, string>();
    for (const rel of [
      'content/_original/001/1873-01-11.md',
      'content/uk/001/1873-01-11.md',
      'content/_original/_glossary/people/mentioned/OTHER.md',
      'content/_original/_glossary/people/core/TARGET.md',
    ]) {
      before.set(rel, fs.readFileSync(path.join(base, rel), 'utf-8'));
    }

    const result = await mergeGlossaryEntries(base, 'SOURCE', 'TARGET', { deleteSource: true });

    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0], /Cannot read .*1873-01-12\.md/);
    assert.equal(result.filesUpdated, 0);
    assert.equal(result.sourceDeleted, false);
    assert.equal(
      fs.existsSync(path.join(base, 'content/_original/_glossary/people/core/SOURCE.md')),
      true
    );

    for (const [rel, content] of before) {
      assert.equal(fs.readFileSync(path.join(base, rel), 'utf-8'), content, `${rel} was written`);
    }
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});
