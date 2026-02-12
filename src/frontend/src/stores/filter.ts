import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FilterIndex, FilterEntryRecord } from '../types/filter-index';

const STORAGE_KEY = 'filter-tags';
const MODE_STORAGE_KEY = 'filter-mode';

export type FilterMode = 'and' | 'or';

export const useFilterStore = defineStore('filter', () => {
  // --- State ---
  const index = ref<FilterIndex | null>(null);
  const loading = ref(false);
  const selectedTags = ref<Record<string, string[]>>({});
  const panelOpen = ref(false);
  const filterMode = ref<FilterMode>('and');

  // --- Computed ---

  const isActive = computed(() =>
    Object.values(selectedTags.value).some(tags => tags.length > 0)
  );

  const activeTagCount = computed(() =>
    Object.values(selectedTags.value).reduce((sum, tags) => sum + tags.length, 0)
  );

  /** Entries matching the current filter.
   *  AND mode: entry must match ALL active categories (intersect).
   *  OR mode: entry must match ANY active category (union).
   *  Within each category, matching is always OR (any selected tag). */
  const matchingEntries = computed<FilterEntryRecord[]>(() => {
    if (!index.value || !isActive.value) return [];

    const activeCategories = Object.entries(selectedTags.value)
      .filter(([_, tags]) => tags.length > 0);

    if (activeCategories.length === 0) return [];

    if (filterMode.value === 'or' && activeCategories.length > 1) {
      // OR mode: entry must match ANY active category (union)
      const resultSet = new Set<string>();
      const resultEntries: FilterEntryRecord[] = [];
      for (const [category, tags] of activeCategories) {
        const tagSet = new Set(tags);
        for (const entry of index.value.entries) {
          if (!resultSet.has(entry.id) && entryMatchesCategory(entry, category, tagSet)) {
            resultSet.add(entry.id);
            resultEntries.push(entry);
          }
        }
      }
      return resultEntries;
    }

    // AND mode (default): entry must match ALL active categories (intersect)
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

  function setFilterMode(mode: FilterMode) {
    filterMode.value = mode;
    persist();
  }

  let _syncing = false;

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
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
    if (savedMode === 'and' || savedMode === 'or') {
      filterMode.value = savedMode;
    }
    // Listen for cross-island filter sync events (same page, different Vue islands)
    window.addEventListener('filter-sync', () => {
      if (_syncing) return; // skip self-dispatched events
      const fresh = localStorage.getItem(STORAGE_KEY);
      try {
        selectedTags.value = fresh ? JSON.parse(fresh) : {};
      } catch {
        selectedTags.value = {};
      }
      const freshMode = localStorage.getItem(MODE_STORAGE_KEY);
      if (freshMode === 'and' || freshMode === 'or') {
        filterMode.value = freshMode;
      }
    });
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
    localStorage.setItem(MODE_STORAGE_KEY, filterMode.value);
    // Notify other Vue islands on the same page
    _syncing = true;
    window.dispatchEvent(new CustomEvent('filter-sync'));
    _syncing = false;
  }

  return {
    // State
    index, loading, selectedTags, panelOpen, filterMode,
    // Computed
    isActive, activeTagCount, matchingEntries, matchingEntryIds,
    matchingByYear, matchingByCarnet,
    // Actions
    loadIndex, toggleTag, clearCategory, clearAll, setFilterMode, init,
  };
});

/** Case-insensitive check: tags set may contain UPPERCASE glossary IDs while
 *  filter index uses mixed-case entity names from frontmatter (or vice versa). */
function ciHas(tags: Set<string>, id: string): boolean {
  if (tags.has(id)) return true;
  const lower = id.toLowerCase();
  for (const t of tags) {
    if (t.toLowerCase() === lower) return true;
  }
  return false;
}

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
      return entry.p?.some(id => ciHas(tags, id)) ?? false;
    case 'places':
      return entry.pl?.some(id => ciHas(tags, id)) ?? false;
    case 'culture':
      return entry.cu?.some(id => ciHas(tags, id)) ?? false;
    case 'themes':
      return entry.th?.some(id => ciHas(tags, id)) ?? false;
    case 'location':
      return entry.l ? ciHas(tags, entry.l) : false;
    default:
      return false;
  }
}
