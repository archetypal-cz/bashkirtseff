<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useFilterStore } from '../../stores/filter';
import { useI18n } from '../../i18n';
import type { FilterCategory, FilterTag } from '../../types/filter-index';

const emit = defineEmits<{ close: [] }>();
const filterStore = useFilterStore();
const { t } = useI18n();

const searchQuery = ref('');
const expandedCategories = ref<Set<string>>(new Set());
const expandedSubcategories = ref<Set<string>>(new Set());
const showAllTags = ref<Set<string>>(new Set()); // category keys with "show all" enabled
const panelRef = ref<HTMLElement | null>(null);
const MAX_VISIBLE_TAGS = 20;

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}

// Close on click outside
function onClickOutside(e: MouseEvent) {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    // Don't close if clicking the filter button itself
    const btn = document.querySelector('.filter-button-wrapper');
    if (btn?.contains(e.target as Node)) return;
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  // Delay adding click listener to avoid immediate close
  nextTick(() => {
    document.addEventListener('click', onClickOutside, true);
  });

  // Auto-expand categories that have active tags
  for (const [key, tags] of Object.entries(filterStore.selectedTags)) {
    if (tags.length > 0) expandedCategories.value.add(key);
  }
  // Always expand editions
  expandedCategories.value.add('editions');
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('click', onClickOutside, true);
});

// Filtered categories based on search
const filteredCategories = computed<FilterCategory[]>(() => {
  if (!filterStore.index) return [];
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return filterStore.index.categories;

  return filterStore.index.categories
    .map(cat => ({
      ...cat,
      tags: cat.tags.filter(tag =>
        tag.name.toLowerCase().includes(q) ||
        tag.id.toLowerCase().includes(q)
      ),
    }))
    .filter(cat => cat.tags.length > 0);
});

// Group tags by subcategory
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

  // Ungrouped first
  if (ungrouped.length > 0) {
    result.push({ name: '', tags: ungrouped });
  }

  // Then subcategories sorted by total count
  const sorted = Array.from(groups.entries())
    .sort((a, b) => {
      const aSum = a[1].reduce((s, t) => s + t.count, 0);
      const bSum = b[1].reduce((s, t) => s + t.count, 0);
      return bSum - aSum;
    });

  for (const [name, tags] of sorted) {
    result.push({ name, tags });
  }

  return result;
}

function isTagSelected(category: string, tagId: string): boolean {
  return filterStore.selectedTags[category]?.includes(tagId) ?? false;
}

function toggleCategory(key: string) {
  if (expandedCategories.value.has(key)) {
    expandedCategories.value.delete(key);
  } else {
    expandedCategories.value.add(key);
  }
}

function toggleSubcategory(key: string) {
  if (expandedSubcategories.value.has(key)) {
    expandedSubcategories.value.delete(key);
  } else {
    expandedSubcategories.value.add(key);
  }
}

function formatSubcategoryName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
}

function getVisibleTags(categoryKey: string, tags: FilterTag[]): FilterTag[] {
  if (showAllTags.value.has(categoryKey) || searchQuery.value) return tags;
  return tags.slice(0, MAX_VISIBLE_TAGS);
}

function toggleShowAll(categoryKey: string) {
  if (showAllTags.value.has(categoryKey)) {
    showAllTags.value.delete(categoryKey);
  } else {
    showAllTags.value.add(categoryKey);
  }
}

function categoryHasActive(key: string): boolean {
  return (filterStore.selectedTags[key]?.length ?? 0) > 0;
}

const matchingCount = computed(() => filterStore.matchingEntries.length);
</script>

