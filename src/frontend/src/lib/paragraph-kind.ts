/**
 * Paragraph kinds: material Marie put in her notebooks that is not her running
 * diary text — pasted newspaper clippings, copied letters, struck-out passages,
 * marginal notes, notebook covers, the editors' notes on the physical
 * manuscript. In content files a kind is one marker line directly under the
 * paragraph ID, identical in every tree (docs/REBUILD_CARNET.md, "Paragraph kinds"):
 *
 *   %% 068.0456 %%
 *   %% kind: clipping source="Le Figaro, 12 février 1877" %%
 *   > Hier soir, à l'Opéra, …
 *
 * Clippings and letters are block quotations (`> ` lines). The page shows each
 * kind as its own block with a small label in the reading language.
 * Parsing mirrors KIND_CONTENT_PATTERN in src/shared/src/parser/patterns.ts.
 */
import { createT, contentPathToLocale } from '../i18n/astro';
import { escapeHtml } from './original-html';
import { markLabel, unclosedOpening, unwrapWholeMark, type MarkType } from './text-markers';

export type ParagraphKind = 'clipping' | 'letter' | 'rayé' | 'margin' | 'cover' | 'editorial' | 'other';

/** The whole marker line, `%%` wrapper included */
export const KIND_LINE_PATTERN =
  /^\s*%%\s*kind:\s*(clipping|letter|rayé|raye|margin|cover|editorial|other)(?:\s+source="([^"]*)")?\s*%%\s*$/;

/** Read a kind marker line; `raye` is accepted for `rayé`. */
export function parseKindLine(line: string): { kind: ParagraphKind; source?: string } | null {
  const m = line.match(KIND_LINE_PATTERN);
  if (!m) return null;
  const kind = (m[1] === 'raye' ? 'rayé' : m[1]) as ParagraphKind;
  const source = m[2]?.trim();
  return source ? { kind, source } : { kind };
}

/** First kind marker among a cluster's lines, if any */
export function findKind(lines: string[]): { kind: ParagraphKind; source?: string } | null {
  for (const line of lines) {
    const k = parseKindLine(line);
    if (k) return k;
  }
  return null;
}

/**
 * Drop the blockquote markers (`> `) from the start of each line; the kind
 * wrapper draws the quotation instead. Diary prose never starts a line with `>`.
 */
export function stripQuoteMarkers(text: string): string {
  return text.replace(/^[ \t]*>[ \t]?/gm, '');
}

/** CSS-safe class suffix (rayé → raye) and i18n key */
const KEY: Record<ParagraphKind, string> = {
  clipping: 'clipping',
  letter: 'letter',
  'rayé': 'raye',
  margin: 'margin',
  cover: 'cover',
  editorial: 'editorial',
  other: 'other',
};

/** UI locale whose labels match a content tree: the label is part of the text's language. */
function labelLocale(contentPath: string) {
  if (contentPath === 'original' || contentPath === '_original') return 'fr' as const;
  return contentPathToLocale(contentPath);
}

/**
 * Kinds whose consecutive paragraphs from the same source form one block: a
 * clipping or letter pasted or copied over several paragraphs is one document.
 * Struck-out passages, marginal notes and editors' notes each belong to their
 * own spot in the text, so they stay per paragraph.
 */
const GROUPED_KINDS = new Set<ParagraphKind>(['clipping', 'letter', 'cover', 'other']);

/** The block's label (kind name, the source as a citation, the language of a
 * foreign run: "Coupure de presse · Le Figaro · en anglais"), without its outer span */
export function kindLabelInnerHtml(kind: ParagraphKind, source: string | undefined, contentPath: string, lang?: string): string {
  const t = createT(labelLocale(contentPath));
  const label = escapeHtml(t(`paragraph.kind.${KEY[kind]}`));
  const sep = '<span class="para-kind-sep" aria-hidden="true"> · </span>';
  const cite = source ? `${sep}<cite class="para-kind-source">${escapeHtml(source)}</cite>` : '';
  const langName = lang ? kindLanguageName(lang, contentPath) : null;
  const langHtml = langName ? `${sep}<span class="para-kind-lang">${escapeHtml(langName)}</span>` : '';
  return `<span class="para-kind-name">${label}</span>${cite}${langHtml}`;
}

/** Plain-text label for aria-label and the like: "Coupure de presse · Le Figaro" */
export function kindLabelText(kind: ParagraphKind, source: string | undefined, contentPath: string, lang?: string): string {
  const t = createT(labelLocale(contentPath));
  const langName = lang ? kindLanguageName(lang, contentPath) : null;
  return [t(`paragraph.kind.${KEY[kind]}`), source, langName].filter(Boolean).join(' · ');
}

