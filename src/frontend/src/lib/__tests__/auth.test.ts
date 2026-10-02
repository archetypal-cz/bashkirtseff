import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// No DOM environment: stub localStorage, navigator.locks and fetch.

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
function jwt(sub: string, exp = Math.floor(Date.now() / 1000) + 3600): string {
  return `${b64url({ alg: 'HS256' })}.${b64url({ sub, exp })}.sig`;
}
const USER = { id: 'u1', email: 'a@b.cz', user_metadata: { full_name: 'A B' } };

/** Fake LockManager: exclusive locks, FIFO queue, ifAvailable and signal support. */
class FakeLocks {
  private held = new Set<string>();
  private queues = new Map<string, Array<() => void>>();
  requested: string[] = [];

  async request(name: string, a: any, b?: any): Promise<any> {
    const opts = typeof a === 'function' ? {} : a;
    const cb = typeof a === 'function' ? a : b;
    this.requested.push(name);
    if (opts.ifAvailable && this.held.has(name)) return cb(null);
    if (opts.signal?.aborted) throw opts.signal.reason ?? new DOMException('aborted', 'AbortError');
    if (this.held.has(name)) {
      await new Promise<void>((resolve, reject) => {
        const q = this.queues.get(name) ?? [];
        this.queues.set(name, q);
        const grant = () => {
          opts.signal?.removeEventListener('abort', onAbort);
          resolve();
        };
        const onAbort = () => {
          const i = q.indexOf(grant);
          if (i >= 0) q.splice(i, 1);
          reject(opts.signal.reason ?? new DOMException('aborted', 'AbortError'));
        };
        opts.signal?.addEventListener('abort', onAbort);
        q.push(grant);
      });
    }
    this.held.add(name);
    try {
      return await cb({ name });
    } finally {
      const next = this.queues.get(name)?.shift();
      if (next) next(); // hand over, stays held
      else this.held.delete(name);
    }
  }
}

const store = new Map<string, string>();
let locks: FakeLocks | undefined;
const fetchMock = vi.fn();

function json(status: number, body: unknown = {}) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}
function seed(token = jwt('u1'), refresh: string | null = 'r1', user: unknown = USER) {
  store.set('auth-token', token);
  if (refresh) store.set('auth-refresh', refresh);
  if (user) store.set('auth-user', JSON.stringify(user));
}

async function load() {
  vi.resetModules();
  return await import('../auth');
}

