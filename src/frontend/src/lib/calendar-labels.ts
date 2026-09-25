/**
 * Month and weekday labels for the carnet calendar, in the reader's UI
 * language (it used to hardcode Czech: "Leden", "Po Út St …").
 */

const INTL_LOCALE: Record<string, string> = {
  cs: 'cs-CZ',
  uk: 'uk-UA',
  en: 'en-GB',
  fr: 'fr-FR',
  es: 'es-ES',
};

function intlLocale(uiLocale: string): string {
  return INTL_LOCALE[uiLocale] ?? uiLocale;
}

/** Stand-alone month name ("leden", "January", "січень"), capitalised. */
export function monthName(month: number, uiLocale: string): string {
  const locale = intlLocale(uiLocale);
  const name = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2001, month - 1, 1)));
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/** Two-letter weekday labels, Monday first ("Po", "Mo", "Пн", "Lu"). */
export function weekdayLabels(uiLocale: string): string[] {
  const locale = intlLocale(uiLocale);
  const format = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  // 2001-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) => {
    const label = format.format(new Date(Date.UTC(2001, 0, 1 + i))).replace(/\.$/, '').slice(0, 2);
    return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
  });
}