/** "anglicky" / "in English" / "en anglais" … for the label, or null when not listed */
function kindLanguageName(lang: string, contentPath: string): string | null {
  const key = `paragraph.kindLanguage.${lang}`;
  const name = createT(labelLocale(contentPath))(key);
  return name && name !== key ? name : null;
}

// Stems of language names in the notes translators put on a foreign passage
const NOTE_LANGUAGE_STEMS: Array<[RegExp, string]> = [
  [/^(?:english|angl|англ)/i, 'en'],
  [/^(?:italian|ital|італ|итал)/i, 'it'],
  [/^(?:latin|латин)/i, 'la'],
  [/^(?:russian|rus|рос)/i, 'ru'],
  [/^(?:german|něm|нім)/i, 'de'],
];

// A note that only says which language the original passage is in:
//   en `^[In English in the original.]`, `^[Newspaper clipping in English in the original.]`
//   cz `Pozn. překl.: V originále anglicky: popis …`
//   uk `В оригіналі англійською.`, `Англійською в оригіналі.`, `По-латині в оригіналі.`
const LANGUAGE_NOTE_PATTERNS: RegExp[] = [
  /^(?:newspaper clipping |letter )?in (\p{L}+) in the original\.?$/iu,
  /^Pozn\. překl\.: V originále (\p{L}+)(?=[\s:.,]|$)/u,
  /^В оригіналі (\p{L}+)/u,
  /^(?:По-)?(\p{L}+) в оригіналі/u,
];

/** The language phrase a note opens with, and its language ('en', 'it', …) */
function matchLanguageNote(note: string): { phrase: string; lang: string } | null {
  const text = note.replace(/<[^>]*>/g, '').replace(/^[\s*_]+|[\s*_]+$/g, '');
  for (const pattern of LANGUAGE_NOTE_PATTERNS) {
    const m = text.match(pattern);
    if (!m) continue;
    for (const [stem, code] of NOTE_LANGUAGE_STEMS) if (stem.test(m[1])) return { phrase: m[0], lang: code };
  }
  return null;
}

/**
 * The language a note says its passage is in ('en', 'it', …), or null when the
 * note says something else. `note` is plain text or rendered HTML.
 */
export function noteLanguage(note: string): string | null {
  return matchLanguageNote(note)?.lang ?? null;
}

/**
 * What a language note says besides its language, for when a label names the
 * language instead: '' when nothing (the note can go), the note without its
 * language phrase ("Pozn. překl.: popis výzdoby kostela"), or the whole note
 * when the phrase cannot be cut out cleanly (it spans markup). `note` is
 * rendered HTML; null when it is not a language note.
 */
export function languageNoteRest(note: string): string | null {
  const match = matchLanguageNote(note);
  if (!match) return null;
  const at = note.indexOf(match.phrase);
  if (at < 0) return note;
  const rest = note.slice(at + match.phrase.length).replace(/^[\s:.,;–—-]+/, '');
  const restText = rest.replace(/<[^>]*>/g, '').replace(/[\s*_.,;:–—-]+/g, '');
  if (!restText) return '';
  const prefix = /^Pozn\. překl\.:/.test(match.phrase) ? 'Pozn. překl.: ' : '';
  return note.slice(0, at) + prefix + rest;
}

/** Rendered inline notes (`^[…]`, left as literal text by the renderer), with any breaks before them */
const INLINE_NOTE_HTML = /(?:\s*<br>)*\s*\^\[((?:(?!\]).)*)\]/gs;

/** Languages named by a paragraph's inline language notes */
export function inlineNoteLanguages(html: string): string[] {
  const langs: string[] = [];
  for (const m of html.matchAll(INLINE_NOTE_HTML)) {
    const lang = noteLanguage(m[1]);
    if (lang) langs.push(lang);
  }
  return langs;
}

/**
 * Take the language out of a paragraph's language notes: an inline
 * `^[In English in the original.]` that says nothing else goes, one that says
 * more keeps the rest; the refs of the footnotes in `footnoteIds` go.
 */
export function stripLanguageNotes(html: string, footnoteIds: Set<string>): string {
  let out = html.replace(INLINE_NOTE_HTML, (whole, note) => {
    const rest = languageNoteRest(note);
    if (rest === null) return whole;
    return rest ? whole.replace(note, rest) : '';
  });
  for (const id of footnoteIds) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`<sup><a href="#fn-${escaped}"[^>]*>[^<]*</a></sup>`, 'g'), '');
  }
  return out.trim();
}

/** The paragraph's own text inside a kind block (struck through for rayé) */
export function kindBodyHtml(html: string, kind: ParagraphKind): string {
  return kind === 'rayé' ? `<del class="para-kind-body">${html}</del>` : `<div class="para-kind-body">${html}</div>`;
}

/** CSS class suffix / data-kind value of a kind (rayé → raye) */
export function kindKey(kind: ParagraphKind): string {
  return KEY[kind];
}

