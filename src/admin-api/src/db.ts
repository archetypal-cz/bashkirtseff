// ─── Database access (read-only) ─────────────────────────────────────
//
// Connects to the same Postgres that backs GoTrue + the reports table.
// The `admin_api` role is SELECT-only with BYPASSRLS so it can read all
// reports (RLS otherwise hides rows belonging to other users).

import pg from 'pg';
import { config } from './config.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 4 });

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

export async function getUserStats(): Promise<UserStats> {
  const { rows } = await pool.query<Record<string, string>>(`
    SELECT
      count(*)                                                            AS total,
      count(*) FILTER (WHERE last_sign_in_at > now() - interval '1 day')  AS active_1d,
      count(*) FILTER (WHERE last_sign_in_at > now() - interval '7 days') AS active_7d,
      count(*) FILTER (WHERE last_sign_in_at > now() - interval '30 days')AS active_30d,
      count(*) FILTER (WHERE created_at      > now() - interval '1 day')  AS new_1d,
      count(*) FILTER (WHERE created_at      > now() - interval '7 days') AS new_7d,
      count(*) FILTER (WHERE created_at      > now() - interval '30 days')AS new_30d
    FROM auth.users
  `);
  const r = rows[0];
  return {
    total: Number(r.total),
    active_1d: Number(r.active_1d),
    active_7d: Number(r.active_7d),
    active_30d: Number(r.active_30d),
    new_1d: Number(r.new_1d),
    new_7d: Number(r.new_7d),
    new_30d: Number(r.new_30d),
  };
}

export async function getReportStats(): Promise<ReportStats> {
  const counts = await pool.query<{ status: string; n: string }>(`
    SELECT status, count(*) AS n FROM public.paragraph_reports GROUP BY status
  `);
  const recent = await pool.query<ReportRow>(`
    SELECT id, paragraph_id, language, reason, created_at
    FROM public.paragraph_reports
    WHERE status = 'open'
    ORDER BY created_at DESC
    LIMIT 10
  `);

  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const row of counts.rows) {
    const n = Number(row.n);
    byStatus[row.status] = n;
    total += n;
  }

  return {
    byStatus,
    open: byStatus.open || 0,
    total,
    recentOpen: recent.rows,
  };
}
