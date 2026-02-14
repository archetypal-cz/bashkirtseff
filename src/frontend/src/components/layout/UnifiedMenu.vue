<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useI18n, getTranslationHref } from '../../i18n';
import { useFilterStore } from '../../stores/filter';
import { useHistoryStore } from '../../stores/history';
import { trackEvent } from '../../lib/analytics';
import CalendarWidget from '../CalendarWidget.vue';
import type { FilterCategory, FilterTag } from '../../types/filter-index';

const { t, locale } = useI18n();
const currentPath = ref('');
const translationHref = computed(() => getTranslationHref(locale.value, currentPath.value || undefined));
const filterStore = useFilterStore();
const historyStore = useHistoryStore();

// --- Panel state ---
const isOpen = ref(false);
const mounted = ref(false);
const panelRef = ref<HTMLElement | null>(null);

// --- Accordion sections ---
const expandedSections = ref<Set<string>>(new Set());

function toggleSection(section: string) {
  if (expandedSections.value.has(section)) {
    expandedSections.value.delete(section);
  } else {
    expandedSections.value.add(section);
  }
}

// --- Settings state (from ReadingSettings) ---
const fontScale = ref(100);
const theme = ref<'light' | 'sepia' | 'dark'>('light');
const fontScaleDisplay = computed(() => `${fontScale.value}%`);

function applySettings() {
  const scaleMultiplier = fontScale.value / 100;
  document.documentElement.style.setProperty('--reading-font-scale', scaleMultiplier.toString());
  document.documentElement.setAttribute('data-theme', theme.value);
}

function adjustFontSize(delta: number) {
  const newScale = fontScale.value + delta * 5;
  if (newScale >= 80 && newScale <= 130) {
    fontScale.value = newScale;
    trackEvent('font_size_change', { scale: newScale });
  }
}

function setTheme(newTheme: 'light' | 'sepia' | 'dark') {
  theme.value = newTheme;
  trackEvent('theme_change', { theme: newTheme });
}

watch(fontScale, (v) => {
  localStorage.setItem('reading-font-scale', v.toString());
  applySettings();
});

watch(theme, (v) => {
  localStorage.setItem('reading-theme', v);
  applySettings();
});

// --- Sidebar data (from BookSidebar, via window global) ---
interface SidebarEntry {
  date: string;
  title?: string;
}

interface SidebarData {
  carnet: string;
  entries: SidebarEntry[];
  currentEntry: string;
  language: string;
  selectedDate?: string;
}

const sidebarData = ref<SidebarData | null>(null);
const sidebarSearch = ref('');

const filteredEntries = computed(() => {
  if (!sidebarData.value) return [];
  if (!sidebarSearch.value) return sidebarData.value.entries;
  const q = sidebarSearch.value.toLowerCase();
  return sidebarData.value.entries.filter(e =>
    e.date.includes(q) || e.title?.toLowerCase().includes(q)
  );
});

const currentIndex = computed(() => {
  if (!sidebarData.value) return -1;
  return sidebarData.value.entries.findIndex(e => e.date === sidebarData.value!.currentEntry);
});

const sidebarBasePath = computed(() => {
  if (!sidebarData.value) return '';
  return sidebarData.value.language === '_original' ? '/original' : `/${sidebarData.value.language}`;
});

