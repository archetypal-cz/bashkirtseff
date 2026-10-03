import type { APIRoute, GetStaticPaths } from 'astro';
import { DIARY_LANGUAGES } from '../../../../lib/diary-lang-config';
import { buildCarnetIndex, carnetsWithFiles } from '../../../../lib/paragraph-index';

/**
 * Paragraph index for the "My stars" page (S10):
 * `/data/paragraphs/{lang}/{CCC}.json` -> `{ "0145": ["1873-08-11", "snippet"] }`.
 *
 * One file per (language, carnet) pair that has files in that language's tree
 * (so `es` gets only its pilot carnets); the client falls back to `original`.
 * Carnet 000 rows are `[null, snippet]`: the preface is one page.
 * Keying and snippet rules: lib/paragraph-index.ts.
 *
 * Covered offline by the dedicated SW route in astro.config.mjs, which must
 * stay BEFORE the generic `/data/*.json` route (Workbox uses the first match).
 */

// Site languages plus staged `es` (pilot: only the carnets that exist in content/es get a file),
// as in data/this-day. The French source is `original` (content path `_original`).
const LANGS = DIARY_LANGUAGES.map(l => ({ urlPath: l.urlPath, contentPath: l.contentPath }));
if (!LANGS.some(l => l.urlPath === 'es')) LANGS.push({ urlPath: 'es', contentPath: 'es' });

export const getStaticPaths: GetStaticPaths = () => {
  const paths: { params: { lang: string; carnet: string }; props: { contentPath: string } }[] = [];
  for (const lang of LANGS) {
    for (const carnet of carnetsWithFiles(lang.contentPath)) {
      paths.push({
        params: { lang: lang.urlPath, carnet },
        props: { contentPath: lang.contentPath },
      });
    }
  }
  return paths;
};

export const GET: APIRoute = ({ params, props }) => {
  const index = buildCarnetIndex(props.contentPath as string, params.carnet!);
  return new Response(JSON.stringify(index), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
