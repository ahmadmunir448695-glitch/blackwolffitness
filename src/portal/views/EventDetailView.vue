<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAsync } from '@/composables/useAsync.js'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { fileUrl, http } from '../lib/api.js'
import { DISCIPLINE_LABELS, daysUntil, fmtDate, fmtDateTime, fmtMoney, fmtRange, humanize } from '../lib/format.js'
import { isClubUser, session } from '../lib/session.js'

const route = useRoute()
const { data, loading, error, reload } = useAsync(({ signal }) => http.get(`/events/${route.params.slug}`, null, { signal }), { watch: () => route.params.slug })

const tab = ref('overview')
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'categories', label: 'Categories' },
  { id: 'divisions', label: 'Age & weight' },
  { id: 'fees', label: 'Fees' },
  { id: 'schedule', label: 'Schedule & venue' },
  { id: 'rules', label: 'Rules' },
  { id: 'announcements', label: 'Announcements' },
]

const event = computed(() => data.value?.event)
const ageName = (id) => data.value?.age_divisions.find((a) => a.id === id)?.name ?? 'All ages'
const beltName = (id) => data.value?.belt_divisions.find((b) => b.id === id)?.name ?? 'All belts'

const byDiscipline = computed(() => {
  const groups = {}
  for (const c of data.value?.categories ?? []) (groups[c.discipline] ||= []).push(c)
  return Object.entries(groups).map(([d, items]) => ({ discipline: d, label: DISCIPLINE_LABELS[d] ?? d, items }))
})

const weightGroups = computed(() => {
  const out = []
  for (const age of data.value?.age_divisions ?? []) {
    for (const gender of ['male', 'female']) {
      const items = data.value.weight_divisions.filter((w) => w.age_division_id === age.id && w.gender === gender)
      if (items.length) out.push({ key: `${age.id}-${gender}`, title: `${age.name} · ${gender === 'male' ? 'Male' : 'Female'}`, items })
    }
  }
  return out
})

const fee = (c) => fmtMoney(c.fee ?? event.value.base_fee, event.value.currency)

const registerLink = computed(() => {
  if (!event.value) return null
  const target = `/portal/register?event=${event.value.slug}`
  if (isClubUser.value) return target
  if (!session.user) return { path: '/portal/login', query: { redirect: target } }
  return null
})

const deadlineDays = computed(() => daysUntil(event.value?.registration_deadline))
</script>

