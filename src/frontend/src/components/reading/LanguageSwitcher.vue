<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../i18n';

const { t } = useI18n();

/**
 * LanguageSwitcher Component
 *
 * Shows ALL possible content languages. Available ones are clickable links;
 * unavailable ones are greyed out with a tooltip and link to /about.
 *
 * IMPORTANT: This component works with content path codes, not UI locale codes:
 * - currentLanguage: 'cz', 'fr', 'en', 'uk', '_original' (content paths used in URLs)
 * - NOT 'cs' (which is the UI locale code for Czech)
 *
 * The mapping is handled internally:
 * - 'cz' → 'CZ' label
 * - URLs use content paths: /cz/, /fr/, /en/, /uk/, /original/
 */

/** All content languages the project supports, in display order */
const ALL_LANGUAGES = ['cz', 'en', 'uk', 'fr', '_original'] as const;

interface Props {
  currentLanguage: string;
  carnet: string;
  entryDate?: string;
  availableLanguages: string[];
}

const props = defineProps<Props>();

const availableSet = computed(() => new Set(props.availableLanguages));

function isAvailable(lang: string): boolean {
  return availableSet.value.has(lang);
}

const currentParagraphId = ref<string | null>(null);

function findVisibleParagraph(): string | null {
  const paragraphs = document.querySelectorAll('[data-paragraph-id]');
  const viewportTop = window.scrollY + 100; // Account for header

  for (const para of paragraphs) {
    const rect = para.getBoundingClientRect();
    const paraTop = rect.top + window.scrollY;

    if (paraTop >= viewportTop - 50) {
      return (para as HTMLElement).dataset.paragraphId || null;
    }
  }

  // If no paragraph found, return the first one
  const first = paragraphs[0] as HTMLElement;
  return first?.dataset.paragraphId || null;
}

function updateCurrentParagraph() {
  currentParagraphId.value = findVisibleParagraph();
}

function getLanguageUrl(lang: string): string {
  const langPrefix = lang === '_original' ? '/original' : `/${lang}`;
  const basePath = props.entryDate
    ? `${langPrefix}/${props.carnet}/${props.entryDate}`
    : `${langPrefix}/${props.carnet}`;

  // Add paragraph hash if we have one
  if (currentParagraphId.value) {
    const htmlId = `p-${currentParagraphId.value.replace('.', '-')}`;
    return `${basePath}#${htmlId}`;
  }

  return basePath;
}

function getLanguageLabel(lang: string): string {
  if (lang === '_original') return 'Orig';
  // NOTE: 'cz' is the content path (for URLs like /cz/), displays as 'CZ'
  // The UI locale code is 'cs', but we don't use it here
  if (lang === 'cz') return 'CZ';
  return lang.toUpperCase();
}

function getTitle(lang: string): string {
  if (lang === '_original') return t('language.original');
  return t('language.translation', { lang: getLanguageLabel(lang) });
}

let scrollTimeout: number | null = null;

function handleScroll() {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = window.setTimeout(updateCurrentParagraph, 100);
}

onMounted(() => {
  updateCurrentParagraph();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});
</script>

<template>
  <div class="language-switcher">
    <template v-for="lang in ALL_LANGUAGES" :key="lang">
      <!-- Current language: highlighted -->
      <span v-if="lang === currentLanguage" class="lang-current">
        {{ getLanguageLabel(lang) }}
      </span>

      <!-- Available but not current: clickable link -->
      <a
        v-else-if="isAvailable(lang)"
        :href="getLanguageUrl(lang)"
        class="lang-link"
        :title="getTitle(lang)"
      >
        {{ getLanguageLabel(lang) }}
      </a>

      <!-- Unavailable: greyed out, links to /about -->
      <a
        v-else
        href="/about"
        class="lang-unavailable"
        :title="t('language.unavailable')"
      >
        {{ getLanguageLabel(lang) }}
      </a>
    </template>
  </div>
</template>

<style scoped>
.language-switcher {
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
</style>
