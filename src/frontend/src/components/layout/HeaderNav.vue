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
const glossaryLink = computed(() => glossaryHref(currentPath.value || undefined));
const marieHref = computed(() => pageHref('marie', locale.value));
const aboutHref = computed(() => pageHref('about', locale.value));
</script>

<template>
  <nav class="hidden md:flex items-center gap-6">
    <a :href="translationHref" class="text-ink-light hover:text-accent transition-colors">
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