beforeEach(() => {
  store.clear();
  fetchMock.mockReset();
  locks = new FakeLocks();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('navigator', { locks });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('decodeJwt', () => {
  it('reads sub and exp from base64url, null on garbage', async () => {
    const { decodeJwt } = await load();
    expect(decodeJwt(jwt('abc', 123))).toEqual({ sub: 'abc', exp: 123 });
    expect(decodeJwt('nope')).toBeNull();
    expect(decodeJwt(null)).toBeNull();
    expect(decodeJwt(`x.${b64url({ sub: 1 })}.y`)).toBeNull();
  });
});

describe('getSession classification', () => {
  it('no stored token -> null, no request', async () => {
    const { getSession } = await load();
    expect(await getSession()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('/user ok -> session, user cached in auth-user', async () => {
    seed(jwt('u1'), 'r1', null);
    fetchMock.mockReturnValueOnce(json(200, { ...USER, extra: 'x' }));
    const { getSession } = await load();
    const s = await getSession();
    expect(s?.offline).toBeUndefined();
    expect(s?.user.id).toBe('u1');
    expect(JSON.parse(store.get('auth-user')!)).toEqual(USER);
  });

  it('/user network error -> offline session', async () => {
    seed();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { getSession } = await load();
    const s = await getSession();
    expect(s?.offline).toBe(true);
    expect(s?.user).toEqual(USER);
    expect(store.get('auth-token')).toBeDefined();
  });

  it('/user 5xx -> offline session, tokens kept', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(503));
    const { getSession } = await load();
    expect((await getSession())?.offline).toBe(true);
    expect(store.has('auth-token') && store.has('auth-refresh') && store.has('auth-user')).toBe(true);
  });

  it('/user 401 then refresh 400 -> tokens cleared, null', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(401)).mockReturnValueOnce(json(400, { error: 'invalid_grant' }));
    const { getSession } = await load();
    expect(await getSession()).toBeNull();
    expect(store.has('auth-token')).toBe(false);
    expect(store.has('auth-refresh')).toBe(false);
    expect(store.has('auth-user')).toBe(false);
  });

  it('/user 401 then refresh ok -> new token stored and returned', async () => {
    seed();
    const fresh = jwt('u1', 9999999999);
    fetchMock
      .mockReturnValueOnce(json(401))
      .mockReturnValueOnce(json(200, { access_token: fresh, refresh_token: 'r2', user: USER }));
    const { getSession } = await load();
    const s = await getSession();
    expect(s?.access_token).toBe(fresh);
    expect(s?.offline).toBeUndefined();
    expect(store.get('auth-token')).toBe(fresh);
    expect(store.get('auth-refresh')).toBe('r2');
  });

  it('/user 401 then refresh 5xx -> offline session, tokens kept', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(401)).mockReturnValueOnce(json(500));
    const { getSession } = await load();
    expect((await getSession())?.offline).toBe(true);
    expect(store.has('auth-token') && store.has('auth-refresh')).toBe(true);
  });

  it('/user 401 then refresh network error -> offline session, tokens kept', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(401)).mockRejectedValueOnce(new TypeError('x'));
    const { getSession } = await load();
    expect((await getSession())?.offline).toBe(true);
    expect(store.has('auth-token')).toBe(true);
  });

  it('mismatched sub on network error -> null without clearing tokens', async () => {
    seed(jwt('someone-else'));
    fetchMock.mockRejectedValueOnce(new TypeError('x'));
    const { getSession } = await load();
    expect(await getSession()).toBeNull();
    expect(store.has('auth-token') && store.has('auth-refresh') && store.has('auth-user')).toBe(true);
  });

  it('no refresh token on network error -> null without clearing tokens', async () => {
    seed(jwt('u1'), null);
    fetchMock.mockRejectedValueOnce(new TypeError('x'));
    const { getSession } = await load();
    expect(await getSession()).toBeNull();
    expect(store.has('auth-token') && store.has('auth-user')).toBe(true);
  });

  it('no cached user on network error -> null without clearing tokens', async () => {
    seed(jwt('u1'), 'r1', null);
    fetchMock.mockRejectedValueOnce(new TypeError('x'));
    const { getSession } = await load();
    expect(await getSession()).toBeNull();
    expect(store.has('auth-token') && store.has('auth-refresh')).toBe(true);
  });
});

describe('sign-out', () => {
  beforeEach(() => {
    store.set('stars-cache:u1', '[]');
    store.set('stars-pending:u1', '[]');
    store.set('stars-cache:u2', '[]');
  });

  it('voluntary signOut clears tokens, auth-user and this user\'s stars keys only', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(200));
    const { signOut } = await load();
    await signOut();
    for (const k of ['auth-token', 'auth-refresh', 'auth-user', 'stars-cache:u1', 'stars-pending:u1']) {
      expect(store.has(k)).toBe(false);
    }
    expect(store.has('stars-cache:u2')).toBe(true);
  });

  it('voluntary signOut works offline (logout fetch fails)', async () => {
    seed();
    fetchMock.mockRejectedValueOnce(new TypeError('x'));
    const { signOut } = await load();
    await signOut();
    expect(store.has('auth-token')).toBe(false);
    expect(store.has('stars-pending:u1')).toBe(false);
  });

  it('involuntary sign-out (refresh rejected) keeps the stars keys', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(401)).mockReturnValueOnce(json(401));
    const { getSession } = await load();
    await getSession();
    expect(store.has('auth-token')).toBe(false);
    expect(store.has('auth-user')).toBe(false);
    expect(store.has('stars-cache:u1')).toBe(true);
    expect(store.has('stars-pending:u1')).toBe(true);
  });
});

