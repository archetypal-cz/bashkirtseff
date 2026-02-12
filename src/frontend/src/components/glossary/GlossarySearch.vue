<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from '../../i18n';
import { getCategoryIcon, getCategoryColor } from '../../lib/glossary-categories';

const { t } = useI18n();

interface GlossaryEntry {
  id: string;
  name: string;
  type?: string;
  summary?: string;
  category?: string;
  usageCount?: number;
  aliases?: string[];
}

const props = withDefaults(defineProps<{
  entries: GlossaryEntry[];
  basePath?: string;
}>(), {
  basePath: '/glossary',
});

const searchQuery = ref('');
const isOpen = ref(false);
const selectedIndex = ref(-1);

// Debounced search query
const debouncedQuery = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (newQuery) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = newQuery;
    selectedIndex.value = -1;
  }, 300);
});

function scoreEntry(entry: GlossaryEntry, query: string): number {
  const nameLower = entry.name.toLowerCase();

  let score = 0;

  if (nameLower === query) {
    score = 1000;
  } else if (nameLower.startsWith(query)) {
    score = 500;
  } else if (nameLower.includes(query)) {
    // Bonus for word-boundary match
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundary = new RegExp(`\\b${escaped}`, 'i');
    score = wordBoundary.test(entry.name) ? 200 : 100;
  } else if (entry.aliases?.some(a => a.toLowerCase() === query)) {
    score = 400;
  } else if (entry.aliases?.some(a => a.toLowerCase().startsWith(query))) {
    score = 300;
  } else if (entry.aliases?.some(a => a.toLowerCase().includes(query))) {
    score = 150;
  } else if (entry.type?.toLowerCase().includes(query)) {
    score = 50;
  } else if (entry.summary?.toLowerCase().includes(query)) {
    score = 25;
  } else {
    return 0;
  }

  // Usage count bonus (up to 50 points)
  score += Math.min((entry.usageCount || 0) / 2, 50);

  return score;
}

const scoredResults = computed(() => {
  if (!debouncedQuery.value.trim()) return [];

  const query = debouncedQuery.value.toLowerCase().trim();
  const scored: Array<{ entry: GlossaryEntry; score: number }> = [];

  for (const entry of props.entries) {
    const score = scoreEntry(entry, query);
    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.name.localeCompare(b.entry.name);
  });

  return scored;
});

const filteredEntries = computed(() => {
  return scoredResults.value.slice(0, 20).map(s => s.entry);
});

const resultsCount = computed(() => {
  return scoredResults.value.length;
});

function handleFocus() {
  isOpen.value = true;
}

function handleBlur() {
  setTimeout(() => {
    isOpen.value = false;
    selectedIndex.value = -1;
  }, 200);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (selectedIndex.value < filteredEntries.value.length - 1) {
      selectedIndex.value++;
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (selectedIndex.value > 0) {
      selectedIndex.value--;
    }
  } else if (event.key === 'Enter' && selectedIndex.value >= 0) {
    event.preventDefault();
    const entry = filteredEntries.value[selectedIndex.value];
    if (entry) {
      window.location.href = `${props.basePath}/${entry.id}`;
    }
  } else if (event.key === 'Escape') {
    isOpen.value = false;
    selectedIndex.value = -1;
  }
}

function clearSearch() {
  searchQuery.value = '';
  debouncedQuery.value = '';
  selectedIndex.value = -1;
}

