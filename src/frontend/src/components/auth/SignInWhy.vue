<script setup lang="ts">
// One sentence under a "Sign in to report" button: why we ask for a Google
// sign-in (spam only) and the e-mail alternative (owner ruling A-49, 2026-11-10).
// The address is the project contact used in the footer, about and privacy pages.
import { computed } from 'vue';
import { useI18n, type SupportedLocale } from '../../i18n';

const props = defineProps<{ pageLocale?: SupportedLocale }>();
const { t } = useI18n(props.pageLocale);

const CONTACT_EMAIL = 'kerray@archetypal.cz';
// The message keeps a literal {email} placeholder, replaced here by a link.
const parts = computed(() => {
  const [before, after = ''] = t('auth.signInWhy').split('{email}');
  return { before, after };
});
</script>

<template>
  <p class="sign-in-why">{{ parts.before }}<a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>{{ parts.after }}</p>
</template>

<style scoped>
.sign-in-why {
  margin: 0.125rem 0.75rem 0.375rem;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--text-muted, #5C5650);
}
.sign-in-why a {
  color: var(--color-accent, #9A4707);
  text-decoration: underline;
  word-break: break-all;
}
</style>
