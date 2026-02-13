<script setup lang="ts">
import { onMounted, watch, ref, computed, nextTick } from 'vue';
import { useFilterStore } from '../../stores/filter';
import { useI18n } from '../../i18n';

const { t, locale } = useI18n();

const props = defineProps<{
  pageType: 'year-list' | 'year-detail' | 'carnet-detail' | 'carnets-list';
}>();

const filterStore = useFilterStore();

// Store original counts to restore when filter is cleared
const originalCounts = ref<Map<string, string>>(new Map());

/** Active tag names across all categories */
const activeTagNames = computed<string[]>(() => {
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

const multiCategoryActive = computed(() =>
  Object.values(filterStore.selectedTags).filter(tags => tags.length > 0).length >= 2
);

const bannerTagsText = computed(() => {
  if (activeTagNames.value.length === 0) return '';
  const joiner = multiCategoryActive.value
    ? (filterStore.filterMode === 'and' ? ` ${t('filter.and')} ` : ` ${t('filter.or')} `)
    : ', ';
  return activeTagNames.value.join(joiner);
});

// For carnet-detail, counts come from DOM after applyFilter
const carnetBannerText = ref('');

const bannerCountText = computed(() => {
  if (props.pageType === 'carnet-detail') return carnetBannerText.value;
  const total = filterStore.index?.totalEntries || 0;
  const matching = filterStore.matchingEntries.length;
  return t('filter.bannerCount')
    .replace('{matching}', matching.toLocaleString())
    .replace('{total}', total.toLocaleString());
});

const showBannerFlag = computed(() => filterStore.isActive && !!filterStore.index);

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
  () => [filterStore.isActive, filterStore.activeTagCount, filterStore.matchingEntryIds.size, filterStore.filterMode],
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

  // Entry cards — on carnet-detail, dim non-matching instead of hiding
  document.querySelectorAll<HTMLElement>('[data-filter-entry]').forEach(el => {
    const entryId = el.getAttribute('data-filter-entry')!;
    const matches = matchingEntryIds.has(entryId);
    if (props.pageType === 'carnet-detail') {
      el.classList.toggle('filter-dimmed', !matches);
      el.classList.toggle('filter-match', matches);
      el.classList.remove('filter-hidden');
    } else {
      el.classList.toggle('filter-hidden', !matches);
      el.classList.remove('filter-dimmed', 'filter-match');
    }
  });

  // Inject filter nav hints for matching entries on carnet-detail
  if (props.pageType === 'carnet-detail') {
    injectFilterNav(matchingEntryIds);
  }

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

  // Update carnet-detail banner text (other pages use computed)
  updateCarnetBanner();
}

function resetFilter() {
  // Remove all filter classes
  document.querySelectorAll<HTMLElement>('.filter-hidden, .filter-dimmed, .filter-match').forEach(el => {
    el.classList.remove('filter-hidden', 'filter-dimmed', 'filter-match');
  });

  // Remove injected filter nav hints
  document.querySelectorAll('.filter-entry-nav').forEach(el => el.remove());

  // Restore original counts
  document.querySelectorAll<HTMLElement>('[data-filter-count]').forEach(el => {
    const key = el.getAttribute('data-filter-count')!;
    const original = originalCounts.value.get(key);
    if (original) el.textContent = original;
  });

  // Reset carnet banner text
  carnetBannerText.value = '';
}

function updateCarnetBanner() {
  if (props.pageType === 'carnet-detail') {
    const allEntryEls = document.querySelectorAll('[data-filter-entry]');
    const matchCount = document.querySelectorAll('[data-filter-entry].filter-match').length;
    const hiddenCount = allEntryEls.length - matchCount;
    carnetBannerText.value = t('filter.bannerCarnet')
      .replace('{matching}', String(matchCount))
      .replace('{total}', String(allEntryEls.length))
      .replace('{hidden}', String(hiddenCount));
  }
}

/** Inject prev/next filter navigation hints between matching entries */
function injectFilterNav(matchingEntryIds: Set<string>) {
  // Remove previous hints
  document.querySelectorAll('.filter-entry-nav').forEach(el => el.remove());

  // Gather matching entries in DOM order
  const allEntryEls = Array.from(document.querySelectorAll<HTMLElement>('[data-filter-entry]'));
  const matchingEls = allEntryEls.filter(el =>
    matchingEntryIds.has(el.getAttribute('data-filter-entry')!)
  );

  if (matchingEls.length <= 1) return;

  // Get active filter label(s) for display
  const activeLabels = getActiveFilterLabels();
  const joiner = multiCategoryActive.value
    ? (filterStore.filterMode === 'and' ? ` ${t('filter.and')} ` : ` ${t('filter.or')} `)
    : ', ';
  const labelStr = activeLabels.length > 0 ? activeLabels.join(joiner) : t('filter.title');

  for (let i = 0; i < matchingEls.length; i++) {
    const el = matchingEls[i];
    const currentDate = el.getAttribute('data-filter-entry')!;
    const hints: string[] = [];

    // Previous matching
    if (i > 0) {
      const prevDate = matchingEls[i - 1].getAttribute('data-filter-entry')!;
      const dayGap = dateDiffDays(prevDate, currentDate);
      const formattedDate = formatShortDate(prevDate);
      if (dayGap > 0) {
        hints.push(`\u2039 ${formattedDate} (${dayGap} d)`);
      }
    }

    // Next matching
    if (i < matchingEls.length - 1) {
      const nextDate = matchingEls[i + 1].getAttribute('data-filter-entry')!;
      const dayGap = dateDiffDays(currentDate, nextDate);
      const formattedDate = formatShortDate(nextDate);
      if (dayGap > 0) {
        hints.push(`${formattedDate} (${dayGap} d) \u203A`);
      }
    }

    if (hints.length > 0) {
      const nav = document.createElement('div');
      nav.className = 'filter-entry-nav';
      nav.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 2px 12px 2px 16px; margin-top: -4px; margin-bottom: 4px;
        font-size: 11px; color: var(--color-accent, #B45309); opacity: 0.7;
        font-family: var(--font-sans, system-ui); letter-spacing: 0.02em;
      `;
      const leftHint = hints.length === 2 ? hints[0] : (i > 0 ? hints[0] : '');
      const rightHint = hints.length === 2 ? hints[1] : (i < matchingEls.length - 1 ? hints[0] : '');
      nav.innerHTML = `<span>${leftHint}</span><span style="opacity:0.5">${labelStr}</span><span>${rightHint}</span>`;
      el.insertAdjacentElement('afterend', nav);
    }
  }
}

function getActiveFilterLabels(): string[] {
  if (!filterStore.index) return [];
  const labels: string[] = [];
  for (const [catKey, tagIds] of Object.entries(filterStore.selectedTags)) {
    if (!tagIds || tagIds.length === 0) continue;
    const cat = filterStore.index.categories.find(c => c.key === catKey);
    if (!cat) continue;
    for (const tagId of tagIds) {
      const tag = cat.tags.find(t => t.id === tagId);
      if (tag) labels.push(tag.name);
    }
  }
  return labels;
}

function dateDiffDays(dateA: string, dateB: string): number {
  const a = new Date(dateA.split('-').slice(0, 3).join('-'));
  const b = new Date(dateB.split('-').slice(0, 3).join('-'));
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(dateStr: string): string {
  const datePart = dateStr.split('-').slice(0, 3).join('-');
  const d = new Date(datePart);
  const localeMap: Record<string, string> = { cs: 'cs-CZ', fr: 'fr-FR', en: 'en-US', uk: 'uk-UA' };
  return d.toLocaleDateString(localeMap[locale.value] || 'cs-CZ', { day: 'numeric', month: 'short' });
}

</script>

<template>
  <div v-if="showBannerFlag" class="filter-banner">
    <div class="banner-content">
      <span v-if="bannerTagsText" class="banner-tags">{{ bannerTagsText }}</span>
      <span class="banner-text">{{ bannerCountText }}</span>
    </div>
    <button class="banner-clear" @click="filterStore.clearAll()">
      {{ t('filter.clearFilter') }}
    </button>
  </div>
</template>

<style scoped>
.filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-accent, #B45309) 8%, var(--bg-primary));
  border: 1px solid color-mix(in srgb, var(--color-accent, #B45309) 20%, var(--border-color));
  font-family: var(--font-sans);
}

.banner-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.banner-tags {
  font-size: 13px;
  color: var(--color-accent, #B45309);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-text {
  font-size: 12px;
  color: var(--color-accent, #B45309);
  font-weight: 400;
  opacity: 0.8;
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
  flex-shrink: 0;
}

.banner-clear:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}
</style>
