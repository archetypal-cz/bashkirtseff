/**
 * The label of a saved reading position on "Continue reading" buttons: the
 * entry's date in the reader's language ("11. ledna 1873"), or the notebook
 * ("Sešit 000") for an entry without a date (the preface), never the raw
 * paragraph ID.
 */
export function readingPositionLabel(
  item: { entryDate?: string; carnet?: string; paragraphId?: string },
  locale: string,
  notebookLabel: string,
): string {
  const date = item.entryDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (date) {
    try {
      return new Date(Date.UTC(+date[1], +date[2] - 1, +date[3])).toLocaleDateString(locale, {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
      });
    } catch { /* unknown locale: fall through */ }
  }
  const carnet = item.carnet ?? item.paragraphId?.split('.')[0];
  return carnet ? `${notebookLabel} ${carnet}` : '';
}
