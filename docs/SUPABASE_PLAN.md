# Supabase Integration Plan

**Created**: 2026-03-11
**Status**: Planning
**Goal**: Add Google login + paragraph reporting to bashkirtseff.org

---

## Overview

Enable readers to report translation issues at the paragraph level. This requires:

1. **Supabase project** — PostgreSQL + Auth backend
2. **Google OAuth** — simple login, no passwords
3. **Paragraph report UI** — in the existing ParagraphToolbar bottom sheet
4. **Reports table** — stores reports with commit hash, language, paragraph ID

This is the first Supabase feature. Once the foundation is in place, future features (notes, ratings, reading progress) can build on it.

---

## Phase 1: Supabase Foundation

### 1.1 Supabase Project Setup (manual, in dashboard)

- [ ] Create Supabase project
- [ ] Enable Google OAuth provider
  - Google Cloud Console: create OAuth 2.0 credentials
  - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
  - Add client ID + secret to Supabase Auth settings
- [ ] Note project URL and anon key

### 1.2 Frontend Integration

- [ ] Install `@supabase/supabase-js`
- [ ] Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] Add `.env` (local) and production env vars:

```
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx
```

- [ ] Add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to Docker/deployment env
- [ ] Update CSP in `astro.config.mjs` to allow `connect-src: https://*.supabase.co`

### 1.3 Git Commit Hash at Build Time

Inject the current git commit hash so reports can reference which translation version they're about:

- [ ] Add to `astro.config.mjs`:

```typescript
vite: {
  define: {
    __GIT_HASH__: JSON.stringify(
      execSync('git rev-parse --short HEAD').toString().trim()
    ),
  },
}
```

- [ ] Create `src/lib/build-info.ts`:

```typescript
export const GIT_HASH: string = __GIT_HASH__;
```

---

## Phase 2: Authentication

### 2.1 Auth State Store

- [ ] Create `src/stores/auth.ts` (Pinia store):

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);

  async function init() {
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

  return { user, session, loading, init, signInWithGoogle, signOut };
});
```

### 2.2 Login UI

- [ ] Create `src/components/auth/UserMenu.vue`:
  - Unauthenticated: "Sign in with Google" button
  - Authenticated: user avatar + dropdown with "Sign out"
  - Minimal, fits in existing header/UnifiedMenu
- [ ] Add `<UserMenu client:load />` to header area
- [ ] Initialize auth store on app mount
- [ ] Add i18n keys for login/logout labels

### 2.3 Auth Callback

- [ ] Verify Supabase handles the OAuth callback automatically (it does — the redirect URL points to Supabase, which then redirects back to `redirectTo`)
- [ ] Test full flow: click login → Google consent → redirect back → user visible

---

## Phase 3: Paragraph Reports

### 3.1 Database Table

- [ ] Create in Supabase SQL editor:

```sql
CREATE TABLE paragraph_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paragraph_id TEXT NOT NULL,
  language TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  reason TEXT NOT NULL,
  custom_reason TEXT,
  highlighted_text TEXT,
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'fixed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying reports by paragraph
CREATE INDEX idx_reports_paragraph ON paragraph_reports(paragraph_id, language);

-- Index for querying open reports
CREATE INDEX idx_reports_status ON paragraph_reports(status) WHERE status = 'open';

-- RLS: anyone authenticated can create reports
ALTER TABLE paragraph_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON paragraph_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON paragraph_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin access (for reviewing reports) — configure via Supabase dashboard roles
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
import { GIT_HASH } from './build-info';

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
    commit_hash: GIT_HASH,
    reason: data.reason,
    custom_reason: data.customReason || null,
    highlighted_text: data.highlightedText || null,
  });

  if (error) throw error;
}
```

### 3.4 Report UI in ParagraphToolbar

- [ ] Add "Report issue" button to the bottom sheet in `ParagraphToolbar.vue`
  - Flag icon (🚩 or SVG)
  - Only visible when user is authenticated
  - If not authenticated, clicking shows "Sign in to report issues"

- [ ] Create `src/components/reading/ReportDialog.vue`:
  - Reason picker (radio buttons or tappable list)
  - Text field for custom reason (shown when "Other" selected)
  - Shows the currently highlighted text block (passed as prop)
  - Submit button with loading state
  - Success confirmation ("Thank you! We'll review this.")
  - Slides up within the existing bottom sheet pattern

- [ ] Flow:
  1. User taps ⋯ on a paragraph → bottom sheet opens
  2. User taps "Report issue" → sheet transitions to report form
  3. User selects reason, optionally adds detail
  4. Submit → success message → sheet closes

### 3.5 Highlighted Text Capture

The `highlightedText` field captures what the user sees. Two approaches:

- **Simple** (Phase 3): pass `htmlContent` prop (the full paragraph text) as `highlighted_text`
- **Future** (Phase 4): capture `window.getSelection()` for user-selected text within the paragraph

Start with the simple approach — the full paragraph text is already available as a prop.

---

## Phase 4: Future Enhancements (Not Now)

These build on the Supabase foundation but are out of scope for this first pass:

- [ ] User text selection → report only highlighted portion
- [ ] "My reports" page — user can see their submitted reports
- [ ] Admin dashboard — review/triage reports, mark as fixed
- [ ] Email notifications on new reports
- [ ] Additional OAuth providers (Microsoft, Facebook, Apple)
- [ ] Notes, ratings, reading progress (existing schema in ARCHITECTURE.md)
- [ ] Rate limiting / spam prevention

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/frontend/package.json` | Modify | Add `@supabase/supabase-js` |
| `src/frontend/.env` | Create | Supabase URL + anon key |
| `src/frontend/astro.config.mjs` | Modify | CSP + git hash injection |
| `src/frontend/src/lib/supabase.ts` | Create | Supabase client singleton |
| `src/frontend/src/lib/build-info.ts` | Create | Git hash export |
| `src/frontend/src/lib/reports.ts` | Create | Report submission service |
| `src/frontend/src/stores/auth.ts` | Create | Auth state (Pinia) |
| `src/frontend/src/components/auth/UserMenu.vue` | Create | Login/logout UI |
| `src/frontend/src/components/reading/ReportDialog.vue` | Create | Report form |
| `src/frontend/src/components/reading/ParagraphToolbar.vue` | Modify | Add report button |
| `src/frontend/src/i18n/locales/en.json` | Modify | Report-related strings |
| `src/frontend/src/i18n/locales/cs.json` | Modify | Czech report strings |

---

## Open Questions

1. **Supabase project** — needs to be created manually in dashboard. Self-hosted or cloud?
2. **Google OAuth credentials** — need Google Cloud project with OAuth consent screen configured
3. **Production env vars** — how are they injected? Docker env, `.env.production`, CI/CD secrets?
4. **Site URL for OAuth redirect** — `https://bashkirtseff.org`?
5. **Admin report review** — Supabase dashboard directly, or build a dedicated admin view?

---

## Implementation Order

1. Create Supabase project + Google OAuth (manual, ~30 min)
2. Phase 1: Foundation (install deps, client, env, CSP)
3. Phase 2: Auth (store, UserMenu, test login flow)
4. Phase 3: Reports (table, service, UI in ParagraphToolbar)
5. Test end-to-end on dev, then deploy
