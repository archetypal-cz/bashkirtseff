<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from '../../i18n';

const { t } = useI18n();

// Settings state
const isOpen = ref(false);
const fontScale = ref(100); // Font scale in percent (80-130)
const theme = ref<'light' | 'sepia' | 'dark'>('light');

// Computed display value
const fontScaleDisplay = computed(() => `${fontScale.value}%`);

// Load settings from localStorage on mount
onMounted(() => {
  const savedFontScale = localStorage.getItem('reading-font-scale');
  const savedTheme = localStorage.getItem('reading-theme');

  if (savedFontScale) {
    fontScale.value = parseInt(savedFontScale, 10);
  }
  if (savedTheme) {
    theme.value = savedTheme as 'light' | 'sepia' | 'dark';
  }

  applySettings();
});

// Watch for changes and save to localStorage
watch(fontScale, (newScale) => {
  localStorage.setItem('reading-font-scale', newScale.toString());
  applySettings();
});

watch(theme, (newTheme) => {
  localStorage.setItem('reading-theme', newTheme);
  applySettings();
});

function applySettings() {
  // Apply font scale as a multiplier (100 -> 1.0, 110 -> 1.1, etc.)
  const scaleMultiplier = fontScale.value / 100;
  document.documentElement.style.setProperty('--reading-font-scale', scaleMultiplier.toString());

  // Apply theme
  document.documentElement.setAttribute('data-theme', theme.value);
}

function adjustFontSize(delta: number) {
  const newScale = fontScale.value + delta * 5; // Step by 5%
  if (newScale >= 80 && newScale <= 130) {
    fontScale.value = newScale;
  }
}

function setTheme(newTheme: 'light' | 'sepia' | 'dark') {
  theme.value = newTheme;
}

function togglePanel() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="reading-settings">
    <!-- Toggle button -->
    <button
      @click="togglePanel"
      class="settings-toggle"
      :class="{ 'is-open': isOpen }"
      :aria-label="t('reading.settings')"
      :title="t('reading.settings')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Settings panel -->
    <Transition name="slide">
      <div v-if="isOpen" class="settings-panel">
        <div class="settings-header">
          <span>{{ t('reading.settings') }}</span>
          <button @click="togglePanel" class="close-btn" :aria-label="t('common.close')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Font size -->
        <div class="setting-group">
          <label class="setting-label">{{ t('reading.fontSize') }}</label>
          <div class="font-size-controls">
            <button
              @click="adjustFontSize(-1)"
              :disabled="fontScale <= 80"
              class="font-btn"
              :aria-label="t('reading.decreaseFont')"
            >
              A-
            </button>
            <span class="font-size-value">{{ fontScaleDisplay }}</span>
            <button
              @click="adjustFontSize(1)"
              :disabled="fontScale >= 130"
              class="font-btn"
              :aria-label="t('reading.increaseFont')"
            >
              A+
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="setting-group">
          <label class="setting-label">{{ t('reading.theme') }}</label>
          <div class="theme-controls">
            <button
              @click="setTheme('light')"
              :class="{ active: theme === 'light' }"
              class="theme-btn theme-light"
              :aria-label="t('reading.lightTheme')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button
              @click="setTheme('sepia')"
              :class="{ active: theme === 'sepia' }"
              class="theme-btn theme-sepia"
              :aria-label="t('reading.sepiaTheme')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            <button
              @click="setTheme('dark')"
              :class="{ active: theme === 'dark' }"
              class="theme-btn theme-dark"
              :aria-label="t('reading.darkTheme')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.reading-settings {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
}

.settings-toggle {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: var(--color-accent, #B45309);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.settings-toggle:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.settings-toggle.is-open {
  background: var(--color-ink, #2C1810);
}

.settings-panel {
  position: absolute;
  bottom: 4rem;
  right: 0;
  width: 280px;
  background: var(--panel-bg, #FFF8F0);
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

[data-theme="dark"] .settings-panel {
  --panel-bg: #1a1a1a;
  --border-color: rgba(255, 255, 255, 0.1);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  font-weight: 500;
  color: var(--text-color, #2C1810);
}

[data-theme="dark"] .settings-header {
  --text-color: #e5e5e5;
}

.close-btn {
  padding: 0.25rem;
  border-radius: 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted, #6b7280);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-color, #2C1810);
}

.setting-group {
  margin-bottom: 1rem;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #6b7280);
  margin-bottom: 0.5rem;
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.font-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: var(--btn-bg, #F5E6D3);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  cursor: pointer;
  font-weight: 600;
  color: var(--text-color, #2C1810);
  transition: all 0.2s;
}

[data-theme="dark"] .font-btn {
  --btn-bg: #2a2a2a;
  --text-color: #e5e5e5;
}

.font-btn:hover:not(:disabled) {
  background: var(--color-accent, #B45309);
  color: white;
  border-color: var(--color-accent, #B45309);
}

.font-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.font-size-value {
  flex: 1;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-color, #2C1810);
}

[data-theme="dark"] .font-size-value {
  --text-color: #e5e5e5;
}

.theme-controls {
  display: flex;
  gap: 0.5rem;
}

.theme-btn {
  flex: 1;
  height: 2.5rem;
  border-radius: 0.5rem;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.theme-btn.active {
  border-color: var(--color-accent, #B45309);
}

.theme-light {
  background: #ffffff;
  color: #2C1810;
  border-color: rgba(44, 24, 16, 0.2);
}

.theme-sepia {
  background: #F5E6D3;
  color: #2C1810;
  border-color: rgba(44, 24, 16, 0.2);
}

.theme-dark {
  background: #1a1a1a;
  color: #e5e5e5;
  border-color: rgba(255, 255, 255, 0.2);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
