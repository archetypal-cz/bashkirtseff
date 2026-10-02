import { describe, it, expect } from 'vitest';
import { carnetRange, carnetRangeMessage } from '../carnet-range';
import { createT } from '../../i18n/astro';

describe('carnetRange', () => {
  it('empty list', () => {
    expect(carnetRange([])).toEqual({ kind: 'none' });
    expect(carnetRangeMessage([])).toBeNull();
  });
  it('single carnet', () => {
    expect(carnetRange(['005'])).toEqual({ kind: 'single', id: '005' });
  });
  it('range uses min and max, regardless of order', () => {
    expect(carnetRange(['012', '001', '007'])).toEqual({ kind: 'range', from: '001', to: '012' });
  });
  it('cross-year carnet counts at both ends', () => {
    // 1873 holds 001-014 (014 continues into 1874); 1874 holds 014-028
    expect(carnetRange(['001', '014'])).toEqual({ kind: 'range', from: '001', to: '014' });
    expect(carnetRange(['014', '028'])).toEqual({ kind: 'range', from: '014', to: '028' });
  });
  it('renders localized strings', () => {
    const m = carnetRangeMessage(['001', '012'])!;
    expect(createT('cs')(m.key, m.params)).toBe('Sešity 001–012');
    expect(createT('en')(m.key, m.params)).toBe('Notebooks 001–012');
    expect(createT('es')(m.key, m.params)).toBe('Cuadernos 001–012');
    expect(createT('fr')(m.key, m.params)).toBe('Cahiers 001–012');
    expect(createT('uk')(m.key, m.params)).toBe('Зошити 001–012');
    const s = carnetRangeMessage(['005'])!;
    expect(createT('cs')(s.key, s.params)).toBe('Sešit 005');
    expect(createT('fr')(s.key, s.params)).toBe('Cahier 005');
  });
});
