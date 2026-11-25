<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageHeader from '../components/PageHeader.vue'
import StatCard from '../components/StatCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import EmptyState from '../components/EmptyState.vue'
import { http } from '../lib/api.js'
import { ENTRY_STATUS, daysUntil, fmtDate, fmtMoney, relativeTime } from '../lib/format.js'
import { isClubUser, session } from '../lib/session.js'

const router = useRouter()

const { data, loading, error, reload } = useAsync(async ({ signal }) => {
  if (isClubUser.value) return http.get('/dashboard', null, { signal })
  // Athlete account: own entries and open championships.
  const [entries, events] = await Promise.all([http.get('/registrations', { pageSize: 6 }, { signal }), http.get('/events', { status: 'registration_open' }, { signal })])
  return { entries: entries.items, total: entries.total, open_events: events.items.slice(0, 4) }
})

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})

const statusBars = computed(() => {
  const by = data.value?.stats?.by_status ?? {}
  const total = Object.values(by).reduce((a, b) => a + b, 0) || 1
  return Object.entries(ENTRY_STATUS)
    .map(([key, s]) => ({ key, label: s.label, tone: s.tone, n: by[key] || 0, pct: Math.round(((by[key] || 0) / total) * 100) }))
    .filter((s) => s.n > 0)
})
const needsAttention = computed(() => data.value?.stats?.by_status?.correction_required || 0)
</script>

