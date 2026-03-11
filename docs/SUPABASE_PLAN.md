# Auth & Reporting Plan

**Created**: 2026-03-11
**Status**: Planning
**Goal**: Add Google login + paragraph reporting to bashkirtseff.org

---

## Overview

Enable readers to report translation issues at the paragraph level. Self-hosted, lightweight:

1. **GoTrue** — Google OAuth, JWT sessions (1 container)
2. **PostgREST** — REST API with Row-Level Security (1 container)
3. **PostgreSQL** — separate from Umami (1 container)
4. **Privacy page** — DONE, deployed at `/[lang]/privacy`
5. **Report UI** — in the existing ParagraphToolbar bottom sheet

### Architecture

```
Browser                          Docker (deploy server)
───────                          ──────────────────────
                                 ┌─────────────────────┐
  "Sign in with Google"  ──────►│ GoTrue :9999         │──► Google OAuth
  (auth.bashkirtseff.org)        │ JWT tokens, sessions │
                                 └──────────┬──────────┘
                                            │ auth-internal network
  "Submit report"        ──────►┌───────────┴──────────┐
  (api.bashkirtseff.org)        │ PostgREST :3000      │
  + JWT in Authorization        │ validates JWT → RLS  │
                                 └──────────┬──────────┘
                                            │
                                 ┌──────────┴──────────┐
                                 │ PostgreSQL :5432     │
                                 │ paragraph_reports    │
                                 │ + GoTrue auth tables │
                                 └─────────────────────┘
```

### Security model

- **Anonymous** (no JWT) → PostgREST uses `anon` role → RLS blocks everything
- **Authenticated** (valid GoTrue JWT) → `authenticated` role → RLS allows:
  - `INSERT` own reports only (user_id must match JWT sub)
  - `SELECT` own reports only
  - No UPDATE, no DELETE

---

## What's already done

- [x] Privacy policy page at `/[lang]/privacy` (all 4 locales)
- [x] Footer link to privacy page
- [x] `__GIT_COMMIT__` injected at build time
- [x] Google OAuth credentials obtained (Client ID + Secret)
- [x] `src/auth/docker-compose.yml` — GoTrue + PostgREST + PostgreSQL
- [x] `src/auth/init.sql` — reports table, RLS policies, PostgREST roles
- [x] `src/auth/.env.example` — secrets template
- [x] `src/frontend/.env.example` — updated with AUTH_URL + API_URL

---

## Phase 1: Deploy Auth Stack

### 1.1 Google Cloud Console (manual)

- [x] Client ID: `748018055544-...apps.googleusercontent.com`
- [x] Client Secret: `GOCSPX-...` (in GitHub Secrets)
- [ ] Update **Authorized redirect URIs** to: `https://auth.bashkirtseff.org/callback`
- [ ] Update **Authorized JavaScript origins**: `https://bashkirtseff.org`, `http://localhost:4321`
- [ ] Privacy policy URL: `https://bashkirtseff.org/en/privacy`
- [ ] Publish consent screen (move from "Testing" to "Production")

### 1.2 Deploy on server (manual)

```bash
cd src/auth
cp .env.example .env
# Edit .env:
#   POSTGRES_PASSWORD=<openssl rand -hex 16>
#   JWT_SECRET=<openssl rand -hex 32>
#   GOOGLE_CLIENT_ID=748018055544-...
#   GOOGLE_CLIENT_SECRET=GOCSPX-...

docker compose up -d
```

### 1.3 Nginx Proxy Manager (manual)

Add two proxy hosts:

| Domain | Forward to | SSL |
|--------|-----------|-----|
| `auth.bashkirtseff.org` | `gotrue:9999` | Let's Encrypt |
| `api.bashkirtseff.org` | `postgrest:3000` | Let's Encrypt |

### 1.4 Test auth flow

```bash
# Health check
curl https://auth.bashkirtseff.org/health

# Test Google OAuth redirect
open https://auth.bashkirtseff.org/authorize?provider=google

# Test PostgREST (should return empty array or 401)
curl https://api.bashkirtseff.org/paragraph_reports
```

---

## Phase 2: Frontend Auth

### 2.1 Auth Client Library

- [ ] Create `src/frontend/src/lib/auth.ts`:

```typescript
const AUTH_URL = import.meta.env.PUBLIC_AUTH_URL; // https://auth.bashkirtseff.org

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

/** Redirect to Google OAuth via GoTrue */
export function signInWithGoogle() {
  const redirectTo = encodeURIComponent(window.location.href);
  window.location.href = `${AUTH_URL}/authorize?provider=google&redirect_to=${redirectTo}`;
}

/** Exchange tokens, get session */
export async function getSession(): Promise<Session | null> {
  const token = localStorage.getItem('auth-token');
  if (!token) return null;

  const res = await fetch(`${AUTH_URL}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    localStorage.removeItem('auth-token');
    return null;
  }
  const user = await res.json();
  return { access_token: token, refresh_token: '', expires_at: 0, user };
}

/** Handle the callback — GoTrue redirects back with tokens in URL hash */
export function handleCallback(): Session | null {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return null;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken) {
    localStorage.setItem('auth-token', accessToken);
    if (refreshToken) localStorage.setItem('auth-refresh', refreshToken);
    // Clean URL
    window.history.replaceState(null, '', window.location.pathname);
    return { access_token: accessToken, refresh_token: refreshToken || '', expires_at: 0, user: {} as User };
  }
  return null;
}

/** Sign out */
export async function signOut() {
  const token = localStorage.getItem('auth-token');
  if (token) {
    await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-refresh');
}
```

### 2.2 Auth State Store

- [ ] Create `src/frontend/src/stores/auth.ts` (Pinia):

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getSession, signInWithGoogle, signOut as authSignOut, handleCallback } from '../lib/auth';
import type { User, Session } from '../lib/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);

  const isAuthenticated = computed(() => !!user.value);
  const displayName = computed(() => user.value?.user_metadata?.full_name || user.value?.email || null);
  const avatarUrl = computed(() => user.value?.user_metadata?.avatar_url || null);
  const token = computed(() => session.value?.access_token || null);

  async function init() {
    if (typeof window === 'undefined') return;

    // Check for OAuth callback tokens in URL hash
    const callbackSession = handleCallback();
    if (callbackSession) {
      session.value = callbackSession;
      // Fetch full user profile
      const fullSession = await getSession();
      if (fullSession) {
        session.value = fullSession;
        user.value = fullSession.user;
      }
      loading.value = false;
      return;
    }

    // Check existing session
    const existing = await getSession();
    if (existing) {
      session.value = existing;
      user.value = existing.user;
    }
    loading.value = false;
  }

  async function signIn() {
    signInWithGoogle();
  }

  async function signOut() {
    await authSignOut();
    user.value = null;
    session.value = null;
  }

  return {
    user, session, loading,
    isAuthenticated, displayName, avatarUrl, token,
    init, signIn, signOut,
  };
});
```

### 2.3 Login UI

- [ ] Create `src/components/auth/UserMenu.vue`:
  - Unauthenticated: "Sign in with Google" button
  - Pre-login info: "Sign in to report translation issues" + privacy link
  - Authenticated: avatar + name + "Sign out"
  - Minimal, fits in UnifiedMenu or header
- [ ] Add `<UserMenu client:load />` to layout
- [ ] Add i18n keys to all 4 locale files

---

## Phase 3: Paragraph Reports

### 3.1 Report Service

- [ ] Create `src/frontend/src/lib/reports.ts`:

```typescript
const API_URL = import.meta.env.PUBLIC_API_URL; // https://api.bashkirtseff.org

declare const __GIT_COMMIT__: string;

export interface ReportData {
  paragraphId: string;
  language: string;
  reason: string;
  customReason?: string;
  highlightedText?: string;
}

export async function submitReport(data: ReportData, token: string) {
  const res = await fetch(`${API_URL}/paragraph_reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      paragraph_id: data.paragraphId,
      language: data.language,
      commit_hash: __GIT_COMMIT__,
      reason: data.reason,
      custom_reason: data.customReason || null,
      highlighted_text: data.highlightedText || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Report failed: ${res.status}`);
  }
}

export async function getMyReports(token: string) {
  const res = await fetch(`${API_URL}/paragraph_reports?order=created_at.desc`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
  return res.json();
}
```

**Note**: PostgREST automatically sets `user_id` from the JWT `sub` claim via RLS — the frontend doesn't send it.

Wait — actually PostgREST doesn't auto-set `user_id`. We need a database trigger or default:

```sql
-- Add to init.sql: auto-set user_id from JWT
ALTER TABLE paragraph_reports
  ALTER COLUMN user_id SET DEFAULT (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
```

Then the frontend doesn't need to include `user_id` in the POST body — it's set by PostgreSQL.

### 3.2 Report Reasons

| Code | Label (EN) | Label (CZ) |
|------|-----------|-------------|
| `bad_translation` | Bad translation | Špatný překlad |
| `unnatural` | Unnatural phrasing | Nepřirozená formulace |
| `missing_text` | Missing or truncated text | Chybějící nebo oříznutý text |
| `wrong_language` | Wrong language / garbled | Špatný jazyk / zkomolený text |
| `factual_error` | Factual or historical error | Věcná nebo historická chyba |
| `typo` | Typo or grammar | Překlep nebo gramatika |
| `other` | Other (describe below) | Jiné (popište níže) |

### 3.3 Report UI in ParagraphToolbar

- [ ] Add "Report issue" button to ParagraphToolbar bottom sheet
  - Only when authenticated
  - If not authenticated: "Sign in to report"
- [ ] Create `ReportDialog.vue` (same bottom sheet pattern)
  - Reason picker → optional text → submit → success
  - `trackEvent('report_submit', { paragraphId, reason })`

---

## Phase 4: Cookie Consent

- [ ] Create `CookieConsent.vue` — banner on first visit
- [ ] Two tiers: essential (no auth) / accept all (enables auth)
- [ ] Umami is cookie-free → always runs
- [ ] Store in `localStorage: cookie-consent`
- [ ] Auth store checks consent before initializing

---

## Phase 5: Future (Not Now)

- [ ] "My reports" page
- [ ] Admin dashboard for triaging reports
- [ ] Additional OAuth providers
- [ ] Notes, ratings, reading progress
- [ ] Account deletion self-service (GDPR)
- [ ] Token refresh flow (GoTrue refresh tokens)
- [ ] Rate limiting

---

## Files Summary

### Already created
| File | Purpose |
|------|---------|
| `src/auth/docker-compose.yml` | GoTrue + PostgREST + PostgreSQL |
| `src/auth/init.sql` | Reports table, RLS, PostgREST roles |
| `src/auth/.env.example` | Secrets template |
| `src/frontend/.env.example` | Updated with AUTH_URL + API_URL |
| `src/frontend/src/pages/[lang]/privacy.astro` | Privacy policy |
| `src/frontend/src/pages/privacy.astro` | Language redirect |

### To create (frontend)
| File | Purpose |
|------|---------|
| `src/frontend/src/lib/auth.ts` | GoTrue client (fetch-based) |
| `src/frontend/src/lib/reports.ts` | PostgREST report submission |
| `src/frontend/src/stores/auth.ts` | Auth Pinia store |
| `src/frontend/src/components/auth/UserMenu.vue` | Login/logout UI |
| `src/frontend/src/components/reading/ReportDialog.vue` | Report form |
| `src/frontend/src/components/legal/CookieConsent.vue` | Cookie banner |

### To modify (frontend)
| File | Change |
|------|--------|
| `src/frontend/package.json` | No new deps needed! (pure fetch) |
| `src/frontend/Dockerfile` | Add AUTH_URL + API_URL build args |
| `src/frontend/docker-compose.yml` | Add AUTH_URL + API_URL build args |
| `src/frontend/src/vue-app.ts` | Init auth store |
| `src/frontend/src/components/reading/ParagraphToolbar.vue` | Add report button |
| `src/frontend/src/i18n/locales/*.json` | Auth + report i18n keys |

---

## Resolved Questions

| Question | Answer |
|----------|--------|
| Self-hosted or cloud? | **Self-hosted** — GoTrue + PostgREST + PostgreSQL (3 containers) |
| Need Supabase JS client? | **No** — pure `fetch()` against GoTrue + PostgREST APIs |
| How does RLS work? | PostgREST validates JWT → sets PostgreSQL role → RLS policies enforce access |
| Env vars? | `PUBLIC_AUTH_URL` + `PUBLIC_API_URL` baked at build time |
| Git hash? | Already done — `__GIT_COMMIT__` |
| Google redirect URI? | `https://auth.bashkirtseff.org/callback` |

---

## Implementation Order

1. **Deploy auth stack** on server (docker compose up)
2. **Configure Nginx Proxy Manager** (auth + api subdomains)
3. **Update Google OAuth** redirect URI to `auth.bashkirtseff.org`
4. **Test** auth flow manually (curl / browser)
5. **Frontend**: auth client, store, UserMenu
6. **Frontend**: report service, ReportDialog, ParagraphToolbar integration
7. **Cookie consent** banner
8. **Test end-to-end**, deploy
