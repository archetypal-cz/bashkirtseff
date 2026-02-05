<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../i18n';

const { t } = useI18n();

interface GlossaryTag {
  id: string;
  name: string;
}

interface TooltipData {
  type?: string;
  summary?: string;
}

const props = defineProps<{
  paragraphId: string;
  glossaryTags?: GlossaryTag[];
  language?: string; // 'cz', 'en', etc. - omit for original/French
}>();

const isOpen = ref(false);
const activeTooltip = ref<string | null>(null);
const tooltipCache = reactive<Record<string, TooltipData | null>>({});
const tooltipLoading = ref(false);
const isMobile = ref(false);

// Mobile detection
function checkMobile() {
  isMobile.value = typeof window !== 'undefined' && window.innerWidth < 768;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile);
  }
});

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
  activeTooltip.value = null;
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

async function showTooltip(tagId: string) {
  activeTooltip.value = tagId;

  // Check cache first
  if (tooltipCache[tagId] !== undefined) {
    return;
  }

  tooltipLoading.value = true;
  try {
    const response = await fetch(`/api/glossary/${tagId}.json`);
    if (response.ok) {
      tooltipCache[tagId] = await response.json();
    } else {
      tooltipCache[tagId] = null;
    }
  } catch (e) {
    tooltipCache[tagId] = null;
  }
  tooltipLoading.value = false;
}

function hideTooltip() {
  activeTooltip.value = null;
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
      <span v-if="glossaryTags && glossaryTags.length > 0" class="tag-count">
        {{ glossaryTags.length }}
      </span>
    </button>

    <!-- Mobile: Full screen modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isOpen && isMobile" class="mobile-modal" @click="closeMenu">
          <div class="mobile-modal-content" @click.stop>
            <!-- Close menu item (first item on mobile) -->
            <button @click="closeMenu" class="menu-item close-item">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{{ t('common.closeMenu') }}</span>
            </button>

            <!-- Paragraph ID header -->
            <div class="mobile-menu-header">
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

    <!-- Desktop: Dropdown menu -->
    <Transition name="fade">
      <div v-if="isOpen && !isMobile" class="menu-dropdown" @click.stop>
        <div class="menu-header">
          <span class="menu-title">{{ paragraphId }}</span>
          <button @click="closeMenu" class="close-btn" :aria-label="t('common.close')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

        <!-- Glossary tags with tooltips -->
        <div v-if="glossaryTags && glossaryTags.length > 0" class="menu-section">
          <div class="section-label">{{ t('paragraph.relatedEntries') }}</div>
          <div
            v-for="tag in glossaryTags"
            :key="tag.id"
            class="glossary-item-wrapper"
            @mouseenter="showTooltip(tag.id)"
            @mouseleave="hideTooltip"
          >
            <a
              :href="language ? `/${language}/glossary/${tag.id}` : `/glossary/${tag.id}`"
              class="menu-item glossary-link"
              @click="closeMenu"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{{ tag.name }}</span>
            </a>
            <!-- Tooltip -->
            <Transition name="tooltip">
              <div v-if="activeTooltip === tag.id" class="glossary-tooltip">
                <div class="tooltip-header">
                  <span class="tooltip-name">{{ tag.name }}</span>
                  <span v-if="tooltipCache[tag.id]?.type" class="tooltip-type">
                    {{ tooltipCache[tag.id]?.type }}
                  </span>
                </div>
                <p v-if="tooltipLoading && !tooltipCache[tag.id]" class="tooltip-loading">
                  {{ t('common.loading') }}
                </p>
                <p v-else-if="tooltipCache[tag.id]?.summary" class="tooltip-summary">
                  {{ tooltipCache[tag.id]?.summary }}
                </p>
                <span class="tooltip-hint">{{ t('paragraph.clickToViewGlossary') }}</span>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Click outside handler (desktop only) -->
    <div v-if="isOpen && !isMobile" class="backdrop" @click="closeMenu" />
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

.tag-count {
  font-size: 0.625rem;
  font-weight: 600;
  min-width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent, #B45309);
  color: white;
  border-radius: 9999px;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.25rem;
  min-width: 220px;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
  overflow: hidden;
  /* Isolate from parent 3D transform context to ensure solid background */
  isolation: isolate;
  transform: translateZ(0);
  backface-visibility: hidden;
}

[data-theme="dark"] .menu-dropdown {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  background: var(--bg-secondary, #F5E6D3);
}

[data-theme="dark"] .menu-header {
  background: #252525;
}

.menu-title {
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
  color: var(--text-muted, #78716C);
}

.close-btn {
  padding: 0.125rem;
  color: var(--text-muted, #78716C);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary, #2C1810);
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

.glossary-item-wrapper {
  position: relative;
}

/* Tooltip styles */
.glossary-tooltip {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 0.5rem;
  min-width: 200px;
  max-width: 280px;
  padding: 0.75rem;
  background: var(--bg-primary, #FFF8F0);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 60;
  /* Isolate from parent 3D transform context */
  isolation: isolate;
  transform: translateZ(0);
  backface-visibility: hidden;
}

[data-theme="dark"] .glossary-tooltip {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.tooltip-name {
  font-weight: 600;
  color: var(--text-primary, #2C1810);
  font-size: 0.875rem;
}

[data-theme="dark"] .tooltip-name {
  color: #e5e5e5;
}

.tooltip-type {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.125rem 0.375rem;
  background: var(--color-accent, #B45309);
  color: white;
  border-radius: 0.25rem;
}

.tooltip-loading {
  font-size: 0.75rem;
  color: var(--text-muted, #78716C);
  font-style: italic;
  margin: 0;
}

.tooltip-summary {
  font-size: 0.75rem;
  color: var(--text-secondary, #4A3728);
  line-height: 1.5;
  margin: 0 0 0.375rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

[data-theme="dark"] .tooltip-summary {
  color: #a3a3a3;
}

.tooltip-hint {
  font-size: 0.625rem;
  color: var(--text-muted, #78716C);
  display: block;
  padding-top: 0.375rem;
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

/* Tooltip transition */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}

/* Mobile modal styles */
.mobile-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  padding: 1rem;
}

.mobile-modal-content {
  width: 100%;
  max-height: 80vh;
  background: var(--bg-primary, #FFF8F0);
  border-radius: 1rem 1rem 0 0;
  padding: 1rem;
  overflow-y: auto;
}

[data-theme="dark"] .mobile-modal-content {
  background: #1a1a1a;
}

[data-theme="sepia"] .mobile-modal-content {
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

.mobile-menu-header {
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}

.mobile-menu-header .menu-title {
  font-size: 0.875rem;
  font-weight: 600;
  font-family: monospace;
  color: var(--text-muted, #78716C);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .mobile-modal-content,
.modal-leave-active .mobile-modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .mobile-modal-content,
.modal-leave-to .mobile-modal-content {
  transform: translateY(100%);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
