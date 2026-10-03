import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRenderer, defineComponent, h, reactive, nextTick } from 'vue';

const auth = reactive({ isAuthenticated: false, loading: false, offline: false });
const starred = reactive(new Set<string>());
const stars = {
  init: vi.fn(() => Promise.resolve()),
  toggle: vi.fn(async (id: string, _lang?: string) => { starred.has(id) ? starred.delete(id) : starred.add(id); return true; }),
  isStarred: (id: string) => starred.has(id),
};
const track = vi.fn();

vi.mock('../../stores/auth', () => ({ useAuthStore: () => auth }));
vi.mock('../../stores/stars', () => ({ useStarsStore: () => stars }));
vi.mock('../../lib/analytics', () => ({ trackEvent: (...a: unknown[]) => track(...a) }));

import { useStarItem } from '../useStarItem';

// Minimal no-DOM renderer: enough to run setup + onMounted.
const { createApp } = createRenderer<any, any>({
  patchProp() {}, insert() {}, remove() {}, createElement: () => ({}), createText: () => ({}),
  createComment: () => ({}), setText() {}, setElementText() {}, parentNode: () => null,
  nextSibling: () => null,
});

function mountItem(id: string, lang?: string) {
  let api!: ReturnType<typeof useStarItem>;
  const C = defineComponent({
    setup() { api = useStarItem(() => id, () => lang, 'test'); return () => h('div'); },
  });
  createApp(C).mount({});
  return api;
}

beforeEach(() => {
  auth.isAuthenticated = false; auth.loading = false; auth.offline = false;
  starred.clear(); stars.toggle.mockClear(); stars.init.mockClear(); track.mockClear();
});

describe('useStarItem', () => {
  it('is empty until hydrated is set by onMounted, then follows auth', async () => {
    auth.isAuthenticated = true;
    const s = mountItem('008.0145', 'cz');
    await nextTick();
    expect(s.hydrated.value).toBe(true);
    expect(s.canStar.value).toBe(true);
    expect(s.showSignIn.value).toBe(false);
    expect(stars.init).toHaveBeenCalledOnce();
  });

  it('shows no star for glossary ids', async () => {
    auth.isAuthenticated = true;
    const s = mountItem('GLO_NICE');
    await nextTick();
    expect(s.starrable.value).toBe(false);
    expect(s.canStar.value).toBe(false);
    expect(s.showSignIn.value).toBe(false);
  });

  it('signed out shows sign-in only once auth has settled', async () => {
    auth.loading = true;
    const s = mountItem('008.0145');
    await nextTick();
    expect(s.showSignIn.value).toBe(false);
    auth.loading = false;
    expect(s.showSignIn.value).toBe(true);
    expect(s.canStar.value).toBe(false);
  });

  it('signed out and offline hides sign-in (like Report)', async () => {
    auth.offline = true;
    const s = mountItem('008.0145');
    await nextTick();
    expect(s.showSignIn.value).toBe(false);
    auth.offline = false;
    expect(s.showSignIn.value).toBe(true);
  });

  it('offline session still stars; toggle sends the ROUTE language', async () => {
    auth.isAuthenticated = true; auth.offline = true;
    const s = mountItem('008.0145', 'cz');
    await nextTick();
    await s.toggleStar();
    expect(stars.toggle).toHaveBeenCalledWith('008.0145', 'cz');
    expect(s.starred.value).toBe(true);
    expect(track).toHaveBeenCalledWith('paragraph_star', { paragraphId: '008.0145', source: 'test' });
    await s.toggleStar();
    expect(track).toHaveBeenLastCalledWith('paragraph_unstar', { paragraphId: '008.0145', source: 'test' });
    expect(s.starred.value).toBe(false);
  });

  it('original page (no lang) maps to original; fr route stays fr', async () => {
    auth.isAuthenticated = true;
    const a = mountItem('001.0001', undefined);
    const b = mountItem('001.0001', 'fr');
    await nextTick();
    await a.toggleStar(); await b.toggleStar();
    expect(stars.toggle.mock.calls.map(c => c[1])).toEqual(['original', 'fr']);
  });

  it('does nothing when signed out', async () => {
    const s = mountItem('001.0001', 'cz');
    await nextTick();
    await s.toggleStar();
    expect(stars.toggle).not.toHaveBeenCalled();
  });
});
