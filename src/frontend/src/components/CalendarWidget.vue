<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  year: number;
  month: number; // 1-12
  entryDates: string[]; // ISO dates like ['1873-01-11', '1873-01-15']
  selectedDate?: string;
  carnet: string;
  language: string; // 'cz' or 'original'
  compact?: boolean;
}

const props = defineProps<Props>();

// Czech month names
const CZECH_MONTHS = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'
];

// Day labels (Mon-Sun)
const DAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

// Build base path for links
const basePath = computed(() => {
  return props.language === '_original' || props.language === 'original'
    ? '/original'
    : `/${props.language}`;
});

// Get month name in Czech
const monthName = computed(() => CZECH_MONTHS[props.month - 1]);

// Create a set for O(1) lookup of entry dates
const entryDateSet = computed(() => new Set(props.entryDates));

// Check if a date has an entry
function hasEntry(dateStr: string): boolean {
  return entryDateSet.value.has(dateStr);
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
  return `${basePath.value}/${props.carnet}/${dateStr}`;
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
      <span v-for="label in DAY_LABELS" :key="label" class="day-label">
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
            :class="{ 'is-selected': isSelected(dayInfo.dateStr) }"
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
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

/* Compact variant */
.calendar-compact {
  padding: 0.75rem;
}

.calendar-compact .calendar-header {
  margin-bottom: 0.5rem;
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
  color: #e5e5e5;
}

.calendar-year {
  font-size: 0.875rem;
  color: var(--text-muted, #78716C);
}

[data-theme="dark"] .calendar-year {
  color: #a3a3a3;
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
  color: var(--text-muted, #78716C);
  text-align: center;
  padding: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

[data-theme="dark"] .day-label {
  color: #a3a3a3;
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
  color: #737373;
}

/* Days from other months */
.calendar-day.other-month {
  color: var(--text-muted, #78716C);
  opacity: 0.4;
}

[data-theme="dark"] .calendar-day.other-month {
  color: #525252;
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
  color: #e5e5e5;
  background: #252525;
}

.calendar-day.has-entry:hover {
  background: var(--color-accent, #B45309);
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
  background: var(--color-accent, #B45309);
}

[data-theme="dark"] .entry-indicator {
  background: #D97706;
}

/* Selected date */
.calendar-day.is-selected {
  background: var(--color-accent, #B45309);
  color: white;
  font-weight: 600;
}

.calendar-day.is-selected .entry-indicator {
  background: rgba(255, 255, 255, 0.8);
}

.calendar-day.is-selected:hover {
  background: var(--color-accent-dark, #92400E);
}
</style>
