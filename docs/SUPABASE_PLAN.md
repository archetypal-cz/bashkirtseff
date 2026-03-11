# Supabase Integration Plan

**Created**: 2026-03-11
**Status**: Planning
**Goal**: Add Google login + paragraph reporting to bashkirtseff.org

---

## Overview

Enable readers to report translation issues at the paragraph level. This requires:

1. **Supabase project** — PostgreSQL + Auth backend
2. **Google OAuth** — simple login, no passwords
3. **Cookie consent + privacy** — GDPR compliance before any auth
4. **Paragraph report UI** — in the existing ParagraphToolbar bottom sheet
5. **Reports table** — stores reports with commit hash, language, paragraph ID

This is the first Supabase feature. Once the foundation is in place, future features (notes, ratings, reading progress) can build on it.

---

## Architecture Context

### What already exists

- **AstroJS 5.x PWA** with Vue 3 islands, Pinia stores, Tailwind CSS
- **4 Pinia stores**: preferences, history, offline, filter — all follow `init()` + `persist()` pattern
- **i18n**: `useI18n()` composable, 4 locales (cs, en, fr, uk) in `src/i18n/locales/*.json`
- **ParagraphToolbar.vue**: Bottom sheet with Teleport-to-body pattern, props include `paragraphId`, `htmlContent`, `language`
- **Analytics**: Provider-swappable `trackEvent()` system (currently Umami)
- **Git hash already injected**: `__GIT_COMMIT__` defined in `astro.config.mjs` via `getGitCommitHash()`
- **Docker deployment**: Multi-stage Dockerfile → nginx, auto-deploy via GitHub Actions + Tailscale SSH
- **Env vars**: `PUBLIC_*` prefix baked at build time via Dockerfile ARGs, `.env.example` exists
- **nginx.conf**: Security headers (HSTS, X-Frame-Options, etc.) but **no CSP header yet**
- **Cross-island sync**: `CustomEvent` + `localStorage` pattern (used by filter store)

### What doesn't exist yet

- Zero auth code anywhere
- No Supabase dependency
- No cookie consent mechanism
- No privacy policy page
- No CSP `connect-src` directive

---

## Phase 0: Legal & Consent

Before any auth or data collection, the site needs GDPR-compliant consent.

### 0.1 Privacy Policy Page

- [ ] Create `/privacy/` page (Astro static page)
- [ ] Content must cover:
  - **What we collect**: Google profile (name, email, avatar) via OAuth; paragraph reports
  - **Why**: To let readers report translation issues and track their reports
  - **Storage**: Supabase (hosted in EU region if possible), PostgreSQL
  - **Retention**: Reports kept indefinitely for translation improvement; account can be deleted on request
  - **Analytics**: Umami (privacy-friendly, no cookies, no personal data)
  - **Cookies**: Supabase auth session cookie (set only after login)
  - **Third parties**: Google (OAuth), Supabase (backend)
  - **Contact**: Project email for data requests
  - **Rights**: Access, deletion, portability (GDPR Articles 15-20)
- [ ] Available in all 4 UI languages (cs, en, fr, uk)
- [ ] Link from footer on every page

### 0.2 Cookie Consent Banner

- [ ] Create `src/components/legal/CookieConsent.vue`
- [ ] Show on first visit (check `localStorage` flag)
- [ ] Two tiers:
  - **Essential only** (default) — no cookies, no auth, no Supabase calls
  - **Accept all** — enables auth cookies (Supabase session)
- [ ] Umami doesn't use cookies → always runs (no consent needed)
- [ ] Store consent in `localStorage: cookie-consent` = `'essential'` | `'all'`
- [ ] Add to `BaseLayout.astro` as `<CookieConsent client:idle />`
- [ ] i18n keys for banner text in all 4 locales
- [ ] "Manage cookies" link in footer to re-show banner

### 0.3 Login Screen Info

- [ ] When user clicks "Sign in" (before redirect to Google):
  - Brief explanation: "Sign in to report translation issues"
  - "We only use your name and email to identify your reports"
  - Link to privacy policy
  - "By signing in, you agree to our privacy policy"
- [ ] This can be a small info section in the UserMenu or a pre-login modal

---

## Phase 1: Supabase Foundation

