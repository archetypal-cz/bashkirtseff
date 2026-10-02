/**
 * Default open/closed state for calendars: collapsed on mobile, expanded from
 * the project's `md` breakpoint (768px) up. Client-only — server-rendered
 * markup must never depend on it (see carnet index.astro / UnifiedMenu.vue).
 */
export const CALENDAR_DESKTOP_QUERY = '(min-width: 768px)';

export function calendarDefaultOpen(
  matchMedia: ((q: string) => { matches: boolean }) | undefined = typeof window !== 'undefined'
    ? window.matchMedia?.bind(window)
    : undefined,
): boolean {
  // Unknown environment: expanded (the pre-existing behaviour on wide screens).
  if (!matchMedia) return true;
  return matchMedia(CALENDAR_DESKTOP_QUERY).matches;
}
