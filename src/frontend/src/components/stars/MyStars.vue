<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from '../../i18n';
import type { SupportedLocale } from '../../i18n';
import { useAuthStore } from '../../stores/auth';
import { useStarsStore } from '../../stores/stars';
import { listStars, type ServerStar } from '../../lib/stars';
import { useHydrated } from '../../composables/useHydrated';
import { trackEvent } from '../../lib/analytics';
import {
  buildExport,
  carnetsNeeded,
  diaryLangForLocale,
  entryDate,
  exportFilename,
  groupByCarnet,
  resolveStar,
  type IndexFile,
} from '../../lib/my-stars';

const props = defineProps<{ locale?: string }>();

const { t } = useI18n(props.locale as SupportedLocale | undefined);
const auth = useAuthStore();
const stars = useStarsStore();
const hydrated = useHydrated();

// Snippets and links follow the language of the page (/cs/stars/ -> cz); staged
// languages without a diary tree (es) read the original and show the badge on every row.
const diary = diaryLangForLocale(props.locale ?? 'cs');
const intlLocale = ({ cs: 'cs-CZ', fr: 'fr-FR', en: 'en-US', uk: 'uk-UA', es: 'es-ES' } as Record<string, string>)[props.locale ?? 'cs'] ?? 'en-US';

const listLoaded = ref(false); // stars.init() settled (it includes the first server fetch when online)
const online = ref(true);
const indexes = ref<Record<string, IndexFile | null>>({}); // `${lang}/${carnet}` -> file (null: absent)
const netFailed = ref<Record<string, true>>({}); // index keys whose fetch failed by network (not a 404): unknown, not "missing"
const inFlight = new Set<string>();
const indexLoading = ref(false);
let loadGen = 0;
const busy = ref(false);
const status = ref('');
const showConsent = ref(false);

function updateOnline() {
  online.value = navigator.onLine !== false;
  // watch(online) below reloads the indexes (retries the network-failed keys)
}

onMounted(async () => {
  online.value = navigator.onLine !== false;
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  try {
    await auth.init();
    await stars.init();
  } catch {
    // offline / failed init: the cached list still renders
  }
  listLoaded.value = true;
});
onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnline);
  window.removeEventListener('offline', updateOnline);
});

const ids = computed(() => (hydrated.value ? [...stars.displayed] : []));

async function fetchIndex(lang: string, carnet: string) {
  const key = `${lang}/${carnet}`;
  if ((key in indexes.value && !(key in netFailed.value)) || inFlight.has(key)) return;
  inFlight.add(key);
  try {
    // Plain fetch: the SW route for /data/paragraphs/ caches the file for offline.
    const res = await fetch(`/data/paragraphs/${lang}/${carnet}.json`);
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    const file = res.ok ? ((await res.json()) as IndexFile) : null; // parse BEFORE spreading: concurrent fetches must not lose updates
    indexes.value = { ...indexes.value, [key]: file };
    if (key in netFailed.value) {
      const { [key]: _gone, ...rest } = netFailed.value;
      netFailed.value = rest;
    }
  } catch {
    // Offline and not cached (or a server error): unknown, not absent. Retried when back online.
    netFailed.value = { ...netFailed.value, [key]: true };
    indexes.value = { ...indexes.value, [key]: null };
  } finally {
    inFlight.delete(key);
  }
}

async function loadIndexes() {
  const jobs: Array<[string, string]> = [];
  for (const carnet of carnetsNeeded(ids.value)) {
    if (diary.translated) jobs.push([diary.urlPath, carnet]);
    jobs.push(['original', carnet]);
  }
  const todo = jobs.filter(([l, c]) => !(`${l}/${c}` in indexes.value) || `${l}/${c}` in netFailed.value);
  if (!todo.length) return;
  const gen = ++loadGen;
  indexLoading.value = true;
  try {
    for (let i = 0; i < todo.length; i += 6) {
      await Promise.all(todo.slice(i, i + 6).map(([l, c]) => fetchIndex(l, c)));
    }
  } finally {
    if (gen === loadGen) indexLoading.value = false;
  }
}

