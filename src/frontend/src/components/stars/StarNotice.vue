<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n, type SupportedLocale } from '../../i18n';
import { useStarsStore } from '../../stores/stars';
import { useAuthStore } from '../../stores/auth';
import { useHydrated } from '../../composables/useHydrated';

// One per page (inside UnifiedMenu, which the Header mounts once): a small
// polite live region for the stars store's messages (cap / error / synced)
// and the offline "N changes waiting to sync" notice. Renders nothing during
// SSR / hydration and when there is nothing to say.

const props = defineProps<{ pageLocale?: SupportedLocale }>();
const { t } = useI18n(props.pageLocale);
const stars = useStarsStore();
const auth = useAuthStore();
const hydrated = useHydrated();

const VISIBLE_MS = 6000;
const shown = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => stars.lastMessage?.seq,
  () => {
    const m = stars.lastMessage;
    if (!m) return;
    shown.value = m.text;
    clearTimeout(timer);
    timer = setTimeout(() => { shown.value = null; }, VISIBLE_MS);
  },
);

const pending = computed(() =>
  hydrated.value && auth.isAuthenticated && stars.pendingCount > 0
    ? t('stars.queuedOffline', { count: stars.pendingCount })
    : null,
);
// A transient message wins over the pending count while it is visible.
const text = computed(() => (hydrated.value ? shown.value ?? pending.value : null));
</script>

<template>
  <div class="star-notice" role="status" aria-live="polite">
    <span v-if="text" class="star-notice__text">{{ text }}</span>
  </div>
</template>

<style scoped>
.star-notice {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  z-index: 60;
  max-width: min(32rem, calc(100vw - 2rem));
  pointer-events: none;
}
.star-notice__text {
  display: block;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  color: var(--text-primary, #2C1810);
  background: var(--bg-secondary, #F5E6D3);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.15));
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
