import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useAuthStore } from './auth';
import { AUTH_LOCK_NAME, decodeJwt, getStoredToken, refresh, refreshUnlocked, type RefreshResult } from '../lib/auth';
import {
  applyPending,
  currentCommit,
  enqueue,
  isStarrableId,
  listStars,
  normalizeLanguage,
  removeById,
  sendOp,
  type RefreshFn,
  type StarOp,
  type StarResult,
} from '../lib/stars';
import { getLocale } from '../i18n';
import { resolveMessage, type MessageParams, type MessageTree } from '../i18n/messages';
import cs from '../i18n/locales/cs.json';
import fr from '../i18n/locales/fr.json';
import en from '../i18n/locales/en.json';
import uk from '../i18n/locales/uk.json';
import es from '../i18n/locales/es.json';

// ─── Paragraph Stars store (part 1: cache, queue writes, optimistic toggle) ──
//
// localStorage layout (per user, keyed by the `sub` decoded from the stored JWT):
//   stars-cache:<sub>    last server list, JSON `string[]` of paragraph ids
//   stars-pending:<sub>  JSON `StarOp[]`, unique by (id, ts)
// Displayed set = applyPending(serverIds, queue): a re-fetch never wipes
// optimistic or still-queued state. Every queue write is a read-modify-write on
// a FRESH localStorage read, and removal is by (id, ts) only.
//
// Consumers must apply `displayed` only after onMounted (hydration safety).
//
// Sends are strictly serial. EVERY network write (toggle, drain) goes through
// `runSerial()` / `sendQueued()`, so a POST and a DELETE for one paragraph can
// never be in flight together and ops reach the server in order.
// `sendQueued` re-reads the queue right before sending and skips an op that a
// newer op replaced. A `confirmSeq` counter is bumped whenever an op is
// confirmed or dropped; `refetch` discards a GET that overlapped such a change
// (and one that overlapped a change of the cache key by another tab).
//
// Drain (offline design §3, §6): `drain()` runs inside navigator.locks
// ('bashkirtseff-auth', ifAvailable; skipped when another tab holds it; without
// the API it drains anyway). Triggers: init, `online`, visibilitychange -> visible.
// Inside the lock EVERY refresh is `refreshUnlocked` (never the locking
// `refresh`, the lock is not re-entrant), only when exp < 60 s away or on a 401.
//
// Deadlock freedom. The only way to deadlock is a send that calls the locking
// refresh() while this tab's drain holds the lock and the drain waits for that
// send. (1) `draining` is set synchronously when drain() starts; from then on
// toggle() only enqueues (optimistic) and returns, so nothing new enters the serial
// chain except the drain's own ops, which use refreshUnlocked. (2) Before asking for
// the lock the drain awaits the chain tail, so every send that started earlier (and
// may use the locking refresh) has settled; the lock is never held while waiting on
// such a send. (3) Under the lock the drain waits only on its own sends and on
// fetches, all bounded by the 15 s request timeout and none of which request the
// lock (refreshUnlocked's /token call carries the same 15 s timeout). Ops enqueued
// while draining are picked up by the drain loop (fresh readQueue until no unsent
// op remains). Ops toggled after the loop's last readQueue (e.g. during the final
// refetch GET), or while the drain was skipped or stopped, are sent by
// flushDeferred once the lock is released. NEVER put a send on the serial chain
// while draining except from the drain itself: a chained send that needs the
// locking refresh() would wait for a lock the drain holds while the drain waits
// for the chain.
//
// Known limitation: a direct toggle send in one tab is not serialised against
// another tab's drain send for the same paragraph (needs two tabs and a pending
// op; ops are idempotent and removal is by (id, ts), so the worst case is a
// transient server-side order flip that the next refetch corrects).
//
// UI: show `pendingCount` (queued ops not currently being sent) for the
// `stars.queuedOffline` notice; `queuedCount` is every queued op, in flight or not.

const CACHE_PREFIX = 'stars-cache:';
const PENDING_PREFIX = 'stars-pending:';

const messages: Record<string, MessageTree> = { cs, uk, en, fr, es };

