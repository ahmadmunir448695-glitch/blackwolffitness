<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'
import { currency } from '@/config/pricing.js'
import { formatPrice } from '@/utils/format.js'
import { whatsappUrl } from '@/utils/whatsapp.js'

/** Personal Training / Home Training card. `featured` gives it the ember treatment. */
const props = defineProps({
  service: { type: Object, required: true },
  featured: { type: Boolean, default: false },
})

const pkr = (n) => formatPrice(n, currency)
const period = computed(() => (props.service.period ? `/ ${props.service.period}` : ''))
const bookUrl = computed(() =>
  whatsappUrl(`Hi Black Wolf Fitness Club, I would like to book ${props.service.name} (${props.service.place.toLowerCase()}). Please share the details.`),
)
</script>

<template>
  <article
    class="fx-spot relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 sm:p-9"
    :class="featured ? 'border-ember/50 bg-gradient-to-br from-[#1f160d] via-coal to-coal' : 'border-line bg-coal'"
  >
    <div v-if="featured" class="glow-ember pointer-events-none absolute -right-28 -top-28 h-80 w-80 opacity-70" aria-hidden="true" />

    <header class="relative flex items-start justify-between gap-4">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" :class="featured ? 'border-ember/40 text-ember' : 'border-line text-ash'">
          <AppIcon :name="service.icon === 'home' ? 'home' : 'pin'" class="h-3.5 w-3.5" />{{ service.place }}
        </p>
        <h3 class="mt-4 font-display text-[2.6rem] font-black uppercase leading-none">{{ service.name }}</h3>
      </div>
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1" :class="featured ? 'bg-ember text-ink ring-ember' : 'bg-ember/10 text-ember ring-ember/25'">
        <AppIcon :name="service.icon" class="h-7 w-7" />
      </span>
    </header>

    <p class="relative mt-4 max-w-md text-ash">{{ service.summary }}</p>

    <dl class="relative mt-7 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink/50">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 p-5">
        <dt>
          <span class="block font-semibold text-bone">{{ service.individual.label }}</span>
          <span class="mt-0.5 block text-sm text-smoke">1 person</span>
        </dt>
        <dd class="flex items-baseline gap-1.5">
          <span class="font-display text-[2.4rem] font-black leading-none tabular-nums text-bone">{{ pkr(service.individual.price) }}</span>
          <span v-if="period" class="text-ash">{{ period }}</span>
        </dd>
      </div>
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 p-5">
        <dt>
          <span class="flex items-center gap-2 font-semibold text-bone">
            {{ service.family.label }}
            <span class="rounded-full bg-ember px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink">{{ service.family.size }} people</span>
          </span>
          <span class="mt-0.5 block text-sm text-smoke">{{ service.family.note }}</span>
        </dt>
        <dd class="text-right">
          <span class="flex items-baseline justify-end gap-1.5">
            <span class="font-display text-[2.4rem] font-black leading-none tabular-nums text-ember">{{ pkr(service.family.total) }}</span>
            <span v-if="period" class="text-ash">{{ period }}</span>
          </span>
          <span class="mt-1 block text-sm text-ash">Total for all {{ service.family.size }} people</span>
        </dd>
      </div>
    </dl>

    <div class="relative mt-auto pt-8">
      <a
        v-if="bookUrl"
        :href="bookUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full font-semibold transition-colors"
        :class="featured ? 'btn-molten btn-sheen text-ink' : 'border border-bone/25 text-bone hover:border-ember hover:bg-ember hover:text-ink'"
      >
        <AppIcon name="whatsapp" class="h-5 w-5" />{{ service.cta }}<span class="sr-only"> (opens WhatsApp)</span>
      </a>
      <RouterLink
        v-else
        :to="{ path: '/contact' }"
        class="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-bone/25 font-semibold text-bone hover:border-ember"
      >{{ service.cta }} <AppIcon name="arrowRight" class="h-4 w-4" /></RouterLink>
    </div>
  </article>
</template>
