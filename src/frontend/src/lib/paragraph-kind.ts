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

/**
 * The language a note says its passage is in ('en', 'it', …), or null when the
 * note says something else. `note` is plain text or rendered HTML.
 */
export function noteLanguage(note: string): string | null {
  const text = note.replace(/<[^>]*>/g, '').replace(/^[\s*_]+|[\s*_]+$/g, '');
  for (const pattern of LANGUAGE_NOTE_PATTERNS) {
    const m = text.match(pattern);
    if (!m) continue;
    for (const [stem, code] of NOTE_LANGUAGE_STEMS) if (stem.test(m[1])) return code;
  }
  return null;
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
 * Remove a paragraph's language notes: inline `^[In English in the original.]`
 * and the refs of the footnotes in `footnoteIds`.
 */
export function stripLanguageNotes(html: string, footnoteIds: Set<string>): string {
  let out = html.replace(INLINE_NOTE_HTML, (whole, note) => (noteLanguage(note) ? '' : whole));
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
