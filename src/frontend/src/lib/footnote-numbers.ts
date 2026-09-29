/**
 * Footnote numbering for one reading page (an entry, or the merged 000
 * preface). Footnote ids are per paragraph (`[^007.0071.1]`, `[^01.28.1]`), so
 * their last segment restarts at 1 in every paragraph; readers instead see the
 * page's notes numbered 1, 2, 3, … in order of first reference in the text.
 * The ids stay the anchors (`#fn-…`, `#fnref-…`); only the shown label changes.
 */

interface NumberableParagraph {
  html: string;
  kindBodyHtml?: string;
}

interface NumberableFootnote {
  id: string;
  label?: string;
}

const REF_HTML = /(<sup><a href="#fn-)([^"]+)("[^>]*class="footnote-ref"[^>]*>)[^<]*(<\/a><\/sup>)/g;

/**
 * Label the footnotes in order of first reference in the paragraphs' html and
 * sort them that way; notes never referenced keep their order at the end.
 * Superscripts get the same label. Returns copies (the inputs may be cached
 * entries shared with other pages); refs to an undefined note are left as is.
 */
export function numberFootnotes<P extends NumberableParagraph, F extends NumberableFootnote>(
  paragraphs: P[], footnotes: F[],
): { paragraphs: P[]; footnotes: F[] } {
  const defined = new Set(footnotes.map(fn => fn.id));
  const labels = new Map<string, string>();
  for (const p of paragraphs) {
    for (const m of p.html.matchAll(REF_HTML)) {
      const id = m[2];
      if (defined.has(id) && !labels.has(id)) labels.set(id, String(labels.size + 1));
    }
  }
  const relabel = (html: string) => html.replace(REF_HTML, (whole, open, id, attrs, close) =>
    labels.has(id) ? `${open}${id}${attrs}${labels.get(id)}${close}` : whole);

  const numberedParagraphs = paragraphs.map(p => {
    if (!p.html.includes('footnote-ref') && !p.kindBodyHtml?.includes('footnote-ref')) return p;
    const copy = { ...p, html: relabel(p.html) };
    if (p.kindBodyHtml !== undefined) copy.kindBodyHtml = relabel(p.kindBodyHtml);
    return copy;
  });

  const referenced = footnotes.filter(fn => labels.has(fn.id))
    .sort((a, b) => Number(labels.get(a.id)) - Number(labels.get(b.id)));
  const unreferenced = footnotes.filter(fn => !labels.has(fn.id));
  const numberedFootnotes = [...referenced, ...unreferenced]
    .map((fn, i) => ({ ...fn, label: String(i + 1) }));

  return { paragraphs: numberedParagraphs, footnotes: numberedFootnotes };
}