const calendarMonths = computed(() => {
  if (!sidebarData.value) return [];
  const monthMap = new Map<string, { year: number; month: number; dates: string[] }>();
  for (const entry of sidebarData.value.entries) {
    const [year, month] = entry.date.split('-').map(Number);
    const key = `${year}-${month}`;
    if (!monthMap.has(key)) monthMap.set(key, { year, month, dates: [] });
    monthMap.get(key)!.dates.push(entry.date);
  }
  return Array.from(monthMap.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const localeMap: Record<string, string> = { cs: 'cs-CZ', en: 'en-US', fr: 'fr-FR', uk: 'uk-UA' };
  const dateLocale = localeMap[locale.value] || 'en-US';
  return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
}

// --- Filter state (from FilterPanel) ---
const filterSearch = ref('');
const expandedCategories = ref<Set<string>>(new Set());
const expandedSubcategories = ref<Set<string>>(new Set());
const showAllTags = ref<Set<string>>(new Set());
const MAX_VISIBLE_TAGS = 20;

const filteredCategories = computed<FilterCategory[]>(() => {
  if (!filterStore.index) return [];
  const q = filterSearch.value.toLowerCase().trim();
  if (!q) return filterStore.index.categories;
  return filterStore.index.categories
    .map(cat => ({
      ...cat,
      tags: cat.tags.filter(tag =>
        tag.name.toLowerCase().includes(q) || tag.id.toLowerCase().includes(q)
      ),
    }))
    .filter(cat => cat.tags.length > 0);
});

function getSubcategories(tags: FilterTag[]): { name: string; tags: FilterTag[] }[] {
  const groups = new Map<string, FilterTag[]>();
  const ungrouped: FilterTag[] = [];
  for (const tag of tags) {
    if (tag.sub) {
      const group = groups.get(tag.sub) || [];
      group.push(tag);
      groups.set(tag.sub, group);
    } else {
      ungrouped.push(tag);
    }
  }
  const result: { name: string; tags: FilterTag[] }[] = [];
  if (ungrouped.length > 0) result.push({ name: '', tags: ungrouped });
  const sorted = Array.from(groups.entries()).sort((a, b) => {
    const aSum = a[1].reduce((s, t) => s + t.count, 0);
    const bSum = b[1].reduce((s, t) => s + t.count, 0);
    return bSum - aSum;
  });
  for (const [name, tags] of sorted) result.push({ name, tags });
  return result;
}

function isTagSelected(category: string, tagId: string): boolean {
  return filterStore.selectedTags[category]?.includes(tagId) ?? false;
}

function handleFilterToggle(category: string, tagId: string) {
  filterStore.toggleTag(category, tagId);
  trackEvent('filter_tag_toggle', {
    category,
    tagId,
    active: isTagSelected(category, tagId),
  });
}

function toggleCategory(key: string) {
  if (expandedCategories.value.has(key)) expandedCategories.value.delete(key);
  else expandedCategories.value.add(key);
}

function toggleSubcategory(key: string) {
  if (expandedSubcategories.value.has(key)) expandedSubcategories.value.delete(key);
  else expandedSubcategories.value.add(key);
}

function formatSubcategoryName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
}

function sortTagsSelectedFirst(categoryKey: string, tags: FilterTag[]): FilterTag[] {
  // Extract the base category key (strip subcategory prefix like "places:Cities")
  const baseCat = categoryKey.includes(':') ? categoryKey.split(':')[0] : categoryKey;
  const selected = filterStore.selectedTags[baseCat] || [];
  if (selected.length === 0) return tags;
  // Use both exact and case-insensitive matching (filter store uses ciHas for matching)
  const exactSet = new Set(selected);
  const lowerSet = new Set(selected.map(s => s.toLowerCase()));
  return [...tags].sort((a, b) => {
    const aSelected = exactSet.has(a.id) || lowerSet.has(a.id.toLowerCase());
    const bSelected = exactSet.has(b.id) || lowerSet.has(b.id.toLowerCase());
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0; // preserve original order within each group
  });
}

function getVisibleTags(categoryKey: string, tags: FilterTag[]): FilterTag[] {
  const sorted = sortTagsSelectedFirst(categoryKey, tags);
  if (showAllTags.value.has(categoryKey) || filterSearch.value) return sorted;
  return sorted.slice(0, MAX_VISIBLE_TAGS);
}

function toggleShowAll(categoryKey: string) {
  if (showAllTags.value.has(categoryKey)) showAllTags.value.delete(categoryKey);
  else showAllTags.value.add(categoryKey);
}

function categoryHasActive(key: string): boolean {
  return (filterStore.selectedTags[key]?.length ?? 0) > 0;
}

function getSelectedTagNames(categoryKey: string): string[] {
  const selectedIds = filterStore.selectedTags[categoryKey] || [];
  if (selectedIds.length === 0 || !filterStore.index) return [];
  const category = filterStore.index.categories.find(c => c.key === categoryKey);
  if (!category) return [];
  const idSet = new Set(selectedIds);
  return category.tags
    .filter(tag => idSet.has(tag.id))
    .map(tag => tag.name);
}

/** All active tag names across all categories, for the filter section header */
const allActiveTagNames = computed<string[]>(() => {
  if (!filterStore.isActive || !filterStore.index) return [];
  const names: string[] = [];
  for (const [catKey, ids] of Object.entries(filterStore.selectedTags)) {
    if (ids.length === 0) continue;
    const category = filterStore.index.categories.find(c => c.key === catKey);
    if (!category) continue;
    const idSet = new Set(ids);
    for (const tag of category.tags) {
      if (idSet.has(tag.id)) names.push(tag.name);
    }
  }
  return names;
});

/** Get FilterTag objects for active tags in a category (for showing when collapsed) */
function getActiveTagObjects(categoryKey: string): FilterTag[] {
  const selectedIds = filterStore.selectedTags[categoryKey] || [];
  if (selectedIds.length === 0 || !filterStore.index) return [];
  const category = filterStore.index.categories.find(c => c.key === categoryKey);
  if (!category) return [];
  const idSet = new Set(selectedIds);
  return category.tags.filter(tag => idSet.has(tag.id));
}

const matchingCount = computed(() => filterStore.matchingEntries.length);

/** True when 2+ categories have selected tags (AND/OR toggle is relevant) */
const multiCategoryActive = computed(() =>
  Object.values(filterStore.selectedTags).filter(tags => tags.length > 0).length >= 2
);

// --- Panel open/close ---
function togglePanel() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    filterStore.loadIndex();
    // Auto-expand nav section on narrow screens (where desktop nav is hidden)
    if (window.innerWidth < 768) {
      expandedSections.value.add('nav');
    }
    // Auto-expand filter section if filter is active
    if (filterStore.isActive) {
      expandedSections.value.add('filter');
      for (const [key, tags] of Object.entries(filterStore.selectedTags)) {
        if (tags.length > 0) expandedCategories.value.add(key);
      }
    }
    expandedCategories.value.add('editions');
  }
}

function closePanel() {
  isOpen.value = false;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) closePanel();
}

function onClickOutside(e: MouseEvent) {
  if (!isOpen.value) return;
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    const btn = document.querySelector('.unified-menu-toggle');
    if (btn?.contains(e.target as Node)) return;
    closePanel();
  }
}