<template>
  <!-- Backdrop (mobile) -->
  <div class="filter-backdrop" @click="emit('close')" />

  <!-- Panel -->
  <div ref="panelRef" class="filter-panel">
    <!-- Header -->
    <div class="panel-header">
      <h2 class="panel-title">{{ t('filter.title') }}</h2>
      <button class="close-btn" @click="emit('close')" :aria-label="t('common.close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Search -->
    <div class="panel-search">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('filter.search')"
        class="search-input"
      />
    </div>

    <!-- Active summary -->
    <div v-if="filterStore.isActive" class="active-summary">
      <span class="active-text">
        {{ matchingCount.toLocaleString() }} {{ t('filter.of') }} {{ filterStore.index?.totalEntries.toLocaleString() }} {{ t('filter.entries') }}
      </span>
      <button class="clear-all-btn" @click="filterStore.clearAll()">
        {{ t('filter.clearAll') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="filterStore.loading" class="panel-loading">
      {{ t('filter.loading') }}
    </div>

    <!-- Categories -->
    <div v-else class="panel-categories">
      <div
        v-for="category in filteredCategories"
        :key="category.key"
        class="category"
      >
        <!-- Category header -->
        <button
          class="category-header"
          @click="toggleCategory(category.key)"
        >
          <span class="category-label">
            <svg
              class="chevron"
              :class="{ expanded: expandedCategories.has(category.key) }"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {{ category.label.startsWith('filter.')
              ? t(category.label)
              : category.label }}
          </span>
          <span class="category-actions">
            <span v-if="categoryHasActive(category.key)" class="active-count">
              {{ filterStore.selectedTags[category.key]?.length }}
            </span>
            <button
              v-if="categoryHasActive(category.key)"
              class="clear-category-btn"
              @click.stop="filterStore.clearCategory(category.key)"
              :title="t('filter.clearCategory')"
            >
              &times;
            </button>
          </span>
        </button>

        <!-- Category tags (expandable) -->
        <div v-if="expandedCategories.has(category.key)" class="category-body">
          <!-- Simple categories (editions, location) — flat list -->
          <template v-if="!category.tags.some(t => t.sub)">
            <label
              v-for="tag in getVisibleTags(category.key, category.tags)"
              :key="tag.id"
              class="tag-item"
              :class="{ selected: isTagSelected(category.key, tag.id) }"
            >
              <input
                type="checkbox"
                :checked="isTagSelected(category.key, tag.id)"
                @change="filterStore.toggleTag(category.key, tag.id)"
                class="tag-checkbox"
              />
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count">{{ tag.count.toLocaleString('cs-CZ') }}</span>
            </label>
            <button
              v-if="category.tags.length > MAX_VISIBLE_TAGS && !searchQuery"
              class="show-more-btn"
              @click="toggleShowAll(category.key)"
            >
              {{ showAllTags.has(category.key)
                ? t('filter.showLess')
                : t('filter.showMore').replace('{count}', String(category.tags.length - MAX_VISIBLE_TAGS)) }}
            </button>
          </template>

          <!-- Subcategorized tags (people, places, culture) -->
          <template v-else>
            <div
              v-for="sub in getSubcategories(category.tags)"
              :key="sub.name || '_ungrouped'"
              class="subcategory"
            >
              <button
                v-if="sub.name"
                class="subcategory-header"
                @click="toggleSubcategory(`${category.key}:${sub.name}`)"
              >
                <svg
                  class="chevron small"
                  :class="{ expanded: expandedSubcategories.has(`${category.key}:${sub.name}`) }"
                  width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {{ formatSubcategoryName(sub.name) }}
                <span class="subcategory-count">({{ sub.tags.length }})</span>
              </button>
              <div
                v-if="!sub.name || expandedSubcategories.has(`${category.key}:${sub.name}`)"
                class="subcategory-body"
              >
                <label
                  v-for="tag in getVisibleTags(`${category.key}:${sub.name}`, sub.tags)"
                  :key="tag.id"
                  class="tag-item"
                  :class="{ selected: isTagSelected(category.key, tag.id) }"
                >
                  <input
                    type="checkbox"
                    :checked="isTagSelected(category.key, tag.id)"
                    @change="filterStore.toggleTag(category.key, tag.id)"
                    class="tag-checkbox"
                  />
                  <span class="tag-name">{{ tag.name }}</span>
                  <span class="tag-count">{{ tag.count.toLocaleString('cs-CZ') }}</span>
                </label>
                <button
                  v-if="sub.tags.length > MAX_VISIBLE_TAGS && !searchQuery"
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
</template>

<style scoped>
/* Backdrop (mobile overlay) */
.filter-backdrop {
  display: none;
}

@media (max-width: 767px) {
  .filter-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 90;
  }
}

/* Panel */
.filter-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 340px;
  max-width: 90vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
  z-index: 91;
  overflow: hidden;
}

@media (min-width: 768px) {
  .filter-panel {
    position: fixed;
    top: 56px; /* header height (h-14) */
    right: 16px;
    width: 360px;
    height: auto;
    max-height: calc(100vh - 72px);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
}

@media (min-width: 768px) {
  .filter-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: 90;
  }
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-sans);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* Search */
.panel-search {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-sans);
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--color-accent, #B45309);
}

.search-input::placeholder {
  color: var(--text-muted);
}

/* Active summary */
.active-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: color-mix(in srgb, var(--color-accent, #B45309) 8%, var(--bg-primary));
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.active-text {
  font-size: 13px;
  color: var(--color-accent, #B45309);
  font-weight: 500;
  font-family: var(--font-sans);
}

.clear-all-btn {
  font-size: 12px;
  color: var(--color-accent, #B45309);
  background: transparent;
  border: 1px solid var(--color-accent, #B45309);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-family: var(--font-sans);
}

.clear-all-btn:hover {
  background: var(--color-accent, #B45309);
  color: white;
}

/* Loading */
.panel-loading {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

/* Categories scrollable area */
.panel-categories {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

/* Category */
.category {
  border-bottom: 1px solid var(--border-color);
}

.category:last-child {
  border-bottom: none;
}

.category-header {
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

.category-header:hover {
  background: var(--bg-secondary);
}

.category-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-family: var(--font-sans);
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.active-count {
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

.clear-category-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
}

.clear-category-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* Chevron */
.chevron {
  transition: transform 0.2s;
  flex-shrink: 0;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.chevron.small {
  width: 12px;
  height: 12px;
}

/* Category body */
.category-body {
  padding: 0 8px 8px;
}

/* Subcategory */
.subcategory {
  margin-bottom: 2px;
}

.subcategory-header {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-sans);
  border-radius: 4px;
}

.subcategory-header:hover {
  background: var(--bg-secondary);
}

.subcategory-count {
  color: var(--text-muted);
  opacity: 0.6;
}

.subcategory-body {
  padding-left: 4px;
}

/* Tag item */
.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.1s;
}

.tag-item:hover {
  background: var(--bg-secondary);
}

.tag-item.selected {
  background: color-mix(in srgb, var(--color-accent, #B45309) 10%, var(--bg-primary));
}

.tag-checkbox {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  accent-color: var(--color-accent, #B45309);
  cursor: pointer;
}

.tag-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-sans);
}

/* Show more */
.show-more-btn {
  display: block;
  width: 100%;
  padding: 4px 8px;
  margin-top: 2px;
  border: none;
  background: transparent;
  color: var(--color-accent, #B45309);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-sans);
  border-radius: 4px;
}

.show-more-btn:hover {
  background: var(--bg-secondary);
}
</style>
