<script setup lang="ts">
// Page-level "report an issue" for glossary entries. Reports go to the same
// paragraph_reports table as diary reports, keyed `glossary:<ENTRY_ID>`
// (the column is free text; the triage skill maps the key to the entry file).
import { ref, onMounted } from 'vue';
import { useI18n, type SupportedLocale } from '../../i18n';
import { useAuthStore } from '../../stores/auth';
import { trackEvent } from '../../lib/analytics';
import ReportDialog from '../reading/ReportDialog.vue';
import { GLOSSARY_REPORT_REASONS } from '../../lib/reports';

const props = defineProps<{
  entryId: string;
  entryName: string;
  language?: string; // route language; omit for original
  pageLocale?: SupportedLocale; // UI locale the server rendered the page in
}>();

const { t } = useI18n(props.pageLocale);
const auth = useAuthStore();
const mounted = ref(false);
const reportDialog = ref<InstanceType<typeof ReportDialog> | null>(null);

function openReport() {
  const selectedText = window.getSelection()?.toString().trim() || '';
  reportDialog.value?.open(selectedText);
}

function signInToReport() {
  trackEvent('auth_sign_in_click', { source: 'glossary_report' });
  if (!localStorage.getItem('auth-consent')) localStorage.setItem('auth-consent', '1');
  auth.signIn();
}

onMounted(() => {
  mounted.value = true;
  auth.init().catch(() => {});
});
</script>

<template>
  <div v-if="mounted && !auth.offline && !auth.loading" class="glossary-report">
    <ReportDialog
      ref="reportDialog"
      :paragraph-id="`glossary:${props.entryId}`"
      :language="props.language || 'original'"
      :reasons="GLOSSARY_REPORT_REASONS"
      :label="props.entryName"
      :description="t('report.pageDescription')"
    />
    <button v-if="auth.isAuthenticated" type="button" class="glossary-report__btn" @click="openReport">
      <svg class="glossary-report__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
      </svg>
      {{ t('report.reportPage') }}
    </button>
    <button v-else type="button" class="glossary-report__btn glossary-report__btn--muted" @click="signInToReport">
      <svg class="glossary-report__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
      </svg>
      {{ t('report.signInToReportPage') }}
    </button>
  </div>
</template>

<style scoped>
.glossary-report {
  margin-top: 1rem;
}
.glossary-report__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-ink-light, inherit);
  background: transparent;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.glossary-report__btn:hover,
.glossary-report__btn:focus-visible {
  color: var(--color-accent, inherit);
  border-color: currentColor;
}
.glossary-report__btn--muted {
  opacity: 0.8;
}
.glossary-report__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
</style>
