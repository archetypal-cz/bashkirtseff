// ─── Paragraph Stars: API client + pure helpers ──────────────────────
//
// Talks to the PostgREST `paragraph_stars` table (RLS scopes rows to the
// caller). The pure helpers (queue collapse, applyPending, classification)
// serve the Pinia store (stores/stars.ts, S6a/S6b): they hold no state and
// never touch localStorage.
//
// Usage:
//   const res = await starParagraph('008.0145', 'cz');
//   if (res.outcome === 'transient') queue = enqueue(queue, {...});

import { decodeJwt, getStoredToken, refresh, type RefreshResult } from './auth';

// The plan lists decodeJwt among the stars helpers; it lives in auth.ts (single copy).
export { decodeJwt };

const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.bashkirtseff.org';

declare const __GIT_COMMIT__: string;

/** Server-side cap per user (enforced by the DB trigger; mirrored here as a hard queue bound). */
export const MAX_QUEUE = 1000;

// ─── Types ───────────────────────────────────────────────────────────

/** Languages accepted by the DB CHECK constraint. */
export type StarLanguage = 'original' | 'cz' | 'uk' | 'en' | 'fr' | 'es';

export type StarOpKind = 'star' | 'unstar';

/** One queued write. Unique by (id, ts). */
export interface StarOp {
  op: StarOpKind;
  /** Paragraph ID, `CCC.NNNN`. */
  id: string;
  lang: StarLanguage;
  /** Build commit the reader saw when toggling. */
  commit: string;
  /** Client timestamp (ms), also the identity half of (id, ts). */
  ts: number;
}

/**
 * ok        2xx
 * transient network error, 5xx, 408 or 429: keep the op, retry later
 * cap       400 `star_cap_reached`
 * auth      401 (expired or rejected JWT)
 * error     any other 4xx (including 403)
 */
export type StarOutcome = 'ok' | 'transient' | 'cap' | 'auth' | 'error';

export interface StarResult<T = undefined> {
  outcome: StarOutcome;
  status?: number;
  data?: T;
}

export interface ServerStar {
  paragraph_id: string;
  language: string;
  created_at: string;
}

/** Signature shared by auth.refresh() and auth.refreshUnlocked() (the latter ignores the token). */
export type RefreshFn = (staleToken?: string) => Promise<RefreshResult>;

// ─── Pure helpers ────────────────────────────────────────────────────

const STARRABLE_RE = /^\d{3}\.\d{4}$/;

/** Entry pages and carnet 000 only. GLO_* and DROPPED-* are not starrable from the UI. */
export function isStarrableId(id: string | null | undefined): boolean {
  return typeof id === 'string' && STARRABLE_RE.test(id);
}

/**
 * Map a frontend language code (URL path 'cz'/'original'/'en'/'uk'/'fr'/'es',
 * content path '_original', or a UI locale 'cs') to the DB set. `undefined`
 * and anything unknown mean the French original. Note 'fr' is the modern
 * French edition, distinct from 'original'.
 */
export function normalizeLanguage(lang: string | null | undefined): StarLanguage {
  switch (lang) {
    case 'cz':
    case 'cs':
      return 'cz';
    case 'uk':
    case 'en':
    case 'fr':
    case 'es':
      return lang;
    default:
      return 'original'; // undefined, '', 'original', '_original', unknown
  }
}

/** Build id used for `commit_hash`: `__GIT_COMMIT__`, or 'unknown' in dev builds (as reports.ts). */
export function currentCommit(): string {
  return typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : 'unknown';
}

/**
 * Keep only the newest op per paragraph (highest `ts`; on a tie the later array
 * position wins). Surviving entries keep their relative order.
 */
export function collapse(queue: readonly StarOp[]): StarOp[] {
  const newest = new Map<string, number>(); // id -> index of the winning entry
  queue.forEach((e, i) => {
    const j = newest.get(e.id);
    if (j === undefined || e.ts >= queue[j].ts) newest.set(e.id, i);
  });
  return queue.filter((_, i) => newest.get(queue[i].id) === i);
}

/**
 * Add an op, superseding older ops for the same paragraph (collapse at enqueue
 * time), then bound the queue to `cap` entries by dropping the oldest. Pure:
 * returns a new array. Callers must run this on a fresh read of localStorage.
 */
