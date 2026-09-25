/**
 * Render-time typography for diary text: locale quotation marks, apostrophes
 * and French spacing.
 *
 * The content files are left untouched (the cz tree alone has ~25k `„…"` pairs
 * closed by an ASCII quote); the fix is applied to the rendered HTML. Only text
 * nodes are rewritten — tags and their attributes (href, class, id…), the
 * contents of <code>/<pre>/<script>/<style>, and bare URLs inside text are left
 * exactly as they are.
 *
 * Per-locale conventions:
 *   cs  „…“ (inner ‚…‘)          straight " → „ / “ by position
 *   uk  «…» (inner „…“)          apostrophe inside a word → ʼ (U+02BC)
 *   en  “…” (inner ‘…’)          apostrophe → ’
 *   fr  « … » (inner “…”)        U+202F narrow no-break space inside guillemets
 *                                and before ; : ! ?
 *   es  «…» (inner “…”)          per content/es/CLAUDE.md
 *
 * A straight double quote opens when it follows the start of the text,
 * whitespace or an opening bracket/dash, and closes otherwise. Its level is the
 * locale's outer pair unless it sits inside an already-open outer quotation.
 */

export type TypographyLocale = 'cs' | 'uk' | 'en' | 'fr' | 'es';

interface QuoteStyle {
  outer: [string, string];
  inner: [string, string];
  apostrophe: string;
}

const STYLES: Record<TypographyLocale, QuoteStyle> = {
  cs: { outer: ['„', '“'], inner: ['‚', '‘'], apostrophe: '’' },
  uk: { outer: ['«', '»'], inner: ['„', '“'], apostrophe: 'ʼ' },
  en: { outer: ['“', '”'], inner: ['‘', '’'], apostrophe: '’' },
  fr: { outer: ['«', '»'], inner: ['“', '”'], apostrophe: '’' },
  es: { outer: ['«', '»'], inner: ['“', '”'], apostrophe: '’' },
};

const NNBSP = ' ';

/** Map a content-path language code ('cz', 'original', …) to its typography. */
export function typographyLocaleFor(language: string): TypographyLocale {
  if (language === 'cz' || language === 'cs') return 'cs';
  if (language === 'original' || language === '_original') return 'fr';
  if (language === 'uk' || language === 'en' || language === 'fr' || language === 'es') return language;
  return 'fr';
}

/** Characters after which a straight quote opens rather than closes. */
const OPENING_CONTEXT = /[\s(\[{—–\-/«„‚“‘]/;
const LETTER = /[\p{L}\p{N}]/u;
const SKIP_ELEMENTS = new Set(['code', 'pre', 'script', 'style']);
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+/g;

/**
 * Opening and closing marks for quoting a UI string in `locale` (a UI locale
 * code: cs/uk/en/fr/es). French marks carry their narrow no-break spaces.
 */
export function quoteMarks(locale: string): [string, string] {
  const loc = typographyLocaleFor(locale);
  const [open, close] = STYLES[loc].outer;
  return loc === 'fr' ? [`${open}${NNBSP}`, `${NNBSP}${close}`] : [open, close];
}

/** Localised quotation marks around a UI string (template use). */
export function quote(text: string, locale: string): string {
  const [open, close] = quoteMarks(locale);
  return `${open}${text}${close}`;
}

/**
 * Apply locale typography to an HTML fragment (or plain text), touching text
 * nodes only.
 */
export function applyTypography(html: string, locale: TypographyLocale): string {
  if (!html) return html;
  const style = STYLES[locale];
  const tokens = html.split(/(<[^>]*>)/);
  let prev = '';          // last visible character, carried across text nodes
  const open: Array<'outer' | 'inner' | 'single'> = []; // quotation levels currently open
  const skipStack: string[] = [];

  const fixText = (text: string): string => {
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1] ?? '';
      let emitted = ch;

      if (ch === '"') {
        if (prev === '' || OPENING_CONTEXT.test(prev)) {
          const level = open.includes('outer') ? 'inner' : 'outer';
          open.push(level);
          emitted = style[level][0];
        } else {
          while (open[open.length - 1] === 'single') open.pop(); // unclosed ‚ inside
          const level = (open.pop() ?? 'outer') as 'outer' | 'inner';
          emitted = style[level][1];
        }
      } else if (ch === style.outer[0]) {
        open.push('outer'); // a typed opening mark („ in cs, « in uk/fr/es, “ in en)
      } else if (ch === style.outer[1]) {
        const idx = open.lastIndexOf('outer');
        if (idx !== -1) open.length = idx;
      } else if (locale === 'cs' && ch === '‚') {
        open.push('single'); // a typed low-9 opening mark (‚ in cs)
      } else if (ch === "'" && locale === 'cs' && open[open.length - 1] === 'single' && !(LETTER.test(prev) && LETTER.test(next))) {
        open.pop();
        emitted = style.inner[1]; // ‚…' → ‚…‘
      } else if (ch === "'") {
        if (LETTER.test(prev) && LETTER.test(next)) {
          emitted = style.apostrophe; // l'homme, don't, м'ясо
        } else if (locale === 'en') {
          // English single quotes: opening after space/start, else closing (or
          // a trailing possessive apostrophe — the same glyph).
          emitted = prev === '' || OPENING_CONTEXT.test(prev) ? '‘' : '’';
        } else if (LETTER.test(prev)) {
          emitted = '’'; // elided word end
        }
      }
      out += emitted;
      prev = /\s/.test(emitted) ? ' ' : emitted;
    }
    return locale === 'fr' ? frenchSpacing(out) : out;
  };

  const fixTextOutsideUrls = (text: string): string => {
    let result = '';
    let last = 0;
    for (const m of text.matchAll(URL_PATTERN)) {
      result += fixText(text.slice(last, m.index));
      result += m[0];
      prev = m[0].slice(-1);
      last = m.index! + m[0].length;
    }
    return result + fixText(text.slice(last));
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (i % 2 === 1) {
      // A tag: track elements whose contents must stay verbatim.
      const m = token.match(/^<\s*(\/)?\s*([a-zA-Z0-9]+)/);
      if (m) {
        const name = m[2].toLowerCase();
        if (SKIP_ELEMENTS.has(name)) {
          if (m[1]) skipStack.pop();
          else if (!token.endsWith('/>')) skipStack.push(name);
        }
        // Block boundaries reset the quote context.
        if (/^(br|p|div|h[1-6]|li)$/.test(name)) prev = '';
      }
      continue;
    }
    if (!token || skipStack.length > 0) continue;
    tokens[i] = fixTextOutsideUrls(token);
  }
  return tokens.join('');
}

/**
 * French spacing: narrow no-break space (U+202F) before ; : ! ? and inside
 * « », replacing an ordinary or no-break space where one is typed, and adding
 * one inside guillemets where none is. A colon or other mark with no space
 * before it (times like 10:30, "?!" runs) is left alone.
 */
function frenchSpacing(text: string): string {
  return text
    .replace(/[  ]+([;:!?])/g, `${NNBSP}$1`)
    .replace(/«[  ]*/g, `«${NNBSP}`)
    .replace(/[  ]*»/g, `${NNBSP}»`);
}
