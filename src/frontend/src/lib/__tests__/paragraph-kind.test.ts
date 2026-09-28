/**
 * Paragraph kinds (`%% kind: clipping source="…" %%` + `> ` quote lines) and
 * entry drawings (frontmatter `drawings:`) through content.ts.
 * Convention: docs/REBUILD_CARNET.md, "Paragraph kinds" and "Drawings".
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { kindRuns, noteLanguage, parseKindLine, stripQuoteMarkers, wrapKindHtml } from '../paragraph-kind';
import { normalizeDrawings, placeDrawings } from '../drawings';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-kind-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

type GetEntry = typeof import('../content')['getEntry'];
let getEntry: GetEntry;

function write(lang: string, carnet: string, entryId: string, frontmatter: string, body: string): void {
  const dir = path.join(contentRoot, lang, carnet);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${entryId}.md`), `---\ndate: ${entryId}\ncarnet: "${carnet}"\n${frontmatter}---\n\n${body}\n`, 'utf-8');
}

beforeAll(async () => {
  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  ({ getEntry } = await import('../content'));

  write(
    '_original',
    '901',
    '1877-02-12',
    [
      'drawings:',
      '  - src: /images/marie/drawings/901/fixture-p0001-1.webp',
      '    caption: "Profil de femme"',
      '    source: "Tome 9, p. 1"',
      '    paragraph: "901.0002"',
      '  - src: /images/marie/drawings/901/fixture-p0001-2.webp',
      '  - src: relative/not-allowed.webp',
      '',
    ].join('\n'),
    [
      '%% 901.0001 %%',
      '# Lundi 12 février 1877',
      "Je colle l'article.",
      '',
      '%% 901.0002 %%',
      '%% kind: clipping source="Le Figaro, 12 février 1877" %%',
      '%% [#Press_clipping](../_glossary/culture/newspapers/PRESS_CLIPPING.md) %%',
      "> Hier soir, à l'Opéra, on remarquait",
      '> Mlle Marie Bashkirtseff.',
      '',
      '%% 901.0003 %%',
      '%% kind: rayé %%',
      'Je ne dirai rien.',
    ].join('\n'),
  );
  write(
    'cz',
    '901',
    '1877-02-12',
    'translation_complete: true\n',
    [
      '%% 901.0002 %%',
      '%% kind: clipping source="Le Figaro, 12 février 1877" %%',
      "%% > Hier soir, à l'Opéra, on remarquait %%",
      '%% > Mlle Marie Bashkirtseff. %%',
      '> Včera večer bylo v Opeře lze spatřit',
      '> slečnu Marii Baškirtsevovou.',
    ].join('\n'),
  );
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('paragraph kind helpers', () => {
  it('parses the marker line, raye included', () => {
    expect(parseKindLine('%% kind: letter source="Lettre de Multedo" %%')).toEqual({ kind: 'letter', source: 'Lettre de Multedo' });
    expect(parseKindLine('%% kind: raye %%')).toEqual({ kind: 'rayé' });
    expect(parseKindLine('%% kind: poster %%')).toBeNull();
  });

  it('strips quote markers and labels the block in the content language', () => {
    expect(stripQuoteMarkers('> a\n> b\nc')).toBe('a\nb\nc');
    const html = wrapKindHtml('Texte', 'clipping', 'Le <Figaro>', 'original');
    expect(html).toMatch(/^<blockquote class="para-kind para-kind-clipping" data-kind="clipping">/);
    expect(html).toContain('Coupure de presse');
    expect(html).toContain('<cite class="para-kind-source">Le &lt;Figaro&gt;</cite>');
    expect(wrapKindHtml('x', 'rayé', undefined, 'en')).toContain('<del class="para-kind-body">x</del>');
    expect(wrapKindHtml('x', 'margin', undefined, 'cz')).toContain('Na okraji');
    expect(wrapKindHtml('[Marie est passée de la page 184 à 185]', 'editorial', undefined, 'original')).toContain('<span class="para-kind-label sr-only">');
    expect(wrapKindHtml('x', 'cover', undefined, 'en')).toContain('Notebook cover');
  });
});

describe('entry order', () => {
  it('puts the cover entry first on its date, then the bare date, then suffixes', async () => {
    const { compareEntryIds, isCoverEntryId } = await import('../content');
    const ids = ['1878-10-04-evening', '1878-10-05', '1878-10-04', '1878-10-04-cover', '1878-10-04-05'];
    expect(ids.sort(compareEntryIds)).toEqual(['1878-10-04-cover', '1878-10-04', '1878-10-04-05', '1878-10-04-evening', '1878-10-05']);
    expect(isCoverEntryId('1878-10-04-cover')).toBe(true);
    expect(isCoverEntryId('1878-10-04')).toBe(false);
  });
});

describe('content.ts', () => {
  it('renders an _original clipping as a labelled blockquote without the > markers', () => {
    const p = getEntry('901', '1877-02-12', 'original')!.paragraphs.find(x => x.id === '901.0002')!;
    expect(p.kind).toBe('clipping');
    expect(p.kindSource).toBe('Le Figaro, 12 février 1877');
    expect(p.text.startsWith('Hier soir')).toBe(true);
    expect(p.html).toMatch(/^<blockquote class="para-kind para-kind-clipping"/);
    expect(p.html).not.toContain('&gt;');
    const r = getEntry('901', '1877-02-12', 'original')!.paragraphs.find(x => x.id === '901.0003')!;
    expect(r.kind).toBe('rayé');
    expect(r.html).toContain('<del class="para-kind-body">');
  });

  it('keeps the marker out of a translation\'s embedded French and wraps the translation', () => {
    const p = getEntry('901', '1877-02-12', 'cz')!.paragraphs.find(x => x.id === '901.0002')!;
    expect(p.kind).toBe('clipping');
    expect(p.originalText).toBe("> Hier soir, à l'Opéra, on remarquait\n> Mlle Marie Bashkirtseff.");
    expect(p.originalHtml).not.toContain('&gt;');
    expect(p.html).toContain('Novinový výstřižek');
    expect(p.html).toContain('Včera večer');
  });

  it('reads drawings from frontmatter, validates them, and translations inherit them', () => {
    const e = getEntry('901', '1877-02-12', 'original')!;
    expect(e.drawings).toEqual([
      { src: '/images/marie/drawings/901/fixture-p0001-1.webp', caption: 'Profil de femme', source: 'Tome 9, p. 1', paragraph: '901.0002' },
      { src: '/images/marie/drawings/901/fixture-p0001-2.webp' },
    ]);
    expect(getEntry('901', '1877-02-12', 'cz')!.drawings).toEqual(e.drawings);
    const placed = placeDrawings(e.drawings, e.paragraphs.map(x => x.id));
    expect(placed.byParagraph['901.0002'].map(d => d.caption)).toEqual(['Profil de femme']);
    expect(placed.atEnd.map(d => d.src)).toEqual(['/images/marie/drawings/901/fixture-p0001-2.webp']);
    expect(placeDrawings([{ src: '/x.webp', paragraph: '901.0099' }], ['901.0001']).atEnd).toHaveLength(1);
    expect(normalizeDrawings('nope')).toBeUndefined();
  });
});

describe('runs of same-kind paragraphs', () => {
  it('groups consecutive same-kind, same-source clippings/letters; breaks on kind, source or plain text', () => {
    const runs = kindRuns<{ id: string; kind?: 'clipping' | 'letter' | 'rayé' | 'margin'; kindSource?: string }>([
      { id: 'a', kind: 'clipping', kindSource: 'Figaro' },
      { id: 'b', kind: 'clipping', kindSource: 'Figaro' },
      { id: 'c', kind: 'clipping', kindSource: 'Gaulois' },
      { id: 'd', kind: 'letter', kindSource: 'Gaulois' },
      { id: 'e' },
      { id: 'f', kind: 'letter' },
      { id: 'g', kind: 'letter' },
      { id: 'h', kind: 'rayé' },
      { id: 'i', kind: 'rayé' },
      { id: 'j', kind: 'margin' },
      { id: 'k', kind: 'margin' },
    ]);
    expect(runs.map(r => r.map(p => p.id).join(''))).toEqual(['ab', 'c', 'd', 'e', 'fg', 'h', 'i', 'j', 'k']);
  });

  it('labels a run once in content.ts, keeping each paragraph and its standalone block', () => {
    const body = [
      '%% 901.0010 %%',
      '# Mardi 13 février 1877',
      '',
      '%% 901.0011 %%',
      '%% kind: clipping source="journal anglais, décembre 1873" %%',
      '> Premier alinéa.',
      '',
      '%% 901.0012 %%',
      '%% kind: clipping source="journal anglais, décembre 1873" %%',
      '> Second alinéa.',
      '',
      '%% 901.0013 %%',
      '%% kind: clipping source="journal anglais, décembre 1873" %%',
      '> Troisième alinéa.',
      '',
      '%% 901.0014 %%',
      'Et moi je dis.',
      '',
      '%% 901.0015 %%',
      '%% kind: clipping source="journal anglais, décembre 1873" %%',
      '> Seul.',
    ].join('\n');
    write('_original', '901', '1877-02-13', '', body);
    write('cz', '901', '1877-02-13', '', body
      .replace('# Mardi 13 février 1877', '%% # Mardi 13 février 1877 %%\n# Úterý 13. února 1877')
      .replace(/^> (.+)$/gm, '%% > $1 %%\n> Český $1'));

    for (const lang of ['original', 'cz']) {
      const ps = getEntry('901', '1877-02-13', lang)!.paragraphs;
      const byId = new Map(ps.map(p => [p.id, p]));
      const first = byId.get('901.0011')!;
      expect(first.kindRun).toMatchObject({ size: 3, key: 'clipping', quoted: true });
      expect(first.kindRun!.labelHtml).toContain('journal anglais, décembre 1873');
      expect(first.kindRun!.labelText).toBe(
        `${lang === 'cz' ? 'Novinový výstřižek' : 'Coupure de presse'} · journal anglais, décembre 1873`,
      );
      for (const id of ['901.0011', '901.0012', '901.0013']) {
        const p = byId.get(id)!;
        expect(p.kindBodyHtml).toMatch(/^<div class="para-kind-body">/);
        expect(p.kindBodyHtml).not.toContain('para-kind-label');
        expect(p.html).toMatch(/^<blockquote class="para-kind para-kind-clipping"/); // standalone form kept
      }
      expect(byId.get('901.0012')!.kindRun).toBeUndefined();
      // A plain paragraph breaks the run: the lone clipping after it is not grouped.
      expect(byId.get('901.0015')!.kindRun).toBeUndefined();
      expect(byId.get('901.0015')!.kindBodyHtml).toBeUndefined();
    }
    const cz = getEntry('901', '1877-02-13', 'cz')!.paragraphs.find(p => p.id === '901.0012')!;
    expect(cz.kindBodyHtml).toContain('Český Second alinéa.');
    expect(cz.originalHtml).toBe('Second alinéa.');
  });
});

describe("a run's language in its label", () => {
  it('reads language-only notes in en, cz and uk, and nothing else', () => {
    expect(noteLanguage('In English in the original.')).toBe('en');
    expect(noteLanguage('<em>In English in the original.</em>')).toBe('en');
    expect(noteLanguage('Pozn. překl.: V originále anglicky: popis výzdoby kostela')).toBe('en');
    expect(noteLanguage('Pozn. překl.: V originále italsky')).toBe('it');
    expect(noteLanguage('В оригіналі англійською.')).toBe('en');
    expect(noteLanguage('*По-латині в оригіналі.*')).toBe('la');
    expect(noteLanguage('Italian: in haste.')).toBeNull();
    expect(noteLanguage('Pozn. překl.: *Miserere* – latinsky „Smiluj se“')).toBeNull();
  });

  const src = (i: number) => [
    `%% 902.00${i} %%`,
    '%% kind: clipping source="Galignani" %%',
    ...(i === 11 ? ['%% [#English](../_glossary/culture/languages/ENGLISH.md) %%'] : []),
    `> Paragraph ${i} of the article.`,
  ].join('\n');

  beforeAll(() => {
    write('_original', '902', '1873-12-14', '', [11, 12, 13].map(src).join('\n\n'));
    // en: every paragraph carries an inline language note
    write('en', '902', '1873-12-14', '', [11, 12, 13].map(i => [
      `%% 902.00${i} %%`, '%% kind: clipping source="Galignani" %%', `%% > Paragraph ${i} of the article. %%`,
      `> ==Paragraph ${i} of the article.==`, '', '> ^[In English in the original.]',
    ].join('\n')).join('\n\n'));
    // cz: every paragraph has a "V originále anglicky" footnote; one other note stays
    write('cz', '902', '1873-12-14', '', [11, 12, 13].map(i => [
      `%% 902.00${i} %%`, '%% kind: clipping source="Galignani" %%', `%% > Paragraph ${i} of the article. %%`,
      `> Odstavec ${i} článku.[^${i}]${i === 12 ? '[^99]' : ''}`, '',
      `[^${i}]: Pozn. překl.: V originále anglicky: popis ${i}`,
    ].join('\n')).join('\n\n') + '\n\n[^99]: Pozn. překl.: Galignani vycházel v Paříži.');
    // uk: only one paragraph has a note → it stays; the source tags name the language
    write('uk', '902', '1873-12-14', '', [11, 12, 13].map(i => [
      `%% 902.00${i} %%`, '%% kind: clipping source="Galignani" %%', `%% > Paragraph ${i} of the article. %%`,
      `> Абзац ${i}.${i === 12 ? '[^1]' : ''}`,
    ].join('\n')).join('\n\n') + '\n\n[^1]: В оригіналі англійською.');
    // fr: no notes, no language tags of its own
    write('fr', '902', '1873-12-14', '', [11, 12, 13].map(i => [
      `%% 902.00${i} %%`, '%% kind: clipping source="Galignani" %%', `> Paragraph ${i} of the article.`,
    ].join('\n')).join('\n\n'));
  });

  it('shows the tagged language once in the original', () => {
    const [first] = getEntry('902', '1873-12-14', 'original')!.paragraphs;
    expect(first.kindRun!.labelText).toBe('Coupure de presse · Galignani · en anglais');
    expect(first.kindRun!.labelHtml).toContain('<span class="para-kind-lang">en anglais</span>');
  });

  it('moves per-paragraph en inline notes into the label', () => {
    const ps = getEntry('902', '1873-12-14', 'en')!.paragraphs;
    expect(ps[0].kindRun!.labelText).toBe('Newspaper clipping · Galignani · in English');
    for (const p of ps) {
      expect(p.kindBodyHtml).not.toContain('original');
      expect(p.html).not.toContain('^[');
      expect(p.html).toContain('in English'); // the standalone block is labelled too
    }
  });

  it('moves per-paragraph cz language footnotes into the label and drops them from the notes', () => {
    const entry = getEntry('902', '1873-12-14', 'cz')!;
    expect(entry.paragraphs[0].kindRun!.labelText).toBe('Novinový výstřižek · Galignani · anglicky');
    for (const p of entry.paragraphs) expect(p.kindBodyHtml).not.toMatch(/fn-1[123]"/);
    expect(entry.paragraphs[1].kindBodyHtml).toContain('href="#fn-99"');
    expect(entry.paragraphs[1].footnoteRefs).toEqual(['99']);
    expect(entry.footnotes.map(f => f.id)).toEqual(['99']);
  });

  it('takes the language from the source tags when the translation has none', () => {
    expect(getEntry('902', '1873-12-14', 'fr')!.paragraphs[0].kindRun!.labelText)
      .toBe('Coupure de presse · Galignani · en anglais');
  });

  it('leaves the notes alone when not every paragraph has one', () => {
    const entry = getEntry('902', '1873-12-14', 'uk')!;
    expect(entry.paragraphs[0].kindRun!.labelText).toBe('Газетна вирізка · Galignani · англійською');
    expect(entry.paragraphs[1].kindBodyHtml).toContain('href="#fn-1"');
    expect(entry.footnotes.map(f => f.id)).toEqual(['1']);
  });
});
