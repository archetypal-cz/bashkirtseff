import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface HistoryItem {
  type: 'paragraph' | 'glossary';
  // For paragraphs:
  paragraphId?: string;    // e.g. "008.0145"
  carnet?: string;         // e.g. "008"
  entryDate?: string;      // e.g. "1873-08-11"
  // For glossary:
  glossaryId?: string;     // e.g. "NICE"
  glossaryName?: string;   // e.g. "Nice"
  // Common:
  language: string;        // e.g. "cz", "original"
  label: string;           // Display text: paragraph preview or glossary name
  url: string;             // Full path to navigate to
  timestamp: number;       // Date.now()
}

const STORAGE_KEY = 'reading-history';
const MAX_ITEMS = 10;

export const useHistoryStore = defineStore('history', () => {
  const items = ref<HistoryItem[]>([]);

  function init() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          items.value = parsed;
        }
      }
    } catch {
      // Ignore corrupt data
    }
  }

  function save() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
  }

  /**
   * Add a paragraph to history. Replaces existing entry for the same carnet
   * (one paragraph per carnet). Moves to front of list.
   */
  function addParagraph(item: Omit<HistoryItem, 'type' | 'timestamp'> & { carnet: string }) {
    const list = items.value.filter(
      i => !(i.type === 'paragraph' && i.carnet === item.carnet)
    );
    list.unshift({
      ...item,
      type: 'paragraph',
      timestamp: Date.now(),
    });
    items.value = list.slice(0, MAX_ITEMS);
    save();
  }

  /**
   * Add a glossary entry to history. Replaces existing entry for the same glossaryId.
   * Moves to front of list.
   */
  function addGlossary(item: Omit<HistoryItem, 'type' | 'timestamp'> & { glossaryId: string }) {
    const list = items.value.filter(
      i => !(i.type === 'glossary' && i.glossaryId === item.glossaryId)
    );
    list.unshift({
      ...item,
      type: 'glossary',
      timestamp: Date.now(),
    });
    items.value = list.slice(0, MAX_ITEMS);
    save();
  }

  function removeItem(item: HistoryItem) {
    items.value = items.value.filter(i => {
      if (item.type === 'paragraph') return !(i.type === 'paragraph' && i.paragraphId === item.paragraphId);
      return !(i.type === 'glossary' && i.glossaryId === item.glossaryId);
    });
    save();
  }

  function clear() {
    items.value = [];
    save();
  }

  const count = computed(() => items.value.length);
  const isEmpty = computed(() => items.value.length === 0);

  return {
    items,
    count,
    isEmpty,
    init,
    addParagraph,
    addGlossary,
    removeItem,
    clear,
  };
});
