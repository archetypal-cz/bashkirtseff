<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../../i18n';

const props = defineProps<{
  originalText: string;
  paragraphId: string;
}>();

const { t } = useI18n();
const isOpen = ref(false);

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}
</script>

<template>
  <div class="original-toggle-wrapper">
    <!-- Small icon button in top-right -->
    <button
      @click="toggle"
      class="original-toggle-btn"
      :class="{ 'is-open': isOpen }"
      :aria-label="t('reading.showOriginal')"
      :title="t('reading.showOriginal')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    </button>

    <!-- Popup with original text -->
    <Transition name="fade">
      <div v-if="isOpen" class="original-popup">
        <div class="original-popup-header">
          <span class="original-popup-title">{{ t('reading.originalText') }}</span>
          <button @click="close" class="close-btn" :aria-label="t('common.close')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <blockquote class="original-text">
          {{ originalText }}
        </blockquote>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div v-if="isOpen" class="backdrop" @click="close" />
  </div>
</template>

<style scoped>
.original-toggle-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}

.original-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0.25rem;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.2s;
}

.original-toggle-btn:hover {
  opacity: 1;
  color: var(--color-accent, #B45309);
  background: var(--bg-secondary, #F5E6D3);
}

.original-toggle-btn.is-open {
  opacity: 1;
  color: var(--color-accent, #B45309);
}

[data-theme="dark"] .original-toggle-btn {
  color: #737373;
}

[data-theme="dark"] .original-toggle-btn:hover {
  background: #252525;
  color: var(--color-accent, #B45309);
}

.original-popup {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 320px;
  max-width: 90vw;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 50;
}

[data-theme="dark"] .original-popup {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

.original-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  background: var(--bg-secondary, #F5E6D3);
  border-radius: 0.5rem 0.5rem 0 0;
}

[data-theme="dark"] .original-popup-header {
  background: #252525;
}

.original-popup-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #78716C);
}

.close-btn {
  padding: 0.125rem;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary, #2C1810);
}

[data-theme="dark"] .close-btn:hover {
  color: #e5e5e5;
}

.original-text {
  padding: 0.75rem;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-secondary, #4A3728);
  font-style: italic;
  max-height: 300px;
  overflow-y: auto;
}

[data-theme="dark"] .original-text {
  color: #a3a3a3;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
