<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useAsync } from '@/composables/useAsync.js'
import { membershipFaqs, programCatalog as programList, programName } from '@/services/catalog.js'
import { media } from '@/data/media.js'
import { formatPrice } from '@/utils/format.js'
import PageIntro from '@/components/shared/PageIntro.vue'
import ScheduleTable from '@/components/shared/ScheduleTable.vue'
import InquiryForm from '@/components/forms/InquiryForm.vue'
import AsyncState from '@/components/ui/AsyncState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FaqList from '@/components/ui/FaqList.vue'
import WhatsAppLink from '@/components/layout/WhatsAppLink.vue'

const plans = useAsync(({ signal }) => api.memberships.listPlans({ signal }), { initial: [] })
const schedule = useAsync(({ signal }) => api.schedule.list({}, { signal }), { initial: [] })

const anyPlaceholder = computed(() => (plans.data.value ?? []).some((p) => p.placeholder || p.price === null))
const periodLabel = (period) => (period ? `per ${period}` : '')
</script>

<template>
  <div>
    <PageIntro
      title="Membership"
      eyebrow="Join the pack"
      lead="Choose how you want to train, see what is included, and start with a trial session. The club will confirm current prices and timings with you directly."
      :image="media.barbellClass"
    >
      <BaseButton href="#join" size="lg" icon-right="arrowRight">Join Now</BaseButton>
      <WhatsAppLink message="Hi Black Wolf Fitness Club, could you share your membership plans and prices?" label="Ask about prices" />
    </PageIntro>

    <!-- Plans -->
    <section v-reveal-auto class="py-16 lg:py-24" aria-labelledby="plans-title">
      <div class="site-container">
        <h2 id="plans-title" class="font-display text-title font-black uppercase">Membership plans</h2>

        <p v-if="anyPlaceholder" class="mt-5 flex max-w-3xl gap-2.5 border border-dashed border-ember/50 p-4 text-ash">
          <AppIcon name="info" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
          Plans and prices are being finalised. Contact the club for current options and fees.
        </p>

        <AsyncState class="mt-10" :loading="plans.loading.value" :error="plans.error.value" :empty="!plans.data.value?.length" error-title="Membership plans could not load" @retry="plans.reload">
          <template #loading>
            <div class="grid gap-px bg-line md:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
              <div v-for="n in 4" :key="n" class="skeleton h-96" />
            </div>
          </template>
          <template #empty>
            <p class="border border-dashed border-line p-8 text-ash">Membership plans will be published soon. Message the club for details.</p>
          </template>

          <ul class="grid gap-px border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
            <li
              v-for="plan in plans.data.value"
              :key="plan.id"
              class="relative flex flex-col p-7"
              :class="plan.highlight ? 'bg-coal' : 'bg-ink'"
            >
              <span v-if="plan.highlight" class="absolute inset-x-0 top-0 h-1 bg-ember" aria-hidden="true" />
              <h3 class="font-display text-3xl font-black uppercase leading-none">{{ plan.name }}</h3>
              <p class="mt-3 min-h-[3rem] text-ash">{{ plan.summary }}</p>

              <p class="mt-6 border-y border-line py-5">
                <template v-if="plan.price !== null">
                  <span class="font-display text-5xl font-black text-bone">{{ formatPrice(plan.price, plan.currency) }}</span>
                  <span class="ml-1 text-ash">{{ periodLabel(plan.period) }}</span>
                </template>
                <template v-else>
                  <span class="font-display text-3xl font-black text-bone">Price on request</span>
                  <span class="mt-1 block text-sm text-smoke">{{ plan.period === 'month' ? 'Monthly fee' : `Fee ${periodLabel(plan.period)}` }}, to be confirmed</span>
                </template>
              </p>

              <ul v-if="plan.otherPrices?.length" class="mt-4 space-y-1 text-sm">
                <li v-for="row in plan.otherPrices" :key="row.label" class="flex justify-between gap-4">
                  <span class="text-ash">{{ row.label }}</span>
                  <span class="text-bone">{{ row.price !== null ? formatPrice(row.price, plan.currency) : 'Ask us' }}</span>
                </li>
              </ul>

              <h4 class="mt-6 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ash">Includes</h4>
              <ul class="mt-2 space-y-2 text-[0.95rem]">
                <li v-for="item in plan.inclusions" :key="item" class="flex gap-2.5">
                  <AppIcon name="check" class="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                  <span>{{ item }}</span>
                </li>
              </ul>

              <h4 class="mt-6 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ash">Programs</h4>
              <p class="mt-2 text-sm text-ash">{{ plan.programs.map(programName).join(', ') }}</p>

              <div class="mt-auto pt-8">
                <BaseButton href="#join" :variant="plan.highlight ? 'primary' : 'outline'" block>Join Now</BaseButton>
              </div>
            </li>
          </ul>
        </AsyncState>
      </div>
    </section>

    <!-- Program categories -->
    <section v-reveal-auto class="border-t border-line bg-ink py-16 lg:py-24" aria-labelledby="categories-title">
      <div class="site-container grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <h2 id="categories-title" class="font-display text-title font-black uppercase">Program categories</h2>
          <p class="mt-4 max-w-md text-lg text-ash">Every plan is built from these programs. Read about each one before you choose.</p>
        </div>
        <ul class="grid gap-px bg-line sm:grid-cols-2">
          <li v-for="program in programList" :key="program.slug" class="bg-coal sm:[&:last-child:nth-child(odd)]:col-span-2">
            <RouterLink :to="`/services/${program.slug}`" class="group flex h-full items-start justify-between gap-4 p-5 transition-colors hover:bg-iron">
              <span>
                <span class="block font-display text-2xl font-bold uppercase leading-none" :class="program.featured ? 'text-ember' : 'text-bone'">{{ program.shortName ?? program.name }}</span>
                <span class="mt-2 block text-sm text-ash">{{ program.tagline }}</span>
              </span>
              <AppIcon name="arrowRight" class="mt-1 h-5 w-5 shrink-0 text-smoke group-hover:text-ember" />
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- Schedule -->
    <section v-reveal-auto class="py-16 lg:py-24" aria-labelledby="schedule-title">
      <div class="site-container">
        <h2 id="schedule-title" class="font-display text-title font-black uppercase">Class schedule</h2>
        <AsyncState class="mt-8" :loading="schedule.loading.value" :error="schedule.error.value" :empty="!schedule.data.value?.length" error-title="The schedule could not load" @retry="schedule.reload">
          <template #loading><div class="skeleton h-48" aria-hidden="true" /></template>
          <template #empty>
            <p class="flex max-w-3xl items-start gap-3 border border-dashed border-line p-6 text-ash">
              <AppIcon name="clock" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
              The class timetable is being finalised. Request a trial below and the club will share the times that suit you.
            </p>
          </template>
          <ScheduleTable :classes="schedule.data.value" show-program />
        </AsyncState>
      </div>
    </section>

    <!-- Trial / join -->
    <section id="join" v-reveal-auto class="scroll-mt-24 border-t border-line bg-ink py-16 lg:py-24" aria-labelledby="join-title">
      <div class="site-container grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <h2 id="join-title" class="font-display text-display font-black uppercase">Request a trial session</h2>
          <p class="mt-5 max-w-md text-lg leading-relaxed text-ash">
            The easiest way to join is to try a class first. Tell us which program interests you and when you are free, and the club will confirm a time.
          </p>
          <p class="mt-6 text-ash">
            Asking for a child who needs individualized support?
            <RouterLink :to="{ path: '/contact', query: { topic: 'parent' } }" class="link-ember">Send a parent inquiry</RouterLink>.
          </p>
        </div>
        <InquiryForm variant="trial" heading="Trial session request" />
      </div>
    </section>

    <!-- FAQ -->
    <section v-reveal-auto class="py-16 lg:py-24" aria-labelledby="mfaq-title">
      <div class="site-container grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <h2 id="mfaq-title" class="font-display text-title font-black uppercase">Membership questions</h2>
        <FaqList :items="membershipFaqs" />
      </div>
    </section>
  </div>
</template>
