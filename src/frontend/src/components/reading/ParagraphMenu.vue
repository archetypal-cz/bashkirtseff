<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '../../i18n';

const { t } = useI18n();

interface GlossaryTag {
  id: string;
  name: string;
  category?: string;
}

const categoryIcons: Record<string, string> = {
  // people: person outline
  people: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  // places: map pin
  places: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  // culture: book open
  culture: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  // society: users/group
  society: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  // languages: chat bubble
  languages: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

function getCategoryIcon(category?: string): string {
  return categoryIcons[category || ''] || categoryIcons.people;
}

const props = defineProps<{
  paragraphId: string;
  glossaryTags?: GlossaryTag[];
  language?: string; // 'cz', 'en', etc. - omit for original/French
}>();

const isOpen = ref(false);

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
}

const mounted = ref(false);
const copied = ref(false);
const canShare = ref(false);

function getUrl() {
  return window.location.origin + window.location.pathname + `#p-${props.paragraphId.replace('.', '-')}`;
}

function copyLink() {
  navigator.clipboard.writeText(getUrl());
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

async function shareLink() {
  const url = getUrl();
  const title = document.title;

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url,
      });
    } catch (e) {
      // User cancelled or error - fall back to copy
      copyLink();
    }
  } else {
    copyLink();
  }
}

onMounted(() => {
  mounted.value = true;
  canShare.value = !!navigator.share;
});
</script>

<template>
  <div class="paragraph-menu">
    <!-- Menu toggle button -->
    <button
      @click="toggleMenu"
      class="menu-toggle"
      :class="{ 'has-tags': glossaryTags && glossaryTags.length > 0 }"
      :aria-expanded="isOpen"
      :title="glossaryTags?.length ? t('paragraph.relatedItems', { count: glossaryTags.length }) : t('paragraph.options')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    </button>

    <!-- Bottom sheet modal - deferred to avoid SSR hydration mismatch -->
    <Teleport v-if="mounted" to="body">
      <Transition name="ph-modal">
        <div v-if="isOpen" class="sheet-backdrop" @click="closeMenu">
          <div class="sheet-content" @click.stop>
            <!-- Close menu item -->
            <button @click="closeMenu" class="menu-item close-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{{ t('common.closeMenu') }}</span>
            </button>

            <!-- Paragraph ID header -->
            <div class="sheet-header">
              <span class="menu-title">{{ paragraphId }}</span>
            </div>

            <!-- Actions -->
            <div class="menu-section">
              <!-- Share button (if Web Share API available) -->
              <button v-if="canShare" @click="shareLink" class="menu-item">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{{ t('paragraph.share') }}</span>
              </button>
              <!-- Copy link button -->
              <button @click="copyLink" class="menu-item">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>{{ copied ? t('paragraph.copied') : t('paragraph.copyLink') }}</span>
              </button>
            </div>

            <!-- Glossary tags -->
            <div v-if="glossaryTags && glossaryTags.length > 0" class="menu-section">
              <div class="section-label">{{ t('paragraph.relatedEntries') }}</div>
              <a
                v-for="tag in glossaryTags"
                :key="tag.id"
                :href="language ? `/${language}/glossary/${tag.id}` : `/glossary/${tag.id}`"
                class="menu-item glossary-link"
                :class="`category-${tag.category || 'default'}`"
                @click="closeMenu"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
.paragraph-menu {
  position: relative;
  display: inline-flex;
}

.menu-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-toggle:hover {
  color: var(--color-accent, #B45309);
  background: var(--bg-secondary, #F5E6D3);
}

.menu-toggle.has-tags {
  color: var(--color-accent, #B45309);
}

.menu-title {
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

/* Bottom sheet styles */
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

</style>

<!-- Transition CSS must be unscoped to work with Teleport to body -->
<style>
.ph-modal-enter-active,
.ph-modal-leave-active {
  transition: opacity 0.2s ease;
}

.ph-modal-leave-active {
  pointer-events: none;
}

.ph-modal-enter-active .sheet-content,
.ph-modal-leave-active .sheet-content {
  transition: transform 0.2s ease;
}

.ph-modal-enter-from,
.ph-modal-leave-to {
  opacity: 0;
}

.ph-modal-enter-from .sheet-content,
.ph-modal-leave-to .sheet-content {
  transform: translateY(100%);
}
</style>
