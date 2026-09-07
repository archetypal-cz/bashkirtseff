import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createDiaryEntry, createParagraph } from '../models/index.js';
import { scanMarkerStructure } from '../parser/comment-scanner.js';
import { ParagraphRenderer, renderSourceComment } from './paragraph-renderer.js';

test('renderSourceComment wraps every physical source line in its own %% block', () => {
  assert.deepEqual(renderSourceComment('Une seule ligne.'), ['%% Une seule ligne. %%']);
  assert.deepEqual(
    renderSourceComment('Première ligne.\nDeuxième ligne.\n\n  Troisième ligne.  '),
    ['%% Première ligne. %%', '%% Deuxième ligne. %%', '%% Troisième ligne. %%']
  );
});

test('a multi-line French paragraph renders as one block per line in a translation file', () => {
  // The 2026-09-06 `just sync` corruption: a single `%% … %%` pair around a
  // multi-line originalText leaves the first line unclosed, and the frontend then
  // shows the continuation lines as translated text.
  const entry = createDiaryEntry('/tmp/x/content/cz/011/1873-10-21.md', '1873-10-21', 'cz');
  const para = createParagraph('011.0168', '011', 168);
  para.originalText = 'On dîne déjà et nous recevons un scolding de maman.\nJe ne sais plus comment mais Neptune est en colère.\nPaul s\'en va barbotant comme un domestique.';
  para.translatedText = 'Už večeříme a dostáváme od maman vyhubováno.';
  entry.paragraphs.push(para);

  const out = new ParagraphRenderer().renderTranslationEntry(entry);
  const lines = out.split('\n');
  assert.deepEqual(lines.slice(0, 5), [
    '%% 011.0168 %%',
    '%% On dîne déjà et nous recevons un scolding de maman. %%',
    '%% Je ne sais plus comment mais Neptune est en colère. %%',
    '%% Paul s\'en va barbotant comme un domestique. %%',
    'Už večeříme a dostáváme od maman vyhubováno.',
  ]);
  assert.deepEqual(scanMarkerStructure(lines, { allowTrailingCloser: false, allowMultiLineBlocks: false }), []);
});
