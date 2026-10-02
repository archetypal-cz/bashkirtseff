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
  /** True when built from the cached user because the auth server was unreachable. */
  offline?: boolean;
}

const TOKEN_KEY = 'auth-token';
const REFRESH_KEY = 'auth-refresh';
const USER_KEY = 'auth-user';
const VERIFIER_KEY = 'auth-pkce-verifier';

/** AbortSignal that fires after `ms`. AbortSignal.timeout is missing on Safari < 16. */
function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

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

/**
 * Session check, classified (offline design §1). Tokens are cleared ONLY when a
 * refresh is rejected (400/401); a network error or 5xx yields an offline session
 * (or null) with the tokens kept. The one exception: a rejected access token with
 * no refresh token at all (see refreshUnlocked) can never be renewed, so it is cleared.
 *
 * GoTrue answers an invalid/expired JWT on /user with 403 `bad_jwt` (only a missing
 * header gets 401), so every 4xx except 408/429 counts as "rejected". A locally
 * expired token (exp within 60 s) skips /user entirely and goes to the locked refresh.
 *
 * Code that already holds the auth lock (the S6b drain) must call refreshUnlocked()
 * only, never getSession() or refresh(): they wait for the lock and time out after 10 s.
 */
export async function getSession(): Promise<Session | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const exp = decodeJwt(token)?.exp;
  if (exp !== undefined && exp < Date.now() / 1000 + 60) {
    return settle(await refresh(token, false)); // expiring/expired: do not depend on status codes
  }

  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return getOfflineSession(); // network
  }

  if (res.ok) {
    let user: User;
    try {
      user = await res.json();
    } catch {
      return getOfflineSession(); // unreadable body: treat as a server fault
    }
    cacheUser(user);
    return {
      access_token: token,
      refresh_token: localStorage.getItem(REFRESH_KEY) || '',
      expires_at: decodeJwt(token)?.exp ?? 0,
      user,
    };
  }

  if (res.status >= 500 || res.status === 408 || res.status === 429) {
    return getOfflineSession(); // server (or a transient 4xx)
  }

  // rejected (401/403/other 4xx): refresh, but only inside the auth lock (§3)
  return settle(await refresh(token));
}

function settle(result: RefreshResult): Session | null {
  if (result.status === 'ok' || result.status === 'network') return result.session;
  return null; // rejected: refreshUnlocked already cleared the tokens
}

/**
 * Voluntary sign-out (the user asked for it): clears tokens, `auth-user` and the
 * stars cache + queue for this user. The unsynced-queue warning is the caller's
 * job (see the store's sign-out guard).
 */
export async function signOut(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  const sub = (token && decodeJwt(token)?.sub) || readCachedUser()?.id || null;
  if (token) {
    await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: timeoutSignal(5000),
    }).catch(() => {}); // best effort: local clearing proceeds regardless
  }
  clearTokens();
  if (sub) {
    localStorage.removeItem(`stars-cache:${sub}`);
    localStorage.removeItem(`stars-pending:${sub}`);
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ─── JWT (local decode, no signature check) ─────────────────────────

export interface JwtClaims {
  sub: string;
  exp: number;
}

/** Decode `sub` and `exp` from a JWT locally. Nothing is trusted server-side from this. */
export function decodeJwt(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const payload = JSON.parse(json);
    if (typeof payload?.sub !== 'string' || typeof payload?.exp !== 'number') return null;
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

// ─── Offline session ─────────────────────────────────────────────────

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u && typeof u.id === 'string' ? (u as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: User): void {
  try {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ id: user.id, email: user.email, user_metadata: user.user_metadata || {} }),
    );
  } catch {
    /* storage full or blocked: the offline session just won't be available */
  }
}

/**
 * An offline session `{offline: true, user: cachedUser}`, only if a stored access
 * token exists, its decoded `sub` equals the cached user's id, and a refresh token
 * exists. Otherwise null, WITHOUT clearing any tokens.
 */
export function getOfflineSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const user = readCachedUser();
  if (!token || !refreshToken || !user) return null;
  const claims = decodeJwt(token);
  if (!claims || claims.sub !== user.id) return null;
  return { access_token: token, refresh_token: refreshToken, expires_at: claims.exp, user, offline: true };
}

