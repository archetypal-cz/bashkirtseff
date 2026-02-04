import type { APIRoute, GetStaticPaths } from 'astro';
import { getGlossaryEntries, getGlossaryEntry } from '../../../lib/content';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = getGlossaryEntries();
  return entries.map(entry => ({
    params: { id: entry.id },
  }));
};

export const GET: APIRoute = async ({ params }) => {
  const entry = getGlossaryEntry(params.id!);

  if (!entry) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
