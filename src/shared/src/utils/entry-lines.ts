/**
 * Raw-line view of an entry file: frontmatter + paragraph clusters, each the
 * ID line and every line up to the next ID line. Tools that must leave
 * untouched lines byte-for-byte (rebuild-carnet, sync) work on this view
 * instead of parsing and re-rendering the file.
 */
import {
  KIND_CONTENT_PATTERN,
  UNTIMESTAMPED_ROLE_NOTE_PATTERN,
  EMBEDDED_ROLE_NOTE_PATTERN,
} from '../parser/patterns.js';

export const ID_LINE_RE = /^\s*%%\s*(\d{3}\.\d{4})\s*%%\s*$/;
export const HEADING_RE = /^#{1,6}\s+\S/;
export const FOOTNOTE_DEF_RE = /^\s*\[\^([^\]]+)\]:/;
export const FOOTNOTE_CONT_RE = /^[ \t]+\S/;
/** A whole-line `%% … %%` comment */
export const COMMENT_LINE_RE = /^\s*%%.*%%\s*$/;
/** A glossary tag line: `%% [#Name](path) %%` (several tags may share the line) */
export const TAG_LINE_RE = /^\s*%%\s*\[#[^\]]+\]\([^)]*\)(\s*\[#[^\]]+\]\([^)]*\))*\s*%%\s*$/;

export interface Cluster {
  /** Paragraph ID */
  id: string;
  /** Raw lines: the ID line and everything up to the next ID line. The first
   *  cluster of a file also carries the lines between frontmatter and its ID. */
  lines: string[];
  /** File it came from */
  origin: string;
}

export interface ParsedFile {
  name: string;
  /** Frontmatter lines including both `---` delimiters, or null */
  fm: string[] | null;
  clusters: Cluster[];
  /** Body lines of a file with no paragraph ID (empty_in_source entries) */
  idlessBody: string[] | null;
  eofNewline: boolean;
}

export function parseEntryText(name: string, text: string): ParsedFile {
  const lines = text.split('\n');
  const eofNewline = text.endsWith('\n');
  if (eofNewline) lines.pop();

  let fm: string[] | null = null;
  let bodyStart = 0;
  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        fm = lines.slice(0, i + 1);
        bodyStart = i + 1;
        break;
      }
    }
  }

  const clusters: Cluster[] = [];
  let pending: string[] = [];
  for (let i = bodyStart; i < lines.length; i++) {
    const m = lines[i].match(ID_LINE_RE);
    if (m) {
      if (clusters.length === 0) {
        clusters.push({ id: m[1], lines: [...pending, lines[i]], origin: name });
        pending = [];
      } else {
        clusters.push({ id: m[1], lines: [lines[i]], origin: name });
      }
    } else if (clusters.length === 0) {
      pending.push(lines[i]);
    } else {
      clusters[clusters.length - 1].lines.push(lines[i]);
    }
  }
  return { name, fm, clusters, idlessBody: clusters.length === 0 ? pending : null, eofNewline };
}

/** Inverse of parseEntryText */
export function serializeEntry(pf: ParsedFile): string {
  const lines = [...(pf.fm ?? []), ...(pf.idlessBody ?? []), ...pf.clusters.flatMap((c) => c.lines)];
  return lines.join('\n') + (pf.eofNewline ? '\n' : '');
}

/** Reader-visible text lines of a cluster (no comments, headings, IDs, footnote definitions) */
export function textLineIdx(lines: string[]): number[] {
  const idx: number[] = [];
  let inDef = false;
  lines.forEach((l, i) => {
    const t = l.trim();
    if (FOOTNOTE_DEF_RE.test(l)) { inDef = true; return; }
    if (inDef && FOOTNOTE_CONT_RE.test(l)) return;
    inDef = false;
    if (!t || t.startsWith('%%') || t.startsWith('[//]:') || ID_LINE_RE.test(l) || HEADING_RE.test(t)) return;
    idx.push(i);
  });
  return idx;
}

/** The French of an _original cluster: its text lines and its `#` heading lines, in order. */
export function frenchLineIdx(lines: string[]): number[] {
  const text = new Set(textLineIdx(lines));
  return lines.map((_, i) => i).filter((i) => text.has(i) || (HEADING_RE.test(lines[i].trim()) && !ID_LINE_RE.test(lines[i])));
}

/**
 * Embedded French lines of a translation cluster: whole-line `%% … %%` comments that
 * are not the ID, a tag line, a kind marker, a version, a `[//]` line or a role note
 * (timestamped or not). Heading copies count (`%% Jeudi 18 octobre 1883 %%`).
 */
export function embeddedFrenchIdx(lines: string[]): number[] {
  const out: number[] = [];
  lines.forEach((l, i) => {
    const m = l.trim().match(/^%%\s*(.*?)\s*%%$/);
    if (!m || m[1].includes('%%') || !m[1]) return;
    const b = m[1];
    if (/^\d{3}\.\d{4}$/.test(b) || b.startsWith('[#') || b.startsWith('[//]') || /^v\d/.test(b)) return;
    if (/^\d{4}-\d{2}-\d{2}/.test(b) || UNTIMESTAMPED_ROLE_NOTE_PATTERN.test(b) || EMBEDDED_ROLE_NOTE_PATTERN.test(b) || KIND_CONTENT_PATTERN.test(b)) return;
    out.push(i);
  });
  return out;
}

/**
 * Multi-line `%%` blocks of a cluster (a line opening `%%` without closing it,
 * through the line that closes it): [start, endInclusive] pairs. The fr tree
 * keeps some embedded French this way.
 */
export function multiLineBlocks(lines: string[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith('%%') || COMMENT_LINE_RE.test(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].includes('%%')) j++;
    if (j >= lines.length) break;
    out.push([i, j]);
    i = j;
  }
  return out;
}

/** French compared loosely: no markers, `#`, `> `, footnote refs, typographic quotes, case or spacing. */
export function normFrench(s: string): string {
  return s
    .replace(/%%/g, ' ')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
