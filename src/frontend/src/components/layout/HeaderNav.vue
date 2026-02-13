<script setup lang="ts">
import { computed } from 'vue';
import { useI18n, getTranslationHref } from '../../i18n';

const { t, locale } = useI18n();
const translationHref = computed(() => getTranslationHref(locale.value));
</script>

<template>
  <nav class="hidden md:flex items-center gap-6">
    <a :href="translationHref" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.translation') }}
    </a>
    <a href="/original" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.original') }}
    </a>
    <a href="/glossary" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.glossary') }}
    </a>
    <a href="/marie" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.marie') }}
    </a>
    <a href="/about" class="text-ink-light hover:text-accent transition-colors">
      {{ t('nav.about') }}
    </a>
  </nav>
</template>
