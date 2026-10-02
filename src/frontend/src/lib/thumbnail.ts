import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

/**
 * The gallery-size copy of a site image (`/images/…/thumbs/<file>`, ~480px)
 * when one exists under `public/`, else the image itself. Full-size glossary
 * images run to 1600px, too heavy for a page that shows a dozen of them.
 * Build-time only.
 */
export function thumbnailSrc(src: string): string {
  if (!src.startsWith('/')) return src;
  const thumb = path.posix.join(path.posix.dirname(src), 'thumbs', path.posix.basename(src));
  return fs.existsSync(path.join(PUBLIC_DIR, thumb)) ? thumb : src;
}
