<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface ThisDayEntry {
  date: string;           // Full date: "1873-02-04"
  year: number;           // Year: 1873
  carnet: string;         // Carnet ID: "001"
  preview: string;        // Preview excerpt from entry
  marieAge: number;       // Marie's age at this entry
  hasTranslation: boolean; // Whether translation exists
}

interface Props {
  // Map of "MM-DD" -> array of entries for that day
  thisDayData: Record<string, ThisDayEntry[]>;
  // Language path for links (e.g., 'cz', 'original')
  languagePath: string;
  // UI translations
  translations: {
    title: string;           // "This Day in Marie's Life"
    onThisDay: string;       // "On this day in {year}"
    marieWas: string;        // "Marie was {age}"
    readFullEntry: string;   // "Read full entry"
    noEntryToday: string;    // "No diary entry for this date"
    yearsOld: string;        // "years old" (suffix for age)
  };
}

const props = defineProps<Props>();

// The date being browsed (calendar date, independent of entries)
const browsingDate = ref<Date>(new Date());
// Current entry to display
const selectedEntry = ref<ThisDayEntry | null>(null);
const currentMonthDay = ref<string>('');
const isLoading = ref(true);

// Format the browsing date for display (day + month only, no year)
const browsingDateFormatted = computed(() => {
  const d = browsingDate.value;
  if (props.languagePath === 'cz') {
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });
  }
  if (props.languagePath === 'fr' || props.languagePath === 'original') {
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  }
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
});

