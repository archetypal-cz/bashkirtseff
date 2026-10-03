import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  plainText, makeSnippet, extractParagraphs, buildCarnetIndex, carnetsWithFiles, SNIPPET_MAX,
} from '../paragraph-index';

const CONTENT = path.resolve(process.cwd(), '../../content');

describe('plainText', () => {
  it('strips comments, glossary tags, footnotes, markdown', () => {
    const raw = [
      '%% [#Nice](../_glossary/places/cities/NICE.md) %%',
      '%% 2025-12-07T16:00:00 RSR: note %%',
      '# Titre',
      '> *Hier* soir, **à** l\'[Opéra](x.md),[^01.21.1] très bien.',
      '[^01.21.1]: A footnote that must not leak.',
    ].join('\n');
    expect(plainText(raw)).toBe("Titre Hier soir, à l'Opéra, très bien.");
  });

  it('drops a whole-line comment containing a literal %% (en 067.1347)', () => {
    const raw = 'Avant.\n%% 2026-01-01T10:00:00 TR: keep it in %% markers %%\nAprès.';
    expect(plainText(raw)).toBe('Avant. Après.');
  });

  it('drops old-format [//]: # ( ... ) comment lines (fr 053.0117)', () => {
    const raw = 'Avant.\n[//]: # (RSR: internal research note)\n  [//]: # ([#Tag](../x.md))\nAprès.';
    expect(plainText(raw)).toBe('Avant. Après.');
  });
});

describe('makeSnippet', () => {
  it('keeps short text', () => expect(makeSnippet('abc def')).toBe('abc def'));
  it('cuts at a word boundary within 160 chars with an ellipsis', () => {
    const text = Array.from({ length: 80 }, (_, i) => `mot${i}`).join(' ');
    const s = makeSnippet(text);
    expect(Array.from(s).length).toBeLessThanOrEqual(SNIPPET_MAX);
    expect(s.endsWith('…')).toBe(true);
    expect(text.startsWith(s.slice(0, -1))).toBe(true);
    expect(text[s.length - 1]).toBe(' '); // cut fell on a word boundary
  });
});

describe('extractParagraphs', () => {
  it('splits on ID lines, ignores foreign prefixes and frontmatter', () => {
    const md = '---\ndate: 1873-01-11\n---\n\n%% 001.0001 %%\nUn.\n\n%% 001.0002 %%\nDeux\nlignes.\n%% 002.0009 %%\nÉtranger.\n';
    expect(extractParagraphs(md, '001')).toEqual([[1, 'Un.'], [2, 'Deux lignes.']]);
  });
});

describe('real content', () => {
  const orig = '_original';

  it('carnet 000 rows are [null, snippet]', () => {
    const idx = buildCarnetIndex(orig, '000');
    expect(idx['0001']).toBeDefined();
    expect(idx['0001'][0]).toBeNull();
    expect(idx['0001'][1].length).toBeGreaterThan(0);
    for (const [, [entry, snip]] of Object.entries(idx)) {
      expect(entry).toBeNull();
      expect(Array.from(snip).length).toBeLessThanOrEqual(SNIPPET_MAX);
    }
  });

  it('resolves a kind (quoted) paragraph to its entry with the quotation as plain text', () => {
    // content/_original/068/1877-02-03.md carries `%% kind: rayé %%` clusters
    const file = path.join(CONTENT, orig, '068', '1877-02-03.md');
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    const k = lines.findIndex(l => /^\s*%%\s*kind:\s*rayé/.test(l));
    expect(lines[k - 1]).toBe('%% 068.0944 %%'); // acceptance id
    const idx = buildCarnetIndex(orig, '068');
    const row = idx['0944'];
    expect(row[0]).toBe('1877-02-03');
    expect(row[1]).not.toMatch(/%%|kind:|>|\*/);
  });

  it('resolves a clipping with block quotation lines without markers', () => {
    const dir = path.join(CONTENT, orig);
    let found: [string, string, string] | null = null;
    outer: for (const c of fs.readdirSync(dir).filter(d => /^\d{3}$/.test(d))) {
      for (const f of fs.readdirSync(path.join(dir, c))) {
        const m = /^%% (\d{3}\.\d{4}) %%\n%% kind: clipping[^\n]*\n> /m.exec(
          fs.readFileSync(path.join(dir, c, f), 'utf-8'));
        if (m) { found = [c, f.replace('.md', ''), m[1].slice(4)]; break outer; }
      }
    }
    expect(found).not.toBeNull();
    const [c, entry, num] = found!;
    const row = buildCarnetIndex(orig, c)[num];
    expect(row[0]).toBe(entry);
    expect(row[1].startsWith('>')).toBe(false);
  });

  it('a paragraph moved across carnets is keyed under its new carnet', () => {
    // content/_renumber/008-2026-09-29.json: 008.0335 -> 009.0001 (carnet 008 -> 009)
    const map = JSON.parse(fs.readFileSync(
      path.join(CONTENT, '_renumber', '008-2026-09-29.json'), 'utf-8')).id_map;
    expect(map['008.0335']).toBe('009.0001');
    const src = fs.readFileSync(path.join(CONTENT, orig, '009', '1873-09-01.md'), 'utf-8');
    expect(src).toContain('%% 009.0001 %%\n%% [#Kernberger]');
    expect(src).toContain('# Lundi 1 septembre 1873');
    const idx9 = buildCarnetIndex(orig, '009');
    expect(idx9['0001'][0]).toBe('1873-09-01');
    expect(idx9['0001'][1].startsWith('Lundi 1 septembre 1873')).toBe(true);
    // The old carnet does not hold the moved text
    const idx8 = buildCarnetIndex(orig, '008');
    expect(Object.values(idx8).some(([, sn]) => sn.includes('Lundi 1 septembre 1873'))).toBe(false);
  });

  it('skips empty snippets so the client can fall back per row', () => {
    const fr = buildCarnetIndex('fr', '001');
    for (const [, [, sn]] of Object.entries(fr)) expect(sn.length).toBeGreaterThan(0);
    expect(buildCarnetIndex('_original', '000')['0001']).toBeDefined(); // 000.0001
  });

  it('no (lang, carnet) files for absent pairs', () => {
    const es = carnetsWithFiles('es');
    expect(es).toContain('001');
    expect(es).not.toContain('002');
    expect(carnetsWithFiles('_original')).toContain('106');
  });
});
