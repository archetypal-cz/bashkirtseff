<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useOfflineStore } from '../../stores/offline';
import { useI18n } from '../../i18n';
import { scopeKey, urlsForScope, estimateSize, formatBytes } from '../../lib/offline';
import type { DownloadScope } from '../../lib/offline';

const props = defineProps<{
  scopeType: 'year' | 'carnet';
  scopeId: string;
  language: string;
}>();

const { t } = useI18n();
const store = useOfflineStore();

const scope = computed<DownloadScope>(() => ({
  type: props.scopeType,
  id: props.scopeId,
  language: props.language,
}));

const record = computed(() => store.getRecord(scope.value));

const isThisScope = computed(() =>
  store.currentScope && scopeKey(store.currentScope) === scopeKey(scope.value)
);

const status = computed(() => {
  if (isThisScope.value && store.isDownloading) return 'downloading';
  return record.value?.status ?? 'none';
});

const entryCount = ref(0);
const sizeEstimate = ref('');

onMounted(async () => {
  store.init();
  // Load entries to compute size estimate
  await store.loadEntries?.();

  // We need access to the entries from the store (they're internal),
  // so we'll use the filter-index directly for the count
  try {
    const res = await fetch('/data/filter-index.json');
    if (res.ok) {
      const data = await res.json();
      const urls = urlsForScope(scope.value, data.entries);
      entryCount.value = urls.length;
      sizeEstimate.value = formatBytes(estimateSize(urls.length));
    }
  } catch {
    /* ignore */
  }
});

async function startDownload() {
  await store.downloadScope(scope.value);
}

function cancel() {
  store.cancelDownload();
}

async function remove() {
  await store.removeScope(scope.value);
}

async function retry() {
  await store.downloadScope(scope.value);
}
</script>

<template>
  <div class="offline-download">
    <!-- Not downloaded -->
    <template v-if="status === 'none'">
      <button @click="startDownload" class="offline-btn offline-btn-download">
        <svg class="offline-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        <span class="offline-label">
          {{ t('offline.download') }}
        </span>
        <span v-if="sizeEstimate" class="offline-meta">
          ~{{ sizeEstimate }}
        </span>
      </button>
    </template>

    <!-- Downloading -->
    <template v-else-if="status === 'downloading'">
      <div class="offline-progress-wrap">
        <div class="offline-progress-bar">
          <div class="offline-progress-fill" :style="{ width: store.progress + '%' }" />
        </div>
        <div class="offline-progress-info">
          <span class="offline-progress-text">{{ store.progress }}%</span>
          <button @click="cancel" class="offline-btn-cancel">
            {{ t('offline.cancel') }}
          </button>
        </div>
      </div>
    </template>

    <!-- Downloaded -->
    <template v-else-if="status === 'complete'">
      <div class="offline-complete">
        <svg class="offline-icon offline-icon-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M5 13l4 4L19 7" />
        </svg>
        <span class="offline-label offline-label-done">
          {{ t('offline.available') }}
        </span>
        <span v-if="record" class="offline-meta">
          {{ formatBytes(record.sizeBytes) }}
        </span>
        <button @click="remove" class="offline-btn-remove" :title="t('offline.remove')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </template>

    <!-- Partial -->
    <template v-else-if="status === 'partial'">
      <div class="offline-partial">
        <svg class="offline-icon offline-icon-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="offline-label">
          {{ record?.cachedUrls }}/{{ record?.totalUrls }} {{ t('offline.pages') }}
        </span>
        <button @click="retry" class="offline-btn-resume">
          {{ t('offline.resume') }}
        </button>
      </div>
    </template>

    <!-- Error -->
    <template v-else-if="status === 'error'">
      <div class="offline-error">
        <svg class="offline-icon offline-icon-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="offline-label">{{ t('offline.error') }}</span>
        <button @click="retry" class="offline-btn-retry">
          {{ t('offline.retry') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.offline-download {
  margin: 0;
  width: 100%;
}

/* Base button */
.offline-btn-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary, #4A3728);
  background: transparent;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.offline-btn-download:hover {
  border-color: var(--color-accent, #B45309);
  color: var(--color-accent, #B45309);
  background: rgba(180, 83, 9, 0.05);
}

/* Icon */
.offline-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.offline-icon-check {
  color: #16a34a;
}

.offline-icon-warn {
  color: #d97706;
}

.offline-icon-error {
  color: #dc2626;
}

/* Labels */
.offline-label {
  font-family: var(--font-sans, system-ui);
}

.offline-label-done {
  color: #16a34a;
}

/* Meta (size info) */
.offline-meta {
  font-size: 0.75rem;
  color: var(--text-muted, #78716C);
  font-family: var(--font-sans, system-ui);
}

/* Progress */
.offline-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.offline-progress-bar {
  height: 0.375rem;
  background: var(--bg-secondary, #F5E6D3);
  border-radius: 9999px;
  overflow: hidden;
}

.offline-progress-fill {
  height: 100%;
  background: var(--color-accent, #B45309);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.offline-progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  font-family: var(--font-sans, system-ui);
}

.offline-progress-text {
  color: var(--text-muted, #78716C);
}

.offline-btn-cancel {
  color: var(--text-muted, #78716C);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  transition: color 0.2s;
}

.offline-btn-cancel:hover {
  color: #dc2626;
}

/* Complete state */
.offline-complete {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-family: var(--font-sans, system-ui);
}

.offline-btn-remove {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem;
  color: var(--text-muted, #78716C);
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: color 0.2s;
}

.offline-btn-remove:hover {
  color: #dc2626;
}

/* Partial state */
.offline-partial {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-family: var(--font-sans, system-ui);
}

.offline-btn-resume {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-accent, #B45309);
  background: none;
  border: 1px solid var(--color-accent, #B45309);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.offline-btn-resume:hover {
  background: var(--color-accent, #B45309);
  color: white;
}

/* Error state */
.offline-error {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-family: var(--font-sans, system-ui);
}

.offline-btn-retry {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-accent, #B45309);
  background: none;
  border: 1px solid var(--color-accent, #B45309);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.offline-btn-retry:hover {
  background: var(--color-accent, #B45309);
  color: white;
}

/* Dark mode */
[data-theme="dark"] .offline-btn-download {
  color: #a3a3a3;
  border-color: rgba(255, 255, 255, 0.15);
}

[data-theme="dark"] .offline-btn-download:hover {
  color: #D97706;
  border-color: #D97706;
  background: rgba(217, 119, 6, 0.1);
}

[data-theme="dark"] .offline-progress-bar {
  background: #252525;
}
</style>
