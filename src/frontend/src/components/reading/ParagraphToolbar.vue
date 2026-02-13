<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '../../i18n';
import { trackEvent } from '../../lib/analytics';

const { t } = useI18n();

interface GlossaryTag {
  id: string;
  name: string;
  category?: string;
}

const props = defineProps<{
  paragraphId: string;
  htmlContent: string;
  originalText?: string;
  languages?: string[];
  translationLang?: string;  // e.g., 'cz'
  glossaryTags?: GlossaryTag[];
  language?: string; // 'cz', 'en', etc. - for glossary link prefix
  contentLang?: string; // HTML lang attribute (e.g., 'fr', 'cs')
}>();

// ─── Flip state ───────────────────────────────────────────────────────

const isFlipped = ref(false);

function flip() {
  trackEvent('paragraph_flip', {
    paragraphId: props.paragraphId,
    direction: isFlipped.value ? 'to_translation' : 'to_original',
  });
  isFlipped.value = !isFlipped.value;
}

// ─── Language display ─────────────────────────────────────────────────

const languageIcons: Record<string, { symbol: string; title: string }> = {
  fr: { symbol: '\u269C', title: 'Francouzsky' },      // Fleur-de-lis
  en: { symbol: '\u2654', title: 'Anglicky' },         // Crown
  ru: { symbol: '\u2606', title: 'Rusky' },            // Star
  it: { symbol: '\u26AC', title: 'Italsky' },          // Circle
  de: { symbol: '\u2727', title: 'N\u011Bmecky' },          // Diamond
  la: { symbol: '\u221E', title: 'Latinsky' },         // Infinity
  el: { symbol: '\u03A9', title: '\u0158ecky' },            // Omega
  es: { symbol: '\u25C8', title: '\u0160pan\u011Blsky' },        // Diamond
  cz: { symbol: 'cz', title: '\u010Cesky' },           // Czech letters
  cs: { symbol: 'cz', title: '\u010Cesky' },           // Czech (alternate code)
};

const originalLanguages = computed(() => {
  const langs = props.languages || ['fr'];
  return langs.map(code => ({
    code,
    ...languageIcons[code] || { symbol: code.toUpperCase(), title: code }
  }));
});

const translationLanguage = computed(() => {
  const code = props.translationLang || 'cz';
  return languageIcons[code] || { symbol: code.toUpperCase(), title: code };
});

// ─── Menu (bottom sheet) state ────────────────────────────────────────

