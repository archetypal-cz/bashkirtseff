import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scanMarkerStructure } from './comment-scanner.js';

const TRANSLATION = { allowTrailingCloser: false };
const SOURCE = { allowTrailingCloser: true };

test('two complete comments on one line are accepted', () => {
  const lines = [
    '%% 011.0152 %%',
    '%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %% %% 2026-01-02T10:00:00 LAN: register note %%',
    'Il fait un temps superbe.',
  ];
  assert.deepEqual(scanMarkerStructure(lines, TRANSLATION), []);
});

test('a literal %% quoted inside a wrapped comment is accepted', () => {
  const lines = ['%% 2026-01-02T10:00:00 RED: the stray %% marker was removed here %%'];
  assert.deepEqual(scanMarkerStructure(lines, TRANSLATION), []);
  assert.deepEqual(scanMarkerStructure(lines, SOURCE), []);
});

test('a complete comment followed by prose on the same line is a splice', () => {
  const lines = ['%% 2026-01-02T10:00:00 TR: note %% Samedi 11 janvier 1873.'];
  assert.deepEqual(scanMarkerStructure(lines, TRANSLATION), [
    { line: 1, kind: 'splice', text: lines[0] },
  ]);
  assert.deepEqual(scanMarkerStructure(lines, SOURCE), [
    { line: 1, kind: 'splice', text: lines[0] },
  ]);
});

test('a block left open at EOF is reported at its opening line', () => {
  const lines = ['%% 001.0001 %%', 'Texte.', '%% 2026-01-02T10:00:00 RSR: first', 'second line of the note'];
  assert.deepEqual(scanMarkerStructure(lines, TRANSLATION), [
    { line: 3, kind: 'unclosed-block', text: '%% 2026-01-02T10:00:00 RSR: first' },
  ]);
});

test('a block closed by a later line ending in %% is accepted', () => {
  const lines = ['%% 2026-01-02T10:00:00 RSR: first', 'second line of the note %%', 'Texte.'];
  assert.deepEqual(scanMarkerStructure(lines, TRANSLATION), []);
});

test('a bare line ending in %% fails outside fr/_original', () => {
  const lines = ['Il fait un temps superbe. %%'];
  assert.deepEqual(scanMarkerStructure(lines, TRANSLATION), [
    { line: 1, kind: 'closer-without-opener', text: lines[0] },
  ]);
  assert.deepEqual(scanMarkerStructure(lines, SOURCE), []);
});