export function enqueue(queue: readonly StarOp[], entry: StarOp, cap = MAX_QUEUE): StarOp[] {
  const next = collapse([...queue, entry]);
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/**
 * Remove exactly the entry identified by (id, ts). A newer op for the same
 * paragraph (different ts) stays, so a drain never loses a toggle made while
 * its request was in flight.
 */
export function removeById(queue: readonly StarOp[], id: string, ts: number): StarOp[] {
  return queue.filter((e) => !(e.id === id && e.ts === ts));
}

/**
 * The displayed set: the last server list with the remaining queued ops applied
 * on top, oldest first. A server re-fetch therefore never wipes optimistic state.
 */
export function applyPending(serverIds: Iterable<string>, queue: readonly StarOp[]): Set<string> {
  const out = new Set<string>(serverIds);
  for (const e of [...queue].sort((a, b) => a.ts - b.ts)) {
    if (e.op === 'star') out.add(e.id);
    else out.delete(e.id);
  }
  return out;
}

/**
 * Classify a fetch outcome. `null` stands for a network error (fetch threw).
 * Reads a clone of the body for the 400 check, so the caller's response stays readable.
 */
export async function classifyResponse(res: Response | null): Promise<StarOutcome> {
  if (!res) return 'transient';
  if (res.ok) return 'ok';
  if (res.status >= 500 || res.status === 408 || res.status === 429) return 'transient';
  // PostgREST answers JWT problems with 401 and permission errors with 403 (no refresh for those).
  if (res.status === 401) return 'auth';
  if (res.status === 400) {
    const body = await res.clone().json().catch(() => null);
    if (body && body.message === 'star_cap_reached') return 'cap';
  }
  return 'error';
}

// ─── API client ──────────────────────────────────────────────────────

async function send(path: string, init: RequestInit, token: string): Promise<Response | null> {
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
}

/**
 * One request with the token read at call time. On 401/403 it refreshes once via
 * `refreshFn` and retries with the NEW token (never the stale one). A rejected
 * refresh yields `auth`; a network/server refresh failure yields `transient`.
 *
 * `refreshFn` defaults to the locking `refresh()`. Code that already HOLDS the
 * `bashkirtseff-auth` Web Lock (the S6b drain) must pass `refreshUnlocked`:
 * the lock is not re-entrant, so the default would deadlock until its 10 s timeout.
 */
async function request(
  path: string,
  init: RequestInit,
  refreshFn: RefreshFn,
): Promise<{ res: Response | null; outcome: StarOutcome }> {
  const token = getStoredToken();
  if (!token) return { res: null, outcome: 'auth' };

  let res = await send(path, init, token);
  let outcome = await classifyResponse(res);
  if (outcome !== 'auth') return { res, outcome };

  const r = await refreshFn(token); // the token that got the 401, so one another tab already replaced is not treated as rejected
  if (r.status === 'rejected') return { res, outcome: 'auth' };
  if (r.status === 'network') return { res, outcome: 'transient' };
  const fresh = getStoredToken() ?? r.session.access_token;
  res = await send(path, init, fresh);
  outcome = await classifyResponse(res);
  return { res, outcome };
}

/**
 * All of the signed-in user's stars, in paragraph order. Not paged: PostgREST
 * truncates at max-rows (1000, PGRST_MAX_ROWS in src/auth/docker-compose.yml) and
 * the DB cap trigger can overshoot 1000 by a few rows under a race. Accepted
 * limitation: a user that far over the cap may not see the overshoot rows.
 */
export async function listStars(refreshFn: RefreshFn = refresh): Promise<StarResult<ServerStar[]>> {
  const { res, outcome } = await request(
    '/paragraph_stars?select=paragraph_id,language,created_at&order=paragraph_id',
    { method: 'GET' },
    refreshFn,
  );
  if (outcome !== 'ok' || !res) return { outcome, status: res?.status };
  try {
    return { outcome, status: res.status, data: (await res.json()) as ServerStar[] };
  } catch {
    return { outcome: 'transient', status: res.status }; // unreadable body: treat as a server fault
  }
}

/** Idempotent: starring an already-starred paragraph is a no-op (ignore-duplicates). */
export function starParagraph(
  id: string,
  lang: string | null | undefined,
  commit: string = currentCommit(),
  refreshFn: RefreshFn = refresh,
): Promise<StarResult> {
  return write(
    '/paragraph_stars?on_conflict=user_id,paragraph_id',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify({ paragraph_id: id, language: normalizeLanguage(lang), commit_hash: commit }),
    },
    refreshFn,
  );
}

export function unstarParagraph(id: string, refreshFn: RefreshFn = refresh): Promise<StarResult> {
  return write(
    `/paragraph_stars?paragraph_id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
    refreshFn,
  );
}

/** Delete every star of the signed-in user (RLS limits the delete to their rows). */
export function removeAllStars(refreshFn: RefreshFn = refresh): Promise<StarResult> {
  return write(
    '/paragraph_stars?paragraph_id=not.is.null',
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
    refreshFn,
  );
}

/** Send one queued op (the drain). Drain code holds the lock: pass `refreshUnlocked`. */
export function sendOp(op: StarOp, refreshFn: RefreshFn = refresh): Promise<StarResult> {
  return op.op === 'star'
    ? starParagraph(op.id, op.lang, op.commit, refreshFn)
    : unstarParagraph(op.id, refreshFn);
}

async function write(path: string, init: RequestInit, refreshFn: RefreshFn): Promise<StarResult> {
  const { res, outcome } = await request(path, init, refreshFn);
  return { outcome, status: res?.status };
}