### 1.1 Google Cloud Console Setup (manual)

- [ ] Create Google Cloud project (or use existing)
- [ ] Configure **OAuth Consent Screen**:
  - App name: "Deník Marie Bashkirtseff" (or "Marie Bashkirtseff Diary")
  - User support email: project contact
  - Authorized domains: `bashkirtseff.org`, `supabase.co`
  - Scopes: `email`, `profile` (minimal — no drive, no calendar)
  - Logo: optional but adds trust
  - Privacy policy URL: `https://bashkirtseff.org/privacy/`
  - **Publishing status**: Start "Testing" (100 users), publish when ready
- [ ] Create **OAuth 2.0 Client ID** (Web application):
  - Authorized JavaScript origins: `https://bashkirtseff.org`, `http://localhost:4321`
  - Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`
  - Save Client ID + Client Secret

### 1.2 Supabase Project Setup (manual, in dashboard)

- [ ] Create Supabase project (prefer **EU region** for GDPR)
- [ ] Auth → Providers → Enable Google:
  - Client ID + Client Secret from Google Cloud
- [ ] Auth → URL Configuration:
  - Site URL: `https://bashkirtseff.org`
  - Redirect URLs: `https://bashkirtseff.org`, `http://localhost:4321`
- [ ] Note project URL (`https://xxx.supabase.co`) and anon key

### 1.3 Frontend Integration

- [ ] Install `@supabase/supabase-js` in `src/frontend/`
- [ ] Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] Update `src/frontend/.env.example`:

```env
# Supabase — get from Supabase dashboard → Settings → API
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx
```

- [ ] Add Dockerfile build args (same pattern as Umami):

```yaml
# In src/frontend/docker-compose.yml, under build.args:
PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:-}
PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY:-}
```

```dockerfile
# In src/frontend/Dockerfile, in builder stage:
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
```

- [ ] Deploy server: add values to `.env` on the server (same as Umami setup)

### 1.4 Git Commit Hash (already done!)

The `__GIT_COMMIT__` constant is already injected in `astro.config.mjs`:

```typescript
vite: {
  define: {
    __GIT_COMMIT__: JSON.stringify(getGitCommitHash()),
    // ... other defines
  }
}
```

No new `build-info.ts` needed — just use `__GIT_COMMIT__` directly (declare in a `.d.ts` if needed for TypeScript).

### 1.5 CSP / Security Headers

Currently **no CSP header** in nginx.conf. Two options:

- **Option A** (recommended): Add to nginx.conf:
  ```nginx
  add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://*.supabase.co https://accounts.google.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.googleusercontent.com;" always;
  ```

- **Option B**: Don't add CSP yet (simpler, Supabase works without it), add later when hardening

---

## Phase 2: Authentication

### 2.1 Auth State Store

- [ ] Create `src/stores/auth.ts` (Pinia store, following existing patterns):

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);

  const isAuthenticated = computed(() => !!user.value);
  const displayName = computed(() =>
    user.value?.user_metadata?.full_name || user.value?.email || null
  );
  const avatarUrl = computed(() =>
    user.value?.user_metadata?.avatar_url || null
  );

  async function init() {
    if (typeof window === 'undefined') return; // SSR safety

    // Check cookie consent before initializing Supabase auth
    const consent = localStorage.getItem('cookie-consent');
    if (consent !== 'all') {
      loading.value = false;
      return; // Don't initialize auth without consent
    }

    const { data } = await supabase.auth.getSession();
    session.value = data.session;
    user.value = data.session?.user ?? null;
    loading.value = false;

    supabase.auth.onAuthStateChange((_event, s) => {
      session.value = s;
      user.value = s?.user ?? null;
    });
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) console.error('Auth error:', error);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    user, session, loading,
    isAuthenticated, displayName, avatarUrl,
    init, signInWithGoogle, signOut,
  };
});
```

### 2.2 Login UI

- [ ] Create `src/components/auth/UserMenu.vue`:
  - Unauthenticated: "Sign in with Google" button (Google brand guidelines)
  - Pre-login info: "Sign in to report translation issues" + privacy link
  - Authenticated: user avatar + name + dropdown with "Sign out"
  - Minimal footprint, fits in existing UnifiedMenu or header area
- [ ] Add `<UserMenu client:load />` to BaseLayout header
- [ ] Initialize auth store in `vue-app.ts` (alongside other stores)
- [ ] Add i18n keys to all 4 locale files:

```json
{
  "auth": {
    "signIn": "Sign in with Google",
    "signOut": "Sign out",
    "signInInfo": "Sign in to report translation issues",
    "privacyNote": "We only use your name and email to identify reports.",
    "privacyLink": "Privacy policy"
  }
}
```

### 2.3 Auth Callback

- [ ] Supabase handles OAuth callback automatically:
  1. User clicks "Sign in" → redirected to Google consent screen
  2. Google redirects to `https://<project>.supabase.co/auth/v1/callback`
  3. Supabase sets session cookie, redirects to `redirectTo` URL
  4. `onAuthStateChange` fires, auth store updates reactively
