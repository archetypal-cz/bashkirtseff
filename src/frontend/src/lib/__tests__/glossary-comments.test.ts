/**
 * Glossary `%% … %%` comments must never render as visible text.
 *
 * ART_PRACTICE leaked its closing RSR notes: the last cluster opens with a
 * `## Sources` heading, and prose after a heading took a path that never
 * stripped comments. Multi-line notes and notes containing URL-encoded `%`
 * leaked through the line-based and `[^%]*` strippers as well.
 *
 * Same throwaway-content-tree pattern as comment-markers.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-glocomments-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

let content: typeof import('../content');

function writeGlossary(category: string, id: string, frontmatter: string, body: string): void {
  const dir = path.join(contentRoot, '_original', '_glossary', category);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.md`), `---\n${frontmatter}\n---\n\n${body}\n`, 'utf-8');
}

beforeAll(async () => {
  writeGlossary('culture/themes', 'TEST_THEME', 'name: Test theme', [
    '# Test theme',
    '',
    '%% GLO_TEST_THEME.0001 %%',
    '%% [#Salon](../art/SALON.md) %%',
    '%% 2026-01-01T00:00:00 RSR: a note that',
    'wraps onto a second line LEAK_A %%',
    'Visible intro.',
    '',
    '%% GLO_TEST_THEME.0002 %%',
    '## Sources',
    '',
    '- [Example](https://example.org/a%C3%A9)',
    '',
    '%% 2026-02-10T20:00:00 RSR: closing note LEAK_B %%',
    '%% 2026-05-24T14:00:00 RSR: encoded %C3%A9 note LEAK_C %%',
  ].join('\n'));

  writeGlossary('culture/art', 'OLD_FORMAT', 'name: Old format', [
    '# Old format',
    '',
    'Plain body.',
    '',
    '%% note with a 100% sign LEAK_D %%',
    '%% multi-line',
    '## not a heading LEAK_E',
    'note %%',
  ].join('\n'));

  writeGlossary('culture/art', 'BLOCKS', 'name: Blocks', [
    '# Blocks',
    '',
    '%% GLO_BLOCKS.0001 %%',
    'Intro line.',
    '- **1880** -- first',
    '- second, wrapped',
    '  onto two lines',
    '',
    '%% GLO_BLOCKS.0002 %%',
    '| | Count |',
    '|---|---|',
    '| Works | **229** |',
    '',
    '%% GLO_BLOCKS.0003 %%',
    'Plain prose',
    'soft-wrapped.',
  ].join('\n'));

  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  content = await import('../content');
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('glossary comment stripping', () => {
  it('drops comments after a heading, multi-line comments, and encoded-% comments', () => {
    const entry = content.getGlossaryEntry('TEST_THEME')!;
    const html = entry.paragraphs!.map(p => p.html).join('\n');
    expect(html).toContain('Visible intro.');
    expect(html).toContain('Sources');
    expect(html).toContain('https://example.org/a%C3%A9');
    expect(html).not.toMatch(/LEAK_|%%|RSR:/);
  });

  it('does not promote a heading-shaped line inside a comment', () => {
    const entry = content.getGlossaryEntry('TEST_THEME')!;
    expect(entry.paragraphs!.filter(p => p.isHeader).map(p => p.text)).toEqual(['## Sources']);
  });

  it('stripGlossaryComments handles old-format bodies', () => {
    const entry = content.getGlossaryEntry('OLD_FORMAT')!;
    const stripped = content.stripGlossaryComments(entry.content);
    expect(stripped).toContain('Plain body.');
    expect(stripped).not.toMatch(/LEAK_|%%/);
  });

  it('renders lists and tables as blocks, prose as before', () => {
    const [list, table, prose] = content.getGlossaryEntry('BLOCKS')!.paragraphs!;
    expect(list.isBlock).toBe(true);
    expect(list.html).toBe('<p>Intro line.</p>\n<ul><li><strong>1880</strong> -- first</li><li>second, wrapped onto two lines</li></ul>');
    expect(table.html).toContain('<thead><tr><th></th><th>Count</th></tr></thead><tbody><tr><td>Works</td><td><strong>229</strong></td></tr></tbody>');
    expect(table.html).not.toContain('---');
    expect(prose.isBlock).toBeUndefined();
    expect(prose.html).toBe('Plain prose soft-wrapped.');
  });
});
