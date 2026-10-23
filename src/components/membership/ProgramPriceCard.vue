<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../ui/AppIcon.vue'
import { currency, groupSaving, groupTotal, hasRegistrationFee, registrationFee } from '@/config/pricing.js'
import { formatPrice } from '@/utils/format.js'
import { whatsappUrl } from '@/utils/whatsapp.js'

/** One program in the Martial Arts & Fitness Membership grid. */
const props = defineProps({
  plan: { type: Object, required: true },
})
const emit = defineEmits(['join'])

const pkr = (n) => formatPrice(n, currency)
const total = computed(() => groupTotal(props.plan.group))
const showFee = computed(() => hasRegistrationFee(props.plan.slug))
const saving = computed(() => groupSaving(props.plan))
const groupChat = computed(() =>
  whatsappUrl(
    `Hi Black Wolf Fitness Club, we are ${props.plan.group.size} people and would like to join ${props.plan.name} with the ${props.plan.group.label} (${pkr(props.plan.group.perPerson)} per person per month).`,
  ),
)
</script>

<template>
  <article class="price-card fx-spot group flex h-full flex-col rounded-3xl border border-line bg-coal p-6 sm:p-7">
    <header class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember/10 text-ember ring-1 ring-ember/25 transition-colors duration-300 group-hover:bg-ember group-hover:text-ink">
          <AppIcon :name="plan.icon" class="h-6 w-6" />
        </span>
        <h3 class="font-display text-3xl font-black uppercase leading-none">{{ plan.name }}</h3>
      </div>
      <RouterLink :to="`/services/${plan.slug}`" class="text-smoke transition-colors hover:text-ember" :aria-label="`About ${plan.name}`">
        <AppIcon name="arrowRight" class="h-5 w-5 -rotate-45" />
      </RouterLink>
    </header>

    <!-- Individual -->
    <div class="mt-7">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-smoke">Individual · 1 person</p>
      <p class="mt-2 flex items-baseline gap-2">
        <span class="whitespace-nowrap font-display text-[2.9rem] font-black leading-none tabular-nums text-bone">{{ pkr(plan.individual) }}</span>
        <span class="text-ash">/ month</span>
      </p>
      <p v-if="showFee" class="mt-3 inline-flex items-center gap-2 rounded-full border border-dashed border-bone/25 px-3 py-1.5 text-[0.8rem] text-ash">
        <AppIcon name="info" class="h-3.5 w-3.5 shrink-0 text-ember" />
        <span>{{ registrationFee.label }}: <strong class="font-semibold text-bone">{{ pkr(registrationFee.amount) }}</strong></span>
      </p>
    </div>

    <!-- Group of 3 -->
    <div class="relative mt-6 overflow-hidden rounded-2xl border border-ember/35 bg-ember/[0.06] p-5">
      <span class="inline-flex items-center gap-1.5 rounded-full bg-ember px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink">
        <AppIcon name="users" class="h-3.5 w-3.5" />{{ plan.group.label }}
      </span>
      <p class="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span class="whitespace-nowrap font-display text-[2.1rem] font-black leading-none tabular-nums text-ember">{{ pkr(plan.group.perPerson) }}</span>
        <span class="text-sm text-ash">per person / month</span>
      </p>
      <dl class="mt-4 space-y-1.5 border-t border-ember/20 pt-4 text-sm">
        <div class="flex justify-between gap-3">
          <dt class="text-ash">Total for {{ plan.group.size }} people</dt>
          <dd class="font-semibold tabular-nums text-bone">{{ pkr(total) }} / month</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-ash">Each person saves</dt>
          <dd class="font-semibold tabular-nums text-bone">{{ pkr(saving) }} / month</dd>
        </div>
      </dl>
      <p v-if="plan.group.note" class="mt-3 flex items-center gap-2 text-sm text-bone">
        <AppIcon name="heart" class="h-4 w-4 shrink-0 text-ember" />{{ plan.group.note }}
      </p>
    </div>

    <div class="mt-auto flex gap-2 pt-7">
      <a
        href="#join"
        class="btn-molten btn-sheen inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full font-semibold text-ink"
        @click="emit('join', plan.slug)"
      >
        Join Now <AppIcon name="arrowRight" class="h-4 w-4" />
      </a>
      <a
        v-if="groupChat"
        :href="groupChat"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line text-bone transition-colors hover:border-ember hover:text-ember"
        :aria-label="`Ask about the ${plan.name} ${plan.group.label} on WhatsApp (opens WhatsApp)`"
      >
        <AppIcon name="whatsapp" class="h-5 w-5" />
      </a>
    </div>
  </article>
</template>
