<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../../components/PageHeader.vue'
import StatCard from '../../components/StatCard.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import DataTable from '../../components/DataTable.vue'
import EmptyState from '../../components/EmptyState.vue'
import { http } from '../../lib/api.js'
import { DISCIPLINE_LABELS, ENTRY_STATUS, PAYMENT_STATUS, fmtDateTime } from '../../lib/format.js'
import { isSuperAdmin, session } from '../../lib/session.js'

const router = useRouter()
const stats = ref(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await http.get('/admin/stats')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const statusOrder = ['submitted', 'under_review', 'approved', 'correction_required', 'rejected', 'cancelled']
const statusRows = computed(() => {
  const by = stats.value?.registrations?.by_status || {}
  const rows = statusOrder.map((s) => ({ key: s, label: ENTRY_STATUS[s]?.label || s, tone: ENTRY_STATUS[s]?.tone, n: by[s] || 0 }))
  const max = Math.max(1, ...rows.map((r) => r.n))
  return rows.map((r) => ({ ...r, pct: Math.round((r.n / max) * 100) }))
})

const disciplineRows = computed(() => {
  const list = stats.value?.registrations?.by_discipline || []
  const max = Math.max(1, ...list.map((d) => d.n))
  return list.map((d) => ({ key: d.discipline, label: DISCIPLINE_LABELS[d.discipline] || d.discipline, n: d.n, pct: Math.round((d.n / max) * 100) }))
})

const paymentRows = computed(() => {
  const by = stats.value?.registrations?.by_payment || {}
  return ['paid', 'pending', 'unpaid', 'waived', 'refunded']
    .filter((k) => by[k])
    .map((k) => ({ key: k, label: PAYMENT_STATUS[k]?.label || k, count: by[k].count, amount: by[k].amount }))
})

const toneBar = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-[#f2c94c]',
  info: 'bg-[#7cb7ff]',
  ember: 'bg-ember',
  muted: 'bg-smoke',
}

const recentColumns = [
  { key: 'code', label: 'Entry' },
  { key: 'event_name', label: 'Championship' },
  { key: 'team_name', label: 'Team' },
  { key: 'category_name', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'submitted_at', label: 'Submitted' },
]

const quickLinks = [
  { label: 'New championship', to: '/portal/admin/events/new', icon: 'plus' },
  { label: 'Review submitted entries', to: { path: '/portal/admin/registrations', query: { status: 'submitted' } }, icon: 'clipboard' },
  { label: 'Confirm pending payments', to: { path: '/portal/admin/payments', query: { status: 'pending' } }, icon: 'card' },
  { label: 'Reports & exports', to: '/portal/admin/reports', icon: 'download' },
]
</script>

<template>
  <div>
    <PageHeader eyebrow="Administration" title="Overview" :subtitle="`Welcome back${session.user?.name ? `, ${session.user.name}` : ''}. Here is where your championships stand.`">
      <template #actions>
        <BaseButton variant="outline" size="sm" icon="refresh" :disabled="loading" @click="load">Refresh</BaseButton>
        <BaseButton size="sm" icon="plus" to="/portal/admin/events/new">New championship</BaseButton>
      </template>
    </PageHeader>

    <div v-if="loading && !stats" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      <div v-for="n in 8" :key="n" class="skeleton h-36" />
    </div>

    <EmptyState v-else-if="error && !stats" icon="alert" title="Could not load the overview" :message="error">
      <BaseButton size="sm" variant="outline" icon="refresh" @click="load">Try again</BaseButton>
    </EmptyState>

    <template v-else-if="stats">
      <section aria-label="Key figures" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open for registration" :value="stats.events.open" :hint="`${stats.events.published} published of ${stats.events.total}`" icon="trophy" to="/portal/admin/events" />
        <StatCard
          label="Awaiting review"
          :value="stats.registrations.awaiting_review"
          hint="Submitted or under review"
          icon="clipboard"
          :accent="stats.registrations.awaiting_review > 0"
          :to="{ path: '/portal/admin/registrations', query: { status: 'submitted' } }"
        />
        <StatCard label="Athletes entered" :value="stats.participants?.athletes || 0" :hint="`${stats.participants?.teams || 0} teams · ${stats.participants?.clubs || 0} clubs`" icon="kick" to="/portal/admin/athletes" />
        <StatCard
          label="Pending payments"
          :value="stats.pending_payments"
          hint="Receipts waiting for confirmation"
          icon="card"
          :accent="stats.pending_payments > 0"
          :to="{ path: '/portal/admin/payments', query: { status: 'pending' } }"
        />
      </section>

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <section class="p-card p-5 sm:p-6" aria-labelledby="by-status-title">
          <h2 id="by-status-title" class="font-display text-xl uppercase tracking-wide text-bone">Entries by status</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="row in statusRows" :key="row.key">
              <RouterLink :to="{ path: '/portal/admin/registrations', query: { status: row.key } }" class="group block">
                <div class="flex items-baseline justify-between gap-3 text-sm">
                  <span class="text-ash group-hover:text-bone">{{ row.label }}</span>
                  <span class="font-semibold text-bone">{{ row.n }}</span>
                </div>
                <div class="mt-1.5 h-1.5 bg-iron" aria-hidden="true">
                  <div class="h-full transition-[width] duration-500" :class="toneBar[row.tone] || 'bg-ember'" :style="{ width: `${row.pct}%` }" />
                </div>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="p-card p-5 sm:p-6" aria-labelledby="by-discipline-title">
          <h2 id="by-discipline-title" class="font-display text-xl uppercase tracking-wide text-bone">By discipline</h2>
          <p v-if="!disciplineRows.length" class="mt-5 text-sm text-smoke">No entries yet.</p>
          <ul v-else class="mt-5 space-y-3">
            <li v-for="row in disciplineRows" :key="row.key">
              <RouterLink :to="{ path: '/portal/admin/registrations', query: { discipline: row.key } }" class="group block">
                <div class="flex items-baseline justify-between gap-3 text-sm">
                  <span class="text-ash group-hover:text-bone">{{ row.label }}</span>
                  <span class="font-semibold text-bone">{{ row.n }}</span>
                </div>
                <div class="mt-1.5 h-1.5 bg-iron" aria-hidden="true">
                  <div class="h-full bg-ember transition-[width] duration-500" :style="{ width: `${row.pct}%` }" />
                </div>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="p-card p-5 sm:p-6" aria-labelledby="payments-title">
          <h2 id="payments-title" class="font-display text-xl uppercase tracking-wide text-bone">Payments</h2>
          <p v-if="!paymentRows.length" class="mt-5 text-sm text-smoke">No fees recorded yet.</p>
          <dl v-else class="mt-5 divide-y divide-line/70">
            <div v-for="row in paymentRows" :key="row.key" class="flex items-center justify-between gap-3 py-2.5 text-sm">
              <dt class="flex items-center gap-2">
                <StatusBadge :value="row.key" kind="payment" />
                <span class="text-smoke">{{ row.count }} {{ row.count === 1 ? 'entry' : 'entries' }}</span>
              </dt>
              <dd class="font-semibold text-bone">{{ Number(row.amount || 0).toLocaleString('en-US') }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-xs text-smoke">Amounts are fees due per entry, in the championship currency.</p>
        </section>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section aria-labelledby="recent-title">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 id="recent-title" class="font-display text-xl uppercase tracking-wide text-bone">Recent entries</h2>
            <RouterLink to="/portal/admin/registrations" class="p-link text-sm">All registrations</RouterLink>
          </div>
          <DataTable :columns="recentColumns" :rows="stats.recent_entries || []" clickable caption="Most recent entries" @row-click="(row) => router.push(`/portal/admin/registrations/${row.id}`)">
            <template #cell-code="{ row }">
              <RouterLink :to="`/portal/admin/registrations/${row.id}`" class="font-mono text-sm text-bone hover:text-ember" @click.stop>{{ row.code }}</RouterLink>
            </template>
            <template #cell-team_name="{ row }">
              <span class="text-bone">{{ row.team_name }}</span>
              <span class="block text-xs text-smoke">{{ row.club_name }}</span>
            </template>
            <template #cell-category_name="{ row }">
              {{ row.category_name }}<span v-if="row.weight_name" class="text-smoke"> · {{ row.weight_name }}</span>
            </template>
            <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
            <template #cell-submitted_at="{ row }">{{ fmtDateTime(row.submitted_at || row.created_at) }}</template>
            <template #empty>
              <p class="px-6 py-10 text-center text-sm text-smoke">No entries have been submitted yet.</p>
            </template>
          </DataTable>
        </section>

        <aside aria-labelledby="quick-title">
          <h2 id="quick-title" class="mb-3 font-display text-xl uppercase tracking-wide text-bone">Quick links</h2>
          <ul class="space-y-2">
            <li v-for="link in quickLinks" :key="link.label">
              <RouterLink :to="link.to" class="p-card p-card-hover group flex items-center gap-3 px-4 py-3">
                <span class="flex h-9 w-9 items-center justify-center border border-line text-ember"><AppIcon :name="link.icon" class="h-4 w-4" /></span>
                <span class="flex-1 text-sm font-semibold text-bone">{{ link.label }}</span>
                <AppIcon name="chevronRight" class="h-4 w-4 text-smoke group-hover:text-ember" />
              </RouterLink>
            </li>
            <li v-if="isSuperAdmin">
              <RouterLink to="/portal/admin/users" class="p-card p-card-hover group flex items-center gap-3 px-4 py-3">
                <span class="flex h-9 w-9 items-center justify-center border border-line text-ember"><AppIcon name="shield" class="h-4 w-4" /></span>
                <span class="flex-1 text-sm font-semibold text-bone">
                  Users
                  <span v-if="stats.users" class="block text-xs font-normal text-smoke">{{ Object.values(stats.users).reduce((a, b) => a + b, 0) }} accounts</span>
                </span>
                <AppIcon name="chevronRight" class="h-4 w-4 text-smoke group-hover:text-ember" />
              </RouterLink>
            </li>
          </ul>
        </aside>
      </div>
    </template>
  </div>
</template>