// Format the entry date for display (with year)
const formattedDateLocalized = computed(() => {
  if (!selectedEntry.value) return '';
  const date = new Date(selectedEntry.value.date);
  if (props.languagePath === 'cz') {
    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (props.languagePath === 'fr' || props.languagePath === 'original') {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

// Build the link to the entry
const entryLink = computed(() => {
  if (!selectedEntry.value) return '#';
  const basePath = props.languagePath === 'original' ? '/original' : `/${props.languagePath}`;
  return `${basePath}/${selectedEntry.value.carnet}/${selectedEntry.value.date}`;
});

// Replace placeholders in translation strings
function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

// Get "On this day in {year}" text
const onThisDayText = computed(() => {
  if (!selectedEntry.value) return '';
  return formatMessage(props.translations.onThisDay, { year: selectedEntry.value.year });
});

// Get "Marie was {age}" text
const marieAgeText = computed(() => {
  if (!selectedEntry.value) return '';
  return formatMessage(props.translations.marieWas, { age: selectedEntry.value.marieAge });
});

// All entries for the current browsing date
const entriesForDate = computed(() => {
  return props.thisDayData[currentMonthDay.value] || [];
});

// Select entry for the current browsing date
function selectEntryForDate() {
  const month = String(browsingDate.value.getMonth() + 1).padStart(2, '0');
  const day = String(browsingDate.value.getDate()).padStart(2, '0');
  currentMonthDay.value = `${month}-${day}`;

  const entries = entriesForDate.value;

  if (entries.length > 0) {
    const translatedEntries = entries.filter(e => e.hasTranslation);
    const pool = translatedEntries.length > 0 ? translatedEntries : entries;

    // Use day of year as seed for consistent selection
    const dayOfYear = Math.floor(
      (browsingDate.value.getTime() - new Date(browsingDate.value.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % pool.length;

    selectedEntry.value = pool[index];
  } else {
    selectedEntry.value = null;
  }

  isLoading.value = false;
}

function goToPrevDay() {
  const d = new Date(browsingDate.value);
  d.setDate(d.getDate() - 1);
  browsingDate.value = d;
  selectEntryForDate();
}

function goToNextDay() {
  const d = new Date(browsingDate.value);
  d.setDate(d.getDate() + 1);
  browsingDate.value = d;
  selectEntryForDate();
}

onMounted(() => {
  selectEntryForDate();
});
</script>

<template>
  <div class="this-day-container">
    <!-- Loading state -->
    <div v-if="isLoading" class="this-day-loading">
      <div class="loading-pulse"></div>
    </div>

    <template v-else>
      <!-- Day navigation header -->
      <div class="day-nav">
        <button class="day-nav-btn" @click="goToPrevDay" :aria-label="'Previous day'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 class="day-nav-date">{{ browsingDateFormatted }}</h3>

        <button class="day-nav-btn" @click="goToNextDay" :aria-label="'Next day'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Entry found -->
      <div v-if="selectedEntry" class="this-day-card">
        <div class="this-day-header">
          <h3 class="this-day-title">{{ translations.title }}</h3>
          <div class="this-day-meta">
            <span class="this-day-date">{{ formattedDateLocalized }}</span>
            <span class="this-day-age">{{ marieAgeText }} {{ translations.yearsOld }}</span>
          </div>
        </div>

        <blockquote class="this-day-quote">
          <p>{{ selectedEntry.preview }}</p>
        </blockquote>

        <a :href="entryLink" class="this-day-link">
          {{ translations.readFullEntry }}
          <svg class="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      <!-- No entry for this day -->
      <div v-else class="this-day-empty">
        <p class="empty-message">{{ translations.noEntryToday }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.this-day-container {
  max-width: 800px;
  margin: 0 auto;
}

.this-day-loading {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.loading-pulse {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--color-accent, #B45309);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1); opacity: 1; }
}

/* Day navigation */
.day-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.day-nav-date {
  font-family: var(--font-serif, Georgia, serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-accent, #B45309);
  margin: 0;
  min-width: 10rem;
  text-align: center;
  letter-spacing: 0.025em;
}

[data-theme="dark"] .day-nav-date {
  color: #D97706;
}

.day-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 50%;
  background: transparent;
  color: var(--color-accent, #B45309);
  cursor: pointer;
  transition: all 0.2s ease;
}

.day-nav-btn:hover {
  background: var(--color-accent, #B45309);
  color: white;
  border-color: var(--color-accent, #B45309);
}

[data-theme="dark"] .day-nav-btn {
  border-color: rgba(255, 255, 255, 0.15);
  color: #D97706;
}

[data-theme="dark"] .day-nav-btn:hover {
  background: #D97706;
  color: #1a1a1a;
  border-color: #D97706;
}

.day-nav-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.this-day-card {
  background: linear-gradient(135deg, var(--bg-primary, #FFF8F0) 0%, var(--bg-secondary, #F5E6D3) 100%);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.75rem;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .this-day-card {
  background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
  border-color: rgba(255, 255, 255, 0.1);
}

.this-day-header {
  margin-bottom: 1.25rem;
  text-align: center;
}

.this-day-title {
  font-family: var(--font-serif, Georgia, serif);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-accent, #B45309);
  margin: 0 0 0.75rem 0;
  letter-spacing: 0.025em;
}

[data-theme="dark"] .this-day-title {
  color: #D97706;
}

.this-day-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}

.this-day-date {
  font-family: var(--font-serif, Georgia, serif);
  font-size: 1.125rem;
  color: var(--text-primary, #2C1810);
  font-style: italic;
}

[data-theme="dark"] .this-day-date {
  color: #e5e5e5;
}

.this-day-age {
  font-size: 0.875rem;
  color: var(--text-muted, #78716C);
}

[data-theme="dark"] .this-day-age {
  color: #a3a3a3;
}

.this-day-quote {
  margin: 1.25rem 0;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.5);
  border-left: 3px solid var(--color-accent, #B45309);
  border-radius: 0 0.5rem 0.5rem 0;
}

[data-theme="dark"] .this-day-quote {
  background: rgba(0, 0, 0, 0.2);
}

.this-day-quote p {
  font-family: var(--font-serif, Georgia, serif);
  font-size: 1rem;
  line-height: 1.75;
  color: var(--text-secondary, #4A3728);
  margin: 0;
  font-style: italic;
}

[data-theme="dark"] .this-day-quote p {
  color: #d4d4d4;
}

.this-day-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-accent, #B45309);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

.this-day-link:hover {
  color: var(--color-accent-dark, #92400E);
}

[data-theme="dark"] .this-day-link {
  color: #D97706;
}

[data-theme="dark"] .this-day-link:hover {
  color: #F59E0B;
}

.link-arrow {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

.this-day-link:hover .link-arrow {
  transform: translateX(3px);
}

.this-day-empty {
  text-align: center;
  padding: 2rem;
  background: var(--bg-secondary, #F5E6D3);
  border-radius: 0.75rem;
}

[data-theme="dark"] .this-day-empty {
  background: #252525;
}

.empty-message {
  color: var(--text-muted, #78716C);
  font-style: italic;
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .this-day-card {
    padding: 1.25rem 1.5rem;
  }

  .this-day-title {
    font-size: 1.125rem;
  }

  .this-day-date {
    font-size: 1rem;
  }

  .this-day-quote {
    padding: 0.875rem 1rem;
  }

  .this-day-quote p {
    font-size: 0.9375rem;
  }

  .day-nav-date {
    font-size: 1rem;
    min-width: 8rem;
  }
}
</style>
