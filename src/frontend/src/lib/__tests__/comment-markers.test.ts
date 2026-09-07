/**
 * Tests for `%%` comment-marker parsing in content.ts
 *
 * The four `%%` implementations in this repo are catalogued in
 * docs/COMMENT_MARKER_RULES.md. The frontend follows rule 3: a line opens a
 * multi-line source block when its only `%%` is the one it starts with, and the
 * block closes on the first line ending with `%%`. Only the first
 * `%%`-delimited span of a wrapped line is diary source; anything after it is
 * annotation and must never reach the reader.
 *
 * content.ts resolves its content root from process.cwd() at module load, so
 * these tests build a throwaway content tree and stub cwd before importing it.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-content-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

type GetEntry = typeof import('../content')['getEntry'];
let getEntry: GetEntry;

function writeEntry(lang: string, carnet: string, entryId: string, body: string): void {
  const dir = path.join(contentRoot, lang, carnet);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${entryId}.md`),
    `---\ndate: ${entryId}\ncarnet: "${carnet}"\n---\n\n${body}\n`,
    'utf-8'
  );
}

function paragraph(lang: string, carnet: string, entryId: string, id: string) {
  const entry = getEntry(carnet, entryId, lang);
  expect(entry, `entry ${lang}/${carnet}/${entryId} should parse`).not.toBeNull();
  return entry!.paragraphs.find(p => p.id === id);
}

beforeAll(async () => {
  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  ({ getEntry } = await import('../content'));
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('multi-line source blocks', () => {
  it('promotes a verse block whose first line is a bare number', () => {
    // 53 `fr` blocks open like this; the old `^%%\s*\d` exclusion refused them,
    // dropping the number line and leaking the verse into the page as prose.
    writeEntry(
      'fr',
      '900',
      '1875-10-06',
      [
        '%% 900.0001 %%',
        '# Mercredi, 6 octobre 1875',
        '',
        '%% 900.0002 %%',
        '%% 1',
        "Ton fils d'ici partira",
        'Mais pourrira, mais pourrira ! %%',
        '%% 2026-02-02T12:00:00 LAN: SATIRICAL VERSE: mock prophecy %%',
      ].join('\n')
    );

    const p = paragraph('fr', '900', '1875-10-06', '900.0002');
    expect(p).toBeDefined();
    expect(p!.text).toBe("1 Ton fils d'ici partira Mais pourrira, mais pourrira !");
    expect(p!.text).not.toContain('LAN');
  });

  it('never promotes a wrapped multi-line role comment into the source panel', () => {
    writeEntry(
      'cz',
      '900',
      '1873-01-02',
      [
        '%% 900.0010 %%',
        '%% 2026-02-02T12:00:00 LAN: a long note that',
        'wraps onto a second line %%',
        'Český překlad.',
      ].join('\n')
    );

    const p = paragraph('cz', '900', '1873-01-02', '900.0010');
    expect(p).toBeDefined();
    expect(p!.text).toBe('Český překlad.');
    expect(p!.originalText).toBeUndefined();
  });

  it('does not treat a paragraph-ID line as a block opener', () => {
    // `%% 900.0021 %%` starts AND ends with `%%`: two markers, never an opener.
    writeEntry(
      'cz',
      '900',
      '1873-01-03',
      [
        '%% 900.0020 %%',
        '%% Première phrase française. %%',
        'První česká věta.',
        '',
        '%% 900.0021 %%',
        '%% Deuxième phrase française. %%',
        'Druhá česká věta.',
      ].join('\n')
    );

    const entry = getEntry('900', '1873-01-03', 'cz')!;
    expect(entry.paragraphs.map(p => p.id)).toEqual(['900.0020', '900.0021']);
    expect(entry.paragraphs[1].text).toBe('Druhá česká věta.');
    expect(entry.paragraphs[1].originalText).toBe('Deuxième phrase française.');
  });

  it('keeps a `%% comment %% prose` splice out of the rendered text', () => {
    writeEntry(
      'cz',
      '900',
      '1873-01-04',
      [
        '%% 900.0030 %%',
        '%% 2026-02-02T12:00:00 LAN: spliced note %% zbytek řádku',
        'Skutečný překlad.',
        '',
        '%% 900.0031 %%',
        'Další odstavec.',
      ].join('\n')
    );

    const entry = getEntry('900', '1873-01-04', 'cz')!;
    const spliced = entry.paragraphs.find(p => p.id === '900.0030');
    expect(spliced!.text).toBe('Skutečný překlad.');
    expect(spliced!.text).not.toContain('zbytek');
    expect(spliced!.text).not.toContain('LAN');
    // The splice must not swallow the paragraphs that follow it.
    expect(entry.paragraphs.find(p => p.id === '900.0031')?.text).toBe('Další odstavec.');
  });

  it('does not let an untimestamped splice swallow the rest of the entry', () => {
    // Under the old opener test this line (no leading date, so the `^%%\s*\d`
    // exclusion missed it) opened a block that ran past the next paragraph ID.
    writeEntry(
      'cz',
      '900',
      '1873-01-05',
      [
        '%% 900.0032 %%',
        '%% LAN: spliced note %% zbytek řádku',
        'Skutečný překlad.',
        '',
        '%% 900.0033 %%',
        'Další odstavec.',
      ].join('\n')
    );

    const entry = getEntry('900', '1873-01-05', 'cz')!;
    expect(entry.paragraphs.map(p => p.id)).toEqual(['900.0032', '900.0033']);
    expect(entry.paragraphs[0].text).toBe('Skutečný překlad.');
    expect(entry.paragraphs[1].text).toBe('Další odstavec.');
  });
});

describe('single-line French source with an appended span', () => {
  it('promotes the French sentence and drops a trailing role note', () => {
    writeEntry(
      'cz',
      '900',
      '1873-10-21',
      [
        '%% 900.0040 %%',
        '%% Nous sortons enfin au quai Saint-Jean-Baptiste. %% 2026-01-29T09:05:00 LAN: NEOLOGISM "subhorbitaire" %%',
        'Konečně vycházíme na nábřeží Saint-Jean-Baptiste.',
      ].join('\n')
    );

    const p = paragraph('cz', '900', '1873-10-21', '900.0040');
    expect(p!.originalText).toBe('Nous sortons enfin au quai Saint-Jean-Baptiste.');
    expect(p!.originalText).not.toContain('LAN');
    expect(p!.originalText).not.toContain('2026-01-29');
    expect(p!.text).toBe('Konečně vycházíme na nábřeží Saint-Jean-Baptiste.');
  });

  it('promotes the French sentence and drops an appended glossary-tag span', () => {
    writeEntry(
      'cz',
      '900',
      '1873-09-21',
      [
        '%% 900.0050 %%',
        '%% Je descends dans la salle à manger. %% [#Miloradovitch](../../_original/_glossary/culture/literature/MILORADOVITCH.md) %%',
        'Scházím do jídelny.',
      ].join('\n')
    );

    const p = paragraph('cz', '900', '1873-09-21', '900.0050');
    expect(p!.originalText).toBe('Je descends dans la salle à manger.');
    expect(p!.originalText).not.toContain('[#');
  });

  it('still drops a role comment that quotes a literal `%%`', () => {
    writeEntry(
      'uk',
      '900',
      '1884-06-15',
      [
        '%% 900.0060 %%',
        '%% 2026-06-13T14:20:00 RED: removed a redundant `%% 229 %%` comment line %%',
        'Український переклад.',
      ].join('\n')
    );

    const p = paragraph('uk', '900', '1884-06-15', '900.0060');
    expect(p!.text).toBe('Український переклад.');
    expect(p!.originalText).toBeUndefined();
  });

  it('drops a role comment whose timestamp is not at the start of the span', () => {
    writeEntry(
      'uk',
      '900',
      '1875-04-22',
      [
        '%% 900.0070 %%',
        '%% Zoé established as «Зое» in TM (carnet 025); 2026-05-30T12:00:00 TR: "je ne me gêne nullement" %%',
        '%% De retour nous avons une conversation des plus animées. %%',
        'Повернувшись, ми ведемо жваву розмову.',
      ].join('\n')
    );

    const p = paragraph('uk', '900', '1875-04-22', '900.0070');
    expect(p!.originalText).toBe('De retour nous avons une conversation des plus animées.');
  });

  it('keeps a continuation line that starts with a lone %% inside the open block', () => {
    // Inside an open block only a line ENDING in `%%` closes it (rule 3, shared
    // with the comment scanner and the Python gate). Testing the opener before
    // the in-block branch used to discard the open block and restart it here.
    writeEntry(
      'fr',
      '900',
      '1875-10-07',
      [
        '%% 900.0080 %%',
        '%% Première ligne du bloc',
        '%% deuxième ligne, marqueur littéral',
        'troisième ligne. %%',
        '%% 2026-02-02T12:00:00 LAN: note %%',
      ].join('\n')
    );

    const p = paragraph('fr', '900', '1875-10-07', '900.0080');
    expect(p).toBeDefined();
    expect(p!.text).toBe('Première ligne du bloc %% deuxième ligne, marqueur littéral troisième ligne.');
    expect(p!.text).not.toContain('LAN');
  });
});

describe('consecutive source lines (docs/COMMENT_MARKER_RULES.md (f))', () => {
  it('joins consecutive `%% line %%` source lines into one originalText', () => {
    writeEntry(
      'cz',
      '901',
      '1873-11-01',
      [
        '%% 901.0001 %%',
        '%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%',
        '%% Mon malheureux journal %%',
        '%% commencé le samedi 1er novembre 1873 %%',
        '%% terminé le jeudi 20 novembre 1873 %%',
        '%% 2026-01-29T09:16:00 LAN: "malheureux" - unhappy and unlucky %%',
        'Můj ubohý deník',
        'začatý v sobotu 1. listopadu 1873',
      ].join('\n')
    );

    const p = paragraph('cz', '901', '1873-11-01', '901.0001');
    expect(p!.originalText).toBe(
      'Mon malheureux journal\ncommencé le samedi 1er novembre 1873\nterminé le jeudi 20 novembre 1873'
    );
    expect(p!.originalText).not.toContain('LAN');
    expect(p!.originalText).not.toContain('[#');
    expect(p!.text).toBe('Můj ubohý deník\nzačatý v sobotu 1. listopadu 1873');
  });

  it('leaves a single source line unchanged', () => {
    writeEntry(
      'cz',
      '901',
      '1873-01-11',
      ['%% 901.0002 %%', '%% Il fait un temps superbe. %%', 'Je nádherné počasí.'].join('\n')
    );
    const p = paragraph('cz', '901', '1873-01-11', '901.0002');
    expect(p!.originalText).toBe('Il fait un temps superbe.');
  });

  it('ends the run at a note, a tag, an untimestamped role note or translation text', () => {
    writeEntry(
      'cz',
      '901',
      '1873-01-12',
      [
        '%% 901.0003 %%',
        '%% Première ligne. %%',
        '%% 2026-01-29T09:16:00 LAN: a note %%',
        '%% Pas une continuation. %%',
        'První.',
        '',
        '%% 901.0004 %%',
        '%% Deuxième ligne. %%',
        '%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%',
        '%% Pas une continuation. %%',
        'Druhý.',
        '',
        '%% 901.0005 %%',
        '%% Troisième ligne. %%',
        '%% TR: kept the telegram style %%',
        '%% Pas une continuation. %%',
        'Třetí.',
        '',
        '%% 901.0006 %%',
        '%% Quatrième ligne. %%',
        'Čtvrtý.',
        '%% Pas une continuation. %%',
      ].join('\n')
    );

    for (const [id, expected] of [
      ['901.0003', 'Première ligne.'],
      ['901.0004', 'Deuxième ligne.'],
      ['901.0005', 'Troisième ligne.'],
      ['901.0006', 'Quatrième ligne.'],
    ]) {
      expect(paragraph('cz', '901', '1873-01-12', id)!.originalText).toBe(expected);
    }
  });

  it('ends the run at a blank line, an empty span or a second span on the line', () => {
    writeEntry(
      'cz',
      '901',
      '1873-01-13',
      [
        '%% 901.0007 %%',
        '%% Première ligne. %%',
        '',
        '%% Après un blanc. %%',
        'První.',
        '',
        '%% 901.0008 %%',
        '%% Deuxième ligne. %%',
        '%% %%',
        '%% Après un vide. %%',
        'Druhý.',
        '',
        '%% 901.0009 %%',
        '%% Troisième ligne. %% %% 2026-01-29T09:16:00 LAN: glued note %%',
        '%% Après une note collée. %%',
        'Třetí.',
      ].join('\n')
    );

    for (const [id, expected] of [
      ['901.0007', 'Première ligne.'],
      ['901.0008', 'Deuxième ligne.'],
      ['901.0009', 'Troisième ligne.'],
    ]) {
      expect(paragraph('cz', '901', '1873-01-13', id)!.originalText).toBe(expected);
    }
  });

  it('does not let a lone-%% multi-line block open a run', () => {
    writeEntry(
      'cz',
      '901',
      '1873-01-14',
      [
        '%% 901.0010 %%',
        '%% Première ligne du bloc',
        'seconde ligne du bloc. %%',
        '%% Pas une continuation. %%',
        'Překlad.',
      ].join('\n')
    );
    const p = paragraph('cz', '901', '1873-01-14', '901.0010');
    expect(p!.originalText).toBe('Première ligne du bloc seconde ligne du bloc.');
  });

  it('joins a heading-shaped source line with the line after it', () => {
    writeEntry(
      'cz',
      '901',
      '1873-11-21',
      [
        '%% 901.0011 %%',
        '%% # Vendredi 21 novembre 1873 %%',
        '%% Carnet N° 13 %%',
        '# Pátek 21. listopadu 1873',
        'Sešit č. 13',
      ].join('\n')
    );
    const p = paragraph('cz', '901', '1873-11-21', '901.0011');
    expect(p!.originalText).toBe('# Vendredi 21 novembre 1873\nCarnet N° 13');
  });
});
