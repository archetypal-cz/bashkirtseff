<script setup lang="ts">
import { ref, computed } from 'vue';
import { CATEGORY_ICONS, getCategoryColor } from '../../lib/glossary-categories';

interface EntryBrief {
  id: string;
  name: string;
  summary?: string;
  usageCount: number;
}

interface SubCategoryData {
  subCategory: string;
  categoryPath: string;
  count: number;
  entries: EntryBrief[];
}

interface CategoryData {
  name: string;
  totalCount: number;
  subCategories: SubCategoryData[];
}

const props = defineProps<{
  categories: CategoryData[];
  glossaryBasePath: string;
}>();

const expandedCategories = ref<Record<string, boolean>>({});
const expandedSubs = ref<Record<string, boolean>>({});

function toggleCategory(name: string) {
  expandedCategories.value[name] = !expandedCategories.value[name];
}

function toggleSub(categoryPath: string) {
  expandedSubs.value[categoryPath] = !expandedSubs.value[categoryPath];
}

function getCategoryIconPath(name: string): string {
  return CATEGORY_ICONS[name] || CATEGORY_ICONS.people;
}

function getColor(name: string): string {
  return getCategoryColor(name);
}

const anyExpanded = computed(() => {
  return Object.values(expandedCategories.value).some(Boolean);
});

const subcategoryLabels: Record<string, Record<string, string>> = {
  cs: {
    core: 'Hlavní postavy', recurring: 'Opakující se', mentioned: 'Zmíněné',
    aristocracy: 'Aristokracie', artists: 'Umělci', family: 'Rodina',
    historical: 'Historické', politicians: 'Politici', writers: 'Spisovatelé',
    religious: 'Duchovní', doctors: 'Lékaři', service: 'Služebnictvo',
    society: 'Společnost',
    cities: 'Města', countries: 'Země', hotels: 'Hotely',
    residences: 'Rezidence', theaters: 'Divadla', churches: 'Kostely',
    social: 'Společenská místa', streets: 'Ulice', travel: 'Cestování',
    parks: 'Parky', schools: 'Školy', shops: 'Obchody',
    neighborhoods: 'Čtvrtě', buildings: 'Budovy', landmarks: 'Památky',
    regions: 'Regiony', geography: 'Zeměpis',
    literature: 'Literatura', history: 'Historie', theater: 'Divadlo',
    music: 'Hudba', art: 'Umění', themes: 'Témata', newspapers: 'Noviny',
    transport: 'Doprava', daily_life: 'Každodenní život', fashion: 'Móda',
    health: 'Zdraví', institutions: 'Instituce', languages: 'Jazyky',
    social_customs: 'Společenské zvyky', _root: 'Obecné',
  },
  fr: {
    core: 'Personnages principaux', recurring: 'Récurrents', mentioned: 'Mentionnés',
    aristocracy: 'Aristocratie', artists: 'Artistes', family: 'Famille',
    historical: 'Historiques', politicians: 'Politiciens', writers: 'Écrivains',
    religious: 'Religieux', doctors: 'Médecins', service: 'Domestiques',
    society: 'Société',
    cities: 'Villes', countries: 'Pays', hotels: 'Hôtels',
    residences: 'Résidences', theaters: 'Théâtres', churches: 'Églises',
    social: 'Lieux mondains', streets: 'Rues', travel: 'Voyages',
    parks: 'Parcs', schools: 'Écoles', shops: 'Boutiques',
    neighborhoods: 'Quartiers', buildings: 'Bâtiments', landmarks: 'Monuments',
    regions: 'Régions', geography: 'Géographie',
    literature: 'Littérature', history: 'Histoire', theater: 'Théâtre',
    music: 'Musique', art: 'Art', themes: 'Thèmes', newspapers: 'Journaux',
    transport: 'Transport', daily_life: 'Vie quotidienne', fashion: 'Mode',
    health: 'Santé', institutions: 'Institutions', languages: 'Langues',
    social_customs: 'Coutumes', _root: 'Général',
  },
};

const categoryNames: Record<string, Record<string, string>> = {
  cs: { people: 'Osoby', places: 'Místa', culture: 'Kultura', themes: 'Témata' },
  fr: { people: 'Personnes', places: 'Lieux', culture: 'Culture', themes: 'Thèmes' },
  en: { people: 'People', places: 'Places', culture: 'Culture', themes: 'Themes' },
  uk: { people: 'Особи', places: 'Місця', culture: 'Культура', themes: 'Теми' },
};

function getLocale(): string {
  if (props.glossaryBasePath.startsWith('/cz')) return 'cs';
  return 'fr';
}

function getCategoryName(name: string): string {
  return categoryNames[getLocale()]?.[name] || name;
}

