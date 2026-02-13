<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useFilterStore } from '../../stores/filter';
import ParagraphToolbar from './ParagraphToolbar.vue';
import FilteredParagraphGap from './FilteredParagraphGap.vue';

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
  originalText?: string;
  glossaryTags?: GlossaryTag[];
  footnoteRefs?: string[];
  languages?: string[];
}

const props = defineProps<{
  paragraphs: string; // JSON-serialized ProcessedParagraph[]
  isTranslation: boolean;
  urlPath: string;
  contentLangAttr: string;
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
  filterStore.loadIndex();
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
  | { type: 'gap'; paragraphs: ProcessedParagraph[]; count: number };

/** Build the render list: matching paragraphs + gap groups */
const renderItems = computed<RenderItem[]>(() => {
  const paras = parsedParagraphs.value;

  // No entity filter active → show all paragraphs normally
  if (!hasEntityFilter.value) {
    return paras.map(p => ({ type: 'paragraph' as const, paragraph: p }));
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
    <!-- Matching paragraph (or all paragraphs when no filter) -->
    <div
      v-if="item.type === 'paragraph'"
      :id="item.paragraph.htmlId"
      class="paragraph-container scroll-mt-24"
      :data-paragraph-id="item.paragraph.id"
      :style="isTranslation ? 'perspective: 1000px;' : undefined"
    >
      <ParagraphToolbar
        :paragraphId="item.paragraph.id"
        :htmlContent="item.paragraph.html"
        :originalText="isTranslation ? item.paragraph.originalText : undefined"
        :languages="isTranslation ? item.paragraph.languages : undefined"
        :translationLang="isTranslation ? urlPath : undefined"
        :glossaryTags="item.paragraph.glossaryTags"
        :language="urlPath"
        :contentLang="contentLangAttr"
      />
    </div>

    <!-- Gap: consecutive non-matching paragraphs -->
    <FilteredParagraphGap
      v-else
      :paragraphs="item.paragraphs.map(p => ({ id: p.id, html: p.html, originalText: p.originalText }))"
      :count="item.count"
    />
  </template>
</template>