function highlightMatch(text: string): string {
  if (!debouncedQuery.value.trim()) return text;

  const query = debouncedQuery.value.trim();
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

function getIconPath(category?: string): string {
  return getCategoryIcon(category);
}

function getIconColor(category?: string): string {
  return getCategoryColor(category);
}
</script>

<template>
  <div class="glossary-search">
    <div class="search-input-wrapper">
      <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('glossary.search')"
        class="search-input"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="clear-btn"
        type="button"
        :aria-label="t('common.close')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Results dropdown -->
    <Transition name="fade">
      <div v-if="isOpen && debouncedQuery.trim()" class="search-results">
        <!-- Results count -->
        <div v-if="resultsCount > 0" class="results-count">
          {{ t('glossary.results', { count: resultsCount }) }}
        </div>

        <!-- Results list -->
        <div v-if="filteredEntries.length > 0" class="results-list">
          <a
            v-for="(entry, index) in filteredEntries"
            :key="entry.id"
            :href="`${basePath}/${entry.id}`"
            class="result-item"
            :class="{ 'is-selected': index === selectedIndex }"
          >
            <div class="result-header">
              <svg v-if="entry.category" class="result-icon" :style="{ color: getIconColor(entry.category) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(entry.category)" />
              </svg>
              <div class="result-name" v-html="highlightMatch(entry.name)"></div>
              <span v-if="entry.usageCount" class="result-refs" :title="`${entry.usageCount} references in diary`">{{ entry.usageCount }}</span>
            </div>
            <div v-if="entry.type" class="result-type">{{ entry.type }}</div>
            <div v-if="entry.summary" class="result-summary" v-html="highlightMatch(entry.summary)"></div>
          </a>
        </div>

        <!-- No results -->
        <div v-else class="no-results">
          {{ t('glossary.noResults') }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.glossary-search {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin-bottom: 1.5rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-muted, #78716C);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem;
  font-size: 1rem;
  background: var(--bg-secondary, #F5E6D3);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.5rem;
  color: var(--text-primary, #2C1810);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--color-accent, #B45309);
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
}

.search-input::placeholder {
  color: var(--text-muted, #78716C);
}

[data-theme="dark"] .search-input {
  background: #252525;
  border-color: rgba(255, 255, 255, 0.1);
  color: #e5e5e5;
}

[data-theme="dark"] .search-input:focus {
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.2);
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  padding: 0.25rem;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: var(--text-primary, #2C1810);
}

[data-theme="dark"] .clear-btn:hover {
  color: #e5e5e5;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 400px;
  overflow-y: auto;
}

[data-theme="dark"] .search-results {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

.results-count {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--text-muted, #78716C);
  background: var(--bg-secondary, #F5E6D3);
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

[data-theme="dark"] .results-count {
  background: #252525;
}

.results-list {
  padding: 0.5rem;
}

.result-item {
  display: block;
  padding: 0.75rem;
  border-radius: 0.375rem;
  text-decoration: none;
  color: var(--text-primary, #2C1810);
  transition: background-color 0.2s;
}

.result-item:hover,
.result-item.is-selected {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .result-item {
  color: #e5e5e5;
}

[data-theme="dark"] .result-item:hover,
[data-theme="dark"] .result-item.is-selected {
  background: #252525;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.result-icon {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
}

.result-name {
  font-weight: 500;
  font-size: 0.9375rem;
  flex: 1;
  min-width: 0;
}

.result-refs {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  background: var(--bg-secondary, #F5E6D3);
  border-radius: 1rem;
  color: var(--text-muted, #78716C);
}

[data-theme="dark"] .result-refs {
  background: #333;
}

.result-type {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--bg-secondary, #F5E6D3);
  border-radius: 0.25rem;
  color: var(--text-muted, #78716C);
  margin-bottom: 0.25rem;
  margin-left: 1.5rem;
}

[data-theme="dark"] .result-type {
  background: #333;
}

.result-summary {
  font-size: 0.8125rem;
  color: var(--text-secondary, #4A3728);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-left: 1.5rem;
}

[data-theme="dark"] .result-summary {
  color: #a3a3a3;
}

.no-results {
  padding: 1.5rem;
  text-align: center;
  color: var(--text-muted, #78716C);
  font-size: 0.875rem;
}

:deep(.highlight) {
  background: rgba(180, 83, 9, 0.2);
  color: inherit;
  padding: 0 0.125rem;
  border-radius: 0.125rem;
}

[data-theme="dark"] :deep(.highlight) {
  background: rgba(217, 119, 6, 0.3);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
