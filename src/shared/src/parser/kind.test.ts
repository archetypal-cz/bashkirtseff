// Paragraph kind marker (`%% kind: clipping source="…" %%`) through parser,
// scaffold and sync. Convention: docs/REBUILD_CARNET.md, "Paragraph kinds".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { ParagraphParser } from './paragraph-parser.js';
import { parseKindMarker, formatKindMarker } from './patterns.js';
import { TranslationScaffold, createDefaultScaffoldOptions } from '../utils/scaffold.js';
import { EntrySync, createDefaultSyncOptions } from '../utils/sync.js';

const ORIGINAL = [
  '---',
  'date: 1877-02-12',
  'carnet: "068"',
  '---',
  '%% 068.0001 %%',
  '# Lundi 12 février 1877',
  'Je colle ici l\'article.',
  '',
  '%% 068.0002 %%',
  '%% kind: clipping source="Le Figaro, 12 février 1877" %%',
  '%% [#Le_Figaro](../_glossary/culture/newspapers/LE_FIGARO.md) %%',
  '%% 2026-09-27T10:00:00 RSR: Clipping pasted on the page; tome09.docx ¶12. %%',
  '> Hier soir, à l\'Opéra, on remarquait',
  '> Mlle Marie Bashkirtseff.',
  '',
].join('\n');

function tmp(files: Record<string, string>): { dir: string; p: (rel: string) => string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bashk-kind-'));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text, 'utf-8');
  }
  return { dir, p: (rel) => path.join(dir, rel) };
}

test('kind marker parses and formats; raye is read as rayé', () => {
  assert.deepEqual(parseKindMarker('kind: clipping source="Le Figaro, 12 février 1877"'), { kind: 'clipping', source: 'Le Figaro, 12 février 1877' });
  assert.deepEqual(parseKindMarker('kind: raye'), { kind: 'rayé' });
  assert.equal(parseKindMarker('kind: poster'), null);
  assert.equal(formatKindMarker('letter', 'Lettre de Multedo'), '%% kind: letter source="Lettre de Multedo" %%');
});

test('the parser sets kind and never mistakes the marker for embedded French or a note', () => {
  const t = tmp({
    'content/_original/068/1877-02-12.md': ORIGINAL,
    'content/cz/068/1877-02-12.md': [
      '%% 068.0002 %%',
      '%% kind: clipping source="Le Figaro, 12 février 1877" %%',
      "%% > Hier soir, à l'Opéra, on remarquait %%",
      '%% > Mlle Marie Bashkirtseff. %%',
      '> Včera večer v Opeře bylo lze spatřit',
      '> slečnu Marii Baškirtsevovou.',
      '',
    ].join('\n'),
  });
  try {
    const parser = new ParagraphParser();
    const o = parser.parseFile(t.p('content/_original/068/1877-02-12.md'));
    const clip = o.paragraphs.find((p) => p.id === '068.0002')!;
    assert.equal(clip.kind, 'clipping');
    assert.equal(clip.kindSource, 'Le Figaro, 12 février 1877');
    assert.equal(clip.notes.length, 1);
    assert.match(clip.originalText!, /^> Hier soir/);
    assert.equal(o.paragraphs.find((p) => p.id === '068.0001')!.kind, undefined);

    const c = parser.parseFile(t.p('content/cz/068/1877-02-12.md'));
    const cp = c.paragraphs[0];
    assert.equal(cp.kind, 'clipping');
    assert.equal(cp.originalText, "> Hier soir, à l'Opéra, on remarquait\n> Mlle Marie Bashkirtseff.");
    assert.match(cp.translatedText!, /^> Včera večer/);
  } finally {
    fs.rmSync(t.dir, { recursive: true, force: true });
  }
});

test('scaffold puts the kind marker under the ID of a new translation cluster', () => {
  const t = tmp({ 'content/_original/068/1877-02-12.md': ORIGINAL });
  try {
    const scaffold = new TranslationScaffold();
    const res = scaffold.scaffoldEntryFile(
      t.p('content/_original/068/1877-02-12.md'),
      t.p('content/uk/068/1877-02-12.md'),
      { ...createDefaultScaffoldOptions(), targetLanguage: 'uk' },
    );
    assert.equal(res.created, true, res.reason);
    const out = fs.readFileSync(t.p('content/uk/068/1877-02-12.md'), 'utf-8');
    assert.match(out, /%% 068\.0002 %%\n%% kind: clipping source="Le Figaro, 12 février 1877" %%\n%% > Hier soir/);
    assert.equal((out.match(/kind: clipping/g) ?? []).length, 1);
  } finally {
    fs.rmSync(t.dir, { recursive: true, force: true });
  }
});

test('sync adds a kind marker the translation lacks and keeps its blockquote', () => {
  const t = tmp({
    'content/_original/068/1877-02-12.md': ORIGINAL,
    'content/en/068/1877-02-12.md': [
      '%% 068.0001 %%',
      '# Monday, 12 February 1877',
      "%% Je colle ici l'article. %%",
      'I paste the article here.',
      '',
      '%% 068.0002 %%',
      "%% > Hier soir, à l'Opéra, on remarquait %%",
      '%% > Mlle Marie Bashkirtseff. %%',
      '> Last night at the Opera one noticed',
      '> Mlle Marie Bashkirtseff.',
      '',
    ].join('\n'),
  });
  try {
    const sync = new EntrySync();
    const r = sync.syncEntryFile(t.p('content/_original/068/1877-02-12.md'), t.p('content/en/068/1877-02-12.md'), createDefaultSyncOptions());
    assert.equal(r.error, undefined);
    assert.ok(r.changes.some((ch) => ch.type === 'kind_updated'));
    const out = fs.readFileSync(t.p('content/en/068/1877-02-12.md'), 'utf-8');
    assert.match(out, /%% 068\.0002 %%\n%% kind: clipping source="Le Figaro, 12 février 1877" %%\n/);
    assert.match(out, /> Last night at the Opera one noticed\n> Mlle Marie Bashkirtseff\./);
    // idempotent
    const again = sync.syncEntryFile(t.p('content/_original/068/1877-02-12.md'), t.p('content/en/068/1877-02-12.md'), createDefaultSyncOptions());
    assert.deepEqual(again.changes.filter((ch) => ch.type === 'kind_updated'), []);
  } finally {
    fs.rmSync(t.dir, { recursive: true, force: true });
  }
});
