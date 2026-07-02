<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { getOverview, NotAuthorizedError, type Overview } from '../../lib/admin';

const auth = useAuthStore();

type View = 'loading' | 'signin' | 'forbidden' | 'ready' | 'error';

const view = ref<View>('loading');
const data = ref<Overview | null>(null);
const errorMsg = ref('');

async function load() {
  view.value = 'loading';
  await auth.init();

  if (!auth.isAuthenticated || !auth.token) {
    view.value = 'signin';
    return;
  }

  try {
    data.value = await getOverview(auth.token);
    view.value = 'ready';
  } catch (e) {
    if (e instanceof NotAuthorizedError) {
      view.value = 'forbidden';
    } else {
      errorMsg.value = e instanceof Error ? e.message : 'Unknown error';
      view.value = 'error';
    }
  }
}

function fmt(n: number): string {
  return new Intl.NumberFormat().format(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

onMounted(load);
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl text-ink mb-6" style="font-family: var(--font-serif);">Admin Dashboard</h1>

    <!-- Loading -->
    <p v-if="view === 'loading'" class="text-muted">Loading…</p>

    <!-- Needs sign-in -->
    <div v-else-if="view === 'signin'" class="text-center py-12">
      <p class="text-muted mb-4">Sign in with an admin account to view the dashboard.</p>
      <button
        @click="auth.signIn()"
        class="px-4 py-2 rounded text-white"
        style="background: var(--color-accent, #9A4707);"
      >
        Sign in with Google
      </button>
    </div>

    <!-- Not an admin -->
    <div v-else-if="view === 'forbidden'" class="text-center py-12">
      <p class="text-ink mb-2">Not authorized</p>
      <p class="text-sm text-muted mb-4">
        Signed in as {{ auth.displayName }} — this account is not an admin.
      </p>
      <button @click="auth.signOut()" class="text-sm underline text-muted">Sign out</button>
    </div>

    <!-- Error -->
    <div v-else-if="view === 'error'" class="text-center py-12">
      <p class="text-red-600 mb-4">{{ errorMsg }}</p>
      <button @click="load" class="text-sm underline text-muted">Retry</button>
    </div>

    <!-- Dashboard -->
    <div v-else-if="view === 'ready' && data" class="space-y-8">
      <!-- Users -->
      <section>
        <h2 class="text-lg text-ink mb-3">Users</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.users.total) }}</div>
            <div class="stat-card__label">Total registered</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.users.active_1d) }}</div>
            <div class="stat-card__label">Active (24h)</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.users.active_7d) }}</div>
            <div class="stat-card__label">Active (7d)</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.users.active_30d) }}</div>
            <div class="stat-card__label">Active (30d)</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.users.new_1d) }}</div>
            <div class="stat-card__label">New (24h)</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.users.new_7d) }}</div>
            <div class="stat-card__label">New (7d)</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.users.new_30d) }}</div>
            <div class="stat-card__label">New (30d)</div>
          </div>
        </div>
      </section>

      <!-- Bug reports -->
      <section>
        <h2 class="text-lg text-ink mb-3">Bug reports</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div class="stat-card stat-card--accent">
            <div class="stat-card__value">{{ fmt(data.reports.open) }}</div>
            <div class="stat-card__label">Open</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.reports.total) }}</div>
            <div class="stat-card__label">Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ fmt(data.reports.byStatus.fixed || 0) }}</div>
            <div class="stat-card__label">Fixed</div>
          </div>
        </div>

        <div v-if="data.reports.recentOpen.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted border-b border-[var(--border-color,rgba(44,24,16,0.1))]">
                <th class="py-2 pr-3">Paragraph</th>
                <th class="py-2 pr-3">Lang</th>
                <th class="py-2 pr-3">Reason</th>
                <th class="py-2">When</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in data.reports.recentOpen"
                :key="r.id"
                class="border-b border-[var(--border-color,rgba(44,24,16,0.06))]"
              >
                <td class="py-2 pr-3 font-mono">{{ r.paragraph_id }}</td>
                <td class="py-2 pr-3 uppercase">{{ r.language }}</td>
                <td class="py-2 pr-3">{{ r.reason }}</td>
                <td class="py-2 text-muted">{{ fmtDate(r.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-muted">No open reports. 🎉</p>
      </section>

      <!-- Analytics -->
      <section>
        <h2 class="text-lg text-ink mb-3">Site analytics</h2>
        <div v-if="data.analytics" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted border-b border-[var(--border-color,rgba(44,24,16,0.1))]">
                <th class="py-2 pr-3">Range</th>
                <th class="py-2 pr-3">Pageviews</th>
                <th class="py-2 pr-3">Visitors</th>
                <th class="py-2">Visits</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-[var(--border-color,rgba(44,24,16,0.06))]">
                <td class="py-2 pr-3">Last 24h</td>
                <td class="py-2 pr-3">{{ fmt(data.analytics.day.pageviews) }}</td>
                <td class="py-2 pr-3">{{ fmt(data.analytics.day.visitors) }}</td>
                <td class="py-2">{{ fmt(data.analytics.day.visits) }}</td>
              </tr>
              <tr class="border-b border-[var(--border-color,rgba(44,24,16,0.06))]">
                <td class="py-2 pr-3">Last 7 days</td>
                <td class="py-2 pr-3">{{ fmt(data.analytics.week.pageviews) }}</td>
                <td class="py-2 pr-3">{{ fmt(data.analytics.week.visitors) }}</td>
                <td class="py-2">{{ fmt(data.analytics.week.visits) }}</td>
              </tr>
              <tr>
                <td class="py-2 pr-3">Last 30 days</td>
                <td class="py-2 pr-3">{{ fmt(data.analytics.month.pageviews) }}</td>
                <td class="py-2 pr-3">{{ fmt(data.analytics.month.visitors) }}</td>
                <td class="py-2">{{ fmt(data.analytics.month.visits) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-muted">Analytics unavailable.</p>
      </section>

      <p class="text-xs text-muted pt-4">Generated {{ fmtDate(data.generatedAt) }}</p>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 0.75rem 1rem;
  background: var(--bg-secondary, #F5E6D3);
  border: 1px solid var(--border-color, rgba(44, 24, 16, 0.1));
  border-radius: 0.5rem;
}

[data-theme='dark'] .stat-card {
  background: #1f1f1f;
  border-color: rgba(255, 255, 255, 0.1);
}

.stat-card--accent {
  border-color: var(--color-accent, #9A4707);
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #2C1810);
}

[data-theme='dark'] .stat-card__value {
  color: #e5e5e5;
}

.stat-card__label {
  font-size: 0.75rem;
  color: var(--text-muted, #5C5650);
  margin-top: 0.125rem;
}
</style>
