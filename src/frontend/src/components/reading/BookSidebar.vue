<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../i18n';
import CalendarWidget from '../CalendarWidget.vue';

const { t, locale } = useI18n();

interface Entry {
  date: string;
  title?: string;
}

interface Props {
  carnet: string;
  currentEntry: string;
  entries: Entry[];
  language: string;
  selectedDate?: string;
}

const props = defineProps<Props>();

const isOpen = ref(false);
const isPinned = ref(false);
const isLargeScreen = ref(false);
const searchQuery = ref('');

const STORAGE_KEY = 'sidebar-pinned';

// Media query for lg+ screens (1024px)
let mediaQuery: MediaQueryList | null = null;

function handleMediaChange(e: MediaQueryListEvent | MediaQueryList) {
  isLargeScreen.value = e.matches;
  // If screen becomes small while pinned, unpin
  if (!e.matches && isPinned.value) {
    isPinned.value = false;
    updatePinnedClass(false);
  }
}

onMounted(() => {
  // Restore pinned state
  const saved = localStorage.getItem(STORAGE_KEY);
  mediaQuery = window.matchMedia('(min-width: 1024px)');
  isLargeScreen.value = mediaQuery.matches;
  mediaQuery.addEventListener('change', handleMediaChange);

  if (saved === 'true' && isLargeScreen.value) {
    isPinned.value = true;
    isOpen.value = true;
    updatePinnedClass(true);
  }
});

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleMediaChange);
  }
});

function updatePinnedClass(pinned: boolean) {
  if (pinned) {
    document.documentElement.classList.add('sidebar-pinned');
  } else {
    document.documentElement.classList.remove('sidebar-pinned');
  }
}

function togglePin() {
  isPinned.value = !isPinned.value;
  localStorage.setItem(STORAGE_KEY, isPinned.value ? 'true' : 'false');
  updatePinnedClass(isPinned.value);
  if (isPinned.value) {
    isOpen.value = true;
  }
}

const basePath = computed(() => {
  return props.language === '_original' ? '/original' : `/${props.language}`;
});

const filteredEntries = computed(() => {
  if (!searchQuery.value) return props.entries;

  const query = searchQuery.value.toLowerCase();
  return props.entries.filter(entry =>
    entry.date.includes(query) ||
    entry.title?.toLowerCase().includes(query)
  );
});

const currentIndex = computed(() => {
  return props.entries.findIndex(e => e.date === props.currentEntry);
});

