<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../i18n';

const { t } = useI18n();
const isVisible = ref(false);

function checkScroll() {
  isVisible.value = window.scrollY > 400;
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll);
});
</script>

<template>
  <Transition name="fade">
    <button
      v-if="isVisible"
      @click="scrollToTop"
      class="back-to-top"
      :aria-label="t('reading.backToTop')"
      :title="t('reading.backToTop')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: var(--bg-secondary, #F5E6D3);
  color: var(--text-primary, #2C1810);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  cursor: pointer;
  z-index: 40;
}

.back-to-top:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  background: var(--color-accent, #B45309);
  color: white;
  border-color: var(--color-accent, #B45309);
}

[data-theme="dark"] .back-to-top {
  background: #2a2a2a;
  color: #e5e5e5;
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .back-to-top:hover {
  background: var(--color-accent, #B45309);
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