function getSubcategoryLabel(sub: string): string {
  return subcategoryLabels[getLocale()]?.[sub] || sub.replace(/_/g, ' ');
}

// Map display category → filter category (themes is virtual, maps back to culture)
const FILTER_CATEGORY_MAP: Record<string, string> = {
  people: 'people',
  places: 'places',
  culture: 'culture',
  themes: 'culture',
};

function activateFilter(event: Event, categoryName: string, entryId: string) {
  event.preventDefault();
  event.stopPropagation();
  const filterCategory = FILTER_CATEGORY_MAP[categoryName] || 'people';
  localStorage.setItem('filter-tags', JSON.stringify({ [filterCategory]: [entryId] }));
  window.dispatchEvent(new CustomEvent('filter-sync'));
  window.location.href = '/cz';
}
</script>

<template>
  <div class="category-browser">
    <!-- Top-level category cards -->
    <div class="category-grid">
      <button
        v-for="cat in categories"
        :key="cat.name"
        @click="toggleCategory(cat.name)"
        class="category-card"
        :class="{ 'is-expanded': expandedCategories[cat.name] }"
      >
        <div class="category-header">
          <div class="category-icon-wrap" :style="{ color: getColor(cat.name) }">
            <svg class="category-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="getCategoryIconPath(cat.name)" />
            </svg>
          </div>
          <div class="category-info">
            <div class="category-name">{{ getCategoryName(cat.name) }}</div>
            <div class="category-count">{{ cat.totalCount }}</div>
          </div>
          <svg class="chevron" :class="{ 'is-open': expandedCategories[cat.name] }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
    </div>

    <!-- Expanded subcategory grids -->
    <Transition name="subcats">
      <div v-if="anyExpanded" class="subcategory-section">
        <template v-for="cat in categories" :key="cat.name">
          <div v-if="expandedCategories[cat.name]" class="subcategory-block">
            <div class="subcategory-header" :style="{ borderColor: getColor(cat.name) }">
              <svg class="w-4 h-4 flex-shrink-0" :style="{ color: getColor(cat.name) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getCategoryIconPath(cat.name)" />
              </svg>
              <span class="subcategory-header-text">{{ getCategoryName(cat.name) }}</span>
            </div>
            <div class="subcategory-grid">
              <button
                v-for="sub in cat.subCategories"
                :key="sub.categoryPath"
                @click="toggleSub(sub.categoryPath)"
                class="subcategory-chip"
                :class="{ 'is-active': expandedSubs[sub.categoryPath] }"
              >
                <span class="subcategory-name">{{ getSubcategoryLabel(sub.subCategory) }}</span>
                <span class="subcategory-count-badge">{{ sub.count }}</span>
                <svg class="sub-chevron" :class="{ 'is-open': expandedSubs[sub.categoryPath] }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <!-- Expanded entries for active subcategories -->
            <template v-for="sub in cat.subCategories" :key="'entries-' + sub.categoryPath">
              <div v-if="expandedSubs[sub.categoryPath]" class="entries-panel">
                <div class="entries-panel-header" :style="{ color: getColor(cat.name) }">
                  {{ getSubcategoryLabel(sub.subCategory) }}
                  <span class="entries-panel-count">({{ sub.count }})</span>
                </div>
                <div class="entries-list">
                  <a
                    v-for="entry in sub.entries"
                    :key="entry.id"
                    :href="`${glossaryBasePath}/${entry.id}`"
                    class="entry-item"
                  >
                    <div class="entry-row">
                      <span class="entry-name">{{ entry.name }}</span>
                      <button
                        v-if="entry.usageCount"
                        class="entry-filter-btn"
                        :title="getLocale() === 'cs' ? `Filtrovat ${entry.usageCount} zmínek v deníku` : `Filtrer ${entry.usageCount} mentions dans le journal`"
                        @click="activateFilter($event, cat.name, entry.id)"
                      >
                        <svg class="filter-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span>{{ entry.usageCount }}</span>
                      </button>
                    </div>
                    <div v-if="entry.summary" class="entry-summary">{{ entry.summary }}</div>
                  </a>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.category-browser {
  margin-bottom: 1.5rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}

