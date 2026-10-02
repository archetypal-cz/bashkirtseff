import { onMounted, ref, type Ref } from 'vue';

/**
 * False during setup and the hydrating render, true once the component has
 * mounted. All islands share one Pinia, so a store another island already
 * initialised (filter tags, history, auth) would make this island's first
 * client render differ from the server HTML. Gate store-derived render state
 * on this flag so the first client render equals SSR.
 */
export function useHydrated(): Ref<boolean> {
  const hydrated = ref(false);
  onMounted(() => {
    hydrated.value = true;
  });
  return hydrated;
}
