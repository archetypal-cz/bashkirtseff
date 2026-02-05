<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../../i18n';

const { t } = useI18n();

const isOpen = ref(false);

function toggleMenu() {
  isOpen.value = !isOpen.value;
  // Prevent body scroll when menu is open
  document.body.style.overflow = isOpen.value ? 'hidden' : '';
}

function closeMenu() {
  isOpen.value = false;
  document.body.style.overflow = '';
}
</script>

<template>
  <div class="mobile-menu-container md:hidden">
    <!-- Toggle button -->
    <button
      @click="toggleMenu"
      class="menu-toggle"
      :aria-expanded="isOpen"
      aria-label="Menu"
    >
      <svg v-if="!isOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Menu overlay -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="menu-overlay"
        @click="closeMenu"
      />
    </Transition>

    <!-- Menu panel -->
    <Transition name="slide">
      <nav v-if="isOpen" class="menu-panel">
        <div class="menu-header">
          <span class="menu-title">{{ t('common.menu') }}</span>
        </div>

        <div class="menu-links">
          <!-- Links to /cz/ (Czech diary content). This is a CONTENT path, not a UI path.
               The diary entries currently only exist in Czech translation at /cz/. -->
          <a href="/cz" @click="closeMenu" class="menu-link">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {{ t('nav.diary') }}
          </a>
          <a href="/original" @click="closeMenu" class="menu-link">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {{ t('nav.original') }}
          </a>
          <a href="/glossary" @click="closeMenu" class="menu-link">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t('nav.glossary') }}
          </a>
          <a href="/about" @click="closeMenu" class="menu-link">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t('nav.about') }}
          </a>
        </div>

        <div class="menu-footer">
          <button class="login-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ t('common.login') }}
          </button>
        </div>
      </nav>
    </Transition>
  </div>
</template>

<style scoped>
.mobile-menu-container {
  display: flex;
  align-items: center;
}

.menu-toggle {
  padding: 0.5rem;
  color: var(--text-secondary, #4A3728);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  z-index: 60;
  position: relative;
}

.menu-toggle:hover {
  color: var(--color-accent, #B45309);
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.menu-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: var(--bg-primary, #FFF8F0);
  z-index: 55;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .menu-panel {
  background: #1a1a1a;
}

.menu-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.menu-title {
  font-weight: 600;
  color: var(--text-primary, #2C1810);
}

[data-theme="dark"] .menu-title {
  color: #e5e5e5;
}

.menu-links {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  color: var(--text-primary, #2C1810);
  text-decoration: none;
  transition: background-color 0.2s;
}

[data-theme="dark"] .menu-link {
  color: #e5e5e5;
}

.menu-link:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .menu-link:hover {
  background: #252525;
}

.menu-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-accent, #B45309);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-btn:hover {
  background: var(--color-accent-light, #D97706);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (min-width: 768px) {
  .mobile-menu-container {
    display: none;
  }
}
</style>
