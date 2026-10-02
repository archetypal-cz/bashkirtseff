import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  getSession,
  signInWithGoogle,
  signOut as authSignOut,
  handleCallback,
  getStoredToken,
} from '../lib/auth';
import type { User, Session } from '../lib/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);

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

  async function doInit() {
    try {
      // Check for OAuth callback (PKCE code or legacy hash tokens)
      const wasCallback = await handleCallback();
      if (wasCallback) {
        const fullSession = await getSession();
        if (fullSession) {
          session.value = fullSession;
          user.value = fullSession.user;
        }
        return;
      }

      // Check existing session
      const existing = await getSession();
      if (existing) {
        session.value = existing;
        user.value = existing.user;
      }
    } finally {
      loading.value = false;
    }
  }

  async function signIn() {
    await signInWithGoogle();
  }

  async function signOut() {
    await authSignOut();
    user.value = null;
    session.value = null;
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    displayName,
    avatarUrl,
    token,
    init,
    signIn,
    signOut,
  };
});
