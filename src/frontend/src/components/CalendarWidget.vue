<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useFilterStore } from '../stores/filter';
import { useI18n, type SupportedLocale } from '../i18n';
import { monthName as localMonthName, weekdayLabels } from '../lib/calendar-labels';

interface Props {
  year: number;
  month: number; // 1-12
  entryDates: string[]; // ISO dates like ['1873-01-11', '1873-01-15']
  selectedDate?: string;
  carnet: string;
  language: string; // 'cz' or 'original'
  compact?: boolean;
  pageLocale?: SupportedLocale; // UI locale the server rendered the page in
}

const props = defineProps<Props>();
const { locale } = useI18n(props.pageLocale);
const filterStore = useFilterStore();

// Initialize filter store (reads persisted tags from localStorage).
// H3: only fetch the 833 KB filter index when a filter is actually active
// (the calendar only needs it to highlight filter-matching dates). Otherwise
// it loads on demand when the filter UI is opened.
onMounted(() => {
  filterStore.init();
  if (filterStore.isActive) {
    filterStore.loadIndex();
  }
});

// Day labels (Mon-Sun) in the reader's UI language
const dayLabels = computed(() => weekdayLabels(locale.value));

// Build base path for links
const basePath = computed(() => {
  return props.language === '_original' || props.language === 'original'
    ? '/original'
    : `/${props.language}`;
});

// Month name in the reader's UI language
const monthName = computed(() => localMonthName(props.month, locale.value));

// Create a set for O(1) lookup of entry dates
const entryDateSet = computed(() => new Set(props.entryDates));

// Filter-aware: dates that match the active filter
const isFilterActive = computed(() => filterStore.isActive);
const filteredDateSet = computed(() => {
  if (!filterStore.isActive) return new Set<string>();
  // matchingEntryIds contains date strings like '1873-01-11'
  const matching = filterStore.matchingEntryIds;
  return new Set(props.entryDates.filter(d => matching.has(d)));
});

// Check if a date has an entry
function hasEntry(dateStr: string): boolean {
  return entryDateSet.value.has(dateStr);
}

// Check if a date matches the active filter
function isFilterMatch(dateStr: string): boolean {
  return isFilterActive.value && filteredDateSet.value.has(dateStr);
}

// Check if a date has an entry but doesn't match the filter
function isFilterDim(dateStr: string): boolean {
  return isFilterActive.value && hasEntry(dateStr) && !filteredDateSet.value.has(dateStr);
}

// Check if a date is selected
function isSelected(dateStr: string): boolean {
  return props.selectedDate === dateStr;
}

// Format date to ISO string (YYYY-MM-DD)
function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Build link URL for a date
function getDateUrl(dateStr: string): string {
  return `${basePath.value}/${props.carnet}/${dateStr}/`;
}

// Calendar grid computation
interface CalendarDay {
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
}

const calendarWeeks = computed(() => {
  const weeks: CalendarDay[][] = [];

  // First day of the month
  const firstDay = new Date(props.year, props.month - 1, 1);
  // Last day of the month
  const lastDay = new Date(props.year, props.month, 0);
  const daysInMonth = lastDay.getDate();

  // Day of week for first day (0=Sun, we need Mon=0)
  let startDayOfWeek = firstDay.getDay();
  // Convert to Monday-based (Mon=0, Sun=6)
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Previous month's last days (for leading empty cells)
  const prevMonthLastDay = new Date(props.year, props.month - 1, 0).getDate();

  let currentWeek: CalendarDay[] = [];

  // Add previous month's trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevMonth = props.month - 1;
    const prevYear = prevMonth <= 0 ? props.year - 1 : props.year;
    const actualMonth = prevMonth <= 0 ? 12 : prevMonth;
    currentWeek.push({
      day,
      dateStr: formatDateISO(prevYear, actualMonth, day),
      isCurrentMonth: false
    });
  }

  // Add current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push({
      day,
      dateStr: formatDateISO(props.year, props.month, day),
      isCurrentMonth: true
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add next month's leading days
  if (currentWeek.length > 0) {
    let nextDay = 1;
    while (currentWeek.length < 7) {
      const nextMonth = props.month + 1;
      const nextYear = nextMonth > 12 ? props.year + 1 : props.year;
      const actualMonth = nextMonth > 12 ? 1 : nextMonth;
      currentWeek.push({
        day: nextDay,
        dateStr: formatDateISO(nextYear, actualMonth, nextDay),
        isCurrentMonth: false
      });
      nextDay++;
    }
    weeks.push(currentWeek);
  }

  return weeks;
});
</script>

