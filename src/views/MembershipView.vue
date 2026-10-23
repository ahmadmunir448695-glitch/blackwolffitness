<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { membershipFaqs, programCatalog as programList } from '@/services/catalog.js'
import { media } from '@/data/media.js'
import { currency, personalServices, programMemberships, registrationFee } from '@/config/pricing.js'
import { formatPrice } from '@/utils/format.js'
import PageIntro from '@/components/shared/PageIntro.vue'
import ClubTimetable from '@/components/shared/ClubTimetable.vue'
import InquiryForm from '@/components/forms/InquiryForm.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FaqList from '@/components/ui/FaqList.vue'
import WhatsAppLink from '@/components/layout/WhatsAppLink.vue'
import ProgramPriceCard from '@/components/membership/ProgramPriceCard.vue'
import ServicePriceCard from '@/components/membership/ServicePriceCard.vue'

/** Program picked with a card's "Join Now", pre-selected in the trial form. */
const joinProgram = ref('')
</script>

<template>
  <div>
    <PageIntro
      title="Membership"
      eyebrow="Join the pack"
      lead="Clear monthly fees for Taekwondo, Boxing, MMA and General Fitness, group rates when three of you join together, and one-to-one personal or home training."
      :image="media.barbellClass"
    >
      <BaseButton href="#join" size="lg" icon-right="arrowRight">Join Now</BaseButton>
      <WhatsAppLink message="Hi Black Wolf Fitness Club, I would like to join. Could you help me choose a membership?" label="Ask on WhatsApp" />
    </PageIntro>

    <!-- Martial Arts & Fitness Membership -->
    <section v-reveal-auto class="py-16 lg:py-24" aria-labelledby="plans-title">
      <div class="site-container">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="eyebrow">Monthly membership</p>
            <h2 id="plans-title" class="mt-4 font-display text-title font-black uppercase">Martial Arts &amp; <span class="text-ember">Fitness</span></h2>
            <p class="mt-4 text-lg text-ash">One clear monthly fee per program. Join with two others and each of you pays the group rate.</p>
          </div>
          <div class="flex flex-col gap-2 self-start sm:flex-row lg:shrink-0 lg:flex-col lg:items-end lg:self-auto">
            <p class="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-ember/35 bg-ember/[0.06] px-4 py-2 text-sm text-bone">
              <AppIcon name="users" class="h-4 w-4 text-ember" /> Come as 3, save every month
            </p>
            <p class="inline-flex items-center gap-2.5 rounded-full border border-line bg-coal px-4 py-2 text-sm text-ash">
              <AppIcon name="info" class="h-4 w-4 text-ember" />
              <span>{{ registrationFee.label }}: <strong class="font-semibold text-bone">{{ formatPrice(registrationFee.amount, currency) }}</strong>, paid once</span>
            </p>
          </div>
        </div>

        <ul class="mt-10 grid gap-4 md:grid-cols-2">
          <li v-for="plan in programMemberships" :key="plan.slug">
            <ProgramPriceCard :plan="plan" @join="joinProgram = $event" />
          </li>
        </ul>
      </div>
    </section>

    <!-- Personal Training & Home Training -->
    <section v-reveal-auto class="border-t border-line py-16 lg:py-24" aria-labelledby="personal-title">
      <div class="site-container">
        <div class="max-w-2xl">
          <p class="eyebrow">One-to-one coaching</p>
          <h2 id="personal-title" class="mt-4 font-display text-title font-black uppercase">Personal &amp; Home <span class="text-ember">Training</span></h2>
          <p class="mt-4 text-lg text-ash">Train one-to-one with a coach at the club, or have your coach come to your home.</p>
        </div>
        <ul class="mt-10 grid gap-4 lg:grid-cols-2">
          <li v-for="(service, i) in personalServices" :key="service.id">
            <ServicePriceCard :service="service" :featured="i === 1" />
          </li>
        </ul>
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

    <!-- Club timings -->
    <section v-reveal-auto class="py-16 lg:py-24" aria-labelledby="schedule-title">
      <div class="site-container">
        <p class="eyebrow">Timetable</p>
        <h2 id="schedule-title" class="mt-4 font-display text-title font-black uppercase">Club timings</h2>
        <p class="mt-4 max-w-2xl text-lg text-ash">Evening classes for Taekwondo, Boxing and MMA, and one-to-one Special Kids (ADHD) sessions in the morning.</p>
        <ClubTimetable class="mt-10" />
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
        <InquiryForm variant="trial" heading="Trial session request" :initial-program="joinProgram" />
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
