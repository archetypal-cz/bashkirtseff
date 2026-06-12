import type { APIRoute, GetStaticPaths } from 'astro';
import { getGlossaryEntries, getGlossaryEntry } from '../../../lib/content';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = getGlossaryEntries();
  return entries.map(entry => ({
    params: { id: entry.id },
  }));
};

export const GET: APIRoute = async ({ params }) => {
  // getStaticPaths only emits IDs that exist, so in static output the lookup
  // always succeeds; the previous 404 branch was dead code and was removed.
  const entry = getGlossaryEntry(params.id!)!;

  // Return only what's needed for the tooltip
  const data = {
    id: entry.id,
    name: entry.name,
    type: entry.type,
    summary: entry.summary,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
