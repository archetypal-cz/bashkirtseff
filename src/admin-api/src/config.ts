// ─── Configuration ───────────────────────────────────────────────────
//
// All values come from the environment (see .env.example). This service
// holds privileged secrets (DB access, Umami credentials) and must never
// be reachable except via the nginx proxy at admin.bashkirtseff.org.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT || 8080),

  // JWT verification — shared HS256 secret with GoTrue + PostgREST.
  jwtSecret: required('JWT_SECRET'),

  // Comma-separated allowlist of admin emails (lowercased on compare).
  adminEmails: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  // Read-only connection to the GoTrue/reports Postgres.
  databaseUrl: required('DATABASE_URL'),

  // Allowed browser origins for CORS.
  corsOrigins: (process.env.CORS_ORIGINS || 'https://bashkirtseff.org,http://localhost:4321')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  // Umami analytics — either an API key OR username/password.
  umami: {
    url: (process.env.UMAMI_URL || 'https://your-umami-instance.example').replace(/\/$/, ''),
    websiteId: process.env.UMAMI_WEBSITE_ID || '',
    apiKey: process.env.UMAMI_API_KEY || '',
    username: process.env.UMAMI_USERNAME || '',
    password: process.env.UMAMI_PASSWORD || '',
  },
};

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return config.adminEmails.includes(email.toLowerCase());
}
