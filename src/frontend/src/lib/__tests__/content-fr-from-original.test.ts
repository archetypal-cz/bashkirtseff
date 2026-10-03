/**
 * French edition: a paragraph with no visible `fr` text renders from the
 * `_original` paragraph with the same ID (not from the embedded `%% … %%` copy,
 * which can be stale and shows a multi-line date heading as plain text).
 * Paragraphs with visible fr text stay as the edition wrote them.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-fr-orig-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

let content: typeof import('../content');

function write(lang: string, carnet: string, entryId: string, frontmatter: string, body: string): void {
  const dir = path.join(contentRoot, lang, carnet);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${entryId}.md`), `---\n${frontmatter}\n---\n\n${body}\n`, 'utf-8');
}

beforeAll(async () => {
  write('_original', '951', '1875-03-27', 'date: 1875-03-27', [
    '%% 951.0001 %%',
    '# Samedi 27 mars 1875',
    'Ce matin, il pleut.',
    '',
    '%% 951.0002 %%',
    'Texte *courant*[^951.2.1] de Marie.',
    '',
    '[^951.2.1]: English editorial note.',
    '',
    '%% 951.0006 %%',
    'Une phrase assez longue sans note du tout.',
    '',
    '%% 951.0005 %%',
    'Texte avec note[^951.5.9].',
    '',
    '[^951.5.9]: English note, id renumbered.',
    '',
    '%% 951.0003 %%',
    '%% kind: clipping source="Le Figaro" %%',
    'Coupure de presse.',
    '',
    '%% 951.0004 %%',
    'Texte source quatre.',
  ].join('\n'));
  write('fr', '951', '1875-03-27', 'date: 1875-03-27', [
    '%% 951.0001 %%',
    '%% Samedi 27 mars 1875', // embedded block: the heading lost its `#`
    'Ce matin, il pleut (copie périmée). %%',
    '',
    '%% 951.0002 %%',
    '%% Texte courant de Marie (copie périmée). %%',
    '',
    '%% 951.0003 %%',
    '%% Coupure périmée. %%',
    '',
    '%% 951.0004 %%',
    'Texte édité par la rédaction.',
    '%% Texte source quatre. %%',
    '',
    '%% 951.0005 %%',
    '%% Texte avec note[^951.5.1]. %%',
    '',
    '[^951.5.1]: Note française, ancien identifiant.',
    '',
    '%% 951.0006 %%',
    '%% Une phrase assez longue sans note[^951.6.1] du tout. %%',
    '',
    '[^951.6.1]: Note de l\'édition seule.',
    '',
    '%% 951.0099 %%',
    '%% Paragraphe sans équivalent dans _original. %%',
  ].join('\n'));
  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  content = await import('../content');
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('fr paragraphs without visible text', () => {
  const fr = () => new Map(content.getEntry('951', '1875-03-27', 'fr')!.paragraphs.map(p => [p.id, p]));
  const orig = () => new Map(content.getEntry('951', '1875-03-27', 'original')!.paragraphs.map(p => [p.id, p]));

  it('renders the date heading as a heading, from _original', () => {
    const p = fr().get('951.0001')!;
    expect(p.html).toMatch(/<h[1-6]|date-heading/);
    expect(p.html).toContain('Ce matin, il pleut.');
    expect(p.html).not.toContain('périmée');
    expect(p.text).toBe(orig().get('951.0001')!.text);
  });

  it('renders inline markup and drops an _original-only English note', () => {
    const entry = content.getEntry('951', '1875-03-27', 'fr')!;
    const p = entry.paragraphs.find(x => x.id === '951.0002')!;
    expect(p.html).toContain('<em>courant</em>');
    expect(p.html).not.toContain('périmée');
    expect(p.html).not.toContain('footnote-ref');
    expect(p.footnoteRefs).toBeUndefined();
    expect(entry.footnotes.some(f => /English/.test(f.text))).toBe(false);
  });

  it('keeps a French note attached when _original cites a new id', () => {
    const entry = content.getEntry('951', '1875-03-27', 'fr')!;
    const p = entry.paragraphs.find(x => x.id === '951.0005')!;
    expect(p.footnoteRefs).toEqual(['951.5.1']);
    expect(p.html).toContain('#fn-951.5.1');
    expect(entry.footnotes.map(f => f.id)).toContain('951.5.1');
  });

  it('re-inserts an edition-only French note marker at its anchor', () => {
    const entry = content.getEntry('951', '1875-03-27', 'fr')!;
    const p = entry.paragraphs.find(x => x.id === '951.0006')!;
    expect(p.footnoteRefs).toEqual(['951.6.1']);
    expect(p.text).toBe('Une phrase assez longue sans note[^951.6.1] du tout.');
  });

  it('takes the kind block from _original', () => {
    const p = fr().get('951.0003')!;
    expect(p.kind).toBe('clipping');
    expect(p.kindSource).toBe('Le Figaro');
    expect(p.html).toContain('Coupure de presse.');
    expect(p.html).not.toContain('périmée');
  });

  it('leaves a paragraph with visible fr text untouched', () => {
    const p = fr().get('951.0004')!;
    expect(p.text).toBe('Texte édité par la rédaction.');
    expect(p.html).toContain('Texte édité par la rédaction.');
    expect(p.html).not.toContain('source quatre');
  });

  it('keeps the embedded copy when _original has no such paragraph', () => {
    const p = fr().get('951.0099')!;
    expect(p.text).toBe('Paragraphe sans équivalent dans _original.');
    expect(p.html).toContain('Paragraphe sans équivalent');
  });

  it('does not leak the internal flag', () => {
    for (const p of fr().values()) expect(p.embeddedFrench).toBeUndefined();
  });
});
