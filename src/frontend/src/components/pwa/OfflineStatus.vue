<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useOfflineStore } from '../../stores/offline';
import { useI18n } from '../../i18n';
import { formatBytes } from '../../lib/offline';

const { t } = useI18n();
const store = useOfflineStore();

const isOnline = ref(true);
const showPanel = ref(false);

function updateOnline() {
  isOnline.value = navigator.onLine;
}

onMounted(() => {
  store.init();
  isOnline.value = navigator.onLine;
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnline);
  window.removeEventListener('offline', updateOnline);
});

const hasDownloads = computed(() => store.downloadList.length > 0);
const showIndicator = computed(() => !isOnline.value || hasDownloads.value);

function togglePanel() {
  showPanel.value = !showPanel.value;
}

function closePanel() {
  showPanel.value = false;
}
</script>

<template>
  <div v-if="showIndicator" class="offline-status-wrap">
    <button
      @click="togglePanel"
      class="offline-status-btn"
      :class="{ 'is-offline': !isOnline }"
      :title="isOnline ? t('offline.statusOnline') : t('offline.statusOffline')"
    >
      <!-- Offline icon -->
      <svg v-if="!isOnline" class="offline-status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01M8.464 8.464a5 5 0 000 7.072M15.536 8.464a5 5 0 010 7.072" />
        <path stroke-linecap="round" stroke-width="2.5" d="M4 4l16 16" class="offline-slash" />
      </svg>
      <!-- Downloaded indicator -->
      <svg v-else class="offline-status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
      <span v-if="hasDownloads && isOnline" class="offline-status-badge">
        {{ store.downloadList.length }}
      </span>
    </button>

    <!-- Panel dropdown -->
    <Transition name="fade">
      <div v-if="showPanel" class="offline-panel">
        <div class="offline-panel-header">
          <h3 class="offline-panel-title">{{ t('offline.storageTitle') }}</h3>
          <button @click="closePanel" class="offline-panel-close">&times;</button>
        </div>

        <!-- Offline banner -->
        <div v-if="!isOnline" class="offline-banner">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{{ t('offline.youAreOffline') }}</span>
        </div>

        <!-- Storage usage -->
        <div v-if="store.storageEstimate" class="offline-storage-bar-wrap">
          <div class="offline-storage-bar">
            <div
              class="offline-storage-fill"
              :style="{ width: Math.min(100, (store.storageEstimate.used / store.storageEstimate.quota) * 100) + '%' }"
            />
          </div>
          <p class="offline-storage-text">
            {{ formatBytes(store.storageEstimate.used) }} / {{ formatBytes(store.storageEstimate.quota) }}
          </p>
        </div>

        <!-- Download list -->
        <div v-if="store.downloadList.length > 0" class="offline-downloads-list">
          <div
            v-for="record in store.downloadList"
            :key="`${record.scope.type}:${record.scope.id}:${record.scope.language}`"
            class="offline-download-item"
          >
            <div class="offline-download-info">
              <span class="offline-download-name">
                {{ record.scope.type === 'year' ? t('offline.year') : t('offline.carnet') }}
                {{ record.scope.id }}
              </span>
              <span class="offline-download-meta">
                {{ formatBytes(record.sizeBytes) }}
                <template v-if="record.status === 'partial'">
                  &middot; {{ record.cachedUrls }}/{{ record.totalUrls }}
                </template>
              </span>
            </div>
            <div class="offline-download-status">
              <span
                class="offline-status-dot"
                :class="{
                  'dot-complete': record.status === 'complete',
                  'dot-partial': record.status === 'partial',
                  'dot-error': record.status === 'error',
                  'dot-downloading': record.status === 'downloading',
                }"
              />
              <button
                @click="store.removeScope(record.scope)"
                class="offline-item-remove"
                :title="t('offline.remove')"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="offline-empty">
          {{ t('offline.noDownloads') }}
        </div>

        <!-- Clear all -->
        <button
          v-if="store.downloadList.length > 1"
          @click="store.clearAll()"
          class="offline-clear-all"
        >
          {{ t('offline.clearAll') }}
        </button>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div v-if="showPanel" class="offline-backdrop" @click="closePanel" />
  </div>
</template>

<style scoped>
.offline-status-wrap {
  position: relative;
}

.offline-status-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
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

.offline-status-btn.is-offline {
  color: #d97706;
}

.offline-status-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.offline-slash {
  stroke: #dc2626;
}

.offline-status-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 1rem;
  height: 1rem;
  font-size: 0.625rem;
  font-family: var(--font-sans, system-ui);
  font-weight: 600;
  color: white;
  background: var(--color-accent, #B45309);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Panel */
.offline-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 280px;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 50;
  overflow: hidden;
  font-family: var(--font-sans, system-ui);
}

.offline-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.offline-panel-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary, #2C1810);
  margin: 0;
}

.offline-panel-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--text-muted, #78716C);
  cursor: pointer;
  padding: 0 0.25rem;
}

.offline-panel-close:hover {
  color: var(--text-primary, #2C1810);
}

/* Offline banner */
.offline-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: #92400e;
  background: #fef3c7;
}

/* Storage bar */
.offline-storage-bar-wrap {
  padding: 0.75rem 1rem;
}

.offline-storage-bar {
  height: 0.25rem;
  background: var(--bg-secondary, #F5E6D3);
  border-radius: 9999px;
  overflow: hidden;
}

.offline-storage-fill {
  height: 100%;
  background: var(--color-accent, #B45309);
  border-radius: 9999px;
  transition: width 0.3s;
}

.offline-storage-text {
  font-size: 0.6875rem;
  color: var(--text-muted, #78716C);
  margin-top: 0.25rem;
}

/* Download list */
.offline-downloads-list {
  padding: 0.25rem 0;
}

.offline-download-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  transition: background 0.15s;
}

.offline-download-item:hover {
  background: var(--bg-secondary, #F5E6D3);
}

.offline-download-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.offline-download-name {
  font-size: 0.8125rem;
  color: var(--text-primary, #2C1810);
}

.offline-download-meta {
  font-size: 0.6875rem;
  color: var(--text-muted, #78716C);
}

.offline-download-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.offline-status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.dot-complete { background: #16a34a; }
.dot-partial { background: #d97706; }
.dot-error { background: #dc2626; }
.dot-downloading { background: var(--color-accent, #B45309); animation: pulse 1.5s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.offline-item-remove {
  display: flex;
  align-items: center;
  padding: 0.25rem;
  background: none;
  border: none;
  color: var(--text-muted, #78716C);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: color 0.2s;
}

.offline-item-remove:hover {
  color: #dc2626;
}

/* Empty state */
.offline-empty {
  padding: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted, #78716C);
  text-align: center;
}

/* Clear all */
.offline-clear-all {
  display: block;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #dc2626;
  background: none;
  border: none;
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  cursor: pointer;
  transition: background 0.15s;
}

.offline-clear-all:hover {
  background: rgba(220, 38, 38, 0.05);
}

/* Backdrop */
.offline-backdrop {
  position: fixed;
  inset: 0;
  z-index: 49;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Dark mode */
[data-theme="dark"] .offline-panel {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

[data-theme="dark"] .offline-banner {
  background: #451a03;
  color: #fbbf24;
}

[data-theme="dark"] .offline-storage-bar {
  background: #252525;
}

[data-theme="dark"] .offline-download-item:hover {
  background: #252525;
}

[data-theme="dark"] .offline-clear-all:hover {
  background: rgba(220, 38, 38, 0.15);
}
</style>
