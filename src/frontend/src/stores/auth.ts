import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  getSession,
  signInWithGoogle,
  signOut as authSignOut,
  handleCallback,
  getStoredToken,
  refresh as authRefresh,
} from '../lib/auth';
import type { User, Session } from '../lib/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);
  // True while the session is the cached-user fallback (auth server unreachable).
  const offline = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const displayName = computed(
    () => user.value?.user_metadata?.full_name || user.value?.email || null,
  );
  const avatarUrl = computed(() => user.value?.user_metadata?.avatar_url || null);
  const token = computed(() => session.value?.access_token || getStoredToken());

  // Init-once: concurrent/repeated callers (several islands) share one promise,
  // so there is a single session check (one GET /user) per page.
  let initPromise: Promise<void> | null = null;

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

  function applySession(s: Session | null) {
    session.value = s;
    user.value = s ? s.user : null;
    offline.value = !!s?.offline;
  }

  async function doInit() {
    try {
      // Check for OAuth callback (PKCE code or legacy hash tokens)
      const wasCallback = await handleCallback();
      if (wasCallback) {
        const fullSession = await getSession();
        applySession(fullSession);
        return;
      }

      // Check existing session
      const existing = await getSession();
      applySession(existing);
    } finally {
      loading.value = false;
    }
  }

  async function signIn() {
    await signInWithGoogle();
  }

  // Voluntary sign-out guards: the stars store (S6a) registers one that asks
  // "N changes not yet synced - sign out anyway?" and returns false to cancel.
  const signOutGuards: Array<() => boolean | Promise<boolean>> = [];
  function registerSignOutGuard(guard: () => boolean | Promise<boolean>) {
    signOutGuards.push(guard);
  }

  /** Voluntary sign-out. Returns false if a guard cancelled it. */
  async function signOut(): Promise<boolean> {
    for (const guard of signOutGuards) {
      if (!(await guard())) return false;
    }
    await authSignOut();
    applySession(null);
    return true;
  }

  /**
   * Refresh the session (waits for the cross-tab lock) and keep the store in step
   * with the stored token. Resolves to the outcome status.
   */
  async function refresh(): Promise<'ok' | 'network' | 'rejected'> {
    const result = await authRefresh();
    if (result.status === 'ok') applySession(result.session);
    else if (result.status === 'network') applySession(result.session);
    else applySession(null); // rejected: involuntary sign-out, tokens already cleared
    return result.status;
  }

  return {
    user,
    session,
    loading,
    offline,
    isAuthenticated,
    displayName,
    avatarUrl,
    token,
    init,
    refresh,
    signIn,
    signOut,
    registerSignOutGuard,
  };
});