describe('Web Lock coordination', () => {
  it('while tab A holds the lock, tab B getSession() with a 401 waits, then uses the token A refreshed', async () => {
    const stale = jwt('u1', Math.floor(Date.now() / 1000) + 3000);
    seed(stale);
    const fresh = jwt('u1', 9999999999);
    fetchMock.mockImplementation((url: string) => {
      if (String(url).includes('/token')) throw new Error('B must not refresh itself');
      return json(401); // /user with the stale token
    });
    const { getSession, AUTH_LOCK_NAME } = await load();

    // Tab A: takes the lock, refreshes, stores the new token, then releases.
    let releaseA!: () => void;
    const aHolds = locks!.request(AUTH_LOCK_NAME, async () => {
      await new Promise<void>((r) => (releaseA = r));
      store.set('auth-token', fresh);
      store.set('auth-refresh', 'r2');
    });
    await Promise.resolve();

    let done = false;
    const bP = getSession().then((s) => ((done = true), s));
    await new Promise((r) => setTimeout(r, 20));
    expect(done).toBe(false); // B is waiting on the lock

    releaseA();
    await aHolds;
    const s = await bP;
    expect(s?.access_token).toBe(fresh);
    expect(s?.offline).toBeUndefined();
    expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes('/token'))).toHaveLength(0);
  });

  it('after acquiring the lock, still-stale token -> refreshes itself', async () => {
    seed();
    const fresh = jwt('u1', 9999999999);
    fetchMock
      .mockReturnValueOnce(json(401))
      .mockReturnValueOnce(json(200, { access_token: fresh, refresh_token: 'r2', user: USER }));
    const { getSession } = await load();
    expect((await getSession())?.access_token).toBe(fresh);
    expect(locks!.requested).toEqual(['bashkirtseff-auth']);
  });

  it('lock wait times out -> counts as network: offline session, tokens kept; asks for AbortSignal.timeout(10000)', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(401));
    const spy = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      const c = new AbortController();
      setTimeout(() => c.abort(new DOMException('timeout', 'TimeoutError')), 10);
      return c.signal;
    });
    const { getSession, AUTH_LOCK_NAME } = await load();
    const holder = locks!.request(AUTH_LOCK_NAME, () => new Promise<void>(() => {})); // never releases
    void holder;
    await Promise.resolve();
    const s = await getSession();
    expect(spy).toHaveBeenCalledWith(10000);
    expect(s?.offline).toBe(true);
    expect(store.has('auth-token') && store.has('auth-refresh')).toBe(true);
    spy.mockRestore();
  });

  it('refreshUnlocked() never requests the lock (safe while the lock is held)', async () => {
    seed();
    const fresh = jwt('u1', 9999999999);
    fetchMock.mockReturnValueOnce(json(200, { access_token: fresh, refresh_token: 'r2', user: USER }));
    const { refreshUnlocked, AUTH_LOCK_NAME } = await load();
    const result = await locks!.request(AUTH_LOCK_NAME, async () => {
      locks!.requested.length = 0;
      return refreshUnlocked();
    });
    expect(result.status).toBe('ok');
    expect(locks!.requested).toEqual([]);
  });

  it('refreshUnlocked() rejected clears tokens; 5xx keeps them', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(502));
    const { refreshUnlocked } = await load();
    expect((await refreshUnlocked()).status).toBe('network');
    expect(store.has('auth-token')).toBe(true);
    fetchMock.mockReturnValueOnce(json(400));
    expect((await refreshUnlocked()).status).toBe('rejected');
    expect(store.has('auth-token')).toBe(false);
  });

  it('without navigator.locks: falls back to the in-tab dedupe (one refresh for concurrent callers)', async () => {
    vi.stubGlobal('navigator', {});
    seed();
    const fresh = jwt('u1', 9999999999);
    fetchMock.mockImplementation((url: string) =>
      String(url).includes('/token')
        ? json(200, { access_token: fresh, refresh_token: 'r2', user: USER })
        : json(401),
    );
    const { getSession } = await load();
    const [a, b] = await Promise.all([getSession(), getSession()]);
    expect(a?.access_token).toBe(fresh);
    expect(b?.access_token).toBe(fresh);
    expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes('/token'))).toHaveLength(1);
  });
});

