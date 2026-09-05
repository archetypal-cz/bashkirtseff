/**
 * Glossary links are written relative to the file that carries them:
 *
 *   content/_original/NNN/entry.md          -> ../_glossary/people/core/X.md
 *   content/{cz,uk,en,fr,es}/NNN/entry.md   -> ../../_original/_glossary/people/core/X.md
 *   content/_original/_glossary/places/…    -> ../../people/core/X.md
 *
 * Matching on a fixed `../_glossary/` prefix therefore misses most of them.
 * Resolve the link against its own directory instead, and regenerate the new
 * link the same way.
 */

import * as path from 'node:path';

/** Any markdown link whose target is a relative path to a .md file. */
export const MD_LINK_PATTERN = /\[([^\]]*)\]\(([^)\s]+\.md)\)/g;

/**
 * Resolve a markdown link to the glossary entry it points at.
 * Returns the absolute path, or null when the link leaves the glossary tree.
 */
export function resolveGlossaryLink(
  fileDir: string,
  linkPath: string,
  glossaryBase: string
): string | null {
  if (path.isAbsolute(linkPath) || /^[a-z][a-z0-9+.-]*:/i.test(linkPath)) return null;

  const target = path.resolve(fileDir, linkPath);
  const rel = path.relative(path.resolve(glossaryBase), target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;

  return target;
}

/** The relative link a file at `fileDir` should use to reach `targetPath`. */
export function glossaryLinkFrom(fileDir: string, targetPath: string): string {
  return path.relative(fileDir, targetPath).split(path.sep).join('/');
}

export interface GlossaryLinkTarget {
  /** Absolute path of the glossary entry the link should point at. */
  path: string;
  /** Replacement display text; the existing text is kept when omitted. */
  displayText?: string;
}

/**
 * Rewrite the glossary links in `content`. `resolve` receives the absolute path a
 * link currently points at and returns its new target, or null to leave it alone.
 *
 * `newFileDir` is where the file itself is about to live: when the file moves,
 * its own outgoing links have to be regenerated from the new depth.
 */
export function rewriteGlossaryLinks(
  content: string,
  fileDir: string,
  glossaryBase: string,
  resolve: (target: string, displayText: string) => GlossaryLinkTarget | null,
  newFileDir: string = fileDir
): { content: string; count: number } {
  let count = 0;

  const newContent = content.replace(
    new RegExp(MD_LINK_PATTERN.source, 'g'),
    (match, displayText: string, linkPath: string) => {
      const current = resolveGlossaryLink(fileDir, linkPath, glossaryBase);
      if (!current) return match;

      const next = resolve(current, displayText);
      if (!next) return match;

      const newLink = glossaryLinkFrom(newFileDir, next.path);
      const newDisplay = next.displayText ?? displayText;
      if (newLink === linkPath && newDisplay === displayText) return match;

      count++;
      return `[${newDisplay}](${newLink})`;
    }
  );

  return { content: newContent, count };
}
