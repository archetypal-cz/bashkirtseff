<script setup lang="ts">
import { onMounted, watch, ref, nextTick } from 'vue';
import { useFilterStore } from '../../stores/filter';

const props = defineProps<{
  pageType: 'year-list' | 'year-detail' | 'carnet-detail' | 'carnets-list';
}>();

const filterStore = useFilterStore();

// Store original counts to restore when filter is cleared
const originalCounts = ref<Map<string, string>>(new Map());
const bannerEl = ref<HTMLElement | null>(null);

onMounted(async () => {
  filterStore.init();
  await filterStore.loadIndex();

  // Capture original count texts
  document.querySelectorAll('[data-filter-count]').forEach(el => {
    const key = el.getAttribute('data-filter-count')!;
    originalCounts.value.set(key, el.textContent || '');
  });

  // Apply filter if already active on mount
  if (filterStore.isActive && filterStore.index) {
    await nextTick();
    applyFilter();
  }
});

// Watch for filter changes
watch(
  () => [filterStore.isActive, filterStore.activeTagCount, filterStore.matchingEntryIds.size],
  () => {
    if (!filterStore.index) return;
    if (filterStore.isActive) {
      applyFilter();
    } else {
      resetFilter();
    }
  },
);

function applyFilter() {
  const { matchingByYear, matchingByCarnet, matchingEntryIds } = filterStore;

  // Year cards
  document.querySelectorAll<HTMLElement>('[data-filter-year]').forEach(el => {
    const year = parseInt(el.getAttribute('data-filter-year')!, 10);
    const match = matchingByYear[year];
    el.classList.toggle('filter-hidden', !match || match.entries === 0);
  });

  // Carnet cards
  document.querySelectorAll<HTMLElement>('[data-filter-carnet]').forEach(el => {
    const carnet = el.getAttribute('data-filter-carnet')!;
    const match = matchingByCarnet[carnet];
    el.classList.toggle('filter-hidden', !match || match.entries === 0);
  });

  // Entry cards
  document.querySelectorAll<HTMLElement>('[data-filter-entry]').forEach(el => {
    const entryId = el.getAttribute('data-filter-entry')!;
    el.classList.toggle('filter-hidden', !matchingEntryIds.has(entryId));
  });

  // Update counts
  document.querySelectorAll<HTMLElement>('[data-filter-count]').forEach(el => {
    const key = el.getAttribute('data-filter-count')!;
    const original = originalCounts.value.get(key) || '';

    if (props.pageType === 'year-list') {
      // key format: "year-entries:1873"
      const yearMatch = key.match(/^year-entries:(\d+)$/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        const match = matchingByYear[year];
        if (match) {
          el.textContent = `${match.entries} / ${original}`;
        }
      }
    } else if (props.pageType === 'year-detail' || props.pageType === 'carnets-list') {
      // key format: "carnet-entries:015"
      const carnetMatch = key.match(/^carnet-entries:(.+)$/);
      if (carnetMatch) {
        const carnet = carnetMatch[1];
        const match = matchingByCarnet[carnet];
        if (match) {
          el.textContent = `${match.entries} / ${original}`;
        }
      }
    }
  });

  // Show/update banner
  showBanner();
}

function resetFilter() {
  // Remove all filter-hidden classes
  document.querySelectorAll<HTMLElement>('.filter-hidden').forEach(el => {
    el.classList.remove('filter-hidden');
  });

  // Restore original counts
  document.querySelectorAll<HTMLElement>('[data-filter-count]').forEach(el => {
    const key = el.getAttribute('data-filter-count')!;
    const original = originalCounts.value.get(key);
    if (original) el.textContent = original;
  });

  // Remove banner
  hideBanner();
}

function showBanner() {
  if (!bannerEl.value) return;
  const total = filterStore.index?.totalEntries || 0;
  const matching = filterStore.matchingEntries.length;
  bannerEl.value.style.display = 'flex';
  const textEl = bannerEl.value.querySelector('.banner-text');
  if (textEl) {
    textEl.textContent = `Filtrováno: ${matching.toLocaleString('cs-CZ')} z ${total.toLocaleString('cs-CZ')} záznamů`;
  }
}

function hideBanner() {
  if (bannerEl.value) {
    bannerEl.value.style.display = 'none';
  }
}
</script>

<template>
  <div
    ref="bannerEl"
    class="filter-banner"
    style="display: none"
  >
    <span class="banner-text"></span>
    <button class="banner-clear" @click="filterStore.clearAll()">
      Zrušit filtr
    </button>
  </div>
</template>

<style scoped>
.filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-accent, #B45309) 8%, var(--bg-primary));
  border: 1px solid color-mix(in srgb, var(--color-accent, #B45309) 20%, var(--border-color));
  font-family: var(--font-sans);
}

.banner-text {
  font-size: 13px;
  color: var(--color-accent, #B45309);
  font-weight: 500;
}

.banner-clear {
  font-size: 12px;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 2px 10px;
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--font-sans);
}

.banner-clear:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}
</style>
