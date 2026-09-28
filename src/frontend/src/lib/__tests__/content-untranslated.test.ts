/**
 * Untranslated paragraphs: scaffold/rebuild-carnet writes `TODO` as the visible
 * text of a paragraph not yet translated and `# TODO` for its day heading.
 * Readers must never see the placeholder: the paragraph shows the French
 * original under a "not yet translated" note, the heading the localized date,
 * a cover entry the localized cover label.
 *
 * Same throwaway-content-tree pattern as content-original-fallback.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-untranslated-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

let content: typeof import('../content');

function write(lang: string, carnet: string, entryId: string, frontmatter: string, body: string): void {
  const dir = path.join(contentRoot, lang, carnet);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${entryId}.md`), `---\n${frontmatter}\n---\n${body}\n`, 'utf-8');
}

/** Visible text of rendered HTML */
const plain = (html: string) => html.replace(/<[^>]*>/g, '');

beforeAll(async () => {
  write('_original', '951', '1876-12-12-cover', 'date: 1876-12-12', [
    '%% 951.0001 %%',
    '%% kind: cover source="page de titre" %%',
    'Gloriae Cupiditate[^951.0001.1]',
    'Livre 68ème',
  ].join('\n'));
  write('_original', '951', '1877-02-01', 'date: 1877-02-01', [
    '%% 951.0571 %%',
    '# Jeudi 1er février 1877',
    'Ces dames se disposaient d’aller à Monaco.',
    '',
    '%% 951.0572 %%',
    'Je n\'ai pas de chance, "voilà".',
    '',
    '%% 951.0573 %%',
    'Déjà traduit.',
  ].join('\n'));
  for (const lang of ['cz', 'en']) {
    write(lang, '951', '1876-12-12-cover', 'date: 1876-12-12', [
      '%% 951.0001 %%',
      '%% kind: cover source="page de titre" %%',
      '%% Gloriae Cupiditate[^951.0001.1] %%',
      '%% Livre 68ème %%',
      '%% 2026-09-27T22:40:54 LAN: keep the Latin. %%',
      'TODO',
      '',
      '[^951.0001.1]: Latin: "out of desire for glory".',
    ].join('\n'));
  }
  write('cz', '951', '1877-02-01', 'date: 1877-02-01', [
    '%% 951.0571 %%',
    '%% Jeudi 1er février 1877 %%',
    '%% Ces dames se disposaient d’aller à Monaco. %%',
    '# TODO',
    'TODO',
    '',
    '%% 951.0572 %%',
    '%% Je n\'ai pas de chance, "voilà". %%',
    'TODO',
    '',
    '%% 951.0573 %%',
    '%% Déjà traduit. %%',
    'Už přeloženo, a to docela dlouhou větou pro náhled.',
  ].join('\n'));

  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  content = await import('../content');
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('untranslated paragraphs', () => {
  it('never renders the TODO placeholder', () => {
    for (const [lang, id] of [['cz', '1877-02-01'], ['cz', '1876-12-12-cover'], ['en', '1876-12-12-cover']]) {
      const entry = content.getEntry('951', id, lang)!;
      expect(entry.title).not.toMatch(/TODO/);
      for (const p of entry.paragraphs) {
        expect(plain(p.html)).not.toMatch(/TODO/);
        expect(p.text).not.toMatch(/TODO/);
      }
    }
  });

  it('shows the French original under a localized note, in French typography', () => {
    const entry = content.getEntry('951', '1877-02-01', 'cz')!;
    const p = entry.paragraphs.find(x => x.id === '951.0572')!;
    expect(p.untranslated).toBe(true);
    expect(p.html).toContain('<div class="untranslated-original" lang="fr">');
    expect(p.html).toContain('<span class="untranslated-note" lang="cs">Zatím nepřeloženo — francouzský originál</span>');
    expect(p.html).toMatch(/«\s?voilà\s?»/u);
    expect(p.originalHtml).toBeUndefined(); // no flip to the same French
  });

  it('replaces a `# TODO` heading with the localized date and keeps the French body only', () => {
    const entry = content.getEntry('951', '1877-02-01', 'cz')!;
    expect(entry.title).toBe('Čtvrtek 1. února 1877');
    const p = entry.paragraphs.find(x => x.id === '951.0571')!;
    expect(p.html).toMatch(/^<h2 class="entry-date-heading">Čtvrtek 1\. února 1877<\/h2>/);
    expect(p.html).toContain('Ces dames se disposaient');
    expect(p.html).not.toContain('Jeudi'); // the French heading is not repeated
  });

  it('keeps the kind block and footnote refs of a cover paragraph', () => {
    const entry = content.getEntry('951', '1876-12-12-cover', 'en')!;
    expect(entry.title).toBe('Notebook cover');
    const p = entry.paragraphs[0];
    expect(p.html).toMatch(/^<div class="para-kind para-kind-cover" data-kind="cover">/);
    expect(p.html).toContain('Not yet translated — French original');
    expect(p.html).toContain('Gloriae Cupiditate');
    expect(p.footnoteRefs).toEqual(['951.0001.1']);
  });

  it('leaves translated paragraphs alone and keeps untranslated ones out of counts and previews', () => {
    const entry = content.getEntry('951', '1877-02-01', 'cz')!;
    const done = entry.paragraphs.find(x => x.id === '951.0573')!;
    expect(done.untranslated).toBeUndefined();
    expect(done.originalHtml).toBe('Déjà traduit.');
    expect(entry.wordCount).toBe(9);
    expect(content.getEntryPreview('951', '1877-02-01', 'cz')).toBe('Už přeloženo, a to docela dlouhou větou pro náhled.');
    expect(content.getEntryPreview('951', '1876-12-12-cover', 'cz')).toBeNull();
  });
});