.category-card {
  display: block;
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.category-card:hover {
  border-color: var(--color-accent, #B45309);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.category-card.is-expanded {
  border-color: var(--color-accent, #B45309);
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .category-card {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .category-card:hover,
[data-theme="dark"] .category-card.is-expanded {
  border-color: var(--color-accent-light, #D97706);
  background: #252525;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-icon-wrap {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: var(--bg-secondary, #F5E6D3);
}

.category-card.is-expanded .category-icon-wrap {
  background: var(--bg-primary, #FFF8F0);
}

[data-theme="dark"] .category-icon-wrap {
  background: #252525;
}

[data-theme="dark"] .category-card.is-expanded .category-icon-wrap {
  background: #1a1a1a;
}

.category-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  font-family: var(--font-serif, 'Cormorant Garamond', serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-primary, #2C1810);
  line-height: 1.3;
}

[data-theme="dark"] .category-name {
  color: #e5e5e5;
}

.category-count {
  font-size: 0.8125rem;
  color: var(--text-muted, #78716C);
}

.chevron {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-muted, #78716C);
  transition: transform 0.25s ease;
}

.chevron.is-open {
  transform: rotate(180deg);
}

/* Subcategory section */
.subcategory-section {
  margin-top: 0.75rem;
}

.subcategory-block {
  margin-bottom: 1rem;
}

.subcategory-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  border-bottom: 2px solid;
}

.subcategory-header-text {
  font-family: var(--font-serif, 'Cormorant Garamond', serif);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary, #2C1810);
}

[data-theme="dark"] .subcategory-header-text {
  color: #e5e5e5;
}

.subcategory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.subcategory-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: var(--bg-secondary, #F5E6D3);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.08));
  border-radius: 2rem;
  font-size: 0.8125rem;
  color: var(--text-secondary, #4A3728);
  cursor: pointer;
  transition: all 0.15s;
}

.subcategory-chip:hover {
  border-color: var(--color-accent, #B45309);
  color: var(--text-primary, #2C1810);
}

.subcategory-chip.is-active {
  background: var(--color-accent, #B45309);
  border-color: var(--color-accent, #B45309);
  color: white;
}

.subcategory-chip.is-active .subcategory-count-badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.subcategory-chip.is-active .sub-chevron {
  color: white;
}

[data-theme="dark"] .subcategory-chip {
  background: #252525;
  border-color: rgba(255, 255, 255, 0.08);
  color: #a3a3a3;
}

[data-theme="dark"] .subcategory-chip:hover {
  border-color: var(--color-accent-light, #D97706);
  color: #e5e5e5;
}

[data-theme="dark"] .subcategory-chip.is-active {
  background: var(--color-accent-light, #D97706);
  border-color: var(--color-accent-light, #D97706);
  color: #1a1a1a;
}

.subcategory-name {
  white-space: nowrap;
}

.subcategory-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  padding: 0 0.25rem;
  height: 1.125rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: var(--bg-primary, #FFF8F0);
  border-radius: 1rem;
  color: var(--text-muted, #78716C);
}

[data-theme="dark"] .subcategory-count-badge {
  background: #1a1a1a;
  color: #888;
}

.sub-chevron {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--text-muted, #78716C);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.sub-chevron.is-open {
  transform: rotate(180deg);
}

/* Entries panel */
.entries-panel {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.75rem;
  overflow: hidden;
}

[data-theme="dark"] .entries-panel {
  border-color: rgba(255, 255, 255, 0.1);
}

.entries-panel-header {
  font-family: var(--font-serif, 'Cormorant Garamond', serif);
  font-size: 0.9375rem;
  font-weight: 500;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary, #F5E6D3);
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.08));
}

[data-theme="dark"] .entries-panel-header {
  background: #252525;
  border-color: rgba(255, 255, 255, 0.08);
}

.entries-panel-count {
  font-weight: 400;
  font-size: 0.8125rem;
  opacity: 0.7;
}

.entries-list {
  max-height: 24rem;
  overflow-y: auto;
}

.entry-item {
  display: block;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: var(--text-primary, #2C1810);
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.05));
  transition: background 0.15s;
}

.entry-item:last-child {
  border-bottom: none;
}

.entry-item:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .entry-item {
  color: #e5e5e5;
  border-color: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .entry-item:hover {
  background: #252525;
}

.entry-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.entry-name {
  font-size: 0.875rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.entry-filter-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary, #F5E6D3);
  border: 1px solid transparent;
  border-radius: 1rem;
  color: var(--text-muted, #78716C);
  cursor: pointer;
  transition: all 0.15s;
}

.entry-filter-btn:hover {
  background: var(--color-accent, #B45309);
  border-color: var(--color-accent, #B45309);
  color: white;
}

.filter-icon-sm {
  width: 0.75rem;
  height: 0.75rem;
}

[data-theme="dark"] .entry-filter-btn {
  background: #333;
  color: #888;
}

[data-theme="dark"] .entry-filter-btn:hover {
  background: var(--color-accent-light, #D97706);
  border-color: var(--color-accent-light, #D97706);
  color: #1a1a1a;
}

.entry-summary {
  font-size: 0.75rem;
  color: var(--text-muted, #78716C);
  line-height: 1.4;
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

/* Transitions */
.subcats-enter-active,
.subcats-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.subcats-enter-from,
.subcats-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
