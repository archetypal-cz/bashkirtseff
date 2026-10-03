/**
 * Paragraph index for "My stars" (S10)
 *
 * A star is identified by a paragraph id `CCC.NNNN`. The My-stars page needs,
 * for each starred id, the entry that holds the paragraph (to link to it and
 * show its date) and a short plain-text snippet. This module builds that
 * lookup per (language, carnet), served as
 * `/data/paragraphs/{lang}/{CCC}.json` -> `{ "0145": ["1873-08-11", "snippet"] }`.
 *
 * Keying: the file for carnet CCC holds NNNN for every `%% CCC.NNNN %%` ID line
 * that physically sits in that language's carnet CCC directory. After a
 * renumber (docs/REBUILD_CARNET.md) a paragraph that moved to another carnet
 * carries its NEW id, and stars are remapped to it by the renumber SQL, so the
 * star id always names the carnet that holds the paragraph today. A foreign
 * prefix inside a carnet directory is ignored (same rule as paragraph-refs.ts);
 * a duplicate id keeps its first file in reading order.
 *
 * Carnet 000 (the preface) is one page, `/{lang}/000/`, so its rows carry
 * `null` instead of an entry id; the client links to `#p-000-NNNN`.
 *
 * The snippet is read from the language's own tree (each tree holds its own
 * text). Rows whose snippet is empty (untranslated paragraphs are commented-out
 * French; a few are genuinely empty) are skipped, and a (lang, carnet) whose
 * index ends up empty gets no file.
 *
 * Contract for the client (S11): fallback is PER ROW. If the key is missing in
 * the language's file, or the file itself is missing (404), use the row from
 * the `original` file for the same carnet.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getCarnets, getCarnetEntries } from './content';
import { marksToPlainText } from './text-markers';

const CONTENT_ROOT = path.resolve(process.cwd(), '../../content');

export const SNIPPET_MAX = 160;

/** `[entryId | null, snippet]` */
export type ParagraphIndexRow = [string | null, string];
export type ParagraphIndex = Record<string, ParagraphIndexRow>;

/** A structural paragraph ID: the marker alone on its line */
const ID_LINE = /^\s*%%\s*(\d{3})\.(\d{4})\s*%%\s*$/;

/** Footnote definition line: `[^id]: text` */
const FOOTNOTE_DEF = /^\s*\[\^[^\]]+\]:/;

/** A whole-line comment (the renderer drops these line by line, so a literal `%%` inside one is harmless) */
const COMMENT_LINE = /^\s*%%.*%%\s*$/;

/** Old-format comment line `[//]: # ( … )` (the renderer hides these too) */
const OLD_COMMENT_LINE = /^\s*\[\/\/\]:/;

/**
 * Plain text of a paragraph cluster: no %% comments (translations embed the
 * French copy in one), footnote definitions and markers, markdown or HTML.
 */
export function plainText(raw: string): string {
  const visible = raw
    .split('\n')
    .filter(line => !FOOTNOTE_DEF.test(line) && !COMMENT_LINE.test(line) && !OLD_COMMENT_LINE.test(line))
    .join('\n')
    .replace(/%%[\s\S]*?%%/g, ' ');          // comments (glossary tags, notes, embedded French)
  return marksToPlainText(visible)           // [Rayé: x] / [Na okraji: x] markers (lib/text-markers.ts)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')                 // inline HTML
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images -> alt
    .replace(/\[\^[^\]]+\]/g, '')             // footnote markers
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // links -> text
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')     // headings
    .replace(/^[ \t]*>[ \t]?/gm, '')          // blockquote markers
    .replace(/^[ \t]*(?:[-*+]|\d+\.)[ \t]+/gm, '') // list markers
    .replace(/(\*\*|__|\*|_|~~|`)/g, '')       // emphasis / code
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cut at a word boundary within `max` characters, appending an ellipsis when cut */
export function makeSnippet(text: string, max: number = SNIPPET_MAX): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  const room = max - 1; // the ellipsis takes one character
  let cut = chars.slice(0, room).join('');
  // Back off to the last space unless the cut already lands on one
  if (chars[room] !== ' ') {
    const sp = cut.lastIndexOf(' ');
    if (sp > room * 0.5) cut = cut.slice(0, sp);
    // No word boundary to back off to: do not split a combining mark from its base
    else if (chars[room] && /\p{M}/u.test(chars[room])) {
      const a = chars.slice(0, room);
      while (a.length > 1 && /\p{M}/u.test(a[a.length - 1])) a.pop();
      a.pop();
      cut = a.join('');
    }
  }
  return cut.replace(/[\s,;:.\-–—]+$/, '') + '…';
}

/**
 * Paragraph clusters of one entry file: `[paragraph number, plain snippet]`
 * for every `%% carnet.NNNN %%` ID line, in file order.
 */
export function extractParagraphs(text: string, carnet: string): Array<[number, string]> {
  const out: Array<[number, string]> = [];
  let cur: { num: number; lines: string[] } | null = null;
  // Frontmatter ends at the second `---`; IDs never occur inside it
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const flush = () => {
    if (cur) out.push([cur.num, makeSnippet(plainText(cur.lines.join('\n')))]);
    cur = null;
  };
  for (const line of body.split(/\r?\n/)) {
    const m = ID_LINE.exec(line);
    if (m) {
      flush();
      // A foreign carnet prefix ends the previous cluster but starts none
      if (m[1] === carnet) cur = { num: parseInt(m[2], 10), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  flush();
  return out;
}

/** Index of one carnet in one language tree (`language`: content path, '_original' for the French source) */
export function buildCarnetIndex(language: string, carnet: string): ParagraphIndex {
  const index: ParagraphIndex = {};
  const dir = path.join(CONTENT_ROOT, language, carnet);
  for (const entryId of getCarnetEntries(carnet, language)) {
    let text: string;
    try {
      text = fs.readFileSync(path.join(dir, `${entryId}.md`), 'utf-8');
    } catch {
      continue;
    }
    for (const [num, snippet] of extractParagraphs(text, carnet)) {
      const key = String(num).padStart(4, '0');
      if (!snippet) continue; // untranslated (commented-out French) or empty: leave the key to the fallback
      if (!(key in index)) index[key] = [carnet === '000' ? null : entryId, snippet];
    }
  }
  return index;
}

/** Carnets whose index in this language's tree is non-empty (no file is generated otherwise) */
export function carnetsWithFiles(language: string): string[] {
  return getCarnets(language)
    .map(c => c.id)
    .filter(id => Object.keys(buildCarnetIndex(language, id)).length > 0);
}
