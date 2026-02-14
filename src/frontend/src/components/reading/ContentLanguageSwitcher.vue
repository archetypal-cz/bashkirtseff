<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../../i18n';
import { DIARY_LANGUAGES } from '../../lib/diary-lang-config';
import { trackEvent } from '../../lib/analytics';

/**
 * ContentLanguageSwitcher — switches between content languages on browsing pages.
 *
 * Used on year overview, year detail, and carnet detail pages.
 * Unlike LanguageSwitcher.vue (entry-level, with scroll tracking),
 * this just swaps the lang prefix in the URL.
 *
 * Props use content path codes ('cz', 'en', 'uk', 'fr', 'original'),
 * NOT UI locale codes ('cs').
 */

const ALL_LANGUAGES = ['cz', 'en', 'uk', 'fr', '_original'] as const;

interface Props {
  currentLanguage: string;  // 'cz', 'en', 'uk', 'fr', 'original'
  pathSuffix: string;       // e.g., '/001/', '/1877/', '/'
}

const props = defineProps<Props>();
const { t } = useI18n();

// Active content URL paths from DIARY_LANGUAGES
const activeContentPaths = new Set(DIARY_LANGUAGES.map(l =>
  l.contentPath === '_original' ? '_original' : l.urlPath
));

// Normalize currentLanguage for comparison (original → _original)
const normalizedCurrent = computed(() =>
  props.currentLanguage === 'original' ? '_original' : props.currentLanguage
);

function isAvailable(lang: string): boolean {
  return activeContentPaths.has(lang);
}

function getLanguageUrl(lang: string): string {
  const langPrefix = lang === '_original' ? '/original' : `/${lang}`;
  return `${langPrefix}${props.pathSuffix}`;
}

function getLanguageLabel(lang: string): string {
  if (lang === '_original') return '';
  if (lang === 'cz') return 'CZ';
  return lang.toUpperCase();
}

function getTitle(lang: string): string {
  if (lang === '_original') return t('language.original');
  return t('language.translation', { lang: getLanguageLabel(lang) });
}
</script>

<template>
  <div class="content-lang-switcher">
    <template v-for="lang in ALL_LANGUAGES" :key="lang">
      <!-- Current language: highlighted -->
      <span v-if="lang === normalizedCurrent" class="lang-current">
        <svg v-if="lang === '_original'" class="globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="1.5"/><path stroke-width="1.5" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <template v-else>{{ getLanguageLabel(lang) }}</template>
      </span>

      <!-- Available but not current: clickable link -->
      <a
        v-else-if="isAvailable(lang)"
        :href="getLanguageUrl(lang)"
        class="lang-link"
        :title="getTitle(lang)"
        @click="trackEvent('content_lang_switch', { from: currentLanguage, to: lang })"
      >
        <svg v-if="lang === '_original'" class="globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="1.5"/><path stroke-width="1.5" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <template v-else>{{ getLanguageLabel(lang) }}</template>
      </a>

      <!-- Unavailable: greyed out -->
      <a
        v-else
        href="/about"
        class="lang-unavailable"
        :title="t('language.unavailable')"
      >
        <svg v-if="lang === '_original'" class="globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="1.5"/><path stroke-width="1.5" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <template v-else>{{ getLanguageLabel(lang) }}</template>
      </a>
    </template>
  </div>
</template>

<style scoped>
.content-lang-switcher {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.lang-link {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: var(--text-secondary, #4A3728);
  text-decoration: none;
  font-size: 0.875rem;
  transition: background-color 0.2s, color 0.2s;
}

.lang-link:hover {
  background: var(--bg-secondary, #F5E6D3);
  color: var(--text-primary, #2C1810);
}

[data-theme="dark"] .lang-link {
  color: #a3a3a3;
}

[data-theme="dark"] .lang-link:hover {
  background: #252525;
  color: #e5e5e5;
}

.lang-current {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: var(--color-accent, #B45309);
  color: white;
  font-size: 0.875rem;
}

.lang-unavailable {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-decoration: none;
  opacity: 0.35;
  color: var(--text-secondary, #4A3728);
  cursor: help;
  transition: opacity 0.2s;
}

.lang-unavailable:hover {
  opacity: 0.55;
}

[data-theme="dark"] .lang-unavailable {
  color: #a3a3a3;
}

.globe-icon {
  width: 1rem;
  height: 1rem;
  stroke-width: 1.5;
}
</style>