// Compute months that have entries for calendar display
const calendarMonths = computed(() => {
  const monthMap = new Map<string, { year: number; month: number; dates: string[] }>();

  for (const entry of props.entries) {
    const [year, month] = entry.date.split('-').map(Number);
    const key = `${year}-${month}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { year, month, dates: [] });
    }
    monthMap.get(key)!.dates.push(entry.date);
  }

  // Sort by year/month
  return Array.from(monthMap.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
});

function toggleSidebar() {
  isOpen.value = !isOpen.value;
}

function closeSidebar() {
  if (isPinned.value) return; // Don't close when pinned
  isOpen.value = false;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);

  // Map locale codes to BCP 47 language tags
  const localeMap: Record<string, string> = {
    'cs': 'cs-CZ',
    'en': 'en-US',
    'fr': 'fr-FR',
  };

  const dateLocale = localeMap[locale.value] || 'cs-CZ';

  return date.toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'short',
  });
}
</script>

<template>
  <div class="book-sidebar-wrapper">
    <!-- Toggle button (hidden when pinned open) -->
    <button
      v-if="!isPinned || !isOpen"
      @click="toggleSidebar"
      class="sidebar-toggle"
      :class="{ 'is-open': isOpen }"
      :title="isOpen ? t('sidebar.closeContents') : t('sidebar.openContents')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <span class="toggle-label">{{ t('sidebar.contents') }}</span>
      <span class="entry-counter">{{ currentIndex + 1 }}/{{ entries.length }}</span>
    </button>

    <!-- Sidebar panel -->
    <Transition name="slide">
      <aside v-if="isOpen" class="sidebar-panel" :class="{ 'is-pinned': isPinned }">
        <!-- Header (non-scrolling) -->
        <div class="sidebar-header">
          <h2 class="sidebar-title">
            {{ t('sidebar.carnet', { carnet }) }}
          </h2>
          <div class="sidebar-header-actions">
            <!-- Pin button (only on large screens) -->
            <button
              v-if="isLargeScreen"
              @click="togglePin"
              class="pin-btn"
              :class="{ 'is-pinned': isPinned }"
              :title="isPinned ? t('sidebar.unpinSidebar') : t('sidebar.pinSidebar')"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 2-2v0a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v0a2 2 0 0 0 2 2 1 1 0 0 1 1 1z" :fill="isPinned ? 'currentColor' : 'none'" />
              </svg>
            </button>
            <button @click="isOpen = false; if (isPinned) { isPinned = false; localStorage.setItem(STORAGE_KEY, 'false'); updatePinnedClass(false); }" class="close-btn" :aria-label="t('common.close')">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Calendar section (independently scrollable) -->
        <div v-if="calendarMonths.length > 0" class="sidebar-calendar">
          <CalendarWidget
            v-for="cm in calendarMonths"
            :key="`${cm.year}-${cm.month}`"
            :year="cm.year"
            :month="cm.month"
            :entry-dates="cm.dates"
            :selected-date="selectedDate || currentEntry"
            :carnet="carnet"
            :language="language === '_original' ? 'original' : language"
            compact
          />
        </div>

        <!-- Search -->
        <div class="sidebar-search">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('sidebar.searchEntries')"
            class="search-input"
          />
        </div>

        <!-- Entry list (independently scrollable) -->
        <nav class="entry-list">
          <a
            v-for="(entry, index) in filteredEntries"
            :key="entry.date"
            :href="`${basePath}/${carnet}/${entry.date}`"
            class="entry-item"
            :class="{ 'is-current': entry.date === currentEntry }"
          >
            <span class="entry-number">{{ index + 1 }}</span>
            <span class="entry-date">{{ formatDate(entry.date) }}</span>
            <span v-if="entry.title" class="entry-title">{{ entry.title }}</span>
          </a>
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
          <a :href="`${basePath}/${carnet}`" class="back-link">
            ← {{ t('sidebar.backToCarnet') }}
          </a>
        </div>
      </aside>
    </Transition>

    <!-- Backdrop (only when not pinned) -->
    <Transition name="fade">
      <div v-if="isOpen && !isPinned" class="sidebar-backdrop" @click="closeSidebar" />
    </Transition>
  </div>
</template>

<style scoped>
.book-sidebar-wrapper {
  position: relative;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary, #F5E6D3);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.5rem;
  color: var(--text-primary, #2C1810);
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-toggle:hover {
  background: var(--bg-primary, #FFF8F0);
  border-color: var(--color-accent, #B45309);
}

.sidebar-toggle.is-open {
  background: var(--color-accent, #B45309);
  color: white;
  border-color: var(--color-accent, #B45309);
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.entry-counter {
  font-size: 0.75rem;
  opacity: 0.7;
  font-family: monospace;
}

[data-theme="dark"] .sidebar-toggle {
  background: #252525;
  border-color: rgba(255, 255, 255, 0.1);
  color: #e5e5e5;
}

[data-theme="dark"] .sidebar-toggle:hover {
  background: #1a1a1a;
}

.sidebar-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  max-width: 100vw;
  height: 100vh;
  background: var(--bg-primary, #FFF8F0);
  border-right: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-panel.is-pinned {
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .sidebar-panel {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  background: var(--bg-secondary, #F5E6D3);
  flex-shrink: 0;
}

[data-theme="dark"] .sidebar-header {
  background: #252525;
}

.sidebar-header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.sidebar-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #2C1810);
  margin: 0;
}

[data-theme="dark"] .sidebar-title {
  color: #e5e5e5;
}

.pin-btn {
  padding: 0.375rem;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pin-btn:hover {
  color: var(--color-accent, #B45309);
  background: var(--bg-primary, #FFF8F0);
}

.pin-btn.is-pinned {
  color: var(--color-accent, #B45309);
  background: var(--bg-primary, #FFF8F0);
}

[data-theme="dark"] .pin-btn:hover,
[data-theme="dark"] .pin-btn.is-pinned {
  background: #1a1a1a;
  color: #D97706;
}

.close-btn {
  padding: 0.25rem;
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

/* Calendar section */
.sidebar-calendar {
  flex-shrink: 0;
  max-height: 40vh;
  overflow-y: auto;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-search {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background: var(--bg-secondary, #F5E6D3);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.375rem;
  color: var(--text-primary, #2C1810);
  outline: none;
}

.search-input:focus {
  border-color: var(--color-accent, #B45309);
}

.search-input::placeholder {
  color: var(--text-muted, #78716C);
}

[data-theme="dark"] .search-input {
  background: #252525;
  border-color: rgba(255, 255, 255, 0.1);
  color: #e5e5e5;
}

.entry-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  min-height: 0;
}

.entry-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  text-decoration: none;
  color: var(--text-primary, #2C1810);
  transition: background-color 0.2s;
}

.entry-item:hover {
  background: var(--bg-secondary, #F5E6D3);
}

.entry-item.is-current {
  background: var(--color-accent, #B45309);
  color: white;
}

[data-theme="dark"] .entry-item {
  color: #e5e5e5;
}

[data-theme="dark"] .entry-item:hover {
  background: #252525;
}

.entry-number {
  font-size: 0.75rem;
  font-family: monospace;
  opacity: 0.5;
  min-width: 2rem;
}

.entry-date {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.entry-title {
  font-size: 0.8125rem;
  color: var(--text-secondary, #4A3728);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-item.is-current .entry-title {
  color: rgba(255, 255, 255, 0.8);
}

[data-theme="dark"] .entry-title {
  color: #a3a3a3;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  flex-shrink: 0;
}

.back-link {
  font-size: 0.875rem;
  color: var(--color-accent, #B45309);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-accent-light, #D97706);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 90;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
