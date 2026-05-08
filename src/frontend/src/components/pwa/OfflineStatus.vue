<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useOfflineStore } from '../../stores/offline';
import { useI18n } from '../../i18n';
import { formatBytes } from '../../lib/offline';

const { t } = useI18n();
const store = useOfflineStore();

const panelOpen = ref(false);
const wrapRef = ref<HTMLElement | null>(null);

const hasDownloads = computed(() => store.downloadList.length > 0);
const downloadCount = computed(() => store.downloadList.length);

function togglePanel() {
  panelOpen.value = !panelOpen.value;
}

function handleClickOutside(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) {
    panelOpen.value = false;
  }
}

function scopeLabel(record: any): string {
  const s = record.scope;
  if (s.type === 'year') return `${t('offline.year')} ${s.id}`;
  return `${t('offline.carnet')} ${s.id}`;
}

function isStale(record: any): boolean {
  if (!store.currentManifestCommit) return false;
  return !record.manifestCommit || record.manifestCommit !== store.currentManifestCommit;
}

async function updateAll() {
  panelOpen.value = false;
  await store.updateStaleDownloads();
}

async function clearAll() {
  panelOpen.value = false;
  await store.clearAll();
}

onMounted(() => {
  store.init();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="offline-status-wrap" ref="wrapRef">
    <button
      v-if="hasDownloads"
      @click.stop="togglePanel"
      class="offline-status-btn"
      :class="{ 'has-updates': store.hasStaleDownloads }"
      :title="store.hasStaleDownloads ? t('offline.stale') : t('offline.statusOnline')"
    >
      <svg class="offline-status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
      <span class="badge">{{ downloadCount }}</span>
      <span v-if="store.hasStaleDownloads" class="update-dot" />
    </button>
    <span
      v-else
      class="offline-status-btn is-disabled"
      :title="t('offline.statusOnline')"
    >
      <svg class="offline-status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    </span>

    <!-- Dropdown panel -->
    <Transition name="fade">
      <div v-if="panelOpen" class="offline-panel">
        <div class="offline-panel-header">
          <span class="offline-panel-title">{{ t('offline.storageTitle') }}</span>
          <span v-if="store.storageEstimate" class="offline-panel-storage">
            {{ formatBytes(store.totalCachedSize) }}
          </span>
        </div>

        <ul class="offline-panel-list">
          <li v-for="record in store.downloadList" :key="record.scope.type + record.scope.id + record.scope.language" class="offline-panel-item">
            <div class="offline-panel-item-info">
              <span class="offline-panel-item-name">{{ scopeLabel(record) }}</span>
              <span class="offline-panel-item-lang">{{ record.scope.language }}</span>
            </div>
            <div class="offline-panel-item-status">
              <span v-if="record.status === 'complete' && !isStale(record)" class="status-badge status-ok">{{ t('offline.upToDate') }}</span>
              <span v-else-if="record.status === 'complete' && isStale(record)" class="status-badge status-stale">{{ t('offline.stale') }}</span>
              <span v-else-if="record.status === 'partial'" class="status-badge status-partial">{{ record.cachedUrls }}/{{ record.totalUrls }}</span>
              <span v-else-if="record.status === 'downloading'" class="status-badge status-downloading">{{ store.progress }}%</span>
              <span v-else class="status-badge status-error">{{ t('offline.error') }}</span>
            </div>
          </li>
        </ul>

        <div class="offline-panel-actions">
          <button v-if="store.hasStaleDownloads && !store.isDownloading" @click="updateAll" class="offline-panel-btn offline-panel-btn-update">
            {{ t('offline.updateAll') }}
          </button>
          <button v-if="store.isDownloading" class="offline-panel-btn" disabled>
            {{ t('offline.updating') }}
          </button>
          <button @click="clearAll" class="offline-panel-btn offline-panel-btn-clear" :disabled="store.isDownloading">
            {{ t('offline.clearAll') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.offline-status-wrap {
  position: relative;
}

.offline-status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: var(--text-muted, #78716C);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: color 0.2s;
}

.offline-status-btn:hover {
  color: var(--color-accent, #B45309);
}

.offline-status-btn.is-disabled {
  opacity: 0.35;
  cursor: default;
}

.offline-status-btn.has-updates {
  color: var(--color-accent, #B45309);
}

.offline-status-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 0.875rem;
  height: 0.875rem;
  padding: 0 0.2rem;
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 0.875rem;
  text-align: center;
  color: white;
  background: var(--color-accent, #B45309);
  border-radius: 9999px;
  font-family: var(--font-sans, system-ui);
}

.update-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 0.5rem;
  height: 0.5rem;
  background: #eab308;
  border-radius: 9999px;
  border: 1.5px solid var(--bg-primary, #FFF8F0);
}

/* Panel */
.offline-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 16rem;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  font-family: var(--font-sans, system-ui);
  overflow: hidden;
}

.offline-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.offline-panel-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #2C1810);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.offline-panel-storage {
  font-size: 0.6875rem;
  color: var(--text-muted, #78716C);
}

.offline-panel-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  max-height: 12rem;
  overflow-y: auto;
}

.offline-panel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.75rem;
  gap: 0.5rem;
}

.offline-panel-item-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.offline-panel-item-name {
  font-size: 0.8125rem;
  color: var(--text-primary, #2C1810);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.offline-panel-item-lang {
  font-size: 0.625rem;
  color: var(--text-muted, #78716C);
  text-transform: uppercase;
  flex-shrink: 0;
}

.offline-panel-item-status {
  flex-shrink: 0;
}

.status-badge {
  font-size: 0.625rem;
  padding: 0.1rem 0.375rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.status-ok {
  background: #dcfce7;
  color: #166534;
}

.status-stale {
  background: #fef3c7;
  color: #92400e;
}

.status-partial {
  background: #fef3c7;
  color: #92400e;
}

.status-downloading {
  background: #dbeafe;
  color: #1e40af;
}

.status-error {
  background: #fecaca;
  color: #991b1b;
}

.offline-panel-actions {
  display: flex;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.offline-panel-btn {
  flex: 1;
  padding: 0.3rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.15));
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s;
  background: transparent;
  color: var(--text-secondary, #4A3728);
  font-family: var(--font-sans, system-ui);
}

.offline-panel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.offline-panel-btn-update {
  background: var(--color-accent, #B45309);
  color: white;
  border-color: var(--color-accent, #B45309);
}

.offline-panel-btn-update:hover {
  opacity: 0.9;
}

.offline-panel-btn-clear:hover:not(:disabled) {
  border-color: #dc2626;
  color: #dc2626;
}

/* Dark mode */
[data-theme="dark"] .offline-panel {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .offline-panel-title {
  color: #e5e5e5;
}

[data-theme="dark"] .offline-panel-item-name {
  color: #e5e5e5;
}

[data-theme="dark"] .update-dot {
  border-color: #1a1a1a;
}

[data-theme="dark"] .status-ok {
  background: #052e16;
  color: #86efac;
}

[data-theme="dark"] .status-stale {
  background: #451a03;
  color: #fcd34d;
}

[data-theme="dark"] .status-partial {
  background: #451a03;
  color: #fcd34d;
}

[data-theme="dark"] .status-downloading {
  background: #172554;
  color: #93c5fd;
}

[data-theme="dark"] .status-error {
  background: #450a0a;
  color: #fca5a5;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