- [ ] Test full flow on localhost:4321 (add to Google OAuth origins + Supabase redirects)
- [ ] Cross-island sync: auth state change dispatches `CustomEvent('auth-sync')` for other islands

---

## Phase 3: Paragraph Reports

### 3.1 Database Table

- [ ] Create in Supabase SQL editor:

```sql
CREATE TABLE paragraph_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paragraph_id TEXT NOT NULL,        -- e.g. "008.0145"
  language TEXT NOT NULL,            -- e.g. "cz", "en"
  commit_hash TEXT NOT NULL,         -- git hash at build time
  reason TEXT NOT NULL,              -- reason code
  custom_reason TEXT,                -- free text (when reason = 'other')
  highlighted_text TEXT,             -- paragraph text user saw
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'fixed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_paragraph ON paragraph_reports(paragraph_id, language);
CREATE INDEX idx_reports_status ON paragraph_reports(status) WHERE status = 'open';
CREATE INDEX idx_reports_user ON paragraph_reports(user_id);

-- RLS: authenticated users can create reports
ALTER TABLE paragraph_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON paragraph_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON paragraph_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin access: configure via Supabase dashboard roles or add policy for specific user IDs
```

### 3.2 Report Reasons

Pre-defined reason codes (stored in `reason` column):

| Code | Label (EN) | Label (CZ) |
|------|-----------|-------------|
| `bad_translation` | Bad translation | Špatný překlad |
| `unnatural` | Unnatural phrasing | Nepřirozená formulace |
| `missing_text` | Missing or truncated text | Chybějící nebo oříznutý text |
| `wrong_language` | Wrong language / garbled | Špatný jazyk / zkomolený text |
| `factual_error` | Factual or historical error | Věcná nebo historická chyba |
| `typo` | Typo or grammar | Překlep nebo gramatika |
| `other` | Other (describe below) | Jiné (popište níže) |

### 3.3 Report Service

- [ ] Create `src/lib/reports.ts`:

```typescript
import { supabase } from './supabase';

declare const __GIT_COMMIT__: string;

export interface ReportData {
  paragraphId: string;
  language: string;
  reason: string;
  customReason?: string;
  highlightedText?: string;
}

export async function submitReport(data: ReportData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be logged in to report');

  const { error } = await supabase.from('paragraph_reports').insert({
    user_id: user.id,
    paragraph_id: data.paragraphId,
    language: data.language,
    commit_hash: __GIT_COMMIT__,
    reason: data.reason,
    custom_reason: data.customReason || null,
    highlighted_text: data.highlightedText || null,
  });

  if (error) throw error;
}
```

### 3.4 Report UI in ParagraphToolbar

- [ ] Add "Report issue" button to the bottom sheet in `ParagraphToolbar.vue`
  - Flag icon (SVG, matching existing toolbar aesthetic)
  - Only visible when user is authenticated (check auth store)
  - If not authenticated: show inline "Sign in to report" with login button

- [ ] Create `src/components/reading/ReportDialog.vue`:
  - Uses same Teleport-to-body + bottom sheet pattern as ParagraphToolbar
  - Reason picker (tappable list, theme-aware)
  - Text field for custom reason (shown when "Other" selected)
  - Shows the paragraph text being reported (truncated preview)
  - Submit button with loading state
  - Success confirmation ("Thank you! We'll review this.")
  - Analytics: `trackEvent('report_submit', { paragraphId, reason })`

