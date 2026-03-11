// ─── GoTrue Auth Client ──────────────────────────────────────────────
//
// Pure fetch-based client for self-hosted GoTrue (Supabase auth).
// No SDK dependency — just HTTP requests.
//
// Usage:
//   import { signInWithGoogle, getSession, signOut } from '../lib/auth';

const AUTH_URL = import.meta.env.PUBLIC_AUTH_URL || 'https://auth.bashkirtseff.org';

// ─── Types ───────────────────────────────────────────────────────────

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

// ─── Storage Keys ────────────────────────────────────────────────────

const TOKEN_KEY = 'auth-token';
const REFRESH_KEY = 'auth-refresh';

// ─── Public API ──────────────────────────────────────────────────────

/** Redirect to Google OAuth via GoTrue */
export function signInWithGoogle(): void {
  const redirectTo = encodeURIComponent(window.location.href);
  window.location.href = `${AUTH_URL}/authorize?provider=google&redirect_to=${redirectTo}`;
}

/** Handle the OAuth callback — GoTrue redirects back with tokens in URL hash */
export function handleCallback(): boolean {
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return false;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    // Clean URL hash
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }
  return false;
}

/** Get current session by validating stored token against GoTrue /user endpoint */
export async function getSession(): Promise<Session | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const res = await fetch(`${AUTH_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // Token expired or invalid — try refresh
      const refreshed = await refreshSession();
      if (refreshed) return refreshed;
      clearTokens();
      return null;
    }

    const user: User = await res.json();
    return {
      access_token: token,
      refresh_token: localStorage.getItem(REFRESH_KEY) || '',
      expires_at: 0,
      user,
    };
  } catch {
    return null;
  }
}

/** Sign out — invalidate token on server and clear local storage */
export async function signOut(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  clearTokens();
}

/** Get stored access token (for API calls) */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ─── Internal ────────────────────────────────────────────────────────

async function refreshSession(): Promise<Session | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: data.expires_at || 0,
        user: data.user || ({} as User),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
