/**
 * Build-time behaviour added to content.ts for the reading view:
 * - French fallback: a translation paragraph whose embedded `%% French %%` copy
 *   was stripped gets the `_original` paragraph with the same ID;
 * - the French panel HTML (originalHtml) renders inline markdown;
 * - approval counts for the language badges; Marie's age in her final year.
 *
 * Same throwaway-content-tree pattern as comment-markers.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-fallback-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

let content: typeof import('../content');

function write(lang: string, carnet: string, entryId: string, frontmatter: string, body: string): void {
  const dir = path.join(contentRoot, lang, carnet);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${entryId}.md`), `---\n${frontmatter}\n---\n\n${body}\n`, 'utf-8');
}

beforeAll(async () => {
  write('_original', '950', '1875-03-27', 'date: 1875-03-27', [
    '%% 950.0001 %%',
    '# Samedi 27 mars 1875',
    '',
    '%% 950.0002 %%',
    'Ce matin *je me suis plainte à maman*[^950.2.1] de Lambertye.',
    '',
    '%% 950.0003 %%',
    'Troisième paragraphe.',
  ].join('\n'));
  // uk: embedded French stripped entirely.
  write('uk', '950', '1875-03-27', 'date: 1875-03-27\nworkflow:\n  conductor_approved: true', [
    '%% 950.0001 %%',
    '# Субота, 27 березня 1875',
    '',
    '%% 950.0002 %%',
    'Сьогодні вранці я *поскаржилася мамі*.',
    '',
    '%% 950.0003 %%',
    'Третій абзац.',
  ].join('\n'));
  // cz: embedded French present for 0002 (and different from _original, so
  // the test can tell which one won), missing for 0003.
  write('cz', '950', '1875-03-27', 'date: 1875-03-27\nconductor_approved: false', [
    '%% 950.0001 %%',
    '%% # Samedi 27 mars 1875 %%',
    '# Sobota 27. března 1875',
    '',
    '%% 950.0002 %%',
    '%% Ce matin (copie intégrée). %%',
    'Dnes ráno "jsem si stěžovala".',
    '',
    '%% 950.0003 %%',
    'Třetí odstavec.',
  ].join('\n'));
  write('fr', '950', '1875-03-27', 'date: 1875-03-27\nedition_complete: true', [
    '%% 950.0001 %%',
    '%% # Samedi 27 mars 1875 %%',
  ].join('\n'));
  write('fr', '950', '1875-03-28', 'date: 1875-03-28\nedition_complete: false', [
    '%% 950.0004 %%',
    '%% Rien. %%',
  ].join('\n'));

  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  content = await import('../content');
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('French fallback from _original', () => {
  it('fills every paragraph of a translation that lost its embedded French', () => {
    const entry = content.getEntry('950', '1875-03-27', 'uk')!;
    const byId = new Map(entry.paragraphs.map(p => [p.id, p]));
    expect(byId.get('950.0001')!.originalHtml).toBe(
      '<span class="original-date-heading">Samedi 27 mars 1875</span>'
    );
    expect(byId.get('950.0002')!.originalHtml).toBe(
      'Ce matin <em>je me suis plainte à maman</em> de Lambertye.'
    );
    expect(byId.get('950.0003')!.originalHtml).toBe('Troisième paragraphe.');
  });

  it('keeps embedded French where present and only fills the gaps', () => {
    const entry = content.getEntry('950', '1875-03-27', 'cz')!;
    const byId = new Map(entry.paragraphs.map(p => [p.id, p]));
    expect(byId.get('950.0002')!.originalText).toBe('Ce matin (copie intégrée).');
    expect(byId.get('950.0003')!.originalText).toBe('Troisième paragraphe.');
  });

  it('applies the translation language typography to the rendered paragraph', () => {
    const entry = content.getEntry('950', '1875-03-27', 'cz')!;
    const p = entry.paragraphs.find(x => x.id === '950.0002')!;
    expect(p.html).toContain('„jsem si stěžovala“');
    expect(p.text).toContain('"jsem si stěžovala"'); // source text untouched
  });

  it('gives the modern French edition no flip panel', () => {
    const entry = content.getEntry('950', '1875-03-27', 'fr')!;
    expect(entry.paragraphs.every(p => !p.originalHtml)).toBe(true);
  });
});

describe('approval counts', () => {
  it('reads conductor_approved (top-level or under workflow) and fr edition_complete', () => {
    expect([...content.getApprovedEntries('uk')]).toEqual(['950/1875-03-27']);
    expect([...content.getApprovedEntries('cz')]).toEqual([]);
    expect([...content.getApprovedEntries('fr')]).toEqual(['950/1875-03-27']);
  });

  it('isEntryApproved', () => {
    expect(content.isEntryApproved({ conductor_approved: true }, 'cz')).toBe(true);
    expect(content.isEntryApproved({ workflow: { conductor_approved: true } }, 'en')).toBe(true);
    expect(content.isEntryApproved({ conductor_approved: true }, 'fr')).toBe(false);
    expect(content.isEntryApproved({ edition_complete: true }, 'fr')).toBe(true);
  });
});

describe("Marie's age by calendar year", () => {
  it('spans two ages in ordinary years and one in 1884', () => {
    expect(content.getMarieAge(1873)).toBe('14–15');
    expect(content.getMarieAge(1883)).toBe('24–25');
    expect(content.getMarieAge(1884)).toBe('25');
  });
});
