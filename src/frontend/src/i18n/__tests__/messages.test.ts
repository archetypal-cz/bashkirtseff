import { describe, it, expect } from 'vitest';
import { resolveMessage } from '../messages';
import { createT } from '../astro';
import cs from '../locales/cs.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import uk from '../locales/uk.json';
import es from '../locales/es.json';

describe('resolveMessage plurals', () => {
  it('Czech: one / few / other', () => {
    const t = createT('cs');
    expect(t('paragraph.relatedItems', { count: 1 })).toBe('1 související položka');
    expect(t('paragraph.relatedItems', { count: 3 })).toBe('3 související položky');
    expect(t('paragraph.relatedItems', { count: 5 })).toBe('5 souvisejících položek');
    expect(t('diary.wordCount', { count: 3132 })).toBe('3 132 slov');
  });

  it('Ukrainian: 21 → one, 22 → few, 25 → many (falls back to other)', () => {
    const t = createT('uk');
    expect(t('diary.entryCount', { count: 21 })).toBe('21 запис');
    expect(t('diary.entryCount', { count: 22 })).toBe('22 записи');
    expect(t('diary.entryCount', { count: 25 })).toBe('25 записів');
  });

  it('English / French / Spanish: one / other', () => {
    expect(createT('en')('diary.wordCount', { count: 1 })).toBe('1 word');
    expect(createT('en')('diary.wordCount', { count: 3132 })).toBe('3,132 words');
    expect(createT('fr')('diary.notebookCount', { count: 1 })).toBe('1 cahier');
    expect(createT('es')('diary.sectionCount', { count: 2 })).toBe('2 secciones');
  });

  it('plain strings and missing keys behave as before', () => {
    expect(resolveMessage({ a: { b: 'x {y}' } }, 'a.b', 'en', { y: 1 })).toBe('x 1');
    expect(resolveMessage({}, 'a.b', 'en')).toBe('a.b');
  });

  it('every plural message has an `other` form in every locale', () => {
    const plurals = (tree: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(tree).flatMap(([k, v]) => {
        if (!v || typeof v !== 'object') return [];
        const obj = v as Record<string, unknown>;
        if ('one' in obj || 'other' in obj) return [`${prefix}${k}`];
        return plurals(obj, `${prefix}${k}.`);
      });
    for (const [name, tree] of Object.entries({ cs, en, fr, uk, es })) {
      for (const key of plurals(tree)) {
        const node = key.split('.').reduce<any>((o, p) => o[p], tree);
        expect(node.other, `${name}:${key}`).toBeTypeOf('string');
      }
    }
  });
});
