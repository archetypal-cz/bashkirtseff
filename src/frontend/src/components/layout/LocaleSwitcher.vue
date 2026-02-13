<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n, LOCALE_NAMES, SUPPORTED_LOCALES, localeToContentPath, type SupportedLocale } from '../../i18n';
import { DIARY_LANGUAGES } from '../../lib/diary-lang-config';

const { locale, setLocale } = useI18n();

// Set of active content URL paths (e.g. 'cz', 'original')
const activeContentPaths = new Set(DIARY_LANGUAGES.map(l => l.urlPath));
const isOpen = ref(false);

const currentLocaleName = computed(() => LOCALE_NAMES[locale.value]);

// Get browser language preferences and sort supported locales accordingly
// Browser languages at top, in their preference order, then remaining languages
const sortedLocales = computed(() => {
  const browserLangs = typeof navigator !== 'undefined'
    ? (navigator.languages || [navigator.language]).map(l => {
        const code = l.toLowerCase().split('-')[0];
        return code === 'cz' ? 'cs' : code; // normalize cz -> cs
      })
    : [];

  // Separate browser-preferred and other locales
  const preferred: SupportedLocale[] = [];
  const others: SupportedLocale[] = [];

  for (const loc of SUPPORTED_LOCALES) {
    if (browserLangs.includes(loc)) {
      preferred.push(loc);
    } else {
      others.push(loc);
    }
  }

  // Sort preferred by their position in browser preferences
  preferred.sort((a, b) => browserLangs.indexOf(a) - browserLangs.indexOf(b));

  return [...preferred, ...others];
});

// Check if a locale is a browser-preferred language
function isBrowserPreferred(loc: SupportedLocale): boolean {
  const browserLangs = typeof navigator !== 'undefined'
    ? (navigator.languages || [navigator.language]).map(l => {
        const code = l.toLowerCase().split('-')[0];
        return code === 'cz' ? 'cs' : code;
      })
    : [];
  return browserLangs.includes(loc);
}

function selectLocale(newLocale: SupportedLocale) {
  setLocale(newLocale);
  isOpen.value = false;

  const path = window.location.pathname;

  // Diary content pages: /cz/..., /original/..., /en/..., /uk/..., /fr/...
  // Navigate to the equivalent content path for the new locale (only if pages exist)
  const diaryMatch = path.match(/^\/(cz|original|en|uk|fr)(\/.*)?$/);
  if (diaryMatch) {
    const rest = diaryMatch[2] || '';
    // fr locale → /original/ (French originals); others use localeToContentPath
    const newContentPath = newLocale === 'fr' ? 'original' : localeToContentPath(newLocale);
    // Only navigate if that content path has generated pages
    if (activeContentPaths.has(newContentPath)) {
      window.location.href = `/${newContentPath}${rest}`;
      return;
    }
    // No pages for this locale — just reload with new UI locale
    window.location.reload();
    return;
  }

  // Static locale-parameterized pages
  const homeMatch = path.match(/^\/home\/(cs|en|fr|uk)\/?$/);
  const aboutMatch = path.match(/^\/(cs|en|fr|uk)\/about\/?$/);
  const marieMatch = path.match(/^\/(cs|en|fr|uk)\/marie\/?$/);

  if (homeMatch) {
    window.location.href = `/home/${newLocale}/`;
  } else if (aboutMatch) {
    window.location.href = `/${newLocale}/about`;
  } else if (marieMatch) {
    window.location.href = `/${newLocale}/marie`;
  } else {
    // For other pages, reload to apply client-side locale change
    window.location.reload();
  }
}

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function closeDropdown() {
  isOpen.value = false;
}

// Close on click outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.locale-switcher')) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="locale-switcher">
    <button
      @click="toggleDropdown"
      class="locale-toggle"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="locale-label">{{ locale.toUpperCase() }}</span>
      <svg class="w-3 h-3 chevron" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="locale-dropdown" role="listbox">
        <button
          v-for="loc in sortedLocales"
          :key="loc"
          @click="selectLocale(loc)"
          class="locale-option"
          :class="{ active: loc === locale, preferred: isBrowserPreferred(loc) }"
          role="option"
          :aria-selected="loc === locale"
        >
          <span class="locale-code">{{ loc.toUpperCase() }}</span>
          <span class="locale-name">{{ LOCALE_NAMES[loc] }}</span>
          <svg v-if="isBrowserPreferred(loc) && loc !== locale" class="w-3 h-3 browser-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Browser language">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <svg v-if="loc === locale" class="w-4 h-4 check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.locale-switcher {
  position: relative;
}

.locale-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary, #4A3728);
  background: transparent;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.locale-toggle:hover {
  background: var(--bg-primary, #FFF8F0);
  border-color: var(--color-accent, #B45309);
}

[data-theme="dark"] .locale-toggle {
  color: #a3a3a3;
  border-color: rgba(255, 255, 255, 0.15);
}

[data-theme="dark"] .locale-toggle:hover {
  background: #252525;
}

.locale-label {
  font-weight: 500;
  min-width: 1.5rem;
}

.chevron {
  transition: transform 0.2s;
}

.locale-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  min-width: 140px;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

[data-theme="dark"] .locale-dropdown {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.15);
}

.locale-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--text-primary, #2C1810);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.locale-option:hover {
  background: var(--bg-secondary, #F5E6D3);
}

.locale-option.active {
  color: var(--color-accent, #B45309);
}

[data-theme="dark"] .locale-option {
  color: #e5e5e5;
}

[data-theme="dark"] .locale-option:hover {
  background: #252525;
}

.locale-code {
  font-weight: 600;
  min-width: 1.5rem;
}

.locale-name {
  flex: 1;
  color: var(--text-secondary, #4A3728);
}

[data-theme="dark"] .locale-name {
  color: #a3a3a3;
}

.check {
  color: var(--color-accent, #B45309);
}

.browser-icon {
  color: var(--text-muted, #8B7355);
  opacity: 0.7;
}

.locale-option.preferred {
  border-left: 2px solid var(--color-accent, #B45309);
  padding-left: calc(0.75rem - 2px);
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
