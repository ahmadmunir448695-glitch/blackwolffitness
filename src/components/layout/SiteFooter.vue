<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BrandLogo from '../brand/BrandLogo.vue'
import AppIcon from '../ui/AppIcon.vue'
import PlaceholderText from '../ui/PlaceholderText.vue'
import WhatsAppLink from './WhatsAppLink.vue'
import { club, socialLabels } from '@/config/club.js'
import { programLinks } from '@/config/navigation.js'
import { telHref } from '@/utils/format.js'

const year = new Date().getFullYear()

/** "https://www.tiktok.com/@blackwolffitness" → "@blackwolffitness" */
function handleFrom(url) {
  const last = String(url).replace(/\/+$/, '').split('/').pop() ?? ''
  return last ? `@${last.replace(/^@/, '')}` : ''
}

const socials = computed(() =>
  Object.entries(club.socials)
    .filter(([, url]) => url)
    .map(([key, url]) => ({ key, url, label: socialLabels[key] ?? key, handle: handleFrom(url) })),
)

/** Big contact cards: only the channels the club has filled in. */
const contactCards = computed(() => [
  club.contact.phone && { key: 'phone', icon: 'phone', label: 'Call us', value: club.contact.phone, href: telHref(club.contact.phone) },
  club.contact.phoneAlt && { key: 'phone-alt', icon: 'phone', label: 'Call us', value: club.contact.phoneAlt, href: telHref(club.contact.phoneAlt) },
  club.contact.email && { key: 'mail', icon: 'mail', label: 'Email us', value: club.contact.email, href: `mailto:${club.contact.email}` },
  ...socials.value.map((s) => ({ key: s.key, icon: s.key, label: s.label, value: s.handle, href: s.url, external: true })),
].filter(Boolean))

const address = computed(() => [...club.location.addressLines, club.location.city].filter(Boolean))

const clubLinks = [
  { label: 'About us', to: '/about' },
  { label: 'Coaches', to: '/coaches' },
  { label: 'Membership', to: '/membership' },
  { label: 'Book a trial', to: { path: '/contact', query: { topic: 'trial' } } },
  { label: 'Contact us', to: '/contact' },
]

function toTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}
</script>

