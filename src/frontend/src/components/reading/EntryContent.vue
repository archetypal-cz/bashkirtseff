<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useFilterStore } from '../../stores/filter';
import type { SupportedLocale } from '../../i18n';
import ParagraphToolbar from './ParagraphToolbar.vue';
import FilteredParagraphGap from './FilteredParagraphGap.vue';
import type { EntryDrawing } from '../../lib/drawings';

interface GlossaryTag {
  id: string;
  name: string;
  category?: string;
}

interface ProcessedParagraph {
  id: string;
  text: string;
  html: string;
  htmlId: string;
  originalHtml?: string;
  glossaryTags?: GlossaryTag[];
  footnoteRefs?: string[];
  languages?: string[];
  kind?: string;
  kindBodyHtml?: string; // body without label, for a paragraph inside a kind run
  kindRun?: KindRunInfo; // first paragraph of a run of same-kind, same-source paragraphs
  drawings?: EntryDrawing[]; // notebook drawings shown right after this paragraph
}

/** Mirrors KindRunInfo in lib/content.ts */
interface KindRunInfo {
  size: number;
  key: string;
  quoted: boolean;
  labelHtml: string;
  labelText: string;
}

const props = defineProps<{
  paragraphs: string; // JSON-serialized ProcessedParagraph[]
  isTranslation: boolean;
  urlPath: string;
  contentLangAttr: string;
  uiLocale?: SupportedLocale; // page UI locale, forwarded so SSR labels match it
  drawingLabel?: string;      // fallback alt text for a drawing without caption
}>();

const parsedParagraphs = computed<ProcessedParagraph[]>(() => {
  try {
    return JSON.parse(props.paragraphs);
  } catch {
    return [];
  }
});

const filterStore = useFilterStore();

onMounted(() => {
  filterStore.init();
  // H3: the 833 KB filter index is only needed when a filter is actually active.
  // Load it lazily — at startup only if the store restored persisted active tags
  // from localStorage; otherwise it loads when the filter UI is opened
  // (FilterButton / UnifiedMenu / FilterOverlay all call loadIndex() on open).
  if (filterStore.isActive) {
    filterStore.loadIndex();
  }
});

// Entity categories that support paragraph-level filtering
const ENTITY_CATEGORIES = new Set(['people', 'places', 'culture', 'themes']);

/** All selected tag IDs from entity categories (people, places, culture, themes) */
const activeEntityTagIds = computed<Set<string>>(() => {
  const ids = new Set<string>();
  for (const [category, tags] of Object.entries(filterStore.selectedTags)) {
    if (ENTITY_CATEGORIES.has(category)) {
      for (const tag of tags) {
        ids.add(tag.toLowerCase());
      }
    }
  }
  return ids;
});

/** Whether any entity-level filter is active (not just editions/location) */
const hasEntityFilter = computed(() => activeEntityTagIds.value.size > 0);

/** Check if a paragraph matches the active entity filter */
function paragraphMatches(para: ProcessedParagraph): boolean {
  if (!para.glossaryTags || para.glossaryTags.length === 0) return false;
  return para.glossaryTags.some(tag => activeEntityTagIds.value.has(tag.id.toLowerCase()));
}

type RenderItem =
  | { type: 'paragraph'; paragraph: ProcessedParagraph }
  | { type: 'kindRun'; run: KindRunInfo; paragraphs: ProcessedParagraph[] }
  | { type: 'gap'; paragraphs: ProcessedParagraph[]; count: number };

/** Build the render list: matching paragraphs + gap groups */
const renderItems = computed<RenderItem[]>(() => {
  const paras = parsedParagraphs.value;

  // No entity filter active → show all paragraphs normally, a run of
  // same-kind, same-source paragraphs (a clipping over several paragraphs)
  // as one labelled block. Under a filter each paragraph keeps its own label.
  if (!hasEntityFilter.value) {
    const items: RenderItem[] = [];
    for (let i = 0; i < paras.length; i++) {
      const run = paras[i].kindRun;
      if (run && run.size > 1) {
        items.push({ type: 'kindRun', run, paragraphs: paras.slice(i, i + run.size) });
        i += run.size - 1;
      } else {
        items.push({ type: 'paragraph', paragraph: paras[i] });
      }
    }
    return items;
  }

  const items: RenderItem[] = [];
  let gapBuffer: ProcessedParagraph[] = [];

  function flushGap() {
    if (gapBuffer.length > 0) {
      items.push({ type: 'gap', paragraphs: [...gapBuffer], count: gapBuffer.length });
      gapBuffer = [];
    }
  }

  for (const para of paras) {
    if (paragraphMatches(para)) {
      flushGap();
      items.push({ type: 'paragraph', paragraph: para });
    } else {
      gapBuffer.push(para);
    }
  }
  flushGap();

  return items;
});

