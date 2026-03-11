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

  async function init() {
    if (typeof window === 'undefined') return;

    // Check for OAuth callback tokens in URL hash
    const wasCallback = handleCallback();
    if (wasCallback) {
      const fullSession = await getSession();
      if (fullSession) {
        session.value = fullSession;
        user.value = fullSession.user;
      }
      loading.value = false;
      return;
    }

    // Check existing session
    const existing = await getSession();
    if (existing) {
      session.value = existing;
      user.value = existing.user;
    }
    loading.value = false;
  }

  function signIn() {
    signInWithGoogle();
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
