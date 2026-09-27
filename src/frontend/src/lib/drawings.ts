/**
 * Drawings Marie made in her notebooks, cut from the manuscript scans and
 * attached to the entry of the day they were drawn. Listed in the entry's
 * `_original` frontmatter (a translation may carry its own list to translate
 * the captions; otherwise it shows the original's):
 *
 *   drawings:
 *     - src: /images/marie/drawings/068/tome09-p0123-1.webp
 *       caption: "Profil de femme, à la plume"
 *       source: "Tome 9 (BnF NAF 12304), f. 123"
 *       paragraph: "068.0456"
 *
 * `src` is a site-absolute path under `src/frontend/public/` (committed files:
 * `public/images/marie/drawings/<carnet>/`, WebP, ≤1600 px on the long side,
 * aim < 300 KB; the raw scans stay in the gitignored `content/_raw/scans/`).
 * `paragraph` places the drawing right after that paragraph; without it (or
 * when the entry has no such paragraph) the drawing goes to the end of the entry.
 * Same shape as glossary `images:` (lib/content.ts GlossaryImage) plus
 * `paragraph`, with `source` for the manuscript reference.
 */

export interface EntryDrawing {
  src: string;
  caption?: string;   // Shown under the image; also the default alt text
  alt?: string;       // Alt text override
  source?: string;    // Manuscript reference (tome, folio/page of the scan)
  paragraph?: string; // Paragraph ID ("068.0456") the drawing belongs next to
}

/** Validate the frontmatter value; drops malformed items rather than failing the build. */
export function normalizeDrawings(value: unknown): EntryDrawing[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: EntryDrawing[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const src = typeof r.src === 'string' ? r.src.trim() : '';
    if (!src || !(src.startsWith('/') || /^https?:\/\//.test(src))) continue;
    const d: EntryDrawing = { src };
    for (const key of ['caption', 'alt', 'source'] as const) {
      if (typeof r[key] === 'string' && (r[key] as string).trim()) d[key] = (r[key] as string).trim();
    }
    const para = r.paragraph;
    if (typeof para === 'string' && /^\d{3}\.\d{4}$/.test(para.trim())) d.paragraph = para.trim();
    out.push(d);
  }
  return out.length ? out : undefined;
}

/**
 * Split drawings into those shown after a given paragraph and those shown at
 * the end of the entry (no paragraph, or one the entry does not contain).
 */
export function placeDrawings(
  drawings: EntryDrawing[] | undefined,
  paragraphIds: string[],
): { byParagraph: Record<string, EntryDrawing[]>; atEnd: EntryDrawing[] } {
  const byParagraph: Record<string, EntryDrawing[]> = {};
  const atEnd: EntryDrawing[] = [];
  const present = new Set(paragraphIds);
  for (const d of drawings ?? []) {
    if (d.paragraph && present.has(d.paragraph)) (byParagraph[d.paragraph] ??= []).push(d);
    else atEnd.push(d);
  }
  return { byParagraph, atEnd };
}
