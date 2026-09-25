/**
 * Internal URL helpers.
 *
 * Every page is built in Astro's directory format (`/cz/001/1873-01-11/index.html`),
 * so its real URL ends in `/`. A link without the slash costs a server redirect
 * on every click (web audit 2026-09-25, #1), and hreflang alternates must point
 * at the final, non-redirecting URL. Build internal page links through
 * `withTrailingSlash()`.
 */

/**
 * Append `/` to the path part of a site-relative or absolute URL, keeping any
 * `?query` / `#hash`. Paths that already end in `/` and paths whose last segment
 * looks like a file (`/sitemap-index.xml`, `/data/x.json`) are returned as-is.
 */
export function withTrailingSlash(url: string): string {
  const cut = url.search(/[?#]/);
  const path = cut === -1 ? url : url.slice(0, cut);
  const rest = cut === -1 ? '' : url.slice(cut);
  if (path === '' || path.endsWith('/')) return url;
  const last = path.slice(path.lastIndexOf('/') + 1);
  if (/\.[a-z0-9]+$/i.test(last)) return url;
  return `${path}/${rest}`;
}
