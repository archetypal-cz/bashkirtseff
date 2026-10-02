/**
 * Localised theme names.
 *
 * The filter index is language-neutral, so its theme tags carry the glossary
 * `name:` (English). Each locale file has a `themes.<ID>` label; this resolves
 * it, falling back to whatever name the caller already has.
 */

/** Retired themes the audit no longer emits; hidden from the filter. */
export const RETIRED_THEMES = new Set(['DISEASES', 'FEMINISM']);

export function themeName(
  t: (key: string) => string,
  id: string,
  fallback: string,
): string {
  const key = `themes.${id}`;
  const label = t(key);
  return label && label !== key ? label : fallback;
}
