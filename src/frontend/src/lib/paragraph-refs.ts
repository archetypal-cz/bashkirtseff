/**
 * Paragraph reference linkification
 *
 * Glossary entries cite the diary by paragraph ID — "(099.0239)", "¶ 096.0312",
 * "104.0370–0376". Those are the most useful links on the page, so we turn them
 * into real links to the diary entry that contains the paragraph, anchored at
 * the paragraph itself (`#p-099-0239`, the anchor scheme used by
 * pages/[lang]/[carnet]/[entry].astro).
 *
 * Paragraph → entry resolution reads the `%% CCC.NNNN %%` ID lines of the
 * ORIGINAL entries (the authoritative numbering) — the IDs actually present,
 * not the `para_start` / `para_end` frontmatter, which can go stale and would
 * mis-resolve a file whose IDs are not one contiguous run. The link then
 * points into the requested language's tree, and is emitted only when that
 * language actually has the entry. Unresolvable references stay plain text.
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTENT_ROOT = path.resolve(process.cwd(), '../../content');

/** A structural paragraph ID: the marker alone on its line */
const ID_LINE = /^\s*%%\s*(\d{3})\.(\d{4})\s*%%\s*$/gm;

/** carnet id → (paragraph number → entry id = file basename, also the URL segment) */
let _idCache: Map<string, Map<number, string>> | null = null;

function buildIdIndex(): Map<string, Map<number, string>> {
  if (_idCache) return _idCache;

  const index = new Map<string, Map<number, string>>();
  const originalDir = path.join(CONTENT_ROOT, '_original');

  if (fs.existsSync(originalDir)) {
    const carnets = fs.readdirSync(originalDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^\d{3}$/.test(d.name))
      .map(d => d.name);

    for (const carnet of carnets) {
      const carnetDir = path.join(originalDir, carnet);
      const ids = new Map<number, string>();
      // Entry ids are date-based but may carry a suffix (1877-01-07-09, 1878-10-04-evening)
      for (const file of fs.readdirSync(carnetDir).filter(f => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f)).sort()) {
        let text: string;
        try {
          text = fs.readFileSync(path.join(carnetDir, file), 'utf-8');
        } catch {
          continue;
        }
        const entryId = file.replace(/\.md$/, '');
        for (const m of text.matchAll(ID_LINE)) {
          if (m[1] !== carnet) continue;
          const para = parseInt(m[2], 10);
          if (!ids.has(para)) ids.set(para, entryId); // a duplicate keeps its first file
        }
      }
      index.set(carnet, ids);
    }
  }

  _idCache = index;
  return index;
}

/** Resolve a paragraph id ("099.0239") to the entry that contains it */
export function resolveParagraphRef(carnet: string, paragraph: number): string | null {
  return buildIdIndex().get(carnet)?.get(paragraph) ?? null;
}

/** Does `language` have this entry? ('original' always does) */
function entryExists(language: string, carnet: string, entryId: string): boolean {
  if (language === 'original') return true;
  return fs.existsSync(path.join(CONTENT_ROOT, language, carnet, `${entryId}.md`));
}

/**
 * Paragraph reference: 3-digit carnet, dot, 4-digit paragraph, optionally a
 * range end ("099.0033–0035"). Guarded so it can't fire inside a longer
 * number/identifier.
 */
const REF_PATTERN = /(?<![\w.])(\d{3})\.(\d{4})(?:[–—-]\d{4})?(?![\d.\w])/g;

/** Segments we must never rewrite: HTML tags, existing links, code. */
const SKIP_PATTERN = /<a\b[^>]*>[\s\S]*?<\/a>|<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>|<!--[\s\S]*?-->|<[^>]+>/gi;

function linkifyTextChunk(text: string, urlPath: string, contentPath: string): string {
  return text.replace(REF_PATTERN, (match, carnet: string, para: string) => {
    const entryId = resolveParagraphRef(carnet, parseInt(para, 10));
    if (!entryId || !entryExists(contentPath, carnet, entryId)) return match;
    const href = `/${urlPath}/${carnet}/${entryId}/#p-${carnet}-${para}`;
    return `<a href="${href}" class="para-ref">${match}</a>`;
  });
}

/**
 * Wrap paragraph references in rendered HTML with links into the diary.
 *
 * @param html        already-rendered HTML (glossary paragraph or body)
 * @param urlPath     language segment used in URLs ('cz', 'original', …)
 * @param contentPath language directory under content/ (same, except aliases)
 */
export function linkifyParagraphRefs(
  html: string,
  urlPath: string,
  contentPath: string = urlPath,
): string {
  if (!html) return html;

  let result = '';
  let lastIndex = 0;
  SKIP_PATTERN.lastIndex = 0;
  let skip: RegExpExecArray | null;
  while ((skip = SKIP_PATTERN.exec(html)) !== null) {
    result += linkifyTextChunk(html.slice(lastIndex, skip.index), urlPath, contentPath);
    result += skip[0];
    lastIndex = skip.index + skip[0].length;
  }
  result += linkifyTextChunk(html.slice(lastIndex), urlPath, contentPath);
  return result;
}
