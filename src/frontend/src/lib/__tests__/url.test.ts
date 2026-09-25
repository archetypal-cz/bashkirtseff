import { describe, it, expect } from 'vitest';
import { withTrailingSlash } from '../url';
import { buildHreflangAlternates, diaryUrl, glossaryUrl, getDiaryLang } from '../diary-lang-config';

describe('withTrailingSlash', () => {
  it('appends a slash to page paths', () => {
    expect(withTrailingSlash('/cz/001/1873-01-11')).toBe('/cz/001/1873-01-11/');
    expect(withTrailingSlash('/original')).toBe('/original/');
  });

  it('keeps query and hash after the slash', () => {
    expect(withTrailingSlash('/cz/001/1873-01-11#p-001-0002')).toBe('/cz/001/1873-01-11/#p-001-0002');
    expect(withTrailingSlash('/cz/?x=1')).toBe('/cz/?x=1');
    expect(withTrailingSlash('/home/en?source=pwa')).toBe('/home/en/?source=pwa');
  });

  it('leaves slash-terminated paths, files and absolute URLs with a file alone', () => {
    expect(withTrailingSlash('/')).toBe('/');
    expect(withTrailingSlash('/cz/')).toBe('/cz/');
    expect(withTrailingSlash('/sitemap-index.xml')).toBe('/sitemap-index.xml');
    expect(withTrailingSlash('https://bashkirtseff.org/data/filter-index.json')).toBe('https://bashkirtseff.org/data/filter-index.json');
  });

  it('handles absolute URLs', () => {
    expect(withTrailingSlash('https://bashkirtseff.org/cz/001')).toBe('https://bashkirtseff.org/cz/001/');
  });
});

describe('diary link builders emit slash-terminated URLs', () => {
  it('diaryUrl / glossaryUrl', () => {
    const cz = getDiaryLang('cz');
    expect(diaryUrl(cz, '001', '1873-01-11')).toBe('/cz/001/1873-01-11/');
    expect(glossaryUrl(cz, 'NICE')).toBe('/cz/glossary/NICE/');
  });

  it('hreflang alternates point at the final URL', () => {
    for (const a of buildHreflangAlternates('001/1873-01-11')) {
      expect(a.href.endsWith('/1873-01-11/')).toBe(true);
    }
    for (const a of buildHreflangAlternates('')) {
      expect(a.href.endsWith('/')).toBe(true);
    }
  });
});
