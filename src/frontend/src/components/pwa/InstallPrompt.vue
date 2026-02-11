<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../i18n';

const { t } = useI18n();

const showPrompt = ref(false);
const deferredPrompt = ref<any>(null);

function handleBeforeInstallPrompt(e: Event) {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Store the event so it can be triggered later
  deferredPrompt.value = e;
  // Check if user has dismissed before
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (!dismissed) {
    showPrompt.value = true;
  }
}

async function installApp() {
  if (!deferredPrompt.value) return;

  // Show the install prompt
  deferredPrompt.value.prompt();

  // Wait for the user to respond
  const { outcome } = await deferredPrompt.value.userChoice;

  if (outcome === 'accepted') {
    showPrompt.value = false;
  }

  // Clear the deferred prompt
  deferredPrompt.value = null;
}

function dismissPrompt() {
  showPrompt.value = false;
  localStorage.setItem('pwa-install-dismissed', 'true');
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  // Also handle if app gets installed
  window.addEventListener('appinstalled', () => {
    showPrompt.value = false;
    deferredPrompt.value = null;
  });
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
});
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="showPrompt"
      class="install-prompt"
    >
      <div class="install-content">
        <div class="install-icon">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="install-text">
          <strong>{{ t('pwa.installApp') }}</strong>
          <span>{{ t('pwa.betterExperience') }}</span>
          <span class="privacy-note">{{ t('pwa.privacyNote') }}</span>
        </div>
      </div>
      <div class="install-actions">
        <button @click="dismissPrompt" class="btn-dismiss">
          {{ t('pwa.noThanks') }}
        </button>
        <button @click="installApp" class="btn-install">
          {{ t('pwa.install') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.install-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary, #FFF8F0);
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 100;
}

@media (min-width: 640px) {
  .install-prompt {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
  }
}

.install-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.install-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  background: var(--color-accent, #B45309);
  color: white;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.install-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.install-text strong {
  font-size: 1rem;
  color: var(--text-primary, #2C1810);
}

.install-text span {
  font-size: 0.875rem;
  color: var(--text-muted, #78716C);
}

.install-text .privacy-note {
  font-size: 0.75rem;
  opacity: 0.7;
}

.install-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-dismiss {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.2));
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-dismiss:hover {
  background: var(--bg-secondary, #F5E6D3);
  color: var(--text-primary, #2C1810);
}

.btn-install {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: white;
  background: var(--color-accent, #B45309);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-install:hover {
  background: var(--color-accent-light, #D97706);
}

/* Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Dark mode */
[data-theme="dark"] .install-prompt {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .install-text strong {
  color: #e5e5e5;
}

[data-theme="dark"] .install-text span {
  color: #737373;
}

[data-theme="dark"] .btn-dismiss {
  color: #737373;
  border-color: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .btn-dismiss:hover {
  background: #252525;
  color: #e5e5e5;
}
</style>