watch(ids, () => { if (hydrated.value) loadIndexes(); }, { immediate: true });
watch(online, (v) => { if (v) loadIndexes(); });

const resolved = computed(() =>
  ids.value.map((id) => {
    const carnet = id.slice(0, 3);
    return resolveStar(
      id,
      diary.translated ? diary.urlPath : 'original',
      indexes.value[`${diary.urlPath}/${carnet}`],
      indexes.value[`original/${carnet}`],
      { lang: `${diary.urlPath}/${carnet}` in netFailed.value, original: `original/${carnet}` in netFailed.value },
    );
  }),
);
const groups = computed(() => groupByCarnet(resolved.value));

/** Index files for every carnet in the list have settled (so "missing" is trustworthy). */
const indexesReady = computed(() =>
  carnetsNeeded(ids.value).every((c) => `original/${c}` in indexes.value && (!diary.translated || `${diary.urlPath}/${c}` in indexes.value)),
);

type View = 'loading' | 'signedOut' | 'empty' | 'list';
const view = computed<View>(() => {
  if (!hydrated.value || auth.loading) return 'loading';
  if (!auth.isAuthenticated) return 'signedOut';
  if (!stars.ready) return 'loading';
  if (ids.value.length === 0) return listLoaded.value ? 'empty' : 'loading';
  return 'list';
});

const isOffline = computed(() => hydrated.value && (auth.offline || !online.value));

function formatDate(entry: string | null): string {
  const d = entryDate(entry);
  return d ? d.toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
}

async function unstar(id: string) {
  await stars.toggle(id, diary.urlPath);
  status.value = t('stars.removed');
}

async function exportJson() {
  if (busy.value) return;
  busy.value = true;
  try {
    let server: ServerStar[] | null = null;
    if (!isOffline.value) {
      const r = await listStars();
      server = r.outcome === 'ok' && r.data ? r.data : null;
    }
    const payload = buildExport(resolved.value, server);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    trackEvent('stars_export');
  } finally {
    busy.value = false;
  }
}

async function removeAll() {
  if (busy.value || isOffline.value) return;
  if (!window.confirm(t('stars.removeAllConfirm'))) return;
  busy.value = true;
  try {
    if (await stars.removeAll()) {
      status.value = t('stars.removed');
      trackEvent('stars_remove_all');
    }
  } finally {
    busy.value = false;
  }
}

function signIn() {
  if (!localStorage.getItem('auth-consent')) {
    showConsent.value = true;
    return;
  }
  auth.signIn();
}
function confirmAndSignIn() {
  localStorage.setItem('auth-consent', '1');
  showConsent.value = false;
  auth.signIn();
}
</script>

