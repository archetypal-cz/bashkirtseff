/**
 * Paragraph kinds (`%% kind: clipping source="…" %%` + `> ` quote lines) and
 * entry drawings (frontmatter `drawings:`) through content.ts.
 * Convention: docs/REBUILD_CARNET.md, "Paragraph kinds" and "Drawings".
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { parseKindLine, stripQuoteMarkers, wrapKindHtml } from '../paragraph-kind';
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
