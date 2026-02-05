import { defineStore } from 'pinia';
import { ref } from 'vue';
import { setLocale as setI18nLocale, getLocale, type SupportedLocale } from '../i18n';

export type Theme = 'light' | 'sepia' | 'dark';

export const usePreferencesStore = defineStore('preferences', () => {
  // UI Language (independent of content language)
  const uiLanguage = ref<SupportedLocale>(getLocale());

  // Reading preferences
  const theme = ref<Theme>('light');
  const fontSize = ref(18);

  // Initialize from localStorage
  function init() {
    if (typeof window === 'undefined') return;

    // Load saved preferences
    const savedTheme = localStorage.getItem('reading-theme') as Theme;
    const savedFontSize = localStorage.getItem('reading-font-size');
    const savedUiLanguage = localStorage.getItem('ui-language') as SupportedLocale;

    if (savedTheme && ['light', 'sepia', 'dark'].includes(savedTheme)) {
      theme.value = savedTheme;
    }
    if (savedFontSize) {
      const parsed = Number.parseInt(savedFontSize, 10);
      if (parsed >= 14 && parsed <= 24) {
        fontSize.value = parsed;
      }
    }
    if (savedUiLanguage && ['cs', 'fr', 'en'].includes(savedUiLanguage)) {
      uiLanguage.value = savedUiLanguage;
      setI18nLocale(savedUiLanguage);
    }

    // Apply settings to DOM
    applyTheme();
    applyFontSize();
  }

  // Theme management
  function setTheme(newTheme: Theme) {
    theme.value = newTheme;
    localStorage.setItem('reading-theme', newTheme);
    applyTheme();
  }

  function applyTheme() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme.value);
    }
  }

  // Font size management
  function setFontSize(size: number) {
    if (size >= 14 && size <= 24) {
      fontSize.value = size;
      localStorage.setItem('reading-font-size', size.toString());
      applyFontSize();
    }
  }

  function adjustFontSize(delta: number) {
    setFontSize(fontSize.value + delta);
  }

  function applyFontSize() {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--reading-font-size', `${fontSize.value}px`);
    }
  }

  // UI Language management
  function setUiLanguage(locale: SupportedLocale) {
    uiLanguage.value = locale;
    setI18nLocale(locale);
  }

  return {
    // State
    uiLanguage,
    theme,
    fontSize,

    // Actions
    init,
    setTheme,
    setFontSize,
    adjustFontSize,
    setUiLanguage
  };
});
