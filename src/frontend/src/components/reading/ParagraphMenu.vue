<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useI18n } from '../../i18n';

const { t } = useI18n();

interface GlossaryTag {
  id: string;
  name: string;
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

// Check if Web Share API is available
if (typeof window !== 'undefined') {
  canShare.value = !!navigator.share;
}
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

    <!-- Bottom sheet modal (all screen sizes) -->
    <Teleport to="body">
      <Transition name="modal">
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
                @click="closeMenu"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .sheet-content,
.modal-leave-active .sheet-content {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .sheet-content,
.modal-leave-to .sheet-content {
  transform: translateY(100%);
}
</style>
