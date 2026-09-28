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

/** The block's label (kind name, then the source as a citation), without its outer span */
export function kindLabelInnerHtml(kind: ParagraphKind, source: string | undefined, contentPath: string): string {
  const t = createT(labelLocale(contentPath));
  const label = escapeHtml(t(`paragraph.kind.${KEY[kind]}`));
  const cite = source ? `<span class="para-kind-sep" aria-hidden="true"> · </span><cite class="para-kind-source">${escapeHtml(source)}</cite>` : '';
  return `<span class="para-kind-name">${label}</span>${cite}`;
}

/** Plain-text label for aria-label and the like: "Coupure de presse · Le Figaro" */
export function kindLabelText(kind: ParagraphKind, source: string | undefined, contentPath: string): string {
  const t = createT(labelLocale(contentPath));
  const label = t(`paragraph.kind.${KEY[kind]}`);
  return source ? `${label} · ${source}` : label;
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
