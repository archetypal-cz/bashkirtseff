// ─── Admin API server ────────────────────────────────────────────────
//
// One protected endpoint, GET /overview, returns an aggregated snapshot
// of users, bug reports, and site analytics. Access requires a valid
// GoTrue JWT whose email is in the ADMIN_EMAILS allowlist. This is the
// real security boundary — the frontend's email check is only for UX.

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwtVerify } from 'jose';
import { config, isAdmin } from './config.js';
import { getReportStats, getUserStats } from './db.js';
import { getAnalytics } from './umami.js';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: config.corsOrigins,
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
  }),
);

app.get('/health', (c) => c.json({ ok: true }));

const secret = new TextEncoder().encode(config.jwtSecret);

// Auth gate: verify the GoTrue JWT and enforce the admin allowlist.
app.use('/overview', async (c, next) => {
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.json({ error: 'Missing bearer token' }, 401);

  let email: string | undefined;
  try {
    const { payload } = await jwtVerify(token, secret, {
      audience: 'authenticated',
      algorithms: ['HS256'],
    });
    email = (payload.email as string) || undefined;
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }

  if (!isAdmin(email)) return c.json({ error: 'Not authorized' }, 403);
  await next();
});

app.get('/overview', async (c) => {
  const now = Date.now();
  const [users, reports, analytics] = await Promise.all([
    getUserStats(),
    getReportStats(),
    getAnalytics(now),
  ]);
  return c.json({ generatedAt: new Date(now).toISOString(), users, reports, analytics });
});

if (config.adminEmails.length === 0) {
  console.warn('[admin-api] WARNING: ADMIN_EMAILS is empty — no one will be authorized.');
}

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[admin-api] listening on :${info.port}`);
});
