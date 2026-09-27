/**
 * Paragraph kinds: material Marie put in her notebooks that is not her running
 * diary text — pasted newspaper clippings, copied letters, struck-out passages,
 * marginal notes. In content files a kind is one marker line directly under the
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

export type ParagraphKind = 'clipping' | 'letter' | 'rayé' | 'margin' | 'other';

/** The whole marker line, `%%` wrapper included */
export const KIND_LINE_PATTERN =
  /^\s*%%\s*kind:\s*(clipping|letter|rayé|raye|margin|other)(?:\s+source="([^"]*)")?\s*%%\s*$/;

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
  other: 'other',
};

/** UI locale whose labels match a content tree: the label is part of the text's language. */
function labelLocale(contentPath: string) {
  if (contentPath === 'original' || contentPath === '_original') return 'fr' as const;
  return contentPathToLocale(contentPath);
}

/**
 * Wrap a paragraph's rendered HTML in its kind block: a blockquote for
 * clippings and letters, a plain block for the rest; a label (kind name, then
 * the source as a citation) opens it.
 */
export function wrapKindHtml(html: string, kind: ParagraphKind, source: string | undefined, contentPath: string): string {
  const key = KEY[kind];
  const t = createT(labelLocale(contentPath));
  const label = escapeHtml(t(`paragraph.kind.${key}`));
  const cite = source ? `<span class="para-kind-sep" aria-hidden="true"> · </span><cite class="para-kind-source">${escapeHtml(source)}</cite>` : '';
  const head = `<span class="para-kind-label"><span class="para-kind-name">${label}</span>${cite}</span>`;
  const quoted = kind === 'clipping' || kind === 'letter';
  const tag = quoted ? 'blockquote' : 'div';
  const body = kind === 'rayé' ? `<del class="para-kind-body">${html}</del>` : `<div class="para-kind-body">${html}</div>`;
  return `<${tag} class="para-kind para-kind-${key}" data-kind="${key}">${head}${body}</${tag}>`;
}
