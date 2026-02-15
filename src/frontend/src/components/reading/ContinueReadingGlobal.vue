<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useHistoryStore, type HistoryItem } from '../../stores/history';
import { useI18n } from '../../i18n';

/**
 * ContinueReadingGlobal — shows a "Continue reading" button on home/landing
 * pages when the user has any non-glossary reading history.
 *
 * Picks the most recent paragraph item (history is already sorted newest-first).
 * Renders nothing if no matching item exists.
 */

const { t } = useI18n();
const historyStore = useHistoryStore();
const ready = ref(false);

onMounted(() => {
  historyStore.init();
  ready.value = true;
});

const latestParagraph = computed((): HistoryItem | null => {
  if (!ready.value) return null;
  return historyStore.items.find(item => item.type === 'paragraph') ?? null;
});
</script>

<template>
  <a
    v-if="latestParagraph"
    :href="latestParagraph.url"
    class="continue-global-btn"
  >
    <svg class="continue-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
    <span class="continue-text">
      {{ t('diary.continueReading') }}
      <span class="continue-position">{{ latestParagraph.paragraphId }}</span>
    </span>
    <svg class="continue-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </a>
</template>

<style scoped>
.continue-global-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  background: var(--color-accent, #B45309);
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.continue-global-btn:hover {
  background: var(--color-accent-light, #92400E);
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);
}

[data-theme="dark"] .continue-global-btn {
  background: var(--color-accent, #D97706);
  color: #1a1a1a;
}

[data-theme="dark"] .continue-global-btn:hover {
  background: var(--color-accent-light, #F59E0B);
}

.continue-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.continue-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.continue-position {
  font-family: monospace;
  font-size: 0.8rem;
  opacity: 0.85;
}

.continue-arrow {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}
</style>
