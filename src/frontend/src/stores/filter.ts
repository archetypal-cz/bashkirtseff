import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FilterIndex, FilterEntryRecord } from '../types/filter-index';

const STORAGE_KEY = 'filter-tags';

export const useFilterStore = defineStore('filter', () => {
  // --- State ---
  const index = ref<FilterIndex | null>(null);
  const loading = ref(false);
  const selectedTags = ref<Record<string, string[]>>({});
  const panelOpen = ref(false);

  // --- Computed ---

  const isActive = computed(() =>
    Object.values(selectedTags.value).some(tags => tags.length > 0)
  );

  const activeTagCount = computed(() =>
    Object.values(selectedTags.value).reduce((sum, tags) => sum + tags.length, 0)
  );

  /** Entries matching the current filter (AND across categories, OR within) */
  const matchingEntries = computed<FilterEntryRecord[]>(() => {
    if (!index.value || !isActive.value) return [];

    const activeCategories = Object.entries(selectedTags.value)
      .filter(([_, tags]) => tags.length > 0);

    if (activeCategories.length === 0) return [];

    let result = index.value.entries;

    for (const [category, tags] of activeCategories) {
      const tagSet = new Set(tags);
      result = result.filter(entry => entryMatchesCategory(entry, category, tagSet));
    }

    return result;
  });

  /** Set of matching entry IDs for fast lookup */
  const matchingEntryIds = computed<Set<string>>(() =>
    new Set(matchingEntries.value.map(e => e.id))
  );

  /** Filtered counts grouped by year: { year → { entries, paras } } */
  const matchingByYear = computed<Record<number, { entries: number; paras: number }>>(() => {
    if (!isActive.value) return {};
    const counts: Record<number, { entries: number; paras: number }> = {};
    for (const entry of matchingEntries.value) {
      const c = counts[entry.y] || (counts[entry.y] = { entries: 0, paras: 0 });
      c.entries++;
      c.paras += entry.n || 0;
    }
    return counts;
  });

  /** Filtered counts grouped by carnet: { carnet → { entries, paras } } */
  const matchingByCarnet = computed<Record<string, { entries: number; paras: number }>>(() => {
    if (!isActive.value) return {};
    const counts: Record<string, { entries: number; paras: number }> = {};
    for (const entry of matchingEntries.value) {
      const c = counts[entry.c] || (counts[entry.c] = { entries: 0, paras: 0 });
      c.entries++;
      c.paras += entry.n || 0;
    }
    return counts;
  });

  // --- Actions ---

  async function loadIndex() {
    if (index.value || loading.value) return;
    loading.value = true;
    try {
      const res = await fetch('/data/filter-index.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      index.value = await res.json();
    } catch (e) {
      console.error('[FilterStore] Failed to load index:', (e as Error).message);
    } finally {
      loading.value = false;
    }
  }

  function toggleTag(category: string, tagId: string) {
    const current = selectedTags.value[category] || [];
    if (current.includes(tagId)) {
      selectedTags.value = {
        ...selectedTags.value,
        [category]: current.filter(t => t !== tagId),
      };
    } else {
      selectedTags.value = {
        ...selectedTags.value,
        [category]: [...current, tagId],
      };
    }
    persist();
  }

  function clearCategory(category: string) {
    const next = { ...selectedTags.value };
    delete next[category];
    selectedTags.value = next;
    persist();
  }

  function clearAll() {
    selectedTags.value = {};
    persist();
  }

  function init() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        selectedTags.value = JSON.parse(saved);
      } catch {
        /* ignore corrupt data */
      }
    }
  }

  function persist() {
    if (typeof window === 'undefined') return;
    const active = Object.fromEntries(
      Object.entries(selectedTags.value).filter(([_, tags]) => tags.length > 0)
    );
    if (Object.keys(active).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    }
  }

  return {
    // State
    index, loading, selectedTags, panelOpen,
    // Computed
    isActive, activeTagCount, matchingEntries, matchingEntryIds,
    matchingByYear, matchingByCarnet,
    // Actions
    loadIndex, toggleTag, clearCategory, clearAll, init,
  };
});

function entryMatchesCategory(
  entry: FilterEntryRecord,
  category: string,
  tags: Set<string>,
): boolean {
  switch (category) {
    case 'editions':
      return (tags.has('kernberger') && !!entry.k) ||
             (tags.has('censored_1887') && !!entry.x);
    case 'people':
      return entry.p?.some(id => tags.has(id)) ?? false;
    case 'places':
      return entry.pl?.some(id => tags.has(id)) ?? false;
    case 'culture':
      return entry.cu?.some(id => tags.has(id)) ?? false;
    case 'location':
      return entry.l ? tags.has(entry.l) : false;
    default:
      return false;
  }
}
