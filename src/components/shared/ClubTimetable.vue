<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'
import WhatsAppLink from '../layout/WhatsAppLink.vue'
import { club } from '@/config/club.js'
import { programName } from '@/services/catalog.js'
import { formatTime } from '@/utils/format.js'

/**
 * Club timings from src/config/club.js.
 * show: 'all' (classes + Special Kids), 'classes' or 'special-kids'.
 * highlight: a program slug to emphasise in the class list.
 */
const props = defineProps({
  show: { type: String, default: 'all' },
  highlight: { type: String, default: '' },
  only: { type: String, default: '' },
})

const tt = club.timetable
const classes = computed(() =>
  (tt?.classes ?? []).filter((row) => !props.only || row.programs.includes(props.only)),
)
const showClasses = computed(() => props.show !== 'special-kids' && classes.value.length)
const showKids = computed(() => props.show !== 'classes' && tt?.specialKids)
const range = (row) => `${formatTime(row.start)} – ${formatTime(row.end)}`
</script>

<template>
  <div class="grid gap-4" :class="showClasses && showKids ? 'lg:grid-cols-[1.5fr_1fr]' : ''">
    <!-- Evening classes -->
    <div v-if="showClasses" class="rounded-2xl border border-line bg-coal p-6 sm:p-8">
      <div class="flex items-center gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-ember/10 text-ember ring-1 ring-ember/25">
          <AppIcon name="clock" class="h-5 w-5" />
        </span>
        <div>
          <h3 class="font-display text-2xl font-black uppercase leading-none">Class timings</h3>
          <p class="mt-1 text-sm text-ash">{{ range({ start: classes[0].start, end: classes[classes.length - 1].end }) }}</p>
        </div>
      </div>
      <ul class="mt-6 divide-y divide-line border-y border-line">
        <li v-for="row in classes" :key="row.start" class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
          <span class="font-display text-2xl font-bold tabular-nums tracking-wide text-bone sm:text-3xl">{{ range(row) }}</span>
          <span class="flex flex-wrap gap-2">
            <RouterLink
              v-for="slug in row.programs"
              :key="slug"
              :to="`/services/${slug}`"
              class="rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors"
              :class="slug === highlight ? 'border-ember bg-ember text-ink' : 'border-line text-bone hover:border-ember hover:text-ember'"
            >{{ programName(slug) }}</RouterLink>
          </span>
        </li>
      </ul>
    </div>

    <!-- Special Kids -->
    <div v-if="showKids" class="relative overflow-hidden rounded-2xl border border-ember/40 bg-coal p-6 sm:p-8">
      <div class="glow-ember pointer-events-none absolute -right-24 -top-24 h-64 w-64 opacity-60" aria-hidden="true" />
      <div class="relative flex items-center gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-ember/10 text-ember ring-1 ring-ember/25">
          <AppIcon name="heart" class="h-5 w-5" />
        </span>
        <h3 class="font-display text-2xl font-black uppercase leading-none">Special Kids <span class="text-ember">(ADHD)</span></h3>
      </div>
      <p class="relative mt-6 font-display text-4xl font-bold tabular-nums tracking-wide text-bone sm:text-5xl">{{ range(tt.specialKids) }}</p>
      <p class="relative mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-ash">Morning sessions</p>
      <p class="relative mt-5 flex items-start gap-2.5 text-bone">
        <AppIcon name="users" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
        {{ tt.specialKids.session }}
      </p>
      <p class="relative mt-2 flex items-start gap-2.5 text-ash">
        <AppIcon name="check" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
        Book your child’s time slot in advance
      </p>
      <div class="relative mt-6">
        <WhatsAppLink message="Hi Black Wolf Fitness Club, I would like to book a Special Kids (ADHD) one-to-one session for my child." label="Book a session" />
      </div>
    </div>
  </div>
</template>
