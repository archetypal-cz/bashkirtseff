/**
 * Paragraph reference linkification
 *
 * Glossary entries cite the diary by paragraph ID — "(099.0239)", "¶ 096.0312",
 * "104.0370–0376". Those are the most useful links on the page, so we turn them
 * into real links to the diary entry that contains the paragraph, anchored at
 * the paragraph itself (`#p-099-0239`, the anchor scheme used by
 * pages/[lang]/[carnet]/[entry].astro).
 *
 * Paragraph → entry resolution comes from the `para_start` / `para_end`
 * frontmatter of the ORIGINAL entries (the authoritative numbering); the link
 * then points into the requested language's tree, and is emitted only when that
 * language actually has the entry. Unresolvable references stay plain text.
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTENT_ROOT = path.resolve(process.cwd(), '../../content');

interface ParagraphRange {
  start: number;
  end: number;
  /** Entry id = file basename, e.g. "1883-04-29" (also the URL segment) */
  entryId: string;
}

/** carnet id → paragraph ranges, sorted by start */
let _rangeCache: Map<string, ParagraphRange[]> | null = null;

/** Read `para_start` / `para_end` out of the YAML frontmatter block */
function readParaRange(filePath: string): { start: number; end: number } | null {
  let head: string;
  try {
    head = fs.readFileSync(filePath, 'utf-8').slice(0, 4096);
  } catch {
    return null;
  }
  const fmEnd = head.indexOf('\n---', 3);
  const frontmatter = fmEnd > 0 ? head.slice(0, fmEnd) : head;
  const start = frontmatter.match(/^para_start:\s*(\d+)\s*$/m);
  const end = frontmatter.match(/^para_end:\s*(\d+)\s*$/m);
  if (!start || !end) return null;
  return { start: parseInt(start[1], 10), end: parseInt(end[1], 10) };
}

function buildRangeIndex(): Map<string, ParagraphRange[]> {
  if (_rangeCache) return _rangeCache;

  const index = new Map<string, ParagraphRange[]>();
  const originalDir = path.join(CONTENT_ROOT, '_original');

  if (fs.existsSync(originalDir)) {
    const carnets = fs.readdirSync(originalDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && /^\d{3}$/.test(d.name))
      .map(d => d.name);

    for (const carnet of carnets) {
      const carnetDir = path.join(originalDir, carnet);
      const ranges: ParagraphRange[] = [];
      // Entry ids are date-based but may carry a suffix (1877-01-07-09, 1878-10-04-evening)
      for (const file of fs.readdirSync(carnetDir).filter(f => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f))) {
        const range = readParaRange(path.join(carnetDir, file));
        if (!range || range.start <= 0 || range.end < range.start) continue;
        ranges.push({ ...range, entryId: file.replace(/\.md$/, '') });
      }
      ranges.sort((a, b) => a.start - b.start);
      index.set(carnet, ranges);
    }
  }

  _rangeCache = index;
  return index;
}

/** Resolve a paragraph id ("099.0239") to the entry that contains it */
export function resolveParagraphRef(carnet: string, paragraph: number): string | null {
  const ranges = buildRangeIndex().get(carnet);
  if (!ranges) return null;
  for (const range of ranges) {
    if (paragraph >= range.start && paragraph <= range.end) return range.entryId;
    if (range.start > paragraph) break; // sorted: no later range can match
  }
  return null;
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
    const href = `/${urlPath}/${carnet}/${entryId}#p-${carnet}-${para}`;
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
