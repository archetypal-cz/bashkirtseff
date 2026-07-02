<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from '../../i18n';
import { useAuthStore } from '../../stores/auth';
import { submitReport } from '../../lib/reports';
import { trackEvent } from '../../lib/analytics';
import type { ReportReason } from '../../lib/reports';

const { t } = useI18n();
const auth = useAuthStore();

const props = defineProps<{
  paragraphId: string;
  language: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const mounted = ref(false);
const isOpen = ref(false);
const selectedReason = ref<ReportReason | null>(null);
const dropdownOpen = ref(false);
const customText = ref('');
const highlightedText = ref('');
const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

const reasons: ReportReason[] = [
  'bad_translation',
  'unnatural',
  'missing_text',
  'wrong_language',
  'factual_error',
  'typo',
  'other',
];

const canSubmit = computed(() => {
  if (!selectedReason.value) return false;
  if (selectedReason.value === 'other' && !customText.value.trim()) return false;
  return true;
});

/** Placeholder text changes based on selected reason */
const textPlaceholder = computed(() => {
  if (!selectedReason.value) return '';
  const key = `report.placeholders.${selectedReason.value}`;
  const val = t(key);
  // Fall back to generic if specific placeholder doesn't exist
  return val === key ? t('report.textPlaceholder') : val;
});

/** Label changes based on reason */
const textLabel = computed(() => {
  if (selectedReason.value === 'other') return t('report.describeIssue');
  return t('report.optionalDetail');
});

function open(preselectedText?: string) {
  isOpen.value = true;
  selectedReason.value = null;
  customText.value = '';
  highlightedText.value = preselectedText?.trim() || '';
  submitted.value = false;
  error.value = '';
  dropdownOpen.value = false;
  trackEvent('report_sheet_opened', { paragraphId: props.paragraphId, language: props.language });
}

function close() {
  isOpen.value = false;
  dropdownOpen.value = false;
  emit('close');
}

function selectReason(reason: ReportReason) {
  selectedReason.value = reason;
  dropdownOpen.value = false;
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

async function submit() {
  if (!canSubmit.value || !auth.token) return;

  submitting.value = true;
  error.value = '';

  try {
    await submitReport(
      {
        paragraphId: props.paragraphId,
        language: props.language,
        reason: selectedReason.value!,
        customReason: selectedReason.value === 'other' ? customText.value.trim() : undefined,
        highlightedText: highlightedText.value || (selectedReason.value !== 'other' && customText.value.trim()
          ? customText.value.trim()
          : undefined) || undefined,
      },
      auth.token,
    );
    submitted.value = true;
    trackEvent('report_submitted', {
      paragraphId: props.paragraphId,
      reason: selectedReason.value!,
    });
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    submitting.value = false;
  }
}

// Close dropdown on outside click
function onBackdropClick() {
  if (dropdownOpen.value) {
    dropdownOpen.value = false;
    return;
  }
  close();
}

onMounted(() => {
  mounted.value = true;
});

defineExpose({ open });
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <Transition name="report-modal">
      <div v-if="isOpen" class="sheet-backdrop" @click="onBackdropClick">
        <div class="sheet-content" @click.stop>
          <!-- Close button -->
          <button @click="close" class="menu-item close-item">
            <svg class="menu-item__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{{ t('common.close') }}</span>
          </button>

          <!-- Header -->
          <div class="sheet-header">
            <span class="sheet-header__title">{{ t('report.title') }}</span>
            <span class="sheet-header__id">{{ paragraphId }}</span>
          </div>

          <!-- Success state -->
          <div v-if="submitted" class="report-success">
            <svg class="report-success__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <p>{{ t('report.submitted') }}</p>
            <button @click="close" class="report-btn report-btn--done">{{ t('common.close') }}</button>
          </div>

          <!-- Report form -->
          <div v-else class="report-form">
            <p class="report-form__desc">{{ t('report.description') }}</p>

            <!-- Highlighted text from selection -->
            <div v-if="highlightedText" class="report-selection">
              <span class="report-selection__label">{{ t('report.selectedText') }}</span>
              <blockquote class="report-selection__text">&ldquo;{{ highlightedText }}&rdquo;</blockquote>
            </div>

            <!-- Reason dropdown (opens upward) -->
            <div class="reason-dropdown">
              <button
                @click="toggleDropdown"
                class="reason-dropdown__trigger"
                :class="{ 'reason-dropdown__trigger--active': dropdownOpen, 'reason-dropdown__trigger--selected': selectedReason }"
              >
                <span>{{ selectedReason ? t(`report.reasons.${selectedReason}`) : t('report.chooseReason') }}</span>
                <svg class="reason-dropdown__chevron" :class="{ 'reason-dropdown__chevron--up': dropdownOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <Transition name="dropdown-slide">
                <div v-if="dropdownOpen" class="reason-dropdown__menu">
                  <button
                    v-for="reason in reasons"
                    :key="reason"
                    @click="selectReason(reason)"
                    class="reason-dropdown__item"
                    :class="{ 'reason-dropdown__item--selected': selectedReason === reason }"
                  >
                    {{ t(`report.reasons.${reason}`) }}
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Detail text (adapts to reason) -->
            <div v-if="selectedReason" class="report-text">
              <label class="report-text__label">{{ textLabel }}</label>
              <textarea
                v-model="customText"
                class="report-text__input"
                :placeholder="textPlaceholder"
                rows="3"
                maxlength="1000"
              />
            </div>

            <!-- Error -->
            <p v-if="error" class="report-error">{{ error }}</p>

            <!-- Submit -->
            <button
              @click="submit"
              :disabled="!canSubmit || submitting"
              class="report-btn report-btn--submit"
            >
              {{ submitting ? t('common.loading') : t('report.submit') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}

.sheet-content {
  width: 100%;
  max-width: 32rem;
  margin: 0 auto;
  max-height: 80vh;
  background: var(--bg-primary, #FFF8F0);
  border-radius: 1rem 1rem 0 0;
  padding: 1rem;
  overflow-y: auto;
}

[data-theme="dark"] .sheet-content {
  background: #1a1a1a;
}

[data-theme="sepia"] .sheet-content {
  background: #F5E6D3;
}

.close-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent, #9A4707);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  margin-bottom: 0.5rem;
  padding-bottom: 0.75rem;
  cursor: pointer;
  text-align: left;
}

.menu-item__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.sheet-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.5rem 0;
  margin-bottom: 0.75rem;
}

.sheet-header__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #2C1810);
}

[data-theme="dark"] .sheet-header__title {
  color: #e5e5e5;
}

.sheet-header__id {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-muted, #5C5650);
}

.report-form__desc {
  font-size: 0.8125rem;
  color: var(--text-muted, #5C5650);
  margin-bottom: 0.75rem;
}

/* ─── Selected text display ────────────────────────────────────────── */

.report-selection {
  margin-bottom: 0.75rem;
}

.report-selection__label {
  display: block;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #5C5650);
  margin-bottom: 0.25rem;
}

.report-selection__text {
  margin: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-style: italic;
  color: var(--text-secondary, #4A3728);
  background: rgba(180, 83, 9, 0.06);
  border-left: 3px solid var(--color-accent, #9A4707);
  border-radius: 0 0.25rem 0.25rem 0;
}

[data-theme="dark"] .report-selection__text {
  color: #c5c5c5;
  background: rgba(180, 83, 9, 0.1);
}

/* ─── Reason dropdown ──────────────────────────────────────────────── */

.reason-dropdown {
  position: relative;
  margin-bottom: 0.75rem;
}

.reason-dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--text-muted, #5C5650);
  background: transparent;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.375rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
}

.reason-dropdown__trigger--selected {
  color: var(--text-primary, #2C1810);
  border-color: var(--color-accent, #9A4707);
}

[data-theme="dark"] .reason-dropdown__trigger {
  color: #a3a3a3;
  border-color: rgba(255, 255, 255, 0.15);
}

[data-theme="dark"] .reason-dropdown__trigger--selected {
  color: #e5e5e5;
  border-color: var(--color-accent, #D97706);
}

.reason-dropdown__trigger--active {
  border-color: var(--color-accent, #9A4707);
}

.reason-dropdown__chevron {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.reason-dropdown__chevron--up {
  transform: rotate(180deg);
}

.reason-dropdown__menu {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.375rem;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 5;
}

[data-theme="dark"] .reason-dropdown__menu {
  background: #222;
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
}

[data-theme="sepia"] .reason-dropdown__menu {
  background: #F5E6D3;
}

.reason-dropdown__item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--text-primary, #2C1810);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.1s;
}

[data-theme="dark"] .reason-dropdown__item {
  color: #e5e5e5;
}

.reason-dropdown__item:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .reason-dropdown__item:hover {
  background: #2a2a2a;
}

.reason-dropdown__item--selected {
  color: var(--color-accent, #9A4707);
  font-weight: 600;
}

.reason-dropdown__item + .reason-dropdown__item {
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.06));
}

/* ─── Text input ───────────────────────────────────────────────────── */

.report-text {
  margin-bottom: 0.75rem;
}

.report-text__label {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-muted, #5C5650);
  margin-bottom: 0.375rem;
}

.report-text__input {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--text-primary, #2C1810);
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.375rem;
  resize: vertical;
}

[data-theme="dark"] .report-text__input {
  color: #e5e5e5;
  background: #222;
  border-color: rgba(255, 255, 255, 0.15);
}

.report-text__input:focus {
  outline: none;
  border-color: var(--color-accent, #9A4707);
}

/* ─── Error, buttons, success ──────────────────────────────────────── */

.report-error {
  font-size: 0.8125rem;
  color: #DC2626;
  margin-bottom: 0.5rem;
}

.report-btn {
  display: block;
  width: 100%;
  padding: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.report-btn--submit {
  color: white;
  background: var(--color-accent, #9A4707);
}

.report-btn--submit:hover:not(:disabled) {
  background: #92400E;
}

.report-btn--submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-btn--done {
  color: var(--text-primary, #2C1810);
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .report-btn--done {
  color: #e5e5e5;
  background: #252525;
}

.report-success {
  text-align: center;
  padding: 1.5rem 0;
}

.report-success__icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #059669;
  margin: 0 auto 0.75rem;
}

.report-success p {
  font-size: 0.9375rem;
  color: var(--text-primary, #2C1810);
  margin-bottom: 1rem;
}

[data-theme="dark"] .report-success p {
  color: #e5e5e5;
}
</style>

<!-- Transition CSS must be unscoped for Teleport -->
<style>
.report-modal-enter-active,
.report-modal-leave-active {
  transition: opacity 0.2s ease;
}

.report-modal-leave-active {
  pointer-events: none;
}

.report-modal-enter-active .sheet-content,
.report-modal-leave-active .sheet-content {
  transition: transform 0.2s ease;
}

.report-modal-enter-from,
.report-modal-leave-to {
  opacity: 0;
}

.report-modal-enter-from .sheet-content,
.report-modal-leave-to .sheet-content {
  transform: translateY(100%);
}

/* Dropdown slide animation */
.dropdown-slide-enter-active,
.dropdown-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-slide-enter-from,
.dropdown-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
