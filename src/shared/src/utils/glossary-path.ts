/**
 * The glossary lives once, under `content/_original/_glossary/`. Links reach it
 * from a different depth depending on which tree the file sits in:
 *
 *   content/_original/NNN/entry.md   -> ../_glossary/...
 *   content/{cz,uk,en,fr,es}/NNN/entry.md -> ../../_original/_glossary/...
 *
 * See docs/VERIFY_CARNET_GATE.md.
 */

const ORIGINAL_PREFIX = '../_glossary/';
const TRANSLATION_PREFIX = '../../_original/_glossary/';

/**
 * Rewrite a glossary link path for the tree the given language lives in.
 * Paths that already carry the right prefix, and paths of any other shape,
 * are returned unchanged.
 */
export function localizeGlossaryPath(filePath: string, language: string): string {
  const toTranslation = Boolean(language) && language !== 'original';

  if (toTranslation) {
    if (filePath.startsWith(TRANSLATION_PREFIX)) return filePath;
    if (filePath.startsWith(ORIGINAL_PREFIX)) {
      return TRANSLATION_PREFIX + filePath.slice(ORIGINAL_PREFIX.length);
    }
    return filePath;
  }

  if (filePath.startsWith(TRANSLATION_PREFIX)) {
    return ORIGINAL_PREFIX + filePath.slice(TRANSLATION_PREFIX.length);
  }
  return filePath;
}
