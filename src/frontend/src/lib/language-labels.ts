/**
 * Labels for the languages a paragraph is written in, shown on the flip
 * buttons. Names come from Intl.DisplayNames in the reader's UI language, so
 * an English reader hears "Show original: French", not "Francouzsky".
 */

/** Small glyphs for the flip button (the fleur-de-lis stands for French). */
const LANGUAGE_SYMBOLS: Record<string, string> = {
  fr: '⚜',
  en: '♔',
  ru: '☆',
  it: '⚬',
  de: '✧',
  la: '∞',
  el: 'Ω',
  es: '◈',
  cz: 'cz',
  cs: 'cz',
};

/** Content-path codes that are not ISO 639-1 ('cz' is the /cz/ URL segment). */
function isoCode(code: string): string {
  return code === 'cz' ? 'cs' : code;
}

export function languageSymbol(code: string): string {
  return LANGUAGE_SYMBOLS[code] ?? code.toUpperCase();
}

const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

/**
 * "French" / "francouzština" / "французька" … for `code` in `uiLocale`.
 * Falls back to the upper-cased code where Intl.DisplayNames is unavailable.
 */
export function languageTitle(code: string, uiLocale: string): string {
  let names = displayNamesCache.get(uiLocale);
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames([uiLocale], { type: 'language' });
    } catch {
      names = null;
    }
    displayNamesCache.set(uiLocale, names);
  }
  const iso = isoCode(code);
  const name = names?.of(iso);
  return name && name !== iso ? name : code.toUpperCase();
}
