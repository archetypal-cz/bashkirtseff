import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ../auth is mocked: this file tests the stars client, not token storage.
let storedToken: string | null = 'old';
const refreshMock = vi.fn();
vi.mock('../auth', () => ({
  getStoredToken: () => storedToken,
  decodeJwt: (t: string | null) => (t === 'jwt' ? { sub: 's1', exp: 42 } : null),
  refresh: (...a: unknown[]) => refreshMock('locked', ...a),
  timeoutSignal: (ms: number) => {
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  },
}));

import {
  isStarrableId,
  normalizeLanguage,
  collapse,
  enqueue,
  removeById,
  applyPending,
  classifyResponse,
  decodeJwt,
  starParagraph,
  unstarParagraph,
  removeAllStars,
  listStars,
  sendOp,
  type StarOp,
} from '../stars';

const fetchMock = vi.fn();
const res = (status: number, body: unknown = {}) => new Response(status === 204 ? null : JSON.stringify(body), { status });
const op = (o: 'star' | 'unstar', id: string, ts: number): StarOp => ({ op: o, id, lang: 'cz', commit: 'c', ts });
const okSession = (token: string) => ({ status: 'ok' as const, session: { access_token: token } as any });

beforeEach(() => {
  storedToken = 'old';
  fetchMock.mockReset();
  refreshMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('pure helpers', () => {
  it('isStarrableId: entry and 000 yes; GLO, DROPPED, junk no', () => {
    expect(isStarrableId('008.0145')).toBe(true);
    expect(isStarrableId('000.0003')).toBe(true);
    expect(isStarrableId('GLO_NICE.0001')).toBe(false);
    expect(isStarrableId('008.DROPPED-0145')).toBe(false);
    expect(isStarrableId('8.145')).toBe(false);
    expect(isStarrableId('008.01450')).toBe(false);
    expect(isStarrableId(undefined)).toBe(false);
  });

  it('normalizeLanguage maps frontend codes to the DB set', () => {
    expect(normalizeLanguage(undefined)).toBe('original');
    expect(normalizeLanguage('_original')).toBe('original');
    expect(normalizeLanguage('original')).toBe('original');
    expect(normalizeLanguage('cz')).toBe('cz');
    expect(normalizeLanguage('cs')).toBe('cz');
    expect(normalizeLanguage('fr')).toBe('fr');
    for (const l of ['uk', 'en', 'es']) expect(normalizeLanguage(l)).toBe(l);
    expect(normalizeLanguage('xx')).toBe('original');
  });

  it('collapse keeps the newest op per paragraph', () => {
    const q = [op('star', 'a', 1), op('star', 'b', 2), op('unstar', 'a', 3)];
    expect(collapse(q)).toEqual([op('star', 'b', 2), op('unstar', 'a', 3)]);
    expect(collapse([op('star', 'a', 5), op('unstar', 'a', 5)])).toEqual([op('unstar', 'a', 5)]);
  });

  it('enqueue collapses at enqueue time, does not mutate, and caps at 1000', () => {
    const q = [op('star', 'a', 1)];
    const n = enqueue(q, op('unstar', 'a', 2));
    expect(n).toEqual([op('unstar', 'a', 2)]);
    expect(q).toHaveLength(1);
    let big: StarOp[] = [];
    for (let i = 0; i < 1005; i++) big = enqueue(big, op('star', `p${i}`, i));
    expect(big).toHaveLength(1000);
    expect(big[0].id).toBe('p5');
    expect(big[999].id).toBe('p1004');
  });

  it('removeById leaves a newer op for the same paragraph intact', () => {
    const q = [op('star', 'a', 1), op('unstar', 'a', 2), op('star', 'b', 1)];
    expect(removeById(q, 'a', 1)).toEqual([op('unstar', 'a', 2), op('star', 'b', 1)]);
    expect(removeById(q, 'a', 99)).toHaveLength(3);
  });

  it('applyPending: star adds, unstar removes, order by ts, server untouched', () => {
    const server = ['a', 'b'];
    expect([...applyPending(server, [])].sort()).toEqual(['a', 'b']);
    expect([...applyPending(server, [op('star', 'c', 1), op('unstar', 'a', 2)])].sort()).toEqual(['b', 'c']);
    // later op wins regardless of array order
    expect(applyPending([], [op('unstar', 'x', 2), op('star', 'x', 1)]).has('x')).toBe(false);
    expect(applyPending([], [op('star', 'x', 2), op('unstar', 'x', 1)]).has('x')).toBe(true);
    expect(applyPending(['q'], [op('unstar', 'zz', 1)]).has('q')).toBe(true);
  });

  it('decodeJwt (from auth) returns sub and exp', () => {
    expect(decodeJwt('jwt')).toEqual({ sub: 's1', exp: 42 });
  });
});

describe('classifyResponse', () => {
  it('maps network, 5xx, cap, auth, other 4xx, ok', async () => {
    expect(await classifyResponse(null)).toBe('transient');
    expect(await classifyResponse(res(503))).toBe('transient');
    expect(await classifyResponse(res(500))).toBe('transient');
    expect(await classifyResponse(res(400, { message: 'star_cap_reached' }))).toBe('cap');
    expect(await classifyResponse(res(400, { message: 'other' }))).toBe('error');
    expect(await classifyResponse(new Response('not json', { status: 400 }))).toBe('error');
    expect(await classifyResponse(res(401, { code: 'PGRST301' }))).toBe('auth');
    expect(await classifyResponse(res(403))).toBe('error'); // permission error, no refresh
    expect(await classifyResponse(res(408))).toBe('transient');
    expect(await classifyResponse(res(429))).toBe('transient');
    expect(await classifyResponse(res(404))).toBe('error');
    expect(await classifyResponse(res(409))).toBe('error');
    expect(await classifyResponse(res(201))).toBe('ok');
  });

  it('leaves the response body readable', async () => {
    const r = res(400, { message: 'star_cap_reached' });
    await classifyResponse(r);
    expect((await r.json()).message).toBe('star_cap_reached');
  });
});

describe('API client', () => {
  const auth = (i = 0) => fetchMock.mock.calls[i][1].headers.Authorization;

  it('star sends the exact PostgREST request, token read at call time', async () => {
    fetchMock.mockResolvedValueOnce(res(201));
    const r = await starParagraph('008.0145', 'cz', 'abc123');
    expect(r.outcome).toBe('ok');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/paragraph_stars\?on_conflict=user_id,paragraph_id$/);
    expect(init.method).toBe('POST');
    expect(init.headers.Prefer).toBe('resolution=ignore-duplicates,return=minimal');
    expect(init.headers.Authorization).toBe('Bearer old');
    expect(JSON.parse(init.body)).toEqual({ paragraph_id: '008.0145', language: 'cz', commit_hash: 'abc123' });
  });

  it('body carries __GIT_COMMIT__, falling back to "unknown"', async () => {
    vi.stubGlobal('__GIT_COMMIT__', 'deadbee');
    fetchMock.mockResolvedValue(res(201));
    await starParagraph('008.0145', undefined);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ commit_hash: 'deadbee', language: 'original' });
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', fetchMock);
    await starParagraph('008.0145', 'en');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).commit_hash).toBe('unknown');
  });

  it('unstar, remove-all and list use the documented requests', async () => {
    fetchMock.mockResolvedValue(res(204));
    await unstarParagraph('008.0145');
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/paragraph_stars\?paragraph_id=eq\.008\.0145$/);
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    await removeAllStars();
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/\/paragraph_stars\?paragraph_id=not\.is\.null$/);
    fetchMock.mockResolvedValueOnce(res(200, [{ paragraph_id: '008.0145', language: 'cz', created_at: 't' }]));
    const l = await listStars();
    expect(String(fetchMock.mock.calls[2][0])).toMatch(
      /\/paragraph_stars\?select=paragraph_id,language,created_at&order=paragraph_id$/,
    );
    expect(l.data).toHaveLength(1);
  });

  it('401 -> refresh -> retry carries the new token', async () => {
    fetchMock.mockResolvedValueOnce(res(401, { code: 'PGRST301' })).mockResolvedValueOnce(res(201));
    refreshMock.mockImplementationOnce(async () => {
      storedToken = 'new';
      return okSession('new');
    });
    const r = await starParagraph('008.0145', 'cz');
    expect(r.outcome).toBe('ok');
    expect(auth(0)).toBe('Bearer old');
    expect(auth(1)).toBe('Bearer new');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(refreshMock.mock.calls[0][0]).toBe('locked');
    expect(refreshMock.mock.calls[0][1]).toBe('old'); // stale token passed
  });

  it('refreshFn parameter replaces the locking refresh (drain passes refreshUnlocked)', async () => {
    const unlocked = vi.fn(async () => {
      storedToken = 'new';
      return okSession('new');
    });
    fetchMock.mockResolvedValueOnce(res(401)).mockResolvedValueOnce(res(204));
    const r = await sendOp(op('unstar', '008.0145', 1), unlocked);
    expect(r.outcome).toBe('ok');
    expect(unlocked).toHaveBeenCalledTimes(1);
    expect(unlocked).toHaveBeenCalledWith('old'); // the token that got the 401
    expect(refreshMock).not.toHaveBeenCalled();
    expect(auth(1)).toBe('Bearer new');
  });

  it('retries only once: a second 401 is auth', async () => {
    fetchMock.mockResolvedValue(res(401));
    refreshMock.mockResolvedValue(okSession('new'));
    expect((await starParagraph('008.0145', 'cz')).outcome).toBe('auth');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('rejected refresh -> auth; network refresh -> transient; no retry', async () => {
    fetchMock.mockResolvedValue(res(401));
    refreshMock.mockResolvedValueOnce({ status: 'rejected' });
    expect((await starParagraph('008.0145', 'cz')).outcome).toBe('auth');
    refreshMock.mockResolvedValueOnce({ status: 'network', session: null });
    expect((await starParagraph('008.0145', 'cz')).outcome).toBe('transient');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('network error and 5xx -> transient; cap -> cap; no token -> auth without fetching', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    expect((await starParagraph('008.0145', 'cz')).outcome).toBe('transient');
    fetchMock.mockResolvedValueOnce(res(502));
    expect((await unstarParagraph('008.0145')).outcome).toBe('transient');
    fetchMock.mockResolvedValueOnce(res(400, { message: 'star_cap_reached' }));
    expect((await starParagraph('008.0145', 'cz')).outcome).toBe('cap');
    storedToken = null;
    fetchMock.mockClear();
    expect((await starParagraph('008.0145', 'cz')).outcome).toBe('auth');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a request that never answers is aborted after 15 s and is transient', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockImplementation(
        (_u: string, init: RequestInit) =>
          new Promise((_r, reject) => {
            init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
          }),
      );
      const p = starParagraph('008.0145', 'cz');
      await vi.advanceTimersByTimeAsync(14000);
      let settled = false;
      p.then(() => (settled = true));
      await vi.advanceTimersByTimeAsync(0);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1500);
      expect((await p).outcome).toBe('transient');
    } finally {
      vi.useRealTimers();
    }
  });
});
