import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { ParagraphParser } from './paragraph-parser.js';
import { parseFrontmatter } from './frontmatter.js';
import { ParagraphRenderer } from '../renderer/paragraph-renderer.js';
import { createDefaultRenderOptions } from '../renderer/paragraph-renderer.js';
import { EntrySync } from '../utils/sync.js';

const parser = new ParagraphParser();
const renderer = new ParagraphRenderer();

function withOriginalFile(body: string, run: (filePath: string) => void): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bashk-parser-'));
  const carnetDir = path.join(dir, 'content', '_original', '001');
  fs.mkdirSync(carnetDir, { recursive: true });
  const filePath = path.join(carnetDir, '1873-01-11.md');
  fs.writeFileSync(filePath, body, 'utf-8');
  try {
    run(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('two notes sharing one line parse as two notes and re-parse unchanged', () => {
  const body = [
    '%% 001.0001 %%',
    '%% 2026-01-01T10:00:00 RSR: first note %% %% 2026-01-01T11:00:00 LAN: second note %%',
    'Il fait un temps superbe.',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);
    assert.equal(entry.paragraphs.length, 1);

    const notes = entry.paragraphs[0].notes;
    assert.equal(notes.length, 2);
    assert.deepEqual(
      notes.map((n) => [n.role, n.content]),
      [
        ['RSR', 'first note'],
        ['LAN', 'second note'],
      ]
    );

    // Rendering splits them onto separate lines; that output must be stable.
    const rendered = renderer.renderOriginalEntry(entry);
    fs.writeFileSync(filePath, rendered, 'utf-8');
    const reparsed = parser.parseFile(filePath);
    assert.deepEqual(
      reparsed.paragraphs[0].notes.map((n) => [n.rawTimestamp, n.role, n.content]),
      notes.map((n) => [n.rawTimestamp, n.role, n.content])
    );
    assert.equal(renderer.renderOriginalEntry(reparsed), rendered);
  });
});

test('a note spanning three lines is one note and re-renders byte-identically', () => {
  const body = [
    '%% 001.0001 %%',
    '%% 2026-01-01T10:00:00 RSR: alpha',
    'beta',
    'gamma %%',
    'Il fait un temps superbe.',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);
    const notes = entry.paragraphs[0].notes;

    assert.equal(notes.length, 1);
    assert.equal(notes[0].role, 'RSR');
    assert.equal(notes[0].content, 'alpha\nbeta\ngamma');
    assert.equal(entry.paragraphs[0].originalText, 'Il fait un temps superbe.');
    assert.equal(renderer.renderOriginalEntry(entry), body.trimEnd());
  });
});

test('an unbalanced %% is reported as a warning', () => {
  const body = ['%% 001.0001 %%', '%% never closed', 'Il fait un temps superbe.', ''].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);
    assert.equal(entry.warnings.length, 1);
    assert.match(entry.warnings[0], /Unbalanced %%/);
  });
});

test('note timestamps are re-emitted verbatim', () => {
  const body = [
    '%% 001.0001 %%',
    '%% 2026-01-01T13:00:00 LAN: local time, no zone %%',
    '%% 2026-01-01T13:00:00+02:00 LAN: numeric offset %%',
    'Texte.',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);
    assert.deepEqual(
      entry.paragraphs[0].notes.map((n) => n.rawTimestamp),
      ['2026-01-01T13:00:00', '2026-01-01T13:00:00+02:00']
    );
    assert.equal(renderer.renderOriginalEntry(entry), body.trimEnd());
  });
});

test('rendered output keeps a glossary tag attached to its own paragraph', () => {
  const body = [
    '%% 001.0001 %%',
    'Premier paragraphe.',
    '',
    '%% 001.0002 %%',
    '%% [#Nice](../_glossary/places/cities/NICE.md) %%',
    'Second paragraphe.',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);
    const rendered = renderer.renderEntry(entry, createDefaultRenderOptions());

    fs.writeFileSync(filePath, rendered, 'utf-8');
    const reparsed = parser.parseFile(filePath);

    assert.deepEqual(
      reparsed.paragraphs.map((p) => p.glossaryLinks.map((l) => l.displayText)),
      [[], ['Nice']]
    );
  });
});

