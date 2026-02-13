<!-- TODO: Offline download functionality comes later.
     For now, show the icon as a disabled placeholder. -->
<script setup lang="ts">
import { useI18n } from '../../i18n';

const { t } = useI18n();
</script>

<template>
  <div class="offline-status-wrap">
    <span
      class="offline-status-btn is-disabled"
      :title="t('offline.statusOnline')"
    >
      <svg class="offline-status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    </span>
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
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: var(--text-muted, #78716C);
  border-radius: 0.375rem;
}

.offline-status-btn.is-disabled {
  opacity: 0.35;
  cursor: default;
}

.offline-status-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