<template>
  <div>
    <PageHeader :eyebrow="session.user?.club?.name || 'Championship Portal'" :title="`${greeting}, ${session.user?.name?.split(' ')[0] || ''}`" subtitle="Your teams, athletes and championship entries at a glance.">
      <template v-if="isClubUser" #actions>
        <BaseButton to="/portal/register" icon="plus" size="sm">New registration</BaseButton>
      </template>
    </PageHeader>

    <AsyncState :loading="loading" :error="error" error-title="Your dashboard could not load" @retry="reload">
      <template #loading>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div v-for="n in 4" :key="n" class="skeleton h-36" />
        </div>
        <div class="skeleton mt-6 h-72" />
      </template>

      <template v-if="data && isClubUser">
        <div v-if="needsAttention" class="mb-6 flex flex-col gap-3 border border-[#f2c94c]/50 bg-[#f2c94c]/10 p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
          <p class="flex items-center gap-2 text-sm text-bone"><AppIcon name="alert" class="h-5 w-5 text-[#f2c94c]" /> {{ needsAttention }} entr{{ needsAttention === 1 ? 'y needs' : 'ies need' }} a correction requested by the organizer.</p>
          <RouterLink to="/portal/entries?status=correction_required" class="p-link text-sm">Review now</RouterLink>
        </div>

        <div v-if="!data.stats.teams" class="mb-6">
          <EmptyState icon="users" title="Create your first team" message="A team groups your athletes and coaches. Every entry is made for a team, so start here.">
            <BaseButton to="/portal/team" icon="plus" size="sm">Create team</BaseButton>
          </EmptyState>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Teams" :value="data.stats.teams" icon="users" to="/portal/team" />
          <StatCard label="Athletes" :value="data.stats.athletes" icon="kick" to="/portal/athletes" />
          <StatCard label="Entries" :value="data.stats.entries" icon="list" to="/portal/entries" :hint="`${data.stats.by_status.approved || 0} approved`" />
          <StatCard
            label="Fees outstanding"
            :value="data.stats.unpaid_entries"
            icon="card"
            to="/portal/entries?payment=unpaid"
            :hint="data.stats.unpaid_entries ? fmtMoney(data.stats.unpaid_total) : 'All settled'"
            :accent="data.stats.unpaid_entries > 0"
          />
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section class="p-card">
            <div class="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 class="font-display text-2xl uppercase tracking-wide text-bone">Recent entries</h2>
              <RouterLink to="/portal/entries" class="p-link text-sm">All entries</RouterLink>
            </div>
            <ul v-if="data.recent_entries.length" class="divide-y divide-line">
              <li v-for="e in data.recent_entries" :key="e.id">
                <button type="button" class="flex w-full flex-col gap-2 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between" @click="router.push(`/portal/entries/${e.id}`)">
                  <span class="min-w-0">
                    <span class="block truncate font-semibold text-bone">{{ e.athlete_names }}</span>
                    <span class="block truncate text-sm text-smoke">{{ e.event_name }} · {{ e.category_name }}</span>
                  </span>
                  <span class="flex shrink-0 items-center gap-2">
                    <StatusBadge :value="e.status" />
                    <span class="text-xs text-smoke">{{ relativeTime(e.created_at) }}</span>
                  </span>
                </button>
              </li>
            </ul>
            <p v-else class="px-5 py-10 text-center text-sm text-smoke">No entries yet. Open a championship to register your athletes.</p>
          </section>

          <section class="space-y-6">
            <div class="p-card p-5">
              <h2 class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">Entry status</h2>
              <div v-if="statusBars.length" class="space-y-3">
                <div v-for="s in statusBars" :key="s.key">
                  <div class="mb-1 flex justify-between text-sm"><span class="text-ash">{{ s.label }}</span><span class="font-semibold text-bone">{{ s.n }}</span></div>
                  <div class="h-1.5 bg-iron"><div class="p-badge h-full border-0 p-0" :class="`tone-${s.tone}`" :style="{ width: `${Math.max(4, s.pct)}%`, background: 'currentColor' }" /></div>
                </div>
              </div>
              <p v-else class="text-sm text-smoke">Statuses appear once you register athletes.</p>
            </div>

            <div class="p-card">
              <div class="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 class="font-display text-2xl uppercase tracking-wide text-bone">Championships</h2>
                <RouterLink to="/portal/events" class="p-link text-sm">All events</RouterLink>
              </div>
              <ul v-if="data.open_events.length" class="divide-y divide-line">
                <li v-for="ev in data.open_events" :key="ev.id" class="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div class="min-w-0">
                    <RouterLink :to="`/portal/events/${ev.slug}`" class="block truncate font-semibold text-bone hover:text-ember">{{ ev.name }}</RouterLink>
                    <p class="text-sm text-smoke">
                      {{ fmtDate(ev.start_date) }} · {{ ev.city }}
                      <template v-if="ev.status === 'registration_open'"> · {{ daysUntil(ev.registration_deadline) }} days to deadline</template>
                    </p>
                  </div>
                  <RouterLink v-if="ev.status === 'registration_open'" :to="`/portal/register?event=${ev.slug}`" class="shrink-0 border border-ember px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ember hover:bg-ember hover:text-ink">
                    {{ ev.my_entries ? `${ev.my_entries} entered · add` : 'Register' }}
                  </RouterLink>
                  <StatusBadge v-else :value="ev.status" kind="event" />
                </li>
              </ul>
              <p v-else class="px-5 py-8 text-center text-sm text-smoke">No open or upcoming championships right now.</p>
            </div>
          </section>
        </div>
      </template>

      <!-- Athlete account -->
      <template v-else-if="data">
        <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section class="p-card">
            <div class="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 class="font-display text-2xl uppercase tracking-wide text-bone">My entries</h2>
              <RouterLink to="/portal/entries" class="p-link text-sm">View all</RouterLink>
            </div>
            <ul v-if="data.entries.length" class="divide-y divide-line">
              <li v-for="e in data.entries" :key="e.id">
                <RouterLink :to="`/portal/entries/${e.id}`" class="flex flex-col gap-2 px-5 py-3.5 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                  <span><span class="block font-semibold text-bone">{{ e.event_name }}</span><span class="text-sm text-smoke">{{ e.category_name }}<template v-if="e.weight_name"> · {{ e.weight_name }}</template></span></span>
                  <StatusBadge :value="e.status" />
                </RouterLink>
              </li>
            </ul>
            <p v-else class="px-5 py-10 text-center text-sm text-smoke">Your club has not entered you in a championship yet.</p>
          </section>
          <section class="p-card p-5">
            <h2 class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">Open for registration</h2>
            <ul class="space-y-3">
              <li v-for="ev in data.open_events" :key="ev.id"><RouterLink :to="`/portal/events/${ev.slug}`" class="font-semibold text-bone hover:text-ember">{{ ev.name }}</RouterLink><p class="text-sm text-smoke">{{ fmtDate(ev.start_date) }} · {{ ev.city }}</p></li>
              <li v-if="!data.open_events.length" class="text-sm text-smoke">Nothing open right now.</li>
            </ul>
          </section>
        </div>
      </template>
    </AsyncState>
  </div>
</template>
