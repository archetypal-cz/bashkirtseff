<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n, getTranslationHref, getOriginalHref, glossaryHref, pageHref } from '../../i18n';

const { t, locale } = useI18n();
const currentPath = ref('');

onMounted(() => {
  currentPath.value = window.location.pathname;
});

const translationHref = computed(() => getTranslationHref(locale.value, currentPath.value || undefined));
const originalHref = computed(() => getOriginalHref(currentPath.value || undefined));
// A staged locale (no diary pages of its own yet) gets the French source as its
// translation href — hide the duplicate link rather than show the same target twice.
const hasOwnTranslation = computed(() => translationHref.value !== originalHref.value);
const glossaryLink = computed(() => glossaryHref(currentPath.value || undefined));
const marieHref = computed(() => pageHref('marie', locale.value));
const aboutHref = computed(() => pageHref('about', locale.value));
</script>

<template>
  <nav class="hidden md:flex items-center gap-6" :aria-label="t('a11y.mainNav')">
    <a v-if="hasOwnTranslation" :href="translationHref" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.translation') }}
    </a>
    <a :href="originalHref" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.original') }}
    </a>
    <a :href="glossaryLink" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.glossary') }}
    </a>
    <a :href="marieHref" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.marie') }}
    </a>
    <a :href="aboutHref" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.about') }}
    </a>
  </nav>
</template>