test('legacy [//] paragraph IDs parse and re-render in legacy style', () => {
  const body = [
    '[//]: # ( 10.802 )',
    'Premier paragraphe.',
    '',
    '[//]: # ( 10.803 )',
    'Second paragraphe.',
    '',
    '[//]: # ( 10.804 )',
    'Troisieme paragraphe.',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);

    assert.equal(entry.idStyle, 'legacy');
    assert.deepEqual(
      entry.paragraphs.map((p) => p.id),
      ['10.802', '10.803', '10.804']
    );

    const rendered = renderer.renderOriginalEntry(entry);
    assert.match(rendered, /^\[\/\/\]: # \(10\.802\)$/m);
    assert.doesNotMatch(rendered, /%% 10\.802 %%/);
  });
});

test('footnote continuation lines join their definition and duplicates warn', () => {
  const body = [
    '%% 001.0001 %%',
    'Texte[^1][^2].',
    '',
    '[^1]: First line',
    '    continued here',
    '[^2]: Other note',
    '[^1]: A second definition',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);

    assert.equal(entry.footnotes['1'], 'First line\ncontinued here');
    assert.equal(entry.footnotes['2'], 'Other note');
    assert.equal(entry.paragraphs[0].originalText, 'Texte[^1][^2].');
    assert.ok(entry.warnings.some((w) => /Duplicate footnote definition \[\^1\]/.test(w)));

    // The continuation must be re-emitted indented, or the reparse orphans it
    const rendered = renderer.renderOriginalEntry(entry);
    assert.match(rendered, /^\[\^1\]: First line\n {4}continued here$/m);

    fs.writeFileSync(filePath, rendered, 'utf-8');
    const reparsed = parser.parseFile(filePath);
    assert.equal(reparsed.footnotes['1'], 'First line\ncontinued here');
    assert.equal(reparsed.footnotes['2'], 'Other note');
    assert.equal(renderer.renderOriginalEntry(reparsed), rendered);
  });
});

test('a literal %% inside a multi-line note does not truncate it', () => {
  const body = [
    '%% 001.0001 %%',
    '%% 2026-01-01T10:00:00 LAN: opening line',
    'the marker %% is literal here',
    'closing line %%',
    'Il fait un temps superbe.',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);

    const notes = entry.paragraphs[0].notes;
    assert.equal(notes.length, 1);
    assert.equal(notes[0].role, 'LAN');
    assert.equal(
      notes[0].content,
      'opening line\nthe marker %% is literal here\nclosing line'
    );
    assert.equal(entry.paragraphs[0].originalText, 'Il fait un temps superbe.');
  });
});

test('cloning an entry preserves its paragraph ID notation', () => {
  const body = [
    '[//]: # (10.802)',
    'Texte legacy.',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);
    assert.equal(entry.idStyle, 'legacy');

    // cloneEntry is private; sync round-trips every entry through it
    const clone = new EntrySync()['cloneEntry'](entry);
    assert.equal(clone.idStyle, 'legacy');
    assert.match(renderer.renderOriginalEntry(clone), /^\[\/\/\]: # \(10\.802\)$/m);
  });
});

test('header paragraphs keep their tags and notes through a render', () => {
  const body = [
    '%% 001.0001 %%',
    '# Samedi 11 janvier 1873',
    '%% [#Nice](../_glossary/places/cities/NICE.md) %%',
    '%% 2026-01-01T10:00:00 RSR: heading note %%',
    '',
  ].join('\n');

  withOriginalFile(body, (filePath) => {
    const entry = parser.parseFile(filePath);
    assert.equal(entry.paragraphs[0].isHeader, true);

    const rendered = renderer.renderOriginalEntry(entry);
    assert.match(rendered, /\[#Nice\]/);
    assert.match(rendered, /RSR: heading note/);
  });
});

test('frontmatter tolerates CRLF and reports unusable YAML', () => {
  const crlf = parseFrontmatter('---\r\ndate: 1873-01-11\r\n---\r\nBody line\r\n');
  assert.equal(crlf.metadata.date, '1873-01-11');
  assert.equal(crlf.content, 'Body line\r\n');
  assert.equal(crlf.error, undefined);

  const sequence = parseFrontmatter('---\n- one\n- two\n---\nBody\n');
  assert.deepEqual(sequence.metadata, {});
  assert.match(sequence.error ?? '', /sequence/);

  const broken = parseFrontmatter('---\ndate: [unclosed\n---\nBody\n');
  assert.deepEqual(broken.metadata, {});
  assert.match(broken.error ?? '', /invalid YAML/);

  const none = parseFrontmatter('No frontmatter here\n');
  assert.equal(none.raw, '');
  assert.equal(none.error, undefined);
});
