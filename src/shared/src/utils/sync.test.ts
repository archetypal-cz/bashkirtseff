import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { EntrySync, createDefaultSyncOptions } from './sync.js';
import { localizeGlossaryPath } from './glossary-path.js';

const ORIGINAL = [
  '---',
  'date: 1876-07-08',
  'carnet: "063"',
  '---',
  '%% 063.0001 %%',
  '%% [#Nice](../_glossary/places/cities/NICE.md) %%',
  '%% 2026-01-01T10:00:00 LAN: period vocabulary %%',
  "Hier a deux heures j'ai quitte Nice.",
  '',
].join('\n');

interface Fixture {
  originalPath: string;
  translationPath: string;
  cleanup: () => void;
}

function fixture(translationBody: string | null): Fixture {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bashk-sync-'));
  const originalDir = path.join(dir, 'content', '_original', '063');
  const translationDir = path.join(dir, 'content', 'uk', '063');
  fs.mkdirSync(originalDir, { recursive: true });
  fs.mkdirSync(translationDir, { recursive: true });

  const originalPath = path.join(originalDir, '1876-07-08.md');
  const translationPath = path.join(translationDir, '1876-07-08.md');
  fs.writeFileSync(originalPath, ORIGINAL, 'utf-8');
  if (translationBody !== null) {
    fs.writeFileSync(translationPath, translationBody, 'utf-8');
  }

  return {
    originalPath,
    translationPath,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

test('localizeGlossaryPath maps between the two link depths', () => {
  assert.equal(
    localizeGlossaryPath('../_glossary/places/cities/NICE.md', 'uk'),
    '../../_original/_glossary/places/cities/NICE.md'
  );
  assert.equal(
    localizeGlossaryPath('../../_original/_glossary/places/cities/NICE.md', 'uk'),
    '../../_original/_glossary/places/cities/NICE.md'
  );
  assert.equal(
    localizeGlossaryPath('../_glossary/places/cities/NICE.md', 'original'),
    '../_glossary/places/cities/NICE.md'
  );
  assert.equal(
    localizeGlossaryPath('../../_original/_glossary/places/cities/NICE.md', 'original'),
    '../_glossary/places/cities/NICE.md'
  );
});

test('a source glossary link lands in a uk entry at the translation depth', () => {
  const f = fixture(['%% 063.0001 %%', 'Wczoraj o drugiej.', ''].join('\n'));
  try {
    const sync = new EntrySync();
    sync.syncEntryFile(f.originalPath, f.translationPath, createDefaultSyncOptions());

    const written = fs.readFileSync(f.translationPath, 'utf-8');
    assert.match(written, /\[#Nice\]\(\.\.\/\.\.\/_original\/_glossary\/places\/cities\/NICE\.md\)/);
    assert.doesNotMatch(written, /\]\(\.\.\/_glossary\//);
  } finally {
    f.cleanup();
  }
});

test('an already localized glossary link produces no change', () => {
  const body = [
    '%% 063.0001 %%',
    '%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%',
    '%% 2026-01-01T10:00:00 LAN: period vocabulary %%',
    'Wczoraj o drugiej.',
    '',
  ].join('\n');

  const f = fixture(body);
  try {
    const sync = new EntrySync();
    const result = sync.syncEntryFile(f.originalPath, f.translationPath, createDefaultSyncOptions());

    assert.equal(result.error, undefined);
    assert.deepEqual(
      result.changes.filter((c) => c.type === 'glossary_updated'),
      []
    );
  } finally {
    f.cleanup();
  }
});

test('sync keeps the translation file frontmatter', () => {
  const body = [
    '---',
    'date: 1876-07-08',
    'translation_complete: true',
    'conductor_approved: true',
    '---',
    '%% 063.0001 %%',
    'Wczoraj o drugiej.',
    '',
  ].join('\n');

  const f = fixture(body);
  try {
    const sync = new EntrySync();
    sync.syncEntryFile(f.originalPath, f.translationPath, createDefaultSyncOptions());

    const written = fs.readFileSync(f.translationPath, 'utf-8');
    assert.ok(written.startsWith('---\n'));
    assert.match(written, /conductor_approved: true/);
  } finally {
    f.cleanup();
  }
});

test('a duplicate paragraph ID aborts the entry instead of writing', () => {
  const body = [
    '%% 063.0001 %%',
    'Wczoraj o drugiej.',
    '',
    '%% 063.0001 %%',
    'Powtorzony identyfikator.',
    '',
  ].join('\n');

  const f = fixture(body);
  try {
    const sync = new EntrySync();
    const result = sync.syncEntryFile(f.originalPath, f.translationPath, createDefaultSyncOptions());

    assert.match(result.error ?? '', /Duplicate paragraph ID 063\.0001/);
    assert.equal(result.written, false);
    assert.equal(fs.readFileSync(f.translationPath, 'utf-8'), body);
  } finally {
    f.cleanup();
  }
});

test('a dry run counts entries it would modify', () => {
  const f = fixture(['%% 063.0001 %%', 'Wczoraj o drugiej.', ''].join('\n'));
  try {
    const sync = new EntrySync();
    const result = sync.syncCarnet(
      path.dirname(f.originalPath),
      path.dirname(f.translationPath),
      { ...createDefaultSyncOptions(), dryRun: true }
    );

    assert.equal(result.entriesModified + result.entriesSkipped, result.entries.length);
    assert.equal(result.entriesModified, 1);
  } finally {
    f.cleanup();
  }
});
