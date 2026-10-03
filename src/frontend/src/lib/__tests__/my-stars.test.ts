import { describe, it, expect } from 'vitest';
import {
  parseParagraphId,
  diaryLangForLocale,
  buildStarHref,
  resolveStar,
  groupByCarnet,
  carnetsNeeded,
  buildExport,
  exportFilename,
  entryDate,
  type IndexFile,
} from '../my-stars';

const cz: IndexFile = { '0145': ['1873-08-11', 'cz snippet'] };
const orig: IndexFile = { '0145': ['1873-08-11', 'fr snippet'], '0146': ['1875-08-27-28', 'fr 146'] };
const pref: IndexFile = { '0003': [null, 'preface fr'] };

describe('parseParagraphId', () => {
  it('parses CCC.NNNN and rejects DROPPED/garbage', () => {
    expect(parseParagraphId('008.0145')).toEqual({ carnet: '008', para: '0145' });
    expect(parseParagraphId('008.DROPPED-0145')).toBeNull();
    expect(parseParagraphId('GLO_X')).toBeNull();
  });
});

describe('diaryLangForLocale', () => {
  it('maps UI locales to diary languages; es (staged) falls back to the original', () => {
    expect(diaryLangForLocale('cs')).toEqual({ urlPath: 'cz', translated: true });
    expect(diaryLangForLocale('en')).toEqual({ urlPath: 'en', translated: true });
    expect(diaryLangForLocale('es')).toEqual({ urlPath: 'original', translated: false });
  });
});

describe('buildStarHref', () => {
  it('links entries and carnet 000 (null entry) with trailing slash + anchor', () => {
    expect(buildStarHref('cz', '008', '1873-08-11', '0145')).toBe('/cz/008/1873-08-11/#p-008-0145');
    expect(buildStarHref('en', '008', '1875-08-27-28', '0146')).toBe('/en/008/1875-08-27-28/#p-008-0146');
    expect(buildStarHref('cz', '000', null, '0003')).toBe('/cz/000/#p-000-0003');
  });
});

describe('resolveStar', () => {
  it('uses the language row when present', () => {
    const r = resolveStar('008.0145', 'cz', cz, orig);
    expect(r).toMatchObject({ snippet: 'cz snippet', fromOriginal: false, missing: false, href: '/cz/008/1873-08-11/#p-008-0145' });
  });
  it('falls back per row to the original and links the original tree', () => {
    const r = resolveStar('008.0146', 'cz', cz, orig);
    expect(r).toMatchObject({ snippet: 'fr 146', fromOriginal: true, href: '/original/008/1875-08-27-28/#p-008-0146' });
  });
  it('falls back when the language file is missing', () => {
    expect(resolveStar('008.0145', 'uk', null, orig).fromOriginal).toBe(true);
  });
  it('handles 000 rows [null, snippet]', () => {
    const r = resolveStar('000.0003', 'cz', null, pref);
    expect(r).toMatchObject({ entry: null, snippet: 'preface fr', href: '/original/000/#p-000-0003' });
    expect(resolveStar('000.0003', 'cz', { '0003': [null, 'x'] }, pref).href).toBe('/cz/000/#p-000-0003');
  });
  it('state: ok when the row is found, even if the other file failed by network', () => {
    expect(resolveStar('008.0145', 'cz', null, orig, { lang: true })).toMatchObject({ state: 'ok', missing: false });
    expect(resolveStar('008.0145', 'cz', cz, null, { original: true })).toMatchObject({ state: 'ok', fromOriginal: false });
  });
  it('state: unavailable when no row and a relevant file failed by network', () => {
    expect(resolveStar('008.9999', 'cz', null, orig, { lang: true })).toMatchObject({ state: 'unavailable', missing: true, href: null });
    expect(resolveStar('008.9999', 'cz', cz, null, { original: true })).toMatchObject({ state: 'unavailable' });
    // the language file is irrelevant for the original tree
    expect(resolveStar('008.9999', 'original', null, orig, { lang: true }).state).toBe('missing');
  });
  it('state: missing when the files loaded or 404ed and lack the row, or the id is DROPPED', () => {
    expect(resolveStar('008.9999', 'cz', cz, orig).state).toBe('missing');
    expect(resolveStar('008.9999', 'cz', null, orig, {}).state).toBe('missing');
    expect(resolveStar('008.DROPPED-0145', 'cz', null, null, { lang: true, original: true }).state).toBe('missing');
  });
  it('marks DROPPED and unknown ids missing', () => {
    expect(resolveStar('008.DROPPED-0145', 'cz', cz, orig)).toMatchObject({ missing: true, href: null, carnet: null });
    expect(resolveStar('008.9999', 'cz', cz, orig)).toMatchObject({ missing: true, carnet: '008' });
  });
  it('original lang is not a fallback', () => {
    expect(resolveStar('008.0145', 'original', null, orig).fromOriginal).toBe(false);
  });
});

describe('groupByCarnet', () => {
  it('sorts in diary order, groups by carnet, unresolvable carnet-less ids last', () => {
    const rs = ['010.0002', '008.DROPPED-0001', '008.0145', '002.0009', '010.0001'].map((id) => resolveStar(id, 'cz', cz, orig));
    const g = groupByCarnet(rs);
    expect(g.map((x) => x.carnet)).toEqual(['002', '008', '010', null]);
    expect(g[2].items.map((i) => i.id)).toEqual(['010.0001', '010.0002']);
  });
});

describe('carnetsNeeded', () => {
  it('is unique, sorted, parseable only', () => {
    expect(carnetsNeeded(['010.0002', '008.0145', '010.0001', '008.DROPPED-0001'])).toEqual(['008', '010']);
  });
});

describe('export', () => {
  it('merges server metadata and resolved entry/snippet', () => {
    const rs = ['008.0145', '000.0003'].map((id) => resolveStar(id, 'cz', cz, { ...orig, ...pref }));
    const out = buildExport(rs, [{ paragraph_id: '008.0145', language: 'cz', created_at: '2026-10-01T00:00:00Z' }]);
    expect(out.count).toBe(2);
    expect(out.stars[0]).toMatchObject({ id: '000.0003', language: null, created_at: null, entry: null });
    expect(out.stars[1]).toEqual({ id: '008.0145', language: 'cz', created_at: '2026-10-01T00:00:00Z', entry: '1873-08-11', snippet: 'cz snippet' });
  });
  it('names the file with the date', () => {
    expect(exportFilename(new Date('2026-10-03T12:00:00Z'))).toBe('bashkirtseff-stars-2026-10-03.json');
  });
});

describe('entryDate', () => {
  it('reads the leading date of range ids; null for 000', () => {
    expect(entryDate('1875-08-27-28')?.toISOString().slice(0, 10)).toBe('1875-08-27');
    expect(entryDate(null)).toBeNull();
  });
});
