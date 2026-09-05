import type { APIRoute, GetStaticPaths } from 'astro';
import { buildThisDayData } from '../../../../lib/content';

/**
 * Per-day "This Day in Marie's Life" JSON.
 *
 * Emits one small file per (language, MM-DD) pair under
 * `/data/this-day/{lang}/{MM-DD}.json`, instead of shipping the entire
 * year of preview data as a 1.15 MB island prop on the home page (H1).
 *
 * `buildThisDayData` is cached per language in content.ts (H4/H5), so the
 * ~366 days × 4 languages share a single parse pass per language.
 *
 * The nested `/data/this-day/...` path is covered by the SW runtime-cache
 * route in astro.config.mjs (the `/data/...json` regex was widened to match
 * nested segments), so these files get offline caching for free.
 */

// Languages built for the landing page (content-path codes used in links).
// 'es' is staged: content/es holds only carnet 001, so most days yield a
// French-original preview with hasTranslation:false. ThisDayEntry.vue labels those
// as the original instead of passing them off as Spanish.
const LANGUAGES = ['cz', 'en', 'uk', 'fr', 'es'];

export const getStaticPaths: GetStaticPaths = () => {
  const paths: { params: { lang: string; date: string } }[] = [];

  for (const lang of LANGUAGES) {
    const data = buildThisDayData(lang);
    for (const monthDay of Object.keys(data)) {
      paths.push({ params: { lang, date: monthDay } });
    }
  }

  return paths;
};

export const GET: APIRoute = ({ params }) => {
  const lang = params.lang!;
  const monthDay = params.date!;

  const data = buildThisDayData(lang);
  const entries = data[monthDay] ?? [];

  return new Response(JSON.stringify(entries), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
