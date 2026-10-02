import { describe, it, expect } from 'vitest';
import { createSSRApp, createRenderer, h, defineComponent, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { useHydrated } from '../useHydrated';

let flag: { value: boolean } | undefined;
const Probe = defineComponent({
  setup() {
    flag = useHydrated();
    return () => h('span', flag!.value ? 'yes' : 'no');
  },
});

// Minimal custom renderer (the test env has no DOM) so onMounted really runs.
type N = { children: N[]; text?: string };
const { createApp } = createRenderer<N, N>({
  patchProp() {},
  insert(el, parent, anchor) {
    const i = anchor ? parent.children.indexOf(anchor) : -1;
    if (i < 0) parent.children.push(el); else parent.children.splice(i, 0, el);
  },
  remove(el) {},
  createElement: () => ({ children: [] }),
  createText: (text) => ({ children: [], text }),
  createComment: (text) => ({ children: [], text }),
  setText(n, text) { n.text = text; },
  setElementText(n, text) { n.text = text; },
  parentNode: () => null,
  nextSibling: () => null,
});

describe('useHydrated', () => {
  it('is false in the server render (onMounted never runs there)', async () => {
    expect(await renderToString(createSSRApp(Probe))).toContain('no');
  });

  it('is false for the first render and true after mount', async () => {
    const root: N = { children: [] };
    createApp(Probe).mount(root);
    expect(flag!.value).toBe(true);
    await nextTick();
    expect(root.children[0].text).toBe('yes');
  });
});
