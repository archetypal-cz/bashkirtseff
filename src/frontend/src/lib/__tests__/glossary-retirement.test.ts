/**
 * Retired glossary stubs (`status: retired`, `replaced_by:`): hidden from
 * listings, tags resolve to the replacement, filter index files the
 * replacement under its own category. Throwaway content tree, as in
 * marie-works.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildGlossaryRedirectMap, readRetirementInfo } from '../glossary-retirement';
import { buildFilterIndex } from '../filter-index-builder';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-retired-'));
const contentRoot = path.join(tmpRoot, 'content');
const fakeCwd = path.join(tmpRoot, 'src', 'frontend');

let content: typeof import('../content');

function writeGlossary(category: string, id: string, frontmatter: string): void {
  const dir = path.join(contentRoot, '_original', '_glossary', ...category.split('/'));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.md`), `---\nid: ${id}\n${frontmatter}\n---\n\nBody of ${id}.\n`, 'utf-8');
}

const tag = (cat: string, id: string) => `%% [#${id}](../_glossary/${cat}/${id}.md) %%`;

beforeAll(async () => {
  writeGlossary('people/mentioned', 'LIVE_PERSON', 'name: Live Person');
  writeGlossary('people/mentioned', 'OLD_STUB', 'name: Old Stub\nstatus: retired\nreplaced_by: LIVE_PERSON');
  writeGlossary('people/mentioned', 'CHAINED', 'name: Chained\nstatus: retired\nreplaced_by: OLD_STUB');
  writeGlossary('people/mentioned', 'EMPTY_STUB', 'name: Empty Stub\nstatus: retired');
  writeGlossary('places/hotels', 'HOTEL_MISFILED', 'name: Misfiled\nstatus: retired\nreplaced_by: LIVE_PERSON');

  const carnet = path.join(contentRoot, '_original', '001');
  fs.mkdirSync(carnet, { recursive: true });
  fs.writeFileSync(path.join(carnet, '1873-01-11.md'), [
    '---', 'date: 1873-01-11', 'carnet: "001"', 'entities:', '  places: [HOTEL_MISFILED]', '  people: [EMPTY_STUB]', '---', '',
    '%% 001.0001 %%',
    tag('people/mentioned', 'OLD_STUB'),
    tag('people/mentioned', 'LIVE_PERSON'),
    'Samedi 11 janvier 1873. Texte.', '',
    '%% 001.0002 %%',
    tag('people/mentioned', 'CHAINED'),
    tag('people/mentioned', 'EMPTY_STUB'),
    'Encore du texte.', '',
  ].join('\n'), 'utf-8');

  fs.mkdirSync(fakeCwd, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(fakeCwd);
  content = await import('../content');
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('buildGlossaryRedirectMap', () => {
  it('collapses chains and skips dead ends and cycles', () => {
    const map = buildGlossaryRedirectMap([
      { id: 'A', retired: true, replacedBy: 'B' },
      { id: 'B', retired: true, replacedBy: 'C' },
      { id: 'C' },
      { id: 'D', retired: true, replacedBy: 'MISSING' },
      { id: 'E', retired: true, replacedBy: 'F' },
      { id: 'F', retired: true, replacedBy: 'E' },
      { id: 'G', retired: true },
      { id: 'H', replacedBy: 'C' }, // not retired: replaced_by alone does nothing
    ]);
    expect(Object.fromEntries(map)).toEqual({ A: 'C', B: 'C' });
  });

  it('reads status and replaced_by from frontmatter only', () => {
    expect(readRetirementInfo('X', '---\nstatus: retired\nreplaced_by: "Y"\n---\nstatus: live\n'))
      .toEqual({ id: 'X', retired: true, replacedBy: 'Y' });
    expect(readRetirementInfo('X', '---\nname: X\n---\nstatus: retired\n'))
      .toEqual({ id: 'X', retired: false, replacedBy: undefined });
  });
});

describe('glossary listings', () => {
  it('leave out retired entries unless asked', () => {
    expect(content.getGlossaryEntries().map(e => e.id)).toEqual(['LIVE_PERSON']);
    expect(content.getMergedGlossaryEntries('cz').map(e => e.id)).toEqual(['LIVE_PERSON']);
    const all = content.getMergedGlossaryEntries('original', { includeRetired: true });
    expect(all.map(e => e.id).sort()).toEqual(['CHAINED', 'EMPTY_STUB', 'HOTEL_MISFILED', 'LIVE_PERSON', 'OLD_STUB']);
    expect(all.find(e => e.id === 'OLD_STUB')).toMatchObject({ retired: true, replacedBy: 'LIVE_PERSON' });
  });

  it('category tree and search skip retired entries', () => {
    const ids = content.getGlossaryByCategory().flatMap(t => t.subCategories.flatMap(s => s.entries.map(e => e.id)));
    expect(ids).toEqual(['LIVE_PERSON']);
    expect(content.searchGlossary('stub')).toEqual([]);
  });
});

describe('references to retired ids', () => {
  it('resolve to the live replacement', () => {
    expect(content.resolveGlossaryId('OLD_STUB')).toBe('LIVE_PERSON');
    expect(content.resolveGlossaryId('CHAINED')).toBe('LIVE_PERSON');
    expect(content.resolveGlossaryId('EMPTY_STUB')).toBe('EMPTY_STUB');
    expect(content.resolveGlossaryId('LIVE_PERSON')).toBe('LIVE_PERSON');
    expect(content.isRetiredGlossaryId('EMPTY_STUB')).toBe(true);
  });

  it('diary tags point at the replacement, merged duplicates dropped', () => {
    const entry = content.getEntry('001', '1873-01-11', 'original')!;
    const [p1, p2] = entry.paragraphs;
    expect(p1.glossaryTags?.map(t => [t.id, t.name])).toEqual([['LIVE_PERSON', 'Live Person']]);
    expect(p2.glossaryTags?.map(t => t.id)).toEqual(['LIVE_PERSON', 'EMPTY_STUB']);
  });

  it('usage counts land on the replacement', () => {
    const counts = content.buildGlossaryUsageCounts();
    expect(counts.LIVE_PERSON).toBe(3);
    expect(counts.OLD_STUB).toBeUndefined();
  });

  it('filter index: replacement filed under its own category, stub without one dropped', () => {
    const index = buildFilterIndex(contentRoot);
    expect(index.entries[0].p).toEqual(['LIVE_PERSON']);
    expect(index.entries[0].pl).toBeUndefined();
  });
});
