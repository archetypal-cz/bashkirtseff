<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useHistoryStore } from '../../stores/history';

const historyStore = useHistoryStore();

function handleParagraphRead(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (!detail) return;

  const { paragraphId, text, carnet, entryDate, language, url } = detail;
  if (!paragraphId || !carnet) return;

  // Truncate text for display
  const plainText = (text || '').replace(/<[^>]*>/g, '').trim();
  const label = plainText.length > 50 ? plainText.slice(0, 50) + '...' : plainText;

  historyStore.addParagraph({
    paragraphId,
    carnet,
    entryDate,
    language: language || 'original',
    label,
    url: url || window.location.pathname + `#p-${paragraphId.replace('.', '-')}`,
  });
}

function handleGlossaryVisit(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (!detail) return;

  const { glossaryId, glossaryName, language, url } = detail;
  if (!glossaryId) return;

  historyStore.addGlossary({
    glossaryId,
    glossaryName,
    language: language || 'original',
    label: glossaryName || glossaryId,
    url: url || window.location.pathname,
  });
}

onMounted(() => {
  historyStore.init();
  window.addEventListener('paragraph-read', handleParagraphRead);
  window.addEventListener('glossary-visit', handleGlossaryVisit);
});

onUnmounted(() => {
  window.removeEventListener('paragraph-read', handleParagraphRead);
  window.removeEventListener('glossary-visit', handleGlossaryVisit);
});
</script>

<template>
  <!-- Headless component — no visible output -->
  <span style="display:none" />
</template>