// Handle deep linking after filter changes — if a hash target is in a gap, we need to
// let the browser scroll work. We just need to make sure the DOM has the right IDs.
// The gap component renders paragraph IDs inside expanded content, so deep links work
// when the gap is expanded.
</script>

<template>
  <template v-for="(item, idx) in renderItems" :key="idx">
    <!-- Matching paragraph (or all paragraphs when no filter), then any
         notebook drawings that belong next to it -->
    <template v-if="item.type === 'paragraph'">
      <div
        :id="item.paragraph.htmlId"
        class="paragraph-container scroll-mt-24"
        :data-paragraph-id="item.paragraph.id"
        :style="isTranslation ? 'perspective: 1000px;' : undefined"
      >
        <ParagraphToolbar
          :paragraphId="item.paragraph.id"
          :htmlContent="item.paragraph.html"
          :originalHtml="isTranslation ? item.paragraph.originalHtml : undefined"
          :languages="isTranslation ? item.paragraph.languages : undefined"
          :translationLang="isTranslation ? urlPath : undefined"
          :glossaryTags="item.paragraph.glossaryTags"
          :language="urlPath"
          :contentLang="contentLangAttr"
          :pageLocale="uiLocale"
        />
      </div>
      <figure v-for="d in item.paragraph.drawings ?? []" :key="d.src" class="entry-drawing">
        <img :src="d.src" :alt="d.alt ?? d.caption ?? drawingLabel ?? ''" loading="lazy" decoding="async" />
        <figcaption v-if="d.caption || d.source">
          {{ d.caption }}
          <span v-if="d.source" class="entry-drawing-source">{{ d.source }}</span>
        </figcaption>
      </figure>
    </template>

    <!-- Run of same-kind, same-source paragraphs: one block, labelled once
         (role=group named by the label text, the visible label hidden from
         screen readers so it is announced once); each paragraph keeps its anchor,
         toolbar and flip card -->
    <component
      v-else-if="item.type === 'kindRun'"
      :is="item.run.quoted ? 'blockquote' : 'div'"
      :class="['para-kind', 'para-kind-group', `para-kind-${item.run.key}`]"
      :data-kind="item.run.key"
      role="group"
      :aria-label="item.run.labelText"
    >
      <span class="para-kind-label" aria-hidden="true" v-html="item.run.labelHtml" />
      <template v-for="p in item.paragraphs" :key="p.id">
        <div
          :id="p.htmlId"
          class="paragraph-container scroll-mt-24"
          :data-paragraph-id="p.id"
          :style="isTranslation ? 'perspective: 1000px;' : undefined"
        >
          <ParagraphToolbar
            :paragraphId="p.id"
            :htmlContent="p.kindBodyHtml ?? p.html"
            :originalHtml="isTranslation ? p.originalHtml : undefined"
            :languages="isTranslation ? p.languages : undefined"
            :translationLang="isTranslation ? urlPath : undefined"
            :glossaryTags="p.glossaryTags"
            :language="urlPath"
            :contentLang="contentLangAttr"
            :pageLocale="uiLocale"
          />
        </div>
        <figure v-for="d in p.drawings ?? []" :key="d.src" class="entry-drawing">
          <img :src="d.src" :alt="d.alt ?? d.caption ?? drawingLabel ?? ''" loading="lazy" decoding="async" />
          <figcaption v-if="d.caption || d.source">
            {{ d.caption }}
            <span v-if="d.source" class="entry-drawing-source">{{ d.source }}</span>
          </figcaption>
        </figure>
      </template>
    </component>

    <!-- Gap: consecutive non-matching paragraphs -->
    <FilteredParagraphGap
      v-else
      :paragraphs="item.paragraphs.map(p => ({ id: p.id, html: p.html }))"
      :count="item.count"
      :pageLocale="uiLocale"
    />
  </template>
</template>