describe('expiry, 403 and lock robustness', () => {
  const fresh = () => jwt('u1', 9999999999);
  const tokenOk = () => json(200, { access_token: fresh(), refresh_token: 'r2', user: USER });

  it('/user 403 bad_jwt -> refresh -> new token', async () => {
    seed();
    const f = fresh();
    fetchMock
      .mockReturnValueOnce(json(403, { error_code: 'bad_jwt' }))
      .mockReturnValueOnce(json(200, { access_token: f, refresh_token: 'r2', user: USER }));
    const { getSession } = await load();
    expect((await getSession())?.access_token).toBe(f);
    expect(store.get('auth-token')).toBe(f);
  });

  it('/user 429 -> offline session, tokens kept, no refresh', async () => {
    seed();
    fetchMock.mockReturnValueOnce(json(429));
    const { getSession } = await load();
    expect((await getSession())?.offline).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.has('auth-token') && store.has('auth-refresh')).toBe(true);
  });

  it('exp within 60 s -> no /user call, refresh first', async () => {
    seed(jwt('u1', Math.floor(Date.now() / 1000) + 30));
    fetchMock.mockReturnValueOnce(tokenOk());
    const { getSession } = await load();
    const s = await getSession();
    expect(s?.access_token).toBe(fresh());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/token');
  });

  it('401/403 with no refresh token -> tokens cleared (documented exception)', async () => {
    seed(jwt('u1'), null);
    fetchMock.mockReturnValueOnce(json(403));
    const { getSession } = await load();
    expect(await getSession()).toBeNull();
    expect(store.has('auth-token')).toBe(false);
  });

  it('without AbortSignal.timeout: lock wait still works (no TypeError counted as timeout)', async () => {
    const orig = (AbortSignal as any).timeout;
    (AbortSignal as any).timeout = undefined;
    try {
      seed();
      fetchMock.mockReturnValueOnce(json(401)).mockReturnValueOnce(tokenOk());
      const { getSession } = await load();
      const s = await getSession();
      expect(s?.offline).toBeUndefined();
      expect(s?.access_token).toBe(fresh());
    } finally {
      (AbortSignal as any).timeout = orig;
    }
  });

  it('non-abort lock error -> falls back to refreshUnlocked', async () => {
    seed();
    vi.stubGlobal('navigator', { locks: { request: () => Promise.reject(new TypeError('boom')) } });
    fetchMock.mockReturnValueOnce(json(401)).mockReturnValueOnce(tokenOk());
    const { getSession } = await load();
    expect((await getSession())?.access_token).toBe(fresh());
  });

  it('after the lock: token >60 s from expiry accepted without refreshing (expired path); a rejected token still refreshes', async () => {
    seed(jwt('u1', 9999999999));
    const { refresh } = await load();
    const r = await refresh(localStorage.getItem('auth-token'), false);
    expect(r.status).toBe('ok');
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockReturnValueOnce(tokenOk());
    const r2 = await refresh(localStorage.getItem('auth-token'));
    expect(r2.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('signOut aborts a hanging /logout after 5 s and still clears locally', async () => {
    seed();
    fetchMock.mockImplementation(
      (_u: string, init: any) =>
        new Promise((_res, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted')))),
    );
    const orig = (AbortSignal as any).timeout;
    (AbortSignal as any).timeout = undefined; // fallback path uses setTimeout, which fake timers drive
    vi.useFakeTimers();
    try {
      const { signOut } = await load();
      const p = signOut();
      await vi.advanceTimersByTimeAsync(5100);
      await p;
    } finally {
      vi.useRealTimers();
      (AbortSignal as any).timeout = orig;
    }
    expect(store.has('auth-token')).toBe(false);
  });
});

describe('S1 follow-ups', () => {
  const fresh = () => jwt('u1', 9999999999);

  it('/user 400/404 with no refresh token -> null, tokens kept (only 401/403 clear)', async () => {
    for (const status of [400, 404, 422]) {
      store.clear();
      seed(jwt('u1'), null);
      fetchMock.mockReset();
      fetchMock.mockReturnValueOnce(json(status));
      const { getSession } = await load();
      expect(await getSession()).toBeNull();
      expect(store.has('auth-token')).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1); // no /token call either
    }
  });

  it('a rejected caller joining a rejected=false refresh chains one more refresh if the token is unchanged', async () => {
    const stale = jwt('u1', 9999999999);
    seed(stale);
    const f = fresh() + 'x'; // distinct from the stale token
    fetchMock.mockReturnValueOnce(
      json(200, { access_token: f, refresh_token: 'r2', user: USER }),
    );
    const { refresh } = await load();
    // First caller: token merely expired (rejected=false); stored token looks valid, so it is accepted unchanged.
    const p1 = refresh(stale, false);
    // Second caller saw 401 on that very token.
    const p2 = refresh(stale, true);
    expect((await p1).status).toBe('ok');
    const r2 = await p2;
    expect(r2.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(1); // the chained refresh really hit /token
    expect(String(fetchMock.mock.calls[0][0])).toContain('/token');
    expect(store.get('auth-token')).toBe(f);
  });

  it('a rejected caller joining a rejected=false refresh does not chain when the token changed', async () => {
    const stale = jwt('u1', 9999999999);
    seed(stale);
    const { refresh } = await load();
    const p1 = refresh(stale, false);
    const p2 = refresh(jwt('u1', 1111111111), true); // saw a different (older) token rejected
    await Promise.all([p1, p2]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
