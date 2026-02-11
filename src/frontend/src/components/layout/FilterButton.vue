<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useFilterStore } from '../../stores/filter';
import FilterPanel from './FilterPanel.vue';

const filterStore = useFilterStore();
const buttonRef = ref<HTMLElement | null>(null);
const mounted = ref(false);

onMounted(() => {
  mounted.value = true;
  filterStore.init();
});

function toggle() {
  filterStore.panelOpen = !filterStore.panelOpen;
  if (filterStore.panelOpen) {
    filterStore.loadIndex();
  }
}

function close() {
  filterStore.panelOpen = false;
}
</script>

<template>
  <div class="filter-button-wrapper" ref="buttonRef">
    <button
      class="filter-btn"
      :class="{ 'is-active': filterStore.isActive }"
      @click="toggle"
      :aria-label="filterStore.isActive
        ? `Filtr (${filterStore.activeTagCount} aktivních)`
        : 'Filtr'"
      :aria-expanded="filterStore.panelOpen"
    >
      <!-- Funnel icon -->
      <svg
        class="filter-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
      <!-- Badge when active -->
      <span v-if="filterStore.isActive" class="filter-badge">
        {{ filterStore.activeTagCount }}
      </span>
    </button>

    <!-- Panel (dropdown on desktop, slide-in on mobile).
         Teleport disabled during SSR to avoid hydration mismatch —
         Astro islands render in isolation, so Teleport anchors don't
         reach <body> during SSR, confusing Vue's hydration walker. -->
    <Teleport to="body" :disabled="!mounted">
      <FilterPanel
        v-if="filterStore.panelOpen"
        @close="close"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.filter-button-wrapper {
  position: relative;
}

.filter-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

.filter-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.filter-btn.is-active {
  color: var(--color-accent, #B45309);
}

.filter-btn.is-active:hover {
  background: var(--bg-secondary);
}

.filter-icon {
  flex-shrink: 0;
}

.filter-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-accent, #B45309);
  color: white;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--font-sans);
  line-height: 16px;
  text-align: center;
}
</style>