function translate(key: string, params?: MessageParams): string {
  const locale = getLocale();
  return resolveMessage(messages[locale] || messages.cs, key, locale, params);
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // quota / blocked storage: state stays in memory for this page
  }
}
function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readIds(sub: string): string[] {
  try {
    const v = JSON.parse(lsGet(CACHE_PREFIX + sub) ?? 'null');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function readQueue(sub: string): StarOp[] {
  try {
    const v = JSON.parse(lsGet(PENDING_PREFIX + sub) ?? 'null');
    return Array.isArray(v)
      ? v.filter((e) => e && typeof e.id === 'string' && typeof e.ts === 'number' && (e.op === 'star' || e.op === 'unstar'))
      : [];
  } catch {
    return [];
  }
}

function writeQueue(sub: string, q: StarOp[]): void {
  if (q.length) lsSet(PENDING_PREFIX + sub, JSON.stringify(q));
  else lsRemove(PENDING_PREFIX + sub);
}

function opKey(e: StarOp): string {
  return `${e.id}|${e.ts}`;
}

function currentSub(): string | null {
  try {
    return decodeJwt(getStoredToken())?.sub ?? null;
  } catch {
    return null;
  }
}

/** A different user signing in deletes the other users' queue and cache (offline design §2). */
function purgeOtherUsers(sub: string): void {
  const stale: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      for (const p of [CACHE_PREFIX, PENDING_PREFIX]) {
        if (k.startsWith(p) && k.slice(p.length) !== sub) stale.push(k);
      }
    }
  } catch {
    return;
  }
  stale.forEach(lsRemove);
}

export interface StarsMessage {
  /** i18n key, e.g. `stars.capReached`. */
  key: string;
  text: string;
  /** Increments per message so a repeated identical message re-triggers watchers. */
  seq: number;
}

