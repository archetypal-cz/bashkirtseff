// ─── Umami analytics client ──────────────────────────────────────────
//
// Reads pageview/visitor stats from the self-hosted Umami instance for
// three windows (day / 7d / 30d). Authenticates with an API key if one is
// configured, otherwise logs in with username/password and caches the
// bearer token in memory. Any failure returns null so the rest of the
// dashboard still renders.

import { config } from './config.js';

export interface RangeStats {
  pageviews: number;
  visitors: number;
  visits: number;
}

export interface Analytics {
  day: RangeStats;
  week: RangeStats;
  month: RangeStats;
}

const DAY_MS = 24 * 60 * 60 * 1000;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { apiKey, username, password, url } = config.umami;

  if (apiKey) return { 'x-umami-api-key': apiKey };

  if (!username || !password) {
    throw new Error('No Umami credentials configured (set UMAMI_API_KEY or UMAMI_USERNAME/PASSWORD)');
  }

  // Reuse a cached login token until it nears expiry (tokens last ~1 day;
  // refresh after 12h to be safe).
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return { Authorization: `Bearer ${cachedToken.value}` };
  }

  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Umami login failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  cachedToken = { value: data.token, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  return { Authorization: `Bearer ${cachedToken.value}` };
}

async function fetchRange(
  headers: Record<string, string>,
  startAt: number,
  endAt: number,
): Promise<RangeStats> {
  const { url, websiteId } = config.umami;
  const qs = new URLSearchParams({ startAt: String(startAt), endAt: String(endAt) });
  const res = await fetch(`${url}/api/websites/${websiteId}/stats?${qs}`, { headers });
  if (!res.ok) throw new Error(`Umami stats failed: ${res.status}`);

  // Umami returns { pageviews: {value, prev}, visitors: {...}, visits: {...}, ... }
  const data = (await res.json()) as Record<string, { value: number } | undefined>;
  return {
    pageviews: data.pageviews?.value ?? 0,
    visitors: data.visitors?.value ?? 0,
    visits: data.visits?.value ?? 0,
  };
}

export async function getAnalytics(now: number): Promise<Analytics | null> {
  if (!config.umami.websiteId) return null;
  try {
    const headers = await getAuthHeaders();
    const [day, week, month] = await Promise.all([
      fetchRange(headers, now - DAY_MS, now),
      fetchRange(headers, now - 7 * DAY_MS, now),
      fetchRange(headers, now - 30 * DAY_MS, now),
    ]);
    return { day, week, month };
  } catch (err) {
    console.error('[umami] analytics unavailable:', err instanceof Error ? err.message : err);
    return null;
  }
}
