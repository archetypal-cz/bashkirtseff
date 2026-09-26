<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n, type SupportedLocale } from '../../i18n';
import { languageSymbol, languageTitle } from '../../lib/language-labels';

const props = defineProps<{
  paragraphId: string;
  htmlContent: string;
  originalHtml?: string;     // French original, pre-rendered and escaped at build time
  languages?: string[];
  translationLang?: string;  // e.g., 'cz'
  pageLocale?: SupportedLocale;
}>();

const { t, locale } = useI18n(props.pageLocale);

const isFlipped = ref(false);

function flip() {
  isFlipped.value = !isFlipped.value;
}

// Subtle, iconic symbols per language; names in the reader's UI language.
const originalLanguages = computed(() => {
  const langs = props.languages || ['fr'];
  return langs.map(code => ({
    code,
    symbol: languageSymbol(code),
    title: languageTitle(code, locale.value),
  }));
});

// A11y (WS-D/D2): HTML lang attributes for the two faces. urlPath 'cz' maps to
// the ISO code 'cs'; originals default to the diary's French.
const translationLangAttr = computed(() => {
  const code = props.translationLang || 'cz';
  return code === 'cz' ? 'cs' : code;
});
const originalLangAttr = computed(() => props.languages?.[0] || 'fr');

// Translation language (shown on front/translation side)
const translationLanguage = computed(() => {
  const code = props.translationLang || 'cz';
  return { symbol: languageSymbol(code), title: languageTitle(code, locale.value) };
});

const showOriginalLabel = computed(() =>
  t('paragraph.showOriginal', { langs: originalLanguages.value.map(l => l.title).join(', ') })
);
const showTranslationLabel = computed(() =>
  t('paragraph.showTranslation', { lang: translationLanguage.value.title })
);
</script>

<template>
  <div
    class="flip-card"
    :class="{ 'is-flipped': isFlipped, 'has-original': !!originalHtml }"
  >
    <!-- Front face: Translation (A11y WS-D: rotated-away face is aria-hidden + inert) -->
    <div class="card-face card-front" :aria-hidden="isFlipped ? 'true' : undefined" :inert="isFlipped">
      <div class="paragraph-text" :lang="translationLangAttr" v-html="htmlContent" />
      <button
        v-if="originalHtml"
        @click="flip"
        class="flip-btn"
        :aria-label="showOriginalLabel"
        :title="showOriginalLabel"
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
    <div v-if="originalHtml" class="card-face card-back" :aria-hidden="!isFlipped ? 'true' : undefined" :inert="!isFlipped">
      <div class="paragraph-text original-text" :lang="originalLangAttr" v-html="originalHtml" />
      <button
        @click="flip"
        class="flip-btn"
        :aria-label="showTranslationLabel"
        :title="showTranslationLabel"
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
  /* Same "pasted-in slip" as ParagraphToolbar's back face. */
  background: var(--bg-secondary, #F5E6D3);
  border-left: 2px solid var(--ornament, #722F37);
  border-radius: 0 0.25rem 0.25rem 0;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  margin: -0.75rem 0;
}

/* Flipped: both faces share one grid cell so a longer original grows the
   card instead of spilling past the slip (see ParagraphToolbar.vue). */
.flip-card.is-flipped {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.flip-card.is-flipped > .card-face {
  grid-area: 1 / 1;
}

.flip-card.is-flipped > .card-back {
  position: relative;
  inset: auto;
}

.paragraph-text {
  font-size: calc(var(--base-font-size, 18px) * var(--reading-font-scale, 1));
  line-height: 1.8;
  color: var(--text-primary, #2C1810);
}

.original-text {
  font-style: italic;
  font-family: var(--font-serif);
  color: var(--text-secondary, #4A3728);
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
  color: var(--text-muted, #5C5650);
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


.flip-btn:hover {
  opacity: 1;
  color: var(--color-accent, #9A4707);
  background: var(--bg-secondary, #F5E6D3);
}


.language-icons {
  display: flex;
  gap: 0.125rem;
  font-size: 0.875rem;
  line-height: 1;
}

.lang-symbol {
  font-family: var(--font-serif);
  font-style: normal;
}

/* When card has no original, no flip behavior */
.flip-card:not(.has-original) {
  transform: none !important;
}
</style>
