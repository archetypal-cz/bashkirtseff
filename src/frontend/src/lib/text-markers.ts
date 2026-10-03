/**
 * Bracketed manuscript markers in the diary text: the editors' notes on what
 * Marie did on the page, carried inline in every tree in its own language:
 *
 *   _original  [Rayé: exploit]   [Mots noircis: …]      [Dans la marge: …]  [En travers: …]
 *   cz         [Škrtnuto: čin]   [Začerněná slova: …]   [Na okraji: …]      [Napříč stránkou: …]
 *   uk         [Викреслено: …]   [Замазано: …]          [На полях: …]       [Навскоси: …]
 *   en         [Crossed out: …]  [words blacked out: …] [In the margin: …]  [Written across the page: …]
 *
 * The reader never sees the bracket and prefix (owner ruling 2026-10-03, report
 * 046.0273): struck and blacked-out words render as <del> of the words alone
 * (the localized "struck out" only as a tooltip / for screen readers); margin
 * and across-the-page notes keep a small inline label, since nothing else
 * marks them. Whole paragraphs that are one marker get a compact block from
 * paragraph-kind.ts instead (see `unwrapWholeMark`).
 *
 * The prefix vocabulary is open-ended (counts, variants, typos: "Deux lignes
 * cancellées", "Zrušeny 2 řádky", "Mots noircsi"), so prefixes are classified
 * by keyword, not by a fixed list. Prefixes that match no keyword (Annotation,
 * Poznámka, Page intercalée, …) are left as they are.
 */
import { createT, contentPathToLocale } from '../i18n/astro';

export type MarkType = 'struck' | 'blacked' | 'margin' | 'across';

// Order matters: a mixed prefix ("Rayé et noirci", "Na okraji a přepsáno přes
// text", "In the margin, crosswise") takes the first type that matches.
const PREFIX_TYPES: Array<[RegExp, MarkType]> = [
  [/\bmarg[ei]|okraj|полях/iu, 'margin'],
  [/\bray[ée]|barr[ée]|canc[eé]l|c[ae]+ncel|effac|crossed|erased|škrt|zrušen|smazán|викресл|закресл|стерт|tachad/iu, 'struck'],
  [/no[ir]{1,2}[ciso]{1,4}|noires|blacked|začern|zamazán|замаз|затер|зачорн/iu, 'blacked'],
  [/trav[eé]r?s|napříč|na příč|křížem|navskos|навскос|поперек|across|crosswise|sideways|přes text/iu, 'across'],
];

/** Type of a marker prefix ("Rayé", "Zrušeny 2 řádky"), or null when it is not one we render */
export function classifyMarkPrefix(prefix: string): MarkType | null {
  for (const [re, type] of PREFIX_TYPES) if (re.test(prefix)) return type;
  return null;
}

