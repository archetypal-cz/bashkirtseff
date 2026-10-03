import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const getSession = vi.fn();
vi.mock('../../lib/auth', () => ({
  getSession: (...a: unknown[]) => getSession(...a),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  handleCallback: vi.fn(async () => false),
  getStoredToken: vi.fn(() => null),
}));

// Minimal browser stubs (no DOM environment is installed): the stores only need
// window events and localStorage.
const listeners: string[] = [];
const store = new Map<string, string>();
const getItem = vi.fn((k: string) => store.get(k) ?? null);
const localStorageStub = {
  getItem, setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k), clear: () => store.clear(),
};

beforeEach(() => {
  listeners.length = 0;
  getItem.mockClear();
  vi.stubGlobal('window', {
    addEventListener: (t: string) => void listeners.push(t),
    dispatchEvent: () => true,
  });
  vi.stubGlobal('localStorage', localStorageStub);
  vi.resetModules();
  getSession.mockReset();
  localStorage.clear();
  setActivePinia(createPinia());
});

describe('auth.init', () => {
  it('runs a single session check for concurrent callers', async () => {
    getSession.mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 10));
      return { access_token: 't', user: { id: 'u', email: 'a@b.c' } };
    });
    const { useAuthStore } = await import('../auth');
    const a = useAuthStore();
    await Promise.all(Array.from({ length: 40 }, () => a.init()));
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(a.isAuthenticated).toBe(true);
    await a.init();
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it('allows a retry after a failed init', async () => {
    getSession.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(null);
    const { useAuthStore } = await import('../auth');
    const a = useAuthStore();
    await expect(a.init()).rejects.toThrow('boom');
    await a.init();
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  it('clears loading even when init fails', async () => {
    getSession.mockRejectedValueOnce(new Error('boom'));
    const { useAuthStore } = await import('../auth');
    const a = useAuthStore();
    expect(a.loading).toBe(true);
    await expect(a.init()).rejects.toThrow('boom');
    expect(a.loading).toBe(false);
  });
});

describe('filter.init', () => {
  it('registers the filter-sync listener once', async () => {
    const { useFilterStore } = await import('../filter');
    const f = useFilterStore();
    f.init(); f.init(); f.init();
    expect(listeners.filter(t => t === 'filter-sync')).toHaveLength(1);
  });
});

describe('filter.loadIndex', () => {
  it('shares one in-flight fetch; every caller awaits the loaded index', async () => {
    const fetchMock = vi.fn(async () => {
      await new Promise(r => setTimeout(r, 10));
      return { ok: true, json: async () => ({ entries: [], categories: [], totalEntries: 0 }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const { useFilterStore } = await import('../filter');
    const f = useFilterStore();
    const first = f.loadIndex();
    const second = f.loadIndex();
    await second; // must not resolve early while the first fetch is in flight
    expect(f.index).not.toBeNull();
    await first;
    await f.loadIndex();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('allows a retry after a failed load', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValue({ ok: true, json: async () => ({ entries: [], categories: [], totalEntries: 0 }) });
    vi.stubGlobal('fetch', fetchMock);
    const { useFilterStore } = await import('../filter');
    const f = useFilterStore();
    await f.loadIndex();
    expect(f.index).toBeNull();
    await f.loadIndex();
    expect(f.index).not.toBeNull();
    err.mockRestore();
  });
});

describe('history/preferences init', () => {
  it('history reads storage once', async () => {
    localStorage.setItem('reading-history', '[]');
    const { useHistoryStore } = await import('../history');
    const h = useHistoryStore();
    h.init(); h.init();
    expect(getItem.mock.calls.filter(c => c[0] === 'reading-history')).toHaveLength(1);
  });

  it('preferences applies settings once', async () => {
    const { usePreferencesStore } = await import('../preferences');
    const p = usePreferencesStore();
    p.init(); p.init();
    expect(getItem.mock.calls.filter(c => c[0] === 'reading-theme')).toHaveLength(1);
  });
});
