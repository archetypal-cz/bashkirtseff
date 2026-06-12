import type { APIRoute, GetStaticPaths } from 'astro';
import cs from '../../../i18n/locales/cs.json';
import en from '../../../i18n/locales/en.json';
import fr from '../../../i18n/locales/fr.json';
import uk from '../../../i18n/locales/uk.json';

/**
 * Per-locale UI message dictionaries served as static, cacheable JSON.
 *
 * Replaces inlining all four locale files (~103 KB) into every page via
 * I18nPatch (H2). I18nPatch now fetches only the active non-default locale's
 * file once (browser- and SW-cached) instead of duplicating 100 KB on every
 * one of ~20k pages.
 *
 * Lives under /data/i18n/ so the SW `/data/.*\.json` runtime route caches it
 * offline for free.
 */

const LOCALES: Record<string, unknown> = { cs, en, fr, uk };

export const getStaticPaths: GetStaticPaths = () =>
  Object.keys(LOCALES).map(locale => ({ params: { locale } }));

export const GET: APIRoute = ({ params }) => {
  const messages = LOCALES[params.locale!];
  if (!messages) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(messages), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