/** `[` + prefix + `:` at the start of the string. The prefix is one short phrase. */
const OPENING = /^\[[ \t]*([^\s\[\]^#:*_=][^\[\]\n:*=]{0,44}?)[ \t]*:[ \t]*/;

export interface MarkMatch {
  type: MarkType;
  prefix: string;
  /** offsets in the text: `[`, start of inner text, the closing `]` */
  start: number;
  innerStart: number;
  close: number;
}

/** The marker opening at `i`, with its balanced closing bracket, or null */
export function markAt(text: string, i: number): MarkMatch | null {
  if (text[i] !== '[') return null;
  const m = OPENING.exec(text.slice(i, i + 64));
  if (!m) return null;
  const type = classifyMarkPrefix(m[1]);
  if (!type) return null;
  const innerStart = i + m[0].length;
  let depth = 1;
  for (let j = innerStart; j < text.length; j++) {
    const ch = text[j];
    if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) {
      return { type, prefix: m[1].trim(), start: i, innerStart, close: j };
    }
  }
  return null; // unbalanced: leave the text alone
}

/**
 * Replace every marker in `text` with `render(type, inner, prefix)`; markers
 * nested in a marker are replaced first. Everything else is copied as is.
 */
export function replaceMarks(text: string, render: (type: MarkType, inner: string, prefix: string) => string): string {
  if (!text.includes('[')) return text;
  let out = '';
  let last = 0;
  for (let i = text.indexOf('['); i >= 0 && i < text.length; i = text.indexOf('[', i)) {
    const m = markAt(text, i);
    if (!m) { i++; continue; }
    out += text.slice(last, i) + render(m.type, replaceMarks(text.slice(m.innerStart, m.close), render), m.prefix);
    last = i = m.close + 1;
  }
  return out + text.slice(last);
}

/** UI locale whose words label a content tree's markers */
function markLocale(contentPath: string) {
  if (contentPath === 'original' || contentPath === '_original') return 'fr' as const;
  return contentPathToLocale(contentPath);
}

/** "škrtnuto" / "crossed out" / "rayé" … in the content's language */
export function markLabel(type: MarkType, contentPath: string): string {
  return createT(markLocale(contentPath))(`paragraph.mark.${type}`);
}

const ATTR_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const attr = (s: string) => s.replace(/[&<>"]/g, ch => ATTR_ESCAPES[ch]);

/** Opening tag of a rendered marker; `unwrapWholeMark` recognises it by `data-mark` */
function openTag(type: MarkType, label: string): string {
  return type === 'struck' || type === 'blacked'
    ? `<del class="mark mark-${type}" data-mark="${type}" title="${attr(label)}">`
    : `<span class="mark mark-${type}" data-mark="${type}"><span class="mark-label">${label}</span> `;
}

/**
 * Markers as HTML, for the markdown renderer (content.ts processTextToHtml):
 * the inner text stays markdown, so it is rendered by the passes that follow.
 */
export function renderMarks(text: string, contentPath: string): string {
  return replaceMarks(text, (type, inner) => {
    const tag = type === 'struck' || type === 'blacked' ? 'del' : 'span';
    return `${openTag(type, markLabel(type, contentPath))}${inner}</${tag}>`;
  });
}

/**
 * Markers for the HTML-escaped French face (original-html.ts), which renders
 * line by line: open and close tags are first swapped for sentinel characters
 * (survive escaping and line splitting), then for the tags.
 */
const S_OPEN = '\u0001';
const S_CLOSE = '\u0002';
const TYPES: MarkType[] = ['struck', 'blacked', 'margin', 'across'];
export function markSentinels(text: string): string {
  return replaceMarks(text, (type, inner) => `${S_OPEN}${TYPES.indexOf(type)}${inner}${S_CLOSE}${TYPES.indexOf(type)}`);
}
export function sentinelsToHtml(html: string, contentPath: string): string {
  return html
    .replace(new RegExp(`${S_OPEN}(\\d)`, 'g'), (_, n) => openTag(TYPES[+n], markLabel(TYPES[+n], contentPath)))
    .replace(new RegExp(`${S_CLOSE}(\\d)`, 'g'), (_, n) => (TYPES[+n] === 'struck' || TYPES[+n] === 'blacked' ? '</del>' : '</span>'));
}

/**
 * Plain text for previews and snippets: struck and blacked-out words go
 * (they are not what the passage says), margin notes keep their words. A text
 * that is nothing but one marker (a whole struck passage) keeps its words.
 */
export function marksToPlainText(text: string): string {
  const bare = text.replace(/\[\^[^\]]+\]/g, '').trim();
  const whole = markAt(bare, 0);
  if (whole && whole.close === bare.length - 1) {
    return marksToPlainText(bare.slice(whole.innerStart, whole.close));
  }
  return closeGaps(replaceMarks(text, (type, inner) => (type === 'struck' || type === 'blacked' ? GAP : inner)));
}

/**
 * Where struck words were dropped (GAP), close the hole: "un [Rayé: x], acte"
 * → "un, acte", "un [Rayé: x] acte" → "un acte". Only around a GAP, so French
 * spacing elsewhere ("Ah !") is left alone.
 */
const GAP = '\u0003';
function closeGaps(text: string): string {
  if (!text.includes(GAP)) return text;
  return text
    .replace(/(^|\n)[ \t]*(?:\u0003[ \t]*)+/g, '$1')
    .replace(/[ \t]*(?:\u0003[ \t]*)+(?=[,.;:!?]|$|\n)/g, '')
    .replace(/[ \t]*(?:\u0003[ \t]*)+/g, ' ');
}

export interface WholeMark {
  type: MarkType;
  /** the marker's content, without its tag or label */
  inner: string;
  /** what follows the marker: footnote refs */
  rest: string;
}

/**
 * When a paragraph's rendered HTML is one marker (plus footnote refs), the
 * marker's type and content; otherwise null. Lets a kind block drop the
 * marker's own wrapper and show the content under its block label.
 */
export function unwrapWholeMark(html: string): WholeMark | null {
  const trimmed = html.trim();
  const open = trimmed.match(/^<(del|span) class="mark mark-(\w+)" data-mark="(\w+)"[^>]*>(?:<span class="mark-label">[^<]*<\/span> )?/);
  if (!open) return null;
  const tag = open[1];
  const type = open[3] as MarkType;
  const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g');
  tagRe.lastIndex = open[0].length;
  let depth = 1;
  for (let m = tagRe.exec(trimmed); m; m = tagRe.exec(trimmed)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) {
      const rest = trimmed.slice(m.index + m[0].length);
      if (rest.replace(/<sup>.*?<\/sup>/gs, '').trim()) return null;
      return { type, inner: trimmed.slice(open[0].length, m.index), rest: rest.trim() };
    }
  }
  return null;
}

/**
 * A paragraph whose marker was never closed in the source (`[Škrtnuto: …` with
 * a lost `]`, an OCR slip): its type and the text after the prefix. Only for
 * kind blocks, where the whole paragraph is known to be the marked passage;
 * in running text an unclosed bracket is left as it is.
 */
export function unclosedOpening(html: string): { type: MarkType; rest: string } | null {
  const text = html.trimStart();
  const m = OPENING.exec(text);
  if (!m) return null;
  const type = classifyMarkPrefix(m[1]);
  if (!type || markAt(text, 0)) return null;
  return { type, rest: text.slice(m[0].length) };
}

/** A kind block's label: spans and a cite, one level deep */
const KIND_LABEL_HTML = /<span class="para-kind-label[^"]*">(?:<(span|cite)\b[^>]*>[^<]*<\/\1>|[^<])*<\/span>/g;

/** Plain text of rendered paragraph HTML (meta descriptions, history labels): no labels, no struck words */
export function htmlToPlainText(html: string): string {
  let text = html
    .replace(/<sup\b[^>]*>.*?<\/sup>/gs, '')
    .replace(KIND_LABEL_HTML, '')
    .replace(/<span class="mark-label">[^<]*<\/span>/g, '');
  // Innermost first, so a struck span nested in a struck span goes whole
  const INNER_DEL = /<del class="mark [^"]*"[^>]*>(?:(?!<del\b)[\s\S])*?<\/del>/g;
  for (let prev = ''; prev !== text;) { prev = text; text = text.replace(INNER_DEL, GAP); }
  return closeGaps(text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')).trim();
}