// --- Lifecycle ---
onMounted(() => {
  mounted.value = true;
  currentPath.value = window.location.pathname;

  // Load settings
  const savedFontScale = localStorage.getItem('reading-font-scale');
  const savedTheme = localStorage.getItem('reading-theme');
  if (savedFontScale) fontScale.value = parseInt(savedFontScale, 10);
  if (savedTheme) theme.value = savedTheme as 'light' | 'sepia' | 'dark';
  applySettings();

  // Load sidebar data from window global (set by entry pages)
  const win = window as any;
  if (win.__sidebarData) {
    sidebarData.value = win.__sidebarData;
    // Auto-expand contents section when sidebar data is available
    expandedSections.value.add('contents');
  }

  // Init filter store
  filterStore.init();

  // Init history store
  historyStore.init();

  // Event listeners
  document.addEventListener('keydown', onKeydown);
  nextTick(() => {
    document.addEventListener('click', onClickOutside, true);
  });
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('click', onClickOutside, true);
});
</script>

<template>
  <div class="unified-menu-wrapper">
    <!-- Toggle button: pill with hamburger + filter icon -->
    <button
      class="unified-menu-toggle"
      :class="{ 'is-open': isOpen, 'has-filter': filterStore.isActive }"
      @click="togglePanel"
      :aria-expanded="isOpen"
      :aria-label="filterStore.isActive
        ? `Menu (${filterStore.activeTagCount} ${t('filter.entries')})`
        : 'Menu'"
    >
      <!-- Hamburger icon -->
      <svg class="toggle-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <!-- Divider + filter funnel (only when filter active) -->
      <template v-if="filterStore.isActive">
        <span class="toggle-divider" />
        <span class="toggle-filter active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span class="filter-dot">{{ filterStore.activeTagCount }}</span>
        </span>
      </template>
    </button>

    <!-- Panel (teleported to body) -->
    <Teleport to="body" :disabled="!mounted">
      <Transition name="um-slide">
        <div v-if="isOpen" class="um-backdrop" @click="closePanel">
          <div ref="panelRef" class="um-panel" @click.stop>
            <!-- Panel header -->
            <div class="um-header">
              <span class="um-title">{{ t('common.menu') }}</span>
              <button class="um-close" @click="closePanel" :aria-label="t('common.close')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Scrollable content -->
            <div class="um-body">

              <!-- ═══ NAVIGATION SECTION (narrow screens only) ═══ -->
              <div class="um-section um-nav-section">
                <button class="um-section-header" @click="toggleSection('nav')">
                  <span class="um-section-label">
                    <svg class="um-chevron" :class="{ expanded: expandedSections.has('nav') }"
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {{ t('common.navigation') }}
                  </span>
                </button>
                <div v-if="expandedSections.has('nav')" class="um-section-body um-nav-body">
                  <nav class="um-nav-links">
                    <a :href="translationHref" class="um-nav-link" @click="closePanel">
                      <svg class="um-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {{ t('nav.translation') }}
                    </a>
                    <a href="/original" class="um-nav-link" @click="closePanel">
                      <svg class="um-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      {{ t('nav.original') }}
                    </a>
                    <a href="/glossary" class="um-nav-link" @click="closePanel">
                      <svg class="um-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ t('nav.glossary') }}
                    </a>
                    <a href="/marie" class="um-nav-link" @click="closePanel">
                      <svg class="um-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ t('nav.marie') }}
                    </a>
                    <a href="/about" class="um-nav-link" @click="closePanel">
                      <svg class="um-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ t('nav.about') }}
                    </a>
                  </nav>
                </div>
              </div>

              <!-- ═══ SETTINGS SECTION ═══ -->
              <div class="um-section">
                <button class="um-section-header" @click="toggleSection('settings')">
                  <span class="um-section-label">
                    <svg class="um-chevron" :class="{ expanded: expandedSections.has('settings') }"
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {{ t('reading.settings') }}
                  </span>
                  <span class="um-section-badge settings-preview">
                    {{ fontScaleDisplay }}
                  </span>
                </button>
                <div v-if="expandedSections.has('settings')" class="um-section-body">
                  <!-- Font size -->
                  <div class="setting-group">
                    <label class="setting-label">{{ t('reading.fontSize') }}</label>
                    <div class="font-size-controls">
                      <button
                        @click="adjustFontSize(-1)"
                        :disabled="fontScale <= 80"
                        class="font-btn"
                        :aria-label="t('reading.decreaseFont')"
                      >A-</button>
                      <span class="font-size-value">{{ fontScaleDisplay }}</span>
                      <button
                        @click="adjustFontSize(1)"
                        :disabled="fontScale >= 130"
                        class="font-btn"
                        :aria-label="t('reading.increaseFont')"
                      >A+</button>
                    </div>
                  </div>
                  <!-- Theme -->
                  <div class="setting-group">
                    <label class="setting-label">{{ t('reading.theme') }}</label>
                    <div class="theme-controls">
                      <button @click="setTheme('light')" :class="{ active: theme === 'light' }"
                        class="theme-btn theme-light" :aria-label="t('reading.lightTheme')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </button>
                      <button @click="setTheme('sepia')" :class="{ active: theme === 'sepia' }"
                        class="theme-btn theme-sepia" :aria-label="t('reading.sepiaTheme')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </button>
                      <button @click="setTheme('dark')" :class="{ active: theme === 'dark' }"
                        class="theme-btn theme-dark" :aria-label="t('reading.darkTheme')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ═══ HISTORY SECTION ═══ -->
              <div v-if="!historyStore.isEmpty" class="um-section">
                <button class="um-section-header" @click="toggleSection('history')">
                  <span class="um-section-label">
                    <svg class="um-chevron" :class="{ expanded: expandedSections.has('history') }"
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {{ t('history.title') }}
                  </span>
                  <span class="um-section-badge">
                    {{ historyStore.count }}
                  </span>
                </button>
                <div v-if="expandedSections.has('history')" class="um-section-body history-body">
                  <nav class="history-list">
                    <a
                      v-for="item in historyStore.items"
                      :key="item.type + '-' + (item.paragraphId || item.glossaryId)"
                      :href="item.url"
                      class="history-item"
                      @click="closePanel"
                    >
                      <template v-if="item.type === 'paragraph'">
                        <span class="history-carnet">{{ item.carnet }}</span>
                        <span class="history-date">{{ item.entryDate }}</span>
                        <span class="history-label">{{ item.label }}</span>
                      </template>
                      <template v-else>
                        <span class="history-glossary-icon">
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <span class="history-glossary-name">{{ item.glossaryName || item.glossaryId }}</span>
                        <span class="history-glossary-badge">{{ t('history.glossaryLabel') }}</span>
                      </template>
                    </a>
                  </nav>
                  <div class="history-footer">
                    <button class="history-clear" @click="historyStore.clear()">
                      {{ t('history.clear') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- ═══ CONTENTS SECTION (entry pages only) ═══ -->
              <div v-if="sidebarData" class="um-section">
                <button class="um-section-header" @click="toggleSection('contents')">
                  <span class="um-section-label">
                    <svg class="um-chevron" :class="{ expanded: expandedSections.has('contents') }"
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {{ t('sidebar.contents') }}
                    <span class="contents-carnet">{{ sidebarData.carnet }}</span>
                  </span>
                  <span class="um-section-badge">
                    {{ currentIndex + 1 }}/{{ sidebarData.entries.length }}
                  </span>
                </button>
                <div v-if="expandedSections.has('contents')" class="um-section-body contents-body">
                  <!-- Calendar -->
                  <div v-if="calendarMonths.length > 0" class="contents-calendar">
                    <CalendarWidget
                      v-for="cm in calendarMonths"
                      :key="`${cm.year}-${cm.month}`"
                      :year="cm.year"
                      :month="cm.month"
                      :entry-dates="cm.dates"
                      :selected-date="sidebarData.selectedDate || sidebarData.currentEntry"
                      :carnet="sidebarData.carnet"
                      :language="sidebarData.language === '_original' ? 'original' : sidebarData.language"
                      compact
                    />
                  </div>
                  <!-- Search -->
                  <div class="contents-search">
                    <input
                      v-model="sidebarSearch"
                      type="text"
                      :placeholder="t('sidebar.searchEntries')"
                      class="um-search-input"
                    />
                  </div>
                  <!-- Entry list -->
                  <nav class="contents-list">
                    <a
                      v-for="(entry, index) in filteredEntries"
                      :key="entry.date"
                      :href="`${sidebarBasePath}/${sidebarData.carnet}/${entry.date}`"
                      class="contents-entry"
                      :class="{ 'is-current': entry.date === sidebarData.currentEntry }"
                    >
                      <span class="entry-number">{{ index + 1 }}</span>
                      <span class="entry-date">{{ formatDate(entry.date) }}</span>
                      <span v-if="entry.title" class="entry-title">{{ entry.title }}</span>
                    </a>
                  </nav>
                  <!-- Footer -->
                  <div class="contents-footer">
                    <a :href="`${sidebarBasePath}/${sidebarData.carnet}`" class="back-link">
                      ← {{ t('sidebar.backToCarnet') }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- ═══ FILTER SECTION ═══ -->
              <div class="um-section">
                <button class="um-section-header" @click="toggleSection('filter')">
                  <span class="um-section-label">
                    <svg class="um-chevron" :class="{ expanded: expandedSections.has('filter') }"
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {{ t('filter.title') }}
                  </span>
                  <span class="um-section-actions">
                    <span v-if="filterStore.isActive" class="filter-header-names">
                      {{ multiCategoryActive
                        ? allActiveTagNames.join(filterStore.filterMode === 'and' ? ` ${t('filter.and')} ` : ` ${t('filter.or')} `)
                        : allActiveTagNames.join(', ') }}
                    </span>
                    <span v-if="filterStore.isActive" class="filter-active-count">
                      {{ filterStore.activeTagCount }}
                    </span>
                  </span>
                </button>
                <div v-if="expandedSections.has('filter')" class="um-section-body filter-body">
                  <!-- Filter search -->
                  <div class="filter-search">
                    <input
                      v-model="filterSearch"
                      type="text"
                      :placeholder="t('filter.search')"
                      class="um-search-input"
                    />
                  </div>

                  <!-- AND/OR toggle (only when 2+ categories active) -->
                  <div v-if="multiCategoryActive" class="filter-mode-toggle">
                    <button
                      class="mode-btn"
                      :class="{ active: filterStore.filterMode === 'and' }"
                      @click="filterStore.setFilterMode('and')"
                    >{{ t('filter.modeAnd') }}</button>
                    <button
                      class="mode-btn"
                      :class="{ active: filterStore.filterMode === 'or' }"
                      @click="filterStore.setFilterMode('or')"
                    >{{ t('filter.modeOr') }}</button>
                  </div>

                  <!-- Active summary -->
                  <div v-if="filterStore.isActive" class="filter-active-summary">
                    <span class="filter-active-text">
                      {{ matchingCount.toLocaleString() }} {{ t('filter.of') }} {{ filterStore.index?.totalEntries.toLocaleString() }} {{ t('filter.entries') }}
                      <span v-if="multiCategoryActive" class="filter-mode-indicator">
                        ({{ filterStore.filterMode === 'and' ? t('filter.modeAnd') : t('filter.modeOr') }})
                      </span>
                    </span>
                    <button class="filter-clear-all" @click="filterStore.clearAll()">
                      {{ t('filter.clearAll') }}
                    </button>
                  </div>

                  <!-- Loading -->
                  <div v-if="filterStore.loading" class="filter-loading">
                    {{ t('filter.loading') }}
                  </div>

                  <!-- Categories -->
                  <div v-else class="filter-categories">
                    <div
                      v-for="category in filteredCategories"
                      :key="category.key"
                      class="filter-category"
                    >
                      <button class="filter-category-header" @click="toggleCategory(category.key)">
                        <span class="filter-category-label">
                          <svg class="um-chevron small"
                            :class="{ expanded: expandedCategories.has(category.key) }"
                            width="12" height="12" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          {{ category.label.startsWith('filter.') ? t(category.label) : category.label }}
                        </span>
                        <span class="filter-category-actions">
                          <span v-if="categoryHasActive(category.key)" class="active-tag-names">
                            {{ getSelectedTagNames(category.key).join(', ') }}
                          </span>
                          <span v-if="categoryHasActive(category.key)" class="active-count">
                            {{ filterStore.selectedTags[category.key]?.length }}
                          </span>
                          <button
                            v-if="categoryHasActive(category.key)"
                            class="clear-category-btn"
                            @click.stop="filterStore.clearCategory(category.key)"
                            :title="t('filter.clearCategory')"
                          >&times;</button>
                        </span>
                      </button>

                      <!-- Active tags shown even when category is collapsed -->
                      <div v-if="!expandedCategories.has(category.key) && categoryHasActive(category.key)"
                        class="filter-category-active-tags">
                        <label
                          v-for="tag in getActiveTagObjects(category.key)"
                          :key="tag.id"
                          class="filter-tag selected"
                        >
                          <input type="checkbox"
                            checked
                            @change="handleFilterToggle(category.key, tag.id)"
                            class="tag-checkbox"
                          />
                          <span class="tag-name">{{ tag.name }}</span>
                          <span class="tag-count">{{ tag.count.toLocaleString('cs-CZ') }}</span>
                        </label>
                      </div>

                      <div v-if="expandedCategories.has(category.key)" class="filter-category-body">
                        <!-- Simple categories (flat list) -->
                        <template v-if="!category.tags.some(t => t.sub)">
                          <label
                            v-for="tag in getVisibleTags(category.key, category.tags)"
                            :key="tag.id"
                            class="filter-tag"
                            :class="{ selected: isTagSelected(category.key, tag.id) }"
                          >
                            <input type="checkbox"
                              :checked="isTagSelected(category.key, tag.id)"
                              @change="handleFilterToggle(category.key, tag.id)"
                              class="tag-checkbox"
                            />
                            <span class="tag-name">{{ tag.name }}</span>
                            <span class="tag-count">{{ tag.count.toLocaleString('cs-CZ') }}</span>
                          </label>
                          <button
                            v-if="category.tags.length > MAX_VISIBLE_TAGS && !filterSearch"
                            class="show-more-btn"
                            @click="toggleShowAll(category.key)"
                          >
                            {{ showAllTags.has(category.key)
                              ? t('filter.showLess')
                              : t('filter.showMore').replace('{count}', String(category.tags.length - MAX_VISIBLE_TAGS)) }}
                          </button>
                        </template>

                        <!-- Subcategorized tags -->
                        <template v-else>
                          <div
                            v-for="sub in getSubcategories(category.tags)"
                            :key="sub.name || '_ungrouped'"
                            class="filter-subcategory"
                          >
                            <button
                              v-if="sub.name"
                              class="filter-subcategory-header"
                              @click="toggleSubcategory(`${category.key}:${sub.name}`)"
                            >
                              <svg class="um-chevron small"
                                :class="{ expanded: expandedSubcategories.has(`${category.key}:${sub.name}`) }"
                                width="12" height="12" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                              {{ formatSubcategoryName(sub.name) }}
                              <span class="subcategory-count">({{ sub.tags.length }})</span>
                            </button>
                            <div v-if="!sub.name || expandedSubcategories.has(`${category.key}:${sub.name}`)"
                              class="filter-subcategory-body">
                              <label
                                v-for="tag in getVisibleTags(`${category.key}:${sub.name}`, sub.tags)"
                                :key="tag.id"
                                class="filter-tag"
                                :class="{ selected: isTagSelected(category.key, tag.id) }"
                              >
                                <input type="checkbox"
                                  :checked="isTagSelected(category.key, tag.id)"
                                  @change="handleFilterToggle(category.key, tag.id)"
                                  class="tag-checkbox"
                                />
                                <span class="tag-name">{{ tag.name }}</span>
                                <span class="tag-count">{{ tag.count.toLocaleString('cs-CZ') }}</span>
                              </label>
                              <button
                                v-if="sub.tags.length > MAX_VISIBLE_TAGS && !filterSearch"
                                class="show-more-btn"
                                @click="toggleShowAll(`${category.key}:${sub.name}`)"
                              >
                                {{ showAllTags.has(`${category.key}:${sub.name}`)
                                  ? t('filter.showLess')
                                  : t('filter.showMore').replace('{count}', String(sub.tags.length - MAX_VISIBLE_TAGS)) }}
                              </button>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ═══ Toggle button (pill shape) ═══ */
.unified-menu-wrapper {
  position: relative;
}

.unified-menu-toggle {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  height: 36px;
  border-radius: 18px;
  border: 1px solid rgba(44, 24, 16, 0.15);
  background: linear-gradient(180deg, var(--bg-primary, #FFF8F0) 0%, var(--bg-secondary, #F5E6D3) 100%);
  color: var(--text-secondary, #4A3728);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0 10px;
  box-shadow: 0 1px 3px rgba(44, 24, 16, 0.08), 0 1px 2px rgba(44, 24, 16, 0.04);
}

.unified-menu-toggle:hover {
  color: var(--text-primary, #2C1810);
  border-color: var(--color-accent, #B45309);
  box-shadow: 0 2px 8px rgba(44, 24, 16, 0.12);
}

.unified-menu-toggle.has-filter {
  border-color: color-mix(in srgb, var(--color-accent, #B45309) 40%, transparent);
  box-shadow: 0 1px 4px rgba(180, 83, 9, 0.12), 0 1px 2px rgba(44, 24, 16, 0.04);
}

.unified-menu-toggle.is-open {
  background: linear-gradient(180deg, var(--color-accent-light, #D97706) 0%, var(--color-accent, #B45309) 100%);
  color: white;
  border-color: var(--color-accent, #B45309);
  box-shadow: 0 2px 8px rgba(180, 83, 9, 0.25);
}

.unified-menu-toggle.is-open .toggle-divider {
  background: rgba(255, 255, 255, 0.3);
}

.unified-menu-toggle.is-open .toggle-filter {
  color: white;
}

[data-theme="dark"] .unified-menu-toggle {
  background: linear-gradient(180deg, #2a2a2a 0%, #1e1e1e 100%);
  border-color: rgba(255, 255, 255, 0.12);
  color: #b0b0b0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .unified-menu-toggle:hover {
  color: #e5e5e5;
  border-color: var(--color-accent, #D97706);
}

[data-theme="dark"] .unified-menu-toggle.is-open {
  background: linear-gradient(180deg, #D97706 0%, #B45309 100%);
}

[data-theme="sepia"] .unified-menu-toggle {
  background: linear-gradient(180deg, #F5E6D3 0%, #EBD9C4 100%);
  border-color: rgba(44, 24, 16, 0.18);
}

.toggle-icon {
  flex-shrink: 0;
}

.toggle-divider {
  width: 1px;
  height: 18px;
  background: var(--border-color, rgba(44, 24, 16, 0.15));
  margin: 0 7px;
  flex-shrink: 0;
}

.toggle-filter {
  position: relative;
  display: flex;
  align-items: center;
  color: var(--text-muted, #78716C);
  transition: color 0.2s;
}

.toggle-filter.active {
  color: var(--color-accent, #B45309);
}

.unified-menu-toggle.is-open .toggle-filter.active {
  color: white;
}

.filter-dot {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background: var(--color-accent, #B45309);
  color: white;
  font-size: 9px;
  font-weight: 700;
  font-family: var(--font-sans);
  line-height: 14px;
  text-align: center;
}

.unified-menu-toggle.is-open .filter-dot {
  background: white;
  color: var(--color-accent, #B45309);
}

/* ═══ Backdrop ═══ */
.um-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, 0.3);
}

@media (min-width: 768px) {
  .um-backdrop {
    background: transparent;
  }
}

/* ═══ Panel ═══ */
.um-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 340px;
  max-width: 90vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #FFF8F0);
  border-left: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
  z-index: 91;
  overflow: hidden;
}

@media (min-width: 768px) {
  .um-panel {
    top: 56px;
    right: 16px;
    width: 380px;
    height: calc(100vh - 72px);
    border-radius: 12px;
    border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
}

[data-theme="dark"] .um-panel {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="sepia"] .um-panel {
  background: #F5E6D3;
}

/* ═══ Panel header ═══ */
.um-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  flex-shrink: 0;
}

.um-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #2C1810);
  font-family: var(--font-sans);
}

[data-theme="dark"] .um-title {
  color: #e5e5e5;
}

.um-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-muted, #78716C);
  cursor: pointer;
  border-radius: 6px;
}

.um-close:hover {
  background: var(--bg-secondary, #F5E6D3);
  color: var(--text-primary, #2C1810);
}

/* ═══ Scrollable body ═══ */
.um-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* ═══ Accordion sections ═══ */
.um-section {
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.um-section:last-child {
  border-bottom: none;
}

.um-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;
}

.um-section-header:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .um-section-header:hover {
  background: #252525;
}

.um-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted, #78716C);
  font-family: var(--font-sans);
}

.um-section-badge {
  font-size: 12px;
  color: var(--text-muted, #78716C);
  font-family: monospace;
}

.um-section-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.settings-preview {
  font-family: monospace;
  opacity: 0.7;
}

.contents-carnet {
  font-family: monospace;
  font-weight: 400;
  font-size: 12px;
  opacity: 0.7;
  margin-left: 2px;
}

.um-section-body {
  padding: 8px 16px 12px;
}

/* ═══ Chevron ═══ */
.um-chevron {
  transition: transform 0.2s;
  flex-shrink: 0;
}

.um-chevron.expanded {
  transform: rotate(90deg);
}

.um-chevron.small {
  width: 12px;
  height: 12px;
}

/* ═══ Settings controls ═══ */
.setting-group {
  margin-bottom: 12px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #6b7280);
  margin-bottom: 6px;
  font-family: var(--font-sans);
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 6px;
  background: var(--bg-secondary, #F5E6D3);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary, #2C1810);
  transition: all 0.2s;
}

[data-theme="dark"] .font-btn {
  background: #2a2a2a;
  color: #e5e5e5;
  border-color: rgba(255, 255, 255, 0.1);
}

.font-btn:hover:not(:disabled) {
  background: var(--color-accent, #B45309);
  color: white;
  border-color: var(--color-accent, #B45309);
}

.font-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.font-size-value {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: var(--text-primary, #2C1810);
  font-family: monospace;
}

[data-theme="dark"] .font-size-value {
  color: #e5e5e5;
}

.theme-controls {
  display: flex;
  gap: 6px;
}

.theme-btn {
  flex: 1;
  height: 2.25rem;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.theme-btn.active {
  border-color: var(--color-accent, #B45309);
}

.theme-light {
  background: #ffffff;
  color: #2C1810;
  border-color: rgba(44, 24, 16, 0.15);
}

.theme-sepia {
  background: #F5E6D3;
  color: #2C1810;
  border-color: rgba(44, 24, 16, 0.15);
}

.theme-dark {
  background: #1a1a1a;
  color: #e5e5e5;
  border-color: rgba(255, 255, 255, 0.15);
}

/* ═══ Contents section ═══ */
.contents-body {
  padding: 0 !important;
}

.contents-calendar {
  max-height: 35vh;
  overflow-y: auto;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contents-search {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.um-search-input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 6px;
  background: var(--bg-secondary, #F5E6D3);
  color: var(--text-primary, #2C1810);
  font-size: 13px;
  font-family: var(--font-sans);
  outline: none;
  transition: border-color 0.2s;
}

.um-search-input:focus {
  border-color: var(--color-accent, #B45309);
}

.um-search-input::placeholder {
  color: var(--text-muted, #78716C);
}

[data-theme="dark"] .um-search-input {
  background: #252525;
  border-color: rgba(255, 255, 255, 0.1);
  color: #e5e5e5;
}

.contents-list {
  max-height: 40vh;
  overflow-y: auto;
  padding: 4px 8px;
}

.contents-entry {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 4px;
  text-decoration: none;
  color: var(--text-primary, #2C1810);
  transition: background-color 0.15s;
  font-size: 13px;
}

.contents-entry:hover {
  background: var(--bg-secondary, #F5E6D3);
}

.contents-entry.is-current {
  background: var(--color-accent, #B45309);
  color: white;
}

[data-theme="dark"] .contents-entry {
  color: #e5e5e5;
}

[data-theme="dark"] .contents-entry:hover {
  background: #252525;
}

.entry-number {
  font-size: 11px;
  font-family: monospace;
  opacity: 0.5;
  min-width: 1.75rem;
}

.entry-date {
  font-weight: 500;
  white-space: nowrap;
}

.entry-title {
  font-size: 12px;
  color: var(--text-muted, #78716C);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contents-entry.is-current .entry-title {
  color: rgba(255, 255, 255, 0.8);
}

[data-theme="dark"] .entry-title {
  color: #a3a3a3;
}

.contents-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.back-link {
  font-size: 13px;
  color: var(--color-accent, #B45309);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-accent-light, #D97706);
}

/* ═══ Filter section ═══ */
.filter-body {
  padding: 0 !important;
}

.filter-search {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.filter-mode-toggle {
  display: flex;
  gap: 4px;
  padding: 6px 16px;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.mode-btn {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted, #78716C);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all 0.15s;
  text-align: center;
}

.mode-btn.active {
  background: var(--color-accent, #B45309);
  color: white;
  border-color: var(--color-accent, #B45309);
}

.mode-btn:hover:not(.active) {
  border-color: var(--color-accent, #B45309);
  color: var(--color-accent, #B45309);
}

[data-theme="dark"] .mode-btn {
  border-color: rgba(255, 255, 255, 0.15);
  color: #a3a3a3;
}

[data-theme="dark"] .mode-btn.active {
  background: var(--color-accent, #D97706);
  border-color: var(--color-accent, #D97706);
  color: white;
}

.filter-mode-indicator {
  opacity: 0.7;
  font-weight: 400;
}

.filter-active-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: color-mix(in srgb, var(--color-accent, #B45309) 8%, var(--bg-primary, #FFF8F0));
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.filter-active-text {
  font-size: 12px;
  color: var(--color-accent, #B45309);
  font-weight: 500;
  font-family: var(--font-sans);
}

.filter-clear-all {
  font-size: 11px;
  color: var(--color-accent, #B45309);
  background: transparent;
  border: 1px solid var(--color-accent, #B45309);
  border-radius: 4px;
  padding: 1px 6px;
  cursor: pointer;
  font-family: var(--font-sans);
}

.filter-clear-all:hover {
  background: var(--color-accent, #B45309);
  color: white;
}

.filter-loading {
  padding: 20px;
  text-align: center;
  color: var(--text-muted, #78716C);
  font-size: 13px;
}

.filter-active-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--color-accent, #B45309);
  color: white;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-sans);
}

.filter-categories {
  padding: 2px 0;
}

.filter-category {
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.filter-category:last-child {
  border-bottom: none;
}

.filter-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;
}

.filter-category-header:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .filter-category-header:hover {
  background: #252525;
}

.filter-category-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #78716C);
  font-family: var(--font-sans);
}

.filter-category-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.active-tag-names {
  font-size: 10px;
  color: var(--color-accent, #B45309);
  font-family: var(--font-sans);
  font-weight: 500;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-header-names {
  font-size: 11px;
  color: var(--color-accent, #B45309);
  font-family: var(--font-sans);
  font-weight: 500;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-accent, #B45309);
  color: white;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--font-sans);
}

.clear-category-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted, #78716C);
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
}

.clear-category-btn:hover {
  background: var(--bg-secondary, #F5E6D3);
  color: var(--text-primary, #2C1810);
}

.filter-category-active-tags {
  padding: 2px 8px 4px;
  border-top: 1px dashed var(--border-color, rgba(44, 24, 16, 0.08));
}

.filter-category-body {
  padding: 0 8px 6px;
}

.filter-subcategory {
  margin-bottom: 1px;
}

.filter-subcategory-header {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 3px 8px;
  border: none;
  background: transparent;
  color: var(--text-muted, #78716C);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-sans);
  border-radius: 4px;
}

.filter-subcategory-header:hover {
  background: var(--bg-secondary, #F5E6D3);
}

.subcategory-count {
  color: var(--text-muted, #78716C);
  opacity: 0.6;
}

.filter-subcategory-body {
  padding-left: 4px;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.1s;
}

.filter-tag:hover {
  background: var(--bg-secondary, #F5E6D3);
}

.filter-tag.selected {
  background: color-mix(in srgb, var(--color-accent, #B45309) 10%, var(--bg-primary, #FFF8F0));
}

.tag-checkbox {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  accent-color: var(--color-accent, #B45309);
  cursor: pointer;
}

.tag-name {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary, #2C1810);
  font-family: var(--font-sans);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme="dark"] .tag-name {
  color: #e5e5e5;
}

.tag-count {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted, #78716C);
  font-family: var(--font-sans);
}

.show-more-btn {
  display: block;
  width: 100%;
  padding: 3px 8px;
  margin-top: 1px;
  border: none;
  background: transparent;
  color: var(--color-accent, #B45309);
  font-size: 11px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-sans);
  border-radius: 4px;
}

.show-more-btn:hover {
  background: var(--bg-secondary, #F5E6D3);
}

/* ═══ History section ═══ */
.history-body {
  padding: 0 !important;
}

.history-list {
  max-height: 30vh;
  overflow-y: auto;
  padding: 4px 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 4px;
  text-decoration: none;
  color: var(--text-primary, #2C1810);
  transition: background-color 0.15s;
  font-size: 13px;
}

.history-item:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .history-item {
  color: #e5e5e5;
}

[data-theme="dark"] .history-item:hover {
  background: #252525;
}

.history-carnet {
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  color: var(--color-accent, #B45309);
  min-width: 1.75rem;
  flex-shrink: 0;
}

.history-date {
  font-size: 11px;
  font-family: monospace;
  color: var(--text-muted, #78716C);
  white-space: nowrap;
  flex-shrink: 0;
}

.history-label {
  font-size: 12px;
  color: var(--text-secondary, #4A3728);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

[data-theme="dark"] .history-label {
  color: #a3a3a3;
}

.history-glossary-icon {
  display: flex;
  align-items: center;
  color: var(--color-accent, #B45309);
  flex-shrink: 0;
}

.history-glossary-name {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-glossary-badge {
  font-size: 10px;
  color: var(--text-muted, #78716C);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.history-footer {
  padding: 6px 16px 8px;
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.history-clear {
  font-size: 11px;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 0;
  font-family: var(--font-sans);
}

.history-clear:hover {
  color: var(--color-accent, #B45309);
}

/* ═══ Navigation section (narrow screens only) ═══ */
.um-nav-section {
  display: block;
}

@media (min-width: 768px) {
  .um-nav-section {
    display: none;
  }
}

.um-nav-body {
  padding: 4px 8px 8px !important;
}

.um-nav-links {
  display: flex;
  flex-direction: column;
}

.um-nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--text-primary, #2C1810);
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-sans);
  transition: background-color 0.15s;
}

.um-nav-link:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .um-nav-link {
  color: #e5e5e5;
}

[data-theme="dark"] .um-nav-link:hover {
  background: #252525;
}

.um-nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--text-muted, #78716C);
}
</style>

<!-- Transition CSS must be unscoped to work with Teleport to body -->
<style>
.um-slide-enter-active,
.um-slide-leave-active {
  transition: opacity 0.2s ease;
}

.um-slide-enter-active .um-panel,
.um-slide-leave-active .um-panel {
  transition: transform 0.25s ease;
}

.um-slide-enter-from,
.um-slide-leave-to {
  opacity: 0;
}

.um-slide-enter-from .um-panel,
.um-slide-leave-to .um-panel {
  transform: translateX(100%);
}
</style>
