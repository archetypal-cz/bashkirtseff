/**
 * An entry's footnotes are numbered 1, 2, 3, … in order of first reference
 * (their ids are per paragraph, so the id's last segment restarts at 1).
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { numberFootnotes } from '../footnote-numbers';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-fn-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

type Content = typeof import('../content');
let getEntry: Content['getEntry'];
let getCarnet000Merged: Content['getCarnet000Merged'];

function write(lang: string, carnet: string, entryId: string, body: string): void {
  const dir = path.join(contentRoot, lang, carnet);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${entryId}.md`), `---\ncarnet: "${carnet}"\n---\n\n${body}\n`, 'utf-8');
}

const ref = (id: string, label: string) =>
  `<sup><a href="#fn-${id}" id="fnref-${id}" class="footnote-ref" aria-expanded="false">${label}</a></sup>`;

/** Shown superscript labels by footnote id, in text order */
function supLabels(html: string): [string, string][] {
  return [...html.matchAll(/<a href="#fn-([^"]+)"[^>]*class="footnote-ref"[^>]*>([^<]*)<\/a>/g)].map(m => [m[1], m[2]]);
}

beforeAll(async () => {
  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  ({ getEntry, getCarnet000Merged } = await import('../content'));

  write('_original', '903', '1873-07-19', [
    '%% 903.0001 %%',
    '# Samedi 19 juillet 1873',
    'Premier.[^903.0001.1] Second.[^903.0001.2]',
    '',
    '%% 903.0002 %%',
    'Autre.[^903.0002.1] Encore le premier.[^903.0001.1]',
    '',
    '[^903.0002.1]: Note of 0002.',
    '[^903.0001.2]: Second note of 0001.',
    '[^903.0001.1]: First note of 0001.',
    '[^903.0099.1]: Never referenced.',
  ].join('\n'));

  // A clipping run whose per-paragraph language notes are dropped: the
  // remaining note is 1, not 3.
  write('_original', '904', '1873-12-14', [11, 12].map(i => [
    `%% 904.00${i} %%`, '%% kind: clipping source="Galignani" %%', `> Paragraph ${i}.`,
  ].join('\n')).join('\n\n'));
  write('cz', '904', '1873-12-14', [11, 12].map(i => [
    `%% 904.00${i} %%`, '%% kind: clipping source="Galignani" %%', `%% > Paragraph ${i}. %%`,
    `> Odstavec ${i}.[^904.00${i}.1]${i === 12 ? '[^904.0012.2]' : ''}`, '',
    `[^904.00${i}.1]: Pozn. překl.: V originále anglicky.`,
  ].join('\n')).join('\n\n') + '\n\n[^904.0012.2]: Pozn. překl.: Galignani vycházel v Paříži.');

  write('_original', '000', '000-01', '%% 000.0001 %%\nUn.[^000.0001.1]\n\n[^000.0001.1]: A.');
  write('_original', '000', '000-02', '%% 000.0002 %%\nDeux.[^000.0002.1]\n\n[^000.0002.1]: B.');
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('numberFootnotes', () => {
  it('numbers by first reference, sorts the notes, and puts unreferenced ones last', () => {
    const paragraphs = [
      { html: `a${ref('7.1.1', '1')}b${ref('7.1.2', '2')}` },
      { html: `c${ref('7.2.1', '1')}d${ref('7.1.1', '1')}${ref('missing', '1')}` },
    ];
    const footnotes = [{ id: '7.9.1', text: 'z' }, { id: '7.2.1', text: 'y' }, { id: '7.1.2', text: 'x' }, { id: '7.1.1', text: 'w' }];
    const r = numberFootnotes(paragraphs, footnotes);
    expect(r.footnotes.map(fn => [fn.id, fn.label])).toEqual([['7.1.1', '1'], ['7.1.2', '2'], ['7.2.1', '3'], ['7.9.1', '4']]);
    expect(supLabels(r.paragraphs[0].html)).toEqual([['7.1.1', '1'], ['7.1.2', '2']]);
    // an undefined note's ref is left alone
    expect(supLabels(r.paragraphs[1].html)).toEqual([['7.2.1', '3'], ['7.1.1', '1'], ['missing', '1']]);
  });

  it('relabels kind-run bodies too and leaves the inputs untouched', () => {
    const p = { html: `<blockquote>${ref('a.2', '2')}</blockquote>`, kindBodyHtml: `<div>${ref('a.2', '2')}</div>` };
    const r = numberFootnotes([p], [{ id: 'a.2', text: '' }]);
    expect(supLabels(r.paragraphs[0].kindBodyHtml!)).toEqual([['a.2', '1']]);
    expect(supLabels(p.html)).toEqual([['a.2', '2']]);
  });
});

describe('entries', () => {
  it('numbers an entry across its paragraphs, keeping the ids for anchors', () => {
    const e = getEntry('903', '1873-07-19', 'original')!;
    expect(e.footnotes.map(fn => [fn.id, fn.label])).toEqual([
      ['903.0001.1', '1'], ['903.0001.2', '2'], ['903.0002.1', '3'], ['903.0099.1', '4'],
    ]);
    expect(e.paragraphs.flatMap(p => supLabels(p.html))).toEqual([
      ['903.0001.1', '1'], ['903.0001.2', '2'], ['903.0002.1', '3'], ['903.0001.1', '1'],
    ]);
    expect(e.paragraphs[0].html).toContain('id="fnref-903.0001.1"');
  });

  it('numbers after a clipping run drops its language notes', () => {
    const e = getEntry('904', '1873-12-14', 'cz')!;
    expect(e.footnotes.map(fn => [fn.id, fn.label])).toEqual([['904.0012.2', '1']]);
    const labels = e.paragraphs.flatMap(p => [...supLabels(p.html), ...supLabels(p.kindBodyHtml ?? '')]);
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every(([id, label]) => id === '904.0012.2' && label === '1')).toBe(true);
  });

  it('numbers the merged preface across its sections', () => {
    const merged = getCarnet000Merged('original')!;
    expect(merged.footnotes.map(fn => [fn.id, fn.label])).toEqual([['000.0001.1', '1'], ['000.0002.1', '2']]);
    expect(merged.paragraphs.flatMap(p => supLabels(p.html))).toEqual([['000.0001.1', '1'], ['000.0002.1', '2']]);
    // the cached section entry keeps its own numbering
    expect(getEntry('000', '000-02', 'original')!.footnotes[0].label).toBe('1');
  });
});