const categoryIcons: Record<string, string> = {
  people: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  places: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  culture: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  society: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  languages: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

function getCategoryIcon(category?: string): string {
  return categoryIcons[category || ''] || categoryIcons.people;
}

const isMenuOpen = ref(false);
const mounted = ref(false);
const copied = ref(false);
const canShare = ref(false);

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function getUrl() {
  return window.location.origin + window.location.pathname + `#p-${props.paragraphId.replace('.', '-')}`;
}

function copyLink() {
  navigator.clipboard.writeText(getUrl());
  copied.value = true;
  trackEvent('copy_link', { paragraphId: props.paragraphId });
  setTimeout(() => { copied.value = false; }, 2000);
}

async function shareLink() {
  trackEvent('share', { paragraphId: props.paragraphId });
  const url = getUrl();
  const title = document.title;

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
    } catch (_e) {
      copyLink();
    }
  } else {
    copyLink();
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────

onMounted(() => {
  mounted.value = true;
  canShare.value = !!navigator.share;
});

// Computed: has any glossary tags
const hasGlossaryTags = computed(() => props.glossaryTags && props.glossaryTags.length > 0);
const hasOriginal = computed(() => !!props.originalText);
</script>

<template>
  <div class="paragraph-toolbar-container">
    <!-- Minimal toolbar: just fleur-de-lis + three dots -->
    <div class="toolbar" role="toolbar" :aria-label="t('paragraph.options') + ' ' + paragraphId">
      <!-- Three-dot menu button -->
      <button
        @click="toggleMenu"
        class="toolbar__btn toolbar__btn--dots"
        :class="{ 'toolbar__btn--has-tags': hasGlossaryTags }"
        :aria-expanded="isMenuOpen"
        :title="hasGlossaryTags ? t('paragraph.relatedItems', { count: glossaryTags!.length }) : t('paragraph.options')"
      >
        <svg class="toolbar__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>

      <!-- Fleur-de-lis: click to flip (only for translations with original) -->
      <button
        v-if="hasOriginal"
        @click="flip"
        class="toolbar__btn toolbar__btn--fleur"
        :class="{ 'toolbar__btn--active': isFlipped }"
        :title="isFlipped
          ? '\u2192 ' + translationLanguage.title
          : '\u2192 ' + originalLanguages.map(l => l.title).join(', ')"
      >&#x269C;</button>
    </div>

    <!-- Paragraph content with flip animation -->
    <div
      class="flip-card"
      :class="{ 'is-flipped': isFlipped, 'has-original': hasOriginal }"
    >
      <!-- Front face -->
      <div class="card-face card-front">
        <div class="paragraph-text" :lang="contentLang" v-html="htmlContent" />
      </div>

      <!-- Back face: Original text -->
      <div v-if="hasOriginal" class="card-face card-back">
        <p class="paragraph-text original-text">{{ originalText }}</p>
      </div>
    </div>

    <!-- Bottom sheet modal for menu (teleported to body) -->
    <Teleport v-if="mounted" to="body">
      <Transition name="pt-modal">
        <div v-if="isMenuOpen" class="sheet-backdrop" @click="closeMenu">
          <div class="sheet-content" @click.stop>
            <!-- Close button -->
            <button @click="closeMenu" class="menu-item close-item">
              <svg class="menu-item__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{{ t('common.closeMenu') }}</span>
            </button>

            <!-- Paragraph ID header -->
            <div class="sheet-header">
              <span class="sheet-header__id">{{ paragraphId }}</span>
            </div>

            <!-- Actions section -->
            <div class="menu-section">
              <!-- Flip to original (if available) -->
              <button v-if="hasOriginal" @click="flip(); closeMenu();" class="menu-item">
                <svg class="menu-item__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>{{ isFlipped ? '\u2192 ' + translationLanguage.title : '\u2192 ' + originalLanguages.map(l => l.title).join(', ') }}</span>
              </button>

              <!-- Share button (if Web Share API available) -->
              <button v-if="canShare" @click="shareLink" class="menu-item">
                <svg class="menu-item__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{{ t('paragraph.share') }}</span>
              </button>

              <!-- Copy link button -->
              <button @click="copyLink" class="menu-item">
                <svg class="menu-item__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>{{ copied ? t('paragraph.copied') : t('paragraph.copyLink') }}</span>
              </button>
            </div>

            <!-- Glossary tags section -->
            <div v-if="hasGlossaryTags" class="menu-section">
              <div class="section-label">{{ t('paragraph.relatedEntries') }}</div>
              <a
                v-for="tag in glossaryTags"
                :key="tag.id"
                :href="language ? `/${language}/glossary/${tag.id}` : `/glossary/${tag.id}`"
                class="menu-item glossary-link"
                :class="`category-${tag.category || 'default'}`"
                @click="trackEvent('glossary_tag_click', { tagId: tag.id, tagName: tag.name, source: 'toolbar' }); closeMenu()"
              >
                <svg class="menu-item__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getCategoryIcon(tag.category)" />
                </svg>
                <span>{{ tag.name }}</span>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ─── Container ──────────────────────────────────────────────────────── */

.paragraph-toolbar-container {
  position: relative;
}

/* ─── Toolbar bar (minimal) ──────────────────────────────────────────── */

.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 0.75rem;
  padding: 0;
  opacity: 0.2;
  transition: opacity 0.25s ease;
}

.paragraph-toolbar-container:hover .toolbar {
  opacity: 0.5;
}

