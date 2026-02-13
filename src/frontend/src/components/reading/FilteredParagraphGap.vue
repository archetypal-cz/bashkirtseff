<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '../../i18n';

interface ParagraphData {
  id: string;
  html: string;
  originalText?: string;
}

const props = withDefaults(defineProps<{
  paragraphs: ParagraphData[];
  count: number;
  filterColor?: string;
}>(), {
  filterColor: '',
});

const { t } = useI18n();

const expanded = ref(false);

const accentColor = computed(() =>
  props.filterColor || 'var(--color-accent, #B45309)'
);

function toggle() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <div class="filtered-gap" :class="{ 'is-expanded': expanded }">
    <!-- Collapsed state: horizontal bar with badge -->
    <button
      v-if="!expanded"
      class="gap-bar"
      :style="{ '--gap-color': accentColor }"
      @click="toggle"
      :aria-label="t('filter.showHidden')"
      :title="t('filter.showHidden')"
    >
      <span class="gap-line" />
      <span class="gap-badge">
        {{ t('filter.paragraphsHidden', { count }) }}
      </span>
      <span class="gap-line" />
    </button>

    <!-- Expanded state: paragraphs with left border -->
    <div
      v-if="expanded"
      class="gap-expanded"
      :style="{ '--gap-color': accentColor }"
    >
      <div class="gap-header">
        <button
          class="gap-collapse-btn"
          @click="toggle"
          :aria-label="t('filter.hideFiltered')"
          :title="t('filter.hideFiltered')"
        >
          {{ t('filter.hideFiltered') }}
        </button>
      </div>
      <div
        class="gap-border-area"
        @click="toggle"
        role="button"
        tabindex="0"
        :aria-label="t('filter.hideFiltered')"
        @keydown.enter="toggle"
        @keydown.space.prevent="toggle"
      >
        <div class="gap-content">
          <div
            v-for="para in paragraphs"
            :key="para.id"
            class="gap-paragraph"
            :id="`p-${para.id}`"
          >
            <p v-html="para.html" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filtered-gap {
  --gap-color: var(--color-accent, #B45309);
}

/* --- Collapsed bar --- */
.gap-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 0;
  margin: 4px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: var(--font-sans, system-ui);
  transition: opacity 0.2s ease;
}

.gap-bar:hover {
  opacity: 0.85;
}

.gap-bar:hover .gap-badge {
  background: var(--gap-color);
  color: #fff;
}

.gap-line {
  flex: 1;
  height: 1px;
  background: var(--gap-color);
  opacity: 0.35;
  transition: opacity 0.2s ease;
}

.gap-bar:hover .gap-line {
  opacity: 0.6;
}

.gap-badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 2px 10px;
  border-radius: 10px;
  color: var(--gap-color);
  background: color-mix(in srgb, var(--gap-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--gap-color) 25%, transparent);
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease;
}

/* --- Expanded area --- */
.gap-expanded {
  margin: 8px 0;
  animation: gap-fade-in 0.25s ease;
}

@keyframes gap-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gap-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 4px;
}

.gap-collapse-btn {
  font-size: 11px;
  font-weight: 500;
  font-family: var(--font-sans, system-ui);
  color: var(--gap-color);
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--gap-color) 25%, transparent);
  border-radius: 10px;
  padding: 2px 10px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.gap-collapse-btn:hover {
  background: var(--gap-color);
  color: #fff;
}

.gap-border-area {
  position: relative;
  padding-left: 24px;
  border-left: 3px solid var(--gap-color);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.gap-border-area:hover {
  border-left-color: color-mix(in srgb, var(--gap-color) 70%, transparent);
}

.gap-border-area:focus-visible {
  outline: 2px solid var(--gap-color);
  outline-offset: 4px;
  border-radius: 2px;
}

.gap-content {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.gap-border-area:hover .gap-content {
  opacity: 0.85;
}

.gap-paragraph {
  margin-bottom: 1em;
}

.gap-paragraph:last-child {
  margin-bottom: 0;
}

.gap-paragraph :deep(p) {
  font-size: calc(var(--base-font-size, 18px) * var(--reading-font-scale, 1));
  line-height: 1.8;
  color: var(--text-secondary, #4A3728);
  margin: 0;
}

/* --- Dark mode --- */
[data-theme="dark"] .gap-badge {
  background: color-mix(in srgb, var(--gap-color) 15%, transparent);
  border-color: color-mix(in srgb, var(--gap-color) 30%, transparent);
}

[data-theme="dark"] .gap-collapse-btn {
  border-color: color-mix(in srgb, var(--gap-color) 30%, transparent);
}

[data-theme="dark"] .gap-paragraph :deep(p) {
  color: var(--text-secondary, #a3a3a3);
}

/* --- Sepia mode --- */
[data-theme="sepia"] .gap-badge {
  background: color-mix(in srgb, var(--gap-color) 12%, transparent);
}

[data-theme="sepia"] .gap-collapse-btn {
  border-color: color-mix(in srgb, var(--gap-color) 20%, transparent);
}
</style>
