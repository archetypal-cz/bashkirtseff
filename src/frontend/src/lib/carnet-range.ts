/**
 * Carnet range for a year ("Notebooks 001–012" / "Notebook 005").
 *
 * Takes the carnet ids the year pages already list (YearInfo.carnets /
 * getCarnetsByYear), so cross-year carnets count at both ends exactly as the
 * navigation treats them. Carnet 000 (preface, no dates) never appears in
 * those lists, so it never appears in a range either.
 */
export type CarnetRange =
  | { kind: 'none' }
  | { kind: 'single'; id: string }
  | { kind: 'range'; from: string; to: string };

export function carnetRange(carnetIds: readonly string[]): CarnetRange {
  if (carnetIds.length === 0) return { kind: 'none' };
  const sorted = [...carnetIds].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const from = sorted[0];
  const to = sorted[sorted.length - 1];
  return from === to ? { kind: 'single', id: from } : { kind: 'range', from, to };
}

/** i18n key + params for rendering a range (keys live under `diary.`). */
export function carnetRangeMessage(carnetIds: readonly string[]):
  { key: string; params: Record<string, string> } | null {
  const r = carnetRange(carnetIds);
  if (r.kind === 'none') return null;
  return r.kind === 'single'
    ? { key: 'diary.notebookTitle', params: { id: r.id } }
    : { key: 'diary.notebookRange', params: { from: r.from, to: r.to } };
}
