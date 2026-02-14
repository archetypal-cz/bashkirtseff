<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useHistoryStore, type HistoryItem } from '../../stores/history';
import { useI18n } from '../../i18n';

/**
 * ContinueReading — shows a "Continue reading" button when the user
 * has a saved reading position for the current carnet or year.
 *
 * Reads from the history store (localStorage 'reading-history').
 * Renders nothing if no matching history item is found.
 */

interface Props {
  scopeType: 'carnet' | 'year';
  scopeId: string;  // carnet ID ('001') or year ('1877')
}

const props = defineProps<Props>();
const { t } = useI18n();
const historyStore = useHistoryStore();
const ready = ref(false);

onMounted(() => {
  historyStore.init();
  ready.value = true;
});

const matchingItem = computed((): HistoryItem | null => {
  if (!ready.value) return null;

  for (const item of historyStore.items) {
    if (item.type !== 'paragraph') continue;

    if (props.scopeType === 'carnet') {
      if (item.carnet === props.scopeId) return item;
    } else if (props.scopeType === 'year') {
      // Match by the year portion of the entryDate (e.g. '1877-03-09' → '1877')
      if (item.entryDate && item.entryDate.startsWith(props.scopeId)) return item;
    }
  }

  return null;
});
</script>

<template>
  <a
    v-if="matchingItem"
    :href="matchingItem.url"
    class="continue-btn"
  >
    <svg class="continue-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
    <span class="continue-text">
      {{ t('diary.continueReading') }}
      <span class="continue-position">{{ matchingItem.paragraphId }}</span>
    </span>
    <svg class="continue-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  </a>
</template>

<style scoped>
.continue-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  border: 1.5px solid var(--color-accent, #B45309);
  background: transparent;
  color: var(--color-accent, #B45309);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
  cursor: pointer;
}

.continue-btn:hover {
  background: var(--color-accent, #B45309);
  color: white;
}

[data-theme="dark"] .continue-btn {
  border-color: var(--color-accent, #D97706);
  color: var(--color-accent, #D97706);
}

[data-theme="dark"] .continue-btn:hover {
  background: var(--color-accent, #D97706);
  color: #1a1a1a;
}

.continue-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.continue-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.continue-position {
  font-family: monospace;
  font-size: 0.75rem;
  opacity: 0.8;
}

.continue-arrow {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
</style>