// ─── Refresh (offline design §3) ─────────────────────────────────────

export const AUTH_LOCK_NAME = 'bashkirtseff-auth';
const LOCK_WAIT_MS = 10000;

export type RefreshResult =
  | { status: 'ok'; session: Session }
  | { status: 'network'; session: Session | null } // network/server/lock timeout: offline session or null, tokens kept
  | { status: 'rejected' }; // 400/401: tokens cleared (involuntary sign-out)

let refreshPromise: Promise<RefreshResult> | null = null;

function getLocks(): LockManager | null {
  return typeof navigator !== 'undefined' && navigator.locks ? navigator.locks : null;
}

/**
 * Refresh the session. WAITS for the cross-tab Web Lock (never skipped; a timeout
 * counts as `network`), then re-reads the stored token: if another tab already
 * refreshed it, that token is used; otherwise refreshes. Callers that already hold
 * the lock must call `refreshUnlocked()` instead (the lock is not re-entrant).
 * Without navigator.locks, only the in-tab dedupe applies.
 * `rejected` (default true): the caller got 401/403 on `staleToken`, so it is refreshed
 * even if it still looks valid; with false (the token merely expired) a stored token
 * more than 60 s from expiry is accepted without refreshing.
 * Never call this (or getSession) while holding the lock: use refreshUnlocked().
 */
export function refresh(
  staleToken: string | null = localStorage.getItem(TOKEN_KEY),
  rejected = true,
): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doLockedRefresh(staleToken, rejected).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doLockedRefresh(staleToken: string | null, rejected: boolean): Promise<RefreshResult> {
  const locks = getLocks();
  if (!locks) return refreshUnlocked();
  try {
    return await locks.request(
      AUTH_LOCK_NAME,
      { signal: timeoutSignal(LOCK_WAIT_MS) },
      async () => {
        // Another tab may have refreshed while we waited.
        const current = localStorage.getItem(TOKEN_KEY);
        const user = readCachedUser();
        const claims = decodeJwt(current);
        const fresh =
          current !== staleToken || (!rejected && !!claims && claims.exp > Date.now() / 1000 + 60);
        if (current && fresh && user && claims && claims.sub === user.id) {
          return {
            status: 'ok',
            session: {
              access_token: current,
              refresh_token: localStorage.getItem(REFRESH_KEY) || '',
              expires_at: claims.exp,
              user,
            },
          } as RefreshResult;
        }
        return refreshUnlocked();
      },
    );
  } catch (e) {
    const name = (e as { name?: string } | null)?.name;
    if (name === 'AbortError' || name === 'TimeoutError') {
      return { status: 'network', session: getOfflineSession() }; // lock wait timed out
    }
    return refreshUnlocked(); // locks unusable for another reason: in-tab dedupe only
  }
}

/**
 * Refresh without touching the lock, for callers that already hold
 * `bashkirtseff-auth` (the drain). NEVER requests the lock; a lock holder must call
 * this, never getSession() or refresh() (they would wait for the lock and time out
 * after 10 s). Clears tokens only on a rejected (400/401) refresh, plus one exception:
 * a 401/403 access token with no refresh token at all can never be renewed, so it is
 * cleared too.
 */
export async function refreshUnlocked(): Promise<RefreshResult> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    // Nothing to refresh with: the access token was rejected and cannot be renewed.
    if (localStorage.getItem(TOKEN_KEY)) {
      clearTokens();
      return { status: 'rejected' };
    }
    return { status: 'network', session: null };
  }

  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    return { status: 'network', session: getOfflineSession() };
  }

  if (res.status === 400 || res.status === 401) {
    clearTokens(); // involuntary sign-out: stars-cache/pending are kept
    return { status: 'rejected' };
  }
  if (!res.ok) return { status: 'network', session: getOfflineSession() }; // server

  try {
    const data = await res.json();
    if (data.access_token && data.user?.id) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
      cacheUser(data.user);
      return {
        status: 'ok',
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          expires_at: data.expires_at || decodeJwt(data.access_token)?.exp || 0,
          user: data.user,
        },
      };
    }
  } catch {
    /* fall through */
  }
  return { status: 'network', session: getOfflineSession() }; // 200 with an unusable body
}

/** Involuntary clear: tokens and `auth-user` only. The stars keys stay. */
function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