<template>
  <div class="my-stars">
    <p v-if="view === 'loading'" class="my-stars__note" role="status">{{ t('common.loading') }}</p>

    <section v-else-if="view === 'signedOut'" class="my-stars__signed-out">
      <p class="my-stars__note">{{ t('stars.signedOutIntro') }}</p>
      <template v-if="showConsent">
        <p class="my-stars__note">{{ t('stars.preLoginInfo') }}</p>
        <div class="my-stars__actions">
          <button type="button" class="my-stars__btn" @click="showConsent = false">{{ t('common.close') }}</button>
          <button type="button" class="my-stars__btn my-stars__btn--primary" @click="confirmAndSignIn">
            {{ t('auth.continueWithGoogle') }}
          </button>
        </div>
      </template>
      <button v-else type="button" class="my-stars__btn my-stars__btn--primary" @click="signIn">
        {{ t('auth.signInGoogle') }}
      </button>
    </section>

    <template v-else>
      <p v-if="isOffline" class="my-stars__note my-stars__note--offline" role="status">{{ t('stars.offlineList') }}</p>
      <p v-if="stars.pendingCount > 0" class="my-stars__note" role="status">
        {{ t('stars.queuedOffline', { count: stars.pendingCount }) }}
      </p>
      <p v-if="stars.lastMessage" :key="stars.lastMessage.seq" class="my-stars__note my-stars__note--alert" role="alert">
        {{ stars.lastMessage.text }}
      </p>

      <p v-if="view === 'empty'" class="my-stars__note">{{ t('stars.empty') }}</p>

      <template v-else>
        <div class="my-stars__actions">
          <button type="button" class="my-stars__btn" :disabled="busy" @click="exportJson">{{ t('stars.export') }}</button>
          <button
            type="button"
            class="my-stars__btn my-stars__btn--danger"
            :disabled="busy || isOffline"
            @click="removeAll"
          >
            {{ t('stars.removeAll') }}
          </button>
        </div>

        <section v-for="g in groups" :key="g.carnet ?? 'none'" class="my-stars__group">
          <h2 v-if="g.carnet" class="my-stars__carnet">{{ t('sidebar.carnet', { carnet: g.carnet }) }}</h2>
          <ul class="my-stars__list">
            <li v-for="s in g.items" :key="s.id" class="my-stars__item">
              <div class="my-stars__body">
                <template v-if="s.missing">
                  <p v-if="!indexesReady || indexLoading" class="my-stars__meta">{{ t('common.loading') }}</p>
                  <template v-else>
                    <p class="my-stars__meta">{{ s.id }}</p>
                    <p class="my-stars__missing">{{ s.state === 'unavailable' ? t('stars.unavailableOffline') : t('stars.missingPassage') }}</p>
                  </template>
                </template>
                <a v-else :href="s.href!" class="my-stars__link">
                  <span v-if="formatDate(s.entry)" class="my-stars__meta">{{ formatDate(s.entry) }}</span>
                  <span class="my-stars__snippet">{{ s.snippet }}</span>
                </a>
                <span v-if="!s.missing && (s.fromOriginal || !diary.translated)" class="my-stars__badge">
                  {{ t('stars.originalBadge') }}
                </span>
              </div>
              <button
                type="button"
                class="my-stars__unstar"
                :aria-label="t('stars.unstar')"
                :title="t('stars.unstar')"
                @click="unstar(s.id)"
              >
                &#9733;
              </button>
            </li>
          </ul>
        </section>
      </template>
    </template>

    <p class="sr-only" aria-live="polite">{{ status }}</p>
  </div>
</template>

<style scoped>
.my-stars { min-width: 0; }
.my-stars__note { margin: 0 0 1rem; line-height: 1.5; color: var(--text-secondary, #5c5650); overflow-wrap: anywhere; }
.my-stars__note--offline { font-size: 0.9rem; }
.my-stars__note--alert { color: var(--color-bordeaux, #8b2331); }
.my-stars__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0 0 1.25rem; }
.my-stars__btn {
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.25));
  border-radius: 0.375rem;
  background: var(--bg-secondary, #f5e6d3);
  color: var(--text-primary, #2c1810);
  font: inherit;
  cursor: pointer;
}
.my-stars__btn--primary { background: var(--accent, #8b4513); color: #fff; border-color: transparent; }
.my-stars__btn--danger { color: var(--color-bordeaux, #8b2331); }
.my-stars__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.my-stars__group { margin: 0 0 1.5rem; }
.my-stars__carnet {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--text-primary, #2c1810);
  font-family: var(--font-display);
}
.my-stars__list { list-style: none; margin: 0; padding: 0; }
.my-stars__item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem 0;
  border-top: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
}
.my-stars__body { flex: 1; min-width: 0; }
.my-stars__link { display: block; color: inherit; text-decoration: none; }
.my-stars__link:hover .my-stars__snippet, .my-stars__link:focus-visible .my-stars__snippet { text-decoration: underline; }
.my-stars__meta { display: block; font-size: 0.8125rem; color: var(--text-muted, #5c5650); margin: 0 0 0.125rem; }
.my-stars__snippet { display: block; line-height: 1.45; overflow-wrap: anywhere; }
.my-stars__missing { margin: 0; font-style: italic; color: var(--text-muted, #5c5650); }
.my-stars__badge {
  display: inline-block;
  margin-top: 0.25rem;
  padding: 0 0.4rem;
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.25));
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted, #5c5650);
}
.my-stars__unstar {
  flex: none;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  background: transparent;
  font-size: 1.25rem;
  color: var(--accent, #8b4513);
  cursor: pointer;
}
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
