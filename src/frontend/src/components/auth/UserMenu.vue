<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '../../i18n';
import { useAuthStore } from '../../stores/auth';
import { trackEvent } from '../../lib/analytics';

const { t } = useI18n();
const auth = useAuthStore();

// Inline consent step — shown before first sign-in
const showConsent = ref(false);

onMounted(() => {
  auth.init();
});

function handleSignIn() {
  trackEvent('auth_sign_in_click');
  // If user hasn't consented yet, show privacy info first
  if (!localStorage.getItem('auth-consent')) {
    showConsent.value = true;
    return;
  }
  auth.signIn();
}

function confirmAndSignIn() {
  localStorage.setItem('auth-consent', '1');
  trackEvent('auth_consent_accepted');
  showConsent.value = false;
  auth.signIn();
}

function cancelConsent() {
  showConsent.value = false;
}

async function handleSignOut() {
  trackEvent('auth_sign_out');
  await auth.signOut();
}
</script>

<template>
  <div class="user-menu">
    <!-- Loading state -->
    <template v-if="auth.loading">
      <span class="user-menu__loading">...</span>
    </template>

    <!-- Authenticated -->
    <template v-else-if="auth.isAuthenticated">
      <div class="user-menu__profile">
        <img
          v-if="auth.avatarUrl"
          :src="auth.avatarUrl"
          :alt="auth.displayName || ''"
          class="user-menu__avatar"
          referrerpolicy="no-referrer"
        />
        <span class="user-menu__name">{{ auth.displayName }}</span>
        <button @click="handleSignOut" class="user-menu__btn user-menu__btn--signout">
          {{ t('auth.signOut') }}
        </button>
      </div>
    </template>

    <!-- Pre-sign-in consent step -->
    <template v-else-if="showConsent">
      <div class="user-menu__consent">
        <p class="user-menu__consent-text">{{ t('auth.preLoginInfo') }}</p>
        <div class="user-menu__consent-actions">
          <button @click="cancelConsent" class="user-menu__btn user-menu__btn--cancel">
            {{ t('common.close') }}
          </button>
          <button @click="confirmAndSignIn" class="user-menu__btn user-menu__btn--continue">
            <svg class="user-menu__google-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {{ t('auth.continueWithGoogle') }}
          </button>
        </div>
      </div>
    </template>

    <!-- Not authenticated — sign in button -->
    <template v-else>
      <button @click="handleSignIn" class="user-menu__btn user-menu__btn--signin">
        <svg class="user-menu__google-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {{ t('auth.signInGoogle') }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
}

.user-menu__loading {
  font-size: 0.75rem;
  color: var(--text-muted, #78716C);
}

.user-menu__profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-menu__avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
}

.user-menu__name {
  font-size: 0.8125rem;
  color: var(--text-primary, #2C1810);
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-theme="dark"] .user-menu__name {
  color: #e5e5e5;
}

.user-menu__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  background: transparent;
  color: var(--text-primary, #2C1810);
}

[data-theme="dark"] .user-menu__btn {
  color: #e5e5e5;
  border-color: rgba(255, 255, 255, 0.15);
}

.user-menu__btn:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .user-menu__btn:hover {
  background: #252525;
}

.user-menu__btn--signout {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.user-menu__btn--cancel {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.user-menu__btn--continue {
  color: white;
  background: var(--color-accent, #B45309);
  border-color: var(--color-accent, #B45309);
}

.user-menu__btn--continue:hover {
  background: #92400E;
  border-color: #92400E;
}

.user-menu__google-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* ─── Consent step ──────────────────────────────────────────────────── */

.user-menu__consent {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 20rem;
}

.user-menu__consent-text {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--text-muted, #78716C);
}

.user-menu__consent-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
