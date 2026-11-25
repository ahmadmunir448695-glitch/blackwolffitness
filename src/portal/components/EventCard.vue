<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import { fileUrl } from '../lib/api.js'
import { daysUntil, fmtDate, fmtRange } from '../lib/format.js'

const props = defineProps({
  event: { type: Object, required: true },
  canRegister: { type: Boolean, default: false },
})

const deadlineNote = computed(() => {
  if (props.event.status !== 'registration_open') return ''
  const d = daysUntil(props.event.registration_deadline)
  if (d === 0) return 'Closes today'
  if (d === 1) return 'Closes tomorrow'
  if (d > 1 && d <= 14) return `${d} days left`
  return ''
})
</script>

<template>
  <article class="p-card p-card-hover group flex flex-col overflow-hidden">
    <RouterLink :to="`/portal/events/${event.slug}`" class="relative block aspect-[16/9] overflow-hidden bg-iron" tabindex="-1" aria-hidden="true">
      <img v-if="event.poster_url" :src="fileUrl(event.poster_url)" alt="" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
      <div v-else class="relative flex h-full w-full items-end overflow-hidden bg-[radial-gradient(120%_120%_at_100%_0%,rgb(247_134_15/0.28),transparent_60%)] p-5">
        <span class="pointer-events-none absolute -right-4 -top-6 font-display text-[7rem] font-black uppercase leading-none text-white/[0.04]">TKD</span>
        <AppIcon name="trophy" class="h-10 w-10 text-ember" />
      </div>
      <span v-if="deadlineNote" class="absolute left-3 top-3 bg-ember px-2 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-ink">{{ deadlineNote }}</span>
    </RouterLink>

    <div class="flex flex-1 flex-col p-5">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge :value="event.status" kind="event" />
      </div>
      <h3 class="font-display text-2xl uppercase leading-tight tracking-wide text-bone">
        <RouterLink :to="`/portal/events/${event.slug}`" class="hover:text-ember">{{ event.name }}</RouterLink>
      </h3>
      <p class="mt-1 text-sm text-smoke">{{ [event.organizer, event.federation].filter(Boolean).join(' · ') }}</p>

      <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt class="text-smoke"><AppIcon name="calendar" class="h-4 w-4" label="Dates" /></dt>
        <dd class="text-ash">{{ fmtRange(event.start_date, event.end_date) }}</dd>
        <dt class="text-smoke"><AppIcon name="pin" class="h-4 w-4" label="Location" /></dt>
        <dd class="text-ash">{{ [event.venue_name, event.city, event.country].filter(Boolean).join(', ') || 'Venue to be announced' }}</dd>
        <dt class="text-smoke"><AppIcon name="clock" class="h-4 w-4" label="Registration deadline" /></dt>
        <dd class="text-ash">Deadline {{ fmtDate(event.registration_deadline) }}</dd>
      </dl>

      <div v-if="event.disciplines?.length" class="mt-4 flex flex-wrap gap-1.5">
        <span v-for="d in event.disciplines" :key="d.value" class="p-chip">{{ d.label }}</span>
      </div>

      <div class="mt-auto flex flex-wrap gap-2 pt-5">
        <RouterLink :to="`/portal/events/${event.slug}`" class="inline-flex h-10 items-center gap-2 border border-bone/30 px-4 text-sm font-semibold text-bone transition-colors hover:border-ember hover:text-ember">
          View details
        </RouterLink>
        <RouterLink
          v-if="event.status === 'registration_open'"
          :to="canRegister ? { path: '/portal/register', query: { event: event.slug } } : { path: '/portal/login', query: { redirect: `/portal/register?event=${event.slug}` } }"
          class="btn-molten btn-sheen cut-corner inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold text-ink"
        >
          Register now
          <AppIcon name="arrowRight" class="h-4 w-4" />
        </RouterLink>
      </div>
    </div>
  </article>
</template>