<template>
  <AsyncState :loading="loading" :error="error" error-title="This championship could not load" @retry="reload">
    <template #loading>
      <div class="skeleton mb-6 h-72" />
      <div class="skeleton h-96" />
    </template>

    <div v-if="event">
      <RouterLink to="/portal/events" class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-smoke hover:text-ember">
        <AppIcon name="arrowLeft" class="h-4 w-4" /> All championships
      </RouterLink>

      <!-- Hero -->
      <section class="p-card relative mb-6 grid overflow-hidden lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div class="relative aspect-[4/3] bg-iron lg:aspect-auto">
          <img v-if="event.poster_url" :src="fileUrl(event.poster_url)" :alt="`${event.name} poster`" class="h-full w-full object-cover" />
          <div v-else class="flex h-full min-h-56 items-center justify-center bg-[radial-gradient(120%_120%_at_0%_100%,rgb(247_134_15/0.3),transparent_60%)]">
            <AppIcon name="trophy" class="h-16 w-16 text-ember" />
          </div>
        </div>
        <div class="flex flex-col p-6 sm:p-8">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge :value="event.status" kind="event" />
            <span v-if="!event.published" class="p-badge tone-warning">Not published</span>
          </div>
          <h1 class="font-display text-[2.3rem] uppercase leading-[0.95] tracking-wide text-bone sm:text-[3rem]">{{ event.name }}</h1>
          <p class="mt-2 text-ash">{{ [event.organizer, event.federation].filter(Boolean).join(' · ') }}</p>
          <p v-if="event.summary" class="mt-4 max-w-2xl text-ash">{{ event.summary }}</p>

          <dl class="mt-6 grid gap-4 sm:grid-cols-3">
            <div class="border-l-2 border-ember pl-3">
              <dt class="text-xs uppercase tracking-[0.16em] text-smoke">Dates</dt>
              <dd class="mt-1 font-semibold text-bone">{{ fmtRange(event.start_date, event.end_date) }}</dd>
            </div>
            <div class="border-l-2 border-line pl-3">
              <dt class="text-xs uppercase tracking-[0.16em] text-smoke">Location</dt>
              <dd class="mt-1 font-semibold text-bone">{{ [event.city, event.country].filter(Boolean).join(', ') || 'To be announced' }}</dd>
            </div>
            <div class="border-l-2 border-line pl-3">
              <dt class="text-xs uppercase tracking-[0.16em] text-smoke">Registration deadline</dt>
              <dd class="mt-1 font-semibold text-bone">
                {{ fmtDate(event.registration_deadline) }}
                <span v-if="event.status === 'registration_open' && deadlineDays >= 0" class="block text-sm font-normal text-ember">{{ deadlineDays === 0 ? 'Closes today' : `${deadlineDays} days left` }}</span>
              </dd>
            </div>
          </dl>

          <div class="mt-auto flex flex-wrap gap-2 pt-6">
            <RouterLink v-if="event.registration_open && registerLink" :to="registerLink" class="btn-molten btn-sheen cut-corner inline-flex h-12 items-center gap-2 px-6 font-semibold text-ink">
              Register athletes <AppIcon name="arrowRight" class="h-4 w-4" />
            </RouterLink>
            <p v-else-if="event.status === 'upcoming' && event.registration_opens" class="text-sm text-ash">Registration opens {{ fmtDate(event.registration_opens) }}.</p>
            <a v-if="event.invitation_pdf_url" :href="fileUrl(event.invitation_pdf_url)" target="_blank" rel="noopener" class="inline-flex h-12 items-center gap-2 border border-bone/30 px-5 text-sm font-semibold text-bone hover:border-ember hover:text-ember">
              <AppIcon name="download" class="h-4 w-4" /> Invitation (PDF)
            </a>
            <a v-if="event.rules_pdf_url" :href="fileUrl(event.rules_pdf_url)" target="_blank" rel="noopener" class="inline-flex h-12 items-center gap-2 border border-bone/30 px-5 text-sm font-semibold text-bone hover:border-ember hover:text-ember">
              <AppIcon name="download" class="h-4 w-4" /> Rules (PDF)
            </a>
          </div>
        </div>
      </section>

      <!-- Tabs -->
      <div class="p-tabs mb-6" role="tablist" aria-label="Championship details">
        <button v-for="t in tabs" :id="`tab-${t.id}`" :key="t.id" type="button" role="tab" class="p-tab" :aria-selected="tab === t.id ? 'true' : 'false'" :aria-controls="`panel-${t.id}`" @click="tab = t.id">
          {{ t.label }}<span v-if="t.id === 'announcements' && data.announcements.length" class="ml-1.5 text-ember">{{ data.announcements.length }}</span>
        </button>
      </div>

      <section :id="`panel-${tab}`" role="tabpanel" :aria-labelledby="`tab-${tab}`">
        <!-- Overview -->
        <div v-if="tab === 'overview'" class="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div class="p-card p-6">
            <h2 class="mb-3 font-display text-2xl uppercase tracking-wide text-bone">About this championship</h2>
            <p v-if="event.description" class="whitespace-pre-line text-ash">{{ event.description }}</p>
            <p v-else class="text-smoke">The organizer has not added a description yet.</p>
          </div>
          <aside class="space-y-4">
            <div class="p-card p-5">
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Disciplines</h3>
              <ul class="space-y-1.5">
                <li v-for="g in byDiscipline" :key="g.discipline" class="flex justify-between text-sm"><span class="text-bone">{{ g.label }}</span><span class="text-smoke">{{ g.items.length }} categories</span></li>
              </ul>
            </div>
            <div class="p-card p-5">
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Required for every athlete</h3>
              <ul class="space-y-1.5 text-sm text-ash">
                <li v-if="event.require_photo" class="flex gap-2"><AppIcon name="check" class="h-4 w-4 text-ember" /> Recent photo</li>
                <li v-if="event.require_id_document" class="flex gap-2"><AppIcon name="check" class="h-4 w-4 text-ember" /> ID / passport document</li>
                <li v-if="event.require_medical" class="flex gap-2"><AppIcon name="check" class="h-4 w-4 text-ember" /> Medical certificate</li>
                <li class="flex gap-2"><AppIcon name="info" class="h-4 w-4 text-ember" /> Age by {{ event.age_method === 'birth_year' ? 'birth year' : 'exact date of birth' }}</li>
              </ul>
            </div>
            <div v-if="event.contact_email || event.contact_phone" class="p-card p-5 text-sm">
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-smoke">Organizer contact</h3>
              <p v-if="event.contact_email"><a :href="`mailto:${event.contact_email}`" class="p-link">{{ event.contact_email }}</a></p>
              <p v-if="event.contact_phone" class="mt-1 text-ash">{{ event.contact_phone }}</p>
            </div>
          </aside>
        </div>

        <!-- Categories -->
        <div v-else-if="tab === 'categories'" class="space-y-6">
          <p v-if="!byDiscipline.length" class="text-smoke">No categories published yet.</p>
          <div v-for="g in byDiscipline" :key="g.discipline" class="p-card overflow-hidden">
            <h2 class="border-b border-line px-5 py-4 font-display text-2xl uppercase tracking-wide text-bone">{{ g.label }}</h2>
            <div class="overflow-x-auto">
              <table class="p-table min-w-[40rem]">
                <thead><tr><th>Category</th><th>Format</th><th>Gender</th><th>Age group</th><th>Belt group</th><th class="text-right">Fee</th></tr></thead>
                <tbody>
                  <tr v-for="c in g.items" :key="c.id">
                    <td class="font-medium text-bone">{{ c.name }}<span v-if="c.notes" class="block text-xs text-smoke">{{ c.notes }}</span></td>
                    <td>{{ humanize(c.format) }}<span v-if="c.format === 'team'" class="text-smoke"> ({{ c.min_members }}–{{ c.max_members }})</span></td>
                    <td>{{ humanize(c.gender) }}</td>
                    <td>{{ ageName(c.age_division_id) }}</td>
                    <td>{{ beltName(c.belt_division_id) }}</td>
                    <td class="text-right">{{ fee(c) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Age & weight -->
        <div v-else-if="tab === 'divisions'" class="space-y-6">
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="p-card overflow-hidden">
              <h2 class="border-b border-line px-5 py-4 font-display text-2xl uppercase tracking-wide text-bone">Age groups</h2>
              <table class="p-table">
                <thead><tr><th>Group</th><th>Ages</th></tr></thead>
                <tbody>
                  <tr v-for="a in data.age_divisions" :key="a.id"><td class="text-bone">{{ a.name }}</td><td>{{ a.min_age }}–{{ a.max_age >= 99 ? '+' : a.max_age }}</td></tr>
                  <tr v-if="!data.age_divisions.length"><td colspan="2" class="text-smoke">Open to all ages.</td></tr>
                </tbody>
              </table>
            </div>
            <div class="p-card overflow-hidden">
              <h2 class="border-b border-line px-5 py-4 font-display text-2xl uppercase tracking-wide text-bone">Belt groups</h2>
              <ul class="divide-y divide-line">
                <li v-for="b in data.belt_divisions" :key="b.id" class="px-5 py-3">
                  <p class="font-semibold text-bone">{{ b.name }}</p>
                  <p class="mt-1 text-sm text-ash">{{ b.belts.join(', ') }}</p>
                </li>
                <li v-if="!data.belt_divisions.length" class="px-5 py-3 text-sm text-smoke">All belts compete together.</li>
              </ul>
            </div>
          </div>
          <div v-if="weightGroups.length" class="p-card p-5">
            <h2 class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">Kyorugi weight categories</h2>
            <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <div v-for="g in weightGroups" :key="g.key">
                <h3 class="mb-2 text-sm font-semibold text-ember">{{ g.title }}</h3>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="w in g.items" :key="w.id" class="p-chip">{{ w.name }}</span>
                </div>
              </div>
            </div>
            <p v-if="event.weight_tolerance_kg" class="mt-4 text-sm text-smoke">Weigh-in tolerance: {{ event.weight_tolerance_kg }} kg.</p>
          </div>
        </div>

        <!-- Fees -->
        <div v-else-if="tab === 'fees'" class="p-card p-6">
          <h2 class="mb-2 font-display text-2xl uppercase tracking-wide text-bone">Registration fees</h2>
          <p class="text-ash">Standard entry fee: <strong class="text-bone">{{ fmtMoney(event.base_fee, event.currency) }}</strong> per athlete per category, unless a category lists its own fee below.</p>
          <ul class="mt-4 divide-y divide-line border-y border-line">
            <li v-for="c in data.categories.filter((x) => x.fee !== null)" :key="c.id" class="flex justify-between gap-4 py-2.5 text-sm">
              <span class="text-ash">{{ c.name }}</span><span class="shrink-0 font-semibold text-bone">{{ fmtMoney(c.fee, event.currency) }} per entry</span>
            </li>
            <li v-if="!data.categories.some((x) => x.fee !== null)" class="py-2.5 text-sm text-smoke">Every category uses the standard fee.</li>
          </ul>
          <p class="mt-4 text-sm text-smoke">Pay after submitting your entries, then report the payment from the entry page. The organizer confirms it.</p>
        </div>

        <!-- Schedule & venue -->
        <div v-else-if="tab === 'schedule'" class="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div class="p-card p-6">
            <h2 class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">Competition schedule</h2>
            <ol v-if="event.schedule.length" class="relative space-y-4 border-l border-line pl-6">
              <li v-for="(s, i) in event.schedule" :key="i" class="relative">
                <span class="absolute -left-[1.85rem] top-1 h-3 w-3 border-2 border-ember bg-ink" aria-hidden="true" />
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ember">{{ fmtDate(s.date) }}<template v-if="s.time"> · {{ s.time }}</template></p>
                <p class="mt-0.5 text-bone">{{ s.item }}</p>
              </li>
            </ol>
            <p v-else class="text-smoke">The detailed schedule will be published closer to the event.</p>
          </div>
          <div class="p-card p-6">
            <h2 class="mb-4 font-display text-2xl uppercase tracking-wide text-bone">Venue</h2>
            <p class="font-semibold text-bone">{{ event.venue_name || 'To be announced' }}</p>
            <p class="mt-1 text-ash">{{ [event.venue_address, event.city, event.country].filter(Boolean).join(', ') }}</p>
            <a
              v-if="event.venue_name || event.venue_address"
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue_name, event.venue_address, event.city, event.country].filter(Boolean).join(', '))}`"
              target="_blank"
              rel="noopener noreferrer"
              class="p-link mt-4 inline-flex items-center gap-1.5 text-sm"
            >Open in Google Maps <AppIcon name="external" class="h-4 w-4" /></a>
          </div>
        </div>

        <!-- Rules -->
        <div v-else-if="tab === 'rules'" class="p-card p-6">
          <h2 class="mb-3 font-display text-2xl uppercase tracking-wide text-bone">Championship rules</h2>
          <p v-if="event.rules" class="whitespace-pre-line text-ash">{{ event.rules }}</p>
          <p v-else class="text-smoke">Rules will be published by the organizer.</p>
          <a v-if="event.rules_pdf_url" :href="fileUrl(event.rules_pdf_url)" target="_blank" rel="noopener" class="p-link mt-4 inline-flex items-center gap-1.5"><AppIcon name="download" class="h-4 w-4" /> Full rules (PDF)</a>
        </div>

        <!-- Announcements -->
        <div v-else-if="tab === 'announcements'" class="space-y-4">
          <p v-if="!data.announcements.length" class="text-smoke">No announcements yet.</p>
          <article v-for="a in data.announcements" :key="a.id" class="p-card p-5" :class="a.pinned ? 'border-ember/50' : ''">
            <p class="text-xs uppercase tracking-[0.14em] text-smoke">{{ fmtDateTime(a.created_at) }}<span v-if="a.pinned" class="ml-2 text-ember">Pinned</span></p>
            <h3 class="mt-1 text-lg font-semibold text-bone">{{ a.title }}</h3>
            <p class="mt-2 whitespace-pre-line text-ash">{{ a.body }}</p>
          </article>
        </div>
      </section>
    </div>
  </AsyncState>
</template>
