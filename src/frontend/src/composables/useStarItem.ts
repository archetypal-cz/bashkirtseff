import { computed, onMounted, type ComputedRef, type Ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useStarsStore } from '../stores/stars';
import { isStarrableId, normalizeLanguage } from '../lib/stars';
import { trackEvent } from '../lib/analytics';
import { useHydrated } from './useHydrated';

/**
 * Star toggle state for one paragraph (ParagraphToolbar, ParagraphMenu).
 * Everything derived from the shared stores is gated on `hydrated`, so SSR
 * markup and the first client render agree (S0 rule); the stores are shared
 * by all islands, so a star in one island shows in the others.
 *
 * `routeLang` is the language of the ROUTE (url path: cz/en/uk/fr/es/original),
 * never the paragraph's source language: 'fr' means the modern French edition.
 */
export function useStarItem(
  getId: () => string,
  getRouteLang: () => string | undefined,
  source: string,
): {
  hydrated: Ref<boolean>;
  starrable: ComputedRef<boolean>;
  /** Signed in (an offline session counts): show the Star / Starred item. */
  canStar: ComputedRef<boolean>;
  /** Signed out, auth settled and online (like the Report item): show the muted "Sign in to star" item. */
  showSignIn: ComputedRef<boolean>;
  starred: ComputedRef<boolean>;
  toggleStar: () => Promise<void>;
} {
  const auth = useAuthStore();
  const stars = useStarsStore();
  const hydrated = useHydrated();

  onMounted(() => {
    stars.init().catch(() => {});
  });

  const starrable = computed(() => hydrated.value && isStarrableId(getId()));
  const canStar = computed(() => starrable.value && auth.isAuthenticated);
  const showSignIn = computed(() => starrable.value && !auth.isAuthenticated && !auth.loading && !auth.offline);
  const starred = computed(() => canStar.value && stars.isStarred(getId()));

  async function toggleStar() {
    const id = getId();
    if (!canStar.value) return;
    const wasStarred = stars.isStarred(id);
    trackEvent(wasStarred ? 'paragraph_unstar' : 'paragraph_star', { paragraphId: id, source });
    await stars.toggle(id, normalizeLanguage(getRouteLang()));
  }

  return { hydrated, starrable, canStar, showSignIn, starred, toggleStar };
}
