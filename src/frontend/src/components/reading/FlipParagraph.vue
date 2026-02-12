<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  paragraphId: string;
  htmlContent: string;
  originalText?: string;
  languages?: string[];
  translationLang?: string;  // e.g., 'cz'
}>();

const isFlipped = ref(false);

function flip() {
  isFlipped.value = !isFlipped.value;
}

// Language display configuration
// Using subtle, iconic symbols for each language
const languageIcons: Record<string, { symbol: string; title: string }> = {
  fr: { symbol: '⚜', title: 'Francouzsky' },      // Fleur-de-lis
  en: { symbol: '♔', title: 'Anglicky' },         // Crown
  ru: { symbol: '☆', title: 'Rusky' },            // Star (from Russian flag/symbolism)
  it: { symbol: '⚬', title: 'Italsky' },          // Circle (Roman simplicity)
  de: { symbol: '✧', title: 'Německy' },          // Diamond
  la: { symbol: '∞', title: 'Latinsky' },         // Infinity (eternal language)
  el: { symbol: 'Ω', title: 'Řecky' },            // Omega
  es: { symbol: '◈', title: 'Španělsky' },        // Diamond
  cz: { symbol: 'cz', title: 'Česky' },           // Czech letters
  cs: { symbol: 'cz', title: 'Česky' },           // Czech (alternate code)
};

// Original languages (shown on back/original side)
const originalLanguages = computed(() => {
  const langs = props.languages || ['fr'];
  return langs.map(code => ({
    code,
    ...languageIcons[code] || { symbol: code.toUpperCase(), title: code }
  }));
});

// Translation language (shown on front/translation side)
const translationLanguage = computed(() => {
  const code = props.translationLang || 'cz';
  return languageIcons[code] || { symbol: code.toUpperCase(), title: code };
});
</script>

<template>
  <div
    class="flip-card"
    :class="{ 'is-flipped': isFlipped, 'has-original': !!originalText }"
  >
    <!-- Front face: Translation (shows original language icon - click to see original) -->
    <div class="card-face card-front">
      <div class="paragraph-text" v-html="htmlContent" />
      <button
        v-if="originalText"
        @click="flip"
        class="flip-btn"
        :aria-label="'Zobrazit originál: ' + originalLanguages.map(l => l.title).join(', ')"
        :title="'→ ' + originalLanguages.map(l => l.title).join(', ')"
      >
        <span class="language-icons">
          <span
            v-for="lang in originalLanguages"
            :key="lang.code"
            class="lang-symbol"
            :title="lang.title"
          >{{ lang.symbol }}</span>
        </span>
      </button>
    </div>

    <!-- Back face: Original (shows translation language icon - click to see translation) -->
    <div v-if="originalText" class="card-face card-back">
      <p class="paragraph-text original-text">{{ originalText }}</p>
      <button
        @click="flip"
        class="flip-btn"
        :aria-label="'Zobrazit překlad: ' + translationLanguage.title"
        :title="'→ ' + translationLanguage.title"
      >
        <span class="language-icons">
          <span class="lang-symbol" :title="translationLanguage.title">{{ translationLanguage.symbol }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.flip-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.flip-card.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: relative;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-front {
  /* Front is default visible */
}

/* Hide front face button when card is flipped */
.flip-card.is-flipped .card-front .flip-btn {
  visibility: hidden;
  pointer-events: none;
}

.card-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  background: var(--bg-secondary, #F5E6D3);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: -1rem;
}

[data-theme="dark"] .card-back {
  background: #252525;
}

[data-theme="sepia"] .card-back {
  background: #EBD9C4;
}

.paragraph-text {
  font-size: calc(var(--base-font-size, 18px) * var(--reading-font-scale, 1));
  line-height: 1.8;
  color: var(--text-primary, #2C1810);
}

.original-text {
  font-style: italic;
  font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
  color: var(--text-secondary, #4A3728);
}

[data-theme="dark"] .original-text {
  color: #a3a3a3;
}

/* Flip button with language icons - positioned at top right, floating into gap */
.flip-btn {
  position: absolute;
  top: -0.75rem;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0.125rem 0.25rem;
  color: var(--text-muted, #78716C);
  background: var(--bg-primary, #FFF8F0);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s, color 0.2s, background-color 0.2s;
  z-index: 5;
  /* Ensure button hides when its face is rotated away */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

[data-theme="dark"] .flip-btn {
  background: #1a1a1a;
}

[data-theme="sepia"] .flip-btn {
  background: #F5E6D3;
}

.flip-btn:hover {
  opacity: 1;
  color: var(--color-accent, #B45309);
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .flip-btn:hover {
  background: #333;
  color: var(--color-accent, #B45309);
}

.language-icons {
  display: flex;
  gap: 0.125rem;
  font-size: 0.875rem;
  line-height: 1;
}

.lang-symbol {
  font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
  font-style: normal;
}

/* When card has no original, no flip behavior */
.flip-card:not(.has-original) {
  transform: none !important;
}
</style>
