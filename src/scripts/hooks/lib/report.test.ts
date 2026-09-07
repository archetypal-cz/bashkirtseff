import { describe, expect, it } from 'vitest';
import { buildResultsRows } from './report.js';

// Regression for the duplicated-row bug in the session-end draft reports
// (2026-09-05..07 stubs carried each carnet 3-5x, once per language touched).
describe('buildResultsRows', () => {
  const count = (lang: string, carnet: string) => `${lang}/${carnet}`.length;

  it('emits each carnet of the primary language exactly once, sorted', () => {
    const rows = buildResultsRows('cz', ['092', '085', '092', '088'], count);
    expect(rows).toEqual([
      '| 085 | 6 | — | — | — |',
      '| 088 | 6 | — | — | — |',
      '| 092 | 6 | — | — | — |',
    ]);
  });

  it('counts entries in the primary tree only, never a sibling language', () => {
    const seen: string[] = [];
    buildResultsRows('uk', ['001'], (lang, carnet) => {
      seen.push(`${lang}/${carnet}`);
      return 0;
    });
    expect(seen).toEqual(['uk/001']);
  });

  it('returns no rows for an empty carnet list', () => {
    expect(buildResultsRows('en', [], count)).toEqual([]);
  });
});