export const useStarsStore = defineStore('stars', () => {
  const auth = useAuthStore();

  const sub = ref<string | null>(null);
  const serverIds = ref<string[]>([]);
  const queue = ref<StarOp[]>([]);
  const ready = ref(false);
  /** Last toast-worthy message (cap reached, error). Components render it, e.g. as a live region. */
  const lastMessage = ref<StarsMessage | null>(null);
  let msgSeq = 0;

  const displayed = computed(() => applyPending(serverIds.value, queue.value));
  /** (id|ts) keys of ops currently being sent by the serial chain. */
  const inFlight = ref<string[]>([]);
  /** Every queued op, including ones being sent right now (internal / tests). */
  const queuedCount = computed(() => queue.value.length);
  /** Count the UI should show for `stars.queuedOffline`: queued ops NOT currently in flight. */
  const pendingCount = computed(() => queue.value.filter((e) => !inFlight.value.includes(opKey(e))).length);

  function notify(key: string, params?: MessageParams) {
    lastMessage.value = { key, text: translate(key, params), seq: ++msgSeq };
  }

  function loadFromStorage() {
    const s = sub.value;
    if (!s) {
      serverIds.value = [];
      queue.value = [];
      return;
    }
    serverIds.value = readIds(s);
    queue.value = readQueue(s);
  }

  /** Read-modify-write on a FRESH localStorage read; refreshes the in-memory queue. */
  function mutateQueue(fn: (q: StarOp[]) => StarOp[]): StarOp[] {
    const s = sub.value;
    if (!s) return queue.value;
    const next = fn(readQueue(s));
    writeQueue(s, next);
    queue.value = next;
    return next;
  }

  function setServerIds(ids: string[]) {
    serverIds.value = ids;
    if (sub.value) lsSet(CACHE_PREFIX + sub.value, JSON.stringify(ids));
  }

  function isOffline(): boolean {
    return auth.offline || (typeof navigator !== 'undefined' && navigator.onLine === false);
  }

  function resetMemory() {
    sub.value = null;
    serverIds.value = [];
    queue.value = [];
  }

  // Bumped whenever an op is confirmed or dropped (ok, cap, error; S6b removals too).
  let confirmSeq = 0;
  const MAX_REFETCH_RETRIES = 2;

  /**
   * Fetch the server list and cache it; the displayed set re-derives with the
   * queue on top. A GET that overlapped a confirmed/dropped op (or a user change)
   * may be stale, so it is discarded and re-issued (bounded); if it keeps
   * overlapping, the cache is kept as is (it already has the confirmed changes).
   * Holders of the auth lock (S6b drain) pass `refreshUnlocked`.
   */
  async function refetch(refreshFn: RefreshFn = refresh): Promise<boolean> {
    for (let attempt = 0; attempt <= MAX_REFETCH_RETRIES; attempt++) {
      const s = sub.value;
      if (!s || isOffline()) return false;
      const seq = confirmSeq;
      const cacheKey = CACHE_PREFIX + s;
      const cacheSnap = lsGet(cacheKey); // another tab may rewrite the cache while the GET is in flight
      const res = await listStars(refreshFn);
      if (sub.value !== s) return false; // signed out / user changed meanwhile
      if (res.outcome !== 'ok' || !res.data) return false;
      if (confirmSeq !== seq || lsGet(cacheKey) !== cacheSnap) continue; // stale: an op was confirmed (here or in another tab) while the GET was in flight
      setServerIds(res.data.map((r) => r.paragraph_id));
      queue.value = readQueue(s); // fresh: another tab may have changed it
      return true;
    }
    return false;
  }

  // ─── Serial send chain ────────────────────────────────────────────────
  let sendChain: Promise<unknown> = Promise.resolve();

  /** Run `fn` after every previously scheduled send has settled. Never rejects the chain. */
  function runSerial<T>(fn: () => Promise<T>): Promise<T> {
    const run = sendChain.then(fn, fn);
    sendChain = run.catch(() => undefined);
    return run;
  }

  /**
   * Send one queued op and apply the result. MUST run inside `runSerial`.
   * Returns null when the op was skipped (superseded by a newer op for the
   * paragraph, already gone, or the user changed), otherwise the send result.
   */
  async function sendQueued(entry: StarOp, refreshFn: RefreshFn = refresh): Promise<StarResult | null> {
    const s = sub.value;
    if (!s) return null;
    // Fresh read: skip when the op was replaced by a newer one (or removed by another tab).
    if (!readQueue(s).some((e) => e.id === entry.id && e.ts === entry.ts)) return null;
    const key = opKey(entry);
    inFlight.value = [...inFlight.value, key];
    let res: StarResult;
    try {
      res = await sendOp(entry, refreshFn);
    } finally {
      inFlight.value = inFlight.value.filter((k) => k !== key);
    }
    if (sub.value !== s) return res; // signed out meanwhile
    switch (res.outcome) {
      case 'ok':
        // Server now matches this op: fold it into the cache and drop it from the queue.
        confirmSeq++;
        setServerIds(
          entry.op === 'star'
            ? [...new Set([...serverIds.value, entry.id])]
            : serverIds.value.filter((x) => x !== entry.id),
        );
        mutateQueue((q) => removeById(q, entry.id, entry.ts));
        break;
      case 'cap':
        confirmSeq++;
        mutateQueue((q) => removeById(q, entry.id, entry.ts));
        notify('stars.capReached');
        break;
      case 'error':
        confirmSeq++;
        mutateQueue((q) => removeById(q, entry.id, entry.ts));
        notify('stars.error');
        break;
      default:
        // transient / auth (refresh rejected = involuntary sign-out): keep optimistic state, stays queued
        break;
    }
    return res;
  }

  // ─── Drain (S6b) ──────────────────────────────────────────────────────
  let draining = false;
  let drainPromise: Promise<void> | null = null;
  /** (id|ts) keys of ops queued by toggle() while a drain was running. */
  let deferred = new Set<string>();

  /** `refreshUnlocked` for lock holders; keeps the auth store in step (as auth.refresh() does). */
  async function refreshHoldingLock(): Promise<RefreshResult> {
    const r = await refreshUnlocked();
    if (r.status === 'ok') {
      auth.session = r.session;
      auth.user = r.session.user;
      auth.offline = false;
    } else if (r.status === 'rejected') {
      // involuntary sign-out: tokens cleared by lib/auth, queue and cache kept
      auth.session = null;
      auth.user = null;
      auth.offline = false;
    } else if (r.session) {
      auth.offline = true;
    }
    return r;
  }

  /** Body of the drain. Runs while holding the auth lock (or without the lock API). */
  async function drainLocked(): Promise<boolean> {
    const s = sub.value;
    if (!s) return false;
    const claims = decodeJwt(getStoredToken());
    if (!claims || claims.sub !== s) return false; // different user: never send their ops
    const hadOps = readQueue(s).length > 0;
    // No unconditional refresh: only when the token is about to expire.
    if (claims.exp - Date.now() / 1000 < 60) {
      const r = await refreshHoldingLock();
      if (r.status !== 'ok') return false; // offline (kept) or rejected (queue kept)
    }
    const attempted = new Set<string>();
    let dropped = false;
    for (;;) {
      if (sub.value !== s) return false;
      const next = readQueue(s)
        .filter((e) => !attempted.has(opKey(e)))
        .sort((a, b) => a.ts - b.ts)[0];
      if (!next) break;
      attempted.add(opKey(next));
      const res = await runSerial(() => sendQueued(next, refreshHoldingLock));
      // ok / cap / error: the op is gone, continue. transient / auth: stop, keep the rest.
      if (res && (res.outcome === 'transient' || res.outcome === 'auth')) return false;
      if (res && (res.outcome === 'cap' || res.outcome === 'error')) dropped = true;
    }
    if (sub.value !== s) return false;
    if (hadOps && !dropped && readQueue(s).length === 0) notify('stars.synced'); // never over a cap/error toast
    await refetch(refreshHoldingLock); // displayed = applyPending(server, remaining queue)
    return true;
  }

  async function doDrain(): Promise<void> {
    let skipped = false;
    try {
      // Everything sent before the flag was set may use the locking refresh: let it settle
      // BEFORE taking the lock (see the header comment).
      await runSerial(async () => undefined);
      const locks = typeof navigator !== 'undefined' && navigator.locks ? navigator.locks : null;
      let ran = false;
      let lockFailed = false;
      if (locks) {
        try {
          await locks.request(AUTH_LOCK_NAME, { ifAvailable: true }, async (lock) => {
            if (!lock) return; // another tab holds it and does the work
            ran = true;
            await drainLocked().catch(() => false);
          });
        } catch {
          lockFailed = true; // locks unusable: drain anyway
        }
        if (!ran && !lockFailed) skipped = true;
      }
      // Without the API (or if it throws) drain anyway: ops are idempotent, removal is by (id, ts).
      if (!locks || (lockFailed && !ran)) await drainLocked().catch(() => false);
    } finally {
      draining = false;
    }
    await flushDeferred();
    // Another tab holds the lock and drains: still load the server list here (a new device
    // must see it). The lock is not held by this tab, so the default locking refresh is safe;
    // refetch never calls drain(), so this cannot loop.
    if (skipped) await refetch().catch(() => false);
  }

  /** Send ops that toggle() only enqueued during the drain and that the drain did not send. */
  async function flushDeferred(): Promise<void> {
    const keys = deferred;
    deferred = new Set();
    const s = sub.value;
    if (!s || !keys.size || isOffline()) return;
    // Every deferred key still queued is sent, also after a complete drain: an op toggled
    // after the drain's last readQueue was never seen by it. sendQueued's fresh read
    // skips ops the drain already sent. The lock is released here, so the locking
    // refresh is safe.
    for (const e of readQueue(s).sort((a, b) => a.ts - b.ts)) {
      if (keys.has(opKey(e))) await runSerial(() => sendQueued(e));
    }
  }

  /**
   * Drain the queue (offline design §6). Concurrent callers in this tab share one run.
   * Offline or signed out: nothing to do.
   */
  function drain(): Promise<void> {
    if (drainPromise) return drainPromise;
    if (!sub.value || isOffline()) return Promise.resolve();
    draining = true; // synchronously, before the first await: toggle() only enqueues from now on
    drainPromise = doDrain().finally(() => {
      drainPromise = null;
    });
    return drainPromise;
  }

  // Init-once: concurrent/repeated callers share one promise (one GET /paragraph_stars per page).
  let initPromise: Promise<void> | null = null;
  let hooksRegistered = false;

  function init(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (!initPromise) {
      initPromise = doInit().catch((err) => {
        initPromise = null; // allow a retry after a failure
        throw err;
      });
    }
    return initPromise;
  }

  async function doInit() {
    await auth.init();
    registerHooks();
    const s = auth.isAuthenticated ? currentSub() : null;
    sub.value = s;
    if (s) purgeOtherUsers(s);
    loadFromStorage();
    ready.value = true; // cached markers show immediately, also offline
    if (s) await drain();
  }

  function registerHooks() {
    if (hooksRegistered) return;
    hooksRegistered = true;

    // Other tabs: re-render from localStorage when the cache or queue changes.
    window.addEventListener('storage', (e: StorageEvent) => {
      // localStorage.clear() in another tab (key === null) with no token left: signed out there.
      if (e.key === null && !getStoredToken()) {
        resetMemory();
        return;
      }
      const s = sub.value;
      if (!s) return;
      // Another tab signed out: drop in-memory state (this tab's keys were cleared there too).
      if (e.key === 'auth-token' && !e.newValue) {
        resetMemory();
        return;
      }
      if (e.key === null || e.key === CACHE_PREFIX + s || e.key === PENDING_PREFIX + s) loadFromStorage();
    });

    // This tab's involuntary sign-out (refresh rejected): reset memory only; the
    // localStorage queue/cache stay, keyed by sub (offline design §2).
    watch(
      () => auth.user,
      (u) => {
        if (!u) {
          resetMemory();
        } else if (!sub.value && u.id === currentSub()) {
          // signed in (or session restored) after init ran signed out
          sub.value = u.id;
          purgeOtherUsers(u.id);
          loadFromStorage();
          drain().catch(() => {});
        }
      },
    );

    // Drain triggers (registered once): back online, tab visible again.
    window.addEventListener('online', () => {
      drain().catch(() => {});
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') drain().catch(() => {});
      });
    }

    // Voluntary sign-out: warn about unsynced changes, then reset memory. lib/auth
    // signOut() clears the localStorage keys too; clearing them here as well is
    // idempotent and keeps the guard self-contained.
    auth.registerSignOutGuard(() => {
      const s = sub.value ?? currentSub();
      const count = s ? readQueue(s).length : 0;
      if (count > 0) {
        const text = translate('stars.unsyncedSignOutWarning', { count });
        if (typeof window.confirm === 'function' && !window.confirm(text)) return false;
      }
      if (s) {
        lsRemove(CACHE_PREFIX + s);
        lsRemove(PENDING_PREFIX + s);
      }
      resetMemory();
      return true;
    });
  }

  /**
   * Optimistic toggle. The op is queued first (fresh read-modify-write), which
   * makes the displayed set flip at once; then, when online, it is sent and the
   * queued entry removed by (id, ts) on success. Transient failures (network,
   * 5xx, 408, 429) and offline keep it queued for the drain. Cap and other
   * errors drop it (the display reverts) and emit a message.
   * Returns the new starred state.
   */
  async function toggle(id: string, lang?: string | null): Promise<boolean> {
    const s = sub.value;
    if (!s || !isStarrableId(id)) return displayed.value.has(id);
    // Signed out (or a different user signed in in another tab): do nothing.
    if (!auth.isAuthenticated || currentSub() !== s) return displayed.value.has(id);
    const wantStar = !displayed.value.has(id);
    const entry: StarOp = {
      op: wantStar ? 'star' : 'unstar',
      id,
      lang: normalizeLanguage(lang),
      commit: currentCommit(),
      ts: Date.now(),
    };
    mutateQueue((q) => {
      // ts must beat any queued op for this paragraph so the new one wins the collapse
      const newest = q.filter((e) => e.id === id).reduce((m, e) => Math.max(m, e.ts), 0);
      entry.ts = Math.max(entry.ts, newest + 1);
      return enqueue(q, entry);
    });

    if (isOffline()) return wantStar; // stays queued; stars.queuedOffline shows the count
    if (draining) {
      // A drain owns the sends (and maybe the auth lock): only enqueue; the drain loop sends it.
      deferred.add(opKey(entry));
      return wantStar;
    }

    // Serial: waits for earlier sends; skipped if a newer toggle replaced this op meanwhile.
    await runSerial(() => sendQueued(entry));
    return displayed.value.has(id);
  }

  function isStarred(id: string): boolean {
    return displayed.value.has(id);
  }

  return {
    sub,
    ready,
    displayed,
    queuedCount,
    pendingCount,
    lastMessage,
    init,
    toggle,
    isStarred,
    drain,
    /** Internals for tests only; nothing in the app may use these. */
    __test: { refetch, mutateQueue },
  };
});