<template>
  <div class="calendar-widget" :class="{ 'calendar-compact': compact }">
    <!-- Header with month and year -->
    <div class="calendar-header">
      <span class="calendar-month">{{ monthName }}</span>
      <span class="calendar-year">{{ year }}</span>
    </div>

    <!-- Day labels -->
    <div class="calendar-days-header">
      <span v-for="(label, i) in dayLabels" :key="i" class="day-label">
        {{ label }}
      </span>
    </div>

    <!-- Calendar grid -->
    <div class="calendar-grid">
      <div v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex" class="calendar-week">
        <template v-for="dayInfo in week" :key="dayInfo.dateStr">
          <!-- Day with entry - clickable link -->
          <a
            v-if="dayInfo.isCurrentMonth && hasEntry(dayInfo.dateStr)"
            :href="getDateUrl(dayInfo.dateStr)"
            class="calendar-day has-entry"
            :class="{
              'is-selected': isSelected(dayInfo.dateStr),
              'filter-active-match': isFilterMatch(dayInfo.dateStr),
              'filter-active-dim': isFilterDim(dayInfo.dateStr),
            }"
          >
            <span class="day-number">{{ dayInfo.day }}</span>
            <span class="entry-indicator"></span>
          </a>

          <!-- Day without entry - plain text -->
          <span
            v-else-if="dayInfo.isCurrentMonth"
            class="calendar-day no-entry"
          >
            <span class="day-number">{{ dayInfo.day }}</span>
          </span>

          <!-- Days from other months - muted -->
          <span v-else class="calendar-day other-month">
            <span class="day-number">{{ dayInfo.day }}</span>
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-widget {
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: system-ui, -apple-system, sans-serif;
}

[data-theme="dark"] .calendar-widget {
  background: var(--bg-primary);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Compact variant — no own chrome, parent panel provides border/bg */
.calendar-compact {
  padding: 0.25rem 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  flex: 1 1 auto;
  min-width: 160px;
  max-width: 280px;
}

.calendar-compact .calendar-header {
  margin-bottom: 0.25rem;
  padding-bottom: 0.25rem;
  border-bottom-color: rgba(44, 24, 16, 0.06);
}

.calendar-compact .calendar-month {
  font-size: 0.875rem;
}

.calendar-compact .calendar-year {
  font-size: 0.75rem;
}

.calendar-compact .day-label {
  font-size: 0.625rem;
  padding: 0.125rem;
}

.calendar-compact .calendar-day {
  font-size: 0.6875rem;
  aspect-ratio: auto;
  height: 1.625rem;
}

.calendar-compact .entry-indicator {
  width: 3px;
  height: 3px;
  bottom: 1px;
}

/* Header */
.calendar-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

[data-theme="dark"] .calendar-header {
  border-color: rgba(255, 255, 255, 0.1);
}

.calendar-month {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #2C1810);
  text-transform: capitalize;
}

[data-theme="dark"] .calendar-month {
  color: var(--text-primary);
}

.calendar-year {
  font-size: 0.875rem;
  color: var(--text-muted, #5C5650);
}

[data-theme="dark"] .calendar-year {
  color: var(--text-secondary);
}

/* Day labels row */
.calendar-days-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
  margin-bottom: 0.25rem;
}

.day-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-muted, #5C5650);
  text-align: center;
  padding: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

[data-theme="dark"] .day-label {
  color: var(--text-secondary);
}

/* Calendar grid */
.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.125rem;
}

/* Day cells */
.calendar-day {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  font-size: 0.8125rem;
  border-radius: 0.25rem;
  transition: all 0.15s;
}

.day-number {
  position: relative;
  z-index: 1;
}

/* Days without entries */
.calendar-day.no-entry {
  color: var(--text-secondary, #4A3728);
}

[data-theme="dark"] .calendar-day.no-entry {
  color: var(--text-muted);
}

/* Days from other months */
.calendar-day.other-month {
  color: var(--text-muted, #5C5650);
  opacity: 0.4;
}

[data-theme="dark"] .calendar-day.other-month {
  color: color-mix(in srgb, var(--text-muted) 60%, transparent);
}

/* Days with entries */
.calendar-day.has-entry {
  color: var(--text-primary, #2C1810);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .calendar-day.has-entry {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.calendar-day.has-entry:hover {
  background: var(--color-accent, #9A4707);
  color: white;
}

.calendar-day.has-entry:hover .entry-indicator {
  background: rgba(255, 255, 255, 0.8);
}

/* Entry indicator dot */
.entry-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-accent, #9A4707);
}

[data-theme="dark"] .entry-indicator {
  background: #D97706;
}

/* Selected date */
.calendar-day.is-selected {
  background: var(--color-accent, #9A4707);
  color: white;
  font-weight: 600;
}

.calendar-day.is-selected .entry-indicator {
  background: rgba(255, 255, 255, 0.8);
}

.calendar-day.is-selected:hover {
  background: var(--color-accent-dark, #92400E);
}

/* Filter-active states */
.calendar-day.has-entry.filter-active-match {
  background: var(--color-accent, #9A4707);
  color: white;
  font-weight: 600;
}

.calendar-day.has-entry.filter-active-match .entry-indicator {
  background: rgba(255, 255, 255, 0.8);
}

.calendar-day.has-entry.filter-active-dim {
  opacity: 0.3;
  background: transparent;
}

.calendar-day.has-entry.filter-active-dim .entry-indicator {
  display: none;
}

[data-theme="dark"] .calendar-day.has-entry.filter-active-match {
  background: #D97706;
  color: var(--bg-primary);
}

[data-theme="dark"] .calendar-day.has-entry.filter-active-dim {
  opacity: 0.2;
}
</style>
