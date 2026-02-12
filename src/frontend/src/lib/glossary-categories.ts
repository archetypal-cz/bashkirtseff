/**
 * Shared glossary category icons and colors
 * Used by ParagraphMenu, GlossaryCategoryBrowser, and GlossarySearch
 */

export const CATEGORY_ICONS: Record<string, string> = {
  // people: person outline
  people: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  // places: map pin
  places: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  // culture: book open
  culture: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  // themes: tag/label
  themes: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  // society: users/group
  society: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  // languages: chat bubble
  languages: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

export const CATEGORY_COLORS: Record<string, { light: string; dark: string }> = {
  people: { light: '#B45309', dark: '#D97706' },
  places: { light: '#2563EB', dark: '#3B82F6' },
  culture: { light: '#7C3AED', dark: '#8B5CF6' },
  themes: { light: '#059669', dark: '#10B981' },
  society: { light: '#059669', dark: '#10B981' },
  languages: { light: '#D97706', dark: '#F59E0B' },
};

/**
 * Culture subcategories that belong to the "themes" virtual category
 * (daily life topics, rather than arts & knowledge)
 */
export const THEME_SUBCATEGORIES = new Set([
  'daily_life', 'fashion', 'health', 'themes', 'transport',
  'social_customs', 'institutions', 'languages',
]);

export function getCategoryIcon(category?: string): string {
  const topCat = (category || '').split('/')[0];
  return CATEGORY_ICONS[topCat] || CATEGORY_ICONS.people;
}

export function getCategoryColor(category?: string, isDark = false): string {
  const topCat = (category || '').split('/')[0];
  const colors = CATEGORY_COLORS[topCat] || CATEGORY_COLORS.people;
  return isDark ? colors.dark : colors.light;
}
