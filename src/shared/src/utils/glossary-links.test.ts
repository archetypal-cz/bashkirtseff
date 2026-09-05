import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { resolveGlossaryLink, glossaryLinkFrom, rewriteGlossaryLinks } from './glossary-links.js';

const BASE = '/repo';
const GLOSSARY = path.join(BASE, 'content/_original/_glossary');
const ENTRY = path.join(GLOSSARY, 'people/core/X.md');
const MOVED = path.join(GLOSSARY, 'people/family/X.md');

const ORIGINAL_DIR = path.join(BASE, 'content/_original/001');
const UK_DIR = path.join(BASE, 'content/uk/001');
const GLOSSARY_DIR = path.join(GLOSSARY, 'places/cities');

test('links from every tree resolve to the same glossary entry', () => {
  assert.equal(resolveGlossaryLink(ORIGINAL_DIR, '../_glossary/people/core/X.md', GLOSSARY), ENTRY);
  assert.equal(
    resolveGlossaryLink(UK_DIR, '../../_original/_glossary/people/core/X.md', GLOSSARY),
    ENTRY
  );
  assert.equal(resolveGlossaryLink(GLOSSARY_DIR, '../../people/core/X.md', GLOSSARY), ENTRY);
});

test('links that leave the glossary are not glossary links', () => {
  assert.equal(resolveGlossaryLink(ORIGINAL_DIR, './1873-01-11.md', GLOSSARY), null);
  assert.equal(resolveGlossaryLink(ORIGINAL_DIR, '../../../README.md', GLOSSARY), null);
  assert.equal(resolveGlossaryLink(ORIGINAL_DIR, 'https://example.com/x.md', GLOSSARY), null);
});

test('a moved entry gets the right relative link back in each tree', () => {
  assert.equal(glossaryLinkFrom(ORIGINAL_DIR, MOVED), '../_glossary/people/family/X.md');
  assert.equal(glossaryLinkFrom(UK_DIR, MOVED), '../../_original/_glossary/people/family/X.md');
  assert.equal(glossaryLinkFrom(GLOSSARY_DIR, MOVED), '../../people/family/X.md');
});

test('rewriteGlossaryLinks repoints links from any tree', () => {
  const toMoved = (target: string) => (target === ENTRY ? { path: MOVED } : null);

  const uk = rewriteGlossaryLinks(
    'text [#X](../../_original/_glossary/people/core/X.md) more',
    UK_DIR,
    GLOSSARY,
    toMoved
  );
  assert.equal(uk.count, 1);
  assert.equal(uk.content, 'text [#X](../../_original/_glossary/people/family/X.md) more');

  const glossary = rewriteGlossaryLinks(
    '%% [#X](../../people/core/X.md) %%',
    GLOSSARY_DIR,
    GLOSSARY,
    toMoved
  );
  assert.equal(glossary.count, 1);
  assert.equal(glossary.content, '%% [#X](../../people/family/X.md) %%');

  const untouched = rewriteGlossaryLinks(
    '[#Y](../_glossary/people/core/Y.md)',
    ORIGINAL_DIR,
    GLOSSARY,
    toMoved
  );
  assert.equal(untouched.count, 0);
});

test('display text is replaced only when the caller asks for it', () => {
  const result = rewriteGlossaryLinks(
    '[#Old_Name](../_glossary/people/core/X.md) and [Old_Name](../_glossary/people/core/X.md)',
    ORIGINAL_DIR,
    GLOSSARY,
    (target, displayText) =>
      target === ENTRY
        ? { path: ENTRY, displayText: displayText.startsWith('#') ? '#NEW' : undefined }
        : null
  );

  assert.equal(result.count, 1);
  assert.equal(
    result.content,
    '[#NEW](../_glossary/people/core/X.md) and [Old_Name](../_glossary/people/core/X.md)'
  );
});