/* On touch devices, slightly more visible */
@media (hover: none) {
  .toolbar {
    opacity: 0.35;
  }
}

/* ─── Toolbar buttons ────────────────────────────────────────────────── */

.toolbar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s, opacity 0.2s;
  line-height: 1;
}

.toolbar__btn:hover {
  color: var(--color-accent, #B45309);
}

/* Fleur-de-lis button */
.toolbar__btn--fleur {
  font-size: 0.75rem;
  font-family: 'Crimson Pro', Georgia, serif;
  user-select: none;
}

.toolbar__btn--fleur.toolbar__btn--active {
  color: var(--color-accent, #B45309);
}

/* Three-dot button */
.toolbar__btn--dots {
  width: 1.25rem;
  height: 1.25rem;
}

.toolbar__btn--has-tags {
  color: var(--color-accent, #B45309);
}

/* ─── Toolbar icon ───────────────────────────────────────────────────── */

.toolbar__icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

/* ─── Flip card ──────────────────────────────────────────────────────── */

.flip-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.flip-card.is-flipped {
  transform: rotateY(180deg);
}

.flip-card:not(.has-original) {
  transform: none !important;
}

.card-face {
  position: relative;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
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

/* ─── Paragraph text ─────────────────────────────────────────────────── */

.paragraph-text {
  font-size: calc(var(--base-font-size, 18px) * var(--reading-font-scale, 1));
  line-height: 1.8;
  color: var(--text-primary, #2C1810);
}

.original-text {
  font-style: italic;
  font-family: 'Crimson Pro', Georgia, serif;
  color: var(--text-secondary, #4A3728);
}

[data-theme="dark"] .original-text {
  color: #a3a3a3;
}

/* ─── Bottom sheet modal ─────────────────────────────────────────────── */

.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}

.sheet-content {
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  max-height: 80vh;
  background: var(--bg-primary, #FFF8F0);
  border-radius: 1rem 1rem 0 0;
  padding: 1rem;
  overflow-y: auto;
}

[data-theme="dark"] .sheet-content {
  background: #1a1a1a;
}

[data-theme="sepia"] .sheet-content {
  background: #F5E6D3;
}

/* ─── Menu items ─────────────────────────────────────────────────────── */

.close-item {
  font-weight: 600;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  margin-bottom: 0.5rem;
  padding-bottom: 0.75rem;
  color: var(--color-accent, #B45309);
}

.close-item:hover {
  background: transparent;
  color: var(--color-accent, #B45309);
}

.sheet-header {
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.sheet-header__id {
  font-size: 0.875rem;
  font-weight: 600;
  font-family: monospace;
  color: var(--text-muted, #78716C);
}

.menu-section {
  padding: 0.5rem;
}

.menu-section:not(:last-child) {
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.section-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #78716C);
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.25rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary, #2C1810);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s;
  text-align: left;
}

[data-theme="dark"] .menu-item {
  color: #e5e5e5;
}

.menu-item:hover {
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .menu-item:hover {
  background: #252525;
}

.menu-item__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.glossary-link svg {
  color: var(--color-accent, #B45309);
}

.category-places svg {
  color: #2563EB;
}

.category-culture svg {
  color: #7C3AED;
}

.category-society svg {
  color: #059669;
}

.category-languages svg {
  color: #D97706;
}
</style>

<!-- Transition CSS must be unscoped to work with Teleport to body -->
<style>
.pt-modal-enter-active,
.pt-modal-leave-active {
  transition: opacity 0.2s ease;
}

.pt-modal-leave-active {
  pointer-events: none;
}

.pt-modal-enter-active .sheet-content,
.pt-modal-leave-active .sheet-content {
  transition: transform 0.2s ease;
}

.pt-modal-enter-from,
.pt-modal-leave-to {
  opacity: 0;
}

.pt-modal-enter-from .sheet-content,
.pt-modal-leave-to .sheet-content {
  transform: translateY(100%);
}
</style>
