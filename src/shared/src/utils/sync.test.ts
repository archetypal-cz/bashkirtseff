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

// --- footnote propagation ---------------------------------------------------

const ORIGINAL_FN = [
  '---',
  'date: 1873-01-20',
  'carnet: "001"',
  '---',
  '%% 001.0030 %%',
  'Au cercle Masséna[^3], énormément de monde. Maman a dansé[^4].',
  '',
  '%% 001.0031 %%',
  'Le soir, au Français[^5].',
  '',
  '%% 001.0032 %%',
  'Boreel s\'est approché de moi.',
  '',
  '[^3]: Cercle Masséna, a private club in Nice.',
  '[^4]: Marie\'s mother, Maria Stepanovna.',
  '[^5]: Théâtre Français de Nice.',
  '',
].join('\n');

function footnoteFixture(translationBody: string): Fixture {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bashk-sync-fn-'));
  const originalDir = path.join(dir, 'content', '_original', '001');
  const translationDir = path.join(dir, 'content', 'cz', '001');
  fs.mkdirSync(originalDir, { recursive: true });
  fs.mkdirSync(translationDir, { recursive: true });
  const originalPath = path.join(originalDir, '1873-01-20.md');
  const translationPath = path.join(translationDir, '1873-01-20.md');
  fs.writeFileSync(originalPath, ORIGINAL_FN, 'utf-8');
  fs.writeFileSync(translationPath, translationBody, 'utf-8');
  return { originalPath, translationPath, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('renumbered footnotes are recognised as present and not re-added', () => {
  // cz renumbers: source [^3]/[^4] are [^01.30.1]/[^01.30.2], source [^5] is [^01.31.1].
  const f = footnoteFixture([
    '---',
    'date: 1873-01-20',
    'carnet: "001"',
    '---',
    '%% 001.0030 %%',
    'V klubu Masséna[^01.30.1] spousta lidí. Maman tančila[^01.30.2].',
    '',
    '%% 001.0031 %%',
    'Večer ve Français[^01.31.1].',
    '',
    '%% 001.0032 %%',
    'Boreel se ke mně přiblížil.',
    '',
    '[^01.30.1]: Cercle Masséna, soukromý klub v Nice.',
    '[^01.30.2]: Mariina matka, Maria Stěpanovna.',
    '[^01.31.1]: Théâtre Français v Nice.',
    '',
  ].join('\n'));
  try {
    const sync = new EntrySync();
    const before = fs.readFileSync(f.translationPath, 'utf-8');
    const result = sync.syncEntryFile(f.originalPath, f.translationPath, createDefaultSyncOptions());
    assert.equal(result.error, undefined);
    assert.deepEqual(result.changes.filter(c => c.type.startsWith('footnote')), []);
    assert.deepEqual(result.warnings, []);
    assert.equal(result.written, false);
    assert.equal(fs.readFileSync(f.translationPath, 'utf-8'), before);
  } finally {
    f.cleanup();
  }
});

test('a paragraph with fewer markers than the source is skipped with a warning, never guessed', () => {
  const f = footnoteFixture([
    '---',
    'date: 1873-01-20',
    'carnet: "001"',
    '---',
    '%% 001.0030 %%',
    'V klubu Masséna[^1] spousta lidí. Maman tančila.',
    '',
    '%% 001.0031 %%',
    'Večer ve Français.',
    '',
    '%% 001.0032 %%',
    'TODO',
    '',
    '[^1]: Cercle Masséna, soukromý klub v Nice.',
    '',
  ].join('\n'));
  try {
    const sync = new EntrySync();
    const result = sync.syncEntryFile(f.originalPath, f.translationPath, createDefaultSyncOptions());
    assert.equal(result.error, undefined);

    // 001.0030: one marker vs two in source — ambiguous, nothing added.
    assert.ok(result.warnings.some(w => w.includes('[^3]') && w.includes('001.0030')), result.warnings.join('\n'));
    assert.ok(result.warnings.some(w => w.includes('[^4]') && w.includes('001.0030')), result.warnings.join('\n'));
    // 001.0031: translated, no marker at all — the only safe case, [^5] is appended.
    const out = fs.readFileSync(f.translationPath, 'utf-8');
    assert.match(out, /^Večer ve Français\.\[\^5\]$/m);
    assert.match(out, /^\[\^5\]: Théâtre Français de Nice\.$/m);
    assert.doesNotMatch(out, /^\[\^3\]:/m);
    assert.doesNotMatch(out, /^\[\^4\]:/m);
    assert.doesNotMatch(out, /Maman tančila\.\[\^/);
    // The translated definition under the translation's own id is untouched.
    assert.match(out, /^\[\^1\]: Cercle Masséna, soukromý klub v Nice\.$/m);
    assert.deepEqual(
      result.changes.filter(c => c.type.startsWith('footnote')).map(c => c.type),
      ['footnote_added', 'footnote_ref_added']
    );
  } finally {
    f.cleanup();
  }
});

test('a definition matching the source text under another id counts as present', () => {
  const f = footnoteFixture([
    '---',
    'date: 1873-01-20',
    'carnet: "001"',
    '---',
    '%% 001.0030 %%',
    'V klubu Masséna[^a] spousta lidí. Maman tančila[^b].',
    '',
    '%% 001.0031 %%',
    'Večer ve Français.',
    '',
    '%% 001.0032 %%',
    'Boreel se ke mně přiblížil.',
    '',
    '[^a]: Cercle Masséna, soukromý klub v Nice.',
    '[^b]: Mariina matka.',
    '[^c]: *Théâtre Français de Nice.*',
    '',
  ].join('\n'));
  try {
    const sync = new EntrySync();
    const result = sync.syncEntryFile(f.originalPath, f.translationPath, createDefaultSyncOptions());
    assert.equal(result.error, undefined);
    // [^5]'s text already exists as [^c] (emphasis aside): not re-added, no marker appended.
    assert.deepEqual(result.changes.filter(c => c.type.startsWith('footnote')), []);
    assert.doesNotMatch(fs.readFileSync(f.translationPath, 'utf-8'), /\[\^5\]/);
  } finally {
    f.cleanup();
  }
});
