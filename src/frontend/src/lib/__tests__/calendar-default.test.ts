import { describe, it, expect } from 'vitest';
import { calendarDefaultOpen, CALENDAR_DESKTOP_QUERY } from '../calendar-default';

describe('calendarDefaultOpen', () => {
  it('is open at desktop/tablet widths', () => {
    expect(calendarDefaultOpen(() => ({ matches: true }))).toBe(true);
  });
  it('is collapsed at mobile widths', () => {
    expect(calendarDefaultOpen(() => ({ matches: false }))).toBe(false);
  });
  it('uses the 768px md breakpoint', () => {
    let seen = '';
    calendarDefaultOpen((q) => ((seen = q), { matches: true }));
    expect(seen).toBe(CALENDAR_DESKTOP_QUERY);
    expect(seen).toContain('768px');
  });
  it('falls back to open without matchMedia', () => {
    expect(calendarDefaultOpen(undefined)).toBe(true);
  });
});