<template>
  <footer class="relative isolate overflow-hidden border-t border-line bg-coal">
    <div class="glow-ember pointer-events-none absolute -bottom-72 left-1/2 -z-10 h-[36rem] w-[60rem] -translate-x-1/2 opacity-40" aria-hidden="true" />
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/60 to-transparent" aria-hidden="true" />

    <div class="site-container pt-16 lg:pt-20">
      <!-- Brand row -->
      <div class="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <RouterLink to="/" aria-label="Black Wolf Fitness Club, home" class="inline-block">
            <BrandLogo size="lg" />
          </RouterLink>
          <p class="mt-5 flex items-center gap-3 font-display text-xl font-bold uppercase tracking-[0.18em] text-ash">
            <span>Train</span><span class="h-1.5 w-1.5 rotate-45 bg-ember" aria-hidden="true" />
            <span>Fight</span><span class="h-1.5 w-1.5 rotate-45 bg-ember" aria-hidden="true" />
            <span>Grow</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <WhatsAppLink />
          <RouterLink
            :to="{ path: '/contact', query: { topic: 'trial' } }"
            class="btn-sheen cut-corner inline-flex h-12 items-center gap-2 bg-ember px-6 font-semibold text-ink transition-colors hover:bg-ember-hi"
          >
            Book a trial session
            <AppIcon name="arrowRight" class="h-4 w-4" />
          </RouterLink>
        </div>
      </div>

      <!-- Contact cards -->
      <ul
        v-if="contactCards.length"
        class="mt-12 grid gap-3 sm:grid-cols-2"
        :class="contactCards.length === 5 ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4'"
        aria-label="Contact the club"
      >
        <li v-for="card in contactCards" :key="card.key">
          <a
            :href="card.href"
            :target="card.external ? '_blank' : undefined"
            :rel="card.external ? 'noopener noreferrer' : undefined"
            class="group flex h-full items-center gap-4 border border-line bg-ink/50 p-4 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-ember/60 hover:bg-ink"
          >
            <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ember/40 text-ember transition-colors duration-300 group-hover:bg-ember group-hover:text-ink">
              <AppIcon :name="card.icon" class="h-5 w-5" />
            </span>
            <span class="min-w-0">
              <span class="block text-xs font-semibold uppercase tracking-[0.16em] text-smoke">{{ card.label }}</span>
              <span class="mt-0.5 block font-semibold text-bone transition-colors [overflow-wrap:anywhere] group-hover:text-ember">
                <template v-if="card.key === 'mail' && card.value.includes('@')">{{ card.value.split('@')[0] }}<wbr />@{{ card.value.split('@')[1] }}</template>
                <template v-else>{{ card.value }}</template>
              </span>
            </span>
            <AppIcon name="arrowRight" class="ml-auto h-4 w-4 shrink-0 -rotate-45 text-smoke transition-all duration-300 group-hover:rotate-0 group-hover:text-ember" />
            <span v-if="card.external" class="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      </ul>

      <!-- Link columns -->
      <div class="mt-14 grid gap-10 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.2fr]">
        <nav aria-labelledby="footer-programs">
          <h2 id="footer-programs" class="eyebrow">Programs</h2>
          <ul class="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <li v-for="link in programLinks" :key="link.to">
              <RouterLink
                :to="link.to"
                class="group inline-flex items-center transition-colors hover:text-bone"
                :class="link.featured ? 'text-ember' : 'text-ash'"
              >
                <span class="h-px w-0 bg-ember transition-all duration-300 group-hover:mr-2 group-hover:w-4" aria-hidden="true" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-club">
          <h2 id="footer-club" class="eyebrow">Club</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="link in clubLinks" :key="link.label">
              <RouterLink :to="link.to" class="group inline-flex items-center text-ash transition-colors hover:text-bone">
                <span class="h-px w-0 bg-ember transition-all duration-300 group-hover:mr-2 group-hover:w-4" aria-hidden="true" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div class="sm:col-span-2 lg:col-span-1">
          <h2 class="eyebrow">Visit</h2>
          <div class="mt-5 space-y-5">
            <div class="flex items-start gap-3">
              <AppIcon name="pin" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
              <address class="not-italic text-ash">
                <template v-if="address.length">
                  <span v-for="line in address" :key="line" class="block">{{ line }}</span>
                </template>
                <PlaceholderText v-else fallback="Address to be announced" hint="location in src/config/club.js" />
              </address>
            </div>
            <div class="flex items-start gap-3">
              <AppIcon name="clock" class="mt-0.5 h-5 w-5 shrink-0 text-ember" />
              <ul v-if="club.hours.length" class="space-y-1 text-ash">
                <li v-for="row in club.hours" :key="row.days"><span class="text-bone">{{ row.days }}</span> · {{ row.hours }}</li>
              </ul>
              <p v-else class="text-ash"><PlaceholderText fallback="Opening hours to be announced" hint="hours in src/config/club.js" /></p>
            </div>
            <a
              v-if="club.location.mapLink"
              :href="club.location.mapLink"
              target="_blank"
              rel="noopener noreferrer"
              class="link-ember inline-block text-sm font-semibold"
            >Get directions<span class="sr-only"> (opens in a new tab)</span></a>
          </div>
        </div>
      </div>
    </div>

    <!-- Giant wordmark -->
    <div class="pointer-events-none mt-12 select-none overflow-hidden" aria-hidden="true">
      <p v-reveal="'up'" class="text-outline whitespace-nowrap text-center font-display text-[17.5vw] font-black uppercase leading-[0.78] text-bone/15">
        Black Wolf
      </p>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-line bg-ink/40">
      <div class="site-container flex flex-col gap-4 py-5 text-sm text-smoke sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ year }} {{ club.name }}. All rights reserved.</p>
        <p class="hidden lg:block">{{ club.tagline }}</p>
        <button
          type="button"
          class="group inline-flex items-center gap-2 self-start font-semibold text-ash transition-colors hover:text-ember sm:self-auto"
          @click="toTop"
        >
          Back to top
          <span class="flex h-8 w-8 items-center justify-center border border-line transition-colors group-hover:border-ember">
            <AppIcon name="arrowRight" class="h-4 w-4 -rotate-90 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </span>
        </button>
      </div>
    </div>
  </footer>
</template>
