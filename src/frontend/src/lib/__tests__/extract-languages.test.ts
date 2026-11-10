/**
 * extractLanguages(): language tags are file ids (ENGLISH) while LANGUAGE_TAGS
 * is keyed English, so the lookup is case-insensitive; French stays first so a
 * French paragraph with one Italian phrase keeps lang="fr" in the flip panel.
 */
import { describe, it, expect } from 'vitest';
import { extractLanguages, tagLanguage } from '../content';

describe('extractLanguages', () => {
  it('matches tag file ids and names in any case', () => {
    expect(tagLanguage('ENGLISH')).toBe('en');
    expect(tagLanguage('Italian')).toBe('it');
    expect(tagLanguage('latin')).toBe('la');
    expect(tagLanguage('PARIS')).toBeUndefined();
  });

  it('keeps French first and adds each tagged language once', () => {
    expect(extractLanguages([{ id: 'ITALIAN', name: 'Italian' }])).toEqual(['fr', 'it']);
    expect(extractLanguages([
      { id: 'NICE', name: 'Nice' },
      { id: 'ENGLISH', name: 'ENGLISH' },
      { id: 'LATIN', name: 'Latin' },
      { id: 'ENGLISH', name: 'English' },
    ])).toEqual(['fr', 'en', 'la']);
  });

  it('is plain French without language tags', () => {
    expect(extractLanguages([])).toEqual(['fr']);
    expect(extractLanguages([{ id: 'NICE', name: 'Nice' }])).toEqual(['fr']);
  });
});