- [ ] Flow:
  1. User taps ⋯ on a paragraph → bottom sheet opens (existing)
  2. User taps "Report issue" → sheet transitions to report form
  3. User selects reason, optionally adds detail
  4. Submit → success message → sheet closes

### 3.5 Highlighted Text Capture

**Phase 3** (simple): Pass `htmlContent` prop (full paragraph text) as `highlighted_text`. Already available on ParagraphToolbar.

**Phase 4** (future): Capture `window.getSelection()` for user-selected text.

---

## Phase 4: Future Enhancements (Not Now)

These build on the Supabase foundation but are out of scope for this first pass:

- [ ] User text selection → report only highlighted portion
- [ ] "My reports" page — user can see their submitted reports
- [ ] Admin dashboard — review/triage reports, mark as fixed
- [ ] Email notifications on new reports (Supabase Edge Functions or webhook)
- [ ] Additional OAuth providers (Microsoft, Facebook, Apple)
- [ ] Notes, ratings, reading progress
- [ ] Rate limiting / spam prevention (Supabase rate limits + RLS)
- [ ] Account deletion self-service (GDPR right to erasure)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| **Phase 0: Legal** | | |
| `src/frontend/src/pages/privacy.astro` | Create | Privacy policy page |
| `src/frontend/src/components/legal/CookieConsent.vue` | Create | Cookie consent banner |
| `src/frontend/src/layouts/BaseLayout.astro` | Modify | Add CookieConsent + footer links |
| **Phase 1: Foundation** | | |
| `src/frontend/package.json` | Modify | Add `@supabase/supabase-js` |
| `src/frontend/.env.example` | Modify | Add Supabase URL + anon key |
| `src/frontend/Dockerfile` | Modify | Add Supabase build ARGs |
| `src/frontend/docker-compose.yml` | Modify | Add Supabase build args |
| `src/frontend/src/lib/supabase.ts` | Create | Supabase client singleton |
| **Phase 2: Auth** | | |
| `src/frontend/src/stores/auth.ts` | Create | Auth state (Pinia) |
| `src/frontend/src/vue-app.ts` | Modify | Init auth store |
| `src/frontend/src/components/auth/UserMenu.vue` | Create | Login/logout UI |
| `src/frontend/src/i18n/locales/*.json` | Modify | Auth + consent i18n keys (all 4) |
| **Phase 3: Reports** | | |
| `src/frontend/src/lib/reports.ts` | Create | Report submission service |
| `src/frontend/src/components/reading/ReportDialog.vue` | Create | Report form |
| `src/frontend/src/components/reading/ParagraphToolbar.vue` | Modify | Add report button |

---

## Resolved Questions

| Question | Answer |
|----------|--------|
| Self-hosted or cloud Supabase? | **Cloud** (less ops burden, free tier likely sufficient) |
| How are env vars injected? | **Dockerfile ARGs** → baked into static HTML at build. Same pattern as Umami. Deploy server `.env` file. |
| Site URL for OAuth? | `https://bashkirtseff.org` (Site URL in Supabase), also add `http://localhost:4321` for dev |
| Git hash injection? | **Already done** — `__GIT_COMMIT__` in `astro.config.mjs` vite.define |
| CSP needed? | **Not yet** — no CSP header exists. Add when hardening security. |

## Open Questions

1. **Google Cloud project** — create new or use existing? Need access to Google Cloud Console.
2. **Supabase region** — EU (Frankfurt) preferred for GDPR. Need to create project.
3. **Admin report review** — Start with Supabase dashboard Table Editor, build admin view later?
4. **Privacy policy** — needs legal review? Or pragmatic self-written version?
5. **Cookie consent library** — roll our own (simple) or use a library like `vue-cookie-comply`?
6. **Google OAuth consent screen logo** — use a project image?

---

## Implementation Order

1. **Phase 0**: Privacy policy page + cookie consent banner
2. **Manual setup**: Google Cloud Console OAuth + Supabase project creation
3. **Phase 1**: Install deps, create client, update env/Docker
4. **Phase 2**: Auth store, UserMenu, test login flow
5. **Phase 3**: Database table, report service, report UI in ParagraphToolbar
6. **Test end-to-end** on localhost, then deploy
