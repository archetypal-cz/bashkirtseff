// ─── Admin Dashboard Service ─────────────────────────────────────────
//
// Fetches the aggregated admin overview from the admin-api backend.
// The caller's GoTrue JWT is passed in the Authorization header; the
// backend verifies it and enforces the admin email allowlist.

const ADMIN_API_URL = import.meta.env.PUBLIC_ADMIN_API_URL || 'https://admin.bashkirtseff.org';

export interface UserStats {
  total: number;
  active_1d: number;
  active_7d: number;
  active_30d: number;
  new_1d: number;
  new_7d: number;
  new_30d: number;
}

export interface ReportRow {
  id: string;
  paragraph_id: string;
  language: string;
  reason: string;
  created_at: string;
}

export interface ReportStats {
  byStatus: Record<string, number>;
  open: number;
  total: number;
  recentOpen: ReportRow[];
}

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

export interface Overview {
  generatedAt: string;
  users: UserStats;
  reports: ReportStats;
  analytics: Analytics | null;
}

/** HTTP status 403 means the signed-in account is not on the admin allowlist. */
export class NotAuthorizedError extends Error {}

export async function getOverview(token: string): Promise<Overview> {
  const res = await fetch(`${ADMIN_API_URL}/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) throw new NotAuthorizedError('Not authorized');
  if (!res.ok) throw new Error(`Failed to load dashboard: ${res.status}`);
  return res.json();
}
