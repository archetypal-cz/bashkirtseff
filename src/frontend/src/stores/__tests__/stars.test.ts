import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// ─── Stubs ───────────────────────────────────────────────────────────
function jwt(sub: string, exp = 4102444800): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'none' })}.${b64({ sub, exp })}.sig`;
}

let token: string | null = null;
const refreshMock = vi.fn();
const refreshUnlockedMock = vi.fn();
/** refreshFn handed to the most recent sendOp call (lets a mocked send simulate a 401 -> refresh). */
let sendRefresh: (stale?: string) => Promise<unknown> = async () => undefined;
const getSession = vi.fn();
vi.mock('../../lib/auth', async () => {
  const actual = await vi.importActual<typeof import('../../lib/auth')>('../../lib/auth');
  return {
    ...actual,
    getSession: (...a: unknown[]) => getSession(...a),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(async () => {}),
    handleCallback: vi.fn(async () => false),
    getStoredToken: () => token,
    refresh: (...a: unknown[]) => refreshMock(...a),
    refreshUnlocked: (...a: unknown[]) => refreshUnlockedMock(...a),
  };
});

const listStars = vi.fn();
const starParagraph = vi.fn();
const unstarParagraph = vi.fn();
vi.mock('../../lib/stars', async () => {
  const actual = await vi.importActual<typeof import('../../lib/stars')>('../../lib/stars');
  return {
    ...actual,
    listStars: (...a: unknown[]) => listStars(...a),
    sendOp: (op: { op: string; id: string }, refreshFn: (s?: string) => Promise<unknown>) => {
      sendRefresh = refreshFn;
      return op.op === 'star' ? starParagraph(op.id) : unstarParagraph(op.id);
    },
  };
});

const lsMap = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => lsMap.get(k) ?? null,
  setItem: (k: string, v: string) => void lsMap.set(k, v),
  removeItem: (k: string) => void lsMap.delete(k),
  clear: () => lsMap.clear(),
  key: (i: number) => [...lsMap.keys()][i] ?? null,
  get length() { return lsMap.size; },
};

let storageHandlers: Array<(e: { key: string | null }) => void> = [];
let onlineHandlers: Array<() => void> = [];
let visibleHandlers: Array<() => void> = [];
const doc = { visibilityState: 'visible' };

/** Fake LockManager: real queueing, ifAvailable, and abort via signal. */
function makeLocks() {
  let held = false;
  const waiting: Array<() => void> = [];
  const state = {
    get held() { return held; },
    request(_name: string, opts: any, cb: (l: unknown) => Promise<unknown>): Promise<unknown> {
      if (opts?.ifAvailable) {
        if (held) return Promise.resolve(cb(null));
        held = true;
        return Promise.resolve(cb({})).finally(() => { held = false; waiting.shift()?.(); });
      }
      return new Promise((resolve, reject) => {
        const run = () => {
          held = true;
          Promise.resolve(cb({})).then(resolve, reject).finally(() => { held = false; waiting.shift()?.(); });
        };
        if (!held) run();
        else waiting.push(run);
      });
    },
    /** Simulate another tab holding the lock. */
    hold(): () => void {
      held = true;
      return () => { held = false; waiting.shift()?.(); };
    },
  };
  return state;
}
const confirmFn = vi.fn(() => true);

const U = 'user-1';
const q = (k = U) => JSON.parse(lsMap.get(`stars-pending:${k}`) ?? '[]');
const ids = (s: Set<string>) => [...s].sort();

async function setup(opts: { sub?: string; server?: string[]; session?: boolean } = {}) {
  const sub = opts.sub ?? U;
  token = opts.session === false ? null : jwt(sub);
  getSession.mockResolvedValue(opts.session === false ? null : { access_token: token, user: { id: sub, email: 'a@b.c' } });
  listStars.mockResolvedValue({ outcome: 'ok', data: (opts.server ?? []).map((p) => ({ paragraph_id: p, language: 'cz', created_at: '' })) });
  const { useStarsStore } = await import('../stars');
  const { useAuthStore } = await import('../auth');
  return { stars: useStarsStore(), auth: useAuthStore() };
}

beforeEach(() => {
  lsMap.clear();
  storageHandlers = [];
  onlineHandlers = [];
  visibleHandlers = [];
  doc.visibilityState = 'visible';
  refreshMock.mockReset();
  refreshUnlockedMock.mockReset().mockImplementation(async () => ({
    status: 'ok',
    session: { access_token: token, user: { id: U, email: 'a@b.c' } },
  }));
  sendRefresh = async () => undefined;
  confirmFn.mockReset().mockReturnValue(true);
  listStars.mockReset();
  starParagraph.mockReset().mockResolvedValue({ outcome: 'ok' });
  unstarParagraph.mockReset().mockResolvedValue({ outcome: 'ok' });
  vi.stubGlobal('window', {
    addEventListener: (t: string, h: any) => {
      if (t === 'storage') storageHandlers.push(h);
      if (t === 'online') onlineHandlers.push(h);
    },
    dispatchEvent: () => true,
    confirm: confirmFn,
  });
  vi.stubGlobal('document', {
    documentElement: { dataset: {}, lang: 'en' },
    get visibilityState() { return doc.visibilityState; },
    addEventListener: (t: string, h: () => void) => { if (t === 'visibilitychange') visibleHandlers.push(h); },
  });
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('localStorage', localStorageStub);
  vi.resetModules();
  setActivePinia(createPinia());
});

describe('stars store', () => {
  it('makes one GET per page for N concurrent init() calls', async () => {
    const { stars } = await setup({ server: ['001.0001'] });
    await Promise.all(Array.from({ length: 20 }, () => stars.init()));
    expect(listStars).toHaveBeenCalledTimes(1);
    expect(storageHandlers).toHaveLength(1);
    expect(ids(stars.displayed)).toEqual(['001.0001']);
    expect(JSON.parse(lsMap.get(`stars-cache:${U}`)!)).toEqual(['001.0001']);
  });

  it('a re-fetch never un-stars a queued op', async () => {
    const { stars } = await setup({ server: [] });
    await stars.init();
    navigator.onLine = false;
    await stars.toggle('001.0005', 'cz');
    expect(stars.isStarred('001.0005')).toBe(true);
    navigator.onLine = true;
    listStars.mockResolvedValue({ outcome: 'ok', data: [] }); // server has not seen it yet
    await stars.__test.refetch();
    expect(stars.isStarred('001.0005')).toBe(true);
    expect(q()).toHaveLength(1);
  });

  it('two enqueues for one paragraph collapse', async () => {
    const { stars } = await setup({ server: [] });
    await stars.init();
    navigator.onLine = false;
    await stars.toggle('001.0005', 'cz'); // star
    await stars.toggle('001.0005', 'cz'); // unstar
    expect(q()).toHaveLength(1);
    expect(q()[0].op).toBe('unstar');
    expect(stars.queuedCount).toBe(1);
    expect(stars.isStarred('001.0005')).toBe(false);
  });

  it('a storage event from another tab updates the displayed set', async () => {
    const { stars } = await setup({ server: ['001.0001'] });
    await stars.init();
    lsMap.set(`stars-cache:${U}`, JSON.stringify(['001.0001', '001.0002']));
    lsMap.set(`stars-pending:${U}`, JSON.stringify([{ op: 'star', id: '001.0003', lang: 'cz', commit: 'x', ts: 5 }]));
    storageHandlers.forEach((h) => h({ key: `stars-cache:${U}` }));
    expect(ids(stars.displayed)).toEqual(['001.0001', '001.0002', '001.0003']);
    expect(stars.queuedCount).toBe(1);
    storageHandlers.forEach((h) => h({ key: 'unrelated' }));
  });

  it('online toggle sends, folds into the cache and empties the queue', async () => {
    const { stars } = await setup({ server: [] });
    await stars.init();
    expect(await stars.toggle('001.0007', 'en')).toBe(true);
    expect(starParagraph).toHaveBeenCalledWith('001.0007');
    expect(q()).toEqual([]);
    expect(JSON.parse(lsMap.get(`stars-cache:${U}`)!)).toEqual(['001.0007']);
  });

  it('a transient failure keeps the optimistic state queued', async () => {
    const { stars } = await setup({ server: [] });
    await stars.init();
    starParagraph.mockResolvedValue({ outcome: 'transient', status: 503 });
    expect(await stars.toggle('001.0007', 'en')).toBe(true);
    expect(q()).toHaveLength(1);
    expect(stars.queuedCount).toBe(1);
  });

  it('offline (auth.offline) enqueues without sending', async () => {
    const { stars, auth } = await setup({ server: [] });
    await stars.init();
    auth.offline = true;
    await stars.toggle('001.0007', 'en');
    expect(starParagraph).not.toHaveBeenCalled();
    expect(q()).toHaveLength(1);
  });

  it('cap reverts the star and emits stars.capReached', async () => {
    const { stars } = await setup({ server: [] });
    await stars.init();
    starParagraph.mockResolvedValue({ outcome: 'cap', status: 400 });
    expect(await stars.toggle('001.0007', 'en')).toBe(false);
    expect(stars.isStarred('001.0007')).toBe(false);
    expect(q()).toEqual([]);
    expect(stars.lastMessage?.key).toBe('stars.capReached');
  });

  it('another error reverts and emits stars.error', async () => {
    const { stars } = await setup({ server: ['001.0007'] });
    await stars.init();
    unstarParagraph.mockResolvedValue({ outcome: 'error', status: 403 });
    expect(await stars.toggle('001.0007')).toBe(true);
    expect(stars.lastMessage?.key).toBe('stars.error');
  });

  it('removal is by (id, ts): a newer op queued meanwhile survives', async () => {
    const { stars } = await setup({ server: [] });
    await stars.init();
    starParagraph.mockImplementation(async () => {
      // another tab queues a newer unstar for the same paragraph while the request is in flight
      const cur = q();
      lsMap.set(`stars-pending:${U}`, JSON.stringify([{ op: 'unstar', id: '001.0007', lang: 'en', commit: 'x', ts: cur[0].ts + 10 }]));
      return { outcome: 'ok' };
    });
    await stars.toggle('001.0007', 'en');
    expect(q()).toHaveLength(1);
    expect(q()[0].op).toBe('unstar');
  });

  it('a different user signing in deletes the other user\'s keys', async () => {
    lsMap.set('stars-cache:old', '["001.0001"]');
    lsMap.set('stars-pending:old', '[{"op":"star","id":"001.0001","lang":"cz","commit":"x","ts":1}]');
    lsMap.set('stars-cache:user-2', '["001.0009"]');
    const { stars } = await setup({ sub: 'user-2' });
    await stars.init();
    expect(lsMap.has('stars-cache:old')).toBe(false);
    expect(lsMap.has('stars-pending:old')).toBe(false);
    expect(lsMap.has('stars-cache:user-2')).toBe(true);
  });

  it('the same user keeps their queue across an involuntary sign-out (keys untouched at init)', async () => {
    starParagraph.mockResolvedValue({ outcome: 'transient', status: 503 }); // init's drain cannot send
    lsMap.set(`stars-pending:${U}`, JSON.stringify([{ op: 'star', id: '001.0004', lang: 'cz', commit: 'x', ts: 1 }]));
    const { stars } = await setup();
    await stars.init();
    expect(stars.isStarred('001.0004')).toBe(true);
  });

  describe('concurrency and sessions', () => {
    const deferred = <T,>() => {
      let resolve!: (v: T) => void;
      const promise = new Promise<T>((r) => { resolve = r; });
      return { promise, resolve };
    };
    const tick = () => new Promise((r) => setTimeout(r, 0));

    it('a slow re-fetch cannot wipe a star confirmed meanwhile', async () => {
      const { stars } = await setup({ server: [] });
      await stars.init();
      const stale = deferred<unknown>();
      listStars.mockReset();
      listStars.mockReturnValueOnce(stale.promise); // GET in flight, server list without the star
      listStars.mockResolvedValue({ outcome: 'ok', data: [{ paragraph_id: '001.0007', language: 'en', created_at: '' }] });
      const r = stars.__test.refetch();
      await stars.toggle('001.0007', 'en'); // POST succeeds meanwhile
      stale.resolve({ outcome: 'ok', data: [] });
      expect(await r).toBe(true);
      expect(listStars).toHaveBeenCalledTimes(2); // stale result discarded, fetched again
      expect(stars.isStarred('001.0007')).toBe(true);
      expect(JSON.parse(lsMap.get(`stars-cache:${U}`)!)).toEqual(['001.0007']);
    });

    it('keeps the cache (with confirmed changes) when every GET overlaps a confirmation', async () => {
      const { stars } = await setup({ server: [] });
      await stars.init();
      let n = 0;
      listStars.mockReset();
      listStars.mockImplementation(async () => {
        await stars.toggle(`001.${String(++n).padStart(4, '0')}`, 'en');
        return { outcome: 'ok', data: [] };
      });
      expect(await stars.__test.refetch()).toBe(false);
      expect(listStars).toHaveBeenCalledTimes(3);
      expect(stars.isStarred('001.0001')).toBe(true);
      expect(JSON.parse(lsMap.get(`stars-cache:${U}`)!)).toEqual(['001.0001', '001.0002', '001.0003']);
    });

    it('discards a re-fetch result when the user changed meanwhile', async () => {
      const { stars } = await setup({ server: [] });
      await stars.init();
      const d = deferred<unknown>();
      listStars.mockReset().mockReturnValue(d.promise);
      const r = stars.__test.refetch();
      stars.sub = null;
      d.resolve({ outcome: 'ok', data: [{ paragraph_id: '001.0009', language: 'cz', created_at: '' }] });
      expect(await r).toBe(false);
      expect(JSON.parse(lsMap.get(`stars-cache:${U}`)!)).toEqual([]);
    });

    it('serialises sends: two quick toggles reach the server in order, end unstarred', async () => {
      const { stars } = await setup({ server: [] });
      await stars.init();
      const order: string[] = [];
      const gate = deferred<{ outcome: string }>();
      starParagraph.mockImplementation((id: string) => { order.push('star ' + id); return gate.promise; });
      unstarParagraph.mockImplementation(async (id: string) => { order.push('unstar ' + id); return { outcome: 'ok' }; });
      const t1 = stars.toggle('001.0007', 'en');
      await tick();
      const t2 = stars.toggle('001.0007', 'en');
      await tick();
      expect(order).toEqual(['star 001.0007']); // DELETE not sent while the POST is in flight
      expect(stars.pendingCount).toBe(1); // the in-flight star was replaced; only the unstar waits
      gate.resolve({ outcome: 'ok' });
      await Promise.all([t1, t2]);
      expect(order).toEqual(['star 001.0007', 'unstar 001.0007']);
      expect(stars.isStarred('001.0007')).toBe(false);
      expect(q()).toEqual([]);
      expect(JSON.parse(lsMap.get(`stars-cache:${U}`)!)).toEqual([]);
    });

    it('skips an op that a newer op replaced before its turn', async () => {
      const { stars } = await setup({ server: [] });
      await stars.init();
      const gate = deferred<{ outcome: string }>();
      starParagraph.mockImplementation((id: string) => (id === '001.0001' ? gate.promise : Promise.resolve({ outcome: 'ok' })));
      const a = stars.toggle('001.0001', 'en'); // holds the chain
      await tick();
      const b = stars.toggle('001.0002', 'en'); // waits behind a
      await tick();
      const c = stars.toggle('001.0002', 'en'); // replaces b's op
      gate.resolve({ outcome: 'ok' });
      await Promise.all([a, b, c]);
      expect(starParagraph).toHaveBeenCalledTimes(1); // b's star skipped; c's unstar is a no-op toggle
      expect(unstarParagraph).toHaveBeenCalledWith('001.0002');
      expect(stars.isStarred('001.0002')).toBe(false);
    });

    it('pendingCount excludes in-flight ops, queuedCount does not', async () => {
      const { stars } = await setup({ server: [] });
      await stars.init();
      const gate = deferred<{ outcome: string }>();
      starParagraph.mockReturnValue(gate.promise);
      const t = stars.toggle('001.0007', 'en');
      await tick();
      expect(stars.queuedCount).toBe(1);
      expect(stars.pendingCount).toBe(0);
      gate.resolve({ outcome: 'transient' });
      await t;
      expect(stars.pendingCount).toBe(1);
    });

    it('toggle is a no-op when the stored token belongs to another user', async () => {
      const { stars } = await setup({ server: [] });
      await stars.init();
      token = jwt('someone-else');
      await stars.toggle('001.0007', 'en');
      expect(starParagraph).not.toHaveBeenCalled();
      expect(q()).toEqual([]);
    });

    it('toggle is a no-op when signed out', async () => {
      const { stars, auth } = await setup({ server: [] });
      await stars.init();
      auth.user = null;
      await stars.toggle('001.0007', 'en');
      expect(starParagraph).not.toHaveBeenCalled();
    });

    it('another tab removing auth-token resets memory', async () => {
      const { stars } = await setup({ server: ['001.0001'] });
      await stars.init();
      storageHandlers.forEach((h) => h({ key: 'auth-token', newValue: null } as never));
      expect(stars.sub).toBeNull();
      expect(stars.displayed.size).toBe(0);
    });

    it('this tab\'s involuntary sign-out resets memory but keeps localStorage', async () => {
      starParagraph.mockResolvedValue({ outcome: 'transient', status: 503 });
      lsMap.set(`stars-cache:${U}`, JSON.stringify(['001.0001']));
      lsMap.set(`stars-pending:${U}`, JSON.stringify([{ op: 'star', id: '001.0004', lang: 'cz', commit: 'x', ts: 1 }]));
      const { stars, auth } = await setup({ server: ['001.0001'] });
      await stars.init();
      auth.user = null;
      await tick();
      expect(stars.displayed.size).toBe(0);
      expect(lsMap.has(`stars-pending:${U}`)).toBe(true);
      expect(lsMap.has(`stars-cache:${U}`)).toBe(true);
    });
  });

  describe('voluntary sign-out', () => {
    async function withQueue() {
      starParagraph.mockResolvedValue({ outcome: 'transient', status: 503 });
      lsMap.set(`stars-pending:${U}`, JSON.stringify([{ op: 'star', id: '001.0004', lang: 'cz', commit: 'x', ts: 1 }]));
      const ctx = await setup({ server: ['001.0001'] });
      await ctx.stars.init();
      return ctx;
    }

    it('warns when the queue is non-empty, then clears', async () => {
      const { stars, auth } = await withQueue();
      expect(await auth.signOut()).toBe(true);
      expect(confirmFn).toHaveBeenCalledTimes(1);
      expect(String(confirmFn.mock.calls[0][0])).toContain('1');
      expect(lsMap.has(`stars-pending:${U}`)).toBe(false);
      expect(lsMap.has(`stars-cache:${U}`)).toBe(false);
      expect(stars.displayed.size).toBe(0);
      expect(stars.queuedCount).toBe(0);
    });

    it('cancels when the user declines and keeps everything', async () => {
      const { stars, auth } = await withQueue();
      confirmFn.mockReturnValue(false);
      expect(await auth.signOut()).toBe(false);
      expect(lsMap.has(`stars-pending:${U}`)).toBe(true);
      expect(stars.isStarred('001.0004')).toBe(true);
    });

    it('does not ask when the queue is empty', async () => {
      const { auth } = await setup({ server: ['001.0001'] });
      await useInit();
      expect(await auth.signOut()).toBe(true);
      expect(confirmFn).not.toHaveBeenCalled();
    });
  });
});

const seedOps = (ops: Array<[string, string, number]>, k = U) =>
  lsMap.set(`stars-pending:${k}`, JSON.stringify(ops.map(([op, id, ts]) => ({ op, id, lang: 'cz', commit: 'x', ts }))));
const tick2 = () => new Promise((r) => setTimeout(r, 0));
const gateOf = <T,>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
};

describe('drain (S6b)', () => {
  const T = 2000; // far below the 10 s lock timeout: a deadlock fails here

  it('an op queued during a drain survives (and is not sent by the toggle itself)', async () => {
    const locks = makeLocks();
    (navigator as any).locks = locks;
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1]]);
    const gate = gateOf<{ outcome: string }>();
    starParagraph.mockImplementation((id: string) => (id === '001.0001' ? gate.promise : Promise.resolve({ outcome: 'transient', status: 503 })));
    const d = stars.drain();
    await tick2();
    expect(locks.held).toBe(true);
    expect(await stars.toggle('001.0002', 'cz')).toBe(true); // only enqueues, returns at once
    expect(starParagraph).toHaveBeenCalledTimes(1);
    gate.resolve({ outcome: 'ok' });
    await d;
    // the drain loop picked the new op up (5xx: stays queued); 0001 was removed by (id, ts)
    expect(starParagraph).toHaveBeenCalledWith('001.0002');
    expect(q().map((e: any) => e.id)).toEqual(['001.0002']);
    expect(stars.isStarred('001.0002')).toBe(true);
  }, T);

  it('two concurrent drains, one without the lock API, leave the queue consistent', async () => {
    (navigator as any).locks = makeLocks();
    const { stars: a } = await setup({ server: [] });
    await a.init();
    const pinia2 = createPinia();
    const { useStarsStore } = await import('../stars');
    const b = useStarsStore(pinia2);
    await b.init();
    seedOps([['star', '001.0001', 1], ['star', '001.0002', 2], ['unstar', '001.0003', 3]]);
    const gate = gateOf<{ outcome: string }>();
    let first = true;
    starParagraph.mockImplementation(() => { if (first) { first = false; return gate.promise; } return Promise.resolve({ outcome: 'ok' }); });
    const da = a.drain();
    await tick2();
    const locksApi = (navigator as any).locks;
    delete (navigator as any).locks; // this "tab" has no Web Locks
    const db = b.drain();
    await tick2();
    (navigator as any).locks = locksApi;
    gate.resolve({ outcome: 'ok' });
    await Promise.all([da, db]);
    expect(q()).toEqual([]);
    expect(unstarParagraph).toHaveBeenCalledWith('001.0003');
    expect(a.queuedCount).toBe(0);
    expect(b.queuedCount).toBe(0);
  }, T);

  it('a 5xx stops the drain and keeps the ops', async () => {
    (navigator as any).locks = makeLocks();
    const { stars } = await setup({ server: [] });
    await stars.init();
    listStars.mockClear();
    seedOps([['star', '001.0001', 1], ['star', '001.0002', 2]]);
    starParagraph.mockResolvedValue({ outcome: 'transient', status: 503 });
    await stars.drain();
    expect(starParagraph).toHaveBeenCalledTimes(1);
    expect(q()).toHaveLength(2);
    expect(listStars).not.toHaveBeenCalled();
    expect(stars.lastMessage).toBeNull();
  }, T);

  it('a cap result drops and reverts', async () => {
    (navigator as any).locks = makeLocks();
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0007', 1]]);
    starParagraph.mockResolvedValue({ outcome: 'cap', status: 400 });
    await stars.drain();
    expect(q()).toEqual([]);
    expect(stars.isStarred('001.0007')).toBe(false);
    expect(stars.lastMessage?.key).toBe('stars.capReached');
  }, T);

  it('another 4xx drops the op with stars.error and the drain goes on', async () => {
    (navigator as any).locks = makeLocks();
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1], ['star', '001.0002', 2]]);
    starParagraph.mockImplementation(async (id: string) => (id === '001.0001' ? { outcome: 'error', status: 403 } : { outcome: 'ok' }));
    listStars.mockResolvedValue({ outcome: 'ok', data: [{ paragraph_id: '001.0002', language: 'cz', created_at: '' }] });
    await stars.drain();
    expect(q()).toEqual([]);
    expect(stars.isStarred('001.0001')).toBe(false);
    expect(stars.isStarred('001.0002')).toBe(true);
    expect(stars.lastMessage?.key).toBe('stars.error'); // synced does not override a drop toast
  }, T);

  it('a 401 refreshes once through refreshUnlocked and the drain completes without deadlock', async () => {
    const locks = makeLocks();
    (navigator as any).locks = locks;
    // the locking refresh() really requests the lock: calling it inside the drain would hang
    refreshMock.mockImplementation(() => locks.request('bashkirtseff-auth', {}, async () => ({ status: 'ok' })));
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1]]);
    let calls = 0;
    starParagraph.mockImplementation(async () => {
      if (calls++ === 0) await sendRefresh('stale'); // the 401 path of lib/stars
      return { outcome: 'ok' };
    });
    await stars.drain();
    expect(refreshUnlockedMock).toHaveBeenCalledTimes(1);
    expect(refreshMock).not.toHaveBeenCalled();
    expect(q()).toEqual([]);
  }, T);

  it('a toggle arriving while the drain holds the lock never touches the locking refresh', async () => {
    const locks = makeLocks();
    (navigator as any).locks = locks;
    refreshMock.mockImplementation(() => locks.request('bashkirtseff-auth', {}, async () => ({ status: 'ok' })));
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1]]);
    const gate = gateOf<{ outcome: string }>();
    let n = 0;
    starParagraph.mockImplementation(async (id: string) => {
      if (id === '001.0001') return gate.promise;
      if (n++ === 0) await sendRefresh('stale'); // "401" for the toggled op
      return { outcome: 'ok' };
    });
    const d = stars.drain();
    await tick2();
    const t = stars.toggle('001.0002', 'cz');
    gate.resolve({ outcome: 'ok' });
    await Promise.all([d, t]);
    expect(refreshMock).not.toHaveBeenCalled();
    expect(refreshUnlockedMock).toHaveBeenCalledTimes(1);
    expect(q()).toEqual([]);
  }, T);

  it('a toggle already in flight with a 401 finishes (locking refresh) before the drain takes the lock', async () => {
    const locks = makeLocks();
    (navigator as any).locks = locks;
    refreshMock.mockImplementation(() => locks.request('bashkirtseff-auth', {}, async () => ({ status: 'ok' })));
    const { stars } = await setup({ server: [] });
    await stars.init();
    const gate = gateOf<void>();
    let n = 0;
    starParagraph.mockImplementation(async () => {
      if (n++ === 0) { await gate.promise; await sendRefresh('stale'); }
      return { outcome: 'ok' };
    });
    const t = stars.toggle('001.0001', 'cz');
    await tick2();
    const d = stars.drain(); // flag set, waits for the chain tail before the lock
    await tick2();
    expect(locks.held).toBe(false);
    gate.resolve();
    await Promise.all([t, d]);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(q()).toEqual([]);
  }, T);

  it('a rejected refresh keeps the queue (involuntary sign-out)', async () => {
    (navigator as any).locks = makeLocks();
    const { stars, auth } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1], ['star', '001.0002', 2]]);
    refreshUnlockedMock.mockResolvedValue({ status: 'rejected' });
    starParagraph.mockImplementation(async () => {
      await sendRefresh('stale');
      return { outcome: 'auth', status: 401 };
    });
    await stars.drain();
    await tick2();
    expect(starParagraph).toHaveBeenCalledTimes(1);
    expect(q()).toHaveLength(2);
    expect(auth.user).toBeNull();
    expect(stars.displayed.size).toBe(0); // memory reset; storage kept
    expect(lsMap.has(`stars-pending:${U}`)).toBe(true);
  }, T);

  it('a different user: the other user\'s queue is never sent', async () => {
    (navigator as any).locks = makeLocks();
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1]]);
    token = jwt('someone-else');
    await stars.drain();
    expect(starParagraph).not.toHaveBeenCalled();
    expect(q()).toHaveLength(1);
  }, T);

  it('no refresh call when exp is more than 60 s away; one when it is closer', async () => {
    (navigator as any).locks = makeLocks();
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1]]);
    token = jwt(U, Math.floor(Date.now() / 1000) + 3600);
    await stars.drain();
    expect(refreshUnlockedMock).not.toHaveBeenCalled();
    expect(q()).toEqual([]);

    seedOps([['star', '001.0002', 2]]);
    token = jwt(U, Math.floor(Date.now() / 1000) + 30);
    await stars.drain();
    expect(refreshUnlockedMock).toHaveBeenCalledTimes(1);
    expect(refreshMock).not.toHaveBeenCalled();
    expect(q()).toEqual([]);
  }, T);

  it('is skipped when another tab holds the lock; ops queued meanwhile are sent afterwards', async () => {
    const locks = makeLocks();
    (navigator as any).locks = locks;
    const { stars } = await setup({ server: [] });
    await stars.init();
    listStars.mockClear();
    seedOps([['star', '001.0001', 1]]);
    const release = locks.hold();
    await stars.drain();
    expect(starParagraph).not.toHaveBeenCalled();
    expect(listStars).toHaveBeenCalledTimes(1); // skipped drain still loads the server list (once, no loop)
    expect(q()).toHaveLength(1);
    // a toggle while the drain is being skipped is enqueued, then sent once the skip is known
    const d = stars.drain();
    const t = stars.toggle('001.0002', 'cz');
    await Promise.all([d, t]);
    expect(starParagraph).toHaveBeenCalledTimes(1);
    expect(starParagraph).toHaveBeenCalledWith('001.0002');
    release();
  }, T);

  it('an op toggled during the drain\'s final refetch is still sent', async () => {
    (navigator as any).locks = makeLocks();
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1]]);
    const gate = gateOf<{ outcome: string; data: unknown[] }>();
    listStars.mockReset().mockReturnValueOnce(gate.promise).mockResolvedValue({ outcome: 'ok', data: [] });
    const d = stars.drain();
    await vi.waitFor(() => expect(listStars).toHaveBeenCalledTimes(1)); // drain loop is done, refetch gated
    expect(starParagraph).toHaveBeenCalledTimes(1);
    expect(await stars.toggle('001.0009', 'cz')).toBe(true); // enqueue only
    gate.resolve({ outcome: 'ok', data: [] });
    await d;
    expect(starParagraph).toHaveBeenCalledWith('001.0009');
    expect(q()).toEqual([]);
  }, T);

  it('emits stars.synced when a drain empties a non-empty queue; triggers: online, visible', async () => {
    (navigator as any).locks = makeLocks();
    const { stars } = await setup({ server: [] });
    await stars.init();
    expect(onlineHandlers).toHaveLength(1);
    expect(visibleHandlers).toHaveLength(1);
    seedOps([['star', '001.0001', 1]]);
    onlineHandlers.forEach((h) => h());
    await vi.waitFor(() => expect(q()).toEqual([]));
    await vi.waitFor(() => expect(stars.lastMessage?.key).toBe('stars.synced'));
    seedOps([['star', '001.0002', 2]]);
    doc.visibilityState = 'hidden';
    visibleHandlers.forEach((h) => h());
    await tick2();
    expect(q()).toHaveLength(1);
    doc.visibilityState = 'visible';
    visibleHandlers.forEach((h) => h());
    await vi.waitFor(() => expect(q()).toEqual([]));
  }, T);

  it('drains anyway without the lock API', async () => {
    const { stars } = await setup({ server: [] });
    await stars.init();
    seedOps([['star', '001.0001', 1]]);
    await stars.drain();
    expect(q()).toEqual([]);
  }, T);
});

describe('S6a review fixes', () => {
  it('a GET overlapped by a cross-tab cache rewrite is discarded and re-issued', async () => {
    const { stars } = await setup({ server: [] });
    await stars.init();
    listStars.mockReset();
    let n = 0;
    listStars.mockImplementation(async () => {
      if (n++ === 0) lsMap.set(`stars-cache:${U}`, JSON.stringify(['001.0001'])); // another tab wrote
      return { outcome: 'ok', data: [{ paragraph_id: '001.0001', language: 'cz', created_at: '' }, { paragraph_id: '001.0002', language: 'cz', created_at: '' }] };
    });
    expect(await stars.__test.refetch()).toBe(true);
    expect(listStars).toHaveBeenCalledTimes(2);
    expect(ids(stars.displayed)).toEqual(['001.0001', '001.0002']);
  });

  it('a late sign-in (user appears, sub was null) loads the stored state', async () => {
    starParagraph.mockResolvedValue({ outcome: 'transient', status: 503 });
    seedOps([['star', '001.0004', 1]]);
    const { stars, auth } = await setup({ session: false });
    await stars.init();
    expect(stars.sub).toBeNull();
    token = jwt(U);
    auth.user = { id: U, email: 'a@b.c' } as never;
    await tick2();
    expect(stars.sub).toBe(U);
    expect(stars.isStarred('001.0004')).toBe(true);
  });

  it('localStorage.clear() in another tab (key null, no token) resets memory', async () => {
    const { stars } = await setup({ server: ['001.0001'] });
    await stars.init();
    token = null;
    storageHandlers.forEach((h) => h({ key: null }));
    expect(stars.sub).toBeNull();
    expect(stars.displayed.size).toBe(0);
  });

  it('a successful auth.refresh() (new user object, same id) does not reset the store', async () => {
    const { stars, auth } = await setup({ server: ['001.0001'] });
    await stars.init();
    refreshMock.mockResolvedValue({ status: 'ok', session: { access_token: token, user: { id: U, email: 'new@b.c' } } });
    expect(await auth.refresh()).toBe('ok');
    await tick2();
    expect(stars.sub).toBe(U);
    expect(stars.isStarred('001.0001')).toBe(true);
  });
});

async function useInit() {
  const { useStarsStore } = await import('../stars');
  await useStarsStore().init();
}
