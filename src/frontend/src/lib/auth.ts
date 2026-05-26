const AUTH_URL = import.meta.env.PUBLIC_AUTH_URL || 'https://auth.bashkirtseff.org';

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

const TOKEN_KEY = 'auth-token';
const REFRESH_KEY = 'auth-refresh';
const VERIFIER_KEY = 'auth-pkce-verifier';

// ─── PKCE Helpers ────────────────────────────────────────────────────

function generateVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
}

async function generateChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ─── Public API ──────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const redirectTo = encodeURIComponent(
    window.location.origin + window.location.pathname + window.location.search,
  );
  window.location.href =
    `${AUTH_URL}/authorize?provider=google&redirect_to=${redirectTo}` +
    `&code_challenge=${challenge}&code_challenge_method=S256&flow_type=pkce`;
}

export async function handleCallback(): Promise<boolean> {
  // PKCE flow: code arrives as a query parameter
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    if (!verifier) return false;
    sessionStorage.removeItem(VERIFIER_KEY);

    try {
      const res = await fetch(`${AUTH_URL}/token?grant_type=pkce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
      });
      if (!res.ok) return false;

      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
        window.history.replaceState(null, '', window.location.pathname);
        return true;
      }
    } catch {
      return false;
    }
  }

  // Legacy implicit flow: tokens in URL hash (handles existing sessions)
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    }
  }

  return false;
}

export async function getSession(): Promise<Session | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const res = await fetch(`${AUTH_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
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

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ─── Internal ────────────────────────────────────────────────────────

let refreshPromise: Promise<Session | null> | null = null;

async function refreshSession(): Promise<Session | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = doRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function doRefresh(): Promise<Session | null> {
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
    if (data.access_token && data.user?.id) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: data.expires_at || 0,
        user: data.user,
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