/** Clippings and letters are quotations: a blockquote; the rest a plain block */
export function isQuotedKind(kind: ParagraphKind): boolean {
  return kind === 'clipping' || kind === 'letter';
}

/**
 * Split paragraphs into runs that render as one block: consecutive paragraphs
 * of the same grouped kind and the same source (both unset counts as the same).
 * Everything else, including a lone kind paragraph, is a run of one.
 */
export function kindRuns<T extends { kind?: ParagraphKind; kindSource?: string }>(paragraphs: T[]): T[][] {
  const runs: T[][] = [];
  for (const p of paragraphs) {
    const run = runs[runs.length - 1];
    const prev = run?.[run.length - 1];
    if (prev && p.kind && GROUPED_KINDS.has(p.kind) && prev.kind === p.kind && prev.kindSource === p.kindSource) {
      run.push(p);
    } else {
      runs.push([p]);
    }
  }
  return runs;
}

/**
 * Wrap a paragraph's rendered HTML in its kind block: a blockquote for
 * clippings and letters, a plain block for the rest; a label (kind name, then
 * the source as a citation) opens it. `labelInner` overrides the label content
 * (content.ts passes it with the language's typography applied).
 */
export function wrapKindHtml(
  html: string, kind: ParagraphKind, source: string | undefined, contentPath: string,
  labelInner: string = kindLabelInnerHtml(kind, source, contentPath),
): string {
  const key = KEY[kind];
  // An editors' note is already bracketed in the text; its label is for screen readers only.
  const labelClass = kind === 'editorial' ? 'para-kind-label sr-only' : 'para-kind-label';
  const head = `<span class="${labelClass}">${labelInner}</span>`;
  const tag = isQuotedKind(kind) ? 'blockquote' : 'div';
  return `<${tag} class="para-kind para-kind-${key}" data-kind="${key}">${head}${kindBodyHtml(html, kind)}</${tag}>`;
}

/** Up to this many words on one line, a struck passage is just struck: no label at all */
export const SHORT_MARK_MAX_WORDS = 5;
const SHORT_MARK_MAX_CHARS = 40;

/** Whether a block body is short enough to need no label (a word, a struck date line) */
export function isShortMarkBody(html: string): boolean {
  if (/<br\b|<h[1-6]\b/.test(html)) return false;
  const text = html.replace(/<sup\b[^>]*>.*?<\/sup>/gs, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.length <= SHORT_MARK_MAX_CHARS && text.split(' ').filter(Boolean).length <= SHORT_MARK_MAX_WORDS;
}

/**
 * A struck-out passage or a marginal note as a compact block (owner ruling
 * 2026-10-03): the text's own `[Rayé: …]` / `[Na okraji: …]` wrapper is
 * dropped (it repeated the block label), a short struck passage is simply
 * struck through with no label, and anything longer, and every marginal or
 * across-the-page note, gets a small lowercase label ("škrtnuto · brouillon
 * rayé, fin du cahier 43") instead of the kind heading.
 *
 * Applies to `rayé` and `margin` paragraphs, and to a paragraph without a kind
 * whose whole text is one such marker. Returns null for anything else.
 * `typo` applies the language's typography to the label.
 */
export function wrapMarkBlock(
  html: string, kind: ParagraphKind | undefined, source: string | undefined, contentPath: string,
  typo: (html: string) => string = h => h,
): string | null {
  if (kind && kind !== 'rayé' && kind !== 'margin') return null;
  const whole = unwrapWholeMark(html);
  if (!kind && !whole) return null;
  const unclosed = whole || !kind ? null : unclosedOpening(html);
  const type: MarkType = whole?.type ?? unclosed?.type ?? (kind === 'rayé' ? 'struck' : 'margin');
  const struck = type === 'struck' || type === 'blacked';
  const inner = whole ? whole.inner : unclosed ? unclosed.rest : html;
  const key = kind ? KEY[kind] : struck ? 'raye' : 'margin';

  const short = struck && !source && isShortMarkBody(inner);
  const sep = '<span class="para-kind-sep" aria-hidden="true"> · </span>';
  const cite = source ? `${sep}<cite class="para-kind-source">${escapeHtml(source)}</cite>` : '';
  const labelClass = short ? 'para-kind-label sr-only' : 'para-kind-label para-kind-label-mini';
  const label = `<span class="${labelClass}">${typo(`<span class="para-kind-name">${escapeHtml(markLabel(type, contentPath))}</span>${cite}`)}</span>`;
  const body = struck
    ? `<del class="para-kind-body para-kind-body-${type}">${inner}</del>`
    : `<div class="para-kind-body">${inner}</div>`;
  const classes = ['para-kind', `para-kind-${key}`, 'para-kind-compact', `para-kind-mark-${type}`];
  return `<div class="${classes.join(' ')}" data-kind="${key}">${label}${body}${whole?.rest ?? ''}</div>`;
}
